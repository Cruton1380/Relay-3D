/**
 * AI WORKSPACE SCHEMAS
 * 
 * Three filament types:
 * 1. Conversation (dialogue, forks, scars)
 * 2. Work Session (agent task execution trace)
 * 3. Target Artifact (files, spreadsheets, scenes)
 * 
 * NON-NEGOTIABLE INVARIANTS:
 * - Conversation ≠ Agent ≠ File
 * - Agents never mutate files directly (only propose)
 * - Merges are always gated
 * - No invisible work (all work = commits)
 */

// ============================================================================
// CONVERSATION FILAMENT
// ============================================================================

/**
 * Conversation filament commits
 * 
 * Represents dialogue timeline with ability to fork and scar.
 */
export const ConversationOp = {
  USER_MSG: 'USER_MSG',
  AGENT_MSG: 'AGENT_MSG',
  TOOL_CALL: 'TOOL_CALL',
  TOOL_RESULT: 'TOOL_RESULT',
  SPLIT: 'SPLIT',           // Fork conversation
  SCAR: 'SCAR',             // Merge branches
  GATE: 'GATE',             // Approval required
};

export function createUserMessage(conversationId, commitIndex, content) {
  return {
    filamentId: `convo.${conversationId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'user', id: 'user-1' },
    op: ConversationOp.USER_MSG,
    locus: null,
    refs: {
      inputs: [],
      evidence: [],
      relatedWorkSessions: [],
    },
    payload: {
      content,
      context: {},
    },
  };
}

export function createAgentMessage(conversationId, commitIndex, content, workSessionId = null) {
  return {
    filamentId: `convo.${conversationId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'agent', id: 'agent-1' },
    op: ConversationOp.AGENT_MSG,
    locus: null,
    refs: {
      inputs: [],
      evidence: [],
      relatedWorkSessions: workSessionId ? [workSessionId] : [],
    },
    payload: {
      content,
      workSessionRef: workSessionId,
    },
  };
}

export function createConversationSplit(conversationId, commitIndex, branchNames) {
  return {
    filamentId: `convo.${conversationId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'user', id: 'user-1' },
    op: ConversationOp.SPLIT,
    locus: null,
    refs: {
      inputs: [],
      evidence: [],
    },
    payload: {
      branchNames,
      reason: 'Explore alternatives',
    },
  };
}

// ============================================================================
// WORK SESSION FILAMENT
// ============================================================================

/**
 * Work session filament commits
 * 
 * Represents agent task execution trace with evidence.
 */
export const WorkOp = {
  TASK_ACCEPTED: 'TASK_ACCEPTED',
  PLAN_COMMIT: 'PLAN_COMMIT',
  READ_REF: 'READ_REF',
  PROPOSE_CHANGESET: 'PROPOSE_CHANGESET',
  RUN_TESTS_RESULT: 'RUN_TESTS_RESULT',
  DONE: 'DONE',
  FAIL: 'FAIL',
};

export function createTaskAccepted(agentId, taskId, commitIndex, taskDescription, conversationRef, convoBranchId) {
  // LOCK D: Work must be branch-bound
  if (!convoBranchId) {
    throw new Error('FORBIDDEN: Work session must reference convoBranchId (main/branchA/branchB).');
  }
  
  return {
    filamentId: `work.${agentId}.${taskId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'agent', id: agentId },
    op: WorkOp.TASK_ACCEPTED,
    locus: null,
    refs: {
      inputs: [conversationRef],
      evidence: [],
      targetFilaments: [],
    },
    payload: {
      taskDescription,
      conversationRef,
      convoBranchId, // LOCK D: Branch binding
      parentConvoCommitId: conversationRef.commitIndex, // LOCK D: Parent commit
    },
  };
}

export function createPlanCommit(agentId, taskId, commitIndex, plan) {
  return {
    filamentId: `work.${agentId}.${taskId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'agent', id: agentId },
    op: WorkOp.PLAN_COMMIT,
    locus: null,
    refs: {
      inputs: [],
      evidence: [],
    },
    payload: {
      steps: plan,
    },
  };
}

export function createReadRef(agentId, taskId, commitIndex, targetFileId, targetCommitIndex, targetCommitHash, locus) {
  // LOCK B: READ_REF must be cryptographically addressable
  if (!targetCommitHash) {
    throw new Error('FORBIDDEN: READ_REF requires targetCommitHash. Cannot be "I read some version".');
  }
  
  return {
    filamentId: `work.${agentId}.${taskId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'agent', id: agentId },
    op: WorkOp.READ_REF,
    locus,
    refs: {
      inputs: [{
        filamentId: targetFileId,
        commitIndex: targetCommitIndex,
        commitHash: targetCommitHash, // LOCK B: Addressable by hash
      }],
      evidence: [{
        kind: 'read',
        ref: `${targetFileId}@${targetCommitHash}`,
        locus,
      }],
    },
    payload: {
      targetFileId,
      targetCommitIndex,
      targetCommitHash, // LOCK B: Hash required
      locus,
    },
  };
}

export function createProposeChangeset(agentId, taskId, commitIndex, targetFileId, changes, conversationRef) {
  return {
    filamentId: `work.${agentId}.${taskId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'agent', id: agentId },
    op: WorkOp.PROPOSE_CHANGESET,
    locus: null,
    refs: {
      inputs: [conversationRef],
      evidence: [],
      targetFilaments: [targetFileId],
    },
    payload: {
      targetFileId,
      changes,
      conversationRef,
    },
  };
}

export function createWorkDone(agentId, taskId, commitIndex, summary) {
  return {
    filamentId: `work.${agentId}.${taskId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'agent', id: agentId },
    op: WorkOp.DONE,
    locus: null,
    refs: {
      inputs: [],
      evidence: [],
    },
    payload: {
      summary,
    },
  };
}

// ============================================================================
// FILE/ARTIFACT FILAMENT
// ============================================================================

/**
 * File filament commits
 * 
 * Represents file state with proposal branches and merge scars.
 */
export const FileOp = {
  FILE_CREATED: 'FILE_CREATED',
  FILE_EDITED: 'FILE_EDITED',
  PROPOSE_CHANGESET: 'PROPOSE_CHANGESET',  // Proposal branch
  MERGE_SCAR: 'MERGE_SCAR',                // After gate
  GATE: 'GATE',
};

export function createFileCreated(fileId, commitIndex, content, author) {
  return {
    filamentId: `file.${fileId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'user', id: author },
    op: FileOp.FILE_CREATED,
    locus: null,
    refs: {
      inputs: [],
      evidence: [],
    },
    payload: {
      content,
      filename: fileId,
    },
  };
}

export function createProposeChangesetToFile(fileId, commitIndex, workSessionRef, conversationRef, changes, workTaskId) {
  // LOCK E: Stable proposal branch identity
  const proposalBranchId = `file.${fileId}@proposal/${workTaskId}`;
  
  return {
    filamentId: proposalBranchId, // LOCK E: Proposal has its own branch identity
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'agent', id: 'agent-1' },
    op: FileOp.PROPOSE_CHANGESET,
    locus: null,
    refs: {
      inputs: [workSessionRef, conversationRef],
      evidence: [{
        kind: 'work_session',
        ref: workSessionRef.filamentId,
      }],
      fromWorkSession: workSessionRef,
      fromConversation: conversationRef,
      targetFile: `file.${fileId}`, // Original file
    },
    payload: {
      changes,
      workSessionRef,
      conversationRef,
      proposalBranchId, // LOCK E: Record branch identity
      targetFileId: `file.${fileId}`,
    },
  };
}

export function createMergeScar(fileId, commitIndex, proposalCommitIndex, proposalBranchId, signatures, authorityRef) {
  // LOCK: Merge requires authorityRef (delegation chain proof)
  if (!authorityRef) {
    throw new Error('FORBIDDEN: Merge requires authorityRef (no ambient authority).');
  }
  
  // LOCK: Validate capability
  // Import Capability from authorityDelegationSchemas.js if needed
  const Capability = { AUTHORIZE_MERGE: 'AUTHORIZE_MERGE' }; // Local definition for now
  if (authorityRef.capability !== Capability.AUTHORIZE_MERGE) {
    throw new Error(`FORBIDDEN: Merge requires AUTHORIZE_MERGE capability, got ${authorityRef.capability}.`);
  }
  
  // LOCK: Validate scope
  if (!authorityRef.scopeId.startsWith('authority.file.') && !authorityRef.scopeId.startsWith('authority.project.') && !authorityRef.scopeId.startsWith('authority.org.')) {
    throw new Error(`FORBIDDEN: Merge requires file/project/org scope, got ${authorityRef.scopeId}.`);
  }
  
  return {
    filamentId: `file.${fileId}`,
    commitIndex,
    ts: Date.now(),
    actor: { kind: 'system', id: 'gate' }, // System as executor ONLY
    op: FileOp.MERGE_SCAR,
    locus: null,
    refs: {
      inputs: [{
        filamentId: proposalBranchId, // LOCK E: Stable proposal branch identity
        commitIndex: proposalCommitIndex,
      }],
      evidence: signatures.map(sig => ({
        kind: 'signature',
        ref: sig,
      })),
    },
    // LOCK: Authority reference (delegation chain) - ONLY LEGITIMACY MECHANISM
    authorityRef,
    payload: {
      proposalBranchId, // LOCK E: Record which proposal branch merged
      proposalCommitIndex,
      absorbedCommitIds: [], // LOCK E: Which commits were absorbed
      signatures,
      mergedAt: Date.now(), // DISPLAY ONLY
    },
  };
}

// ============================================================================
// ANTI-LEAK / ANTI-LIE CHECKLIST
// ============================================================================

/**
 * Verification functions to prevent invisible work
 */

export function verifyNoInvisibleWork(workFilaments) {
  // If agent "worked", work session commits MUST exist
  return workFilaments.every(work => work.commits.length > 0);
}

export function verifyReadRefsExist(workSession, fileRefs) {
  // If agent "read file", READ_REF commits must exist
  const readOps = workSession.commits.filter(c => c.op === WorkOp.READ_REF);
  return readOps.length >= fileRefs.length;
}

export function verifyNoDirectFileMutation(fileFilament, workSessions) {
  // Files can only be mutated via PROPOSE → GATE → MERGE_SCAR
  const directEdits = fileFilament.commits.filter(
    c => c.op === FileOp.FILE_EDITED && c.actor.kind === 'agent'
  );
  return directEdits.length === 0;
}

export function verifyMergeIsGated(fileFilament) {
  // Every MERGE_SCAR must have evidence (signatures) AND authorityRef
  const merges = fileFilament.commits.filter(c => c.op === FileOp.MERGE_SCAR);
  return merges.every(m => 
    m.refs.evidence && 
    m.refs.evidence.length > 0 &&
    m.authorityRef && // LOCK: authorityRef required (no ambient authority)
    m.authorityRef.proof && // LOCK: Delegation proof required
    m.authorityRef.proof.delegationPath && // LOCK: Delegation chain required
    m.authorityRef.proof.delegationPath.length > 0 // LOCK: At least one delegation
  );
}

/**
 * LOCK C: No Teleport Proposals
 * 
 * Verify work session cannot emit PROPOSE_CHANGESET without traceable basis.
 */
export function verifyNoTeleportProposals(workSession) {
  // Find PROPOSE_CHANGESET commits
  const proposals = workSession.commits.filter(c => c.op === WorkOp.PROPOSE_CHANGESET);
  
  if (proposals.length === 0) return true; // No proposals = no violation
  
  // For each proposal, verify precursors exist
  return proposals.every(proposal => {
    const precedingCommits = workSession.commits.filter(c => c.commitIndex < proposal.commitIndex);
    
    // Must have PLAN_COMMIT
    const hasPlan = precedingCommits.some(c => c.op === WorkOp.PLAN_COMMIT);
    
    // Must have READ_REF OR explicit GENERATE evidence
    const hasReadOrGenerate = precedingCommits.some(c => 
      c.op === WorkOp.READ_REF || 
      (c.refs?.evidence?.some(e => e.kind === 'generate_from_prompt'))
    );
    
    return hasPlan && hasReadOrGenerate;
  });
}

// ============================================================================
// CANONICAL REFUSAL
// ============================================================================

/**
 * "No autonomous merges."
 * 
 * Even if an agent is "trusted," it can only propose.
 * The merge is always a gated state transition with explicit evidence.
 */
export function enforceNoAutonomousMerges(commit) {
  if (commit.op === FileOp.MERGE_SCAR && commit.actor.kind === 'agent') {
    throw new Error('FORBIDDEN: Agents cannot perform autonomous merges. Merge must be gated with evidence.');
  }
  return true;
}
