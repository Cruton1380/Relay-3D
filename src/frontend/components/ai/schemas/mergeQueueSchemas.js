/**
 * MERGE QUEUE SCHEMAS
 * 
 * NON-NEGOTIABLE INVARIANTS:
 * 1. Deterministic ordering (not timing-based)
 * 2. No silent arbitration (conflicts must fork or require human choice)
 * 3. No auto-merge/auto-rebase without human authority
 * 4. Queue operations are first-class commits with evidence
 * 5. AUTHORITY LOCK: Every truth-changing operation requires authorityRef (no ambient authority)
 */

// Import authority verification
import {
  createAuthorityRef,
  verifyAuthority,
  Capability,
} from './authorityDelegationSchemas.js';

// ============================================================================
// QUEUE OPERATIONS
// ============================================================================

export const QueueOp = {
  QUEUE_ENQUEUE: 'QUEUE_ENQUEUE',
  QUEUE_DEQUEUE: 'QUEUE_DEQUEUE',
  QUEUE_REORDER: 'QUEUE_REORDER',
  QUEUE_CANCEL: 'QUEUE_CANCEL',
};

export const ConflictOp = {
  CONFLICT_DETECTED: 'CONFLICT_DETECTED',
  CONFLICT_RESOLVED_BY_FORK: 'CONFLICT_RESOLVED_BY_FORK',
  CONFLICT_RESOLVED_BY_SELECTION: 'CONFLICT_RESOLVED_BY_SELECTION',
};

// ============================================================================
// QUEUE FILAMENT COMMITS
// ============================================================================

/**
 * QUEUE_ENQUEUE
 * 
 * Adds proposal to merge queue with deterministic sort key.
 */
export function createQueueEnqueue(fileId, commitIndex, proposalBranchId, taskId, agentId, baseCommitHash, touchedLoci) {
  if (!baseCommitHash) {
    throw new Error('FORBIDDEN: Queue entry requires baseCommitHash for deterministic ordering.');
  }
  
  if (!touchedLoci || touchedLoci.length === 0) {
    throw new Error('FORBIDDEN: Queue entry requires touchedLoci for conflict detection.');
  }
  
  return {
    filamentId: `queue.${fileId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'agent', id: agentId },
    op: QueueOp.QUEUE_ENQUEUE,
    locus: null,
    refs: {
      inputs: [{
        filamentId: proposalBranchId,
        commitIndex: 0,
      }],
      evidence: [],
    },
    payload: {
      proposalBranchId,
      taskId,
      agentId,
      baseCommitHash, // For deterministic ordering
      touchedLoci, // For conflict detection
      createdTs: Date.now(),
      // Canonical sort key: (baseCommitHash, proposalBranchId, taskId, createdTs)
      sortKey: `${baseCommitHash}:${proposalBranchId}:${taskId}:${Date.now()}`,
    },
  };
}

/**
 * QUEUE_DEQUEUE
 * 
 * Removes proposal from queue (after merge or cancellation).
 */
export function createQueueDequeue(fileId, commitIndex, proposalBranchId, reason) {
  return {
    filamentId: `queue.${fileId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'queue' }, // System as executor
    op: QueueOp.QUEUE_DEQUEUE,
    locus: null,
    refs: {
      inputs: [],
      evidence: [],
    },
    payload: {
      proposalBranchId,
      reason, // 'merged' | 'cancelled' | 'conflicted'
    },
  };
}

/**
 * QUEUE_REORDER
 * 
 * Reorders queue (RARE, requires authorityRef with REORDER_QUEUE capability).
 * LOCK: No ambient authority — must carry delegation chain proof.
 */
export function createQueueReorder(fileId, commitIndex, newOrder, authorityRef, reason) {
  // LOCK: Queue reorder requires authorityRef (no ambient authority)
  if (!authorityRef) {
    throw new Error('FORBIDDEN: Queue reorder requires authorityRef (no ambient authority).');
  }
  
  // LOCK: Validate capability
  if (authorityRef.capability !== Capability.REORDER_QUEUE) {
    throw new Error(`FORBIDDEN: Queue reorder requires REORDER_QUEUE capability, got ${authorityRef.capability}.`);
  }
  
  // LOCK: Validate scope
  const expectedScope = `authority.queue.${fileId}`;
  if (!authorityRef.scopeId.startsWith('authority.queue.') && !authorityRef.scopeId.startsWith('authority.project.') && !authorityRef.scopeId.startsWith('authority.org.')) {
    throw new Error(`FORBIDDEN: Queue reorder requires queue/project/org scope, got ${authorityRef.scopeId}.`);
  }
  
  return {
    filamentId: `queue.${fileId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'queue' }, // System as executor ONLY
    op: QueueOp.QUEUE_REORDER,
    locus: null,
    refs: {
      inputs: [],
      evidence: [],
    },
    // LOCK: Authority reference (delegation chain) - ONLY LEGITIMACY MECHANISM
    authorityRef,
    payload: {
      newOrder, // Array of proposalBranchIds in new order
      reason, // Why reorder (display only)
      reorderedAt: Date.now(), // DISPLAY ONLY
    },
  };
}

/**
 * QUEUE_CANCEL
 * 
 * Cancels proposal (requires authorityRef with CANCEL_REQUEST capability).
 * LOCK: No ambient authority — must carry delegation chain proof.
 */
export function createQueueCancel(fileId, commitIndex, proposalBranchId, authorityRef, reason) {
  // LOCK: Queue cancel requires authorityRef (no ambient authority)
  if (!authorityRef) {
    throw new Error('FORBIDDEN: Queue cancel requires authorityRef (no ambient authority).');
  }
  
  // LOCK: Validate capability
  if (authorityRef.capability !== Capability.CANCEL_QUEUE_ITEM) {
    throw new Error(`FORBIDDEN: Queue cancel requires CANCEL_QUEUE_ITEM capability, got ${authorityRef.capability}.`);
  }
  
  // LOCK: Validate scope
  if (!authorityRef.scopeId.startsWith('authority.queue.') && !authorityRef.scopeId.startsWith('authority.project.') && !authorityRef.scopeId.startsWith('authority.org.')) {
    throw new Error(`FORBIDDEN: Queue cancel requires queue/project/org scope, got ${authorityRef.scopeId}.`);
  }
  
  return {
    filamentId: `queue.${fileId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'queue' }, // System as executor ONLY
    op: QueueOp.QUEUE_CANCEL,
    locus: null,
    refs: {
      inputs: [],
      evidence: [],
    },
    // LOCK: Authority reference (delegation chain) - ONLY LEGITIMACY MECHANISM
    authorityRef,
    payload: {
      proposalBranchId,
      reason, // Why cancelled (display only)
      cancelledAt: Date.now(), // DISPLAY ONLY
    },
  };
}

// ============================================================================
// CONFLICT FILAMENT COMMITS
// ============================================================================

/**
 * CONFLICT_DETECTED
 * 
 * Records conflict between two proposals.
 * CRITICAL: Conflict filament MUST exist (even if immediately resolved).
 */
export function createConflictDetected(fileId, proposalA, proposalB, commitIndex) {
  const touchedLociA = proposalA.touchedLoci || [];
  const touchedLociB = proposalB.touchedLoci || [];
  
  // Calculate overlap
  const overlap = touchedLociA.filter(locus => touchedLociB.includes(locus));
  
  if (overlap.length === 0) {
    throw new Error('FORBIDDEN: Cannot create CONFLICT_DETECTED without actual loci overlap.');
  }
  
  return {
    filamentId: `conflict.${fileId}.${proposalA.proposalBranchId}.${proposalB.proposalBranchId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'conflict-detector' },
    op: ConflictOp.CONFLICT_DETECTED,
    locus: null,
    refs: {
      inputs: [
        { filamentId: proposalA.proposalBranchId, commitIndex: 0 },
        { filamentId: proposalB.proposalBranchId, commitIndex: 0 },
      ],
      evidence: [],
    },
    payload: {
      baseCommitHash: proposalA.baseCommitHash,
      proposalA: {
        proposalBranchId: proposalA.proposalBranchId,
        touchedLoci: touchedLociA,
      },
      proposalB: {
        proposalBranchId: proposalB.proposalBranchId,
        touchedLoci: touchedLociB,
      },
      overlap,
      diffSummaryRef: null, // Optional: pointer to diff visualization
    },
  };
}

/**
 * CONFLICT_RESOLVED_BY_FORK
 * 
 * Resolves conflict by forking (default, safe).
 * LOCK: Requires authorityRef with AUTHORIZE_FORK capability.
 */
export function createConflictResolvedByFork(fileId, proposalA, proposalB, commitIndex, forkBranchIdA, forkBranchIdB, authorityRef) {
  // LOCK: Fork resolution requires authorityRef (no ambient authority)
  if (!authorityRef) {
    throw new Error('FORBIDDEN: Fork resolution requires authorityRef (no ambient authority).');
  }
  
  // LOCK: Validate capability
  if (authorityRef.capability !== Capability.AUTHORIZE_FORK) {
    throw new Error(`FORBIDDEN: Fork resolution requires AUTHORIZE_FORK capability, got ${authorityRef.capability}.`);
  }
  
  // LOCK: Validate scope
  if (!authorityRef.scopeId.startsWith('authority.conflict.') && !authorityRef.scopeId.startsWith('authority.project.') && !authorityRef.scopeId.startsWith('authority.org.')) {
    throw new Error(`FORBIDDEN: Fork resolution requires conflict/project/org scope, got ${authorityRef.scopeId}.`);
  }
  
  return {
    filamentId: `conflict.${fileId}.${proposalA}.${proposalB}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'conflict-resolver' }, // System as executor ONLY
    op: ConflictOp.CONFLICT_RESOLVED_BY_FORK,
    locus: null,
    refs: {
      inputs: [],
      evidence: [],
    },
    // LOCK: Authority reference (delegation chain) - ONLY LEGITIMACY MECHANISM
    authorityRef,
    payload: {
      forkBranchIdA,
      forkBranchIdB,
      reason: 'conflict-fork', // Display only
      resolvedAt: Date.now(), // DISPLAY ONLY
    },
  };
}

/**
 * CONFLICT_RESOLVED_BY_SELECTION
 * 
 * Resolves conflict by choosing one proposal (requires explicit human choice).
 * LOCK: Requires authorityRef with AUTHORIZE_MERGE capability.
 */
export function createConflictResolvedBySelection(fileId, proposalA, proposalB, commitIndex, chosenProposalBranchId, authorityRef, reason) {
  // LOCK: Selection resolution requires authorityRef (no ambient authority)
  if (!authorityRef) {
    throw new Error('FORBIDDEN: Selection resolution requires authorityRef (no ambient authority).');
  }
  
  // LOCK: Validate capability
  if (authorityRef.capability !== Capability.AUTHORIZE_SELECTION) {
    throw new Error(`FORBIDDEN: Selection resolution requires AUTHORIZE_SELECTION capability, got ${authorityRef.capability}.`);
  }
  
  // LOCK: Validate scope
  if (!authorityRef.scopeId.startsWith('authority.conflict.') && !authorityRef.scopeId.startsWith('authority.file.') && !authorityRef.scopeId.startsWith('authority.project.') && !authorityRef.scopeId.startsWith('authority.org.')) {
    throw new Error(`FORBIDDEN: Selection resolution requires conflict/file/project/org scope, got ${authorityRef.scopeId}.`);
  }
  
  return {
    filamentId: `conflict.${fileId}.${proposalA}.${proposalB}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'conflict-resolver' }, // System as executor ONLY
    op: ConflictOp.CONFLICT_RESOLVED_BY_SELECTION,
    locus: null,
    refs: {
      inputs: [],
      evidence: [],
    },
    // LOCK: Authority reference (delegation chain) - ONLY LEGITIMACY MECHANISM
    authorityRef,
    payload: {
      chosenProposalBranchId,
      rejectedProposalBranchId: chosenProposalBranchId === proposalA ? proposalB : proposalA,
      reason: reason || 'conflict-selection', // Why chosen (display only)
      resolvedAt: Date.now(), // DISPLAY ONLY
    },
  };
}

// ============================================================================
// DETERMINISTIC ORDERING
// ============================================================================

/**
 * Sort queue entries by canonical sort key.
 * 
 * LOCK: Deterministic ordering (not timing-based).
 * Sort by: baseCommitHash → proposalBranchId → taskId → createdTs
 */
export function sortQueueDeterministically(queueEntries) {
  return queueEntries.slice().sort((a, b) => {
    // 1. baseCommitHash (groups proposals by same base)
    const hashCompare = a.payload.baseCommitHash.localeCompare(b.payload.baseCommitHash);
    if (hashCompare !== 0) return hashCompare;
    
    // 2. proposalBranchId (lexicographic)
    const branchCompare = a.payload.proposalBranchId.localeCompare(b.payload.proposalBranchId);
    if (branchCompare !== 0) return branchCompare;
    
    // 3. taskId (lexicographic)
    const taskCompare = a.payload.taskId.localeCompare(b.payload.taskId);
    if (taskCompare !== 0) return taskCompare;
    
    // 4. createdTs (only as final tie-breaker)
    return a.payload.createdTs - b.payload.createdTs;
  });
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Detect conflicts between two proposals.
 * 
 * LOCK: Conflict = overlap of touchedLoci (no vibes).
 */
export function detectConflict(proposalA, proposalB) {
  const lociA = proposalA.touchedLoci || [];
  const lociB = proposalB.touchedLoci || [];
  
  const overlap = lociA.filter(locus => lociB.includes(locus));
  
  return {
    hasConflict: overlap.length > 0,
    overlap,
  };
}

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Verify no silent arbitration.
 * 
 * LOCK: Every conflict must have a CONFLICT_DETECTED commit.
 */
export function verifyNoSilentArbitration(queueFilament, conflictFilaments) {
  // Get all enqueued proposals
  const enqueued = queueFilament.commits.filter(c => c.op === QueueOp.QUEUE_ENQUEUE);
  
  // Check all pairs for conflicts
  for (let i = 0; i < enqueued.length; i++) {
    for (let j = i + 1; j < enqueued.length; j++) {
      const propA = enqueued[i];
      const propB = enqueued[j];
      
      const { hasConflict } = detectConflict(propA.payload, propB.payload);
      
      if (hasConflict) {
        // Must have conflict filament
        const conflictFilamentId = `conflict.${queueFilament.filamentId.split('.')[1]}.${propA.payload.proposalBranchId}.${propB.payload.proposalBranchId}`;
        const conflictExists = conflictFilaments.some(f => f.filamentId === conflictFilamentId);
        
        if (!conflictExists) {
          return false; // Conflict detected but no filament = SILENT ARBITRATION
        }
      }
    }
  }
  
  return true;
}

/**
 * Verify queue ordering is deterministic.
 * 
 * LOCK: Same entries → same order.
 */
export function verifyDeterministicOrdering(queueFilament) {
  const enqueued = queueFilament.commits.filter(c => c.op === QueueOp.QUEUE_ENQUEUE);
  
  // Sort twice
  const sorted1 = sortQueueDeterministically(enqueued);
  const sorted2 = sortQueueDeterministically(enqueued);
  
  // Compare
  for (let i = 0; i < sorted1.length; i++) {
    if (sorted1[i].payload.proposalBranchId !== sorted2[i].payload.proposalBranchId) {
      return false;
    }
  }
  
  return true;
}

/**
 * Verify no merge if not at queue head.
 * 
 * LOCK: Merge execution must be serialized.
 */
export function verifySerializedMerge(queueFilament, fileFilament) {
  const queue = queueFilament.commits.filter(c => c.op === QueueOp.QUEUE_ENQUEUE);
  const sorted = sortQueueDeterministically(queue);
  
  if (sorted.length === 0) return true; // No queue = no violation
  
  const headProposal = sorted[0].payload.proposalBranchId;
  
  // Check if any non-head proposals have been merged
  const merges = fileFilament.commits.filter(c => c.op === 'MERGE_SCAR');
  
  for (const merge of merges) {
    const mergedBranchId = merge.payload.proposalBranchId;
    
    // If merged branch is not head and is still in queue, violation
    if (mergedBranchId !== headProposal) {
      const stillInQueue = queue.some(q => q.payload.proposalBranchId === mergedBranchId);
      if (stillInQueue) {
        return false; // Merged out-of-order
      }
    }
  }
  
  return true;
}

/**
 * Verify no auto-resolve.
 * 
 * LOCK: Conflict resolution requires authorityRef (no ambient authority).
 */
export function verifyNoAutoResolve(conflictFilaments) {
  for (const conflict of conflictFilaments) {
    const resolutions = conflict.commits.filter(c => 
      c.op === ConflictOp.CONFLICT_RESOLVED_BY_FORK ||
      c.op === ConflictOp.CONFLICT_RESOLVED_BY_SELECTION
    );
    
    for (const resolution of resolutions) {
      // LOCK: Must have authorityRef
      if (!resolution.authorityRef) {
        return false; // Auto-resolved without authorityRef
      }
      
      // LOCK: Must have delegation proof
      if (!resolution.authorityRef.proof || !resolution.authorityRef.proof.delegationPath) {
        return false; // No delegation chain proof
      }
      
      // LOCK: Delegation path must not be empty
      if (resolution.authorityRef.proof.delegationPath.length === 0) {
        return false; // Empty delegation chain
      }
    }
  }
  
  return true;
}

// ============================================================================
// UNIFIED VERIFIER (Authority + Domain Checks)
// ============================================================================

/**
 * Verify operation is valid: authority + domain checks.
 * 
 * This is the single entry point for replay verification.
 * 
 * @param operation - The commit to verify
 * @param actionCommitIndex - CommitIndex of the operation
 * @param authorityFilament - The authority filament for this scope
 * @param contextFilaments - Related filaments (queue, conflict, file, proposal)
 * @returns { ok, reason, derived }
 */
export function verifyOperation(operation, actionCommitIndex, authorityFilament, contextFilaments) {
  // STEP 1: Verify authorityRef exists (no ambient authority)
  if (!operation.authorityRef) {
    return { 
      ok: false, 
      reason: 'No authorityRef (ambient authority forbidden)',
      derived: null 
    };
  }
  
  // STEP 2: Verify authority (delegation chain, capability, scope, revocation)
  const authorityResult = verifyAuthority(
    authorityFilament,
    operation,
    operation.authorityRef.capability,
    actionCommitIndex
  );
  
  if (!authorityResult.valid) {
    return {
      ok: false,
      reason: `Authority verification failed: ${authorityResult.reason}`,
      derived: null
    };
  }
  
  // STEP 3: Verify operation-specific domain constraints
  let domainResult;
  
  switch (operation.op) {
    case QueueOp.QUEUE_REORDER:
      domainResult = verifyQueueReorder(contextFilaments.queueFilament, operation, actionCommitIndex);
      break;
      
    case QueueOp.QUEUE_CANCEL:
      domainResult = verifyQueueCancel(contextFilaments.queueFilament, operation, actionCommitIndex);
      break;
      
    case ConflictOp.CONFLICT_RESOLVED_BY_FORK:
      domainResult = verifyConflictFork(contextFilaments.conflictFilament, operation);
      break;
      
    case ConflictOp.CONFLICT_RESOLVED_BY_SELECTION:
      domainResult = verifyConflictSelection(contextFilaments.conflictFilament, operation);
      break;
      
    case 'MERGE_SCAR': // FileOp from AI workspace
      domainResult = verifyMergeScar(
        contextFilaments.fileFilament,
        contextFilaments.proposalFilament,
        operation,
        actionCommitIndex
      );
      break;
      
    default:
      // Operation doesn't require domain verification
      domainResult = { valid: true };
  }
  
  if (!domainResult.valid) {
    return {
      ok: false,
      reason: `Domain verification failed: ${domainResult.reason}`,
      derived: null
    };
  }
  
  // STEP 4: Return success with derived authority info
  return {
    ok: true,
    reason: null,
    derived: {
      authorityRoot: operation.authorityRef.proof.delegationPath[0],
      delegationChainLength: operation.authorityRef.proof.delegationPath.length,
      capability: operation.authorityRef.capability,
      scopeId: operation.authorityRef.scopeId,
    }
  };
}

// ============================================================================
// OPERATION-SPECIFIC VERIFICATION (Domain Checks)
// ============================================================================

/**
 * Verify QUEUE_REORDER is valid at this commitIndex.
 * 
 * CRITICAL: Recomputes queue state and validates permutation.
 */
export function verifyQueueReorder(queueFilament, reorderCommit, actionCommitIndex) {
  // Recompute queue state at this commitIndex (only commits before this one)
  const priorCommits = queueFilament.commits.filter(c => c.commitIndex < actionCommitIndex);
  const currentQueue = priorCommits
    .filter(c => c.op === QueueOp.QUEUE_ENQUEUE)
    .map(c => c.payload.proposalBranchId);
  
  const newOrder = reorderCommit.payload.newOrder;
  
  // LOCK: newOrder must be a permutation of currentQueue (no adds, no removes)
  if (newOrder.length !== currentQueue.length) {
    return { valid: false, reason: `Queue reorder changes count: expected ${currentQueue.length}, got ${newOrder.length}` };
  }
  
  // LOCK: Every item in newOrder must exist in currentQueue
  for (const item of newOrder) {
    if (!currentQueue.includes(item)) {
      return { valid: false, reason: `Queue reorder adds non-existent item: ${item}` };
    }
  }
  
  // LOCK: Every item in currentQueue must appear in newOrder
  for (const item of currentQueue) {
    if (!newOrder.includes(item)) {
      return { valid: false, reason: `Queue reorder removes item: ${item}` };
    }
  }
  
  return { valid: true };
}

/**
 * Verify QUEUE_CANCEL is valid at this commitIndex.
 * 
 * CRITICAL: Verifies item exists in queue.
 */
export function verifyQueueCancel(queueFilament, cancelCommit, actionCommitIndex) {
  // Recompute queue state at this commitIndex
  const priorCommits = queueFilament.commits.filter(c => c.commitIndex < actionCommitIndex);
  const currentQueue = priorCommits
    .filter(c => c.op === QueueOp.QUEUE_ENQUEUE)
    .map(c => c.payload.proposalBranchId);
  
  const cancelledItem = cancelCommit.payload.proposalBranchId;
  
  // LOCK: Cancelled item must exist in queue
  if (!currentQueue.includes(cancelledItem)) {
    return { valid: false, reason: `Queue cancel targets non-existent item: ${cancelledItem}` };
  }
  
  return { valid: true };
}

/**
 * Verify CONFLICT_RESOLVED_BY_FORK is valid.
 * 
 * CRITICAL: Verifies conflict exists with loci overlap.
 */
export function verifyConflictFork(conflictFilament, forkCommit) {
  // LOCK: Conflict must have been detected first
  const detectedCommits = conflictFilament.commits.filter(c => c.op === ConflictOp.CONFLICT_DETECTED);
  
  if (detectedCommits.length === 0) {
    return { valid: false, reason: 'Fork resolution without prior CONFLICT_DETECTED' };
  }
  
  // LOCK: Conflict must have actual overlap
  const detection = detectedCommits[0];
  if (!detection.payload.overlap || detection.payload.overlap.length === 0) {
    return { valid: false, reason: 'Fork resolution for conflict with no loci overlap' };
  }
  
  // LOCK: Both fork branches must be specified
  if (!forkCommit.payload.forkBranchIdA || !forkCommit.payload.forkBranchIdB) {
    return { valid: false, reason: 'Fork resolution missing branch IDs' };
  }
  
  return { valid: true };
}

/**
 * Verify CONFLICT_RESOLVED_BY_SELECTION is valid.
 * 
 * CRITICAL: Verifies chosen/rejected exactly match conflict proposals.
 */
export function verifyConflictSelection(conflictFilament, selectionCommit) {
  // LOCK: Conflict must have been detected first
  const detectedCommits = conflictFilament.commits.filter(c => c.op === ConflictOp.CONFLICT_DETECTED);
  
  if (detectedCommits.length === 0) {
    return { valid: false, reason: 'Selection resolution without prior CONFLICT_DETECTED' };
  }
  
  const detection = detectedCommits[0];
  const proposalA = detection.payload.proposalA.proposalBranchId;
  const proposalB = detection.payload.proposalB.proposalBranchId;
  
  const chosen = selectionCommit.payload.chosenProposalBranchId;
  const rejected = selectionCommit.payload.rejectedProposalBranchId;
  
  // LOCK: Chosen must be one of the conflict proposals
  if (chosen !== proposalA && chosen !== proposalB) {
    return { valid: false, reason: `Selection chose non-conflicting proposal: ${chosen}` };
  }
  
  // LOCK: Rejected must be the other proposal
  const expectedRejected = (chosen === proposalA) ? proposalB : proposalA;
  if (rejected !== expectedRejected) {
    return { valid: false, reason: `Selection rejected wrong proposal: expected ${expectedRejected}, got ${rejected}` };
  }
  
  return { valid: true };
}

/**
 * Verify MERGE_SCAR is valid at this commitIndex.
 * 
 * CRITICAL: Verifies baseCommitHash matches, no silent rebase.
 */
export function verifyMergeScar(fileFilament, proposalFilament, mergeCommit, actionCommitIndex) {
  // LOCK: File must exist
  if (!fileFilament || fileFilament.commits.length === 0) {
    return { valid: false, reason: 'Merge into non-existent file' };
  }
  
  // LOCK: Proposal must exist
  if (!proposalFilament || proposalFilament.commits.length === 0) {
    return { valid: false, reason: 'Merge non-existent proposal' };
  }
  
  // Recompute file state at merge time (commits before merge)
  const priorFileCommits = fileFilament.commits.filter(c => c.commitIndex < actionCommitIndex);
  const fileHeadCommit = priorFileCommits[priorFileCommits.length - 1];
  
  // LOCK: Proposal baseCommitHash must match file head at merge time (no silent rebase)
  // Note: This requires proposals to declare their baseCommitHash
  // For now, we verify proposal references the correct file commit
  const proposalInputs = proposalFilament.commits[0]?.refs?.inputs || [];
  const fileRef = proposalInputs.find(ref => ref.filamentId.startsWith('file.'));
  
  if (fileRef && fileHeadCommit && fileRef.commitIndex !== fileHeadCommit.commitIndex) {
    return { valid: false, reason: `Merge baseCommitHash mismatch: proposal based on commit ${fileRef.commitIndex}, file head is ${fileHeadCommit.commitIndex}` };
  }
  
  return { valid: true };
}

// ============================================================================
// ENFORCEMENT FUNCTIONS (Fail Fast)
// ============================================================================

/**
 * Enforce: Authority is valid for this operation.
 * 
 * CRITICAL: Call this before allowing operation to proceed.
 */
export function enforceOperationAuthority(operation, actionCommitIndex, authorityFilament, contextFilaments) {
  const result = verifyOperation(operation, actionCommitIndex, authorityFilament, contextFilaments);
  
  if (!result.ok) {
    throw new Error(`FORBIDDEN: Operation authority invalid: ${result.reason}`);
  }
  
  return result.derived; // Return derived info for UI/logging
}

/**
 * Enforce: No merge if not at queue head.
 */
export function enforceQueueHead(queueFilament, proposalBranchId) {
  const queue = queueFilament.commits.filter(c => c.op === QueueOp.QUEUE_ENQUEUE);
  const sorted = sortQueueDeterministically(queue);
  
  if (sorted.length === 0) {
    throw new Error('FORBIDDEN: Cannot merge - queue is empty.');
  }
  
  const headProposal = sorted[0].payload.proposalBranchId;
  
  if (proposalBranchId !== headProposal) {
    throw new Error(`FORBIDDEN: Cannot merge ${proposalBranchId} - not at queue head. Head is ${headProposal}.`);
  }
}

/**
 * Enforce: No merge if base changed (conflict path required).
 */
export function enforceBaseCommitMatch(proposal, fileHeadHash) {
  if (proposal.baseCommitHash !== fileHeadHash) {
    throw new Error(`FORBIDDEN: Cannot merge - baseCommitHash mismatch. Expected ${fileHeadHash}, got ${proposal.baseCommitHash}. Conflict resolution required.`);
  }
}
