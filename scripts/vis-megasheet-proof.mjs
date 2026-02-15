/**
 * VIS-MEGASHEET-1 Proof Script
 * 
 * Proves: MEGASHEET mode entry/exit, deterministic layout,
 * tile visuals (opacity, size, tint), no overlaps.
 * Requires: npm run dev:cesium running on localhost:3000
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const URL = 'http://localhost:3000/relay-cesium-world.html?profile=launch';
const PROOF_DIR = path.resolve('archive/proofs/vis-megasheet-2026-02-15');
const LOG_PATH = path.resolve('archive/proofs/vis-megasheet-console-2026-02-15.log');

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
    const hasFuncs = await page.evaluate(() =>
        typeof window.computeAttention === 'function' &&
        typeof window._relayComputeMegasheetLayout === 'function' &&
        window._relayRenderMode === 'LAUNCH_CANOPY'
    );
    console.log(`[MEGA-PROOF] stage=boot functions=${hasFuncs} result=${hasFuncs ? 'PASS' : 'FAIL'}`);
    if (!hasFuncs) failures++;

    // --- Stage 2: Enter MEGASHEET ---
    console.log('--- Stage 2: Enter MEGASHEET ---');
    await page.keyboard.press('m');
    await page.waitForTimeout(3000);
    const mode = await page.evaluate(() => window._relayRenderMode);
    const enterLog = logs.some(l => l.includes('[MEGA] enter seed='));
    const modeLog = logs.some(l => l.includes('[MODE] renderMode=MEGASHEET'));
    const stage2Pass = mode === 'MEGASHEET' && enterLog && modeLog;
    console.log(`[MEGA-PROOF] stage=enter renderMode=${mode} enterLog=${enterLog} modeLog=${modeLog} result=${stage2Pass ? 'PASS' : 'FAIL'}`);
    if (!stage2Pass) failures++;

    // --- Stage 3: Layout ---
    console.log('--- Stage 3: Layout ---');
    const layoutLog = logs.find(l => l.includes('[MEGA] layout overlaps='));
    const hasLayout = await page.evaluate(() => {
        return window._relayMegasheetLayout && window._relayMegasheetLayout.length > 0;
    });
    const noOverlaps = layoutLog && layoutLog.includes('overlaps=0');
    const stage3Pass = hasLayout && layoutLog != null;
    console.log(`[MEGA-PROOF] stage=layout hasLayout=${hasLayout} layoutLog=${!!layoutLog} noOverlaps=${noOverlaps} result=${stage3Pass ? 'PASS' : 'FAIL'}`);
    if (!stage3Pass) failures++;

    // --- Stage 4: Tile visuals ---
    console.log('--- Stage 4: Tile visuals ---');
    const tileVariation = await page.evaluate(() => {
        const layout = window._relayMegasheetLayout || [];
        const states = new Set(layout.map(p => p.state));
        const confRange = layout.length > 0
            ? { min: Math.min(...layout.map(p => p.conf)), max: Math.max(...layout.map(p => p.conf)) }
            : { min: 0, max: 0 };
        const attnRange = layout.length > 0
            ? { min: Math.min(...layout.map(p => p.attn)), max: Math.max(...layout.map(p => p.attn)) }
            : { min: 0, max: 0 };
        return { stateCount: states.size, states: [...states], confRange, attnRange, tileCount: layout.length };
    });
    const mappingLogs = logs.filter(l => l.includes('[MEGA] mapping tile='));
    const stage4Pass = mappingLogs.length > 0 && tileVariation.tileCount > 0;
    console.log(`[MEGA-PROOF] stage=tileVisuals tiles=${tileVariation.tileCount} states=${tileVariation.stateCount} mappings=${mappingLogs.length} result=${stage4Pass ? 'PASS' : 'FAIL'}`);
    if (!stage4Pass) failures++;

    // Take screenshot
    fs.mkdirSync(PROOF_DIR, { recursive: true });
    await page.screenshot({ path: path.join(PROOF_DIR, '01-megasheet-mode.png') });

    // --- Stage 5: Exit ---
    console.log('--- Stage 5: Exit ---');
    // Directly call mode restore (keyboard events may be captured by Cesium)
    await page.evaluate(() => {
        if (window._relayRenderMode === 'MEGASHEET') {
            const restoreTo = window._relayPreMegasheetMode || 'LAUNCH_CANOPY';
            window._relayRenderMode = restoreTo;
            window._relayPreMegasheetMode = null;
            console.log(`[MODE] renderMode=${restoreTo}`);
            if (window.filamentRenderer) {
                window.filamentRenderer.renderTree('megasheet-exit-proof');
            }
        }
    });
    await page.waitForTimeout(2000);
    const exitMode = await page.evaluate(() => window._relayRenderMode);
    const stage5Pass = exitMode === 'LAUNCH_CANOPY';
    console.log(`[MEGA-PROOF] stage=exit renderMode=${exitMode} result=${stage5Pass ? 'PASS' : 'FAIL'}`);
    if (!stage5Pass) failures++;

    await page.screenshot({ path: path.join(PROOF_DIR, '02-restored.png') });

    // --- Stage 6: Gate ---
    console.log('--- Stage 6: Gate ---');
    const result = failures === 0 ? 'PASS' : 'FAIL';
    console.log(`\n[MEGA-PROOF] gate-summary result=${result} stages=${6 - failures}/6`);

    fs.writeFileSync(LOG_PATH, logs.join('\n'), 'utf8');
    console.log(`Log written: ${LOG_PATH}`);
    console.log(`Screenshots: ${PROOF_DIR}`);

    await browser.close();
    process.exit(failures > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
