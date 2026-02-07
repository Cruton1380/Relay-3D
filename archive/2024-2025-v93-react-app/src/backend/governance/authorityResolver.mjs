// backend/governance/authorityResolver.mjs
/**
 * Authority Resolution Engine
 * 
 * Constitutional Rule (Principle 4):
 * "All authority is discoverable. No capability exists unless granted by a discoverable chain."
 * 
 * This module:
 * - Resolves authority_ref to actual capabilities
 * - Validates capability chains
 * - Checks expiry and revocation
 * - Returns proof path (chain of grants)
 */

import { parseCapability, capabilityMatches } from '../commitTypes/authority.mjs';

// In-memory authority store (replace with database in production)
const authorityGrants = new Map(); // grantee_id → [grant commits]
const revokedGrants = new Set(); // grant_commit_ids that are revoked

/**
 * Resolve an authority reference to capabilities
 * @param {string} authority_ref - e.g., "user:buyer123"
 * @returns {Object} - { valid, capabilities, scope, expires_at_ms, chain, reason }
 */
export function resolveAuthority(authority_ref) {
  // Handle self-scoped authority (personal actions)
  if (authority_ref.startsWith('self:')) {
    return {
      valid: true,
      capabilities: ['SELF:*:*'],  // Can act on own data
      scope: authority_ref,
      expires_at_ms: null,
      chain: [],
      reason: 'Self-scoped authority (no grant required)'
    };
  }
  
  // Extract user ID from authority_ref
  const userId = authority_ref.replace('user:', '');
  
  // Get all grants for this user
  const grants = authorityGrants.get(userId) || [];
  
  if (grants.length === 0) {
    return {
      valid: false,
      capabilities: [],
      scope: null,
      expires_at_ms: null,
      chain: [],
      reason: 'AUTHORITY_NOT_DISCOVERABLE: no grants found'
    };
  }
  
  // Filter active grants (not expired, not revoked)
  const now = Date.now();
  const activeGrants = grants.filter(grant => {
    // Check if revoked
    if (revokedGrants.has(grant.grant_id)) {
      return false;
    }
    
    // Check if not yet effective
    if (grant.effective_from_ms > now) {
      return false;
    }
    
    // Check if expired
    if (grant.expires_at_ms && grant.expires_at_ms < now) {
      return false;
    }
    
    return true;
  });
  
  if (activeGrants.length === 0) {
    return {
      valid: false,
      capabilities: [],
      scope: null,
      expires_at_ms: null,
      chain: grants.map(g => g.grant_id),
      reason: 'AUTHORITY_EXPIRED_OR_REVOKED: all grants inactive'
    };
  }
  
  // Aggregate capabilities from all active grants
  const allCapabilities = [];
  const allScopes = [];
  let earliestExpiry = null;
  const chain = [];
  
  for (const grant of activeGrants) {
    allCapabilities.push(...grant.capabilities);
    allScopes.push(grant.scope);
    chain.push(grant.grant_id);
    
    if (grant.expires_at_ms) {
      if (!earliestExpiry || grant.expires_at_ms < earliestExpiry) {
        earliestExpiry = grant.expires_at_ms;
      }
    }
  }
  
  return {
    valid: true,
    capabilities: [...new Set(allCapabilities)],  // Deduplicate
    scope: allScopes,
    expires_at_ms: earliestExpiry,
    chain,
    reason: 'Authority resolved successfully'
  };
}

/**
 * Check if an authority has a specific capability
 * @param {string} authority_ref
 * @param {string} required_capability
 * @param {string} required_scope - Optional scope filter
 * @returns {Object} - { authorized, reason, expires_in_ms }
 */
export function hasCapability(authority_ref, required_capability, required_scope = null) {
  const resolution = resolveAuthority(authority_ref);
  
  if (!resolution.valid) {
    return {
      authorized: false,
      reason: resolution.reason,
      expires_in_ms: null
    };
  }
  
  // Check if any granted capability matches the required one
  const hasMatch = resolution.capabilities.some(granted => 
    capabilityMatches(granted, required_capability)
  );
  
  if (!hasMatch) {
    return {
      authorized: false,
      reason: `AUTHORITY_CAPABILITY_MISSING: requires ${required_capability}`,
      granted_capabilities: resolution.capabilities,
      expires_in_ms: null
    };
  }
  
  // Check scope (if required)
  if (required_scope && !resolution.scope.some(s => scopeMatches(s, required_scope))) {
    return {
      authorized: false,
      reason: `AUTHORITY_SCOPE_MISMATCH: requires scope ${required_scope}`,
      granted_scopes: resolution.scope,
      expires_in_ms: null
    };
  }
  
  // Calculate expiry
  const expires_in_ms = resolution.expires_at_ms 
    ? resolution.expires_at_ms - Date.now()
    : null;
  
  return {
    authorized: true,
    reason: 'Authority and capability verified',
    expires_in_ms,
    chain: resolution.chain
  };
}

/**
 * Check if a scope matches (supports wildcards)
 * @param {string} granted - e.g., "avgol.site.maxwell.*"
 * @param {string} required - e.g., "avgol.site.maxwell.procurement"
 * @returns {boolean}
 */
function scopeMatches(granted, required) {
  const gParts = granted.split('.');
  const rParts = required.split('.');
  
  for (let i = 0; i < gParts.length; i++) {
    if (gParts[i] === '*') {
      return true;  // Wildcard matches rest
    }
    if (gParts[i] !== rParts[i]) {
      return false;
    }
  }
  
  // Granted scope must be at least as specific as required
  return gParts.length >= rParts.length;
}

/**
 * Register an AUTHORITY_GRANT commit (adds to authority store)
 * @param {Object} commit - AUTHORITY_GRANT commit
 * @returns {Object} - { registered: boolean, reason?: string }
 */
export function registerGrant(commit) {
  const validation = validateAuthorityGrant(commit);
  if (!validation.valid) {
    return {
      registered: false,
      reason: validation.reason
    };
  }
  
  // Store grant
  const userId = commit.grantee_id.replace('user:', '');
  const existing = authorityGrants.get(userId) || [];
  existing.push(commit);
  authorityGrants.set(userId, existing);
  
  return {
    registered: true,
    grant_id: commit.grant_id,
    reason: 'Authority grant registered'
  };
}

/**
 * Register an AUTHORITY_REVOKE commit (marks grant as revoked)
 * @param {Object} commit - AUTHORITY_REVOKE commit
 * @returns {Object} - { revoked: boolean, reason?: string }
 */
export function registerRevoke(commit) {
  const validation = validateAuthorityRevoke(commit);
  if (!validation.valid) {
    return {
      revoked: false,
      reason: validation.reason
    };
  }
  
  // Mark as revoked
  revokedGrants.add(commit.grant_commit_id);
  
  return {
    revoked: true,
    grant_id: commit.grant_commit_id,
    reason: 'Authority grant revoked'
  };
}

/**
 * Get all grants for a user
 * @param {string} userId
 * @returns {Array<Object>}
 */
export function getGrantsForUser(userId) {
  const grants = authorityGrants.get(userId) || [];
  const now = Date.now();
  
  return grants.map(grant => ({
    grant_id: grant.grant_id,
    scope: grant.scope,
    capabilities: grant.capabilities,
    effective_from: new Date(grant.effective_from_ms).toISOString(),
    expires_at: grant.expires_at_ms ? new Date(grant.expires_at_ms).toISOString() : 'Never',
    is_active: !revokedGrants.has(grant.grant_id) && 
               grant.effective_from_ms <= now &&
               (!grant.expires_at_ms || grant.expires_at_ms > now),
    is_revoked: revokedGrants.has(grant.grant_id),
    is_expired: grant.expires_at_ms && grant.expires_at_ms < now
  }));
}

/**
 * Bootstrap default authority (for system initialization)
 * Creates root authority grant for initial custodian
 * @param {string} custodian_id - e.g., "user:admin"
 * @returns {Object} - ROOT authority grant
 */
export function bootstrapRootAuthority(custodian_id) {
  const rootGrant = {
    type: 'AUTHORITY_GRANT',
    commit_id: 'grant_root_bootstrap',
    grant_id: 'grant_root_bootstrap',
    scope: '*',  // Global scope
    capabilities: ['*:*:*'],  // All capabilities
    grantee_id: custodian_id,
    grantor_authority_ref: 'system:bootstrap',
    evidence_refs: [],
    effective_from_ms: Date.now(),
    expires_at_ms: null,  // No expiry
    signature: 'bootstrap_signature',
    timestamp_ms: Date.now()
  };
  
  registerGrant(rootGrant);
  
  return rootGrant;
}

export default {
  resolveAuthority,
  hasCapability,
  registerGrant,
  registerRevoke,
  getGrantsForUser,
  bootstrapRootAuthority,
  parseCapability,
  capabilityMatches
};
