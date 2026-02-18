// ============================================================================
// download-geoboundaries.mjs - Download GeoBoundaries Data to Local Files
// ============================================================================
// Downloads country, province, and city boundaries from GeoBoundaries API
// Saves to data/boundaries/ directory for offline use
// ============================================================================

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOUNDARIES_DIR = path.join(__dirname, '..', 'data', 'boundaries');
const GEOBOUNDARIES_API = 'https://www.geoboundaries.org/api/current/gbOpen';

// Admin levels: ADM0 = Country, ADM1 = Province/State, ADM2 = City/District
const ADMIN_LEVELS = ['ADM0', 'ADM1', 'ADM2'];

// Priority countries (download these first)
const PRIORITY_COUNTRIES = [
  'ITA', 'ESP', 'FRA', 'DEU', 'GBR', 'USA', 'CAN', 'AUS', 'JPN', 'CHN',
  'BRA', 'ARG', 'MEX', 'IND', 'ZAF', 'EGY', 'NGA', 'KEN', 'TUR', 'SAU'
];

// All ISO3 country codes
const ALL_COUNTRIES = [
  'AFG', 'ALB', 'DZA', 'AND', 'AGO', 'ATG', 'ARG', 'ARM', 'AUS', 'AUT',
  'AZE', 'BHS', 'BHR', 'BGD', 'BRB', 'BLR', 'BEL', 'BLZ', 'BEN', 'BTN',
  'BOL', 'BIH', 'BWA', 'BRA', 'BRN', 'BGR', 'BFA', 'BDI', 'KHM', 'CMR',
  'CAN', 'CPV', 'CAF', 'TCD', 'CHL', 'CHN', 'COL', 'COM', 'COG', 'CRI',
  'HRV', 'CUB', 'CYP', 'CZE', 'PRK', 'COD', 'DNK', 'DJI', 'DMA', 'DOM',
  'ECU', 'EGY', 'SLV', 'GNQ', 'ERI', 'EST', 'ETH', 'FJI', 'FIN', 'FRA',
  'GAB', 'GMB', 'GEO', 'DEU', 'GHA', 'GRC', 'GRD', 'GTM', 'GIN', 'GNB',
  'GUY', 'HTI', 'HND', 'HUN', 'ISL', 'IND', 'IDN', 'IRN', 'IRQ', 'IRL',
  'ISR', 'ITA', 'CIV', 'JAM', 'JPN', 'JOR', 'KAZ', 'KEN', 'KIR', 'KWT',
  'KGZ', 'LAO', 'LVA', 'LBN', 'LSO', 'LBR', 'LBY', 'LIE', 'LTU', 'LUX',
  'MDG', 'MWI', 'MYS', 'MDV', 'MLI', 'MLT', 'MHL', 'MRT', 'MUS', 'MEX',
  'FSM', 'MCO', 'MNG', 'MNE', 'MAR', 'MOZ', 'MMR', 'NAM', 'NRU', 'NPL',
  'NLD', 'NZL', 'NIC', 'NER', 'NGA', 'MKD', 'NOR', 'OMN', 'PAK', 'PLW',
  'PAN', 'PNG', 'PRY', 'PER', 'PHL', 'POL', 'PRT', 'QAT', 'KOR', 'MDA',
  'ROU', 'RUS', 'RWA', 'KNA', 'LCA', 'VCT', 'WSM', 'SMR', 'STP', 'SAU',
  'SEN', 'SRB', 'SYC', 'SLE', 'SGP', 'SVK', 'SVN', 'SLB', 'SOM', 'ZAF',
  'SSD', 'ESP', 'LKA', 'SDN', 'SUR', 'SWZ', 'SWE', 'CHE', 'SYR', 'TJK',
  'THA', 'TLS', 'TGO', 'TON', 'TTO', 'TUN', 'TUR', 'TKM', 'TUV', 'UGA',
  'UKR', 'ARE', 'GBR', 'TZA', 'USA', 'URY', 'UZB', 'VUT', 'VEN', 'VNM',
  'YEM', 'ZMB', 'ZWE'
];

class GeoBoundariesDownloader {
  constructor() {
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0
    };
  }

  async initialize() {
    console.log('🌍 GeoBoundaries Downloader');
    console.log('═══════════════════════════════════════════════════\n');
    
    // Create directory structure
    await this.createDirectories();
  }

  async createDirectories() {
    console.log('📁 Creating directory structure...');
    
    const dirs = [
      BOUNDARIES_DIR,
      path.join(BOUNDARIES_DIR, 'countries'),
      path.join(BOUNDARIES_DIR, 'provinces'),
      path.join(BOUNDARIES_DIR, 'cities'),
      path.join(BOUNDARIES_DIR, 'metadata')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    console.log('✅ Directories created\n');
  }

  async downloadBoundary(countryCode, adminLevel) {
    const levelName = {
      'ADM0': 'countries',
      'ADM1': 'provinces',
      'ADM2': 'cities'
    }[adminLevel];

    const filename = `${countryCode}-${adminLevel}.geojson`;
    const filepath = path.join(BOUNDARIES_DIR, levelName, filename);

    // Check if already exists
    try {
      await fs.access(filepath);
      console.log(`⏭️  ${countryCode} ${adminLevel} - Already exists, skipping`);
      this.stats.skipped++;
      return true;
    } catch {
      // File doesn't exist, proceed with download
    }

    try {
      // Fetch metadata first
      const metadataUrl = `${GEOBOUNDARIES_API}/${countryCode}/${adminLevel}/`;
      console.log(`📡 Fetching ${countryCode} ${adminLevel}...`);
      
      const metadataResponse = await fetch(metadataUrl);
      
      if (!metadataResponse.ok) {
        console.log(`⚠️  ${countryCode} ${adminLevel} - Not available (${metadataResponse.status})`);
        this.stats.failed++;
        return false;
      }

      const metadata = await metadataResponse.json();
      
      // Download the actual GeoJSON
      const geojsonUrl = metadata.gjDownloadURL || metadata.simplifiedGeometryGeoJSON;
      
      if (!geojsonUrl) {
        console.log(`⚠️  ${countryCode} ${adminLevel} - No GeoJSON URL found`);
        this.stats.failed++;
        return false;
      }

      const geojsonResponse = await fetch(geojsonUrl);
      const geojson = await geojsonResponse.json();

      // Save GeoJSON
      await fs.writeFile(filepath, JSON.stringify(geojson, null, 2));
      
      // Save metadata
      const metadataPath = path.join(BOUNDARIES_DIR, 'metadata', `${countryCode}-${adminLevel}.json`);
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      console.log(`✅ ${countryCode} ${adminLevel} - Downloaded successfully`);
      this.stats.success++;
      this.stats.total++;
      
      // Small delay to avoid rate limiting
      await this.sleep(500);
      
      return true;
    } catch (error) {
      console.error(`❌ ${countryCode} ${adminLevel} - Error: ${error.message}`);
      this.stats.failed++;
      return false;
    }
  }

  async downloadCountry(countryCode) {
    console.log(`\n🌐 Downloading ${countryCode}...`);
    
    for (const adminLevel of ADMIN_LEVELS) {
      await this.downloadBoundary(countryCode, adminLevel);
    }
  }

  async downloadAll(priorityOnly = false) {
    const countries = priorityOnly ? PRIORITY_COUNTRIES : ALL_COUNTRIES;
    
    console.log(`📥 Downloading ${countries.length} countries...`);
    console.log(`Priority mode: ${priorityOnly ? 'YES' : 'NO'}\n`);
    
    for (const countryCode of countries) {
      await this.downloadCountry(countryCode);
    }
  }

  async createIndex() {
    console.log('\n📋 Creating index files...');
    
    const index = {
      countries: [],
      provinces: {},
      cities: {},
      lastUpdated: new Date().toISOString()
    };

    // Index countries
    const countriesDir = path.join(BOUNDARIES_DIR, 'countries');
    const countryFiles = await fs.readdir(countriesDir);
    
    for (const file of countryFiles) {
      if (!file.endsWith('.geojson')) continue;
      
      const countryCode = file.split('-')[0];
      const geojsonPath = path.join(countriesDir, file);
      const geojson = JSON.parse(await fs.readFile(geojsonPath, 'utf-8'));
      
      const feature = geojson.features?.[0];
      if (feature) {
        index.countries.push({
          code: countryCode,
          name: feature.properties.shapeName || feature.properties.name || countryCode,
          bounds: this.calculateBounds(geojson)
        });
      }
    }

    // Index provinces
    const provincesDir = path.join(BOUNDARIES_DIR, 'provinces');
    const provinceFiles = await fs.readdir(provincesDir);
    
    for (const file of provinceFiles) {
      if (!file.endsWith('.geojson')) continue;
      
      const countryCode = file.split('-')[0];
      const geojsonPath = path.join(provincesDir, file);
      const geojson = JSON.parse(await fs.readFile(geojsonPath, 'utf-8'));
      
      if (!index.provinces[countryCode]) {
        index.provinces[countryCode] = [];
      }
      
      for (const feature of geojson.features || []) {
        index.provinces[countryCode].push({
          name: feature.properties.shapeName || feature.properties.name,
          code: feature.properties.shapeISO || feature.properties.iso,
          bounds: this.calculateBounds({ type: 'FeatureCollection', features: [feature] })
        });
      }
    }

    // Index cities (similar to provinces)
    const citiesDir = path.join(BOUNDARIES_DIR, 'cities');
    const cityFiles = await fs.readdir(citiesDir);
    
    for (const file of cityFiles) {
      if (!file.endsWith('.geojson')) continue;
      
      const countryCode = file.split('-')[0];
      const geojsonPath = path.join(citiesDir, file);
      const geojson = JSON.parse(await fs.readFile(geojsonPath, 'utf-8'));
      
      if (!index.cities[countryCode]) {
        index.cities[countryCode] = [];
      }
      
      for (const feature of geojson.features || []) {
        index.cities[countryCode].push({
          name: feature.properties.shapeName || feature.properties.name,
          code: feature.properties.shapeISO || feature.properties.iso,
          bounds: this.calculateBounds({ type: 'FeatureCollection', features: [feature] })
        });
      }
    }

    // Save index
    const indexPath = path.join(BOUNDARIES_DIR, 'index.json');
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
    
    console.log('✅ Index created');
    console.log(`   - ${index.countries.length} countries`);
    console.log(`   - ${Object.keys(index.provinces).length} countries with provinces`);
    console.log(`   - ${Object.keys(index.cities).length} countries with cities`);
  }

  calculateBounds(geojson) {
    let minLng = Infinity, minLat = Infinity;
    let maxLng = -Infinity, maxLat = -Infinity;

    const processCoordinates = (coords) => {
      if (typeof coords[0] === 'number') {
        // Single coordinate pair
        minLng = Math.min(minLng, coords[0]);
        maxLng = Math.max(maxLng, coords[0]);
        minLat = Math.min(minLat, coords[1]);
        maxLat = Math.max(maxLat, coords[1]);
      } else {
        // Array of coordinates
        coords.forEach(processCoordinates);
      }
    };

    for (const feature of geojson.features || []) {
      if (feature.geometry?.coordinates) {
        processCoordinates(feature.geometry.coordinates);
      }
    }

    return {
      north: maxLat,
      south: minLat,
      east: maxLng,
      west: minLng
    };
  }

  printStats() {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 Download Statistics');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Successful: ${this.stats.success}`);
    console.log(`❌ Failed:     ${this.stats.failed}`);
    console.log(`⏭️  Skipped:    ${this.stats.skipped}`);
    console.log(`📦 Total:      ${this.stats.total}`);
    console.log('═══════════════════════════════════════════════════\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'priority';

  const downloader = new GeoBoundariesDownloader();
  await downloader.initialize();

  switch (command) {
    case 'priority':
      console.log('📥 Downloading priority countries only...\n');
      await downloader.downloadAll(true);
      break;
      
    case 'all':
      console.log('📥 Downloading ALL countries (this will take a while)...\n');
      await downloader.downloadAll(false);
      break;
      
    case 'country':
      const countryCode = args[1];
      if (!countryCode) {
        console.error('❌ Please provide a country code: node download-geoboundaries.mjs country ITA');
        process.exit(1);
      }
      await downloader.downloadCountry(countryCode.toUpperCase());
      break;
      
    default:
      console.log('Usage:');
      console.log('  node download-geoboundaries.mjs priority   # Download priority countries');
      console.log('  node download-geoboundaries.mjs all        # Download all countries');
      console.log('  node download-geoboundaries.mjs country ITA # Download specific country');
      process.exit(1);
  }

  await downloader.createIndex();
  downloader.printStats();

  console.log('🎉 Download complete!\n');
  console.log('Data saved to: data/boundaries/');
  console.log('  - data/boundaries/countries/');
  console.log('  - data/boundaries/provinces/');
  console.log('  - data/boundaries/cities/');
  console.log('  - data/boundaries/index.json\n');
}

main().catch(console.error);
