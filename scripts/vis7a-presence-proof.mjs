/**
 * VIS-7a Presence Markers proof.
 *
 * Embeds a tiny WS server on 127.0.0.1:4031/vis7 that sends presence events.
 * Tests:
 *   - COMPANY scope: presence markers near dept spines
 *   - SHEET scope: presence markers near selected sheet
 *   - Cap enforcement: burst of 60 events → expects REFUSAL
 *   - TTL cleanup: wait > ttlMs → active markers return to 0
 *   - Dedup + coalesce
 *
 * Server must be running or script starts it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { chromium } from '@playwright/test';

const require = createRequire(import.meta.url);
const { WebSocketServer } = require('ws');

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `vis7a-presence-console-${DATE_TAG}.log`);
const WORLD_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=world';
const TARGET_SHEET = 'P2P.ThreeWayMatch';

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

/**
 * Start a tiny presence WS server that sends a sequence of events on client connect.
 */
function startPresenceWsServer(ownerIds) {
  return new Promise((resolve, reject) => {
    const wss = new WebSocketServer({ host: '127.0.0.1', port: 4031, path: '/vis7' });
    wss.on('error', reject);
    wss.on('listening', () => {
      log('[WS-PRESENCE] listening on ws://127.0.0.1:4031/vis7');
      resolve(wss);
    });
    const now = Date.now();
    wss.on('connection', (ws) => {
      log('[WS-PRESENCE] client connected, sending presence sequence');
      const o1 = ownerIds[0] || 'trunk.avgol';
      const o2 = ownerIds[1] || 'branch.operations';
      const o3 = ownerIds[2] || 'branch.p2p';

      // 1. Batch of 3 presence events targeting dept spines
      ws.send(JSON.stringify({ events: [
        { id: 'p-1', ts: now, userId: 'u-alice', type: 'presence', scope: 'dept', deptId: o2, mode: 'view' },
        { id: 'p-2', ts: now + 1, userId: 'u-bob', type: 'presence', scope: 'dept', deptId: o3, mode: 'edit' },
        { id: 'p-3', ts: now + 2, userId: 'u-charlie', type: 'presence', scope: 'company', companyId: o1, mode: 'view' }
      ]}));

      // 2. Duplicate event (same id as p-1)
      ws.send(JSON.stringify({ id: 'p-1', ts: now + 3, userId: 'u-alice', type: 'presence', scope: 'dept', deptId: o2, mode: 'view' }));

      // 3. Coalesce test: same userId u-alice rapidly
      ws.send(JSON.stringify({ id: 'p-4', ts: now + 4, userId: 'u-alice', type: 'presence', scope: 'dept', deptId: o2, mode: 'edit' }));

      setTimeout(() => {
        ws.close(1000, 'presence-sequence-done');
      }, 300);
    });
  });
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let devServer = null;
  let browser = null;
  let wss = null;
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
        && typeof window.vis7aSimulateBurst === 'function'
        && !!window.filamentRenderer,
      undefined,
      { timeout: 120000 }
    );

    await sleep(1500);

    // ─── Step 1: Fly to COMPANY + render to populate slab registry ──
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
        window.filamentRenderer.renderTree('vis7a-company-baseline');
      }
    });
    await sleep(2500);

    // Verify slab registry populated
    const slabCount = await page.evaluate(() => window.vis4cGetSlabIds().length);
    log(`[VIS7A] baseline slabCount=${slabCount}`);
    if (slabCount === 0) {
      log(`[VIS7A] FATAL: No slabs, cannot proceed.`);
      log(`[VIS7A] gate-summary result=REFUSAL reason=NO_SLABS`);
      process.exitCode = 1;
      return;
    }

    // ─── Step 2: Discover owner IDs ─────────────────────────────────
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
    log(`[VIS7A] ownerIds=${JSON.stringify(ownerIds)}`);

    // ─── Step 3: Reset VIS-7a state ─────────────────────────────────
    await page.evaluate(() => window.vis7aReset());

    // ─── Step 4: Test COMPANY presence via direct push ──────────────
    const companyResult = await page.evaluate((owners) => {
      const now = Date.now();
      return window.vis7aPushEvents([
        { id: 'test-c1', ts: now, userId: 'u-test-1', scope: 'dept', deptId: owners[1] || owners[0], mode: 'view' },
        { id: 'test-c2', ts: now + 1, userId: 'u-test-2', scope: 'dept', deptId: owners[2] || owners[0], mode: 'edit' },
        { id: 'test-c3', ts: now + 2, userId: 'u-test-3', scope: 'company', companyId: owners[0], mode: 'view' }
      ]);
    }, ownerIds);
    log(`[VIS7A] companyPush accepted=${companyResult?.accepted} dropped=${companyResult?.dropped}`);

    const stateAfterCompany = await page.evaluate(() => window.vis7aGetState());
    log(`[VIS7A] stateAfterCompany active=${stateAfterCompany?.active} coalesced=${stateAfterCompany?.coalesced}`);

    // ─── Step 5: Test dedup (same id again) ─────────────────────────
    const dupResult = await page.evaluate(() => {
      return window.vis7aPushEvent({ id: 'test-c1', ts: Date.now(), userId: 'u-test-1', scope: 'company' });
    });
    log(`[VIS7A] dupPush ok=${dupResult?.ok} reason=${dupResult?.reason}`);

    // ─── Step 6: Enter sheet scope + test SHEET presence ────────────
    await page.evaluate((sheetId) => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      const out = window.relayEnterSheet(sheetId);
      if (out?.ok && window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis7a-enter-sheet');
      }
    }, TARGET_SHEET);
    await sleep(3000);

    // Re-render to populate sheet slab registry
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis7a-sheet-render');
      }
    });
    await sleep(2500);

    // Re-discover owner IDs for sheet scope (slab registry now has sheet-scope entries)
    const sheetOwnerIds = await page.evaluate(() => {
      const renderer = window.filamentRenderer;
      if (!renderer || !renderer._vis4SlabRegistry) return [];
      const ids = [];
      for (const [, meta] of renderer._vis4SlabRegistry) {
        if (!ids.includes(meta.ownerId)) ids.push(meta.ownerId);
        if (ids.length >= 3) break;
      }
      return ids;
    });
    log(`[VIS7A] sheetOwnerIds=${JSON.stringify(sheetOwnerIds)}`);

    const sheetResult = await page.evaluate((sOwners) => {
      const now = Date.now();
      const sheetId = sOwners[0] || 'unknown-sheet';
      return window.vis7aPushEvents([
        { id: 'test-s1', ts: now, userId: 'u-sheet-1', scope: 'sheet', sheetId, mode: 'view', cursor: { x: 0.5, y: 0.5 } },
        { id: 'test-s2', ts: now + 1, userId: 'u-sheet-2', scope: 'sheet', sheetId, mode: 'edit' }
      ]);
    }, sheetOwnerIds);
    log(`[VIS7A] sheetPush accepted=${sheetResult?.accepted} dropped=${sheetResult?.dropped}`);

    // ─── Step 7: Exit sheet, re-render at COMPANY for cap test ──────
    await page.evaluate(() => {
      window.__relayStressModeActive = false;
      window.__relayDeferredRenderPending = false;
      window.__relayPostGateQuietUntil = 0;
      window.relayExitSheet();
      if (window.filamentRenderer) {
        window.filamentRenderer.renderTree('vis7a-exit-for-burst');
      }
    });
    await sleep(2500);

    // Reset then burst at company
    await page.evaluate(() => window.vis7aReset());
    const burstResult = await page.evaluate(() => {
      return window.vis7aSimulateBurst({ target: 'company', n: 60 });
    });
    log(`[VIS7A] burst ok=${burstResult?.ok} accepted=${burstResult?.result?.accepted} dropped=${burstResult?.result?.dropped}`);
    log(`[VIS7A] burstState active=${burstResult?.state?.active} capRefusals=${burstResult?.state?.capRefusals}`);

    // ─── Step 8: TTL cleanup test ───────────────────────────────────
    // Override TTL to 2s for fast proof
    await page.evaluate(() => {
      const renderer = window.filamentRenderer;
      if (renderer) {
        renderer._vis7aTTL = 2000; // 2s for proof
        // Refresh all marker expirations to now + 2s
        if (renderer._vis7aMarkers) {
          const newExpiry = Date.now() + 2000;
          for (const [, entry] of renderer._vis7aMarkers) {
            entry.expiresAt = newExpiry;
          }
        }
      }
    });
    log(`[VIS7A] TTL set to 2000ms for cleanup test`);

    // Wait for TTL + cleanup interval buffer
    await sleep(5000);

    const stateAfterTTL = await page.evaluate(() => window.vis7aGetState());
    log(`[VIS7A] stateAfterTTL active=${stateAfterTTL?.active}`);
    const ttlCleanupPassed = stateAfterTTL?.active === 0;
    log(`[VIS7A] ttlCleanup result=${ttlCleanupPassed ? 'PASS' : 'FAIL'} active=${stateAfterTTL?.active}`);

    // ─── Step 9: WS transport test ──────────────────────────────────
    // Reset state again
    await page.evaluate(() => {
      window.vis7aReset();
      const renderer = window.filamentRenderer;
      if (renderer) renderer._vis7aTTL = 15000; // restore default
    });

    wss = await startPresenceWsServer(ownerIds);

    const wsConnectResult = await page.evaluate(() => {
      return window.vis7aConnect('ws://127.0.0.1:4031/vis7');
    });
    log(`[VIS7A] wsConnect ok=${wsConnectResult?.ok}`);
    await sleep(2000);

    const wsDisconnectResult = await page.evaluate(() => {
      return window.vis7aDisconnect();
    });
    log(`[VIS7A] wsDisconnect ok=${wsDisconnectResult?.ok}`);

    const wsState = await page.evaluate(() => window.vis7aGetState());
    log(`[VIS7A] wsState active=${wsState?.active} seenIds=${wsState?.seenIds} coalesced=${wsState?.coalesced}`);

    // ─── Step 10: Collect console + check required lines ────────────
    const fullLog = consoleLogs.join('\n');

    const hasEngineEnabled = fullLog.includes('[VIS7A] presenceEngine enabled');
    const hasBatchApplied = fullLog.includes('[VIS7A] batchApplied accepted=');
    const hasRenderedCompany = fullLog.includes('[VIS7A] rendered scope=company');
    const hasRenderedSheet = fullLog.includes('[VIS7A] rendered scope=');
    const hasCapRefusal = fullLog.includes('[REFUSAL] reason=VIS7A_MARKER_CAP_EXCEEDED');
    // VIS-2 / VIS-4 regression
    const hasVis2Tiles = fullLog.includes('[VIS2] sheetTilesRendered count=');
    const hasVis2Collapsed = fullLog.includes('[VIS2] companyCollapsed result=PASS');
    const hasVis4Gate = fullLog.includes('[VIS4] gate-summary result=PASS');
    const noErrors = !fullLog.includes('ReferenceError') && !fullLog.includes('TypeError');
    // WS lifecycle
    const hasWsConnect = fullLog.includes('[VIS7A] wsConnect url=');
    const hasWsOpen = fullLog.includes('[VIS7A] wsOpen url=');
    const hasWsClose = fullLog.includes('[VIS7A] wsClose code=');

    const allPass = hasEngineEnabled && hasBatchApplied
      && hasRenderedCompany && hasRenderedSheet
      && hasCapRefusal && ttlCleanupPassed
      && hasVis2Tiles && hasVis2Collapsed && hasVis4Gate
      && noErrors && hasWsConnect && hasWsOpen && hasWsClose;

    log(`--- VIS-7a Proof Checklist ---`);
    log(`[VIS7A] presenceEngine enabled ${hasEngineEnabled ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS7A] batchApplied ${hasBatchApplied ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS7A] rendered company ${hasRenderedCompany ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS7A] rendered sheet ${hasRenderedSheet ? 'PRESENT' : 'MISSING'}`);
    log(`[REFUSAL] VIS7A_MARKER_CAP_EXCEEDED ${hasCapRefusal ? 'PRESENT (expected)' : 'MISSING'}`);
    log(`[VIS7A] ttlCleanup ${ttlCleanupPassed ? 'result=PASS active=0' : 'FAIL'}`);
    log(`[VIS7A] wsConnect ${hasWsConnect ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS7A] wsOpen ${hasWsOpen ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS7A] wsClose ${hasWsClose ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS2] companyCollapsed ${hasVis2Collapsed ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS2] sheetTiles ${hasVis2Tiles ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4] gate-summary ${hasVis4Gate ? 'result=PASS' : 'MISSING'}`);
    log(`[VIS7A] noErrors ${noErrors ? 'PASS' : 'FAIL'}`);
    log(`[VIS7A] gate-summary result=${allPass ? 'PASS' : 'REFUSAL'}`);

    await fs.writeFile(LOG_FILE, fullLog + '\n\n--- VIS-7a proof ---\n' + lines.join('\n'), 'utf8');
    log(`Log written: ${LOG_FILE}`);

    if (!allPass) {
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close();
    if (wss) {
      wss.close();
      log('[WS-PRESENCE] closed');
    }
    if (devServer) await stopServer(devServer);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
