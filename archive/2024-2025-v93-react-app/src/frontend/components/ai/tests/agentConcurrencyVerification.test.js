/**
 * AGENT CONCURRENCY VERIFICATION TESTS
 * 
 * CRITICAL: These tests prove "no silent arbitration".
 * All tests must FAIL LOUDLY when invariants are violated.
 */

import {
  createQueueEnqueue,
  createQueueDequeue,
  createQueueReorder,
  createQueueCancel,
  createConflictDetected,
  createConflictResolvedByFork,
  createConflictResolvedBySelection,
  sortQueueDeterministically,
  detectConflict,
  verifyNoSilentArbitration,
  verifyDeterministicOrdering,
  verifySerializedMerge,
  verifyNoAutoResolve,
  enforceQueueHead,
  enforceBaseCommitMatch,
} from '../schemas/mergeQueueSchemas';

describe('Agent Concurrency - ENFORCEMENT', () => {
  
  // ============================================================================
  // DETERMINISTIC ORDERING
  // ============================================================================
  
  describe('Deterministic Ordering', () => {
    test('PASS: Two proposals enqueued in different wall-clock order → queue order identical', () => {
      // Create two proposals with different timestamps but same base
      const proposalA = createQueueEnqueue(
        'example.js',
        0,
        'file.example.js@proposal/task-A',
        'task-A',
        'agent-1',
        'sha256:base123',
        ['A1', 'B1']
      );
      
      const proposalB = createQueueEnqueue(
        'example.js',
        1,
        'file.example.js@proposal/task-B',
        'task-B',
        'agent-2',
        'sha256:base123',
        ['C1', 'D1']
      );
      
      // Sort in both orders
      const order1 = sortQueueDeterministically([proposalA, proposalB]);
      const order2 = sortQueueDeterministically([proposalB, proposalA]);
      
      // Orders must be identical
      expect(order1[0].payload.proposalBranchId).toBe(order2[0].payload.proposalBranchId);
      expect(order1[1].payload.proposalBranchId).toBe(order2[1].payload.proposalBranchId);
    });
    
    test('PASS: Queue ordering does not depend on wall-clock arrival', () => {
      const queueFilament = {
        filamentId: 'queue.example.js',
        commits: [
          createQueueEnqueue('example.js', 0, 'file.example.js@proposal/zzz', 'zzz', 'agent-1', 'sha256:base', ['A1']),
          createQueueEnqueue('example.js', 1, 'file.example.js@proposal/aaa', 'aaa', 'agent-2', 'sha256:base', ['B1']),
        ],
      };
      
      // Sort deterministically
      const sorted = sortQueueDeterministically(queueFilament.commits);
      
      // 'aaa' should come before 'zzz' (lexicographic, not arrival time)
      expect(sorted[0].payload.taskId).toBe('aaa');
      expect(sorted[1].payload.taskId).toBe('zzz');
    });
    
    test('VERIFY: Queue ordering is deterministic across reloads', () => {
      const queueFilament = {
        filamentId: 'queue.example.js',
        commits: [
          createQueueEnqueue('example.js', 0, 'file.example.js@proposal/task-C', 'task-C', 'agent-1', 'sha256:base', ['A1']),
          createQueueEnqueue('example.js', 1, 'file.example.js@proposal/task-A', 'task-A', 'agent-2', 'sha256:base', ['B1']),
          createQueueEnqueue('example.js', 2, 'file.example.js@proposal/task-B', 'task-B', 'agent-3', 'sha256:base', ['C1']),
        ],
      };
      
      expect(verifyDeterministicOrdering(queueFilament)).toBe(true);
    });
  });
  
  // ============================================================================
  // CONFLICT DETECTION
  // ============================================================================
  
  describe('Conflict Detection', () => {
    test('PASS: ProposalA touches [A1,B1], ProposalB touches [B1,C1] → conflict detected', () => {
      const proposalA = {
        proposalBranchId: 'file.example.js@proposal/task-A',
        touchedLoci: ['A1', 'B1'],
        baseCommitHash: 'sha256:base',
      };
      
      const proposalB = {
        proposalBranchId: 'file.example.js@proposal/task-B',
        touchedLoci: ['B1', 'C1'],
        baseCommitHash: 'sha256:base',
      };
      
      const { hasConflict, overlap } = detectConflict(proposalA, proposalB);
      
      expect(hasConflict).toBe(true);
      expect(overlap).toEqual(['B1']);
    });
    
    test('PASS: No overlap → no conflict', () => {
      const proposalA = {
        proposalBranchId: 'file.example.js@proposal/task-A',
        touchedLoci: ['A1', 'B1'],
        baseCommitHash: 'sha256:base',
      };
      
      const proposalB = {
        proposalBranchId: 'file.example.js@proposal/task-B',
        touchedLoci: ['C1', 'D1'],
        baseCommitHash: 'sha256:base',
      };
      
      const { hasConflict, overlap } = detectConflict(proposalA, proposalB);
      
      expect(hasConflict).toBe(false);
      expect(overlap).toEqual([]);
    });
    
    test('FAIL: Cannot create CONFLICT_DETECTED without actual overlap', () => {
      const proposalA = {
        proposalBranchId: 'file.example.js@proposal/task-A',
        touchedLoci: ['A1'],
        baseCommitHash: 'sha256:base',
      };
      
      const proposalB = {
        proposalBranchId: 'file.example.js@proposal/task-B',
        touchedLoci: ['B1'],
        baseCommitHash: 'sha256:base',
      };
      
      expect(() => {
        createConflictDetected('example.js', proposalA, proposalB, 0);
      }).toThrow('FORBIDDEN: Cannot create CONFLICT_DETECTED without actual loci overlap');
    });
  });
  
  // ============================================================================
  // NO SILENT ARBITRATION
  // ============================================================================
  
  describe('No Silent Arbitration', () => {
    test('PASS: Conflict exists → conflict filament exists', () => {
      const queueFilament = {
        filamentId: 'queue.example.js',
        commits: [
          createQueueEnqueue('example.js', 0, 'file.example.js@proposal/task-A', 'task-A', 'agent-1', 'sha256:base', ['A1', 'B1']),
          createQueueEnqueue('example.js', 1, 'file.example.js@proposal/task-B', 'task-B', 'agent-2', 'sha256:base', ['B1', 'C1']),
        ],
      };
      
      const conflictFilaments = [
        {
          filamentId: 'conflict.example.js.file.example.js@proposal/task-A.file.example.js@proposal/task-B',
          commits: [
            createConflictDetected(
              'example.js',
              { proposalBranchId: 'file.example.js@proposal/task-A', touchedLoci: ['A1', 'B1'], baseCommitHash: 'sha256:base' },
              { proposalBranchId: 'file.example.js@proposal/task-B', touchedLoci: ['B1', 'C1'], baseCommitHash: 'sha256:base' },
              0
            ),
          ],
        },
      ];
      
      expect(verifyNoSilentArbitration(queueFilament, conflictFilaments)).toBe(true);
    });
    
    test('FAIL: Conflict exists → no conflict filament = silent arbitration', () => {
      const queueFilament = {
        filamentId: 'queue.example.js',
        commits: [
          createQueueEnqueue('example.js', 0, 'file.example.js@proposal/task-A', 'task-A', 'agent-1', 'sha256:base', ['A1', 'B1']),
          createQueueEnqueue('example.js', 1, 'file.example.js@proposal/task-B', 'task-B', 'agent-2', 'sha256:base', ['B1', 'C1']),
        ],
      };
      
      const conflictFilaments = []; // No conflict filament!
      
      expect(verifyNoSilentArbitration(queueFilament, conflictFilaments)).toBe(false);
    });
  });
  
  // ============================================================================
  // NO AUTO-RESOLVE
  // ============================================================================
  
  describe('No Auto-Resolve', () => {
    test('PASS: Conflict resolution requires human authority', () => {
      const conflictFilaments = [
        {
          filamentId: 'conflict.example.js.propA.propB',
          commits: [
            createConflictDetected(
              'example.js',
              { proposalBranchId: 'propA', touchedLoci: ['A1', 'B1'], baseCommitHash: 'sha256:base' },
              { proposalBranchId: 'propB', touchedLoci: ['B1', 'C1'], baseCommitHash: 'sha256:base' },
              0
            ),
            createConflictResolvedByFork(
              'example.js',
              'propA',
              'propB',
              1,
              'file.example.js@fork/A',
              'file.example.js@fork/B',
              { triggeredBy: { kind: 'user', id: 'user-1' }, evidenceRefs: ['sig-1'] }
            ),
          ],
        },
      ];
      
      expect(verifyNoAutoResolve(conflictFilaments)).toBe(true);
    });
    
    test('FAIL: Conflict resolved without authority = auto-resolve', () => {
      const conflictFilaments = [
        {
          filamentId: 'conflict.example.js.propA.propB',
          commits: [
            {
              op: 'CONFLICT_RESOLVED_BY_FORK',
              payload: {
                authority: null, // Missing authority
              },
            },
          ],
        },
      ];
      
      expect(verifyNoAutoResolve(conflictFilaments)).toBe(false);
    });
    
    test('FAIL: Conflict resolved by system = auto-resolve', () => {
      const conflictFilaments = [
        {
          filamentId: 'conflict.example.js.propA.propB',
          commits: [
            {
              op: 'CONFLICT_RESOLVED_BY_FORK',
              payload: {
                authority: {
                  triggeredBy: 'system', // FORBIDDEN
                },
              },
            },
          ],
        },
      ];
      
      expect(verifyNoAutoResolve(conflictFilaments)).toBe(false);
    });
  });
  
  // ============================================================================
  // SERIALIZE MERGES
  // ============================================================================
  
  describe('Serialize Merges', () => {
    test('PASS: Two non-overlapping proposals → merges occur one-at-a-time in queue order', () => {
      const queueFilament = {
        filamentId: 'queue.example.js',
        commits: [
          createQueueEnqueue('example.js', 0, 'file.example.js@proposal/task-A', 'task-A', 'agent-1', 'sha256:base', ['A1']),
          createQueueEnqueue('example.js', 1, 'file.example.js@proposal/task-B', 'task-B', 'agent-2', 'sha256:base', ['B1']),
        ],
      };
      
      const fileFilament = {
        filamentId: 'file.example.js',
        commits: [
          { op: 'FILE_CREATED' },
          { op: 'MERGE_SCAR', payload: { proposalBranchId: 'file.example.js@proposal/task-A' } },
          { op: 'MERGE_SCAR', payload: { proposalBranchId: 'file.example.js@proposal/task-B' } },
        ],
      };
      
      // After first merge, dequeue
      queueFilament.commits.push(createQueueDequeue('example.js', 2, 'file.example.js@proposal/task-A', 'merged'));
      
      // Second merge at new head
      expect(verifySerializedMerge(queueFilament, fileFilament)).toBe(true);
    });
    
    test('FAIL: Merge attempt when not at queue head throws', () => {
      const queueFilament = {
        filamentId: 'queue.example.js',
        commits: [
          createQueueEnqueue('example.js', 0, 'file.example.js@proposal/task-A', 'task-A', 'agent-1', 'sha256:base', ['A1']),
          createQueueEnqueue('example.js', 1, 'file.example.js@proposal/task-B', 'task-B', 'agent-2', 'sha256:base', ['B1']),
        ],
      };
      
      // Try to merge task-B (not at head)
      expect(() => {
        enforceQueueHead(queueFilament, 'file.example.js@proposal/task-B');
      }).toThrow('FORBIDDEN: Cannot merge file.example.js@proposal/task-B - not at queue head');
    });
  });
  
  // ============================================================================
  // BASE COMMIT MATCH
  // ============================================================================
  
  describe('Base Commit Match', () => {
    test('FAIL: Merge attempt with mismatched base → conflict path required', () => {
      const proposal = {
        proposalBranchId: 'file.example.js@proposal/task-A',
        baseCommitHash: 'sha256:old-base',
      };
      
      const fileHeadHash = 'sha256:new-base'; // File moved forward
      
      expect(() => {
        enforceBaseCommitMatch(proposal, fileHeadHash);
      }).toThrow('FORBIDDEN: Cannot merge - baseCommitHash mismatch');
    });
  });
  
  // ============================================================================
  // QUEUE OPERATIONS REQUIRE AUTHORITY
  // ============================================================================
  
  describe('Queue Operations Require Authority', () => {
    test('FAIL: Queue reorder without authority throws', () => {
      expect(() => {
        createQueueReorder('example.js', 0, ['propA', 'propB'], null);
      }).toThrow('FORBIDDEN: Queue reorder requires human authority with signatures');
    });
    
    test('FAIL: Queue cancel without authority throws', () => {
      expect(() => {
        createQueueCancel('example.js', 0, 'propA', null);
      }).toThrow('FORBIDDEN: Queue cancel requires human authority');
    });
    
    test('PASS: Queue operations with authority succeed', () => {
      expect(() => {
        createQueueReorder('example.js', 0, ['propA', 'propB'], {
          byHumanId: 'user-1',
          policyId: 'urgent-reorder',
          reason: 'Urgent fix',
          signatures: ['sig-1', 'sig-2'],
        });
      }).not.toThrow();
      
      expect(() => {
        createQueueCancel('example.js', 0, 'propA', {
          byHumanId: 'user-1',
          reason: 'Obsolete',
        });
      }).not.toThrow();
    });
  });
  
  // ============================================================================
  // TOUCHED LOCI REQUIRED
  // ============================================================================
  
  describe('Touched Loci Required', () => {
    test('FAIL: Queue enqueue without touchedLoci throws', () => {
      expect(() => {
        createQueueEnqueue('example.js', 0, 'propA', 'task-A', 'agent-1', 'sha256:base', []);
      }).toThrow('FORBIDDEN: Queue entry requires touchedLoci for conflict detection');
    });
    
    test('FAIL: Queue enqueue without baseCommitHash throws', () => {
      expect(() => {
        createQueueEnqueue('example.js', 0, 'propA', 'task-A', 'agent-1', null, ['A1']);
      }).toThrow('FORBIDDEN: Queue entry requires baseCommitHash for deterministic ordering');
    });
  });
  
});
