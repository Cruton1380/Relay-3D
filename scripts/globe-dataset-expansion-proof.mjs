import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-13';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `globe-dataset-expansion-console-${DATE_TAG}.log`);
const WORLD_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=world';
const PROOF_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=proof';

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

    const worldPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const worldLogs = [];
    worldPage.on('console', (msg) => worldLogs.push(msg.text()));
    await worldPage.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await worldPage.waitForFunction(
      () => typeof window.relayLoadWorldDataset === 'function' && typeof window.relayGetWorldDatasetMeta === 'function',
      undefined,
      { timeout: 120000 }
    );
    const world = await worldPage.evaluate(async () => {
      const out = await window.relayLoadWorldDataset();
      const meta = window.relayGetWorldDatasetMeta();
      return { out, meta };
    });
    const worldPass = world?.out?.ok === true && Number(world?.out?.anchors || 0) >= 4;
    const metaPass = Number(world?.meta?.anchors?.length || 0) >= 4;
    const logPass = worldLogs.some((x) => x.includes('[GLOBE] datasetLoad anchors='));
    log(`[GLOBE-3A] dataset result=${worldPass ? 'PASS' : 'FAIL'} anchors=${Number(world?.out?.anchors || 0)}`);
    log(`[GLOBE-3A] meta result=${metaPass ? 'PASS' : 'FAIL'} anchors=${Number(world?.meta?.anchors?.length || 0)}`);
    log(`[GLOBE-3A] log result=${logPass ? 'PASS' : 'FAIL'}`);

    const proofPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await proofPage.goto(PROOF_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await proofPage.waitForFunction(
      () => typeof window.relayLoadWorldDataset === 'function',
      undefined,
      { timeout: 120000 }
    );
    const proof = await proofPage.evaluate(async () => window.relayLoadWorldDataset());
    const isolationPass = proof?.reason === 'PROFILE_LOCKED_PROOF';
    log(`[GLOBE-3A] proof-isolation result=${isolationPass ? 'PASS' : 'FAIL'} reason=${proof?.reason || 'none'}`);

    const gate = worldPass && metaPass && logPass && isolationPass;
    log(`[GLOBE-3A] gate-summary result=${gate ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!gate) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=GLOBE_DATASET_EXPANSION_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

await main();
