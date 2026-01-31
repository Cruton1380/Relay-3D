/**
 * RESOURCE SCHEDULING SCHEMAS
 * 
 * CORE INVARIANT:
 * "If an agent is blocked, the blockage must exist as geometry."
 * 
 * NON-NEGOTIABLE RULES:
 * 1. Resources are filaments (not mutexes/flags)
 * 2. Waiting is visible (REQUEST commits)
 * 3. Priority is explicit (not inferred)
 * 4. Starvation is detectable (TIMEOUT commits)
 * 5. No background scheduling (all decisions are commits)
 */

// ============================================================================
// RESOURCE OPERATIONS
// ============================================================================

export const ResourceOp = {
  RESOURCE_CREATED: 'RESOURCE_CREATED',
  REQUEST: 'REQUEST',
  GRANT: 'GRANT',
  RELEASE: 'RELEASE',
  TIMEOUT: 'TIMEOUT',
  CANCELLED_BY_AUTHORITY: 'CANCELLED_BY_AUTHORITY', // NEW: explicit cancellation
  PRIORITY_OVERRIDE: 'PRIORITY_OVERRIDE',
};

// ============================================================================
// RESOURCE FILAMENT COMMITS
// ============================================================================

/**
 * RESOURCE_CREATED
 * 
 * Creates a new resource with capacity.
 */
export function createResourceCreated(resourceId, commitIndex, capacity, resourceType, policyId) {
  return {
    filamentId: `resource.${resourceId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'resource-manager' },
    op: ResourceOp.RESOURCE_CREATED,
    locus: null,
    refs: {
      inputs: [],
      evidence: [],
    },
    payload: {
      capacity, // Max concurrent grants
      resourceType, // 'budget_approval', 'gpu_time', 'reviewer_bandwidth', 'regulatory_gate'
      policyId, // Policy governing allocation
      availableSlots: capacity,
    },
  };
}

/**
 * REQUEST
 * 
 * Agent requests resource access.
 * CRITICAL: Request is visible (not invisible queue).
 */
export function createRequest(resourceId, commitIndex, agentId, taskId, priority, estimatedDuration, justification) {
  if (priority === undefined || priority === null) {
    throw new Error('FORBIDDEN: Resource request requires explicit priority (no defaults).');
  }
  
  if (!justification) {
    throw new Error('FORBIDDEN: Resource request requires justification (no implicit allocation).');
  }
  
  return {
    filamentId: `resource.${resourceId}`,
    commitIndex,
    ts: Date.now(), // DISPLAY ONLY (not used for ordering)
    actor: { kind: 'agent', id: agentId },
    op: ResourceOp.REQUEST,
    locus: null,
    refs: {
      inputs: [{
        filamentId: `work.${agentId}.${taskId}`,
        commitIndex: 0, // Link to work session
      }],
      evidence: [],
    },
    payload: {
      agentId,
      taskId,
      priority, // Explicit priority (0-10, higher = more urgent)
      estimatedDuration, // In milliseconds
      justification, // Why this agent needs this resource
      requestedAt: Date.now(), // DISPLAY ONLY (not used for ordering)
      status: 'waiting', // 'waiting' | 'granted' | 'released' | 'timeout'
    },
  };
}

/**
 * GRANT
 * 
 * Resource granted to agent.
 * LOCK: Grant must include deterministic proof payload (no policy cosplay).
 * LOCK: Grant must include authorityRef (no ambient authority).
 * 
 * CRITICAL: Only authorityRef provides legitimacy. policyRef is descriptive only.
 */
export function createGrant(resourceId, commitIndex, agentId, taskId, policyRef, policyProof, authorityRef) {
  if (!policyRef || !policyRef.policyId) {
    throw new Error('FORBIDDEN: Grant requires policyRef (which policy was used).');
  }
  
  // LOCK: Policy proof required (no cosplay)
  if (!policyProof || !policyProof.candidateSetHash || !policyProof.winnerRequestId) {
    throw new Error('FORBIDDEN: Grant requires policy proof payload (candidateSetHash, winnerRequestId).');
  }
  
  // LOCK: Authority required (no ambient authority) - THIS IS THE ONLY LEGITIMACY MECHANISM
  if (!authorityRef) {
    throw new Error('FORBIDDEN: Grant requires authorityRef (no ambient authority).');
  }
  
  return {
    filamentId: `resource.${resourceId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'resource-manager' },
    op: ResourceOp.GRANT,
    locus: null,
    refs: {
      inputs: [{
        filamentId: `work.${agentId}.${taskId}`,
        commitIndex: 0,
      }],
      evidence: [],
    },
    // LOCK: Authority reference (delegation chain) - ONLY LEGITIMACY PATH
    authorityRef, // { scopeId, capability, proof: { delegationPath, pathHash, satisfiedConstraints } }
    payload: {
      agentId,
      taskId,
      grantedAt: Date.now(), // DISPLAY ONLY
      // policyRef: Which allocation policy was used (descriptive, NOT authoritative)
      policyRef: {
        policyId: policyRef.policyId, // Which policy governed this grant (e.g., 'priority', 'fcfs')
        policyVersion: policyRef.policyVersion || '1.0',
        reason: policyRef.reason, // Why this agent was chosen (display only)
        queuePosition: policyRef.queuePosition, // Position in queue (display only)
      },
      // LOCK: Deterministic proof payload (machine-checkable)
      policyProof: {
        candidateSetHash: policyProof.candidateSetHash, // Hash of sorted request IDs considered
        winnerRequestId: policyProof.winnerRequestId, // Which request won
        winnerRankIndex: policyProof.winnerRankIndex, // Winner's rank in sorted list
        rankInputs: policyProof.rankInputs, // Machine-checkable fields used for ranking
      },
    },
  };
}

/**
 * RELEASE
 * 
 * Agent releases resource (done with work).
 */
export function createRelease(resourceId, commitIndex, agentId, taskId, actualDuration) {
  return {
    filamentId: `resource.${resourceId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'agent', id: agentId },
    op: ResourceOp.RELEASE,
    locus: null,
    refs: {
      inputs: [{
        filamentId: `work.${agentId}.${taskId}`,
        commitIndex: 0,
      }],
      evidence: [],
    },
    payload: {
      agentId,
      taskId,
      releasedAt: Date.now(),
      actualDuration, // Actual time held (for policy learning)
    },
  };
}

/**
 * TIMEOUT
 * 
 * Request timed out (starvation detected).
 * CRITICAL: Timeout is visible (not silent drop).
 */
export function createTimeout(resourceId, commitIndex, agentId, taskId, requestCommitIndex, waitDuration, reason) {
  return {
    filamentId: `resource.${resourceId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'resource-manager' },
    op: ResourceOp.TIMEOUT,
    locus: null,
    refs: {
      inputs: [{
        filamentId: `work.${agentId}.${taskId}`,
        commitIndex: 0,
      }],
      evidence: [],
    },
    payload: {
      agentId,
      taskId,
      requestCommitIndex, // Which REQUEST this terminates
      waitDuration, // How long agent waited before timeout
      reason, // 'max_wait_exceeded' | 'resource_unavailable' | 'policy_rejected'
      timedOutAt: Date.now(),
    },
  };
}

/**
 * CANCELLED_BY_AUTHORITY
 * 
 * Request cancelled by human authority.
 * LOCK: Cancellation requires authority + reason.
 */
export function createCancelledByAuthority(resourceId, commitIndex, agentId, taskId, requestCommitIndex, authority) {
  if (!authority || !authority.triggeredBy || !authority.reason) {
    throw new Error('FORBIDDEN: Cancellation requires human authority with reason.');
  }
  
  return {
    filamentId: `resource.${resourceId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'resource-manager' },
    op: ResourceOp.CANCELLED_BY_AUTHORITY,
    locus: null,
    refs: {
      inputs: [{
        filamentId: `work.${agentId}.${taskId}`,
        commitIndex: 0,
      }],
      evidence: authority.evidenceRefs || [],
    },
    payload: {
      agentId,
      taskId,
      requestCommitIndex, // Which REQUEST this terminates
      authority: {
        triggeredBy: authority.triggeredBy, // Human actor
        reason: authority.reason,
        evidenceRefs: authority.evidenceRefs || [],
      },
      cancelledAt: Date.now(),
    },
  };
}

/**
 * PRIORITY_OVERRIDE
 * 
 * Human overrides priority (rare, requires evidence).
 */
export function createPriorityOverride(resourceId, commitIndex, agentId, taskId, newPriority, authority) {
  if (!authority || !authority.triggeredBy || !authority.evidenceRefs || authority.evidenceRefs.length === 0) {
    throw new Error('FORBIDDEN: Priority override requires human authority with evidence.');
  }
  
  return {
    filamentId: `resource.${resourceId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'resource-manager' },
    op: ResourceOp.PRIORITY_OVERRIDE,
    locus: null,
    refs: {
      inputs: [],
      evidence: authority.evidenceRefs,
    },
    payload: {
      agentId,
      taskId,
      oldPriority: null, // Will be filled by caller
      newPriority,
      authority: {
        triggeredBy: authority.triggeredBy, // Human actor
        reason: authority.reason,
        evidenceRefs: authority.evidenceRefs,
      },
    },
  };
}

// ============================================================================
// ALLOCATION POLICIES (EXPLICIT, NOT HIDDEN)
// ============================================================================

/**
 * Policy: First-Come-First-Served (FCFS)
 * 
 * LOCK: Use commitIndex (not wall-clock) for determinism.
 */
export function allocateFCFS(requests) {
  return requests.slice().sort((a, b) => {
    // Use commitIndex (deterministic)
    const indexCompare = a.commitIndex - b.commitIndex;
    if (indexCompare !== 0) return indexCompare;
    
    // Tie-breaker: requestId (deterministic)
    const idA = `${a.payload.agentId}:${a.payload.taskId}`;
    const idB = `${b.payload.agentId}:${b.payload.taskId}`;
    return idA.localeCompare(idB);
  });
}

/**
 * Policy: Priority-Based (highest priority first)
 */
export function allocatePriority(requests) {
  return requests.slice().sort((a, b) => {
    // Higher priority first
    const priorityCompare = b.payload.priority - a.payload.priority;
    if (priorityCompare !== 0) return priorityCompare;
    
    // Tie-breaker: FCFS
    return a.payload.requestedAt - b.payload.requestedAt;
  });
}

/**
 * Policy: Fair-Share (prevent starvation)
 * 
 * LOCK: Use commitIndex delta (not wall-clock) for determinism.
 */
export function allocateFairShare(requests, resourceHistory) {
  // Calculate wait in commit-index units (deterministic)
  const latestCommitIndex = Math.max(...requests.map(r => r.commitIndex));
  
  return requests.slice().sort((a, b) => {
    // Wait = commit index delta (deterministic, not wall-clock)
    const waitA = latestCommitIndex - a.commitIndex;
    const waitB = latestCommitIndex - b.commitIndex;
    
    // Agent who waited longest (more commits ago) gets priority
    const waitCompare = waitB - waitA;
    if (waitCompare !== 0) return waitCompare;
    
    // Tie-breaker: requestId (deterministic)
    const idA = `${a.payload.agentId}:${a.payload.taskId}`;
    const idB = `${b.payload.agentId}:${b.payload.taskId}`;
    return idA.localeCompare(idB);
  });
}

/**
 * Get next request to grant based on policy.
 * 
 * LOCK: Policy must be explicit (no hidden heuristics).
 */
export function getNextRequest(resourceFilament, policyId) {
  const requests = resourceFilament.commits.filter(c => 
    c.op === ResourceOp.REQUEST && 
    c.payload.status === 'waiting'
  );
  
  if (requests.length === 0) return null;
  
  let sorted;
  switch (policyId) {
    case 'fcfs':
      sorted = allocateFCFS(requests);
      break;
    case 'priority':
      sorted = allocatePriority(requests);
      break;
    case 'fair-share':
      sorted = allocateFairShare(requests, resourceFilament.commits);
      break;
    default:
      throw new Error(`FORBIDDEN: Unknown allocation policy: ${policyId}`);
  }
  
  return sorted[0] || null;
}

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Verify no invisible prioritization (policy cosplay).
 * 
 * LOCK: All grants must be provably derived from policy.
 */
export function verifyNoInvisiblePrioritization(resourceFilament, policyId) {
  const requests = resourceFilament.commits.filter(c => c.op === ResourceOp.REQUEST);
  const grants = resourceFilament.commits.filter(c => c.op === ResourceOp.GRANT);
  
  for (const grant of grants) {
    // Find corresponding request
    const request = requests.find(r => 
      r.payload.agentId === grant.payload.agentId &&
      r.payload.taskId === grant.payload.taskId
    );
    
    if (!request) {
      return false; // Grant without request = invisible
    }
    
    // Verify grant matches policy
    if (grant.payload.grantAuthority.policyId !== policyId) {
      return false; // Grant doesn't match declared policy
    }
    
    // LOCK: Verify policy proof exists
    if (!grant.payload.policyProof) {
      return false; // No proof = policy cosplay
    }
  }
  
  return true;
}

/**
 * Verify policy proof (recompute ranking).
 * 
 * LOCK: Grant winner must match policy recomputation.
 */
export function verifyPolicyProof(resourceFilament, grantCommit) {
  // Get all waiting requests at time of grant
  const allRequests = resourceFilament.commits.filter(c => 
    c.op === ResourceOp.REQUEST &&
    c.commitIndex < grantCommit.commitIndex
  );
  
  // Filter to waiting requests (not yet granted)
  const grants = resourceFilament.commits.filter(c => 
    c.op === ResourceOp.GRANT &&
    c.commitIndex < grantCommit.commitIndex
  );
  
  const waitingRequests = allRequests.filter(req => {
    const alreadyGranted = grants.some(g => 
      g.payload.agentId === req.payload.agentId &&
      g.payload.taskId === req.payload.taskId
    );
    return !alreadyGranted;
  });
  
  // Compute candidate set hash
  const requestIds = waitingRequests.map(r => `${r.payload.agentId}:${r.payload.taskId}`).sort();
  const computedHash = hashString(requestIds.join(','));
  
  // Verify hash matches
  if (computedHash !== grantCommit.payload.policyProof.candidateSetHash) {
    return false; // Candidate set mismatch
  }
  
  // Recompute ranking based on policy
  const policyId = grantCommit.payload.grantAuthority.policyId;
  let sorted;
  
  switch (policyId) {
    case 'fcfs':
      sorted = allocateFCFS(waitingRequests);
      break;
    case 'priority':
      sorted = allocatePriority(waitingRequests);
      break;
    case 'fair-share':
      sorted = allocateFairShare(waitingRequests, resourceFilament.commits);
      break;
    default:
      return false; // Unknown policy
  }
  
  // Verify winner matches recomputed ranking
  const winner = sorted[grantCommit.payload.policyProof.winnerRankIndex];
  const winnerRequestId = `${winner.payload.agentId}:${winner.payload.taskId}`;
  
  return winnerRequestId === grantCommit.payload.policyProof.winnerRequestId;
}

/**
 * Simple hash function for candidate set verification.
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Verify no dangling requests (terminal outcomes enforced).
 * 
 * LOCK: Every REQUEST must terminate in exactly one outcome:
 * - (GRANT → RELEASE) OR
 * - TIMEOUT OR
 * - CANCELLED_BY_AUTHORITY
 */
export function verifyNoDanglingRequests(resourceFilament) {
  const requests = resourceFilament.commits.filter(c => c.op === ResourceOp.REQUEST);
  const grants = resourceFilament.commits.filter(c => c.op === ResourceOp.GRANT);
  const releases = resourceFilament.commits.filter(c => c.op === ResourceOp.RELEASE);
  const timeouts = resourceFilament.commits.filter(c => c.op === ResourceOp.TIMEOUT);
  const cancellations = resourceFilament.commits.filter(c => c.op === ResourceOp.CANCELLED_BY_AUTHORITY);
  
  for (const request of requests) {
    const agentId = request.payload.agentId;
    const taskId = request.payload.taskId;
    const requestCommitIndex = request.commitIndex;
    
    // Check terminal outcomes
    const hasGrant = grants.some(g => g.payload.agentId === agentId && g.payload.taskId === taskId);
    const hasRelease = releases.some(r => r.payload.agentId === agentId && r.payload.taskId === taskId);
    const hasTimeout = timeouts.some(t => 
      t.payload.agentId === agentId && 
      t.payload.taskId === taskId &&
      t.payload.requestCommitIndex === requestCommitIndex
    );
    const hasCancellation = cancellations.some(c => 
      c.payload.agentId === agentId && 
      c.payload.taskId === taskId &&
      c.payload.requestCommitIndex === requestCommitIndex
    );
    
    // Terminal outcome check:
    // - (GRANT → RELEASE) OR TIMEOUT OR CANCELLED_BY_AUTHORITY
    const hasTerminalOutcome = (hasGrant && hasRelease) || hasTimeout || hasCancellation;
    
    // If no terminal outcome and request is old, it's dangling
    const commitAge = resourceFilament.commits.length - requestCommitIndex;
    if (commitAge > 10 && !hasTerminalOutcome) {
      return false; // Dangling request
    }
  }
  
  return true;
}

/**
 * Detect starvation.
 * 
 * LOCK: Starvation must be detectable (not hidden).
 */
export function detectStarvation(resourceFilament, maxWaitTime = 30000) {
  const requests = resourceFilament.commits.filter(c => 
    c.op === ResourceOp.REQUEST && 
    c.payload.status === 'waiting'
  );
  
  const now = Date.now();
  const starvedRequests = requests.filter(r => {
    const waitDuration = now - r.payload.requestedAt;
    return waitDuration > maxWaitTime;
  });
  
  return {
    hasStarvation: starvedRequests.length > 0,
    starvedRequests,
  };
}

/**
 * Verify capacity constraints.
 * 
 * LOCK: Concurrent grants cannot exceed capacity.
 */
export function verifyCapacityConstraints(resourceFilament) {
  const created = resourceFilament.commits.find(c => c.op === ResourceOp.RESOURCE_CREATED);
  if (!created) return false; // No resource created
  
  const capacity = created.payload.capacity;
  
  // Track concurrent grants over time
  let currentGrants = [];
  
  for (const commit of resourceFilament.commits) {
    if (commit.op === ResourceOp.GRANT) {
      currentGrants.push({ agentId: commit.payload.agentId, taskId: commit.payload.taskId });
    } else if (commit.op === ResourceOp.RELEASE) {
      currentGrants = currentGrants.filter(g => 
        !(g.agentId === commit.payload.agentId && g.taskId === commit.payload.taskId)
      );
    }
    
    // Check capacity violation
    if (currentGrants.length > capacity) {
      return false; // Capacity exceeded
    }
  }
  
  return true;
}

/**
 * Verify explicit priorities.
 * 
 * LOCK: All requests must have explicit priority (no defaults).
 */
export function verifyExplicitPriorities(resourceFilament) {
  const requests = resourceFilament.commits.filter(c => c.op === ResourceOp.REQUEST);
  
  for (const request of requests) {
    if (request.payload.priority === undefined || request.payload.priority === null) {
      return false; // Missing priority
    }
  }
  
  return true;
}

// ============================================================================
// FORBIDDEN OPERATIONS
// ============================================================================

/**
 * Enforce: No grant without request.
 */
export function enforceGrantRequiresRequest(resourceFilament, agentId, taskId) {
  const request = resourceFilament.commits.find(c => 
    c.op === ResourceOp.REQUEST &&
    c.payload.agentId === agentId &&
    c.payload.taskId === taskId
  );
  
  if (!request) {
    throw new Error(`FORBIDDEN: Cannot grant resource to ${agentId}/${taskId} - no request exists.`);
  }
}

/**
 * Enforce: No concurrent grants exceeding capacity.
 */
export function enforceCapacityLimit(resourceFilament, newGrantAgentId, newGrantTaskId) {
  const created = resourceFilament.commits.find(c => c.op === ResourceOp.RESOURCE_CREATED);
  if (!created) {
    throw new Error('FORBIDDEN: Cannot grant - resource not created.');
  }
  
  const capacity = created.payload.capacity;
  
  // Count current grants (not yet released)
  const grants = resourceFilament.commits.filter(c => c.op === ResourceOp.GRANT);
  const releases = resourceFilament.commits.filter(c => c.op === ResourceOp.RELEASE);
  
  const currentGrants = grants.filter(g => {
    const released = releases.some(r => 
      r.payload.agentId === g.payload.agentId &&
      r.payload.taskId === g.payload.taskId
    );
    return !released;
  });
  
  if (currentGrants.length >= capacity) {
    throw new Error(`FORBIDDEN: Cannot grant - capacity limit reached (${capacity}/${capacity}).`);
  }
}
