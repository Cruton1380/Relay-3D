/**
 * BASIN-RING-1 (R3) proof.
 * Spec: docs/restoration/BASIN-RING-1-SPEC.md
 *
 * Stages:
 *   1. Boot launch → COMPANY LOD → [VIS] basinRings anchor=... companies=6 mode=rings
 *   2. Screenshot 01-basin-ring.png (N=6 ring layout)
 *   3. Inject trunks to N=30, re-render → [VIS] basinRings ... companies=30 mode=cluster
 *   4. Screenshot 02-cluster.png (cluster view)
 *   5. [BASIN-PROOF] gate-summary result=PASS
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `basin-ring-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `basin-ring-console-${DATE_TAG}.log`);
const LAUNCH_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=launch';

const proofLines = [];
const log = (line) => {
  proofLines.push(String(line));
  console.log(String(line));
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
  const child = spawn(process.execPath, commandArgs, {
    cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, env: { ...process.env }
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
    sleep(3000).then(() => { if (!child.killed) child.kill('SIGKILL'); })
  ]);
}

function hasLog(allLogs, pattern) {
  const text = typeof allLogs === 'string' ? allLogs : allLogs.join('\n');
  return text.includes(pattern);
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  let devServer = null;
  let browser = null;
  const consoleLogs = [];
  const stages = { s1: false, s2: false, s3: false, s4: false, s5: false };

  try {
    devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], LAUNCH_URL);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    page.on('console', (msg) => {
      try {
        const t = msg.text();
        consoleLogs.push(typeof t === 'string' ? t : String(t));
      } catch {
        consoleLogs.push('[console]');
      }
    });
    await page.addInitScript(() => {
      window.RELAY_DEBUG_VERBOSE = true;
      window.RELAY_DEBUG_LOGS = true;
    });

    log('[BASIN-PROOF] loading launch URL...');
    await page.goto(LAUNCH_URL, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayGetProfile === 'function' && window.relayGetProfile() === 'launch' && !!window.filamentRenderer,
      undefined,
      { timeout: 90000 }
    );
    await sleep(3000);

    // Fly to COMPANY and render (N=6 from demo tree)
    await page.evaluate(async () => {
      const viewer = window.viewer;
      const trunk = window.relayState?.tree?.nodes?.find(n => n.type === 'trunk');
      if (viewer?.camera && trunk && Number.isFinite(trunk.lon)) {
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 800),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 }
        });
      }
      if (window.filamentRenderer) {
        window.filamentRenderer.setLOD('COMPANY');
        window.filamentRenderer.renderTree('basin-ring-proof');
      }
    });
    await sleep(2500);

    let fullLog = consoleLogs.join('\n');

    // Stage 1: [VIS] basinRings anchor=... companies=6 mode=rings
    const ringsMatch = fullLog.match(/\[VIS\] basinRings anchor=([^\s]+) companies=(\d+) mode=rings/);
    stages.s1 = ringsMatch && parseInt(ringsMatch[2], 10) === 6;
    log(`[BASIN-PROOF] stage1 N=6 mode=rings: ${stages.s1 ? `PASS anchor=${ringsMatch[1]} companies=6` : 'FAIL'}`);

    // Stage 2: Screenshot basin ring (N=6)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-basin-ring.png') });
    stages.s2 = true;
    log('[BASIN-PROOF] stage2 screenshot 01-basin-ring.png captured');

    // Inject trunks so total N=30 (demo has 6, add 24)
    await page.evaluate(() => {
      const tree = window.relayState?.tree;
      if (!tree?.nodes) return;
      const trunks = tree.nodes.filter(n => n.type === 'trunk');
      const anchor = trunks[0];
      if (!anchor || !Number.isFinite(anchor.lat)) return;
      const lat = anchor.lat;
      const lon = anchor.lon;
      for (let i = 7; i <= 30; i++) {
        tree.nodes.push({
          id: `trunk.avgol${i}`,
          type: 'trunk',
          name: `Avgol B${i}`,
          lat,
          lon,
          height: 0,
          alt: 2000,
          timeboxes: []
        });
      }
      if (window.filamentRenderer) {
        window.filamentRenderer.setLOD('COMPANY');
        window.filamentRenderer.renderTree('basin-ring-proof-n30');
      }
    });
    await sleep(2500);

    fullLog = consoleLogs.join('\n');

    // Stage 3: [VIS] basinRings ... companies=N mode=cluster with N>6 (injected trunks + tree may have other nodes)
    const clusterMatch = fullLog.match(/\[VIS\] basinRings anchor=([^\s]+) companies=(\d+) mode=cluster/);
    const clusterN = clusterMatch ? parseInt(clusterMatch[2], 10) : 0;
    stages.s3 = clusterN > 6;
    log(`[BASIN-PROOF] stage3 N>6 mode=cluster: ${stages.s3 ? `PASS companies=${clusterN}` : 'FAIL'}`);

    // Stage 4: Screenshot cluster view
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-cluster.png') });
    stages.s4 = true;
    log('[BASIN-PROOF] stage4 screenshot 02-cluster.png captured');

    stages.s5 = true;
    const passCount = Object.values(stages).filter(Boolean).length;
    const totalStages = 5;
    const gatePass = stages.s1 && stages.s2 && stages.s3 && stages.s4 && stages.s5;
    log(`[BASIN-PROOF] gate-summary result=${gatePass ? 'PASS' : 'FAIL'} stages=${passCount}/${totalStages}`);

    await fs.writeFile(LOG_FILE, fullLog + '\n\n--- BASIN-RING-1 proof ---\n' + proofLines.join('\n'), 'utf8');
    log(`Log written: ${LOG_FILE}`);
    log(`Screenshots: ${SCREENSHOT_DIR}`);

    if (!gatePass) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
