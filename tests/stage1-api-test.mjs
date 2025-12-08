/**
 * Stage 1 Test Script
 * Tests the boundary proposal API endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002';

// Color helpers
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI() {
    log('\n🧪 Stage 1: Boundary Proposals API Test Suite\n', 'blue');
    
    let testsPassed = 0;
    let testsFailed = 0;
    
    // Test 1: Get all proposals (should be empty initially)
    try {
        log('Test 1: GET /api/boundary-proposals', 'yellow');
        const response = await fetch(`${BASE_URL}/api/boundary-proposals`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.proposals)) {
            log(`✓ Pass: Found ${data.count} proposals`, 'green');
            testsPassed++;
        } else {
            log('✗ Fail: Invalid response format', 'red');
            testsFailed++;
        }
    } catch (error) {
        log(`✗ Fail: ${error.message}`, 'red');
        testsFailed++;
    }
    
    // Test 2: Create a boundary proposal
    let createdProposalId = null;
    try {
        log('\nTest 2: POST /api/boundary-proposals (create proposal)', 'yellow');
        const proposalData = {
            regionId: 'US-CA',
            regionType: 'state',
            action: 'modify',
            title: 'Adjust California Northern Border',
            description: 'Proposal to adjust the northern border of California by 2km',
            rationale: 'Historical boundary discrepancy needs correction',
            proposedBoundary: {
                type: 'Polygon',
                coordinates: [[
                    [-124.5, 42.1],
                    [-124.5, 32.5],
                    [-114.1, 32.5],
                    [-114.1, 42.1],
                    [-124.5, 42.1]
                ]]
            },
            proposedBy: 'test-user-1'
        };
        
        const response = await fetch(`${BASE_URL}/api/boundary-proposals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(proposalData)
        });
        
        const data = await response.json();
        
        if (data.success && data.proposal) {
            createdProposalId = data.proposal.id;
            log(`✓ Pass: Created proposal ${createdProposalId}`, 'green');
            log(`  Title: ${data.proposal.title}`, 'blue');
            log(`  Status: ${data.proposal.status}`, 'blue');
            testsPassed++;
        } else {
            log(`✗ Fail: ${data.error || 'Unknown error'}`, 'red');
            testsFailed++;
        }
    } catch (error) {
        log(`✗ Fail: ${error.message}`, 'red');
        testsFailed++;
    }
    
    // Test 3: Get specific proposal
    if (createdProposalId) {
        try {
            log(`\nTest 3: GET /api/boundary-proposals/${createdProposalId}`, 'yellow');
            const response = await fetch(`${BASE_URL}/api/boundary-proposals/${createdProposalId}`);
            const data = await response.json();
            
            if (data.success && data.proposal) {
                log(`✓ Pass: Retrieved proposal`, 'green');
                log(`  Votes For: ${data.proposal.votesFor}`, 'blue');
                log(`  Votes Against: ${data.proposal.votesAgainst}`, 'blue');
                testsPassed++;
            } else {
                log('✗ Fail: Could not retrieve proposal', 'red');
                testsFailed++;
            }
        } catch (error) {
            log(`✗ Fail: ${error.message}`, 'red');
            testsFailed++;
        }
    }
    
    // Test 4: Vote on proposal
    if (createdProposalId) {
        try {
            log(`\nTest 4: POST /api/boundary-proposals/${createdProposalId}/vote`, 'yellow');
            const voteData = {
                userId: 'test-user-2',
                voteValue: 'for',
                voterContext: {
                    regionId: 'US-CA',
                    isLocal: true
                }
            };
            
            const response = await fetch(`${BASE_URL}/api/boundary-proposals/${createdProposalId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(voteData)
            });
            
            const data = await response.json();
            
            if (data.success && data.vote) {
                log(`✓ Pass: Vote recorded`, 'green');
                log(`  Vote ID: ${data.vote.id}`, 'blue');
                log(`  Weight: ${data.vote.weight}`, 'blue');
                log(`  Updated Votes For: ${data.proposal.votesFor}`, 'blue');
                testsPassed++;
            } else {
                log(`✗ Fail: ${data.error || 'Unknown error'}`, 'red');
                testsFailed++;
            }
        } catch (error) {
            log(`✗ Fail: ${error.message}`, 'red');
            testsFailed++;
        }
    }
    
    // Test 5: Create bundle proposal
    let bundleId = null;
    try {
        log('\nTest 5: POST /api/boundary-proposals/bundle (multi-segment)', 'yellow');
        const bundleData = {
            segments: [
                {
                    regionId: 'US-CA',
                    regionType: 'state',
                    action: 'modify',
                    title: 'California Border Segment 1',
                    description: 'Northern segment adjustment',
                    proposedBoundary: {
                        type: 'Polygon',
                        coordinates: [[
                            [-124.5, 42.0],
                            [-124.5, 40.0],
                            [-122.0, 40.0],
                            [-122.0, 42.0],
                            [-124.5, 42.0]
                        ]]
                    },
                    proposedBy: 'test-user-1'
                },
                {
                    regionId: 'US-CA',
                    regionType: 'state',
                    action: 'modify',
                    title: 'California Border Segment 2',
                    description: 'Central segment adjustment',
                    proposedBoundary: {
                        type: 'Polygon',
                        coordinates: [[
                            [-122.0, 40.0],
                            [-122.0, 38.0],
                            [-120.0, 38.0],
                            [-120.0, 40.0],
                            [-122.0, 40.0]
                        ]]
                    },
                    proposedBy: 'test-user-1'
                }
            ]
        };
        
        const response = await fetch(`${BASE_URL}/api/boundary-proposals/bundle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bundleData)
        });
        
        const data = await response.json();
        
        if (data.success && data.bundleId) {
            bundleId = data.bundleId;
            log(`✓ Pass: Created bundle with ${data.totalCount} segments`, 'green');
            log(`  Bundle ID: ${bundleId}`, 'blue');
            testsPassed++;
        } else {
            log(`✗ Fail: ${data.error || 'Unknown error'}`, 'red');
            testsFailed++;
        }
    } catch (error) {
        log(`✗ Fail: ${error.message}`, 'red');
        testsFailed++;
    }
    
    // Test 6: Get bundle proposals
    if (bundleId) {
        try {
            log(`\nTest 6: GET /api/boundary-proposals/bundle/${bundleId}`, 'yellow');
            const response = await fetch(`${BASE_URL}/api/boundary-proposals/bundle/${bundleId}`);
            const data = await response.json();
            
            if (data.success && data.proposals) {
                log(`✓ Pass: Retrieved ${data.totalCount} proposals in bundle`, 'green');
                data.proposals.forEach((p, i) => {
                    log(`  Segment ${i + 1}: ${p.title} (${p.status})`, 'blue');
                });
                testsPassed++;
            } else {
                log('✗ Fail: Could not retrieve bundle', 'red');
                testsFailed++;
            }
        } catch (error) {
            log(`✗ Fail: ${error.message}`, 'red');
            testsFailed++;
        }
    }
    
    // Test 7: Test hierarchical voting (should fail for non-local voter)
    if (createdProposalId) {
        try {
            log(`\nTest 7: Test hierarchical voting eligibility`, 'yellow');
            const voteData = {
                userId: 'test-user-3',
                voteValue: 'for',
                voterContext: {
                    regionId: 'US-TX', // Different state
                    isLocal: false
                }
            };
            
            const response = await fetch(`${BASE_URL}/api/boundary-proposals/${createdProposalId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(voteData)
            });
            
            const data = await response.json();
            
            if (!data.success && data.error.includes('not eligible')) {
                log(`✓ Pass: Correctly rejected non-local voter`, 'green');
                log(`  Error: ${data.error}`, 'blue');
                testsPassed++;
            } else {
                log('✗ Fail: Should have rejected non-local voter', 'red');
                testsFailed++;
            }
        } catch (error) {
            log(`✗ Fail: ${error.message}`, 'red');
            testsFailed++;
        }
    }
    
    // Summary
    log('\n' + '='.repeat(50), 'blue');
    log(`Tests Passed: ${testsPassed}`, 'green');
    log(`Tests Failed: ${testsFailed}`, 'red');
    log(`Total Tests: ${testsPassed + testsFailed}`, 'blue');
    log('='.repeat(50) + '\n', 'blue');
    
    if (testsFailed === 0) {
        log('🎉 All tests passed! Stage 1 Week 1 Backend is working!\n', 'green');
    } else {
        log('⚠️  Some tests failed. Check the errors above.\n', 'yellow');
    }
}

// Run tests
testAPI().catch(error => {
    log(`\n❌ Test suite failed: ${error.message}\n`, 'red');
    process.exit(1);
});
