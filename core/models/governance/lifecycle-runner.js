/**
 * LCK-3 Governance Executable Spec Stub
 * Deterministic lifecycle + vote/delegation/veto handling.
 */

import { getQuorumThreshold } from './vote-canon-spec.js';

const STATES = Object.freeze({
  DRAFT: 'DRAFT',
  HOLD: 'HOLD',
  PROPOSE: 'PROPOSE',
  VOTE_WINDOW: 'VOTE_WINDOW',
  PASS: 'PASS',
  FAIL: 'FAIL',
  VETO: 'VETO',
  COMMIT: 'COMMIT',
  REFUSAL: 'REFUSAL'
});

export class GovernanceLifecycleRunner {
  constructor({ proposalId, scope, cadence, eligibilitySnapshot, vetoRoles = [], logger = null }) {
    this.proposalId = String(proposalId || '');
    this.scope = String(scope || '');
    this.cadence = String(cadence || 'weekly').toLowerCase();
    this.eligibilitySnapshot = eligibilitySnapshot || { voterCount: 0, snapshotHash: 'none' };
    this.vetoRoles = new Set((vetoRoles || []).map(v => String(v || '').trim()).filter(Boolean));
    this.state = STATES.DRAFT;
    this.logger = (typeof logger === 'function') ? logger : () => {};
    this._logTransition('INIT', this.state);
  }

  _log(line) {
    this.logger(line);
  }

  _transition(toState) {
    const from = this.state;
    this.state = String(toState);
    this._logTransition(from, this.state);
  }

  _logTransition(from, to) {
    this._log(`[GOV] state-transition from=${from} to=${to} proposalId=${this.proposalId} scope=${this.scope}`);
  }

  startLifecycle() {
    this._transition(STATES.HOLD);
    this._transition(STATES.PROPOSE);
    this._transition(STATES.VOTE_WINDOW);
  }

  evaluateVotes({ directVotes = [], delegations = [] }) {
    const eligibleIds = new Set(this.eligibilitySnapshot?.eligibleVoters || []);
    const directByVoter = new Map();
    for (const vote of directVotes) {
      const voterId = String(vote?.voterId || '');
      if (!eligibleIds.has(voterId)) continue;
      if (!directByVoter.has(voterId)) {
        directByVoter.set(voterId, {
          voterId,
          decision: String(vote?.decision || '').toUpperCase(),
          role: String(vote?.role || '')
        });
      }
    }

    const delegationTo = new Map();
    for (const d of delegations) {
      const fromVoterId = String(d?.fromVoterId || '');
      const toVoterId = String(d?.toVoterId || '');
      if (!eligibleIds.has(fromVoterId)) continue;
      if (!eligibleIds.has(toVoterId)) continue;
      if (!delegationTo.has(fromVoterId)) delegationTo.set(fromVoterId, toVoterId);
    }

    let delegatedVotes = 0;
    const effectiveVotes = new Map(directByVoter);
    for (const voterId of eligibleIds) {
      if (effectiveVotes.has(voterId)) continue; // direct vote overrides delegation
      const delegatee = delegationTo.get(voterId);
      if (!delegatee) continue;
      const delegateVote = directByVoter.get(delegatee);
      if (!delegateVote) continue;
      effectiveVotes.set(voterId, {
        voterId,
        decision: delegateVote.decision,
        role: 'delegated'
      });
      delegatedVotes += 1;
    }

    const directVotesCount = directByVoter.size;
    this._log(`[GOV] delegation-resolve proposalId=${this.proposalId} directVotes=${directVotesCount} delegatedVotes=${delegatedVotes}`);

    let support = 0;
    let oppose = 0;
    let veto = 0;
    let vetoBy = null;
    for (const vote of effectiveVotes.values()) {
      if (vote.decision === 'APPROVE') support += 1;
      else if (vote.decision === 'REJECT') oppose += 1;
      else if (vote.decision === 'VETO') {
        veto += 1;
        const direct = directByVoter.get(vote.voterId);
        if (direct && this.vetoRoles.has(direct.role)) {
          vetoBy = `${direct.role}|${direct.voterId}`;
        }
      }
    }

    const eligibleCount = Number(this.eligibilitySnapshot?.voterCount || eligibleIds.size || 0);
    const participated = effectiveVotes.size;
    const threshold = getQuorumThreshold(this.cadence);
    const quorumPass = eligibleCount > 0 ? (participated / eligibleCount) >= threshold : false;

    let result = 'FAIL';
    if (vetoBy) result = 'VETO';
    else if (quorumPass && support > oppose) result = 'PASS';
    else result = 'FAIL';

    this._log(`[GOV] quorum-eval proposalId=${this.proposalId} eligible=${eligibleCount} participated=${participated} threshold=${threshold} result=${result}`);

    if (result === 'VETO') {
      this._transition(STATES.VETO);
      this._log(`[GOV] veto proposalId=${this.proposalId} by=${vetoBy} action=HOLD_RECONCILE scope=${this.scope}`);
      this._transition(STATES.HOLD);
    } else if (result === 'PASS') {
      this._transition(STATES.PASS);
    } else {
      this._transition(STATES.FAIL);
      this._transition(STATES.REFUSAL);
    }

    return { result, eligibleCount, participated, threshold, support, oppose, veto, vetoBy };
  }

  stageUnlock({ voteResult, commitId }) {
    const cid = String(commitId || 'none');
    this._log(`[GOV] stage-unlock proposalId=${this.proposalId} voteResult=${voteResult} commitRequired=true commitId=${cid}`);
    return cid !== 'none';
  }

  applyScopeIsolation({ proposalScope, commitScope }) {
    const pScope = String(proposalScope || '');
    const cScope = String(commitScope || '');
    let pass = false;
    if (pScope.startsWith('global') && !cScope.startsWith('global')) {
      pass = false;
    } else {
      pass = pScope === cScope;
    }
    this._log(`[GOV] scope-isolation proposalId=${this.proposalId} proposalScope=${pScope} commitScope=${cScope} result=${pass ? 'PASS' : 'REFUSAL'}`);
    return pass;
  }

  commit() {
    this._transition(STATES.COMMIT);
  }

  refuse() {
    this._transition(STATES.REFUSAL);
  }
}

export { STATES as GOVERNANCE_STATES };

