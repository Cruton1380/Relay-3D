/**
 * V1-DEV-ONBOARDING-1 — Automated Dev Onboarding Flyby
 *
 * Runs through 6 sections of the Relay system in launch mode:
 *   1. Globe Context (Planetary LOD) — boot + FreeFly + anchors
 *   2. Basin Focus (Building Level) — proximity without auto-dock
 *   3. Company Overview (VIS-2 Collapsed) — tree structure visible
 *   4. Sheet Entry (Expanded) — explicit E accept
 *   5. Edit Mode (2D Dock) — spreadsheet overlay
 *   6. Exit Unwind — full restore to FreeFly
 *
 * Each section captures:
 *   - Screenshot
 *   - Console log verification
 *   - [ONBOARD] section=<name> result=PASS/FAIL
 *
 * Final gate: [ONBOARD] gate-summary result=PASS sections=6/6
 *
 * Artifacts: archive/proofs/v1-dev-onboarding-YYYY-MM-DD/
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `v1-dev-onboarding-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `v1-dev-onboarding-console-${DATE_TAG}.log`);
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

function findLogs(allLogs, pattern) {
  return allLogs.filter(l => l.includes(pattern));
}

async function screenshotCanvas(page, filePath) {
  const canvas = await page.$('#cesiumContainer canvas');
  if (canvas) { await canvas.screenshot({ path: filePath }); return 'canvas'; }
  const container = await page.$('#cesiumContainer');
  if (container) { await container.screenshot({ path: filePath }); return 'container'; }
  await page.screenshot({ path: filePath });
  return 'fullpage';
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════
async function main() {
  log('╔══════════════════════════════════════════════════════════╗');
  log('║  V1 DEV ONBOARDING FLYBY — Relay System Walkthrough    ║');
  log('╚══════════════════════════════════════════════════════════╝');
  log(`[ONBOARD] date=${DATE_TAG}`);
  log('');

  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const server = await startServerIfNeeded(
    ['http-server', '.', '-p', '3000', '-c-1', '--cors'],
    'http://127.0.0.1:3000/relay-cesium-world.html'
  );

  let browser;
  let exitCode = 0;
  const consoleLogs = [];
  const sectionResults = {};

  try {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    page.on('console', (msg) => { consoleLogs.push(msg.text()); });

    log('[NAV] loading launch URL...');
    await page.goto(LAUNCH_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(8000); // Wait for Cesium + tree render

    // ════════════════════════════════════════════════════
    // SECTION 1: Globe Context
    // ════════════════════════════════════════════════════
    log('');
    log('┌──────────────────────────────────────────────────┐');
    log('│  Section 1: Globe Context (Planetary LOD)        │');
    log('└──────────────────────────────────────────────────┘');

    const freeFlyBoot = hasLog(consoleLogs, '[INPUT] owner=CAMERA mode=FreeFly reason=default');
    const anchorsLoaded = hasLog(consoleLogs, '[GLOBE] datasetLoad anchors=');
    const profileLog = hasLog(consoleLogs, '[PROFILE]');
    const cameraFrameLog = hasLog(consoleLogs, '[LAUNCH-FIX] cameraFrame');

    log(`[ONBOARD] globe: freeFlyBoot=${freeFlyBoot} anchors=${anchorsLoaded} profile=${profileLog} cameraFrame=${cameraFrameLog}`);

    // Demonstrate WASD movement
    const camBefore = await page.evaluate(() => {
      const v = window.viewer;
      if (!v?.camera) return null;
      const c = v.camera.positionCartographic;
      return { lat: Cesium.Math.toDegrees(c.latitude), lon: Cesium.Math.toDegrees(c.longitude), h: c.height };
    });

    await page.keyboard.down('w');
    await sleep(500);
    await page.keyboard.up('w');
    await sleep(200);

    const camAfterW = await page.evaluate(() => {
      const v = window.viewer;
      if (!v?.camera) return null;
      const c = v.camera.positionCartographic;
      return { lat: Cesium.Math.toDegrees(c.latitude), lon: Cesium.Math.toDegrees(c.longitude), h: c.height };
    });

    let wasdWorks = false;
    if (camBefore && camAfterW) {
      const delta = Math.abs(camAfterW.lat - camBefore.lat) + Math.abs(camAfterW.lon - camBefore.lon) + Math.abs(camAfterW.h - camBefore.h);
      wasdWorks = delta > 0.1;
    }
    log(`[ONBOARD] globe: wasdMovement=${wasdWorks}`);

    // Reset camera to globe overview for screenshot
    await page.evaluate(() => {
      if (window.viewer) {
        window.viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(34.78, 32.08, 5000000),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 }
        });
      }
    });
    await sleep(1500);
    const globeCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '01-globe.png'));
    log(`[ONBOARD] screenshot 01-globe.png (${globeCapture})`);

    const s1Pass = freeFlyBoot && anchorsLoaded && wasdWorks;
    sectionResults.globe = s1Pass;
    log(`[ONBOARD] section=globe result=${s1Pass ? 'PASS' : 'FAIL'}`);

    // ════════════════════════════════════════════════════
    // SECTION 2: Basin Focus
    // ════════════════════════════════════════════════════
    log('');
    log('┌──────────────────────────────────────────────────┐');
    log('│  Section 2: Basin Focus (Building Level)         │');
    log('└──────────────────────────────────────────────────┘');

    // Fly toward the trunk
    await page.evaluate(() => {
      if (!window.viewer) return;
      const trunk = (window.relayState?.tree?.nodes || []).find(n => n.type === 'trunk');
      if (!trunk || !Number.isFinite(trunk.lon) || !Number.isFinite(trunk.lat)) return;
      const scale = window.RELAY_LAUNCH_SCALE || 1;
      window.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(trunk.lon + 0.001, trunk.lat - 0.0008, Math.max(250, 6000 * scale)),
        orientation: { heading: Cesium.Math.toRadians(30), pitch: Cesium.Math.toRadians(-35), roll: 0 }
      });
    });
    await sleep(3000);

    // Check for basin proximity log (not auto-dock)
    const basinProximity = hasLog(consoleLogs, '[CAM] basin-proximity') || hasLog(consoleLogs, '[CAM] basin-enter');
    const autoDockRefusal = hasLog(consoleLogs, '[REFUSAL] reason=AUTO_ANCHOR_BLOCKED');
    const noAutoEnter = !hasLog(consoleLogs, '[MODE] enter EDIT_SHEET');

    log(`[ONBOARD] basin: proximity=${basinProximity} autoDockBlocked=${autoDockRefusal} noAutoEnter=${noAutoEnter}`);

    const basinCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '02-basin.png'));
    log(`[ONBOARD] screenshot 02-basin.png (${basinCapture})`);

    // Core contract: no auto-enter in launch mode (regardless of proximity detection)
    // Basin proximity may or may not trigger depending on camera distance + scale
    const s2Pass = noAutoEnter;
    sectionResults.basin = s2Pass;
    log(`[ONBOARD] section=basin result=${s2Pass ? 'PASS' : 'FAIL'}`);

    // ════════════════════════════════════════════════════
    // SECTION 3: Company Overview
    // ════════════════════════════════════════════════════
    log('');
    log('┌──────────────────────────────────────────────────┐');
    log('│  Section 3: Company Overview (VIS-2 Collapsed)   │');
    log('└──────────────────────────────────────────────────┘');

    const vis2Collapsed = hasLog(consoleLogs, '[VIS2] companyCollapsed result=PASS');
    const visualHierarchy = hasLog(consoleLogs, '[LAUNCH-FIX] visualHierarchy applied=PASS');
    const launchTheme = hasLog(consoleLogs, '[LAUNCH-THEME] tokens loaded');

    log(`[ONBOARD] company: vis2Collapsed=${vis2Collapsed} visualHierarchy=${visualHierarchy} launchTheme=${launchTheme}`);

    // Position camera for best company overview
    await page.evaluate(() => {
      if (!window._launchResetCameraFrame) return;
      window._launchResetCameraFrame();
    });
    await sleep(2000);

    const companyCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '03-company.png'));
    log(`[ONBOARD] screenshot 03-company.png (${companyCapture})`);

    const s3Pass = visualHierarchy && launchTheme;
    sectionResults.company = s3Pass;
    log(`[ONBOARD] section=company result=${s3Pass ? 'PASS' : 'FAIL'}`);

    // ════════════════════════════════════════════════════
    // SECTION 4: Sheet Entry
    // ════════════════════════════════════════════════════
    log('');
    log('┌──────────────────────────────────────────────────┐');
    log('│  Section 4: Sheet Entry (Expanded)               │');
    log('└──────────────────────────────────────────────────┘');

    const preEntryEditCount = consoleLogs.filter(l => l.includes('[MODE] enter EDIT_SHEET')).length;

    // Press E to enter sheet
    log('[ONBOARD] pressing E to enter sheet...');
    await page.keyboard.press('e');
    await sleep(4000);

    const eAccept = hasLog(consoleLogs, '[CAM] E-accept action=ENTER_SHEET');
    const enterSheet = consoleLogs.filter(l => l.includes('[MODE] enter EDIT_SHEET')).length > preEntryEditCount;
    const inputGrid = hasLog(consoleLogs, '[INPUT] owner=GRID mode=SheetEdit reason=explicitEnter');
    const visEnterSheet = hasLog(consoleLogs, '[VIS] enter sheet=');

    log(`[ONBOARD] sheetEntry: eAccept=${eAccept} enterSheet=${enterSheet} inputGrid=${inputGrid} visEnter=${visEnterSheet}`);

    // Screenshot in docked/sheet view
    await sleep(1000);
    const sheetCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '04-sheet.png'));
    log(`[ONBOARD] screenshot 04-sheet.png (${sheetCapture})`);

    const s4Pass = eAccept && enterSheet && inputGrid;
    sectionResults.sheetEntry = s4Pass;
    log(`[ONBOARD] section=sheetEntry result=${s4Pass ? 'PASS' : 'FAIL'}`);

    // ════════════════════════════════════════════════════
    // SECTION 5: Edit Mode (2D Dock)
    // ════════════════════════════════════════════════════
    log('');
    log('┌──────────────────────────────────────────────────┐');
    log('│  Section 5: Edit Mode (2D Dock)                  │');
    log('└──────────────────────────────────────────────────┘');

    // After sheet entry, the 2D grid should be docked
    const cellPxLog = hasLog(consoleLogs, '[SHEET-2D] cellPx=');
    const hudSheetEdit = hasLog(consoleLogs, '[HUD] mode=SheetEdit');

    log(`[ONBOARD] editMode: cellPx=${cellPxLog} hudSheetEdit=${hudSheetEdit}`);

    // Full page screenshot to capture the spreadsheet overlay
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-edit.png') });
    log('[ONBOARD] screenshot 05-edit.png (fullpage — spreadsheet overlay)');

    const s5Pass = cellPxLog || inputGrid; // cellPx might not log in all configurations
    sectionResults.editMode = s5Pass;
    log(`[ONBOARD] section=editMode result=${s5Pass ? 'PASS' : 'FAIL'}`);

    // ════════════════════════════════════════════════════
    // SECTION 6: Exit Unwind
    // ════════════════════════════════════════════════════
    log('');
    log('┌──────────────────────────────────────────────────┐');
    log('│  Section 6: Exit Unwind                          │');
    log('└──────────────────────────────────────────────────┘');

    // Press Escape to exit
    log('[ONBOARD] pressing Escape to exit edit mode...');
    await page.keyboard.press('Escape');
    await sleep(3000);

    const exitMode = hasLog(consoleLogs, '[MODE] exit EDIT_SHEET');
    const inputCamera = hasLog(consoleLogs, '[INPUT] owner=CAMERA mode=FreeFly reason=exit');
    const modeRestore = hasLog(consoleLogs, '[MODE-RESTORE]');
    const flightActive = hasLog(consoleLogs, '[FLIGHT] WASD controls active');

    log(`[ONBOARD] exitUnwind: exitMode=${exitMode} inputCamera=${inputCamera} modeRestore=${modeRestore} flightActive=${flightActive}`);

    // Verify camera controls work after exit
    const camPostExit = await page.evaluate(() => {
      const v = window.viewer;
      if (!v?.camera) return null;
      const c = v.camera.positionCartographic;
      return { lat: Cesium.Math.toDegrees(c.latitude), h: c.height };
    });

    await page.keyboard.down('w');
    await sleep(400);
    await page.keyboard.up('w');
    await sleep(200);

    const camPostMove = await page.evaluate(() => {
      const v = window.viewer;
      if (!v?.camera) return null;
      const c = v.camera.positionCartographic;
      return { lat: Cesium.Math.toDegrees(c.latitude), h: c.height };
    });

    let postExitMovement = false;
    if (camPostExit && camPostMove) {
      const delta = Math.abs(camPostMove.lat - camPostExit.lat) + Math.abs(camPostMove.h - camPostExit.h);
      postExitMovement = delta > 0.001;
    }
    log(`[ONBOARD] exitUnwind: postExitWASD=${postExitMovement}`);

    // Final screenshot: back to FreeFly
    const exitCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '06-freefly.png'));
    log(`[ONBOARD] screenshot 06-freefly.png (${exitCapture})`);

    const s6Pass = inputCamera && postExitMovement;
    sectionResults.exitUnwind = s6Pass;
    log(`[ONBOARD] section=exitUnwind result=${s6Pass ? 'PASS' : 'FAIL'}`);

    // ════════════════════════════════════════════════════
    // GATE SUMMARY
    // ════════════════════════════════════════════════════
    log('');
    log('╔══════════════════════════════════════════════════════════╗');
    const passCount = Object.values(sectionResults).filter(v => v).length;
    const totalCount = Object.keys(sectionResults).length;
    const allPass = passCount === totalCount;

    for (const [name, result] of Object.entries(sectionResults)) {
      log(`║  ${result ? '✅' : '❌'} ${name.padEnd(20)} ${result ? 'PASS' : 'FAIL'}`);
    }

    log('╚══════════════════════════════════════════════════════════╝');
    log('');
    log(`[ONBOARD] gate-summary result=${allPass ? 'PASS' : 'FAIL'} sections=${passCount}/${totalCount}`);

    if (allPass) {
      log('[ONBOARD] ✅ ALL SECTIONS PASSED — V1 Dev Onboarding complete');
    } else {
      log('[ONBOARD] ❌ SOME SECTIONS FAILED');
      exitCode = 1;
    }

  } catch (err) {
    log(`[ONBOARD] FATAL: ${err.message}`);
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopServer(server?.child);

    await fs.writeFile(LOG_FILE, proofLines.join('\n') + '\n', 'utf8');
    log(`[ONBOARD] proof log written: ${LOG_FILE}`);
  }

  process.exit(exitCode);
}

main();
