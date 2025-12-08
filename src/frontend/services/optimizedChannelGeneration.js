/**
 * Performance-Optimized Channel Generation Service
 * Handles bulk channel creation with WebGL rendering optimization
 */

// Import the new batch renderer
import CesiumBatchRenderer from '../../services/cesiumBatchRenderer.js';

/**
 * Enhanced generateSingleChannelWithCandidates function with performance optimization
 * Replaces the existing sequential coordinate generation with bulk processing
 */
export async function generateSingleChannelWithCandidatesOptimized(
  subtypeKey, 
  candidateCount, 
  customChannelName = null,
  options = {}
) {
  console.log(`🚀 [OPTIMIZED] Creating ${candidateCount} candidates for ${subtypeKey} with bulk processing`);
  
  const {
    selectedCountry = '',
    selectedState = '',
    availableCountries = [],
    voteConcentration = 60,
    useBulkAPI = candidateCount > 100, // Use bulk API for large requests
    batchSize = 250 // Optimal batch size
  } = options;

  if (typeof candidateCount !== 'number' || !isFinite(candidateCount) || candidateCount < 0) {
    throw new Error('Invalid candidate count');
  }

  // Find the parent type for this subtype
  const parentType = window.CHANNEL_TYPES?.find(type => 
    type.subtypes.some(subtype => subtype.key === subtypeKey)
  );
  
  if (!parentType) {
    throw new Error(`Could not find parent type for subtype: ${subtypeKey}`);
  }

  let coordinates = [];

  try {
    if (useBulkAPI && candidateCount > 100) {
      console.log(`⚡ [OPTIMIZED] Using bulk coordinate API for ${candidateCount} candidates`);
      
      // Use the new bulk coordinate generation API
      const bulkRequests = [];
      
      if (selectedState && selectedState !== '') {
        // Generate all coordinates in the selected province
        bulkRequests.push({
          countryCode: selectedCountry,
          provinceCode: selectedState,
          count: candidateCount
        });
      } else if (selectedCountry && selectedCountry !== '') {
        // Split large requests into manageable batches for the country
        const numBatches = Math.ceil(candidateCount / batchSize);
        for (let i = 0; i < numBatches; i++) {
          const batchCount = Math.min(batchSize, candidateCount - (i * batchSize));
          bulkRequests.push({
            countryCode: selectedCountry,
            count: batchCount
          });
        }
      } else {
        // Global distribution across multiple countries
        if (availableCountries.length === 0) {
          throw new Error('No countries available for global distribution');
        }
        
        // Distribute candidates across multiple countries
        const candidatesPerCountry = Math.ceil(candidateCount / Math.min(10, availableCountries.length));
        const selectedCountries = availableCountries
          .sort(() => Math.random() - 0.5) // Shuffle
          .slice(0, Math.min(10, availableCountries.length)); // Max 10 countries
        
        for (const country of selectedCountries) {
          const remaining = candidateCount - bulkRequests.reduce((sum, req) => sum + req.count, 0);
          if (remaining <= 0) break;
          
          const countForThisCountry = Math.min(candidatesPerCountry, remaining);
          bulkRequests.push({
            countryCode: country.code,
            count: countForThisCountry
          });
        }
      }

      console.log(`⚡ [OPTIMIZED] Making ${bulkRequests.length} bulk coordinate requests`);

      // Call the new bulk coordinate API
      const response = await fetch('http://localhost:3002/api/channels/bulk-coordinates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: bulkRequests,
          optimize: true
        })
      });

      if (!response.ok) {
        throw new Error(`Bulk coordinate API failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        coordinates = data.coordinates;
        console.log(`✅ [OPTIMIZED] Bulk API generated ${coordinates.length} coordinates`);
      } else {
        throw new Error(data.error || 'Bulk coordinate generation failed');
      }

    } else {
      console.log(`📍 [OPTIMIZED] Using regular coordinate generation for ${candidateCount} candidates`);
      
      // Use existing coordinate generation for smaller requests
      const { geoBoundaryService } = await import('../../services/geoBoundaryService.js');
      
      if (selectedState && selectedState !== '') {
        coordinates = await geoBoundaryService.generateCoordinates({ 
          countryCode: selectedCountry, 
          provinceCode: selectedState, 
          count: candidateCount 
        });
      } else if (selectedCountry && selectedCountry !== '') {
        coordinates = await geoBoundaryService.generateCoordinates({ 
          countryCode: selectedCountry, 
          count: candidateCount 
        });
      } else {
        // Global distribution
        coordinates = [];
        for (let i = 0; i < candidateCount; i++) {
          const randomCountry = availableCountries[Math.floor(Math.random() * availableCountries.length)];
          const countryCoords = await geoBoundaryService.generateCoordinates({ 
            countryCode: randomCountry.code, 
            count: 1 
          });
          if (countryCoords && countryCoords.length > 0) {
            coordinates.push(countryCoords[0]);
          }
        }
      }
    }

    if (!coordinates || coordinates.length === 0) {
      throw new Error('No coordinates generated');
    }

    console.log(`✅ [OPTIMIZED] Generated ${coordinates.length} coordinates successfully`);

    // Generate vote distribution
    const voteDistribution = generateVoteDistribution(coordinates.length, voteConcentration);

    // Create candidates with the generated coordinates
    const candidates = coordinates.map((coord, index) => ({
      id: `candidate-${Date.now()}-${index}`,
      name: generateCandidateName(customChannelName, index),
      initialVotes: voteDistribution[index] || 1,
      blockchainVotes: 0,
      description: generateCandidateDescription(subtypeKey, customChannelName),
      location: {
        lat: coord.lat,
        lng: coord.lng,
        height: 100
      },
      country: coord.country || coord.countryName || 'Unknown',
      countryCode: coord.countryCode || 'Unknown',
      province: coord.province || 'Unknown Province',
      city: coord.city || 'Unknown City',
      region: coord.region || 'Unknown',
      type: parentType.key,
      scope: parentType.key,
      username: `user_${index}_${Date.now()}`
    }));

    // Create the channel with all candidates
    const channel = {
      name: customChannelName || `${subtypeKey}-${Date.now()}`,
      description: customChannelName ? 
        `${customChannelName} discussion and voting channel` : 
        `Generated ${subtypeKey} channel with ${candidates.length} candidates`,
      category: parentType.key,
      subtype: subtypeKey,
      type: parentType.key,
      candidates: candidates,
      candidateCount: candidates.length,
      location: getChannelCentroid(candidates),
      voteCount: voteDistribution.reduce((sum, votes) => sum + votes, 0),
      memberCount: Math.floor(candidates.length * 2.5),
      createdAt: new Date().toISOString(),
      isActive: true,
      isPublic: true,
      color: parentType.color,
      country: selectedCountry || 'Global',
      countryName: selectedCountry || 'Global',
      singleChannel: true,
      optimizedGeneration: true // Flag to indicate this used optimized generation
    };

    console.log(`📤 [OPTIMIZED] Creating channel with ${candidates.length} candidates`);

    // Use existing channel API to create the channel
    const { channelAPI } = await import('../../services/apiClient.js');
    const result = await channelAPI.createChannel(channel);

    console.log(`✅ [OPTIMIZED] Successfully created optimized channel: ${channel.name}`);
    return result;

  } catch (error) {
    console.error(`❌ [OPTIMIZED] Error in optimized channel generation:`, error);
    throw error;
  }
}

/**
 * Vote distribution generation (copied from existing implementation)
 */
function generateVoteDistribution(candidateCount, concentration = 60) {
  const votes = [];
  const totalVotes = 10000;
  const topCandidateShare = concentration / 100;

  if (candidateCount === 1) {
    votes.push(totalVotes);
    return votes;
  }

  const firstCandidateVotes = Math.floor(totalVotes * topCandidateShare);
  votes.push(firstCandidateVotes);

  let remainingVotes = totalVotes - firstCandidateVotes;
  const remainingCandidates = candidateCount - 1;

  if (remainingCandidates === 1) {
    votes.push(remainingVotes);
  } else {
    const decayRate = 0.5 + (topCandidateShare * 0.3);
    
    if (remainingCandidates > 500) {
      // Simplified distribution for large candidate counts
      const topCandidateCount = Math.floor(remainingCandidates * 0.1);
      const regularCandidateCount = remainingCandidates - topCandidateCount;
      const topPoolVotes = Math.floor(remainingVotes * 0.8);
      const regularPoolVotes = remainingVotes - topPoolVotes;

      // Top candidates get exponential decay
      for (let i = 0; i < topCandidateCount; i++) {
        const decayFactor = Math.pow(decayRate, i + 1);
        const candidateVotes = Math.floor(topPoolVotes * decayFactor * 0.5);
        votes.push(Math.max(candidateVotes, 1));
      }

      // Regular candidates get equal distribution
      const regularVotePerCandidate = Math.floor(regularPoolVotes / regularCandidateCount);
      for (let i = 0; i < regularCandidateCount; i++) {
        votes.push(Math.max(regularVotePerCandidate, 1));
      }
    } else {
      // Standard distribution
      for (let i = 0; i < remainingCandidates; i++) {
        const decayFactor = Math.pow(decayRate, i + 1);
        const candidateVotes = Math.floor(remainingVotes * decayFactor * 0.4);
        votes.push(Math.max(candidateVotes, 1));
      }
    }
  }

  // Ensure total matches
  const currentTotal = votes.reduce((sum, v) => sum + v, 0);
  if (currentTotal !== totalVotes) {
    const difference = totalVotes - currentTotal;
    votes[0] += difference;
  }

  return votes;
}

/**
 * Generate candidate name based on theme
 */
function generateCandidateName(customChannelName, index) {
  if (customChannelName) {
    return `${customChannelName} Candidate ${index + 1}`;
  }
  
  const names = [
    'Alex Johnson', 'Sarah Chen', 'Michael Rodriguez', 'Emily Davis', 
    'David Wilson', 'Jessica Brown', 'James Miller', 'Ashley Garcia'
  ];
  
  return names[index % names.length] + ` ${Math.floor(index / names.length) + 1}`;
}

/**
 * Generate candidate description
 */
function generateCandidateDescription(subtypeKey, customChannelName) {
  if (customChannelName) {
    return `Advocate for ${customChannelName} initiatives and community engagement.`;
  }
  
  const descriptions = {
    technology: 'Promoting technological innovation and digital transformation.',
    environment: 'Advocating for environmental protection and sustainability.',
    governance: 'Supporting transparent governance and democratic processes.',
    community: 'Building stronger communities through collaboration.',
    health: 'Advancing public health and wellness initiatives.'
  };
  
  return descriptions[subtypeKey] || 'Working for positive community change.';
}

/**
 * Calculate channel centroid from candidates
 */
function getChannelCentroid(candidates) {
  if (!candidates || candidates.length === 0) return null;

  let totalLat = 0;
  let totalLng = 0;
  let validCount = 0;

  for (const candidate of candidates) {
    if (candidate.location && candidate.location.lat && candidate.location.lng) {
      totalLat += candidate.location.lat;
      totalLng += candidate.location.lng;
      validCount++;
    }
  }

  if (validCount === 0) return null;

  return {
    lat: totalLat / validCount,
    lng: totalLng / validCount,
    height: 100
  };
}

/**
 * Performance monitoring utilities
 */
export class ChannelGenerationMonitor {
  constructor() {
    this.stats = {
      totalChannels: 0,
      totalCandidates: 0,
      averageGenerationTime: 0,
      bulkAPIUsage: 0,
      regularAPIUsage: 0
    };
  }

  recordGeneration(candidateCount, generationTime, usedBulkAPI) {
    this.stats.totalChannels++;
    this.stats.totalCandidates += candidateCount;
    
    // Running average
    const totalTime = this.stats.averageGenerationTime * (this.stats.totalChannels - 1) + generationTime;
    this.stats.averageGenerationTime = totalTime / this.stats.totalChannels;
    
    if (usedBulkAPI) {
      this.stats.bulkAPIUsage++;
    } else {
      this.stats.regularAPIUsage++;
    }
  }

  getStats() {
    return { ...this.stats };
  }

  getPerformanceReport() {
    const bulkPercentage = (this.stats.bulkAPIUsage / this.stats.totalChannels) * 100;
    return {
      ...this.stats,
      bulkAPIPercentage: bulkPercentage.toFixed(1),
      candidatesPerSecond: (this.stats.totalCandidates / (this.stats.averageGenerationTime / 1000)).toFixed(1)
    };
  }
}

export const channelGenerationMonitor = new ChannelGenerationMonitor();