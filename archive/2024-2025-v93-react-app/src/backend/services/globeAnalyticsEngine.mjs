/**
 * Globe Analytics Engine for Geographic Vote Distribution Analysis
 * 
 * Provides 3D interactive visualization of global voting patterns using
 * privacy-preserving regional aggregation (no GPS-level location tracking).
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { getDataFilePath } from '../utils/dataUtils.mjs';
import BaseService from './BaseService.mjs';

export class GlobeAnalyticsEngine extends BaseService {
    constructor() {
        super('globe-analytics');
          // Data storage
        this.geoVotingDataFile = getDataFilePath('geo-voting-data.json');
        this.userRegionFile = getDataFilePath('user-regions.json');
        this.regionalBoundariesFile = getDataFilePath('regional-boundaries.json');
        
        // In-memory state
        this.geoVotingData = new Map();
        this.userRegions = new Map(); // Only store user regions, not precise locations
        this.regionalBoundaries = new Map();
        this.activePlots = new Map();
        
        // Configuration
        this.config = {
            regionUpdateInterval: 2 * 60 * 1000, // 2 minutes
            privacyClusterMinSize: 5, // Minimum users per region cluster
            regionSize: 'large', // Use large regions for privacy (state/province level)
            maxPlotsPerGlobe: 50000,
            realTimeAnimationDuration: 2000 // 2 seconds
        };
        
        // Services
        this.userRegionService = null;
        this.realTimeUpdateService = null;
        this.geoPrivacyService = null;
        this.channelService = null;
        
        this.initializeService();
    }

    async _initializeService() {
        await this.loadGeoVotingData();
        await this.initializeRealTimeUpdates();
        this.logger.info('Globe Analytics Engine initialized');
    }

    /**
     * Initialize 3D globe visualization configuration
     */
    async initializeGlobeVisualization(containerId, options = {}) {
        try {
            const globeConfig = {
                renderEngine: 'three.js',
                globeTexture: 'high-resolution-earth',
                interactionEnabled: true,
                realTimeUpdates: true,
                privacyPreservation: 'maximum',
                ...options
            };

            const globeInstance = {
                containerId,
                config: globeConfig,
                initialized: true,
                createdAt: Date.now()
            };

            this.activePlots.set(containerId, {
                globeInstance,
                userPlots: new Map(),
                regionalBoundaries: new Map(),
                animations: new Map()
            });

            return {
                globeInstance,
                controls: this.createGlobeControls(containerId),
                analyticsInterface: this.createAnalyticsInterface(containerId)
            };

        } catch (error) {
            this._handleError('initializeGlobeVisualization', error);
            throw error;
        }
    }    /**
     * Plot voting users on globe with privacy preservation (regional aggregation only)
     */
    async plotVotingUsers(topicRowId, filters = {}) {
        try {
            this._trackOperation();

            const userVotingData = await this.getGeographicVotingData(topicRowId, filters);
            
            // Apply regional aggregation for privacy (no precise location data)
            const regionalAggregation = await this.aggregateUsersByRegion(userVotingData);
            
            const plotData = {
                activeUsers: this.createRegionalPlots(regionalAggregation.active, {
                    color: '#10b981',
                    size: 'large',
                    pulseEffect: true,
                    votingPower: 'visualized',
                    opacity: 0.8
                }),
                inactiveUsers: this.createRegionalPlots(regionalAggregation.inactive, {
                    color: '#6b7280',
                    size: 'medium',
                    pulseEffect: false,
                    votingPower: 'diminished',
                    opacity: 0.5
                }),
                foreignUsers: this.createRegionalPlots(regionalAggregation.foreign, {
                    color: '#f59e0b',
                    size: 'small',
                    pulseEffect: false,
                    votingPower: 'limited',
                    opacity: 0.6
                }),
                localUsers: this.createRegionalPlots(regionalAggregation.local, {
                    color: '#3b82f6',
                    size: 'large',
                    pulseEffect: true,
                    votingPower: 'full',
                    opacity: 0.9
                }),
                proximityUsers: this.createRegionalPlots(regionalAggregation.proximity, {
                    color: '#8b5cf6',
                    size: 'extra-large',
                    pulseEffect: true,
                    votingPower: 'enhanced',
                    opacity: 1.0
                })
            };

            return plotData;

        } catch (error) {
            this._handleError('plotVotingUsers', error);
            throw error;
        }
    }

    /**
     * Create user plots with privacy preservation
     */
    createUserPlots(locationData, visualConfig) {
        return locationData.map(location => ({
            id: crypto.randomUUID(),
            coordinates: {
                lat: location.anonymizedLat,
                lng: location.anonymizedLng,
                altitude: this.calculateAltitudeFromVoteWeight(location.voteWeight)
            },
            visualization: {
                ...visualConfig,
                intensity: location.userCount,
                radius: this.calculateRadiusFromUserCount(location.userCount)
            },
            metadata: {
                userCount: location.userCount,
                averageVoteWeight: location.avgVoteWeight,
                channelDistribution: location.channelDistribution,
                region: location.region,
                lastUpdate: location.lastUpdate
            },
            interactions: {
                clickable: true,
                tooltip: this.generateLocationTooltip(location),
                detailsAvailable: true
            }
        }));
    }

    /**
     * Create regional plots with privacy preservation (no precise location data)
     */
    createRegionalPlots(regionData, visualConfig) {
        return regionData.map(region => ({
            id: crypto.randomUUID(),
            regionInfo: {
                regionId: region.regionId,
                regionName: region.regionName,
                regionCenter: region.regionCenter, // Approximate center of region, not user location
                regionBounds: region.regionBounds
            },
            visualization: {
                ...visualConfig,
                intensity: region.userCount,
                radius: this.calculateRadiusFromUserCount(region.userCount)
            },
            metadata: {
                userCount: region.userCount,
                averageVoteWeight: region.avgVoteWeight,
                channelDistribution: region.channelDistribution,
                regionSize: region.regionSize,
                lastUpdate: region.lastUpdate
            },
            interactions: {
                clickable: true,
                tooltip: this.generateRegionTooltip(region),
                detailsAvailable: true
            }
        }));
    }

    /**
     * Aggregate users by region for privacy preservation
     */
    async aggregateUsersByRegion(userVotingData) {
        const regionMap = new Map();

        // Group users by their current region only (no GPS coordinates)
        for (const userData of userVotingData) {
            const userRegion = await this.getUserRegion(userData.userId);
            
            if (!regionMap.has(userRegion.id)) {
                regionMap.set(userRegion.id, {
                    regionId: userRegion.id,
                    regionName: userRegion.name,
                    regionCenter: userRegion.center,
                    regionBounds: userRegion.bounds,
                    users: [],
                    userCount: 0,
                    totalVoteWeight: 0,
                    channelDistribution: {}
                });
            }

            const region = regionMap.get(userRegion.id);
            region.users.push(userData);
            region.userCount++;
            region.totalVoteWeight += userData.voteWeight || 1;
            
            // Track channel choice distribution
            const choice = userData.channelChoice;
            region.channelDistribution[choice] = (region.channelDistribution[choice] || 0) + 1;
        }

        // Convert to categorized output
        const result = {
            active: [],
            inactive: [],
            foreign: [],
            local: [],
            proximity: []
        };

        for (const [regionId, regionData] of regionMap) {
            regionData.avgVoteWeight = regionData.totalVoteWeight / regionData.userCount;
            regionData.lastUpdate = Date.now();

            // Categorize based on user types in region
            const userTypes = regionData.users.map(u => u.userType);
            const dominantType = this.getDominantUserType(userTypes);

            result[dominantType].push(regionData);
        }

        return result;
    }

    /**
     * Get user's region (not precise location)
     */
    async getUserRegion(userId) {
        // Return only broad regional information, never GPS coordinates
        const userRegionData = this.userRegions.get(userId);
        
        if (!userRegionData) {
            // Default to a broad "unknown" region
            return {
                id: 'unknown-region',
                name: 'Unknown Region',
                center: { lat: 0, lng: 0 }, // Neutral point
                bounds: null
            };
        }

        return {
            id: userRegionData.regionId,
            name: userRegionData.regionName,
            center: userRegionData.regionCenter,
            bounds: userRegionData.regionBounds
        };
    }

    /**
     * Real-time globe updates for live voting
     */
    async startRealTimeGlobeUpdates(topicRowId) {
        try {
            // Subscribe to voting events
            this.realTimeUpdateService.subscribe('vote_cast', async (voteData) => {
                if (voteData.topicRowId === topicRowId) {
                    await this.handleRealTimeVote(voteData);
                }
            });

            // Subscribe to user location changes
            this.realTimeUpdateService.subscribe('user_location_change', async (locationData) => {
                await this.handleUserLocationChange(locationData);
            });

            // Subscribe to channel updates
            this.realTimeUpdateService.subscribe('channel_update', async (channelData) => {
                if (channelData.topicRowId === topicRowId) {
                    await this.handleChannelUpdate(channelData);
                }
            });

            this.logger.info('Real-time globe updates started', { topicRowId });

        } catch (error) {
            this._handleError('startRealTimeGlobeUpdates', error);
            throw error;
        }
    }

    /**
     * Handle real-time vote events
     */
    async handleRealTimeVote(voteData) {
        try {
            // Anonymize location for privacy
            const anonymizedLocation = await this.anonymizeLocation(voteData.userLocation);
            
            // Add vote pulse animation
            await this.addVotePulseAnimation(anonymizedLocation, voteData.channelChoice);
            
            // Update regional metrics
            await this.updateRegionalMetrics(voteData.region);
            
            // Emit real-time update event
            this.emit('globe.vote.cast', {
                location: anonymizedLocation,
                channelChoice: voteData.channelChoice,
                timestamp: voteData.timestamp
            });

        } catch (error) {
            this._handleError('handleRealTimeVote', error);
        }
    }

    /**
     * Add vote pulse animation to globe
     */
    async addVotePulseAnimation(location, channelChoice) {
        const pulseId = crypto.randomUUID();
        const pulse = {
            id: pulseId,
            location,
            channelChoice,
            animation: {
                type: 'expanding_ring',
                duration: this.config.realTimeAnimationDuration,
                color: this.getChannelColor(channelChoice),
                maxRadius: 50,
                opacity: { start: 1.0, end: 0.0 }
            },
            createdAt: Date.now()
        };

        // Store animation for cleanup
        this.activePlots.forEach(plot => {
            plot.animations.set(pulseId, pulse);
        });

        // Auto-cleanup after animation
        setTimeout(() => {
            this.activePlots.forEach(plot => {
                plot.animations.delete(pulseId);
            });
        }, this.config.realTimeAnimationDuration);

        this.emit('globe.animation.pulse', pulse);
    }

    /**
     * Multi-topic row globe comparison
     */
    async compareTopicRowsOnGlobe(topicRowIds, comparisonMode = 'split_view') {
        try {
            const globeComparison = {
                comparisonMode, // 'split_view', 'overlay', 'time_lapse'
                topicRows: await Promise.all(
                    topicRowIds.map(async (id) => ({
                        topicRowId: id,
                        userData: await this.plotVotingUsers(id),
                        metrics: await this.calculateGlobalMetrics(id),
                        boundaries: await this.getRegionalBoundariesForTopicRow(id)
                    }))
                ),
                comparativeAnalysis: {
                    geographicOverlap: this.analyzeGeographicOverlap(topicRowIds),
                    userMigration: this.analyzeUserMigrationBetweenTopics(topicRowIds),
                    regionalInfluence: this.compareRegionalInfluence(topicRowIds),
                    votingPatterns: this.compareVotingPatterns(topicRowIds)
                },
                visualization: {
                    colorSchemes: this.generateComparisonColorSchemes(topicRowIds),
                    layerConfiguration: this.generateLayerConfiguration(comparisonMode),
                    interactionModes: this.getComparisonInteractionModes(comparisonMode)
                }
            };

            return globeComparison;

        } catch (error) {
            this._handleError('compareTopicRowsOnGlobe', error);
            throw error;
        }
    }

    /**
     * Anonymize user locations for privacy
     */
    async anonymizeUserLocations(userVotingData) {
        const anonymized = {
            active: [],
            inactive: [],
            foreign: [],
            local: [],
            proximity: []
        };

        for (const [userType, users] of Object.entries(userVotingData)) {
            const clusters = await this.clusterUserLocations(users, this.config.privacyClusterMinSize);
            
            anonymized[userType] = clusters.map(cluster => ({
                anonymizedLat: this.anonymizeCoordinate(cluster.centerLat),
                anonymizedLng: this.anonymizeCoordinate(cluster.centerLng),
                userCount: cluster.userCount,
                avgVoteWeight: cluster.avgVoteWeight,
                channelDistribution: cluster.channelDistribution,
                region: cluster.dominantRegion,
                lastUpdate: Date.now()
            }));
        }

        return anonymized;
    }

    /**
     * Cluster user locations for privacy
     */
    async clusterUserLocations(users, minClusterSize) {
        // Simple grid-based clustering for privacy
        const clusters = new Map();
        const gridSize = this.config.geographicPrecision;

        users.forEach(user => {
            const gridLat = Math.floor(user.lat / gridSize) * gridSize;
            const gridLng = Math.floor(user.lng / gridSize) * gridSize;
            const gridKey = `${gridLat},${gridLng}`;

            if (!clusters.has(gridKey)) {
                clusters.set(gridKey, {
                    centerLat: gridLat + gridSize / 2,
                    centerLng: gridLng + gridSize / 2,
                    users: [],
                    userCount: 0,
                    totalVoteWeight: 0,
                    channelVotes: new Map()
                });
            }

            const cluster = clusters.get(gridKey);
            cluster.users.push(user);
            cluster.userCount++;
            cluster.totalVoteWeight += user.voteWeight;
            
            const channelCount = cluster.channelVotes.get(user.channelChoice) || 0;
            cluster.channelVotes.set(user.channelChoice, channelCount + 1);
        });

        // Filter clusters that meet minimum size requirement
        return Array.from(clusters.values())
            .filter(cluster => cluster.userCount >= minClusterSize)
            .map(cluster => ({
                ...cluster,
                avgVoteWeight: cluster.totalVoteWeight / cluster.userCount,
                channelDistribution: Object.fromEntries(cluster.channelVotes),
                dominantRegion: this.getDominantRegion(cluster.users)
            }));
    }

    /**
     * Anonymize coordinate for privacy
     */
    anonymizeCoordinate(coordinate) {
        const noise = (Math.random() - 0.5) * this.config.geographicPrecision * 0.5;
        return coordinate + noise;
    }

    /**
     * Calculate altitude from vote weight for 3D visualization
     */
    calculateAltitudeFromVoteWeight(voteWeight) {
        const maxAltitude = 100; // Maximum altitude in visualization units
        const normalizedWeight = Math.min(voteWeight / 100, 1); // Normalize to 0-1
        return normalizedWeight * maxAltitude;
    }

    /**
     * Calculate radius from user count
     */
    calculateRadiusFromUserCount(userCount) {
        const minRadius = 5;
        const maxRadius = 25;
        const logCount = Math.log(userCount + 1);
        const normalizedLog = logCount / Math.log(1000); // Normalize assuming max 1000 users
        return minRadius + (normalizedLog * (maxRadius - minRadius));
    }

    /**
     * Generate location tooltip
     */
    generateLocationTooltip(location) {
        return {
            title: `${location.userCount} Users`,
            details: [
                `Average Vote Weight: ${location.avgVoteWeight.toFixed(2)}`,
                `Region: ${location.region}`,
                `Last Update: ${new Date(location.lastUpdate).toLocaleString()}`
            ],
            channelBreakdown: Object.entries(location.channelDistribution)
                .map(([channel, count]) => `${channel}: ${count} votes`)
        };
    }

    /**
     * Generate tooltip for region (privacy-safe)
     */
    generateRegionTooltip(region) {
        return `
            <div class="region-tooltip">
                <h4>${region.regionName}</h4>
                <p><strong>Users:</strong> ${region.userCount}</p>
                <p><strong>Avg Vote Weight:</strong> ${region.avgVoteWeight.toFixed(2)}</p>
                <p><strong>Most Popular Choice:</strong> ${this.getMostPopularChoice(region.channelDistribution)}</p>
                <p><em>Region-level data only for privacy protection</em></p>
            </div>
        `;
    }

    /**
     * Create globe controls configuration
     */
    createGlobeControls(containerId) {
        return {
            rotation: {
                enabled: true,
                speed: 0.5,
                autoRotate: false
            },
            zoom: {
                enabled: true,
                min: 1,
                max: 20,
                default: 3
            },
            pan: {
                enabled: true,
                dampening: 0.1
            },
            interactions: {
                click: true,
                hover: true,
                drag: true
            }
        };
    }

    /**
     * Create analytics interface configuration
     */
    createAnalyticsInterface(containerId) {
        return {
            filters: {
                userTypes: ['active', 'inactive', 'foreign', 'local', 'proximity'],
                timeRanges: ['1h', '6h', '24h', '7d', '30d'],
                regions: this.getAvailableRegions(),
                channels: this.getAvailableChannels()
            },
            visualizations: {
                heatmap: { enabled: true, opacity: 0.6 },
                clusters: { enabled: true, minSize: 5 },
                boundaries: { enabled: true, interactive: true },
                animations: { enabled: true, speed: 1.0 }
            },
            export: {
                formats: ['png', 'json', 'csv'],
                privacyLevel: 'maximum'
            }
        };
    }

    /**
     * Load geo voting data from storage
     */
    async loadGeoVotingData() {
        try {
            if (await this.fileExists(this.geoVotingDataFile)) {
                const data = await this.readJsonFile(this.geoVotingDataFile);
                this.geoVotingData = new Map(Object.entries(data));
            }
            this.logger.info('Geo voting data loaded successfully');
        } catch (error) {
            this.logger.error('Failed to load geo voting data', { error: error.message });
        }
    }

    /**
     * Save geo voting data to storage
     */
    async saveGeoVotingData() {
        try {
            await this.writeJsonFile(this.geoVotingDataFile, Object.fromEntries(this.geoVotingData));
            this.logger.info('Geo voting data saved successfully');
        } catch (error) {
            this.logger.error('Failed to save geo voting data', { error: error.message });
        }
    }

    /**
     * Utility methods
     */
    getChannelColor(channelChoice) {
        const colors = {
            'channel_1': '#10b981',
            'channel_2': '#3b82f6',
            'channel_3': '#f59e0b',
            'channel_4': '#8b5cf6',
            'default': '#6b7280'
        };
        return colors[channelChoice] || colors.default;
    }

    getAvailableRegions() {
        return Array.from(this.regionalBoundaries.keys());
    }

    getAvailableChannels() {
        // Implementation would integrate with channel service
        return [];
    }

    getDominantRegion(users) {
        const regionCounts = new Map();
        users.forEach(user => {
            const count = regionCounts.get(user.region) || 0;
            regionCounts.set(user.region, count + 1);
        });

        let dominantRegion = null;
        let maxCount = 0;
        for (const [region, count] of regionCounts) {
            if (count > maxCount) {
                maxCount = count;
                dominantRegion = region;
            }
        }

        return dominantRegion;
    }

    getDominantUserType(userTypes) {
        const typeCounts = new Map();
        userTypes.forEach(type => {
            const count = typeCounts.get(type) || 0;
            typeCounts.set(type, count + 1);
        });

        let dominantType = null;
        let maxCount = 0;
        for (const [type, count] of typeCounts) {
            if (count > maxCount) {
                maxCount = count;
                dominantType = type;
            }
        }

        return dominantType;
    }

    getMostPopularChoice(channelDistribution) {
        let maxChoice = null;
        let maxCount = 0;
        for (const [choice, count] of Object.entries(channelDistribution)) {
            if (count > maxCount) {
                maxCount = count;
                maxChoice = choice;
            }
        }
        return maxChoice;
    }
}

export default GlobeAnalyticsEngine;
