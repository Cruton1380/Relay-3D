/**
 * Work Zone Commit Types + Materiality Gates
 *
 * Canon: commit materiality + work zones
 * Gates:
 *  - Z1: zone IDs must match zone.<company>.<dept>.<project>
 *  - M1: commit state may change only via COMMIT_STATE_SET
 *  - MB1: COMMIT/REVERT require boundary reason
 */

export const WORKZONE_DEFINE = 'WORKZONE_DEFINE';
export const WORKZONE_CONTEXT_SNAPSHOT = 'WORKZONE_CONTEXT_SNAPSHOT';
export const COMMIT_STATE_SET = 'COMMIT_STATE_SET';
export const MATERIAL_BOUNDARY_DECLARED = 'MATERIAL_BOUNDARY_DECLARED';
export const REFUSAL = 'REFUSAL';

export const COMMIT_STATES = ['DRAFT', 'HOLD', 'PROPOSE', 'COMMIT', 'REVERT'];
export const MATERIAL_BOUNDARIES = ['time', 'risk', 'dependency', 'visibility'];

const ZONE_ID_PATTERN = /^zone\.[a-z0-9-]+\.[a-z0-9-]+\.[a-z0-9-]+$/;

export function validateWorkZoneId(zoneId) {
  return typeof zoneId === 'string' && ZONE_ID_PATTERN.test(zoneId);
}

export function createRefusal(code, message, context = {}) {
  return {
    type: REFUSAL,
    code,
    message,
    context,
    timestamp: Date.now()
  };
}

export function isValidWorkZoneCommit(commit) {
  if (!commit || typeof commit !== 'object') return false;
  if (typeof commit.type !== 'string') return false;
  if (typeof commit.timestamp !== 'number') return false;

  switch (commit.type) {
    case WORKZONE_DEFINE:
      return typeof commit.zoneId === 'string';
    case WORKZONE_CONTEXT_SNAPSHOT:
      return typeof commit.snapshotHash === 'string';
    case COMMIT_STATE_SET:
      return typeof commit.state === 'string';
    case MATERIAL_BOUNDARY_DECLARED:
      return typeof commit.boundaryReason === 'string';
    case REFUSAL:
      return typeof commit.code === 'string' && typeof commit.message === 'string';
    default:
      return false;
  }
}

export function createInitialWorkZoneState() {
  return {
    zoneId: null,
    commitState: 'DRAFT',
    lastBoundaryReason: null,
    lastSnapshotHash: null,
    updatedAt: null
  };
}

export function applyWorkZoneCommit(state, commit) {
  if (!state) state = createInitialWorkZoneState();
  if (!isValidWorkZoneCommit(commit)) {
    return {
      ok: false,
      state,
      refusal: createRefusal('REFUSAL.INVALID_COMMIT', 'Invalid work zone commit', {
        commit
      })
    };
  }

  const next = { ...state, updatedAt: commit.timestamp };

  if (commit.zoneId && state.zoneId && commit.zoneId !== state.zoneId) {
    return {
      ok: false,
      state,
      refusal: createRefusal(
        'REFUSAL.Z1_ZONE_MISMATCH',
        'Commit zoneId does not match active work zone',
        { commitZoneId: commit.zoneId, activeZoneId: state.zoneId }
      )
    };
  }

  switch (commit.type) {
    case WORKZONE_DEFINE: {
      if (!validateWorkZoneId(commit.zoneId)) {
        return {
          ok: false,
          state,
          refusal: createRefusal(
            'REFUSAL.Z1_INVALID_ZONE_ID',
            'Work zone ID does not match zone.<company>.<dept>.<project>',
            { zoneId: commit.zoneId }
          )
        };
      }
      next.zoneId = commit.zoneId;
      return { ok: true, state: next };
    }
    case WORKZONE_CONTEXT_SNAPSHOT: {
      next.lastSnapshotHash = commit.snapshotHash;
      return { ok: true, state: next };
    }
    case MATERIAL_BOUNDARY_DECLARED: {
      if (!MATERIAL_BOUNDARIES.includes(commit.boundaryReason)) {
        return {
          ok: false,
          state,
          refusal: createRefusal(
            'REFUSAL.MB1_INVALID_BOUNDARY',
            'Boundary reason must be one of: time, risk, dependency, visibility',
            { boundaryReason: commit.boundaryReason }
          )
        };
      }
      next.lastBoundaryReason = commit.boundaryReason;
      return { ok: true, state: next };
    }
    case COMMIT_STATE_SET: {
      if (!COMMIT_STATES.includes(commit.state)) {
        return {
          ok: false,
          state,
          refusal: createRefusal(
            'REFUSAL.M1_INVALID_STATE',
            'Commit state is not recognized',
            { state: commit.state }
          )
        };
      }

      const boundaryReason = commit.boundaryReason || state.lastBoundaryReason;
      if ((commit.state === 'COMMIT' || commit.state === 'REVERT') && !boundaryReason) {
        return {
          ok: false,
          state,
          refusal: createRefusal(
            'REFUSAL.MB1_BOUNDARY_REQUIRED',
            'COMMIT/REVERT require boundary reason',
            { state: commit.state }
          )
        };
      }

      next.commitState = commit.state;
      if (boundaryReason) next.lastBoundaryReason = boundaryReason;
      return { ok: true, state: next };
    }
    case REFUSAL:
      return { ok: false, state, refusal: commit };
    default:
      return {
        ok: false,
        state,
        refusal: createRefusal('REFUSAL.UNKNOWN_TYPE', 'Unknown work zone commit type', {
          type: commit.type
        })
      };
  }
}
