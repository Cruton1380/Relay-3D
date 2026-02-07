// backend/commitTypes/authorityGrant.mjs
/**
 * AUTHORITY_GRANT / AUTHORITY_REVOKE Commit Types
 * 
 * Constitutional Rule (Principle 4):
 * "No hidden authority. All authority is discoverable."
 * 
 * AUTHORITY_GRANT:
 * - Grants specific capabilities to a user/role
 * - Scoped (e.g., avgol.site.maxwell.procurement)
 * - Time-bounded (optional expiry)
 * - Requires grantor's own authority
 * - Signed by custody
 * 
 * AUTHORITY_REVOKE:
 * - Revokes a specific grant
 * - Requires reason
 * - Signed by custody
 */

/**
 * Validate an AUTHORITY_GRANT commit
 * @param {Object} commit
 * @returns {Object} - { valid: boolean, reason?: string }
 */
export function validateAuthorityGrant(commit) {
  const requiredFields = [
    'type',
    'scope',
    'capabilities',
    'grantee_id',
    'grantor_authority_ref',
    'effective_from_ms',
    'timestamp_ms',
    'signature'
  ];
  
  for (const field of requiredFields) {
    if (!commit[field]) {
      return {
        valid: false,
        reason: `MISSING_FIELD: ${field} is required`
      };
    }
  }
  
  if (commit.type !== 'AUTHORITY_GRANT') {
    return {
      valid: false,
      reason: `INVALID_TYPE: expected AUTHORITY_GRANT, got ${commit.type}`
    };
  }
  
  // Capabilities must be an array
  if (!Array.isArray(commit.capabilities) || commit.capabilities.length === 0) {
    return {
      valid: false,
      reason: 'INVALID_CAPABILITIES: must be non-empty array'
    };
  }
  
  // Validate capability format: ACTION:OBJECT_TYPE:OPERATION
  for (const cap of commit.capabilities) {
    if (!isValidCapabilityFormat(cap)) {
      return {
        valid: false,
        reason: `INVALID_CAPABILITY_FORMAT: ${cap} (expected ACTION:OBJECT:OPERATION)`
      };
    }
  }
  
  // Expiry must be after effective_from (if present)
  if (commit.expires_at_ms && commit.expires_at_ms <= commit.effective_from_ms) {
    return {
      valid: false,
      reason: 'INVALID_EXPIRY: expires_at_ms must be after effective_from_ms'
    };
  }
  
  // TODO: Verify grantor has authority to grant these capabilities
  // For now, just check signature exists
  
  return { valid: true };
}

/**
 * Validate an AUTHORITY_REVOKE commit
 * @param {Object} commit
 * @returns {Object} - { valid: boolean, reason?: string }
 */
export function validateAuthorityRevoke(commit) {
  const requiredFields = [
    'type',
    'grant_commit_id',
    'reason',
    'revoker_authority_ref',
    'timestamp_ms',
    'signature'
  ];
  
  for (const field of requiredFields) {
    if (!commit[field]) {
      return {
        valid: false,
        reason: `MISSING_FIELD: ${field} is required`
      };
    }
  }
  
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
 * Format: ACTION:OBJECT_TYPE:OPERATION
 * Examples:
 * - STATE_TRANSITION:PURCHASE_ORDER:APPROVE
 * - STATE_TRANSITION:VENDOR:APPROVE
 * - POLICY_ACTIVATE:PROCUREMENT:INCENTIVE
 * @param {string} capability
 * @returns {boolean}
 */
function isValidCapabilityFormat(capability) {
  const parts = capability.split(':');
  if (parts.length !== 3) {
    return false;
  }
  
  const [action, objectType, operation] = parts;
  return action && objectType && operation;
}

/**
 * Create an AUTHORITY_GRANT commit
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
  reason = '',
  signature
}) {
  return {
    type: 'AUTHORITY_GRANT',
    commit_id: generateCommitId('grant'),
    scope,
    capabilities,
    grantee_id,
    grantor_authority_ref,
    evidence_refs,
    effective_from_ms,
    expires_at_ms,
    reason,
    timestamp_ms: Date.now(),
    signature
  };
}

/**
 * Create an AUTHORITY_REVOKE commit
 * @param {Object} params
 * @returns {Object}
 */
export function createAuthorityRevokeCommit({
  grant_commit_id,
  reason,
  revoker_authority_ref,
  signature
}) {
  return {
    type: 'AUTHORITY_REVOKE',
    commit_id: generateCommitId('revoke'),
    grant_commit_id,
    reason,
    revoker_authority_ref,
    timestamp_ms: Date.now(),
    signature
  };
}

/**
 * Generate a unique commit ID
 * @param {string} prefix
 * @returns {string}
 */
function generateCommitId(prefix = 'auth') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Parse capability string into components
 * @param {string} capability
 * @returns {Object} - { action, objectType, operation }
 */
export function parseCapability(capability) {
  const [action, objectType, operation] = capability.split(':');
  return { action, objectType, operation };
}

/**
 * Check if a capability matches a request
 * @param {string} capability - Granted capability
 * @param {string} requested - Requested capability
 * @returns {boolean}
 */
export function capabilityMatches(capability, requested) {
  // Exact match
  if (capability === requested) {
    return true;
  }
  
  // Wildcard matching
  const capParts = capability.split(':');
  const reqParts = requested.split(':');
  
  if (capParts.length !== 3 || reqParts.length !== 3) {
    return false;
  }
  
  // Check each part (allow * wildcard)
  for (let i = 0; i < 3; i++) {
    if (capParts[i] !== '*' && capParts[i] !== reqParts[i]) {
      return false;
    }
  }
  
  return true;
}

// Avgol-specific capability strings (ready to use)
export const AVGOL_CAPABILITIES = {
  // Procurement capabilities
  PROCUREMENT_PO_DRAFT: 'STATE_TRANSITION:PURCHASE_ORDER:DRAFT',
  PROCUREMENT_PO_APPROVE: 'STATE_TRANSITION:PURCHASE_ORDER:APPROVE',
  PROCUREMENT_PO_COMMIT: 'STATE_TRANSITION:PURCHASE_ORDER:COMMIT',
  PROCUREMENT_VENDOR_APPROVE: 'STATE_TRANSITION:VENDOR:APPROVE',
  PROCUREMENT_VENDOR_MANAGE: 'STATE_TRANSITION:VENDOR:*',
  
  // BOM capabilities
  BOM_CREATE: 'STATE_TRANSITION:BOM:CREATE',
  BOM_ACTIVATE: 'STATE_TRANSITION:BOM:ACTIVATE',
  BOM_OBSOLETE: 'STATE_TRANSITION:BOM:OBSOLETE',
  
  // Finance capabilities
  FINANCE_PAYMENT_TERMS_APPROVE: 'STATE_TRANSITION:PAYMENT_TERMS:APPROVE',
  FINANCE_EXCEPTION_APPROVE: 'STATE_TRANSITION:PROCUREMENT_EXCEPTION:APPROVE',
  
  // Site-specific wildcards
  SITE_ALL_PROCUREMENT: 'STATE_TRANSITION:PURCHASE_ORDER:*',
  SITE_ALL_VENDORS: 'STATE_TRANSITION:VENDOR:*'
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
