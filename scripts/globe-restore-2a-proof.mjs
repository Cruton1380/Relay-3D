import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-12';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `globe-restore-2a-proof-console-${DATE_TAG}.log`);
const SHOT_FILE = path.join(PROOFS_DIR, `globe-restore-2a-proof-${DATE_TAG}.png`);
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

async function startServerIfNeeded(commandArgs, readyUrl, env = {}) {
  const ready = await waitForUrl(readyUrl, 2500);
  if (ready) return { child: null, started: false };

  const child = spawn(process.execPath, commandArgs, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env, ...env }
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
    const levels = window.relayGlobeListClusterLevels?.() || [];
    const regions = window.relayGlobeListRegions?.() || [];

    const setGlobe = await window.relayGlobeSetClusterLevel?.('globe');
    await wait(250);
    const setRegion = await window.relayGlobeSetClusterLevel?.('region');
    await wait(250);
    const focusNextRegion = await window.relayGlobeFocusNextRegion?.();
    await wait(250);
    const regionCountries = window.relayGlobeListFocusRegionCountries?.() || [];
    const setCountry = await window.relayGlobeSetClusterLevel?.('country');
    await wait(250);
    const loadGlobalCore = await window.relayGlobeLoadCountrySet?.('global-core');
    await wait(250);

    const invokeCluster = await window.relayInvokeAction?.('cycleClusterLevel', { uiSource: 'proof' });
    const invokeRegion = await window.relayInvokeAction?.('focusNextRegion', { uiSource: 'proof' });
    const invokeSet = await window.relayInvokeAction?.('loadGlobalCore', { uiSource: 'proof' });
    await wait(250);

    const state = window.relayGlobeGetState?.();
    return {
      levels,
      regions,
      setGlobe,
      setRegion,
      focusNextRegion,
      regionCountries,
      setCountry,
      loadGlobalCore,
      invokeCluster,
      invokeRegion,
      invokeSet,
      state
    };
  });
}

async function runProofScenario(page) {
  return page.evaluate(async () => {
    const level = await window.relayGlobeSetClusterLevel?.('globe');
    const region = await window.relayGlobeSetFocusRegion?.('europe');
    const set = await window.relayGlobeLoadCountrySet?.('global-core');
    return { level, region, set };
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
    const worldErrors = [];

    worldPage.on('console', (msg) => {
      const t = msg.text();
      if (t.includes('[GLOBE] hierarchy init')
        || t.includes('[GLOBE] cluster level=')
        || t.includes('[GLOBE] focus region=')
        || t.includes('[GLOBE] country-set id=')) {
        worldLogs.push(t);
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
        && typeof window.relayGlobeSetClusterLevel === 'function'
        && typeof window.relayGlobeFocusNextRegion === 'function',
      undefined,
      { timeout: 120000 }
    );

    const world = await runWorldScenario(worldPage);
    const levelPass = Array.isArray(world.levels)
      && world.levels.map((x) => x.id).join(',') === 'gps,city,state,country,region,globe';
    const regionPass = Array.isArray(world.regions) && world.regions.length >= 6;
    const setPass = world.setGlobe?.ok === true
      && world.setRegion?.ok === true
      && world.setCountry?.ok === true
      && world.loadGlobalCore?.ok === true;
    const focusPass = world.focusNextRegion?.ok === true
      && Array.isArray(world.regionCountries)
      && world.regionCountries.length > 0;
    const budPass = world.invokeCluster?.ok === true
      && world.invokeRegion?.ok === true
      && world.invokeSet?.ok === true;
    const statePass = world.state?.ok === true
      && world.state?.state?.clusterLevel
      && Array.isArray(world.state?.state?.loadedCountries)
      && world.state.state.loadedCountries.length >= 20;
    const worldLogPass = worldLogs.length >= 4;
    const worldCrashFree = worldErrors.length === 0;

    log(`[GLOBE-RESTORE-2A] cluster-levels result=${levelPass ? 'PASS' : 'FAIL'} ids=${world.levels?.map((x) => x.id).join('|') || 'none'}`);
    log(`[GLOBE-RESTORE-2A] regions-catalog result=${regionPass ? 'PASS' : 'FAIL'} count=${world.regions?.length || 0}`);
    log(`[GLOBE-RESTORE-2A] cluster-transitions result=${setPass ? 'PASS' : 'FAIL'}`);
    log(`[GLOBE-RESTORE-2A] region-focus result=${focusPass ? 'PASS' : 'FAIL'} countries=${world.regionCountries?.length || 0}`);
    log(`[GLOBE-RESTORE-2A] buds-dispatch result=${budPass ? 'PASS' : 'FAIL'}`);
    log(`[GLOBE-RESTORE-2A] hierarchy-state result=${statePass ? 'PASS' : 'FAIL'} loaded=${world.state?.state?.loadedCountries?.length || 0}`);
    log(`[GLOBE-RESTORE-2A] world-logs result=${worldLogPass ? 'PASS' : 'FAIL'} count=${worldLogs.length}`);
    log(`[GLOBE-RESTORE-2A] world-crash-free result=${worldCrashFree ? 'PASS' : 'FAIL'} errors=${worldErrors.length}`);
    await worldPage.screenshot({ path: SHOT_FILE, fullPage: false, timeout: 120000 });

    const proofPage = await browser.newPage();
    await proofPage.goto(PROOF_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await proofPage.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'proof'
        && typeof window.relayGlobeSetClusterLevel === 'function',
      undefined,
      { timeout: 120000 }
    );

    const proof = await runProofScenario(proofPage);
    const proofIsolation = proof.level?.reason === 'PROFILE_LOCKED_PROOF'
      && proof.region?.reason === 'PROFILE_LOCKED_PROOF'
      && proof.set?.reason === 'PROFILE_LOCKED_PROOF';
    log(`[GLOBE-RESTORE-2A] proof-isolation result=${proofIsolation ? 'PASS' : 'FAIL'} cluster=${proof.level?.reason || 'none'} region=${proof.region?.reason || 'none'} set=${proof.set?.reason || 'none'}`);

    const pass = levelPass
      && regionPass
      && setPass
      && focusPass
      && budPass
      && statePass
      && worldLogPass
      && worldCrashFree
      && proofIsolation;
    log(`[GLOBE-RESTORE-2A] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=GLOBE_RESTORE_2A_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

await main();
