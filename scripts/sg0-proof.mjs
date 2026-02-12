import fs from 'node:fs/promises';
import path from 'node:path';
import {
  canExecute,
  recommendStageUnlock,
  applyCommittedStageUnlock,
  STAGE_TRACKS
} from '../core/models/stage/stage-gates.js';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `sg0-proof-console-${DATE_TAG}.log`);

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

const logRefusal = (res, scope) => {
  log(`[REFUSAL] reason=${res.reason} requiredStage=${res.requiredStage} action=${res.action} scope=${scope}`);
};

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });

  let stageState = {
    isgByUser: { 'user.alex': 2 },
    gsgByScope: { 'zone.avgol.ops': 1 }
  };

  // ISG allows training/preview.
  const isgPreview = canExecute('trainingPreview', 'zone.avgol.ops', 'user.alex', null, stageState);
  log(`[SG0] isg-preview result=${isgPreview.ok ? 'PASS' : 'REFUSAL'} stage=${isgPreview.currentStage} required=${isgPreview.requiredStage}`);

  const isgSim = canExecute('simulationRun', 'zone.avgol.ops', 'user.alex', null, stageState);
  log(`[SG0] isg-simulation result=${isgSim.ok ? 'PASS' : 'REFUSAL'} stage=${isgSim.currentStage} required=${isgSim.requiredStage}`);

  // GSG blocks mechanics until commit.
  const preUnlockCommit = canExecute('commitPosting', 'zone.avgol.ops', 'user.alex', 'policy.governance.v2', stageState);
  if (!preUnlockCommit.ok) logRefusal(preUnlockCommit, 'zone.avgol.ops');
  log(`[SG0] gsg-preunlock result=${preUnlockCommit.ok ? 'PASS' : 'REFUSAL'}`);

  // Vote result alone does not unlock stage.
  const recommendation = recommendStageUnlock({
    proposalId: 'PROPOSAL-SG0-001',
    scope: 'zone.avgol.ops',
    voteResult: 'PASS'
  });
  log(`[GOV] stage-unlock proposalId=${recommendation.proposalId} voteResult=${recommendation.voteResult} commitRequired=true commitId=none`);

  const postVoteNoCommit = canExecute('commitPosting', 'zone.avgol.ops', 'user.alex', 'policy.governance.v2', stageState);
  if (!postVoteNoCommit.ok) logRefusal(postVoteNoCommit, 'zone.avgol.ops');
  log(`[SG0] vote-only-unlock result=${postVoteNoCommit.ok ? 'PASS' : 'REFUSAL'}`);

  // Explicit COMMIT with authority unlocks GSG.
  const applied = applyCommittedStageUnlock({
    scope: 'zone.avgol.ops',
    userId: 'user.alex',
    targetStage: 2,
    commitId: 'COMMIT-SG0-UNLOCK-001',
    authorityRef: 'policy.governance.v2',
    track: STAGE_TRACKS.GSG,
    stageState
  });
  stageState = applied.stageState;
  log(`[GOV] stage-unlock proposalId=${recommendation.proposalId} voteResult=${recommendation.voteResult} commitRequired=true commitId=COMMIT-SG0-UNLOCK-001`);

  const postCommitUnlock = canExecute('commitPosting', 'zone.avgol.ops', 'user.alex', 'policy.governance.v2', stageState);
  log(`[SG0] gsg-postcommit result=${postCommitUnlock.ok ? 'PASS' : 'REFUSAL'} stage=${postCommitUnlock.currentStage} required=${postCommitUnlock.requiredStage}`);

  const pass =
    isgPreview.ok &&
    isgSim.ok &&
    !preUnlockCommit.ok &&
    !postVoteNoCommit.ok &&
    applied.ok &&
    postCommitUnlock.ok;

  log(`[SG0] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
  await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
  log(`[SG0] log=archive/proofs/${path.basename(LOG_FILE)}`);

  if (!pass) process.exitCode = 2;
}

main().catch(async (err) => {
  const fatal = `[SG0] fatal=${err?.stack || err}`;
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

