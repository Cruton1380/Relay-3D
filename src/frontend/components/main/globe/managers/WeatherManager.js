// ============================================================================
// WeatherManager.js - Weather Overlay Management
// ============================================================================
// Handles weather data overlays and visualization
// ============================================================================

export class WeatherManager {
  constructor(viewer, setTileSource) {
    this.viewer = viewer;
    this.setTileSource = setTileSource;

    // Initialize weather layers tracking
    if (!window.activeWeatherLayers) {
      window.activeWeatherLayers = new Map();
    }

    console.log("🌤️ WeatherManager initialized");
  }

  // Add weather overlay
  addOverlay(overlayType) {
    console.log(`🌤️ Adding weather overlay: ${overlayType}`);

    // Safety check for viewer
    if (!this.viewer || !this.viewer.imageryLayers) {
      console.error("❌ Viewer not available for weather overlay");
      return;
    }

    try {
      let weatherProvider;
      let layerSettings = {};

      // Define weather data sources
      const weatherSources = {
        "weather-clouds": {
          name: "Global Cloud Coverage",
          url: "http://localhost:3002/api/globe/weather/clouds/{z}/{x}/{y}.png",
          fallbackUrl:
            "https://tilecache.rainviewer.com/v2/radar/1677669600/256/{z}/{x}/{y}/2/1_1.png",
          credit: "Global Cloud Coverage",
        },
        "weather-precipitation": {
          name: "Global Precipitation",
          url: "http://localhost:3002/api/globe/weather/precipitation/{z}/{x}/{y}.png",
          fallbackUrl:
            "https://tilecache.rainviewer.com/v2/radar/1677669600/256/{z}/{x}/{y}/2/1_1.png",
          credit: "Global Precipitation",
        },
        "weather-temperature": {
          name: "Global Temperature",
          url: "http://localhost:3002/api/globe/weather/temperature/{z}/{x}/{y}.png",
          fallbackUrl:
            "https://tiles.ecowatch.nas.nasa.gov/arcgis/rest/services/Temperature/Temperature_1km/MapServer/tile/{z}/{y}/{x}",
          credit: "Global Temperature",
        },
        "weather-radar": {
          name: "Weather Radar",
          url: "http://localhost:3002/api/globe/weather/radar/{z}/{x}/{y}.png",
          fallbackUrl:
            "https://tilecache.rainviewer.com/v2/radar/1677669600/256/{z}/{x}/{y}/2/1_1.png",
          credit: "Global Weather Radar",
        },
        "weather-snow": {
          name: "Global Snow Coverage",
          url: "http://localhost:3002/api/globe/weather/snow/{z}/{x}/{y}.png",
          fallbackUrl:
            "https://tiles.ecowatch.nas.nasa.gov/arcgis/rest/services/Snow/Snow_1km/MapServer/tile/{z}/{y}/{x}",
          credit: "Global Snow Coverage",
        },
      };

      const source = weatherSources[overlayType];
      if (!source) {
        console.warn(`Unknown weather overlay type: ${overlayType}`);
        return;
      }

      // Use backend API directly for reliable weather data
      console.log(
        `🌤️ Loading weather overlay: ${overlayType} from ${source.url}`,
      );

      try {
        weatherProvider = new window.Cesium.UrlTemplateImageryProvider({
          url: source.url,
          maximumLevel: 8,
          minimumLevel: 0,
          credit: source.credit,
          enablePickFeatures: false,
          hasAlphaChannel: true,
        });
      } catch (providerError) {
        console.error(
          `❌ Failed to create weather provider for ${overlayType}:`,
          providerError,
        );
        throw providerError;
      }

      // Set layer settings based on overlay type
      layerSettings = this.getLayerSettings(overlayType);

      // Add weather layer with optimized settings
      const weatherLayer =
        this.viewer.imageryLayers.addImageryProvider(weatherProvider);
      weatherLayer.alpha = layerSettings.alpha;
      weatherLayer.brightness = layerSettings.brightness;
      weatherLayer.contrast = layerSettings.contrast;

      // Force a render to ensure the weather layer is visible
      this.viewer.scene.requestRender();

      console.log(`🌤️ Weather layer added with settings:`, {
        alpha: layerSettings.alpha,
        brightness: layerSettings.brightness,
        contrast: layerSettings.contrast,
        layerCount: this.viewer.imageryLayers.length,
      });

      // Store layer reference for easy removal
      window.activeWeatherLayers.set(overlayType, weatherLayer);

      // Update tile source to show global weather is active
      this.setTileSource(`Global ${source.name} (Active)`);

      console.log(`✅ Weather overlay added: ${overlayType} (GLOBAL coverage)`);

      // Add error event listener to handle tile loading failures gracefully
      weatherProvider.errorEvent.addEventListener((error) => {
        console.warn(
          `⚠️ Weather tile loading issue for ${overlayType}:`,
          error,
        );
        console.log(`💡 Trying fallback to external weather tiles...`);

        this.handleWeatherFallback(
          overlayType,
          source,
          layerSettings,
          weatherLayer,
        );
      });
    } catch (error) {
      console.error(`❌ Failed to add weather overlay ${overlayType}:`, error);
      console.log("💡 Make sure the local tile server is running on port 8081");
    }
  }

  // Get layer settings for weather type
  getLayerSettings(overlayType) {
    const settings = {
      "weather-clouds": { alpha: 0.6, brightness: 1.2, contrast: 1.3 },
      "weather-precipitation": { alpha: 0.75, brightness: 1.4, contrast: 1.5 },
      "weather-temperature": { alpha: 0.75, brightness: 1.2, contrast: 1.3 },
      "weather-radar": { alpha: 0.85, brightness: 1.4, contrast: 1.5 },
      "weather-snow": { alpha: 0.8, brightness: 1.3, contrast: 1.4 },
    };

    return (
      settings[overlayType] || { alpha: 0.7, brightness: 1.0, contrast: 1.0 }
    );
  }

  // Handle weather fallback
  handleWeatherFallback(overlayType, source, layerSettings, originalLayer) {
    try {
      if (!source.fallbackUrl) {
        console.warn(`⚠️ No fallback URL available for ${overlayType}`);
        return;
      }

      const fallbackProvider = new window.Cesium.UrlTemplateImageryProvider({
        url: source.fallbackUrl,
        maximumLevel: 8,
        minimumLevel: 0,
        credit: `${source.credit} (External Fallback)`,
        enablePickFeatures: false,
        hasAlphaChannel: true,
      });

      // Replace the failed layer with fallback
      if (originalLayer && this.viewer.imageryLayers.contains(originalLayer)) {
        this.viewer.imageryLayers.remove(originalLayer);
      }
      const fallbackLayer =
        this.viewer.imageryLayers.addImageryProvider(fallbackProvider);
      fallbackLayer.alpha = layerSettings.alpha;
      fallbackLayer.brightness = layerSettings.brightness;
      fallbackLayer.contrast = layerSettings.contrast;

      window.activeWeatherLayers.set(overlayType, fallbackLayer);
      console.log(
        `✅ Fallback weather overlay loaded: ${overlayType} (external API)`,
      );
    } catch (fallbackError) {
      console.error(
        `❌ Fallback weather overlay also failed: ${overlayType}`,
        fallbackError,
      );
      // Remove the failed layer completely
      if (originalLayer && this.viewer.imageryLayers.contains(originalLayer)) {
        this.viewer.imageryLayers.remove(originalLayer);
      }
      window.activeWeatherLayers.delete(overlayType);
    }
  }

  // Remove weather overlay
  removeOverlay(overlayType) {
    console.log(`🗑️ Removing weather overlay: ${overlayType}`);

    // Safety check for viewer
    if (!this.viewer || !this.viewer.imageryLayers) {
      console.error("❌ Viewer not available for weather overlay removal");
      return;
    }

    try {
      // Use stored layer references for precise removal
      if (
        window.activeWeatherLayers &&
        window.activeWeatherLayers.has(overlayType)
      ) {
        const layer = window.activeWeatherLayers.get(overlayType);
        this.viewer.imageryLayers.remove(layer);
        window.activeWeatherLayers.delete(overlayType);
        console.log(`✅ Removed weather overlay: ${overlayType}`);
        this.setTileSource("Weather Cleared");
        return;
      }

      // Fallback: Remove by credit matching
      const layersToRemove = [];
      for (let i = 0; i < this.viewer.imageryLayers.length; i++) {
        const layer = this.viewer.imageryLayers.get(i);
        const credit = layer.imageryProvider.credit;
        if (
          credit &&
          (credit.includes(overlayType.replace("-", " ")) ||
            credit.includes("Weather") ||
            credit.includes("OpenWeatherMap") ||
            credit.includes("RainViewer"))
        ) {
          layersToRemove.push(i);
        }
      }

      // Remove layers in reverse order
      layersToRemove.reverse().forEach((index) => {
        this.viewer.imageryLayers.remove(this.viewer.imageryLayers.get(index));
      });

      console.log(`✅ Removed ${layersToRemove.length} weather overlay layers`);
    } catch (error) {
      console.error(
        `❌ Failed to remove weather overlay ${overlayType}:`,
        error,
      );
    }
  }

  // Clear all weather overlays
  clearWeather() {
    console.log("🧹 Clearing all weather overlays...");

    // Safety check for viewer
    if (!this.viewer || !this.viewer.imageryLayers) {
      console.error("❌ Viewer not available for weather clearing");
      return;
    }

    try {
      // Remove all stored weather layers
      if (window.activeWeatherLayers) {
        window.activeWeatherLayers.forEach((layer, type) => {
          try {
            if (layer && this.viewer.imageryLayers.contains(layer)) {
              this.viewer.imageryLayers.remove(layer);
              console.log(`🗑️ Removed weather layer: ${type}`);
            }
          } catch (e) {
            console.warn(`⚠️ Could not remove weather layer ${type}:`, e);
          }
        });
        window.activeWeatherLayers.clear();
      }

      // Fallback: Remove any remaining weather layers by credit
      const layersToRemove = [];
      for (let i = 0; i < this.viewer.imageryLayers.length; i++) {
        const layer = this.viewer.imageryLayers.get(i);
        if (layer && layer.imageryProvider && layer.imageryProvider.credit) {
          const credit = layer.imageryProvider.credit;
          // Check if credit is a string before using includes
          if (
            typeof credit === "string" &&
            (credit.includes("Weather") ||
              credit.includes("OpenWeatherMap") ||
              credit.includes("RainViewer"))
          ) {
            layersToRemove.push(i);
          }
        }
      }

      // Remove layers in reverse order
      layersToRemove.reverse().forEach((index) => {
        this.viewer.imageryLayers.remove(this.viewer.imageryLayers.get(index));
      });

      console.log(
        `✅ Cleared all weather overlays (${layersToRemove.length} layers removed)`,
      );

      // Force a render to clear any pending tile requests
      this.viewer.scene.requestRender();

      // Force main map to reload after clearing weather overlays
      setTimeout(() => {
        this.viewer.scene.requestRender();
        console.log(
          "🔄 Forced main map refresh after clearing weather overlays",
        );
      }, 1000);
    } catch (error) {
      console.error("❌ Failed to clear weather overlays:", error);
    }
  }

  // Refresh weather data
  refreshWeatherData() {
    console.log("🔄 Refreshing weather data...");
    try {
      // Remove and re-add all active weather layers
      if (window.activeWeatherLayers) {
        const activeTypes = Array.from(window.activeWeatherLayers.keys());
        window.activeWeatherLayers.clear();

        activeTypes.forEach((type) => {
          this.removeOverlay(type);
          setTimeout(() => {
            this.addOverlay(type);
          }, 100);
        });
      }
      console.log("✅ Weather data refreshed");
    } catch (error) {
      console.error("❌ Failed to refresh weather data:", error);
    }
  }

  // Add simple weather layer (legacy function)
  addWeatherLayer(layerType) {
    console.log(`🌤️ Adding weather layer: ${layerType}`);
    try {
      // Remove existing weather layers first
      const layersToRemove = [];
      for (let i = 0; i < this.viewer.imageryLayers.length; i++) {
        const layer = this.viewer.imageryLayers.get(i);
        const credit = layer.imageryProvider.credit;
        if (
          credit &&
          (typeof credit === "string"
            ? credit.includes("Weather")
            : credit.text && credit.text.includes("Weather"))
        ) {
          layersToRemove.push(layer);
        }
      }
      layersToRemove.forEach((layer) =>
        this.viewer.imageryLayers.remove(layer),
      );

      if (layerType === "none") {
        console.log("✅ Weather layers removed");
        return;
      }

      let weatherProvider;
      switch (layerType) {
        case "europe":
          weatherProvider = new window.Cesium.UrlTemplateImageryProvider({
            url: "https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_1.png",
            credit: "RainViewer Weather (Europe)",
            maximumLevel: 8,
          });
          break;

        case "usa":
          weatherProvider = new window.Cesium.UrlTemplateImageryProvider({
            url: "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png",
            credit: "Iowa State Weather (USA)",
            maximumLevel: 8,
          });
          break;

        case "auto":
          weatherProvider = new window.Cesium.UrlTemplateImageryProvider({
            url: "https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=demo",
            credit: "OpenWeatherMap Weather",
            maximumLevel: 10,
          });
          break;

        default:
          console.warn(`Unknown weather layer: ${layerType}`);
          return;
      }

      // Add weather layer with transparency
      const weatherLayer =
        this.viewer.imageryLayers.addImageryProvider(weatherProvider);
      weatherLayer.alpha = 0.6;
      weatherLayer.brightness = 1.0;

      console.log(`✅ Weather layer added: ${layerType}`);
    } catch (error) {
      console.error(`❌ Weather layer failed: ${layerType}`, error);
      console.log("💡 Weather layers require internet connection");
    }
  }
}
