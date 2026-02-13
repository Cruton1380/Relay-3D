import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { projectJournalFromTransferPackets, computeTrialBalance } from '../core/models/ledger/ledger-v0.js';
import { LEDGER_MAPPING_POLICY_V0 } from '../core/models/ledger/coa-seed-v0.js';
import { buildTier1ParityFixture, computeTier1GoldenHashesFromFixture } from '../core/models/headless/tier1-parity.js';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-12';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `osv1-full-system-proof-console-${DATE_TAG}.log`);
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

const isTrialBalanceBalanced = (trialBalanceRows) => {
  const totals = new Map();
  for (const row of (trialBalanceRows || [])) {
    const unit = String(row?.unit || '');
    const debit = Number(row?.debit || 0);
    const credit = Number(row?.credit || 0);
    const next = Number((totals.get(unit) || 0) + debit - credit);
    totals.set(unit, next);
  }
  return Array.from(totals.values()).every((v) => Math.abs(v) < 1e-6);
};

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let server = null;
  let browser = null;
  try {
    server = await startDevServer();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const moveLogs = [];
    const lensLogs = [];
    const refusalLogs = [];
    page.on('console', (msg) => {
      const t = msg.text();
      if (t.includes('[MOVE]')) moveLogs.push(t);
      if (t.includes('[LENS]')) lensLogs.push(t);
      if (t.includes('[REFUSAL]')) refusalLogs.push(t);
    });

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayP2PRunHappyLoop === 'function'
        && typeof window.relayGetTransferPackets === 'function'
        && typeof window.relayGetResponsibilityPackets === 'function'
        && typeof window.relayGetP2PCoreState === 'function'
        && typeof window.relayGetTrunkMetrics === 'function'
        && typeof window.relayApplyCameraPreset === 'function'
        && typeof window.relayGetBasinState === 'function'
        && typeof window.relayEnterBranchWalk === 'function'
        && typeof window.relayEnterFocus === 'function'
        && typeof window.relayExitFocus === 'function'
        && typeof window.relayFlowStart === 'function'
        && typeof window.relayFlowPlay === 'function'
        && typeof window.relaySCVAttemptExecute === 'function'
        && typeof window.relayCreateAuditRequest === 'function'
        && typeof window.relayGetGoldenStateHashes === 'function',
      undefined,
      { timeout: 120000 }
    );

    const p2pScenario = await page.evaluate(() => {
      window.relayResetP2PCoreState?.();
      const trunkBefore = window.relayGetTrunkMetrics?.() || { hash: null };
      const beforePackets = (window.relayGetTransferPackets?.() || []).length;
      const beforeResp = (window.relayGetResponsibilityPackets?.() || []).length;
      const result = window.relayP2PRunHappyLoop({
        siteId: 'SITE_A',
        itemId: 'item.OSV1',
        qty: 25,
        unitPrice: 80
      });
      const afterPacketsAll = (window.relayGetTransferPackets?.() || []);
      const afterRespAll = (window.relayGetResponsibilityPackets?.() || []);
      const packetsAdded = afterPacketsAll.length - beforePackets;
      const respAdded = afterRespAll.length - beforeResp;
      const latestPackets = afterPacketsAll.slice(-3);
      const allBalanced = latestPackets.every((tp) => window.relayValidateTransferPacket(tp)?.ok === true);
      const p2pCore = window.relayGetP2PCoreState?.() || {};
      const trunkAfter = window.relayGetTrunkMetrics?.() || { hash: null };
      return {
        cycleOk: !!(result?.pr?.id && result?.po?.id && result?.cgr?.ok && result?.cinv?.ok && result?.cpay?.ok),
        packetsAdded,
        respAdded,
        allBalanced,
        p2pCore,
        transferPackets: latestPackets,
        trunkBeforeHash: trunkBefore.hash || null,
        trunkAfterHash: trunkAfter.hash || null
      };
    });

    const mappingPolicy = {
      resolveAccount(containerRef) {
        const key = String((typeof containerRef === 'string') ? containerRef : (containerRef?.id || ''));
        return LEDGER_MAPPING_POLICY_V0.resolveAccount(key);
      }
    };
    const projectedJournal = projectJournalFromTransferPackets(p2pScenario.transferPackets || [], mappingPolicy);
    const trialBalance = computeTrialBalance(projectedJournal);
    const trialBalanceBalanced = isTrialBalanceBalanced(trialBalance);

    const p2pPass = p2pScenario.cycleOk
      && p2pScenario.packetsAdded >= 3
      && p2pScenario.respAdded >= 3
      && p2pScenario.allBalanced === true;
    const ledgerPass = projectedJournal.length > 0 && trialBalance.length > 0 && trialBalanceBalanced;
    const trunkPass = String(p2pScenario.trunkBeforeHash || '') !== String(p2pScenario.trunkAfterHash || '');
    log(`[OSV1] p2p-cycle result=${p2pPass ? 'PASS' : 'FAIL'}`);
    log(`[OSV1] ledger result=${ledgerPass ? 'PASS' : 'FAIL'}`);
    log(`[OSV1] trunk-aggregation result=${trunkPass ? 'PASS' : 'FAIL'}`);

    const cameraScenario = await page.evaluate(async (p2pState) => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const presetA = await window.relayApplyCameraPreset('cam.company.sideProfile');
      await wait(120);
      const basinA = window.relayGetBasinState?.() || {};
      await window.relaySetBasinSoftLock?.(true, basinA.targetId || null);
      await wait(80);
      await window.relaySetBasinSoftLock?.(false);
      const branchNodes = (window.relayState?.tree?.nodes || [])
        .filter((n) => n.type === 'branch')
        .slice()
        .sort((a, b) => String(a.id).localeCompare(String(b.id)));
      let walk = { ok: false };
      for (const branch of branchNodes) {
        // eslint-disable-next-line no-await-in-loop
        const enter = await window.relayEnterBranchWalk(branch.id);
        if (enter?.ok !== true) continue;
        // eslint-disable-next-line no-await-in-loop
        await window.relayBranchWalkNext();
        // eslint-disable-next-line no-await-in-loop
        await window.relayBranchWalkNext();
        // eslint-disable-next-line no-await-in-loop
        await window.relayBranchWalkPrev();
        // eslint-disable-next-line no-await-in-loop
        const exit = await window.relayExitBranchWalk();
        walk = { enter, exit, branchId: branch.id };
        if (exit?.ok === true) break;
      }
      const focusIn = await window.relayEnterFocus({ type: 'match', id: p2pState?.p2pCore?.lastMatchId || '3WM-001' });
      await wait(100);
      const focusOut = await window.relayExitFocus();
      return {
        presetA,
        basinActive: basinA.active === true || basinA.targetId !== null,
        walk,
        focusIn,
        focusOut
      };
    }, p2pScenario);

    const noTeleport = moveLogs.some((t) => t.includes('[MOVE] mode=travel'));
    const noTrap = cameraScenario.walk?.enter?.ok === true && cameraScenario.walk?.exit?.ok === true;
    const cameraPass = cameraScenario.presetA?.ok === true && noTeleport && noTrap;
    const focusPass = cameraScenario.focusIn?.ok === true && cameraScenario.focusOut?.ok === true
      && cameraScenario.focusOut?.selectionPreserved === true
      && cameraScenario.focusOut?.lodPreserved === true;
    log(`[OSV1] camera-continuity result=${cameraPass ? 'PASS' : 'FAIL'}`);
    log(`[OSV1] focus-continuity result=${focusPass ? 'PASS' : 'FAIL'}`);

    const flowRunA = await page.evaluate(async (p2pState) => {
      const fnv1a = (text) => {
        let h = 0x811c9dc5;
        const src = String(text || '');
        for (let i = 0; i < src.length; i += 1) {
          h ^= src.charCodeAt(i);
          h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
        }
        return `0x${(h >>> 0).toString(16).padStart(8, '0')}`;
      };
      const normalize = (flow) => ({
        scope: flow.scope,
        intent: flow.intent,
        tags: flow.tags || [],
        startTargetRef: flow.startTargetRef || null,
        steps: (flow.steps || []).map((s) => ({ kind: s.kind, targetRef: s.targetRef || null, actionId: s.actionId || null })),
        referencedObjectIds: (flow.referencedObjectIds || []).slice().sort(),
        waypointCount: (flow.cameraWaypoints || []).length,
        status: flow.status,
        outcome: flow.outcome
      });
      const target = { type: 'match', id: p2pState?.p2pCore?.lastMatchId || '3WM-001' };
      const started = window.relayFlowStart({ targetRef: target, intent: 'Review open POs', tags: ['osv1', 'open-pos'], scope: 'zone.avgol.ops' });
      if (!started?.ok) return { ok: false, reason: started?.reason || 'FLOW_START_FAIL' };
      const flowId = started.flowId;
      window.relayFlowStep({ kind: 'inspect', targetRef: target, note: 'open po list' });
      window.relayFlowStep({ kind: 'focus', targetRef: { type: 'sheet', id: 'P2P.ThreeWayMatch' }, note: 'check matches' });
      window.relayFlowStep({ kind: 'inspect', targetRef: { type: 'match', id: '3WM-001' }, note: 'first mismatch' });
      window.relayFlowStep({ kind: 'inspect', targetRef: { type: 'sheet', id: 'P2P.MatchRateSummary' }, note: 'summary' });
      window.relayFlowEnd({ outcome: 'reviewed', summary: 'OSV1 open PO review done' });
      const played = await window.relayFlowPlay(flowId, { mode: 'guided' });
      const flow = window.relayGetFlow(flowId);
      if (!played?.ok || !flow) return { ok: false, reason: 'FLOW_PLAY_FAIL' };
      return { ok: true, hash: fnv1a(JSON.stringify(normalize(flow))) };
    }, p2pScenario);
    if (!flowRunA.ok) throw new Error(`FLOW_A:${flowRunA.reason}`);
    const flowRunB = await page.evaluate(async (p2pState) => {
      const fnv1a = (text) => {
        let h = 0x811c9dc5;
        const src = String(text || '');
        for (let i = 0; i < src.length; i += 1) {
          h ^= src.charCodeAt(i);
          h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
        }
        return `0x${(h >>> 0).toString(16).padStart(8, '0')}`;
      };
      const normalize = (flow) => ({
        scope: flow.scope,
        intent: flow.intent,
        tags: flow.tags || [],
        startTargetRef: flow.startTargetRef || null,
        steps: (flow.steps || []).map((s) => ({ kind: s.kind, targetRef: s.targetRef || null, actionId: s.actionId || null })),
        referencedObjectIds: (flow.referencedObjectIds || []).slice().sort(),
        waypointCount: (flow.cameraWaypoints || []).length,
        status: flow.status,
        outcome: flow.outcome
      });
      const target = { type: 'match', id: p2pState?.p2pCore?.lastMatchId || '3WM-001' };
      const started = window.relayFlowStart({ targetRef: target, intent: 'Review open POs', tags: ['osv1', 'open-pos'], scope: 'zone.avgol.ops' });
      if (!started?.ok) return { ok: false, reason: started?.reason || 'FLOW_START_FAIL' };
      const flowId = started.flowId;
      window.relayFlowStep({ kind: 'inspect', targetRef: target, note: 'open po list' });
      window.relayFlowStep({ kind: 'focus', targetRef: { type: 'sheet', id: 'P2P.ThreeWayMatch' }, note: 'check matches' });
      window.relayFlowStep({ kind: 'inspect', targetRef: { type: 'match', id: '3WM-001' }, note: 'first mismatch' });
      window.relayFlowStep({ kind: 'inspect', targetRef: { type: 'sheet', id: 'P2P.MatchRateSummary' }, note: 'summary' });
      window.relayFlowEnd({ outcome: 'reviewed', summary: 'OSV1 open PO review done' });
      const played = await window.relayFlowPlay(flowId, { mode: 'guided' });
      const flow = window.relayGetFlow(flowId);
      if (!played?.ok || !flow) return { ok: false, reason: 'FLOW_PLAY_FAIL' };
      return { ok: true, hash: fnv1a(JSON.stringify(normalize(flow))) };
    }, p2pScenario);
    if (!flowRunB.ok) throw new Error(`FLOW_B:${flowRunB.reason}`);
    const flowPass = flowRunA.hash === flowRunB.hash;
    log(`[OSV1] flow-playback result=${flowPass ? 'PASS' : 'FAIL'}`);

    const fixture = buildTier1ParityFixture();
    const headlessBundle = computeTier1GoldenHashesFromFixture(fixture, { allowKpiNA: true });
    const browserBundle = await page.evaluate((fixtureArg) => {
      window.relayLoadHeadlessParityFixture(fixtureArg);
      return window.relayGetGoldenStateHashes({ source: 'fixture', allowKpiNA: true });
    }, fixture);
    const parityPass =
      String(headlessBundle.factsHash) === String(browserBundle.factsHash)
      && String(headlessBundle.matchesHash) === String(browserBundle.matchesHash)
      && String(headlessBundle.summariesHash) === String(browserBundle.summariesHash)
      && String(headlessBundle.kpisHash) === String(browserBundle.kpisHash)
      && String(headlessBundle.packetsHash) === String(browserBundle.packetsHash)
      && String(headlessBundle.ledgerHash) === String(browserBundle.ledgerHash);
    log(`[OSV1] headless-parity result=${parityPass ? 'PASS' : 'FAIL'}`);

    const refusalChecks = await page.evaluate(() => {
      const mismatch = window.relayP2PRunMismatchLoop({
        siteId: 'SITE_A',
        itemId: 'item.OSV1.MISMATCH',
        qty: 7,
        baseUnitPrice: 10,
        invUnitPrice: 14
      });
      const mismatchRefusal = mismatch?.fail?.ok === false;
      const mismatchVariance = mismatch?.pass?.ok === true;
      window.__relayStageState = { gsgByScope: { 'zone.avgol.ops': 1 }, isgByUser: {} };
      const stageLocked = window.relayCreateAuditRequest({
        targetObjectId: 'module.P2P',
        scope: 'zone.avgol.ops',
        requestedBy: 'manager.osv1',
        outputType: 'finding',
        constraints: { timebox: '2026-Q1' },
        stageGateAction: 'policyMutation'
      });
      const scv = window.relaySCVAttemptExecute('scv.coherence', 'postCommit');
      return {
        mismatchRefusal,
        mismatchReason: mismatch?.fail?.reason || 'n/a',
        mismatchVariance,
        stageLocked: stageLocked?.ok === false && String(stageLocked?.reason || '') === 'STAGE_LOCKED',
        stageReason: stageLocked?.reason || 'n/a',
        scvRefused: scv?.ok === false && String(scv?.reason || '') === 'SCV_EXECUTION_FORBIDDEN',
        scvReason: scv?.reason || 'n/a'
      };
    });
    log(`[REFUSAL] reason=${refusalChecks.mismatchReason}`);
    log(`[REFUSAL] reason=${refusalChecks.stageReason}`);
    log(`[REFUSAL] reason=${refusalChecks.scvReason}`);
    const refusalPass = refusalChecks.mismatchRefusal && refusalChecks.mismatchVariance && refusalChecks.stageLocked && refusalChecks.scvRefused;
    log(`[OSV1] refusal-rails result=${refusalPass ? 'PASS' : 'FAIL'}`);

    const requiredMoveLogs = moveLogs.some((t) => t.includes('mode=travel'))
      && moveLogs.some((t) => t.includes('mode=branch'))
      && moveLogs.some((t) => t.includes('branch-step'));
    const requiredLensLogs = lensLogs.some((t) => t.includes('focus-enter')) && lensLogs.some((t) => t.includes('focus-exit'));
    const refusalLogPresence = refusalLogs.some((t) => t.includes('MATCH_GATE_FAIL'))
      && refusalLogs.some((t) => t.includes('STAGE_LOCKED'))
      && refusalLogs.some((t) => t.includes('SCV_EXECUTION_FORBIDDEN'));

    const pass = p2pPass
      && ledgerPass
      && trunkPass
      && cameraPass
      && focusPass
      && flowPass
      && parityPass
      && refusalPass
      && requiredMoveLogs
      && requiredLensLogs
      && refusalLogPresence;
    log(`[OSV1] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=OSV1_BLOCKER_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

await main();

