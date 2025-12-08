#!/usr/bin/env node

/**
 * Migrate Existing Voters to Spatial Index
 * Indexes all existing votes for high-performance spatial queries
 */

import { getUsersWithVotesForCandidate } from '../src/backend/voting/votingEngine.mjs';
import { getUserLocation } from '../src/backend/services/userLocationService.mjs';
import { getUserPrivacyLevel } from '../src/backend/services/userPreferencesService.mjs';
import spatialVoterIndex from '../src/backend/services/spatialVoterIndex.mjs';
import { getChannels } from '../src/backend/channel-service/index.mjs';

console.log('🚀 Starting migration of existing voters to spatial index...\n');

const startTime = Date.now();
let totalVoters = 0;
let totalWithLocation = 0;
let totalIndexed = 0;

try {
  // Get all channels
  const channels = getChannels();
  console.log(`📊 Found ${channels.length} channels\n`);

  for (const channel of channels) {
    console.log(`Processing channel: ${channel.name} (${channel.id})`);
    
    for (const candidate of channel.candidates) {
      // Get all voters for this candidate
      const voters = getUsersWithVotesForCandidate(channel.id, candidate.id);
      totalVoters += voters.length;
      
      if (voters.length === 0) {
        console.log(`  ⚠️  ${candidate.name}: No voters`);
        continue;
      }

      let candidateIndexed = 0;
      
      for (const { userId } of voters) {
        // Get user location
        const location = getUserLocation(userId);
        
        if (!location || !location.lat || !location.lng) {
          continue; // Skip voters without location
        }
        
        totalWithLocation++;
        
        // Get privacy level
        const privacyLevel = await getUserPrivacyLevel(userId).catch(() => 'gps');
        
        // Add to spatial index
        const success = spatialVoterIndex.addVoter(
          candidate.id,
          userId,
          location.lat,
          location.lng,
          privacyLevel
        );
        
        if (success) {
          candidateIndexed++;
          totalIndexed++;
        }
      }
      
      console.log(`  ✅ ${candidate.name}: ${candidateIndexed}/${voters.length} voters indexed`);
    }
    
    console.log('');
  }

  const duration = Date.now() - startTime;
  const rate = Math.round(totalIndexed / (duration / 1000));
  
  console.log('');
  console.log('═'.repeat(60));
  console.log('🎉 Migration Complete!');
  console.log('═'.repeat(60));
  console.log(`Total voters processed: ${totalVoters}`);
  console.log(`Voters with location: ${totalWithLocation}`);
  console.log(`Voters indexed: ${totalIndexed}`);
  console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
  console.log(`Rate: ${rate} voters/sec`);
  console.log('');

  // Print stats
  const stats = spatialVoterIndex.getStats();
  console.log('📊 Spatial Index Statistics:');
  console.log(`  Total voters in index: ${stats.totalVoters}`);
  console.log(`  Total candidates: ${stats.totalCandidates}`);
  console.log(`  Index sizes:`);
  console.log(`    - GPS level: ${stats.indexSizes.gps} clusters`);
  console.log(`    - City level: ${stats.indexSizes.city} clusters`);
  console.log(`    - Province level: ${stats.indexSizes.province} clusters`);
  console.log(`    - Country level: ${stats.indexSizes.country} clusters`);
  console.log('');
  console.log('✅ Spatial index is ready for high-performance queries!');
  console.log('');

  process.exit(0);

} catch (error) {
  console.error('');
  console.error('❌ Migration failed:');
  console.error(error);
  console.error('');
  process.exit(1);
}

