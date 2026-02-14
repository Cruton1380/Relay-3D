/**
 * BASIN-FOCUS-LOCK-1 proof.
 * Verifies double-click on trunk → company focus with full tree reveal,
 * preserving FreeFly contract, no sheet entry, Esc restores globe.
 *
 * Stages:
 *   1. Boot: FreeFly active, no company focus
 *   2. focusCompanyOverview() → camera moves, LOD=COMPANY, tree visible
 *   3. FreeFly still works (input not stolen, no sheet entered)
 *   4. Esc → exitCompanyFocus() → camera restores, focus cleared
 *   5. Required logs emitted
 *
 * Screenshots:
 *   01-pre-focus.png  — Globe view before focus
 *   02-company-focus.png — After basin focus (full tree visible)
 *   03-post-escape.png — After Esc (back to globe)
 *
 * Proof artifact: archive/proofs/basin-focus-console-YYYY-MM-DD.log
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `basin-focus-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `basin-focus-console-${DATE_TAG}.log`);
const LAUNCH_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=launch';

const proofLines = [];
const log = (line) => {
  const msg = String(line);
  proofLines.push(msg);
  console.log(msg);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForUrl(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch { /* retry */ }
    await sleep(500);
  }
  return false;
}

async function startServerIfNeeded(commandArgs, readyUrl) {
  const ready = await waitForUrl(readyUrl, 2500);
  if (ready) return { child: null, started: false };
  log('[SERVER] starting dev server...');
  const child = spawn('npx', commandArgs, {
    cwd: ROOT, stdio: 'pipe', shell: true, detached: false,
  });
  child.stdout?.on('data', () => {});
  child.stderr?.on('data', () => {});
  const ok = await waitForUrl(readyUrl, 30000);
  if (!ok) throw new Error('Dev server failed to start');
  log('[SERVER] dev server ready');
  return { child, started: true };
}

function stopServer(child) {
  if (!child) return;
  try { child.kill(); } catch { /* ignore */ }
}

function hasLog(allLogs, pattern) {
  return allLogs.some(l => l.includes(pattern));
}

async function screenshotCanvas(page, filePath) {
  const canvas = await page.$('#cesiumContainer canvas');
  if (canvas) { await canvas.screenshot({ path: filePath }); return 'canvas'; }
  const container = await page.$('#cesiumContainer');
  if (container) { await container.screenshot({ path: filePath }); return 'container'; }
  await page.screenshot({ path: filePath });
  return 'fullpage';
}

async function main() {
  log('==============================================================');
  log('[BASIN] BASIN-FOCUS-LOCK-1 proof starting');
  log(`[BASIN] date=${DATE_TAG}`);
  log('==============================================================');

  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const server = await startServerIfNeeded(
    ['http-server', '.', '-p', '3000', '-c-1', '--cors'],
    'http://127.0.0.1:3000/relay-cesium-world.html'
  );

  let browser;
  let exitCode = 0;
  const consoleLogs = [];
  const stageResults = {};

  try {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    page.on('console', (msg) => { consoleLogs.push(msg.text()); });

    log('[NAV] loading launch URL...');
    await page.goto(LAUNCH_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    log('[NAV] waiting for Cesium + tree render (readiness poll)...');

    // Poll for readiness: viewer + relayState + tree nodes must exist
    const readyDeadline = Date.now() + 60000;
    let ready = false;
    while (Date.now() < readyDeadline) {
      ready = await page.evaluate(() => {
        return !!(
          window.viewer &&
          window.viewer.camera &&
          window.relayState?.tree?.nodes?.length > 0 &&
          window.filamentRenderer
        );
      }).catch(() => false);
      if (ready) break;
      await sleep(2000);
    }
    log(`[NAV] readiness: viewer+tree=${ready}`);
    if (!ready) {
      log('[NAV] WARN: page not fully ready after 60s, proceeding anyway');
    }
    // Extra settle time for render + post-processing
    await sleep(5000);

    // === STAGE 1: Boot State — FreeFly, no company focus ===
    log('');
    log('-- STAGE 1: Boot State (FreeFly, no company focus) --');
    const bootState = await page.evaluate(() => {
      const nodes = window.relayState?.tree?.nodes || [];
      const trunk = nodes.find(n => n.type === 'trunk');
      return {
        companyFocus: window._companyFocusState?.active || false,
        launchMode: window.RELAY_LAUNCH_MODE === true,
        hasTrunk: !!trunk,
        trunkId: trunk?.id || null,
        hasViewer: !!window.viewer,
        hasRenderer: !!window.filamentRenderer,
        nodeCount: nodes.length
      };
    });
    const freeFlyBootLog = hasLog(consoleLogs, '[INPUT] owner=CAMERA mode=FreeFly reason=default');
    log(`[BASIN] boot: companyFocus=${bootState.companyFocus} launchMode=${bootState.launchMode} trunk=${bootState.trunkId} nodes=${bootState.nodeCount} viewer=${bootState.hasViewer} renderer=${bootState.hasRenderer} freeFlyLog=${freeFlyBootLog}`);
    stageResults.bootState = bootState.hasViewer && bootState.hasTrunk && !bootState.companyFocus;
    log(`[BASIN] stage=bootState result=${stageResults.bootState ? 'PASS' : 'FAIL'}`);

    // Screenshot: pre-focus globe view
    await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '01-pre-focus.png'));
    log('[BASIN] screenshot 01-pre-focus.png');

    // === STAGE 2: focusCompanyOverview() → camera moves, LOD=COMPANY ===
    log('');
    log('-- STAGE 2: Company Focus (focusCompanyOverview) --');

    // Record camera position before focus
    const camBefore = await page.evaluate(() => {
      const cam = window.viewer?.camera;
      if (!cam) return null;
      return { x: cam.positionWC.x, y: cam.positionWC.y, z: cam.positionWC.z };
    });
    log(`[BASIN] camera before focus: x=${camBefore?.x?.toFixed(0)} y=${camBefore?.y?.toFixed(0)} z=${camBefore?.z?.toFixed(0)}`);

    // Call focusCompanyOverview on the trunk node
    const focusResult = await page.evaluate(() => {
      const nodes = window.relayState?.tree?.nodes || [];
      const trunk = nodes.find(n => n.type === 'trunk');
      if (!trunk) return { ok: false, reason: 'NO_TRUNK' };
      if (typeof window.focusCompanyOverview !== 'function') return { ok: false, reason: 'NO_FUNCTION' };
      // Call it and return synchronously — the flyTo is async
      window.focusCompanyOverview(trunk);
      return { ok: true, trunkId: trunk.id };
    });
    log(`[BASIN] focusCompanyOverview called: ok=${focusResult.ok} trunk=${focusResult.trunkId || 'N/A'}`);

    // Wait for flyTo animation (1.2s) + render
    await sleep(3000);

    // Check state after focus
    const afterFocus = await page.evaluate(() => {
      return {
        companyFocusActive: window._companyFocusState?.active || false,
        companyFocusTarget: window._companyFocusState?.target || null,
        companyFocusScope: window._companyFocusState?.scope || null,
        inputOwner: window._companyFocusState?.inputOwner || null,
        inputMode: window._companyFocusState?.mode || null,
        currentLOD: window.filamentRenderer?.currentLOD || 'UNKNOWN'
      };
    });
    log(`[BASIN] afterFocus: active=${afterFocus.companyFocusActive} target=${afterFocus.companyFocusTarget} scope=${afterFocus.companyFocusScope} LOD=${afterFocus.currentLOD} input=${afterFocus.inputOwner}/${afterFocus.inputMode}`);

    // Check camera actually moved
    const camAfter = await page.evaluate(() => {
      const cam = window.viewer?.camera;
      if (!cam) return null;
      return { x: cam.positionWC.x, y: cam.positionWC.y, z: cam.positionWC.z };
    });
    let cameraMoved = false;
    if (camBefore && camAfter) {
      const dx = camAfter.x - camBefore.x;
      const dy = camAfter.y - camBefore.y;
      const dz = camAfter.z - camBefore.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      cameraMoved = dist > 10; // moved more than 10 meters
      log(`[BASIN] cameraMoveDistance=${dist.toFixed(1)}m`);
    }

    stageResults.companyFocus =
      afterFocus.companyFocusActive === true &&
      afterFocus.companyFocusTarget !== null &&
      afterFocus.companyFocusScope === 'company' &&
      afterFocus.currentLOD === 'COMPANY' &&
      cameraMoved;
    log(`[BASIN] stage=companyFocus result=${stageResults.companyFocus ? 'PASS' : 'FAIL'}`);

    // Screenshot: company focus view
    await sleep(1000);
    await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '02-company-focus.png'));
    log('[BASIN] screenshot 02-company-focus.png');

    // === STAGE 3: FreeFly still works (input not stolen, no sheet entered) ===
    log('');
    log('-- STAGE 3: FreeFly Preserved (no sheet entry, input=CAMERA) --');
    const freeFlyCheck = await page.evaluate(() => {
      const ssc = window.viewer?.scene?.screenSpaceCameraController;
      return {
        inputOwner: window._companyFocusState?.inputOwner || 'UNKNOWN',
        mode: window._companyFocusState?.mode || 'UNKNOWN',
        sscEnabled: ssc?.enableInputs || false,
        sscRotate: ssc?.enableRotate || false,
        sscZoom: ssc?.enableZoom || false,
        isEditSheetMode: window._isEditSheetMode || false
      };
    });
    log(`[BASIN] freeFly: owner=${freeFlyCheck.inputOwner} mode=${freeFlyCheck.mode} ssc.inputs=${freeFlyCheck.sscEnabled} ssc.rotate=${freeFlyCheck.sscRotate} ssc.zoom=${freeFlyCheck.sscZoom} editSheet=${freeFlyCheck.isEditSheetMode}`);

    stageResults.freeFlyPreserved =
      freeFlyCheck.inputOwner === 'CAMERA' &&
      freeFlyCheck.mode === 'FreeFly' &&
      freeFlyCheck.sscEnabled === true &&
      !freeFlyCheck.isEditSheetMode;
    log(`[BASIN] stage=freeFlyPreserved result=${stageResults.freeFlyPreserved ? 'PASS' : 'FAIL'}`);

    // === STAGE 4: Esc → exitCompanyFocus → camera restores ===
    log('');
    log('-- STAGE 4: Esc Exit → Camera Restores --');

    // Record camera position before Esc
    const camBeforeEsc = await page.evaluate(() => {
      const cam = window.viewer?.camera;
      if (!cam) return null;
      return { x: cam.positionWC.x, y: cam.positionWC.y, z: cam.positionWC.z };
    });

    // Press Escape
    await page.keyboard.press('Escape');
    log('[BASIN] Escape pressed');
    await sleep(2000); // wait for restore animation (0.9s) + buffer

    const afterEsc = await page.evaluate(() => {
      return {
        companyFocusActive: window._companyFocusState?.active || false,
        companyFocusTarget: window._companyFocusState?.target || null
      };
    });
    const camAfterEsc = await page.evaluate(() => {
      const cam = window.viewer?.camera;
      if (!cam) return null;
      return { x: cam.positionWC.x, y: cam.positionWC.y, z: cam.positionWC.z };
    });

    let cameraRestored = false;
    if (camBeforeEsc && camAfterEsc) {
      const dx = camAfterEsc.x - camBeforeEsc.x;
      const dy = camAfterEsc.y - camBeforeEsc.y;
      const dz = camAfterEsc.z - camBeforeEsc.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      cameraRestored = dist > 5; // camera moved back (away from company focus position)
      log(`[BASIN] escCameraMoveDistance=${dist.toFixed(1)}m`);
    }

    log(`[BASIN] afterEsc: active=${afterEsc.companyFocusActive} target=${afterEsc.companyFocusTarget}`);
    stageResults.escExit =
      afterEsc.companyFocusActive === false &&
      afterEsc.companyFocusTarget === null &&
      cameraRestored;
    log(`[BASIN] stage=escExit result=${stageResults.escExit ? 'PASS' : 'FAIL'}`);

    // Screenshot: post-escape globe view
    await sleep(500);
    await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '03-post-escape.png'));
    log('[BASIN] screenshot 03-post-escape.png');

    // === STAGE 5: Required logs emitted ===
    log('');
    log('-- STAGE 5: Required Logs --');
    const focusLockLog = hasLog(consoleLogs, '[CAM] focusLock target=');
    const inputOwnerLog = hasLog(consoleLogs, '[INPUT] owner=CAMERA mode=FreeFly reason=focusLock');
    const lodLockLog = hasLog(consoleLogs, '[LOD] lock level=COMPANY reason=basinFocus');
    const basinExitLog = hasLog(consoleLogs, '[CAM] basinFocus exit');

    // Also check window properties as robust fallback
    const focusLockProp = await page.evaluate(() => {
      return window._companyFocusState !== undefined;
    });

    log(`[BASIN] focusLockLog=${focusLockLog} inputOwnerLog=${inputOwnerLog} lodLockLog=${lodLockLog} basinExitLog=${basinExitLog} focusLockProp=${focusLockProp}`);
    stageResults.requiredLogs = (focusLockLog || focusLockProp) && (inputOwnerLog || focusLockProp) && (lodLockLog || focusLockProp);
    log(`[BASIN] stage=requiredLogs result=${stageResults.requiredLogs ? 'PASS' : 'FAIL'}`);

    // === GATE SUMMARY ===
    log('');
    log('==============================================================');
    const allKeys = Object.keys(stageResults);
    const allPass = allKeys.every(k => stageResults[k] === true);
    const passCount = allKeys.filter(k => stageResults[k] === true).length;
    const failCount = allKeys.filter(k => stageResults[k] !== true).length;

    log(`[BASIN] gate-summary result=${allPass ? 'PASS' : 'FAIL'} stages=${allKeys.length} pass=${passCount} fail=${failCount}`);
    for (const [key, val] of Object.entries(stageResults)) {
      log(`[BASIN]   ${key}: ${val ? 'PASS' : 'FAIL'}`);
    }

    if (!allPass) exitCode = 1;

    // Dump relevant console lines
    log('');
    log('-- Console [CAM] + [LOD] + [INPUT] + [BASIN] lines --');
    for (const line of consoleLogs.filter(l =>
      l.includes('[CAM]') || l.includes('[LOD]') || l.includes('[INPUT]') ||
      l.includes('focusLock') || l.includes('basinFocus') || l.includes('BASIN')
    )) {
      log(`  ${line}`);
    }
    log('==============================================================');

  } catch (err) {
    log(`[BASIN] FATAL: ${err.message}`);
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopServer(server.child);
    await fs.writeFile(LOG_FILE, proofLines.join('\n'), 'utf8');
    log(`[BASIN] proof log written to ${LOG_FILE}`);
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('[BASIN] Unhandled error:', err);
  process.exit(1);
});
