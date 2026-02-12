import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `l1-scv-presence-proof-console-${DATE_TAG}.log`);
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

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let server = null;
  let browser = null;
  try {
    server = await startDevServer();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayGetSCVs === 'function'
        && typeof window.relaySetSCVPresence === 'function'
        && typeof window.relaySCVAttemptExecute === 'function'
        && typeof window.relaySCVCreateProposedCommitDraft === 'function',
      undefined,
      { timeout: 120000 }
    );

    const out = await page.evaluate(() => {
      const scvs = window.relayGetSCVs();
      const setPresence = window.relaySetSCVPresence('scv.coherence', {
        taskId: 'audit.demo.1',
        status: 'NORMAL',
        focusObjectId: 'sheet.P2P.ThreeWayMatch'
      });
      const after = window.relayGetPresenceState();
      const marker = (after.markers || []).find(m => m.actorId === 'scv.coherence') || null;
      const executeAttempt = window.relaySCVAttemptExecute('scv.coherence', 'commitPosting');
      const draft = window.relaySCVCreateProposedCommitDraft('scv.coherence', {
        requestId: 'audit.demo.1',
        summary: 'SCV identified mismatch cluster',
        changesetRef: 'SCV:L1:demo',
        authorityRef: 'policy.governance.v2',
        requiresApproval: true,
        stageGate: 'commitPosting',
        targetRef: { type: 'sheet', id: 'P2P.ThreeWayMatch' }
      });
      return {
        scvCount: (scvs || []).length,
        hasCapabilities: (scvs || []).every(s => Array.isArray(s.capabilities) && s.capabilities.length > 0),
        marker,
        executeAttempt,
        draft
      };
    });

    const markerPass = out.marker && out.marker.focusObjectId === 'sheet.P2P.ThreeWayMatch' && out.marker.taskId === 'audit.demo.1';
    const executePass = out.executeAttempt?.ok === false && String(out.executeAttempt?.reason) === 'SCV_EXECUTION_FORBIDDEN';
    const draftPass = out.draft?.ok === true && !!out.draft?.draft?.commitId;
    const catalogPass = Number(out.scvCount || 0) >= 3 && out.hasCapabilities === true;
    log(`[L1] scv-catalog result=${catalogPass ? 'PASS' : 'FAIL'} count=${out.scvCount || 0}`);
    log(`[L1] scv-presence result=${markerPass ? 'PASS' : 'FAIL'} focus=${out.marker?.focusObjectId || 'n/a'} task=${out.marker?.taskId || 'n/a'}`);
    log(`[L1] no-auto-execute result=${executePass ? 'PASS' : 'FAIL'} reason=${out.executeAttempt?.reason || 'n/a'}`);
    log(`[L1] proposed-commit-draft result=${draftPass ? 'PASS' : 'FAIL'} commitId=${out.draft?.draft?.commitId || 'n/a'}`);
    const pass = markerPass && executePass && draftPass && catalogPass;
    log(`[L1] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=L1_BLOCKER_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

await main();
