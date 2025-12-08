const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8081;

// Enable CORS for all routes - Critical for Cesium to access tiles
app.use(cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Length', 'Content-Range']
}));

// Serve static files with proper headers
app.use(express.static(path.join(__dirname, 'tiles'), {
  setHeaders: (res, filePath) => {
    // Ensure CORS headers are set for all tile requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    
    // Set appropriate content types
    if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.terrain')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

// XYZ Tile endpoint: /tiles/{z}/{x}/{y}.png
app.get('/tiles/:z/:x/:y.:ext', (req, res) => {
  const { z, x, y, ext } = req.params;
  const tilePath = path.join(__dirname, 'tiles', z, x, `${y}.${ext}`);
  
  console.log(`Tile request: Z=${z}, X=${x}, Y=${y}, Extension=${ext}`);
  
  // Check if tile exists
  if (fs.existsSync(tilePath)) {
    res.sendFile(path.resolve(tilePath));
  } else {
    // Return a placeholder tile or 404
    console.log(`Tile not found: ${tilePath}`);
    res.status(404).json({ 
      error: 'Tile not found',
      path: `${z}/${x}/${y}.${ext}`,
      message: 'Place your XYZ tiles in data/tiles/{z}/{x}/{y}.png format'
    });
  }
});

// Terrain endpoint: /terrain/*
app.get('/terrain/*', (req, res) => {
  const terrainPath = path.join(__dirname, 'terrain', req.params[0]);
  
  console.log(`Terrain request: ${req.params[0]}`);
  
  if (fs.existsSync(terrainPath)) {
    res.sendFile(path.resolve(terrainPath));
  } else {
    console.log(`Terrain file not found: ${terrainPath}`);
    res.status(404).json({ 
      error: 'Terrain file not found',
      path: req.params[0],
      message: 'Place your quantized-mesh terrain files in data/terrain/ directory'
    });
  }
});

// Weather summary endpoint: /weather/global-weather-summary.json
app.get('/weather/global-weather-summary.json', (req, res) => {
  const summaryPath = path.join(__dirname, 'weather', 'global-weather-summary.json');
  
  if (fs.existsSync(summaryPath)) {
    res.sendFile(path.resolve(summaryPath));
  } else {
    res.status(404).json({ 
      error: 'Weather summary not found',
      message: 'Weather data summary file not available'
    });
  }
});

// Weather overlay endpoint: /weather/{type}/{z}/{x}/{y}.png
app.get('/weather/:type/:z/:x/:y.:ext', (req, res) => {
  const { type, z, x, y, ext } = req.params;
  
  console.log(`Weather request: Type=${type}, Z=${z}, X=${x}, Y=${y}, Extension=${ext}`);
  
  // First try the global path (for future global tiles)
  let weatherPath = path.join(__dirname, 'weather', type, z, x, `${y}.${ext}`);
  
  if (fs.existsSync(weatherPath)) {
    res.sendFile(path.resolve(weatherPath));
    return;
  }
  
  // If not found, try to find regional tiles
  // For weather overlays, we'll serve regional tiles for any requested coordinates
  const weatherTypeDir = path.join(__dirname, 'weather', type);
  
  if (fs.existsSync(weatherTypeDir)) {
    // Get all regional directories
    const regionalDirs = fs.readdirSync(weatherTypeDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => !name.match(/^\d+$/)); // Exclude numeric directories (z levels)
    
    // For weather overlays, serve any available regional tile
    // This allows the frontend to display weather data regardless of specific coordinates
    for (const region of regionalDirs) {
      // Check if this region has the requested weather type
      const regionalTypeDir = path.join(weatherTypeDir, region);
      if (fs.existsSync(regionalTypeDir)) {
        // Look for any available tile in this region (prefer 0/0/0.png)
        const possiblePaths = [
          path.join(regionalTypeDir, '0', '0', '0.png'),
          path.join(regionalTypeDir, '0', '0', '0.jpg'),
          path.join(regionalTypeDir, z, x, `${y}.${ext}`)
        ];
        
        for (const tilePath of possiblePaths) {
          if (fs.existsSync(tilePath)) {
            console.log(`Serving regional weather tile: ${region} -> ${tilePath}`);
            res.sendFile(path.resolve(tilePath));
            return;
          }
        }
      }
    }
  }
  
  // If no regional tile found, return transparent PNG
  console.log(`Weather tile not found for ${type}/${z}/${x}/${y}.${ext}`);
  const transparentPng = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
    0x01, 0x00, 0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00, 0x00, 0x10,
    0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00,
    0x01, 0x73, 0x75, 0x01, 0x18, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
    0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  res.type('image/png').send(transparentPng);
});

// Root endpoint - Server status and instructions
app.get('/', (req, res) => {
  res.json({
    name: 'EarthGlobe Local Tile, Terrain & Weather Server',
    status: 'running',
    port: PORT,
    endpoints: {
      tiles: 'http://localhost:8081/tiles/{z}/{x}/{y}.png',
      terrain: 'http://localhost:8081/terrain/{path}',
      weather: 'http://localhost:8081/weather/{type}/{z}/{x}/{y}.png',
      static: 'http://localhost:8081/{data-folder-path}'
    },
    cors: 'enabled',
    instructions: {
      tiles: 'Place XYZ tiles in data/tiles/{z}/{x}/{y}.png format',
      terrain: 'Place quantized-mesh terrain in data/terrain/ directory',
      weather: 'Place weather overlay tiles in data/weather/{type}/{z}/{x}/{y}.png format'
    },
    examples: {
      tile_request: `http://localhost:${PORT}/tiles/0/0/0.png`,
      terrain_request: `http://localhost:${PORT}/terrain/layer.json`,
      weather_request: `http://localhost:${PORT}/weather/clouds/5/15/12.png`
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🌍 EarthGlobe Local Tile & Terrain Server');
  console.log('=====================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for Cesium access`);
  console.log('');
  console.log('📍 Endpoints:');
  console.log(`   Tiles:   http://localhost:${PORT}/tiles/{z}/{x}/{y}.png`);
  console.log(`   Terrain: http://localhost:${PORT}/terrain/{path}`);
  console.log(`   Status:  http://localhost:${PORT}/`);
  console.log('');
  console.log('📁 Data directories:');
console.log(`   Tiles:   ${path.resolve(__dirname, 'tiles')}`);
console.log(`   Terrain: ${path.resolve(__dirname, 'terrain')}`);
  console.log('');
  console.log('🚀 Ready for Cesium 3D Earth application!');
});

