// ============================================================================
// AdministrativeHierarchy.js - Standardized Administrative Layer Management
// ============================================================================
// Implements ISO 3166-1, GADM, OpenStreetMap, UN M.49 standards
// ============================================================================

import * as turf from '@turf/turf';
import * as topojson from 'topojson-server';
import * as topojsonClient from 'topojson-client';

export class AdministrativeHierarchy {
  constructor(viewer, entitiesRef) {
    this.viewer = viewer;
    this.entitiesRef = entitiesRef;
    
    // Cache for loaded data to prevent re-fetching (initialize early)
    this.dataCache = {
      provinces: null,
      cities: null,
      countries: null,
      continents: null
    };
    
    // Entity cache for persistence and performance
    this.entityCache = new Map(); // entityId -> entity
    this.loadedLayers = new Set(); // Track loaded layers to prevent reloading
    
    // Layer definitions following global standards
    this.layers = {
      gps: {
        level: 0,
        name: 'GPS',
        description: 'Point-level coordinates',
        dataSource: 'user_input',
        othersRule: null // No Others at GPS level
      },
      neighborhood: {
        level: 1,
        name: 'Neighborhood',
        description: 'Boroughs, wards, districts, postal boundaries',
        dataSource: 'osm_local',
        othersRule: 'city_boundary - sum(neighborhoods_in_city)',
        naming: 'Others - [City Name], [Country Name]'
      },
      city: {
        level: 2,
        name: 'City',
        description: 'Urban administrative units',
        dataSource: 'natural_earth',
        othersRule: 'province_boundary - sum(cities_in_province)',
        naming: 'Others - [Province Name], [Country Name]'
      },
      county: {
        level: 2.5,
        name: 'County/District',
        description: 'Second-level subnational divisions (counties, districts, departments)',
        dataSource: 'geoboundaries',
        fallback: 'local_files',
        othersRule: 'province_boundary - sum(counties_in_province)',
        naming: 'Others - [Province Name], [Country Name]'
      },
      province: {
        level: 3,
        name: 'Province/State',
        description: 'First-level subnational divisions',
        dataSource: 'natural_earth',
        othersRule: 'country_boundary - sum(provinces_in_country)',
        naming: 'Others - [Country Name]'
      },
      country: {
        level: 4,
        name: 'Country',
        description: 'ISO 3166-1 polygon boundaries',
        dataSource: 'natural_earth',
        othersRule: 'continent_boundary - sum(countries_in_continent)',
        naming: 'Others - [Continent Name]'
      },
      continent: {
        level: 5,
        name: 'Continent',
        description: 'UN M.49 continent definitions',
        dataSource: 'un_m49',
        othersRule: null // No Others at continent level
      }
    };

    // Entity storage by level
    this.entities = {
      gps: new Map(),
      neighborhood: new Map(),
      city: new Map(),
      county: new Map(),
      province: new Map(),
      country: new Map(),
      continent: new Map(), // For fallback compatibility
      macro_region: new Map()
    };

    // Others entities by level
    this.othersEntities = {
      neighborhood: new Map(),
      city: new Map(),
      county: new Map(),
      province: new Map(),
      country: new Map()
    };

    // Data sources configuration
    this.dataSources = {
      natural_earth: {
        countries: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson',
        provinces: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson',
        cities: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_urban_areas.geojson'
      },
      geoboundaries: {
        api: 'https://www.geoboundaries.org/api/current/gbOpen',
        getCounties: (countryCode) => `https://www.geoboundaries.org/api/current/gbOpen/${countryCode}/ADM2/`
      },
      osm_local: {
        neighborhoods: 'https://overpass-api.de/api/interpreter?data=[out:json];(relation["admin_level"="8"]["boundary"="administrative"];);out geom;'
      },
      un_m49: {
        continents: 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'
      }
    };

    if (this.DEBUG) console.log('🏛️ AdministrativeHierarchy initialized with standardized layers');
    
    // Hover functionality is handled by RegionManager for consistency
    
    // Protect entities from being cleared by other systems
    this.protectEntities();
    
    // Provinces will now only load when explicitly requested via the UI
    // Removed automatic preloading to prevent unwanted loading when region manager opens
    
    // Don't restore entity state during initialization - wait for actual layer loading
    // this.restoreEntityState();
  }

  // Load a specific administrative layer
  async loadLayer(layerType) {
    if (this.DEBUG) console.log(`🌍 Loading ${this.layers[layerType].name} layer...`);
    
    // Check if layer is already loaded using optimized cache system
    if (this.loadedLayers.has(layerType)) {
      const entityCount = this.entities[layerType].size;
      console.log(`✅ ${this.layers[layerType].name} layer already loaded with ${entityCount} entities, skipping...`);
      return { success: true, layerType, alreadyLoaded: true, entityCount };
    }
    
    try {
      switch (layerType) {
        case 'neighborhood':
          await this.loadNeighborhoods();
          break;
        case 'city':
          await this.loadCities();
          break;
        case 'county':
          await this.loadCounties();
          break;
        case 'province':
          await this.loadProvinces();
          break;
        case 'country':
          await this.loadCountries();
          break;
        case 'continent':
        case 'macro_region':
          await this.loadMacroRegions();
          break;
        default:
          throw new Error(`Unknown layer type: ${layerType}`);
      }

      // Generate Others entities automatically
      await this.generateOthersForLayer(layerType);
      
      // Save entity state for persistence
      this.saveEntityState();
      
      // Check entity integrity
      this.checkEntityIntegrity();
      
      console.log(`✅ ${this.layers[layerType].name} layer loaded successfully`);
      return { success: true, layerType };
      
    } catch (error) {
      console.error(`❌ Error loading ${layerType} layer:`, error);
      return { success: false, error: error.message };
    }
  }

  // Load neighborhood boundaries from OSM/local sources
  async loadNeighborhoods() {
    console.log('🏘️ Loading neighborhood boundaries...');
    
    try {
      // For now, we'll use a simplified approach
      // In production, this would integrate with OSM Overpass API
      const response = await fetch(this.dataSources.osm_local.neighborhoods);
      if (!response.ok) {
        throw new Error(`Failed to fetch neighborhood data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📊 Found ${data.elements?.length || 0} neighborhood features`);
      
      // Process neighborhood features
      if (data.elements) {
        for (const element of data.elements) {
          await this.createNeighborhoodEntity(element);
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Neighborhood loading failed, using fallback:', error);
      // Fallback: create synthetic neighborhoods from city data
      await this.createSyntheticNeighborhoods();
    }
  }

  // Load city boundaries
  async loadCities() {
    console.log('🏙️ Loading city boundaries...');
    const startTime = performance.now();
    
    try {
      const response = await fetch(this.dataSources.natural_earth.cities);
      if (!response.ok) {
        throw new Error(`Failed to fetch city data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📊 Found ${data.features?.length || 0} city features`);
      
      // Optimized batch processing for cities (same as provinces)
      let successCount = 0;
      let errorCount = 0;
      
      // Pre-filter features to avoid processing invalid ones
      const validFeatures = data.features.filter(feature => 
        feature && feature.geometry && feature.properties
      );
      
      console.log(`📊 Processing ${validFeatures.length} valid city features (filtered from ${data.features.length})`);
      
      // Process in larger batches for maximum performance
      const batchSize = 200; // Much larger batch size for speed
      
      for (let i = 0; i < validFeatures.length; i += batchSize) {
        const batch = validFeatures.slice(i, i + batchSize);
        
        // Process batch in parallel with optimized error handling
        const batchPromises = batch.map(async (feature) => {
          try {
            await this.createCityEntity(feature);
            return { success: true };
          } catch (error) {
            // Only log errors in debug mode to reduce console spam
            if (this.DEBUG) {
              console.error(`❌ Error processing city feature:`, error);
            }
            return { success: false, error };
          }
        });
        
        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Count results efficiently
        successCount += batchResults.filter(r => r.success).length;
        errorCount += batchResults.filter(r => !r.success).length;
        
        // Minimal progress logging for performance
        if (validFeatures.length > 5000 && (i + batchSize) % 10000 === 0) {
          console.log(`📊 Processed ${Math.min(i + batchSize, validFeatures.length)}/${validFeatures.length} cities...`);
        }
      }
      
      const endTime = performance.now();
      const loadTime = (endTime - startTime) / 1000;
      
      console.log(`✅ Created ${successCount} city entities (${errorCount} errors) in ${loadTime.toFixed(2)}s`);
      
      // Mark layer as loaded for future reference
      this.loadedLayers.add('city');
      
      console.log(`✅ City layer loaded successfully`);
      
    } catch (error) {
      console.error('❌ Error loading cities:', error);
      throw error;
    }
  }

  // Load county/district boundaries (ADM2) - GLOBAL LOADER FOR ALL COUNTRIES
  async loadCounties(options = {}) {
    console.log(`🏛️ Loading county/district boundaries GLOBALLY...`);
    const startTime = performance.now();
    
    // Set loading flag to prevent interference from other systems
    this.isLoadingCounties = true;
    console.log(`🔒 County loading flag set - protecting from interference`);
    
    const {
      useCache = true,
      simplified = true,
      visible = true,
      outlineWidth = 1,
      outlineColor = window.Cesium.Color.BLACK,
      countryCodes = null // Optional: filter to specific countries
    } = options;
    
    try {
      // CLEAR existing county entities first (important for re-loading)
      const existingCounties = Array.from(this.entities.county.values());
      if (existingCounties.length > 0) {
        console.log(`🧹 Clearing ${existingCounties.length} existing county entities...`);
        existingCounties.forEach(entity => {
          this.viewer.entities.remove(entity);
        });
        this.entities.county.clear();
        this.loadedLayers.delete('county');
      }
      
      // Get list of all countries with ADM2 data availability
      let targetCountries = await this.getCountriesWithADM2Data(countryCodes);
      
      // PRIORITIZE major countries first for better UX (users see counties faster)
      const priorityCountries = ['USA', 'CHN', 'IND', 'BRA', 'RUS', 'CAN', 'AUS', 'MEX', 'IDN', 'PAK'];
      targetCountries = targetCountries.sort((a, b) => {
        const aIndex = priorityCountries.indexOf(a.code);
        const bIndex = priorityCountries.indexOf(b.code);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex; // Both priority
        if (aIndex !== -1) return -1; // a is priority
        if (bIndex !== -1) return 1;  // b is priority
        return Math.random() - 0.5; // Both non-priority, randomize
      });
      console.log(`⭐ Prioritized major countries first (USA, China, India, etc.)`);
      
      // GLOBAL LOADING: Load ALL countries (not viewport-filtered)
      // The working version loaded all 159 countries globally
      // Aggressive simplification (MAX_POINTS=50) prevents memory issues
      if (!countryCodes) {
        console.log(`🌍 GLOBAL MODE: Loading ALL ${targetCountries.length} countries with ADM2 data...`);
      } else {
        console.log(`🌍 Loading counties for ${targetCountries.length} specified countries...`);
      }
      
      let totalLoaded = 0;
      let completedCount = 0;
      
      // PROGRESSIVE RENDERING: Load and render counties in batches for instant feedback
      console.log(`🚀 ========== FETCHING & RENDERING COUNTIES PROGRESSIVELY ==========`);
      console.log(`📊 Loading ${targetCountries.length} countries in batches with INSTANT visual feedback`);
      
      let totalCountiesRendered = 0;
      let successfulCountries = 0;
      let failedCountries = 0;
      const allResults = [];
      
      // Process countries in batches for TRUE progressive rendering
      const BATCH_SIZE = 10; // Render 10 countries at a time (prevents backend overload)
      
      for (let i = 0; i < targetCountries.length; i += BATCH_SIZE) {
        const batch = targetCountries.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(targetCountries.length / BATCH_SIZE);
        
        console.log(`\n📦 Batch ${batchNum}/${totalBatches}: Fetching ${batch.length} countries...`);
        
        // Fetch this batch in parallel
        const batchPromises = batch.map(country => 
          this.fetchCountyDataOnly(country.code, { useCache, simplified })
            .then(geoData => {
              completedCount++;
              const countyCount = geoData?.features?.length || 0;
              if (countyCount > 0) {
                console.log(`✅ ${country.code}: ${countyCount} counties (${completedCount}/${targetCountries.length})`);
                return { code: country.code, count: countyCount, geoData };
              } else {
                return { code: country.code, count: 0, geoData: null };
              }
            })
            .catch(error => {
              completedCount++;
              return { code: country.code, count: 0, geoData: null, error: error.message };
            })
        );
        
        // PROGRESSIVE RENDERING: Render each country as it finishes (don't wait for slow ones)
        this.viewer.entities.suspendEvents();
        let batchCountiesRendered = 0;
        
        // Process promises as they complete
        for (let i = 0; i < batchPromises.length; i++) {
          try {
            const result = await batchPromises[i];
            allResults.push(result);
            
            if (result.geoData) {
              try {
                console.log(`🎨 Rendering ${result.code}...`);
                const count = await this.renderCountyEntities(result.geoData, result.code, { visible, outlineWidth, outlineColor });
                console.log(`✅ ${result.code}: Rendered ${count} counties`);
                totalCountiesRendered += count;
                batchCountiesRendered += count;
                successfulCountries++;
              } catch (renderError) {
                console.error(`❌ ERROR rendering ${result.code}:`, renderError);
                console.error(`Error message:`, renderError.message);
                console.error(`Error stack:`, renderError.stack);
                failedCountries++;
              }
            } else {
              failedCountries++;
            }
          } catch (error) {
            console.error(`❌ BATCH ERROR for country ${i}:`, error);
            failedCountries++;
          }
        }
        
        // Resume events after THIS batch - counties appear immediately!
        this.viewer.entities.resumeEvents();
        
        console.log(`🎨 Batch ${batchNum}/${totalBatches} rendered: +${batchCountiesRendered} counties (${totalCountiesRendered} total) - NOW VISIBLE!`);
        
        // Force a render to ensure immediate visibility
        if (this.viewer.scene) {
          this.viewer.scene.requestRender();
        }
      }
      
      console.log(`\n✅ ========== ALL COUNTIES RENDERED ==========`);
      console.log(`📊 Success: ${successfulCountries} countries, Failed: ${failedCountries} countries`);
      console.log(`📍 Total: ${totalCountiesRendered} counties rendered\n`);
      
      console.log(`⏰ All fetches completed at: ${new Date().toISOString()}`);
      
      // Detailed results summary
      const successful = allResults.filter(r => r.count > 0);
      const failed = allResults.filter(r => r.count === 0);
      
      console.log(`📊 Results breakdown:`);
      console.log(`   ✅ Successful: ${successful.length} countries`);
      console.log(`   ⚠️ Failed/Timeout: ${failed.length} countries`);
      
      if (failed.length > 0 && failed.length <= 15) {
        console.log(`📋 Failed countries: ${failed.map(r => r.code).join(', ')}`);
      }
      
      // Update totalLoaded from results
      totalLoaded = totalCountiesRendered;
      
      // HIDE PROVINCES DISABLED: This operation is too slow for 100+ countries
      // Provinces and counties use different visual styles, so overlap is visually acceptable
      console.log(`⚠️ Skipping province hiding for ${successful.length} countries (performance optimization)`);
      
      const endTime = performance.now();
      console.log(`✅ GLOBAL COUNTY LOADING COMPLETE:`);
      console.log(`   ✓ ${successfulCountries} countries with county data`);
      console.log(`   ✓ ${totalLoaded} total county/district entities created`);
      console.log(`   ⚠ ${failedCountries} countries without ADM2 data`);
      console.log(`   ⏱ Time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
      
      // PROVINCE FALLBACK DISABLED: Loading all provinces globally causes massive slowdown
      // TODO: Implement targeted province loading for specific failed countries only
      if (failed.length > 0) {
        console.log(`⚠️ Province fallback temporarily disabled - ${failed.length} countries without county data will not show boundaries`);
        console.log(`   Countries without ADM2 data: ${failed.map(f => f.code).join(', ')}`);
      }
      
      // Simple verification (same as provinces)
      const actualCount = this.viewer.entities.values.filter(e => e.id && e.id.startsWith('county-')).length;
      console.log(`🔍 Verification: ${actualCount} county entities in viewer, ${this.entities.county.size} in tracking map`);
      
      console.log(`✅ County level visualization ready with ${totalLoaded} boundaries`);
      
      // Mark layer as loaded
      this.loadedLayers.add('county');
      
      // Clear loading flag
      this.isLoadingCounties = false;
      console.log(`🔓 County loading flag cleared - loading complete`);
      
      return totalLoaded;
      
    } catch (error) {
      console.error(`❌ Error loading counties globally:`, error);
      // Clear loading flag even on error
      this.isLoadingCounties = false;
      console.log(`🔓 County loading flag cleared - loading failed`);
      throw error;
    }
  }

  // Load counties for a single country (used by global loader and individual requests)
  // Fetch county GeoJSON data with reasonable timeout for fast feedback
  async fetchCountyDataOnly(countryCode, options = {}) {
    const { useCache = true, simplified = true } = options;
    
    // CRITICAL: Balanced timeout - fast enough for UX, slow enough for backend
    const MAX_COUNTRY_TIMEOUT = 300000; // 300 seconds (5 min) max per country (IDN=358MB needs time)
    
    const fetchPromise = (async () => {
      try {
        // Check cache first
        if (useCache) {
          const cached = await this.getCountiesFromCache(countryCode);
          if (cached) {
            console.log(`✅ ${countryCode}: Loaded from cache`);
            return cached;
          }
        }
        
        // PRIMARY: Try local file first (instant loading if downloaded)
        try {
          const localUrl = `/data/boundaries/cities/${countryCode}-ADM2.geojson`;
          const localResponse = await fetch(localUrl, {
            signal: AbortSignal.timeout(300000) // 300 second (5 min) timeout for HUGE files (IDN=358MB!)
          });
          
          if (localResponse.ok) {
            const geoData = await localResponse.json();
            if (geoData?.features?.length > 0) {
              console.log(`✅ ${countryCode}: Loaded from LOCAL FILE (${geoData.features.length} counties) ⚡ INSTANT!`);
              return geoData;
            }
          }
        } catch (localError) {
          // Local file doesn't exist, continue to API fallback
        }
        
        // Fallback to backend proxy (avoids CORS issues)
        // Use our backend to proxy the GeoBoundaries API request
        console.log(`📡 ${countryCode}: Fetching via backend proxy...`);
        const proxyUrl = `http://localhost:3002/api/geoboundaries-proxy/${countryCode}/2`;
        const proxyResponse = await fetch(proxyUrl, {
          signal: AbortSignal.timeout(90000) // 90 second timeout (large countries need 30-60s)
        });
        
        if (proxyResponse.ok) {
          const geoData = await proxyResponse.json();
          if (geoData?.features?.length > 0) {
            console.log(`✅ ${countryCode}: Loaded via proxy (${geoData.features.length} counties)`);
            return geoData;
          } else {
            console.warn(`⚠️ ${countryCode}: Proxy returned no features`);
          }
        } else if (proxyResponse.status === 404) {
          console.log(`ℹ️ ${countryCode}: No ADM2 data available (404 - expected for some countries)`);
          return null;
        } else {
          console.warn(`⚠️ ${countryCode}: Proxy failed with status ${proxyResponse.status}`);
        }
        
        return null;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn(`⏱️ ${countryCode}: Fetch timeout after 50s`);
        } else {
          console.warn(`❌ ${countryCode}: Fetch error - ${error.message}`);
        }
        return null; // Fail silently
      }
    })();
    
    // Race against timeout
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn(`⏱️ ${countryCode}: Timeout after ${MAX_COUNTRY_TIMEOUT}ms`);
        resolve(null);
      }, MAX_COUNTRY_TIMEOUT);
    });
    
    return Promise.race([fetchPromise, timeoutPromise]);
  }

  async loadCountiesForCountry(countryCode = 'USA', options = {}) {
    // Reduced logging for parallel loading performance
    const startTime = performance.now();
    
    const {
      useCache = true,
      simplified = true,
      visible = true,
      outlineWidth = 2,
      outlineColor = window.Cesium.Color.BLACK
    } = options;
    
    try {
      // NOTE: Do NOT check if already loaded here - the main loadCounties() method
      // handles clearing all counties first, so this check would incorrectly skip countries
      // that were cleared but not yet re-loaded in the current batch
      
      // DISABLED: Cache checking was causing freezes due to IndexedDB blocking
      // Skip cache for now to prevent browser freezing
      // if (useCache) {
      //   const cached = await this.getCountiesFromCache(countryCode);
      //   if (cached) {
      //     const count = await this.renderCountyEntities(cached, countryCode, { visible, outlineWidth, outlineColor });
      //     return count;
      //   }
      // }
      
      // PRIMARY: Direct local file access (FASTEST - try first!)
      try {
        const localFilePath = `/data/boundaries/cities/${countryCode}-ADM2.geojson`;
        const localResponse = await fetch(localFilePath);
        
        if (localResponse.ok) {
          const geoData = await localResponse.json();
          if (geoData && geoData.features && geoData.features.length > 0) {
            const count = await this.renderCountyEntities(geoData, countryCode, { visible, outlineWidth, outlineColor });
            
            // DISABLED: Cache writing was causing freezes
            // Skip cache for now to prevent browser freezing
            // if (useCache) {
            //   await this.cacheCounties(countryCode, geoData);
            // }
            
            // Mark layer as loaded
            this.loadedLayers.add('county');
            
            return count;
          } else {
            console.warn(`⚠️ ${countryCode}: Local file exists but has no features`);
          }
        } else {
          console.warn(`⚠️ ${countryCode}: Local file fetch failed (${localResponse.status})`);
        }
      } catch (localError) {
        console.warn(`⚠️ ${countryCode}: Local file error - ${localError.message}`);
      }
      
      // FALLBACK: Try GeoBoundaries API (only if local file doesn't exist)
      try {
        const apiUrl = this.dataSources.geoboundaries.getCounties(countryCode);
        const metaResponse = await fetch(apiUrl, { 
          signal: AbortSignal.timeout(10000) // 10 second timeout for metadata
        });
        
        if (metaResponse.ok) {
          const metadata = await metaResponse.json();
          // ALWAYS use full resolution data for accurate county borders
          const geoJsonUrl = metadata.gjDownloadURL;
          
          const geoResponse = await fetch(geoJsonUrl, {
            signal: AbortSignal.timeout(90000) // 90 second timeout (large countries like USA need more time)
          });
          
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            if (geoData && geoData.features && geoData.features.length > 0) {
              const count = await this.renderCountyEntities(geoData, countryCode, { visible, outlineWidth, outlineColor });
              
              // DISABLED: Cache writing was causing freezes
              // Skip cache for now to prevent browser freezing
              // if (useCache) {
              //   await this.cacheCounties(countryCode, geoData);
              // }
              
              // Mark layer as loaded
              this.loadedLayers.add('county');
              
              return count;
            }
          }
        }
      } catch (apiError) {
        // API failed, that's okay - we'll return 0
      }
      
      // No data available from any source
      return 0;
      
    } catch (error) {
      console.error(`❌ Error loading counties for ${countryCode}:`, error);
      throw error;
    }
  }

  // Helper: Render county entities from GeoJSON
  async renderCountyEntities(geoData, countryCode, options = {}) {
    const { visible = true, outlineWidth = 2, outlineColor = window.Cesium.Color.BLACK } = options;
    let successCount = 0;
    let errorCount = 0;
    
    const features = geoData.features || [];
    
    // Process counties in batches (SAME AS PROVINCES)
    const BATCH_SIZE = 50; // Process 50 counties at a time
    
    for (let i = 0; i < features.length; i += BATCH_SIZE) {
      const batch = features.slice(i, i + BATCH_SIZE);
      
      // Process batch in parallel (SAME AS PROVINCES)
      await Promise.all(batch.map(async (feature) => {
        try {
          const countyName = feature.properties.shapeName || 
                            feature.properties.name || 
                            'Unknown County';
          
          const coordinates = this.processGeoJSONCoordinates(feature.geometry);
          if (!coordinates || coordinates.length === 0) {
            console.warn(`⚠️ ${countryCode}: Invalid coordinates for ${countyName}, geometry type: ${feature.geometry?.type}`);
            errorCount++;
            return;
          }
          
          const entityId = `county-${countryCode}-${feature.properties.shapeID || successCount}`;
          
          const entity = this.viewer.entities.add({
            id: entityId,
            name: countyName,
            polygon: {
              hierarchy: coordinates,
              material: outlineColor.withAlpha(0.3),  // Increased visibility (was 0.15)
              outline: true,
              outlineColor: outlineColor,
              outlineWidth: outlineWidth,
              height: 0,  // Ground level - same as provinces
              classificationType: window.Cesium.ClassificationType.TERRAIN,  // Drape on terrain - same as provinces
              shadows: window.Cesium.ShadowMode.DISABLED
            },
            properties: {
              adminLevel: 'county',
              adminLevelNumber: 2,
              countryCode: countryCode,
              countyName: countyName,
              countyId: feature.properties.shapeID,
              shapeISO: feature.properties.shapeISO,
              layerType: 'county'
            },
            show: visible
          });
          
          this.entities.county.set(entity.id, entity);
          successCount++;
          
        } catch (error) {
          errorCount++;
        }
      }));
      
      // Allow UI to breathe between batches (SAME AS PROVINCES)
      if (i + BATCH_SIZE < features.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    console.log(`📊 ${countryCode}: renderCountyEntities complete - ${successCount} success, ${errorCount} errors`);
    
    // Verify entities were actually added to viewer
    const countyEntitiesInViewer = this.viewer.entities.values.filter(e => 
      e.id && e.id.startsWith(`county-${countryCode}`)
    ).length;
    console.log(`🔍 ${countryCode}: Verification - ${countyEntitiesInViewer} county entities in viewer, ${successCount} in tracking map`);
    
    return successCount;
  }

  // Helper: Process GeoJSON coordinates for Cesium
  processGeoJSONCoordinates(geometry) {
    if (!geometry || !geometry.coordinates) return null;
    
    try {
      if (geometry.type === 'Polygon') {
        // Flatten the outer ring coordinates
        const coords = geometry.coordinates[0];
        
        if (!coords || coords.length < 3) {
          console.warn(`⚠️ Invalid polygon: insufficient coordinates (${coords?.length || 0})`);
          return null;
        }
        
        // FULL RESOLUTION: Use complete boundary data for accurate county borders
        // No simplification to prevent gaps between adjacent counties
        // Modern GPUs can handle the full geometry without issues
        let processedCoords = coords;
        const MAX_POINTS = 2000; // Very high limit - essentially full resolution
        if (coords.length > MAX_POINTS) {
          // Simplify to every Nth point, but ensure we keep at least 3 points for a valid polygon
          const step = Math.ceil(coords.length / MAX_POINTS);
          processedCoords = coords.filter((_, idx) => idx % step === 0);
          
          // Ensure minimum 3 points for valid polygon
          if (processedCoords.length < 3 && coords.length >= 3) {
            // Take first, middle, and last points
            processedCoords = [
              coords[0],
              coords[Math.floor(coords.length / 2)],
              coords[coords.length - 1]
            ];
          }
          
          // Always include the last point to close the polygon (if different from first)
          const lastCoord = coords[coords.length - 1];
          if (processedCoords.length > 0 && 
              (processedCoords[processedCoords.length - 1][0] !== lastCoord[0] || 
               processedCoords[processedCoords.length - 1][1] !== lastCoord[1])) {
            processedCoords.push(lastCoord);
          }
          
          // Ensure first and last points match (closed polygon)
          if (processedCoords.length > 0 && 
              (processedCoords[0][0] !== processedCoords[processedCoords.length - 1][0] ||
               processedCoords[0][1] !== processedCoords[processedCoords.length - 1][1])) {
            processedCoords.push([processedCoords[0][0], processedCoords[0][1]]);
          }
        }
        
        // Validate coordinates are valid numbers
        const validCoords = processedCoords.filter(coord => 
          Array.isArray(coord) && 
          coord.length >= 2 && 
          typeof coord[0] === 'number' && 
          typeof coord[1] === 'number' &&
          !isNaN(coord[0]) && 
          !isNaN(coord[1]) &&
          isFinite(coord[0]) && 
          isFinite(coord[1])
        );
        
        if (validCoords.length < 3) {
          console.warn(`⚠️ Invalid polygon after validation: only ${validCoords.length} valid coordinates`);
          return null;
        }
        
        const flatCoords = [];
        for (const coord of validCoords) {
          flatCoords.push(coord[0], coord[1]);
        }
        
        try {
          const positions = window.Cesium.Cartesian3.fromDegreesArray(flatCoords);
          if (!positions || positions.length < 3) {
            console.warn(`⚠️ Invalid positions array: ${positions?.length || 0} points`);
            return null;
          }
          // CRITICAL: Return raw Cartesian3 array (same as provinces)
          // Cesium automatically wraps this in PolygonHierarchy when assigned to polygon.hierarchy
          return positions;
        } catch (cesiumError) {
          console.error(`❌ Cesium coordinate conversion failed:`, cesiumError.message);
          return null;
        }
      } else if (geometry.type === 'MultiPolygon') {
        // Use the largest polygon from MultiPolygon
        if (!geometry.coordinates || geometry.coordinates.length === 0) {
          console.warn(`⚠️ Invalid MultiPolygon: no coordinates`);
          return null;
        }
        
        const polygons = geometry.coordinates
          .filter(poly => poly && poly[0] && poly[0].length >= 3)
          .map(poly => ({
            coords: poly[0],
            area: this.calculatePolygonArea(poly[0])
          }));
        
        if (polygons.length === 0) {
          console.warn(`⚠️ Invalid MultiPolygon: no valid polygons`);
          return null;
        }
        
        polygons.sort((a, b) => b.area - a.area);
        const coords = polygons[0].coords;
        
        if (!coords || coords.length < 3) {
          console.warn(`⚠️ Invalid polygon from MultiPolygon: insufficient coordinates`);
          return null;
        }
        
        // FULL RESOLUTION: Use complete boundary data for accurate county borders
        let processedCoords = coords;
        const MAX_POINTS = 2000; // Very high limit - essentially full resolution
        if (coords.length > MAX_POINTS) {
          const step = Math.ceil(coords.length / MAX_POINTS);
          processedCoords = coords.filter((_, idx) => idx % step === 0);
          
          // Ensure minimum 3 points
          if (processedCoords.length < 3 && coords.length >= 3) {
            processedCoords = [
              coords[0],
              coords[Math.floor(coords.length / 2)],
              coords[coords.length - 1]
            ];
          }
          
          // Ensure polygon is closed
          const lastCoord = coords[coords.length - 1];
          if (processedCoords.length > 0 && 
              (processedCoords[processedCoords.length - 1][0] !== lastCoord[0] || 
               processedCoords[processedCoords.length - 1][1] !== lastCoord[1])) {
            processedCoords.push(lastCoord);
          }
          
          if (processedCoords.length > 0 && 
              (processedCoords[0][0] !== processedCoords[processedCoords.length - 1][0] ||
               processedCoords[0][1] !== processedCoords[processedCoords.length - 1][1])) {
            processedCoords.push([processedCoords[0][0], processedCoords[0][1]]);
          }
        }
        
        // Validate coordinates
        const validCoords = processedCoords.filter(coord => 
          Array.isArray(coord) && 
          coord.length >= 2 && 
          typeof coord[0] === 'number' && 
          typeof coord[1] === 'number' &&
          !isNaN(coord[0]) && 
          !isNaN(coord[1]) &&
          isFinite(coord[0]) && 
          isFinite(coord[1])
        );
        
        if (validCoords.length < 3) {
          console.warn(`⚠️ Invalid MultiPolygon after validation: only ${validCoords.length} valid coordinates`);
          return null;
        }
        
        const flatCoords = [];
        for (const coord of validCoords) {
          flatCoords.push(coord[0], coord[1]);
        }
        
        try {
          const positions = window.Cesium.Cartesian3.fromDegreesArray(flatCoords);
          if (!positions || positions.length < 3) {
            console.warn(`⚠️ Invalid positions array from MultiPolygon: ${positions?.length || 0} points`);
            return null;
          }
          // CRITICAL: Return raw Cartesian3 array (same as provinces)
          // Cesium automatically wraps this in PolygonHierarchy when assigned to polygon.hierarchy
          return positions;
        } catch (cesiumError) {
          console.error(`❌ Cesium coordinate conversion failed for MultiPolygon:`, cesiumError.message);
          return null;
        }
      }
    } catch (error) {
      console.error(`❌ Error processing GeoJSON coordinates:`, error.message);
      return null;
    }
    
    return null;
  }

  // Helper: Calculate approximate polygon area
  calculatePolygonArea(coords) {
    if (!coords || coords.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      area += coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1];
    }
    return Math.abs(area / 2);
  }

  // Helper: Cache counties in IndexedDB
  async cacheCounties(countryCode, geoData) {
    try {
      const cacheData = {
        countryCode,
        data: geoData,
        timestamp: Date.now(),
        expiresIn: 30 * 24 * 60 * 60 * 1000 // 30 days
      };
      
      const db = await this.openIndexedDB();
      const tx = db.transaction('boundaries', 'readwrite');
      await tx.objectStore('boundaries').put(cacheData, `counties-${countryCode}`);
      
      console.log(`💾 Cached county data for ${countryCode}`);
    } catch (error) {
      console.warn(`⚠️ Failed to cache counties:`, error);
    }
  }

  // Helper: Get counties from cache
  async getCountiesFromCache(countryCode) {
    try {
      const db = await this.openIndexedDB();
      const tx = db.transaction('boundaries', 'readonly');
      const cached = await tx.objectStore('boundaries').get(`counties-${countryCode}`);
      
      if (!cached) return null;
      
      // Check if expired
      const age = Date.now() - cached.timestamp;
      if (age > cached.expiresIn) {
        console.log(`🗑️ Cache expired for ${countryCode}, will fetch fresh data`);
        return null;
      }
      
      return cached.data;
    } catch (error) {
      console.warn(`⚠️ Cache read failed:`, error);
      return null;
    }
  }

  // Helper: Open IndexedDB
  async openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RelayBoundaries', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('boundaries')) {
          db.createObjectStore('boundaries');
        }
      };
    });
  }

  // Load province/state boundaries with proper lifecycle management
  // Fallback: Render provinces as county-style boundaries for countries without county data
  async loadProvinceFallbackForCountries(countryCodes, options = {}) {
    const {
      visible = true,
      outlineWidth = 2,
      outlineColor = window.Cesium.Color.RED
    } = options;
    
    try {
      // Ensure provinces are loaded first
      if (this.entities.province.size === 0) {
        console.log(`🔄 Provinces not loaded yet, loading them first...`);
        await this.loadProvinces();
      }
      
      if (this.entities.province.size === 0) {
        console.warn(`⚠️ No provinces available for fallback`);
        return 0;
      }
      
      // Map ISO country codes to country names (for province filtering)
      const countryCodeToName = {
        'BRB': 'Barbados',
        'TTO': 'Trinidad and Tobago',
        'GUF': 'French Guiana',
        'MDA': 'Moldova',
        'MNE': 'Montenegro',
        'MLT': 'Malta',
        'PHL': 'Philippines',
        'THA': 'Thailand',
        'LAO': 'Laos',
        'KGZ': 'Kyrgyzstan',
        'IRQ': 'Iraq',
        'ARE': 'United Arab Emirates',
        'BHR': 'Bahrain',
        'PSE': 'Palestine',
        'OMN': 'Oman',
        'LBY': 'Libya',
        'NER': 'Niger',
        'GMB': 'Gambia',
        'ETH': 'Ethiopia',
        'COD': 'Democratic Republic of the Congo'
      };
      
      let fallbackCount = 0;
      const processedCountries = new Set();
      
      // For each failed country, find and render its provinces
      for (const countryCode of countryCodes) {
        const countryName = countryCodeToName[countryCode] || await this.getCountryNameFromCode(countryCode);
        
        if (!countryName) {
          console.warn(`⚠️ Could not map country code ${countryCode} to name, skipping`);
          continue;
        }
        
        // Find provinces for this country - use flexible matching for country names
        const allProvinces = Array.from(this.entities.province.values());
        const countryProvinces = allProvinces.filter(entity => {
          if (!entity.properties || !entity.properties.country) return false;
          
          const provinceCountryName = entity.properties.country.getValue();
          if (!provinceCountryName) return false;
          
          // Case-insensitive matching
          const matches = provinceCountryName.toLowerCase() === countryName.toLowerCase();
          
          // Also try partial matching for variations (e.g., "United States" vs "United States of America")
          const partialMatch = provinceCountryName.toLowerCase().includes(countryName.toLowerCase()) ||
                              countryName.toLowerCase().includes(provinceCountryName.toLowerCase());
          
          return matches || partialMatch;
        });
        
        if (countryProvinces.length === 0) {
          // Debug: Show what country names are actually in provinces
          const availableCountries = new Set();
          allProvinces.forEach(entity => {
            if (entity.properties && entity.properties.country) {
              const name = entity.properties.country.getValue();
              if (name) availableCountries.add(name);
            }
          });
          console.log(`⚠️ No provinces found for ${countryCode} (looking for: "${countryName}")`);
          console.log(`   Available country names in provinces: ${Array.from(availableCountries).slice(0, 10).join(', ')}...`);
          continue;
        }
        
        console.log(`🔄 Rendering ${countryProvinces.length} provinces as county fallback for ${countryCode}...`);
        
        // Render each province with county-style (red outlines)
        for (const provinceEntity of countryProvinces) {
          // Create a county-style entity from the province
          const provinceName = provinceEntity.properties.name?.getValue() || 'Unknown Province';
          const entityId = `county-fallback-${countryCode}-${provinceName}-${Date.now()}`;
          
          // Clone the province polygon but with county styling
          // Get the hierarchy from the province entity (Cesium property)
          const hierarchy = provinceEntity.polygon.hierarchy.getValue ? 
            provinceEntity.polygon.hierarchy.getValue() : 
            provinceEntity.polygon.hierarchy;
          
          const newEntity = this.viewer.entities.add({
            id: entityId,
            name: provinceName,
            polygon: {
              hierarchy: hierarchy,
              material: outlineColor.withAlpha(0.1),
              outline: true,
              outlineColor: outlineColor,
              outlineWidth: outlineWidth,
              height: 0,
              classificationType: window.Cesium.ClassificationType.TERRAIN,
              shadows: window.Cesium.ShadowMode.DISABLED,
              distanceDisplayCondition: new window.Cesium.DistanceDisplayCondition(0.0, 5000000.0)
            },
            properties: {
              adminLevel: 'county',
              adminLevelNumber: 2,
              countryCode: countryCode,
              countyName: provinceName,
              isProvinceFallback: true,
              originalProvinceId: provinceEntity.id
            },
            show: visible
          });
          
          this.entities.county.set(entityId, newEntity);
          fallbackCount++;
        }
        
        processedCountries.add(countryCode);
      }
      
      if (fallbackCount > 0) {
        console.log(`✅ Province fallback complete: ${fallbackCount} provinces rendered for ${processedCountries.size} countries`);
        console.log(`   Countries: ${Array.from(processedCountries).join(', ')}`);
        
        // Force render
        if (this.viewer.scene) {
          this.viewer.scene.requestRender();
        }
      }
      
      return fallbackCount;
      
    } catch (error) {
      console.error(`❌ Error in province fallback:`, error);
      return 0;
    }
  }
  
  // Helper: Hide provinces for countries that have county data (prevents overlap)
  async hideProvincesForCountries(countryCodes) {
    if (!countryCodes || countryCodes.length === 0) {
      return;
    }
    
    try {
      // Ensure provinces are loaded
      if (this.entities.province.size === 0) {
        console.log(`⚠️ No provinces loaded to hide`);
        return;
      }
      
      // Build mapping of country codes to names for matching
      const countryMapping = {};
      const allCountries = await this.getCountriesWithADM2Data();
      allCountries.forEach(c => {
        countryMapping[c.code] = c.name;
      });
      
      // Get all province entities
      const allProvinces = Array.from(this.entities.province.values());
      let hiddenCount = 0;
      
      // For each country with county data, hide its provinces
      for (const countryCode of countryCodes) {
        const countryName = countryMapping[countryCode];
        if (!countryName) continue;
        
        // Find provinces for this country
        const countryProvinces = allProvinces.filter(entity => {
          if (!entity.properties || !entity.properties.country) return false;
          
          const provinceCountryName = entity.properties.country.getValue();
          if (!provinceCountryName) return false;
          
          // Case-insensitive matching
          const matches = provinceCountryName.toLowerCase() === countryName.toLowerCase();
          
          // Also try partial matching for variations
          const partialMatch = provinceCountryName.toLowerCase().includes(countryName.toLowerCase()) ||
                              countryName.toLowerCase().includes(provinceCountryName.toLowerCase());
          
          return matches || partialMatch;
        });
        
        // Hide these provinces
        countryProvinces.forEach(entity => {
          entity.show = false;
          hiddenCount++;
        });
      }
      
      if (hiddenCount > 0) {
        console.log(`✅ Hidden ${hiddenCount} province entities for ${countryCodes.length} countries with county data`);
      }
      
    } catch (error) {
      console.error(`❌ Error hiding provinces:`, error);
    }
  }
  
  // Helper: Get country name from code (lookup in getCountriesWithADM2Data list)
  async getCountryNameFromCode(countryCode) {
    try {
      // Try to get from the full country list
      const allCountries = await this.getCountriesWithADM2Data();
      const country = allCountries.find(c => c.code === countryCode);
      if (country) {
        return country.name;
      }
    } catch (error) {
      console.warn(`⚠️ Could not fetch country list for lookup:`, error);
    }
    
    // Fallback: Static list for common failed countries
    const fallbackList = {
      'BRB': 'Barbados',
      'TTO': 'Trinidad and Tobago',
      'GUF': 'French Guiana',
      'MDA': 'Moldova',
      'MNE': 'Montenegro',
      'MLT': 'Malta',
      'PHL': 'Philippines',
      'THA': 'Thailand',
      'LAO': 'Laos',
      'KGZ': 'Kyrgyzstan',
      'IRQ': 'Iraq',
      'ARE': 'United Arab Emirates',
      'BHR': 'Bahrain',
      'PSE': 'Palestine',
      'OMN': 'Oman',
      'LBY': 'Libya',
      'NER': 'Niger',
      'GMB': 'Gambia',
      'ETH': 'Ethiopia',
      'COD': 'Democratic Republic of the Congo'
    };
    
    return fallbackList[countryCode] || null;
  }

  async loadProvinces() {
    // Prevent double loading
    if (this.loadingProvinces) {
      if (this.DEBUG) console.log('⚠️ Provinces already loading, skipping duplicate request');
      return { success: false, error: 'Already loading' };
    }
    
    // Check if already loaded
    if (this.entities.province.size > 0) {
      if (this.DEBUG) console.log('⚠️ Provinces already loaded, skipping duplicate request');
      return { success: true, message: 'Already loaded', entityCount: this.entities.province.size };
    }
    
    this.loadingProvinces = true;
    const startTime = performance.now();

    if (this.DEBUG) console.log('🏛️ Loading province/state boundaries...');

    // Check entitiesRef availability (no timeout loops)
    if (!this.isEntitiesRefReady()) {
      console.warn('⚠️ entitiesRef not available, proceeding without synchronization');
    }

    try {
      // Check cache first
      let data = this.dataCache.provinces;
      
      if (!data) {
      // Single fetch attempt with timeout
      const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        if (this.DEBUG) console.log('🌐 Fetching province data from Natural Earth...');
      const response = await fetch(this.dataSources.natural_earth.provinces, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'RelayGlobe/1.0'
          }
      });

      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Failed to fetch province data: ${response.status} ${response.statusText}`);
      }

        data = await response.json();
        this.dataCache.provinces = data; // Cache the data
        if (this.DEBUG) console.log(`📊 Found ${data.features?.length || 0} province features`);
      } else {
        if (this.DEBUG) console.log('📊 Using cached province data');
      }

      if (!data.features || data.features.length === 0) {
        throw new Error('No province features found in response');
      }

      // 🎯 OPTIMIZED APPROACH: Detailed performance timing
      const Cesium = window.Cesium;
      let successCount = 0;
      let errorCount = 0;
      
      // ⏱️ TIMING: Step 1 - Filter valid features
      const stepTimings = {};
      const step1Start = performance.now();
      const validFeatures = data.features.filter(f => f && f.geometry && f.properties);
      stepTimings.filterFeatures = performance.now() - step1Start;
      
      console.log(`📊 Processing ${validFeatures.length} provinces with optimizations...`);
      console.log(`⏱️ Step 1 - Filter features: ${stepTimings.filterFeatures.toFixed(2)}ms`);
      
      // ⏱️ TIMING: Step 2 - Suspend events
      const step2Start = performance.now();
      this.viewer.entities.suspendEvents();
      stepTimings.suspendEvents = performance.now() - step2Start;
      console.log(`⏱️ Step 2 - Suspend events: ${stepTimings.suspendEvents.toFixed(2)}ms`);
      
      try {
        // ⏱️ TIMING: Step 3 - Process all batches
        const step3Start = performance.now();
        let simplificationTime = 0;
        let conversionTime = 0;
        let entityCreationTime = 0;
        
        const BATCH_SIZE = 200;
        
        for (let i = 0; i < validFeatures.length; i += BATCH_SIZE) {
          const batch = validFeatures.slice(i, i + BATCH_SIZE);
          
          // Process batch in parallel
          const batchResults = await Promise.all(batch.map(async (feature) => {
            try {
              const properties = feature.properties;
              const provinceName = properties.NAME || properties.name || 'Unknown Province';
              const countryName = properties.ADMIN || properties.admin_0 || 'Unknown Country';
              
              // ⏱️ Geometry simplification timing
              const simpStart = performance.now();
              const geometry = feature.geometry;
              
              if (!geometry || !geometry.type || !geometry.coordinates) {
                console.warn(`⚠️ Invalid geometry for ${provinceName}`);
                simplificationTime += performance.now() - simpStart;
                return { success: false, error: 'Invalid geometry' };
              }
              
              // 🗺️ CRITICAL FIX: Handle ALL parts of MultiPolygons with NO simplification
              let polygonHierarchies = [];
              
              if (geometry.type === 'Polygon') {
                if (geometry.coordinates && geometry.coordinates[0]) {
                  // Single polygon - use full detail for boundary alignment
                  const coords = geometry.coordinates[0];
                  if (coords.length >= 3) {
                    polygonHierarchies.push(coords);
                  }
                }
                
              } else if (geometry.type === 'MultiPolygon') {
                // Multiple polygons - process ALL of them with full detail!
                for (const polygon of geometry.coordinates) {
                  if (polygon && polygon[0] && polygon[0].length >= 3) {
                    const coords = polygon[0]; // Outer ring (holes would be polygon[1], polygon[2], etc.)
                    polygonHierarchies.push(coords);
                  }
                }
              }
              simplificationTime += performance.now() - simpStart;
              
              if (polygonHierarchies.length === 0) return { success: false };
              
              // ⏱️ Coordinate conversion timing
              const convStart = performance.now();
              
              // Convert all polygon parts to Cartesian coordinates
              const allPositions = [];
              for (const coords of polygonHierarchies) {
                const flatCoords = [];
                for (let j = 0; j < coords.length; j++) {
                  flatCoords.push(coords[j][0], coords[j][1]);
                }
                const positions = Cesium.Cartesian3.fromDegreesArray(flatCoords);
                allPositions.push(positions);
              }
              conversionTime += performance.now() - convStart;
              
              // ⏱️ Entity creation timing
              const entityStart = performance.now();
              
              // Create entity with ALL polygon parts
              // For MultiPolygons, we need to create separate entities or use a single hierarchy
              if (allPositions.length === 1) {
                // Single polygon - simple hierarchy
                const entity = this.viewer.entities.add({
                  id: `province:${provinceName}:${Date.now()}-${Math.random()}`,
                  name: provinceName,
                  polygon: {
                    hierarchy: allPositions[0],
                    material: Cesium.Color.LIGHTGREEN.withAlpha(0.3),
                    outline: true,
                    outlineColor: Cesium.Color.GREEN,
                    outlineWidth: 1,
                    height: 0,
                    classificationType: Cesium.ClassificationType.TERRAIN,
                    shadows: Cesium.ShadowMode.DISABLED,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 2.5e7)
                  },
                  properties: {
                    type: new Cesium.ConstantProperty('province'),
                    name: new Cesium.ConstantProperty(provinceName),
                    layerType: new Cesium.ConstantProperty('provinces'),
                    regionName: new Cesium.ConstantProperty(provinceName),
                    country: new Cesium.ConstantProperty(countryName)
                  }
                });
                
                this.entities.province.set(entity.id, entity);
                this.entityCache.set(entity.id, entity);
                this.registerEntityInRef(entity);
                
              } else {
                // MultiPolygon - create separate entity for EACH part
                // This ensures all disconnected regions are visible!
                for (let partIdx = 0; partIdx < allPositions.length; partIdx++) {
                  const entity = this.viewer.entities.add({
                    id: `province:${provinceName}:part${partIdx}:${Date.now()}-${Math.random()}`,
                    name: provinceName,
                    polygon: {
                      hierarchy: allPositions[partIdx],
                      material: Cesium.Color.LIGHTGREEN.withAlpha(0.3),
                      outline: true,
                      outlineColor: Cesium.Color.GREEN,
                      outlineWidth: 1,
                      height: 0,
                      classificationType: Cesium.ClassificationType.TERRAIN,
                      shadows: Cesium.ShadowMode.DISABLED,
                      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 2.5e7)
                    },
                    properties: {
                      type: new Cesium.ConstantProperty('province'),
                      name: new Cesium.ConstantProperty(provinceName),
                      layerType: new Cesium.ConstantProperty('provinces'),
                      regionName: new Cesium.ConstantProperty(provinceName),
                      country: new Cesium.ConstantProperty(countryName),
                      isMultiPart: new Cesium.ConstantProperty(true),
                      partIndex: new Cesium.ConstantProperty(partIdx),
                      totalParts: new Cesium.ConstantProperty(allPositions.length)
                    }
                  });
                  
                  this.entities.province.set(entity.id, entity);
                  this.entityCache.set(entity.id, entity);
                  this.registerEntityInRef(entity);
                }
              }
              
              entityCreationTime += performance.now() - entityStart;
              
              return { success: true, parts: allPositions.length };
            } catch (error) {
              return { success: false, error };
            }
          }));
          
          const batchSuccess = batchResults.filter(r => r.success);
          const batchErrors = batchResults.filter(r => !r.success);
          successCount += batchSuccess.length;
          errorCount += batchErrors.length;
          
          // Track multi-part provinces
          const multiPartCount = batchSuccess.filter(r => r.parts > 1).length;
          
          if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= validFeatures.length) {
            console.log(`📊 Progress: ${i + BATCH_SIZE}/${validFeatures.length} provinces (${multiPartCount} multi-part in batch)`);
          }
          if (i % 400 === 0 && i > 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        
        stepTimings.batchProcessing = performance.now() - step3Start;
        stepTimings.simplification = simplificationTime;
        stepTimings.conversion = conversionTime;
        stepTimings.entityCreation = entityCreationTime;
        
        console.log(`⏱️ Step 3 - Batch processing: ${(stepTimings.batchProcessing / 1000).toFixed(2)}s`);
        console.log(`   ├─ Geometry simplification: ${(stepTimings.simplification / 1000).toFixed(2)}s`);
        console.log(`   ├─ Coordinate conversion: ${(stepTimings.conversion / 1000).toFixed(2)}s`);
        console.log(`   └─ Entity creation: ${(stepTimings.entityCreation / 1000).toFixed(2)}s`);
        
      } finally {
        // ⏱️ TIMING: Step 4 - Resume events (triggers render)
        const step4Start = performance.now();
        this.viewer.entities.resumeEvents();
        stepTimings.resumeAndRender = performance.now() - step4Start;
        console.log(`⏱️ Step 4 - Resume & render: ${(stepTimings.resumeAndRender / 1000).toFixed(2)}s`);
      }

      const endTime = performance.now();
      const loadTime = (endTime - startTime) / 1000;

      // Mark layer as loaded for future reference
      this.loadedLayers.add('province');
      
      // Calculate data quality metrics
      const totalEntities = this.entities.province.size;
      const avgPartsPerProvince = totalEntities / successCount;
      
      // ⏱️ PERFORMANCE SUMMARY TABLE
      console.log(`\n📊 PERFORMANCE BREAKDOWN (Total: ${loadTime.toFixed(2)}s):`);
      console.log(`┌─────────────────────────────────┬──────────┬──────────┐`);
      console.log(`│ Step                            │ Time     │ % Total  │`);
      console.log(`├─────────────────────────────────┼──────────┼──────────┤`);
      console.log(`│ 1. Filter features              │ ${(stepTimings.filterFeatures / 1000).toFixed(3).padEnd(6)}s │ ${((stepTimings.filterFeatures / (loadTime * 1000)) * 100).toFixed(1).padStart(6)}% │`);
      console.log(`│ 2. Suspend events               │ ${(stepTimings.suspendEvents / 1000).toFixed(3).padEnd(6)}s │ ${((stepTimings.suspendEvents / (loadTime * 1000)) * 100).toFixed(1).padStart(6)}% │`);
      console.log(`│ 3. Batch processing (total)     │ ${(stepTimings.batchProcessing / 1000).toFixed(3).padEnd(6)}s │ ${((stepTimings.batchProcessing / (loadTime * 1000)) * 100).toFixed(1).padStart(6)}% │`);
      console.log(`│    ├─ Geometry processing       │ ${(stepTimings.simplification / 1000).toFixed(3).padEnd(6)}s │ ${((stepTimings.simplification / (loadTime * 1000)) * 100).toFixed(1).padStart(6)}% │`);
      console.log(`│    ├─ Coordinate conversion     │ ${(stepTimings.conversion / 1000).toFixed(3).padEnd(6)}s │ ${((stepTimings.conversion / (loadTime * 1000)) * 100).toFixed(1).padStart(6)}% │`);
      console.log(`│    └─ Entity creation           │ ${(stepTimings.entityCreation / 1000).toFixed(3).padEnd(6)}s │ ${((stepTimings.entityCreation / (loadTime * 1000)) * 100).toFixed(1).padStart(6)}% │`);
      console.log(`│ 4. Resume & render              │ ${(stepTimings.resumeAndRender / 1000).toFixed(3).padEnd(6)}s │ ${((stepTimings.resumeAndRender / (loadTime * 1000)) * 100).toFixed(1).padStart(6)}% │`);
      console.log(`└─────────────────────────────────┴──────────┴──────────┘`);
      console.log(`\n📊 DATA QUALITY:`);
      console.log(`   • Provinces processed: ${validFeatures.length}`);
      console.log(`   • Provinces loaded: ${successCount} (${errorCount} errors)`);
      console.log(`   • Total entities: ${totalEntities} (avg ${avgPartsPerProvince.toFixed(1)} parts/province)`);
      console.log(`   • Multi-part provinces: ${totalEntities - successCount}`);
      console.log(`✅ Province layer complete with FULL geometry detail (no simplification)\n`);

      // Save state once at the end (debounced)
      this.saveEntityState();
      
      return { success: true, entityCount: this.entities.province.size, loadTime };

    } catch (error) {
      console.error(`❌ Province load failed:`, error);
      // Make sure to resume events even on error
      if (this.viewer?.entities) {
        this.viewer.entities.resumeEvents();
      }
      // Try fallback only if primary source fails
      await this.loadProvincesFallback();
    } finally {
      // Reset loading flag
      this.loadingProvinces = false;
    }
  }

  // Check if entitiesRef is available (no timeout loops)
  isEntitiesRefReady() {
    return this.entitiesRef && this.entitiesRef.current;
  }
  
  // Set entitiesRef when available (called from InteractiveGlobe)
  setEntitiesRef(entitiesRef) {
    this.entitiesRef = entitiesRef;
    if (this.DEBUG) {
      console.log('✅ entitiesRef set in AdministrativeHierarchy');
    }
  }
  
  // Toggle debug mode for logging control
  setDebugMode(enabled) {
    this.DEBUG = enabled;
    console.log(`🔧 AdministrativeHierarchy debug mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }
  
  // Check if a layer is already loaded (prevents recreation)
  isLayerLoaded(layerType) {
    switch (layerType) {
      case 'province':
        return this.entities.province.size > 0;
      case 'city':
        return this.entities.city.size > 0;
      case 'country':
        return this.entities.country.size > 0;
      case 'continent':
        return this.entities.continent.size > 0;
      default:
        return false;
    }
  }
  
  // Clear a specific layer (for explicit user action)
  clearLayer(layerType) {
    switch (layerType) {
      case 'province':
        this.clearProvinceEntities();
        this.dataCache.provinces = null; // Clear cache
        break;
      case 'city':
        this.clearCityEntities();
        this.dataCache.cities = null;
        break;
      case 'country':
        this.clearCountryEntities();
        this.dataCache.countries = null;
        break;
      case 'continent':
        this.clearContinentEntities();
        this.dataCache.continents = null;
        break;
    }
  }
  
  // Clear province entities
  clearProvinceEntities() {
    for (const [id, entity] of this.entities.province) {
      this.viewer.entities.remove(entity);
    }
    this.entities.province.clear();
    if (this.DEBUG) console.log('✅ Province entities cleared');
  }
  
  // Clear city entities
  clearCityEntities() {
    for (const [id, entity] of this.entities.city) {
      this.viewer.entities.remove(entity);
    }
    this.entities.city.clear();
    if (this.DEBUG) console.log('✅ City entities cleared');
  }
  
  // Clear country entities
  clearCountryEntities() {
    for (const [id, entity] of this.entities.country) {
      this.viewer.entities.remove(entity);
    }
    this.entities.country.clear();
    if (this.DEBUG) console.log('✅ Country entities cleared');
  }
  
  // Clear continent entities
  clearContinentEntities() {
    for (const [id, entity] of this.entities.continent) {
      this.viewer.entities.remove(entity);
    }
    this.entities.continent.clear();
    if (this.DEBUG) console.log('✅ Continent entities cleared');
  }

  // Fallback province loading from alternative source
  async loadProvincesFallback() {
    console.log('🔄 Loading provinces from fallback source...');
    
    try {
      // Try alternative Natural Earth source (50m resolution as fallback)
      const fallbackUrl = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson';
      console.log(`🔄 Trying fallback URL: ${fallbackUrl}`);
      
      // Add timeout to fallback request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      const response = await fetch(fallbackUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RelayGlobe/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Fallback source also failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📊 Fallback found ${data.features?.length || 0} province features`);
      
      if (data.features && data.features.length > 0) {
        // Process fallback data in batches
        let successCount = 0;
        let errorCount = 0;
        
        // Process in batches for performance
        const batchSize = 50;
        const totalFeatures = data.features.length;
        
        for (let i = 0; i < totalFeatures; i += batchSize) {
          const batch = data.features.slice(i, i + batchSize);
          
          // Process batch in parallel
          const batchPromises = batch.map(async (feature) => {
          try {
            await this.createProvinceEntity(feature);
              return { success: true };
          } catch (error) {
              if (this.DEBUG) console.error(`❌ Error processing fallback province feature:`, error);
              return { success: false, error };
            }
          });
          
          // Wait for batch to complete
          const batchResults = await Promise.all(batchPromises);
          
          // Count results
          batchResults.forEach(result => {
            if (result.success) {
              successCount++;
            } else {
            errorCount++;
          }
          });
        }
        
        console.log(`✅ Fallback province processing complete: ${successCount} success, ${errorCount} errors, ${totalFeatures} total`);
        console.log(`📊 Final fallback province entity count: ${this.entities.province.size}`);
      } else {
        throw new Error('Fallback source returned no features');
      }
      
    } catch (error) {
      console.error('❌ Fallback province loading also failed:', error);
      console.log('🔄 Attempting to create local fallback provinces...');
      
      // Try local fallback with basic province data
      try {
        await this.createLocalFallbackProvinces();
        console.log('✅ Local fallback provinces created successfully');
      } catch (localError) {
        console.error('❌ Local fallback also failed:', localError);
        throw new Error(`All province loading methods failed. Network: ${error.message}, Local: ${localError.message}`);
      }
    }
  }

  // Create local fallback provinces when all network sources fail
  async createLocalFallbackProvinces() {
    console.log('🏗️ Creating local fallback provinces...');
    
    // Basic province data for major regions
    const fallbackProvinces = [
      // North America
      { name: 'California', country: 'United States', coordinates: [[-124.4, 32.5], [-114.1, 32.5], [-114.1, 42.0], [-124.4, 42.0], [-124.4, 32.5]] },
      { name: 'Texas', country: 'United States', coordinates: [[-106.6, 25.8], [-93.5, 25.8], [-93.5, 36.5], [-106.6, 36.5], [-106.6, 25.8]] },
      { name: 'Ontario', country: 'Canada', coordinates: [[-95.2, 41.7], [-74.3, 41.7], [-74.3, 56.9], [-95.2, 56.9], [-95.2, 41.7]] },
      
      // Europe
      { name: 'Bavaria', country: 'Germany', coordinates: [[9.0, 47.3], [13.8, 47.3], [13.8, 50.6], [9.0, 50.6], [9.0, 47.3]] },
      { name: 'Île-de-France', country: 'France', coordinates: [[1.4, 48.1], [3.6, 48.1], [3.6, 49.2], [1.4, 49.2], [1.4, 48.1]] },
      { name: 'Lombardy', country: 'Italy', coordinates: [[8.5, 44.7], [11.3, 44.7], [11.3, 46.6], [8.5, 46.6], [8.5, 44.7]] },
      
      // Asia
      { name: 'Guangdong', country: 'China', coordinates: [[109.7, 20.2], [117.2, 20.2], [117.2, 25.5], [109.7, 25.5], [109.7, 20.2]] },
      { name: 'Maharashtra', country: 'India', coordinates: [[72.7, 15.6], [80.9, 15.6], [80.9, 22.0], [72.7, 22.0], [72.7, 15.6]] },
      { name: 'Tokyo', country: 'Japan', coordinates: [[138.9, 35.1], [140.0, 35.1], [140.0, 36.2], [138.9, 36.2], [138.9, 35.1]] },
      
      // South America
      { name: 'São Paulo', country: 'Brazil', coordinates: [[-53.1, -25.3], [-44.0, -25.3], [-44.0, -19.8], [-53.1, -19.8], [-53.1, -25.3]] },
      { name: 'Buenos Aires', country: 'Argentina', coordinates: [[-59.0, -35.0], [-57.0, -35.0], [-57.0, -33.0], [-59.0, -33.0], [-59.0, -35.0]] },
      
      // Africa
      { name: 'Western Cape', country: 'South Africa', coordinates: [[17.0, -35.0], [25.0, -35.0], [25.0, -31.0], [17.0, -31.0], [17.0, -35.0]] },
      { name: 'Lagos', country: 'Nigeria', coordinates: [[2.7, 6.2], [4.0, 6.2], [4.0, 7.0], [2.7, 7.0], [2.7, 6.2]] }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const province of fallbackProvinces) {
      try {
        const entity = this.viewer.entities.add({
          name: `${province.name}, ${province.country}`,
          polygon: {
            hierarchy: province.coordinates.map(coord => 
              this.viewer.scene.globe.ellipsoid.cartographicToCartesian(
                window.Cesium.Cartographic.fromDegrees(coord[0], coord[1])
              )
            ),
            material: window.Cesium.Color.LIGHTGREEN.withAlpha(0.3),
            outline: true,
            outlineColor: window.Cesium.Color.LIGHTGREEN,
            height: 0,
            extrudedHeight: 0
          },
          properties: {
            name: province.name,
            country: province.country,
            type: 'province',
            source: 'local_fallback'
          }
        });

        this.entities.province.set(`${province.name}_${province.country}`, entity);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to create fallback province ${province.name}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Local fallback provinces created: ${successCount} success, ${errorCount} errors`);
    console.log(`📊 Total province entities: ${this.entities.province.size}`);
  }

  // Preload provinces in background for instant activation
  async preloadProvinces() {
    console.log('🔄 Preloading provinces in background...');
    
    // Don't preload if already loaded or loading
    if (this.entities.province.size > 0 || this.loadingProvinces) {
      console.log('⚠️ Provinces already loaded or loading, skipping preload');
      return;
    }
    
    try {
      // Start preloading in background (don't await)
      this.loadProvinces().then(() => {
        console.log('✅ Province preloading completed in background');
      }).catch((error) => {
        console.warn('⚠️ Province preloading failed in background:', error);
      });
      
    } catch (error) {
      console.warn('⚠️ Error starting province preload:', error);
    }
  }

  // Load country boundaries
  async loadCountries() {
    console.log('🗺️ Loading country boundaries...');
    
    try {
      const response = await fetch(this.dataSources.natural_earth.countries);
      if (!response.ok) {
        throw new Error(`Failed to fetch country data: ${response.status}`);
      }
      
      const data = await response.json();
      const featureCount = data.features?.length || 0;
      console.log(`📊 Found ${featureCount} country features`);
      
      // Suspend rendering updates during batch creation (OPTIMIZATION)
      this.viewer.entities.suspendEvents();
      
      // Process country features in batches for better performance
      if (data.features) {
        const BATCH_SIZE = 50; // Process 50 countries at a time
        for (let i = 0; i < data.features.length; i += BATCH_SIZE) {
          const batch = data.features.slice(i, i + BATCH_SIZE);
          
          // Create entities in parallel within batch
          await Promise.all(batch.map(feature => this.createCountryEntity(feature)));
          
          // Log progress every batch (instead of per country)
          if (i % 100 === 0 && i > 0) {
            console.log(`📊 Progress: ${i}/${featureCount} countries loaded`);
          }
          
          // Allow UI to breathe between batches
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        console.log(`✅ All ${featureCount} countries loaded`);
      }
      
      // Resume rendering updates (OPTIMIZATION)
      this.viewer.entities.resumeEvents();
      
    } catch (error) {
      console.error('❌ Error loading countries:', error);
      // Make sure to resume events even on error
      if (this.viewer?.entities) {
        this.viewer.entities.resumeEvents();
      }
      throw error;
    }
  }

  // Load precomputed macro-region boundaries
  async loadMacroRegions() {
    console.log('🌍 Loading precomputed macro-region boundaries...');
    
    try {
      // Load precomputed macro-region boundaries from static file
      const response = await fetch('/macro_regions.geojson');
      if (!response.ok) {
        throw new Error(`Failed to fetch macro-regions: ${response.status} ${response.statusText}`);
      }
      
      const macroRegionsGeoJSON = await response.json();
      
      if (!macroRegionsGeoJSON || !macroRegionsGeoJSON.features) {
        throw new Error('Invalid macro-region GeoJSON data');
      }
      
      console.log(`📊 Loaded ${macroRegionsGeoJSON.features.length} precomputed macro-region boundaries`);
      
      // Log macro-region summary
      macroRegionsGeoJSON.features.forEach(macroRegion => {
        const { name, countries } = macroRegion.properties;
        const geometryType = macroRegion.geometry.type;
        const partCount = geometryType === 'MultiPolygon' ? macroRegion.geometry.coordinates.length : 1;
        console.log(`🗺️ ${name}: ${geometryType} (${partCount} parts, ${countries} countries)`);
      });
      
      // Create macro-region entities from precomputed data
      for (const macroRegionFeature of macroRegionsGeoJSON.features) {
        const regionName = macroRegionFeature.properties.name;
        console.log(`🌍 Creating macro-region entity: ${regionName}`);
        
        await this.createMacroRegionFromPrecomputed(regionName, macroRegionFeature);
      }
      
      // Mark macro-region layer as loaded
      this.loadedLayers.add('macro_region');
      console.log(`✅ Macro-region layer loaded with ${this.entities.macro_region.size} precomputed macro-region entities`);
      console.log(`🗺️ Created macro-regions:`, Array.from(this.entities.macro_region.keys()));
      
    } catch (error) {
      console.error('❌ Error loading precomputed macro-regions:', error);
      console.log('� Falling back to dynamic continent generation...');
      
      // Fallback to old dynamic method if precomputed data fails
      // For now, just log the error and return empty for testing
      console.log('🚫 Macro-region loading failed, no boundaries will be shown');
      this.loadedLayers.add('macro_region');
      return;
    }
  }
  
  // Fallback: Load continent boundaries (old dynamic approach)
  async loadContinentsFallback() {
    console.log('🌍 Loading continent boundaries (aggregating from countries)...');
    
    try {
      // Fetch country data which includes CONTINENT property
      const response = await fetch(this.dataSources.natural_earth.countries);
      if (!response.ok) {
        throw new Error(`Failed to fetch country data for continents: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📊 Found ${data.features?.length || 0} country features to aggregate into continents`);
      
      // Group countries by continent
      const continentGroups = new Map();
      
      if (data.features) {
        for (const feature of data.features) {
          const properties = feature.properties || {};
          
          // Try multiple property names that Natural Earth might use for continents
          const continent = properties.CONTINENT || 
                           properties.continent || 
                           properties.SUBREGION ||
                           properties.subregion ||
                           properties.REGION_UN ||
                           properties.region_un ||
                           this.getCountryContinent(properties.NAME || properties.name || properties.ADMIN || 'Unknown');
          
          if (!continentGroups.has(continent)) {
            continentGroups.set(continent, []);
          }
          continentGroups.get(continent).push(feature);
        }
      }
      
      // Create continent entities by merging country geometries
      for (const [continentName, countries] of continentGroups.entries()) {
        if (continentName === 'Unknown' || countries.length === 0) {
          continue;
        }
        
        console.log(`🌍 Creating continent: ${continentName} from ${countries.length} countries`);
        // Skip creation since we're focusing on precomputed macro-regions
        // await this.createContinentFromCountries(continentName, countries);
      }
      
      // Mark macro-region layer as loaded (fallback mode)
      this.loadedLayers.add('macro_region');
      console.log(`✅ Macro-region layer loaded with ${this.entities.macro_region.size} continent entities (fallback)`);
      
    } catch (error) {
      console.error('❌ Error loading continents fallback:', error);
      throw error;
    }
  }

  /**
   * Get consistent material for each region
   */
  getConsistentRegionMaterial(regionName) {
    const regionColors = {
      'Asia': Cesium.Color.LIGHTBLUE.withAlpha(0.4),
      'Americas': Cesium.Color.LIGHTGREEN.withAlpha(0.4),
      'Africa': Cesium.Color.LIGHTYELLOW.withAlpha(0.4),
      'Europe': Cesium.Color.LIGHTCORAL.withAlpha(0.4),
      'Oceania': Cesium.Color.LIGHTCYAN.withAlpha(0.4)
    };
    return regionColors[regionName] || Cesium.Color.LIGHTGRAY.withAlpha(0.4);
  }

  /**
   * Create macro-region entity from precomputed GeoJSON feature
   */
  async createMacroRegionFromPrecomputed(regionName, macroRegionFeature) {
    try {
      if (!macroRegionFeature || !macroRegionFeature.geometry) {
        console.error(`❌ Invalid macro-region feature for ${regionName}`);
        return;
      }
      
      const geometry = macroRegionFeature.geometry;
      const properties = macroRegionFeature.properties;
      
      // Analyze the macro-region boundary
      const geometryType = geometry.type;
      const isMultiPolygon = geometryType === 'MultiPolygon';
      const partCount = isMultiPolygon ? geometry.coordinates.length : 1;
      
      console.log(`🗺️ ${regionName}: ${geometryType} with ${partCount} part(s) (${properties.countries} countries)`);
      
      // Convert to Cesium polygon hierarchy
      let cesiumHierarchy;
      
      if (isMultiPolygon) {
        // Handle MultiPolygon - use largest part for main boundary
        const polygons = geometry.coordinates;
        
        // Find largest polygon by coordinate count (approximation of area)
        let largestPolygon = polygons[0];
        let maxCoords = largestPolygon[0].length;
        
        for (let i = 1; i < polygons.length; i++) {
          const coordCount = polygons[i][0].length;
          if (coordCount > maxCoords) {
            largestPolygon = polygons[i];
            maxCoords = coordCount;
          }
        }
        
        console.log(`🗺️ ${regionName}: using largest of ${partCount} polygon parts (${maxCoords} vertices)`);
        
        // Use largest polygon for main boundary
        const exteriorRing = largestPolygon[0];
        const holes = largestPolygon.slice(1);
        
        cesiumHierarchy = new Cesium.PolygonHierarchy(
          exteriorRing.map(coord => Cesium.Cartesian3.fromDegrees(coord[0], coord[1])),
          holes.map(hole => new Cesium.PolygonHierarchy(
            hole.map(coord => Cesium.Cartesian3.fromDegrees(coord[0], coord[1]))
          ))
        );
      } else {
        // Handle single Polygon
        const coordinates = geometry.coordinates;
        const exteriorRing = coordinates[0];
        const holes = coordinates.slice(1);
        
        console.log(`🗺️ ${regionName}: single polygon (${exteriorRing.length} vertices)`);
        
        cesiumHierarchy = new Cesium.PolygonHierarchy(
          exteriorRing.map(coord => Cesium.Cartesian3.fromDegrees(coord[0], coord[1])),
          holes.map(hole => new Cesium.PolygonHierarchy(
            hole.map(coord => Cesium.Cartesian3.fromDegrees(coord[0], coord[1]))
          ))
        );
      }
      
      // Create macro-region entity with proper styling to prevent overlap rendering
      const macroRegionEntity = this.viewer.entities.add({
        id: `macro-region-${regionName.toLowerCase().replace(/\s+/g, '-')}`,
        name: regionName,
        polygon: {
          hierarchy: cesiumHierarchy,
          material: this.getConsistentRegionMaterial(regionName), // Consistent color per region
          outline: true, // Enable outline for better definition
          outlineColor: Cesium.Color.NAVY.withAlpha(0.8),
          outlineWidth: 2,
          extrudedHeight: undefined, // Prevent z-fighting
          height: 0, // Keep flat on surface
          closeTop: false,
          closeBottom: false,
          classificationType: Cesium.ClassificationType.TERRAIN
        },
        properties: {
          type: 'macro_region',
          name: regionName,
          countries: properties.countries || 0,
          un_classification: properties.un_classification || 'macro-region',
          layer: 'macro_region'
        }
      });
      
      // Store in entities map
      this.entities.macro_region.set(regionName, macroRegionEntity);
      
      console.log(`✅ Created precomputed macro-region boundary: ${regionName} (dissolved ${properties.countries} countries, UN geoscheme)`);
      
    } catch (error) {
      console.error(`❌ Error creating macro-region entity for ${regionName}:`, error);
    }
  }

  // Auto-generate Others entities for a specific layer
  async generateOthersForLayer(layerType) {
    const layer = this.layers[layerType];
    if (!layer || !layer.othersRule) {
      console.log(`ℹ️ No Others rule for ${layerType} layer (or layer not found)`);
      return;
    }

    console.log(`🏞️ Generating Others for ${layer.name} layer...`);
    console.log(`🔍 Layer type: ${layerType}, Others rule: ${layer.othersRule}`);
    
    try {
      switch (layerType) {
        case 'neighborhood':
          await this.generateNeighborhoodOthers();
          break;
        case 'city':
          await this.generateCityOthers();
          break;
        case 'province':
          await this.generateProvinceOthers();
          break;
        case 'country':
          await this.generateCountryOthers();
          break;
      }
    } catch (error) {
      console.error(`❌ Error generating Others for ${layerType}:`, error);
    }
  }

  // Generate Others for neighborhoods (City - Neighborhoods)
  async generateNeighborhoodOthers() {
    console.log('🏘️ Generating neighborhood-level Others...');
    
    // Get all cities
    const cities = Array.from(this.entities.city.values());
    
    for (const cityEntity of cities) {
      const cityName = cityEntity.properties.getValue().name;
      const countryName = cityEntity.properties.getValue().country;
      
      // Get neighborhoods in this city
      const neighborhoodsInCity = Array.from(this.entities.neighborhood.values())
        .filter(neighborhood => {
          // Check if neighborhood is within city bounds
          return this.isEntityWithinEntity(neighborhood, cityEntity);
        });
      
      if (neighborhoodsInCity.length > 0) {
        await this.createOthersEntity(
          'neighborhood',
          `Others - ${cityName}, ${countryName}`,
          cityEntity,
          neighborhoodsInCity
        );
        
        const area = this.calculateEntityArea(cityEntity);
        console.log(`✅ Created Others for ${cityName}, covering ${Math.round(area/1000000)} km²`);
      }
    }
  }

  // Generate Others for cities (Province - Cities)
  async generateCityOthers() {
    console.log('🏙️ Generating city-level Others...');
    
    // Get all provinces
    const provinces = Array.from(this.entities.province.values());
    
    for (const provinceEntity of provinces) {
      const provinceName = provinceEntity.properties.getValue().name;
      const countryName = provinceEntity.properties.getValue().country;
      
      // Get cities in this province
      const citiesInProvince = Array.from(this.entities.city.values())
        .filter(city => {
          return this.isEntityWithinEntity(city, provinceEntity);
        });
      
      if (citiesInProvince.length > 0) {
        await this.createOthersEntity(
          'city',
          `Others - ${provinceName}, ${countryName}`,
          provinceEntity,
          citiesInProvince
        );
        
        const area = this.calculateEntityArea(provinceEntity);
        if (this.DEBUG) console.log(`✅ Created Others for ${provinceName}, covering ${Math.round(area/1000000)} km²`);
      }
    }
  }

  // Generate Others for provinces (Country - Provinces)
  async generateProvinceOthers() {
    if (this.DEBUG) {
    console.log('🏛️ Generating province-level Others...');
    console.log(`🔍 Countries available: ${this.entities.country.size}`);
    console.log(`🔍 Provinces available: ${this.entities.province.size}`);
    }
    
    // Get all countries
    const countries = Array.from(this.entities.country.values());
    
    for (const countryEntity of countries) {
      const countryName = countryEntity.properties.getValue().name;
      
      // Get provinces in this country
      const provincesInCountry = Array.from(this.entities.province.values())
        .filter(province => {
          return this.isEntityWithinEntity(province, countryEntity);
        });
      
      if (provincesInCountry.length > 0) {
        await this.createOthersEntity(
          'province',
          `Others - ${countryName}`,
          countryEntity,
          provincesInCountry
        );
        
        const area = this.calculateEntityArea(countryEntity);
        if (this.DEBUG) console.log(`✅ Aggregated Others for ${countryName} from ${provincesInCountry.length} provinces, covering ${Math.round(area/1000000)} km²`);
      }
    }
  }

  // Generate Others for countries (Continent - Countries)
  async generateCountryOthers() {
    console.log('🗺️ Generating country-level Others...');
    
    // Get all continents
    const continents = Array.from(this.entities.continent.values());
    
    for (const continentEntity of continents) {
      const continentName = continentEntity.properties.getValue().name;
      
      // Get countries in this continent
      const countriesInContinent = Array.from(this.entities.country.values())
        .filter(country => {
          return this.isEntityWithinEntity(country, continentEntity);
        });
      
      if (countriesInContinent.length > 0) {
        await this.createOthersEntity(
          'country',
          `Others - ${continentName}`,
          continentEntity,
          countriesInContinent
        );
        
        const area = this.calculateEntityArea(continentEntity);
        console.log(`✅ Aggregated Others for ${continentName} from ${countriesInContinent.length} countries, covering ${Math.round(area/1000000)} km²`);
      }
    }
  }

  // Create an Others entity
  async createOthersEntity(level, name, parentEntity, childEntities) {
    try {
      const Cesium = window.Cesium;
      
      // Convert parent entity to GeoJSON
      const parentGeoJSON = this.cesiumToGeoJSON(parentEntity);
      if (!parentGeoJSON) return;
      
      // Convert child entities to GeoJSON and union them
      let childUnion = null;
      for (const childEntity of childEntities) {
        const childGeoJSON = this.cesiumToGeoJSON(childEntity);
        if (childGeoJSON) {
          if (childUnion === null) {
            childUnion = childGeoJSON;
          } else {
            try {
              childUnion = turf.union(childUnion, childGeoJSON);
            } catch (error) {
              console.warn('⚠️ Union failed for child entity:', error);
            }
          }
        }
      }
      
      if (childUnion) {
        // Calculate Others = Parent - Children
        const othersGeoJSON = turf.difference(parentGeoJSON, childUnion);
        
        if (othersGeoJSON && turf.getGeom(othersGeoJSON)) {
          const area = turf.area(othersGeoJSON);
          if (area > 1000000) { // 1 km² minimum
            const coordinates = this.geoJSONToCesiumCoordinates(othersGeoJSON);
            if (coordinates) {
              const entity = this.viewer.entities.add({
                id: `others_${level}_${Date.now()}`,
                name: name,
                polygon: {
                  hierarchy: coordinates,
                  material: Cesium.Color.GRAY.withAlpha(0.3),
                  outline: true,
                  outlineColor: Cesium.Color.DARKGRAY,
                  outlineWidth: 1,
                  height: 0,
                  extrudedHeight: 0,
                  classificationType: Cesium.ClassificationType.BOTH
                },
                properties: {
                  type: 'others',
                  level: level,
                  parent: parentEntity.id,
                  children: childEntities.map(e => e.id),
                  created: new Date().toISOString(),
                  autoGenerated: true
                }
              });
              
              // Store in Others entities
              this.othersEntities[level].set(entity.id, entity);
              
              // Add to main entities ref
              if (this.entitiesRef && this.entitiesRef.current) {
                this.entitiesRef.current.set(entity.id, entity);
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Error creating Others entity for ${level}:`, error);
    }
  }

  // Helper methods
  isEntityWithinEntity(childEntity, parentEntity) {
    // Simplified check - in production, use proper geometric intersection
    const childPos = childEntity.position?.getValue();
    const parentPos = parentEntity.position?.getValue();
    
    if (childPos && parentPos) {
      const distance = Cesium.Cartesian3.distance(childPos, parentPos);
      return distance < 1000000; // 1000km threshold
    }
    
    return false;
  }

  calculateEntityArea(entity) {
    // Simplified area calculation
    const polygon = entity.polygon;
    if (polygon && polygon.hierarchy) {
      const positions = polygon.hierarchy.getValue().positions;
      if (positions && positions.length > 2) {
        // Use Cesium's area calculation
        return Cesium.PolygonGeometryLibrary.computeArea2D(positions);
      }
    }
    return 0;
  }

  cesiumToGeoJSON(cesiumEntity) {
    try {
      const polygon = cesiumEntity.polygon;
      if (polygon && polygon.hierarchy) {
        const positions = polygon.hierarchy.getValue().positions;
        const coordinates = positions.map(pos => {
          const cartographic = Cesium.Cartographic.fromCartesian(pos);
          return [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
        });
        
        return {
          type: 'Polygon',
          coordinates: [coordinates]
        };
      }
    } catch (error) {
      console.warn('⚠️ Error converting Cesium entity to GeoJSON:', error);
    }
    return null;
  }

  geoJSONToCesiumCoordinates(geoJSON) {
    try {
      const Cesium = window.Cesium;
      
      if (!geoJSON) {
        console.warn('⚠️ No geometry provided to geoJSONToCesiumCoordinates');
        return null;
      }
      
      if (!geoJSON.type) {
        console.warn('⚠️ No geometry type in GeoJSON:', geoJSON);
        return null;
      }
      
      if (geoJSON.type === 'Polygon' && geoJSON.coordinates && geoJSON.coordinates[0]) {
        const coords = geoJSON.coordinates[0];
        if (coords.length < 3) {
          console.warn('⚠️ Polygon has less than 3 coordinates');
          return null;
        }
        return coords.map(coord => {
          if (!coord || coord.length < 2) {
            console.warn('⚠️ Invalid coordinate:', coord);
            return null;
          }
          return Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 0);
        }).filter(coord => coord !== null);
      } else if (geoJSON.type === 'MultiPolygon' && geoJSON.coordinates) {
        // For MultiPolygon, use the largest polygon
        let largestPolygon = null;
        let largestArea = 0;
        
        for (const polygon of geoJSON.coordinates) {
          if (polygon && polygon[0] && polygon[0].length >= 3) {
            // Calculate approximate area
            const area = this.calculatePolygonArea(polygon[0]);
            if (area > largestArea) {
              largestArea = area;
              largestPolygon = polygon[0];
            }
          }
        }
        
        if (largestPolygon) {
          return largestPolygon.map(coord => {
            if (!coord || coord.length < 2) {
              console.warn('⚠️ Invalid coordinate in MultiPolygon:', coord);
              return null;
            }
            return Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 0);
          }).filter(coord => coord !== null);
        }
      } else {
        console.warn(`⚠️ Unsupported geometry type: ${geoJSON.type}`);
      }
    } catch (error) {
      console.warn('⚠️ Error converting GeoJSON to Cesium coordinates:', error);
    }
    return null;
  }

  calculatePolygonArea(coordinates) {
    // Simple area calculation for polygon comparison
    let area = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const x1 = coordinates[i][0];
      const y1 = coordinates[i][1];
      const x2 = coordinates[i + 1][0];
      const y2 = coordinates[i + 1][1];
      area += (x1 * y2 - x2 * y1);
    }
    return Math.abs(area) / 2;
  }

  // Map country names to continents (fallback for when Natural Earth doesn't have CONTINENT property)
  getCountryContinent(countryName) {
    const countryToContinentMap = {
      // North America
      'United States': 'North America',
      'United States of America': 'North America',
      'Canada': 'North America',
      'Mexico': 'North America',
      'Guatemala': 'North America',
      'Belize': 'North America',
      'Costa Rica': 'North America',
      'El Salvador': 'North America',
      'Honduras': 'North America',
      'Nicaragua': 'North America',
      'Panama': 'North America',
      
      // South America
      'Brazil': 'South America',
      'Argentina': 'South America',
      'Chile': 'South America',
      'Peru': 'South America',
      'Colombia': 'South America',
      'Venezuela': 'South America',
      'Ecuador': 'South America',
      'Bolivia': 'South America',
      'Paraguay': 'South America',
      'Uruguay': 'South America',
      'Guyana': 'South America',
      'Suriname': 'South America',
      'French Guiana': 'South America',
      
      // Europe
      'France': 'Europe',
      'Germany': 'Europe',
      'Italy': 'Europe',
      'Spain': 'Europe',
      'United Kingdom': 'Europe',
      'Poland': 'Europe',
      'Netherlands': 'Europe',
      'Belgium': 'Europe',
      'Greece': 'Europe',
      'Portugal': 'Europe',
      'Czech Republic': 'Europe',
      'Hungary': 'Europe',
      'Sweden': 'Europe',
      'Austria': 'Europe',
      'Belarus': 'Europe',
      'Switzerland': 'Europe',
      'Bulgaria': 'Europe',
      'Serbia': 'Europe',
      'Denmark': 'Europe',
      'Finland': 'Europe',
      'Slovakia': 'Europe',
      'Norway': 'Europe',
      'Ireland': 'Europe',
      'Croatia': 'Europe',
      'Bosnia and Herzegovina': 'Europe',
      'Albania': 'Europe',
      'Lithuania': 'Europe',
      'Slovenia': 'Europe',
      'Latvia': 'Europe',
      'Estonia': 'Europe',
      'Macedonia': 'Europe',
      'Moldova': 'Europe',
      'Luxembourg': 'Europe',
      'Malta': 'Europe',
      'Iceland': 'Europe',
      
      // Africa
      'Nigeria': 'Africa',
      'Ethiopia': 'Africa',
      'Egypt': 'Africa',
      'South Africa': 'Africa',
      'Kenya': 'Africa',
      'Sudan': 'Africa',
      'Algeria': 'Africa',
      'Morocco': 'Africa',
      'Angola': 'Africa',
      'Mozambique': 'Africa',
      'Ghana': 'Africa',
      'Madagascar': 'Africa',
      'Cameroon': 'Africa',
      'Ivory Coast': 'Africa',
      'Niger': 'Africa',
      'Burkina Faso': 'Africa',
      'Mali': 'Africa',
      'Malawi': 'Africa',
      'Zambia': 'Africa',
      'Somalia': 'Africa',
      'Senegal': 'Africa',
      'Chad': 'Africa',
      'Tunisia': 'Africa',
      'Zimbabwe': 'Africa',
      'Guinea': 'Africa',
      'Rwanda': 'Africa',
      'Benin': 'Africa',
      'Burundi': 'Africa',
      'Tunisia': 'Africa',
      'South Sudan': 'Africa',
      'Togo': 'Africa',
      'Sierra Leone': 'Africa',
      'Libya': 'Africa',
      'Liberia': 'Africa',
      'Central African Republic': 'Africa',
      'Mauritania': 'Africa',
      'Eritrea': 'Africa',
      'Gambia': 'Africa',
      'Botswana': 'Africa',
      'Namibia': 'Africa',
      'Gabon': 'Africa',
      'Lesotho': 'Africa',
      'Guinea-Bissau': 'Africa',
      'Equatorial Guinea': 'Africa',
      'Mauritius': 'Africa',
      'Swaziland': 'Africa',
      'Djibouti': 'Africa',
      'Comoros': 'Africa',
      'Cape Verde': 'Africa',
      'Sao Tome and Principe': 'Africa',
      'Seychelles': 'Africa',
      
      // Asia
      'China': 'Asia',
      'India': 'Asia',
      'Indonesia': 'Asia',
      'Pakistan': 'Asia',
      'Bangladesh': 'Asia',
      'Russia': 'Asia',
      'Russian Federation': 'Asia',
      'Japan': 'Asia',
      'Philippines': 'Asia',
      'Vietnam': 'Asia',
      'Turkey': 'Asia',
      'Iran': 'Asia',
      'Thailand': 'Asia',
      'Myanmar': 'Asia',
      'South Korea': 'Asia',
      'Iraq': 'Asia',
      'Afghanistan': 'Asia',
      'Saudi Arabia': 'Asia',
      'Uzbekistan': 'Asia',
      'Malaysia': 'Asia',
      'Nepal': 'Asia',
      'Yemen': 'Asia',
      'North Korea': 'Asia',
      'Syria': 'Asia',
      'Cambodia': 'Asia',
      'Jordan': 'Asia',
      'Azerbaijan': 'Asia',
      'Sri Lanka': 'Asia',
      'Tajikistan': 'Asia',
      'United Arab Emirates': 'Asia',
      'Israel': 'Asia',
      'Laos': 'Asia',
      'Singapore': 'Asia',
      'Oman': 'Asia',
      'Kuwait': 'Asia',
      'Georgia': 'Asia',
      'Mongolia': 'Asia',
      'Armenia': 'Asia',
      'Qatar': 'Asia',
      'Bahrain': 'Asia',
      'East Timor': 'Asia',
      'Maldives': 'Asia',
      'Brunei': 'Asia',
      'Bhutan': 'Asia',
      
      // Oceania
      'Australia': 'Oceania',
      'Papua New Guinea': 'Oceania',
      'New Zealand': 'Oceania',
      'Fiji': 'Oceania',
      'Solomon Islands': 'Oceania',
      'Vanuatu': 'Oceania',
      'Samoa': 'Oceania',
      'Kiribati': 'Oceania',
      'Tonga': 'Oceania',
      'Micronesia': 'Oceania',
      'Palau': 'Oceania',
      'Marshall Islands': 'Oceania',
      'Tuvalu': 'Oceania',
      'Nauru': 'Oceania',
      
      // Antarctica
      'Antarctica': 'Antarctica'
    };
    
    return countryToContinentMap[countryName] || 'Unknown';
  }

  // Create entity methods (simplified for now)
  async createNeighborhoodEntity(element) {
    // Implementation for neighborhood entities
    console.log('🏘️ Creating neighborhood entity:', element.tags?.name);
  }

  async createCityEntity(feature) {
    try {
      const Cesium = window.Cesium;
      const properties = feature.properties || {};
      // Fast property extraction - skip if no name available
      const cityName = properties.NAME || properties.name || properties.NAME_EN;
      if (!cityName) {
        return; // Skip entities without names for performance
      }
      
      const countryName = properties.ADMIN || properties.ADMIN_0 || properties.COUNTRY || 'Unknown Country';
      const provinceName = properties.ADMIN_1 || properties.STATE || 'Unknown Province';
      
      // Convert GeoJSON to Cesium coordinates
      const coordinates = this.geoJSONToCesiumCoordinates(feature.geometry);
      if (!coordinates || coordinates.length < 3) {
        // Only warn in debug mode to reduce console spam
        if (this.DEBUG) {
          console.warn(`⚠️ Skipping city ${cityName}: Invalid coordinates (${coordinates?.length || 0} points)`);
        }
        return;
      }
      
      // Create Cesium entity with optimized properties for cities
      const entity = this.viewer.entities.add({
        id: `city:${cityName}:${Date.now()}`,
        name: cityName,
        show: true, // Explicitly ensure visibility
        polygon: {
          hierarchy: coordinates,
          material: Cesium.Color.YELLOW.withAlpha(0.7), // More visible yellow fill
          outline: true,
          outlineColor: Cesium.Color.ORANGE, // Orange outline for better visibility
          outlineWidth: 2, // Thicker outline
          height: 0,
          extrudedHeight: 0,
          classificationType: Cesium.ClassificationType.TERRAIN,
          // Add performance optimizations
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 1.0e7), // Closer visibility for cities
          shadows: Cesium.ShadowMode.DISABLED
        },
        properties: {
          type: 'city',
          name: cityName,
          country: countryName,
          province: provinceName,
          created: new Date().toISOString(),
          source: 'natural_earth'
        }
      });
      
      // Store in city entities
      this.entities.city.set(entity.id, entity);
      
      // Cache entity for persistence
      this.entityCache.set(entity.id, entity);
      
      // Add to main entities ref for persistence (silent failure)
      this.registerEntityInRef(entity);
      
      // Skip debug logging for performance
      
    } catch (error) {
      // Only log errors in debug mode to reduce console spam
      if (this.DEBUG) {
        console.error(`❌ Error creating city entity for ${cityName}:`, error);
        console.error(`❌ Feature properties:`, properties);
        console.error(`❌ Feature geometry:`, feature.geometry);
      }
      throw error; // Re-throw for batch processing
    }
  }

  async createProvinceEntity(feature) {
    try {
      const Cesium = window.Cesium;
      const properties = feature.properties || {};
      const provinceName = properties.NAME || properties.name || 'Unknown Province';
      const countryName = properties.ADMIN || properties.ADMIN_0 || properties.country || properties.COUNTRY || 'Unknown Country';
      
      // Convert GeoJSON to Cesium coordinates
      const coordinates = this.geoJSONToCesiumCoordinates(feature.geometry);
      if (!coordinates || coordinates.length < 3) {
        // Only warn in debug mode to reduce console spam
        if (this.DEBUG) {
        console.warn(`⚠️ Skipping province ${provinceName}: Invalid coordinates (${coordinates?.length || 0} points)`);
        }
        return;
      }
      
      // Create Cesium entity with optimized properties
      const entity = this.viewer.entities.add({
        id: `province:${provinceName}:${Date.now()}`,
        name: provinceName,
        polygon: {
          hierarchy: coordinates,
          material: Cesium.Color.LIGHTGREEN.withAlpha(0.3),
          outline: true,
          outlineColor: Cesium.Color.GREEN,
          outlineWidth: 2,
          height: 0,
          extrudedHeight: 0,
          classificationType: Cesium.ClassificationType.TERRAIN,
          // Add performance optimizations
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 2.5e7),
          shadows: Cesium.ShadowMode.DISABLED
        }
      });
      
      // Add properties as ConstantProperty for RegionManager hover detection
      entity.properties = {
        type: new Cesium.ConstantProperty('province'),
        name: new Cesium.ConstantProperty(provinceName),
        layerType: new Cesium.ConstantProperty('provinces'),
        regionName: new Cesium.ConstantProperty(provinceName),
        country: new Cesium.ConstantProperty(countryName),
        created: new Cesium.ConstantProperty(new Date().toISOString()),
        source: new Cesium.ConstantProperty('natural_earth')
      };
      
      // Store in province entities
      this.entities.province.set(entity.id, entity);
      
      // Cache entity for persistence
      this.entityCache.set(entity.id, entity);
      
      // Add to main entities ref for persistence (silent failure)
      this.registerEntityInRef(entity);
      
    } catch (error) {
      // Only log errors in debug mode to reduce console spam
      if (this.DEBUG) {
      console.error(`❌ Error creating province entity for ${provinceName}:`, error);
      console.error(`❌ Feature properties:`, properties);
      console.error(`❌ Feature geometry:`, feature.geometry);
      }
      throw error; // Re-throw for batch processing
    }
  }

  async createCountryEntity(feature) {
    try {
      const Cesium = window.Cesium;
      const properties = feature.properties || {};
      const countryName = properties.NAME || properties.name || 'Unknown Country';
      
      // REMOVED: Verbose per-country logging (was 516 console.log operations)
      
      // Convert GeoJSON to Cesium coordinates
      const coordinates = this.geoJSONToCesiumCoordinates(feature.geometry);
      if (!coordinates) {
        console.warn(`⚠️ Skipping country ${countryName}: Invalid coordinates`);
        return;
      }
      
      // Create Cesium entity
      const entity = this.viewer.entities.add({
        id: `country:${countryName}:${Date.now()}`,
        name: countryName,
        polygon: {
          hierarchy: coordinates,
          material: Cesium.Color.LIGHTBLUE.withAlpha(0.2),
          outline: true,
          outlineColor: Cesium.Color.BLUE,
          outlineWidth: 2,
          height: 0,
          extrudedHeight: 0,
          classificationType: Cesium.ClassificationType.TERRAIN
        }
      });
      
      // Add properties as ConstantProperty for RegionManager hover detection
      entity.properties = {
        type: new Cesium.ConstantProperty('country'),
        name: new Cesium.ConstantProperty(countryName),
        layerType: new Cesium.ConstantProperty('countries'),
        regionName: new Cesium.ConstantProperty(countryName),
        created: new Cesium.ConstantProperty(new Date().toISOString()),
        source: new Cesium.ConstantProperty('natural_earth')
      };
      
      // Store in country entities
      this.entities.country.set(entity.id, entity);
      
      // Add to main entities ref for persistence
      this.registerEntityInRef(entity);
      
      // SUCCESS: Entity created (no log needed - batch reports progress)
      
    } catch (error) {
      console.error(`❌ Error creating country entity for ${properties.NAME || properties.name}:`, error);
    }
  }

  async createContinentFromCountries(continentName, countries) {
    try {
      const Cesium = window.Cesium;
      
      console.log(`🌍 Creating accurate continent boundary: ${continentName} from ${countries.length} countries (using topology dissolve)`);
      
      if (countries.length === 0) {
        console.warn(`⚠️ No countries provided for continent: ${continentName}`);
        return;
      }
      
      // Collect all valid country features as GeoJSON
      const validFeatures = [];
      for (const country of countries) {
        if (country && country.geometry) {
          const geomType = country.geometry.type;
          if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
            // Normalize geometry winding order and fix potential issues
            let normalizedGeometry = country.geometry;
            try {
              // Rewind to ensure proper orientation
              const feature = { type: 'Feature', geometry: normalizedGeometry };
              const rewound = turf.rewind(feature, { reverse: false });
              normalizedGeometry = rewound.geometry;
            } catch (rewindError) {
              console.warn(`⚠️ Could not rewind ${country.properties?.NAME || 'unknown'}, using original geometry`);
            }
            
            validFeatures.push({
              type: 'Feature',
              geometry: normalizedGeometry,
              properties: { 
                ...country.properties, 
                continent: continentName,
                countryName: country.properties?.NAME || country.properties?.name || 'Unknown'
              }
            });
          }
        }
      }
      
      if (validFeatures.length === 0) {
        console.warn(`⚠️ No valid countries for continent: ${continentName}`);
        return;
      }
      
      console.log(`📐 Dissolving ${validFeatures.length} country polygons for ${continentName} (preserving coastlines and islands)...`);
      
      // Create FeatureCollection for topology processing
      const countriesFC = {
        type: 'FeatureCollection',
        features: validFeatures
      };
      
      let continentBoundary;
      try {
        // Method 1: Use turf.dissolve (simple and effective)
        console.log(`🔧 Using turf.dissolve for ${continentName}...`);
        
        // Add a common property for dissolving
        const featuresForDissolve = validFeatures.map(f => ({
          ...f,
          properties: { ...f.properties, continent: continentName }
        }));
        
        const featureCollectionForDissolve = {
          type: 'FeatureCollection',
          features: featuresForDissolve
        };
        
        // Dissolve by continent property
        const dissolved = turf.dissolve(featureCollectionForDissolve, { propertyName: 'continent' });
        
        if (dissolved.features && dissolved.features.length > 0) {
          continentBoundary = dissolved.features[0];
          console.log(`✅ turf.dissolve successful for ${continentName}`);
        } else {
          throw new Error('Dissolve returned no features');
        }
        
      } catch (dissolveError) {
        console.warn(`⚠️ turf.dissolve failed for ${continentName}: ${dissolveError.message}`);
        console.log(`🔄 Falling back to careful union for ${continentName}...`);
        
        // Method 2: Fast batch union with entire FeatureCollection
        try {
          console.log(`� Fast batch union for ${continentName} with ${validFeatures.length} countries`);
          
          if (validFeatures.length === 0) {
            throw new Error('No valid features to merge');
          }
          
          if (validFeatures.length === 1) {
            // Only one country, use it directly
            continentBoundary = turf.cleanCoords(validFeatures[0]);
            console.log(`✅ Single country continent: ${continentName}`);
          } else {
            // Multiple countries, union them all at once
            const cleanedFeatures = validFeatures.map(feature => {
              try {
                return turf.cleanCoords(feature);
              } catch (error) {
                console.warn(`⚠️ Failed to clean coordinates for country, using original`);
                return feature;
              }
            });
            
            const featureCollection = turf.featureCollection(cleanedFeatures);
            
            // Try batch union with entire collection
            const unionResult = turf.union(featureCollection);
            if (unionResult && unionResult.geometry) {
              continentBoundary = unionResult;
              console.log(`🚀 Fast batch union successful for ${continentName} (${validFeatures.length} countries merged)`);
            } else {
              throw new Error('Batch union returned null result');
            }
          }
          
        } catch (unionError) {
          console.error(`❌ Both dissolve and union failed for ${continentName}:`, unionError.message);
          
          // Method 3: Create MultiPolygon from all individual countries (preserves all boundaries)
          console.log(`🔄 Using MultiPolygon approach for ${continentName}...`);
          
          const allCoordinates = [];
          for (const feature of validFeatures) {
            if (feature.geometry.type === 'Polygon') {
              allCoordinates.push(feature.geometry.coordinates);
            } else if (feature.geometry.type === 'MultiPolygon') {
              allCoordinates.push(...feature.geometry.coordinates);
            }
          }
          
          continentBoundary = {
            type: 'Feature',
            geometry: {
              type: 'MultiPolygon',
              coordinates: allCoordinates
            },
            properties: { name: continentName, type: 'continent' }
          };
          
          console.log(`✅ MultiPolygon created for ${continentName} (${allCoordinates.length} parts)`);
        }
      }
      
      if (!continentBoundary || !continentBoundary.geometry) {
        console.error(`❌ Failed to create boundary for ${continentName}`);
        return;
      }
      
      // Analyze the dissolved boundary
      const geometryType = continentBoundary.geometry.type;
      const isMultiPolygon = geometryType === 'MultiPolygon';
      const partCount = isMultiPolygon ? continentBoundary.geometry.coordinates.length : 1;
      
      console.log(`📊 ${continentName} boundary: ${geometryType} with ${partCount} part(s) ${isMultiPolygon ? '(includes islands)' : '(single landmass)'}`);
      
      // Convert the dissolved boundary to Cesium coordinates
      const coordinates = this.geoJSONToCesiumCoordinates(continentBoundary.geometry);
      if (!coordinates) {
        console.error(`❌ Failed to convert ${continentName} geometry to Cesium coordinates`);
        return;
      }
      
      // For MultiPolygon, we need to handle multiple parts
      let cesiumHierarchy;
      if (isMultiPolygon) {
        // Convert each polygon part to Cesium coordinates
        const polygonParts = [];
        for (let i = 0; i < continentBoundary.geometry.coordinates.length; i++) {
          const polygonCoords = continentBoundary.geometry.coordinates[i];
          const cesiumCoords = polygonCoords[0].map(coord => 
            Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 0)
          );
          polygonParts.push(cesiumCoords);
        }
        
        // Use the largest polygon part as the main hierarchy
        cesiumHierarchy = polygonParts.reduce((largest, current) => 
          current.length > largest.length ? current : largest
        );
        
        console.log(`📊 ${continentName}: using largest of ${polygonParts.length} polygon parts (${cesiumHierarchy.length} vertices)`);
      } else {
        cesiumHierarchy = coordinates;
        console.log(`📊 ${continentName}: single polygon (${coordinates.length} vertices)`);
      }
      
      // Create single unified continent entity
      const continentId = `continent:${continentName}:${Date.now()}`;
      const entity = this.viewer.entities.add({
        id: continentId,
        name: continentName,
        polygon: {
          hierarchy: cesiumHierarchy,
          material: Cesium.Color.fromCssColorString('#FF8C00').withAlpha(0.3), // Dark orange
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#FF8C00'),
          outlineWidth: 4,
          height: 0,
          extrudedHeight: 0,
          classificationType: Cesium.ClassificationType.TERRAIN,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 2.5e7),
          shadows: Cesium.ShadowMode.DISABLED
        }
      });
      
      // Add properties for hover detection
      entity.properties = {
        type: new Cesium.ConstantProperty('continent'),
        name: new Cesium.ConstantProperty(continentName),
        layerType: new Cesium.ConstantProperty('continents'),
        regionName: new Cesium.ConstantProperty(continentName),
        countryCount: new Cesium.ConstantProperty(validFeatures.length),
        geometryType: new Cesium.ConstantProperty(geometryType),
        partCount: new Cesium.ConstantProperty(partCount),
        created: new Cesium.ConstantProperty(new Date().toISOString()),
        source: new Cesium.ConstantProperty('topojson_dissolve')
      };
      
      // Store in continent entities
      this.entities.continent.set(entity.id, entity);
      
      // Add to main entities ref for persistence
      this.registerEntityInRef(entity);
      
      console.log(`✅ Created accurate continent boundary: ${continentName} (dissolved ${validFeatures.length} countries, preserving coastlines)`);
      
    } catch (error) {
      console.error(`❌ Error creating continent boundary for ${continentName}:`, error);
      console.error(`❌ Stack trace:`, error.stack);
    }
  }
  
  // Helper method to extract all coordinates from any GeoJSON geometry type
  extractAllCoordinates(geometry) {
    const coords = [];
    
    if (!geometry || !geometry.type) return coords;
    
    const extractFromArray = (arr, depth) => {
      if (depth === 0) {
        // We've reached a coordinate pair [lon, lat]
        if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number') {
          coords.push([arr[0], arr[1]]);
        }
      } else {
        // Still need to go deeper
        if (Array.isArray(arr)) {
          arr.forEach(item => extractFromArray(item, depth - 1));
        }
      }
    };
    
    switch (geometry.type) {
      case 'Point':
        if (geometry.coordinates && geometry.coordinates.length >= 2) {
          coords.push([geometry.coordinates[0], geometry.coordinates[1]]);
        }
        break;
      case 'LineString':
      case 'MultiPoint':
        extractFromArray(geometry.coordinates, 1);
        break;
      case 'Polygon':
      case 'MultiLineString':
        extractFromArray(geometry.coordinates, 2);
        break;
      case 'MultiPolygon':
        extractFromArray(geometry.coordinates, 3);
        break;
      case 'GeometryCollection':
        if (geometry.geometries) {
          geometry.geometries.forEach(geom => {
            coords.push(...this.extractAllCoordinates(geom));
          });
        }
        break;
    }
    
    return coords;
  }
  
  // Legacy method kept for compatibility
  async createContinentEntity(feature) {
    try {
      const Cesium = window.Cesium;
      const properties = feature.properties || {};
      const continentName = properties.NAME || properties.name || 'Unknown Continent';
      
      console.log(`🌍 Creating continent entity: ${continentName}`);
      
      // Convert GeoJSON to Cesium coordinates
      const coordinates = this.geoJSONToCesiumCoordinates(feature.geometry);
      if (!coordinates) {
        console.warn(`⚠️ Skipping continent ${continentName}: Invalid coordinates`);
        return;
      }
      
      // Create Cesium entity
      const entity = this.viewer.entities.add({
        id: `continent:${continentName}:${Date.now()}`,
        name: continentName,
        polygon: {
          hierarchy: coordinates,
          material: Cesium.Color.LIGHTGRAY.withAlpha(0.15),
          outline: true,
          outlineColor: Cesium.Color.GRAY,
          outlineWidth: 3,
          height: 0,
          extrudedHeight: 0,
          classificationType: Cesium.ClassificationType.TERRAIN
        },
        properties: {
          type: 'continent',
          name: continentName,
          created: new Date().toISOString(),
          source: 'un_m49'
        }
      });
      
      // Store in continent entities
      this.entities.continent.set(entity.id, entity);
      
      // Add to main entities ref for persistence
      this.registerEntityInRef(entity);
      
      console.log(`✅ Created continent entity: ${continentName}`);
      
    } catch (error) {
      console.error(`❌ Error creating continent entity:`, error);
    }
  }

  async createSyntheticNeighborhoods() {
    // Fallback method to create synthetic neighborhoods
    console.log('🏘️ Creating synthetic neighborhoods from city data...');
  }

  // Ensure all entities are properly restored and visible
  ensureEntityPersistence() {
    console.log('🔄 Ensuring entity persistence...');
    
    let totalRestored = 0;
    
    // Check all entity maps and ensure they're in the viewer
    for (const [layerType, entityMap] of Object.entries(this.entities)) {
      if (entityMap.size > 0) {
        console.log(`🔍 Checking ${layerType} entities: ${entityMap.size} found`);
        
        for (const [entityId, entity] of entityMap) {
          // Check if entity is still in the viewer
          const viewerEntity = this.viewer.entities.getById(entityId);
          if (!viewerEntity) {
            console.warn(`⚠️ Entity ${entityId} missing from viewer, re-adding...`);
            try {
              // Ensure no duplicate exists in viewer before adding
              const existingViewer = this.viewer.entities.getById(entityId);
              const existingCollection = this.viewer.entities.values.find(e => e.id === entityId);
              
              if (!existingViewer && !existingCollection) {
                // Ensure entity has unique styling to prevent overlap issues
                if (entity.polygon && layerType === 'continents') {
                  entity.polygon.outline = false; // Prevent outline overlap
                  entity.polygon.extrudedHeight = undefined; // Prevent z-fighting
                  entity.polygon.height = 0; // Keep flat on surface
                }
                this.viewer.entities.add(entity);
                totalRestored++;
              } else {
                console.log(`🔄 Entity ${entityId} already exists in collection, skipping`);
              }
            } catch (error) {
              console.error(`❌ Error re-adding entity ${entityId}:`, error.message);
              // If it's a duplicate error, the entity likely already exists
              if (error.message.includes('already exists')) {
                console.log(`✅ Entity ${entityId} confirmed to exist, continuing`);
              }
            }
          }
          
          // Ensure entity is in entitiesRef
          if (this.entitiesRef && this.entitiesRef.current) {
            if (!this.entitiesRef.current.has(entityId)) {
              this.entitiesRef.current.set(entityId, entity);
              console.log(`📝 Re-registered ${entityId} in entitiesRef`);
            }
          }
        }
      }
    }
    
    if (totalRestored > 0) {
      console.log(`✅ Entity persistence check complete - restored ${totalRestored} missing entities`);
    } else {
      console.log('✅ Entity persistence check complete - all entities present');
    }
  }

  // Save entity state to localStorage for persistence (OPTIMIZED: Debounced)
  saveEntityState() {
    // Debounce saves to max once per 10 seconds (OPTIMIZATION)
    if (this._saveStateTimeout) {
      return; // Save already scheduled
    }
    
    this._saveStateTimeout = setTimeout(() => {
      this._saveStateTimeout = null;
      
      try {
        const entityState = {
          timestamp: Date.now(),
          entities: {},
          viewerEntityCount: this.viewer.entities.values.length
        };
        
        // Save entity IDs and basic info for each layer (only counts for large layers)
        for (const [layerType, entityMap] of Object.entries(this.entities)) {
          if (entityMap.size > 0) {
            // For large layers, just save count (OPTIMIZATION)
            entityState.entities[layerType] = entityMap.size > 50 
              ? { count: entityMap.size } 
              : Array.from(entityMap.keys());
          }
        }
        
        localStorage.setItem('administrativeHierarchyState', JSON.stringify(entityState));
        console.log(`💾 Entity state saved (${entityState.viewerEntityCount} total entities)`);
        
      } catch (error) {
        console.error('❌ Error saving entity state:', error);
      }
    }, 10000); // 10 second delay
  }

  // Restore entity state from localStorage
  restoreEntityState() {
    try {
      const savedState = localStorage.getItem('administrativeHierarchyState');
      if (savedState) {
        const entityState = JSON.parse(savedState);
        console.log('🔄 Restoring entity state from localStorage...');
        
        // Check if state is recent (within 1 hour)
        const age = Date.now() - entityState.timestamp;
        if (age < 3600000) { // 1 hour
          console.log('✅ Entity state is recent, restoring...');
          return entityState;
        } else {
          console.log('⚠️ Entity state is too old, clearing...');
          localStorage.removeItem('administrativeHierarchyState');
        }
      }
    } catch (error) {
      console.error('❌ Error restoring entity state:', error);
    }
    return null;
  }

  // Get statistics about loaded entities
  getEntityStatistics() {
    const stats = {
      total: 0,
      byLayer: {}
    };
    
    for (const [layerType, entityMap] of Object.entries(this.entities)) {
      stats.byLayer[layerType] = entityMap.size;
      stats.total += entityMap.size;
    }
    
    return stats;
  }

  // Check if entities are being cleared by other systems (OPTIMIZED: Throttled)
  checkEntityIntegrity() {
    // Throttle integrity checks to max once per 5 seconds (OPTIMIZATION)
    const now = Date.now();
    if (this._lastIntegrityCheck && (now - this._lastIntegrityCheck) < 5000) {
      return; // Skip check - too soon since last check
    }
    this._lastIntegrityCheck = now;
    
    console.log('🔍 Checking entity integrity...');
    
    let totalMissing = 0;
    let totalEntities = 0;
    
    for (const [layerType, entityMap] of Object.entries(this.entities)) {
      if (entityMap.size > 0) {
        totalEntities += entityMap.size;
        let missingCount = 0;
        
        // Sample check instead of full scan for large layers (OPTIMIZATION)
        const shouldSample = entityMap.size > 100;
        const entitiesToCheck = shouldSample 
          ? Array.from(entityMap.entries()).filter((_, i) => i % 10 === 0) // Check every 10th
          : Array.from(entityMap.entries());
        
        for (const [entityId, entity] of entitiesToCheck) {
          const viewerEntity = this.viewer.entities.getById(entityId);
          if (!viewerEntity) {
            missingCount++;
          }
        }
        
        if (shouldSample && missingCount > 0) {
          // Extrapolate from sample
          missingCount = Math.round(missingCount * 10);
        }
        
        totalMissing += missingCount;
        
        if (missingCount > 0) {
          console.warn(`⚠️ ${layerType} layer: ~${missingCount}/${entityMap.size} entities missing from viewer`);
        } else if (!shouldSample) {
          console.log(`✅ ${layerType} layer: All ${entityMap.size} entities present`);
        }
      }
    }
    
    if (totalMissing === 0 && totalEntities > 0) {
      console.log(`✅ All ${totalEntities} entities verified`);
    }
  }

  // Prevent entities from being cleared by other systems
  protectEntities() {
    console.log('🛡️ Protecting administrative entities from being cleared...');
    
    // Override the viewer's entities.remove method to protect our entities
    const originalRemove = this.viewer.entities.remove;
    this.viewer.entities.remove = (entity) => {
      // Check if this is one of our administrative entities
      if (entity && entity.id) {
        const isOurEntity = Object.values(this.entities).some(entityMap => 
          entityMap.has(entity.id)
        );
        
        if (isOurEntity) {
          console.warn(`🛡️ Blocked removal of protected entity: ${entity.id}`);
          return false; // Block the removal
        }
      }
      
      // Allow removal of non-administrative entities
      return originalRemove.call(this.viewer.entities, entity);
    };
    
    // Store flag for force clearing (when user explicitly clears data)
    this._forceClearCandidates = false;
    
    // Override entities.removeAll to selectively protect our entities
    const originalRemoveAll = this.viewer.entities.removeAll;
    this.viewer.entities.removeAll = () => {
      // Check if this is a force clear (user explicitly clearing data)
      if (this._forceClearCandidates) {
        console.log('🛡️ FORCE CLEAR - Removing all entities including candidates...');
        const allEntities = [...this.viewer.entities.values];
        let removedCount = 0;
        let protectedCount = 0;
        
        // Remove everything except administrative boundaries
        for (const entity of allEntities) {
          if (entity && entity.id) {
            const isAdministrativeEntity = Object.values(this.entities).some(entityMap => 
              entityMap.has(entity.id)
            );
            
            if (isAdministrativeEntity) {
              protectedCount++;
              // Keep only administrative boundaries
            } else {
              // Remove candidates, channels, and everything else
              originalRemove.call(this.viewer.entities, entity);
              removedCount++;
            }
          }
        }
        
        console.log(`🛡️ Force clear complete: ${removedCount} removed, ${protectedCount} administrative entities protected`);
        this._forceClearCandidates = false; // Reset flag
        return removedCount;
      }
      
      console.log('🛡️ Selective entity removal - protecting administrative entities and candidates...');
      
      // Get all entities
      const allEntities = [...this.viewer.entities.values];
      let removedCount = 0;
      let protectedCount = 0;
      
      // Remove only non-administrative and non-candidate entities
      for (const entity of allEntities) {
        if (entity && entity.id) {
          const isAdministrativeEntity = Object.values(this.entities).some(entityMap => 
            entityMap.has(entity.id)
          );
          
          // Also protect candidate entities (towers and caps) during normal clearing
          const isCandidateEntity = entity.id && (
            entity.id.includes('individual-candidate-') ||
            entity.id.includes('cap-') ||
            entity.id.includes('cluster-') ||
            entity.id.includes('channel-')
          );
          
          if (isAdministrativeEntity || isCandidateEntity) {
            protectedCount++;
            // Keep administrative and candidate entities
          } else {
            // Remove only non-protected entities
            originalRemove.call(this.viewer.entities, entity);
            removedCount++;
          }
        }
      }
      
      console.log(`🛡️ Selective removal complete: ${removedCount} removed, ${protectedCount} protected`);
      return removedCount;
    };
    
    console.log('✅ Entity protection enabled');
  }

  // Register entity in entitiesRef (optimized, no retry loops)
  registerEntityInRef(entity) {
    if (this.entitiesRef && this.entitiesRef.current) {
      this.entitiesRef.current.set(entity.id, entity);
      return true;
    }
    // Silently skip registration if entitiesRef not available - no console spam
    return false;
  }

  // Visual hover styling methods (optimized)
  highlightProvince(entity) {
    if (this.lastHoveredProvince && this.lastHoveredProvince !== entity) {
      this.resetProvinceStyle(this.lastHoveredProvince);
    }
    
    // Only update if not already highlighted
    if (this.lastHoveredProvince !== entity) {
      entity.polygon.outlineColor = window.Cesium.Color.YELLOW;
      entity.polygon.outlineWidth = 3;
      entity.polygon.material = window.Cesium.Color.fromAlpha(window.Cesium.Color.LIGHTGREEN, 0.7);
      
      // Show hover information with province name and country
      const provinceName = entity.name || 'Unknown Province';
      const countryName = entity.properties?.country?.getValue() || 'Unknown Country';
      this.showHoverInfo(provinceName, countryName, 'Province');
      
      this.lastHoveredProvince = entity;
    }
  }

  resetProvinceStyle(entity) {
    if (entity && entity.polygon) {
      entity.polygon.outlineColor = window.Cesium.Color.LIGHTGREEN;
      entity.polygon.outlineWidth = 2;
      entity.polygon.material = window.Cesium.Color.LIGHTGREEN.withAlpha(0.3);
    }
  }

  highlightCountry(entity) {
    if (this.lastHoveredCountry && this.lastHoveredCountry !== entity) {
      this.resetCountryStyle(this.lastHoveredCountry);
    }
    
    if (this.lastHoveredCountry !== entity) {
      entity.polygon.outlineColor = Cesium.Color.CYAN;
      entity.polygon.outlineWidth = 3;
      entity.polygon.material = Cesium.Color.fromAlpha(Cesium.Color.LIGHTBLUE, 0.7);
      
      this.lastHoveredCountry = entity;
    }
  }

  resetCountryStyle(entity) {
    if (entity && entity.polygon) {
      entity.polygon.outlineColor = Cesium.Color.BLUE;
      entity.polygon.outlineWidth = 2;
      entity.polygon.material = Cesium.Color.LIGHTBLUE.withAlpha(0.3);
    }
  }

  highlightMacroRegion(entity) {
    if (this.lastHoveredMacroRegion && this.lastHoveredMacroRegion !== entity) {
      this.resetMacroRegionStyle(this.lastHoveredMacroRegion);
    }
    
    if (this.lastHoveredMacroRegion !== entity) {
      // Apply highlight styling
      entity.polygon.outlineColor = Cesium.Color.CYAN;
      entity.polygon.outlineWidth = 4;
      entity.polygon.material = entity.polygon.material.getValue().withAlpha(0.8);
      
      // Extract region info for hover panel
      const properties = entity.properties.getValue();
      const regionName = properties.name || entity.name;
      const countryCount = properties.countries || 0;
      
      // Show hover information with region name and metadata
      this.showHoverInfo(regionName, `${countryCount} countries`, 'Region');
      
      this.lastHoveredMacroRegion = entity;
    }
  }

  resetMacroRegionStyle(entity) {
    if (entity && entity.polygon) {
      entity.polygon.outlineColor = Cesium.Color.NAVY.withAlpha(0.8);
      entity.polygon.outlineWidth = 2;
      // Restore original material
      const properties = entity.properties.getValue();
      const regionName = properties.name || entity.name;
      entity.polygon.material = this.getConsistentRegionMaterial(regionName);
    }
  }

  highlightContinent(entity) {
    if (this.lastHoveredContinent && this.lastHoveredContinent !== entity) {
      this.resetContinentStyle(this.lastHoveredContinent);
    }
    
    if (this.lastHoveredContinent !== entity) {
      entity.polygon.outlineColor = Cesium.Color.MAGENTA;
      entity.polygon.outlineWidth = 3;
      entity.polygon.material = Cesium.Color.fromAlpha(Cesium.Color.PINK, 0.7);
      
      this.lastHoveredContinent = entity;
    }
  }

  resetContinentStyle(entity) {
    if (entity && entity.polygon) {
      entity.polygon.outlineColor = Cesium.Color.PURPLE;
      entity.polygon.outlineWidth = 2;
      entity.polygon.material = Cesium.Color.PINK.withAlpha(0.3);
    }
  }

  // Set up hover functionality for all entity types
  setupHoverFunctionality() {
    console.log('🎯 Setting up hover functionality for administrative entities...');
    
    // Initialize hover state tracking
    this.lastHoveredProvince = null;
    this.lastHoveredCountry = null;
    this.lastHoveredContinent = null;
    this.lastHoveredMacroRegion = null;
    
    // Initialize loading flags to prevent double loading
    this.loadingProvinces = false;
    this.loadingCountries = false;
    this.loadingContinents = false;
    
    // Debug flag for logging control - set to true only for debugging
    this.DEBUG = false; // DISABLED for production performance
    
    // Set up hover handlers for provinces
    this.setupProvinceHover();
    
    // Set up hover handlers for countries
    this.setupCountryHover();
    
    // Set up hover handlers for continents
    this.setupContinentHover();
  }

  // Set up hover functionality for provinces
  setupProvinceHover() {
    if (this.DEBUG) console.log('🏛️ Setting up province hover functionality...');
    
    // Add mouse move handler for hover effects
    let lastHoveredEntity = null;
    
    this.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction((event) => {
      // Use proper mouse position handling
      const mousePosition = event.endPosition || event.position;
      if (!mousePosition) {
        return;
      }
      
      const pickedObject = this.viewer.scene.pick(mousePosition);
      
      if (pickedObject && pickedObject.id) {
        const entity = pickedObject.id;
        
        // Skip if same entity is already hovered
        if (lastHoveredEntity === entity) {
          return;
        }
        
        lastHoveredEntity = entity;
        
        // Check entity type and handle accordingly
        if (entity.id && entity.id.startsWith('province:')) {
          this.highlightProvince(entity);
        } else if (entity.id && entity.id.startsWith('country:')) {
          this.highlightCountry(entity);
        } else if (entity.id && entity.id.startsWith('macro-region-')) {
          this.highlightMacroRegion(entity);
        } else if (entity.id && entity.id.startsWith('continent:')) {
          this.highlightContinent(entity);
        } else {
          this.clearHoverEffect();
          lastHoveredEntity = null;
        }
      } else {
        this.clearHoverEffect();
        lastHoveredEntity = null;
      }
    }, window.Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  // Set up hover functionality for countries
  setupCountryHover() {
    console.log('🗺️ Setting up country hover functionality...');
    
    // Country hover is handled by the same mouse move handler
    // The handleCountryHover method will be called from the mouse move handler
  }

  // Set up hover functionality for continents
  setupContinentHover() {
    console.log('🌍 Setting up continent hover functionality...');
    
    // Continent hover is handled by the same mouse move handler
    // The handleContinentHover method will be called from the mouse move handler
  }

  // Old hover handler methods removed - using optimized visual styling methods instead

  // Clear hover effects
  clearHoverEffect() {
    // Hide hover information panel
    this.hideHoverInfo();
    
    // Reset all hovered entities
    if (this.lastHoveredProvince) {
      this.resetProvinceStyle(this.lastHoveredProvince);
      this.lastHoveredProvince = null;
    }
    
    if (this.lastHoveredCountry) {
      this.resetCountryStyle(this.lastHoveredCountry);
      this.lastHoveredCountry = null;
    }
    
    if (this.lastHoveredContinent) {
      this.resetContinentStyle(this.lastHoveredContinent);
      this.lastHoveredContinent = null;
    }
    
    if (this.lastHoveredMacroRegion) {
      this.resetMacroRegionStyle(this.lastHoveredMacroRegion);
      this.lastHoveredMacroRegion = null;
    }
    
    // Legacy support for old hoveredEntity system
    if (this.hoveredEntity) {
      try {
        const Cesium = window.Cesium;
        
        // Restore original material based on entity type
        if (this.hoveredEntity.id && this.hoveredEntity.id.startsWith('province:')) {
          this.hoveredEntity.polygon.material = Cesium.Color.LIGHTGREEN.withAlpha(0.3);
          this.hoveredEntity.polygon.outlineColor = Cesium.Color.GREEN;
        } else if (this.hoveredEntity.id && this.hoveredEntity.id.startsWith('country:')) {
          this.hoveredEntity.polygon.material = Cesium.Color.LIGHTBLUE.withAlpha(0.2);
          this.hoveredEntity.polygon.outlineColor = Cesium.Color.BLUE;
        } else if (this.hoveredEntity.id && this.hoveredEntity.id.startsWith('continent:')) {
          this.hoveredEntity.polygon.material = Cesium.Color.LIGHTGRAY.withAlpha(0.15);
          this.hoveredEntity.polygon.outlineColor = Cesium.Color.GRAY;
        }
        
        // Restore default outline width
        this.hoveredEntity.polygon.outlineWidth = 2;
        
        // Clear references
        this.hoveredEntity = null;
        this.originalMaterial = null;
        
        // Hide hover info
        this.hideHoverInfo();
        
      } catch (error) {
        console.error('❌ Error clearing hover effect:', error);
      }
    }
  }

  // Get default outline color for entity type
  getDefaultOutlineColor(entity) {
    const Cesium = window.Cesium;
    
    if (entity.id && entity.id.startsWith('province:')) {
      return Cesium.Color.GREEN;
    } else if (entity.id && entity.id.startsWith('country:')) {
      return Cesium.Color.BLUE;
    } else if (entity.id && entity.id.startsWith('continent:')) {
      return Cesium.Color.GRAY;
    }
    
    return Cesium.Color.WHITE;
  }

  // Show hover information panel
  showHoverInfo(name, country, type) {
    // Create or update hover info panel
    if (!this.hoverInfoPanel) {
      this.hoverInfoPanel = document.createElement('div');
      this.hoverInfoPanel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 1000;
        max-width: 200px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
      `;
      document.body.appendChild(this.hoverInfoPanel);
    }
    
    // Update content
    let content = `<strong>${type}</strong><br>${name}`;
    if (country) {
      content += `<br><small>${country}</small>`;
    }
    
    this.hoverInfoPanel.innerHTML = content;
    this.hoverInfoPanel.style.display = 'block';
  }

  // Hide hover information panel
  hideHoverInfo() {
    if (this.hoverInfoPanel) {
      this.hoverInfoPanel.style.display = 'none';
    }
  }

  // Get list of countries that have ADM2 (county/district) data available globally
  async getCountriesWithADM2Data(filterCodes = null) {
    try {
      // Comprehensive list of ISO3 country codes with ADM2 coverage from GeoBoundaries
      // This covers 180+ countries with district/county-level administrative boundaries
      const countriesWithADM2 = [
        // North America (3)
        { code: 'USA', name: 'United States' },
        { code: 'CAN', name: 'Canada' },
        { code: 'MEX', name: 'Mexico' },
        
        // Central America & Caribbean (11) - Removed TTO, BRB (no ADM2 data)
        { code: 'BLZ', name: 'Belize' },
        { code: 'CRI', name: 'Costa Rica' },
        { code: 'SLV', name: 'El Salvador' },
        { code: 'GTM', name: 'Guatemala' },
        { code: 'HND', name: 'Honduras' },
        { code: 'NIC', name: 'Nicaragua' },
        { code: 'PAN', name: 'Panama' },
        { code: 'CUB', name: 'Cuba' },
        { code: 'HTI', name: 'Haiti' },
        { code: 'DOM', name: 'Dominican Republic' },
        { code: 'JAM', name: 'Jamaica' },
        
        // South America (12) - Removed GUF (no ADM2 data)
        { code: 'BRA', name: 'Brazil' },
        { code: 'ARG', name: 'Argentina' },
        { code: 'CHL', name: 'Chile' },
        { code: 'COL', name: 'Colombia' },
        { code: 'PER', name: 'Peru' },
        { code: 'VEN', name: 'Venezuela' },
        { code: 'ECU', name: 'Ecuador' },
        { code: 'BOL', name: 'Bolivia' },
        { code: 'PRY', name: 'Paraguay' },
        { code: 'URY', name: 'Uruguay' },
        { code: 'GUY', name: 'Guyana' },
        { code: 'SUR', name: 'Suriname' },
        
        // Europe - Western (10)
        { code: 'GBR', name: 'United Kingdom' },
        { code: 'FRA', name: 'France' },
        { code: 'DEU', name: 'Germany' },
        { code: 'ITA', name: 'Italy' },
        { code: 'ESP', name: 'Spain' },
        { code: 'PRT', name: 'Portugal' },
        { code: 'NLD', name: 'Netherlands' },
        { code: 'BEL', name: 'Belgium' },
        { code: 'AUT', name: 'Austria' },
        { code: 'CHE', name: 'Switzerland' },
        
        // Europe - Northern (8)
        { code: 'NOR', name: 'Norway' },
        { code: 'SWE', name: 'Sweden' },
        { code: 'FIN', name: 'Finland' },
        { code: 'DNK', name: 'Denmark' },
        { code: 'ISL', name: 'Iceland' },
        { code: 'IRL', name: 'Ireland' },
        { code: 'EST', name: 'Estonia' },
        { code: 'LVA', name: 'Latvia' },
        
        // Europe - Eastern (10) - Removed MDA (no ADM2 data)
        { code: 'POL', name: 'Poland' },
        { code: 'CZE', name: 'Czech Republic' },
        { code: 'SVK', name: 'Slovakia' },
        { code: 'HUN', name: 'Hungary' },
        { code: 'ROU', name: 'Romania' },
        { code: 'BGR', name: 'Bulgaria' },
        { code: 'UKR', name: 'Ukraine' },
        { code: 'BLR', name: 'Belarus' },
        { code: 'LTU', name: 'Lithuania' },
        { code: 'RUS', name: 'Russia' },
        
        // Europe - Southern & Balkans (9) - Removed MNE, MLT (no ADM2 data)
        { code: 'GRC', name: 'Greece' },
        { code: 'HRV', name: 'Croatia' },
        { code: 'SRB', name: 'Serbia' },
        { code: 'SVN', name: 'Slovenia' },
        { code: 'BIH', name: 'Bosnia and Herzegovina' },
        { code: 'MKD', name: 'North Macedonia' },
        { code: 'ALB', name: 'Albania' },
        { code: 'XKX', name: 'Kosovo' },
        { code: 'CYP', name: 'Cyprus' },
        
        // Asia - East (6)
        { code: 'CHN', name: 'China' },
        { code: 'JPN', name: 'Japan' },
        { code: 'KOR', name: 'South Korea' },
        { code: 'PRK', name: 'North Korea' },
        { code: 'MNG', name: 'Mongolia' },
        { code: 'TWN', name: 'Taiwan' },
        
        // Asia - Southeast (8) - Removed PHL, THA, LAO (no ADM2 data)
        { code: 'IDN', name: 'Indonesia' },
        { code: 'VNM', name: 'Vietnam' },
        { code: 'MMR', name: 'Myanmar' },
        { code: 'MYS', name: 'Malaysia' },
        { code: 'KHM', name: 'Cambodia' },
        { code: 'SGP', name: 'Singapore' },
        { code: 'BRN', name: 'Brunei' },
        { code: 'TLS', name: 'Timor-Leste' },
        
        // Asia - South (8)
        { code: 'IND', name: 'India' },
        { code: 'PAK', name: 'Pakistan' },
        { code: 'BGD', name: 'Bangladesh' },
        { code: 'NPL', name: 'Nepal' },
        { code: 'LKA', name: 'Sri Lanka' },
        { code: 'AFG', name: 'Afghanistan' },
        { code: 'BTN', name: 'Bhutan' },
        { code: 'MDV', name: 'Maldives' },
        
        // Asia - Central (4) - Removed KGZ (no ADM2 data)
        { code: 'KAZ', name: 'Kazakhstan' },
        { code: 'UZB', name: 'Uzbekistan' },
        { code: 'TKM', name: 'Turkmenistan' },
        { code: 'TJK', name: 'Tajikistan' },
        
        // Asia - West (Middle East) (13) - Removed IRQ, ARE, BHR, PSE, OMN (no ADM2 data)
        { code: 'TUR', name: 'Turkey' },
        { code: 'IRN', name: 'Iran' },
        { code: 'SAU', name: 'Saudi Arabia' },
        { code: 'YEM', name: 'Yemen' },
        { code: 'SYR', name: 'Syria' },
        { code: 'JOR', name: 'Jordan' },
        { code: 'ISR', name: 'Israel' },
        { code: 'LBN', name: 'Lebanon' },
        { code: 'KWT', name: 'Kuwait' },
        { code: 'QAT', name: 'Qatar' },
        { code: 'GEO', name: 'Georgia' },
        { code: 'ARM', name: 'Armenia' },
        { code: 'AZE', name: 'Azerbaijan' },
        
        // Africa - North (5) - Removed LBY (no ADM2 data)
        { code: 'EGY', name: 'Egypt' },
        { code: 'DZA', name: 'Algeria' },
        { code: 'MAR', name: 'Morocco' },
        { code: 'TUN', name: 'Tunisia' },
        { code: 'SDN', name: 'Sudan' },
        
        // Africa - West (15) - Removed GMB (no ADM2 data)
        { code: 'NGA', name: 'Nigeria' },
        { code: 'GHA', name: 'Ghana' },
        { code: 'CIV', name: 'Ivory Coast' },
        { code: 'SEN', name: 'Senegal' },
        { code: 'BFA', name: 'Burkina Faso' },
        { code: 'MLI', name: 'Mali' },
        { code: 'NER', name: 'Niger' },
        { code: 'GIN', name: 'Guinea' },
        { code: 'BEN', name: 'Benin' },
        { code: 'TGO', name: 'Togo' },
        { code: 'SLE', name: 'Sierra Leone' },
        { code: 'LBR', name: 'Liberia' },
        { code: 'MRT', name: 'Mauritania' },
        { code: 'GNB', name: 'Guinea-Bissau' },
        { code: 'CPV', name: 'Cape Verde' },
        
        // Africa - East (12)
        { code: 'ETH', name: 'Ethiopia' },
        { code: 'KEN', name: 'Kenya' },
        { code: 'TZA', name: 'Tanzania' },
        { code: 'UGA', name: 'Uganda' },
        { code: 'SOM', name: 'Somalia' },
        { code: 'ERI', name: 'Eritrea' },
        { code: 'SSD', name: 'South Sudan' },
        { code: 'RWA', name: 'Rwanda' },
        { code: 'BDI', name: 'Burundi' },
        { code: 'DJI', name: 'Djibouti' },
        { code: 'COM', name: 'Comoros' },
        { code: 'SYC', name: 'Seychelles' },
        
        // Africa - Central (8)
        { code: 'COD', name: 'DR Congo' },
        { code: 'AGO', name: 'Angola' },
        { code: 'CMR', name: 'Cameroon' },
        { code: 'TCD', name: 'Chad' },
        { code: 'CAF', name: 'Central African Republic' },
        { code: 'COG', name: 'Congo' },
        { code: 'GAB', name: 'Gabon' },
        { code: 'GNQ', name: 'Equatorial Guinea' },
        
        // Africa - Southern (10) - Removed MUS (no ADM2 data)
        { code: 'ZAF', name: 'South Africa' },
        { code: 'MOZ', name: 'Mozambique' },
        { code: 'MDG', name: 'Madagascar' },
        { code: 'ZMB', name: 'Zambia' },
        { code: 'ZWE', name: 'Zimbabwe' },
        { code: 'MWI', name: 'Malawi' },
        { code: 'BWA', name: 'Botswana' },
        { code: 'NAM', name: 'Namibia' },
        { code: 'LSO', name: 'Lesotho' },
        { code: 'SWZ', name: 'Eswatini' },
        
        // Oceania (11) - Removed NCL, FSM, MHL (no ADM2 data)
        { code: 'AUS', name: 'Australia' },
        { code: 'NZL', name: 'New Zealand' },
        { code: 'PNG', name: 'Papua New Guinea' },
        { code: 'FJI', name: 'Fiji' },
        { code: 'SLB', name: 'Solomon Islands' },
        { code: 'VUT', name: 'Vanuatu' },
        { code: 'WSM', name: 'Samoa' },
        { code: 'KIR', name: 'Kiribati' },
        { code: 'TON', name: 'Tonga' },
        { code: 'PLW', name: 'Palau' },
        { code: 'TUV', name: 'Tuvalu' }
      ];
      
      console.log(`📋 Total countries with ADM2 data: ${countriesWithADM2.length}`);
      
      // Filter by specific country codes if provided
      if (filterCodes && Array.isArray(filterCodes)) {
        const filtered = countriesWithADM2.filter(c => filterCodes.includes(c.code));
        console.log(`🔍 Filtered to ${filtered.length} specified countries`);
        return filtered;
      }
      
      return countriesWithADM2;
      
    } catch (error) {
      console.error('❌ Error getting countries with ADM2 data:', error);
      // Fallback to essential countries
      return [
        { code: 'USA', name: 'United States' },
        { code: 'GBR', name: 'United Kingdom' },
        { code: 'DEU', name: 'Germany' },
        { code: 'FRA', name: 'France' },
        { code: 'CHN', name: 'China' },
        { code: 'IND', name: 'India' },
        { code: 'BRA', name: 'Brazil' }
      ];
    }
  }
  
  // Get countries visible in current camera viewport
  getVisibleCountriesInViewport() {
    try {
      if (!this.viewer || !this.viewer.camera) {
        return [];
      }
      
      const camera = this.viewer.camera;
      const canvas = this.viewer.canvas;
      
      // Get camera rectangle (bounding box of visible area)
      const rectangle = camera.computeViewRectangle();
      if (!rectangle) {
        console.warn('⚠️ Could not compute camera view rectangle');
        return [];
      }
      
      // Convert rectangle to degrees
      const west = window.Cesium.Math.toDegrees(rectangle.west);
      const south = window.Cesium.Math.toDegrees(rectangle.south);
      const east = window.Cesium.Math.toDegrees(rectangle.east);
      const north = window.Cesium.Math.toDegrees(rectangle.north);
      
      console.log(`📐 Viewport bounds: [${west.toFixed(1)}, ${south.toFixed(1)}] to [${east.toFixed(1)}, ${north.toFixed(1)}]`);
      
      // Country centroids (approximate) - for quick viewport testing
      const countryBounds = {
        // North America
        'USA': { lat: 37.0, lon: -95.0 },
        'CAN': { lat: 56.0, lon: -106.0 },
        'MEX': { lat: 23.0, lon: -102.0 },
        
        // Central America
        'GTM': { lat: 15.5, lon: -90.0 },
        'BLZ': { lat: 17.2, lon: -88.7 },
        'SLV': { lat: 13.8, lon: -88.9 },
        'HND': { lat: 15.2, lon: -86.2 },
        'NIC': { lat: 12.9, lon: -85.2 },
        'CRI': { lat: 9.7, lon: -84.0 },
        'PAN': { lat: 8.5, lon: -80.0 },
        
        // Caribbean
        'CUB': { lat: 21.5, lon: -77.8 },
        'JAM': { lat: 18.1, lon: -77.3 },
        'HTI': { lat: 18.9, lon: -72.3 },
        'DOM': { lat: 18.7, lon: -70.2 },
        
        // South America
        'BRA': { lat: -10.0, lon: -55.0 },
        'ARG': { lat: -34.0, lon: -64.0 },
        'CHL': { lat: -30.0, lon: -71.0 },
        'COL': { lat: 4.5, lon: -74.0 },
        'PER': { lat: -9.2, lon: -75.0 },
        'VEN': { lat: 6.4, lon: -66.6 },
        'ECU': { lat: -1.8, lon: -78.2 },
        'BOL': { lat: -16.3, lon: -63.6 },
        'PRY': { lat: -23.4, lon: -58.4 },
        'URY': { lat: -32.5, lon: -55.8 },
        'GUY': { lat: 4.9, lon: -58.9 },
        'SUR': { lat: 4.0, lon: -56.0 },
        
        // Europe
        'GBR': { lat: 55.4, lon: -3.4 },
        'FRA': { lat: 46.2, lon: 2.2 },
        'DEU': { lat: 51.2, lon: 10.5 },
        'ESP': { lat: 40.5, lon: -3.7 },
        'ITA': { lat: 41.9, lon: 12.6 },
        'POL': { lat: 51.9, lon: 19.1 },
        'UKR': { lat: 48.4, lon: 31.2 },
        'RUS': { lat: 61.5, lon: 105.3 },
        'NOR': { lat: 60.5, lon: 8.5 },
        'SWE': { lat: 60.1, lon: 18.6 },
        'FIN': { lat: 61.9, lon: 25.7 },
        'DNK': { lat: 56.3, lon: 9.5 },
        'NLD': { lat: 52.1, lon: 5.3 },
        'BEL': { lat: 50.5, lon: 4.5 },
        'CHE': { lat: 46.8, lon: 8.2 },
        'AUT': { lat: 47.5, lon: 14.6 },
        'PRT': { lat: 39.4, lon: -8.2 },
        'GRC': { lat: 39.1, lon: 21.8 },
        'CZE': { lat: 49.8, lon: 15.5 },
        'HUN': { lat: 47.2, lon: 19.5 },
        'BGR': { lat: 42.7, lon: 25.5 },
        'BLR': { lat: 53.7, lon: 27.9 },
        'SRB': { lat: 44.0, lon: 21.0 },
        'HRV': { lat: 45.1, lon: 15.2 },
        'SVK': { lat: 48.7, lon: 19.7 },
        'SVN': { lat: 46.2, lon: 14.9 },
        'LTU': { lat: 55.2, lon: 23.9 },
        'LVA': { lat: 56.9, lon: 24.6 },
        'EST': { lat: 58.6, lon: 25.0 },
        'BIH': { lat: 43.9, lon: 17.7 },
        'MKD': { lat: 41.6, lon: 21.7 },
        'ALB': { lat: 41.2, lon: 20.2 },
        'IRL': { lat: 53.4, lon: -8.2 },
        'ISL': { lat: 64.9, lon: -19.0 },
        
        // Asia
        'CHN': { lat: 35.9, lon: 104.2 },
        'JPN': { lat: 36.2, lon: 138.3 },
        'IND': { lat: 20.6, lon: 78.9 },
        'KOR': { lat: 35.9, lon: 127.8 },
        'VNM': { lat: 14.1, lon: 108.3 },
        'THA': { lat: 15.9, lon: 100.9 },
        'PAK': { lat: 30.4, lon: 69.3 },
        'IRN': { lat: 32.4, lon: 53.7 },
        'TUR': { lat: 38.9, lon: 35.2 },
        'SAU': { lat: 23.9, lon: 45.1 },
        'KAZ': { lat: 48.0, lon: 66.9 },
        'MNG': { lat: 46.9, lon: 103.8 },
        'AFG': { lat: 33.9, lon: 67.7 },
        'MYS': { lat: 4.2, lon: 101.9 },
        'NPL': { lat: 28.4, lon: 84.1 },
        'BGD': { lat: 23.7, lon: 90.4 },
        'IRQ': { lat: 33.2, lon: 43.7 },
        'SYR': { lat: 34.8, lon: 38.9 },
        'JOR': { lat: 30.6, lon: 36.2 },
        'ISR': { lat: 31.0, lon: 34.9 },
        'LBN': { lat: 33.9, lon: 35.9 },
        'YEM': { lat: 15.6, lon: 48.5 },
        'UZB': { lat: 41.4, lon: 64.6 },
        'TKM': { lat: 38.9, lon: 59.6 },
        'TJK': { lat: 38.9, lon: 71.3 },
        'ARM': { lat: 40.1, lon: 45.0 },
        'AZE': { lat: 40.1, lon: 47.6 },
        'GEO': { lat: 42.3, lon: 43.4 },
        'KWT': { lat: 29.3, lon: 47.5 },
        'QAT': { lat: 25.4, lon: 51.2 },
        'PRK': { lat: 40.3, lon: 127.5 },
        'MMR': { lat: 22.0, lon: 96.0 },
        'KHM': { lat: 12.6, lon: 104.9 },
        'LKA': { lat: 7.9, lon: 80.8 },
        'BTN': { lat: 27.5, lon: 90.4 },
        'MDV': { lat: 3.2, lon: 73.2 },
        'SGP': { lat: 1.4, lon: 103.8 },
        'BRN': { lat: 4.5, lon: 114.7 },
        'TLS': { lat: -8.9, lon: 125.7 },
        'TWN': { lat: 23.7, lon: 121.0 },
        
        // Africa
        'ZAF': { lat: -30.6, lon: 22.9 },
        'EGY': { lat: 26.8, lon: 30.8 },
        'NGA': { lat: 9.1, lon: 8.7 },
        'ETH': { lat: 9.1, lon: 40.5 },
        'KEN': { lat: -0.0, lon: 37.9 },
        'TZA': { lat: -6.4, lon: 34.9 },
        'DZA': { lat: 28.0, lon: 1.7 },
        'SDN': { lat: 12.9, lon: 30.2 },
        'MAR': { lat: 31.8, lon: -7.1 },
        'TUN': { lat: 33.9, lon: 9.5 },
        'LBY': { lat: 26.3, lon: 17.2 },
        'UGA': { lat: 1.4, lon: 32.3 },
        'GHA': { lat: 7.9, lon: -1.0 },
        'CMR': { lat: 7.4, lon: 12.4 },
        'CIV': { lat: 7.5, lon: -5.5 },
        'SEN': { lat: 14.5, lon: -14.5 },
        'MLI': { lat: 17.6, lon: -4.0 },
        'BFA': { lat: 12.2, lon: -1.6 },
        'NER': { lat: 17.6, lon: 8.1 },
        'TCD': { lat: 15.5, lon: 19.0 },
        'SOM': { lat: 5.2, lon: 46.2 },
        'RWA': { lat: -1.9, lon: 29.9 },
        'BDI': { lat: -3.4, lon: 29.9 },
        'ZMB': { lat: -13.1, lon: 27.8 },
        'ZWE': { lat: -19.0, lon: 29.2 },
        'MWI': { lat: -13.3, lon: 34.3 },
        'BEN': { lat: 9.3, lon: 2.3 },
        'TGO': { lat: 8.6, lon: 0.8 },
        'SLE': { lat: 8.5, lon: -11.8 },
        'LBR': { lat: 6.4, lon: -9.4 },
        'MRT': { lat: 21.0, lon: -10.9 },
        'GIN': { lat: 9.9, lon: -9.7 },
        'GNB': { lat: 11.8, lon: -15.2 },
        'GAB': { lat: -0.8, lon: 11.6 },
        'COG': { lat: -0.2, lon: 15.8 },
        'CAF': { lat: 6.6, lon: 20.9 },
        'GNQ': { lat: 1.7, lon: 10.3 },
        'DJI': { lat: 11.8, lon: 42.6 },
        'ERI': { lat: 15.2, lon: 39.8 },
        'CPV': { lat: 16.0, lon: -24.0 },
        'COM': { lat: -11.6, lon: 43.3 },
        'SSD': { lat: 7.9, lon: 30.0 },
        'NAM': { lat: -22.6, lon: 18.5 },
        'BWA': { lat: -22.3, lon: 24.7 },
        'LSO': { lat: -29.6, lon: 28.2 },
        'SWZ': { lat: -26.5, lon: 31.5 },
        'MUS': { lat: -20.3, lon: 57.6 },
        
        // Oceania
        'AUS': { lat: -25.3, lon: 133.8 },
        'NZL': { lat: -40.9, lon: 174.9 },
        'PNG': { lat: -6.3, lon: 143.9 },
        'FJI': { lat: -17.7, lon: 178.1 },
        'VUT': { lat: -15.4, lon: 166.9 },
        'TON': { lat: -21.2, lon: -175.2 },
        'SLB': { lat: -9.6, lon: 160.2 },
        'WSM': { lat: -13.8, lon: -172.1 },
        'KIR': { lat: 1.9, lon: -157.4 },
        'FSM': { lat: 7.4, lon: 150.6 },
        'PLW': { lat: 7.5, lon: 134.6 },
        'MHL': { lat: 7.1, lon: 171.2 },
        'NRU': { lat: -0.5, lon: 166.9 }
      };
      
      // Find countries whose centroids are within viewport
      const visibleCountries = [];
      for (const [code, coords] of Object.entries(countryBounds)) {
        // Check if country centroid is within viewport bounds
        if (coords.lon >= west && coords.lon <= east &&
            coords.lat >= south && coords.lat <= north) {
          visibleCountries.push(code);
        }
      }
      
      console.log(`👁️ Visible countries in viewport: ${visibleCountries.join(', ')}`);
      return visibleCountries;
      
    } catch (error) {
      console.error('❌ Error detecting visible countries:', error);
      return [];
    }
  }
}
