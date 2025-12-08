/**
 * CountyBoundaryManager - SYSTEM2
 * Clean, simple county boundary rendering using Cesium GeoJsonDataSource
 * 
 * Key differences from SYSTEM1:
 * - Uses GeoJsonDataSource (isolated from other entities)
 * - No manual entity creation
 * - Built-in visibility management
 * - No race conditions with vote towers
 * - Cesium handles rendering optimization
 * 
 * SINGLETON PATTERN: Only ONE instance per viewer (prevents random loading)
 * - Multiple React component instances share the same manager
 * - Prevents duplicate DataSources and entity conflicts
 * - No "random loading" behavior from multiple competing managers
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Parallel loading: 5 countries at once instead of sequential
 * - Reduced delays: 10ms between batches vs 10-100ms per country
 * - Expected speedup: ~6-10x faster (10+ minutes → 1-2 minutes)
 * - 163 countries load in parallel batches of 5
 * - Progress updates in real-time
 * 
 * Usage:
 *   const manager = new CountyBoundaryManager(viewer);
 *   await manager.loadAllCounties((progress) => {
 *     console.log(`${progress.loaded}/${progress.total} countries`);
 *   });
 *   manager.show();
 */

// GLOBAL SINGLETON: Track manager instance per viewer
const globalManagerInstances = new WeakMap(); // WeakMap allows garbage collection

export class CountyBoundaryManager {
  constructor(viewer, options = {}) {
    if (!viewer) {
      throw new Error('CountyBoundaryManager requires a Cesium viewer');
    }

    // CRITICAL FIX: Return existing instance if already created for this viewer
    const existingManager = globalManagerInstances.get(viewer);
    if (existingManager) {
      // Update debug mode if options provided
      if (options.debug !== undefined) {
        existingManager.debugMode = options.debug;
      }
      existingManager._log('♻️ [SYSTEM2] Reusing existing CountyBoundaryManager instance');
      existingManager._log('♻️ [SYSTEM2] Manager has', existingManager.loadedCountries.size, 'countries,', existingManager.dataSource.entities.values.length, 'entities');
      return existingManager;
    }

    // Check if DataSource exists but manager doesn't (shouldn't happen, but safety check)
    const existingDataSource = viewer.dataSources._dataSources.find(
      ds => ds.name === 'county-boundaries-system2'
    );
    
    if (existingDataSource) {
      console.warn('⚠️ [SYSTEM2] Found orphaned DataSource - cleaning up');
      viewer.dataSources.remove(existingDataSource, true);
    }

    this.viewer = viewer;
    
    // Debug mode: Set to false to reduce console spam (1,630+ messages during full load)
    // ENABLED by default to see loading progress - can be disabled for production
    this.debugMode = options.debug ?? true;
    
    // Create isolated DataSource for counties (won't be affected by entity removal in other systems)
    this.dataSource = new window.Cesium.GeoJsonDataSource('county-boundaries-system2');
    this.dataSource.show = true; // CRITICAL: Make DataSource visible by default
    this.viewer.dataSources.add(this.dataSource);
    
    this._log('✅ [SYSTEM2] CountyBoundaryManager constructor called');
    this._log('✅ [SYSTEM2] Created NEW DataSource and added to viewer');
    this._log('✅ [SYSTEM2] Viewer now has', this.viewer.dataSources.length, 'dataSources');
    
    // Register this instance globally (SINGLETON pattern)
    globalManagerInstances.set(viewer, this);
    this._log('✅ [SYSTEM2] Registered as global singleton for this viewer');
    
    // Track loading state
    this.loadedCountries = new Set();
    this.isLoading = false;
    this.totalCounties = 0;
    
    // Country list (163 countries with ADM2 data)
    this.countryList = [
      'USA', 'CHN', 'IND', 'BRA', 'RUS', 'CAN', 'AUS', 'MEX', 'IDN', 'PAK',
      'NER', 'GIN', 'BIH', 'SYR', 'BRN', 'CHE', 'YEM', 'SVN', 'AFG', 'MNG',
      'MKD', 'KWT', 'DZA', 'TKM', 'SDN', 'URY', 'BTN', 'TLS', 'CPV', 'ITA',
      'LBN', 'ARM', 'GUY', 'GBR', 'ETH', 'MMR', 'NGA', 'SVK', 'VEN', 'PRY',
      'NPL', 'TJK', 'JOR', 'PRK', 'IRL', 'TUN', 'DEU', 'FIN', 'VNM', 'COL',
      'MDV', 'ISR', 'AZE', 'ALB', 'SWE', 'DOM', 'NLD', 'EST', 'SRB', 'BEL',
      'HRV', 'ARG', 'CHL', 'ECU', 'BOL', 'PER', 'GTM', 'CUB', 'HTI', 'HND',
      'SLV', 'NIC', 'CRI', 'PAN', 'BLZ', 'JAM', 'TTO', 'GNB', 'SLE', 'LBR',
      'CIV', 'GHA', 'TGO', 'BEN', 'BFA', 'MLI', 'MRT', 'SEN', 'GMB', 'GNQ',
      'GAB', 'COG', 'COD', 'AGO', 'ZMB', 'ZWE', 'MOZ', 'MWI', 'TZA', 'KEN',
      'UGA', 'RWA', 'BDI', 'SOM', 'DJI', 'ERI', 'SSD', 'CAF', 'TCD', 'CMR',
      'LSO', 'BWA', 'NAM', 'ZAF', 'MUS', 'MDG', 'COM', 'SYC', 'SWZ', 'ESP',
      'PRT', 'FRA', 'POL', 'UKR', 'ROU', 'GRC', 'BGR', 'AUT', 'HUN', 'CZE',
      'DNK', 'NOR', 'LVA', 'LTU', 'BLR', 'GEO', 'KAZ', 'UZB', 'KGZ', 'LKA',
      'BGD', 'KHM', 'LAO', 'THA', 'MYS', 'PHL', 'TWN', 'KOR', 'JPN', 'IRQ',
      'IRN', 'SAU', 'OMN', 'ARE', 'QAT', 'BHR', 'PSE', 'EGY', 'LBY', 'MAR',
      'ESH', 'SEN', 'NGA'
    ];
    
    // Priority countries to load first (better UX)
    this.priorityCountries = [
      'USA', 'CHN', 'IND', 'BRA', 'RUS', 'CAN', 'AUS', 'MEX', 'IDN', 'PAK'
    ];
    
    this._log('✅ [SYSTEM2] CountyBoundaryManager initialized');
  }

  /**
   * Conditional logging - only logs if debugMode is true
   * Use this instead of console.log to reduce spam
   */
  _log(...args) {
    if (this.debugMode) {
      console.log(...args);
    }
  }

  /**
   * Always log warnings (regardless of debug mode)
   */
  _warn(...args) {
    console.warn(...args);
  }

  /**
   * Always log errors (regardless of debug mode)
   */
  _error(...args) {
    console.error(...args);
  }

  /**
   * STATIC: Get existing instance for a viewer (if exists)
   * Useful for debugging and external access
   */
  static getInstance(viewer) {
    return globalManagerInstances.get(viewer) || null;
  }

  /**
   * STATIC: Check if manager exists for a viewer
   */
  static hasInstance(viewer) {
    return globalManagerInstances.has(viewer);
  }

  /**
   * Load county boundaries for a single country
   */
  async loadCountry(countryCode, options = {}) {
    if (this.loadedCountries.has(countryCode)) {
      this._log(`⏭️ [SYSTEM2] ${countryCode}: Already loaded, skipping`);
      return 0;
    }

    const url = `/data/boundaries/cities/${countryCode}-ADM2.geojson`;
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(300000) // 5 minute timeout for large files
      });

      if (!response.ok) {
        this._warn(`⚠️ [SYSTEM2] ${countryCode}: HTTP ${response.status} - file may not exist`);
        return 0;
      }

      const geoJson = await response.json();
      const countyCount = geoJson.features?.length || 0;

      if (countyCount === 0) {
        this._warn(`⚠️ [SYSTEM2] ${countryCode}: No features in GeoJSON`);
        return 0;
      }

      // CRITICAL FIX: Manually add entities WITHOUT clearing previous ones
      // GeoJsonDataSource.load() CLEARS all previous entities, so we must manually add each feature
      const entitiesBeforeLoad = this.dataSource.entities.values.length;
      
      this._log(`🔧 [SYSTEM2] ${countryCode}: Processing ${geoJson.features?.length || 0} features...`);
      
      // Process each feature and add as an entity
      let addedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      // CRITICAL: Suspend entity events during batch loading to prevent performance issues
      // With 20,000+ entities, adding them one-by-one causes Cesium to throttle rendering
      this.dataSource.entities.suspendEvents();
      this._log(`⏸️ [SYSTEM2] ${countryCode}: Suspended entity events for batch loading`);
      
      for (const feature of geoJson.features) {
        if (!feature.geometry || (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon')) {
          skippedCount++;
          continue;
        }

        try {
          // CRITICAL FIX: Handle MultiPolygon properly - render ALL parts, not just the first!
          // Many counties have multiple disconnected regions (islands, archipelagos, etc.)
          const coordinates = feature.geometry.coordinates;
          const polygonHierarchies = [];

          if (feature.geometry.type === 'Polygon') {
            // Single polygon - process outer ring and holes
            const outerRing = coordinates[0].map(coord => 
              window.Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
            );
            
            // Process holes (inner rings)
            const holes = [];
            for (let i = 1; i < coordinates.length; i++) {
              const hole = coordinates[i].map(coord => 
                window.Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
              );
              if (hole.length >= 3) {
                holes.push(new window.Cesium.PolygonHierarchy(hole));
              }
            }
            
            const hierarchy = new window.Cesium.PolygonHierarchy(outerRing, holes.length > 0 ? holes : undefined);
            polygonHierarchies.push(hierarchy);
            
          } else if (feature.geometry.type === 'MultiPolygon') {
            // MultiPolygon - process ALL polygons (not just the first!)
            // Each polygon in MultiPolygon represents a separate disconnected region
            for (const polygon of coordinates) {
              if (!polygon || !polygon[0] || polygon[0].length < 3) {
                continue;
              }
              
              // Outer ring
              const outerRing = polygon[0].map(coord => 
                window.Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
              );
              
              // Process holes (inner rings) for this polygon part
              const holes = [];
              for (let i = 1; i < polygon.length; i++) {
                const hole = polygon[i].map(coord => 
                  window.Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
                );
                if (hole.length >= 3) {
                  holes.push(new window.Cesium.PolygonHierarchy(hole));
                }
              }
              
              const hierarchy = new window.Cesium.PolygonHierarchy(outerRing, holes.length > 0 ? holes : undefined);
              polygonHierarchies.push(hierarchy);
            }
          }

          // Validate we have at least one valid polygon hierarchy
          if (polygonHierarchies.length === 0) {
            this._warn(`⚠️ [SYSTEM2] ${countryCode}: No valid polygon hierarchies created`);
            errorCount++;
            continue;
          }

          // Create entities for each polygon part (MultiPolygon may have multiple parts)
          for (let partIndex = 0; partIndex < polygonHierarchies.length; partIndex++) {
            const polygonHierarchy = polygonHierarchies[partIndex];
            
            // Validate polygon hierarchy has valid positions
            if (!polygonHierarchy || !polygonHierarchy.positions || polygonHierarchy.positions.length < 3) {
              this._warn(`⚠️ [SYSTEM2] ${countryCode}: Invalid polygon hierarchy part ${partIndex} (${polygonHierarchy?.positions?.length || 0} positions)`);
              errorCount++;
              continue;
            }

            // Check for NaN/Infinity in positions
            const hasInvalidPositions = polygonHierarchy.positions.some(pos => 
              !isFinite(pos.x) || !isFinite(pos.y) || !isFinite(pos.z)
            );
            
            if (hasInvalidPositions) {
              this._warn(`⚠️ [SYSTEM2] ${countryCode}: Invalid positions detected in part ${partIndex} (NaN/Infinity)`);
              errorCount++;
              continue;
            }

            // Create unique entity ID for each part (for MultiPolygon with multiple parts)
            const baseEntityId = `county-${countryCode}-${feature.properties?.GID_2 || feature.properties?.NAME_2 || addedCount}`;
            const entityId = polygonHierarchies.length > 1 ? `${baseEntityId}-part${partIndex}` : baseEntityId;
            
            const entity = this.dataSource.entities.add({
              id: entityId,
              name: feature.properties?.NAME_2 || feature.properties?.NAME_1 || 'County',
              polygon: {
                hierarchy: polygonHierarchy,
                material: window.Cesium.Color.YELLOW.withAlpha(0.3),
                outline: true,
                outlineColor: window.Cesium.Color.YELLOW,
                outlineWidth: 3,
                height: 0,
                classificationType: window.Cesium.ClassificationType.TERRAIN,
                shadows: window.Cesium.ShadowMode.DISABLED,
                // CRITICAL: Add distance display condition to prevent culling at certain camera distances
                // Same as provinces use - ensures counties are visible at all zoom levels
                distanceDisplayCondition: new window.Cesium.DistanceDisplayCondition(0.0, 2.5e7)
              }
            });
            
            // Verify entity was added
            if (!entity) {
              this._error(`🚨 [SYSTEM2] ${countryCode}: Failed to add entity part ${partIndex}!`);
              errorCount++;
              continue;
            }
            
            addedCount++;
          }
        } catch (err) {
          // Skip invalid features
          errorCount++;
          this._warn(`⚠️ [SYSTEM2] ${countryCode}: Feature error #${errorCount}:`, err.message);
        }
      }
      
      // CRITICAL: Resume entity events after batch loading to trigger rendering
      this.dataSource.entities.resumeEvents();
      this._log(`▶️ [SYSTEM2] ${countryCode}: Resumed entity events, triggering render`);
      
      // CRITICAL: Force immediate render after resuming events
      // Without this, Cesium may delay rendering when many entities are added
      if (this.viewer.scene) {
        this.viewer.scene.requestRender();
      }

      const entitiesAfterLoad = this.dataSource.entities.values.length;
      const actualAdded = entitiesAfterLoad - entitiesBeforeLoad;
      
      this._log(`🔧 [SYSTEM2] ${countryCode}: Stats: ${addedCount} added, ${skippedCount} skipped, ${errorCount} errors`);
      this._log(`🔧 [SYSTEM2] ${countryCode}: Entity count: before=${entitiesBeforeLoad}, after=${entitiesAfterLoad}, delta=${actualAdded}`);
      
      if (actualAdded !== addedCount) {
        this._error(`🚨 [SYSTEM2] ${countryCode}: MISMATCH! Expected to add ${addedCount} but actual delta is ${actualAdded}!`);
      }

      this.loadedCountries.add(countryCode);
      this.totalCounties += countyCount;

      const loadTime = Date.now() - startTime;
      const entityCount = this.dataSource.entities.values.length;
      
      this._log(`✅ [SYSTEM2] ${countryCode}: Completed in ${loadTime}ms`);
      this._log(`✅ [SYSTEM2] ${countryCode}: Total counties tracked: ${this.totalCounties}, DataSource entities: ${entityCount}`);
      this._log(`✅ [SYSTEM2] ${countryCode}: DataSource.show=${this.dataSource.show}, viewer has ${this.viewer.dataSources.length} dataSources`);
      
      // Verify dataSource is in viewer
      const dsIndex = this.viewer.dataSources.indexOf(this.dataSource);
      if (dsIndex === -1) {
        this._error(`🚨 [SYSTEM2] ${countryCode}: DataSource NOT in viewer's dataSources!`);
      } else {
        this._log(`✅ [SYSTEM2] ${countryCode}: DataSource is at index ${dsIndex} in viewer`);
      }
      
      // Sample check: verify first entity is renderable
      if (entityCount > 0) {
        const firstEntity = this.dataSource.entities.values[0];
        this._log(`🔍 [SYSTEM2] ${countryCode}: Sample entity check:`, {
          id: firstEntity.id,
          hasPolygon: !!firstEntity.polygon,
          hasHierarchy: !!firstEntity.polygon?.hierarchy,
          outlineEnabled: firstEntity.polygon?.outline?.getValue(),
          outlineColor: firstEntity.polygon?.outlineColor?.getValue()?.toString(),
          material: firstEntity.polygon?.material?.getValue()?.toString()
        });
      }
      
      // Force viewer update to render immediately
      if (this.viewer.scene) {
        this.viewer.scene.requestRender();
      }
      
      return countyCount;

    } catch (error) {
      if (error.name === 'TimeoutError') {
        this._error(`❌ [SYSTEM2] ${countryCode}: Timeout after 5 minutes`);
      } else if (error.name === 'AbortError') {
        this._error(`❌ [SYSTEM2] ${countryCode}: Request aborted`);
      } else {
        this._error(`❌ [SYSTEM2] ${countryCode}: Load failed -`, error.message);
      }
      return 0;
    }
  }

  /**
   * Load all countries progressively with PARALLEL LOADING for speed
   */
  async loadAllCounties(onProgress = null) {
    // UNCONDITIONAL LOG: Always show when loadAllCounties is called
    console.log('🔍 [SYSTEM2] loadAllCounties() CALLED');
    console.log('🔍 [SYSTEM2] isLoading check:', this.isLoading);
    console.log('🔍 [SYSTEM2] manager instance:', this);
    console.log('🔍 [SYSTEM2] countryList length:', this.countryList?.length);
    
    if (this.isLoading) {
      console.warn('⚠️ [SYSTEM2] Already loading counties, please wait');
      this._warn('⚠️ [SYSTEM2] Already loading counties, please wait');
      return;
    }

    this.isLoading = true;
    const startTime = Date.now();
    
    // CRITICAL: Show DataSource immediately so counties are visible as they load
    this.dataSource.show = true;
    console.log('👁️ [SYSTEM2] DataSource set to visible at start of loading');
    
    // UNCONDITIONAL LOGS: Always show loading start
    console.log('🌍 [SYSTEM2] ========== LOADING ALL COUNTY BOUNDARIES ==========');
    console.log(`🌍 [SYSTEM2] Loading ${this.countryList.length} countries with ADM2 data`);
    console.log('🚀 [SYSTEM2] PERFORMANCE MODE: Parallel loading with batching');
    
    this._log('🌍 [SYSTEM2] ========== LOADING ALL COUNTY BOUNDARIES ==========');
    this._log(`🌍 [SYSTEM2] Loading ${this.countryList.length} countries with ADM2 data`);
    this._log('🚀 [SYSTEM2] PERFORMANCE MODE: Parallel loading with batching');

    let loadedCount = 0;
    let successCount = 0;

    // PERFORMANCE FIX: Load countries in PARALLEL batches instead of sequentially
    // This reduces 10+ minutes to ~1-2 minutes
    const BATCH_SIZE = 5; // Load 5 countries at once
    
    // Load priority countries first (USA, China, India, etc.) - PARALLEL
    this._log('\n⭐ [SYSTEM2] Loading priority countries (parallel batches)...');
    for (let i = 0; i < this.priorityCountries.length; i += BATCH_SIZE) {
      const batch = this.priorityCountries.slice(i, i + BATCH_SIZE);
      
      // CRITICAL FIX: Use Promise.allSettled instead of Promise.all
      // This ensures one failing country doesn't stop the entire batch
      const results = await Promise.allSettled(
        batch.map(countryCode => this.loadCountry(countryCode))
      );
      
      // Update progress for each result (both fulfilled and rejected)
      results.forEach((result, idx) => {
        loadedCount++;
        const countryCode = batch[idx];
        
        if (result.status === 'fulfilled' && result.value > 0) {
          successCount++;
        } else if (result.status === 'rejected') {
          this._error(`❌ [SYSTEM2] ${countryCode}: Promise rejected -`, result.reason);
        }
        
        if (onProgress) {
          onProgress({
            loaded: loadedCount,
            total: this.countryList.length,
            current: countryCode,
            counties: this.totalCounties,
            success: successCount
          });
        }
      });
      
      // Small delay between batches to keep browser responsive
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // UNCONDITIONAL LOG: Always show that priority countries loop completed
    console.log('\n✅ [SYSTEM2] Priority countries loop COMPLETED');
    console.log(`✅ [SYSTEM2] Priority countries processed: ${this.priorityCountries.length}`);
    console.log(`✅ [SYSTEM2] Loaded count so far: ${loadedCount}`);
    console.log(`✅ [SYSTEM2] Success count so far: ${successCount}`);

    // Load remaining countries - PARALLEL batches
    this._log('\n📦 [SYSTEM2] Loading remaining countries (parallel batches)...');
    console.log('\n📦 [SYSTEM2] ========== STARTING REMAINING COUNTRIES ==========');
    
    const remaining = this.countryList.filter(c => !this.priorityCountries.includes(c));
    
    // UNCONDITIONAL LOG: Always show remaining countries count
    console.log(`📦 [SYSTEM2] Remaining countries to load: ${remaining.length}`);
    console.log(`📦 [SYSTEM2] Priority countries loaded: ${this.priorityCountries.length}`);
    console.log(`📦 [SYSTEM2] Total countries in list: ${this.countryList.length}`);
    console.log(`📦 [SYSTEM2] Sample remaining countries: ${remaining.slice(0, 10).join(', ')}`);
    
    if (remaining.length === 0) {
      console.warn('⚠️ [SYSTEM2] No remaining countries to load (all are priority countries)');
    } else {
      console.log(`📦 [SYSTEM2] Starting loop for ${remaining.length} remaining countries`);
      console.log(`📦 [SYSTEM2] Will process in batches of ${BATCH_SIZE}`);
      
      try {
        for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
        const batch = remaining.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(remaining.length / BATCH_SIZE);
        
        // UNCONDITIONAL LOG: Always show batch progress
        console.log(`📦 [SYSTEM2] Batch ${batchNum}/${totalBatches}: Loading ${batch.join(', ')}`);
        
        try {
          // CRITICAL FIX: Use Promise.allSettled instead of Promise.all
          // This ensures one failing country doesn't stop the entire batch
          const results = await Promise.allSettled(
            batch.map(countryCode => this.loadCountry(countryCode))
          );
          
          // Update progress for each result (both fulfilled and rejected)
          results.forEach((result, idx) => {
            loadedCount++;
            const countryCode = batch[idx];
            
            if (result.status === 'fulfilled' && result.value > 0) {
              successCount++;
              console.log(`✅ [SYSTEM2] ${countryCode}: Successfully loaded ${result.value} counties`);
            } else if (result.status === 'rejected') {
              this._error(`❌ [SYSTEM2] ${countryCode}: Promise rejected -`, result.reason);
              console.error(`❌ [SYSTEM2] ${countryCode}: Error details:`, result.reason);
            } else if (result.status === 'fulfilled' && result.value === 0) {
              console.warn(`⚠️ [SYSTEM2] ${countryCode}: Loaded but returned 0 counties`);
            }
            
            if (onProgress) {
              onProgress({
                loaded: loadedCount,
                total: this.countryList.length,
                current: countryCode,
                counties: this.totalCounties,
                success: successCount
              });
            }
          });
          
          // UNCONDITIONAL LOG: Always show batch completion
          console.log(`📦 [SYSTEM2] Batch ${batchNum}/${totalBatches} complete: ${loadedCount}/${this.countryList.length} total`);
          
        } catch (error) {
          // CRITICAL: Catch any errors in batch processing to prevent stopping
          console.error(`❌ [SYSTEM2] Error processing batch ${batchNum}:`, error);
          console.error(`❌ [SYSTEM2] Error stack:`, error.stack);
          // Continue to next batch even if this one fails
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Log progress every 10 batches
        if ((i / BATCH_SIZE) % 10 === 0) {
          this._log(`📊 [SYSTEM2] Progress: ${loadedCount}/${this.countryList.length} countries (${successCount} successful)`);
        }
      }
      
      console.log(`\n✅ [SYSTEM2] Remaining countries loop COMPLETED`);
      console.log(`✅ [SYSTEM2] Final loaded count: ${loadedCount}/${this.countryList.length}`);
      console.log(`✅ [SYSTEM2] Final success count: ${successCount}`);
      
      } catch (loopError) {
        console.error('❌ [SYSTEM2] ERROR in remaining countries loop:', loopError);
        console.error('❌ [SYSTEM2] Error stack:', loopError.stack);
        console.error('❌ [SYSTEM2] This error prevented remaining countries from loading');
        // Don't throw - continue to completion logging
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const avgTimePerCountry = (parseInt(totalTime) / this.countryList.length * 1000).toFixed(0);
    this.isLoading = false;
    
    // UNCONDITIONAL LOGS: Always show completion
    console.log('\n🎉 [SYSTEM2] ========== LOADING COMPLETE ==========');
    console.log(`🎉 [SYSTEM2] Loaded ${this.totalCounties.toLocaleString()} counties from ${successCount}/${this.countryList.length} countries`);
    console.log(`🎉 [SYSTEM2] Total time: ${totalTime} seconds (avg ${avgTimePerCountry}ms per country)`);
    console.log(`🎉 [SYSTEM2] DataSource contains ${this.dataSource.entities.values.length} entities`);
    console.log(`🎉 [SYSTEM2] DataSource visible: ${this.dataSource.show}`);
    console.log(`🎉 [SYSTEM2] Performance gain: ~${Math.round(600 / parseInt(totalTime))}x faster than sequential`);
    
    this._log('\n🎉 [SYSTEM2] ========== LOADING COMPLETE ==========');
    this._log(`🎉 [SYSTEM2] Loaded ${this.totalCounties.toLocaleString()} counties from ${successCount}/${this.countryList.length} countries`);
    this._log(`🎉 [SYSTEM2] Total time: ${totalTime} seconds (avg ${avgTimePerCountry}ms per country)`);
    this._log(`🎉 [SYSTEM2] DataSource contains ${this.dataSource.entities.values.length} entities`);
    this._log(`🎉 [SYSTEM2] DataSource visible: ${this.dataSource.show}`);
    this._log(`🎉 [SYSTEM2] Performance gain: ~${Math.round(600 / parseInt(totalTime))}x faster than sequential`);
    
    // Print detailed status
    this.printStatus();
    
    // Start monitoring for entity removal
    this.startPersistenceCheck();
  }

  /**
   * Monitor entity persistence (detect if entities are being removed)
   */
  startPersistenceCheck() {
    if (this.persistenceCheckInterval) {
      clearInterval(this.persistenceCheckInterval);
    }

    let lastEntityCount = this.dataSource.entities.values.length;
    let lastShowState = this.dataSource.show;

    this.persistenceCheckInterval = setInterval(() => {
      const currentEntityCount = this.dataSource.entities.values.length;
      const currentShowState = this.dataSource.show;

      // Detect entity removal
      if (currentEntityCount < lastEntityCount) {
        this._error(`🚨 [SYSTEM2] ENTITIES REMOVED! Was ${lastEntityCount}, now ${currentEntityCount} (lost ${lastEntityCount - currentEntityCount} entities)`);
        this._error(`🚨 [SYSTEM2] Something is deleting county boundaries!`);
      }

      // Detect visibility change
      if (currentShowState !== lastShowState) {
        this._warn(`⚠️ [SYSTEM2] Visibility changed: ${lastShowState} -> ${currentShowState}`);
      }

      lastEntityCount = currentEntityCount;
      lastShowState = currentShowState;
    }, 2000); // Check every 2 seconds

    this._log('👁️ [SYSTEM2] Entity persistence monitoring started');
  }

  /**
   * Stop persistence check
   */
  stopPersistenceCheck() {
    if (this.persistenceCheckInterval) {
      clearInterval(this.persistenceCheckInterval);
      this.persistenceCheckInterval = null;
      this._log('👁️ [SYSTEM2] Entity persistence monitoring stopped');
    }
  }

  /**
   * Show county boundaries
   */
  show() {
    this.dataSource.show = true;
    const entityCount = this.dataSource.entities.values.length;
    this._log(`👁️ [SYSTEM2] County boundaries visible (${this.totalCounties} counties, ${entityCount} entities in dataSource)`);
    this._log(`👁️ [SYSTEM2] DataSource show property: ${this.dataSource.show}`);
  }

  /**
   * Hide county boundaries
   */
  hide() {
    this.dataSource.show = false;
    this.stopPersistenceCheck();
    this._log(`🙈 [SYSTEM2] County boundaries hidden`);
  }

  /**
   * Clear all loaded counties
   */
  clear() {
    this.stopPersistenceCheck();
    this.dataSource.entities.removeAll();
    this.loadedCountries.clear();
    this.totalCounties = 0;
    this._log('🗑️ [SYSTEM2] County boundaries cleared');
  }

  /**
   * Get loading status
   */
  getStatus() {
    const entityCount = this.dataSource.entities.values.length;
    const sampleEntities = this.dataSource.entities.values.slice(0, 3).map(e => ({
      id: e.id,
      hasPolygon: !!e.polygon,
      visible: e.show !== false
    }));
    
    return {
      isLoading: this.isLoading,
      loadedCountries: this.loadedCountries.size,
      totalCounties: this.totalCounties,
      actualEntityCount: entityCount,
      isVisible: this.dataSource.show,
      inViewer: this.viewer.dataSources.indexOf(this.dataSource) !== -1,
      sampleEntities: sampleEntities
    };
  }

  /**
   * Debug: Print detailed status
   */
  printStatus() {
    const status = this.getStatus();
    this._log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this._log('🔍 [SYSTEM2] COUNTY BOUNDARY SYSTEM STATUS');
    this._log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this._log(`📊 Loaded Countries: ${status.loadedCountries}`);
    this._log(`📊 Total Counties (tracked): ${status.totalCounties}`);
    this._log(`📊 Actual Entities in DataSource: ${status.actualEntityCount}`);
    this._log(`📊 DataSource visible: ${status.isVisible}`);
    this._log(`📊 DataSource in viewer: ${status.inViewer}`);
    this._log(`📊 Sample entities:`, status.sampleEntities);
    this._log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check if mismatch
    if (status.totalCounties !== status.actualEntityCount) {
      this._error(`🚨 CRITICAL MISMATCH: totalCounties (${status.totalCounties}) !== actualEntityCount (${status.actualEntityCount})`);
      this._error(`🚨 This means ${status.totalCounties - status.actualEntityCount} counties are "missing" from DataSource!`);
    }
  }

  /**
   * Check if counties are currently visible on screen
   */
  isVisible() {
    return this.dataSource.show;
  }

  /**
   * Get loaded country codes
   */
  getLoadedCountries() {
    return Array.from(this.loadedCountries);
  }

  /**
   * Dispose manager and remove from viewer
   */
  dispose() {
    this.stopPersistenceCheck();
    this.viewer.dataSources.remove(this.dataSource, true);
    this.loadedCountries.clear();
    this.totalCounties = 0;
    
    // Remove from global singleton registry
    globalManagerInstances.delete(this.viewer);
    
    this._log('🗑️ [SYSTEM2] CountyBoundaryManager disposed and removed from singleton registry');
  }
}

export default CountyBoundaryManager;

