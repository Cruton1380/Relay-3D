import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-12';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `globe-restore-3-proof-console-${DATE_TAG}.log`);
const SHOT_FILE = path.join(PROOFS_DIR, `globe-restore-3-proof-${DATE_TAG}.png`);
const WORLD_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=world';
const PROOF_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=proof';

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
    const load = await window.loadRestore3GeoFixture?.();
    const state0 = window.relayScopeGetState?.();
    const countries = window.relayScopeListCountries?.() || [];
    const regions = window.relayScopeListRegions?.() || [];
    const sites = window.relayScopeListSites?.() || [];

    const targetRef = { type: 'branch', id: 'branch.operations' };
    const proposed = window.relaySetWorkMode?.('PROPOSE', {
      targetRef,
      summary: 'Restore-3 proof proposal',
      changesetRef: 'R3-FIXTURE-001',
      allowDirectPropose: true,
      forceSnapshot: true
    });
    const work = window.relayGetWorkMode?.() || {};
    const proposalId = String(work.currentProposalId || '');
    const evidenceHash = String(work.currentProposalEvidenceHash || '');

    const il = await window.relayScopeSelectCountry?.('IL');
    await wait(250);
    const us = await window.relayScopeSelectCountry?.('US');
    await wait(250);
    const usRegion = await window.relayScopeSelectRegion?.('US-WEST');
    await wait(250);
    const usSite = await window.relayScopeSelectSite?.('SITE_B');
    await wait(250);

    const commitBlocked = window.relaySetWorkMode?.('COMMIT', {
      targetRef,
      proposalId,
      evidenceHash
    });

    const backToIl = await window.relayScopeSelectCountry?.('IL');
    await wait(250);
    const ilRegion = await window.relayScopeSelectRegion?.('IL-CENTRAL');
    await wait(250);
    const ilSite = await window.relayScopeSelectSite?.('SITE_A');
    await wait(250);

    const commitAllowed = window.relaySetWorkMode?.('COMMIT', {
      targetRef,
      proposalId,
      evidenceHash
    });

    const finalState = window.relayScopeGetState?.();
    return {
      load,
      state0,
      countries,
      regions,
      sites,
      proposed,
      proposalId,
      evidenceHash,
      il,
      us,
      usRegion,
      usSite,
      commitBlocked,
      backToIl,
      ilRegion,
      ilSite,
      commitAllowed,
      finalState
    };
  });
}

async function runProofIsolationScenario(page) {
  return page.evaluate(async () => {
    const load = await window.loadRestore3GeoFixture?.();
    const selectCountry = await window.relayScopeSelectCountry?.('IL');
    return { load, selectCountry };
  });
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let devServer = null;
  let browser = null;
  try {
    devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], WORLD_URL);
    browser = await chromium.launch({ headless: true });
    const worldPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await worldPage.route(/\.(woff2?|ttf|otf)(\?.*)?$/i, (route) => route.abort());
    const worldLogs = [];
    const worldRefusals = [];
    const worldErrors = [];

    worldPage.on('console', (msg) => {
      const t = msg.text();
      if (t.includes('[GLOBE] scope-overlay')
        || t.includes('[GOV] scope-visualization')
        || t.includes('[GLOBE-RESTORE-3]')) {
        worldLogs.push(t);
      }
      if (t.includes('[REFUSAL] reason=GOV_SCOPE_VIOLATION')) {
        worldRefusals.push(t);
      }
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
        && typeof window.loadRestore3GeoFixture === 'function'
        && typeof window.relayScopeSelectCountry === 'function',
      undefined,
      { timeout: 120000 }
    );

    const world = await runWorldScenario(worldPage);
    const fixturePass = world.load?.ok === true
      && world.state0?.ok === true
      && Array.isArray(world.countries) && world.countries.length === 2
      && Array.isArray(world.regions) && world.regions.length === 3
      && Array.isArray(world.sites) && world.sites.length === 2;
    const selectionPass = world.il?.ok === true
      && world.us?.ok === true
      && world.usRegion?.ok === true
      && world.usSite?.ok === true
      && world.backToIl?.ok === true
      && world.ilRegion?.ok === true
      && world.ilSite?.ok === true;
    const scopeEval = world.finalState?.state?.eval || null;
    const evalPass = !!scopeEval
      && Array.isArray(scopeEval.inScopeBranches)
      && scopeEval.inScopeBranches.includes('branch.operations')
      && Array.isArray(scopeEval.inScopeProposals)
      && scopeEval.inScopeProposals.length >= 1;
    const refusalPass = world.commitBlocked === false && worldRefusals.length >= 1;
    const allowedPass = world.commitAllowed === true;
    const logsPass = worldLogs.length >= 3;
    const crashFree = worldErrors.length === 0;

    log(`[GLOBE-RESTORE-3] fixture-shape result=${fixturePass ? 'PASS' : 'FAIL'} countries=${world.countries?.length || 0} regions=${world.regions?.length || 0} sites=${world.sites?.length || 0}`);
    log(`[GLOBE-RESTORE-3] scope-selection result=${selectionPass ? 'PASS' : 'FAIL'}`);
    log(`[GLOBE-RESTORE-3] scope-eval result=${evalPass ? 'PASS' : 'FAIL'} inScopeBranches=${scopeEval?.inScopeBranches?.length || 0} inScopeProposals=${scopeEval?.inScopeProposals?.length || 0}`);
    log(`[GLOBE-RESTORE-3] refusal-rail result=${refusalPass ? 'PASS' : 'FAIL'} refusals=${worldRefusals.length}`);
    log(`[GLOBE-RESTORE-3] commit-in-scope result=${allowedPass ? 'PASS' : 'FAIL'}`);
    log(`[GLOBE-RESTORE-3] world-logs result=${logsPass ? 'PASS' : 'FAIL'} count=${worldLogs.length}`);
    log(`[GLOBE-RESTORE-3] world-crash-free result=${crashFree ? 'PASS' : 'FAIL'} errors=${worldErrors.length}`);

    await worldPage.screenshot({ path: SHOT_FILE, fullPage: false, timeout: 120000 });

    const proofPage = await browser.newPage({ viewport: { width: 1200, height: 760 } });
    await proofPage.goto(PROOF_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await proofPage.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'proof'
        && typeof window.loadRestore3GeoFixture === 'function'
        && typeof window.relayScopeSelectCountry === 'function',
      undefined,
      { timeout: 120000 }
    );
    const proof = await runProofIsolationScenario(proofPage);
    const proofIsolation = proof.load?.reason === 'PROFILE_LOCKED_PROOF'
      && proof.selectCountry?.reason === 'PROFILE_LOCKED_PROOF';
    log(`[GLOBE-RESTORE-3] proof-isolation result=${proofIsolation ? 'PASS' : 'FAIL'} load=${proof.load?.reason || 'none'} select=${proof.selectCountry?.reason || 'none'}`);

    const pass = fixturePass
      && selectionPass
      && evalPass
      && refusalPass
      && allowedPass
      && logsPass
      && crashFree
      && proofIsolation;
    log(`[GLOBE-RESTORE-3] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=GLOBE_RESTORE_3_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

await main();
