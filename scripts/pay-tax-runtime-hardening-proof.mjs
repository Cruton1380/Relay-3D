import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `pay-tax-runtime-hardening-console-${DATE_TAG}.log`);
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
  const serverLogs = [];
  const onData = (chunk) => {
    const text = String(chunk || '');
    if (!text) return;
    serverLogs.push(text);
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);

  const ready = await waitForServer(APP_URL, 60000);
  if (!ready) {
    const output = serverLogs.join('');
    child.kill('SIGINT');
    throw new Error(`DEV_SERVER_NOT_READY logs=${output.slice(-800)}`);
  }
  return { child, serverLogs };
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
      () => typeof window.relayP2PPostPAY === 'function'
        && typeof window.relayP2PCommitPAY === 'function'
        && typeof window.relayGetPaymentReconciliation === 'function'
        && typeof window.relayValidateTaxExport === 'function',
      { timeout: 120000 }
    );

    const run = await page.evaluate(() => {
      const stamp = Date.now();
      const itemId = `item.PAY_TAX_RT_${stamp}`;
      const periodId = `PERIOD-${stamp}`;

      window.RELAY_PAY_RECON_ENFORCE = true;

      const pr = window.relayP2PCreatePR({ siteId: 'SITE_A', itemId, qty: 4, unitPrice: 50 });
      const po = window.relayP2PCreatePOFromPR({ prRecord: pr, siteId: 'SITE_A', itemId, qty: 4, unitPrice: 50 });
      const inv = window.relayP2PPostINV({
        poRecord: po,
        siteId: 'SITE_A',
        itemId,
        qty: 4,
        unitPrice: 50,
        jurisdiction: '',
        taxTreatment: '',
        taxRate: 0,
        taxAmount: 0
      });
      const pay = window.relayP2PPostPAY({
        invRecord: inv,
        amount: inv.lineTotal,
        currency: 'USD',
        jurisdiction: '',
        taxTreatment: '',
        taxRate: 0,
        taxAmount: 0
      });

      const fail = window.relayP2PCommitPAY({ payRecord: pay, enforceReconciliation: true });
      const modeAfterFail = String(window.relayGetWorkMode?.().mode || 'UNKNOWN');
      const reconAfterFail = window.relayGetPaymentReconciliation({ paymentId: pay.id });

      window.relayIngestRoute('p2p.bankStatement', {
        bankLineId: `BNK-${stamp}`,
        paymentId: pay.id,
        bankAccountRef: 'BANK-OPS-001',
        amount: Number(pay.amount || 0),
        currency: String(pay.currency || 'USD'),
        statementDate: new Date().toISOString().slice(0, 10),
        status: 'POSTED',
        entrySource: 'relay-form',
        sourceId: `BNK-${pay.id}`,
        eventTimestamp: new Date().toISOString()
      });

      const pass = window.relayP2PCommitPAY({ payRecord: pay, enforceReconciliation: true });
      const reconAfterPass = window.relayGetPaymentReconciliation({ paymentId: pay.id });

      const taxA = window.relayValidateTaxExport(periodId, 'json');
      const taxB = window.relayValidateTaxExport(periodId, 'json');

      return {
        payId: String(pay.id || ''),
        failReason: String(fail?.reason || ''),
        failOk: !!fail?.ok,
        modeAfterFail,
        reconFailStatus: String(reconAfterFail?.status || ''),
        passOk: !!pass?.ok,
        passCommitId: String(pass?.commitId || ''),
        reconPassStatus: String(reconAfterPass?.status || ''),
        taxInvalidCount: Number(taxA?.invalidCount || 0),
        taxHashA: String(taxA?.hash || ''),
        taxHashB: String(taxB?.hash || '')
      };
    });

    const refusalPass = run.failOk === false && run.failReason === 'PAY_RECON_FAIL' && run.modeAfterFail === 'HOLD';
    const matchedPass = run.passOk === true && !!run.passCommitId && run.reconPassStatus === 'MATCHED';
    const taxInvalidPass = run.taxInvalidCount >= 1;
    const taxDeterministicPass = run.taxHashA === run.taxHashB && run.taxHashA.length > 0;

    log(`[PAY-CORE] runtime-guard refusal-path result=${refusalPass ? 'PASS' : 'FAIL'} reason=${run.failReason || 'none'} modeAfterFail=${run.modeAfterFail} recon=${run.reconFailStatus}`);
    log(`[PAY-CORE] runtime-guard matched-commit result=${matchedPass ? 'PASS' : 'FAIL'} paymentId=${run.payId} commitId=${run.passCommitId || 'none'} recon=${run.reconPassStatus}`);
    log(`[TAX0] runtime-validate invalid-detect result=${taxInvalidPass ? 'PASS' : 'FAIL'} invalidCount=${run.taxInvalidCount}`);
    log(`[TAX0] runtime-validate determinism result=${taxDeterministicPass ? 'PASS' : 'FAIL'} hashA=${run.taxHashA} hashB=${run.taxHashB}`);

    const pass = refusalPass && matchedPass && taxInvalidPass && taxDeterministicPass;
    log(`[PAY-TAX] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    log(`[PAY-TAX] log=archive/proofs/${path.basename(LOG_FILE)}`);
    if (!pass) process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server?.child) await stopDevServer(server.child);
  }
}

main().catch(async (err) => {
  const fatal = `[PAY-TAX] fatal=${err?.stack || err}`;
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

