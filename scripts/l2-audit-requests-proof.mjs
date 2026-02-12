import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `l2-audit-requests-proof-console-${DATE_TAG}.log`);
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
      () => typeof window.relayCreateAuditRequest === 'function'
        && typeof window.relayAssignAuditRequest === 'function'
        && typeof window.relayProduceAuditFindings === 'function'
        && typeof window.relayApproveAuditRequest === 'function',
      undefined,
      { timeout: 120000 }
    );

    const out = await page.evaluate(() => {
      window.__relayStageState = { gsgByScope: { 'zone.avgol.ops': 1 }, isgByUser: {} };
      const stageLocked = window.relayCreateAuditRequest({
        targetObjectId: 'module.P2P',
        scope: 'zone.avgol.ops',
        requestedBy: 'manager.l2',
        outputType: 'finding',
        constraints: { timebox: '2026-Q1', actions: 'findings-only' },
        stageGateAction: 'policyMutation'
      });

      window.__relayStageState = { gsgByScope: { 'zone.avgol.ops': 3 }, isgByUser: {} };
      const created = window.relayCreateAuditRequest({
        targetObjectId: 'sheet.P2P.ThreeWayMatch',
        scope: 'zone.avgol.ops',
        requestedBy: 'manager.l2',
        outputType: 'proposed-commit',
        constraints: { timebox: '2026-Q1', actions: 'read-only' },
        authorityRef: 'policy.governance.v2'
      });
      if (!created?.ok) {
        return { stageLocked, created, assigned: null, findings: null, approved: null, requests: [] };
      }
      const requestId = created.request.requestId;
      const assigned = window.relayAssignAuditRequest(requestId, 'scv.coherence');
      const findings = window.relayProduceAuditFindings(requestId, [
        { objectId: 'match.3WM.001', summary: 'Mismatch cluster around price', severity: 'WARN', trace: 'match.3WM.001' },
        { objectId: 'match.3WM.044', summary: 'Missing GR link', severity: 'WARN', trace: 'match.3WM.044' }
      ], {
        proposedCommitDraft: {
          targetRef: { type: 'sheet', id: 'P2P.ThreeWayMatch' },
          summary: 'Apply tolerance proposal',
          changesetRef: 'AUDIT:L2:proposal',
          authorityRef: 'policy.governance.v2',
          requiresApproval: true,
          stageGate: 'commitPosting'
        }
      });
      const approved = window.relayApproveAuditRequest(requestId, { by: 'manager.l2', materialize: true, autoCommit: false });
      const requests = window.relayGetAuditRequests();
      const req = requests.find(r => r.requestId === requestId) || null;
      const snapshots = window.relayGetSnapshots ? window.relayGetSnapshots() : [];
      const hasProposeSnapshot = snapshots.some(s => s.type === 'PROPOSE' && String(s.evidence?.proposal?.changesetRef || '').includes('AUDIT:L2:proposal'));
      return {
        stageLocked,
        created,
        assigned,
        findings,
        approved,
        hasProposeSnapshot,
        requestStatus: req?.status || 'UNKNOWN',
        findingsCount: (req?.findings || []).length
      };
    });

    const stagePass = out.stageLocked?.ok === false && String(out.stageLocked?.reason) === 'STAGE_LOCKED';
    const lifecyclePass = out.created?.ok === true && out.assigned?.ok === true && out.findings?.ok === true && out.approved?.ok === true;
    const findingsPass = Number(out.findingsCount || 0) >= 2;
    const materializePass = out.hasProposeSnapshot === true && out.requestStatus === 'APPROVED';
    log(`[L2] stage-gate result=${stagePass ? 'PASS' : 'FAIL'} refusal=${out.stageLocked?.reason || 'n/a'}`);
    log(`[L2] request-lifecycle result=${lifecyclePass ? 'PASS' : 'FAIL'} requestId=${out.created?.request?.requestId || 'n/a'}`);
    log(`[L2] findings result=${findingsPass ? 'PASS' : 'FAIL'} count=${out.findingsCount || 0}`);
    log(`[L2] approval-materialize result=${materializePass ? 'PASS' : 'FAIL'} status=${out.requestStatus || 'n/a'}`);
    const pass = stagePass && lifecyclePass && findingsPass && materializePass;
    log(`[L2] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=L2_BLOCKER_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

await main();
