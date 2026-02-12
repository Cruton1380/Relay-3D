import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `cam0-travel-presets-proof-console-${DATE_TAG}.log`);
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
    const presets = {
      company: window.relayListCameraPresets('COMPANY'),
      sheet: window.relayListCameraPresets('SHEET'),
      cell: window.relayListCameraPresets('CELL')
    };
    const firstCompany = presets.company?.[0]?.presetId;
    const firstSheet = presets.sheet?.[0]?.presetId;
    const firstCell = presets.cell?.[0]?.presetId;
    if (!firstCompany || !firstSheet || !firstCell) {
      return { ok: false, reason: 'CAM_PRESET_REGISTRY_INCOMPLETE', presets };
    }

    const applied = [];
    for (const presetId of [firstCompany, firstSheet, firstCell]) {
      // eslint-disable-next-line no-await-in-loop
      const out = await window.relayApplyCameraPreset(presetId);
      applied.push(out);
    }

    const travelOnly = applied.every((a) => a?.ok === true && a.mode === 'travel' && Number(a.durationMs || 0) >= 200);
    const contextPreserved = applied.every((a) => a?.contextPreserved === true);
    const registryHash = fnv1a(JSON.stringify({
      company: presets.company.map((p) => p.presetId),
      sheet: presets.sheet.map((p) => p.presetId),
      cell: presets.cell.map((p) => p.presetId)
    }));
    return {
      ok: travelOnly && contextPreserved,
      presets,
      applied,
      travelOnly,
      contextPreserved,
      registryHash
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
    const moveLogs = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[MOVE] mode=travel')) moveLogs.push(text);
    });

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayListCameraPresets === 'function' && typeof window.relayApplyCameraPreset === 'function',
      undefined,
      { timeout: 120000 }
    );

    const runA = await runScenario(page);
    if (!runA.ok) throw new Error(runA.reason || 'CAM0_SCENARIO_A_FAIL');
    log(`[CAM0] animated-travel result=${runA.travelOnly ? 'PASS' : 'FAIL'} presets=3`);
    log(`[CAM0] continuity result=${runA.contextPreserved ? 'PASS' : 'FAIL'}`);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayListCameraPresets === 'function' && typeof window.relayApplyCameraPreset === 'function',
      undefined,
      { timeout: 120000 }
    );
    const runB = await runScenario(page);
    if (!runB.ok) throw new Error(runB.reason || 'CAM0_SCENARIO_B_FAIL');
    const deterministic = runA.registryHash === runB.registryHash;
    const moveLogsPass = moveLogs.length >= 3;
    log(`[CAM0] presets-registry result=${deterministic ? 'PASS' : 'FAIL'} hashA=${runA.registryHash} hashB=${runB.registryHash}`);
    log(`[CAM0] move-logs result=${moveLogsPass ? 'PASS' : 'FAIL'} count=${moveLogs.length}`);
    const pass = runA.travelOnly && runA.contextPreserved && deterministic && moveLogsPass;
    log(`[CAM0] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);

    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=CAM0_BLOCKER_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

await main();
