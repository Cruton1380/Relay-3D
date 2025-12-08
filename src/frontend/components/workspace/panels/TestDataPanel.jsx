/**
 * Test Data Panel - Advanced Test Data Management
 * Redesigned with 4 channel type boxes and simple number row
 */
import React, { useState, useEffect, useRef } from 'react';
import { channelAPI } from '../services/apiClient.js';
import { geoBoundaryService } from '../../../services/geoBoundaryService.js';

// Fallback country data for when the API is unavailable
const FALLBACK_COUNTRIES = [
  { "code": "USA", "name": "United States" },
  { "code": "CAN", "name": "Canada" },
  { "code": "MEX", "name": "Mexico" },
  { "code": "DEU", "name": "Germany" },
  { "code": "FRA", "name": "France" },
  { "code": "GBR", "name": "United Kingdom" },
  { "code": "ITA", "name": "Italy" },
  { "code": "ESP", "name": "Spain" },
  { "code": "CHN", "name": "China" },
  { "code": "JPN", "name": "Japan" },
  { "code": "IND", "name": "India" },
  { "code": "KOR", "name": "South Korea" },
  { "code": "SAU", "name": "Saudi Arabia" },
  { "code": "NGA", "name": "Nigeria" },
  { "code": "ZAF", "name": "South Africa" },
  { "code": "EGY", "name": "Egypt" },
  { "code": "BRA", "name": "Brazil" },
  { "code": "ARG", "name": "Argentina" },
  { "code": "COL", "name": "Colombia" },
  { "code": "AUS", "name": "Australia" },
  { "code": "NZL", "name": "New Zealand" },
  { "code": "RUS", "name": "Russia" },
  { "code": "TUR", "name": "Turkey" },
  { "code": "IRN", "name": "Iran" },
  { "code": "IDN", "name": "Indonesia" },
  { "code": "MYS", "name": "Malaysia" },
  { "code": "THA", "name": "Thailand" },
  { "code": "VNM", "name": "Vietnam" },
  { "code": "PHL", "name": "Philippines" },
  { "code": "SGP", "name": "Singapore" }
];

const CHANNEL_TYPES = [
  { 
    key: 'relay_official', 
    label: 'Relay Official', 
    color: '#6c47ff', 
    description: 'Official platform channels',
    subtypes: [
      { key: 'announcements', label: 'Announcements', count: 0 },
      { key: 'governance', label: 'Governance', count: 0 },
      { key: 'support', label: 'Support', count: 0 }
    ]
  },
  { 
    key: 'proximity', 
    label: 'Proximity', 
    color: '#22c55e', 
    description: 'Local proximity-based channels',
    subtypes: [
      { key: 'neighborhood', label: 'Neighborhood', count: 0 },
      { key: 'city', label: 'City', count: 0 },
      { key: 'region', label: 'Region', count: 0 }
    ]
  },
  { 
    key: 'regional', 
    label: 'Regional', 
    color: '#3b82f6', 
    description: 'Regional community channels',
    subtypes: [
      { key: 'community', label: 'Community', count: 0 },
      { key: 'cultural', label: 'Cultural', count: 0 },
      { key: 'local_business', label: 'Local Business', count: 0 }
    ]
  },
  { 
    key: 'global', 
    label: 'Global', 
    color: '#f59e0b', 
    description: 'Global topic channels',
    subtypes: [
      { key: 'technology', label: 'Technology', count: 0 },
      { key: 'environment', label: 'Environment', count: 0 },
      { key: 'health', label: 'Health', count: 0 }
    ]
  },
  { 
    key: 'gps_map', 
    label: 'GPS Map Channels', 
    color: '#ec4899', 
    description: 'GPS and mapping channels',
    subtypes: [
      { key: 'navigation', label: 'Navigation', count: 0 },
      { key: 'traffic', label: 'Traffic', count: 0 },
      { key: 'points_of_interest', label: 'Points of Interest', count: 0 },
      { key: 'boundary', label: 'Boundary Modifications', count: 0 }
    ]
  }
];

const NUMBER_BUTTONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

// Country data with boundaries for random coordinate generation
// Function to check if coordinates are likely in ocean based on known land boundaries
function isCoordinateInOcean(lat, lng, countryName) {
  // Define known land areas for Italy to avoid ocean placement
  if (countryName === 'Italy') {
    // Check for common ocean areas around Italy
    // Tyrrhenian Sea (west of Italy)
    if (lng < 7.5 || lng > 18.5) return true;
    if (lat < 37.5 || lat > 46.5) return true;
    
    // Adriatic Sea (east of Italy) - but some Italian regions are on Adriatic
    // Only flag as ocean if clearly in the middle of Adriatic
    if (lng > 16.0 && lat < 42.0 && lat > 40.0) return true;
    
    // Ionian Sea (south of Italy)
    if (lat < 37.0 && lng > 15.0) return true;
    
    // Ligurian Sea (northwest)
    if (lng < 8.0 && lat > 44.0) return true;
    
    // Specific problematic areas based on the bounds we saw in the images
    // Areas that were clearly in ocean
    if (lat >= 36.5 && lat <= 38.5 && lng >= 13.0 && lng <= 15.5) {
      // This is the area around Sicily - check if it's in the sea
      // Sicily itself should be land, but surrounding waters should be ocean
      const distanceFromSicily = Math.sqrt(Math.pow(lat - 37.5, 2) + Math.pow(lng - 14.0, 2));
      if (distanceFromSicily > 1.5) return true; // Too far from Sicily center
    }
  }
  
  // Define known land areas for Spain to avoid ocean placement
  if (countryName === 'Spain') {
    // Atlantic Ocean (west of Spain)
    if (lng < -9.5) return true;
    
    // Mediterranean Sea (south and east of Spain)
    if (lat < 35.5) return true;
    
    // Bay of Biscay (north of Spain)
    if (lat > 43.9) return true;
    
    // Eastern Mediterranean (east of Spain)
    if (lng > 4.5) return true;
    
    // Specific ocean areas around Spain
    // Strait of Gibraltar area (southern tip)
    if (lat < 36.0 && lng > -6.0 && lng < -5.0) return true;
    
    // Balearic Sea (around Balearic Islands)
    if (lat > 38.5 && lat < 40.5 && lng > 1.0 && lng < 4.5) {
      // Check if it's actually in the sea between mainland and islands
      const distanceFromMainland = Math.min(
        Math.abs(lng - 0.5), // Distance from Valencia coast
        Math.abs(lng - 2.5)   // Distance from Barcelona coast
      );
      if (distanceFromMainland > 0.8) return true; // Too far from mainland coast
    }
    
    // Cantabrian Sea (northern coast) - be more restrictive
    if (lat > 43.6 && lng < -1.0) return true;
  }
  
  // General ocean detection for all countries
  // Major ocean areas to avoid
  const oceanAreas = [
    // Pacific Ocean (east of Asia, west of Americas)
    { name: 'Pacific', bounds: { north: 60, south: -60, east: -120, west: 120 } },
    // Atlantic Ocean (between Americas and Europe/Africa)
    { name: 'Atlantic', bounds: { north: 70, south: -60, east: -10, west: -80 } },
    // Indian Ocean (south of Asia, east of Africa)
    { name: 'Indian', bounds: { north: 30, south: -60, east: 120, west: 20 } },
    // Arctic Ocean (north of 70 degrees)
    { name: 'Arctic', bounds: { north: 90, south: 70, east: 180, west: -180 } },
    // Southern Ocean (south of -60 degrees)
    { name: 'Southern', bounds: { north: -60, south: -90, east: 180, west: -180 } }
  ];
  
  // Check if coordinates fall within major ocean areas
  for (const ocean of oceanAreas) {
    if (lat >= ocean.bounds.south && lat <= ocean.bounds.north &&
        lng >= ocean.bounds.west && lng <= ocean.bounds.east) {
      // Additional check: if we're in a country's bounds, it's likely land
      const country = COUNTRIES.find(c => c.name === countryName);
      if (country) {
        const bounds = country.bounds;
        // If coordinates are within country bounds, assume it's land
        if (lat >= bounds.south && lat <= bounds.north &&
            lng >= bounds.west && lng <= bounds.east) {
          return false; // Within country bounds, assume land
        }
      }
      return true; // In ocean area and not in country bounds
    }
  }
  
  return false; // Assume land by default
}

// OLD: Removed hardcoded COUNTRIES - now loaded dynamically via geoBoundaryService
// const COUNTRIES = getAllCountries();

// City coordinates for precise land-based placement (matching backend data)
const CITY_COORDINATES = {
  'Spain': {
    'Galicia': {
      'Santiago de Compostela': { lat: 42.8805, lng: -8.5456 },
      'A Coruña': { lat: 43.3713, lng: -8.3960 },
      'Vigo': { lat: 42.2406, lng: -8.7207 }
    },
    'Asturias': {
      'Oviedo': { lat: 43.3619, lng: -5.8494 },
      'Gijón': { lat: 43.5453, lng: -5.6619 },
      'Avilés': { lat: 43.5547, lng: -5.9248 }
    },
    'Cantabria': {
      'Santander': { lat: 43.4623, lng: -3.8099 },
      'Torrelavega': { lat: 43.3500, lng: -4.0500 },
      'Castro Urdiales': { lat: 43.3833, lng: -3.2167 }
    },
    'Basque Country': {
      'Bilbao': { lat: 43.2627, lng: -2.9253 },
      'Vitoria-Gasteiz': { lat: 42.8467, lng: -2.6716 },
      'San Sebastián': { lat: 43.3183, lng: -1.9812 }
    },
    'Navarre': {
      'Pamplona': { lat: 42.8182, lng: -1.6442 },
      'Tudela': { lat: 42.0619, lng: -1.6044 },
      'Estella': { lat: 42.6706, lng: -2.0308 }
    },
    'La Rioja': {
      'Logroño': { lat: 42.4627, lng: -2.4449 },
      'Calahorra': { lat: 42.3031, lng: -1.9642 },
      'Arnedo': { lat: 42.2281, lng: -2.1008 }
    },
    'Aragon': {
      'Zaragoza': { lat: 41.6488, lng: -0.8891 },
      'Huesca': { lat: 42.1401, lng: -0.4087 },
      'Teruel': { lat: 40.3456, lng: -1.1065 }
    },
    'Catalonia': {
      'Barcelona': { lat: 41.3851, lng: 2.1734 },
      'Girona': { lat: 41.9794, lng: 2.8214 },
      'Lleida': { lat: 41.6176, lng: 0.6200 },
      'Tarragona': { lat: 41.1189, lng: 1.2445 }
    },
    'Castile and León': {
      'Valladolid': { lat: 41.6522, lng: -4.7245 },
      'León': { lat: 42.5987, lng: -5.5671 },
      'Burgos': { lat: 42.3409, lng: -3.6997 },
      'Salamanca': { lat: 40.9701, lng: -5.6635 }
    },
    'Madrid': {
      'Madrid': { lat: 40.4168, lng: -3.7038 },
      'Alcalá de Henares': { lat: 40.4817, lng: -3.3643 },
      'Getafe': { lat: 40.3047, lng: -3.7317 }
    },
    'Castile-La Mancha': {
      'Toledo': { lat: 39.8628, lng: -4.0273 },
      'Albacete': { lat: 38.9942, lng: -1.8584 },
      'Ciudad Real': { lat: 38.9860, lng: -3.9290 }
    },
    'Extremadura': {
      'Mérida': { lat: 38.9160, lng: -6.3437 },
      'Badajoz': { lat: 38.8794, lng: -6.9707 },
      'Cáceres': { lat: 39.4753, lng: -6.3724 }
    },
    'Andalusia': {
      'Seville': { lat: 37.3891, lng: -5.9845 },
      'Málaga': { lat: 36.7213, lng: -4.4214 },
      'Córdoba': { lat: 37.8882, lng: -4.7794 },
      'Granada': { lat: 37.1773, lng: -3.5986 }
    },
    'Murcia': {
      'Murcia': { lat: 37.9922, lng: -1.1307 },
      'Cartagena': { lat: 37.6057, lng: -0.9864 },
      'Lorca': { lat: 37.6710, lng: -1.7017 }
    },
    'Valencia': {
      'Valencia': { lat: 39.4699, lng: -0.3763 },
      'Alicante': { lat: 38.3452, lng: -0.4810 },
      'Castellón': { lat: 39.9864, lng: -0.0513 }
    },
    'Balearic Islands': {
      'Palma': { lat: 39.5696, lng: 2.6502 },
      'Ibiza': { lat: 38.9067, lng: 1.4206 },
      'Menorca': { lat: 39.8885, lng: 4.2618 }
    },
    'Canary Islands': {
      'Las Palmas': { lat: 28.1248, lng: -15.4300 },
      'Santa Cruz de Tenerife': { lat: 28.4698, lng: -16.2549 }
    }
  },
  'Italy': {
    'Piedmont': {
      'Turin': { lat: 45.0703, lng: 7.6869 },
      'Alessandria': { lat: 44.9133, lng: 8.6150 },
      'Novara': { lat: 45.4469, lng: 8.6222 }
    },
    'Lombardy': {
      'Milan': { lat: 45.4642, lng: 9.1900 },
      'Bergamo': { lat: 45.6942, lng: 9.6773 },
      'Brescia': { lat: 45.5416, lng: 10.2118 }
    },
    'Veneto': {
      'Venice': { lat: 45.4408, lng: 12.3155 },
      'Verona': { lat: 45.4384, lng: 10.9916 },
      'Padua': { lat: 45.4064, lng: 11.8768 }
    },
    'Friuli-Venezia Giulia': {
      'Trieste': { lat: 45.6495, lng: 13.7768 },
      'Udine': { lat: 46.0718, lng: 13.2342 },
      'Pordenone': { lat: 45.9569, lng: 12.6603 }
    },
    'Trentino-Alto Adige': {
      'Trento': { lat: 46.0748, lng: 11.1217 },
      'Bolzano': { lat: 46.4983, lng: 11.3548 },
      'Merano': { lat: 46.6700, lng: 11.1600 }
    },
    'Emilia-Romagna': {
      'Bologna': { lat: 44.4949, lng: 11.3426 },
      'Modena': { lat: 44.6471, lng: 10.9252 },
      'Parma': { lat: 44.8015, lng: 10.3279 }
    },
    'Liguria': {
      'Genoa': { lat: 44.4056, lng: 8.9463 },
      'La Spezia': { lat: 44.1025, lng: 9.8258 },
      'Savona': { lat: 44.3071, lng: 8.4766 }
    },
    'Tuscany': {
      'Florence': { lat: 43.7696, lng: 11.2558 },
      'Pisa': { lat: 43.7228, lng: 10.4017 },
      'Siena': { lat: 43.3188, lng: 11.3306 }
    },
    'Umbria': {
      'Perugia': { lat: 43.1122, lng: 12.3888 },
      'Terni': { lat: 42.5606, lng: 12.6445 },
      'Assisi': { lat: 43.0707, lng: 12.6196 }
    },
    'Marche': {
      'Ancona': { lat: 43.6158, lng: 13.5189 },
      'Pesaro': { lat: 43.9109, lng: 12.9136 },
      'Macerata': { lat: 43.3000, lng: 13.4500 }
    },
    'Lazio': {
      'Rome': { lat: 41.9028, lng: 12.4964 },
      'Viterbo': { lat: 42.4174, lng: 12.1082 },
      'Latina': { lat: 41.4675, lng: 12.9036 }
    },
    'Abruzzo': {
      'L\'Aquila': { lat: 42.3505, lng: 13.3995 },
      'Pescara': { lat: 42.4587, lng: 14.2138 },
      'Chieti': { lat: 42.3512, lng: 14.1675 }
    },
    'Molise': {
      'Campobasso': { lat: 41.5604, lng: 14.6674 },
      'Isernia': { lat: 41.6006, lng: 14.2381 }
    },
    'Campania': {
      'Naples': { lat: 40.8518, lng: 14.2681 },
      'Salerno': { lat: 40.6824, lng: 14.7681 },
      'Caserta': { lat: 41.0731, lng: 14.3329 }
    },
    'Puglia': {
      'Bari': { lat: 41.1177, lng: 16.8719 },
      'Lecce': { lat: 40.3512, lng: 18.1750 },
      'Foggia': { lat: 41.4622, lng: 15.5440 }
    },
    'Basilicata': {
      'Potenza': { lat: 40.6418, lng: 15.8079 },
      'Matera': { lat: 40.6667, lng: 16.6000 }
    },
    'Calabria': {
      'Catanzaro': { lat: 38.9108, lng: 16.5874 },
      'Cosenza': { lat: 39.3099, lng: 16.2502 },
      'Reggio Calabria': { lat: 38.1112, lng: 15.6613 }
    },
    'Sicily': {
      'Palermo': { lat: 38.1157, lng: 13.3613 },
      'Catania': { lat: 37.5079, lng: 15.0830 },
      'Messina': { lat: 38.1938, lng: 15.5540 }
    },
    'Sardinia': {
      'Cagliari': { lat: 39.2238, lng: 9.1217 },
      'Sassari': { lat: 40.7259, lng: 8.5557 },
      'Nuoro': { lat: 40.3209, lng: 9.3297 }
    }
  },
  'France': {
    'Île-de-France': {
      'Paris': { lat: 48.8566, lng: 2.3522 },
      'Versailles': { lat: 48.8014, lng: 2.1301 },
      'Boulogne-Billancourt': { lat: 48.8350, lng: 2.2400 }
    },
    'Auvergne-Rhône-Alpes': {
      'Lyon': { lat: 45.7640, lng: 4.8357 },
      'Grenoble': { lat: 45.1885, lng: 5.7245 },
      'Saint-Étienne': { lat: 45.4397, lng: 4.3872 }
    },
    'Provence-Alpes-Côte d\'Azur': {
      'Marseille': { lat: 43.2965, lng: 5.3698 },
      'Nice': { lat: 43.7102, lng: 7.2620 },
      'Toulon': { lat: 43.1242, lng: 5.9280 }
    },
    'Occitanie': {
      'Toulouse': { lat: 43.6047, lng: 1.4442 },
      'Montpellier': { lat: 43.6110, lng: 3.8767 },
      'Nîmes': { lat: 43.8367, lng: 4.3601 }
    },
    'Nouvelle-Aquitaine': {
      'Bordeaux': { lat: 44.8378, lng: -0.5792 },
      'Poitiers': { lat: 46.5802, lng: 0.3404 },
      'Limoges': { lat: 45.8336, lng: 1.2611 }
    },
    'Corsica': {
      'Ajaccio': { lat: 41.9267, lng: 8.7369 },
      'Bastia': { lat: 42.6977, lng: 9.4500 },
      'Porto-Vecchio': { lat: 41.5906, lng: 9.2792 }
    }
  }
};

// Function to get city coordinates
async function getCityCoordinates(countryName, provinceName, cityName) {
  // First try local city coordinates data
  const countryData = CITY_COORDINATES[countryName];
  if (countryData) {
    const provinceData = countryData[provinceName];
    if (provinceData && provinceData[cityName]) {
      return provinceData[cityName];
    }
  }
  
  // If not available locally, try to get from backend ProvinceDataService
  try {
    const response = await fetch('/api/channels/unified-boundary/province-centroid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        countryCode: countryName,
        provinceName: provinceName
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.centroid) {
        console.log(`[TestDataPanel] Using province centroid for ${cityName}, ${provinceName}, ${countryName}`);
        return {
          lat: result.centroid.lat,
          lng: result.centroid.lng
        };
      }
    }
  } catch (error) {
    console.warn(`[TestDataPanel] Could not get coordinates for ${cityName}, ${provinceName}, ${countryName}:`, error);
  }
  
  return null;
}

// Function to generate realistic vote distribution following statistical deviation
/**
 * Generate vote distribution based on concentration percentage
 * @param {number} candidateCount - Number of candidates
 * @param {number} concentration - Percentage (5-95) of votes for top candidate
 * @returns {Array<number>} Vote counts for each candidate
 * 
 * Examples:
 * - 95% concentration: "Should we eat puppies?" → 95% "No", 5% distributed
 * - 30% concentration: Presidential race → 30% top candidate, rest distributed logically
 * - 60% concentration: Default balanced competition
 */
function generateVoteDistribution(candidateCount, concentration = 60) {
  const votes = [];
  const totalVotes = 10000; // Base total votes for the channel
  
  // Normalize concentration to 0-1 range
  const topCandidateShare = concentration / 100;
  
  if (candidateCount === 1) {
    // Single candidate gets all votes
    votes.push(totalVotes);
    return votes;
  }
  
  // First candidate gets the concentration percentage
  const firstCandidateVotes = Math.floor(totalVotes * topCandidateShare);
  votes.push(firstCandidateVotes);
  
  // Remaining votes to distribute
  let remainingVotes = totalVotes - firstCandidateVotes;
  const remainingCandidates = candidateCount - 1;
  
  if (remainingCandidates === 1) {
    // Only 2 candidates total - second gets all remaining
    votes.push(remainingVotes);
  } else {
    // Multiple remaining candidates - use exponential decay
    // Higher concentration = steeper decay (winner-takes-more)
    // Lower concentration = gentler decay (more competitive)
    const decayRate = 0.5 + (topCandidateShare * 0.3); // 0.5 to 0.8 range
    
    // For large candidate counts (> 500), simplify to avoid rounding errors
    if (remainingCandidates > 500) {
      // Simplified distribution for large candidate counts
      // Top 10% get exponential decay, rest get equal minimal votes
      const topCandidateCount = Math.floor(remainingCandidates * 0.1);
      const regularCandidateCount = remainingCandidates - topCandidateCount;
      
      // Allocate 80% of remaining votes to top candidates, 20% to rest
      const topPoolVotes = Math.floor(remainingVotes * 0.8);
      const regularPoolVotes = remainingVotes - topPoolVotes;
      
      // Distribute top pool votes using exponential decay
      let topAllocated = 0;
      for (let i = 0; i < topCandidateCount; i++) {
        const decayFactor = Math.pow(decayRate, i + 1);
        const candidateVotes = Math.floor(topPoolVotes * decayFactor * 0.5);
        votes.push(Math.max(candidateVotes, 1));
        topAllocated += votes[votes.length - 1];
      }
      
      // Distribute remaining top pool votes
      const remainingTopVotes = topPoolVotes - topAllocated;
      for (let i = 0; i < Math.min(topCandidateCount, remainingTopVotes); i++) {
        votes[1 + i]++; // Add to first few top candidates
      }
      
      // Distribute regular pool votes equally
      const regularVotePerCandidate = Math.floor(regularPoolVotes / regularCandidateCount);
      for (let i = 0; i < regularCandidateCount; i++) {
        votes.push(Math.max(regularVotePerCandidate, 1));
      }
      
      // Distribute any remaining regular pool votes
      const regularRemaining = regularPoolVotes - (regularVotePerCandidate * regularCandidateCount);
      for (let i = 0; i < Math.min(regularCandidateCount, regularRemaining); i++) {
        votes[1 + topCandidateCount + i]++;
      }
    } else {
      // Standard distribution for reasonable candidate counts
      let allocatedVotes = 0;
      const tempVotes = [];
      
      // Calculate votes for each remaining candidate using exponential decay
      for (let i = 0; i < remainingCandidates; i++) {
        const decayFactor = Math.pow(decayRate, i + 1);
        const candidateVotes = Math.floor(remainingVotes * decayFactor * 0.4); // 40% base for second place
        tempVotes.push(Math.max(candidateVotes, 1)); // Minimum 1 vote
        allocatedVotes += tempVotes[i];
      }
      
      // Scale to fit remaining votes exactly
      if (allocatedVotes > 0 && allocatedVotes !== remainingVotes) {
        const scaleFactor = remainingVotes / allocatedVotes;
        for (let i = 0; i < tempVotes.length; i++) {
          tempVotes[i] = Math.floor(tempVotes[i] * scaleFactor);
        }
      }
      
      // Add scaled votes
      votes.push(...tempVotes);
      
      // Distribute any rounding remainder to top remaining candidates
      const currentTotal = votes.reduce((sum, v) => sum + v, 0);
      let remainder = totalVotes - currentTotal;
      for (let i = 1; i < votes.length && remainder > 0; i++) {
        votes[i]++;
        remainder--;
      }
      
      // Handle negative remainder (should be rare)
      if (remainder < 0) {
        remainder = Math.abs(remainder);
        for (let i = votes.length - 1; i >= 1 && remainder > 0; i--) {
          if (votes[i] > 1) {
            votes[i]--;
            remainder--;
          }
        }
      }
    }
  }
  
  // Final sanity check - ensure no negative votes and correct total
  const finalTotal = votes.reduce((sum, v) => sum + v, 0);
  if (finalTotal !== totalVotes) {
    console.warn(`[generateVoteDistribution] Vote total mismatch: ${finalTotal} !== ${totalVotes}, adjusting...`);
    const difference = totalVotes - finalTotal;
    
    if (difference > 0) {
      // Add missing votes to top candidates
      for (let i = 0; i < votes.length && i < difference; i++) {
        votes[i]++;
      }
    } else {
      // Remove excess votes from bottom candidates
      let toRemove = Math.abs(difference);
      for (let i = votes.length - 1; i >= 0 && toRemove > 0; i--) {
        if (votes[i] > 1) {
          const canRemove = Math.min(votes[i] - 1, toRemove);
          votes[i] -= canRemove;
          toRemove -= canRemove;
        }
      }
    }
  }
  
  // Ensure no negative votes
  for (let i = 0; i < votes.length; i++) {
    if (votes[i] < 1) {
      console.error(`[generateVoteDistribution] Negative vote detected at index ${i}: ${votes[i]}, setting to 1`);
      votes[i] = 1;
    }
  }
  
  return votes;
}

// Helper function to fetch coordinates from backend using GeoBoundaries data
async function generateGlobalCoordinatesFromBackend(countryName, provinceName = null) {
  try {
    console.log(`🌐 [Backend API] Requesting coordinates for ${countryName}${provinceName ? ` / ${provinceName}` : ''} using point-in-polygon`);
    
    const response = await fetch('http://localhost:3002/api/channels/generate-coordinates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        countryName: countryName,
        provinceName: provinceName, // Optional province for more specific boundaries
        count: 1
      }),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(25000) // 25 second timeout (less than backend 30s)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.warn(`⚠️ Backend returned ${response.status} for ${countryName}: ${errorData.error || 'Unknown error'}`);
      console.warn(`⚠️ Using fallback coordinate generation for ${countryName}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.coordinates && data.coordinates.length > 0) {
      const coord = data.coordinates[0];
      console.log(`✅ Successfully got coordinates from backend for ${countryName}`);
      return {
        lat: coord.lat,
        lng: coord.lng,
        countryName: coord.countryName,
        region: 'Global',
        province: 'Unknown Province',
        city: 'Unknown City'
      };
    }
    
    console.warn(`⚠️ Backend returned invalid data for ${countryName}, using fallback`);
    return null;
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.error(`⏱️ Timeout fetching coordinates from backend for ${countryName} (>25s)`);
    } else if (error.name === 'AbortError') {
      console.error(`🛑 Request aborted for ${countryName}`);
    } else {
      console.error(`❌ Error fetching coordinates from backend for ${countryName}:`, error.message || error);
    }
    return null;
  }
}

// Function to generate global coordinates using country boundaries
// Now uses backend GeoBoundaries data for ALL countries - unified data source
// NEW: Generate coordinates using unified boundary API with point-in-polygon
async function generateGlobalCoordinatesNew(selectedCountryCode = null, selectedProvinceCode = null) {
  console.log(`[generateGlobalCoordinatesNew] � Generating coordinates...`);
  console.log(`[generateGlobalCoordinatesNew] Country: ${selectedCountryCode || 'random'}, Province: ${selectedProvinceCode || 'none'}`);
  
  try {
    // Use the new geoBoundaryService for point-in-polygon generation
    const result = await geoBoundaryService.generateCoordinates({
      countryCode: selectedCountryCode,
      provinceCode: selectedProvinceCode,
      count: 1
    });
    
    if (result && result.length > 0) {
      const coord = result[0];
      console.log(`[generateGlobalCoordinatesNew] ✅ Generated coordinate:`, coord);
      return {
        lat: coord.lat,
        lng: coord.lng,
        countryName: coord.country,
        countryCode: coord.countryCode,
        region: 'Unknown', // Will be set by clustering system
        province: coord.province || 'Unknown Province',
        provinceCode: coord.provinceCode,
        city: coord.city || 'Unknown City',
        adminLevel: coord.adminLevel
      };
    }
    
    throw new Error('No coordinates returned from API');
  } catch (error) {
    console.error('[generateGlobalCoordinatesNew] ❌ Failed to generate coordinates:', error);
    
    // Emergency fallback
    return {
      lat: 40.7128,
      lng: -74.0060,
      countryName: 'United States',
      countryCode: 'USA',
      region: 'North America',
      province: 'New York',
      city: 'New York'
    };
  }
}

// Major countries for channel generation
// OLD: Removed MAJOR_COUNTRIES - now using availableCountries state loaded dynamically
// const MAJOR_COUNTRIES = [...COUNTRIES.map(c => ({ code: c.code, name: c.name }))].sort(...);

const TestDataPanel = ({ globeState, setGlobeState }) => {
  // Number input state
  const [numberInput, setNumberInput] = useState('');
  const [channelName, setChannelName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState(''); // NEW: State/Province selection
  const [totalChannelCount, setTotalChannelCount] = useState(0);
  const [visualClusterCount, setVisualClusterCount] = useState(0);
  const [visualEntityCount, setVisualEntityCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSubtype, setSelectedSubtype] = useState(null);
  const [isSafetyActive, setIsSafetyActive] = useState(true);
  const [voteConcentration, setVoteConcentration] = useState(60); // 5-95% - how much the top candidate dominates
  
  // NEW: Dynamic country/province loading
  const [availableCountries, setAvailableCountries] = useState([]);
  const [availableProvinces, setAvailableProvinces] = useState([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  
  // Track when we just cleared to prevent auto-fetch
  const [justCleared, setJustCleared] = useState(false);

  // Track mount time to prevent accidental clearing
  const mountTimeRef = useRef(Date.now());

  // Disable safety after 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSafetyActive(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Load countries from new boundary API on mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        console.log('[TestDataPanel] Loading countries from boundary API...');
        setIsLoadingCountries(true);
        const countries = await geoBoundaryService.listCountries();
        console.log(`[TestDataPanel] Loaded ${countries.length} countries from API`);
        setAvailableCountries(countries);
        setIsLoadingCountries(false);
      } catch (error) {
        console.warn('[TestDataPanel] Boundary API failed, using fallback country data:', error);
        // Fallback to static country data
        const staticCountries = FALLBACK_COUNTRIES.map(country => ({
          code: country.code,
          name: country.name,
          bounds: null // Will be handled by backend coordinate generation
        }));
        console.log(`[TestDataPanel] Loaded ${staticCountries.length} countries from fallback data`);
        setAvailableCountries(staticCountries);
        setIsLoadingCountries(false);
      }
    };
    
    loadCountries();
  }, []);

  // Load provinces when country selected
  useEffect(() => {
    const loadProvinces = async () => {
      if (!selectedCountry || selectedCountry === '') {
        setAvailableProvinces([]);
        return;
      }
      
      try {
        console.log(`[TestDataPanel] Loading provinces for ${selectedCountry}...`);
        setIsLoadingProvinces(true);
        const provinces = await geoBoundaryService.listProvinces(selectedCountry);
        console.log(`[TestDataPanel] Loaded ${provinces.length} provinces:`, provinces.slice(0, 5));
        setAvailableProvinces(provinces);
        setIsLoadingProvinces(false);
      } catch (error) {
        console.warn(`[TestDataPanel] Failed to load provinces for ${selectedCountry}, continuing without provinces:`, error);
        setIsLoadingProvinces(false);
        setAvailableProvinces([]); // Continue without provinces - backend can still generate coordinates for the country
      }
    };
    
    loadProvinces();
  }, [selectedCountry]);

  // Channel type counts with subtypes
  const [channelCounts, setChannelCounts] = useState({
    relay_official: 0,
    proximity: 0,
    regional: 0,
    global: 0,
    gps_map: 0
  });

  // Subtype counts
  const [subtypeCounts, setSubtypeCounts] = useState({
    // Relay Official subtypes
    announcements: 0,
    governance: 0,
    support: 0,
    // Proximity subtypes
    neighborhood: 0,
    city: 0,
    region: 0,
    // Regional subtypes
    community: 0,
    cultural: 0,
    local_business: 0,
    // Global subtypes
    technology: 0,
    environment: 0,
    health: 0,
    // GPS Map subtypes
    navigation: 0,
    traffic: 0,
    points_of_interest: 0,
    boundary: 0
  });

  // Fetch channels function - moved outside useEffect to be accessible from other functions
  const fetchChannels = async () => {
    try {
      console.log('[TestDataPanel] Calling channelAPI.getChannels()...');
      // Try dev-center API first (for country-specific channels), then fall back to regular API
      let response;
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";
        const devCenterResponse = await fetch(`${apiBaseUrl}/api/dev-center/channels`);
        if (devCenterResponse.ok) {
          const devCenterData = await devCenterResponse.json();
          if (devCenterData.success && devCenterData.channels.length > 0) {
            response = { success: true, channels: devCenterData.channels, source: 'dev-center' };
          } else {
            // Fall back to regular API if no dev-center channels
            response = await channelAPI.getChannels();
          }
        } else {
          response = await channelAPI.getChannels();
        }
      } catch (devCenterError) {
        console.log('[TestDataPanel] Dev-center API unavailable, using regular API');
        response = await channelAPI.getChannels();
      }
      console.log('[TestDataPanel] Raw response:', response);
        
        const channels = Array.isArray(response) ? response : (response.channels || []);
        console.log(`[TestDataPanel] Fetched ${channels.length} channels from backend:`, {
          source: response.source || 'unknown',
          channels: channels.slice(0, 3).map(ch => ({
            id: ch.id,
            name: ch.name,
            category: ch.category,
            subtype: ch.subtype,
            color: ch.color
          }))
        });
        
        // Set total count to actual number of channels from backend
        console.log(`[TestDataPanel] Setting total channel count to: ${channels.length}`);
        // Count total candidates across all channels
      const totalCandidates = channels.reduce((sum, channel) => sum + (channel.candidates?.length || 0), 0);
      setTotalChannelCount(totalCandidates);
        
        // Count channels by type and subtype
        const counts = {
          relay_official: 0,
          proximity: 0,
          regional: 0,
          global: 0,
          gps_map: 0
        };
        
        const subtypeCounts = {
          announcements: 0,
          governance: 0,
          support: 0,
          neighborhood: 0,
          city: 0,
          region: 0,
          community: 0,
          cultural: 0,
          local_business: 0,
          technology: 0,
          environment: 0,
          health: 0,
          navigation: 0,
          traffic: 0,
          points_of_interest: 0,
          boundary: 0
        };
        
        // Count channels by category and subtype
        channels.forEach(channel => {
          console.log(`[TestDataPanel] Processing channel: ${channel.name}`, {
            category: channel.category,
            subtype: channel.subtype,
            topics: channel.topics
          });
          
          // Handle channels with explicit category/subtype fields
          if (channel.category && counts.hasOwnProperty(channel.category)) {
            counts[channel.category]++;
            console.log(`[TestDataPanel] Added to category: ${channel.category}`);
          }
          
          if (channel.subtype && subtypeCounts.hasOwnProperty(channel.subtype)) {
            subtypeCounts[channel.subtype]++;
            console.log(`[TestDataPanel] Added to subtype: ${channel.subtype}`);
          }
          
          // Handle default channels that don't have category/subtype fields
          // Categorize them based on their content and topics
          if (!channel.category) {
            if (channel.topics && channel.topics.includes('technology')) {
              counts.global++;
              subtypeCounts.technology++;
              console.log(`[TestDataPanel] Categorized as global/technology: ${channel.name}`);
            } else if (channel.topics && channel.topics.includes('environment')) {
              counts.global++;
              subtypeCounts.environment++;
              console.log(`[TestDataPanel] Categorized as global/environment: ${channel.name}`);
            } else if (channel.topics && channel.topics.includes('politics')) {
              counts.relay_official++;
              subtypeCounts.governance++;
              console.log(`[TestDataPanel] Categorized as relay_official/governance: ${channel.name}`);
            } else {
              // Default fallback for uncategorized channels
              counts.global++;
              subtypeCounts.technology++;
              console.log(`[TestDataPanel] Categorized as global/technology (fallback): ${channel.name}`);
            }
          }
        });
        
        console.log(`[TestDataPanel] Channel counts:`, { counts, subtypeCounts });
        
        setChannelCounts(counts);
        setSubtypeCounts(subtypeCounts);
      } catch (e) {
        console.error('[TestDataPanel] Error fetching channels:', e);
        setTotalChannelCount(0);
        setChannelCounts({ relay_official: 0, proximity: 0, regional: 0, global: 0, gps_map: 0 });
        setSubtypeCounts({
          announcements: 0, governance: 0, support: 0,
          neighborhood: 0, city: 0, region: 0,
          community: 0, cultural: 0, local_business: 0,
          technology: 0, environment: 0, health: 0,
          navigation: 0, traffic: 0, points_of_interest: 0,
          boundary: 0
        });
      }
    };

  // Fetch channel count on mount and after updates
  useEffect(() => {
    // Reset mount time to track when panel was opened
    mountTimeRef.current = Date.now();
    
    // Don't fetch if we just cleared
    if (justCleared) {
      console.log('[TestDataPanel] Skipping auto-fetch because we just cleared');
      setJustCleared(false); // Reset the flag
      return;
    }
    
    console.log('[TestDataPanel] Panel opened - fetching current channels...');
    fetchChannels();
  }, [justCleared]); // Only run on mount or when justCleared changes

  // Number button logic
  const handleNumberButton = (num) => {
    setNumberInput(numberInput + num);
  };

  // Clear all channels
  const clearAllChannels = async () => {
    const timeSinceMount = Date.now() - mountTimeRef.current;
    console.log('[TestDataPanel] clearAllChannels called - checking call stack...');
    console.log('[TestDataPanel] Time since panel mount:', timeSinceMount, 'ms');
    console.trace('[TestDataPanel] Clear all channels call stack:');
    
    // Safety check: prevent accidental clearing right after panel opens
    if (timeSinceMount < 1000) { // Less than 1 second since mount
      console.log('[TestDataPanel] 🛡️ SAFETY: Preventing accidental clear - panel opened', timeSinceMount, 'ms ago');
      return;
    }
    
    setIsGenerating(true);
    try {
      console.log('[TestDataPanel] Clearing all channels...');
      
      // Clear both dev-center and regular channels
      const promises = [];
      
      // Clear dev-center channels
      try {
        console.log('[TestDataPanel] Attempting to clear dev-center channels...');
        const devCenterClearResponse = await fetch('http://localhost:3002/api/dev-center/channels', {
          method: 'DELETE'
        });
        console.log('[TestDataPanel] Dev-center clear response status:', devCenterClearResponse.status);
        if (devCenterClearResponse.ok) {
          const devCenterData = await devCenterClearResponse.json();
          console.log('[TestDataPanel] Dev-center channels cleared:', devCenterData);
        } else {
          const errorText = await devCenterClearResponse.text();
          console.log('[TestDataPanel] Dev-center clear failed with status:', devCenterClearResponse.status, errorText);
        }
      } catch (devCenterError) {
        console.log('[TestDataPanel] Dev-center clear failed:', devCenterError);
      }
      
      // Clear regular channels
      const response = await channelAPI.clearAllChannels();
      console.log('[TestDataPanel] Regular channels clear response:', response);
      
      // Clear channel cache to force refresh
      const { channelUtils } = await import('../utils/channelUtils.js');
      channelUtils.clearCache();
      
      // Reset all counts
      setTotalChannelCount(0);
      setChannelCounts({ relay_official: 0, proximity: 0, regional: 0, global: 0, gps_map: 0 });
      setSubtypeCounts({
        announcements: 0, governance: 0, support: 0,
        neighborhood: 0, city: 0, region: 0,
        community: 0, cultural: 0, local_business: 0,
        technology: 0, environment: 0, health: 0,
        navigation: 0, traffic: 0, points_of_interest: 0,
        boundary: 0
      });
      
      // Set flag to prevent auto-fetch when panel remounts
      setJustCleared(true);
      
      // Update globe state to trigger refresh of cleared state
      if (setGlobeState) {
        setGlobeState(prev => ({
          ...prev,
          channelsUpdated: Date.now()
        }));
      }
      
      // Dispatch a specific clear event that tells components to clear display without fetching
      console.log('🧹 [TestDataPanel] Dispatching channelsCleared event...');
      window.dispatchEvent(new CustomEvent('channelsCleared'));
      console.log('🧹 [TestDataPanel] channelsCleared event dispatched');
      
      // DON'T dispatch refresh events when clearing - this would cause immediate re-fetch
      // Only dispatch these events when generating/adding channels, not when clearing
      // window.dispatchEvent(new CustomEvent('channelsGenerated'));
      // window.dispatchEvent(new CustomEvent('channelsUpdated'));
      
      console.log('[TestDataPanel] All channels cleared successfully');
    } catch (error) {
      console.error('[TestDataPanel] Error clearing all channels:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate candidates for selected subtype (candidates will auto-group into channels by province/country)
  const generateChannels = () => {
    console.log('[TestDataPanel] generateCandidates called with:', { selectedSubtype, numberInput, channelName });
    if (selectedSubtype && numberInput) {
      const candidateCount = parseInt(numberInput);
      if (!isNaN(candidateCount) && candidateCount >= 0) {
        // Add reasonable limit to prevent timeouts and performance issues
        const MAX_CANDIDATES = 5000; // Reasonable limit for performance
        if (candidateCount > MAX_CANDIDATES) {
          alert(`⚠️ Candidate count limited to ${MAX_CANDIDATES} for performance reasons. You requested ${candidateCount} candidates.`);
          console.warn(`[TestDataPanel] Candidate count limited from ${candidateCount} to ${MAX_CANDIDATES}`);
        }
        const actualCandidateCount = Math.min(candidateCount, MAX_CANDIDATES);
        console.log('[TestDataPanel] Starting candidate generation for:', { selectedSubtype, candidateCount: actualCandidateCount, channelName });
        generateSingleChannelWithCandidates(selectedSubtype, actualCandidateCount, channelName);
      } else {
        console.log('[TestDataPanel] Invalid candidate count:', candidateCount);
      }
    } else {
      console.log('[TestDataPanel] Missing required fields:', { selectedSubtype, numberInput });
    }
    setNumberInput('');
    setChannelName(''); // Reset channel name after generation
  };

  // Generate individual candidates spread across country that will auto-group into channels
  const generateSingleChannelWithCandidates = async (subtypeKey, candidateCount, customChannelName = null) => {
    if (typeof candidateCount !== 'number' || !isFinite(candidateCount) || candidateCount < 0) return;
    
    console.log(`[TestDataPanel] Creating ${candidateCount} individual candidates for ${subtypeKey} that will auto-group into channels`);
    
    // 🗺️ BOUNDARY CHANNEL: Use dedicated boundary API instead of regular channel creation
    if (subtypeKey === 'boundary') {
      console.log('🗺️ [TestDataPanel] Detected boundary channel request, using boundary API');
      setIsGenerating(true);
      try {
        // Use the createBoundaryChannel function with the correct signature
        // regionName will be auto-detected from selectedState or selectedCountry
        const boundaryChannel = await createBoundaryChannel(customChannelName, candidateCount, 0);
        console.log('✅ [TestDataPanel] Boundary channel created successfully:', boundaryChannel.name);
        
        // Refresh channel list
        await fetchChannels();
        return;
      } catch (error) {
        console.error('❌ [TestDataPanel] Failed to create boundary channel:', error);
      } finally {
        setIsGenerating(false);
      }
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Find the parent type for this subtype
      const parentType = CHANNEL_TYPES.find(type => 
        type.subtypes.some(subtype => subtype.key === subtypeKey)
      );
      
      if (!parentType) {
        console.error(`[TestDataPanel] Could not find parent type for subtype: ${subtypeKey}`);
        return;
      }

      const channelName = customChannelName || `${subtypeKey}-${Date.now()}`;
      
      // Get selected country and province data from boundary API
      let countryCode = selectedCountry;
      let provinceCode = selectedState;  // Using selectedState from component state
      
      console.log(`[TestDataPanel] 🌍 Selected location: Country=${countryCode}, Province=${provinceCode}`);
      
      // Generate coordinates using the boundary service (point-in-polygon)
      console.log(`[TestDataPanel] � Requesting ${candidateCount} coordinates from boundary service...`);
      
      let coordinates;
      try {
        if (provinceCode && provinceCode !== '') {
          // Generate coordinates within the selected province
          console.log(`[TestDataPanel] 📍 Generating coordinates within province: ${provinceCode}`);
          coordinates = await geoBoundaryService.generateCoordinates({ countryCode, provinceCode, count: candidateCount });
        } else if (countryCode && countryCode !== '') {
          // Generate coordinates within the selected country (distributed across provinces)
          console.log(`[TestDataPanel] �️ Generating coordinates within country: ${countryCode}`);
          coordinates = await geoBoundaryService.generateCoordinates({ countryCode, count: candidateCount });
        } else {
          // 🌍 GLOBAL MODE: No country/province selected - distribute randomly across all countries
          console.log('[TestDataPanel] 🌍 Global mode: Distributing candidates randomly across all countries...');
          
          let countriesToUse = availableCountries;
          if (countriesToUse.length === 0) {
            console.warn('[TestDataPanel] No countries loaded, using fallback for global distribution');
            countriesToUse = FALLBACK_COUNTRIES.slice(0, 20); // Use first 20 countries from fallback data
          }
          
          if (countriesToUse.length === 0) {
            throw new Error('No countries available for global distribution');
          }
          
          console.log(`[TestDataPanel] Using ${countriesToUse.length} countries for global distribution`);
          
          coordinates = [];
          
          // Generate each coordinate in a randomly selected country
          for (let i = 0; i < candidateCount; i++) {
            // Randomly select a country for this candidate
            const randomCountry = countriesToUse[Math.floor(Math.random() * countriesToUse.length)];
            const randomCountryCode = randomCountry.code;
            
            console.log(`[TestDataPanel]   🎯 Candidate ${i + 1}/${candidateCount}: Generating in ${randomCountry.name} (${randomCountryCode})`);
            
            try {
              // Generate 1 coordinate in the randomly selected country
              const countryCoords = await geoBoundaryService.generateCoordinates({ 
                countryCode: randomCountryCode, 
                count: 1 
              });
              
              if (countryCoords && countryCoords.length > 0) {
                coordinates.push(countryCoords[0]);
                console.log(`[TestDataPanel]   ✅ Generated in ${randomCountry.name}: [${countryCoords[0].lat.toFixed(3)}, ${countryCoords[0].lng.toFixed(3)}]`);
              } else {
                console.warn(`[TestDataPanel]   ⚠️ Failed to generate coordinate in ${randomCountry.name}, trying another country...`);
                // Try another random country
                const fallbackCountry = availableCountries[Math.floor(Math.random() * availableCountries.length)];
                const fallbackCoords = await geoBoundaryService.generateCoordinates({ 
                  countryCode: fallbackCountry.code, 
                  count: 1 
                });
                if (fallbackCoords && fallbackCoords.length > 0) {
                  coordinates.push(fallbackCoords[0]);
                  console.log(`[TestDataPanel]   ✅ Fallback to ${fallbackCountry.name}: [${fallbackCoords[0].lat.toFixed(3)}, ${fallbackCoords[0].lng.toFixed(3)}]`);
                } else {
                  console.warn(`[TestDataPanel]   ⚠️ Fallback also failed for ${fallbackCountry.name}, continuing without this candidate`);
                }
              }
            } catch (countryError) {
              console.error(`[TestDataPanel]   ❌ Error generating in ${randomCountry.name}:`, countryError);
              console.error(`[TestDataPanel]   ❌ Full error stack:`, countryError.stack);
              // Continue with next candidate even if this one fails
            }
            
            console.log(`[TestDataPanel]   📊 Progress: ${coordinates.length} coordinates collected so far`);
          }
          
          console.log(`[TestDataPanel] 🌍 Global distribution complete: ${coordinates.length}/${candidateCount} coordinates generated`);
          console.log(`[TestDataPanel] 📋 Final coordinates array:`, coordinates.map(c => ({ lat: c.lat, lng: c.lng, country: c.countryName })));
        }
        
        console.log(`[TestDataPanel] 🔍 Checking coordinates array: length=${coordinates?.length}, type=${typeof coordinates}`);
        
        if (!coordinates || coordinates.length === 0) {
          console.error(`[TestDataPanel] ❌ Coordinates validation failed:`, { coordinates, length: coordinates?.length });
          throw new Error('No coordinates returned from boundary service');
        }
        
        console.log(`[TestDataPanel] ✅ Received ${coordinates.length} coordinates from boundary service`);
        
      } catch (error) {
        console.error('[TestDataPanel] ❌ Failed to generate coordinates:', error);
        alert(`Failed to generate coordinates: ${error.message}`);
        setIsGenerating(false);
        return;
      }
      
      console.log(`[TestDataPanel] Distributing ${candidateCount} candidates across ${countryCode || 'selected region'}`);
      
      // Generate realistic vote distribution following statistical deviation
      const voteDistribution = generateVoteDistribution(candidateCount, voteConcentration);
      console.log(`[TestDataPanel] Generated vote distribution (${voteConcentration}% concentration):`, voteDistribution);
      
      // Create individual candidates using the coordinates from boundary service
      const candidates = [];
      console.log(`[TestDataPanel] 🔄 Creating ${candidateCount} candidates from boundary service coordinates`);
      
      for (let i = 0; i < candidateCount && i < coordinates.length; i++) {
        const coord = coordinates[i];
        
        // Create individual candidate data with administrative hierarchy and coordinates
        const candidate = {
          id: `${channelName}-candidate-${i + 1}`,
          name: `Candidate ${i + 1}`,
          channelName: channelName,
          channelType: parentType.key,
          subtype: subtypeKey,
          // Include actual coordinates for globe rendering
          location: {
            lat: coord.lat,
            lng: coord.lng,
            latitude: coord.lat,  // Alternative format for compatibility
            longitude: coord.lng  // Alternative format for compatibility
          },
          country: countryCode,
          countryName: coord.countryName || countryCode,
          countryCode: countryCode,
          region: coord.region || 'Unknown',
          continent: coord.continent || 'Unknown',
          province: coord.provinceName || coord.province || countryCode,
          provinceCode: coord.provinceCode || provinceCode || '',
          state: coord.provinceName || coord.province || countryCode, // Alternative name for province
          city: coord.city || 'Multiple Cities',
          // Additional administrative data for consistency
          administrativeLevel: provinceCode ? 'province' : 'country',
          isGlobal: false,
          initialVotes: voteDistribution[i] || 1, // Demo/test votes from distribution algorithm
          blockchainVotes: 0, // Real user votes from blockchain (updated dynamically)
          description: `${channelName} candidate ${i + 1} located in ${coord.city || 'Multiple Cities'}, ${coord.provinceName || coord.province || countryCode}, ${coord.countryName || countryCode}`,
          createdAt: new Date().toISOString(),
          isTestData: true
        };
        
        candidates.push(candidate);
        console.log(`[TestDataPanel] ✅ Created candidate ${i + 1}: [${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}] in ${candidate.city}, ${candidate.province}, ${candidate.countryName}`);
      }
      
      console.log(`[TestDataPanel] ✅ Completed coordinate generation for all ${candidateCount} candidates`);
      
      // Create individual candidates that will auto-group into channels by province/country
      let channel = null; // Declare outside try block for error logging
      try {
        console.log(`[TestDataPanel] Creating ${candidateCount} individual candidates that will auto-group by province/country`);
        
        // Create individual candidates with unique names and let them auto-group
        const timestamp = Date.now(); // Use consistent timestamp for all candidates
        const individualCandidates = candidates.map((candidate, index) => ({
          ...candidate,
          name: `${channelName} Candidate ${index + 1}`,
          id: `candidate-${timestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          // Add province/country grouping metadata
          groupingKey: `${candidate.province || candidate.countryName || 'Global'}-${subtypeKey}`,
          autoGroup: true
        }));
        
        console.log(`[TestDataPanel] Generated candidate IDs:`, individualCandidates.map(c => ({ id: c.id, name: c.name, votes: c.votes })));
        
        // Create a single channel with all candidates (no auto-grouping to prevent multiplication)
        console.log(`[TestDataPanel] Creating single channel with ${candidateCount} candidates (no auto-grouping)`);
        
        // Calculate center location from all candidates
        const avgLat = individualCandidates.reduce((sum, c) => sum + c.location.lat, 0) / individualCandidates.length;
        const avgLng = individualCandidates.reduce((sum, c) => sum + c.location.lng, 0) / individualCandidates.length;
        
        // Get selected country data for display name
        const selectedCountryData = availableCountries.find(c => c.code === selectedCountry);
        
        channel = {
          name: channelName,
          description: `${channelName} discussion and voting channel with ${candidateCount} candidates`,
          category: parentType.key,
          subtype: subtypeKey,
          // 🗺️ BOUNDARY CHANNEL FIX: Set type to 'boundary' for boundary channels
          type: subtypeKey === 'boundary' ? 'boundary' : parentType.key,
          candidates: individualCandidates,
          candidateCount: individualCandidates.length,
          // Add location data for globe rendering
          location: {
            latitude: avgLat,
            longitude: avgLng,
            lat: avgLat,  // Alternative format
            lng: avgLng,  // Alternative format
            height: 0.1
          },
          coordinates: [avgLng, avgLat], // Cesium format [lng, lat]
          createdAt: new Date().toISOString(),
          isActive: true,
          isPublic: true,
          color: parentType.color,
          country: selectedCountry || (individualCandidates.length > 0 ? individualCandidates[0].country : 'Global'),
          countryName: selectedCountryData ? selectedCountryData.name : (individualCandidates.length > 0 ? individualCandidates[0].countryName : 'Global'),
          singleChannel: true // Flag to indicate this is a single channel with all candidates
        };
        
        console.log(`[TestDataPanel] 📤 About to create channel with ${individualCandidates.length} candidates:`, {
          channelName: channel.name,
          candidateCount: channel.candidates.length,
          country: channel.country,
          firstCandidate: channel.candidates[0]
        });
        
        const channelPromises = [channelAPI.createChannel(channel)];
        
        const responses = await Promise.all(channelPromises);
        console.log(`[TestDataPanel] ✅ Created ${responses.length} auto-grouped channels successfully:`, responses);
        
      } catch (error) {
        console.error('[TestDataPanel] ❌ Error creating auto-grouped candidates:', error);
        console.error('[TestDataPanel] ❌ Error stack:', error.stack);
        console.error('[TestDataPanel] ❌ Channel data that failed:', channel);
      }
      
      // Wait for blockchain batch to finish writing (maxAgeMs = 500ms + processing time)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Clear channel cache to force refresh
      const { channelUtils } = await import('../utils/channelUtils.js');
      channelUtils.clearCache();
      
      // Determine appropriate cluster level based on geographic scope
      const suggestedClusterLevel = provinceCode ? 'province' : 'country';
      console.log(`[TestDataPanel] 🎯 Suggesting cluster level: ${suggestedClusterLevel} (provinceCode: ${provinceCode})`);
      
      // Dispatch events to update the globe
      window.dispatchEvent(new CustomEvent('candidatesGenerated', {
        detail: { 
          timestamp: Date.now(), 
          subtype: subtypeKey, 
          candidateCount: candidateCount,
          channelName: channelName,
          country: selectedCountry,
          province: provinceCode,
          suggestedClusterLevel: suggestedClusterLevel  // Tell globe to switch to appropriate clustering
        }
      }));
      
      window.dispatchEvent(new CustomEvent('channelsUpdated', {
        detail: { 
          timestamp: Date.now(), 
          subtype: subtypeKey, 
          candidateCount: candidateCount,
          suggestedClusterLevel: suggestedClusterLevel  // Include in channelsUpdated too
        }
      }));
      
      // Refresh channel counts
      await new Promise(resolve => setTimeout(resolve, 200));
      await fetchChannels();
      
      console.log(`[TestDataPanel] Successfully created ${candidateCount} distributed candidates for ${channelName}`);
      
      // Fly camera to show the first candidate (or center of all candidates)
      if (candidates && candidates.length > 0) {
        const firstCandidate = candidates[0];
        const lat = firstCandidate?.location?.lat;
        const lng = firstCandidate?.location?.lng;
        
        if (lat != null && lng != null) {
          console.log(`[TestDataPanel] 📷 Flying camera to first candidate at [${lat}, ${lng}]`);
          
          // Dispatch camera fly event
          window.dispatchEvent(new CustomEvent('flyToLocation', {
            detail: {
              lat: lat,
              lng: lng,
              height: 5000000, // 5000km altitude to see regional spread
              duration: 2 // 2 second flight
            }
          }));
        } else {
          console.warn(`[TestDataPanel] ⚠️ Could not fly camera - no coordinates found in first candidate:`, firstCandidate);
        }
      }
    } catch (error) {
      console.error(`[TestDataPanel] Error creating distributed candidates:`, error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate channels for specific subtype (with performance limits)
  const generateChannelsForSubtype = async (subtypeKey, targetCount, customChannelName = null) => {
    if (typeof targetCount !== 'number' || !isFinite(targetCount) || targetCount < 0) return;
    
    // No limit on channels - allow unlimited creation
    console.log(`[TestDataPanel] Creating ${targetCount} channels for ${subtypeKey} with custom name: ${customChannelName || 'default'}`);
    setIsGenerating(true);
    try {
      console.log(`[TestDataPanel] Generating ${targetCount} channels for subtype: ${subtypeKey}`);
      
      // Find the parent type for this subtype
      const parentType = CHANNEL_TYPES.find(type => 
        type.subtypes.some(subtype => subtype.key === subtypeKey)
      );
      
      if (!parentType) {
        console.error(`[TestDataPanel] Could not find parent type for subtype: ${subtypeKey}`);
        return;
      }

      // Get current channels to count existing ones of this subtype
      const response = await channelAPI.getChannels();
      const channels = Array.isArray(response) ? response : (response.channels || []);
      const existingChannels = channels.filter(channel => 
        channel.subtype === subtypeKey
      );
      const currentCount = existingChannels.length;
      
      console.log(`[TestDataPanel] Current ${subtypeKey} channels: ${currentCount}, target: ${targetCount}`);
      
      if (targetCount > currentCount) {
        // Add channels of this subtype
        const channelsToAdd = targetCount - currentCount;
        console.log(`[TestDataPanel] Adding ${channelsToAdd} ${subtypeKey} channels`);
        
        // Performance optimization: Batch process channels
        const BATCH_SIZE = 5;
        for (let i = 0; i < channelsToAdd; i += BATCH_SIZE) {
          const batch = [];
          const batchEnd = Math.min(i + BATCH_SIZE, channelsToAdd);
          
          console.log(`[TestDataPanel] Creating channels ${i + 1}-${batchEnd}/${channelsToAdd}`);
          
          // Create batch of channels
          for (let j = i; j < batchEnd; j++) {
            const newChannel = createChannelWithFullParameters(parentType.key, subtypeKey, currentCount + j, customChannelName);
            if (newChannel) {
              batch.push(newChannel);
            }
          }
          
          // Process batch
          if (batch.length > 0) {
            try {
              // Process channels in parallel for better performance
              // Use regular API for all generation (persists to blockchain)
              const promises = batch.map(channel => {
                return channelAPI.createChannel(channel);
              });
              const responses = await Promise.all(promises);
              console.log(`[TestDataPanel] Created ${batch.length} channels successfully`);
              
              // Clear channel cache to force refresh
              const { channelUtils } = await import('../utils/channelUtils.js');
              channelUtils.clearCache();
            } catch (error) {
              console.error('[TestDataPanel] Batch channel creation failed:', error);
            }
          }
          
          // Small delay between batches to prevent overwhelming the system
          if (batchEnd < channelsToAdd) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } else if (targetCount < currentCount) {
        // Remove excess channels of this subtype
        const channelsToRemove = existingChannels.slice(targetCount);
        console.log(`[TestDataPanel] Removing ${channelsToRemove.length} ${subtypeKey} channels:`, 
          channelsToRemove.map(ch => ({ id: ch.id, name: ch.name })));
        
        for (const channel of channelsToRemove) {
          console.log(`[TestDataPanel] Deleting channel:`, { id: channel.id, name: channel.name });
          const deleteResponse = await channelAPI.deleteChannel(channel.id);
          console.log(`[TestDataPanel] Delete response:`, deleteResponse);
        }
      }
      
      // Update subtype count
      setSubtypeCounts(prev => ({
        ...prev,
        [subtypeKey]: targetCount
      }));
      
      // Update parent type count
      const newParentCount = Object.keys(subtypeCounts).reduce((sum, key) => {
        const parentTypeForSubtype = CHANNEL_TYPES.find(type => 
          type.subtypes.some(subtype => subtype.key === key)
        );
        if (parentTypeForSubtype && parentTypeForSubtype.key === parentType.key) {
          return sum + (key === subtypeKey ? targetCount : (subtypeCounts[key] || 0));
        }
        return sum;
      }, 0);
      
      setChannelCounts(prev => ({
        ...prev,
        [parentType.key]: newParentCount
      }));
      
      // Update total count
      const newTotal = Object.values({
        ...channelCounts,
        [parentType.key]: newParentCount
      }).reduce((sum, count) => sum + count, 0);
      setTotalChannelCount(newTotal);
      
      // Update globe state to trigger refresh
      if (setGlobeState) {
        setGlobeState(prev => ({
          ...prev,
          channelsUpdated: Date.now()
        }));
      }
      
      // Dispatch immediate refresh event for faster globe update
      window.dispatchEvent(new CustomEvent('channelsGenerated', {
        detail: { timestamp: Date.now(), subtype: subtypeKey, count: targetCount }
      }));
      
      // Also dispatch channelsUpdated event for WorkspaceLayout
      window.dispatchEvent(new CustomEvent('channelsUpdated', {
        detail: { timestamp: Date.now(), subtype: subtypeKey, count: targetCount }
      }));
      
      // Refresh channel counts after generation to ensure UI is up to date
      console.log(`[TestDataPanel] Refreshing channel counts after generation...`);
      // Add a small delay to ensure backend has processed all channel creations
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchChannels(); // Refresh the UI counts
      
      console.log(`[TestDataPanel] Successfully updated ${subtypeKey} channels to ${targetCount}`);
    } catch (error) {
      console.error(`[TestDataPanel] Error generating ${subtypeKey} channels:`, error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate themed candidate names and descriptions based on custom channel name
  const generateThemedCandidate = (channelTheme, index, usedNames) => {
    // All candidates share the same name (the channel theme)
    const candidateName = channelTheme;
    
    // But each has a unique themed description/role
    const themedRoles = [
      'Champion', 'Advocate', 'Expert', 'Specialist', 'Enthusiast', 
      'Supporter', 'Leader', 'Voice', 'Guardian', 'Friend', 'Activist',
      'Protector', 'Educator', 'Researcher', 'Volunteer', 'Organizer'
    ];
    
    const themedActions = [
      'Advocating for better', 'Promoting responsible', 'Supporting improved', 
      'Pushing for enhanced', 'Championing quality', 'Defending the rights of',
      'Proposing new policies for', 'Fighting for better', 'Establishing programs for',
      'Creating awareness about', 'Building community around', 'Protecting',
      'Educating the public about', 'Researching solutions for', 'Organizing events for'
    ];
    
    const themedBenefits = [
      'welfare and safety', 'care and protection', 'health and wellbeing',
      'rights and freedoms', 'education and training', 'community programs',
      'public spaces and facilities', 'regulation and oversight', 'research and development',
      'awareness and education', 'support services', 'conservation efforts',
      'rescue operations', 'adoption programs', 'medical care'
    ];
    
    const role = themedRoles[index % themedRoles.length];
    const action = themedActions[index % themedActions.length];
    const benefit = themedBenefits[index % themedBenefits.length];
    const description = `${channelTheme} ${role}: ${action} ${channelTheme.toLowerCase()} ${benefit}.`;
    
    return {
      name: candidateName, // All candidates have the same name
      description: description // But unique descriptions
    };
  };

  // Create a boundary channel (special type for boundary modifications)
  const createBoundaryChannel = async (proposalName, candidateCount, index) => {
    // Determine region name from dropdown selections (NOT from proposal name)
    let finalRegionName;
    
    if (selectedState && selectedState !== '') {
      // State/province selected - FIRST PRIORITY
      finalRegionName = selectedState;
    } else if (selectedCountry && selectedCountry !== '') {
      // Country selected - SECOND PRIORITY
      const country = availableCountries.find(c => c.code === selectedCountry);
      finalRegionName = country ? country.name : 'United States';
    } else {
      // No geographic selection - use default
      finalRegionName = 'United States'; // Default to US for now
    }
    
    console.log('[TestDataPanel] Creating boundary channel for region:', finalRegionName, 'with proposal:', proposalName, 'candidates:', candidateCount);
    
    try {
      // Call backend API to generate boundary modification channel
      console.log('🌐 [TestDataPanel] Calling POST /api/channels/boundary/generate');
      const response = await fetch('/api/channels/boundary/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          regionName: finalRegionName,
          regionType: null, // Auto-detect from regions.json
          candidateCount: candidateCount || 3,
          modificationType: 'random'
        })
      });

      console.log('📡 [TestDataPanel] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [TestDataPanel] Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to generate boundary channel');
      }

      const data = await response.json();
      console.log('📦 [TestDataPanel] Response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate boundary channel');
      }

      console.log('✅ [TestDataPanel] Boundary channel generated:', data.channel.name);
      console.log('🔍 [TestDataPanel] Channel type info:', {
        type: data.channel.type,
        subtype: data.channel.subtype,
        category: data.channel.category
      });
      
      // Return the complete channel data from backend with special boundary styling
      return {
        ...data.channel,
        // Add visual markers for boundary channels
        color: '#8b5cf6', // Purple for boundary channels
        isBoundaryChannel: true, // Special flag
        showBoundaryLines: true, // Trigger boundary rendering
        // Add any additional frontend-specific properties
        voteCount: 0,
        memberCount: 0,
        activeUsers: 0,
        isActive: true,
        isPublic: true,
        cesiumCompatible: true,
        cubeSystem: 'cesium',
        participants: 0,
        topics: ['boundary_modification'],
        parameters: {
          voteDuration: 30,
          voteDecayDuration: 90,
          minimumQuorum: 500,
          minimumUsers: 250,
          chatFilterThreshold: -10
        },
        newsfeed: [],
        chatroom: {
          messages: [],
        },
        userScores: {},
        activeUsers: []
      };
    } catch (error) {
      console.error('❌ [TestDataPanel] Failed to create boundary channel:', error);
      
      // Return error channel object
      return {
        name: `${finalRegionName} Boundary (Error)`,
        description: `Failed to generate boundary channel: ${error.message}`,
        category: 'gps_map',
        subtype: 'boundary',
        type: 'boundary',
        location: { lat: 0, lng: 0, height: 0.1, radius: 50000 },
        candidates: [],
        error: error.message,
        createdAt: new Date().toISOString()
      };
    }
  };

  const createChannelWithFullParameters = (typeKey, subtypeKey, index, customChannelName = null, candidateCount = null) => {
    console.log('[TestDataPanel] createChannelWithFullParameters called with:', { typeKey, subtypeKey, index, customChannelName, candidateCount });
    const type = CHANNEL_TYPES.find(t => t.key === typeKey);
    const subtype = type.subtypes.find(s => s.key === subtypeKey);
    
    if (!type || !subtype) {
      console.error('[TestDataPanel] Invalid type or subtype:', { typeKey, subtypeKey, type, subtype });
      return null;
    }
    
    // Special handling for boundary channels
    if (subtypeKey === 'boundary') {
      return createBoundaryChannel(customChannelName, candidateCount, index);
    }
    
    // NEW: Use API to get country data if needed for bounds
    // For now, use simple default coordinates - backend will generate accurate point-in-polygon coordinates
    let lat = 41.9028; // Default to Rome, Italy
    let lng = 12.4964;
    
    if (selectedCountry && selectedCountry !== '') {
      // Try to get country from available countries for better defaults
      const country = availableCountries.find(c => c.code === selectedCountry);
      if (country && country.bounds) {
        const bounds = country.bounds;
        lat = (bounds.south + bounds.north) / 2;
        lng = (bounds.west + bounds.east) / 2;
      }
    }
    
    console.log(`[TestDataPanel] Using initial coordinates: [${lat.toFixed(4)}, ${lng.toFixed(4)}] (backend will generate accurate point-in-polygon)`);
    
    // Generate random vote counts and user counts
    const voteCount = Math.floor(Math.random() * 1000) + 50;
    const userCount = Math.floor(Math.random() * 500) + 10;
    // Use provided candidateCount or generate random if not provided
    const finalCandidateCount = candidateCount || Math.floor(Math.random() * 8) + 4;
    
    // Country-specific candidate names
    const getCountrySpecificCandidates = (countryCode) => {
      const countryNames = {
        'US': ['Jennifer Washington', 'Michael Rodriguez', 'Ashley Thompson', 'Robert Chen', 'Maria Garcia', 'Steve Johnson', 'Lisa Park', 'Carlos Martinez', 'Amanda Davis', 'Kevin Lee'],
        'GB': ['Oliver Smith', 'Emma Davies', 'James Wilson', 'Sophie Clarke', 'Thomas Evans', 'Charlotte Brown', 'William Jones', 'Amelia Taylor', 'George White', 'Isabella Harris'],
        'DE': ['Klaus Mueller', 'Anna Schmidt', 'Hans Weber', 'Petra Fischer', 'Wolfgang Bauer', 'Markus Hoffmann', 'Sabine Wagner', 'Thomas Richter', 'Claudia Zimmermann', 'Stefan Koch'],
        'JP': ['Hiroshi Tanaka', 'Yuki Sato', 'Kenji Yamamoto', 'Akiko Watanabe', 'Takeshi Ito', 'Masaki Suzuki', 'Naomi Kobayashi', 'Ryouta Nakamura', 'Sayuri Hayashi', 'Daisuke Kimura'],
        'IN': ['Rajesh Sharma', 'Priya Patel', 'Amit Kumar', 'Sunita Gupta', 'Vikram Singh', 'Arjun Mehta', 'Kavya Reddy', 'Rohit Agarwal', 'Neha Jain', 'Sanjay Verma'],
        'BR': ['Carlos Silva', 'Ana Santos', 'Roberto Oliveira', 'Maria Costa', 'João Ferreira', 'Pedro Almeida', 'Lucia Rodrigues', 'Fernando Lima', 'Carla Pereira', 'Ricardo Souza'],
        'FR': ['Pierre Dubois', 'Marie Martin', 'Jean Bernard', 'Sophie Leroy', 'Antoine Moreau', 'Camille Petit', 'Nicolas Simon', 'Isabelle Laurent', 'Julien Michel', 'Céline Garcia'],
        'CN': ['Li Wei', 'Wang Mei', 'Zhang Ming', 'Liu Yan', 'Chen Hao', 'Yang Li', 'Zhao Jun', 'Wu Ling', 'Xu Feng', 'Sun Yu'],
        'RU': ['Alexei Petrov', 'Natasha Ivanova', 'Dmitri Volkov', 'Elena Kozlova', 'Sergei Popov', 'Olga Smirnova', 'Pavel Fedorov', 'Irina Morozova', 'Viktor Orlov', 'Svetlana Novikova']
      };
      
      return countryNames[countryCode] || [
        'Alex Chen', 'Maria Garcia', 'James Wilson', 'Sarah Johnson',
        'David Lee', 'Emily Brown', 'Michael Davis', 'Lisa Anderson',
        'Robert Taylor', 'Jennifer Martinez', 'William Thompson', 'Amanda White',
        'Christopher Rodriguez', 'Jessica Lewis', 'Daniel Clark', 'Ashley Hall',
        'Matthew Young', 'Nicole King', 'Joshua Wright', 'Stephanie Green',
        'Ryan Miller', 'Sofia Patel', 'Kevin Johnson', 'Rachel Adams',
        'Brandon Lee', 'Michelle Kim', 'Tyler Wilson', 'Hannah Davis',
        'Andrew Chen', 'Isabella Rodriguez', 'Nathan Thompson', 'Olivia Martinez'
      ];
    };

    // Get candidate names based on selected country
    const country = selectedCountry || 'Global';
    const candidateNames = getCountrySpecificCandidates(country);

    // Helper function to get country name from code
    const getCountryName = (countryCode) => {
      const countryNames = {
        'US': 'United States', 'CN': 'China', 'IN': 'India', 'BR': 'Brazil', 'RU': 'Russia',
        'JP': 'Japan', 'DE': 'Germany', 'GB': 'United Kingdom', 'FR': 'France', 'IT': 'Italy',
        'CA': 'Canada', 'AU': 'Australia', 'KR': 'South Korea', 'MX': 'Mexico', 'ES': 'Spain',
        'TR': 'Turkey', 'ID': 'Indonesia', 'NL': 'Netherlands', 'SA': 'Saudi Arabia', 'CH': 'Switzerland',
        'TW': 'Taiwan', 'BE': 'Belgium', 'AR': 'Argentina', 'IE': 'Ireland', 'IL': 'Israel',
        'TH': 'Thailand', 'PL': 'Poland', 'NG': 'Nigeria', 'EG': 'Egypt', 'ZA': 'South Africa',
        'PH': 'Philippines', 'VN': 'Vietnam', 'MY': 'Malaysia', 'SG': 'Singapore', 'BD': 'Bangladesh',
        'PK': 'Pakistan', 'CL': 'Chile', 'FI': 'Finland', 'NO': 'Norway', 'SE': 'Sweden',
        'DK': 'Denmark', 'AT': 'Austria', 'NZ': 'New Zealand', 'GR': 'Greece', 'PT': 'Portugal',
        'CZ': 'Czech Republic', 'HU': 'Hungary', 'RO': 'Romania', 'UA': 'Ukraine', 'KE': 'Kenya', 'GH': 'Ghana'
      };
      return countryNames[countryCode] || countryCode;
    };
    
    const regions = [
      'North America', 'Europe', 'Asia Pacific', 'South America', 'Africa',
      'Middle East', 'Scandinavia', 'Mediterranean', 'Caribbean', 'Oceania',
      'Central America', 'Eastern Europe', 'Western Europe', 'Southeast Asia',
      'East Asia', 'South Asia', 'North Africa', 'Sub-Saharan Africa'
    ];
    
    const topicArgumentOptions = {
      neighborhood: [
        'Advocating for increased green spaces and community gardens to improve air quality and provide recreational areas for families.',
        'Proposing a neighborhood watch program with digital monitoring systems to enhance security while maintaining privacy.',
        'Supporting local business development through tax incentives and streamlined permitting processes.',
        'Pushing for improved public transportation with dedicated bike lanes and electric vehicle charging stations.',
        'Advocating for affordable housing initiatives with mixed-income developments and rent control measures.',
        'Proposing community center expansion with youth programs, senior services, and cultural events.',
        'Supporting renewable energy adoption with solar panel subsidies and community energy cooperatives.',
        'Pushing for better waste management with composting programs and recycling incentives.',
        'Advocating for improved street lighting and sidewalk maintenance for pedestrian safety.',
        'Proposing digital infrastructure upgrades with free public WiFi and smart city technologies.'
      ],
      city: [
        'Advocating for comprehensive public transportation reform with expanded metro lines and electric buses.',
        'Proposing urban development policies that prioritize affordable housing and mixed-use communities.',
        'Supporting green infrastructure projects including rooftop gardens and urban forests.',
        'Pushing for smart city initiatives with IoT sensors and data-driven governance.',
        'Advocating for cultural district development with arts funding and creative economy support.',
        'Proposing economic development strategies focused on tech startups and innovation hubs.',
        'Supporting public health initiatives with accessible healthcare and mental health services.',
        'Pushing for educational reform with vocational training and digital literacy programs.',
        'Advocating for environmental sustainability with carbon neutrality goals and green building codes.',
        'Proposing public safety improvements with community policing and crime prevention programs.'
      ],
      regional: [
        'Advocating for regional economic integration with shared infrastructure and trade agreements.',
        'Proposing environmental protection policies with cross-border conservation efforts.',
        'Supporting cultural exchange programs and regional tourism development.',
        'Pushing for renewable energy grids with inter-regional power sharing.',
        'Advocating for educational collaboration with shared research institutions and student exchanges.',
        'Proposing transportation networks with high-speed rail and regional airports.',
        'Supporting healthcare systems with shared medical facilities and emergency response.',
        'Pushing for digital infrastructure with regional broadband and smart city networks.',
        'Advocating for agricultural cooperation with sustainable farming and food security.',
        'Proposing disaster preparedness with regional emergency response and climate adaptation.'
      ],
      global: [
        'Advocating for international climate agreements with binding emissions targets and green technology transfer.',
        'Proposing global trade reforms with fair labor standards and environmental protections.',
        'Supporting international development with sustainable infrastructure and capacity building.',
        'Pushing for global health initiatives with vaccine distribution and pandemic preparedness.',
        'Advocating for human rights protection with international courts and accountability mechanisms.',
        'Proposing global education programs with digital learning platforms and skill development.',
        'Supporting international security cooperation with conflict resolution and peacekeeping.',
        'Pushing for global financial reform with digital currencies and inclusive banking.',
        'Advocating for cultural preservation with UNESCO partnerships and heritage protection.',
        'Proposing space exploration cooperation with shared research and sustainable development.'
      ]
    };
    
    // Generate realistic vote distribution following statistical deviation
    const voteDistribution = generateVoteDistribution(finalCandidateCount);
    console.log(`[TestDataPanel] Generated vote distribution for ${finalCandidateCount} candidates:`, voteDistribution);
    
    // Create candidates with realistic data
    const candidates = [];
    const usedNames = new Set();
    
    for (let i = 0; i < finalCandidateCount; i++) {
      let candidateName, argument;
      
      if (customChannelName) {
        // Generate themed candidate based on custom channel name
        const themedCandidate = generateThemedCandidate(customChannelName, i, usedNames);
        candidateName = themedCandidate.name;
        argument = themedCandidate.description;
      } else {
        // Use original random generation
        do {
          candidateName = candidateNames[Math.floor(Math.random() * candidateNames.length)];
        } while (usedNames.has(candidateName));
        usedNames.add(candidateName);
        
        const argumentType = typeKey === 'proximity' ? 'neighborhood' : 
                            typeKey === 'regional' ? 'regional' : 
                            typeKey === 'global' ? 'global' : 'city';
        const argumentList = topicArgumentOptions[argumentType] || topicArgumentOptions.neighborhood;
        argument = argumentList[Math.floor(Math.random() * argumentList.length)];
      }
      
      const region = regions[Math.floor(Math.random() * regions.length)];
      
      // Use realistic vote distribution from statistical model
      const votes = voteDistribution[i] || 1;
      
      // Coordinates will be generated by backend
      
      candidates.push({
        id: `candidate-${index}-${i + 1}`,
        name: candidateName,
        initialVotes: votes, // Demo/test votes
        blockchainVotes: 0, // Real user votes
        description: argument,
        region: region,
        type: typeKey,
        scope: typeKey,
        // Coordinates will be generated by backend
        username: candidateName.toLowerCase().replace(' ', '_') + Math.floor(Math.random() * 1000)
      });
    }
    
    const channel = {
      name: customChannelName || `${subtype.label} Channel ${index}`,
      description: customChannelName ? `${customChannelName} discussion and voting channel` : `Generated ${subtype.label.toLowerCase()} channel for ${type.label.toLowerCase()} category${country ? ` in ${getCountryName(country)}` : ''}`,
      category: typeKey,
      subtype: subtypeKey,
      type: typeKey, // Add type field for compatibility
      country: country,
      countryName: country ? getCountryName(country) : null,
      
      // Cesium-compatible 3D world position coordinates
      location: {
        lat: lat,
        lng: lng,
        height: 0.1, // Default height for Cesium positioning
        radius: typeKey === 'proximity' ? 500 : typeKey === 'regional' ? 5000 : 50000
      },
      
      // Vote count and user statistics
      voteCount: voteCount,
      memberCount: userCount,
      activeUsers: Math.floor(userCount * 0.7), // 70% active
      
      // Candidates per channel
      candidates: candidates,
      candidateCount: finalCandidateCount, // Use the actual count that was used to generate candidates
      
      // Timestamp
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Channel status
      isActive: true,
      isPublic: true,
      
      // Type-specific parameters
      channelType: typeKey,
      topicRow: `${subtypeKey}_${typeKey}`,
      
      // Channel color matching the type
      color: type.color,
      
      // Cesium-specific metadata
      cesiumCompatible: true,
      cubeSystem: 'cesium',
      
      // Backend compatibility fields
      participants: userCount,
      topics: ['general'],
      
      // Governance parameters
      parameters: {
        voteDuration: 7,
        voteDecayDuration: 30,
        minimumQuorum: typeKey === 'proximity' ? 50 : typeKey === 'regional' ? 100 : 200,
        minimumUsers: typeKey === 'proximity' ? 25 : typeKey === 'regional' ? 50 : 100,
        chatFilterThreshold: -10
      },
      
      // Communication spaces
      newsfeed: [],
      chatroom: {
        messages: [],
        userScores: {},
        activeUsers: []
      },
      
      // Evolution tracking
      evolutionHistory: [],
      originalChannel: null
    };
    
    return channel;
  };

  // Handle subtype selection
  const handleSubtypeSelect = (subtypeKey) => {
    setSelectedSubtype(subtypeKey);
    setNumberInput('');
  };

  return (
    <div style={{ 
      padding: 12, 
      boxSizing: 'border-box', 
      width: '100%', 
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Total Candidates Display */}
      <div style={{ 
        fontSize: 16, 
        color: '#fff', 
        fontWeight: 600, 
        textAlign: 'center',
        marginBottom: 16,
        padding: '8px 16px',
        background: 'rgba(108, 71, 255, 0.1)',
        borderRadius: 8,
        border: '1px solid #6c47ff'
      }}>
        Total Candidates: <span style={{ color: '#6c47ff' }}>{totalChannelCount}</span>
      </div>

      {/* Selected Subtype Indicator */}
      {selectedSubtype && (
        <div style={{
          background: 'rgba(108, 71, 255, 0.1)',
          border: '1px solid #6c47ff',
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: 12,
          color: '#6c47ff',
          fontWeight: 600,
          textAlign: 'center',
          marginBottom: 12
        }}>
          Selected: {CHANNEL_TYPES.flatMap(t => t.subtypes).find(s => s.key === selectedSubtype)?.label}
        </div>
      )}

      {/* Channel Types Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 8, 
        marginBottom: 16 
      }}>
        {CHANNEL_TYPES.map((type) => (
          <div
            key={type.key}
            style={{
              background: 'rgba(30,34,54,0.98)',
              borderRadius: 8,
              padding: 12,
              border: `2px solid ${type.color}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              minHeight: 120,
              transition: 'all 0.2s ease',
            }}
          >
            {/* Type Label */}
            <div style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: type.color,
              textAlign: 'center'
            }}>
              {type.label}
            </div>
            
            {/* Description */}
            <div style={{ 
              fontSize: 10, 
              color: '#666', 
              textAlign: 'center',
              lineHeight: 1.2
            }}>
              {type.description}
            </div>
            
            {/* Total Channel Count Display */}
            <div style={{
              background: `rgba(${type.key === 'relay_official' ? '108, 71, 255' : 
                                   type.key === 'proximity' ? '34, 197, 94' :
                                   type.key === 'regional' ? '59, 130, 246' : 
                                   type.key === 'global' ? '245, 158, 11' : '236, 72, 153'}, 0.1)`,
              borderRadius: 6,
              padding: '6px 12px',
              border: `1px solid ${type.color}`,
              textAlign: 'center',
              minWidth: 60
            }}>
              <div style={{ fontSize: 10, color: type.color, marginBottom: 1 }}>Total</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {channelCounts[type.key]}
              </div>
            </div>
            
            {/* Subtype Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {type.subtypes.map((subtype) => (
                <div
                  key={subtype.key}
                  onClick={() => handleSubtypeSelect(subtype.key)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                    background: selectedSubtype === subtype.key 
                      ? `rgba(${type.key === 'relay_official' ? '108, 71, 255' : 
                                type.key === 'proximity' ? '34, 197, 94' :
                                type.key === 'regional' ? '59, 130, 246' : '245, 158, 11'}, 0.2)`
                      : 'rgba(255,255,255,0.05)',
                    borderRadius: 4,
                    fontSize: 10,
                    cursor: 'pointer',
                    border: selectedSubtype === subtype.key 
                      ? `1px solid ${type.color}` 
                      : '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s ease',
                    transform: selectedSubtype === subtype.key ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <span style={{ color: '#bfc9d9' }}>{subtype.label}</span>
                  <span style={{ 
                    color: type.color, 
                    fontWeight: 600,
                    fontSize: 11
                  }}>
                    {subtypeCounts[subtype.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Channel Name Input */}
      <div style={{
        width: '100%',
        marginBottom: 8
      }}>
        <input
          type="text"
          placeholder="Enter channel name (optional)"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          style={{
            width: '100%',
            background: '#1a1d29',
            border: '1px solid #2d314a',
            borderRadius: 4,
            padding: '8px 12px',
            fontSize: 14,
            color: '#fff',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#6c47ff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#2d314a';
          }}
          disabled={isGenerating}
        />
      </div>

      {/* Country Selection Dropdown */}
      <div style={{
        width: '100%',
        marginBottom: 8
      }}>
        <select
          value={selectedCountry}
          onChange={(e) => {
            setSelectedCountry(e.target.value);
            setSelectedState(''); // Reset state when country changes
          }}
          style={{
            width: '100%',
            background: '#1a1d29',
            border: '1px solid #2d314a',
            borderRadius: 4,
            padding: '8px 12px',
            fontSize: 14,
            color: '#fff',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            cursor: 'pointer'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#6c47ff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#2d314a';
          }}
          disabled={isGenerating}
        >
          <option value="">Global (No specific country)</option>
          {isLoadingCountries ? (
            <option disabled>Loading countries...</option>
          ) : (
            availableCountries.map(country => (
              <option key={country.code} value={country.code} style={{ background: '#1a1d29', color: '#fff' }}>
                {country.name}
              </option>
            ))
          )}
        </select>
        <div style={{
          fontSize: 10,
          color: '#666',
          marginTop: 4,
          textAlign: 'center'
        }}>
          🌍 {isLoadingCountries ? 'Loading...' : `${availableCountries.length} countries available`}
        </div>
      </div>

      {/* State/Province Selection Dropdown (DYNAMICALLY POPULATED FROM API) */}
      {selectedCountry && selectedCountry !== '' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          marginBottom: 12
        }}>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#1a1d29',
              border: '1px solid #2d314a',
              borderRadius: 4,
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer'
            }}
            disabled={isGenerating || isLoadingProvinces}
          >
            <option value="">All Provinces/States</option>
            {isLoadingProvinces ? (
              <option disabled>Loading provinces...</option>
            ) : (
              availableProvinces.map(province => (
                <option key={province.code} value={province.code} style={{ background: '#1a1d29', color: '#fff' }}>
                  {province.name}
                </option>
              ))
            )}
          </select>
          <div style={{
            fontSize: 10,
            color: '#666',
            textAlign: 'center'
          }}>
            📍 {isLoadingProvinces ? 'Loading...' : `${availableProvinces.length} provinces available`}
          </div>
        </div>
      )}

      {/* OLD CODE REMOVED - Now handled above */}
      {false && selectedCountry && selectedCountry !== '' && (() => {
        const country = getCountryByCode(selectedCountry);
        const provinces = country?.provinces || [];
        const hasProvinces = provinces.length > 0;
        
        return (
          <div style={{
            width: '100%',
            marginBottom: 8
          }}>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{
                width: '100%',
                background: '#1a1d29',
                border: selectedSubtype === 'boundary' ? '1px solid #8b5cf6' : '1px solid #2d314a',
                borderRadius: 4,
                padding: '8px 12px',
                fontSize: 14,
                color: hasProvinces ? '#fff' : '#666',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                cursor: hasProvinces ? 'pointer' : 'not-allowed'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = selectedSubtype === 'boundary' ? '#a78bfa' : '#6c47ff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = selectedSubtype === 'boundary' ? '#8b5cf6' : '#2d314a';
              }}
              disabled={isGenerating || !hasProvinces}
            >
              <option value="" style={{ background: '#1a1d29', color: '#fff' }}>
                {hasProvinces 
                  ? `${country.name} (Country-level)` 
                  : `${country.name} (No provinces available)`}
              </option>
              {provinces.map(province => (
                <option 
                  key={province.name} 
                  value={province.name} 
                  style={{ background: '#1a1d29', color: '#fff' }}
                >
                  {province.name}
                </option>
              ))}
            </select>
            <div style={{
              fontSize: 10,
              color: selectedSubtype === 'boundary' ? '#8b5cf6' : hasProvinces ? '#666' : '#999',
              marginTop: 4,
              textAlign: 'center'
            }}>
              {!hasProvinces 
                ? `📍 ${country.name} has no province data (country-level only)` 
                : selectedSubtype === 'boundary' 
                  ? `🗺️ Select from ${provinces.length} provinces for boundary modification` 
                  : `📍 Select from ${provinces.length} provinces or use country-level`}
            </div>
          </div>
        );
      })()}

      {/* Vote Concentration Slider */}
      <div style={{
        width: '100%',
        marginBottom: 12,
        background: '#1e2235',
        borderRadius: 6,
        padding: '12px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Vote Concentration</span>
          <span style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#6c47ff',
            fontFamily: 'monospace'
          }}>
            {voteConcentration}%
          </span>
        </div>
        <input
          type="range"
          min="5"
          max="95"
          value={voteConcentration}
          onChange={(e) => setVoteConcentration(parseInt(e.target.value))}
          disabled={isGenerating}
          style={{
            width: '100%',
            height: 6,
            borderRadius: 3,
            outline: 'none',
            opacity: isGenerating ? 0.5 : 1,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            accentColor: '#6c47ff'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 10,
          color: '#666'
        }}>
          <span>5% (Competitive)</span>
          <span>95% (Consensus)</span>
        </div>
        <div style={{
          marginTop: 8,
          fontSize: 10,
          color: '#9ca3af',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          {voteConcentration >= 85 ? '💡 High consensus (e.g., "Should we eat puppies?")' :
           voteConcentration >= 60 ? '⚖️ Balanced competition' :
           voteConcentration >= 40 ? '🗳️ Competitive race (e.g., presidential election)' :
           '🔥 Highly competitive (many viable candidates)'}
        </div>
      </div>

      {/* Number Input Display */}
      <div style={{
        width: '100%',
        background: '#23263a',
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: 18,
        color: '#fff',
        textAlign: 'right',
        minHeight: 32,
        marginBottom: 8,
        border: isGenerating ? '2px solid #6c47ff' : '1px solid #23263a',
        fontFamily: 'monospace'
      }}>
        {numberInput || '0'}
      </div>

      {/* Status Indicator */}
      <div style={{
        width: '100%',
        padding: '4px 8px',
        fontSize: 10,
        color: isGenerating ? '#6c47ff' : selectedSubtype ? '#22c55e' : '#666',
        textAlign: 'center',
        marginBottom: 8,
        background: isGenerating ? 'rgba(108, 71, 255, 0.1)' : selectedSubtype ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
        borderRadius: 4,
      }}>
        {isGenerating ? '🔄 Generating...' : 
         selectedSubtype ? `Click number to generate ${selectedSubtype} candidates${channelName ? ` named "${channelName}"` : ''} (auto-grouped by province/country)` :
         'Select a subtype above'}
      </div>

      {/* Simple Number Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(11, 1fr)', 
        gap: 4,
        marginBottom: 8
      }}>
        {NUMBER_BUTTONS.map((num) => (
          <button
            key={num}
            onClick={() => handleNumberButton(num)}
            style={{
              height: 32,
              fontSize: 14,
              borderRadius: 4,
              border: 'none',
              background: '#23263a',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              opacity: isGenerating ? 0.6 : 1,
            }}
            onMouseOver={e => {
              if (!isGenerating) {
                e.currentTarget.style.background = '#2d314a';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = '#23263a';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            disabled={isGenerating}
          >
            {num}
          </button>
        ))}
        <button
          onClick={clearAllChannels}
          style={{
            height: 32,
            fontSize: 12,
            borderRadius: 4,
            border: 'none',
            background: isSafetyActive ? '#666' : '#ef4444',
            color: '#fff',
            fontWeight: 600,
            cursor: isSafetyActive || isGenerating ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            opacity: isGenerating ? 0.6 : 1,
          }}
          onMouseOver={e => {
            if (!isGenerating && !isSafetyActive) {
              e.currentTarget.style.background = '#f56565';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = isSafetyActive ? '#666' : '#ef4444';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          disabled={isGenerating || isSafetyActive}
        >
          {isSafetyActive ? 'Wait...' : 'Clear All'}
        </button>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateChannels}
        style={{
          width: '100%',
          height: 40,
          fontSize: 16,
          borderRadius: 6,
          border: 'none',
          background: '#6c47ff',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          opacity: isGenerating ? 0.6 : 1,
          boxShadow: '0 2px 6px rgba(108,71,255,0.3)',
        }}
        onMouseOver={e => {
          if (!isGenerating) {
            e.currentTarget.style.background = '#7d5fff';
            e.currentTarget.style.transform = 'scale(1.02)';
          }
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = '#6c47ff';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        disabled={isGenerating || !selectedSubtype || !numberInput}
      >
        {isGenerating ? '🔄 Generating...' : 'Generate Candidates'}
      </button>

      {/* Fly to Channels Button */}
      <button
        onClick={() => {
          console.log('[TestDataPanel] 📷 Manual fly to channels button clicked');
          // Fly to world view to see all channels
          window.dispatchEvent(new CustomEvent('flyToLocation', {
            detail: {
              lat: 0,
              lng: 0,
              height: 20000000, // 20,000km altitude for world view
              duration: 2
            }
          }));
        }}
        style={{
          width: '100%',
          height: 36,
          fontSize: 14,
          borderRadius: 6,
          border: '1px solid #4a90e2',
          background: '#2a4a6a',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          marginTop: 8,
          boxShadow: '0 2px 4px rgba(74,144,226,0.2)',
        }}
        onMouseOver={e => {
          e.currentTarget.style.background = '#3a5a7a';
          e.currentTarget.style.transform = 'scale(1.01)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = '#2a4a6a';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        📷 Fly to World View (See All Channels)
      </button>
    </div>
  );
};

export default TestDataPanel; 
