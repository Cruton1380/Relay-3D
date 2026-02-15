/**
 * HEIGHT-BAND-1 Proof Script
 * 
 * Proves: scope bands, height offsets from attention/confidence,
 * indeterminate guard, contributor logging, LAUNCH_CANOPY unchanged.
 * Requires: npm run dev:cesium running on localhost:3000
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const URL = 'http://localhost:3000/relay-cesium-world.html?profile=launch';
const PROOF_DIR = path.resolve('archive/proofs/height-band-2026-02-15');
const LOG_PATH = path.resolve('archive/proofs/height-band-console-2026-02-15.log');

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

    // --- Stage 1: Boot --- confirm AC functions
    console.log('--- Stage 1: Boot ---');
    const hasFuncs = await page.evaluate(() =>
        typeof window.computeAttention === 'function' &&
        typeof window.computeConfidence === 'function' &&
        typeof window.getBackingRefs === 'function'
    );
    const stage1Pass = hasFuncs;
    console.log(`[HEIGHT-PROOF] stage=boot acFunctions=${hasFuncs} result=${stage1Pass ? 'PASS' : 'FAIL'}`);
    if (!stage1Pass) failures++;

    // --- Stage 2: Toggle to TREE_SCAFFOLD ---
    console.log('--- Stage 2: Toggle to TREE_SCAFFOLD ---');
    await page.keyboard.press('t');
    await page.waitForTimeout(3000);
    const mode = await page.evaluate(() => window._relayRenderMode);
    const stage2Pass = mode === 'TREE_SCAFFOLD';
    console.log(`[HEIGHT-PROOF] stage=toggle renderMode=${mode} result=${stage2Pass ? 'PASS' : 'FAIL'}`);
    if (!stage2Pass) failures++;

    // --- Stage 3: Height bands applied ---
    console.log('--- Stage 3: Height bands applied ---');
    const bandLog = logs.some(l => l.includes('[HEIGHT-BAND] applied=PASS mode=TREE_SCAFFOLD'));
    const stage3Pass = bandLog;
    console.log(`[HEIGHT-PROOF] stage=heightBands bandLog=${bandLog} result=${stage3Pass ? 'PASS' : 'FAIL'}`);
    if (!stage3Pass) failures++;

    // --- Stage 4: Branch offset ---
    console.log('--- Stage 4: Branch offset ---');
    const heightLogs = logs.filter(l => l.includes('[HEIGHT] branch='));
    const branchHeights = await page.evaluate(() => {
        const nodes = window.relayState?.tree?.nodes || [];
        const branches = nodes.filter(n => n.type === 'branch');
        return branches.map(b => ({ id: b.id, offset: b._heightOffset || 0, scaffold: !!b._scaffoldMode }));
    });
    // At least one branch should have a non-zero height offset (those with filaments that are WITNESSED+ACTIVE)
    const hasVariation = branchHeights.some(b => b.offset > 0);
    const stage4Pass = heightLogs.length > 0 || hasVariation;
    console.log(`[HEIGHT-PROOF] stage=branchOffset heightLogs=${heightLogs.length} hasVariation=${hasVariation} result=${stage4Pass ? 'PASS' : 'FAIL'}`);
    if (!stage4Pass) failures++;

    // --- Stage 5: Indeterminate guard ---
    console.log('--- Stage 5: Indeterminate guard ---');
    const indeterminateLogs = logs.filter(l => l.includes('[HEIGHT] indeterminate'));
    // Some branches should be indeterminate (e.g., those with no filaments or low confidence)
    const hasIndeterminate = indeterminateLogs.length > 0;
    const stage5Pass = hasIndeterminate;
    console.log(`[HEIGHT-PROOF] stage=indeterminate count=${indeterminateLogs.length} result=${stage5Pass ? 'PASS' : 'FAIL'}`);
    if (!stage5Pass) failures++;

    // --- Stage 6: Contributor log ---
    console.log('--- Stage 6: Contributor log ---');
    const pressureLogs = logs.filter(l => l.includes('[PRESSURE] branch='));
    const hasContributors = pressureLogs.some(l => l.includes('contributors=['));
    const stage6Pass = pressureLogs.length > 0 && hasContributors;
    console.log(`[HEIGHT-PROOF] stage=contributors pressureLogs=${pressureLogs.length} hasContributors=${hasContributors} result=${stage6Pass ? 'PASS' : 'FAIL'}`);
    if (!stage6Pass) failures++;

    // Take screenshot
    fs.mkdirSync(PROOF_DIR, { recursive: true });
    await page.screenshot({ path: path.join(PROOF_DIR, '01-height-bands.png') });

    // --- Stage 7: Toggle back ---
    console.log('--- Stage 7: Toggle back ---');
    await page.keyboard.press('t');
    await page.waitForTimeout(2000);
    const restoredMode = await page.evaluate(() => window._relayRenderMode);
    const stage7Pass = restoredMode === 'LAUNCH_CANOPY';
    console.log(`[HEIGHT-PROOF] stage=toggleBack renderMode=${restoredMode} result=${stage7Pass ? 'PASS' : 'FAIL'}`);
    if (!stage7Pass) failures++;

    // --- Stage 8: Gate ---
    console.log('--- Stage 8: Gate ---');
    const result = failures === 0 ? 'PASS' : 'FAIL';
    console.log(`\n[HEIGHT-PROOF] gate-summary result=${result} stages=${8 - failures}/8`);

    fs.writeFileSync(LOG_PATH, logs.join('\n'), 'utf8');
    console.log(`Log written: ${LOG_PATH}`);
    console.log(`Screenshots: ${PROOF_DIR}`);

    await browser.close();
    process.exit(failures > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
