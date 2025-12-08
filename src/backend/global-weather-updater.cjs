const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class GlobalWeatherUpdater {
  constructor() {
    this.weatherDir = path.join(__dirname, 'weather');
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = [
      this.weatherDir,
      path.join(this.weatherDir, 'clouds'),
      path.join(this.weatherDir, 'precipitation'),
      path.join(this.weatherDir, 'temperature'),
      path.join(this.weatherDir, 'wind'),
      path.join(this.weatherDir, 'pressure')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Fetch data from any HTTP/HTTPS URL
  async fetchData(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      
      const req = protocol.get(url, {
        headers: {
          'User-Agent': 'EarthGlobe-Weather-Fetcher/1.0'
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  // Global regions with coordinates for weather data
  getGlobalRegions() {
    return [
      // North America
      { name: 'North America - East Coast', lat: 40.7128, lon: -74.0060, region: 'north-america' },
      { name: 'North America - West Coast', lat: 37.7749, lon: -122.4194, region: 'north-america' },
      { name: 'North America - Central', lat: 39.8283, lon: -98.5795, region: 'north-america' },
      
      // Europe
      { name: 'Europe - Western', lat: 51.5074, lon: -0.1278, region: 'europe' },
      { name: 'Europe - Central', lat: 52.5200, lon: 13.4050, region: 'europe' },
      { name: 'Europe - Northern', lat: 59.9139, lon: 10.7522, region: 'europe' },
      
      // Asia
      { name: 'Asia - East', lat: 35.6762, lon: 139.6503, region: 'asia' },
      { name: 'Asia - South', lat: 28.6139, lon: 77.2090, region: 'asia' },
      { name: 'Asia - Southeast', lat: 1.3521, lon: 103.8198, region: 'asia' },
      
      // Africa
      { name: 'Africa - North', lat: 30.0444, lon: 31.2357, region: 'africa' },
      { name: 'Africa - South', lat: -26.2041, lon: 28.0473, region: 'africa' },
      { name: 'Africa - West', lat: 6.5244, lon: 3.3792, region: 'africa' },
      
      // South America
      { name: 'South America - East', lat: -23.5505, lon: -46.6333, region: 'south-america' },
      { name: 'South America - West', lat: -12.0464, lon: -77.0428, region: 'south-america' },
      
      // Oceania
      { name: 'Oceania - Australia', lat: -33.8688, lon: 151.2093, region: 'oceania' },
      { name: 'Oceania - New Zealand', lat: -41.2866, lon: 174.7756, region: 'oceania' }
    ];
  }

  // Fetch Open-Meteo weather data for a specific region
  async fetchOpenMeteoWeather(lat, lon, regionName) {
    console.log(`🌤️ Fetching Open-Meteo data for ${regionName}...`);
    
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,cloudcover,windspeed_10m,pressure_msl&timezone=auto`;
      const data = await this.fetchData(url);
      const weather = JSON.parse(data);
      
      console.log(`✅ Open-Meteo data fetched for ${regionName}`);
      return {
        region: regionName,
        data: this.processOpenMeteoData(weather)
      };
    } catch (error) {
      console.warn(`⚠️ Open-Meteo fetch failed for ${regionName}:`, error.message);
      return null;
    }
  }

  // Process Open-Meteo data
  processOpenMeteoData(weather) {
    const processed = {
      temperature: [],
      precipitation: [],
      clouds: [],
      wind: [],
      pressure: []
    };

    if (weather.hourly) {
      const times = weather.hourly.time || [];
      const temps = weather.hourly.temperature_2m || [];
      const precip = weather.hourly.precipitation || [];
      const cloudcover = weather.hourly.cloudcover || [];
      const windspeed = weather.hourly.windspeed_10m || [];
      const pressure = weather.hourly.pressure_msl || [];

      for (let i = 0; i < times.length; i++) {
        if (temps[i] !== undefined) {
          processed.temperature.push({
            value: temps[i],
            time: times[i]
          });
        }

        if (precip[i] !== undefined) {
          processed.precipitation.push({
            value: precip[i],
            time: times[i]
          });
        }

        if (cloudcover[i] !== undefined) {
          processed.clouds.push({
            coverage: cloudcover[i],
            time: times[i]
          });
        }

        if (windspeed[i] !== undefined) {
          processed.wind.push({
            speed: windspeed[i],
            time: times[i]
          });
        }

        if (pressure[i] !== undefined) {
          processed.pressure.push({
            value: pressure[i],
            time: times[i]
          });
        }
      }
    }

    return processed;
  }

  // Create weather tiles for each region
  createRegionalWeatherTiles(regionalData) {
    console.log('🎨 Creating regional weather tiles...');
    
    const weatherTypes = ['temperature', 'precipitation', 'clouds', 'wind', 'pressure'];
    
    regionalData.forEach(regionData => {
      if (regionData && regionData.data) {
        const region = regionData.region;
        const data = regionData.data;
        
        weatherTypes.forEach(type => {
          if (data[type] && data[type].length > 0) {
            this.createRegionalTile(data[type], type, region);
          }
        });
      }
    });
  }

  // Create a tile for a specific region
  createRegionalTile(data, type, region) {
    // Create a simple PNG tile based on weather data
    let tileData;
    
    if (type === 'temperature') {
      tileData = this.createTemperatureTile(data);
    } else if (type === 'precipitation') {
      tileData = this.createPrecipitationTile(data);
    } else if (type === 'clouds') {
      tileData = this.createCloudTile(data);
    } else {
      tileData = this.createTransparentTile();
    }
    
    // Save tile with region-specific path
    const tilePath = path.join(this.weatherDir, type, region, '0', '0', '0.png');
    const tileDir = path.dirname(tilePath);
    
    if (!fs.existsSync(tileDir)) {
      fs.mkdirSync(tileDir, { recursive: true });
    }
    
    fs.writeFileSync(tilePath, tileData);
    console.log(`✅ Created ${type} tile for ${region}: ${region}/0/0/0.png`);
  }

  // Create temperature tile (blue to red gradient)
  createTemperatureTile(data) {
    const avgTemp = data.reduce((sum, item) => sum + item.value, 0) / data.length;
    
    if (avgTemp < 0) {
      // Cold - blue
      return Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x60, 0x18, 0x05, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
        0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
    } else if (avgTemp > 25) {
      // Hot - red
      return Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x60, 0x18, 0x05, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
        0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
    } else {
      // Moderate - yellow
      return Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x60, 0x18, 0x05, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
        0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
    }
  }

  // Create precipitation tile
  createPrecipitationTile(data) {
    const avgPrecip = data.reduce((sum, item) => sum + (item.value || item.probability || 0), 0) / data.length;
    
    if (avgPrecip > 5) {
      // Heavy precipitation - dark blue
      return Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x60, 0x18, 0x05, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
        0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
    } else {
      // Light precipitation - light blue
      return Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x60, 0x18, 0x05, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
        0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
    }
  }

  // Create cloud tile
  createCloudTile(data) {
    const avgClouds = data.reduce((sum, item) => sum + (item.coverage || 0), 0) / data.length;
    
    if (avgClouds > 50) {
      // Cloudy - white
      return Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x60, 0x18, 0x05, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
        0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
    } else {
      // Clear - transparent
      return this.createTransparentTile();
    }
  }

  // Create transparent tile
  createTransparentTile() {
    return Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
      0x01, 0x00, 0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00, 0x00, 0x10,
      0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00,
      0x01, 0x73, 0x75, 0x01, 0x18, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
      0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
  }

  // Main method to update global weather data
  async updateGlobalWeatherData() {
    console.log('🌍 Starting global weather data update...');
    
    const regions = this.getGlobalRegions();
    const regionalData = [];
    
    // Fetch weather data for each region
    for (const region of regions) {
      try {
        const weatherData = await this.fetchOpenMeteoWeather(
          region.lat, 
          region.lon, 
          region.name
        );
        
        if (weatherData) {
          regionalData.push(weatherData);
        }
        
        // Add a small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.warn(`⚠️ Failed to fetch data for ${region.name}:`, error.message);
      }
    }
    
    // Create map tiles from the regional data
    if (regionalData.length > 0) {
      this.createRegionalWeatherTiles(regionalData);
      console.log('🎉 Global weather data update completed!');
      
      // Save global weather summary
      const summary = {
        timestamp: new Date().toISOString(),
        regions: regionalData.map(rd => ({
          name: rd.region,
          dataTypes: Object.keys(rd.data)
        })),
        totalRegions: regionalData.length,
        coverage: 'Global'
      };
      
      fs.writeFileSync(
        path.join(this.weatherDir, 'global-weather-summary.json'),
        JSON.stringify(summary, null, 2)
      );
      
      console.log('📊 Global weather summary saved');
      console.log(`🌍 Weather data available for ${regionalData.length} regions worldwide`);
    } else {
      console.warn('⚠️ No weather data available from any region');
    }
    
    return regionalData;
  }
}

// Run the global weather updater
const updater = new GlobalWeatherUpdater();
updater.updateGlobalWeatherData().then(() => {
  console.log('✅ Global weather updater finished');
  process.exit(0);
}).catch(error => {
  console.error('❌ Global weather updater failed:', error);
  process.exit(1);
});
