import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-13';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `cam0-filament-ride-proof-console-${DATE_TAG}.log`);
const WORLD_URL = 'http://localhost:3000/relay-cesium-world.html?profile=world';

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

async function runNodeScript(scriptPath, timeoutMs = 300000) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...process.env }
    });
    let output = '';
    child.stdout.on('data', (d) => { output += String(d); });
    child.stderr.on('data', (d) => { output += String(d); });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ ok: false, output: `${output}\nTIMEOUT` });
    }, timeoutMs);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, output, code });
    });
  });
}

async function runRideScenario(page) {
  return page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const cubes = Array.isArray(window.filamentRenderer?.timeboxCubes) ? window.filamentRenderer.timeboxCubes : [];
    const firstCell = cubes[0]?.cellId || null;
    if (!firstCell) return { ok: false, reason: 'NO_TIMEBOX_CUBES' };
    const enter = await window.relayEnterFilamentRide(firstCell);
    await wait(120);
    const s1 = window.relayGetFilamentRideState?.();
    const next1 = await window.relayFilamentRideNext();
    await wait(120);
    const next2 = await window.relayFilamentRideNext();
    await wait(120);
    let clampNext = null;
    const maxHops = Math.max(4, Number(s1?.path?.length || 0) + 2);
    for (let i = 0; i < maxHops; i++) {
      // eslint-disable-next-line no-await-in-loop
      clampNext = await window.relayFilamentRideNext();
    }
    await wait(100);
    const afterClamp = window.relayGetFilamentRideState?.();
    const prev1 = await window.relayFilamentRidePrev();
    await wait(100);
    let clampPrev = null;
    for (let i = 0; i < maxHops; i++) {
      // eslint-disable-next-line no-await-in-loop
      clampPrev = await window.relayFilamentRidePrev();
    }
    const beforeExit = window.relayGetFilamentRideState?.();
    const exit = await window.relayExitFilamentRide();
    await wait(100);
    const final = window.relayGetFilamentRideState?.();
    return {
      ok: true,
      cellId: firstCell,
      enter,
      s1,
      next1,
      next2,
      clampNext,
      afterClamp,
      prev1,
      clampPrev,
      beforeExit,
      exit,
      final
    };
  });
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let devServer = null;
  let browser = null;
  try {
    devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], WORLD_URL);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const moveLogs = [];
    const pageErrors = [];
    page.on('console', (msg) => {
      const t = msg.text();
      if (t.includes('[MOVE] mode=filamentRide') || t.includes('[MOVE] ride-step') || t.includes('[MOVE] ride-exit')) {
        moveLogs.push(t);
      }
    });
    page.on('pageerror', (err) => pageErrors.push(String(err?.message || err)));

    await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'world'
        && typeof window.relayEnterFilamentRide === 'function'
        && Array.isArray(window.filamentRenderer?.timeboxCubes)
        && window.filamentRenderer.timeboxCubes.length > 0,
      undefined,
      { timeout: 120000 }
    );

    const a = await runRideScenario(page);
    const b = await runRideScenario(page);
    const enterPass = a.ok === true && a.enter?.ok === true;
    const snappedPass = a.next1?.ok === true && a.next2?.ok === true
      && Number(a.afterClamp?.currentIndex || 0) <= Number((a.afterClamp?.path?.length || 1) - 1)
      && Number(a.clampPrev?.currentIndex || 0) >= 0;
    const restorePass = a.exit?.ok === true && a.exit?.selectionPreserved === true && a.exit?.lodPreserved === true;
    const trapPass = a.clampNext?.ok === true && a.clampPrev?.ok === true && a.final?.active === false;
    const detPass = String(a.s1?.determinismHash || '') !== ''
      && String(a.s1?.determinismHash || '') === String(b.s1?.determinismHash || '');
    const reqLogsPass = moveLogs.some((x) => x.includes('[MOVE] mode=filamentRide'))
      && moveLogs.some((x) => x.includes('[MOVE] ride-step'))
      && moveLogs.some((x) => x.includes('[MOVE] ride-exit restoreView=true'));
    const crashFree = pageErrors.length === 0;

    log(`[CAM0.4.2] ride-enter result=${enterPass ? 'PASS' : 'FAIL'}`);
    log(`[CAM0.4.2] snapped-movement result=${snappedPass ? 'PASS' : 'FAIL'}`);
    log(`[CAM0.4.2] restore result=${restorePass ? 'PASS' : 'FAIL'}`);
    log(`[CAM0.4.2] trap-check result=${trapPass ? 'PASS' : 'FAIL'}`);
    log(`[CAM0.4.2] determinism result=${detPass ? 'PASS' : 'FAIL'} hashA=${a.s1?.determinismHash || 'none'} hashB=${b.s1?.determinismHash || 'none'}`);
    log(`[CAM0.4.2] required-logs result=${reqLogsPass ? 'PASS' : 'FAIL'} logs=${moveLogs.length}`);

    const preGate = enterPass && snappedPass && restorePass && trapPass && detPass && reqLogsPass && crashFree;
    if (!preGate) {
      log('[CAM0.4.2] gate-summary result=FAIL');
      await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
      process.exitCode = 2;
      return;
    }

    const osv = await runNodeScript('scripts/osv1-full-system-proof.mjs');
    const osvPass = osv.ok && osv.output.includes('[OSV1] gate-summary result=PASS');
    if (!osvPass) {
      log('[REFUSAL] reason=CAM0.4.2_REGRESSION_osv');
    }
    const headless = await runNodeScript('scripts/headless-tier1-parity.mjs');
    const headlessPass = headless.ok && headless.output.includes('[HEADLESS] golden-compare facts=MATCH matches=MATCH summaries=MATCH kpis=MATCH packets=MATCH ledger=MATCH');
    if (!headlessPass) {
      log('[REFUSAL] reason=CAM0.4.2_REGRESSION_headless');
    }
    const gate = preGate && osvPass && headlessPass;
    log(`[CAM0.4.2] gate-summary result=${gate ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!gate) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=CAM0.4.2_BLOCKER_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

await main();
