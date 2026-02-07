/**
 * Relationship Renderer (Phase 2)
 * 
 * Renders global relationships as core-routed filaments
 * Spec: archive/proofs/phase2-proof-spec.md
 * 
 * DOES:
 * - Render relationships as two legs (A → core, core → B)
 * - Use Cesium primitives (PolylineGeometry)
 * - Create V-shape converging at Earth's center
 * - Visual style distinct from local filaments
 * 
 * CANNOT:
 * - Create surface bridges
 * - Use entities for main geometry (labels only)
 * 
 * Renderer-specific (MAY import Cesium)
 */

export class RelationshipRenderer {
    /**
     * @param {Cesium.Viewer} viewer - Cesium viewer instance
     * @param {Object} relayState - Core relay state
     */
    constructor(viewer, relayState) {
        this.viewer = viewer;
        this.relayState = relayState;
        this.primitives = [];  // Track created primitives
        
        console.log('[RelationshipRenderer] Initialized');
    }
    
    /**
     * Render all relationships
     */
    renderRelationships() {
        if (!this.relayState.relationships || this.relayState.relationships.length === 0) {
            console.log('[RelationshipRenderer] No relationships to render');
            return;
        }
        
        console.log(`[RelationshipRenderer] Rendering ${this.relayState.relationships.length} relationships`);
        
        for (const rel of this.relayState.relationships) {
            this.renderRelationship(rel);
        }
    }
    
    /**
     * Render a single relationship as core-routed V
     * @param {Object} rel - Relationship object
     */
    renderRelationship(rel) {
        const anchorA = this.findAnchor(rel.a.anchorId);
        const anchorB = this.findAnchor(rel.b.anchorId);
        
        if (!anchorA || !anchorB) {
            console.error('[RelationshipRenderer] Missing anchor for relationship:', rel.id);
            return;
        }
        
        // Get positions
        const positionA = Cesium.Cartesian3.fromDegrees(
            anchorA.lon, 
            anchorA.lat, 
            anchorA.height || 0
        );
        
        const positionB = Cesium.Cartesian3.fromDegrees(
            anchorB.lon, 
            anchorB.lat, 
            anchorB.height || 0
        );
        
        // Earth core position (origin in ECEF)
        const corePosition = Cesium.Cartesian3.ZERO.clone();
        
        // Create two legs: A → core, core → B
        this.createRelationshipLeg(rel.id + '_legA', positionA, corePosition, 'LEG_A');
        this.createRelationshipLeg(rel.id + '_legB', corePosition, positionB, 'LEG_B');
        
        console.log(`[RelationshipRenderer] Rendered relationship: ${rel.id}`);
        console.log(`  Leg A: ${rel.a.anchorId} → earth.core`);
        console.log(`  Leg B: earth.core → ${rel.b.anchorId}`);
    }
    
    /**
     * Create one leg of a relationship (A → core or core → B)
     * @param {string} id - Leg identifier
     * @param {Cesium.Cartesian3} start - Start position
     * @param {Cesium.Cartesian3} end - End position
     * @param {string} legType - 'LEG_A' or 'LEG_B'
     */
    createRelationshipLeg(id, start, end, legType) {
        // Create polyline geometry (straight line through Earth interior)
        const positions = [start, end];
        
        const geometry = new Cesium.PolylineGeometry({
            positions: positions,
            width: 2.0,  // Thinner than local filaments
            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
            arcType: Cesium.ArcType.NONE  // Straight line (not following ellipsoid)
        });
        
        const geometryInstance = new Cesium.GeometryInstance({
            geometry: geometry,
            id: id,
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                    new Cesium.Color(0.5, 0.8, 1.0, 0.7)  // Light blue, semi-transparent
                )
            }
        });
        
        const primitive = new Cesium.Primitive({
            geometryInstances: geometryInstance,
            appearance: new Cesium.PolylineColorAppearance({
                translucent: true
            }),
            asynchronous: false
        });
        
        this.viewer.scene.primitives.add(primitive);
        this.primitives.push({ id, primitive, legType });
        
        console.log(`[RelationshipRenderer] Created ${legType}: ${id}`);
    }
    
    /**
     * Find anchor by ID
     * @param {string} anchorId - Anchor identifier
     * @returns {Object|null} Anchor object or null
     */
    findAnchor(anchorId) {
        // Look for anchor in relayState.tree.nodes first
        if (this.relayState.tree && this.relayState.tree.nodes) {
            for (const node of this.relayState.tree.nodes) {
                if (node.id === anchorId) {
                    return node;
                }
            }
        }
        
        // Look in relayState.anchors map
        if (this.relayState.anchors && this.relayState.anchors[anchorId]) {
            return this.relayState.anchors[anchorId];
        }
        
        console.warn('[RelationshipRenderer] Anchor not found:', anchorId);
        return null;
    }
    
    /**
     * Render Earth core marker (proof mode only)
     */
    renderCoreMarker() {
        const corePosition = Cesium.Cartesian3.ZERO.clone();
        
        const geometry = new Cesium.EllipsoidGeometry({
            radii: new Cesium.Cartesian3(50000, 50000, 50000),  // 50km radius
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
        });
        
        const geometryInstance = new Cesium.GeometryInstance({
            geometry: geometry,
            modelMatrix: Cesium.Matrix4.fromTranslation(corePosition),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                    new Cesium.Color(1.0, 1.0, 1.0, 0.3)  // Dim white
                )
            }
        });
        
        const primitive = new Cesium.Primitive({
            geometryInstances: geometryInstance,
            appearance: new Cesium.PerInstanceColorAppearance({
                translucent: true,
                closed: true
            }),
            asynchronous: false
        });
        
        this.viewer.scene.primitives.add(primitive);
        this.primitives.push({ id: 'core_marker', primitive, type: 'CORE_MARKER' });
        
        console.log('[RelationshipRenderer] Core marker rendered (proof mode)');
    }
    
    /**
     * Clear all rendered relationships
     */
    clear() {
        for (const item of this.primitives) {
            this.viewer.scene.primitives.remove(item.primitive);
        }
        this.primitives = [];
        console.log('[RelationshipRenderer] Cleared all relationships');
    }
    
    /**
     * Get statistics
     * @returns {Object} Renderer statistics
     */
    getStats() {
        return {
            totalRelationships: this.relayState.relationships ? this.relayState.relationships.length : 0,
            primitivesCreated: this.primitives.length,
            legs: this.primitives.filter(p => p.legType).length,
            coreMarker: this.primitives.some(p => p.type === 'CORE_MARKER')
        };
    }
}

/**
 * Usage Example:
 * 
 * // In relay-cesium-world.html or main app file:
 * 
 * import { RelationshipRenderer } from './app/renderers/relationship-renderer.js';
 * 
 * // After viewer initialized:
 * const relationshipRenderer = new RelationshipRenderer(viewer, relayState);
 * 
 * // Add test relationship to relayState:
 * relayState.relationships = [
 *     {
 *         id: "rel.telaviv_nyc.packaging_film",
 *         type: "RELATIONSHIP.SUPPLY_CHAIN",
 *         a: { anchorId: "tree.telaviv" },
 *         b: { anchorId: "tree.nyc" },
 *         label: "Shared supplier: Packaging Film",
 *         scope: "INTL",
 *         status: "ACTIVE"
 *     }
 * ];
 * 
 * // Add tree anchors:
 * relayState.tree.nodes.push(
 *     { id: "tree.telaviv", lat: 32.0853, lon: 34.7818, height: 0 },
 *     { id: "tree.nyc", lat: 40.7128, lon: -74.0060, height: 0 }
 * );
 * 
 * // Render:
 * relationshipRenderer.renderRelationships();
 * relationshipRenderer.renderCoreMarker();  // Optional: proof mode only
 * 
 * // Set camera for proof screenshot:
 * viewer.camera.setView({
 *     destination: Cesium.Cartesian3.fromDegrees(0, 0, 28000000),  // 28k km altitude
 *     orientation: {
 *         heading: 0.0,
 *         pitch: Cesium.Math.toRadians(-45),  // Tilted down
 *         roll: 0.0
 *     }
 * });
 */
