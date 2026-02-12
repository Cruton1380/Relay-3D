const toDecimalString = (value, digits = 2) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '0';
  return n.toFixed(digits);
};

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

export function normalizeTaxFields(record = {}) {
  return {
    jurisdiction: String(record.jurisdiction || 'UNKNOWN'),
    taxTreatment: String(record.taxTreatment || 'STANDARD'),
    taxRate: toDecimalString(record.taxRate || 0, 4),
    taxAmount: toDecimalString(record.taxAmount || 0, 2)
  };
}

export function exportTaxReport(records = [], periodId = 'UNKNOWN', format = 'json') {
  const normalized = [...(records || [])]
    .map((r) => ({
      objectType: String(r.objectType || ''),
      objectId: String(r.objectId || ''),
      invoiceId: String(r.invoiceId || r.invId || ''),
      paymentId: String(r.paymentId || ''),
      companyId: String(r.companyId || 'company'),
      periodId: String(r.periodId || periodId),
      ...normalizeTaxFields(r)
    }))
    .sort((a, b) => `${a.objectType}|${a.objectId}`.localeCompare(`${b.objectType}|${b.objectId}`));

  if (format === 'csv') {
    const headers = ['objectType', 'objectId', 'invoiceId', 'paymentId', 'companyId', 'periodId', 'jurisdiction', 'taxTreatment', 'taxRate', 'taxAmount'];
    const rows = normalized.map((r) => headers.map(h => String(r[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    return { format: 'csv', payload: csv, hash: stableHash(csv), rowCount: normalized.length };
  }

  const jsonPayload = stableStringify({ periodId, rows: normalized });
  return { format: 'json', payload: jsonPayload, hash: stableHash(jsonPayload), rowCount: normalized.length };
}

