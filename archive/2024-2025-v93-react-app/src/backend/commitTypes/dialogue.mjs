// backend/commitTypes/dialogue.mjs
/**
 * DIALOGUE Commit Type
 * 
 * Constitutional Rule (Principle 1):
 * "Speech/chat = ephemeral coordination layer. Commits = the only way reality changes."
 * 
 * DIALOGUE commits:
 * - Are ephemeral (auto-expire)
 * - Store only hash of content (not full content)
 * - Can reference other commits but CANNOT mutate state
 * - Default retention: 24 hours
 * - Max retention: 7 days
 */

// Retention policies (in hours)
const DEFAULT_RETENTION_HOURS = 24;
const MAX_RETENTION_HOURS = 168; // 7 days

/**
 * Validate a DIALOGUE commit
 * @param {Object} commit - The proposed DIALOGUE commit
 * @returns {Object} - { valid: boolean, reason?: string }
 */
export function validateDialogue(commit) {
  // Required fields check
  const requiredFields = [
    'type',
    'content_hash',
    'timestamp_ms',
    'context_ref'
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
  if (commit.type !== 'DIALOGUE') {
    return {
      valid: false,
      reason: `INVALID_TYPE: expected DIALOGUE, got ${commit.type}`
    };
  }
  
  // Retention window check
  if (commit.retention_window_hours) {
    if (commit.retention_window_hours > MAX_RETENTION_HOURS) {
      return {
        valid: false,
        reason: `RETENTION_TOO_LONG: max ${MAX_RETENTION_HOURS}h, got ${commit.retention_window_hours}h`
      };
    }
    if (commit.retention_window_hours < 1) {
      return {
        valid: false,
        reason: `RETENTION_TOO_SHORT: min 1h, got ${commit.retention_window_hours}h`
      };
    }
  }
  
  // CRITICAL: DIALOGUE commits must NOT contain state-changing fields
  const forbiddenFields = [
    'state_change',
    'object_mutation',
    'value_set',
    'policy_change',
    'authority_grant'
  ];
  
  for (const field of forbiddenFields) {
    if (commit[field]) {
      return {
        valid: false,
        reason: `DIALOGUE_CANNOT_MUTATE_STATE: field ${field} is forbidden in DIALOGUE commits`
      };
    }
  }
  
  return { valid: true };
}

/**
 * Create a DIALOGUE commit
 * @param {Object} params - Dialogue parameters
 * @returns {Object} - The commit object
 */
export function createDialogueCommit({
  content,
  participant_ids = [],
  context_ref,
  retention_window_hours = DEFAULT_RETENTION_HOURS
}) {
  // Hash content (don't store full content in commit)
  const content_hash = hashContent(content);
  
  // Calculate expiry timestamp
  const expiry_timestamp_ms = Date.now() + (retention_window_hours * 60 * 60 * 1000);
  
  const commit = {
    type: 'DIALOGUE',
    commit_id: generateCommitId(),
    participant_ids,
    content_hash,  // Only hash, not full content
    retention_window_hours,
    expiry_timestamp_ms,
    timestamp_ms: Date.now(),
    context_ref  // What this dialogue is about (commit ID, object ID, etc.)
  };
  
  return commit;
}

/**
 * Check if a dialogue commit has expired
 * @param {Object} commit - DIALOGUE commit
 * @returns {boolean}
 */
export function isExpired(commit) {
  if (!commit.expiry_timestamp_ms) {
    return false;
  }
  return Date.now() > commit.expiry_timestamp_ms;
}

/**
 * Hash content (simple SHA-256 simulation)
 * In production, use actual crypto.createHash('sha256')
 * @param {string} content
 * @returns {string}
 */
function hashContent(content) {
  // Simple hash for now (replace with crypto.createHash in production)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

/**
 * Generate a unique commit ID
 * @returns {string}
 */
function generateCommitId() {
  return `dialogue_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Clean up expired dialogues
 * @param {Array<Object>} dialogues - Array of DIALOGUE commits
 * @returns {Array<Object>} - Non-expired dialogues
 */
export function cleanupExpired(dialogues) {
  return dialogues.filter(d => !isExpired(d));
}

/**
 * Get time remaining before expiry
 * @param {Object} commit - DIALOGUE commit
 * @returns {number} - Hours remaining (or 0 if expired)
 */
export function getTimeRemaining(commit) {
  if (!commit.expiry_timestamp_ms) {
    return 0;
  }
  const remainingMs = commit.expiry_timestamp_ms - Date.now();
  if (remainingMs <= 0) {
    return 0;
  }
  return remainingMs / (60 * 60 * 1000); // Convert to hours
}

export default {
  validateDialogue,
  createDialogueCommit,
  isExpired,
  cleanupExpired,
  getTimeRemaining,
  DEFAULT_RETENTION_HOURS,
  MAX_RETENTION_HOURS
};
