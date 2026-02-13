import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-13';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `gap1-world-runtime-console-${DATE_TAG}.log`);
const WORLD_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=world';

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForUrl(url, timeoutMs = 60000) {
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

async function startServerIfNeeded(commandArgs, readyUrl) {
  const ready = await waitForUrl(readyUrl, 2500);
  if (ready) return { child: null, started: false };
  const child = spawn(process.execPath, commandArgs, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env }
  });
  const becameReady = await waitForUrl(readyUrl, 60000);
  if (!becameReady) {
    child.kill('SIGINT');
    throw new Error(`SERVER_NOT_READY ${readyUrl}`);
  }
  return { child, started: true };
}

async function stopServer(handle) {
  if (!handle?.started || !handle?.child || handle.child.killed) return;
  const child = handle.child;
  child.kill('SIGINT');
  await Promise.race([
    new Promise((resolve) => child.once('close', resolve)),
    sleep(3000).then(() => {
      if (!child.killed) child.kill('SIGKILL');
    })
  ]);
}

async function runNodeScript(scriptPath, timeoutMs = 600000) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...process.env }
    });
    let output = '';
    child.stdout.on('data', (d) => { output += String(d); });
    child.stderr.on('data', (d) => { output += String(d); });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ ok: false, output: `${output}\nTIMEOUT` });
    }, timeoutMs);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, output, code });
    });
  });
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let devServer = null;
  let browser = null;
  try {
    devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], WORLD_URL);
    browser = await chromium.launch({ headless: true });

    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));
    await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'world'
        && !!window.filamentRenderer
        && !!window.boundaryRenderer,
      undefined,
      { timeout: 120000 }
    );

    await page.waitForTimeout(1200);
    await page.evaluate(async () => {
      if (window.worldGlobeManager?.loadCountrySet) {
        await window.worldGlobeManager.loadCountrySet('global-expanded');
      }
    });
    await page.waitForTimeout(1200);

    const runtime = await page.evaluate(async () => {
      const capByLod = { LANIAKEA: 100, PLANETARY: 200, REGION: 400 };
      const viewer = window.viewer;
      if (viewer?.camera) {
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(12, 22, 1600000)
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 900));
      if (window.filamentRenderer?.renderTree) window.filamentRenderer.renderTree('gap1-proof');
      await new Promise((resolve) => setTimeout(resolve, 400));

      const lod = String(window.filamentRenderer?.currentLOD || window.RELAY_CURRENT_LOD || 'UNKNOWN').toUpperCase();
      const primitiveCount = window.filamentRenderer?.primitiveCount || {};
      const entityCount = window.filamentRenderer?.entityCount || {};
      const totalPrimitives = Object.values(primitiveCount).reduce((acc, x) => acc + Number(x || 0), 0);
      const cap = Number.isFinite(capByLod[lod]) ? capByLod[lod] : Number.POSITIVE_INFINITY;
      const budgetOk = !Number.isFinite(cap) || totalPrimitives <= cap;
      const boundarySummary = (typeof window.boundaryRenderer?.getMissingBoundarySummary === 'function')
        ? window.boundaryRenderer.getMissingBoundarySummary()
        : { missing: 0, first: 'n/a' };
      return {
        lod,
        sheetsDetailed: Number(window.filamentRenderer?._sheetsRendered || 0),
        lanePolylines: Number(primitiveCount.lanePolylines || 0),
        laneVolumes: Number(primitiveCount.laneVolumes || 0),
        markers: Number(entityCount.cellPoints || 0),
        totalPrimitives,
        cap,
        budgetOk,
        boundaryMissing: Number(boundarySummary.missing || 0),
        boundaryFirst: String(boundarySummary.first || 'n/a')
      };
    });

    const boundary404ByCode = new Map();
    for (const line of consoleLogs) {
      if (!line.includes('404')) continue;
      const match = line.match(/countries\/([A-Z]{3})-ADM0\.geojson/i);
      if (!match) continue;
      const code = String(match[1] || '').toUpperCase();
      boundary404ByCode.set(code, (boundary404ByCode.get(code) || 0) + 1);
    }
    let max404PerMissing = 0;
    for (const count of boundary404ByCode.values()) {
      if (count > max404PerMissing) max404PerMissing = count;
    }
    const degradedSummaryCount = consoleLogs.filter((line) => line.includes('[BOUNDARY] datasetDegraded')).length;
    const boundaryDatasetPass = max404PerMissing <= 1 && degradedSummaryCount <= 2;

    const duplicateEntityErrors = consoleLogs.filter((line) =>
      line.includes('already exists in this collection') || line.includes('Cesium refused entity')
    );
    const idempotentPass = duplicateEntityErrors.length === 0;

    const lodDisciplinePass =
      (runtime.lod === 'PLANETARY' || runtime.lod === 'LANIAKEA' || runtime.lod === 'REGION') &&
      runtime.sheetsDetailed === 0 &&
      runtime.lanePolylines === 0 &&
      runtime.laneVolumes === 0 &&
      runtime.markers === 0;

    const renderBudgetPass = runtime.budgetOk === true;

    log(`[GAP1] boundaryDataset result=${boundaryDatasetPass ? 'PASS' : 'FAIL'} missing=${runtime.boundaryMissing} first=${runtime.boundaryFirst} max404=${max404PerMissing}`);
    log(`[GAP1] boundaryIdempotent result=${idempotentPass ? 'PASS' : 'FAIL'} duplicateErrors=${duplicateEntityErrors.length}`);
    log(`[GAP1] lodDiscipline result=${lodDisciplinePass ? 'PASS' : 'FAIL'} level=${runtime.lod} sheetsDetailed=${runtime.sheetsDetailed} lanes=${runtime.lanePolylines + runtime.laneVolumes} markers=${runtime.markers}`);
    log(`[GAP1] renderBudget result=${renderBudgetPass ? 'PASS' : 'FAIL'} level=${runtime.lod} requested=${runtime.totalPrimitives} cap=${Number.isFinite(runtime.cap) ? runtime.cap : 'inf'}`);

    const osv = await runNodeScript('scripts/osv1-full-system-proof.mjs', 600000);
    const parity = await runNodeScript('scripts/headless-tier1-parity.mjs', 600000);
    const restoreParity = await runNodeScript('scripts/restore-full-parity-proof.mjs', 1200000);
    const osvPass = osv.ok && osv.output.includes('[OSV1] gate-summary result=PASS');
    const headlessPass = parity.ok && parity.output.includes('[HEADLESS] golden-compare facts=MATCH');
    const restorePass = restoreParity.ok && restoreParity.output.includes('[PARITY] gate-summary result=PASS');
    const railsPass = osvPass && headlessPass && restorePass;
    log(`[GAP1] rails result=${railsPass ? 'PASS' : 'FAIL'} osv1=${osvPass ? 'PASS' : 'FAIL'} headless=${headlessPass ? 'PASS' : 'FAIL'} parity=${restorePass ? 'PASS' : 'FAIL'}`);

    const gate = boundaryDatasetPass && idempotentPass && lodDisciplinePass && renderBudgetPass && railsPass;
    log(`[GAP1] gate-summary result=${gate ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!gate) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=GAP1_WORLD_RUNTIME_PROOF detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

await main();
