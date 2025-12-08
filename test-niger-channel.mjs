/**
 * Test Niger boundary channel creation
 */

import boundaryChannelService from './src/backend/services/boundaryChannelService.mjs';

async function testNigerChannel() {
  console.log('🧪 Testing Niger boundary channel creation...\n');
  
  try {
    // Create boundary channel for Niger
    console.log('1️⃣ Creating boundary channel for Niger (NER)...');
    const result = await boundaryChannelService.getOrCreateBoundaryChannel(
      'Niger',      // regionName
      'country',    // regionType
      'NER'         // regionCode
    );
    
    console.log('\n✅ Channel Created!');
    console.log('Result structure:', Object.keys(result));
    console.log('Full result:', JSON.stringify(result, null, 2).substring(0, 1000));
    
    const channel = result.channel || result;
    console.log('   Channel ID:', channel.id);
    console.log('   Channel Name:', channel.name);
    console.log('   Region Code:', channel.regionCode);
    console.log('   Candidates:', channel.candidates?.length || 0);
    
    // Check official candidate
    const officialCandidate = channel.candidates?.find(c => c.isOfficial);
    
    if (officialCandidate) {
      console.log('\n📋 Official Candidate:');
      console.log('   ID:', officialCandidate.id);
      console.log('   Name:', officialCandidate.name);
      
      const geometry = officialCandidate.location?.geometry;
      if (geometry) {
        console.log('   Geometry Type:', geometry.type);
        if (geometry.coordinates && geometry.coordinates[0]) {
          const vertexCount = geometry.coordinates[0].length;
          console.log('   Vertex Count:', vertexCount);
          
          // Calculate bounding box
          const coords = geometry.coordinates[0];
          let minLng = Infinity, maxLng = -Infinity;
          let minLat = Infinity, maxLat = -Infinity;
          
          coords.forEach(([lng, lat]) => {
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
          });
          
          console.log('\n🗺️  Official Boundary Bounding Box:');
          console.log('   West:', minLng.toFixed(4), '°');
          console.log('   East:', maxLng.toFixed(4), '°');
          console.log('   South:', minLat.toFixed(4), '°');
          console.log('   North:', maxLat.toFixed(4), '°');
          console.log('   Center:', ((minLng + maxLng) / 2).toFixed(4), '°,', ((minLat + maxLat) / 2).toFixed(4), '°');
          
          // Check if it's the placeholder
          if (minLng === 0 && maxLng === 1 && minLat === 0 && maxLat === 1) {
            console.log('\n❌ WARNING: This is the PLACEHOLDER geometry, not Niger!');
          } else {
            console.log('\n✅ SUCCESS: Niger boundary channel has correct geometry!');
          }
        }
      } else {
        console.log('❌ No geometry in official candidate!');
      }
    } else {
      console.log('\n❌ No official candidate found!');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testNigerChannel();
