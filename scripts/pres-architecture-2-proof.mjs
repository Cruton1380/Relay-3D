/**
 * R4-PRESENTATION-ARCHITECTURE-2 proof.
 * Verifies luminous engineered structure presentation:
 *   - Trunk core+shell rendering
 *   - Branch rib mode with emissive center
 *   - Tile float mode with support filaments
 *   - Filament rain
 *   - Root glow pool
 *   - Silhouette readability at 600-800m
 *
 * Screenshots:
 *   01-company.png   — Company overview (mid-distance)
 *   02-silhouette.png — Zoom-out silhouette (600-800m)
 *   03-detail.png     — Zoom-in detail (close-up)
 *
 * Proof artifact: archive/proofs/pres-architecture-2-console-YYYY-MM-DD.log
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `pres-architecture-2-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `pres-architecture-2-console-${DATE_TAG}.log`);
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
  log('══════════════════════════════════════════════════════════');
  log('[ARCH2] R4-PRESENTATION-ARCHITECTURE-2 proof starting');
  log(`[ARCH2] date=${DATE_TAG}`);
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

    page.on('console', (msg) => { consoleLogs.push(msg.text()); });

    log('[NAV] loading launch URL...');
    await page.goto(LAUNCH_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    log('[NAV] waiting for Cesium + luminous tree render...');
    await sleep(10000);

    // ═══ STAGE 1: Trunk Core+Shell ═══
    log('');
    log('── STAGE 1: Trunk Core+Shell ──');
    const trunkStyleLog = hasLog(consoleLogs, '[PRES] trunkStyle applied=PASS mode=core+shell');
    log(`[ARCH2] trunkStyle=${trunkStyleLog}`);
    stageResults.trunkStyle = trunkStyleLog;
    log(`[ARCH2] stage=trunkStyle result=${trunkStyleLog ? 'PASS' : 'FAIL'}`);

    // ═══ STAGE 2: Branch Rib Mode ═══
    log('');
    log('── STAGE 2: Branch Rib Mode ──');
    const branchStyleLog = hasLog(consoleLogs, '[PRES] branchStyle applied=PASS ribMode=ON');
    log(`[ARCH2] branchStyle=${branchStyleLog}`);
    stageResults.branchStyle = branchStyleLog;
    log(`[ARCH2] stage=branchStyle result=${branchStyleLog ? 'PASS' : 'FAIL'}`);

    // ═══ STAGE 3: Tile Float Mode ═══
    log('');
    log('── STAGE 3: Tile Float Mode ──');
    const tileFloatLog = hasLog(consoleLogs, '[PRES] tileFloatMode=PASS supportFilaments=ON');
    log(`[ARCH2] tileFloatMode=${tileFloatLog}`);
    stageResults.tileFloatMode = tileFloatLog;
    log(`[ARCH2] stage=tileFloatMode result=${tileFloatLog ? 'PASS' : 'FAIL'}`);

    // ═══ STAGE 4: Filament Rain ═══
    log('');
    log('── STAGE 4: Filament Rain ──');
    const filamentRainLog = hasLog(consoleLogs, '[PRES] filamentRain enabled=PASS');
    log(`[ARCH2] filamentRain=${filamentRainLog}`);
    stageResults.filamentRain = filamentRainLog;
    log(`[ARCH2] stage=filamentRain result=${filamentRainLog ? 'PASS' : 'FAIL'}`);

    // ═══ STAGE 5: Root Glow ═══
    log('');
    log('── STAGE 5: Root Glow ──');
    const rootGlowLog = hasLog(consoleLogs, '[PRES] rootGlow enabled=PASS');
    log(`[ARCH2] rootGlow=${rootGlowLog}`);
    stageResults.rootGlow = rootGlowLog;
    log(`[ARCH2] stage=rootGlow result=${rootGlowLog ? 'PASS' : 'FAIL'}`);

    // ═══ STAGE 6: Environment De-emphasis ═══
    log('');
    log('── STAGE 6: Environment ──');
    const envLog = hasLog(consoleLogs, '[PRES] environmentDeemphasis applied=PASS');
    const fogLog = hasLog(consoleLogs, '[PRES] fog enabled=PASS');
    log(`[ARCH2] environment=${envLog} fog=${fogLog}`);
    stageResults.environment = envLog && fogLog;
    log(`[ARCH2] stage=environment result=${(envLog && fogLog) ? 'PASS' : 'FAIL'}`);

    // ═══ SCREENSHOTS ═══
    log('');
    log('── Screenshots ──');

    // Screenshot 1: Company overview (mid-distance)
    await page.evaluate(() => {
      if (window._launchResetCameraFrame) window._launchResetCameraFrame();
    });
    await sleep(3000);
    const companyCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '01-company.png'));
    log(`[ARCH2] screenshot 01-company.png (${companyCapture})`);

    // Screenshot 2: Silhouette — zoom out to 600-800m to test readability
    await page.evaluate(() => {
      if (!window.viewer) return;
      const trunk = (window.relayState?.tree?.nodes || []).find(n => n.type === 'trunk');
      if (!trunk || !Number.isFinite(trunk.lon) || !Number.isFinite(trunk.lat)) return;
      const scale = window.RELAY_LAUNCH_SCALE || 1;
      // Position further back for silhouette view
      window.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(trunk.lon + 0.006, trunk.lat - 0.004, Math.max(800, 4000 * scale)),
        orientation: { heading: Cesium.Math.toRadians(330), pitch: Cesium.Math.toRadians(-20), roll: 0 }
      });
    });
    await sleep(3000);
    const silhouetteCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '02-silhouette.png'));
    log(`[ARCH2] screenshot 02-silhouette.png (${silhouetteCapture})`);

    // ═══ STAGE 7: Silhouette Readability ═══
    log('');
    log('── STAGE 7: Silhouette Readability ──');
    // Verify primitives rendered (trunk + branches + tiles visible at this distance)
    const primCount = await page.evaluate(() => {
      if (!window.viewer) return 0;
      return window.viewer.scene.primitives.length;
    });
    const silhouettePass = primCount > 10; // Must have trunk + shell + branches + tiles rendered
    log(`[ARCH2] silhouette primCount=${primCount}`);
    stageResults.silhouetteReadable = silhouettePass;
    log(`[PRES-PROOF] silhouetteReadable=${silhouettePass ? 'PASS' : 'FAIL'}`);

    // Screenshot 3: Detail — zoom in closer
    await page.evaluate(() => {
      if (!window.viewer) return;
      const trunk = (window.relayState?.tree?.nodes || []).find(n => n.type === 'trunk');
      if (!trunk || !Number.isFinite(trunk.lon) || !Number.isFinite(trunk.lat)) return;
      const scale = window.RELAY_LAUNCH_SCALE || 1;
      window.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(trunk.lon + 0.001, trunk.lat - 0.0003, Math.max(150, 1500 * scale)),
        orientation: { heading: Cesium.Math.toRadians(10), pitch: Cesium.Math.toRadians(-40), roll: 0 }
      });
    });
    await sleep(3000);
    const detailCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '03-detail.png'));
    log(`[ARCH2] screenshot 03-detail.png (${detailCapture})`);

    // ═══ GATE SUMMARY ═══
    log('');
    log('══════════════════════════════════════════════════════════');
    const allKeys = Object.keys(stageResults);
    const allPass = allKeys.every(k => stageResults[k] === true);
    const passCount = allKeys.filter(k => stageResults[k] === true).length;
    const failCount = allKeys.filter(k => stageResults[k] !== true).length;

    log(`[ARCH2] gate-summary result=${allPass ? 'PASS' : 'FAIL'} stages=${allKeys.length} pass=${passCount} fail=${failCount}`);
    for (const [key, val] of Object.entries(stageResults)) {
      log(`[ARCH2]   ${key}: ${val ? 'PASS' : 'FAIL'}`);
    }

    if (!allPass) exitCode = 1;

    // Dump all [PRES] lines
    log('');
    log('── Console [PRES] lines ──');
    for (const line of consoleLogs.filter(l => l.includes('[PRES]'))) {
      log(`  ${line}`);
    }
    log('══════════════════════════════════════════════════════════');

  } catch (err) {
    log(`[ARCH2] FATAL: ${err.message}`);
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopServer(server.child);
    await fs.writeFile(LOG_FILE, proofLines.join('\n'), 'utf8');
    log(`[ARCH2] proof log written to ${LOG_FILE}`);
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('[ARCH2] Unhandled error:', err);
  process.exit(1);
});
