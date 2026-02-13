import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-13';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `pq4-formula-ref-extraction-console-${DATE_TAG}.log`);
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

    const refsLogs = [];
    const pageErrors = [];
    page.on('console', (msg) => {
      const t = msg.text();
      if (t.includes('[F] refsExtracted')) refsLogs.push(t);
    });
    page.on('pageerror', (err) => pageErrors.push(String(err?.message || err)));

    await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayPQ4SetFormulaCell === 'function'
        && typeof window.relayGetLatestFormulaRefsForCell === 'function'
        && Array.isArray(window.relayState?.tree?.nodes),
      undefined,
      { timeout: 120000 }
    );

    const result = await page.evaluate(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const sheetNodes = (window.relayState?.tree?.nodes || []).filter((n) => n?.type === 'sheet');
      const preferred = ['sheet.packaging', 'P2P.POLines', 'P2P.InvoiceLines'];
      const selected = preferred.find((id) => sheetNodes.some((s) => s.id === id))
        || (sheetNodes[0] ? sheetNodes[0].id : null);
      if (!selected) return { ok: false, reason: 'NO_SHEET' };
      const cellRef = 'C1';
      const formula = '=A1+B1';
      const commitResult = window.relayPQ4SetFormulaCell({ sheetId: selected, cellRef, formula });
      await wait(250);
      const latest = window.relayGetLatestFormulaRefsForCell(selected, cellRef);
      return {
        ok: !!commitResult?.ok,
        sheetId: selected,
        cellRef,
        formula,
        latest
      };
    });

    const refsMeta = result?.latest?.refsMeta || {};
    const refs = Number(refsMeta.refCount || 0);
    const ranges = Number(refsMeta.rangeCount || 0);
    const sawLog = refsLogs.some((line) => line.includes('cell=') && line.includes('refs=') && line.includes('ranges='));
    const pass = !!result?.ok && refs >= 2 && ranges >= 0 && sawLog && pageErrors.length === 0;

    log(`[PQ4] refsExtracted result=${pass ? 'PASS' : 'FAIL'} sheet=${result?.sheetId || 'n/a'} cell=${result?.cellRef || 'n/a'} refs=${refs} ranges=${ranges}`);
    log(`[PQ4] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=PQ4_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

await main();
