const toDecimalString = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  const fixed = value.toFixed(6);
  return fixed.replace(/\.?0+$/, '');
};

const canonicalize = (input) => {
  if (input === null || typeof input === 'undefined') return null;
  if (typeof input === 'number') return toDecimalString(input);
  if (typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(canonicalize);
  const out = {};
  for (const key of Object.keys(input).sort()) {
    out[key] = canonicalize(input[key]);
  }
  return out;
};

const stableStringify = (value) => JSON.stringify(canonicalize(value));

const fnv1aHex = (text) => {
  let hash = 0x811c9dc5;
  const src = String(text || '');
  for (let i = 0; i < src.length; i += 1) {
    hash ^= src.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `0x${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

const hashCanonical = (value) => fnv1aHex(stableStringify(value));

const normalizeContainerRef = (containerRef) => {
  if (!containerRef) return '';
  if (typeof containerRef === 'string') return containerRef;
  return String(containerRef.id || '');
};

const projectLedger = (transferPackets, containerAccountMap) => {
  const entries = [];
  const sortedPackets = [...(transferPackets || [])].sort((a, b) => String(a.transferPacketId || '').localeCompare(String(b.transferPacketId || '')));
  for (const packet of sortedPackets) {
    const sums = new Map();
    const legs = Array.isArray(packet.legs) ? packet.legs : [];
    for (const leg of legs) {
      const amount = Number(leg?.amount || 0);
      const unit = String(leg?.unit || '').toLowerCase();
      sums.set(unit, Number(sums.get(unit) || 0) + amount);
    }
    for (const [unit, sum] of sums.entries()) {
      if (Math.abs(sum) > 1e-9) {
        const err = new Error('LEDGER_PACKET_INVALID');
        err.code = 'LEDGER_PACKET_INVALID';
        err.details = { transferPacketId: packet.transferPacketId, unit, sum };
        throw err;
      }
    }
    for (const leg of legs) {
      const containerRef = normalizeContainerRef(leg.containerRef);
      const accountId = containerAccountMap[containerRef] || null;
      if (!accountId) {
        const err = new Error('LEDGER_MAPPING_MISSING');
        err.code = 'LEDGER_MAPPING_MISSING';
        err.details = { containerRef };
        throw err;
      }
      const amount = Number(leg.amount || 0);
      const abs = Math.abs(amount);
      entries.push({
        sourceTransferPacketId: String(packet.transferPacketId || ''),
        commitId: String(packet.commitId || ''),
        accountId,
        unit: String(leg.unit || '').toLowerCase(),
        debit: amount >= 0 ? abs : 0,
        credit: amount < 0 ? abs : 0
      });
    }
  }

  entries.sort((a, b) => {
    const ak = `${a.sourceTransferPacketId}|${a.accountId}|${a.unit}|${a.debit}|${a.credit}`;
    const bk = `${b.sourceTransferPacketId}|${b.accountId}|${b.unit}|${b.debit}|${b.credit}`;
    return ak.localeCompare(bk);
  });

  const byPacket = new Map();
  for (const e of entries) {
    const key = `${e.sourceTransferPacketId}|${e.unit}`;
    if (!byPacket.has(key)) byPacket.set(key, { debit: 0, credit: 0 });
    const row = byPacket.get(key);
    row.debit += Number(e.debit || 0);
    row.credit += Number(e.credit || 0);
  }
  for (const [key, row] of byPacket.entries()) {
    if (Math.abs(row.debit - row.credit) > 1e-9) {
      const err = new Error('LEDGER_JE_UNBALANCED');
      err.code = 'LEDGER_JE_UNBALANCED';
      err.details = { key, debit: row.debit, credit: row.credit };
      throw err;
    }
  }

  const tbMap = new Map();
  for (const e of entries) {
    const key = `${e.accountId}|${e.unit}`;
    if (!tbMap.has(key)) tbMap.set(key, { accountId: e.accountId, unit: e.unit, totalDebit: 0, totalCredit: 0, net: 0 });
    const row = tbMap.get(key);
    row.totalDebit += Number(e.debit || 0);
    row.totalCredit += Number(e.credit || 0);
    row.net = row.totalDebit - row.totalCredit;
  }
  const trialBalance = [...tbMap.values()].sort((a, b) => `${a.unit}|${a.accountId}`.localeCompare(`${b.unit}|${b.accountId}`));
  return { journalEntries: entries, trialBalance };
};

export function buildTier1ParityFixture() {
  const facts = [
    { factId: 'FACT-001', sheetId: 'P2P.InvoiceLines', expectedAmount: 10000, actualAmount: 10000, status: 'MATCHED' },
    { factId: 'FACT-002', sheetId: 'P2P.InvoiceLines', expectedAmount: 5250, actualAmount: 5400, status: 'MISMATCH' },
    { factId: 'FACT-003', sheetId: 'P2P.InvoiceLines', expectedAmount: 2300, actualAmount: 2300, status: 'MATCHED' }
  ];

  const transferPackets = [
    {
      transferPacketId: 'TP-GR-7001',
      commitId: 'COMMIT-GR-7001',
      proposalId: 'PROPOSAL-GR-7001',
      objectId: 'GR-7001',
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
      legs: [
        { containerRef: { id: 'container.company.AP' }, amount: 10000, unit: 'currency', reasonCode: 'PAY' },
        { containerRef: { id: 'container.company.CashBank' }, amount: -10000, unit: 'currency', reasonCode: 'PAY' }
      ]
    }
  ];

  const responsibilityPackets = transferPackets.map((p, idx) => ({
    responsibilityPacketId: `RP-${idx + 1}`,
    commitId: p.commitId,
    objectId: p.objectId,
    authorityRef: 'policy.governance.v2',
    actionRole: 'executed',
    actorId: `user.actor${idx + 1}`,
    linkedTransferPacketId: p.transferPacketId
  }));

  const containerAccountMap = {
    'container.siteA.Inventory': 'acct.inventory',
    'container.siteA.GRIR': 'acct.grir',
    'container.company.AP': 'acct.ap',
    'container.company.CashBank': 'acct.cashbank',
    'container.siteA.PriceVariance': 'acct.priceVariance',
    'container.siteA.QtyVariance': 'acct.qtyVariance',
    'container.company.BudgetCommitment': 'acct.budgetCommitment'
  };

  return {
    facts,
    kpiBindings: [
      { branchId: 'branch.p2p', metric: 'matchRate' },
      { branchId: 'branch.p2p', metric: 'invoiceTotal' }
    ],
    transferPackets,
    responsibilityPackets,
    containerAccountMap
  };
}

export function computeTier1GoldenHashesFromFixture(fixtureInput, options = {}) {
  const fixture = fixtureInput || buildTier1ParityFixture();
  const facts = [...(fixture.facts || [])].sort((a, b) => String(a.factId || '').localeCompare(String(b.factId || '')));
  const matches = facts.map((f, idx) => {
    const expected = Number(f.expectedAmount || 0);
    const actual = Number(f.actualAmount || 0);
    const delta = Number((actual - expected).toFixed(2));
    const status = String(f.status || (Math.abs(delta) < 0.0001 ? 'MATCHED' : 'MISMATCH'));
    return {
      matchId: `3WM-${String(idx + 1).padStart(3, '0')}`,
      factId: f.factId,
      status,
      delta
    };
  }).sort((a, b) => String(a.matchId).localeCompare(String(b.matchId)));

  const summaries = {
    factCount: facts.length,
    matchedCount: matches.filter(m => m.status === 'MATCHED').length,
    mismatchCount: matches.filter(m => m.status !== 'MATCHED').length,
    expectedTotal: Number(facts.reduce((acc, f) => acc + Number(f.expectedAmount || 0), 0).toFixed(2)),
    actualTotal: Number(facts.reduce((acc, f) => acc + Number(f.actualAmount || 0), 0).toFixed(2))
  };

  const kpiRows = (fixture.kpiBindings || []).map((k) => ({
    branchId: String(k.branchId || ''),
    metric: String(k.metric || ''),
    value: (k.metric === 'matchRate')
      ? Number((summaries.factCount > 0 ? summaries.matchedCount / summaries.factCount : 0).toFixed(6))
      : (k.metric === 'invoiceTotal' ? summaries.actualTotal : 0)
  })).sort((a, b) => `${a.branchId}|${a.metric}`.localeCompare(`${b.branchId}|${b.metric}`));

  const packets = {
    transferPackets: [...(fixture.transferPackets || [])].sort((a, b) => String(a.transferPacketId || '').localeCompare(String(b.transferPacketId || ''))),
    responsibilityPackets: [...(fixture.responsibilityPackets || [])].sort((a, b) => String(a.responsibilityPacketId || '').localeCompare(String(b.responsibilityPacketId || '')))
  };

  const { journalEntries, trialBalance } = projectLedger(packets.transferPackets, fixture.containerAccountMap || {});
  const ledger = { journalEntries, trialBalance };

  const factsHash = hashCanonical(facts);
  const matchesHash = hashCanonical(matches);
  const summariesHash = hashCanonical(summaries);
  const packetsHash = hashCanonical(packets);
  const ledgerHash = hashCanonical(ledger);

  let kpisHash = hashCanonical(kpiRows);
  let kpisReason = null;
  if (kpiRows.length === 0 && options.allowKpiNA === true) {
    kpisHash = 'N/A';
    kpisReason = 'NO_KPI_BINDINGS_HEADLESS';
  }

  return {
    factsHash,
    matchesHash,
    summariesHash,
    kpisHash,
    packetsHash,
    ledgerHash,
    kpisReason,
    components: { facts, matches, summaries, kpiRows, packets, ledger }
  };
}

