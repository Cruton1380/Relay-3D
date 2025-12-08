/**
 * Test Niger boundary loading
 */

import { naturalEarthLoader } from './src/backend/services/naturalEarthLoader.mjs';

async function testNigerBoundary() {
  console.log('🧪 Testing Niger boundary loading...\n');
  
  try {
    // Initialize loader
    console.log('1️⃣ Initializing Natural Earth loader...');
    await naturalEarthLoader.initialize();
    console.log('✅ Initialized\n');
    
    // Test Niger (NER)
    console.log('2️⃣ Loading Niger (NER) boundary...');
    const nigerGeometry = await naturalEarthLoader.getBoundaryGeometry('NER', 'country');
    
    console.log('\n📊 Niger Geometry Info:');
    console.log('   Type:', nigerGeometry.type);
    console.log('   Coordinates:', nigerGeometry.coordinates ? 'Present' : 'Missing');
    
    if (nigerGeometry.coordinates && nigerGeometry.coordinates[0]) {
      const vertexCount = nigerGeometry.coordinates[0].length;
      console.log('   Vertex Count:', vertexCount);
      console.log('   First vertex:', nigerGeometry.coordinates[0][0]);
      console.log('   Last vertex:', nigerGeometry.coordinates[0][vertexCount - 1]);
      
      // Calculate bounding box
      const coords = nigerGeometry.coordinates[0];
      let minLng = Infinity, maxLng = -Infinity;
      let minLat = Infinity, maxLat = -Infinity;
      
      coords.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      });
      
      console.log('\n🗺️  Niger Bounding Box:');
      console.log('   West:', minLng.toFixed(4), '°');
      console.log('   East:', maxLng.toFixed(4), '°');
      console.log('   South:', minLat.toFixed(4), '°');
      console.log('   North:', maxLat.toFixed(4), '°');
      console.log('   Center:', ((minLng + maxLng) / 2).toFixed(4), '°,', ((minLat + maxLat) / 2).toFixed(4), '°');
      
      console.log('\n✅ SUCCESS: Niger boundary loaded correctly!');
      
      // Check if it's the placeholder
      if (minLng === 0 && maxLng === 1 && minLat === 0 && maxLat === 1) {
        console.log('\n❌ WARNING: This is the PLACEHOLDER geometry, not Niger!');
      }
      
    } else {
      console.log('\n❌ FAIL: No coordinate data!');
      console.log('Full geometry:', JSON.stringify(nigerGeometry, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testNigerBoundary();
