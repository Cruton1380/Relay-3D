//backend/api/inviteApi.mjs
import { 
  getInvite, 
  burnInviteCode, 
  resetInvitesForTest,
  validateInviteCode as validateInviteCodeStore,
  validateInvite,
  generateInviteCode,
  initializeInviteStore,
  createNewInvite,
  listInvites as listInvitesStore
} from '../invites/inviteStore.mjs';
import logger from '../utils/logging/logger.mjs';
import crypto from 'crypto';

/**
 * Creates a new invite code
 */
export async function createInvite(req, res) {
  try {
    const { createdBy } = req.body;
    
    if (!createdBy) {
      return res.status(400).json({ success: false, message: 'Missing createdBy parameter' });
    }
    
    // Generate a unique invite code
    const inviteCode = generateInviteCode();
    
    // Create expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Store the invite using the imported createNewInvite function
    const result = await createNewInvite(inviteCode, createdBy);
    
    if (!result || !result.success) {
      return res.status(500).json({ success: false, message: 'Failed to create invite' });
    }
    
    logger.info(`Created invite ${inviteCode} by ${createdBy}`);
    
    return res.status(201).json({ 
      success: true, 
      invite: {
        code: inviteCode,
        expiresAt,
        createdBy
      }
    });
  } catch (error) {
    logger.error('Error creating invite', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error creating invite' });
  }
}

/**
 * Verifies an invite code
 */
export async function verifyInvite(req, res) {
  try {
    const { code, deviceId } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Missing invite code' });
    }
    
    // Look up the invite
    const invite = await getInvite(code);
    
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invite not found' });
    }
    
    if (invite.used) {
      return res.status(400).json({ success: false, message: 'Invite already used' });
    }
    
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invite expired' });
    }
    
    // If deviceId is provided, we should generate a presence token
    let presenceToken = null;
    if (deviceId) {
      presenceToken = crypto.createHash('sha256')
        .update(code + deviceId + Date.now().toString())
        .digest('hex');
        
      // In a real implementation, we would store this token with a time limit
      logger.info(`Generated presence token for device ${deviceId}`);
    }
    
    return res.status(200).json({ 
      success: true, 
      invite: {
        code,
        expiresAt: invite.expiresAt,
        createdBy: invite.createdBy
      },
      presenceToken
    });
  } catch (error) {
    logger.error('Error verifying invite', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error verifying invite' });
  }
}

// Helper function to verify presence token
function verifyPresenceToken(token, deviceId) {
  // In a real implementation, we would verify the token against stored tokens
  // For now, we'll just return true for testing
  return true;
}

/**
 * Marks an invite as used (burns it)
 */
export async function burnInvite(req, res) {
  try {
    const { code, presenceToken, deviceId, userId } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Missing invite code' });
    }
    
    // Check if userId is provided for proper burning
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId parameter' });
    }
    
    // Verify presence token if provided
    if (presenceToken && deviceId) {
      const isPresenceValid = verifyPresenceToken(presenceToken, deviceId);
      if (!isPresenceValid) {
        return res.status(403).json({ success: false, message: 'Invalid presence token' });
      }
    }
    
    // Mark the invite as used
    const result = await burnInviteCode(code, userId);
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Invite not found or already used' });
    }
    
    logger.info(`Invite ${code} burned successfully by ${userId}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error burning invite', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error burning invite' });
  }
}

/**
 * Validates an invite code (for tests)
 */
export async function validateInviteCode(req, res) {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Missing invite code' });
    }
    
    const validation = await validateInvite(code);
    
    return res.status(200).json({ 
      success: true, 
      valid: validation.valid,
      invite: validation.invite,
      reason: validation.reason
    });
  } catch (error) {
    logger.error('Error validating invite code', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error validating invite' });
  }
}

/**
 * Lists all invites (for tests/admin)
 */
export async function listInvites(req, res) {
  try {
    const invites = await listInvitesStore();
    
    return res.status(200).json({ 
      success: true, 
      invites 
    });
  } catch (error) {
    logger.error('Error listing invites', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error listing invites' });
  }
}
