//backend/services/inviteService.mjs
/**
 * Invite Service - Implements invite management and tree structure
 * Core service for the Relay Platform's Decaying Invite Tree system
 */
import { 
  generateInviteCode, 
  createNewInvite, 
  generateInvitesForNewUser, 
  listInvites 
} from '../invites/inviteStore.mjs';
import configService from '../config-service/index.mjs';
import logger from '../utils/logging/logger.mjs';
import userService from './userService.mjs';

// Create logger instance
const inviteLogger = logger.child({ module: 'invite-service' });

/**
 * Create a new founder account
 * @param {string} publicKey - Founder's public key
 * @returns {Promise<Object>} Creation result
 */
export async function createFounderAccount(publicKey) {
  try {
    inviteLogger.info('Creating founder account', { publicKey: publicKey.substring(0, 10) + '...' });
    
    // Check if we already have a founder
    const founders = configService.get('founderIds') || [];
    
    if (founders.length > 0) {
      throw new Error('Founder account already exists');
    }
    
    // Create user record for the founder
    const userId = await userService.createUser({
      publicKey,
      isFounder: true,
      role: 'founder'
    });
    
    if (!userId) {
      throw new Error('Failed to create founder user record');
    }
    
    // Add to founder IDs in config
    const updatedFounders = [...founders, userId];
    configService.set('founderIds', updatedFounders);
    
    // Generate unlimited invite tracking record
    const inviteCode = generateInviteCode();
    await createNewInvite({
      code: inviteCode,
      createdBy: userId,
      used: false,
      generation: 0,
      maxInvites: Number.MAX_SAFE_INTEGER, // Effectively unlimited
      isFounderInvite: true
    });
    
    inviteLogger.info('Founder account created successfully', { userId });
    
    // Return founder details
    return {
      success: true,
      founder: {
        userId,
        publicKey,
        isFounder: true,
        unlimitedInvites: true
      }
    };
  } catch (error) {
    inviteLogger.error('Failed to create founder account', { error: error.message });
    throw error;
  }
}

/**
 * Assign custom invite count to a user (founder only)
 * @param {string} founderId - ID of the founder
 * @param {string} userId - ID of the user to assign invites to
 * @param {number} inviteCount - Number of invites to assign
 * @returns {Promise<Object>} Assignment result
 */
export async function assignCustomInviteCount(founderId, userId, inviteCount) {
  try {
    // Verify founder status
    const isFounder = await checkIsFounder(founderId);
    
    if (!isFounder) {
      throw new Error('Only founders can assign custom invite counts');
    }
    
    // Generate invites for the user
    const inviteCodes = await generateInvitesForNewUser(userId, null, inviteCount);
    
    inviteLogger.info('Founder assigned custom invite count', { 
      founderId, 
      userId, 
      inviteCount,
      generatedCodes: inviteCodes.length
    });
    
    return {
      success: true,
      inviteCodes,
      count: inviteCodes.length
    };
  } catch (error) {
    inviteLogger.error('Failed to assign custom invite count', { error: error.message });
    throw error;
  }
}

/**
 * Get the invite tree structure
 * @returns {Promise<Object>} Tree data and stats
 */
export async function getInviteTree() {
  try {
    const invites = await listInvites();
    
    // This would normally go through the tree building logic
    // But we'll use the one in the routes/invite.mjs module
    // to avoid duplication
    
    return {
      success: true,
      invites
    };
  } catch (error) {
    inviteLogger.error('Failed to get invite tree', { error: error.message });
    throw error;
  }
}

/**
 * Check if a user is a founder
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} Founder status
 */
export async function checkIsFounder(userId) {
  try {
    const founders = configService.get('founderIds') || [];
    return founders.includes(userId);
  } catch (error) {
    inviteLogger.error('Error checking founder status', { error: error.message, userId });
    return false;
  }
}

export default {
  createFounderAccount,
  assignCustomInviteCount,
  getInviteTree,
  checkIsFounder
};
