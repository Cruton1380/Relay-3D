/**
 * Relay KeySpace Storage Market - Proof of Storage Module
 * 
 * Implements challenge/response verification, uptime monitoring,
 * and integrity verification for the decentralized storage market.
 * Ensures providers are actually storing data and are online.
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export class KeyspaceProofOfStorage extends EventEmitter {
    constructor(storageRegistry, shardManager) {
        super();
        this.storageRegistry = storageRegistry;
        this.shardManager = shardManager;
        
        // Active challenges
        this.activeChallenges = new Map();
        
        // Provider performance tracking
        this.providerStats = new Map();
        
        // Challenge history
        this.challengeHistory = [];
        
        // Configuration
        this.config = {
            challengeInterval: 300000, // 5 minutes
            challengeTimeout: 30000, // 30 seconds
            challengesPerRound: 10, // Random shards to challenge
            uptimeWindow: 86400000, // 24 hours for uptime calculation
            minUptimeThreshold: 0.95, // 95% uptime required
            maxConcurrentChallenges: 50,
            challengeRetries: 2,
            penaltyDuration: 3600000, // 1 hour penalty for failures
            integrityCheckInterval: 3600000 // 1 hour
        };
        
        // Start challenge scheduler
        this.challengeInterval = setInterval(
            () => this.runChallengeRound(),
            this.config.challengeInterval
        );
        
        // Start integrity checker
        this.integrityInterval = setInterval(
            () => this.runIntegrityCheck(),
            this.config.integrityCheckInterval
        );
    }

    /**
     * Register a shard for proof-of-storage monitoring
     */
    async registerShard(shardId, nodeId, fileId, shardIndex, checksum) {
        const shardInfo = {
            shardId,
            nodeId,
            fileId,
            shardIndex,
            checksum,
            registered: Date.now(),
            lastChallenge: 0,
            lastSuccess: 0,
            challengeCount: 0,
            successCount: 0,
            failureCount: 0,
            status: 'active'
        };

        // Initialize provider stats if needed
        if (!this.providerStats.has(nodeId)) {
            this.initializeProviderStats(nodeId);
        }

        const providerStats = this.providerStats.get(nodeId);
        providerStats.shards.set(shardId, shardInfo);
        providerStats.totalShards++;

        this.emit('shard:registered', { shardId, nodeId, fileId });
        
        return shardInfo;
    }

    /**
     * Unregister a shard from monitoring
     */
    unregisterShard(shardId, nodeId) {
        const providerStats = this.providerStats.get(nodeId);
        if (providerStats && providerStats.shards.has(shardId)) {
            providerStats.shards.delete(shardId);
            providerStats.totalShards--;
            
            // Cancel any active challenge
            if (this.activeChallenges.has(shardId)) {
                this.activeChallenges.delete(shardId);
            }
            
            this.emit('shard:unregistered', { shardId, nodeId });
            return true;
        }
        return false;
    }

    /**
     * Initialize provider statistics
     */
    initializeProviderStats(nodeId) {
        const stats = {
            nodeId,
            shards: new Map(),
            totalShards: 0,
            totalChallenges: 0,
            successfulChallenges: 0,
            failedChallenges: 0,
            avgResponseTime: 0,
            uptime: 1.0,
            lastSeen: Date.now(),
            penalties: 0,
            penaltyUntil: 0,
            reputation: 1.0,
            challengeHistory: []
        };

        this.providerStats.set(nodeId, stats);
        return stats;
    }

    /**
     * Run a round of random challenges
     */
    async runChallengeRound() {
        try {
            // Get all active shards
            const allShards = [];
            for (const [nodeId, stats] of this.providerStats) {
                for (const [shardId, shardInfo] of stats.shards) {
                    if (shardInfo.status === 'active') {
                        allShards.push({ shardId, nodeId, shardInfo });
                    }
                }
            }

            if (allShards.length === 0) {
                return;
            }

            // Select random shards to challenge
            const challengeCount = Math.min(
                this.config.challengesPerRound,
                allShards.length,
                this.config.maxConcurrentChallenges - this.activeChallenges.size
            );

            const shardsToChallenge = this.selectRandomShards(allShards, challengeCount);
            
            // Issue challenges
            const challengePromises = shardsToChallenge.map(shard => 
                this.issueChallenge(shard.shardId, shard.nodeId, shard.shardInfo)
            );

            await Promise.allSettled(challengePromises);
            
            this.emit('challenge:round_completed', { 
                challengesIssued: challengeCount,
                activeChallenges: this.activeChallenges.size,
                timestamp: Date.now()
            });

        } catch (error) {
            this.emit('challenge:round_error', { error: error.message });
        }
    }

    /**
     * Select random shards for challenging
     */
    selectRandomShards(allShards, count) {
        // Prioritize shards that haven't been challenged recently
        const now = Date.now();
        const priorityShards = allShards.filter(shard => 
            now - shard.shardInfo.lastChallenge > this.config.challengeInterval * 2
        );

        const shardsToUse = priorityShards.length >= count ? priorityShards : allShards;
        
        // Shuffle and select
        const shuffled = [...shardsToUse].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    /**
     * Issue a challenge to a specific shard
     */
    async issueChallenge(shardId, nodeId, shardInfo) {
        // Don't challenge if already active
        if (this.activeChallenges.has(shardId)) {
            return;
        }

        const challengeId = crypto.randomUUID();
        const challenge = {
            challengeId,
            shardId,
            nodeId,
            fileId: shardInfo.fileId,
            shardIndex: shardInfo.shardIndex,
            type: 'existence_proof', // Could be 'integrity_proof', 'partial_proof'
            issued: Date.now(),
            timeout: Date.now() + this.config.challengeTimeout,
            attempts: 0,
            maxAttempts: this.config.challengeRetries + 1,
            status: 'pending'
        };

        this.activeChallenges.set(shardId, challenge);
        
        this.emit('challenge:issued', {
            challengeId,
            shardId,
            nodeId,
            type: challenge.type
        });

        // Execute the challenge
        try {
            await this.executeChallenge(challenge);
        } catch (error) {
            this.emit('challenge:error', {
                challengeId,
                shardId,
                nodeId,
                error: error.message
            });
        }
    }

    /**
     * Execute a specific challenge
     */
    async executeChallenge(challenge) {
        const { challengeId, shardId, nodeId, type } = challenge;
        
        try {
            challenge.attempts++;
            const startTime = Date.now();

            let response;
            switch (type) {
                case 'existence_proof':
                    response = await this.existenceProofChallenge(challenge);
                    break;
                case 'integrity_proof':
                    response = await this.integrityProofChallenge(challenge);
                    break;
                case 'partial_proof':
                    response = await this.partialProofChallenge(challenge);
                    break;
                default:
                    throw new Error(`Unknown challenge type: ${type}`);
            }

            const responseTime = Date.now() - startTime;
            
            // Validate response
            const isValid = await this.validateChallengeResponse(challenge, response);
            
            if (isValid) {
                await this.handleSuccessfulChallenge(challenge, responseTime);
            } else {
                await this.handleFailedChallenge(challenge, 'invalid_response');
            }

        } catch (error) {
            if (challenge.attempts < challenge.maxAttempts) {
                // Retry after delay
                setTimeout(() => this.executeChallenge(challenge), 5000);
            } else {
                await this.handleFailedChallenge(challenge, error.message);
            }
        }
    }

    /**
     * Existence proof challenge - verify shard exists
     */
    async existenceProofChallenge(challenge) {
        const provider = await this.storageRegistry.getProvider(challenge.nodeId);
        if (!provider || !provider.online) {
            throw new Error('Provider offline');
        }

        // Request shard checksum or metadata
        const response = await fetch(`http://${provider.endpoint}/shard/${challenge.shardId}/proof`, {
            method: 'GET',
            headers: {
                'Challenge-ID': challenge.challengeId,
                'Challenge-Type': 'existence'
            },
            signal: AbortSignal.timeout(this.config.challengeTimeout)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Integrity proof challenge - verify shard hasn't been corrupted
     */
    async integrityProofChallenge(challenge) {
        const provider = await this.storageRegistry.getProvider(challenge.nodeId);
        if (!provider || !provider.online) {
            throw new Error('Provider offline');
        }

        // Request full shard checksum
        const response = await fetch(`http://${provider.endpoint}/shard/${challenge.shardId}/integrity`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Challenge-ID': challenge.challengeId
            },
            body: JSON.stringify({
                type: 'full_checksum'
            }),
            signal: AbortSignal.timeout(this.config.challengeTimeout)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Partial proof challenge - verify random portion of shard
     */
    async partialProofChallenge(challenge) {
        const provider = await this.storageRegistry.getProvider(challenge.nodeId);
        if (!provider || !provider.online) {
            throw new Error('Provider offline');
        }

        // Generate random byte ranges to check
        const ranges = this.generateRandomRanges(5, 1024); // 5 ranges of 1KB each
        
        const response = await fetch(`http://${provider.endpoint}/shard/${challenge.shardId}/partial`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Challenge-ID': challenge.challengeId
            },
            body: JSON.stringify({
                ranges,
                type: 'partial_checksum'
            }),
            signal: AbortSignal.timeout(this.config.challengeTimeout)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Generate random byte ranges for partial proof
     */
    generateRandomRanges(count, rangeSize) {
        const ranges = [];
        const maxOffset = 1024 * 1024; // Assume max 1MB shard size
        
        for (let i = 0; i < count; i++) {
            const start = Math.floor(Math.random() * (maxOffset - rangeSize));
            ranges.push({
                start,
                end: start + rangeSize - 1
            });
        }
        
        return ranges;
    }

    /**
     * Validate challenge response
     */
    async validateChallengeResponse(challenge, response) {
        try {
            switch (challenge.type) {
                case 'existence_proof':
                    return this.validateExistenceResponse(challenge, response);
                case 'integrity_proof':
                    return this.validateIntegrityResponse(challenge, response);
                case 'partial_proof':
                    return this.validatePartialResponse(challenge, response);
                default:
                    return false;
            }
        } catch (error) {
            this.emit('validation:error', {
                challengeId: challenge.challengeId,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Validate existence proof response
     */
    validateExistenceResponse(challenge, response) {
        if (!response || !response.exists) {
            return false;
        }

        // Verify checksum if provided
        if (response.checksum) {
            const shardInfo = this.getShardInfo(challenge.shardId, challenge.nodeId);
            return shardInfo && shardInfo.checksum === response.checksum;
        }

        return true;
    }

    /**
     * Validate integrity proof response
     */
    validateIntegrityResponse(challenge, response) {
        if (!response || !response.checksum) {
            return false;
        }

        const shardInfo = this.getShardInfo(challenge.shardId, challenge.nodeId);
        return shardInfo && shardInfo.checksum === response.checksum;
    }

    /**
     * Validate partial proof response
     */
    validatePartialResponse(challenge, response) {
        if (!response || !response.checksums || !Array.isArray(response.checksums)) {
            return false;
        }

        // In a real implementation, we would verify the partial checksums
        // against known values or re-compute them from stored data
        return response.checksums.length > 0;
    }

    /**
     * Get shard info from provider stats
     */
    getShardInfo(shardId, nodeId) {
        const stats = this.providerStats.get(nodeId);
        return stats ? stats.shards.get(shardId) : null;
    }

    /**
     * Handle successful challenge
     */
    async handleSuccessfulChallenge(challenge, responseTime) {
        const { challengeId, shardId, nodeId } = challenge;
        
        // Update shard info
        const shardInfo = this.getShardInfo(shardId, nodeId);
        if (shardInfo) {
            shardInfo.lastChallenge = Date.now();
            shardInfo.lastSuccess = Date.now();
            shardInfo.challengeCount++;
            shardInfo.successCount++;
        }

        // Update provider stats
        const providerStats = this.providerStats.get(nodeId);
        if (providerStats) {
            providerStats.totalChallenges++;
            providerStats.successfulChallenges++;
            providerStats.lastSeen = Date.now();
            
            // Update average response time
            const totalTime = providerStats.avgResponseTime * (providerStats.totalChallenges - 1);
            providerStats.avgResponseTime = (totalTime + responseTime) / providerStats.totalChallenges;
            
            // Update reputation (slowly increase on success)
            providerStats.reputation = Math.min(1.0, providerStats.reputation + 0.001);
            
            // Add to challenge history
            providerStats.challengeHistory.push({
                challengeId,
                timestamp: Date.now(),
                success: true,
                responseTime,
                type: challenge.type
            });
            
            // Keep only recent history
            if (providerStats.challengeHistory.length > 1000) {
                providerStats.challengeHistory = providerStats.challengeHistory.slice(-1000);
            }
        }

        // Record in challenge history
        this.challengeHistory.push({
            challengeId,
            shardId,
            nodeId,
            type: challenge.type,
            issued: challenge.issued,
            completed: Date.now(),
            duration: Date.now() - challenge.issued,
            attempts: challenge.attempts,
            success: true,
            responseTime
        });

        // Clean up
        this.activeChallenges.delete(shardId);
        
        this.emit('challenge:success', {
            challengeId,
            shardId,
            nodeId,
            responseTime,
            attempts: challenge.attempts
        });
    }

    /**
     * Handle failed challenge
     */
    async handleFailedChallenge(challenge, reason) {
        const { challengeId, shardId, nodeId } = challenge;
        
        // Update shard info
        const shardInfo = this.getShardInfo(shardId, nodeId);
        if (shardInfo) {
            shardInfo.lastChallenge = Date.now();
            shardInfo.challengeCount++;
            shardInfo.failureCount++;
            
            // Mark shard as failed if too many failures
            const failureRate = shardInfo.failureCount / shardInfo.challengeCount;
            if (failureRate > 0.2) { // 20% failure rate
                shardInfo.status = 'failed';
            }
        }

        // Update provider stats
        const providerStats = this.providerStats.get(nodeId);
        if (providerStats) {
            providerStats.totalChallenges++;
            providerStats.failedChallenges++;
            
            // Decrease reputation on failure
            providerStats.reputation = Math.max(0.0, providerStats.reputation - 0.05);
            
            // Apply penalty
            providerStats.penalties++;
            providerStats.penaltyUntil = Date.now() + this.config.penaltyDuration;
            
            // Add to challenge history
            providerStats.challengeHistory.push({
                challengeId,
                timestamp: Date.now(),
                success: false,
                reason,
                type: challenge.type
            });
        }

        // Record in challenge history
        this.challengeHistory.push({
            challengeId,
            shardId,
            nodeId,
            type: challenge.type,
            issued: challenge.issued,
            completed: Date.now(),
            duration: Date.now() - challenge.issued,
            attempts: challenge.attempts,
            success: false,
            reason
        });

        // Clean up
        this.activeChallenges.delete(shardId);
        
        this.emit('challenge:failed', {
            challengeId,
            shardId,
            nodeId,
            reason,
            attempts: challenge.attempts
        });

        // Trigger repair if shard failed
        if (shardInfo && shardInfo.status === 'failed') {
            this.emit('shard:failed', {
                shardId,
                nodeId,
                fileId: shardInfo.fileId,
                shardIndex: shardInfo.shardIndex
            });
        }
    }

    /**
     * Run integrity check on random files
     */
    async runIntegrityCheck() {
        try {
            // Get sample of files to check
            const filesToCheck = this.selectFilesForIntegrityCheck(10);
            
            for (const fileId of filesToCheck) {
                await this.performFileIntegrityCheck(fileId);
            }
            
            this.emit('integrity:cycle_completed', {
                filesChecked: filesToCheck.length,
                timestamp: Date.now()
            });
            
        } catch (error) {
            this.emit('integrity:error', { error: error.message });
        }
    }

    /**
     * Select files for integrity checking
     */
    selectFilesForIntegrityCheck(count) {
        const fileIds = new Set();
        
        for (const [nodeId, stats] of this.providerStats) {
            for (const [shardId, shardInfo] of stats.shards) {
                fileIds.add(shardInfo.fileId);
            }
        }
        
        const allFiles = Array.from(fileIds);
        const shuffled = allFiles.sort(() => Math.random() - 0.5);
        
        return shuffled.slice(0, Math.min(count, allFiles.length));
    }

    /**
     * Perform integrity check on a specific file
     */
    async performFileIntegrityCheck(fileId) {
        // Get all shards for this file
        const fileShards = [];
        
        for (const [nodeId, stats] of this.providerStats) {
            for (const [shardId, shardInfo] of stats.shards) {
                if (shardInfo.fileId === fileId) {
                    fileShards.push({ shardId, nodeId, shardInfo });
                }
            }
        }
        
        if (fileShards.length === 0) {
            return;
        }
        
        // Issue integrity challenges to all shards of this file
        const challengePromises = fileShards.map(({ shardId, nodeId, shardInfo }) => {
            const challenge = {
                challengeId: crypto.randomUUID(),
                shardId,
                nodeId,
                fileId,
                shardIndex: shardInfo.shardIndex,
                type: 'integrity_proof',
                issued: Date.now(),
                timeout: Date.now() + this.config.challengeTimeout,
                attempts: 0,
                maxAttempts: 1, // Single attempt for integrity checks
                status: 'pending'
            };
            
            return this.executeChallenge(challenge);
        });
        
        await Promise.allSettled(challengePromises);
        
        this.emit('integrity:file_checked', { fileId, shardCount: fileShards.length });
    }

    /**
     * Calculate provider uptime
     */
    calculateProviderUptime(nodeId) {
        const stats = this.providerStats.get(nodeId);
        if (!stats) {
            return 0;
        }

        const now = Date.now();
        const windowStart = now - this.config.uptimeWindow;
        
        // Get challenges in the uptime window
        const recentChallenges = stats.challengeHistory.filter(
            challenge => challenge.timestamp >= windowStart
        );
        
        if (recentChallenges.length === 0) {
            return stats.reputation; // Use reputation as fallback
        }
        
        const successfulChallenges = recentChallenges.filter(
            challenge => challenge.success
        ).length;
        
        return successfulChallenges / recentChallenges.length;
    }

    /**
     * Get provider performance summary
     */
    getProviderPerformance(nodeId) {
        const stats = this.providerStats.get(nodeId);
        if (!stats) {
            return null;
        }

        const uptime = this.calculateProviderUptime(nodeId);
        const successRate = stats.totalChallenges > 0 ? 
            stats.successfulChallenges / stats.totalChallenges : 0;

        return {
            nodeId,
            totalShards: stats.totalShards,
            totalChallenges: stats.totalChallenges,
            successfulChallenges: stats.successfulChallenges,
            failedChallenges: stats.failedChallenges,
            successRate,
            avgResponseTime: stats.avgResponseTime,
            uptime,
            reputation: stats.reputation,
            penalties: stats.penalties,
            isPenalized: Date.now() < stats.penaltyUntil,
            lastSeen: stats.lastSeen
        };
    }

    /**
     * Get overall network statistics
     */
    getNetworkStats() {
        const stats = {
            totalProviders: this.providerStats.size,
            totalShards: 0,
            totalChallenges: 0,
            successfulChallenges: 0,
            failedChallenges: 0,
            activeChallenges: this.activeChallenges.size,
            averageUptime: 0,
            averageReputation: 0
        };

        let uptimeSum = 0;
        let reputationSum = 0;
        
        for (const [nodeId, providerStats] of this.providerStats) {
            stats.totalShards += providerStats.totalShards;
            stats.totalChallenges += providerStats.totalChallenges;
            stats.successfulChallenges += providerStats.successfulChallenges;
            stats.failedChallenges += providerStats.failedChallenges;
            
            uptimeSum += this.calculateProviderUptime(nodeId);
            reputationSum += providerStats.reputation;
        }
        
        if (this.providerStats.size > 0) {
            stats.averageUptime = uptimeSum / this.providerStats.size;
            stats.averageReputation = reputationSum / this.providerStats.size;
        }
        
        stats.overallSuccessRate = stats.totalChallenges > 0 ? 
            stats.successfulChallenges / stats.totalChallenges : 0;
        
        return stats;
    }

    /**
     * Get challenge history
     */
    getChallengeHistory(limit = 100, nodeId = null) {
        let history = this.challengeHistory;
        
        if (nodeId) {
            history = history.filter(challenge => challenge.nodeId === nodeId);
        }
        
        return history
            .slice(-limit)
            .sort((a, b) => b.issued - a.issued);
    }

    /**
     * Shutdown and cleanup
     */
    shutdown() {
        if (this.challengeInterval) {
            clearInterval(this.challengeInterval);
            this.challengeInterval = null;
        }
        
        if (this.integrityInterval) {
            clearInterval(this.integrityInterval);
            this.integrityInterval = null;
        }
        
        // Cancel all active challenges
        this.activeChallenges.clear();
        
        this.emit('shutdown');
    }
}

export default KeyspaceProofOfStorage;
