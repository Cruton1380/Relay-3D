/**
 * @fileoverview Development Service API Routes
 * Handles developer proposals, bounties, and channel donations
 */
import express from 'express';
import multer from 'multer';
import path from 'path';
import developerProposalService from '../development-service/developerProposalService.mjs';
import logger from '../utils/logging/logger.mjs';

const router = express.Router();
const developmentLogger = logger.child({ module: 'development-api' });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/proposals/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files per proposal
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, documents, and code files
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|pdf|doc|docx|zip|js|jsx|ts|tsx|css|html|md/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

/**
 * Submit a development proposal
 * POST /api/development/proposals
 */
router.post('/proposals', upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      channelId,
      type,
      description,
      requestedAmount,
      githubPR,
      artifactHash
    } = req.body;

    const creatorId = req.user?.id;
    if (!creatorId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Process uploaded files
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype
    })) : [];

    const proposalData = {
      channelId,
      creatorId,
      type,
      description,
      attachments,
      requestedAmount: parseInt(requestedAmount) || 0,
      githubPR,
      artifactHash
    };

    const proposal = await developerProposalService.submitProposal(proposalData);

    developmentLogger.info('Proposal submitted via API', { 
      proposalId: proposal.id,
      creatorId,
      channelId 
    });

    res.json({
      success: true,
      proposal
    });

  } catch (error) {
    developmentLogger.error('Failed to submit proposal', { 
      error: error.message,
      userId: req.user?.id 
    });
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get proposals for a channel
 * GET /api/development/channels/:channelId/proposals
 */
router.get('/channels/:channelId/proposals', async (req, res) => {
  try {
    const { channelId } = req.params;
    const {
      status,
      sortBy = 'votes',
      limit = 20,
      offset = 0
    } = req.query;

    const options = {
      status,
      sortBy,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const result = await developerProposalService.getChannelProposals(channelId, options);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    developmentLogger.error('Failed to get channel proposals', { 
      error: error.message,
      channelId: req.params.channelId 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get a specific proposal
 * GET /api/development/proposals/:proposalId
 */
router.get('/proposals/:proposalId', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const proposal = developerProposalService.proposals.get(proposalId);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    res.json({
      success: true,
      proposal
    });

  } catch (error) {
    developmentLogger.error('Failed to get proposal', { 
      error: error.message,
      proposalId: req.params.proposalId 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Vote on a proposal
 * POST /api/development/proposals/:proposalId/vote
 */
router.post('/proposals/:proposalId/vote', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { voteType = 'support' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await developerProposalService.voteOnProposal(proposalId, userId, voteType);

    developmentLogger.info('Vote cast on proposal', { 
      proposalId,
      userId,
      voteType 
    });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    developmentLogger.error('Failed to vote on proposal', { 
      error: error.message,
      proposalId: req.params.proposalId,
      userId: req.user?.id 
    });
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Process a donation
 * POST /api/development/donations
 */
router.post('/donations', async (req, res) => {
  try {
    const {
      channelId,
      amount,
      currency,
      proposalId,
      paymentProof,
      walletAddress
    } = req.body;

    const donorId = req.user?.id;
    if (!donorId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const donationData = {
      channelId,
      donorId,
      amount: parseFloat(amount),
      currency,
      proposalId,
      paymentProof,
      walletAddress
    };

    const donation = await developerProposalService.processDonation(donationData);

    developmentLogger.info('Donation processed via API', { 
      donationId: donation.id,
      donorId,
      amount,
      currency 
    });

    res.json({
      success: true,
      donation
    });

  } catch (error) {
    developmentLogger.error('Failed to process donation', { 
      error: error.message,
      userId: req.user?.id 
    });
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Review a proposal (channel owner only)
 * POST /api/development/proposals/:proposalId/review
 */
router.post('/proposals/:proposalId/review', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { action, feedback = '' } = req.body;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!['approve', 'reject', 'request_changes'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action'
      });
    }

    const proposal = await developerProposalService.reviewProposal(proposalId, ownerId, action, feedback);

    developmentLogger.info('Proposal reviewed', { 
      proposalId,
      ownerId,
      action 
    });

    res.json({
      success: true,
      proposal
    });

  } catch (error) {
    developmentLogger.error('Failed to review proposal', { 
      error: error.message,
      proposalId: req.params.proposalId,
      userId: req.user?.id 
    });
    
    res.status(403).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Founder review for global proposals
 * POST /api/development/proposals/:proposalId/founder-review
 */
router.post('/proposals/:proposalId/founder-review', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { action, signature } = req.body;
    const founderId = req.user?.id;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const proposal = await developerProposalService.founderReviewProposal(proposalId, founderId, action, signature);

    developmentLogger.info('Global proposal reviewed by founder', { 
      proposalId,
      founderId,
      action 
    });

    res.json({
      success: true,
      proposal
    });

  } catch (error) {
    developmentLogger.error('Failed to founder review proposal', { 
      error: error.message,
      proposalId: req.params.proposalId,
      userId: req.user?.id 
    });
    
    res.status(403).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get channel statistics
 * GET /api/development/channels/:channelId/stats
 */
router.get('/channels/:channelId/stats', async (req, res) => {
  try {
    const { channelId } = req.params;
    const stats = developerProposalService.getChannelStats(channelId);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    developmentLogger.error('Failed to get channel stats', { 
      error: error.message,
      channelId: req.params.channelId 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get user's proposals
 * GET /api/development/user/proposals
 */
router.get('/user/proposals', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userProposals = Array.from(developerProposalService.proposals.values())
      .filter(proposal => proposal.creatorId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      proposals: userProposals
    });

  } catch (error) {
    developmentLogger.error('Failed to get user proposals', { 
      error: error.message,
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get user's donations
 * GET /api/development/user/donations
 */
router.get('/user/donations', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userDonations = Array.from(developerProposalService.donations.values())
      .filter(donation => donation.donorId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      donations: userDonations
    });

  } catch (error) {
    developmentLogger.error('Failed to get user donations', { 
      error: error.message,
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get founder development channel
 * GET /api/development/founder-channel
 */
router.get('/founder-channel', async (req, res) => {
  try {
    const channelId = developerProposalService.founderChannelId;
    const result = await developerProposalService.getChannelProposals(channelId, {
      sortBy: 'votes',
      limit: 50
    });

    res.json({
      success: true,
      channelId,
      ...result
    });

  } catch (error) {
    developmentLogger.error('Failed to get founder channel', { 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
