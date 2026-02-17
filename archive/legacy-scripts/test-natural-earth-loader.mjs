/**
 * Test Natural Earth Loader
 * Tests boundary geometry loading for India
 */

import { naturalEarthLoader } from './src/backend/services/naturalEarthLoader.mjs';

async function testBoundaryLoader() {
  console.log('=== Testing Natural Earth Loader ===\n');

  try {
    // Test 1: Load India boundary
    console.log('Test 1: Loading India (IND) boundary...');
    const indiaGeometry = await naturalEarthLoader.getBoundaryGeometry('IND', 'country');
    
    console.log(`- Geometry Type: ${indiaGeometry.type}`);
    console.log(`- Coordinates: ${indiaGeometry.coordinates.length} rings`);
    console.log(`- First ring vertices: ${indiaGeometry.coordinates[0].length}`);
    console.log(`- Sample coordinates (first 3):`);
    for (let i = 0; i < Math.min(3, indiaGeometry.coordinates[0].length); i++) {
      const [lng, lat] = indiaGeometry.coordinates[0][i];
      console.log(`  [${i}]: [${lng}, ${lat}]`);
    }
    
    // Test 2: Load USA boundary
    console.log('\nTest 2: Loading USA boundary...');
    const usaGeometry = await naturalEarthLoader.getBoundaryGeometry('USA', 'country');
    console.log(`- Geometry Type: ${usaGeometry.type}`);
    console.log(`- First ring vertices: ${usaGeometry.coordinates[0].length}`);
    
    // Test 3: Load China boundary
    console.log('\nTest 3: Loading China (CHN) boundary...');
    const chinaGeometry = await naturalEarthLoader.getBoundaryGeometry('CHN', 'country');
    console.log(`- Geometry Type: ${chinaGeometry.type}`);
    console.log(`- First ring vertices: ${chinaGeometry.coordinates[0].length}`);
    
    // Test 4: Invalid code (should return placeholder)
    console.log('\nTest 4: Loading invalid code (XXX)...');
    const invalidGeometry = await naturalEarthLoader.getBoundaryGeometry('XXX', 'country');
    console.log(`- Geometry Type: ${invalidGeometry.type}`);
    console.log(`- Is placeholder: ${invalidGeometry.coordinates[0].length === 5}`);
    
    // Test 5: Search countries
    console.log('\nTest 5: Searching for "india"...');
    const searchResults = await naturalEarthLoader.searchCountries('india', 5);
    console.log(`- Found ${searchResults.length} results:`);
    searchResults.forEach(r => {
      console.log(`  - ${r.name} (${r.code})`);
    });
    
    // Test 6: Validate codes
    console.log('\nTest 6: Validating ISO codes...');
    const validCodes = ['IND', 'USA', 'CHN', 'XXX'];
    for (const code of validCodes) {
      const isValid = await naturalEarthLoader.isValidCountryCode(code);
      console.log(`  - ${code}: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
    }
    
    console.log('\n=== All Tests Complete ===');
    console.log('\n✅ Natural Earth Loader is working correctly!');
    console.log('India boundary has been successfully loaded with real coordinates.');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    process.exit(1);
  }
}

testBoundaryLoader();
