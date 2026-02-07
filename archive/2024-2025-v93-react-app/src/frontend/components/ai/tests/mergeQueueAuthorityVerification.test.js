/**
 * MERGE QUEUE AUTHORITY VERIFICATION TESTS (ADVERSARIAL)
 * 
 * CRITICAL: These tests prove the conservation laws are unbreakable.
 * Every test in this file MUST demonstrate a forbidden pattern FAILS.
 * 
 * Conservation Laws Being Tested:
 * 1. Legitimacy Conservation: No ambient authority
 * 2. Truth Conservation: No retroactive mutation
 * 3. Causal Locality: No action without prior cause
 */

import {
  QueueOp,
  ConflictOp,
  createQueueReorder,
  createQueueCancel,
  createConflictResolvedByFork,
  createConflictResolvedBySelection,
  verifyOperation,
  verifyQueueReorder,
  verifyQueueCancel,
  verifyConflictFork,
  verifyConflictSelection,
} from '../schemas/mergeQueueSchemas';

import {
  createAuthorityScopeDefined,
  createDelegateAuthority,
  createRevokeAuthority,
  createAuthorityRef,
  Capability,
} from '../schemas/authorityDelegationSchemas';

describe('Merge Queue Authority - CONSERVATION LAW ENFORCEMENT', () => {
  
  // ============================================================================
  // CONSERVATION LAW 1: NO AMBIENT AUTHORITY
  // ============================================================================
  
  describe('CONSERVATION LAW 1: Legitimacy Conservation (No Ambient Authority)', () => {
    
    test('FAIL: QUEUE_REORDER without authorityRef throws', () => {
      expect(() => {
        createQueueReorder(
          'api.js',
          10,
          ['proposal-A', 'proposal-B'],
          null, // Missing authorityRef
          'Reorder reason'
        );
      }).toThrow('FORBIDDEN: Queue reorder requires authorityRef (no ambient authority)');
    });
    
    test('FAIL: QUEUE_CANCEL without authorityRef throws', () => {
      expect(() => {
        createQueueCancel(
          'api.js',
          10,
          'proposal-A',
          null, // Missing authorityRef
          'Cancel reason'
        );
      }).toThrow('FORBIDDEN: Queue cancel requires authorityRef (no ambient authority)');
    });
    
    test('FAIL: CONFLICT_RESOLVED_BY_FORK without authorityRef throws', () => {
      expect(() => {
        createConflictResolvedByFork(
          'api.js',
          'proposal-A',
          'proposal-B',
          10,
          'fork-A',
          'fork-B',
          null // Missing authorityRef
        );
      }).toThrow('FORBIDDEN: Fork resolution requires authorityRef (no ambient authority)');
    });
    
    test('FAIL: CONFLICT_RESOLVED_BY_SELECTION without authorityRef throws', () => {
      expect(() => {
        createConflictResolvedBySelection(
          'api.js',
          'proposal-A',
          'proposal-B',
          10,
          'proposal-A',
          null, // Missing authorityRef
          'Selection reason'
        );
      }).toThrow('FORBIDDEN: Selection resolution requires authorityRef (no ambient authority)');
    });
    
  });
  
  // ============================================================================
  // CONSERVATION LAW 2: CAPABILITY MUST MATCH
  // ============================================================================
  
  describe('CONSERVATION LAW 2: Capability Conservation (Right Permission Required)', () => {
    
    test('FAIL: QUEUE_REORDER with wrong capability throws', () => {
      const wrongCapabilityRef = createAuthorityRef(
        'authority.queue.api.js',
        Capability.AUTHORIZE_MERGE, // Wrong capability
        [{ filamentId: 'authority.queue.api.js', commitIndex: 1 }],
        {}
      );
      
      expect(() => {
        createQueueReorder(
          'api.js',
          10,
          ['proposal-A', 'proposal-B'],
          wrongCapabilityRef,
          'Reorder reason'
        );
      }).toThrow('FORBIDDEN: Queue reorder requires REORDER_QUEUE capability');
    });
    
    test('FAIL: QUEUE_CANCEL with wrong capability throws', () => {
      const wrongCapabilityRef = createAuthorityRef(
        'authority.queue.api.js',
        Capability.REORDER_QUEUE, // Wrong capability
        [{ filamentId: 'authority.queue.api.js', commitIndex: 1 }],
        {}
      );
      
      expect(() => {
        createQueueCancel(
          'api.js',
          10,
          'proposal-A',
          wrongCapabilityRef,
          'Cancel reason'
        );
      }).toThrow('FORBIDDEN: Queue cancel requires CANCEL_QUEUE_ITEM capability');
    });
    
    test('FAIL: CONFLICT_RESOLVED_BY_SELECTION with AUTHORIZE_FORK throws', () => {
      const wrongCapabilityRef = createAuthorityRef(
        'authority.conflict.api.js',
        Capability.AUTHORIZE_FORK, // Wrong capability
        [{ filamentId: 'authority.conflict.api.js', commitIndex: 1 }],
        {}
      );
      
      expect(() => {
        createConflictResolvedBySelection(
          'api.js',
          'proposal-A',
          'proposal-B',
          10,
          'proposal-A',
          wrongCapabilityRef,
          'Selection reason'
        );
      }).toThrow('FORBIDDEN: Selection resolution requires AUTHORIZE_SELECTION capability');
    });
    
  });
  
  // ============================================================================
  // CONSERVATION LAW 3: DOMAIN CONSTRAINTS (Queue State)
  // ============================================================================
  
  describe('CONSERVATION LAW 3: Truth Conservation (Queue State Integrity)', () => {
    
    test('FAIL: Queue reorder adds non-existent item', () => {
      const queueFilament = {
        commits: [
          {
            op: QueueOp.QUEUE_ENQUEUE,
            commitIndex: 1,
            payload: { proposalBranchId: 'proposal-A' }
          },
          {
            op: QueueOp.QUEUE_ENQUEUE,
            commitIndex: 2,
            payload: { proposalBranchId: 'proposal-B' }
          }
        ]
      };
      
      const reorderCommit = {
        op: QueueOp.QUEUE_REORDER,
        commitIndex: 10,
        payload: {
          newOrder: ['proposal-A', 'proposal-B', 'proposal-C'] // proposal-C doesn't exist!
        }
      };
      
      const { valid, reason } = verifyQueueReorder(queueFilament, reorderCommit, 10);
      
      expect(valid).toBe(false);
      expect(reason).toContain('adds non-existent item');
    });
    
    test('FAIL: Queue reorder removes item', () => {
      const queueFilament = {
        commits: [
          {
            op: QueueOp.QUEUE_ENQUEUE,
            commitIndex: 1,
            payload: { proposalBranchId: 'proposal-A' }
          },
          {
            op: QueueOp.QUEUE_ENQUEUE,
            commitIndex: 2,
            payload: { proposalBranchId: 'proposal-B' }
          }
        ]
      };
      
      const reorderCommit = {
        op: QueueOp.QUEUE_REORDER,
        commitIndex: 10,
        payload: {
          newOrder: ['proposal-A'] // Missing proposal-B!
        }
      };
      
      const { valid, reason } = verifyQueueReorder(queueFilament, reorderCommit, 10);
      
      expect(valid).toBe(false);
      expect(reason).toContain('changes count');
    });
    
    test('FAIL: Queue cancel non-existent item', () => {
      const queueFilament = {
        commits: [
          {
            op: QueueOp.QUEUE_ENQUEUE,
            commitIndex: 1,
            payload: { proposalBranchId: 'proposal-A' }
          }
        ]
      };
      
      const cancelCommit = {
        op: QueueOp.QUEUE_CANCEL,
        commitIndex: 10,
        payload: {
          proposalBranchId: 'proposal-B' // Doesn't exist!
        }
      };
      
      const { valid, reason } = verifyQueueCancel(queueFilament, cancelCommit, 10);
      
      expect(valid).toBe(false);
      expect(reason).toContain('non-existent item');
    });
    
  });
  
  // ============================================================================
  // CONSERVATION LAW 4: CONFLICT INTEGRITY
  // ============================================================================
  
  describe('CONSERVATION LAW 4: Conflict Conservation (No Phantom Resolutions)', () => {
    
    test('FAIL: Fork resolution without prior CONFLICT_DETECTED', () => {
      const conflictFilament = {
        commits: [] // No conflict detected!
      };
      
      const forkCommit = {
        op: ConflictOp.CONFLICT_RESOLVED_BY_FORK,
        commitIndex: 10,
        payload: {
          forkBranchIdA: 'fork-A',
          forkBranchIdB: 'fork-B'
        }
      };
      
      const { valid, reason } = verifyConflictFork(conflictFilament, forkCommit);
      
      expect(valid).toBe(false);
      expect(reason).toContain('without prior CONFLICT_DETECTED');
    });
    
    test('FAIL: Fork resolution for conflict with no overlap', () => {
      const conflictFilament = {
        commits: [
          {
            op: ConflictOp.CONFLICT_DETECTED,
            commitIndex: 5,
            payload: {
              proposalA: { proposalBranchId: 'proposal-A' },
              proposalB: { proposalBranchId: 'proposal-B' },
              overlap: [] // No overlap!
            }
          }
        ]
      };
      
      const forkCommit = {
        op: ConflictOp.CONFLICT_RESOLVED_BY_FORK,
        commitIndex: 10,
        payload: {
          forkBranchIdA: 'fork-A',
          forkBranchIdB: 'fork-B'
        }
      };
      
      const { valid, reason } = verifyConflictFork(conflictFilament, forkCommit);
      
      expect(valid).toBe(false);
      expect(reason).toContain('no loci overlap');
    });
    
    test('FAIL: Selection chose non-conflicting proposal', () => {
      const conflictFilament = {
        commits: [
          {
            op: ConflictOp.CONFLICT_DETECTED,
            commitIndex: 5,
            payload: {
              proposalA: { proposalBranchId: 'proposal-A' },
              proposalB: { proposalBranchId: 'proposal-B' },
              overlap: ['cell-1']
            }
          }
        ]
      };
      
      const selectionCommit = {
        op: ConflictOp.CONFLICT_RESOLVED_BY_SELECTION,
        commitIndex: 10,
        payload: {
          chosenProposalBranchId: 'proposal-C', // Not in conflict!
          rejectedProposalBranchId: 'proposal-A'
        }
      };
      
      const { valid, reason } = verifyConflictSelection(conflictFilament, selectionCommit);
      
      expect(valid).toBe(false);
      expect(reason).toContain('non-conflicting proposal');
    });
    
    test('FAIL: Selection rejected wrong proposal', () => {
      const conflictFilament = {
        commits: [
          {
            op: ConflictOp.CONFLICT_DETECTED,
            commitIndex: 5,
            payload: {
              proposalA: { proposalBranchId: 'proposal-A' },
              proposalB: { proposalBranchId: 'proposal-B' },
              overlap: ['cell-1']
            }
          }
        ]
      };
      
      const selectionCommit = {
        op: ConflictOp.CONFLICT_RESOLVED_BY_SELECTION,
        commitIndex: 10,
        payload: {
          chosenProposalBranchId: 'proposal-A',
          rejectedProposalBranchId: 'proposal-C' // Should be proposal-B!
        }
      };
      
      const { valid, reason } = verifyConflictSelection(conflictFilament, selectionCommit);
      
      expect(valid).toBe(false);
      expect(reason).toContain('rejected wrong proposal');
    });
    
  });
  
  // ============================================================================
  // CONSERVATION LAW 5: CAUSAL LOCALITY (Revocation Boundary)
  // ============================================================================
  
  describe('CONSERVATION LAW 5: Causal Locality (Revocation Boundary)', () => {
    
    test('FAIL: Revoke at same commitIndex as action invalidates action', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('queue.api.js', 0, 'queue', 'Queue authority', 'v1.0'),
          createDelegateAuthority('queue.api.js', 1,
            { kind: 'user', id: 'admin' },
            { kind: 'user', id: 'manager' },
            [Capability.REORDER_QUEUE],
            {},
            []
          ),
          createRevokeAuthority('queue.api.js', 10, 'queue.api.js:1', 'Revoked', []) // Revoked at commit 10
        ]
      };
      
      const authorityRef = createAuthorityRef(
        'authority.queue.api.js',
        Capability.REORDER_QUEUE,
        [{ filamentId: 'authority.queue.api.js', commitIndex: 1 }],
        {}
      );
      
      const reorderCommit = createQueueReorder(
        'api.js',
        10, // Same commitIndex as revoke
        ['proposal-A', 'proposal-B'],
        authorityRef,
        'Reorder'
      );
      
      // This should fail because revoke happens at same commitIndex
      // Note: Full authority verification would be done via verifyOperation
      // For this test, we're showing the boundary condition
      const queueFilament = {
        commits: [
          { op: QueueOp.QUEUE_ENQUEUE, commitIndex: 1, payload: { proposalBranchId: 'proposal-A' } },
          { op: QueueOp.QUEUE_ENQUEUE, commitIndex: 2, payload: { proposalBranchId: 'proposal-B' } }
        ]
      };
      
      const result = verifyOperation(
        reorderCommit,
        10,
        authorityFilament,
        { queueFilament }
      );
      
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('revoked');
    });
    
  });
  
  // ============================================================================
  // UNIFIED VERIFICATION (Integration Test)
  // ============================================================================
  
  describe('UNIFIED VERIFICATION: All Conservation Laws Together', () => {
    
    test('PASS: Valid queue reorder with proper authority and domain constraints', () => {
      const authorityFilament = {
        commits: [
          createAuthorityScopeDefined('queue.api.js', 0, 'queue', 'Queue authority', 'v1.0'),
          createDelegateAuthority('queue.api.js', 1,
            { kind: 'user', id: 'admin' },
            { kind: 'user', id: 'manager' },
            [Capability.REORDER_QUEUE],
            { expiryCommitIndex: 100 },
            []
          )
        ]
      };
      
      const authorityRef = createAuthorityRef(
        'authority.queue.api.js',
        Capability.REORDER_QUEUE,
        [{ filamentId: 'authority.queue.api.js', commitIndex: 1 }],
        {}
      );
      
      const queueFilament = {
        commits: [
          { op: QueueOp.QUEUE_ENQUEUE, commitIndex: 1, payload: { proposalBranchId: 'proposal-A' } },
          { op: QueueOp.QUEUE_ENQUEUE, commitIndex: 2, payload: { proposalBranchId: 'proposal-B' } }
        ]
      };
      
      const reorderCommit = createQueueReorder(
        'api.js',
        50, // Within expiry
        ['proposal-B', 'proposal-A'], // Valid permutation
        authorityRef,
        'Prioritize critical fix'
      );
      
      const result = verifyOperation(
        reorderCommit,
        50,
        authorityFilament,
        { queueFilament }
      );
      
      expect(result.ok).toBe(true);
      expect(result.derived).toBeDefined();
      expect(result.derived.capability).toBe(Capability.REORDER_QUEUE);
    });
    
    test('FAIL: Multiple violations (no authority + wrong domain state)', () => {
      // This operation violates MULTIPLE conservation laws
      expect(() => {
        createQueueReorder(
          'api.js',
          10,
          ['proposal-C'], // Doesn't exist in queue (domain violation)
          null, // No authority (legitimacy violation)
          'Invalid operation'
        );
      }).toThrow('FORBIDDEN'); // Should fail at schema level
    });
    
  });
  
});
