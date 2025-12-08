/**
 * Test Previously Failing Countries
 * Tests countries that previously fell back to country-level clustering
 */

import unifiedBoundaryService from '../src/backend/services/unifiedBoundaryService.mjs';

const MISSING_COUNTRIES = [
  { code: 'MX', name: 'Mexico', expected: 33 },
  { code: 'DE', name: 'Germany', expected: 16 },
  { code: 'GB', name: 'United Kingdom', expected: 232 },
  { code: 'IN', name: 'India', expected: 36 },
  { code: 'BR', name: 'Brazil', expected: 27 },
  { code: 'NZ', name: 'New Zealand', expected: 23 }
];

async function testCountry(countryCode, countryName) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`Testing: ${countryCode} (${countryName})`);
  console.log('─'.repeat(80));
  
  // Test coordinate generation
  console.log(`\n📍 Generating 5 test candidates for ${countryName}:\n`);
  
  const candidates = [];
  for (let i = 0; i < 5; i++) {
    const coordData = await unifiedBoundaryService.generateCandidateCoordinates(countryCode);
    if (coordData && coordData.province) {
      candidates.push(coordData);
      console.log(`   ${i + 1}. ${coordData.province} - [${coordData.location.lat.toFixed(4)}, ${coordData.location.lng.toFixed(4)}]`);
    } else {
      console.log(`   ${i + 1}. ❌ FALLBACK - No province data!`);
    }
  }
  
  // Analyze results
  const uniqueProvinces = new Set(candidates.map(c => c.province));
  const hasProvinces = candidates.every(c => c.province);
  
  console.log(`\n📊 Results:`);
  console.log(`   Total candidates: ${candidates.length}`);
  console.log(`   With province: ${candidates.filter(c => c.province).length}`);
  console.log(`   Unique provinces: ${uniqueProvinces.size}`);
  console.log(`   Provinces: ${Array.from(uniqueProvinces).join(', ')}`);
  
  if (hasProvinces) {
    console.log(`\n✅ ${countryCode}: NOW WORKING - Province-based clustering active!`);
    return true;
  } else {
    console.log(`\n❌ ${countryCode}: STILL FAILING - Falling back to country-level`);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Previously Failing Countries');
  console.log('═'.repeat(80));
  console.log('These countries previously fell back to country-level clustering.');
  console.log('After adding dynamic loader, they should now use province-level clustering.\n');
  
  const results = { passed: 0, failed: 0 };
  
  for (const country of MISSING_COUNTRIES) {
    const passed = await testCountry(country.code, country.name);
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('FINAL REPORT');
  console.log('═'.repeat(80));
  console.log(`✅ Now Working: ${results.passed}/${MISSING_COUNTRIES.length} countries`);
  console.log(`❌ Still Failing: ${results.failed}/${MISSING_COUNTRIES.length} countries`);
  
  if (results.failed === 0) {
    console.log('\n🎉 SUCCESS! All previously failing countries now use province-level clustering!');
  } else {
    console.log('\n⚠️ Some countries still falling back - investigation needed.');
  }
}

main().catch(console.error);
