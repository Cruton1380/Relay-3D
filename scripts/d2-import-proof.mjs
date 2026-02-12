import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `d2-import-proof-console-${DATE_TAG}.log`);
const SCREENSHOT_FILE = path.join(PROOFS_DIR, `d2-import-proof-screenshot-${DATE_TAG}.png`);
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

async function runScenario(page) {
  return page.evaluate(() => {
    const getSheet = (id) => (window.relayState?.tree?.nodes || []).find(n => n.type === 'sheet' && n.id === id) || null;
    const getBranch = (id) => (window.relayState?.tree?.nodes || []).find(n => n.type === 'branch' && n.id === id) || null;
    const rowCount = (sheetId) => Math.max(0, Number(getSheet(sheetId)?.rows || 1) - 1);
    const sheetRowsAsObjects = (sheetId) => {
      const sheet = getSheet(sheetId);
      if (!sheet) return [];
      const schema = sheet.metadata?.schema || [];
      const rows = new Map();
      for (const cell of (sheet.cellData || [])) {
        if (Number(cell.row) <= 0) continue;
        if (!rows.has(cell.row)) rows.set(cell.row, {});
        const row = rows.get(cell.row);
        const key = schema[cell.col]?.id || schema[cell.col]?.name || `col${cell.col}`;
        row[key] = (cell.value ?? cell.display ?? null);
      }
      return [...rows.values()];
    };
    const hash = (value) => {
      const src = JSON.stringify(value);
      let h = 0x811c9dc5;
      for (let i = 0; i < src.length; i += 1) {
        h ^= src.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
      }
      return `0x${(h >>> 0).toString(16).padStart(8, '0')}`;
    };
    const readCell = (sheetId, ref) => {
      const sheet = getSheet(sheetId);
      if (!sheet) return null;
      const m = String(ref || '').match(/^([A-Z]+)(\d+)$/);
      if (!m) return null;
      const letters = m[1];
      const row = Number(m[2]) - 1;
      let col = 0;
      for (let i = 0; i < letters.length; i += 1) col = col * 26 + (letters.charCodeAt(i) - 64);
      col -= 1;
      const ci = (sheet._cellIndex && sheet._cellIndex.get(`${row},${col}`))
        || (sheet.cellData || []).find(c => c.row === row && c.col === col)
        || null;
      return Number(ci?.value ?? ci?.display ?? 0);
    };
    const metricLen = (branchId) => (getBranch(branchId)?.metadata?.kpiMetrics || []).length;

    const before = {
      p2pReq: rowCount('P2P.RequisitionLines'),
      mfgWo: rowCount('MFG.WorkOrders'),
      mfgIssue: rowCount('MFG.MaterialIssues'),
      mfgMatch: rowCount('MFG.WOIssueMatch'),
      p2pMetrics: metricLen('branch.p2p'),
      mfgMetrics: metricLen('branch.mfg')
    };

    const csv = [
      'PR_ID,PR_LINE,REQ_USER,DEPT,SITE,ITEM,DESC,QTY,UNIT_PRICE,EST_TOTAL,CURR,REQ_DATE,STATUS,ENTRY,SOURCE,TS',
      'PR-D2-001,PRL-D2-001,user.buyer1,OPS,SITE_A,item.D2A,Adapter import row,5,10,50,USD,2026-02-11,DRAFT,relay-file,PRL-D2-001,2026-02-11T10:00:00.000Z'
    ].join('\n');
    const p2pCsvResult = window.relayImportCsvToRoute(csv, {
      routeId: 'p2p.pr',
      columnMap: {
        prId: 'PR_ID',
        prLineId: 'PR_LINE',
        requestorUserId: 'REQ_USER',
        department: 'DEPT',
        siteId: 'SITE',
        itemId: 'ITEM',
        description: 'DESC',
        qty: 'QTY',
        estUnitPrice: 'UNIT_PRICE',
        estTotal: 'EST_TOTAL',
        currency: 'CURR',
        requestDate: 'REQ_DATE',
        status: 'STATUS',
        entrySource: 'ENTRY',
        sourceId: 'SOURCE',
        eventTimestamp: 'TS'
      }
    });

    const woWs = window.XLSX.utils.aoa_to_sheet([
      ['WO', 'SITE', 'ITEM', 'PLANNED', 'STATUS', 'ENTRY', 'SOURCE', 'TS'],
      ['WO-D2-001', 'SITE_A', 'item.D2A', 5, 'RELEASED', 'relay-file', 'WO-D2-001', '2026-02-11T10:01:00.000Z']
    ]);
    const woWb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(woWb, woWs, 'MFG-WO');
    const woBase64 = window.XLSX.write(woWb, { type: 'base64', bookType: 'xlsx' });
    const mfgWoXlsxResult = window.relayImportXlsxBase64ToRoute(woBase64, {
      routeId: 'mfg.workOrder',
      columnMap: {
        workOrderId: 'WO',
        siteId: 'SITE',
        itemId: 'ITEM',
        plannedQty: 'PLANNED',
        status: 'STATUS',
        entrySource: 'ENTRY',
        sourceId: 'SOURCE',
        eventTimestamp: 'TS'
      }
    });

    const issueWs = window.XLSX.utils.aoa_to_sheet([
      ['ISSUE', 'WO', 'ITEM', 'QTY_ISSUED', 'STATUS', 'ENTRY', 'SOURCE', 'TS'],
      ['ISS-D2-001', 'WO-D2-001', 'item.D2A', 5, 'POSTED', 'relay-file', 'ISS-D2-001', '2026-02-11T10:02:00.000Z']
    ]);
    const issueWb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(issueWb, issueWs, 'MFG-ISS');
    const issueBase64 = window.XLSX.write(issueWb, { type: 'base64', bookType: 'xlsx' });
    const mfgIssueXlsxResult = window.relayImportXlsxBase64ToRoute(issueBase64, {
      routeId: 'mfg.materialIssue',
      columnMap: {
        issueId: 'ISSUE',
        workOrderId: 'WO',
        itemId: 'ITEM',
        qtyIssued: 'QTY_ISSUED',
        status: 'STATUS',
        entrySource: 'ENTRY',
        sourceId: 'SOURCE',
        eventTimestamp: 'TS'
      }
    });

    const after = {
      p2pReq: rowCount('P2P.RequisitionLines'),
      mfgWo: rowCount('MFG.WorkOrders'),
      mfgIssue: rowCount('MFG.MaterialIssues'),
      mfgMatch: rowCount('MFG.WOIssueMatch'),
      p2pMetrics: metricLen('branch.p2p'),
      mfgMetrics: metricLen('branch.mfg')
    };

    const mfgMatchRows = sheetRowsAsObjects('MFG.WOIssueMatch')
      .sort((a, b) => String(a.workOrderId || '').localeCompare(String(b.workOrderId || '')));
    const p2pReqRows = sheetRowsAsObjects('P2P.RequisitionLines')
      .slice(-3)
      .sort((a, b) => String(a.reqLineId || '').localeCompare(String(b.reqLineId || '')));
    const summaryCoverage = readCell('MFG.ProductionSummary', 'B4');

    const hashBundle = {
      mfgMatchHash: hash(mfgMatchRows),
      p2pReqHash: hash(p2pReqRows),
      mfgCoverageHash: hash({ summaryCoverage: Number.isFinite(summaryCoverage) ? summaryCoverage : 0 })
    };

    return {
      before,
      after,
      p2pCsvResult,
      mfgWoXlsxResult,
      mfgIssueXlsxResult,
      summaryCoverage: Number.isFinite(summaryCoverage) ? summaryCoverage : 0,
      hashBundle
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
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayImportCsvToRoute === 'function'
        && typeof window.relayImportXlsxBase64ToRoute === 'function'
        && typeof window.relayIngestBatch === 'function'
        && !!(window.relayState?.tree?.nodes || []).find(n => n.id === 'MFG.WorkOrders'),
      undefined,
      { timeout: 120000 }
    );

    const runA = await runScenario(page);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayImportCsvToRoute === 'function'
        && typeof window.relayImportXlsxBase64ToRoute === 'function',
      undefined,
      { timeout: 120000 }
    );
    const runB = await runScenario(page);

    const factsAppendedPass =
      (runA.after.p2pReq - runA.before.p2pReq) >= 1
      && (runA.after.mfgWo - runA.before.mfgWo) >= 1
      && (runA.after.mfgIssue - runA.before.mfgIssue) >= 1;
    const matchPass = (runA.after.mfgMatch - runA.before.mfgMatch) >= 1;
    const summaryPass = Number.isFinite(runA.summaryCoverage);
    const kpiPass = (runA.after.p2pMetrics - runA.before.p2pMetrics) >= 1
      && (runA.after.mfgMetrics - runA.before.mfgMetrics) >= 1;
    const deterministicPass = JSON.stringify(runA.hashBundle) === JSON.stringify(runB.hashBundle);
    const adapterPass = (runA.p2pCsvResult?.ok === true)
      && (runA.mfgWoXlsxResult?.ok === true)
      && (runA.mfgIssueXlsxResult?.ok === true);

    log(`[D2] adapter-path result=${adapterPass ? 'PASS' : 'FAIL'} p2pCsvOk=${!!runA.p2pCsvResult?.ok} mfgWoXlsxOk=${!!runA.mfgWoXlsxResult?.ok} mfgIssueXlsxOk=${!!runA.mfgIssueXlsxResult?.ok}`);
    log(`[D2] facts-appended result=${factsAppendedPass ? 'PASS' : 'FAIL'} p2pReqDelta=${runA.after.p2pReq - runA.before.p2pReq} mfgWoDelta=${runA.after.mfgWo - runA.before.mfgWo} mfgIssueDelta=${runA.after.mfgIssue - runA.before.mfgIssue}`);
    log(`[D2] match-rebuild result=${matchPass ? 'PASS' : 'FAIL'} mfgMatchDelta=${runA.after.mfgMatch - runA.before.mfgMatch}`);
    log(`[D2] summary-formulas result=${summaryPass ? 'PASS' : 'FAIL'} mfgCoverage=${runA.summaryCoverage}`);
    log(`[D2] kpi-bindings result=${kpiPass ? 'PASS' : 'FAIL'} p2pKpiDelta=${runA.after.p2pMetrics - runA.before.p2pMetrics} mfgKpiDelta=${runA.after.mfgMetrics - runA.before.mfgMetrics}`);
    log(`[D2] determinism result=${deterministicPass ? 'PASS' : 'FAIL'} hashA=${JSON.stringify(runA.hashBundle)} hashB=${JSON.stringify(runB.hashBundle)}`);

    const pass = adapterPass && factsAppendedPass && matchPass && summaryPass && kpiPass && deterministicPass;
    log(`[D2] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);

    await page.screenshot({ path: SCREENSHOT_FILE, fullPage: true });
    log(`[D2] screenshot=archive/proofs/${path.basename(SCREENSHOT_FILE)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    log(`[D2] log=archive/proofs/${path.basename(LOG_FILE)}`);
    if (!pass) process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

main().catch(async (err) => {
  const fatal = `[D2] fatal=${err?.stack || err}`;
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

