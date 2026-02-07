/**
 * Region Hover System Module
 * Extracted from RegionManager.js - Phase 1.3
 * 
 * Handles all hover interactions, tooltips, and highlighting for region entities
 */

export class RegionHoverSystem {
  constructor(viewer, options = {}) {
    if (!viewer) {
      throw new Error('RegionHoverSystem requires a Cesium viewer');
    }

    this.viewer = viewer;
    this.activeClusterLevel = options.activeClusterLevel || 'country';
    this.onRegionClick = options.onRegionClick || null;

    // Hover state
    this.tooltipElement = null;
    this.mouseHandlers = { move: null, click: null };
    this.hoveredRegion = null;
    this.highlightEntity = null;
    this.hoverDebounceTimer = null;

    console.log('✅ RegionHoverSystem initialized');
  }

  /**
   * Initialize the complete hover system
   */
  initialize() {
    if (!this.viewer || !this.viewer.cesiumWidget) {
      console.warn("⚠️ Viewer not available for hover system initialization");
      return;
    }

    try {
      this.createTooltipElement();
      this.setupMouseHandlers();
      console.log("✅ Hover system initialized with tooltip and highlighting");
    } catch (error) {
      console.error("❌ Error initializing hover system:", error);
    }
  }

  /**
   * Create tooltip element for region names
   */
  createTooltipElement() {
    console.log('🔧 Creating tooltip element...');
    
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
      transform: translateY(-2px);
    `;

    document.body.appendChild(this.tooltipElement);
    console.log('✅ Tooltip element created and added to DOM');
  }

  /**
   * Set up mouse event handlers for hover effects
   */
  setupMouseHandlers() {
    if (!this.viewer || !this.viewer.cesiumWidget) {
      return;
    }

    // Remove any existing mouse handlers to prevent conflicts
    if (this.mouseHandlers.move) {
      this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
        window.Cesium.ScreenSpaceEventType.MOUSE_MOVE
      );
    }

    const canvas = this.viewer.cesiumWidget.canvas;

    // Mouse move handler for hover detection
    this.mouseHandlers.move = (event) => {
      try {
        const mousePosition = event.endPosition || event.position;
        if (!mousePosition) {
          return;
        }

        const pickedObject = this.viewer.scene.pick(mousePosition);

        // IGNORE highlight entities to prevent hover flicker
        if (pickedObject && pickedObject.id) {
          const entityId = pickedObject.id.id || pickedObject.id;
          if (typeof entityId === 'string' && entityId.startsWith('highlight-')) {
            return;
          }
        }

        if (pickedObject && pickedObject.id && pickedObject.id.properties) {
          // Check if this is a vote tower/candidate entity - skip it if so
          const entityId = pickedObject.id.id || pickedObject.id;
          const entityIdStr = typeof entityId === 'string' ? entityId : '';
          
          // Check entity ID patterns for vote towers
          if (entityIdStr.startsWith('individual-candidate-') || 
              entityIdStr.startsWith('cap-created-') ||
              entityIdStr.startsWith('voter-visible') ||
              entityIdStr.startsWith('voter-hidden')) {
            this.hideHoverEffect(); // Hide region hover when hovering over vote towers
            return; // Let other handlers process this hover
          }
          
          const properties = pickedObject.id.properties;
          const entityType = properties.entityType?.getValue ? properties.entityType.getValue() : properties.entityType?._value;
          const isIndividual = properties.isIndividual?.getValue ? properties.isIndividual.getValue() : properties.isIndividual?._value;
          const isCandidate = properties.candidateData?.getValue ? !!properties.candidateData.getValue() : !!properties.candidateData?._value;
          
          // Skip vote towers and candidate entities - let GlobalChannelRenderer handle them
          if (entityType === 'candidate' || isIndividual === true || isCandidate) {
            this.hideHoverEffect(); // Hide region hover when hovering over vote towers
            return; // Let other handlers process this hover
          }

          const { regionName, layerType } = this.extractRegionInfo(pickedObject);

          if (regionName && layerType && this.shouldHighlight(layerType, pickedObject.id)) {
            this.showHoverEffect(pickedObject.id, regionName, layerType, event);
            console.log(`✨ ${this.getLayerEmoji(layerType)} ${layerType} hover detected: ${regionName}`);
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
        const mousePosition = event.position;
        if (!mousePosition) {
          return;
        }

        const pickedObject = this.viewer.scene.pick(mousePosition);

        if (pickedObject && pickedObject.id && pickedObject.id.properties) {
          // Check if this is a vote tower/candidate entity - skip it if so
          const entityId = pickedObject.id.id || pickedObject.id;
          const entityIdStr = typeof entityId === 'string' ? entityId : '';
          
          // Check entity ID patterns for vote towers
          if (entityIdStr.startsWith('individual-candidate-') || 
              entityIdStr.startsWith('cap-created-') ||
              entityIdStr.startsWith('voter-visible') ||
              entityIdStr.startsWith('voter-hidden')) {
            return; // Let other handlers process this click
          }
          
          const properties = pickedObject.id.properties;
          const entityType = properties.entityType?.getValue ? properties.entityType.getValue() : properties.entityType?._value;
          const isIndividual = properties.isIndividual?.getValue ? properties.isIndividual.getValue() : properties.isIndividual?._value;
          const isCandidate = properties.candidateData?.getValue ? !!properties.candidateData.getValue() : !!properties.candidateData?._value;
          
          // Skip vote towers and candidate entities - let GlobalChannelRenderer handle them
          if (entityType === 'candidate' || isIndividual === true || isCandidate) {
            return; // Let other handlers process this click
          }

          // Check if this is a region boundary entity
          const { regionName, layerType } = this.extractRegionInfo(pickedObject);

          if (regionName && layerType) {
            console.log(`🗺️ Clicked region: ${regionName} (${layerType})`);
            
            if (this.onRegionClick && typeof this.onRegionClick === 'function') {
              this.onRegionClick(regionName, layerType, { 
                x: event.position.x, 
                y: event.position.y 
              });
            }
            
            return;
          }
        }
      } catch (error) {
        console.error("❌ Error in click handler:", error);
      }
    };

    // Register Cesium event handlers
    const handler = this.viewer.cesiumWidget.screenSpaceEventHandler;
    handler.setInputAction(
      this.mouseHandlers.move,
      window.Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
    handler.setInputAction(
      this.mouseHandlers.click,
      window.Cesium.ScreenSpaceEventType.LEFT_CLICK
    );

    console.log("✅ Mouse handlers registered");
  }

  /**
   * Extract region name and layer type from picked object
   */
  extractRegionInfo(pickedObject) {
    const properties = pickedObject.id.properties;
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
    // Check for type property (AdminHierarchy entities)
    else if (properties.type) {
      const type = properties.type.getValue();
      regionName = properties.name?.getValue() || pickedObject.id.name;
      
      const typeMap = {
        province: "provinces",
        country: "countries",
        continent: "continents",
        city: "cities",
        neighborhood: "neighborhoods"
      };
      
      layerType = typeMap[type];
    }
    // Fallback to entity ID prefix
    else if (pickedObject.id.id) {
      const id = pickedObject.id.id;
      const idPrefixMap = {
        'countries:': 'countries',
        'country:': 'countries',
        'states:': 'provinces',
        'province:': 'provinces',
        'continent:': 'continents',
        'city:': 'cities',
        'neighborhood:': 'neighborhoods'
      };
      
      for (const [prefix, type] of Object.entries(idPrefixMap)) {
        if (id.startsWith(prefix)) {
          regionName = pickedObject.id.name || id.split(":")[1];
          layerType = type;
          break;
        }
      }
    }

    return { regionName, layerType };
  }

  /**
   * Determine if entity should be highlighted based on active cluster level
   */
  shouldHighlight(layerType, entity) {
    // Check layer type match with cluster level
    if ((this.activeClusterLevel === 'gps' || this.activeClusterLevel === 'province') && layerType === 'provinces') {
      return true;
    } else if (this.activeClusterLevel === 'country' && layerType === 'countries') {
      console.log(`🗺️ Country hover match, clusterLevel: ${this.activeClusterLevel}`);
      return true;
    } else if (this.activeClusterLevel === 'continent' && layerType === 'continents') {
      console.log(`🌍 Continent hover match, clusterLevel: ${this.activeClusterLevel}`);
      return true;
    }
    
    // Also check AdminHierarchy entity types for compatibility
    if (entity.properties && entity.properties.type) {
      const entityType = entity.properties.type.getValue();
      if ((this.activeClusterLevel === 'gps' || this.activeClusterLevel === 'province') && entityType === 'province') {
        return true;
      } else if (this.activeClusterLevel === 'country' && entityType === 'country') {
        console.log(`🗺️ Country entity type match`);
        return true;
      } else if (this.activeClusterLevel === 'continent' && entityType === 'continent') {
        console.log(`🌍 Continent entity type match`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Show hover effect for entity
   */
  showHoverEffect(entity, regionName, layerType, event) {
    console.log(`🎯 showHoverEffect called: ${regionName} (${layerType})`);
    
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

  /**
   * Hide hover effect
   */
  hideHoverEffect() {
    if (this.hoveredRegion) {
      console.log(`🚫 Hiding hover effect for: ${this.hoveredRegion}`);
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

  /**
   * Create highlight overlay for hovered region
   */
  createHighlightOverlay(entity, layerType) {
    console.log(`✨ Creating highlight for: ${entity.name || entity.id} (${layerType})`);
    try {
      const Cesium = window.Cesium;

      // Get the polygon hierarchy from the original entity
      let hierarchy;
      try {
        hierarchy = entity.polygon.hierarchy.getValue();
      } catch (error) {
        console.error('❌ Error getting hierarchy from entity:', error);
        hierarchy = entity.polygon.hierarchy;
      }

      // Create a bright highlight entity positioned above the original
      this.highlightEntity = this.viewer.entities.add({
        id: `highlight-${entity.id}`,
        polygon: {
          hierarchy: hierarchy,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.YELLOW.withAlpha(0.5)
          ),
          outline: true,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 4,
          perPositionHeight: false,
          clampToGround: false,
          height: 1000, // Elevated 1km above surface for visibility
          shadows: Cesium.ShadowMode.DISABLED,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 2.5e7),
          classificationType: Cesium.ClassificationType.BOTH,
          heightReference: Cesium.HeightReference.NONE,
        }
      });

      console.log(`✅ Highlight overlay created for: ${entity.name || entity.id}`);
    } catch (error) {
      console.error('❌ Error creating highlight overlay:', error);
    }
  }

  /**
   * Remove highlight overlay
   */
  removeHighlightOverlay() {
    if (this.highlightEntity) {
      try {
        this.viewer.entities.remove(this.highlightEntity);
        this.highlightEntity = null;
        console.log('✅ Highlight overlay removed');
      } catch (error) {
        console.error('❌ Error removing highlight overlay:', error);
      }
    }
  }

  /**
   * Show tooltip with entity information
   */
  showTooltip(regionName, layerType, event) {
    if (!this.tooltipElement) {
      return;
    }

    // Set tooltip content
    this.tooltipElement.textContent = regionName;

    // Position tooltip
    this.updateTooltipPosition(event);

    // Show tooltip with animation
    this.tooltipElement.style.opacity = '1';
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    if (this.tooltipElement) {
      this.tooltipElement.style.opacity = '0';
    }
  }

  /**
   * Update tooltip position based on mouse event
   */
  updateTooltipPosition(event) {
    if (!this.tooltipElement) {
      return;
    }

    const mousePosition = event.endPosition || event.position;
    if (!mousePosition) {
      return;
    }

    // Position tooltip near cursor with offset
    const offsetX = 15;
    const offsetY = 15;
    
    this.tooltipElement.style.left = `${mousePosition.x + offsetX}px`;
    this.tooltipElement.style.top = `${mousePosition.y + offsetY}px`;
  }

  /**
   * Get emoji for layer type
   */
  getLayerEmoji(layerType) {
    const emojiMap = {
      provinces: '🏛️',
      countries: '🗺️',
      continents: '🌍',
      cities: '🏙️',
      neighborhoods: '🏘️'
    };
    return emojiMap[layerType] || '📍';
  }

  /**
   * Update active cluster level
   */
  setActiveClusterLevel(level) {
    console.log(`🔄 RegionHoverSystem: Setting active cluster level to: ${level}`);
    this.activeClusterLevel = level;
  }

  /**
   * Clean up hover system
   */
  destroy() {
    console.log('🗑️ Destroying RegionHoverSystem...');

    try {
      // Hide any active hover effect
      this.hideHoverEffect();

      // Remove tooltip element
      if (this.tooltipElement) {
        document.body.removeChild(this.tooltipElement);
        this.tooltipElement = null;
      }

      // Remove mouse event handlers
      if (this.viewer && this.viewer.cesiumWidget && this.viewer.cesiumWidget.canvas) {
        const canvas = this.viewer.cesiumWidget.canvas;

        if (this.mouseHandlers.move) {
          canvas.removeEventListener("mousemove", this.mouseHandlers.move);
        }
        if (this.mouseHandlers.click) {
          canvas.removeEventListener("click", this.mouseHandlers.click);
        }
      }

      // Clean up hover debounce timer
      if (this.hoverDebounceTimer) {
        clearTimeout(this.hoverDebounceTimer);
        this.hoverDebounceTimer = null;
      }

      console.log("✅ RegionHoverSystem destroyed successfully");
    } catch (error) {
      console.error("❌ Error destroying RegionHoverSystem:", error);
    }
  }
}

export default RegionHoverSystem;

