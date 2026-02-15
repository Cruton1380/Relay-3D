/**
 * COMPANY-TEMPLATE-FLOW-1 (Phase 5) proof.
 * Spec: docs/restoration/COMPANY-TEMPLATE-FLOW-1-SPEC.md
 *
 * Stages:
 *   1. Boot launch → [FLOW] moduleLoaded=P2P result=PASS
 *   2. Screenshot 01-before.png
 *   3. Trigger Simulate Event → [FLOW] dataPath, timeboxUpdate, treeMotion
 *   4. Screenshot 02-after.png
 *   5. [FLOW-PROOF] gate-summary result=PASS
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `company-template-flow-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `company-template-flow-console-${DATE_TAG}.log`);
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

    log('[FLOW-PROOF] loading launch URL...');
    await page.goto(LAUNCH_URL, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayGetProfile === 'function' && window.relayGetProfile() === 'launch' && !!window.filamentRenderer,
      undefined,
      { timeout: 90000 }
    );
    await sleep(4000);

    const fullLog = consoleLogs.join('\n');

    // Stage 1: [FLOW] moduleLoaded=P2P result=PASS
    stages.s1 = hasLog(fullLog, '[FLOW] moduleLoaded=P2P result=PASS');
    log(`[FLOW-PROOF] stage1 moduleLoaded: ${stages.s1 ? 'PASS' : 'FAIL'}`);

    // Stage 2: Screenshot before
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-before.png') });
    stages.s2 = true;
    log('[FLOW-PROOF] stage2 screenshot 01-before.png captured');

    // Stage 3: Trigger Simulate Event
    const triggerResult = await page.evaluate(() => {
      if (typeof window.relaySimulateFlowEvent !== 'function') return { ok: false, reason: 'no relaySimulateFlowEvent' };
      const result = window.relaySimulateFlowEvent();
      return { ok: true, success: result?.success ?? false, sheetId: result?.sheetId ?? null };
    });
    log(`[FLOW-PROOF] trigger result: ${JSON.stringify(triggerResult)}`);
    await sleep(5000);

    const fullLog2 = consoleLogs.join('\n');
    stages.s3 = hasLog(fullLog2, '[FLOW] dataPath route=') && hasLog(fullLog2, '[FLOW] timeboxUpdate branch=') && hasLog(fullLog2, '[FLOW] treeMotion=PASS');
    log(`[FLOW-PROOF] stage3 dataPath+timeboxUpdate+treeMotion: ${stages.s3 ? 'PASS' : 'FAIL'}`);

    // Stage 4: Screenshot after
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-after.png') });
    stages.s4 = true;
    log('[FLOW-PROOF] stage4 screenshot 02-after.png captured');

    stages.s5 = true;
    const passCount = Object.values(stages).filter(Boolean).length;
    const totalStages = 5;
    const gatePass = stages.s1 && stages.s2 && stages.s3 && stages.s4 && stages.s5;
    log(`[FLOW-PROOF] gate-summary result=${gatePass ? 'PASS' : 'FAIL'} stages=${passCount}/${totalStages}`);

    await fs.writeFile(LOG_FILE, fullLog2 + '\n\n--- COMPANY-TEMPLATE-FLOW-1 proof ---\n' + proofLines.join('\n'), 'utf8');
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
