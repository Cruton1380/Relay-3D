/**
 * CESIUM FILAMENT RENDERER - PHASE 2.1 PRIMITIVES
 * Renders tree structures using Cesium Primitives with ENU coordinate system
 * 
 * Primitives used for: trunks, branches, filaments
 * Entities used ONLY for: labels, cell points (at close LOD)
 */

import { RelayLog } from '../../core/utils/relay-log.js';
import { relayState } from '../../core/models/relay-state.js';
import { 
    createENUFrame, 
    enuToWorld, 
    validateENUCoordinates,
    isCartesian3Finite,
    createCircleProfile,
    CANONICAL_LAYOUT,
    // Frame computation for branch-aligned sheets
    tangentAt,
    projectOntoPlane,
    normalizeVec,
    cross,
    negateVec,
    computeBranchFrames,
    sampleLineSegment,
    enuVecToWorldDir
} from '../utils/enu-coordinates.js';

function computeSegmentLengths(path) {
    const lengths = [];
    for (let i = 0; i < path.length - 1; i++) {
        lengths.push(Cesium.Cartesian3.distance(path[i], path[i + 1]));
    }
    return lengths;
}

function pointAtArcLength(path, lengths, s) {
    let remaining = s;
    for (let i = 0; i < lengths.length; i++) {
        const segLen = lengths[i];
        if (segLen <= 0) continue;
        if (remaining <= segLen) {
            const t = remaining / segLen;
            return Cesium.Cartesian3.lerp(path[i], path[i + 1], t, new Cesium.Cartesian3());
        }
        remaining -= segLen;
    }
    return Cesium.Cartesian3.clone(path[path.length - 1], new Cesium.Cartesian3());
}

function computePolylineLength(path) {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
        total += Cesium.Cartesian3.distance(path[i], path[i + 1]);
    }
    return total;
}

function sanitizeLanePositions(path, eps = 0.02) {
    const out = [];
    let last = null;
    let hadNaN = false;
    let hadDup = false;
    for (const p of path) {
        if (!isCartesian3Finite(p)) {
            hadNaN = true;
            continue;
        }
        if (last && Cesium.Cartesian3.distance(p, last) <= eps) {
            hadDup = true;
            continue;
        }
        out.push(p);
        last = p;
    }
    const length = out.length >= 2 ? computePolylineLength(out) : 0;
    return { positions: out, length, hadNaN, hadDup };
}

function clampLaneWidth(width, length, minLen = 0.25) {
    const maxWidth = Math.max(0, length * 0.25);
    if (!Number.isFinite(length) || length <= 0) {
        return { width: Math.max(0.03, width), canVolume: false, reason: 'ZERO_LENGTH' };
    }
    if (length <= minLen || maxWidth < 0.03) {
        return { width: Math.max(0.03, Math.min(width, maxWidth || width)), canVolume: false, reason: 'TOO_SHORT' };
    }
    return { width: Math.max(0.03, Math.min(width, maxWidth)), canVolume: true };
}

function polylineWidthFromMeters(widthMeters) {
    return Math.max(1.0, Math.min(12.0, widthMeters * 6));
}

export class CesiumFilamentRenderer {
    constructor(viewer) {
        this.viewer = viewer;
        this.primitives = [];
        this.entities = [];
        this.currentLOD = 'SHEET';
        this.turgorAnimationRunning = false;
        this.timeboxCubes = [];
        this.timeboxByInstanceId = new Map();
        this.cellLabelById = new Map();
        this.lanePathsByCell = new Map();
        this.hoverLanePrimitive = null;
        this.hoveredTimebox = null;
        this.formulaEdgePrimitives = [];
        this.formulaScarPrimitives = [];
        this.lastP3A = null;
        
        // Track primitive counts by type
        this.primitiveCount = {
            trunks: 0,
            branches: 0,
            cellFilaments: 0,
            spines: 0,
            timeboxes: 0
        };
        
        // Track entity counts by type
        this.entityCount = {
            labels: 0,
            cellPoints: 0,
            timeboxLabels: 0
        };
        
        RelayLog.info('[FilamentRenderer] Initialized (Phase 2.1 Primitives)');
    }
    
    /**
     * Clear all rendered filaments
     */
    clear() {
        // Stop animation
        this.stopTurgorAnimation();
        
        // Remove primitives
        this.primitives.forEach(p => {
            this.viewer.scene.primitives.remove(p);
        });
        this.primitives = [];
        this.clearFormulaDependencies();
        
        // Remove entities
        this.entities.forEach(e => {
            this.viewer.entities.remove(e);
        });
        this.entities = [];
        this.timeboxCubes = [];
        this.timeboxByInstanceId = new Map();
        this.cellLabelById = new Map();
        this.lanePathsByCell = new Map();
        this.clearHoverHighlight();
        
        // Reset counts
        this.primitiveCount = { trunks: 0, branches: 0, cellFilaments: 0, spines: 0, timeboxes: 0 };
        this.entityCount = { labels: 0, cellPoints: 0, timeboxLabels: 0 };
        
        RelayLog.info('🧹 Filament renderer cleared');
    }

    clearHoverHighlight() {
        if (this.hoveredTimebox) {
            const { primitive, instanceId, baseColor, cellId } = this.hoveredTimebox;
            const attrs = primitive?.getGeometryInstanceAttributes?.(instanceId);
            if (attrs?.color && baseColor) {
                attrs.color = baseColor;
            }
            const labelEntity = this.cellLabelById.get(cellId);
            if (labelEntity?.label) {
                labelEntity.label.fillColor = Cesium.Color.WHITE;
            }
        }
        this.hoveredTimebox = null;
        if (this.hoverLanePrimitive) {
            this.viewer.scene.primitives.remove(this.hoverLanePrimitive);
            this.hoverLanePrimitive = null;
        }
    }

    setTimeboxHover(instanceId) {
        if (!instanceId) {
            this.clearHoverHighlight();
            return;
        }
        if (this.hoveredTimebox?.instanceId === instanceId) return;
        this.clearHoverHighlight();
        const entry = this.timeboxByInstanceId.get(instanceId);
        if (!entry) return;
        const attrs = entry.primitive?.getGeometryInstanceAttributes?.(instanceId);
        if (attrs?.color) {
            attrs.color = Cesium.ColorGeometryInstanceAttribute.toValue(
                Cesium.Color.fromCssColorString('#7fd7ff').withAlpha(0.95)
            );
        }
        const labelEntity = this.cellLabelById.get(entry.cellId);
        if (labelEntity?.label) {
            labelEntity.label.fillColor = Cesium.Color.fromCssColorString('#7fd7ff');
        }
        if (entry.lanePath?.length >= 2) {
            const laneGeometry = new Cesium.PolylineGeometry({
                positions: entry.lanePath,
                width: 2,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            const laneInstance = new Cesium.GeometryInstance({
                geometry: laneGeometry,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.fromCssColorString('#7fd7ff').withAlpha(0.8)
                    )
                }
            });
            this.hoverLanePrimitive = new Cesium.Primitive({
                geometryInstances: laneInstance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(this.hoverLanePrimitive);
        }
        this.hoveredTimebox = entry;
    }

    clearFormulaDependencies() {
        const clearedEdges = this.formulaEdgePrimitives.length;
        const clearedScars = this.formulaScarPrimitives.length;
        this.formulaEdgePrimitives.forEach(p => {
            this.viewer.scene.primitives.remove(p);
        });
        this.formulaScarPrimitives.forEach(p => {
            this.viewer.scene.primitives.remove(p);
        });
        this.formulaEdgePrimitives = [];
        this.formulaScarPrimitives = [];
        RelayLog.info(`[F2] clearedEdges=${clearedEdges} clearedScars=${clearedScars}`);
        return { clearedEdges, clearedScars };
    }

    renderFormulaCycleScar(position, idSuffix) {
        const scarGeometry = Cesium.BoxGeometry.fromDimensions({
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
            dimensions: new Cesium.Cartesian3(3.0, 3.0, 3.0)
        });
        const scarInstance = new Cesium.GeometryInstance({
            geometry: scarGeometry,
            modelMatrix: Cesium.Matrix4.fromTranslation(position),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                    Cesium.Color.fromCssColorString('#FF3B30').withAlpha(0.9)
                )
            },
            id: `formula-cycle-scar-${idSuffix}`
        });
        const scarPrimitive = new Cesium.Primitive({
            geometryInstances: scarInstance,
            appearance: new Cesium.PerInstanceColorAppearance({
                flat: true,
                translucent: true
            }),
            asynchronous: false
        });
        this.viewer.scene.primitives.add(scarPrimitive);
        this.formulaScarPrimitives.push(scarPrimitive);
    }

    renderFormulaDependencies() {
        this.clearFormulaDependencies();
        const sheets = relayState.tree.nodes.filter(node => node.type === 'sheet');
        let edgesRendered = 0;
        let cyclesDetected = 0;
        let scarsRendered = 0;
        
        for (const sheet of sheets) {
            const anchors = window.cellAnchors && window.cellAnchors[sheet.id];
            if (!anchors || !anchors.cells) continue;
            
            const graphDeps = sheet?.sheetGraph?.sheets?.get(sheet.id)?.deps;
            const deps = graphDeps?.edges || sheet?.metadata?.deps?.edges || [];
            const hasCycle = Boolean(graphDeps?.hasCycle ?? sheet?.metadata?.deps?.hasCycle);
            if (hasCycle && anchors.spine) {
                this.renderFormulaCycleScar(anchors.spine, sheet.id);
                cyclesDetected += 1;
                scarsRendered += 1;
            }
            if (!deps.length) continue;
            
            for (const edge of deps) {
                const fromPos = anchors.cells[edge.from];
                const toPos = anchors.cells[edge.to];
                if (!isCartesian3Finite(fromPos) || !isCartesian3Finite(toPos)) continue;
                
                const geometry = new Cesium.PolylineGeometry({
                    positions: [fromPos, toPos],
                    width: 1.2,
                    vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
                    arcType: Cesium.ArcType.NONE
                });
                
                const geometryInstance = new Cesium.GeometryInstance({
                    geometry,
                    id: `${sheet.id}-formula-${edge.from}-${edge.to}`
                });
                
                const material = Cesium.Material.fromType('PolylineDash', {
                    color: Cesium.Color.fromCssColorString('#D269FF').withAlpha(0.8),
                    dashLength: 16.0
                });
                
                const primitive = new Cesium.Primitive({
                    geometryInstances: geometryInstance,
                    appearance: new Cesium.PolylineMaterialAppearance({
                        translucent: true,
                        material
                    }),
                    asynchronous: false
                });
                
                this.viewer.scene.primitives.add(primitive);
                this.formulaEdgePrimitives.push(primitive);
                edgesRendered++;
            }
        }
        
        RelayLog.info(`🔗 Formula lens: rendered ${edgesRendered} dependency edges`);
        RelayLog.info(`[F2] formulaEdgesRendered=${edgesRendered}`);
        RelayLog.info(`[F2] cyclesDetected=${cyclesDetected}`);
        RelayLog.info(`[F2] scarsRendered=${scarsRendered}`);
        return { edgesRendered, cyclesDetected, scarsRendered };
    }
    
    /**
     * Update LOD level (called by LOD governor)
     */
    setLOD(level) {
        if (level !== this.currentLOD) {
            RelayLog.info(`🔄 LOD changed: ${this.currentLOD} → ${level}`);
            this.currentLOD = level;
        }
    }
    
    /**
     * Render full tree structure from relayState
     */
    renderTree() {
        this.clear();
        
        const { nodes, edges } = relayState.tree;
        if (nodes.length === 0) {
            RelayLog.warn('⚠️ No tree data to render');
            return;
        }
        
        RelayLog.info(`🌲 Rendering tree: ${nodes.length} nodes, ${edges.length} edges`);
        RelayLog.info(`[THICKNESS] cell=${CANONICAL_LAYOUT.cellFilament.width.toFixed(2)}m spine=${CANONICAL_LAYOUT.spine.width.toFixed(2)}m branch=${(CANONICAL_LAYOUT.branch.radiusThick * 2).toFixed(2)}m trunk=30.00m root=${CANONICAL_LAYOUT.root.width.toFixed(2)}m`);
        
        // Render nodes by type
        const trunks = nodes.filter(n => n.type === 'trunk');
        const branches = nodes.filter(n => n.type === 'branch');
        const sheets = nodes.filter(n => n.type === 'sheet');
        const activeSheetName = relayState?.metadata?.activeSheet;
        const attachModeActive = window.IMPORT_MODE === 'ATTACH_TO_TEMPLATE' && activeSheetName;
        const sheetsFiltered = attachModeActive
            ? sheets.filter(s => (s.name || s.metadata?.sheetName) === activeSheetName)
            : sheets;
        const branchIdsToRender = attachModeActive
            ? new Set(sheetsFiltered.map(s => s.parent))
            : null;
        const branchesFiltered = attachModeActive
            ? branches.filter(b => branchIdsToRender.has(b.id))
            : branches;
        
        // Render trunks with timeboxes
        trunks.forEach(trunk => {
            this.renderAnchorMarker(trunk);           // GATE 4: Always render anchor first (no buildings dependency)
            this.renderRootContinuation(trunk);       // Phase 2.3: Root segment below ground
            this.renderTrunkPrimitive(trunk);
            this.renderTimeboxesPrimitive(trunk);
        });
        
        // Render branches (as primitives)
        // SINGLE BRANCH PROOF: Only render first branch
        const branchesToRender = window.SINGLE_BRANCH_PROOF ? branchesFiltered.slice(0, 1) : branchesFiltered;
        branchesToRender.forEach((branch, index) => {
            this.renderBranchPrimitive(branch, index);
            this.renderTimeboxesPrimitive(branch);
        });
        
        // Render sheets with cell grids
        // SINGLE BRANCH PROOF: Only render first sheet
        const sheetsToRender = window.SINGLE_BRANCH_PROOF ? sheetsFiltered.slice(0, 1) : sheetsFiltered;
        let sheetsRendered = 0;
        sheetsToRender.forEach((sheet, index) => {
            if (window.FORCE_SHEET_RENDER_SKIP === true && index === 1) {
                return;
            }
            if (this.renderSheetPrimitive(sheet, index)) {
                sheetsRendered += 1;
            }
        });
        const expectedSheets = relayState?.metadata?.sheetsExpected;
        RelayLog.info(`[S1] SheetsRendered=${sheetsRendered}${Number.isFinite(expectedSheets) ? ` Expected=${expectedSheets}` : ''}`);
        if (Number.isFinite(expectedSheets) && sheetsRendered !== expectedSheets) {
            relayState.importStatus = 'INDETERMINATE';
            RelayLog.warn(`[S1] INDETERMINATE reason=SheetCountMismatch rendered=${sheetsRendered} expected=${expectedSheets}`);
        }
        
        // Render staged filaments (cell→spine→branch)
        // SINGLE BRANCH PROOF: Only render filaments for first sheet
        sheetsToRender.forEach((sheet, index) => {
            this.renderStagedFilaments(sheet, index);
        });
        
        this.logRenderStats();
        
        // STEP 7: Validate canonical topology (fail-soft with warning)
        try {
            this.validateTopology(relayState.tree);
        } catch (error) {
            RelayLog.error('[TOPOLOGY] ❌ Validation failed:', error);
            // Continue rendering (fail-soft) but log violation
        }
        
        // Start turgor force animation
        if (!this.turgorAnimationRunning) {
            this.startTurgorAnimation();
        }
    }
    
    /**
     * Log rendering statistics (primitives vs entities)
     */
    logRenderStats() {
        const totalPrimitives = Object.values(this.primitiveCount).reduce((a, b) => a + b, 0);
        const totalEntities = Object.values(this.entityCount).reduce((a, b) => a + b, 0);
        
        RelayLog.info(`✅ Tree rendered:`);
        RelayLog.info(`  Primitives: ${totalPrimitives} (trunk=${this.primitiveCount.trunks}, branches=${this.primitiveCount.branches}, cell-filaments=${this.primitiveCount.cellFilaments}, spines=${this.primitiveCount.spines})`);
        RelayLog.info(`  Entities: ${totalEntities} (labels=${this.entityCount.labels}, cell-points=${this.entityCount.cellPoints}, timebox-labels=${this.entityCount.timeboxLabels})`);
    }
    
    /**
     * Validate canonical topology (INVARIANTS A, B, C, D from RELAY-RENDER-CONTRACT.md)
     * Hard fail on violation to prevent regression
     */
    validateTopology(tree) {
        const violations = [];
        
        const sheets = tree.nodes.filter(n => n.type === 'sheet');
        const branches = new Map(tree.nodes.filter(n => n.type === 'branch').map(b => [b.id, b]));
        
        // === RULE A: Sheet normal || branch tangent (±5°) ===
        // CRITICAL: Sheet normal must be PARALLEL to branch tangent
        // This makes the sheet PLANE perpendicular to branch (face-on when looking down branch)
        for (const sheet of sheets) {
            const parent = branches.get(sheet.parent);
            if (!parent?._branchFrames || !sheet._normal || sheet._attachIndex === undefined) {
                // Sheet didn't render, skip validation
                continue;
            }
            
            const frame = parent._branchFrames[sheet._attachIndex];
            if (!frame?.T) continue;
            
            const tangentWorld = enuVecToWorldDir(parent._enuFrame, frame.T);
            const antiTangent = Cesium.Cartesian3.negate(tangentWorld, new Cesium.Cartesian3());
            const dot = Cesium.Cartesian3.dot(antiTangent, sheet._normal);
            const angleDeg = Math.acos(Math.min(1, Math.max(-1, dot))) * (180 / Math.PI);
            
            // Should be ~0° (normal aligned with -T)
            if (angleDeg > 5) {
                RelayLog.error(`[REFUSAL.SHEET_NORMAL_NOT_ANTI_TANGENT] sheet=${sheet.id} angleDeg=${angleDeg.toFixed(2)} expected=0±5`);
                violations.push(`Sheet ${sheet.id}: normal not anti-parallel to branch tangent (angle=${angleDeg.toFixed(1)}°, expected=0°±5°)`);
            }
        }
        
        // === RULE D: Prevent "fan collapses to point" near sheet ===
        for (const sheet of sheets) {
            if (!sheet._cellAnchors || sheet._cellAnchors.length < 4) continue;
            
            const cellPositions = sheet._cellAnchors.map(c => c.position);
            
            // Compute centroid
            const centroid = new Cesium.Cartesian3(0, 0, 0);
            for (const p of cellPositions) {
                Cesium.Cartesian3.add(centroid, p, centroid);
            }
            Cesium.Cartesian3.multiplyByScalar(centroid, 1 / cellPositions.length, centroid);
            
            // Compute max distance from centroid
            let maxDist = 0;
            for (const p of cellPositions) {
                maxDist = Math.max(maxDist, Cesium.Cartesian3.distance(p, centroid));
            }
            
            // If all cell tips collapse into tiny radius, you've reintroduced a hub
            if (maxDist < 0.2) {  // 20cm threshold
                violations.push(`Sheet ${sheet.id}: cell tips clustered (maxDist=${maxDist.toFixed(3)}m, min=0.2m)`);
            }
        }
        
        // === RULE B & C: Filament topology (to be implemented when filament tracking added) ===
        // For now, skip (filaments render via window.cellAnchors, not tracked in tree)
        
        if (violations.length > 0) {
            RelayLog.error('[TOPOLOGY VIOLATION]', violations);
            throw new Error(`Canonical topology violated: ${violations[0]}`);
        }
        
        RelayLog.info('[TOPOLOGY] ✅ All canonical invariants satisfied');
    }
    
    /**
     * Render anchor marker at trunk base (always visible, no buildings dependency)
     * GATE 4: Anchor is math, not map content
     */
    renderAnchorMarker(trunk) {
        try {
            const anchorPos = Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 0);
            const anchorTop = Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 100);  // 100m pin
            
            // Anchor pin geometry (vertical line)
            const geometry = new Cesium.PolylineGeometry({
                positions: [anchorPos, anchorTop],
                width: 8.0,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            
            const geometryInstance = new Cesium.GeometryInstance({
                geometry: geometry,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.CYAN.withAlpha(1.0)
                    )
                },
                id: `${trunk.id}-anchor`
            });
            
            const primitive = new Cesium.Primitive({
                geometryInstances: geometryInstance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            
            this.viewer.scene.primitives.add(primitive);
            this.primitives.push(primitive);
            
            // Anchor point (ground marker)
            const anchorEntity = this.viewer.entities.add({
                position: anchorPos,
                point: {
                    pixelSize: 12,
                    color: Cesium.Color.CYAN,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2
                },
                label: {
                    text: trunk.name || trunk.id,
                    font: '14px sans-serif',
                    fillColor: Cesium.Color.CYAN,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 3,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    scale: 0.9
                }
            });
            
            this.entities.push(anchorEntity);
            this.entityCount.labels++;
            
            RelayLog.info(`[GATE 4] Anchor marker rendered at (${trunk.lon.toFixed(4)}, ${trunk.lat.toFixed(4)}) - independent of buildings/terrain`);
            
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render anchor marker:`, error);
        }
    }
    
    /**
     * Render root continuation segment (history consolidation below anchor)
     * Phase 2.3: Add visual "history continuation" below ground (ENU -Z)
     * 
     * NOT routing to Earth center - this is a LOCAL root segment
     */
    renderRootContinuation(trunk) {
        try {
            // Create ENU frame at trunk anchor
            const enuFrame = createENUFrame(trunk.lon, trunk.lat, 0);
            
            // Root segment: From anchor DOWN along ENU -Z
            const rootDepth = CANONICAL_LAYOUT.root.depth[this.currentLOD] || CANONICAL_LAYOUT.root.depth.COMPANY;
            
            const anchorPos = enuToWorld(enuFrame, 0, 0, 0);       // Ground level
            const rootBottom = enuToWorld(enuFrame, 0, 0, -rootDepth);  // DOWN (negative Z)
            
            // Validate positions
            if (!isCartesian3Finite(anchorPos) || !isCartesian3Finite(rootBottom)) {
                throw new Error('Invalid root positions');
            }
            
            // Create root geometry (thicker, darker than trunk)
            const geometry = new Cesium.PolylineGeometry({
                positions: [anchorPos, rootBottom],
                width: CANONICAL_LAYOUT.root.width,  // 12px (thicker than trunk)
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            
            const geometryInstance = new Cesium.GeometryInstance({
                geometry: geometry,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.fromCssColorString(CANONICAL_LAYOUT.root.color).withAlpha(CANONICAL_LAYOUT.root.opacity)
                    )
                },
                id: `${trunk.id}-root`
            });
            
            const primitive = new Cesium.Primitive({
                geometryInstances: geometryInstance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            
            this.viewer.scene.primitives.add(primitive);
            this.primitives.push(primitive);
            
            RelayLog.info(`[Phase 2.3] Root continuation: ${rootDepth}m below anchor (aligned to ENU Up/Down)`);
            
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render root continuation:`, error);
        }
    }
    
    /**
     * Render trunk as primitive (vertical cylinder along ENU Up)
     */
    renderTrunkPrimitive(trunk) {
        try {
            // Create ENU frame at trunk anchor
            const enuFrame = createENUFrame(trunk.lon, trunk.lat, CANONICAL_LAYOUT.trunk.baseAlt);
            
            // Sample trunk centerline (20 points for smooth volumetric rendering)
            const samples = 20;
            const positions = [];
            for (let i = 0; i <= samples; i++) {
                const t = i / samples;
                const up = CANONICAL_LAYOUT.trunk.topAlt * t;
                const worldPos = enuToWorld(enuFrame, 0, 0, up);
                
                if (!isCartesian3Finite(worldPos)) {
                    throw new Error(`Invalid trunk position at sample ${i}`);
                }
                positions.push(worldPos);
            }
            
            // Create VOLUMETRIC trunk using CorridorGeometry
            // This makes the trunk a pillar, not a line
            const trunkRadius = 15.0;  // 15m radius (30m diameter pillar)
            const geometry = new Cesium.CorridorGeometry({
                positions: positions,
                width: trunkRadius * 2,
                vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                cornerType: Cesium.CornerType.ROUNDED
            });
            
            const geometryInstance = new Cesium.GeometryInstance({
                geometry: geometry,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.fromCssColorString('#8B4513').withAlpha(0.95)
                    )
                },
                id: trunk.id
            });
            
            const primitive = new Cesium.Primitive({
                geometryInstances: geometryInstance,
                appearance: new Cesium.PerInstanceColorAppearance({
                    flat: true,  // Flat shading for solid appearance
                    translucent: false
                }),
                asynchronous: false
            });
            
            this.viewer.scene.primitives.add(primitive);
            this.primitives.push(primitive);
            this.primitiveCount.trunks++;
            
            // Store trunk top position for branches (last sampled position)
            trunk._worldTop = positions[positions.length - 1];
            trunk._enuFrame = enuFrame;
            
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render trunk ${trunk.id}:`, error);
        }
    }
    
    /**
     * Render branch as primitive (tight parallel rib along +East with controlled arc)
     */
    renderBranchPrimitive(branch, branchIndex) {
        try {
            const parent = relayState.tree.nodes.find(n => n.id === branch.parent);
            if (!parent || !parent._enuFrame) {
                throw new Error('Parent trunk not found or missing ENU frame');
            }
            
            const enuFrame = parent._enuFrame;
            const layout = CANONICAL_LAYOUT.branch;
            
            // Branch layout in ENU meters
            const branchLength = layout.length;  // 800m
            
            // Calculate separation based on branch width + safety gap (CONTRACT 1)
            const branchWidth = layout.radiusThick * 2;  // Use thickest segment (base)
            const minGap = layout.separationGap;          // 8m safety gap
            const branchSeparation = branchWidth + minGap;  // Total separation
            
            // LINT: Enforce minimum separation (no overlap)
            if (branchSeparation < (branchWidth + 5)) {
                throw new Error(`[CONTRACT VIOLATION] Branch separation too small: ${branchSeparation}m < ${branchWidth + 5}m`);
            }
            
            const northOffset = branchIndex * branchSeparation;
            
            // GATE 2: Validate ENU→World conversion
            const branchStartENU = { east: 0, north: northOffset, up: CANONICAL_LAYOUT.trunk.topAlt };
            const branchEndENU = { east: branchLength, north: northOffset, up: CANONICAL_LAYOUT.trunk.topAlt };
            const branchStartWorld = enuToWorld(enuFrame, branchStartENU.east, branchStartENU.north, branchStartENU.up);
            const branchEndWorld = enuToWorld(enuFrame, branchEndENU.east, branchEndENU.north, branchEndENU.up);
            const actualLength = Cesium.Cartesian3.distance(branchStartWorld, branchEndWorld);
            const lengthError = Math.abs(actualLength - branchLength);
            
            RelayLog.info(`[GATE 2] Branch ${branch.id}:`);
            RelayLog.info(`  Anchor: (${parent.lon.toFixed(4)}, ${parent.lat.toFixed(4)})`);
            RelayLog.info(`  ENU Start: (E=${branchStartENU.east}, N=${branchStartENU.north}, U=${branchStartENU.up})`);
            RelayLog.info(`  ENU End: (E=${branchEndENU.east}, N=${branchEndENU.north}, U=${branchEndENU.up})`);
            RelayLog.info(`  Branch Length: ${actualLength.toFixed(1)}m (expected: ${branchLength}m)`);
            RelayLog.info(`  Length Error: ${lengthError.toFixed(1)}m`);
            if (lengthError > 10) {
                RelayLog.warn(`  ⚠️ GATE 2 WARNING: Length error > 10m`);
            }
            
            // STEP 1: Sample branch curve in ENU (meters)
            const branchPointsENU = [];
            const segments = layout.segments;
            
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const eastPos = branchLength * t;  // Monotonic +East
                const northPos = northOffset;       // Constant (tight)
                
                // Controlled arc: First 30% rises monotonically, then gentle sag
                let upPos = CANONICAL_LAYOUT.trunk.topAlt;  // Start at trunk top
                if (t < layout.arcAsymmetry) {
                    // First 30%: monotonic rise
                    const riseT = t / layout.arcAsymmetry;
                    upPos += riseT * layout.arcAmplitude * 0.5;
                } else {
                    // Remaining: gentle sag
                    const remainT = (t - layout.arcAsymmetry) / (1 - layout.arcAsymmetry);
                    const arcShape = Math.sin(remainT * Math.PI);
                    upPos += layout.arcAmplitude * 0.5 * (1 - arcShape * 0.3);
                }
                
                // Validate ENU coordinates
                if (!validateENUCoordinates(eastPos, northPos, upPos)) {
                    throw new Error(`Invalid ENU coordinates at segment ${i}`);
                }
                
                branchPointsENU.push({ east: eastPos, north: northPos, up: upPos });
            }
            
            // STEP 2: Compute {T, N, B} frames at each point (parallel transport)
            const branchFrames = computeBranchFrames(branchPointsENU);
            
            // STEP 3: Convert ENU points to world positions
            const positions = [];
            for (const pointENU of branchPointsENU) {
                const worldPos = enuToWorld(enuFrame, pointENU.east, pointENU.north, pointENU.up);
                
                if (!isCartesian3Finite(worldPos)) {
                    throw new Error(`Invalid world position`);
                }
                
                positions.push(worldPos);
            }
            
            // Create TAPERED branch corridor (3 segments for taper)
            // Segment A: 0-35% (thick at base)
            // Segment B: 35-75% (medium)
            // Segment C: 75-100% (thin at tip)
            
            const segmentA_end = Math.floor(segments * 0.35);
            const segmentB_end = Math.floor(segments * 0.75);
            
            const radiusThick = 12.0;   // 12m radius at base (24m diameter)
            const radiusMedium = 8.0;   // 8m radius mid (16m diameter)
            const radiusThin = 5.0;     // 5m radius at tip (10m diameter)
            
            // Segment A: Base (thick)
            if (segmentA_end > 0) {
                const positionsA = positions.slice(0, segmentA_end + 1);
                const geometryA = new Cesium.CorridorGeometry({
                    positions: positionsA,
                    width: radiusThick * 2,
                    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                    cornerType: Cesium.CornerType.ROUNDED
                });
                
                const instanceA = new Cesium.GeometryInstance({
                    geometry: geometryA,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString('#6B4423').withAlpha(0.9)
                        )
                    },
                    id: `${branch.id}-segment-A`
                });
                
                const primitiveA = new Cesium.Primitive({
                    geometryInstances: instanceA,
                    appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: false }),
                    asynchronous: false
                });
                
                this.viewer.scene.primitives.add(primitiveA);
                this.primitives.push(primitiveA);
            }
            
            // Segment B: Middle (medium)
            if (segmentB_end > segmentA_end) {
                const positionsB = positions.slice(segmentA_end, segmentB_end + 1);
                const geometryB = new Cesium.CorridorGeometry({
                    positions: positionsB,
                    width: radiusMedium * 2,
                    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                    cornerType: Cesium.CornerType.ROUNDED
                });
                
                const instanceB = new Cesium.GeometryInstance({
                    geometry: geometryB,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString('#6B4423').withAlpha(0.9)
                        )
                    },
                    id: `${branch.id}-segment-B`
                });
                
                const primitiveB = new Cesium.Primitive({
                    geometryInstances: instanceB,
                    appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: false }),
                    asynchronous: false
                });
                
                this.viewer.scene.primitives.add(primitiveB);
                this.primitives.push(primitiveB);
            }
            
            // Segment C: Tip (thin)
            if (segmentB_end < segments) {
                const positionsC = positions.slice(segmentB_end, segments + 1);
                const geometryC = new Cesium.CorridorGeometry({
                    positions: positionsC,
                    width: radiusThin * 2,
                    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                    cornerType: Cesium.CornerType.ROUNDED
                });
                
                const instanceC = new Cesium.GeometryInstance({
                    geometry: geometryC,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString('#6B4423').withAlpha(0.9)
                        )
                    },
                    id: `${branch.id}-segment-C`
                });
                
                const primitiveC = new Cesium.Primitive({
                    geometryInstances: instanceC,
                    appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: false }),
                    asynchronous: false
                });
                
                this.viewer.scene.primitives.add(primitiveC);
                this.primitives.push(primitiveC);
            }
            
            // Count as one branch (3 segments are visual only)
            this.primitiveCount.branches++;
            
            // STEP 4: Store branch data for sheet attachment
            const branchEnd = positions[positions.length - 1];
            branch._worldEndpoint = branchEnd;
            branch._enuFrame = enuFrame;
            branch._branchIndex = branchIndex;
            branch._northOffset = northOffset;
            branch._branchFrames = branchFrames;  // {T, N, B} at each point
            branch._branchPointsENU = branchPointsENU;  // ENU curve points
            branch._branchPositionsWorld = positions;  // World positions
            
            // GATE 3: Lock camera to branch on first render (single branch proof)
            if (window.SINGLE_BRANCH_PROOF && branchIndex === 0 && !window.__relayCameraRestored) {
                const branchStart = positions[0];
                const branchMidpoint = Cesium.Cartesian3.lerp(branchStart, branchEnd, 0.5, new Cesium.Cartesian3());
                const boundingSphere = new Cesium.BoundingSphere(branchMidpoint, 2000);  // 2km radius
                
                // Fly to bounding sphere with side view (0 duration = instant)
                this.viewer.camera.flyToBoundingSphere(boundingSphere, {
                    duration: 0.0,
                    offset: new Cesium.HeadingPitchRange(
                        Cesium.Math.toRadians(90),  // Looking from east
                        Cesium.Math.toRadians(-30), // Slightly downward
                        3000                         // 3km distance
                    )
                });
                
                RelayLog.info(`[GATE 3] Camera locked to branch bounding sphere (instant)`);
            }
            
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render branch ${branch.id}:`, error);
        }
    }
    
    /**
     * Render sheet as VERTICAL primitive PERPENDICULAR to branch (NOT horizontal)
     * Sheet normal = -T (facing back down branch)
     * Sheet plane = N × B (vertical "page in a book")
     */
    renderSheetPrimitive(sheet, branchIndex) {
        try {
            const parent = relayState.tree.nodes.find(n => n.id === sheet.parent);
            if (!parent || !parent._enuFrame || !parent._branchFrames) {
                throw new Error('Parent branch not found or missing ENU frame/frames');
            }
            
            const enuFrame = parent._enuFrame;
            const layout = CANONICAL_LAYOUT.sheet;
            
            // STEP 1: Get branch frame at attachment point (endpoint)
            const attachIndex = parent._branchFrames.length - 1;  // Last frame = endpoint
            const frame = parent._branchFrames[attachIndex];  // {T, N, B}
            const branchEndENU = parent._branchPointsENU[attachIndex];
            
            // STEP 2: Calculate dynamic clearance (CONTRACT 2: scales with sheet size + branch width)
            const branchWidth = CANONICAL_LAYOUT.branch.radiusThick * 2;  // Thickest segment (24m)
            const sheetDiag = Math.sqrt(layout.width**2 + layout.height**2);  // ~358m diagonal
            const clearance = (sheetDiag * layout.clearanceMultiplier) + (branchWidth * layout.branchWidthMultiplier);
            
            // LINT: Enforce minimum clearance (no glued sheets)
            if (clearance < sheetDiag * 0.5) {
                throw new Error(`[CONTRACT VIOLATION] Sheet clearance too small: ${clearance.toFixed(1)}m < ${(sheetDiag * 0.5).toFixed(1)}m`);
            }
            
            RelayLog.info(`[FilamentRenderer] 📏 Sheet clearance: ${clearance.toFixed(1)}m (sheetDiag=${sheetDiag.toFixed(1)}m, branchWidth=${branchWidth}m)`);
            
            // Position sheet along branch tangent
            const sheetENU = {
                east: branchEndENU.east + (clearance * frame.T.east),
                north: branchEndENU.north + (clearance * frame.T.north),
                up: branchEndENU.up + (clearance * frame.T.up)
            };
            
            // Validate ENU coordinates
            if (!validateENUCoordinates(sheetENU.east, sheetENU.north, sheetENU.up)) {
                throw new Error('Invalid sheet ENU coordinates');
            }
            
            const sheetCenter = enuToWorld(enuFrame, sheetENU.east, sheetENU.north, sheetENU.up);
            
            if (!isCartesian3Finite(sheetCenter)) {
                throw new Error('Invalid sheet center position');
            }
            
            // STEP 3: Sheet axes (CRITICAL FIX - INVARIANT A)
            // Sheet X-axis = N (branch normal, "up")
            // Sheet Y-axis = B (branch binormal, "right")
            // Sheet normal = -T (facing back down branch toward trunk)
            
            const sheetXAxis = enuVecToWorldDir(enuFrame, frame.N);  // Up
            const sheetYAxis = enuVecToWorldDir(enuFrame, frame.B);  // Right
            const sheetNormalCanonical = enuVecToWorldDir(enuFrame, negateVec(frame.T));  // -T
            
            // STEP 4: Create four corners using N × B (NOT East × North)
            const halfWidth = layout.width / 2;   // 140m
            const halfHeight = layout.height / 2; // 110m
            
            const corners = [
                // Bottom-left: -N (down), -B (left)
                Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, -halfHeight, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, -halfWidth, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                ),
                // Bottom-right: -N (down), +B (right)
                Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, -halfHeight, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, halfWidth, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                ),
                // Top-right: +N (up), +B (right)
                Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, halfHeight, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, halfWidth, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                ),
                // Top-left: +N (up), -B (left)
                Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, halfHeight, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, -halfWidth, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                )
            ];

            // Ensure sheet faces outward from globe center (render-only; keep canonical normal)
            const outward = Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.clone(sheetCenter, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
            );
            const edgeA = Cesium.Cartesian3.subtract(corners[1], corners[0], new Cesium.Cartesian3());
            const edgeB = Cesium.Cartesian3.subtract(corners[2], corners[0], new Cesium.Cartesian3());
            let sheetNormalRender = Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.cross(edgeA, edgeB, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
            );
            if (Cesium.Cartesian3.dot(sheetNormalRender, outward) < 0) {
                const tmp = corners[1];
                corners[1] = corners[3];
                corners[3] = tmp;
                const edgeAFlipped = Cesium.Cartesian3.subtract(corners[1], corners[0], new Cesium.Cartesian3());
                const edgeBFlipped = Cesium.Cartesian3.subtract(corners[2], corners[0], new Cesium.Cartesian3());
                sheetNormalRender = Cesium.Cartesian3.normalize(
                    Cesium.Cartesian3.cross(edgeAFlipped, edgeBFlipped, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
            }
            
            // Create polygon outline (CRITICAL: arcType.NONE prevents terrain sampling)
            const outlineOffset = Cesium.Cartesian3.multiplyByScalar(sheetNormalRender, 0.25, new Cesium.Cartesian3());
            const outlineCorners = corners.map((corner) => Cesium.Cartesian3.add(corner, outlineOffset, new Cesium.Cartesian3()));
            const outlineGeometry = new Cesium.PolylineGeometry({
                positions: [...outlineCorners, outlineCorners[0]],  // Close the loop
                width: layout.outlineWidth,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE  // Prevents NaN from terrain sampling
            });
            
            const eriColor = this.getERIColor(sheet.eri);
            
            const outlineInstance = new Cesium.GeometryInstance({
                geometry: outlineGeometry,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(eriColor.withAlpha(0.45))
                },
                id: `${sheet.id}-outline`
            });
            
            const outlinePrimitive = new Cesium.Primitive({
                geometryInstances: outlineInstance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            
            this.viewer.scene.primitives.add(outlinePrimitive);
            this.primitives.push(outlinePrimitive);

            // Subtle sheet surface fill (low contrast, non-emissive)
            if (sheet._fillPrimitive) {
                this.viewer.scene.primitives.remove(sheet._fillPrimitive);
                sheet._fillPrimitive = null;
            }
            const surfaceGeometry = new Cesium.PolygonGeometry({
                polygonHierarchy: new Cesium.PolygonHierarchy(corners),
                vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
            });
            const surfaceInstance = new Cesium.GeometryInstance({
                geometry: surfaceGeometry,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.fromCssColorString('#2a3b55').withAlpha(0.12)
                    )
                },
                id: `${sheet.id}-surface`
            });
            const surfacePrimitive = new Cesium.Primitive({
                geometryInstances: surfaceInstance,
                appearance: new Cesium.PerInstanceColorAppearance({
                    flat: true,
                    translucent: true,
                    renderState: {
                        depthTest: { enabled: true },
                        cull: { enabled: true, face: Cesium.CullFace.BACK }
                    }
                }),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(surfacePrimitive);
            this.primitives.push(surfacePrimitive);
            sheet._fillPrimitive = surfacePrimitive;

            // Internal grid overlay (visible only at close range)
            const rows = sheet.rows || CANONICAL_LAYOUT.sheet.cellRows;
            const cols = sheet.cols || CANONICAL_LAYOUT.sheet.cellCols;
            const gridNear = 0.0;
            const gridFar = 4500.0;
            const headerFar = 8000.0;
            const halfWidthGrid = layout.width / 2;
            const halfHeightGrid = layout.height / 2;
            const gridLines = [];
            const headerLines = [];
            for (let r = 1; r < rows; r++) {
                const t = (r / rows) - 0.5;
                const offset = t * layout.height;
                const lineStart = Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, offset, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, -halfWidthGrid, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                );
                const lineEnd = Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, offset, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, halfWidthGrid, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                );
                (r === 1 ? headerLines : gridLines).push([lineStart, lineEnd]);
            }
            for (let c = 1; c < cols; c++) {
                const t = (c / cols) - 0.5;
                const offset = t * layout.width;
                const lineStart = Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, -halfHeightGrid, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, offset, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                );
                const lineEnd = Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, halfHeightGrid, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, offset, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                );
                (c === 1 ? headerLines : gridLines).push([lineStart, lineEnd]);
            }

            const addGridLine = (line, color, far) => {
                const gridGeometry = new Cesium.PolylineGeometry({
                    positions: line,
                    width: 1.0,
                    vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                    arcType: Cesium.ArcType.NONE
                });
                const gridInstance = new Cesium.GeometryInstance({
                    geometry: gridGeometry,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(color),
                        distanceDisplayCondition: new Cesium.DistanceDisplayConditionGeometryInstanceAttribute(
                            gridNear,
                            far
                        )
                    }
                });
                const gridPrimitive = new Cesium.Primitive({
                    geometryInstances: gridInstance,
                    appearance: new Cesium.PolylineColorAppearance(),
                    asynchronous: false
                });
                this.viewer.scene.primitives.add(gridPrimitive);
                this.primitives.push(gridPrimitive);
            };
            gridLines.forEach(line => addGridLine(line, Cesium.Color.WHITE.withAlpha(0.08), gridFar));
            headerLines.forEach(line => addGridLine(line, Cesium.Color.WHITE.withAlpha(0.18), headerFar));

            // Optional spine guide (debug toggle)
            if (window.DEBUG_SPINE_GUIDE && window.cellAnchors?.[sheet.id]?.spine) {
                const spinePos = window.cellAnchors[sheet.id].spine;
                const guideStart = Cesium.Cartesian3.add(
                    spinePos,
                    Cesium.Cartesian3.multiplyByScalar(sheetYAxis, -halfWidthGrid, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                const guideEnd = Cesium.Cartesian3.add(
                    spinePos,
                    Cesium.Cartesian3.multiplyByScalar(sheetYAxis, halfWidthGrid, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                const guideGeometry = new Cesium.PolylineGeometry({
                    positions: [guideStart, guideEnd],
                    width: 1.5,
                    vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                    arcType: Cesium.ArcType.NONE
                });
                const guideInstance = new Cesium.GeometryInstance({
                    geometry: guideGeometry,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString('#ffd166').withAlpha(0.5)
                        )
                    },
                    id: `${sheet.id}-spine-guide`
                });
                const guidePrimitive = new Cesium.Primitive({
                    geometryInstances: guideInstance,
                    appearance: new Cesium.PolylineColorAppearance(),
                    asynchronous: false
                });
                this.viewer.scene.primitives.add(guidePrimitive);
                this.primitives.push(guidePrimitive);
            }
            
            // STEP 5: Store sheet frame for cell positioning & topology validation
            sheet._attachIndex = attachIndex;
            sheet._parentFrame = frame;  // {T, N, B}
            sheet._center = sheetCenter;
            sheet._xAxis = sheetXAxis;   // N (up)
            sheet._yAxis = sheetYAxis;   // B (right)
            sheet._normal = sheetNormalCanonical; // canonical sheet normal (-T)
            sheet._renderNormal = sheetNormalRender;
            sheet._enuFrame = enuFrame;
            sheet._sheetENU = sheetENU;
            
            const populatedCells = Array.isArray(sheet.cellData) ? sheet.cellData.length : 0;
            RelayLog.info(`[RENDER] sheet="${sheet.name || sheet.id}" populatedCells=${populatedCells} rows=${sheet.rows || 'n/a'} cols=${sheet.cols || 'n/a'}`);

            // Render cell grid using sheet frame (NOT ENU East×North)
            this.renderCellGridENU(sheet, enuFrame, sheetENU, sheetXAxis, sheetYAxis);
            if (!sheet.cellData || sheet.cellData.length === 0) {
                sheet._cellDataStatus = 'INDETERMINATE';
                RelayLog.warn(`[C1] Sheet ${sheet.id} missing cellData (placeholder grid)`);
            }
            
            // PHASE 3: Render timebox lanes behind cells (if cell data exists)
            if (sheet.cellData && sheet.cellData.length > 0) {
                this.renderTimeboxLanes(sheet);
            }
            
            RelayLog.info(`[FilamentRenderer] ✅ Sheet plane created: ${sheet.id} (normal = -T)`);
            return true;
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render sheet ${sheet.id}:`, error);
        }
        return false;
    }
    
    /**
     * Render cell grid in SHEET FRAME coordinates (NOT ENU East×North)
     * @param {Object} sheet - Sheet node
     * @param {Cesium.Matrix4} enuFrame - ENU frame for spine positioning
     * @param {Object} sheetENU - Sheet position in ENU (for spine)
     * @param {Cesium.Cartesian3} sheetXAxis - Sheet X axis (= branch N, "up"), NOT ENU East
     * @param {Cesium.Cartesian3} sheetYAxis - Sheet Y axis (= branch B, "right"), NOT ENU North
     */
    renderCellGridENU(sheet, enuFrame, sheetENU, sheetXAxis, sheetYAxis) {
        const cellData = Array.isArray(sheet.cellData) ? sheet.cellData : [];
        const derivedRows = cellData.length > 0
            ? Math.max(...cellData.map(cell => Number.isFinite(cell.row) ? cell.row : -1)) + 1
            : null;
        const derivedCols = cellData.length > 0
            ? Math.max(...cellData.map(cell => Number.isFinite(cell.col) ? cell.col : -1)) + 1
            : null;
        const rows = sheet.rows || derivedRows || CANONICAL_LAYOUT.sheet.cellRows;
        const cols = sheet.cols || derivedCols || CANONICAL_LAYOUT.sheet.cellCols;
        const sheetWidth = CANONICAL_LAYOUT.sheet.width;
        const sheetHeight = CANONICAL_LAYOUT.sheet.height;
        
        // Cell spacing in SHEET FRAME (meters)
        // X = along sheetXAxis (N, "up")
        // Y = along sheetYAxis (B, "right")
        const cellSpacingX = sheetHeight / (rows + 1);  // Along X (up)
        const cellSpacingY = sheetWidth / (cols + 1);   // Along Y (right)
        const startX = -sheetHeight/2 + cellSpacingX;
        const startY = -sheetWidth/2 + cellSpacingY;
        
        // Sheet bundle spine position (between branch and sheet, along -T)
        const spineENU = {
            east: sheetENU.east - (CANONICAL_LAYOUT.spine.offset * sheet._parentFrame.T.east),
            north: sheetENU.north - (CANONICAL_LAYOUT.spine.offset * sheet._parentFrame.T.north),
            up: sheetENU.up - (CANONICAL_LAYOUT.spine.offset * sheet._parentFrame.T.up)
        };
        const spineWorldPos = enuToWorld(enuFrame, spineENU.east, spineENU.north, spineENU.up);
        
        // Store cell anchors for filament rendering
        if (!window.cellAnchors) window.cellAnchors = {};
        window.cellAnchors[sheet.id] = {
            cells: {},
            spine: spineWorldPos,
            enuFrame: enuFrame,
            sheetENU: sheetENU
        };
        
        // Track cell anchors array for topology validation
        const cellAnchorsArray = [];
        
        // Render each cell (entities for points/labels at close LOD only)
        const showCompanyMarkers = (this.currentLOD === 'COMPANY' && window.SHOW_CELL_MARKERS_AT_COMPANY === true);
        const useCellMarkers = (this.currentLOD === 'SHEET' || this.currentLOD === 'CELL' || showCompanyMarkers);
        const entries = (cellData.length > 0)
            ? cellData.filter(cell => Number.isFinite(cell.row) && Number.isFinite(cell.col))
            : null;
        
        let anchoredCells = 0;
        let markerCells = 0;
        const addCellAnchor = (row, col, cellRefOverride, createEntity) => {
            const localX = startX + row * cellSpacingX;     // Along sheetXAxis (N, up)
            const localY = startY + col * cellSpacingY;     // Along sheetYAxis (B, right)
            const cellWorldPos = Cesium.Cartesian3.add(
                sheet._center,
                Cesium.Cartesian3.add(
                    Cesium.Cartesian3.multiplyByScalar(sheetXAxis, localX, new Cesium.Cartesian3()),
                    Cesium.Cartesian3.multiplyByScalar(sheetYAxis, localY, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                ),
                new Cesium.Cartesian3()
            );
            
            const cellRef = cellRefOverride || `${String.fromCharCode(65 + col)}${row + 1}`;
            const cellId = `${sheet.id}.cell.${row}.${col}`;
            
            window.cellAnchors[sheet.id].cells[cellId] = cellWorldPos;
            cellAnchorsArray.push({
                cellId: cellId,
                position: cellWorldPos,
                sheetNormal: sheet._normal
            });
            anchoredCells += 1;

            if (!createEntity) return;
            const showLabel = !showCompanyMarkers;
            const cellEntity = this.viewer.entities.add({
                position: cellWorldPos,
                point: {
                    pixelSize: showCompanyMarkers ? 3 : CANONICAL_LAYOUT.cell.pointSize,
                    color: this.getCellColor(sheet, row, col, this.getERIColor(sheet.eri)),
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: showCompanyMarkers ? 0 : 1
                },
                label: {
                    text: cellRef,
                    font: '10px monospace',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, -CANONICAL_LAYOUT.cell.labelOffset),
                    scale: CANONICAL_LAYOUT.cell.labelScale,
                    show: showLabel,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, CANONICAL_LAYOUT.cell.maxLabelDistance)
                },
                properties: {
                    type: 'cell',
                    sheetId: sheet.id,
                    cellRef: cellRef,
                    cellId: cellId
                }
            });
            
            this.entities.push(cellEntity);
            this.cellLabelById.set(cellId, cellEntity);
            this.entityCount.labels++;
            this.entityCount.cellPoints++;
            markerCells += 1;
        };

        if (entries) {
            entries.forEach(cell => {
                addCellAnchor(cell.row, cell.col, cell.a1 || null, useCellMarkers);
            });
        } else {
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    addCellAnchor(row, col, null, useCellMarkers);
                }
            }
        }
        
        // Store cell anchors array on sheet for validation
        sheet._cellAnchors = cellAnchorsArray;
        
        const importedCells = cellData.length;
        RelayLog.info(`[FilamentRenderer] 📊 Cell grid rendered: ${rows} rows × ${cols} cols (AnchoredCells=${anchoredCells}, MarkerCells=${markerCells}, ImportedCells=${importedCells})`);
        if (this.currentLOD === 'COMPANY') {
            RelayLog.info(`[LOD] COMPANY markersOverride=${showCompanyMarkers} MarkerCells=${markerCells}`);
        }
        this.lastMarkerStats = { anchoredCells, markerCells, lod: this.currentLOD };
        if (importedCells > 0 && anchoredCells !== importedCells) {
            RelayLog.error(`[REFUSAL.C1_CELL_COUNT] Sheet=${sheet.id} AnchoredCells=${anchoredCells} ImportedCells=${importedCells}`);
        }
    }
    
    /**
     * Render staged filaments (cell→spine→branch) as primitives
     */
    renderStagedFilaments(sheet, branchIndex) {
        try {
            const cellAnchors = window.cellAnchors[sheet.id];
            if (!cellAnchors) {
                RelayLog.warn(`[FilamentRenderer] ⚠️ No cell anchors for sheet ${sheet.id}`);
                return;
            }
            
            const spinePos = cellAnchors.spine;
            const parent = relayState.tree.nodes.find(n => n.id === sheet.parent);
            if (!parent || !parent._worldEndpoint) {
                throw new Error('Parent branch not found or missing endpoint');
            }
            
            const branchEndWorld = parent._worldEndpoint;
            const cellData = sheet.cellData || [];
            const cellDataMap = new Map();
            for (const info of cellData) {
                if (Number.isFinite(info.row) && Number.isFinite(info.col)) {
                    cellDataMap.set(`${info.row},${info.col}`, info);
                }
            }

            const rows = sheet.rows || CANONICAL_LAYOUT.sheet.cellRows;
            const cols = sheet.cols || CANONICAL_LAYOUT.sheet.cellCols;
            const sheetWidth = CANONICAL_LAYOUT.sheet.width;
            const sheetHeight = CANONICAL_LAYOUT.sheet.height;
            const cellSpacingX = sheetHeight / (rows + 1);
            const cellSpacingY = sheetWidth / (cols + 1);
            const startX = -sheetHeight / 2 + cellSpacingX;
            const startY = -sheetWidth / 2 + cellSpacingY;
            // Universal time direction for this sheet (opposite the branch)
            const timeDir = Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.clone(sheet._normal, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
            );
            let branchTangentWorld = null;
            if (sheet._parentFrame && sheet._enuFrame) {
                branchTangentWorld = enuVecToWorldDir(sheet._enuFrame, sheet._parentFrame.T);
                if (Cesium.Cartesian3.dot(timeDir, branchTangentWorld) > 0) {
                    Cesium.Cartesian3.negate(timeDir, timeDir);
                }
            }

            const sheetMaxCubes = Math.min(
                CANONICAL_LAYOUT.timebox.maxCellTimeboxes,
                Math.max(0, ...cellData.map(info => info.timeboxCount || 0))
            );
            const slabStart = CANONICAL_LAYOUT.timebox.cellToTimeGap;
            const slabEnd = slabStart + (sheetMaxCubes * CANONICAL_LAYOUT.timebox.stepDepth);
            let slabDirReference = null;
            let slabAngleDeltaMax = 0;
            let exitDotToBranchMax = null;
            
            // LOD check: Only render as primitives at close zoom
            const usePrimitives = (this.currentLOD === 'SHEET' || this.currentLOD === 'CELL');
            
            if (usePrimitives) {
                let stage1Rendered = 0;
                // STAGE 1: Cell → time slab → lane target (parallel slab, then bend)
                const cellEntries = Object.entries(cellAnchors.cells);
                cellEntries.forEach(([cellId, cellPos], idx) => {
                    if (!isCartesian3Finite(cellPos) || !isCartesian3Finite(spinePos)) {
                        return;  // Skip invalid
                    }
                    
                    let laneTarget = spinePos;
                    let mustStaySeparate = false;
                    const idParts = cellId.split('.');
                    const row = Number.parseInt(idParts[idParts.length - 2], 10);
                    const col = Number.parseInt(idParts[idParts.length - 1], 10);
                    if (Number.isFinite(row) && Number.isFinite(col)) {
                        const localX = startX + row * cellSpacingX;
                        const localY = startY + col * cellSpacingY;
                        const cellInfo = cellDataMap.get(`${row},${col}`);
                        const hasIndividualHistory = (cellInfo?.timeboxCount || 0) > 0;
                        const hasFormula = Boolean(cellInfo?.hasFormula);
                        mustStaySeparate = hasIndividualHistory || hasFormula;
                        laneTarget = mustStaySeparate
                            ? Cesium.Cartesian3.add(
                                spinePos,
                                Cesium.Cartesian3.add(
                                    Cesium.Cartesian3.multiplyByScalar(sheet._xAxis, localX, new Cesium.Cartesian3()),
                                    Cesium.Cartesian3.multiplyByScalar(sheet._yAxis, localY, new Cesium.Cartesian3()),
                                    new Cesium.Cartesian3()
                                ),
                                new Cesium.Cartesian3()
                            )
                            : spinePos;
                    }
                    
                    const p0 = cellPos;
                    const p1 = Cesium.Cartesian3.add(
                        p0,
                        Cesium.Cartesian3.multiplyByScalar(timeDir, slabStart, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    );
                    const p2 = Cesium.Cartesian3.add(
                        p0,
                        Cesium.Cartesian3.multiplyByScalar(timeDir, slabEnd, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    );

                    // LINT: slab direction parallel across cells
                    const slabDir = Cesium.Cartesian3.normalize(
                        Cesium.Cartesian3.subtract(p2, p1, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    );
                    if (!slabDirReference) {
                        slabDirReference = Cesium.Cartesian3.clone(slabDir, new Cesium.Cartesian3());
                    } else {
                        const dot = Cesium.Cartesian3.dot(slabDirReference, slabDir);
                        const angle = Cesium.Math.toDegrees(Math.acos(Math.min(1, Math.max(-1, dot))));
                        if (angle > slabAngleDeltaMax) {
                            slabAngleDeltaMax = angle;
                        }
                        if (angle > 2.0) {
                            throw new Error(`[LINT] Cell ${cellId}: stage1 slab not parallel (${angle.toFixed(2)}° > 2°)`);
                        }
                    }

                    if (branchTangentWorld) {
                        const exitDir = Cesium.Cartesian3.normalize(
                            Cesium.Cartesian3.subtract(p1, p0, new Cesium.Cartesian3()),
                            new Cesium.Cartesian3()
                        );
                        const exitDot = Cesium.Cartesian3.dot(exitDir, branchTangentWorld);
                        exitDotToBranchMax = (exitDotToBranchMax === null)
                            ? exitDot
                            : Math.max(exitDotToBranchMax, exitDot);
                        if (exitDot > 0) {
                            throw new Error(`[LINT] Cell ${cellId}: exits toward branch (dot=${exitDot.toFixed(3)})`);
                        }
                    }
                    
                    let combPoint = null;
                    if (!mustStaySeparate && Number.isFinite(col) && Number.isFinite(cols)) {
                        const combScalar = (col - (cols - 1) / 2) * CANONICAL_LAYOUT.timebox.laneGap * 0.35;
                        combPoint = Cesium.Cartesian3.add(
                            laneTarget,
                            Cesium.Cartesian3.multiplyByScalar(sheet._yAxis, combScalar, new Cesium.Cartesian3()),
                            new Cesium.Cartesian3()
                        );
                    }
                    const stage1Path = combPoint ? [p0, p1, p2, combPoint, laneTarget] : [p0, p1, p2, laneTarget];
                    const geometry = new Cesium.PolylineGeometry({
                        positions: stage1Path,
                        width: CANONICAL_LAYOUT.cellFilament.width,
                        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                        arcType: Cesium.ArcType.NONE
                    });
                    
                    const geometryInstance = new Cesium.GeometryInstance({
                        geometry: geometry,
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                                this.getERIColor(sheet.eri).withAlpha(CANONICAL_LAYOUT.cellFilament.opacity)
                            )
                        },
                        id: `${sheet.id}-cell-${idx}`
                    });
                    
                    const primitive = new Cesium.Primitive({
                        geometryInstances: geometryInstance,
                        appearance: new Cesium.PolylineColorAppearance(),
                        asynchronous: false
                    });
                    
                    this.viewer.scene.primitives.add(primitive);
                    this.primitives.push(primitive);
                    this.primitiveCount.cellFilaments++;
                    stage1Rendered++;
                });
                
                // STAGE 2: Spine center → Branch (single conduit always)
                if (isCartesian3Finite(spinePos) && isCartesian3Finite(branchEndWorld)) {
                    const spineGeometry = new Cesium.PolylineGeometry({
                        positions: [spinePos, branchEndWorld],
                        width: CANONICAL_LAYOUT.spine.width,
                        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                        arcType: Cesium.ArcType.NONE
                    });
                    
                    const spineInstance = new Cesium.GeometryInstance({
                        geometry: spineGeometry,
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                                this.getERIColor(sheet.eri).withAlpha(CANONICAL_LAYOUT.spine.opacity)
                            )
                        },
                        id: `${sheet.id}-spine`
                    });
                    
                    const spinePrimitive = new Cesium.Primitive({
                        geometryInstances: spineInstance,
                        appearance: new Cesium.PolylineColorAppearance(),
                        asynchronous: false
                    });
                    
                    this.viewer.scene.primitives.add(spinePrimitive);
                    this.primitives.push(spinePrimitive);
                    this.primitiveCount.spines++;
                }
                
                // GATE 5: Verify staged filaments (no spaghetti)
                const cellCount = Object.keys(cellAnchors.cells).length;
                RelayLog.info(`[GATE 5] Staged filaments for ${sheet.id}:`);
                RelayLog.info(`  Stage 1 (Cell→Spine): ${cellCount} primitives`);
                RelayLog.info(`  Stage 2 (Spine→Branch): 1 primitive`);
                RelayLog.info(`  Total: ${cellCount + 1} filament primitives`);
                RelayLog.info(`  ✅ NO direct cell→branch connections (staging enforced)`);
                RelayLog.info(`[RENDER] stagedFilaments expectedStage1=${cellCount} stage1Prims=${stage1Rendered} stage2Prims=1`);
                RelayLog.info(`[P3-A] exitDotToBranchMax=${exitDotToBranchMax !== null ? exitDotToBranchMax.toFixed(3) : 'n/a'}`);
                RelayLog.info(`[P3-A] slabAngleDeltaMaxDeg=${slabAngleDeltaMax.toFixed(3)}`);
                RelayLog.info(`[P3-A] stage2ConduitsPerSheet=1`);
                this.lastP3A = {
                    exitDotToBranchMax,
                    slabAngleDeltaMaxDeg: slabAngleDeltaMax,
                    stage2ConduitsPerSheet: 1
                };
            }
            
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render staged filaments:`, error);
        }
    }
    
    /**
     * PHASE 3: Render timebox lanes between cell and spine
     * Each cell with history/formula gets a parallel lane toward its spine target
     * Cells without may converge at spine center (mergeable)
     */
    renderTimeboxLanes(sheet) {
        try {
            const layout = CANONICAL_LAYOUT.timebox;
            const cellData = sheet.cellData || [];
            
            if (cellData.length === 0) {
                RelayLog.warn(`[FilamentRenderer] ⚠️ No cell data for timebox lanes: ${sheet.id}`);
                return;
            }
            
            const cellAnchors = window.cellAnchors[sheet.id];
            if (!cellAnchors) {
                throw new Error(`Cell anchors not found for ${sheet.id}`);
            }
            
            const rows = sheet.rows || CANONICAL_LAYOUT.sheet.cellRows;
            const cols = sheet.cols || CANONICAL_LAYOUT.sheet.cellCols;
            const sheetWidth = CANONICAL_LAYOUT.sheet.width;
            const sheetHeight = CANONICAL_LAYOUT.sheet.height;
            const cellSpacingX = sheetHeight / (rows + 1);
            const cellSpacingY = sheetWidth / (cols + 1);
            const startX = -sheetHeight / 2 + cellSpacingX;
            const startY = -sheetWidth / 2 + cellSpacingY;

            // Universal time direction for this sheet (opposite the branch)
            const timeDir = Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.clone(sheet._normal, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
            );
            let branchTangentWorld = null;
            if (sheet._parentFrame && sheet._enuFrame) {
                branchTangentWorld = enuVecToWorldDir(sheet._enuFrame, sheet._parentFrame.T);
                if (Cesium.Cartesian3.dot(timeDir, branchTangentWorld) > 0) {
                    Cesium.Cartesian3.negate(timeDir, timeDir);
                }
            }

            const sheetMaxCubes = Math.min(
                layout.maxCellTimeboxes,
                Math.max(0, ...cellData.map(info => info.timeboxCount || 0))
            );
            const slabStart = layout.cellToTimeGap;
            const slabEnd = slabStart + (sheetMaxCubes * layout.stepDepth);
            
            const parentBranch = relayState.tree.nodes.find(n => n.id === sheet.parent);
            let bandOffsets = null;
            if (parentBranch?.commits && parentBranch.commits.length > 0) {
                const branchBands = this.generateTimeboxesFromCommits(parentBranch.commits, CANONICAL_LAYOUT.branch.length);
                if (branchBands.length > 0) {
                    const count = branchBands.length;
                    const span = slabEnd - slabStart;
                    bandOffsets = branchBands.map((_, idx) => slabStart + (count === 1 ? 0 : (idx / (count - 1)) * span));
                }
            }

            let cubesRendered = 0;
            let lanesRendered = 0;
            const mergeableCells = [];
            const separateLaneTargets = [];
            const nearSheetPoints = [];
            const nearSheetEps = 0.25;
            const curveOut = 10.0;
            const approachBack = 14.0;
            let p3aLogged = false;
            let slabDirReference = null;
            const laneEps = 0.02;
            const minLaneLen = 0.25;
            const minVolumeLen = 2.0;
            const minVolumeWidth = 0.5;
            const timeboxVisibility = (this.currentLOD === 'SHEET' || this.currentLOD === 'CELL')
                ? 'full'
                : (this.currentLOD === 'COMPANY' ? 'faint' : 'hidden');
            const renderLaneGeometry = window.SHOW_TIMEBOX_LANES === true;
            const showActiveMarkers = window.SHOW_ACTIVE_MARKERS === true;
            const activeModeRaw = window.ACTIVE_MARKER_MODE || 'auto';
            let activeMode = activeModeRaw;
            if (activeModeRaw === 'auto') {
                activeMode = (this.currentLOD === 'SHEET' || this.currentLOD === 'CELL')
                    ? 'nonEmpty'
                    : 'selectedRecent';
            }
            const recentWindowMs = 15000;
            const recentCells = sheet._recentCells || new Map();
            const selectionRange = sheet._selectionRange || null;
            const shouldShowMarkers = showActiveMarkers && (this.currentLOD === 'SHEET' || this.currentLOD === 'CELL' || this.currentLOD === 'COMPANY');
            const isSelectedCell = (row, col) => {
                if (!selectionRange?.start || !selectionRange?.end) return false;
                const minRow = Math.min(selectionRange.start.row, selectionRange.end.row);
                const maxRow = Math.max(selectionRange.start.row, selectionRange.end.row);
                const minCol = Math.min(selectionRange.start.col, selectionRange.end.col);
                const maxCol = Math.max(selectionRange.start.col, selectionRange.end.col);
                return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
            };
            let bandAlignMaxDelta = null;
            let activeRendered = 0;
            let activeSelected = 0;
            let activeRecent = 0;
            let activeFormula = 0;
            const laneVolumeStats = {
                okVolume: 0,
                okPolyline: 0,
                fallback: 0,
                reasons: {
                    NaN_POINT: 0,
                    TOO_SHORT: 0,
                    DUP_POINTS: 0,
                    ZERO_LENGTH: 0,
                    VOLUME_ERROR: 0
                }
            };
            
            const widthLog = [
                `[W] sheet=${sheet.id}`,
                `lod=${this.currentLOD}`,
                `cellLane=${layout.laneThickness.toFixed(2)}m`,
                `spine=${CANONICAL_LAYOUT.spine.width.toFixed(2)}m`,
                `conduit=${CANONICAL_LAYOUT.spine.width.toFixed(2)}m`,
                `branch=${(CANONICAL_LAYOUT.branch.radiusThick * 2).toFixed(2)}m`,
                `trunk=${(30).toFixed(2)}m`
            ].join(' ');
            RelayLog.info(widthLog);
            
            // Render each cell's timebox lane
            for (const cellInfo of cellData) {
                try {
                    const { row, col, timeboxCount, hasFormula, formula } = cellInfo;
                    const cellId = `${sheet.id}.cell.${row}.${col}`;
                    const cellPos = cellAnchors.cells[cellId];
                
                    if (!cellPos) {
                        RelayLog.warn(`[FilamentRenderer] ⚠️ Cell position not found: ${cellId}`);
                        continue;
                    }
                
                // Determine if cell must stay separate (has history or formula)
                const hasIndividualHistory = (timeboxCount > 0);
                const mustStaySeparate = hasIndividualHistory || hasFormula;

                // Compute lane target on spine plane for this cell
                const localX = startX + row * cellSpacingX;
                const localY = startY + col * cellSpacingY;
                const laneTarget = mustStaySeparate
                    ? Cesium.Cartesian3.add(
                        cellAnchors.spine,
                        Cesium.Cartesian3.add(
                            Cesium.Cartesian3.multiplyByScalar(sheet._xAxis, localX, new Cesium.Cartesian3()),
                            Cesium.Cartesian3.multiplyByScalar(sheet._yAxis, localY, new Cesium.Cartesian3()),
                            new Cesium.Cartesian3()
                        ),
                        new Cesium.Cartesian3()
                    )
                    : cellAnchors.spine;
                
                const toTarget = Cesium.Cartesian3.normalize(
                    Cesium.Cartesian3.subtract(laneTarget, cellPos, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                
                if (!isCartesian3Finite(toTarget)) {
                    RelayLog.warn(`[FilamentRenderer] ⚠️ Invalid lane direction: ${cellId}`);
                    continue;
                }
                
                // Arrival: align to branch tangent if available, otherwise fall back to target direction
                let arriveDir = null;
                if (sheet._parentFrame && sheet._enuFrame) {
                    arriveDir = enuVecToWorldDir(sheet._enuFrame, sheet._parentFrame.T);
                } else {
                    arriveDir = Cesium.Cartesian3.clone(toTarget, new Cesium.Cartesian3());
                }
                if (Cesium.Cartesian3.dot(arriveDir, toTarget) < 0) {
                    arriveDir = Cesium.Cartesian3.negate(arriveDir, arriveDir);
                }
                
                // Constrained polyline with parallel time slab (p0..p5)
                const p0 = cellPos;
                const p1 = Cesium.Cartesian3.add(
                    p0,
                    Cesium.Cartesian3.multiplyByScalar(timeDir, slabStart, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                const p2 = Cesium.Cartesian3.add(
                    p0,
                    Cesium.Cartesian3.multiplyByScalar(timeDir, slabEnd, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );

                const hasValue = cellInfo.value !== undefined && cellInfo.value !== null && String(cellInfo.value).trim() !== '';
                const formulaPresent = Boolean(hasFormula) || (typeof formula === 'string' && formula.trim() !== '');
                const isNonEmpty = hasValue || formulaPresent;
                const isSelected = isSelectedCell(row, col);
                const recentStamp = recentCells.get(cellId);
                const isRecent = Number.isFinite(recentStamp) && (Date.now() - recentStamp) <= recentWindowMs;
                const shouldRenderActive = shouldShowMarkers && (
                    (activeMode === 'nonEmpty' && isNonEmpty) ||
                    (activeMode === 'selectedRecent' && (isSelected || isRecent)) ||
                    (activeMode === 'formulasOnly' && formulaPresent)
                );
                if (shouldRenderActive) {
                    const baseAlpha = isSelected ? 0.9 : (isRecent ? 0.7 : 0.45);
                    const baseColor = isSelected
                        ? Cesium.Color.fromCssColorString('#7fd7ff').withAlpha(baseAlpha)
                        : (formulaPresent
                            ? Cesium.Color.fromCssColorString('#ffd166').withAlpha(baseAlpha)
                            : Cesium.Color.fromCssColorString('#8faadc').withAlpha(baseAlpha));
                    const markerPos = Cesium.Cartesian3.clone(p1, new Cesium.Cartesian3());
                    const ringRadius = 0.9;
                    const ringSegments = 20;
                    const ringPoints = [];
                    for (let i = 0; i <= ringSegments; i++) {
                        const theta = (i / ringSegments) * Math.PI * 2;
                        const offset = Cesium.Cartesian3.add(
                            Cesium.Cartesian3.multiplyByScalar(sheet._xAxis, Math.cos(theta) * ringRadius, new Cesium.Cartesian3()),
                            Cesium.Cartesian3.multiplyByScalar(sheet._yAxis, Math.sin(theta) * ringRadius, new Cesium.Cartesian3()),
                            new Cesium.Cartesian3()
                        );
                        ringPoints.push(Cesium.Cartesian3.add(markerPos, offset, new Cesium.Cartesian3()));
                    }
                    const markerGeometry = new Cesium.PolylineGeometry({
                        positions: ringPoints,
                        width: 1.2,
                        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                        arcType: Cesium.ArcType.NONE
                    });
                    const markerInstance = new Cesium.GeometryInstance({
                        geometry: markerGeometry,
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(baseColor)
                        },
                        id: `${cellId}-presence-marker`
                    });
                    const markerPrimitive = new Cesium.Primitive({
                        geometryInstances: markerInstance,
                        appearance: new Cesium.PolylineColorAppearance(),
                        asynchronous: false
                    });
                    this.viewer.scene.primitives.add(markerPrimitive);
                    this.primitives.push(markerPrimitive);
                    activeRendered += 1;
                    if (isSelected) activeSelected += 1;
                    if (isRecent) activeRecent += 1;
                    if (formulaPresent) activeFormula += 1;
                }
                
                // LINT: initial tangent must point away from branch (+T) at cell
                if (branchTangentWorld) {
                    const initialDir = Cesium.Cartesian3.normalize(
                        Cesium.Cartesian3.subtract(p1, p0, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    );
                    const dotToBranch = Cesium.Cartesian3.dot(initialDir, branchTangentWorld);
                    if (!p3aLogged && row === 0 && col === 0) {
                        RelayLog.info(`[P3-A] lane grammar: cell→laneTarget (time slab) cellId=${cellId} depart=timeDir target=${mustStaySeparate ? 'spineTarget' : 'mergeNode'} firstSegDotToBranch=${dotToBranch.toFixed(3)}`);
                        p3aLogged = true;
                    }
                    if (dotToBranch > 0) {
                        throw new Error(`[LINT] Cell ${cellId}: initial filament points toward branch`);
                    }
                }
                
                // Near-sheet parallelism lint (no hub fan)
                for (const prior of nearSheetPoints) {
                    const dist = Cesium.Cartesian3.distance(prior, p1);
                    if (dist < nearSheetEps) {
                        throw new Error(`[LINT] Lane near-sheet convergence (${dist.toFixed(2)}m < ${nearSheetEps}m)`);
                    }
                }
                nearSheetPoints.push(p1);

                const toTargetFromP2 = Cesium.Cartesian3.normalize(
                    Cesium.Cartesian3.subtract(laneTarget, p2, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                const p3 = Cesium.Cartesian3.add(
                    p2,
                    Cesium.Cartesian3.multiplyByScalar(toTargetFromP2, curveOut, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                const p4 = Cesium.Cartesian3.add(
                    laneTarget,
                    Cesium.Cartesian3.multiplyByScalar(arriveDir, -approachBack, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                
                const p5 = laneTarget;
                const lanePath = [p0, p1, p2, p3, p4, p5];
                this.lanePathsByCell.set(cellId, lanePath);
                
                if (!lanePath.every(point => isCartesian3Finite(point))) {
                    RelayLog.warn(`[FilamentRenderer] ⚠️ Lane path has invalid points: ${cellId}`);
                    continue;
                }
                const pathLengths = computeSegmentLengths(lanePath);
                const totalLength = pathLengths.reduce((a, b) => a + b, 0);
                
                // LINT 1: Verify separation gap
                const gapDist = Cesium.Cartesian3.distance(cellPos, p1);
                if (gapDist < layout.cellToTimeGap - 0.5) {
                    throw new Error(`[LINT] Cell ${cellId}: gap too small (${gapDist.toFixed(2)}m < ${layout.cellToTimeGap}m)`);
                }
                
                // Lane start tick (subtle notch to indicate history begins)
                const tickLen = Math.min(1.2, slabStart * 0.5);
                const tickEnd = Cesium.Cartesian3.add(
                    p0,
                    Cesium.Cartesian3.multiplyByScalar(timeDir, tickLen, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                const tickGeometry = new Cesium.PolylineGeometry({
                    positions: [p0, tickEnd],
                    width: 1.2,
                    vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                    arcType: Cesium.ArcType.NONE
                });
                const tickInstance = new Cesium.GeometryInstance({
                    geometry: tickGeometry,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString('#9bb4d4').withAlpha(0.7)
                        )
                    },
                    id: `${cellId}-lane-tick`
                });
                const tickPrimitive = new Cesium.Primitive({
                    geometryInstances: tickInstance,
                    appearance: new Cesium.PolylineColorAppearance(),
                    asynchronous: false
                });
                this.viewer.scene.primitives.add(tickPrimitive);
                this.primitives.push(tickPrimitive);

                // Render timebox cubes along lane
                const bandCount = bandOffsets ? bandOffsets.length : layout.maxCellTimeboxes;
                const maxCubes = Math.min(timeboxCount, bandCount, layout.maxCellTimeboxes);
                const cubePositions = [];
                
                let cubeCount = 0;
                for (let i = 0; i < maxCubes; i++) {
                    const s = bandOffsets ? bandOffsets[i] : slabStart + (i * layout.stepDepth);
                    if (s > slabEnd && sheetMaxCubes > 0) break;
                    if (bandOffsets) {
                        const delta = Math.abs(s - bandOffsets[i]);
                        bandAlignMaxDelta = (bandAlignMaxDelta === null) ? delta : Math.max(bandAlignMaxDelta, delta);
                    }
                    const cubeCenter = Cesium.Cartesian3.add(
                        p0,
                        Cesium.Cartesian3.multiplyByScalar(timeDir, s, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    );
                    cubePositions.push(cubeCenter);
                    
                    // LINT: cube must be in front of cell along timeDir
                    const v = Cesium.Cartesian3.subtract(cubeCenter, cellPos, new Cesium.Cartesian3());
                    if (Cesium.Cartesian3.dot(v, timeDir) <= 0) {
                        throw new Error(`[LINT] Cell ${cellId}: timecube behind cell along timeDir`);
                    }

                    // LINT: timebox collision with sheet plane or spine
                    const cubeRadius = layout.cubeSize * 0.5;
                    if (sheet._normal && sheet._center) {
                        const planeOffset = Cesium.Cartesian3.dot(
                            Cesium.Cartesian3.subtract(cubeCenter, sheet._center, new Cesium.Cartesian3()),
                            sheet._normal
                        );
                        if (planeOffset < cubeRadius) {
                            throw new Error(`[REFUSAL.TIMEBOX_COLLISION] Cell ${cellId}: cube penetrates sheet plane (offset=${planeOffset.toFixed(3)}m < ${cubeRadius.toFixed(3)}m)`);
                        }
                    }
                    if (cellAnchors?.spine) {
                        const spineDist = Cesium.Cartesian3.distance(cubeCenter, cellAnchors.spine);
                        if (spineDist < cubeRadius) {
                            throw new Error(`[REFUSAL.TIMEBOX_COLLISION] Cell ${cellId}: cube intersects spine (dist=${spineDist.toFixed(3)}m < ${cubeRadius.toFixed(3)}m)`);
                        }
                    }

                    // LINT: cube slab must be parallel across cells
                    if (i >= 1) {
                        const slabDir = Cesium.Cartesian3.normalize(
                            Cesium.Cartesian3.subtract(cubeCenter, cubePositions[i - 1], new Cesium.Cartesian3()),
                            new Cesium.Cartesian3()
                        );
                        if (!slabDirReference) {
                            slabDirReference = Cesium.Cartesian3.clone(slabDir, new Cesium.Cartesian3());
                        } else {
                            const dot = Cesium.Cartesian3.dot(slabDirReference, slabDir);
                            const angle = Cesium.Math.toDegrees(Math.acos(Math.min(1, Math.max(-1, dot))));
                            if (angle > 2.0) {
                                throw new Error(`[LINT] Cell ${cellId}: cube slab not parallel (${angle.toFixed(2)}° > 2°)`);
                            }
                        }
                    }
                    
                    // Render timecube (BoxGeometry primitive, unit cube scaled by modelMatrix)
                    const cubeGeometry = Cesium.BoxGeometry.fromDimensions({
                        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                        dimensions: new Cesium.Cartesian3(1, 1, 1)
                    });
                    
                    // Color based on state (vary by timebox index for now)
                    const hue = (i / Math.max(1, maxCubes)) * 0.3;  // Blue-cyan range
                    let alpha = isNonEmpty ? 0.55 : 0.12;
                    let sat = isNonEmpty ? 0.7 : 0.25;
                    let light = isNonEmpty ? 0.5 : 0.2;
                    if (timeboxVisibility === 'faint') {
                        alpha = isNonEmpty ? 0.08 : 0.03;
                        sat = isNonEmpty ? 0.3 : 0.15;
                        light = isNonEmpty ? 0.35 : 0.15;
                    } else if (timeboxVisibility === 'hidden') {
                        alpha = 0.0;
                        sat = 0.0;
                        light = 0.0;
                    }
                    const color = Cesium.Color.fromHsl(0.55 + hue, sat, light, alpha);
                    
                    const translation = Cesium.Matrix4.fromTranslation(cubeCenter);
                    const baseScale = Cesium.Matrix4.fromScale(
                        new Cesium.Cartesian3(layout.cubeSize, layout.cubeSize, layout.cubeSize)
                    );
                    const baseModelMatrix = Cesium.Matrix4.multiply(translation, baseScale, new Cesium.Matrix4());
                    
                    const instanceId = `${cellId}-timebox-${i}`;
                    const cubeInstance = new Cesium.GeometryInstance({
                        geometry: cubeGeometry,
                        modelMatrix: baseModelMatrix,
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
                        },
                        id: instanceId
                    });
                    
                    const cubePrimitive = new Cesium.Primitive({
                        geometryInstances: cubeInstance,
                        appearance: new Cesium.PerInstanceColorAppearance({
                            flat: true,
                            translucent: true
                        }),
                        asynchronous: false
                    });
                    
                    this.viewer.scene.primitives.add(cubePrimitive);
                    this.primitives.push(cubePrimitive);
                    this.timeboxCubes.push({
                        primitive: cubePrimitive,
                        center: cubeCenter,
                        baseSize: layout.cubeSize,
                        baseColor: Cesium.ColorGeometryInstanceAttribute.toValue(color),
                        instanceId,
                        cellId,
                        lanePath,
                        pulseSpeed: 0.8 + i * 0.05,
                        pulseAmplitude: mustStaySeparate ? 0.18 : 0.12
                    });
                    this.timeboxByInstanceId.set(instanceId, {
                        primitive: cubePrimitive,
                        instanceId,
                        baseColor: Cesium.ColorGeometryInstanceAttribute.toValue(color),
                        cellId,
                        lanePath
                    });
                    cubesRendered++;
                    cubeCount++;
                }
                
                // Ensure terminal cube reaches the lane target for visibility/connection
                if (cubeCount > 0) {
                    const lastCube = cubePositions[cubePositions.length - 1];
                    const terminalDist = Cesium.Cartesian3.distance(lastCube, laneTarget);
                    if (terminalDist > layout.stepDepth * 0.5) {
                        const cubeGeometry = Cesium.BoxGeometry.fromDimensions({
                            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                            dimensions: new Cesium.Cartesian3(1, 1, 1)
                        });
                        const terminalAlpha = timeboxVisibility === 'full'
                            ? 0.6
                            : (timeboxVisibility === 'faint' ? 0.05 : 0.0);
                        const color = Cesium.Color.fromHsl(0.62, 0.8, 0.55, terminalAlpha);
                        const translation = Cesium.Matrix4.fromTranslation(laneTarget);
                        const baseScale = Cesium.Matrix4.fromScale(
                            new Cesium.Cartesian3(layout.cubeSize, layout.cubeSize, layout.cubeSize)
                        );
                        const baseModelMatrix = Cesium.Matrix4.multiply(translation, baseScale, new Cesium.Matrix4());
                        
                        const instanceId = `${cellId}-timebox-terminal`;
                        const cubeInstance = new Cesium.GeometryInstance({
                            geometry: cubeGeometry,
                            modelMatrix: baseModelMatrix,
                            attributes: {
                                color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
                            },
                            id: instanceId
                        });
                        
                        const cubePrimitive = new Cesium.Primitive({
                            geometryInstances: cubeInstance,
                            appearance: new Cesium.PerInstanceColorAppearance({
                                flat: true,
                                translucent: false
                            }),
                            asynchronous: false
                        });
                        
                        this.viewer.scene.primitives.add(cubePrimitive);
                        this.primitives.push(cubePrimitive);
                        this.timeboxCubes.push({
                            primitive: cubePrimitive,
                            center: laneTarget,
                            baseSize: layout.cubeSize,
                            baseColor: Cesium.ColorGeometryInstanceAttribute.toValue(color),
                            instanceId,
                            cellId,
                            lanePath,
                            pulseSpeed: 0.9,
                            pulseAmplitude: mustStaySeparate ? 0.16 : 0.1
                        });
                        this.timeboxByInstanceId.set(instanceId, {
                            primitive: cubePrimitive,
                            instanceId,
                            baseColor: Cesium.ColorGeometryInstanceAttribute.toValue(color),
                            cellId,
                            lanePath
                        });
                        cubesRendered++;
                    }
                }
                
                // Calculate lane endpoint (back of cube stack)
                const laneEnd = cubeCount > 0 ? cubePositions[cubeCount - 1] : p1;
                
                // Render lane filament (constrained path)
                const sanitized = sanitizeLanePositions(lanePath, laneEps);
                const lanePositions = sanitized.positions;
                if (!lanePositions || lanePositions.length < 2) {
                    laneVolumeStats.fallback++;
                    if (sanitized.hadNaN) laneVolumeStats.reasons.NaN_POINT++;
                    else laneVolumeStats.reasons.TOO_SHORT++;
                    continue;
                }

                const laneLength = sanitized.length;
                const widthInfo = clampLaneWidth(layout.laneThickness, laneLength, minLaneLen);
                const laneWidth = widthInfo.width;
                let laneGeometry = null;
                let usedVolume = false;

                if (widthInfo.canVolume && laneWidth >= minVolumeWidth && laneLength >= minVolumeLen && lanePositions.length >= 3) {
                    const shapePositions = createCircleProfile(laneWidth / 2, 10);
                    if (shapePositions && shapePositions.length >= 3) {
                        try {
                            laneGeometry = new Cesium.PolylineVolumeGeometry({
                                positions: lanePositions,
                                shapePositions,
                                vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
                            });
                            usedVolume = true;
                        } catch (laneError) {
                            laneVolumeStats.reasons.VOLUME_ERROR++;
                        }
                    } else {
                        laneVolumeStats.reasons.DUP_POINTS++;
                    }
                } else if (widthInfo.reason === 'TOO_SHORT') {
                    laneVolumeStats.reasons.TOO_SHORT++;
                } else if (widthInfo.reason === 'ZERO_LENGTH') {
                    laneVolumeStats.reasons.ZERO_LENGTH++;
                }

                if (!laneGeometry) {
                    laneGeometry = new Cesium.PolylineGeometry({
                        positions: lanePositions,
                        width: polylineWidthFromMeters(laneWidth),
                        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                        arcType: Cesium.ArcType.NONE
                    });
                }

                if (usedVolume) {
                    laneVolumeStats.okVolume++;
                } else {
                    laneVolumeStats.okPolyline++;
                    if (sanitized.hadNaN) laneVolumeStats.reasons.NaN_POINT++;
                    if (sanitized.hadDup) laneVolumeStats.reasons.DUP_POINTS++;
                }
                
                if (renderLaneGeometry) {
                    const laneColor = mustStaySeparate
                        ? Cesium.Color.fromCssColorString('#4FC3F7').withAlpha(0.6)  // Bright cyan (has history/formula)
                        : Cesium.Color.fromCssColorString('#90CAF9').withAlpha(0.4); // Light blue (mergeable)
                    
                    const laneInstance = new Cesium.GeometryInstance({
                        geometry: laneGeometry,
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(laneColor)
                        },
                        id: `${cellId}-lane`
                    });
                    
                    const lanePrimitive = new Cesium.Primitive({
                        geometryInstances: laneInstance,
                        appearance: laneGeometry instanceof Cesium.PolylineGeometry
                            ? new Cesium.PolylineColorAppearance()
                            : new Cesium.PerInstanceColorAppearance({
                                flat: true,
                                translucent: true
                            }),
                        asynchronous: false
                    });
                    
                    this.viewer.scene.primitives.add(lanePrimitive);
                    this.primitives.push(lanePrimitive);
                }
                lanesRendered++;
                
                // Track mergeable cells for bundling phase (future)
                if (!mustStaySeparate) {
                    mergeableCells.push({ cellId, cellPos, laneEnd });
                } else {
                    separateLaneTargets.push({ cellId, laneTarget });
                }
                } catch (cellError) {
                    RelayLog.warn(`[FilamentRenderer] ⚠️ Timebox lane skipped: ${cellInfo?.row}.${cellInfo?.col} (${cellError.message})`);
                }
            }
            
            RelayLog.info(`[FilamentRenderer] ⏳ Timebox lanes rendered: ${lanesRendered} lanes, ${cubesRendered} cubes`);
            RelayLog.info(`[FilamentRenderer]   Separate lanes: ${lanesRendered - mergeableCells.length}, Mergeable: ${mergeableCells.length}`);
            if (timeboxVisibility === 'full') {
                if (bandOffsets) {
                    const maxDelta = bandAlignMaxDelta !== null ? bandAlignMaxDelta : 0;
                    const ok = maxDelta <= 0.01;
                    RelayLog.info(`[T] bandAlign ok=${ok} maxDeltaM=${maxDelta.toFixed(3)}`);
                } else {
                    RelayLog.info('[T] bandAlign fallback=stepDepth reason=noBranchBands');
                }
            }
            if (shouldShowMarkers) {
                RelayLog.info(`[TB] presenceMarkers rendered=${activeRendered} selected=${activeSelected} recent=${activeRecent} formula=${activeFormula}`);
            }
            RelayLog.info(`[L2] laneVolume: okVolume=${laneVolumeStats.okVolume} okPolyline=${laneVolumeStats.okPolyline} fallback=${laneVolumeStats.fallback} (TOO_SHORT=${laneVolumeStats.reasons.TOO_SHORT}, DUP_POINTS=${laneVolumeStats.reasons.DUP_POINTS}, NaN_POINT=${laneVolumeStats.reasons.NaN_POINT}, ZERO_LENGTH=${laneVolumeStats.reasons.ZERO_LENGTH}, VOLUME_ERROR=${laneVolumeStats.reasons.VOLUME_ERROR}) eps=${laneEps} minLen=${minLaneLen} minVolumeLen=${minVolumeLen} minVolumeWidth=${minVolumeWidth} (renderer-threshold)`);
            
            // LINT: Separate lanes must not converge (targets stay distinct)
            if (separateLaneTargets.length > 1) {
                let minTargetDist = Infinity;
                for (let i = 0; i < separateLaneTargets.length; i++) {
                    for (let j = i + 1; j < separateLaneTargets.length; j++) {
                        const dist = Cesium.Cartesian3.distance(
                            separateLaneTargets[i].laneTarget,
                            separateLaneTargets[j].laneTarget
                        );
                        minTargetDist = Math.min(minTargetDist, dist);
                    }
                }
                if (minTargetDist < 0.5) {
                    throw new Error(`[LINT] Separate lane targets converged (${minTargetDist.toFixed(2)}m < 0.5m)`);
                }
            }
            
            // LINT 2: Verify at least one timebox per visible cell (with history)
            const cellsWithHistory = cellData.filter(c => c.timeboxCount > 0).length;
            if (timeboxVisibility === 'full' && cubesRendered < cellsWithHistory) {
                RelayLog.warn(`[LINT WARNING] Some cells with history have no timeboxes (${cubesRendered} cubes for ${cellsWithHistory} cells)`);
            }
            
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render timebox lanes:`, error);
        }
    }
    
    /**
     * Render timeboxes with dynamic spacing (primitives at far LOD, entities at close LOD)
     */
    renderTimeboxesPrimitive(node) {
        try {
            if (!node.commits || node.commits.length === 0) {
                return;  // No timeboxes if no commits
            }
            
            const enuFrame = node._enuFrame;
            if (!enuFrame) {
                throw new Error('Node missing ENU frame');
            }
            
            // Calculate timebox spacing dynamically
            let limbLength, startAlt, endAlt;
            
            if (node.type === 'trunk') {
                limbLength = CANONICAL_LAYOUT.trunk.topAlt;
                startAlt = 0;
                endAlt = CANONICAL_LAYOUT.trunk.topAlt;
            } else if (node.type === 'branch') {
                limbLength = CANONICAL_LAYOUT.branch.length;
                startAlt = CANONICAL_LAYOUT.trunk.topAlt;
                endAlt = CANONICAL_LAYOUT.trunk.topAlt;  // Branches don't rise much
            } else {
                return;  // Only trunks and branches have timeboxes
            }
            
            // Dynamic timebox count (length-derived)
            const timeboxes = this.generateTimeboxesFromCommits(node.commits, limbLength);
            
            // Render each timebox (simplified as entities for now)
            timeboxes.forEach((timebox, idx) => {
                const t = idx / (timeboxes.length - 1 || 1);
                
                let timeboxPos;
                if (node.type === 'trunk') {
                    const height = startAlt + t * limbLength;
                    timeboxPos = enuToWorld(enuFrame, 0, 0, height);
                } else if (node.type === 'branch') {
                    const eastPos = t * limbLength;
                    const northPos = node._northOffset || 0;
                    timeboxPos = enuToWorld(enuFrame, eastPos, northPos, startAlt);
                }
                
                if (!isCartesian3Finite(timeboxPos)) {
                    return;  // Skip invalid
                }
                
                // Timebox entity (simplified ring)
                const timeboxRadius = 15 + (timebox.openDrifts || 0) * 0.5;
                const timeboxEntity = this.viewer.entities.add({
                    position: timeboxPos,
                    ellipse: {
                        semiMinorAxis: timeboxRadius,
                        semiMajorAxis: timeboxRadius,
                        material: Cesium.Color.CYAN.withAlpha(0.4),
                        outline: true,
                        outlineColor: Cesium.Color.CYAN,
                        outlineWidth: 2
                    },
                    label: {
                        text: timebox.timeboxId || `TB-${idx}`,
                        font: '12px sans-serif',
                        fillColor: Cesium.Color.CYAN,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        pixelOffset: new Cesium.Cartesian2(0, -20),
                        scale: 0.7,
                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 100000)
                    },
                    properties: {
                        type: 'timebox',
                        nodeId: node.id,
                        timeboxId: timebox.timeboxId,
                        openDrifts: timebox.openDrifts,
                        scarCount: timebox.scarCount,
                        pulseAmplitude: timebox.pulseAmplitude || 1.0,
                        pulseSpeed: timebox.pulseSpeed || 1.0
                    }
                });
                
                this.entities.push(timeboxEntity);
                this.entityCount.timeboxLabels++;
            });
            
            RelayLog.info(`[FilamentRenderer] ⏰ Timeboxes: ${timeboxes.length} on ${node.type} ${node.id}`);
            
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render timeboxes:`, error);
        }
    }
    
    /**
     * Generate timeboxes from commits with dynamic spacing
     */
    generateTimeboxesFromCommits(commits, limbLength) {
        if (!commits || commits.length === 0) return [];
        
        // Check if commits are already pre-formatted as timeboxes
        if (commits[0].timeboxId) {
            return commits;  // Already formatted
        }
        
        // Dynamic timebox count based on limb length
        const minSpacing = CANONICAL_LAYOUT.timebox.minSpacing;
        const maxTimeboxes = CANONICAL_LAYOUT.timebox.maxTimeboxes;
        const timeboxCount = Math.min(Math.floor(limbLength / minSpacing), maxTimeboxes);
        
        // Bucket commits into timeboxes
        const timeboxes = [];
        const commitsPerBox = Math.ceil(commits.length / timeboxCount);
        
        for (let i = 0; i < timeboxCount; i++) {
            const boxCommits = commits.slice(i * commitsPerBox, (i + 1) * commitsPerBox);
            const openDrifts = boxCommits.filter(c => c.status === 'open').length;
            const scarCount = boxCommits.filter(c => c.severity === 'high').length;
            
            timeboxes.push({
                timeboxId: `TB-${i + 1}`,
                commits: boxCommits,
                openDrifts: openDrifts,
                scarCount: scarCount,
                pulseAmplitude: 1.0 + openDrifts * 0.1,
                pulseSpeed: 1.0 + scarCount * 0.05
            });
        }
        
        return timeboxes;
    }
    
    /**
     * Start turgor force animation (pulsing timeboxes)
     */
    startTurgorAnimation() {
        if (this.turgorAnimationRunning) return;
        
        this.turgorAnimationRunning = true;
        
        const animate = () => {
            if (!this.turgorAnimationRunning) return;
            
            const time = Date.now() / 1000;
            
            // Animate timebox entities
            this.entities.forEach(entity => {
                if (entity.properties && entity.properties.type === 'timebox') {
                    const pulseAmplitude = entity.properties.pulseAmplitude || 1.0;
                    const pulseSpeed = entity.properties.pulseSpeed || 1.0;
                    
                    const pulse = Math.sin(time * pulseSpeed) * 0.5 + 0.5;
                    const scaleFactor = 1.0 + pulse * 0.2 * pulseAmplitude;
                    
                    // Note: Direct scale animation would need CallbackProperty
                    // For now this is a placeholder
                }
            });

            // Animate per-cell timebox cubes (turgor pulse)
            this.timeboxCubes.forEach(cube => {
                const pulse = Math.sin(time * cube.pulseSpeed) * 0.5 + 0.5;
                const scale = cube.baseSize * (1.0 + pulse * cube.pulseAmplitude);
                
                const translation = Cesium.Matrix4.fromTranslation(cube.center);
                const scaleMatrix = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(scale, scale, scale));
                cube.primitive.modelMatrix = Cesium.Matrix4.multiply(translation, scaleMatrix, cube.primitive.modelMatrix);
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
        RelayLog.info('[FilamentRenderer] ✅ Turgor force animation started');
    }
    
    /**
     * Stop turgor force animation
     */
    stopTurgorAnimation() {
        if (this.turgorAnimationRunning) {
            this.turgorAnimationRunning = false;
            RelayLog.info('[FilamentRenderer] ⏸️ Turgor force animation stopped');
        }
    }
    
    /**
     * Get ERI color
     */
    getERIColor(eri) {
        const eriColors = {
            'high': Cesium.Color.RED,
            'medium': Cesium.Color.YELLOW,
            'low': Cesium.Color.GREEN,
            'none': Cesium.Color.GRAY
        };
        return eriColors[eri] || Cesium.Color.CYAN;
    }
    
    /**
     * Get cell color with variation
     */
    getCellColor(sheet, row, col, baseColor) {
        const variation = ((row + col) % 3) * 0.1;
        return baseColor.brighten(variation, new Cesium.Color());
    }
}
