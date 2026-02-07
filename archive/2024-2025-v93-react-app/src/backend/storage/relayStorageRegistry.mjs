/**
 * Relay Storage Registry - Decentralized Storage Provider Registry
 * Real-time index of provider nodes with location, availability, and reputation
 * Uses libp2p for peer-to-peer discovery and gossip protocol
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import StoragePricingGovernance from '../governance/storagePricingGovernance.mjs';

// Simple logger for storage operations
const logger = {
  info: (...args) => console.log('ℹ️ [Registry]', ...args),
  warn: (...args) => console.warn('⚠️ [Registry]', ...args),
  error: (...args) => console.error('❌ [Registry]', ...args)
};

export class RelayStorageRegistry extends EventEmitter {
  constructor(libp2pNode, options = {}) {
    super();
    
    this.libp2p = libp2pNode;
    this.providers = new Map(); // peerId -> provider info
    this.localProvider = null;
    this.discoveryInterval = options.discoveryInterval || 30000; // 30 seconds
    this.providerTimeout = options.providerTimeout || 300000; // 5 minutes
    this.maxProviders = options.maxProviders || 1000;
    
    // Initialize governance system for pricing
    this.pricingGovernance = new StoragePricingGovernance({
      votingPeriod: options.votingPeriod || 7 * 24 * 60 * 60 * 1000, // 7 days
      minVotesRequired: options.minVotesRequired || 50,
      quorumThreshold: options.quorumThreshold || 0.1 // 10% participation
    });

    // Listen to pricing updates from governance
    this.pricingGovernance.on('pricing-updated', (event) => {
      this.handlePricingUpdate(event);
    });

    this.pricingGovernance.on('market-correction', (event) => {
      this.handleMarketCorrection(event);
    });
    
    // Registry topics for different provider types
    this.topics = {
      public: 'relay-storage-providers',
      friends: 'relay-storage-friends',
      guardians: 'relay-storage-guardians'
    };
    
    this.reputation = new Map(); // Track provider reputation scores
    this.blacklist = new Set(); // Blocked provider IDs
    
    // Provider types and management
    this.providerTypes = {
      USER: 'user',
      RELAY: 'relay'
    };
    
    // Relay-owned provider tracking
    this.relayProviders = new Map();
    
    // Enhanced configuration for hybrid infrastructure
    this.config = {
      relayFallback: {
        enabled: true,
        maxRelayShards: 2, // Max shards per file on Relay infrastructure
        priorityThreshold: 0.7, // Use Relay when P2P availability < 70%
        regions: ['us-east-1', 'eu-west-1', 'asia-pacific-1'] // Relay data centers
      },
      providerSelection: {
        preferUserProviders: true,
        maxLatencyMs: 200,
        minUptimeRatio: 0.95,
        geographicDistribution: true
      }
    };
    
    this.init();
  }

  /**
   * Initialize the storage registry
   */
  async init() {
    try {
      // Subscribe to storage provider discovery topics
      for (const [type, topic] of Object.entries(this.topics)) {
        await this.libp2p.pubsub.subscribe(topic);
        this.libp2p.pubsub.addEventListener('message', (evt) => {
          if (evt.detail.topic === topic) {
            this.handleProviderAnnouncement(evt.detail, type);
          }
        });
      }

      // Start periodic cleanup of stale providers
      setInterval(() => this.cleanupStaleProviders(), this.providerTimeout);
      
      // Start provider discovery ping
      setInterval(() => this.discoverProviders(), this.discoveryInterval);
      
      logger.info('Storage registry initialized');
      
    } catch (error) {
      logger.error('Failed to initialize storage registry:', error);
      throw error;
    }
  }

  /**
   * Register this node as a storage provider
   * @param {Object} providerConfig - Provider configuration
   */
  async registerAsProvider(providerConfig = {}) {
    try {
      const {
        availableGB = 1,
        pricePerGBMonth = 1.0, // USD per GB per month
        region = 'unknown',
        acceptsPublic = true,
        friendsOnly = false,
        guardiansOnly = false,
        badges = [],
        minDuration = 2592000000, // 30 days in ms
        maxFileSize = 1024 * 1024 * 1024 // 1GB
      } = providerConfig;

      const peerId = this.libp2p.peerId.toString();
      
      this.localProvider = {
        peerId,
        multiaddrs: this.libp2p.getMultiaddrs().map(addr => addr.toString()),
        availableGB,
        pricePerGBMonth,
        region: this.maskRegion(region), // Privacy protection
        acceptsPublic,
        friendsOnly,
        guardiansOnly,
        badges,
        minDuration,
        maxFileSize,
        uptime: {
          startedAt: Date.now(),
          lastSeen: Date.now(),
          challenges: { total: 0, successful: 0 }
        },
        reputation: this.reputation.get(peerId) || 1.0,
        version: '1.0.0'
      };

      // Announce on appropriate topics
      await this.announceProvider(this.localProvider);
      
      logger.info(`Registered as storage provider: ${availableGB}GB at $${pricePerGBMonth}/GB/month`);
      
      return this.localProvider;
      
    } catch (error) {
      logger.error('Failed to register as provider:', error);
      throw error;
    }
  }

  /**
   * Announce provider availability on pubsub topics
   * @param {Object} provider - Provider information
   */
  async announceProvider(provider) {
    try {
      const announcement = {
        type: 'provider-announcement',
        provider: this.sanitizeProviderInfo(provider),
        timestamp: Date.now(),
        signature: await this.signAnnouncement(provider)
      };

      const message = new TextEncoder().encode(JSON.stringify(announcement));

      // Announce on appropriate topics based on provider settings
      if (provider.acceptsPublic) {
        await this.libp2p.pubsub.publish(this.topics.public, message);
      }
      
      if (provider.friendsOnly) {
        await this.libp2p.pubsub.publish(this.topics.friends, message);
      }
      
      if (provider.guardiansOnly) {
        await this.libp2p.pubsub.publish(this.topics.guardians, message);
      }

    } catch (error) {
      logger.error('Failed to announce provider:', error);
    }
  }

  /**
   * Handle incoming provider announcements
   * @param {Object} message - Pubsub message
   * @param {string} topicType - Type of topic (public, friends, guardians)
   */
  async handleProviderAnnouncement(message, topicType) {
    try {
      const data = JSON.parse(new TextDecoder().decode(message.data));
      
      if (data.type !== 'provider-announcement') {
        return;
      }

      const { provider, timestamp, signature } = data;
      const peerId = provider.peerId;

      // Skip our own announcements
      if (peerId === this.libp2p.peerId.toString()) {
        return;
      }

      // Check if provider is blacklisted
      if (this.blacklist.has(peerId)) {
        return;
      }

      // Verify announcement signature
      if (!await this.verifyAnnouncement(provider, signature)) {
        logger.warn(`Invalid provider announcement signature from ${peerId}`);
        return;
      }

      // Check if announcement is recent (within 5 minutes)
      if (Date.now() - timestamp > 300000) {
        return;
      }

      // Update provider registry
      const existingProvider = this.providers.get(peerId);
      
      provider.topicType = topicType;
      provider.lastSeen = Date.now();
      provider.discoveredAt = existingProvider?.discoveredAt || Date.now();

      this.providers.set(peerId, provider);
      
      // Emit event for new or updated providers
      if (!existingProvider) {
        this.emit('provider-discovered', provider);
        logger.info(`Discovered new storage provider: ${peerId} (${provider.availableGB}GB)`);
      } else {
        this.emit('provider-updated', provider);
      }

      // Cleanup if we have too many providers
      if (this.providers.size > this.maxProviders) {
        this.cleanupOldestProviders();
      }

    } catch (error) {
      logger.error('Failed to handle provider announcement:', error);
    }
  }

  /**
   * Find suitable storage providers for file storage
   * @param {Object} requirements - Storage requirements
   * @returns {Array} List of suitable providers
   */
  findSuitableProviders(requirements = {}) {
    const {
      minimumProviders = 3,
      excludeRegions = [],
      requireBadges = [],
      maxPricePerGB = 10.0,
      minAvailableGB = 0.1,
      friendsOnly = false,
      guardiansOnly = false,
      minReputation = 0.5
    } = requirements;

    const suitableProviders = [];
    
    for (const [peerId, provider] of this.providers) {
      // Check basic availability
      if (Date.now() - provider.lastSeen > this.providerTimeout) {
        continue;
      }

      // Check capacity
      if (provider.availableGB < minAvailableGB) {
        continue;
      }

      // Check pricing
      if (provider.pricePerGBMonth > maxPricePerGB) {
        continue;
      }

      // Check reputation
      if (provider.reputation < minReputation) {
        continue;
      }

      // Check region exclusions
      if (excludeRegions.includes(provider.region)) {
        continue;
      }

      // Check badge requirements
      if (requireBadges.length > 0) {
        const hasRequiredBadges = requireBadges.every(badge => 
          provider.badges.includes(badge)
        );
        if (!hasRequiredBadges) {
          continue;
        }
      }

      // Check access restrictions
      if (friendsOnly && !provider.friendsOnly && !provider.acceptsPublic) {
        continue;
      }

      if (guardiansOnly && !provider.guardiansOnly) {
        continue;
      }

      suitableProviders.push({
        ...provider,
        score: this.calculateProviderScore(provider, requirements)
      });
    }

    // Sort by score (higher is better) and return top candidates
    return suitableProviders
      .sort((a, b) => b.score - a.score)
      .slice(0, minimumProviders * 2); // Return more than minimum for selection
  }

  /**
   * Calculate provider score for ranking
   * @param {Object} provider - Provider information
   * @param {Object} requirements - Storage requirements
   * @returns {number} Provider score (0-1)
   */
  calculateProviderScore(provider, requirements = {}) {
    let score = 0;

    // Base reputation score (0-0.4)
    score += Math.min(provider.reputation, 1.0) * 0.4;

    // Uptime score (0-0.3)
    const uptimeHours = (Date.now() - provider.uptime.startedAt) / (1000 * 60 * 60);
    const uptimeScore = Math.min(uptimeHours / (24 * 30), 1.0); // Max score at 30 days uptime
    score += uptimeScore * 0.3;

    // Challenge success rate (0-0.2)
    const challengeSuccess = provider.uptime.challenges.total > 0 
      ? provider.uptime.challenges.successful / provider.uptime.challenges.total
      : 0.5; // Default for new providers
    score += challengeSuccess * 0.2;

    // Price competitiveness (0-0.1)
    const priceScore = Math.max(0, 1 - (provider.pricePerGBMonth / 5.0)); // Normalize to $5/GB max
    score += priceScore * 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Update provider reputation based on performance
   * @param {string} peerId - Provider peer ID
   * @param {Object} performance - Performance metrics
   */
  updateProviderReputation(peerId, performance) {
    const provider = this.providers.get(peerId);
    if (!provider) return;

    const {
      challengeSuccess = true,
      responseTime = 1000,
      dataIntegrity = true,
      uptime = true
    } = performance;

    let reputationChange = 0;

    // Challenge success/failure
    if (challengeSuccess) {
      reputationChange += 0.01;
      provider.uptime.challenges.successful++;
    } else {
      reputationChange -= 0.05;
    }
    provider.uptime.challenges.total++;

    // Response time impact
    if (responseTime < 1000) reputationChange += 0.005;
    if (responseTime > 5000) reputationChange -= 0.01;

    // Data integrity
    if (!dataIntegrity) reputationChange -= 0.1;

    // Uptime
    if (!uptime) reputationChange -= 0.02;

    // Update reputation with bounds
    provider.reputation = Math.max(0, Math.min(1.0, provider.reputation + reputationChange));
    this.reputation.set(peerId, provider.reputation);

    // Blacklist providers with very low reputation
    if (provider.reputation < 0.1) {
      this.blacklist.add(peerId);
      this.providers.delete(peerId);
      logger.warn(`Blacklisted provider ${peerId} due to low reputation`);
    }
  }

  /**
   * Get current provider statistics
   * @returns {Object} Registry statistics
   */
  getStatistics() {
    const providers = Array.from(this.providers.values());
    
    return {
      totalProviders: providers.length,
      onlineProviders: providers.filter(p => Date.now() - p.lastSeen < 60000).length,
      totalCapacityGB: providers.reduce((sum, p) => sum + p.availableGB, 0),
      averagePrice: providers.reduce((sum, p) => sum + p.pricePerGBMonth, 0) / providers.length,
      regionDistribution: this.getRegionDistribution(providers),
      reputationDistribution: this.getReputationDistribution(providers),
      blacklistedProviders: this.blacklist.size
    };
  }

  /**
   * Clean up stale providers
   */
  cleanupStaleProviders() {
    const now = Date.now();
    let cleaned = 0;

    for (const [peerId, provider] of this.providers) {
      if (now - provider.lastSeen > this.providerTimeout) {
        this.providers.delete(peerId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} stale providers`);
    }
  }

  /**
   * Clean up oldest providers when limit exceeded
   */
  cleanupOldestProviders() {
    const providers = Array.from(this.providers.entries());
    providers.sort(([,a], [,b]) => a.discoveredAt - b.discoveredAt);
    
    const toRemove = providers.slice(0, providers.length - this.maxProviders);
    for (const [peerId] of toRemove) {
      this.providers.delete(peerId);
    }
  }

  /**
   * Send discovery ping to find active providers
   */
  async discoverProviders() {
    const ping = {
      type: 'provider-discovery',
      timestamp: Date.now()
    };

    const message = new TextEncoder().encode(JSON.stringify(ping));
    
    try {
      await this.libp2p.pubsub.publish(this.topics.public, message);
    } catch (error) {
      logger.error('Failed to send discovery ping:', error);
    }
  }

  /**
   * Mask region for privacy protection
   * @param {string} region - Original region
   * @returns {string} Masked region
   */
  maskRegion(region) {
    // Convert specific locations to general regions for privacy
    const regionMap = {
      'us-east': 'North America',
      'us-west': 'North America',
      'canada': 'North America',
      'mexico': 'North America',
      'uk': 'Europe',
      'germany': 'Europe',
      'france': 'Europe',
      'japan': 'Asia Pacific',
      'australia': 'Asia Pacific',
      'singapore': 'Asia Pacific'
    };

    return regionMap[region.toLowerCase()] || 'Unknown';
  }

  /**
   * Sanitize provider info for public announcements
   * @param {Object} provider - Provider info
   * @returns {Object} Sanitized provider info
   */
  sanitizeProviderInfo(provider) {
    const { 
      peerId, 
      availableGB, 
      pricePerGBMonth, 
      region, 
      acceptsPublic, 
      friendsOnly, 
      guardiansOnly,
      badges,
      minDuration,
      maxFileSize,
      uptime,
      reputation,
      version
    } = provider;

    return {
      peerId,
      availableGB,
      pricePerGBMonth,
      region,
      acceptsPublic,
      friendsOnly,
      guardiansOnly,
      badges,
      minDuration,
      maxFileSize,
      uptime: {
        lastSeen: uptime.lastSeen,
        challenges: uptime.challenges
      },
      reputation,
      version
    };
  }

  /**
   * Sign provider announcement for verification
   * @param {Object} provider - Provider data
   * @returns {string} Signature
   */
  async signAnnouncement(provider) {
    const data = JSON.stringify(this.sanitizeProviderInfo(provider));
    const hash = crypto.createHash('sha256').update(data).digest();
    
    // This would typically use the libp2p peer's private key for signing
    // For now, we'll use a simple hash-based signature
    return hash.toString('hex');
  }

  /**
   * Verify provider announcement signature
   * @param {Object} provider - Provider data
   * @param {string} signature - Signature to verify
   * @returns {boolean} Verification result
   */
  async verifyAnnouncement(provider, signature) {
    const expectedSignature = await this.signAnnouncement(provider);
    return signature === expectedSignature;
  }

  /**
   * Get region distribution of providers
   * @param {Array} providers - Provider list
   * @returns {Object} Region distribution
   */
  getRegionDistribution(providers) {
    const distribution = {};
    for (const provider of providers) {
      distribution[provider.region] = (distribution[provider.region] || 0) + 1;
    }
    return distribution;
  }

  /**
   * Get reputation distribution of providers
   * @param {Array} providers - Provider list
   * @returns {Object} Reputation distribution
   */
  getReputationDistribution(providers) {
    const buckets = { low: 0, medium: 0, high: 0 };
    for (const provider of providers) {
      if (provider.reputation < 0.3) buckets.low++;
      else if (provider.reputation < 0.7) buckets.medium++;
      else buckets.high++;
    }
    return buckets;
  }

  /**
   * Initialize Relay-owned storage providers
   */
  async initializeRelayProviders() {
    try {
      // Register Relay's own infrastructure providers
      const relayProviders = [
        {
          id: 'relay-us-east-1',
          region: 'us-east-1',
          capacity: 1000, // GB
          pricePerGBMonth: 3.0, // Premium pricing for reliability
          uptime: 99.99,
          planTiers: ['basic', 'secure', 'vault']
        },
        {
          id: 'relay-eu-west-1',
          region: 'eu-west-1',
          capacity: 1000,
          pricePerGBMonth: 3.0,
          uptime: 99.99,
          planTiers: ['basic', 'secure', 'vault']
        },
        {
          id: 'relay-asia-pacific-1',
          region: 'asia-pacific-1',
          capacity: 800,
          pricePerGBMonth: 3.5, // Slightly higher for this region
          uptime: 99.9,
          planTiers: ['basic', 'secure', 'vault']
        }
      ];

      for (const provider of relayProviders) {
        await this.registerRelayProvider(provider);
      }

      logger.info(`Initialized ${relayProviders.length} Relay-owned providers`);
      
    } catch (error) {
      logger.error('Failed to initialize Relay providers:', error);
      throw error;
    }
  }

  /**
   * Register a Relay-owned provider
   */
  async registerRelayProvider(providerConfig) {
    try {
      const relayProvider = {
        peerId: `relay-${providerConfig.id}`,
        providerType: this.providerTypes.RELAY,
        multiaddrs: [`/dns4/${providerConfig.id}.relay.network/tcp/443/wss`],
        region: providerConfig.region,
        capacity: providerConfig.capacity,
        used: 0,
        pricePerGBMonth: providerConfig.pricePerGBMonth,
        uptime: providerConfig.uptime,
        planTiers: providerConfig.planTiers,
        online: true,
        lastSeen: Date.now(),
        isRelayOwned: true,
        reputation: 1.0,
        acceptsPublic: true,
        friendsOnly: false,
        guardiansOnly: false,
        badges: ['verified', 'relay-infrastructure'],
        version: '1.0.0'
      };

      this.relayProviders.set(relayProvider.peerId, relayProvider);
      this.providers.set(relayProvider.peerId, relayProvider);

      logger.info(`Registered Relay provider: ${relayProvider.peerId} in ${relayProvider.region}`);
      
      return relayProvider;
      
    } catch (error) {
      logger.error('Failed to register Relay provider:', error);
      throw error;
    }
  }

  /**
   * Check if Relay fallback is needed
   */
  async checkRelayFallbackNeeded(requiredShards, planTier, userRegion = null) {
    const userProviders = await this.getUserProviders(userRegion);
    const availableUserProviders = userProviders.filter(p => 
        p.planTiers?.includes(planTier) && 
        p.online && 
        (p.capacity - p.used) > 0
    );

    const userProviderCount = availableUserProviders.length;
    const fallbackNeeded = userProviderCount < requiredShards;
    const relayShardsNeeded = fallbackNeeded ? requiredShards - userProviderCount : 0;

    // Get cost estimation
    const costEstimate = await this.estimateStorageCost(
        requiredShards, 
        userProviderCount, 
        relayShardsNeeded,
        planTier
    );

    return {
        fallbackNeeded,
        p2pAvailable: userProviderCount,
        relayRequired: Math.min(relayShardsNeeded, this.config.relayFallback.maxRelayShards),
        estimatedCost: costEstimate,
        availableUserProviders
    };
  }

  /**
   * Estimate storage costs for P2P vs Relay providers
   */
  async estimateStorageCost(totalShards, p2pShards, relayShards, planTier) {
    const baseRatePerGBMonth = 2.0; // Base rate for P2P
    const relayMultiplier = this.config.relayFallback.costMultiplier;
    
    const planSizeMap = {
        basic: 0.1, // GB
        secure: 0.2,
        vault: 0.5
    };
    
    const estimatedSize = planSizeMap[planTier] || 0.2;
    
    const p2pCost = p2pShards * estimatedSize * baseRatePerGBMonth;
    const relayCost = relayShards * estimatedSize * baseRatePerGBMonth * relayMultiplier;
    
    return {
        p2p: parseFloat(p2pCost.toFixed(2)),
        relay: parseFloat(relayCost.toFixed(2)),
        total: parseFloat((p2pCost + relayCost).toFixed(2))
    };
  }

  /**
   * Get providers by type (user or relay)
   */
  async getProvidersByType(providerType, options = {}) {
    const { region, excludeOffline = true } = options;
    
    const allProviders = Array.from(this.providers.values());
    
    let filteredProviders = allProviders.filter(provider => {
      // Filter by provider type
      if (provider.providerType !== providerType && 
          !(providerType === this.providerTypes.RELAY && provider.isRelayOwned)) {
        return false;
      }
      
      // Filter by region if specified
      if (region && provider.region !== region) {
        return false;
      }
      
      // Exclude offline providers if requested
      if (excludeOffline && !provider.online) {
        return false;
      }
      
      return true;
    });
    
    return filteredProviders;
  }

  /**
   * Get Relay providers specifically
   */
  async getRelayProviders(region = null) {
    return await this.getProvidersByType(this.providerTypes.RELAY, { 
        region,
        excludeOffline: true
    });
  }

  /**
   * Get user providers specifically
   */
  async getUserProviders(region = null) {
    return await this.getProvidersByType(this.providerTypes.USER, { 
        region,
        excludeOffline: true
    });
  }
}

export default RelayStorageRegistry;
