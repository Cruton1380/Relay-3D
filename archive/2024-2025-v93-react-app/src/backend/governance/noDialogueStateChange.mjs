// backend/governance/noDialogueStateChange.mjs
/**
 * Constitutional Enforcement (Principle 1):
 * "No irreversible action from dialogue. Only commits with authority + evidence can change state."
 * 
 * This module enforces the hard boundary between:
 * - DIALOGUE (ephemeral coordination) - CANNOT change state
 * - STATE_TRANSITION (auditable commits) - CAN change state
 */

import { validateStateTransition } from '../commitTypes/stateTransition.mjs';
import { validateDialogue } from '../commitTypes/dialogue.mjs';

/**
 * Validate that a commit can change state
 * @param {Object} commit - The proposed commit
 * @returns {Object} - { allowed: boolean, reason?: string }
 */
export function canCommitChangeState(commit) {
  // DIALOGUE commits are NEVER allowed to change state
  if (commit.type === 'DIALOGUE') {
    return {
      allowed: false,
      reason: 'DIALOGUE_CANNOT_MUTATE_STATE: dialogue is ephemeral coordination only',
      constitutional_violation: 'Principle 1: Dialogue is free, history is gated'
    };
  }
  
  // STATE_TRANSITION commits must pass validation
  if (commit.type === 'STATE_TRANSITION') {
    const validation = validateStateTransition(commit);
    if (!validation.valid) {
      return {
        allowed: false,
        reason: validation.reason
      };
    }
    return { allowed: true };
  }
  
  // Other commit types (FILE_IMPORT, CELL_SET, etc.) are allowed
  // but must still carry authority_ref and timestamp_ms
  if (!commit.authority_ref) {
    return {
      allowed: false,
      reason: 'MISSING_AUTHORITY: all state-changing commits require authority_ref'
    };
  }
  
  if (!commit.timestamp_ms) {
    return {
      allowed: false,
      reason: 'MISSING_TIMESTAMP: all commits require timestamp_ms'
    };
  }
  
  return { allowed: true };
}

/**
 * Enforce commit boundary middleware
 * Rejects any attempt to change state from dialogue endpoints
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
export function enforceCommitBoundary(req, res, next) {
  // Skip for GET requests (read-only)
  if (req.method === 'GET') {
    return next();
  }
  
  // Extract commit from request body
  const commit = req.body.commit || req.body;
  
  if (!commit || !commit.type) {
    return res.status(400).json({
      error: 'INVALID_REQUEST',
      message: 'Request must include a commit object with type field'
    });
  }
  
  // Check if commit can change state
  const validation = canCommitChangeState(commit);
  
  if (!validation.allowed) {
    return res.status(403).json({
      error: 'COMMIT_BOUNDARY_VIOLATION',
      message: validation.reason,
      constitutional_violation: validation.constitutional_violation,
      commit_type: commit.type,
      hint: validation.constitutional_violation ? 
        'Use /api/state/transition for state changes, /api/dialogue for coordination' : 
        'Fix commit validation errors'
    });
  }
  
  // Validation passed, proceed
  next();
}

/**
 * Check if a route path is dialogue-only
 * @param {string} path - Request path
 * @returns {boolean}
 */
export function isDialogueRoute(path) {
  const dialogueRoutes = [
    '/api/dialogue',
    '/api/chat',
    '/api/message',
    '/api/comment'  // Comments are dialogue, not state
  ];
  
  return dialogueRoutes.some(route => path.startsWith(route));
}

/**
 * Enforce dialogue routes cannot change state
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
export function enforceDialogueOnlyRoutes(req, res, next) {
  if (req.method === 'GET') {
    return next();
  }
  
  if (isDialogueRoute(req.path)) {
    const commit = req.body.commit || req.body;
    
    // Dialogue routes can ONLY accept DIALOGUE commits
    if (commit.type !== 'DIALOGUE') {
      return res.status(403).json({
        error: 'DIALOGUE_ROUTE_VIOLATION',
        message: `Route ${req.path} only accepts DIALOGUE commits, got ${commit.type}`,
        constitutional_violation: 'Principle 1: Dialogue cannot change state',
        hint: 'Use /api/state/transition for state changes'
      });
    }
    
    // Validate dialogue commit
    const validation = validateDialogue(commit);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'INVALID_DIALOGUE_COMMIT',
        message: validation.reason
      });
    }
  }
  
  next();
}

/**
 * Audit log for governance violations
 * @param {string} violation_type
 * @param {Object} details
 */
function logGovernanceViolation(violation_type, details) {
  console.error('[GOVERNANCE VIOLATION]', {
    type: violation_type,
    timestamp: new Date().toISOString(),
    ...details
  });
  
  // TODO: Store violation in audit log (append-only)
  // TODO: Alert if violations exceed threshold
}

/**
 * Test helper: attempt invalid state change from dialogue
 * @returns {Object} - Test result
 */
export function testDialogueCannotChangeState() {
  const invalidCommit = {
    type: 'DIALOGUE',
    content_hash: 'test',
    timestamp_ms: Date.now(),
    context_ref: 'test',
    // Attempting to change state (FORBIDDEN)
    state_change: { from: 'DRAFT', to: 'COMMIT' }
  };
  
  const validation = canCommitChangeState(invalidCommit);
  
  return {
    test: 'DIALOGUE cannot change state',
    expected_allowed: false,
    actual_allowed: validation.allowed,
    passed: !validation.allowed,
    reason: validation.reason
  };
}

/**
 * Test helper: valid state transition
 * @returns {Object} - Test result
 */
export function testValidStateTransition() {
  const validCommit = {
    type: 'STATE_TRANSITION',
    from_state: 'DRAFT',
    to_state: 'HOLD',
    authority_ref: 'user:123',
    reason: 'Ready for review',
    timestamp_ms: Date.now(),
    object_id: 'po:456',
    object_type: 'PURCHASE_ORDER'
  };
  
  const validation = canCommitChangeState(validCommit);
  
  return {
    test: 'Valid STATE_TRANSITION allowed',
    expected_allowed: true,
    actual_allowed: validation.allowed,
    passed: validation.allowed,
    reason: validation.reason
  };
}

export default {
  canCommitChangeState,
  enforceCommitBoundary,
  enforceDialogueOnlyRoutes,
  isDialogueRoute,
  testDialogueCannotChangeState,
  testValidStateTransition
};
