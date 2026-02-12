import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `f0-flow-proof-console-${DATE_TAG}.log`);
const APP_URL = 'http://localhost:3000/relay-cesium-world.html';

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch {
      // retry
    }
    await sleep(500);
  }
  return false;
}

async function startDevServer() {
  const child = spawn(process.execPath, ['scripts/dev-server.mjs'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  const ready = await waitForServer(APP_URL, 60000);
  if (!ready) {
    child.kill('SIGINT');
    throw new Error('DEV_SERVER_NOT_READY');
  }
  return child;
}

async function stopDevServer(child) {
  if (!child || child.killed) return;
  child.kill('SIGINT');
  await Promise.race([
    new Promise((resolve) => child.once('close', resolve)),
    sleep(3000).then(() => {
      if (!child.killed) child.kill('SIGKILL');
    })
  ]);
}

async function runScenario(page, suffix = 'A') {
  return page.evaluate(async (tag) => {
    const fnv1a = (text) => {
      let hash = 0x811c9dc5;
      const src = String(text || '');
      for (let i = 0; i < src.length; i += 1) {
        hash ^= src.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
      }
      return `0x${(hash >>> 0).toString(16).padStart(8, '0')}`;
    };
    const canonicalize = (input) => {
      if (input === null || typeof input === 'undefined') return null;
      if (typeof input === 'number') return Number.isFinite(input) ? Number(input.toFixed(6)) : null;
      if (typeof input !== 'object') return input;
      if (Array.isArray(input)) return input.map(canonicalize);
      const out = {};
      Object.keys(input).sort().forEach((k) => { out[k] = canonicalize(input[k]); });
      return out;
    };
    const normalizeFlow = (flow) => {
      if (!flow) return null;
      return {
        version: flow.version,
        scope: flow.scope,
        createdBy: flow.createdBy,
        intent: flow.intent,
        tags: flow.tags || [],
        startTargetRef: flow.startTargetRef || null,
        steps: (flow.steps || []).map((s) => ({
          kind: s.kind,
          targetRef: s.targetRef || null,
          note: s.note || '',
          actionId: s.actionId || null,
          params: s.params || null
        })),
        referencedObjectIds: (flow.referencedObjectIds || []).slice().sort(),
        // Keep deterministic camera signature without volatile pose deltas.
        cameraWaypointCount: Array.isArray(flow.cameraWaypoints) ? flow.cameraWaypoints.length : 0,
        cameraWaypointLods: (flow.cameraWaypoints || []).map((w) => w.lod || null),
        inputFingerprint: flow.inputFingerprint,
        status: flow.status,
        outcome: flow.outcome,
        summary: flow.summary
      };
    };

    const matchTarget = { type: 'match', id: '3WM-001' };
    const started = window.relayFlowStart({
      targetRef: matchTarget,
      intent: `Investigate mismatch path ${tag}`,
      tags: ['p2p', 'match', 'proof'],
      scope: 'zone.avgol.ops'
    });
    if (!started?.ok) return { ok: false, reason: `FLOW_START_FAILED:${started?.reason || 'UNKNOWN'}` };
    const flowId = started.flowId;

    const steps = [
      { kind: 'inspect', targetRef: matchTarget, note: 'Inspect match row' },
      { kind: 'focus', targetRef: { type: 'sheet', id: 'P2P.ThreeWayMatch' }, note: 'Focus on match sheet' },
      { kind: 'action', targetRef: matchTarget, actionId: 'focusView', params: {} },
      { kind: 'inspect', targetRef: { type: 'sheet', id: 'P2P.MatchRateSummary' }, note: 'Read summary' },
      { kind: 'action', targetRef: { type: 'branch', id: 'branch.p2p' }, actionId: 'showKPIs', params: {} },
      { kind: 'note', targetRef: matchTarget, note: 'No commit in flow playback' }
    ];
    for (const step of steps) {
      const rec = window.relayFlowStep(step);
      if (!rec?.ok) return { ok: false, reason: `FLOW_STEP_FAILED:${rec?.reason || 'UNKNOWN'}` };
      if (step.actionId) {
        window.relayInvokeAction(step.actionId, {
          targetRef: step.targetRef,
          params: step.params || {},
          uiSource: 'f0-proof'
        });
      }
    }
    const ended = window.relayFlowEnd({
      outcome: 'resolved',
      summary: 'Flow capture completed in proof run'
    });
    if (!ended?.ok) return { ok: false, reason: `FLOW_END_FAILED:${ended?.reason || 'UNKNOWN'}` };
    const stored = window.relayGetFlow(flowId);
    if (!stored) return { ok: false, reason: 'FLOW_NOT_STORED' };

    // Force stale path to ensure stale log path remains runnable.
    stored.inputFingerprint = '0xdeadbeef';
    const all = window.relayGetFlows() || [];
    const idx = all.findIndex((f) => String(f.flowId) === String(flowId));
    if (idx >= 0) {
      window.__relayFlows[idx].inputFingerprint = '0xdeadbeef';
    }
    const played = await window.relayFlowPlay(flowId, { mode: 'guided' });
    if (!played?.ok) return { ok: false, reason: `FLOW_PLAY_FAILED:${played?.reason || 'UNKNOWN'}` };

    const after = window.relayGetFlow(flowId);
    const normalized = normalizeFlow(after);
    const hash = fnv1a(JSON.stringify(canonicalize(normalized)));
    return {
      ok: true,
      flowId,
      steps: (after?.steps || []).length,
      referencedObjectIds: (after?.referencedObjectIds || []).slice().sort(),
      playbackOk: played.ok === true,
      playbackDurationMs: Number(played.durationMs || 0),
      fingerprint: String(after?.inputFingerprint || ''),
      hash
    };
  }, suffix);
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let server = null;
  let browser = null;
  try {
    server = await startDevServer();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[FLOW]')) log(text);
    });
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayFlowStart === 'function'
        && typeof window.relayFlowStep === 'function'
        && typeof window.relayFlowEnd === 'function'
        && typeof window.relayFlowPlay === 'function'
        && typeof window.relayGetFlow === 'function'
        && typeof window.relayInvokeAction === 'function',
      undefined,
      { timeout: 120000 }
    );

    const runA = await runScenario(page, 'A');
    if (!runA.ok) throw new Error(runA.reason || 'RUN_A_FAIL');
    log(`[F0] record result=PASS flowId=${runA.flowId} steps=${runA.steps}`);
    log(`[F0] playback result=${runA.playbackOk ? 'PASS' : 'FAIL'} flowId=${runA.flowId} durationMs=${runA.playbackDurationMs}`);
    log(`[F0] references result=${runA.referencedObjectIds.length > 0 ? 'PASS' : 'FAIL'} count=${runA.referencedObjectIds.length}`);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayFlowStart === 'function' && typeof window.relayFlowPlay === 'function',
      undefined,
      { timeout: 120000 }
    );
    const runB = await runScenario(page, 'A');
    if (!runB.ok) throw new Error(runB.reason || 'RUN_B_FAIL');
    const deterministic = runA.hash === runB.hash;
    log(`[F0] determinism result=${deterministic ? 'PASS' : 'FAIL'} hashA=${runA.hash} hashB=${runB.hash}`);

    const pass = runA.playbackOk && runA.steps >= 5 && runA.referencedObjectIds.length > 0 && deterministic;
    log(`[F0] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=F0_BLOCKER_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

await main();
