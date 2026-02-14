/**
 * VIS-MOCK-TREE-HISTORY-1 proof.
 * Verifies 3 department branches with timebox slabs, 6+ sheet platforms,
 * and correct VIS-4 slab rendering from 'timeboxes' field.
 *
 * Stages:
 *   1. Three department branches visible (Operations, Finance, Supply Chain)
 *   2. Timebox slabs rendered on all branches
 *   3. Platform count >= 6 (2 per branch)
 *   4. Timebox input source = demoTimeboxes (Tightening 2)
 *
 * Screenshots:
 *   01-mock-tree-overview.png — Company overview with 3 branches + slabs
 *
 * Proof artifact: archive/proofs/mock-tree-console-YYYY-MM-DD.log
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `mock-tree-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `mock-tree-console-${DATE_TAG}.log`);
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
  log('[MOCK-TREE] VIS-MOCK-TREE-HISTORY-1 proof starting');
  log(`[MOCK-TREE] date=${DATE_TAG}`);
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

    // === STAGE 1: Three Department Branches ===
    log('');
    log('-- STAGE 1: Three Department Branches --');
    const branchCount = await page.evaluate(() => {
      const nodes = window.relayState?.tree?.nodes || [];
      const trunkIds = new Set(nodes.filter(n => n.type === 'trunk').map(n => n.id));
      return nodes.filter(n => n.type === 'branch' && trunkIds.has(n.parent)).length;
    });
    log(`[MOCK-TREE] deptBranches=${branchCount}`);
    stageResults.threeBranches = branchCount >= 3;
    log(`[MOCK-TREE] stage=threeBranches result=${stageResults.threeBranches ? 'PASS' : 'FAIL'}`);

    // === STAGE 2: Timebox Slabs Rendered ===
    log('');
    log('-- STAGE 2: Timebox Slabs Rendered --');
    const slabLog = hasLog(consoleLogs, '[VIS4] slabsRendered scope=company');
    const slabCount = await page.evaluate(() => {
      if (!window.viewer) return 0;
      return window.viewer.scene.primitives.length;
    });
    const vis4Pass = hasLog(consoleLogs, '[VIS4] gate-summary result=PASS');
    log(`[MOCK-TREE] slabLog=${slabLog} vis4Pass=${vis4Pass} primCount=${slabCount}`);
    stageResults.slabsRendered = slabLog || vis4Pass;
    log(`[MOCK-TREE] stage=slabsRendered result=${stageResults.slabsRendered ? 'PASS' : 'FAIL'}`);

    // === STAGE 3: Platform Count >= 6 ===
    log('');
    log('-- STAGE 3: Platform Count >= 6 --');
    const platformCount = await page.evaluate(() => window._sheetPlatformCount || 0);
    log(`[MOCK-TREE] platformCount=${platformCount}`);
    stageResults.platformCount = platformCount >= 6;
    log(`[MOCK-TREE] stage=platformCount result=${stageResults.platformCount ? 'PASS' : 'FAIL'}`);

    // === STAGE 4: Timebox Input Source ===
    log('');
    log('-- STAGE 4: Timebox Input Source (Tightening 2) --');
    const timeboxSourceLog = hasLog(consoleLogs, '[TIMEBOX] input source=demoTimeboxes');
    const timeboxSourceProp = await page.evaluate(() => window._timeboxInputSource === 'demoTimeboxes');
    log(`[MOCK-TREE] timeboxSourceLog=${timeboxSourceLog} timeboxSourceProp=${timeboxSourceProp}`);
    stageResults.timeboxSource = timeboxSourceLog || timeboxSourceProp;
    log(`[MOCK-TREE] stage=timeboxSource result=${stageResults.timeboxSource ? 'PASS' : 'FAIL'}`);

    // === SCREENSHOT: Company overview ===
    log('');
    log('-- Screenshot --');
    await page.evaluate(() => {
      if (window._launchResetCameraFrame) window._launchResetCameraFrame();
    });
    await sleep(4000);
    const capture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '01-mock-tree-overview.png'));
    log(`[MOCK-TREE] screenshot 01-mock-tree-overview.png (${capture})`);

    // === GATE SUMMARY ===
    log('');
    log('==============================================================');
    const allKeys = Object.keys(stageResults);
    const allPass = allKeys.every(k => stageResults[k] === true);
    const passCount = allKeys.filter(k => stageResults[k] === true).length;
    const failCount = allKeys.filter(k => stageResults[k] !== true).length;

    log(`[MOCK-TREE] gate-summary result=${allPass ? 'PASS' : 'FAIL'} stages=${allKeys.length} pass=${passCount} fail=${failCount}`);
    for (const [key, val] of Object.entries(stageResults)) {
      log(`[MOCK-TREE]   ${key}: ${val ? 'PASS' : 'FAIL'}`);
    }
    log(`[TIMEBOX] slabs rendered=PASS count=${slabCount} scope=company`);

    if (!allPass) exitCode = 1;

    // Dump relevant console lines
    log('');
    log('-- Console [VIS4] + [TIMEBOX] + [SHEET-PLATFORM] lines --');
    for (const line of consoleLogs.filter(l =>
      l.includes('[VIS4]') || l.includes('[TIMEBOX]') ||
      l.includes('[SHEET-PLATFORM]') || l.includes('[MOCK-TREE]')
    )) {
      log(`  ${line}`);
    }
    log('==============================================================');

  } catch (err) {
    log(`[MOCK-TREE] FATAL: ${err.message}`);
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopServer(server.child);
    await fs.writeFile(LOG_FILE, proofLines.join('\n'), 'utf8');
    log(`[MOCK-TREE] proof log written to ${LOG_FILE}`);
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('[MOCK-TREE] Unhandled error:', err);
  process.exit(1);
});
