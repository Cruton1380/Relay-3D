// backend/tests/constitutionalLocks.test.mjs
/**
 * Constitutional Lock Integration Tests
 * 
 * These tests verify that Principles 1, 4, and 6 are mechanically enforced.
 * 
 * Test Suite:
 * 1. Dialogue cannot change state (Principle 1)
 * 2. State transitions require valid authority (Principle 4)
 * 3. Expired authority is refused (Principle 4)
 * 4. Revoked authority is refused (Principle 4)
 * 5. Missing evidence for COMMIT is refused (Principle 1)
 * 6. INDETERMINATE prevents action (Principle 6)
 */

import { Router } from 'express';
import { validateStateTransition, canTransition } from '../commitTypes/stateTransition.mjs';
import { validateDialogue } from '../commitTypes/dialogue.mjs';
import { canCommitChangeState } from '../governance/noDialogueStateChange.mjs';
import {
  resolveAuthority,
  hasCapability,
  initializeAvgolAuthorities
} from '../governance/authorityResolver.mjs';
import {
  createStateAwareValue,
  canUseForAction
} from '../utils/stateCalculator.mjs';

// Test results accumulator
const testResults = [];

/**
 * Run a test and record result
 * @param {string} name - Test name
 * @param {Function} testFn - Test function (returns boolean)
 * @param {string} principle - Which principle is being tested
 */
function runTest(name, testFn, principle) {
  try {
    const result = testFn();
    const passed = typeof result === 'boolean' ? result : result.passed;
    
    testResults.push({
      test: name,
      principle,
      passed,
      result: typeof result === 'object' ? result : { passed },
      timestamp: new Date().toISOString()
    });
    
    console.log(`[TEST] ${passed ? '✓' : '✗'} ${name}`);
    
    return passed;
  } catch (error) {
    testResults.push({
      test: name,
      principle,
      passed: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    console.error(`[TEST] ✗ ${name} - ERROR:`, error.message);
    return false;
  }
}

/**
 * TEST 1: DIALOGUE cannot change state (Principle 1)
 */
function test1_DialogueCannotChangeState() {
  const dialogueCommit = {
    type: 'DIALOGUE',
    content_hash: 'test_hash',
    timestamp_ms: Date.now(),
    context_ref: 'test_context',
    participant_ids: ['user:1', 'user:2']
  };
  
  const validation = canCommitChangeState(dialogueCommit);
  
  // Should be REFUSED
  return !validation.allowed && validation.reason.includes('DIALOGUE_CANNOT_MUTATE_STATE');
}

/**
 * TEST 2: STATE_TRANSITION with fake authority → 403 (Principle 4)
 */
function test2_FakeAuthorityRefused() {
  const commitHistory = initializeAvgolAuthorities();
  
  const fakeAuthRef = 'user:nonexistent_user';
  const requiredCapability = 'STATE_TRANSITION:PURCHASE_ORDER:APPROVE';
  
  const authCheck = hasCapability(fakeAuthRef, requiredCapability, null, commitHistory);
  
  // Should be REFUSED
  return !authCheck.authorized && authCheck.reason.includes('AUTHORITY_NOT_DISCOVERABLE');
}

/**
 * TEST 3: STATE_TRANSITION with real authority but missing capability → 403 (Principle 4)
 */
function test3_MissingCapabilityRefused() {
  const commitHistory = initializeAvgolAuthorities();
  
  // Buyer has DRAFT and PROPOSE, but NOT APPROVE
  const buyerAuthRef = 'role:buyer_maxwell';
  const requiredCapability = 'STATE_TRANSITION:PURCHASE_ORDER:APPROVE'; // Needs manager
  
  const authCheck = hasCapability(buyerAuthRef, requiredCapability, null, commitHistory);
  
  // Should be REFUSED
  return !authCheck.authorized && authCheck.reason.includes('AUTHORITY_CAPABILITY_MISSING');
}

/**
 * TEST 4: Expired authority → 403 (Principle 4)
 */
function test4_ExpiredAuthorityRefused() {
  const expiredGrant = {
    type: 'AUTHORITY_GRANT',
    commit_id: 'grant_expired_123',
    scope: 'test.scope',
    capabilities: ['STATE_TRANSITION:TEST:ACTION'],
    grantee_id: 'user:test',
    grantor_authority_ref: 'custody:root',
    evidence_refs: [],
    effective_from_ms: Date.now() - (48 * 60 * 60 * 1000), // 2 days ago
    expires_at_ms: Date.now() - (24 * 60 * 60 * 1000), // Expired yesterday
    timestamp_ms: Date.now() - (48 * 60 * 60 * 1000),
    signature: 'test-sig'
  };
  
  const resolution = resolveAuthority('user:test', [expiredGrant]);
  
  // Should be REFUSED
  return !resolution.valid && resolution.reason.includes('EXPIRED_OR_REVOKED');
}

/**
 * TEST 5: Missing evidence for COMMIT → refusal (Principle 1)
 */
function test5_MissingEvidenceRefused() {
  const transitionCheck = canTransition(
    'PROPOSE',
    'COMMIT',
    'user:123',
    [] // No evidence refs (REQUIRED for COMMIT)
  );
  
  // Should be REFUSED
  return !transitionCheck.canTransition && transitionCheck.reason.includes('evidence');
}

/**
 * TEST 6: INDETERMINATE prevents action (Principle 6)
 */
function test6_IndeterminatePreventsAction() {
  const indeterminateKPI = createStateAwareValue({
    value: 0.75,
    confidence: 0.3, // Low confidence
    missing_inputs: ['vendor_documentation', 'competitive_quotes'],
    insufficient_data: true,
    method: 'policy_compliance',
    policy_ref: 'procurement_v1'
  });
  
  const actionCheck = canUseForAction(indeterminateKPI, 0.8);
  
  // Should be REFUSED
  return indeterminateKPI.state === 'INDETERMINATE' && !actionCheck.can_use;
}

/**
 * TEST 7: Valid authority with capability → allowed (Principle 4)
 */
function test7_ValidAuthorityAllowed() {
  const commitHistory = initializeAvgolAuthorities();
  
  const managerAuthRef = 'role:procurement_manager';
  const requiredCapability = 'STATE_TRANSITION:PURCHASE_ORDER:APPROVE';
  
  const authCheck = hasCapability(managerAuthRef, requiredCapability, null, commitHistory);
  
  // Should be ALLOWED
  return authCheck.authorized === true;
}

/**
 * TEST 8: STATE_TRANSITION with valid authority and evidence → allowed (Principles 1 + 4)
 */
function test8_ValidTransitionAllowed() {
  const commitHistory = initializeAvgolAuthorities();
  
  // Check state transition logic
  const transitionCheck = canTransition(
    'PROPOSE',
    'COMMIT',
    'role:procurement_manager',
    ['commit:vendor_approval_123', 'commit:budget_check_456'] // Has evidence
  );
  
  // Check authority
  const authCheck = hasCapability(
    'role:procurement_manager',
    'STATE_TRANSITION:PURCHASE_ORDER:COMMIT',
    null,
    commitHistory
  );
  
  // Both should pass
  return transitionCheck.canTransition && authCheck.authorized;
}

/**
 * Run all constitutional lock tests
 * @returns {Object} - Test results summary
 */
export function runAllConstitutionalTests() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('CONSTITUTIONAL LOCK TESTS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  testResults.length = 0; // Clear previous results
  
  runTest('Test 1: DIALOGUE cannot change state', test1_DialogueCannotChangeState, 'Principle 1');
  runTest('Test 2: Fake authority → 403', test2_FakeAuthorityRefused, 'Principle 4');
  runTest('Test 3: Missing capability → 403', test3_MissingCapabilityRefused, 'Principle 4');
  runTest('Test 4: Expired authority → 403', test4_ExpiredAuthorityRefused, 'Principle 4');
  runTest('Test 5: Missing evidence for COMMIT → refusal', test5_MissingEvidenceRefused, 'Principle 1');
  runTest('Test 6: INDETERMINATE prevents action', test6_IndeterminatePreventsAction, 'Principle 6');
  runTest('Test 7: Valid authority → allowed', test7_ValidAuthorityAllowed, 'Principle 4');
  runTest('Test 8: Valid transition with auth + evidence → allowed', test8_ValidTransitionAllowed, 'Principles 1+4');
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`RESULTS: ${passedTests}/${totalTests} passed`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    all_passed: failedTests === 0,
    results: testResults
  };
}

/**
 * Express endpoint for running tests
 * GET /api/tests/constitutional
 */
export function createTestEndpoint() {
  const router = Router();
  
  router.get('/constitutional', (req, res) => {
    const results = runAllConstitutionalTests();
    
    res.status(results.all_passed ? 200 : 500).json({
      ...results,
      message: results.all_passed 
        ? 'All constitutional locks are enforced ✓' 
        : 'Some constitutional locks failed ✗'
    });
  });
  
  return router;
}

// Run tests if this module is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllConstitutionalTests();
}

export default {
  runAllConstitutionalTests,
  createTestEndpoint,
  testResults
};
