/**
 * VIS-3.3 Click-to-Focus proof.
 * Enters P2P.ThreeWayMatch, programmatically clicks an exception row overlay
 * and a route connector, then jumps to source sheet.
 * Checks: clickRow PASS, clickConnector PASS, jumpToSource PASS, gate-summary PASS.
 * Server must be running or script starts it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `vis3-click-to-focus-console-${DATE_TAG}.log`);
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
        && typeof window.vis33ClickExceptionRow === 'function'
        && typeof window.vis33ClickRouteConnector === 'function'
        && typeof window.vis33JumpToSource === 'function'
        && !!window.filamentRenderer,
      undefined,
      { timeout: 120000 }
    );

    await sleep(1500);

    // Step 1: Fly to COMPANY baseline
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

    // Step 2: Enter the target match sheet
    const enterResult = await page.evaluate((sheetId) => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      const out = window.relayEnterSheet(sheetId);
      if (out?.ok && window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis33-enter-sheet');
      }
      return out;
    }, TARGET_SHEET);
    log(`[VIS3.3] enterSheet ok=${enterResult?.ok === true} sheet=${TARGET_SHEET}`);
    await sleep(3000);

    // Step 3: Find exception rows for this sheet and click the first one
    const clickRowResult = await page.evaluate((sheetId) => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      const sheet = (window.relayState?.tree?.nodes || []).find(n => n.id === sheetId && n.type === 'sheet');
      if (!sheet || !sheet.metadata?.isMatchSheet) return { ok: false, reason: 'NOT_MATCH_SHEET' };
      const cellData = Array.isArray(sheet.cellData) ? sheet.cellData : [];
      const schema = Array.isArray(sheet.metadata?.schema) ? sheet.metadata.schema : [];
      let statusCol = schema.findIndex((c) => c.id === 'matchStatus');
      if (statusCol < 0) {
        const cols = Number(sheet.cols) || sheet.metadata?.cols || 0;
        statusCol = cols > 0 ? cols - 1 : 0;
      }
      // Find first exception row
      let exRow = null;
      for (const cell of cellData) {
        if (cell.row >= 1 && cell.col === statusCol && String(cell.value || '').toUpperCase() !== 'MATCH') {
          exRow = cell.row;
          break;
        }
      }
      if (exRow === null) return { ok: false, reason: 'NO_EXCEPTION_ROWS' };
      return window.vis33ClickExceptionRow(sheetId, exRow);
    }, TARGET_SHEET);
    log(`[VIS3.3] clickRow ok=${clickRowResult?.ok === true} row=${clickRowResult?.rowIndex || 'none'} status=${clickRowResult?.matchStatus || 'none'}`);
    await sleep(1500);

    // Step 4: Click a route connector (first source sheet → target)
    const clickConnectorResult = await page.evaluate((sheetId) => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      const sheet = (window.relayState?.tree?.nodes || []).find(n => n.id === sheetId && n.type === 'sheet');
      if (!sheet) return { ok: false };
      const sourceSheets = Array.isArray(sheet.metadata?.sourceSheets) ? sheet.metadata.sourceSheets : [];
      if (sourceSheets.length === 0) return { ok: false, reason: 'NO_SOURCE_SHEETS' };
      return window.vis33ClickRouteConnector(sourceSheets[0], sheetId);
    }, TARGET_SHEET);
    log(`[VIS3.3] clickConnector ok=${clickConnectorResult?.ok === true} from=${clickConnectorResult?.fromId || 'none'} to=${clickConnectorResult?.toId || 'none'}`);
    await sleep(1500);

    // Step 5: Jump to source sheet
    const jumpResult = await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      return window.vis33JumpToSource();
    });
    log(`[VIS3.3] jumpToSource ok=${jumpResult?.ok === true} sheet=${jumpResult?.sheet || 'none'}`);
    await sleep(2500);

    // Step 6: Check required log lines
    const fullLog = consoleLogs.join('\n');

    const hasClickRow = fullLog.includes('[VIS3.3] clickRow result=PASS');
    const hasClickConnector = fullLog.includes('[VIS3.3] clickConnector result=PASS');
    const hasJumpToSource = fullLog.includes('[VIS3.3] jumpToSource result=PASS');
    const hasNoErrors = !fullLog.includes('ReferenceError') && !fullLog.includes('TypeError');

    // Emit gate-summary based on all checks
    const allPass = hasClickRow && hasClickConnector && hasJumpToSource && hasNoErrors;
    if (allPass) {
      consoleLogs.push('[VIS3.3] gate-summary result=PASS');
    }
    const finalLog = consoleLogs.join('\n');

    log(`[VIS3.3] clickRow ${hasClickRow ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS3.3] clickConnector ${hasClickConnector ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS3.3] jumpToSource ${hasJumpToSource ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS3.3] noErrors ${hasNoErrors ? 'PASS' : 'FAIL'}`);
    log(`[VIS3.3] gate-summary result=${allPass ? 'PASS' : 'REFUSAL'}`);
    log(`[VIS3.3] proof-summary result=${allPass ? 'PASS' : 'REFUSAL'}`);

    await fs.writeFile(LOG_FILE, finalLog + '\n\n--- VIS3.3 proof ---\n' + lines.join('\n'), 'utf8');
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
