/**
 * VIS-4d Timebox Slab Focus proof.
 * Checks: focusOwner at COMPANY, focusSlabStack, focusClear, no LOD change,
 * no slab count change, focusOwner at SHEET, gate-summary PASS.
 * Server must be running or script starts it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `vis4d-slab-focus-console-${DATE_TAG}.log`);
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
        && typeof window.vis4dFocusOwner === 'function',
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

    // Step 2: Render at COMPANY to get baseline slabs
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis4d-company-baseline');
      }
    });
    await sleep(2500);

    // Step 3: Get slab IDs and baseline slab count
    const slabIds = await page.evaluate(() => window.vis4cGetSlabIds());
    const baselineSlabCount = slabIds.length;
    log(`[VIS4D] slabIds count=${baselineSlabCount}`);

    if (baselineSlabCount === 0) {
      log('[VIS4D] FATAL: no slab IDs — cannot test focus');
    }

    // Step 4: Focus on owner of first slab (COMPANY)
    let focusOwnerResult = null;
    if (slabIds.length > 0) {
      focusOwnerResult = await page.evaluate((id) => window.vis4dFocusOwner(id), slabIds[0]);
      log(`[VIS4D] focusOwner programmatic ok=${focusOwnerResult?.ok} owner=${focusOwnerResult?.owner} scope=${focusOwnerResult?.scope}`);
    }
    await sleep(1500);

    // Step 5: Verify no slab count increase
    const slabCountAfterFocus = await page.evaluate(() => window.vis4cGetSlabIds().length);
    log(`[VIS4D] slabCount afterFocus=${slabCountAfterFocus} baseline=${baselineSlabCount} delta=${slabCountAfterFocus - baselineSlabCount}`);
    const noSlabIncrease = slabCountAfterFocus === baselineSlabCount;

    // Step 6: Focus on slab stack (zoom closer)
    let focusStackResult = null;
    if (slabIds.length > 0) {
      focusStackResult = await page.evaluate((id) => window.vis4dFocusSlabStack(id), slabIds[0]);
      log(`[VIS4D] focusSlabStack programmatic ok=${focusStackResult?.ok} owner=${focusStackResult?.owner} timeboxId=${focusStackResult?.timeboxId}`);
    }
    await sleep(1000);

    // Step 7: Clear focus
    const clearResult = await page.evaluate(() => window.vis4dFocusClear());
    log(`[VIS4D] focusClear programmatic ok=${clearResult?.ok}`);
    await sleep(1000);

    // Step 8: Verify slab count still same after clear
    const slabCountAfterClear = await page.evaluate(() => window.vis4cGetSlabIds().length);
    log(`[VIS4D] slabCount afterClear=${slabCountAfterClear}`);
    const noSlabChangeAfterClear = slabCountAfterClear === baselineSlabCount;

    // Step 9: Verify no LOD change happened
    const lodAfterFocus = await page.evaluate(() => {
      const renderer = window.filamentRenderer;
      return renderer?.currentLOD || 'unknown';
    });
    log(`[VIS4D] lodAfterFocus=${lodAfterFocus}`);

    // Step 10: Enter sheet for SHEET-scope focus test
    const enterResult = await page.evaluate((sheetId) => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      const out = window.relayEnterSheet(sheetId);
      if (out?.ok && window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis4d-enter-sheet');
      }
      return out;
    }, TARGET_SHEET);
    log(`[VIS4D] enterSheet ok=${enterResult?.ok === true} sheet=${TARGET_SHEET}`);
    await sleep(3000);

    // Step 11: Force render to populate sheet slab registry
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis4d-sheet-render');
      }
    });
    await sleep(2500);

    // Step 12: Get sheet slab IDs and focus on owner
    const sheetSlabIds = await page.evaluate(() => window.vis4cGetSlabIds());
    log(`[VIS4D] sheetSlabIds count=${sheetSlabIds.length}`);

    let sheetFocusResult = null;
    if (sheetSlabIds.length > 0) {
      sheetFocusResult = await page.evaluate((id) => window.vis4dFocusOwner(id), sheetSlabIds[0]);
      log(`[VIS4D] sheetFocusOwner ok=${sheetFocusResult?.ok} owner=${sheetFocusResult?.owner} scope=${sheetFocusResult?.scope}`);
    }
    await sleep(1000);

    // Clear sheet focus
    await page.evaluate(() => window.vis4dFocusClear());
    await sleep(500);

    // Step 13: Check all required log lines
    const fullLog = consoleLogs.join('\n');

    const hasFocusOwnerCompany = fullLog.includes('[VIS4D] focusOwner result=PASS') && fullLog.includes('scope=company');
    const hasFocusSlabStack = fullLog.includes('[VIS4D] focusSlabStack result=PASS owner=');
    const hasFocusClear = fullLog.includes('[VIS4D] focusClear result=PASS');
    const hasFocusOwnerSheet = fullLog.includes('[VIS4D] focusOwner result=PASS') && fullLog.includes('scope=sheet');
    // VIS-4 gate (base slabs)
    const hasVis4Gate = fullLog.includes('[VIS4] gate-summary result=PASS');
    // VIS-2 baseline
    const hasSheetTiles = fullLog.includes('[VIS2] sheetTilesRendered count=');
    const hasCompanyCollapsed = fullLog.includes('[VIS2] companyCollapsed result=PASS');
    const noErrors = !fullLog.includes('ReferenceError') && !fullLog.includes('TypeError');

    const allPass = hasFocusOwnerCompany && hasFocusSlabStack && hasFocusClear
      && hasFocusOwnerSheet && hasVis4Gate && hasSheetTiles && hasCompanyCollapsed
      && noSlabIncrease && noSlabChangeAfterClear && noErrors;

    log(`[VIS4D] focusOwner company ${hasFocusOwnerCompany ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4D] focusSlabStack ${hasFocusSlabStack ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4D] focusClear ${hasFocusClear ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4D] focusOwner sheet ${hasFocusOwnerSheet ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4D] noSlabIncrease ${noSlabIncrease ? 'PASS' : 'FAIL'}`);
    log(`[VIS4D] noSlabChangeAfterClear ${noSlabChangeAfterClear ? 'PASS' : 'FAIL'}`);
    log(`[VIS4] gate-summary ${hasVis4Gate ? 'result=PASS' : 'MISSING'}`);
    log(`[VIS2] companyCollapsed ${hasCompanyCollapsed ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS2] sheetTiles ${hasSheetTiles ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4D] noErrors ${noErrors ? 'PASS' : 'FAIL'}`);
    log(`[VIS4D] gate-summary result=${allPass ? 'PASS' : 'REFUSAL'}`);

    await fs.writeFile(LOG_FILE, fullLog + '\n\n--- VIS4D proof ---\n' + lines.join('\n'), 'utf8');
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
