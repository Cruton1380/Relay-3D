import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-12';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `globe-restore-0-proof-console-${DATE_TAG}.log`);
const SCREENSHOT_FILE = path.join(PROOFS_DIR, `globe-restore-0-proof-${DATE_TAG}.png`);
const APP_URL = 'http://127.0.0.1:3000/relay-cesium-world.html';

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 60000) {
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

async function startDevServer() {
  const alreadyReady = await waitForServer(APP_URL, 2500);
  if (alreadyReady) {
    return { child: null, started: false };
  }
  const child = spawn(process.execPath, ['scripts/dev-server.mjs'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  const ready = await waitForServer(APP_URL, 60000);
  if (!ready) {
    child.kill('SIGINT');
    throw new Error('DEV_SERVER_NOT_READY');
  }
  return { child, started: true };
}

async function stopDevServer(serverHandle) {
  if (!serverHandle?.started || !serverHandle?.child || serverHandle.child.killed) return;
  const child = serverHandle.child;
  child.kill('SIGINT');
  await Promise.race([
    new Promise((resolve) => child.once('close', resolve)),
    sleep(3000).then(() => {
      if (!child.killed) child.kill('SIGKILL');
    })
  ]);
}

async function runScenario(page) {
  return page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const getLayerCount = () => {
      const v = window.viewer;
      return Number(v?.imageryLayers?.length || 0);
    };
    if (typeof window.relayApplyImageryMode !== 'function' || typeof window.relayListImageryModes !== 'function') {
      return { ok: false, reason: 'IMAGERY_API_MISSING' };
    }
    const modes = window.relayListImageryModes();
    const modeIds = (modes || []).map((m) => m.id);
    const hasSatellite = modeIds.includes('satellite');
    if (!hasSatellite) {
      return { ok: false, reason: 'SATELLITE_MODE_MISSING', modeIds };
    }

    const stepA = window.relayApplyImageryMode('osm');
    await wait(350);
    const c1 = getLayerCount();
    const stepB = window.relayApplyImageryMode('satellite');
    await wait(350);
    const c2 = getLayerCount();
    const stepC = window.relayApplyImageryMode('osm');
    await wait(350);
    const c3 = getLayerCount();

    const layerCountsOk = c1 >= 1 && c2 >= 1 && c3 >= 1;
    const appliesOk = !!(stepA?.ok && stepB?.ok && stepC?.ok);
    return {
      ok: layerCountsOk && appliesOk,
      modeIds,
      hasSatellite,
      counts: [c1, c2, c3],
      appliesOk,
      layerCountsOk,
      steps: [stepA, stepB, stepC]
    };
  });
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let serverHandle = null;
  let browser = null;
  try {
    serverHandle = await startDevServer();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const globeLogs = [];
    const crashLogs = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[GLOBE] imagery mode=')) globeLogs.push(text);
      const lower = text.toLowerCase();
      if (lower.includes('uncaught') || lower.includes('syntaxerror') || lower.includes('referenceerror')) {
        crashLogs.push(text);
      }
    });
    page.on('pageerror', (err) => {
      crashLogs.push(`PAGEERROR: ${String(err?.message || err)}`);
    });

    await page.addInitScript(() => {
      window.RELAY_PROFILE = 'world';
    });
    let gotoOk = false;
    let gotoError = null;
    for (let i = 0; i < 3; i += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
        gotoOk = true;
        break;
      } catch (err) {
        gotoError = err;
        // eslint-disable-next-line no-await-in-loop
        await sleep(1200);
      }
    }
    if (!gotoOk) {
      throw gotoError || new Error('PAGE_GOTO_FAILED');
    }
    await page.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'world'
        && typeof window.relayApplyImageryMode === 'function'
        && typeof window.relayListImageryModes === 'function',
      undefined,
      { timeout: 120000 }
    );

    const run = await runScenario(page);
    if (!run.ok) {
      throw new Error(run.reason || 'GLOBE_RESTORE_0_SCENARIO_FAIL');
    }

    const logsOk = globeLogs.length >= 3;
    const crashFree = crashLogs.length === 0;
    const pass = run.ok && logsOk && crashFree;

    log(`[GLOBE-RESTORE-0] profile=world result=${run.ok ? 'PASS' : 'FAIL'}`);
    log(`[GLOBE-RESTORE-0] modes=${(run.modeIds || []).join(',')}`);
    log(`[GLOBE-RESTORE-0] imagery-switch result=${run.appliesOk ? 'PASS' : 'FAIL'} path=osm->satellite->osm`);
    log(`[GLOBE-RESTORE-0] imagery-layer-count result=${run.layerCountsOk ? 'PASS' : 'FAIL'} counts=${(run.counts || []).join(',')}`);
    log(`[GLOBE-RESTORE-0] globe-logs result=${logsOk ? 'PASS' : 'FAIL'} count=${globeLogs.length}`);
    log(`[GLOBE-RESTORE-0] crash-free result=${crashFree ? 'PASS' : 'FAIL'} errors=${crashLogs.length}`);
    log(`[GLOBE-RESTORE-0] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);

    await page.screenshot({ path: SCREENSHOT_FILE, fullPage: true });
    let screenshotCaptured = true;
    try {
      await fs.stat(SCREENSHOT_FILE);
    } catch {
      screenshotCaptured = false;
    }
    log(`[GLOBE-RESTORE-0] screenshot result=${screenshotCaptured ? 'PASS' : 'FAIL'} path=${path.basename(SCREENSHOT_FILE)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass || !screenshotCaptured) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=GLOBE_RESTORE_0_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (serverHandle) await stopDevServer(serverHandle);
  }
}

await main();

