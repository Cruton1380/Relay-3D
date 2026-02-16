#!/usr/bin/env node
/**
 * CRYPTO-VERIFY-GATE-1
 * Loads Relay in headless Chromium and calls relayVerifyChainIntegrity({ emitScar:false }).
 * Exit code: 0 if VALID, 1 if BROKEN or error.
 *
 * Assumes Playwright is available (already used in HEADLESS-0 proofs).
 */

import { chromium } from "@playwright/test";

const URL = process.env.RELAY_VERIFY_URL
  || "http://localhost:3000/relay-cesium-world.html?profile=launch";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });

    // Wait for the API to exist
    await page.waitForFunction(() => typeof window.relayVerifyChainIntegrity === "function", null, {
      timeout: 60_000,
    });

    const result = await page.evaluate(async () => {
      const r = await window.relayVerifyChainIntegrity({ emitScar: false });
      return r;
    });

    const overall = result?.overall || "UNKNOWN";
    const durationMs = result?.durationMs ?? -1;

    console.log(`[CRYPTO-GATE] verify:integrity overall=${overall} durationMs=${durationMs}`);

    await browser.close();

    if (overall !== "VALID") {
      console.error(`[REFUSAL] reason=CRYPTO_GATE_VERIFY_FAILED overall=${overall}`);
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    try { await browser.close(); } catch {}
    console.error(`[REFUSAL] reason=CRYPTO_GATE_VERIFY_FAILED overall=ERROR detail=${String(err?.message || err)}`);
    process.exit(1);
  }
}

main();
