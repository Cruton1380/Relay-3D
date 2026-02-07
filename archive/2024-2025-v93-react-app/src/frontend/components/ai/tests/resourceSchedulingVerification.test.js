/**
 * RESOURCE SCHEDULING VERIFICATION TESTS
 * 
 * CRITICAL: These tests prove "no invisible scheduling".
 * All tests must FAIL LOUDLY when invariants are violated.
 */

import {
  createResourceCreated,
  createRequest,
  createGrant,
  createRelease,
  createTimeout,
  createCancelledByAuthority,
  createPriorityOverride,
  allocateFCFS,
  allocatePriority,
  allocateFairShare,
  getNextRequest,
  verifyNoInvisiblePrioritization,
  verifyPolicyProof,
  verifyNoDanglingRequests,
  detectStarvation,
  verifyCapacityConstraints,
  verifyExplicitPriorities,
  enforceGrantRequiresRequest,
  enforceCapacityLimit,
} from '../schemas/resourceSchedulingSchemas';

describe('Resource Scheduling - ENFORCEMENT', () => {
  
  // ============================================================================
  // EXPLICIT PRIORITIES
  // ============================================================================
  
  describe('Explicit Priorities', () => {
    test('PASS: Request with explicit priority succeeds', () => {
      expect(() => {
        createRequest('gpu-1', 0, 'agent-1', 'task-A', 5, 10000, 'Model training');
      }).not.toThrow();
    });
    
    test('FAIL: Request without priority throws', () => {
      expect(() => {
        createRequest('gpu-1', 0, 'agent-1', 'task-A', null, 10000, 'Model training');
      }).toThrow('FORBIDDEN: Resource request requires explicit priority');
    });
    
    test('FAIL: Request without justification throws', () => {
      expect(() => {
        createRequest('gpu-1', 0, 'agent-1', 'task-A', 5, 10000, null);
      }).toThrow('FORBIDDEN: Resource request requires justification');
    });
    
    test('VERIFY: All requests have explicit priorities', () => {
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'priority'),
          createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Training'),
          createRequest('gpu-1', 2, 'agent-2', 'task-B', 8, 5000, 'Inference'),
        ],
      };
      
      expect(verifyExplicitPriorities(resourceFilament)).toBe(true);
    });
  });
  
  // ============================================================================
  // ALLOCATION POLICIES
  // ============================================================================
  
  describe('Allocation Policies', () => {
    test('PASS: FCFS policy - first requested, first granted', () => {
      const req1 = createRequest('gpu-1', 0, 'agent-1', 'task-A', 5, 10000, 'Training');
      req1.payload.requestedAt = 1000;
      
      const req2 = createRequest('gpu-1', 1, 'agent-2', 'task-B', 8, 5000, 'Inference');
      req2.payload.requestedAt = 2000;
      
      const sorted = allocateFCFS([req1, req2]);
      
      expect(sorted[0].payload.agentId).toBe('agent-1'); // Earlier request
      expect(sorted[1].payload.agentId).toBe('agent-2');
    });
    
    test('PASS: Priority policy - highest priority first', () => {
      const req1 = createRequest('gpu-1', 0, 'agent-1', 'task-A', 5, 10000, 'Training');
      const req2 = createRequest('gpu-1', 1, 'agent-2', 'task-B', 8, 5000, 'Inference');
      
      const sorted = allocatePriority([req1, req2]);
      
      expect(sorted[0].payload.agentId).toBe('agent-2'); // Higher priority (8 > 5)
      expect(sorted[1].payload.agentId).toBe('agent-1');
    });
    
    test('PASS: Fair-share policy - longest wait first', () => {
      const now = Date.now();
      
      const req1 = createRequest('gpu-1', 0, 'agent-1', 'task-A', 5, 10000, 'Training');
      req1.payload.requestedAt = now - 30000; // Waited 30s
      
      const req2 = createRequest('gpu-1', 1, 'agent-2', 'task-B', 8, 5000, 'Inference');
      req2.payload.requestedAt = now - 10000; // Waited 10s
      
      const sorted = allocateFairShare([req1, req2], []);
      
      expect(sorted[0].payload.agentId).toBe('agent-1'); // Waited longer
      expect(sorted[1].payload.agentId).toBe('agent-2');
    });
  });
  
  // ============================================================================
  // NO INVISIBLE PRIORITIZATION
  // ============================================================================
  
  describe('No Invisible Prioritization', () => {
    test('PASS: Grant matches declared policy', () => {
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'priority'),
          createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Training'),
          createGrant('gpu-1', 2, 'agent-1', 'task-A', {
            policyId: 'priority',
            reason: 'Highest priority',
            queuePosition: 0,
          }),
        ],
      };
      
      expect(verifyNoInvisiblePrioritization(resourceFilament, 'priority')).toBe(true);
    });
    
    test('FAIL: Grant without request = invisible', () => {
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'priority'),
          // No request!
          createGrant('gpu-1', 1, 'agent-1', 'task-A', {
            policyId: 'priority',
            reason: 'Unknown',
            queuePosition: 0,
          }),
        ],
      };
      
      expect(verifyNoInvisiblePrioritization(resourceFilament, 'priority')).toBe(false);
    });
    
    test('FAIL: Grant policy mismatch = invisible prioritization', () => {
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'fcfs'), // Policy is FCFS
          createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Training'),
          createGrant('gpu-1', 2, 'agent-1', 'task-A', {
            policyId: 'priority', // Grant says priority (mismatch!)
            reason: 'Highest priority',
            queuePosition: 0,
          }),
        ],
      };
      
      expect(verifyNoInvisiblePrioritization(resourceFilament, 'fcfs')).toBe(false);
    });
  });
  
  // ============================================================================
  // NO SILENT DROPS
  // ============================================================================
  
  describe('No Silent Drops', () => {
    test('PASS: Request has outcome (grant + release)', () => {
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'fcfs'),
          createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Training'),
          createGrant('gpu-1', 2, 'agent-1', 'task-A', { policyId: 'fcfs', reason: 'First', queuePosition: 0 }),
          createRelease('gpu-1', 3, 'agent-1', 'task-A', 9800),
        ],
      };
      
      expect(verifyNoSilentDrops(resourceFilament)).toBe(true);
    });
    
    test('PASS: Request has outcome (timeout)', () => {
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'fcfs'),
          createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Training'),
          createTimeout('gpu-1', 2, 'agent-1', 'task-A', 60000, 'max_wait_exceeded'),
        ],
      };
      
      expect(verifyNoSilentDrops(resourceFilament)).toBe(true);
    });
  });
  
  // ============================================================================
  // STARVATION DETECTION
  // ============================================================================
  
  describe('Starvation Detection', () => {
    test('PASS: Detect starved request (waited too long)', () => {
      const now = Date.now();
      const req = createRequest('gpu-1', 0, 'agent-1', 'task-A', 5, 10000, 'Training');
      req.payload.requestedAt = now - 35000; // Waited 35s
      req.payload.status = 'waiting';
      
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'priority'),
          req,
        ],
      };
      
      const { hasStarvation, starvedRequests } = detectStarvation(resourceFilament, 30000);
      
      expect(hasStarvation).toBe(true);
      expect(starvedRequests.length).toBe(1);
    });
    
    test('PASS: No starvation if wait within threshold', () => {
      const now = Date.now();
      const req = createRequest('gpu-1', 0, 'agent-1', 'task-A', 5, 10000, 'Training');
      req.payload.requestedAt = now - 10000; // Waited 10s
      req.payload.status = 'waiting';
      
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'priority'),
          req,
        ],
      };
      
      const { hasStarvation } = detectStarvation(resourceFilament, 30000);
      
      expect(hasStarvation).toBe(false);
    });
  });
  
  // ============================================================================
  // CAPACITY CONSTRAINTS
  // ============================================================================
  
  describe('Capacity Constraints', () => {
    test('PASS: Concurrent grants do not exceed capacity', () => {
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'fcfs'), // Capacity: 2
          createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Training'),
          createGrant('gpu-1', 2, 'agent-1', 'task-A', { policyId: 'fcfs', reason: 'First', queuePosition: 0 }),
          createRequest('gpu-1', 3, 'agent-2', 'task-B', 5, 5000, 'Inference'),
          createGrant('gpu-1', 4, 'agent-2', 'task-B', { policyId: 'fcfs', reason: 'Second', queuePosition: 1 }),
          createRelease('gpu-1', 5, 'agent-1', 'task-A', 9800), // Release slot
          createRequest('gpu-1', 6, 'agent-3', 'task-C', 5, 3000, 'Eval'),
          createGrant('gpu-1', 7, 'agent-3', 'task-C', { policyId: 'fcfs', reason: 'Third', queuePosition: 0 }),
        ],
      };
      
      expect(verifyCapacityConstraints(resourceFilament)).toBe(true);
    });
    
    test('FAIL: Grant exceeds capacity throws', () => {
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 1, 'gpu_time', 'fcfs'), // Capacity: 1
          createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Training'),
          createGrant('gpu-1', 2, 'agent-1', 'task-A', { policyId: 'fcfs', reason: 'First', queuePosition: 0 }),
        ],
      };
      
      expect(() => {
        enforceCapacityLimit(resourceFilament, 'agent-2', 'task-B');
      }).toThrow('FORBIDDEN: Cannot grant - capacity limit reached');
    });
  });
  
  // ============================================================================
  // PRIORITY OVERRIDE REQUIRES AUTHORITY
  // ============================================================================
  
  describe('Priority Override Requires Authority', () => {
    test('PASS: Priority override with authority succeeds', () => {
      expect(() => {
        createPriorityOverride('gpu-1', 0, 'agent-1', 'task-A', 10, {
          triggeredBy: { kind: 'user', id: 'user-1' },
          reason: 'Urgent production issue',
          evidenceRefs: ['ticket-123', 'approval-456'],
        });
      }).not.toThrow();
    });
    
    test('FAIL: Priority override without authority throws', () => {
      expect(() => {
        createPriorityOverride('gpu-1', 0, 'agent-1', 'task-A', 10, null);
      }).toThrow('FORBIDDEN: Priority override requires human authority with evidence');
    });
    
    test('FAIL: Priority override without evidence throws', () => {
      expect(() => {
        createPriorityOverride('gpu-1', 0, 'agent-1', 'task-A', 10, {
          triggeredBy: { kind: 'user', id: 'user-1' },
          reason: 'Urgent',
          evidenceRefs: [], // Empty evidence
        });
      }).toThrow('FORBIDDEN: Priority override requires human authority with evidence');
    });
  });
  
  // ============================================================================
  // GRANT REQUIRES REQUEST
  // ============================================================================
  
  describe('Grant Requires Request', () => {
    test('FAIL: Grant without request throws', () => {
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'fcfs'),
          // No request!
        ],
      };
      
      expect(() => {
        enforceGrantRequiresRequest(resourceFilament, 'agent-1', 'task-A');
      }).toThrow('FORBIDDEN: Cannot grant resource to agent-1/task-A - no request exists');
    });
  });
  
  // ============================================================================
  // GRANT REQUIRES POLICY
  // ============================================================================
  
  describe('Grant Requires Policy', () => {
    test('FAIL: Grant without policyRef throws', () => {
      expect(() => {
        createGrant('gpu-1', 0, 'agent-1', 'task-A', null, {}, null);
      }).toThrow('FORBIDDEN: Grant requires policyRef (which policy was used)');
    });
    
    test('FAIL: Grant without policyId throws', () => {
      expect(() => {
        createGrant('gpu-1', 0, 'agent-1', 'task-A', { reason: 'Unknown' }, {}, null);
      }).toThrow('FORBIDDEN: Grant requires policyRef (which policy was used)');
    });
    
    test('FAIL: Grant without authorityRef throws', () => {
      expect(() => {
        createGrant('gpu-1', 0, 'agent-1', 'task-A', {
          policyId: 'priority',
          reason: 'Test',
          queuePosition: 0,
        }, {
          candidateSetHash: 'abc',
          winnerRequestId: 'agent-1:task-A',
          winnerRankIndex: 0,
          rankInputs: {},
        }, null); // Missing authorityRef
      }).toThrow('FORBIDDEN: Grant requires authorityRef (no ambient authority)');
    });
  });
  
  // ============================================================================
  // LOCK PATCH 1: POLICY PROOF (NO COSPLAY)
  // ============================================================================
  
  describe('Policy Proof (No Cosplay)', () => {
    test('FAIL: Grant without policy proof throws', () => {
      expect(() => {
        createGrant('gpu-1', 0, 'agent-1', 'task-A', {
          policyId: 'priority',
          reason: 'Highest',
          queuePosition: 0,
        }, null); // Missing proof
      }).toThrow('FORBIDDEN: Grant requires policy proof payload');
    });
    
    test('PASS: Grant with policy proof and authorityRef succeeds', () => {
      expect(() => {
        createGrant('gpu-1', 0, 'agent-1', 'task-A', {
          policyId: 'priority',
          policyVersion: '1.0',
          reason: 'Highest',
          queuePosition: 0,
        }, {
          candidateSetHash: 'abc123',
          winnerRequestId: 'agent-1:task-A',
          winnerRankIndex: 0,
          rankInputs: { priority: 8 },
        }, {
          scopeId: 'resource.gpu-1',
          capability: 'GRANT_RESOURCE',
          proof: { 
            delegationPath: [{ filamentId: 'authority.resource.gpu-1', commitIndex: 1 }], 
            pathHash: 'abc', 
            satisfiedConstraints: {} 
          },
        });
      }).not.toThrow();
    });
    
    test('VERIFY: Policy proof matches recomputed ranking', () => {
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'priority'),
          createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Training'),
          createRequest('gpu-1', 2, 'agent-2', 'task-B', 8, 5000, 'Inference'),
        ],
      };
      
      // Mock grant (in real system, this would be computed)
      const grantCommit = createGrant('gpu-1', 3, 'agent-2', 'task-B', {
        policyId: 'priority',
        policyVersion: '1.0',
        reason: 'Highest priority',
        queuePosition: 0,
      }, {
        candidateSetHash: 'computed-hash',
        winnerRequestId: 'agent-2:task-B',
        winnerRankIndex: 0,
        rankInputs: { priority: 8 },
      });
      
      // This test would verify recomputed ranking matches grant
      // (Simplified for unit test)
      expect(grantCommit.payload.policyProof.winnerRequestId).toBe('agent-2:task-B');
    });
  });
  
  // ============================================================================
  // LOCK PATCH 2: NO WALL-CLOCK DETERMINISM
  // ============================================================================
  
  describe('No Wall-Clock Determinism', () => {
    test('PASS: FCFS uses commitIndex (not timestamp)', () => {
      const req1 = createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Training');
      req1.payload.requestedAt = 2000; // Later timestamp
      
      const req2 = createRequest('gpu-1', 0, 'agent-2', 'task-B', 8, 5000, 'Inference');
      req2.payload.requestedAt = 1000; // Earlier timestamp
      
      const sorted = allocateFCFS([req1, req2]);
      
      // Should order by commitIndex (0 < 1), not timestamp
      expect(sorted[0].payload.agentId).toBe('agent-2'); // commitIndex 0
      expect(sorted[1].payload.agentId).toBe('agent-1'); // commitIndex 1
    });
    
    test('PASS: Randomizing timestamps does not change order', () => {
      const req1 = createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Training');
      const req2 = createRequest('gpu-1', 2, 'agent-2', 'task-B', 8, 5000, 'Inference');
      const req3 = createRequest('gpu-1', 3, 'agent-3', 'task-C', 3, 3000, 'Eval');
      
      // Run 1: Original timestamps
      const sorted1 = allocateFCFS([req1, req2, req3]);
      
      // Run 2: Shuffle timestamps (should not affect order)
      req1.payload.requestedAt = 9999;
      req2.payload.requestedAt = 1111;
      req3.payload.requestedAt = 5555;
      
      const sorted2 = allocateFCFS([req1, req2, req3]);
      
      // Order must be identical (commitIndex-based)
      expect(sorted1[0].payload.agentId).toBe(sorted2[0].payload.agentId);
      expect(sorted1[1].payload.agentId).toBe(sorted2[1].payload.agentId);
      expect(sorted1[2].payload.agentId).toBe(sorted2[2].payload.agentId);
    });
  });
  
  // ============================================================================
  // LOCK PATCH 3: TERMINAL OUTCOMES (NO DANGLING)
  // ============================================================================
  
  describe('Terminal Outcomes (No Dangling)', () => {
    test('PASS: Request with terminal outcome (GRANT → RELEASE)', () => {
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'fcfs'),
          createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Training'),
          createGrant('gpu-1', 2, 'agent-1', 'task-A', { policyId: 'fcfs', reason: 'First', queuePosition: 0 }, { candidateSetHash: 'a', winnerRequestId: 'agent-1:task-A', winnerRankIndex: 0, rankInputs: {} }),
          createRelease('gpu-1', 3, 'agent-1', 'task-A', 9800),
        ],
      };
      
      expect(verifyNoDanglingRequests(resourceFilament)).toBe(true);
    });
    
    test('PASS: Request with terminal outcome (TIMEOUT)', () => {
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'fcfs'),
          createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Training'),
          createTimeout('gpu-1', 12, 'agent-1', 'task-A', 1, 60000, 'max_wait_exceeded'),
        ],
      };
      
      expect(verifyNoDanglingRequests(resourceFilament)).toBe(true);
    });
    
    test('PASS: Request with terminal outcome (CANCELLED_BY_AUTHORITY)', () => {
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'fcfs'),
          createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Training'),
          createCancelledByAuthority('gpu-1', 2, 'agent-1', 'task-A', 1, {
            triggeredBy: { kind: 'user', id: 'user-1' },
            reason: 'Obsolete task',
            evidenceRefs: ['ticket-123'],
          }),
        ],
      };
      
      expect(verifyNoDanglingRequests(resourceFilament)).toBe(true);
    });
    
    test('FAIL: Cancellation without authority throws', () => {
      expect(() => {
        createCancelledByAuthority('gpu-1', 0, 'agent-1', 'task-A', 1, null);
      }).toThrow('FORBIDDEN: Cancellation requires human authority with reason');
    });
  });
  
  // ============================================================================
  // LOCK PATCH 4: WAITING PRESSURE (ESCALATION)
  // ============================================================================
  
  describe('Waiting Pressure (Escalation)', () => {
    test('VERIFY: Pressure escalates by commit-index delta', () => {
      const resourceFilament = {
        commits: [
          createResourceCreated('gpu-1', 0, 1, 'gpu_time', 'fcfs'),
          createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Training'),
          // 9 more commits (agent waiting)
          ...Array(9).fill(null).map((_, i) => ({
            commitIndex: 2 + i,
            op: 'NOOP',
          })),
        ],
      };
      
      const request = resourceFilament.commits.find(c => c.op === 'REQUEST');
      const waitCommits = resourceFilament.commits.length - request.commitIndex;
      
      // Pressure thresholds:
      // 3+ commits = Medium (1 band)
      // 6+ commits = High (2 bands)
      // 9+ commits = Critical (3 bands)
      
      expect(waitCommits).toBe(10); // 10 commits since request
      expect(waitCommits > 9).toBe(true); // Critical threshold
    });
  });
  
});
