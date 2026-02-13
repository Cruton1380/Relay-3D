import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-13';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `hud1-adaptive-hud-console-${DATE_TAG}.log`);
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
      () => typeof window.relayGetHudPolicyMeta === 'function'
        && typeof window.relaySetCellValueDeterministic === 'function'
        && typeof window.relayEnterBranchWalk === 'function'
        && typeof window.relayGetBranchWalkState === 'function',
      undefined,
      { timeout: 120000 }
    );

    const results = await page.evaluate(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const hud = document.getElementById('hud');
      const inspectorPanel = document.getElementById('matchInspector');
      const hudMeta = window.relayGetHudPolicyMeta();
      if (typeof window.relayRefreshHudNow === 'function') window.relayRefreshHudNow();

      // Params load + compact mode evidence.
      await wait(250);
      const hudTextA = String(hud?.innerText || '');
      const paramsPass = hudMeta.paramsVersion === 'HUD-PARAMS-v0'
        && hudMeta.policyRef === 'local:HUD-PARAMS-v0'
        && hudMeta.layoutMode === 'compact'
        && hudTextA.includes('HUD-PARAMS-v0');

      // Mode switch determinism (FreeFly -> BranchWalk).
      const branch = (window.relayState?.tree?.nodes || []).find((n) => n?.type === 'branch');
      let enterA = { ok: false };
      let enterB = { ok: false };
      if (branch?.id) {
        enterA = await window.relayEnterBranchWalk(branch.id);
        if (typeof window.relayRefreshHudNow === 'function') window.relayRefreshHudNow();
        await wait(350);
      }
      const hudTextBranch1 = String(hud?.innerText || '');
      const branchStateA = window.relayGetBranchWalkState ? window.relayGetBranchWalkState() : { active: false };
      const branchLayer2A = branchStateA.active === true && hudTextBranch1.includes('BranchWalk') && hudTextBranch1.includes('branch=');
      if (window.relayExitBranchWalk) await window.relayExitBranchWalk();
      await wait(120);
      if (branch?.id) {
        enterB = await window.relayEnterBranchWalk(branch.id);
        if (typeof window.relayRefreshHudNow === 'function') window.relayRefreshHudNow();
        await wait(350);
      }
      const hudTextBranch2 = String(hud?.innerText || '');
      const branchStateB = window.relayGetBranchWalkState ? window.relayGetBranchWalkState() : { active: false };
      const branchLayer2B = branchStateB.active === true && hudTextBranch2.includes('BranchWalk') && hudTextBranch2.includes('branch=');
      const modeSwitchPass = enterA?.ok === true && enterB?.ok === true && branchLayer2A && branchLayer2B;
      if (window.relayExitBranchWalk) await window.relayExitBranchWalk();
      await wait(150);

      // Cell context.
      const sheet = (window.relayState?.tree?.nodes || []).find((n) => n?.type === 'sheet');
      let cellContextPass = false;
      if (sheet?.id) {
        window.relaySetCellValueDeterministic({ sheetId: sheet.id, cellRef: 'A1', input: '8' });
        window.relaySetCellValueDeterministic({ sheetId: sheet.id, cellRef: 'B1', input: '5' });
        window.relaySetCellValueDeterministic({ sheetId: sheet.id, cellRef: 'C1', input: '=A1+B1' });
        if (typeof window.relayRefreshHudNow === 'function') window.relayRefreshHudNow();
        await wait(350);
        const hudTextCell = String(hud?.innerText || '');
        cellContextPass = hudTextCell.includes('cell=C1') && hudTextCell.includes('formula=') && hudTextCell.includes('state=');
      }

      // Inspector toggle.
      const closedByDefault = !inspectorPanel || inspectorPanel.style.display === 'none';
      const toggleButton = document.getElementById('hudInspectorToggle');
      if (toggleButton) toggleButton.click();
      await wait(120);
      const opened = !inspectorPanel || inspectorPanel.style.display !== 'none';
      const inspectorPass = closedByDefault && opened;

      // Determinism: same output for repeated inspect metadata request.
      const metaA = JSON.stringify(window.relayGetHudPolicyMeta());
      const metaB = JSON.stringify(window.relayGetHudPolicyMeta());
      const determinismPass = metaA === metaB;

      return {
        paramsPass,
        modeSwitchPass,
        cellContextPass,
        inspectorPass,
        determinismPass,
        debug: {
          branchId: branch?.id || null,
          enterA,
          enterB,
          branchLayer2A,
          branchLayer2B,
          hudBranch1: hudTextBranch1.slice(0, 400),
          hudBranch2: hudTextBranch2.slice(0, 400),
          hudCell: String(document.getElementById('hud')?.innerText || '').slice(0, 500)
        }
      };
    });

    const paramsLogPass = consoleLogs.some((line) =>
      line.includes('[HUD] paramsLoaded version=HUD-PARAMS-v0 policyRef=local:HUD-PARAMS-v0')
    );
    const modeLogPass = consoleLogs.some((line) => line.includes('[HUD] mode='));
    const paramsLine = consoleLogs.find((line) => line.includes('[HUD] paramsLoaded version=HUD-PARAMS-v0 policyRef=local:HUD-PARAMS-v0')) || '';
    const modeLine = consoleLogs.find((line) => line.includes('[HUD] mode=')) || '';

    const paramsPass = results.paramsPass && paramsLogPass;
    const modeSwitchPass = results.modeSwitchPass && modeLogPass;
    const cellContextPass = results.cellContextPass;
    const inspectorPass = results.inspectorPass;
    const determinismPass = results.determinismPass;
    const gatePre = paramsPass && modeSwitchPass && cellContextPass && inspectorPass && determinismPass;

    log(`[HUD1] params-load result=${paramsPass ? 'PASS' : 'FAIL'}`);
    if (paramsLine) log(paramsLine);
    log(`[HUD1] mode-switch result=${modeSwitchPass ? 'PASS' : 'FAIL'}`);
    if (modeLine) log(modeLine);
    log(`[HUD1] cell-context result=${cellContextPass ? 'PASS' : 'FAIL'}`);
    log(`[HUD1] inspector-toggle result=${inspectorPass ? 'PASS' : 'FAIL'}`);
    log(`[HUD1] determinism result=${determinismPass ? 'PASS' : 'FAIL'}`);
    if (!modeSwitchPass || !cellContextPass) {
      log(`[HUD1] debug branchId=${results?.debug?.branchId || 'none'} enterA=${JSON.stringify(results?.debug?.enterA || {})} enterB=${JSON.stringify(results?.debug?.enterB || {})}`);
      log(`[HUD1] debug branchLayer2A=${results?.debug?.branchLayer2A} branchLayer2B=${results?.debug?.branchLayer2B}`);
      log(`[HUD1] debug hudBranch1=${(results?.debug?.hudBranch1 || '').replace(/\s+/g, ' ').trim()}`);
      log(`[HUD1] debug hudBranch2=${(results?.debug?.hudBranch2 || '').replace(/\s+/g, ' ').trim()}`);
      log(`[HUD1] debug hudCell=${(results?.debug?.hudCell || '').replace(/\s+/g, ' ').trim()}`);
    }

    if (!gatePre) {
      log('[HUD1] gate-summary result=FAIL');
      await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
      process.exitCode = 2;
      return;
    }

    const osv = await runNodeScript('scripts/osv1-full-system-proof.mjs');
    const parity = await runNodeScript('scripts/headless-tier1-parity.mjs');
    const osvPass = osv.ok && osv.output.includes('[OSV1] gate-summary result=PASS');
    const parityPass = parity.ok && parity.output.includes('[HEADLESS] golden-compare facts=MATCH');
    log(`[HUD1] osv1-regression result=${osvPass ? 'PASS' : 'FAIL'}`);
    log(`[HUD1] headless-parity result=${parityPass ? 'PASS' : 'FAIL'}`);

    const gate = gatePre && osvPass && parityPass;
    log(`[HUD1] gate-summary result=${gate ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!gate) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=HUD1_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

await main();
