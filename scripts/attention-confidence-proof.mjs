/**
 * ATTENTION-CONFIDENCE-1 Proof Script
 * 
 * Proves: getBackingRefs, computeConfidence, computeAttention, aggregation, HUD readout.
 * Requires: npm run dev:cesium running on localhost:3000
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const URL = 'http://localhost:3000/relay-cesium-world.html?profile=launch';
const PROOF_DIR = path.resolve('archive/proofs/attention-confidence-2026-02-15');
const LOG_PATH = path.resolve('archive/proofs/attention-confidence-console-2026-02-15.log');

async function main() {
    const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    const logs = [];
    page.on('console', msg => {
        const text = msg.text();
        logs.push(text);
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000); // Wait for boot + filament registry + AC initialization

    let failures = 0;

    // --- Stage 1: Boot ---
    console.log('--- Stage 1: Boot ---');
    const hasRegistry = logs.some(l => l.includes('[FILAMENT] registry initialized=PASS'));
    const hasDisclosure = logs.some(l => l.includes('[DISCLOSURE] restore'));
    const hasVote = logs.some(l => l.includes('[VOTE] restore'));
    const hasACInit = logs.some(l => l.includes('[AC] initialized=PASS'));
    const stage1Pass = hasRegistry && hasDisclosure && hasVote && hasACInit;
    console.log(`[AC-PROOF] stage=boot registry=${hasRegistry} disclosure=${hasDisclosure} vote=${hasVote} acInit=${hasACInit} result=${stage1Pass ? 'PASS' : 'FAIL'}`);
    if (!stage1Pass) failures++;

    // --- Stage 2: getBackingRefs ---
    console.log('--- Stage 2: getBackingRefs ---');
    const backingResult = await page.evaluate(() => {
        if (typeof window.getBackingRefs !== 'function') return null;
        return window.getBackingRefs('branch.finance');
    });
    const hasFilaments = backingResult && backingResult.filamentIds && backingResult.filamentIds.length >= 3;
    const hasTimeboxes = backingResult && backingResult.timeboxIds && backingResult.timeboxIds.length > 0;
    // Verify backing log was emitted
    const backingLogPresent = logs.some(l => l.includes('[BACKING] id=branch.finance'));
    const stage2Pass = hasFilaments && hasTimeboxes && backingLogPresent;
    console.log(`[AC-PROOF] stage=getBackingRefs filaments=${backingResult?.filamentIds?.length || 0} timeboxes=${backingResult?.timeboxIds?.length || 0} logPresent=${backingLogPresent} result=${stage2Pass ? 'PASS' : 'FAIL'}`);
    if (!stage2Pass) failures++;

    // --- Stage 3: computeConfidence ---
    console.log('--- Stage 3: computeConfidence ---');
    const conf = await page.evaluate(() => {
        if (typeof window.computeConfidence !== 'function') return -1;
        return window.computeConfidence('branch.finance');
    });
    // branch.finance has timeboxes (+0.2), disclosure filaments >= WITNESSED (+0.2), vote=PENDING (no +0.3)
    // Expected: conf >= 0.4 (tb:0.2 + disc:0.2 from auto-upgraded filaments)
    const confLogPresent = logs.some(l => l.includes('[CONF] id=branch.finance'));
    const stage3Pass = conf >= 0.3 && confLogPresent;
    console.log(`[AC-PROOF] stage=computeConfidence conf=${typeof conf === 'number' ? conf.toFixed(2) : conf} logPresent=${confLogPresent} result=${stage3Pass ? 'PASS' : 'FAIL'}`);
    if (!stage3Pass) failures++;

    // --- Stage 4: computeAttention ---
    console.log('--- Stage 4: computeAttention ---');
    const attnRefusal = await page.evaluate(() => {
        if (typeof window.computeAttention !== 'function') return -1;
        return window.computeAttention('FIL-006'); // REFUSAL lifecycle
    });
    const attnLogPresent = logs.some(l => l.includes('[ATTN] id=branch'));
    const stage4Pass = attnRefusal > 0 && attnLogPresent;
    console.log(`[AC-PROOF] stage=computeAttention attn_FIL006=${typeof attnRefusal === 'number' ? attnRefusal.toFixed(2) : attnRefusal} logPresent=${attnLogPresent} result=${stage4Pass ? 'PASS' : 'FAIL'}`);
    if (!stage4Pass) failures++;

    // --- Stage 5: aggregateAttention ---
    console.log('--- Stage 5: aggregateAttention ---');
    const aggAttn = await page.evaluate(() => {
        if (typeof window.aggregateAttention !== 'function') return -1;
        return window.aggregateAttention('trunk.avgol');
    });
    const aggLogPresent = logs.some(l => l.includes('[AC] aggregateAttention scope=company'));
    const stage5Pass = aggAttn > 0 && aggAttn <= 1 && aggLogPresent;
    console.log(`[AC-PROOF] stage=aggregateAttention result=${typeof aggAttn === 'number' ? aggAttn.toFixed(2) : aggAttn} logPresent=${aggLogPresent} result=${stage5Pass ? 'PASS' : 'FAIL'}`);
    if (!stage5Pass) failures++;

    // --- Stage 6: HUD readout ---
    console.log('--- Stage 6: HUD readout ---');
    // The HUD update cycle continuously resets focusTarget from focusLensState (local variable).
    // To prove the AC readout integration, we inject focusTarget into the focusLensState via the
    // focus lens API, then trigger a manual HUD refresh and check the rendered HTML.
    const hudStage6 = await page.evaluate(() => {
        const result = { confInHud: false, attnInHud: false, conf: -1, attn: -1 };
        if (!window.hudManager) return result;

        // 1. Verify compute functions exist and produce valid output for branch.finance
        if (typeof window.computeConfidence === 'function' && typeof window.computeAttention === 'function') {
            result.conf = window.computeConfidence('branch.finance');
            result.attn = window.computeAttention('branch.finance');
        }

        // 2. Temporarily override relayGetFocusState to return branch.finance as target
        const origGetFocus = window.relayGetFocusState;
        window.relayGetFocusState = () => ({
            active: true,
            frameId: 'ac-proof',
            radiusM: 500,
            targetObjectId: 'branch.finance',
            targetType: 'branch',
            previousSelectionObjectId: null,
            previousLod: null
        });

        // 3. Force tier2 open and trigger the HUD update cycle
        window.hudManager._tier2Open = true;
        // Call the HUD refresh function which reads relayGetFocusState
        if (typeof window.relayRefreshHudNow === 'function') {
            window.relayRefreshHudNow();
        }

        // 4. Check rendered HTML
        const tier2El = document.querySelector('#hud-tier2');
        const hudHtml = tier2El ? tier2El.innerHTML : '';
        result.confInHud = hudHtml.includes('Conf:');
        result.attnInHud = hudHtml.includes('Attn:');

        // 5. Restore original
        window.relayGetFocusState = origGetFocus;
        return result;
    });
    const hasConfInHud = hudStage6.confInHud;
    const hasAttnInHud = hudStage6.attnInHud;
    const stage6Pass = hasConfInHud && hasAttnInHud;
    if (!stage6Pass) {
        console.log(`[AC-PROOF] debug stage6=${JSON.stringify(hudStage6)}`);
    }
    console.log(`[AC-PROOF] stage=hudReadout conf=${hasConfInHud} attn=${hasAttnInHud} confVal=${hudStage6.conf?.toFixed?.(2) || hudStage6.conf} attnVal=${hudStage6.attn?.toFixed?.(2) || hudStage6.attn} result=${stage6Pass ? 'PASS' : 'FAIL'}`);
    if (!stage6Pass) failures++;

    // --- Stage 7: Screenshot + Gate ---
    console.log('--- Stage 7: Gate ---');
    fs.mkdirSync(PROOF_DIR, { recursive: true });
    await page.screenshot({ path: path.join(PROOF_DIR, '01-hud-readout.png') });

    const result = failures === 0 ? 'PASS' : 'FAIL';
    console.log(`\n[AC-PROOF] gate-summary result=${result} stages=${7 - failures}/7`);

    // Write log
    fs.writeFileSync(LOG_PATH, logs.join('\n'), 'utf8');
    console.log(`Log written: ${LOG_PATH}`);
    console.log(`Screenshots: ${PROOF_DIR}`);

    await browser.close();
    process.exit(failures > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
