import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `c1-module-agnostic-recompute-console-${DATE_TAG}.log`);
const APP_URL = 'http://localhost:3000/relay-cesium-world.html';

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 45000) {
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
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[MODULE]') || text.includes('[REFUSAL]')) {
        log(`[BROWSER] ${text}`);
      }
    });
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayIngestRoute === 'function',
      undefined,
      { timeout: 120000 }
    );
    const readiness = await page.evaluate(() => {
      const hasP2P = !!(window.relayState?.tree?.nodes || []).find(n => n.id === 'P2P.RequisitionLines');
      const hasMFG = !!(window.relayState?.tree?.nodes || []).find(n => n.id === 'MFG.WorkOrders');
      return { hasP2P, hasMFG, nodeCount: (window.relayState?.tree?.nodes || []).length };
    });
    if (!readiness.hasP2P || !readiness.hasMFG) {
      log(`[C1-BLOCKER] readiness result=FAIL hasP2P=${readiness.hasP2P} hasMFG=${readiness.hasMFG} nodes=${readiness.nodeCount}`);
      log('[REFUSAL] reason=C1_BLOCKER_MODULE_LOAD moduleAgnosticRecompute=UNREACHABLE');
      await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
      process.exitCode = 2;
      return;
    }

    const out = await page.evaluate(() => {
      const getBranchMetricsLen = (branchId) => {
        const branch = (window.relayState?.tree?.nodes || []).find(n => n.type === 'branch' && n.id === branchId);
        return (branch?.metadata?.kpiMetrics || []).length;
      };
      const getMatchRows = (sheetId) => {
        const sheet = (window.relayState?.tree?.nodes || []).find(n => n.type === 'sheet' && n.id === sheetId);
        return Math.max(0, Number(sheet?.rows || 1) - 1);
      };

      const p2pBefore = getBranchMetricsLen('branch.p2p');
      const mfgBefore = getBranchMetricsLen('branch.mfg');
      const p2pMatchBefore = getMatchRows('P2P.ThreeWayMatch');
      const mfgMatchBefore = getMatchRows('MFG.WOIssueMatch');

      window.relayIngestRoute('p2p.pr', {
        prId: 'PR-C1-001',
        prLineId: 'PRL-C1-001',
        requestorUserId: 'user.buyer1',
        department: 'OPS',
        siteId: 'SITE_A',
        itemId: 'item.C1.P2P',
        description: 'C1 p2p recompute seed',
        qty: 3,
        unit: 'EA',
        estUnitPrice: 12.5,
        estTotal: 37.5,
        currency: 'USD',
        requestDate: '2026-02-11',
        status: 'DRAFT',
        entrySource: 'relay-form',
        sourceId: 'PRL-C1-001',
        eventTimestamp: new Date().toISOString()
      });

      const p2pAfter = getBranchMetricsLen('branch.p2p');
      const mfgAfterP2P = getBranchMetricsLen('branch.mfg');
      const p2pMatchAfter = getMatchRows('P2P.ThreeWayMatch');

      window.relayIngestRoute('mfg.workOrder', {
        workOrderId: 'WO-C1-001',
        siteId: 'SITE_A',
        itemId: 'item.C1.MFG',
        plannedQty: 10,
        status: 'RELEASED',
        entrySource: 'relay-form',
        sourceId: 'WO-C1-001',
        eventTimestamp: new Date().toISOString()
      });
      window.relayIngestRoute('mfg.materialIssue', {
        issueId: 'ISS-C1-001',
        workOrderId: 'WO-C1-001',
        itemId: 'item.C1.MFG',
        qtyIssued: 10,
        status: 'POSTED',
        entrySource: 'relay-form',
        sourceId: 'ISS-C1-001',
        eventTimestamp: new Date().toISOString()
      });

      const mfgAfter = getBranchMetricsLen('branch.mfg');
      const p2pAfterMFG = getBranchMetricsLen('branch.p2p');
      const mfgMatchAfter = getMatchRows('MFG.WOIssueMatch');

      return {
        p2pMetricsDelta: p2pAfter - p2pBefore,
        p2pIsolationDelta: p2pAfterMFG - p2pAfter,
        p2pMatchDelta: p2pMatchAfter - p2pMatchBefore,
        mfgMetricsDelta: mfgAfter - mfgBefore,
        mfgIsolationDelta: mfgAfterP2P - mfgBefore,
        mfgMatchDelta: mfgMatchAfter - mfgMatchBefore
      };
    });

    const p2pPass = out.p2pMetricsDelta > 0;
    const mfgPass = out.mfgMetricsDelta > 0 && out.mfgMatchDelta > 0;
    const isolationPass = out.p2pIsolationDelta === 0 && out.mfgIsolationDelta === 0;

    log(`[C1-BLOCKER] module-agnostic-recompute p2p result=${p2pPass ? 'PASS' : 'FAIL'} metricsDelta=${out.p2pMetricsDelta} matchDelta=${out.p2pMatchDelta}`);
    log(`[C1-BLOCKER] module-agnostic-recompute mfg result=${mfgPass ? 'PASS' : 'FAIL'} metricsDelta=${out.mfgMetricsDelta} matchDelta=${out.mfgMatchDelta}`);
    log(`[C1-BLOCKER] scope-isolation result=${isolationPass ? 'PASS' : 'FAIL'} p2pDeltaOnMfg=${out.p2pIsolationDelta} mfgDeltaOnP2P=${out.mfgIsolationDelta}`);

    const pass = p2pPass && mfgPass && isolationPass;
    log(`[C1-BLOCKER] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    log(`[C1-BLOCKER] log=archive/proofs/${path.basename(LOG_FILE)}`);
    if (!pass) process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

main().catch(async (err) => {
  const fatal = `[C1-BLOCKER] fatal=${err?.stack || err}`;
  // eslint-disable-next-line no-console
  console.error(fatal);
  try {
    await fs.mkdir(PROOFS_DIR, { recursive: true });
    await fs.writeFile(LOG_FILE, `${fatal}\n`, 'utf8');
  } catch {
    // ignore
  }
  process.exitCode = 1;
});

