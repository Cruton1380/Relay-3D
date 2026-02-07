/**
 * ACCOUNTING COMMIT SCHEMAS
 * 
 * Commit builders for:
 * - Dimension filaments (cost centers, departments, legal entities, accounts)
 * - Assignment filaments (relationships between dimensions)
 * - Classification filaments (posting classification)
 * - Posting bundle filaments (financial events)
 * 
 * All schemas follow Relay commit envelope:
 * { filamentId, commitIndex, ts, actor, op, refs?, payload }
 */

// ============================================
// SHARED COMMIT ENVELOPE
// ============================================

/**
 * Create base commit envelope
 */
function createBaseCommit(filamentId, commitIndex, actorId, op) {
  return {
    filamentId,
    commitIndex,
    ts: Date.now(),
    actor: {
      kind: 'user',
      id: actorId,
    },
    op,
  };
}

// ============================================
// DIMENSION FILAMENTS
// ============================================

/**
 * Create dimension (cost center, dept, legal entity, account)
 */
export function createDimensionCreatedCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'DIM_CREATED'),
    payload,
  };
}

/**
 * Rename dimension
 */
export function createDimensionRenamedCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'DIM_RENAMED'),
    payload,
  };
}

/**
 * Deactivate dimension
 */
export function createDimensionDeactivatedCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'DIM_DEACTIVATED'),
    payload,
  };
}

// ============================================
// ASSIGNMENT FILAMENTS
// ============================================

/**
 * Create assignment (cost center to dept, account policy, etc.)
 */
export function createAssignmentCreatedCommit(
  filamentId,
  commitIndex,
  actorId,
  referencedDimensions,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'ASSIGN_CREATED'),
    payload,
    refs: {
      inputs: referencedDimensions, // Array of { filamentId, commitIndex }
    },
  };
}

/**
 * Update assignment effective dates
 */
export function createAssignmentUpdatedCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'ASSIGN_UPDATED'),
    payload,
  };
}

/**
 * Override assignment (GATE for policy exception)
 */
export function createAssignmentOverrideCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'ASSIGN_OVERRIDE'),
    payload,
  };
}

// ============================================
// CLASSIFICATION FILAMENTS
// ============================================

/**
 * Declare classification for a posting
 */
export function createClassificationDeclaredCommit(
  filamentId,
  commitIndex,
  actorId,
  dimensionReferences,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'CLASSIFICATION_DECLARED'),
    payload,
    refs: {
      inputs: dimensionReferences, // Array of { filamentId, commitIndex }
    },
  };
}

/**
 * Policy exception on classification (GATE)
 */
export function createClassificationPolicyExceptionCommit(
  filamentId,
  commitIndex,
  actorId,
  assignmentReference,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'CLASSIFICATION_POLICY_EXCEPTION'),
    payload,
    refs: {
      inputs: [assignmentReference], // Reference to assignment filament that failed
    },
  };
}

// ============================================
// POSTING BUNDLE FILAMENTS
// ============================================

/**
 * Create posting bundle (atomic debit/credit legs)
 */
export function createPostingCreatedCommit(
  filamentId,
  commitIndex,
  actorId,
  matchReference,
  classificationReference,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'POSTING_CREATED'),
    payload,
    refs: {
      inputs: [
        matchReference,          // Provenance: which match justified this
        classificationReference, // Classification: which dimensions apply
      ],
    },
  };
}

/**
 * Reverse posting (GATE)
 */
export function createPostingReversedCommit(
  filamentId,
  commitIndex,
  actorId,
  originalPostingReference,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'POSTING_REVERSED'),
    payload,
    refs: {
      inputs: [originalPostingReference],
    },
  };
}

// ============================================
// HELPER: Get Latest Commit
// ============================================

export function getLatestCommit(filament) {
  if (!filament || !filament.commits || filament.commits.length === 0) {
    return null;
  }
  const latestIndex = filament.commits.length - 1;
  return {
    filamentId: filament.id,
    commitIndex: latestIndex,
    commit: filament.commits[latestIndex],
  };
}
