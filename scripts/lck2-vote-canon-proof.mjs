import fs from 'node:fs/promises';
import path from 'node:path';
import {
  QUORUM_BY_CADENCE,
  getQuorumThreshold,
  freezeEligibilitySnapshot,
  VOTE_SYSTEMS,
  PRESSURE_ISOLATION,
  STRICT_BOUNDARY_GOVERNANCE
} from '../core/models/governance/vote-canon-spec.js';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `lck2-vote-canon-console-${DATE_TAG}.log`);

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });

  const cadenceModelOk =
    getQuorumThreshold('weekly') === QUORUM_BY_CADENCE.weekly &&
    getQuorumThreshold('monthly') === QUORUM_BY_CADENCE.monthly &&
    getQuorumThreshold('event') === QUORUM_BY_CADENCE.event &&
    getQuorumThreshold('constitutional') === QUORUM_BY_CADENCE.constitutional;

  const snapshot = freezeEligibilitySnapshot({
    scope: 'zone.avgol.ops',
    requiredRoles: ['steward', 'manager'],
    authorityRefs: ['policy.governance.v2'],
    voters: [
      { id: 'user.buyer1', scope: 'zone.avgol.ops', role: 'steward', authorityRef: 'policy.governance.v2' },
      { id: 'user.manager1', scope: 'zone.avgol.ops', role: 'manager', authorityRef: 'policy.governance.v2' },
      { id: 'user.viewer1', scope: 'zone.avgol.ops', role: 'viewer', authorityRef: 'policy.governance.v2' },
      { id: 'user.other1', scope: 'zone.other.ops', role: 'steward', authorityRef: 'policy.governance.v2' }
    ],
    frozenAt: '2026-02-11T09:30:00.000Z'
  });

  log(`[VOTE-CANON] quorum-model=CADENCE_TABLE status=${cadenceModelOk ? 'PASS' : 'FAIL'} weekly=${QUORUM_BY_CADENCE.weekly} monthly=${QUORUM_BY_CADENCE.monthly} event=${QUORUM_BY_CADENCE.event} constitutional=${QUORUM_BY_CADENCE.constitutional}`);
  log(`[VOTE-CANON] eligibility-snapshot scope=${snapshot.scope} voters=${snapshot.voterCount} frozenAt=${snapshot.frozenAt} snapshotHash=${snapshot.snapshotHash}`);
  log(`[VOTE-CANON] separation flowVoting=${VOTE_SYSTEMS.flowContent} governanceVoting=${VOTE_SYSTEMS.governance}`);
  log(`[VOTE-CANON] pressure-isolation voteWeight=${PRESSURE_ISOLATION.voteWeight} quorum=${PRESSURE_ISOLATION.quorum} window=${PRESSURE_ISOLATION.window}`);
  log(`[VOTE-CANON] strict-boundary-governance globalInfluenceOnCompanyAuthority=${STRICT_BOUNDARY_GOVERNANCE.globalInfluenceOnCompanyAuthority}`);

  await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
  log(`[LCK2] log=archive/proofs/${path.basename(LOG_FILE)}`);

  if (!cadenceModelOk) {
    process.exitCode = 2;
  }
}

main().catch(async (err) => {
  const fatal = `[LCK2] fatal=${err?.stack || err}`;
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

