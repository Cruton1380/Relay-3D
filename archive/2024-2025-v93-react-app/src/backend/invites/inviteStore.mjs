//backend/invites/inviteStore.mjs
import fs from 'fs/promises';
import path from 'path';
import { constants } from 'fs';
import logger from '../utils/logging/logger.mjs';
import crypto from 'crypto';
import configService from '../config-service/index.mjs';
import { getDataFilePath } from '../utils/storage/fileStorage.mjs';

// File to store invite codes
const INVITES_FILE = getDataFilePath('users/invites.json');

// In-memory invite store for faster access
let inviteStore = {};
let initialized = false;

// Ensure the data directory exists
async function ensureDataDir() {
  const dir = path.dirname(INVITES_FILE);
  try {
    await fs.access(dir, constants.F_OK);
  } catch (error) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Generate a unique invite code
 * @returns {string} The generated invite code
 */
export function generateInviteCode() {
  // Generate a random string for the code parts
  const part1 = crypto.randomBytes(4).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(4).toString('hex').toUpperCase();
  
  // Format as INVITE-XXXX-XXXX
  return `INVITE-${part1}-${part2}`;
}

/**
 * Initialize the invite store
 */
export async function initializeInviteStore() {
  if (initialized) return true;
  
  try {
    await ensureDataDir();
    
    try {
      await fs.access(INVITES_FILE, constants.F_OK);
      const data = await fs.readFile(INVITES_FILE, 'utf8');
      inviteStore = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist or is invalid, start with empty store
      inviteStore = {};
      await fs.writeFile(INVITES_FILE, JSON.stringify(inviteStore, null, 2));
    }
    
    // If we're in development/test mode, create some test invites
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      await createTestInvites();
    }
    
    initialized = true;
    logger.info('Test invites initialized');
    return true;
  } catch (error) {
    logger.error('Failed to initialize invite store', { error: error.message });
    return false;
  }
}

/**
 * Create test invites for development
 */
async function createTestInvites() {
  // Add some test invites if they don't exist
  const testInvites = [
    { code: 'INVITE-VALID-1234', used: false, expiryDate: null },
    { code: 'INVITE-USED-5678', used: true, expiryDate: null },
    { code: 'INVITE-EXPIRED-9999', used: false, expiryDate: '2020-01-01' }
  ];
  
  for (const invite of testInvites) {
    if (!inviteStore[invite.code]) {
      inviteStore[invite.code] = invite;
    }
  }
  
  // Save to disk
  await fs.writeFile(INVITES_FILE, JSON.stringify(inviteStore, null, 2));
}

/**
 * Get an invite by code
 * @param {string} code - The invite code
 * @returns {Object|null} The invite or null if not found
 */
export async function getInvite(code) {
  if (!initialized) await initializeInviteStore();
  return inviteStore[code] || null;
}

/**
 * Check if invite code is valid format
 * @param {string} code - The invite code to check
 * @returns {boolean} Whether the format is valid
 */
export function isValidInviteFormat(code) {
  // Verify invite format - example: INVITE-XXXX-XXXX where X is alphanumeric
  const inviteRegex = /^INVITE-[A-Z0-9]{4,8}-[A-Z0-9]{4,8}$/;
  return inviteRegex.test(code);
}

/**
 * Check if an invite code has been used
 * @param {string} code - The invite code to check
 * @returns {Promise<boolean>} Whether the code has been used
 */
export async function isInviteUsed(code) {
  if (!initialized) await initializeInviteStore();
  const invite = inviteStore[code];
  return invite ? invite.used : false;
}

/**
 * Burn (mark as used) an invite code
 * @param {string} inviteCode - The invite code to burn
 * @param {string} usedBy - Identifier for who used the invite
 * @returns {Promise<boolean>} Whether the operation succeeded
 */
export async function burnInviteCode(inviteCode, usedBy) {
  if (!initialized) await initializeInviteStore();
  
  const invite = inviteStore[inviteCode];
  if (!invite) return false;
  
  invite.used = true;
  invite.usedBy = usedBy;
  invite.usedAt = new Date().toISOString();
  
  try {
    await fs.writeFile(INVITES_FILE, JSON.stringify(inviteStore, null, 2));
    return true;
  } catch (error) {
    logger.error('Failed to burn invite code', { error: error.message });
    return false;
  }
}

/**
 * Reset invites for testing
 * Only available in test environment
 */
export async function resetInvitesForTest() {
  if (process.env.NODE_ENV !== 'test') {
    logger.warn('Attempted to reset invites outside of test environment');
    return false;
  }
  
  inviteStore = {};
  await createTestInvites();
  return true;
}

// Initialize on import
initializeInviteStore();

/**
 * Validates an invite code
 * @param {string} code - The invite code to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateInviteCode(code) {
  try {
    // Add format validation as first check
    if (!isValidInviteFormat(code)) {
      return {
        valid: false,
        reason: 'Invalid invite code format'
      };
    }

    const invite = await getInvite(code);
    
    if (!invite) {
      return {
        valid: false,
        reason: 'Invite code not found'
      };
    }
    
    if (invite.used) {
      return {
        valid: false,
        reason: 'Invite code already used'
      };
    }
    
    if (invite.expiryDate && new Date(invite.expiryDate) < new Date()) {
      return {
        valid: false,
        reason: 'Invite code expired'
      };
    }
    
    return {
      valid: true,
      invite
    };
  } catch (error) {
    console.error('Error validating invite code:', error);
    return {
      valid: false,
      reason: 'Internal server error during validation'
    };
  }
}

/**
 * Validates an invite code (alias for validateInviteCode for compatibility)
 * @param {string} code - The invite code to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateInvite(code) {
  return await validateInviteCode(code);
}

/**
 * Generate invites for new user based on parent's invite allocation
 * @param {string} userId - The ID of the new user
 * @param {string} parentUserId - The ID of the user who invited this user
 * @param {number} [customInviteCount] - Optional custom invite count (for founder)
 * @returns {Promise<Array<string>>} List of generated invite codes
 */
export async function generateInvitesForNewUser(userId, parentUserId, customInviteCount) {
  try {
    // Check if we have a custom invite count (used by founder)
    if (typeof customInviteCount === 'number') {
      logger.info(`Generating ${customInviteCount} invites for new user ${userId} (custom allocation)`);
      return generateInvitesBatch(userId, customInviteCount);
    }
    
    // Get parent user's remaining invite count to calculate decay
    if (!parentUserId) {
      // If no parent (shouldn't happen), use system default
      const defaultCount = configService.get('invitesPerNewUser') || 1;
      logger.info(`Generating ${defaultCount} invites for new user ${userId} (no parent, using default)`);
      return generateInvitesBatch(userId, defaultCount);
    }
    
    // Get parent user's invites to calculate decay
    const parentInvites = Object.values(inviteStore).filter(invite => invite.createdBy === parentUserId);
    let parentMaxInvites = 0;
    
    // Find parent's maximum invite allocation by analyzing their invite metadata
    for (const invite of parentInvites) {
      if (invite.generation !== undefined && invite.maxInvites !== undefined) {
        // Use the highest maxInvites value we find
        if (invite.maxInvites > parentMaxInvites) {
          parentMaxInvites = invite.maxInvites;
        }
      }
    }
    
    // Calculate decay - new user gets one fewer than parent's maximum
    let newUserInviteCount;
    
    if (parentMaxInvites === 1) {
      // Parent has reached the absolute minimum (1), new users get global parameter
      newUserInviteCount = configService.get('invitesPerNewUser') || 3;
      logger.info(`Parent ${parentUserId} at absolute minimum (1), using global parameter for ${userId}: ${newUserInviteCount}`);
    } else {
      // Apply the linear decay rule (one fewer than parent, minimum 1)
      newUserInviteCount = Math.max(1, parentMaxInvites - 1);
      logger.info(`Applying linear decay rule: ${userId} gets ${newUserInviteCount} invites (parent had ${parentMaxInvites})`);
    }
    
    return generateInvitesBatch(userId, newUserInviteCount);
  } catch (error) {
    logger.error('Failed to generate invites for new user', { error: error.message, userId });
    throw error;
  }
}

/**
 * Helper to generate a batch of invites
 * @param {string} userId - The user ID creating the invites
 * @param {number} count - Number of invites to generate
 * @returns {Promise<Array<string>>} Generated invite codes
 */
async function generateInvitesBatch(userId, count) {
  const invites = [];
  const generation = await determineUserGeneration(userId);
  
  for (let i = 0; i < count; i++) {
    const inviteCode = generateInviteCode();
    invites.push(inviteCode);
    
    // Store the invite with generation and max invites metadata
    inviteStore[inviteCode] = {
      code: inviteCode,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      used: false,
      usedBy: null,
      usedAt: null,
      generation: generation,
      maxInvites: count
    };
  }
  
  // Save updated invites to disk
  await fs.writeFile(INVITES_FILE, JSON.stringify(inviteStore, null, 2));
  
  return invites;
}

/**
 * Helper to determine a user's generation in the invite tree
 * @param {string} userId - The user ID
 * @returns {Promise<number>} The user's generation (0 for founder)
 */
async function determineUserGeneration(userId) {
  // Check if this is a founder
  const isFounder = await checkIsFounder(userId);
  if (isFounder) return 0;
  
  // Find the invite that was used to create this user
  const userInvite = Object.values(inviteStore).find(invite => 
    invite.used && invite.usedBy === userId
  );
  
  if (!userInvite) {
    // If we can't find an invite, assume they're first generation
    return 1;
  }
  
  // If the invite has generation info, the user is one generation deeper
  if (userInvite.generation !== undefined) {
    return userInvite.generation + 1;
  }
  
  // Default to first generation if we can't determine
  return 1;
}

/**
 * Check if a user is a founder
 * @param {string} userId - The user ID to check
 * @returns {Promise<boolean>} Whether the user is a founder
 */
async function checkIsFounder(userId) {
  try {
    // In a real system, this would check a database
    // For now, we'll use the config service to check a list of founder IDs
    const founders = configService.get('founderIds') || [];
    return founders.includes(userId);
  } catch (error) {
    logger.error('Error checking founder status', { error: error.message });
    return false;
  }
}

/**
 * Create a new invite
 * @param {string|Object} codeOrData - Either the invite code (legacy) or invite data object
 * @param {string} createdBy - Who created the invite (when using legacy signature)
 * @returns {Promise<Object>} The created invite with code
 */
export async function createNewInvite(codeOrData, createdBy) {
  if (!initialized) await initializeInviteStore();
  
  try {
    let inviteCode, inviteData;
    
    // Handle both legacy signature (code, createdBy) and new signature ({ code, createdBy, ... })
    if (typeof codeOrData === 'string') {
      // Legacy signature: createNewInvite(code, createdBy)
      inviteCode = codeOrData;
      inviteData = { createdBy };
    } else {
      // New signature: createNewInvite({ code, createdBy, ... })
      inviteData = codeOrData || {};
      inviteCode = inviteData.code || generateInviteCode();
    }
    
    const invite = {
      code: inviteCode,
      createdBy: inviteData.createdBy || null,
      createdAt: new Date().toISOString(),
      used: false,
      usedBy: null,
      usedAt: null,
      expiryDate: inviteData.expiryDate || null,
      ...inviteData
    };
    
    // Store the invite
    inviteStore[inviteCode] = invite;
    
    // Save to disk
    await fs.writeFile(INVITES_FILE, JSON.stringify(inviteStore, null, 2));
    
    logger.info('Created new invite', { code: inviteCode, createdBy: inviteData.createdBy });
    
    return { success: true, invite };
  } catch (error) {
    logger.error('Failed to create new invite', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * List all invites
 * @returns {Promise<Array>} Array of all invites
 */
export async function listInvites() {
  if (!initialized) await initializeInviteStore();
  
  try {
    // Convert the store object to an array of invites
    const invites = Object.values(inviteStore);
    logger.info('Listed invites', { count: invites.length });
    return invites;
  } catch (error) {
    logger.error('Failed to list invites', { error: error.message });
    throw error;
  }
}
