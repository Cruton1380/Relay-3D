// backend/routes/commitBoundary.mjs
/**
 * Commit Boundary API Routes
 * 
 * Implements Phase 1 - Deliverable A: Commit Boundary (Principle 1)
 * 
 * Endpoints:
 * - POST /api/state/transition - Advance state (DRAFT→HOLD→PROPOSE→COMMIT→REVERT)
 * - POST /api/dialogue/message - Ephemeral coordination (cannot change state)
 * - GET /api/state/:objectId - Get current state of an object
 * - GET /api/state/:objectId/history - Get state transition history
 * - GET /api/state/:objectId/next-states - Get allowed next states
 */

import { Router } from 'express';
import {
  validateStateTransition,
  validateTransitionAuthority,
  canTransition,
  createStateTransitionCommit,
  getStateName,
  getNextStates
} from '../commitTypes/stateTransition.mjs';
import {
  validateDialogue,
  createDialogueCommit,
  isExpired,
  cleanupExpired
} from '../commitTypes/dialogue.mjs';
import {
  enforceCommitBoundary,
  enforceDialogueOnlyRoutes
} from '../governance/noDialogueStateChange.mjs';
import {
  resolveAuthority,
  hasCapability
} from '../governance/authorityResolver.mjs';

const router = Router();

// In-memory storage (replace with database in production)
const stateStore = new Map(); // objectId → current state
const commitHistory = []; // All commits (append-only)
const dialogueStore = []; // Ephemeral dialogue commits

/**
 * POST /api/state/transition
 * Advance an object through state gates
 * 
 * Body:
 * {
 *   object_id: string,
 *   object_type: string,
 *   from_state: string,
 *   to_state: string,
 *   authority_ref: string,
 *   evidence_refs: [string],
 *   reason: string,
 *   signature?: string (required for COMMIT/REVERT)
 * }
 */
router.post('/transition', enforceCommitBoundary, (req, res) => {
  const {
    object_id,
    object_type,
    from_state,
    to_state,
    authority_ref,
    evidence_refs = [],
    reason,
    signature
  } = req.body;
  
  // Check if object exists and current state matches
  const currentState = stateStore.get(object_id);
  if (currentState && currentState !== from_state) {
    return res.status(409).json({
      error: 'STATE_CONFLICT',
      message: `Object is in state ${currentState}, not ${from_state}`,
      current_state: currentState
    });
  }
  
  // Check if transition is allowed
  const transitionCheck = canTransition(from_state, to_state, authority_ref, evidence_refs);
  if (!transitionCheck.canTransition) {
    return res.status(403).json({
      error: 'TRANSITION_NOT_ALLOWED',
      message: transitionCheck.reason,
      from_state,
      to_state
    });
  }
  
  // ═══════════════════════════════════════════════════════════
  // AUTHORITY RESOLUTION (Principle 4: No Hidden Authority)
  // ═══════════════════════════════════════════════════════════
  // Create temporary commit for authority validation
  const tempCommit = {
    type: 'STATE_TRANSITION',
    object_id,
    object_type,
    from_state,
    to_state,
    authority_ref,
    evidence_refs,
    reason,
    timestamp_ms: Date.now()
  };
  
  // Validate authority (uses authorityResolver to check capability chain)
  const authValidation = validateTransitionAuthority(tempCommit);
  
  if (!authValidation.authorized) {
    return res.status(403).json({
      error: 'AUTHORITY_NOT_DISCOVERABLE',
      message: authValidation.reason,
      authority_ref,
      required_capability: authValidation.required_capability,
      granted_capabilities: authValidation.granted_capabilities || [],
      constitutional_violation: 'Principle 4: All authority is discoverable'
    });
  }
  
  // Create STATE_TRANSITION commit
  const commit = createStateTransitionCommit({
    from_state,
    to_state,
    authority_ref,
    evidence_refs,
    reason,
    object_id,
    object_type,
    signature
  });
  
  // Validate commit
  const validation = validateStateTransition(commit);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'INVALID_COMMIT',
      message: validation.reason
    });
  }
  
  // Store commit (append-only)
  commitHistory.push(commit);
  
  // Update current state
  stateStore.set(object_id, to_state);
  
  res.status(200).json({
    success: true,
    commit,
    new_state: to_state,
    message: `Transitioned from ${from_state} to ${to_state}`
  });
});

/**
 * POST /api/dialogue/message
 * Send ephemeral coordination message (cannot change state)
 * 
 * Body:
 * {
 *   content: string,
 *   participant_ids: [string],
 *   context_ref: string,
 *   retention_window_hours?: number
 * }
 */
router.post('/message', enforceDialogueOnlyRoutes, (req, res) => {
  const {
    content,
    participant_ids = [],
    context_ref,
    retention_window_hours
  } = req.body;
  
  if (!content || !context_ref) {
    return res.status(400).json({
      error: 'MISSING_REQUIRED_FIELDS',
      message: 'content and context_ref are required'
    });
  }
  
  // Create DIALOGUE commit
  const commit = createDialogueCommit({
    content,
    participant_ids,
    context_ref,
    retention_window_hours
  });
  
  // Validate
  const validation = validateDialogue(commit);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'INVALID_DIALOGUE',
      message: validation.reason
    });
  }
  
  // Store ephemeral dialogue
  dialogueStore.push(commit);
  
  // Cleanup expired dialogues
  const cleaned = cleanupExpired(dialogueStore);
  dialogueStore.length = 0;
  dialogueStore.push(...cleaned);
  
  res.status(200).json({
    success: true,
    commit_id: commit.commit_id,
    expires_at: new Date(commit.expiry_timestamp_ms).toISOString(),
    message: 'Dialogue message stored (ephemeral)'
  });
});

/**
 * GET /api/state/:objectId
 * Get current state of an object
 */
router.get('/:objectId', (req, res) => {
  const { objectId } = req.params;
  
  const currentState = stateStore.get(objectId);
  if (!currentState) {
    return res.status(404).json({
      error: 'OBJECT_NOT_FOUND',
      message: `No state found for object ${objectId}`
    });
  }
  
  // Get last transition commit
  const lastCommit = commitHistory
    .filter(c => c.object_id === objectId)
    .slice(-1)[0];
  
  res.status(200).json({
    object_id: objectId,
    current_state: currentState,
    state_name: getStateName(currentState),
    last_transition: lastCommit,
    next_possible_states: getNextStates(currentState)
  });
});

/**
 * GET /api/state/:objectId/history
 * Get state transition history for an object
 */
router.get('/:objectId/history', (req, res) => {
  const { objectId } = req.params;
  
  const history = commitHistory.filter(c => c.object_id === objectId);
  
  if (history.length === 0) {
    return res.status(404).json({
      error: 'NO_HISTORY',
      message: `No state history found for object ${objectId}`
    });
  }
  
  res.status(200).json({
    object_id: objectId,
    transition_count: history.length,
    history: history.map(c => ({
      commit_id: c.commit_id,
      from_state: c.from_state,
      to_state: c.to_state,
      authority_ref: c.authority_ref,
      reason: c.reason,
      timestamp: new Date(c.timestamp_ms).toISOString()
    }))
  });
});

/**
 * GET /api/state/:objectId/next-states
 * Get allowed next states for an object
 */
router.get('/:objectId/next-states', (req, res) => {
  const { objectId } = req.params;
  
  const currentState = stateStore.get(objectId);
  if (!currentState) {
    return res.status(404).json({
      error: 'OBJECT_NOT_FOUND',
      message: `No state found for object ${objectId}`
    });
  }
  
  const nextStates = getNextStates(currentState);
  
  res.status(200).json({
    object_id: objectId,
    current_state: currentState,
    next_possible_states: nextStates.map(state => ({
      state,
      state_name: getStateName(state),
      requires_signature: ['COMMIT', 'REVERT'].includes(state),
      requires_evidence: state === 'COMMIT'
    }))
  });
});

/**
 * GET /api/dialogue/active
 * Get active (non-expired) dialogue messages
 */
router.get('/active', (req, res) => {
  const { context_ref } = req.query;
  
  // Cleanup expired
  const active = cleanupExpired(dialogueStore);
  
  // Filter by context if provided
  let messages = active;
  if (context_ref) {
    messages = active.filter(d => d.context_ref === context_ref);
  }
  
  res.status(200).json({
    count: messages.length,
    messages: messages.map(m => ({
      commit_id: m.commit_id,
      context_ref: m.context_ref,
      participants: m.participant_ids,
      expires_at: new Date(m.expiry_timestamp_ms).toISOString(),
      timestamp: new Date(m.timestamp_ms).toISOString()
    }))
  });
});

/**
 * GET /api/governance/test
 * Run governance tests (dev only)
 */
router.get('/test', (req, res) => {
  const { testDialogueCannotChangeState, testValidStateTransition } = 
    require('../governance/noDialogueStateChange.mjs').default;
  
  const test1 = testDialogueCannotChangeState();
  const test2 = testValidStateTransition();
  
  res.status(200).json({
    tests: [test1, test2],
    all_passed: test1.passed && test2.passed
  });
});

export default router;
