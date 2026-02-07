/**
 * Regional Governance API Routes
 * Handles regional elections, multi-sig governance, boundaries, and parameters
 */
import express from 'express';
import { authenticate as authMiddleware } from '../middleware/auth.mjs';
import logger from '../utils/logging/logger.mjs';

// Import regional services
import regionalGovernanceService from '../services/regionalGovernanceService.mjs';
import regionalElectionService from '../services/regionalElectionService.mjs';
import regionalMultiSigService from '../services/regionalMultiSigService.mjs';

const router = express.Router();
const regionalLogger = logger.child({ module: 'regional-api' });

// ========================================
// REGIONAL BOUNDARIES & PARAMETERS
// ========================================

/**
 * Get all regions
 */
router.get('/regions', async (req, res) => {
    try {
        const regions = regionalGovernanceService.getRegions();
        res.json({ success: true, regions });
    } catch (error) {
        regionalLogger.error('Error getting regions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get specific region information
 */
router.get('/regions/:regionId', async (req, res) => {
    try {
        const { regionId } = req.params;
        const region = regionalGovernanceService.getRegion(regionId);
        
        if (!region) {
            return res.status(404).json({ success: false, error: 'Region not found' });
        }

        res.json({ success: true, region });
    } catch (error) {
        regionalLogger.error('Error getting region:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get regional parameters
 */
router.get('/regions/:regionId/parameters', async (req, res) => {
    try {
        const { regionId } = req.params;
        const parameters = regionalGovernanceService.getRegionParameters(regionId);
        res.json({ success: true, parameters });
    } catch (error) {
        regionalLogger.error('Error getting regional parameters:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Propose parameter change
 */
router.post('/regions/:regionId/parameters/propose', authMiddleware, async (req, res) => {
    try {
        const { regionId } = req.params;
        const { parameter, newValue, reasoning } = req.body;
        const userId = req.user.id;

        if (!parameter || newValue === undefined || !reasoning) {
            return res.status(400).json({ 
                success: false, 
                error: 'Parameter, newValue, and reasoning are required' 
            });
        }

        const result = await regionalGovernanceService.proposeParameterChange(
            regionId, parameter, newValue, userId, reasoning
        );

        res.json(result);
    } catch (error) {
        regionalLogger.error('Error proposing parameter change:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// REGIONAL ELECTIONS
// ========================================

/**
 * Get all elections for a region
 */
router.get('/regions/:regionId/elections', async (req, res) => {
    try {
        const { regionId } = req.params;
        const elections = regionalElectionService.getRegionElections(regionId);
        res.json({ success: true, elections });
    } catch (error) {
        regionalLogger.error('Error getting elections:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Initiate election for a position
 */
router.post('/regions/:regionId/elections/initiate', authMiddleware, async (req, res) => {
    try {
        const { regionId } = req.params;
        const { position } = req.body;
        const userId = req.user.id;

        if (!position) {
            return res.status(400).json({ 
                success: false, 
                error: 'Position is required' 
            });
        }

        const result = await regionalElectionService.initiateElection(regionId, position, userId);
        res.json({ success: true, election: result });
    } catch (error) {
        regionalLogger.error('Error initiating election:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Register as candidate for election
 */
router.post('/elections/:electionId/register', authMiddleware, async (req, res) => {
    try {
        const { electionId } = req.params;
        const { platform, qualifications } = req.body;
        const userId = req.user.id;

        if (!platform) {
            return res.status(400).json({ 
                success: false, 
                error: 'Platform is required' 
            });
        }

        const result = await regionalElectionService.registerCandidate(
            electionId, userId, platform, qualifications || []
        );
        res.json({ success: true, candidate: result });
    } catch (error) {
        regionalLogger.error('Error registering candidate:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Vote in election
 */
router.post('/elections/:electionId/vote', authMiddleware, async (req, res) => {
    try {
        const { electionId } = req.params;
        const { candidateId } = req.body;
        const userId = req.user.id;

        if (!candidateId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Candidate ID is required' 
            });
        }

        const result = await regionalElectionService.castVote(electionId, userId, candidateId);
        res.json({ success: true, vote: result });
    } catch (error) {
        regionalLogger.error('Error casting vote:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get election details
 */
router.get('/elections/:electionId', async (req, res) => {
    try {
        const { electionId } = req.params;
        const election = regionalElectionService.getElection(electionId);
        
        if (!election) {
            return res.status(404).json({ success: false, error: 'Election not found' });
        }

        res.json({ success: true, election });
    } catch (error) {
        regionalLogger.error('Error getting election:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get regional officials
 */
router.get('/regions/:regionId/officials', async (req, res) => {
    try {
        const { regionId } = req.params;
        const officials = regionalElectionService.getRegionOfficials(regionId);
        res.json({ success: true, officials });
    } catch (error) {
        regionalLogger.error('Error getting officials:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// REGIONAL MULTI-SIG GOVERNANCE
// ========================================

/**
 * Get regional treasury
 */
router.get('/regions/:regionId/treasury', async (req, res) => {
    try {
        const { regionId } = req.params;
        const treasury = regionalMultiSigService.getRegionalTreasury(regionId);
        res.json({ success: true, treasury });
    } catch (error) {
        regionalLogger.error('Error getting treasury:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Create spending proposal
 */
router.post('/regions/:regionId/proposals/spending', authMiddleware, async (req, res) => {
    try {
        const { regionId } = req.params;
        const proposalData = req.body;
        const userId = req.user.id;

        // Validate required fields
        const required = ['title', 'description', 'amount', 'recipient'];
        for (const field of required) {
            if (!proposalData[field]) {
                return res.status(400).json({ 
                    success: false, 
                    error: `${field} is required` 
                });
            }
        }

        const result = await regionalMultiSigService.createSpendingProposal(
            regionId, proposalData, userId
        );
        res.json({ success: true, proposal: result });
    } catch (error) {
        regionalLogger.error('Error creating spending proposal:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get regional spending proposals
 */
router.get('/regions/:regionId/proposals/spending', async (req, res) => {
    try {
        const { regionId } = req.params;
        const { status } = req.query;
        
        const proposals = regionalMultiSigService.getRegionalProposals(regionId, status);
        res.json({ success: true, proposals });
    } catch (error) {
        regionalLogger.error('Error getting spending proposals:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Approve spending proposal
 */
router.post('/proposals/:proposalId/approve', authMiddleware, async (req, res) => {
    try {
        const { proposalId } = req.params;
        const { signature } = req.body;
        const userId = req.user.id;

        if (!signature) {
            return res.status(400).json({ 
                success: false, 
                error: 'Signature is required' 
            });
        }

        const result = await regionalMultiSigService.approveProposal(
            proposalId, userId, signature
        );
        res.json({ success: true, approval: result });
    } catch (error) {
        regionalLogger.error('Error approving proposal:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get proposal details
 */
router.get('/proposals/:proposalId', async (req, res) => {
    try {
        const { proposalId } = req.params;
        const proposal = regionalMultiSigService.getProposal(proposalId);
        
        if (!proposal) {
            return res.status(404).json({ success: false, error: 'Proposal not found' });
        }

        res.json({ success: true, proposal });
    } catch (error) {
        regionalLogger.error('Error getting proposal:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// COMBINED REGIONAL STATUS
// ========================================

/**
 * Get comprehensive regional status
 */
router.get('/regions/:regionId/status', async (req, res) => {
    try {
        const { regionId } = req.params;
        
        // Get region info
        const region = regionalGovernanceService.getRegion(regionId);
        if (!region) {
            return res.status(404).json({ success: false, error: 'Region not found' });
        }

        // Get comprehensive status
        const status = {
            region,
            parameters: regionalGovernanceService.getRegionParameters(regionId),
            officials: regionalElectionService.getRegionOfficials(regionId),
            activeElections: regionalElectionService.getRegionElections(regionId)
                .filter(e => e.status === 'active'),
            treasury: regionalMultiSigService.getRegionalTreasury(regionId),
            activeProposals: regionalMultiSigService.getRegionalProposals(regionId, 'pending')
        };

        res.json({ success: true, status });
    } catch (error) {
        regionalLogger.error('Error getting regional status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
