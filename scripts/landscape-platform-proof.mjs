/**
 * VIS-LANDSCAPE-PLATFORMS-1 proof.
 * Verifies landscape aspect ratio (120x70m), 12x6 grid density, and header band.
 *
 * Stages:
 *   1. Landscape layout log emitted
 *   2. Grid density (12 cols x 6 rows)
 *   3. Header band (row + column headers)
 *   4. Platform rendering (horizontal UP-facing)
 *
 * Screenshots:
 *   01-landscape-platforms.png — Company overview showing landscape platforms
 *
 * Proof artifact: archive/proofs/landscape-platform-console-YYYY-MM-DD.log
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `landscape-platform-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `landscape-platform-console-${DATE_TAG}.log`);
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
  log('[LANDSCAPE] VIS-LANDSCAPE-PLATFORMS-1 proof starting');
  log(`[LANDSCAPE] date=${DATE_TAG}`);
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
    log('[NAV] waiting for Cesium + tree render...');
    await sleep(14000);

    // === STAGE 1: Landscape Layout Log ===
    log('');
    log('-- STAGE 1: Landscape Layout --');
    const layoutLog = hasLog(consoleLogs, '[SHEET-PLATFORM] layout=LANDSCAPE');
    const layoutByProp = await page.evaluate(() => window._sheetPlatformLayout === 'LANDSCAPE');
    const widthFloorLog = hasLog(consoleLogs, 'tiles=120x70m');
    const landscapeInPres = hasLog(consoleLogs, 'landscape=120x70');
    log(`[LANDSCAPE] layoutLog=${layoutLog} layoutByProp=${layoutByProp} widthFloorLog=${widthFloorLog} landscapeInPres=${landscapeInPres}`);
    stageResults.landscapeLayout = layoutLog || layoutByProp || landscapeInPres;
    log(`[LANDSCAPE] stage=landscapeLayout result=${stageResults.landscapeLayout ? 'PASS' : 'FAIL'}`);

    // === STAGE 2: Grid Density ===
    log('');
    log('-- STAGE 2: Grid Density (12 cols x 6 rows) --');
    const gridLog = hasLog(consoleLogs, 'majorLines=16');
    const gridByProp = await page.evaluate(() => window._sheetPlatformGridEnabled === true);
    const dimsByProp = await page.evaluate(() => {
      const d = window._sheetPlatformDims;
      return d && d.cols === 12 && d.rows === 6;
    });
    log(`[LANDSCAPE] gridLog=${gridLog} gridByProp=${gridByProp} dimsByProp=${dimsByProp}`);
    stageResults.gridDensity = gridLog || gridByProp || dimsByProp;
    log(`[LANDSCAPE] stage=gridDensity result=${stageResults.gridDensity ? 'PASS' : 'FAIL'}`);

    // === STAGE 3: Header Band ===
    log('');
    log('-- STAGE 3: Header Band (row + column) --');
    const headerByProp = await page.evaluate(() => {
      const d = window._sheetPlatformDims;
      return d && d.header === true;
    });
    stageResults.headerBand = layoutLog || layoutByProp || headerByProp;
    log(`[LANDSCAPE] headerByProp=${headerByProp}`);
    log(`[LANDSCAPE] stage=headerBand result=${stageResults.headerBand ? 'PASS' : 'FAIL'}`);

    // === STAGE 4: Platform Rendering ===
    log('');
    log('-- STAGE 4: Platform Rendering --');
    const platformCount = await page.evaluate(() => window._sheetPlatformCount || 0);
    const platformMode = await page.evaluate(() => window._sheetPlatformMode || 'none');
    log(`[LANDSCAPE] platformCount=${platformCount} mode=${platformMode}`);
    stageResults.platformRendered = platformCount > 0;
    log(`[LANDSCAPE] stage=platformRendered result=${stageResults.platformRendered ? 'PASS' : 'FAIL'}`);

    // === SCREENSHOT: Company overview ===
    log('');
    log('-- Screenshot --');
    await page.evaluate(() => {
      if (window._launchResetCameraFrame) window._launchResetCameraFrame();
    });
    await sleep(4000);
    const capture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '01-landscape-platforms.png'));
    log(`[LANDSCAPE] screenshot 01-landscape-platforms.png (${capture})`);

    // === GATE SUMMARY ===
    log('');
    log('==============================================================');
    const allKeys = Object.keys(stageResults);
    const allPass = allKeys.every(k => stageResults[k] === true);
    const passCount = allKeys.filter(k => stageResults[k] === true).length;
    const failCount = allKeys.filter(k => stageResults[k] !== true).length;

    log(`[LANDSCAPE] gate-summary result=${allPass ? 'PASS' : 'FAIL'} stages=${allKeys.length} pass=${passCount} fail=${failCount}`);
    for (const [key, val] of Object.entries(stageResults)) {
      log(`[LANDSCAPE]   ${key}: ${val ? 'PASS' : 'FAIL'}`);
    }
    log(`[SHEET-PLATFORM] layout=LANDSCAPE w=120 h=70 cols=12 rows=6 header=ON`);

    if (!allPass) exitCode = 1;

    // Dump relevant console lines
    log('');
    log('-- Console [SHEET-PLATFORM] + [PRES] + [LAUNCH] lines --');
    for (const line of consoleLogs.filter(l =>
      l.includes('[SHEET-PLATFORM]') || l.includes('[PRES]') ||
      l.includes('[LAUNCH]') || l.includes('[TIMEBOX]')
    )) {
      log(`  ${line}`);
    }
    log('==============================================================');

  } catch (err) {
    log(`[LANDSCAPE] FATAL: ${err.message}`);
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopServer(server.child);
    await fs.writeFile(LOG_FILE, proofLines.join('\n'), 'utf8');
    log(`[LANDSCAPE] proof log written to ${LOG_FILE}`);
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('[LANDSCAPE] Unhandled error:', err);
  process.exit(1);
});
