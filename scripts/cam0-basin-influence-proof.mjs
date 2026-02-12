import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `cam0-basin-influence-proof-console-${DATE_TAG}.log`);
const APP_URL = 'http://localhost:3000/relay-cesium-world.html';

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
  return child;
}

async function stopDevServer(child) {
  if (!child || child.killed) return;
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
    const fnv1a = (text) => {
      let hash = 0x811c9dc5;
      const src = String(text || '');
      for (let i = 0; i < src.length; i += 1) {
        hash ^= src.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
      }
      return `0x${(hash >>> 0).toString(16).padStart(8, '0')}`;
    };
    const snap = () => window.relayGetBasinState?.() || {};

    // Ensure inside basin via COMPANY preset.
    await window.relayApplyCameraPreset('cam.company.sideProfile');
    await new Promise((r) => setTimeout(r, 300));
    const inside = snap();

    const softOn = window.relaySetBasinSoftLock(true, inside.targetId || null);
    await new Promise((r) => setTimeout(r, 150));
    const softOnState = snap();

    // Move far away to deactivate basin.
    await window.relayCameraTravelTo({
      lon: -80,
      lat: 20,
      height: 12000000,
      heading: 0,
      pitch: -0.61,
      roll: 0,
      durationMs: 800,
      reason: 'BASIN_PROOF_OUTSIDE'
    });
    await new Promise((r) => setTimeout(r, 300));
    const outside = snap();

    const softOff = window.relaySetBasinSoftLock(false);
    await new Promise((r) => setTimeout(r, 100));
    const softOffState = snap();

    // Ensure travel presets still function after basin interactions.
    const presetRoundtrip = await window.relayApplyCameraPreset('cam.company.faceOn');
    await new Promise((r) => setTimeout(r, 120));
    const presetRoundtrip2 = await window.relayApplyCameraPreset('cam.sheet.topDown');

    const stateSignature = {
      insideActive: inside.active === true,
      insideTarget: inside.targetId || null,
      softOn: softOnState.softLockEnabled === true,
      outsideActive: outside.active === true,
      softOff: softOffState.softLockEnabled === true,
      presetOk: presetRoundtrip?.ok === true && presetRoundtrip2?.ok === true
    };
    return {
      inside,
      outside,
      softOn,
      softOff,
      presetRoundtrip,
      presetRoundtrip2,
      stateHash: fnv1a(JSON.stringify(stateSignature)),
      stateSignature
    };
  });
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let server = null;
  let browser = null;
  try {
    server = await startDevServer();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const camLogs = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[CAM] basin-enter') || text.includes('[CAM] basin-exit') || text.includes('[CAM] basin-softlock') || text.includes('[MOVE] mode=basin')) {
        camLogs.push(text);
      }
    });

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayGetBasinState === 'function'
        && typeof window.relaySetBasinSoftLock === 'function'
        && typeof window.relayApplyCameraPreset === 'function'
        && typeof window.relayCameraTravelTo === 'function'
        && !!(window.relayState?.tree?.nodes || []).find(n => n.id === 'trunk.avgol'),
      undefined,
      { timeout: 120000 }
    );

    const runA = await runScenario(page);
    const enterPass = runA.inside?.active === true;
    const exitPass = runA.outside?.active === false;
    const softLockPass = runA.softOn?.softLockEnabled === true && runA.softOff?.softLockEnabled === false;
    const presetPass = runA.presetRoundtrip?.ok === true && runA.presetRoundtrip2?.ok === true;
    log(`[CAM0.2] basin-enter result=${enterPass ? 'PASS' : 'FAIL'} target=${runA.inside?.targetId || 'none'}`);
    log(`[CAM0.2] basin-exit result=${exitPass ? 'PASS' : 'FAIL'} target=${runA.outside?.targetId || 'none'}`);
    log(`[CAM0.2] softlock-toggle result=${softLockPass ? 'PASS' : 'FAIL'}`);
    log(`[CAM0.2] travel-not-trapped result=${presetPass ? 'PASS' : 'FAIL'}`);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayGetBasinState === 'function' && typeof window.relaySetBasinSoftLock === 'function',
      undefined,
      { timeout: 120000 }
    );
    const runB = await runScenario(page);
    const deterministic = runA.stateHash === runB.stateHash;
    const logsPass = camLogs.some((t) => t.includes('[CAM] basin-enter'))
      && camLogs.some((t) => t.includes('[CAM] basin-exit'))
      && camLogs.some((t) => t.includes('[CAM] basin-softlock'));
    log(`[CAM0.2] determinism result=${deterministic ? 'PASS' : 'FAIL'} hashA=${runA.stateHash} hashB=${runB.stateHash}`);
    log(`[CAM0.2] required-logs result=${logsPass ? 'PASS' : 'FAIL'} count=${camLogs.length}`);

    const pass = enterPass && exitPass && softLockPass && presetPass && deterministic && logsPass;
    log(`[CAM0.2] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=CAM0_2_BLOCKER_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

await main();
