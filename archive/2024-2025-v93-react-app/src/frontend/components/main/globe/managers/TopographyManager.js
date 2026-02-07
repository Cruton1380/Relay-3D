// ============================================================================
// TopographyManager.js - Terrain and Elevation Visualization
// ============================================================================
// Handles topographic maps, 3D terrain, and elevation visualization
// ============================================================================

export class TopographyManager {
  constructor(viewer, setTileSource) {
    this.viewer = viewer;
    this.setTileSource = setTileSource;

    console.log("🏔️ TopographyManager initialized");
  }

  // Set topography type
  setTopography(topographyType) {
    console.log(`🏔️ Setting topography to: ${topographyType}`);

    // Handle null/undefined topography type
    if (!topographyType) {
      console.log("🔄 No topography selected, clearing topography layers");
      this.clearTopography();
      return;
    }

    try {
      // Clear existing topography layers
      this.viewer.imageryLayers.removeAll();

      // Clear any custom materials
      try {
        this.viewer.scene.globe.material = undefined;
      } catch (e) {
        console.warn("Could not clear custom material:", e);
      }

      // Disable 3D terrain by default
      this.viewer.terrainProvider =
        new window.Cesium.EllipsoidTerrainProvider();
      this.viewer.scene.globe.enableLighting = false;
      this.viewer.scene.globe.showGroundAtmosphere = false;
      this.viewer.scene.globe.showWaterEffect = false;

      let baseProvider;

      switch (topographyType) {
        case "contour-data":
          baseProvider = this.createContourDataProvider();
          break;

        case "3d-terrain":
          baseProvider = this.create3DTerrainProvider();
          break;

        case "elevation-heatmap":
          baseProvider = this.createElevationHeatmapProvider();
          break;

        default:
          console.log("🔄 No topography selected, using clean street map");
          baseProvider = this.createCleanStreetProvider();
          break;
      }

      // Add the base provider
      if (baseProvider) {
        const baseLayer =
          this.viewer.imageryLayers.addImageryProvider(baseProvider);
        baseLayer.alpha = 1.0;
        baseLayer.brightness = 1.0;

        // Force a render to ensure the topography is visible
        this.viewer.scene.requestRender();

        console.log(`✅ Topography set to: ${topographyType}`);
        this.setTileSource(
          `${topographyType.charAt(0).toUpperCase() + topographyType.slice(1)} (Active)`,
        );
      }
    } catch (error) {
      console.error(`❌ Failed to set topography ${topographyType}:`, error);
      this.setTileSource("Topography Error");

      // Fallback to clean street map
      this.fallbackToCleanStreet();
    }
  }

  // Create contour data provider
  createContourDataProvider() {
    console.log("🗻 Loading topography (OpenTopoMap)...");
    try {
      return new window.Cesium.UrlTemplateImageryProvider({
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        subdomains: "abc",
        credit: "OpenTopoMap - Topographic Contours",
        maximumLevel: 17,
        minimumLevel: 0,
        hasAlphaChannel: false,
        enablePickFeatures: false,
      });
    } catch (e) {
      console.warn("OpenTopoMap failed, using ESRI World Topo fallback:", e);
      return new window.Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        credit: "ESRI World Topo - Topographic Fallback",
        maximumLevel: 19,
        minimumLevel: 0,
        hasAlphaChannel: false,
        enablePickFeatures: false,
      });
    }
  }

  // Create 3D terrain provider
  create3DTerrainProvider() {
    console.log("🏔️ Loading terrain (ESRI Hillshade)...");
    try {
      // Primary: ESRI Hillshade for pronounced terrain features
      return new window.Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
        credit: "ESRI Hillshade - 3D Terrain",
        maximumLevel: 19,
        minimumLevel: 0,
        hasAlphaChannel: false,
        enablePickFeatures: false,
      });
    } catch (e) {
      console.warn("ESRI Hillshade failed, trying ESRI World Imagery:", e);
      try {
        return new window.Cesium.UrlTemplateImageryProvider({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          credit: "ESRI World Imagery - Terrain Fallback",
          maximumLevel: 19,
          minimumLevel: 0,
          hasAlphaChannel: false,
          enablePickFeatures: false,
        });
      } catch (e2) {
        console.warn(
          "ESRI World Imagery failed, using OpenTopoMap fallback:",
          e2,
        );
        return new window.Cesium.UrlTemplateImageryProvider({
          url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
          subdomains: "abc",
          credit: "OpenTopoMap - Terrain Fallback",
          maximumLevel: 17,
          minimumLevel: 0,
          hasAlphaChannel: false,
          enablePickFeatures: false,
        });
      }
    }
  }

  // Create elevation heatmap provider
  createElevationHeatmapProvider() {
    console.log("🔥 Loading elevation heatmap (color-coded)...");
    try {
      // Primary: ESRI World Topo for rich elevation colors
      return new window.Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        credit: "ESRI World Topo - Elevation Heatmap",
        maximumLevel: 19,
        minimumLevel: 0,
        hasAlphaChannel: false,
        enablePickFeatures: false,
      });
    } catch (e) {
      console.warn("ESRI World Topo failed, trying Stadia Maps:", e);
      try {
        return new window.Cesium.UrlTemplateImageryProvider({
          url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png",
          credit: "Stadia Maps - Elevation Heatmap",
          maximumLevel: 18,
          minimumLevel: 0,
          hasAlphaChannel: false,
          enablePickFeatures: false,
        });
      } catch (e2) {
        console.warn("Stadia Maps failed, using OpenTopoMap fallback:", e2);
        return new window.Cesium.UrlTemplateImageryProvider({
          url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
          subdomains: "abc",
          credit: "OpenTopoMap - Elevation Heatmap Fallback",
          maximumLevel: 17,
          minimumLevel: 0,
          hasAlphaChannel: false,
          enablePickFeatures: false,
        });
      }
    }
  }

  // Create clean street provider
  createCleanStreetProvider() {
    return new window.Cesium.UrlTemplateImageryProvider({
      url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
      subdomains: "abcd",
      credit: "CartoDB Positron - Clean Street",
      maximumLevel: 19,
      minimumLevel: 0,
      hasAlphaChannel: false,
      enablePickFeatures: false,
    });
  }

  // Fallback to clean street map
  fallbackToCleanStreet() {
    const fallbackProvider = this.createCleanStreetProvider();

    this.viewer.imageryLayers.removeAll();
    const fallbackLayer =
      this.viewer.imageryLayers.addImageryProvider(fallbackProvider);
    fallbackLayer.alpha = 1.0;
    fallbackLayer.brightness = 1.0;
  }

  // Clear topography and reset to clean street map
  clearTopography() {
    console.log("🗺️ Clearing topography and resetting to clean street map...");
    try {
      // Remove all imagery layers
      this.viewer.imageryLayers.removeAll();

      // Reset to clean street map
      const cleanStreetProvider = this.createCleanStreetProvider();
      this.viewer.imageryLayers.addImageryProvider(cleanStreetProvider);

      // Reset terrain to default
      this.viewer.terrainProvider =
        new window.Cesium.EllipsoidTerrainProvider();
      this.viewer.scene.globe.enableLighting = false;
      this.viewer.scene.globe.showGroundAtmosphere = true;
      this.viewer.scene.globe.showWaterEffect = false;

      // Clear any custom materials
      try {
        this.viewer.scene.globe.material = undefined;
      } catch (e) {
        console.warn("Could not clear custom material:", e);
      }

      console.log("✅ Topography cleared, reset to clean street map");
    } catch (error) {
      console.error("❌ Failed to clear topography:", error);
    }
  }

  // Toggle terrain
  toggleTerrain(enabled) {
    console.log(`🏔️ Toggling terrain: ${enabled}`);
    try {
      if (enabled) {
        // Enable terrain using EllipsoidTerrainProvider for offline compatibility
        this.viewer.terrainProvider =
          new window.Cesium.EllipsoidTerrainProvider();
        console.log("✅ Terrain enabled (Ellipsoid)");
      } else {
        // Disable terrain (flat earth)
        this.viewer.terrainProvider =
          new window.Cesium.EllipsoidTerrainProvider();
        console.log("✅ Terrain disabled");
      }
    } catch (error) {
      console.error("❌ Terrain toggle failed:", error);
      // Fallback to ellipsoid
      this.viewer.terrainProvider =
        new window.Cesium.EllipsoidTerrainProvider();
    }
  }

  // Enable topographic mode with elevation
  enableTopographicMode() {
    console.log("🏔️ Enabling topographic mode with elevation...");
    try {
      // Enable terrain for elevation visualization using EllipsoidTerrainProvider
      this.viewer.terrainProvider =
        new window.Cesium.EllipsoidTerrainProvider();

      // Set globe properties for better elevation visualization
      this.viewer.scene.globe.enableLighting = true;
      this.viewer.scene.globe.showGroundAtmosphere = true;
      this.viewer.scene.globe.showWaterEffect = true;

      console.log("✅ Topographic mode with elevation enabled (Ellipsoid)");
    } catch (error) {
      console.error("❌ Failed to enable topographic mode:", error);
    }
  }

  // Disable topographic mode
  disableTopographicMode() {
    console.log("🏔️ Disabling topographic mode...");
    try {
      // Disable terrain
      this.viewer.terrainProvider =
        new window.Cesium.EllipsoidTerrainProvider();

      // Reset globe properties
      this.viewer.scene.globe.enableLighting = false;
      this.viewer.scene.globe.showGroundAtmosphere = false;
      this.viewer.scene.globe.showWaterEffect = false;

      console.log("✅ Topographic mode disabled");
    } catch (error) {
      console.error("❌ Failed to disable topographic mode:", error);
    }
  }

  // Add contour overlay
  addContourOverlay() {
    console.log("🏔️ Adding contour line overlay...");
    try {
      // Add additional contour line overlay for enhanced visualization
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
      contourLayer.alpha = 0.7; // Semi-transparent overlay

      console.log("✅ Contour overlay added");
    } catch (error) {
      console.error("❌ Failed to add contour overlay:", error);
    }
  }

  // Create custom contour lines
  createCustomContourLines() {
    console.log("🗻 Creating custom contour lines...");
    try {
      // Start with a clean base map
      const baseProvider = this.createCleanStreetProvider();

      this.viewer.imageryLayers.removeAll();
      const baseLayer =
        this.viewer.imageryLayers.addImageryProvider(baseProvider);
      baseLayer.alpha = 1.0;

      // Add OpenTopoMap for contour lines
      setTimeout(() => {
        try {
          const topoProvider = new window.Cesium.UrlTemplateImageryProvider({
            url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
            subdomains: "abc",
            credit: "OpenTopoMap - Contour Lines",
            maximumLevel: 17,
            minimumLevel: 0,
            hasAlphaChannel: true,
            enablePickFeatures: false,
          });

          const topoLayer =
            this.viewer.imageryLayers.addImageryProvider(topoProvider);
          topoLayer.alpha = 0.8; // High opacity for clear contour lines

          console.log("✅ Custom contour lines created");
          this.setTileSource("Custom Contour Lines");
        } catch (e) {
          console.warn("Failed to add OpenTopoMap contour lines:", e);
        }
      }, 300);
    } catch (error) {
      console.error("❌ Failed to create custom contour lines:", error);
    }
  }

  // Create pure contour line visualization
  createPureContourLines() {
    console.log("🗻 Creating pure contour lines...");
    try {
      // Use OpenTopoMap as the primary source for contour lines
      const contourProvider = new window.Cesium.UrlTemplateImageryProvider({
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        subdomains: "abc",
        credit: "OpenTopoMap - Pure Contour Lines",
        maximumLevel: 17,
        minimumLevel: 0,
        hasAlphaChannel: false,
        enablePickFeatures: false,
      });

      this.viewer.imageryLayers.removeAll();
      const contourLayer =
        this.viewer.imageryLayers.addImageryProvider(contourProvider);
      contourLayer.alpha = 1.0;

      // Enable terrain for better contour visualization
      this.viewer.terrainProvider =
        new window.Cesium.EllipsoidTerrainProvider();
      this.viewer.scene.globe.enableLighting = true;
      this.viewer.scene.globe.showGroundAtmosphere = true;

      console.log("✅ Pure contour lines created");
      this.setTileSource("Pure Contour Lines");
    } catch (error) {
      console.error("❌ Failed to create pure contour lines:", error);
    }
  }

  // Compatibility methods for MapControlsPanel
  addTopography(topographyType) {
    console.log(`🏔️ Adding topography: ${topographyType}`);
    this.setTopography(topographyType);
  }

  removeTopography(topographyType) {
    console.log(`🗑️ Removing topography: ${topographyType}`);
    // For now, just clear all topography
    this.clearTopography();
  }
}
