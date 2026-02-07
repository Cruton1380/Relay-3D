/**
 * Region Assignment Service
 * 
 * Handles candidate-to-region mapping using point-in-polygon (PIP) checks
 * Assigns candidates to the smallest containing region in the hierarchy
 */

import fs from 'fs';
import path from 'path';

// Simple point-in-polygon implementation using ray casting algorithm
const pointInPolygon = (point, polygon) => {
  const [x, y] = point;
  const coordinates = polygon.coordinates[0];
  let inside = false;
  
  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const [xi, yi] = coordinates[i];
    const [xj, yj] = coordinates[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
};

// Debug function to test PIP with sample points
const debugPointInPolygon = (point, region) => {
  const result = pointInPolygon(point, region.geometry);
  console.log(`🔍 PIP Debug: Point [${point[0]}, ${point[1]}] in ${region.name}: ${result}`);
  return result;
};

// Find the smallest containing region for a candidate
const findSmallestContainingRegion = (candidate, regions) => {
  const { lat, lng } = candidate.location;
  const point = [lng, lat]; // GeoJSON uses [lng, lat] order
  
  // Sort regions by type hierarchy (smallest to largest)
  const typeHierarchy = ['city', 'state', 'country', 'region', 'world'];
  const sortedRegions = Object.values(regions).sort((a, b) => {
    const aIndex = typeHierarchy.indexOf(a.type);
    const bIndex = typeHierarchy.indexOf(b.type);
    return aIndex - bIndex;
  });
  
  // Find the smallest region that contains the point
  for (const region of sortedRegions) {
    if (pointInPolygon(point, region.geometry)) {
      console.log(`🔍 Region Assignment: Candidate at [${point[0]}, ${point[1]}] assigned to ${region.name} (${region.type})`);
      return region;
    }
  }
  
  console.log(`🔍 Region Assignment: No region contains point [${point[0]}, ${point[1]}], using fallback`);
  
  // If no region contains the point, find the nearest "OTHER" region
  return findNearestOtherRegion(point, regions);
};

// Find the nearest "OTHER" region as fallback
const findNearestOtherRegion = (point, regions) => {
  const [lng, lat] = point;
  let nearestRegion = null;
  let minDistance = Infinity;
  
  for (const region of Object.values(regions)) {
    if (region.type === 'other') {
      const [regionLng, regionLat] = region.centroid;
      const distance = Math.sqrt(
        Math.pow(lng - regionLng, 2) + Math.pow(lat - regionLat, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestRegion = region;
      }
    }
  }
  
  return nearestRegion || regions['WORLD']; // Fallback to WORLD
};

// Build the complete region hierarchy for a candidate
const buildRegionHierarchy = (candidate, regions) => {
  const smallestRegion = findSmallestContainingRegion(candidate, regions);
  const regionIds = [];
  
  // Start from the smallest region and work up the hierarchy
  let currentRegion = smallestRegion;
  while (currentRegion) {
    regionIds.unshift(currentRegion.id);
    currentRegion = regions[currentRegion.parent_id];
  }
  
  console.log(`🔍 Hierarchy for candidate: ${regionIds.join(' → ')}`);
  return regionIds;
};

// Assign regions to a candidate
const assignCandidateToRegions = (candidate, regions) => {
  const regionIds = buildRegionHierarchy(candidate, regions);
  
  return {
    candidate_id: candidate.id,
    lat: candidate.location.lat,
    lng: candidate.location.lng,
    region_ids: regionIds,
    primary_region: regionIds[0], // Smallest containing region
    hierarchy: regionIds
  };
};

// Assign regions to all candidates in channels
const assignChannelsToRegions = (channels, regions) => {
  const assignments = [];
  
  // Test some sample points first
  const testPoints = [
    [-122.4194, 37.7749], // San Francisco
    [-119.4179, 37.1848], // California center
    [-95.7129, 37.0902],  // USA center
    [0, 0]                // World center
  ];
  
  console.log('🔍 Region Assignment: Testing sample points...');
  for (const point of testPoints) {
    const region = findSmallestContainingRegion({ location: { lat: point[1], lng: point[0] } }, regions);
    console.log(`🔍 Test Point [${point[0]}, ${point[1]}]: ${region.name} (${region.type})`);
  }
  
  for (const channel of channels) {
    for (const candidate of channel.candidates || []) {
      if (candidate.location && candidate.location.lat && candidate.location.lng) {
        const assignment = assignCandidateToRegions(candidate, regions);
        assignments.push(assignment);
        
        // Add region assignment to candidate for easy access
        candidate.region_assignment = assignment;
      }
    }
  }
  
  console.log(`🔍 Region Assignment: Created ${assignments.length} assignments`);
  
  // Log some sample assignments
  if (assignments.length > 0) {
    console.log('🔍 Sample assignments:');
    assignments.slice(0, 3).forEach(assignment => {
      console.log(`  - ${assignment.candidate_id}: ${assignment.primary_region} (${assignment.region_ids.join(' → ')})`);
    });
  }
  
  return assignments;
};

// Update vote counts in regions based on candidate assignments
const updateRegionVotes = (regions, candidateAssignments, channels = []) => {
  // Reset vote counts
  for (const region of Object.values(regions)) {
    region.direct_votes = 0;
    region.aggregated_votes = 0;
    region.votes = 0;
  }
  
  // Calculate direct votes (candidates directly in each region)
  for (const assignment of candidateAssignments) {
    const primaryRegionId = assignment.primary_region;
    const region = regions[primaryRegionId];
    
    if (region) {
      // Find the candidate to get vote count from channels
      let voteCount = 0;
      for (const channel of channels) {
        for (const candidate of channel.candidates || []) {
          if (candidate.id === assignment.candidate_id) {
            voteCount = (candidate.votes || 0) + (candidate.testVotes || 0) + (candidate.realVotes || 0);
            break;
          }
        }
        if (voteCount > 0) break;
      }
      
      region.direct_votes += voteCount;
    }
  }
  
  // Calculate aggregated votes (roll up from children)
  const calculateAggregatedVotes = (regionId) => {
    const region = regions[regionId];
    if (!region) return 0;
    
    // Find all child regions
    const childRegions = Object.values(regions).filter(r => r.parent_id === regionId);
    
    // Sum up votes from children
    let childVotes = 0;
    for (const child of childRegions) {
      childVotes += calculateAggregatedVotes(child.id);
    }
    
    // Total votes = direct votes + aggregated votes from children
    region.aggregated_votes = childVotes;
    region.votes = region.direct_votes + region.aggregated_votes;
    
    console.log(`🔍 Vote Aggregation: ${region.name} - Direct: ${region.direct_votes}, Aggregated: ${region.aggregated_votes}, Total: ${region.votes}`);
    
    return region.votes;
  };
  
  // Calculate from top down
  calculateAggregatedVotes('WORLD');
  
  return regions;
};

export {
  pointInPolygon,
  findSmallestContainingRegion,
  buildRegionHierarchy,
  assignCandidateToRegions,
  assignChannelsToRegions,
  updateRegionVotes
};
