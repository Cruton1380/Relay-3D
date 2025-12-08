/**
 * Microsharding Manager
 * Implements distributed vote storage and processing across microshards
 * Handles geographic and hash-based sharding for scalability
 */

import { BaseService } from '../utils/BaseService.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { getDataFilePath } from '../utils/storage/fileStorage.mjs';
import crypto from 'crypto';
import blockchain from '../blockchain-service/index.mjs';
import logger from '../utils/logging/logger.mjs';

/**
 * Shard types for different data distribution strategies
 */
export const SHARD_TYPES = {
    PROXIMITY: 'proximity_based',    // Geographic proximity sharding
    REGIONAL: 'regional_based',      // Regional boundary sharding  
    HASH: 'hash_based',             // Even hash distribution
    HYBRID: 'hybrid'                 // Combination approach
};

class MicroshardingManager extends BaseService {
    constructor() {
        super('microsharding');
        
        // Data file paths
        this.shardsFile = getDataFilePath('microshards.json');
        this.shardDataFile = getDataFilePath('shard-data.json');
        this.shardMapFile = getDataFilePath('shard-mapping.json');
        
        // In-memory state
        this.shards = new Map();           // shardId -> shard configuration
        this.shardData = new Map();        // shardId -> data storage
        this.shardMapping = new Map();     // dataId -> [shardIds] 
        this.nodeConnections = new Map();  // nodeId -> connection info
        
        // Configuration
        this.config = {
            totalShards: 1000,              // Total number of shards in network
            replicationFactor: 3,           // Each vote stored on 3 shards
            maxShardSize: 10000,           // Maximum records per shard
            syncInterval: 30 * 1000,       // Sync every 30 seconds
            healthCheckInterval: 60 * 1000, // Health check every minute
            nodeTimeout: 5000,             // 5 second timeout for node operations
            geohashPrecision: 5,           // Geohash-5 precision for proximity sharding
            loadBalanceThreshold: 0.8      // Rebalance when shard is 80% full
        };
        
        // Performance tracking
        this.metrics = {
            totalOperations: 0,
            shardsCreated: 0,
            dataDistributed: 0,
            syncOperations: 0,
            failedOperations: 0,
            lastSync: 0
        };
    }

    async _initializeService() {
        await this.loadShardData();
        await this.initializeShardNetwork();
        await this.startSyncProcess();
        await this.startHealthMonitoring();
        this.logger.info('Microsharding Manager initialized');
    }

    /**
     * Load shard data from disk
     */
    async loadShardData() {
        try {
            // Load shard configurations
            if (existsSync(this.shardsFile)) {
                const shardsData = JSON.parse(readFileSync(this.shardsFile, 'utf8'));
                for (const shard of shardsData.shards || []) {
                    this.shards.set(shard.id, shard);
                }
            }

            // Load shard data storage
            if (existsSync(this.shardDataFile)) {
                const dataStorage = JSON.parse(readFileSync(this.shardDataFile, 'utf8'));
                for (const [shardId, data] of Object.entries(dataStorage.data || {})) {
                    this.shardData.set(shardId, data);
                }
            }

            // Load shard mapping
            if (existsSync(this.shardMapFile)) {
                const mappingData = JSON.parse(readFileSync(this.shardMapFile, 'utf8'));
                for (const [dataId, shardIds] of Object.entries(mappingData.mappings || {})) {
                    this.shardMapping.set(dataId, shardIds);
                }
            }

            this.logger.info('Shard data loaded', {
                shards: this.shards.size,
                dataEntries: this.shardData.size,
                mappings: this.shardMapping.size
            });
        } catch (error) {
            this.logger.error('Failed to load shard data', { error: error.message });
            await this.saveShardData();
        }
    }

    /**
     * Save shard data to disk
     */
    async saveShardData() {
        try {
            // Save shard configurations
            const shardsData = {
                lastUpdated: Date.now(),
                totalShards: this.config.totalShards,
                shards: Array.from(this.shards.values())
            };
            writeFileSync(this.shardsFile, JSON.stringify(shardsData, null, 2));

            // Save shard data storage
            const dataStorage = {
                lastUpdated: Date.now(),
                data: Object.fromEntries(this.shardData)
            };
            writeFileSync(this.shardDataFile, JSON.stringify(dataStorage, null, 2));

            // Save shard mapping
            const mappingData = {
                lastUpdated: Date.now(),
                mappings: Object.fromEntries(this.shardMapping)
            };
            writeFileSync(this.shardMapFile, JSON.stringify(mappingData, null, 2));

        } catch (error) {
            this.logger.error('Failed to save shard data', { error: error.message });
        }
    }

    /**
     * Initialize the shard network
     */
    async initializeShardNetwork() {
        try {
            // Create initial shards if none exist
            if (this.shards.size === 0) {
                await this.createInitialShards();
            }

            // Initialize shard data storage for each shard
            for (const [shardId, shard] of this.shards) {
                if (!this.shardData.has(shardId)) {
                    this.shardData.set(shardId, {
                        votes: [],
                        elections: [],
                        commissions: [],
                        proposals: [],
                        metadata: {
                            created: Date.now(),
                            lastAccess: Date.now(),
                            recordCount: 0,
                            size: 0
                        }
                    });
                }
            }

            this.logger.info('Shard network initialized', { 
                totalShards: this.shards.size 
            });
        } catch (error) {
            this.logger.error('Failed to initialize shard network', { error: error.message });
        }
    }

    /**
     * Create initial shard configuration
     */
    async createInitialShards() {
        const shardTypes = [
            { type: SHARD_TYPES.PROXIMITY, count: 400 },  // 40% proximity-based
            { type: SHARD_TYPES.REGIONAL, count: 300 },   // 30% regional-based
            { type: SHARD_TYPES.HASH, count: 300 }        // 30% hash-based
        ];

        let shardIndex = 0;

        for (const shardConfig of shardTypes) {
            for (let i = 0; i < shardConfig.count; i++) {
                const shardId = `shard_${shardIndex.toString().padStart(4, '0')}`;
                
                const shard = {
                    id: shardId,
                    index: shardIndex,
                    type: shardConfig.type,
                    status: 'active',
                    capacity: this.config.maxShardSize,
                    currentLoad: 0,
                    geohashRange: this.generateGeohashRange(shardIndex, shardConfig.type),
                    hashRange: this.generateHashRange(shardIndex),
                    regionalAssignment: this.generateRegionalAssignment(shardIndex, shardConfig.type),
                    nodes: [], // Connected nodes storing this shard
                    created: Date.now(),
                    lastAccess: Date.now(),
                    replicationFactor: this.config.replicationFactor
                };

                this.shards.set(shardId, shard);
                this.metrics.shardsCreated++;
                shardIndex++;
            }
        }

        await this.saveShardData();
        this.logger.info('Initial shards created', { count: shardIndex });
    }

    /**
     * Distribute vote data across appropriate shards
     */
    async distributeVote(voteData) {
        try {
            this._trackOperation();
            this.metrics.totalOperations++;

            const {
                voteId,
                voteType,   // 'channel', 'regional', 'global'
                regionId,
                coordinates,
                userId,
                timestamp = Date.now()
            } = voteData;

            // Determine sharding strategy based on vote type
            const shardingStrategy = this.determineShardingStrategy(voteType);
            
            // Find target shards
            const targetShards = await this.findTargetShards(voteData, shardingStrategy);
            
            // Prepare vote record for storage
            const voteRecord = {
                id: voteId,
                type: voteType,
                data: voteData,
                timestamp,
                shardedAt: Date.now(),
                shards: targetShards.map(s => s.id)
            };

            // Distribute to selected shards
            const distributionResults = [];
            for (const shard of targetShards) {
                try {
                    const result = await this.storeInShard(shard.id, 'votes', voteRecord);
                    distributionResults.push({ shardId: shard.id, success: true, result });
                } catch (error) {
                    distributionResults.push({ shardId: shard.id, success: false, error: error.message });
                    this.metrics.failedOperations++;
                }
            }

            // Update shard mapping
            this.shardMapping.set(voteId, targetShards.map(s => s.id));

            await this.saveShardData();
            this.metrics.dataDistributed++;

            // Record distribution on blockchain
            await this.recordShardDistribution(voteId, targetShards, distributionResults);

            this.emit('vote.distributed', { voteId, shards: targetShards, results: distributionResults });
            
            return {
                success: true,
                voteId,
                shardsUsed: targetShards.length,
                distributionResults
            };
        } catch (error) {
            this._handleError('distributeVote', error);
            this.metrics.failedOperations++;
            throw error;
        }
    }

    /**
     * Determine sharding strategy based on vote type
     */
    determineShardingStrategy(voteType) {
        const strategies = {
            channel: SHARD_TYPES.PROXIMITY,    // Channel votes use proximity sharding
            regional: SHARD_TYPES.REGIONAL,    // Regional votes use regional sharding  
            global: SHARD_TYPES.HASH,         // Global votes use hash distribution
            election: SHARD_TYPES.REGIONAL,    // Elections use regional sharding
            commission: SHARD_TYPES.HASH      // Commissions use hash distribution
        };

        return strategies[voteType] || SHARD_TYPES.HASH;
    }

    /**
     * Find target shards based on strategy and data
     */
    async findTargetShards(voteData, strategy) {
        const targetShards = [];
        let availableShards = Array.from(this.shards.values())
            .filter(s => s.status === 'active' && s.type === strategy);

        switch (strategy) {
            case SHARD_TYPES.PROXIMITY:
                targetShards.push(...this.findProximityShards(voteData, availableShards));
                break;
                
            case SHARD_TYPES.REGIONAL:
                targetShards.push(...this.findRegionalShards(voteData, availableShards));
                break;
                
            case SHARD_TYPES.HASH:
                targetShards.push(...this.findHashShards(voteData, availableShards));
                break;
                
            default:
                targetShards.push(...this.findHashShards(voteData, availableShards));
        }

        // Ensure we have the desired replication factor
        while (targetShards.length < this.config.replicationFactor && availableShards.length > targetShards.length) {
            const additionalShard = this.findLeastLoadedShard(availableShards, targetShards);
            if (additionalShard) {
                targetShards.push(additionalShard);
            } else {
                break;
            }
        }

        return targetShards.slice(0, this.config.replicationFactor);
    }

    /**
     * Find shards based on proximity/geohash
     */
    findProximityShards(voteData, availableShards) {
        if (!voteData.coordinates) {
            // Fall back to hash-based if no coordinates
            return this.findHashShards(voteData, availableShards);
        }

        const geohash = this.generateGeohash(voteData.coordinates.lat, voteData.coordinates.lng);
        
        return availableShards
            .filter(shard => this.geohashInRange(geohash, shard.geohashRange))
            .sort((a, b) => a.currentLoad - b.currentLoad)
            .slice(0, this.config.replicationFactor);
    }

    /**
     * Find shards based on regional assignment
     */
    findRegionalShards(voteData, availableShards) {
        if (!voteData.regionId) {
            return this.findHashShards(voteData, availableShards);
        }

        return availableShards
            .filter(shard => shard.regionalAssignment.includes(voteData.regionId))
            .sort((a, b) => a.currentLoad - b.currentLoad)
            .slice(0, this.config.replicationFactor);
    }

    /**
     * Find shards based on hash distribution
     */
    findHashShards(voteData, availableShards) {
        const hash = crypto.createHash('sha256')
            .update(voteData.voteId || voteData.userId || JSON.stringify(voteData))
            .digest('hex');
        
        const hashValue = parseInt(hash.substring(0, 8), 16);
        
        return availableShards
            .filter(shard => {
                const [min, max] = shard.hashRange;
                return hashValue >= min && hashValue <= max;
            })
            .sort((a, b) => a.currentLoad - b.currentLoad)
            .slice(0, this.config.replicationFactor);
    }

    /**
     * Find least loaded shard from available shards
     */
    findLeastLoadedShard(availableShards, excludeShards) {
        const excludeIds = new Set(excludeShards.map(s => s.id));
        
        return availableShards
            .filter(shard => !excludeIds.has(shard.id))
            .sort((a, b) => a.currentLoad - b.currentLoad)[0];
    }

    /**
     * Store data in a specific shard
     */
    async storeInShard(shardId, dataType, data) {
        try {
            const shard = this.shards.get(shardId);
            if (!shard) {
                throw new Error(`Shard ${shardId} not found`);
            }

            let shardData = this.shardData.get(shardId);
            if (!shardData) {
                // Initialize shard data if not exists
                shardData = {
                    votes: [],
                    elections: [],
                    commissions: [],
                    proposals: [],
                    metadata: {
                        created: Date.now(),
                        lastAccess: Date.now(),
                        recordCount: 0,
                        size: 0
                    }
                };
                this.shardData.set(shardId, shardData);
            }

            // Add data to appropriate array
            if (!shardData[dataType]) {
                shardData[dataType] = [];
            }
            
            shardData[dataType].push(data);
            
            // Update metadata
            shardData.metadata.lastAccess = Date.now();
            shardData.metadata.recordCount++;
            shardData.metadata.size = JSON.stringify(shardData).length;

            // Update shard load
            shard.currentLoad = shardData.metadata.recordCount;
            shard.lastAccess = Date.now();

            // Check if shard needs rebalancing
            if (shard.currentLoad / shard.capacity > this.config.loadBalanceThreshold) {
                this.emit('shard.rebalance.needed', { shardId, load: shard.currentLoad });
            }

            return {
                success: true,
                shardId,
                recordCount: shardData.metadata.recordCount,
                dataType
            };
        } catch (error) {
            this.logger.error('Failed to store in shard', { shardId, error: error.message });
            throw error;
        }
    }

    /**
     * Retrieve vote data from shards
     */
    async retrieveVote(voteId) {
        try {
            this._trackOperation();

            const shardIds = this.shardMapping.get(voteId);
            if (!shardIds || shardIds.length === 0) {
                throw new Error(`No shards found for vote ${voteId}`);
            }

            // Try to retrieve from any available shard
            for (const shardId of shardIds) {
                try {
                    const result = await this.retrieveFromShard(shardId, 'votes', voteId);
                    if (result) {
                        return { success: true, data: result, shardId };
                    }
                } catch (error) {
                    this.logger.warn('Failed to retrieve from shard', { shardId, voteId, error: error.message });
                }
            }

            throw new Error(`Vote ${voteId} not found in any shard`);
        } catch (error) {
            this._handleError('retrieveVote', error);
            throw error;
        }
    }

    /**
     * Retrieve data from a specific shard
     */
    async retrieveFromShard(shardId, dataType, dataId) {
        try {
            const shardData = this.shardData.get(shardId);
            if (!shardData || !shardData[dataType]) {
                return null;
            }

            const record = shardData[dataType].find(item => item.id === dataId);
            
            if (record) {
                // Update shard access time
                const shard = this.shards.get(shardId);
                if (shard) {
                    shard.lastAccess = Date.now();
                }
                
                shardData.metadata.lastAccess = Date.now();
            }

            return record;
        } catch (error) {
            this.logger.error('Failed to retrieve from shard', { shardId, dataType, dataId, error: error.message });
            throw error;
        }
    }

    /**
     * Start synchronization process between shards
     */
    async startSyncProcess() {
        setInterval(async () => {
            await this.syncShards();
        }, this.config.syncInterval);

        this.logger.info('Shard synchronization started', {
            interval: this.config.syncInterval
        });
    }

    /**
     * Synchronize data between shard replicas
     */
    async syncShards() {
        try {
            this.metrics.syncOperations++;

            // Check for inconsistencies between replicated shards
            for (const [dataId, shardIds] of this.shardMapping) {
                if (shardIds.length > 1) {
                    await this.checkShardConsistency(dataId, shardIds);
                }
            }

            this.metrics.lastSync = Date.now();
            
            // Emit sync completion event
            this.emit('shards.synced', {
                timestamp: Date.now(),
                totalShards: this.shards.size,
                syncOperations: this.metrics.syncOperations
            });

        } catch (error) {
            this.logger.error('Shard synchronization failed', { error: error.message });
        }
    }

    /**
     * Check consistency between shard replicas
     */
    async checkShardConsistency(dataId, shardIds) {
        try {
            const records = [];
            
            // Retrieve record from each shard
            for (const shardId of shardIds) {
                try {
                    const record = await this.retrieveFromShard(shardId, 'votes', dataId);
                    if (record) {
                        records.push({ shardId, record });
                    }
                } catch (error) {
                    this.logger.warn('Failed to retrieve for consistency check', { 
                        shardId, 
                        dataId, 
                        error: error.message 
                    });
                }
            }

            // Check for inconsistencies
            if (records.length > 1) {
                const baseRecord = records[0].record;
                for (let i = 1; i < records.length; i++) {
                    const compareRecord = records[i].record;
                    if (JSON.stringify(baseRecord) !== JSON.stringify(compareRecord)) {
                        this.emit('shard.inconsistency', {
                            dataId,
                            shards: [records[0].shardId, records[i].shardId],
                            baseRecord,
                            compareRecord
                        });
                    }
                }
            }

        } catch (error) {
            this.logger.error('Consistency check failed', { dataId, error: error.message });
        }
    }

    /**
     * Start health monitoring for shards
     */
    async startHealthMonitoring() {
        setInterval(async () => {
            await this.checkShardHealth();
        }, this.config.healthCheckInterval);
    }

    /**
     * Check health of all shards
     */
    async checkShardHealth() {
        try {
            const healthStats = {
                total: this.shards.size,
                active: 0,
                overloaded: 0,
                inactive: 0,
                errors: []
            };

            for (const [shardId, shard] of this.shards) {
                try {
                    const health = await this.checkSingleShardHealth(shardId);
                    
                    if (health.status === 'active') {
                        healthStats.active++;
                    } else if (health.status === 'overloaded') {
                        healthStats.overloaded++;
                    } else {
                        healthStats.inactive++;
                    }

                    if (health.error) {
                        healthStats.errors.push({ shardId, error: health.error });
                    }

                } catch (error) {
                    healthStats.errors.push({ shardId, error: error.message });
                    healthStats.inactive++;
                }
            }

            this.emit('shards.health.check', { stats: healthStats });

            // Log warnings for unhealthy shards
            if (healthStats.overloaded > 0) {
                this.logger.warn('Overloaded shards detected', { count: healthStats.overloaded });
            }
            
            if (healthStats.inactive > 0) {
                this.logger.warn('Inactive shards detected', { count: healthStats.inactive });
            }

        } catch (error) {
            this.logger.error('Shard health check failed', { error: error.message });
        }
    }

    /**
     * Check health of a single shard
     */
    async checkSingleShardHealth(shardId) {
        try {
            const shard = this.shards.get(shardId);
            const shardData = this.shardData.get(shardId);

            if (!shard || !shardData) {
                return { status: 'inactive', error: 'Shard data missing' };
            }

            // Check load percentage
            const loadPercentage = shard.currentLoad / shard.capacity;
            
            if (loadPercentage > 0.9) {
                shard.status = 'overloaded';
                return { status: 'overloaded', loadPercentage };
            } else if (loadPercentage > this.config.loadBalanceThreshold) {
                return { status: 'high_load', loadPercentage };
            } else {
                shard.status = 'active';
                return { status: 'active', loadPercentage };
            }

        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    /**
     * Generate geohash from coordinates
     */
    generateGeohash(lat, lng) {
        // Simple geohash implementation for demonstration
        // In production, use a proper geohash library
        const hash = crypto.createHash('sha256')
            .update(`${lat.toFixed(5)},${lng.toFixed(5)}`)
            .digest('hex');
        return hash.substring(0, this.config.geohashPrecision);
    }

    /**
     * Generate geohash range for a shard
     */
    generateGeohashRange(shardIndex, shardType) {
        if (shardType !== SHARD_TYPES.PROXIMITY) {
            return null;
        }

        // Divide geohash space into ranges
        const totalShards = 400; // Number of proximity shards
        const rangeSize = Math.pow(16, this.config.geohashPrecision) / totalShards;
        const start = Math.floor(shardIndex * rangeSize);
        const end = Math.floor((shardIndex + 1) * rangeSize) - 1;

        return { start, end };
    }

    /**
     * Generate hash range for a shard
     */
    generateHashRange(shardIndex) {
        const maxHash = 0xFFFFFFFF; // 32-bit max
        const rangeSize = Math.floor(maxHash / this.config.totalShards);
        const start = shardIndex * rangeSize;
        const end = (shardIndex + 1) * rangeSize - 1;

        return [start, end];
    }

    /**
     * Generate regional assignment for a shard
     */
    generateRegionalAssignment(shardIndex, shardType) {
        if (shardType !== SHARD_TYPES.REGIONAL) {
            return [];
        }

        // Simple assignment - each shard covers a set of regions
        // In production, this would be more sophisticated
        const regions = ['US', 'EU', 'ASIA', 'OCEANIA', 'AFRICA', 'AMERICAS'];
        const shardsPerRegion = Math.floor(300 / regions.length); // 300 regional shards
        const regionIndex = Math.floor(shardIndex / shardsPerRegion);
        
        return [regions[regionIndex % regions.length]];
    }

    /**
     * Check if geohash is in range
     */
    geohashInRange(geohash, range) {
        if (!range) return false;
        
        const hashValue = parseInt(geohash, 16);
        return hashValue >= range.start && hashValue <= range.end;
    }

    /**
     * Record shard distribution on blockchain
     */
    async recordShardDistribution(dataId, shards, results) {
        try {
            const blockData = {
                type: 'shard_distribution',
                dataId,
                shards: shards.map(s => ({ id: s.id, type: s.type })),
                replicationFactor: shards.length,
                timestamp: Date.now(),
                results: results.map(r => ({ shardId: r.shardId, success: r.success }))
            };

            await blockchain.addTransaction('shard_distribution', blockData, crypto.randomUUID());
            await blockchain.mine();
        } catch (error) {
            this.logger.error('Failed to record shard distribution on blockchain', { 
                dataId, 
                error: error.message 
            });
        }
    }

    /**
     * Get shard statistics
     */
    getShardStats() {
        const shardStats = {
            total: this.shards.size,
            byType: {},
            byStatus: {},
            loadDistribution: {
                empty: 0,
                low: 0,
                medium: 0,
                high: 0,
                overloaded: 0
            },
            totalRecords: 0,
            averageLoad: 0
        };

        let totalLoad = 0;

        for (const shard of this.shards.values()) {
            // Count by type
            shardStats.byType[shard.type] = (shardStats.byType[shard.type] || 0) + 1;
            
            // Count by status
            shardStats.byStatus[shard.status] = (shardStats.byStatus[shard.status] || 0) + 1;
            
            // Load distribution
            const loadPercentage = shard.currentLoad / shard.capacity;
            if (loadPercentage === 0) {
                shardStats.loadDistribution.empty++;
            } else if (loadPercentage < 0.25) {
                shardStats.loadDistribution.low++;
            } else if (loadPercentage < 0.5) {
                shardStats.loadDistribution.medium++;
            } else if (loadPercentage < 0.8) {
                shardStats.loadDistribution.high++;
            } else {
                shardStats.loadDistribution.overloaded++;
            }

            totalLoad += shard.currentLoad;
            shardStats.totalRecords += shard.currentLoad;
        }

        shardStats.averageLoad = this.shards.size > 0 ? totalLoad / this.shards.size : 0;

        return {
            ...shardStats,
            metrics: this.metrics,
            config: {
                totalShards: this.config.totalShards,
                replicationFactor: this.config.replicationFactor,
                maxShardSize: this.config.maxShardSize
            }
        };
    }

    /**
     * Get shard by ID
     */
    getShard(shardId) {
        return this.shards.get(shardId);
    }

    /**
     * Get data from shard
     */
    getShardData(shardId) {
        return this.shardData.get(shardId);
    }    /**
     * Get mapping for data ID
     */
    getShardMapping(dataId) {
        return this.shardMapping.get(dataId);
    }

    /**
     * Convenience wrapper methods for external API
     */

    /**
     * Add data to a specific shard
     */
    async addDataToShard(shardId, dataId, data) {
        try {
            return await this.storeInShard(shardId, 'generic', { id: dataId, ...data });
        } catch (error) {
            this.logger.error('Error adding data to shard', { shardId, dataId, error: error.message });
            throw error;
        }
    }

    /**
     * Get data from a specific shard
     */
    async getDataFromShard(shardId, dataId) {
        try {
            return await this.retrieveFromShard(shardId, 'generic', dataId);
        } catch (error) {
            this.logger.error('Error getting data from shard', { shardId, dataId, error: error.message });
            throw error;
        }
    }

    /**
     * Get all shards
     */
    getAllShards() {
        return this.shards;
    }
}

// Export both class and singleton instance
export { MicroshardingManager };
export default new MicroshardingManager();
