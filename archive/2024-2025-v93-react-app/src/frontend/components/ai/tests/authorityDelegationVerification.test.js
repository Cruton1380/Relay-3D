/**
 * AUTHORITY DELEGATION VERIFICATION TESTS
 * 
 * CRITICAL: These tests enforce the 5 non-negotiable authority locks.
 * All tests must FAIL LOUDLY when invariants are violated.
 */

import {
  createAuthorityScopeDefined,
  createDelegateAuthority,
  createRevokeAuthority,
  createAuthorityRef,
  verifyActionHasAuthority,
  verifyDelegationChain,
  verifyCapability,
  verifyServiceAuthority,
  verifyAuthority,
  enforceAuthorityRequired,
  enforceServiceDelegation,
  Capability,
} from '../schemas/authorityDelegationSchemas';

describe('Authority Delegation - ENFORCEMENT', () => {
  
  // ============================================================================
  // LOCK 1: NO AMBIENT AUTHORITY
  // ============================================================================
  
  describe('LOCK 1: No Ambient Authority', () => {
    test('FAIL: Action without authorityRef is invalid', () => {
      const actionCommit = {
        op: 'GRANT',
        actor: { kind: 'system', id: 'resource-manager' },
        // Missing authorityRef
      };
      
      const { valid, reason } = verifyActionHasAuthority(actionCommit);
      
      expect(valid).toBe(false);
      expect(reason).toBe('Missing authorityRef (no ambient authority)');
    });
    
    test('FAIL: Action without authorityRef throws when enforced', () => {
      const actionCommit = {
        op: 'GRANT',
        // Missing authorityRef
      };
      
      expect(() => {
        enforceAuthorityRequired(actionCommit);
      }).toThrow('FORBIDDEN: Action requires authorityRef (no ambient authority)');
    });
    
    test('PASS: Action with authorityRef is valid', () => {
      const actionCommit = {
        op: 'GRANT',
        authorityRef: createAuthorityRef('resource.gpu-1', Capability.GRANT_RESOURCE, [
          { filamentId: 'authority.resource.gpu-1', commitIndex: 1 }
        ], {}),
      };
      
      const { valid } = verifyActionHasAuthority(actionCommit);
      
      expect(valid).toBe(true);
    });
  });
  
  // ============================================================================
  // LOCK 2: DETERMINISTIC VALIDITY WINDOW
  // ============================================================================
  
  describe('LOCK 2: Deterministic Validity Window', () => {
    test('PASS: Delegation valid within expiryCommitIndex', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('resource.gpu-1', 0, 'resource', 'GPU-1 authority', 'v1.0'),
          createDelegateAuthority('resource.gpu-1', 1, 
            { kind: 'user', id: 'admin-1' },
            { kind: 'user', id: 'manager-1' },
            [Capability.GRANT_RESOURCE],
            { expiryCommitIndex: 100 }, // Expires at commit 100
            []
          ),
        ],
      };
      
      const authorityRef = createAuthorityRef('resource.gpu-1', Capability.GRANT_RESOURCE, [
        { filamentId: 'authority.resource.gpu-1', commitIndex: 1 }
      ], {});
      
      const { valid } = verifyDelegationChain(authorityFilament, authorityRef, 50); // Action at commit 50
      
      expect(valid).toBe(true);
    });
    
    test('FAIL: Delegation expired by commitIndex', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('resource.gpu-1', 0, 'resource', 'GPU-1 authority', 'v1.0'),
          createDelegateAuthority('resource.gpu-1', 1, 
            { kind: 'user', id: 'admin-1' },
            { kind: 'user', id: 'manager-1' },
            [Capability.GRANT_RESOURCE],
            { expiryCommitIndex: 100 }, // Expires at commit 100
            []
          ),
        ],
      };
      
      const authorityRef = createAuthorityRef('resource.gpu-1', Capability.GRANT_RESOURCE, [
        { filamentId: 'authority.resource.gpu-1', commitIndex: 1 }
      ], {});
      
      const { valid, reason } = verifyDelegationChain(authorityFilament, authorityRef, 150); // Action at commit 150 (expired)
      
      expect(valid).toBe(false);
      expect(reason).toContain('expired at commitIndex 100');
    });
  });
  
  // ============================================================================
  // LOCK 3: DELEGATION PROOF MINIMAL + CANONICAL
  // ============================================================================
  
  describe('LOCK 3: Delegation Proof Minimal + Canonical', () => {
    test('FAIL: Cycle in delegation graph', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('resource.gpu-1', 0, 'resource', 'GPU-1 authority', 'v1.0'),
          createDelegateAuthority('resource.gpu-1', 1, 
            { kind: 'user', id: 'admin-1' },
            { kind: 'user', id: 'manager-1' },
            [Capability.GRANT_RESOURCE],
            {},
            []
          ),
        ],
      };
      
      // Delegation path with cycle (same delegation repeated)
      const authorityRef = createAuthorityRef('resource.gpu-1', Capability.GRANT_RESOURCE, [
        { filamentId: 'authority.resource.gpu-1', commitIndex: 1 },
        { filamentId: 'authority.resource.gpu-1', commitIndex: 1 } // Cycle!
      ], {});
      
      const { valid, reason } = verifyDelegationChain(authorityFilament, authorityRef, 10);
      
      expect(valid).toBe(false);
      expect(reason).toContain('Cycle detected');
    });
    
    test('PASS: Clean delegation chain (no cycles)', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('resource.gpu-1', 0, 'resource', 'GPU-1 authority', 'v1.0'),
          createDelegateAuthority('resource.gpu-1', 1, 
            { kind: 'user', id: 'admin-1' },
            { kind: 'user', id: 'manager-1' },
            [Capability.GRANT_RESOURCE],
            {},
            []
          ),
          createDelegateAuthority('resource.gpu-1', 2, 
            { kind: 'user', id: 'manager-1' },
            { kind: 'service', id: 'scheduler', delegatedFrom: 'manager-1' },
            [Capability.GRANT_RESOURCE],
            {},
            []
          ),
        ],
      };
      
      const authorityRef = createAuthorityRef('resource.gpu-1', Capability.GRANT_RESOURCE, [
        { filamentId: 'authority.resource.gpu-1', commitIndex: 1 },
        { filamentId: 'authority.resource.gpu-1', commitIndex: 2 }
      ], {});
      
      const { valid } = verifyDelegationChain(authorityFilament, authorityRef, 10);
      
      expect(valid).toBe(true);
    });
  });
  
  // ============================================================================
  // LOCK 4: SERVICES ARE EXECUTORS, NOT AUTHORITIES
  // ============================================================================
  
  describe('LOCK 4: Services Are Executors, Not Authorities', () => {
    test('FAIL: Service originates authority without delegation', () => {
      expect(() => {
        createDelegateAuthority('resource.gpu-1', 1, 
          { kind: 'service', id: 'scheduler' }, // Service as grantor WITHOUT delegatedFrom
          { kind: 'user', id: 'user-1' },
          [Capability.GRANT_RESOURCE],
          {},
          []
        );
      }).toThrow('FORBIDDEN: Services cannot originate authority (must be delegated from human)');
    });
    
    test('FAIL: Service actor without delegation in chain', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('resource.gpu-1', 0, 'resource', 'GPU-1 authority', 'v1.0'),
          createDelegateAuthority('resource.gpu-1', 1, 
            { kind: 'user', id: 'admin-1' },
            { kind: 'user', id: 'manager-1' }, // Delegated to user, not service
            [Capability.GRANT_RESOURCE],
            {},
            []
          ),
        ],
      };
      
      const authorityRef = createAuthorityRef('resource.gpu-1', Capability.GRANT_RESOURCE, [
        { filamentId: 'authority.resource.gpu-1', commitIndex: 1 }
      ], {});
      
      const actionCommit = {
        op: 'GRANT',
        actor: { kind: 'service', id: 'scheduler' }, // Service actor
        authorityRef,
      };
      
      const { valid, reason } = verifyServiceAuthority(authorityFilament, authorityRef, actionCommit.actor);
      
      expect(valid).toBe(false);
      expect(reason).toContain('Service lacks explicit delegation');
    });
    
    test('PASS: Service with explicit delegation', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('resource.gpu-1', 0, 'resource', 'GPU-1 authority', 'v1.0'),
          createDelegateAuthority('resource.gpu-1', 1, 
            { kind: 'user', id: 'admin-1' },
            { kind: 'service', id: 'scheduler', delegatedFrom: 'admin-1' }, // Delegated to service
            [Capability.GRANT_RESOURCE],
            {},
            []
          ),
        ],
      };
      
      const authorityRef = createAuthorityRef('resource.gpu-1', Capability.GRANT_RESOURCE, [
        { filamentId: 'authority.resource.gpu-1', commitIndex: 1 }
      ], {});
      
      const actionCommit = {
        op: 'GRANT',
        actor: { kind: 'service', id: 'scheduler' },
        authorityRef,
      };
      
      const { valid } = verifyServiceAuthority(authorityFilament, authorityRef, actionCommit.actor);
      
      expect(valid).toBe(true);
    });
  });
  
  // ============================================================================
  // LOCK 5: REVOCATION IS FIRST-CLASS AND IMMEDIATE
  // ============================================================================
  
  describe('LOCK 5: Revocation Is First-Class and Immediate', () => {
    test('FAIL: Revoked delegation used', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('resource.gpu-1', 0, 'resource', 'GPU-1 authority', 'v1.0'),
          createDelegateAuthority('resource.gpu-1', 1, 
            { kind: 'user', id: 'admin-1' },
            { kind: 'user', id: 'manager-1' },
            [Capability.GRANT_RESOURCE],
            {},
            []
          ),
          createRevokeAuthority('resource.gpu-1', 5, 'resource.gpu-1:1', 'Manager role changed', []), // Revoked at commit 5
        ],
      };
      
      const authorityRef = createAuthorityRef('resource.gpu-1', Capability.GRANT_RESOURCE, [
        { filamentId: 'authority.resource.gpu-1', commitIndex: 1 }
      ], {});
      
      const { valid, reason } = verifyDelegationChain(authorityFilament, authorityRef, 10); // Action at commit 10 (after revocation)
      
      expect(valid).toBe(false);
      expect(reason).toContain('was revoked');
    });
    
    test('PASS: Delegation used before revocation', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('resource.gpu-1', 0, 'resource', 'GPU-1 authority', 'v1.0'),
          createDelegateAuthority('resource.gpu-1', 1, 
            { kind: 'user', id: 'admin-1' },
            { kind: 'user', id: 'manager-1' },
            [Capability.GRANT_RESOURCE],
            {},
            []
          ),
          createRevokeAuthority('resource.gpu-1', 10, 'resource.gpu-1:1', 'Manager role changed', []), // Revoked at commit 10
        ],
      };
      
      const authorityRef = createAuthorityRef('resource.gpu-1', Capability.GRANT_RESOURCE, [
        { filamentId: 'authority.resource.gpu-1', commitIndex: 1 }
      ], {});
      
      const { valid } = verifyDelegationChain(authorityFilament, authorityRef, 5); // Action at commit 5 (before revocation)
      
      expect(valid).toBe(true);
    });
    
    test('FAIL: Revoke at same commitIndex as action (boundary case)', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('resource.gpu-1', 0, 'resource', 'GPU-1 authority', 'v1.0'),
          createDelegateAuthority('resource.gpu-1', 1, 
            { kind: 'user', id: 'admin-1' },
            { kind: 'user', id: 'manager-1' },
            [Capability.GRANT_RESOURCE],
            {},
            []
          ),
          createRevokeAuthority('resource.gpu-1', 10, 'resource.gpu-1:1', 'Revoked', []), // Revoked at commit 10
        ],
      };
      
      const authorityRef = createAuthorityRef('resource.gpu-1', Capability.GRANT_RESOURCE, [
        { filamentId: 'authority.resource.gpu-1', commitIndex: 1 }
      ], {});
      
      // CRITICAL: Action at commitIndex 10 (same as revoke) → INVALID
      const { valid, reason } = verifyDelegationChain(authorityFilament, authorityRef, 10);
      
      expect(valid).toBe(false);
      expect(reason).toContain('was revoked');
    });
    
    test('PASS: Revoke after action commitIndex (future revoke)', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('resource.gpu-1', 0, 'resource', 'GPU-1 authority', 'v1.0'),
          createDelegateAuthority('resource.gpu-1', 1, 
            { kind: 'user', id: 'admin-1' },
            { kind: 'user', id: 'manager-1' },
            [Capability.GRANT_RESOURCE],
            {},
            []
          ),
          createRevokeAuthority('resource.gpu-1', 15, 'resource.gpu-1:1', 'Revoked', []), // Revoked at commit 15 (future)
        ],
      };
      
      const authorityRef = createAuthorityRef('resource.gpu-1', Capability.GRANT_RESOURCE, [
        { filamentId: 'authority.resource.gpu-1', commitIndex: 1 }
      ], {});
      
      // CRITICAL: Action at commitIndex 10 (before revoke at 15) → VALID
      const { valid } = verifyDelegationChain(authorityFilament, authorityRef, 10);
      
      expect(valid).toBe(true);
    });
  });
  
  // ============================================================================
  // CAPABILITY VERIFICATION
  // ============================================================================
  
  describe('Capability Verification', () => {
    test('FAIL: Wrong capability in delegation chain', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('resource.gpu-1', 0, 'resource', 'GPU-1 authority', 'v1.0'),
          createDelegateAuthority('resource.gpu-1', 1, 
            { kind: 'user', id: 'admin-1' },
            { kind: 'user', id: 'manager-1' },
            [Capability.CANCEL_REQUEST], // Only has CANCEL_REQUEST
            {},
            []
          ),
        ],
      };
      
      const authorityRef = createAuthorityRef('resource.gpu-1', Capability.GRANT_RESOURCE, [
        { filamentId: 'authority.resource.gpu-1', commitIndex: 1 }
      ], {});
      
      const { valid, reason } = verifyCapability(authorityFilament, authorityRef, Capability.GRANT_RESOURCE);
      
      expect(valid).toBe(false);
      expect(reason).toContain('Required capability GRANT_RESOURCE not found');
    });
    
    test('PASS: Correct capability in delegation chain', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('resource.gpu-1', 0, 'resource', 'GPU-1 authority', 'v1.0'),
          createDelegateAuthority('resource.gpu-1', 1, 
            { kind: 'user', id: 'admin-1' },
            { kind: 'user', id: 'manager-1' },
            [Capability.GRANT_RESOURCE, Capability.CANCEL_REQUEST],
            {},
            []
          ),
        ],
      };
      
      const authorityRef = createAuthorityRef('resource.gpu-1', Capability.GRANT_RESOURCE, [
        { filamentId: 'authority.resource.gpu-1', commitIndex: 1 }
      ], {});
      
      const { valid } = verifyCapability(authorityFilament, authorityRef, Capability.GRANT_RESOURCE);
      
      expect(valid).toBe(true);
    });
  });
  
  // ============================================================================
  // FULL VERIFICATION (ALL LOCKS)
  // ============================================================================
  
  describe('Full Authority Verification', () => {
    test('PASS: All locks satisfied', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('resource.gpu-1', 0, 'resource', 'GPU-1 authority', 'v1.0'),
          createDelegateAuthority('resource.gpu-1', 1, 
            { kind: 'user', id: 'admin-1' },
            { kind: 'user', id: 'manager-1' },
            [Capability.GRANT_RESOURCE],
            { expiryCommitIndex: 100 },
            []
          ),
        ],
      };
      
      const authorityRef = createAuthorityRef('resource.gpu-1', Capability.GRANT_RESOURCE, [
        { filamentId: 'authority.resource.gpu-1', commitIndex: 1 }
      ], {});
      
      const actionCommit = {
        op: 'GRANT',
        actor: { kind: 'user', id: 'manager-1' },
        authorityRef,
      };
      
      const { valid } = verifyAuthority(authorityFilament, actionCommit, Capability.GRANT_RESOURCE, 50);
      
      expect(valid).toBe(true);
    });
  });
  
});
