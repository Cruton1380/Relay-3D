#!/usr/bin/env node

/**
 * Generate Continents GeoJSON
 * 
 * This script creates precomputed continent boundaries by dissolving country polygons.
 * The result is saved as a static continents.geojson file for fast frontend rendering.
 * 
 * Approach:
 * 1. Load Natural Earth 10m countries data
 * 2. Group countries by continent using CONTINENT property
 * 3. Dissolve country polygons for each continent using topojson
 * 4. Save clean continent boundaries as GeoJSON
 * 
 * Usage: node scripts/generate-continents.mjs
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import * as topojson from 'topojson-server';
import * as topojsonClient from 'topojson-client';

// World Atlas 7-continent model with Middle East separated from Asia
const CONTINENT_MAPPING = {
    'North America': [
        'United States of America', 'Canada', 'Mexico', 'Guatemala', 'Belize', 'El Salvador',
        'Honduras', 'Nicaragua', 'Costa Rica', 'Panama', 'Cuba', 'Jamaica', 'Haiti',
        'Dominican Republic', 'Bahamas', 'Barbados', 'Saint Lucia', 'Grenada',
        'Saint Vincent and the Grenadines', 'Antigua and Barbuda', 'Dominica',
        'Trinidad and Tobago', 'Saint Kitts and Nevis', 'Greenland'
    ],
    'South America': [
        'Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Venezuela', 'Ecuador',
        'Bolivia', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname', 'French Guiana'
    ],
    'Europe': [
        'Germany', 'United Kingdom', 'France', 'Italy', 'Spain', 'Ukraine',
        'Poland', 'Romania', 'Netherlands', 'Belgium', 'Czech Republic', 'Greece',
        'Portugal', 'Sweden', 'Hungary', 'Austria', 'Belarus', 'Switzerland',
        'Bulgaria', 'Serbia', 'Denmark', 'Finland', 'Slovakia', 'Norway', 'Ireland',
        'Croatia', 'Bosnia and Herzegovina', 'Albania', 'Lithuania', 'Slovenia',
        'Latvia', 'Estonia', 'Macedonia', 'Moldova', 'Luxembourg', 'Malta',
        'Iceland', 'Montenegro', 'Cyprus', 'Andorra', 'Liechtenstein', 'San Marino',
        'Monaco', 'Vatican City', 'Kosovo'
    ],
    'Africa': [
        'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon',
        'Cape Verde', 'Central African Republic', 'Chad', 'Comoros', 'Congo',
        'Democratic Republic of the Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea',
        'Eritrea', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau',
        'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
        'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger',
        'Nigeria', 'Rwanda', 'Sao Tome and Principe', 'Senegal', 'Seychelles',
        'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Swaziland',
        'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
    ],
    'Middle East': [
        'Turkey', 'Iran', 'Iraq', 'Saudi Arabia', 'Yemen', 'Syria', 'Jordan', 'Israel',
        'Palestine', 'Lebanon', 'Kuwait', 'Qatar', 'United Arab Emirates', 'Bahrain',
        'Oman', 'Armenia', 'Azerbaijan', 'Georgia'
    ],
    'Asia': [
        'Russia', 'China', 'India', 'Indonesia', 'Pakistan', 'Bangladesh', 'Japan', 'Philippines',
        'Vietnam', 'Thailand', 'Myanmar', 'South Korea', 'Afghanistan', 'Uzbekistan',
        'Malaysia', 'Nepal', 'North Korea', 'Sri Lanka', 'Kazakhstan', 'Cambodia',
        'Tajikistan', 'Laos', 'Singapore', 'Mongolia', 'Kyrgyzstan', 'Bhutan',
        'Brunei', 'Maldives', 'East Timor', 'Turkmenistan'
    ],
    'Antarctica': [
        'Antarctica'
    ],
    'Oceania': [
        'Australia', 'Papua New Guinea', 'New Zealand', 'Fiji', 'Solomon Islands',
        'New Caledonia', 'French Polynesia', 'Vanuatu', 'Samoa', 'Micronesia',
        'Tonga', 'Kiribati', 'Palau', 'Marshall Islands', 'Tuvalu', 'Nauru',
        'American Samoa', 'Cook Islands', 'Niue', 'Norfolk Island', 'Guam',
        'Northern Mariana Islands', 'Pitcairn Islands', 'Wallis and Futuna',
        'Coral Sea Islands', 'Ashmore and Cartier Islands'
    ]
};

// Manual country-to-continent mapping for edge cases and corrections
const MANUAL_COUNTRY_MAPPING = {
    // Middle East countries (separated from Asia for geopolitical accuracy)
    'Turkey': 'Middle East',
    'Iran': 'Middle East', 
    'Iraq': 'Middle East',
    'Saudi Arabia': 'Middle East',
    'Yemen': 'Middle East',
    'Syria': 'Middle East',
    'Jordan': 'Middle East',
    'Israel': 'Middle East',
    'Palestine': 'Middle East',
    'Lebanon': 'Middle East',
    'Kuwait': 'Middle East',
    'Qatar': 'Middle East',
    'United Arab Emirates': 'Middle East',
    'Bahrain': 'Middle East',
    'Oman': 'Middle East',
    'Armenia': 'Middle East',
    'Azerbaijan': 'Middle East',
    'Georgia': 'Middle East',
    
    // African countries (ensure Egypt is in Africa, not Middle East)
    'Egypt': 'Africa',
    
    // Asian countries (Russia is transcontinental but majority of landmass is in Asia)
    'Russia': 'Asia',
    
    // European countries
    'Cyprus': 'Europe',
    
    // Antarctica
    'Antarctica': 'Antarctica',
    
    // Oceania island territories
    'Norfolk Island': 'Oceania',
    'Guam': 'Oceania',
    'Northern Mariana Islands': 'Oceania', 
    'N. Mariana Is.': 'Oceania',
    'Pitcairn Islands': 'Oceania',
    'Pitcairn Is.': 'Oceania',
    'Wallis and Futuna': 'Oceania',
    'Wallis and Futuna Is.': 'Oceania',
    'Coral Sea Islands': 'Oceania',
    'Coral Sea Is.': 'Oceania',
    'Ashmore and Cartier Islands': 'Oceania',
    'Ashmore and Cartier Is.': 'Oceania',
    'Marshall Is.': 'Oceania',
    'Solomon Is.': 'Oceania',
    'Cook Is.': 'Oceania',
    'Fr. Polynesia': 'Oceania',
    
    // Other corrections
    'Greenland': 'North America',
    'French Guiana': 'South America'
};

const DATA_DIR = './data';
const PUBLIC_DIR = './public';

async function downloadCountriesData() {
  const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson';
  const filePath = path.join(DATA_DIR, 'countries-10m.geojson');
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // Skip download if file already exists
  if (fs.existsSync(filePath)) {
    console.log('📁 Countries data already exists, using cached version');
    return filePath;
  }
  
  console.log('🌍 Downloading Natural Earth 10m countries data...');
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('✅ Downloaded countries data');
        resolve(filePath);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

function loadCountriesData(filePath) {
  console.log('📖 Loading countries data...');
  const data = fs.readFileSync(filePath, 'utf8');
  const geojson = JSON.parse(data);
  console.log(`📊 Loaded ${geojson.features.length} country features`);
  return geojson;
}

function groupCountriesByContinent(countriesGeoJSON) {
    console.log('🗂️ Grouping countries by continent using World Atlas 7-continent model...');
    
    const continentGroups = {};
    let unassignedCount = 0;
    const unassignedCountries = [];
    
    countriesGeoJSON.features.forEach(country => {
        const properties = country.properties;
        const countryName = properties.NAME || properties.name || properties.NAME_EN;
        
        // First check manual mapping for overrides
        let continent = MANUAL_COUNTRY_MAPPING[countryName];
        
        // If not in manual mapping, find continent from CONTINENT_MAPPING
        if (!continent) {
            for (const [continentName, countries] of Object.entries(CONTINENT_MAPPING)) {
                if (countries.includes(countryName)) {
                    continent = continentName;
                    break;
                }
            }
        }
        
        // Handle unassigned countries
        if (!continent) {
            unassignedCount++;
            unassignedCountries.push(countryName);
            
            // Try to use the original CONTINENT property as fallback
            const originalContinent = properties.CONTINENT || properties.continent;
            if (originalContinent && originalContinent !== 'null' && originalContinent !== '') {
                continent = originalContinent;
                console.log(`📍 Using fallback continent for ${countryName}: ${continent}`);
            } else {
                continent = 'Seven seas (open ocean)';
                console.log(`⚠️ No continent found for ${countryName}, assigning to 'Seven seas (open ocean)'`);
            }
        }
        
        if (!continentGroups[continent]) {
            continentGroups[continent] = [];
        }
        
        continentGroups[continent].push(country);
        
        // Log first few assignments for verification
        if (continentGroups[continent].length <= 3) {
            console.log(`🗺️ Country: ${countryName} → Continent: ${continent}`);
        }
    });
    
    if (unassignedCount > 0) {
        console.log(`\n⚠️ Found ${unassignedCount} countries not in mapping:`);
        unassignedCountries.slice(0, 10).forEach(name => console.log(`   - ${name}`));
        if (unassignedCount > 10) {
            console.log(`   ... and ${unassignedCount - 10} more`);
        }
    }
    
    // Validate continent count (should be 7-8 for World Atlas model with Antarctica)
    const continentCount = Object.keys(continentGroups).length;
    if (continentCount < 7 || continentCount > 8) {
        console.warn(`⚠️ Expected 7-8 continents, got ${continentCount}:`, Object.keys(continentGroups));
    }
    
    // Print continent summary
    console.log('\n📊 Continent summary:');
    Object.entries(continentGroups).forEach(([name, countries]) => {
        console.log(`   ${name}: ${countries.length} countries`);
    });
    
    return continentGroups;
}

function dissolveContinentBoundaries(continents) {
  console.log('🔧 Dissolving continent boundaries using TopJSON...');
  
  const continentFeatures = [];
  
  Object.entries(continents).forEach(([continentName, countries]) => {
    console.log(`\\n🌍 Processing ${continentName} (${countries.length} countries)...`);
    
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
            // Add some metadata
            area: 'computed',
            population: 'unknown'
          },
          geometry: dissolved
        };
        
        continentFeatures.push(continentFeature);
        
        // Analyze result
        const geometryType = dissolved.type;
        const partCount = geometryType === 'MultiPolygon' ? dissolved.coordinates.length : 1;
        console.log(`✅ ${continentName}: ${geometryType} with ${partCount} part(s)`);
      } else {
        console.error(`❌ Failed to dissolve ${continentName}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${continentName}:`, error.message);
      
      // Fallback: create MultiPolygon from all countries
      console.log(`🔄 Fallback: Creating MultiPolygon for ${continentName}...`);
      
      const allCoordinates = [];
      countries.forEach(country => {
        if (country.geometry.type === 'Polygon') {
          allCoordinates.push(country.geometry.coordinates);
        } else if (country.geometry.type === 'MultiPolygon') {
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
            dissolved: false // Mark as non-dissolved
          },
          geometry: {
            type: 'MultiPolygon',
            coordinates: allCoordinates
          }
        };
        
        continentFeatures.push(continentFeature);
        console.log(`⚡ ${continentName}: MultiPolygon fallback with ${allCoordinates.length} parts`);
      }
    }
  });
  
  return {
    type: 'FeatureCollection',
    features: continentFeatures
  };
}

function saveContinentsGeoJSON(continentsGeoJSON) {
  // Save to both data directory and public directory for frontend access
  const dataPath = path.join(DATA_DIR, 'continents.geojson');
  const publicPath = path.join(PUBLIC_DIR, 'continents.geojson');
  
  // Ensure directories exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  
  const geoJsonString = JSON.stringify(continentsGeoJSON, null, 2);
  
  // Save to data directory
  fs.writeFileSync(dataPath, geoJsonString);
  console.log(`💾 Saved continents data: ${dataPath}`);
  
  // Save to public directory for frontend access
  fs.writeFileSync(publicPath, geoJsonString);
  console.log(`💾 Saved continents data: ${publicPath}`);
  
  // Print summary
  console.log(`\\n📊 Generated ${continentsGeoJSON.features.length} continent boundaries:`);
  continentsGeoJSON.features.forEach(continent => {
    const { name, countries } = continent.properties;
    const geometryType = continent.geometry.type;
    const partCount = geometryType === 'MultiPolygon' ? continent.geometry.coordinates.length : 1;
    console.log(`   ✅ ${name}: ${geometryType} (${partCount} parts, ${countries} countries)`);
  });
}

async function main() {
  console.log('🚀 Generating continent boundaries from country data...\\n');
  
  try {
    // Step 1: Download/load countries data
    const countriesPath = await downloadCountriesData();
    const countriesGeoJSON = loadCountriesData(countriesPath);
    
    // Step 2: Group countries by continent
    const continents = groupCountriesByContinent(countriesGeoJSON);
    
    // Step 3: Dissolve continent boundaries
    const continentsGeoJSON = dissolveContinentBoundaries(continents);
    
    // Step 4: Save result
    saveContinentsGeoJSON(continentsGeoJSON);
    
    console.log('\\n🎉 Continent generation complete!');
    console.log('📁 Files created:');
    console.log('   - data/continents.geojson (source data)');
    console.log('   - public/continents.geojson (frontend access)');
    console.log('\\n🔄 Next: Update frontend to load continent data from continents.geojson');
    
  } catch (error) {
    console.error('❌ Error generating continents:', error);
    process.exit(1);
  }
}

// Run the script
main();