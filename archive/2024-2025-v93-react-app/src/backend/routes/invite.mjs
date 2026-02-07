//backend/routes/invite.mjs
import express from 'express';
import { 
  createInvite, 
  verifyInvite, 
  burnInvite 
} from '../api/inviteApi.mjs';
import { getInvite, resetInvitesForTest } from '../invites/inviteStore.mjs';
import logger from '../utils/logging/logger.mjs';

const router = express.Router();

// Create a new invite
router.post('/create', createInvite);

// Verify an invite code
router.post('/verify', verifyInvite);

// Mark an invite as used
router.post('/burn', burnInvite);

// Get invite details (for admin or debugging)
router.get('/:code', async (req, res) => {
  try {
    const inviteCode = req.params.code;
    const invite = getInvite(inviteCode);
    
    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Invite code not found'
      });
    }
    
    res.json({
      success: true,
      invite: {
        code: inviteCode,
        used: invite.used,
        expiry: invite.expiry
      }
    });
  } catch (error) {
    logger.error('Error getting invite', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get invite details'
    });
  }
});

// Reset invites (only in test environment)
if (process.env.NODE_ENV === 'test') {
  router.post('/reset', (req, res) => {
    resetInvitesForTest();
    res.json({
      success: true,
      message: 'Invite store reset to initial test state'
    });
  });
}

// Get invite tree structure (for visualization)
router.get('/tree', async (req, res) => {
  try {
    const { listInvites } = await import('../invites/inviteStore.mjs');
    const invites = await listInvites();
    
    // Build tree structure from invites
    const tree = buildInviteTree(invites);
    
    // Calculate statistics
    const stats = {
      totalInvites: invites.length,
      usedInvites: invites.filter(invite => invite.used).length,
      availableInvites: invites.filter(invite => !invite.used).length,
      treeDepth: calculateTreeDepth(tree),
      decayFactor: calculateAverageDecayFactor(invites)
    };
    
    res.status(200).json({
      success: true,
      tree,
      stats
    });
  } catch (error) {
    logger.error('Error getting invite tree', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve invite tree'
    });
  }
});

/**
 * Build a tree structure from invite data
 * @param {Array<Object>} invites - List of all invites
 * @returns {Object} Tree structure
 */
function buildInviteTree(invites) {
  // Create a map of creators to their invites
  const creatorMap = {};
  const rootNodes = [];
  
  // First, organize invites by creator
  invites.forEach(invite => {
    if (!invite.createdBy) {
      // Add to root if no creator
      rootNodes.push({
        ...invite,
        children: []
      });
      return;
    }
    
    if (!creatorMap[invite.createdBy]) {
      creatorMap[invite.createdBy] = [];
    }
    
    creatorMap[invite.createdBy].push(invite);
  });
  
  // Find all users who were invited (to identify the root users)
  const invitedUsers = new Set(
    invites
      .filter(invite => invite.used && invite.usedBy)
      .map(invite => invite.usedBy)
  );
  
  // Find users who created invites but weren't invited (these are root users)
  const creatorIds = Object.keys(creatorMap);
  const rootCreators = creatorIds.filter(id => !invitedUsers.has(id));
  
  // Build the tree starting from root creators
  const rootCreatorNodes = rootCreators.map(creatorId => {
    return buildSubtree(creatorId, creatorMap, {});
  });
  
  // Combine all roots
  return {
    name: "Invite Tree",
    children: [...rootNodes, ...rootCreatorNodes]
  };
}

/**
 * Build a subtree for a specific creator
 * @param {string} creatorId - ID of the creator
 * @param {Object} creatorMap - Map of creators to their invites
 * @param {Object} visited - Map of already visited creators
 * @returns {Object} Subtree
 */
function buildSubtree(creatorId, creatorMap, visited) {
  // Prevent circular references
  if (visited[creatorId]) {
    return null;
  }
  
  visited[creatorId] = true;
  
  // Get creator's invites
  const invites = creatorMap[creatorId] || [];
  
  // Create node for this creator
  const node = {
    id: creatorId,
    name: `User ${creatorId}`,
    children: []
  };
  
  // Add each invite
  invites.forEach(invite => {
    const inviteNode = {
      id: invite.code,
      code: invite.code,
      used: invite.used,
      usedBy: invite.usedBy,
      remainingInvites: invite.maxInvites || 0,
      children: []
    };
    
    // If this invite was used, add the invited user's subtree
    if (invite.used && invite.usedBy && creatorMap[invite.usedBy]) {
      const invitedUserSubtree = buildSubtree(invite.usedBy, creatorMap, {...visited});
      if (invitedUserSubtree) {
        inviteNode.children.push(invitedUserSubtree);
      }
    }
    
    node.children.push(inviteNode);
  });
  
  return node;
}

/**
 * Calculate the depth of a tree
 * @param {Object} tree - Tree structure
 * @returns {number} Depth
 */
function calculateTreeDepth(tree) {
  if (!tree || !tree.children || tree.children.length === 0) {
    return 0;
  }
  
  return 1 + Math.max(...tree.children.map(calculateTreeDepth));
}

/**
 * Calculate average decay factor across the invite tree
 * @param {Array<Object>} invites - List of all invites
 * @returns {number} Average decay factor
 */
function calculateAverageDecayFactor(invites) {
  // Group invites by generation
  const generationMap = {};
  
  invites.forEach(invite => {
    if (invite.generation !== undefined && invite.maxInvites !== undefined) {
      if (!generationMap[invite.generation]) {
        generationMap[invite.generation] = [];
      }
      generationMap[invite.generation].push(invite.maxInvites);
    }
  });
  
  // Calculate decay between consecutive generations
  let decayFactors = [];
  const generations = Object.keys(generationMap).sort();
  
  for (let i = 0; i < generations.length - 1; i++) {
    const currentGen = generations[i];
    const nextGen = generations[i + 1];
    
    const currentAvg = average(generationMap[currentGen]);
    const nextAvg = average(generationMap[nextGen]);
    
    if (currentAvg > 0) {
      decayFactors.push(nextAvg / currentAvg);
    }
  }
  
  // Return average decay factor or default if not enough data
  return decayFactors.length > 0 ? average(decayFactors) : 0.5;
}

/**
 * Calculate average of an array of numbers
 * @param {Array<number>} values - Values to average
 * @returns {number} Average
 */
function average(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export default router;
