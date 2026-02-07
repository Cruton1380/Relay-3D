// backend/commitTypes/authority.mjs
/**
 * AUTHORITY_GRANT and AUTHORITY_REVOKE Commit Types
 * 
 * Constitutional Rule (Principle 4):
 * "All authority is discoverable. No hidden capabilities."
 * 
 * Hard lock: No capability exists unless granted by a discoverable chain.
 */

/**
 * AUTHORITY_GRANT commit schema
 * {
 *   type: 'AUTHORITY_GRANT',
 *   grant_id: string,
 *   scope: string,                    // e.g., 'avgol.site.maxwell.procurement'
 *   capabilities: [string],           // e.g., ['STATE_TRANSITION:PO:APPROVE']
 *   grantee_id: string,              // Who receives this authority
 *   grantor_authority_ref: string,   // Who granted (must have grant capability)
 *   evidence_refs: [string],         // Supporting evidence
 *   effective_from_ms: number,
 *   expires_at_ms: number | null,   // null = no expiry
 *   signature: string,               // Custody signature
 *   timestamp_ms: number
 * }
 */

/**
 * AUTHORITY_REVOKE commit schema
 * {
 *   type: 'AUTHORITY_REVOKE',
 *   grant_commit_id: string,         // Which grant to revoke
 *   reason: string,
 *   revoked_by_authority_ref: string,
 *   signature: string,
 *   timestamp_ms: number
 * }
 */

// Capability format: "<ACTION>:<OBJECT_TYPE>:<SPECIFIC_OPERATION>"
// Examples:
// - "STATE_TRANSITION:PURCHASE_ORDER:APPROVE"
// - "STATE_TRANSITION:VENDOR:APPROVE"
// - "POLICY_ACTIVATE:*:*" (admin-level)
// - "AUTHORITY_GRANT:*:BUYER" (can grant buyer-level authority)

/**
 * Validate AUTHORITY_GRANT commit
 * @param {Object} commit
 * @returns {Object} - { valid: boolean, reason?: string }
 */
export function validateAuthorityGrant(commit) {
  const requiredFields = [
    'type',
    'grant_id',
    'scope',
    'capabilities',
    'grantee_id',
    'grantor_authority_ref',
    'effective_from_ms',
    'signature',
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
  if (commit.type !== 'AUTHORITY_GRANT') {
    return {
      valid: false,
      reason: `INVALID_TYPE: expected AUTHORITY_GRANT, got ${commit.type}`
    };
  }
  
  // Capabilities must be array
  if (!Array.isArray(commit.capabilities) || commit.capabilities.length === 0) {
    return {
      valid: false,
      reason: 'INVALID_CAPABILITIES: must be non-empty array'
    };
  }
  
  // Validate capability format
  for (const cap of commit.capabilities) {
    if (!isValidCapabilityFormat(cap)) {
      return {
        valid: false,
        reason: `INVALID_CAPABILITY_FORMAT: ${cap} must match pattern ACTION:OBJECT:OPERATION`
      };
    }
  }
  
  // Effective time must be in past or near future
  if (commit.effective_from_ms > Date.now() + 86400000) {
    return {
      valid: false,
      reason: 'EFFECTIVE_FROM_TOO_FAR: cannot be more than 24h in future'
    };
  }
  
  // Expiry must be after effective
  if (commit.expires_at_ms && commit.expires_at_ms <= commit.effective_from_ms) {
    return {
      valid: false,
      reason: 'INVALID_EXPIRY: expires_at_ms must be after effective_from_ms'
    };
  }
  
  return { valid: true };
}

/**
 * Validate AUTHORITY_REVOKE commit
 * @param {Object} commit
 * @returns {Object} - { valid: boolean, reason?: string }
 */
export function validateAuthorityRevoke(commit) {
  const requiredFields = [
    'type',
    'grant_commit_id',
    'reason',
    'revoked_by_authority_ref',
    'signature',
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
  if (commit.type !== 'AUTHORITY_REVOKE') {
    return {
      valid: false,
      reason: `INVALID_TYPE: expected AUTHORITY_REVOKE, got ${commit.type}`
    };
  }
  
  return { valid: true };
}

/**
 * Check if capability format is valid
 * @param {string} capability - e.g., "STATE_TRANSITION:PO:APPROVE"
 * @returns {boolean}
 */
function isValidCapabilityFormat(capability) {
  // Format: ACTION:OBJECT:OPERATION or ACTION:*:*
  const parts = capability.split(':');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Create AUTHORITY_GRANT commit
 * @param {Object} params
 * @returns {Object}
 */
export function createAuthorityGrantCommit({
  scope,
  capabilities,
  grantee_id,
  grantor_authority_ref,
  evidence_refs = [],
  effective_from_ms = Date.now(),
  expires_at_ms = null,
  signature
}) {
  const grant_id = `grant_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  return {
    type: 'AUTHORITY_GRANT',
    commit_id: grant_id,
    grant_id,
    scope,
    capabilities,
    grantee_id,
    grantor_authority_ref,
    evidence_refs,
    effective_from_ms,
    expires_at_ms,
    signature,
    timestamp_ms: Date.now()
  };
}

/**
 * Create AUTHORITY_REVOKE commit
 * @param {Object} params
 * @returns {Object}
 */
export function createAuthorityRevokeCommit({
  grant_commit_id,
  reason,
  revoked_by_authority_ref,
  signature
}) {
  return {
    type: 'AUTHORITY_REVOKE',
    commit_id: `revoke_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    grant_commit_id,
    reason,
    revoked_by_authority_ref,
    signature,
    timestamp_ms: Date.now()
  };
}

/**
 * Parse capability string into components
 * @param {string} capability - "ACTION:OBJECT:OPERATION"
 * @returns {Object} - { action, object_type, operation }
 */
export function parseCapability(capability) {
  const [action, object_type, operation] = capability.split(':');
  return { action, object_type, operation };
}

/**
 * Check if a capability matches a requirement (supports wildcards)
 * @param {string} granted - Granted capability (may have *)
 * @param {string} required - Required capability
 * @returns {boolean}
 */
export function capabilityMatches(granted, required) {
  const g = parseCapability(granted);
  const r = parseCapability(required);
  
  return (
    (g.action === '*' || g.action === r.action) &&
    (g.object_type === '*' || g.object_type === r.object_type) &&
    (g.operation === '*' || g.operation === r.operation)
  );
}

// Avgol-specific capability constants
export const AVGOL_CAPABILITIES = {
  // Procurement
  APPROVE_PO: 'STATE_TRANSITION:PURCHASE_ORDER:APPROVE',
  CREATE_PO: 'STATE_TRANSITION:PURCHASE_ORDER:CREATE',
  APPROVE_VENDOR: 'STATE_TRANSITION:VENDOR:APPROVE',
  SET_PAYMENT_TERMS: 'STATE_TRANSITION:PAYMENT_TERMS:SET',
  LOG_EXCEPTION: 'EXCEPTION:PROCUREMENT:LOG',
  ATTACH_QUOTE: 'EVIDENCE:QUOTE:ATTACH',
  
  // Finance
  APPROVE_PAYMENT_TERMS: 'STATE_TRANSITION:PAYMENT_TERMS:APPROVE',
  REVIEW_INVOICE: 'STATE_TRANSITION:INVOICE:REVIEW',
  
  // Warehouse
  POST_GOODS_RECEIPT: 'STATE_TRANSITION:GOODS_RECEIPT:POST',
  REPORT_STOCKOUT: 'STATE_TRANSITION:INVENTORY:ALERT',
  
  // Admin/Governance
  GRANT_AUTHORITY: 'AUTHORITY_GRANT:*:*',
  REVOKE_AUTHORITY: 'AUTHORITY_REVOKE:*:*',
  ACTIVATE_POLICY: 'POLICY:*:ACTIVATE'
};

export default {
  validateAuthorityGrant,
  validateAuthorityRevoke,
  createAuthorityGrantCommit,
  createAuthorityRevokeCommit,
  parseCapability,
  capabilityMatches,
  AVGOL_CAPABILITIES
};
