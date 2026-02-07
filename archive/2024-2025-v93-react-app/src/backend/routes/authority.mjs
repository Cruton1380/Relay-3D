// backend/routes/authority.mjs
/**
 * Authority API Routes
 * 
 * Implements Deliverable C: No Hidden Authority (Principle 4)
 * 
 * Endpoints:
 * - GET /api/authority/:authorityRef/resolve - Resolve authority to capabilities
 * - GET /api/authority/can - Check if user has capability
 * - GET /api/authority/grants - Get user's grants
 * - POST /api/authority/grant - Grant authority (requires GRANT capability)
 * - POST /api/authority/revoke - Revoke authority (requires REVOKE capability)
 */

import { Router } from 'express';
import {
  resolveAuthority,
  hasCapability,
  registerGrant,
  registerRevoke,
  getGrantsForUser
} from '../governance/authorityResolver.mjs';
import {
  validateAuthorityGrant,
  validateAuthorityRevoke,
  createAuthorityGrantCommit,
  createAuthorityRevokeCommit,
  AVGOL_CAPABILITIES
} from '../commitTypes/authority.mjs';

const router = Router();

/**
 * GET /api/authority/:authorityRef/resolve
 * Resolve an authority reference to capabilities
 */
router.get('/:authorityRef/resolve', (req, res) => {
  const { authorityRef } = req.params;
  
  const resolution = resolveAuthority(authorityRef);
  
  if (!resolution.valid) {
    return res.status(404).json({
      error: 'AUTHORITY_NOT_FOUND',
      authority_ref: authorityRef,
      reason: resolution.reason
    });
  }
  
  res.status(200).json({
    authority_ref: authorityRef,
    valid: true,
    capabilities: resolution.capabilities,
    scope: resolution.scope,
    expires_at: resolution.expires_at_ms 
      ? new Date(resolution.expires_at_ms).toISOString()
      : null,
    chain: resolution.chain,
    reason: resolution.reason
  });
});

/**
 * GET /api/authority/can
 * Check if a user has a specific capability
 * 
 * Query params:
 * - user: user ID (e.g., "buyer123")
 * - cap: capability (e.g., "STATE_TRANSITION:PO:APPROVE")
 * - scope: optional scope filter (e.g., "avgol.site.maxwell")
 */
router.get('/can', (req, res) => {
  const { user, cap, scope } = req.query;
  
  if (!user || !cap) {
    return res.status(400).json({
      error: 'MISSING_PARAMETERS',
      message: 'user and cap query parameters are required'
    });
  }
  
  const authority_ref = `user:${user}`;
  const check = hasCapability(authority_ref, cap, scope);
  
  res.status(200).json({
    user,
    capability: cap,
    scope: scope || null,
    authorized: check.authorized,
    reason: check.reason,
    expires_in_ms: check.expires_in_ms,
    expires_in_hours: check.expires_in_ms 
      ? Math.round(check.expires_in_ms / (1000 * 60 * 60))
      : null,
    chain: check.chain || []
  });
});

/**
 * GET /api/authority/grants
 * Get all authority grants for a user
 * 
 * Query params:
 * - user: user ID
 */
router.get('/grants', (req, res) => {
  const { user } = req.query;
  
  if (!user) {
    return res.status(400).json({
      error: 'MISSING_PARAMETER',
      message: 'user query parameter is required'
    });
  }
  
  const grants = getGrantsForUser(user);
  
  res.status(200).json({
    user,
    grant_count: grants.length,
    active_count: grants.filter(g => g.is_active).length,
    grants
  });
});

/**
 * POST /api/authority/grant
 * Grant authority to a user (requires GRANT capability)
 * 
 * Body:
 * {
 *   scope: string,
 *   capabilities: [string],
 *   grantee_id: string,
 *   grantor_authority_ref: string,
 *   evidence_refs: [string],
 *   effective_from_ms?: number,
 *   expires_at_ms?: number,
 *   signature: string
 * }
 */
router.post('/grant', async (req, res) => {
  const {
    scope,
    capabilities,
    grantee_id,
    grantor_authority_ref,
    evidence_refs = [],
    effective_from_ms,
    expires_at_ms,
    signature
  } = req.body;
  
  // Check if grantor has GRANT capability
  const grantorCheck = hasCapability(
    grantor_authority_ref,
    'AUTHORITY_GRANT:*:*'
  );
  
  if (!grantorCheck.authorized) {
    return res.status(403).json({
      error: 'GRANTOR_NOT_AUTHORIZED',
      message: 'Grantor does not have AUTHORITY_GRANT capability',
      grantor: grantor_authority_ref,
      reason: grantorCheck.reason
    });
  }
  
  // Create grant commit
  const commit = createAuthorityGrantCommit({
    scope,
    capabilities,
    grantee_id,
    grantor_authority_ref,
    evidence_refs,
    effective_from_ms,
    expires_at_ms,
    signature
  });
  
  // Validate
  const validation = validateAuthorityGrant(commit);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'INVALID_GRANT',
      message: validation.reason
    });
  }
  
  // Register grant
  const result = registerGrant(commit);
  
  if (!result.registered) {
    return res.status(500).json({
      error: 'GRANT_REGISTRATION_FAILED',
      message: result.reason
    });
  }
  
  res.status(201).json({
    success: true,
    grant: commit,
    message: 'Authority granted successfully'
  });
});

/**
 * POST /api/authority/revoke
 * Revoke an authority grant (requires REVOKE capability)
 * 
 * Body:
 * {
 *   grant_commit_id: string,
 *   reason: string,
 *   revoked_by_authority_ref: string,
 *   signature: string
 * }
 */
router.post('/revoke', async (req, res) => {
  const {
    grant_commit_id,
    reason,
    revoked_by_authority_ref,
    signature
  } = req.body;
  
  // Check if revoker has REVOKE capability
  const revokerCheck = hasCapability(
    revoked_by_authority_ref,
    'AUTHORITY_REVOKE:*:*'
  );
  
  if (!revokerCheck.authorized) {
    return res.status(403).json({
      error: 'REVOKER_NOT_AUTHORIZED',
      message: 'Revoker does not have AUTHORITY_REVOKE capability',
      revoker: revoked_by_authority_ref,
      reason: revokerCheck.reason
    });
  }
  
  // Create revoke commit
  const commit = createAuthorityRevokeCommit({
    grant_commit_id,
    reason,
    revoked_by_authority_ref,
    signature
  });
  
  // Validate
  const validation = validateAuthorityRevoke(commit);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'INVALID_REVOKE',
      message: validation.reason
    });
  }
  
  // Register revocation
  const result = registerRevoke(commit);
  
  if (!result.revoked) {
    return res.status(500).json({
      error: 'REVOKE_REGISTRATION_FAILED',
      message: result.reason
    });
  }
  
  res.status(200).json({
    success: true,
    revoke: commit,
    message: 'Authority revoked successfully'
  });
});

/**
 * GET /api/authority/capabilities
 * List all Avgol-specific capabilities
 */
router.get('/capabilities', (req, res) => {
  res.status(200).json({
    capabilities: AVGOL_CAPABILITIES,
    format: 'ACTION:OBJECT_TYPE:OPERATION',
    examples: [
      'STATE_TRANSITION:PURCHASE_ORDER:APPROVE',
      'STATE_TRANSITION:VENDOR:APPROVE',
      'EVIDENCE:QUOTE:ATTACH'
    ]
  });
});

export default router;
