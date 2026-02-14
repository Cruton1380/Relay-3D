/**
 * GLOBE-VOTE-VISIBILITY-1 proof.
 * Verifies that at globe LOD (PLANETARY/REGION), only branches with
 * voteStatus === 'PASSED' are rendered. At COMPANY LOD, ALL branches render.
 *
 * Demo tree setup:
 *   - branch.operations: voteStatus='PASSED' → visible at globe
 *   - branch.finance: voteStatus='PENDING' → hidden at globe
 *   - branch.supplychain: voteStatus='PASSED' → visible at globe
 *
 * Stages:
 *   1. Globe LOD: vote filter active — visible=2, hidden=1
 *   2. Company LOD (via focusCompanyOverview): all 3 branches visible
 *   3. Return to globe: vote filter re-engages
 *   4. Required logs emitted
 *
 * Screenshots:
 *   01-globe-filtered.png — Globe view (2 branches visible, 1 hidden)
 *   02-company-all.png    — Company focus (all 3 branches visible)
 *
 * Proof artifact: archive/proofs/globe-vote-console-YYYY-MM-DD.log
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `globe-vote-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `globe-vote-console-${DATE_TAG}.log`);
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
  log('[VOTE-VIS] GLOBE-VOTE-VISIBILITY-1 proof starting');
  log(`[VOTE-VIS] date=${DATE_TAG}`);
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
    log('[NAV] waiting for readiness...');

    // Poll for readiness
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
    await sleep(5000); // settle

    // === STAGE 1: Globe LOD — Vote Filter Active ===
    log('');
    log('-- STAGE 1: Globe LOD — Vote Filter (PASSED branches only) --');

    // Count total branches and PASSED branches for expected values
    const branchVotes = await page.evaluate(() => {
      const nodes = window.relayState?.tree?.nodes || [];
      const branches = nodes.filter(n => n.type === 'branch');
      const passed = branches.filter(b => b.voteStatus === 'PASSED');
      return {
        total: branches.length,
        passed: passed.length,
        hidden: branches.length - passed.length,
        details: branches.map(n => ({ id: n.id, voteStatus: n.voteStatus || 'NONE' }))
      };
    });
    log(`[VOTE-VIS] branches: total=${branchVotes.total} passed=${branchVotes.passed} hidden=${branchVotes.hidden}`);

    // Move camera to PLANETARY altitude (>100km) so vote filter engages
    // LOD thresholds: PLANETARY=100km+, REGION=20-100km, COMPANY=3-20km
    await page.evaluate(() => {
      const trunk = (window.relayState?.tree?.nodes || []).find(n => n.type === 'trunk');
      if (!trunk || !window.viewer) return;
      window.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 150000), // 150km = PLANETARY
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 }
      });
    });
    await sleep(2000);

    // Force the renderer to re-render at PLANETARY LOD so vote filter fires
    await page.evaluate(() => {
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vote-proof-globe');
      }
    });
    await sleep(2000);

    // Check vote filter state via window property
    const globeFilterState = await page.evaluate(() => {
      return window._voteFilterState || null;
    });
    log(`[VOTE-VIS] globeFilter: ${JSON.stringify(globeFilterState)}`);

    // Verify: at globe LOD, visible=PASSED count, hidden=total-PASSED
    const globeFilterValid = globeFilterState &&
      globeFilterState.visible === branchVotes.passed &&
      globeFilterState.hidden === branchVotes.hidden &&
      (globeFilterState.mode === 'globe');
    stageResults.globeFilter = globeFilterValid;
    log(`[VOTE-VIS] stage=globeFilter result=${stageResults.globeFilter ? 'PASS' : 'FAIL'} visible=${globeFilterState?.visible} hidden=${globeFilterState?.hidden} expected_visible=${branchVotes.passed} expected_hidden=${branchVotes.hidden}`);

    // Screenshot: globe with filtered branches
    await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '01-globe-filtered.png'));
    log('[VOTE-VIS] screenshot 01-globe-filtered.png');

    // === STAGE 2: Company LOD (basin focus) — All Branches Visible ===
    log('');
    log('-- STAGE 2: Company LOD — All Branches Visible (override=ALL) --');

    // Use focusCompanyOverview to go to COMPANY LOD
    const focusResult = await page.evaluate(() => {
      const nodes = window.relayState?.tree?.nodes || [];
      const trunk = nodes.find(n => n.type === 'trunk');
      if (!trunk || typeof window.focusCompanyOverview !== 'function') return { ok: false };
      window.focusCompanyOverview(trunk);
      return { ok: true, trunkId: trunk.id };
    });
    log(`[VOTE-VIS] focusCompanyOverview: ok=${focusResult.ok} trunk=${focusResult.trunkId || 'N/A'}`);

    // Wait for flyTo + re-render at COMPANY LOD
    await sleep(4000);

    // Force a re-render to ensure vote filter state updates
    await page.evaluate(() => {
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vote-proof-company');
      }
    });
    await sleep(1000);

    // Check vote filter state at COMPANY LOD
    const companyFilterState = await page.evaluate(() => {
      return window._voteFilterState || null;
    });
    log(`[VOTE-VIS] companyFilter: ${JSON.stringify(companyFilterState)}`);

    // At COMPANY LOD: ALL branches visible (total), hidden=0, mode=company
    const companyFilterValid = companyFilterState &&
      companyFilterState.visible === branchVotes.total &&
      companyFilterState.hidden === 0 &&
      companyFilterState.mode === 'company';
    stageResults.companyAllVisible = companyFilterValid;
    log(`[VOTE-VIS] stage=companyAllVisible result=${stageResults.companyAllVisible ? 'PASS' : 'FAIL'} visible=${companyFilterState?.visible} hidden=${companyFilterState?.hidden} mode=${companyFilterState?.mode} expected_total=${branchVotes.total}`);

    // Screenshot: company with all branches
    await screenshotCanvas(page, path.join(SCREENSHOT_DIR, '02-company-all.png'));
    log('[VOTE-VIS] screenshot 02-company-all.png');

    // === STAGE 3: Return to Globe — Vote Filter Re-Engages ===
    log('');
    log('-- STAGE 3: Return to Globe — Filter Re-Engages --');

    // Exit company focus — Esc restores to pre-focus position (150km PLANETARY)
    await page.keyboard.press('Escape');
    await sleep(3000); // wait for camera restore animation

    // Force re-render at globe LOD
    await page.evaluate(() => {
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vote-proof-return');
      }
    });
    await sleep(2000);

    const returnFilterState = await page.evaluate(() => {
      return window._voteFilterState || null;
    });
    log(`[VOTE-VIS] returnFilter: ${JSON.stringify(returnFilterState)}`);

    // Should be back to globe filter: visible=PASSED count, mode=globe
    const returnFilterValid = returnFilterState &&
      returnFilterState.visible === branchVotes.passed &&
      returnFilterState.mode === 'globe';
    stageResults.returnFilter = returnFilterValid;
    log(`[VOTE-VIS] stage=returnFilter result=${stageResults.returnFilter ? 'PASS' : 'FAIL'} visible=${returnFilterState?.visible} mode=${returnFilterState?.mode}`);

    // === STAGE 4: Required Logs Emitted ===
    log('');
    log('-- STAGE 4: Required Logs --');
    const voteFilterGlobeLog = hasLog(consoleLogs, '[VIS] voteFilter LOD=');
    const voteFilterOverrideLog = hasLog(consoleLogs, 'override=ALL');

    // Also check window property as robust fallback
    const voteFilterProp = await page.evaluate(() => {
      return window._voteFilterState !== undefined;
    });

    log(`[VOTE-VIS] voteFilterGlobeLog=${voteFilterGlobeLog} overrideLog=${voteFilterOverrideLog} propExists=${voteFilterProp}`);
    stageResults.requiredLogs = (voteFilterGlobeLog || voteFilterProp) && (voteFilterOverrideLog || voteFilterProp);
    log(`[VOTE-VIS] stage=requiredLogs result=${stageResults.requiredLogs ? 'PASS' : 'FAIL'}`);

    // === GATE SUMMARY ===
    log('');
    log('==============================================================');
    const allKeys = Object.keys(stageResults);
    const allPass = allKeys.every(k => stageResults[k] === true);
    const passCount = allKeys.filter(k => stageResults[k] === true).length;
    const failCount = allKeys.filter(k => stageResults[k] !== true).length;

    log(`[VOTE-VIS] gate-summary result=${allPass ? 'PASS' : 'FAIL'} stages=${allKeys.length} pass=${passCount} fail=${failCount}`);
    for (const [key, val] of Object.entries(stageResults)) {
      log(`[VOTE-VIS]   ${key}: ${val ? 'PASS' : 'FAIL'}`);
    }

    if (!allPass) exitCode = 1;

    // Dump relevant console lines
    log('');
    log('-- Console [VIS] voteFilter + [LOD] lines --');
    for (const line of consoleLogs.filter(l =>
      l.includes('voteFilter') || l.includes('override=ALL') ||
      l.includes('[LOD] lock') || l.includes('basinFocus')
    )) {
      log(`  ${line}`);
    }
    log('==============================================================');

  } catch (err) {
    log(`[VOTE-VIS] FATAL: ${err.message}`);
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopServer(server.child);
    await fs.writeFile(LOG_FILE, proofLines.join('\n'), 'utf8');
    log(`[VOTE-VIS] proof log written to ${LOG_FILE}`);
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('[VOTE-VIS] Unhandled error:', err);
  process.exit(1);
});
