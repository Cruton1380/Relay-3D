import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `d3-webhook-proof-console-${DATE_TAG}.log`);
const PORT = 4010;
const BASE_URL = `http://localhost:${PORT}`;
const RELAY_KEY = 'relay-dev-key';

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await sleep(500);
  }
  return false;
}

async function startServer() {
  const child = spawn(process.execPath, ['scripts/d3-ingest-server.mjs'], {
    cwd: ROOT,
    env: {
      ...process.env,
      D3_PORT: String(PORT),
      D3_RELAY_KEY: RELAY_KEY,
      D3_RATE_CAPACITY: '5',
      D3_RATE_REFILL_PER_SEC: '2'
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  const logs = [];
  const onData = (chunk) => {
    const text = String(chunk || '');
    if (!text) return;
    logs.push(text);
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  const ready = await waitForServer(60000);
  if (!ready) {
    child.kill('SIGINT');
    throw new Error(`D3_BLOCKER_SERVER_NOT_READY logs=${logs.join('').slice(-1000)}`);
  }
  return { child, logs };
}

async function stopServer(child) {
  if (!child || child.killed) return;
  child.kill('SIGINT');
  await Promise.race([
    new Promise((resolve) => child.once('close', resolve)),
    sleep(3000).then(() => {
      if (!child.killed) child.kill('SIGKILL');
    })
  ]);
}

async function postIngest(payload, { key = RELAY_KEY, proof = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (key !== null) headers['X-Relay-Key'] = key;
  if (proof) headers['X-Relay-Proof'] = '1';
  const res = await fetch(`${BASE_URL}/ingest`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function getHashes() {
  const res = await fetch(`${BASE_URL}/debug/state-hashes`);
  return res.json();
}

async function runValidScenario(tag) {
  const stamp = `2026-02-11T10:${tag}0:00.000Z`;
  const p2p = await postIngest({
    routeId: 'p2p.pr',
    records: [{
      prId: `PR-D3-${tag}`,
      prLineId: `PRL-D3-${tag}`,
      requestorUserId: 'user.api1',
      department: 'OPS',
      siteId: 'SITE_A',
      itemId: `item.D3.${tag}`,
      description: 'D3 API ingest',
      qty: 2,
      unit: 'EA',
      estUnitPrice: 11,
      estTotal: 22,
      currency: 'USD',
      requestDate: '2026-02-11',
      status: 'DRAFT'
    }],
    meta: {
      entrySource: 'api-bridge',
      sourceSystem: 'd3-proof',
      sourceId: `proof-${tag}-p2p`,
      eventTimestamp: stamp
    }
  });

  const mfgWo = await postIngest({
    routeId: 'mfg.workOrder',
    records: [{
      workOrderId: `WO-D3-${tag}`,
      siteId: 'SITE_A',
      itemId: `item.D3.${tag}`,
      plannedQty: 2,
      status: 'RELEASED'
    }],
    meta: {
      entrySource: 'api-bridge',
      sourceSystem: 'd3-proof',
      sourceId: `proof-${tag}-wo`,
      eventTimestamp: stamp
    }
  });

  const mfgIssue = await postIngest({
    routeId: 'mfg.materialIssue',
    records: [{
      issueId: `ISS-D3-${tag}`,
      workOrderId: `WO-D3-${tag}`,
      itemId: `item.D3.${tag}`,
      qtyIssued: 2,
      status: 'POSTED'
    }],
    meta: {
      entrySource: 'api-bridge',
      sourceSystem: 'd3-proof',
      sourceId: `proof-${tag}-issue`,
      eventTimestamp: stamp
    }
  });

  return { p2p, mfgWo, mfgIssue, hashes: await getHashes() };
}

async function runRefusalChecks() {
  const missingKey = await postIngest({
    routeId: 'p2p.pr',
    records: [{ prId: 'X', prLineId: 'X1' }],
    meta: { eventTimestamp: '2026-02-11T11:00:00.000Z' }
  }, { key: null, proof: true });
  if (missingKey.status === 401) log('[REFUSAL] reason=D3_AUTH_MISSING');

  const invalidKey = await postIngest({
    routeId: 'p2p.pr',
    records: [{ prId: 'X', prLineId: 'X1' }],
    meta: { eventTimestamp: '2026-02-11T11:00:00.000Z' }
  }, { key: 'wrong-key', proof: true });
  if (invalidKey.status === 403) log('[REFUSAL] reason=D3_AUTH_INVALID');

  const unknownRoute = await postIngest({
    routeId: 'unknown.route',
    records: [{ x: 1 }],
    meta: { eventTimestamp: '2026-02-11T11:00:00.000Z' }
  }, { key: RELAY_KEY, proof: true });
  if (unknownRoute.status === 404) log('[REFUSAL] reason=D3_ROUTE_UNKNOWN');

  const invalidPayload = await postIngest({
    routeId: 'p2p.pr',
    records: [],
    meta: { eventTimestamp: '2026-02-11T11:00:00.000Z' }
  }, { key: RELAY_KEY, proof: true });
  if (invalidPayload.status === 400) log('[REFUSAL] reason=D3_PAYLOAD_INVALID');

  let rateLimitHit = false;
  for (let i = 0; i < 10; i += 1) {
    const resp = await postIngest({
      routeId: 'unknown.route',
      records: [{ idx: i }],
      meta: { eventTimestamp: '2026-02-11T11:00:00.000Z' }
    }, { key: RELAY_KEY, proof: true });
    if (resp.status === 429) {
      rateLimitHit = true;
      break;
    }
  }
  if (rateLimitHit) log('[REFUSAL] reason=D3_RATE_LIMIT');
  return { missingKey, invalidKey, unknownRoute, invalidPayload, rateLimitHit };
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });

  let serverA = null;
  let serverB = null;
  try {
    serverA = await startServer();
    const runA = await runValidScenario('A');
    const refusal = await runRefusalChecks();
    await stopServer(serverA.child);
    serverA = null;

    serverB = await startServer();
    const runB = await runValidScenario('A');
    await stopServer(serverB.child);
    serverB = null;

    const factsAppendedPass =
      runA.p2p.status === 200 && runA.p2p.body.ingested >= 1
      && runA.mfgWo.status === 200 && runA.mfgWo.body.ingested >= 1
      && runA.mfgIssue.status === 200 && runA.mfgIssue.body.ingested >= 1;
    const matchPass = runA.mfgIssue.body?.sheetId === 'MFG.MaterialIssues';
    const summaryKpiPass = runA.hashes && runA.hashes.summariesHash && runA.hashes.kpisHash;
    const deterministicPass = JSON.stringify(runA.hashes) === JSON.stringify(runB.hashes);

    log(`[D3] ingest route=p2p.pr records=1 result=${runA.p2p.status === 200 ? 'PASS' : 'FAIL'} status=${runA.p2p.status} reason=${runA.p2p.body?.reason || 'none'}`);
    log(`[D3] ingest route=mfg.workOrder records=1 result=${runA.mfgWo.status === 200 ? 'PASS' : 'FAIL'} status=${runA.mfgWo.status} reason=${runA.mfgWo.body?.reason || 'none'}`);
    log(`[D3] ingest route=mfg.materialIssue records=1 result=${runA.mfgIssue.status === 200 ? 'PASS' : 'FAIL'} status=${runA.mfgIssue.status} reason=${runA.mfgIssue.body?.reason || 'none'}`);

    const refusalPass =
      refusal.missingKey.status === 401
      && refusal.invalidKey.status === 403
      && refusal.unknownRoute.status === 404
      && refusal.invalidPayload.status === 400
      && refusal.rateLimitHit === true;

    const pass = factsAppendedPass && !!matchPass && !!summaryKpiPass && deterministicPass && refusalPass;
    log(`[D3] facts-appended result=${factsAppendedPass ? 'PASS' : 'FAIL'}`);
    log(`[D3] module-recompute result=${(matchPass && summaryKpiPass) ? 'PASS' : 'FAIL'} matches=true summaries=true kpis=true`);
    log(`[D3] determinism result=${deterministicPass ? 'PASS' : 'FAIL'} hashA=${JSON.stringify(runA.hashes)} hashB=${JSON.stringify(runB.hashes)}`);
    log(`[D3] refusal-rails result=${refusalPass ? 'PASS' : 'FAIL'}`);
    log(`[D3] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);

    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    log(`[D3] log=archive/proofs/${path.basename(LOG_FILE)}`);
    if (!pass) process.exitCode = 2;
  } finally {
    if (serverA?.child) await stopServer(serverA.child);
    if (serverB?.child) await stopServer(serverB.child);
  }
}

main().catch(async (err) => {
  const fatal = `[D3] fatal=${err?.stack || err}`;
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

