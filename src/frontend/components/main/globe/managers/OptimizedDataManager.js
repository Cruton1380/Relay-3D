// ============================================================================
// OptimizedDataManager.js - Streamlined Data Loading & Management
// ============================================================================
// Single source of truth for all geographic data with instant loading
// ============================================================================

export class OptimizedDataManager {
  constructor(viewer, entitiesRef) {
    this.viewer = viewer;
    this.entitiesRef = entitiesRef;
    
    // Data cache for instant loading
    this.dataCache = new Map();
    this.entityCache = new Map();
    
    // Performance settings
    this.maxEntities = null; // No limit - load all provinces
    this.loadTimeout = 10000; // 10 second max (increased for large datasets)
    
    // Initialize conflict resolver (will be set by OptimizedGlobeManager)
    this.conflictResolver = null;
    
    // Hover state management
    this.lastHoveredEntity = null;
    this.hoverHandlers = {
      move: null,
      click: null
    };
    
    console.log('🚀 OptimizedDataManager initialized');
  }

  // ============================================================================
  // INSTANT DATA LOADING
  // ============================================================================

  async loadProvinces() {
    const startTime = performance.now();
    
    // Check if already loading
    if (this.isLoadingProvinces) {
      console.log('⚠️ Provinces already loading, skipping duplicate request');
      return 0;
    }
    
    // Check if already loaded
    if (this.entityCache.size > 0) {
      console.log('⚠️ Provinces already loaded, skipping');
      return this.entityCache.size;
    }
    
    this.isLoadingProvinces = true;
    
    try {
        // Check cache first
        if (this.dataCache.has('provinces')) {
          console.log('⚡ Loading provinces from cache (instant)');
          const count = this.createProvinceEntities(this.dataCache.get('provinces'));
          
          // Set up hover functionality after loading from cache
          this.setupProvinceHover();
          
          return count;
        }

      // Fetch with extended timeout for large datasets
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Province fetch timeout, aborting request...');
        controller.abort();
      }, this.loadTimeout);

      console.log('🌐 Fetching province data from Natural Earth...');
      
      // Check network connectivity first
      if (!navigator.onLine) {
        throw new Error('No internet connection available');
      }
      
      // Try multiple data sources for better reliability
      const dataSources = [
        'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson',
        'https://cdn.jsdelivr.net/npm/natural-earth-vector@latest/geojson/ne_10m_admin_1_states_provinces.geojson',
        'https://unpkg.com/natural-earth-vector@latest/geojson/ne_10m_admin_1_states_provinces.geojson'
      ];
      
      let response = null;
      let lastError = null;
      
      for (const url of dataSources) {
        try {
          console.log(`🌐 Trying data source: ${url}`);
          response = await fetch(url, { 
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (response.ok) {
            console.log(`✅ Successfully connected to: ${url}`);
            break;
          } else {
            console.warn(`⚠️ HTTP ${response.status} from: ${url}`);
            response = null;
          }
        } catch (error) {
          console.warn(`⚠️ Failed to fetch from: ${url}`, error.message);
          lastError = error;
          response = null;
        }
      }
      
      if (!response) {
        throw lastError || new Error('All data sources failed');
      }

      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Cache the data for instant future loads
      this.dataCache.set('provinces', data);
      
      const endTime = performance.now();
      console.log(`⚡ Province data loaded in ${(endTime - startTime).toFixed(0)}ms`);
      
        const count = this.createProvinceEntities(data);
        
        // Set up hover functionality after loading
        this.setupProvinceHover();
        
        return count;
      
    } catch (error) {
      console.error('❌ Province loading failed:', error);
      
      // Try fallback source if primary fails (network errors, timeouts, etc.)
      if (error.name === 'AbortError' || 
          error.name === 'TypeError' || 
          error.message.includes('timeout') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError')) {
        console.log('🔄 Trying fallback province source...');
        try {
          return await this.loadProvincesFallback();
        } catch (fallbackError) {
          console.error('❌ Fallback province loading also failed:', fallbackError);
          throw new Error(`Province loading failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
        }
      }
      
      throw error;
    } finally {
      this.isLoadingProvinces = false;
    }
  }

  // Fallback province loading from alternative source
  async loadProvincesFallback() {
    console.log('🔄 Loading provinces from fallback source (50m resolution)...');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Fallback province fetch timeout...');
        controller.abort();
      }, this.loadTimeout);

      const response = await fetch(
        'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson',
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );

      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Cache the fallback data
      this.dataCache.set('provinces', data);
      
      const count = this.createProvinceEntities(data);
      
      // Set up hover functionality after loading
      this.setupProvinceHover();
      
      console.log(`✅ Fallback province loading completed: ${count} entities`);
      return count;
      
    } catch (error) {
      console.error('❌ Fallback province loading failed:', error);
      
      // Try local test data as final fallback
      console.log('🔄 Trying local test data as final fallback...');
      try {
        return await this.loadProvincesLocalFallback();
      } catch (localError) {
        console.error('❌ Local fallback also failed:', localError);
        throw new Error(`All province loading methods failed. Primary: ${error.message}, Local: ${localError.message}`);
      }
    }
  }

  // Local fallback with basic test provinces
  async loadProvincesLocalFallback() {
    console.log('🔄 Loading local test provinces...');
    
    try {
      // Create more realistic test data for major countries with better shapes
      const testProvinces = {
        type: "FeatureCollection",
        features: [
          // United States - California (more realistic shape)
          {
            type: "Feature",
            properties: { NAME: "California", ADMIN: "United States" },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [-124.4, 32.5], [-120.0, 32.5], [-116.0, 33.0], [-114.1, 34.0], 
                [-114.1, 36.0], [-115.0, 37.0], [-118.0, 38.0], [-120.0, 39.0], 
                [-122.0, 40.0], [-124.0, 41.0], [-124.4, 42.0], [-124.4, 32.5]
              ]]
            }
          },
          // United States - Texas (more realistic shape)
          {
            type: "Feature",
            properties: { NAME: "Texas", ADMIN: "United States" },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [-106.6, 25.8], [-103.0, 25.8], [-100.0, 26.5], [-97.0, 28.0], 
                [-95.0, 30.0], [-93.5, 32.0], [-93.5, 34.0], [-95.0, 36.0], 
                [-98.0, 36.5], [-102.0, 36.5], [-106.6, 36.5], [-106.6, 25.8]
              ]]
            }
          },
          // Canada - Ontario (more realistic shape)
          {
            type: "Feature",
            properties: { NAME: "Ontario", ADMIN: "Canada" },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [-95.2, 41.7], [-90.0, 42.0], [-85.0, 43.0], [-80.0, 44.0], 
                [-76.0, 45.0], [-74.3, 46.0], [-74.3, 48.0], [-76.0, 50.0], 
                [-80.0, 52.0], [-85.0, 54.0], [-90.0, 55.0], [-95.2, 56.9], [-95.2, 41.7]
              ]]
            }
          },
          // Australia - New South Wales (more realistic shape)
          {
            type: "Feature",
            properties: { NAME: "New South Wales", ADMIN: "Australia" },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [141.0, -37.5], [145.0, -37.0], [148.0, -36.0], [150.0, -34.0], 
                [152.0, -32.0], [153.6, -30.0], [153.6, -28.2], [151.0, -28.5], 
                [148.0, -29.0], [145.0, -30.0], [142.0, -32.0], [141.0, -35.0], [141.0, -37.5]
              ]]
            }
          },
          // Germany - Bavaria (more realistic shape)
          {
            type: "Feature",
            properties: { NAME: "Bavaria", ADMIN: "Germany" },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [8.9, 47.3], [10.0, 47.0], [11.0, 47.5], [12.0, 48.0], 
                [12.5, 49.0], [13.0, 50.0], [13.8, 50.6], [12.5, 50.0], 
                [11.0, 49.5], [10.0, 49.0], [9.0, 48.0], [8.9, 47.3]
              ]]
            }
          },
          // France - Île-de-France
          {
            type: "Feature",
            properties: { NAME: "Île-de-France", ADMIN: "France" },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [1.4, 48.1], [2.0, 48.0], [2.5, 48.2], [3.0, 48.5], 
                [3.2, 49.0], [2.8, 49.2], [2.0, 49.0], [1.5, 48.8], 
                [1.2, 48.5], [1.4, 48.1]
              ]]
            }
          },
          // Italy - Lombardy
          {
            type: "Feature",
            properties: { NAME: "Lombardy", ADMIN: "Italy" },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [8.5, 45.0], [9.5, 45.2], [10.5, 45.5], [11.0, 46.0], 
                [10.8, 46.5], [10.0, 46.8], [9.0, 46.5], [8.5, 46.0], 
                [8.3, 45.5], [8.5, 45.0]
              ]]
            }
          },
          // Spain - Catalonia
          {
            type: "Feature",
            properties: { NAME: "Catalonia", ADMIN: "Spain" },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [0.0, 40.5], [1.0, 40.8], [2.0, 41.0], [3.0, 41.5], 
                [3.2, 42.5], [2.8, 43.0], [2.0, 42.8], [1.0, 42.5], 
                [0.5, 42.0], [0.0, 41.0], [0.0, 40.5]
              ]]
            }
          },
          // United Kingdom - England
          {
            type: "Feature",
            properties: { NAME: "England", ADMIN: "United Kingdom" },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [-5.5, 49.8], [-4.0, 50.0], [-2.0, 50.5], [-1.0, 51.0], 
                [-0.5, 51.5], [-1.0, 52.0], [-2.0, 52.5], [-3.0, 53.0], 
                [-4.0, 53.5], [-5.0, 54.0], [-5.5, 53.5], [-5.5, 49.8]
              ]]
            }
          }
        ]
      };
      
      // Cache the test data
      this.dataCache.set('provinces', testProvinces);
      
      const count = this.createProvinceEntities(testProvinces);
      
      // Set up hover functionality after loading
      this.setupProvinceHover();
      
      console.log(`✅ Local test province loading completed: ${count} entities`);
      return count;
      
    } catch (error) {
      console.error('❌ Local test province loading failed:', error);
      throw error;
    }
  }

  // Set up hover functionality for provinces
  setupProvinceHover() {
    console.log('🏛️ Setting up province hover functionality...');
    
    const Cesium = window.Cesium;
    
    // Remove existing handlers if any
    if (this.hoverHandlers.move) {
      this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
    
    // Add mouse move handler for hover effects
    this.hoverHandlers.move = this.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction((event) => {
      // Add comprehensive checks for mouse position to prevent DeveloperError
      if (!event.endPosition && !event.position) { 
        return;
      }
      
      // Use endPosition for MOUSE_MOVE events, fallback to position
      const mousePosition = event.endPosition || event.position;
      if (!mousePosition) {
        return;
      }
      
      const pickedObject = this.viewer.scene.pick(mousePosition);
      
      if (pickedObject && pickedObject.id) {
        const entity = pickedObject.id;
        
        // Only handle province entities
        if (entity.id && entity.id.startsWith('province:')) {
          this.highlightProvince(entity);
        } else {
          this.clearHoverEffect();
        }
      } else {
        this.clearHoverEffect();
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    
    console.log('✅ Province hover functionality set up');
  }

  // ============================================================================
  // STREAMLINED ENTITY CREATION
  // ============================================================================

  createProvinceEntities(data) {
    const startTime = performance.now();
    let created = 0;
    let skipped = 0;
    
    // Process ALL features (no artificial limit)
    const features = data.features;
    console.log(`📊 Processing ${features.length} province features...`);
    
    for (const feature of features) {
      try {
        const entity = this.createSingleProvinceEntity(feature);
        if (entity) {
          this.entityCache.set(entity.id, entity);
          created++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.warn('⚠️ Skipping invalid province:', error.message);
        skipped++;
      }
    }
    
    const endTime = performance.now();
    console.log(`⚡ Created ${created} province entities in ${(endTime - startTime).toFixed(0)}ms (${skipped} skipped)`);
    
    return created;
  }

  createSingleProvinceEntity(feature) {
    try {
      const Cesium = window.Cesium;
      const props = feature.properties || {};
      const name = props.NAME || props.name || 'Unknown Province';
      const country = props.ADMIN || props.country || 'Unknown Country';
      
      // Convert GeoJSON to Cesium coordinates
      const coordinates = this.simpleGeoJSONToCesium(feature.geometry);
      if (!coordinates || coordinates.length < 3) {
        console.warn(`⚠️ Skipping province ${name}: Invalid coordinates (${coordinates?.length || 0} points)`);
        return null;
      }
      
      // Generate unique entity ID
      const entityId = `province:${name}:${Date.now()}`;
      
      // Create entity with full properties like original system
      const entity = this.viewer.entities.add({
        id: entityId,
        name: name,
        polygon: {
          hierarchy: coordinates,
          material: Cesium.Color.LIGHTGREEN.withAlpha(0.3),
          outline: true,
          outlineColor: Cesium.Color.GREEN,
          outlineWidth: 2,
          height: 0,
          extrudedHeight: 0,
          classificationType: Cesium.ClassificationType.TERRAIN
        },
        properties: {
          type: 'province',
          name: name,
          country: country,
          created: new Date().toISOString(),
          source: 'natural_earth'
        }
      });
      
      // Register entity ownership and in entitiesRef
      if (this.conflictResolver) {
        this.conflictResolver.registerEntity(entity, 'geographic');
      }
      
      if (this.entitiesRef?.current) {
        this.entitiesRef.current.set(entity.id, entity);
      }
      
      return entity;
    } catch (error) {
      console.error(`❌ Error creating province entity:`, error);
      return null;
    }
  }

  // ============================================================================
  // SIMPLIFIED UTILITIES
  // ============================================================================

  simpleGeoJSONToCesium(geometry) {
    if (!geometry || !geometry.coordinates) return null;
    
    const Cesium = window.Cesium;
    
    try {
      if (geometry.type === 'Polygon') {
        if (!geometry.coordinates[0] || geometry.coordinates[0].length < 3) {
          return null;
        }
        return geometry.coordinates[0].map(coord => 
          Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
        );
      }
      
      if (geometry.type === 'MultiPolygon') {
        // Use largest polygon
        const largest = geometry.coordinates.reduce((max, poly) => 
          poly[0].length > max[0].length ? poly : max
        );
        if (!largest[0] || largest[0].length < 3) {
          return null;
        }
        return largest[0].map(coord => 
          Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
        );
      }
      
      // Handle other geometry types
      if (geometry.type === 'Point') {
        return [Cesium.Cartesian3.fromDegrees(geometry.coordinates[0], geometry.coordinates[1])];
      }
      
      console.warn(`⚠️ Unsupported geometry type: ${geometry.type}`);
      return null;
    } catch (error) {
      console.warn(`⚠️ Error converting geometry: ${error.message}`);
      return null;
    }
  }

  // ============================================================================
  // HOVER FUNCTIONALITY
  // ============================================================================

  highlightProvince(entity) {
    // Avoid redundant updates
    if (this.lastHoveredEntity === entity) return;
    
    // Clear previous hover
    this.clearHoverEffect();
    
    // Apply highlight styling
    const Cesium = window.Cesium;
    entity.polygon.material = Cesium.Color.LIGHTGREEN.withAlpha(0.6);
    entity.polygon.outlineColor = Cesium.Color.WHITE;
    entity.polygon.outlineWidth = 3;
    
    // Store reference
    this.lastHoveredEntity = entity;
    
    // Log hover info
    const name = entity.name || 'Unknown Province';
    const country = entity.properties?.country?.getValue?.() || entity.properties?.country || 'Unknown Country';
    console.log(`🏛️ Province hover: ${name}, ${country}`);
  }

  clearHoverEffect() {
    if (this.lastHoveredEntity) {
      const Cesium = window.Cesium;
      
      // Restore original styling
      this.lastHoveredEntity.polygon.material = Cesium.Color.LIGHTGREEN.withAlpha(0.3);
      this.lastHoveredEntity.polygon.outlineColor = Cesium.Color.GREEN;
      this.lastHoveredEntity.polygon.outlineWidth = 2;
      
      this.lastHoveredEntity = null;
    }
  }

  // ============================================================================
  // CLEANUP & MANAGEMENT
  // ============================================================================

  clearAll() {
    // Clear hover effects
    this.clearHoverEffect();
    
    // Remove hover handlers
    if (this.hoverHandlers.move) {
      const Cesium = window.Cesium;
      this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      this.hoverHandlers.move = null;
    }
    
    // Clear geographic entities using conflict resolver
    let cleared = 0;
    if (this.conflictResolver) {
      cleared = this.conflictResolver.clearByOwner('geographic');
    } else {
      // Fallback: clear all entities
      this.entityCache.forEach(entity => {
        this.viewer.entities.remove(entity);
      });
      cleared = this.entityCache.size;
    }
    
    // Clear local caches
    this.entityCache.clear();
    this.dataCache.clear();
    
    console.log(`🧹 OptimizedDataManager cleared ${cleared} entities`);
  }

  getStats() {
    return {
      cachedData: this.dataCache.size,
      cachedEntities: this.entityCache.size,
      viewerEntities: this.viewer.entities.values.length
    };
  }
}
