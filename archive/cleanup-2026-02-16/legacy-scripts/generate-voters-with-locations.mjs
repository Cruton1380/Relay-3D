#!/usr/bin/env node
/**
 * Generate Realistic Voters with Location Data
 * 
 * This script:
 * 1. Reads demo-voting-data.json
 * 2. For each candidate's votes, generates realistic voters with GPS coordinates
 * 3. Distributes voters geographically around candidate locations
 * 4. Assigns privacy levels (GPS, city, province, anonymous)
 * 5. Saves to data/demos/demo-voters.json
 * 
 * Usage: node scripts/generate-voters-with-locations.mjs
 */


import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllCountries, getProvinces, getCities, generateCoordinates } from '../src/shared/boundaryDataAdapter.js';
// Minimal ISO2 to ISO3 map for demo (expand as needed)
const ISO2_TO_ISO3 = {
  US: 'USA',
  IT: 'ITA',
  JP: 'JPN',
  DE: 'DEU',
  BR: 'BRA',
  CA: 'CAN',
  AU: 'AUS',
  GB: 'GBR',
  FR: 'FRA',
  ES: 'ESP',
  // Add more as needed
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Realistic name components for demo users
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Maria', 'Carlos', 'Jose', 'Ana', 'Luis', 'Rosa', 'Juan', 'Carmen',
  'Wei', 'Ying', 'Ming', 'Li', 'Chen', 'Xiu', 'Jian', 'Mei'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen',
  'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter',
  'Roberts', 'Chen', 'Wang', 'Li', 'Zhang', 'Liu', 'Yang', 'Huang'
];

/**
 * Generate a random name
 */
function generateName() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

/**
 * Generate a random coordinate within a radius (in km) of a center point
 * Uses Haversine formula approximation for realistic geographic distribution
 */
function generateNearbyCoordinate(centerLat, centerLng, maxRadiusKm) {
  // Convert radius from km to degrees (approximate)
  const radiusDegrees = maxRadiusKm / 111.0; // 1 degree ≈ 111 km
  
  // Generate random angle
  const angle = Math.random() * 2 * Math.PI;
  
  // Generate random distance (with concentration toward center)
  const distance = Math.sqrt(Math.random()) * radiusDegrees;
  
  // Calculate new coordinates
  const lat = centerLat + (distance * Math.cos(angle));
  const lng = centerLng + (distance * Math.sin(angle) / Math.cos(centerLat * Math.PI / 180));
  
  return {
    lat: parseFloat(lat.toFixed(6)),
    lng: parseFloat(lng.toFixed(6))
  };
}

/**
 * Assign data granularity level based on realistic distribution
 * 40% GPS, 30% City, 20% Province, 10% Country
 * This represents what data the user ACTUALLY PROVIDED, not display preference
 */
function assignDataGranularity() {
  const rand = Math.random();
  if (rand < 0.40) return 'gps';       // 40% share GPS (have all levels)
  if (rand < 0.70) return 'city';      // 30% share city only
  if (rand < 0.90) return 'province';  // 20% share province only
  return 'country';                     // 10% share country only (anonymous)
}

/**
 * Get city name from candidate location or default
 */
function getCityName(candidateLocation, channelLocation) {
  if (candidateLocation?.address) {
    // Extract city from address
    return candidateLocation.address.split(',')[0] || 'Unknown City';
  }
  // Use channel location as fallback
  return 'Metropolitan Area';
}



// Caches to avoid repeated backend requests
const provinceCache = new Map(); // key: iso3, value: provinces[]
const cityCache = new Map(); // key: iso3-provinceCode, value: cities[]

// Assign a real province and city from the actual data, with caching
async function assignRealRegion(countryCode, centerProvinceCode = null) {
  // Convert to ISO3 if needed
  let iso3 = countryCode.length === 2 ? (ISO2_TO_ISO3[countryCode.toUpperCase()] || countryCode) : countryCode;
  // Provinces cache
  let provinces = provinceCache.get(iso3);
  if (!provinces) {
    provinces = await getProvinces(iso3);
    if (!provinces || provinces.length === 0) {
      throw new Error(`No provinces found for country code: ${countryCode}`);
    }
    provinceCache.set(iso3, provinces);
  }
  let province;
  if (centerProvinceCode && Math.random() < 0.4) {
    province = provinces.find(p => p.code === centerProvinceCode);
    if (!province) {
      province = provinces[Math.floor(Math.random() * provinces.length)];
    }
  } else {
    province = provinces[Math.floor(Math.random() * provinces.length)];
  }
  if (!province) {
    province = provinces[Math.floor(Math.random() * provinces.length)];
  }
  // Cities cache
  const cityKey = `${iso3}-${province.code}`;
  let cities = cityCache.get(cityKey);
  if (!cities) {
    try {
      cities = await getCities(iso3, province.code);
    } catch (e) {
      cities = [];
    }
    cityCache.set(cityKey, cities);
  }
  let city = cities && cities.length > 0 ? cities[Math.floor(Math.random() * cities.length)] : { name: province.name, code: province.code };
  return {
    province: province.name,
    provinceCode: province.code,
    city: city.name,
    cityCode: city.code
  };
}

/**
 * Generate voters for a specific candidate
 */

// Coordinate generation cache to avoid repeated failures
const coordinateGenerationCache = new Map(); // key: "countryCode-provinceCode-cityCode", value: { success: boolean }
let coordinateGenerationStats = {
  totalAttempts: 0,
  citySuccess: 0,
  provinceFallback: 0,
  countryFallback: 0,
  centerFallback: 0
};

// Helper function to try generating coordinates with fallback strategy
async function tryGenerateCoordinates(countryCode, provinceCode, cityCode, centerLat, centerLng) {
  coordinateGenerationStats.totalAttempts++;
  
  // Try city-level first
  const cityKey = `${countryCode}-${provinceCode}-${cityCode}`;
  let cached = coordinateGenerationCache.get(cityKey);
  if (cached === true) {
    try {
      const coords = await generateCoordinates({ countryCode, provinceCode, cityCode, count: 1 });
      coordinateGenerationStats.citySuccess++;
      return { coords: coords[0], method: 'city' };
    } catch (e) {
      // Cache was wrong, update it
      coordinateGenerationCache.set(cityKey, false);
    }
  } else if (cached === undefined) {
    try {
      const coords = await generateCoordinates({ countryCode, provinceCode, cityCode, count: 1 });
      coordinateGenerationCache.set(cityKey, true);
      coordinateGenerationStats.citySuccess++;
      return { coords: coords[0], method: 'city' };
    } catch (e) {
      coordinateGenerationCache.set(cityKey, false);
    }
  }
  
  // Fallback: Try province-level
  const provinceKey = `${countryCode}-${provinceCode}`;
  cached = coordinateGenerationCache.get(provinceKey);
  if (cached === true) {
    try {
      const coords = await generateCoordinates({ countryCode, provinceCode, count: 1 });
      coordinateGenerationStats.provinceFallback++;
      return { coords: coords[0], method: 'province' };
    } catch (e) {
      coordinateGenerationCache.set(provinceKey, false);
    }
  } else if (cached === undefined) {
    try {
      const coords = await generateCoordinates({ countryCode, provinceCode, count: 1 });
      coordinateGenerationCache.set(provinceKey, true);
      coordinateGenerationStats.provinceFallback++;
      return { coords: coords[0], method: 'province' };
    } catch (e) {
      coordinateGenerationCache.set(provinceKey, false);
    }
  }
  
  // Fallback: Try country-level
  const countryKey = countryCode;
  cached = coordinateGenerationCache.get(countryKey);
  if (cached === true) {
    try {
      const coords = await generateCoordinates({ countryCode, count: 1 });
      coordinateGenerationStats.countryFallback++;
      return { coords: coords[0], method: 'country' };
    } catch (e) {
      coordinateGenerationCache.set(countryKey, false);
    }
  } else if (cached === undefined) {
    try {
      const coords = await generateCoordinates({ countryCode, count: 1 });
      coordinateGenerationCache.set(countryKey, true);
      coordinateGenerationStats.countryFallback++;
      return { coords: coords[0], method: 'country' };
    } catch (e) {
      coordinateGenerationCache.set(countryKey, false);
    }
  }
  
  // Final fallback: Use center coordinates
  coordinateGenerationStats.centerFallback++;
  return { coords: { lat: centerLat, lng: centerLng }, method: 'center' };
}

// Generate voters for a specific candidate using only real regions
async function generateVotersForCandidate(candidate, channel, channelIndex, candidateIndex) {
  const voters = [];
  const voteCount = candidate.votes || 0;
  if (voteCount === 0) return voters;

  // Use candidate location as center, fallback to channel location
  const centerLat = candidate.location?.lat || channel.location?.latitude || 0;
  const centerLng = candidate.location?.lng || channel.location?.longitude || 0;
  if (centerLat === 0 && centerLng === 0) {
    console.warn(`⚠️  No valid location for candidate ${candidate.id} in channel ${channel.id}`);
    return voters;
  }

  // Country from candidate or channel
  const country = candidate.location?.country || channel.country || 'USA';
  const countryCode = channel.countryCode || 'US';
  const baseProvinceCode = candidate.location?.provinceCode || channel.provinceCode || null;

  for (let i = 0; i < voteCount; i++) {
    const granularity = assignDataGranularity();
    const userId = `voter_${channel.id}_${candidate.id}_${String(i).padStart(5, '0')}`;
    
    // Base voter object
    const voter = {
      userId,
      displayName: generateName(),
      dataGranularity: granularity,
      vote: {
        topicId: channel.id,
        candidateId: candidate.id,
        timestamp: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
        reliability: 0.85 + (Math.random() * 0.15)
      }
    };
    
    // Populate data based on granularity (what the user actually provided)
    switch (granularity) {
      case 'gps': {
        // GPS: User provides full GPS + derived city/province/country
        const region = await assignRealRegion(countryCode, baseProvinceCode);
        const { coords, method } = await tryGenerateCoordinates(
          countryCode, region.provinceCode, region.cityCode, centerLat, centerLng
        );
        voter.gps = { lat: coords.lat, lng: coords.lng };
        voter.city = region.city;
        voter.cityCode = region.cityCode;
        voter.province = region.province;
        voter.provinceCode = region.provinceCode;
        voter.country = country;
        voter.countryCode = countryCode;
        voter._generationMethod = method;
        break;
      }
      
      case 'city': {
        // City: User provides city + derived province/country (NO GPS)
        const region = await assignRealRegion(countryCode, baseProvinceCode);
        voter.gps = null;
        voter.city = region.city;
        voter.cityCode = region.cityCode;
        voter.province = region.province;
        voter.provinceCode = region.provinceCode;
        voter.country = country;
        voter.countryCode = countryCode;
        break;
      }
      
      case 'province': {
        // Province: User provides province + derived country (NO GPS, NO City)
        const region = await assignRealRegion(countryCode, baseProvinceCode);
        voter.gps = null;
        voter.city = null;
        voter.cityCode = null;
        voter.province = region.province;
        voter.provinceCode = region.provinceCode;
        voter.country = country;
        voter.countryCode = countryCode;
        break;
      }
      
      case 'country': {
        // Country: User provides only country (NO GPS, NO City, NO Province)
        voter.gps = null;
        voter.city = null;
        voter.cityCode = null;
        voter.province = null;
        voter.provinceCode = null;
        voter.country = country;
        voter.countryCode = countryCode;
        break;
      }
    }
    
    voters.push(voter);
  }
  return voters;
}

/**
 * Main function to generate all voters
 */
async function generateAllVoters() {
  console.log('🚀 Starting voter generation with locations...\n');
  
  // Read demo voting data
  const demoDataPath = path.join(process.cwd(), 'data', 'demos', 'demo-voting-data.json');
  
  let demoData;
  try {
    const demoDataContent = await fs.readFile(demoDataPath, 'utf8');
    demoData = JSON.parse(demoDataContent);
  } catch (error) {
    console.error('❌ Failed to read demo-voting-data.json:', error.message);
    process.exit(1);
  }
  
  if (!demoData.channels || !Array.isArray(demoData.channels)) {
    console.error('❌ Invalid demo data structure: no channels array');
    process.exit(1);
  }
  
  console.log(`📋 Found ${demoData.channels.length} channels\n`);
  
  const allVoters = [];
  let totalVoters = 0;
  let channelsProcessed = 0;
  
  // Process each channel
  for (let channelIndex = 0; channelIndex < demoData.channels.length; channelIndex++) {
    const channel = demoData.channels[channelIndex];
    
    if (!channel.candidates || !Array.isArray(channel.candidates)) {
      console.warn(`⚠️  Channel ${channel.id} has no candidates, skipping`);
      continue;
    }
    
    console.log(`📍 Processing channel: ${channel.name}`);
    console.log(`   Location: ${channel.location?.latitude}, ${channel.location?.longitude}`);
    console.log(`   Candidates: ${channel.candidates.length}`);
    
    let channelVoterCount = 0;
    
    // Process each candidate
    for (let candidateIndex = 0; candidateIndex < channel.candidates.length; candidateIndex++) {
      const candidate = channel.candidates[candidateIndex];
  const voters = await generateVotersForCandidate(candidate, channel, channelIndex, candidateIndex);
      
      allVoters.push(...voters);
      channelVoterCount += voters.length;
    }
    
    console.log(`   ✅ Generated ${channelVoterCount} voters\n`);
    totalVoters += channelVoterCount;
    channelsProcessed++;
  }
  
  console.log(`\n🎉 Generation complete!`);
  console.log(`   Channels processed: ${channelsProcessed}`);
  console.log(`   Total voters: ${totalVoters}`);
  
  // Data granularity statistics
  const granularityStats = {
    gps: allVoters.filter(v => v.dataGranularity === 'gps').length,
    city: allVoters.filter(v => v.dataGranularity === 'city').length,
    province: allVoters.filter(v => v.dataGranularity === 'province').length,
    country: allVoters.filter(v => v.dataGranularity === 'country').length
  };
  
  console.log(`\n📊 Data granularity distribution:`);
  console.log(`   GPS: ${granularityStats.gps} (${((granularityStats.gps/totalVoters)*100).toFixed(1)}%)`);
  console.log(`   City: ${granularityStats.city} (${((granularityStats.city/totalVoters)*100).toFixed(1)}%)`);
  console.log(`   Province: ${granularityStats.province} (${((granularityStats.province/totalVoters)*100).toFixed(1)}%)`);
  console.log(`   Country: ${granularityStats.country} (${((granularityStats.country/totalVoters)*100).toFixed(1)}%)`);
  
  console.log(`\n📍 Coordinate generation statistics (GPS voters only):`);
  console.log(`   Total attempts: ${coordinateGenerationStats.totalAttempts}`);
  console.log(`   City-level success: ${coordinateGenerationStats.citySuccess} (${((coordinateGenerationStats.citySuccess/coordinateGenerationStats.totalAttempts)*100).toFixed(1)}%)`);
  console.log(`   Province fallback: ${coordinateGenerationStats.provinceFallback} (${((coordinateGenerationStats.provinceFallback/coordinateGenerationStats.totalAttempts)*100).toFixed(1)}%)`);
  console.log(`   Country fallback: ${coordinateGenerationStats.countryFallback} (${((coordinateGenerationStats.countryFallback/coordinateGenerationStats.totalAttempts)*100).toFixed(1)}%)`);
  console.log(`   Center fallback: ${coordinateGenerationStats.centerFallback} (${((coordinateGenerationStats.centerFallback/coordinateGenerationStats.totalAttempts)*100).toFixed(1)}%)`);
  
  // Save to file
  const outputPath = path.join(process.cwd(), 'data', 'demos', 'demo-voters.json');
  
  const output = {
    generated: new Date().toISOString(),
    totalVoters,
    granularityStats,
    coordinateGenerationStats,
    voters: allVoters
  };
  
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n💾 Saved to: ${outputPath}`);
  
  console.log(`\n✅ Done! Voters with locations are ready for testing.`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Run: node scripts/load-demo-voters.mjs`);
  console.log(`   2. Start backend: node src/backend/server.mjs`);
  console.log(`   3. Test voter visualization on globe!`);
}

// Run the generator
generateAllVoters().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
