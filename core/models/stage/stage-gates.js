export const STAGE_TRACKS = Object.freeze({
  ISG: 'ISG',
  GSG: 'GSG'
});

export const ACTION_STAGE_REQUIREMENTS = Object.freeze({
  trainingPreview: { track: STAGE_TRACKS.ISG, requiredStage: 1 },
  simulationRun: { track: STAGE_TRACKS.ISG, requiredStage: 2 },
  commitPosting: { track: STAGE_TRACKS.GSG, requiredStage: 2 },
  policyMutation: { track: STAGE_TRACKS.GSG, requiredStage: 3 },
  stageUnlock: { track: STAGE_TRACKS.GSG, requiredStage: 2 }
});

const getRequirement = (actionId, stageState) => {
  const overrides = stageState?.requirements || {};
  return overrides[actionId] || ACTION_STAGE_REQUIREMENTS[actionId] || { track: STAGE_TRACKS.GSG, requiredStage: 1 };
};

const getCurrentStage = ({ track, scope, userId, stageState }) => {
  const state = stageState || {};
  if (track === STAGE_TRACKS.ISG) {
    return Number((state.isgByUser || {})[String(userId || '')] || 0);
  }
  return Number((state.gsgByScope || {})[String(scope || 'global')] || 0);
};

export function canExecute(actionId, scope, userId, authorityRef, stageState = {}) {
  const action = String(actionId || '');
  const requirement = getRequirement(action, stageState);
  const currentStage = getCurrentStage({ track: requirement.track, scope, userId, stageState });
  const requiredStage = Number(requirement.requiredStage || 1);
  const hasAuthority = Boolean(authorityRef && String(authorityRef).trim().length > 0);

  if (currentStage < requiredStage) {
    return {
      ok: false,
      result: 'REFUSAL',
      reason: 'STAGE_LOCKED',
      requiredStage,
      currentStage,
      track: requirement.track,
      action
    };
  }

  if (requirement.track === STAGE_TRACKS.GSG && action === 'stageUnlock' && !hasAuthority) {
    return {
      ok: false,
      result: 'REFUSAL',
      reason: 'AUTHORITY_REQUIRED',
      requiredStage,
      currentStage,
      track: requirement.track,
      action
    };
  }

  return {
    ok: true,
    result: 'PASS',
    reason: 'STAGE_OK',
    requiredStage,
    currentStage,
    track: requirement.track,
    action
  };
}

export function recommendStageUnlock({ proposalId, scope, voteResult }) {
  return {
    proposalId: String(proposalId || ''),
    scope: String(scope || 'global'),
    voteResult: String(voteResult || 'UNKNOWN'),
    commitRequired: true
  };
}

export function applyCommittedStageUnlock({ scope, userId, targetStage, commitId, authorityRef, track = STAGE_TRACKS.GSG, stageState = {} }) {
  const cid = String(commitId || '');
  if (!cid) {
    return { ok: false, reason: 'MISSING_COMMIT_ID', stageState };
  }
  const auth = String(authorityRef || '').trim();
  if (!auth) {
    return { ok: false, reason: 'MISSING_AUTHORITY_REF', stageState };
  }

  const nextStage = Number(targetStage || 0);
  const out = {
    ...stageState,
    isgByUser: { ...(stageState.isgByUser || {}) },
    gsgByScope: { ...(stageState.gsgByScope || {}) },
    requirements: { ...(stageState.requirements || {}) }
  };

  if (track === STAGE_TRACKS.ISG) {
    out.isgByUser[String(userId || '')] = nextStage;
  } else {
    out.gsgByScope[String(scope || 'global')] = nextStage;
  }

  return { ok: true, reason: 'PASS', stageState: out };
}

