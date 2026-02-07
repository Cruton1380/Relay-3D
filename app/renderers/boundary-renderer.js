/**
 * Boundary Renderer (Phase 4)
 * 
 * Renders boundaries from GeoJSON data
 * Based on v93 CountyBoundaryManager
 * Spec: docs/architecture/RELAY-CESIUM-ARCHITECTURE.md
 * 
 * DOES:
 * - Load boundaries from data/boundaries/*.geojson
 * - Render as Cesium entities (polygon outlines + optional fill)
 * - Support MultiPolygon + holes
 * - Provide containsLL(lat, lon) for point-in-polygon
 * 
 * Renderer-specific (MAY import Cesium)
 */

export class BoundaryRenderer {
    /**
     * @param {Cesium.Viewer} viewer - Cesium viewer instance
     * @param {Object} relayState - Core relay state
     */
    constructor(viewer, relayState) {
        this.viewer = viewer;
        this.relayState = relayState;
        this.dataSource = null;
        this.loadedBoundaries = new Map();  // countryCode → boundary data
        
        this.initializeDataSource();
        
        console.log('[BoundaryRenderer] Initialized');
    }
    
    /**
     * Initialize GeoJSON data source
     */
    initializeDataSource() {
        this.dataSource = new Cesium.GeoJsonDataSource('relay-boundaries');
        this.dataSource.show = true;
        this.viewer.dataSources.add(this.dataSource);
        
        console.log('[BoundaryRenderer] DataSource created and added to viewer');
    }
    
    /**
     * Load boundary from GeoJSON file (FAIL-SOFT)
     * @param {string} countryCode - Country code (e.g., 'ISR', 'USA')
     * @param {string} filepath - Path to GeoJSON file (relative to data/boundaries/)
     * @returns {Promise<number>} Number of features successfully added (0 if failed)
     */
    async loadBoundary(countryCode, filepath) {
        try {
            const fullPath = filepath.startsWith('data/') ? filepath : `data/boundaries/${filepath}`;
            
            console.log(`[BoundaryRenderer] Loading ${countryCode} from ${fullPath}`);
            
            const response = await fetch(fullPath);
            if (!response.ok) {
                console.error(`[BoundaryRenderer] ❌ BOUNDARY_LOAD_REFUSAL: ${countryCode} - HTTP ${response.status}`);
                return 0;
            }
            
            const geoJson = await response.json();
            const featureCount = geoJson.features?.length || 0;
            
            if (featureCount === 0) {
                console.warn(`[BoundaryRenderer] ⚠️ ${countryCode}: No features in GeoJSON`);
                return 0;
            }
            
            // Process each feature and add as entity (fail-soft per feature)
            let addedCount = 0;
            let refusalCount = 0;
            
            for (let i = 0; i < geoJson.features.length; i++) {
                const feature = geoJson.features[i];
                const entityId = `boundary-${countryCode}-${i}`;
                
                try {
                    const entity = this.createBoundaryEntity(feature, entityId, countryCode);
                    if (entity) {
                        // CRITICAL: Try adding entity, catch any Cesium errors
                        try {
                            this.dataSource.entities.add(entity);
                            addedCount++;
                        } catch (cesiumError) {
                            console.error(`[BoundaryRenderer] ❌ Cesium refused entity ${entityId}:`, cesiumError.message);
                            refusalCount++;
                        }
                    } else {
                        refusalCount++;
                    }
                } catch (error) {
                    console.error(`[BoundaryRenderer] ❌ Feature ${i} failed:`, error.message);
                    refusalCount++;
                }
            }
            
            // Store boundary data for containsLL (even if partially loaded)
            this.loadedBoundaries.set(countryCode, {
                geoJson,
                featureCount,
                addedCount,
                refusalCount,
                status: addedCount > 0 ? 'PARTIAL' : 'FAILED'
            });
            
            if (addedCount > 0) {
                console.log(`[BoundaryRenderer] ✅ ${countryCode}: Loaded ${addedCount}/${featureCount} features${refusalCount > 0 ? ` (${refusalCount} refused)` : ''}`);
            } else {
                console.error(`[BoundaryRenderer] ❌ BOUNDARY_LOAD_REFUSAL: ${countryCode} - All ${featureCount} features invalid`);
            }
            
            return addedCount;
            
        } catch (error) {
            console.error(`[BoundaryRenderer] ❌ BOUNDARY_LOAD_REFUSAL: ${countryCode} - ${error.message}`);
            return 0;
        }
    }
    
    /**
     * Create boundary entity from GeoJSON feature (FAIL-SOFT)
     */
    createBoundaryEntity(feature, entityId, countryCode) {
        try {
            const geometry = feature.geometry;
            if (!geometry || !geometry.coordinates) {
                console.warn('[BoundaryRenderer] Invalid geometry - skipping');
                return null;
            }
            
            // Extract coordinates based on geometry type
            let rawCoordinates = null;
            
            if (geometry.type === 'Polygon') {
                // Single polygon: coordinates[0] is outer ring
                rawCoordinates = geometry.coordinates[0];
            } else if (geometry.type === 'MultiPolygon') {
                // MultiPolygon: coordinates[0][0] is first polygon's outer ring
                rawCoordinates = geometry.coordinates[0][0];
            } else {
                console.warn(`[BoundaryRenderer] Unsupported geometry type: ${geometry.type} - skipping`);
                return null;
            }
            
            // CRITICAL: Validate coordinates before passing to Cesium
            const validatedCoords = this.validateAndCleanCoordinates(rawCoordinates, countryCode);
            if (!validatedCoords) {
                console.error(`[BoundaryRenderer] ❌ BOUNDARY_RENDER_REFUSAL: ${countryCode} - invalid coordinates`);
                return null;
            }
            
            // Convert to Cartesian3 positions
            const positions = this.coordinatesToCartesian(validatedCoords);
            if (!positions || positions.length < 3) {
                console.error(`[BoundaryRenderer] ❌ BOUNDARY_RENDER_REFUSAL: ${countryCode} - insufficient positions (${positions?.length || 0})`);
                return null;
            }
            
            // Final NaN check on positions
            if (!this.allPositionsFinite(positions)) {
                console.error(`[BoundaryRenderer] ❌ BOUNDARY_RENDER_REFUSAL: ${countryCode} - NaN/Infinity in Cartesian positions`);
                return null;
            }
            
            // Create entity with MINIMAL styling to avoid Cesium geometry errors
            // CRITICAL: Simplified to bare minimum to prevent extractHeights crash
            return {
                id: entityId,
                name: feature.properties?.name || countryCode,
                polygon: {
                    hierarchy: new Cesium.PolygonHierarchy(positions),
                    material: Cesium.Color.CYAN.withAlpha(0.2),
                    outline: true,
                    outlineColor: Cesium.Color.CYAN,
                    outlineWidth: 2.0
                    // NO height, NO heightReference, NO perPositionHeight
                    // Let Cesium use defaults to avoid extractHeights calculations
                }
            };
            
        } catch (error) {
            console.error(`[BoundaryRenderer] ❌ BOUNDARY_RENDER_REFUSAL: ${countryCode} - exception:`, error.message);
            return null;
        }
    }
    
    /**
     * Validate and clean coordinate array (NaN guard + deduplication)
     * @returns {Array|null} Cleaned coordinates or null if invalid
     */
    validateAndCleanCoordinates(coordinates, label) {
        if (!Array.isArray(coordinates) || coordinates.length < 3) {
            console.warn(`[BoundaryRenderer] ${label}: Too few coordinates (${coordinates?.length || 0})`);
            return null;
        }
        
        const cleaned = [];
        let lastLon = null;
        let lastLat = null;
        
        for (let i = 0; i < coordinates.length; i++) {
            const coord = coordinates[i];
            
            // Must be array with at least 2 elements
            if (!Array.isArray(coord) || coord.length < 2) {
                console.error(`[BoundaryRenderer] ${label}: Bad coordinate at index ${i}:`, coord);
                return null;
            }
            
            const lon = coord[0];
            const lat = coord[1];
            
            // CRITICAL: Check for NaN/Infinity
            if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
                console.error(`[BoundaryRenderer] ${label}: NaN/Infinity at index ${i}: [${lon}, ${lat}]`);
                return null;
            }
            
            // Check valid range
            if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
                console.error(`[BoundaryRenderer] ${label}: Out of range at index ${i}: [${lon}, ${lat}]`);
                return null;
            }
            
            // Skip consecutive duplicates
            if (lon === lastLon && lat === lastLat) {
                continue;
            }
            
            cleaned.push([lon, lat]);
            lastLon = lon;
            lastLat = lat;
        }
        
        // Ensure ring is closed (first == last)
        if (cleaned.length >= 3) {
            const first = cleaned[0];
            const last = cleaned[cleaned.length - 1];
            
            if (first[0] !== last[0] || first[1] !== last[1]) {
                // Close the ring
                cleaned.push([first[0], first[1]]);
            }
        }
        
        // Final check: need at least 3 unique points (4 after closure)
        if (cleaned.length < 4) {
            console.error(`[BoundaryRenderer] ${label}: Too few unique points after cleaning (${cleaned.length})`);
            return null;
        }
        
        return cleaned;
    }
    
    /**
     * Convert GeoJSON coordinates to Cesium Cartesian3 (with height validation)
     */
    coordinatesToCartesian(coordinates) {
        return coordinates.map(coord => {
            const lon = coord[0];
            const lat = coord[1];
            const height = 0;  // Force 0 height (clamp to ground)
            
            return Cesium.Cartesian3.fromDegrees(lon, lat, height);
        });
    }
    
    /**
     * Check if all positions are finite (NaN/Infinity guard)
     */
    allPositionsFinite(positions) {
        for (const pos of positions) {
            if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Point-in-polygon test (containsLL)
     * @param {string} countryCode - Country code to test
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {boolean} True if point is inside boundary
     */
    containsLL(countryCode, lat, lon) {
        const boundary = this.loadedBoundaries.get(countryCode);
        if (!boundary) {
            console.warn(`[BoundaryRenderer] Boundary not loaded: ${countryCode}`);
            return false;
        }
        
        const geoJson = boundary.geoJson;
        
        for (const feature of geoJson.features) {
            if (this.pointInFeature(feature, lat, lon)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Test if point is in a GeoJSON feature
     */
    pointInFeature(feature, lat, lon) {
        const geometry = feature.geometry;
        
        if (geometry.type === 'Polygon') {
            return this.pointInPolygon(geometry.coordinates, lat, lon);
        } else if (geometry.type === 'MultiPolygon') {
            for (const polygon of geometry.coordinates) {
                if (this.pointInPolygon(polygon, lat, lon)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Point-in-polygon using ray casting
     * Supports holes (inner rings)
     */
    pointInPolygon(rings, lat, lon) {
        // Outer ring (first ring)
        const outerRing = rings[0];
        if (!this.pointInRing(outerRing, lat, lon)) {
            return false;  // Not in outer ring
        }
        
        // Check holes (inner rings)
        for (let i = 1; i < rings.length; i++) {
            if (this.pointInRing(rings[i], lat, lon)) {
                return false;  // Inside a hole
            }
        }
        
        return true;  // In outer ring, not in any hole
    }
    
    /**
     * Ray casting algorithm for point-in-ring
     */
    pointInRing(ring, lat, lon) {
        let inside = false;
        
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1];
            const xj = ring[j][0], yj = ring[j][1];
            
            const intersect = ((yi > lat) !== (yj > lat)) &&
                (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
            
            if (intersect) inside = !inside;
        }
        
        return inside;
    }
    
    /**
     * Load Israel boundary (Phase 4 proof)
     */
    async loadIsrael() {
        return await this.loadBoundary('ISR', 'countries/ISR-ADM0.geojson');
    }
    
    /**
     * Load USA boundary
     */
    async loadUSA() {
        return await this.loadBoundary('USA', 'countries/USA-ADM0.geojson');
    }
    
    /**
     * Clear all boundaries
     */
    clear() {
        if (this.dataSource) {
            this.dataSource.entities.removeAll();
        }
        this.loadedBoundaries.clear();
        console.log('[BoundaryRenderer] Cleared all boundaries');
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            loadedCountries: this.loadedBoundaries.size,
            totalEntities: this.dataSource ? this.dataSource.entities.values.length : 0,
            countries: Array.from(this.loadedBoundaries.keys())
        };
    }
}
