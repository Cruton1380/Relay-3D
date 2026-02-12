import fs from 'node:fs/promises';
import path from 'node:path';
import {
  projectJournalFromTransferPackets,
  computeTrialBalance,
  hashProjection
} from '../core/models/ledger/ledger-v0.js';
import { LEDGER_MAPPING_POLICY_V0 } from '../core/models/ledger/coa-seed-v0.js';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `d1-ledger-gate-console-${DATE_TAG}.log`);

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

const lcg = (seed = 123456789) => {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const generateDeterministicPackets = (count = 1000) => {
  const rnd = lcg(20260211);
  const packets = [];
  for (let i = 0; i < count; i += 1) {
    const cents = 100 + Math.floor(rnd() * 900000); // 1.00..9000.00
    const amount = Number((cents / 100).toFixed(2));
    const kind = i % 3;
    const base = {
      transferPacketId: `TP-D1-${String(i + 1).padStart(4, '0')}`,
      commitId: `COMMIT-D1-${String(i + 1).padStart(4, '0')}`,
      proposalId: `PROPOSAL-D1-${String(i + 1).padStart(4, '0')}`,
      objectId: `OBJ-D1-${String(i + 1).padStart(4, '0')}`,
      createdAt: `2026-02-11T12:${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}.000Z`
    };

    if (kind === 0) {
      packets.push({
        ...base,
        legs: [
          { containerRef: { id: 'container.siteA.Inventory' }, amount, unit: 'currency', reasonCode: 'GR_VALUE' },
          { containerRef: { id: 'container.siteA.GRIR' }, amount: -amount, unit: 'currency', reasonCode: 'GR_VALUE' }
        ]
      });
    } else if (kind === 1) {
      packets.push({
        ...base,
        legs: [
          { containerRef: { id: 'container.siteA.GRIR' }, amount, unit: 'currency', reasonCode: 'INV_PASS' },
          { containerRef: { id: 'container.company.AP' }, amount: -amount, unit: 'currency', reasonCode: 'INV_PASS' }
        ]
      });
    } else {
      packets.push({
        ...base,
        legs: [
          { containerRef: { id: 'container.company.AP' }, amount, unit: 'currency', reasonCode: 'PAY' },
          { containerRef: { id: 'container.company.CashBank' }, amount: -amount, unit: 'currency', reasonCode: 'PAY' }
        ]
      });
    }
  }
  return packets;
};

const checkPacketBalance = (packet) => {
  const sums = new Map();
  for (const leg of packet.legs || []) {
    const unit = String(leg.unit || '').toLowerCase();
    sums.set(unit, Number(sums.get(unit) || 0) + Number(leg.amount || 0));
  }
  for (const sum of sums.values()) {
    if (Math.abs(sum) > 1e-9) return false;
  }
  return true;
};

const checkJournalBalanced = (journalEntries) => {
  const sums = new Map();
  for (const je of journalEntries) {
    const key = `${je.sourceTransferPacketId}|${je.unit}`;
    if (!sums.has(key)) sums.set(key, { debit: 0, credit: 0 });
    const row = sums.get(key);
    row.debit += Number(je.debit || 0);
    row.credit += Number(je.credit || 0);
  }
  for (const row of sums.values()) {
    if (Math.abs(row.debit - row.credit) > 1e-9) return false;
  }
  return true;
};

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  const packets = generateDeterministicPackets(1000);

  const allPacketsBalanced = packets.every(checkPacketBalance);
  log(`[D1] packet-balance result=${allPacketsBalanced ? 'PASS' : 'FAIL'} packets=${packets.length}`);
  if (!allPacketsBalanced) {
    log('[REFUSAL] reason=D1_PACKET_UNBALANCED');
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
    return;
  }

  const journalA = projectJournalFromTransferPackets(packets, LEDGER_MAPPING_POLICY_V0);
  const trialBalanceA = computeTrialBalance(journalA);
  const journalBalanced = checkJournalBalanced(journalA);
  log(`[D1] journal-balance result=${journalBalanced ? 'PASS' : 'FAIL'} journalEntries=${journalA.length}`);
  if (!journalBalanced) {
    log('[REFUSAL] reason=D1_JOURNAL_UNBALANCED');
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
    return;
  }

  const journalB = projectJournalFromTransferPackets([...packets].reverse(), LEDGER_MAPPING_POLICY_V0);
  const trialBalanceB = computeTrialBalance(journalB);
  const hashA = hashProjection({ journal: journalA, trialBalance: trialBalanceA });
  const hashB = hashProjection({ journal: journalB, trialBalance: trialBalanceB });
  const deterministic = hashA === hashB;
  log(`[D1] determinism result=${deterministic ? 'PASS' : 'FAIL'} hashA=${hashA} hashB=${hashB}`);

  const linkCoverage = journalA.every((je) => String(je.sourceTransferPacketId || '').length > 0 && String(je.commitId || '').length > 0);
  log(`[D1] linkage result=${linkCoverage ? 'PASS' : 'FAIL'} sourceTransferPacketId=REQUIRED commitId=REQUIRED`);
  if (!deterministic || !linkCoverage) {
    log('[REFUSAL] reason=D1_GATE_FAILED');
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
    return;
  }

  log(`[D1] gate result=PASS packets=${packets.length} journalEntries=${journalA.length} trialBalanceRows=${trialBalanceA.length}`);
  await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
  log(`[D1] log=archive/proofs/${path.basename(LOG_FILE)}`);
}

main().catch(async (err) => {
  const fatal = `[D1] fatal=${err?.stack || err}`;
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

