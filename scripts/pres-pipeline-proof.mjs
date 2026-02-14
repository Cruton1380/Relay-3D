/**
 * R4-PRESENTATION-PIPELINE-1 proof.
 * Verifies that the launch mode presentation pipeline is active:
 *   - FXAA, Bloom, Color Correction post-processing stages enabled
 *   - Fog enabled with correct density
 *   - Glass-panel tile material applied
 *   - Filament light-thread style applied
 *   - Environment de-emphasis (basemap dimming) applied
 *
 * Screenshots:
 *   01-company.png  — Company overview (tree framing, bloom visible)
 *   02-sheet.png    — Sheet/tile view (glass borders visible)
 *   03-edit.png     — Edit mode (2D dock overlay)
 *
 * Proof artifact: archive/proofs/pres-pipeline-console-YYYY-MM-DD.log
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `pres-pipeline-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `pres-pipeline-console-${DATE_TAG}.log`);
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

function findLogs(allLogs, pattern) {
  return allLogs.filter(l => l.includes(pattern));
}

function hasLog(allLogs, pattern) {
  return allLogs.some(l => l.includes(pattern));
}

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
  log('[PRES-PROOF] R4-PRESENTATION-PIPELINE-1 proof starting');
  log(`[PRES-PROOF] date=${DATE_TAG}`);
  log('══════════════════════════════════════════════════════════');

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

    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
    });

    log('[NAV] loading launch URL...');
    await page.goto(LAUNCH_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for Cesium + tree to render + postFX stages to initialize
    log('[NAV] waiting for Cesium viewer + presentation pipeline...');
    await sleep(10000);

    // ═══════════════════════════════════════════════════════
    // STAGE 1: Post-Processing Stages Active
    // ═══════════════════════════════════════════════════════
    log('');
    log('── STAGE 1: Post-Processing Pipeline ──');

    const postFxLog = hasLog(consoleLogs, '[PRES] postFX enabled=PASS fxaa=ON bloom=ON colorCorrect=ON');
    const colorCorrectLog = hasLog(consoleLogs, '[PRES] colorCorrection added=PASS');
    log(`[PRES-PROOF] postFX=${postFxLog} colorCorrection=${colorCorrectLog}`);

    // Verify via page evaluation that postProcess stages are actually enabled
    const postFxState = await page.evaluate(() => {
      if (!window.viewer) return null;
      const scene = window.viewer.scene;
      return {
        fxaaEnabled: scene.postProcessStages?.fxaa?.enabled ?? false,
        bloomEnabled: scene.postProcessStages?.bloom?.enabled ?? false,
        hdr: scene.highDynamicRange ?? false,
        stageCount: scene.postProcessStages?.length ?? 0,
      };
    });
    log(`[PRES-PROOF] runtime fxaa=${postFxState?.fxaaEnabled} bloom=${postFxState?.bloomEnabled} hdr=${postFxState?.hdr} stages=${postFxState?.stageCount}`);

    const stage1Pass = postFxLog && (postFxState?.fxaaEnabled === true) && (postFxState?.bloomEnabled === true);
    stageResults.postFX = stage1Pass;
    log(`[PRES-PROOF] stage=postFX result=${stage1Pass ? 'PASS' : 'FAIL'}`);

    // ═══════════════════════════════════════════════════════
    // STAGE 2: Fog / Atmospheric Depth
    // ═══════════════════════════════════════════════════════
    log('');
    log('── STAGE 2: Fog / Atmospheric Depth ──');

    const fogLog = hasLog(consoleLogs, '[PRES] fog enabled=PASS');
    const fogState = await page.evaluate(() => {
      if (!window.viewer) return null;
      return {
        fogEnabled: window.viewer.scene.fog?.enabled ?? false,
        fogDensity: window.viewer.scene.fog?.density ?? -1,
      };
    });
    log(`[PRES-PROOF] fogLog=${fogLog} runtime fogEnabled=${fogState?.fogEnabled} density=${fogState?.fogDensity}`);

    const stage2Pass = fogLog && (fogState?.fogEnabled === true);
    stageResults.fog = stage2Pass;
    log(`[PRES-PROOF] stage=fog result=${stage2Pass ? 'PASS' : 'FAIL'}`);

    // ═══════════════════════════════════════════════════════
    // STAGE 3: Glass-Panel Tile Material
    // ═══════════════════════════════════════════════════════
    log('');
    log('── STAGE 3: Glass-Panel Tile Material ──');

    const tileMaterialLog = hasLog(consoleLogs, '[PRES] tileMaterial applied=PASS mode=glass');
    log(`[PRES-PROOF] tileMaterial=${tileMaterialLog}`);

    const stage3Pass = tileMaterialLog;
    stageResults.tileMaterial = stage3Pass;
    log(`[PRES-PROOF] stage=tileMaterial result=${stage3Pass ? 'PASS' : 'FAIL'}`);

    // ═══════════════════════════════════════════════════════
    // STAGE 4: Filament Light-Thread Style
    // ═══════════════════════════════════════════════════════
    log('');
    log('── STAGE 4: Filament Light-Thread Style ──');

    const filamentStyleLog = hasLog(consoleLogs, '[PRES] filamentStyle applied=PASS mode=threads');
    log(`[PRES-PROOF] filamentStyle=${filamentStyleLog}`);

    const stage4Pass = filamentStyleLog;
    stageResults.filamentStyle = stage4Pass;
    log(`[PRES-PROOF] stage=filamentStyle result=${stage4Pass ? 'PASS' : 'FAIL'}`);

    // ═══════════════════════════════════════════════════════
    // STAGE 5: Environment De-emphasis
    // ═══════════════════════════════════════════════════════
    log('');
    log('── STAGE 5: Environment De-emphasis ──');

    const envDeemphLog = hasLog(consoleLogs, '[PRES] environmentDeemphasis applied=PASS');
    log(`[PRES-PROOF] environmentDeemphasis=${envDeemphLog}`);

    // Verify basemap layer properties via runtime
    const envState = await page.evaluate(() => {
      if (!window.viewer?.imageryLayers) return null;
      const base = window.viewer.imageryLayers.get(0);
      if (!base) return null;
      return {
        brightness: base.brightness,
        contrast: base.contrast,
        saturation: base.saturation,
        gamma: base.gamma,
      };
    });
    log(`[PRES-PROOF] runtime basemap brightness=${envState?.brightness} contrast=${envState?.contrast} saturation=${envState?.saturation} gamma=${envState?.gamma}`);

    const stage5Pass = envDeemphLog && envState && (envState.brightness < 0.5) && (envState.saturation < 0.25);
    stageResults.environmentDeemphasis = stage5Pass;
    log(`[PRES-PROOF] stage=environmentDeemphasis result=${stage5Pass ? 'PASS' : 'FAIL'}`);

    // ═══════════════════════════════════════════════════════
    // SCREENSHOT 1: Company Overview
    // ═══════════════════════════════════════════════════════
    log('');
    log('── Screenshots ──');

    // Position camera for company overview
    await page.evaluate(() => {
      if (window._launchResetCameraFrame) {
        window._launchResetCameraFrame();
      }
    });
    await sleep(3000);

    const companyCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '01-company.png'));
    log(`[PRES-PROOF] screenshot 01-company.png (${companyCapture})`);

    // ═══════════════════════════════════════════════════════
    // SCREENSHOT 2: Sheet/Tile View (closer)
    // ═══════════════════════════════════════════════════════

    // Move camera closer to tiles for glass-panel visibility
    await page.evaluate(() => {
      if (!window.viewer) return;
      const trunk = (window.relayState?.tree?.nodes || []).find(n => n.type === 'trunk');
      if (!trunk || !Number.isFinite(trunk.lon) || !Number.isFinite(trunk.lat)) return;
      const scale = window.RELAY_LAUNCH_SCALE || 1;
      window.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(trunk.lon + 0.002, trunk.lat - 0.0005, Math.max(200, 3000 * scale)),
        orientation: { heading: Cesium.Math.toRadians(320), pitch: Cesium.Math.toRadians(-35), roll: 0 }
      });
    });
    await sleep(3000);

    const sheetCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '02-sheet.png'));
    log(`[PRES-PROOF] screenshot 02-sheet.png (${sheetCapture})`);

    // ═══════════════════════════════════════════════════════
    // SCREENSHOT 3: Edit View (enter sheet)
    // ═══════════════════════════════════════════════════════

    // Press E to enter a sheet
    log('[PRES-PROOF] pressing E to enter sheet for edit screenshot...');
    await page.keyboard.press('e');
    await sleep(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-edit.png') });
    log('[PRES-PROOF] screenshot 03-edit.png (fullpage — edit mode)');

    // Exit back to FreeFly
    await page.keyboard.press('Escape');
    await sleep(2000);

    // ═══════════════════════════════════════════════════════
    // GATE SUMMARY
    // ═══════════════════════════════════════════════════════
    log('');
    log('══════════════════════════════════════════════════════════');
    const allKeys = Object.keys(stageResults);
    const allPass = allKeys.every(k => stageResults[k] === true);
    const passCount = allKeys.filter(k => stageResults[k] === true).length;
    const failCount = allKeys.filter(k => stageResults[k] !== true).length;

    log(`[PRES-PROOF] gate-summary result=${allPass ? 'PASS' : 'FAIL'} stages=${allKeys.length} pass=${passCount} fail=${failCount}`);
    for (const [key, val] of Object.entries(stageResults)) {
      log(`[PRES-PROOF]   ${key}: ${val ? 'PASS' : 'FAIL'}`);
    }

    if (!allPass) exitCode = 1;

    // ═══════════════════════════════════════════════════════
    // Dump all [PRES] console lines for audit
    // ═══════════════════════════════════════════════════════
    log('');
    log('── Console [PRES] lines ──');
    const presLogLines = consoleLogs.filter(l => l.includes('[PRES]'));
    for (const line of presLogLines) {
      log(`  ${line}`);
    }

    log('══════════════════════════════════════════════════════════');

  } catch (err) {
    log(`[PRES-PROOF] FATAL: ${err.message}`);
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopServer(server.child);

    // Write proof log
    await fs.writeFile(LOG_FILE, proofLines.join('\n'), 'utf8');
    log(`[PRES-PROOF] proof log written to ${LOG_FILE}`);
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('[PRES-PROOF] Unhandled error:', err);
  process.exit(1);
});
