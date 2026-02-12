import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `cam0-branch-walk-proof-console-${DATE_TAG}.log`);
const APP_URL = 'http://localhost:3000/relay-cesium-world.html';

const lines = [];
const log = (line) => {
  const text = String(line);
  lines.push(text);
  // eslint-disable-next-line no-console
  console.log(text);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch {
      // keep polling
    }
    await sleep(400);
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
      let h = 0x811c9dc5;
      const src = String(text || '');
      for (let i = 0; i < src.length; i += 1) {
        h ^= src.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
      }
      return `0x${(h >>> 0).toString(16).padStart(8, '0')}`;
    };
    const branches = (window.relayState?.tree?.nodes || [])
      .filter((n) => n.type === 'branch')
      .slice()
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    if (!branches.length) return { ok: false, reason: 'NO_BRANCHES' };

    let selected = branches[0].id;
    let selectedState = null;
    for (const b of branches) {
      // eslint-disable-next-line no-await-in-loop
      const en = await window.relayEnterBranchWalk(b.id);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 80));
      const st = window.relayGetBranchWalkState?.() || {};
      // eslint-disable-next-line no-await-in-loop
      await window.relayExitBranchWalk();
      if (en?.ok === true && Array.isArray(st.path) && st.path.length >= 4) {
        selected = b.id;
        selectedState = st;
        break;
      }
    }

    const before = {
      activeObjectId: String(window.relayGetWorkMode?.()?.objectId || ''),
      mode: String(window.relayGetWorkMode?.()?.mode || '')
    };
    const entered = await window.relayEnterBranchWalk(selected);
    await new Promise((r) => setTimeout(r, 80));
    const stateEnter = window.relayGetBranchWalkState?.() || {};

    const walked = [String(stateEnter.currentObjectId || '')];
    const next1 = await window.relayBranchWalkNext();
    await new Promise((r) => setTimeout(r, 80));
    walked.push(String(window.relayGetBranchWalkState?.()?.currentObjectId || ''));
    const next2 = await window.relayBranchWalkNext();
    await new Promise((r) => setTimeout(r, 80));
    walked.push(String(window.relayGetBranchWalkState?.()?.currentObjectId || ''));
    const prev = await window.relayBranchWalkPrev();
    await new Promise((r) => setTimeout(r, 80));
    walked.push(String(window.relayGetBranchWalkState?.()?.currentObjectId || ''));
    const exit = await window.relayExitBranchWalk();
    await new Promise((r) => setTimeout(r, 120));
    const after = window.relayGetBranchWalkState?.() || {};

    const uniqueWalked = Array.from(new Set(walked.filter(Boolean)));
    const snapPath = (stateEnter.path || []).map((p) => `${p.kind}:${p.objectId}`);
    const signature = {
      selected,
      path: snapPath,
      walked,
      enteredOk: entered?.ok === true,
      next1Ok: next1?.ok === true,
      next2Ok: next2?.ok === true,
      prevOk: prev?.ok === true,
      exitOk: exit?.ok === true,
      selectionPreserved: exit?.selectionPreserved === true,
      lodPreserved: exit?.lodPreserved === true,
      inactiveAfterExit: after.active === false
    };
    return {
      ok: true,
      selected,
      selectedState,
      entered,
      stateEnter,
      next1,
      next2,
      prev,
      exit,
      walked,
      uniqueWalked,
      signature,
      hash: fnv1a(JSON.stringify(signature)),
      before
    };
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
    const moveLogs = [];
    page.on('console', (msg) => {
      const t = msg.text();
      if (t.includes('[MOVE]')) moveLogs.push(t);
    });

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayEnterBranchWalk === 'function'
        && typeof window.relayExitBranchWalk === 'function'
        && typeof window.relayBranchWalkNext === 'function'
        && typeof window.relayBranchWalkPrev === 'function'
        && typeof window.relayGetBranchWalkState === 'function'
        && typeof window.enterBranchWalk === 'function'
        && typeof window.exitBranchWalk === 'function',
      undefined,
      { timeout: 120000 }
    );

    const runA = await runScenario(page);
    if (!runA?.ok) {
      throw new Error(runA?.reason || 'SCENARIO_A_FAILED');
    }
    const enterPass = runA.entered?.ok === true && runA.stateEnter?.active === true;
    const snapPass = Array.isArray(runA.stateEnter?.path)
      && runA.stateEnter.path.length >= 4
      && runA.uniqueWalked.length >= 2;
    const restorePass = runA.exit?.ok === true && runA.exit?.selectionPreserved === true && runA.exit?.lodPreserved === true;
    const notTrapped = runA.stateEnter?.active === true && runA.exit?.ok === true && runA.exit?.active === false;

    log(`[CAM0.4] branch-enter result=${enterPass ? 'PASS' : 'FAIL'} branch=${runA.selected || 'n/a'} steps=${Array.isArray(runA.stateEnter?.path) ? runA.stateEnter.path.length : 0}`);
    log(`[CAM0.4] snapped-movement result=${snapPass ? 'PASS' : 'FAIL'} walked=${runA.walked.join('->')}`);
    log(`[CAM0.4] restore result=${restorePass ? 'PASS' : 'FAIL'} selectionPreserved=${runA.exit?.selectionPreserved === true ? 'true' : 'false'} lodPreserved=${runA.exit?.lodPreserved === true ? 'true' : 'false'}`);
    log(`[CAM0.4] trap-check result=${notTrapped ? 'PASS' : 'FAIL'}`);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayEnterBranchWalk === 'function'
        && typeof window.enterBranchWalk === 'function'
        && typeof window.exitBranchWalk === 'function',
      undefined,
      { timeout: 120000 }
    );
    const runB = await runScenario(page);
    const deterministic = runA.hash === runB.hash;
    const logMode = moveLogs.some((t) => t.includes('[MOVE] mode=branch target='));
    const logStep = moveLogs.some((t) => t.includes('[MOVE] branch-step from='));
    const logExit = moveLogs.some((t) => t.includes('[MOVE] branch-exit restoreView=true'));
    const logsPass = logMode && logStep && logExit;
    log(`[CAM0.4] determinism result=${deterministic ? 'PASS' : 'FAIL'} hashA=${runA.hash} hashB=${runB.hash}`);
    log(`[CAM0.4] required-logs result=${logsPass ? 'PASS' : 'FAIL'} moveLogs=${moveLogs.length}`);

    const pass = enterPass && snapPass && restorePass && notTrapped && deterministic && logsPass;
    log(`[CAM0.4] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=CAM04_BRANCH_WALK_BLOCKER detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

await main();
