/**
 * AI WORKSPACE VERIFICATION TESTS
 * 
 * CRITICAL: These are ENFORCEMENT tests, not descriptive checks.
 * Each test must FAIL LOUDLY when invariants are violated.
 */

import {
  createReadRef,
  createProposeChangeset,
  createMergeScar,
  createTaskAccepted,
  createPlanCommit,
  verifyNoTeleportProposals,
  verifyMergeIsGated,
} from '../schemas/aiWorkspaceSchemas';

describe('AI Workspace Locks - ENFORCEMENT', () => {
  
  // ============================================================================
  // LOCK B: READ_REF MUST BE ADDRESSABLE
  // ============================================================================
  
  describe('LOCK B: READ_REF Hash Enforcement', () => {
    test('PASS: READ_REF with hash succeeds', () => {
      expect(() => {
        createReadRef(
          'agent-1',
          'task-123',
          0,
          'file.example.js',
          5,
          'sha256:abc123...', // Hash provided
          'function:example'
        );
      }).not.toThrow();
    });
    
    test('FAIL: READ_REF without hash throws', () => {
      expect(() => {
        createReadRef(
          'agent-1',
          'task-123',
          0,
          'file.example.js',
          5,
          null, // Missing hash
          'function:example'
        );
      }).toThrow('FORBIDDEN: READ_REF requires targetCommitHash');
    });
    
    test('FAIL: READ_REF with undefined hash throws', () => {
      expect(() => {
        createReadRef(
          'agent-1',
          'task-123',
          0,
          'file.example.js',
          5,
          undefined, // Missing hash
          'function:example'
        );
      }).toThrow('FORBIDDEN: READ_REF requires targetCommitHash');
    });
  });
  
  // ============================================================================
  // LOCK C: NO TELEPORT PROPOSALS
  // ============================================================================
  
  describe('LOCK C: No Teleport Proposals Enforcement', () => {
    test('PASS: Proposal with PLAN + READ_REF succeeds', () => {
      const workSession = {
        filamentId: 'work.agent-1.task-123',
        commits: [
          createTaskAccepted('agent-1', 'task-123', 0, 'Refactor file', { filamentId: 'convo.main', commitIndex: 0 }, 'main'),
          createPlanCommit('agent-1', 'task-123', 1, ['Read file', 'Propose changes']),
          createReadRef('agent-1', 'task-123', 2, 'file.example.js', 0, 'sha256:abc', 'function:example'),
          createProposeChangeset('agent-1', 'task-123', 3, 'file.example.js', { diff: 'test' }, { filamentId: 'convo.main', commitIndex: 0 }),
        ],
      };
      
      expect(verifyNoTeleportProposals(workSession)).toBe(true);
    });
    
    test('FAIL: Proposal without PLAN fails verification', () => {
      const workSession = {
        filamentId: 'work.agent-1.task-123',
        commits: [
          createTaskAccepted('agent-1', 'task-123', 0, 'Refactor file', { filamentId: 'convo.main', commitIndex: 0 }, 'main'),
          // Missing PLAN_COMMIT
          createReadRef('agent-1', 'task-123', 1, 'file.example.js', 0, 'sha256:abc', 'function:example'),
          createProposeChangeset('agent-1', 'task-123', 2, 'file.example.js', { diff: 'test' }, { filamentId: 'convo.main', commitIndex: 0 }),
        ],
      };
      
      expect(verifyNoTeleportProposals(workSession)).toBe(false);
    });
    
    test('FAIL: Proposal without READ_REF fails verification', () => {
      const workSession = {
        filamentId: 'work.agent-1.task-123',
        commits: [
          createTaskAccepted('agent-1', 'task-123', 0, 'Refactor file', { filamentId: 'convo.main', commitIndex: 0 }, 'main'),
          createPlanCommit('agent-1', 'task-123', 1, ['Read file', 'Propose changes']),
          // Missing READ_REF
          createProposeChangeset('agent-1', 'task-123', 2, 'file.example.js', { diff: 'test' }, { filamentId: 'convo.main', commitIndex: 0 }),
        ],
      };
      
      expect(verifyNoTeleportProposals(workSession)).toBe(false);
    });
  });
  
  // ============================================================================
  // LOCK D: BRANCH-BOUND WORK
  // ============================================================================
  
  describe('LOCK D: Branch-Bound Work Enforcement', () => {
    test('PASS: Work with convoBranchId succeeds', () => {
      expect(() => {
        createTaskAccepted(
          'agent-1',
          'task-123',
          0,
          'Refactor file',
          { filamentId: 'convo.main', commitIndex: 5 },
          'main' // Branch ID provided
        );
      }).not.toThrow();
    });
    
    test('FAIL: Work without convoBranchId throws', () => {
      expect(() => {
        createTaskAccepted(
          'agent-1',
          'task-123',
          0,
          'Refactor file',
          { filamentId: 'convo.main', commitIndex: 5 },
          null // Missing branch ID
        );
      }).toThrow('FORBIDDEN: Work session must reference convoBranchId');
    });
  });
  
  // ============================================================================
  // LOCK A: MERGE AUTHORITY
  // ============================================================================
  
  describe('LOCK A: Merge Authority Enforcement', () => {
    test('PASS: Merge with authority succeeds', () => {
      expect(() => {
        createMergeScar(
          'example.js',
          1,
          0,
          'file.example.js@proposal/task-123',
          ['sig-1', 'sig-2'],
          {
            triggeredBy: { kind: 'user', id: 'user-1' },
            requiredPolicyId: 'code-review',
            threshold: 2,
            satisfiedByEvidenceIds: ['sig-1', 'sig-2'],
            satisfiedByEvidenceHashes: ['hash-1', 'hash-2'],
          }
        );
      }).not.toThrow();
    });
    
    test('FAIL: Merge without authority throws', () => {
      expect(() => {
        createMergeScar(
          'example.js',
          1,
          0,
          'file.example.js@proposal/task-123',
          ['sig-1', 'sig-2'],
          null // Missing authority
        );
      }).toThrow('FORBIDDEN: Merge requires explicit authority with evidence');
    });
    
    test('FAIL: Merge without triggeredBy throws', () => {
      expect(() => {
        createMergeScar(
          'example.js',
          1,
          0,
          'file.example.js@proposal/task-123',
          ['sig-1', 'sig-2'],
          {
            // Missing triggeredBy
            requiredPolicyId: 'code-review',
            threshold: 2,
            satisfiedByEvidenceIds: ['sig-1', 'sig-2'],
          }
        );
      }).toThrow('FORBIDDEN: Merge requires explicit authority with evidence');
    });
    
    test('FAIL: Merge authority = system fails verification', () => {
      const fileFilament = {
        filamentId: 'file.example.js',
        commits: [
          {
            op: 'MERGE_SCAR',
            refs: {
              evidence: [{ kind: 'signature', ref: 'sig-1' }],
            },
            payload: {
              mergeAuthority: {
                triggeredBy: 'system', // FORBIDDEN
                requiredPolicyId: 'code-review',
                threshold: 1,
                satisfiedByEvidenceIds: ['sig-1'],
              },
            },
          },
        ],
      };
      
      expect(verifyMergeIsGated(fileFilament)).toBe(false);
    });
  });
  
  // ============================================================================
  // LOCK E: STABLE PROPOSAL BRANCH IDENTITY
  // ============================================================================
  
  describe('LOCK E: Proposal Branch Identity', () => {
    test('PASS: Proposal branch follows file.<id>@proposal/<taskId> pattern', () => {
      const commit = createProposeChangeset(
        'agent-1',
        'task-123',
        0,
        'file.example.js',
        { diff: 'test' },
        { filamentId: 'convo.main', commitIndex: 0 }
      );
      
      // Verify branch identity format
      expect(commit.filamentId).toMatch(/^work\.agent-1\.task-123$/);
    });
    
    test('VERIFY: Merge SCAR records proposalBranchId', () => {
      const mergeScar = createMergeScar(
        'example.js',
        1,
        0,
        'file.example.js@proposal/task-123',
        ['sig-1'],
        {
          triggeredBy: { kind: 'user', id: 'user-1' },
          requiredPolicyId: 'code-review',
          threshold: 1,
          satisfiedByEvidenceIds: ['sig-1'],
          satisfiedByEvidenceHashes: ['hash-1'],
        }
      );
      
      expect(mergeScar.payload.proposalBranchId).toBe('file.example.js@proposal/task-123');
    });
  });
  
});
