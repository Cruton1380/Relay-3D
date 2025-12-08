/**
 * Atomic Vote Switching Test Suite
 * Tests the voting system to ensure proper vote switching without inflation
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api/vote';
const AUTH_API_BASE = 'http://localhost:3002/api/vote/authoritative';

class VoteSystemTestSuite {
  constructor() {
    this.testResults = [];
    this.testUserId = 'test-user-atomic-switch';
    this.testTopicId = 'general'; // Use existing channel
    this.testCandidates = ['catsrule399', 'catsrule478', 'catsrule649']; // Use existing candidates
  }

  /**
   * Log test result
   */
  logResult(testName, success, message, data = {}) {
    const result = {
      testName,
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${testName}: ${message}`);
    if (Object.keys(data).length > 0) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
  }

  /**
   * Submit a vote using the new atomic system
   */
  async submitVote(candidateId) {
    const voteData = {
      topic: this.testTopicId,
      choice: candidateId,
      voteType: 'candidate',
      signature: 'test-signature-atomic',
      publicKey: this.testUserId,
      nonce: Math.random().toString(36).substring(2, 15),
      timestamp: Date.now(),
      signatureScheme: 'ecdsa'
    };

    const response = await fetch(`${API_BASE}/submitVote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  }

  /**
   * Get authoritative vote totals
   */
  async getAuthoritativeVoteTotals() {
    const response = await fetch(`${AUTH_API_BASE}/topic/${this.testTopicId}/totals`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    return await response.json();
  }

  /**
   * Get user's current vote
   */
  async getUserVote() {
    const response = await fetch(`${AUTH_API_BASE}/user/${this.testUserId}/topic/${this.testTopicId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    return await response.json();
  }

  /**
   * Get reconciliation status
   */
  async getReconciliation() {
    const response = await fetch(`${AUTH_API_BASE}/topic/${this.testTopicId}/reconciliation`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    return await response.json();
  }

  /**
   * Test 1: First-time vote should increment total votes
   */
  async testFirstTimeVote() {
    try {
      // Get initial state
      const initialState = await this.getAuthoritativeVoteTotals();
      const initialTotal = initialState.data.totalVotes;
      const initialCandidateVotes = initialState.data.candidates[this.testCandidates[0]] || 0;

      // Submit first vote
      await this.submitVote(this.testCandidates[0]);

      // Check final state
      const finalState = await this.getAuthoritativeVoteTotals();
      const finalTotal = finalState.data.totalVotes;
      const finalCandidateVotes = finalState.data.candidates[this.testCandidates[0]] || 0;

      // Verify total votes increased by 1
      const totalIncreased = finalTotal === initialTotal + 1;
      const candidateIncreased = finalCandidateVotes === initialCandidateVotes + 1;

      if (totalIncreased && candidateIncreased) {
        this.logResult('First Time Vote', true, 'Total votes and candidate votes correctly incremented', {
          initialTotal,
          finalTotal,
          initialCandidateVotes,
          finalCandidateVotes
        });
      } else {
        this.logResult('First Time Vote', false, 'Vote counts not properly incremented', {
          initialTotal,
          finalTotal,
          initialCandidateVotes,
          finalCandidateVotes,
          totalIncreased,
          candidateIncreased
        });
      }
    } catch (error) {
      this.logResult('First Time Vote', false, `Error: ${error.message}`);
    }
  }

  /**
   * Test 2: Vote switching should not change total votes
   */
  async testVoteSwitching() {
    try {
      // Get initial state
      const initialState = await this.getAuthoritativeVoteTotals();
      const initialTotal = initialState.data.totalVotes;
      const initialCandidate1Votes = initialState.data.candidates[this.testCandidates[0]] || 0;
      const initialCandidate2Votes = initialState.data.candidates[this.testCandidates[1]] || 0;

      // Switch vote to second candidate
      await this.submitVote(this.testCandidates[1]);

      // Check final state
      const finalState = await this.getAuthoritativeVoteTotals();
      const finalTotal = finalState.data.totalVotes;
      const finalCandidate1Votes = finalState.data.candidates[this.testCandidates[0]] || 0;
      const finalCandidate2Votes = finalState.data.candidates[this.testCandidates[1]] || 0;

      // Verify total unchanged, candidate1 decreased, candidate2 increased
      const totalUnchanged = finalTotal === initialTotal;
      const candidate1Decreased = finalCandidate1Votes === initialCandidate1Votes - 1;
      const candidate2Increased = finalCandidate2Votes === initialCandidate2Votes + 1;

      if (totalUnchanged && candidate1Decreased && candidate2Increased) {
        this.logResult('Vote Switching', true, 'Vote switch completed without changing total votes', {
          totalVotes: { initial: initialTotal, final: finalTotal },
          candidate1: { initial: initialCandidate1Votes, final: finalCandidate1Votes },
          candidate2: { initial: initialCandidate2Votes, final: finalCandidate2Votes }
        });
      } else {
        this.logResult('Vote Switching', false, 'Vote switch failed to maintain total vote integrity', {
          totalUnchanged,
          candidate1Decreased,
          candidate2Increased,
          totalVotes: { initial: initialTotal, final: finalTotal },
          candidate1: { initial: initialCandidate1Votes, final: finalCandidate1Votes },
          candidate2: { initial: initialCandidate2Votes, final: finalCandidate2Votes }
        });
      }
    } catch (error) {
      this.logResult('Vote Switching', false, `Error: ${error.message}`);
    }
  }

  /**
   * Test 3: Re-voting for same candidate should be idempotent
   */
  async testIdempotentVote() {
    try {
      // Get initial state
      const initialState = await this.getAuthoritativeVoteTotals();
      const initialTotal = initialState.data.totalVotes;
      const initialCandidateVotes = initialState.data.candidates[this.testCandidates[1]] || 0;

      // Vote for same candidate again
      await this.submitVote(this.testCandidates[1]);

      // Check final state
      const finalState = await this.getAuthoritativeVoteTotals();
      const finalTotal = finalState.data.totalVotes;
      const finalCandidateVotes = finalState.data.candidates[this.testCandidates[1]] || 0;

      // Verify no changes
      const totalUnchanged = finalTotal === initialTotal;
      const candidateUnchanged = finalCandidateVotes === initialCandidateVotes;

      if (totalUnchanged && candidateUnchanged) {
        this.logResult('Idempotent Vote', true, 'Re-voting for same candidate had no effect (idempotent)', {
          totalVotes: initialTotal,
          candidateVotes: initialCandidateVotes
        });
      } else {
        this.logResult('Idempotent Vote', false, 'Re-voting for same candidate changed vote counts', {
          totalVotes: { initial: initialTotal, final: finalTotal },
          candidateVotes: { initial: initialCandidateVotes, final: finalCandidateVotes }
        });
      }
    } catch (error) {
      this.logResult('Idempotent Vote', false, `Error: ${error.message}`);
    }
  }

  /**
   * Test 4: Reconciliation should always pass
   */
  async testReconciliation() {
    try {
      const reconciliation = await this.getReconciliation();
      
      if (reconciliation.data.reconciliation.valid) {
        this.logResult('Reconciliation Check', true, 'Vote reconciliation passed', reconciliation.data.reconciliation);
      } else {
        this.logResult('Reconciliation Check', false, 'Vote reconciliation failed', reconciliation.data.reconciliation);
      }
    } catch (error) {
      this.logResult('Reconciliation Check', false, `Error: ${error.message}`);
    }
  }

  /**
   * Test 5: Rapid vote switching stress test
   */
  async testRapidSwitching() {
    try {
      const initialState = await this.getAuthoritativeVoteTotals();
      const initialTotal = initialState.data.totalVotes;

      // Rapidly switch between candidates
      for (let i = 0; i < 5; i++) {
        const candidateIndex = i % this.testCandidates.length;
        await this.submitVote(this.testCandidates[candidateIndex]);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      }

      const finalState = await this.getAuthoritativeVoteTotals();
      const finalTotal = finalState.data.totalVotes;

      // Verify total votes unchanged after rapid switching
      const totalUnchanged = finalTotal === initialTotal;

      if (totalUnchanged) {
        this.logResult('Rapid Vote Switching', true, 'Total votes remained constant during rapid switching', {
          initialTotal,
          finalTotal,
          switches: 5
        });
      } else {
        this.logResult('Rapid Vote Switching', false, 'Total votes changed during rapid switching', {
          initialTotal,
          finalTotal,
          difference: finalTotal - initialTotal
        });
      }
    } catch (error) {
      this.logResult('Rapid Vote Switching', false, `Error: ${error.message}`);
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting Atomic Vote Switching Test Suite...\n');

    await this.testFirstTimeVote();
    await this.testVoteSwitching();
    await this.testIdempotentVote();
    await this.testReconciliation();
    await this.testRapidSwitching();

    // Generate summary
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log('\n📊 Test Suite Summary:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`  - ${result.testName}: ${result.message}`);
        });
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: (passedTests / totalTests) * 100,
      results: this.testResults
    };
  }
}

// Export for use in Node.js
export { VoteSystemTestSuite };

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new VoteSystemTestSuite();
  testSuite.runAllTests().then(summary => {
    process.exit(summary.failedTests > 0 ? 1 : 0);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}
