/**
 * VIS-3.2 Sheet Overlay proof.
 * Enters P2P.ThreeWayMatch (match sheet with sourceSheets), renders at SHEET scope,
 * checks: exceptionRows PASS, routeHighlights PASS, gate-summary PASS.
 * Server must be running or script starts it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `vis3-sheet-overlay-console-${DATE_TAG}.log`);
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
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'world'
        && typeof window.relayEnterSheet === 'function'
        && !!window.filamentRenderer,
      undefined,
      { timeout: 120000 }
    );

    await sleep(1500);

    // Step 1: Fly to COMPANY first (triggers VIS-2 baseline)
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

    // Step 2: Render at COMPANY to get baseline VIS-2 tiles
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis32-baseline');
      }
    });
    await sleep(2000);

    // Step 3: Enter the target match sheet
    const enterResult = await page.evaluate((sheetId) => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      const out = window.relayEnterSheet(sheetId);
      if (out?.ok && window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis32-enter-sheet');
      }
      return out;
    }, TARGET_SHEET);

    log(`[VIS3.2] enterCall ok=${enterResult?.ok === true} sheet=${TARGET_SHEET}`);
    await sleep(3000);

    // Step 4: Force another render to ensure overlays are drawn
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis32-overlay-render');
      }
    });
    await sleep(2500);

    // Step 5: Check required log lines
    const fullLog = consoleLogs.join('\n');

    const hasSheetOverlayBegin = fullLog.includes(`[VIS3.2] sheetOverlay begin sheet=${TARGET_SHEET}`);
    const exRowsMatch = fullLog.match(/\[VIS3\.2\] exceptionRows result=PASS sheet=[\w.]+ count=(\d+)/);
    const exRowsOk = !!exRowsMatch;
    const exRowCount = exRowsMatch ? parseInt(exRowsMatch[1], 10) : 0;
    const routeMatch = fullLog.match(/\[VIS3\.2\] routeHighlights result=PASS sheet=[\w.]+ edges=(\d+)/);
    const routeOk = routeMatch && parseInt(routeMatch[1], 10) >= 1;
    const routeCount = routeMatch ? parseInt(routeMatch[1], 10) : 0;
    const hasBudget = fullLog.includes('[VIS3.2] budget');
    const hasGateSummary = fullLog.includes('[VIS3.2] gate-summary result=PASS');
    // Also verify VIS-2 baseline was present
    const hasSheetTiles = fullLog.includes('[VIS2] sheetTilesRendered count=');

    const gateSummary = hasSheetOverlayBegin && exRowsOk && routeOk && hasBudget && hasGateSummary && hasSheetTiles
      ? 'PASS' : 'REFUSAL';

    log(`[VIS3.2] sheetOverlay begin ${hasSheetOverlayBegin ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS3.2] exceptionRows ${exRowsOk ? `count=${exRowCount}` : 'MISSING'}`);
    log(`[VIS3.2] routeHighlights ${routeOk ? `edges=${routeCount}` : 'MISSING'}`);
    log(`[VIS3.2] budget ${hasBudget ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS3.2] gate-summary ${hasGateSummary ? 'result=PASS' : 'MISSING'}`);
    log(`[VIS2] sheetTiles ${hasSheetTiles ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS3.2] proof-summary result=${gateSummary}`);

    await fs.writeFile(LOG_FILE, fullLog + '\n\n--- VIS3.2 proof ---\n' + lines.join('\n'), 'utf8');
    log(`Log written: ${LOG_FILE}`);

    if (gateSummary !== 'PASS') {
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
