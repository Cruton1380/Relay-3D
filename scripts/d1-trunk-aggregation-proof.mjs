import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `d1-trunk-aggregation-proof-console-${DATE_TAG}.log`);
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

async function runScenario(page, orderTag = 'A') {
  return page.evaluate((tag) => {
    const branchNode = (window.relayState?.tree?.nodes || []).find(n => n.type === 'branch' && n.id === 'branch.p2p');
    const historyLen = (node) => Array.isArray(node?.metadata?.kpiMetrics) ? node.metadata.kpiMetrics.length : 0;
    const latestMetrics = (node) => (Array.isArray(node?.metadata?.kpiMetrics) ? node.metadata.kpiMetrics.slice(-1)[0]?.metrics || {} : {});
    const beforeHistory = historyLen(branchNode);
    const beforeBranchMetrics = latestMetrics(branchNode);
    const beforeTrunk = window.relayGetTrunkMetrics?.() || { metrics: [], hash: null };
    const beforeOutstanding = Number(beforeTrunk.metrics?.find(m => m.sourceMetricId === 'outstanding')?.value || 0);

    const invA = {
      invId: `INV-D1-${tag}-001`,
      invLineId: `INVL-D1-${tag}-001`,
      vendorId: 'VENDOR_D1',
      poLineId: '',
      itemId: 'item.D1A',
      qty: 1,
      unitPrice: 111,
      lineTotal: 111,
      currency: 'USD',
      invoiceDate: '2026-02-11',
      dueDate: '2026-03-11',
      status: 'POSTED',
      entrySource: 'relay-proof',
      sourceId: `INVL-D1-${tag}-001`,
      eventTimestamp: '2026-02-11T10:00:00.000Z'
    };
    const invB = {
      invId: `INV-D1-${tag}-002`,
      invLineId: `INVL-D1-${tag}-002`,
      vendorId: 'VENDOR_D1',
      poLineId: '',
      itemId: 'item.D1B',
      qty: 2,
      unitPrice: 50,
      lineTotal: 100,
      currency: 'USD',
      invoiceDate: '2026-02-11',
      dueDate: '2026-03-11',
      status: 'POSTED',
      entrySource: 'relay-proof',
      sourceId: `INVL-D1-${tag}-002`,
      eventTimestamp: '2026-02-11T10:00:01.000Z'
    };
    const pair = tag === 'A' ? [invA, invB] : [invB, invA];
    for (const rec of pair) {
      window.relayIngestRoute('p2p.inv', rec);
    }

    const afterBranchNode = (window.relayState?.tree?.nodes || []).find(n => n.type === 'branch' && n.id === 'branch.p2p');
    const afterHistory = historyLen(afterBranchNode);
    const afterBranchMetrics = latestMetrics(afterBranchNode);
    const afterTrunk = window.relayGetTrunkMetrics?.() || { metrics: [], hash: null };
    const outstandingMetric = afterTrunk.metrics?.find(m => m.sourceMetricId === 'outstanding') || null;
    const afterOutstanding = Number(outstandingMetric?.value || 0);
    const contributors = Array.isArray(outstandingMetric?.contributors) ? outstandingMetric.contributors : [];
    const traceExists = contributors.some((c) => c.branchId === 'branch.p2p' && c.sourceCell && Array.isArray(c.factSheetIds) && c.factSheetIds.length > 0);

    return {
      beforeHistory,
      afterHistory,
      branchKpiChanged: afterHistory > beforeHistory,
      beforeBranchMetrics,
      afterBranchMetrics,
      beforeTrunkHash: String(beforeTrunk.hash || ''),
      afterTrunkHash: String(afterTrunk.hash || ''),
      beforeOutstanding,
      afterOutstanding,
      trunkMetricChanged: Math.abs(afterOutstanding - beforeOutstanding) > 1e-9,
      traceExists,
      metricId: String(outstandingMetric?.metricId || ''),
      contributors
    };
  }, orderTag);
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
      () => typeof window.relayIngestRoute === 'function'
        && typeof window.relayGetTrunkMetrics === 'function'
        && !!(window.relayState?.tree?.nodes || []).find(n => n.id === 'branch.p2p'),
      undefined,
      { timeout: 120000 }
    );

    const runA = await runScenario(page, 'A');
    log(`[D1] branch-kpi-change result=${runA.branchKpiChanged ? 'PASS' : 'FAIL'} before=${runA.beforeHistory} after=${runA.afterHistory}`);
    log(`[D1] trunk-rollup-change result=${runA.trunkMetricChanged ? 'PASS' : 'FAIL'} metric=${runA.metricId || 'n/a'} before=${runA.beforeOutstanding.toFixed(2)} after=${runA.afterOutstanding.toFixed(2)}`);
    log(`[D1] trace result=${runA.traceExists ? 'PASS' : 'FAIL'} metric=${runA.metricId || 'n/a'} contributors=${runA.contributors.length}`);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayIngestRoute === 'function' && typeof window.relayGetTrunkMetrics === 'function',
      undefined,
      { timeout: 120000 }
    );
    const runB = await runScenario(page, 'B');
    const deterministic = runA.afterTrunkHash === runB.afterTrunkHash;
    log(`[D1] determinism result=${deterministic ? 'PASS' : 'FAIL'} hashA=${runA.afterTrunkHash} hashB=${runB.afterTrunkHash}`);

    const pass = !!(runA.branchKpiChanged && runA.trunkMetricChanged && runA.traceExists && deterministic);
    log(`[D1] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=D1_BLOCKER_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

await main();
