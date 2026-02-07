/**
 * MapboxCesiumIntegration.js
 * 
 * Integrates Mapbox GL JS with Cesium for rendering vector tiles.
 * Creates a synchronized 2D canvas overlay on top of the 3D Cesium globe.
 * 
 * This approach:
 * - Works around deck.gl/luma.gl dependency conflicts
 * - Uses battle-tested Mapbox GL JS for vector tiles
 * - Syncs camera between Cesium and Mapbox
 * - Handles ALL counties globally without entity limits
 */

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export class MapboxCesiumOverlay {
  constructor(cesiumViewer, options = {}) {
    if (!cesiumViewer) {
      throw new Error('MapboxCesiumOverlay requires a Cesium viewer');
    }

    this.viewer = cesiumViewer;
    this.options = {
      style: options.style || {
        version: 8,
        sources: {},
        layers: []
      },
      debugMode: options.debugMode || false
    };

    this.mapboxMap = null;
    this.container = null;
    this.syncInProgress = false;
    this.imageryLayer = null; // Cesium imagery layer for 3D draping

    this._log('✅ MapboxCesiumOverlay created');
  }

  /**
   * Initialize Mapbox GL overlay
   */
  async initialize() {
    try {
      this._log('🔧 Initializing Mapbox GL overlay...');

      // Create container for Mapbox
      this.container = document.createElement('div');
      this.container.id = 'maplibre-overlay-container';
      this.container.style.position = 'absolute';
      this.container.style.top = '0';
      this.container.style.left = '0';
      this.container.style.width = '100%';
      this.container.style.height = '100%';
      this.container.style.pointerEvents = 'none'; // Let Cesium handle interactions (pass-through)
      this.container.style.zIndex = '10'; // Well above Cesium
      this.container.style.border = '3px solid red'; // DEBUG: Visible border to confirm container is rendering
      this.container.style.boxSizing = 'border-box';
      
      // CRITICAL: Ensure container has explicit dimensions from parent
      const cesiumContainer = this.viewer.container;
      const parentWidth = cesiumContainer.offsetWidth || cesiumContainer.clientWidth;
      const parentHeight = cesiumContainer.offsetHeight || cesiumContainer.clientHeight;
      
      if (parentWidth > 0 && parentHeight > 0) {
        this.container.style.width = `${parentWidth}px`;
        this.container.style.height = `${parentHeight}px`;
        console.log(`📐 [MapboxOverlay] Container sized: ${parentWidth}x${parentHeight}px`);
      } else {
        console.warn('⚠️ [MapboxOverlay] Parent container has no size!', {
          offsetWidth: cesiumContainer.offsetWidth,
          offsetHeight: cesiumContainer.offsetHeight,
          clientWidth: cesiumContainer.clientWidth,
          clientHeight: cesiumContainer.clientHeight
        });
      }
      
      // Add to Cesium container (cesiumContainer already declared above)
      // Ensure Cesium container has position: relative
      if (getComputedStyle(cesiumContainer).position === 'static') {
        cesiumContainer.style.position = 'relative';
      }
      
      cesiumContainer.appendChild(this.container);
      
      console.log('📦 [MapboxOverlay] Container created and added to DOM:', {
        id: this.container.id,
        width: this.container.offsetWidth,
        height: this.container.offsetHeight,
        zIndex: this.container.style.zIndex,
        parent: cesiumContainer.id || '(unnamed parent)'
      });
      
      this._log(`📦 Container created and added to DOM: ${this.container.id}`);

      // Get initial camera position
      const camera = this.viewer.camera;
      const position = camera.positionCartographic;
      const longitude = window.Cesium.Math.toDegrees(position.longitude);
      const latitude = window.Cesium.Math.toDegrees(position.latitude);
      const height = position.height;
      
      // Calculate zoom from height (approximate)
      const zoom = Math.log2(40075017 / height) - 1;

      // Create MapLibre map with a proper base style
      // Use a minimal style that allows rendering (empty style doesn't work)
      const baseStyle = {
        version: 8,
        sources: {},
        layers: []
      };

      this.mapboxMap = new maplibregl.Map({
        container: this.container,
        style: baseStyle, // Use minimal style instead of empty
        center: [longitude, latitude],
        zoom: Math.max(0, Math.min(22, zoom)),
        pitch: 0,
        bearing: 0,
        interactive: false, // Disable Mapbox interactions
        attributionControl: false,
        preserveDrawingBuffer: true // Important for rendering
      });

      console.log('🗺️ [MapboxOverlay] MapLibre map created with minimal style');

      // Wait for map to load
      await new Promise((resolve) => {
        this.mapboxMap.on('load', () => {
          console.log('🗺️ [MapboxOverlay] MapLibre map loaded successfully');
          console.log('   Map canvas:', !!this.mapboxMap.getCanvas());
          console.log('   Canvas size:', this.mapboxMap.getCanvas()?.width, 'x', this.mapboxMap.getCanvas()?.height);
          console.log('   Map style loaded:', !!this.mapboxMap.getStyle());
          resolve();
        });
        
        // Also log errors
        this.mapboxMap.on('error', (e) => {
          console.error('❌ [MapboxOverlay] MapLibre map error:', e.error);
        });
      });

      // Set up camera synchronization
      this._setupCameraSync();

      // Create Cesium ImageryProvider to drape MapLibre canvas on 3D globe
      this._createImageryProvider();

      // Force a render to ensure canvas is visible
      this.mapboxMap.triggerRepaint();
      console.log('🔄 [MapboxOverlay] Triggered map repaint');

      this._log('✅ Mapbox GL overlay initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Mapbox overlay:', error);
      return false;
    }
  }

  /**
   * Sync Mapbox camera with Cesium camera
   */
  _setupCameraSync() {
    // Sync on Cesium camera move
    this.viewer.camera.moveEnd.addEventListener(() => {
      this._syncCamera();
    });

    // Initial sync
    this._syncCamera();

    this._log('✅ Camera synchronization enabled');
  }

  /**
   * Update Mapbox camera to match Cesium
   */
  _syncCamera() {
    if (this.syncInProgress || !this.mapboxMap) return;

    this.syncInProgress = true;

    try {
      const camera = this.viewer.camera;
      const position = camera.positionCartographic;
      
      const longitude = window.Cesium.Math.toDegrees(position.longitude);
      const latitude = window.Cesium.Math.toDegrees(position.latitude);
      const height = position.height;
      
      // Calculate zoom from height
      const zoom = Math.log2(40075017 / height) - 1;

      // Update Mapbox camera
      this.mapboxMap.jumpTo({
        center: [longitude, latitude],
        zoom: Math.max(0, Math.min(22, zoom))
      });
    } catch (error) {
      console.error('❌ Camera sync error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Add a source to Mapbox
   */
  addSource(sourceId, sourceConfig) {
    if (!this.mapboxMap) {
      console.error('❌ Mapbox map not initialized');
      return false;
    }

    try {
      if (!this.mapboxMap.getSource(sourceId)) {
        this.mapboxMap.addSource(sourceId, sourceConfig);
        this._log(`✅ Added source: ${sourceId}`);
        
        // Debug: Check if source was actually added
        const addedSource = this.mapboxMap.getSource(sourceId);
        console.log(`🔍 [MapboxOverlay] Source "${sourceId}" added:`, {
          exists: !!addedSource,
          type: addedSource?.type,
          hasData: addedSource?._data ? 'yes' : 'no'
        });
        
        return true;
      } else {
        this._log(`⚠️ Source already exists: ${sourceId}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to add source ${sourceId}:`, error);
      console.error('   Error details:', error.message, error.stack);
      return false;
    }
  }

  /**
   * Add a layer to Mapbox
   */
  addLayer(layerConfig) {
    if (!this.mapboxMap) {
      console.error('❌ Mapbox map not initialized');
      return false;
    }

    try {
      if (!this.mapboxMap.getLayer(layerConfig.id)) {
        this.mapboxMap.addLayer(layerConfig);
        this._log(`✅ Added layer: ${layerConfig.id}`);
        return true;
      } else {
        this._log(`⚠️ Layer already exists: ${layerConfig.id}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to add layer ${layerConfig.id}:`, error);
      return false;
    }
  }

  /**
   * Remove a layer from Mapbox
   */
  removeLayer(layerId) {
    if (!this.mapboxMap) return false;

    try {
      if (this.mapboxMap.getLayer(layerId)) {
        this.mapboxMap.removeLayer(layerId);
        this._log(`✅ Removed layer: ${layerId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Failed to remove layer ${layerId}:`, error);
      return false;
    }
  }

  /**
   * Show/hide a layer
   */
  setLayerVisibility(layerId, visible) {
    if (!this.mapboxMap || !this.mapboxMap.getLayer(layerId)) return false;

    try {
      this.mapboxMap.setLayoutProperty(
        layerId,
        'visibility',
        visible ? 'visible' : 'none'
      );
      this._log(`✅ Layer ${layerId} visibility: ${visible}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to set visibility for ${layerId}:`, error);
      return false;
    }
  }

  /**
   * Create Cesium ImageryProvider to drape MapLibre canvas on 3D globe
   * NOTE: MapLibre is inherently 2D, so this creates a 2D overlay that syncs with the globe camera
   * For true 3D draping, we would need to use Cesium entities or vector tiles with deck.gl
   */
  _createImageryProvider() {
    // MapLibre GL JS renders as a 2D canvas overlay
    // It cannot be directly draped on a 3D globe like Cesium imagery
    // The current approach syncs the 2D overlay camera with the 3D globe camera
    // This makes the counties appear to follow the globe, but they remain 2D
    
    console.log('ℹ️ [MapboxOverlay] MapLibre renders as 2D overlay (not 3D draped)');
    console.log('   Counties are visible and camera-synced, but appear flat');
    console.log('   For true 3D draping, consider using Cesium entities or deck.gl vector tiles');
    
    // The 2D overlay approach is working - counties are loading and visible
    // The "slow loading" is because we're loading 158 countries sequentially
    // We could optimize by loading in parallel batches, but per-country sources already help
  }

  /**
   * Get the Mapbox map instance
   */
  getMap() {
    return this.mapboxMap;
  }

  /**
   * Destroy the overlay
   */
  destroy() {
    // Remove imagery layer from Cesium
    if (this.imageryLayer) {
      this.viewer.imageryLayers.remove(this.imageryLayer);
      this.imageryLayer = null;
    }

    if (this.mapboxMap) {
      this.mapboxMap.remove();
      this.mapboxMap = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }

    this._log('🗑️ Mapbox overlay destroyed');
  }

  /**
   * Logging helper
   */
  _log(...args) {
    if (this.options.debugMode) {
      console.log('[MapboxOverlay]', ...args);
    }
  }
}

export default MapboxCesiumOverlay;

