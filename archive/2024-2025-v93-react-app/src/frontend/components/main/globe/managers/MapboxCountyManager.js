/**
 * MapboxCountyManager.js
 * 
 * Manages county boundary rendering using Mapbox GL JS vector tiles.
 * Replaces the entity-based system to show ALL 50k+ counties globally.
 * 
 * Features:
 * - Loads vector tiles on-demand (only visible tiles)
 * - No entity limits (GPU-accelerated)
 * - Scales to millions of features
 * - Works around deck.gl/luma.gl conflicts
 */

export class MapboxCountyManager {
  constructor(mapboxOverlay, options = {}) {
    if (!mapboxOverlay) {
      throw new Error('MapboxCountyManager requires a MapboxCesiumOverlay instance');
    }

    this.overlay = mapboxOverlay;
    this.map = mapboxOverlay.getMap();
    
    this.options = {
      sourceId: 'county-tiles',
      layerId: 'county-boundaries',
      tileUrl: options.tileUrl || '/tiles/county/{z}/{x}/{y}.pbf',
      sourceLayer: options.sourceLayer || 'adm2',
      lineColor: options.lineColor || '#ffff00', // Yellow
      lineWidth: options.lineWidth || 2,
      debugMode: options.debugMode || false,
      ...options
    };

    this.isVisible = false;
    this.isInitialized = false;

    console.log('🟢🟢🟢 [MapboxCounty] VERSION 2.0 - YELLOW FILL DEBUG ACTIVE 🟢🟢🟢');
    this._log('✅ MapboxCountyManager created');
  }

  /**
   * Initialize the county layer
   * NOTE: Sources/layers are created per-country in loadCountyData() to avoid MapLibre limits
   */
  initialize() {
    if (this.isInitialized) {
      this._log('♻️ Already initialized');
      return true;
    }

    try {
      this._log('🔧 Initializing county boundary system (sources created per-country)...');

      // No single source/layer here - each country gets its own source/layer
      // This avoids MapLibre choking on 46k+ features in one source

      this.isInitialized = true;
      this._log('✅ County boundary system initialized (ready for per-country loading)');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize county layer:', error);
      return false;
    }
  }

  /**
   * Load county GeoJSON data
   * FIXED: Load each country as separate source/layer to avoid MapLibre choking on 46k+ features
   */
  async loadCountyData(countryCodes = ['USA', 'CHN', 'IND', 'BRA', 'RUS']) {
    if (!this.isInitialized) {
      console.error('❌ County layer not initialized');
      return false;
    }

    // Refresh map reference in case it wasn't ready during construction
    if (!this.map && this.overlay) {
      console.log('🔧 [MapboxCounty] Refreshing map reference...');
      this.map = this.overlay.getMap();
      console.log('   Map now available:', !!this.map);
    }

    if (!this.map) {
      console.error('❌ [MapboxCounty] Map is null! Cannot load counties.');
      return false;
    }

    try {
      this._log(`📂 Loading counties for ${countryCodes.length} countries (parallel batches, separate sources)...`);
      let totalCounties = 0;
      let loadedCountries = 0;

      // Load countries in parallel batches (5 at a time to avoid backend timeout)
      const BATCH_SIZE = 5;
      const FETCH_TIMEOUT = 60000; // 60 seconds per request
      const MAX_RETRIES = 2;
      
      // Helper: Fetch with timeout and retry
      const fetchWithTimeout = async (url, retries = MAX_RETRIES) => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
            
            const response = await fetch(url, { 
              signal: controller.signal,
              headers: {
                'Accept': 'application/json'
              }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              return await response.json();
            } else if (response.status === 404) {
              return null; // File doesn't exist, not an error
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              if (attempt < retries) {
                console.warn(`⏱️ [MapboxCounty] Timeout for ${url}, retrying (${attempt + 1}/${retries})...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
                continue;
              }
              throw new Error(`Timeout after ${retries + 1} attempts`);
            }
            if (attempt < retries) {
              console.warn(`🔄 [MapboxCounty] Error fetching ${url}, retrying (${attempt + 1}/${retries})...`, error.message);
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
              continue;
            }
            throw error;
          }
        }
      };
      
      for (let i = 0; i < countryCodes.length; i += BATCH_SIZE) {
        const batch = countryCodes.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(countryCodes.length / BATCH_SIZE);
        
        console.log(`📦 [MapboxCounty] Loading batch ${batchNum}/${totalBatches} (${batch.length} countries)...`);
        
        // Load batch in parallel
        const batchPromises = batch.map(async (code) => {
          try {
            const geojson = await fetchWithTimeout(`/data/boundaries/cities/${code}-ADM2.geojson`);
            if (geojson && geojson.features && geojson.features.length > 0) {
              if (geojson.features && geojson.features.length > 0) {
                const countrySourceId = `${this.options.sourceId}-${code}`;
                const countryLayerId = `${this.options.layerId}-${code}`;
                
                // Add source for this country
                if (!this.map.getSource(countrySourceId)) {
                  this.overlay.addSource(countrySourceId, {
                    type: 'geojson',
                    data: geojson
                  });
                } else {
                  // Update existing source
                  const source = this.map.getSource(countrySourceId);
                  if (source && source.setData) {
                    source.setData(geojson);
                  }
                }

                // Add layer for this country (if not exists)
                if (!this.map.getLayer(countryLayerId)) {
                  this.overlay.addLayer({
                    id: countryLayerId,
                    type: 'line',
                    source: countrySourceId,
                    layout: {
                      'line-join': 'round',
                      'line-cap': 'round',
                      visibility: 'visible' // Start visible
                    },
                    paint: {
                      'line-color': this.options.lineColor,
                      'line-width': this.options.lineWidth,
                      'line-opacity': 0.8
                    }
                  });

                  // Add fill layer for this country
                  const fillLayerId = `${countryLayerId}-fill`;
                  if (!this.map.getLayer(fillLayerId)) {
                    this.overlay.addLayer({
                      id: fillLayerId,
                      type: 'fill',
                      source: countrySourceId,
                      layout: {
                        visibility: 'visible'
                      },
                      paint: {
                        'fill-color': '#FFFF00', // BRIGHT YELLOW
                        'fill-opacity': 0.7
                      }
                    });
                  }
                }

                totalCounties += geojson.features.length;
                loadedCountries++;
                this._log(`  ✅ ${code}: ${geojson.features.length} counties (source: ${countrySourceId})`);
                return { success: true, code, count: geojson.features.length };
              } else {
                this._log(`  ⚠️ ${code}: No features in GeoJSON`);
                return { success: false, code, error: 'No features' };
              }
            } else {
              this._log(`  ⚠️ ${code}: Not found (404)`);
              return { success: false, code, error: 'Not found' };
            }
          } catch (error) {
            this._log(`  ❌ ${code}: ${error.message}`);
            console.error(`   Full error:`, error);
            return { success: false, code, error: error.message };
          }
        });

        // Wait for batch to complete
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Log batch summary
        const batchSuccess = batchResults.filter(r => r.status === 'fulfilled' && r.value?.success).length;
        const batchFailed = batchResults.length - batchSuccess;
        console.log(`   Batch ${batchNum} complete: ${batchSuccess} succeeded, ${batchFailed} failed`);
        
        // Longer delay between batches to avoid backend timeout
        if (i + BATCH_SIZE < countryCodes.length) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay between batches
        }
      }

      const failedCountries = countryCodes.length - loadedCountries;
      console.log(`✅ [MapboxCounty] Loading complete:`);
      console.log(`   ✅ Loaded: ${loadedCountries} countries (${totalCounties} total counties)`);
      if (failedCountries > 0) {
        console.log(`   ⚠️ Failed: ${failedCountries} countries`);
      }
      console.log(`   📊 Success rate: ${Math.round((loadedCountries / countryCodes.length) * 100)}%`);
      console.log(`   ℹ️ Each country uses a separate source to avoid MapLibre's 46k+ feature limit`);
      
      if (loadedCountries === 0) {
        console.error('❌ [MapboxCounty] No countries loaded successfully!');
        return false;
      }
      
      return true;

    } catch (error) {
      console.error('❌ Failed to load county data:', error);
      return false;
    }
  }

  /**
   * Show county boundaries
   */
  show() {
    console.log('🔧 [MapboxCounty] show() called');
    console.log('   isInitialized:', this.isInitialized);
    console.log('   isVisible:', this.isVisible);
    console.log('   overlay:', !!this.overlay);
    console.log('   map:', !!this.map);
    console.log('   layerId:', this.options.layerId);
    
    if (!this.isInitialized) {
      console.error('❌ County layer not initialized');
      return false;
    }

    // Refresh map reference in case it wasn't ready
    if (!this.map && this.overlay) {
      console.log('🔧 [MapboxCounty] Refreshing map reference in show()...');
      this.map = this.overlay.getMap();
      console.log('   Map now available:', !!this.map);
    }

    if (this.isVisible) {
      this._log('⚠️ Counties already visible');
      return true;
    }

    try {
      // Show ALL country-specific layers (each country has its own layer)
      const style = this.map.getStyle();
      if (style && style.layers) {
        let visibleLayers = 0;
        const layerPrefix = this.options.layerId;
        
        // Find all county layers (format: county-layer-XXX or county-layer-XXX-fill)
        style.layers.forEach(layer => {
          if (layer.id.startsWith(layerPrefix + '-')) {
            try {
              this.map.setLayoutProperty(layer.id, 'visibility', 'visible');
              visibleLayers++;
            } catch (e) {
              console.warn(`⚠️ [MapboxCounty] Could not show layer ${layer.id}:`, e);
            }
          }
        });
        
        console.log(`✅ [MapboxCounty] Made ${visibleLayers} country layers visible`);
      } else {
        console.warn('⚠️ [MapboxCounty] Map style not loaded or has no layers');
      }
      
      this.isVisible = true;
      this._log('🌍 County boundaries shown');
      
      // DIAGNOSTIC: Check if map canvas is rendering
      if (this.map) {
        const canvas = this.map.getCanvas();
        const style = this.map.getStyle();
        
        // Count country-specific layers
        let countryLayers = 0;
        let visibleCountryLayers = 0;
        let totalFeatures = 0;
        
        if (style && style.layers) {
          style.layers.forEach(layer => {
            if (layer.id.startsWith(this.options.layerId + '-') && !layer.id.endsWith('-fill')) {
              countryLayers++;
              if (this.map.getLayoutProperty(layer.id, 'visibility') === 'visible') {
                visibleCountryLayers++;
              }
              
              // Count features in source
              const sourceId = layer.source;
              const source = this.map.getSource(sourceId);
              if (source && source._data && source._data.features) {
                totalFeatures += source._data.features.length;
              }
            }
          });
        }
        
        console.log('🔍 [MapboxCounty] Map canvas diagnostic:', {
          canvasExists: !!canvas,
          canvasWidth: canvas?.width,
          canvasHeight: canvas?.height,
          canvasVisible: canvas ? window.getComputedStyle(canvas).display !== 'none' : false,
          mapLoaded: this.map.loaded(),
          mapStyleLoaded: !!style,
          countryLayersCount: countryLayers,
          visibleCountryLayers: visibleCountryLayers,
          totalFeaturesAcrossAllSources: totalFeatures
        });
        
        if (countryLayers === 0) {
          console.warn('⚠️ [MapboxCounty] No country layers found! Counties may not have loaded yet.');
        }
        
        // Force a repaint
        this.map.triggerRepaint();
        console.log('🔄 [MapboxCounty] Triggered map repaint');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to show counties:', error);
      console.error('   Error details:', error.stack);
      return false;
    }
  }

  /**
   * Hide county boundaries
   */
  hide() {
    if (!this.isInitialized) {
      return false;
    }

    if (!this.isVisible) {
      this._log('⚠️ Counties already hidden');
      return true;
    }

    try {
      // Hide ALL country-specific layers
      if (this.map) {
        const style = this.map.getStyle();
        if (style && style.layers) {
          let hiddenLayers = 0;
          const layerPrefix = this.options.layerId;
          
          style.layers.forEach(layer => {
            if (layer.id.startsWith(layerPrefix + '-')) {
              try {
                this.map.setLayoutProperty(layer.id, 'visibility', 'none');
                hiddenLayers++;
              } catch (e) {
                console.warn(`⚠️ [MapboxCounty] Could not hide layer ${layer.id}:`, e);
              }
            }
          });
          
          console.log(`✅ [MapboxCounty] Hid ${hiddenLayers} country layers`);
        }
      }
      
      this.isVisible = false;
      this._log('🌍 County boundaries hidden');
      return true;
    } catch (error) {
      console.error('❌ Failed to hide counties:', error);
      return false;
    }
  }

  /**
   * Toggle visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update layer style
   */
  updateStyle(styleConfig) {
    if (!this.isInitialized || !this.map) return false;

    try {
      if (styleConfig.lineColor) {
        this.map.setPaintProperty(
          this.options.layerId,
          'line-color',
          styleConfig.lineColor
        );
      }

      if (styleConfig.lineWidth !== undefined) {
        this.map.setPaintProperty(
          this.options.layerId,
          'line-width',
          styleConfig.lineWidth
        );
      }

      if (styleConfig.lineOpacity !== undefined) {
        this.map.setPaintProperty(
          this.options.layerId,
          'line-opacity',
          styleConfig.lineOpacity
        );
      }

      this._log('✅ Layer style updated');
      return true;
    } catch (error) {
      console.error('❌ Failed to update style:', error);
      return false;
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      visible: this.isVisible,
      sourceId: this.options.sourceId,
      layerId: this.options.layerId
    };
  }

  /**
   * Destroy the county manager
   */
  destroy() {
    if (this.isInitialized && this.map) {
      try {
        this.overlay.removeLayer(this.options.layerId);
        // Note: Don't remove source as other layers might use it
        this._log('🗑️ County layer destroyed');
      } catch (error) {
        console.error('❌ Error during destroy:', error);
      }
    }

    this.isInitialized = false;
    this.isVisible = false;
  }

  /**
   * Logging helper
   */
  _log(...args) {
    if (this.options.debugMode) {
      console.log('[MapboxCounty]', ...args);
    }
  }
}

export default MapboxCountyManager;

