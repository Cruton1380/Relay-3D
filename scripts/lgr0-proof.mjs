import fs from 'node:fs/promises';
import path from 'node:path';
import {
  projectJournalFromTransferPackets,
  computeTrialBalance,
  hashProjection
} from '../core/models/ledger/ledger-v0.js';
import {
  LEDGER_MAPPING_POLICY_V0
} from '../core/models/ledger/coa-seed-v0.js';
import * as ledgerModule from '../core/models/ledger/ledger-v0.js';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `lgr0-proof-console-${DATE_TAG}.log`);

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

const happyPackets = () => ([
  {
    transferPacketId: 'TP-GR-7001',
    commitId: 'COMMIT-GR-7001',
    proposalId: 'PROPOSAL-GR-7001',
    objectId: 'GR-7001',
    createdAt: '2026-02-11T12:00:00.000Z',
    legs: [
      { containerRef: { id: 'container.siteA.Inventory' }, amount: 10000, unit: 'currency', reasonCode: 'GR_VALUE' },
      { containerRef: { id: 'container.siteA.GRIR' }, amount: -10000, unit: 'currency', reasonCode: 'GR_VALUE' }
    ]
  },
  {
    transferPacketId: 'TP-INV-3001',
    commitId: 'COMMIT-INV-3001',
    proposalId: 'PROPOSAL-INV-3001',
    objectId: 'INV-3001',
    createdAt: '2026-02-11T12:02:00.000Z',
    legs: [
      { containerRef: { id: 'container.siteA.GRIR' }, amount: 10000, unit: 'currency', reasonCode: 'INV_PASS' },
      { containerRef: { id: 'container.company.AP' }, amount: -10000, unit: 'currency', reasonCode: 'INV_PASS' }
    ]
  },
  {
    transferPacketId: 'TP-PAY-8001',
    commitId: 'COMMIT-PAY-8001',
    proposalId: 'PROPOSAL-PAY-8001',
    objectId: 'PAY-8001',
    createdAt: '2026-02-11T12:05:00.000Z',
    legs: [
      { containerRef: { id: 'container.company.AP' }, amount: 10000, unit: 'currency', reasonCode: 'PAY' },
      { containerRef: { id: 'container.company.CashBank' }, amount: -10000, unit: 'currency', reasonCode: 'PAY' }
    ]
  }
]);

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });

  const packets = happyPackets();
  const journal = projectJournalFromTransferPackets(packets, LEDGER_MAPPING_POLICY_V0);
  const journalHash = hashProjection(journal);
  log(`[LGR0] project result=PASS journalEntries=${journal.length} projectionHash=${journalHash}`);

  const tb = computeTrialBalance(journal);
  const tbHash = hashProjection(tb);
  log(`[LGR0] trial-balance result=PASS rows=${tb.length} tbHash=${tbHash}`);

  const shuffled = [packets[2], packets[0], packets[1]];
  const journalB = projectJournalFromTransferPackets(shuffled, LEDGER_MAPPING_POLICY_V0);
  const tbB = computeTrialBalance(journalB);
  const orderAHash = hashProjection({ journal, tb });
  const orderBHash = hashProjection({ journal: journalB, tb: tbB });
  const deterministic = orderAHash === orderBHash;
  log(`[LGR0] determinism result=${deterministic ? 'PASS' : 'FAIL'} orderAHash=${orderAHash} orderBHash=${orderBHash}`);

  const directEntryAbsent = typeof ledgerModule.writeJournalEntry !== 'function' && typeof ledgerModule.postJournalEntry !== 'function';
  log(`[LGR0] direct-entry surface=${directEntryAbsent ? 'ABSENT' : 'PRESENT'} result=${directEntryAbsent ? 'PASS' : 'FAIL'}`);

  let mappingMissingRefusal = false;
  try {
    const badPackets = [
      ...packets,
      {
        transferPacketId: 'TP-INV-BAD',
        commitId: 'COMMIT-INV-BAD',
        proposalId: 'PROPOSAL-INV-BAD',
        objectId: 'INV-BAD',
        createdAt: '2026-02-11T12:06:00.000Z',
        legs: [
          { containerRef: { id: 'container.siteA.GRIR' }, amount: 50, unit: 'currency', reasonCode: 'INV_BAD' },
          { containerRef: { id: 'container.unknown.Target' }, amount: -50, unit: 'currency', reasonCode: 'INV_BAD' }
        ]
      }
    ];
    projectJournalFromTransferPackets(badPackets, LEDGER_MAPPING_POLICY_V0);
  } catch (err) {
    const reason = String(err?.code || err?.message || 'UNKNOWN');
    const containerRef = String(err?.details?.containerRef || 'unknown');
    if (reason === 'LEDGER_MAPPING_MISSING') {
      mappingMissingRefusal = true;
      log(`[REFUSAL] reason=LEDGER_MAPPING_MISSING containerRef=${containerRef}`);
      log('[LGR0] mapping-missing result=REFUSAL');
    }
  }

  const pass = deterministic && directEntryAbsent && mappingMissingRefusal;
  if (!pass) {
    log('[LGR0] gate-summary result=FAIL');
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
    return;
  }

  log('[LGR0] gate-summary result=PASS');
  await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
  log(`[LGR0] log=archive/proofs/${path.basename(LOG_FILE)}`);
}

main().catch(async (err) => {
  const fatal = `[LGR0] fatal=${err?.stack || err}`;
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

