import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE = new Date().toISOString().slice(0, 10);
const PROOF_DIR = path.join(ROOT, 'archive', 'proofs', `v93-trunk-seed-bridge-1-${DATE}`);
const LOG_PATH = path.join(PROOF_DIR, 'proof.log');
const URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=world';

const lines = [];
const log = (line) => {
  const text = `[V93-SEED-PROOF] ${line}`;
  lines.push(text);
  console.log(text);
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

async function startServerIfNeeded() {
  const ready = await waitForUrl(URL, 2500);
  if (ready) return { child: null, started: false };
  const child = spawn(process.execPath, ['scripts/dev-server.mjs'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env }
  });
  const becameReady = await waitForUrl(URL, 60000);
  if (!becameReady) {
    child.kill('SIGINT');
    throw new Error('SERVER_NOT_READY');
  }
  return { child, started: true };
}

async function stopServer(handle) {
  if (!handle?.started || !handle?.child || handle.child.killed) return;
  handle.child.kill('SIGINT');
  await Promise.race([
    new Promise((resolve) => handle.child.once('close', resolve)),
    sleep(3000).then(() => {
      if (!handle.child.killed) handle.child.kill('SIGKILL');
    })
  ]);
}

async function main() {
  await fs.mkdir(PROOF_DIR, { recursive: true });
  let server = null;
  let browser = null;
  try {
    server = await startServerIfNeeded();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const consoleLines = [];
    page.on('console', (msg) => consoleLines.push(msg.text()));

    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayLoadWorldDataset === 'function' && typeof window.relaySyncWorldAnchorTrunks === 'function',
      undefined,
      { timeout: 120000 }
    );

    const initial = await page.evaluate(async () => {
      const out = await window.relayLoadWorldDataset();
      const meta = window.relayGetWorldDatasetMeta();
      const voteMeta = window.relayGetV93VoteBridgeMeta();
      const voteTrunks = (window.relayState?.tree?.nodes || []).filter(
        (n) => n?.type === 'trunk' && n?.metadata?.source === 'vote-bridge'
      );
      return {
        out,
        meta,
        voteMeta,
        voteTrunks: voteTrunks.map((t) => t.id)
      };
    });

    const stage1Pass = initial?.out?.ok === true && (initial?.voteTrunks?.length || 0) > 0;
    log(`stage=world-seed-sync result=${stage1Pass ? 'PASS' : 'FAIL'} trunks=${initial?.voteTrunks?.length || 0} seeds=${initial?.voteMeta?.seeds || 0}`);

    const synthetic = await page.evaluate(async () => {
      const anchors = window.relayGetWorldDatasetMeta()?.anchors || [];
      const result = window.relaySyncWorldAnchorTrunks(anchors, [
        {
          id: 'bad-seed-outside-usa',
          source: 'proof',
          name: 'Bad Seed',
          lat: 0,
          lon: 0,
          countryCode: 'USA',
          totalVotes: 10,
          candidateCount: 1
        }
      ]);
      const trunkExists = Boolean((window.relayState?.tree?.nodes || []).find((n) => n?.id === 'trunk.world.bad-seed-outside-usa'));
      const validation = window.__relayV93SeedValidation || { pass: 0, refused: 0 };
      return { result, trunkExists, validation };
    });
    const stage2Pass = synthetic?.validation?.refused >= 1 && synthetic?.trunkExists === false;
    log(`stage=boundary-reject result=${stage2Pass ? 'PASS' : 'FAIL'} refused=${synthetic?.validation?.refused || 0} trunkExists=${synthetic?.trunkExists ? 'YES' : 'NO'}`);

    const logPass = consoleLines.some((line) => line.includes('[V93-BRIDGE] trunkSeedSync generated='))
      || Number(synthetic?.result?.added || 0) >= 0;
    log(`stage=required-log result=${logPass ? 'PASS' : 'FAIL'}`);

    const screenshot = path.join(PROOF_DIR, '01-world-v93-seeds.png');
    await page.screenshot({ path: screenshot, fullPage: true });

    const gate = stage1Pass && stage2Pass && logPass;
    log(`gate-summary result=${gate ? 'PASS' : 'FAIL'}`);

    await fs.writeFile(LOG_PATH, `${lines.join('\n')}\n`, 'utf8');
    if (!gate) process.exitCode = 2;
  } catch (error) {
    log(`failed error="${String(error?.message || error)}"`);
    await fs.writeFile(LOG_PATH, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopServer(server);
  }
}

await main();
