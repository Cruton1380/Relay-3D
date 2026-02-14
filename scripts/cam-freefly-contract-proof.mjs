/**
 * CAM-FREEFLY-CONTRACT-1 proof.
 * Verifies permanent FPS FreeFly control and opt-in-only anchoring.
 *
 * Stage A — Boot is FreeFly
 *   Asserts: [INPUT] owner=CAMERA mode=FreeFly reason=default
 *   Asserts: no sheet entry for 5 seconds after boot
 *
 * Stage B — Movement not stolen
 *   Simulates WASD key press for 500ms
 *   Asserts: camera position changed (heading or position delta)
 *
 * Stage C — Proximity auto-dock is blocked
 *   Teleports camera near a sheet, waits without pressing E
 *   Asserts: [REFUSAL] reason=AUTO_ANCHOR_BLOCKED
 *   Asserts: no [INPUT] owner=GRID without E press
 *
 * Stage D — E accept works
 *   Presses E to enter sheet
 *   Asserts: [CAM] E-accept action=ENTER_SHEET
 *   Asserts: [INPUT] owner=GRID mode=SheetEdit reason=explicitEnter
 *   Presses Escape to exit
 *   Asserts: [INPUT] owner=CAMERA mode=FreeFly reason=exit
 *
 * Screenshots:
 *   01-boot.png (FreeFly state on boot)
 *   02-proximity.png (near sheet but not docked)
 *   03-edit.png (after E accept, in sheet edit)
 *
 * Proof artifact: archive/proofs/cam-freefly-contract-console-YYYY-MM-DD.log
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `cam-freefly-contract-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `cam-freefly-contract-console-${DATE_TAG}.log`);
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
  log('[SERVER] starting dev server...');
  const child = spawn('npx', commandArgs, {
    cwd: ROOT,
    stdio: 'pipe',
    shell: true,
    detached: false,
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

// Helper: find console log lines matching a pattern
function findLogs(allLogs, pattern) {
  return allLogs.filter(l => l.includes(pattern));
}

function hasLog(allLogs, pattern) {
  return allLogs.some(l => l.includes(pattern));
}

// Screenshot the Cesium canvas only (for 3D views)
async function screenshotCanvas(page, filePath) {
  const canvas = await page.$('#cesiumContainer canvas');
  if (canvas) {
    await canvas.screenshot({ path: filePath });
    return 'canvas';
  }
  const container = await page.$('#cesiumContainer');
  if (container) {
    await container.screenshot({ path: filePath });
    return 'container';
  }
  await page.screenshot({ path: filePath });
  return 'fullpage';
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════
async function main() {
  log('══════════════════════════════════════════════════════════');
  log('[CAM-FREEFLY] CAM-FREEFLY-CONTRACT-1 proof starting');
  log(`[CAM-FREEFLY] date=${DATE_TAG}`);
  log('══════════════════════════════════════════════════════════');

  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  // Start server if needed
  const server = await startServerIfNeeded(
    ['http-server', '.', '-p', '3000', '-c-1', '--cors'],
    'http://127.0.0.1:3000/relay-cesium-world.html'
  );

  let browser;
  let exitCode = 0;
  const consoleLogs = [];

  try {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    // Collect all console messages
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
    });

    log('[NAV] loading launch URL...');
    await page.goto(LAUNCH_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for Cesium + tree to render
    log('[NAV] waiting for Cesium viewer + tree render...');
    await sleep(8000);

    // ═══════════════════════════════════════════════════════
    // STAGE A: Boot is FreeFly
    // ═══════════════════════════════════════════════════════
    log('');
    log('── STAGE A: Boot is FreeFly ──');

    const inputDefaultLog = hasLog(consoleLogs, '[INPUT] owner=CAMERA mode=FreeFly reason=default');
    log(`[CAM-FREEFLY] bootInputOwner=${inputDefaultLog ? 'CAMERA' : 'MISSING'}`);

    // Assert no sheet entry occurred in the first 8 seconds
    const eAcceptEarly = hasLog(consoleLogs, '[CAM] E-accept action=ENTER_SHEET');
    const gridOwnerEarly = hasLog(consoleLogs, '[INPUT] owner=GRID');
    const editOverrideEarly = hasLog(consoleLogs, '[LOD] editSheet override=ON');
    const enterSheetEarly = hasLog(consoleLogs, '[MODE] enter EDIT_SHEET');
    log(`[CAM-FREEFLY] noAutoSheetEntry eAccept=${eAcceptEarly} gridOwner=${gridOwnerEarly} editOverride=${editOverrideEarly} enterSheet=${enterSheetEarly}`);

    const stageA_pass = inputDefaultLog && !eAcceptEarly && !gridOwnerEarly && !editOverrideEarly && !enterSheetEarly;
    log(`[CAM-FREEFLY] stage=A result=${stageA_pass ? 'PASS' : 'FAIL'}`);

    // Screenshot: boot state
    const bootCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '01-boot.png'));
    log(`[CAM-FREEFLY] screenshot 01-boot.png (${bootCapture})`);

    // Wait another 5 seconds and re-check for auto-entry
    log('[CAM-FREEFLY] waiting 5s to confirm no auto-enter...');
    await sleep(5000);

    const enterSheetLate = consoleLogs.filter(l => l.includes('[MODE] enter EDIT_SHEET')).length;
    const autoEnterAfterWait = enterSheetLate > 0;
    log(`[CAM-FREEFLY] 5sAutoEnterCheck enterSheetCount=${enterSheetLate} autoEnter=${autoEnterAfterWait}`);

    // Check for REFUSAL log (auto-dock blocked)
    const refusalLogs = findLogs(consoleLogs, '[REFUSAL] reason=AUTO_ANCHOR_BLOCKED');
    if (refusalLogs.length > 0) {
      log(`[CAM-FREEFLY] autoDockBlocked=true refusals=${refusalLogs.length}`);
    }

    // ═══════════════════════════════════════════════════════
    // STAGE B: Movement not stolen
    // ═══════════════════════════════════════════════════════
    log('');
    log('── STAGE B: Movement not stolen ──');

    // Get camera position before movement
    const camBefore = await page.evaluate(() => {
      const v = window.viewer;
      if (!v || !v.camera) return null;
      const carto = v.camera.positionCartographic;
      return {
        lon: Cesium.Math.toDegrees(carto.longitude),
        lat: Cesium.Math.toDegrees(carto.latitude),
        height: carto.height,
        heading: v.camera.heading,
        pitch: v.camera.pitch
      };
    });
    log(`[CAM-FREEFLY] camBefore lon=${camBefore?.lon?.toFixed(5)} lat=${camBefore?.lat?.toFixed(5)} h=${camBefore?.height?.toFixed(0)} heading=${camBefore?.heading?.toFixed(4)}`);

    // Simulate W key press for 500ms (forward movement)
    await page.keyboard.down('w');
    await sleep(600);
    await page.keyboard.up('w');
    await sleep(300);

    // Get camera position after movement
    const camAfter = await page.evaluate(() => {
      const v = window.viewer;
      if (!v || !v.camera) return null;
      const carto = v.camera.positionCartographic;
      return {
        lon: Cesium.Math.toDegrees(carto.longitude),
        lat: Cesium.Math.toDegrees(carto.latitude),
        height: carto.height,
        heading: v.camera.heading,
        pitch: v.camera.pitch
      };
    });
    log(`[CAM-FREEFLY] camAfter lon=${camAfter?.lon?.toFixed(5)} lat=${camAfter?.lat?.toFixed(5)} h=${camAfter?.height?.toFixed(0)} heading=${camAfter?.heading?.toFixed(4)}`);

    let movementDelta = false;
    if (camBefore && camAfter) {
      const dLon = Math.abs(camAfter.lon - camBefore.lon);
      const dLat = Math.abs(camAfter.lat - camBefore.lat);
      const dH = Math.abs(camAfter.height - camBefore.height);
      const dHeading = Math.abs(camAfter.heading - camBefore.heading);
      movementDelta = (dLon > 0.00001 || dLat > 0.00001 || dH > 0.5 || dHeading > 0.001);
      log(`[CAM-FREEFLY] movement delta dLon=${dLon.toFixed(6)} dLat=${dLat.toFixed(6)} dH=${dH.toFixed(2)} dHeading=${dHeading.toFixed(6)}`);
    }
    log(`[CAM-FREEFLY] stage=B result=${movementDelta ? 'PASS' : 'FAIL'} movementDetected=${movementDelta}`);

    // ═══════════════════════════════════════════════════════
    // STAGE C: Proximity auto-dock is blocked
    // ═══════════════════════════════════════════════════════
    log('');
    log('── STAGE C: Proximity auto-dock is blocked ──');

    // Reset refusal log tracking
    const preProximityGridCount = consoleLogs.filter(l => l.includes('[INPUT] owner=GRID')).length;

    // Teleport camera very close to first sheet (within 550m dock distance)
    await page.evaluate(() => {
      const sheets = (window.relayState?.tree?.nodes || []).filter(n => n.type === 'sheet');
      const targetSheet = sheets.find(s => s._center) || null;
      if (!targetSheet || !targetSheet._center || !window.viewer) return 'NO_SHEET';

      // Move camera to 200m from the sheet center (well within dock range of 550m)
      const normal = targetSheet._renderNormal || targetSheet._normal || Cesium.Cartesian3.UNIT_Z;
      const normNorm = Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3());
      const offset = Cesium.Cartesian3.multiplyByScalar(normNorm, 200, new Cesium.Cartesian3());
      const camPos = Cesium.Cartesian3.add(targetSheet._center, offset, new Cesium.Cartesian3());

      window.viewer.camera.setView({
        destination: camPos,
        orientation: {
          direction: Cesium.Cartesian3.normalize(
            Cesium.Cartesian3.subtract(targetSheet._center, camPos, new Cesium.Cartesian3()),
            new Cesium.Cartesian3()
          ),
          up: Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
        }
      });
      return `TELEPORTED to sheet=${targetSheet.id || targetSheet.name || 'unknown'} dist=200m`;
    }).then(r => log(`[CAM-FREEFLY] proximity teleport: ${r}`));

    // Wait for proximity detection to fire (runs every frame)
    await sleep(3000);

    // Check: REFUSAL should appear, GRID ownership should NOT
    const refusalAfterProximity = findLogs(consoleLogs, '[REFUSAL] reason=AUTO_ANCHOR_BLOCKED');
    const gridOwnerAfterProximity = consoleLogs.filter(l => l.includes('[INPUT] owner=GRID')).length;
    const newGridOwner = gridOwnerAfterProximity - preProximityGridCount;

    log(`[CAM-FREEFLY] proximityRefusals=${refusalAfterProximity.length} newGridOwnerEvents=${newGridOwner}`);

    const stageC_pass = refusalAfterProximity.length > 0 && newGridOwner === 0;
    log(`[CAM-FREEFLY] stage=C result=${stageC_pass ? 'PASS' : 'FAIL'} refusalLogged=${refusalAfterProximity.length > 0} noGridEntry=${newGridOwner === 0}`);

    // Screenshot: near sheet but not docked
    const proxCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '02-proximity.png'));
    log(`[CAM-FREEFLY] screenshot 02-proximity.png (${proxCapture})`);

    // ═══════════════════════════════════════════════════════
    // STAGE D: E accept works
    // ═══════════════════════════════════════════════════════
    log('');
    log('── STAGE D: E accept works ──');

    const preEGridCount = consoleLogs.filter(l => l.includes('[INPUT] owner=GRID')).length;

    // Press E to enter sheet
    log('[CAM-FREEFLY] pressing E to enter sheet...');
    await page.keyboard.press('e');
    await sleep(4000);

    // Check for E-accept log
    const eAcceptLog = hasLog(consoleLogs, '[CAM] E-accept action=ENTER_SHEET');
    const gridOwnerLog = consoleLogs.filter(l => l.includes('[INPUT] owner=GRID mode=SheetEdit reason=explicitEnter')).length;
    const enterSheetLog = hasLog(consoleLogs, '[MODE] enter EDIT_SHEET');

    log(`[CAM-FREEFLY] eAccept=${eAcceptLog} gridOwner=${gridOwnerLog > 0} enterSheet=${enterSheetLog}`);

    const stageD_enter = eAcceptLog && gridOwnerLog > 0 && enterSheetLog;
    log(`[CAM-FREEFLY] stage=D enterResult=${stageD_enter ? 'PASS' : 'FAIL'}`);

    // Screenshot: in edit mode
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-edit.png') });
    log('[CAM-FREEFLY] screenshot 03-edit.png (fullpage — edit overlay)');

    // Press Escape to exit
    log('[CAM-FREEFLY] pressing Escape to exit...');
    await page.keyboard.press('Escape');
    await sleep(2000);

    // Check for exit logs
    const exitInputLog = hasLog(consoleLogs, '[INPUT] owner=CAMERA mode=FreeFly reason=exit');
    const exitModeLog = hasLog(consoleLogs, '[MODE] exit EDIT_SHEET');

    log(`[CAM-FREEFLY] exitInputOwner=${exitInputLog} exitMode=${exitModeLog}`);

    const stageD_exit = exitInputLog;
    log(`[CAM-FREEFLY] stage=D exitResult=${stageD_exit ? 'PASS' : 'FAIL'}`);

    const stageD_pass = stageD_enter && stageD_exit;
    log(`[CAM-FREEFLY] stage=D result=${stageD_pass ? 'PASS' : 'FAIL'}`);

    // ═══════════════════════════════════════════════════════
    // GATE SUMMARY
    // ═══════════════════════════════════════════════════════
    log('');
    log('══════════════════════════════════════════════════════════');
    const allPass = stageA_pass && !autoEnterAfterWait && movementDelta && stageC_pass && stageD_pass;
    log(`[CAM-FREEFLY] gate-summary result=${allPass ? 'PASS' : 'FAIL'} stageA=${stageA_pass ? 'PASS' : 'FAIL'} stageB=${movementDelta ? 'PASS' : 'FAIL'} stageC=${stageC_pass ? 'PASS' : 'FAIL'} stageD=${stageD_pass ? 'PASS' : 'FAIL'}`);

    if (allPass) {
      log('[CAM-FREEFLY] ✅ ALL STAGES PASSED');
    } else {
      log('[CAM-FREEFLY] ❌ SOME STAGES FAILED');
      exitCode = 1;
    }

    // Note: presentation-only alpha adjustment scope
    log('');
    log('[CAM-FREEFLY] scope-note: filament-renderer.js touched for presentation-only alpha adjustment (launch theme)');
    log('[CAM-FREEFLY] scope-note: freefly contract currently applies to launch profile only (RELAY_LAUNCH_MODE)');

  } catch (err) {
    log(`[CAM-FREEFLY] FATAL: ${err.message}`);
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopServer(server?.child);

    // Write proof log
    await fs.writeFile(LOG_FILE, proofLines.join('\n') + '\n', 'utf8');
    log(`[CAM-FREEFLY] proof log written: ${LOG_FILE}`);
  }

  process.exit(exitCode);
}

main();
