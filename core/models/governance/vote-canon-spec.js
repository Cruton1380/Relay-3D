/**
 * Vote Canon Spec Stub (LCK-2)
 * Renderer-agnostic governance primitives for deterministic voting semantics.
 */

export const QUORUM_BY_CADENCE = Object.freeze({
  weekly: 0.30,
  monthly: 0.50,
  event: 0.60,
  constitutional: 0.75
});

export const APPROVAL_BY_CLASS = Object.freeze({
  standard: 0.60,
  constitutional: 0.75
});

export const VOTE_SYSTEMS = Object.freeze({
  flowContent: 'ranking-only',
  governance: 'authority'
});

export const PRESSURE_ISOLATION = Object.freeze({
  voteWeight: 'UNCHANGED',
  quorum: 'UNCHANGED',
  window: 'UNCHANGED'
});

export const STRICT_BOUNDARY_GOVERNANCE = Object.freeze({
  globalInfluenceOnCompanyAuthority: 'DISABLED'
});

const fnv1aHex = (input) => {
  let hash = 0x811c9dc5;
  const value = String(input ?? '');
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (`00000000${(hash >>> 0).toString(16)}`).slice(-8);
};

export const getQuorumThreshold = (cadence) => {
  const key = String(cadence || '').toLowerCase();
  if (!(key in QUORUM_BY_CADENCE)) {
    throw new Error(`Unknown cadence: ${cadence}`);
  }
  return QUORUM_BY_CADENCE[key];
};

/**
 * Deterministic eligible voter snapshot:
 * eligibleVoters = f(scope, role, authority) over a candidate set.
 */
export const freezeEligibilitySnapshot = ({
  scope,
  requiredRoles = [],
  authorityRefs = [],
  voters = [],
  frozenAt = new Date().toISOString()
}) => {
  const scopeKey = String(scope || '').trim();
  const roles = new Set(requiredRoles.map(r => String(r || '').trim()).filter(Boolean));
  const authorities = new Set(authorityRefs.map(a => String(a || '').trim()).filter(Boolean));

  const eligible = voters
    .filter(v => {
      const voterScope = String(v?.scope || '');
      const voterRole = String(v?.role || '');
      const voterAuthority = String(v?.authorityRef || '');
      const scopeOk = voterScope === scopeKey;
      const roleOk = roles.size === 0 || roles.has(voterRole);
      const authOk = authorities.size === 0 || authorities.has(voterAuthority);
      return scopeOk && roleOk && authOk;
    })
    .map(v => String(v.id))
    .sort((a, b) => a.localeCompare(b));

  const payload = {
    scope: scopeKey,
    eligibleVoters: eligible,
    voterCount: eligible.length,
    frozenAt
  };
  const snapshotHash = fnv1aHex(JSON.stringify(payload));
  return { ...payload, snapshotHash };
};

