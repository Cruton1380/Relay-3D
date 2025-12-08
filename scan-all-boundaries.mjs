/**
 * Comprehensive Boundary Channel Scanner
 * 
 * This script scans ALL countries and provinces to verify which ones
 * have actual polygon coordinates vs placeholder geometry.
 */

import boundaryChannelService from './src/backend/services/boundaryChannelService.mjs';
import { naturalEarthLoader } from './src/backend/services/naturalEarthLoader.mjs';

console.log('🔍 COMPREHENSIVE BOUNDARY CHANNEL SCANNER\n');
console.log('='.repeat(80));

// Initialize
console.log('\n📂 Initializing services...');
await naturalEarthLoader.initialize();
await boundaryChannelService.initialize(false); // Don't force regenerate

console.log('✅ Services initialized\n');

// Function to count vertices in geometry
function countVertices(geometry) {
  if (!geometry || !geometry.coordinates) return 0;
  
  if (geometry.type === 'Polygon') {
    return geometry.coordinates[0].length;
  } else if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.reduce((sum, polygon) => {
      return sum + polygon[0].length;
    }, 0);
  }
  
  return 0;
}

// Function to test a single region
async function testRegion(name, code, type) {
  try {
    const channel = await boundaryChannelService.getOrCreateBoundaryChannel(name, type, code);
    const officialCandidate = channel.candidates.find(c => c.isOfficial);
    
    if (!officialCandidate) {
      return { name, code, type, status: 'no-official', vertices: 0 };
    }
    
    const geometry = officialCandidate.location?.geometry;
    const vertices = countVertices(geometry);
    const isPlaceholder = vertices === 5;
    
    return {
      name,
      code,
      type,
      status: isPlaceholder ? 'placeholder' : 'ok',
      vertices,
      geomType: geometry?.type || 'none'
    };
  } catch (error) {
    return {
      name,
      code,
      type,
      status: 'error',
      vertices: 0,
      error: error.message
    };
  }
}

// Test countries
console.log('='.repeat(80));
console.log('\n🌍 SCANNING ALL COUNTRIES\n');
console.log('─'.repeat(80));

const countryResults = [];
const testCountries = [
  { name: 'India', code: 'IND' },
  { name: 'Iran', code: 'IRN' },
  { name: 'United States', code: 'USA' },
  { name: 'China', code: 'CHN' },
  { name: 'Brazil', code: 'BRA' },
  { name: 'Canada', code: 'CAN' },
  { name: 'Russia', code: 'RUS' },
  { name: 'Australia', code: 'AUS' },
  { name: 'Indonesia', code: 'IDN' },
  { name: 'Mexico', code: 'MEX' },
  { name: 'Japan', code: 'JPN' },
  { name: 'Germany', code: 'DEU' },
  { name: 'France', code: 'FRA' },
  { name: 'United Kingdom', code: 'GBR' },
  { name: 'Italy', code: 'ITA' },
  { name: 'Spain', code: 'ESP' },
  { name: 'South Korea', code: 'KOR' },
  { name: 'Egypt', code: 'EGY' },
  { name: 'South Africa', code: 'ZAF' },
  { name: 'Nigeria', code: 'NGA' }
];

for (const country of testCountries) {
  const result = await testRegion(country.name, country.code, 'country');
  countryResults.push(result);
  
  const status = result.status === 'ok' ? '✅' : result.status === 'placeholder' ? '⚠️' : '❌';
  const vertexStr = result.vertices.toLocaleString().padStart(8);
  console.log(`${status} ${country.name.padEnd(25)} (${country.code}): ${vertexStr} vertices [${result.geomType}]`);
}

// Test provinces
console.log('\n' + '='.repeat(80));
console.log('\n🏞️ SCANNING PROVINCES\n');
console.log('─'.repeat(80));

const provinceResults = [];
const testProvinces = [
  { name: 'Équateur', code: 'CD-EQ', country: 'Democratic Republic of the Congo' },
  { name: 'Tibesti', code: 'TD-TI', country: 'Chad' },
  { name: 'Orientale', code: 'CD-OR', country: 'Democratic Republic of the Congo' },
  { name: 'California', code: 'US-CA', country: 'United States' },
  { name: 'Texas', code: 'US-TX', country: 'United States' },
  { name: 'Ontario', code: 'CA-ON', country: 'Canada' },
  { name: 'Quebec', code: 'CA-QC', country: 'Canada' },
  { name: 'Maharashtra', code: 'IN-MH', country: 'India' },
  { name: 'Karnataka', code: 'IN-KA', country: 'India' },
  { name: 'Tamil Nadu', code: 'IN-TN', country: 'India' },
  { name: 'Xinjiang', code: 'CN-XJ', country: 'China' },
  { name: 'Xizang', code: 'CN-XZ', country: 'China' },
  { name: 'Bavaria', code: 'DE-BY', country: 'Germany' },
  { name: 'Île-de-France', code: 'FR-IDF', country: 'France' },
  { name: 'New South Wales', code: 'AU-NSW', country: 'Australia' },
  { name: 'Queensland', code: 'AU-QLD', country: 'Australia' },
  { name: 'Hokkaido', code: 'JP-01', country: 'Japan' },
  { name: 'Tokyo', code: 'JP-13', country: 'Japan' },
  { name: 'Moscow', code: 'RU-MOW', country: 'Russia' },
  { name: 'Saint Petersburg', code: 'RU-SPE', country: 'Russia' }
];

for (const province of testProvinces) {
  const result = await testRegion(province.name, province.code, 'province');
  provinceResults.push(result);
  
  const status = result.status === 'ok' ? '✅' : result.status === 'placeholder' ? '⚠️' : '❌';
  const vertexStr = result.vertices.toLocaleString().padStart(8);
  console.log(`${status} ${province.name.padEnd(25)} (${province.country.padEnd(35)}): ${vertexStr} vertices [${result.geomType}]`);
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('\n📊 SUMMARY\n');
console.log('─'.repeat(80));

const countryStats = {
  total: countryResults.length,
  ok: countryResults.filter(r => r.status === 'ok').length,
  placeholder: countryResults.filter(r => r.status === 'placeholder').length,
  error: countryResults.filter(r => r.status === 'error').length
};

const provinceStats = {
  total: provinceResults.length,
  ok: provinceResults.filter(r => r.status === 'ok').length,
  placeholder: provinceResults.filter(r => r.status === 'placeholder').length,
  error: provinceResults.filter(r => r.status === 'error').length
};

console.log(`🌍 COUNTRIES: ${countryStats.total} tested`);
console.log(`   ✅ OK (actual geometry): ${countryStats.ok}`);
console.log(`   ⚠️ Placeholder (5 vertices): ${countryStats.placeholder}`);
console.log(`   ❌ Error: ${countryStats.error}`);

console.log(`\n🏞️ PROVINCES: ${provinceStats.total} tested`);
console.log(`   ✅ OK (actual geometry): ${provinceStats.ok}`);
console.log(`   ⚠️ Placeholder (5 vertices): ${provinceStats.placeholder}`);
console.log(`   ❌ Error: ${provinceStats.error}`);

// Show problematic regions
const problematicCountries = countryResults.filter(r => r.status !== 'ok');
const problematicProvinces = provinceResults.filter(r => r.status !== 'ok');

if (problematicCountries.length > 0) {
  console.log('\n⚠️ PROBLEMATIC COUNTRIES:');
  problematicCountries.forEach(r => {
    console.log(`   ${r.name} (${r.code}): ${r.status} - ${r.error || r.vertices + ' vertices'}`);
  });
}

if (problematicProvinces.length > 0) {
  console.log('\n⚠️ PROBLEMATIC PROVINCES:');
  problematicProvinces.forEach(r => {
    console.log(`   ${r.name} (${r.code}): ${r.status} - ${r.error || r.vertices + ' vertices'}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('✅ Scan complete!\n');

// Export results
console.log('💾 Saving results to boundary-scan-results.json...');
import { writeFileSync } from 'fs';
writeFileSync('boundary-scan-results.json', JSON.stringify({
  timestamp: new Date().toISOString(),
  countries: countryResults,
  provinces: provinceResults,
  summary: {
    countries: countryStats,
    provinces: provinceStats
  }
}, null, 2));
console.log('✅ Results saved!\n');
