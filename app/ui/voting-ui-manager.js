import { freezeEligibilitySnapshot, getQuorumThreshold } from '../../core/models/governance/vote-canon-spec.js';
import { GovernanceLifecycleRunner } from '../../core/models/governance/lifecycle-runner.js';

const nowIso = () => new Date().toISOString();

const normalizeVoteType = (value) => {
  const key = String(value || '').toLowerCase();
  return key === 'governance' ? 'governance' : 'presentation';
};

const normalizeCadence = (value) => {
  const key = String(value || 'weekly').toLowerCase();
  return ['weekly', 'monthly', 'event', 'constitutional'].includes(key) ? key : 'weekly';
};

const normalizeDecision = (value) => {
  const key = String(value || '').toUpperCase();
  if (key === 'APPROVE' || key === 'REJECT' || key === 'VETO') return key;
  return '';
};

const stableSortById = (items) => items.slice().sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));

const fnv1aHex = (input) => {
  let hash = 0x811c9dc5;
  const value = String(input ?? '');
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (`00000000${(hash >>> 0).toString(16)}`).slice(-8);
};

export class VotingUIManager {
  constructor({ logger = null } = {}) {
    this.logger = typeof logger === 'function' ? logger : () => {};
    this.topics = [];
    this.ballots = [];
    this.selectedTopicId = null;
  }

  _log(line) {
    this.logger(String(line));
  }

  reset(topics = []) {
    this.topics = stableSortById(
      (Array.isArray(topics) ? topics : []).map((topic) => ({
        id: String(topic?.id || ''),
        title: String(topic?.title || 'Untitled Topic'),
        type: normalizeVoteType(topic?.type),
        policyRef: String(topic?.policyRef || ''),
        scope: String(topic?.scope || 'zone.avgol.ops'),
        cadence: normalizeCadence(topic?.cadence || 'weekly'),
        quorumOverride: Number.isFinite(topic?.quorumOverride) ? Number(topic.quorumOverride) : null,
        state: String(topic?.state || 'DRAFT'),
        topicRef: topic?.topicRef && typeof topic.topicRef === 'object' ? { ...topic.topicRef } : null,
        requiredRoles: Array.isArray(topic?.requiredRoles) ? topic.requiredRoles.map(String) : [],
        authorityRefs: Array.isArray(topic?.authorityRefs) ? topic.authorityRefs.map(String) : [],
        runtime: topic?.runtime && typeof topic.runtime === 'object' ? { ...topic.runtime } : null
      })).filter((topic) => topic.id)
    );
    this.ballots = [];
    this.selectedTopicId = this.topics[0]?.id || null;
    return { ok: true, topics: this.topics.length };
  }

  getRawState() {
    return {
      topics: JSON.parse(JSON.stringify(this.topics)),
      ballots: JSON.parse(JSON.stringify(this.ballots)),
      selectedTopicId: this.selectedTopicId
    };
  }

  getTopicById(topicId) {
    return this.topics.find((topic) => topic.id === String(topicId || '')) || null;
  }

  selectTopic(topicId) {
    const topic = this.getTopicById(topicId);
    if (!topic) return { ok: false, reason: 'TOPIC_NOT_FOUND' };
    this.selectedTopicId = topic.id;
    return { ok: true, topicId: topic.id };
  }

  _topicBallots(topicId) {
    return this.ballots.filter((vote) => vote.topicId === topicId);
  }

  _effectiveBallots(topic) {
    const ballots = this._topicBallots(topic.id);
    const byVoter = new Map();
    for (const vote of ballots) {
      if (!byVoter.has(vote.voterId)) {
        byVoter.set(vote.voterId, vote);
      }
    }
    return [...byVoter.values()].sort((a, b) => a.voterId.localeCompare(b.voterId));
  }

  _computeTopicMetrics(topic) {
    const effective = this._effectiveBallots(topic);
    const support = effective.filter((v) => v.decision === 'APPROVE').length;
    const oppose = effective.filter((v) => v.decision === 'REJECT').length;
    const veto = effective.filter((v) => v.decision === 'VETO').length;
    const total = effective.length;
    const supportPct = total > 0 ? (support / total) : 0;

    const quorumThreshold = topic.quorumOverride != null
      ? Number(topic.quorumOverride)
      : getQuorumThreshold(topic.cadence);

    const eligibleCount = topic.type === 'governance'
      ? Number(topic?.runtime?.eligibilitySnapshot?.voterCount || 0)
      : Math.max(total, 1);

    const quorumPct = eligibleCount > 0 ? (total / eligibleCount) : 0;

    return {
      support,
      oppose,
      veto,
      total,
      supportPct,
      quorumPct,
      quorumThreshold,
      quorumPass: quorumPct >= quorumThreshold
    };
  }

  getLane() {
    const rows = this.topics.map((topic) => {
      const metrics = this._computeTopicMetrics(topic);
      return {
        id: topic.id,
        title: topic.title,
        type: topic.type,
        state: topic.state,
        policyRef: topic.policyRef || null,
        scope: topic.scope || null,
        supportPct: metrics.supportPct,
        quorumPct: metrics.quorumPct,
        quorumThreshold: metrics.quorumThreshold
      };
    });
    return rows.sort((a, b) => {
      if (b.supportPct !== a.supportPct) return b.supportPct - a.supportPct;
      if (b.quorumPct !== a.quorumPct) return b.quorumPct - a.quorumPct;
      return a.id.localeCompare(b.id);
    });
  }

  getSelectedPanelState() {
    const topic = this.getTopicById(this.selectedTopicId);
    if (!topic) {
      return { ok: false, reason: 'TOPIC_NOT_SELECTED' };
    }
    const metrics = this._computeTopicMetrics(topic);
    const timeRemainingSec = Math.max(0, Number(topic?.runtime?.voteWindowSec || 300) - Number(topic?.runtime?.elapsedSec || 0));
    return {
      ok: true,
      topic: {
        id: topic.id,
        title: topic.title,
        type: topic.type,
        state: topic.state,
        policyRef: topic.policyRef || null,
        scope: topic.scope || null
      },
      eligibility: {
        frozen: !!topic?.runtime?.eligibilitySnapshot,
        snapshotId: topic?.runtime?.snapshotId || null,
        voterCount: Number(topic?.runtime?.eligibilitySnapshot?.voterCount || 0)
      },
      quorum: {
        required: metrics.quorumThreshold,
        current: metrics.quorumPct,
        pass: metrics.quorumPass
      },
      vote: {
        supportPct: metrics.supportPct,
        support: metrics.support,
        oppose: metrics.oppose,
        veto: metrics.veto,
        total: metrics.total
      },
      timeRemainingSec
    };
  }

  startTopic(topicId, { voters = [], frozenAt = nowIso() } = {}) {
    const topic = this.getTopicById(topicId);
    if (!topic) return { ok: false, reason: 'TOPIC_NOT_FOUND' };
    if (topic.state === 'ACTIVE') return { ok: true, topicId: topic.id, state: topic.state };

    if (topic.type === 'governance') {
      const eligibilitySnapshot = freezeEligibilitySnapshot({
        scope: topic.scope,
        requiredRoles: topic.requiredRoles || [],
        authorityRefs: topic.authorityRefs || [],
        voters: Array.isArray(voters) ? voters : [],
        frozenAt
      });
      const snapshotId = `SNAP-${topic.id}-${eligibilitySnapshot.snapshotHash}`;
      topic.runtime = {
        ...(topic.runtime || {}),
        eligibilitySnapshot,
        snapshotId,
        voteWindowSec: 300,
        elapsedSec: 0,
        startedAt: nowIso()
      };
      this._log(`[VOTE] type=governance scope=${topic.scope}`);
      this._log(`[VOTE] eligibilitySnapshot id=${snapshotId}`);
    }

    topic.state = 'ACTIVE';
    this._log('[VOTE] lifecycleTransition state=ACTIVE');
    return { ok: true, topicId: topic.id, state: topic.state, snapshotId: topic?.runtime?.snapshotId || null };
  }

  castVote({ topicId, voterId, decision, role = '', authorityRef = '', scope = '' } = {}) {
    const topic = this.getTopicById(topicId);
    if (!topic) return { ok: false, reason: 'TOPIC_NOT_FOUND' };

    if (topic.state !== 'ACTIVE') {
      this._log(`[REFUSAL] stageLocked topic=${topic.id} state=${topic.state}`);
      return { ok: false, reason: 'STAGE_LOCKED' };
    }

    const vId = String(voterId || '').trim();
    const dec = normalizeDecision(decision);
    if (!vId || !dec) return { ok: false, reason: 'VOTE_INVALID' };

    if (topic.type === 'governance') {
      const snapshot = topic?.runtime?.eligibilitySnapshot;
      const eligible = new Set(snapshot?.eligibleVoters || []);
      if (!eligible.has(vId)) {
        this._log(`[REFUSAL] reason=VOTE_ELIGIBILITY_MISMATCH topic=${topic.id} voter=${vId}`);
        return { ok: false, reason: 'VOTE_ELIGIBILITY_MISMATCH' };
      }
    }

    this.ballots = this.ballots.filter((vote) => !(vote.topicId === topic.id && vote.voterId === vId));
    this.ballots.push({
      topicId: topic.id,
      voterId: vId,
      decision: dec,
      role: String(role || ''),
      authorityRef: String(authorityRef || ''),
      scope: String(scope || topic.scope || ''),
      createdAt: nowIso()
    });

    if (topic.type === 'presentation') {
      this._log(`[VOTE] type=presentation policyRef=${topic.policyRef || 'none'} action=CAST`);
    } else {
      this._log(`[VOTE] type=governance scope=${topic.scope}`);
    }

    return { ok: true, topicId: topic.id, voterId: vId, decision: dec };
  }

  closeGovernanceTopic(topicId, { commitId = '' } = {}) {
    const topic = this.getTopicById(topicId);
    if (!topic) return { ok: false, reason: 'TOPIC_NOT_FOUND' };
    if (topic.type !== 'governance') return { ok: false, reason: 'TOPIC_NOT_GOVERNANCE' };
    if (topic.state !== 'ACTIVE') {
      this._log(`[REFUSAL] stageLocked topic=${topic.id} state=${topic.state}`);
      return { ok: false, reason: 'STAGE_LOCKED' };
    }

    const snapshot = topic?.runtime?.eligibilitySnapshot || null;
    if (!snapshot) return { ok: false, reason: 'ELIGIBILITY_NOT_FROZEN' };

    const directVotes = this._effectiveBallots(topic).map((vote) => ({
      voterId: vote.voterId,
      decision: vote.decision,
      role: vote.role
    }));

    const runner = new GovernanceLifecycleRunner({
      proposalId: topic.id,
      scope: topic.scope,
      cadence: topic.cadence,
      eligibilitySnapshot: snapshot,
      vetoRoles: ['manager'],
      logger: this.logger
    });

    runner.startLifecycle();
    const evaluation = runner.evaluateVotes({ directVotes, delegations: [] });
    const unlock = runner.stageUnlock({ voteResult: evaluation.result, commitId });

    if (evaluation.result === 'PASS' && unlock) {
      runner.commit();
      topic.state = 'PASS';
      this._log('[VOTE] lifecycleTransition state=PASS');
    } else if (evaluation.result === 'VETO') {
      topic.state = 'VETO';
      this._log('[VOTE] lifecycleTransition state=VETO');
    } else {
      runner.refuse();
      topic.state = 'REFUSAL';
      this._log('[VOTE] lifecycleTransition state=REFUSAL');
    }

    return { ok: true, topicId: topic.id, state: topic.state, evaluation };
  }

  getDeterminismDigest() {
    const lane = this.getLane();
    const panel = this.getSelectedPanelState();
    const payload = JSON.stringify({
      lane: lane.map((x) => ({
        id: x.id,
        state: x.state,
        supportPct: Number(x.supportPct || 0).toFixed(6),
        quorumPct: Number(x.quorumPct || 0).toFixed(6)
      })),
      panel: panel?.ok ? {
        topicId: panel.topic.id,
        state: panel.topic.state,
        supportPct: Number(panel.vote.supportPct || 0).toFixed(6),
        quorumCurrent: Number(panel.quorum.current || 0).toFixed(6)
      } : null
    });
    return `0x${fnv1aHex(payload)}`;
  }
}

