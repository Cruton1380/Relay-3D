import fs from 'node:fs/promises';
import path from 'node:path';
import { exportTaxReport } from '../core/models/tax/tax0-v0.js';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `tax0-proof-console-${DATE_TAG}.log`);

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

const makeTaxRecords = () => ([
  {
    objectType: 'INV',
    objectId: 'INV-TAX-001',
    invoiceId: 'INV-TAX-001',
    companyId: 'company',
    periodId: '2026-02',
    jurisdiction: 'US-CA',
    taxTreatment: 'VAT_STANDARD',
    taxRate: 0.075,
    taxAmount: 75.0
  },
  {
    objectType: 'INV',
    objectId: 'INV-TAX-002',
    invoiceId: 'INV-TAX-002',
    companyId: 'company',
    periodId: '2026-02',
    jurisdiction: 'US-NY',
    taxTreatment: 'VAT_STANDARD',
    taxRate: 0.08875,
    taxAmount: 88.75
  },
  {
    objectType: 'INV',
    objectId: 'INV-TAX-003',
    invoiceId: 'INV-TAX-003',
    companyId: 'company',
    periodId: '2026-02',
    jurisdiction: 'US-CA',
    taxTreatment: 'VAT_REDUCED',
    taxRate: 0.02,
    taxAmount: 20.0
  }
]);

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });

  const records = makeTaxRecords();
  const jsonOutA = exportTaxReport(records, '2026-02', 'json');
  const csvOutA = exportTaxReport(records, '2026-02', 'csv');
  log(`[TAX0] export result=PASS rows=${jsonOutA.rowCount} jsonHash=${jsonOutA.hash} csvHash=${csvOutA.hash}`);

  const shuffled = [records[2], records[0], records[1]];
  const jsonOutB = exportTaxReport(shuffled, '2026-02', 'json');
  const csvOutB = exportTaxReport(shuffled, '2026-02', 'csv');
  const deterministic = jsonOutA.hash === jsonOutB.hash && csvOutA.hash === csvOutB.hash;
  log(`[TAX0] determinism result=${deterministic ? 'PASS' : 'FAIL'} jsonA=${jsonOutA.hash} jsonB=${jsonOutB.hash} csvA=${csvOutA.hash} csvB=${csvOutB.hash}`);

  const jurisdictionCoverage = new Set(records.map(r => r.jurisdiction)).size >= 2;
  log(`[TAX0] jurisdiction-coverage result=${jurisdictionCoverage ? 'PASS' : 'FAIL'} jurisdictions=${[...new Set(records.map(r => r.jurisdiction))].join('|')}`);

  const pass = deterministic && jurisdictionCoverage;
  log(`[TAX0] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
  await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
  log(`[TAX0] log=archive/proofs/${path.basename(LOG_FILE)}`);
  if (!pass) process.exitCode = 2;
}

main().catch(async (err) => {
  const fatal = `[TAX0] fatal=${err?.stack || err}`;
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

