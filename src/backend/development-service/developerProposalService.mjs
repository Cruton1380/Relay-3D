/**
 * @fileoverview Developer Proposal Service
 * Manages channel upgrades, bounties, and development proposals
 */
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logging/logger.mjs';
import { notificationManager } from '../notifications/notificationManager.mjs';

const proposalLogger = logger.child({ module: 'dev-proposals' });

class DeveloperProposalService {
  constructor() {
    this.proposals = new Map(); // proposalId -> DevProposal
    this.donations = new Map(); // donationId -> ChannelDonation
    this.channelProposals = new Map(); // channelId -> Set<proposalId>
    this.userVotes = new Map(); // userId -> Set<proposalId>
    this.proposalVotes = new Map(); // proposalId -> Set<userId>
    this.channelDonations = new Map(); // channelId -> number (total donations)
    this.founderChannelId = 'founder-relay-development';
    this.founderUserId = null; // Set during initialization
    
    // Bounty settings
    this.maxBountyAmount = 1000000; // 1M sats max
    this.proposalExpiryDays = 30;
    this.minVotesForNotification = 5;
  }

  /**
   * Initialize the service
   */
  async initialize(founderUserId) {
    this.founderUserId = founderUserId;
    
    // Create founder development channel if it doesn't exist
    await this.createFounderChannel();
    
    proposalLogger.info('Developer Proposal Service initialized');
  }

  /**
   * Create the founder development channel
   */
  async createFounderChannel() {
    const founderChannel = {
      id: this.founderChannelId,
      name: 'Founder: Relay Development',
      description: 'Global Relay upgrades, core development, and platform improvements',
      type: 'founder',
      ownerId: this.founderUserId,
      createdAt: new Date(),
      isPublic: true,
      canPropose: true,
      requireVerification: true
    };

    // Store channel info (integrate with channel service)
    proposalLogger.info('Founder development channel created', { channelId: this.founderChannelId });
  }

  /**
   * Submit a development proposal
   */
  async submitProposal(proposalData) {
    const {
      channelId,
      creatorId,
      type,
      description,
      attachments = [],
      requestedAmount,
      githubPR,
      artifactHash
    } = proposalData;

    // Validation
    if (!channelId || !creatorId || !description) {
      throw new Error('Missing required proposal fields');
    }

    if (requestedAmount > this.maxBountyAmount) {
      throw new Error(`Bounty amount exceeds maximum (${this.maxBountyAmount} sats)`);
    }

    // Check if user can propose to this channel
    const canPropose = await this.canUserPropose(creatorId, channelId);
    if (!canPropose.allowed) {
      throw new Error(canPropose.reason);
    }

    const proposalId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.proposalExpiryDays);

    const proposal = {
      id: proposalId,
      channelId,
      creatorId,
      type: type || 'Functionality',
      description,
      attachments,
      requestedAmount: requestedAmount || 0,
      currentDonations: 0,
      votes: [],
      githubPR,
      artifactHash,
      status: 'pending',
      approvedByOwner: false,
      payoutTxId: null,
      createdAt: new Date(),
      expiresAt,
      feedback: []
    };

    // Store proposal
    this.proposals.set(proposalId, proposal);
    
    // Add to channel proposals
    if (!this.channelProposals.has(channelId)) {
      this.channelProposals.set(channelId, new Set());
    }
    this.channelProposals.get(channelId).add(proposalId);

    // Initialize voting
    this.proposalVotes.set(proposalId, new Set());

    // Notify channel owner
    await this.notifyChannelOwner(channelId, proposalId);

    proposalLogger.info('Proposal submitted', { 
      proposalId, 
      channelId, 
      creatorId, 
      type,
      requestedAmount 
    });

    return proposal;
  }

  /**
   * Check if user can propose to a channel
   */
  async canUserPropose(userId, channelId) {
    // For founder channel, require verification
    if (channelId === this.founderChannelId) {
      // Check if user is verified (integrate with user service)
      return { allowed: true, reason: null };
    }

    // For regular channels, check channel settings
    return { allowed: true, reason: null };
  }

  /**
   * Vote on a proposal
   */
  async voteOnProposal(proposalId, userId, voteType = 'support') {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'pending') {
      throw new Error('Cannot vote on closed proposal');
    }

    const userVotes = this.userVotes.get(userId) || new Set();
    const proposalVoters = this.proposalVotes.get(proposalId) || new Set();

    if (voteType === 'support') {
      // Add vote
      userVotes.add(proposalId);
      proposalVoters.add(userId);
      proposal.votes.push(userId);
    } else if (voteType === 'remove') {
      // Remove vote
      userVotes.delete(proposalId);
      proposalVoters.delete(userId);
      proposal.votes = proposal.votes.filter(id => id !== userId);
    }

    this.userVotes.set(userId, userVotes);
    this.proposalVotes.set(proposalId, proposalVoters);

    // Check if proposal reached notification threshold
    if (proposal.votes.length >= this.minVotesForNotification) {
      await this.notifyChannelOwner(proposal.channelId, proposalId, 'popular');
    }

    proposalLogger.info('Proposal vote cast', { 
      proposalId, 
      userId, 
      voteType,
      totalVotes: proposal.votes.length 
    });

    return {
      success: true,
      totalVotes: proposal.votes.length,
      userVoted: proposalVoters.has(userId)
    };
  }

  /**
   * Donate to a channel or specific proposal
   */
  async processDonation(donationData) {
    const {
      channelId,
      donorId,
      amount,
      currency,
      proposalId,
      paymentProof,
      walletAddress
    } = donationData;

    // Validation
    if (!channelId || !donorId || !amount || !currency) {
      throw new Error('Missing required donation fields');
    }

    if (amount <= 0) {
      throw new Error('Invalid donation amount');
    }

    // Verify payment proof (integrate with wallet service)
    const paymentVerified = await this.verifyPayment(paymentProof, amount, currency, walletAddress);
    if (!paymentVerified) {
      throw new Error('Payment verification failed');
    }

    const donationId = crypto.randomUUID();
    const donation = {
      id: donationId,
      channelId,
      donorId,
      amount,
      currency,
      proposalId,
      paymentProof,
      timestamp: new Date(),
      status: 'confirmed'
    };

    // Store donation
    this.donations.set(donationId, donation);

    // Update channel total donations
    const currentTotal = this.channelDonations.get(channelId) || 0;
    this.channelDonations.set(channelId, currentTotal + amount);

    // Update proposal donations if specified
    if (proposalId) {
      const proposal = this.proposals.get(proposalId);
      if (proposal) {
        proposal.currentDonations += amount;
      }
    }

    // Notify relevant parties
    await this.notifyDonation(channelId, donationId, proposalId);

    proposalLogger.info('Donation processed', { 
      donationId, 
      channelId, 
      donorId, 
      amount, 
      currency,
      proposalId 
    });

    return donation;
  }

  /**
   * Channel owner approve/reject proposal
   */
  async reviewProposal(proposalId, ownerId, action, feedback = '') {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Verify ownership
    const isOwner = await this.verifyChannelOwnership(proposal.channelId, ownerId);
    if (!isOwner) {
      throw new Error('Not authorized to review this proposal');
    }

    if (action === 'approve') {
      proposal.status = 'approved';
      proposal.approvedByOwner = true;
      proposal.feedback.push({
        type: 'approval',
        message: feedback,
        timestamp: new Date(),
        authorId: ownerId
      });

      // Process payout if bounty exists
      if (proposal.currentDonations > 0) {
        await this.processBountyPayout(proposalId);
      }

    } else if (action === 'reject') {
      proposal.status = 'rejected';
      proposal.feedback.push({
        type: 'rejection',
        message: feedback,
        timestamp: new Date(),
        authorId: ownerId
      });

      // Refund donations if configured
      await this.processBountyRefund(proposalId);

    } else if (action === 'request_changes') {
      proposal.feedback.push({
        type: 'change_request',
        message: feedback,
        timestamp: new Date(),
        authorId: ownerId
      });
    }

    // Notify proposal creator
    await this.notifyProposalCreator(proposalId, action, feedback);

    proposalLogger.info('Proposal reviewed', { 
      proposalId, 
      ownerId, 
      action,
      status: proposal.status 
    });

    return proposal;
  }

  /**
   * Founder-only approval for global proposals
   */
  async founderReviewProposal(proposalId, founderId, action, signature = null) {
    if (founderId !== this.founderUserId) {
      throw new Error('Only founder can review global proposals');
    }

    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.channelId !== this.founderChannelId) {
      throw new Error('Not a global proposal');
    }

    if (action === 'approve' && signature) {
      proposal.status = 'approved';
      proposal.founderSignature = signature;
      proposal.canonicalApproval = true;
      
      // Mark as official Relay update
      proposal.isCanonical = true;
      proposal.versionTag = `v${Date.now()}`;
    }

    return await this.reviewProposal(proposalId, founderId, action);
  }

  /**
   * Get proposals for a channel
   */
  getChannelProposals(channelId, options = {}) {
    const {
      status = null,
      sortBy = 'votes', // 'votes', 'donations', 'recent'
      limit = 50,
      offset = 0
    } = options;

    const proposalIds = this.channelProposals.get(channelId) || new Set();
    let proposals = Array.from(proposalIds).map(id => this.proposals.get(id)).filter(Boolean);

    // Filter by status
    if (status) {
      proposals = proposals.filter(p => p.status === status);
    }

    // Sort proposals
    proposals.sort((a, b) => {
      switch (sortBy) {
        case 'votes':
          return b.votes.length - a.votes.length;
        case 'donations':
          return b.currentDonations - a.currentDonations;
        case 'recent':
          return b.createdAt - a.createdAt;
        default:
          return b.votes.length - a.votes.length;
      }
    });

    // Paginate
    const paginatedProposals = proposals.slice(offset, offset + limit);

    return {
      proposals: paginatedProposals,
      total: proposals.length,
      hasMore: offset + limit < proposals.length
    };
  }

  /**
   * Get channel donation statistics
   */
  getChannelStats(channelId) {
    const proposals = this.getChannelProposals(channelId).proposals;
    const totalDonations = this.channelDonations.get(channelId) || 0;
    
    return {
      totalDonations,
      totalProposals: proposals.length,
      approvedProposals: proposals.filter(p => p.status === 'approved').length,
      pendingProposals: proposals.filter(p => p.status === 'pending').length,
      totalBounties: proposals.reduce((sum, p) => sum + p.currentDonations, 0),
      topProposal: proposals[0] || null
    };
  }

  /**
   * Verify payment (integrate with wallet service)
   */
  async verifyPayment(paymentProof, amount, currency, walletAddress) {
    // This would integrate with actual payment verification
    // For now, return true for valid-looking proofs
    return paymentProof && paymentProof.length > 10;
  }

  /**
   * Verify channel ownership
   */
  async verifyChannelOwnership(channelId, userId) {
    // This would integrate with channel service
    if (channelId === this.founderChannelId) {
      return userId === this.founderUserId;
    }
    return true; // Placeholder
  }

  /**
   * Process bounty payout
   */
  async processBountyPayout(proposalId) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.currentDonations <= 0) {
      return;
    }

    // Generate payout transaction (integrate with wallet service)
    const txId = `payout_${crypto.randomUUID()}`;
    proposal.payoutTxId = txId;
    proposal.payoutDate = new Date();

    proposalLogger.info('Bounty payout processed', { 
      proposalId, 
      amount: proposal.currentDonations,
      txId 
    });
  }

  /**
   * Process bounty refund
   */
  async processBountyRefund(proposalId) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.currentDonations <= 0) {
      return;
    }

    // Process refunds to original donors
    const proposalDonations = Array.from(this.donations.values())
      .filter(d => d.proposalId === proposalId);

    for (const donation of proposalDonations) {
      // Generate refund transaction (integrate with wallet service)
      const refundTxId = `refund_${crypto.randomUUID()}`;
      donation.refundTxId = refundTxId;
    }

    proposal.refundProcessed = true;
    proposal.refundDate = new Date();

    proposalLogger.info('Bounty refund processed', { 
      proposalId, 
      amount: proposal.currentDonations 
    });
  }

  /**
   * Notify channel owner of new proposal
   */
  async notifyChannelOwner(channelId, proposalId, reason = 'new') {
    try {
      const proposal = this.proposals.get(proposalId);
      if (!proposal) return;

      let message;
      switch (reason) {
        case 'popular':
          message = `Proposal "${proposal.description.substring(0, 50)}..." has received ${proposal.votes.length} votes`;
          break;
        default:
          message = `New ${proposal.type.toLowerCase()} proposal submitted: "${proposal.description.substring(0, 50)}..."`;
      }

      await notificationManager.createNotification({
        type: 'proposal',
        recipientId: 'channel_owner', // Would be actual owner ID
        title: 'Channel Proposal',
        message,
        data: { proposalId, channelId, reason }
      });
    } catch (error) {
      proposalLogger.error('Failed to notify channel owner', { error: error.message });
    }
  }

  /**
   * Notify about donation
   */
  async notifyDonation(channelId, donationId, proposalId) {
    try {
      const donation = this.donations.get(donationId);
      if (!donation) return;

      const message = proposalId 
        ? `New bounty contribution: ${donation.amount} ${donation.currency}`
        : `New channel donation: ${donation.amount} ${donation.currency}`;

      await notificationManager.createNotification({
        type: 'donation',
        recipientId: 'channel_owner',
        title: 'Donation Received',
        message,
        data: { donationId, channelId, proposalId }
      });
    } catch (error) {
      proposalLogger.error('Failed to notify donation', { error: error.message });
    }
  }

  /**
   * Notify proposal creator
   */
  async notifyProposalCreator(proposalId, action, feedback) {
    try {
      const proposal = this.proposals.get(proposalId);
      if (!proposal) return;

      let message;
      switch (action) {
        case 'approve':
          message = `Your proposal has been approved! ${feedback}`;
          break;
        case 'reject':
          message = `Your proposal was not accepted. ${feedback}`;
          break;
        case 'request_changes':
          message = `Changes requested for your proposal: ${feedback}`;
          break;
        default:
          message = `Your proposal status has been updated.`;
      }

      await notificationManager.createNotification({
        type: 'proposal_update',
        recipientId: proposal.creatorId,
        title: 'Proposal Update',
        message,
        data: { proposalId, action }
      });
    } catch (error) {
      proposalLogger.error('Failed to notify proposal creator', { error: error.message });
    }
  }

  /**
   * Clean up expired proposals
   */
  async cleanupExpiredProposals() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [proposalId, proposal] of this.proposals) {
      if (proposal.expiresAt && proposal.expiresAt < now && proposal.status === 'pending') {
        proposal.status = 'expired';
        
        // Process refunds for expired proposals
        if (proposal.currentDonations > 0) {
          await this.processBountyRefund(proposalId);
        }
        
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      proposalLogger.info('Cleaned up expired proposals', { count: cleanedCount });
    }
  }
}

export default new DeveloperProposalService();
