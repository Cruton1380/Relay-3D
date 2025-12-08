// scripts/load-test-voters-to-storage.mjs
/**
 * Quick script to load test voters into the new storage system
 */

import { getStorage } from '../src/backend/storage/index.mjs';
import logger from '../src/backend/utils/logging/logger.mjs';

const testLogger = logger.child({ module: 'test-voter-loader' });

async function loadTestVoters() {
  console.log('🗳️ Loading test voters into storage system...\n');
  
  try {
    const storage = await getStorage();
    
    // Test candidate IDs from your system
    const candidates = [
      { id: 'candidate-1761087996622-0-d8ikdust4', name: 'twat Candidate 1', lat: 18.5507, lng: -68.7537 },
      { id: 'candidate-1761087996622-1-5ko8jyq1q', name: 'twat Candidate 2', lat: 7.4681, lng: 80.0437 },
      { id: 'candidate-1761087996622-2-u7hijoryl', name: 'twat Candidate 3', lat: -11.3779, lng: 21.5476 },
      { id: 'candidate-1761087996622-3-oop6ieriq', name: 'twat Candidate 4', lat: 27.5511, lng: 54.5451 }
    ];
    
    const voters = [];
    const votersPerCandidate = 100; // Start with 100 voters per candidate
    
    for (const candidate of candidates) {
      console.log(`📍 Generating ${votersPerCandidate} voters for ${candidate.name}...`);
      
      for (let i = 0; i < votersPerCandidate; i++) {
        // Generate voters in a small radius around the candidate
        const radiusDegrees = 2; // ~200km radius
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radiusDegrees;
        
        const lat = candidate.lat + (distance * Math.cos(angle));
        const lng = candidate.lng + (distance * Math.sin(angle));
        
        voters.push({
          userId: `test_voter_${candidate.id}_${i}`,
          candidateId: candidate.id,
          channelId: 'created-1761087996653-4de3ew0hu', // Your channel ID
          privacyLevel: 'gps',
          location: {
            lat: lat,
            lng: lng
          },
          city: 'Test City',
          province: 'Test Province',
          country: 'Test Country'
        });
      }
    }
    
    console.log(`\n💾 Inserting ${voters.length} voters into storage...`);
    const startTime = Date.now();
    
    await storage.insertVoters(voters);
    
    const insertTime = Date.now() - startTime;
    console.log(`✅ Inserted ${voters.length} voters in ${insertTime}ms`);
    console.log(`   Average: ${(insertTime / voters.length).toFixed(2)}ms per voter\n`);
    
    // Verify with stats
    const stats = await storage.getStats();
    console.log('📊 Storage Stats:');
    console.log(`   Storage type: ${stats.storageType}`);
    console.log(`   Total voters: ${stats.totalVoters}`);
    console.log(`   Memory usage: ${stats.memoryUsageMB.toFixed(2)} MB\n`);
    
    console.log('\n✅ Test voters loaded successfully!');
    console.log('🎯 Now hover over a candidate in the UI to see voter towers!\n');
    
  } catch (error) {
    testLogger.error('Failed to load test voters:', error);
    console.error('\n❌ Failed to load test voters:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the loader
loadTestVoters()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

