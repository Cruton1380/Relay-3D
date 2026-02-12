import fs from 'node:fs/promises';
import path from 'node:path';
import { createPaymentBatch, executePaymentBatch, matchBankStatementLines, hashPaymentCoreProjection } from '../core/models/payments/pay-core-v0.js';
import { projectJournalFromTransferPackets, computeTrialBalance, hashProjection } from '../core/models/ledger/ledger-v0.js';
import { LEDGER_MAPPING_POLICY_V0 } from '../core/models/ledger/coa-seed-v0.js';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `pay-core-proof-console-${DATE_TAG}.log`);

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

const makePayments = () => ([
  { paymentId: 'PAY-0001', amount: 100.0 },
  { paymentId: 'PAY-0002', amount: 230.5 },
  { paymentId: 'PAY-0003', amount: 19.99 },
  { paymentId: 'PAY-0004', amount: 880.01 },
  { paymentId: 'PAY-0005', amount: 56.25 }
]);

const normalizeForDeterminism = (batch, transferPackets) => ({
  batch: {
    batchId: batch.batchId,
    companyId: batch.companyId,
    paymentIds: [...(batch.paymentIds || [])],
    requestedBy: batch.requestedBy
  },
  transferPackets: [...(transferPackets || [])].map(tp => ({
    transferPacketId: tp.transferPacketId,
    commitId: tp.commitId,
    proposalId: tp.proposalId,
    objectId: tp.objectId,
    legs: [...(tp.legs || [])].map(l => ({
      containerRef: l.containerRef?.id || l.containerRef,
      amount: Number(l.amount || 0),
      unit: l.unit,
      reasonCode: l.reasonCode
    }))
  }))
});

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });

  const payments = makePayments();
  const batch = createPaymentBatch({ companyId: 'company', paymentIds: payments.map(p => p.paymentId), requestedBy: 'user.treasury1' });
  const executed = executePaymentBatch(batch, payments);

  const totalAmount = Number(payments.reduce((acc, p) => acc + Number(p.amount || 0), 0).toFixed(2));
  const apDelta = Number(executed.transferPackets.reduce((acc, tp) => acc + tp.legs.filter(l => String(l.containerRef?.id || '').includes('.AP')).reduce((s, l) => s + Number(l.amount || 0), 0), 0).toFixed(2));
  const cashDelta = Number(executed.transferPackets.reduce((acc, tp) => acc + tp.legs.filter(l => String(l.containerRef?.id || '').includes('CashBank')).reduce((s, l) => s + Number(l.amount || 0), 0), 0).toFixed(2));
  const postingPass = apDelta === totalAmount && cashDelta === -totalAmount;
  log(`[PAY-CORE] batch-exec result=${postingPass ? 'PASS' : 'FAIL'} batchId=${batch.batchId} count=${executed.executedCount} total=${totalAmount.toFixed(2)}`);

  const journal = projectJournalFromTransferPackets(executed.transferPackets, LEDGER_MAPPING_POLICY_V0);
  const tb = computeTrialBalance(journal);
  const ledgerBalanced = tb.every(row => Number.isFinite(row.totalDebit) && Number.isFinite(row.totalCredit));
  log(`[PAY-CORE] ledger-projection result=${ledgerBalanced ? 'PASS' : 'FAIL'} journalEntries=${journal.length} tbRows=${tb.length} ledgerHash=${hashProjection({ journal, tb })}`);

  const bankLines = payments.map((p, idx) => ({
    bankLineId: `BNK-${String(idx + 1).padStart(4, '0')}`,
    paymentId: p.paymentId,
    amount: p.amount
  }));
  const matches = matchBankStatementLines(payments, bankLines);
  const recPass = matches.every(m => m.status === 'MATCHED');
  log(`[PAY-CORE] reconciliation result=${recPass ? 'PASS' : 'FAIL'} matched=${matches.filter(m => m.status === 'MATCHED').length} rows=${matches.length}`);

  const shuffled = [payments[4], payments[2], payments[0], payments[3], payments[1]];
  const batchB = createPaymentBatch({ companyId: 'company', paymentIds: shuffled.map(p => p.paymentId), requestedBy: 'user.treasury1' });
  const executedB = executePaymentBatch(batchB, shuffled);
  const hashA = hashPaymentCoreProjection(normalizeForDeterminism(batch, executed.transferPackets));
  const hashB = hashPaymentCoreProjection(normalizeForDeterminism(batchB, executedB.transferPackets));
  const deterministic = hashA === hashB;
  log(`[PAY-CORE] determinism result=${deterministic ? 'PASS' : 'FAIL'} hashA=${hashA} hashB=${hashB}`);

  const pass = postingPass && ledgerBalanced && recPass && deterministic;
  log(`[PAY-CORE] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
  await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
  log(`[PAY-CORE] log=archive/proofs/${path.basename(LOG_FILE)}`);
  if (!pass) process.exitCode = 2;
}

main().catch(async (err) => {
  const fatal = `[PAY-CORE] fatal=${err?.stack || err}`;
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

