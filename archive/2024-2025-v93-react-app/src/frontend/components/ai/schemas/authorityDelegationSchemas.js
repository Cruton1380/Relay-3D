/**
 * AUTHORITY DELEGATION GRAPH SCHEMAS
 * 
 * CORE INVARIANT:
 * "No action is valid unless the authority that performed it is derivable by replay
 * from an explicit delegation chain that was in force at the action's commitIndex."
 * 
 * NON-NEGOTIABLE LOCKS:
 * 1. No ambient authority (authorityRef required)
 * 2. Deterministic validity window (commitIndex-based expiry)
 * 3. Delegation proof minimal + canonical (no cycles)
 * 4. Services are executors, not authorities (unless delegated)
 * 5. Revocation is first-class and immediate
 */

// ============================================================================
// AUTHORITY OPERATIONS
// ============================================================================

export const AuthorityOp = {
  AUTHORITY_SCOPE_DEFINED: 'AUTHORITY_SCOPE_DEFINED',
  DELEGATE_AUTHORITY: 'DELEGATE_AUTHORITY',
  REVOKE_AUTHORITY: 'REVOKE_AUTHORITY',
};

export const Capability = {
  GRANT_RESOURCE: 'GRANT_RESOURCE',
  CANCEL_REQUEST: 'CANCEL_REQUEST',
  AUTHORIZE_MERGE: 'AUTHORIZE_MERGE',
  AUTHORIZE_FORK: 'AUTHORIZE_FORK',
  AUTHORIZE_SELECTION: 'AUTHORIZE_SELECTION',
  SIGN_APPROVAL: 'SIGN_APPROVAL',
  REORDER_QUEUE: 'REORDER_QUEUE',
  CANCEL_QUEUE_ITEM: 'CANCEL_QUEUE_ITEM',
  OVERRIDE_QUEUE_POLICY: 'OVERRIDE_QUEUE_POLICY',
  OVERRIDE_PRIORITY: 'OVERRIDE_PRIORITY',
};

// ============================================================================
// AUTHORITY FILAMENT COMMITS
// ============================================================================

/**
 * AUTHORITY_SCOPE_DEFINED
 * 
 * Defines a new authority scope (org, project, resource, etc.).
 */
export function createAuthorityScopeDefined(scopeId, commitIndex, scopeType, description, canonicalRulesRef) {
  return {
    filamentId: `authority.${scopeId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'authority-manager' },
    op: AuthorityOp.AUTHORITY_SCOPE_DEFINED,
    locus: null,
    refs: {
      inputs: [],
      evidence: [],
    },
    payload: {
      scopeId,
      scopeType, // 'org' | 'project' | 'resource' | 'filament' | 'domain'
      description,
      canonicalRulesRef, // Pointer to spec/version
    },
  };
}

/**
 * DELEGATE_AUTHORITY
 * 
 * Creates a delegation edge in the authority graph.
 * LOCK: Delegations must reference grantor + grantee + capabilities.
 */
export function createDelegateAuthority(scopeId, commitIndex, grantor, grantee, capabilities, constraints, evidenceRefs) {
  if (!grantor || !grantee || !capabilities || capabilities.length === 0) {
    throw new Error('FORBIDDEN: Delegation requires grantor, grantee, and capabilities.');
  }
  
  // LOCK 4: Services cannot self-originate authority
  if (grantor.kind === 'service' && !grantor.delegatedFrom) {
    throw new Error('FORBIDDEN: Services cannot originate authority (must be delegated from human).');
  }
  
  return {
    filamentId: `authority.${scopeId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'authority-manager' },
    op: AuthorityOp.DELEGATE_AUTHORITY,
    locus: null,
    refs: {
      inputs: [],
      evidence: evidenceRefs || [],
    },
    payload: {
      scopeId,
      delegationId: `${scopeId}:${commitIndex}`, // Unique delegation ID
      grantor, // { kind: 'user' | 'role', id }
      grantee, // { kind: 'user' | 'role' | 'service', id }
      capabilities, // ['GRANT_RESOURCE', 'CANCEL_REQUEST', ...]
      constraints: {
        loci: constraints?.loci || null, // Optional: restrict to specific loci
        maxAmount: constraints?.maxAmount || null, // Optional: financial limits
        expiryCommitIndex: constraints?.expiryCommitIndex || null, // LOCK 2: Deterministic expiry
        requiresCoSign: constraints?.requiresCoSign || null, // Optional: quorum rule { k:2, of:[...] }
      },
      evidenceRefs: evidenceRefs || [],
      delegatedAt: Date.now(), // DISPLAY ONLY
    },
  };
}

/**
 * REVOKE_AUTHORITY
 * 
 * Revokes a delegation (first-class, immediate).
 * LOCK 5: Revocation is explicit (not implied).
 */
export function createRevokeAuthority(scopeId, commitIndex, revokedDelegationId, reason, evidenceRefs) {
  if (!revokedDelegationId || !reason) {
    throw new Error('FORBIDDEN: Revocation requires delegationId and reason.');
  }
  
  return {
    filamentId: `authority.${scopeId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'authority-manager' },
    op: AuthorityOp.REVOKE_AUTHORITY,
    locus: null,
    refs: {
      inputs: [],
      evidence: evidenceRefs || [],
    },
    payload: {
      scopeId,
      revokedDelegationId, // Which delegation is being revoked
      reason,
      evidenceRefs: evidenceRefs || [],
      revokedAt: Date.now(), // DISPLAY ONLY
    },
  };
}

// ============================================================================
// AUTHORITY REFERENCE (For Actions)
// ============================================================================

/**
 * Create authorityRef for action commits.
 * 
 * LOCK 1: No ambient authority (authorityRef required).
 * LOCK 3: Delegation path uses immutable commit references (not strings).
 */
export function createAuthorityRef(scopeId, capability, delegationPath, satisfiedConstraints) {
  if (!scopeId || !capability || !delegationPath || delegationPath.length === 0) {
    throw new Error('FORBIDDEN: authorityRef requires scopeId, capability, and delegationPath.');
  }
  
  // LOCK 3: Validate delegationPath structure (must be commit references)
  for (const ref of delegationPath) {
    if (!ref.filamentId || ref.commitIndex === undefined) {
      throw new Error('FORBIDDEN: delegationPath must use commit references { filamentId, commitIndex }.');
    }
  }
  
  // LOCK 3: Delegation path must be canonical
  const pathHash = hashDelegationPath(delegationPath);
  
  return {
    scopeId,
    capability, // Which capability is being exercised
    proof: {
      delegationPath, // Array of { filamentId, commitIndex } (immutable pointers, root → leaf)
      pathHash, // Canonical hash of the chain
      satisfiedConstraints: satisfiedConstraints || {}, // Machine-checkable
    },
  };
}

/**
 * Hash delegation path (canonical).
 * CRITICAL: Uses immutable commit references, not string IDs.
 */
function hashDelegationPath(delegationPath) {
  // Canonical JSON serialization (deterministic key ordering)
  const canonicalJson = JSON.stringify(delegationPath, Object.keys(delegationPath).sort());
  
  let hash = 0;
  for (let i = 0; i < canonicalJson.length; i++) {
    const char = canonicalJson.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Verify action has valid authority.
 * 
 * LOCK 1: No ambient authority.
 */
export function verifyActionHasAuthority(actionCommit) {
  if (!actionCommit.authorityRef) {
    return { valid: false, reason: 'Missing authorityRef (no ambient authority)' };
  }
  
  return { valid: true };
}

/**
 * Verify delegation chain is valid at commitIndex.
 * 
 * LOCK 2: Deterministic validity window.
 * LOCK 3: Delegation proof minimal + canonical.
 * LOCK 5: Revocation is immediate.
 */
export function verifyDelegationChain(authorityFilament, authorityRef, actionCommitIndex) {
  const { delegationPath } = authorityRef.proof;
  
  // Check each delegation in path (commit references)
  for (const delegationRef of delegationPath) {
    const delegation = authorityFilament.commits.find(c => 
      c.op === AuthorityOp.DELEGATE_AUTHORITY &&
      c.filamentId === delegationRef.filamentId &&
      c.commitIndex === delegationRef.commitIndex
    );
    
    if (!delegation) {
      return { valid: false, reason: `Delegation at ${delegationRef.filamentId}:${delegationRef.commitIndex} not found` };
    }
    
    // LOCK 2: Check expiry by commitIndex (deterministic)
    if (delegation.payload.constraints.expiryCommitIndex !== null) {
      if (actionCommitIndex > delegation.payload.constraints.expiryCommitIndex) {
        return { valid: false, reason: `Delegation expired at commitIndex ${delegation.payload.constraints.expiryCommitIndex}` };
      }
    }
    
    // LOCK 5: Check if revoked (immediate)
    // Revocation is effective if it occurs at or before the action commitIndex
    const isRevoked = authorityFilament.commits.some(c => 
      c.op === AuthorityOp.REVOKE_AUTHORITY &&
      c.payload.revokedDelegationId === delegation.payload.delegationId &&
      c.commitIndex <= actionCommitIndex // CRITICAL: <= means revoke at same index invalidates action
    );
    
    if (isRevoked) {
      return { valid: false, reason: `Delegation was revoked` };
    }
  }
  
  // LOCK 3: Verify no cycles (using JSON stringification for deep equality)
  const pathKeys = delegationPath.map(ref => `${ref.filamentId}:${ref.commitIndex}`);
  const pathSet = new Set(pathKeys);
  if (pathSet.size !== delegationPath.length) {
    return { valid: false, reason: 'Cycle detected in delegation path' };
  }
  
  // LOCK 3: Verify path hash
  const computedHash = hashDelegationPath(delegationPath);
  if (computedHash !== authorityRef.proof.pathHash) {
    return { valid: false, reason: 'Path hash mismatch (non-canonical path)' };
  }
  
  return { valid: true };
}

/**
 * Verify delegation capability matches action.
 */
export function verifyCapability(authorityFilament, authorityRef, requiredCapability) {
  const { delegationPath } = authorityRef.proof;
  
  // Check if any delegation in path grants the required capability
  for (const delegationRef of delegationPath) {
    const delegation = authorityFilament.commits.find(c => 
      c.op === AuthorityOp.DELEGATE_AUTHORITY &&
      c.filamentId === delegationRef.filamentId &&
      c.commitIndex === delegationRef.commitIndex
    );
    
    if (delegation && delegation.payload.capabilities.includes(requiredCapability)) {
      return { valid: true };
    }
  }
  
  return { valid: false, reason: `Required capability ${requiredCapability} not found in delegation chain` };
}

/**
 * Verify service actor has delegation.
 * 
 * LOCK 4: Services are executors, not authorities.
 */
export function verifyServiceAuthority(authorityFilament, authorityRef, actor) {
  if (actor.kind !== 'service') {
    return { valid: true }; // Not a service, no restriction
  }
  
  // Service must have explicit delegation
  const { delegationPath } = authorityRef.proof;
  
  for (const delegationRef of delegationPath) {
    const delegation = authorityFilament.commits.find(c => 
      c.op === AuthorityOp.DELEGATE_AUTHORITY &&
      c.filamentId === delegationRef.filamentId &&
      c.commitIndex === delegationRef.commitIndex
    );
    
    if (delegation && delegation.payload.grantee.kind === 'service' && delegation.payload.grantee.id === actor.id) {
      return { valid: true }; // Service has explicit delegation
    }
  }
  
  return { valid: false, reason: 'Service lacks explicit delegation (services cannot self-originate authority)' };
}

/**
 * Full authority verification (all locks).
 */
export function verifyAuthority(authorityFilament, actionCommit, requiredCapability, actionCommitIndex) {
  // LOCK 1: No ambient authority
  const hasAuthority = verifyActionHasAuthority(actionCommit);
  if (!hasAuthority.valid) return hasAuthority;
  
  const { authorityRef } = actionCommit;
  
  // LOCK 2, 3, 5: Delegation chain valid
  const chainValid = verifyDelegationChain(authorityFilament, authorityRef, actionCommitIndex);
  if (!chainValid.valid) return chainValid;
  
  // Capability check
  const capabilityValid = verifyCapability(authorityFilament, authorityRef, requiredCapability);
  if (!capabilityValid.valid) return capabilityValid;
  
  // LOCK 4: Service authority check
  const serviceValid = verifyServiceAuthority(authorityFilament, authorityRef, actionCommit.actor);
  if (!serviceValid.valid) return serviceValid;
  
  return { valid: true };
}

// ============================================================================
// FORBIDDEN OPERATIONS
// ============================================================================

/**
 * Enforce: No action without authority.
 * 
 * LOCK 1: Actions are non-effective if missing authorityRef.
 */
export function enforceAuthorityRequired(actionCommit) {
  if (!actionCommit.authorityRef) {
    throw new Error('FORBIDDEN: Action requires authorityRef (no ambient authority). Action is non-effective.');
  }
}

/**
 * Enforce: Services cannot self-originate.
 * 
 * LOCK 4: Services must have delegation.
 */
export function enforceServiceDelegation(grantor) {
  if (grantor.kind === 'service' && !grantor.delegatedFrom) {
    throw new Error('FORBIDDEN: Services cannot originate authority (must be delegated from human).');
  }
}
