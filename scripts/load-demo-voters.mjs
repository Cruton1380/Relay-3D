#!/usr/bin/env node
/**
 * Load Demo Voters into User Location Service
 * 
 * This script:
 * 1. Reads demo-voters.json
 * 2. Loads voters into userLocationService
 * 3. Integrates with demo voting data in votingEngine
 * 4. Makes voter visualization immediately testable
 * 
 * Usage: node scripts/load-demo-voters.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load voters into user location service
 */
async function loadDemoVoters() {
  console.log('🚀 Loading demo voters into location service...\n');
  
  // Read demo voters
  const votersPath = path.join(process.cwd(), 'data', 'demos', 'demo-voters.json');
  
  let votersData;
  try {
    const votersContent = await fs.readFile(votersPath, 'utf8');
    votersData = JSON.parse(votersContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ demo-voters.json not found!');
      console.error('   Run: node scripts/generate-voters-with-locations.mjs');
      process.exit(1);
    }
    console.error('❌ Failed to read demo-voters.json:', error.message);
    process.exit(1);
  }
  
  if (!votersData.voters || !Array.isArray(votersData.voters)) {
    console.error('❌ Invalid voter data structure');
    process.exit(1);
  }
  
  console.log(`📋 Found ${votersData.totalVoters} voters`);
  console.log(`📊 Privacy distribution:`);
  console.log(`   GPS: ${votersData.privacyStats.gps}`);
  console.log(`   City: ${votersData.privacyStats.city}`);
  console.log(`   Province: ${votersData.privacyStats.province}`);
  console.log(`   Anonymous: ${votersData.privacyStats.anonymous}\n`);
  
  // Create user location data structure
  const userLocations = {};
  const userPrivacyLevels = {};
  
  for (const voter of votersData.voters) {
    userLocations[voter.userId] = {
      lat: voter.location.lat,
      lng: voter.location.lng,
      city: voter.location.city,
      province: voter.location.province,
      provinceCode: voter.location.provinceCode,
      country: voter.location.country,
      countryCode: voter.location.countryCode,
      updatedAt: Date.now()
    };
    
    userPrivacyLevels[voter.userId] = voter.privacyLevel;
  }
  
  // Save to user location service data file
  const locationDataPath = path.join(process.cwd(), 'data', 'users', 'locations.json');
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(locationDataPath), { recursive: true });
  
  await fs.writeFile(locationDataPath, JSON.stringify(userLocations, null, 2));
  console.log(`✅ Saved locations to: ${locationDataPath}`);
  
  // Save privacy levels
  const privacyDataPath = path.join(process.cwd(), 'data', 'users', 'privacy-levels.json');
  await fs.writeFile(privacyDataPath, JSON.stringify(userPrivacyLevels, null, 2));
  console.log(`✅ Saved privacy levels to: ${privacyDataPath}`);
  
  // Create vote mapping for easy lookup
  const votesByTopic = {};
  const votesByCandidate = {};
  
  for (const voter of votersData.voters) {
    const { topicId, candidateId } = voter.vote;
    
    if (!votesByTopic[topicId]) {
      votesByTopic[topicId] = [];
    }
    votesByTopic[topicId].push(voter.userId);
    
    const key = `${topicId}:${candidateId}`;
    if (!votesByCandidate[key]) {
      votesByCandidate[key] = [];
    }
    votesByCandidate[key].push(voter.userId);
  }
  
  // Save vote mappings for quick API access
  const voteMappingPath = path.join(process.cwd(), 'data', 'demos', 'vote-mappings.json');
  await fs.writeFile(voteMappingPath, JSON.stringify({
    votesByTopic,
    votesByCandidate
  }, null, 2));
  console.log(`✅ Saved vote mappings to: ${voteMappingPath}`);
  
  console.log(`\n🎉 Demo voters loaded successfully!`);
  console.log(`\n📝 What was created:`);
  console.log(`   1. ${Object.keys(userLocations).length} user locations`);
  console.log(`   2. ${Object.keys(userPrivacyLevels).length} privacy settings`);
  console.log(`   3. ${Object.keys(votesByTopic).length} topics with voter data`);
  console.log(`   4. ${Object.keys(votesByCandidate).length} candidate-voter mappings`);
  
  console.log(`\n✅ Ready to test!`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Start backend: node src/backend/server.mjs`);
  console.log(`   2. Open frontend: http://localhost:5175`);
  console.log(`   3. Hover over candidates on globe`);
  console.log(`   4. See green voter dots appear! 🎯`);
  
  // Print example API test
  const firstTopic = Object.keys(votesByTopic)[0];
  const firstCandidateKey = Object.keys(votesByCandidate)[0];
  const [exampleTopic, exampleCandidate] = firstCandidateKey.split(':');
  
  console.log(`\n🧪 Test API endpoint:`);
  console.log(`   curl "http://localhost:3002/api/visualization/voters/${exampleTopic}/candidate/${exampleCandidate}"`);
}

// Run the loader
loadDemoVoters().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
