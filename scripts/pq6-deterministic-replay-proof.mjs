import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-13';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `pq6-deterministic-replay-console-${DATE_TAG}.log`);
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

    const replayLogs = [];
    const pageErrors = [];
    page.on('console', (msg) => {
      const t = msg.text();
      if (t.includes('[R] replayHash=')) replayLogs.push(t);
    });
    page.on('pageerror', (err) => pageErrors.push(String(err?.message || err)));

    await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relaySetCellValueDeterministic === 'function'
        && typeof window.relayReplaySheetFromCommits === 'function'
        && typeof window.relayGetSheetCommitLog === 'function'
        && Array.isArray(window.relayState?.tree?.nodes),
      undefined,
      { timeout: 120000 }
    );

    const result = await page.evaluate(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const sheetNodes = (window.relayState?.tree?.nodes || []).filter((n) => n?.type === 'sheet');
      const preferred = ['sheet.packaging', 'P2P.POLines', 'P2P.InvoiceLines'];
      const sheetId = preferred.find((id) => sheetNodes.some((s) => s.id === id))
        || (sheetNodes[0] ? sheetNodes[0].id : null);
      if (!sheetId) return { ok: false, reason: 'NO_SHEET' };

      // Deterministic edit sequence.
      window.relaySetCellValueDeterministic({ sheetId, cellRef: 'A1', input: '11' });
      window.relaySetCellValueDeterministic({ sheetId, cellRef: 'B1', input: '7' });
      window.relaySetCellValueDeterministic({ sheetId, cellRef: 'C1', input: '=A1+B1' });
      window.relaySetCellValueDeterministic({ sheetId, cellRef: 'D1', input: 'temp' });
      window.relaySetCellValueDeterministic({ sheetId, cellRef: 'D1', input: '' }); // CELL_CLEAR
      await wait(250);

      const replay = window.relayReplaySheetFromCommits(sheetId, { emitLog: true });
      const commitLog = window.relayGetSheetCommitLog(sheetId);
      return { ok: true, sheetId, replay, commitCount: commitLog.length };
    });

    const matchesLive = !!result?.replay?.matchesLive;
    const replayHash = result?.replay?.replayHash || 'n/a';
    const sawReplayLog = replayLogs.some((line) => /replayHash=/.test(line) && /matchesLive=true/.test(line));
    const pass = !!result?.ok && matchesLive && sawReplayLog && pageErrors.length === 0;

    log(`[R] replayHash=${replayHash} matchesLive=${matchesLive ? 'true' : 'false'}`);
    if (!matchesLive) {
      log(`[PQ6] replayHashLive=${result?.replay?.liveHash || 'n/a'}`);
      const replayState = result?.replay?.replayState || {};
      const liveState = result?.replay?.liveState || {};
      const allKeys = [...new Set([...Object.keys(replayState), ...Object.keys(liveState)])].sort();
      for (const key of allKeys) {
        const r = JSON.stringify(replayState[key] ?? null);
        const l = JSON.stringify(liveState[key] ?? null);
        if (r !== l) {
          log(`[PQ6] diff cell=${key} replay=${r} live=${l}`);
        }
      }
    }
    log(`[PQ6] replay result=${pass ? 'PASS' : 'FAIL'} sheet=${result?.sheetId || 'n/a'} commits=${Number(result?.commitCount || 0)}`);
    log(`[PQ6] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=PQ6_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

await main();
