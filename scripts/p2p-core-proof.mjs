import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `p2p-core-proof-console-${DATE_TAG}.log`);
const APP_URL = 'http://localhost:3000/relay-cesium-world.html';

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayP2PRunHappyLoop === 'function'
        && typeof window.relayP2PRunMismatchLoop === 'function'
        && typeof window.relayGetTransferPackets === 'function',
      { timeout: 120000 }
    );

    const scenarioA = await page.evaluate(() => {
      const beforePackets = window.relayGetTransferPackets().length;
      const beforeResp = window.relayGetResponsibilityPackets().length;
      const beforeCommits = window.relayGetCommits().length;
      const out = window.relayP2PRunHappyLoop({
        siteId: 'SITE_A',
        itemId: 'item.P2P_PROOF_A',
        qty: 100,
        unitPrice: 100
      });
      const afterPackets = window.relayGetTransferPackets().length;
      const afterResp = window.relayGetResponsibilityPackets().length;
      const afterCommits = window.relayGetCommits().length;
      const latestPackets = window.relayGetTransferPackets().slice(-3);
      const allBalanced = latestPackets.every(tp => window.relayValidateTransferPacket(tp).ok === true);
      const hasInventory = latestPackets.some(tp => tp.legs.some(l => String(l.containerRef?.id || '').includes('Inventory')));
      const hasAp = latestPackets.some(tp => tp.legs.some(l => String(l.containerRef?.id || '').includes('.AP')));
      const hasCash = latestPackets.some(tp => tp.legs.some(l => String(l.containerRef?.id || '').includes('CashBank')));
      const hashes = window.relayGetGoldenStateHashes({ source: 'runtime', allowKpiNA: true });
      return {
        ok: !!(out?.cgr?.ok && out?.cinv?.ok && out?.cpay?.ok),
        commitsAdded: afterCommits - beforeCommits,
        packetsAdded: afterPackets - beforePackets,
        responsibilityAdded: afterResp - beforeResp,
        allBalanced,
        hasInventory,
        hasAp,
        hasCash,
        matchStatus: out?.inv?.matchStatus || null,
        ledgerHash: hashes.ledgerHash
      };
    });

    log(`[P2P] scenario=happy result=${scenarioA.ok ? 'PASS' : 'FAIL'} commits=${scenarioA.commitsAdded} packets=${scenarioA.packetsAdded} responsibility=${scenarioA.responsibilityAdded} matchStatus=${scenarioA.matchStatus || 'UNKNOWN'}`);
    log(`[AC0] scenario=happy packetsBalanced=${scenarioA.allBalanced ? 'PASS' : 'FAIL'} inventory=${scenarioA.hasInventory} ap=${scenarioA.hasAp} cash=${scenarioA.hasCash}`);
    log(`[LGR0] scenario=happy projectionHash=${scenarioA.ledgerHash}`);

    const scenarioB = await page.evaluate(() => {
      const beforePackets = window.relayGetTransferPackets().length;
      const out = window.relayP2PRunMismatchLoop({
        siteId: 'SITE_A',
        itemId: 'item.P2P_PROOF_B',
        qty: 100,
        baseUnitPrice: 100,
        invUnitPrice: 102
      });
      const midPackets = window.relayGetTransferPackets().length;
      const latest = window.relayGetTransferPackets()[window.relayGetTransferPackets().length - 1] || null;
      const hasVarianceLeg = !!latest && latest.legs.some(l => String(l.containerRef?.id || '').includes('PriceVariance'));
      const hashes = window.relayGetGoldenStateHashes({ source: 'runtime', allowKpiNA: true });
      return {
        failOk: !!(out?.fail?.ok),
        varianceOk: !!(out?.pass?.ok),
        packetsAdded: midPackets - beforePackets,
        hasVarianceLeg,
        ledgerHash: hashes.ledgerHash
      };
    });

    const mismatchRefused = !scenarioB.failOk;
    log(`[P2P] scenario=mismatch initialCommit=${mismatchRefused ? 'REFUSAL' : 'PASS'} varianceCommit=${scenarioB.varianceOk ? 'PASS' : 'FAIL'} packets=${scenarioB.packetsAdded}`);
    if (mismatchRefused) {
      log('[REFUSAL] reason=MATCH_GATE_FAIL component=invoice-posting');
    }
    log(`[AC0] scenario=mismatch varianceContainer=${scenarioB.hasVarianceLeg ? 'PASS' : 'FAIL'} container=PriceVariance`);
    log(`[LGR0] scenario=mismatch projectionHash=${scenarioB.ledgerHash}`);

    const pass =
      scenarioA.ok &&
      scenarioA.packetsAdded >= 3 &&
      scenarioA.responsibilityAdded >= 3 &&
      scenarioA.allBalanced &&
      mismatchRefused &&
      scenarioB.varianceOk &&
      scenarioB.hasVarianceLeg;

    log(`[P2P] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    log(`[P2P] log=archive/proofs/${path.basename(LOG_FILE)}`);
    if (!pass) process.exitCode = 2;
  } finally {
    await browser.close();
  }
}

main().catch(async (err) => {
  const fatal = `[P2P] fatal=${err?.stack || err}`;
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

