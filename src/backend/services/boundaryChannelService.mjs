/**
 * @fileoverview Boundary Channel Service - HIERARCHICAL VOTING SYSTEM
 * 
 * Manages official Relay channels for regional boundary proposals with democratic voting.
 * Each region has ONE unified boundary channel where multiple boundary proposals compete.
 * 
 * HIERARCHICAL VOTING RULES (One Level Up):
 * - City boundaries    → Voted by Province residents
 * - Province boundaries → Voted by Country residents  
 * - Country boundaries  → Voted by Region/Continent residents
 * - Region boundaries   → Voted by World (all users)
 * 
 * The highest-voted boundary proposal becomes the active boundary used for vote clustering.
 * 
 * @version 2.0 - On-Globe Editor with Hierarchical Voting
 * @date October 8, 2025
 */

import regionalGovernanceService from './regionalGovernanceService.mjs';
import { logger } from '../utils/logging/logger.mjs';
// import voteService from '../vote-service/index.mjs'; // REMOVED: Git-native backend
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { naturalEarthLoader } from './naturalEarthLoader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class BoundaryChannelService {
  constructor() {
    this.boundaryChannelsFile = join(__dirname, '../../data/channels/boundary-channels.json');
    this.boundaryChannels = new Map(); // channelId -> channel
    this.regionChannelIndex = new Map(); // regionCode -> channelId (for fast lookups)
    this.initialized = false;
  }

  /**
   * Initialize the boundary channel system
   * @param {boolean} forceRegenerate - If true, clears existing channels and regenerates from scratch
   */
  async initialize(forceRegenerate = false) {
    if (this.initialized) {
      console.log('🗺️ Boundary channel service already initialized');
      return;
    }

    try {
      console.log('🗺️ Initializing boundary channel service (v2.0 - Hierarchical Voting)...');

      if (forceRegenerate) {
        console.log('🔄 Force regenerate flag set - clearing all existing channels');
        this.boundaryChannels.clear();
        this.regionChannelIndex.clear();
      } else {
        // Load existing boundary channels
        await this.loadBoundaryChannels();
      }

      this.initialized = true;
      console.log('✅ Boundary channel service initialized with hierarchical voting system');
    } catch (error) {
      console.error('❌ Error initializing boundary channel service:', error);
      // Don't throw - allow server to start even if boundary channels fail
      this.initialized = false;
    }
  }

  /**
   * Get or auto-create boundary channel for a region (NEW v2.0)
   * This is the main entry point - channels are created on-demand
   * 
   * @param {string} regionName - Display name (e.g., "India", "California")
   * @param {string} regionType - Type: "city", "province", "country", "region"
   * @param {string} regionCode - ISO code (e.g., "IND", "US-CA", "US-CA-SF")
   * @returns {Promise<Object>} - The boundary channel object
   */
  async getOrCreateBoundaryChannel(regionName, regionType, regionCode) {
    console.log(`🗺️ [BOUNDARY CHANNEL] Request for: ${regionName} (${regionType}, ${regionCode})`);

    // Check cache first
    if (this.regionChannelIndex.has(regionCode)) {
      const channelId = this.regionChannelIndex.get(regionCode);
      const channel = this.boundaryChannels.get(channelId);
      
      if (channel) {
        console.log(`✅ [BOUNDARY CHANNEL] Found cached channel: ${channelId}`);
        return channel;
      }
    }

    // Search existing channels
    const existingChannel = this.findBoundaryChannelByRegion(regionCode);
    if (existingChannel) {
      console.log(`✅ [BOUNDARY CHANNEL] Found existing channel: ${existingChannel.id}`);
      this.regionChannelIndex.set(regionCode, existingChannel.id);
      return existingChannel;
    }

    // Create new boundary channel
    console.log(`📝 [BOUNDARY CHANNEL] Creating new boundary channel for ${regionName}...`);
    const newChannel = await this.createBoundaryChannel(regionName, regionType, regionCode);
    
    // Cache it
    this.regionChannelIndex.set(regionCode, newChannel.id);
    console.log(`✅ [BOUNDARY CHANNEL] Created and cached: ${newChannel.id}`);
    
    return newChannel;
  }

  /**
   * Create a new boundary channel for a region (v2.0 - Single unified channel)
   * 
   * @param {string} regionName - Display name
   * @param {string} regionType - "city", "province", "country", "region"
   * @param {string} regionCode - ISO code
   * @returns {Promise<Object>} - New channel object
   */
  async createBoundaryChannel(regionName, regionType, regionCode) {
    const channelId = `boundary-${regionCode}-${crypto.randomBytes(4).toString('hex')}`;
    
    // Determine voting scope (one level up)
    const votingScope = this.getVotingScope(regionType);
    const votingRegion = await this.getVotingRegion(regionCode, regionType);
    const votingDescription = this.getVotingDescription(regionType);

    // Create unified boundary channel (no segments)
    const channelData = {
      id: channelId,
      name: `${regionName} Boundaries`,
      type: 'boundary',
      subtype: 'geographic-boundary',
      category: regionName, // Geographic category (e.g., "India", "California")
      
      // Region metadata
      regionName: regionName,
      regionCode: regionCode,
      regionType: regionType, // "city", "province", "country", "region"
      
      // NEW: Hierarchical voting system
      votingScope: votingScope,           // "province", "country", "region", "world"
      votingRegion: votingRegion,         // Parent region code
      votingRestriction: true,            // Only parent region can vote
      votingDescription: votingDescription,
      
      // Official Relay channel flags
      isRelayOfficial: true,
      isOfficial: true,
      channelPurpose: 'boundary_modification',
      
      description: `Democratic boundary proposals for ${regionName}. ${votingDescription}. Multiple proposals compete via voting - the highest-voted boundary becomes the active boundary used for vote clustering.`,
      
      // Metadata
      metadata: {
        regionType: regionType,
        affectsVoteClustering: true,
        hierarchicalVoting: true,
        votingScope: votingScope,
        votingRegion: votingRegion,
        createdAt: Date.now(),
        version: '2.0'
      },
      
      // Candidates (boundary proposals) - starts empty
      candidates: [],
      
      // Auto-created flag
      autoCreated: true,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      totalVotes: 0
    };

    // Add to storage
    this.boundaryChannels.set(channelId, channelData);
    this.regionChannelIndex.set(regionCode, channelId);

    // Create default "Current Official Boundary" proposal
    await this.createOfficialBoundaryProposal(channelData, regionName, regionType, regionCode);

    // Save to disk
    await this.saveBoundaryChannels();

    console.log(`✅ [BOUNDARY CHANNEL] Created unified boundary channel: ${channelData.name}`);
    console.log(`   → Voting Scope: ${votingScope} (${votingRegion})`);
    console.log(`   → ${votingDescription}`);

    return channelData;
  }

  /**
   * Determine voting scope (one level up)
   */
  getVotingScope(regionType) {
    const hierarchy = {
      'city': 'province',
      'province': 'country',
      'country': 'region',
      'region': 'world'
    };
    return hierarchy[regionType] || 'world';
  }

  /**
   * Get parent region code for voting
   */
  async getVotingRegion(regionCode, regionType) {
    if (regionType === 'city') {
      // City code format: "US-CA-SF" → Return "US-CA" (province)
      const parts = regionCode.split('-');
      return parts.slice(0, 2).join('-');
    } else if (regionType === 'province') {
      // Province code format: "US-CA" → Return "US" (country)
      return regionCode.split('-')[0];
    } else if (regionType === 'country') {
      // Country code: "IND" → Return region (e.g., "ASIA")
      return await this.getCountryRegion(regionCode);
    } else if (regionType === 'region') {
      // Region → World
      return 'WORLD';
    }
    return 'WORLD';
  }

  /**
   * Get continent/region for a country code
   */
  async getCountryRegion(countryCode) {
    // Simplified region mapping (expand as needed)
    const countryToRegion = {
      'IND': 'ASIA',
      'CHN': 'ASIA',
      'JPN': 'ASIA',
      'KOR': 'ASIA',
      'PAK': 'ASIA',
      'BGD': 'ASIA',
      'USA': 'NORTH_AMERICA',
      'CAN': 'NORTH_AMERICA',
      'MEX': 'NORTH_AMERICA',
      'BRA': 'SOUTH_AMERICA',
      'ARG': 'SOUTH_AMERICA',
      'GBR': 'EUROPE',
      'DEU': 'EUROPE',
      'FRA': 'EUROPE',
      'ITA': 'EUROPE',
      'ESP': 'EUROPE',
      'ZAF': 'AFRICA',
      'NGA': 'AFRICA',
      'EGY': 'AFRICA',
      'AUS': 'OCEANIA',
      'NZL': 'OCEANIA'
    };
    
    return countryToRegion[countryCode] || 'WORLD';
  }

  /**
   * Get voting description for UI
   */
  getVotingDescription(regionType) {
    const descriptions = {
      'city': 'Voting restricted to province residents (city boundaries affect provincial aggregation)',
      'province': 'Voting restricted to country residents (province boundaries affect national aggregation)',
      'country': 'Voting open to region/continent residents (country boundaries affect regional politics)',
      'region': 'Voting open to all global users (regional boundaries affect world politics)'
    };
    return descriptions[regionType] || 'Voting open to all users';
  }

  /**
   * Check if user can vote on boundary proposal (HIERARCHICAL VOTING)
   * 
   * @param {string} userId - User ID
   * @param {string} channelId - Boundary channel ID
   * @returns {Promise<Object>} - { canVote: boolean, reason: string }
   */
  async canUserVote(userId, channelId) {
    const channel = this.boundaryChannels.get(channelId);
    
    if (!channel || channel.type !== 'boundary') {
      return { canVote: false, reason: 'Not a boundary channel' };
    }

    // TODO: Get user's location from user service
    // For now, allow all votes (implement location checking later)
    const userLocation = await this.getUserLocation(userId);
    
    if (!userLocation) {
      return { canVote: false, reason: 'User location unknown - please enable location services' };
    }

    // Check if user is in voting region (one level up)
    const votingRegion = channel.votingRegion;
    const userIsInVotingRegion = await this.isUserInRegion(userId, votingRegion, userLocation);

    if (!userIsInVotingRegion) {
      return { 
        canVote: false, 
        reason: `Only ${votingRegion} residents can vote on ${channel.regionName} boundaries` 
      };
    }

    return { canVote: true };
  }

  /**
   * Get user's location (stub - implement with user service)
   */
  async getUserLocation(userId) {
    // TODO: Integrate with userLocationService
    // For now, return mock location for testing
    return {
      country: 'IND',
      province: 'IN-DL', // Delhi
      city: 'IN-DL-NEW', // New Delhi
      lat: 28.6139,
      lng: 77.2090
    };
  }

  /**
   * Check if user is in a specific region (stub)
   */
  async isUserInRegion(userId, regionCode, userLocation) {
    // TODO: Implement proper region checking with point-in-polygon
    // For now, allow all votes for testing
    return true;
  }

  /**
   * Find existing boundary channel by region code
   */
  findBoundaryChannelByRegion(regionCode) {
    for (const [channelId, channel] of this.boundaryChannels.entries()) {
      if (channel.regionCode === regionCode) {
        return channel;
      }
    }
    return null;
  }

  /**
   * Create official boundary proposal (default candidate)
   */
  async createOfficialBoundaryProposal(channel, regionName, regionType, regionCode) {
    // Load actual boundary geometry from Natural Earth data
    let officialGeometry;
    try {
      console.log(`[BoundaryChannel] Loading boundary geometry for ${regionName} (${regionCode}, ${regionType})`);
      // Pass regionName as third parameter - critical for provinces!
      officialGeometry = await naturalEarthLoader.getBoundaryGeometry(regionCode, regionType, regionName);
      
      // Validate geometry has coordinates
      if (!officialGeometry.coordinates || officialGeometry.coordinates.length === 0) {
        console.warn(`[BoundaryChannel] Invalid geometry returned for ${regionCode}, using placeholder`);
        officialGeometry = naturalEarthLoader.getPlaceholderGeometry();
      } else {
        // Count total vertices for logging
        let totalVertices = 0;
        if (officialGeometry.type === 'Polygon') {
          // Polygon: coordinates[0] is outer ring array of [lon, lat] points
          totalVertices = officialGeometry.coordinates[0].length;
        } else if (officialGeometry.type === 'MultiPolygon') {
          // MultiPolygon: coordinates is array of polygons, each polygon has rings
          totalVertices = officialGeometry.coordinates.reduce((sum, polygon) => {
            return sum + polygon[0].length; // Count outer ring vertices of each polygon
          }, 0);
        }
        console.log(`[BoundaryChannel] Successfully loaded ${officialGeometry.type} with ${totalVertices} total vertices for ${regionName}`);
      }
    } catch (error) {
      console.error(`[BoundaryChannel] Failed to load geometry for ${regionCode}:`, error);
      officialGeometry = naturalEarthLoader.getPlaceholderGeometry();
    }

    const officialProposal = {
      id: `official-${channel.id}`,
      name: `${regionName} - Official Boundary`,
      username: `official-${regionCode}`,
      type: 'boundary',
      subtype: 'proposal',
      isDefault: true,
      isOfficial: true,
      
      // Location data (GeoJSON)
      location: {
        type: 'polygon',
        geometry: officialGeometry,
        regionName: regionName,
        regionCode: regionCode
      },
      
      // Metadata
      description: `Official recognized boundary for ${regionName}. This boundary is currently used for vote clustering and regional identification.`,
      bio: `Official boundary loaded from Natural Earth dataset. This is the current active boundary.`,
      
      votes: 0, // Starts at 0, will receive blockchain votes
      initialVotes: Math.floor(Math.random() * 50) + 120, // Base demo votes: 120-170
      createdAt: Date.now(),
      proposedBy: 'relay-system',
      
      metadata: {
        source: 'natural-earth',
        official: true,
        regionType: regionType
      }
    };

    channel.candidates.push(officialProposal);
    channel.totalVotes = officialProposal.votes; // Initialize total votes
    
    // Initialize vote counts in VoteService (GIT-NATIVE: via query hook)
    const voteId = `${channel.id}-${officialProposal.id}`;
    // voteService.initializeCandidateVotes(voteId, officialProposal.initialVotes); // REMOVED
    console.log(`ℹ️ Git-native: Added official boundary proposal to ${channel.name} with ${officialProposal.initialVotes} base votes`);
  }

  /**
   * Load existing boundary channels from disk
   */
  async loadBoundaryChannels() {
    try {
      if (existsSync(this.boundaryChannelsFile)) {
        const data = JSON.parse(readFileSync(this.boundaryChannelsFile, 'utf-8'));
        
        // Convert to Map for efficient lookups and initialize vote counts
        for (const [channelId, channel] of Object.entries(data.channels || {})) {
          this.boundaryChannels.set(channelId, channel);
          
          // Initialize VoteService with existing candidates' vote counts
          if (channel.candidates && channel.candidates.length > 0) {
            for (const candidate of channel.candidates) {
              const voteId = `${channelId}-${candidate.id}`;
              const initialVotes = candidate.initialVotes || candidate.votes || 0;
              // if (initialVotes > 0) {
              //   voteService.initializeCandidateVotes(voteId, initialVotes); // REMOVED: Git-native
              // }
            }
            console.log(`  🗳️ Initialized ${channel.candidates.length} candidates for ${channel.name}`);
          }
        }
        
        console.log(`📂 Loaded ${this.boundaryChannels.size} existing boundary channels with vote counts`);
      } else {
        console.log('📂 No existing boundary channels file, starting fresh');
      }
    } catch (error) {
      console.error('Error loading boundary channels:', error);
      this.boundaryChannels = new Map();
    }
  }

  /**
   * Save boundary channels to disk
   */
  async saveBoundaryChannels() {
    try {
      const data = {
        channels: Object.fromEntries(this.boundaryChannels),
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      };

      // Ensure directory exists
      const dir = dirname(this.boundaryChannelsFile);
      if (!existsSync(dir)) {
        const fs = await import('fs');
        fs.mkdirSync(dir, { recursive: true });
      }

      writeFileSync(
        this.boundaryChannelsFile,
        JSON.stringify(data, null, 2),
        'utf-8'
      );

      console.log(`💾 Saved ${this.boundaryChannels.size} boundary channels`);
    } catch (error) {
      console.error('Error saving boundary channels:', error);
    }
  }

  /**
   * Auto-create boundary channels for all regions
   */
  async initializeBoundaryChannels() {
    try {
      console.log('🏗️ Creating boundary channels for all regions...');

      const regions = regionalGovernanceService.regions;

      if (!regions || !regions.regions) {
        console.warn('⚠️ No regions data available, skipping boundary channel creation');
        return;
      }

      let created = 0;
      let skipped = 0;

      for (const [regionId, region] of Object.entries(regions.regions)) {
        try {
          const result = await this.createBoundaryChannelsForRegion(region);
          created += result.created;
          skipped += result.skipped;
        } catch (error) {
          console.error(`Error creating boundary channels for ${regionId}:`, error.message);
        }
      }

      console.log(`✅ Boundary channel initialization complete: ${created} created, ${skipped} skipped`);

      // Save to disk
      await this.saveBoundaryChannels();
    } catch (error) {
      console.error('Error in initializeBoundaryChannels:', error);
      throw error;
    }
  }

  /**
   * Create boundary channels for a specific region
   */
  async createBoundaryChannelsForRegion(region) {
    let created = 0;
    let skipped = 0;

    // If region doesn't have boundarySegments yet, create them
    if (!region.boundarySegments) {
      console.log(`📍 Creating boundary segments for ${region.name}...`);
      region.boundarySegments = this.generateBoundarySegments(region);
    }

    for (const [direction, segment] of Object.entries(region.boundarySegments)) {
      const channelId = segment.channelId || `boundary-${region.id}-${direction}`;
      
      // Check if channel already exists
      if (this.boundaryChannels.has(channelId)) {
        skipped++;
        continue;
      }

      // Create official boundary channel
      const channel = {
        id: channelId,
        name: `${region.name} ${segment.name}`,
        type: 'boundary',
        
        // Channel categorization for UI grouping
        category: 'boundary_official', // Links to CHANNEL_TYPES in TestDataPanel
        subtype: `boundary_${direction}`, // 'boundary_north', 'boundary_south', etc.
        color: '#8b5cf6', // Purple color for boundary channels
        
        // Legacy grouping (kept for backwards compatibility)
        topicRow: `${region.name} Boundaries`,
        
        // Region association
        regionId: region.id,
        regionName: region.name,
        regionType: region.type, // 'country', 'state', 'province', 'city'
        
        // Boundary direction
        boundarySegment: direction, // 'north', 'south', 'east', 'west'
        
        // Official Relay channel flag
        isOfficial: true, // Marks this as official Relay channel (not user-created)
        isRelayOfficial: true, // Alternative flag name for clarity
        channelPurpose: 'boundary_modification', // Describes what this channel is for
        
        // Hierarchical structure metadata
        hierarchy: {
          level1: region.name, // Country or top-level region (e.g., "United States")
          level2: this.capitalize(direction), // Direction (e.g., "North")
          level3: segment.segmentIndex || 0, // Sub-segment index within direction
          fullPath: `${region.name} > ${this.capitalize(direction)} Border` // Display path
        },
        
        // Metadata
        metadata: {
          regionType: region.type, // 'country', 'state', 'city'
          adjacentRegions: segment.adjacentRegions || [],
          affectsVoteClustering: true, // This boundary affects vote tallying
          segmentDirection: direction,
          createdAt: Date.now(),
          // Additional metadata for hierarchical display
          boundaryHierarchy: {
            country: region.name,
            direction: direction,
            segment: segment.segmentIndex || 0
          }
        },
        
        // Candidates (boundary proposals)
        candidates: [],
        
        // Channel stats
        createdAt: Date.now(),
        lastActivity: Date.now(),
        totalVotes: 0
      };

      // Add to channels map
      this.boundaryChannels.set(channelId, channel);

      // Add default "Current Boundary" candidate
      await this.ensureDefaultBoundaryCandidate(channel, segment);

      created++;
      console.log(`✅ Created boundary channel: ${channel.name}`);
    }

    return { created, skipped };
  }

  /**
   * Generate boundary segments for a region (if not already defined)
   */
  generateBoundarySegments(region) {
    if (!region.boundary) {
      console.warn(`⚠️ Region ${region.name} has no boundary defined`);
      return {};
    }

    // For now, create basic 4-directional segments
    // In production, this would intelligently split the boundary polygon
    const segments = {};
    const directions = ['north', 'south', 'east', 'west'];

    for (const direction of directions) {
      segments[direction] = {
        name: `${this.capitalize(direction)} Border`,
        geojson: region.boundary, // Placeholder - would split polygon in production
        adjacentRegions: [],
        channelId: `boundary-${region.id}-${direction}`
      };
    }

    return segments;
  }

  /**
   * Ensure a channel has a default "Current Boundary" candidate
   */
  async ensureDefaultBoundaryCandidate(channel, segment) {
    // Check if current boundary candidate exists
    const hasDefault = channel.candidates?.some(c => c.isDefault);

    if (hasDefault) {
      return;
    }

    const defaultCandidate = {
      id: `current-${channel.id}`,
      name: 'Current Official Boundary',
      username: `current-${channel.id}`,
      type: 'boundary',
      isDefault: true, // Mark as official current boundary
      
      // Store the actual GeoJSON boundary data (both field names for compatibility)
      geojson: segment.geojson, // Used by globe rendering
      boundaryData: segment.geojson, // Legacy field name
      
      // Display information
      direction: this.capitalize(channel.boundarySegment), // "North", "South", etc.
      adjacentRegions: segment.adjacentRegions || [],
      
      // Metadata
      bio: 'The current official boundary used for vote clustering and regional identification.',
      description: `Official ${this.capitalize(channel.boundarySegment)} border for ${channel.regionName}`,
      votes: 0, // Starts with 0, can receive blockchain votes
      initialVotes: Math.floor(Math.random() * 30) + 80, // Base demo votes: 80-110
      createdAt: Date.now(),
      
      // Visual properties for globe rendering
      style: {
        color: '#00ff00', // Green for current official
        opacity: 1.0,
        lineWidth: 3,
        solid: true
      }
    };

    channel.candidates.push(defaultCandidate);
    console.log(`✅ Added default boundary candidate to ${channel.name}`);
  }

  /**
   * Add a boundary proposal as a candidate to a channel
   */
  async addBoundaryProposal(channelId, proposalData) {
    const channel = this.boundaryChannels.get(channelId);

    if (!channel) {
      throw new Error(`Boundary channel not found: ${channelId}`);
    }

    // Create candidate from proposal
    const candidate = {
      id: `proposal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: proposalData.title,
      username: `proposal-${Date.now()}`,
      type: 'boundary',
      isDefault: false, // This is a proposal, not current boundary
      
      // Store the proposed GeoJSON (both field names for compatibility)
      geojson: proposalData.proposedBoundary, // Used by globe rendering
      boundaryData: proposalData.proposedBoundary, // Legacy field name
      
      // Display information
      direction: this.capitalize(channel.boundarySegment), // "North", "South", etc.
      adjacentRegions: proposalData.adjacentRegions || [],
      
      bio: proposalData.description,
      description: proposalData.description,
      votes: 0,
      initialVotes: 0, // Base votes for display
      createdAt: Date.now(),
      
      // Metadata
      metadata: {
        proposedBy: proposalData.userId || 'anonymous',
        regionId: channel.regionId,
        regionName: channel.regionName,
        direction: channel.boundarySegment,
        proposalType: proposalData.action || 'modify', // 'modify', 'split', 'merge'
        rationale: proposalData.rationale
      },
      
      // Visual styling for preview
      style: {
        color: '#ffff00', // Yellow for proposals
        opacity: 0.7,
        lineWidth: 2,
        dashed: true // Dashed line to show it's proposed
      }
    };

    // Add candidate to channel
    channel.candidates.push(candidate);
    channel.lastActivity = Date.now();

    // Save to disk
    await this.saveBoundaryChannels();

    console.log(`✅ Boundary proposal added as candidate to ${channel.name}`);

    return candidate;
  }

  /**
   * Get all boundary channels for a region (grouped by category)
   */
  getBoundaryChannelsForRegion(regionId) {
    const channels = [];

    for (const [channelId, channel] of this.boundaryChannels.entries()) {
      if (channel.regionId === regionId) {
        channels.push(channel);
      }
    }

    return channels;
  }

  /**
   * Get a specific boundary channel
   */
  getBoundaryChannel(channelId) {
    return this.boundaryChannels.get(channelId);
  }

  /**
   * Get the active (winning) boundary for a region
   * This is used for vote clustering and globe rendering
   */
  async getActiveRegionBoundary(regionId) {
    const region = regionalGovernanceService.regions.regions[regionId];

    if (!region) {
      throw new Error(`Region not found: ${regionId}`);
    }

    // Reconstruct full boundary from winning segment candidates
    const activeBoundary = {
      type: 'Polygon',
      coordinates: [],
      segments: {}
    };

    if (!region.boundarySegments) {
      // Fallback to original boundary if no segments
      return region.boundary;
    }

    for (const [direction, segment] of Object.entries(region.boundarySegments)) {
      const channel = this.boundaryChannels.get(segment.channelId);

      if (!channel || !channel.candidates.length) {
        // Use default segment
        activeBoundary.segments[direction] = segment.geojson;
        continue;
      }

      // Find the candidate with most votes (winner)
      const winner = [...channel.candidates]
        .sort((a, b) => b.votes - a.votes)[0];

      // Use the winning candidate's boundary data
      activeBoundary.segments[direction] = winner.boundaryData || segment.geojson;
    }

    return activeBoundary;
  }

  /**
   * Vote on a boundary proposal (candidate)
   */
  async voteOnBoundaryProposal(channelId, candidateId, userId) {
    const channel = this.boundaryChannels.get(channelId);

    if (!channel) {
      throw new Error(`Boundary channel not found: ${channelId}`);
    }

    const candidate = channel.candidates.find(c => c.id === candidateId);

    if (!candidate) {
      throw new Error(`Boundary candidate not found: ${candidateId}`);
    }

    // Increment vote (simplified - in production, would use voting engine)
    candidate.votes += 1;
    channel.totalVotes += 1;
    channel.lastActivity = Date.now();

    // Save to disk
    await this.saveBoundaryChannels();

    console.log(`✅ Vote recorded for ${candidate.name} in ${channel.name}`);

    return {
      success: true,
      candidateId,
      newVoteCount: candidate.votes,
      channelTotalVotes: channel.totalVotes
    };
  }

  /**
   * Helper: Capitalize first letter
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Export singleton instance
const boundaryChannelService = new BoundaryChannelService();
export default boundaryChannelService;
