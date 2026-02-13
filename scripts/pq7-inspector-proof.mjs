import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-13';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `pq7-inspector-console-${DATE_TAG}.log`);
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

    const inspectCellLogs = [];
    const inspectTimeboxLogs = [];
    const pageErrors = [];
    page.on('console', (msg) => {
      const t = msg.text();
      if (t.includes('[I] inspect cell=')) inspectCellLogs.push(t);
      if (t.includes('[I] inspect timebox=')) inspectTimeboxLogs.push(t);
    });
    page.on('pageerror', (err) => pageErrors.push(String(err?.message || err)));

    await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relaySetCellValueDeterministic === 'function'
        && typeof window.relayBuildFormulaDag === 'function'
        && typeof window.relayInspectCellProvenance === 'function'
        && typeof window.relayInspectTimeboxProvenance === 'function'
        && typeof window.relayReplaySheetFromCommits === 'function'
        && Array.isArray(window.filamentRenderer?.timeboxCubes)
        && window.filamentRenderer.timeboxCubes.length > 0,
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

      window.relaySetCellValueDeterministic({ sheetId, cellRef: 'A1', input: '9' });
      window.relaySetCellValueDeterministic({ sheetId, cellRef: 'B1', input: '4' });
      window.relaySetCellValueDeterministic({ sheetId, cellRef: 'C1', input: '=A1+B1' });
      window.relaySetCellValueDeterministic({ sheetId, cellRef: 'E1', input: '=F1+1' });
      window.relaySetCellValueDeterministic({ sheetId, cellRef: 'F1', input: '=E1+1' });
      await wait(250);
      window.relayBuildFormulaDag(sheetId, { emitLog: false });

      const commitCountBeforeInspect = window.relayGetSheetCommitLog(sheetId).length;
      const replayBefore = window.relayReplaySheetFromCommits(sheetId, { emitLog: false });

      const cellInspectA = window.relayInspectCellProvenance(sheetId, 'C1', { emitLog: true, showPanel: false, latestN: 5 });
      const cellInspectB = window.relayInspectCellProvenance(sheetId, 'C1', { emitLog: false, showPanel: false, latestN: 5 });
      const cycleInspect = window.relayInspectCellProvenance(sheetId, 'E1', { emitLog: true, showPanel: false, latestN: 5 });

      const timeboxId = window.filamentRenderer?.timeboxCubes?.[0]?.instanceId || null;
      const timeboxInspect = timeboxId
        ? window.relayInspectTimeboxProvenance(timeboxId, { emitLog: true, showPanel: false })
        : { ok: false, reason: 'NO_TIMEBOX' };

      const replayAfter = window.relayReplaySheetFromCommits(sheetId, { emitLog: false });
      const commitCountAfterInspect = window.relayGetSheetCommitLog(sheetId).length;

      const history = window.relayGetSheetCommitLog(sheetId).filter((c) => String(c.cellRef || '').toUpperCase() === 'C1');
      const expectedLastSeq = history.length ? Number(history[history.length - 1].seq) : null;

      return {
        ok: true,
        sheetId,
        cellInspectA,
        cellInspectB,
        cycleInspect,
        timeboxInspect,
        deterministicEqual: JSON.stringify(cellInspectA) === JSON.stringify(cellInspectB),
        expectedLastSeq,
        commitCountBeforeInspect,
        commitCountAfterInspect,
        replayBeforeHash: replayBefore?.replayHash || null,
        replayAfterHash: replayAfter?.replayHash || null
      };
    });

    const deterministicPass = !!result?.deterministicEqual;
    const lastSeqPass = Number(result?.cellInspectA?.lastSeq) === Number(result?.expectedLastSeq);
    const cyclePass = result?.cycleInspect?.formulaState === 'INDETERMINATE'
      && String(result?.cycleInspect?.formulaStateReason || '').toUpperCase() === 'CYCLE';
    const nonMutatingPass = Number(result?.commitCountBeforeInspect) === Number(result?.commitCountAfterInspect)
      && String(result?.replayBeforeHash || '') === String(result?.replayAfterHash || '');
    const timeboxPass = !!result?.timeboxInspect?.ok && /^[0-9]+-[0-9]+$/.test(String(result?.timeboxInspect?.range || ''));
    const sawCellLog = inspectCellLogs.some((line) => /\[I\] inspect cell=.* commits=\d+ lastSeq=\d+/.test(line));
    const sawTimeboxLog = inspectTimeboxLogs.some((line) => /\[I\] inspect timebox=.* commits=\d+ range=\d+-\d+/.test(line));

    const pass = !!result?.ok
      && deterministicPass
      && lastSeqPass
      && cyclePass
      && nonMutatingPass
      && timeboxPass
      && sawCellLog
      && sawTimeboxLog
      && pageErrors.length === 0;

    if (inspectCellLogs.length) log(inspectCellLogs[inspectCellLogs.length - 1]);
    if (inspectTimeboxLogs.length) log(inspectTimeboxLogs[inspectTimeboxLogs.length - 1]);
    log(`[PQ7] inspector deterministic=${deterministicPass ? 'PASS' : 'FAIL'} lastSeq=${lastSeqPass ? 'PASS' : 'FAIL'} cycle=${cyclePass ? 'PASS' : 'FAIL'} nonMutating=${nonMutatingPass ? 'PASS' : 'FAIL'}`);
    log(`[PQ7] inspector timebox=${timeboxPass ? 'PASS' : 'FAIL'} cellLog=${sawCellLog ? 'PASS' : 'FAIL'} timeboxLog=${sawTimeboxLog ? 'PASS' : 'FAIL'}`);
    log(`[PQ7] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=PQ7_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

await main();
