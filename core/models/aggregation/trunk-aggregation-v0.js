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

const asNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const aggregateValues = (values, op) => {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const nums = values.map(asNumber);
  if (op === 'sum') return Number(nums.reduce((acc, v) => acc + v, 0).toFixed(6));
  if (op === 'avg') return Number((nums.reduce((acc, v) => acc + v, 0) / nums.length).toFixed(6));
  if (op === 'min') return Number(Math.min(...nums).toFixed(6));
  if (op === 'max') return Number(Math.max(...nums).toFixed(6));
  return Number(nums.reduce((acc, v) => acc + v, 0).toFixed(6));
};

export function aggregateBranchMetrics(branchMetricsById = [], policy = {}) {
  const trunkId = String(policy.trunkId || 'trunk.avgol');
  const rules = Array.isArray(policy.rules) ? policy.rules : [];
  const inputRows = Array.isArray(branchMetricsById) ? [...branchMetricsById] : [];
  inputRows.sort((a, b) => `${String(a.branchId || '')}|${String(a.metricId || '')}`.localeCompare(`${String(b.branchId || '')}|${String(b.metricId || '')}`));

  const metrics = [];
  for (const rule of rules) {
    const sourceMetricId = String(rule.sourceMetricId || '').trim();
    if (!sourceMetricId) continue;
    const op = String(rule.op || 'sum').toLowerCase();
    const metricId = String(rule.trunkMetricId || sourceMetricId).trim();
    const unit = String(rule.unit || '').trim();
    const contributors = inputRows
      .filter((row) => String(row.metricId || '') === sourceMetricId)
      .map((row) => ({
        branchId: String(row.branchId || ''),
        value: asNumber(row.value),
        unit: String(row.unit || unit || ''),
        sourceCell: String(row.sourceCell || ''),
        summarySheetId: String(row.summarySheetId || ''),
        factSheetIds: Array.isArray(row.factSheetIds) ? [...row.factSheetIds].map(String).sort() : []
      }))
      .sort((a, b) => a.branchId.localeCompare(b.branchId));
    const value = aggregateValues(contributors.map((c) => c.value), op);
    metrics.push({
      trunkId,
      metricId,
      sourceMetricId,
      op,
      unit,
      value,
      contributorCount: contributors.length,
      contributors
    });
  }
  metrics.sort((a, b) => a.metricId.localeCompare(b.metricId));
  return {
    policyVersion: String(policy.policyVersion || 'D1-TRUNK-AGG-V0'),
    trunkId,
    metrics
  };
}

export function hashAggregation(trunkMetrics) {
  return fnv1aHex(stableStringify(trunkMetrics || {}));
}
