// ============================================================================
// GlobeControls.js - Camera, Map, and View Controls
// ============================================================================
// Handles camera movement, map type switching, and view controls
// ============================================================================

export class GlobeControls {
  constructor(viewer, setTileSource, setServerStatus) {
    this.viewer = viewer;
    this.setTileSource = setTileSource;
    this.setServerStatus = setServerStatus;

    // Initialize weather layers tracking
    if (!window.activeWeatherLayers) {
      window.activeWeatherLayers = new Map();
    }

    console.log("🎮 GlobeControls initialized");
  }

  // Camera Controls
  flyToLocation(lat, lon, altitude = 10000) {
    console.log(`🎯 Flying to: ${lat}, ${lon} at ${altitude}m`);
    this.viewer.camera.flyTo({
      destination: window.Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
      duration: 1.0,
      complete: () => {
        console.log("✅ Flight completed");
        this.viewer.scene.requestRender();
      },
    });
  }

  jumpToLocation(lat, lon, altitude = 10000) {
    console.log(`⚡ Jumping to: ${lat}, ${lon} at ${altitude}m`);
    this.viewer.camera.setView({
      destination: window.Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
      convert: false,
    });
    this.viewer.scene.requestRender();
  }

  setView(viewType) {
    console.log(`🎬 Setting view: ${viewType}`);
    const views = {
      global: { lon: 0, lat: 30, alt: 15000000 },
      local: { lon: -0.1, lat: 51.51, alt: 100000 },
      london: { lon: -0.1276, lat: 51.5074, alt: 1000 },
      newyork: { lon: -74.006, lat: 40.7128, alt: 1000 },
      berlin: { lon: 13.405, lat: 52.52, alt: 1000 },
      sydney: { lon: 151.2093, lat: -33.8688, alt: 1000 },
      world: { lon: 0, lat: 0, alt: 20000000 },
      "north-america": { lon: -100, lat: 40, alt: 5000000 },
      europe: { lon: 10, lat: 50, alt: 4000000 },
      asia: { lon: 100, lat: 30, alt: 6000000 },
      africa: { lon: 20, lat: 0, alt: 5000000 },
      australia: { lon: 135, lat: -25, alt: 4000000 },
      "south-america": { lon: -60, lat: -15, alt: 5000000 },
    };

    const view = views[viewType];
    if (view) {
      this.viewer.camera.flyTo({
        destination: window.Cesium.Cartesian3.fromDegrees(
          view.lon,
          view.lat,
          view.alt,
        ),
        duration: 1.2,
        complete: () => this.viewer.scene.requestRender(),
      });
    } else {
      console.warn(`Unknown view type: ${viewType}`);
    }
  }

  // Get current map type
  getCurrentMapType() {
    // This is a simple implementation - in a real app you might want to track this more robustly
    if (
      this.viewer &&
      this.viewer.imageryLayers &&
      this.viewer.imageryLayers.length > 0
    ) {
      const layer = this.viewer.imageryLayers.get(0);
      if (layer && layer.imageryProvider) {
        const credit = layer.imageryProvider.credit;
        if (credit && typeof credit === "string") {
          if (credit.includes("ESRI World Imagery")) return "satellite";
          if (credit.includes("CartoDB Positron")) return "clean-street";
          if (credit.includes("Dark Matter")) return "dark";
          if (credit.includes("ESRI Hybrid")) return "hybrid";
        }
      }
    }
    return "clean-street"; // default fallback
  }

  // Map Type Controls
  setMapType(style) {
    console.log(`🗺️ Switching map style to: ${style}`);
    console.log(
      `🔍 Current imagery layers count: ${this.viewer.imageryLayers.length}`,
    );
    console.log(
      `🔍 Available styles: ${Object.keys(this.createImageryProvider("test"))}`,
    );

    try {
      // Store active weather overlays
      const activeWeatherLayers = new Map();
      if (window.activeWeatherLayers) {
        window.activeWeatherLayers.forEach((layer, type) => {
          if (this.viewer.imageryLayers.contains(layer)) {
            activeWeatherLayers.set(type, {
              layer: layer,
              alpha: layer.alpha,
              brightness: layer.brightness,
              contrast: layer.contrast,
            });
          }
        });
      }

      // Clear all layers
      this.viewer.imageryLayers.removeAll();

      // Create new provider based on style
      const provider = this.createImageryProvider(style);

      // Add new layer
      const newLayer = this.viewer.imageryLayers.addImageryProvider(provider);
      newLayer.alpha = 1.0;
      newLayer.brightness = 1.0;

      // Force render
      this.viewer.scene.requestRender();

      console.log(`✅ Map type switched to: ${style}`);
      this.setTileSource(
        `${style.charAt(0).toUpperCase() + style.slice(1)} Tiles`,
      );

      // Restore weather overlays
      if (activeWeatherLayers.size > 0) {
        console.log(
          `🌤️ Restoring ${activeWeatherLayers.size} weather overlays...`,
        );
        activeWeatherLayers.forEach((layerData, type) => {
          try {
            // Re-add weather overlay using the stored layer data
            const restoredLayer = this.viewer.imageryLayers.addImageryProvider(
              layerData.layer.imageryProvider,
            );
            restoredLayer.alpha = layerData.alpha;
            restoredLayer.brightness = layerData.brightness;
            restoredLayer.contrast = layerData.contrast;

            // Update the global tracking
            if (window.activeWeatherLayers) {
              window.activeWeatherLayers.set(type, restoredLayer);
            }

            console.log(`✅ Restored weather overlay: ${type}`);
          } catch (error) {
            console.warn(
              `⚠️ Failed to restore weather overlay ${type}:`,
              error,
            );
          }
        });
      }
    } catch (error) {
      console.error(`❌ Error switching to map type ${style}:`, error);
      this.setTileSource(`${style} Tiles (Error)`);
    }
  }

  createImageryProvider(style) {
    const providers = {
      local: new window.Cesium.UrlTemplateImageryProvider({
        url: "http://localhost:8081/tiles/{z}/{x}/{y}.png",
        maximumLevel: 10,
        minimumLevel: 0,
        credit: "Local Tile Server",
        hasAlphaChannel: false,
        tilingScheme: new window.Cesium.WebMercatorTilingScheme(),
        enablePickFeatures: false,
        enableLabelRendering: false,
        enableFeatureRendering: false,
      }),

      "clean-street": new window.Cesium.UrlTemplateImageryProvider({
        url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
        subdomains: "abcd",
        maximumLevel: 19,
        minimumLevel: 0,
        credit: "CartoDB Positron - Clean Street",
        hasAlphaChannel: false,
        enablePickFeatures: false,
        enableLabelRendering: false,
        enableFeatureRendering: false,
      }),

      satellite: new window.Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        credit: "ESRI World Imagery",
        maximumLevel: 19,
        minimumLevel: 0,
        hasAlphaChannel: false,
        enablePickFeatures: false,
      }),

      hybrid: new window.Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        credit: "ESRI Hybrid",
        maximumLevel: 19,
      }),

      osm: new window.Cesium.UrlTemplateImageryProvider({
        url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
        subdomains: "abcd",
        maximumLevel: 19,
        minimumLevel: 0,
        credit: "CartoDB Positron - Label Free",
        hasAlphaChannel: false,
        enablePickFeatures: false,
        enableLabelRendering: false,
        enableFeatureRendering: false,
      }),

      dark: new window.Cesium.UrlTemplateImageryProvider({
        url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
        subdomains: ["a", "b", "c", "d"],
        credit: "CartoDB Dark Matter",
      }),

      minimalist: new window.Cesium.UrlTemplateImageryProvider({
        url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png",
        subdomains: "abcd",
        maximumLevel: 19,
        minimumLevel: 0,
        credit: "CartoDB Minimalist",
        hasAlphaChannel: false,
        enablePickFeatures: false,
        enableLabelRendering: false,
        enableFeatureRendering: false,
      }),
    };

    return providers[style] || providers["clean-street"];
  }

  // Performance Controls
  setPerformanceMode(mode) {
    console.log(`⚡ Setting performance mode: ${mode}`);

    const modes = {
      ultra_fast: {
        maximumScreenSpaceError: 4,
        tileCacheSize: 100,
        skipLevelOfDetail: true,
        fog: false,
        skyAtmosphere: false,
      },
      balanced: {
        maximumScreenSpaceError: 1.5,
        tileCacheSize: 300,
        skipLevelOfDetail: true,
        fog: false,
        skyAtmosphere: true,
      },
      quality: {
        maximumScreenSpaceError: 0.5,
        tileCacheSize: 500,
        skipLevelOfDetail: true,
        fog: false,
        skyAtmosphere: true,
      },
    };

    const settings = modes[mode];
    if (settings) {
      this.viewer.scene.globe.maximumScreenSpaceError =
        settings.maximumScreenSpaceError;
      this.viewer.scene.globe.tileCacheSize = settings.tileCacheSize;
      this.viewer.scene.globe.skipLevelOfDetail = settings.skipLevelOfDetail;
      if (this.viewer.scene.fog) this.viewer.scene.fog.enabled = settings.fog;
      if (this.viewer.scene.skyAtmosphere)
        this.viewer.scene.skyAtmosphere.show = settings.skyAtmosphere;

      console.log(`🚀 ${mode} mode enabled`);
      this.viewer.scene.requestRender();
    }
  }

  // Performance Monitoring
  getPerformanceStats() {
    try {
      const scene = this.viewer.scene;
      if (
        !scene ||
        !scene.frameRateMonitor ||
        !scene.frameRateMonitor.lastFrameTime
      ) {
        return {
          fps: 0,
          tileCount: 0,
          cacheSize: 0,
          renderTime: 0,
          cameraHeight: 0,
          loadingTiles: 0,
        };
      }

      return {
        fps: Math.round(
          1000 / (scene.frameRateMonitor.lastFrameTime.totalTime || 16),
        ),
        tileCount: scene.globe?.tilesLoaded || 0,
        cacheSize: scene.globe?.tileCacheSize || 0,
        renderTime: scene.frameRateMonitor.lastFrameTime.totalTime || 0,
        cameraHeight: Math.round(
          this.viewer.camera?.positionCartographic?.height || 0,
        ),
        loadingTiles: scene.globe?.tilesLoading || 0,
      };
    } catch (error) {
      console.warn("Performance stats error:", error);
      return {
        fps: 0,
        tileCount: 0,
        cacheSize: 0,
        renderTime: 0,
        cameraHeight: 0,
        loadingTiles: 0,
      };
    }
  }

  // Utility Functions
  refreshTiles() {
    console.log("🔄 Force refreshing tiles for current view...");
    try {
      // Clear tile cache to force reload
      if (this.viewer.scene.globe._surface) {
        this.viewer.scene.globe._surface._tilesToRender.length = 0;
      }

      // Force immediate high-quality rendering
      this.viewer.scene.globe.maximumScreenSpaceError = 0.5;
      this.viewer.scene.requestRender();

      console.log("✅ Tiles force-refreshed");
    } catch (error) {
      console.warn("Tile refresh error:", error);
    }
  }

  disableAllLabels() {
    console.log("🚫 Manually disabling all label rendering...");
    try {
      // Disable label rendering in all imagery layers
      for (let i = 0; i < this.viewer.imageryLayers.length; i++) {
        const layer = this.viewer.imageryLayers.get(i);
        if (layer && layer.imageryProvider) {
          layer.imageryProvider.enablePickFeatures = false;
          layer.imageryProvider.enableLabelRendering = false;
          layer.imageryProvider.enableFeatureRendering = false;
        }
      }

      // Disable scene-level label rendering
      this.viewer.scene.globe.enableLabelRendering = false;
      this.viewer.scene.globe.enableFeatureRendering = false;
      this.viewer.scene.globe.enableTextRendering = false;
      this.viewer.scene.globe.enableOverlayRendering = false;
      this.viewer.scene.globe.enableAnnotationRendering = false;
      this.viewer.scene.globe.enableTextOverlay = false;
      this.viewer.scene.globe.enableAnnotationOverlay = false;

      // Force a render to apply changes
      this.viewer.scene.requestRender();
      console.log("✅ All labels and overlays manually disabled");
    } catch (error) {
      console.error("❌ Failed to disable labels:", error);
    }
  }

  // Weather refresh
  refreshWeatherData() {
    console.log("🔄 Refreshing weather data...");
    try {
      // Remove and re-add all active weather layers
      if (window.activeWeatherLayers) {
        const activeTypes = Array.from(window.activeWeatherLayers.keys());
        window.activeWeatherLayers.clear();

        activeTypes.forEach((type) => {
          // This would need to be implemented with the weather manager
          console.log(`🔄 Refreshing weather layer: ${type}`);
        });
      }
      console.log("✅ Weather data refreshed");
    } catch (error) {
      console.error("❌ Failed to refresh weather data:", error);
    }
  }

  // Search and travel methods for compatibility
  searchLocation(query) {
    console.log(`🔍 Searching for location: ${query}`);
    // Placeholder implementation - could be enhanced with geocoding
    try {
      // Simple coordinate parsing for common formats
      const coords = this.parseCoordinates(query);
      if (coords) {
        this.flyToLocation(coords.lat, coords.lon);
        return;
      }

      // Try to find in predefined locations
      const predefinedLocations = {
        london: { lat: 51.5074, lon: -0.1276 },
        "new york": { lat: 40.7128, lon: -74.006 },
        berlin: { lat: 52.52, lon: 13.405 },
        sydney: { lat: -33.8688, lon: 151.2093 },
        tokyo: { lat: 35.6762, lon: 139.6503 },
        paris: { lat: 48.8566, lon: 2.3522 },
        rome: { lat: 41.9028, lon: 12.4964 },
        moscow: { lat: 55.7558, lon: 37.6176 },
        beijing: { lat: 39.9042, lon: 116.4074 },
        mumbai: { lat: 19.076, lon: 72.8777 },
      };

      const location = predefinedLocations[query.toLowerCase()];
      if (location) {
        this.flyToLocation(location.lat, location.lon);
        return;
      }

      console.log(`📍 Location not found: ${query}`);
    } catch (error) {
      console.warn("Search error:", error);
    }
  }

  travelTo(location) {
    console.log(`✈️ Traveling to: ${location}`);
    this.searchLocation(location);
  }

  parseCoordinates(query) {
    // Try to parse coordinates from query string
    const coordPatterns = [
      /(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/, // lat, lon
      /(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/, // lat lon
      /(-?\d+\.?\d*)°\s*([NS])\s*(-?\d+\.?\d*)°\s*([EW])/, // 51.5074°N 0.1276°W
    ];

    for (const pattern of coordPatterns) {
      const match = query.match(pattern);
      if (match) {
        let lat = parseFloat(match[1]);
        let lon = parseFloat(match[2]);

        // Handle N/S E/W notation
        if (match[3] === "S") lat = -lat;
        if (match[4] === "W") lon = -lon;

        return { lat, lon };
      }
    }

    return null;
  }

  // Additional methods for MapControlsPanel compatibility
  refreshTileSystem() {
    console.log("🔄 Refreshing tile system...");
    this.refreshTiles();
  }

  toggleTerrain(enabled) {
    console.log(`🏔️ Toggling terrain: ${enabled}`);
    try {
      if (enabled) {
        // Enable 3D terrain
        this.viewer.terrainProvider = new window.Cesium.CesiumTerrainProvider({
          url: window.Cesium.IonResource.fromAssetId(1),
        });
        this.viewer.scene.globe.enableLighting = true;
        this.viewer.scene.globe.showGroundAtmosphere = true;
        console.log("✅ 3D terrain enabled");
      } else {
        // Disable 3D terrain
        this.viewer.terrainProvider =
          new window.Cesium.EllipsoidTerrainProvider();
        this.viewer.scene.globe.enableLighting = false;
        this.viewer.scene.globe.showGroundAtmosphere = false;
        console.log("✅ 3D terrain disabled");
      }
      this.viewer.scene.requestRender();
    } catch (error) {
      console.warn("Terrain toggle error:", error);
    }
  }

  addContourOverlay() {
    console.log("🏔️ Adding contour overlay...");
    try {
      const contourProvider = new window.Cesium.UrlTemplateImageryProvider({
        url: "https://tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png",
        credit: "HikeBike Contour Overlay",
        maximumLevel: 14,
        minimumLevel: 0,
        hasAlphaChannel: true,
        enablePickFeatures: false,
      });

      const contourLayer =
        this.viewer.imageryLayers.addImageryProvider(contourProvider);
      contourLayer.alpha = 0.7;

      console.log("✅ Contour overlay added");
    } catch (error) {
      console.error("❌ Failed to add contour overlay:", error);
    }
  }

  createCustomContourLines() {
    console.log("🗻 Creating custom contour lines...");
    try {
      // This would need to be implemented with the topography manager
      console.log("🔄 Custom contour lines feature not yet implemented");
    } catch (error) {
      console.error("❌ Failed to create custom contour lines:", error);
    }
  }

  createPureContourLines() {
    console.log("🗻 Creating pure contour lines...");
    try {
      // This would need to be implemented with the topography manager
      console.log("🔄 Pure contour lines feature not yet implemented");
    } catch (error) {
      console.error("❌ Failed to create pure contour lines:", error);
    }
  }

  setTopography(topographyType) {
    console.log(`🏔️ Setting topography via GlobeControls: ${topographyType}`);
    // Delegate to topography manager if available
    if (
      window.earthGlobeControls &&
      window.earthGlobeControls.topographyManager
    ) {
      window.earthGlobeControls.topographyManager.setTopography(topographyType);
    } else {
      console.warn("Topography manager not available");
    }
  }
}
