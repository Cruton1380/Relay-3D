import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-13';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `pq3-timebox-band-align-console-${DATE_TAG}.log`);
const WORLD_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=world';

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
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
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const bandLogs = [];
    const pageErrors = [];
    page.on('console', (msg) => {
      const t = msg.text();
      if (t.includes('[T] bandAlign')) {
        bandLogs.push(t);
      }
    });
    page.on('pageerror', (err) => pageErrors.push(String(err?.message || err)));

    await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'world'
        && typeof window.filamentRenderer?.renderTree === 'function'
        && Array.isArray(window.filamentRenderer?.timeboxCubes)
        && window.filamentRenderer.timeboxCubes.length > 0,
      undefined,
      { timeout: 120000 }
    );

    await page.evaluate(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      window.RELAY_LOCK_LOD = 'SHEET';
      if (window.filamentRenderer?.setLOD) {
        window.filamentRenderer.setLOD('SHEET');
      }
      window.filamentRenderer?.renderTree?.('pq3-proof-a');
      await wait(300);
      window.filamentRenderer?.renderTree?.('pq3-proof-b');
      await wait(300);
    });
    await sleep(600);

    const latest = bandLogs.length ? bandLogs[bandLogs.length - 1] : '';
    const okMatch = latest.match(/ok=([0-9]+)/);
    const deltaMatch = latest.match(/maxDeltaM=([0-9.]+)/);
    const ok = Number(okMatch?.[1] || 0);
    const maxDeltaM = Number(deltaMatch?.[1] || Number.NaN);
    const pass = ok > 0 && Number.isFinite(maxDeltaM) && maxDeltaM <= 0.01 && pageErrors.length === 0;

    log(`[PQ3] bandAlign result=${pass ? 'PASS' : 'FAIL'} ok=${ok} maxDeltaM=${Number.isFinite(maxDeltaM) ? maxDeltaM.toFixed(3) : 'NaN'}`);
    log(`[PQ3] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=PQ3_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

await main();
