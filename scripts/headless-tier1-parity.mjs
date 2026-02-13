import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import {
  buildTier1ParityFixture,
  computeTier1GoldenHashesFromFixture
} from '../core/models/headless/tier1-parity.js';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `headless-0-parity-console-${DATE_TAG}.log`);
const APP_URLS = [
  'http://localhost:3000/relay-cesium-world.html',
  'http://127.0.0.1:3000/relay-cesium-world.html'
];

const COMPONENTS = ['facts', 'matches', 'summaries', 'kpis', 'packets', 'ledger'];
const lines = [];

const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

const bundleToCompare = (bundle) => ({
  facts: bundle.factsHash,
  matches: bundle.matchesHash,
  summaries: bundle.summariesHash,
  kpis: bundle.kpisHash,
  packets: bundle.packetsHash,
  ledger: bundle.ledgerHash
});

async function runBrowserGoldens(fixture) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    let lastErr = null;
    for (const url of APP_URLS) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
      }
    }
    if (lastErr) throw lastErr;
    await page.waitForFunction(
      () => typeof window.relayLoadHeadlessParityFixture === 'function' && typeof window.relayGetGoldenStateHashes === 'function',
      { timeout: 120000 }
    );
    return await page.evaluate((fixtureArg) => {
      window.relayLoadHeadlessParityFixture(fixtureArg);
      return window.relayGetGoldenStateHashes({ source: 'fixture', allowKpiNA: true });
    }, fixture);
  } finally {
    await browser.close();
  }
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });

  const fixture = buildTier1ParityFixture();
  const headlessBundle = computeTier1GoldenHashesFromFixture(fixture, { allowKpiNA: true });
  const headless = bundleToCompare(headlessBundle);

  let browser;
  try {
    browser = await runBrowserGoldens(fixture);
  } catch (err) {
    log(`[REFUSAL] reason=HEADLESS_DIVERGENCE component=runtime expected=browser-reachable actual=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
    return;
  }
  const runtime = {
    facts: browser.factsHash,
    matches: browser.matchesHash,
    summaries: browser.summariesHash,
    kpis: browser.kpisHash,
    packets: browser.packetsHash,
    ledger: browser.ledgerHash
  };

  const statuses = {};
  let hasMismatch = false;
  for (const c of COMPONENTS) {
    const expected = String(headless[c] ?? '');
    const actual = String(runtime[c] ?? '');
    if (expected === actual) {
      statuses[c] = 'MATCH';
    } else {
      statuses[c] = 'MISMATCH';
      hasMismatch = true;
      log(`[REFUSAL] reason=HEADLESS_DIVERGENCE component=${c} expected=${expected} actual=${actual}`);
    }
  }

  if (hasMismatch) {
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
    return;
  }

  log(`[HEADLESS] golden-compare facts=${statuses.facts} matches=${statuses.matches} summaries=${statuses.summaries} kpis=${statuses.kpis} packets=${statuses.packets} ledger=${statuses.ledger}`);
  await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
  log(`[HEADLESS] log=archive/proofs/${path.basename(LOG_FILE)}`);
}

main().catch(async (err) => {
  const fatal = `[HEADLESS] fatal=${err?.stack || err}`;
  // eslint-disable-next-line no-console
  console.error(fatal);
  try {
    await fs.mkdir(PROOFS_DIR, { recursive: true });
    await fs.writeFile(LOG_FILE, `${fatal}\n`, 'utf8');
  } catch {
    // ignore
  }
  process.exitCode = 1;
});

