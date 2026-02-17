#!/usr/bin/env node
/**
 * Vote Count Verification Script
 * Audits all channel files to ensure vote count integrity
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function auditVoteCounts() {
  console.log('🔍 Relay Vote Count Audit\n');
  console.log('='.repeat(80));
  
  // Read channels from data directory
  const dataDir = path.join(projectRoot, 'data', 'channels');
  
  if (!fs.existsSync(dataDir)) {
    console.log('❌ No data/channels directory found');
    console.log(`   Expected: ${dataDir}`);
    return;
  }
  
  const files = fs.readdirSync(dataDir);
  const channelFiles = files.filter(f => f.endsWith('.json'));
  
  console.log(`\n📁 Found ${channelFiles.length} channel files\n`);
  
  if (channelFiles.length === 0) {
    console.log('ℹ️  No channel files to audit');
    return;
  }
  
  let totalChannels = 0;
  let totalCandidates = 0;
  let totalVotesAcrossAll = 0;
  const channelSummaries = [];
  const coordinateStats = {
    usa: 0,
    uk: 0,
    france: 0,
    japan: 0,
    australia: 0,
    other: 0
  };
  
  for (const file of channelFiles) {
    const filePath = path.join(dataDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const channel = JSON.parse(content);
    
    if (!channel.candidates || !Array.isArray(channel.candidates)) {
      console.log(`⚠️  ${file}: No candidates array`);
      continue;
    }
    
    totalChannels++;
    const candidateCount = channel.candidates.length;
    totalCandidates += candidateCount;
    
    // Calculate votes per candidate using different methods
    const voteMethods = {
      votesOnly: 0,
      testVotesOnly: 0,
      realVotesOnly: 0,
      votesSum: 0,
      tripleCount: 0
    };
    
    const candidateVotes = [];
    const coordinates = [];
    
    channel.candidates.forEach((candidate, idx) => {
      const votes = candidate.votes || 0;
      const testVotes = candidate.testVotes || 0;
      const realVotes = candidate.realVotes || 0;
      
      voteMethods.votesOnly += votes;
      voteMethods.testVotesOnly += testVotes;
      voteMethods.realVotesOnly += realVotes;
      voteMethods.votesSum += votes;
      voteMethods.tripleCount += testVotes + realVotes + votes;
      
      candidateVotes.push({ name: candidate.name, votes, testVotes, realVotes });
      
      // Track coordinates
      if (candidate.location) {
        const lat = candidate.location.lat || candidate.location.latitude;
        const lng = candidate.location.lng || candidate.location.longitude;
        
        if (lat && lng) {
          coordinates.push({ lat, lng, name: candidate.name });
          
          // Classify by region
          if (lat >= 38 && lat <= 45 && lng >= -80 && lng <= -71) {
            coordinateStats.usa++;
          } else if (lat >= 49.9 && lat <= 55.8 && lng >= -6.4 && lng <= 1.8) {
            coordinateStats.uk++;
          } else if (lat >= 42.3 && lat <= 51.1 && lng >= -4.8 && lng <= 8.2) {
            coordinateStats.france++;
          } else if (lat >= 24 && lat <= 45.5 && lng >= 123 && lng <= 154) {
            coordinateStats.japan++;
          } else if (lat >= -38 && lat <= -28 && lng >= 141 && lng <= 154) {
            coordinateStats.australia++;
          } else {
            coordinateStats.other++;
          }
        }
      }
    });
    
    totalVotesAcrossAll += voteMethods.votesSum;
    
    channelSummaries.push({
      name: channel.name,
      file: file,
      candidateCount: candidateCount,
      voteMethods: voteMethods,
      candidateVotes: candidateVotes,
      coordinates: coordinates
    });
  }
  
  // Print detailed channel breakdown
  console.log('\n📊 CHANNEL VOTE BREAKDOWN\n');
  console.log('='.repeat(80));
  
  channelSummaries.forEach(summary => {
    console.log(`\n🎯 ${summary.name}`);
    console.log(`   File: ${summary.file}`);
    console.log(`   Candidates: ${summary.candidateCount}`);
    console.log(`   Coordinates: ${summary.coordinates.length} with location data`);
    console.log(`\n   Vote Calculations:`);
    console.log(`     - votes only:        ${summary.voteMethods.votesOnly.toLocaleString()} votes`);
    console.log(`     - testVotes only:    ${summary.voteMethods.testVotesOnly.toLocaleString()} votes`);
    console.log(`     - realVotes only:    ${summary.voteMethods.realVotesOnly.toLocaleString()} votes`);
    console.log(`     - Correct sum:       ${summary.voteMethods.votesSum.toLocaleString()} votes`);
    console.log(`     - Triple count (BAD): ${summary.voteMethods.tripleCount.toLocaleString()} votes`);
    
    // Check for discrepancies
    const issues = [];
    
    if (summary.voteMethods.votesOnly !== summary.voteMethods.testVotesOnly && summary.voteMethods.testVotesOnly > 0) {
      issues.push(`votes (${summary.voteMethods.votesOnly}) != testVotes (${summary.voteMethods.testVotesOnly})`);
    }
    
    if (summary.voteMethods.tripleCount > summary.voteMethods.votesSum * 1.5) {
      issues.push(`TRIPLE COUNTING: ${summary.voteMethods.tripleCount} (should be ${summary.voteMethods.votesSum})`);
    }
    
    if (Math.abs(summary.voteMethods.votesSum - 10000) > 100) {
      issues.push(`Total votes (${summary.voteMethods.votesSum}) != expected 10,000`);
    }
    
    if (summary.coordinates.length !== summary.candidateCount) {
      issues.push(`Missing coordinates: ${summary.candidateCount - summary.coordinates.length} candidates without location`);
    }
    
    if (issues.length > 0) {
      console.log(`\n   ⚠️  ISSUES DETECTED:`);
      issues.forEach(issue => console.log(`      - ${issue}`));
    } else {
      console.log(`\n   ✅ No issues detected`);
    }
    
    // Show top 5 candidates
    const topCandidates = summary.candidateVotes
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);
    
    console.log(`\n   Top 5 Candidates:`);
    topCandidates.forEach((c, idx) => {
      console.log(`      ${idx + 1}. ${c.name}: ${c.votes.toLocaleString()} votes`);
    });
  });
  
  // Print geographic distribution
  console.log('\n\n' + '='.repeat(80));
  console.log('🌍 GEOGRAPHIC DISTRIBUTION');
  console.log('='.repeat(80));
  console.log(`\nCandidates by Region:`);
  console.log(`  USA (New York):        ${coordinateStats.usa} candidates`);
  console.log(`  UK (England):          ${coordinateStats.uk} candidates`);
  console.log(`  France (Île-de-France): ${coordinateStats.france} candidates`);
  console.log(`  Japan (Tokyo):         ${coordinateStats.japan} candidates`);
  console.log(`  Australia (NSW):       ${coordinateStats.australia} candidates`);
  console.log(`  Other/Unknown:         ${coordinateStats.other} candidates`);
  
  const totalWithCoords = Object.values(coordinateStats).reduce((a, b) => a + b, 0);
  console.log(`\nTotal candidates with coordinates: ${totalWithCoords} / ${totalCandidates}`);
  
  if (totalWithCoords < totalCandidates) {
    console.log(`⚠️  ${totalCandidates - totalWithCoords} candidates missing coordinate data`);
  }
  
  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📈 OVERALL SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal Channels: ${totalChannels}`);
  console.log(`Total Candidates: ${totalCandidates}`);
  console.log(`Total Votes (correct): ${totalVotesAcrossAll.toLocaleString()}`);
  
  if (totalChannels > 0) {
    console.log(`\nAverages:`);
    console.log(`  Candidates per Channel: ${(totalCandidates / totalChannels).toFixed(1)}`);
    console.log(`  Votes per Channel: ${(totalVotesAcrossAll / totalChannels).toLocaleString()}`);
  }
  
  if (totalCandidates > 0) {
    console.log(`  Votes per Candidate: ${(totalVotesAcrossAll / totalCandidates).toFixed(0)}`);
  }
  
  // Expected total validation
  const expectedTotal = totalChannels * 10000;
  console.log(`\nVote Count Validation:`);
  console.log(`  Expected Total (${totalChannels} × 10,000): ${expectedTotal.toLocaleString()}`);
  console.log(`  Actual Total: ${totalVotesAcrossAll.toLocaleString()}`);
  console.log(`  Difference: ${(totalVotesAcrossAll - expectedTotal).toLocaleString()}`);
  
  if (Math.abs(totalVotesAcrossAll - expectedTotal) < 100) {
    console.log(`  ✅ Vote count matches expected total`);
  } else {
    console.log(`  ⚠️  Vote count discrepancy detected`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Audit Complete\n');
}

// Run audit
auditVoteCounts().catch(error => {
  console.error('\n❌ Audit failed:', error);
  process.exit(1);
});
