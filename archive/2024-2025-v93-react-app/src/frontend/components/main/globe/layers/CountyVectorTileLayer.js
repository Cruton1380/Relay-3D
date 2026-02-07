/**
 * CountyVectorTileLayer.js
 * 
 * Deck.gl MVTLayer wrapper for rendering county boundaries from vector tiles.
 * Replaces Cesium entity-based rendering to solve entity overload issues.
 * 
 * Usage:
 *   import createCountyVectorTileLayer from './layers/CountyVectorTileLayer';
 *   
 *   const layer = createCountyVectorTileLayer({
 *     urlTemplate: 'https://cdn.example.com/tiles/county/{z}/{x}/{y}.pbf',
 *     visible: true,
 *     onClick: (info) => console.log('County clicked:', info.properties),
 *     onHover: (info) => console.log('County hovered:', info.properties)
 *   });
 */

import { MVTLayer } from '@deck.gl/geo-layers';
import { COORDINATE_SYSTEM } from '@deck.gl/core';

/**
 * Create a deck.gl MVTLayer for county boundaries
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.id - Layer ID (default: 'county-mvt')
 * @param {string} options.urlTemplate - Tile URL template (e.g., 'https://cdn.example.com/tiles/county/{z}/{x}/{y}.pbf')
 * @param {boolean} options.visible - Layer visibility (default: true)
 * @param {Function} options.getFillColor - Function to get fill color from feature (default: semi-transparent white)
 * @param {Function} options.getLineColor - Function to get line color from feature (default: dark gray)
 * @param {number} options.lineWidth - Line width in pixels (default: 1)
 * @param {boolean} options.pickable - Enable picking for clicks/hovers (default: true)
 * @param {Function} options.onClick - Click handler callback
 * @param {Function} options.onHover - Hover handler callback
 * @returns {MVTLayer} Configured MVTLayer instance
 */
export default function createCountyVectorTileLayer({
  id = 'county-mvt',
  urlTemplate,
  visible = true,
  getFillColor = d => [255, 255, 255, 120], // Semi-transparent white fill
  getLineColor = d => [40, 40, 40], // Dark gray outline
  lineWidth = 1,
  pickable = true,
  onClick = () => {},
  onHover = () => {}
}) {
  if (!urlTemplate) {
    throw new Error('CountyVectorTileLayer requires urlTemplate');
  }

  return new MVTLayer({
    id,
    data: urlTemplate,
    pickable,
    visible,
    opacity: 1,
    
    // Coordinate system: Web Mercator (standard for MVT tiles)
    coordinateSystem: COORDINATE_SYSTEM.WEB_MERCATOR,
    
    // Styling functions
    getFillColor,
    getLineColor,
    getLineWidth: lineWidth,
    
    // MVTLayer-specific options
    minZoom: 0,
    maxZoom: 12,
    binary: true, // Use binary format for better performance
    
    // Feature styling can be a function that reads feature.properties
    // For example, you could color by country:
    // getFillColor: d => {
    //   const country = d.properties?.ADMIN || d.properties?.country;
    //   return getCountryColor(country);
    // },
    
    // Event handlers
    onClick: ({ object, x, y, layer }) => {
      if (!object) return;
      
      // object.properties contains feature properties including feature_id
      // Pass to existing click handler
      onClick({
        properties: object.properties,
        featureId: object.properties?.feature_id || object.properties?.id,
        x,
        y,
        layer
      });
    },
    
    onHover: ({ object, x, y, layer }) => {
      // object is null when not hovering over a feature
      onHover({
        properties: object ? object.properties : null,
        featureId: object?.properties?.feature_id || object?.properties?.id || null,
        x,
        y,
        layer
      });
    },
    
    // Update triggers - re-render when these change
    updateTriggers: {
      getFillColor,
      getLineColor,
      visible
    }
  });
}

