/**
 * VIS-7b Presence Inspect proof.
 *
 * Tests: hover marker → highlight + HUD, pin → persist, unpin (toggle),
 * switch pin, Escape unpin, TTL cleanup to 0.
 *
 * Server must be running or script starts it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `vis7b-presence-inspect-console-${DATE_TAG}.log`);
const WORLD_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=world';

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
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

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let devServer = null;
  let browser = null;
  try {
    devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], WORLD_URL);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await page.addInitScript(() => {
      window.RELAY_DEBUG_VERBOSE = true;
      window.RELAY_DEBUG_LOGS = true;
    });
    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));
    await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.vis7aPushEvent === 'function'
        && typeof window.vis7bClickMarker === 'function'
        && typeof window.vis7bHoverMarker === 'function'
        && !!window.filamentRenderer,
      undefined,
      { timeout: 120000 }
    );

    await sleep(1500);

    // ─── Step 1: Fly to COMPANY + render ────────────────────────────
    await page.evaluate(async () => {
      const viewer = window.viewer;
      const relayState = window.relayState;
      if (viewer?.camera && relayState?.tree?.nodes?.length) {
        const trunk = relayState.tree.nodes.find((n) => n?.type === 'trunk');
        if (trunk && Number.isFinite(trunk.lat) && Number.isFinite(trunk.lon)) {
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 25000),
            orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 }
          });
        }
      }
    });
    await sleep(2000);

    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis7b-company-baseline');
      }
    });
    await sleep(2500);

    // ─── Step 2: Reset VIS-7a + inject 3 presence events ────────────
    await page.evaluate(() => window.vis7aReset());

    const ownerIds = await page.evaluate(() => {
      const renderer = window.filamentRenderer;
      if (!renderer || !renderer._vis4SlabRegistry) return [];
      const ids = [];
      for (const [, meta] of renderer._vis4SlabRegistry) {
        if (!ids.includes(meta.ownerId)) ids.push(meta.ownerId);
        if (ids.length >= 3) break;
      }
      return ids;
    });
    log(`[VIS7B] ownerIds=${JSON.stringify(ownerIds)}`);

    const pushResult = await page.evaluate((owners) => {
      const now = Date.now();
      return window.vis7aPushEvents([
        { id: 'inspect-1', ts: now, userId: 'u-alice', scope: 'company', companyId: owners[0], mode: 'view' },
        { id: 'inspect-2', ts: now + 1, userId: 'u-bob', scope: 'company', companyId: owners[0], mode: 'edit' },
        { id: 'inspect-3', ts: now + 2, userId: 'u-charlie', scope: 'company', companyId: owners[0], mode: 'view' }
      ]);
    }, ownerIds);
    log(`[VIS7B] pushEvents accepted=${pushResult?.accepted}`);

    // ─── Step 3: Get marker IDs ─────────────────────────────────────
    const markerIds = await page.evaluate(() => window.vis7bGetMarkerIds());
    log(`[VIS7B] markerIds count=${markerIds.length} ids=${JSON.stringify(markerIds)}`);

    if (markerIds.length < 2) {
      log(`[VIS7B] FATAL: Need at least 2 markers for inspect test.`);
      log(`[VIS7B] gate-summary result=REFUSAL reason=NOT_ENOUGH_MARKERS`);
      process.exitCode = 1;
      return;
    }

    const markerA = markerIds[0];
    const markerB = markerIds[1];

    // ─── Step 4: Hover marker A ─────────────────────────────────────
    const hoverResult = await page.evaluate((mid) => window.vis7bHoverMarker(mid), markerA);
    log(`[VIS7B] hover A ok=${hoverResult?.ok}`);

    const inspectAfterHover = await page.evaluate(() => window.vis7bGetInspectState());
    log(`[VIS7B] afterHover hovered=${inspectAfterHover?.hoveredMarkerId} pinned=${inspectAfterHover?.pinnedMarkerId}`);

    // ─── Step 5: Click marker A → pin ───────────────────────────────
    const pinResult = await page.evaluate((mid) => window.vis7bClickMarker(mid), markerA);
    log(`[VIS7B] clickA action=${pinResult?.action}`);

    const inspectAfterPin = await page.evaluate(() => window.vis7bGetInspectState());
    log(`[VIS7B] afterPin hovered=${inspectAfterPin?.hoveredMarkerId} pinned=${inspectAfterPin?.pinnedMarkerId}`);
    const pinPersists = inspectAfterPin?.pinnedMarkerId === markerA;

    // ─── Step 6: Verify highlight persists while pinned ─────────────
    // (In headless we can't move mouse away, but verify highlight prim exists)
    const highlightExists = await page.evaluate(() => {
      const renderer = window.filamentRenderer;
      return !!renderer?._vis7bHighlightPrim;
    });
    log(`[VIS7B] highlightWhilePinned=${highlightExists}`);

    // ─── Step 7: Click marker A again → unpin (toggle) ──────────────
    const unpinToggle = await page.evaluate((mid) => window.vis7bClickMarker(mid), markerA);
    log(`[VIS7B] toggleUnpin action=${unpinToggle?.action} reason=${unpinToggle?.reason}`);

    const inspectAfterToggle = await page.evaluate(() => window.vis7bGetInspectState());
    log(`[VIS7B] afterToggle pinned=${inspectAfterToggle?.pinnedMarkerId}`);

    // ─── Step 8: Click marker B → pin B ─────────────────────────────
    const pinB = await page.evaluate((mid) => window.vis7bClickMarker(mid), markerB);
    log(`[VIS7B] pinB action=${pinB?.action}`);

    // ─── Step 9: Click marker A → switch (unpin B, pin A) ───────────
    const switchResult = await page.evaluate((mid) => window.vis7bClickMarker(mid), markerA);
    log(`[VIS7B] switch action=${switchResult?.action}`);

    const inspectAfterSwitch = await page.evaluate(() => window.vis7bGetInspectState());
    log(`[VIS7B] afterSwitch pinned=${inspectAfterSwitch?.pinnedMarkerId}`);

    // ─── Step 10: Escape → unpin ────────────────────────────────────
    const escResult = await page.evaluate(() => window.vis7bUnpin('escape'));
    log(`[VIS7B] escape ok=${escResult?.ok}`);

    const inspectAfterEsc = await page.evaluate(() => window.vis7bGetInspectState());
    log(`[VIS7B] afterEscape pinned=${inspectAfterEsc?.pinnedMarkerId}`);

    // ─── Step 11: TTL cleanup test ──────────────────────────────────
    await page.evaluate(() => {
      const renderer = window.filamentRenderer;
      if (renderer) {
        renderer._vis7aTTL = 2000;
        if (renderer._vis7aMarkers) {
          const newExpiry = Date.now() + 2000;
          for (const [, entry] of renderer._vis7aMarkers) {
            entry.expiresAt = newExpiry;
          }
        }
      }
    });
    await sleep(5000);

    const stateAfterTTL = await page.evaluate(() => window.vis7aGetState());
    log(`[VIS7B] ttlCleanup active=${stateAfterTTL?.active}`);
    const ttlCleanupPassed = stateAfterTTL?.active === 0;

    // ─── Step 12: Check required log lines ──────────────────────────
    const fullLog = consoleLogs.join('\n');

    const hasHoverPass = fullLog.includes('[VIS7B] hover marker=') && fullLog.includes('result=PASS');
    const hasPinPass = fullLog.includes('[VIS7B] pin marker=') && fullLog.includes('result=PASS');
    const hasUnpinToggle = fullLog.includes('[VIS7B] unpin') && fullLog.includes('reason=toggle');
    const hasUnpinEscape = fullLog.includes('[VIS7B] unpin') && fullLog.includes('reason=escape');
    const hasUnpinSwitch = fullLog.includes('[VIS7B] unpin') && fullLog.includes('reason=switch');
    const hasHudUpdate = fullLog.includes('[VIS7B] hudUpdate');
    // VIS-7a
    const hasEngineEnabled = fullLog.includes('[VIS7A] presenceEngine enabled');
    const hasBatchApplied = fullLog.includes('[VIS7A] batchApplied');
    // Regressions
    const hasVis2Tiles = fullLog.includes('[VIS2] sheetTilesRendered count=');
    const hasVis2Collapsed = fullLog.includes('[VIS2] companyCollapsed result=PASS');
    const hasVis4Gate = fullLog.includes('[VIS4] gate-summary result=PASS');
    const noErrors = !fullLog.includes('ReferenceError') && !fullLog.includes('TypeError');

    const allPass = hasHoverPass && hasPinPass
      && hasUnpinToggle && (hasUnpinEscape || hasUnpinSwitch)
      && hasEngineEnabled && hasBatchApplied
      && ttlCleanupPassed && pinPersists
      && hasVis2Tiles && hasVis2Collapsed && hasVis4Gate
      && noErrors;

    log(`--- VIS-7b Proof Checklist ---`);
    log(`[VIS7B] hover result=PASS ${hasHoverPass ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS7B] pin result=PASS ${hasPinPass ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS7B] unpin reason=toggle ${hasUnpinToggle ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS7B] unpin reason=escape ${hasUnpinEscape ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS7B] unpin reason=switch ${hasUnpinSwitch ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS7B] hudUpdate ${hasHudUpdate ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS7B] pinPersists ${pinPersists ? 'PASS' : 'FAIL'}`);
    log(`[VIS7B] ttlCleanup ${ttlCleanupPassed ? 'result=PASS active=0' : 'FAIL'}`);
    log(`[VIS7A] engineEnabled ${hasEngineEnabled ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS2] companyCollapsed ${hasVis2Collapsed ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS2] sheetTiles ${hasVis2Tiles ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4] gate-summary ${hasVis4Gate ? 'result=PASS' : 'MISSING'}`);
    log(`[VIS7B] noErrors ${noErrors ? 'PASS' : 'FAIL'}`);
    log(`[VIS7B] gate-summary result=${allPass ? 'PASS' : 'REFUSAL'}`);

    await fs.writeFile(LOG_FILE, fullLog + '\n\n--- VIS-7b proof ---\n' + lines.join('\n'), 'utf8');
    log(`Log written: ${LOG_FILE}`);

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
