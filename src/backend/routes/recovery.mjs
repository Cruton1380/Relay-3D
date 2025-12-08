//backend/routes/recovery.mjs
import express from 'express';
import { getGuardians, isGuardian, initiateRecovery, approveRecovery, cancelRecovery, getRecoveryStatus } from '../security/accountGuardians.mjs';
import { 
  getAccountStatus, 
  completeAccountRecovery, 
  setAccountPendingVerification, 
  verifyAccount 
} from '../security/userIdentityService.mjs';
import { authenticate } from '../auth/middleware/index.mjs';
import { verifySignature } from '../utils/crypto/signatures.mjs';
import logger from '../utils/logging/logger.mjs';

const router = express.Router();
const recoveryLogger = logger.child({ module: 'recovery-routes' });

/**
 * Get guardians for an account
 * GET /api/recovery/guardians/:publicKey
 */
router.get('/guardians/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;
    
    if (!publicKey) {
      return res.status(400).json({
        success: false,
        message: 'Public key is required'
      });
    }
    
    const guardians = getGuardians(publicKey);
    
    if (!guardians) {
      return res.status(404).json({
        success: false,
        message: 'No guardians found for this account'
      });
    }
    
    // Return a sanitized version without sensitive details
    return res.status(200).json({
      success: true,
      guardians: guardians.guardians,
      threshold: guardians.threshold,
      lastUpdated: guardians.lastUpdated
    });
  } catch (error) {
    recoveryLogger.error('Error getting guardians', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Server error getting guardians'
    });
  }
});

/**
 * Set guardians for an account
 * POST /api/recovery/guardians
 */
router.post('/guardians', authenticate(), async (req, res) => {
  try {
    const { publicKey, guardians, threshold, signature, timestamp, nonce } = req.body;
    
    // Validate required fields
    if (!publicKey || !guardians || !threshold || !signature || !timestamp || !nonce) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Verify this is the account owner
    if (req.user.publicKey !== publicKey) {
      return res.status(403).json({
        success: false,
        message: 'You can only set guardians for your own account'
      });
    }
    
    // Verify the signature
    const message = JSON.stringify({ action: 'set_guardians', publicKey, guardians, threshold, timestamp, nonce });
    const isValid = verifySignature(message, signature, publicKey);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
    
    // Set the guardians
    const result = await setGuardians(publicKey, guardians, threshold);
    
    if (!result) {
      return res.status(400).json({
        success: false,
        message: 'Failed to set guardians'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Guardians set successfully'
    });
  } catch (error) {
    recoveryLogger.error('Error setting guardians', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Server error setting guardians'
    });
  }
});

/**
 * Initiate account recovery
 * POST /api/recovery/initiate
 */
router.post('/initiate', authenticate(), async (req, res) => {
  try {
    const { accountKey, requestedBy, signature, timestamp, nonce } = req.body;
    
    // Validate required fields
    if (!accountKey || !requestedBy || !signature || !timestamp || !nonce) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Verify this is the guardian making the request
    if (req.user.publicKey !== requestedBy) {
      return res.status(403).json({
        success: false,
        message: 'Authentication mismatch'
      });
    }
    
    // Verify the signature
    const message = JSON.stringify({ action: 'initiate_recovery', accountKey, requestedBy, timestamp, nonce });
    const isValid = verifySignature(message, signature, requestedBy);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
    
    // Check if requester is a guardian
    if (!isGuardian(accountKey, requestedBy)) {
      return res.status(403).json({
        success: false,
        message: 'Only designated guardians can initiate recovery'
      });
    }
    
    // Initiate the recovery
    const result = await initiateRecovery(accountKey, requestedBy);
    
    return res.status(200).json({
      success: result.success,
      message: result.message,
      status: result.status,
      recoveryId: result.recoveryId
    });
  } catch (error) {
    recoveryLogger.error('Error initiating recovery', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Server error initiating recovery'
    });
  }
});

/**
 * Approve account recovery
 * POST /api/recovery/approve
 */
router.post('/approve', authenticate(), async (req, res) => {
  try {
    const { accountKey, approvedBy, signature, timestamp, nonce } = req.body;
    
    // Validate required fields
    if (!accountKey || !approvedBy || !signature || !timestamp || !nonce) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Verify this is the guardian making the request
    if (req.user.publicKey !== approvedBy) {
      return res.status(403).json({
        success: false,
        message: 'Authentication mismatch'
      });
    }

    // Verify the signature
    const message = JSON.stringify({ action: 'approve_recovery', accountKey, approvedBy, timestamp, nonce });
    const isValid = verifySignature(message, signature, approvedBy);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Check if approver is a guardian
    if (!isGuardian(accountKey, approvedBy)) {
      return res.status(403).json({
        success: false,
        message: 'Only designated guardians can approve recovery'
      });
    }

    // Approve the recovery
    const result = await approveRecovery(accountKey, approvedBy);

    return res.status(200).json({
      success: result.success,
      message: result.message,
      status: result.status,
      recoveryId: result.recoveryId
    });
  } catch (error) {
    recoveryLogger.error('Error approving recovery', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Server error approving recovery'
    });
  }
});

/**
 * Cancel a recovery request
 * POST /api/recovery/cancel
 */
router.post('/cancel', authenticate(), async (req, res) => {
  try {
    const { accountKey, cancelledBy, signature, timestamp, nonce } = req.body;
    
    // Validate required fields
    if (!accountKey || !cancelledBy || !signature || !timestamp || !nonce) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Verify this is the account owner or a guardian making the request
    if (req.user.publicKey !== cancelledBy) {
      return res.status(403).json({
        success: false,
        message: 'Authentication mismatch'
      });
    }
    
    // Verify the signature
    const message = JSON.stringify({ action: 'cancel_recovery', accountKey, cancelledBy, timestamp, nonce });
    const isValid = verifySignature(message, signature, cancelledBy);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
    
    // Cancel the recovery
    const result = await cancelRecovery(accountKey, cancelledBy);
    
    return res.status(200).json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    recoveryLogger.error('Error cancelling recovery', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Server error cancelling recovery'
    });
  }
});

/**
 * Get recovery status
 * GET /api/recovery/status/:accountKey
 */
router.get('/status/:accountKey', async (req, res) => {
  try {
    const { accountKey } = req.params;
    
    if (!accountKey) {
      return res.status(400).json({
        success: false,
        message: 'Account key is required'
      });
    }
    
    const status = getRecoveryStatus(accountKey);
    
    return res.status(200).json({
      success: true,
      status
    });
  } catch (error) {
    recoveryLogger.error('Error getting recovery status', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Server error getting recovery status'
    });
  }
});

/**
 * Complete account recovery with a new key
 * POST /api/recovery/complete
 */
router.post('/complete', authenticate(), async (req, res) => {
  try {
    const { accountKey, newPublicKey, signature, timestamp, nonce } = req.body;
    
    // Validate required fields
    if (!accountKey || !signature || !timestamp || !nonce) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Get recovery status
    const recoveryStatus = getRecoveryStatus(accountKey);
    
    if (!recoveryStatus || recoveryStatus.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Recovery has not been approved by the required number of guardians'
      });
    }
    
    // Verify signature using any approved guardian
    let isValidSignature = false;
    for (const guardian of recoveryStatus.approvedBy) {
      const message = JSON.stringify({ 
        action: 'complete_recovery', 
        accountKey, 
        newPublicKey, 
        timestamp, 
        nonce 
      });
      if (verifySignature(message, signature, guardian)) {
        isValidSignature = true;
        break;
      }
    }
    
    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
    
    // Complete the recovery
    const result = await completeAccountRecovery(accountKey, newPublicKey);
    
    return res.status(200).json({
      success: result,
      message: result ? 'Account recovery completed' : 'Failed to complete account recovery'
    });
  } catch (error) {
    recoveryLogger.error('Error completing recovery', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Server error completing recovery'
    });
  }
});

/**
 * Respond to recovery request (account owner confirms they're still active)
 * POST /api/recovery/respond
 */
router.post('/respond', authenticate(), async (req, res) => {
  try {
    const { accountKey, signature, timestamp, nonce } = req.body;
    
    // Validate required fields
    if (!accountKey || !signature || !timestamp || !nonce) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Verify this is the account owner
    if (req.user.publicKey !== accountKey) {
      return res.status(403).json({
        success: false,
        message: 'Only the account owner can respond to recovery requests'
      });
    }
    
    // Verify the signature
    const message = JSON.stringify({ action: 'respond_recovery', accountKey, timestamp, nonce });
    const isValid = verifySignature(message, signature, accountKey);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
    
    // Cancel the recovery as the account owner has responded
    const result = await cancelRecovery(accountKey, accountKey);
    
    // If the account was in recovery mode, mark it as active again
    const accountStatus = getAccountStatus(accountKey);
    if (accountStatus && accountStatus.status === 'recovery') {
      await cancelAccountRecovery(accountKey);
    }
    
    return res.status(200).json({
      success: result.success,
      message: 'Account recovery cancelled as account owner has responded'
    });
  } catch (error) {
    recoveryLogger.error('Error responding to recovery', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Server error responding to recovery'
    });
  }
});

/**
 * Annual verification route (proves user is still active)
 * POST /api/recovery/verify-annual
 */
router.post('/verify-annual', authenticate(), async (req, res) => {
  try {
    const { publicKey, biometricHash, signature, timestamp, nonce } = req.body;
    
    // Validate required fields
    if (!publicKey || !biometricHash || !signature || !timestamp || !nonce) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Verify this is the account owner
    if (req.user.publicKey !== publicKey) {
      return res.status(403).json({
        success: false,
        message: 'Only the account owner can perform annual verification'
      });
    }
    
    // Verify the signature
    const message = JSON.stringify({ action: 'verify_annual', publicKey, biometricHash, timestamp, nonce });
    const isValid = verifySignature(message, signature, publicKey);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
    
    // Verify account status
    const status = getAccountStatus(publicKey);
    
    if (status && status.status === 'pending_verification') {
      // Verify the account
      const result = await verifyAccount(publicKey);
      
      return res.status(200).json({
        success: result,
        message: result ? 'Annual verification completed' : 'Failed to complete annual verification'
      });
    }
    
    // Update the last verification timestamp even if not pending verification
    await setAccountStatus(publicKey, 'active', {
      lastVerified: Date.now()
    });
    
    return res.status(200).json({
      success: true,
      message: 'Account verification updated'
    });
  } catch (error) {
    recoveryLogger.error('Error during annual verification', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Server error during annual verification'
    });
  }
});

export default router;
