/**
 * Storage Pricing Governance System
 * 
 * Channel-based democratic pricing where users propose pricing tiers
 * in an official Relay channel. The highest-ranked proposal becomes
 * the active pricing model through pure community voting.
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

// Simple logger for governance operations
const logger = {
  info: (...args) => console.log('ℹ️ [Pricing Channel]', ...args),
  warn: (...args) => console.warn('⚠️ [Pricing Channel]', ...args),
  error: (...args) => console.error('❌ [Pricing Channel]', ...args)
};

export class StoragePricingGovernance extends EventEmitter {
  constructor(channelService, options = {}) {
    super();
    
    this.channelService = channelService;
    
    // Official Relay channel for storage pricing governance
    this.officialChannelId = 'relay-storage-pricing';
    this.officialChannel = null;
    
    // Configuration for channel-based governance
    this.config = {
      proposalLifetime: options.proposalLifetime || 7 * 24 * 60 * 60 * 1000, // 7 days
      rankingUpdateInterval: options.rankingUpdateInterval || 60 * 60 * 1000, // 1 hour
      minProposalAge: options.minProposalAge || 24 * 60 * 60 * 1000, // 24 hours before ranking
      maxPriceChangePercent: options.maxPriceChangePercent || 50, // Max 50% change per proposal
      proposalCooldown: options.proposalCooldown || 24 * 60 * 60 * 1000, // 24 hours between proposals per user
    };
    
    // Current active pricing (from highest-ranked proposal)
    this.currentPricing = {
      p2p: {
        basic: 1.50,    // USD per GB per month
        secure: 2.00,
        vault: 2.50
      },
      relay: {
        basic: 2.25,    // 1.5x multiplier
        secure: 3.00,
        vault: 3.75
      }
    };
    
    // Track proposals and rankings
    this.activePricingProposals = new Map(); // proposalId -> proposal data
    this.proposalRankings = []; // Array of proposalIds sorted by rank
    this.userProposalHistory = new Map(); // userId -> last proposal timestamp
    this.lastRankingUpdate = Date.now();
    
    this.init();
  }  async init() {
    try {
      // Create or get the official storage pricing channel
      await this.initializeOfficialChannel();
      
      // Set up periodic ranking updates
      setInterval(() => this.updateProposalRankings(), this.config.rankingUpdateInterval);
      
      // Clean up expired proposals
      setInterval(() => this.cleanupExpiredProposals(), 60 * 60 * 1000); // Every hour
      
      logger.info('Storage pricing governance initialized with official Relay channel');
      
    } catch (error) {
      logger.error('Failed to initialize pricing governance:', error);
      throw error;
    }
  }

  /**
   * Initialize the official storage pricing channel
   */
  async initializeOfficialChannel() {
    try {
      // Check if channel already exists
      this.officialChannel = this.channelService.channels.get(this.officialChannelId);
      
      if (!this.officialChannel) {
        // Create the official channel
        const channelData = {
          id: this.officialChannelId,
          name: 'Storage Pricing Governance',
          description: 'Official channel for proposing and voting on storage pricing tiers. Highest-ranked proposal becomes active pricing.',
          type: 'official',
          isOfficial: true,
          isPublic: true,
          category: 'governance',
          createdAt: Date.now(),
          createdBy: 'relay-system',
          memberCount: 0,
          messageCount: 0,
          settings: {
            allowProposals: true,
            requireModeration: false,
            proposalFormat: 'pricing-tier',
            votingEnabled: true,
            rankingEnabled: true
          },
          rules: [
            'Propose storage pricing tiers with clear breakdown',
            'Vote on proposals using channel voting system',
            'Highest-ranked proposal becomes active pricing',
            'Price changes limited to 50% per proposal',
            'One proposal per user per 24 hours'
          ]
        };
        
        this.channelService.channels.set(this.officialChannelId, channelData);
        this.channelService.channelMessages.set(this.officialChannelId, []);
        this.officialChannel = channelData;
        
        logger.info('Created official storage pricing channel');
      }
      
      // Set up message handlers for pricing proposals
      this.setupProposalHandlers();
      
    } catch (error) {
      logger.error('Failed to initialize official channel:', error);
      throw error;
    }
  }  /**
   * Set up handlers for pricing proposal messages
   */
  setupProposalHandlers() {
    // Listen for new messages in the official channel
    this.channelService.on('message-posted', (event) => {
      if (event.channelId === this.officialChannelId) {
        this.handleChannelMessage(event);
      }
    });
    
    // Listen for votes on pricing proposals
    this.channelService.on('content-voted', (event) => {
      if (event.channelId === this.officialChannelId) {
        this.handleProposalVote(event);
      }
    });
  }

  /**
   * Handle messages in the pricing channel
   */
  async handleChannelMessage(event) {
    try {
      const { messageId, userId, content, timestamp } = event;
      
      // Check if this is a pricing proposal
      if (this.isPricingProposal(content)) {
        await this.processPricingProposal(messageId, userId, content, timestamp);
      }
      
    } catch (error) {
      logger.error('Failed to handle channel message:', error);
    }
  }

  /**
   * Check if a message is a valid pricing proposal
   */
  isPricingProposal(content) {
    try {
      // Look for pricing proposal indicators
      const proposalIndicators = [
        'pricing proposal',
        'price plan',
        'storage pricing',
        'tier pricing'
      ];
      
      const hasIndicator = proposalIndicators.some(indicator => 
        content.text?.toLowerCase().includes(indicator)
      );
      
      // Check for structured pricing data
      const hasPricingData = content.metadata?.pricingTiers || 
                            content.attachments?.some(att => att.type === 'pricing-table');
      
      return hasIndicator || hasPricingData;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Process a new pricing proposal from the channel
   */
  async processPricingProposal(messageId, userId, content, timestamp) {
    try {
      // Check cooldown period
      const lastProposal = this.userProposalHistory.get(userId);
      if (lastProposal && (timestamp - lastProposal) < this.config.proposalCooldown) {
        logger.warn(`User ${userId} tried to propose too soon (cooldown: ${this.config.proposalCooldown}ms)`);
        return;
      }
      
      // Parse pricing data from message
      const pricingData = this.parsePricingData(content);
      if (!pricingData) {
        logger.warn(`Invalid pricing data in proposal ${messageId}`);
        return;
      }
      
      // Validate pricing proposal
      if (!this.validatePricingProposal(pricingData)) {
        logger.warn(`Pricing proposal ${messageId} failed validation`);
        return;
      }
      
      // Create proposal record
      const proposal = {
        id: messageId,
        messageId,
        userId,
        content,
        pricingTiers: pricingData,
        createdAt: timestamp,
        expiresAt: timestamp + this.config.proposalLifetime,
        votes: { up: 0, down: 0 },
        rank: 0,
        status: 'active'
      };
      
      this.activePricingProposals.set(messageId, proposal);
      this.userProposalHistory.set(userId, timestamp);
      
      // Trigger ranking update
      await this.updateProposalRankings();
      
      this.emit('proposal-created', proposal);
      logger.info(`New pricing proposal created: ${messageId} by ${userId}`);
      
    } catch (error) {
      logger.error('Failed to process pricing proposal:', error);
    }
  }
  /**
   * Parse pricing data from message content
   */
  parsePricingData(content) {
    try {
      // Check for structured metadata first
      if (content.metadata?.pricingTiers) {
        return content.metadata.pricingTiers;
      }
      
      // Check for pricing table attachment
      const pricingAttachment = content.attachments?.find(att => att.type === 'pricing-table');
      if (pricingAttachment) {
        return pricingAttachment.data;
      }
      
      // Try to parse from text content
      const text = content.text || '';
      const pricingMatch = this.extractPricingFromText(text);
      
      return pricingMatch;
      
    } catch (error) {
      logger.error('Failed to parse pricing data:', error);
      return null;
    }
  }

  /**
   * Extract pricing information from text content
   */
  extractPricingFromText(text) {
    try {
      // Look for structured pricing patterns
      const patterns = {
        basic: /basic[:\s]+\$?([\d.]+)/i,
        secure: /secure[:\s]+\$?([\d.]+)/i,
        vault: /vault[:\s]+\$?([\d.]+)/i
      };
      
      const p2pPricing = {};
      const relayPricing = {};
      
      // Extract P2P pricing
      for (const [tier, pattern] of Object.entries(patterns)) {
        const match = text.match(new RegExp(`p2p.*?${pattern.source}`, 'i'));
        if (match) {
          p2pPricing[tier] = parseFloat(match[1]);
        }
      }
      
      // Extract Relay pricing
      for (const [tier, pattern] of Object.entries(patterns)) {
        const match = text.match(new RegExp(`relay.*?${pattern.source}`, 'i'));
        if (match) {
          relayPricing[tier] = parseFloat(match[1]);
        }
      }
      
      // If we have at least basic pricing for both types
      if (p2pPricing.basic && relayPricing.basic) {
        return {
          p2p: {
            basic: p2pPricing.basic,
            secure: p2pPricing.secure || p2pPricing.basic * 1.3,
            vault: p2pPricing.vault || p2pPricing.basic * 1.6
          },
          relay: {
            basic: relayPricing.basic,
            secure: relayPricing.secure || relayPricing.basic * 1.3,
            vault: relayPricing.vault || relayPricing.basic * 1.6
          }
        };
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate a pricing proposal
   */
  validatePricingProposal(pricingData) {
    try {
      if (!pricingData || !pricingData.p2p || !pricingData.relay) {
        return false;
      }
      
      const tiers = ['basic', 'secure', 'vault'];
      
      // Check all tiers exist and are valid numbers
      for (const tier of tiers) {
        const p2pPrice = pricingData.p2p[tier];
        const relayPrice = pricingData.relay[tier];
        
        if (!p2pPrice || !relayPrice || 
            typeof p2pPrice !== 'number' || typeof relayPrice !== 'number' ||
            p2pPrice <= 0 || relayPrice <= 0) {
          return false;
        }
        
        // Check price change limits vs current pricing
        const currentP2P = this.currentPricing.p2p[tier];
        const currentRelay = this.currentPricing.relay[tier];
        
        const p2pChange = Math.abs(p2pPrice - currentP2P) / currentP2P;
        const relayChange = Math.abs(relayPrice - currentRelay) / currentRelay;
        
        const maxChange = this.config.maxPriceChangePercent / 100;
        
        if (p2pChange > maxChange || relayChange > maxChange) {
          return false;
        }
        
        // Ensure relay pricing maintains reasonable premium
        const premium = relayPrice / p2pPrice;
        if (premium < 1.1 || premium > 3.0) {
          return false;
        }
      }
      
      return true;
      
    } catch (error) {
      return false;
    }
  }  /**
   * Handle votes on pricing proposals
   */
  async handleProposalVote(event) {
    try {
      const { messageId, userId, voteType, timestamp } = event;
      
      const proposal = this.activePricingProposals.get(messageId);
      if (!proposal) {
        return; // Not a pricing proposal
      }
      
      // Update vote counts (every user gets equal vote)
      if (voteType === 'up') {
        proposal.votes.up++;
      } else if (voteType === 'down') {
        proposal.votes.down++;
      }
      
      // Trigger ranking update
      await this.updateProposalRankings();
      
      this.emit('proposal-voted', { proposalId: messageId, userId, voteType });
      
    } catch (error) {
      logger.error('Failed to handle proposal vote:', error);
    }
  }

  /**
   * Update proposal rankings based on votes
   */
  async updateProposalRankings() {
    try {
      const now = Date.now();
      
      // Only update if enough time has passed since last update
      if (now - this.lastRankingUpdate < this.config.rankingUpdateInterval) {
        return;
      }
      
      const activeProposals = Array.from(this.activePricingProposals.values())
        .filter(proposal => 
          proposal.status === 'active' && 
          now - proposal.createdAt >= this.config.minProposalAge
        );
      
      // Calculate ranking scores for each proposal
      const rankedProposals = activeProposals.map(proposal => {
        const totalVotes = proposal.votes.up + proposal.votes.down;
        const upvoteRatio = totalVotes > 0 ? proposal.votes.up / totalVotes : 0;
        const confidence = Math.min(totalVotes / 100, 1); // Confidence grows with more votes
        
        // Simple ranking algorithm: upvote ratio weighted by confidence
        const score = upvoteRatio * confidence;
        
        return {
          ...proposal,
          score,
          rank: 0 // Will be set after sorting
        };
      }).sort((a, b) => b.score - a.score);
      
      // Assign ranks
      rankedProposals.forEach((proposal, index) => {
        proposal.rank = index + 1;
        this.activePricingProposals.set(proposal.id, proposal);
      });
      
      this.proposalRankings = rankedProposals.map(p => p.id);
      this.lastRankingUpdate = now;
      
      // Check if we need to update active pricing
      await this.checkForPricingUpdate(rankedProposals);
      
      this.emit('rankings-updated', this.proposalRankings);
      
    } catch (error) {
      logger.error('Failed to update proposal rankings:', error);
    }
  }

  /**
   * Check if the top-ranked proposal should become active pricing
   */
  async checkForPricingUpdate(rankedProposals) {
    try {
      if (rankedProposals.length === 0) {
        return;
      }
      
      const topProposal = rankedProposals[0];
      
      // Check if top proposal has enough support and age
      const minVotes = 50; // Minimum votes needed
      const minAge = 48 * 60 * 60 * 1000; // 48 hours minimum age
      const minRatio = 0.6; // 60% upvote ratio minimum
      
      const totalVotes = topProposal.votes.up + topProposal.votes.down;
      const upvoteRatio = totalVotes > 0 ? topProposal.votes.up / totalVotes : 0;
      const age = Date.now() - topProposal.createdAt;
      
      if (totalVotes >= minVotes && 
          upvoteRatio >= minRatio && 
          age >= minAge &&
          topProposal.rank === 1) {
        
        await this.activatePricingProposal(topProposal);
      }
      
    } catch (error) {
      logger.error('Failed to check for pricing update:', error);
    }
  }

  /**
   * Activate a pricing proposal as the current pricing
   */
  async activatePricingProposal(proposal) {
    try {
      const previousPricing = { ...this.currentPricing };
      
      // Update current pricing
      this.currentPricing = {
        p2p: { ...proposal.pricingTiers.p2p },
        relay: { ...proposal.pricingTiers.relay }
      };
      
      // Mark proposal as activated
      proposal.status = 'activated';
      proposal.activatedAt = Date.now();
      
      // Remove from active proposals
      this.activePricingProposals.delete(proposal.id);
      
      // Emit pricing update event
      this.emit('pricing-updated', {
        previousPricing,
        newPricing: this.currentPricing,
        proposal: proposal,
        timestamp: Date.now()
      });
      
      logger.info(`Activated pricing proposal ${proposal.id} - New pricing in effect`);
      
    } catch (error) {
      logger.error('Failed to activate pricing proposal:', error);
    }
  }  /**
   * Clean up expired proposals
   */
  async cleanupExpiredProposals() {
    try {
      const now = Date.now();
      const expired = [];
      
      for (const [proposalId, proposal] of this.activePricingProposals) {
        if (now > proposal.expiresAt) {
          expired.push(proposalId);
        }
      }
      
      for (const proposalId of expired) {
        const proposal = this.activePricingProposals.get(proposalId);
        proposal.status = 'expired';
        this.activePricingProposals.delete(proposalId);
        
        this.emit('proposal-expired', proposal);
      }
      
      if (expired.length > 0) {
        logger.info(`Cleaned up ${expired.length} expired proposals`);
        await this.updateProposalRankings();
      }
      
    } catch (error) {
      logger.error('Failed to cleanup expired proposals:', error);
    }
  }

  /**
   * Submit a new pricing proposal to the official channel
   */
  async submitPricingProposal(userId, proposalData) {
    try {
      // Check cooldown
      const lastProposal = this.userProposalHistory.get(userId);
      if (lastProposal && (Date.now() - lastProposal) < this.config.proposalCooldown) {
        throw new Error('Proposal cooldown period not met');
      }
      
      // Validate pricing data
      if (!this.validatePricingProposal(proposalData.pricingTiers)) {
        throw new Error('Invalid pricing data');
      }
      
      // Create message content
      const messageContent = {
        text: `🏷️ **Storage Pricing Proposal**\n\n${proposalData.description}\n\n` +
              `**P2P Pricing:**\n` +
              `• Basic: $${proposalData.pricingTiers.p2p.basic}/GB/month\n` +
              `• Secure: $${proposalData.pricingTiers.p2p.secure}/GB/month\n` +
              `• Vault: $${proposalData.pricingTiers.p2p.vault}/GB/month\n\n` +
              `**Relay Pricing:**\n` +
              `• Basic: $${proposalData.pricingTiers.relay.basic}/GB/month\n` +
              `• Secure: $${proposalData.pricingTiers.relay.secure}/GB/month\n` +
              `• Vault: $${proposalData.pricingTiers.relay.vault}/GB/month\n\n` +
              `*Vote up/down to support/oppose this pricing model*`,
        metadata: {
          type: 'pricing-proposal',
          pricingTiers: proposalData.pricingTiers
        },
        attachments: [{
          type: 'pricing-table',
          data: proposalData.pricingTiers
        }]
      };
      
      // Post to official channel
      const messageId = await this.channelService.postMessage(
        this.officialChannelId,
        userId,
        messageContent
      );
      
      logger.info(`Pricing proposal submitted by ${userId}: ${messageId}`);
      return messageId;
      
    } catch (error) {
      logger.error('Failed to submit pricing proposal:', error);
      throw error;
    }
  }

  /**
   * Get current pricing tiers
   */
  getCurrentPricing() {
    return {
      ...this.currentPricing,
      lastUpdated: this.lastPriceUpdate
    };
  }

  /**
   * Get active pricing proposals with rankings
   */
  getActiveProposals() {
    return Array.from(this.activePricingProposals.values())
      .sort((a, b) => a.rank - b.rank);
  }

  /**
   * Get proposal by ID
   */
  getProposal(proposalId) {
    return this.activePricingProposals.get(proposalId);
  }

  /**
   * Get governance statistics
   */
  getGovernanceStats() {
    const proposals = Array.from(this.activePricingProposals.values());
    
    return {
      activeProposals: proposals.length,
      totalVotes: proposals.reduce((sum, p) => sum + p.votes.up + p.votes.down, 0),
      topRankedProposal: proposals.find(p => p.rank === 1) || null,
      lastRankingUpdate: this.lastRankingUpdate,
      channelId: this.officialChannelId
    };
  }
}
        reason = `Democratic majority: ${supportVotes} support vs ${opposeVotes} oppose (${approvalRate.toFixed(1)}% approval)`;
      } else if (opposeVotes > supportVotes) {
        const rejectionRate = (opposeVotes / totalVotes) * 100;
        reason = `Democratic majority rejected: ${opposeVotes} oppose vs ${supportVotes} support (${rejectionRate.toFixed(1)}% rejection)`;
      } else {
        reason = `Tie vote: ${supportVotes} support vs ${opposeVotes} oppose - proposal fails`;
      }
    }
    
    proposal.status = passed ? 'passed' : 'failed';
    proposal.finalizedAt = Date.now();
    proposal.finalReason = reason;
    
    if (passed) {
      await this.executePricingChange(proposal);
    }
    
    // Archive the proposal
    this.votingHistory.push({
      ...proposal,
      participationRate,
      quorumMet,
      supportVotes,
      opposeVotes,
      totalVotes
    });
    
    this.emit('proposal-finalized', { proposalId, passed, reason });
    logger.info(`Proposal ${proposalId} ${passed ? 'PASSED' : 'FAILED'}: ${reason}`);
  }

  /**
   * Get market signal for proposed pricing
   */
  getMarketSignal(proposedPricing) {
    const current = this.currentPricing;
    const market = this.marketData;
    
    let signal = 0.5; // Neutral starting point
    
    // If utilization is high, price increases get positive signal
    if (market.utilizationRate > this.config.highDemandThreshold) {
      // Market wants higher prices
      for (const tier of ['basic', 'secure', 'vault']) {
        for (const type of ['p2p', 'relay']) {
          if (proposedPricing[type][tier] > current[type][tier]) {
            signal += 0.1; // Positive signal for price increases
          }
        }
      }
    }
    
    // If utilization is low, price decreases get positive signal  
    if (market.utilizationRate < this.config.lowDemandThreshold) {
      // Market wants lower prices
      for (const tier of ['basic', 'secure', 'vault']) {
        for (const type of ['p2p', 'relay']) {
          if (proposedPricing[type][tier] < current[type][tier]) {
            signal += 0.1; // Positive signal for price decreases
          }
        }
      }
    }
    
    // Factor in provider count (fewer providers = need higher prices to incentivize)
    if (market.providerCount.p2p < 10) {
      signal += 0.1; // Boost signal for attracting more providers
    }
    
    // Factor in user satisfaction
    if (market.userSatisfactionScore < 0.7) {
      signal -= 0.1; // Negative signal if users are unhappy
    }
    
    return Math.max(0, Math.min(1, signal));
  }

  /**
   * Execute approved pricing change
   */
  async executePricingChange(proposal) {
    const oldPricing = JSON.parse(JSON.stringify(this.currentPricing));
    this.currentPricing = JSON.parse(JSON.stringify(proposal.proposedPricing));
    this.lastPriceUpdate = Date.now();
    
    proposal.executed = true;
    proposal.executedAt = Date.now();
    
    this.emit('pricing-updated', {
      oldPricing,
      newPricing: this.currentPricing,
      proposalId: proposal.id,
      effectiveAt: Date.now()
    });
    
    logger.info(`Executed pricing change from proposal ${proposal.id}`);
    
    // Log the changes
    for (const tier of ['basic', 'secure', 'vault']) {
      for (const type of ['p2p', 'relay']) {
        const oldPrice = oldPricing[type][tier];
        const newPrice = this.currentPricing[type][tier];
        const change = ((newPrice - oldPrice) / oldPrice * 100).toFixed(1);
        logger.info(`  ${type}.${tier}: $${oldPrice.toFixed(2)} → $${newPrice.toFixed(2)} (${change > 0 ? '+' : ''}${change}%)`);
      }
    }
  }

  /**
   * Collect market metrics for automatic corrections
   */
  async collectMarketMetrics() {
    // This would integrate with the storage registry and broker
    // For now, we'll simulate some market data
    
    const timestamp = Date.now();
    
    // Simulate market conditions
    this.marketData = {
      totalCapacityOffered: Math.random() * 1000 + 500, // 500-1500 GB
      totalCapacityDemanded: Math.random() * 800 + 200,  // 200-1000 GB
      utilizationRate: 0.3 + Math.random() * 0.5, // 30-80%
      providerCount: { 
        p2p: Math.floor(Math.random() * 20) + 5,     // 5-25 providers
        relay: 3 // Fixed relay infrastructure
      },
      averageResponseTime: Math.random() * 1000 + 100, // 100-1100ms
      failureRate: Math.random() * 0.1, // 0-10%
      userSatisfactionScore: 0.5 + Math.random() * 0.4 // 50-90%
    };
      this.marketMetrics.set(timestamp, { ...this.marketData });
    
    // Keep only last 24 hours of data
    const dayAgo = timestamp - (24 * 60 * 60 * 1000);
    for (const [time] of this.marketMetrics) {
      if (time < dayAgo) {
        this.marketMetrics.delete(time);
      }
    }
  }

  /**
   * Market corrections disabled - only democratic votes change prices
   * This method now only provides market information for voter awareness
   */
  async applyMarketCorrections() {
    // No automatic price adjustments - free market democracy decides
    // Market data is still collected and available for voters to consider
    const market = this.marketData;
    
    // Log market information for transparency, but don't change prices
    logger.info('Market data collected for voter transparency - no automatic pricing changes');
    
    // Emit market data for UI display
    this.emit('market-info-updated', {
      utilizationRate: market.utilizationRate,
      providerCount: market.providerCount,
      userSatisfactionScore: market.userSatisfactionScore,
      timestamp: Date.now(),
      message: 'Market data for voter information only'
    });
  }
}

export default StoragePricingGovernance;
