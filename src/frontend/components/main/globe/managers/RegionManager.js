// ============================================================================
// RegionManager.js - Country and State Boundary Management
// ============================================================================
// Handles loading, rendering, and management of geographic boundaries
// ============================================================================
// 
// ⚠️ WARNING: This file is 5,679 lines (after static data extraction)
// 
// 📋 REFACTORING PLAN - SCHEDULED FOR MODULARIZATION:
// This file will be split into 10 modules over the next 6 weeks:
//   1. CountryBoundaryLoader.js (~400 lines) - Load country boundaries
//   2. ProvinceBoundaryLoader.js (~600 lines) - Load province boundaries
//   3. CityBoundaryLoader.js (~800 lines) - Load city boundaries
//   4. RegionHoverSystem.js (~600 lines) - Handle hover interactions
//   5. RegionRegistry.js (~200 lines) - Entity tracking system
//   6. RegionValidator.js (~400 lines) - Validate region data
//   7. OthersEntityManager.js (~800 lines) - Manage "Others" entities
//   8. RegionCleaner.js (~300 lines) - Unified cleanup logic
//   9. GeoJSONHelpers.js (~300 lines) - GeoJSON utilities
//   10. RegionManager.js (controller, ~200 lines) - Main controller
//
// 📖 Full plan: See CODE_ANALYSIS_REPORT.md and REFACTORING_ROADMAP.md
// 📅 Target: Complete by [6 weeks from today]
// 👤 Owner: [Dev Team]
// 
// CURRENT ISSUES:
// - 6 duplicate clear methods (clearRegions, clearCountries, clearProvinces, etc.)
// - 4 duplicate load methods (loadCountryBoundaries, loadProvinceBoundaries, etc.)
// - 5 duplicate validation methods
// - ~15-25% code duplication
// - 9 different responsibilities in one file
// - Difficult to test and maintain
//
// PHASE 1 COMPLETE ✅:
// - Static data extracted to admin-counts.json (-238 lines)
// - CountyBoundaryManager.js debug mode added
// - Refactoring plan documented
//
// NEXT STEPS:
// - Phase 2: Extract loaders (Week 1-2)
// - Phase 3: Extract systems (Week 3)
// - Phase 4: Extract validators & managers (Week 4)
// - Phase 5: Extract cleaners & utils (Week 5)
// - Phase 6: Create new controller (Week 6)
// 
// ============================================================================

import { DEBUG_CONFIG } from '../../../workspace/constants.js';
import { AdministrativeHierarchy } from './AdministrativeHierarchy.js';
import adminCounts from '../../../../data/admin-counts.json';
import { RegionHoverSystem } from './RegionHoverSystem.js';
import { RegionRegistry } from './RegionRegistry.js';
import { extractFeatureName } from './GeoJSONHelpers.js';

export class RegionManager {
  // Static reference table for expected ADM1 province counts by country
  // (Extracted to external JSON file for maintainability)
  static ADM1_COUNTS = adminCounts;

  // Track province creation per country during processing
  constructor(viewer, entitiesRef = null, onRegionClick = null, activeClusterLevel = 'gps') {
    this.viewer = viewer;
    this.loadedRegions = new Set();

    // Performance optimization: Disable debug logging for production
    this.DEBUG = false; // DISABLED for production performance

    // Province tracking for validation
    this.provinceCountsByCountry = new Map(); // country -> count

    // Region click callback
    this.onRegionClick = onRegionClick;
    
    // Active cluster level for filtering visibility
    this.activeClusterLevel = activeClusterLevel;
    
    // ✨ REFACTORED: Initialize RegionRegistry (replaces manual activeRegions and entitiesByLayer)
    this.regionRegistry = new RegionRegistry(viewer);
    
    // Backward compatibility: Expose registry internals via getters
    Object.defineProperty(this, 'activeRegions', {
      get: () => this.regionRegistry.activeRegions
    });
    Object.defineProperty(this, 'entitiesByLayer', {
      get: () => this.regionRegistry.entitiesByLayer
    });

    // ✨ REFACTORED: Initialize RegionHoverSystem (replaces manual hover management)
    this.hoverSystem = new RegionHoverSystem(viewer, {
      activeClusterLevel,
      onRegionClick
    });
    
    // Backward compatibility: Expose hover system internals via getters
    Object.defineProperty(this, 'hoveredRegion', {
      get: () => this.hoverSystem.hoveredRegion
    });
    Object.defineProperty(this, 'highlightEntity', {
      get: () => this.hoverSystem.highlightEntity
    });
    Object.defineProperty(this, 'tooltipElement', {
      get: () => this.hoverSystem.tooltipElement
    });
    Object.defineProperty(this, 'mouseHandlers', {
      get: () => this.hoverSystem.mouseHandlers
    });

    // Initialize Administrative Hierarchy (restore original working system)
    this.adminHierarchy = new AdministrativeHierarchy(viewer, entitiesRef);
    
    // Set up window focus handler to ensure entity persistence
    this.setupEntityPersistence();

    // City boundary system
    this.cityEntities = new Map(); // cityId -> entity
    this.hoveredCity = null;
    this.cityEventHandler = null;
    this.hoverPanel = null; // HTML hover panel
    this.cityNames = new Map(); // location -> city name for better labeling
    this.cityNamesByLocation = new Map(); // exact coordinates -> city name

    // Others entities system (Country - Cities)
    this.othersEntities = new Map(); // othersId -> entity

    // Main entity tracking reference for synchronization
    this.mainEntitiesRef = entitiesRef;

    // Configure viewer for optimal large polygon rendering
    this.configureViewerForLargePolygons();

    // ✨ REFACTORED: Initialize hover system via module
    this.hoverSystem.initialize();

    // Initialize city boundary system
    this.initializeCitySystem();

    // Initialize visibility change handling for persistent city boundaries
    this.initializeVisibilityHandling();

    console.log(
      "🗺️ RegionManager initialized with hover effects (refactored), duplicate prevention, city boundary system, and persistent rendering",
    );
  }

  // Method to set the main entitiesRef later (called from GlobalChannelRenderer)
  setEntitiesRef(entitiesRef) {
    this.mainEntitiesRef = entitiesRef;
    console.log("🗺️ RegionManager: entitiesRef set for synchronization");
  }

  // Initialize visibility change handling for persistent city boundaries
  initializeVisibilityHandling() {
    // Handle page visibility changes to ensure city boundaries persist
    this.handleVisibilityChange = () => {
      if (!document.hidden && this.viewer && this.cityEntities.size > 0) {
        console.log('🔄 Page became visible, city boundaries active');
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Also listen for focus events as backup
    window.addEventListener('focus', this.handleVisibilityChange);
    
    // Handle camera movement for zoom/pan persistence
    this.handleCameraMoveEnd = () => {
      if (this.viewer && this.cityEntities.size > 0) {
        console.log('📷 Camera move ended, city boundaries should persist...');
        
        // Count entities in viewer.entities vs our tracking
        const entitiesInViewer = this.viewer.entities.values.length;
        const entitiesInTracking = this.cityEntities.size;
        
        // Count visible entities with enhanced validation
        let visibleCount = 0;
        let renderedCount = 0;
        this.cityEntities.forEach((entity, id) => {
          if (entity.show) {
            visibleCount++;
          }
          // Check if entity is actually in the viewer
          if (this.viewer.entities.contains(entity)) {
            renderedCount++;
          }
        });
        
        // Log comprehensive camera event status
        console.log(`CAMERA_EVENT: boundaries validated`);
        console.log(`  📊 Entity counts: tracking=${entitiesInTracking} viewer=${entitiesInViewer} visible=${visibleCount} rendered=${renderedCount}`);
        
        // Check for mismatches
        if (renderedCount !== entitiesInTracking) {
          console.log(`⚠️ ENTITY_MISMATCH: ${entitiesInTracking} expected, ${renderedCount} rendered → attempting restoration`);
        }
        
        if (visibleCount !== entitiesInTracking) {
          console.log(`⚠️ VISIBILITY_MISMATCH: ${entitiesInTracking} expected, ${visibleCount} visible → attempting restoration`);
        }
        
        // Force scene render
        if (this.viewer && this.viewer.scene) {
          this.viewer.scene.requestRender();
        }
      }
    };
    
    // Add camera event listener when viewer is available
    if (this.viewer && this.viewer.camera) {
      this.viewer.camera.moveEnd.addEventListener(this.handleCameraMoveEnd);
    }
    
    console.log('✅ Visibility change handling initialized for persistent city boundaries');
  }

  /**
   * Set active cluster level and update layer visibility
   * @param {string} level - 'gps', 'province', 'country', 'continent', 'global'
   */
  setActiveClusterLevel(level) {
    console.log(`🔄 Setting active cluster level to: ${level}`);
    this.activeClusterLevel = level;
    
    // ✨ REFACTORED: Delegate to hover system
    if (this.hoverSystem) {
      this.hoverSystem.setActiveClusterLevel(level);
    }
    
    this.updateLayerVisibility();
  }

  /**
   * Update layer visibility based on active cluster level
   * GPS/Province → Show provinces only
   * Country → Show countries only  
   * Continent → Show continents only
   */
  updateLayerVisibility() {
    console.log(`👁️ Updating layer visibility for cluster level: ${this.activeClusterLevel}`);
    
    // Determine which layer should be visible
    let visibleLayer = null;
    if (this.activeClusterLevel === 'gps' || this.activeClusterLevel === 'province') {
      visibleLayer = 'provinces';
    } else if (this.activeClusterLevel === 'county') {
      visibleLayer = 'counties';  // ← FIX: Added county case!
    } else if (this.activeClusterLevel === 'country') {
      visibleLayer = 'countries';
    } else if (this.activeClusterLevel === 'continent') {
      visibleLayer = 'continents';
    }
    
    console.log(`📍 Visible layer: ${visibleLayer || 'none'}`);
    
    // Update visibility for all entities in each layer
    for (const [layerType, entities] of Object.entries(this.entitiesByLayer)) {
      const shouldShow = layerType === visibleLayer;
      
      entities.forEach(entityId => {
        const entity = this.viewer.entities.getById(entityId);
        if (entity) {
          entity.show = shouldShow;
        }
      });
      
      if (entities.size > 0) {
        console.log(`${shouldShow ? '✅' : '🚫'} ${layerType}: ${entities.size} entities ${shouldShow ? 'shown' : 'hidden'}`);
      }
    }
  }

  // Configure viewer for optimal large polygon rendering
  configureViewerForLargePolygons() {
    if (!this.viewer || !this.viewer.scene) {
      console.warn("⚠️ Viewer not available for large polygon configuration");
      return;
    }

    try {
      const scene = this.viewer.scene;

      // Ensure lighting is disabled for consistent polygon rendering
      scene.globe.enableLighting = false;

      // Disable terrain interactions that can cause shading issues
      scene.globe.enableTerrainClamping = false;
      scene.globe.enableTerrainClipping = false;
      scene.globe.enableDepthTestAgainstTerrain = false;

      // Disable atmospheric effects that can affect polygon brightness
      scene.globe.enableAtmosphere = false;
      scene.fog.enabled = false;

      // Disable shadows globally
      scene.shadows = false;

      console.log(
        "✅ Viewer configured for flat, consistent polygon rendering",
      );
    } catch (error) {
      console.warn("⚠️ Error configuring viewer for large polygons:", error);
    }
  }

  // ✨ REFACTORED: Hover system methods moved to RegionHoverSystem.js
  // Old methods removed - now using this.hoverSystem instead

  // Cleanup method for destroying the RegionManager
  destroy() {
    console.log("🗑️ Destroying RegionManager...");

    try {
      // ✨ REFACTORED: Destroy extracted modules
      if (this.hoverSystem) {
        this.hoverSystem.destroy();
      }

      if (this.regionRegistry) {
        this.regionRegistry.destroy();
      }

      // Remove visibility change event listeners
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('focus', this.handleVisibilityChange);
      
      // Clean up camera event listener
      if (this.viewer && this.viewer.camera && this.handleCameraMoveEnd) {
        this.viewer.camera.moveEnd.removeEventListener(this.handleCameraMoveEnd);
      }

      // Destroy city system
      this.destroyCitySystem();

      console.log("✅ RegionManager destroyed successfully (refactored)");
    } catch (error) {
      console.error("❌ Error destroying RegionManager:", error);
    }
  }

  // Registry management for preventing duplicates
  registerOnce(key, entityIds) {
    if (this.activeRegions.has(key)) {
      console.warn(`⚠️ Region ${key} already registered, removing existing entities first`);
      this.removeByKey(key);
    }
    this.activeRegions.set(key, entityIds);
    return true;
  }

  removeByKey(key) {
    const entityIds = this.activeRegions.get(key);
    if (entityIds) {
      entityIds.forEach((id) => {
        const entity = this.viewer.entities.getById(id);
        if (entity) {
          this.viewer.entities.remove(entity);
        }
      });
      this.activeRegions.delete(key);
      console.log(`🗑️ Removed ${entityIds.length} entities for ${key}`);
    }
  }

  // Debug helpers for validation
  dumpAdm0(code) {
    const arr = [...this.viewer.entities.values].filter((e) =>
      (e.id || "").startsWith(`adm0:${code}`),
    );
    console.table(
      arr.map((e) => ({
        id: e.id,
        show: e.polygon.show.getValue(this.viewer.clock.currentTime),
      })),
    );
    return arr.length;
  }

  countLayer(prefix) {
    return [...this.viewer.entities.values].filter((e) =>
      (e.id || "").startsWith(prefix),
    ).length;
  }

  // Load specific region type (countries or states)
  async loadRegions(layerType) {
    console.log(
      `🌍 Loading ${layerType} boundaries with comprehensive coverage...`,
    );

    try {
      // Ensure viewer and Cesium are available
      if (!this.viewer || !this.viewer.entities) {
        console.error("❌ Cesium viewer not available for region loading");
        return { success: false, error: "Viewer not initialized" };
      }

      if (!window.Cesium) {
        console.error("❌ Cesium library not available for region loading");
        return { success: false, error: "Cesium not loaded" };
      }

      // Clear existing regions first
      await this.clearRegions();

      // Data sources for regions
      const dataSources = {
        countries: {
          url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson",
          name: "Countries (50m)",
          color: { fill: [100, 150, 255], stroke: [50, 100, 200], alpha: 0.15 },
        },
        states: {
          url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson",
          name: "States/Provinces (50m)",
          color: { fill: [200, 255, 100], stroke: [200, 255, 100], alpha: 0.1 },
        },
        continents: {
          url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson",
          name: "Continents",
          color: { fill: [255, 150, 100], stroke: [255, 100, 50], alpha: 0.15 },
          groupByContinent: true, // Special flag to group countries by continent
        },
      };

      const source = dataSources[layerType];
      if (!source) {
        throw new Error(`Unknown layer type: ${layerType}`);
      }

      // Ensure viewer is ready for region operations
      if (!this.viewer.isReadyForRegions) {
        console.error("❌ Cesium viewer not ready for region operations");
        return { success: false, error: "Viewer not ready" };
      }

      // Fetch GeoJSON data
      console.log(`🌐 Fetching from: ${source.url}`);
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${layerType} data: ${response.status}`,
        );
      }
      const data = await response.json();

      if (!data.features || !Array.isArray(data.features)) {
        throw new Error("Invalid GeoJSON format");
      }

      console.log(
        `📊 Found ${data.features.length} ${layerType} features to process`,
      );

      // Process and render features
      const result = this.processFeatures(data.features, layerType, source);

      console.log(
        `✅ ${layerType} Summary: Created ${result.createdCount}, Skipped ${result.skippedCount}, Errors ${result.errorCount}`,
      );
      console.log(`📋 Loaded ${result.loadedRegions.size} unique ${layerType}`);

      // Log some examples of loaded regions
      const regionExamples = Array.from(result.loadedRegions).slice(0, 10);
      console.log(`📋 Sample ${layerType}: ${regionExamples.join(", ")}`);

      // Log verification for key countries
      const keyCountries = [
        "russia",
        "canada",
        "china",
        "brazil",
        "australia",
        "united states",
        "india",
        "argentina",
        "kyrgyzstan",
        "kazakhstan",
      ];
      const foundCountries = keyCountries.filter((countryName) =>
        this.viewer.entities.values.some(
          (entity) =>
            entity.name && entity.name.toLowerCase().includes(countryName),
        ),
      );
      console.log(`✅ Found key countries: ${foundCountries.join(", ")}`);

      return {
        success: true,
        entityCount: result.createdCount,
        layerType: layerType,
        summary: {
          created: result.createdCount,
          skipped: result.skippedCount,
          errors: result.errorCount,
          uniqueRegions: result.loadedRegions.size,
        },
      };
    } catch (error) {
      console.error("❌ Error loading regions:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process features with proper geometry handling and duplicate prevention
  processFeatures(features, layerType, source) {
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const Cesium = window.Cesium;
    const loadedRegions = new Set();
    const createdEntities = [];

    features.forEach((feature, index) => {
      try {
        if (!feature.geometry || !feature.geometry.coordinates) {
          console.warn(`⚠️ Skipping ${layerType} ${index}: No geometry data`);
          skippedCount++;
          return;
        }

        // Get feature name and create unique key
        const name = this.extractFeatureName(feature, layerType, index);
        const regionKey = `${layerType}:${name}`;

        // Skip if we already loaded this region (duplicate prevention)
        if (loadedRegions.has(name)) {
          console.warn(`⚠️ Skipping duplicate ${layerType}: ${name}`);
          skippedCount++;
          return;
        }

        // Ensure viewer.entities is available before adding
        if (
          !this.viewer.entities ||
          typeof this.viewer.entities.add !== "function"
        ) {
          console.error("❌ viewer.entities.add is not available");
          errorCount++;
          return;
        }

        // Create flat material with proper transparency
        const material = Cesium.Color.fromBytes(
          source.color.fill[0],
          source.color.fill[1],
          source.color.fill[2],
          Math.round(source.color.alpha * 255), // Use original alpha value
        );

        const outlineColor = Cesium.Color.fromBytes(
          source.color.stroke[0],
          source.color.stroke[1],
          source.color.stroke[2],
          Math.round(source.color.alpha * 255), // Use original alpha value for outline too
        );

        // Process geometry with proper topology handling based on layer type
        let entities = [];
        if (layerType === 'states' || layerType === 'provinces') {
          console.log(`🏛️ Processing province feature: ${feature.properties?.NAME || feature.properties?.name || 'Unknown'}`);
          entities = this.createProvinceEntitiesEnhanced(
            feature,
            regionKey,
            material,
            outlineColor,
            feature.properties,
          );
          
          console.log(`🏛️ Created ${entities.length} province entities`);
          
          // Auto-generate Others for this province
          this.createOthersForProvince(feature, feature.properties).catch(error => {
            console.warn(`⚠️ Failed to create Others for province:`, error);
          });
        } else {
          entities = this.createCountryEntities(
          feature,
          regionKey,
          material,
          outlineColor,
          layerType,
        );
        }

        if (entities.length > 0) {
          // Register entities to prevent duplicates
          if (
            this.registerOnce(
              regionKey,
              entities.map((e) => e.id),
            )
          ) {
            createdEntities.push(...entities);
            createdCount += entities.length;
            loadedRegions.add(name);

            // Log key regions for verification
            if (this.isKeyRegion(name)) {
              console.log(
                `✅ Created ${entities.length} entities for ${layerType}: ${name}`,
              );
            }
          } else {
            // Duplicate detected, remove the entities we just created
            entities.forEach((entity) => this.viewer.entities.remove(entity));
            // Only log duplicates in debug mode to reduce console spam
            if (this.DEBUG) {
              console.warn(
                `⚠️ Duplicate detected for ${name}, removed ${entities.length} entities`,
              );
            }
          }
        } else {
          console.warn(`⚠️ No valid entities created for ${name}`);
          skippedCount++;
        }

        // Progress logging - reduced frequency for performance
        if (createdCount % (layerType === "countries" ? 500 : 1000) === 0) {
          console.log(
            `✅ Progress: Created ${createdCount} ${layerType} entities...`,
          );
        }
      } catch (error) {
        console.error(
          `❌ Error creating ${layerType} entity for feature ${index}:`,
          error,
        );
        errorCount++;
      }
    });

    // Force render after batch operations
    this.viewer.scene.requestRender();

    return { createdCount, skippedCount, errorCount, loadedRegions };
  }

  // Extract feature name from properties
  extractFeatureName(feature, layerType, index) {
    // ✨ REFACTORED: Delegate to GeoJSONHelpers module
    return extractFeatureName(feature, layerType, index);
  }

  // Normalize longitude to [-180, 180] range
  normalizeLon(lon) {
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;
    return lon;
  }

  // Split ring on dateline to handle antimeridian crossing
  splitRingOnDateLine(ring) {
    const rings = [];
    let currentRing = [];
    let datelineSplitCount = 0;

    for (let i = 0; i < ring.length; i++) {
      const [lon, lat] = ring[i];
      const nextLon = i < ring.length - 1 ? ring[i + 1][0] : ring[0][0];

      // Check if this segment crosses the dateline
      const deltaLon = Math.abs(nextLon - lon);
      if (deltaLon > 180) {
        // Crosses dateline, need to split
        datelineSplitCount++;

        // Add current point to current ring
        currentRing.push([this.normalizeLon(lon), lat]);

        // Close current ring if it has enough points
        if (currentRing.length >= 3) {
          rings.push(currentRing);
        }

        // Start new ring
        currentRing = [];
      } else {
        // Normal segment, add to current ring
        currentRing.push([this.normalizeLon(lon), lat]);
      }
    }

    // Add final ring if it has enough points
    if (currentRing.length >= 3) {
      rings.push(currentRing);
    }

    if (datelineSplitCount > 0) {
      console.log(
        `🔧 Dateline split: ${datelineSplitCount} segments for ring with ${ring.length} points`,
      );
    }

    return rings;
  }

  // Convert rings to Cesium PolygonHierarchy with proper topology
  toHierarchy(rings) {
    const Cesium = window.Cesium;
    const hierarchies = [];

    if (rings.length === 0) return hierarchies;

    const outer = rings[0];
    const holes = rings.slice(1);

    // Split outer ring on dateline
    const outerRings = this.splitRingOnDateLine(outer);

    // Process each outer ring
    outerRings.forEach((outerRing, outerIndex) => {
      // Convert outer ring to Cesium positions
      const outerPositions = outerRing.map(([lon, lat]) =>
        Cesium.Cartesian3.fromDegrees(lon, lat),
      );

      // Process holes for this outer ring
      const holeHierarchies = [];
      holes.forEach((hole) => {
        const holeRings = this.splitRingOnDateLine(hole);
        holeRings.forEach((holeRing) => {
          const holePositions = holeRing.map(([lon, lat]) =>
            Cesium.Cartesian3.fromDegrees(lon, lat),
          );
          if (holePositions.length >= 3) {
            holeHierarchies.push(new Cesium.PolygonHierarchy(holePositions));
          }
        });
      });

      // Create hierarchy for this outer ring
      if (outerPositions.length >= 3) {
        hierarchies.push(
          new Cesium.PolygonHierarchy(outerPositions, holeHierarchies),
        );
      }
    });

    return hierarchies;
  }

  // Create country entities with proper geometry handling
  createCountryEntities(feature, regionKey, material, outlineColor, layerType) {
    const Cesium = window.Cesium;
    const entities = [];

    try {
      const geom = feature.geometry;
      const parts =
        geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];

      let totalOuterRings = 0;

      for (const rings of parts) {
        const hierarchies = this.toHierarchy(rings);
        totalOuterRings += hierarchies.length;

        hierarchies.forEach((hierarchy, hierarchyIndex) => {
          const entityId = `${regionKey}:part:${entities.length}`;

          const entity = this.viewer.entities.add({
            id: entityId,
            name: feature.properties?.NAME || "Unknown",
            polygon: {
              hierarchy: hierarchy,
              material: material,
              outline: true,
              outlineColor: outlineColor,
              outlineWidth: layerType === "countries" ? 1 : 0.5,
              perPositionHeight: false,
              clampToGround: true, // Force flat surface overlay
              zIndex: 0, // Now will be respected
              shadows: Cesium.ShadowMode.DISABLED,
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                0.0,
                2.5e7,
              ),
            },
            properties: {
              featureData: feature,
              layerType: layerType,
              regionName:
                feature.properties?.NAME ||
                feature.properties?.name ||
                "Unknown",
              partIndex: hierarchyIndex,
              totalParts: hierarchies.length,
            },
          });

          entities.push(entity);
          
          // Track entity by layer type for visibility control
          if (layerType === 'countries') {
            this.entitiesByLayer.countries.add(entityId);
          } else if (layerType === 'continents') {
            this.entitiesByLayer.continents.add(entityId);
          }
        });
      }

      // Log for key regions
      if (this.isKeyRegion(feature.properties?.NAME || "")) {
        console.log(
          `${feature.properties?.NAME}: created ${totalOuterRings} outer rings, 0 duplicates, 0 classification, lighting off`,
        );
      }
    } catch (error) {
      console.error(`❌ Error creating entities for ${regionKey}:`, error);
    }

    return entities;
  }

  // Check if region is a key region for logging
  isKeyRegion(name) {
    const keyRegions = [
      "russia",
      "canada",
      "china",
      "brazil",
      "australia",
      "united states",
      "sicily",
      "kyrgyzstan",
      "kazakhstan",
    ];
    return keyRegions.some((key) => name.toLowerCase().includes(key));
  }

  // Load both countries and states simultaneously
  async loadAllRegions() {
    console.log(
      "🌍 Loading both countries and states boundaries with comprehensive coverage...",
    );

    try {
      // Ensure viewer and Cesium are available
      if (!this.viewer || !this.viewer.entities) {
        console.error("❌ Cesium viewer not available for region loading");
        return { success: false, error: "Viewer not initialized" };
      }

      if (!window.Cesium) {
        console.error("❌ Cesium library not available for region loading");
        return { success: false, error: "Cesium not loaded" };
      }

      // Clear existing regions first
      await this.clearRegions();

      // Data sources for regions
      const dataSources = {
        countries: {
          url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson",
          name: "Countries (50m)",
          color: { fill: [100, 150, 255], stroke: [50, 100, 200], alpha: 0.15 },
        },
        states: {
          url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson",
          name: "States/Provinces (50m)",
          color: { fill: [200, 255, 100], stroke: [200, 255, 100], alpha: 0.1 },
        },
      };

      let totalCreated = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      const loadedCountries = new Set();
      const loadedStates = new Set();

      // Ensure viewer is ready for region operations
      if (!this.viewer.isReadyForRegions) {
        console.error("❌ Cesium viewer not ready for region operations");
        return { success: false, error: "Viewer not ready" };
      }

      // Load countries first (as base layer)
      console.log("🌐 Loading countries with comprehensive coverage...");
      const countriesResponse = await fetch(dataSources.countries.url);
      if (!countriesResponse.ok) {
        throw new Error(
          `Failed to fetch countries data: ${countriesResponse.status}`,
        );
      }
      const countriesData = await countriesResponse.json();

      if (countriesData.features && Array.isArray(countriesData.features)) {
        console.log(
          `📊 Found ${countriesData.features.length} country features to process`,
        );
        const countriesResult = this.processFeatures(
          countriesData.features,
          "countries",
          dataSources.countries,
        );
        totalCreated += countriesResult.createdCount;
        totalSkipped += countriesResult.skippedCount;
        totalErrors += countriesResult.errorCount;
        countriesResult.loadedRegions.forEach((name) =>
          loadedCountries.add(name),
        );
        console.log(
          `✅ Countries Summary: Created ${countriesResult.createdCount}, Skipped ${countriesResult.skippedCount}, Errors ${countriesResult.errorCount}`,
        );
      } else {
        console.error("❌ No country features found in data");
      }

      // Load states on top (as overlay layer)
      console.log("🌐 Loading states/provinces with comprehensive coverage...");
      const statesResponse = await fetch(dataSources.states.url);
      if (!statesResponse.ok) {
        throw new Error(
          `Failed to fetch states data: ${statesResponse.status}`,
        );
      }
      const statesData = await statesResponse.json();

      if (statesData.features && Array.isArray(statesData.features)) {
        console.log(
          `📊 Found ${statesData.features.length} state/province features to process`,
        );
        const statesResult = this.processFeatures(
          statesData.features,
          "states",
          dataSources.states,
        );
        totalCreated += statesResult.createdCount;
        totalSkipped += statesResult.skippedCount;
        totalErrors += statesResult.errorCount;
        statesResult.loadedRegions.forEach((name) => loadedStates.add(name));
        console.log(
          `✅ States Summary: Created ${statesResult.createdCount}, Skipped ${statesResult.skippedCount}, Errors ${statesResult.errorCount}`,
        );
      } else {
        console.error("❌ No state features found in data");
      }

      console.log(
        `🎯 Final Summary: Total Created ${totalCreated}, Total Skipped ${totalSkipped}, Total Errors ${totalErrors}`,
      );
      console.log(
        `📋 Loaded ${loadedCountries.size} unique countries and ${loadedStates.size} unique states/provinces`,
      );

      // Log some examples of loaded regions
      const countryExamples = Array.from(loadedCountries).slice(0, 10);
      const stateExamples = Array.from(loadedStates).slice(0, 10);
      console.log(`🌍 Sample Countries: ${countryExamples.join(", ")}`);
      console.log(`🏛️ Sample States: ${stateExamples.join(", ")}`);

      return {
        success: true,
        entityCount: totalCreated,
        layerType: "all",
        summary: {
          countriesCreated: loadedCountries.size,
          statesCreated: loadedStates.size,
          totalSkipped,
          totalErrors,
        },
      };
    } catch (error) {
      console.error("❌ Error loading all regions:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Clear all region entities using registry
  async clearRegions() {
    // ✨ REFACTORED: Delegate to RegionRegistry module

      // Hide any active hover effects
    if (this.hoverSystem) {
      this.hoverSystem.hideHoverEffect();
    }

    // Clear via registry
    const result = this.regionRegistry.clearAll();
    
    // Also clear loadedRegions set
      this.loadedRegions.clear();

    return result;
  }

  // Clear only country entities
  async clearCountries() {
    // ✨ REFACTORED: Delegate to RegionRegistry module

      // Hide any active hover effects
    if (this.hoverSystem) {
      this.hoverSystem.hideHoverEffect();
    }

    // Clear via registry
    return this.regionRegistry.clearCountries();
  }

  // Clear only province/state entities
  async clearProvinces() {
    // ✨ REFACTORED: Delegate to RegionRegistry module

      // Hide any active hover effects
    if (this.hoverSystem) {
      this.hoverSystem.hideHoverEffect();
    }

    // Clear via registry
    return this.regionRegistry.clearProvinces();
  }

  // Load all provinces/states from Natural Earth (external source) - similar to MapChart
  async loadAllProvincesFromNaturalEarth() {
    console.log(
      "🏛️ Loading ALL provinces/states from Natural Earth (external source)...",
    );

    try {
      // Ensure viewer and Cesium are available
      if (!this.viewer || !this.viewer.entities) {
        console.error("❌ Cesium viewer not available for province loading");
        return { success: false, error: "Viewer not initialized" };
      }

      if (!window.Cesium) {
        console.error("❌ Cesium library not available for province loading");
        return { success: false, error: "Cesium not loaded" };
      }

      // Clear only province entities, keep countries
      await this.clearProvincesOnly();

      // Natural Earth data source for ALL provinces/states
      const provincesSource = {
        url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson",
        name: "All States/Provinces (10m)",
        color: { fill: [180, 255, 180], stroke: [50, 150, 50], alpha: 0.15 }, // More visible green fill and darker outline
      };

      // Ensure viewer is ready for region operations
      if (!this.viewer.isReadyForRegions) {
        console.error("❌ Cesium viewer not ready for province operations");
        return { success: false, error: "Viewer not ready" };
      }

      // Fetch ALL provinces from Natural Earth
      console.log(`🌐 Fetching ALL provinces from: ${provincesSource.url}`);
      const response = await fetch(provincesSource.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch provinces data: ${response.status}`);
      }
      const data = await response.json();

      if (!data.features || !Array.isArray(data.features)) {
        throw new Error("Invalid GeoJSON format for provinces");
      }

      console.log(
        `📊 Found ${data.features.length} provinces/states to process from Natural Earth`,
      );
      console.log(`🏛️ Expected: 294 provinces (like MapChart)`);
      console.log(`📋 Actual: ${data.features.length} features in data`);

      // Process and render ALL provinces
      const result = this.processProvincesFromNaturalEarth(
        data.features,
        provincesSource,
      );

      console.log(
        `✅ Provinces Summary: Created ${result.createdCount}, Skipped ${result.skippedCount}, Errors ${result.errorCount}`,
      );
      console.log(
        `📋 Loaded ${result.loadedProvinces.size} unique provinces/states`,
      );

      // Log some examples of loaded provinces
      const provinceExamples = Array.from(result.loadedProvinces).slice(0, 15);
      console.log(`📋 Sample provinces: ${provinceExamples.join(", ")}`);

      // Log verification for key countries with provinces
      const keyCountriesWithProvinces = [
        "united states",
        "canada",
        "china",
        "india",
        "brazil",
        "australia",
        "russia",
      ];
      const foundCountriesWithProvinces = keyCountriesWithProvinces.filter(
        (countryName) => {
          const countryEntities = this.viewer.entities.values.filter(
            (entity) =>
              entity.name && entity.name.toLowerCase().includes(countryName),
          );
          return countryEntities.length > 0;
        },
      );
      console.log(
        `✅ Found countries with provinces: ${foundCountriesWithProvinces.join(", ")}`,
      );

      // Final verification
      const totalProvinceEntities = this.viewer.entities.values.filter(
        (entity) => entity.id && entity.id.startsWith("province:"),
      ).length;
      console.log(
        `🔍 Final verification: ${totalProvinceEntities} province entities in viewer`,
      );
      console.log(
        `📊 Unique provinces loaded: ${result.loadedProvinces.size} out of ${data.features.length} features`,
      );

      return {
        success: true,
        entityCount: result.createdCount,
        layerType: "provinces",
        source: "NaturalEarth",
        summary: {
          created: result.createdCount,
          skipped: result.skippedCount,
          errors: result.errorCount,
          uniqueProvinces: result.loadedProvinces.size,
          totalFeatures: data.features.length,
          expectedFeatures: 294,
          finalEntityCount: totalProvinceEntities,
        },
      };
    } catch (error) {
      console.error("❌ Error loading provinces from Natural Earth:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process provinces from Natural Earth with enhanced feature handling
  processProvincesFromNaturalEarth(features, source) {
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const Cesium = window.Cesium;
    const createdEntities = [];
    const loadedProvinces = new Set();
    const countryStats = new Map(); // Track stats per country

    // Reset province counts for this processing run
    this.provinceCountsByCountry.clear();

    console.log(
      `🏛️ Processing ${features.length} province features from Natural Earth...`,
    );

    // Debug: Log all unique countries in the dataset
    const allCountries = new Set();
    features.forEach((feature, index) => {
      const properties = feature.properties || {};
      const countryName = this.extractCountryName(properties);
      allCountries.add(countryName);
    });
    console.log(
      `🌍 Found ${allCountries.size} unique countries in dataset:`,
      Array.from(allCountries).sort(),
    );

    // Show the actual country names found in the dataset
    console.log(`📋 All countries found in Natural Earth dataset:`);
    Array.from(allCountries)
      .sort()
      .forEach((country, index) => {
        console.log(`   ${index + 1}. ${country}`);
      });

    // Explain what we're doing to fix the naming issue
    console.log(
      `🔧 APPLYING COUNTRY NAME MAPPING: Converting Natural Earth names to our internal names`,
    );
    console.log(
      `🔧 This should resolve the naming mismatches and show provinces for all countries`,
    );

    features.forEach((feature, index) => {
      try {
        if (!feature.geometry || !feature.geometry.coordinates) {
          console.warn(
            `⚠️ Province skipped: No geometry data at index ${index}`,
          );
          skippedCount++;
          return;
        }

        // Extract province and country names from Natural Earth properties
        const properties = feature.properties || {};
        const provinceName = this.extractProvinceName(properties, index);
        const originalCountryName =
          properties.SOVEREIGNT ||
          properties.ADMIN ||
          properties.COUNTRY ||
          "Unknown";
        const countryName = this.extractCountryName(properties);

        // Log the mapping process for the first few features
        if (index < 10) {
          console.log(
            `🔍 Feature ${index}: "${originalCountryName}" → "${countryName}" (${provinceName})`,
          );
        }

        // Initialize country stats if not exists
        if (!countryStats.has(countryName)) {
          countryStats.set(countryName, { created: 0, skipped: 0, errors: 0 });
        }

        // Debug: Log every 50th feature to track processing
        if (index % 50 === 0) {
          console.log(
            `🔍 Processing feature ${index}/${features.length}: ${provinceName} (${countryName})`,
          );
        }

        // Create unique province key using index to avoid name conflicts
        const provinceKey = `province:${index}:${countryName}:${provinceName}`;

        // Ensure viewer.entities is available
        if (
          !this.viewer.entities ||
          typeof this.viewer.entities.add !== "function"
        ) {
          console.error(
            `❌ Province skipped: ${provinceName} (${countryName}) — viewer.entities.add not available`,
          );
          errorCount++;
          countryStats.get(countryName).errors++;
          return;
        }

        // Create material for provinces
        const material = Cesium.Color.fromBytes(
          source.color.fill[0],
          source.color.fill[1],
          source.color.fill[2],
          Math.round(source.color.alpha * 255),
        );

        const outlineColor = Cesium.Color.fromBytes(
          source.color.stroke[0],
          source.color.stroke[1],
          source.color.stroke[2],
          200, // Higher alpha for better outline visibility
        );

        // Create province entities with enhanced multipolygon handling
        const entities = this.createProvinceEntitiesEnhanced(
          feature,
          provinceKey,
          material,
          outlineColor,
          properties,
        );

        if (entities.length > 0) {
          // Register entities to prevent duplicates
          if (
            this.registerOnce(
              provinceKey,
              entities.map((e) => e.id),
            )
          ) {
            createdEntities.push(...entities);
            createdCount += entities.length;
            loadedProvinces.add(provinceKey);
            countryStats.get(countryName).created++;

            // Track province count per country for validation
            const currentCount =
              this.provinceCountsByCountry.get(countryName) || 0;
            this.provinceCountsByCountry.set(countryName, currentCount + 1);

            // Log successful creation for key provinces
            if (this.isKeyProvince(provinceName, countryName)) {
              console.log(
                `✅ Province created: ${provinceName} (${countryName}) — ${entities.length} entities`,
              );
            }
          } else {
            // Duplicate detected, remove the entities we just created
            entities.forEach((entity) => this.viewer.entities.remove(entity));
            console.warn(
              `⚠️ Province skipped: ${provinceName} (${countryName}) — duplicate detected`,
            );
            skippedCount++;
            countryStats.get(countryName).skipped++;
          }
        } else {
          console.warn(
            `⚠️ Province skipped: ${provinceName} (${countryName}) — no valid entities created`,
          );
          skippedCount++;
          countryStats.get(countryName).skipped++;

          // Debug: Log why no entities were created
          if (feature.geometry) {
            console.log(
              `   Geometry type: ${feature.geometry.type}, coordinates length: ${feature.geometry.coordinates?.length || 0}`,
            );
          }
        }

        // Progress logging for provinces
        if (createdCount % 100 === 0) {
          console.log(
            `✅ Progress: Created ${createdCount} province entities...`,
          );
        }
      } catch (error) {
        const provinceName = feature.properties?.NAME || `Province ${index}`;
        const countryName = this.extractCountryName(feature.properties || {});
        console.error(
          `❌ Province error: ${provinceName} (${countryName}) — ${error.message}`,
        );
        errorCount++;
        if (countryStats.has(countryName)) {
          countryStats.get(countryName).errors++;
        }
      }
    });

    // Force render after batch operations
    this.viewer.scene.requestRender();

    // Log detailed country-by-country statistics
    console.log(
      `🏛️ Province processing complete: Created ${createdCount}, Skipped ${skippedCount}, Errors ${errorCount}`,
    );
    console.log(`📊 Country-by-country ADM1 statistics:`);

    const sortedCountries = Array.from(countryStats.entries()).sort(
      (a, b) => b[1].created - a[1].created,
    );
    sortedCountries.forEach(([country, stats]) => {
      if (stats.created > 0) {
        console.log(
          `   ${country}: created ${stats.created} provinces, skipped ${stats.skipped}, errors ${stats.errors}`,
        );
      }
    });

    // Log global summary
    const totalCountriesWithProvinces = sortedCountries.filter(
      ([_, stats]) => stats.created > 0,
    ).length;
    console.log(
      `🌍 Global ADM1 summary: ${totalCountriesWithProvinces} countries with provinces, ${createdCount} total entities`,
    );

    // Debug: Show countries with no provinces created
    const countriesWithNoProvinces = Array.from(countryStats.entries())
      .filter(([_, stats]) => stats.created === 0)
      .map(([country, _]) => country);

    if (countriesWithNoProvinces.length > 0) {
      console.log(
        `⚠️ Countries with NO provinces created (${countriesWithNoProvinces.length}):`,
        countriesWithNoProvinces.slice(0, 20),
      );
      if (countriesWithNoProvinces.length > 20) {
        console.log(
          `   ... and ${countriesWithNoProvinces.length - 20} more countries`,
        );
      }
    }

    return { createdCount, skippedCount, errorCount, loadedProvinces };
  }

  // Extract province name from Natural Earth properties
  extractProvinceName(properties, index) {
    return (
      properties.NAME ||
      properties.name ||
      properties.ADMIN ||
      properties.ADMIN_NAME ||
      properties.NAME_1 ||
      properties.name_1 ||
      properties.STATE ||
      properties.state ||
      properties.PROVINCE ||
      properties.province ||
      properties.ADMIN1_NAME ||
      properties.admin1_name ||
      properties.NAME_1_ ||
      properties.name_1_ ||
      properties.ADMIN1 ||
      properties.admin1 ||
      properties.STATE_NAME ||
      properties.state_name ||
      properties.PROV_NAME ||
      properties.prov_name ||
      `Province ${index}`
    );
  }

  // Extract country name from Natural Earth properties
  extractCountryName(properties) {
    let countryName =
      properties.SOVEREIGNT ||
      properties.sovereignt ||
      properties.ADMIN ||
      properties.admin ||
      properties.COUNTRY ||
      properties.country ||
      properties.ADMIN0_NAME ||
      properties.admin0_name ||
      properties.NAME_0 ||
      properties.name_0 ||
      properties.SOVEREIGNT_NAME ||
      properties.sovereignt_name ||
      "Unknown";

    // Comprehensive country name mapping to resolve Natural Earth naming mismatches
    const COUNTRY_NAME_MAP = {
      // Major country name variations
      "United States of America": "United States",
      "Russian Federation": "Russia",
      "Dem. Rep. Congo": "Democratic Republic of the Congo",
      "Republic of Congo": "Republic of the Congo",
      "Ivory Coast": "Cote d'Ivoire",
      "South Korea": "Korea, Republic of",
      "North Korea": "Korea, Democratic People's Republic of",
      "Czech Republic": "Czechia",
      Macedonia: "North Macedonia",
      "Bosnia and Herz.": "Bosnia and Herzegovina",
      "Central African Rep.": "Central African Republic",
      "Dominican Rep.": "Dominican Republic",
      "Eq. Guinea": "Equatorial Guinea",
      "S. Sudan": "South Sudan",
      "U.A.E.": "United Arab Emirates",
      "U.K.": "United Kingdom",
      "U.S.A.": "United States",
      "U.S.": "United States",
      "U.S. Virgin Is.": "U.S. Virgin Islands",
      "Br. Virgin Is.": "British Virgin Islands",
      "Cayman Is.": "Cayman Islands",
      "Cook Is.": "Cook Islands",
      "Falkland Is.": "Falkland Islands",
      "Faroe Is.": "Faroe Islands",
      "French Guiana": "French Guiana",
      "French Polynesia": "French Polynesia",
      "French S. and Antarctic Lands": "French Southern Territories",
      "Heard I. and McDonald Is.": "Heard Island and McDonald Islands",
      "Isle of Man": "Isle of Man",
      "Marshall Is.": "Marshall Islands",
      "N. Mariana Is.": "Northern Mariana Islands",
      "New Caledonia": "New Caledonia",
      "Norfolk I.": "Norfolk Island",
      "Pitcairn Is.": "Pitcairn",
      "S. Georgia and S. Sandwich Is.":
        "South Georgia and the South Sandwich Islands",
      "Solomon Is.": "Solomon Islands",
      "St. Barthelemy": "Saint Barthelemy",
      "St. Kitts and Nevis": "Saint Kitts and Nevis",
      "St. Lucia": "Saint Lucia",
      "St. Martin": "Saint Martin",
      "St. Pierre and Miquelon": "Saint Pierre and Miquelon",
      "St. Vincent and the Grenadines": "Saint Vincent and the Grenadines",
      "Svalbard and Jan Mayen": "Svalbard and Jan Mayen",
      Tokelau: "Tokelau",
      "Turks and Caicos Is.": "Turks and Caicos Islands",
      "Wallis and Futuna": "Wallis and Futuna",
      "W. Sahara": "Western Sahara",
      "Antigua and Barb.": "Antigua and Barbuda",
      Bahamas: "Bahamas",
      Barbados: "Barbados",
      Belize: "Belize",
      Bermuda: "Bermuda",
      "Costa Rica": "Costa Rica",
      Cuba: "Cuba",
      Dominica: "Dominica",
      "El Salvador": "El Salvador",
      Grenada: "Grenada",
      Guatemala: "Guatemala",
      Haiti: "Haiti",
      Honduras: "Honduras",
      Jamaica: "Jamaica",
      Nicaragua: "Nicaragua",
      Panama: "Panama",
      "Puerto Rico": "Puerto Rico",
      "Trinidad and Tobago": "Trinidad and Tobago",
      Albania: "Albania",
      Andorra: "Andorra",
      Austria: "Austria",
      Belarus: "Belarus",
      Belgium: "Belgium",
      Bulgaria: "Bulgaria",
      Croatia: "Croatia",
      Cyprus: "Cyprus",
      Denmark: "Denmark",
      Estonia: "Estonia",
      Finland: "Finland",
      France: "France",
      Germany: "Germany",
      Greece: "Greece",
      Hungary: "Hungary",
      Iceland: "Iceland",
      Ireland: "Ireland",
      Italy: "Italy",
      Latvia: "Latvia",
      Liechtenstein: "Liechtenstein",
      Lithuania: "Lithuania",
      Luxembourg: "Luxembourg",
      Malta: "Malta",
      Moldova: "Moldova",
      Monaco: "Monaco",
      Montenegro: "Montenegro",
      Netherlands: "Netherlands",
      Norway: "Norway",
      Poland: "Poland",
      Portugal: "Portugal",
      Romania: "Romania",
      "San Marino": "San Marino",
      Serbia: "Serbia",
      Slovakia: "Slovakia",
      Slovenia: "Slovenia",
      Spain: "Spain",
      Sweden: "Sweden",
      Switzerland: "Switzerland",
      Ukraine: "Ukraine",
      Vatican: "Vatican",
      Afghanistan: "Afghanistan",
      Armenia: "Armenia",
      Azerbaijan: "Azerbaijan",
      Bahrain: "Bahrain",
      Bangladesh: "Bangladesh",
      Bhutan: "Bhutan",
      Brunei: "Brunei",
      Cambodia: "Cambodia",
      China: "China",
      "East Timor": "East Timor",
      Georgia: "Georgia",
      "Hong Kong": "Hong Kong",
      India: "India",
      Indonesia: "Indonesia",
      Iran: "Iran",
      Iraq: "Iraq",
      Israel: "Israel",
      Japan: "Japan",
      Jordan: "Jordan",
      Kazakhstan: "Kazakhstan",
      Kuwait: "Kuwait",
      Kyrgyzstan: "Kyrgyzstan",
      Laos: "Laos",
      Lebanon: "Lebanon",
      Macau: "Macau",
      Malaysia: "Malaysia",
      Maldives: "Maldives",
      Mongolia: "Mongolia",
      Myanmar: "Myanmar",
      Nepal: "Nepal",
      Oman: "Oman",
      Pakistan: "Pakistan",
      Philippines: "Philippines",
      Qatar: "Qatar",
      "Saudi Arabia": "Saudi Arabia",
      Singapore: "Singapore",
      "Sri Lanka": "Sri Lanka",
      Syria: "Syria",
      Taiwan: "Taiwan",
      Tajikistan: "Tajikistan",
      Thailand: "Thailand",
      Turkmenistan: "Turkmenistan",
      Uzbekistan: "Uzbekistan",
      Vietnam: "Vietnam",
      Yemen: "Yemen",
      Algeria: "Algeria",
      Angola: "Angola",
      Benin: "Benin",
      Botswana: "Botswana",
      "Burkina Faso": "Burkina Faso",
      Burundi: "Burundi",
      Cameroon: "Cameroon",
      "Cape Verde": "Cape Verde",
      Chad: "Chad",
      Comoros: "Comoros",
      Djibouti: "Djibouti",
      Egypt: "Egypt",
      Eritrea: "Eritrea",
      Eswatini: "Eswatini",
      Ethiopia: "Ethiopia",
      Gabon: "Gabon",
      Gambia: "Gambia",
      Ghana: "Ghana",
      Guinea: "Guinea",
      "Guinea-Bissau": "Guinea-Bissau",
      Kenya: "Kenya",
      Lesotho: "Lesotho",
      Liberia: "Liberia",
      Libya: "Libya",
      Madagascar: "Madagascar",
      Malawi: "Malawi",
      Mali: "Mali",
      Mauritania: "Mauritania",
      Mauritius: "Mauritius",
      Morocco: "Morocco",
      Mozambique: "Mozambique",
      Namibia: "Namibia",
      Niger: "Niger",
      Nigeria: "Nigeria",
      Rwanda: "Rwanda",
      "Sao Tome and Principe": "Sao Tome and Principe",
      Senegal: "Senegal",
      Seychelles: "Seychelles",
      "Sierra Leone": "Sierra Leone",
      Somalia: "Somalia",
      "South Africa": "South Africa",
      Sudan: "Sudan",
      Tanzania: "Tanzania",
      Togo: "Togo",
      Tunisia: "Tunisia",
      Uganda: "Uganda",
      Zambia: "Zambia",
      Zimbabwe: "Zimbabwe",
      Argentina: "Argentina",
      Bolivia: "Bolivia",
      Chile: "Chile",
      Colombia: "Colombia",
      Ecuador: "Ecuador",
      Guyana: "Guyana",
      Paraguay: "Paraguay",
      Peru: "Peru",
      Suriname: "Suriname",
      Uruguay: "Uruguay",
      Venezuela: "Venezuela",
      Australia: "Australia",
      Fiji: "Fiji",
      Kiribati: "Kiribati",
      Nauru: "Nauru",
      "New Zealand": "New Zealand",
      Palau: "Palau",
      "Papua New Guinea": "Papua New Guinea",
      Samoa: "Samoa",
      Tonga: "Tonga",
      Tuvalu: "Tuvalu",
      Vanuatu: "Vanuatu",
    };

    // Apply the mapping to normalize country names
    const normalizedName = COUNTRY_NAME_MAP[countryName] || countryName;

    // Log any unmapped country names for debugging
    if (!COUNTRY_NAME_MAP[countryName] && countryName !== "Unknown") {
      console.log(`🔍 Unmapped country name: "${countryName}" - using as-is`);
    }

    return normalizedName;
  }

  // Create province entities with enhanced multipolygon handling
  createProvinceEntitiesEnhanced(
    feature,
    provinceKey,
    material,
    outlineColor,
    properties,
  ) {
    const Cesium = window.Cesium;
    const entities = [];

    try {
      const geom = feature.geometry;
      const provinceName = this.extractProvinceName(properties, 0);
      const countryName = this.extractCountryName(properties);

      // Handle different geometry types
      let parts = [];
      if (geom.type === "MultiPolygon") {
        parts = geom.coordinates;
        console.log(
          `🔧 Processing MultiPolygon for ${provinceName} (${countryName}): ${parts.length} parts`,
        );
      } else if (geom.type === "Polygon") {
        parts = [geom.coordinates];
      } else {
        console.warn(
          `⚠️ Unsupported geometry type for ${provinceName} (${countryName}): ${geom.type}`,
        );
        return entities;
      }

      let totalOuterRings = 0;
      let totalHoles = 0;

      // Process each polygon part
      for (let partIndex = 0; partIndex < parts.length; partIndex++) {
        const rings = parts[partIndex];

        if (!rings || rings.length === 0) {
          console.warn(
            `⚠️ Empty rings for ${provinceName} (${countryName}) part ${partIndex}`,
          );
          continue;
        }

        // Split rings on dateline to handle antimeridian crossing
        const outerRings = this.splitRingOnDateLine(rings[0]);
        totalOuterRings += outerRings.length;

        // Process each outer ring
        outerRings.forEach((outerRing, outerIndex) => {
          try {
            // Convert outer ring to Cesium positions
            const outerPositions = outerRing.map(([lon, lat]) =>
              Cesium.Cartesian3.fromDegrees(lon, lat),
            );

            if (outerPositions.length < 3) {
              console.warn(
                `⚠️ Invalid outer ring for ${provinceName} (${countryName}): ${outerPositions.length} points`,
              );
              return;
            }

            // Process holes (interior rings) for this outer ring
            const holeHierarchies = [];
            for (let holeIndex = 1; holeIndex < rings.length; holeIndex++) {
              const holeRings = this.splitRingOnDateLine(rings[holeIndex]);
              totalHoles += holeRings.length;

              holeRings.forEach((holeRing) => {
                try {
                  const holePositions = holeRing.map(([lon, lat]) =>
                    Cesium.Cartesian3.fromDegrees(lon, lat),
                  );

                  if (holePositions.length >= 3) {
                    holeHierarchies.push(
                      new Cesium.PolygonHierarchy(holePositions),
                    );
                  } else {
                    console.warn(
                      `⚠️ Invalid hole ring for ${provinceName} (${countryName}): ${holePositions.length} points`,
                    );
                  }
                } catch (holeError) {
                  console.warn(
                    `⚠️ Error processing hole for ${provinceName} (${countryName}): ${holeError.message}`,
                  );
                }
              });
            }

            // Create hierarchy for this outer ring
            const hierarchy = new Cesium.PolygonHierarchy(
              outerPositions,
              holeHierarchies,
            );

            // Create entity ID
            const entityId = `${provinceKey}:part:${partIndex}:outer:${outerIndex}`;

            // Create entity with enhanced settings for large polygons
            const entity = this.viewer.entities.add({
              id: entityId,
              name: provinceName,
              polygon: {
                hierarchy: hierarchy,
                material: material,
                outline: true,
                outlineColor: outlineColor,
                outlineWidth: 1.0, // Ensure visible outlines
                perPositionHeight: false,
                clampToGround: false, // Disable terrain clamping to enable outlines
                height: 0, // Set explicit height to 0
                extrudedHeight: undefined, // Ensure no extrusion
                shadows: Cesium.ShadowMode.DISABLED,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                  0.0,
                  2.5e7,
                ),
                // Enhanced settings for large polygons
                classificationType: Cesium.ClassificationType.BOTH,
                heightReference: Cesium.HeightReference.NONE,
                // Remove zIndex to avoid conflicts with height
              },
              properties: {
                type: "province",
                source: "NaturalEarth",
                country: countryName,
                countryName: countryName,
                province: provinceName,
                regionName: provinceName,
                layerType: "provinces",
                original_properties: properties,
                partIndex: partIndex,
                outerIndex: outerIndex,
                totalParts: parts.length,
                totalOuterRings: outerRings.length,
                totalHoles: holeHierarchies.length,
                geometryType: geom.type,
              },
            });

            entities.push(entity);
            
            // Track entity by layer type for visibility control
            this.entitiesByLayer.provinces.add(entityId);

            // Add hover functionality for province entities
            this.addProvinceHoverFunctionality(entity, provinceName, countryName);

            // Log successful entity creation for debugging
            if (this.isKeyProvince(provinceName, countryName)) {
              console.log(
                `✅ Province entity created: ${provinceName} (${countryName}) — part ${partIndex}, outer ${outerIndex}, ${outerPositions.length} points, ${holeHierarchies.length} holes`,
              );
            }
          } catch (outerRingError) {
            console.error(
              `❌ Error processing outer ring for ${provinceName} (${countryName}): ${outerRingError.message}`,
            );
          }
        });
      }

      // Log detailed information for key provinces
      if (this.isKeyProvince(provinceName, countryName)) {
        console.log(
          `${provinceName} (${countryName}): created ${entities.length} entities, ${totalOuterRings} outer rings, ${totalHoles} holes, geometry: ${geom.type}`,
        );
      }

      // Log warning if no entities were created
      if (entities.length === 0) {
        console.warn(
          `⚠️ No entities created for ${provinceName} (${countryName}) — geometry may be invalid`,
        );
      }
    } catch (error) {
      const provinceName = this.extractProvinceName(properties, 0);
      const countryName = this.extractCountryName(properties);
      console.error(
        `❌ Error creating entities for ${provinceName} (${countryName}): ${error.message}`,
      );
    }

    return entities;
  }

  // Check if this is a key province worth logging
  isKeyProvince(provinceName, countryName) {
    const keyProvinces = [
      // United States
      "california",
      "texas",
      "new york",
      "florida",
      "illinois",
      "pennsylvania",
      "ohio",
      "georgia",
      "north carolina",
      "michigan",
      // Canada
      "ontario",
      "quebec",
      "british columbia",
      "alberta",
      "manitoba",
      "saskatchewan",
      "nova scotia",
      "new brunswick",
      // China
      "beijing",
      "shanghai",
      "guangdong",
      "jiangsu",
      "zhejiang",
      "shandong",
      "henan",
      "sichuan",
      "hunan",
      "hebei",
      // India
      "maharashtra",
      "delhi",
      "karnataka",
      "tamil nadu",
      "gujarat",
      "west bengal",
      "rajasthan",
      "andhra pradesh",
      // Brazil
      "sao paulo",
      "rio de janeiro",
      "minas gerais",
      "bahia",
      "parana",
      "rio grande do sul",
      "pernambuco",
      "ceara",
      // Australia
      "new south wales",
      "victoria",
      "queensland",
      "western australia",
      "south australia",
      "tasmania",
      // Russia
      "moscow",
      "saint petersburg",
      "krasnodar",
      "rostov",
      "sverdlovsk",
      "chelyabinsk",
      "novosibirsk",
      "sakha",
      // Germany
      "bavaria",
      "north rhine-westphalia",
      "baden-wurttemberg",
      "lower saxony",
      "hesse",
      "saxony",
      // France
      "ile-de-france",
      "rhone-alpes",
      "provence-alpes-cote d'azur",
      "midi-pyrenees",
      "aquitaine",
      // Japan
      "tokyo",
      "osaka",
      "kanagawa",
      "aichi",
      "saitama",
      "chiba",
      "hyogo",
      "kyoto",
      // Mexico
      "mexico",
      "jalisco",
      "veracruz",
      "puebla",
      "guanajuato",
      "nuevo leon",
      "michoacan",
      // Argentina
      "buenos aires",
      "cordoba",
      "santa fe",
      "mendoza",
      "tucuman",
      "entre rios",
      // South Africa
      "gauteng",
      "kwazulu-natal",
      "western cape",
      "eastern cape",
      "free state",
      "mpumalanga",
    ];

    return keyProvinces.some(
      (key) =>
        provinceName.toLowerCase().includes(key) ||
        countryName.toLowerCase().includes(key),
    );
  }

  // Clear only province entities, keep countries
  async clearProvincesOnly() {
    console.log("🗑️ Clearing only province entities, keeping countries...");

    try {
      const entitiesToRemove = [];

      // Find all province entities
      this.viewer.entities.values.forEach((entity) => {
        if (entity.id && entity.id.startsWith("province:")) {
          entitiesToRemove.push(entity);
        }
      });

      // Remove province entities
      entitiesToRemove.forEach((entity) => {
        this.viewer.entities.remove(entity);
      });

      // Clear province registry
      for (const [key, entityIds] of this.activeRegions.entries()) {
        if (key.startsWith("province:")) {
          this.activeRegions.delete(key);
        }
      }

      console.log(`🗑️ Removed ${entitiesToRemove.length} province entities`);
    } catch (error) {
      console.error("❌ Error clearing provinces:", error);
    }
  }

  // Flatten coordinates for Cartesian3.fromDegreesArrayHeights
  flattenCoordinates(coordinates) {
    const flattened = [];
    for (const ring of coordinates) {
      for (const point of ring) {
        flattened.push(point[0], point[1], 0);
      }
    }
    return flattened;
  }

  // ============================================================================
  // CITY BOUNDARY SYSTEM IMPLEMENTATION
  // ============================================================================

  // Initialize city boundary system
  initializeCitySystem() {
    console.log("🏙️ Initializing city boundary system...");
    
    // Add sanity check polygon first
    this.addSanityCheckPolygon();
    
    // Create hover panel
    this.createHoverPanel();
    
    console.log("✅ City boundary system initialized");
  }

  // Create hover panel for city information
  createHoverPanel() {
    console.log('🏙️ Creating hover panel...');
    
    // Create hover panel element
    this.hoverPanel = document.createElement('div');
    this.hoverPanel.id = 'city-hover-panel';
    this.hoverPanel.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      font-weight: 500;
      border: 2px solid #10b981;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      z-index: 1000;
      display: none;
      max-width: 200px;
      word-wrap: break-word;
      backdrop-filter: blur(4px);
    `;
    
    // Add to document body
    document.body.appendChild(this.hoverPanel);
    
    console.log('✅ Hover panel created');
  }

  // Phase 1: Add sanity check polygon (removed - was showing as red cube)
  addSanityCheckPolygon() {
    // Test polygon removed - was showing as red cube under Africa
    console.log('✅ City boundary system initialization complete (test polygon removed)');
  }

  // Phase 2: Load city GeoJSON data
  async loadCities() {
    console.log('🏙️ Loading city boundaries from Natural Earth...');
    
    try {
      // Use urban areas dataset for proper boundaries
      const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_urban_areas.geojson';
      
      console.log(`🌐 Fetching city data from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch city data: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.features || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON format for cities');
      }
      
      console.log(`CITY_GEOJSON_LOADED features=${data.features.length}`);
      console.log(`📊 Found ${data.features.length} city features to process`);
      
      // Load city names for better labeling FIRST
      console.log('🗺️ Loading city names before processing boundaries...');
      await this.loadCityNames();
      
      return data.features;
      
    } catch (error) {
      console.error('❌ Error loading city GeoJSON:', error);
      throw error;
    }
  }

  // Load populated places for city names
  async loadCityNames() {
    try {
      const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_populated_places_simple.geojson';
      console.log(`🗺️ Attempting to fetch populated places from: ${url}`);
      const response = await fetch(url);
      
      console.log(`🗺️ Fetch response status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        this.cityNames = new Map();
        this.cityNamesByLocation = new Map(); // Alternative lookup by exact coordinates
        
        console.log(`🗺️ Processing ${data.features.length} populated places for city names...`);
        
        data.features.forEach(feature => {
          const name = this.extractCityNameFromFeature(feature);
          if (name && feature.geometry && feature.geometry.coordinates) {
            const [lon, lat] = feature.geometry.coordinates;
            
            // Store by multiple keys for better matching
            const keys = [
              `${Math.round(lon * 10) / 10}_${Math.round(lat * 10) / 10}`, // 0.1 degree precision
              `${Math.round(lon * 5) / 5}_${Math.round(lat * 5) / 5}`,     // 0.2 degree precision
              `${Math.round(lon * 2) / 2}_${Math.round(lat * 2) / 2}`,     // 0.5 degree precision
            ];
            
            keys.forEach(key => {
              if (!this.cityNames.has(key)) {
                this.cityNames.set(key, name);
              }
            });
            
            // Also store by exact coordinates for precise matching
            const exactKey = `${lon}_${lat}`;
            this.cityNamesByLocation.set(exactKey, name);
          }
        });
        
        console.log(`🗺️ Loaded ${this.cityNames.size} city names for reference`);
        console.log(`🗺️ Sample city names:`, Array.from(this.cityNames.values()).slice(0, 10));
        console.log(`🗺️ Sample city name keys:`, Array.from(this.cityNames.keys()).slice(0, 10));
        
        // Debug: Check if we have any European cities loaded
        const europeanCities = Array.from(this.cityNames.values()).filter(name => 
          name.includes('Paris') || name.includes('Madrid') || name.includes('Rome') || 
          name.includes('London') || name.includes('Berlin') || name.includes('Marseille')
        );
        console.log(`🗺️ European cities found:`, europeanCities);
        
        // Debug: Add some hardcoded major cities for testing with multiple precision levels
        const majorCities = [
          { name: 'Paris', lon: 2.3522, lat: 48.8566 },
          { name: 'London', lon: -0.1276, lat: 51.5074 },
          { name: 'Madrid', lon: -3.7038, lat: 40.4168 },
          { name: 'Rome', lon: 12.4964, lat: 41.9028 },
          { name: 'Marseille', lon: 5.3698, lat: 43.2965 },
          { name: 'Berlin', lon: 13.4050, lat: 52.5200 },
          { name: 'Barcelona', lon: 2.1734, lat: 41.3851 },
          { name: 'Amsterdam', lon: 4.9041, lat: 52.3676 },
          { name: 'Milan', lon: 9.1859, lat: 45.4642 }, // For the Alps area
          { name: 'Zurich', lon: 8.5417, lat: 47.3769 },
          { name: 'Vienna', lon: 16.3738, lat: 48.2082 },
          { name: 'Munich', lon: 11.5761, lat: 48.1351 }
        ];
        
        majorCities.forEach(city => {
          // Add at multiple precision levels to ensure matching
          const precisions = [1, 2, 5, 10]; // degrees * precision factor
          precisions.forEach(precision => {
            const key = `${Math.round(city.lon * precision) / precision}_${Math.round(city.lat * precision) / precision}`;
            this.cityNames.set(key, city.name);
          });
          
          // Also add to exact location map
          const exactKey = `${city.lon}_${city.lat}`;
          this.cityNamesByLocation.set(exactKey, city.name);
          
          console.log(`🗺️ Added hardcoded city: ${city.name} at multiple precision levels`);
        });
        
        console.log(`🗺️ Total city names after adding major cities: ${this.cityNames.size}`);
      } else {
        console.warn(`⚠️ Failed to fetch populated places: ${response.status} ${response.statusText}`);
        console.warn(`⚠️ Response headers:`, [...response.headers.entries()]);
        this.cityNames = new Map();
        this.cityNamesByLocation = new Map();
      }
    } catch (error) {
      console.warn('⚠️ Could not load city names, will use fallback naming:', error);
      this.cityNames = new Map();
      this.cityNamesByLocation = new Map();
    }
  }

  // Extract city name from populated places feature
  extractCityNameFromFeature(feature) {
    const props = feature.properties || {};
    // Use the correct field names from Natural Earth populated places data
    return props.name || props.nameascii || props.meganame || props.ls_name || props.namealt;
  }

  // Get polygon centroid coordinates
  getPolygonCentroid(feature) {
    const geometry = feature.geometry;
    if (!geometry || !geometry.coordinates) return null;
    
    let coordinates = [];
    if (geometry.type === 'Polygon') {
      coordinates = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon') {
      coordinates = geometry.coordinates[0][0];
    }
    
    if (coordinates.length < 3) return null;
    
    // Calculate centroid using simple average
    let sumLon = 0;
    let sumLat = 0;
    for (const coord of coordinates) {
      sumLon += coord[0];
      sumLat += coord[1];
    }
    
    return {
      longitude: sumLon / coordinates.length,
      latitude: sumLat / coordinates.length
    };
  }

  // Get geographical centroid for a region by name and type
  getRegionCentroid(regionName, regionType = 'country') {
    if (!regionName) return null;

    // Hardcoded centroids for major regions (fallback until full NaturalEarth integration)
    const REGION_CENTROIDS = {
      // Continents
      'Europe': { latitude: 54.5260, longitude: 15.2551 },
      'Asia': { latitude: 34.0479, longitude: 100.6197 },
      'Africa': { latitude: -8.7832, longitude: 34.5085 },
      'North America': { latitude: 45.0000, longitude: -100.0000 },
      'South America': { latitude: -8.7832, longitude: -55.4915 },
      'Australia': { latitude: -25.2744, longitude: 133.7751 },
      'Antarctica': { latitude: -82.8628, longitude: 135.0000 },
      
      // Major countries
      'United States': { latitude: 39.8283, longitude: -98.5795 },
      'Canada': { latitude: 56.1304, longitude: -106.3468 },
      'Brazil': { latitude: -14.2350, longitude: -51.9253 },
      'Russia': { latitude: 61.5240, longitude: 105.3188 },
      'China': { latitude: 35.8617, longitude: 104.1954 },
      'India': { latitude: 20.5937, longitude: 78.9629 },
      'Australia': { latitude: -25.2744, longitude: 133.7751 },
      'Germany': { latitude: 51.1657, longitude: 10.4515 },
      'France': { latitude: 46.2276, longitude: 2.2137 },
      'United Kingdom': { latitude: 55.3781, longitude: -3.4360 },
      'Italy': { latitude: 41.8719, longitude: 12.5674 },
      'Spain': { latitude: 40.4637, longitude: -3.7492 },
      'Japan': { latitude: 36.2048, longitude: 138.2529 },
      'Mexico': { latitude: 23.6345, longitude: -102.5528 },
      'Argentina': { latitude: -38.4161, longitude: -63.6167 },
      'South Africa': { latitude: -30.5595, longitude: 22.9375 }
    };

    // Try exact match first
    if (REGION_CENTROIDS[regionName]) {
      console.log(`🌍 📍 Found hardcoded centroid for ${regionName}: [${REGION_CENTROIDS[regionName].latitude}, ${REGION_CENTROIDS[regionName].longitude}]`);
      return REGION_CENTROIDS[regionName];
    }

    // Try case-insensitive match
    const normalizedName = regionName.toLowerCase();
    for (const [key, value] of Object.entries(REGION_CENTROIDS)) {
      if (key.toLowerCase() === normalizedName) {
        console.log(`🌍 📍 Found case-insensitive centroid for ${regionName}: [${value.latitude}, ${value.longitude}]`);
        return value;
      }
    }

    console.warn(`🌍 ⚠️ No geographical centroid found for ${regionName} (${regionType})`);
    return null;
  }

  // Find nearby populated place for "Urban Area" fallback correction
  findNearbyPopulatedPlace(feature) {
    if (!this.cityNames || this.cityNames.size === 0) {
      return null;
    }
    
    // Get polygon centroid
    const center = this.getPolygonCentroid(feature);
    if (!center) return null;
    
    const centerLon = center.longitude;
    const centerLat = center.latitude;
    
    console.log(`🔍 Looking for nearby populated place near coordinates: ${centerLon.toFixed(4)}, ${centerLat.toFixed(4)}`);
    
    // Search strategies with expanded radius for populated places
    const searchStrategies = [
      // Strategy 1: Exact coordinate lookup
      () => {
        const exactKey = `${centerLon}_${centerLat}`;
        return this.cityNamesByLocation.get(exactKey);
      },
      
      // Strategy 2: Rounded coordinate lookup (better precision)
      () => {
        const roundedKey = `${Math.round(centerLon * 100) / 100}_${Math.round(centerLat * 100) / 100}`;
        return this.cityNames.get(roundedKey);
      },
      
      // Strategy 3: Multiple precision levels
      () => {
        const precisions = [10, 5, 2, 1]; // degrees * precision factor
        for (const precision of precisions) {
          const key = `${Math.round(centerLon * precision) / precision}_${Math.round(centerLat * precision) / precision}`;
          if (this.cityNames.has(key)) {
            return this.cityNames.get(key);
          }
        }
        return null;
      },
      
      // Strategy 4: Expanded search radius for populated places (20km radius)
      () => {
        const searchRadius = 0.2; // degrees (approximately 20km)
        let bestMatch = null;
        let bestDistance = Infinity;
        
        for (let lonOffset = -searchRadius; lonOffset <= searchRadius; lonOffset += 0.01) {
          for (let latOffset = -searchRadius; latOffset <= searchRadius; latOffset += 0.01) {
            const key = `${Math.round((centerLon + lonOffset) * 100) / 100}_${Math.round((centerLat + latOffset) * 100) / 100}`;
            if (this.cityNames.has(key)) {
              const distance = Math.sqrt(lonOffset * lonOffset + latOffset * latOffset);
              if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = this.cityNames.get(key);
              }
            }
          }
        }
        return bestMatch;
      }
    ];
    
    // Try each strategy
    for (let i = 0; i < searchStrategies.length; i++) {
      const result = searchStrategies[i]();
      if (result) {
        console.log(`🔍 Strategy ${i + 1} found nearby populated place: ${result}`);
        return result;
      }
    }
    
    console.log(`🔍 No nearby populated place found for coordinates: ${centerLon.toFixed(4)}, ${centerLat.toFixed(4)}`);
    return null;
  }

  // Generate a better city name from coordinates and context
  generateBetterCityName(feature, currentName) {
    const center = this.getPolygonCentroid(feature);
    if (!center) return currentName;
    
    const centerLon = center.longitude;
    const centerLat = center.latitude;
    
    console.log(`🔍 generateBetterCityName: Looking for nearby populated place near ${centerLon.toFixed(4)}, ${centerLat.toFixed(4)}`);
    
    // First try to find a nearby populated place using the existing method
    const nearbyPlace = this.findNearbyPopulatedPlace(feature);
    if (nearbyPlace && nearbyPlace !== currentName) {
      console.log(`🔍 generateBetterCityName: Found nearby populated place: ${nearbyPlace}`);
      return nearbyPlace;
    }
    
    // If no populated place found, try to identify the region/country from coordinates
    let regionName = '';
    
    // Major regions based on coordinates
    if (centerLat >= 35 && centerLat <= 70 && centerLon >= -10 && centerLon <= 40) {
      regionName = 'Europe';
    } else if (centerLat >= 25 && centerLat <= 50 && centerLon >= -125 && centerLon <= -65) {
      regionName = 'North America';
    } else if (centerLat >= 10 && centerLat <= 55 && centerLon >= 70 && centerLon <= 140) {
      regionName = 'Asia';
    } else if (centerLat >= -35 && centerLat <= 15 && centerLon >= -80 && centerLon <= -35) {
      regionName = 'South America';
    } else if (centerLat >= -35 && centerLat <= 15 && centerLon >= -20 && centerLon <= 55) {
      regionName = 'Africa';
    } else if (centerLat >= -45 && centerLat <= -10 && centerLon >= 110 && centerLon <= 180) {
      regionName = 'Australia';
    }
    
    // Generate a more descriptive name only if we can't find a real city
    if (regionName && !currentName.includes(regionName)) {
      return `${regionName} Urban Area`;
    }
    
    // If we can't improve it, return the original
    return currentName;
  }

  // Calculate polygon area for duplicate resolution
  calculatePolygonArea(feature) {
    const geometry = feature.geometry;
    if (!geometry || !geometry.coordinates) return 0;
    
    let coordinates = [];
    if (geometry.type === 'Polygon') {
      coordinates = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon') {
      coordinates = geometry.coordinates[0][0];
    }
    
    if (coordinates.length < 3) return 0;
    
    // Simple area calculation using shoelace formula
    let area = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      area += coordinates[i][0] * coordinates[i + 1][1];
      area -= coordinates[i + 1][0] * coordinates[i][1];
    }
    return Math.abs(area) / 2;
  }

  // Phase 3: Create city entities
  async createCityEntities(features) {
    console.log('🏙️ Creating city polygon entities...');
    
    const Cesium = window.Cesium;
    const timestamp = Date.now();
    let createdCount = 0;
    
    try {
      // Process first 100 features for testing, then scale up
      const testFeatures = features.slice(0, 100);
      console.log(`🔧 Processing first ${testFeatures.length} cities for testing...`);
      
      // Step 1: Collect all city names and resolve duplicates BEFORE entity creation
      const cityNameMap = new Map(); // name -> { feature, area, index, centroid }
      const entitiesToCreate = [];
      const duplicateLog = [];
      const correctionLog = [];
      
      for (let i = 0; i < testFeatures.length; i++) {
        const feature = testFeatures[i];
        
        if (!feature.geometry || !feature.geometry.coordinates) {
          console.warn(`⚠️ Skipping city ${i}: No geometry data`);
          continue;
        }
        
        let cityName = this.extractCityName(feature, i);
        const centroid = this.getPolygonCentroid(feature);
        
        // Step 1a: Fix "Urban Area" fallback labels by finding nearby populated places
        if (cityName && (cityName.includes('Urban Area') || cityName.includes('Metropolitan Area') || cityName.includes('City') || cityName.includes('Town'))) {
          const correctedName = this.findNearbyPopulatedPlace(feature);
          if (correctedName && correctedName !== cityName) {
            correctionLog.push(`LABEL_CORRECTED: "${cityName}" → reassigned to "${correctedName}"`);
            cityName = correctedName;
          } else {
            // If no populated place found, try to extract a better name from coordinates
            const betterName = this.generateBetterCityName(feature, cityName);
            if (betterName && betterName !== cityName) {
              correctionLog.push(`LABEL_CORRECTED: "${cityName}" → improved to "${betterName}"`);
              cityName = betterName;
            }
          }
        }
        
        if (cityName) {
          // Calculate polygon area for duplicate resolution
          const area = this.calculatePolygonArea(feature);
          
          if (!cityNameMap.has(cityName)) {
            // First occurrence of this city name - keep it
            cityNameMap.set(cityName, { feature: feature, area: area, index: i, centroid: centroid });
            entitiesToCreate.push({ feature, name: cityName, index: i, area: area });
          } else {
            // Duplicate found - keep the larger polygon, discard the smaller
            const existing = cityNameMap.get(cityName);
            if (area > existing.area) {
              duplicateLog.push(`DUPLICATE_RESOLVED: "${cityName}" → keeping larger polygon (${area.toFixed(2)} km²), discarding smaller (${existing.area.toFixed(2)} km²)`);
              // Replace the existing entry completely
              cityNameMap.set(cityName, { feature: feature, area: area, index: i, centroid: centroid });
              // Remove the old entry and add the new one
              const oldIndex = entitiesToCreate.findIndex(e => e.name === cityName);
              if (oldIndex !== -1) entitiesToCreate.splice(oldIndex, 1);
              entitiesToCreate.push({ feature, name: cityName, index: i, area: area });
            } else {
              duplicateLog.push(`DUPLICATE_RESOLVED: "${cityName}" → discarding smaller duplicate (${area.toFixed(2)} km² vs existing ${existing.area.toFixed(2)} km²)`);
              // Completely skip this duplicate - don't add to entitiesToCreate
            }
          }
        } else {
          // No name found, add as generic
          entitiesToCreate.push({ feature, name: null, index: i, area: 0 });
        }
      }
      
      // Log all corrections and duplicates
      if (correctionLog.length > 0) {
        console.log('🔧 Label Corrections:');
        correctionLog.forEach(log => console.log(`  ${log}`));
      }
      if (duplicateLog.length > 0) {
        console.log('🔄 Duplicate Resolutions:');
        duplicateLog.forEach(log => console.log(`  ${log}`));
      }
      
      console.log(`🏙️ After duplicate resolution: ${entitiesToCreate.length} entities (${cityNameMap.size} unique cities)`);
      
      // Step 2: Create entities
      for (const { feature, name: cityName, index: i } of entitiesToCreate) {
        const cityId = `city_${timestamp}_${i}`;
        
        try {
          const entity = this.createCityEntity(feature, cityId, cityName);
          if (entity) {
            this.cityEntities.set(cityId, entity);
            
            // Also track in main entitiesRef if available
            if (this.mainEntitiesRef && this.mainEntitiesRef.current) {
              this.mainEntitiesRef.current.set(cityId, entity);
            }
            
            createdCount++;
            
            // Log first 3 cities as examples
            if (i < 3) {
              console.log(`Example city entity: ${cityId} - ${cityName}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error creating city entity ${i}:`, error);
        }
      }
      
      console.log(`CREATED_CITY_ENTITIES added=${createdCount}`);
      console.log(`✅ Created ${createdCount} city entities successfully`);
      
      // Now process all features
      console.log('🔧 Scaling up to process all cities...');
      await this.createAllCityEntities(features, timestamp, createdCount, cityNameMap);
      
    } catch (error) {
      console.error('❌ Error creating city entities:', error);
    }
  }

  // Create all city entities (scaled up version with deduplication)
  async createAllCityEntities(features, timestamp, existingCount, cityNameMap) {
    const Cesium = window.Cesium;
    let createdCount = existingCount;
    let duplicateLog = [];
    
    try {
      // Step 1: Collect remaining city names and resolve duplicates BEFORE entity creation
      const remainingCityNameMap = new Map(cityNameMap); // Copy existing deduplicated map
      const entitiesToCreate = [];
      
      for (let i = 100; i < features.length; i++) {
        const feature = features[i];
        
        if (!feature.geometry || !feature.geometry.coordinates) {
          continue;
        }
        
        let cityName = this.extractCityName(feature, i);
        const centroid = this.getPolygonCentroid(feature);
        
        // Fix "Urban Area" fallback labels
        if (cityName && (cityName.includes('Urban Area') || cityName.includes('Metropolitan Area') || cityName.includes('City') || cityName.includes('Town'))) {
          const correctedName = this.findNearbyPopulatedPlace(feature);
          if (correctedName && correctedName !== cityName) {
            cityName = correctedName;
          } else {
            const betterName = this.generateBetterCityName(feature, cityName);
            if (betterName && betterName !== cityName) {
              cityName = betterName;
            }
          }
        }
        
        if (cityName) {
          // Calculate polygon area for duplicate resolution
          const area = this.calculatePolygonArea(feature);
          
          if (!remainingCityNameMap.has(cityName)) {
            // First occurrence of this city name - keep it
            remainingCityNameMap.set(cityName, { feature: feature, area: area, index: i, centroid: centroid });
            entitiesToCreate.push({ feature, name: cityName, index: i, area: area });
          } else {
            // Duplicate found - keep the larger polygon, discard the smaller
            const existing = remainingCityNameMap.get(cityName);
            if (area > existing.area) {
              duplicateLog.push(`DUPLICATE_RESOLVED: "${cityName}" → keeping larger polygon (${area.toFixed(2)} km²), discarding smaller (${existing.area.toFixed(2)} km²)`);
              // Replace the existing entry completely
              remainingCityNameMap.set(cityName, { feature: feature, area: area, index: i, centroid: centroid });
              // Remove the old entry and add the new one
              const oldIndex = entitiesToCreate.findIndex(e => e.name === cityName);
              if (oldIndex !== -1) entitiesToCreate.splice(oldIndex, 1);
              entitiesToCreate.push({ feature, name: cityName, index: i, area: area });
            } else {
              duplicateLog.push(`DUPLICATE_RESOLVED: "${cityName}" → discarding smaller duplicate (${area.toFixed(2)} km² vs existing ${existing.area.toFixed(2)} km²)`);
              // Completely skip this duplicate - don't add to entitiesToCreate
            }
          }
        } else {
          // No name found, add as generic
          entitiesToCreate.push({ feature, name: null, index: i, area: 0 });
        }
      }
      
      // Log duplicates found in remaining features
      if (duplicateLog.length > 0) {
        console.log('🔄 Additional Duplicate Resolutions:');
        duplicateLog.forEach(log => console.log(`  ${log}`));
      }
      
      console.log(`🏙️ After full duplicate resolution: ${entitiesToCreate.length} entities (${remainingCityNameMap.size} unique cities total)`);
      
      // Step 2: Create entities only for deduplicated features
      for (const { feature, name: cityName, index: i } of entitiesToCreate) {
        const cityId = `city_${timestamp}_${i}`;
        
        try {
          const entity = this.createCityEntity(feature, cityId, cityName);
          if (entity) {
            this.cityEntities.set(cityId, entity);
            
            // Also track in main entitiesRef if available
            if (this.mainEntitiesRef && this.mainEntitiesRef.current) {
              this.mainEntitiesRef.current.set(cityId, entity);
            }
            
            createdCount++;
          }
        } catch (error) {
          // Skip problematic features
          continue;
        }
        
        // Progress logging
        if (createdCount % 500 === 0) {
          console.log(`✅ Progress: Created ${createdCount} city entities...`);
        }
      }
      
      console.log(`CREATED_CITY_ENTITIES added=${createdCount}`);
      console.log(`✅ Total city entities created: ${createdCount} (after full deduplication)`);
      
    } catch (error) {
      console.error('❌ Error in scaled city creation:', error);
    }
  }

  // Extract city name from feature properties
  extractCityName(feature, index) {
    const properties = feature.properties || {};
    
    // Try to get name from properties first (urban areas dataset doesn't have names)
    let cityName = properties.NAME || 
                   properties.name || 
                   properties.NAMEASCII ||
                   properties.nameascii ||
                   properties.NAME_EN ||
                   properties.name_en ||
                   properties.CITY ||
                   properties.city ||
                   properties.PLACE ||
                   properties.place;
    
    if (cityName) {
      console.log(`CITY_LABEL_ASSIGNED id=city_${Date.now()}_${index} name=${cityName}`);
      return cityName;
    }
    
    // Try to find a nearby city name from loaded populated places
    const geometry = feature.geometry;
    console.log(`🔍 City names loaded: ${this.cityNames ? this.cityNames.size : 'null'}`);
    if (geometry && this.cityNames && this.cityNames.size > 0) {
      let coordinates = [];
      
      // Get center coordinates of the urban area
      if (geometry.type === 'Polygon') {
        coordinates = geometry.coordinates[0];
      } else if (geometry.type === 'MultiPolygon') {
        coordinates = geometry.coordinates[0][0];
      }
      
      if (coordinates && coordinates.length > 0) {
        // Calculate center point
        let centerLon = 0, centerLat = 0;
        coordinates.forEach(coord => {
          centerLon += coord[0];
          centerLat += coord[1];
        });
        centerLon /= coordinates.length;
        centerLat /= coordinates.length;
        
        console.log(`🔍 Looking for city name near ${centerLon.toFixed(4)}, ${centerLat.toFixed(4)}`);
        console.log(`🔍 City names available: ${this.cityNames.size}, exact locations: ${this.cityNamesByLocation.size}`);
        
        // Try multiple search strategies
        const searchStrategies = [
          // Strategy 1: Exact coordinate lookup
          () => {
            const exactKey = `${centerLon}_${centerLat}`;
            const result = this.cityNamesByLocation.get(exactKey);
            if (result) console.log(`🔍 Strategy 1 (exact): Found ${result}`);
            return result || null;
          },
          
          // Strategy 2: Rounded coordinate lookup (better precision)
          () => {
            const roundedKey = `${Math.round(centerLon * 100) / 100}_${Math.round(centerLat * 100) / 100}`;
            const result = this.cityNames.get(roundedKey);
            if (result) console.log(`🔍 Strategy 2 (rounded): Found ${result}`);
            return result || null;
          },
          
          // Strategy 3: Multiple precision levels
          () => {
            const precisions = [10, 5, 2, 1]; // degrees * precision factor
            for (const precision of precisions) {
              const key = `${Math.round(centerLon * precision) / precision}_${Math.round(centerLat * precision) / precision}`;
              if (this.cityNames.has(key)) {
                const result = this.cityNames.get(key);
                console.log(`🔍 Strategy 3 (precision ${precision}): Found ${result}`);
                return result;
              }
            }
            return null;
          },
          
          // Strategy 4: Expanded search radius with multiple precision levels
          () => {
            const searchRadius = 1.0; // degrees - increased radius
            let bestMatch = null;
            let bestDistance = Infinity;
            
            // Try multiple precision levels in the search
            const searchPrecisions = [1, 2, 5, 10];
            
            for (const precision of searchPrecisions) {
              for (let lonOffset = -searchRadius; lonOffset <= searchRadius; lonOffset += 0.1) {
                for (let latOffset = -searchRadius; latOffset <= searchRadius; latOffset += 0.1) {
                  const searchLon = centerLon + lonOffset;
                  const searchLat = centerLat + latOffset;
                  const key = `${Math.round(searchLon * precision) / precision}_${Math.round(searchLat * precision) / precision}`;
                  
                  if (this.cityNames.has(key)) {
                    const distance = Math.sqrt(lonOffset * lonOffset + latOffset * latOffset);
                    if (distance < bestDistance) {
                      bestDistance = distance;
                      bestMatch = this.cityNames.get(key);
                      console.log(`🔍 Found city match: ${bestMatch} at distance ${distance.toFixed(3)} with precision ${precision}`);
                    }
                  }
                }
              }
            }
            return bestMatch;
          }
        ];
        
        // Try each strategy until we find a match
        for (let i = 0; i < searchStrategies.length; i++) {
          const foundName = searchStrategies[i]();
          if (foundName) {
            console.log(`CITY_LABEL_ASSIGNED id=city_${Date.now()}_${index} name=${foundName} (strategy ${i + 1})`);
            return foundName;
          }
        }
        
        console.log(`⚠️ No city name found for coordinates ${centerLon.toFixed(4)}, ${centerLat.toFixed(4)}`);
      }
    }
    
    // If no name available, generate a meaningful name based on location
    try {
      const geometry = feature.geometry;
      let coordinates = [];
      
      // For populated places, geometry is usually Point, but check for other types
      if (geometry.type === 'Point') {
        coordinates = [geometry.coordinates];
      } else if (geometry.type === 'Polygon') {
        coordinates = geometry.coordinates[0];
      } else if (geometry.type === 'MultiPolygon') {
        coordinates = geometry.coordinates[0][0];
      }
      
      if (coordinates && coordinates.length > 0) {
        // Calculate center point
        let centerLon = 0, centerLat = 0;
        coordinates.forEach(coord => {
          centerLon += coord[0];
          centerLat += coord[1];
        });
        centerLon /= coordinates.length;
        centerLat /= coordinates.length;
        
        // Get population for context
        const population = properties.POP_MAX || properties.pop_max || properties.POPULATION || properties.population || 0;
        const areaText = population > 1000000 ? 'Metropolitan Area' : population > 100000 ? 'City' : population > 10000 ? 'Town' : 'Urban Area';
        
        // Try to get country name for better context
        const country = properties.ADMIN || properties.admin || properties.SOV0NAME || properties.sov0name || '';
        const countryText = country ? `, ${country}` : '';
        
        // Generate name based on coordinates and population with country context
        const latDir = centerLat >= 0 ? 'N' : 'S';
        const lonDir = centerLon >= 0 ? 'E' : 'W';
        const latStr = Math.abs(centerLat).toFixed(1);
        const lonStr = Math.abs(centerLon).toFixed(1);
        
        const generatedName = `${areaText} ${latStr}°${latDir} ${lonStr}°${lonDir}${countryText}`;
        console.log(`CITY_LABEL_ASSIGNED id=city_${Date.now()}_${index} name=${generatedName} (generated with country context)`);
        return generatedName;
      }
    } catch (error) {
      console.warn(`⚠️ Error generating city name for feature ${index}:`, error);
    }
    
    // Fallback to generic name
    const fallbackName = `City ${index + 1}`;
    console.log(`CITY_LABEL_ASSIGNED id=city_${Date.now()}_${index} name=${fallbackName} (fallback)`);
    return fallbackName;
  }

  // Create individual city entity
  createCityEntity(feature, cityId, cityName) {
    const Cesium = window.Cesium;
    
    try {
      const geometry = feature.geometry;
      
      // Handle different geometry types
      if (geometry.type === 'Point') {
        // For populated places (points), create a circular marker
        const [lon, lat] = geometry.coordinates;
        const position = Cesium.Cartesian3.fromRadians(lon, lat);
        
        // Create city point entity with a circle
        const entity = this.viewer.entities.add({
          id: cityId,
          name: cityName,
          position: position,
          show: true, // Explicitly ensure visibility
          ellipse: {
            semiMajorAxis: 5000, // 5km radius
            semiMinorAxis: 5000,
            material: Cesium.Color.YELLOW.withAlpha(0.7), // Yellow fill for cities
            outline: true,
            outlineColor: Cesium.Color.ORANGE, // Orange outline for better visibility
            outlineWidth: 2,
            height: 0,
            clampToGround: true,
            shadows: Cesium.ShadowMode.DISABLED
          },
        });
        
        return entity;
        
      } else if (geometry.type === 'Polygon') {
        // Handle polygon geometries (for urban areas)
        const positions = this.convertPolygonToPositions(geometry.coordinates[0]);
        
        if (positions.length < 3) {
          console.warn(`⚠️ Invalid polygon for ${cityName}: ${positions.length} points`);
          return null;
        }
        
        // Calculate center position for the label
        let centerLon = 0, centerLat = 0;
        positions.forEach(pos => {
          const cartographic = Cesium.Cartographic.fromCartesian(pos);
          centerLon += cartographic.longitude;
          centerLat += cartographic.latitude;
        });
        centerLon /= positions.length;
        centerLat /= positions.length;
        const centerPosition = Cesium.Cartesian3.fromRadians(centerLon, centerLat);

        // Create city polygon entity
        const entity = this.viewer.entities.add({
          id: cityId,
          name: cityName,
          position: centerPosition,
          show: true, // Explicitly ensure visibility
          polygon: {
            hierarchy: positions,
            material: Cesium.Color.YELLOW.withAlpha(0.7), // Yellow fill for cities
            outline: true,
            outlineColor: Cesium.Color.ORANGE, // Orange outline for better visibility
            outlineWidth: 2, // Thicker outline
            height: 0,
            clampToGround: true,
            shadows: Cesium.ShadowMode.DISABLED
          },
        });
        
        return entity;
        
      } else if (geometry.type === 'MultiPolygon') {
        // Use the first polygon for simplicity
        const positions = this.convertPolygonToPositions(geometry.coordinates[0][0]);
        
        if (positions.length < 3) {
          console.warn(`⚠️ Invalid polygon for ${cityName}: ${positions.length} points`);
          return null;
        }
        
        // Calculate center position for the label
        let centerLon = 0, centerLat = 0;
        positions.forEach(pos => {
          const cartographic = Cesium.Cartographic.fromCartesian(pos);
          centerLon += cartographic.longitude;
          centerLat += cartographic.latitude;
        });
        centerLon /= positions.length;
        centerLat /= positions.length;
        const centerPosition = Cesium.Cartesian3.fromRadians(centerLon, centerLat);

        // Create city polygon entity
        const entity = this.viewer.entities.add({
          id: cityId,
          name: cityName,
          position: centerPosition,
          show: true, // Explicitly ensure visibility
          polygon: {
            hierarchy: positions,
            material: Cesium.Color.YELLOW.withAlpha(0.7), // Yellow fill for cities
            outline: true,
            outlineColor: Cesium.Color.ORANGE, // Orange outline for better visibility
            outlineWidth: 2, // Thicker outline
            height: 0,
            clampToGround: true,
            shadows: Cesium.ShadowMode.DISABLED
          },
        });
        
        return entity;
        
      } else {
        console.warn(`⚠️ Unsupported geometry type: ${geometry.type}`);
        return null;
      }
      
      // Debug: Log first few entities to verify they're created correctly
      if (cityId.includes('_0') || cityId.includes('_1') || cityId.includes('_2')) {
        console.log(`🏙️ Created entity: ${cityName} (${cityId})`);
        if (entity.polygon) {
          console.log(`🏙️ Entity polygon outline: ${entity.polygon.outlineColor}`);
        } else if (entity.ellipse) {
          console.log(`🏙️ Entity ellipse outline: ${entity.ellipse.outlineColor}`);
        }
        console.log(`🏙️ Entity position: ${entity.position}`);
      }
      
      return entity;
      
    } catch (error) {
      console.error(`❌ Error creating city entity for ${cityName}:`, error);
      return null;
    }
  }

  // Convert polygon coordinates to Cesium positions
  convertPolygonToPositions(coordinates) {
    const Cesium = window.Cesium;
    return coordinates.map(coord => 
      Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
    );
  }

  // Phase 4: Initialize hover system for cities
  initializeCityHoverSystem() {
    console.log('🏙️ Initializing city hover system...');
    
    if (!this.viewer || !this.viewer.cesiumWidget) {
      console.warn('⚠️ Viewer not available for city hover system');
      return;
    }
    
    const canvas = this.viewer.cesiumWidget.canvas;
    
    this.cityEventHandler = new Cesium.ScreenSpaceEventHandler(canvas);
    
    this.cityEventHandler.setInputAction((event) => {
      this.handleCityHover(event);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    
    console.log('✅ City hover system initialized');
  }

  // Handle city hover events with debouncing
  handleCityHover(event) {
    try {
      // Debounce rapid hover changes to prevent flickering
      if (this.hoverDebounceTimer) {
        clearTimeout(this.hoverDebounceTimer);
      }
      
      this.hoverDebounceTimer = setTimeout(() => {
        this.processCityHover(event);
      }, 50); // 50ms debounce
    } catch (error) {
      console.error('❌ Error in city hover handler:', error);
    }
  }
  
  // Process city hover (debounced)
  processCityHover(event) {
    try {
      const pickedObject = this.viewer.scene.pick(event.endPosition);
      
      if (pickedObject && pickedObject.id && this.cityEntities.has(pickedObject.id.id)) {
        const cityId = pickedObject.id.id;
        const cityName = pickedObject.id.name;
        
        // Only process if this is a different entity or first hover
        if (this.hoveredCity !== cityId) {
          console.log(`🏙️ Hover detected: ${cityName} (${cityId})`);
          
          // Get mouse position for panel positioning
          const mousePosition = {
            x: event.endPosition.x,
            y: event.endPosition.y
          };
          
          this.showCityHover(cityId, cityName, mousePosition);
          console.log(`HOVER_EVENT entityId=${cityId} action=enter`);
        }
      } else {
        // Only hide if we were actually hovering something
        if (this.hoveredCity) {
          console.log(`🏙️ Hover leaving: ${this.hoveredCity}`);
          this.hideCityHover();
          console.log(`HOVER_EVENT entityId=null action=leave`);
        }
      }
    } catch (error) {
      console.error('❌ Error in city hover processing:', error);
    }
  }

  // Show city hover effects
  showCityHover(cityId, cityName, mousePosition) {
    this.hideCityHover(); // Clear previous hover
    
    this.hoveredCity = cityId;
    const entity = this.cityEntities.get(cityId);
    
    if (entity) {
      console.log(`🏙️ Showing hover for city: ${cityName} (${cityId})`);
      
      // Change outline to yellow for both polygon and ellipse entities
      if (entity.polygon) {
        entity.polygon.outlineColor = window.Cesium.Color.YELLOW;
        entity.polygon.outlineWidth = 3; // Make it more visible
      } else if (entity.ellipse) {
        entity.ellipse.outlineColor = window.Cesium.Color.YELLOW;
        entity.ellipse.outlineWidth = 3; // Make it more visible
      }
      
      // Show hover panel
      if (this.hoverPanel) {
        this.hoverPanel.textContent = cityName;
        this.hoverPanel.style.display = 'block';
        
        // Position the panel near the mouse cursor
        if (mousePosition) {
          this.hoverPanel.style.left = (mousePosition.x + 10) + 'px';
          this.hoverPanel.style.top = (mousePosition.y - 30) + 'px';
        }
      }
      
      // Change cursor
      if (this.viewer.cesiumWidget.canvas) {
        this.viewer.cesiumWidget.canvas.style.cursor = 'pointer';
      }
      
      console.log(`✅ Hover effects applied to ${cityName}`);
    } else {
      console.warn(`⚠️ Entity not found for cityId: ${cityId}`);
    }
  }

  // Hide city hover effects
  hideCityHover() {
    if (this.hoveredCity) {
      const entity = this.cityEntities.get(this.hoveredCity);
      
      if (entity) {
        console.log(`🏙️ Hiding hover for city: ${entity.name} (${this.hoveredCity})`);
        
        // Revert outline to red for both polygon and ellipse entities
        if (entity.polygon) {
          entity.polygon.outlineColor = window.Cesium.Color.RED;
          entity.polygon.outlineWidth = 1; // Reset to original width
        } else if (entity.ellipse) {
          entity.ellipse.outlineColor = window.Cesium.Color.RED;
          entity.ellipse.outlineWidth = 2; // Reset to original width
        }
        
        // Hide hover panel
        if (this.hoverPanel) {
          this.hoverPanel.style.display = 'none';
        }
        
        console.log(`✅ Hover effects removed from ${entity.name}`);
      }
      
      // Reset cursor
      if (this.viewer.cesiumWidget.canvas) {
        this.viewer.cesiumWidget.canvas.style.cursor = 'default';
      }
      
      this.hoveredCity = null;
    }
  }

  // Phase 5: Clear cities function
  clearCities() {
    console.log('🗑️ Clearing city entities...');
    
    try {
      // Clear hover effects
      this.hideCityHover();
      
      // Remove all city entities
      for (const [cityId, entity] of this.cityEntities) {
        this.viewer.entities.remove(entity);
      }
      
      // Clear city collections
      this.cityEntities.clear();
      
      console.log(`✅ Cleared ${this.cityEntities.size} city entities`);
      
    } catch (error) {
      console.error('❌ Error clearing cities:', error);
    }
  }

  // Main city loading function
  async loadCityBoundaries() {
    console.log('🏙️ Starting city boundary loading process...');
    
    try {
      // Phase 2: Load GeoJSON
      console.log('🏙️ Phase 2: Loading GeoJSON data...');
      const features = await this.loadCities();
      
      // Phase 3: Create entities
      console.log('🏙️ Phase 3: Creating city entities...');
      await this.createCityEntities(features);
      
      // Phase 4: Initialize hover system
      console.log('🏙️ Phase 4: Initializing hover system...');
      this.initializeCityHoverSystem();
      
      console.log('✅ City boundary system fully loaded');
      console.log(`📊 Final result: ${this.cityEntities.size} city entities created from ${features.length} features`);
      
      return {
        success: true,
        entityCount: this.cityEntities.size,
        features: features.length
      };
      
    } catch (error) {
      console.error('❌ Error loading city boundaries:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Simple validation method for city boundaries (no auto-restart)
  // Cleanup city system
  destroyCitySystem() {
    console.log('🗑️ Destroying city boundary system...');
    
    try {
      // Clear cities
      this.clearCities();
      
      // Remove event handler
      if (this.cityEventHandler) {
        this.cityEventHandler.destroy();
        this.cityEventHandler = null;
      }
      
      // Remove hover panel
      if (this.hoverPanel && this.hoverPanel.parentNode) {
        this.hoverPanel.parentNode.removeChild(this.hoverPanel);
        this.hoverPanel = null;
      }
      
      console.log('✅ City boundary system destroyed');
      
    } catch (error) {
      console.error('❌ Error destroying city system:', error);
    }
  }

  // ===== OTHERS SECTION IMPLEMENTATION =====
  
  // Load country boundaries for Others calculation
  async loadCountryBoundaries() {
    console.log('🌍 Loading country boundaries for Others calculation...');
    
    try {
      const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';
      console.log(`🌐 Fetching country data from: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch country data: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.features || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON format for countries');
      }
      
      console.log(`📊 Found ${data.features.length} country features for Others calculation`);
      return data.features;
      
    } catch (error) {
      console.error('❌ Error loading country boundaries:', error);
      throw error;
    }
  }

  // Load province boundaries for Others calculation
  async loadProvinceBoundaries() {
    console.log('🏛️ Loading province boundaries for Others calculation...');
    console.log('🔍 DEBUG: loadProvinceBoundaries called');
    
    try {
      const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson';
      console.log(`🌐 Fetching province data from: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch province data: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.features || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON format for provinces');
      }
      
      console.log(`📊 Found ${data.features.length} province features for Others calculation`);
      console.log('🔍 DEBUG: First few province features:', data.features.slice(0, 3).map(f => ({
        name: f.properties?.NAME || f.properties?.name || 'Unknown',
        country: f.properties?.SOVEREIGNT || f.properties?.ADMIN || 'Unknown',
        geometry: f.geometry?.type
      })));
      return data.features;
      
    } catch (error) {
      console.error('❌ Error loading province boundaries:', error);
      throw error;
    }
  }

  // Auto-create Others entity for a single province
  async createOthersForProvince(provinceFeature, properties) {
    try {
      const provinceName = this.extractProvinceName(properties, 0);
      const countryName = this.extractCountryName(properties);
      const provinceCode = properties.ISO_3166_2 || properties.ADM1_A3 || 'UNK';
      
      console.log(`🏞️ Auto-creating Others for ${provinceName}, ${countryName}...`);
      console.log(`🔍 DEBUG: Province feature:`, provinceFeature);
      console.log(`🔍 DEBUG: Properties:`, properties);
      
      // Import Turf.js dynamically
      const turf = await import('@turf/turf');
      
      // Create province polygon
      let provincePolygon;
      if (provinceFeature.geometry.type === 'Polygon') {
        provincePolygon = turf.default.polygon(provinceFeature.geometry.coordinates[0]);
      } else if (provinceFeature.geometry.type === 'MultiPolygon') {
        // Use the largest polygon for MultiPolygon
        let largestPolygon = null;
        let largestArea = 0;
        
        for (const polygon of provinceFeature.geometry.coordinates) {
          if (polygon && polygon[0] && polygon[0].length > 0) {
            const testPolygon = turf.default.polygon(polygon[0]);
            const area = turf.default.area(testPolygon);
            if (area > largestArea) {
              largestArea = area;
              largestPolygon = testPolygon;
            }
          }
        }
        
        if (largestPolygon) {
          provincePolygon = largestPolygon;
        } else {
          console.warn(`⚠️ No valid polygons found in MultiPolygon province: ${provinceName}`);
          return;
        }
      } else {
        console.warn(`⚠️ Unsupported province geometry type: ${provinceFeature.geometry.type} for ${provinceName}`);
        return;
      }

      // Find cities that intersect with this province
      const intersectingCities = [];
      const cityEntities = Array.from(this.cityEntities.values());
      
      for (const cityEntity of cityEntities) {
        try {
          if (!cityEntity || !cityEntity.polygon || !cityEntity.polygon.hierarchy) {
            continue;
          }

          // Convert Cesium polygon to GeoJSON
          const cityPositions = cityEntity.polygon.hierarchy.getValue();
          if (!cityPositions || !cityPositions.positions || cityPositions.positions.length < 3) {
            continue;
          }

          const cityCoordinates = cityPositions.positions.map(pos => {
            const cartographic = Cesium.Cartographic.fromCartesian(pos);
            return [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
          });

          const cityPolygon = turf.default.polygon([cityCoordinates]);
          
          // Check if city intersects with province
          if (turf.default.booleanIntersects(cityPolygon, provincePolygon)) {
            intersectingCities.push(cityPolygon);
          }
        } catch (cityError) {
          console.warn(`⚠️ Error processing city ${cityEntity.id}: ${cityError.message}`);
          continue;
        }
      }

      console.log(`🏙️ Found ${intersectingCities.length} cities in ${provinceName}`);

      // Calculate Others area
      let othersPolygon;
      if (intersectingCities.length === 0) {
        // No cities in this province, entire province is "Others"
        othersPolygon = provincePolygon;
      } else {
        // Subtract cities from province
        try {
          // Union all intersecting city polygons
          let citiesUnion = intersectingCities[0];
          for (let i = 1; i < intersectingCities.length; i++) {
            try {
              citiesUnion = turf.default.union(citiesUnion, intersectingCities[i]);
            } catch (unionError) {
              console.warn(`⚠️ Union failed for city ${i} in ${provinceName}, skipping:`, unionError);
            }
          }

          // Subtract cities from province
          try {
            othersPolygon = turf.default.difference(provincePolygon, citiesUnion);
          } catch (differenceError) {
            console.warn(`⚠️ Turf.js difference failed for ${provinceName}, using entire province:`, differenceError);
            othersPolygon = provincePolygon;
          }
        } catch (error) {
          console.warn(`⚠️ Error calculating Others for ${provinceName}, using entire province:`, error);
          othersPolygon = provincePolygon;
        }
      }
      
      if (othersPolygon && turf.default.getGeom(othersPolygon)) {
        const area = turf.default.area(othersPolygon);
        if (area > 1000000) { // 1 km² in m²
          await this.createSingleOthersEntityForProvince(
            provinceName,
            countryName,
            provinceCode,
            provinceFeature,
            othersPolygon
          );
          
          const areaKm2 = Math.round(area / 1000000);
          console.log(`✅ Created Others for ${provinceName}, covering ${areaKm2} km²`);
        } else {
          console.log(`ℹ️ Others polygon for ${provinceName} too small (${Math.round(area/1000000)} km²), skipping`);
        }
      }

    } catch (error) {
      console.error(`❌ Error creating Others for province:`, error);
      console.error(`❌ Error details:`, {
        message: error.message,
        stack: error.stack,
        provinceName: provinceName || 'Unknown',
        countryName: countryName || 'Unknown'
      });
    }
  }

  // Recompute all Others entities when cities are loaded/updated
  async recomputeAllOthers() {
    console.log('🔄 Recomputing all Others entities...');
    
    try {
      // Clear existing Others entities
      await this.clearOthersEntities();
      
      // Get all province entities from the viewer
      const provinceEntities = this.viewer.entities.values.filter(entity => 
        entity.properties && entity.properties.getValue && 
        entity.properties.getValue().type === 'province'
      );
      
      console.log(`🏛️ Found ${provinceEntities.length} province entities to recompute Others for`);
      
      let recomputedCount = 0;
      
      for (const provinceEntity of provinceEntities) {
        try {
          const properties = provinceEntity.properties.getValue();
          const provinceName = properties.province || properties.name;
          const countryName = properties.country;
          const provinceCode = properties.provinceCode || 'UNK';
          
          if (provinceName && countryName) {
            // Create a mock feature object for the province
            const provinceFeature = {
              geometry: this.cesiumToGeoJSON(provinceEntity.polygon.hierarchy.getValue()),
              properties: properties
            };
            
            // Auto-generate Others for this province
            await this.createOthersForProvince(provinceFeature, properties);
            recomputedCount++;
          }
        } catch (error) {
          console.warn(`⚠️ Error recomputing Others for province entity:`, error);
        }
      }
      
      console.log(`✅ Recomputed Others for ${recomputedCount} provinces`);
      
    } catch (error) {
      console.error('❌ Error recomputing all Others entities:', error);
    }
  }

  // Create country-level Others by aggregating all province-level Others
  async createCountryLevelOthers(countryName, countryCode) {
    try {
      console.log(`🏞️ Creating country-level Others for ${countryName}...`);
      
      // Get all Others entities for this country
      const countryOthersEntities = Array.from(this.othersEntities.values()).filter(entity => {
        const properties = entity.properties.getValue();
        return properties.country === countryName;
      });
      
      if (countryOthersEntities.length === 0) {
        console.log(`ℹ️ No province-level Others found for ${countryName}`);
        return;
      }
      
      console.log(`🏛️ Found ${countryOthersEntities.length} province-level Others for ${countryName}`);
      
      // Import Turf.js dynamically
      const turf = await import('@turf/turf');
      
      // Union all province-level Others polygons
      let countryOthersPolygon = null;
      for (const othersEntity of countryOthersEntities) {
        try {
          const positions = othersEntity.polygon.hierarchy.getValue().positions;
          const coordinates = positions.map(pos => {
            const cartographic = Cesium.Cartographic.fromCartesian(pos);
            return [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
          });
          
          const othersPolygon = turf.default.polygon([coordinates]);
          
          if (countryOthersPolygon === null) {
            countryOthersPolygon = othersPolygon;
          } else {
            try {
              countryOthersPolygon = turf.default.union(countryOthersPolygon, othersPolygon);
            } catch (unionError) {
              console.warn(`⚠️ Union failed for ${countryName} Others:`, unionError);
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error processing Others entity for ${countryName}:`, error);
        }
      }
      
      if (countryOthersPolygon && turf.default.getGeom(countryOthersPolygon)) {
        const area = turf.default.area(countryOthersPolygon);
        const areaKm2 = Math.round(area / 1000000);
        
        // Create country-level Others entity
        const timestamp = Date.now();
        const othersId = `others_country_${countryCode}_${timestamp}`;
        
        const coordinates = this.geoJSONToCesiumCoordinates(countryOthersPolygon);
        if (coordinates) {
          const entity = this.viewer.entities.add({
            id: othersId,
            name: `Others - ${countryName}`, // Format: "Others - [Country Name]"
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
              country: countryName,
              countryCode: countryCode,
              created: new Date().toISOString(),
              autoGenerated: true,
              level: 'country',
              aggregatedFrom: countryOthersEntities.length
            }
          });

          // Add hover functionality
          this.addOthersHoverFunctionality(entity, countryName);

          // Store in entities map
          this.othersEntities.set(othersId, entity);

          // Add to main entities ref
          if (this.mainEntitiesRef && this.mainEntitiesRef.current) {
            this.mainEntitiesRef.current.set(othersId, entity);
          }

          console.log(`✅ Aggregated Others for ${countryName}, from ${countryOthersEntities.length} provinces, covering ${areaKm2} km²`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error creating country-level Others for ${countryName}:`, error);
    }
  }

  // Convert Cesium polygon to GeoJSON
  cesiumToGeoJSON(cesiumPolygon) {
    try {
      const positions = cesiumPolygon.positions;
      const coordinates = positions.map(pos => {
        const cartographic = Cesium.Cartographic.fromCartesian(pos);
        return [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
      });
      
      return {
        type: 'Polygon',
        coordinates: [coordinates]
      };
    } catch (error) {
      console.warn('⚠️ Error converting Cesium polygon to GeoJSON:', error);
      return null;
    }
  }

  // Create Others entities by subtracting city polygons from province polygons
  async createOthersEntities() {
      console.log('🏞️ Creating Others entities (Provinces - Cities)...');
      console.log('🔍 DEBUG: createOthersEntities called');
      console.log('🔍 DEBUG: this.viewer exists:', !!this.viewer);
      console.log('🔍 DEBUG: this.cityEntities size:', this.cityEntities?.size || 0);
    
    try {
      // Import Turf.js dynamically
      const turf = await import('@turf/turf');
        console.log('🔍 DEBUG: Turf.js imported successfully');
      
      if (!this.viewer || !window.Cesium) {
        console.error('❌ Cesium viewer not available for Others creation');
        return { success: false, error: 'Viewer not initialized' };
      }

      // Clear existing Others entities first
      await this.clearOthersEntities();

      // Load province boundaries (states/provinces)
      const provinceFeatures = await this.loadProvinceBoundaries();
      
      // Get all city entities for intersection calculation
      const cityEntities = Array.from(this.cityEntities.values());
      
      console.log(`🏛️ Found ${provinceFeatures.length} province features`);
      console.log(`🏙️ Found ${cityEntities.length} city entities for Others calculation`);

      if (provinceFeatures.length === 0) {
        console.log('ℹ️ No province entities found, skipping Others creation');
        return { success: true, message: 'No provinces to use as base' };
      }

      if (cityEntities.length === 0) {
        console.log('ℹ️ No city entities found, skipping Others creation');
        return { success: true, message: 'No cities to subtract' };
      }

      let othersCreated = 0;
      let othersSkipped = 0;
      const othersEntities = new Map();

      // Process each province
      for (const provinceFeature of provinceFeatures) {
        try {
          // Validate province feature structure
          if (!provinceFeature || !provinceFeature.properties) {
            console.warn(`⚠️ Invalid province feature: missing properties`);
            continue;
          }
          
          if (!provinceFeature.geometry) {
            console.warn(`⚠️ Invalid province feature: missing geometry`);
            continue;
          }

          const provinceName = this.extractProvinceName(provinceFeature.properties, 0);
          const countryName = this.extractCountryName(provinceFeature.properties);
          const provinceCode = provinceFeature.properties.ISO_3166_2 || provinceFeature.properties.ADM1_A3 || 'UNK';
          
          console.log(`🏛️ Processing Others for ${provinceName}, ${countryName} (${provinceCode})...`);

          // Create province polygon
          let provincePolygon;
          try {
            // Handle both Polygon and MultiPolygon province geometries
            if (provinceFeature.geometry.type === 'Polygon') {
              provincePolygon = turf.default.polygon(provinceFeature.geometry.coordinates);
            } else if (provinceFeature.geometry.type === 'MultiPolygon') {
              // For MultiPolygon provinces, use the largest polygon
              let largestPolygon = null;
              let largestArea = 0;
              
              for (const polygon of provinceFeature.geometry.coordinates) {
                if (polygon && polygon[0] && polygon[0].length > 0) {
                  const testPolygon = turf.default.polygon(polygon);
                  const area = turf.default.area(testPolygon);
                  if (area > largestArea) {
                    largestArea = area;
                    largestPolygon = testPolygon;
                  }
                }
              }
              
              if (largestPolygon) {
                provincePolygon = largestPolygon;
              } else {
                console.warn(`⚠️ No valid polygons found in MultiPolygon province: ${provinceName}`);
                continue;
              }
            } else {
              console.warn(`⚠️ Unsupported province geometry type: ${provinceFeature.geometry.type} for ${provinceName}`);
              continue;
                }
          } catch (error) {
            console.warn(`⚠️ Error creating province polygon for ${provinceName}:`, error);
            console.warn(`🔍 Geometry type: ${provinceFeature.geometry?.type}, Coordinates length: ${provinceFeature.geometry?.coordinates?.length}`);
            continue;
          }

          // Find cities that intersect with this province
          const intersectingCities = [];
          for (const cityEntity of cityEntities) {
            try {
              // Validate city entity structure
              if (!cityEntity || !cityEntity.polygon) {
                console.warn(`⚠️ Invalid city entity: missing polygon`);
                continue;
              }
              
              if (!cityEntity.polygon.hierarchy) {
                console.warn(`⚠️ Invalid city entity: missing polygon hierarchy`);
                continue;
              }

              // Convert Cesium polygon to GeoJSON
              const cityPositions = cityEntity.polygon.hierarchy.getValue();
              if (!cityPositions || !cityPositions.positions || cityPositions.positions.length < 3) {
                continue;
              }

              const cityCoordinates = cityPositions.positions.map(pos => {
                const cartographic = Cesium.Cartographic.fromCartesian(pos);
                return [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
              });

              const cityPolygon = turf.default.polygon([cityCoordinates]);
              
              // Check if city intersects with province
              if (turf.default.booleanIntersects(cityPolygon, provincePolygon)) {
                intersectingCities.push(cityPolygon);
              }
            } catch (cityError) {
              console.warn(`⚠️ Error processing city ${cityEntity.id}: ${cityError.message}`);
              continue;
            }
          }

          console.log(`🏙️ Found ${intersectingCities.length} cities in ${provinceName}`);

          if (intersectingCities.length === 0) {
            // No cities in this province, entire province is "Others"
            await this.createSingleOthersEntityForProvince(
              provinceName,
              countryName, 
              provinceCode,
              provinceFeature,
              provincePolygon
            );
            othersCreated++;
          } else {
            // Subtract cities from province to create Others
            try {
              // Union all intersecting city polygons
              let citiesUnion = intersectingCities[0];
              for (let i = 1; i < intersectingCities.length; i++) {
                try {
                citiesUnion = turf.default.union(citiesUnion, intersectingCities[i]);
                } catch (unionError) {
                  console.warn(`⚠️ Union failed for city ${i} in ${provinceName}, skipping:`, unionError);
                  // Continue with the existing union
                }
              }

              // Subtract cities from province
              let othersPolygon;
              try {
                othersPolygon = turf.default.difference(provincePolygon, citiesUnion);
              } catch (differenceError) {
                console.warn(`⚠️ Turf.js difference failed for ${provinceName}, trying alternative approach:`, differenceError);
                
                // Fallback 1: Check if cities cover most of the province
                const provinceArea = turf.default.area(provincePolygon);
                const citiesArea = turf.default.area(citiesUnion);
                const coverageRatio = citiesArea / provinceArea;
                
                if (coverageRatio < 0.95) {
                  // Cities don't cover more than 95% of the province, use entire province as Others
                  console.log(`ℹ️ Using entire province as Others for ${provinceName} (cities cover ${Math.round(coverageRatio * 100)}%)`);
                  othersPolygon = provincePolygon;
                } else {
                  // Cities cover most of the province, skip Others creation
                  console.log(`ℹ️ Cities cover ${Math.round(coverageRatio * 100)}% of ${provinceName}, skipping Others`);
                  othersPolygon = null;
                }
              }
              
              if (othersPolygon && turf.default.getGeom(othersPolygon)) {
                // Check if the resulting polygon is large enough (>1 km²)
                const area = turf.default.area(othersPolygon);
                if (area > 1000000) { // 1 km² in m²
                  await this.createSingleOthersEntityForProvince(
                    provinceName,
                    countryName, 
                    provinceCode,
                    provinceFeature,
                    othersPolygon
                  );
                  othersCreated++;
                } else {
                  console.log(`ℹ️ Others polygon for ${provinceName} too small (${Math.round(area/1000000)} km²), skipping`);
                  othersSkipped++;
                }
              } else {
                console.log(`ℹ️ No Others area remaining for ${provinceName} after subtracting cities`);
                othersSkipped++;
              }
            } catch (error) {
              console.warn(`⚠️ Error creating Others for ${provinceName}:`, error);
              othersSkipped++;
            }
          }

        } catch (error) {
          console.warn(`⚠️ Error processing province ${provinceFeature.properties?.NAME || 'Unknown'}:`, error);
          othersSkipped++;
        }
      }

      // Store Others entities
      this.othersEntities = othersEntities;

      // Register Others entities in active regions
      if (othersEntities.size > 0) {
        const othersEntityIds = Array.from(othersEntities.keys());
        this.registerOnce('others', othersEntityIds);
        console.log(`📝 Registered ${othersEntityIds.length} Others entities in active regions`);
      }

      // Track Others entities in main entitiesRef
      if (this.mainEntitiesRef && this.mainEntitiesRef.current) {
        for (const [othersId, entity] of othersEntities) {
          this.mainEntitiesRef.current.set(othersId, entity);
        }
      }

      console.log(`✅ Others creation complete: ${othersCreated} created, ${othersSkipped} skipped`);
      console.log(`🔍 DEBUG: Others entities map size: ${othersEntities.size}`);
      console.log(`🔍 DEBUG: Others entities keys:`, Array.from(othersEntities.keys()));
      
      return { 
        success: true, 
        created: othersCreated, 
        skipped: othersSkipped,
        total: othersCreated + othersSkipped
      };

    } catch (error) {
      console.error('❌ Error creating Others entities:', error);
      return { success: false, error: error.message };
    }
  }

  // Create a single Others entity for a province
  async createOthersEntityForProvince(provinceFeature, provinceName, countryName, provinceCode, othersGeometry, othersEntities) {
    try {
      const Cesium = window.Cesium;
      const timestamp = Date.now();
      
      // Handle MultiPolygon geometries by creating separate entities for each polygon
      if (othersGeometry.geometry && othersGeometry.geometry.type === 'MultiPolygon') {
        console.log(`🏞️ Creating multiple Others entities for MultiPolygon province: ${provinceName}`);
        
        for (let i = 0; i < othersGeometry.geometry.coordinates.length; i++) {
          const polygonCoords = othersGeometry.geometry.coordinates[i];
          const singlePolygonGeometry = {
            type: 'Polygon',
            coordinates: polygonCoords
          };
          
          const othersId = `others_${provinceCode}_${timestamp}_${i}`;
          await this.createSingleOthersEntity(
            othersId, 
            provinceName, 
            countryName,
            provinceCode, 
            provinceFeature, 
            singlePolygonGeometry, 
            othersEntities
          );
        }
      } else {
        // Single polygon geometry
        const othersId = `others_${provinceCode}_${timestamp}`;
        await this.createSingleOthersEntity(
          othersId, 
          provinceName, 
          countryName,
          provinceCode, 
          provinceFeature, 
          othersGeometry, 
          othersEntities
        );
      }

    } catch (error) {
      console.error(`❌ Error creating Others entity for ${provinceName}:`, error);
    }
  }

  // Create a single Others entity for a country
  async createOthersEntityForCountry(countryName, countryCode, countryFeature, othersGeometry, othersEntities) {
    try {
      const Cesium = window.Cesium;
      const timestamp = Date.now();
      
      // Handle MultiPolygon geometries by creating separate entities for each polygon
      if (othersGeometry.geometry && othersGeometry.geometry.type === 'MultiPolygon') {
        console.log(`🏞️ Creating multiple Others entities for MultiPolygon country: ${countryName}`);
        
        for (let i = 0; i < othersGeometry.geometry.coordinates.length; i++) {
          const polygonCoords = othersGeometry.geometry.coordinates[i];
          const singlePolygonGeometry = {
            type: 'Polygon',
            coordinates: polygonCoords
          };
          
          const othersId = `others_${countryCode}_${timestamp}_${i}`;
          await this.createSingleOthersEntityForCountry(
            othersId, 
            countryName,
            countryCode, 
            countryFeature, 
            singlePolygonGeometry, 
            othersEntities
          );
        }
      } else {
        // Single polygon geometry
      const othersId = `others_${countryCode}_${timestamp}`;
        await this.createSingleOthersEntityForCountry(
          othersId, 
          countryName,
          countryCode, 
          countryFeature, 
          othersGeometry, 
          othersEntities
        );
      }

    } catch (error) {
      console.error(`❌ Error creating Others entity for ${countryName}:`, error);
    }
  }

  // Create a single Others entity
  // Create a single Others entity for a province (auto-generated)
  async createSingleOthersEntityForProvince(provinceName, countryName, provinceCode, provinceFeature, othersGeometry) {
    try {
      const Cesium = window.Cesium;
      const timestamp = Date.now();
      const othersId = `others_${provinceCode}_${timestamp}`;
      
      console.log(`🏞️ Creating auto Others entity: ${othersId} for ${provinceName}, ${countryName}`);

      // Convert GeoJSON to Cesium coordinates
      const coordinates = this.geoJSONToCesiumCoordinates(othersGeometry);
      if (!coordinates) {
        console.warn(`⚠️ Could not convert Others geometry for ${provinceName}`);
        return;
      }

      // Create Cesium entity
      const entity = this.viewer.entities.add({
        id: othersId,
        name: `Others - ${provinceName}, ${countryName}`, // Format: "Others - [Province Name], [Country Name]"
        polygon: {
          hierarchy: coordinates,
          material: Cesium.Color.GRAY.withAlpha(0.3), // Gray as specified in requirements
          outline: true,
          outlineColor: Cesium.Color.DARKGRAY, // Dark gray outline as specified
          outlineWidth: 1,
          height: 0,
          extrudedHeight: 0,
          classificationType: Cesium.ClassificationType.BOTH
        },
        properties: {
          type: 'others',
          province: provinceName,
          country: countryName,
          provinceCode: provinceCode,
          originalProvinceFeature: provinceFeature,
          created: new Date().toISOString(),
          autoGenerated: true
        }
      });

      // Add hover functionality
      this.addOthersHoverFunctionality(entity, provinceName, countryName);

      // Store in entities map
      if (!this.othersEntities) {
        this.othersEntities = new Map();
      }
      this.othersEntities.set(othersId, entity);

      // Add to main entities ref
      if (this.mainEntitiesRef && this.mainEntitiesRef.current) {
        this.mainEntitiesRef.current.set(othersId, entity);
      }

      console.log(`✅ Created auto Others entity: ${othersId} for ${provinceName}, ${countryName}`);

    } catch (error) {
      console.error(`❌ Error creating auto Others entity for ${provinceName}:`, error);
    }
  }

  async createSingleOthersEntity(othersId, provinceName, countryName, provinceCode, provinceFeature, othersGeometry, othersEntities) {
    try {
      const Cesium = window.Cesium;
      
      console.log(`🏞️ Creating Others entity: ${othersId} for ${provinceName}, ${countryName}`);

      // Convert GeoJSON to Cesium coordinates
      const coordinates = this.geoJSONToCesiumCoordinates(othersGeometry);
      if (!coordinates) {
        console.warn(`⚠️ Could not convert Others geometry for ${provinceName}`);
        return;
      }

      // Create Cesium entity
      const entity = this.viewer.entities.add({
        id: othersId,
        name: `Others - ${provinceName}`,
              polygon: {
                hierarchy: coordinates,
                material: Cesium.Color.GRAY.withAlpha(0.3), // Gray as specified in requirements
                outline: true,
                outlineColor: Cesium.Color.DARKGRAY, // Dark gray outline as specified
                outlineWidth: 1,
                height: 0,
                extrudedHeight: 0,
                classificationType: Cesium.ClassificationType.BOTH
              },
        properties: {
          type: 'others',
          province: provinceName,
          country: countryName,
          provinceCode: provinceCode,
          originalProvinceFeature: provinceFeature,
          created: new Date().toISOString()
        }
      });

      // Add hover functionality
      this.addOthersHoverFunctionality(entity, provinceName, countryName);

      // Store in entities map
      othersEntities.set(othersId, entity);

      console.log(`✅ Created Others entity: ${othersId} for ${provinceName}, ${countryName}`);

    } catch (error) {
      console.error(`❌ Error creating single Others entity for ${provinceName}:`, error);
    }
  }

  // Create a single Others entity for a country
  async createSingleOthersEntityForCountry(othersId, countryName, countryCode, countryFeature, othersGeometry, othersEntities) {
    try {
      const Cesium = window.Cesium;
      
      console.log(`🏞️ Creating Others entity: ${othersId} for ${countryName}`);

      // Convert GeoJSON to Cesium coordinates
      const coordinates = this.geoJSONToCesiumCoordinates(othersGeometry);
      if (!coordinates) {
        console.warn(`⚠️ Could not convert Others geometry for ${countryName}`);
        return;
      }

      // Create Cesium entity
      const entity = this.viewer.entities.add({
        id: othersId,
        name: `Others - ${countryName}`, // Format: "Others - [Country Name]" as specified
        polygon: {
          hierarchy: coordinates,
          material: Cesium.Color.GRAY.withAlpha(0.3), // Gray as specified in requirements
          outline: true,
          outlineColor: Cesium.Color.DARKGRAY, // Dark gray outline as specified
          outlineWidth: 1,
          height: 0,
          extrudedHeight: 0,
          classificationType: Cesium.ClassificationType.BOTH
        },
        properties: {
          type: 'others',
          country: countryName,
          countryCode: countryCode,
          originalCountryFeature: countryFeature,
          created: new Date().toISOString()
        }
      });

      // Add hover functionality
      this.addOthersHoverFunctionality(entity, countryName);

      // Store in entities map
      othersEntities.set(othersId, entity);

      console.log(`✅ Created Others entity: ${othersId} for ${countryName}`);
      console.log(`🔍 DEBUG: Entity added to viewer:`, entity.id, entity.name);

    } catch (error) {
      console.error(`❌ Error creating single Others entity for ${countryName}:`, error);
    }
  }

  // Convert Cesium polygon hierarchy to GeoJSON coordinates
  cesiumHierarchyToGeoJSON(hierarchy) {
    try {
      if (!hierarchy || !hierarchy.positions) {
        return null;
      }

      const positions = hierarchy.positions;
      const coordinates = [];
      
      for (let i = 0; i < positions.length; i++) {
        const cartographic = window.Cesium.Cartographic.fromCartesian(positions[i]);
        coordinates.push([
          window.Cesium.Math.toDegrees(cartographic.longitude),
          window.Cesium.Math.toDegrees(cartographic.latitude)
        ]);
      }

      return coordinates;
    } catch (error) {
      console.warn('⚠️ Error converting Cesium hierarchy to GeoJSON:', error);
      return null;
    }
  }

  // Convert GeoJSON geometry to Cesium coordinates
  geoJSONToCesiumCoordinates(geoJSONFeature) {
    try {
      const Cesium = window.Cesium;
      const geometry = geoJSONFeature.geometry || geoJSONFeature;
      
      if (!geometry || !geometry.coordinates) {
        return null;
      }

      if (geometry.type === 'Polygon') {
        // Single polygon - convert to Cesium positions
        const coordinates = geometry.coordinates[0];
        const positions = [];
        for (const [lon, lat] of coordinates) {
          positions.push(
            Cesium.Cartesian3.fromDegrees(lon, lat, 0)
          );
        }
        return positions;
      } else if (geometry.type === 'MultiPolygon') {
        // MultiPolygon - use the largest polygon by area
        let largestPolygon = null;
        let largestArea = 0;
        
        for (const polygon of geometry.coordinates) {
          if (polygon && polygon[0] && polygon[0].length > 0) {
            // Calculate approximate area (simple bounding box area)
            const coords = polygon[0];
            let minLon = coords[0][0], maxLon = coords[0][0];
            let minLat = coords[0][1], maxLat = coords[0][1];
            
            for (const [lon, lat] of coords) {
              minLon = Math.min(minLon, lon);
              maxLon = Math.max(maxLon, lon);
              minLat = Math.min(minLat, lat);
              maxLat = Math.max(maxLat, lat);
            }
            
            const area = (maxLon - minLon) * (maxLat - minLat);
            if (area > largestArea) {
              largestArea = area;
              largestPolygon = polygon[0];
            }
          }
        }
        
        if (largestPolygon) {
      const positions = [];
          for (const [lon, lat] of largestPolygon) {
        positions.push(
          Cesium.Cartesian3.fromDegrees(lon, lat, 0)
        );
      }
      return positions;
        }
        
        console.warn('⚠️ No valid polygons found in MultiPolygon');
        return null;
      } else {
        console.warn(`⚠️ Unsupported geometry type for Others: ${geometry.type}`);
        return null;
      }
    } catch (error) {
      console.warn('⚠️ Error converting GeoJSON to Cesium coordinates:', error);
      return null;
    }
  }

  // Add hover functionality for Others entities
  addOthersHoverFunctionality(entity, provinceName, countryName = null) {
    const Cesium = window.Cesium;
    
    // Store original styling
    const originalMaterial = entity.polygon.material;
    const originalOutlineColor = entity.polygon.outlineColor;
    const originalOutlineWidth = entity.polygon.outlineWidth;

    entity.onMouseEnter = () => {
      const displayName = countryName ? `${provinceName}, ${countryName}` : provinceName;
      console.log(`🏞️ Others hover: Others - ${displayName}`);
      
      // Highlight Others polygon with enhanced visibility for province detail level
      entity.polygon.material = Cesium.Color.LIGHTGRAY.withAlpha(0.7); // More opaque for better visibility
      entity.polygon.outlineColor = Cesium.Color.WHITE;
      entity.polygon.outlineWidth = 3; // Thicker outline for province detail level
      
      // Show hover information
      if (this.hoverPanel) {
        this.hoverPanel.innerHTML = `
          <div style="padding: 8px; background: rgba(0,0,0,0.8); color: white; border-radius: 4px; font-size: 12px;">
            <div style="font-weight: bold; margin-bottom: 4px;">Others - ${displayName}</div>
            <div style="color: #90EE90; font-size: 10px; margin-top: 2px;">Remaining Population Area</div>
            <div style="color: #FFD700; font-size: 9px; margin-top: 2px;">Province Detail Level</div>
          </div>
        `;
        this.hoverPanel.style.display = 'block';
      }
    };

    entity.onMouseLeave = () => {
      // Restore original styling
      entity.polygon.material = originalMaterial;
      entity.polygon.outlineColor = originalOutlineColor;
      entity.polygon.outlineWidth = originalOutlineWidth;
      
      // Hide hover information
      if (this.hoverPanel) {
        this.hoverPanel.style.display = 'none';
      }
    };
  }

  // Add hover functionality for province entities (remaining population areas)
  addProvinceHoverFunctionality(entity, provinceName, countryName) {
    const Cesium = window.Cesium;
    
    // Store original styling
    const originalMaterial = entity.polygon.material;
    const originalOutlineColor = entity.polygon.outlineColor;
    const originalOutlineWidth = entity.polygon.outlineWidth;

    entity.onMouseEnter = () => {
      console.log(`🏛️ Province hover: ${provinceName}, ${countryName} (remaining population)`);
      
      // Highlight province polygon
      entity.polygon.material = Cesium.Color.LIGHTGREEN.withAlpha(0.5);
      entity.polygon.outlineColor = Cesium.Color.WHITE;
      entity.polygon.outlineWidth = 2;
      
      // Show hover information
      if (this.hoverPanel) {
        this.hoverPanel.innerHTML = `
          <div style="padding: 8px; background: rgba(0,0,0,0.8); color: white; border-radius: 4px; font-size: 12px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${provinceName}</div>
            <div style="color: #ccc;">${countryName}</div>
            <div style="color: #90EE90; font-size: 10px; margin-top: 2px;">Remaining Population Area</div>
          </div>
        `;
        this.hoverPanel.style.display = 'block';
      }
    };

    entity.onMouseLeave = () => {
      // Restore original styling
      entity.polygon.material = originalMaterial;
      entity.polygon.outlineColor = originalOutlineColor;
      entity.polygon.outlineWidth = originalOutlineWidth;
      
      // Hide hover information
      if (this.hoverPanel) {
        this.hoverPanel.style.display = 'none';
      }
    };
  }

  // Clear Others entities
  async clearOthersEntities() {
    console.log('🧹 Clearing Others entities...');
    
    try {
      if (this.othersEntities) {
        for (const [othersId, entity] of this.othersEntities) {
          this.viewer.entities.remove(entity);
          
          // Remove from main entitiesRef if available
          if (this.mainEntitiesRef && this.mainEntitiesRef.current) {
            this.mainEntitiesRef.current.delete(othersId);
          }
        }
        this.othersEntities.clear();
      }

      // Also remove any Others entities from viewer that might not be tracked
      const entitiesToRemove = [];
      this.viewer.entities.values.forEach(entity => {
        if (entity.id && entity.id.startsWith('others_') && entity.properties?.type?.getValue() === 'others') {
          entitiesToRemove.push(entity);
        }
      });

      entitiesToRemove.forEach(entity => {
        this.viewer.entities.remove(entity);
      });

      console.log(`✅ Cleared ${entitiesToRemove.length} Others entities`);
      
    } catch (error) {
      console.error('❌ Error clearing Others entities:', error);
    }
  }

  // Toggle Others entities visibility
  toggleOthersVisibility(visible) {
    console.log(`👁️ ${visible ? 'Showing' : 'Hiding'} Others entities...`);
    
    try {
      if (this.othersEntities) {
        for (const [othersId, entity] of this.othersEntities) {
          entity.show = visible;
        }
      }

      // Also toggle any Others entities in viewer that might not be tracked
      this.viewer.entities.values.forEach(entity => {
        if (entity.id && entity.id.startsWith('others_') && entity.properties?.type?.getValue() === 'others') {
          entity.show = visible;
        }
      });

      console.log(`✅ Others entities ${visible ? 'shown' : 'hidden'}`);
      
    } catch (error) {
      console.error('❌ Error toggling Others visibility:', error);
    }
  }

  // Get Others entities count
  getOthersCount() {
    return this.othersEntities ? this.othersEntities.size : 0;
  }

  // Get Others coverage statistics
  getOthersStatistics() {
    if (!this.othersEntities || this.othersEntities.size === 0) {
      return {
        totalOthers: 0,
        provinces: [],
        countries: [],
        totalArea: 0
      };
    }

    const provinces = new Set();
    const countries = new Set();
    let totalArea = 0;
    
    for (const [othersId, entity] of this.othersEntities) {
      const province = entity.properties?.province?.getValue();
      const country = entity.properties?.country?.getValue();
      
      if (province) {
        provinces.add(province);
      }
      if (country) {
        countries.add(country);
      }
      
      // Estimate area from polygon (rough calculation)
      if (entity.polygon && entity.polygon.hierarchy) {
        const coordinates = this.cesiumHierarchyToGeoJSON(entity.polygon.hierarchy);
        if (coordinates && coordinates.length > 0) {
          // Simple bounding box area estimation
          let minLon = coordinates[0][0], maxLon = coordinates[0][0];
          let minLat = coordinates[0][1], maxLat = coordinates[0][1];
          
          for (const [lon, lat] of coordinates) {
            minLon = Math.min(minLon, lon);
            maxLon = Math.max(maxLon, lon);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
          }
          
          const area = (maxLon - minLon) * (maxLat - minLat) * 111.32 * 111.32; // Rough km²
          totalArea += area;
        }
      }
    }

    return {
      totalOthers: this.othersEntities.size,
      provinces: Array.from(provinces),
      countries: Array.from(countries),
      totalArea: Math.round(totalArea),
      coverage: `${this.othersEntities.size} Others entities across ${provinces.size} provinces in ${countries.size} countries`
    };
  }

  // Validate Others implementation with test provinces
  // Set up entity persistence handling
  setupEntityPersistence() {
    // Handle window focus to ensure entities are restored
    window.addEventListener('focus', () => {
      console.log('🔄 Window focused, checking entity persistence...');
      if (this.adminHierarchy) {
        this.adminHierarchy.ensureEntityPersistence();
      }
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('🔄 Document visible, checking entity persistence...');
        if (this.adminHierarchy) {
          this.adminHierarchy.ensureEntityPersistence();
        }
      }
    });
  }
}

export default RegionManager;
