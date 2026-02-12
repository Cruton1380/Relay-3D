import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadModule, buildMatches, buildSummaryData } from '../app/modules/module-loader.js';
import { loadRoutes, getRoute, ingestBatch } from '../app/modules/route-engine.js';
import { RelayLog } from '../core/utils/relay-log.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = Number(process.env.D3_PORT || 4010);
const RELAY_KEY = String(process.env.D3_RELAY_KEY || 'relay-dev-key');
const MAX_RECORDS = Number(process.env.D3_MAX_RECORDS || 1000);
const MAX_BODY_BYTES = Number(process.env.D3_MAX_BODY_BYTES || (1024 * 1024));
const RATE_CAPACITY = Number(process.env.D3_RATE_CAPACITY || 5);
const RATE_REFILL_PER_SEC = Number(process.env.D3_RATE_REFILL_PER_SEC || 2);

const relayState = { tree: { nodes: [], edges: [] } };
const loadedModuleDefs = new Map(); // moduleId -> moduleDef
const sheetToModuleId = new Map(); // sheetId -> moduleId
const keyBuckets = new Map(); // key -> { tokens, updatedAtMs }

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

const hashString = (src) => {
  let hash = 0x811c9dc5;
  const text = String(src || '');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `0x${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

const hashObject = (value) => hashString(stableStringify(value));

function ensureCellIndex(sheet) {
  if (!sheet?._cellIndex) {
    sheet._cellIndex = new Map((sheet.cellData || []).map(c => [`${c.row},${c.col}`, c]));
  }
}

function getSheetNode(sheetId) {
  return relayState.tree.nodes.find(n => n.type === 'sheet' && n.id === sheetId) || null;
}

function parseSheetRef(ref) {
  const m = String(ref || '').match(/^([A-Za-z0-9_.-]+)!([A-Z]+)(\d+)$/);
  if (!m) return null;
  const sheetId = m[1];
  const letters = m[2];
  const row = Number(m[3]) - 1;
  let col = 0;
  for (let i = 0; i < letters.length; i += 1) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return { sheetId, row, col: col - 1 };
}

function sheetRowsAsArrays(sheetId) {
  const sheet = getSheetNode(sheetId);
  if (!sheet) return [];
  ensureCellIndex(sheet);
  const rows = [];
  for (let r = 1; r < (sheet.rows || 1); r += 1) {
    const row = [];
    for (let c = 0; c < (sheet.cols || 0); c += 1) {
      const ci = sheet._cellIndex.get(`${r},${c}`);
      row.push(ci ? (ci.value ?? ci.display ?? '') : '');
    }
    rows.push(row);
  }
  return rows;
}

function writeRowsToSheet(sheetId, columns, rows) {
  const sheet = getSheetNode(sheetId);
  if (!sheet) return;
  sheet.cellData = [];
  (columns || []).forEach((col, idx) => {
    const label = String(col?.label || col?.id || `C${idx + 1}`);
    sheet.cellData.push({ row: 0, col: idx, timeboxCount: 1, hasFormula: false, value: label, display: label });
  });
  (rows || []).forEach((row, rowIdx) => {
    (columns || []).forEach((_, colIdx) => {
      const value = row[colIdx] ?? '';
      const isFormula = typeof value === 'string' && value.startsWith('=');
      sheet.cellData.push({
        row: rowIdx + 1,
        col: colIdx,
        timeboxCount: 1,
        hasFormula: isFormula,
        formula: isFormula ? value : null,
        value: isFormula ? null : value,
        display: String(value)
      });
    });
  });
  sheet.rows = 1 + (rows || []).length;
  sheet.cols = (columns || []).length;
  sheet._cellIndex = null;
  ensureCellIndex(sheet);
}

function registerModule(moduleDef) {
  if (!moduleDef?.moduleId) return;
  loadedModuleDefs.set(String(moduleDef.moduleId), moduleDef);
  const allSheets = [
    ...(moduleDef.factSheets || []),
    ...(moduleDef.matchSheets || []),
    ...(moduleDef.summarySheets || [])
  ];
  for (const s of allSheets) {
    if (s?.sheetId) sheetToModuleId.set(String(s.sheetId), String(moduleDef.moduleId));
  }
}

function getModuleDefForSheet(sheetId) {
  const moduleId = sheetToModuleId.get(String(sheetId || ''));
  return moduleId ? (loadedModuleDefs.get(moduleId) || null) : null;
}

function recomputeModuleChain(editedSheetId) {
  const moduleDef = getModuleDefForSheet(editedSheetId);
  if (!moduleDef) return;
  const isFactSheet = (moduleDef.factSheets || []).some(f => f.sheetId === editedSheetId);
  const isMatchSheet = (moduleDef.matchSheets || []).some(m => m.sheetId === editedSheetId);
  if (!isFactSheet && !isMatchSheet) return;

  const currentData = {};
  for (const factDef of (moduleDef.factSheets || [])) {
    currentData[factDef.sheetId] = sheetRowsAsArrays(factDef.sheetId);
  }

  const allMatchDefs = moduleDef.matchSheets || [];
  const targetMatchDefs = isFactSheet
    ? allMatchDefs.filter(def => {
      if (!Array.isArray(def.sourceSheets) || def.sourceSheets.length === 0) return true;
      return def.sourceSheets.includes(editedSheetId);
    })
    : allMatchDefs;
  const targetMatchIds = targetMatchDefs.map(d => d.sheetId);
  const matchResults = buildMatches(currentData, moduleDef, {
    dirtySourceSheets: new Set([editedSheetId]),
    matchSheetIds: targetMatchIds
  });
  for (const matchDef of targetMatchDefs) {
    writeRowsToSheet(matchDef.sheetId, matchDef.columns || [], matchResults[matchDef.sheetId] || []);
  }

  const matchResultsForSummary = {};
  for (const matchDef of (moduleDef.matchSheets || [])) {
    matchResultsForSummary[matchDef.sheetId] = sheetRowsAsArrays(matchDef.sheetId);
  }
  const summaryData = buildSummaryData(moduleDef, currentData, matchResultsForSummary);
  const allSummaryDefs = moduleDef.summarySheets || [];
  const dirtySources = new Set([editedSheetId, ...targetMatchIds]);
  const targetSummaryDefs = allSummaryDefs.filter(def => {
    if (!Array.isArray(def.sourceSheets) || def.sourceSheets.length === 0) return true;
    return def.sourceSheets.some(src => dirtySources.has(src));
  });
  for (const sumDef of targetSummaryDefs) {
    writeRowsToSheet(sumDef.sheetId, sumDef.columns || [], summaryData[sumDef.sheetId] || []);
  }

  const branch = relayState.tree.nodes.find(n => n.type === 'branch' && n.id === moduleDef.branchId);
  if (branch && Array.isArray(moduleDef.kpiBindings) && moduleDef.kpiBindings.length > 0) {
    if (!branch.metadata) branch.metadata = {};
    if (!Array.isArray(branch.metadata.kpiMetrics)) branch.metadata.kpiMetrics = [];
    const metricRecord = {
      seq: branch.metadata.kpiMetrics.length + 1,
      triggeredBy: editedSheetId,
      metrics: {}
    };
    for (const binding of moduleDef.kpiBindings) {
      const parsed = parseSheetRef(binding.sourceCell);
      let value = 0;
      if (parsed) {
        const sourceSheet = getSheetNode(parsed.sheetId);
        if (sourceSheet) {
          ensureCellIndex(sourceSheet);
          const ci = sourceSheet._cellIndex.get(`${parsed.row},${parsed.col}`);
          value = Number(ci?.value ?? ci?.display ?? 0);
          if (!Number.isFinite(value)) value = 0;
        }
      }
      metricRecord.metrics[binding.metricId] = {
        value,
        unit: binding.unit || '',
        sourceCell: binding.sourceCell
      };
    }
    branch.metadata.kpiMetrics.push(metricRecord);
  }
}

function extractRowsAsObjects(sheetId) {
  const sheet = getSheetNode(sheetId);
  if (!sheet) return [];
  ensureCellIndex(sheet);
  const schema = sheet.metadata?.schema || [];
  const out = [];
  for (let r = 1; r < (sheet.rows || 1); r += 1) {
    const row = {};
    for (let c = 0; c < schema.length; c += 1) {
      const key = schema[c]?.id || `col${c}`;
      const ci = sheet._cellIndex.get(`${r},${c}`);
      row[key] = ci ? (ci.value ?? ci.display ?? null) : null;
    }
    out.push(row);
  }
  return out;
}

function buildStateHashes() {
  const facts = [];
  const matches = [];
  const summaries = [];
  for (const mod of loadedModuleDefs.values()) {
    for (const f of (mod.factSheets || [])) {
      const rows = extractRowsAsObjects(f.sheetId);
      rows.forEach((row, idx) => facts.push({ sheetId: f.sheetId, idx, row }));
    }
    for (const m of (mod.matchSheets || [])) {
      const rows = extractRowsAsObjects(m.sheetId);
      rows.forEach((row, idx) => matches.push({ sheetId: m.sheetId, idx, row }));
    }
    for (const s of (mod.summarySheets || [])) {
      const rows = extractRowsAsObjects(s.sheetId);
      rows.forEach((row, idx) => summaries.push({ sheetId: s.sheetId, idx, row }));
    }
  }
  facts.sort((a, b) => `${a.sheetId}|${a.idx}`.localeCompare(`${b.sheetId}|${b.idx}`));
  matches.sort((a, b) => `${a.sheetId}|${a.idx}`.localeCompare(`${b.sheetId}|${b.idx}`));
  summaries.sort((a, b) => `${a.sheetId}|${a.idx}`.localeCompare(`${b.sheetId}|${b.idx}`));

  const kpis = relayState.tree.nodes
    .filter(n => n.type === 'branch' && Array.isArray(n.metadata?.kpiMetrics))
    .map(n => ({
      branchId: n.id,
      metricCount: n.metadata.kpiMetrics.length,
      latest: n.metadata.kpiMetrics.length > 0 ? n.metadata.kpiMetrics[n.metadata.kpiMetrics.length - 1].metrics : {}
    }))
    .sort((a, b) => String(a.branchId).localeCompare(String(b.branchId)));

  return {
    factsHash: hashObject(facts),
    matchesHash: hashObject(matches),
    summariesHash: hashObject(summaries),
    kpisHash: hashObject(kpis)
  };
}

function getBucket(key) {
  const now = Date.now();
  if (!keyBuckets.has(key)) {
    keyBuckets.set(key, { tokens: RATE_CAPACITY, updatedAtMs: now });
  }
  const bucket = keyBuckets.get(key);
  const elapsedSec = Math.max(0, (now - bucket.updatedAtMs) / 1000);
  bucket.tokens = Math.min(RATE_CAPACITY, bucket.tokens + elapsedSec * RATE_REFILL_PER_SEC);
  bucket.updatedAtMs = now;
  return bucket;
}

function consumeRateToken(key) {
  const bucket = getBucket(key);
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Relay-Key, X-Relay-Proof',
    'Cache-Control': 'no-cache'
  });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) throw new Error('D3_PAYLOAD_TOO_LARGE');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function normalizeRecords(recordsInput, meta = {}, proofMode = false) {
  const records = Array.isArray(recordsInput) ? recordsInput : [recordsInput];
  if (records.length === 0) return { ok: false, reason: 'D3_PAYLOAD_INVALID', detail: 'records empty' };
  if (records.length > MAX_RECORDS) return { ok: false, reason: 'D3_PAYLOAD_INVALID', detail: 'records exceeds max' };
  if (proofMode && !String(meta.eventTimestamp || '').trim()) {
    return { ok: false, reason: 'D3_PAYLOAD_INVALID', detail: 'eventTimestamp required in proof mode' };
  }
  const normalized = records.map((record, idx) => {
    const rec = (record && typeof record === 'object' && !Array.isArray(record)) ? { ...record } : {};
    rec.entrySource = rec.entrySource || meta.entrySource || 'api-bridge';
    rec.sourceSystem = rec.sourceSystem || meta.sourceSystem || 'api-bridge';
    rec.sourceId = rec.sourceId || meta.sourceId || `${meta.routeId || 'route'}-${idx + 1}`;
    rec.eventTimestamp = rec.eventTimestamp || meta.eventTimestamp || new Date().toISOString();
    return rec;
  });
  return { ok: true, records: normalized };
}

function relayIngestBatch(routeId, records) {
  const result = ingestBatch(routeId, records, relayState, ensureCellIndex);
  if (result.ingested > 0 && result.sheetId) {
    recomputeModuleChain(result.sheetId);
  }
  return result;
}

async function bootstrapRuntime() {
  const p2pModule = JSON.parse(await fs.readFile(path.join(ROOT, 'config/modules/p2p-module.json'), 'utf8'));
  const mfgModule = JSON.parse(await fs.readFile(path.join(ROOT, 'config/modules/mfg-module.json'), 'utf8'));
  const p2pRoutes = JSON.parse(await fs.readFile(path.join(ROOT, 'config/routes/p2p-routes.json'), 'utf8'));
  const mfgRoutes = JSON.parse(await fs.readFile(path.join(ROOT, 'config/routes/mfg-routes.json'), 'utf8'));

  const trunk = {
    id: 'trunk.d3',
    type: 'trunk',
    name: 'D3 Runtime',
    lat: 32.0853,
    lon: 34.7818,
    alt: 2000
  };
  relayState.tree.nodes = [trunk];
  relayState.tree.edges = [];

  const p2p = loadModule(p2pModule, trunk);
  const mfg = loadModule(mfgModule, trunk);
  relayState.tree.nodes.push(...p2p.nodes, ...mfg.nodes);
  relayState.tree.edges.push(...p2p.edges, ...mfg.edges);
  registerModule(p2pModule);
  registerModule(mfgModule);
  loadRoutes(p2pRoutes);
  loadRoutes(mfgRoutes);
}

async function main() {
  await bootstrapRuntime();
  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      sendJson(res, 204, { ok: true });
      return;
    }
    if (req.method === 'GET' && req.url === '/health') {
      sendJson(res, 200, { ok: true, service: 'd3-ingest-server' });
      return;
    }
    if (req.method === 'GET' && req.url === '/debug/state-hashes') {
      sendJson(res, 200, { ok: true, ...buildStateHashes() });
      return;
    }
    if (req.method === 'POST' && req.url === '/ingest') {
      const relayKey = String(req.headers['x-relay-key'] || '');
      if (!relayKey) {
        RelayLog.warn('[REFUSAL] reason=D3_AUTH_MISSING');
        sendJson(res, 401, { ok: false, reason: 'D3_AUTH_MISSING' });
        return;
      }
      if (relayKey !== RELAY_KEY) {
        RelayLog.warn('[REFUSAL] reason=D3_AUTH_INVALID');
        sendJson(res, 403, { ok: false, reason: 'D3_AUTH_INVALID' });
        return;
      }
      if (!consumeRateToken(relayKey)) {
        RelayLog.warn('[REFUSAL] reason=D3_RATE_LIMIT');
        sendJson(res, 429, { ok: false, reason: 'D3_RATE_LIMIT' });
        return;
      }

      let body = null;
      try {
        const bodyText = await readBody(req);
        body = JSON.parse(bodyText || '{}');
      } catch (err) {
        RelayLog.warn('[REFUSAL] reason=D3_PAYLOAD_INVALID');
        sendJson(res, 400, { ok: false, reason: 'D3_PAYLOAD_INVALID', detail: String(err?.message || err) });
        return;
      }
      try {
        const routeId = String(body?.routeId || '').trim();
        const recordsInput = body?.records;
        const meta = (body?.meta && typeof body.meta === 'object') ? { ...body.meta } : {};
        meta.routeId = routeId;
        const proofMode = String(req.headers['x-relay-proof'] || '') === '1';

        if (!routeId || !recordsInput) {
          RelayLog.warn('[REFUSAL] reason=D3_PAYLOAD_INVALID');
          sendJson(res, 400, { ok: false, reason: 'D3_PAYLOAD_INVALID' });
          return;
        }
        const route = getRoute(routeId);
        if (!route) {
          RelayLog.warn('[REFUSAL] reason=D3_ROUTE_UNKNOWN');
          sendJson(res, 404, { ok: false, reason: 'D3_ROUTE_UNKNOWN', routeId });
          return;
        }
        const normalizedResult = normalizeRecords(recordsInput, meta, proofMode);
        if (!normalizedResult.ok) {
          RelayLog.warn(`[REFUSAL] reason=${normalizedResult.reason}`);
          sendJson(res, 400, { ok: false, reason: normalizedResult.reason, detail: normalizedResult.detail || null });
          return;
        }

        const result = relayIngestBatch(routeId, normalizedResult.records);
        RelayLog.info(`[D3] ingest route=${routeId} records=${normalizedResult.records.length} result=PASS`);
        sendJson(res, 200, {
          ok: true,
          routeId,
          ingested: result.ingested,
          failed: result.failed,
          sheetId: result.sheetId
        });
      } catch (err) {
        RelayLog.warn(`[REFUSAL] reason=D3_BLOCKER_RUNTIME_INGEST detail=${String(err?.message || err)}`);
        sendJson(res, 500, { ok: false, reason: 'D3_BLOCKER_RUNTIME_INGEST', detail: String(err?.message || err) });
      }
      return;
    }

    sendJson(res, 404, { ok: false, reason: 'NOT_FOUND' });
  });

  server.listen(PORT, () => {
    RelayLog.info(`[D3] server listening port=${PORT}`);
  });
}

main().catch((err) => {
  RelayLog.error(`[D3] fatal=${err?.stack || err}`);
  process.exitCode = 1;
});

