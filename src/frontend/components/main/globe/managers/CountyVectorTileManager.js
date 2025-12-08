/**
 * CountyVectorTileManager.js
 * 
 * Manages county boundary rendering using vector tiles (MVT) via deck.gl.
 * Replaces CountyBoundaryManager entity-based approach to solve entity overload.
 * 
 * Key differences from CountyBoundaryManager:
 * - Uses deck.gl MVTLayer instead of Cesium entities
 * - Loads tiles on-demand (viewport-based)
 * - No entity count limits
 * - GPU-accelerated rendering
 * - Scales to millions of features
 * 
 * Usage:
 *   const manager = new CountyVectorTileManager(viewer, deckOverlay);
 *   manager.show();
 *   manager.hide();
 */

import createCountyVectorTileLayer from '../layers/CountyVectorTileLayer';

export class CountyVectorTileManager {
  constructor(viewer, deckOverlay, options = {}) {
    if (!viewer) {
      throw new Error('CountyVectorTileManager requires a Cesium viewer');
    }
    
    if (!deckOverlay) {
      throw new Error('CountyVectorTileManager requires a deck.gl overlay');
    }

    this.viewer = viewer;
    this.deckOverlay = deckOverlay;
    this.options = {
      urlTemplate: options.urlTemplate || '/tiles/county/{z}/{x}/{y}.pbf',
      visible: false,
      debugMode: options.debugMode || false,
      ...options
    };

    this.layer = null;
    this.isVisible = false;
    this.onClick = options.onClick || null;
    this.onHover = options.onHover || null;

    this._log('✅ CountyVectorTileManager initialized');
  }

  /**
   * Logging helper (respects debug mode)
   */
  _log(...args) {
    if (this.options.debugMode) {
      console.log('[CountyVectorTile]', ...args);
    }
  }

  /**
   * Show county boundaries
   */
  show() {
    if (this.isVisible) {
      this._log('⚠️ Counties already visible');
      return;
    }

    this._log('👁️ Showing county boundaries...');

    // Create the vector tile layer
    this.layer = createCountyVectorTileLayer({
      id: 'county-mvt',
      urlTemplate: this.options.urlTemplate,
      visible: true,
      getFillColor: [255, 255, 0, 30], // Yellow fill (matching entity style)
      getLineColor: [255, 255, 0], // Yellow outline (matching entity style)
      lineWidth: 3,
      pickable: true,
      onClick: this._handleClick.bind(this),
      onHover: this._handleHover.bind(this)
    });

    // Add layer to deck overlay
    const currentLayers = this.deckOverlay.props.layers || [];
    this.deckOverlay.setProps({
      layers: [...currentLayers, this.layer]
    });

    this.isVisible = true;
    this._log('✅ County boundaries visible');
  }

  /**
   * Hide county boundaries
   */
  hide() {
    if (!this.isVisible) {
      this._log('⚠️ Counties already hidden');
      return;
    }

    this._log('👁️ Hiding county boundaries...');

    // Remove layer from deck overlay
    const currentLayers = this.deckOverlay.props.layers || [];
    const filteredLayers = currentLayers.filter(layer => layer.id !== 'county-mvt');
    
    this.deckOverlay.setProps({
      layers: filteredLayers
    });

    this.layer = null;
    this.isVisible = false;
    this._log('✅ County boundaries hidden');
  }

  /**
   * Toggle visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Handle click events from deck.gl
   */
  _handleClick({ properties, featureId, x, y }) {
    this._log('🖱️ County clicked:', properties);
    
    if (this.onClick) {
      this.onClick({
        type: 'county',
        properties,
        featureId,
        coordinates: { x, y }
      });
    }
  }

  /**
   * Handle hover events from deck.gl
   */
  _handleHover({ properties, featureId, x, y }) {
    if (properties) {
      this._log('🖱️ County hovered:', properties);
    }
    
    if (this.onHover) {
      this.onHover({
        type: 'county',
        properties,
        featureId,
        coordinates: { x, y }
      });
    }
  }

  /**
   * Update layer visibility
   */
  setVisible(visible) {
    if (visible) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      visible: this.isVisible,
      layerId: this.layer?.id || null,
      urlTemplate: this.options.urlTemplate
    };
  }

  /**
   * Update URL template (for switching tile sources)
   */
  updateUrlTemplate(urlTemplate) {
    this.options.urlTemplate = urlTemplate;
    
    if (this.isVisible) {
      // Recreate layer with new URL
      this.hide();
      this.show();
    }
  }
}

export default CountyVectorTileManager;

