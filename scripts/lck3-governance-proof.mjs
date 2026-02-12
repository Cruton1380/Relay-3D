import fs from 'node:fs/promises';
import path from 'node:path';
import { GovernanceLifecycleRunner } from '../core/models/governance/lifecycle-runner.js';
import { freezeEligibilitySnapshot } from '../core/models/governance/vote-canon-spec.js';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `lck3-governance-console-${DATE_TAG}.log`);

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });

  const snapshot = freezeEligibilitySnapshot({
    scope: 'zone.avgol.ops',
    requiredRoles: ['manager', 'steward', 'finance'],
    authorityRefs: ['policy.governance.v2'],
    voters: [
      { id: 'user.manager1', scope: 'zone.avgol.ops', role: 'manager', authorityRef: 'policy.governance.v2' },
      { id: 'user.steward1', scope: 'zone.avgol.ops', role: 'steward', authorityRef: 'policy.governance.v2' },
      { id: 'user.finance1', scope: 'zone.avgol.ops', role: 'finance', authorityRef: 'policy.governance.v2' },
      { id: 'user.viewer1', scope: 'zone.avgol.ops', role: 'viewer', authorityRef: 'policy.governance.v2' }
    ],
    frozenAt: '2026-02-11T09:50:00.000Z'
  });

  const runner = new GovernanceLifecycleRunner({
    proposalId: 'PROPOSAL-LCK3-001',
    scope: 'zone.avgol.ops',
    cadence: 'weekly',
    eligibilitySnapshot: snapshot,
    vetoRoles: ['manager'],
    logger: log
  });

  runner.startLifecycle();

  const evaluation = runner.evaluateVotes({
    directVotes: [
      { voterId: 'user.manager1', decision: 'APPROVE', role: 'manager' },
      { voterId: 'user.steward1', decision: 'APPROVE', role: 'steward' }
    ],
    delegations: [
      { fromVoterId: 'user.finance1', toVoterId: 'user.manager1' }
    ]
  });

  const unlockAllowed = runner.stageUnlock({
    voteResult: evaluation.result,
    commitId: 'commit.lck3.20260211'
  });

  const scopePass = runner.applyScopeIsolation({
    proposalScope: 'zone.avgol.ops',
    commitScope: 'zone.avgol.ops'
  });

  if (evaluation.result === 'PASS' && unlockAllowed && scopePass) {
    runner.commit();
  } else {
    runner.refuse();
  }

  // Veto scenario (required by LCK-3 proof criteria).
  const vetoRunner = new GovernanceLifecycleRunner({
    proposalId: 'PROPOSAL-LCK3-002',
    scope: 'zone.avgol.ops',
    cadence: 'weekly',
    eligibilitySnapshot: snapshot,
    vetoRoles: ['manager'],
    logger: log
  });
  vetoRunner.startLifecycle();
  vetoRunner.evaluateVotes({
    directVotes: [
      { voterId: 'user.manager1', decision: 'VETO', role: 'manager' },
      { voterId: 'user.steward1', decision: 'APPROVE', role: 'steward' }
    ],
    delegations: []
  });

  const pass =
    lines.some(l => l.includes('[GOV] state-transition')) &&
    lines.some(l => l.includes('[GOV] quorum-eval')) &&
    lines.some(l => l.includes('[GOV] delegation-resolve')) &&
    lines.some(l => l.includes('[GOV] veto')) &&
    lines.some(l => l.includes('[GOV] stage-unlock')) &&
    lines.some(l => l.includes('[GOV] scope-isolation')) &&
    evaluation.result === 'PASS' &&
    scopePass;

  const summary = {
    proposalId: 'PROPOSAL-LCK3-001',
    pass,
    voteResult: evaluation.result,
    eligible: evaluation.eligibleCount,
    participated: evaluation.participated,
    threshold: evaluation.threshold,
    snapshotHash: snapshot.snapshotHash
  };
  log(`[LCK3] summary=${JSON.stringify(summary)}`);

  await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
  log(`[LCK3] log=archive/proofs/${path.basename(LOG_FILE)}`);

  if (!pass) process.exitCode = 2;
}

main().catch(async (err) => {
  const fatal = `[LCK3] fatal=${err?.stack || err}`;
  // eslint-disable-next-line no-console
  console.error(fatal);
  try {
    await fs.mkdir(PROOFS_DIR, { recursive: true });
    await fs.writeFile(LOG_FILE, `${fatal}\n`, 'utf8');
  } catch {
    // ignore
  }
  process.exitCode = 1;
});

