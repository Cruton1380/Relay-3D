import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-13';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `globe-restore-4-proof-console-${DATE_TAG}.log`);
const SHOT_FILE = path.join(PROOFS_DIR, `globe-restore-4-proof-${DATE_TAG}.png`);
const WORLD_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=world';
const PROOF_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=proof';
const GLOBE_SERVICES_URL = 'http://127.0.0.1:4020/api/globe/weather/status';

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
    sleep(3000).then(() => {
      if (!child.killed) child.kill('SIGKILL');
    })
  ]);
}

async function runWorldScenario(page) {
  return page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const fixture3 = await window.loadRestore3GeoFixture?.();
    const fixture4 = await window.loadRestore4AssignmentFixture?.();
    const sites = window.relayScopeListSites?.() || [];
    const siteA = sites.find((s) => String(s.id || '').toUpperCase() === 'SITE_A') || sites[0] || null;
    const siteB = sites.find((s) => String(s.id || '').toUpperCase() === 'SITE_B') || sites[1] || sites[0] || null;
    const selIl = await window.relayScopeSelectCountry?.('IL');
    await wait(250);
    const scopeState = window.relayScopeGetState?.();
    const inScope = Array.isArray(scopeState?.state?.eval?.inScopeBranches)
      ? scopeState.state.eval.inScopeBranches.map(String).sort()
      : [];
    const branchA = inScope[0] || null;
    const branchB = inScope[1] || inScope[0] || null;

    let propA = null;
    let comA = null;
    let propB = null;
    let comB = null;
    if (branchA && siteA) {
      propA = window.relayAssignBranchToSitePropose?.(branchA, siteA.id || siteA.siteId);
      await wait(200);
      comA = window.relayAssignBranchToSiteCommit?.(branchA, siteA.id || siteA.siteId, {
        proposalId: propA?.proposalId,
        evidenceHash: propA?.evidenceHash
      });
      await wait(200);
    }
    if (branchB && siteB) {
      propB = window.relayAssignBranchToSitePropose?.(branchB, siteB.id || siteB.siteId);
      await wait(200);
      comB = window.relayAssignBranchToSiteCommit?.(branchB, siteB.id || siteB.siteId, {
        proposalId: propB?.proposalId,
        evidenceHash: propB?.evidenceHash
      });
      await wait(200);
    }

    const inspectorIl = window.relayScopeInspectorRefresh?.();
    const selUs = await window.relayScopeSelectCountry?.('US');
    await wait(250);
    const crossProp = branchA
      ? window.relayAssignBranchToSitePropose?.(branchA, siteA?.id || siteA?.siteId || '')
      : null;
    await wait(200);
    const crossCommit = branchA
      ? window.relayAssignBranchToSiteCommit?.(branchA, siteA?.id || siteA?.siteId || '', {
        proposalId: crossProp?.proposalId,
        evidenceHash: crossProp?.evidenceHash
      })
      : null;
    await wait(250);
    const inspectorUs = window.relayScopeInspectorRefresh?.();
    const assignments = window.relayGetAssignmentState?.();

    return {
      fixture3,
      fixture4,
      selIl,
      selUs,
      branchA,
      branchB,
      siteA,
      siteB,
      propA,
      comA,
      propB,
      comB,
      inspectorIl,
      inspectorUs,
      crossProp,
      crossCommit,
      assignments
    };
  });
}

async function runProofIsolationScenario(page) {
  return page.evaluate(async () => {
    const fixture = await window.loadRestore4AssignmentFixture?.();
    const state = window.relayGetAssignmentState?.();
    const propose = window.relayAssignBranchToSitePropose?.('branch.operations', 'SITE_A');
    return { fixture, state, propose };
  });
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let devServer = null;
  let globeServices = null;
  let browser = null;
  try {
    devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], WORLD_URL);
    globeServices = await startServerIfNeeded(['scripts/globe-services-server.mjs'], GLOBE_SERVICES_URL);

    browser = await chromium.launch({ headless: true });
    const worldPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await worldPage.route(/\.(woff2?|ttf|otf)(\?.*)?$/i, (route) => route.abort());
    const assignmentLogs = [];
    const inspectorLogs = [];
    const refusalLogs = [];
    const worldErrors = [];

    worldPage.on('console', (msg) => {
      const t = msg.text();
      if (t.includes('[GLOBE] assignment')) assignmentLogs.push(t);
      if (t.includes('[GLOBE] scope-inspector')) inspectorLogs.push(t);
      if (t.includes('[REFUSAL] reason=GOV_SCOPE_VIOLATION')) refusalLogs.push(t);
      const lower = t.toLowerCase();
      if (lower.includes('uncaught') || lower.includes('syntaxerror') || lower.includes('referenceerror')) {
        worldErrors.push(t);
      }
    });
    worldPage.on('pageerror', (err) => worldErrors.push(String(err?.message || err)));

    await worldPage.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await worldPage.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'world'
        && typeof window.loadRestore4AssignmentFixture === 'function'
        && typeof window.relayAssignBranchToSitePropose === 'function',
      undefined,
      { timeout: 120000 }
    );

    const world = await runWorldScenario(worldPage);
    const fixturePass = world.fixture3?.ok === true && world.fixture4?.ok === true;
    const assignmentPass = world.propA?.ok === true
      && world.comA?.ok === true
      && world.propB?.ok === true
      && world.comB?.ok === true;
    const inspectorPass = world.inspectorIl?.ok === true
      && world.inspectorUs?.ok === true
      && (world.inspectorUs?.state?.outOfScopeBranches?.length || 0) >= 1;
    const refusalPass = world.crossCommit?.ok === false && refusalLogs.length >= 1;
    const logsPass = assignmentLogs.length >= 4 && inspectorLogs.length >= 2;
    const crashFree = worldErrors.length === 0;

    log(`[GLOBE-RESTORE-4] fixture-load result=${fixturePass ? 'PASS' : 'FAIL'}`);
    log(`[GLOBE-RESTORE-4] assignment-commit result=${assignmentPass ? 'PASS' : 'FAIL'} branchA=${world.branchA || 'none'} branchB=${world.branchB || 'none'}`);
    log(`[GLOBE-RESTORE-4] scope-inspector result=${inspectorPass ? 'PASS' : 'FAIL'} outScope=${world.inspectorUs?.state?.outOfScopeBranches?.length || 0}`);
    log(`[GLOBE-RESTORE-4] scope-refusal result=${refusalPass ? 'PASS' : 'FAIL'} refusalCount=${refusalLogs.length}`);
    log(`[GLOBE-RESTORE-4] required-logs result=${logsPass ? 'PASS' : 'FAIL'} assignmentLogs=${assignmentLogs.length} inspectorLogs=${inspectorLogs.length}`);
    log(`[GLOBE-RESTORE-4] world-crash-free result=${crashFree ? 'PASS' : 'FAIL'} errors=${worldErrors.length}`);

    await worldPage.screenshot({ path: SHOT_FILE, fullPage: false, timeout: 120000 });

    const proofPage = await browser.newPage({ viewport: { width: 1200, height: 760 } });
    await proofPage.goto(PROOF_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await proofPage.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'proof'
        && typeof window.loadRestore4AssignmentFixture === 'function',
      undefined,
      { timeout: 120000 }
    );
    const proof = await runProofIsolationScenario(proofPage);
    const proofIsolation = proof.fixture?.reason === 'PROFILE_LOCKED_PROOF'
      && proof.state?.reason === 'PROFILE_LOCKED_PROOF'
      && proof.propose?.reason === 'PROFILE_LOCKED_PROOF';
    log(`[GLOBE-RESTORE-4] proof-isolation result=${proofIsolation ? 'PASS' : 'FAIL'} fixture=${proof.fixture?.reason || 'none'} state=${proof.state?.reason || 'none'} propose=${proof.propose?.reason || 'none'}`);

    const pass = fixturePass && assignmentPass && inspectorPass && refusalPass && logsPass && crashFree && proofIsolation;
    log(`[GLOBE-RESTORE-4] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=RESTORE_SCOPE_VIOLATION blocker=RESTORE-4-BLOCKER:PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (globeServices) await stopServer(globeServices);
    if (devServer) await stopServer(devServer);
  }
}

await main();
