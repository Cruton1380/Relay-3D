import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3007;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Extract actual map boundaries from OpenStreetMap
async function extractMapBoundaries(bounds = null) {
  try {
    console.log('🗺️ Extracting actual map boundaries from OpenStreetMap...');
    
    // Use Overpass API to get coastline data
    const overpassQuery = `
      [out:json][timeout:60];
      (
        // Get coastline ways (actual land/water boundaries)
        way["natural"="coastline"];
        // Get administrative boundaries that follow coastlines
        relation["boundary"="administrative"]["admin_level"="2"];
        // Get land areas
        way["landuse"="residential"];
        way["landuse"="commercial"];
        way["landuse"="industrial"];
        way["landuse"="agricultural"];
        way["landuse"="forest"];
        way["natural"="land"];
      );
      out geom;
    `;
    
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    
    console.log('📡 Fetching boundary data from OpenStreetMap Overpass API...');
    const response = await fetch(overpassUrl);
    
    if (!response.ok) {
      throw new Error(`Overpass API failed: ${response.status}`);
    }
    
    const osmData = await response.json();
    console.log(`📦 Received ${osmData.elements?.length || 0} OSM elements`);
    
    // Process coastline data
    const coastlines = processCoastlineData(osmData.elements);
    console.log(`🌊 Processed ${coastlines.length} coastline segments`);
    
    // Process administrative boundaries
    const adminBoundaries = processAdminBoundaries(osmData.elements);
    console.log(`🏛️ Processed ${adminBoundaries.length} administrative boundaries`);
    
    // Combine and optimize boundaries
    const mapBoundaries = combineBoundaries(coastlines, adminBoundaries);
    console.log(`🎯 Created ${mapBoundaries.length} optimized map boundaries`);
    
    return mapBoundaries;
    
  } catch (error) {
    console.error('❌ Error extracting map boundaries:', error);
    throw error;
  }
}

// Process coastline data from OSM
function processCoastlineData(elements) {
  const coastlines = [];
  
  elements.forEach(element => {
    if (element.type === 'way' && element.tags && element.tags.natural === 'coastline') {
      try {
        if (element.geometry && element.geometry.length > 0) {
          // Convert OSM geometry to GeoJSON LineString
          const coordinates = element.geometry.map(point => [point.lon, point.lat]);
          
          coastlines.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            },
            properties: {
              id: element.id,
              type: 'coastline',
              source: 'OpenStreetMap',
              natural: 'coastline',
              precision: 'high',
              coordinate_count: coordinates.length
            }
          });
        }
      } catch (error) {
        console.warn(`⚠️ Error processing coastline ${element.id}:`, error);
      }
    }
  });
  
  return coastlines;
}

// Process administrative boundaries
function processAdminBoundaries(elements) {
  const boundaries = [];
  
  elements.forEach(element => {
    if (element.type === 'relation' && element.tags && element.tags.boundary === 'administrative') {
      try {
        if (element.members && element.members.length > 0) {
          // Process relation members to build boundary
          const boundaryCoords = [];
          
          element.members.forEach(member => {
            if (member.type === 'way' && member.geometry) {
              const coords = member.geometry.map(point => [point.lon, point.lat]);
              boundaryCoords.push(...coords);
            }
          });
          
          if (boundaryCoords.length > 0) {
            boundaries.push({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: boundaryCoords
              },
              properties: {
                id: element.id,
                type: 'administrative',
                source: 'OpenStreetMap',
                admin_level: element.tags.admin_level,
                name: element.tags.name,
                precision: 'high',
                coordinate_count: boundaryCoords.length
              }
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error processing admin boundary ${element.id}:`, error);
      }
    }
  });
  
  return boundaries;
}

// Combine and optimize boundaries
function combineBoundaries(coastlines, adminBoundaries) {
  const allBoundaries = [...coastlines, ...adminBoundaries];
  
  // Filter out ocean boundaries and focus on land boundaries
  const landBoundaries = allBoundaries.filter(boundary => {
    // Filter out boundaries that are mostly over water
    const coords = boundary.geometry.coordinates;
    if (coords.length < 3) return false;
    
    // Simple heuristic: if most coordinates are over water (negative latitude or extreme longitude), skip
    const waterCoords = coords.filter(coord => {
      const [lon, lat] = coord;
      // Filter out coordinates that are likely over open ocean
      return lat < -60 || lat > 85 || Math.abs(lon) > 180;
    });
    
    const waterRatio = waterCoords.length / coords.length;
    return waterRatio < 0.3; // Keep if less than 30% are over water
  });
  
  console.log(`🏝️ Filtered to ${landBoundaries.length} land-focused boundaries`);
  
  return landBoundaries;
}

// API endpoint to get map boundaries
app.get('/api/map-boundaries', async (req, res) => {
  try {
    const bounds = req.query.bounds ? JSON.parse(req.query.bounds) : null;
    
    console.log('🗺️ Map boundary extraction requested');
    if (bounds) {
      console.log(`📍 Bounds: ${bounds.join(', ')}`);
    }
    
    const boundaries = await extractMapBoundaries(bounds);
    
    const response = {
      type: 'FeatureCollection',
      metadata: {
        source: 'Map Boundary Extractor',
        description: 'Actual map boundaries extracted from OpenStreetMap',
        boundaries_count: boundaries.length,
        extraction_method: 'OpenStreetMap Overpass API',
        precision: 'High - follows actual map features',
        coordinate_system: 'WGS84',
        timestamp: new Date().toISOString()
      },
      features: boundaries
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error serving map boundaries:', error);
    res.status(500).json({
      error: 'Failed to extract map boundaries',
      details: error.message
    });
  }
});

// Alternative: Use Natural Earth coastlines (more reliable)
app.get('/api/map-boundaries/coastlines', async (req, res) => {
  try {
    console.log('🌊 Serving Natural Earth coastline boundaries...');
    
    // Use Natural Earth coastlines which are more reliable
    const coastlinesUrl = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_coastline.geojson';
    
    const response = await fetch(coastlinesUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch coastlines: ${response.status}`);
    }
    
    const coastlinesData = await response.json();
    
    // Filter to focus on land boundaries, not ocean boundaries
    const landBoundaries = coastlinesData.features.filter(feature => {
      const coords = feature.geometry.coordinates;
      if (!coords || coords.length === 0) return false;
      
      // Calculate centroid
      let sumLon = 0, sumLat = 0;
      coords.forEach(coord => {
        sumLon += coord[0];
        sumLat += coord[1];
      });
      const centroidLon = sumLon / coords.length;
      const centroidLat = sumLat / coords.length;
      
      // Filter out boundaries that are mostly over open ocean
      return centroidLat > -60 && centroidLat < 85 && 
             centroidLon > -180 && centroidLon < 180;
    });
    
    console.log(`🏝️ Filtered to ${landBoundaries.length} land-focused coastline segments`);
    
    const responseData = {
      type: 'FeatureCollection',
      metadata: {
        source: 'Natural Earth Coastlines',
        description: 'Land-focused coastline boundaries',
        boundaries_count: landBoundaries.length,
        precision: '10m resolution',
        coordinate_system: 'WGS84',
        filtered: 'Ocean boundaries removed',
        timestamp: new Date().toISOString()
      },
      features: landBoundaries
    };
    
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ Error serving coastline boundaries:', error);
    res.status(500).json({
      error: 'Failed to load coastline boundaries',
      details: error.message
    });
  }
});

// Health check
app.get('/api/map-boundaries/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'Map Boundary Extractor',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🗺️ Map Boundary Extractor running on http://localhost:${PORT}`);
  console.log(`🌊 Coastlines: http://localhost:${PORT}/api/map-boundaries/coastlines`);
  console.log(`🗺️ Map Boundaries: http://localhost:${PORT}/api/map-boundaries`);
});

export default app;
