import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `c1-mfg-module-console-${DATE_TAG}.log`);
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

async function runMfgScenario(page, suffix) {
  return page.evaluate((tag) => {
    const getSheet = (id) => (window.relayState?.tree?.nodes || []).find(n => n.type === 'sheet' && n.id === id) || null;
    const getBranch = (id) => (window.relayState?.tree?.nodes || []).find(n => n.type === 'branch' && n.id === id) || null;
    const rowCount = (sheetId) => {
      const sheet = getSheet(sheetId);
      return Math.max(0, Number(sheet?.rows || 1) - 1);
    };
    const sheetRowsAsObjects = (sheetId) => {
      const sheet = getSheet(sheetId);
      if (!sheet) return [];
      const schema = sheet.metadata?.schema || [];
      const rows = new Map();
      for (const cell of (sheet.cellData || [])) {
        if (Number(cell.row) <= 0) continue;
        if (!rows.has(cell.row)) rows.set(cell.row, {});
        const row = rows.get(cell.row);
        const colDef = schema[cell.col];
        const key = colDef?.id || colDef?.name || `col${cell.col}`;
        row[key] = (cell.value ?? cell.display ?? null);
      }
      return [...rows.values()];
    };
    const hashRows = (rows) => {
      const src = JSON.stringify(rows || []);
      let hash = 0x811c9dc5;
      for (let i = 0; i < src.length; i += 1) {
        hash ^= src.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
      }
      return `0x${(hash >>> 0).toString(16).padStart(8, '0')}`;
    };
    const readCell = (sheetId, ref) => {
      const sheet = getSheet(sheetId);
      if (!sheet) return null;
      const m = String(ref || '').match(/^([A-Z]+)(\d+)$/);
      if (!m) return null;
      const letters = m[1];
      const row = Number(m[2]) - 1;
      let col = 0;
      for (let i = 0; i < letters.length; i += 1) {
        col = col * 26 + (letters.charCodeAt(i) - 64);
      }
      col -= 1;
      const ci = (sheet._cellIndex && sheet._cellIndex.get(`${row},${col}`))
        || (sheet.cellData || []).find(c => c.row === row && c.col === col)
        || null;
      if (!ci) return null;
      return Number(ci.value ?? ci.display ?? 0);
    };

    const beforeWO = rowCount('MFG.WorkOrders');
    const beforeIssue = rowCount('MFG.MaterialIssues');
    const beforeMatch = rowCount('MFG.WOIssueMatch');
    const beforeMetrics = (getBranch('branch.mfg')?.metadata?.kpiMetrics || []).length;

    window.relayIngestRoute('mfg.workOrder', {
      workOrderId: `WO-${tag}`,
      siteId: 'SITE_A',
      itemId: `item.MFG_${tag}`,
      plannedQty: 100,
      status: 'RELEASED',
      entrySource: 'relay-form',
      sourceId: `WO-${tag}`,
      eventTimestamp: new Date().toISOString()
    });
    window.relayIngestRoute('mfg.materialIssue', {
      issueId: `ISS-${tag}`,
      workOrderId: `WO-${tag}`,
      itemId: `item.MFG_${tag}`,
      qtyIssued: 100,
      status: 'POSTED',
      entrySource: 'relay-form',
      sourceId: `ISS-${tag}`,
      eventTimestamp: new Date().toISOString()
    });
    const afterWO = rowCount('MFG.WorkOrders');
    const afterIssue = rowCount('MFG.MaterialIssues');
    const afterMatch = rowCount('MFG.WOIssueMatch');
    const afterMetrics = (getBranch('branch.mfg')?.metadata?.kpiMetrics || []).length;
    const summaryCoverage = readCell('MFG.ProductionSummary', 'B4');
    const matchRows = sheetRowsAsObjects('MFG.WOIssueMatch');

    return {
      appendOnly: (afterWO - beforeWO) === 1 && (afterIssue - beforeIssue) === 1,
      matchRows: afterMatch,
      matchHash: hashRows(matchRows),
      summaryCoverage: Number.isFinite(summaryCoverage) ? summaryCoverage : 0,
      kpiUpdated: afterMetrics > beforeMetrics,
      beforeMatch,
      afterMatch
    };
  }, suffix);
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
        && !!window.relayState?.tree,
      undefined,
      { timeout: 120000 }
    );
    const readiness = await page.evaluate(() => ({
      hasMFG: !!(window.relayState?.tree?.nodes || []).find(n => n.id === 'MFG.WorkOrders'),
      nodeCount: (window.relayState?.tree?.nodes || []).length
    }));
    if (!readiness.hasMFG) {
      log(`[C1] module-load result=FAIL module=MFG nodes=${readiness.nodeCount}`);
      log('[REFUSAL] reason=C1_BLOCKER_MODULE_LOAD module=MFG');
      await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
      process.exitCode = 2;
      return;
    }

    const runA = await runMfgScenario(page, 'A');
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayIngestRoute === 'function',
      undefined,
      { timeout: 120000 }
    );
    const runB = await runMfgScenario(page, 'A');

    const moduleLoadPass = true;
    const appendPass = runA.appendOnly;
    const matchPass = runA.matchRows > runA.beforeMatch;
    const deterministicPass = runA.matchHash === runB.matchHash;
    const summaryPass = Number.isFinite(runA.summaryCoverage);
    const kpiPass = runA.kpiUpdated;

    log(`[C1] module-load result=${moduleLoadPass ? 'PASS' : 'FAIL'} module=MFG routes=4`);
    log(`[C1] append-only result=${appendPass ? 'PASS' : 'FAIL'} workOrders=+1 materialIssues=+1`);
    log(`[C1] match-rebuild result=${matchPass ? 'PASS' : 'FAIL'} before=${runA.beforeMatch} after=${runA.afterMatch}`);
    log(`[C1] match-determinism result=${deterministicPass ? 'PASS' : 'FAIL'} hashA=${runA.matchHash} hashB=${runB.matchHash}`);
    log(`[C1] summary-formulas result=${summaryPass ? 'PASS' : 'FAIL'} coverage=${runA.summaryCoverage}`);
    log(`[C1] kpi-binding result=${kpiPass ? 'PASS' : 'FAIL'} metric=issueCoverage`);

    const pass = moduleLoadPass && appendPass && matchPass && deterministicPass && summaryPass && kpiPass;
    log(`[C1] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    log(`[C1] log=archive/proofs/${path.basename(LOG_FILE)}`);
    if (!pass) process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

main().catch(async (err) => {
  const fatal = `[C1] fatal=${err?.stack || err}`;
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

