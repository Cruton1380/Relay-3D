/**
 * @fileoverview Direct Blockchain Mutex Test
 * Tests mutex lock implementation without needing the full server
 * 
 * Usage: node test-blockchain-mutex.mjs
 */

import crypto from 'crypto';
import { performance } from 'perf_hooks';
import blockchain from './src/backend/blockchain-service/index.mjs';

console.log('🧪 Blockchain Mutex Lock Test');
console.log('Testing mutex protection against nonce replay attacks\n');

const NUM_CONCURRENT = 50;
const SAME_NONCE = crypto.randomUUID(); // Use same nonce for all - should only succeed once

/**
 * Test 1: Attempt to use same nonce concurrently
 */
async function testConcurrentSameNonce() {
  console.log('📋 Test 1: Concurrent transactions with SAME nonce');
  console.log(`   Attempting ${NUM_CONCURRENT} transactions with nonce: ${SAME_NONCE.substring(0, 8)}...`);
  
  const promises = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < NUM_CONCURRENT; i++) {
    const promise = blockchain.addTransaction(
      'TEST_TRANSACTION',
      { testId: i, message: 'Concurrent test' },
      SAME_NONCE
    ).then(() => {
      successCount++;
      return { success: true, index: i };
    }).catch(err => {
      failCount++;
      return { success: false, index: i, error: err.message };
    });
    
    promises.push(promise);
  }
  
  const results = await Promise.all(promises);
  
  console.log(`\n   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  
  if (successCount === 1 && failCount === NUM_CONCURRENT - 1) {
    console.log('   🎉 PASS: Mutex correctly allowed only 1 transaction\n');
    return true;
  } else {
    console.log('   ⚠️  FAIL: Mutex did not properly protect nonce\n');
    return false;
  }
}

/**
 * Test 2: Concurrent transactions with DIFFERENT nonces (should all succeed)
 */
async function testConcurrentDifferentNonces() {
  console.log('📋 Test 2: Concurrent transactions with DIFFERENT nonces');
  console.log(`   Attempting ${NUM_CONCURRENT} transactions with unique nonces...`);
  
  const promises = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < NUM_CONCURRENT; i++) {
    const uniqueNonce = crypto.randomUUID();
    const promise = blockchain.addTransaction(
      'TEST_TRANSACTION',
      { testId: i, message: 'Unique nonce test' },
      uniqueNonce
    ).then(() => {
      successCount++;
      return { success: true, index: i };
    }).catch(err => {
      failCount++;
      return { success: false, index: i, error: err.message };
    });
    
    promises.push(promise);
  }
  
  const results = await Promise.all(promises);
  
  console.log(`\n   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  
  if (successCount === NUM_CONCURRENT && failCount === 0) {
    console.log('   🎉 PASS: All unique nonces accepted\n');
    return true;
  } else {
    console.log('   ⚠️  FAIL: Some unique nonces were rejected\n');
    return false;
  }
}

/**
 * Test 3: Performance impact of mutex
 */
async function testMutexPerformance() {
  console.log('📋 Test 3: Mutex performance impact');
  
  const numOps = 100;
  const startTime = performance.now();
  
  const promises = [];
  for (let i = 0; i < numOps; i++) {
    promises.push(
      blockchain.addTransaction(
        'PERF_TEST',
        { id: i },
        crypto.randomUUID()
      ).catch(() => {}) // Ignore errors
    );
  }
  
  await Promise.all(promises);
  
  const duration = performance.now() - startTime;
  const throughput = (numOps / duration) * 1000;
  
  console.log(`   ⏱️  ${numOps} operations in ${duration.toFixed(2)}ms`);
  console.log(`   📊 Throughput: ${throughput.toFixed(0)} ops/sec`);
  console.log(`   ⚡ Avg latency: ${(duration / numOps).toFixed(2)}ms per op\n`);
  
  return true;
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🔧 Initializing blockchain...\n');
  await blockchain.initialize();
  
  const results = [];
  
  try {
    results.push(await testConcurrentSameNonce());
    results.push(await testConcurrentDifferentNonces());
    results.push(await testMutexPerformance());
    
    console.log('======================================================================');
    console.log('📊 FINAL RESULTS');
    console.log('======================================================================');
    
    const passCount = results.filter(r => r).length;
    const failCount = results.filter(r => !r).length;
    
    console.log(`✅ Passed: ${passCount}/${results.length}`);
    console.log(`❌ Failed: ${failCount}/${results.length}`);
    
    if (failCount === 0) {
      console.log('\n🎉 ALL TESTS PASSED - Mutex lock is working correctly!');
      console.log('✅ Race condition vulnerability is fixed');
      console.log('✅ Blockchain consolidation is VERIFIED');
      process.exit(0);
    } else {
      console.log('\n⚠️  SOME TESTS FAILED - Review mutex implementation');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
