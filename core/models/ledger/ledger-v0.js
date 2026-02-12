const toUnit = (unit) => {
  const u = String(unit || '').trim().toLowerCase();
  if (u === 'qty') return 'quantity';
  return u;
};

const stableSortPackets = (packets) => {
  return [...packets].sort((a, b) => {
    const ak = `${String(a.transferPacketId || '')}|${String(a.commitId || '')}|${String(a.createdAt || '')}`;
    const bk = `${String(b.transferPacketId || '')}|${String(b.commitId || '')}|${String(b.createdAt || '')}`;
    return ak.localeCompare(bk);
  });
};

const stableStringify = (value) => {
  const seen = new WeakSet();
  const walk = (input) => {
    if (input === null || typeof input !== 'object') return input;
    if (seen.has(input)) throw new Error('CYCLIC_STRUCTURE');
    seen.add(input);
    if (Array.isArray(input)) return input.map(walk);
    const out = {};
    for (const key of Object.keys(input).sort()) out[key] = walk(input[key]);
    return out;
  };
  return JSON.stringify(walk(value));
};

const fnv1aHex = (text) => {
  let hash = 0x811c9dc5;
  const src = String(text || '');
  for (let i = 0; i < src.length; i += 1) {
    hash ^= src.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `0x${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

const refusal = (reason, details = {}) => {
  const err = new Error(reason);
  err.code = reason;
  err.details = details;
  throw err;
};

const requireTransferPacketBalanced = (packet) => {
  if (!packet || typeof packet !== 'object') refusal('LEDGER_PACKET_INVALID', { packet });
  const legs = Array.isArray(packet.legs) ? packet.legs : [];
  if (legs.length < 2) refusal('LEDGER_PACKET_INVALID', { transferPacketId: packet.transferPacketId, reason: 'TOO_FEW_LEGS' });
  const sums = new Map();
  for (const leg of legs) {
    const amount = Number(leg?.amount);
    const unit = toUnit(leg?.unit);
    if (!Number.isFinite(amount) || !unit) {
      refusal('LEDGER_PACKET_INVALID', { transferPacketId: packet.transferPacketId, reason: 'INVALID_LEG', leg });
    }
    sums.set(unit, Number(sums.get(unit) || 0) + amount);
  }
  for (const [unit, sum] of sums.entries()) {
    if (Math.abs(sum) > 1e-9) {
      refusal('LEDGER_PACKET_INVALID', { transferPacketId: packet.transferPacketId, reason: 'UNBALANCED_TRANSFER_PACKET', unit, sum });
    }
  }
};

const normalizeMappingPolicy = (mappingPolicy) => {
  if (!mappingPolicy) {
    refusal('LEDGER_MAPPING_POLICY_MISSING');
  }
  if (typeof mappingPolicy.resolveAccount === 'function') {
    return mappingPolicy;
  }
  if (typeof mappingPolicy === 'object') {
    return {
      resolveAccount(containerRef) {
        const key = typeof containerRef === 'string' ? containerRef : containerRef?.id;
        return mappingPolicy[String(key || '')] || null;
      }
    };
  }
  refusal('LEDGER_MAPPING_POLICY_INVALID');
};

export function projectJournalFromTransferPackets(packets, mappingPolicy) {
  if (!Array.isArray(packets)) refusal('LEDGER_PACKETS_NOT_ARRAY');
  const policy = normalizeMappingPolicy(mappingPolicy);
  const sortedPackets = stableSortPackets(packets);
  const entries = [];
  let jeSeq = 0;

  for (const packet of sortedPackets) {
    requireTransferPacketBalanced(packet);
    const legs = Array.isArray(packet.legs) ? [...packet.legs] : [];
    legs.sort((a, b) => {
      const ac = String(a?.containerRef?.id || a?.containerRef || '');
      const bc = String(b?.containerRef?.id || b?.containerRef || '');
      if (ac !== bc) return ac.localeCompare(bc);
      const au = toUnit(a?.unit);
      const bu = toUnit(b?.unit);
      if (au !== bu) return au.localeCompare(bu);
      return Number(a?.amount || 0) - Number(b?.amount || 0);
    });

    for (const leg of legs) {
      const containerRef = leg?.containerRef || null;
      const accountId = policy.resolveAccount(containerRef);
      if (!accountId) {
        refusal('LEDGER_MAPPING_MISSING', { containerRef: typeof containerRef === 'string' ? containerRef : containerRef?.id || null });
      }
      const amount = Number(leg.amount);
      const abs = Math.abs(amount);
      const unit = toUnit(leg.unit);
      const journalEntry = {
        journalEntryId: `JE-${String(packet.transferPacketId || 'packet')}-${(++jeSeq).toString(36)}`,
        sourceTransferPacketId: String(packet.transferPacketId || ''),
        commitId: String(packet.commitId || ''),
        proposalId: String(packet.proposalId || ''),
        objectId: String(packet.objectId || ''),
        unit,
        accountId: String(accountId),
        debit: amount >= 0 ? abs : 0,
        credit: amount < 0 ? abs : 0,
        containerRef: typeof containerRef === 'string' ? { id: containerRef } : { ...containerRef },
        reasonCode: String(leg.reasonCode || 'UNSPECIFIED')
      };
      entries.push(journalEntry);
    }
  }

  const byPacketUnit = new Map();
  for (const je of entries) {
    const key = `${je.sourceTransferPacketId}|${je.unit}`;
    if (!byPacketUnit.has(key)) byPacketUnit.set(key, { debit: 0, credit: 0 });
    const bucket = byPacketUnit.get(key);
    bucket.debit += Number(je.debit || 0);
    bucket.credit += Number(je.credit || 0);
  }
  for (const [key, sums] of byPacketUnit.entries()) {
    if (Math.abs((sums.debit || 0) - (sums.credit || 0)) > 1e-9) {
      refusal('LEDGER_JE_UNBALANCED', { key, debit: sums.debit, credit: sums.credit });
    }
  }

  entries.sort((a, b) => {
    const ak = `${a.sourceTransferPacketId}|${a.unit}|${a.accountId}|${a.journalEntryId}`;
    const bk = `${b.sourceTransferPacketId}|${b.unit}|${b.accountId}|${b.journalEntryId}`;
    return ak.localeCompare(bk);
  });
  return entries;
}

export function computeTrialBalance(journalEntries) {
  if (!Array.isArray(journalEntries)) refusal('LEDGER_JOURNAL_NOT_ARRAY');
  const rows = new Map();
  for (const je of journalEntries) {
    const unit = toUnit(je.unit);
    const accountId = String(je.accountId || '');
    if (!accountId || !unit) refusal('LEDGER_JOURNAL_INVALID_ROW', { journalEntry: je });
    const key = `${accountId}|${unit}`;
    if (!rows.has(key)) rows.set(key, { accountId, unit, totalDebit: 0, totalCredit: 0, net: 0 });
    const row = rows.get(key);
    row.totalDebit += Number(je.debit || 0);
    row.totalCredit += Number(je.credit || 0);
    row.net = row.totalDebit - row.totalCredit;
  }
  const out = [...rows.values()].sort((a, b) => {
    const ak = `${a.unit}|${a.accountId}`;
    const bk = `${b.unit}|${b.accountId}`;
    return ak.localeCompare(bk);
  });
  return out;
}

export function hashProjection(value) {
  return fnv1aHex(stableStringify(value));
}

