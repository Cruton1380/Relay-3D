// src/backend/routes/mockVoterLoader.mjs
/**
 * Mock Voter Loader API
 * Provides API endpoint to generate and load mock voters into the voting system
 */

import express from 'express';
import { processVote } from '../domains/voting/votingEngine.mjs';
import { setMockUserLocation } from '../services/userLocationService.mjs';
import { setUserPrivacyLevel } from '../services/userPreferencesService.mjs';
import logger from '../utils/logging/logger.mjs';
import * as turf from '@turf/turf';
import { boundaryService } from '../services/boundaryService.mjs';

const router = express.Router();
const mockVoterLogger = logger.child({ module: 'mock-voter-loader' });

/**
 * POST /api/mock-voters/load
 * Load mock voters for all candidates in a channel
 * Body: { channelId, channel, votersPerCandidate }
 */
router.post('/load', async (req, res) => {
  try {
    const { channelId, channel, votersPerCandidate = 100 } = req.body;
    
    if (!channel || !channel.candidates) {
      return res.status(400).json({
        success: false,
        error: 'Invalid channel data - must include candidates array'
      });
    }
    
    mockVoterLogger.info('Loading mock voters for channel', { 
      channelId: channel.id,
      channelName: channel.name,
      candidates: channel.candidates.length,
      votersPerCandidate
    });
    
    const granularityDistribution = [
      { type: 'gps', ratio: 0.96 },      // 96% GPS-level privacy
      { type: 'city', ratio: 0.02 },     // 2% city-level privacy
      { type: 'province', ratio: 0.01 }, // 1% province-level privacy
      { type: 'country', ratio: 0.01 }   // 1% country-level privacy
    ];
    
    const allVoters = [];
    const stats = {
      gps: 0,
      city: 0,
      province: 0,
      country: 0
    };
    
    // Real countries for realistic voter distribution
    const realCountries = [
      { name: 'United States', code: 'US', lat: 37.09, lng: -95.71, province: 'California', provinceCode: 'CA' },
      { name: 'United Kingdom', code: 'GB', lat: 51.51, lng: -0.13, province: 'England', provinceCode: 'ENG' },
      { name: 'India', code: 'IN', lat: 20.59, lng: 78.96, province: 'Maharashtra', provinceCode: 'MH' },
      { name: 'Canada', code: 'CA', lat: 56.13, lng: -106.35, province: 'Ontario', provinceCode: 'ON' },
      { name: 'Australia', code: 'AU', lat: -25.27, lng: 133.78, province: 'New South Wales', provinceCode: 'NSW' }
    ];
    
    for (const candidate of channel.candidates) {
      // Use candidate location if available, otherwise pick a random real country
      const useRealCountry = !candidate.location?.countryCode || candidate.location.countryCode === 'DMO';
      const randomCountry = realCountries[Math.floor(Math.random() * realCountries.length)];
      
      const centerLat = candidate.location?.lat || randomCountry.lat;
      const centerLng = candidate.location?.lng || randomCountry.lng;
      const country = useRealCountry ? randomCountry.name : candidate.location.country;
      const countryCode = useRealCountry ? randomCountry.code : candidate.location.countryCode;
      const province = useRealCountry ? randomCountry.province : (candidate.location.province || randomCountry.province);
      const provinceCode = useRealCountry ? randomCountry.provinceCode : (candidate.location.provinceCode || randomCountry.provinceCode);
      
      // OPTIMIZATION: Load boundary polygon ONCE per candidate, not per voter
      mockVoterLogger.info(`Loading boundary for candidate ${candidate.id}: ${country} (${countryCode})`);
      let boundaryFeature = null;
      try {
        const level = provinceCode ? 'ADM1' : 'ADM0';
        const boundaryData = await Promise.race([
          boundaryService.getBoundary(countryCode, level, provinceCode),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Boundary timeout')), 2000))
        ]);
        
        if (boundaryData && boundaryData.features && boundaryData.features.length > 0) {
          boundaryFeature = boundaryData.features[0];
          if (provinceCode && boundaryData.features.length > 1) {
            boundaryFeature = boundaryData.features.find(f => 
              f.properties.shapeISO === provinceCode || 
              f.properties.code === provinceCode
            ) || boundaryFeature;
          }
          mockVoterLogger.info(`✅ Loaded boundary for ${country}, will generate voters inside polygon`);
        }
      } catch (error) {
        mockVoterLogger.warn(`Failed to load boundary for ${country}: ${error.message}, using fallback`);
      }
      
      // Helper function to generate point in THIS candidate's boundary
      const generatePointInCandidateBoundary = () => {
        if (!boundaryFeature) {
          // Fallback: random within ±2 degrees from center
          return {
            lat: centerLat + (Math.random() * 4 - 2),
            lng: centerLng + (Math.random() * 4 - 2)
          };
        }
        
        // Get bounding box
        const bbox = turf.bbox(boundaryFeature);
        const [minLng, minLat, maxLng, maxLat] = bbox;
        
        // Try up to 50 times to find point in polygon
        for (let attempt = 0; attempt < 50; attempt++) {
          const lat = minLat + Math.random() * (maxLat - minLat);
          const lng = minLng + Math.random() * (maxLng - minLng);
          
          const pt = turf.point([lng, lat]);
          if (turf.booleanPointInPolygon(pt, boundaryFeature)) {
            return { lat, lng };
          }
        }
        
        // Fallback: use centroid
        const centroid = turf.centroid(boundaryFeature);
        return {
          lat: centroid.geometry.coordinates[1],
          lng: centroid.geometry.coordinates[0]
        };
      };
      
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
        
        // Generate user ID
        const userId = `mock_voter_${candidate.id}_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Generate location WITHIN boundary polygon (uses pre-loaded boundary)
        const { lat, lng } = generatePointInCandidateBoundary();
        
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
          // Use real city names based on country
          const cityNames = {
            'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
            'GB': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'],
            'IN': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'],
            'CA': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
            'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide']
          };
          const cities = cityNames[countryCode] || ['City'];
          location.city = cities[Math.floor(Math.random() * cities.length)];
          location.cityCode = location.city.toUpperCase().replace(/\s/g, '_');
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
            channel.id, // topicId
            'FOR',
            candidate.id, // candidateId
            0.95 // reliability
          );
          
          if (voteResult.success) {
            allVoters.push({
              userId,
              candidateId: candidate.id,
              dataGranularity,
              location
            });
          } else {
            mockVoterLogger.warn('Failed to process vote', { userId, candidateId: candidate.id });
          }
        } catch (error) {
          mockVoterLogger.error('Error creating mock voter', { 
            error: error.message, 
            userId,
            candidateId: candidate.id
          });
        }
      }
    }
    
    mockVoterLogger.info('Mock voters loaded for channel', {
      channelId: channel.id,
      totalVoters: allVoters.length,
      breakdown: stats
    });
    
    res.json({
      success: true,
      channelId: channel.id,
      channelName: channel.name,
      totalVoters: allVoters.length,
      breakdown: stats
    });
    
  } catch (error) {
    mockVoterLogger.error('Failed to load mock voters', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/mock-voters/load-all-channels
 * Load mock voters for ALL channels in the system
 */
router.post('/load-all-channels', async (req, res) => {
  try {
    const { votersPerCandidate = 100 } = req.body;
    
    // Import channel service dynamically to avoid circular dependency
    const { getChannels } = await import('../channel-service/index.mjs');
    const channels = getChannels();
    
    mockVoterLogger.info('Loading mock voters for all channels', { 
      channelCount: channels.length,
      votersPerCandidate
    });
    
    const results = [];
    let totalVoters = 0;
    
    for (const channel of channels) {
      try {
        // Make internal API call to load voters for this channel
        const result = await new Promise((resolve, reject) => {
          const mockReq = {
            body: {
              channelId: channel.id,
              channel,
              votersPerCandidate
            }
          };
          
          const mockRes = {
            status: (code) => mockRes,
            json: (data) => {
              if (data.success) {
                resolve(data);
              } else {
                reject(new Error(data.error));
              }
            }
          };
          
          router.stack[0].route.stack[0].handle(mockReq, mockRes, (err) => {
            if (err) reject(err);
          });
        });
        
        results.push(result);
        totalVoters += result.totalVoters;
        
      } catch (error) {
        mockVoterLogger.error('Failed to load voters for channel', { 
          channelId: channel.id, 
          error: error.message 
        });
      }
    }
    
    mockVoterLogger.info('Mock voters loaded for all channels', { 
      channelsProcessed: results.length,
      totalVoters
    });
    
    res.json({
      success: true,
      channelsProcessed: results.length,
      totalVoters,
      results
    });
    
  } catch (error) {
    mockVoterLogger.error('Failed to load mock voters for all channels', { 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

