/**
 * Extract Province Data from Natural Earth GeoJSON
 * 
 * This script reads the ne_10m_admin_1_states_provinces.geojson file
 * and extracts province data for all APPROVED_COUNTRIES to add to provinceDataService.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPROVED_COUNTRIES = [
  'US', 'CA', 'MX', // North America
  'DE', 'FR', 'GB', 'IT', 'ES', // Europe
  'CN', 'JP', 'IN', 'KR', 'SA', // Asia
  'NG', 'ZA', 'EG', // Africa
  'BR', 'AR', 'CO', // South America
  'AU', 'NZ' // Oceania
];

const COUNTRY_NAME_MAP = {
  'US': 'United States',
  'CA': 'Canada',
  'MX': 'Mexico',
  'DE': 'Germany',
  'FR': 'France',
  'GB': 'United Kingdom',
  'IT': 'Italy',
  'ES': 'Spain',
  'CN': 'China',
  'JP': 'Japan',
  'IN': 'India',
  'KR': 'South Korea',
  'SA': 'Saudi Arabia',
  'NG': 'Nigeria',
  'ZA': 'South Africa',
  'EG': 'Egypt',
  'BR': 'Brazil',
  'AR': 'Argentina',
  'CO': 'Colombia',
  'AU': 'Australia',
  'NZ': 'New Zealand'
};

const CONTINENT_MAP = {
  'US': 'North America',
  'CA': 'North America',
  'MX': 'North America',
  'DE': 'Europe',
  'FR': 'Europe',
  'GB': 'Europe',
  'IT': 'Europe',
  'ES': 'Europe',
  'CN': 'Asia',
  'JP': 'Asia',
  'IN': 'Asia',
  'KR': 'Asia',
  'SA': 'Asia',
  'NG': 'Africa',
  'ZA': 'Africa',
  'EG': 'Africa',
  'BR': 'South America',
  'AR': 'South America',
  'CO': 'South America',
  'AU': 'Oceania',
  'NZ': 'Oceania'
};

// ISO3 to ISO2 mapping for Natural Earth data
const ISO3_TO_ISO2 = {
  'USA': 'US',
  'CAN': 'CA',
  'MEX': 'MX',
  'DEU': 'DE',
  'FRA': 'FR',
  'GBR': 'GB',
  'ITA': 'IT',
  'ESP': 'ES',
  'CHN': 'CN',
  'JPN': 'JP',
  'IND': 'IN',
  'KOR': 'KR',
  'SAU': 'SA',
  'NGA': 'NG',
  'ZAF': 'ZA',
  'EGY': 'EG',
  'BRA': 'BR',
  'ARG': 'AR',
  'COL': 'CO',
  'AUS': 'AU',
  'NZL': 'NZ'
};

function calculateCentroid(coordinates) {
  // Handle MultiPolygon or Polygon geometries
  let allCoords = [];
  
  if (coordinates[0] && coordinates[0][0] && Array.isArray(coordinates[0][0][0])) {
    // MultiPolygon
    coordinates.forEach(polygon => {
      polygon.forEach(ring => {
        allCoords.push(...ring);
      });
    });
  } else if (coordinates[0] && Array.isArray(coordinates[0][0])) {
    // Polygon
    coordinates.forEach(ring => {
      allCoords.push(...ring);
    });
  }
  
  if (allCoords.length === 0) return [0, 0];
  
  const sum = allCoords.reduce((acc, coord) => {
    return [acc[0] + coord[0], acc[1] + coord[1]];
  }, [0, 0]);
  
  return [
    parseFloat((sum[0] / allCoords.length).toFixed(4)),
    parseFloat((sum[1] / allCoords.length).toFixed(4))
  ];
}

function calculateBounds(coordinates) {
  let allCoords = [];
  
  if (coordinates[0] && coordinates[0][0] && Array.isArray(coordinates[0][0][0])) {
    // MultiPolygon
    coordinates.forEach(polygon => {
      polygon.forEach(ring => {
        allCoords.push(...ring);
      });
    });
  } else if (coordinates[0] && Array.isArray(coordinates[0][0])) {
    // Polygon
    coordinates.forEach(ring => {
      allCoords.push(...ring);
    });
  }
  
  if (allCoords.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }
  
  const lngs = allCoords.map(c => c[0]);
  const lats = allCoords.map(c => c[1]);
  
  return {
    north: parseFloat(Math.max(...lats).toFixed(4)),
    south: parseFloat(Math.min(...lats).toFixed(4)),
    east: parseFloat(Math.max(...lngs).toFixed(4)),
    west: parseFloat(Math.min(...lngs).toFixed(4))
  };
}

async function main() {
  console.log('📊 Extracting province data from Natural Earth...\n');
  
  // Download Natural Earth data from GitHub (same source as frontend)
  console.log('📥 Downloading Natural Earth data from GitHub...');
  const naturalEarthUrl = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';
  
  const response = await fetch(naturalEarthUrl);
  if (!response.ok) {
    throw new Error(`Failed to download Natural Earth data: ${response.statusText}`);
  }
  
  const dataStr = await response.text();
  const geoData = JSON.parse(dataStr);
  
  console.log(`✅ Loaded ${geoData.features.length} total provinces from Natural Earth\n`);
  
  // Group by country
  const countryProvinces = new Map();
  
  for (const feature of geoData.features) {
    const iso3 = feature.properties.iso_a2 || feature.properties.adm0_a3;
    const iso2 = ISO3_TO_ISO2[iso3] || iso3;
    
    if (!APPROVED_COUNTRIES.includes(iso2)) continue;
    
    if (!countryProvinces.has(iso2)) {
      countryProvinces.set(iso2, []);
    }
    
    const provinceName = feature.properties.name || feature.properties.gn_name;
    const centroid = calculateCentroid(feature.geometry.coordinates);
    const bounds = calculateBounds(feature.geometry.coordinates);
    
    countryProvinces.get(iso2).push({
      name: provinceName,
      bounds: bounds,
      centroid: centroid,
      properties: {
        type: feature.properties.type,
        geounit: feature.properties.geounit,
        postal: feature.properties.postal
      }
    });
  }
  
  // Sort provinces by name within each country
  for (const [code, provinces] of countryProvinces.entries()) {
    provinces.sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB);
    });
  }
  
  console.log('📋 Province counts by country:');
  console.log('═'.repeat(60));
  
  for (const code of APPROVED_COUNTRIES) {
    const provinces = countryProvinces.get(code) || [];
    const status = provinces.length > 0 ? '✅' : '❌';
    console.log(`${status} ${code} (${COUNTRY_NAME_MAP[code]}): ${provinces.length} provinces`);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 Total: ${APPROVED_COUNTRIES.length} countries, ${Array.from(countryProvinces.values()).reduce((sum, arr) => sum + arr.length, 0)} provinces\n`);
  
  // Generate JavaScript code
  let jsCode = '// MISSING COUNTRIES - Add these to provinceDataService.mjs\n\n';
  
  const missingCountries = APPROVED_COUNTRIES.filter(code => {
    const provinces = countryProvinces.get(code) || [];
    return provinces.length > 0 && !['IT', 'ES', 'FR', 'US', 'CA', 'CN', 'JP', 'AU'].includes(code);
  });
  
  for (const code of missingCountries) {
    const provinces = countryProvinces.get(code);
    if (!provinces || provinces.length === 0) continue;
    
    const countryBounds = {
      north: Math.max(...provinces.map(p => p.bounds.north)),
      south: Math.min(...provinces.map(p => p.bounds.south)),
      east: Math.max(...provinces.map(p => p.bounds.east)),
      west: Math.min(...provinces.map(p => p.bounds.west))
    };
    
    jsCode += `      '${code}': {\n`;
    jsCode += `        name: '${COUNTRY_NAME_MAP[code]}',\n`;
    jsCode += `        continent: '${CONTINENT_MAP[code]}',\n`;
    jsCode += `        bounds: { north: ${countryBounds.north}, south: ${countryBounds.south}, east: ${countryBounds.east}, west: ${countryBounds.west} },\n`;
    jsCode += `        provinces: [\n`;
    
    for (const province of provinces) {
      jsCode += `          { name: '${province.name}', bounds: ${JSON.stringify(province.bounds)}, centroid: ${JSON.stringify(province.centroid)} },\n`;
    }
    
    jsCode += `        ]\n`;
    jsCode += `      },\n\n`;
  }
  
  // Write output
  const outputPath = path.join(__dirname, 'extracted-province-data.js');
  await fs.writeFile(outputPath, jsCode);
  
  console.log(`✅ Generated province data written to: ${outputPath}\n`);
  console.log('📝 Copy this data and add it to src/backend/services/provinceDataService.mjs');
  console.log('   in the naturalEarthData object (around line 36)\n');
  
  // Show summary of missing countries
  console.log('🔍 Countries with province data to add:');
  for (const code of missingCountries) {
    const provinces = countryProvinces.get(code);
    console.log(`   ${code}: ${provinces.length} provinces`);
  }
}

main().catch(console.error);
