#!/usr/bin/env node

/**
 * Generate 1 million GPS-level voters for testing high-performance rendering
 * This bypasses the slow API and directly creates voter data
 */

import { submitVote } from '../src/backend/voting/votingEngine.mjs';
import { setUserLocation } from '../src/backend/services/userLocationService.mjs';
import { setUserPrivacyLevel } from '../src/backend/services/userPreferencesService.mjs';

const CHANNEL_ID = 'created-1761087996653-4de3ew0hu';
const CANDIDATES = [
  'candidate-1761087996622-0-d8ikdust4',
  'candidate-1761087996622-1-5ko8jyq1q',
  'candidate-1761087996622-2-u7hijoryl',
  'candidate-1761087996622-3-oop6ieriq'
];

const TARGET_VOTERS = 1000000; // 1 million voters
const BATCH_SIZE = 10000; // Process in batches to avoid memory issues

// Generate random GPS coordinates
function randomCoords() {
  return {
    lat: (Math.random() * 180) - 90, // -90 to 90
    lng: (Math.random() * 360) - 180, // -180 to 180
    country: 'US',
    province: 'CA',
    city: 'San Francisco'
  };
}

// Generate a batch of voters
async function generateBatch(startIndex, batchSize) {
  const promises = [];
  
  for (let i = 0; i < batchSize; i++) {
    const voterIndex = startIndex + i;
    const userId = `perf_test_voter_${voterIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const candidateId = CANDIDATES[Math.floor(Math.random() * CANDIDATES.length)];
    const coords = randomCoords();
    
    // Set privacy level to GPS
    await setUserPrivacyLevel(userId, 'gps');
    
    // Set location
    await setUserLocation(userId, coords.lat, coords.lng, coords.country, coords.province, coords.city);
    
    // Submit vote (don't await - fire and forget for speed)
    promises.push(
      submitVote(userId, CHANNEL_ID, candidateId, { action: 'NEW_VOTE' })
        .catch(err => console.error(`Failed to submit vote for ${userId}:`, err.message))
    );
    
    // Log progress every 1000 voters
    if (voterIndex % 1000 === 0) {
      console.log(`✅ Generated ${voterIndex} voters...`);
    }
  }
  
  // Wait for all votes in this batch to complete
  await Promise.allSettled(promises);
}

async function main() {
  console.log(`🚀 Starting generation of ${TARGET_VOTERS} GPS-level voters...`);
  console.log(`📊 Distributing across ${CANDIDATES.length} candidates`);
  console.log(`⚡ Batch size: ${BATCH_SIZE}`);
  
  const startTime = Date.now();
  let processedVoters = 0;
  
  while (processedVoters < TARGET_VOTERS) {
    const batchSize = Math.min(BATCH_SIZE, TARGET_VOTERS - processedVoters);
    
    console.log(`\n📦 Processing batch: voters ${processedVoters} to ${processedVoters + batchSize}`);
    
    await generateBatch(processedVoters, batchSize);
    
    processedVoters += batchSize;
    
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = processedVoters / elapsed;
    const remaining = TARGET_VOTERS - processedVoters;
    const eta = remaining / rate;
    
    console.log(`⏱️  Elapsed: ${elapsed.toFixed(1)}s | Rate: ${rate.toFixed(0)} voters/s | ETA: ${(eta / 60).toFixed(1)}m`);
  }
  
  const totalTime = (Date.now() - startTime) / 1000;
  console.log(`\n🎉 Successfully generated ${TARGET_VOTERS} voters in ${totalTime.toFixed(1)}s`);
  console.log(`📈 Average rate: ${(TARGET_VOTERS / totalTime).toFixed(0)} voters/second`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

