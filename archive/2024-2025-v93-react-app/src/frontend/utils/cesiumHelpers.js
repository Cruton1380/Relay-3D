// src/frontend/utils/cesiumHelpers.js
/**
 * Cesium Rendering Helpers
 * Manages dynamic render mode selection for voter visualization
 * 
 * Render Modes:
 * - ENTITIES (≤ 500 points): Full 3D entities with individual styling
 * - POINT_PRIMITIVES (≤ 50,000 points): High-performance point rendering
 * - HEATMAP (> 50,000 points): Aggregated heatmap visualization
 * 
 * Note: Cesium is accessed via window.Cesium (loaded globally)
 */

// Render mode thresholds
export const RENDER_THRESHOLDS = {
  ENTITIES_MAX: 500,
  POINT_PRIMITIVES_MAX: 50000
};

// Render modes
export const RENDER_MODE = {
  ENTITIES: 'entities',
  POINT_PRIMITIVES: 'pointPrimitives',
  HEATMAP: 'heatmap'
};

/**
 * Determine the appropriate render mode based on point count
 * @param {number} pointCount - Number of points to render
 * @returns {string} Render mode (ENTITIES, POINT_PRIMITIVES, or HEATMAP)
 */
export function selectRenderMode(pointCount) {
  if (pointCount <= RENDER_THRESHOLDS.ENTITIES_MAX) {
    return RENDER_MODE.ENTITIES;
  } else if (pointCount <= RENDER_THRESHOLDS.POINT_PRIMITIVES_MAX) {
    return RENDER_MODE.POINT_PRIMITIVES;
  } else {
    return RENDER_MODE.HEATMAP;
  }
}

/**
 * Render voters as individual Cesium entities (for small datasets)
 * @param {Cesium.Viewer} viewer - Cesium viewer instance
 * @param {Array} voters - Array of voter objects with {lat, lng, userId, ...}
 * @param {Object} options - Rendering options
 * @returns {Array} Array of created entity IDs
 */
export function renderVotersAsEntities(viewer, voters, options = {}) {
  const {
    color = window.Cesium.Color.GREEN.withAlpha(0.8),
    towerHeight = 5000,
    towerRadius = 1000,
    pixelSize = 8,
    outlineWidth = 1,
    outlineColor = window.Cesium.Color.WHITE,
    showLabel = false
  } = options;

  const entityIds = [];

  for (const voter of voters) {
    if (!voter.lat || !voter.lng) continue;

    const position = window.Cesium.Cartesian3.fromDegrees(voter.lng, voter.lat, towerHeight / 2);
    
    const entity = viewer.entities.add({
      position: position,
      point: {
        pixelSize: pixelSize,
        color: color,
        outlineColor: outlineColor,
        outlineWidth: outlineWidth,
        heightReference: window.Cesium.HeightReference.RELATIVE_TO_GROUND
      },
      cylinder: {
        length: towerHeight,
        topRadius: towerRadius,
        bottomRadius: towerRadius,
        material: color,
        heightReference: window.Cesium.HeightReference.RELATIVE_TO_GROUND
      },
      properties: {
        type: 'voter',
        userId: voter.userId,
        candidateId: voter.candidateId,
        privacyLevel: voter.privacyLevel || 'unknown'
      }
    });

    if (showLabel && voter.userId) {
      entity.label = {
        text: voter.userId.substring(0, 8),
        font: '12px sans-serif',
        fillColor: window.Cesium.Color.WHITE,
        outlineColor: window.Cesium.Color.BLACK,
        outlineWidth: 2,
        style: window.Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: window.Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new window.Cesium.Cartesian2(0, -10)
      };
    }

    entityIds.push(entity.id);
  }

  console.log(`[CesiumHelpers] Rendered ${entityIds.length} voters as entities`);
  return entityIds;
}

/**
 * Render voters as point primitives (for medium datasets)
 * @param {Cesium.Viewer} viewer - Cesium viewer instance
 * @param {Array} voters - Array of voter objects with {lat, lng, userId, ...}
 * @param {Object} options - Rendering options
 * @returns {Cesium.PointPrimitiveCollection} The point primitive collection
 */
export function renderVotersAsPointPrimitives(viewer, voters, options = {}) {
  const {
    color = window.Cesium.Color.GREEN.withAlpha(0.8),
    pixelSize = 6,
    outlineWidth = 1,
    outlineColor = window.Cesium.Color.WHITE
  } = options;

  // Create a point primitive collection
  const pointPrimitives = viewer.scene.primitives.add(new window.Cesium.PointPrimitiveCollection());

  for (const voter of voters) {
    if (!voter.lat || !voter.lng) continue;

    const position = window.Cesium.Cartesian3.fromDegrees(voter.lng, voter.lat, 0);
    
    pointPrimitives.add({
      position: position,
      color: color,
      pixelSize: pixelSize,
      outlineColor: outlineColor,
      outlineWidth: outlineWidth,
      id: voter.userId // Store user ID for picking
    });
  }

  console.log(`[CesiumHelpers] Rendered ${voters.length} voters as point primitives`);
  return pointPrimitives;
}

/**
 * Render voters as a heatmap (for large datasets)
 * @param {Cesium.Viewer} viewer - Cesium viewer instance
 * @param {Array} voters - Array of voter objects with {lat, lng, userId, ...}
 * @param {Object} options - Rendering options
 * @returns {Object} Heatmap metadata
 */
export function renderVotersAsHeatmap(viewer, voters, options = {}) {
  const {
    gridResolution = 0.5, // degrees
    minOpacity = 0.3,
    maxOpacity = 0.9,
    colorGradient = [
      { threshold: 0.2, color: window.Cesium.Color.BLUE },
      { threshold: 0.5, color: window.Cesium.Color.GREEN },
      { threshold: 0.7, color: window.Cesium.Color.YELLOW },
      { threshold: 1.0, color: window.Cesium.Color.RED }
    ]
  } = options;

  // Create a grid to aggregate voters
  const grid = new Map();
  let maxCount = 0;

  for (const voter of voters) {
    if (!voter.lat || !voter.lng) continue;

    const gridLat = Math.floor(voter.lat / gridResolution) * gridResolution;
    const gridLng = Math.floor(voter.lng / gridResolution) * gridResolution;
    const key = `${gridLat},${gridLng}`;

    const count = (grid.get(key) || 0) + 1;
    grid.set(key, count);
    maxCount = Math.max(maxCount, count);
  }

  // Render grid cells as rectangles
  const rectangleIds = [];
  
  for (const [key, count] of grid.entries()) {
    const [latStr, lngStr] = key.split(',');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    // Normalize count to 0-1
    const normalized = count / maxCount;

    // Select color based on gradient
    let color = colorGradient[0].color;
    for (const step of colorGradient) {
      if (normalized >= step.threshold) {
        color = step.color;
      }
    }

    // Calculate opacity based on density
    const opacity = minOpacity + (maxOpacity - minOpacity) * normalized;

    const entity = viewer.entities.add({
      rectangle: {
        coordinates: window.Cesium.Rectangle.fromDegrees(
          lng,
          lat,
          lng + gridResolution,
          lat + gridResolution
        ),
        material: color.withAlpha(opacity),
        height: 0,
        heightReference: window.Cesium.HeightReference.CLAMP_TO_GROUND
      },
      properties: {
        type: 'heatmap',
        voterCount: count,
        density: normalized
      }
    });

    rectangleIds.push(entity.id);
  }

  console.log(`[CesiumHelpers] Rendered ${voters.length} voters as heatmap (${grid.size} cells)`);
  
  return {
    mode: RENDER_MODE.HEATMAP,
    cellCount: grid.size,
    voterCount: voters.length,
    maxDensity: maxCount,
    entityIds: rectangleIds
  };
}

/**
 * Render voters using the appropriate mode based on count
 * @param {Cesium.Viewer} viewer - Cesium viewer instance
 * @param {Array} voters - Array of voter objects
 * @param {Object} options - Rendering options
 * @returns {Object} Render result with mode and metadata
 */
export function renderVoters(viewer, voters, options = {}) {
  const startTime = performance.now();
  
  const mode = selectRenderMode(voters.length);
  let result = {
    mode,
    voterCount: voters.length,
    renderTime: 0
  };

  console.log(`[CesiumHelpers] Rendering ${voters.length} voters using mode: ${mode}`);

  switch (mode) {
    case RENDER_MODE.ENTITIES:
      result.entityIds = renderVotersAsEntities(viewer, voters, options);
      break;
    
    case RENDER_MODE.POINT_PRIMITIVES:
      result.primitiveCollection = renderVotersAsPointPrimitives(viewer, voters, options);
      break;
    
    case RENDER_MODE.HEATMAP:
      result = { ...result, ...renderVotersAsHeatmap(viewer, voters, options) };
      break;
    
    default:
      console.error(`[CesiumHelpers] Unknown render mode: ${mode}`);
      return null;
  }

  result.renderTime = performance.now() - startTime;
  console.log(`[CesiumHelpers] Render completed in ${result.renderTime.toFixed(2)}ms`);
  
  return result;
}

/**
 * Clear all voter visualizations from the viewer
 * @param {Cesium.Viewer} viewer - Cesium viewer instance
 * @param {Object} renderResult - Result from previous renderVoters call
 */
export function clearVoters(viewer, renderResult) {
  if (!renderResult) return;

  const { mode, entityIds, primitiveCollection } = renderResult;

  switch (mode) {
    case RENDER_MODE.ENTITIES:
    case RENDER_MODE.HEATMAP:
      if (entityIds && Array.isArray(entityIds)) {
        for (const id of entityIds) {
          viewer.entities.removeById(id);
        }
        console.log(`[CesiumHelpers] Cleared ${entityIds.length} entities`);
      }
      break;
    
    case RENDER_MODE.POINT_PRIMITIVES:
      if (primitiveCollection) {
        viewer.scene.primitives.remove(primitiveCollection);
        console.log(`[CesiumHelpers] Cleared point primitive collection`);
      }
      break;
  }
}

/**
 * Calculate bounding box for visible area in the viewer
 * @param {Cesium.Viewer} viewer - Cesium viewer instance
 * @returns {Object} Bounding box {minLat, minLng, maxLat, maxLng}
 */
export function getVisibleBoundingBox(viewer) {
  const scene = viewer.scene;
  const camera = scene.camera;
  const canvas = scene.canvas;

  // Get corners of the canvas
  const corners = [
    new window.Cesium.Cartesian2(0, 0),
    new window.Cesium.Cartesian2(canvas.clientWidth, 0),
    new window.Cesium.Cartesian2(0, canvas.clientHeight),
    new window.Cesium.Cartesian2(canvas.clientWidth, canvas.clientHeight)
  ];

  const positions = corners.map(corner => {
    const ray = camera.getPickRay(corner);
    const position = scene.globe.pick(ray, scene);
    if (position) {
      const cartographic = window.Cesium.Cartographic.fromCartesian(position);
      return {
        lat: window.Cesium.Math.toDegrees(cartographic.latitude),
        lng: window.Cesium.Math.toDegrees(cartographic.longitude)
      };
    }
    return null;
  }).filter(pos => pos !== null);

  if (positions.length === 0) {
    // Fallback: use camera position
    const cartographic = camera.positionCartographic;
    const centerLat = window.Cesium.Math.toDegrees(cartographic.latitude);
    const centerLng = window.Cesium.Math.toDegrees(cartographic.longitude);
    const buffer = 10; // degrees
    
    return {
      minLat: centerLat - buffer,
      minLng: centerLng - buffer,
      maxLat: centerLat + buffer,
      maxLng: centerLng + buffer
    };
  }

  const lats = positions.map(p => p.lat);
  const lngs = positions.map(p => p.lng);

  return {
    minLat: Math.min(...lats),
    minLng: Math.min(...lngs),
    maxLat: Math.max(...lats),
    maxLng: Math.max(...lngs)
  };
}

/**
 * Calculate camera zoom level (approximate)
 * @param {Cesium.Viewer} viewer - Cesium viewer instance
 * @returns {number} Zoom level (0-20, similar to web maps)
 */
export function getCameraZoomLevel(viewer) {
  const camera = viewer.scene.camera;
  const height = camera.positionCartographic.height;
  
  // Approximate zoom level based on camera height
  // Zoom 0 = ~40,000 km, Zoom 20 = ~100 m
  const zoom = Math.max(0, Math.min(20, 20 - Math.log2(height / 100)));
  
  return Math.round(zoom);
}

/**
 * Performance monitoring helper
 * @param {Cesium.Viewer} viewer - Cesium viewer instance
 * @returns {Object} Performance metrics
 */
export function getPerformanceMetrics(viewer) {
  const scene = viewer.scene;
  const globe = scene.globe;

  return {
    fps: Math.round(1000 / scene.lastRenderTime),
    entitiesCount: viewer.entities.values.length,
    primitivesCount: scene.primitives.length,
    tilesLoaded: globe.tilesLoaded,
    tilesLoading: globe._surface._tilesToRenderByTextureCount || 0,
    cameraHeight: Math.round(viewer.scene.camera.positionCartographic.height),
    zoomLevel: getCameraZoomLevel(viewer)
  };
}

export default {
  RENDER_THRESHOLDS,
  RENDER_MODE,
  selectRenderMode,
  renderVoters,
  renderVotersAsEntities,
  renderVotersAsPointPrimitives,
  renderVotersAsHeatmap,
  clearVoters,
  getVisibleBoundingBox,
  getCameraZoomLevel,
  getPerformanceMetrics
};

