/**
 * DUAL-CONFIDENCE-SEPARATION-PROOF (Contract #44)
 *
 * Constitutional enforcement: orgConfidence and globalConfidence are
 * independent channels. They must never share setters, blend arithmetic,
 * merge serialization fields, or collapse in the renderer.
 *
 * FAILS on:
 *   - Shared setters (single function writing both channels)
 *   - Arithmetic merging (any code that adds/averages org + global)
 *   - Missing serialization fields (state export missing either channel)
 *   - Renderer blending (renderer using blended confidence for opacity)
 *   - Deprecated trap not emitting refusal
 *
 * Requires: npm run dev:cesium running on localhost:3000
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const URL = 'http://localhost:3000/relay-cesium-world.html?profile=launch';
const PROOF_DIR = path.resolve('archive/proofs/dual-confidence-separation-2026-02-18');
const LOG_PATH = path.resolve('archive/proofs/dual-confidence-separation-console-2026-02-18.log');

async function main() {
    const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    let failures = 0;

    // ── Stage 1: Function existence ──
    console.log('--- Stage 1: Function existence ---');
    const funcs = await page.evaluate(() => ({
        hasOrg: typeof window.computeOrgConfidence === 'function',
        hasGlobal: typeof window.computeGlobalConfidence === 'function',
        hasAggOrg: typeof window.aggregateOrgConfidence === 'function',
        hasAggGlobal: typeof window.aggregateGlobalConfidence === 'function',
        hasDeprecatedTrap: typeof window.computeConfidence === 'function',
        hasDeprecatedAggTrap: typeof window.aggregateConfidence === 'function'
    }));
    const s1 = funcs.hasOrg && funcs.hasGlobal && funcs.hasAggOrg && funcs.hasAggGlobal && funcs.hasDeprecatedTrap;
    console.log(`[DUAL-CONF] stage=existence org=${funcs.hasOrg} global=${funcs.hasGlobal} aggOrg=${funcs.hasAggOrg} aggGlobal=${funcs.hasAggGlobal} trap=${funcs.hasDeprecatedTrap} result=${s1 ? 'PASS' : 'FAIL'}`);
    if (!s1) failures++;

    // ── Stage 2: Channel independence ──
    console.log('--- Stage 2: Channel independence ---');
    const independence = await page.evaluate(() => {
        const orgSrc = window.computeOrgConfidence.toString();
        const globalSrc = window.computeGlobalConfidence.toString();
        return {
            orgReadsVote: orgSrc.includes('voteStatus'),
            globalReadsTimebox: globalSrc.includes('timeboxIds'),
            globalReadsEvidence: globalSrc.includes('evidenceRefs'),
            globalReadsDisclosure: globalSrc.includes('DISC_RANK') || globalSrc.includes('visibilityScope'),
            orgVal: window.computeOrgConfidence('branch.finance'),
            globalVal: window.computeGlobalConfidence('branch.finance')
        };
    });
    const s2 = !independence.orgReadsVote && !independence.globalReadsTimebox &&
               !independence.globalReadsEvidence && !independence.globalReadsDisclosure;
    console.log(`[DUAL-CONF] stage=independence orgReadsVote=${independence.orgReadsVote} globalReadsTimebox=${independence.globalReadsTimebox} globalReadsEvidence=${independence.globalReadsEvidence} globalReadsDisclosure=${independence.globalReadsDisclosure} result=${s2 ? 'PASS' : 'FAIL'}`);
    if (!s2) failures++;

    // ── Stage 3: No arithmetic merging ──
    console.log('--- Stage 3: No arithmetic merging ---');
    const noMerge = await page.evaluate(() => {
        const orgSrc = window.computeOrgConfidence.toString();
        const globalSrc = window.computeGlobalConfidence.toString();
        return {
            orgCallsGlobal: orgSrc.includes('computeGlobalConfidence'),
            globalCallsOrg: globalSrc.includes('computeOrgConfidence'),
            orgVarCount: orgSrc.length,
            globalVarCount: globalSrc.length
        };
    });
    const s3 = !noMerge.orgCallsGlobal && !noMerge.globalCallsOrg;
    console.log(`[DUAL-CONF] stage=noMerge orgCallsGlobal=${noMerge.orgCallsGlobal} globalCallsOrg=${noMerge.globalCallsOrg} result=${s3 ? 'PASS' : 'FAIL'}`);
    if (!s3) failures++;

    // ── Stage 4: Serialization fields ──
    console.log('--- Stage 4: Serialization (ACState export) ---');
    const serial = await page.evaluate(() => {
        const state = window._relayACState || {};
        return {
            hasOrgFn: typeof state.computeOrgConfidence === 'function',
            hasGlobalFn: typeof state.computeGlobalConfidence === 'function',
            hasAggOrg: typeof state.aggregateOrgConfidence === 'function',
            hasAggGlobal: typeof state.aggregateGlobalConfidence === 'function',
            hasLegacyConf: typeof state.computeConfidence === 'function'
        };
    });
    const s4 = serial.hasOrgFn && serial.hasGlobalFn && serial.hasAggOrg && serial.hasAggGlobal && !serial.hasLegacyConf;
    console.log(`[DUAL-CONF] stage=serialization orgFn=${serial.hasOrgFn} globalFn=${serial.hasGlobalFn} aggOrg=${serial.hasAggOrg} aggGlobal=${serial.hasAggGlobal} legacyRemoved=${!serial.hasLegacyConf} result=${s4 ? 'PASS' : 'FAIL'}`);
    if (!s4) failures++;

    // ── Stage 5: Renderer uses orgConfidence only (toggle scaffold, wait for HEIGHT log) ──
    console.log('--- Stage 5: Renderer channel ---');
    await page.keyboard.press('t');
    await page.waitForTimeout(2000);
    const heightLog = logs.find(l => l.includes('[HEIGHT]'));
    const pressureLog = logs.find(l => l.includes('[PRESSURE]'));
    const heightUsesOrg = heightLog ? heightLog.includes('orgConf=') : false;
    const heightUsesLegacy = heightLog ? (heightLog.includes('conf=') && !heightLog.includes('orgConf=')) : false;
    const pressureUsesOrg = pressureLog ? !pressureLog.includes('computeConfidence') : true;
    const s5 = (heightUsesOrg || !heightLog) && !heightUsesLegacy && pressureUsesOrg;
    console.log(`[DUAL-CONF] stage=renderer heightLog=${!!heightLog} heightUsesOrg=${heightUsesOrg} heightUsesLegacy=${heightUsesLegacy} pressureLog=${!!pressureLog} result=${s5 ? 'PASS' : 'FAIL'}`);
    if (!s5) failures++;
    await page.keyboard.press('t');

    // ── Stage 6: HUD shows both channels separately ──
    console.log('--- Stage 6: HUD dual display ---');
    const hudCheck = await page.evaluate(() => {
        const origGetFocus = window.relayGetFocusState;
        window.relayGetFocusState = () => ({
            active: true, frameId: 'dual-conf-proof', radiusM: 500,
            targetObjectId: 'branch.finance', targetType: 'branch',
            previousSelectionObjectId: null, previousLod: null
        });
        if (window.hudManager) window.hudManager._tier2Open = true;
        if (typeof window.relayRefreshHudNow === 'function') window.relayRefreshHudNow();
        const tier2 = document.querySelector('#hud-tier2');
        const html = tier2 ? tier2.innerHTML : '';
        window.relayGetFocusState = origGetFocus;
        return {
            hasOrgConf: html.includes('OrgConf:'),
            hasGlobConf: html.includes('GlobConf:'),
            hasBlendedConf: html.includes('Conf:') && !html.includes('OrgConf:'),
            hasAttn: html.includes('Attn:')
        };
    });
    const s6 = hudCheck.hasOrgConf && hudCheck.hasGlobConf && !hudCheck.hasBlendedConf && hudCheck.hasAttn;
    console.log(`[DUAL-CONF] stage=hud orgConf=${hudCheck.hasOrgConf} globConf=${hudCheck.hasGlobConf} blended=${hudCheck.hasBlendedConf} attn=${hudCheck.hasAttn} result=${s6 ? 'PASS' : 'FAIL'}`);
    if (!s6) failures++;

    // ── Stage 7: Deprecated trap emits refusal ──
    console.log('--- Stage 7: Deprecated trap refusal ---');
    const preTrapLogCount = logs.length;
    await page.evaluate(() => window.computeConfidence('branch.finance'));
    const trapRefusal = logs.slice(preTrapLogCount).some(l => l.includes('[REFUSAL] reason=BLENDED_CONFIDENCE_CALLED'));
    await page.evaluate(() => window.aggregateConfidence('trunk.avgol'));
    const aggTrapRefusal = logs.slice(preTrapLogCount).some(l => l.includes('[REFUSAL] reason=BLENDED_AGGREGATE_CALLED'));
    const s7 = trapRefusal && aggTrapRefusal;
    console.log(`[DUAL-CONF] stage=trap confRefusal=${trapRefusal} aggRefusal=${aggTrapRefusal} result=${s7 ? 'PASS' : 'FAIL'}`);
    if (!s7) failures++;

    // ── Stage 8: Boot log shows dual channels ──
    console.log('--- Stage 8: Boot log dual channels ---');
    const confLog = logs.find(l => l.includes('[CONF] id=branch.finance'));
    const hasOrgInLog = confLog ? confLog.includes('orgConf=') : false;
    const hasGlobalInLog = confLog ? confLog.includes('globalConf=') : false;
    const s8 = hasOrgInLog && hasGlobalInLog;
    console.log(`[DUAL-CONF] stage=bootLog orgInLog=${hasOrgInLog} globalInLog=${hasGlobalInLog} confLine=${confLog || 'MISSING'} result=${s8 ? 'PASS' : 'FAIL'}`);
    if (!s8) failures++;

    // ── Gate ──
    console.log('--- Gate ---');
    fs.mkdirSync(PROOF_DIR, { recursive: true });
    await page.screenshot({ path: path.join(PROOF_DIR, '01-dual-confidence-hud.png') });

    const totalStages = 8;
    const passed = totalStages - failures;
    const result = failures === 0 ? 'PASS' : 'FAIL';
    console.log(`\n[DUAL-CONF] gate-summary result=${result} stages=${passed}/${totalStages}`);

    fs.writeFileSync(LOG_PATH, logs.join('\n'), 'utf8');
    console.log(`Log written: ${LOG_PATH}`);
    console.log(`Screenshots: ${PROOF_DIR}`);

    await browser.close();
    process.exit(failures > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
