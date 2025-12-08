#!/usr/bin/env node
/**
 * Quick Test Voters - Creates 20 voters for current channel to test visualization
 */

import { setMockUserLocation } from '../src/backend/services/userLocationService.mjs';
import { setUserPrivacyLevel } from '../src/backend/services/userPreferencesService.mjs';
import { processVote } from '../src/backend/voting/votingEngine.mjs';

async function createQuickTestVoters() {
  console.log('🚀 Creating 20 quick test voters...\n');
  
  // Hardcode the "twat" channel data
  const channel = {
    channelId: 'created-1761087996653-4de3ew0hu',
    name: 'twat',
    candidates: [
      {
        candidateId: 'candidate-1761087996622-0-d8ikdust4',
        name: 'twat Candidate 1',
        location: { lat: 18.550688, lng: -68.753670 }
      },
      {
        candidateId: 'candidate-1761087996622-1-5ko8jyq1q',
        name: 'twat Candidate 2',
        location: { lat: 7.468137, lng: 80.043693 }
      },
      {
        candidateId: 'candidate-1761087996622-2-u7hijoryl',
        name: 'twat Candidate 3',
        location: { lat: -11.377889, lng: 21.547627 }
      },
      {
        candidateId: 'candidate-1761087996622-3-oop6ieriq',
        name: 'twat Candidate 4',
        location: { lat: 27.551122, lng: 54.545097 }
      }
    ]
  };
  
  const votersPerCandidate = 20;
  let totalCreated = 0;
  
  for (const candidate of channel.candidates) {
    console.log(`Creating ${votersPerCandidate} voters for: ${candidate.name}`);
    
    for (let i = 0; i < votersPerCandidate; i++) {
      const userId = `quick_test_voter_${candidate.candidateId}_${i}_${Date.now()}`;
      
      // Random location near candidate (±1 degree)
      const lat = candidate.location.lat + (Math.random() * 2 - 1);
      const lng = candidate.location.lng + (Math.random() * 2 - 1);
      
      // Alternate between GPS and City privacy levels for variety
      const privacyLevel = i % 2 === 0 ? 'gps' : 'city';
      
      const location = {
        lat,
        lng,
        city: 'Test City',
        cityCode: 'TEST_CITY',
        province: 'Test Province',
        provinceCode: 'TEST_PROV',
        country: 'Test Country',
        countryCode: 'TC',
        verificationMethod: privacyLevel === 'gps' ? 'gps' : 'declared'
      };
      
      try {
        // Store location
        setMockUserLocation(userId, location);
        
        // Set privacy level
        await setUserPrivacyLevel(userId, privacyLevel);
        
        // Cast vote
        await processVote(
          userId,
          channel.channelId,
          'FOR',
          candidate.candidateId,
          0.95,
          { metadata: { source: 'quick-test' } }
        );
        
        totalCreated++;
      } catch (error) {
        console.error(`  ❌ Error for voter ${i}:`, error.message);
      }
    }
    
    console.log(`  ✅ Done\n`);
  }
  
  console.log(`\n🎉 Created ${totalCreated} test voters!`);
  console.log(`\n✅ Now test:`);
  console.log(`   1. Refresh browser (F5)`);
  console.log(`   2. Hover over a candidate cube`);
  console.log(`   3. Voter towers should appear! 🎯\n`);
}

createQuickTestVoters().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});


