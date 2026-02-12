import fs from 'node:fs/promises';
import path from 'node:path';
import { hashProjection } from '../core/models/ledger/ledger-v0.js';
import { computeOnHandFromPackets, computeInventoryValuationFromPackets } from '../core/models/inventory/inv-core-v0.js';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `inv-core-proof-console-${DATE_TAG}.log`);

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

const makePackets = () => ([
  {
    transferPacketId: 'TP-GR-SA-A-001',
    commitId: 'COMMIT-GR-SA-A-001',
    itemId: 'ITEM-A',
    createdAt: '2026-02-11T10:00:00.000Z',
    legs: [
      { containerRef: { id: 'container.siteA.Inventory' }, amount: 10, unit: 'quantity', reasonCode: 'GR_QTY' },
      { containerRef: { id: 'container.siteA.GRIR' }, amount: -10, unit: 'quantity', reasonCode: 'GR_QTY' },
      { containerRef: { id: 'container.siteA.Inventory' }, amount: 1000, unit: 'currency', reasonCode: 'GR_VALUE' },
      { containerRef: { id: 'container.siteA.GRIR' }, amount: -1000, unit: 'currency', reasonCode: 'GR_VALUE' }
    ]
  },
  {
    transferPacketId: 'TP-GR-SA-B-001',
    commitId: 'COMMIT-GR-SA-B-001',
    itemId: 'ITEM-B',
    createdAt: '2026-02-11T10:02:00.000Z',
    legs: [
      { containerRef: { id: 'container.siteA.Inventory' }, amount: 5, unit: 'quantity', reasonCode: 'GR_QTY' },
      { containerRef: { id: 'container.siteA.GRIR' }, amount: -5, unit: 'quantity', reasonCode: 'GR_QTY' },
      { containerRef: { id: 'container.siteA.Inventory' }, amount: 250, unit: 'currency', reasonCode: 'GR_VALUE' },
      { containerRef: { id: 'container.siteA.GRIR' }, amount: -250, unit: 'currency', reasonCode: 'GR_VALUE' }
    ]
  },
  {
    transferPacketId: 'TP-GR-SB-A-001',
    commitId: 'COMMIT-GR-SB-A-001',
    itemId: 'ITEM-A',
    createdAt: '2026-02-11T10:04:00.000Z',
    legs: [
      { containerRef: { id: 'container.siteB.Inventory' }, amount: 7, unit: 'quantity', reasonCode: 'GR_QTY' },
      { containerRef: { id: 'container.siteB.GRIR' }, amount: -7, unit: 'quantity', reasonCode: 'GR_QTY' },
      { containerRef: { id: 'container.siteB.Inventory' }, amount: 770, unit: 'currency', reasonCode: 'GR_VALUE' },
      { containerRef: { id: 'container.siteB.GRIR' }, amount: -770, unit: 'currency', reasonCode: 'GR_VALUE' }
    ]
  }
]);

const expectedOnHand = [
  { siteId: 'SITE_A', itemId: 'ITEM-A', qtyOnHand: 10 },
  { siteId: 'SITE_A', itemId: 'ITEM-B', qtyOnHand: 5 },
  { siteId: 'SITE_B', itemId: 'ITEM-A', qtyOnHand: 7 }
];

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  const packets = makePackets();

  const onHand = computeOnHandFromPackets(packets);
  const valuation = computeInventoryValuationFromPackets(packets);
  const onHandPass = JSON.stringify(onHand) === JSON.stringify(expectedOnHand);
  log(`[INV-CORE] on-hand result=${onHandPass ? 'PASS' : 'FAIL'} rows=${onHand.length}`);

  const shuffled = [packets[2], packets[0], packets[1]];
  const hashA = hashProjection({
    onHand: computeOnHandFromPackets(packets),
    valuation: computeInventoryValuationFromPackets(packets)
  });
  const hashB = hashProjection({
    onHand: computeOnHandFromPackets(shuffled),
    valuation: computeInventoryValuationFromPackets(shuffled)
  });
  const deterministic = hashA === hashB;
  log(`[INV-CORE] determinism result=${deterministic ? 'PASS' : 'FAIL'} hashA=${hashA} hashB=${hashB}`);

  const postingRulePass = packets.every((p) => {
    const invQty = p.legs.find((l) => l.containerRef?.id.includes('.Inventory') && l.unit === 'quantity');
    const grirQty = p.legs.find((l) => l.containerRef?.id.includes('.GRIR') && l.unit === 'quantity');
    return Number(invQty?.amount || 0) > 0 && Number(grirQty?.amount || 0) < 0;
  });
  log(`[INV-CORE] posting-rules result=${postingRulePass ? 'PASS' : 'FAIL'} packets=${packets.length}`);

  const pass = onHandPass && deterministic && postingRulePass;
  log(`[INV-CORE] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
  await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
  log(`[INV-CORE] log=archive/proofs/${path.basename(LOG_FILE)}`);
  if (!pass) process.exitCode = 2;
}

main().catch(async (err) => {
  const fatal = `[INV-CORE] fatal=${err?.stack || err}`;
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

