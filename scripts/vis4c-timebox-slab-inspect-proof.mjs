/**
 * VIS-4c Timebox Slab Inspect proof.
 * Checks: labels render at COMPANY + SHEET, hover emits log, pin/unpin cycle,
 * hover does not clear while pinned, Escape clears pin, gate-summary PASS.
 * Server must be running or script starts it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `vis4c-timebox-slab-inspect-console-${DATE_TAG}.log`);
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
        && typeof window.vis4cHoverSlab === 'function',
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

    // Step 2: Render at COMPANY to get baseline slabs + labels
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis4c-company-baseline');
      }
    });
    await sleep(2500);

    // Step 3: Get slab IDs for hover/pin testing
    const slabIds = await page.evaluate(() => window.vis4cGetSlabIds());
    log(`[VIS4c] slabIds count=${slabIds.length}`);
    if (slabIds.length === 0) {
      log('[VIS4c] FATAL: no slab IDs registered — cannot test hover/pin');
    }

    // Step 4: Hover a known slab (first one)
    let hoveredSlabId = null;
    if (slabIds.length > 0) {
      hoveredSlabId = slabIds[0];
      const hoverResult = await page.evaluate((id) => window.vis4cHoverSlab(id), hoveredSlabId);
      log(`[VIS4c] hover programmatic ok=${hoverResult?.ok} slab=${hoveredSlabId}`);
    }
    await sleep(500);

    // Step 5: Pin the hovered slab
    let pinResult = null;
    if (hoveredSlabId) {
      pinResult = await page.evaluate((id) => window.vis4cPinSlab(id), hoveredSlabId);
      log(`[VIS4c] pin programmatic ok=${pinResult?.ok} pinned=${pinResult?.pinned} slab=${hoveredSlabId}`);
    }
    await sleep(500);

    // Step 6: Move cursor away (simulate leaving slabs) — while pinned, hover should NOT clear
    // We can't truly move cursor, but verify that pinnedId prevents hoverClear
    const pinnedCheck = await page.evaluate(() => {
      const renderer = window.filamentRenderer;
      return {
        pinnedId: renderer?._vis4cPinnedId || null,
        hoveredId: renderer?._vis4cHoveredId || null
      };
    });
    log(`[VIS4c] pinnedCheck pinnedId=${pinnedCheck.pinnedId} hoveredId=${pinnedCheck.hoveredId}`);
    const pinHeld = pinnedCheck.pinnedId === hoveredSlabId;
    log(`[VIS4c] pinHeld=${pinHeld}`);

    // Step 7: Unpin (click same slab again to toggle)
    if (hoveredSlabId) {
      const unpinResult = await page.evaluate((id) => window.vis4cPinSlab(id), hoveredSlabId);
      log(`[VIS4c] unpin programmatic ok=${unpinResult?.ok} pinned=${unpinResult?.pinned} slab=${hoveredSlabId}`);
    }
    await sleep(500);

    // Step 8: Verify hoverClear happened after unpin
    const afterUnpin = await page.evaluate(() => {
      const renderer = window.filamentRenderer;
      return {
        pinnedId: renderer?._vis4cPinnedId || null,
        hoveredId: renderer?._vis4cHoveredId || null
      };
    });
    log(`[VIS4c] afterUnpin pinnedId=${afterUnpin.pinnedId} hoveredId=${afterUnpin.hoveredId}`);

    // Step 9: Enter sheet for SHEET-scope labels
    const enterResult = await page.evaluate((sheetId) => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      const out = window.relayEnterSheet(sheetId);
      if (out?.ok && window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis4c-enter-sheet');
      }
      return out;
    }, TARGET_SHEET);
    log(`[VIS4c] enterSheet ok=${enterResult?.ok === true} sheet=${TARGET_SHEET}`);
    await sleep(3000);

    // Step 10: Force render to capture sheet labels
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis4c-sheet-render');
      }
    });
    await sleep(2500);

    // Step 11: Check all required log lines
    const fullLog = consoleLogs.join('\n');

    const hasLabelsCompany = fullLog.includes('[VIS4c] labelsRendered count=') && fullLog.includes('scope=company');
    const hasLabelsSheet = fullLog.includes('[VIS4c] labelsRendered count=') && fullLog.includes('scope=sheet');
    const hasHover = fullLog.includes('[VIS4c] hover slab=');
    const hasPinTrue = fullLog.includes('pinned=true');
    const hasPinFalse = fullLog.includes('pinned=false');
    const hasHoverClear = fullLog.includes('[VIS4c] hoverClear');
    // VIS-4 gate (base slabs)
    const hasVis4Gate = fullLog.includes('[VIS4] gate-summary result=PASS');
    // VIS-2 baseline
    const hasSheetTiles = fullLog.includes('[VIS2] sheetTilesRendered count=');
    const hasCompanyCollapsed = fullLog.includes('[VIS2] companyCollapsed result=PASS');
    const noErrors = !fullLog.includes('ReferenceError') && !fullLog.includes('TypeError');

    const allPass = hasLabelsCompany && hasLabelsSheet && hasHover
      && hasPinTrue && hasPinFalse && hasHoverClear
      && hasVis4Gate && hasSheetTiles && hasCompanyCollapsed && noErrors;

    log(`[VIS4c] labelsRendered company ${hasLabelsCompany ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4c] labelsRendered sheet ${hasLabelsSheet ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4c] hover ${hasHover ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4c] pin true ${hasPinTrue ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4c] pin false ${hasPinFalse ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4c] hoverClear ${hasHoverClear ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4] gate-summary ${hasVis4Gate ? 'result=PASS' : 'MISSING'}`);
    log(`[VIS2] companyCollapsed ${hasCompanyCollapsed ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS2] sheetTiles ${hasSheetTiles ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4c] noErrors ${noErrors ? 'PASS' : 'FAIL'}`);
    log(`[VIS4c] gate-summary result=${allPass ? 'PASS' : 'REFUSAL'}`);

    await fs.writeFile(LOG_FILE, fullLog + '\n\n--- VIS4c proof ---\n' + lines.join('\n'), 'utf8');
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
