/**
 * Boundary Editor (Phase A1 — Commit-Governed Boundary Editing)
 *
 * Provides draft geometry editing, canonical GeoJSON representation,
 * geometry hash computation, and PROPOSE/COMMIT integration for
 * boundary modifications under canon rails.
 *
 * DOES:
 * - Maintain draft geometry state (non-mutating until committed)
 * - Validate geometry (ring closure, NaN guard, min vertex count)
 * - Compute canonical geometry hash (deterministic JSON -> fnv1a)
 * - Generate PROPOSE artifact with geometryHash
 * - Verify geometryHash on COMMIT
 * - Emit refusal logs for invalid geometry / hash mismatch / scope violation
 *
 * DOES NOT:
 * - Modify live boundary state without COMMIT
 * - Bypass scope enforcement
 * - Auto-commit without explicit user action
 *
 * Spec: docs/architecture/RELAY-MASTER-BUILD-PLAN.md (Section 1)
 */

import { RelayLog } from '../../core/utils/relay-log.js';

/* ── Canonical JSON for deterministic hashing ── */
const canonicalizeGeoJSON = (geojson) => {
    const sortKeys = (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(sortKeys);
        const sorted = {};
        for (const key of Object.keys(obj).sort()) {
            sorted[key] = sortKeys(obj[key]);
        }
        return sorted;
    };
    return JSON.stringify(sortKeys(geojson));
};

/* ── FNV-1a hash (same as relay-cesium-world.html) ── */
const fnv1aHex = (value) => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return `0x${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

/* ── Editor states ── */
const EDITOR_STATES = Object.freeze({
    IDLE: 'IDLE',
    DRAFTING: 'DRAFTING',
    PROPOSED: 'PROPOSED',
    COMMITTED: 'COMMITTED'
});

/* ── Validation helpers ── */
const MIN_VERTICES = 3;

const validateCoordinate = (coord) => {
    if (!Array.isArray(coord) || coord.length < 2) return false;
    const [lon, lat] = coord;
    return Number.isFinite(lon) && Number.isFinite(lat) &&
           lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
};

const validateRing = (ring) => {
    if (!Array.isArray(ring) || ring.length < MIN_VERTICES) {
        return { ok: false, reason: 'INSUFFICIENT_VERTICES', count: ring?.length || 0, minimum: MIN_VERTICES };
    }
    for (let i = 0; i < ring.length; i++) {
        if (!validateCoordinate(ring[i])) {
            return { ok: false, reason: 'INVALID_COORDINATE', index: i, coord: ring[i] };
        }
    }
    return { ok: true };
};

const closeRing = (ring) => {
    if (!Array.isArray(ring) || ring.length < MIN_VERTICES) return ring;
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
        return [...ring, [first[0], first[1]]];
    }
    return ring;
};

export class BoundaryEditor {
    /**
     * @param {Cesium.Viewer} viewer - Cesium viewer instance
     * @param {Object} boundaryRenderer - BoundaryRenderer for live boundary access
     * @param {Object} options - Configuration
     * @param {Function} options.getRelayState - Returns current relay state
     * @param {Function} options.getScopeManager - Returns Restore3ScopeManager (or null)
     */
    constructor(viewer, boundaryRenderer, options = {}) {
        this.viewer = viewer;
        this.boundaryRenderer = boundaryRenderer;
        this.getRelayState = options.getRelayState || (() => ({}));
        this.getScopeManager = options.getScopeManager || (() => null);

        /* Draft state */
        this.editorState = EDITOR_STATES.IDLE;
        this.draftVertices = [];         // [[lon, lat], ...]
        this.draftTargetCode = null;     // e.g. 'ISR', 'USA', or custom scope ID
        this.draftScopeRef = null;       // scope reference for COMMIT gate
        this.draftLabel = '';            // human-readable label

        /* Proposal state */
        this.currentProposal = null;     // { proposalId, geometryHash, geojson, ... }

        /* Commit history */
        this.commitHistory = [];         // committed boundary proposals

        /* Cesium visualization entities */
        this.draftEntities = [];
        this.previewEntity = null;

        /* Click handler reference */
        this._clickHandler = null;

        RelayLog.info('[BOUNDARY-EDITOR] Initialized');
    }

    /* ══════════════════════════════════════════════════════
       DRAFT OPERATIONS (non-mutating)
       ══════════════════════════════════════════════════════ */

    /**
     * Start drafting a new boundary.
     * @param {string} targetCode - Boundary target identifier
     * @param {Object} scopeRef - Scope reference for governance
     * @param {string} label - Human-readable label
     */
    startDraft(targetCode, scopeRef = null, label = '') {
        if (this.editorState !== EDITOR_STATES.IDLE && this.editorState !== EDITOR_STATES.COMMITTED) {
            RelayLog.warn(`[REFUSAL] reason=BOUNDARY_DRAFT_STATE_VIOLATION currentState=${this.editorState}`);
            return { ok: false, reason: 'BOUNDARY_DRAFT_STATE_VIOLATION', currentState: this.editorState };
        }
        this.editorState = EDITOR_STATES.DRAFTING;
        this.draftVertices = [];
        this.draftTargetCode = String(targetCode || '').trim();
        this.draftScopeRef = scopeRef ? { ...scopeRef } : null;
        this.draftLabel = String(label || '').trim();
        this.currentProposal = null;
        this._clearDraftVisualization();
        RelayLog.info(`[BOUNDARY] draft-start target=${this.draftTargetCode} scope=${JSON.stringify(this.draftScopeRef)}`);
        return { ok: true, state: this.editorState, target: this.draftTargetCode };
    }

    /**
     * Add a vertex to the draft boundary.
     * @param {number} lon - Longitude
     * @param {number} lat - Latitude
     */
    addVertex(lon, lat) {
        if (this.editorState !== EDITOR_STATES.DRAFTING) {
            RelayLog.warn(`[REFUSAL] reason=BOUNDARY_NOT_DRAFTING currentState=${this.editorState}`);
            return { ok: false, reason: 'BOUNDARY_NOT_DRAFTING' };
        }
        if (!Number.isFinite(lon) || !Number.isFinite(lat) ||
            lon < -180 || lon > 180 || lat < -90 || lat > 90) {
            RelayLog.warn(`[REFUSAL] reason=BOUNDARY_INVALID_COORDINATE lon=${lon} lat=${lat}`);
            return { ok: false, reason: 'BOUNDARY_INVALID_COORDINATE' };
        }
        this.draftVertices.push([lon, lat]);
        this._renderDraftVisualization();
        return { ok: true, vertices: this.draftVertices.length };
    }

    /**
     * Remove the last vertex from the draft.
     */
    undoVertex() {
        if (this.editorState !== EDITOR_STATES.DRAFTING) {
            return { ok: false, reason: 'BOUNDARY_NOT_DRAFTING' };
        }
        if (this.draftVertices.length === 0) {
            return { ok: false, reason: 'NO_VERTICES_TO_UNDO' };
        }
        this.draftVertices.pop();
        this._renderDraftVisualization();
        return { ok: true, vertices: this.draftVertices.length };
    }

    /**
     * Update a specific vertex position.
     * @param {number} index - Vertex index
     * @param {number} lon - New longitude
     * @param {number} lat - New latitude
     */
    updateVertex(index, lon, lat) {
        if (this.editorState !== EDITOR_STATES.DRAFTING) {
            return { ok: false, reason: 'BOUNDARY_NOT_DRAFTING' };
        }
        if (index < 0 || index >= this.draftVertices.length) {
            return { ok: false, reason: 'VERTEX_INDEX_OUT_OF_RANGE' };
        }
        if (!Number.isFinite(lon) || !Number.isFinite(lat) ||
            lon < -180 || lon > 180 || lat < -90 || lat > 90) {
            return { ok: false, reason: 'BOUNDARY_INVALID_COORDINATE' };
        }
        this.draftVertices[index] = [lon, lat];
        this._renderDraftVisualization();
        return { ok: true, vertices: this.draftVertices.length };
    }

    /**
     * Cancel the current draft/proposal and return to IDLE.
     * Safe to call from any state.
     */
    cancelDraft() {
        const previous = this.editorState;
        this._clearDraftVisualization();
        this.editorState = EDITOR_STATES.IDLE;
        this.draftVertices = [];
        this.draftTargetCode = null;
        this.draftScopeRef = null;
        this.draftLabel = '';
        this.currentProposal = null;
        if (previous !== EDITOR_STATES.IDLE) {
            RelayLog.info(`[BOUNDARY] draft-cancel previous=${previous}`);
        }
        return { ok: true, state: this.editorState };
    }

    /**
     * Get the current draft state.
     */
    getDraftState() {
        return {
            editorState: this.editorState,
            targetCode: this.draftTargetCode,
            scopeRef: this.draftScopeRef ? { ...this.draftScopeRef } : null,
            label: this.draftLabel,
            vertices: this.draftVertices.length,
            vertexList: this.draftVertices.map(v => [...v]),
            currentProposal: this.currentProposal ? {
                proposalId: this.currentProposal.proposalId,
                geometryHash: this.currentProposal.geometryHash,
                vertices: this.currentProposal.vertices
            } : null,
            commitCount: this.commitHistory.length
        };
    }

    /* ══════════════════════════════════════════════════════
       PROPOSE (generates artifact with geometryHash)
       ══════════════════════════════════════════════════════ */

    /**
     * Generate a PROPOSE artifact from the current draft.
     * This does NOT mutate any live state.
     * @param {Object} meta - Proposal metadata
     * @param {string} meta.user - Proposing user
     * @param {string} meta.summary - Proposal summary text
     */
    propose(meta = {}) {
        if (this.editorState !== EDITOR_STATES.DRAFTING) {
            RelayLog.warn(`[REFUSAL] reason=BOUNDARY_PROPOSE_STATE_VIOLATION currentState=${this.editorState}`);
            return { ok: false, reason: 'BOUNDARY_PROPOSE_STATE_VIOLATION', currentState: this.editorState };
        }

        /* Validate geometry */
        const validation = this.validateDraftGeometry();
        if (!validation.ok) {
            RelayLog.warn(`[REFUSAL] reason=BOUNDARY_INVALID_GEOMETRY detail=${validation.reason}`);
            return { ok: false, reason: 'BOUNDARY_INVALID_GEOMETRY', detail: validation.reason };
        }

        /* Build canonical GeoJSON */
        const geojson = this._buildCanonicalGeoJSON();
        const canonicalJson = canonicalizeGeoJSON(geojson);
        const geometryHash = fnv1aHex(canonicalJson);

        /* Generate proposal ID */
        const proposalId = `BOUNDARY-PROP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const proposal = {
            proposalId,
            geometryHash,
            geojson,
            canonicalJson,
            targetCode: this.draftTargetCode,
            scopeRef: this.draftScopeRef ? { ...this.draftScopeRef } : null,
            label: this.draftLabel,
            vertices: this.draftVertices.length,
            user: String(meta.user || 'local'),
            summary: String(meta.summary || `Boundary proposal for ${this.draftTargetCode}`).slice(0, 240),
            proposedAt: new Date().toISOString()
        };

        this.currentProposal = proposal;
        this.editorState = EDITOR_STATES.PROPOSED;

        RelayLog.info(`[BOUNDARY] propose proposalId=${proposalId} target=${this.draftTargetCode} vertices=${this.draftVertices.length} geometryHash=${geometryHash}`);
        return { ok: true, proposalId, geometryHash, vertices: this.draftVertices.length };
    }

    /* ══════════════════════════════════════════════════════
       COMMIT (verifies geometryHash + scope)
       ══════════════════════════════════════════════════════ */

    /**
     * Commit the current proposal.
     * Verifies geometry hash and scope before materializing.
     * @param {Object} meta - Commit metadata
     * @param {string} meta.evidenceHash - Evidence hash to verify
     * @param {string} meta.user - Committing user
     */
    commit(meta = {}) {
        if (this.editorState !== EDITOR_STATES.PROPOSED || !this.currentProposal) {
            RelayLog.warn(`[REFUSAL] reason=BOUNDARY_COMMIT_NO_PROPOSAL currentState=${this.editorState}`);
            return { ok: false, reason: 'BOUNDARY_COMMIT_NO_PROPOSAL', currentState: this.editorState };
        }

        const proposal = this.currentProposal;

        /* Re-validate geometry (safety) */
        const validation = this.validateDraftGeometry();
        if (!validation.ok) {
            RelayLog.warn(`[REFUSAL] reason=BOUNDARY_INVALID_GEOMETRY_ON_COMMIT detail=${validation.reason}`);
            return { ok: false, reason: 'BOUNDARY_INVALID_GEOMETRY_ON_COMMIT', detail: validation.reason };
        }

        /* Re-compute and verify geometry hash */
        const geojson = this._buildCanonicalGeoJSON();
        const canonicalJson = canonicalizeGeoJSON(geojson);
        const recomputedHash = fnv1aHex(canonicalJson);

        if (recomputedHash !== proposal.geometryHash) {
            RelayLog.warn(`[REFUSAL] reason=BOUNDARY_HASH_MISMATCH expected=${proposal.geometryHash} actual=${recomputedHash}`);
            return {
                ok: false,
                reason: 'BOUNDARY_HASH_MISMATCH',
                expected: proposal.geometryHash,
                actual: recomputedHash
            };
        }

        /* Scope enforcement */
        const scopeManager = this.getScopeManager();
        if (scopeManager && this.draftScopeRef) {
            const scopeCheck = scopeManager.assertCommitScope({
                scopeRef: this.draftScopeRef,
                targetRef: { id: this.draftTargetCode, type: 'boundary' }
            });
            if (!scopeCheck.ok) {
                RelayLog.warn(`[REFUSAL] reason=BOUNDARY_SCOPE_VIOLATION proposalScope=${scopeCheck.proposalScope || 'unknown'} selectedScope=${scopeCheck.selectedScope || 'unknown'}`);
                return {
                    ok: false,
                    reason: 'BOUNDARY_SCOPE_VIOLATION',
                    proposalScope: scopeCheck.proposalScope,
                    selectedScope: scopeCheck.selectedScope
                };
            }
        }

        /* Materialize commit */
        const commitId = `BOUNDARY-COMMIT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const receipt = {
            commitId,
            proposalId: proposal.proposalId,
            geometryHash: proposal.geometryHash,
            targetCode: proposal.targetCode,
            scopeRef: proposal.scopeRef ? { ...proposal.scopeRef } : null,
            label: proposal.label,
            vertices: proposal.vertices,
            geojson: proposal.geojson,
            user: String(meta.user || proposal.user || 'local'),
            committedAt: new Date().toISOString()
        };

        this.commitHistory.push(receipt);
        this.editorState = EDITOR_STATES.COMMITTED;
        this._clearDraftVisualization();

        /* Store globally for proof access */
        if (!Array.isArray(window.__relayBoundaryCommits)) {
            window.__relayBoundaryCommits = [];
        }
        window.__relayBoundaryCommits.push(receipt);

        RelayLog.info(`[BOUNDARY] commit commitId=${commitId} proposalId=${proposal.proposalId} geometryHash=${proposal.geometryHash} target=${proposal.targetCode}`);
        return {
            ok: true,
            commitId,
            proposalId: proposal.proposalId,
            geometryHash: proposal.geometryHash
        };
    }

    /* ══════════════════════════════════════════════════════
       VALIDATION
       ══════════════════════════════════════════════════════ */

    /**
     * Validate the current draft geometry.
     */
    validateDraftGeometry() {
        if (this.draftVertices.length < MIN_VERTICES) {
            return {
                ok: false,
                reason: 'INSUFFICIENT_VERTICES',
                count: this.draftVertices.length,
                minimum: MIN_VERTICES
            };
        }

        const ringValidation = validateRing(this.draftVertices);
        if (!ringValidation.ok) {
            return ringValidation;
        }

        /* Check for self-intersection (basic: no two non-adjacent edges cross) */
        /* For v1, we skip complex intersection detection and rely on vertex count */

        return { ok: true, vertices: this.draftVertices.length };
    }

    /* ══════════════════════════════════════════════════════
       GEOMETRY HASHING
       ══════════════════════════════════════════════════════ */

    /**
     * Compute geometry hash for an arbitrary GeoJSON Feature.
     * @param {Object} geojson - GeoJSON Feature
     * @returns {string} fnv1a hex hash
     */
    static computeGeometryHash(geojson) {
        return fnv1aHex(canonicalizeGeoJSON(geojson));
    }

    /* ══════════════════════════════════════════════════════
       INTERNAL HELPERS
       ══════════════════════════════════════════════════════ */

    _buildCanonicalGeoJSON() {
        const closedRing = closeRing(this.draftVertices.map(v => [v[0], v[1]]));
        // NOTE: Only geometry-stable fields are included in the canonical hash payload.
        // Timestamps and labels are stored on the proposal/commit receipt, NOT hashed.
        return {
            type: 'Feature',
            properties: {
                relayType: 'boundary-proposal',
                targetCode: this.draftTargetCode || ''
            },
            geometry: {
                type: 'Polygon',
                coordinates: [closedRing]
            }
        };
    }

    _clearDraftVisualization() {
        if (!this.viewer?.entities) return;
        for (const entity of this.draftEntities) {
            try { this.viewer.entities.remove(entity); } catch { /* ignore */ }
        }
        this.draftEntities = [];
        if (this.previewEntity) {
            try { this.viewer.entities.remove(this.previewEntity); } catch { /* ignore */ }
            this.previewEntity = null;
        }
    }

    _renderDraftVisualization() {
        this._clearDraftVisualization();
        if (!this.viewer?.entities || this.draftVertices.length === 0) return;

        /* Render vertex markers */
        for (let i = 0; i < this.draftVertices.length; i++) {
            const [lon, lat] = this.draftVertices[i];
            try {
                const e = this.viewer.entities.add({
                    id: `boundary-draft-vertex-${i}`,
                    position: Cesium.Cartesian3.fromDegrees(lon, lat, 50),
                    point: {
                        pixelSize: 8,
                        color: Cesium.Color.YELLOW.withAlpha(0.9),
                        outlineWidth: 1,
                        outlineColor: Cesium.Color.BLACK.withAlpha(0.9)
                    },
                    label: {
                        text: `V${i}`,
                        font: '10px sans-serif',
                        pixelOffset: new Cesium.Cartesian2(0, -14),
                        showBackground: true,
                        backgroundColor: Cesium.Color.BLACK.withAlpha(0.4),
                        fillColor: Cesium.Color.YELLOW
                    }
                });
                this.draftEntities.push(e);
            } catch { /* fail-soft */ }
        }

        /* Render draft polygon preview (translucent) */
        if (this.draftVertices.length >= MIN_VERTICES) {
            const closedRing = closeRing(this.draftVertices.map(v => [v[0], v[1]]));
            const positions = closedRing.map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1], 20));
            try {
                this.previewEntity = this.viewer.entities.add({
                    id: 'boundary-draft-preview',
                    polygon: {
                        hierarchy: positions,
                        material: Cesium.Color.YELLOW.withAlpha(0.15),
                        outline: true,
                        outlineColor: Cesium.Color.YELLOW.withAlpha(0.8)
                    }
                });
            } catch { /* fail-soft */ }
        }

        /* Render connecting polyline */
        if (this.draftVertices.length >= 2) {
            const linePositions = this.draftVertices.map(v => Cesium.Cartesian3.fromDegrees(v[0], v[1], 30));
            try {
                const lineEntity = this.viewer.entities.add({
                    id: 'boundary-draft-line',
                    polyline: {
                        positions: linePositions,
                        width: 2,
                        material: Cesium.Color.YELLOW.withAlpha(0.7),
                        arcType: Cesium.ArcType.GEODESIC,
                        clampToGround: false
                    }
                });
                this.draftEntities.push(lineEntity);
            } catch { /* fail-soft */ }
        }
    }

    /**
     * Get commit history for inspection/proof.
     */
    getCommitHistory() {
        return this.commitHistory.map(c => ({
            commitId: c.commitId,
            proposalId: c.proposalId,
            geometryHash: c.geometryHash,
            targetCode: c.targetCode,
            vertices: c.vertices,
            committedAt: c.committedAt
        }));
    }

    /**
     * Enable Cesium click-to-add-vertex mode.
     * @param {Cesium.ScreenSpaceEventHandler} handler - Event handler
     */
    enableClickMode(handler) {
        if (this._clickHandler) {
            this.disableClickMode();
        }
        this._clickHandler = handler;
        handler.setInputAction((click) => {
            if (this.editorState !== EDITOR_STATES.DRAFTING) return;
            const ray = this.viewer.camera.getPickRay(click.position);
            if (!ray) return;
            const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
            if (!cartesian) return;
            const carto = Cesium.Cartographic.fromCartesian(cartesian);
            const lon = Cesium.Math.toDegrees(carto.longitude);
            const lat = Cesium.Math.toDegrees(carto.latitude);
            this.addVertex(lon, lat);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    /**
     * Disable click-to-add-vertex mode.
     */
    disableClickMode() {
        if (this._clickHandler) {
            try {
                this._clickHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            } catch { /* ignore */ }
            this._clickHandler = null;
        }
    }

    /**
     * Clean up all resources.
     */
    destroy() {
        this.disableClickMode();
        this._clearDraftVisualization();
        this.editorState = EDITOR_STATES.IDLE;
    }
}
