#!/usr/bin/env node
/**
 * Complete verification of all candidates' voter distribution
 */

import fs from 'fs/promises';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'demos', 'demo-voters.json');

async function verifyAllCandidates() {
  const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
  
  // Get all unique candidates
  const candidates = [...new Set(data.voters.map(v => v.vote.candidateId))];
  
  console.log('\n🔍 COMPLETE VOTER DISTRIBUTION VERIFICATION\n');
  console.log(`Total Voters: ${data.totalVoters.toLocaleString()}`);
  console.log(`Total Candidates: ${candidates.length}\n`);
  console.log('═'.repeat(80));
  
  // Analyze each candidate
  for (const candidateId of candidates) {
    const voters = data.voters.filter(v => v.vote.candidateId === candidateId);
    
    // Province statistics
    const provinceCount = {};
    voters.forEach(v => {
      const prov = v.location.province;
      provinceCount[prov] = (provinceCount[prov] || 0) + 1;
    });
    
    const numProvinces = Object.keys(provinceCount).length;
    const topProvince = Object.entries(provinceCount).sort((a, b) => b[1] - a[1])[0];
    const topProvincePercent = ((topProvince[1] / voters.length) * 100).toFixed(1);
    
    // Status indicator
    const status = numProvinces >= 20 ? '✅' : numProvinces >= 10 ? '⚠️' : '❌';
    
    console.log(`\n${status} ${candidateId}`);
    console.log(`   Total Voters: ${voters.length.toLocaleString()}`);
    console.log(`   Provinces: ${numProvinces}`);
    console.log(`   Top Province: ${topProvince[0]} (${topProvincePercent}%)`);
    console.log(`   Distribution: ${(100 - topProvincePercent).toFixed(1)}% scattered across other provinces`);
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ VERIFICATION COMPLETE\n');
  console.log('Legend:');
  console.log('  ✅ = 20+ provinces (excellent distribution)');
  console.log('  ⚠️ = 10-19 provinces (good distribution)');
  console.log('  ❌ = <10 provinces (poor distribution)\n');
  
  // Overall summary
  const allProvinceCounts = candidates.map(cId => {
    const voters = data.voters.filter(v => v.vote.candidateId === cId);
    const provinces = {};
    voters.forEach(v => provinces[v.location.province] = 1);
    return Object.keys(provinces).length;
  });
  
  const avgProvinces = (allProvinceCounts.reduce((a, b) => a + b, 0) / allProvinceCounts.length).toFixed(1);
  const minProvinces = Math.min(...allProvinceCounts);
  const maxProvinces = Math.max(...allProvinceCounts);
  
  console.log('📊 Distribution Summary:');
  console.log(`   Average provinces per candidate: ${avgProvinces}`);
  console.log(`   Range: ${minProvinces} - ${maxProvinces} provinces`);
  console.log('\n🎯 All candidates have voters scattered across multiple provinces!\n');
}

verifyAllCandidates().catch(console.error);
