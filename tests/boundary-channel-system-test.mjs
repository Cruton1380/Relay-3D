/**
 * Test: Boundary Channel System
 * 
 * Tests the Week 2 Day 1 implementation:
 * - Boundary channel creation
 * - Default candidate generation
 * - Boundary proposal as candidate
 * - Voting on boundary candidates
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

let testsPassed = 0;
let testsFailed = 0;

async function runTest(testName, testFn) {
  try {
    console.log(`\n${colors.blue}Test ${testsPassed + testsFailed + 1}: ${testName}${colors.reset}`);
    await testFn();
    testsPassed++;
    console.log(`${colors.green}✓ Pass${colors.reset}`);
  } catch (error) {
    testsFailed++;
    console.log(`${colors.red}✗ Fail: ${error.message}${colors.reset}`);
  }
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// Test Suite
// ========================================

console.log(`${colors.bold}${colors.blue}🧪 Boundary Channel System Test Suite${colors.reset}\n`);

// Test 1: Get all boundary channels
await runTest('GET /api/boundary-channels (list all)', async () => {
  const response = await fetch(`${API_BASE}/boundary-channels`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error}`);
  }
  
  if (!data.success) {
    throw new Error('Request failed');
  }
  
  console.log(`  Found ${data.count} boundary channels`);
  if (data.categories) {
    console.log(`  Categories: ${data.categories.join(', ')}`);
  }
});

// Test 2: Get California boundary channels
await runTest('GET /api/boundary-channels?regionId=US-CA', async () => {
  const response = await fetch(`${API_BASE}/boundary-channels?regionId=US-CA`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error}`);
  }
  
  if (!data.success) {
    throw new Error('Request failed');
  }
  
  console.log(`  Found ${data.count} channels for California`);
  data.channels.forEach(channel => {
    console.log(`    - ${channel.name} (${channel.candidates.length} candidates)`);
  });
  
  if (data.count !== 4) {
    throw new Error(`Expected 4 channels (N/S/E/W), got ${data.count}`);
  }
});

// Test 3: Get specific boundary channel (California North)
await runTest('GET /api/boundary-channels/boundary-US-CA-north', async () => {
  const response = await fetch(`${API_BASE}/boundary-channels/boundary-US-CA-north`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error}`);
  }
  
  if (!data.success) {
    throw new Error('Request failed');
  }
  
  console.log(`  Channel: ${data.channel.name}`);
  console.log(`  Category: ${data.channel.category}`);
  console.log(`  Candidates: ${data.channel.candidates.length}`);
  
  // Check for default "Current Boundary" candidate
  const hasDefault = data.channel.candidates.some(c => c.isDefault);
  if (!hasDefault) {
    throw new Error('No default "Current Boundary" candidate found');
  }
  
  console.log(`  ✓ Default "Current Boundary" candidate exists`);
});

// Test 4: Add a boundary proposal to California North border
let proposalCandidateId;
await runTest('POST /api/boundary-channels/boundary-US-CA-north/proposals', async () => {
  const proposalData = {
    title: 'Move Northern Border 10km North',
    description: 'Proposal to extend California territory northward by 10km to include additional natural resources.',
    userId: 'demo-user-1',
    action: 'modify',
    proposedBoundary: {
      type: 'LineString',
      coordinates: [
        [-124.4, 42.09], // 10km north of current border
        [-114.1, 42.09]
      ]
    },
    rationale: 'This change would include valuable watershed regions.'
  };
  
  const response = await fetch(`${API_BASE}/boundary-channels/boundary-US-CA-north/proposals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proposalData)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error}`);
  }
  
  if (!data.success) {
    throw new Error('Request failed');
  }
  
  proposalCandidateId = data.candidate.id;
  
  console.log(`  Created proposal as candidate: ${data.candidate.id}`);
  console.log(`  Title: ${data.candidate.name}`);
  console.log(`  Votes: ${data.candidate.votes}`);
  console.log(`  Type: ${data.candidate.type}`);
});

// Test 5: Verify proposal appears as candidate
await runTest('GET channel to see proposal candidate', async () => {
  const response = await fetch(`${API_BASE}/boundary-channels/boundary-US-CA-north`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error}`);
  }
  
  const proposalCandidate = data.channel.candidates.find(c => c.id === proposalCandidateId);
  
  if (!proposalCandidate) {
    throw new Error('Proposal candidate not found in channel');
  }
  
  console.log(`  Found proposal in candidates list`);
  console.log(`  Candidates (sorted by votes):`);
  data.channel.candidates.forEach((c, i) => {
    const marker = c.isDefault ? '🟢' : '🟡';
    console.log(`    ${i + 1}. ${marker} ${c.name} - ${c.votes} votes`);
  });
});

// Test 6: Vote on boundary proposal candidate
await runTest('POST /api/boundary-channels/boundary-US-CA-north/vote', async () => {
  const voteData = {
    candidateId: proposalCandidateId,
    userId: 'demo-user-1'
  };
  
  const response = await fetch(`${API_BASE}/boundary-channels/boundary-US-CA-north/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(voteData)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error}`);
  }
  
  if (!data.success) {
    throw new Error('Vote failed');
  }
  
  console.log(`  Vote recorded for candidate: ${data.candidateId}`);
  console.log(`  New vote count: ${data.newVoteCount}`);
  console.log(`  Channel total votes: ${data.channelTotalVotes}`);
});

// Test 7: Verify vote count updated
await runTest('Verify vote count increased', async () => {
  const response = await fetch(`${API_BASE}/boundary-channels/boundary-US-CA-north`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error}`);
  }
  
  const proposalCandidate = data.channel.candidates.find(c => c.id === proposalCandidateId);
  
  if (!proposalCandidate) {
    throw new Error('Proposal candidate not found');
  }
  
  if (proposalCandidate.votes !== 1) {
    throw new Error(`Expected 1 vote, got ${proposalCandidate.votes}`);
  }
  
  console.log(`  ✓ Vote count updated correctly: ${proposalCandidate.votes} vote(s)`);
});

// Test 8: Get active boundary for California
await runTest('GET /api/boundary-channels/region/US-CA/active-boundary', async () => {
  const response = await fetch(`${API_BASE}/boundary-channels/region/US-CA/active-boundary`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error}`);
  }
  
  if (!data.success) {
    throw new Error('Request failed');
  }
  
  console.log(`  Region: ${data.regionId}`);
  console.log(`  Active boundary type: ${data.boundary.type}`);
  console.log(`  Segments: ${Object.keys(data.boundary.segments).join(', ')}`);
  
  if (!data.boundary.segments.north) {
    throw new Error('North segment not found in active boundary');
  }
});

// Test 9: Get all categories
await runTest('GET /api/boundary-channels/categories', async () => {
  const response = await fetch(`${API_BASE}/boundary-channels/categories`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error}`);
  }
  
  if (!data.success) {
    throw new Error('Request failed');
  }
  
  console.log(`  Found ${data.categories.length} categories`);
  data.categories.forEach(cat => {
    console.log(`    - ${cat.name} (${cat.channelCount} channels)`);
  });
});

// ========================================
// Test Summary
// ========================================

console.log(`\n${colors.bold}${'='.repeat(50)}${colors.reset}`);
console.log(`${colors.bold}Tests Passed: ${testsPassed}${colors.reset}`);
console.log(`${colors.bold}Tests Failed: ${testsFailed}${colors.reset}`);
console.log(`${colors.bold}Total Tests: ${testsPassed + testsFailed}${colors.reset}`);
console.log(`${colors.bold}${'='.repeat(50)}${colors.reset}\n`);

if (testsFailed === 0) {
  console.log(`${colors.green}${colors.bold}🎉 All tests passed! Week 2 Day 1 implementation is working!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}${colors.bold}❌ Some tests failed. Check the output above.${colors.reset}\n`);
  process.exit(1);
}
