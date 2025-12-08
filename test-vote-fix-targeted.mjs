#!/usr/bin/env node

// Test script to verify vote count preservation for newly created candidates
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import voting engine functions
const { 
  getTopicVoteTotals, 
  rebuildVoteTotalsFromLedger, 
  processVote,
  topicVoteTotals 
} = await import('./src/backend/voting/votingEngine.mjs');

console.log('🔍 Testing vote count preservation for TestDataPanel candidates...\n');

// Test channel ID from your console logs
const testChannelId = 'created-1759689615097-inhlpdsix';
const testCandidateId = 'candidate-1759689615079-6-56x7zy0yu'; // Candidate 7

console.log(`📋 Testing with channel: ${testChannelId}`);
console.log(`📋 Testing with candidate: ${testCandidateId}\n`);

try {
  // Step 1: Get current vote totals
  console.log('1️⃣ Getting current vote totals...');
  const initialTotals = await getTopicVoteTotals(testChannelId);
  console.log(`   Current total votes: ${initialTotals.totalVotes}`);
  console.log(`   Candidate ${testCandidateId} current votes: ${initialTotals.candidates[testCandidateId] || 0}`);
  console.log('');

  // Step 2: Check internal cache state  
  console.log('2️⃣ Checking internal cache state...');
  if (topicVoteTotals && topicVoteTotals.get) {
    const cachedTotals = topicVoteTotals.get(testChannelId);
    if (cachedTotals && cachedTotals.get) {
      const cachedCount = cachedTotals.get(testCandidateId);
      console.log(`   Cached count for candidate: ${cachedCount || 0}`);
    } else {
      console.log(`   No cached data found for channel`);
    }
  } else {
    console.log(`   Cache not initialized: topicVoteTotals is`, topicVoteTotals);
  }
  console.log('');

  // Step 3: Simulate rebuild (this might be what's causing the issue)
  console.log('3️⃣ Testing rebuild function...');
  await rebuildVoteTotalsFromLedger(testChannelId);
  
  // Step 4: Check totals after rebuild
  console.log('4️⃣ Checking totals after rebuild...');
  const rebuiltTotals = await getTopicVoteTotals(testChannelId);
  console.log(`   Total votes after rebuild: ${rebuiltTotals.totalVotes}`);
  console.log(`   Candidate ${testCandidateId} after rebuild: ${rebuiltTotals.candidates[testCandidateId] || 0}`);
  console.log('');
  
  // Step 5: Try processing a vote
  console.log('5️⃣ Testing vote processing...');
  const testUserId = 'test-user-fix-verification';
  
  try {
    const voteResult = await processVote(testUserId, testChannelId, 'FOR', testCandidateId, 1.0);
    console.log(`   Vote processed: ${voteResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Action: ${voteResult.action}`);
    
    // Check final totals
    const finalTotals = await getTopicVoteTotals(testChannelId);
    console.log(`   Final total votes: ${finalTotals.totalVotes}`);
    console.log(`   Final candidate votes: ${finalTotals.candidates[testCandidateId] || 0}`);
    
    // Validate expectation
    const expectedCount = (initialTotals.candidates[testCandidateId] || 0) + 1;
    const actualCount = finalTotals.candidates[testCandidateId] || 0;
    
    if (actualCount >= expectedCount) {
      console.log(`✅ PASS: Vote count properly preserved and incremented`);
      console.log(`   Expected at least: ${expectedCount}, Got: ${actualCount}`);
    } else {
      console.log(`❌ FAIL: Vote count was reset`);
      console.log(`   Expected at least: ${expectedCount}, Got: ${actualCount}`);
    }
    
  } catch (voteError) {
    console.log(`❌ Vote processing failed: ${voteError.message}`);
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
}