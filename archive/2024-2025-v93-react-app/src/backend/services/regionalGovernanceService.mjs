import logger from '../utils/logging/logger.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import { getDataFilePath } from '../utils/storage/fileStorage.mjs';
// Import the new production services
import regionalElectionService from './regionalElectionService.mjs';
import regionalMultiSigService from './regionalMultiSigService.mjs';

/**
 * Regional Governance Service
 * Manages regional boundaries, parameter overrides, and community consensus
 * Uses geohash-5 blocks as atomic units for boundary mapping
 * Now integrates with elections and multi-sig governance
 */

// Logger
const regionalLogger = logger.child({ module: 'regional-governance' });

class RegionalGovernanceService {
    constructor() {
        this.logger = regionalLogger;
        this.dataPath = getDataFilePath('');
        this.regionsFile = getDataFilePath('regions.json');
        this.parametersFile = getDataFilePath('regional-parameters.json');        this.proposalsFile = getDataFilePath('boundary-proposals.json');
        this.eventEmitter = new EventEmitter();
        this.ensureDataStructure();
        this.loadData();
    }

    ensureDataStructure() {
        // Initialize default country boundaries with geohash-5 structure
        let needsRegionsFile = !existsSync(this.regionsFile);
        if (!needsRegionsFile) {
            try {
                needsRegionsFile = readFileSync(this.regionsFile, 'utf8').trim() === '';
            } catch (error) {
                needsRegionsFile = true;
            }
        }
        
        if (needsRegionsFile) {
            const defaultRegions = {
                regions: {
                    'US': {
                        id: 'US',
                        name: 'United States',
                        type: 'country',
                        geohash5Blocks: [
                            '9q8y', '9qg0', '9qh0', 'dr5r', 'drt2', // Sample geohash5 blocks for US
                            'c2b2', '9z0s', 'dp3w', 'djn0', 'djf0'
                        ],
                        boundary: {
                            type: 'Polygon',
                            coordinates: [[
                                [-125.0, 48.5], [-125.0, 24.5], [-66.9, 24.5], 
                                [-66.9, 49.4], [-125.0, 48.5]
                            ]]
                        },
                        parentRegion: null,
                        subRegions: ['US-CA', 'US-TX', 'US-NY'],
                        population: 0,
                        activeVoters: 0,
                        lastUpdated: new Date().toISOString(),
                        consensusVersion: 1,
                        proposalCount: 0
                    },
                    'US-CA': {
                        id: 'US-CA',
                        name: 'California',
                        type: 'state',
                        geohash5Blocks: ['9q8y', '9qg0', '9qh0'],
                        boundary: {
                            type: 'Polygon', 
                            coordinates: [[
                                [-124.4, 42.0], [-124.4, 32.5], [-114.1, 32.5], 
                                [-114.1, 42.0], [-124.4, 42.0]
                            ]]
                        },
                        parentRegion: 'US',
                        subRegions: ['US-CA-SF', 'US-CA-LA'],
                        population: 0,
                        activeVoters: 0,
                        lastUpdated: new Date().toISOString(),
                        consensusVersion: 1,
                        proposalCount: 0
                    },
                    'US-CA-SF': {
                        id: 'US-CA-SF',
                        name: 'San Francisco Bay Area',
                        type: 'metro',
                        geohash5Blocks: ['9q8y'],
                        boundary: {
                            type: 'Polygon',
                            coordinates: [[
                                [-122.7, 37.9], [-122.7, 37.3], [-121.8, 37.3], 
                                [-121.8, 37.9], [-122.7, 37.9]
                            ]]
                        },
                        parentRegion: 'US-CA',
                        subRegions: [],
                        population: 0,
                        activeVoters: 0,
                        lastUpdated: new Date().toISOString(),
                        consensusVersion: 1,
                        proposalCount: 0
                    }
                },                globalConsensus: {
                    totalRegions: 3,
                    totalProposals: 0,
                    lastGlobalUpdate: new Date().toISOString(),
                    consensusThreshold: 0.6, // community-voted fallback for boundary changes
                    minVotingPopulation: 10, // community-voted fallback - minimum voters in region
                    geohash5Coverage: 10 // community-voted fallback - sample geohash5 blocks tracked
                }
            };
            writeFileSync(this.regionsFile, JSON.stringify(defaultRegions, null, 2));
        }        // Initialize regional parameters
        let needsParametersFile = !existsSync(this.parametersFile);
        if (!needsParametersFile) {
            try {
                needsParametersFile = readFileSync(this.parametersFile, 'utf8').trim() === '';
            } catch (error) {
                needsParametersFile = true;
            }
        }
        
        if (needsParametersFile) {            const defaultParameters = {                global: {
                    voteDuration: 168, // 7 days in hours (community-voted fallback)
                    startingInvites: 1, // community-voted fallback
                    quorumThreshold: 0.15, // community-voted fallback
                    consensusThreshold: 0.6, // community-voted fallback
                    approvalThreshold: 0.6, // community-voted fallback (60%)
                    maxChannelsPerTopic: 100, // community-voted fallback
                    reliabilityDecayRate: 0.95, // community-voted fallback
                    inactiveUserThreshold: 720, // 30 days in hours (community-voted fallback)
                    // New governance parameters that should be community-voted
                    minVotingPopulation: 10, // community-voted fallback
                    geohash5Coverage: 10, // community-voted fallback
                    consensusRequiredForParameterChange: 0.6, // community-voted fallback
                    minVotersGlobal: 100, // community-voted fallback
                    minVotersRegional: 20 // community-voted fallback
                },                regional: {
                    'US': {
                        voteDuration: 168, // Can override global (community-voted fallback)
                        quorumThreshold: 0.20, // Higher threshold for US (community-voted fallback)
                        approvalThreshold: 0.6, // community-voted fallback (60%)
                        consensusThreshold: 0.6, // community-voted fallback
                        reliabilityDecayRate: 0.95, // community-voted fallback
                        timezone: 'America/New_York',
                        specialParameters: {
                            fastTrackVoting: true,
                            extendedDebatePeriod: 48
                        }
                    },
                    'US-CA': {
                        voteDuration: 72, // 3 days for state-level votes (community-voted fallback)
                        quorumThreshold: 0.25, // community-voted fallback
                        approvalThreshold: 0.6, // community-voted fallback (60%)
                        consensusThreshold: 0.6, // community-voted fallback
                        reliabilityDecayRate: 0.95, // community-voted fallback
                        timezone: 'America/Los_Angeles'
                    },
                    'US-CA-SF': {
                        voteDuration: 24, // 1 day for metro-level votes (community-voted fallback)
                        quorumThreshold: 0.30, // community-voted fallback
                        approvalThreshold: 0.65, // Slightly higher for metro areas (community-voted fallback)
                        consensusThreshold: 0.6, // community-voted fallback
                        reliabilityDecayRate: 0.95, // community-voted fallback
                        timezone: 'America/Los_Angeles'
                    }
                },
                parameterVotes: {
                    active: [],
                    completed: []
                }
            };
            writeFileSync(this.parametersFile, JSON.stringify(defaultParameters, null, 2));        }
        
        // Initialize boundary proposals
        let needsProposalsFile = !existsSync(this.proposalsFile);
        if (!needsProposalsFile) {
            try {
                needsProposalsFile = readFileSync(this.proposalsFile, 'utf8').trim() === '';
            } catch (error) {
                needsProposalsFile = true;
            }
        }
        
        if (needsProposalsFile) {
            const defaultProposals = {
                boundaryProposals: [],
                activeVotes: [],
                userProposals: {} // userId -> [proposals]
            };
            writeFileSync(this.proposalsFile, JSON.stringify(defaultProposals, null, 2));
        }
    }

    loadData() {
        try {
            this.regions = JSON.parse(readFileSync(this.regionsFile, 'utf8'));
            this.parameters = JSON.parse(readFileSync(this.parametersFile, 'utf8'));
            
            // Load proposals and handle Set conversion
            const proposalsData = JSON.parse(readFileSync(this.proposalsFile, 'utf8'));
            this.proposals = proposalsData;
            
            // Convert voters arrays back to Sets for any existing proposals
            if (this.proposals.boundaryProposals) {
                this.proposals.boundaryProposals.forEach(proposal => {
                    if (proposal.votes && proposal.votes.voters) {
                        proposal.votes.voters = new Set(proposal.votes.voters);
                    }
                });
            }
            
            // Convert voters arrays back to Sets for parameter votes
            if (this.parameters.parameterVotes) {
                if (this.parameters.parameterVotes.active) {
                    this.parameters.parameterVotes.active.forEach(proposal => {
                        if (proposal.votes && proposal.votes.voters) {
                            proposal.votes.voters = new Set(proposal.votes.voters);
                        }
                    });
                }
                if (this.parameters.parameterVotes.completed) {
                    this.parameters.parameterVotes.completed.forEach(proposal => {
                        if (proposal.votes && proposal.votes.voters) {
                            proposal.votes.voters = new Set(proposal.votes.voters);
                        }
                    });
                }
            }        } catch (error) {
            this.logger.error('Error loading regional data:', error);
            // Initialize with empty data structures if files can't be read
            this.regions = { 
                regions: {},                globalConsensus: {
                    totalRegions: 0,
                    totalProposals: 0,
                    lastGlobalUpdate: new Date().toISOString(),
                    consensusThreshold: 0.6, // community-voted fallback
                    minVotingPopulation: 10, // community-voted fallback
                    geohash5Coverage: 10 // community-voted fallback
                }
            };            this.parameters = { 
                global: {
                    voteDuration: 168, // community-voted fallback
                    startingInvites: 1, // community-voted fallback
                    quorumThreshold: 0.15, // community-voted fallback
                    consensusThreshold: 0.6, // community-voted fallback
                    approvalThreshold: 0.6, // community-voted fallback
                    maxChannelsPerTopic: 100, // community-voted fallback
                    reliabilityDecayRate: 0.95, // community-voted fallback
                    inactiveUserThreshold: 720, // community-voted fallback
                    // Additional governance parameters 
                    minVotingPopulation: 10, // community-voted fallback
                    geohash5Coverage: 10, // community-voted fallback
                    consensusRequiredForParameterChange: 0.6, // community-voted fallback
                    minVotersGlobal: 100, // community-voted fallback
                    minVotersRegional: 20 // community-voted fallback
                }, 
                regional: {}, 
                parameterVotes: { active: [], completed: [] } 
            };
            this.proposals = { 
                boundaryProposals: [], 
                activeVotes: [], 
                userProposals: {} 
            };        }
    }

    saveData() {
        try {
            writeFileSync(this.regionsFile, JSON.stringify(this.regions, null, 2));
            
            // Convert Sets to arrays for parameter votes
            const parametersToSave = JSON.parse(JSON.stringify(this.parameters));
            if (parametersToSave.parameterVotes) {
                if (parametersToSave.parameterVotes.active) {
                    parametersToSave.parameterVotes.active.forEach(proposal => {
                        if (proposal.votes && proposal.votes.voters instanceof Set) {
                            proposal.votes.voters = Array.from(proposal.votes.voters);
                        }
                    });
                }
                if (parametersToSave.parameterVotes.completed) {
                    parametersToSave.parameterVotes.completed.forEach(proposal => {
                        if (proposal.votes && proposal.votes.voters instanceof Set) {
                            proposal.votes.voters = Array.from(proposal.votes.voters);
                        }
                    });
                }
            }
            writeFileSync(this.parametersFile, JSON.stringify(parametersToSave, null, 2));
            
            // Convert Sets to arrays for boundary proposals
            const proposalsToSave = JSON.parse(JSON.stringify(this.proposals));
            if (proposalsToSave.boundaryProposals) {
                proposalsToSave.boundaryProposals.forEach(proposal => {
                    if (proposal.votes && proposal.votes.voters instanceof Set) {
                        proposal.votes.voters = Array.from(proposal.votes.voters);
                    }
                });
            }
            
            writeFileSync(this.proposalsFile, JSON.stringify(proposalsToSave, null, 2));
        } catch (error) {
            this.logger.error('Error saving regional data:', error);
        }
    }

    /**
     * Generate geohash-5 for coordinates
     */
    generateGeohash5(lat, lng) {
        const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
        let latRange = [-90.0, 90.0];
        let lngRange = [-180.0, 180.0];
        let hash = '';
        let bits = 0;
        let bit = 0;
        let even = true; // Start with longitude

        while (hash.length < 5) {
            if (even) { // Longitude
                const mid = (lngRange[0] + lngRange[1]) / 2;
                if (lng >= mid) {
                    bit = (bit << 1) + 1;
                    lngRange[0] = mid;
                } else {
                    bit = bit << 1;
                    lngRange[1] = mid;
                }
            } else { // Latitude
                const mid = (latRange[0] + latRange[1]) / 2;
                if (lat >= mid) {
                    bit = (bit << 1) + 1;
                    latRange[0] = mid;
                } else {
                    bit = bit << 1;
                    latRange[1] = mid;
                }
            }

            even = !even;
            bits++;

            if (bits === 5) {
                hash += base32[bit];
                bits = 0;
                bit = 0;
            }
        }

        return hash;
    }

    /**
     * Get region by coordinates using geohash-5 lookup
     */
    async getRegionByCoordinates(latitude, longitude) {        try {
            const geohash5 = this.generateGeohash5(latitude, longitude);
            
            // Check which region contains this geohash5 block, prefer most specific
            let geohashMatch = null;
            let geohashSpecificity = -1;
            
            for (const [regionId, region] of Object.entries(this.regions.regions)) {
                if (region.geohash5Blocks.includes(geohash5)) {
                    const specificity = region.type === 'metro' ? 3 : 
                                      region.type === 'state' ? 2 : 
                                      region.type === 'country' ? 1 : 0;
                    
                    if (specificity > geohashSpecificity) {
                        geohashSpecificity = specificity;
                        geohashMatch = region;
                    }
                }
            }
            
            if (geohashMatch) {
                return geohashMatch;
            }
            
            // Fallback: Find most specific region containing the point
            let bestMatch = null;
            let bestSpecificity = -1;
            
            for (const [regionId, region] of Object.entries(this.regions.regions)) {
                if (this.isPointInPolygon(latitude, longitude, region.boundary)) {
                    const specificity = region.type === 'metro' ? 3 : 
                                      region.type === 'state' ? 2 : 
                                      region.type === 'country' ? 1 : 0;
                    
                    if (specificity > bestSpecificity) {
                        bestSpecificity = specificity;
                        bestMatch = region;
                    }
                }
            }
            
            return bestMatch;
        } catch (error) {
            this.logger.error('Error getting region by coordinates:', error);
            return null;
        }
    }    /**
     * Check if point is inside polygon using ray casting
     */
    isPointInPolygon(lat, lng, polygon) {
        if (!polygon || !polygon.coordinates || !polygon.coordinates[0]) return false;
        
        const coords = polygon.coordinates[0];
        let inside = false;
        
        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
            const [xi, yi] = coords[i];
            const [xj, yj] = coords[j];
            
            // Check if point is exactly on the boundary
            if (this.isPointOnLineSegment(lng, lat, xi, yi, xj, yj)) {
                return false; // Points on boundary are considered outside
            }
            
            if (((yi > lat) !== (yj > lat)) && 
                (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }    /**
     * Check if point is on a line segment
     */
    isPointOnLineSegment(x, y, x1, y1, x2, y2) {
        const epsilon = 1e-10;
        
        // Calculate distances
        const distanceToStart = Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
        const distanceToEnd = Math.sqrt((x - x2) * (x - x2) + (y - y2) * (y - y2));
        const segmentLength = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        
        // If sum of distances equals segment length (within epsilon), point is on segment
        return Math.abs(distanceToStart + distanceToEnd - segmentLength) < epsilon;
    }/**
     * Get regional parameters with inheritance
     */    getRegionalParameters(regionId) {
        // Get effective global parameters (using community votes when available)
        const effectiveGlobal = {};
        for (const param of Object.keys(this.parameters.global)) {
            effectiveGlobal[param] = this.getEffectiveParameterValue(param, 'global') || this.parameters.global[param];
        }
        
        // Start with effective global parameters
        let inheritedParams = { ...effectiveGlobal };
        
        // Build hierarchy from root to current region
        const hierarchy = [];
        let currentRegion = this.regions.regions[regionId];
        const visited = new Set();
        
        while (currentRegion && !visited.has(currentRegion.id)) {
            visited.add(currentRegion.id);
            hierarchy.unshift(currentRegion.id); // Add to front to get root-to-leaf order
            
            // Move to parent region
            if (currentRegion.parentRegion) {
                currentRegion = this.regions.regions[currentRegion.parentRegion];
            } else {
                break;
            }
        }
        
        // Apply parameters from root to leaf (inheritance order)
        // Each level can override with community-voted values or fallback defaults
        for (const regionInHierarchy of hierarchy) {
            const regionParams = this.parameters.regional[regionInHierarchy];
            if (regionParams) {
                // For each regional parameter, check if there's a community-voted value
                const effectiveRegionalParams = {};
                for (const param of Object.keys(regionParams)) {
                    const votedValue = this.getEffectiveParameterValue(param, 'regional', regionInHierarchy);
                    effectiveRegionalParams[param] = votedValue !== null ? votedValue : regionParams[param];
                }
                inheritedParams = { ...inheritedParams, ...effectiveRegionalParams };
            }
        }
        
        return inheritedParams;
    }

    /**
     * Propose boundary change
     */
    async proposeBoundaryChange(userId, regionId, newBoundary, reasoning) {
        try {
            const proposal = {
                id: `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId,
                regionId,
                type: 'boundary_change',
                currentBoundary: this.regions.regions[regionId]?.boundary,
                proposedBoundary: newBoundary,
                reasoning,
                geohash5Changes: this.calculateGeohash5Changes(regionId, newBoundary),
                timestamp: new Date().toISOString(),
                status: 'pending',
                votes: {
                    for: 0,
                    against: 0,
                    abstain: 0,
                    voters: new Set()
                },                consensus: {
                    required: this.getEffectiveParameterValue('consensusThreshold', 'global') || 0.6,
                    current: 0,
                    quorum: false
                }
            };
            
            this.proposals.boundaryProposals.push(proposal);
            this.proposals.activeVotes.push(proposal.id);
            
            // Track user proposals
            if (!this.proposals.userProposals[userId]) {
                this.proposals.userProposals[userId] = [];
            }
            this.proposals.userProposals[userId].push(proposal.id);
            
            this.saveData();
            
            // Emit event for real-time updates
            this.eventEmitter.emit('boundaryProposed', proposal);
            
            return { success: true, proposalId: proposal.id };
        } catch (error) {
            this.logger.error('Error proposing boundary change:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Calculate geohash-5 block changes for boundary proposal
     */
    calculateGeohash5Changes(regionId, newBoundary) {
        const currentRegion = this.regions.regions[regionId];
        if (!currentRegion) return { added: [], removed: [] };
        
        // Generate sample points within new boundary
        const newGeohashes = this.generateGeohashesForBoundary(newBoundary);
        const currentGeohashes = new Set(currentRegion.geohash5Blocks);
        
        const added = newGeohashes.filter(hash => !currentGeohashes.has(hash));
        const removed = currentRegion.geohash5Blocks.filter(hash => 
            !this.isGeohashInBoundary(hash, newBoundary)
        );
        
        return { added, removed };
    }

    /**
     * Generate representative geohash5 blocks for a boundary
     */
    generateGeohashesForBoundary(boundary) {
        if (!boundary || !boundary.coordinates) return [];
        
        const coords = boundary.coordinates[0];
        const geohashes = new Set();
        
        // Find bounding box
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;
        
        coords.forEach(([lng, lat]) => {
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        });
        
        // Sample points within bounding box
        const latStep = (maxLat - minLat) / 10;
        const lngStep = (maxLng - minLng) / 10;
        
        for (let lat = minLat; lat <= maxLat; lat += latStep) {
            for (let lng = minLng; lng <= maxLng; lng += lngStep) {
                if (this.isPointInPolygon(lat, lng, boundary)) {
                    geohashes.add(this.generateGeohash5(lat, lng));
                }
            }
        }
        
        return Array.from(geohashes);
    }

    /**
     * Check if geohash5 center point is within boundary
     */
    isGeohashInBoundary(geohash5, boundary) {
        const coords = this.decodeGeohash5(geohash5);
        return this.isPointInPolygon(coords.lat, coords.lng, boundary);
    }

    /**
     * Decode geohash5 to approximate center coordinates
     */
    decodeGeohash5(geohash) {
        const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
        let latRange = [-90.0, 90.0];
        let lngRange = [-180.0, 180.0];
        let even = true;
        
        for (const char of geohash) {
            const cd = base32.indexOf(char);
            for (let i = 4; i >= 0; i--) {
                const bit = (cd >> i) & 1;
                if (even) {
                    const mid = (lngRange[0] + lngRange[1]) / 2;
                    if (bit === 1) {
                        lngRange[0] = mid;
                    } else {
                        lngRange[1] = mid;
                    }
                } else {
                    const mid = (latRange[0] + latRange[1]) / 2;
                    if (bit === 1) {
                        latRange[0] = mid;
                    } else {
                        latRange[1] = mid;
                    }
                }
                even = !even;
            }
        }
        
        return {
            lat: (latRange[0] + latRange[1]) / 2,
            lng: (lngRange[0] + lngRange[1]) / 2
        };
    }

    /**
     * Vote on parameter change
     */
    async voteOnParameterChange(userId, proposalId, vote, regionId = null) {
        try {
            // Find the proposal
            let proposal = this.parameters.parameterVotes.active.find(p => p.id === proposalId);
            if (!proposal) {
                return { success: false, error: 'Proposal not found' };
            }
            
            // Check if user already voted
            if (proposal.votes.voters.has(userId)) {
                return { success: false, error: 'User already voted' };
            }
            
            // Validate user's voting region
            if (regionId && !this.canUserVoteInRegion(userId, regionId)) {
                return { success: false, error: 'User cannot vote in this region' };
            }
            
            // Record vote
            proposal.votes.voters.add(userId);
            proposal.votes[vote]++;
            
            // Update consensus calculation
            const totalVotes = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
            const supportPercentage = totalVotes > 0 ? proposal.votes.for / totalVotes : 0;
            
            proposal.consensus.current = supportPercentage;
            proposal.consensus.quorum = totalVotes >= proposal.consensus.minVoters;
            
            // Check if consensus reached
            if (proposal.consensus.quorum && 
                supportPercentage >= proposal.consensus.required) {
                await this.applyParameterChange(proposal);
            }
            
            this.saveData();
            this.eventEmitter.emit('parameterVoted', { proposalId, userId, vote });
            
            return { success: true, consensus: proposal.consensus };
        } catch (error) {
            this.logger.error('Error voting on parameter change:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Apply approved parameter change
     */
    async applyParameterChange(proposal) {
        try {
            const { parameter, newValue, scope, regionId } = proposal;
            
            if (scope === 'global') {
                this.parameters.global[parameter] = newValue;
            } else if (scope === 'regional' && regionId) {
                if (!this.parameters.regional[regionId]) {
                    this.parameters.regional[regionId] = {};
                }
                this.parameters.regional[regionId][parameter] = newValue;
            }
            
            // Move to completed
            proposal.status = 'approved';
            proposal.appliedAt = new Date().toISOString();
            
            this.parameters.parameterVotes.completed.push(proposal);
            this.parameters.parameterVotes.active = 
                this.parameters.parameterVotes.active.filter(p => p.id !== proposal.id);
            
            this.saveData();
            this.eventEmitter.emit('parameterChanged', proposal);
            
        } catch (error) {
            this.logger.error('Error applying parameter change:', error);
        }
    }

    /**
     * Check if user can vote in specific region
     */
    canUserVoteInRegion(userId, regionId) {
        // This would integrate with user location service
        // For now, return true - implement proper geo-verification later
        return true;
    }

    /**
     * Get all regions
     */
    getAllRegions() {
        return this.regions.regions;
    }

    /**
     * Get region hierarchy
     */
    getRegionHierarchy(regionId) {
        const hierarchy = [];
        let currentRegion = this.regions.regions[regionId];
        
        while (currentRegion) {
            hierarchy.unshift(currentRegion);
            if (currentRegion.parentRegion) {
                currentRegion = this.regions.regions[currentRegion.parentRegion];
            } else {
                break;
            }
        }
        
        return hierarchy;
    }

    /**
     * Get active boundary proposals
     */
    getActiveBoundaryProposals() {
        return this.proposals.boundaryProposals.filter(p => p.status === 'pending');
    }

    /**
     * Get active parameter votes
     */
    getActiveParameterVotes() {
        return this.parameters.parameterVotes.active;
    }

    /**
     * Start parameter change proposal
     */
    async proposeParameterChange(userId, parameter, newValue, scope, regionId, reasoning) {
        try {
            const proposal = {
                id: `param_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId,
                parameter,
                currentValue: scope === 'global' ? 
                    this.parameters.global[parameter] : 
                    this.parameters.regional[regionId]?.[parameter],
                newValue,
                scope, // 'global' or 'regional'
                regionId,
                reasoning,
                timestamp: new Date().toISOString(),
                status: 'active',
                votes: {
                    for: 0,
                    against: 0,
                    abstain: 0,
                    voters: new Set()
                },                consensus: {
                    required: this.getEffectiveParameterValue('consensusRequiredForParameterChange', 'global') || 0.6,
                    current: 0,
                    quorum: false,
                    minVoters: scope === 'global' ? 
                        (this.getEffectiveParameterValue('minVotersGlobal', 'global') || 100) : 
                        (this.getEffectiveParameterValue('minVotersRegional', 'global') || 20)
                }
            };
            
            this.parameters.parameterVotes.active.push(proposal);
            this.saveData();
              this.eventEmitter.emit('parameterProposed', proposal);
            
            return { success: true, proposalId: proposal.id };
        } catch (error) {
            this.logger.error('Error proposing parameter change:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Integration methods with new production services
     */

    /**
     * Initiate regional election for a position
     */
    async initiateElection(regionId, position, initiatorId) {
        try {
            if (!this.regions[regionId]) {
                throw new Error('Region not found');
            }

            return await regionalElectionService.initiateElection(regionId, position, initiatorId);
        } catch (error) {
            this.logger.error('Error initiating election:', error);
            throw error;
        }
    }

    /**
     * Get active elections for a region
     */
    getRegionalElections(regionId) {
        return regionalElectionService.getRegionElections(regionId);
    }

    /**
     * Get regional officials
     */
    getRegionalOfficials(regionId) {
        return regionalElectionService.getRegionOfficials(regionId);
    }

    /**
     * Create multi-sig spending proposal
     */
    async createSpendingProposal(regionId, proposalData, initiatorId) {
        try {
            if (!this.regions[regionId]) {
                throw new Error('Region not found');
            }

            return await regionalMultiSigService.createSpendingProposal(regionId, proposalData, initiatorId);
        } catch (error) {
            this.logger.error('Error creating spending proposal:', error);
            throw error;
        }
    }

    /**
     * Get regional treasury status
     */
    getRegionalTreasury(regionId) {
        return regionalMultiSigService.getRegionalTreasury(regionId);
    }

    /**
     * Additional getter methods
     */

    /**
     * Get all regions
     */
    getRegions() {
        return this.regions;
    }

    /**
     * Get specific region by ID
     */
    getRegion(regionId) {
        return this.regions.regions ? this.regions.regions[regionId] : null;
    }

    /**
     * Get effective parameter value (from completed votes or fallback default)
     * This ensures all governance parameters are community-driven
     */
    getEffectiveParameterValue(parameter, scope, regionId = null) {
        try {
            // Check if there's a completed parameter vote for this parameter
            const completedVotes = this.parameters.parameterVotes?.completed || [];
            
            // Find the most recent completed vote for this parameter and scope
            const relevantVote = completedVotes
                .filter(vote => 
                    vote.parameter === parameter && 
                    vote.scope === scope &&
                    (scope === 'global' || vote.regionId === regionId) &&
                    vote.status === 'approved'
                )
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
            
            if (relevantVote) {
                this.logger.debug(`Using community-voted value for ${parameter}: ${relevantVote.newValue}`);
                return relevantVote.newValue;
            }
            
            // Fallback to current parameter defaults
            if (scope === 'global') {
                return this.parameters.global[parameter];
            } else if (scope === 'regional' && regionId) {
                return this.parameters.regional[regionId]?.[parameter] || this.parameters.global[parameter];
            }
            
            return null;
        } catch (error) {
            this.logger.error(`Error getting effective parameter value for ${parameter}:`, error);
            // Return fallback default
            if (scope === 'global') {
                return this.parameters.global[parameter];
            }
            return null;
        }
    }

    // ============================================================================
    // BOUNDARY PROPOSAL SYSTEM (Stage 1)
    // ============================================================================

    /**
     * Create a boundary proposal (in-memory with JSON file persistence)
     */
    async createBoundaryProposal(proposalData) {
        const proposal = {
            id: `proposal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            regionId: proposalData.regionId,
            regionType: proposalData.regionType, // 'country', 'state', 'metro', 'city'
            action: proposalData.action, // 'create', 'modify', 'split', 'merge'
            proposedBoundary: proposalData.proposedBoundary, // GeoJSON polygon
            proposedName: proposalData.proposedName,
            title: proposalData.title,
            description: proposalData.description,
            rationale: proposalData.rationale,
            
            // Bundle support for multi-segment borders
            bundleId: proposalData.bundleId || null,
            bundleTotalCount: proposalData.bundleTotalCount || 1,
            bundleSequence: proposalData.bundleSequence || 1,
            
            // Parent region for new regions
            parentRegion: proposalData.parentRegion || null,
            
            // Voting window
            votingStartsAt: new Date().toISOString(),
            votingEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
            
            // Vote tallies
            votesFor: 0,
            votesAgainst: 0,
            votesAbstain: 0,
            voters: [], // Array of user IDs who voted
            
            // Status
            status: 'pending', // 'pending', 'voting', 'approved', 'rejected', 'expired'
            
            // Metadata
            createdAt: new Date().toISOString(),
            proposedBy: proposalData.proposedBy
        };
        
        // Load existing proposals
        const proposals = this.loadBoundaryProposals();
        proposals.boundaryProposals.push(proposal);
        
        // Save to JSON file
        this.saveBoundaryProposals(proposals);
        
        this.logger.info(`Created boundary proposal: ${proposal.id} - ${proposal.title}`);
        this.eventEmitter.emit('proposal:created', proposal);
        
        return proposal;
    }

    /**
     * Create bundle of proposals (for multi-segment borders)
     */
    async createBundleProposal(bundleData) {
        const bundleId = `bundle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const proposals = [];
        
        for (let i = 0; i < bundleData.segments.length; i++) {
            const segment = bundleData.segments[i];
            const proposal = await this.createBoundaryProposal({
                ...segment,
                bundleId,
                bundleTotalCount: bundleData.segments.length,
                bundleSequence: i + 1
            });
            proposals.push(proposal);
        }
        
        this.logger.info(`Created bundle ${bundleId} with ${proposals.length} proposals`);
        
        return {
            bundleId,
            proposals,
            totalCount: proposals.length
        };
    }

    /**
     * Vote on a boundary proposal
     */
    async voteOnProposal(proposalId, userId, voteValue, voterContext) {
        const proposals = this.loadBoundaryProposals();
        const proposal = proposals.boundaryProposals.find(p => p.id === proposalId);
        
        if (!proposal) {
            throw new Error(`Proposal not found: ${proposalId}`);
        }
        
        // Check if user already voted
        if (proposal.voters.includes(userId)) {
            throw new Error('User has already voted on this proposal');
        }
        
        // Check voting eligibility (hierarchical)
        const isEligible = await this.checkVotingEligibility(userId, proposal, voterContext);
        if (!isEligible.eligible) {
            throw new Error(`User not eligible to vote: ${isEligible.reason}`);
        }
        
        // Record vote
        const vote = {
            id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            proposalId,
            userId,
            voteValue, // 'for', 'against', 'abstain'
            weight: isEligible.weight, // For hierarchical voting
            voterRegion: voterContext.regionId,
            isLocal: isEligible.isLocal,
            timestamp: new Date().toISOString()
        };
        
        // Update tallies
        if (voteValue === 'for') {
            proposal.votesFor += vote.weight;
        } else if (voteValue === 'against') {
            proposal.votesAgainst += vote.weight;
        } else {
            proposal.votesAbstain += vote.weight;
        }
        
        proposal.voters.push(userId);
        
        // Update status to voting if it was pending
        if (proposal.status === 'pending') {
            proposal.status = 'voting';
        }
        
        // Save votes
        if (!proposals.activeVotes) proposals.activeVotes = [];
        proposals.activeVotes.push(vote);
        
        this.saveBoundaryProposals(proposals);
        
        this.logger.info(`Vote recorded: ${vote.id} on proposal ${proposalId} (${voteValue})`);
        this.eventEmitter.emit('vote:recorded', { vote, proposal });
        
        return { vote, proposal };
    }

    /**
     * Check if user is eligible to vote on a proposal (hierarchical rules)
     */
    async checkVotingEligibility(userId, proposal, voterContext) {
        // Get user's location from voterContext
        const userRegionId = voterContext.regionId;
        
        // Hierarchical voting rules:
        // - Country-level: Everyone in the country can vote (local weight 1.0, foreign weight 0.3)
        // - State-level: Only users in that state can vote
        // - Metro/City-level: Only users in that metro/city can vote
        
        if (proposal.regionType === 'country') {
            // All users in the country can vote
            const userCountry = await this.getRegionAncestor(userRegionId, 'country');
            const proposalCountry = await this.getRegionAncestor(proposal.regionId, 'country');
            
            if (userCountry?.id === proposalCountry?.id) {
                const isLocal = userRegionId === proposal.regionId;
                return {
                    eligible: true,
                    weight: isLocal ? 1.0 : 0.3, // Local voters have more weight
                    isLocal
                };
            }
        } else if (proposal.regionType === 'state') {
            // Only users in the state can vote
            const userState = await this.getRegionAncestor(userRegionId, 'state');
            
            if (userState?.id === proposal.regionId) {
                return {
                    eligible: true,
                    weight: 1.0,
                    isLocal: true
                };
            }
        } else if (proposal.regionType === 'metro' || proposal.regionType === 'city') {
            // Only users in the metro/city can vote
            if (userRegionId === proposal.regionId) {
                return {
                    eligible: true,
                    weight: 1.0,
                    isLocal: true
                };
            }
        }
        
        return {
            eligible: false,
            reason: `User is not in the ${proposal.regionType} for this vote`
        };
    }

    /**
     * Get ancestor region of a specific type
     */
    async getRegionAncestor(regionId, targetType) {
        const region = this.regions.regions[regionId];
        if (!region) return null;
        
        if (region.type === targetType) {
            return region;
        }
        
        if (region.parentRegion) {
            return this.getRegionAncestor(region.parentRegion, targetType);
        }
        
        return null;
    }

    /**
     * Approve a proposal and apply boundary changes
     */
    async approveProposal(proposalId) {
        const proposals = this.loadBoundaryProposals();
        const proposal = proposals.boundaryProposals.find(p => p.id === proposalId);
        
        if (!proposal) {
            throw new Error(`Proposal not found: ${proposalId}`);
        }
        
        // Calculate approval
        const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
        const approvalRate = totalVotes > 0 ? proposal.votesFor / totalVotes : 0;
        
        // Check if approved (default 60% threshold)
        const threshold = 0.60;
        
        if (approvalRate >= threshold) {
            proposal.status = 'approved';
            
            // Apply boundary change
            if (proposal.action === 'modify') {
                const region = this.regions.regions[proposal.regionId];
                if (region) {
                    region.boundary = proposal.proposedBoundary;
                    region.lastUpdated = new Date().toISOString();
                    region.consensusVersion += 1;
                    
                    // Regenerate geohash blocks
                    region.geohash5Blocks = this.generateGeohash5Blocks(proposal.proposedBoundary);
                    
                    this.saveRegionsData();
                }
            } else if (proposal.action === 'create') {
                // Create new region
                const newRegionId = proposal.proposedName.toLowerCase().replace(/\s+/g, '-');
                const newRegion = {
                    id: newRegionId,
                    name: proposal.proposedName,
                    type: proposal.regionType,
                    boundary: proposal.proposedBoundary,
                    geohash5Blocks: this.generateGeohash5Blocks(proposal.proposedBoundary),
                    parentRegion: proposal.parentRegion || null,
                    subRegions: [],
                    population: 0,
                    activeVoters: 0,
                    lastUpdated: new Date().toISOString(),
                    consensusVersion: 1,
                    proposalCount: 0
                };
                
                this.regions.regions[newRegionId] = newRegion;
                
                // Add to parent's subRegions
                if (proposal.parentRegion) {
                    const parent = this.regions.regions[proposal.parentRegion];
                    if (parent && !parent.subRegions.includes(newRegionId)) {
                        parent.subRegions.push(newRegionId);
                    }
                }
                
                this.saveRegionsData();
            }
            
            this.saveBoundaryProposals(proposals);
            
            this.logger.info(`Proposal approved and applied: ${proposalId}`);
            this.eventEmitter.emit('proposal:approved', proposal);
            
            return { approved: true, proposal };
        } else {
            proposal.status = 'rejected';
            this.saveBoundaryProposals(proposals);
            
            this.logger.info(`Proposal rejected: ${proposalId} (approval rate: ${(approvalRate * 100).toFixed(1)}%)`);
            
            return { approved: false, proposal, approvalRate };
        }
    }

    /**
     * Get all active proposals
     */
    getActiveProposals(filters = {}) {
        const proposals = this.loadBoundaryProposals();
        let filtered = proposals.boundaryProposals;
        
        if (filters.status) {
            filtered = filtered.filter(p => p.status === filters.status);
        }
        
        if (filters.regionId) {
            filtered = filtered.filter(p => p.regionId === filters.regionId);
        }
        
        if (filters.bundleId) {
            filtered = filtered.filter(p => p.bundleId === filters.bundleId);
        }
        
        return filtered;
    }

    /**
     * Load boundary proposals from JSON file
     */
    loadBoundaryProposals() {
        try {
            const proposalsPath = getDataFilePath('boundary-proposals.json');
            if (!existsSync(proposalsPath)) {
                return { boundaryProposals: [], activeVotes: [], userProposals: {} };
            }
            const data = readFileSync(proposalsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            this.logger.error('Error loading boundary proposals:', error);
            return { boundaryProposals: [], activeVotes: [], userProposals: {} };
        }
    }

    /**
     * Save boundary proposals to JSON file
     */
    saveBoundaryProposals(data) {
        try {
            const proposalsPath = getDataFilePath('boundary-proposals.json');
            writeFileSync(proposalsPath, JSON.stringify(data, null, 2));
        } catch (error) {
            this.logger.error('Error saving boundary proposals:', error);
            throw error;
        }
    }

    /**
     * Save regions data to JSON file
     */
    saveRegionsData() {
        try {
            writeFileSync(this.regionsFile, JSON.stringify(this.regions, null, 2));
        } catch (error) {
            this.logger.error('Error saving regions data:', error);
            throw error;
        }
    }

    /**
     * Generate geohash-5 blocks for a boundary (simple bounding box approach)
     */
    generateGeohash5Blocks(boundary) {
        try {
            // Simple bounding box approach for now
            const coords = boundary.coordinates[0];
            const lats = coords.map(c => c[1]);
            const lngs = coords.map(c => c[0]);
            
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            
            // Generate sample geohash blocks covering the bounding box
            const blocks = [];
            
            // Step size for geohash-5 (~4.9km × 4.9km at equator)
            const step = 0.05;
            
            for (let lat = minLat; lat <= maxLat; lat += step) {
                for (let lng = minLng; lng <= maxLng; lng += step) {
                    // Generate geohash-5
                    const geohash = this.encodeGeohash(lat, lng, 5);
                    blocks.push(geohash);
                }
            }
            
            return [...new Set(blocks)]; // Remove duplicates
        } catch (error) {
            this.logger.error('Error generating geohash blocks:', error);
            return [];
        }
    }

    /**
     * Simple geohash encoding (basic implementation)
     */
    encodeGeohash(latitude, longitude, precision = 5) {
        const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
        let idx = 0;
        let bit = 0;
        let evenBit = true;
        let geohash = '';
        
        let latMin = -90, latMax = 90;
        let lonMin = -180, lonMax = 180;
        
        while (geohash.length < precision) {
            if (evenBit) {
                const lonMid = (lonMin + lonMax) / 2;
                if (longitude > lonMid) {
                    idx = (idx << 1) + 1;
                    lonMin = lonMid;
                } else {
                    idx = idx << 1;
                    lonMax = lonMid;
                }
            } else {
                const latMid = (latMin + latMax) / 2;
                if (latitude > latMid) {
                    idx = (idx << 1) + 1;
                    latMin = latMid;
                } else {
                    idx = idx << 1;
                    latMax = latMid;
                }
            }
            evenBit = !evenBit;
            
            if (++bit === 5) {
                geohash += base32[idx];
                bit = 0;
                idx = 0;
            }
        }
        
        return geohash;
    }
}

// Export both class and singleton instance (following standardized pattern)
export { RegionalGovernanceService };
export default new RegionalGovernanceService();
