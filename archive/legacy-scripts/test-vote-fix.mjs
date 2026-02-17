/**
 * Test script to verify the vote count fix
 */
import { promises as fs } from 'fs';

// Import voting engine functions
const votingEngine = await import('./src/backend/voting/votingEngine.mjs');
const { getTopicVoteTotals, processVote } = votingEngine;

console.log('🧪 Testing Vote Count Fix');
console.log('========================');

// Test 1: Check initial vote counts
console.log('\n1. Testing initial vote counts for ujhi channel (1759217730559)');
try {
  const initialTotals = await getTopicVoteTotals('1759217730559');
  console.log('✅ Initial vote totals:', {
    totalVotes: initialTotals.totalVotes,
    candidates: Object.fromEntries(
      Object.entries(initialTotals.candidates).map(([id, votes]) => [
        id.includes('candidate-1759217730559') ? id.split('-').slice(-1)[0] : id,
        votes
      ])
    )
  });

  // Check if the problematic candidate still has 6000 votes
  const problematicCandidate = 'candidate-1759217730559-0-3w99krs6u';
  const candidateVotes = initialTotals.candidates[problematicCandidate];
  
  if (candidateVotes === 6000) {
    console.log('✅ Candidate with ID ending in 3w99krs6u has correct base count: 6000 votes');
  } else {
    console.log(`❌ Candidate vote count is wrong: ${candidateVotes} (expected 6000)`);
  }

  console.log('\n2. Testing vote rebuilding functionality');
  const rebuildStats = await votingEngine.rebuildVoteTotalsFromLedger('1759217730559');
  console.log('✅ Rebuild completed:', rebuildStats);

  // Check vote totals after rebuild
  const rebuiltTotals = await getTopicVoteTotals('1759217730559');
  const rebuiltCandidateVotes = rebuiltTotals.candidates[problematicCandidate];
  
  if (rebuiltCandidateVotes === 6000) {
    console.log('✅ After rebuild, candidate still has correct base count: 6000 votes');
    console.log('✅ Vote count reset bug appears to be FIXED! 🎉');
  } else {
    console.log(`❌ After rebuild, candidate vote count is wrong: ${rebuiltCandidateVotes} (expected 6000)`);
    console.log('❌ Bug still exists - needs further investigation');
  }

  console.log('\n3. Summary of all candidates after rebuild:');
  for (const [candidateId, votes] of Object.entries(rebuiltTotals.candidates)) {
    const shortId = candidateId.includes('candidate-1759217730559') ? 
      'ujhi-' + candidateId.split('-').slice(-1)[0] : 
      candidateId;
    console.log(`   ${shortId}: ${votes} votes`);
  }

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
}

console.log('\n🏁 Test complete');