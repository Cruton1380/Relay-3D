import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `presence-commit-boundary-1-console-${DATE_TAG}.log`);
const SHOT_DIR = path.join(PROOFS_DIR, `presence-commit-boundary-1-${DATE_TAG}`);
const URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=launch';

const lines = [];
const log = (s) => { const m = String(s); lines.push(m); console.log(m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForUrl(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch {}
    await sleep(500);
  }
  return false;
}

async function startDevIfNeeded() {
  const ready = await waitForUrl('http://127.0.0.1:3000/relay-cesium-world.html', 2500);
  if (ready) return null;
  const child = spawn(process.execPath, ['scripts/dev-server.mjs'], {
    cwd: ROOT, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env }
  });
  await waitForUrl('http://127.0.0.1:3000/relay-cesium-world.html', 30000);
  return child;
}

const results = [];
const stage = (n, label, ok) => {
  const result = ok ? 'PASS' : 'FAIL';
  results.push({ n, label, result });
  log(`[PRESENCE-COMMIT-BOUNDARY-1-PROOF] stage=${n} label=${label} result=${result}`);
};

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  await fs.mkdir(SHOT_DIR, { recursive: true });
  const dev = await startDevIfNeeded();

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const consoleLogs = [];
  page.on('console', (m) => consoleLogs.push(m.text()));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() =>
    typeof window.relayPresenceGetSnapshot === 'function' &&
    typeof window.relayCallCommitRequest === 'function' &&
    typeof window.relayCallCommitVote === 'function' &&
    typeof window.relayCallCommitGetState === 'function'
  , { timeout: 30000 });
  await sleep(1500);

  try {
    // ═══ Stage 1: Boot + regressions sanity ═══
    const s1 = await page.evaluate(() => {
      const snap = window.relayPresenceGetSnapshot();
      const commitState = window.relayCallCommitGetState();
      return {
        presenceEnabled: snap.enabled === true,
        roomActive: !!snap.primaryRoomId,
        memberCount: snap.memberCount,
        commitIdle: commitState.state === 'IDLE'
      };
    });
    stage(1, 'boot-regressions-sanity', s1.presenceEnabled && s1.roomActive && s1.memberCount >= 1 && s1.commitIdle);

    // ═══ Stage 2: Join room with 2 simulated users ═══
    const s2 = await page.evaluate(() => {
      const eng = window._presenceEngine;
      const snap = eng.snapshot();
      const roomId = snap.primaryRoomId;
      const room = eng.rooms.get(roomId);
      // Add a second simulated user
      const remoteId = 'user.remote.sim1';
      room.set(remoteId, {
        userId: remoteId,
        lastSeenTs: Date.now(),
        effectiveScope: 'company',
        scopeId: snap.scopeId || 'trunk.avgol',
        focusId: null,
        ride: null,
        tier: 0
      });
      // Track in userRooms
      if (!eng.userRooms.has(remoteId)) eng.userRooms.set(remoteId, new Set());
      eng.userRooms.get(remoteId).add(roomId);
      const newSnap = eng.snapshot();
      return {
        roomId,
        memberCount: newSnap.memberCount,
        localUserId: eng._localUserId
      };
    });
    stage(2, 'join-room-2-users', s2.memberCount >= 2);

    // ═══ Stage 3: Trigger "Commit Call Summary" → COLLECTING ═══
    const m3 = consoleLogs.length;
    const s3 = await page.evaluate(() => {
      return window.relayCallCommitRequest({
        title: 'Q2 budget alignment — Avgol Finance (12m)',
        callStartedAt: Date.now() - 720000
      });
    });
    await sleep(300);
    const hasRequestLog = consoleLogs.slice(m3).some(l => l.includes('[CALL] commitSummary requested'));
    const hasConsentSent = consoleLogs.slice(m3).some(l => l.includes('[CALL] consent request sent'));
    stage(3, 'trigger-commit-collecting', s3.ok && s3.state === 'COLLECTING' && hasRequestLog && hasConsentSent);

    // ═══ Stage 4: One user accepts → still COLLECTING ═══
    const m4 = consoleLogs.length;
    const s4 = await page.evaluate(async () => {
      const localId = window._presenceEngine._localUserId;
      return await window.relayCallCommitVote(localId, 'accept');
    });
    await sleep(300);
    const hasVoteLog1 = consoleLogs.slice(m4).some(l => l.includes('[CALL] consent vote') && l.includes('value=accept'));
    const stillCollecting = consoleLogs.slice(m4).some(l => l.includes('[CALL] consent state=COLLECTING'));
    stage(4, 'one-accept-still-collecting', s4.ok && s4.state === 'COLLECTING' && s4.missing === 1 && hasVoteLog1 && stillCollecting);

    // ═══ Stage 5: Second user accepts → GRANTED ═══
    const m5 = consoleLogs.length;
    const s5 = await page.evaluate(async () => {
      return await window.relayCallCommitVote('user.remote.sim1', 'accept');
    });
    await sleep(500); // allow console logs to flush
    const hasGranted = consoleLogs.slice(m5).some(l => l.includes('[CALL] consent state=GRANTED'));
    stage(5, 'second-accept-granted', s5.ok && s5.state === 'GRANTED' && hasGranted);

    // ═══ Stage 6: PROPOSE artifact created + hashes computed ═══
    await sleep(300);
    const hasPropose = consoleLogs.some(l => l.includes('[W0] artifact propose type=CALL_SUMMARY'));
    const hasHashes = consoleLogs.some(l => l.includes('[CALL] summary hashes summary='));
    stage(6, 'propose-artifact-hashes', hasPropose && hasHashes);

    // ═══ Stage 7: Timebox event appended ═══
    const hasTimeboxEvent = consoleLogs.some(l => l.includes('[TIMEBOX] event type=CALL_SUMMARY'));
    const s7 = await page.evaluate(() => {
      const trunkNode = (window.relayState?.tree?.nodes || []).find(n => n.type === 'trunk');
      if (!trunkNode?.timeboxes?.length) return { eventFound: false };
      const lastTb = trunkNode.timeboxes[trunkNode.timeboxes.length - 1];
      const callEvent = (lastTb.events || []).find(e => e.type === 'CALL_SUMMARY');
      if (!callEvent) return { eventFound: false };
      return {
        eventFound: true,
        hasSummaryHash: !!callEvent.summaryHash,
        hasConsentHash: !!callEvent.consentHash,
        hasScopeId: !!callEvent.scopeId,
        hasParticipantsCount: callEvent.participantsCount >= 2,
        hasDurationMs: callEvent.durationMs > 0
      };
    });
    stage(7, 'timebox-event-appended', hasTimeboxEvent && s7.eventFound && s7.hasSummaryHash && s7.hasConsentHash && s7.hasScopeId && s7.hasParticipantsCount);

    // ═══ Stage 8: Authority gate path ═══
    // The demo environment typically lacks authorityRef, so PROPOSE_ONLY is the expected path.
    const hasCommitGate = consoleLogs.some(l => l.includes('[CALL] commit gate'));
    const hasProposeOnly = consoleLogs.some(l => l.includes('result=PROPOSE_ONLY'));
    const hasAuthorityMissing = consoleLogs.some(l => l.includes('CALL_COMMIT_AUTHORITY_MISSING'));
    // Either PROPOSE_ONLY (missing authority) or COMMIT (authority present) is acceptable
    const commitPath = consoleLogs.some(l => l.includes('result=COMMIT') && l.includes('[CALL] commit gate'));
    stage(8, 'authority-gate-path', hasCommitGate && ((hasProposeOnly && hasAuthorityMissing) || commitPath));

    // Take a screenshot showing HUD state after commit
    await page.evaluate(() => window.relayRefreshHudNow());
    await sleep(300);
    await page.screenshot({ path: path.join(SHOT_DIR, '01-consent-proposal-hud.png') });

    // ═══ Stage 9: Denial/expiry path ═══
    // Fresh page to get clean state for the denial test
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() =>
      typeof window.relayCallCommitRequest === 'function' &&
      typeof window.relayCallCommitVote === 'function'
    , { timeout: 30000 });
    await sleep(1500);

    const m9 = consoleLogs.length;
    const s9 = await page.evaluate(async () => {
      const eng = window._presenceEngine;
      const snap = eng.snapshot();
      const roomId = snap.primaryRoomId;
      const room = eng.rooms.get(roomId);
      // Add remote user
      const remoteId = 'user.remote.deny1';
      room.set(remoteId, {
        userId: remoteId,
        lastSeenTs: Date.now(),
        effectiveScope: 'company',
        scopeId: snap.scopeId || 'trunk.avgol',
        focusId: null,
        ride: null,
        tier: 0
      });
      if (!eng.userRooms.has(remoteId)) eng.userRooms.set(remoteId, new Set());
      eng.userRooms.get(remoteId).add(roomId);

      // Request commit
      const reqResult = window.relayCallCommitRequest({ title: 'Denial test call' });
      if (!reqResult.ok) return { requestOk: false };

      // Local user accepts
      await window.relayCallCommitVote(eng._localUserId, 'accept');

      // Remote user DENIES
      const denyResult = await window.relayCallCommitVote(remoteId, 'deny');
      return {
        requestOk: true,
        denyState: denyResult.state,
        commitStateAfter: window.relayCallCommitGetState().state
      };
    });
    await sleep(300);
    const hasDeniedLog = consoleLogs.slice(m9).some(l => l.includes('[CALL] consent state=DENIED'));
    const hasDeniedRefusal = consoleLogs.slice(m9).some(l => l.includes('CALL_COMMIT_CONSENT_DENIED'));
    // Verify no PROPOSE or TIMEBOX event was created for the denied request
    const noProposeDenied = !consoleLogs.slice(m9).some(l => l.includes('[W0] artifact propose type=CALL_SUMMARY'));
    stage(9, 'denial-path', s9.requestOk && s9.denyState === 'DENIED' && hasDeniedLog && hasDeniedRefusal && noProposeDenied);

  } finally {
    await ctx.close();
    await browser.close();
    if (dev) dev.kill();
  }

  const pass = results.filter(r => r.result === 'PASS').length;
  const total = results.length;
  const gate = pass === total ? 'PASS' : 'FAIL';
  log(`[PRESENCE-COMMIT-BOUNDARY-1-PROOF] gate-summary result=${gate} stages=${pass}/${total}`);
  await fs.writeFile(LOG_FILE, lines.concat(consoleLogs).join('\n'), 'utf8');
  process.exit(gate === 'PASS' ? 0 : 2);
}

main().catch(async (err) => {
  log(`[FATAL] ${err.message}`);
  await fs.writeFile(LOG_FILE, lines.join('\n'), 'utf8');
  process.exit(2);
});
