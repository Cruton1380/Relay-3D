/**
 * Boundary Proposals API
 * Stage 1: Democratic Geographic System
 * 
 * Provides endpoints for creating, voting on, and managing boundary proposals
 */

import express from 'express';
import regionalGovernanceService from '../services/regionalGovernanceService.mjs';
import logger from '../utils/logging/logger.mjs';

const router = express.Router();
const apiLogger = logger.child({ module: 'boundary-proposals-api' });

/**
 * GET /api/boundary-proposals
 * List all boundary proposals with optional filters
 */
router.get('/', (req, res) => {
    try {
        const { status, regionId, bundleId } = req.query;
        
        const proposals = regionalGovernanceService.getActiveProposals({
            status,
            regionId,
            bundleId
        });
        
        apiLogger.debug(`Fetched ${proposals.length} proposals with filters:`, { status, regionId, bundleId });
        
        res.json({
            success: true,
            proposals,
            count: proposals.length
        });
    } catch (error) {
        apiLogger.error('Error fetching proposals:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/boundary-proposals/:id
 * Get a specific proposal by ID
 */
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const proposals = regionalGovernanceService.loadBoundaryProposals();
        const proposal = proposals.boundaryProposals.find(p => p.id === id);
        
        if (!proposal) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }
        
        // Get related votes
        const votes = proposals.activeVotes?.filter(v => v.proposalId === id) || [];
        
        res.json({
            success: true,
            proposal,
            votes: votes.length,
            voteDetails: votes
        });
    } catch (error) {
        apiLogger.error('Error fetching proposal:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/boundary-proposals
 * Create a new boundary proposal
 */
router.post('/', async (req, res) => {
    try {
        const proposalData = req.body;
        
        // Validate required fields
        if (!proposalData.title || !proposalData.description || !proposalData.proposedBoundary) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: title, description, proposedBoundary'
            });
        }
        
        if (!proposalData.regionType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: regionType (country, state, metro, or city)'
            });
        }
        
        if (!proposalData.action) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: action (create, modify, split, or merge)'
            });
        }
        
        // Validate GeoJSON boundary
        if (!proposalData.proposedBoundary.type || !proposalData.proposedBoundary.coordinates) {
            return res.status(400).json({
                success: false,
                error: 'Invalid GeoJSON boundary format'
            });
        }
        
        const proposal = await regionalGovernanceService.createBoundaryProposal(proposalData);
        
        apiLogger.info(`Created boundary proposal: ${proposal.id}`, {
            title: proposal.title,
            regionType: proposal.regionType,
            action: proposal.action
        });
        
        res.status(201).json({
            success: true,
            proposal,
            message: 'Boundary proposal created successfully'
        });
    } catch (error) {
        apiLogger.error('Error creating proposal:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/boundary-proposals/bundle
 * Create a bundle of proposals (multi-segment borders)
 */
router.post('/bundle', async (req, res) => {
    try {
        const bundleData = req.body;
        
        if (!bundleData.segments || !Array.isArray(bundleData.segments)) {
            return res.status(400).json({
                success: false,
                error: 'Missing or invalid segments array'
            });
        }
        
        if (bundleData.segments.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Bundle must contain at least one segment'
            });
        }
        
        // Validate each segment
        for (let i = 0; i < bundleData.segments.length; i++) {
            const segment = bundleData.segments[i];
            if (!segment.title || !segment.description || !segment.proposedBoundary) {
                return res.status(400).json({
                    success: false,
                    error: `Segment ${i + 1} is missing required fields`
                });
            }
        }
        
        const result = await regionalGovernanceService.createBundleProposal(bundleData);
        
        apiLogger.info(`Created bundle proposal: ${result.bundleId}`, {
            totalSegments: result.totalCount
        });
        
        res.status(201).json({
            success: true,
            bundleId: result.bundleId,
            proposals: result.proposals,
            totalCount: result.totalCount,
            message: `Created bundle with ${result.totalCount} proposals`
        });
    } catch (error) {
        apiLogger.error('Error creating bundle proposal:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/boundary-proposals/:id/vote
 * Vote on a boundary proposal
 */
router.post('/:id/vote', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, voteValue, voterContext } = req.body;
        
        if (!userId || !voteValue || !voterContext) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, voteValue, voterContext'
            });
        }
        
        if (!['for', 'against', 'abstain'].includes(voteValue)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid vote value. Must be: for, against, or abstain'
            });
        }
        
        if (!voterContext.regionId) {
            return res.status(400).json({
                success: false,
                error: 'voterContext must include regionId'
            });
        }
        
        const result = await regionalGovernanceService.voteOnProposal(
            id,
            userId,
            voteValue,
            voterContext
        );
        
        apiLogger.info(`Vote recorded: ${result.vote.id}`, {
            proposalId: id,
            userId,
            voteValue,
            weight: result.vote.weight
        });
        
        res.json({
            success: true,
            vote: result.vote,
            proposal: result.proposal,
            message: 'Vote recorded successfully'
        });
    } catch (error) {
        apiLogger.error('Error recording vote:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/boundary-proposals/:id/approve
 * Approve a proposal and apply changes (evaluates votes)
 */
router.post('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await regionalGovernanceService.approveProposal(id);
        
        if (result.approved) {
            apiLogger.info(`Proposal approved: ${id}`, {
                approvalRate: result.approvalRate
            });
        } else {
            apiLogger.info(`Proposal rejected: ${id}`, {
                approvalRate: result.approvalRate
            });
        }
        
        res.json({
            success: true,
            approved: result.approved,
            proposal: result.proposal,
            approvalRate: result.approvalRate ? (result.approvalRate * 100).toFixed(1) + '%' : 'N/A',
            message: result.approved 
                ? 'Proposal approved and boundary updated' 
                : 'Proposal rejected due to insufficient votes'
        });
    } catch (error) {
        apiLogger.error('Error approving proposal:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/boundary-proposals/bundle/:bundleId
 * Get all proposals in a bundle
 */
router.get('/bundle/:bundleId', (req, res) => {
    try {
        const { bundleId } = req.params;
        
        const proposals = regionalGovernanceService.getActiveProposals({
            bundleId
        });
        
        if (proposals.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Bundle not found'
            });
        }
        
        // Sort by sequence
        proposals.sort((a, b) => a.bundleSequence - b.bundleSequence);
        
        res.json({
            success: true,
            bundleId,
            proposals,
            totalCount: proposals.length
        });
    } catch (error) {
        apiLogger.error('Error fetching bundle:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/boundary-proposals/:id
 * Delete a proposal (only if no votes yet)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const proposalsData = regionalGovernanceService.loadBoundaryProposals();
        const proposalIndex = proposalsData.boundaryProposals.findIndex(p => p.id === id);
        
        if (proposalIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }
        
        const proposal = proposalsData.boundaryProposals[proposalIndex];
        
        // Can only delete if no votes
        if (proposal.voters.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete proposal with existing votes'
            });
        }
        
        // Remove proposal
        proposalsData.boundaryProposals.splice(proposalIndex, 1);
        regionalGovernanceService.saveBoundaryProposals(proposalsData);
        
        apiLogger.info(`Deleted proposal: ${id}`);
        
        res.json({
            success: true,
            message: 'Proposal deleted successfully'
        });
    } catch (error) {
        apiLogger.error('Error deleting proposal:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
