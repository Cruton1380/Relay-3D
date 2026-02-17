/**
 * Clear Boundary Candidates Script
 * 
 * Removes all test boundary proposals from channels
 * Run before implementing the new difference visualization system
 */

import boundaryChannelService from '../src/backend/services/boundaryChannelService.mjs';

console.log('🧹 Clearing all boundary candidates...\n');

try {
  // Get all boundary channels
  const allChannels = Array.from(boundaryChannelService.boundaryChannels.values());
  
  let totalCleared = 0;
  
  for (const channel of allChannels) {
    const beforeCount = channel.candidates?.length || 0;
    
    if (beforeCount > 0) {
      console.log(`📂 Channel: ${channel.name || channel.regionName}`);
      console.log(`   Before: ${beforeCount} candidates`);
      
      // Keep only the official boundary (isOfficial: true)
      const officialCandidate = channel.candidates.find(c => c.isOfficial);
      
      if (officialCandidate) {
        channel.candidates = [officialCandidate];
        console.log(`   ✅ Kept official boundary, removed ${beforeCount - 1} proposals`);
        totalCleared += (beforeCount - 1);
      } else {
        // If no official boundary, clear all
        channel.candidates = [];
        console.log(`   ⚠️  No official boundary found, cleared all ${beforeCount} candidates`);
        totalCleared += beforeCount;
      }
      
      console.log(`   After: ${channel.candidates.length} candidate(s)\n`);
    }
  }
  
  console.log(`\n✅ Cleanup complete!`);
  console.log(`   Total candidates removed: ${totalCleared}`);
  console.log(`   Channels cleaned: ${allChannels.length}`);
  console.log(`\n🎯 Ready to test new difference visualization system!\n`);
  
} catch (error) {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
}
