// ============================================================================
// test-boundary-system.mjs - Test Script for Unified Boundary System
// ============================================================================
// Validates that the boundary service works correctly
// ============================================================================

import { boundaryService } from '../src/backend/services/boundaryService.mjs';

async function runTests() {
  console.log('🧪 Testing Unified Boundary System\n');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Initialize service
    console.log('📋 Test 1: Initialize Service');
    await boundaryService.initialize();
    console.log('✅ Service initialized\n');

    // Test listing countries
    console.log('📋 Test 2: List Countries');
    const countries = await boundaryService.listCountries();
    console.log(`✅ Found ${countries.length} countries`);
    console.log(`   Sample: ${countries.slice(0, 5).map(c => c.name).join(', ')}\n`);

    // Test listing provinces
    console.log('📋 Test 3: List Italian Provinces');
    const provinces = await boundaryService.listProvinces('ITA');
    console.log(`✅ Found ${provinces.length} provinces in Italy`);
    console.log(`   Sample: ${provinces.slice(0, 5).map(p => p.name).join(', ')}\n`);

    // Test listing cities
    console.log('📋 Test 4: List Spanish Cities');
    const cities = await boundaryService.listCities('ESP');
    console.log(`✅ Found ${cities.length} cities in Spain`);
    console.log(`   Sample: ${cities.slice(0, 5).map(c => c.name).join(', ')}\n`);

    // Test getting boundary
    console.log('📋 Test 5: Get France Country Boundary');
    const boundary = await boundaryService.getBoundary('FRA', 'ADM0');
    console.log(`✅ Retrieved boundary with ${boundary.features.length} features`);
    console.log(`   Type: ${boundary.type}\n`);

    // Test generating coordinates
    console.log('📋 Test 6: Generate Coordinates in Italy (country level)');
    const coords = await boundaryService.generateCoordinatesInRegion('ITA', null, null, 5);
    console.log(`✅ Generated ${coords.length} coordinates`);
    coords.forEach((c, i) => {
      console.log(`   ${i + 1}. [${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}] - ${c.country}`);
    });
    console.log();

    // Test bounds
    console.log('📋 Test 7: Get Bounds for Turkey');
    const bounds = await boundaryService.getBounds('TUR');
    console.log(`✅ Retrieved bounds for Turkey`);
    console.log(`   North: ${bounds.north}, South: ${bounds.south}`);
    console.log(`   East: ${bounds.east}, West: ${bounds.west}\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 All Tests Passed!');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n✅ Boundary system is working correctly');
    console.log('✅ Ready to use in Channel Generator and Globe\n');

  } catch (error) {
    console.error('❌ Test Failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runTests();
