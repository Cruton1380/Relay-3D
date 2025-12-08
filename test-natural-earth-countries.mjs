/**
 * Test Natural Earth Country Data Loading
 * 
 * Diagnoses why India works but Iran and other countries show placeholder geometry.
 * Run this to see which countries are actually in your GeoJSON file.
 */

import { naturalEarthLoader } from './src/backend/services/naturalEarthLoader.mjs';

console.log('🔍 NATURAL EARTH COUNTRY DATA DIAGNOSTIC TEST\n');
console.log('='.repeat(80));

// Initialize the loader
console.log('\n📂 Loading Natural Earth data...\n');
await naturalEarthLoader.initialize();

console.log('✅ Data loaded successfully!\n');
console.log('='.repeat(80));

// Test specific countries that users reported issues with
const testCodes = [
  { code: 'IND', name: 'India' },
  { code: 'IRN', name: 'Iran' },
  { code: 'IRQ', name: 'Iraq' },
  { code: 'USA', name: 'United States' },
  { code: 'CHN', name: 'China' },
  { code: 'BRA', name: 'Brazil' },
  { code: 'RUS', name: 'Russia' },
  { code: 'VAT', name: 'Vatican' }
];

console.log('\n🧪 TESTING SPECIFIC COUNTRIES:\n');
console.log('-'.repeat(80));

for (const test of testCodes) {
  const feature = naturalEarthLoader.findCountryByISOCode(test.code);
  
  if (feature) {
    const props = feature.properties;
    const geom = feature.geometry;
    const coordCount = geom.type === 'Polygon' 
      ? geom.coordinates[0]?.length || 0
      : geom.coordinates?.flat(2).length || 0;
    
    const status = coordCount > 10 ? '✅' : '⚠️';
    
    console.log(`${status} ${test.code} (${test.name})`);
    console.log(`   Found: "${props.ADMIN || props.NAME}"`);
    console.log(`   ISO_A3: "${props.ISO_A3 || 'N/A'}", ADM0_A3: "${props.ADM0_A3 || 'N/A'}"`);
    console.log(`   Geometry: ${geom.type}, ${coordCount} coordinates`);
    
    if (coordCount <= 5) {
      console.log(`   ⚠️ WARNING: This looks like placeholder geometry!`);
    }
  } else {
    console.log(`❌ ${test.code} (${test.name})`);
    console.log(`   NOT FOUND in GeoJSON data!`);
  }
  console.log('');
}

console.log('='.repeat(80));

// Show sample of available properties
console.log('\n📋 AVAILABLE GEOJSON PROPERTIES (from first country):\n');
const sampleFeature = naturalEarthLoader.countriesData.features[0];
const sampleProps = sampleFeature.properties;
console.log('Property keys:', Object.keys(sampleProps).join(', '));
console.log('\nSample values:');
for (const [key, value] of Object.entries(sampleProps)) {
  if (typeof value === 'string' || typeof value === 'number') {
    console.log(`  ${key}: "${value}"`);
  }
}

console.log('\n' + '='.repeat(80));

// List ALL countries in the dataset
console.log('\n📊 ALL COUNTRIES IN DATASET:\n');
console.log('-'.repeat(80));
console.log('ISO_A3   | ADM0_A3  | Country Name                       | Vertices');
console.log('-'.repeat(80));

const allFeatures = naturalEarthLoader.countriesData.features;
const countryList = allFeatures.map(f => {
  const props = f.properties;
  const name = props.ADMIN || props.NAME || 'Unknown';
  const iso = props.ISO_A3 || 'N/A';
  const adm = props.ADM0_A3 || 'N/A';
  const geom = f.geometry;
  const coords = geom.type === 'Polygon'
    ? geom.coordinates[0]?.length || 0
    : geom.coordinates?.flat(2).length || 0;
  
  return {
    iso,
    adm,
    name,
    coords
  };
}).sort((a, b) => a.name.localeCompare(b.name));

for (const country of countryList) {
  const iso = country.iso.padEnd(8);
  const adm = country.adm.padEnd(8);
  const name = country.name.padEnd(36);
  const coords = String(country.coords).padStart(7);
  
  const status = country.coords > 10 ? ' ' : '⚠️';
  console.log(`${iso} | ${adm} | ${name} | ${coords} ${status}`);
}

console.log('-'.repeat(80));
console.log(`\nTotal countries: ${countryList.length}`);

// Statistics
const validCountries = countryList.filter(c => c.coords > 10).length;
const placeholderCountries = countryList.filter(c => c.coords <= 5).length;

console.log(`Valid geometry: ${validCountries}`);
console.log(`Placeholder/Invalid: ${placeholderCountries}`);

console.log('\n' + '='.repeat(80));
console.log('\n💡 ANALYSIS:\n');

if (placeholderCountries > 0) {
  console.log(`❌ ISSUE FOUND: ${placeholderCountries} countries have placeholder geometry!`);
  console.log(`   This explains why Iran and other countries show rectangles.`);
  console.log(`\n🔧 SOLUTIONS:`);
  console.log(`   1. Check if data/countries-10m.geojson is complete`);
  console.log(`   2. Re-download Natural Earth data`);
  console.log(`   3. Add name-based fallback lookup`);
} else {
  console.log(`✅ All countries have valid geometry!`);
  console.log(`   The issue might be with ISO code matching.`);
  console.log(`\n🔧 SOLUTIONS:`);
  console.log(`   1. Check ISO code mappings in country-iso-codes.json`);
  console.log(`   2. Add alternative property lookups (SOV_A3, ADM0_A3_US, etc.)`);
}

console.log('\n' + '='.repeat(80));
console.log('\n✅ Diagnostic test complete!\n');
