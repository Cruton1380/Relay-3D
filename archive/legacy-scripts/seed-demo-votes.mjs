// scripts/seed-demo-votes.mjs
/**
 * Demo Vote Generation Script
 * Generates realistic demo votes through the production voting pipeline
 * All votes go through blockchain, audit logging, and privacy filtering
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Import production modules
import { processVote } from '../src/backend/voting/votingEngine.mjs';
import { blockchain } from '../src/backend/state/state.mjs';
import { getUserPrivacyLevel } from '../src/backend/services/userPreferencesService.mjs';
import logger from '../src/backend/utils/logging/logger.mjs';

const scriptLogger = logger.child({ module: 'seed-demo-votes' });

// Regional location data (city centers with slight randomization)
const REGION_LOCATIONS = {
  'usa-california-san-francisco': {
    country: 'United States',
    countryCode: 'US',
    province: 'California',
    provinceCode: 'US-CA',
    city: 'San Francisco',
    cityCode: 'SF',
    baseCoords: { lat: 37.7749, lng: -122.4194 }
  },
  'usa-new-york-manhattan': {
    country: 'United States',
    countryCode: 'US',
    province: 'New York',
    provinceCode: 'US-NY',
    city: 'Manhattan',
    cityCode: 'NYC',
    baseCoords: { lat: 40.7580, lng: -73.9855 }
  },
  'uk-england-london': {
    country: 'United Kingdom',
    countryCode: 'GB',
    province: 'England',
    provinceCode: 'GB-ENG',
    city: 'London',
    cityCode: 'LON',
    baseCoords: { lat: 51.5074, lng: -0.1278 }
  },
  'japan-tokyo-shibuya': {
    country: 'Japan',
    countryCode: 'JP',
    province: 'Tokyo',
    provinceCode: 'JP-13',
    city: 'Shibuya',
    cityCode: 'SHI',
    baseCoords: { lat: 35.6595, lng: 139.7004 }
  },
  'france-ile-de-france-paris': {
    country: 'France',
    countryCode: 'FR',
    province: 'Île-de-France',
    provinceCode: 'FR-IDF',
    city: 'Paris',
    cityCode: 'PAR',
    baseCoords: { lat: 48.8566, lng: 2.3522 }
  },
  'germany-berlin-mitte': {
    country: 'Germany',
    countryCode: 'DE',
    province: 'Berlin',
    provinceCode: 'DE-BE',
    city: 'Mitte',
    cityCode: 'MIT',
    baseCoords: { lat: 52.5200, lng: 13.4050 }
  },
  'australia-new-south-wales-sydney': {
    country: 'Australia',
    countryCode: 'AU',
    province: 'New South Wales',
    provinceCode: 'AU-NSW',
    city: 'Sydney',
    cityCode: 'SYD',
    baseCoords: { lat: -33.8688, lng: 151.2093 }
  },
  'canada-ontario-toronto': {
    country: 'Canada',
    countryCode: 'CA',
    province: 'Ontario',
    provinceCode: 'CA-ON',
    city: 'Toronto',
    cityCode: 'TOR',
    baseCoords: { lat: 43.6532, lng: -79.3832 }
  },
  'italy-lazio-rome': {
    country: 'Italy',
    countryCode: 'IT',
    province: 'Lazio',
    provinceCode: 'IT-62',
    city: 'Rome',
    cityCode: 'ROM',
    baseCoords: { lat: 41.9028, lng: 12.4964 }
  },
  'india-maharashtra-mumbai': {
    country: 'India',
    countryCode: 'IN',
    province: 'Maharashtra',
    provinceCode: 'IN-MH',
    city: 'Mumbai',
    cityCode: 'BOM',
    baseCoords: { lat: 19.0760, lng: 72.8777 }
  }
};

/**
 * Generate random coordinates near a city center
 * @param {object} baseCoords - { lat, lng }
 * @param {number} radiusKm - Radius in kilometers
 * @returns {object} - { lat, lng }
 */
function randomizeLocation(baseCoords, radiusKm = 10) {
  // Approximate degrees per km (varies by latitude)
  const kmPerDegreeLat = 111;
  const kmPerDegreeLng = 111 * Math.cos(baseCoords.lat * Math.PI / 180);
  
  // Random offset in km
  const offsetLat = (Math.random() - 0.5) * 2 * radiusKm;
  const offsetLng = (Math.random() - 0.5) * 2 * radiusKm;
  
  return {
    lat: baseCoords.lat + (offsetLat / kmPerDegreeLat),
    lng: baseCoords.lng + (offsetLng / kmPerDegreeLng)
  };
}

/**
 * Generate a cryptographic signature for the vote
 * (Simplified for demo - production uses ECDSA-P256)
 */
function generateDemoSignature(voteData) {
  const dataString = JSON.stringify(voteData);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Generate a unique nonce for replay protection
 */
function generateNonce() {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Create location object for a user
 */
function createLocationForUser(userId, userRegion) {
  const regionData = REGION_LOCATIONS[userRegion];
  if (!regionData) {
    scriptLogger.warn(`No location data for region: ${userRegion}`, { userId });
    return null;
  }
  
  // Randomize coordinates slightly
  const coords = randomizeLocation(regionData.baseCoords, 5);
  
  return {
    lat: coords.lat,
    lng: coords.lng,
    country: regionData.country,
    countryCode: regionData.countryCode,
    province: regionData.province,
    provinceCode: regionData.provinceCode,
    city: regionData.city,
    cityCode: regionData.cityCode
  };
}

/**
 * Load demo users from users.json
 */
async function loadDemoUsers() {
  const usersFile = path.join(process.cwd(), 'data', 'users', 'users.json');
  const data = await fs.readFile(usersFile, 'utf8');
  const usersObj = JSON.parse(data);
  return Object.values(usersObj);
}

/**
 * Load available candidates from channels
 */
async function loadCandidates() {
  const channelsFile = path.join(process.cwd(), 'data', 'channels', 'channels.json');
  
  try {
    const data = await fs.readFile(channelsFile, 'utf8');
    const channels = JSON.parse(data);
    
    // Extract all candidates from all channels
    const allCandidates = [];
    for (const channel of Object.values(channels)) {
      if (channel.candidates && Array.isArray(channel.candidates)) {
        for (const candidate of channel.candidates) {
          allCandidates.push({
            candidateId: candidate.candidateId || candidate.id,
            topicId: channel.channelId || channel.id,
            name: candidate.name,
            region: candidate.region
          });
        }
      }
    }
    
    return allCandidates;
  } catch (error) {
    scriptLogger.error('Failed to load candidates', { error: error.message });
    // Return empty array if file doesn't exist or is invalid
    return [];
  }
}

/**
 * Generate votes for all demo users
 */
async function generateDemoVotes() {
  scriptLogger.info('🚀 Starting demo vote generation...');
  
  try {
    // Load demo users and candidates
    const users = await loadDemoUsers();
    const candidates = await loadCandidates();
    
    if (candidates.length === 0) {
      scriptLogger.error('❌ No candidates found. Please create channels first.');
      return;
    }
    
    scriptLogger.info(`📊 Loaded ${users.length} demo users and ${candidates.length} candidates`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Generate 10-20 votes per user
    for (const user of users) {
      const voteCount = Math.floor(Math.random() * 11) + 10; // 10-20 votes
      
      for (let i = 0; i < voteCount; i++) {
        try {
          // Select random candidate
          const candidate = candidates[Math.floor(Math.random() * candidates.length)];
          
          // Create location for this vote
          const location = createLocationForUser(user.userId, user.region);
          
          // Get user's privacy level
          const privacyLevel = await getUserPrivacyLevel(user.userId);
          
          // Generate signature and nonce
          const voteData = {
            userId: user.userId,
            topicId: candidate.topicId,
            candidateId: candidate.candidateId
          };
          const signature = generateDemoSignature(voteData);
          const nonce = generateNonce();
          
          // Process vote through production pipeline
          const result = await processVote(
            user.userId,
            candidate.topicId,
            'FOR',
            candidate.candidateId,
            user.trustScore / 100, // Convert trust score to reliability
            {
              signature,
              publicKey: user.userId, // Using userId as publicKey for demo
              nonce,
              location,
              privacyLevel: privacyLevel.toUpperCase()
            }
          );
          
          if (result.success) {
            successCount++;
            if (successCount % 50 === 0) {
              scriptLogger.info(`✅ Generated ${successCount} votes...`);
            }
          } else {
            failCount++;
            scriptLogger.warn('Vote processing returned non-success', { 
              userId: user.userId, 
              result 
            });
          }
          
          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 10));
          
        } catch (error) {
          failCount++;
          scriptLogger.error('Failed to generate vote', {
            userId: user.userId,
            error: error.message
          });
        }
      }
    }
    
    scriptLogger.info('🎉 Demo vote generation complete!', {
      totalUsers: users.length,
      successfulVotes: successCount,
      failedVotes: failCount,
      blockchainBlocks: await blockchain.getBlockCount?.() || 'N/A'
    });
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEMO VOTE GENERATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful Votes: ${successCount}`);
    console.log(`❌ Failed Votes: ${failCount}`);
    console.log(`👥 Demo Users: ${users.length}`);
    console.log(`🗳️  Candidates: ${candidates.length}`);
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    scriptLogger.error('❌ Fatal error during demo vote generation', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Run the script
generateDemoVotes()
  .then(() => {
    scriptLogger.info('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    scriptLogger.error('❌ Script failed', { error: error.message });
    process.exit(1);
  });
