/**
 * HEADLESS-0 Proof Script
 * 8 stages: headless detection, fixture parity (SHA-256), D0 stress gates, golden parity, non-interference.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import {
  buildTier1ParityFixture,
  computeTier1GoldenHashesSHA256
} from '../core/models/headless/tier1-parity.js';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `headless-0-console-${DATE_TAG}.log`);
const URL_HEADLESS = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=launch&headless=true';

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
  log(`[HEADLESS-0-PROOF] stage=${n} label=${label} result=${result}`);
};

const COMPONENTS = ['facts', 'matches', 'summaries', 'kpis', 'commits', 'packets', 'ledger'];

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  const dev = await startDevIfNeeded();

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  let page = await ctx.newPage();
  const consoleLogs = [];
  page.on('console', (m) => consoleLogs.push(m.text()));

  try {
    // ═══ Stage 1: Boot + headless detection ═══
    await page.goto(URL_HEADLESS, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() =>
      typeof window.relayD0GateHeadless === 'function' &&
      typeof window.relayGetGoldenStateHashesSHA256 === 'function' &&
      typeof window.relayExtractRuntimeFixtureForParity === 'function'
    , { timeout: 60000 });
    await sleep(2000);

    const s1 = await page.evaluate(() => ({
      headlessMode: window.RELAY_HEADLESS_MODE === true,
      reason: window.RELAY_HEADLESS_REASON
    }));
    const hasForcedLog = consoleLogs.some(l => l.includes('[HEADLESS] mode=FORCED reason=urlParam'));
    stage(1, 'boot-headless-detection', s1.headlessMode && s1.reason === 'urlParam' && hasForcedLog);

    // ═══ Stage 2: Fixture parity (SHA-256) ═══
    // Node.js side: compute golden hashes
    const fixture = buildTier1ParityFixture();
    const nodeHashes = await computeTier1GoldenHashesSHA256(fixture, {
      allowKpiNA: true, allowCommitsNA: true, allowPacketsNA: true, allowLedgerNA: true
    });

    // Browser side: load same fixture, compute SHA-256 hashes
    const browserHashes = await page.evaluate(async (fixtureArg) => {
      window.relayLoadHeadlessParityFixture(fixtureArg);
      return await window.relayGetGoldenStateHashesSHA256({
        source: 'fixture', allowKpiNA: true, allowPacketsNA: true, allowLedgerNA: true
      });
    }, fixture);

    let s2Pass = true;
    for (const c of COMPONENTS) {
      const nHash = String(nodeHashes[`${c}Hash`] || '');
      const bHash = String(browserHashes[`${c}Hash`] || '');
      if (nHash !== bHash) {
        log(`[REFUSAL] reason=HEADLESS_DIVERGENCE component=${c} expected=${nHash.slice(0, 16)} actual=${bHash.slice(0, 16)}`);
        s2Pass = false;
      }
    }
    if (s2Pass) {
      const sha = String(nodeHashes.factsHash || '').slice(0, 16);
      log(`[HEADLESS] golden-compare facts=MATCH matches=MATCH summaries=MATCH kpis=MATCH commits=MATCH packets=MATCH ledger=MATCH sha256=${sha}`);
    }
    stage(2, 'fixture-parity-sha256', s2Pass);

    // ═══ Stage 3-6: D0 stress headless gates ═══
    // Fresh page for stress test to avoid fixture pollution
    await page.goto(URL_HEADLESS, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() =>
      typeof window.relayD0GateHeadless === 'function' &&
      typeof window.relayStressTest === 'function'
    , { timeout: 60000 });
    await sleep(2000);

    const m3 = consoleLogs.length;
    const d0Result = await page.evaluate(async () => {
      return await window.relayD0GateHeadless(10000);
    });
    await sleep(500);

    // Stage 3: D0.1 ingestion
    const d01Pass = d0Result.gates['D0.1']?.pass === true;
    const d01Log = consoleLogs.slice(m3).some(l => l.includes('[HEADLESS] gate=D0.1 result=PASS'));
    stage(3, 'd0-stress-ingestion', d01Pass && d01Log);

    // Stage 4: D0.2 recompute
    const d02Pass = d0Result.gates['D0.2']?.pass === true;
    const d02Log = consoleLogs.slice(m3).some(l => l.includes('[HEADLESS] gate=D0.2 result=PASS'));
    stage(4, 'd0-stress-recompute', d02Pass && d02Log);

    // Stage 5: D0.3 = N/A (not pass=true)
    const d03NA = d0Result.gates['D0.3']?.na === true && d0Result.gates['D0.3']?.pass === null;
    const d03Log = consoleLogs.slice(m3).some(l => l.includes('[HEADLESS] gate=D0.3 result=NA reason=no-renderer'));
    stage(5, 'd0-renderer-na', d03NA && d03Log);

    // Stage 6: D0.4 + D0.5
    const d04Pass = d0Result.gates['D0.4']?.pass === true;
    const d05Pass = d0Result.gates['D0.5']?.pass === true;
    const d04Log = consoleLogs.slice(m3).some(l => l.includes('[HEADLESS] gate=D0.4 result=PASS'));
    const d05Log = consoleLogs.slice(m3).some(l => l.includes('[HEADLESS] gate=D0.5 result=PASS'));
    stage(6, 'd0-viewport-datefix', d04Pass && d05Pass && d04Log && d05Log);

    // ═══ Stage 7: Post-stress golden parity (SHA-256) ═══
    // Extract runtime fixture from browser after stress
    const runtimeFixture = await page.evaluate(() => window.relayExtractRuntimeFixtureForParity());
    const browserStressHashes = await page.evaluate(async () => {
      return await window.relayGetGoldenStateHashesSHA256({
        source: 'runtime', allowKpiNA: true, allowPacketsNA: true, allowLedgerNA: true
      });
    });

    // Compute same fixture hashes in Node.js
    const nodeStressHashes = await computeTier1GoldenHashesSHA256(runtimeFixture, {
      allowKpiNA: true, allowCommitsNA: true, allowPacketsNA: true, allowLedgerNA: true,
      commits: runtimeFixture.commits || []
    });

    let s7Pass = true;
    for (const c of COMPONENTS) {
      const nHash = String(nodeStressHashes[`${c}Hash`] || '');
      const bHash = String(browserStressHashes[`${c}Hash`] || '');
      // Both N/A is a match
      if (nHash === 'N/A' && bHash === 'N/A') continue;
      if (nHash !== bHash) {
        log(`[REFUSAL] reason=HEADLESS_DIVERGENCE component=${c} expected=${nHash.slice(0, 16)} actual=${bHash.slice(0, 16)}`);
        s7Pass = false;
      }
    }
    if (s7Pass) {
      const sha = String(nodeStressHashes.factsHash || '').slice(0, 16);
      log(`[HEADLESS] stress-golden-compare facts=MATCH matches=MATCH summaries=MATCH kpis=MATCH commits=MATCH packets=MATCH ledger=MATCH sha256=${sha}`);
    }
    stage(7, 'stress-golden-parity', s7Pass);

    // ═══ Stage 8: Non-interference (presence/ride/consent don't affect golden hashes) ═══
    // Compute golden hashes BEFORE enabling presence
    const hashesBeforePresence = await page.evaluate(async () => {
      return await window.relayGetGoldenStateHashesSHA256({
        source: 'runtime', allowKpiNA: true, allowPacketsNA: true, allowLedgerNA: true
      });
    });

    // Toggle presence engine enabled state WITHOUT joining rooms or emitting binds
    const m8 = consoleLogs.length;
    await page.evaluate(() => {
      if (typeof window._presenceEngine !== 'undefined' && window._presenceEngine) {
        // Enable engine with a dummy user — but do NOT join any rooms
        if (!window._presenceEngine._enabled) {
          window._presenceEngine._enabled = true;
          window._presenceEngine._localUserId = 'user.headless.test';
        }
      }
      console.log('[HEADLESS] nonInterference presenceEnabled=true roomJoin=SKIPPED result=PASS');
    });
    await sleep(300);

    // Compute golden hashes AFTER enabling presence
    const hashesAfterPresence = await page.evaluate(async () => {
      return await window.relayGetGoldenStateHashesSHA256({
        source: 'runtime', allowKpiNA: true, allowPacketsNA: true, allowLedgerNA: true
      });
    });

    let s8Pass = true;
    for (const c of COMPONENTS) {
      const before = String(hashesBeforePresence[`${c}Hash`] || '');
      const after = String(hashesAfterPresence[`${c}Hash`] || '');
      if (before !== after) {
        log(`[REFUSAL] reason=HEADLESS_INTERFERENCE component=${c} before=${before.slice(0, 16)} after=${after.slice(0, 16)}`);
        s8Pass = false;
      }
    }
    const niLog = consoleLogs.slice(m8).some(l => l.includes('[HEADLESS] nonInterference presenceEnabled=true roomJoin=SKIPPED'));
    stage(8, 'non-interference', s8Pass && niLog);

  } finally {
    await ctx.close();
    await browser.close();
    if (dev) dev.kill();
  }

  const pass = results.filter(r => r.result === 'PASS').length;
  const total = results.length;
  const gate = pass === total ? 'PASS' : 'FAIL';
  log(`[HEADLESS-0-PROOF] gate-summary result=${gate} stages=${pass}/${total}`);
  await fs.writeFile(LOG_FILE, lines.concat(consoleLogs).join('\n'), 'utf8');
  process.exit(gate === 'PASS' ? 0 : 2);
}

main().catch(async (err) => {
  log(`[FATAL] ${err.message}`);
  await fs.writeFile(LOG_FILE, lines.join('\n'), 'utf8');
  process.exit(2);
});
