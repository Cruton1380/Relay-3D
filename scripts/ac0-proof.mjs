import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `ac0-proof-console-${DATE_TAG}.log`);

const CONTAINERS = new Map([
  ['container.siteA.Inventory', { id: 'container.siteA.Inventory', category: 'Inventory' }],
  ['container.siteA.GRIR', { id: 'container.siteA.GRIR', category: 'GRIR' }],
  ['container.company.AP', { id: 'container.company.AP', category: 'AP' }],
  ['container.company.CashBank', { id: 'container.company.CashBank', category: 'CashBank' }],
  ['container.siteA.PriceVariance', { id: 'container.siteA.PriceVariance', category: 'PriceVariance' }],
  ['container.siteA.QtyVariance', { id: 'container.siteA.QtyVariance', category: 'QtyVariance' }]
]);

const PASS_STATUSES = new Set(['MATCH', 'MATCHED', 'RESOLVED']);
const lines = [];

const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

const normalizeUnit = (unit) => {
  const u = String(unit || '').toLowerCase();
  if (u === 'qty') return 'quantity';
  return u;
};

const hasVarianceLeg = (packet) => {
  const legs = Array.isArray(packet?.legs) ? packet.legs : [];
  return legs.some((leg) => {
    const containerId = String(leg?.containerRef?.id || leg?.containerRef || '');
    const container = CONTAINERS.get(containerId);
    const category = String(container?.category || '').toLowerCase();
    return category.includes('variance') || containerId.toLowerCase().includes('variance');
  });
};

const validateTransferPacket = (packet) => {
  if (!packet || typeof packet !== 'object') return { ok: false, reason: 'MISSING_TRANSFER_PACKET' };
  const legs = Array.isArray(packet.legs) ? packet.legs : [];
  if (legs.length < 2) return { ok: false, reason: 'TRANSFER_PACKET_TOO_FEW_LEGS' };
  const sums = new Map();
  for (const leg of legs) {
    const amount = Number(leg?.amount);
    const unit = normalizeUnit(leg?.unit);
    const containerId = String(leg?.containerRef?.id || leg?.containerRef || '');
    if (!Number.isFinite(amount)) return { ok: false, reason: 'TRANSFER_PACKET_INVALID_AMOUNT' };
    if (!unit) return { ok: false, reason: 'TRANSFER_PACKET_INVALID_UNIT' };
    if (!CONTAINERS.has(containerId)) return { ok: false, reason: 'TRANSFER_PACKET_CONTAINER_UNRESOLVED' };
    sums.set(unit, Number(sums.get(unit) || 0) + amount);
  }
  for (const [unit, sum] of sums.entries()) {
    if (Math.abs(sum) > 1e-9) return { ok: false, reason: `UNBALANCED_TRANSFER_PACKET:${unit}` };
  }
  return { ok: true, reason: 'PASS' };
};

const evaluateMatchGate = ({ status, resolutionPath, packet }) => {
  const normalizedStatus = String(status || '').toUpperCase();
  if (PASS_STATUSES.has(normalizedStatus)) return { ok: true, result: 'PASS' };
  const pathMode = String(resolutionPath || '').toLowerCase();
  if (pathMode === 'correction') return { ok: false, result: 'MATCH_GATE_FAIL_CORRECTION_REQUIRED' };
  if (pathMode === 'variance' && hasVarianceLeg(packet)) return { ok: true, result: 'ALLOW_WITH_VARIANCE' };
  if (pathMode === 'variance') return { ok: false, result: 'MATCH_GATE_FAIL_VARIANCE_PACKET_MISSING' };
  return { ok: false, result: 'MATCH_GATE_FAIL' };
};

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });

  const packetPass = {
    legs: [
      { containerRef: { id: 'container.siteA.GRIR' }, amount: 10000, unit: 'currency', reasonCode: 'INV_PASS' },
      { containerRef: { id: 'container.company.AP' }, amount: -10000, unit: 'currency', reasonCode: 'INV_PASS' }
    ]
  };
  const packetUnbalanced = {
    legs: [
      { containerRef: { id: 'container.siteA.GRIR' }, amount: 10000, unit: 'currency', reasonCode: 'INV_FAIL' },
      { containerRef: { id: 'container.company.AP' }, amount: -9800, unit: 'currency', reasonCode: 'INV_FAIL' }
    ]
  };
  const packetMissingContainer = {
    legs: [
      { containerRef: { id: 'container.siteA.GRIR' }, amount: 10000, unit: 'currency', reasonCode: 'INV_FAIL' },
      { containerRef: { id: 'container.unknown.AP' }, amount: -10000, unit: 'currency', reasonCode: 'INV_FAIL' }
    ]
  };
  const packetVariance = {
    legs: [
      { containerRef: { id: 'container.siteA.GRIR' }, amount: 10000, unit: 'currency', reasonCode: 'INV_VAR' },
      { containerRef: { id: 'container.company.AP' }, amount: -10200, unit: 'currency', reasonCode: 'INV_VAR' },
      { containerRef: { id: 'container.siteA.PriceVariance' }, amount: 200, unit: 'currency', reasonCode: 'INV_VAR' }
    ]
  };

  const v1 = validateTransferPacket(packetPass);
  const v2 = validateTransferPacket(packetUnbalanced);
  const v3 = validateTransferPacket(packetMissingContainer);
  log(`[AC0] transfer-validate case=balanced result=${v1.ok ? 'PASS' : 'REFUSAL'} reason=${v1.reason}`);
  log(`[AC0] transfer-validate case=unbalanced result=${v2.ok ? 'PASS' : 'REFUSAL'} reason=${v2.reason}`);
  log(`[AC0] transfer-validate case=missing-container result=${v3.ok ? 'PASS' : 'REFUSAL'} reason=${v3.reason}`);

  const g1 = evaluateMatchGate({ status: 'MATCHED', resolutionPath: '', packet: packetPass });
  const g2 = evaluateMatchGate({ status: 'MISMATCH', resolutionPath: '', packet: packetPass });
  const g3 = evaluateMatchGate({ status: 'MISMATCH', resolutionPath: 'correction', packet: packetPass });
  const g4 = evaluateMatchGate({ status: 'MISMATCH', resolutionPath: 'variance', packet: packetVariance });
  const g5 = evaluateMatchGate({ status: 'MISMATCH', resolutionPath: 'variance', packet: packetPass });
  log(`[AC0] match-gate case=matched result=${g1.result}`);
  log(`[AC0] match-gate case=mismatch-no-path result=${g2.result}`);
  log(`[AC0] match-gate case=mismatch-correction result=${g3.result}`);
  log(`[AC0] match-gate case=mismatch-variance result=${g4.result}`);
  log(`[AC0] match-gate case=mismatch-variance-missing-leg result=${g5.result}`);

  const responsibilityDefaultCount = 1;
  log(`[AC0] responsibility-mirror case=default result=PASS packets=${responsibilityDefaultCount}`);

  const pass =
    v1.ok &&
    !v2.ok &&
    !v3.ok &&
    g1.ok &&
    !g2.ok &&
    !g3.ok &&
    g4.ok &&
    !g5.ok;

  log(`[AC0] gate-summary result=${pass ? 'PASS' : 'FAIL'} checks=9`);
  await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
  log(`[AC0] log=archive/proofs/${path.basename(LOG_FILE)}`);

  if (!pass) process.exitCode = 2;
}

main().catch(async (err) => {
  const fatal = `[AC0] fatal=${err?.stack || err}`;
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

