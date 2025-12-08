/**
 * BoundaryPreviewGenerator.js
 * 
 * Generates visual diff images showing boundary changes between
 * the official boundary and proposed alternatives.
 * 
 * 🔴 RED = Territory ADDED to region (expansion)
 * 🔵 BLUE = Territory REMOVED from region (contraction)
 */

/**
 * Calculate area of polygon in km²
 * Uses spherical earth approximation
 */
function calculatePolygonArea(coords) {
  if (!coords || coords.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    area += (lng2 - lng1) * (lat2 + lat1);
  }
  
  // Convert to km² (rough approximation)
  const km2 = Math.abs(area * 111.32 * 111.32 / 2);
  return Math.round(km2);
}

/**
 * Find vertices that have changed between original and proposed boundaries
 * Returns bounding box of changed area
 */
function findChangedAreaBounds(originalGeometry, proposedGeometry, threshold = 0.01) {
  const changedPoints = [];
  
  // Find all vertices in proposed that are far from any vertex in original
  proposedGeometry.forEach((proposedPoint, i) => {
    let minDistance = Infinity;
    
    originalGeometry.forEach(originalPoint => {
      const dist = Math.sqrt(
        Math.pow(proposedPoint[0] - originalPoint[0], 2) + 
        Math.pow(proposedPoint[1] - originalPoint[1], 2)
      );
      minDistance = Math.min(minDistance, dist);
    });
    
    // If this proposed vertex is far from all original vertices, it's a change
    if (minDistance > threshold) {
      changedPoints.push(proposedPoint);
    }
  });
  
  // Also find original vertices that are far from proposed (deletions)
  originalGeometry.forEach(originalPoint => {
    let minDistance = Infinity;
    
    proposedGeometry.forEach(proposedPoint => {
      const dist = Math.sqrt(
        Math.pow(originalPoint[0] - proposedPoint[0], 2) + 
        Math.pow(originalPoint[1] - proposedPoint[1], 2)
      );
      minDistance = Math.min(minDistance, dist);
    });
    
    if (minDistance > threshold) {
      changedPoints.push(originalPoint);
    }
  });
  
  if (changedPoints.length === 0) {
    // No significant changes, return full bounds
    return null;
  }
  
  // Calculate bounding box of changed area
  const lngs = changedPoints.map(p => p[0]);
  const lats = changedPoints.map(p => p[1]);
  
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  
  // Add padding around changed area (10% of range)
  const lngPadding = (maxLng - minLng) * 0.15 || 0.5;
  const latPadding = (maxLat - minLat) * 0.15 || 0.5;
  
  return {
    minLng: minLng - lngPadding,
    maxLng: maxLng + lngPadding,
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    center: {
      lng: (minLng + maxLng) / 2,
      lat: (minLat + maxLat) / 2
    }
  };
}

/**
 * Generate a preview image showing the difference between two boundaries
 * 🔴 RED areas = Territory ADDED
 * 🔵 BLUE areas = Territory REMOVED
 * 
 * @param {Array} originalGeometry - Original boundary coordinates [[lng, lat], ...]
 * @param {Array} proposedGeometry - Proposed boundary coordinates [[lng, lat], ...]
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @param {boolean} zoomToChanges - If true, zoom to changed area only
 * @returns {Object} - { dataURL: string, bounds: Object }
 */
export function generateDiffImage(originalGeometry, proposedGeometry, width = 200, height = 120, zoomToChanges = true) {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(0, 0, width, height);

  // Calculate bounding box - zoom to changed area if requested
  let minLng, maxLng, minLat, maxLat, bounds = null;
  
  if (zoomToChanges) {
    bounds = findChangedAreaBounds(originalGeometry, proposedGeometry);
  }
  
  if (bounds) {
    // Use zoomed bounds around changes
    minLng = bounds.minLng;
    maxLng = bounds.maxLng;
    minLat = bounds.minLat;
    maxLat = bounds.maxLat;
  } else {
    // Use full bounds
    const allCoords = [...originalGeometry, ...proposedGeometry];
    const lngs = allCoords.map(c => c[0]);
    const lats = allCoords.map(c => c[1]);
    
    minLng = Math.min(...lngs);
    maxLng = Math.max(...lngs);
    minLat = Math.min(...lats);
    maxLat = Math.max(...lats);
  }
  
  const lngRange = maxLng - minLng || 1;
  const latRange = maxLat - minLat || 1;

  // Add padding
  const padding = 10;
  const drawWidth = width - 2 * padding;
  const drawHeight = height - 2 * padding;

  // Convert geo coordinates to canvas coordinates
  const toCanvasCoords = (lng, lat) => {
    const x = padding + ((lng - minLng) / lngRange) * drawWidth;
    const y = height - padding - ((lat - minLat) / latRange) * drawHeight;
    return { x, y };
  };

  // Draw original boundary (thin gray outline)
  if (originalGeometry && originalGeometry.length > 0) {
    ctx.beginPath();
    const start = toCanvasCoords(originalGeometry[0][0], originalGeometry[0][1]);
    ctx.moveTo(start.x, start.y);
    
    for (let i = 1; i < originalGeometry.length; i++) {
      const point = toCanvasCoords(originalGeometry[i][0], originalGeometry[i][1]);
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    
    // Light gray fill to show base territory
    ctx.fillStyle = 'rgba(100, 116, 139, 0.2)';
    ctx.fill();
    
    // Gray outline
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw proposed boundary with RED highlighting for changes
  if (proposedGeometry && proposedGeometry.length > 0) {
    ctx.beginPath();
    const start = toCanvasCoords(proposedGeometry[0][0], proposedGeometry[0][1]);
    ctx.moveTo(start.x, start.y);
    
    for (let i = 1; i < proposedGeometry.length; i++) {
      const point = toCanvasCoords(proposedGeometry[i][0], proposedGeometry[i][1]);
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    
    // 🔴 RED fill to highlight CHANGES (expansion areas)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.fill();
    
    // 🔴 RED outline to emphasize proposal
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Add legend text with area info
  ctx.font = 'bold 10px Arial';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
  ctx.fillText('Official', 5, 12);
  
  ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
  ctx.fillText('Changes', 5, 24);
  
  // Add area statistics if both geometries exist
  if (originalGeometry && proposedGeometry) {
    const originalArea = calculatePolygonArea(originalGeometry);
    const proposedArea = calculatePolygonArea(proposedGeometry);
    const delta = proposedArea - originalArea;
    const deltaPercent = originalArea > 0 ? ((delta / originalArea) * 100).toFixed(1) : '0';
    
    ctx.font = '9px Arial';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
    const sign = delta > 0 ? '+' : '';
    ctx.fillText(`${sign}${deltaPercent}%`, 5, height - 5);
  }

  // Convert to data URL and return with bounds
  return {
    dataURL: canvas.toDataURL('image/png'),
    bounds: bounds || { minLng, maxLng, minLat, maxLat, center: { lng: (minLng + maxLng) / 2, lat: (minLat + maxLat) / 2 } }
  };
}

/**
 * Extract coordinate array from GeoJSON geometry
 * Handles both Polygon and MultiPolygon types
 * @param {Object} geometryData - GeoJSON geometry object
 * @returns {Array} - Array of [lng, lat] coordinates
 */
function extractCoordinates(geometryData) {
  if (!geometryData) {
    return null;
  }

  // If it's already a coordinate array, return it
  if (Array.isArray(geometryData) && geometryData[0] && Array.isArray(geometryData[0]) && 
      typeof geometryData[0][0] === 'number') {
    return geometryData;
  }

  // Handle GeoJSON Polygon: coordinates[0] is the outer ring
  if (geometryData.type === 'Polygon' && geometryData.coordinates && geometryData.coordinates[0]) {
    return geometryData.coordinates[0];
  }

  // Handle GeoJSON MultiPolygon: coordinates[0][0] is the outer ring of the first polygon
  // Use the largest polygon (most coordinates)
  if (geometryData.type === 'MultiPolygon' && geometryData.coordinates) {
    const largestPolygon = geometryData.coordinates.reduce((largest, current) => {
      const currentSize = current[0]?.length || 0;
      const largestSize = largest[0]?.length || 0;
      return currentSize > largestSize ? current : largest;
    }, geometryData.coordinates[0]);
    
    return largestPolygon[0];
  }

  // Fallback: try coordinates[0] if it exists
  if (geometryData.coordinates && geometryData.coordinates[0]) {
    return geometryData.coordinates[0];
  }

  return null;
}

/**
 * Generate preview for all candidates
 * @param {Array} candidates - Array of candidate objects with geometry property
 * @param {Object} officialCandidate - The official boundary candidate
 * @returns {Object} - Map of candidateId -> dataURL
 */
export function generateAllPreviews(candidates, officialCandidate) {
  const previews = {};
  
  // Extract official geometry from either geometry or location.geometry
  const officialGeometryData = officialCandidate?.location?.geometry || officialCandidate?.geometry;
  
  if (!officialGeometryData) {
    console.warn('⚠️ No official boundary geometry found', { officialCandidate });
    return previews;
  }

  const officialGeometry = extractCoordinates(officialGeometryData);
  
  if (!officialGeometry || officialGeometry.length === 0) {
    console.warn('⚠️ Could not extract valid coordinates from official geometry', { 
      type: officialGeometryData.type,
      hasCoordinates: !!officialGeometryData.coordinates 
    });
    return previews;
  }

  console.log('✅ [Preview Generator] Using official geometry with', officialGeometry.length, 'points');

  candidates.forEach(candidate => {
    // Skip the official boundary (it doesn't need a diff)
    if (candidate.isOfficial) {
      return;
    }

    // Extract proposed geometry from either geometry or location.geometry
    const proposedGeometryData = candidate.location?.geometry || candidate.geometry;
    
    if (proposedGeometryData) {
      const proposedGeometry = extractCoordinates(proposedGeometryData);
      
      if (!proposedGeometry || proposedGeometry.length === 0) {
        console.warn(`⚠️ [Preview Generator] Could not extract coordinates for ${candidate.name}`);
        return;
      }

      console.log(`🎨 [Preview Generator] Generating preview for ${candidate.name}:`, {
        candidateId: candidate.id,
        proposedPoints: proposedGeometry.length,
        officialPoints: officialGeometry.length
      });
      
      try {
        const result = generateDiffImage(officialGeometry, proposedGeometry, 200, 120, true);
        previews[candidate.id] = {
          dataURL: result.dataURL,
          bounds: result.bounds
        };
        console.log(`✅ [Preview Generator] Generated preview for ${candidate.name}`, {
          bounds: result.bounds
        });
      } catch (error) {
        console.error(`❌ Failed to generate preview for candidate ${candidate.id}:`, error);
      }
    } else {
      console.warn(`⚠️ [Preview Generator] No geometry found for candidate ${candidate.name}`);
    }
  });

  return previews;
}

/**
 * Generate a simple placeholder image when geometry is not available
 */
export function generatePlaceholderImage(width = 200, height = 120) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(0, 0, width, height);

  // Centered text
  ctx.font = '12px Arial';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('No Preview Available', width / 2, height / 2);

  return canvas.toDataURL('image/png');
}

/**
 * Calculate area change statistics between official and proposed boundaries
 * @param {Array} officialGeometry - Official boundary coordinates
 * @param {Array} proposedGeometry - Proposed boundary coordinates
 * @returns {Object} - { officialArea, proposedArea, deltaArea, deltaPercent }
 */
export function calculateAreaChange(officialGeometry, proposedGeometry) {
  const officialArea = calculatePolygonArea(officialGeometry);
  const proposedArea = calculatePolygonArea(proposedGeometry);
  const deltaArea = proposedArea - officialArea;
  const deltaPercent = officialArea > 0 ? ((deltaArea / officialArea) * 100).toFixed(2) : '0';
  
  return {
    officialArea,
    proposedArea,
    deltaArea,
    deltaPercent: parseFloat(deltaPercent)
  };
}
