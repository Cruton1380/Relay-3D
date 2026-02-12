const stableHash = (text) => {
  let hash = 0x811c9dc5;
  const src = String(text || '');
  for (let i = 0; i < src.length; i += 1) {
    hash ^= src.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `0x${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

const stableStringify = (value) => {
  const walk = (v) => {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(walk);
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = walk(v[k]);
    return out;
  };
  return JSON.stringify(walk(value));
};

export function createPaymentBatch({ companyId = 'company', paymentIds = [], requestedBy = 'user.treasury1' } = {}) {
  const ids = [...new Set((paymentIds || []).map(v => String(v || '').trim()).filter(Boolean))].sort();
  const batchId = `PAYBATCH-${stableHash(`${companyId}|${ids.join('|')}`).slice(2, 10).toUpperCase()}`;
  return {
    batchId,
    companyId: String(companyId),
    paymentIds: ids,
    requestedBy: String(requestedBy),
    createdAt: new Date().toISOString()
  };
}

export function executePaymentBatch(batch, payments = []) {
  const paymentMap = new Map((payments || []).map(p => [String(p.paymentId || p.id || ''), p]));
  const orderedPayments = (batch?.paymentIds || [])
    .map(id => paymentMap.get(String(id)))
    .filter(Boolean)
    .sort((a, b) => String(a.paymentId || a.id || '').localeCompare(String(b.paymentId || b.id || '')));

  const transferPackets = orderedPayments.map((payment, idx) => {
    const paymentId = String(payment.paymentId || payment.id || '');
    const amount = Number(payment.amount || 0);
    return {
      transferPacketId: `TP-${paymentId || `PAY-${idx + 1}`}`,
      commitId: `COMMIT-${paymentId || `PAY-${idx + 1}`}`,
      proposalId: `PROPOSAL-${paymentId || `PAY-${idx + 1}`}`,
      objectId: paymentId || `PAY-${idx + 1}`,
      itemId: payment.itemId || null,
      createdAt: new Date().toISOString(),
      legs: [
        { containerRef: { id: 'container.company.AP' }, amount, unit: 'currency', reasonCode: 'PAY_AP' },
        { containerRef: { id: 'container.company.CashBank' }, amount: -amount, unit: 'currency', reasonCode: 'PAY_CASH' }
      ]
    };
  });

  return { batch, transferPackets, executedCount: transferPackets.length };
}

export function matchBankStatementLines(payments = [], bankStatementLines = []) {
  const byPaymentId = new Map((payments || []).map(p => [String(p.paymentId || p.id || ''), p]));
  const matches = [];
  for (const line of (bankStatementLines || [])) {
    const paymentId = String(line.paymentId || '');
    const payment = byPaymentId.get(paymentId);
    const bankAmount = Number(line.amount || 0);
    const payAmount = Number(payment?.amount || 0);
    const status = payment
      ? (Math.abs(bankAmount - payAmount) < 1e-9 ? 'MATCHED' : 'AMOUNT_MISMATCH')
      : 'UNMATCHED';
    matches.push({
      paymentId,
      bankLineId: String(line.bankLineId || ''),
      paymentAmount: payAmount,
      bankAmount,
      status
    });
  }
  matches.sort((a, b) => `${a.paymentId}|${a.bankLineId}`.localeCompare(`${b.paymentId}|${b.bankLineId}`));
  return matches;
}

export function hashPaymentCoreProjection(value) {
  return stableHash(stableStringify(value));
}

