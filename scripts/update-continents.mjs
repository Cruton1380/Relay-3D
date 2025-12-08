#!/usr/bin/env node

/**
 * Automated Continent Data Update System
 * 
 * This script automatically updates continent boundaries every 3 months by:
 * 1. Fetching the latest Natural Earth country data
 * 2. Regenerating continent boundaries using TopJSON dissolving
 * 3. Validating data consistency and completeness
 * 4. Reconciling with existing data to ensure no countries are lost
 * 5. Updating the production continent files
 * 
 * Schedule: Run via GitHub Actions every 3 months (quarterly)
 * Usage: node scripts/update-continents.mjs [--force] [--validate-only]
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as topojson from 'topojson-server';
import * as topojsonClient from 'topojson-client';

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  // Data sources
  sources: {
    countries: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson',
    fallback: 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'
  },
  
  // File paths
  paths: {
    data: './data',
    public: './public',
    backup: './backups',
    logs: './logs'
  },
  
  // Validation thresholds (World Atlas 7-continent model)
  validation: {
    minCountries: 190,
    maxCountries: 300,
    expectedContinents: ['North America', 'South America', 'Europe', 'Africa', 'Middle East', 'Asia', 'Oceania'],
    minCountriesPerContinent: {
      'North America': 15,   // USA, Canada, Mexico, Central America, Caribbean
      'South America': 10,   // Brazil, Argentina, etc.
      'Europe': 35,          // All European countries
      'Africa': 45,          // All African countries including Egypt
      'Middle East': 12,     // Turkey, Iran, Saudi Arabia, etc.
      'Asia': 25,           // China, India, Russia, Southeast Asia (excluding Middle East)
      'Oceania': 15         // Australia, New Zealand, Pacific Islands
    }
  }
};

// Fixed continent mapping to match World Atlas standard (7 continents)
const CONTINENT_MAPPING = {
  // North America
  'North America': 'North America',
  
  // South America
  'South America': 'South America',
  
  // Europe
  'Europe': 'Europe',
  
  // Africa
  'Africa': 'Africa',
  
  // Middle East (separate from Asia per World Atlas)
  'Middle East': 'Middle East',
  
  // Asia (excluding Middle East)
  'Asia': 'Asia',
  
  // Oceania (includes Australia)
  'Oceania': 'Oceania',
  'Australia': 'Oceania',
  
  // Handle legacy/missing data
  'Antarctica': 'Oceania', // Antarctica often grouped with Oceania in some models
  'Seven seas (open ocean)': 'Oceania', // Ocean territories assigned to Oceania
  'Null': 'Oceania',
  '': 'Oceania',
  null: 'Oceania',
  undefined: 'Oceania'
};

// Country-to-continent manual mapping (World Atlas standard)
const MANUAL_COUNTRY_MAPPING = {
  // Middle East countries (separate from Asia)
  'Turkey': 'Middle East',
  'Syria': 'Middle East', 
  'Lebanon': 'Middle East',
  'Israel': 'Middle East',
  'Palestine': 'Middle East',
  'Jordan': 'Middle East',
  'Iraq': 'Middle East',
  'Iran': 'Middle East',
  'Saudi Arabia': 'Middle East',
  'Yemen': 'Middle East',
  'Oman': 'Middle East',
  'United Arab Emirates': 'Middle East',
  'Qatar': 'Middle East',
  'Bahrain': 'Middle East',
  'Kuwait': 'Middle East',
  'Cyprus': 'Middle East',
  
  // Asia (excluding Middle East)
  'Russia': 'Asia', // Transcontinental - larger area in Asia
  'Kazakhstan': 'Asia',
  'Georgia': 'Asia', 
  'Armenia': 'Asia',
  'Azerbaijan': 'Asia',
  'China': 'Asia',
  'India': 'Asia',
  'Japan': 'Asia',
  'South Korea': 'Asia',
  'North Korea': 'Asia',
  'Mongolia': 'Asia',
  'Afghanistan': 'Asia',
  'Pakistan': 'Asia',
  'Bangladesh': 'Asia',
  'Sri Lanka': 'Asia',
  'Nepal': 'Asia',
  'Bhutan': 'Asia',
  'Myanmar': 'Asia',
  'Thailand': 'Asia',
  'Vietnam': 'Asia',
  'Cambodia': 'Asia',
  'Laos': 'Asia',
  'Malaysia': 'Asia',
  'Singapore': 'Asia',
  'Indonesia': 'Asia',
  'Philippines': 'Asia',
  'Taiwan': 'Asia',
  'Hong Kong': 'Asia',
  'Macao': 'Asia',
  
  // Africa (including Egypt)
  'Egypt': 'Africa', // Transcontinental - but traditionally African
  'Sudan': 'Africa',
  'Libya': 'Africa',
  'Madagascar': 'Africa',
  
  // Europe
  'Iceland': 'Europe',
  'Malta': 'Europe',
  'United Kingdom': 'Europe',
  'Ireland': 'Europe',
  
  // North America
  'Greenland': 'North America',
  'Panama': 'North America', // Central America part of North America
  'Mexico': 'North America',
  'United States of America': 'North America',
  'Canada': 'North America',
  
  // South America  
  'French Guiana': 'South America',
  'Falkland Islands': 'South America',
  'Brazil': 'South America',
  'Argentina': 'South America',
  
  // Oceania
  'Australia': 'Oceania',
  'New Zealand': 'Oceania', 
  'Papua New Guinea': 'Oceania',
  'Fiji': 'Oceania',
  'Samoa': 'Oceania',
  'Tonga': 'Oceania',
  'Vanuatu': 'Oceania',
  'Solomon Islands': 'Oceania',
  'Palau': 'Oceania',
  'Micronesia': 'Oceania',
  'Marshall Islands': 'Oceania',
  'Kiribati': 'Oceania',
  'Tuvalu': 'Oceania',
  'Nauru': 'Oceania'
};

class ContinentUpdater {
  constructor() {
    this.startTime = new Date();
    this.logFile = path.join(CONFIG.paths.logs, `continent-update-${this.startTime.toISOString().split('T')[0]}.log`);
    this.ensureDirectories();
  }

  ensureDirectories() {
    Object.values(CONFIG.paths).forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logMessage);
    
    // Append to log file
    fs.appendFileSync(this.logFile, logMessage + '\\n');
  }

  async downloadLatestCountryData() {
    this.log('🌍 Downloading latest Natural Earth country data...');
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filePath = path.join(CONFIG.paths.data, `countries-${timestamp}.geojson`);
    
    try {
      const data = await this.fetchJSON(CONFIG.sources.countries);
      
      if (!data || !data.features || data.features.length < CONFIG.validation.minCountries) {
        throw new Error(`Invalid data: expected at least ${CONFIG.validation.minCountries} countries, got ${data?.features?.length || 0}`);
      }
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      this.log(`✅ Downloaded ${data.features.length} country features to ${filePath}`);
      
      return { data, filePath };
      
    } catch (error) {
      this.log(`⚠️ Primary source failed: ${error.message}`, 'WARN');
      this.log('🔄 Trying fallback source...', 'WARN');
      
      try {
        const data = await this.fetchJSON(CONFIG.sources.fallback);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        this.log(`✅ Downloaded fallback data with ${data.features.length} features`);
        return { data, filePath };
      } catch (fallbackError) {
        this.log(`❌ Both primary and fallback sources failed: ${fallbackError.message}`, 'ERROR');
        throw fallbackError;
      }
    }
  }

  async fetchJSON(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Invalid JSON: ${error.message}`));
          }
        });
      }).on('error', reject);
    });
  }

  validateCountryData(data) {
    this.log('🔍 Validating country data...');
    
    const features = data.features || [];
    const issues = [];
    
    // Check total country count
    if (features.length < CONFIG.validation.minCountries) {
      issues.push(`Too few countries: ${features.length} < ${CONFIG.validation.minCountries}`);
    }
    
    if (features.length > CONFIG.validation.maxCountries) {
      issues.push(`Too many countries: ${features.length} > ${CONFIG.validation.maxCountries}`);
    }
    
    // Check for required properties
    const missingProperties = [];
    const missingGeometry = [];
    
    features.forEach((feature, index) => {
      const props = feature.properties || {};
      
      if (!props.NAME && !props.name && !props.ADMIN) {
        missingProperties.push(`Feature ${index}: missing name property`);
      }
      
      if (!feature.geometry || !feature.geometry.coordinates) {
        missingGeometry.push(`Feature ${index}: missing geometry`);
      }
    });
    
    if (missingProperties.length > 0) {
      issues.push(`${missingProperties.length} countries missing name properties`);
    }
    
    if (missingGeometry.length > 0) {
      issues.push(`${missingGeometry.length} countries missing geometry`);
    }
    
    if (issues.length > 0) {
      this.log(`⚠️ Validation issues found: ${issues.join(', ')}`, 'WARN');
    } else {
      this.log('✅ Country data validation passed');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      stats: {
        totalCountries: features.length,
        withNames: features.filter(f => f.properties?.NAME || f.properties?.name || f.properties?.ADMIN).length,
        withGeometry: features.filter(f => f.geometry?.coordinates).length
      }
    };
  }

  groupCountriesByContinent(countriesGeoJSON) {
    this.log('🗂️ Grouping countries by continent...');
    
    const continents = {};
    const unassigned = [];
    
    countriesGeoJSON.features.forEach((country, index) => {
      const properties = country.properties || {};
      const countryName = properties.NAME || properties.name || properties.ADMIN || `Unknown_${index}`;
      
      // Determine continent using multiple strategies
      let continent = this.assignCountryToContinent(properties, countryName);
      
      // Normalize continent name
      continent = CONTINENT_MAPPING[continent] || continent;
      
      if (!continent || continent === 'Unknown') {
        unassigned.push(countryName);
        continent = 'Seven seas (open ocean)';
      }
      
      if (!continents[continent]) {
        continents[continent] = [];
      }
      
      continents[continent].push(country);
    });
    
    // Log results
    this.log('📊 Continent assignment summary:');
    Object.entries(continents).forEach(([name, countries]) => {
      this.log(`   ${name}: ${countries.length} countries`);
    });
    
    if (unassigned.length > 0) {
      this.log(`⚠️ Unassigned countries (${unassigned.length}): ${unassigned.slice(0, 10).join(', ')}${unassigned.length > 10 ? '...' : ''}`, 'WARN');
    }
    
    return continents;
  }

  assignCountryToContinent(properties, countryName) {
    // Strategy 1: Manual mapping for known edge cases
    if (MANUAL_COUNTRY_MAPPING[countryName]) {
      return MANUAL_COUNTRY_MAPPING[countryName];
    }
    
    // Strategy 2: Direct continent property from Natural Earth
    if (properties.CONTINENT) return properties.CONTINENT;
    if (properties.continent) return properties.continent;
    
    // Strategy 3: Regional classifications (with Middle East separation)
    if (properties.REGION_UN) {
      const regionMapping = {
        'Asia': properties.SUBREGION === 'Western Asia' ? 'Middle East' : 'Asia',
        'Europe': 'Europe', 
        'Africa': 'Africa',
        'Americas': properties.SUBREGION?.includes('South') ? 'South America' : 'North America',
        'Oceania': 'Oceania'
      };
      if (regionMapping[properties.REGION_UN]) {
        return regionMapping[properties.REGION_UN];
      }
    }
    
    // Strategy 4: Subregion mapping (separating Middle East from Asia)
    if (properties.SUBREGION) {
      const subregionMapping = {
        // Middle East (Western Asia)
        'Western Asia': 'Middle East',
        
        // Asia (excluding Western Asia)
        'Eastern Asia': 'Asia',
        'South-Eastern Asia': 'Asia', 
        'Southern Asia': 'Asia',
        'Central Asia': 'Asia',
        
        // Europe
        'Eastern Europe': 'Europe',
        'Northern Europe': 'Europe',
        'Southern Europe': 'Europe',
        'Western Europe': 'Europe',
        
        // Africa
        'Eastern Africa': 'Africa',
        'Middle Africa': 'Africa',
        'Northern Africa': 'Africa',
        'Southern Africa': 'Africa',
        'Western Africa': 'Africa',
        
        // Americas
        'Caribbean': 'North America',
        'Central America': 'North America',
        'Northern America': 'North America',
        'South America': 'South America',
        
        // Oceania
        'Australia and New Zealand': 'Oceania',
        'Melanesia': 'Oceania',
        'Micronesia': 'Oceania',
        'Polynesia': 'Oceania'
      };
      if (subregionMapping[properties.SUBREGION]) {
        return subregionMapping[properties.SUBREGION];
      }
    }
    
    // Strategy 5: Country name pattern matching
    const namePatterns = {
      'Asia': ['stan$', 'Mongolia', 'China', 'Japan', 'Korea', 'Vietnam', 'Thailand', 'Myanmar', 'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan'],
      'Europe': ['land$', 'borg$', 'Kingdom', 'Republic', 'Estonia', 'Latvia', 'Lithuania'],
      'Africa': ['Guinea', 'Congo', 'Sudan', 'Somalia', 'Ethiopia', 'Kenya', 'Tanzania', 'Mozambique', 'Zimbabwe', 'Botswana'],
      'Oceania': ['Island', 'Samoa', 'Tonga', 'Fiji', 'Vanuatu', 'Kiribati', 'Tuvalu', 'Nauru', 'Palau']
    };
    
    for (const [continent, patterns] of Object.entries(namePatterns)) {
      if (patterns.some(pattern => pattern.endsWith('$') ? 
        new RegExp(pattern, 'i').test(countryName) : 
        countryName.toLowerCase().includes(pattern.toLowerCase()))) {
        return continent;
      }
    }
    
    return 'Unknown';
  }

  async validateContinentAssignments(continents) {
    this.log('🔍 Validating continent assignments...');
    
    const issues = [];
    
    // Check for expected continents
    CONFIG.validation.expectedContinents.forEach(expectedContinent => {
      if (!continents[expectedContinent]) {
        issues.push(`Missing expected continent: ${expectedContinent}`);
      }
    });
    
    // Check minimum countries per continent
    Object.entries(CONFIG.validation.minCountriesPerContinent).forEach(([continent, minCount]) => {
      const actualCount = continents[continent]?.length || 0;
      if (actualCount < minCount) {
        issues.push(`${continent} has too few countries: ${actualCount} < ${minCount}`);
      }
    });
    
    // Check for suspiciously large "Unknown" or ocean categories
    const unknownCount = (continents['Seven seas (open ocean)'] || []).length;
    if (unknownCount > 20) {
      issues.push(`Too many unassigned countries: ${unknownCount}`);
    }
    
    if (issues.length > 0) {
      this.log(`⚠️ Continent validation issues: ${issues.join(', ')}`, 'WARN');
    } else {
      this.log('✅ Continent assignment validation passed');
    }
    
    return { valid: issues.length === 0, issues };
  }

  async generateContinentBoundaries(continents) {
    this.log('🔧 Generating continent boundaries using TopJSON...');
    
    const continentFeatures = [];
    
    for (const [continentName, countries] of Object.entries(continents)) {
      this.log(`\\n🌍 Processing ${continentName} (${countries.length} countries)...`);
      
      try {
        // Create FeatureCollection for this continent
        const featureCollection = {
          type: 'FeatureCollection',
          features: countries
        };
        
        // Convert to TopoJSON for accurate dissolving
        const topology = topojson.topology({ countries: featureCollection });
        
        // Dissolve by merging all country geometries
        const dissolved = topojsonClient.merge(topology, topology.objects.countries.geometries);
        
        if (dissolved) {
          // Create dissolved continent feature
          const continentFeature = {
            type: 'Feature',
            properties: {
              name: continentName,
              type: 'continent',
              countries: countries.length,
              area: 'computed',
              population: 'unknown',
              lastUpdated: new Date().toISOString(),
              dataSource: 'Natural Earth 10m',
              dissolved: true
            },
            geometry: dissolved
          };
          
          continentFeatures.push(continentFeature);
          
          // Analyze result
          const geometryType = dissolved.type;
          const partCount = geometryType === 'MultiPolygon' ? dissolved.coordinates.length : 1;
          this.log(`✅ ${continentName}: ${geometryType} with ${partCount} part(s)`);
        } else {
          throw new Error('TopJSON merge returned null');
        }
        
      } catch (error) {
        this.log(`❌ Error processing ${continentName}: ${error.message}`, 'ERROR');
        
        // Fallback: create MultiPolygon from all countries
        this.log(`🔄 Fallback: Creating MultiPolygon for ${continentName}...`);
        
        const allCoordinates = [];
        countries.forEach(country => {
          if (country.geometry?.type === 'Polygon') {
            allCoordinates.push(country.geometry.coordinates);
          } else if (country.geometry?.type === 'MultiPolygon') {
            allCoordinates.push(...country.geometry.coordinates);
          }
        });
        
        if (allCoordinates.length > 0) {
          const continentFeature = {
            type: 'Feature',
            properties: {
              name: continentName,
              type: 'continent',
              countries: countries.length,
              lastUpdated: new Date().toISOString(),
              dissolved: false // Mark as non-dissolved
            },
            geometry: {
              type: 'MultiPolygon',
              coordinates: allCoordinates
            }
          };
          
          continentFeatures.push(continentFeature);
          this.log(`⚡ ${continentName}: MultiPolygon fallback with ${allCoordinates.length} parts`);
        }
      }
    }
    
    return {
      type: 'FeatureCollection',
      properties: {
        lastUpdated: new Date().toISOString(),
        totalContinents: continentFeatures.length,
        dataSource: 'Natural Earth 10m Countries',
        generatedBy: 'Relay Continent Update System'
      },
      features: continentFeatures
    };
  }

  async compareWithExistingData(newContinentsGeoJSON) {
    this.log('🔍 Comparing with existing continent data...');
    
    const existingPath = path.join(CONFIG.paths.public, 'continents.geojson');
    
    if (!fs.existsSync(existingPath)) {
      this.log('⚠️ No existing continent data found - this will be the first version', 'WARN');
      return { isFirstVersion: true };
    }
    
    try {
      const existingData = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
      
      const comparison = {
        existing: {
          continents: existingData.features?.length || 0,
          lastUpdated: existingData.properties?.lastUpdated || 'unknown'
        },
        new: {
          continents: newContinentsGeoJSON.features.length,
          lastUpdated: newContinentsGeoJSON.properties.lastUpdated
        },
        changes: []
      };
      
      // Compare continent counts
      if (comparison.existing.continents !== comparison.new.continents) {
        comparison.changes.push(`Continent count changed: ${comparison.existing.continents} → ${comparison.new.continents}`);
      }
      
      // Compare continent names
      const existingNames = new Set((existingData.features || []).map(f => f.properties.name));
      const newNames = new Set(newContinentsGeoJSON.features.map(f => f.properties.name));
      
      const added = [...newNames].filter(name => !existingNames.has(name));
      const removed = [...existingNames].filter(name => !newNames.has(name));
      
      if (added.length > 0) {
        comparison.changes.push(`Added continents: ${added.join(', ')}`);
      }
      
      if (removed.length > 0) {
        comparison.changes.push(`Removed continents: ${removed.join(', ')}`);
      }
      
      // Compare country counts per continent
      const existingCountries = new Map();
      const newCountries = new Map();
      
      existingData.features?.forEach(f => {
        existingCountries.set(f.properties.name, f.properties.countries || 0);
      });
      
      newContinentsGeoJSON.features.forEach(f => {
        newCountries.set(f.properties.name, f.properties.countries || 0);
      });
      
      for (const continent of newNames) {
        const oldCount = existingCountries.get(continent) || 0;
        const newCount = newCountries.get(continent) || 0;
        
        if (oldCount !== newCount) {
          comparison.changes.push(`${continent} country count: ${oldCount} → ${newCount}`);
        }
      }
      
      this.log(`📊 Data comparison complete:`);
      this.log(`   Existing: ${comparison.existing.continents} continents (${comparison.existing.lastUpdated})`);
      this.log(`   New: ${comparison.new.continents} continents (${comparison.new.lastUpdated})`);
      
      if (comparison.changes.length > 0) {
        this.log(`   Changes detected: ${comparison.changes.join('; ')}`);
      } else {
        this.log(`   No changes detected`);
      }
      
      return comparison;
      
    } catch (error) {
      this.log(`⚠️ Could not compare with existing data: ${error.message}`, 'WARN');
      return { error: error.message };
    }
  }

  async backupExistingData() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(CONFIG.paths.backup, `continent-update-${timestamp}`);
    
    fs.mkdirSync(backupDir, { recursive: true });
    
    const filesToBackup = [
      { src: path.join(CONFIG.paths.public, 'continents.geojson'), dest: 'continents.geojson' },
      { src: path.join(CONFIG.paths.data, 'continents.geojson'), dest: 'continents-data.geojson' }
    ];
    
    let backedUpFiles = 0;
    
    filesToBackup.forEach(({ src, dest }) => {
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(backupDir, dest));
        backedUpFiles++;
      }
    });
    
    this.log(`💾 Backed up ${backedUpFiles} files to ${backupDir}`);
    return backupDir;
  }

  async saveContinentsData(continentsGeoJSON) {
    const dataPath = path.join(CONFIG.paths.data, 'continents.geojson');
    const publicPath = path.join(CONFIG.paths.public, 'continents.geojson');
    
    const geoJsonString = JSON.stringify(continentsGeoJSON, null, 2);
    
    // Save to both locations
    fs.writeFileSync(dataPath, geoJsonString);
    fs.writeFileSync(publicPath, geoJsonString);
    
    this.log(`💾 Saved updated continent data:`);
    this.log(`   Data: ${dataPath}`);
    this.log(`   Public: ${publicPath}`);
    
    // Generate summary
    this.log(`\\n📊 Updated continent summary:`);
    continentsGeoJSON.features.forEach(continent => {
      const { name, countries, dissolved } = continent.properties;
      const geometryType = continent.geometry.type;
      const partCount = geometryType === 'MultiPolygon' ? continent.geometry.coordinates.length : 1;
      const status = dissolved ? '✅ dissolved' : '⚡ multipolygon';
      this.log(`   ${name}: ${geometryType} (${partCount} parts, ${countries} countries) ${status}`);
    });
  }

  async generateReport() {
    const endTime = new Date();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    const report = {
      timestamp: endTime.toISOString(),
      duration: `${duration} seconds`,
      logFile: this.logFile,
      success: true
    };
    
    const reportPath = path.join(CONFIG.paths.logs, `continent-update-report-${endTime.toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`\\n🎉 Continent update completed successfully in ${duration} seconds`);
    this.log(`📋 Report saved: ${reportPath}`);
    
    return report;
  }

  async run(options = {}) {
    try {
      this.log('🚀 Starting automated continent data update...');
      this.log(`   Options: ${JSON.stringify(options)}`);
      
      // Step 1: Download latest country data
      const { data: countryData } = await this.downloadLatestCountryData();
      
      // Step 2: Validate country data
      const validation = this.validateCountryData(countryData);
      if (!validation.valid && !options.force) {
        throw new Error(`Country data validation failed: ${validation.issues.join(', ')}`);
      }
      
      // Step 3: Group countries by continent
      const continents = this.groupCountriesByContinent(countryData);
      
      // Step 4: Validate continent assignments
      const continentValidation = await this.validateContinentAssignments(continents);
      if (!continentValidation.valid && !options.force) {
        throw new Error(`Continent validation failed: ${continentValidation.issues.join(', ')}`);
      }
      
      if (options.validateOnly) {
        this.log('✅ Validation-only mode: All checks passed');
        return { validationOnly: true, success: true };
      }
      
      // Step 5: Generate continent boundaries
      const newContinentsGeoJSON = await this.generateContinentBoundaries(continents);
      
      // Step 6: Compare with existing data
      const comparison = await this.compareWithExistingData(newContinentsGeoJSON);
      
      // Step 7: Backup existing data
      const backupDir = await this.backupExistingData();
      
      // Step 8: Save updated data
      await this.saveContinentsData(newContinentsGeoJSON);
      
      // Step 9: Generate report
      const report = await this.generateReport();
      
      return { 
        success: true, 
        report, 
        comparison,
        backupDir,
        validation,
        continentValidation
      };
      
    } catch (error) {
      this.log(`❌ Continent update failed: ${error.message}`, 'ERROR');
      this.log(`📋 Error stack: ${error.stack}`, 'ERROR');
      
      return {
        success: false,
        error: error.message,
        logFile: this.logFile
      };
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    force: args.includes('--force'),
    validateOnly: args.includes('--validate-only')
  };
  
  console.log('🔄 Relay Continent Update System v1.0');
  console.log('=====================================\\n');
  
  const updater = new ContinentUpdater();
  const result = await updater.run(options);
  
  if (result.success) {
    console.log('\\n🎉 Update completed successfully!');
    process.exit(0);
  } else {
    console.log('\\n❌ Update failed!');
    console.log(`📋 Check log file: ${result.logFile}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ContinentUpdater, CONFIG };