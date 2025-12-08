/**
 * @fileoverview Concurrent Vote Stress Test
 * Tests mutex lock implementation under high concurrency load
 * 
 * Usage: node test-concurrent-votes-stress.mjs [numVotes]
 */

import crypto from 'crypto';
import { performance } from 'perf_hooks';

const API_BASE = process.env.API_BASE || 'http://localhost:3002';
const NUM_VOTES = parseInt(process.argv[2]) || 100;
const CONCURRENCY_BATCH = 20; // Submit 20 at a time

console.log('🧪 Concurrent Vote Stress Test');
console.log(`📊 Target: ${NUM_VOTES} votes`);
console.log(`⚡ Batch size: ${CONCURRENCY_BATCH} parallel requests\n`);

/**
 * Generate a vote signature (simplified for testing)
 */
function generateVoteSignature(voteData) {
  const hash = crypto.createHash('sha256').update(JSON.stringify(voteData)).digest('hex');
  // In real implementation, this would use Web Crypto API
  return {
    signature: 'test_sig_' + hash.substring(0, 20),
    publicKey: 'test_pub_' + crypto.randomBytes(16).toString('hex'),
    nonce: crypto.randomUUID(),
    voteHash: hash
  };
}

/**
 * Submit a single vote
 */
async function submitVote(voteId, topicId, candidateId) {
  const voteData = {
    topicId,
    candidateId,
    timestamp: Date.now()
  };
  
  const { signature, publicKey, nonce, voteHash } = generateVoteSignature(voteData);
  
  const startTime = performance.now();
  
  try {
    const response = await fetch(`${API_BASE}/api/vote/cast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-' + voteId
      },
      body: JSON.stringify({
        topicId,
        candidateId,
        voteType: 'FOR',
        signature,
        publicKey,
        nonce,
        location: {
          lat: 40.7128 + (Math.random() - 0.5) * 0.1,
          lng: -74.0060 + (Math.random() - 0.5) * 0.1
        },
        privacyLevel: 'province'
      })
    });
    
    const latency = performance.now() - startTime;
    const result = await response.json();
    
    return {
      success: response.ok,
      voteId,
      latency,
      transactionHash: result.transactionHash,
      error: result.error
    };
    
  } catch (error) {
    const latency = performance.now() - startTime;
    return {
      success: false,
      voteId,
      latency,
      error: error.message
    };
  }
}

/**
 * Run stress test in batches
 */
async function runStressTest() {
  const results = {
    total: NUM_VOTES,
    successful: 0,
    failed: 0,
    duplicateNonce: 0,
    latencies: [],
    errors: {},
    startTime: Date.now()
  };
  
  const topicId = 'stress-test-topic-' + Date.now();
  const candidateId = 'candidate-A';
  
  console.log(`⏱️  Starting stress test at ${new Date().toISOString()}\n`);
  
  // Submit votes in batches
  for (let batch = 0; batch < Math.ceil(NUM_VOTES / CONCURRENCY_BATCH); batch++) {
    const batchStart = batch * CONCURRENCY_BATCH;
    const batchEnd = Math.min(batchStart + CONCURRENCY_BATCH, NUM_VOTES);
    const batchSize = batchEnd - batchStart;
    
    console.log(`📦 Batch ${batch + 1}: Submitting ${batchSize} votes concurrently...`);
    
    const promises = [];
    for (let i = batchStart; i < batchEnd; i++) {
      promises.push(submitVote(i, topicId, candidateId));
    }
    
    const batchResults = await Promise.all(promises);
    
    // Process results
    for (const result of batchResults) {
      if (result.success) {
        results.successful++;
        results.latencies.push(result.latency);
      } else {
        results.failed++;
        
        // Track error types
        const errorType = result.error || 'unknown';
        results.errors[errorType] = (results.errors[errorType] || 0) + 1;
        
        if (errorType.includes('Nonce') || errorType.includes('nonce')) {
          results.duplicateNonce++;
        }
      }
    }
    
    // Progress update
    const successRate = ((results.successful / (batchEnd)) * 100).toFixed(1);
    console.log(`   ✅ ${results.successful}/${batchEnd} successful (${successRate}%)`);
    
    // Small delay between batches to avoid overwhelming server
    if (batch < Math.ceil(NUM_VOTES / CONCURRENCY_BATCH) - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  results.endTime = Date.now();
  results.totalDuration = results.endTime - results.startTime;
  
  return results;
}

/**
 * Calculate statistics
 */
function calculateStats(results) {
  const latencies = results.latencies.sort((a, b) => a - b);
  
  const stats = {
    totalVotes: results.total,
    successful: results.successful,
    failed: results.failed,
    successRate: ((results.successful / results.total) * 100).toFixed(2) + '%',
    duplicateNonceErrors: results.duplicateNonce,
    totalDuration: (results.totalDuration / 1000).toFixed(2) + 's',
    throughput: (results.successful / (results.totalDuration / 1000)).toFixed(2) + ' votes/sec',
    latency: {
      min: latencies.length > 0 ? latencies[0].toFixed(2) + 'ms' : 'N/A',
      max: latencies.length > 0 ? latencies[latencies.length - 1].toFixed(2) + 'ms' : 'N/A',
      mean: latencies.length > 0 ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2) + 'ms' : 'N/A',
      p50: latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.5)].toFixed(2) + 'ms' : 'N/A',
      p95: latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)].toFixed(2) + 'ms' : 'N/A',
      p99: latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.99)].toFixed(2) + 'ms' : 'N/A'
    },
    errors: results.errors
  };
  
  return stats;
}

/**
 * Print results
 */
function printResults(stats) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 STRESS TEST RESULTS');
  console.log('='.repeat(70));
  
  console.log('\n📈 Vote Metrics:');
  console.log(`   Total Votes:        ${stats.totalVotes}`);
  console.log(`   Successful:         ${stats.successful}`);
  console.log(`   Failed:             ${stats.failed}`);
  console.log(`   Success Rate:       ${stats.successRate}`);
  console.log(`   Duplicate Nonces:   ${stats.duplicateNonceErrors} ⚠️`);
  
  console.log('\n⏱️  Performance:');
  console.log(`   Total Duration:     ${stats.totalDuration}`);
  console.log(`   Throughput:         ${stats.throughput}`);
  
  console.log('\n📊 Latency Distribution:');
  console.log(`   Min:                ${stats.latency.min}`);
  console.log(`   Mean:               ${stats.latency.mean}`);
  console.log(`   P50 (Median):       ${stats.latency.p50}`);
  console.log(`   P95:                ${stats.latency.p95}`);
  console.log(`   P99:                ${stats.latency.p99}`);
  console.log(`   Max:                ${stats.latency.max}`);
  
  if (Object.keys(stats.errors).length > 0) {
    console.log('\n❌ Error Breakdown:');
    for (const [error, count] of Object.entries(stats.errors)) {
      console.log(`   ${error}: ${count}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Assessment
  if (stats.duplicateNonceErrors > 0) {
    console.log('⚠️  WARNING: Duplicate nonce errors detected!');
    console.log('   This indicates the mutex lock may not be working correctly.');
  } else {
    console.log('✅ SUCCESS: No duplicate nonce errors detected.');
    console.log('   Mutex lock is preventing race conditions correctly.');
  }
  
  const successPercent = parseFloat(stats.successRate);
  if (successPercent >= 95) {
    console.log('✅ PASS: Success rate above 95%');
  } else if (successPercent >= 80) {
    console.log('⚠️  WARNING: Success rate between 80-95%');
  } else {
    console.log('❌ FAIL: Success rate below 80%');
  }
  
  console.log('='.repeat(70) + '\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    const results = await runStressTest();
    const stats = calculateStats(results);
    printResults(stats);
    
    // Exit with appropriate code
    const successPercent = parseFloat(stats.successRate);
    if (successPercent >= 95 && stats.duplicateNonceErrors === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Stress test failed:', error);
    process.exit(1);
  }
}

main();
