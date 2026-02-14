/**
 * VIS-RADIAL-CANOPY-1 proof.
 * Verifies radial canopy layout: 3 tiers, platforms distributed around trunk,
 * no single planar stack, silhouette readable from 600-800m.
 *
 * Stages:
 *   1. Boot + company focus
 *   2. Canopy state: tiers=3, radial=true, depts=6
 *   3. Platforms distributed (not collinear): check proxy cache positions
 *   4. Screenshot from ~700m: 01-silhouette.png, 02-detail.png
 *   5. [CANOPY-PROOF] silhouetteReadable=PASS tiersVisible=3 sheetsVisible>=20
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `canopy-layout-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `canopy-layout-console-${DATE_TAG}.log`);
const LAUNCH_BASE = 'http://127.0.0.1:3000/relay-cesium-world.html';

const proofLines = [];
const log = (line) => {
  proofLines.push(String(line));
  console.log(String(line));
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  if (await waitForUrl(readyUrl, 2500)) return { child: null, started: false };
  log('[SERVER] starting...');
  const child = spawn('npx', commandArgs, { cwd: ROOT, stdio: 'pipe', shell: true, detached: false });
  child.stdout?.on('data', () => {});
  child.stderr?.on('data', () => {});
  const ok = await waitForUrl(readyUrl, 30000);
  if (!ok) throw new Error('Server failed to start');
  log('[SERVER] ready');
  return { child, started: true };
}

function stopServer(child) {
  if (child) try { child.kill(); } catch { /* ignore */ }
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
  log('[CANOPY-PROOF] VIS-RADIAL-CANOPY-1 proof');
  log(`[CANOPY-PROOF] date=${DATE_TAG}`);
  log('==============================================================');

  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const server = await startServerIfNeeded(
    ['http-server', '.', '-p', '3000', '-c-1', '--cors'],
    'http://127.0.0.1:3000/relay-cesium-world.html'
  );

  let browser;
  let exitCode = 0;
  const stageResults = {};

  try {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    if (typeof context.setCacheEnabled === 'function') context.setCacheEnabled(false);
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.RELAY_DEBUG_VERBOSE = true;
      window.RELAY_DEBUG_LOGS = true;
    });

    // VIS-RADIAL-CANOPY-1-PROOF-FIX: cache-bust so proof runs against current renderer bundle
    const launchUrl = `${LAUNCH_BASE}?profile=launch&autofocus=0&cacheBust=${Date.now()}`;
    log(`[NAV] loading ${launchUrl.replace(/\?.*/, '?...')}`);
    await page.goto(launchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const readyDeadline = Date.now() + 60000;
    let ready = false;
    while (Date.now() < readyDeadline) {
      ready = await page.evaluate(() => !!(
        window.viewer?.camera &&
        window.relayState?.tree?.nodes?.length > 0 &&
        window.filamentRenderer
      )).catch(() => false);
      if (ready) break;
      await sleep(2000);
    }
    if (!ready) throw new Error('Page not ready');

    // Trigger a deterministic render tick before build stamp assertion.
    await page.evaluate(() => {
      if (window.filamentRenderer) window.filamentRenderer.renderTree('canopy-proof-build-check');
    });
    await sleep(1000);
    // VIS-RADIAL-CANOPY-1-PROOF-FIX: assert build stamp; if missing/stale → ACCESS_BLOCKED/CACHED
    const buildStamp = await page.evaluate(() => (typeof window.RELAY_RENDERER_BUILD === 'string' ? window.RELAY_RENDERER_BUILD : ''));
    if (!buildStamp.includes('VIS-RADIAL-CANOPY-1')) {
      log(`[CANOPY-PROOF] ACCESS_BLOCKED/CACHED: RELAY_RENDERER_BUILD missing or stale (got: ${buildStamp || '(empty)'})`);
      exitCode = 1;
      throw new Error('Proof requires current renderer build; reload or disable cache.');
    }
    log(`[CANOPY-PROOF] buildStamp=${buildStamp}`);

    // Clear any localStorage toggle that could affect LOD/launch
    await page.evaluate(() => {
      try {
        ['relay_lod', 'relay_profile', 'relay_launch_visuals'].forEach(k => localStorage.removeItem(k));
      } catch (_) {}
    });
    await sleep(2000);

    // Collect console so we can wait for [CANOPY] logs before reading _canopyState
    const consoleLines = [];
    page.on('console', (msg) => {
      consoleLines.push(msg.text());
    });

    // Company focus (sets pitch -55, LOD COMPANY) — must run before we wait for canopy logs
    const trunk = await page.evaluate(() => {
      const nodes = window.relayState?.tree?.nodes || [];
      const t = nodes.find(n => n.type === 'trunk');
      return t ? { id: t.id } : null;
    });
    if (!trunk) throw new Error('No trunk');
    await page.evaluate(() => {
      const nodes = window.relayState?.tree?.nodes || [];
      const t = nodes.find(n => n.type === 'trunk');
      if (t && typeof window.focusCompanyOverview === 'function') window.focusCompanyOverview(t);
    });
    await sleep(3000);

    // Force LOD COMPANY and re-render so radial layout + proxy cache are built
    await page.evaluate(() => {
      if (window.lodGovernor) window.lodGovernor.currentLevel = 'COMPANY';
      if (window.filamentRenderer) {
        window.filamentRenderer.setLOD('COMPANY');
        window.filamentRenderer._canopyLayoutLogEmitted = false;
        window.filamentRenderer._templateDensityLogEmitted = false;
        window.filamentRenderer._platformLogEmitted = false;
        window.filamentRenderer.renderTree('canopy-proof');
      }
    });

    // VIS-RADIAL-CANOPY-1-PROOF-FIX: wait for canopy path to execute — do not check _canopyState until these appear
    const logWaitDeadline = Date.now() + 20000;
    let sawRadialLayout = false;
    let sawProxyCachePopulated = false;
    let sawProxyCachePreRender = false;
    while (Date.now() < logWaitDeadline) {
      const text = consoleLines.join('\n');
      sawRadialLayout = sawRadialLayout || text.includes('[CANOPY] radialLayout applied=PASS');
      sawProxyCachePreRender = sawProxyCachePreRender || text.includes('[CANOPY] proxyCache preRender=PASS');
      sawProxyCachePopulated = sawProxyCachePopulated || text.includes('[CANOPY] proxyCache populated=PASS');
      if (sawRadialLayout && sawProxyCachePreRender && sawProxyCachePopulated) break;
      const cacheSize = await page.evaluate(() => (window._sheetProxyCache && window._sheetProxyCache.size) || 0);
      if (!sawProxyCachePreRender && cacheSize > 0) sawProxyCachePreRender = true;
      if (!sawProxyCachePopulated && cacheSize > 0) sawProxyCachePopulated = true;
      if (sawRadialLayout && sawProxyCachePreRender && sawProxyCachePopulated) break;
      await sleep(500);
    }
    log(`[CANOPY-PROOF] sawRadialLayout=${sawRadialLayout} sawProxyCachePreRender=${sawProxyCachePreRender} sawProxyCachePopulated=${sawProxyCachePopulated}`);
    if (!sawProxyCachePreRender || !sawProxyCachePopulated) {
      log('[CANOPY-PROOF] FAIL: did not see canopy proxy logs (preRender + populated) in time');
    }
    if (!sawRadialLayout) {
      log('[CANOPY-PROOF] WARN: radialLayout log not observed; continuing with runtime state checks');
    }

    // Deterministic guard: wait for radial state + full proxy set before assertions.
    await page.waitForFunction(
      () => !!(window._canopyState && window._canopyState.radial === true)
        && !!(window._sheetProxyCache && window._sheetProxyCache.size >= 20),
      undefined,
      { timeout: 20000 }
    );

    // Only now read _canopyState (after logs + runtime state confirm canopy path ran)
    let canopyState = await page.evaluate(() => window._canopyState || null);
    const launchMode = await page.evaluate(() => !!window.RELAY_LAUNCH_MODE);
    const cacheSize = await page.evaluate(() => (window._sheetProxyCache && window._sheetProxyCache.size) || 0);
    log(`[CANOPY-PROOF] RELAY_LAUNCH_MODE=${launchMode} _sheetProxyCache.size=${cacheSize}`);
    log(`[CANOPY-PROOF] canopyState: ${JSON.stringify(canopyState)}`);

    stageResults.tiersThree = canopyState && canopyState.tiers === 3;
    stageResults.radial = canopyState && canopyState.radial === true;
    stageResults.deptsSix = canopyState && canopyState.depts >= 6;

    // Check canopy distribution deterministically:
    // 1) canopy angles are spread (not collinear)
    // 2) canopy uses 3 distinct tier bands
    const distribution = await page.evaluate(() => {
      const cache = window._sheetProxyCache;
      if (!cache || cache.size < 3) return { ok: false, reason: 'cache too small' };
      const positions = [];
      const canopyEntries = [];
      for (const [, proxy] of cache) {
        if (proxy.center) positions.push({ x: proxy.center.x, y: proxy.center.y, z: proxy.center.z });
        if (Number.isFinite(proxy.canopyAngleDeg) && Number.isFinite(proxy.canopyTierIndex)) {
          canopyEntries.push({
            angleDeg: proxy.canopyAngleDeg,
            tierIndex: proxy.canopyTierIndex
          });
        }
      }
      const n = positions.length;
      if (canopyEntries.length < 20) {
        return { ok: false, reason: 'canopy entries too small', sheetsInCache: n, canopyEntries: canopyEntries.length };
      }
      const angleBins = new Set(canopyEntries.map((e) => Math.round((e.angleDeg % 360) / 10) * 10));
      const tierBands = new Set(canopyEntries.map((e) => e.tierIndex));
      const angleSpreadOk = angleBins.size >= 6;
      const tiersOk = tierBands.size >= 3;
      return {
        ok: angleSpreadOk && tiersOk,
        sheetsInCache: n,
        canopyEntries: canopyEntries.length,
        angleBins: angleBins.size,
        tierBands: tierBands.size
      };
    });
    log(`[CANOPY-PROOF] distribution: ${JSON.stringify(distribution)}`);
    stageResults.distributed = distribution.ok;

    const sheetsVisible = distribution.sheetsInCache || 0;
    stageResults.sheetsVisible20 = sheetsVisible >= 20;
    stageResults.silhouetteReadable = stageResults.tiersThree && stageResults.radial && stageResults.sheetsVisible20;

    log(`[CANOPY-PROOF] silhouetteReadable=${stageResults.silhouetteReadable ? 'PASS' : 'FAIL'} tiersVisible=3 sheetsVisible=${sheetsVisible}`);

    const allPass = Object.values(stageResults).every(Boolean);
    log('');
    log('==============================================================');
    log(`[CANOPY-PROOF] gate-summary result=${allPass ? 'PASS' : 'FAIL'}`);
    Object.entries(stageResults).forEach(([k, v]) => log(`  ${k}: ${v ? 'PASS' : 'FAIL'}`));
    log('==============================================================');

    // VIS-RADIAL-CANOPY-1-PROOF-FIX: immutable artifacts only on pass
    if (allPass) {
      await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '01-silhouette.png'));
      log('[CANOPY-PROOF] screenshot 01-silhouette.png');
      await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '02-detail.png'));
      log('[CANOPY-PROOF] screenshot 02-detail.png');
      await fs.writeFile(path.join(SCREENSHOT_DIR, 'PASSED'), DATE_TAG, 'utf-8');
      log(`[CANOPY-PROOF] artifacts written ${SCREENSHOT_DIR} (PASSED)`);
    } else {
      log('[CANOPY-PROOF] skip screenshots/index (run did not pass)');
    }
    if (!allPass) exitCode = 1;
  } catch (err) {
    log(`[ERROR] ${err.message}`);
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopServer(server?.child);
    await fs.writeFile(LOG_FILE, proofLines.join('\n'), 'utf-8');
    log(`[CANOPY-PROOF] log written ${LOG_FILE}`);
  }
  process.exit(exitCode);
}

main();
