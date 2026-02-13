import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-12';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `globe-restore-1-proof-console-${DATE_TAG}.log`);
const SHOT_FILE = path.join(PROOFS_DIR, `globe-restore-1-proof-${DATE_TAG}.png`);
const WORLD_URL = 'http://127.0.0.1:3000/relay-cesium-world.html';
const PROOF_URL = 'http://127.0.0.1:3000/relay-cesium-world.html';
const GLOBE_STATUS_URL = 'http://127.0.0.1:4020/api/globe/weather/status';
const GLOBE_TILE_URL = 'http://127.0.0.1:4020/api/globe/weather/clouds/1/1/1.png?mode=fixture';

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

async function startServerIfNeeded(commandArgs, readyUrl, env = {}) {
  const ready = await waitForUrl(readyUrl, 2500);
  if (ready) return { child: null, started: false, stdout: [] };

  const stdout = [];
  const child = spawn(process.execPath, commandArgs, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env, ...env }
  });

  child.stdout.on('data', (buf) => {
    stdout.push(String(buf));
  });
  child.stderr.on('data', (buf) => {
    stdout.push(String(buf));
  });

  const becameReady = await waitForUrl(readyUrl, 60000);
  if (!becameReady) {
    child.kill('SIGINT');
    throw new Error(`SERVER_NOT_READY ${readyUrl}`);
  }
  return { child, started: true, stdout };
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

async function runWorldScenario(page) {
  return page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const getLayers = () => Number(window.viewer?.imageryLayers?.length || 0);
    const weatherTypes = window.relayListWeatherTypes?.() || [];
    const topoModes = window.relayListTopographyModes?.() || [];

    const baseLayers = getLayers();
    const weatherAdd = window.relayWeatherAdd?.('clouds');
    await wait(350);
    const weatherLayers = getLayers();
    const weatherRemove = window.relayWeatherRemove?.('clouds');
    await wait(250);

    const topoApply = window.relayTopographyApply?.('contour-data');
    await wait(350);
    const topoLayers = getLayers();
    const topoClear = window.relayTopographyClear?.();
    await wait(350);
    const clearLayers = getLayers();

    return {
      weatherTypes,
      topoModes,
      baseLayers,
      weatherAdd,
      weatherLayers,
      weatherRemove,
      topoApply,
      topoLayers,
      topoClear,
      clearLayers
    };
  });
}

async function runProofIsolationScenario(page) {
  return page.evaluate(() => {
    const weather = window.relayWeatherAdd?.('clouds');
    const topo = window.relayTopographyApply?.('contour-data');
    return { weather, topo };
  });
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let cesiumServer = null;
  let globeServer = null;
  let browser = null;
  try {
    cesiumServer = await startServerIfNeeded(['scripts/dev-server.mjs'], WORLD_URL);
    globeServer = await startServerIfNeeded(
      ['scripts/globe-services-server.mjs'],
      GLOBE_STATUS_URL,
      { GLOBE_SERVICES_PORT: '4020', GLOBE_WEATHER_MODE: 'fixture' }
    );

    const statusRes = await fetch(GLOBE_STATUS_URL);
    const statusJson = await statusRes.json();
    const tileRes = await fetch(GLOBE_TILE_URL);
    const tileBuf = Buffer.from(await tileRes.arrayBuffer());
    const statusPass = statusRes.ok && statusJson?.success === true && statusJson?.data?.fixtureDeterministic === true;
    const tilePass = tileRes.ok && tileBuf.length > 0;
    log(`[GLOBE-RESTORE-1] weather-status result=${statusPass ? 'PASS' : 'FAIL'} mode=${statusJson?.data?.mode || 'unknown'}`);
    log(`[GLOBE-RESTORE-1] weather-tile result=${tilePass ? 'PASS' : 'FAIL'} bytes=${tileBuf.length}`);

    const globeServerOut = (globeServer?.stdout || []).join('');
    const startupLogPass = globeServer.started
      ? globeServerOut.includes('[GLOBE-SERVICES]') && globeServerOut.includes('fixtureSupported=')
      : true;
    log(`[GLOBE-RESTORE-1] globe-services-startup-log result=${startupLogPass ? 'PASS' : 'FAIL'} started=${globeServer.started ? 'yes' : 'no'}`);

    browser = await chromium.launch({ headless: true });
    const worldPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const worldLogs = [];
    const worldErrors = [];
    worldPage.on('console', (msg) => {
      const t = msg.text();
      if (t.includes('[GLOBE] weather overlay=') || t.includes('[GLOBE] topography mode=')) worldLogs.push(t);
      const lower = t.toLowerCase();
      if (lower.includes('uncaught') || lower.includes('syntaxerror') || lower.includes('referenceerror')) worldErrors.push(t);
    });
    worldPage.on('pageerror', (err) => worldErrors.push(String(err?.message || err)));
    await worldPage.addInitScript(() => { window.RELAY_PROFILE = 'world'; });
    await worldPage.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await worldPage.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'world'
        && typeof window.relayWeatherAdd === 'function'
        && typeof window.relayTopographyApply === 'function',
      undefined,
      { timeout: 120000 }
    );
    const world = await runWorldScenario(worldPage);
    const worldTypesPass = Array.isArray(world.weatherTypes) && world.weatherTypes.length === 5;
    const topoModesPass = Array.isArray(world.topoModes) && world.topoModes.some((m) => m.id === 'contour-data');
    const weatherPass = world.weatherAdd?.ok === true && world.weatherRemove?.ok === true;
    const topoPass = world.topoApply?.ok === true && world.topoClear?.ok === true;
    const layersPass = world.baseLayers >= 1 && world.topoLayers >= 1 && world.clearLayers >= 1;
    const worldLogPass = worldLogs.length >= 2;
    const worldCrashFree = worldErrors.length === 0;
    log(`[GLOBE-RESTORE-1] world-types result=${worldTypesPass ? 'PASS' : 'FAIL'} count=${world.weatherTypes?.length || 0}`);
    log(`[GLOBE-RESTORE-1] topography-modes result=${topoModesPass ? 'PASS' : 'FAIL'} count=${world.topoModes?.length || 0}`);
    log(`[GLOBE-RESTORE-1] weather-world result=${weatherPass ? 'PASS' : 'FAIL'}`);
    log(`[GLOBE-RESTORE-1] topography-world result=${topoPass ? 'PASS' : 'FAIL'}`);
    log(`[GLOBE-RESTORE-1] imagery-layer-invariant result=${layersPass ? 'PASS' : 'FAIL'} base=${world.baseLayers} topo=${world.topoLayers} clear=${world.clearLayers}`);
    log(`[GLOBE-RESTORE-1] world-logs result=${worldLogPass ? 'PASS' : 'FAIL'} count=${worldLogs.length}`);
    log(`[GLOBE-RESTORE-1] world-crash-free result=${worldCrashFree ? 'PASS' : 'FAIL'} errors=${worldErrors.length}`);
    await worldPage.screenshot({ path: SHOT_FILE, fullPage: true });

    const proofPage = await browser.newPage();
    await proofPage.addInitScript(() => { window.RELAY_PROFILE = 'proof'; });
    await proofPage.goto(PROOF_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await proofPage.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'proof'
        && typeof window.relayWeatherAdd === 'function'
        && typeof window.relayTopographyApply === 'function',
      undefined,
      { timeout: 120000 }
    );
    const proof = await runProofIsolationScenario(proofPage);
    const proofLockPass = proof.weather?.reason === 'PROFILE_LOCKED_PROOF' && proof.topo?.reason === 'PROFILE_LOCKED_PROOF';
    log(`[GLOBE-RESTORE-1] proof-isolation result=${proofLockPass ? 'PASS' : 'FAIL'} weather=${proof.weather?.reason || 'n/a'} topography=${proof.topo?.reason || 'n/a'}`);

    const pass = statusPass
      && tilePass
      && startupLogPass
      && worldTypesPass
      && topoModesPass
      && weatherPass
      && topoPass
      && layersPass
      && worldLogPass
      && worldCrashFree
      && proofLockPass;
    log(`[GLOBE-RESTORE-1] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=GLOBE_RESTORE_1_PROOF_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (globeServer) await stopServer(globeServer);
    if (cesiumServer) await stopServer(cesiumServer);
  }
}

await main();

