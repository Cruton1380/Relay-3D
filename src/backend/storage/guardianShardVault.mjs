/**
 * Relay KeySpace Storage Market - Guardian Shard Vault Module
 * 
 * Implements guardian-hosted emergency shard storage for vault-tier files.
 * Provides secure backup and recovery capabilities through trusted guardians
 * in the Relay network.
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export class GuardianShardVault extends EventEmitter {
    constructor(guardianAPI, shardManager, keyspaceAPI) {
        super();
        this.guardianAPI = guardianAPI;
        this.shardManager = shardManager;
        this.keyspaceAPI = keyspaceAPI;
        
        // Guardian shard storage
        this.guardianShards = new Map();
        
        // Guardian availability tracking
        this.guardianStatus = new Map();
        
        // Recovery requests
        this.recoveryRequests = new Map();
        
        // Guardian shard assignments
        this.shardAssignments = new Map();
        
        // Configuration
        this.config = {
            minGuardians: 3, // Minimum guardians per shard
            maxShardsPerGuardian: 1000,
            guardianSelectionCriteria: {
                minReputation: 0.8,
                minUptime: 0.95,
                maxLatency: 200, // ms
                geographicDistribution: true
            },
            shardReplication: 2, // Replicate each shard to 2 guardians
            recoveryTimeout: 300000, // 5 minutes
            guardianHealthCheck: 60000, // 1 minute
            encryptionAlgorithm: 'aes-256-gcm',
            compressionEnabled: true
        };
        
        // Start guardian health monitoring
        this.healthCheckInterval = setInterval(
            () => this.monitorGuardianHealth(),
            this.config.guardianHealthCheck
        );
    }

    /**
     * Store a shard with selected guardians
     */
    async storeShardWithGuardians(fileId, shardData, shardIndex, ownerId, accessPolicy = {}) {
        try {
            // Validate inputs
            if (!fileId || !shardData || shardIndex === undefined) {
                throw new Error('Invalid shard storage parameters');
            }

            // Select appropriate guardians
            const selectedGuardians = await this.selectGuardians(
                this.config.shardReplication,
                ownerId,
                accessPolicy
            );

            if (selectedGuardians.length < this.config.minGuardians) {
                throw new Error('Insufficient guardians available for storage');
            }

            // Prepare shard for guardian storage
            const preparedShard = await this.preparShardForGuardians(
                shardData,
                fileId,
                shardIndex,
                ownerId,
                selectedGuardians
            );

            const guardianShardId = crypto.randomUUID();
            const shardMetadata = {
                guardianShardId,
                fileId,
                shardIndex,
                ownerId,
                size: shardData.length,
                checksum: crypto.createHash('sha256').update(shardData).digest('hex'),
                created: Date.now(),
                guardians: selectedGuardians.map(g => g.guardianId),
                accessPolicy,
                status: 'storing',
                replicas: new Map()
            };

            this.guardianShards.set(guardianShardId, shardMetadata);

            // Store with each selected guardian
            const storagePromises = selectedGuardians.map(guardian =>
                this.storeWithGuardian(
                    guardianShardId,
                    preparedShard,
                    guardian,
                    shardMetadata
                )
            );

            const results = await Promise.allSettled(storagePromises);
            
            // Check storage results
            const successfulStores = results.filter(result => result.status === 'fulfilled');
            
            if (successfulStores.length < this.config.minGuardians) {
                // Cleanup partial stores and throw error
                await this.cleanupFailedStorage(guardianShardId, selectedGuardians);
                throw new Error('Failed to store shard with sufficient guardians');
            }

            // Update metadata with successful stores
            successfulStores.forEach((result, index) => {
                const guardian = selectedGuardians[index];
                shardMetadata.replicas.set(guardian.guardianId, {
                    guardianId: guardian.guardianId,
                    stored: Date.now(),
                    verified: false,
                    lastCheck: 0
                });
            });

            shardMetadata.status = 'stored';
            
            // Update guardian assignments
            this.updateGuardianAssignments(guardianShardId, selectedGuardians);

            this.emit('shard:stored', {
                guardianShardId,
                fileId,
                shardIndex,
                guardiansCount: successfulStores.length
            });

            return {
                guardianShardId,
                guardians: selectedGuardians.map(g => g.guardianId),
                stored: Date.now()
            };

        } catch (error) {
            this.emit('shard:store_failed', {
                fileId,
                shardIndex,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Select appropriate guardians for shard storage
     */
    async selectGuardians(requiredCount, ownerId, accessPolicy = {}) {
        // Get available guardians from the guardian API
        const availableGuardians = await this.guardianAPI.getAvailableGuardians();
        
        if (!availableGuardians || availableGuardians.length === 0) {
            throw new Error('No guardians available');
        }

        // Filter guardians based on criteria
        const eligibleGuardians = availableGuardians.filter(guardian => 
            this.isGuardianEligible(guardian, ownerId, accessPolicy)
        );

        if (eligibleGuardians.length < requiredCount) {
            throw new Error(`Insufficient eligible guardians (need ${requiredCount}, have ${eligibleGuardians.length})`);
        }

        // Score and rank guardians
        const scoredGuardians = eligibleGuardians.map(guardian => ({
            ...guardian,
            score: this.calculateGuardianScore(guardian, ownerId, accessPolicy)
        }));

        // Sort by score (highest first)
        scoredGuardians.sort((a, b) => b.score - a.score);

        // Apply geographic distribution if enabled
        const selectedGuardians = this.config.guardianSelectionCriteria.geographicDistribution
            ? this.applyGeographicDistribution(scoredGuardians, requiredCount)
            : scoredGuardians.slice(0, requiredCount);

        return selectedGuardians;
    }

    /**
     * Check if guardian is eligible for storage
     */
    isGuardianEligible(guardian, ownerId, accessPolicy) {
        const criteria = this.config.guardianSelectionCriteria;
        
        // Basic eligibility checks
        if (guardian.reputation < criteria.minReputation) {
            return false;
        }
        
        if (guardian.uptime < criteria.minUptime) {
            return false;
        }
        
        if (guardian.avgLatency > criteria.maxLatency) {
            return false;
        }

        // Check current shard load
        const currentShards = this.getGuardianShardCount(guardian.guardianId);
        if (currentShards >= this.config.maxShardsPerGuardian) {
            return false;
        }

        // Check access policy restrictions
        if (accessPolicy.excludeGuardians && 
            accessPolicy.excludeGuardians.includes(guardian.guardianId)) {
            return false;
        }

        if (accessPolicy.requiredRegions && 
            !accessPolicy.requiredRegions.includes(guardian.region)) {
            return false;
        }

        // Don't select guardian if they're the owner (conflict of interest)
        if (guardian.ownerId === ownerId) {
            return false;
        }

        return true;
    }

    /**
     * Calculate guardian score for selection
     */
    calculateGuardianScore(guardian, ownerId, accessPolicy) {
        let score = 0;
        
        // Base reputation score (0-40 points)
        score += guardian.reputation * 40;
        
        // Uptime score (0-30 points)
        score += guardian.uptime * 30;
        
        // Latency score (0-20 points, lower latency = higher score)
        score += Math.max(0, 20 - (guardian.avgLatency / 10));
        
        // Available capacity (0-10 points)
        const currentShards = this.getGuardianShardCount(guardian.guardianId);
        const capacityRatio = currentShards / this.config.maxShardsPerGuardian;
        score += (1 - capacityRatio) * 10;
        
        // Bonus for preferred guardians
        if (accessPolicy.preferredGuardians && 
            accessPolicy.preferredGuardians.includes(guardian.guardianId)) {
            score += 15;
        }
        
        // Bonus for regional preferences
        if (accessPolicy.preferredRegions && 
            accessPolicy.preferredRegions.includes(guardian.region)) {
            score += 5;
        }
        
        return score;
    }

    /**
     * Apply geographic distribution to guardian selection
     */
    applyGeographicDistribution(scoredGuardians, requiredCount) {
        const selected = [];
        const usedRegions = new Set();
        
        // First pass: select highest scoring guardian from each region
        for (const guardian of scoredGuardians) {
            if (selected.length >= requiredCount) {
                break;
            }
            
            if (!usedRegions.has(guardian.region)) {
                selected.push(guardian);
                usedRegions.add(guardian.region);
            }
        }
        
        // Second pass: fill remaining slots with highest scoring guardians
        for (const guardian of scoredGuardians) {
            if (selected.length >= requiredCount) {
                break;
            }
            
            if (!selected.find(g => g.guardianId === guardian.guardianId)) {
                selected.push(guardian);
            }
        }
        
        return selected;
    }

    /**
     * Get current shard count for a guardian
     */
    getGuardianShardCount(guardianId) {
        const assignments = this.shardAssignments.get(guardianId);
        return assignments ? assignments.size : 0;
    }

    /**
     * Prepare shard data for guardian storage
     */
    async preparShardForGuardians(shardData, fileId, shardIndex, ownerId, guardians) {
        // Generate guardian-specific encryption key
        const guardianKey = crypto.randomBytes(32);
        
        // Encrypt shard data
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.config.encryptionAlgorithm, guardianKey, { iv });
        
        const encryptedShard = Buffer.concat([
            cipher.update(shardData),
            cipher.final()
        ]);
        
        const authTag = cipher.getAuthTag();
        
        // Compress if enabled
        const finalShard = this.config.compressionEnabled
            ? await this.compressShard(encryptedShard)
            : encryptedShard;
        
        return {
            data: finalShard,
            encryption: {
                algorithm: this.config.encryptionAlgorithm,
                key: guardianKey.toString('hex'),
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            },
            compressed: this.config.compressionEnabled,
            originalSize: shardData.length,
            encryptedSize: encryptedShard.length,
            finalSize: finalShard.length
        };
    }

    /**
     * Compress shard data
     */
    async compressShard(data) {
        const { gzip } = await import('zlib');
        const { promisify } = await import('util');
        const gzipAsync = promisify(gzip);
        
        return await gzipAsync(data);
    }

    /**
     * Store shard with a specific guardian
     */
    async storeWithGuardian(guardianShardId, preparedShard, guardian, metadata) {
        try {
            // Create storage request
            const storageRequest = {
                guardianShardId,
                fileId: metadata.fileId,
                shardIndex: metadata.shardIndex,
                ownerId: metadata.ownerId,
                size: preparedShard.finalSize,
                checksum: crypto.createHash('sha256').update(preparedShard.data).digest('hex'),
                encryption: preparedShard.encryption,
                compressed: preparedShard.compressed,
                accessPolicy: metadata.accessPolicy,
                timestamp: Date.now()
            };

            // Send to guardian
            const response = await this.guardianAPI.storeShardWithGuardian(
                guardian.guardianId,
                preparedShard.data,
                storageRequest
            );

            if (!response.success) {
                throw new Error(response.error || 'Guardian storage failed');
            }

            return {
                guardianId: guardian.guardianId,
                stored: Date.now(),
                size: preparedShard.finalSize,
                checksum: storageRequest.checksum
            };

        } catch (error) {
            throw new Error(`Failed to store with guardian ${guardian.guardianId}: ${error.message}`);
        }
    }

    /**
     * Update guardian assignments tracking
     */
    updateGuardianAssignments(guardianShardId, guardians) {
        guardians.forEach(guardian => {
            if (!this.shardAssignments.has(guardian.guardianId)) {
                this.shardAssignments.set(guardian.guardianId, new Set());
            }
            this.shardAssignments.get(guardian.guardianId).add(guardianShardId);
        });
    }

    /**
     * Retrieve shard from guardians
     */
    async retrieveShardFromGuardians(guardianShardId, requesterId) {
        try {
            const metadata = this.guardianShards.get(guardianShardId);
            if (!metadata) {
                throw new Error('Guardian shard not found');
            }

            // Check access permissions
            if (!await this.checkAccessPermissions(metadata, requesterId)) {
                throw new Error('Access denied to guardian shard');
            }

            // Try to retrieve from available guardians
            const retrievalPromises = [];
            for (const [guardianId, replica] of metadata.replicas) {
                retrievalPromises.push(
                    this.retrieveFromGuardian(guardianShardId, guardianId, metadata)
                        .catch(error => ({ error: error.message, guardianId }))
                );
            }

            const results = await Promise.allSettled(retrievalPromises);
            
            // Find first successful retrieval
            for (const result of results) {
                if (result.status === 'fulfilled' && !result.value.error) {
                    const retrievedData = result.value;
                    
                    // Decrypt and decompress
                    const originalShard = await this.processRetrievedShard(
                        retrievedData.data,
                        retrievedData.encryption,
                        retrievedData.compressed
                    );

                    this.emit('shard:retrieved', {
                        guardianShardId,
                        fileId: metadata.fileId,
                        shardIndex: metadata.shardIndex,
                        guardianId: retrievedData.guardianId
                    });

                    return {
                        data: originalShard,
                        metadata: {
                            fileId: metadata.fileId,
                            shardIndex: metadata.shardIndex,
                            size: originalShard.length,
                            retrieved: Date.now()
                        }
                    };
                }
            }

            throw new Error('Failed to retrieve shard from any guardian');

        } catch (error) {
            this.emit('shard:retrieval_failed', {
                guardianShardId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Check access permissions for guardian shard
     */
    async checkAccessPermissions(metadata, requesterId) {
        // Owner always has access
        if (metadata.ownerId === requesterId) {
            return true;
        }

        // Check if requester is a guardian with access
        if (metadata.guardians.includes(requesterId)) {
            return true;
        }

        // Check access policy
        if (metadata.accessPolicy.authorizedUsers &&
            metadata.accessPolicy.authorizedUsers.includes(requesterId)) {
            return true;
        }

        // Check if it's an emergency recovery request
        if (metadata.accessPolicy.allowEmergencyRecovery) {
            const isGuardian = await this.guardianAPI.isGuardian(requesterId);
            if (isGuardian) {
                return true;
            }
        }

        return false;
    }

    /**
     * Retrieve shard from a specific guardian
     */
    async retrieveFromGuardian(guardianShardId, guardianId, metadata) {
        try {
            const response = await this.guardianAPI.retrieveShardFromGuardian(
                guardianId,
                guardianShardId,
                metadata.ownerId
            );

            if (!response.success) {
                throw new Error(response.error || 'Guardian retrieval failed');
            }

            return {
                data: response.data,
                encryption: response.encryption,
                compressed: response.compressed,
                guardianId,
                retrieved: Date.now()
            };

        } catch (error) {
            throw new Error(`Failed to retrieve from guardian ${guardianId}: ${error.message}`);
        }
    }

    /**
     * Process retrieved shard (decrypt and decompress)
     */
    async processRetrievedShard(encryptedData, encryption, compressed) {
        try {
            // Decompress if needed
            let data = encryptedData;
            if (compressed) {
                data = await this.decompressShard(data);
            }

            // Decrypt
            const decipher = crypto.createDecipher(
                encryption.algorithm,
                Buffer.from(encryption.key, 'hex'),
                { iv: Buffer.from(encryption.iv, 'hex') }
            );
            
            decipher.setAuthTag(Buffer.from(encryption.authTag, 'hex'));
            
            const decryptedShard = Buffer.concat([
                decipher.update(data),
                decipher.final()
            ]);

            return decryptedShard;

        } catch (error) {
            throw new Error(`Failed to process retrieved shard: ${error.message}`);
        }
    }

    /**
     * Decompress shard data
     */
    async decompressShard(data) {
        const { gunzip } = await import('zlib');
        const { promisify } = await import('util');
        const gunzipAsync = promisify(gunzip);
        
        return await gunzipAsync(data);
    }

    /**
     * Initiate emergency recovery for a file
     */
    async initiateEmergencyRecovery(fileId, requesterId, reason = 'data_loss') {
        try {
            const recoveryId = crypto.randomUUID();
            
            // Find all guardian shards for this file
            const fileShards = [];
            for (const [guardianShardId, metadata] of this.guardianShards) {
                if (metadata.fileId === fileId) {
                    fileShards.push({ guardianShardId, metadata });
                }
            }

            if (fileShards.length === 0) {
                throw new Error('No guardian shards found for file');
            }

            const recoveryRequest = {
                recoveryId,
                fileId,
                requesterId,
                reason,
                initiated: Date.now(),
                status: 'pending',
                shards: fileShards.map(s => s.guardianShardId),
                retrievedShards: [],
                completed: null
            };

            this.recoveryRequests.set(recoveryId, recoveryRequest);

            this.emit('recovery:initiated', {
                recoveryId,
                fileId,
                requesterId,
                shardCount: fileShards.length
            });

            // Start recovery process
            this.executeEmergencyRecovery(recoveryRequest).catch(error => {
                this.emit('recovery:error', {
                    recoveryId,
                    error: error.message
                });
            });

            return recoveryId;

        } catch (error) {
            this.emit('recovery:failed', {
                fileId,
                requesterId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Execute emergency recovery process
     */
    async executeEmergencyRecovery(recoveryRequest) {
        const { recoveryId, fileId, requesterId } = recoveryRequest;
        
        try {
            recoveryRequest.status = 'recovering';
            
            // Retrieve all available shards
            const retrievalPromises = recoveryRequest.shards.map(guardianShardId =>
                this.retrieveShardFromGuardians(guardianShardId, requesterId)
                    .then(result => ({ guardianShardId, ...result }))
                    .catch(error => ({ guardianShardId, error: error.message }))
            );

            const results = await Promise.allSettled(retrievalPromises);
            
            // Collect successful retrievals
            const successfulRetrievals = results
                .filter(result => result.status === 'fulfilled' && !result.value.error)
                .map(result => result.value);

            if (successfulRetrievals.length === 0) {
                throw new Error('Failed to retrieve any guardian shards');
            }

            recoveryRequest.retrievedShards = successfulRetrievals;
            recoveryRequest.status = 'reconstructing';

            // Attempt to reconstruct the file
            const shardData = successfulRetrievals.map(retrieval => ({
                index: retrieval.metadata.shardIndex,
                data: retrieval.data
            }));

            // This would integrate with the shard manager to reconstruct
            const reconstructedFile = await this.shardManager.reconstructFromShards(shardData);

            recoveryRequest.status = 'completed';
            recoveryRequest.completed = Date.now();
            recoveryRequest.reconstructedSize = reconstructedFile.length;

            this.emit('recovery:completed', {
                recoveryId,
                fileId,
                shardsRecovered: successfulRetrievals.length,
                fileSize: reconstructedFile.length
            });

            return {
                recoveryId,
                fileData: reconstructedFile,
                shardsRecovered: successfulRetrievals.length,
                completed: Date.now()
            };

        } catch (error) {
            recoveryRequest.status = 'failed';
            recoveryRequest.error = error.message;
            throw error;
        }
    }

    /**
     * Monitor guardian health
     */
    async monitorGuardianHealth() {
        try {
            const guardians = await this.guardianAPI.getAvailableGuardians();
            
            for (const guardian of guardians) {
                await this.checkGuardianHealth(guardian);
            }
            
            this.emit('health:check_completed', {
                guardiansChecked: guardians.length,
                timestamp: Date.now()
            });
            
        } catch (error) {
            this.emit('health:check_error', { error: error.message });
        }
    }

    /**
     * Check health of a specific guardian
     */
    async checkGuardianHealth(guardian) {
        const guardianId = guardian.guardianId;
        
        try {
            // Ping guardian
            const pingStart = Date.now();
            const pingResponse = await this.guardianAPI.pingGuardian(guardianId);
            const latency = Date.now() - pingStart;
            
            // Update guardian status
            this.guardianStatus.set(guardianId, {
                guardianId,
                online: pingResponse.success,
                latency,
                lastCheck: Date.now(),
                shardCount: this.getGuardianShardCount(guardianId)
            });
            
            // Verify random shard if online
            if (pingResponse.success) {
                await this.verifyRandomGuardianShard(guardianId);
            }
            
        } catch (error) {
            this.guardianStatus.set(guardianId, {
                guardianId,
                online: false,
                error: error.message,
                lastCheck: Date.now(),
                shardCount: this.getGuardianShardCount(guardianId)
            });
        }
    }

    /**
     * Verify a random shard stored with a guardian
     */
    async verifyRandomGuardianShard(guardianId) {
        const guardianShards = this.shardAssignments.get(guardianId);
        if (!guardianShards || guardianShards.size === 0) {
            return;
        }
        
        // Select random shard
        const shardIds = Array.from(guardianShards);
        const randomShardId = shardIds[Math.floor(Math.random() * shardIds.length)];
        
        try {
            // Request shard verification
            const verification = await this.guardianAPI.verifyShardWithGuardian(
                guardianId,
                randomShardId
            );
            
            if (verification.success) {
                // Update replica info
                const metadata = this.guardianShards.get(randomShardId);
                if (metadata && metadata.replicas.has(guardianId)) {
                    const replica = metadata.replicas.get(guardianId);
                    replica.verified = true;
                    replica.lastCheck = Date.now();
                }
            }
            
        } catch (error) {
            this.emit('verification:failed', {
                guardianId,
                shardId: randomShardId,
                error: error.message
            });
        }
    }

    /**
     * Clean up failed storage attempts
     */
    async cleanupFailedStorage(guardianShardId, guardians) {
        const cleanupPromises = guardians.map(guardian =>
            this.guardianAPI.deleteShardFromGuardian(guardian.guardianId, guardianShardId)
                .catch(error => ({ error: error.message, guardianId: guardian.guardianId }))
        );
        
        await Promise.allSettled(cleanupPromises);
        
        // Remove from local tracking
        this.guardianShards.delete(guardianShardId);
        
        guardians.forEach(guardian => {
            const assignments = this.shardAssignments.get(guardian.guardianId);
            if (assignments) {
                assignments.delete(guardianShardId);
            }
        });
    }

    /**
     * Get guardian vault statistics
     */
    getVaultStatistics() {
        const stats = {
            totalShards: this.guardianShards.size,
            totalGuardians: this.shardAssignments.size,
            activeRecoveries: this.recoveryRequests.size,
            averageReplication: 0,
            storageByTier: { vault: 0 },
            healthyReplicas: 0,
            totalReplicas: 0
        };
        
        let replicationSum = 0;
        
        for (const [shardId, metadata] of this.guardianShards) {
            const replicaCount = metadata.replicas.size;
            replicationSum += replicaCount;
            stats.totalReplicas += replicaCount;
            
            // Count healthy replicas
            for (const [guardianId, replica] of metadata.replicas) {
                const guardianStatus = this.guardianStatus.get(guardianId);
                if (guardianStatus && guardianStatus.online && replica.verified) {
                    stats.healthyReplicas++;
                }
            }
        }
        
        if (this.guardianShards.size > 0) {
            stats.averageReplication = replicationSum / this.guardianShards.size;
        }
        
        return stats;
    }

    /**
     * Export guardian vault data for backup
     */
    exportVaultData() {
        return {
            guardianShards: Object.fromEntries(
                Array.from(this.guardianShards.entries()).map(([id, metadata]) => [
                    id,
                    {
                        ...metadata,
                        replicas: Object.fromEntries(metadata.replicas)
                    }
                ])
            ),
            shardAssignments: Object.fromEntries(
                Array.from(this.shardAssignments.entries()).map(([guardianId, shards]) => [
                    guardianId,
                    Array.from(shards)
                ])
            ),
            exportedAt: Date.now()
        };
    }

    /**
     * Import guardian vault data from backup
     */
    importVaultData(vaultData) {
        // Clear existing data
        this.guardianShards.clear();
        this.shardAssignments.clear();
        
        // Import guardian shards
        for (const [shardId, metadata] of Object.entries(vaultData.guardianShards)) {
            const importedMetadata = {
                ...metadata,
                replicas: new Map(Object.entries(metadata.replicas))
            };
            this.guardianShards.set(shardId, importedMetadata);
        }
        
        // Import shard assignments
        for (const [guardianId, shards] of Object.entries(vaultData.shardAssignments)) {
            this.shardAssignments.set(guardianId, new Set(shards));
        }
        
        this.emit('vault:imported', {
            shardsImported: this.guardianShards.size,
            guardiansImported: this.shardAssignments.size
        });
        
        return true;
    }

    /**
     * Shutdown and cleanup
     */
    shutdown() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        
        this.emit('shutdown');
    }
}

export default GuardianShardVault;
