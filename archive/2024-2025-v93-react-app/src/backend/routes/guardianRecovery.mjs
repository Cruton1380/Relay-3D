/**
 * Guardian Recovery API Routes
 * 
 * Provides REST endpoints for the Guardian-Based Social Shard Recovery system.
 * Handles shard distribution, recovery initiation, guardian approvals, and management.
 */

import express from 'express';
import { authenticate } from '../middleware/auth.mjs';
import { validateInput } from '../middleware/validation.mjs';
import GuardianRecoveryManager from '../../lib/guardianRecoveryManager.mjs';
import logger from '../utils/logging/logger.mjs';

const router = express.Router();
const recoveryLogger = logger.child({ module: 'guardian-recovery-api' });

// Initialize Guardian Recovery Manager
const guardianRecoveryManager = new GuardianRecoveryManager({
  defaultThreshold: 3,
  defaultTotalShares: 5,
  guardianApprovalTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxGuardiansPerUser: 10
});

// ========================================
// RECOVERY CONFIGURATION ENDPOINTS
// ========================================

/**
 * Initialize recovery configuration for a user
 * POST /api/guardian-recovery/initialize
 */
router.post('/initialize', authenticate(), async (req, res) => {
  try {
    const { threshold, totalShares, guardians, backupOptions } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (threshold && (threshold < 2 || threshold > 10)) {
      return res.status(400).json({
        success: false,
        message: 'Threshold must be between 2 and 10'
      });
    }

    if (totalShares && (totalShares < threshold || totalShares > 15)) {
      return res.status(400).json({
        success: false,
        message: 'Total shares must be between threshold and 15'
      });
    }

    const config = await guardianRecoveryManager.initializeUserRecovery(userId, {
      threshold,
      totalShares,
      guardians: guardians || [],
      backupOptions: backupOptions || {}
    });

    res.json({
      success: true,
      data: {
        userId,
        threshold: config.threshold,
        totalShares: config.totalShares,
        guardianCount: config.guardians.length,
        backupOptions: config.backupOptions,
        message: 'Recovery configuration initialized successfully'
      }
    });

  } catch (error) {
    recoveryLogger.error('Error initializing recovery configuration', {
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Distribute key shards to guardians
 * POST /api/guardian-recovery/distribute-shards
 */
router.post('/distribute-shards', authenticate(), async (req, res) => {
  try {
    const { privateKey, guardianIds, redistributeExisting } = req.body;
    const userId = req.user.userId;

    if (!privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Private key is required'
      });
    }

    if (!guardianIds || !Array.isArray(guardianIds) || guardianIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Guardian IDs array is required'
      });
    }

    // Convert hex string to buffer if needed
    const privateKeyBuffer = Buffer.isBuffer(privateKey) 
      ? privateKey 
      : Buffer.from(privateKey, 'hex');

    const distribution = await guardianRecoveryManager.distributeKeyShards(
      userId,
      privateKeyBuffer,
      guardianIds
    );

    res.json({
      success: true,
      data: {
        guardianShares: distribution.guardianShares.length,
        deviceShares: distribution.deviceShares.length,
        backupShares: distribution.backupShares.length,
        distributedAt: Date.now(),
        message: 'Key shards distributed successfully'
      }
    });

  } catch (error) {
    recoveryLogger.error('Error distributing key shards', {
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get user's recovery configuration and status
 * GET /api/guardian-recovery/status
 */
router.get('/status', authenticate(), async (req, res) => {
  try {
    const userId = req.user.userId;
    const status = guardianRecoveryManager.getUserRecoveryStatus(userId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'No recovery configuration found'
      });
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    recoveryLogger.error('Error getting recovery status', {
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========================================
// RECOVERY PROCESS ENDPOINTS
// ========================================

/**
 * Initiate recovery process
 * POST /api/guardian-recovery/initiate
 */
router.post('/initiate', authenticate(), async (req, res) => {
  try {
    const { deviceInfo, emergencyContact, reason } = req.body;
    const userId = req.user.userId;

    const recoverySession = await guardianRecoveryManager.initiateRecovery(
      userId,
      deviceInfo || req.headers['user-agent'],
      {
        emergencyContact,
        reason: reason || 'Device access lost',
        initiatedBy: req.ip
      }
    );

    res.json({
      success: true,
      data: {
        recoveryId: recoverySession.recoveryId,
        status: recoverySession.status,
        requiredApprovals: recoverySession.requiredApprovals,
        expiresAt: recoverySession.expiresAt,
        message: 'Recovery process initiated. Guardians have been notified.'
      }
    });

  } catch (error) {
    recoveryLogger.error('Error initiating recovery', {
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Guardian approves recovery request
 * POST /api/guardian-recovery/approve/:recoveryId
 */
router.post('/approve/:recoveryId', authenticate(), async (req, res) => {
  try {
    const { recoveryId } = req.params;
    const { signature, consent } = req.body;
    const guardianId = req.user.userId;

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Guardian signature is required'
      });
    }

    if (!consent) {
      return res.status(400).json({
        success: false,
        message: 'Guardian consent is required'
      });
    }

    const result = await guardianRecoveryManager.approveRecovery(
      recoveryId,
      guardianId,
      signature
    );

    res.json({
      success: true,
      data: {
        recoveryId,
        status: result.status,
        approvedCount: result.approvedCount,
        requiredThreshold: result.requiredThreshold,
        remainingTime: result.remainingTime,
        message: result.status === 'completed' 
          ? 'Recovery completed successfully'
          : 'Recovery approval recorded'
      }
    });

  } catch (error) {
    recoveryLogger.error('Error approving recovery', {
      error: error.message,
      recoveryId: req.params.recoveryId,
      guardianId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get recovery session status
 * GET /api/guardian-recovery/session/:recoveryId
 */
router.get('/session/:recoveryId', authenticate(), async (req, res) => {
  try {
    const { recoveryId } = req.params;
    const recovery = guardianRecoveryManager.activeRecoveries.get(recoveryId);

    if (!recovery) {
      return res.status(404).json({
        success: false,
        message: 'Recovery session not found'
      });
    }

    // Only allow access to the user who initiated recovery or their guardians
    const userConfig = guardianRecoveryManager.userConfigurations.get(recovery.userId);
    const isAuthorized = recovery.userId === req.user.userId || 
                        (userConfig && userConfig.guardians.includes(req.user.userId));

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this recovery session'
      });
    }

    res.json({
      success: true,
      data: {
        recoveryId: recovery.recoveryId,
        userId: recovery.userId,
        status: recovery.status,
        initiatedAt: recovery.initiatedAt,
        expiresAt: recovery.expiresAt,
        requiredThreshold: recovery.requiredThreshold,
        approvedCount: recovery.guardiansApproved.length,
        guardiansApproved: recovery.guardiansApproved.map(g => ({
          guardianId: g.guardianId,
          approvedAt: g.approvedAt
        })),
        completedAt: recovery.completedAt,
        error: recovery.error
      }
    });

  } catch (error) {
    recoveryLogger.error('Error getting recovery session', {
      error: error.message,
      recoveryId: req.params.recoveryId
    });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========================================
// GUARDIAN MANAGEMENT ENDPOINTS
// ========================================

/**
 * Add a new guardian
 * POST /api/guardian-recovery/guardians/add
 */
router.post('/guardians/add', authenticate(), async (req, res) => {
  try {
    const { guardianId, redistributeShares } = req.body;
    const userId = req.user.userId;

    if (!guardianId) {
      return res.status(400).json({
        success: false,
        message: 'Guardian ID is required'
      });
    }

    const updatedConfig = await guardianRecoveryManager.addGuardian(
      userId,
      guardianId,
      redistributeShares !== false // Default to true
    );

    res.json({
      success: true,
      data: {
        guardianId,
        totalGuardians: updatedConfig.guardians.length,
        redistributeShares,
        message: 'Guardian added successfully'
      }
    });

  } catch (error) {
    recoveryLogger.error('Error adding guardian', {
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Remove a guardian
 * POST /api/guardian-recovery/guardians/remove
 */
router.post('/guardians/remove', authenticate(), async (req, res) => {
  try {
    const { guardianId } = req.body;
    const userId = req.user.userId;

    if (!guardianId) {
      return res.status(400).json({
        success: false,
        message: 'Guardian ID is required'
      });
    }

    const updatedConfig = await guardianRecoveryManager.removeGuardian(userId, guardianId);

    res.json({
      success: true,
      data: {
        guardianId,
        totalGuardians: updatedConfig.guardians.length,
        message: 'Guardian removed and shares revoked'
      }
    });

  } catch (error) {
    recoveryLogger.error('Error removing guardian', {
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * List user's guardians
 * GET /api/guardian-recovery/guardians
 */
router.get('/guardians', authenticate(), async (req, res) => {
  try {
    const userId = req.user.userId;
    const userConfig = guardianRecoveryManager.userConfigurations.get(userId);

    if (!userConfig) {
      return res.status(404).json({
        success: false,
        message: 'No recovery configuration found'
      });
    }

    const guardianDetails = [];
    for (const guardianId of userConfig.guardians) {
      const shares = guardianRecoveryManager.shareManager.getGuardianShares(guardianId);
      guardianDetails.push({
        guardianId,
        activeShares: shares.filter(s => s.status === 'active').length,
        revokedShares: shares.filter(s => s.status === 'revoked').length,
        lastAssigned: shares.length > 0 ? Math.max(...shares.map(s => s.assignedAt)) : null
      });
    }

    res.json({
      success: true,
      data: {
        guardians: guardianDetails,
        totalGuardians: userConfig.guardians.length,
        threshold: userConfig.threshold
      }
    });

  } catch (error) {
    recoveryLogger.error('Error listing guardians', {
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========================================
// AUDIT AND MONITORING ENDPOINTS
// ========================================

/**
 * Generate recovery audit report
 * GET /api/guardian-recovery/audit
 */
router.get('/audit', authenticate(), async (req, res) => {
  try {
    const userId = req.user.userId;
    const auditReport = guardianRecoveryManager.generateRecoveryAuditReport(userId);

    if (!auditReport) {
      return res.status(404).json({
        success: false,
        message: 'No recovery configuration found for audit'
      });
    }

    res.json({
      success: true,
      data: auditReport
    });

  } catch (error) {
    recoveryLogger.error('Error generating audit report', {
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get guardian shares I'm holding for others
 * GET /api/guardian-recovery/guardian-duties
 */
router.get('/guardian-duties', authenticate(), async (req, res) => {
  try {
    const guardianId = req.user.userId;
    const guardianShares = guardianRecoveryManager.shareManager.getGuardianShares(guardianId);

    const duties = guardianShares.map(share => ({
      shareId: share.shareId,
      originalUserId: share.originalUserId || 'unknown',
      assignedAt: share.assignedAt,
      status: share.status,
      lastAccessed: share.metadata?.lastAccessed
    }));

    res.json({
      success: true,
      data: {
        guardianDuties: duties,
        totalShares: guardianShares.length,
        activeShares: guardianShares.filter(s => s.status === 'active').length
      }
    });

  } catch (error) {
    recoveryLogger.error('Error getting guardian duties', {
      error: error.message,
      guardianId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Emergency recovery status (for admin monitoring)
 * GET /api/guardian-recovery/emergency/status
 */
router.get('/emergency/status', authenticate(), async (req, res) => {
  try {
    // This would typically require admin privileges
    const emergencyStatus = {
      totalUsers: guardianRecoveryManager.userConfigurations.size,
      activeRecoveries: guardianRecoveryManager.activeRecoveries.size,
      totalShares: 0,
      revokedShares: 0
    };

    // Calculate share statistics
    for (const [userId, config] of guardianRecoveryManager.userConfigurations) {
      for (const guardianId of config.guardians) {
        const shares = guardianRecoveryManager.shareManager.getGuardianShares(guardianId);
        emergencyStatus.totalShares += shares.length;
        emergencyStatus.revokedShares += shares.filter(s => s.status === 'revoked').length;
      }
    }

    res.json({
      success: true,
      data: emergencyStatus
    });

  } catch (error) {
    recoveryLogger.error('Error getting emergency status', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  recoveryLogger.error('Guardian Recovery API error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error in Guardian Recovery system'
  });
});

export default router;
