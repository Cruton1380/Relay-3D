/**
 * E3-REPLAY-1: Scoped Deterministic Replay Engine
 *
 * Pure computation module — no DOM, no renderer, no relayState mutation.
 * Operates on explicit inputs and returns explicit outputs (shadow workspace).
 *
 * Two levels:
 *   1. Sheet-level:  replay cell commits → SHA-256 compare vs live snapshot
 *   2. Module-level: orchestrate fact → match → summary → KPI → packets → ledger
 *                    in a shadow workspace, then SHA-256 compare all 7 components
 *
 * Locked decisions:
 *   D1: Both sheet + module scope
 *   D2: Log + append-only REPLAY_DIVERGENCE scar (no auto-HOLD)
 *   D3: SHA-256 for all comparisons; FNV-1a untouched
 *   D4: CommitIndex range (fromCommitIndex..toCommitIndex)
 *   D5: 10k rows < 60s headless with per-phase timing
 */

// ── Canonicalization (matches tier1-parity.js exactly) ───────────────────
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

// ── SHA-256 (Node.js path) ───────────────────────────────────────────────
let _nodeCreateHash = null;
async function sha256(text) {
  if (!_nodeCreateHash) {
    try {
      const crypto = await import('node:crypto');
      _nodeCreateHash = crypto.createHash ? crypto.createHash.bind(crypto) : null;
    } catch { _nodeCreateHash = null; }
  }
  if (_nodeCreateHash) {
    return _nodeCreateHash('sha256').update(String(text)).digest('hex');
  }
  // Browser fallback
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    const data = new TextEncoder().encode(String(text));
    const buf = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('No SHA-256 implementation available');
}

// ── CommitIndex mapping (Tightening #1) ──────────────────────────────────
/**
 * Build commitId → commitIndex map from global commits.
 * @param {Array} globalCommits — sorted array from window.__relayCommits
 * @returns {Map<string, number>}
 */
export function buildCommitIndexMap(globalCommits) {
  const map = new Map();
  const sorted = [...(globalCommits || [])].sort((a, b) => {
    const ai = Number(a.commitIndex ?? 0);
    const bi = Number(b.commitIndex ?? 0);
    return ai - bi || String(a.id || a.commitId || '').localeCompare(String(b.id || b.commitId || ''));
  });
  sorted.forEach((c, idx) => {
    const cid = String(c.commitId || c.id || '');
    if (cid) map.set(cid, c.commitIndex ?? idx);
  });
  return map;
}

/**
 * Filter sheet commits to a commitIndex range.
 * Tightening #1: unmapped commits are included only in full replay (from=0, to=latest).
 * For partial ranges, unmapped commits are EXCLUDED with a log.
 *
 * @param {Array} sheetCommits — from getSheetCommitLog(sheetId)
 * @param {Map} commitIndexMap — from buildCommitIndexMap
 * @param {number} fromIdx — inclusive start (0 = beginning)
 * @param {number} toIdx — inclusive end (Infinity = latest)
 * @param {Function} logFn — logging callback
 * @returns {Array} filtered commits
 */
export function filterSheetCommitsByRange(sheetCommits, commitIndexMap, fromIdx, toIdx, logFn) {
  const isFullReplay = fromIdx === 0 && (toIdx === Infinity || toIdx >= (commitIndexMap.size - 1));
  return sheetCommits.filter(sc => {
    const cid = String(sc.commitId || '');
    const mapped = commitIndexMap.has(cid);
    if (!mapped) {
      if (isFullReplay) return true;
      if (logFn) logFn(`[REPLAY] sheetCommit unmapped commitId=${cid || 'null'} seq=${sc.seq} action=EXCLUDED reason=noGlobalCommitIndex`);
      return false;
    }
    const idx = commitIndexMap.get(cid);
    return idx >= fromIdx && idx <= toIdx;
  });
}

// ── Sheet-level replay (SHA-256) ─────────────────────────────────────────
/**
 * Replay a single sheet from commits and compare against live snapshot.
 * All computation in shadow maps — no writes to any external state.
 *
 * @param {object} params
 * @param {Array} params.sheetCommits — filtered commit log for this sheet
 * @param {object} params.liveSnapshot — { cellRef: normalizedCellState } from live
 * @param {string} params.sheetId
 * @param {Function} params.logFn
 * @returns {Promise<object>} { matchesLive, replayHash, liveHash, replayState, liveState, commitCount }
 */
export async function replaySheetSHA256({ sheetCommits, liveSnapshot, sheetId, logFn }) {
  // Rebuild cell state in shadow map (same logic as replaySheetStateFromCommitLog)
  const replayMap = new Map();
  for (const commit of sheetCommits) {
    replayMap.set(commit.cellRef, {
      ...(commit.payload || {}),
      fromCommitId: commit.commitId,
      seq: commit.seq
    });
  }

  // Snapshot replay state (sorted keys)
  const replayKeys = [...replayMap.keys()].sort();
  const replayState = {};
  for (const key of replayKeys) {
    const s = replayMap.get(key) || {};
    replayState[key] = {
      value: s.value ?? '',
      formula: s.formula ?? null,
      display: s.display ?? '',
      hasFormula: !!s.hasFormula,
      refsSchemaVersion: s.refsSchemaVersion || 'PQ4-REFS-V1',
      parseVersion: s.parseVersion || 'PQ4-REFS-V1',
      refs: Array.isArray(s.refs) ? [...s.refs] : [],
      ranges: Array.isArray(s.ranges) ? [...s.ranges] : []
    };
  }

  // Build live state for committed cells only
  const liveState = {};
  for (const key of replayKeys) {
    liveState[key] = liveSnapshot[key] || {
      value: '', formula: null, display: '', hasFormula: false,
      refsSchemaVersion: 'PQ4-REFS-V1', parseVersion: 'PQ4-REFS-V1', refs: [], ranges: []
    };
  }

  const replayCanonical = canonicalize(replayState);
  const liveCanonical = canonicalize(liveState);
  const replayHash = await sha256(stableStringify(replayCanonical));
  const liveHash = await sha256(stableStringify(liveCanonical));
  const matchesLive = replayHash === liveHash;

  if (logFn) {
    logFn(`[REPLAY] sheet sheetId=${sheetId} commitCount=${sheetCommits.length} replayHash=${replayHash.slice(0, 16)} liveHash=${liveHash.slice(0, 16)} result=${matchesLive ? 'MATCH' : 'DIVERGENCE'}`);
  }

  return { matchesLive, replayHash, liveHash, replayState: replayCanonical, liveState: liveCanonical, commitCount: sheetCommits.length };
}

// ── Module-level replay ──────────────────────────────────────────────────
/**
 * Replay an entire module's derived chain in a shadow workspace.
 * Returns per-component SHA-256 hashes and comparison results.
 *
 * @param {object} params
 * @param {object} params.moduleDef — module definition from loadedModuleDefs
 * @param {object} params.shadowFacts — { sheetId: [[row0col0, row0col1, ...], ...] } rebuilt fact data
 * @param {Function} params.buildMatchesFn — buildMatches(currentData, moduleDef, opts) → { sheetId: rows }
 * @param {Function} params.buildSummaryDataFn — buildSummaryData(moduleDef, currentData, matchResults) → { sheetId: rows }
 * @param {Array} params.kpiBindings — [{ branchId, metric }]
 * @param {object} params.packetData — { transferPackets, responsibilityPackets }
 * @param {object} params.containerAccountMap
 * @param {Array} params.commits — sorted commit array
 * @param {object} params.liveHashes — from relayGetGoldenStateHashesSHA256
 * @param {Function} params.logFn
 * @returns {Promise<object>}
 */
export async function replayModuleSHA256(params) {
  const {
    moduleDef, shadowFacts, buildMatchesFn, buildSummaryDataFn,
    kpiBindings, packetData, containerAccountMap, commits,
    liveHashes, logFn
  } = params;

  const timing = { ingest: 0, matches: 0, summaries: 0, kpis: 0, packets: 0, ledger: 0, hashCompare: 0, total: 0 };
  const totalT0 = performance.now();

  // Phase 1: Facts are already extracted from sheet replay (timing tracked by caller)
  timing.ingest = params.ingestMs || 0;

  // Phase 2: Rebuild matches from shadow facts
  const matchT0 = performance.now();
  let shadowMatches = {};
  try {
    shadowMatches = buildMatchesFn(shadowFacts, moduleDef, {
      dirtySourceSheets: new Set(Object.keys(shadowFacts)),
      matchSheetIds: (moduleDef.matchSheets || []).map(m => m.sheetId)
    });
  } catch (e) {
    if (logFn) logFn(`[REPLAY] matchRebuild error=${e.message}`);
  }
  timing.matches = performance.now() - matchT0;

  // Phase 3: Rebuild summaries from shadow matches
  const sumT0 = performance.now();
  let shadowSummaries = {};
  try {
    const matchResultsForSummary = {};
    for (const md of (moduleDef.matchSheets || [])) {
      matchResultsForSummary[md.sheetId] = Array(Math.max(0, (shadowMatches[md.sheetId] || []).length)).fill(null);
    }
    shadowSummaries = buildSummaryDataFn(moduleDef, shadowFacts, matchResultsForSummary);
  } catch (e) {
    if (logFn) logFn(`[REPLAY] summaryRebuild error=${e.message}`);
  }
  timing.summaries = performance.now() - sumT0;

  // Phase 4: KPI computation from shadow summaries
  const kpiT0 = performance.now();
  const facts = [];
  for (const [sheetId, rows] of Object.entries(shadowFacts)) {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      facts.push({
        factId: `${sheetId}-R${r}`,
        sheetId,
        expectedAmount: Number(row[2] || 0),
        actualAmount: Number(row[3] || 0),
        status: row[4] || (Math.abs(Number(row[2] || 0) - Number(row[3] || 0)) < 0.0001 ? 'MATCHED' : 'MISMATCH')
      });
    }
  }
  const shadowKpis = (kpiBindings || []).map(k => {
    const matched = facts.filter(f => f.status === 'MATCHED').length;
    return {
      branchId: String(k.branchId || ''),
      metric: String(k.metric || ''),
      value: k.metric === 'matchRate'
        ? Number((facts.length > 0 ? matched / facts.length : 0).toFixed(6))
        : (k.metric === 'invoiceTotal'
          ? Number(facts.reduce((a, f) => a + f.actualAmount, 0).toFixed(2))
          : 0)
    };
  }).sort((a, b) => `${a.branchId}|${a.metric}`.localeCompare(`${b.branchId}|${b.metric}`));
  timing.kpis = performance.now() - kpiT0;

  // Phase 5: Packets (pass-through from shadow data)
  const pktT0 = performance.now();
  const shadowPackets = {
    transferPackets: [...(packetData?.transferPackets || [])].sort((a, b) =>
      String(a.transferPacketId || '').localeCompare(String(b.transferPacketId || ''))),
    responsibilityPackets: [...(packetData?.responsibilityPackets || [])].sort((a, b) =>
      String(a.responsibilityPacketId || '').localeCompare(String(b.responsibilityPacketId || '')))
  };
  timing.packets = performance.now() - pktT0;

  // Phase 6: Ledger projection
  const ledT0 = performance.now();
  let shadowLedger = { journalEntries: [], trialBalance: [] };
  try {
    if (shadowPackets.transferPackets.length > 0 && containerAccountMap) {
      const { projectLedger } = await import('../../headless/tier1-parity.js').catch(() => ({ projectLedger: null }));
      if (typeof projectLedger === 'function') {
        shadowLedger = projectLedger(shadowPackets.transferPackets, containerAccountMap);
      }
    }
  } catch { /* ledger projection optional */ }
  timing.ledger = performance.now() - ledT0;

  // Phase 7: SHA-256 hash all components
  const hashT0 = performance.now();
  const sortedFacts = [...facts].sort((a, b) => String(a.factId).localeCompare(String(b.factId)));
  const sortedMatches = sortedFacts.map((f, idx) => {
    const delta = Number((f.actualAmount - f.expectedAmount).toFixed(2));
    return {
      matchId: `3WM-${String(idx + 1).padStart(3, '0')}`,
      factId: f.factId,
      status: f.status,
      delta
    };
  }).sort((a, b) => String(a.matchId).localeCompare(String(b.matchId)));

  const summaries = {
    factCount: sortedFacts.length,
    matchedCount: sortedMatches.filter(m => m.status === 'MATCHED').length,
    mismatchCount: sortedMatches.filter(m => m.status !== 'MATCHED').length,
    expectedTotal: Number(sortedFacts.reduce((a, f) => a + f.expectedAmount, 0).toFixed(2)),
    actualTotal: Number(sortedFacts.reduce((a, f) => a + f.actualAmount, 0).toFixed(2))
  };

  const sortedCommits = [...(commits || [])].sort((a, b) => {
    const ai = Number(a.commitIndex ?? 0);
    const bi = Number(b.commitIndex ?? 0);
    return ai - bi || String(a.id || '').localeCompare(String(b.id || ''));
  });

  const replayHashes = {
    factsHash: await sha256(stableStringify(sortedFacts)),
    matchesHash: await sha256(stableStringify(sortedMatches)),
    summariesHash: await sha256(stableStringify(summaries)),
    kpisHash: shadowKpis.length > 0 ? await sha256(stableStringify(shadowKpis)) : 'N/A',
    commitsHash: sortedCommits.length > 0 ? await sha256(stableStringify(sortedCommits)) : 'N/A',
    packetsHash: (shadowPackets.transferPackets.length > 0 || shadowPackets.responsibilityPackets.length > 0)
      ? await sha256(stableStringify(shadowPackets)) : 'N/A',
    ledgerHash: shadowLedger.journalEntries.length > 0
      ? await sha256(stableStringify(shadowLedger)) : 'N/A'
  };
  timing.hashCompare = performance.now() - hashT0;
  timing.total = performance.now() - totalT0;

  // Compare against live
  const components = ['facts', 'matches', 'summaries', 'kpis', 'commits', 'packets', 'ledger'];
  const comparison = {};
  const divergences = [];
  for (const c of components) {
    const rh = String(replayHashes[`${c}Hash`] || '');
    const lh = String(liveHashes[`${c}Hash`] || '');
    if (rh === 'N/A' && lh === 'N/A') {
      comparison[c] = 'MATCH';
      continue;
    }
    comparison[c] = rh === lh ? 'MATCH' : 'DIVERGENCE';
    if (comparison[c] === 'DIVERGENCE') {
      divergences.push({ component: c, expected: lh, actual: rh });
    }
  }

  const allMatch = divergences.length === 0;
  const result = allMatch ? 'MATCH' : 'DIVERGENCE';

  if (logFn) {
    const cmp = (c) => comparison[c] === 'MATCH' ? 'M' : 'D';
    logFn(`[REPLAY] golden-compare facts=${cmp('facts')} matches=${cmp('matches')} summaries=${cmp('summaries')} kpis=${cmp('kpis')} commits=${cmp('commits')} packets=${cmp('packets')} ledger=${cmp('ledger')}`);
    logFn(`[REPLAY] timing ingest=${timing.ingest.toFixed(0)}ms matches=${timing.matches.toFixed(0)}ms summaries=${timing.summaries.toFixed(0)}ms kpis=${timing.kpis.toFixed(0)}ms packets=${timing.packets.toFixed(0)}ms ledger=${timing.ledger.toFixed(0)}ms hashCompare=${timing.hashCompare.toFixed(0)}ms total=${timing.total.toFixed(0)}ms`);
    logFn(`[REPLAY] module moduleId=${moduleDef?.moduleId || 'unknown'} result=${result}`);
  }

  return { result, comparison, replayHashes, divergences, timing };
}

/**
 * Build unique divergence scar event ID (Tightening #4).
 * Format: replay.<moduleId>.<from>-<to>.<sha16(expected)>.<sha16(actual)>
 */
export function buildDivergenceScarId(moduleId, from, to, expectedHash, actualHash) {
  return `replay.${moduleId}.${from}-${to}.${String(expectedHash).slice(0, 16)}.${String(actualHash).slice(0, 16)}`;
}

/**
 * Build a REPLAY_DIVERGENCE timebox event.
 */
export function buildDivergenceScarEvent({ moduleId, component, expectedHash, actualHash, from, to }) {
  return {
    type: 'REPLAY_DIVERGENCE',
    eventId: buildDivergenceScarId(moduleId, from, to, expectedHash, actualHash),
    component,
    expectedHash: String(expectedHash).slice(0, 16),
    actualHash: String(actualHash).slice(0, 16),
    moduleId,
    replayScope: `${from}-${to}`,
    timestamp: new Date().toISOString()
  };
}

export { sha256, stableStringify, canonicalize };
