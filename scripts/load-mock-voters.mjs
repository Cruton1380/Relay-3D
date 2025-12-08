#!/usr/bin/env node

/**
 * Load Mock Voters into Voting System
 * 
 * This script loads mock voters into the actual voting system's authoritativeVoteLedger
 * Each mock voter:
 * - Casts a vote for a candidate (stored in voting ledger)
 * - Has location data (stored in location service)  
 * - Has data granularity preference (stored in preferences)
 */

import { processVote } from '../src/backend/voting/votingEngine.mjs';
import { setMockUserLocation } from '../src/backend/services/userLocationService.mjs';
import { setUserPrivacyLevel } from '../src/backend/services/userPreferencesService.mjs';
import logger from '../src/backend/utils/logging/logger.mjs';

const mockVoterLogger = logger.child({ module: 'mock-voter-loader' });

/**
 * Generate mock voters for a candidate
 * @param {string} topicId 
 * @param {string} candidateId 
 * @param {number} voteCount 
 * @param {Object} options - location bounds, etc
 */
async function generateMockVotersForCandidate(topicId, candidateId, voteCount, options = {}) {
  const {
    centerLat = 0,
    centerLng = 0,
    country = 'Demo Country',
    countryCode = 'DMO',
    province = 'Demo Province',
    provinceCode = 'DEMO_PROV'
  } = options;
  
  mockVoterLogger.info('Generating mock voters', { 
    topicId, 
    candidateId, 
    voteCount,
    country 
  });
  
  const granularityDistribution = [
    { type: 'gps', ratio: 0.40 },
    { type: 'city', ratio: 0.30 },
    { type: 'province', ratio: 0.20 },
    { type: 'country', ratio: 0.10 }
  ];
  
  const generatedVoters = [];
  
  for (let i = 0; i < voteCount; i++) {
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
    
    // Generate user ID
    const userId = `mock_voter_${candidateId}_${i}_${Date.now()}`;
    
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
      // Store user location in location service (for mock data)
      setMockUserLocation(userId, location);
      
      // Store user privacy preference
      await setUserPrivacyLevel(userId, dataGranularity);
      
      // Cast vote in voting system
      // Note: Not providing signature/publicKey means it won't write to blockchain
      const voteResult = await processVote(
        userId,
        topicId,
        'FOR',
        candidateId,
        0.95 // reliability
      );
      
      if (voteResult.success) {
        generatedVoters.push({
          userId,
          candidateId,
          dataGranularity,
          location
        });
      } else {
        mockVoterLogger.warn('Failed to process vote', { userId, candidateId });
      }
    } catch (error) {
      mockVoterLogger.error('Error creating mock voter', { 
        error: error.message, 
        userId 
      });
    }
  }
  
  mockVoterLogger.info('Mock voters generated', {
    candidateId,
    requested: voteCount,
    created: generatedVoters.length,
    breakdown: {
      gps: generatedVoters.filter(v => v.dataGranularity === 'gps').length,
      city: generatedVoters.filter(v => v.dataGranularity === 'city').length,
      province: generatedVoters.filter(v => v.dataGranularity === 'province').length,
      country: generatedVoters.filter(v => v.dataGranularity === 'country').length
    }
  });
  
  return generatedVoters;
}

/**
 * Load mock voters for all candidates in a channel
 * @param {Object} channel 
 * @param {number} votersPerCandidate 
 */
async function loadMockVotersForChannel(channel, votersPerCandidate = 100) {
  mockVoterLogger.info('Loading mock voters for channel', { 
    channelId: channel.id,
    channelName: channel.name,
    candidates: channel.candidates?.length || 0
  });
  
  if (!channel.candidates || channel.candidates.length === 0) {
    mockVoterLogger.warn('Channel has no candidates', { channelId: channel.id });
    return [];
  }
  
  const allVoters = [];
  
  for (const candidate of channel.candidates) {
    const voters = await generateMockVotersForCandidate(
      channel.id, // topicId
      candidate.id, // candidateId
      votersPerCandidate,
      {
        centerLat: candidate.location?.lat || 0,
        centerLng: candidate.location?.lng || 0,
        country: candidate.location?.country || 'Demo Country',
        countryCode: candidate.location?.countryCode || 'DMO',
        province: candidate.location?.province || 'Demo Province',
        provinceCode: candidate.location?.provinceCode || 'DEMO_PROV'
      }
    );
    
    allVoters.push(...voters);
  }
  
  mockVoterLogger.info('Channel mock voters loaded', {
    channelId: channel.id,
    totalVoters: allVoters.length
  });
  
  return allVoters;
}

/**
 * Main function - load mock voters for channels from backend
 */
async function loadMockVotersFromBackend() {
  console.log('🗳️ Loading mock voters into voting system...\n');
  
  try {
    // Fetch channels from backend
    const response = await fetch('http://localhost:3002/api/channels');
    const result = await response.json();
    
    if (!result.success || !result.channels) {
      console.error('❌ Failed to fetch channels from backend');
      return;
    }
    
    console.log(`📋 Found ${result.channels.length} channels\n`);
    
    let totalVoters = 0;
    
    for (const channel of result.channels) {
      const voters = await loadMockVotersForChannel(channel, 100);
      totalVoters += voters.length;
      console.log(`✅ Loaded ${voters.length} voters for channel: ${channel.name}`);
    }
    
    console.log(`\n✅ Complete! Loaded ${totalVoters} mock voters into voting system`);
    console.log('\n📝 Mock voters are now stored in:');
    console.log('   - authoritativeVoteLedger (voting system)');
    console.log('   - userLocationService (location data)');
    console.log('   - userPreferencesService (data granularity)');
    console.log('\n🎯 Next: Hover over candidates in the UI to see voter visualization!');
    
  } catch (error) {
    console.error('❌ Error loading mock voters:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  loadMockVotersFromBackend().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { generateMockVotersForCandidate, loadMockVotersForChannel };

