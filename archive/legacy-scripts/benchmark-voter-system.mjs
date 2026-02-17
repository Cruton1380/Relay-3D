#!/usr/bin/env node

/**
 * Voter System Benchmark
 * Tests performance at various scales
 */

import { performance } from 'perf_hooks';

// Mock storage implementations
class InMemoryStorage {
  constructor() {
    this.voters = new Map();
  }
  
  async addVoter(userId, data) {
    this.voters.set(userId, data);
  }
  
  async getVotersByCandidate(candidateId) {
    return Array.from(this.voters.values()).filter(v => v.candidateId === candidateId);
  }
  
  getMemoryUsage() {
    return process.memoryUsage().heapUsed / 1024 / 1024; // MB
  }
}

// Benchmark functions
async function benchmarkInsert(storage, count) {
  console.log(`\n📊 Benchmark: Insert ${count.toLocaleString()} voters`);
  
  const start = performance.now();
  const promises = [];
  
  for (let i = 0; i < count; i++) {
    promises.push(storage.addVoter(`voter_${i}`, {
      candidateId: 'candidate_1',
      lat: 37 + Math.random(),
      lng: -122 + Math.random(),
      privacyLevel: 'gps'
    }));
    
    if (promises.length >= 100) {
      await Promise.all(promises);
      promises.length = 0;
    }
  }
  
  await Promise.all(promises);
  
  const elapsed = performance.now() - start;
  const rate = count / (elapsed / 1000);
  
  console.log(`  ✅ Inserted ${count.toLocaleString()} voters in ${(elapsed/1000).toFixed(2)}s`);
  console.log(`  📈 Rate: ${rate.toFixed(0)} voters/sec`);
  console.log(`  💾 Memory: ${storage.getMemoryUsage().toFixed(1)} MB`);
  
  return { elapsed, rate, memory: storage.getMemoryUsage() };
}

async function benchmarkQuery(storage, candidateId, iterations = 100) {
  console.log(`\n📊 Benchmark: Query ${iterations} times`);
  
  const latencies = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await storage.getVotersByCandidate(candidateId);
    const elapsed = performance.now() - start;
    latencies.push(elapsed);
  }
  
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  
  console.log(`  ✅ Average latency: ${avg.toFixed(2)}ms`);
  console.log(`  📊 P95 latency: ${p95.toFixed(2)}ms`);
  console.log(`  📊 P99 latency: ${p99.toFixed(2)}ms`);
  
  return { avg, p95, p99 };
}

// Main benchmark suite
async function main() {
  console.log('🚀 Voter System Performance Benchmark\n');
  console.log('Testing in-memory storage at various scales...\n');
  
  const scales = [100, 1000, 10000, 50000, 100000];
  const results = [];
  
  for (const scale of scales) {
    const storage = new InMemoryStorage();
    
    const insertResult = await benchmarkInsert(storage, scale);
    const queryResult = await benchmarkQuery(storage, 'candidate_1', 100);
    
    results.push({
      scale,
      insertRate: insertResult.rate,
      memory: insertResult.memory,
      queryAvg: queryResult.avg,
      queryP95: queryResult.p95
    });
    
    // Memory check
    if (insertResult.memory > 2000) {
      console.log('\n⚠️  WARNING: Memory usage > 2GB, stopping benchmark');
      break;
    }
  }
  
  // Summary table
  console.log('\n📈 Performance Summary:\n');
  console.log('| Voters | Insert Rate | Memory | Query Avg | Query P95 | Status |');
  console.log('|--------|-------------|--------|-----------|-----------|--------|');
  
  for (const r of results) {
    const status = r.queryAvg < 100 ? '✅ Fast' : 
                   r.queryAvg < 1000 ? '⚠️  Slow' : '❌ Timeout';
    console.log(`| ${r.scale.toLocaleString().padEnd(6)} | ${r.insertRate.toFixed(0).padEnd(11)}/s | ${r.memory.toFixed(0).padEnd(6)} MB | ${r.queryAvg.toFixed(1).padEnd(9)} ms | ${r.queryP95.toFixed(1).padEnd(9)} ms | ${status} |`);
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:\n');
  
  const maxFastScale = results.filter(r => r.queryAvg < 100).pop();
  if (maxFastScale) {
    console.log(`✅ In-memory storage is FAST for up to ${maxFastScale.scale.toLocaleString()} voters`);
  }
  
  const maxWorkableScale = results.filter(r => r.queryAvg < 1000).pop();
  if (maxWorkableScale) {
    console.log(`⚠️  In-memory storage is USABLE for up to ${maxWorkableScale.scale.toLocaleString()} voters`);
  }
  
  if (results[results.length - 1].queryAvg > 1000) {
    console.log('❌ For >100k voters, you NEED PostgreSQL or Redis');
  }
  
  console.log('\n🎯 Recommendation: Use Path B (demo) for ≤10k voters, Path A (production) for >10k');
}

main().catch(console.error);

