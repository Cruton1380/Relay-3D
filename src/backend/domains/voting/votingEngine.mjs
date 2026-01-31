// backend/voting/votingEngine.mjs

import fs from 'fs';
import path from 'path';
import { verifyVote, isReplay, markReplay } from './voteVerifier.mjs';
import { logAction } from '../../utils/logging/logger.mjs';
import logger from '../../utils/logging/logger.mjs';
// ✅ RELAY GIT-NATIVE IMPORTS (replaces state/blockchain/websocket)
import query from '../../../../.relay/query.mjs';
import relayClient from '../../relay-client/index.mjs';
import EnvelopeBuilder from '../../relay-client/envelope-builder.mjs';
import configService from '../../config-service/index.mjs';
import { getUserRegion } from '../../location/userLocation.mjs';
import { getRegionParameters } from '../../config-service/index.mjs';
import voteProcessor from './voteProcessor.mjs';
import activityAnalysisService from '../../activityAnalysis-service/index.mjs';
import { getTopicRegion, setTopicRegion } from './topicRegionUtils.mjs';
import voteTokenManager from '../../../lib/voteTokenManager.mjs';
import { engagementTracker } from '../../../lib/engagementTracker.mjs';
import GroupSignalProtocol from '../../services/groupSignalProtocol.mjs';
import securityConfig from '../../config/securityConfig.mjs';

// 🔒 PRIVACY SERVICE IMPORT
import { getUserPrivacyLevel } from '../../services/userPreferencesService.mjs';
import { PrivacyLevel } from '../../services/privacyFilter.mjs';
import { verifySignature, createVoteHash } from '../../crypto/signature.mjs';
import auditService from '../../services/auditService.mjs';

// Create vote logger
const voteLogger = logger.child({ module: 'voting-engine' });

// Group Signal Protocol instance for vote channel encryption
let groupProtocol = null;

// Initialize Group Signal Protocol for vote channel encryption
async function initializeGroupEncryption() {
  if (!groupProtocol) {
    groupProtocol = new GroupSignalProtocol();
    await groupProtocol.initialize();
    voteLogger.info('🔐 Group Signal Protocol initialized for vote channel encryption');
  }
  return groupProtocol;
}

// Check if a channel is private and requires encryption
function isChannelPrivate(topicId) {
  // For now, we'll check if a group session exists for this channel
  // In a full implementation, this would query the channel database
  // For demo purposes, we'll assume channels with 'private' in the name are private
  return topicId.includes('private') || topicId.includes('secure');
}

// Add user to vote channel group for encryption (only for private channels)
async function addUserToVoteChannelGroup(topicId, userId) {
  // Only add users to encryption groups for private channels
  if (!isChannelPrivate(topicId)) {
    voteLogger.debug('Public channel - skipping encryption group membership', {
      topicId,
      userId
    });
    return { success: true, message: 'Public channel - no encryption needed' };
  }

  try {
    const groupEncryption = await initializeGroupEncryption();
    
    const addMemberResult = await groupEncryption.addGroupMember(topicId, userId, 'system');
    
    if (addMemberResult.success) {
      securityConfig.logSecurityEvent('member_added', {
        groupId: topicId,
        memberId: userId,
        addedBy: 'system'
      });
      
      voteLogger.debug('User added to PRIVATE vote channel group for encryption', {
        topicId,
        userId
      });
    } else {
      securityConfig.logSecurityEvent('security_violation', {
        operation: 'add_member_failed',
        groupId: topicId,
        memberId: userId,
        error: addMemberResult.error
      }, 'warn');
      
      voteLogger.warn('Failed to add user to private vote channel group', {
        topicId,
        userId,
        error: addMemberResult.error
      });
    }
    
    return addMemberResult;
  } catch (error) {
    securityConfig.logSecurityEvent('security_violation', {
      operation: 'add_member_error',
      groupId: topicId,
      memberId: userId,
      error: error.message
    }, 'error');
    
    voteLogger.error('Error adding user to private vote channel group', {
      topicId,
      userId,
      error: error.message
    });
    return { success: false, error: error.message };
  }
}

// Handle encrypted vote broadcast with proper security policies
async function handleEncryptedVoteBroadcast(topic, updateData, voteTotals) {
  const retryConfig = securityConfig.getEncryptionRetryConfig();
  let lastError = null;
  
  for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const groupEncryption = await initializeGroupEncryption();
      
      // Encrypt the vote update data for the vote channel
      const encryptionResult = await groupEncryption.encryptGroupMessage(
        topic, // Use topic as group ID
        'system', // Sender ID for system broadcasts
        JSON.stringify(updateData)
      );
      
      if (encryptionResult && encryptionResult.ciphertext) {
        // Create encrypted update data
        const encryptedUpdateData = {
          type: 'encrypted-vote-update',
          groupId: topic,
          encryptedData: encryptionResult,
          timestamp: Date.now()
        };
        
        // Broadcast encrypted vote update
        await broadcastToWebSocket(encryptedUpdateData, topic, voteTotals, 'encrypted');
        
        securityConfig.logSecurityEvent('encryption_success', {
          groupId: topic,
          attempt,
          totalVotes: voteTotals.totalVotes
        });
        
        return; // Success - exit retry loop
      } else {
        throw new Error('Encryption returned invalid result');
      }
    } catch (error) {
      lastError = error;
      
      securityConfig.logSecurityEvent('encryption_failure', {
        groupId: topic,
        attempt,
        maxRetries: retryConfig.maxRetries,
        error: error.message
      }, 'warn');
      
      voteLogger.warn(`Encryption attempt ${attempt}/${retryConfig.maxRetries} failed`, {
        topic,
        error: error.message,
        attempt
      });
      
      // Wait before retry (except on last attempt)
      if (attempt < retryConfig.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryConfig.delay));
      }
    }
  }
  
  // All retries failed - handle based on security policy
  if (securityConfig.allowUnencryptedFallback()) {
    securityConfig.logSecurityEvent('security_violation', {
      operation: 'unencrypted_fallback',
      groupId: topic,
      reason: 'encryption_failed_after_retries',
      error: lastError?.message
    }, 'warn');
    
    voteLogger.warn('All encryption attempts failed, falling back to unencrypted broadcast', {
      topic,
      error: lastError?.message
    });
    
    await broadcastToWebSocket(updateData, topic, voteTotals, 'unencrypted');
  } else {
    // Production mode - never allow unencrypted fallback
    securityConfig.logSecurityEvent('security_violation', {
      operation: 'encryption_failure_blocked',
      groupId: topic,
      reason: 'production_security_policy',
      error: lastError?.message
    }, 'error');
    
    voteLogger.error('CRITICAL: Encryption failed in production mode - vote update blocked', {
      topic,
      error: lastError?.message
    });
    
    throw new Error(`Vote update blocked: encryption failed in production mode - ${lastError?.message}`);
  }
}

// Helper function to broadcast to WebSocket
async function broadcastToWebSocket(data, topic, voteTotals, encryptionType) {
  if (websocketService && typeof websocketService.broadcastToAuthenticated === 'function') {
    websocketService.broadcastToAuthenticated(data);
    voteLogger.debug(`${encryptionType} vote update broadcasted via WebSocket`, { 
      topic, 
      candidateCount: Object.keys(voteTotals.candidates).length,
      totalVotes: voteTotals.totalVotes,
      encryptionType
    });
  } else if (websocketService && typeof websocketService.broadcast === 'function') {
    websocketService.broadcast(data);
    voteLogger.debug(`${encryptionType} vote update broadcasted to all clients`, { 
      topic, 
      candidateCount: Object.keys(voteTotals.candidates).length,
      totalVotes: voteTotals.totalVotes,
      encryptionType
    });
  } else {
    voteLogger.warn(`WebSocket service not available for broadcasting ${encryptionType} vote updates`);
  }
}

// Note: WebSocket service initialization is handled by the main server
// Do not start websocket service here to avoid initialization conflicts

// Track vote stability
const voteStabilityTracker = new Map();

/**
 * Authoritative Vote Ledger - Single Source of Truth
 * Format: { userId: { topicId: { candidateId, timestamp, reliability, region } } }
 */
const authoritativeVoteLedger = new Map();

/**
 * Get all users who voted for a specific topic
 * @param {string} topicId - Topic ID
 * @returns {Array} Array of {userId, vote}
 */
export function getUsersWithVotesForTopic(topicId) {
  const voters = [];
  for (const [userId, userVotes] of authoritativeVoteLedger.entries()) {
    const vote = userVotes.get(topicId);
    if (vote) {
      voters.push({ userId, vote });
    }
  }
  return voters;
}

/**
 * Get all users who voted for a specific candidate
 * @param {string} topicId - Topic ID
 * @param {string} candidateId - Candidate ID
 * @returns {Array} Array of {userId, vote}
 */
export function getUsersWithVotesForCandidate(topicId, candidateId) {
  const voters = [];
  for (const [userId, userVotes] of authoritativeVoteLedger.entries()) {
    const vote = userVotes.get(topicId);
    if (vote && vote.candidateId === candidateId) {
      voters.push({ userId, vote });
    }
  }
  return voters;
}

/**
 * Audit Log - Append-only log of all vote actions
 * Format: { timestamp, userId, topicId, action, oldCandidateId, newCandidateId, metadata }
 */
const voteAuditLog = [];

/**
 * Topic Vote Totals Cache
 * Precomputed totals for efficient retrieval
 * Format: { topicId: { totalVotes, candidates: { candidateId: count } } }
 */
const topicVoteTotals = new Map();

// Note: blockchain sync service removed - now using Git/Relay backend

/**
 * ✅ GIT-NATIVE VOTE COMMIT HELPER
 * Commits a vote event to Git via Relay client + envelope
 * @param {Object} params - Vote commit parameters
 * @returns {Promise<Object>} Commit result
 */
async function commitVoteEventToRelay({
  repo_id,
  branch_id = 'main',
  scope_type = 'branch',
  actor_id,
  channel_id,
  candidate_id,
  vote_value,
  domain_id = 'voting.channel'
}) {
  try {
    // 1) Get next step from query hook
    const stepInfo = await query({
      path: '/current_step',
      params: { repo_id, branch_id, scope_type }
    });
    const nextStep = stepInfo?.next_step || 1;

    // 2) Create envelope builder
    const builder = new EnvelopeBuilder(domain_id, {
      scope_type,
      repo_id,
      branch_id,
      bundle_id: null
    });
    builder.setStep(nextStep);

    // 3) Vote path: one file per user per channel
    const votePath = `votes/channel/${channel_id}/user/${actor_id}.json`;
    const filesWritten = [votePath, '.relay/envelope.json'];

    // 4) Build CELL_EDIT envelope (user_vote column, not votes_total)
    // CRITICAL: rowKey = actor_id (the voter), NOT candidate_id
    // This models "user's current selection", not "candidate got +1"
    const envelope = builder.buildCellEdit({
      rowKey: actor_id,        // ✅ Row identity is the VOTER
      colId: 'user_vote',      // ✅ Per-user preference column
      before: null,            // TODO: get previous vote if switching
      after: candidate_id,     // ✅ The selection itself
      actorId: actor_id,
      filesWritten
    });

    const finalized = builder.finalize(envelope, filesWritten);

    // 5) Prepare file contents
    const voteFileContent = JSON.stringify({
      user_id: actor_id,
      channel_id: channel_id,
      candidate_id: candidate_id,
      vote: vote_value,
      ts: Date.now()
    }, null, 2);

    const envelopeContent = JSON.stringify(finalized, null, 2);

    // 6) Commit via relay client
    // Note: relay client's put() signature needs adjustment to match our files map
    // For now, we'll write both files in sequence (TODO: batch write)
    await relayClient.put(`/repos/${repo_id}/${votePath}`, voteFileContent, {
      message: `vote: ${actor_id} -> ${candidate_id} (${channel_id})`,
      author: { name: actor_id, email: `${actor_id}@relay.local` }
    });

    await relayClient.put(`/repos/${repo_id}/.relay/envelope.json`, envelopeContent, {
      message: `envelope: step ${nextStep}`,
      author: { name: 'system', email: 'system@relay.local' }
    });

    // 7) Increment step counter (CRITICAL: prevents monotonicity failures)
    // TODO: This should be moved to Relay server PUT handler (after commit succeeds)
    const { incrementStepCounter } = await import('../../.relay/query.mjs');
    await incrementStepCounter(repo_id, branch_id, scope_type, nextStep);

    voteLogger.info('✅ Vote committed to Git/Relay', {
      repo_id,
      branch_id,
      step: nextStep,
      actor_id,
      candidate_id
    });

    return { ok: true, step: nextStep };
  } catch (error) {
    voteLogger.error('❌ Git/Relay commit failed', {
      error: error.message,
      stack: error.stack,
      actor_id,
      candidate_id
    });
    throw error;
  }
}

/**
 * Initialize Authoritative Voting System with Demo Data
 * Loads demo voting data into the authoritative ledger and vote totals cache
 * Now supports loading voter IDs from vote-mappings.json for location integration
 * @param {Object} demoData - Demo voting data from demo-voting-data.json
 */
export function initializeWithDemoData(demoData) {
  console.log('Initializing authoritative voting system with demo data...');
  
  if (!demoData || !demoData.channels) {
    console.warn('No demo data channels found for initialization');
    return;
  }

  // Try to load vote mappings (contains actual voter user IDs with locations)
  let voteMappings = null;
  try {
    const voteMappingsPath = path.join(process.cwd(), 'data', 'demos', 'vote-mappings.json');
    const voteMappingsContent = fs.readFileSync(voteMappingsPath, 'utf8');
    voteMappings = JSON.parse(voteMappingsContent);
    console.log('✅ Loaded vote mappings with real voter user IDs');
  } catch (error) {
    console.log('⚠️  No vote-mappings.json found, using synthetic user IDs');
    console.log('   Run: node scripts/generate-voters-with-locations.mjs');
    console.log('   Then: node scripts/load-demo-voters.mjs');
  }

  let totalUsersAdded = 0;
  let totalVotesAdded = 0;

  // Process each channel in demo data
  demoData.channels.forEach((channel, channelIndex) => {
    const topicId = channel.id || `demo-topic-${channelIndex}`;
    
    if (!channel.candidates || !Array.isArray(channel.candidates)) {
      console.warn(`Channel ${topicId} has no candidates, skipping`);
      return;
    }

    // Initialize topic totals
    const topicTotals = {
      totalVotes: 0,
      candidates: {}
    };

    // Process each candidate's votes
    channel.candidates.forEach((candidate, candidateIndex) => {
      const candidateId = candidate.id || `candidate-${candidateIndex}`;
      const voteCount = candidate.votes || 0;
      
      if (voteCount > 0) {
        // Add candidate votes to topic totals
        topicTotals.candidates[candidateId] = voteCount;
        topicTotals.totalVotes += voteCount;

        // Get voter user IDs from mappings or generate synthetic ones
        const mappingKey = `${topicId}:${candidateId}`;
        const voterUserIds = voteMappings?.votesByCandidate?.[mappingKey] || [];
        
        if (voterUserIds.length > 0) {
          // Use real voter user IDs from vote-mappings.json
          voterUserIds.forEach((userId) => {
            // Add to authoritative ledger
            if (!authoritativeVoteLedger.has(userId)) {
              authoritativeVoteLedger.set(userId, new Map());
            }
            
            const userVotes = authoritativeVoteLedger.get(userId);
            userVotes.set(topicId, {
              candidateId,
              timestamp: Date.now() - (Math.random() * 30 * 86400000), // Random within last 30 days
              reliability: 0.85 + (Math.random() * 0.15), // 0.85-1.0
              voteType: 'FOR'
            });
            
            totalUsersAdded++;
          });
        } else {
          // Fallback: Create synthetic users for each vote (backwards compatible)
          for (let i = 0; i < voteCount; i++) {
            const userId = `voter_${topicId}_${candidateId}_${String(i).padStart(5, '0')}`;
            
            // Add to authoritative ledger
            if (!authoritativeVoteLedger.has(userId)) {
              authoritativeVoteLedger.set(userId, new Map());
            }
            
            const userVotes = authoritativeVoteLedger.get(userId);
            userVotes.set(topicId, {
              candidateId,
              timestamp: Date.now() - (Math.random() * 86400000), // Random timestamp within last day
              reliability: 1.0,
              voteType: 'FOR'
            });
            
            totalUsersAdded++;
          }
        }
        
        totalVotesAdded += voteCount;
      }
    });

    // Store topic totals in cache
    topicVoteTotals.set(topicId, topicTotals);
    
    console.log(`Initialized topic ${topicId} with ${topicTotals.totalVotes} votes across ${channel.candidates.length} candidates`);
  });

  console.log(`Demo data initialization complete: ${totalUsersAdded} users, ${totalVotesAdded} total votes across ${demoData.channels.length} topics`);
}

/**
 * ATOMIC VOTE SWITCHING - Single Source of Truth Implementation
 * Process a vote from a user with proper vote switching logic
 * @param {string} userId - User's unique identifier (publicKey)
 * @param {string} candidateId - Candidate being voted for
 * @param {string} topicId - Topic/channel being voted on
 * @param {number} reliability - Reliability score of the user (0-1)
 * @returns {Promise<Object>} Result of vote processing
 */
export async function processVote(
  userId, 
  topicId, 
  voteType, 
  candidateId, 
  reliability = 1.0,
  options = {} // 🔗 NEW: blockchain parameters
) {
  // Extract blockchain-specific options
  const {
    signature = null,
    publicKey = null,
    nonce = null,
    location = null
  } = options;
  
  // 🔒 Get user's privacy level from preferences (with fallback to PROVINCE)
  let privacyLevel = options.privacyLevel;
  if (!privacyLevel) {
    try {
      const userPrivacy = await getUserPrivacyLevel(userId);
      privacyLevel = PrivacyLevel[userPrivacy.toUpperCase()] || PrivacyLevel.PROVINCE;
    } catch (error) {
      voteLogger.warn('Failed to get user privacy level, using default', { userId, error: error.message });
      privacyLevel = PrivacyLevel.PROVINCE;
    }
  }

  // Validate required parameters
  if (!userId) throw new Error('User ID is required');
  if (!topicId) throw new Error('Topic ID is required');
  if (!candidateId) throw new Error('Candidate ID is required');
  if (candidateId === undefined || candidateId === null) throw new Error('Candidate choice is required');

  // 🔗 Validate blockchain requirements
  if (!signature || !publicKey || !nonce) {
    voteLogger.warn('Vote submitted without blockchain signature - degraded mode', { userId, topicId });
    // For now, continue processing but mark as unverified
    // In strict production mode, this should throw an error
  }

  // Transaction-like operation for atomic vote switching
  const transaction = {
    timestamp: Date.now(),
    userId,
    topicId,
    candidateId,
    reliability: Math.max(0, Math.min(1, reliability)),
    voteId: `vote_${userId}_${topicId}_${Date.now()}` // 🔗 Generate unique vote ID
  };

  try {
    // Verify vote hasn't been replayed
    if (await isReplay(userId, topicId)) {
      throw new Error('Vote replay detected - duplicate submission');
    }

    // STEP 1: Check if user has existing vote for this topic
    const userVotes = authoritativeVoteLedger.get(userId) || new Map();
    const existingVote = userVotes.get(topicId);
    
    let action = 'NEW_VOTE';
    let oldCandidateId = null;
    let totalVotesChange = 0;
    
    if (existingVote) {
      // User is switching votes
      if (existingVote.candidateId === candidateId) {
        // Idempotent: same vote, no change needed
        voteLogger.info('Idempotent vote submission - no change', { userId, topicId, candidateId });
        
        // Log audit entry for idempotent attempt
        voteAuditLog.push({
          timestamp: transaction.timestamp,
          userId,
          topicId,
          action: 'IDEMPOTENT_VOTE',
          oldCandidateId: candidateId,
          newCandidateId: candidateId,
          metadata: { reliability: transaction.reliability }
        });
        
        return {
          success: true,
          action: 'IDEMPOTENT',
          message: 'Vote already recorded for this candidate',
          voteTotals: await getTopicVoteTotals(topicId)
        };
      }
      
      // Vote switch: decrement old candidate, don't change totalVotes
      action = 'VOTE_SWITCH';
      oldCandidateId = existingVote.candidateId;
      totalVotesChange = 0; // No change to total when switching
      
      voteLogger.info('Vote switch detected', { 
        userId, 
        topicId, 
        oldCandidate: oldCandidateId, 
        newCandidate: candidateId 
      });
    } else {
      // New voter: increment totalVotes
      totalVotesChange = 1;
      
      voteLogger.info('New vote detected', { userId, topicId, candidateId });
    }

    // STEP 2: Apply atomic changes to authoritative ledger
    
    // Update user's vote record
    if (!authoritativeVoteLedger.has(userId)) {
      authoritativeVoteLedger.set(userId, new Map());
    }
    const userVoteMap = authoritativeVoteLedger.get(userId);
    
    // 🔗 Prepare vote data with location
    const voteData = {
      voteId: transaction.voteId,
      userId,
      topicId,
      candidateId,
      timestamp: transaction.timestamp,
      reliability: transaction.reliability,
      region: await getUserRegion(userId).catch(() => 'unknown')
    };
    
    // 📍 Add location if provided
    if (location) {
      voteData.location = {
        ...location,
        privacyLevel: privacyLevel || PrivacyLevel.PROVINCE,
        capturedAt: transaction.timestamp
      };
      
      voteLogger.info('📍 Vote location captured', { 
        voteId: transaction.voteId,
        hasLocation: true,
        privacyLevel: privacyLevel,
        country: location.country,
        province: location.province
      });
    } else {
      voteLogger.debug('Vote submitted without location data', { 
        voteId: transaction.voteId 
      });
    }
    
    userVoteMap.set(topicId, voteData);

    // ✅ STEP 2.5: Commit vote to Git/Relay (replaces blockchain)
    let commitHash = null;
    let commitError = null;
    
    try {
      // Optional: Verify signature if provided (crypto verification stays)
      if (signature && publicKey) {
        const voteHash = createVoteHash(voteData);
        const isValidSignature = verifySignature(publicKey, signature, voteHash);
        
        if (!isValidSignature) {
          throw new Error('Invalid vote signature');
        }
        
        voteLogger.info('✅ Vote signature verified', { voteId: transaction.voteId });
      }
      
      // Commit vote event to Git via Relay
      // Extract repo/branch from topic context (or use defaults)
      const repo_id = options.repo_id || `channel_repo_${topicId}`;
      const branch_id = options.branch_id || 'main';
      const scope_type = options.scope_type || 'branch';
      
      const commitResult = await commitVoteEventToRelay({
        repo_id,
        branch_id,
        scope_type,
        actor_id: userId,
        channel_id: topicId,
        candidate_id: candidateId,
        vote_value: candidateId,
        domain_id: 'voting.channel'
      });
      
      commitHash = commitResult.step; // Use step as commit ID
      voteData.commitHash = commitHash;
      voteData.status = 'committed';
      
      voteLogger.info('✅ Vote committed to Git', { 
        voteId: transaction.voteId, 
        commitHash,
        privacyLevel,
        repo_id,
        branch_id
      });
      
      // Record to audit service (if needed)
      if (signature && publicKey) {
        await auditService.recordVoteTransaction({
          voteId: transaction.voteId,
          userId,
          topicId,
          candidateId,
          transactionHash: commitHash,
          voteHash: createVoteHash(voteData),
          signature,
          publicKey,
          signatureAlgorithm: options?.signatureAlgorithm || 'ECDSA-P256',
          privacyLevel,
          timestamp: transaction.timestamp,
          ipAddress: null,
          userAgent: null
        });
      }
      
    } catch (error) {
      commitError = error;
      voteLogger.error('❌ Git commit failed', { 
        error: error.message,
        voteId: transaction.voteId
      });
      // Continue with vote processing even if commit fails (graceful degradation)
      // In strict production mode, you might want to throw here
    }

    // STEP 3: Update derived vote totals cache
    if (!topicVoteTotals.has(topicId)) {
      topicVoteTotals.set(topicId, { 
        totalVotes: 0, 
        candidates: new Map(),
        lastUpdated: transaction.timestamp 
      });
    }
    
    const totals = topicVoteTotals.get(topicId);
    
    // Decrement old candidate (if switching)
    if (oldCandidateId) {
      const oldCount = totals.candidates.get(oldCandidateId);
      if (oldCount === undefined) {
        // Initialize with base count if somehow not set
        const baseCount = getBaseDemoCount(oldCandidateId);
        totals.candidates.set(oldCandidateId, Math.max(baseCount, baseCount - 1));
      } else {
        // Decrement but don't go below base demo count
        const baseCount = getBaseDemoCount(oldCandidateId);
        totals.candidates.set(oldCandidateId, Math.max(baseCount, oldCount - 1));
      }
    }
    
    // Increment new candidate
    const currentCount = totals.candidates.get(candidateId) || 0;
    if (currentCount === 0) {
      // First user vote for this candidate
      const baseCount = getBaseDemoCount(candidateId);
      totals.candidates.set(candidateId, baseCount + 1);
      console.log(`🎯 [VOTING ENGINE] Initialized candidate ${candidateId} with base count ${baseCount} + 1 new vote = ${baseCount + 1}`);
    } else {
      // Candidate already has votes (from demo data or previous users) - just increment
      totals.candidates.set(candidateId, currentCount + 1);
      console.log(`🎯 [VOTING ENGINE] Incremented candidate ${candidateId} from ${currentCount} to ${currentCount + 1}`);
    }
    
    // Update total votes
    totals.totalVotes += totalVotesChange;
    totals.lastUpdated = transaction.timestamp;

    // STEP 4: Audit logging
    voteAuditLog.push({
      timestamp: transaction.timestamp,
      userId,
      topicId,
      action,
      oldCandidateId,
      newCandidateId: candidateId,
      metadata: {
        reliability: transaction.reliability,
        totalVotesChange,
        reconciliationHash: calculateReconciliationHash(topicId)
      }
    });

    // STEP 5: Prevent replay attacks
    await markReplay(userId, topicId);

    // STEP 5.5: Add user to vote channel group for encryption
    await addUserToVoteChannelGroup(topicId, userId);

    // STEP 6: Broadcast update
    await broadcastVoteUpdate(topicId);

    // STEP 7: Verify reconciliation
    const reconciliationCheck = verifyTopicReconciliation(topicId);
    if (!reconciliationCheck.valid) {
      voteLogger.error('CRITICAL: Vote reconciliation failed', reconciliationCheck);
      // In production, this should trigger alerts
    }

    voteLogger.info('Vote processed successfully', {
      userId,
      topicId,
      candidateId,
      action,
      totalVotes: totals.totalVotes,
      blockchain: transactionHash ? 'recorded' : 'failed'
    });

    return {
      success: true,
      action,
      isLocalVote: true, // For backward compatibility
      reliability: transaction.reliability,
      message: `Vote ${action.toLowerCase().replace('_', ' ')} successfully`,
      voteTotals: await getTopicVoteTotals(topicId),
      reconciliation: reconciliationCheck,
      // ✅ Git commit info (replaces blockchain)
      commit: {
        commitHash,
        status: commitHash ? 'committed' : 'failed',
        error: commitError ? commitError.message : null,
        voteId: transaction.voteId
      }
    };

  } catch (error) {
    voteLogger.error('Vote processing failed', { 
      error: error.message, 
      transaction,
      stack: error.stack 
    });
    
    // Rollback any partial changes (transaction safety)
    // In a real database, this would be handled by transaction rollback
    voteLogger.warn('Manual rollback may be required for transaction', transaction);
    
    throw error;
  }
}

/**
 * Get base demo count for a candidate (matches GlobalChannelRenderer fallback system)
 * @param {string} candidateId - Candidate ID
 * @returns {number} Base demo vote count
 */
function getBaseDemoCount(candidateId) {
  // GlobalChannelRenderer fallback candidates for ujhi channel
  if (candidateId.includes('candidate-1759217730559-0-')) return 6000;  // ujhi Candidate 1
  if (candidateId.includes('candidate-1759217730559-1-')) return 1867;  // ujhi Candidate 2
  if (candidateId.includes('candidate-1759217730559-2-')) return 1270;  // ujhi Candidate 3
  if (candidateId.includes('candidate-1759217730559-3-')) return 863;   // ujhi Candidate 4
  
  // TestDataPanel candidates - extract candidate index and assign demo votes
  const testDataMatch = candidateId.match(/candidate-\d+-(\d+)-/);
  if (testDataMatch) {
    const candidateIndex = parseInt(testDataMatch[1]);
    // Generate demo vote counts based on candidate index (similar to frontend logic)
    const baseCounts = [6000, 1283, 872, 594, 404, 274, 187, 127, 87, 58, 39, 26, 17, 11, 8, 4, 3, 2, 1, 1, 1, 1];
    if (candidateIndex < baseCounts.length) {
      return baseCounts[candidateIndex];
    }
    return 1; // Default for candidates beyond the predefined list
  }
  
  // Legacy candidates
  const legacyBaseVoteCounts = {
    'candidate-1-0': 190,  // Wellness Coach
    'candidate-1-1': 184,  // Nutritionist  
    'candidate-1-2': 162   // Fitness Trainer (original count before vote reset)
  };
  
  // ✅ NEW: Generate random initial votes for unknown candidates (prevents showing 0)
  // This ensures all candidates have some base votes even if not pre-configured
  if (legacyBaseVoteCounts[candidateId]) {
    return legacyBaseVoteCounts[candidateId];
  }
  
  // Check if this candidate is stored in authoritative ledger
  // If not, give it a reasonable random base count
  console.log(`⚠️ [getBaseDemoCount] Unknown candidate ${candidateId}, should be initialized with votes in authoritative ledger`);
  return 0; // Return 0 to indicate candidate needs initialization
}

/**
 * Get topic vote totals from authoritative ledger
 * @param {string} topicId - Topic to get totals for
 * @returns {Object} Vote totals { totalVotes, candidates: Map }
 */
export async function getTopicVoteTotals(topicId) {
  const totals = topicVoteTotals.get(topicId);
  
  // Convert Map to Object for JSON serialization
  let candidatesObj = {};
  if (totals && totals.candidates instanceof Map) {
    for (const [candidateId, count] of totals.candidates.entries()) {
      candidatesObj[candidateId] = count;
    }
  } else if (totals) {
    candidatesObj = { ...totals.candidates };
  }
  
  // Get candidate data from vote service (primary source) and blockchain (backup)
  let blockchainCandidates = {};
  try {
    // First, try to get vote counts from vote service
    const voteService = await import('../vote-service/index.mjs');
    const voteServiceDefault = voteService.default;
    
    // Get all candidates for this channel from blockchain
    const { blockchain } = await import('../state/state.mjs');
    const allCandidateTransactions = blockchain.findTransactionsByType('candidate_created');
    console.log(`🔍 [VOTING ENGINE] Found ${allCandidateTransactions.length} total candidate transactions`);
    console.log(`🔍 [VOTING ENGINE] Looking for candidates with channelId: ${topicId}`);
    
    const candidateTransactions = allCandidateTransactions
      .filter(candidateTx => candidateTx.data.channelId === topicId);
    
    console.log(`🔍 [VOTING ENGINE] Found ${candidateTransactions.length} candidates for channel ${topicId}`);
    
    for (const candidateTx of candidateTransactions) {
      const candidateId = candidateTx.data.candidateId;
      
      // Try to get vote count from vote service first
      const voteServiceCount = voteServiceDefault.baseVoteCounts.get(candidateId);
      if (voteServiceCount !== undefined) {
        blockchainCandidates[candidateId] = voteServiceCount;
        console.log(`✅ [VOTING ENGINE] Loaded ${candidateId}: ${voteServiceCount} votes (from vote service)`);
      } else {
        // Fallback to blockchain initial votes
        const initialVotes = candidateTx.data.votes || 0;
        blockchainCandidates[candidateId] = initialVotes;
        console.log(`⚠️ [VOTING ENGINE] Loaded ${candidateId}: ${initialVotes} votes (from blockchain, not in vote service)`);
      }
    }
    
    console.log(`🔍 [VOTING ENGINE] Loaded ${Object.keys(blockchainCandidates).length} candidates (vote service + blockchain)`);
  } catch (error) {
    console.warn('⚠️ [VOTING ENGINE] Could not load blockchain candidates:', error.message);
  }
  
  // Legacy hardcoded base vote counts for backward compatibility
  const legacyBaseVoteCounts = {
    'candidate-1-0': 190,  // Wellness Coach
    'candidate-1-1': 184,  // Nutritionist  
    'candidate-1-2': 162,  // Fitness Trainer (original count before vote reset)
    // GlobalChannelRenderer fallback candidates for ujhi channel
    'candidate-1759217730559-0-3w99krs6u': 6000,  // ujhi Candidate 1
    'candidate-1759217730559-1-89lzy74ul': 1867,  // ujhi Candidate 2
    'candidate-1759217730559-2-c49j6z9na': 1270,  // ujhi Candidate 3
    'candidate-1759217730559-3-gay5s8a7d': 863    // ujhi Candidate 4
  };
  
  // Combine current votes with initial blockchain votes
  const finalCandidates = {};
  let finalTotalVotes = 0;
  
  // First, add all blockchain candidates with their INITIAL vote counts
  // Then use authoritativeVoteLedger for CURRENT votes (handles vote switching correctly)
  console.log(`🔍 [VOTING ENGINE] blockchainCandidates (initial):`, JSON.stringify(blockchainCandidates, null, 2));
  
  // Track which candidates are in blockchain
  const blockchainCandidateIds = new Set(Object.keys(blockchainCandidates));
  
  // Start with initial votes from blockchain (candidate creation)
  for (const [candidateId, initialVotes] of Object.entries(blockchainCandidates)) {
    finalCandidates[candidateId] = initialVotes;
  }
  
  // Now add/override with CURRENT votes from authoritativeVoteLedger
  // This is the REAL vote count that handles vote switching correctly
  const topicTotals = topicVoteTotals.get(topicId);
  if (topicTotals && topicTotals.candidates) {
    console.log(`🔍 [VOTING ENGINE] Using authoritativeVoteLedger for current votes`);
    
    // For each candidate with current votes, use that count
    for (const [candidateId, currentVotes] of topicTotals.candidates.entries()) {
      // 🎯 FIX: Return votes for ALL candidates in topicVoteTotals, not just blockchain/legacy
      // This ensures TestDataPanel channels show their initial votes
      finalCandidates[candidateId] = currentVotes;
      console.log(`🔍 [VOTING ENGINE] Candidate ${candidateId}: currentVotes=${currentVotes} (from authoritativeVoteLedger)`);
    }
    
    // Calculate total from final counts
    finalTotalVotes = Object.values(finalCandidates).reduce((sum, count) => sum + count, 0);
  } else {
    // No current votes yet, use initial votes only
    finalTotalVotes = Object.values(blockchainCandidates).reduce((sum, count) => sum + count, 0);
  }
  
  // Then, add any current votes for candidates not in blockchain (legacy support)
  for (const [candidateId, currentCount] of Object.entries(candidatesObj)) {
    if (!finalCandidates[candidateId]) {
      const legacyBaseCount = legacyBaseVoteCounts[candidateId] || 0;
      finalCandidates[candidateId] = legacyBaseCount + currentCount;
      finalTotalVotes += finalCandidates[candidateId];
    }
  }
  
  // Ensure all legacy candidates are represented even if they have no current votes
  for (const [candidateId, baseCount] of Object.entries(legacyBaseVoteCounts)) {
    if (!finalCandidates[candidateId]) {
      finalCandidates[candidateId] = baseCount;
      finalTotalVotes += baseCount;
    }
  }
  
  return {
    totalVotes: finalTotalVotes,
    candidates: finalCandidates,
    lastUpdated: totals ? totals.lastUpdated : null
  };
}

/**
 * Get candidate vote count from authoritative ledger
 * @param {string} topicId - Topic ID
 * @param {string} candidateId - Candidate ID
 * @returns {number} Vote count for the candidate
 */
export function getCandidateVoteCount(topicId, candidateId) {
  const totals = topicVoteTotals.get(topicId);
  if (!totals) return 0;
  
  return totals.candidates.get(candidateId) || 0;
}

/**
 * Get user's current vote for a topic
 * @param {string} userId - User ID
 * @param {string} topicId - Topic ID
 * @returns {Object|null} User's vote or null if not voted
 */
export function getUserVote(userId, topicId) {
  const userVotes = authoritativeVoteLedger.get(userId);
  if (!userVotes) return null;
  
  return userVotes.get(topicId) || null;
}

/**
 * Calculate reconciliation hash for audit purposes
 * @param {string} topicId - Topic ID
 * @returns {string} Hash of current vote state
 */
function calculateReconciliationHash(topicId) {
  const totals = topicVoteTotals.get(topicId);
  if (!totals) return 'empty';
  
  // Simple hash of total votes and candidate counts
  const candidateString = Array.from(totals.candidates.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, count]) => `${id}:${count}`)
    .join('|');
    
  return `${totals.totalVotes}#${candidateString}`;
}

/**
 * Verify topic reconciliation - ensure sum of candidates equals total votes
 * @param {string} topicId - Topic ID
 * @returns {Object} Reconciliation result
 */
export function verifyTopicReconciliation(topicId) {
  const totals = topicVoteTotals.get(topicId);
  if (!totals) {
    return { valid: true, message: 'No votes to reconcile' };
  }
  
  const candidateSum = Array.from(totals.candidates.values()).reduce((sum, count) => sum + count, 0);
  const isValid = candidateSum === totals.totalVotes;
  
  return {
    valid: isValid,
    totalVotes: totals.totalVotes,
    candidateSum,
    difference: candidateSum - totals.totalVotes,
    message: isValid ? 'Reconciliation passed' : `Reconciliation FAILED: difference of ${candidateSum - totals.totalVotes}`
  };
}

/**
 * Rebuild vote totals from authoritative ledger (migration/repair function)
 * @param {string} topicId - Topic ID to rebuild (optional, rebuilds all if not provided)
 * @returns {Object} Rebuild statistics
 */
export async function rebuildVoteTotalsFromLedger(topicId = null) {
  const stats = { rebuilt: 0, topics: [] };
  
  // Preserve existing base counts before rebuild - don't completely clear
  const preservedBaseCounts = new Map();
  
  if (topicId) {
    // Preserve base counts for specific topic
    const existingTotals = topicVoteTotals.get(topicId);
    if (existingTotals && existingTotals.candidates) {
      preservedBaseCounts.set(topicId, new Map(existingTotals.candidates));
    }
    topicVoteTotals.delete(topicId);
  } else {
    // Preserve base counts for all topics
    for (const [tid, totals] of topicVoteTotals.entries()) {
      if (totals.candidates) {
        preservedBaseCounts.set(tid, new Map(totals.candidates));
      }
    }
    topicVoteTotals.clear();
  }
  
  // First, initialize base vote counts for candidates from blockchain/legacy data
  try {
    // Get candidate data from vote service and blockchain
    const voteService = await import('../vote-service/index.mjs');
    const voteServiceDefault = voteService.default;
    
    // Get all candidates from blockchain
    const { blockchain } = await import('../state/state.mjs');
    const allCandidateTransactions = blockchain.findTransactionsByType('candidate_created');
    
    // Initialize base counts for blockchain candidates
    const candidateTransactions = topicId 
      ? allCandidateTransactions.filter(tx => tx.data.channelId === topicId)
      : allCandidateTransactions;
    
    for (const candidateTx of candidateTransactions) {
      const channelId = candidateTx.data.channelId;
      const candidateId = candidateTx.data.candidateId;
      
      // Initialize topic totals if needed
      if (!topicVoteTotals.has(channelId)) {
        topicVoteTotals.set(channelId, {
          totalVotes: 0,
          candidates: new Map(),
          lastUpdated: Date.now()
        });
        if (!stats.topics.includes(channelId)) {
          stats.topics.push(channelId);
        }
      }
      
      const totals = topicVoteTotals.get(channelId);
      
      // Get base vote count (preserved > vote service > blockchain initial votes)
      const preservedCount = preservedBaseCounts.get(channelId)?.get(candidateId);
      const voteServiceCount = voteServiceDefault.baseVoteCounts.get(candidateId);
      const baseVoteCount = preservedCount !== undefined ? preservedCount : 
                           (voteServiceCount !== undefined ? voteServiceCount : (candidateTx.data.votes || 0));
      
      // Initialize with base count (now preserves existing counts from addMockChannelDataToVoteSystem)
      totals.candidates.set(candidateId, baseVoteCount);
      totals.totalVotes += baseVoteCount;
      
      console.log(`🔧 [REBUILD] Initialized ${candidateId} with base count: ${baseVoteCount}`);
    }
    
    // Also initialize legacy base counts
    const legacyBaseVoteCounts = {
      'candidate-1-0': 190,  // Wellness Coach
      'candidate-1-1': 184,  // Nutritionist  
      'candidate-1-2': 162,  // Fitness Trainer
      // GlobalChannelRenderer fallback candidates for ujhi channel
      'candidate-1759217730559-0-3w99krs6u': 6000,  // ujhi Candidate 1
      'candidate-1759217730559-1-89lzy74ul': 1867,  // ujhi Candidate 2
      'candidate-1759217730559-2-c49j6z9na': 1270,  // ujhi Candidate 3
      'candidate-1759217730559-3-gay5s8a7d': 863    // ujhi Candidate 4
    };
    
    for (const [candidateId, baseCount] of Object.entries(legacyBaseVoteCounts)) {
      // Determine which topic this candidate belongs to
      let candidateTopicId = null;
      if (candidateId.startsWith('candidate-1759217730559-')) {
        candidateTopicId = '1759217730559'; // ujhi channel
      } else if (candidateId.startsWith('candidate-1-')) {
        candidateTopicId = '1'; // legacy channel
      }
      
      // Skip if rebuilding specific topic and this candidate doesn't belong to it
      if (topicId && candidateTopicId !== topicId) continue;
      
      if (candidateTopicId) {
        // Initialize topic if needed
        if (!topicVoteTotals.has(candidateTopicId)) {
          topicVoteTotals.set(candidateTopicId, {
            totalVotes: 0,
            candidates: new Map(),
            lastUpdated: Date.now()
          });
          if (!stats.topics.includes(candidateTopicId)) {
            stats.topics.push(candidateTopicId);
          }
        }
        
        const totals = topicVoteTotals.get(candidateTopicId);
        
        // Only set if not already initialized from blockchain
        if (!totals.candidates.has(candidateId)) {
          // Check preserved counts first, then use legacy base count
          const preservedCount = preservedBaseCounts.get(candidateTopicId)?.get(candidateId);
          const finalBaseCount = preservedCount !== undefined ? preservedCount : baseCount;
          
          totals.candidates.set(candidateId, finalBaseCount);
          totals.totalVotes += finalBaseCount;
          console.log(`🔧 [REBUILD] Initialized legacy ${candidateId} with base count: ${finalBaseCount}`);
        }
      }
    }
    
  } catch (error) {
    console.warn('⚠️ [REBUILD] Error initializing base counts:', error.message);
  }

  // Now rebuild user vote counts from authoritative ledger
  // We need to count UNIQUE users per candidate, not total votes per user
  const userVoteCounts = new Map(); // topicId -> candidateId -> Set of userIds
  
  for (const [userId, userTopics] of authoritativeVoteLedger.entries()) {
    for (const [currentTopicId, vote] of userTopics.entries()) {
      // Skip if rebuilding specific topic and this isn't it
      if (topicId && currentTopicId !== topicId) continue;
      
      // Track unique user votes per candidate
      if (!userVoteCounts.has(currentTopicId)) {
        userVoteCounts.set(currentTopicId, new Map());
      }
      const topicVotes = userVoteCounts.get(currentTopicId);
      
      if (!topicVotes.has(vote.candidateId)) {
        topicVotes.set(vote.candidateId, new Set());
      }
      topicVotes.get(vote.candidateId).add(userId);
      
      // Initialize topic totals if needed (shouldn't happen after base count initialization)
      if (!topicVoteTotals.has(currentTopicId)) {
        topicVoteTotals.set(currentTopicId, {
          totalVotes: 0,
          candidates: new Map(),
          lastUpdated: Date.now()
        });
        if (!stats.topics.includes(currentTopicId)) {
          stats.topics.push(currentTopicId);
        }
      }
    }
  }
  
  // Now apply the user vote counts to the initialized base counts
  for (const [currentTopicId, topicVotes] of userVoteCounts.entries()) {
    const totals = topicVoteTotals.get(currentTopicId);
    if (!totals) continue;
    
    for (const [candidateId, userSet] of topicVotes.entries()) {
      const userVoteCount = userSet.size; // Number of unique users who voted for this candidate
      
      // Get preserved base count first, then existing base count
      const preservedCount = preservedBaseCounts.get(currentTopicId)?.get(candidateId);
      const existingBaseCount = totals.candidates.get(candidateId) || 0;
      
      // Use preserved count if available, otherwise use existing base count
      const finalBaseCount = preservedCount !== undefined ? preservedCount : existingBaseCount;
      
      // For newly created candidates (not in blockchain/legacy), preserve their existing count
      if (preservedCount !== undefined && userVoteCount > 0) {
        // This candidate had existing votes before rebuild - keep those and don't add user votes again
        // The preserved count already includes all previous processing
        totals.candidates.set(candidateId, preservedCount);
        console.log(`🔧 [REBUILD] Preserved existing total for ${candidateId}: ${preservedCount} (no double-counting)`);
      } else {
        // Standard case: base count + user votes
        totals.candidates.set(candidateId, finalBaseCount + userVoteCount);
        console.log(`🔧 [REBUILD] Final count for ${candidateId}: ${finalBaseCount} (base) + ${userVoteCount} (users) = ${finalBaseCount + userVoteCount}`);
        stats.rebuilt += userVoteCount;
      }
    }
    
    // Recalculate total votes for the topic
    let finalTotalVotes = 0;
    for (const count of totals.candidates.values()) {
      finalTotalVotes += count;
    }
    totals.totalVotes = finalTotalVotes;
  }
  
  voteLogger.info('Vote totals rebuilt from authoritative ledger', stats);
  return stats;
}

/**
 * Get audit log entries for a topic
 * @param {string} topicId - Topic ID
 * @param {number} limit - Maximum number of entries to return
 * @returns {Array} Audit log entries
 */
export function getAuditLog(topicId = null, limit = 100) {
  let filteredLog = voteAuditLog;
  
  if (topicId) {
    filteredLog = voteAuditLog.filter(entry => entry.topicId === topicId);
  }
  
  return filteredLog
    .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
    .slice(0, limit);
}

/**
 * Get vote results for a topic
 * @param {string} topic - Topic to get results for
 * @returns {Object} Vote results
 */
export function getVoteResults(topic) {
  if (!voteCounts[topic]) return { local: {}, foreign: {} };
  return voteCounts[topic];
}

/**
 * Get filtered vote results
 * @param {string} topic - Topic to get results for
 * @param {Object} filters - Filter criteria
 */
export function getFilteredVoteResults(topic, filters = {}) {
  const results = getVoteResults(topic);
  const filtered = { local: {}, foreign: {} };

  for (const category of ['local', 'foreign']) {
    for (const voteType in results[category]) {
      if (filters.voteType && voteType !== filters.voteType) continue;
      
      filtered[category][voteType] = {};
      for (const choice in results[category][voteType]) {
        if (filters.minVotes && results[category][voteType][choice] < filters.minVotes) continue;
        filtered[category][voteType][choice] = results[category][voteType][choice];
      }
    }
  }

  return filtered;
}

/**
 * Update vote stability tracking
 * @param {string} topic - Topic to update
 */
function updateVoteStability(topic) {
  const results = getVoteResults(topic);
  const localVotes = results.local;
  
  // Find current leader
  let maxVotes = 0;
  let leader = null;
  
  for (const voteType in localVotes) {
    for (const choice in localVotes[voteType]) {
      if (localVotes[voteType][choice] > maxVotes) {
        maxVotes = localVotes[voteType][choice];
        leader = choice;
      }
    }
  }
  
  const stability = voteStabilityTracker.get(topic) || {
    leader: null,
    since: Date.now(),
    isStable: false
  };
  
  if (leader !== stability.leader) {
    stability.leader = leader;
    stability.since = Date.now();
    stability.isStable = false;
  } else if (!stability.isStable && Date.now() - stability.since > 5000) {
    stability.isStable = true;
  }
  
  voteStabilityTracker.set(topic, stability);
}

/**
 * Get vote status including stability
 * @param {string} topic - Topic to check
 */
export function getVoteStatus(topic) {
  const results = getVoteResults(topic);
  const localVotes = results.local || {};
  const foreignVotes = results.foreign || {};

  // Calculate total votes
  let totalLocalVotes = 0;
  let totalForeignVotes = 0;

  for (const voteType in localVotes) {
    for (const choice in localVotes[voteType]) {
      totalLocalVotes += localVotes[voteType][choice];
    }
  }

  for (const voteType in foreignVotes) {
    for (const choice in foreignVotes[voteType]) {
      totalForeignVotes += foreignVotes[voteType][choice];
    }
  }

  return {
    active: true,
    totalVotes: totalLocalVotes + totalForeignVotes,
    localVotes: totalLocalVotes,
    foreignVotes: totalForeignVotes,
    lastVoteTime: Date.now()
  };
}

/**
 * Calculate candidate rankings for a topic
 * @param {string} topic - Topic to calculate rankings for
 * @returns {Array} Array of candidates sorted by vote count
 */
async function calculateRankings(topic) {
  // Use the new authoritative vote totals system
  const voteTotals = await getTopicVoteTotals(topic);
  const candidates = [];
  
  // Convert candidates object to array and sort by vote count
  for (const [candidateId, voteCount] of Object.entries(voteTotals.candidates)) {
    candidates.push({
      candidateId: candidateId,
      voteCount: voteCount,
      position: 0 // Will be set after sorting
    });
  }
  
  // Sort by vote count (descending) and assign positions
  candidates.sort((a, b) => b.voteCount - a.voteCount);
  candidates.forEach((candidate, index) => {
    candidate.position = index + 1;
  });
  
  return candidates;
}

/**
 * Broadcast vote update to clients
 * @param {string} topic - Topic that was updated
 */
async function broadcastVoteUpdate(topic) {
  // Use the new authoritative vote totals system instead of the old voteCounts
  const voteTotals = await getTopicVoteTotals(topic);
  const rankings = await calculateRankings(topic);
  
  // Create rankings lookup for easy access
  const rankingsLookup = {};
  rankings.forEach(candidate => {
    rankingsLookup[candidate.candidateId] = {
      voteCount: candidate.voteCount,
      position: candidate.position
    };
  });
  
  const updateData = {
    type: 'vote-update',
    data: {
      topic,
      topicId: topic,
      results: voteTotals,
      status: {
        active: true,
        totalVotes: voteTotals.totalVotes,
        lastVoteTime: voteTotals.lastUpdated || Date.now()
      },
      rankings: rankingsLookup,
      timestamp: Date.now()
    }
  };
  
  // Handle vote broadcast based on channel privacy mode
  if (isChannelPrivate(topic)) {
    // Private channel - use encrypted broadcast
    await handleEncryptedVoteBroadcast(topic, updateData, voteTotals);
  } else {
    // Public channel - use unencrypted broadcast for transparency
    await broadcastToWebSocket(updateData, topic, voteTotals, 'public');
    voteLogger.info('🌐 Public channel vote update broadcasted (unencrypted for transparency)', {
      topic,
      totalVotes: voteTotals.totalVotes
    });
  }
}

/**
 * Revoke a vote, removing it from state
 * @param {string} publicKey - Voter's public key
 * @param {string} topic - Topic to revoke vote for
 * @param {Object} voteData - Optional vote data for test markers
 * @returns {Promise<Object>} Revocation result
 */
export async function revokeVote(publicKey, topic, voteData = {}) {
  const userVote = getUserVote(publicKey, topic);
  if (!userVote) {
    return false;
  }

  const { voteType, choice, reliability = 1.0, region } = userVote;
  const topicRegion = getTopicRegion(topic);
  const isLocalVote = region === topicRegion;
  const voteCategory = isLocalVote ? 'local' : 'foreign';

  // Remove vote from counts
  if (voteCounts[topic] && 
      voteCounts[topic][voteCategory] && 
      voteCounts[topic][voteCategory][voteType] && 
      voteCounts[topic][voteCategory][voteType][choice]) {
    
    voteCounts[topic][voteCategory][voteType][choice] -= reliability;
    if (voteCounts[topic][voteCategory][voteType][choice] <= 0) {
      delete voteCounts[topic][voteCategory][voteType][choice];
    }
    
    // Update total votes
    voteCounts[topic].totalVotes = Math.max(0, (voteCounts[topic].totalVotes || 0) - reliability);
  }

  // Remove from user's record
  const userRecord = userVotes.get(publicKey);
  if (userRecord && userRecord[topic]) {
    delete userRecord[topic];
    if (Object.keys(userRecord).length === 0) {
      userVotes.delete(publicKey);
    }
  }

  // Record revocation in blockchain with test data markers
  await recordVoteRevocationInBlockchain(publicKey, topic, voteData);

  // Broadcast update
  await broadcastVoteUpdate(topic);

  return true;
}

/**
 * @deprecated - Record a vote in the blockchain (DEPRECATED: now using Git/Relay)
 * @private
 */
async function recordVoteInBlockchain(publicKey, topic, voteType, choice, reliability, region, voteData = {}) {
  voteLogger.warn('recordVoteInBlockchain called but is deprecated - votes now commit to Git');
  return { success: false, message: 'Blockchain replaced by Git/Relay' };
}

/**
 * @deprecated - Record a vote revocation in the blockchain (DEPRECATED: now using Git/Relay)
 * @private
 */
async function recordVoteRevocationInBlockchain(publicKey, topic, voteData = {}) {
  voteLogger.warn('recordVoteRevocationInBlockchain called but is deprecated - revocations now commit to Git');
  return { success: false, message: 'Blockchain replaced by Git/Relay' };
}

/**
 * Get vote tallies for all topics or a specific topic
 * @param {string} specificTopic - Specific topic to get tallies for (optional)
 * @returns {Object} Vote tallies
 */
export function getVoteTallies(specificTopic = null) {
  if (specificTopic) {
    return voteCounts[specificTopic] || {};
  }
  return { ...voteCounts };
}

/**
 * Get detailed vote tallies for a topic (internal use)
 * @param {string} topic - Topic to get tallies for
 * @returns {Object} Vote tallies with detailed breakdown
 */
function getVoteTalliesDetailed(topic) {
  if (!voteCounts[topic]) {
    return { tallies: {}, total: 0 };
  }
  
  const result = {
    tallies: {},
    total: 0
  };
  
  // Calculate totals for each vote type across local and foreign regions
  const topicData = voteCounts[topic];
  
  // Process both local and foreign vote data
  for (const region of ['local', 'foreign']) {
    if (topicData[region]) {
      for (const [voteType, choices] of Object.entries(topicData[region])) {
        if (!result.tallies[voteType]) {
          result.tallies[voteType] = {
            choices: {},
            typeTotal: 0
          };
        }
        
        for (const [choice, count] of Object.entries(choices)) {
          if (!result.tallies[voteType].choices[choice]) {
            result.tallies[voteType].choices[choice] = 0;
          }
          result.tallies[voteType].choices[choice] += count;
          result.tallies[voteType].typeTotal += count;
          result.total += count;
        }
      }
    }
  }
  
  return result;
}

/**
 * Reset all votes (for testing purposes)
 */
export function resetVotes() {
  Object.keys(voteCounts).forEach(key => {
    delete voteCounts[key];
  });
  userVotes.clear();
  voteLogger.warn('All votes reset');
}

/**
 * Get paginated and filtered vote results
 * @param {string} topic - The topic to get results for
 * @param {Object} options - Pagination and filtering options
 * @returns {Object} Paginated and filtered vote results
 */
export async function getVoteResultsWithFilters(topic, page = 1, limit = 20, filters = {}) {
  try {
    // Convert traditional parameters to the options format for getFilteredVoteResults
    const options = {
      page,
      limit,
      ...filters
    };
    
    // Use the main filter function
    const results = await getFilteredVoteResults(topic, options);
    
    // Enhance with additional statistics and return in expected format
    return {
      data: results.results || [],
      pagination: results.pagination || { page, limit, total: 0, totalPages: 0 },
      statistics: {
        votingDistribution: calculateVotingDistribution(topic),
        topChoices: getTopChoices(topic, 5),
        votingTrends: getVotingTrends(topic)
      }
    };
  } catch (error) {
    logger.error('Error getting detailed vote results', { error, topic, page, limit, filters });
    throw new Error(`Failed to get detailed vote results: ${error.message}`);
  }
}

/**
 * Calculate vote distribution across different types
 */
function calculateVotingDistribution(topic) {
  const distribution = {};
  const typeData = voteCounts[topic] || {};
  
  for (const [type, choices] of Object.entries(typeData)) {
    distribution[type] = Object.values(choices).reduce((sum, count) => sum + count, 0);
  }
  
  return distribution;
}

/**
 * Get top N choices by vote count
 */
function getTopChoices(topic, n = 5) {
  const allChoices = [];
  const typeData = voteCounts[topic] || {};
  
  for (const [type, choices] of Object.entries(typeData)) {
    for (const [choice, count] of Object.entries(choices)) {
      allChoices.push({ type, choice, count });
    }
  }
  
  return allChoices
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/**
 * Get voting trends (stub - would require historical data)
 */
function getVotingTrends(topic) {
  // This would require historical data which we don't track in this implementation
  // In a real system, we'd pull trend data from a time-series database
  return {
    lastHour: Math.floor(Math.random() * 100),
    lastDay: Math.floor(Math.random() * 500),
    lastWeek: Math.floor(Math.random() * 2000)
  };
}

/**
 * Handler for processing vote submissions
 * Validates the vote, stores it, and broadcasts updates
 * 
 * @param {Object} voteData - The vote data from the client
 * @param {string} voteData.topicId - The topic being voted on
 * @param {string} voteData.candidateId - The selected candidate
 * @param {string} voteData.publicKey - Voter's public key
 * @param {string} voteData.signature - Cryptographic signature of the vote
 * @param {number} voteData.timestamp - When the vote was created
 * @returns {Promise<Object>} Result of the vote processing
 */
/**
 * Process vote handler - Entry point for vote submissions
 * Updated to use atomic vote switching with single source of truth
 * @param {Object} voteData - Vote submission data
 * @param {string} voteData.publicKey - Voter's public key (used as userId)
 * @param {string} voteData.topic - Topic being voted on
 * @param {string} voteData.choice - Candidate ID being voted for
 * @param {string} voteData.voteType - Type of vote (for compatibility)
 * @param {number} voteData.reliability - Reliability score (optional)
 * @returns {Promise<Object>} Result of the vote processing
 */
export async function processVoteHandler(voteData) {
  try {
    // Extract and validate vote data
    const { publicKey, topic, choice, voteType = 'candidate', reliability = 1.0 } = voteData;
    
    if (!publicKey) throw new Error('Public key (userId) is required');
    if (!topic) throw new Error('Topic ID is required');
    if (!choice) throw new Error('Candidate choice is required');
    
    voteLogger.info('Processing vote submission', { 
      userId: publicKey, 
      topicId: topic, 
      candidateId: choice,
      voteType 
    });
    
    // Use the new atomic vote processing system
    // Note: Git commit now happens inside processVote() via commitVoteEventToRelay()
    const result = await processVote(publicKey, topic, voteType, choice, reliability, voteData);
    
    // Broadcast update (optional: can be replaced with client polling)
    // TODO: Remove websocket dependency entirely - use polling instead
    if (typeof broadcastVoteUpdate === 'function') {
      broadcastVoteUpdate(topic);
    }
    
    voteLogger.info('Vote processed successfully', {
      userId: publicKey,
      topicId: topic,
      candidateId: choice,
      action: result.action,
      totalVotes: result.voteTotals.totalVotes
    });
    
    return {
      success: true,
      message: "Vote processed successfully",
      result,
      voteTotals: result.voteTotals,
      reconciliation: result.reconciliation
    };
    
  } catch (error) {
    voteLogger.error('Error processing vote submission', { 
      error: error.message, 
      voteData: {
        publicKey: voteData.publicKey,
        topic: voteData.topic,
        choice: voteData.choice,
        voteType: voteData.voteType
      },
      stack: error.stack
    });
    
    // Re-throw with enhanced error information
    throw new Error(`Vote processing failed: ${error.message}`);
  }
}

/**
 * Voting engine class - manages voting logic and data
 */
export class VotingEngine {
  /**
   * Get votes with optional filters
   * @param {Object} filters - Filters for fetching votes
   * @returns {Promise<Array>} List of votes
   */
  async getVotes(filters = {}) {
    try {
      // Get all relevant votes (existing code)
      let votes = await this.fetchVotes(filters);
      
      // Apply region filtering if needed (existing code)
      if (filters.regionFilter) {
        votes = this.applyRegionFilter(votes, filters.regionFilter);
      }
      
      // Apply activity filtering if specified
      if (filters.activityFilter && filters.activityFilter.minPercentile > 0) {
        votes = voteProcessor.filterVotesByActivity(
          votes, 
          filters.activityFilter.minPercentile
        );
      }
      
      return votes;
    } catch (error) {
      logger.error('Error getting votes', { filters, error });
      throw error;
    }
  }
  
  /**
   * Get activity statistics for a list of vote IDs
   * @param {Array<string>} voteIds - List of vote IDs
   * @returns {Promise<Object>} Activity statistics
   */
  async getVoteActivityStats(voteIds) {
    try {
      const votes = await this.fetchVotesByIds(voteIds);
      
      // Get activity metrics for comparison
      const activityMetrics = await activityAnalysisService.getActivityMetrics();
      
      // Calculate activity distribution
      const distribution = {
        active: 0,
        inactive: 0,
        percentileBreakdown: {
          10: 0, 20: 0, 30: 0, 40: 0, 50: 0,
          60: 0, 70: 0, 80: 0, 90: 0, 100: 0
        }
      };
      
      votes.forEach(vote => {
        const percentile = vote.metadata?.activity?.percentile || 0;
        const isActive = vote.metadata?.activity?.isActive || false;
        
        // Update active/inactive counts
        if (isActive) {
          distribution.active++;
        } else {
          distribution.inactive++;
        }
        
        // Update percentile breakdown
        for (let i = 10; i <= 100; i += 10) {
          if (percentile <= i) {
            distribution.percentileBreakdown[i]++;
            break;
          }
        }
      });
      
      return {
        distribution,
        totalVotes: votes.length,
        activityMetrics: {
          average: activityMetrics.averageMonthlyActivity,
          standardDeviation: activityMetrics.standardDeviation
        }
      };
    } catch (error) {
      logger.error('Error getting vote activity stats', { voteIds, error });
      throw error;
    }
  }
}

/**
 * Get topic status with comprehensive information
 * @param {string} topic - Topic to check
 * @returns {Object} Topic status
 */
export function getTopicStatus(topic) {
  const results = getVoteResults(topic);
  const localVotes = results.local || {};
  const foreignVotes = results.foreign || {};
  const topicData = voteCounts[topic] || {};

  // Calculate total votes
  let totalLocalVotes = 0;
  let totalForeignVotes = 0;

  for (const voteType in localVotes) {
    for (const choice in localVotes[voteType]) {
      totalLocalVotes += localVotes[voteType][choice];
    }
  }

  for (const voteType in foreignVotes) {
    for (const choice in foreignVotes[voteType]) {
      totalForeignVotes += foreignVotes[voteType][choice];
    }
  }

  return {
    active: topicData.active !== false,
    totalVotes: totalLocalVotes + totalForeignVotes,
    localVotes: totalLocalVotes,
    foreignVotes: totalForeignVotes,
    lastVoteTime: topicData.lastVoteTime || Date.now(),
    region: getTopicRegion(topic)
  };
}

/**
 * Get rankings for a category
 * @param {string} category - Category to get rankings for (global, regional, personal)
 * @param {number} limit - Maximum number of results to return
 * @param {string} region - Optional region filter
 * @returns {Promise<Object>} Rankings data
 */
export async function getRankings(category, limit = 20, region = null) {
  try {
    const rankings = [];
    
    // Get all topics with vote counts
    for (const [topic, topicData] of Object.entries(voteCounts)) {
      if (!topicData.active) continue;
      
      const topicRegion = getTopicRegion(topic);
      
      // Apply region filter if specified
      if (region && topicRegion !== region) continue;
      
      // Calculate total votes for ranking
      let totalVotes = 0;
      const localVotes = topicData.local || {};
      const foreignVotes = topicData.foreign || {};
      
      // Sum up all votes for this topic
      for (const voteType in localVotes) {
        for (const choice in localVotes[voteType]) {
          totalVotes += localVotes[voteType][choice];
        }
      }
      
      for (const voteType in foreignVotes) {
        for (const choice in foreignVotes[voteType]) {
          totalVotes += foreignVotes[voteType][choice];
        }
      }
      
      if (totalVotes > 0) {
        rankings.push({
          topic,
          totalVotes,
          region: topicRegion,
          lastVoteTime: topicData.lastVoteTime || Date.now(),
          voteBreakdown: {
            local: localVotes,
            foreign: foreignVotes
          }
        });
      }
    }
    
    // Sort by total votes (descending) and limit results
    return rankings
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .slice(0, limit);
      
  } catch (error) {
    voteLogger.error('Error getting rankings', { error: error.message, category, region });
    return [];
  }
}

/**
 * Migrate session vote data to authoritative vote system
 * This function transfers existing vote data from session-votes.json to the authoritative system
 * @param {Object} sessionVoteData - Vote data from session-votes.json
 */
export function migrateSessionVotesToAuthoritative(sessionVoteData) {
  console.log('🔄 Migrating session vote data to authoritative vote system...');
  
  if (!sessionVoteData || !sessionVoteData.voteCounts) {
    console.warn('No session vote data found for migration');
    return { migrated: 0, topics: [] };
  }

  const stats = { migrated: 0, topics: [] };

  for (const [topicId, topicData] of Object.entries(sessionVoteData.voteCounts)) {
    if (!topicData.candidates || !topicData.totalVotes) {
      console.warn(`Topic ${topicId} has no vote data, skipping`);
      continue;
    }

    // Initialize topic totals
    const topicTotals = {
      totalVotes: topicData.totalVotes,
      candidates: new Map(),
      lastUpdated: sessionVoteData.timestamp || Date.now()
    };

    let userCount = 0;

    // Process each candidate's votes
    for (const [candidateId, voteCount] of Object.entries(topicData.candidates)) {
      if (voteCount > 0) {
        // Add candidate votes to topic totals
        topicTotals.candidates.set(candidateId, voteCount);

        // Create synthetic users for each vote to populate the authoritative ledger
        for (let i = 0; i < voteCount; i++) {
          const userId = `session-migrated-${topicId}-${candidateId}-${i}`;
          
          // Add to authoritative ledger
          if (!authoritativeVoteLedger.has(userId)) {
            authoritativeVoteLedger.set(userId, new Map());
          }
          
          const userVotes = authoritativeVoteLedger.get(userId);
          userVotes.set(topicId, {
            candidateId,
            timestamp: sessionVoteData.timestamp || Date.now(),
            reliability: 1.0,
            voteType: 'FOR',
            source: 'session-migration'
          });
          
          userCount++;
        }
      }
    }

    // Store topic totals in cache
    topicVoteTotals.set(topicId, topicTotals);
    stats.migrated += userCount;
    stats.topics.push(topicId);
    
    console.log(`✅ Migrated topic ${topicId}: ${topicTotals.totalVotes} votes across ${Object.keys(topicData.candidates).length} candidates`);
  }

  console.log(`🎯 Session vote migration complete: ${stats.migrated} votes across ${stats.topics.length} topics`);
  return stats;
}

/**
 * Add mock channel data directly to the authoritative vote system
 * This function bypasses normal vote processing to add pre-generated mock data
 * @param {Object} channelData - Channel data with candidates and vote counts
 */
export async function addMockChannelDataToVoteSystem(channelData) {
  console.log(`🔄 Adding mock channel data to authoritative vote system: ${channelData.id}`);
  
  if (!channelData.candidates || !Array.isArray(channelData.candidates)) {
    console.warn(`Channel ${channelData.id} has no candidates, skipping`);
    return { success: false, reason: 'No candidates' };
  }

  const topicId = channelData.id;
  
  // Initialize topic totals
  const topicTotals = {
    totalVotes: 0,
    candidates: new Map(),
    lastUpdated: Date.now()
  };

  let totalUsersAdded = 0;
  let totalVotersWithLocations = 0;

  // Import location service to add voter locations
  let setMockUserLocation = null;
  try {
    const locationModule = await import('../services/userLocationService.mjs');
    setMockUserLocation = locationModule.setMockUserLocation;
  } catch (error) {
    console.warn('⚠️ Could not import userLocationService, voters will not have locations:', error.message);
  }

  // Process each candidate's votes
  channelData.candidates.forEach((candidate) => {
    const candidateId = candidate.id;
    // Check multiple vote properties: votes, initialVotes, blockchainVotes
    const voteCount = candidate.votes || candidate.initialVotes || candidate.blockchainVotes || 0;
    console.log(`🔍 [VOTE INIT] Candidate ${candidateId}: votes=${candidate.votes}, initialVotes=${candidate.initialVotes}, blockchainVotes=${candidate.blockchainVotes} → using voteCount=${voteCount}`);
    
    if (voteCount > 0) {
      // Add candidate votes to topic totals
      topicTotals.candidates.set(candidateId, voteCount);
      topicTotals.totalVotes += voteCount;

      // Get candidate location for voter clustering
      const candidateLat = candidate.location?.lat || candidate.lat || 0;
      const candidateLng = candidate.location?.lng || candidate.lng || 0;
      const candidateCountry = candidate.country || candidate.countryName || 'Global';
      const candidateProvince = candidate.province || candidate.provinceName || 'Unknown';

      // Create synthetic users for each vote to populate the authoritative ledger
      for (let i = 0; i < voteCount; i++) {
        const userId = `mock-user-${topicId}-${candidateId}-${i}`;
        
        // Add to authoritative ledger
        if (!authoritativeVoteLedger.has(userId)) {
          authoritativeVoteLedger.set(userId, new Map());
        }
        
        const userVotes = authoritativeVoteLedger.get(userId);
        userVotes.set(topicId, {
          candidateId,
          timestamp: Date.now() - (Math.random() * 86400000), // Random timestamp within last day
          reliability: 1.0,
          voteType: 'FOR'
        });
        
        // Generate realistic voter location near candidate
        if (setMockUserLocation && candidateLat !== 0 && candidateLng !== 0) {
          // Generate voter location within ~50km radius of candidate
          const radiusInDegrees = 0.5; // ~50km
          const angle = Math.random() * 2 * Math.PI;
          const distance = Math.random() * radiusInDegrees;
          
          const voterLat = candidateLat + (distance * Math.cos(angle));
          const voterLng = candidateLng + (distance * Math.sin(angle));
          
          // Directly set location in userLocations Map (bypassing GPS verification for mock data)
          const locationData = {
            lat: voterLat,
            lng: voterLng,
            country: candidateCountry,
            countryCode: candidate.countryCode || 'XX',
            province: candidateProvince,
            provinceCode: candidate.provinceCode || 'XX',
            city: `City-${Math.floor(Math.random() * 100)}`,
            cityCode: `CTY${Math.floor(Math.random() * 1000)}`,
            verificationMethod: 'mock', // Mark as mock data
            lastVerified: Date.now(),
            accuracy: 10, // 10 meter accuracy
            isMockData: true
          };
          
          try {
            setMockUserLocation(userId, locationData);
            totalVotersWithLocations++;
          } catch (error) {
            console.warn(`⚠️ Could not set location for ${userId}:`, error.message);
          }
        }
        
        totalUsersAdded++;
      }
    }
  });

  // Store topic totals in cache
  topicVoteTotals.set(topicId, topicTotals);
  
  // Add audit log entry for mock data addition
  voteAuditLog.push({
    timestamp: Date.now(),
    userId: 'system',
    topicId,
    action: 'MOCK_DATA_ADDED',
    oldCandidateId: null,
    newCandidateId: null,
    metadata: {
      source: 'dev-center-channel-generator',
      candidateCount: channelData.candidates.length,
      totalVotes: topicTotals.totalVotes,
      syntheticUsers: totalUsersAdded
    }
  });
  
  console.log(`✅ Mock channel ${topicId} added to authoritative system: ${topicTotals.totalVotes} votes, ${totalUsersAdded} synthetic users, ${totalVotersWithLocations} with locations`);
  
  return {
    topicId,
    totalVotes: topicTotals.totalVotes,
    candidateCount: channelData.candidates.length,
    syntheticUsers: totalUsersAdded,
    votersWithLocations: totalVotersWithLocations
  };
}

// Export functions for external use (no longer needed since functions are exported directly)

// Export the cache for debugging/testing purposes
export { topicVoteTotals };

export default new VotingEngine();

