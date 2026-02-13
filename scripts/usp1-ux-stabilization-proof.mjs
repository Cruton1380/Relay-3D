import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-13';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `usp1-ux-stabilization-console-${DATE_TAG}.log`);
const SHOT_FILE = path.join(PROOFS_DIR, `usp1-ux-stabilization-${DATE_TAG}.png`);
const WORLD_URL = 'http://localhost:3000/relay-cesium-world.html?profile=world';
const GLOBE_SERVICES_URL = 'http://127.0.0.1:4020/api/globe/weather/status';

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runNodeScript(scriptPath, timeoutMs = 300000) {
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

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let devServer = null;
  let globeServices = null;
  let browser = null;
  try {
    devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], WORLD_URL);
    globeServices = await startServerIfNeeded(['scripts/globe-services-server.mjs'], GLOBE_SERVICES_URL);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await page.route(/\.(woff2?|ttf|otf)(\?.*)?$/i, (route) => route.abort());
    const logs = [];
    page.on('console', (msg) => logs.push(msg.text()));

    await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'world'
        && typeof window.relayApplyImageryMode === 'function'
        && typeof window.relaySetDebugLogs === 'function',
      undefined,
      { timeout: 120000 }
    );

    const world = await page.evaluate(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const sat = window.relayApplyImageryMode?.('satellite');
      await wait(200);
      const osm = window.relayApplyImageryMode?.('osm');
      await wait(200);
      const boundaries = window.getBoundaryStatus?.() || 'UNKNOWN';
      window.relaySetDebugLogs?.(false);
      await wait(100);
      window.RelayLog?.info?.('[L2] laneVolume synthetic-hidden');
      window.RelayLog?.info?.('[L2] spine-band synthetic-hidden');
      window.RelayLog?.warn?.('[REFUSAL] reason=USP1_TEST_VISIBLE');
      await wait(100);
      const hudText = String(document.getElementById('hud')?.innerText || '');
      const hudGrouping = hudText.includes('Section A') && hudText.includes('Section B') && hudText.includes('Section C');
      const anchorIl = !!window.viewer?.entities?.getById?.('usp1-anchor-il');
      const anchorUs = !!window.viewer?.entities?.getById?.('usp1-anchor-us');
      const multi = anchorIl && anchorUs;
      return {
        sat,
        osm,
        boundaries,
        hudGrouping,
        multi
      };
    });

    const imageryPass = world.sat?.ok === true && world.osm?.ok === true;
    const boundariesPass = ['ACTIVE', 'DEGRADED'].includes(String(world.boundaries || 'UNKNOWN'));
    const debugSuppressionPass = !logs.some((t) => t.includes('laneVolume synthetic-hidden') || t.includes('spine-band synthetic-hidden'))
      && logs.some((t) => t.includes('[REFUSAL] reason=USP1_TEST_VISIBLE'));
    const hudPass = world.hudGrouping === true;
    const multiCountryPass = world.multi === true || logs.some((t) => t.includes('[UX] multiCountrySmoke=PASS anchors=2'));

    log(`[USP1] imageryToggle result=${imageryPass ? 'PASS' : 'FAIL'}`);
    log(`[USP1] boundaries result=${boundariesPass ? 'PASS' : 'FAIL'} status=${world.boundaries}`);
    log(`[USP1] debugSuppression result=${debugSuppressionPass ? 'PASS' : 'FAIL'}`);
    log(`[USP1] hudGrouping result=${hudPass ? 'PASS' : 'FAIL'}`);
    log(`[USP1] multiCountry result=${multiCountryPass ? 'PASS' : 'FAIL'}`);

    await page.screenshot({ path: SHOT_FILE, fullPage: false, timeout: 120000 });
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');

    const gatePre = imageryPass && boundariesPass && debugSuppressionPass && hudPass && multiCountryPass;
    log(`[USP1] gate-pre-osv result=${gatePre ? 'PASS' : 'FAIL'}`);
    if (!gatePre) {
      await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
      process.exitCode = 2;
      return;
    }

    const osv = await runNodeScript('scripts/osv1-full-system-proof.mjs');
    const osvPass = osv.ok && osv.output.includes('[OSV1] gate-summary result=PASS');
    log(`[USP1] osvRegression result=${osvPass ? 'PASS' : 'FAIL'}`);
    const gate = gatePre && osvPass;
    log(`[USP1] gate-summary result=${gate ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!gate) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=USP1_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
    return;
  } finally {
    if (browser) await browser.close();
    if (globeServices) await stopServer(globeServices);
    if (devServer) await stopServer(devServer);
  }
}

await main();
