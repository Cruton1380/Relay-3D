/**
 * Relay KeySpace Storage Market - Repair Job Module
 * 
 * Handles redundancy monitoring, automatic repair, and recovery
 * for the decentralized storage market. Monitors shard health
 * and triggers repair operations when needed.
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export class KeyspaceRepairJob extends EventEmitter {
    constructor(shardManager, storageBroker, storageRegistry) {
        super();
        this.shardManager = shardManager;
        this.storageBroker = storageBroker;
        this.storageRegistry = storageRegistry;
        
        // Active repair jobs
        this.activeJobs = new Map();
        
        // File health monitoring
        this.healthChecks = new Map();
        
        // Repair history
        this.repairHistory = [];
        
        // Configuration
        this.config = {
            healthCheckInterval: 60000, // 1 minute
            repairThreshold: 0.7, // Repair when <70% shards available
            emergencyThreshold: 0.5, // Emergency repair when <50% shards
            maxConcurrentRepairs: 5,
            repairTimeout: 300000, // 5 minutes
            retryAttempts: 3,
            retryDelay: 30000 // 30 seconds
        };
        
        // Start health monitoring
        this.healthMonitorInterval = setInterval(
            () => this.runHealthCheck(), 
            this.config.healthCheckInterval
        );
    }

    /**
     * Register a file for monitoring
     */
    async registerFile(fileId, shardMetadata, planTier = 'basic') {
        const healthData = {
            fileId,
            shardMetadata,
            planTier,
            registered: Date.now(),
            lastCheck: 0,
            lastRepair: 0,
            healthScore: 1.0,
            availableShards: shardMetadata.totalShards,
            failedNodes: new Set(),
            repairAttempts: 0,
            status: 'healthy'
        };

        this.healthChecks.set(fileId, healthData);
        
        this.emit('file:registered', { fileId, planTier, shardCount: shardMetadata.totalShards });
        
        // Initial health check
        await this.checkFileHealth(fileId);
        
        return healthData;
    }

    /**
     * Unregister a file from monitoring
     */
    unregisterFile(fileId) {
        const healthData = this.healthChecks.get(fileId);
        if (healthData) {
            this.healthChecks.delete(fileId);
            
            // Cancel any active repair job
            if (this.activeJobs.has(fileId)) {
                this.cancelRepairJob(fileId);
            }
            
            this.emit('file:unregistered', { fileId });
            return true;
        }
        return false;
    }

    /**
     * Check health of a specific file
     */
    async checkFileHealth(fileId) {
        const healthData = this.healthChecks.get(fileId);
        if (!healthData) {
            throw new Error('File not registered for monitoring');
        }

        const startTime = Date.now();
        healthData.lastCheck = startTime;

        try {
            // Check each shard's availability
            const shardStatuses = await this.checkShardAvailability(
                fileId, 
                healthData.shardMetadata
            );

            const availableShards = shardStatuses.filter(status => status.available).length;
            const totalShards = healthData.shardMetadata.totalShards;
            const requiredShards = healthData.shardMetadata.threshold;
            
            healthData.availableShards = availableShards;
            healthData.healthScore = availableShards / totalShards;

            // Update failed nodes tracking
            healthData.failedNodes.clear();
            shardStatuses.forEach(status => {
                if (!status.available) {
                    healthData.failedNodes.add(status.nodeId);
                }
            });

            // Determine health status
            if (availableShards >= totalShards * this.config.repairThreshold) {
                healthData.status = 'healthy';
            } else if (availableShards >= totalShards * this.config.emergencyThreshold) {
                healthData.status = 'degraded';
            } else if (availableShards >= requiredShards) {
                healthData.status = 'critical';
            } else {
                healthData.status = 'failed';
            }

            // Trigger repair if needed
            if (healthData.status === 'degraded' || healthData.status === 'critical') {
                await this.scheduleRepair(fileId, healthData.status === 'critical');
            }

            this.emit('health:checked', {
                fileId,
                healthScore: healthData.healthScore,
                availableShards,
                totalShards,
                status: healthData.status,
                checkDuration: Date.now() - startTime
            });

            return {
                fileId,
                healthScore: healthData.healthScore,
                availableShards,
                totalShards,
                status: healthData.status,
                failedNodes: Array.from(healthData.failedNodes)
            };

        } catch (error) {
            healthData.status = 'error';
            this.emit('health:error', { fileId, error: error.message });
            throw error;
        }
    }

    /**
     * Check availability of all shards for a file
     */
    async checkShardAvailability(fileId, shardMetadata) {
        const shardStatuses = [];
        const checkPromises = [];

        for (let i = 0; i < shardMetadata.totalShards; i++) {
            const shardId = `${fileId}_shard_${i}`;
            const nodeId = shardMetadata.shardLocations[i];

            const promise = this.checkSingleShard(shardId, nodeId)
                .then(available => ({
                    shardIndex: i,
                    shardId,
                    nodeId,
                    available,
                    checkTime: Date.now()
                }))
                .catch(error => ({
                    shardIndex: i,
                    shardId,
                    nodeId,
                    available: false,
                    error: error.message,
                    checkTime: Date.now()
                }));

            checkPromises.push(promise);
        }

        const results = await Promise.allSettled(checkPromises);
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                shardStatuses.push(result.value);
            } else {
                shardStatuses.push({
                    shardIndex: index,
                    shardId: `${fileId}_shard_${index}`,
                    nodeId: shardMetadata.shardLocations[index],
                    available: false,
                    error: result.reason?.message || 'Unknown error',
                    checkTime: Date.now()
                });
            }
        });

        return shardStatuses;
    }

    /**
     * Check if a single shard is available
     */
    async checkSingleShard(shardId, nodeId) {
        try {
            // Get provider info from registry
            const provider = await this.storageRegistry.getProvider(nodeId);
            if (!provider || !provider.online) {
                return false;
            }

            // Simple connectivity check (in real implementation, would verify shard exists)
            const response = await fetch(`http://${provider.endpoint}/ping`, {
                method: 'GET',
                timeout: 5000
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Schedule a repair job for a file
     */
    async scheduleRepair(fileId, isEmergency = false) {
        // Check if repair is already running
        if (this.activeJobs.has(fileId)) {
            return false;
        }

        // Check concurrent repair limit
        if (this.activeJobs.size >= this.config.maxConcurrentRepairs && !isEmergency) {
            this.emit('repair:queued', { fileId, reason: 'concurrent_limit' });
            return false;
        }

        const healthData = this.healthChecks.get(fileId);
        if (!healthData) {
            throw new Error('File not registered for monitoring');
        }

        const repairJob = {
            jobId: crypto.randomUUID(),
            fileId,
            priority: isEmergency ? 'emergency' : 'normal',
            started: Date.now(),
            status: 'running',
            attempts: 0,
            maxAttempts: this.config.retryAttempts,
            progress: 0,
            failedShards: Array.from(healthData.failedNodes),
            newShards: []
        };

        this.activeJobs.set(fileId, repairJob);
        
        this.emit('repair:started', {
            jobId: repairJob.jobId,
            fileId,
            priority: repairJob.priority,
            failedShards: repairJob.failedShards.length
        });

        // Start repair process
        this.executeRepair(repairJob).catch(error => {
            this.emit('repair:error', { 
                jobId: repairJob.jobId, 
                fileId, 
                error: error.message 
            });
        });

        return repairJob.jobId;
    }

    /**
     * Execute the repair process
     */
    async executeRepair(repairJob) {
        const { fileId, jobId } = repairJob;
        
        try {
            repairJob.attempts++;
            
            const healthData = this.healthChecks.get(fileId);
            if (!healthData) {
                throw new Error('File health data not found');
            }

            // Step 1: Download and reconstruct file from available shards
            this.emit('repair:step', { jobId, step: 'reconstruct', progress: 10 });
            
            const availableShards = await this.gatherAvailableShards(fileId, healthData.shardMetadata);
            if (availableShards.length < healthData.shardMetadata.threshold) {
                throw new Error('Insufficient shards available for reconstruction');
            }

            const reconstructedData = await this.shardManager.reconstructFile(
                availableShards,
                healthData.shardMetadata
            );

            repairJob.progress = 30;
            this.emit('repair:step', { jobId, step: 'find_providers', progress: 30 });

            // Step 2: Find new storage providers for failed shards
            const requiredShards = healthData.shardMetadata.totalShards - availableShards.length;
            const newProviders = await this.storageBroker.findReplacementProviders(
                requiredShards,
                healthData.planTier,
                healthData.failedNodes
            );

            if (newProviders.length < requiredShards) {
                throw new Error('Insufficient replacement providers available');
            }

            repairJob.progress = 50;
            this.emit('repair:step', { jobId, step: 'create_shards', progress: 50 });

            // Step 3: Create new shards
            const newShardData = await this.shardManager.createShards(
                reconstructedData,
                healthData.shardMetadata
            );

            repairJob.progress = 70;
            this.emit('repair:step', { jobId, step: 'upload_shards', progress: 70 });

            // Step 4: Upload new shards to replacement providers
            const uploadPromises = [];
            for (let i = 0; i < requiredShards; i++) {
                const provider = newProviders[i];
                const shardData = newShardData.shards[availableShards.length + i];
                
                const uploadPromise = this.uploadShardToProvider(
                    shardData,
                    provider,
                    healthData.planTier
                ).then(result => {
                    repairJob.newShards.push({
                        shardIndex: availableShards.length + i,
                        nodeId: provider.nodeId,
                        uploadedAt: Date.now()
                    });
                    return result;
                });

                uploadPromises.push(uploadPromise);
            }

            await Promise.all(uploadPromises);

            repairJob.progress = 90;
            this.emit('repair:step', { jobId, step: 'update_metadata', progress: 90 });

            // Step 5: Update shard metadata with new locations
            await this.updateShardMetadata(fileId, repairJob.newShards);

            repairJob.progress = 100;
            repairJob.status = 'completed';
            repairJob.completed = Date.now();

            // Update health data
            healthData.lastRepair = Date.now();
            healthData.repairAttempts++;
            healthData.failedNodes.clear();

            // Record repair history
            this.repairHistory.push({
                jobId,
                fileId,
                priority: repairJob.priority,
                started: repairJob.started,
                completed: repairJob.completed,
                duration: repairJob.completed - repairJob.started,
                attempts: repairJob.attempts,
                repairedShards: repairJob.newShards.length,
                success: true
            });

            this.emit('repair:completed', {
                jobId,
                fileId,
                duration: repairJob.completed - repairJob.started,
                repairedShards: repairJob.newShards.length
            });

            // Clean up
            this.activeJobs.delete(fileId);

            // Re-check file health
            await this.checkFileHealth(fileId);

        } catch (error) {
            repairJob.status = 'failed';
            repairJob.error = error.message;
            repairJob.completed = Date.now();

            // Record failed repair
            this.repairHistory.push({
                jobId,
                fileId,
                priority: repairJob.priority,
                started: repairJob.started,
                completed: repairJob.completed,
                duration: repairJob.completed - repairJob.started,
                attempts: repairJob.attempts,
                error: error.message,
                success: false
            });

            // Retry if attempts remaining
            if (repairJob.attempts < repairJob.maxAttempts) {
                this.emit('repair:retry', { jobId, fileId, attempt: repairJob.attempts });
                
                setTimeout(() => {
                    this.executeRepair(repairJob);
                }, this.config.retryDelay);
            } else {
                this.emit('repair:failed', { jobId, fileId, error: error.message });
                this.activeJobs.delete(fileId);
            }
        }
    }

    /**
     * Gather available shards for reconstruction
     */
    async gatherAvailableShards(fileId, shardMetadata) {
        const availableShards = [];
        
        for (let i = 0; i < shardMetadata.totalShards; i++) {
            const shardId = `${fileId}_shard_${i}`;
            const nodeId = shardMetadata.shardLocations[i];
            
            try {
                const shardData = await this.downloadShardFromProvider(shardId, nodeId);
                if (shardData) {
                    availableShards.push({
                        index: i,
                        data: shardData,
                        nodeId
                    });
                }
            } catch (error) {
                // Shard not available, continue
                continue;
            }
        }
        
        return availableShards;
    }

    /**
     * Download a shard from a storage provider
     */
    async downloadShardFromProvider(shardId, nodeId) {
        // This would implement the actual download logic
        // For now, return mock data
        return new Uint8Array(1024); // Mock shard data
    }

    /**
     * Upload a shard to a storage provider
     */
    async uploadShardToProvider(shardData, provider, planTier) {
        // This would implement the actual upload logic
        // For now, return success
        return {
            success: true,
            nodeId: provider.nodeId,
            shardSize: shardData.length
        };
    }

    /**
     * Update shard metadata with new provider locations
     */
    async updateShardMetadata(fileId, newShards) {
        // This would update the metadata in the KeySpace
        // For now, just emit an event
        this.emit('metadata:updated', { fileId, newShards });
        return true;
    }

    /**
     * Cancel a repair job
     */
    cancelRepairJob(fileId) {
        const job = this.activeJobs.get(fileId);
        if (job) {
            job.status = 'cancelled';
            job.completed = Date.now();
            
            this.emit('repair:cancelled', { 
                jobId: job.jobId, 
                fileId 
            });
            
            this.activeJobs.delete(fileId);
            return true;
        }
        return false;
    }

    /**
     * Run periodic health check on all registered files
     */
    async runHealthCheck() {
        const files = Array.from(this.healthChecks.keys());
        const checkPromises = [];

        for (const fileId of files) {
            const promise = this.checkFileHealth(fileId).catch(error => {
                this.emit('health:error', { fileId, error: error.message });
            });
            
            checkPromises.push(promise);
        }

        await Promise.allSettled(checkPromises);
        
        this.emit('health:cycle_completed', { 
            filesChecked: files.length, 
            timestamp: Date.now() 
        });
    }

    /**
     * Get health status of all files
     */
    getHealthStatus() {
        const status = {
            totalFiles: this.healthChecks.size,
            healthy: 0,
            degraded: 0,
            critical: 0,
            failed: 0,
            activeRepairs: this.activeJobs.size
        };

        for (const healthData of this.healthChecks.values()) {
            status[healthData.status]++;
        }

        return status;
    }

    /**
     * Get repair history
     */
    getRepairHistory(limit = 100) {
        return this.repairHistory
            .slice(-limit)
            .sort((a, b) => b.started - a.started);
    }

    /**
     * Get active repair jobs
     */
    getActiveJobs() {
        return Array.from(this.activeJobs.values());
    }

    /**
     * Cleanup and shutdown
     */
    shutdown() {
        if (this.healthMonitorInterval) {
            clearInterval(this.healthMonitorInterval);
            this.healthMonitorInterval = null;
        }

        // Cancel all active jobs
        for (const fileId of this.activeJobs.keys()) {
            this.cancelRepairJob(fileId);
        }

        this.emit('shutdown');
    }
}

export default KeyspaceRepairJob;
