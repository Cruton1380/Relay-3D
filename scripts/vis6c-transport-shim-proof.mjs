/**
 * VIS-6c Transport Shim proof.
 *
 * Embeds a tiny WS server on 127.0.0.1:4030 that sends:
 *   - 5 valid events (including dups + same-owner within 500ms for coalesce)
 *   - 1 invalid JSON message
 *   - 2 invalid events (missing fields / bad ts)
 *
 * Opens the world page, enables VIS-6c, connects, waits for logs,
 * disconnects, and checks all required PASS lines.
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
const LOG_FILE = path.join(PROOFS_DIR, `vis6c-transport-shim-console-${DATE_TAG}.log`);
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

/**
 * Start a tiny WS server that sends a deterministic sequence of messages
 * to each connecting client, then closes.
 */
function startWsServer(ownerIds) {
  return new Promise((resolve, reject) => {
    const wss = new WebSocketServer({ host: '127.0.0.1', port: 4030, path: '/vis6' });
    wss.on('error', (err) => {
      // If address in use, try to close and retry
      reject(err);
    });
    wss.on('listening', () => {
      log('[WS-SERVER] listening on ws://127.0.0.1:4030/vis6');
      resolve(wss);
    });
    const now = Date.now();
    wss.on('connection', (ws) => {
      log('[WS-SERVER] client connected, sending test sequence');
      // Use real owner IDs from the page (passed in), or fallback
      const o1 = ownerIds[0] || 'trunk.avgol';
      const o2 = ownerIds[1] || 'branch.operations';
      const o3 = ownerIds[2] || 'branch.p2p';

      // 1. Valid single event (trunk)
      ws.send(JSON.stringify({
        id: 'ws-evt-1', ts: now, ownerId: o1, timeboxId: 'T-WS-1', scope: 'company'
      }));

      // 2. Valid single event (dept branch)
      ws.send(JSON.stringify({
        id: 'ws-evt-2', ts: now + 1, ownerId: o2, timeboxId: 'T-WS-2', scope: 'company', deptId: o2
      }));

      // 3. Valid batch with 3 events (one dup of ws-evt-1, two new same-owner for coalesce)
      ws.send(JSON.stringify({ events: [
        { id: 'ws-evt-1', ts: now + 2, ownerId: o1, timeboxId: 'T-WS-1', scope: 'company' }, // dup
        { id: 'ws-evt-3', ts: now + 3, ownerId: o3, timeboxId: 'T-WS-3', scope: 'company', deptId: o3 },
        { id: 'ws-evt-4', ts: now + 4, ownerId: o3, timeboxId: 'T-WS-3', scope: 'company', deptId: o3 }, // same owner+timebox → coalesce candidate (but different id)
        { id: 'ws-evt-5', ts: now + 5, ownerId: o1, timeboxId: 'T-WS-5', scope: 'company' }
      ]}));

      // 4. Invalid JSON
      ws.send('THIS IS NOT JSON {{{');

      // 5. Invalid event (missing required fields)
      ws.send(JSON.stringify({ id: 'ws-bad-1', ts: now + 10 })); // missing ownerId + timeboxId

      // 6. Invalid event (bad ts)
      ws.send(JSON.stringify({ id: 'ws-bad-2', ts: 'not-a-number', ownerId: o1, timeboxId: 'T-BAD' }));

      // Give client time to process, then close
      setTimeout(() => {
        ws.close(1000, 'proof-sequence-complete');
      }, 500);
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
      window.RELAY_ENABLE_VIS6C = true; // enable transport shim
    });
    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));
    await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.vis6cConnect === 'function'
        && typeof window.vis6bPushEvent === 'function'
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
        window.filamentRenderer.renderTree('vis6c-company-baseline');
      }
    });
    await sleep(2500);

    // Verify slab registry populated
    const slabCount = await page.evaluate(() => window.vis4cGetSlabIds().length);
    log(`[VIS6C] baseline slabCount=${slabCount}`);
    if (slabCount === 0) {
      log(`[VIS6C] FATAL: No slabs, cannot proceed.`);
      log(`[VIS6C] gate-summary result=REFUSAL reason=NO_SLABS`);
      process.exitCode = 1;
      return;
    }

    // ─── Step 2: Discover real owner IDs for the WS server to use ───
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
    log(`[VIS6C] ownerIds=${JSON.stringify(ownerIds)}`);

    // ─── Step 3: Reset VIS-6b state (clean slate for transport test) ──
    await page.evaluate(() => window.vis6bReset());

    // ─── Step 4: Start WS server with real owner IDs ────────────────
    wss = await startWsServer(ownerIds);

    // ─── Step 5: Connect from the page ──────────────────────────────
    const connectResult = await page.evaluate(() => {
      return window.vis6cConnect('ws://127.0.0.1:4030/vis6');
    });
    log(`[VIS6C] connect ok=${connectResult?.ok} reason=${connectResult?.reason || 'none'}`);

    // ─── Step 6: Wait for WS messages to flow + pulses to complete ──
    await sleep(4000);

    // ─── Step 7: Disconnect ─────────────────────────────────────────
    const disconnectResult = await page.evaluate(() => {
      return window.vis6cDisconnect();
    });
    log(`[VIS6C] disconnect ok=${disconnectResult?.ok}`);
    await sleep(500);

    // ─── Step 8: Get transport state ────────────────────────────────
    const transportState = await page.evaluate(() => window.vis6cGetState());
    log(`[VIS6C] transportState connected=${transportState?.connected} accepted=${transportState?.accepted} dropped=${transportState?.dropped}`);

    // ─── Step 9: Get VIS-6b state to see what got through ───────────
    const vis6bState = await page.evaluate(() => window.vis6bGetState());
    log(`[VIS6C] vis6bState seen=${vis6bState?.seen} stats=${JSON.stringify(vis6bState?.stats)} dropped=${JSON.stringify(vis6bState?.dropped)}`);

    // ─── Step 10: Collect console output and check required lines ───
    const fullLog = consoleLogs.join('\n');

    const hasWsConnect = fullLog.includes('[VIS6C] wsConnect url=');
    const hasWsOpen = fullLog.includes('[VIS6C] wsOpen url=');
    const hasWsClose = fullLog.includes('[VIS6C] wsClose code=');
    const hasDropBadJson = fullLog.includes('[VIS6C] drop reason=bad_json');
    const hasDropMissing = fullLog.includes('[VIS6C] drop reason=missing_fields');
    const hasDropBadTs = fullLog.includes('[VIS6C] drop reason=bad_ts');
    const hasEventAccepted = fullLog.includes('[VIS6B] eventAccepted ');
    const hasPulseTriggered = fullLog.includes('[VIS6B] pulseTriggered ');
    const hasVis2Tiles = fullLog.includes('[VIS2] sheetTilesRendered count=');
    const hasVis2Collapsed = fullLog.includes('[VIS2] companyCollapsed result=PASS');
    const hasVis4Gate = fullLog.includes('[VIS4] gate-summary result=PASS');
    const noErrors = !fullLog.includes('ReferenceError') && !fullLog.includes('TypeError');

    const allPass = hasWsConnect && hasWsOpen && hasWsClose
      && hasDropBadJson && (hasDropMissing || hasDropBadTs)
      && hasEventAccepted && hasPulseTriggered
      && hasVis2Tiles && hasVis2Collapsed && hasVis4Gate
      && noErrors;

    log(`--- VIS-6c Proof Checklist ---`);
    log(`[VIS6C] wsConnect ${hasWsConnect ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS6C] wsOpen ${hasWsOpen ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS6C] wsClose ${hasWsClose ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS6C] drop bad_json ${hasDropBadJson ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS6C] drop missing_fields ${hasDropMissing ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS6C] drop bad_ts ${hasDropBadTs ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS6B] eventAccepted ${hasEventAccepted ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS6B] pulseTriggered ${hasPulseTriggered ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS2] companyCollapsed ${hasVis2Collapsed ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS2] sheetTiles ${hasVis2Tiles ? 'PRESENT' : 'MISSING'}`);
    log(`[VIS4] gate-summary ${hasVis4Gate ? 'result=PASS' : 'MISSING'}`);
    log(`[VIS6C] noErrors ${noErrors ? 'PASS' : 'FAIL'}`);
    log(`[VIS6C] gate-summary result=${allPass ? 'PASS' : 'REFUSAL'}`);

    await fs.writeFile(LOG_FILE, fullLog + '\n\n--- VIS-6c proof ---\n' + lines.join('\n'), 'utf8');
    log(`Log written: ${LOG_FILE}`);

    if (!allPass) {
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close();
    if (wss) {
      wss.close();
      log('[WS-SERVER] closed');
    }
    if (devServer) await stopServer(devServer);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
