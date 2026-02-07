/**
 * @fileoverview Trust API routes for trust level management
 */
import { Router } from 'express';
import { trustLevelService } from '../services/trustLevelService.mjs';
import logger from '../utils/logging/logger.mjs';
// Import Sybil Enforcement Orchestrator
import SybilEnforcementOrchestrator from '../../lib/sybilEnforcementOrchestrator.js';

const router = Router();

// Initialize Sybil Enforcement Orchestrator
const sybilEnforcement = new SybilEnforcementOrchestrator();

/**
 * SYBIL ENFORCEMENT ROUTES
 */

/**
 * Process a suspected Sybil account
 * POST /api/trust/sybil/process
 */
router.post('/sybil/process', async (req, res) => {
  try {
    const { userId, reason, duplicateAccount, region, evidence, requiresReverification } = req.body;
    
    // In production, add admin/moderator permission check here
    // if (!req.user.hasRole('admin') && !req.user.hasRole('moderator')) {
    //   return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    // }
    
    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'userId and reason are required'
      });
    }

    const suspicionReport = {
      userId,
      reason,
      duplicateAccount: duplicateAccount || false,
      region: region || 'unknown',
      evidence: evidence || {},
      requiresReverification: requiresReverification !== false, // Default to true
      reportedBy: req.user?.id || 'system',
      reportedAt: Date.now()
    };

    console.log('[TRUST_API] Processing Sybil case for user:', userId);
    
    const result = await sybilEnforcement.processSybilCase(suspicionReport);
    
    res.json({
      success: true,
      data: result,
      message: 'Sybil case processing initiated'
    });
    
  } catch (error) {
    logger.error('Error processing Sybil case', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get status of a Sybil case
 * GET /api/trust/sybil/case/:caseId
 */
router.get('/sybil/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const caseStatus = await sybilEnforcement.getCaseStatus(caseId);
    
    if (!caseStatus) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    res.json({
      success: true,
      data: caseStatus
    });
    
  } catch (error) {
    logger.error('Error getting case status', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get all active Sybil cases (admin endpoint)
 * GET /api/trust/sybil/cases
 */
router.get('/sybil/cases', async (req, res) => {
  try {
    // In production, add admin permission check here
    // if (!req.user.hasRole('admin')) {
    //   return res.status(403).json({ success: false, message: 'Admin access required' });
    // }
    
    const activeCases = await sybilEnforcement.getActiveCases();
    
    res.json({
      success: true,
      data: activeCases
    });
    
  } catch (error) {
    logger.error('Error getting active cases', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Handle account appeal submission
 * POST /api/trust/sybil/appeal
 */
router.post('/sybil/appeal', async (req, res) => {
  try {
    const { userId, caseId, appealReason, evidence } = req.body;
    
    if (!userId || !caseId || !appealReason) {
      return res.status(400).json({
        success: false,
        message: 'userId, caseId, and appealReason are required'
      });
    }

    const appealData = {
      userId,
      caseId,
      appealReason,
      evidence: evidence || {},
      submittedAt: Date.now(),
      submittedBy: req.user?.id || userId
    };

    console.log('[TRUST_API] Processing appeal for case:', caseId);
    
    const result = await sybilEnforcement.processAppeal(appealData);
    
    res.json({
      success: true,
      data: result,
      message: 'Appeal submitted successfully'
    });
    
  } catch (error) {
    logger.error('Error processing appeal', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get enforcement history for a user (admin endpoint)
 * GET /api/trust/enforcement/history/:userId
 */
router.get('/enforcement/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // In production, add admin permission check here
    // if (!req.user.hasRole('admin') && req.user.id !== userId) {
    //   return res.status(403).json({ success: false, message: 'Access denied' });
    // }
    
    const history = await sybilEnforcement.getEnforcementHistory(userId);
    
    res.json({
      success: true,
      data: history
    });
    
  } catch (error) {
    logger.error('Error getting enforcement history', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get account status for a user
 */
router.get('/enforcement/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const accountStatus = await sybilEnforcement.getAccountStatus(userId);
    
    res.json({
      success: true,
      data: accountStatus
    });
    
  } catch (error) {
    logger.error('Error getting account status', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * SYBIL DEFENSE ENDPOINTS FOR FRONTEND SERVICES
 */

/**
 * Get user profiles for sybil detection
 * POST /api/trust/sybil/profiles
 */
router.post('/sybil/profiles', async (req, res) => {
  try {
    // For now, return empty profiles since we don't have real user data
    // In production, this would return user profiles for sybil analysis
    res.json({
      success: true,
      profiles: [],
      message: 'No user profiles available'
    });
  } catch (error) {
    logger.error('Error getting sybil profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sybil profiles',
      profiles: []
    });
  }
});

/**
 * Get suspicious patterns for sybil detection
 * POST /api/trust/sybil/patterns
 */
router.post('/sybil/patterns', async (req, res) => {
  try {
    // For now, return empty patterns since we don't have real pattern data
    // In production, this would return suspicious behavior patterns
    res.json({
      success: true,
      patterns: [],
      message: 'No suspicious patterns available'
    });
  } catch (error) {
    logger.error('Error getting sybil patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sybil patterns',
      patterns: []
    });
  }
});

/**
 * Get account status for a user
 * GET /api/trust/account/status/:userId
 */
router.get('/account/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const accountStatus = await sybilEnforcement.getAccountStatus(userId);
    
    res.json({
      success: true,
      data: accountStatus
    });
    
  } catch (error) {
    logger.error('Error getting account status', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Initialize trust for a new user
 */
router.post('/initialize', async (req, res) => {
  try {
    const { deviceBinding, proximityVerification, initialTrustLevel, onboardingMethod } = req.body;
    const userId = req.user?.id || 'demo_user_' + Date.now(); // In real app, get from auth middleware
    
    if (!deviceBinding || !proximityVerification) {
      return res.status(400).json({
        success: false,
        message: 'Device binding and proximity verification are required'
      });
    }

    // Initialize trust profile
    const trustData = await trustLevelService.initializeUserTrust(userId);
    
    // Record the initial proximity validation
    await trustLevelService.recordTrustAction(userId, 'proximity_validation', {
      proximityMethod: proximityVerification.method,
      inviterDevice: proximityVerification.inviterDeviceId,
      onboardingMethod
    });

    res.json({
      success: true,
      data: {
        userId,
        trustData,
        message: 'Trust profile initialized successfully'
      }
    });
  } catch (error) {
    logger.error('Error initializing trust', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get user's trust summary
 */
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const trustSummary = await trustLevelService.getUserTrustSummary(userId);
    
    if (!trustSummary) {
      return res.status(404).json({
        success: false,
        message: 'Trust data not found for user'
      });
    }

    res.json({
      success: true,
      data: trustSummary
    });
  } catch (error) {
    logger.error('Error getting trust summary', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Record a trust-building action
 */
router.post('/record-action', async (req, res) => {
  try {
    const { userId, actionType, context } = req.body;
    
    if (!userId || !actionType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and action type are required'
      });
    }

    const result = await trustLevelService.recordTrustAction(userId, actionType, context);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error recording trust action', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Check reverification status
 */
router.get('/reverification-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const status = await trustLevelService.checkReverificationStatus(userId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error checking reverification status', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Complete reverification
 */
router.post('/complete-reverification', async (req, res) => {
  try {
    const { userId, verificationType } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await trustLevelService.completeReverification(userId, verificationType);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error completing reverification', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Record suspicious event
 */
router.post('/record-suspicious-event', async (req, res) => {
  try {
    const { userId, eventType, severity, context } = req.body;
    
    if (!userId || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and event type are required'
      });
    }

    const event = await trustLevelService.recordSuspiciousEvent(userId, eventType, severity || 'medium', context);
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Error recording suspicious event', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get users requiring reverification (admin endpoint)
 */
router.get('/requiring-reverification', async (req, res) => {
  try {
    // In real app, check admin permissions here
    
    const users = await trustLevelService.getUsersRequiringReverification();
    
    res.json({
      success: true,
      data: {
        users,
        count: users.length
      }
    });
  } catch (error) {
    logger.error('Error getting users requiring reverification', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
