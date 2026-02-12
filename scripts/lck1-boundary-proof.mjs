import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const DATE_TAG = '2026-02-11';
const LOG_FILE = path.join(PROOFS_DIR, `lck1-boundary-console-${DATE_TAG}.log`);
const SHOT_FILE = path.join(PROOFS_DIR, `lck1-boundary-screenshot-${DATE_TAG}.png`);
const URL = 'http://localhost:3000/relay-cesium-world.html';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function run() {
  await ensureDir(PROOFS_DIR);

  const lines = [];
  const push = (line) => {
    const msg = String(line);
    lines.push(msg);
    // Echo while running for interactive visibility.
    // eslint-disable-next-line no-console
    console.log(msg);
  };

  push(`[LCK1] start url=${URL}`);

  let browser = null;
  let headed = true;
  try {
    browser = await chromium.launch({ headless: false });
    push('[LCK1] browser-mode=headed');
  } catch (err) {
    headed = false;
    push(`[LCK1] headed-launch-failed fallback=headless reason=${err?.message || err}`);
    browser = await chromium.launch({ headless: true });
    push('[LCK1] browser-mode=headless');
  }

  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  page.on('console', (msg) => {
    const txt = msg.text();
    if (
      txt.includes('[BOUNDARY]') ||
      txt.includes('[GATE] G3') ||
      txt.includes('Boundaries') ||
      txt.includes('BOUNDARY')
    ) {
      push(`[BROWSER_CONSOLE] ${txt}`);
    }
  });

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await sleep(8000);

  const result = await page.evaluate(async () => {
    const boundaryStatus = (window.getBoundaryStatus && window.getBoundaryStatus()) || 'UNKNOWN';
    const votingScopeMode = (window.getGovernanceVotingScopeMode && window.getGovernanceVotingScopeMode()) || 'UNKNOWN';
    const geometryStats = (window.boundaryRenderer && typeof window.boundaryRenderer.getGeometryStats === 'function')
      ? window.boundaryRenderer.getGeometryStats()
      : { polygons: 0, multipolygons: 0, holes: 0 };
    let suite = null;
    let suiteError = null;
    try {
      if (window.boundaryRenderer && typeof window.boundaryRenderer.runContainmentSelfTest === 'function') {
        suite = window.boundaryRenderer.runContainmentSelfTest();
      } else {
        suiteError = 'boundaryRenderer self-test hook missing';
      }
    } catch (err) {
      suiteError = String(err?.message || err);
    }
    return {
      boundaryStatus,
      votingScopeMode,
      geometryStats,
      suite,
      suiteError
    };
  });

  const suitePass = Boolean(result?.suite?.pass);
  const holeSuitePass = Boolean(result?.suite?.holeSuite?.pass);
  const g3Pass = result.boundaryStatus === 'ACTIVE' && suitePass;
  const containsSuiteStatus = suitePass ? 'PASS' : 'FAIL';
  const holeSuiteStatus = holeSuitePass ? 'PASS' : 'FAIL';
  const evidenceId = `lck1-runtime-${DATE_TAG}`;

  push(`[BOUNDARY] restore result=${result.boundaryStatus === 'ACTIVE' ? 'PASS' : 'DEGRADED'} renderer=BoundaryRenderer containsLL=${containsSuiteStatus}`);
  push(`[BOUNDARY] containsll suite=${containsSuiteStatus} polygons=${result?.geometryStats?.polygons || 0} multipolygons=${result?.geometryStats?.multipolygons || 0} holes=${result?.geometryStats?.holes || 0}`);
  push(`[BOUNDARY] containsll hole-suite=${holeSuiteStatus} probes=${Number(result?.suite?.holeSuite?.probes || 0)}`);
  push(`[BOUNDARY] voting-scope mode=${result.votingScopeMode} reason=runtime-check`);
  push(`[GATE] G3 status=${g3Pass ? 'PASS' : 'DEGRADED'} evidence=${evidenceId}`);
  if (result.suiteError) {
    push(`[LCK1] suite-error=${result.suiteError}`);
  }

  await page.screenshot({ path: SHOT_FILE, fullPage: true });
  push(`[LCK1] screenshot=${path.relative(ROOT, SHOT_FILE).replaceAll('\\', '/')}`);

  const summary = {
    timestamp: new Date().toISOString(),
    url: URL,
    browserMode: headed ? 'headed' : 'headless',
    boundaryStatus: result.boundaryStatus,
    votingScopeMode: result.votingScopeMode,
    geometryStats: result.geometryStats,
    suite: result.suite,
    suiteError: result.suiteError,
    gate: {
      id: 'LCK-1',
      g3Status: g3Pass ? 'PASS' : 'DEGRADED',
      evidenceId
    }
  };
  push(`[LCK1] summary=${JSON.stringify(summary)}`);

  await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
  push(`[LCK1] log=${path.relative(ROOT, LOG_FILE).replaceAll('\\', '/')}`);

  await context.close();
  await browser.close();

  if (!g3Pass) {
    process.exitCode = 2;
  }
}

run().catch(async (err) => {
  const msg = `[LCK1] fatal=${err?.stack || err}`;
  // eslint-disable-next-line no-console
  console.error(msg);
  try {
    await ensureDir(PROOFS_DIR);
    await fs.writeFile(LOG_FILE, `${msg}\n`, 'utf8');
  } catch {
    // ignore nested write failures
  }
  process.exitCode = 1;
});

