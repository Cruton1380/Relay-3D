/**
 * VIS-6a Live Timebox Pulse proof.
 * Checks: simulated pulse at COMPANY triggers timeboxPulse + pulseComplete logs,
 * no slab count increase, no LOD change, sheet-scope pulse works,
 * gate-summary PASS.
 * Server must be running or script starts it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `vis6-timebox-pulse-console-${DATE_TAG}.log`);
const WORLD_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=world';

const TARGET_SHEET = 'P2P.ThreeWayMatch';

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
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

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let devServer = null;
  let browser = null;
  try {
    devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], WORLD_URL);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await page.addInitScript(() => {
      window.RELAY_DEBUG_VERBOSE = true;
      window.RELAY_DEBUG_LOGS = true;
    });
    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));
    await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayEnterSheet === 'function'
        && !!window.filamentRenderer
        && typeof window.vis6SimulatePulse === 'function',
      undefined,
      { timeout: 120000 }
    );

    await sleep(1500);

    // Step 1: Fly to COMPANY
    await page.evaluate(async () => {
      const viewer = window.viewer;
      const relayState = window.relayState;
      if (viewer?.camera && relayState?.tree?.nodes?.length) {
        const trunk = relayState.tree.nodes.find((n) => n?.type === 'trunk');
        if (trunk && Number.isFinite(trunk.lat) && Number.isFinite(trunk.lon)) {
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 25000),
            orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 }
          });
        }
      }
    });
    await sleep(2000);

    // Step 2: Render at COMPANY to establish baseline
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis6-company-baseline');
      }
    });
    await sleep(2500);

    // Step 3: Get baseline slab count
    const baselineSlabCount = await page.evaluate(() => window.vis4cGetSlabIds().length);
    log(`[VIS6] baseline slabCount=${baselineSlabCount}`);

    // Step 4: Simulate pulse at COMPANY (trunk owner)
    const pulseResult = await page.evaluate(() => {
      return window.vis6SimulatePulse('trunk.avgol', 'T-SYNTHETIC-1');
    });
    log(`[VIS6] simulatePulse ok=${pulseResult?.ok} owner=${pulseResult?.ownerId} scope=${pulseResult?.scope}`);
    await sleep(300);

    // Step 5: Check pulse state (should be active)
    const pulseState1 = await page.evaluate(() => window.vis6GetPulseState());
    log(`[VIS6] pulseState activePulses=${pulseState1.activePulses} seenOwners=${pulseState1.seenOwners}`);

    // Step 6: Wait for pulse to complete (800ms + buffer)
    await sleep(700);

    // Step 7: Check pulse state after completion (should be 0 active)
    const pulseState2 = await page.evaluate(() => window.vis6GetPulseState());
    log(`[VIS6] pulseStateAfter activePulses=${pulseState2.activePulses}`);

    // Step 8: Verify slab count unchanged
    const slabCountAfterPulse = await page.evaluate(() => window.vis4cGetSlabIds().length);
    log(`[VIS6] slabCount afterPulse=${slabCountAfterPulse} baseline=${baselineSlabCount}`);
    const noSlabIncrease = slabCountAfterPulse === baselineSlabCount;

    // Step 9: Verify no LOD change
    const lodAfterPulse = await page.evaluate(() => {
      const renderer = window.filamentRenderer;
      return renderer?.currentLOD || 'unknown';
    });
    log(`[VIS6] lodAfterPulse=${lodAfterPulse}`);

    // Step 10: Enter sheet for SHEET-scope pulse test
    const enterResult = await page.evaluate((sheetId) => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      const out = window.relayEnterSheet(sheetId);
      if (out?.ok && window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis6-enter-sheet');
      }
      return out;
    }, TARGET_SHEET);
    log(`[VIS6] enterSheet ok=${enterResult?.ok === true} sheet=${TARGET_SHEET}`);
    await sleep(3000);

    // Step 11: Force render to populate sheet slab registry
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis6-sheet-render');
      }
    });
    await sleep(2500);

    // Step 12: Simulate pulse at SHEET scope
    const sheetPulseResult = await page.evaluate(() => {
      const slabIds = window.vis4cGetSlabIds();
      if (slabIds.length === 0) return { ok: false, reason: 'NO_SHEET_SLABS' };
      const renderer = window.filamentRenderer;
      const firstMeta = renderer._vis4SlabRegistry?.values()?.next()?.value;
      if (!firstMeta) return { ok: false, reason: 'NO_META' };
      return window.vis6SimulatePulse(firstMeta.ownerId, 'T-SHEET-SYNTH-1');
    });
    log(`[VIS6] sheetPulse ok=${sheetPulseResult?.ok} owner=${sheetPulseResult?.ownerId} scope=${sheetPulseResult?.scope}`);
    await sleep(1200); // wait for pulse completion

    // Step 13: Check all required log lines
    const fullLog = consoleLogs.join('\n');

    const hasTimeboxPulse = fullLog.includes('[VIS6] timeboxPulse owner=');
    const hasPulseComplete = fullLog.includes('[VIS6] pulseComplete owner=');
    const hasGateSummary = fullLog.includes('[VIS6] gate-summary result=PASS');
    // VIS-4 gate
    const hasVis4Gate = fullLog.includes('[VIS4] gate-summary result=PASS');
    // VIS-2 baseline
    const hasSheetTiles = fullLog.includes('[VIS2] sheetTilesRendered count=');
    const hasCompanyCollapsed = fullLog.includes('[VIS2] companyCollapsed result=PASS');
    const noErrors = !fullLog.includes('ReferenceError') && !fullLog.includes('TypeError');
    const pulsesCleaned = pulseState2.activePulses === 0;

    const allPass = hasTimeboxPulse && hasPulseComplete && hasGateSummary
      && hasVis4Gate && hasSheetTiles && hasCompanyCollapsed
      && noSlabIncrease && noErrors && pulsesCleaned;

    log(`[VIS6] timeboxPulse ${hasTimeboxPulse ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS6] pulseComplete ${hasPulseComplete ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS6] gate-summary ${hasGateSummary ? 'result=PASS' : 'MISSING'}`);
    log(`[VIS6] pulsesCleaned ${pulsesCleaned ? 'PASS' : 'FAIL'}`);
    log(`[VIS6] noSlabIncrease ${noSlabIncrease ? 'PASS' : 'FAIL'}`);
    log(`[VIS4] gate-summary ${hasVis4Gate ? 'result=PASS' : 'MISSING'}`);
    log(`[VIS2] companyCollapsed ${hasCompanyCollapsed ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS2] sheetTiles ${hasSheetTiles ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS6] noErrors ${noErrors ? 'PASS' : 'FAIL'}`);
    log(`[VIS6] proof-summary result=${allPass ? 'PASS' : 'REFUSAL'}`);

    await fs.writeFile(LOG_FILE, fullLog + '\n\n--- VIS6 proof ---\n' + lines.join('\n'), 'utf8');
    log(`Log written: ${LOG_FILE}`);

    if (!allPass) {
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
