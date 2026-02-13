import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `vis1-scale-entry-console-${DATE_TAG}.log`);
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

async function runNodeScript(scriptPath, timeoutMs = 600000) {
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

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let devServer = null;
  let browser = null;
  try {
    devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], WORLD_URL);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));
    await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'world'
        && !!window.filamentRenderer
        && !!window.relayEnterSheet
        && !!window.relayGetEntryState
        && !!window.relayExitSheet,
      undefined,
      { timeout: 120000 }
    );
    await page.waitForTimeout(1200);

    const enterDefault = await page.evaluate(async () => {
      const before = window.relayGetEntryState();
      const enter = window.relayEnterSheet();
      await new Promise((resolve) => setTimeout(resolve, 200));
      const after = window.relayGetEntryState();
      return { before, enter, after };
    });
    const hasDefaultReasonLog = consoleLogs.some((line) => line.includes('[VIS] sheetSelect resolved') && line.includes('reason=default'));
    const enterSheetDefaultPass =
      enterDefault?.enter?.ok === true
      && String(enterDefault?.after?.scope || '') === 'sheet'
      && !!String(enterDefault?.after?.sheetId || '')
      && hasDefaultReasonLog;
    log(`[VIS1] enterSheetDefault result=${enterSheetDefaultPass ? 'PASS' : 'FAIL'} sheetId=${String(enterDefault?.after?.sheetId || 'none')}`);

    const singleSheet = await page.evaluate(async () => {
      window.filamentRenderer.setLOD('SHEET');
      window.filamentRenderer.renderTree('vis1-proof-sheet');
      await new Promise((resolve) => setTimeout(resolve, 300));
      const sheetCountSheet = Number(window.filamentRenderer?._sheetsRendered || 0);
      window.filamentRenderer.setLOD('CELL');
      window.filamentRenderer.renderTree('vis1-proof-cell');
      await new Promise((resolve) => setTimeout(resolve, 300));
      const sheetCountCell = Number(window.filamentRenderer?._sheetsRendered || 0);
      return { sheetCountSheet, sheetCountCell };
    });
    const hasNoGlobalExplosion = !consoleLogs.some((line) => line.includes('[LOD-BUDGET] frame') && line.includes('sheetsDetailed=20'));
    const singleSheetRenderPass =
      singleSheet.sheetCountSheet <= 1
      && singleSheet.sheetCountCell <= 1
      && hasNoGlobalExplosion;
    log(`[VIS1] singleSheetRender result=${singleSheetRenderPass ? 'PASS' : 'FAIL'} sheetLOD=${singleSheet.sheetCountSheet} cellLOD=${singleSheet.sheetCountCell}`);

    await page.evaluate(() => {
      window.relayExitSheet();
      if (window.relayExitDepartment) window.relayExitDepartment();
      if (window.relayExitCompany) window.relayExitCompany();
      if (window.filamentRenderer?.setLOD) {
        window.filamentRenderer.setLOD('SHEET');
        window.filamentRenderer.setLOD('SHEET');
        window.filamentRenderer.setLOD('CELL');
        window.filamentRenderer.setLOD('CELL');
      }
    });
    await page.waitForTimeout(300);
    const sheetBlockCount = consoleLogs.filter((line) => line.includes('[VIS] sheetOnlyRender blocked selected=none requested=SHEET')).length;
    const cellBlockCount = consoleLogs.filter((line) => line.includes('[VIS] sheetOnlyRender blocked selected=none requested=CELL')).length;
    const refusalNoSpamPass = sheetBlockCount <= 1 && cellBlockCount <= 1;
    log(`[VIS1] refusalNoSpam result=${refusalNoSpamPass ? 'PASS' : 'FAIL'} sheet=${sheetBlockCount} cell=${cellBlockCount}`);

    const focusGuard = await page.evaluate(async () => {
      const before = String(window.hudManager?.data?.focusHint || '');
      const out = await window.enterFocusMode(null);
      await new Promise((resolve) => setTimeout(resolve, 120));
      const after = String(window.hudManager?.data?.focusHint || '');
      return { out, before, after };
    });
    const focusBlockedCount = consoleLogs.filter((line) => line.includes('[LENS] focusBlocked reason=noTarget')).length;
    const focusGuardPass =
      focusGuard?.out?.ok === false
      && focusBlockedCount <= 1
      && focusGuard.after === 'Select an object first';
    log(`[VIS1] focusGuard result=${focusGuardPass ? 'PASS' : 'FAIL'} hint="${focusGuard.after || 'none'}" logs=${focusBlockedCount}`);

    const exitState = await page.evaluate(() => {
      const entered = window.relayEnterSheet();
      const exited = window.relayExitSheet();
      return { entered, exited, state: window.relayGetEntryState() };
    });
    const exitCollapsePass = exitState?.entered?.ok === true
      && exitState?.exited?.ok === true
      && String(exitState?.state?.scope || '') !== 'sheet'
      && !exitState?.state?.sheetId;

    const osv = await runNodeScript('scripts/osv1-full-system-proof.mjs', 600000);
    const parity = await runNodeScript('scripts/headless-tier1-parity.mjs', 600000);
    const restoreParity = await runNodeScript('scripts/restore-full-parity-proof.mjs', 1200000);
    const osvPass = osv.ok && osv.output.includes('[OSV1] gate-summary result=PASS');
    const headlessPass = parity.ok && parity.output.includes('[HEADLESS] golden-compare facts=MATCH');
    const restorePass = restoreParity.ok && restoreParity.output.includes('[PARITY] gate-summary result=PASS');
    const railsPass = osvPass && headlessPass && restorePass;
    log(`[VIS1] rails result=${railsPass ? 'PASS' : 'FAIL'} osv1=${osvPass ? 'PASS' : 'FAIL'} headless=${headlessPass ? 'PASS' : 'FAIL'} parity=${restorePass ? 'PASS' : 'FAIL'}`);

    const gate = enterSheetDefaultPass && singleSheetRenderPass && refusalNoSpamPass && focusGuardPass && exitCollapsePass && railsPass;
    log(`[VIS1] gate-summary result=${gate ? 'PASS' : 'FAIL'} exitCollapse=${exitCollapsePass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!gate) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=VIS1_SCALE_ENTRY_PROOF detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

await main();
