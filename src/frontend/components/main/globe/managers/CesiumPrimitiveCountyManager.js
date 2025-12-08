/**
 * CesiumPrimitiveCountyManager.js
 * 
 * Renders county boundaries using Cesium's Primitive API for true 3D draping.
 * Uses batched geometry rendering to handle 50k+ counties without entity limits.
 * 
 * Key advantages:
 * - True 3D draping on globe surface (not 2D overlay)
 * - No entity limits (GPU-accelerated batching)
 * - Handles all 50k+ counties simultaneously
 * - Efficient memory usage
 * - Supports click/hover interactions
 */

export class CesiumPrimitiveCountyManager {
  constructor(cesiumViewer, options = {}) {
    if (!cesiumViewer) {
      throw new Error('CesiumPrimitiveCountyManager requires a Cesium viewer');
    }

    this.viewer = cesiumViewer;
    this.scene = cesiumViewer.scene;
    
    this.options = {
      lineColor: options.lineColor || window.Cesium.Color.BLACK,
      fillColor: options.fillColor || window.Cesium.Color.YELLOW.withAlpha(0.3),
      lineWidth: options.lineWidth || 2,
      debugMode: options.debugMode || false,
      ...options
    };

    // Primitive collections for batched rendering
    this.fillPrimitive = null;
    this.outlinePrimitive = null;
    
    // Geometry instances (batched)
    this.fillInstances = [];
    this.outlineInstances = [];
    
    // Data tracking
    this.loadedCountries = new Map(); // countryCode -> { features, primitive }
    this.isVisible = false;
    this.isInitialized = false;

    this._log('✅ CesiumPrimitiveCountyManager created');
  }

  /**
   * Initialize the primitive system
   */
  initialize() {
    if (this.isInitialized) {
      this._log('♻️ Already initialized');
      return true;
    }

    try {
      this._log('🔧 Initializing Cesium Primitive API for counties...');
      
      // Primitives will be created when data is loaded
      this.isInitialized = true;
      this._log('✅ Primitive system initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize primitive system:', error);
      return false;
    }
  }

  /**
   * Load county GeoJSON data for all countries
   */
  async loadCountyData(countryList) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this._log(`📂 Loading counties for ${countryList.length} countries using Primitive API...`);

    const batchSize = 5; // Load 5 countries in parallel
    const totalBatches = Math.ceil(countryList.length / batchSize);
    let loadedCount = 0;
    let failedCount = 0;

    // Process in batches
    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      const batch = countryList.slice(batchIdx * batchSize, (batchIdx + 1) * batchSize);
      
      this._log(`📦 Loading batch ${batchIdx + 1}/${totalBatches} (${batch.length} countries)...`);

      // Load batch in parallel
      const batchPromises = batch.map(countryCode => 
        this._loadCountryGeoJSON(countryCode)
          .then(result => {
            if (result.success) {
              loadedCount++;
              return { countryCode, success: true, count: result.count };
            } else {
              failedCount++;
              return { countryCode, success: false, error: result.error };
            }
          })
          .catch(error => {
            failedCount++;
            return { countryCode, success: false, error: error.message };
          })
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      // Log batch results
      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value.success) {
          this._log(`  ✅ ${batch[idx]}: ${result.value.count} counties`);
        } else {
          const error = result.status === 'fulfilled' ? result.value.error : result.reason;
          this._log(`  ❌ ${batch[idx]}: ${error}`);
        }
      });

      // Small delay between batches to keep UI responsive
      if (batchIdx < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Update primitives after all data is loaded
    this._updatePrimitives();

    this._log(`📊 Loading complete: ${loadedCount} succeeded, ${failedCount} failed`);
    return { loaded: loadedCount, failed: failedCount };
  }

  /**
   * Load GeoJSON for a single country
   */
  async _loadCountryGeoJSON(countryCode) {
    try {
      const url = `/data/boundaries/cities/${countryCode}-ADM2.geojson`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'File not found' };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const geojson = await response.json();
      
      if (!geojson || !geojson.features || geojson.features.length === 0) {
        return { success: false, error: 'Empty GeoJSON' };
      }

      // Process and add to geometry instances
      const featureCount = this._processCountryGeoJSON(countryCode, geojson);
      
      return { success: true, count: featureCount };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Timeout' };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Process GeoJSON features and create geometry instances
   */
  _processCountryGeoJSON(countryCode, geojson) {
    let featureCount = 0;

    for (const feature of geojson.features) {
      if (!feature.geometry) continue;

      try {
        const geometries = this._extractGeometries(feature.geometry);
        
        for (const geometry of geometries) {
          // Create fill geometry instance
          const fillInstance = this._createFillInstance(geometry, feature.properties);
          if (fillInstance) {
            this.fillInstances.push(fillInstance);
          }

          // Create outline geometry instance
          const outlineInstance = this._createOutlineInstance(geometry, feature.properties);
          if (outlineInstance) {
            this.outlineInstances.push(outlineInstance);
          }

          featureCount++;
        }
      } catch (error) {
        this._log(`⚠️ Failed to process feature in ${countryCode}:`, error.message);
        continue;
      }
    }

    // Store country data
    this.loadedCountries.set(countryCode, {
      features: geojson.features,
      instanceCount: featureCount
    });

    return featureCount;
  }

  /**
   * Extract geometries from GeoJSON (handles Polygon and MultiPolygon)
   */
  _extractGeometries(geometry) {
    const geometries = [];

    if (geometry.type === 'Polygon') {
      geometries.push(geometry);
    } else if (geometry.type === 'MultiPolygon') {
      // Convert MultiPolygon to individual Polygons
      for (const polygon of geometry.coordinates) {
        geometries.push({
          type: 'Polygon',
          coordinates: polygon
        });
      }
    }

    return geometries;
  }

  /**
   * Create a fill geometry instance for a polygon
   */
  _createFillInstance(geometry, properties) {
    try {
      const coordinates = geometry.coordinates[0]; // Exterior ring
      if (!coordinates || coordinates.length < 3) {
        return null;
      }

      // Simplify coordinates if too many points
      let coords = coordinates;
      if (coords.length > 500) {
        // Keep every 3rd point for very complex polygons
        coords = coords.filter((_, i) => i % 3 === 0);
      } else if (coords.length > 200) {
        // Keep every 2nd point for moderately complex polygons
        coords = coords.filter((_, i) => i % 2 === 0);
      }

      // Convert to Cesium positions
      const positions = coords.map(coord => 
        window.Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 0)
      );

      // Create polygon hierarchy
      const hierarchy = new window.Cesium.PolygonHierarchy(positions);

      // Create geometry instance with proper 3D draping
      const instance = new window.Cesium.GeometryInstance({
        geometry: new window.Cesium.PolygonGeometry({
          polygonHierarchy: hierarchy,
          height: 0, // Drape on terrain
          extrudedHeight: undefined, // No extrusion
          perPositionHeight: false,
          // Enable terrain clamping for true 3D draping
          closeTop: true,
          closeBottom: false
        }),
        attributes: {
          color: window.Cesium.ColorGeometryInstanceAttribute.fromColor(
            this.options.fillColor
          )
        },
        id: properties?.NAME || properties?.name || `county-${Date.now()}-${Math.random()}`
      });

      return instance;
    } catch (error) {
      this._log(`⚠️ Failed to create fill instance:`, error.message);
      return null;
    }
  }

  /**
   * Create an outline geometry instance for a polygon
   */
  _createOutlineInstance(geometry, properties) {
    try {
      const coordinates = geometry.coordinates[0]; // Exterior ring
      if (!coordinates || coordinates.length < 3) {
        return null;
      }

      // Simplify coordinates for outline (can be more aggressive)
      let coords = coordinates;
      if (coords.length > 300) {
        coords = coords.filter((_, i) => i % 3 === 0);
      } else if (coords.length > 150) {
        coords = coords.filter((_, i) => i % 2 === 0);
      }

      // Convert to Cesium positions
      const positions = coords.map(coord => 
        window.Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 0)
      );

      // Close the loop
      if (positions.length > 0 && 
          (positions[0].x !== positions[positions.length - 1].x ||
           positions[0].y !== positions[positions.length - 1].y)) {
        positions.push(positions[0]);
      }

      // Create polyline geometry instance with terrain clamping
      const instance = new window.Cesium.GeometryInstance({
        geometry: new window.Cesium.PolylineGeometry({
          positions: positions,
          width: this.options.lineWidth,
          height: 0, // Drape on terrain
          clampToGround: true, // Clamp to terrain for 3D draping
          followSurface: true // Follow terrain surface
        }),
        attributes: {
          color: window.Cesium.ColorGeometryInstanceAttribute.fromColor(
            this.options.lineColor
          )
        },
        id: `outline-${properties?.NAME || properties?.name || Date.now()}`
      });

      return instance;
    } catch (error) {
      this._log(`⚠️ Failed to create outline instance:`, error.message);
      return null;
    }
  }

  /**
   * Update primitives with current geometry instances
   */
  _updatePrimitives() {
    // Remove existing primitives
    this._removePrimitives();

    if (this.fillInstances.length === 0 && this.outlineInstances.length === 0) {
      this._log('⚠️ No geometry instances to render');
      return;
    }

    try {
      // Create fill primitive (polygons) with terrain clamping
      // Use GroundPrimitive for true 3D draping on terrain
      if (this.fillInstances.length > 0) {
        this.fillPrimitive = new window.Cesium.GroundPrimitive({
          geometryInstances: this.fillInstances,
          appearance: new window.Cesium.PerInstanceColorAppearance({
            closed: true,
            translucent: true,
            flat: false // Enable lighting for 3D effect
          }),
          asynchronous: false,
          releaseGeometryInstances: false, // Keep instances for updates
          allowPicking: true
        });

        this.scene.primitives.add(this.fillPrimitive);
        this._log(`✅ Added fill GroundPrimitive with ${this.fillInstances.length} instances (3D draped on terrain)`);
      }

      // Create outline primitive (polylines) with terrain clamping
      // Use GroundPrimitive for true 3D draping on terrain
      if (this.outlineInstances.length > 0) {
        this.outlinePrimitive = new window.Cesium.GroundPrimitive({
          geometryInstances: this.outlineInstances,
          appearance: new window.Cesium.PolylineColorAppearance({
            translucent: false
          }),
          asynchronous: false,
          releaseGeometryInstances: false
        });

        this.scene.primitives.add(this.outlinePrimitive);
        this._log(`✅ Added outline GroundPrimitive with ${this.outlineInstances.length} instances (3D draped on terrain)`);
      }

      // Force scene render
      this.scene.requestRender();
      
      this._log(`🎨 Primitives updated: ${this.fillInstances.length} fills, ${this.outlineInstances.length} outlines`);
    } catch (error) {
      console.error('❌ Failed to update primitives:', error);
    }
  }

  /**
   * Remove primitives from scene
   */
  _removePrimitives() {
    if (this.fillPrimitive) {
      this.scene.primitives.remove(this.fillPrimitive);
      this.fillPrimitive = null;
    }

    if (this.outlinePrimitive) {
      this.scene.primitives.remove(this.outlinePrimitive);
      this.outlinePrimitive = null;
    }
  }

  /**
   * Show county boundaries
   */
  show() {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (this.isVisible) {
      this._log('♻️ Already visible');
      return true;
    }

    // Primitives are already added when data is loaded
    // Just ensure they're visible
    if (this.fillPrimitive) {
      this.fillPrimitive.show = true;
    }
    if (this.outlinePrimitive) {
      this.outlinePrimitive.show = true;
    }

    this.isVisible = true;
    this.scene.requestRender();
    this._log('🌍 County boundaries shown (3D draped)');
    return true;
  }

  /**
   * Hide county boundaries
   */
  hide() {
    if (!this.isVisible) {
      return true;
    }

    if (this.fillPrimitive) {
      this.fillPrimitive.show = false;
    }
    if (this.outlinePrimitive) {
      this.outlinePrimitive.show = false;
    }

    this.isVisible = false;
    this.scene.requestRender();
    this._log('🌍 County boundaries hidden');
    return true;
  }

  /**
   * Handle click on county (picking)
   */
  handleClick(cartesian) {
    if (!this.isVisible) return null;

    const pickedObject = this.scene.pick(cartesian);
    if (pickedObject && pickedObject.primitive) {
      // Check if it's one of our primitives
      if (pickedObject.primitive === this.fillPrimitive || 
          pickedObject.primitive === this.outlinePrimitive) {
        
        const id = pickedObject.id;
        this._log('🗺️ County clicked:', id);
        return { id, properties: {} }; // TODO: Store properties with instances
      }
    }

    return null;
  }

  /**
   * Handle hover on county (picking)
   */
  handleHover(cartesian) {
    if (!this.isVisible) return null;

    const pickedObject = this.scene.pick(cartesian);
    if (pickedObject && pickedObject.primitive) {
      if (pickedObject.primitive === this.fillPrimitive || 
          pickedObject.primitive === this.outlinePrimitive) {
        
        const id = pickedObject.id;
        return { id, properties: {} }; // TODO: Store properties with instances
      }
    }

    return null;
  }

  /**
   * Destroy the manager
   */
  destroy() {
    this.hide();
    this._removePrimitives();
    
    this.fillInstances = [];
    this.outlineInstances = [];
    this.loadedCountries.clear();
    
    this.isInitialized = false;
    this.isVisible = false;

    this._log('🗑️ CesiumPrimitiveCountyManager destroyed');
  }

  /**
   * Logging helper
   */
  _log(...args) {
    if (this.options.debugMode) {
      console.log('[CesiumPrimitiveCounty]', ...args);
    }
  }
}

export default CesiumPrimitiveCountyManager;

