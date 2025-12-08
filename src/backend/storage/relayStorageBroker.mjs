/**
 * Relay Storage Broker - Automated Market Matching and Shard Placement
 * Determines shard placement across ≥3 nodes, assigns payouts, manages fallback and repair
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

// Simple logger for storage operations
const logger = {
  info: (...args) => console.log('ℹ️ [Broker]', ...args),
  warn: (...args) => console.warn('⚠️ [Broker]', ...args),
  error: (...args) => console.error('❌ [Broker]', ...args)
};

export class RelayStorageBroker extends EventEmitter {
  constructor(storageRegistry, shardManager, options = {}) {
    super();
    this.storageRegistry = storageRegistry;
    this.shardManager = shardManager;
    
    // Storage assignments and metadata
    this.storageAssignments = new Map();
    this.fileMetadata = new Map();
    
    // Cost tracking for Relay infrastructure
    this.costTracking = new Map(); // fileId -> cost breakdown
    this.relayUsageMetrics = {
      totalFiles: 0,
      totalShardsOnRelay: 0,
      totalCostIncurred: 0,
      monthlyUsage: new Map() // userId -> monthly costs
    };
    
    // User preferences and billing
    this.userPreferences = new Map(); // userId -> preferences
    this.userCredits = new Map(); // userId -> available credits

    this.registry = storageRegistry;
    this.activePlacements = new Map(); // fileId -> placement info
    this.paymentQueue = new Map(); // provider -> pending payments
    this.geographicSeparation = options.geographicSeparation || true;
    this.maxRetries = options.maxRetries || 3;
    this.placementTimeout = options.placementTimeout || 30000; // 30 seconds
    
    // Commission rates (Relay takes 0% as specified)
    this.commissionRate = 0.0;

    // Plan configurations
    this.planConfigs = {
      basic: {
        totalShards: 3,
        threshold: 2,
        maxCostPerMonth: 10.0,
        duration: 2592000000 // 30 days
      },
      secure: {
        totalShards: 5,
        threshold: 3,
        maxCostPerMonth: 25.0,
        duration: 2592000000 // 30 days
      },
      vault: {
        totalShards: 8,
        threshold: 5,
        maxCostPerMonth: 50.0,
        duration: 2592000000 // 30 days
      }
    };
  }

  /**
   * Find optimal storage placement for file shards
   * @param {Object} request - Storage request
   * @returns {Object} Placement plan with selected providers
   */
  async planShardPlacement(request) {
    try {
      const {
        fileId,
        shards,
        planTier,
        requirements = {},
        budget = {},
        preferences = {}
      } = request;

      logger.info(`Planning shard placement for file ${fileId} (${shards.length} shards, ${planTier} tier)`);

      // Get plan-specific requirements
      const planRequirements = this.getPlanRequirements(planTier);
      const mergedRequirements = { ...planRequirements, ...requirements };

      // Find suitable providers
      const candidateProviders = this.registry.findSuitableProviders({
        ...mergedRequirements,
        minimumProviders: shards.length
      });

      if (candidateProviders.length < shards.length) {
        throw new Error(`Insufficient providers: need ${shards.length}, found ${candidateProviders.length}`);
      }

      // Select optimal provider set
      const selectedProviders = await this.selectOptimalProviders(
        candidateProviders,
        shards.length,
        mergedRequirements
      );

      // Create placement plan
      const placementPlan = await this.createPlacementPlan(
        fileId,
        shards,
        selectedProviders,
        budget,
        preferences
      );

      // Store placement info for tracking
      this.activePlacements.set(fileId, {
        ...placementPlan,
        createdAt: Date.now(),
        status: 'planned'
      });

      logger.info(`Placement plan created for ${fileId}: ${selectedProviders.length} providers selected`);

      return placementPlan;

    } catch (error) {
      logger.error('Failed to plan shard placement:', error);
      throw new Error(`Placement planning failed: ${error.message}`);
    }
  }

  /**
   * Execute shard placement according to plan
   * @param {string} fileId - File identifier
   * @param {Object} shardData - Actual shard data to place
   * @returns {Object} Placement results
   */
  async executeShardPlacement(fileId, shardData) {
    try {
      const placement = this.activePlacements.get(fileId);
      if (!placement) {
        throw new Error(`No placement plan found for file ${fileId}`);
      }

      logger.info(`Executing shard placement for file ${fileId}`);

      const results = [];
      const placementPromises = [];

      // Place each shard on its assigned provider
      for (let i = 0; i < placement.assignments.length; i++) {
        const assignment = placement.assignments[i];
        const shard = shardData.shards[i];

        const placementPromise = this.placeShard(
          assignment.provider,
          shard,
          assignment.payment,
          placement.duration
        ).then(result => {
          results[i] = result;
          return result;
        }).catch(error => {
          logger.error(`Failed to place shard ${i} on provider ${assignment.provider.peerId}:`, error);
          results[i] = { success: false, error: error.message };
          return results[i];
        });

        placementPromises.push(placementPromise);
      }

      // Wait for all placements to complete
      await Promise.allSettled(placementPromises);

      // Check placement success
      const successfulPlacements = results.filter(r => r && r.success);
      const failedPlacements = results.filter(r => !r || !r.success);

      if (successfulPlacements.length < placement.threshold) {
        // Try to recover failed placements
        await this.recoverFailedPlacements(fileId, failedPlacements);
      }

      // Update placement status
      placement.status = successfulPlacements.length >= placement.threshold ? 'active' : 'degraded';
      placement.executedAt = Date.now();
      placement.results = results;

      // Queue payments to providers
      await this.queueProviderPayments(placement, successfulPlacements);

      const finalResult = {
        fileId,
        success: successfulPlacements.length >= placement.threshold,
        placedShards: successfulPlacements.length,
        totalShards: results.length,
        failedShards: failedPlacements.length,
        threshold: placement.threshold,
        status: placement.status,
        cost: placement.totalCost,
        results: results
      };

      this.emit('placement-completed', finalResult);

      return finalResult;

    } catch (error) {
      logger.error('Failed to execute shard placement:', error);
      throw new Error(`Placement execution failed: ${error.message}`);
    }
  }

  /**
   * Place a single shard on a provider
   * @param {Object} provider - Storage provider
   * @param {Object} shard - Shard data
   * @param {Object} payment - Payment information
   * @param {number} duration - Storage duration in ms
   * @returns {Object} Placement result
   */
  async placeShard(provider, shard, payment, duration) {
    try {
      const placement = {
        shardId: shard.id,
        providerId: provider.peerId,
        data: shard,
        payment: payment,
        duration: duration,
        placedAt: Date.now(),
        expiresAt: Date.now() + duration
      };

      // In a real implementation, this would communicate with the provider
      // via libp2p to transfer the shard data
      const response = await this.sendShardToProvider(provider, placement);

      if (response.success) {
        // Update provider reputation
        this.registry.updateProviderReputation(provider.peerId, {
          challengeSuccess: true,
          responseTime: response.responseTime,
          dataIntegrity: true,
          uptime: true
        });

        return {
          success: true,
          shardId: shard.id,
          providerId: provider.peerId,
          storageId: response.storageId,
          cost: payment.amount,
          expiresAt: placement.expiresAt
        };
      } else {
        throw new Error(response.error || 'Placement failed');
      }

    } catch (error) {
      // Update provider reputation on failure
      this.registry.updateProviderReputation(provider.peerId, {
        challengeSuccess: false,
        uptime: false
      });

      return {
        success: false,
        shardId: shard.id,
        providerId: provider.peerId,
        error: error.message
      };
    }
  }

  /**
   * Send shard data to storage provider
   * @param {Object} provider - Storage provider
   * @param {Object} placement - Placement information
   * @returns {Object} Provider response
   */
  async sendShardToProvider(provider, placement) {
    // Simulate shard transfer to provider
    // In real implementation, this would use libp2p to send data
    const startTime = Date.now();
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      // Simulate success/failure based on provider reputation
      const successProbability = Math.max(0.7, provider.reputation);
      const success = Math.random() < successProbability;
      
      if (success) {
        return {
          success: true,
          storageId: crypto.randomUUID(),
          responseTime: Date.now() - startTime,
          providerId: provider.peerId
        };
      } else {
        throw new Error('Provider rejected shard placement');
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Recover failed placements by finding alternative providers
   * @param {string} fileId - File identifier
   * @param {Array} failedPlacements - Failed placement results
   */
  async recoverFailedPlacements(fileId, failedPlacements) {
    const placement = this.activePlacements.get(fileId);
    if (!placement) return;

    logger.info(`Attempting to recover ${failedPlacements.length} failed placements for ${fileId}`);

    for (const failed of failedPlacements) {
      if (!failed || !failed.shardId) continue;

      try {
        // Find alternative providers excluding failed ones
        const excludeProviders = [failed.providerId];
        const alternatives = this.registry.findSuitableProviders({
          minimumProviders: 1,
          excludeProviders
        });

        if (alternatives.length > 0) {
          const alternativeProvider = alternatives[0];
          const shardIndex = placement.assignments.findIndex(a => 
            a.shard && a.shard.id === failed.shardId
          );
          
          if (shardIndex >= 0) {
            // Update assignment with alternative provider
            placement.assignments[shardIndex].provider = alternativeProvider;
            placement.assignments[shardIndex].recovery = true;
            
            logger.info(`Found alternative provider ${alternativeProvider.peerId} for shard ${failed.shardId}`);
          }
        }
      } catch (error) {
        logger.error(`Failed to find alternative for shard ${failed.shardId}:`, error);
      }
    }
  }

  /**
   * Select optimal providers from candidates
   * @param {Array} candidates - Candidate providers
   * @param {number} shardCount - Number of shards to place
   * @param {Object} requirements - Storage requirements
   * @returns {Array} Selected providers
   */
  async selectOptimalProviders(candidates, shardCount, requirements) {
    const selected = [];
    const usedRegions = new Set();
    
    // Sort candidates by score
    const sortedCandidates = [...candidates].sort((a, b) => b.score - a.score);
    
    for (const candidate of sortedCandidates) {
      if (selected.length >= shardCount) break;
      
      // Apply geographic separation if required
      if (this.geographicSeparation && usedRegions.has(candidate.region)) {
        // Skip if we already have a provider in this region and have alternatives
        if (sortedCandidates.length > shardCount) {
          continue;
        }
      }
      
      selected.push(candidate);
      usedRegions.add(candidate.region);
    }
    
    if (selected.length < shardCount) {
      // Fill remaining slots without geographic restrictions
      for (const candidate of sortedCandidates) {
        if (selected.length >= shardCount) break;
        if (!selected.find(s => s.peerId === candidate.peerId)) {
          selected.push(candidate);
        }
      }
    }
    
    return selected.slice(0, shardCount);
  }

  /**
   * Create detailed placement plan
   * @param {string} fileId - File identifier
   * @param {Array} shards - Shards to place
   * @param {Array} providers - Selected providers
   * @param {Object} budget - Budget constraints
   * @param {Object} preferences - User preferences
   * @returns {Object} Placement plan
   */
  async createPlacementPlan(fileId, shards, providers, budget = {}, preferences = {}) {
    const {
      maxCostPerMonth = 10.0,
      duration = 2592000000 // 30 days default
    } = budget;

    const assignments = [];
    let totalCost = 0;

    for (let i = 0; i < shards.length; i++) {
      const shard = shards[i];
      const provider = providers[i];
      
      // Calculate cost for this shard
      const shardSizeGB = shard.size / (1024 * 1024 * 1024);
      const monthlyRate = provider.pricePerGBMonth;
      const durationMonths = duration / (30 * 24 * 60 * 60 * 1000);
      const shardCost = shardSizeGB * monthlyRate * durationMonths;

      totalCost += shardCost;

      assignments.push({
        shardIndex: i,
        shard: shard,
        provider: provider,
        payment: {
          amount: shardCost,
          currency: 'USD',
          method: preferences.paymentMethod || 'direct',
          recipient: provider.peerId
        },
        expectedPlacement: Date.now(),
        expiresAt: Date.now() + duration
      });
    }

    // Check budget constraints
    if (totalCost > maxCostPerMonth) {
      throw new Error(`Total cost $${totalCost.toFixed(2)} exceeds budget $${maxCostPerMonth}`);
    }

    return {
      fileId,
      assignments,
      totalCost,
      duration,
      threshold: Math.ceil(shards.length * 0.6), // 60% threshold for reconstruction
      geographicDistribution: this.analyzeGeographicDistribution(providers),
      costBreakdown: this.calculateCostBreakdown(assignments, totalCost),
      createdAt: Date.now()
    };
  }

  /**
   * Queue payments to storage providers
   * @param {Object} placement - Placement plan
   * @param {Array} successfulPlacements - Successful placements
   */
  async queueProviderPayments(placement, successfulPlacements) {
    for (const success of successfulPlacements) {
      const assignment = placement.assignments.find(a => 
        a.shard.id === success.shardId
      );
      
      if (assignment) {
        const providerId = success.providerId;
        
        if (!this.paymentQueue.has(providerId)) {
          this.paymentQueue.set(providerId, []);
        }
        
        this.paymentQueue.get(providerId).push({
          fileId: placement.fileId,
          shardId: success.shardId,
          amount: assignment.payment.amount,
          currency: assignment.payment.currency,
          method: assignment.payment.method,
          scheduledAt: Date.now(),
          expiresAt: assignment.expiresAt
        });
      }
    }
    
    // Emit payment event for external payment processing
    this.emit('payments-queued', {
      fileId: placement.fileId,
      providerCount: successfulPlacements.length,
      totalAmount: successfulPlacements.reduce((sum, s) => {
        const assignment = placement.assignments.find(a => a.shard.id === s.shardId);
        return sum + (assignment ? assignment.payment.amount : 0);
      }, 0)
    });
  }

  /**
   * Get plan-specific requirements
   * @param {string} planTier - Plan tier (basic, secure, vault)
   * @returns {Object} Plan requirements
   */
  getPlanRequirements(planTier) {
    const plans = {
      basic: {
        minimumProviders: 3,
        minReputation: 0.3,
        maxPricePerGB: 2.0,
        requireBadges: [],
        geographicSeparation: false
      },
      secure: {
        minimumProviders: 5,
        minReputation: 0.5,
        maxPricePerGB: 5.0,
        requireBadges: [],
        geographicSeparation: true
      },
      vault: {
        minimumProviders: 8,
        minReputation: 0.7,
        maxPricePerGB: 10.0,
        requireBadges: ['verified'],
        geographicSeparation: true,
        guardiansOnly: true
      }
    };

    return plans[planTier] || plans.secure;
  }

  /**
   * Analyze geographic distribution of selected providers
   * @param {Array} providers - Selected providers
   * @returns {Object} Geographic analysis
   */
  analyzeGeographicDistribution(providers) {
    const regions = {};
    for (const provider of providers) {
      regions[provider.region] = (regions[provider.region] || 0) + 1;
    }

    return {
      regions: regions,
      uniqueRegions: Object.keys(regions).length,
      largestConcentration: Math.max(...Object.values(regions)),
      distributionScore: Object.keys(regions).length / providers.length
    };
  }

  /**
   * Calculate detailed cost breakdown
   * @param {Array} assignments - Shard assignments
   * @param {number} totalCost - Total cost
   * @returns {Object} Cost breakdown
   */
  calculateCostBreakdown(assignments, totalCost) {
    const breakdown = {
      totalCost,
      providerPayouts: totalCost * (1 - this.commissionRate),
      relayCommission: totalCost * this.commissionRate,
      averageCostPerShard: totalCost / assignments.length,
      costByRegion: {},
      costByProvider: {}
    };

    for (const assignment of assignments) {
      const region = assignment.provider.region;
      const providerId = assignment.provider.peerId;
      const cost = assignment.payment.amount;

      breakdown.costByRegion[region] = (breakdown.costByRegion[region] || 0) + cost;
      breakdown.costByProvider[providerId] = (breakdown.costByProvider[providerId] || 0) + cost;
    }

    return breakdown;
  }

  /**
   * Get placement status for a file
   * @param {string} fileId - File identifier
   * @returns {Object} Placement status
   */
  getPlacementStatus(fileId) {
    const placement = this.activePlacements.get(fileId);
    if (!placement) {
      return { found: false };
    }

    const now = Date.now();
    const activeShards = placement.results 
      ? placement.results.filter(r => r && r.success && r.expiresAt > now).length
      : 0;

    return {
      found: true,
      status: placement.status,
      activeShards,
      totalShards: placement.assignments.length,
      threshold: placement.threshold,
      redundancyLevel: activeShards >= placement.threshold ? 'sufficient' : 'degraded',
      cost: placement.totalCost,
      expiresAt: Math.min(...placement.assignments.map(a => a.expiresAt)),
      needsRepair: activeShards < placement.threshold
    };
  }

  /**
   * Get pending payments for providers
   * @returns {Object} Payment queue status
   */
  getPaymentQueue() {
    const queue = {};
    for (const [providerId, payments] of this.paymentQueue) {
      queue[providerId] = {
        pendingPayments: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
        oldestPayment: Math.min(...payments.map(p => p.scheduledAt))
      };
    }
    return queue;
  }

  /**
   * Get user storage preferences
   */
  getUserPreferences(userId, overrides = {}) {
    const defaultPreferences = {
      allowRelayFallback: true,
      maxRelayCostPerFile: 1.00, // $1.00 max Relay cost per file
      preferredRegion: null,
      prioritizeLatency: true,
      prioritizeUptime: true,
      billingPreference: 'pay-as-you-go', // 'prepaid', 'monthly', 'yearly'
      notifyOnRelayUsage: true
    };

    const userPrefs = this.userPreferences.get(userId) || defaultPreferences;
    return { ...userPrefs, ...overrides };
  }

  /**
   * Set user storage preferences
   */
  setUserPreferences(userId, preferences) {
    const current = this.getUserPreferences(userId);
    const updated = { ...current, ...preferences };
    this.userPreferences.set(userId, updated);
    
    this.emit('user:preferences_updated', { userId, preferences: updated });
    return updated;
  }

  /**
   * Select hybrid providers (P2P + Relay fallback)
   */
  async selectHybridProviders(totalShards, planTier, preferences, fallbackCheck) {
    const selection = {
      userProviders: [],
      relayProviders: [],
      totalSelected: 0
    };

    // First, try to get user providers
    let availableUserProviders = fallbackCheck.availableUserProviders;

    // Apply user preferences for provider ranking
    if (preferences.prioritizeLatency) {
      availableUserProviders.sort((a, b) => a.avgLatency - b.avgLatency);
    }

    if (preferences.prioritizeUptime) {
      availableUserProviders.sort((a, b) => b.uptime - a.uptime);
    }

    // Select user providers first
    const userProvidersToUse = Math.min(availableUserProviders.length, totalShards);
    selection.userProviders = availableUserProviders.slice(0, userProvidersToUse);
    selection.totalSelected += userProvidersToUse;

    // Check if Relay fallback is needed and allowed
    const relayShardsNeeded = totalShards - selection.totalSelected;
    
    if (relayShardsNeeded > 0) {
      if (!preferences.allowRelayFallback) {
        throw new Error(`Insufficient P2P providers (${selection.totalSelected}/${totalShards}) and Relay fallback disabled`);
      }

      // Get Relay providers
      const relayProviders = await this.storageRegistry.getRelayProviders(preferences.preferredRegion);
      
      if (relayProviders.length === 0) {
        throw new Error('No Relay providers available for fallback');
      }

      // Select Relay providers (geographic distribution)
      const relayProvidersToUse = Math.min(relayProviders.length, relayShardsNeeded);
      selection.relayProviders = this.selectGeographicallyDistributed(
          relayProviders, 
          relayProvidersToUse
      );
      selection.totalSelected += selection.relayProviders.length;
    }

    if (selection.totalSelected < totalShards) {
      throw new Error(`Insufficient total providers (${selection.totalSelected}/${totalShards})`);
    }

    return selection;
  }

  /**
   * Select providers with geographic distribution
   */
  selectGeographicallyDistributed(providers, count) {
    const selected = [];
    const usedRegions = new Set();
    
    // First pass: one provider per region
    for (const provider of providers) {
      if (selected.length >= count) break;
      
      if (!usedRegions.has(provider.region)) {
        selected.push(provider);
        usedRegions.add(provider.region);
      }
    }
    
    // Second pass: fill remaining slots
    for (const provider of providers) {
      if (selected.length >= count) break;
      
      if (!selected.includes(provider)) {
        selected.push(provider);
      }
    }
    
    return selected.slice(0, count);
  }

  /**
   * Calculate hybrid costs for provider selection
   */
  calculateHybridCosts(providerSelection, shards, planTier) {
    const userProviderCost = this.calculateProviderCosts(
        providerSelection.userProviders,
        shards.slice(0, providerSelection.userProviders.length),
        planTier
    );

    const relayProviderCost = providerSelection.relayProviders.length > 0 
        ? this.calculateProviderCosts(
            providerSelection.relayProviders,
            shards.slice(providerSelection.userProviders.length),
            planTier
        )
        : 0;

    return {
        userCost: userProviderCost,
        relayCost: relayProviderCost,
        totalCost: userProviderCost + relayProviderCost,
        costBreakdown: {
            p2pShards: providerSelection.userProviders.length,
            relayShards: providerSelection.relayProviders.length,
            p2pCostPerMB: providerSelection.userProviders.length > 0 
                ? userProviderCost / (shards.slice(0, providerSelection.userProviders.length).reduce((sum, s) => sum + s.length, 0) / (1024 * 1024))
                : 0,
            relayCostPerMB: providerSelection.relayProviders.length > 0
                ? relayProviderCost / (shards.slice(providerSelection.userProviders.length).reduce((sum, s) => sum + s.length, 0) / (1024 * 1024))
                : 0
        }
    };
  }

  /**
   * Authorize Relay usage for a user
   */
  async authorizeRelayUsage(userId, estimatedCost) {
    const userCredits = this.getUserCredits(userId);
    const relayCost = estimatedCost.relay || 0;
    
    // Check if user has sufficient credits
    if (userCredits < relayCost) {
      logger.warn(`User ${userId} has insufficient credits for Relay storage: ${userCredits} < ${relayCost}`);
      return false;
    }

    return true;
  }

  /**
   * Track storage cost for a user
   */
  async trackStorageCost(userId, fileId, placementPlan) {
    try {
      // Track in cost tracking map
      this.costTracking.set(fileId, {
        userId,
        fileId,
        totalCost: placementPlan.estimatedCost.total,
        p2pCost: placementPlan.estimatedCost.p2p,
        relayCost: placementPlan.estimatedCost.relay,
        p2pShards: placementPlan.p2pShards,
        relayShards: placementPlan.relayShards,
        timestamp: Date.now()
      });

      // Update user credits if Relay was used
      if (placementPlan.relayShards > 0) {
        const currentCredits = this.getUserCredits(userId);
        const newCredits = currentCredits - placementPlan.estimatedCost.relay;
        this.userCredits.set(userId, Math.max(0, newCredits));
      }

      // Update monthly usage tracking
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthlyUsage = this.relayUsageMetrics.monthlyUsage.get(userId) || {};
      const currentMonthUsage = monthlyUsage[currentMonth] || { files: 0, cost: 0, relayShards: 0 };
      
      monthlyUsage[currentMonth] = {
        files: currentMonthUsage.files + 1,
        cost: currentMonthUsage.cost + placementPlan.estimatedCost.relay,
        relayShards: currentMonthUsage.relayShards + placementPlan.relayShards
      };
      
      this.relayUsageMetrics.monthlyUsage.set(userId, monthlyUsage);

      // Update global metrics
      this.relayUsageMetrics.totalFiles += 1;
      this.relayUsageMetrics.totalShardsOnRelay += placementPlan.relayShards;
      this.relayUsageMetrics.totalCostIncurred += placementPlan.estimatedCost.relay;

      logger.info(`Tracked storage cost for ${fileId}: $${placementPlan.estimatedCost.total} (P2P: $${placementPlan.estimatedCost.p2p}, Relay: $${placementPlan.estimatedCost.relay})`);

    } catch (error) {
      logger.error('Failed to track storage cost:', error);
    }
  }

  /**
   * Get user preferences for storage
   */
  getUserPreferences(userId) {
    return this.userPreferences.get(userId) || {
      allowRelayFallback: true,
      preferredRegion: null,
      maxMonthlyCost: 50.0,
      billingPreference: 'pay-as-you-go'
    };
  }

  /**
   * Set user preferences for storage
   */
  setUserPreferences(userId, preferences) {
    const existing = this.getUserPreferences(userId);
    const updated = { ...existing, ...preferences };
    this.userPreferences.set(userId, updated);
    return updated;
  }

  /**
   * Get user available credits
   */
  getUserCredits(userId) {
    return this.userCredits.get(userId) || 0;
  }

  /**
   * Add credits to user account
   */
  addUserCredits(userId, amount) {
    const current = this.getUserCredits(userId);
    const newBalance = current + amount;
    this.userCredits.set(userId, newBalance);
    
    logger.info(`Added $${amount} credits to user ${userId}. New balance: $${newBalance}`);
    return newBalance;
  }

  /**
   * Get cost breakdown for a file
   */
  getFileCostBreakdown(fileId) {
    return this.costTracking.get(fileId) || null;
  }

  /**
   * Get monthly usage report for a user
   */
  getUserUsageReport(userId, month = null) {
    const userUsage = this.relayUsageMetrics.monthlyUsage.get(userId) || {};
    
    if (month) {
      return userUsage[month] || { files: 0, cost: 0, relayShards: 0 };
    }
    
    return userUsage;
  }

  /**
   * Get overall storage analytics
   */
  getStorageAnalytics() {
    return {
      totalFiles: this.fileMetadata.size,
      totalCostTracked: Array.from(this.costTracking.values())
        .reduce((sum, cost) => sum + cost.totalCost, 0),
      relayMetrics: this.relayUsageMetrics,
      activeUsers: this.userCredits.size,
      averageCostPerFile: this.fileMetadata.size > 0 
        ? Array.from(this.costTracking.values())
            .reduce((sum, cost) => sum + cost.totalCost, 0) / this.fileMetadata.size
        : 0
    };
  }

  /**
   * Store file with hybrid P2P and Relay provider selection
   * @param {Object} request - Storage request with user preferences
   * @returns {Object} Storage result with cost breakdown
   */
  async storeFile(request) {
    try {
      const {
        fileId,
        fileData,
        userId,
        planTier = 'secure',
        preferences = {},
        allowRelayFallback = true
      } = request;

      logger.info(`Storing file ${fileId} for user ${userId} with ${planTier} plan`);

      // Get user preferences
      const userPrefs = this.getUserPreferences(userId);
      const mergedPrefs = { ...userPrefs, ...preferences, allowRelayFallback };

      // Create shards from file data
      const shards = await this.shardManager.createShards(fileData, planTier);
      
      // Plan shard placement with hybrid provider selection
      const placementPlan = await this.planHybridPlacement({
        fileId,
        shards,
        planTier,
        userId,
        preferences: mergedPrefs
      });

      // Check user authorization for Relay costs
      if (placementPlan.relayShards > 0) {
        const authorized = await this.authorizeRelayUsage(userId, placementPlan.estimatedCost);
        if (!authorized) {
          throw new Error('Insufficient credits or authorization for Relay storage');
        }
      }

      // Execute the placement
      const result = await this.executeShardPlacement(fileId, { shards });

      // Track costs and update user credits
      if (result.success) {
        await this.trackStorageCost(userId, fileId, placementPlan);
        
        // Store file metadata
        this.fileMetadata.set(fileId, {
          userId,
          planTier,
          shardsTotal: shards.length,
          p2pShards: placementPlan.p2pShards,
          relayShards: placementPlan.relayShards,
          costBreakdown: placementPlan.estimatedCost,
          createdAt: Date.now(),
          expiresAt: Date.now() + this.planConfigs[planTier].duration
        });
      }

      return {
        ...result,
        costBreakdown: placementPlan.estimatedCost,
        providerMix: {
          p2p: placementPlan.p2pShards,
          relay: placementPlan.relayShards
        }
      };

    } catch (error) {
      logger.error('Failed to store file:', error);
      throw error;
    }
  }

  /**
   * Plan hybrid placement using both P2P and Relay providers
   */
  async planHybridPlacement(request) {
    const { fileId, shards, planTier, userId, preferences } = request;
    
    // Check what's available from P2P providers
    const availabilityCheck = await this.storageRegistry.checkRelayFallbackNeeded(
      shards.length,
      planTier,
      preferences.preferredRegion
    );

    const p2pProviders = availabilityCheck.availableUserProviders.slice(0, availabilityCheck.p2pAvailable);
    const needRelayProviders = availabilityCheck.relayRequired;

    let relayProviders = [];
    if (needRelayProviders > 0 && preferences.allowRelayFallback) {
      relayProviders = await this.storageRegistry.getRelayProviders(preferences.preferredRegion);
      relayProviders = relayProviders.slice(0, needRelayProviders);
    }

    // Create mixed provider assignment
    const allProviders = [...p2pProviders, ...relayProviders];
    const assignments = [];

    for (let i = 0; i < shards.length && i < allProviders.length; i++) {
      const provider = allProviders[i];
      const isRelay = provider.providerType === this.storageRegistry.providerTypes.RELAY || provider.isRelayOwned;
      
      assignments.push({
        provider,
        shard: shards[i],
        isRelay,
        payment: {
          amount: this.calculateShardCost(provider, shards[i], planTier),
          recipient: provider.peerId,
          duration: this.planConfigs[planTier].duration
        }
      });
    }

    const totalCost = assignments.reduce((sum, a) => sum + a.payment.amount, 0);
    const p2pCost = assignments.filter(a => !a.isRelay).reduce((sum, a) => sum + a.payment.amount, 0);
    const relayCost = assignments.filter(a => a.isRelay).reduce((sum, a) => sum + a.payment.amount, 0);

    return {
      fileId,
      assignments,
      p2pShards: p2pProviders.length,
      relayShards: relayProviders.length,
      totalCost,
      estimatedCost: {
        p2p: parseFloat(p2pCost.toFixed(2)),
        relay: parseFloat(relayCost.toFixed(2)),
        total: parseFloat(totalCost.toFixed(2))
      },
      threshold: this.planConfigs[planTier].threshold,
      duration: this.planConfigs[planTier].duration
    };
  }

  /**
   * Calculate cost for storing a shard on a specific provider
   */
  calculateShardCost(provider, shard, planTier) {
    const baseRate = provider.pricePerGBMonth || 2.0;
    const shardSizeGB = (shard.size || 1024 * 1024) / (1024 * 1024 * 1024); // Convert to GB
    const duration = this.planConfigs[planTier].duration;
    const monthlyFraction = duration / (30 * 24 * 60 * 60 * 1000); // Convert to monthly fraction
    
    return parseFloat((baseRate * shardSizeGB * monthlyFraction).toFixed(4));
  }

  /**
   * Authorize Relay usage for a user
   */
  async authorizeRelayUsage(userId, estimatedCost) {
    const userCredits = this.getUserCredits(userId);
    const relayCost = estimatedCost.relay || 0;
    
    // Check if user has sufficient credits
    if (userCredits < relayCost) {
      logger.warn(`User ${userId} has insufficient credits for Relay storage: ${userCredits} < ${relayCost}`);
      return false;
    }

    return true;
  }

  /**
   * Track storage cost for a user
   */
  async trackStorageCost(userId, fileId, placementPlan) {
    try {
      // Track in cost tracking map
      this.costTracking.set(fileId, {
        userId,
        fileId,
        totalCost: placementPlan.estimatedCost.total,
        p2pCost: placementPlan.estimatedCost.p2p,
        relayCost: placementPlan.estimatedCost.relay,
        p2pShards: placementPlan.p2pShards,
        relayShards: placementPlan.relayShards,
        timestamp: Date.now()
      });

      // Update user credits if Relay was used
      if (placementPlan.relayShards > 0) {
        const currentCredits = this.getUserCredits(userId);
        const newCredits = currentCredits - placementPlan.estimatedCost.relay;
        this.userCredits.set(userId, Math.max(0, newCredits));
      }

      // Update monthly usage tracking
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthlyUsage = this.relayUsageMetrics.monthlyUsage.get(userId) || {};
      const currentMonthUsage = monthlyUsage[currentMonth] || { files: 0, cost: 0, relayShards: 0 };
      
      monthlyUsage[currentMonth] = {
        files: currentMonthUsage.files + 1,
        cost: currentMonthUsage.cost + placementPlan.estimatedCost.relay,
        relayShards: currentMonthUsage.relayShards + placementPlan.relayShards
      };
      
      this.relayUsageMetrics.monthlyUsage.set(userId, monthlyUsage);

      // Update global metrics
      this.relayUsageMetrics.totalFiles += 1;
      this.relayUsageMetrics.totalShardsOnRelay += placementPlan.relayShards;
      this.relayUsageMetrics.totalCostIncurred += placementPlan.estimatedCost.relay;

      logger.info(`Tracked storage cost for ${fileId}: $${placementPlan.estimatedCost.total} (P2P: $${placementPlan.estimatedCost.p2p}, Relay: $${placementPlan.estimatedCost.relay})`);

    } catch (error) {
      logger.error('Failed to track storage cost:', error);
    }
  }

  /**
   * Get user preferences for storage
   */
  getUserPreferences(userId) {
    return this.userPreferences.get(userId) || {
      allowRelayFallback: true,
      preferredRegion: null,
      maxMonthlyCost: 50.0,
      billingPreference: 'pay-as-you-go'
    };
  }

  /**
   * Set user preferences for storage
   */
  setUserPreferences(userId, preferences) {
    const existing = this.getUserPreferences(userId);
    const updated = { ...existing, ...preferences };
    this.userPreferences.set(userId, updated);
    return updated;
  }

  /**
   * Get user available credits
   */
  getUserCredits(userId) {
    return this.userCredits.get(userId) || 0;
  }

  /**
   * Add credits to user account
   */
  addUserCredits(userId, amount) {
    const current = this.getUserCredits(userId);
    const newBalance = current + amount;
    this.userCredits.set(userId, newBalance);
    
    logger.info(`Added $${amount} credits to user ${userId}. New balance: $${newBalance}`);
    return newBalance;
  }

  /**
   * Get cost breakdown for a file
   */
  getFileCostBreakdown(fileId) {
    return this.costTracking.get(fileId) || null;
  }

  /**
   * Get monthly usage report for a user
   */
  getUserUsageReport(userId, month = null) {
    const userUsage = this.relayUsageMetrics.monthlyUsage.get(userId) || {};
    
    if (month) {
      return userUsage[month] || { files: 0, cost: 0, relayShards: 0 };
    }
    
    return userUsage;
  }

  /**
   * Get overall storage analytics
   */
  getStorageAnalytics() {
    return {
      totalFiles: this.fileMetadata.size,
      totalCostTracked: Array.from(this.costTracking.values())
        .reduce((sum, cost) => sum + cost.totalCost, 0),
      relayMetrics: this.relayUsageMetrics,
      activeUsers: this.userCredits.size,
      averageCostPerFile: this.fileMetadata.size > 0 
        ? Array.from(this.costTracking.values())
            .reduce((sum, cost) => sum + cost.totalCost, 0) / this.fileMetadata.size
        : 0
    };
  }
}

export default RelayStorageBroker;
