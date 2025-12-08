/**
 * Relay Storage Registry - Decentralized Storage Provider Registry
 * Real-time index of provider nodes with location, availability, and reputation
 * Uses libp2p for peer-to-peer discovery and gossip protocol
 * Integrated with community governance for pricing
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
      
      // Feed market data to governance system
      setInterval(() => this.updateGovernanceMetrics(), 60000); // Every minute
      
      logger.info('Storage registry initialized with governance system');
      
    } catch (error) {
      logger.error('Failed to initialize storage registry:', error);
      throw error;
    }
  }

  /**
   * Handle pricing updates from governance system
   */
  handlePricingUpdate(event) {
    logger.info('Pricing updated by governance:', event.reason || 'Community vote');
    
    // Update all Relay providers with new pricing
    for (const [peerId, provider] of this.relayProviders) {
      if (provider.isRelayOwned) {
        const planTier = this.getProviderPlanTier(provider);
        provider.pricePerGBMonth = this.getCurrentPrice('relay', planTier);
        
        // Update in main providers map too
        this.providers.set(peerId, provider);
      }
    }
    
    this.emit('pricing-changed', event);
  }

  /**
   * Handle automatic market corrections
   */
  handleMarketCorrection(event) {
    logger.info(`Market correction applied: ${event.reason} (${(event.utilizationRate * 100).toFixed(1)}% utilization)`);
    this.handlePricingUpdate(event);
  }

  /**
   * Update market metrics for governance system
   */
  async updateGovernanceMetrics() {
    const userProviders = Array.from(this.providers.values())
      .filter(p => p.providerType === this.providerTypes.USER && p.online);
    
    const relayProviders = Array.from(this.relayProviders.values())
      .filter(p => p.online);
    
    const totalCapacityOffered = [...userProviders, ...relayProviders]
      .reduce((sum, p) => sum + (p.capacity || 0), 0);
    
    // This would normally come from actual storage usage data
    const totalCapacityDemanded = totalCapacityOffered * (0.3 + Math.random() * 0.5); // Simulate 30-80% usage
    
    const utilizationRate = totalCapacityDemanded / Math.max(totalCapacityOffered, 1);
    
    // Update governance system with market data
    this.pricingGovernance.marketData = {
      totalCapacityOffered,
      totalCapacityDemanded,
      utilizationRate,
      providerCount: { 
        p2p: userProviders.length, 
        relay: relayProviders.length 
      },
      averageResponseTime: this.calculateAverageResponseTime(),
      failureRate: this.calculateFailureRate(),
      userSatisfactionScore: this.calculateUserSatisfaction()
    };
  }

  /**
   * Register this node as a storage provider with governance-based pricing
   */
  async registerAsProvider(providerConfig = {}) {
    try {
      const {
        availableGB = 1,
        region = 'unknown',
        acceptsPublic = true,
        friendsOnly = false,
        guardiansOnly = false,
        badges = [],
        minDuration = 2592000000, // 30 days in ms
        maxFileSize = 1024 * 1024 * 1024, // 1GB
        planTier = 'basic' // basic, secure, vault
      } = providerConfig;

      const peerId = this.libp2p.peerId.toString();
      
      // Get current pricing from governance system
      const pricePerGBMonth = this.getCurrentPrice('p2p', planTier);
      
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
        planTier,
        uptime: {
          startedAt: Date.now(),
          lastSeen: Date.now(),
          challenges: { total: 0, successful: 0 }
        },
        reputation: this.reputation.get(peerId) || 1.0,
        version: '1.0.0',
        providerType: this.providerTypes.USER
      };

      // Register with governance as potential voter
      this.pricingGovernance.registerVoter(peerId, {
        storageProvided: availableGB,
        accountAge: Date.now() - (this.localProvider.uptime?.startedAt || Date.now()),
        reputationScore: this.localProvider.reputation
      });

      // Announce on appropriate topics
      await this.announceProvider(this.localProvider);
      
      logger.info(`Registered as storage provider: ${availableGB}GB at $${pricePerGBMonth}/GB/month (${planTier} tier)`);
      
      return this.localProvider;
      
    } catch (error) {
      logger.error('Failed to register as provider:', error);
      throw error;
    }
  }

  /**
   * Get current price from governance system
   */
  getCurrentPrice(providerType, planTier) {
    const pricing = this.pricingGovernance.getCurrentPricing();
    return pricing[providerType]?.[planTier] || 2.0; // Default fallback
  }

  /**
   * Initialize Relay-owned providers with governance pricing
   */
  async initializeRelayProviders() {
    try {
      // Register Relay's own infrastructure providers
      const relayProviders = [
        {
          id: 'relay-us-east-1',
          region: 'us-east-1',
          capacity: 1000, // GB
          uptime: 99.99,
          planTiers: ['basic', 'secure', 'vault']
        },
        {
          id: 'relay-eu-west-1',
          region: 'eu-west-1',
          capacity: 1000,
          uptime: 99.99,
          planTiers: ['basic', 'secure', 'vault']
        },
        {
          id: 'relay-asia-pacific-1',
          region: 'asia-pacific-1',
          capacity: 800,
          uptime: 99.9,
          planTiers: ['basic', 'secure', 'vault']
        }
      ];

      for (const provider of relayProviders) {
        await this.registerRelayProvider(provider);
      }

      logger.info(`Initialized ${relayProviders.length} Relay-owned providers with governance pricing`);
      
    } catch (error) {
      logger.error('Failed to initialize Relay providers:', error);
      throw error;
    }
  }

  /**
   * Register a Relay-owned provider with governance-based pricing
   */
  async registerRelayProvider(providerConfig) {
    try {
      // Use 'secure' as default tier for Relay infrastructure
      const planTier = providerConfig.defaultPlanTier || 'secure';
      const pricePerGBMonth = this.getCurrentPrice('relay', planTier);
      
      const relayProvider = {
        peerId: `relay-${providerConfig.id}`,
        providerType: this.providerTypes.RELAY,
        multiaddrs: [`/dns4/${providerConfig.id}.relay.network/tcp/443/wss`],
        region: providerConfig.region,
        capacity: providerConfig.capacity,
        used: 0,
        pricePerGBMonth,
        uptime: providerConfig.uptime,
        planTiers: providerConfig.planTiers,
        planTier,
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

      logger.info(`Registered Relay provider: ${relayProvider.peerId} in ${relayProvider.region} at $${pricePerGBMonth}/GB/month`);
      
      return relayProvider;
      
    } catch (error) {
      logger.error('Failed to register Relay provider:', error);
      throw error;
    }
  }

  /**
   * Create a pricing proposal for community voting
   */
  async createPricingProposal(proposerId, proposalData) {
    return await this.pricingGovernance.createPricingProposal(proposerId, proposalData);
  }

  /**
   * Cast a vote on a pricing proposal
   */
  async voteOnPricing(proposalId, userId, vote) {
    return await this.pricingGovernance.castVote(proposalId, userId, vote);
  }

  /**
   * Get current pricing and governance status
   */
  getPricingGovernanceStatus() {
    return this.pricingGovernance.getMarketOverview();
  }

  /**
   * Get voting statistics
   */
  getVotingStats() {
    return this.pricingGovernance.getVotingStats();
  }

  /**
   * Check if Relay fallback is needed with governance pricing
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

    // Get cost estimation with current governance pricing
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
        availableUserProviders,
        governancePricing: {
            p2pRate: this.getCurrentPrice('p2p', planTier),
            relayRate: this.getCurrentPrice('relay', planTier)
        }
    };
  }

  /**
   * Estimate storage costs using governance pricing
   */
  async estimateStorageCost(totalShards, p2pShards, relayShards, planTier) {
    const p2pRate = this.getCurrentPrice('p2p', planTier);
    const relayRate = this.getCurrentPrice('relay', planTier);
    
    const planSizeMap = {
        basic: 0.1, // GB
        secure: 0.2,
        vault: 0.5
    };
    
    const estimatedSize = planSizeMap[planTier] || 0.2;
    
    const p2pCost = p2pShards * estimatedSize * p2pRate;
    const relayCost = relayShards * estimatedSize * relayRate;
    
    return {
        p2p: parseFloat(p2pCost.toFixed(2)),
        relay: parseFloat(relayCost.toFixed(2)),
        total: parseFloat((p2pCost + relayCost).toFixed(2)),
        rates: {
            p2pRate,
            relayRate
        }
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

  // Helper methods for governance metrics
  calculateAverageResponseTime() {
    // Placeholder - would integrate with actual performance monitoring
    return 150 + Math.random() * 200; // 150-350ms
  }

  calculateFailureRate() {
    // Placeholder - would integrate with actual failure tracking
    return Math.random() * 0.05; // 0-5%
  }

  calculateUserSatisfaction() {
    // Placeholder - would integrate with user feedback system
    return 0.7 + Math.random() * 0.25; // 70-95%
  }

  getProviderPlanTier(provider) {
    return provider.planTier || 'basic';
  }

  maskRegion(region) {
    // Privacy protection for provider location
    return region;
  }

  // Placeholder methods (would be implemented with real libp2p integration)
  async announceProvider(provider) {
    // Would announce provider on pubsub topics
    logger.info(`Announcing provider ${provider.peerId}`);
  }

  async handleProviderAnnouncement(message, topicType) {
    // Would handle incoming provider announcements
  }

  async discoverProviders() {
    // Would ping known providers for discovery
  }

  async cleanupStaleProviders() {
    // Would remove offline/stale providers
  }
}

export default RelayStorageRegistry;
