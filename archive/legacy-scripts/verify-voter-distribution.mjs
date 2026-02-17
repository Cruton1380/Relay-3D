#!/usr/bin/env node
/**
 * Verify voter distribution across provinces
 */

import fs from 'fs/promises';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'demos', 'demo-voters.json');

async function verifyDistribution() {
  const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
  
  // Get first candidate's voters
  const candidateId = 'candidate-sf-001';
  const voters = data.voters.filter(v => v.vote.candidateId === candidateId);
  
  console.log(`\n🔍 Checking voter distribution for ${candidateId}`);
  console.log(`   Total voters: ${voters.length}\n`);
  
  // Show first 25 voters
  console.log('📊 Sample of 25 voters:\n');
  voters.slice(0, 25).forEach((v, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${v.displayName.padEnd(20)} | ${v.location.city.padEnd(15)} | ${v.location.province.padEnd(30)} | (${v.location.provinceCode})`);
  });
  
  // Province statistics
  console.log('\n📈 Province distribution:');
  const provinceCount = {};
  voters.forEach(v => {
    const prov = v.location.province;
    provinceCount[prov] = (provinceCount[prov] || 0) + 1;
  });
  
  const sortedProvinces = Object.entries(provinceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  
  sortedProvinces.forEach(([province, count]) => {
    const percentage = ((count / voters.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(percentage / 2));
    console.log(`   ${province.padEnd(35)} ${String(count).padStart(5)} (${percentage.padStart(5)}%) ${bar}`);
  });
  
  console.log(`\n✅ Voters are distributed across ${Object.keys(provinceCount).length} different provinces!\n`);
}

verifyDistribution().catch(console.error);
