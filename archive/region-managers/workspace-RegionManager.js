// ============================================================================
// RegionManager.js - Country and State Boundary Management
// ============================================================================
// Handles loading, rendering, and management of geographic boundaries
// ============================================================================

import { DEBUG_CONFIG } from '../../../constants.js';

export class RegionManager {
  // Static reference table for expected ADM1 province counts by country
  static ADM1_COUNTS = {
    // Major countries with provinces
    Russia: 83,
    Canada: 13,
    Brazil: 27,
    India: 36,
    "United States": 51,
    China: 31,
    Australia: 8,
    Argentina: 24,
    Mexico: 32,
    "South Africa": 9,
    Germany: 16,
    France: 18,
    Italy: 20,
    Spain: 17,
    Poland: 16,
    Ukraine: 24,
    Turkey: 81,
    Iran: 31,
    Pakistan: 4,
    Afghanistan: 34,
    Myanmar: 14,
    Thailand: 77,
    Vietnam: 63,
    Philippines: 81,
    Indonesia: 34,
    Malaysia: 13,
    Japan: 47,
    "South Korea": 17,
    "North Korea": 9,
    Mongolia: 21,
    Kazakhstan: 14,
    Uzbekistan: 12,
    Kyrgyzstan: 7,
    Tajikistan: 3,
    Turkmenistan: 5,
    Azerbaijan: 66,
    Georgia: 9,
    Armenia: 10,
    Belarus: 6,
    Moldova: 32,
    Romania: 41,
    Bulgaria: 28,
    Greece: 13,
    Albania: 12,
    "North Macedonia": 80,
    Serbia: 24,
    Croatia: 20,
    Slovenia: 12,
    "Bosnia and Herzegovina": 10,
    Montenegro: 21,
    Kosovo: 7,
    Hungary: 19,
    Slovakia: 8,
    "Czech Republic": 13,
    Austria: 9,
    Switzerland: 26,
    Netherlands: 12,
    Belgium: 10,
    Luxembourg: 3,
    Denmark: 5,
    Norway: 18,
    Sweden: 21,
    Finland: 19,
    Iceland: 8,
    Ireland: 26,
    "United Kingdom": 207,
    Portugal: 18,
    Morocco: 12,
    Algeria: 48,
    Tunisia: 24,
    Libya: 22,
    Egypt: 27,
    Sudan: 18,
    "South Sudan": 10,
    Ethiopia: 11,
    Eritrea: 6,
    Djibouti: 6,
    Somalia: 18,
    Kenya: 47,
    Uganda: 111,
    Tanzania: 30,
    Rwanda: 5,
    Burundi: 18,
    "Democratic Republic of the Congo": 26,
    "Republic of the Congo": 12,
    "Central African Republic": 14,
    Cameroon: 10,
    Nigeria: 37,
    Niger: 8,
    Chad: 23,
    Mali: 10,
    "Burkina Faso": 13,
    Senegal: 14,
    Gambia: 5,
    "Guinea-Bissau": 8,
    Guinea: 8,
    "Sierra Leone": 4,
    Liberia: 15,
    "Cote d'Ivoire": 12,
    Ghana: 16,
    Togo: 5,
    Benin: 12,
    "Equatorial Guinea": 7,
    Gabon: 9,
    "Sao Tome and Principe": 2,
    Angola: 18,
    Zambia: 10,
    Malawi: 28,
    Mozambique: 10,
    Zimbabwe: 10,
    Botswana: 10,
    Namibia: 14,
    Lesotho: 10,
    Eswatini: 4,
    Madagascar: 22,
    Comoros: 3,
    Mauritius: 9,
    Seychelles: 25,
    "Cape Verde": 22,
    Mauritania: 12,
    "Western Sahara": 3,
    Chile: 16,
    Peru: 25,
    Ecuador: 24,
    Colombia: 33,
    Venezuela: 23,
    Guyana: 10,
    Suriname: 10,
    "French Guiana": 2,
    Uruguay: 19,
    Paraguay: 17,
    Bolivia: 9,
    "New Zealand": 16,
    "Papua New Guinea": 20,
    Fiji: 4,
    "Solomon Islands": 9,
    Vanuatu: 6,
    "New Caledonia": 3,
    "French Polynesia": 5,
    Samoa: 11,
    Tonga: 5,
    Kiribati: 3,
    Tuvalu: 1,
    Nauru: 14,
    "Marshall Islands": 24,
    Micronesia: 4,
    Palau: 16,
    Guam: 19,
    "Northern Mariana Islands": 17,
    "American Samoa": 3,
    "Cook Islands": 11,
    Niue: 14,
    Tokelau: 3,
    "Wallis and Futuna": 3,
    Pitcairn: 1,
    "Cocos Islands": 2,
    "Christmas Island": 1,
    "Norfolk Island": 1,
    "Heard Island and McDonald Islands": 1,
    "French Southern Territories": 4,
    "South Georgia and the South Sandwich Islands": 1,
    "Falkland Islands": 1,
    "Bouvet Island": 1,
    "Svalbard and Jan Mayen": 2,
    Greenland: 5,
    "Faroe Islands": 1,
    "Isle of Man": 1,
    Jersey: 1,
    Guernsey: 1,
    Gibraltar: 1,
    Andorra: 7,
    Monaco: 1,
    Liechtenstein: 11,
    "San Marino": 9,
    Vatican: 1,
    Malta: 6,
    Cyprus: 6,
    Bahrain: 4,
    Qatar: 8,
    "United Arab Emirates": 7,
    Oman: 11,
    Yemen: 21,
    "Saudi Arabia": 13,
    Jordan: 12,
    Israel: 6,
    Lebanon: 8,
    Syria: 14,
    Iraq: 18,
    Kuwait: 6,
    "East Timor": 13,
    Brunei: 4,
    Singapore: 1,
    Taiwan: 22,
    "Hong Kong": 18,
    Macau: 2,
    Bhutan: 20,
    Nepal: 7,
    Bangladesh: 8,
    "Sri Lanka": 9,
    Maldives: 7,
    Cuba: 15,
    Jamaica: 14,
    Haiti: 10,
    "Dominican Republic": 31,
    "Puerto Rico": 78,
    Bahamas: 32,
    Barbados: 11,
    Grenada: 6,
    "Saint Vincent and the Grenadines": 6,
    "Saint Lucia": 10,
    Dominica: 10,
    "Antigua and Barbuda": 6,
    "Saint Kitts and Nevis": 14,
    "Trinidad and Tobago": 9,
    Belize: 6,
    Guatemala: 22,
    "El Salvador": 14,
    Honduras: 18,
    Nicaragua: 15,
    "Costa Rica": 7,
    Panama: 10,
    "Cayman Islands": 6,
    "Turks and Caicos Islands": 6,
    "British Virgin Islands": 5,
    "U.S. Virgin Islands": 3,
    Anguilla: 1,
    "Saint Barthelemy": 1,
    "Saint Martin": 1,
    "Saint Pierre and Miquelon": 2,
    Bermuda: 9,
    Aruba: 1,
    Curacao: 1,
    "Sint Maarten": 1,
    "Bonaire, Sint Eustatius and Saba": 3,
  };

  // Track province creation per country during processing
  constructor(viewer) {
    this.viewer = viewer;
    this.loadedRegions = new Set();

    // Global registry for active region entities to prevent duplicates
    this.activeRegions = new Map(); // key -> entityIds[]

    // Province tracking for validation
    this.provinceCountsByCountry = new Map(); // country -> count

    // Hover state management
    this.hoveredRegion = null;
    this.highlightEntity = null;
    this.tooltipElement = null;
    this.mouseHandlers = {
      move: null,
      click: null,
    };

    // Configure viewer for optimal large polygon rendering
    this.configureViewerForLargePolygons();

    // Initialize hover functionality
    this.initializeHoverSystem();

    console.log(
      "🗺️ RegionManager initialized with hover effects and duplicate prevention",
    );
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

  // Initialize hover system with tooltip and highlighting
  initializeHoverSystem() {
    if (!this.viewer || !this.viewer.cesiumWidget) {
      console.warn("⚠️ Viewer not available for hover system initialization");
      return;
    }

    try {
      // Create tooltip element
      this.createTooltipElement();

      // Set up mouse event handlers
      this.setupMouseHandlers();

      console.log("✅ Hover system initialized with tooltip and highlighting");
    } catch (error) {
      console.error("❌ Error initializing hover system:", error);
    }
  }

  // Create tooltip element for region names
  createTooltipElement() {
    // Remove existing tooltip if any
    if (this.tooltipElement) {
      document.body.removeChild(this.tooltipElement);
    }

    // Create new modern tooltip
    this.tooltipElement = document.createElement("div");
    this.tooltipElement.style.cssText = `
      position: absolute;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
      color: #e2e8f0;
      padding: 12px 16px;
      border-radius: 12px;
      font-family: Inter, system-ui, sans-serif;
      font-size: 13px;
      font-weight: 500;
      pointer-events: none;
      z-index: 10000;
      opacity: 0;
      transition: all 0.2s ease;
      border: 2px solid rgba(99, 102, 241, 0.4);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      max-width: 250px;
      backdrop-filter: blur(10px);
      transform: translateY(-2px);
    `;

    document.body.appendChild(this.tooltipElement);
  }

  // Set up mouse event handlers for hover effects
  setupMouseHandlers() {
    if (!this.viewer || !this.viewer.cesiumWidget) {
      return;
    }

    const canvas = this.viewer.cesiumWidget.canvas;

    // Mouse move handler for hover detection
    this.mouseHandlers.move = (event) => {
      try {
        // Get canvas-relative mouse position
        const canvas = this.viewer.cesiumWidget.canvas;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const mousePosition = new window.Cesium.Cartesian2(x, y);

        // Pick object at mouse position
        const pickedObject = this.viewer.scene.pick(mousePosition);

        if (pickedObject && pickedObject.id && pickedObject.id.properties) {
          // Check for different property structures
          const properties = pickedObject.id.properties;

          // Try to get region info from different property structures
          let regionName = null;
          let layerType = null;

          // Check for country/state layer properties
          if (properties.regionName && properties.layerType) {
            regionName = properties.regionName.getValue();
            layerType = properties.layerType.getValue();
          }
          // Check for province properties
          else if (properties.province && properties.country) {
            regionName = properties.province.getValue();
            layerType = "provinces";
          }
          // Check for type property
          else if (properties.type) {
            const type = properties.type.getValue();
            if (type === "province") {
              regionName =
                properties.province?.getValue() || pickedObject.id.name;
              layerType = "provinces";
            }
          }
          // Fallback to entity name and check ID prefix
          else if (pickedObject.id.id) {
            const id = pickedObject.id.id;
            if (id.startsWith("countries:")) {
              regionName = pickedObject.id.name || id.split(":")[1];
              layerType = "countries";
            } else if (id.startsWith("states:") || id.startsWith("province:")) {
              regionName = pickedObject.id.name || id.split(":")[2];
              layerType = "provinces";
            }
          }

          if (regionName && layerType) {
            // Show hover effect
            this.showHoverEffect(pickedObject.id, regionName, layerType, event);

            // Debug logging for province detection
            if (layerType === "provinces" && Math.random() < 0.1) {
              // Log 10% of province hovers
              console.log(
                `🏛️ Province hover detected: ${regionName} (${layerType})`,
              );
            }
          } else {
            this.hideHoverEffect();
          }
        } else {
          this.hideHoverEffect();
        }
      } catch (error) {
        console.error("❌ Error in mouse move handler:", error);
      }
    };

    // Click handler for region selection
    this.mouseHandlers.click = (event) => {
      try {
        console.log("🗺️ RegionManager: Click intercepted by RegionManager");
        // Get canvas-relative mouse position
        const canvas = this.viewer.cesiumWidget.canvas;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const mousePosition = new window.Cesium.Cartesian2(x, y);

        // Pick object at mouse position
        const pickedObject = this.viewer.scene.pick(mousePosition);
        console.log("🗺️ RegionManager: Picked object:", pickedObject);

        if (pickedObject && pickedObject.id && pickedObject.id.properties) {
          // Check for different property structures
          const properties = pickedObject.id.properties;

          // Try to get region info from different property structures
          let regionName = null;
          let layerType = null;

          // Check for country/state layer properties
          if (properties.regionName && properties.layerType) {
            regionName = properties.regionName.getValue();
            layerType = properties.layerType.getValue();
          }
          // Check for province properties
          else if (properties.province && properties.country) {
            regionName = properties.province.getValue();
            layerType = "provinces";
          }
          // Check for type property
          else if (properties.type) {
            const type = properties.type.getValue();
            if (type === "province") {
              regionName =
                properties.province?.getValue() || pickedObject.id.name;
              layerType = "provinces";
            }
          }
          // Fallback to entity name and check ID prefix
          else if (pickedObject.id.id) {
            const id = pickedObject.id.id;
            if (id.startsWith("countries:")) {
              regionName = pickedObject.id.name || id.split(":")[1];
              layerType = "countries";
            } else if (id.startsWith("states:") || id.startsWith("province:")) {
              regionName = pickedObject.id.name || id.split(":")[2];
              layerType = "provinces";
            }
          }

          if (regionName && layerType) {
            console.log(`🗺️ Clicked region: ${regionName} (${layerType})`);
            // You can add click functionality here
            event.stopPropagation(); // Only consume region clicks
            return;
          }
        }

        // If it's not a region click, don't consume the event
        console.log(
          "🗺️ RegionManager: Not a region click, allowing event to propagate",
        );
      } catch (error) {
        console.error("❌ Error in click handler:", error);
      }
    };

    // Add event listeners
    canvas.addEventListener("mousemove", this.mouseHandlers.move);
    // Temporarily disable click handler to avoid conflicts with candidate/channel clicks
    // canvas.addEventListener('click', this.mouseHandlers.click);

    console.log("✅ Mouse handlers set up for hover effects");
  }

  // Show hover effect with tooltip and highlighting
  showHoverEffect(entity, regionName, layerType, event) {
    if (this.hoveredRegion === regionName) {
      // Already showing this region, just update tooltip position
      this.updateTooltipPosition(event);
      return;
    }

    // Hide previous hover effect
    this.hideHoverEffect();

    // Set new hovered region
    this.hoveredRegion = regionName;

    // Change cursor
    if (this.viewer.cesiumWidget.canvas) {
      this.viewer.cesiumWidget.canvas.style.cursor = "pointer";
    }

    // Create highlight overlay
    this.createHighlightOverlay(entity, layerType);

    // Show tooltip with entity information
    this.showTooltip(regionName, layerType, event);
  }

  // Hide hover effect
  hideHoverEffect() {
    if (this.hoveredRegion) {
      this.hoveredRegion = null;

      // Reset cursor
      if (this.viewer.cesiumWidget.canvas) {
        this.viewer.cesiumWidget.canvas.style.cursor = "default";
      }

      // Remove highlight
      this.removeHighlightOverlay();

      // Hide tooltip
      this.hideTooltip();
    }
  }

  // Create highlight overlay for hovered region
  createHighlightOverlay(entity, layerType) {
    try {
      const Cesium = window.Cesium;

      // Get region name first before using it in properties
      const regionName =
        entity.properties?.regionName?.getValue() || entity.name || "Unknown";

      // Get the polygon hierarchy from the original entity
      const hierarchy = entity.polygon.hierarchy.getValue();

      // Create more visible highlight material with higher opacity
      const highlightMaterial =
        layerType === "countries"
          ? Cesium.Color.fromBytes(255, 255, 255, 0.6) // Brighter white for countries
          : Cesium.Color.fromBytes(100, 255, 100, 0.7); // Brighter green for states/provinces

      // Create highlight entity with enhanced visibility
      this.highlightEntity = this.viewer.entities.add({
        id: `highlight-${entity.id}`,
        polygon: {
          hierarchy: hierarchy,
          material: highlightMaterial,
          outline: true,
          outlineColor:
            layerType === "countries"
              ? Cesium.Color.WHITE
              : Cesium.Color.fromBytes(50, 150, 50, 255), // Dark green for provinces
          outlineWidth: 4, // Thicker outline for better visibility
          perPositionHeight: false,
          clampToGround: false, // Disable terrain clamping to ensure visibility
          height: 0.1, // Slight elevation to appear above original
          shadows: Cesium.ShadowMode.DISABLED,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0.0,
            2.5e7,
          ),
          // Enhanced rendering settings
          classificationType: Cesium.ClassificationType.BOTH,
          heightReference: Cesium.HeightReference.NONE,
        },
        // Store original entity properties for tooltip access
        properties: {
          originalEntity: entity,
          regionName: regionName,
          layerType: layerType,
          country:
            entity.properties?.country?.getValue() ||
            entity.properties?.countryName?.getValue(),
          province: entity.properties?.province?.getValue(),
        },
      });

      if (DEBUG_CONFIG.CESIUM) console.log(`🌟 Created highlight for ${regionName} (${layerType})`);
    } catch (error) {
      console.error("❌ Error creating highlight overlay:", error);
    }
  }

  // Remove highlight overlay
  removeHighlightOverlay() {
    if (this.highlightEntity) {
      this.viewer.entities.remove(this.highlightEntity);
      this.highlightEntity = null;
    }
  }

  // Show tooltip with region name
  showTooltip(regionName, layerType, event) {
    if (!this.tooltipElement) {
      return;
    }

    // Set tooltip content with different icons for countries vs provinces
    const layerIcon = layerType === "countries" ? "🌍" : "🏛️";
    const layerLabel = layerType === "countries" ? "Country" : "Province/State";

    // For provinces, try to get country information from the hovered entity
    let tooltipContent = "";
    if (layerType === "provinces") {
      // Try to get country info from the current hovered entity
      let country = "Unknown Country";
      if (this.highlightEntity && this.highlightEntity.properties) {
        country =
          this.highlightEntity.properties.country?.getValue() ||
          this.highlightEntity.properties.countryName?.getValue() ||
          "Unknown Country";
      }
      tooltipContent = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">${layerIcon}</span>
          <div>
            <div style="font-weight: 700; margin-bottom: 4px; color: #fbbf24; font-size: 14px;">${regionName}</div>
            <div style="font-size: 11px; color: #6366f1; font-weight: 600;">${layerLabel} • ${country}</div>
          </div>
        </div>
      `;
    } else {
      tooltipContent = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">${layerIcon}</span>
          <div>
            <div style="font-weight: 700; margin-bottom: 4px; color: #fbbf24; font-size: 14px;">${regionName}</div>
            <div style="font-size: 11px; color: #6366f1; font-weight: 600;">${layerLabel}</div>
          </div>
        </div>
      `;
    }

    this.tooltipElement.innerHTML = tooltipContent;

    // Update position and show
    this.updateTooltipPosition(event);
    this.tooltipElement.style.opacity = "1";
  }

  // Update tooltip position based on mouse position
  updateTooltipPosition(event) {
    if (!this.tooltipElement) {
      return;
    }

    const offset = 15;
    this.tooltipElement.style.left = `${event.clientX + offset}px`;
    this.tooltipElement.style.top = `${event.clientY + offset}px`;
  }

  // Hide tooltip
  hideTooltip() {
    if (this.tooltipElement) {
      this.tooltipElement.style.opacity = "0";
    }
  }

  // Cleanup method for destroying the RegionManager
  destroy() {
    console.log("🗑️ Destroying RegionManager...");

    try {
      // Hide hover effects
      this.hideHoverEffect();

      // Remove tooltip element
      if (this.tooltipElement) {
        document.body.removeChild(this.tooltipElement);
        this.tooltipElement = null;
      }

      // Remove mouse event handlers
      if (
        this.viewer &&
        this.viewer.cesiumWidget &&
        this.viewer.cesiumWidget.canvas
      ) {
        const canvas = this.viewer.cesiumWidget.canvas;

        if (this.mouseHandlers.move) {
          canvas.removeEventListener("mousemove", this.mouseHandlers.move);
        }
        if (this.mouseHandlers.click) {
          canvas.removeEventListener("click", this.mouseHandlers.click);
        }
      }

      // Clear all regions
      this.clearRegions();

      console.log("✅ RegionManager destroyed successfully");
    } catch (error) {
      console.error("❌ Error destroying RegionManager:", error);
    }
  }

  // Registry management for preventing duplicates
  registerOnce(key, entityIds) {
    if (this.activeRegions.has(key)) {
      console.warn(`⚠️ Region ${key} already registered, skipping duplicate`);
      return false;
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

      // Validate large polygon rendering consistency
      this.validateLargePolygonRendering(layerType);

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

        // Process geometry with proper topology handling
        const entities = this.createCountryEntities(
          feature,
          regionKey,
          material,
          outlineColor,
          layerType,
        );

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
            console.warn(
              `⚠️ Duplicate detected for ${name}, removed ${entities.length} entities`,
            );
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
    const properties = feature.properties || {};

    if (layerType === "countries") {
      return (
        properties.NAME ||
        properties.name ||
        properties.ADMIN ||
        properties.ADMIN_NAME ||
        properties.SOVEREIGNT ||
        properties.sovereignt ||
        properties.ADMIN0_NAME ||
        properties.admin0_name ||
        `Country ${index}`
      );
    } else {
      return (
        properties.NAME ||
        properties.name ||
        properties.ADMIN ||
        properties.ADMIN_NAME ||
        properties.NAME_1 ||
        properties.name_1 ||
        properties.ADMIN1_NAME ||
        properties.admin1_name ||
        `State ${index}`
      );
    }
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
    console.log("🧹 Clearing all region entities...");

    try {
      // Ensure viewer is available
      if (!this.viewer || !this.viewer.entities) {
        console.error("❌ Cesium viewer not available for clearing regions");
        return { success: false, error: "Viewer not initialized" };
      }

      // Hide any active hover effects
      this.hideHoverEffect();

      // Clear all registered regions
      const keys = Array.from(this.activeRegions.keys());
      let removedCount = 0;

      keys.forEach((key) => {
        const entityIds = this.activeRegions.get(key);
        if (entityIds) {
          entityIds.forEach((id) => {
            const entity = this.viewer.entities.getById(id);
            if (entity) {
              this.viewer.entities.remove(entity);
              removedCount++;
            }
          });
        }
      });

      // Clear the registry
      this.activeRegions.clear();
      this.loadedRegions.clear();

      // Force render after clearing
      this.viewer.scene.requestRender();

      console.log(`✅ Cleared ${removedCount} region entities from registry`);

      // Verify no entities remain
      const remainingCount =
        this.countLayer("countries:") + this.countLayer("states:");
      if (remainingCount > 0) {
        console.warn(
          `⚠️ ${remainingCount} entities still remain after clearing`,
        );
      } else {
        console.log("✅ All region entities successfully cleared");
      }

      return {
        success: true,
        removedCount: removedCount,
      };
    } catch (error) {
      console.error("❌ Error clearing regions:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Validate large polygon rendering consistency with comprehensive checks
  validateLargePolygonRendering(layerType) {
    const largePolygonNames = [
      "russia",
      "canada",
      "china",
      "brazil",
      "australia",
      "united states",
      "argentina",
      "kazakhstan",
      "algeria",
    ];

    console.log(`🔍 Large Polygon Validation for ${layerType}:`);

    let totalInconsistencies = 0;
    let totalRegions = 0;

    // Check each large region
    largePolygonNames.forEach((regionName) => {
      const regionKey = `${layerType}:${regionName}`;
      const entityIds = this.activeRegions.get(regionKey);

      if (entityIds) {
        totalRegions++;
        const entities = entityIds
          .map((id) => this.viewer.entities.getById(id))
          .filter((e) => e);

        console.log(`   📍 ${regionName}: ${entities.length} entities`);

        // Check for duplicates
        const uniqueIds = new Set(entityIds);
        if (uniqueIds.size !== entityIds.length) {
          console.warn(`   ⚠️ ${regionName}: Duplicate entities detected`);
          totalInconsistencies++;
        }

        // Check rendering consistency
        let regionConsistent = true;
        entities.forEach((entity) => {
          const polygon = entity.polygon;
          if (!polygon) {
            console.warn(`   ⚠️ ${entity.id}: No polygon property`);
            regionConsistent = false;
          } else {
            // Check material
            if (!polygon.material) {
              console.warn(`   ⚠️ ${entity.id}: No material`);
              regionConsistent = false;
            }

            // Check clampToGround
            if (!polygon.clampToGround) {
              console.warn(`   ⚠️ ${entity.id}: Not clamped to ground`);
              regionConsistent = false;
            }

            // Check shadows
            if (polygon.shadows !== window.Cesium.ShadowMode.DISABLED) {
              console.warn(`   ⚠️ ${entity.id}: Shadows not disabled`);
              regionConsistent = false;
            }

            // Check visibility
            const isVisible = polygon.show.getValue(
              this.viewer.clock.currentTime,
            );
            if (!isVisible) {
              console.warn(`   ⚠️ ${entity.id}: Not visible`);
              regionConsistent = false;
            }
          }
        });

        if (regionConsistent) {
          console.log(`   ✅ ${regionName}: All entities consistent`);
        } else {
          totalInconsistencies++;
        }
      }
    });

    // Check for layer exclusivity
    if (layerType === "countries") {
      const statesCount = this.countLayer("states:");
      if (statesCount > 0) {
        console.warn(
          `⚠️ Layer exclusivity violation: ${statesCount} state entities visible with countries`,
        );
        totalInconsistencies++;
      }
    } else if (layerType === "states") {
      const countriesCount = this.countLayer("countries:");
      if (countriesCount > 0) {
        console.warn(
          `⚠️ Layer exclusivity violation: ${countriesCount} country entities visible with states`,
        );
        totalInconsistencies++;
      }
    }

    // Overall summary
    console.log(`📊 Large Polygon Summary:`);
    console.log(`   Total large regions: ${totalRegions}`);
    console.log(`   Total inconsistencies: ${totalInconsistencies}`);

    if (totalInconsistencies === 0) {
      console.log(`✅ Large polygon validation: 0 inconsistencies`);
    } else {
      console.warn(
        `⚠️ Large polygon validation: ${totalInconsistencies} inconsistencies detected`,
      );
    }

    // Add debug helpers to global scope
    window.dumpAdm0 = (code) => this.dumpAdm0(code);
    window.countLayer = (prefix) => this.countLayer(prefix);

    return totalInconsistencies === 0;
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

      // Run detailed validation
      const validation = this.validateProvinceLoading();

      // Run rendering validation
      const renderingValidation = this.validateProvinceRendering();

      // Generate comprehensive validation dashboard
      const validationDashboard = this.generateProvinceValidationDashboard();

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
          validation: validation,
          renderingValidation: renderingValidation,
          validationDashboard: validationDashboard,
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

  // Validate province loading and provide detailed debugging information
  validateProvinceLoading() {
    console.log("🔍 Validating province loading...");

    const provinceEntities = this.viewer.entities.values.filter(
      (entity) => entity.id && entity.id.startsWith("province:"),
    );

    console.log(
      `📊 Total province entities in viewer: ${provinceEntities.length}`,
    );

    // Group by country
    const provincesByCountry = new Map();
    provinceEntities.forEach((entity) => {
      const country = entity.properties?.getValue()?.country || "Unknown";
      if (!provincesByCountry.has(country)) {
        provincesByCountry.set(country, []);
      }
      provincesByCountry.get(country).push(entity);
    });

    // Sort countries by province count
    const sortedCountries = Array.from(provincesByCountry.entries()).sort(
      (a, b) => b[1].length - a[1].length,
    );

    console.log("📋 Provinces by country (top 20):");
    sortedCountries.slice(0, 20).forEach(([country, entities]) => {
      console.log(`   ${country}: ${entities.length} provinces`);
    });

    // Check for key countries
    const keyCountries = [
      "Russia",
      "Canada",
      "Brazil",
      "China",
      "United States",
      "Australia",
      "India",
      "Argentina",
    ];
    console.log("🎯 Key countries validation:");
    keyCountries.forEach((country) => {
      const provinces = provincesByCountry.get(country) || [];
      console.log(
        `   ${country}: ${provinces.length} provinces ${provinces.length > 0 ? "✅" : "❌"}`,
      );
    });

    // Check for large provinces that might have issues
    const largeProvinces = [
      "Sakha",
      "Amazonas",
      "Nunavut",
      "Quebec",
      "Western Australia",
      "Xinjiang",
    ];
    console.log("🏔️ Large provinces validation:");
    largeProvinces.forEach((provinceName) => {
      const found = provinceEntities.filter(
        (entity) =>
          entity.name &&
          entity.name.toLowerCase().includes(provinceName.toLowerCase()),
      );
      console.log(
        `   ${provinceName}: ${found.length} entities ${found.length > 0 ? "✅" : "❌"}`,
      );
    });

    // Check for multipolygon provinces
    const multipolygonProvinces = provinceEntities.filter((entity) => {
      const props = entity.properties?.getValue();
      return props && props.geometryType === "MultiPolygon";
    });
    console.log(
      `🔧 Multipolygon provinces: ${multipolygonProvinces.length} entities`,
    );

    // Check for provinces with holes
    const provincesWithHoles = provinceEntities.filter((entity) => {
      const props = entity.properties?.getValue();
      return props && props.totalHoles > 0;
    });
    console.log(
      `🕳️ Provinces with holes: ${provincesWithHoles.length} entities`,
    );

    return {
      totalEntities: provinceEntities.length,
      countriesWithProvinces: provincesByCountry.size,
      multipolygonCount: multipolygonProvinces.length,
      holesCount: provincesWithHoles.length,
      topCountries: sortedCountries.slice(0, 10),
    };
  }

  // Validate province rendering and check for visibility issues
  validateProvinceRendering() {
    console.log("🔍 Validating province rendering...");

    const provinceEntities = this.viewer.entities.values.filter(
      (entity) => entity.id && entity.id.startsWith("province:"),
    );

    console.log(`📊 Total province entities: ${provinceEntities.length}`);

    // Check for entities with proper styling
    let properlyStyled = 0;
    let missingMaterial = 0;
    let missingOutline = 0;
    let invisible = 0;

    provinceEntities.forEach((entity) => {
      const polygon = entity.polygon;
      if (!polygon) {
        console.warn(`⚠️ Entity ${entity.id}: No polygon property`);
        invisible++;
        return;
      }

      // Check material
      if (!polygon.material) {
        console.warn(`⚠️ Entity ${entity.id}: Missing material`);
        missingMaterial++;
      }

      // Check outline
      if (!polygon.outline || !polygon.outlineColor) {
        console.warn(`⚠️ Entity ${entity.id}: Missing outline`);
        missingOutline++;
      }

      // Check visibility
      const showProperty = polygon.show;
      const isVisible = showProperty
        ? typeof showProperty.getValue === "function"
          ? showProperty.getValue(this.viewer.clock.currentTime)
          : showProperty
        : true;
      if (!isVisible) {
        console.warn(`⚠️ Entity ${entity.id}: Not visible`);
        invisible++;
      }

      if (polygon.material && polygon.outline && isVisible) {
        properlyStyled++;
      }
    });

    console.log(`📊 Rendering validation:`);
    console.log(`   Properly styled: ${properlyStyled}`);
    console.log(`   Missing material: ${missingMaterial}`);
    console.log(`   Missing outline: ${missingOutline}`);
    console.log(`   Invisible: ${invisible}`);

    // Check for specific large provinces
    const largeProvinces = [
      "Sakha",
      "Amazonas",
      "Nunavut",
      "Quebec",
      "Western Australia",
      "Xinjiang",
    ];
    console.log("🏔️ Large provinces rendering check:");
    largeProvinces.forEach((provinceName) => {
      const found = provinceEntities.filter(
        (entity) =>
          entity.name &&
          entity.name.toLowerCase().includes(provinceName.toLowerCase()),
      );
      const visible = found.filter((entity) => {
        const polygon = entity.polygon;
        if (!polygon) return false;
        const showProperty = polygon.show;
        return showProperty
          ? typeof showProperty.getValue === "function"
            ? showProperty.getValue(this.viewer.clock.currentTime)
            : showProperty
          : true;
      });
      console.log(
        `   ${provinceName}: ${found.length} entities, ${visible.length} visible ${visible.length > 0 ? "✅" : "❌"}`,
      );
    });

    return {
      totalEntities: provinceEntities.length,
      properlyStyled,
      missingMaterial,
      missingOutline,
      invisible,
    };
  }

  // Comprehensive validation dashboard for ADM1 province loading
  generateProvinceValidationDashboard() {
    console.log("📊 ========================================");
    console.log("📊 ADM1 PROVINCE VALIDATION DASHBOARD");
    console.log("📊 ========================================");

    const validationTable = [];
    let totalExpected = 0;
    let totalRendered = 0;
    let countriesComplete = 0;
    let countriesWithIssues = 0;

    // Get all countries that have provinces in our reference table
    const referenceCountries = Object.keys(RegionManager.ADM1_COUNTS);

    referenceCountries.forEach((countryName) => {
      const expected = RegionManager.ADM1_COUNTS[countryName];
      const rendered = this.provinceCountsByCountry.get(countryName) || 0;

      totalExpected += expected;
      totalRendered += rendered;

      const status = rendered === expected ? "✅" : "⚠️";
      if (rendered === expected) {
        countriesComplete++;
      } else {
        countriesWithIssues++;
      }

      validationTable.push({
        country: countryName,
        expected: expected,
        rendered: rendered,
        status: status,
        difference: rendered - expected,
      });
    });

    // Sort by difference (largest issues first)
    validationTable.sort(
      (a, b) => Math.abs(b.difference) - Math.abs(a.difference),
    );

    // Display the validation table
    console.log("📋 Per-Country ADM1 Validation Table:");
    console.table(validationTable);

    // Summary statistics
    console.log("📊 ========================================");
    console.log("📊 VALIDATION SUMMARY");
    console.log("📊 ========================================");
    console.log(`🌍 Total Countries with ADM1: ${referenceCountries.length}`);
    console.log(`✅ Countries Complete: ${countriesComplete}`);
    console.log(`⚠️ Countries with Issues: ${countriesWithIssues}`);
    console.log(
      `📊 Completion Rate: ${((countriesComplete / referenceCountries.length) * 100).toFixed(1)}%`,
    );
    console.log("");
    console.log(`🏛️ Total Expected Provinces: ${totalExpected}`);
    console.log(`🏛️ Total Rendered Provinces: ${totalRendered}`);
    console.log(`🏛️ Missing Provinces: ${totalExpected - totalRendered}`);
    console.log(
      `📊 Province Completion Rate: ${((totalRendered / totalExpected) * 100).toFixed(1)}%`,
    );

    // Highlight major issues
    const majorIssues = validationTable.filter(
      (row) => Math.abs(row.difference) > 5,
    );
    if (majorIssues.length > 0) {
      console.log("");
      console.log("🚨 MAJOR ISSUES (Missing >5 provinces):");
      majorIssues.forEach((issue) => {
        console.log(
          `   ${issue.country}: Expected ${issue.expected}, Rendered ${issue.rendered} (${issue.difference > 0 ? "+" : ""}${issue.difference})`,
        );
      });
    }

    // Highlight countries with no provinces rendered
    const noProvinces = validationTable.filter((row) => row.rendered === 0);
    if (noProvinces.length > 0) {
      console.log("");
      console.log("❌ COUNTRIES WITH NO PROVINCES RENDERED:");
      noProvinces.forEach((issue) => {
        console.log(
          `   ${issue.country}: Expected ${issue.expected}, Rendered 0`,
        );
      });
    }

    // Check for countries with more provinces than expected (potential duplicates)
    const extraProvinces = validationTable.filter((row) => row.difference > 0);
    if (extraProvinces.length > 0) {
      console.log("");
      console.log("🔍 COUNTRIES WITH EXTRA PROVINCES (Potential Duplicates):");
      extraProvinces.forEach((issue) => {
        console.log(
          `   ${issue.country}: Expected ${issue.expected}, Rendered ${issue.rendered} (+${issue.difference})`,
        );
      });
    }

    console.log("📊 ========================================");

    return {
      validationTable,
      summary: {
        totalCountries: referenceCountries.length,
        countriesComplete,
        countriesWithIssues,
        completionRate: (countriesComplete / referenceCountries.length) * 100,
        totalExpected,
        totalRendered,
        missingProvinces: totalExpected - totalRendered,
        provinceCompletionRate: (totalRendered / totalExpected) * 100,
        majorIssues: majorIssues.length,
        noProvinces: noProvinces.length,
        extraProvinces: extraProvinces.length,
      },
    };
  }
}
