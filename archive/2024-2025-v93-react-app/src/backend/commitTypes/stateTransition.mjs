// backend/commitTypes/stateTransition.mjs
/**
 * STATE_TRANSITION Commit Type
 * 
 * Constitutional Rules:
 * - Principle 1: "Only commits with authority + evidence refs can change state"
 * - Principle 4: "All authority is discoverable" (authority_ref must resolve)
 * 
 * This is the ONLY way to move an object through state gates:
 * DRAFT → HOLD → PROPOSE → COMMIT → REVERT
 */

import { hasCapability } from '../governance/authorityResolver.mjs';

// Valid state transitions
const VALID_TRANSITIONS = {
  DRAFT: ['HOLD', 'PROPOSE'], // Can hold draft or skip to propose
  HOLD: ['PROPOSE', 'DRAFT'],  // Can propose or return to draft
  PROPOSE: ['COMMIT', 'HOLD', 'DRAFT'], // Can commit, hold, or return
  COMMIT: ['REVERT'],  // Can only revert (no edits)
  REVERT: []  // Terminal state (create new instead)
};

// States that require custody signature
const SIGNATURE_REQUIRED_STATES = ['COMMIT', 'REVERT'];

/**
 * Validate a state transition commit
 * @param {Object} commit - The proposed STATE_TRANSITION commit
 * @returns {Object} - { valid: boolean, reason?: string }
 */
export function validateStateTransition(commit) {
  // Required fields check
  const requiredFields = [
    'type',
    'from_state',
    'to_state',
    'authority_ref',
    'reason',
    'timestamp_ms'
  ];
  
  for (const field of requiredFields) {
    if (!commit[field]) {
      return {
        valid: false,
        reason: `MISSING_FIELD: ${field} is required`
      };
    }
  }
  
  // Type check
  if (commit.type !== 'STATE_TRANSITION') {
    return {
      valid: false,
      reason: `INVALID_TYPE: expected STATE_TRANSITION, got ${commit.type}`
    };
  }
  
  // Valid transition check
  const allowedNextStates = VALID_TRANSITIONS[commit.from_state];
  if (!allowedNextStates) {
    return {
      valid: false,
      reason: `INVALID_FROM_STATE: ${commit.from_state} is not a valid state`
    };
  }
  
  if (!allowedNextStates.includes(commit.to_state)) {
    return {
      valid: false,
      reason: `INVALID_TRANSITION: cannot move from ${commit.from_state} to ${commit.to_state}`
    };
  }
  
  // Evidence refs check (required for COMMIT)
  if (commit.to_state === 'COMMIT') {
    if (!commit.evidence_refs || commit.evidence_refs.length === 0) {
      return {
        valid: false,
        reason: `MISSING_EVIDENCE: COMMIT requires evidence_refs`
      };
    }
  }
  
  // Signature check (required for COMMIT and REVERT)
  if (SIGNATURE_REQUIRED_STATES.includes(commit.to_state)) {
    if (!commit.signature) {
      return {
        valid: false,
        reason: `MISSING_SIGNATURE: ${commit.to_state} requires custody signature`
      };
    }
    
    // TODO: Verify signature against custodian public key
    // For now, just check presence
  }
  
  return { valid: true };
}

/**
 * Validate authority for state transition (Principle 4: No Hidden Authority)
 * @param {Object} commit - STATE_TRANSITION commit
 * @returns {Object} - { authorized: boolean, reason?: string, chain?: Array }
 */
export function validateTransitionAuthority(commit) {
  // Self-scoped transitions (personal drafts/holds) don't require discoverable authority
  if (commit.from_state === 'DRAFT' && commit.to_state === 'HOLD') {
    return {
      authorized: true,
      reason: 'Personal state transition (no authority check required)'
    };
  }
  
  if (!commit.object_type) {
    return {
      authorized: false,
      reason: 'MISSING_OBJECT_TYPE: cannot determine required capability'
    };
  }
  
  // Construct required capability: STATE_TRANSITION:<OBJECT_TYPE>:<TO_STATE>
  const required_capability = `STATE_TRANSITION:${commit.object_type}:${commit.to_state}`;
  
  // Check if authority has this capability
  const check = hasCapability(commit.authority_ref, required_capability);
  
  if (!check.authorized) {
    return {
      authorized: false,
      reason: check.reason,
      required_capability,
      granted_capabilities: check.granted_capabilities || []
    };
  }
  
  return {
    authorized: true,
    reason: 'Authority verified for state transition',
    chain: check.chain
  };
}

/**
 * Check if a state transition can proceed
 * @param {string} from_state - Current state
 * @param {string} to_state - Desired state
 * @param {string} authority_ref - Who is authorizing
 * @param {Array<string>} evidence_refs - Supporting evidence
 * @param {boolean} signatureRequired - Whether signature is needed
 * @returns {Object} - { canTransition: boolean, reason?: string }
 */
export function canTransition(from_state, to_state, authority_ref, evidence_refs = [], signatureRequired = false) {
  // Check if transition is allowed
  const allowedNextStates = VALID_TRANSITIONS[from_state];
  if (!allowedNextStates || !allowedNextStates.includes(to_state)) {
    return {
      canTransition: false,
      reason: `Cannot transition from ${from_state} to ${to_state}`
    };
  }
  
  // Check authority
  if (!authority_ref) {
    return {
      canTransition: false,
      reason: 'Missing authority reference'
    };
  }
  
  // Check evidence for COMMIT
  if (to_state === 'COMMIT' && (!evidence_refs || evidence_refs.length === 0)) {
    return {
      canTransition: false,
      reason: 'COMMIT requires evidence references'
    };
  }
  
  // Check signature requirement
  if (SIGNATURE_REQUIRED_STATES.includes(to_state) && signatureRequired && !signatureRequired) {
    return {
      canTransition: false,
      reason: `${to_state} requires custody signature`
    };
  }
  
  return { canTransition: true };
}

/**
 * Create a STATE_TRANSITION commit
 * @param {Object} params - Transition parameters
 * @returns {Object} - The commit object
 */
export function createStateTransitionCommit({
  from_state,
  to_state,
  authority_ref,
  evidence_refs = [],
  reason,
  object_id,
  object_type,
  signature = null
}) {
  const commit = {
    type: 'STATE_TRANSITION',
    commit_id: generateCommitId(),
    from_state,
    to_state,
    object_id,  // What object is transitioning
    object_type,  // Type of object (e.g., 'PURCHASE_ORDER', 'VENDOR_APPROVAL')
    authority_ref,
    evidence_refs,
    reason,
    timestamp_ms: Date.now()
  };
  
  // Add signature if provided (required for COMMIT/REVERT)
  if (signature) {
    commit.signature = signature;
  }
  
  return commit;
}

/**
 * Generate a unique commit ID
 * @returns {string}
 */
function generateCommitId() {
  return `commit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get human-readable state name
 * @param {string} state
 * @returns {string}
 */
export function getStateName(state) {
  const stateNames = {
    DRAFT: 'Draft (reversible, local)',
    HOLD: 'Hold (frozen, awaiting review)',
    PROPOSE: 'Proposed (shared, not in Canon)',
    COMMIT: 'Committed (Canon, signed)',
    REVERT: 'Reverted (visible rollback)'
  };
  return stateNames[state] || state;
}

/**
 * Get next possible states
 * @param {string} current_state
 * @returns {Array<string>}
 */
export function getNextStates(current_state) {
  return VALID_TRANSITIONS[current_state] || [];
}

export default {
  validateStateTransition,
  validateTransitionAuthority,
  canTransition,
  createStateTransitionCommit,
  getStateName,
  getNextStates,
  VALID_TRANSITIONS,
  SIGNATURE_REQUIRED_STATES
};
