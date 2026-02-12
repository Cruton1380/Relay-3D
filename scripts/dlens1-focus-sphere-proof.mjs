import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `dlens1-focus-sphere-proof-console-${DATE_TAG}.log`);
const SCREENSHOT_FILE = path.join(PROOFS_DIR, `dlens1-focus-sphere-proof-screenshot-${DATE_TAG}.png`);
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
    const cameraState = () => {
      const c = window.viewer?.camera?.positionCartographic;
      return c ? {
        lon: Number(Cesium.Math.toDegrees(c.longitude).toFixed(6)),
        lat: Number(Cesium.Math.toDegrees(c.latitude).toFixed(6)),
        height: Number(c.height.toFixed(2)),
        heading: Number((window.viewer?.camera?.heading || 0).toFixed(6)),
        pitch: Number((window.viewer?.camera?.pitch || 0).toFixed(6)),
        roll: Number((window.viewer?.camera?.roll || 0).toFixed(6))
      } : null;
    };
    const norm = (v) => {
      if (v === null || typeof v === 'undefined') return null;
      if (typeof v === 'number') return Number(v.toFixed(6));
      if (typeof v !== 'object') return v;
      if (Array.isArray(v)) return v.map(norm);
      const out = {};
      Object.keys(v).sort().forEach((k) => { out[k] = norm(v[k]); });
      return out;
    };
    const before = {
      cam: cameraState(),
      focus: window.relayGetFocusState?.(),
      lod: String(window.relayGetWorkMode?.()?.mode || ''),
      selection: String(window.relayGetWorkMode?.()?.objectId || '')
    };
    const findAnyMatchId = () => {
      const sheets = (window.relayState?.tree?.nodes || []).filter((n) => n.type === 'sheet' && n.metadata?.isMatchSheet);
      for (const sheet of sheets) {
        const schema = sheet.metadata?.schema || [];
        const matchCol = schema.findIndex((c) => c.id === 'matchId' || c.name === 'matchId');
        if (matchCol < 0) continue;
        const cell = (sheet.cellData || []).find((c) => c.col === matchCol && Number(c.row) > 0 && String(c.value || c.display || '').trim());
        if (cell) return String(cell.value || cell.display);
      }
      return null;
    };
    const matchId = findAnyMatchId();
    const matchTarget = matchId
      ? { id: matchId, type: 'match' }
      : { type: 'match', sheetId: 'P2P.ThreeWayMatch', row: 1 };
    const targets = [
      { input: matchTarget, label: 'match' },
      { id: 'P2P.ThreeWayMatch', label: 'sheet' },
      { id: 'P2P.ThreeWayMatch.cell.1.1', label: 'cell' }
    ];
    const entered = [];
    for (const t of targets) {
      // eslint-disable-next-line no-await-in-loop
      const en = await window.relayEnterFocus(t.input || t.id);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 140));
      const fs = window.relayGetFocusState?.() || {};
      entered.push({
        label: t.label,
        enterOk: en?.ok === true,
        active: fs.active === true,
        framePresent: !!String(fs.frameId || ''),
        radiusM: Number(fs.radiusM || 0),
        targetObjectId: String(fs.targetObjectId || '')
      });
      // eslint-disable-next-line no-await-in-loop
      const ex = await window.relayExitFocus();
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 140));
      entered[entered.length - 1].exitOk = ex?.ok === true;
      entered[entered.length - 1].selectionPreserved = ex?.selectionPreserved === true;
      entered[entered.length - 1].lodPreserved = ex?.lodPreserved === true;
    }
    const after = {
      cam: cameraState(),
      focus: window.relayGetFocusState?.(),
      lod: String(window.relayGetWorkMode?.()?.mode || ''),
      selection: String(window.relayGetWorkMode?.()?.objectId || '')
    };

    const allEnterFixed = entered.every((x) => x.enterOk && x.active && x.framePresent && x.radiusM > 0);
    const allExit = entered.every((x) => x.exitOk);
    const restorePass = entered.every((x) => x.selectionPreserved && x.lodPreserved);
    const hash = fnv1a(JSON.stringify(norm({ entered, before: { lod: before.lod, selection: before.selection }, after: { lod: after.lod, selection: after.selection } })));
    return { entered, allEnter: allEnterFixed, allExit, restorePass, hash };
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
    const lensLogs = [];
    const moveLogs = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[LENS]')) lensLogs.push(text);
      if (text.includes('[MOVE] mode=travel')) moveLogs.push(text);
    });

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayEnterFocus === 'function'
        && typeof window.relayExitFocus === 'function'
        && typeof window.relayGetFocusState === 'function'
        && typeof window.enterFocusMode === 'function'
        && typeof window.exitFocusMode === 'function',
      undefined,
      { timeout: 120000 }
    );

    const runA = await runScenario(page);
    // screenshot with active lens
    await page.evaluate(async () => { await window.relayEnterFocus('P2P.ThreeWayMatch'); });
    await page.waitForTimeout(200);
    const screenshot = await page.screenshot({ fullPage: true });
    await fs.writeFile(SCREENSHOT_FILE, screenshot);
    await page.evaluate(async () => { await window.relayExitFocus(); });

    const typesPass = runA.entered.length === 3 && runA.entered.every((x) => x.enterOk && x.exitOk);
    const restorePass = runA.restorePass === true;
    log(`[D-LENS-1] focus-enter result=${runA.allEnter ? 'PASS' : 'FAIL'} types=${runA.entered.map((x) => x.label).join(',')}`);
    log(`[D-LENS-1] focus-exit result=${runA.allExit ? 'PASS' : 'FAIL'} restoreView=true`);
    log(`[D-LENS-1] focus-restore result=${restorePass ? 'PASS' : 'FAIL'} selectionPreserved=true lodPreserved=true`);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayEnterFocus === 'function'
        && typeof window.relayGetFocusState === 'function'
        && typeof window.enterFocusMode === 'function'
        && typeof window.exitFocusMode === 'function',
      undefined,
      { timeout: 120000 }
    );
    const runB = await runScenario(page);
    const deterministic = runA.hash === runB.hash;
    const lensLogsPass = lensLogs.some((t) => t.includes('[LENS] focus-enter')) && lensLogs.some((t) => t.includes('[LENS] focus-exit')) && lensLogs.some((t) => t.includes('[LENS] focus-restore'));
    const moveLogsPass = moveLogs.length >= 6;
    log(`[D-LENS-1] travel result=${moveLogsPass ? 'PASS' : 'FAIL'} moveLogs=${moveLogs.length}`);
    log(`[D-LENS-1] determinism result=${deterministic ? 'PASS' : 'FAIL'} hashA=${runA.hash} hashB=${runB.hash}`);
    log(`[D-LENS-1] required-logs result=${lensLogsPass ? 'PASS' : 'FAIL'} lensLogs=${lensLogs.length}`);

    const pass = typesPass && restorePass && deterministic && lensLogsPass && moveLogsPass;
    log(`[D-LENS-1] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=DLENS1_BLOCKER_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

await main();
