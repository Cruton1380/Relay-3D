import { RelayLog } from '../../core/utils/relay-log.js';

const DEFAULT_FIXTURE_PATH = 'app/cesium/fixtures/restore3-geo-fixture.json';
const LEVELS = Object.freeze(['country', 'region', 'site']);

const centroidFromRing = (ring) => {
    if (!Array.isArray(ring) || ring.length === 0) return { lon: 0, lat: 0 };
    let lon = 0;
    let lat = 0;
    for (const p of ring) {
        lon += Number(p?.[0] || 0);
        lat += Number(p?.[1] || 0);
    }
    return { lon: lon / ring.length, lat: lat / ring.length };
};

const pointInRing = (lon, lat, ring) => {
    if (!Array.isArray(ring) || ring.length < 3) return false;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = Number(ring[i][0]);
        const yi = Number(ring[i][1]);
        const xj = Number(ring[j][0]);
        const yj = Number(ring[j][1]);
        const intersects = ((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || 1e-12) + xi);
        if (intersects) inside = !inside;
    }
    return inside;
};

export class Restore3ScopeManager {
    constructor(viewer, getRelayState) {
        this.viewer = viewer;
        this.getRelayState = getRelayState;
        this.fixture = null;
        this.levelIndex = new Map();
        this.overlayEntities = [];
        this.branchEntities = [];
        this.summaryEntity = null;
        this.selection = { level: null, id: null };
        this.lastScopeEval = null;
    }

    async loadFixture(path = DEFAULT_FIXTURE_PATH) {
        const res = await fetch(path, { cache: 'no-store' });
        if (!res.ok) {
            return { ok: false, reason: 'FIXTURE_LOAD_FAILED', status: res.status };
        }
        const json = await res.json();
        const features = Array.isArray(json?.features) ? json.features : [];
        this.fixture = json;
        this.levelIndex = new Map(LEVELS.map((lvl) => [lvl, []]));
        for (const feature of features) {
            const level = String(feature?.properties?.level || '').toLowerCase();
            if (!this.levelIndex.has(level)) continue;
            this.levelIndex.get(level).push(feature);
        }
        this.renderBaseOverlays();
        return {
            ok: true,
            state: this.getState()
        };
    }

    list(level) {
        const key = String(level || '').toLowerCase();
        const rows = this.levelIndex.get(key) || [];
        return rows.map((f) => ({
            id: String(f?.properties?.id || ''),
            name: String(f?.properties?.name || ''),
            level: key
        }));
    }

    async select(level, id) {
        const key = String(level || '').toLowerCase();
        const targetId = String(id || '').toUpperCase().trim();
        if (!this.levelIndex.has(key)) {
            return { ok: false, reason: 'UNKNOWN_SCOPE_LEVEL' };
        }
        const feature = (this.levelIndex.get(key) || []).find((f) => String(f?.properties?.id || '').toUpperCase() === targetId);
        if (!feature) {
            return { ok: false, reason: 'UNKNOWN_SCOPE_ID' };
        }
        this.selection = { level: key, id: String(feature.properties.id) };
        this.renderBaseOverlays();
        const evalResult = this.evaluateScope();
        this.renderBranchScope(evalResult);
        this.renderSummary(evalResult);
        RelayLog.info(`[GLOBE] scope-overlay level=${key} id=${this.selection.id}`);
        RelayLog.info(`[GOV] scope-visualization result=PASS inScope=${evalResult.inScopeProposals.length} outOfScope=${evalResult.outOfScopeProposals.length}`);
        return { ok: true, state: this.getState(), eval: this.toEvalSummary(evalResult) };
    }

    getState() {
        return {
            loaded: !!this.fixture,
            selection: { ...this.selection },
            countries: this.list('country'),
            regions: this.list('region'),
            sites: this.list('site'),
            eval: this.toEvalSummary(this.lastScopeEval)
        };
    }

    assertCommitScope(targetBinding) {
        if (!this.selection.level || !this.selection.id) {
            return { ok: true };
        }
        const evalResult = this.lastScopeEval || this.evaluateScope();
        const branchId = String(targetBinding?.scopeRef?.branchId || targetBinding?.targetRef?.id || '');
        if (!branchId) {
            return { ok: true };
        }
        if (evalResult.inScopeBranchIds.has(branchId)) {
            return { ok: true };
        }
        return {
            ok: false,
            reason: 'GOV_SCOPE_VIOLATION',
            proposalScope: `branch.${branchId}`,
            selectedScope: `${this.selection.level}.${this.selection.id}`
        };
    }

    toEvalSummary(evalResult) {
        if (!evalResult) return null;
        return {
            selectedScope: evalResult.selectedScope,
            inScopeBranches: [...evalResult.inScopeBranchIds],
            inScopeProposals: evalResult.inScopeProposals.map((x) => x.id),
            outOfScopeProposals: evalResult.outOfScopeProposals.map((x) => x.id)
        };
    }

    evaluateScope() {
        const selected = this.getSelectedFeature();
        const branchNodes = this.getBranchNodes();
        const inScopeBranchIds = new Set();
        if (selected) {
            for (const branch of branchNodes) {
                if (this.isBranchInSelectedScope(branch, selected)) {
                    inScopeBranchIds.add(branch.id);
                }
            }
        }
        const proposals = this.getGovernanceProposals();
        const inScopeProposals = [];
        const outOfScopeProposals = [];
        for (const proposal of proposals) {
            if (inScopeBranchIds.has(proposal.branchId)) {
                inScopeProposals.push(proposal);
            } else {
                outOfScopeProposals.push(proposal);
            }
        }
        const selectedScope = selected ? `${this.selection.level}.${this.selection.id}` : 'none';
        this.lastScopeEval = {
            selectedScope,
            inScopeBranchIds,
            inScopeProposals,
            outOfScopeProposals
        };
        return this.lastScopeEval;
    }

    getSelectedFeature() {
        if (!this.selection.level || !this.selection.id) return null;
        const rows = this.levelIndex.get(this.selection.level) || [];
        return rows.find((f) => String(f?.properties?.id || '') === this.selection.id) || null;
    }

    getBranchNodes() {
        const state = this.getRelayState?.() || {};
        const nodes = Array.isArray(state?.tree?.nodes) ? state.tree.nodes : [];
        return nodes.filter((n) => n.type === 'branch' && Number.isFinite(n.lat) && Number.isFinite(n.lon));
    }

    getGovernanceProposals() {
        const snapshots = Array.isArray(window.__relaySnapshots) ? window.__relaySnapshots : [];
        return snapshots
            .filter((s) => String(s?.type || '') === 'PROPOSE')
            .map((s) => {
                const rawId = s?.proposalId || s?.evidence?.proposal?.proposalId || s?.id || 'proposal-unknown';
                const branchId = String(s?.scopeRef?.branchId || s?.evidence?.scopeRef?.branchId || '');
                return { id: String(rawId), branchId };
            })
            .filter((p) => p.branchId.length > 0);
    }

    isBranchInSelectedScope(branch, selectedFeature) {
        const level = this.selection.level;
        const selectedId = this.selection.id;
        if (level === 'site') {
            const branchIds = Array.isArray(selectedFeature?.properties?.branchIds) ? selectedFeature.properties.branchIds.map(String) : [];
            if (branchIds.includes(branch.id)) return true;
        }
        const ring = selectedFeature?.geometry?.coordinates?.[0];
        if (!Array.isArray(ring)) return false;
        const inside = pointInRing(Number(branch.lon), Number(branch.lat), ring);
        if (inside) return true;
        if (level === 'region') {
            const siteFeatures = this.levelIndex.get('site') || [];
            const sitesInRegion = siteFeatures.filter((f) => String(f?.properties?.regionId || '') === selectedId);
            for (const site of sitesInRegion) {
                const siteBranchIds = Array.isArray(site?.properties?.branchIds) ? site.properties.branchIds.map(String) : [];
                if (siteBranchIds.includes(branch.id)) return true;
            }
        }
        if (level === 'country') {
            const siteFeatures = this.levelIndex.get('site') || [];
            const sitesInCountry = siteFeatures.filter((f) => String(f?.properties?.countryId || '') === selectedId);
            for (const site of sitesInCountry) {
                const siteBranchIds = Array.isArray(site?.properties?.branchIds) ? site.properties.branchIds.map(String) : [];
                if (siteBranchIds.includes(branch.id)) return true;
            }
        }
        return false;
    }

    renderBaseOverlays() {
        for (const entity of this.overlayEntities) {
            this.viewer?.entities?.remove(entity);
        }
        this.overlayEntities = [];
        if (!this.fixture || !this.viewer?.entities) return;
        for (const [level, features] of this.levelIndex.entries()) {
            for (const feature of features) {
                const ring = feature?.geometry?.coordinates?.[0];
                if (!Array.isArray(ring) || ring.length < 4) continue;
                const id = String(feature?.properties?.id || '');
                const isSelected = (this.selection.level === level && this.selection.id === id);
                const hierarchy = ring.map((p) => Cesium.Cartesian3.fromDegrees(Number(p[0]), Number(p[1]), 0));
                const color = this.resolveOverlayColor(level, isSelected);
                const center = centroidFromRing(ring);
                const e = this.viewer.entities.add({
                    id: `restore3-overlay-${level}-${id}`,
                    polygon: {
                        hierarchy,
                        material: color,
                        outline: true,
                        outlineColor: Cesium.Color.WHITE.withAlpha(isSelected ? 0.9 : 0.35)
                    },
                    label: {
                        text: `${id}`,
                        font: '12px sans-serif',
                        showBackground: true,
                        backgroundColor: Cesium.Color.BLACK.withAlpha(0.45),
                        fillColor: Cesium.Color.WHITE.withAlpha(isSelected ? 0.95 : 0.6),
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                        verticalOrigin: Cesium.VerticalOrigin.CENTER
                    },
                    position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat, 1000),
                    show: true
                });
                this.overlayEntities.push(e);
            }
        }
    }

    resolveOverlayColor(level, isSelected) {
        if (isSelected) return Cesium.Color.CYAN.withAlpha(0.32);
        if (level === 'country') return Cesium.Color.BLUE.withAlpha(0.08);
        if (level === 'region') return Cesium.Color.GREEN.withAlpha(0.08);
        return Cesium.Color.ORANGE.withAlpha(0.08);
    }

    renderBranchScope(evalResult) {
        for (const entity of this.branchEntities) {
            this.viewer?.entities?.remove(entity);
        }
        this.branchEntities = [];
        const branchNodes = this.getBranchNodes();
        if (!this.viewer?.entities || !branchNodes.length) return;
        for (const branch of branchNodes) {
            const inScope = evalResult.inScopeBranchIds.has(branch.id);
            const e = this.viewer.entities.add({
                id: `restore3-branch-scope-${branch.id}`,
                position: Cesium.Cartesian3.fromDegrees(Number(branch.lon), Number(branch.lat), Number(branch.alt || 0) + 300),
                point: {
                    pixelSize: 10,
                    color: inScope ? Cesium.Color.LIME.withAlpha(0.95) : Cesium.Color.RED.withAlpha(0.95),
                    outlineWidth: 1,
                    outlineColor: Cesium.Color.BLACK.withAlpha(0.9)
                },
                label: {
                    text: `${branch.id} ${inScope ? '[IN]' : '[OUT]'}`,
                    font: '12px sans-serif',
                    pixelOffset: new Cesium.Cartesian2(0, -18),
                    showBackground: true,
                    backgroundColor: Cesium.Color.BLACK.withAlpha(0.45),
                    fillColor: Cesium.Color.WHITE
                }
            });
            this.branchEntities.push(e);
        }
    }

    renderSummary(evalResult) {
        if (this.summaryEntity) {
            this.viewer?.entities?.remove(this.summaryEntity);
            this.summaryEntity = null;
        }
        const selected = this.getSelectedFeature();
        const ring = selected?.geometry?.coordinates?.[0];
        if (!Array.isArray(ring) || !this.viewer?.entities) return;
        const center = centroidFromRing(ring);
        const text = `Scope ${evalResult.selectedScope}\nIn-scope proposals: ${evalResult.inScopeProposals.length}\nOut-of-scope proposals: ${evalResult.outOfScopeProposals.length}`;
        this.summaryEntity = this.viewer.entities.add({
            id: 'restore3-scope-summary',
            position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat, 450000),
            label: {
                text,
                font: '13px sans-serif',
                showBackground: true,
                backgroundColor: Cesium.Color.BLACK.withAlpha(0.65),
                fillColor: Cesium.Color.CYAN,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.CENTER
            }
        });
    }
}
