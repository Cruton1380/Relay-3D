import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-13';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `pq5-dependency-graph-console-${DATE_TAG}.log`);
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

    const dagLogs = [];
    const indeterminateLogs = [];
    const pageErrors = [];
    page.on('console', (msg) => {
      const t = msg.text();
      if (t.includes('[F] dag')) dagLogs.push(t);
      if (t.includes('[F] indeterminate')) indeterminateLogs.push(t);
    });
    page.on('pageerror', (err) => pageErrors.push(String(err?.message || err)));

    await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayPQ4SetFormulaCell === 'function'
        && typeof window.relayBuildFormulaDag === 'function'
        && typeof window.relayGetCellFormulaState === 'function'
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

      // Acyclic: D1 -> C1 (edges > 0, cycles = 0)
      window.relayPQ4SetFormulaCell({ sheetId, cellRef: 'C1', formula: '=A1+B1' });
      window.relayPQ4SetFormulaCell({ sheetId, cellRef: 'D1', formula: '=C1+1' });
      await wait(200);
      const dagAcyclic = window.relayBuildFormulaDag(sheetId, { emitLog: true });

      // Cyclic: E1 <-> F1 (cycles > 0 and both INDETERMINATE)
      window.relayPQ4SetFormulaCell({ sheetId, cellRef: 'E1', formula: '=F1+1' });
      window.relayPQ4SetFormulaCell({ sheetId, cellRef: 'F1', formula: '=E1+1' });
      await wait(250);
      const dagCyclic = window.relayBuildFormulaDag(sheetId, { emitLog: true });
      const e1State = window.relayGetCellFormulaState(sheetId, 'E1');
      const f1State = window.relayGetCellFormulaState(sheetId, 'F1');

      return { ok: true, sheetId, dagAcyclic, dagCyclic, e1State, f1State };
    });

    const acyclicCycles = Number(result?.dagAcyclic?.cycleCount ?? -1);
    const acyclicEdges = Number(result?.dagAcyclic?.edges?.length ?? 0);
    const cyclicCycles = Number(result?.dagCyclic?.cycleCount ?? 0);
    const acyclicPass = acyclicCycles === 0 && acyclicEdges > 0;
    const cyclicPass = cyclicCycles > 0
      && result?.e1State?.formulaState === 'INDETERMINATE'
      && result?.f1State?.formulaState === 'INDETERMINATE';
    const sawDagLog = dagLogs.some((line) => /nodes=\d+\s+edges=\d+\s+cycles=\d+/.test(line));
    const sawIndeterminateLog = indeterminateLogs.some((line) => line.includes('cells=') && line.includes('reason=cycle'));
    const pass = !!result?.ok && acyclicPass && cyclicPass && sawDagLog && sawIndeterminateLog && pageErrors.length === 0;

    const dagEvidence = dagLogs.length ? dagLogs[dagLogs.length - 1] : '[F] dag nodes=0 edges=0 cycles=0';
    const indeterminateEvidence = indeterminateLogs.length ? indeterminateLogs[indeterminateLogs.length - 1] : '[F] indeterminate cells=none reason=cycle';
    log(dagEvidence);
    log(indeterminateEvidence);
    log(`[PQ5] dag acyclic=${acyclicPass ? 'PASS' : 'FAIL'} nodes=${Number(result?.dagAcyclic?.nodes?.length ?? 0)} edges=${acyclicEdges} cycles=${acyclicCycles}`);
    log(`[PQ5] dag cyclic=${cyclicPass ? 'PASS' : 'FAIL'} cycles=${cyclicCycles} e1=${result?.e1State?.formulaState || 'n/a'} f1=${result?.f1State?.formulaState || 'n/a'}`);
    log(`[PQ5] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=PQ5_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

await main();
