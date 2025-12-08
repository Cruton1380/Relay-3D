#!/usr/bin/env node

import votingEngine, { addMockChannelDataToVoteSystem, getTopicVoteTotals } from './src/backend/voting/votingEngine.mjs';

async function runTest() {
console.log('🧪 Testing Vote Fix for New Candidates');
console.log('=====================================');

// First, let's simulate creating a new channel with candidates (like TestDataPanel does)
const testChannelId = 'created-test-12345';
const testCandidates = [
    {
        id: 'candidate-test-1',
        name: 'Test Candidate 1',
        votes: 3000
    },
    {
        id: 'candidate-test-2', 
        name: 'Test Candidate 2',
        votes: 1500
    }
];

// Simulate adding mock channel data
console.log('\n1. Creating new channel with base vote counts...');
const channelData = {
    id: testChannelId,
    name: 'Test Channel',
    candidates: testCandidates
};
addMockChannelDataToVoteSystem(channelData);

// Check initial vote counts
console.log('\n2. Checking initial vote counts...');
const initialTotals = await getTopicVoteTotals(testChannelId);
console.log('✅ Initial totals:', initialTotals);

// Simulate a user voting
console.log('\n3. Simulating user vote...');
const voteData = {
    topic: testChannelId,
    choice: 'candidate-test-1',
    voteType: 'candidate',
    signature: 'test-signature',
    publicKey: 'test-user',
    timestamp: Date.now()
};

try {
    const voteResult = votingEngine.processVote(voteData);
    console.log('✅ Vote processed:', voteResult);
    
    // Check vote counts after voting
    console.log('\n4. Checking vote counts after voting...');
    const afterVoteTotals = await getTopicVoteTotals(testChannelId);
    console.log('🎯 After vote totals:', afterVoteTotals);
    
    // Check if the vote was added correctly
    if (afterVoteTotals.candidates['candidate-test-1'] === 3001) {
        console.log('✅ SUCCESS! Vote correctly added: 3000 + 1 = 3001');
    } else {
        console.log('❌ FAILED! Expected 3001, got:', afterVoteTotals.candidates['candidate-test-1']);
    }
    
    // Test rebuild functionality with new candidates
    console.log('\n5. Testing rebuild functionality with new candidates...');
    const rebuildResult = await votingEngine.rebuildVoteTotalsFromLedger([testChannelId]);
    console.log('🔄 Rebuild result:', rebuildResult);
    
    const afterRebuildTotals = await getTopicVoteTotals(testChannelId);
    console.log('🎯 After rebuild totals:', afterRebuildTotals);
    
    if (afterRebuildTotals.candidates['candidate-test-1'] === 3001) {
        console.log('✅ SUCCESS! Rebuild preserved vote correctly: 3001');
        console.log('🎉 New candidate voting system is FIXED!');
    } else {
        console.log('❌ REBUILD FAILED! Expected 3001, got:', afterRebuildTotals.candidates['candidate-test-1']);
        console.log('💡 This means the rebuild function needs more work for new candidates');
    }
    
} catch (error) {
    console.error('❌ Error during vote processing:', error);
}

console.log('\n🏁 Test complete');
}

runTest().catch(console.error);