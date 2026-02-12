import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `l0-presence-primitives-proof-console-${DATE_TAG}.log`);
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

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let server = null;
  let browser = null;
  try {
    server = await startDevServer();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relaySetPresenceMarker === 'function'
        && typeof window.relaySetPresenceConsent === 'function'
        && typeof window.relayGetPresenceState === 'function',
      undefined,
      { timeout: 120000 }
    );

    const out = await page.evaluate(async () => {
      const denied = window.relaySetPresenceMarker({
        actorId: 'user.l0',
        actorType: 'user',
        tier: 2,
        focusObjectId: 'sheet.P2P.InvoiceLines'
      });
      window.relaySetPresenceConsent('user.l0', true);
      const accepted = window.relaySetPresenceMarker({
        actorId: 'user.l0',
        actorType: 'user',
        tier: 1,
        focusObjectId: 'sheet.P2P.InvoiceLines',
        ttlMs: 90
      });
      const moved = window.relaySetPresenceMarker({
        actorId: 'user.l0',
        actorType: 'user',
        tier: 1,
        focusObjectId: 'sheet.P2P.ThreeWayMatch',
        ttlMs: 90,
        position: { x: 10, y: 2, z: 1 }
      });
      const withTrail = window.relaySetPresenceMarker({
        actorId: 'user.l0',
        actorType: 'user',
        tier: 1,
        focusObjectId: 'sheet.P2P.MatchRateSummary',
        ttlMs: 90,
        position: { x: 11, y: 2, z: 1 }
      });
      const afterSet = window.relayGetPresenceState();
      await new Promise((resolve) => setTimeout(resolve, 140));
      window.relaySweepPresence();
      const afterTtl = window.relayGetPresenceState();
      return {
        denied,
        accepted,
        moved,
        withTrail,
        markersAfterSet: (afterSet.markers || []).length,
        trailsAfterSet: (afterSet.trails || []).length,
        markersAfterTtl: (afterTtl.markers || []).length
      };
    });

    const consentPass = out.denied?.ok === false && String(out.denied?.reason) === 'PRESENCE_CONSENT_REQUIRED' && out.accepted?.ok === true;
    const focusPass = out.withTrail?.marker?.focusObjectId === 'sheet.P2P.MatchRateSummary';
    const trailPass = Number(out.trailsAfterSet || 0) >= 1;
    const ttlPass = Number(out.markersAfterSet || 0) >= 1 && Number(out.markersAfterTtl || 0) === 0;
    log(`[L0] consent-tier result=${consentPass ? 'PASS' : 'FAIL'} deniedReason=${out.denied?.reason || 'n/a'}`);
    log(`[L0] focus-binding result=${focusPass ? 'PASS' : 'FAIL'} focus=${out.withTrail?.marker?.focusObjectId || 'n/a'}`);
    log(`[L0] trail result=${trailPass ? 'PASS' : 'FAIL'} trails=${out.trailsAfterSet || 0}`);
    log(`[L0] ttl result=${ttlPass ? 'PASS' : 'FAIL'} before=${out.markersAfterSet || 0} after=${out.markersAfterTtl || 0}`);
    const pass = consentPass && focusPass && trailPass && ttlPass;
    log(`[L0] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=L0_BLOCKER_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

await main();
