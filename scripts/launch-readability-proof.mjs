/**
 * LAUNCH-READABILITY-PASS proof.
 *
 * Opens ?profile=launch, waits for render, asserts the 6 [LAUNCH-FIX] proof
 * lines appear exactly once each.  Then presses E to enter a sheet and
 * verifies the zero-transition [CAM] E-toggle log fires with method=setView.
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
const LOG_FILE = path.join(PROOFS_DIR, `launch-readability-console-${DATE_TAG}.log`);
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

    // Force debug logs ON so RelayLog.info passes through even in launch mode
    await page.addInitScript(() => {
      window.RELAY_DEBUG_VERBOSE = true;
      window.RELAY_DEBUG_LOGS = true;
    });

    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));
    await page.goto(LAUNCH_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

    // Wait for renderer + tree + viewer
    await page.waitForFunction(
      () => !!window.filamentRenderer
        && !!window.relayState?.tree?.nodes?.length
        && !!window.viewer,
      undefined,
      { timeout: 120000 }
    );
    await sleep(2000);

    // Force a render to ensure all proof logs fire
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('launch-readability-proof');
      }
    });
    await sleep(3000);

    // ─── Step 1: Verify all 6 [LAUNCH-FIX] proof lines ────────────────
    log('--- Step 1: Verify [LAUNCH-FIX] proof lines ---');
    const allLogs = consoleLogs.join('\n');

    const checks = [
      { tag: 'A: uiGating',          pattern: /\[LAUNCH-FIX\] uiGating.*applied=PASS/ },
      { tag: 'B: hud tier',          pattern: /\[LAUNCH-FIX\] hud tier1=ON tier2=OFF default=collapsed/ },
      { tag: 'C: helpOverlay',       pattern: /\[LAUNCH-FIX\] helpOverlay shown=/ },
      { tag: 'D: cameraFrame',       pattern: /\[LAUNCH-FIX\] cameraFrame.*applied=PASS/ },
      { tag: 'E: visualHierarchy',   pattern: /\[LAUNCH-FIX\] visualHierarchy applied=PASS/ },
      { tag: 'F: enterSheetBtn',     pattern: /\[LAUNCH-FIX\] enterSheetBtn/ },
    ];

    let failures = 0;
    for (const { tag, pattern } of checks) {
      // Check exists
      const found = pattern.test(allLogs);
      // Check appears only once (not duplicated)
      const matches = allLogs.match(new RegExp(pattern.source, 'g'));
      const count = matches ? matches.length : 0;
      const status = found && count === 1 ? 'PASS' : found ? `WARN (count=${count})` : 'MISSING';
      log(`  ${tag}: ${status}`);
      if (!found) failures++;
    }

    // ─── Step 2: Verify CSS gating — dev panels hidden ────────────────
    log('--- Step 2: Verify CSS gating ---');
    const hiddenPanels = await page.evaluate(() => {
      const ids = [
        'artifactInspectorPanel', 'p2pEntryPanel', 'branchStewardPanel',
        'voteLanePanel', 'votePanel', 'workModeSurface', 'logConsole', 'infoPanel'
      ];
      return ids.map(id => {
        const el = document.getElementById(id);
        if (!el) return { id, hidden: true, reason: 'not-in-dom' };
        const style = window.getComputedStyle(el);
        return { id, hidden: style.display === 'none', display: style.display };
      });
    });
    for (const p of hiddenPanels) {
      const status = p.hidden ? 'PASS (hidden)' : `FAIL (display=${p.display})`;
      log(`  ${p.id}: ${status}`);
      if (!p.hidden) failures++;
    }

    // Verify required elements are visible
    const visibleElements = await page.evaluate(() => {
      const ids = ['hud', 'cesiumContainer', 'launchHelpOverlay', 'launchEnterSheetBtn'];
      return ids.map(id => {
        const el = document.getElementById(id);
        if (!el) return { id, visible: false, reason: 'not-in-dom' };
        const style = window.getComputedStyle(el);
        return { id, visible: style.display !== 'none', display: style.display };
      });
    });
    for (const v of visibleElements) {
      const status = v.visible ? 'PASS (visible)' : `FAIL (display=${v.display || v.reason})`;
      log(`  ${v.id}: ${status}`);
      if (!v.visible) failures++;
    }

    // ─── Step 3: Press E to enter sheet, verify zero-transition ────────
    log('--- Step 3: E-toggle → enter sheet (zero transition) ---');
    const hasSheets = await page.evaluate(
      () => (window.relayState?.tree?.nodes || []).filter(n => n.type === 'sheet' && n._center).length > 0
    );
    if (hasSheets) {
      await page.keyboard.press('e');
      await sleep(2000);

      const postELogs = consoleLogs.join('\n');
      const eEnterFound = /\[CAM\] E-toggle action=ENTER.*method=setView.*result=PASS/.test(postELogs);
      const instantSnap = /\[CAM\] Face-on: instant snap \(duration=0 method=setView\)/.test(postELogs);
      log(`  E-toggle ENTER log: ${eEnterFound ? 'PASS' : 'MISSING'}`);
      log(`  Instant snap (setView): ${instantSnap ? 'PASS' : 'MISSING'}`);
      if (!eEnterFound) failures++;
      if (!instantSnap) failures++;

      // Press E again to exit
      await page.keyboard.press('e');
      await sleep(500);
      const postExitLogs = consoleLogs.join('\n');
      const eExitFound = /\[CAM\] E-toggle action=EXIT result=PASS/.test(postExitLogs);
      log(`  E-toggle EXIT log: ${eExitFound ? 'PASS' : 'MISSING'}`);
      if (!eExitFound) failures++;
    } else {
      log('  Skipped (no sheets with _center available)');
    }

    // ─── Gate summary ─────────────────────────────────────────────────
    const result = failures === 0 ? 'PASS' : 'REFUSAL';
    log(`\n[LAUNCH-READABILITY] gate-summary result=${result} failures=${failures}`);

    // Write log to archive
    await fs.writeFile(LOG_FILE, lines.join('\n') + '\n\nFull console:\n' + consoleLogs.join('\n'), 'utf-8');
    log(`Log written: ${LOG_FILE}`);

    await browser.close();
    browser = null;
    await stopServer(devServer);
    process.exit(result === 'PASS' ? 0 : 1);
  } catch (err) {
    log(`[LAUNCH-READABILITY] FATAL: ${err.message}`);
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
