#!/usr/bin/env node

/**
 * High-Performance Massive Voter Generation
 * Generates millions of voters directly, bypassing API overhead
 */

import { processVote } from '../src/backend/voting/votingEngine.mjs';
import { setMockUserLocation } from '../src/backend/services/userLocationService.mjs';
import { setUserPrivacyLevel } from '../src/backend/services/userPreferencesService.mjs';
import * as turf from '@turf/turf';
import { boundaryService } from '../src/backend/services/boundaryService.mjs';

// Configuration
const VOTERS_PER_CANDIDATE = 1000; // 1k voters per candidate (configurable via CLI)
const GPS_RATIO = 0.96; // 96% GPS-level privacy
const BATCH_SIZE = 100; // Process 100 voters at a time

// Real countries with boundary data
const COUNTRIES = [
  { name: 'United States', code: 'US', lat: 37.09, lng: -95.71, province: 'California', provinceCode: 'CA' },
  { name: 'United Kingdom', code: 'GB', lat: 51.51, lng: -0.13, province: 'England', provinceCode: 'ENG' },
  { name: 'India', code: 'IN', lat: 20.59, lng: 78.96, province: 'Maharashtra', provinceCode: 'MH' },
  { name: 'Canada', code: 'CA', lat: 56.13, lng: -106.35, province: 'Ontario', provinceCode: 'ON' },
  { name: 'Australia', code: 'AU', lat: -25.27, lng: 133.78, province: 'New South Wales', provinceCode: 'NSW' }
];

/**
 * Load boundary polygon and pre-compute valid points
 */
async function loadBoundaryPolygon(countryCode, provinceCode = null) {
  try {
    const level = provinceCode ? 'ADM1' : 'ADM0';
    const boundaryData = await Promise.race([
      boundaryService.getBoundary(countryCode, level, provinceCode),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
    ]);

    if (boundaryData?.features?.[0]) {
      let feature = boundaryData.features[0];
      if (provinceCode && boundaryData.features.length > 1) {
        feature = boundaryData.features.find(f => 
          f.properties.shapeISO === provinceCode || 
          f.properties.code === provinceCode
        ) || feature;
      }
      return feature;
    }
  } catch (error) {
    console.warn(`⚠️ Failed to load boundary for ${countryCode}: ${error.message}`);
  }
  return null;
}

/**
 * Generate point inside polygon (fast rejection sampling)
 */
function generatePointInPolygon(feature, centerLat, centerLng) {
  if (!feature) {
    // Fallback: random within ±2 degrees
    return {
      lat: centerLat + (Math.random() * 4 - 2),
      lng: centerLng + (Math.random() * 4 - 2)
    };
  }

  const bbox = turf.bbox(feature);
  const [minLng, minLat, maxLng, maxLat] = bbox;

  // Try 50 times to find point in polygon
  for (let attempt = 0; attempt < 50; attempt++) {
    const lat = minLat + Math.random() * (maxLat - minLat);
    const lng = minLng + Math.random() * (maxLng - minLng);
    
    const pt = turf.point([lng, lat]);
    if (turf.booleanPointInPolygon(pt, feature)) {
      return { lat, lng };
    }
  }

  // Fallback: centroid
  const centroid = turf.centroid(feature);
  return {
    lat: centroid.geometry.coordinates[1],
    lng: centroid.geometry.coordinates[0]
  };
}

/**
 * Generate voters for a single candidate
 */
async function generateVotersForCandidate(candidate, channelId, voterCount) {
  console.log(`\n📊 Generating ${voterCount.toLocaleString()} voters for ${candidate.name}...`);
  
  // Determine country
  const useRealCountry = !candidate.location?.countryCode || candidate.location.countryCode === 'DMO';
  const country = useRealCountry ? COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)] : {
    name: candidate.location.country,
    code: candidate.location.countryCode,
    lat: candidate.location.lat,
    lng: candidate.location.lng,
    province: candidate.location.province,
    provinceCode: candidate.location.provinceCode
  };

  // Load boundary polygon ONCE
  console.log(`📍 Loading boundary for ${country.name} (${country.code})...`);
  const startBoundary = Date.now();
  const boundaryFeature = await loadBoundaryPolygon(country.code, country.provinceCode);
  const boundaryTime = Date.now() - startBoundary;
  console.log(`✅ Boundary loaded in ${boundaryTime}ms`);

  // Statistics
  const stats = { gps: 0, city: 0, province: 0, anonymous: 0 };
  let processed = 0;
  const startTime = Date.now();

  // Generate voters in batches
  for (let batch = 0; batch < Math.ceil(voterCount / BATCH_SIZE); batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, voterCount);
    const batchPromises = [];

    for (let i = batchStart; i < batchEnd; i++) {
      // Determine privacy level (valid: gps, city, province, anonymous)
      const rand = Math.random();
      let dataGranularity;
      if (rand < GPS_RATIO) {
        dataGranularity = 'gps';
      } else if (rand < GPS_RATIO + 0.02) {
        dataGranularity = 'city';
      } else if (rand < GPS_RATIO + 0.03) {
        dataGranularity = 'province';
      } else {
        dataGranularity = 'anonymous'; // Changed from 'country' to 'anonymous'
      }
      
      stats[dataGranularity]++;

      // Generate GPS coordinates
      const { lat, lng } = generatePointInPolygon(boundaryFeature, country.lat, country.lng);

      // Create user
      const userId = `voter_${candidate.id}_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Build location
      const location = {
        country: country.name,
        countryCode: country.code,
        verificationMethod: dataGranularity === 'gps' ? 'gps' : 'declared'
      };

      if (dataGranularity !== 'anonymous') {
        location.province = country.province;
        location.provinceCode = country.provinceCode;
      }

      if (dataGranularity === 'gps' || dataGranularity === 'city') {
        const cities = {
          'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
          'GB': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'],
          'IN': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'],
          'CA': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
          'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide']
        };
        const cityList = cities[country.code] || ['City'];
        location.city = cityList[Math.floor(Math.random() * cityList.length)];
        location.cityCode = location.city.toUpperCase().replace(/\s/g, '_');
      }

      if (dataGranularity === 'gps') {
        location.lat = lat;
        location.lng = lng;
      }

      // Store location and privacy (synchronous for speed)
      setMockUserLocation(userId, location);
      
      // Cast vote (async)
      const votePromise = Promise.all([
        setUserPrivacyLevel(userId, dataGranularity),
        processVote(userId, channelId, 'FOR', candidate.id, 0.95)
      ]);
      
      batchPromises.push(votePromise);
      processed++;
    }

    // Wait for batch to complete
    await Promise.all(batchPromises);

    // Progress update every 10 batches
    if (batch % 10 === 0 && batch > 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processed / elapsed;
      const remaining = voterCount - processed;
      const eta = remaining / rate;
      console.log(`  ⏳ ${processed.toLocaleString()}/${voterCount.toLocaleString()} voters (${rate.toFixed(0)}/s, ETA: ${eta.toFixed(0)}s)`);
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const rate = voterCount / totalTime;
  
  console.log(`✅ Generated ${voterCount.toLocaleString()} voters in ${totalTime.toFixed(1)}s (${rate.toFixed(0)}/s)`);
  console.log(`   📊 GPS: ${stats.gps.toLocaleString()} (${(stats.gps/voterCount*100).toFixed(1)}%)`);
  console.log(`   📊 City: ${stats.city.toLocaleString()}`);
  console.log(`   📊 Province: ${stats.province.toLocaleString()}`);
  console.log(`   📊 Anonymous: ${stats.anonymous.toLocaleString()}`);

  return stats;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 High-Performance Massive Voter Generation\n');
  console.log(`📊 Configuration:`);
  console.log(`   - Voters per candidate: ${VOTERS_PER_CANDIDATE.toLocaleString()}`);
  console.log(`   - GPS ratio: ${(GPS_RATIO * 100).toFixed(1)}%`);
  console.log(`   - Batch size: ${BATCH_SIZE}`);

  // Get channel ID from command line
  const channelId = process.argv[2] || 'created-1761087996653-4de3ew0hu';
  const candidateIds = process.argv.slice(3);

  console.log(`\n🎯 Target channel: ${channelId}`);
  
  if (candidateIds.length === 0) {
    console.log('❌ No candidate IDs provided');
    console.log('\nUsage: node generate-massive-voters.mjs <channelId> <candidateId1> [candidateId2] ...');
    console.log('Example: node generate-massive-voters.mjs created-1761087996653-4de3ew0hu candidate-1761087996622-0-d8ikdust4');
    process.exit(1);
  }

  console.log(`🎯 Target candidates: ${candidateIds.length}`);

  const overallStart = Date.now();
  const allStats = [];

  for (let i = 0; i < candidateIds.length; i++) {
    const candidateId = candidateIds[i];
    const candidate = {
      id: candidateId,
      name: `Candidate ${i + 1}`,
      location: COUNTRIES[i % COUNTRIES.length] // Rotate through countries
    };

    const stats = await generateVotersForCandidate(candidate, channelId, VOTERS_PER_CANDIDATE);
    allStats.push(stats);
  }

  const overallTime = (Date.now() - overallStart) / 1000;
  const totalVoters = VOTERS_PER_CANDIDATE * candidateIds.length;
  const overallRate = totalVoters / overallTime;

  console.log(`\n✅ COMPLETE: Generated ${totalVoters.toLocaleString()} voters in ${overallTime.toFixed(1)}s (${overallRate.toFixed(0)}/s)`);
  console.log(`\n📊 Overall Statistics:`);
  
  const totalStats = allStats.reduce((acc, stats) => ({
    gps: acc.gps + stats.gps,
    city: acc.city + stats.city,
    province: acc.province + stats.province,
    anonymous: acc.anonymous + stats.anonymous
  }), { gps: 0, city: 0, province: 0, anonymous: 0 });

  console.log(`   GPS: ${totalStats.gps.toLocaleString()} (${(totalStats.gps/totalVoters*100).toFixed(1)}%)`);
  console.log(`   City: ${totalStats.city.toLocaleString()}`);
  console.log(`   Province: ${totalStats.province.toLocaleString()}`);
  console.log(`   Anonymous: ${totalStats.anonymous.toLocaleString()}`);

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

