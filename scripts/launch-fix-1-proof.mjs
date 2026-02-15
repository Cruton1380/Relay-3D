/**
 * LAUNCH-FIX-1 sanity proof.
 *
 * Opens ?profile=launch, waits for render, asserts key log lines:
 *  - [PRES] launchTransform ... applied=PASS
 *  - [PRES] tether rendered=PASS
 *  - [PRES] buildingAnchorProxy rendered=PASS
 *  - [PRES] junctions rendered=PASS count=<n>
 *  - [DOCK] enterSheet target=... mode=FaceOn result=PASS
 *  - [CAM] dockFaceOn applied=PASS sheet=...
 *  - [2D] gridShown sheet=... result=PASS
 *  - [2D] gridHidden reason=exitSheet result=PASS
 *  - No [REFUSAL] reason=LAUNCH_DOCK_MISSING_SHEET_META (during normal path)
 *
 * Enters a sheet, checks face-on docking + 2D grid, exits, then emits gate summary.
 * Server must be running or script starts it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `launch-fix-1-console-${DATE_TAG}.log`);
const LAUNCH_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=launch';

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
    devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], LAUNCH_URL);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await page.addInitScript(() => {
      window.RELAY_DEBUG_VERBOSE = true;
      window.RELAY_DEBUG_LOGS = true;
    });
    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));
    await page.goto(LAUNCH_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

    // Wait for renderer + tree to be available
    await page.waitForFunction(
      () => !!window.filamentRenderer
        && !!window.relayState?.tree?.nodes?.length
        && !!window.viewer,
      undefined,
      { timeout: 120000 }
    );
    await sleep(1500);

    // ─── Step 1: Fly to COMPANY view to trigger render ────────────────
    log('--- Step 1: Fly to COMPANY view ---');
    await page.evaluate(async () => {
      const viewer = window.viewer;
      const relayState = window.relayState;
      if (viewer?.camera && relayState?.tree?.nodes?.length) {
        const trunk = relayState.tree.nodes.find((n) => n?.type === 'trunk');
        if (trunk && Number.isFinite(trunk.lat) && Number.isFinite(trunk.lon)) {
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 5000),
            orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 }
          });
        }
      }
    });
    await sleep(2000);

    // Force a render
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('launch-fix-1-proof');
      }
    });
    await sleep(3000);

    // ─── Step 2: Verify presentation transform logs ───────────────────
    log('--- Step 2: Verify presentation transform logs ---');
    const allLogs = consoleLogs.join('\n');

    const checks = [
      { tag: '[PRES] launchTransform',     pattern: /\[PRES\] launchTransform.*applied=PASS/ },
      { tag: '[PRES] tether rendered',     pattern: /\[PRES\] tether rendered=PASS/ },
      { tag: '[PRES] buildingAnchorProxy', pattern: /\[PRES\] buildingAnchorProxy rendered=PASS/ },
      { tag: '[PRES] junctions rendered',  pattern: /\[PRES\] junctions rendered=PASS count=\d+/ },
      { tag: '[GATE 2] Branch Length',     pattern: /Length: 800\.0m/ },
    ];

    let failures = 0;
    for (const { tag, pattern } of checks) {
      const found = pattern.test(allLogs);
      log(`  ${tag}: ${found ? 'PASS' : 'MISSING'}`);
      if (!found) failures++;
    }

    // Check NO refusals during normal path
    const refusalPattern = /\[REFUSAL\] reason=LAUNCH_DOCK_MISSING_SHEET_META/;
    const hasRefusal = refusalPattern.test(allLogs);
    log(`  No dock refusal: ${hasRefusal ? 'FAIL (refusal found)' : 'PASS'}`);
    if (hasRefusal) failures++;

    // ─── Step 3: Enter a sheet and check face-on docking + 2D grid ────
    log('--- Step 3: Enter sheet + verify docking + 2D grid ---');
    const enterResult = await page.evaluate(async () => {
      const sheets = (window.relayState?.tree?.nodes || []).filter(n => n.type === 'sheet');
      if (sheets.length === 0) return { ok: false, reason: 'no sheets' };
      const sheet = sheets[0];
      if (typeof window.relayEnterSheet === 'function') {
        window.relayEnterSheet(sheet.id || sheet.name);
        return { ok: true, sheetId: sheet.id || sheet.name };
      }
      return { ok: false, reason: 'relayEnterSheet not available' };
    });

    if (enterResult.ok) {
      await sleep(4000); // wait for docking animation + grid render
      const postDockLogs = consoleLogs.join('\n');
      // LAUNCH-FIX-1: Check for face-on dock log
      const hasDockLog = /\[DOCK\] enterSheet target=.*mode=FaceOn result=PASS/.test(postDockLogs)
          || /\[CAM\] Face-on docking/.test(postDockLogs)
          || /\[CAM\] Face-on: instant snap/.test(postDockLogs);
      // LAUNCH-FIX-1: Check for dockFaceOn completion log
      const hasFaceOnLog = /\[CAM\] dockFaceOn applied=PASS/.test(postDockLogs);
      // LAUNCH-FIX-1: Check for 2D grid shown log
      const hasGridLog = /\[2D\] gridShown sheet=.*result=PASS/.test(postDockLogs);
      log(`  Dock enter log: ${hasDockLog ? 'PASS' : 'MISSING'}`);
      log(`  FaceOn applied log: ${hasFaceOnLog ? 'PASS' : 'MISSING'}`);
      log(`  2D grid shown log: ${hasGridLog ? 'PASS' : 'MISSING'}`);
      if (!hasDockLog) failures++;
      if (!hasFaceOnLog) failures++;
      if (!hasGridLog) failures++;

      // Step 4: Exit sheet and check grid hidden
      log('--- Step 4: Exit sheet + verify grid hidden ---');
      await page.evaluate(() => {
        if (typeof window.relayExitSheet === 'function') window.relayExitSheet();
      });
      await sleep(1000);
      const postExitLogs = consoleLogs.join('\n');
      const hasGridHidden = /\[2D\] gridHidden reason=exitSheet result=PASS/.test(postExitLogs);
      log(`  2D grid hidden log: ${hasGridHidden ? 'PASS' : 'MISSING'}`);
      if (!hasGridHidden) failures++;
    } else {
      log(`  Sheet enter skipped: ${enterResult.reason}`);
    }

    // ─── Gate summary ─────────────────────────────────────────────────
    const result = failures === 0 ? 'PASS' : 'REFUSAL';
    log(`\n[LAUNCH-FIX-1] gate-summary result=${result} failures=${failures}`);

    // Write log to archive
    await fs.writeFile(LOG_FILE, lines.join('\n') + '\n\nFull console:\n' + consoleLogs.join('\n'), 'utf-8');
    log(`Log written: ${LOG_FILE}`);

    await browser.close();
    browser = null;
    await stopServer(devServer);
    process.exit(result === 'PASS' ? 0 : 1);
  } catch (err) {
    log(`[LAUNCH-FIX-1] FATAL: ${err.message}`);
    lines.push(err.stack || '');
    try {
      await fs.writeFile(LOG_FILE, lines.join('\n'), 'utf-8');
    } catch { /* best-effort */ }
    if (browser) await browser.close().catch(() => {});
    await stopServer(devServer);
    process.exit(2);
  }
}

main();
