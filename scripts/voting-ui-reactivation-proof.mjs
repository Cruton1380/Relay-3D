import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-13';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `voting-ui-reactivation-console-${DATE_TAG}.log`);
const WORLD_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=world';

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForUrl(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch {
      // retry
    }
    await sleep(500);
  }
  return false;
}

async function startServerIfNeeded(commandArgs, readyUrl) {
  const ready = await waitForUrl(readyUrl, 2500);
  if (ready) return { child: null, started: false };
  const child = spawn(process.execPath, commandArgs, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env }
  });
  const becameReady = await waitForUrl(readyUrl, 60000);
  if (!becameReady) {
    child.kill('SIGINT');
    throw new Error(`SERVER_NOT_READY ${readyUrl}`);
  }
  return { child, started: true };
}

async function stopServer(handle) {
  if (!handle?.started || !handle?.child || handle.child.killed) return;
  const child = handle.child;
  child.kill('SIGINT');
  await Promise.race([
    new Promise((resolve) => child.once('close', resolve)),
    sleep(3000).then(() => { if (!child.killed) child.kill('SIGKILL'); })
  ]);
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let devServer = null;
  let browser = null;
  try {
    devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], WORLD_URL);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));

    await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => (
      typeof window.relayVoteUiSeedTopics === 'function' &&
      typeof window.relayVoteUiStartTopic === 'function' &&
      typeof window.relayVoteUiCast === 'function' &&
      typeof window.relayVoteUiCloseGovernance === 'function'
    ), undefined, { timeout: 120000 });

    const execution = await page.evaluate(() => {
      const voters = [
        { id: 'user.manager1', scope: 'zone.avgol.ops', role: 'manager', authorityRef: 'policy.governance.v2' },
        { id: 'user.steward1', scope: 'zone.avgol.ops', role: 'steward', authorityRef: 'policy.governance.v2' },
        { id: 'user.finance1', scope: 'zone.avgol.ops', role: 'finance', authorityRef: 'policy.governance.v2' }
      ];

      const topics = [
        {
          id: 'topic.presentation.hud',
          title: 'HUD Param Layout Vote',
          type: 'presentation',
          policyRef: 'local:HUD-PARAMS-v0',
          scope: 'zone.avgol.ops',
          cadence: 'event',
          state: 'DRAFT'
        },
        {
          id: 'topic.gov.boundary',
          title: 'Boundary Approval Vote',
          type: 'governance',
          scope: 'zone.avgol.ops',
          cadence: 'weekly',
          requiredRoles: ['manager', 'steward', 'finance'],
          authorityRefs: ['policy.governance.v2'],
          state: 'DRAFT'
        },
        {
          id: 'topic.gov.stageLocked',
          title: 'Stage Locked Probe',
          type: 'governance',
          scope: 'zone.avgol.ops',
          cadence: 'weekly',
          requiredRoles: ['manager'],
          authorityRefs: ['policy.governance.v2'],
          state: 'DRAFT'
        }
      ];

      const seed = window.relayVoteUiSeedTopics(topics);
      if (!seed?.ok) return { ok: false, reason: 'SEED_FAILED', seed };

      // 1) Presentation voting
      window.relayVoteUiSelectTopic('topic.presentation.hud');
      const startPresentation = window.relayVoteUiStartTopic('topic.presentation.hud', { voters, frozenAt: '2026-02-13T10:00:00.000Z' });
      const castPresentation = window.relayVoteUiCast({
        topicId: 'topic.presentation.hud',
        voterId: 'user.manager1',
        decision: 'APPROVE',
        role: 'manager',
        authorityRef: 'policy.governance.v2',
        scope: 'zone.avgol.ops'
      });
      const laneAfterPresentation = window.relayVoteUiGetLane();
      const presentationRow = laneAfterPresentation.find((x) => x.id === 'topic.presentation.hud');
      const presentationPass = !!(startPresentation?.ok && castPresentation?.ok && Number(presentationRow?.supportPct || 0) > 0);

      // 2) Governance lifecycle vote
      window.relayVoteUiSelectTopic('topic.gov.boundary');
      const startGovernance = window.relayVoteUiStartTopic('topic.gov.boundary', { voters, frozenAt: '2026-02-13T10:01:00.000Z' });
      const panelFrozen = window.relayVoteUiGetPanelState();
      const snapshotIdBefore = panelFrozen?.eligibility?.snapshotId || null;
      // 4) Eligibility snapshot frozen + invalid vote no mutation (while ACTIVE)
      const invalidBefore = (window.relayVoteUiGetRawState()?.ballots || []).length;
      const invalidVote = window.relayVoteUiCast({
        topicId: 'topic.gov.boundary',
        voterId: 'user.not.eligible',
        decision: 'APPROVE',
        role: 'manager',
        authorityRef: 'policy.governance.v2',
        scope: 'zone.avgol.ops'
      });
      const invalidAfter = (window.relayVoteUiGetRawState()?.ballots || []).length;
      const panelAfterInvalid = window.relayVoteUiGetPanelState();
      const snapshotIdAfter = panelAfterInvalid?.eligibility?.snapshotId || null;
      const eligibilityFreezePass = !!(snapshotIdBefore && snapshotIdBefore === snapshotIdAfter && invalidVote?.ok === false && invalidVote?.reason === 'VOTE_ELIGIBILITY_MISMATCH');
      const invalidNoMutationPass = invalidBefore === invalidAfter;

      const castGovA = window.relayVoteUiCast({
        topicId: 'topic.gov.boundary',
        voterId: 'user.manager1',
        decision: 'APPROVE',
        role: 'manager',
        authorityRef: 'policy.governance.v2',
        scope: 'zone.avgol.ops'
      });
      const castGovB = window.relayVoteUiCast({
        topicId: 'topic.gov.boundary',
        voterId: 'user.steward1',
        decision: 'APPROVE',
        role: 'steward',
        authorityRef: 'policy.governance.v2',
        scope: 'zone.avgol.ops'
      });
      const closeGov = window.relayVoteUiCloseGovernance('topic.gov.boundary', { commitId: 'commit.vote-a2.001' });
      const governancePass = !!(startGovernance?.ok && castGovA?.ok && castGovB?.ok && closeGov?.ok && ['PASS', 'REFUSAL', 'VETO'].includes(String(closeGov?.state || '')));

      // 3) Stage lock refusal
      const ballotsBeforeStageRefusal = (window.relayVoteUiGetRawState()?.ballots || []).length;
      const stageRefusal = window.relayVoteUiCast({
        topicId: 'topic.gov.stageLocked',
        voterId: 'user.manager1',
        decision: 'APPROVE'
      });
      const ballotsAfterStageRefusal = (window.relayVoteUiGetRawState()?.ballots || []).length;
      const stageRefusalPass = stageRefusal?.ok === false && stageRefusal?.reason === 'STAGE_LOCKED' && ballotsAfterStageRefusal === ballotsBeforeStageRefusal;

      // 5) Determinism two runs with fixed timestamps
      const runScenario = () => {
        window.relayVoteUiSeedTopics(topics);
        window.relayVoteUiStartTopic('topic.presentation.hud', { voters, frozenAt: '2026-02-13T11:00:00.000Z' });
        window.relayVoteUiCast({ topicId: 'topic.presentation.hud', voterId: 'user.manager1', decision: 'APPROVE', role: 'manager' });
        window.relayVoteUiStartTopic('topic.gov.boundary', { voters, frozenAt: '2026-02-13T11:01:00.000Z' });
        window.relayVoteUiCast({ topicId: 'topic.gov.boundary', voterId: 'user.manager1', decision: 'APPROVE', role: 'manager' });
        window.relayVoteUiCast({ topicId: 'topic.gov.boundary', voterId: 'user.steward1', decision: 'APPROVE', role: 'steward' });
        window.relayVoteUiCloseGovernance('topic.gov.boundary', { commitId: 'commit.vote-a2.det' });
        return window.relayVoteUiDeterminismDigest();
      };
      const digestA = runScenario();
      const digestB = runScenario();
      const determinismPass = digestA === digestB;

      return {
        ok: true,
        presentationPass,
        governancePass,
        stageRefusalPass,
        eligibilityFreezePass,
        invalidNoMutationPass,
        determinismPass,
        digestA,
        digestB
      };
    });

    if (!execution?.ok) {
      log(`[REFUSAL] reason=VOTE_A2_EXECUTION_FAILED detail=${JSON.stringify(execution || {})}`);
      await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
      process.exitCode = 2;
      return;
    }

    const hasPresentationLog = consoleLogs.some((x) => x.includes('[VOTE] type=presentation'));
    const hasGovernanceLog = consoleLogs.some((x) => x.includes('[VOTE] type=governance scope='));
    const hasEligibilityLog = consoleLogs.some((x) => x.includes('[VOTE] eligibilitySnapshot id='));
    const hasLifecycleLog = consoleLogs.some((x) => x.includes('[VOTE] lifecycleTransition state=ACTIVE'));
    const hasStageLockRefusal = consoleLogs.some((x) => x.includes('[REFUSAL] stageLocked'));

    log(`[VOTE-A2] presentation result=${execution.presentationPass && hasPresentationLog ? 'PASS' : 'FAIL'}`);
    log(`[VOTE-A2] governance result=${execution.governancePass && hasGovernanceLog ? 'PASS' : 'FAIL'}`);
    log(`[VOTE-A2] stage-refusal result=${execution.stageRefusalPass && hasStageLockRefusal ? 'PASS' : 'FAIL'}`);
    log(`[VOTE-A2] eligibility-freeze result=${execution.eligibilityFreezePass && hasEligibilityLog && execution.invalidNoMutationPass ? 'PASS' : 'FAIL'}`);
    log(`[VOTE-A2] determinism result=${execution.determinismPass ? 'PASS' : 'FAIL'} hashA=${execution.digestA || 'none'} hashB=${execution.digestB || 'none'}`);

    const gate = execution.presentationPass &&
      execution.governancePass &&
      execution.stageRefusalPass &&
      execution.eligibilityFreezePass &&
      execution.invalidNoMutationPass &&
      execution.determinismPass &&
      hasPresentationLog &&
      hasGovernanceLog &&
      hasEligibilityLog &&
      hasLifecycleLog &&
      hasStageLockRefusal;

    log(`[VOTE-A2] gate-summary result=${gate ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!gate) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=VOTE_A2_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

await main();

