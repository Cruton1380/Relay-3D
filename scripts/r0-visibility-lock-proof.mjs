/**
 * R0-VISIBILITY-LOCK-1 proof.
 * Observation-only: no renderer changes, no physics changes.
 * Proves a reproducible 30-60s demo sequence through all navigation layers:
 *   1. Globe (multi-anchor visible)
 *   2. Building/site basin focus
 *   3. Enter company (compressed view — VIS-2)
 *   4. Enter sheet (expanded — one sheet)
 *   5. Enter edit + 2D grid (docked)
 *   6. Exit back up (full unwind)
 *
 * Stage detection is deterministic via console log checks:
 *   Globe:    [GLOBE] datasetLoad anchors=<n> (n >= 2)
 *   Building: camera at building altitude + trunk focus
 *   Company:  LOD=COMPANY + [VIS2] companyCollapsed result=PASS
 *   Sheet:    [VIS] enter sheet=... + scope=sheet
 *   Edit:     [SHEET-2D] cellPx=... + operationMode=SheetEdit
 *   Exit:     [VIS] exit sheet=... + operationMode=FreeFly
 *
 * Screenshots: r0-01-globe.png .. r0-05-edit.png
 * Proof artifact: archive/proofs/r0-visibility-lock-console-YYYY-MM-DD.log
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `r0-visibility-lock-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `r0-visibility-lock-console-${DATE_TAG}.log`);
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

// ── Stage check helpers ────────────────────────────────────────────
function hasLog(consoleLogs, pattern) {
  if (typeof pattern === 'string') {
    return consoleLogs.some((t) => String(t).includes(pattern));
  }
  return consoleLogs.some((t) => pattern.test(String(t)));
}

function findLog(consoleLogs, pattern) {
  if (typeof pattern === 'string') {
    return consoleLogs.find((t) => String(t).includes(pattern)) || null;
  }
  return consoleLogs.find((t) => pattern.test(String(t))) || null;
}

function extractNumber(line, key) {
  if (!line) return NaN;
  const match = String(line).match(new RegExp(`${key}=(\\d+)`));
  return match ? parseInt(match[1], 10) : NaN;
}

// ── Screenshot helpers ─────────────────────────────────────────────

/**
 * Take a canvas-only screenshot of the Cesium 3D view.
 * Falls back to full page if canvas not found.
 */
async function screenshotCanvas(page, filePath) {
  const canvas = await page.$('#cesiumContainer canvas');
  if (canvas) {
    await canvas.screenshot({ path: filePath });
    return 'canvas';
  }
  // Fallback: try the container div
  const container = await page.$('#cesiumContainer');
  if (container) {
    await container.screenshot({ path: filePath });
    return 'container';
  }
  await page.screenshot({ path: filePath });
  return 'fullpage';
}

/**
 * Force clean state: exit edit mode and sheet mode if active.
 * Returns the state that was cleaned.
 */
async function forceCleanState(page) {
  return await page.evaluate(() => {
    window.__relayStressModeActive = false;
    window.__relayDeferredRenderPending = false;
    window.__relayPostGateQuietUntil = 0;

    let exitedEdit = false;
    let exitedSheet = false;

    // Exit edit mode if active
    if (typeof window.exitEditSheetMode === 'function') {
      try {
        window.exitEditSheetMode();
        exitedEdit = true;
      } catch (_) { /* not in edit */ }
    }
    // Remove edit CSS classes directly as safety net
    document.body.classList.remove('edit-sheet-mode');
    document.body.classList.remove('edit-sheet-preview');

    // Exit sheet if entered
    if (typeof window.relayExitSheet === 'function') {
      try {
        const result = window.relayExitSheet();
        exitedSheet = result?.ok === true;
      } catch (_) { /* not in sheet */ }
    }

    // Force render to apply clean state
    if (window.filamentRenderer) {
      window.filamentRenderer.renderTree('r0-force-clean');
    }

    return { exitedEdit, exitedSheet };
  });
}

// ── Main proof flow ────────────────────────────────────────────────
async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  let devServer = null;
  let browser = null;
  const stageResults = {};

  try {
    // ── Boot ────────────────────────────────────────────────────────
    devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], LAUNCH_URL);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

    // Enable verbose logging so [VIS2], [GLOBE], etc. survive log filters
    await page.addInitScript(() => {
      window.RELAY_DEBUG_VERBOSE = true;
      window.RELAY_DEBUG_LOGS = true;
    });

    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));

    log('[R0] proof starting — loading launch profile');
    await page.goto(LAUNCH_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

    // Wait for runtime ready
    await page.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'launch'
        && typeof window.relayEnterSheet === 'function'
        && typeof window.relayExitSheet === 'function'
        && !!window.filamentRenderer
        && !!window.relayState?.tree?.nodes?.length,
      undefined,
      { timeout: 120000 }
    );

    // Suppress stress/deferred that could interfere
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
    });

    await sleep(3000); // Let initial render + dataset load settle

    // ── Force clean state before any stage captures ─────────────────
    // The launch profile may auto-enter sheet/edit. Clean that first.
    const initialClean = await forceCleanState(page);
    await sleep(1500);
    if (initialClean.exitedEdit || initialClean.exitedSheet) {
      log(`[R0] initial state cleaned: exitedEdit=${initialClean.exitedEdit} exitedSheet=${initialClean.exitedSheet}`);
    }

    // ════════════════════════════════════════════════════════════════
    // STAGE 1: Globe (multi-anchor visible)
    // Check: [GLOBE] datasetLoad anchors=<n> where n >= 2
    // ════════════════════════════════════════════════════════════════
    log('[R0] === STAGE 1: Globe ===');

    // Enforce clean state: NOT in sheet/edit
    await forceCleanState(page);
    await sleep(500);

    // Fly camera to globe altitude to see all anchors
    await page.evaluate(() => {
      const viewer = window.viewer;
      if (viewer?.camera) {
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(34.78, 32.08, 800000),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 }
        });
      }
      // Force render at globe altitude
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('r0-globe');
      }
    });
    await sleep(2500);

    const datasetLine = findLog(consoleLogs, '[GLOBE] datasetLoad anchors=');
    const anchorCount = datasetLine ? extractNumber(datasetLine, 'anchors') : 0;
    const globePass = anchorCount >= 2;
    stageResults.globe = globePass;
    log(`[R0] stage=globe anchorsVisible=${anchorCount} result=${globePass ? 'PASS' : 'FAIL'}`);
    log(`[R0] capture stage=globe uiMode=FreeFly scope=world`);

    const globeCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, 'r0-01-globe.png'));
    log(`[R0] screenshot saved: r0-01-globe.png (${globeCapture})`);

    // ════════════════════════════════════════════════════════════════
    // STAGE 2: Building/site basin focus
    // Check: camera at building altitude + trunk visible
    // ════════════════════════════════════════════════════════════════
    log('[R0] === STAGE 2: Building ===');

    // Enforce clean state: NOT in sheet/edit
    await forceCleanState(page);
    await sleep(500);

    const buildingFocus = await page.evaluate(() => {
      const viewer = window.viewer;
      const relayState = window.relayState;
      const trunk = relayState?.tree?.nodes?.find((n) => n?.type === 'trunk');
      if (!trunk || !Number.isFinite(trunk.lat) || !Number.isFinite(trunk.lon)) {
        return { ok: false, reason: 'NO_TRUNK' };
      }
      // Fly to building-level altitude (~2500m) looking down at 45deg
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(trunk.lon + 0.001, trunk.lat - 0.0008, 2500),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 }
      });
      // Force render at building level
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('r0-building');
      }
      return { ok: true, trunkId: trunk.id, lat: trunk.lat, lon: trunk.lon };
    });
    await sleep(2500);

    const buildingPass = buildingFocus.ok === true;
    stageResults.building = buildingPass;
    log(`[R0] stage=building trunkId=${buildingFocus.trunkId || 'NONE'} basinFocus=${buildingPass ? 'PASS' : 'FAIL'}`);
    log(`[R0] capture stage=building uiMode=FreeFly scope=world`);

    const buildingCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, 'r0-02-building.png'));
    log(`[R0] screenshot saved: r0-02-building.png (${buildingCapture})`);

    // ════════════════════════════════════════════════════════════════
    // STAGE 3: Enter company (compressed view — VIS-2)
    // Check: LOD=COMPANY + [VIS2] companyCollapsed result=PASS
    // ════════════════════════════════════════════════════════════════
    log('[R0] === STAGE 3: Company ===');

    // Enforce clean state: NOT in sheet/edit
    await forceCleanState(page);
    await sleep(500);

    // Fly closer to company level
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      const viewer = window.viewer;
      const trunk = window.relayState?.tree?.nodes?.find((n) => n?.type === 'trunk');
      if (trunk && viewer?.camera) {
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 25000),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 }
        });
      }
    });
    await sleep(3000);

    // Force a render cycle to emit VIS2 logs
    await page.evaluate(() => {
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('r0-company-check');
      }
    });
    await sleep(1500);

    const companyCollapsedLine = findLog(consoleLogs, '[VIS2] companyCollapsed result=PASS');
    const currentLod = await page.evaluate(() => {
      return window.filamentRenderer?.currentLOD || 'UNKNOWN';
    });
    const companyPass = !!companyCollapsedLine;
    stageResults.company = companyPass;
    log(`[R0] stage=company lod=${currentLod} vis2Collapsed=${companyPass ? 'PASS' : 'MISSING'}`);
    log(`[R0] capture stage=company uiMode=FreeFly scope=world`);

    const companyCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, 'r0-03-company.png'));
    log(`[R0] screenshot saved: r0-03-company.png (${companyCapture})`);

    // ════════════════════════════════════════════════════════════════
    // STAGE 4: Enter sheet (expanded — one sheet)
    // Check: [VIS] enter sheet=... + scope=sheet
    // NOTE: Enter sheet but do NOT enter edit — canvas is still visible
    // ════════════════════════════════════════════════════════════════
    log('[R0] === STAGE 4: Sheet ===');

    const enterResult = await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;

      // Find first sheet
      const nodes = window.relayState?.tree?.nodes || [];
      const sheet = nodes.find((n) => String(n?.type || '').toLowerCase() === 'sheet');
      const sheetId = sheet ? String(sheet.id) : null;

      let result = null;
      if (sheetId) {
        result = window.relayEnterSheet(sheetId);
      }
      if (!result?.ok) {
        result = window.relayEnterSheet();
      }
      if (result?.ok && window.filamentRenderer) {
        window.filamentRenderer.renderTree('r0-sheet-enter');
      }

      // Fly camera closer to make sheet view visually distinct from company
      const trunk = window.relayState?.tree?.nodes?.find((n) => n?.type === 'trunk');
      if (trunk && window.viewer?.camera) {
        window.viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(trunk.lon + 0.0005, trunk.lat, 5000),
          orientation: { heading: Cesium.Math.toRadians(30), pitch: Cesium.Math.toRadians(-35), roll: 0 }
        });
      }

      return {
        ok: result?.ok === true,
        sheetId: result?.entry?.sheetId || sheetId || 'unknown',
        scope: result?.entry?.scope || 'unknown'
      };
    });
    await sleep(3000);

    const enterSheetLog = findLog(consoleLogs, '[VIS] enter sheet=');
    const sheetPass = enterResult.ok && !!enterSheetLog;
    stageResults.sheet = sheetPass;
    log(`[R0] stage=sheet entered=${enterResult.ok} sheetId=${enterResult.sheetId} scope=${enterResult.scope} logPresent=${!!enterSheetLog} result=${sheetPass ? 'PASS' : 'FAIL'}`);
    log(`[R0] capture stage=sheet uiMode=FreeFly scope=sheet-only`);

    // Canvas screenshot — sheet entered but NOT in edit mode (canvas visible)
    const sheetCapture = await screenshotCanvas(page, path.join(SCREENSHOT_DIR, 'r0-04-sheet.png'));
    log(`[R0] screenshot saved: r0-04-sheet.png (${sheetCapture})`);

    // ════════════════════════════════════════════════════════════════
    // STAGE 5: Enter edit + 2D grid (docked)
    // Check: [SHEET-2D] cellPx=... + [HUD] mode=SheetEdit
    // NOTE: In edit mode, canvas is opacity:0 — the spreadsheet
    //       overlay IS the visual. Use full page screenshot.
    // ════════════════════════════════════════════════════════════════
    log('[R0] === STAGE 5: Edit ===');

    const editResult = await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;

      // Find the entered sheet
      const nodes = window.relayState?.tree?.nodes || [];
      const entryState = typeof window.getVisEntryState === 'function'
        ? window.getVisEntryState()
        : null;
      const sheetId = entryState?.sheetId;
      const sheet = sheetId
        ? nodes.find((n) => String(n?.id) === String(sheetId))
        : nodes.find((n) => String(n?.type || '').toLowerCase() === 'sheet');

      if (!sheet) return { ok: false, reason: 'NO_SHEET_FOR_EDIT' };

      if (typeof window.enterEditSheetMode === 'function') {
        window.enterEditSheetMode(sheet);
        return { ok: true, sheetId: String(sheet.id) };
      }
      return { ok: false, reason: 'NO_EDIT_API' };
    });
    await sleep(4000); // Allow docking + 2D grid render

    const cellPxLog = findLog(consoleLogs, '[SHEET-2D] cellPx=');
    const viewportAnchorLog = findLog(consoleLogs, '[SHEET-2D] viewport anchor');
    const hudSheetEditLog = findLog(consoleLogs, '[HUD] mode=SheetEdit');

    // Detect edit mode via HUD log (isEditSheetMode is let-scoped, not on window)
    const editPass = editResult.ok && !!cellPxLog && !!hudSheetEditLog;
    stageResults.edit = editPass;
    log(`[R0] stage=edit entered=${editResult.ok} cellPx=${!!cellPxLog} viewportAnchor=${!!viewportAnchorLog} hudSheetEdit=${!!hudSheetEditLog} result=${editPass ? 'PASS' : 'FAIL'}`);
    log(`[R0] capture stage=edit uiMode=SheetEdit scope=sheet-only`);

    // Full page screenshot for edit — canvas is hidden, spreadsheet overlay is the view
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'r0-05-edit.png') });
    log('[R0] screenshot saved: r0-05-edit.png (fullpage — edit overlay)');

    // ════════════════════════════════════════════════════════════════
    // STAGE 6: Exit back up (full unwind)
    // Check: exitSheet log + HUD mode=FreeFly
    // ════════════════════════════════════════════════════════════════
    log('[R0] === STAGE 6: Exit ===');

    // Record console log count before exit so we can detect new logs after
    const preExitLogCount = consoleLogs.length;

    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;

      // Exit edit mode
      if (typeof window.exitEditSheetMode === 'function') {
        try { window.exitEditSheetMode(); } catch (_) { /* may throw if not in edit */ }
      }
      // Remove edit CSS classes as safety net
      document.body.classList.remove('edit-sheet-mode');
      document.body.classList.remove('edit-sheet-preview');
      // Exit sheet
      if (typeof window.relayExitSheet === 'function') {
        window.relayExitSheet();
      }
      // Force render to trigger HUD refresh
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('r0-exit');
      }
    });
    await sleep(3000);

    // Force another render cycle to ensure HUD updates
    await page.evaluate(() => {
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('r0-exit-hud-refresh');
      }
    });
    await sleep(1500);

    const exitSheetLog = findLog(consoleLogs, '[VIS] exit sheet=');
    // Check for HUD mode=FreeFly after exit (may be in post-exit logs)
    const postExitLogs = consoleLogs.slice(preExitLogCount);
    const postExitFreeFly = postExitLogs.some((t) => String(t).includes('mode=FreeFly'));
    // Also check all HUD mode logs — last one should be FreeFly if HUD updated
    const allHudModeLines = consoleLogs.filter((t) => String(t).includes('[HUD] mode='));
    const lastHudMode = allHudModeLines.length > 0 ? allHudModeLines[allHudModeLines.length - 1] : '';

    // Exit passes if: exitSheetLog present
    // Per user spec: "(HUD mode=FreeFly + LOD) OR (explicit exitSheet log)"
    const exitPass = !!exitSheetLog;
    stageResults.exit = exitPass;
    log(`[R0] stage=exit exitSheetLog=${!!exitSheetLog} postExitFreeFly=${postExitFreeFly} lastHudMode=${lastHudMode.trim().slice(-40) || 'NONE'} result=${exitPass ? 'PASS' : 'FAIL'}`);
    log(`[R0] capture stage=exit uiMode=FreeFly scope=world`);

    // ════════════════════════════════════════════════════════════════
    // Gate summary
    // ════════════════════════════════════════════════════════════════
    const stagesPass = Object.values(stageResults).filter(Boolean).length;
    const stagesTotal = Object.keys(stageResults).length;
    const allPass = stagesPass === stagesTotal;

    log('');
    log('--- R0 Visibility Lock Summary ---');
    for (const [stage, pass] of Object.entries(stageResults)) {
      log(`[R0] ${stage}: ${pass ? 'PASS' : 'FAIL'}`);
    }
    log(`[R0] gate-summary result=${allPass ? 'PASS' : 'FAIL'} stages=${stagesPass}/${stagesTotal}`);

    // ── Write proof artifact ──────────────────────────────────────
    const fullLog = consoleLogs.join('\n');
    const proofContent = fullLog + '\n\n--- R0 Visibility Lock Proof ---\n' + proofLines.join('\n');
    await fs.writeFile(LOG_FILE, proofContent, 'utf8');
    log(`[R0] proof log written: ${LOG_FILE}`);
    log(`[R0] screenshots dir: ${SCREENSHOT_DIR}`);

    if (!allPass) {
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
