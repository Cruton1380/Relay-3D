#!/usr/bin/env node
/**
 * Generate Voters Matching Vote Counts
 * Creates actual voters to back the simulated vote counts in the system
 * This makes the vote counter backed by real voter data
 */

import { setMockUserLocation, initLocationService } from '../src/backend/services/userLocationService.mjs';
import { setUserPrivacyLevel, initPreferencesService } from '../src/backend/services/userPreferencesService.mjs';
import { processVote } from '../src/backend/voting/votingEngine.mjs';

async function generateVotersMatchingVoteCounts() {
  console.log('🚀 Generating voters to match existing vote counts...\n');
  
  // Initialize services
  console.log('🔧 Initializing services...');
  await initLocationService();
  await initPreferencesService();
  console.log('✅ Services initialized\n');
  
  // Fetch channels and their vote counts from API
  const channelsResponse = await fetch('http://localhost:3002/api/channels');
  const channelsData = await channelsResponse.json();
  const channels = channelsData.channels;
  
  console.log(`📋 Found ${channels.length} channel(s)\n`);
  
  // Privacy level distribution (matches your system design)
  const granularityDistribution = [
    { type: 'gps', ratio: 0.40 },      // 40% GPS - visible green towers
    { type: 'city', ratio: 0.30 },     // 30% City - visible green towers
    { type: 'province', ratio: 0.20 }, // 20% Province - hidden gray towers
    { type: 'anonymous', ratio: 0.10 } // 10% Anonymous - not displayed
  ];
  
  const stats = {
    gps: 0,
    city: 0,
    province: 0,
    anonymous: 0,
    totalVoters: 0,
    totalVotes: 0,
    channelsProcessed: 0,
    candidatesProcessed: 0
  };
  
  for (const channel of channels) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📍 CHANNEL: ${channel.name}`);
    console.log(`   ID: ${channel.channelId}`);
    console.log(`   Candidates: ${channel.candidates.length}`);
    console.log(`${'='.repeat(80)}\n`);
    
    for (const candidate of channel.candidates) {
      // Get the actual vote count for this candidate
      const voteCount = candidate.votes || candidate.initialVotes || 0;
      
      if (voteCount === 0) {
        console.log(`   ⚠️  ${candidate.name}: 0 votes - skipping`);
        continue;
      }
      
      console.log(`   🎯 ${candidate.name}: ${voteCount.toLocaleString()} votes`);
      console.log(`      Generating ${voteCount.toLocaleString()} voters...`);
      
      const centerLat = candidate.location?.lat || candidate.location?.latitude || 0;
      const centerLng = candidate.location?.lng || candidate.location?.longitude || 0;
      const country = candidate.countryName || candidate.location?.country || 'Demo Country';
      const countryCode = channel.countryCode || candidate.location?.countryCode || 'US';
      const province = candidate.province || candidate.location?.province || 'Demo Province';
      const provinceCode = candidate.location?.provinceCode || 'DEMO_PROV';
      
      let votersCreated = 0;
      let errors = 0;
      
      // Generate voters in batches to show progress
      const batchSize = 100;
      const totalBatches = Math.ceil(voteCount / batchSize);
      
      for (let batch = 0; batch < totalBatches; batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min((batch + 1) * batchSize, voteCount);
        const batchCount = batchEnd - batchStart;
        
        for (let i = batchStart; i < batchEnd; i++) {
          // Determine privacy level based on distribution
          const rand = Math.random();
          let dataGranularity = 'anonymous';
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
          const userId = `voter_${channel.channelId}_${candidate.candidateId || candidate.id}_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Generate location within realistic bounds
          // GPS: tight cluster (±0.5 degrees ~55km)
          // City: medium spread (±1 degree ~111km)
          // Province: wide spread (±2 degrees ~222km)
          let latSpread, lngSpread;
          switch (dataGranularity) {
            case 'gps':
              latSpread = 0.5;
              lngSpread = 0.5;
              break;
            case 'city':
              latSpread = 1.0;
              lngSpread = 1.0;
              break;
            case 'province':
              latSpread = 2.0;
              lngSpread = 2.0;
              break;
            default:
              latSpread = 3.0;
              lngSpread = 3.0;
          }
          
          const lat = centerLat + (Math.random() * 2 - 1) * latSpread;
          const lng = centerLng + (Math.random() * 2 - 1) * lngSpread;
          
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
            location.city = `City_${Math.floor(lat * 10)}_${Math.floor(lng * 10)}`;
            location.cityCode = `CITY_${Math.floor(Math.random() * 100)}`;
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
              'FOR',
              candidate.candidateId || candidate.id,
              0.85 + (Math.random() * 0.15), // 85-100% reliability
              {
                metadata: {
                  source: 'voter-generator-matching-counts',
                  dataGranularity,
                  batchId: batch
                }
              }
            );
            
            stats.totalVotes++;
            votersCreated++;
            
          } catch (error) {
            errors++;
            if (errors <= 3) { // Only show first 3 errors to avoid spam
              console.error(`      ❌ Error creating voter ${i}:`, error.message);
            }
          }
        }
        
        // Show progress every 10 batches or at the end
        if ((batch + 1) % 10 === 0 || batch === totalBatches - 1) {
          const progress = ((batch + 1) / totalBatches * 100).toFixed(1);
          console.log(`      ⏳ Progress: ${progress}% (${votersCreated.toLocaleString()} / ${voteCount.toLocaleString()} voters)`);
        }
      }
      
      console.log(`      ✅ Created ${votersCreated.toLocaleString()} voters (${errors} errors)\n`);
      stats.candidatesProcessed++;
    }
    
    stats.channelsProcessed++;
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎉 VOTER GENERATION COMPLETE!`);
  console.log(`${'='.repeat(80)}\n`);
  
  console.log(`📊 STATISTICS:`);
  console.log(`   Channels Processed: ${stats.channelsProcessed}`);
  console.log(`   Candidates Processed: ${stats.candidatesProcessed}`);
  console.log(`   Total Voters Created: ${stats.totalVoters.toLocaleString()}`);
  console.log(`   Total Votes Recorded: ${stats.totalVotes.toLocaleString()}\n`);
  
  console.log(`📍 PRIVACY DISTRIBUTION:`);
  console.log(`   GPS: ${stats.gps.toLocaleString()} (${((stats.gps/stats.totalVoters)*100).toFixed(1)}%) - Green towers`);
  console.log(`   City: ${stats.city.toLocaleString()} (${((stats.city/stats.totalVoters)*100).toFixed(1)}%) - Green towers`);
  console.log(`   Province: ${stats.province.toLocaleString()} (${((stats.province/stats.totalVoters)*100).toFixed(1)}%) - Gray towers 🔒`);
  console.log(`   Anonymous: ${stats.anonymous.toLocaleString()} (${((stats.anonymous/stats.totalVoters)*100).toFixed(1)}%) - Not displayed\n`);
  
  const visibleVoters = stats.gps + stats.city;
  const hiddenVoters = stats.province;
  console.log(`🎯 VISUALIZATION:`);
  console.log(`   Visible Voters (Green Towers): ${visibleVoters.toLocaleString()} (${((visibleVoters/stats.totalVoters)*100).toFixed(1)}%)`);
  console.log(`   Hidden Voters (Gray Towers): ${hiddenVoters.toLocaleString()} (${((hiddenVoters/stats.totalVoters)*100).toFixed(1)}%)`);
  console.log(`   Anonymous (Not Shown): ${stats.anonymous.toLocaleString()} (${((stats.anonymous/stats.totalVoters)*100).toFixed(1)}%)\n`);
  
  console.log(`✅ NEXT STEPS:`);
  console.log(`   1. Refresh your frontend (F5)`);
  console.log(`   2. Hover over any candidate on the globe`);
  console.log(`   3. See thousands of voter towers appear! 🎯`);
  console.log(`   4. Vote counts are now backed by actual voters!\n`);
}

// Run the generator
generateVotersMatchingVoteCounts().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

