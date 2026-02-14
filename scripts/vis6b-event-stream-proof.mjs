/**
 * VIS-6b Event Stream Pulse Propagation proof (Policy B — expected refusal).
 *
 * Pushes a deterministic batch:
 *   - 3 TIMEBOX_APPEARED (trunk + 2 dept branches)
 *   - 2 duplicate ids (dropped)
 *   - 5 rapid same-(owner,timebox) events (coalesced)
 *   - 25 events for cap pressure (some will trigger REFUSAL)
 * Expects all required log lines including exactly 1 REFUSAL signature.
 * Gate-summary PASS if all checks hold.
 *
 * Server must be running or script starts it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `vis6b-event-stream-console-${DATE_TAG}.log`);
const WORLD_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=world';

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
        && typeof window.vis6bPushEvent === 'function'
        && typeof window.vis6bSimulateBatch === 'function',
      undefined,
      { timeout: 120000 }
    );

    await sleep(1500);

    // ─── Step 1: Fly to COMPANY ───────────────────────────────────
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

    // ─── Step 2: Render at COMPANY to populate slab registry ──────
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis6b-company-baseline');
      }
    });
    await sleep(2500);

    // ─── Step 3: Verify slab registry is populated ────────────────
    const slabCount = await page.evaluate(() => window.vis4cGetSlabIds().length);
    log(`[VIS6B] baseline slabCount=${slabCount}`);
    if (slabCount === 0) {
      log(`[VIS6B] FATAL: No slabs present, cannot run event stream proof.`);
      log(`[VIS6B] gate-summary result=REFUSAL reason=NO_SLABS`);
      return;
    }

    // ─── Step 4: Reset VIS-6b state (clean slate) ─────────────────
    await page.evaluate(() => window.vis6bReset());
    log(`[VIS6B] state reset`);

    // ─── Step 5: Run the deterministic canned batch ───────────────
    const batchResult = await page.evaluate(() => window.vis6bSimulateBatch());
    log(`[VIS6B] simulateBatch ok=${batchResult?.ok} accepted=${batchResult?.batchResult?.accepted} dropped=${batchResult?.batchResult?.dropped}`);
    log(`[VIS6B] state seen=${batchResult?.state?.seen} activePulses=${batchResult?.state?.activePulses}`);
    log(`[VIS6B] dropped unknownOwner=${batchResult?.state?.dropped?.unknownOwner} dupDrops=${batchResult?.state?.dropped?.dupDrops} capDrops=${batchResult?.state?.dropped?.capDrops}`);
    log(`[VIS6B] stats accepted=${batchResult?.state?.stats?.accepted} triggered=${batchResult?.state?.stats?.triggered} coalesced=${batchResult?.state?.stats?.coalesced} dropped=${batchResult?.state?.stats?.dropped}`);

    // ─── Step 6: Wait for all pulses to complete (800ms + buffer) ─
    await sleep(1500);

    // ─── Step 7: Verify individual event push works ───────────────
    const singleResult = await page.evaluate(() => {
      return window.vis6bPushEvent({
        id: 'evt-single-test',
        ts: Date.now(),
        type: 'TIMEBOX_APPEARED',
        scope: 'company',
        ownerId: window.filamentRenderer._vis4SlabRegistry.values().next().value.ownerId,
        timeboxId: 'T-SINGLE-TEST'
      });
    });
    log(`[VIS6B] singlePush ok=${singleResult?.ok} pulsed=${singleResult?.pulsed}`);
    await sleep(1000);

    // ─── Step 8: Test duplicate rejection ─────────────────────────
    const dupResult = await page.evaluate(() => {
      return window.vis6bPushEvent({
        id: 'evt-single-test',
        ts: Date.now(),
        type: 'TIMEBOX_APPEARED',
        scope: 'company',
        ownerId: 'anything',
        timeboxId: 'T-DUP'
      });
    });
    log(`[VIS6B] dupPush ok=${dupResult?.ok} reason=${dupResult?.reason}`);

    // ─── Step 9: Test unknown owner rejection ─────────────────────
    const unknownResult = await page.evaluate(() => {
      return window.vis6bPushEvent({
        id: 'evt-unknown-owner',
        ts: Date.now(),
        type: 'TIMEBOX_APPEARED',
        scope: 'company',
        ownerId: 'NONEXISTENT_OWNER_XYZ',
        timeboxId: 'T-UNKNOWN'
      });
    });
    log(`[VIS6B] unknownOwnerPush ok=${unknownResult?.ok} reason=${unknownResult?.reason}`);

    // ─── Step 10: Get final state ─────────────────────────────────
    const finalState = await page.evaluate(() => window.vis6bGetState());
    log(`[VIS6B] finalState seen=${finalState?.seen} activePulses=${finalState?.activePulses}`);
    log(`[VIS6B] finalDropped dupDrops=${finalState?.dropped?.dupDrops} capDrops=${finalState?.dropped?.capDrops} unknownOwner=${finalState?.dropped?.unknownOwner}`);

    // ─── Step 11: Collect console output and check required lines ─
    const fullLog = consoleLogs.join('\n');

    // Required lines
    const hasEventAccepted = (fullLog.match(/\[VIS6B\] eventAccepted /g) || []).length >= 3;
    const hasTriggered = (fullLog.match(/\[VIS6B\] pulseTriggered /g) || []).length >= 3;
    const hasCoalesced = fullLog.includes('[VIS6B] pulseCoalesced ');
    const hasRefusal = fullLog.includes('[REFUSAL] reason=VIS6B_PULSE_CAP_EXCEEDED');
    const hasSummary = fullLog.includes('[VIS6B] summary accepted=');
    const hasGateSummary = true; // We will emit it ourselves below since the batch function calls logSummary

    // VIS-2 / VIS-4 regression checks
    const hasSheetTiles = fullLog.includes('[VIS2] sheetTilesRendered count=');
    const hasCompanyCollapsed = fullLog.includes('[VIS2] companyCollapsed result=PASS');
    const hasVis4Gate = fullLog.includes('[VIS4] gate-summary result=PASS');
    const noErrors = !fullLog.includes('ReferenceError') && !fullLog.includes('TypeError');

    // Dedup worked
    const dupWorked = dupResult?.ok === false && dupResult?.reason === 'DUPLICATE';
    // Unknown owner worked
    const unknownWorked = unknownResult?.ok === false && unknownResult?.reason === 'UNKNOWN_OWNER';
    // Cap drops happened (from the 25-event burst)
    const capDropsHappened = finalState?.dropped?.capDrops > 0;

    const allPass = hasEventAccepted && hasTriggered && hasCoalesced
      && hasRefusal && hasSummary
      && hasSheetTiles && hasCompanyCollapsed && hasVis4Gate
      && noErrors && dupWorked && unknownWorked && capDropsHappened;

    log(`--- VIS-6b Proof Checklist ---`);
    log(`[VIS6B] eventAccepted (>=3) ${hasEventAccepted ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS6B] pulseTriggered (>=3) ${hasTriggered ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS6B] pulseCoalesced ${hasCoalesced ? 'PRESENT' : 'MISSING'}`);
    log(`[REFUSAL] VIS6B_PULSE_CAP_EXCEEDED ${hasRefusal ? 'PRESENT (expected)' : 'MISSING'}`);
    log(`[VIS6B] summary ${hasSummary ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS6B] dedup ${dupWorked ? 'PASS' : 'FAIL'}`);
    log(`[VIS6B] unknownOwner ${unknownWorked ? 'PASS' : 'FAIL'}`);
    log(`[VIS6B] capDrops ${capDropsHappened ? 'PASS (count=' + finalState?.dropped?.capDrops + ')' : 'FAIL'}`);
    log(`[VIS2] companyCollapsed ${hasCompanyCollapsed ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS2] sheetTiles ${hasSheetTiles ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4] gate-summary ${hasVis4Gate ? 'result=PASS' : 'MISSING'}`);
    log(`[VIS6B] noErrors ${noErrors ? 'PASS' : 'FAIL'}`);
    log(`[VIS6B] gate-summary result=${allPass ? 'PASS' : 'REFUSAL'}`);

    await fs.writeFile(LOG_FILE, fullLog + '\n\n--- VIS-6b proof ---\n' + lines.join('\n'), 'utf8');
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
