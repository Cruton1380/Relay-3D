#!/usr/bin/env node
/**
 * Load Mock Voters for Current Channels
 * Generates voters directly for channels currently in the blockchain
 */

import { processVote } from '../src/backend/voting/votingEngine.mjs';
import { setMockUserLocation } from '../src/backend/services/userLocationService.mjs';
import { setUserPrivacyLevel } from '../src/backend/services/userPreferencesService.mjs';

async function loadVotersForCurrentChannels() {
  console.log('🚀 Loading voters for current channels...\n');
  
  // Fetch channels from API
  const response = await fetch('http://localhost:3002/api/channels');
  const data = await response.json();
  const channels = data.channels;
  
  console.log(`📋 Found ${channels.length} channel(s)\n`);
  
  const votersPerCandidate = 500;
  const granularityDistribution = [
    { type: 'gps', ratio: 0.40 },
    { type: 'city', ratio: 0.30 },
    { type: 'province', ratio: 0.20 },
    { type: 'anonymous', ratio: 0.10 }
  ];
  
  const stats = {
    gps: 0,
    city: 0,
    province: 0,
    anonymous: 0,
    totalVoters: 0,
    totalVotes: 0
  };
  
  for (const channel of channels) {
    console.log(`📍 Processing channel: ${channel.name}`);
    console.log(`   Channel ID: ${channel.channelId}`);
    console.log(`   Candidates: ${channel.candidates.length}\n`);
    
    for (const candidate of channel.candidates) {
      console.log(`   → Candidate: ${candidate.name}`);
      
      const centerLat = candidate.location?.lat || candidate.location?.latitude || 0;
      const centerLng = candidate.location?.lng || candidate.location?.longitude || 0;
      const country = candidate.countryName || candidate.location?.country || 'Demo Country';
      const countryCode = channel.countryCode || candidate.location?.countryCode || 'US';
      const province = candidate.province || candidate.location?.province || 'Demo Province';
      const provinceCode = candidate.location?.provinceCode || 'DEMO_PROV';
      
      for (let i = 0; i < votersPerCandidate; i++) {
        // Determine data granularity
        const rand = Math.random();
        let dataGranularity = 'country';
        let cumulative = 0;
        for (const { type, ratio } of granularityDistribution) {
          cumulative += ratio;
          if (rand < cumulative) {
            dataGranularity = type;
            break;
          }
        }
        
        stats[dataGranularity]++;
        stats.totalVoters++;
        
        // Generate unique user ID
        const userId = `mock_voter_${candidate.candidateId || candidate.id}_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Generate location within bounds (±2 degrees from center)
        const lat = centerLat + (Math.random() * 4 - 2);
        const lng = centerLng + (Math.random() * 4 - 2);
        
        // Build location object based on granularity
        const location = {
          country,
          countryCode,
          verificationMethod: dataGranularity === 'gps' ? 'gps' : 'declared'
        };
        
        if (dataGranularity === 'gps' || dataGranularity === 'city' || dataGranularity === 'province') {
          location.province = province;
          location.provinceCode = provinceCode;
        }
        
        if (dataGranularity === 'gps' || dataGranularity === 'city') {
          location.city = 'Demo City';
          location.cityCode = 'DEMO_CITY';
        }
        
        if (dataGranularity === 'gps') {
          location.lat = lat;
          location.lng = lng;
        }
        
        try {
          // Store user location in location service
          setMockUserLocation(userId, location);
          
          // Store user privacy preference
          await setUserPrivacyLevel(userId, dataGranularity);
          
          // Cast vote in voting system
          await processVote(
            userId,
            channel.channelId || channel.id,
            'FOR', // voteType
            candidate.candidateId || candidate.id,
            0.85 + (Math.random() * 0.15), // reliability
            {
              metadata: {
                source: 'mock-voter-generator',
                dataGranularity
              }
            }
          );
          
          stats.totalVotes++;
          
        } catch (error) {
          console.error(`      ❌ Error creating voter: ${error.message}`);
        }
      }
      
      console.log(`      ✅ Created ${votersPerCandidate} voters\n`);
    }
  }
  
  console.log(`\n🎉 Voter loading complete!`);
  console.log(`\n📊 Statistics:`);
  console.log(`   Total Voters: ${stats.totalVoters}`);
  console.log(`   Total Votes: ${stats.totalVotes}`);
  console.log(`   GPS: ${stats.gps} (${((stats.gps/stats.totalVoters)*100).toFixed(1)}%)`);
  console.log(`   City: ${stats.city} (${((stats.city/stats.totalVoters)*100).toFixed(1)}%)`);
  console.log(`   Province: ${stats.province} (${((stats.province/stats.totalVoters)*100).toFixed(1)}%)`);
  console.log(`   Anonymous: ${stats.anonymous} (${((stats.anonymous/stats.totalVoters)*100).toFixed(1)}%)`);
  
  console.log(`\n✅ Ready to test!`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Refresh your frontend (F5)`);
  console.log(`   2. Hover over a candidate on the globe`);
  console.log(`   3. See voter towers appear! 🎯\n`);
}

// Run the loader
loadVotersForCurrentChannels().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

