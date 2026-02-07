// ============================================================================
// GlobeInitializer.js - Resilient Cesium Initialization and Configuration
// ============================================================================
// Handles Cesium viewer creation, configuration, and setup with error recovery
// ============================================================================

import { DEBUG_CONFIG } from '../../../workspace/constants.js';

export class GlobeInitializer {
  static retryCount = 0;
  static maxRetries = 2;

  static async initialize(container) {
    while (this.retryCount <= this.maxRetries) {
      try {
        if (DEBUG_CONFIG.CESIUM) console.log(`🌍 Initializing Cesium viewer... (attempt ${this.retryCount + 1})`);

        // Try local assets first, fallback to CDN
  window.CESIUM_BASE_URL = "/cesium/";
        if (DEBUG_CONFIG.CESIUM) console.log("✅ Cesium base path set to:", window.CESIUM_BASE_URL);

        // Load Cesium CSS
        try {
          await this.loadCesiumCSS();
        } catch (cssError) {
          if (DEBUG_CONFIG.CESIUM) console.log("⚠️ Local Cesium CSS loading failed:", cssError.message);
        }

        // Load Cesium JavaScript - with fallback
        try {
          await this.loadCesiumJS();
        } catch (localError) {
          if (DEBUG_CONFIG.CESIUM) console.log("⚠️ Local Cesium loading failed:", localError.message);
        }

        // Wait for Cesium to be ready
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (!window.Cesium) {
          if (DEBUG_CONFIG.CESIUM) console.log("🔄 Local assets failed, trying CDN fallback...");
          await this.loadCesiumFromCDN();
        }

        if (!window.Cesium) {
          throw new Error("Cesium failed to load from both local and CDN sources");
        }

        // Configure Cesium
        this.configureCesium();

        // Create viewer with error boundary
        const viewer = await this.createViewerWithErrorBoundary(container);

        // Configure viewer settings
        this.configureViewer(viewer);

        if (DEBUG_CONFIG.CESIUM) console.log("✅ Cesium viewer initialized successfully");
        this.retryCount = 0; // Reset on success
        return viewer;
      } catch (error) {
        this.retryCount++;
        console.error(`❌ Failed to initialize Cesium (attempt ${this.retryCount}):`, error);
        
        if (this.retryCount > this.maxRetries) {
          console.error("❌ Max retries exceeded, falling back to static mode");
          return this.createFallbackViewer(container);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
      }
    }
  }

  static createFallbackViewer(container) {
    console.log("🔧 Creating fallback static globe viewer...");
    
    // Create a simple fallback div with basic styling
    const fallbackDiv = document.createElement('div');
    fallbackDiv.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, #001122 0%, #003366 50%, #002244 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      position: relative;
    `;
    
    fallbackDiv.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">🌍</div>
        <div style="font-size: 18px; font-weight: 500; margin-bottom: 8px;">Globe Loading...</div>
        <div style="font-size: 14px; opacity: 0.7;">Using fallback mode</div>
      </div>
    `;
    
    container.appendChild(fallbackDiv);
    
    // Return a mock viewer object with minimal interface
    return {
      isFallback: true,
      container: fallbackDiv,
      scene: {
        requestRender: () => {},
        camera: {
          setView: () => {},
          height: 15000000
        }
      },
      entities: {
        add: () => ({ id: Math.random().toString() }),
        removeAll: () => {},
        removeById: () => {},
        values: []
      },
      destroy: () => {
        if (container.contains(fallbackDiv)) {
          container.removeChild(fallbackDiv);
        }
      }
    };
  }

  static async loadCesiumCSS() {
    if (!document.querySelector('link[href*="widgets.css"]')) {
      const cssLink = document.createElement("link");
      cssLink.rel = "stylesheet";
  cssLink.href = "/cesium/Widgets/widgets.css";
      cssLink.onload = () => {
        if (DEBUG_CONFIG.CESIUM) console.log("✅ Cesium CSS loaded");
      };
      cssLink.onerror = (event) => {
        const error = new Error(`Failed to load Cesium CSS: HTTP status unknown, URL: ${cssLink.href}`);
        console.error("❌ Cesium CSS load error:", error.message);
        throw error;
      };
      document.head.appendChild(cssLink);

      await new Promise((resolve, reject) => {
        cssLink.onload = resolve;
        cssLink.onerror = reject;
        if (cssLink.sheet) resolve();
      });
    }
  }

  static async loadCesiumJS() {
    if (!window.Cesium) {
      if (DEBUG_CONFIG.CESIUM) console.log("📦 Loading Cesium JavaScript...");
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
    script.src = "/cesium/Cesium.js";
        script.onload = () => {
          if (DEBUG_CONFIG.CESIUM) console.log("✅ Cesium JavaScript loaded, version:", window.Cesium?.VERSION || "unknown");
          resolve();
        };
        script.onerror = (event) => {
          const error = new Error(`Failed to load Cesium JavaScript: HTTP status unknown, URL: ${script.src}`);
          console.error("❌ Cesium JS load error:", error.message);
          reject(error);
        };
        document.head.appendChild(script);
      });
    }
  }

  static async loadCesiumFromCDN() {
    if (DEBUG_CONFIG.CESIUM) console.log("🔄 Loading Cesium from CDN fallback...");

    // Update base URL for CDN
    window.CESIUM_BASE_URL =
      "https://cesium.com/downloads/cesiumjs/releases/1.108/Build/Cesium/";

    // Load CSS from CDN
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href =
      "https://cesium.com/downloads/cesiumjs/releases/1.108/Build/Cesium/Widgets/widgets.css";
    document.head.appendChild(cssLink);

    // Load JavaScript from CDN
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cesium.com/downloads/cesiumjs/releases/1.108/Build/Cesium/Cesium.js";
      script.onload = () => {
        if (DEBUG_CONFIG.CESIUM) console.log("✅ Cesium loaded from CDN, version:", window.Cesium?.VERSION || "unknown");
        resolve();
      };
      script.onerror = (event) => {
        const error = new Error(`Failed to load Cesium from CDN: HTTP status unknown, URL: ${script.src}`);
        console.error("❌ CDN load error:", error.message);
        reject(error);
      };
      document.head.appendChild(script);
    });
  }

  static configureCesium() {
    if (DEBUG_CONFIG.CESIUM) console.log("🔧 Configuring Cesium...");

    // Disable Ion to prevent Ion-related errors
    if (window.Cesium.Ion) {
      window.Cesium.Ion.defaultAccessToken = undefined;
      if (DEBUG_CONFIG.CESIUM) console.log("🔧 Ion access token disabled to prevent errors");
    }

    // Configure build module URL for local assets first, fallback to CDN
    if (window.Cesium.buildModuleUrl) {
      try {
        // Try local assets first
  window.Cesium.buildModuleUrl.setBaseUrl('/cesium/');
  if (DEBUG_CONFIG.CESIUM) console.log("✅ Cesium buildModuleUrl configured for local assets: /cesium/");
      } catch (localError) {
        // Fallback to CDN
        window.Cesium.buildModuleUrl.setBaseUrl('https://cesium.com/downloads/cesiumjs/releases/1.108/Build/Cesium/');
        if (DEBUG_CONFIG.CESIUM) console.log("⚠️ Local assets failed, using CDN fallback: https://cesium.com/downloads/cesiumjs/releases/1.108/Build/Cesium/");
      }
    }

    if (DEBUG_CONFIG.CESIUM) console.log("✅ Cesium configuration completed");
  }

  static async createViewerWithErrorBoundary(container) {
    if (DEBUG_CONFIG.CESIUM) console.log("🌍 Creating Cesium viewer...");

    if (!container) {
      throw new Error("Container element not available");
    }

    try {
      if (DEBUG_CONFIG.CESIUM) console.log("🔧 Creating viewer with container:", container);
      if (DEBUG_CONFIG.CESIUM) console.log("🔧 Window.Cesium available:", !!window.Cesium);
      if (DEBUG_CONFIG.CESIUM) console.log("🔧 Cesium.Viewer available:", !!window.Cesium.Viewer);

      const viewer = new window.Cesium.Viewer(container, {
        terrainProvider: new window.Cesium.EllipsoidTerrainProvider(),
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        geocoder: false,
        requestRenderMode: false, // Keep rendering active for persistence
        maximumRenderTimeChange: Infinity,
        scene3DOnly: false,
        selectionIndicator: false,
        infoBox: false,
        creditContainer: document.createElement("div"),
        enablePickFeatures: false,
        enableLabelRendering: false,
        enableFeatureRendering: false,
        enableAnnotationRendering: false,
        // Use actual satellite imagery
        imageryProvider: new window.Cesium.UrlTemplateImageryProvider({
          url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          maximumLevel: 19,
          minimumLevel: 0,
          credit: "Esri, Maxar, Earthstar Geographics, and the GIS User Community",
          hasAlphaChannel: false,
          enablePickFeatures: false,
          enableLabelRendering: false,
          enableFeatureRendering: false,
        })
      });

      if (DEBUG_CONFIG.CESIUM) console.log("✅ Cesium viewer created successfully:", viewer);
      if (DEBUG_CONFIG.CESIUM) console.log("✅ Viewer scene available:", !!viewer.scene);
      if (DEBUG_CONFIG.CESIUM) console.log("✅ Viewer camera available:", !!viewer.camera);
      return viewer;
    } catch (error) {
      console.error("❌ Error creating Cesium viewer:", error);
      console.error("❌ Full error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  static configureViewer(viewer) {
    if (DEBUG_CONFIG.CESIUM) console.log("🔧 Configuring viewer settings...");

    // Skip configuration for fallback viewer
    if (viewer.isFallback) {
      return;
    }

    // Don't remove default imagery layers immediately - check if we have any first
    if (viewer.imageryLayers.length === 0) {
      console.warn("⚠️ No default imagery layers found, adding CartoDB satellite fallback...");
      
      // Add Esri satellite as emergency fallback
      try {
        const esriProvider = new window.Cesium.UrlTemplateImageryProvider({
          url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          maximumLevel: 19,
          minimumLevel: 0,
          credit: "Esri, Maxar, Earthstar Geographics, and the GIS User Community",
          hasAlphaChannel: false,
          enablePickFeatures: false,
          enableLabelRendering: false,
          enableFeatureRendering: false,
        });
        viewer.imageryLayers.addImageryProvider(esriProvider);
        if (DEBUG_CONFIG.CESIUM) console.log("✅ Esri satellite fallback imagery added");
      } catch (esriError) {
        console.error("❌ Failed to add Esri fallback:", esriError);
      }
    } else {
      if (DEBUG_CONFIG.CESIUM) console.log(`✅ Found ${viewer.imageryLayers.length} default imagery layers`);
    }

    // Keep the imagery provider that was set during viewer creation
    if (DEBUG_CONFIG.CESIUM) console.log("🔧 Using CartoDB satellite imagery provider set during viewer creation");
    
    /*
    // Only clear default imagery layers if we can successfully add our own
    let imageryProvider;
    try {
      // Check if Ion is available and has a valid token
      if (window.Cesium.Ion && window.Cesium.Ion.defaultAccessToken) {
        try {
          // Try Ion World Imagery first
          imageryProvider = new window.Cesium.IonImageryProvider({ assetId: 2 });
          if (DEBUG_CONFIG.CESIUM) console.log("✅ Ion World Imagery loaded");
        } catch (ionError) {
          if (DEBUG_CONFIG.CESIUM) console.log("⚠️ Ion imagery failed, using fallback:", ionError.message);
          imageryProvider = null;
        }
      }
      
      // Fallback to CartoDB if Ion fails or is unavailable
      if (!imageryProvider) {
        imageryProvider = new window.Cesium.UrlTemplateImageryProvider({
          url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
          subdomains: "abcd",
          maximumLevel: 19,
          minimumLevel: 0,
          credit: "CartoDB Positron - Clean Street",
          hasAlphaChannel: false,
          enablePickFeatures: false,
          enableLabelRendering: false,
          enableFeatureRendering: false,
        });
        if (DEBUG_CONFIG.CESIUM) console.log("✅ CartoDB fallback imagery loaded");
      }

      // Only now clear the default layers and add our custom imagery
      if (imageryProvider) {
        viewer.imageryLayers.removeAll();
        viewer.imageryLayers.addImageryProvider(imageryProvider);
        if (DEBUG_CONFIG.CESIUM) console.log("✅ Custom imagery provider added successfully");
      } else {
        console.warn("⚠️ Failed to create custom imagery provider, keeping default layers");
      }
      
    } catch (imageryError) {
      console.error("❌ Failed to configure imagery providers:", imageryError);
      console.log("🔄 Keeping default imagery layers as fallback");
      // Keep default imagery rather than having no imagery at all
    }
    */

    // Set initial camera position to show Earth properly
    viewer.camera.setView({
      destination: window.Cesium.Cartesian3.fromDegrees(0, 0, 20000000), // 20M meters for full Earth view
      orientation: {
        heading: 0.0,
        pitch: -window.Cesium.Math.PI_OVER_TWO, // Look straight down
        roll: 0.0,
      },
    });

    // Enable camera controls
    viewer.scene.screenSpaceCameraController.enableRotate = true;
    viewer.scene.screenSpaceCameraController.enableZoom = true;
    viewer.scene.screenSpaceCameraController.enablePan = true;

    // Configure globe settings for visibility
    viewer.scene.globe.show = true; // Ensure globe is visible
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.maximumScreenSpaceError = 1.0;
    viewer.scene.globe.tileCacheSize = 500;
    viewer.scene.globe.preloadSiblings = true;
    viewer.scene.globe.preloadAncestors = true;
    viewer.scene.fog.enabled = false;

    // Disable terrain clamping to prevent outline warnings
    viewer.scene.globe.enableTerrainClamping = false;
    viewer.scene.globe.enableTerrainClipping = false;

    // Disable problematic features but keep atmosphere for Earth visibility
    viewer.scene.globe.enableLabelRendering = false;
    viewer.scene.globe.enableFeatureRendering = false;
    viewer.scene.globe.enableTextRendering = false;
    viewer.scene.globe.enableOverlayRendering = false;
    viewer.scene.globe.enableCollisionDetection = false;
    viewer.scene.globe.enableDepthTestAgainstTerrain = false;
    viewer.scene.globe.enableFog = false;
    viewer.scene.globe.enableAtmosphere = true; // Keep atmosphere for Earth visibility

    // Force initial render
    viewer.scene.requestRender();

    if (DEBUG_CONFIG.CESIUM) console.log("✅ Viewer configuration completed");
  }
}
