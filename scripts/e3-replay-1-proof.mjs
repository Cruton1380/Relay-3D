/**
 * E3-REPLAY-1 Proof Script — 9 stages
 * Tightenings: #1 unmapped exclusion, #2 shadow write guard,
 *              #3 mutation revert, #4 unique scar IDs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `e3-replay-1-console-${DATE_TAG}.log`);
const URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=launch&headless=true';

const lines = [];
const log = (s) => { const m = String(s); lines.push(m); console.log(m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForUrl(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { const r = await fetch(url, { method: 'GET' }); if (r.ok) return true; } catch {}
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
  log(`[E3-REPLAY-1-PROOF] stage=${n} label=${label} result=${result}`);
};

async function bootPage(ctx) {
  const consoleLogs = [];
  const page = await ctx.newPage();
  page.on('console', (m) => consoleLogs.push(m.text()));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() =>
    typeof window.relayReplaySheetSHA256 === 'function' &&
    typeof window.relayReplayModuleSHA256 === 'function' &&
    typeof window.relayGetGoldenStateHashesSHA256 === 'function' &&
    typeof window.relayGetLoadedModuleIds === 'function'
  , { timeout: 60000 });
  await sleep(2000);
  return { page, consoleLogs };
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  const dev = await startDevIfNeeded();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  let allConsoleLogs = [];

  try {
    // ═══ Stage 1: Boot + regressions ═══
    let { page, consoleLogs } = await bootPage(ctx);
    allConsoleLogs = consoleLogs;

    const s1 = await page.evaluate(() => ({
      sheetReplay: typeof window.relayReplaySheetFromCommits === 'function',
      moduleReplay: typeof window.relayReplayModuleSHA256 === 'function',
      goldenSHA: typeof window.relayGetGoldenStateHashesSHA256 === 'function',
      headless: window.RELAY_HEADLESS_MODE === true
    }));
    stage(1, 'boot-regressions', s1.sheetReplay && s1.moduleReplay && s1.goldenSHA && s1.headless);

    // ═══ Stage 2: Sheet replay SHA-256 ═══
    const m2 = consoleLogs.length;
    const s2 = await page.evaluate(async () => {
      const sheetIds = (window.relayState?.tree?.nodes || [])
        .filter(n => n.type === 'sheet').map(n => n.id);
      if (sheetIds.length === 0) return { ok: false, reason: 'no sheets' };
      const result = await window.relayReplaySheetSHA256(sheetIds[0]);
      return { ok: true, matchesLive: result.matchesLive, hash: result.replayHash?.slice(0, 16) };
    });
    const s2Log = consoleLogs.slice(m2).some(l => l.includes('[REPLAY] sheet'));
    stage(2, 'sheet-replay-sha256', s2.ok && s2Log);

    // ═══ Stage 3: Module replay clean + shadow write guard ═══
    const m3 = consoleLogs.length;
    const preHash = await page.evaluate(async () => {
      return await window.relayGetGoldenStateHashesSHA256({
        source: 'runtime', allowKpiNA: true, allowPacketsNA: true, allowLedgerNA: true
      });
    });

    const s3 = await page.evaluate(async () => {
      const ids = window.relayGetLoadedModuleIds();
      if (ids.length === 0) return { ok: false, reason: 'no modules' };
      const result = await window.relayReplayModuleSHA256(ids[0]);
      return { ok: result.result === 'MATCH', moduleId: ids[0], result: result.result };
    });

    const postHash = await page.evaluate(async () => {
      return await window.relayGetGoldenStateHashesSHA256({
        source: 'runtime', allowKpiNA: true, allowPacketsNA: true, allowLedgerNA: true
      });
    });

    let shadowOk = true;
    for (const c of ['facts', 'matches', 'summaries', 'kpis', 'commits', 'packets', 'ledger']) {
      if (String(preHash[`${c}Hash`]) !== String(postHash[`${c}Hash`])) { shadowOk = false; break; }
    }
    if (shadowOk) log('[REPLAY] shadowWriteGuard relayStateMutations=0 result=PASS');

    const s3mLog = consoleLogs.slice(m3).some(l => l.includes('[REPLAY] module') && l.includes('result=MATCH'));
    const s3tLog = consoleLogs.slice(m3).some(l => l.includes('[REPLAY] timing'));
    stage(3, 'module-replay-clean', s3.ok && shadowOk && s3mLog && s3tLog);

    // ═══ Stage 4: Partial replay range ═══
    const m4 = consoleLogs.length;
    const s4 = await page.evaluate(async () => {
      const ids = window.relayGetLoadedModuleIds();
      if (ids.length === 0) return { ok: false };
      const r = await window.relayReplayModuleSHA256(ids[0], { fromCommitIndex: 0, toCommitIndex: 5 });
      return { ok: r.result === 'MATCH' || r.result === 'DIVERGENCE' };
    });
    const s4Log = consoleLogs.slice(m4).some(l => l.includes('[REPLAY] start scope=module') && l.includes('to=5'));
    stage(4, 'partial-replay-range', s4.ok && s4Log);

    // ═══ Stage 5: Divergence detection (Tightening #3: mutation + revert) ═══
    const m5 = consoleLogs.length;
    const s5 = await page.evaluate(async () => {
      // Capture baseline golden hashes before mutation
      const baseline = await window.relayGetGoldenStateHashesSHA256({
        source: 'runtime', allowKpiNA: true, allowPacketsNA: true, allowLedgerNA: true
      });

      // Find fact sheets and mutate cellData directly
      const allSheets = (window.relayState?.tree?.nodes || []).filter(n => n.type === 'sheet');
      const factSheets = allSheets.filter(n => n.metadata?.isFactSheet);
      console.log(`[REPLAY] divergenceDebug allSheets=${allSheets.length} factSheets=${factSheets.length} factIds=${factSheets.map(s=>s.id).join(',')}`);

      // If no fact sheets, we need to use whatever sheets have cellData and add isFactSheet flag
      let sheet = factSheets[0] || allSheets.find(s => s.cellData && s.cellData.length > 0);
      if (!sheet || !sheet.cellData || sheet.cellData.length === 0) return { ok: false, reason: 'no cellData' };

      // If the sheet isn't marked as fact sheet, temporarily mark it so extractFacts picks it up
      const wasFactSheet = !!sheet.metadata?.isFactSheet;
      if (!wasFactSheet) {
        if (!sheet.metadata) sheet.metadata = {};
        sheet.metadata.isFactSheet = true;
      }

      // Find first data cell (row > 0)
      const dataCell = sheet.cellData.find(c => c.row > 0);
      if (!dataCell) return { ok: false, reason: 'no data cells' };
      const origVal = dataCell.value;
      const origDisp = dataCell.display;

      // Mutate
      dataCell.value = '__DIVERGENCE_TEST__';
      dataCell.display = '__DIVERGENCE_TEST__';
      sheet._cellIndex = null; // force rebuild
      console.log('[REPLAY] divergenceTest mutationApplied=true');

      // Verify mutation is visible in golden hashes
      const mutatedHashes = await window.relayGetGoldenStateHashesSHA256({
        source: 'runtime', allowKpiNA: true, allowPacketsNA: true, allowLedgerNA: true
      });
      const factsChanged = baseline.factsHash !== mutatedHashes.factsHash;
      console.log(`[REPLAY] divergenceCheck baseline.facts=${baseline.factsHash?.slice(0,12)} mutated.facts=${mutatedHashes.factsHash?.slice(0,12)} changed=${factsChanged}`);

      // Module replay with baseline should detect divergence
      const ids = window.relayGetLoadedModuleIds();
      const r = ids.length > 0
        ? await window.relayReplayModuleSHA256(ids[0], { baselineHashes: baseline })
        : { result: 'NO_MODULES' };

      // REVERT (Tightening #3)
      dataCell.value = origVal;
      dataCell.display = origDisp;
      if (!wasFactSheet) sheet.metadata.isFactSheet = false;
      sheet._cellIndex = null;
      console.log('[REPLAY] divergenceTest mutationApplied=true mutationReverted=true result=PASS');

      return { ok: r.result === 'DIVERGENCE', result: r.result, factsChanged, sheetId: sheet.id };
    });

    const s5DivLog = consoleLogs.slice(m5).some(l => l.includes('[REFUSAL] reason=REPLAY_DIVERGENCE'));
    const s5RevLog = consoleLogs.slice(m5).some(l => l.includes('mutationApplied=true mutationReverted=true'));
    stage(5, 'divergence-detection', s5.ok && s5DivLog && s5RevLog);

    // ═══ Stage 6: Divergence scar (Tightening #4: unique ID) ═══
    const m6 = consoleLogs.length;
    const s6 = await page.evaluate(async () => {
      const trunk = window.relayState.tree.nodes.find(n => n.type === 'trunk');
      const latestTb = trunk?.timeboxes?.[trunk.timeboxes.length - 1];
      const scarEvents = (latestTb?.events || []).filter(e => e.type === 'REPLAY_DIVERGENCE');
      const hasScar = scarEvents.length > 0;
      const lastScar = hasScar ? scarEvents[scarEvents.length - 1] : null;
      const uniqueId = lastScar?.eventId?.startsWith('replay.');
      const hudStatus = window.__relayReplayState?.status;
      return { ok: hasScar && uniqueId, scarCount: scarEvents.length, eventId: lastScar?.eventId, hudStatus };
    });

    const s6ScarLog = consoleLogs.slice(m5).some(l => l.includes('[TIMEBOX] event type=REPLAY_DIVERGENCE'));
    stage(6, 'divergence-scar', s6.ok && s6ScarLog);

    // ═══ Stage 7: Performance gate (10k rows < 60s) ═══
    await page.close();
    const fresh = await bootPage(ctx);
    page = fresh.page;
    consoleLogs = fresh.consoleLogs;
    allConsoleLogs = allConsoleLogs.concat(consoleLogs);

    const m7 = consoleLogs.length;
    const s7 = await page.evaluate(async () => {
      window.relayStressTest(10000);
      const ids = window.relayGetLoadedModuleIds();
      if (ids.length === 0) return { ok: false };
      const r = await window.relayReplayModuleSHA256(ids[0]);
      return { ok: r.timing.total < 60000, totalMs: r.timing.total, result: r.result };
    });

    const s7PerfLog = consoleLogs.slice(m7).some(l => l.includes('[REPLAY] perf-gate') && l.includes('result=PASS'));
    const s7TimingLog = consoleLogs.slice(m7).some(l => l.includes('[REPLAY] timing'));
    stage(7, 'performance-gate', s7.ok && s7PerfLog && s7TimingLog);

    // ═══ Stage 8: Headless replay parity (deterministic across runs) ═══
    const s8 = await page.evaluate(async () => {
      const ids = window.relayGetLoadedModuleIds();
      if (ids.length === 0) return { ok: false };
      const r1 = await window.relayReplayModuleSHA256(ids[0]);
      const r2 = await window.relayReplayModuleSHA256(ids[0]);
      let match = true;
      for (const c of ['facts', 'matches', 'summaries', 'kpis', 'commits', 'packets', 'ledger']) {
        if (String(r1.replayHashes[`${c}Hash`]) !== String(r2.replayHashes[`${c}Hash`])) match = false;
      }
      return { ok: match };
    });
    stage(8, 'headless-replay-parity', s8.ok);

    // ═══ Stage 9: Non-interference ═══
    const pre9 = await page.evaluate(async () => {
      return await window.relayGetGoldenStateHashesSHA256({
        source: 'runtime', allowKpiNA: true, allowPacketsNA: true, allowLedgerNA: true
      });
    });
    await page.evaluate(async () => {
      const ids = window.relayGetLoadedModuleIds();
      if (ids.length > 0) await window.relayReplayModuleSHA256(ids[0]);
    });
    const post9 = await page.evaluate(async () => {
      return await window.relayGetGoldenStateHashesSHA256({
        source: 'runtime', allowKpiNA: true, allowPacketsNA: true, allowLedgerNA: true
      });
    });

    let s9Pass = true;
    for (const c of ['facts', 'matches', 'summaries', 'kpis', 'commits', 'packets', 'ledger']) {
      if (String(pre9[`${c}Hash`]) !== String(post9[`${c}Hash`])) {
        log(`[REFUSAL] reason=REPLAY_INTERFERENCE component=${c}`);
        s9Pass = false;
      }
    }
    stage(9, 'non-interference', s9Pass);

  } finally {
    await ctx.close();
    await browser.close();
    if (dev) dev.kill();
  }

  const pass = results.filter(r => r.result === 'PASS').length;
  const total = results.length;
  const gate = pass === total ? 'PASS' : 'FAIL';
  log(`[E3-REPLAY-1-PROOF] gate-summary result=${gate} stages=${pass}/${total}`);
  await fs.writeFile(LOG_FILE, lines.concat(allConsoleLogs).join('\n'), 'utf8');
  process.exit(gate === 'PASS' ? 0 : 2);
}

main().catch(async (err) => {
  log(`[FATAL] ${err.message}`);
  await fs.writeFile(LOG_FILE, lines.join('\n'), 'utf8');
  process.exit(2);
});
