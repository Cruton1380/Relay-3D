/**
 * ATTENTION-CONFIDENCE-1 Proof Script (Dual Confidence — Contract #44)
 * 
 * Proves: getBackingRefs, computeOrgConfidence, computeGlobalConfidence,
 *         computeAttention, dual aggregation, HUD dual readout, blended-trap refusal.
 * Requires: npm run dev:cesium running on localhost:3000
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const URL = 'http://localhost:3000/relay-cesium-world.html?profile=launch';
const PROOF_DIR = path.resolve('archive/proofs/attention-confidence-2026-02-18');
const LOG_PATH = path.resolve('archive/proofs/attention-confidence-console-2026-02-18.log');

async function main() {
    const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    const logs = [];
    page.on('console', msg => {
        const text = msg.text();
        logs.push(text);
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

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
    const backingLogPresent = logs.some(l => l.includes('[BACKING] id=branch.finance'));
    const stage2Pass = hasFilaments && hasTimeboxes && backingLogPresent;
    console.log(`[AC-PROOF] stage=getBackingRefs filaments=${backingResult?.filamentIds?.length || 0} timeboxes=${backingResult?.timeboxIds?.length || 0} logPresent=${backingLogPresent} result=${stage2Pass ? 'PASS' : 'FAIL'}`);
    if (!stage2Pass) failures++;

    // --- Stage 3: computeOrgConfidence ---
    console.log('--- Stage 3: computeOrgConfidence ---');
    const orgConf = await page.evaluate(() => {
        if (typeof window.computeOrgConfidence !== 'function') return -1;
        return window.computeOrgConfidence('branch.finance');
    });
    const confLogPresent = logs.some(l => l.includes('[CONF] id=branch.finance'));
    const stage3Pass = orgConf >= 0.3 && orgConf <= 1.0 && confLogPresent;
    console.log(`[AC-PROOF] stage=computeOrgConfidence orgConf=${typeof orgConf === 'number' ? orgConf.toFixed(2) : orgConf} logPresent=${confLogPresent} result=${stage3Pass ? 'PASS' : 'FAIL'}`);
    if (!stage3Pass) failures++;

    // --- Stage 3b: computeGlobalConfidence ---
    console.log('--- Stage 3b: computeGlobalConfidence ---');
    const globalConf = await page.evaluate(() => {
        if (typeof window.computeGlobalConfidence !== 'function') return -1;
        return window.computeGlobalConfidence('branch.finance');
    });
    const stage3bPass = globalConf >= 0.0 && globalConf <= 1.0;
    console.log(`[AC-PROOF] stage=computeGlobalConfidence globalConf=${typeof globalConf === 'number' ? globalConf.toFixed(2) : globalConf} result=${stage3bPass ? 'PASS' : 'FAIL'}`);
    if (!stage3bPass) failures++;

    // --- Stage 4: computeAttention ---
    console.log('--- Stage 4: computeAttention ---');
    const attnRefusal = await page.evaluate(() => {
        if (typeof window.computeAttention !== 'function') return -1;
        return window.computeAttention('FIL-006');
    });
    const attnLogPresent = logs.some(l => l.includes('[ATTN] id=branch'));
    const stage4Pass = attnRefusal > 0 && attnLogPresent;
    console.log(`[AC-PROOF] stage=computeAttention attn_FIL006=${typeof attnRefusal === 'number' ? attnRefusal.toFixed(2) : attnRefusal} logPresent=${attnLogPresent} result=${stage4Pass ? 'PASS' : 'FAIL'}`);
    if (!stage4Pass) failures++;

    // --- Stage 5: aggregateAttention + dual aggregate ---
    console.log('--- Stage 5: aggregation ---');
    const agg = await page.evaluate(() => {
        return {
            attn: typeof window.aggregateAttention === 'function' ? window.aggregateAttention('trunk.avgol') : -1,
            orgConf: typeof window.aggregateOrgConfidence === 'function' ? window.aggregateOrgConfidence('trunk.avgol') : -1,
            globalConf: typeof window.aggregateGlobalConfidence === 'function' ? window.aggregateGlobalConfidence('trunk.avgol') : -1
        };
    });
    const aggAttnLog = logs.some(l => l.includes('[AC] aggregateAttention scope=company'));
    const aggOrgLog = logs.some(l => l.includes('[AC] aggregateOrgConfidence scope=company'));
    const aggGlobalLog = logs.some(l => l.includes('[AC] aggregateGlobalConfidence scope=company'));
    const stage5Pass = agg.attn > 0 && agg.attn <= 1 && agg.orgConf >= 0 && agg.orgConf <= 1 && agg.globalConf >= 0 && agg.globalConf <= 1 && aggAttnLog && aggOrgLog && aggGlobalLog;
    console.log(`[AC-PROOF] stage=aggregation attn=${agg.attn?.toFixed?.(2)} orgConf=${agg.orgConf?.toFixed?.(2)} globalConf=${agg.globalConf?.toFixed?.(2)} attnLog=${aggAttnLog} orgLog=${aggOrgLog} globalLog=${aggGlobalLog} result=${stage5Pass ? 'PASS' : 'FAIL'}`);
    if (!stage5Pass) failures++;

    // --- Stage 6: HUD dual readout ---
    console.log('--- Stage 6: HUD readout ---');
    const hudStage6 = await page.evaluate(() => {
        const result = { orgConfInHud: false, globConfInHud: false, attnInHud: false, orgConf: -1, globalConf: -1, attn: -1 };
        if (!window.hudManager) return result;

        if (typeof window.computeOrgConfidence === 'function' && typeof window.computeAttention === 'function') {
            result.orgConf = window.computeOrgConfidence('branch.finance');
            result.globalConf = typeof window.computeGlobalConfidence === 'function' ? window.computeGlobalConfidence('branch.finance') : -1;
            result.attn = window.computeAttention('branch.finance');
        }

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

        window.hudManager._tier2Open = true;
        if (typeof window.relayRefreshHudNow === 'function') {
            window.relayRefreshHudNow();
        }

        const tier2El = document.querySelector('#hud-tier2');
        const hudHtml = tier2El ? tier2El.innerHTML : '';
        result.orgConfInHud = hudHtml.includes('OrgConf:');
        result.globConfInHud = hudHtml.includes('GlobConf:');
        result.attnInHud = hudHtml.includes('Attn:');

        window.relayGetFocusState = origGetFocus;
        return result;
    });
    const stage6Pass = hudStage6.orgConfInHud && hudStage6.globConfInHud && hudStage6.attnInHud;
    if (!stage6Pass) {
        console.log(`[AC-PROOF] debug stage6=${JSON.stringify(hudStage6)}`);
    }
    console.log(`[AC-PROOF] stage=hudReadout orgConf=${hudStage6.orgConfInHud} globConf=${hudStage6.globConfInHud} attn=${hudStage6.attnInHud} result=${stage6Pass ? 'PASS' : 'FAIL'}`);
    if (!stage6Pass) failures++;

    // --- Stage 7: Blended trap refusal ---
    console.log('--- Stage 7: Blended trap ---');
    const trapResult = await page.evaluate(() => {
        if (typeof window.computeConfidence !== 'function') return { exists: false };
        const val = window.computeConfidence('branch.finance');
        return { exists: true, value: val };
    });
    const trapRefusalLogged = logs.some(l => l.includes('[REFUSAL] reason=BLENDED_CONFIDENCE_CALLED'));
    const stage7Pass = trapResult.exists && trapRefusalLogged && typeof trapResult.value === 'number';
    console.log(`[AC-PROOF] stage=blendedTrap trapExists=${trapResult.exists} refusalLogged=${trapRefusalLogged} fallbackValue=${trapResult.value?.toFixed?.(2)} result=${stage7Pass ? 'PASS' : 'FAIL'}`);
    if (!stage7Pass) failures++;

    // --- Stage 8: Screenshot + Gate ---
    console.log('--- Stage 8: Gate ---');
    fs.mkdirSync(PROOF_DIR, { recursive: true });
    await page.screenshot({ path: path.join(PROOF_DIR, '01-hud-dual-readout.png') });

    const totalStages = 8;
    const result = failures === 0 ? 'PASS' : 'FAIL';
    console.log(`\n[AC-PROOF] gate-summary result=${result} stages=${totalStages - failures}/${totalStages}`);

    fs.writeFileSync(LOG_PATH, logs.join('\n'), 'utf8');
    console.log(`Log written: ${LOG_PATH}`);
    console.log(`Screenshots: ${PROOF_DIR}`);

    await browser.close();
    process.exit(failures > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
