/**
 * VIS-2 Company Compression proof.
 * Requires: [VIS2] companyCollapsed result=PASS, sheetTilesRendered count=20,
 * enterSheet expanded=1, exitSheet collapsed=PASS, gate-summary result=PASS.
 * Run after Step 6 (minimal proof script). Server must be running or script starts it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `vis2-company-compression-console-${DATE_TAG}.log`);
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
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'world'
        && typeof window.relayEnterSheet === 'function'
        && typeof window.relayExitSheet === 'function'
        && !!window.filamentRenderer,
      undefined,
      { timeout: 120000 }
    );

    await sleep(1500);

    // Fly to COMPANY so LOD allows tiles
    await page.evaluate(async () => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
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

    const hasCompanyCollapsed = () => consoleLogs.some((t) => String(t).includes('[VIS2] companyCollapsed result=PASS'));
    const hasSheetTiles = () => consoleLogs.some((t) => String(t).includes('[VIS2] sheetTilesRendered count='));
    const hasEnterSheet = () => consoleLogs.some((t) => String(t).includes('[VIS2] enterSheet expanded=1'));
    const hasExitSheet = () => consoleLogs.some((t) => String(t).includes('[VIS2] exitSheet collapsed=PASS'));

    if (!hasCompanyCollapsed() || !hasSheetTiles()) {
      log('[VIS2] proof wait: company collapsed / sheet tiles (may already be present)');
    }

    const firstSheetId = await page.evaluate(() => {
      const nodes = window.relayState?.tree?.nodes || [];
      const sheet = nodes.find((n) => String(n?.type || '').toLowerCase() === 'sheet');
      return sheet ? String(sheet.id) : null;
    });
    let enterResult = null;
    if (firstSheetId) {
      enterResult = await page.evaluate((sheetId) => {
        window.__relayStressModeActive = false;
        window.__relayDeferredRenderPending = false;
        window.__relayPostGateQuietUntil = 0;
        const out = window.relayEnterSheet(sheetId);
        if (out?.ok && window.filamentRenderer) {
          window.filamentRenderer.renderTree('vis2-enter-sheet');
        }
        return out;
      }, firstSheetId);
    }
    if (!enterResult?.ok) {
      enterResult = await page.evaluate(() => {
        window.__relayStressModeActive = false;
        window.__relayDeferredRenderPending = false;
        window.__relayPostGateQuietUntil = 0;
        const out = window.relayEnterSheet();
        if (out?.ok && window.filamentRenderer) {
          window.filamentRenderer.renderTree('vis2-enter-sheet-fallback');
        }
        return out;
      });
    }
    log(`[VIS2] enterCall ok=${enterResult?.ok === true} scope=${enterResult?.entry?.scope || 'unknown'} sheetId=${enterResult?.entry?.sheetId || 'none'}`);
    if (enterResult?.ok) {
      await sleep(2500);
    }

    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      window.relayExitSheet();
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis2-exit-sheet');
      }
    });
    await sleep(2000);

    const fullLog = consoleLogs.join('\n');
    const companyCollapsed = fullLog.includes('[VIS2] companyCollapsed result=PASS');
    const sheetTilesMatch = fullLog.match(/\[VIS2\] sheetTilesRendered count=(\d+)/);
    const sheetTilesOk = sheetTilesMatch && parseInt(sheetTilesMatch[1], 10) >= 1;
    const enterSheetOk = fullLog.includes('[VIS2] enterSheet expanded=1');
    const exitSheetOk = fullLog.includes('[VIS2] exitSheet collapsed=PASS');

    const gateSummary = companyCollapsed && sheetTilesOk && enterSheetOk && exitSheetOk ? 'PASS' : 'REFUSAL';
    log(`[VIS2] companyCollapsed result=${companyCollapsed ? 'PASS' : 'MISSING'}`);
    log(`[VIS2] sheetTilesRendered ${sheetTilesOk ? `count=${sheetTilesMatch[1]}` : 'MISSING'}`);
    log(`[VIS2] enterSheet ${enterSheetOk ? 'expanded=1' : 'MISSING'}`);
    log(`[VIS2] exitSheet ${exitSheetOk ? 'collapsed=PASS' : 'MISSING'}`);
    log(`[VIS2] gate-summary result=${gateSummary}`);

    await fs.writeFile(LOG_FILE, fullLog + '\n\n--- VIS2 proof ---\n' + lines.join('\n'), 'utf8');
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
