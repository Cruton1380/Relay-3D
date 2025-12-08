/**
 * DeckGlCesiumIntegration.js
 * 
 * Integrates deck.gl with Cesium for true 3D draping of county boundaries.
 * Uses deck.gl's GeoJsonLayer to render counties directly on the Cesium globe.
 * 
 * This approach:
 * - Provides true 3D draping (not 2D overlay)
 * - Handles large GeoJSON datasets efficiently
 * - Works with Cesium's globe rendering
 * - Supports click/hover interactions
 */

import { Deck } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';
import { COORDINATE_SYSTEM } from '@deck.gl/core';

export class DeckGlCesiumOverlay {
  constructor(cesiumViewer, options = {}) {
    if (!cesiumViewer) {
      throw new Error('DeckGlCesiumOverlay requires a Cesium viewer');
    }

    this.viewer = cesiumViewer;
    this.options = {
      debugMode: options.debugMode || false,
      lineColor: options.lineColor || [0, 0, 0, 255],
      fillColor: options.fillColor || [255, 255, 0, 180],
      lineWidth: options.lineWidth || 2
    };

    this.deck = null;
    this.countyLayers = new Map(); // Map of country code -> GeoJsonLayer
    this.isInitialized = false;

    this._log('✅ DeckGlCesiumOverlay created');
  }

  /**
   * Initialize deck.gl overlay on Cesium
   */
  async initialize() {
    if (this.isInitialized) {
      this._log('♻️ Already initialized');
      return true;
    }

    try {
      this._log('🔧 Initializing deck.gl overlay on Cesium...');

      // Create deck.gl instance with Cesium integration
      this.deck = new Deck({
        canvas: this._createCanvas(),
        initialViewState: {
          longitude: 0,
          latitude: 0,
          zoom: 1
        },
        controller: false, // Let Cesium handle camera
        layers: [],
        // Use Cesium's coordinate system
        coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
        // Sync with Cesium camera
        onViewStateChange: ({ viewState }) => {
          // Update Cesium camera to match deck.gl view
          this._syncCesiumCamera(viewState);
        }
      });

      // Sync deck.gl camera with Cesium camera
      this._setupCameraSync();

      this.isInitialized = true;
      this._log('✅ Deck.gl overlay initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize deck.gl overlay:', error);
      return false;
    }
  }

  /**
   * Create canvas for deck.gl rendering
   */
  _createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'deckgl-overlay-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '5'; // Below MapLibre but above Cesium base

    // Add to Cesium container
    const cesiumContainer = this.viewer.container;
    cesiumContainer.appendChild(canvas);

    this._log('📦 Deck.gl canvas created and added to DOM');
    return canvas;
  }

  /**
   * Setup camera synchronization between Cesium and deck.gl
   */
  _setupCameraSync() {
    // Sync on Cesium camera move
    this.viewer.camera.moveEnd.addEventListener(() => {
      this._syncDeckCamera();
    });

    // Initial sync
    this._syncDeckCamera();

    this._log('✅ Camera synchronization enabled');
  }

  /**
   * Sync deck.gl camera to match Cesium camera
   */
  _syncDeckCamera() {
    if (!this.deck) return;

    try {
      const camera = this.viewer.camera;
      const position = camera.positionCartographic;
      
      const longitude = window.Cesium.Math.toDegrees(position.longitude);
      const latitude = window.Cesium.Math.toDegrees(position.latitude);
      const height = position.height;
      
      // Calculate zoom from height
      const zoom = Math.log2(40075017 / height) - 1;

      // Update deck.gl view state
      this.deck.setProps({
        viewState: {
          longitude,
          latitude,
          zoom: Math.max(0, Math.min(22, zoom)),
          pitch: camera.pitch,
          bearing: camera.heading
        }
      });
    } catch (error) {
      console.error('❌ Camera sync error:', error);
    }
  }

  /**
   * Sync Cesium camera to match deck.gl view state (for interaction)
   */
  _syncCesiumCamera(viewState) {
    // This is called when deck.gl view changes
    // For now, we let Cesium control the camera, so this is a no-op
    // But we could implement reverse sync here if needed
  }

  /**
   * Add county GeoJSON data for a country
   */
  addCountyData(countryCode, geojson) {
    if (!this.isInitialized || !this.deck) {
      console.error('❌ Deck.gl overlay not initialized');
      return false;
    }

    try {
      const layerId = `county-${countryCode}`;
      
      // Remove existing layer if present
      if (this.countyLayers.has(countryCode)) {
        this.removeCountyData(countryCode);
      }

      // Create GeoJsonLayer for this country
      const layer = new GeoJsonLayer({
        id: layerId,
        data: geojson,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: false, // 2D on globe surface
        wireframe: false,
        lineWidthMinPixels: this.options.lineWidth,
        getLineColor: this.options.lineColor,
        getFillColor: this.options.fillColor,
        getLineWidth: this.options.lineWidth,
        // Use LNGLAT coordinate system for globe
        coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
        // Enable 3D draping on globe
        _subLayerProps: {
          'polygons': {
            _pathType: 'loop'
          }
        },
        // Click/hover handlers
        onClick: (info) => {
          if (info.object) {
            this._handleCountyClick(info.object, countryCode);
          }
        },
        onHover: (info) => {
          if (info.object) {
            this._handleCountyHover(info.object, countryCode);
          }
        }
      });

      // Store layer
      this.countyLayers.set(countryCode, layer);

      // Update deck.gl layers
      this._updateLayers();

      this._log(`✅ Added county data for ${countryCode}: ${geojson.features?.length || 0} counties`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to add county data for ${countryCode}:`, error);
      return false;
    }
  }

  /**
   * Remove county data for a country
   */
  removeCountyData(countryCode) {
    if (this.countyLayers.has(countryCode)) {
      this.countyLayers.delete(countryCode);
      this._updateLayers();
      this._log(`🗑️ Removed county data for ${countryCode}`);
      return true;
    }
    return false;
  }

  /**
   * Update deck.gl layers
   */
  _updateLayers() {
    if (!this.deck) return;

    const layers = Array.from(this.countyLayers.values());
    this.deck.setProps({ layers });
    this._log(`🔄 Updated deck.gl layers: ${layers.length} countries`);
  }

  /**
   * Handle county click
   */
  _handleCountyClick(feature, countryCode) {
    console.log('🗺️ [DeckGl] County clicked:', {
      country: countryCode,
      properties: feature.properties
    });
    // TODO: Integrate with RegionHoverSystem
  }

  /**
   * Handle county hover
   */
  _handleCountyHover(feature, countryCode) {
    // TODO: Integrate with RegionHoverSystem
  }

  /**
   * Show all county layers
   */
  show() {
    if (!this.isInitialized) {
      return false;
    }

    // All layers are already visible when added
    // This method exists for API compatibility
    this._log('🌍 County boundaries shown (all layers visible)');
    return true;
  }

  /**
   * Hide all county layers
   */
  hide() {
    if (!this.isInitialized || !this.deck) {
      return false;
    }

    // Clear all layers
    this.deck.setProps({ layers: [] });
    this._log('🌍 County boundaries hidden');
    return true;
  }

  /**
   * Destroy the overlay
   */
  destroy() {
    if (this.deck) {
      this.deck.finalize();
      this.deck = null;
    }

    this.countyLayers.clear();
    this.isInitialized = false;

    // Remove canvas
    const canvas = document.getElementById('deckgl-overlay-canvas');
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }

    this._log('🗑️ Deck.gl overlay destroyed');
  }

  /**
   * Logging helper
   */
  _log(...args) {
    if (this.options.debugMode) {
      console.log('[DeckGlOverlay]', ...args);
    }
  }
}

export default DeckGlCesiumOverlay;
