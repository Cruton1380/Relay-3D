/**
 * FILAMENT-LIFELINE-1 Proof Script
 *
 * Proves ambient end-to-end lifeline geometry in TREE_SCAFFOLD + SHEET/CELL.
 * Requires: npm run dev:cesium running on localhost:3000
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const PROOF_DATE = '2026-02-16';
const URL = 'http://localhost:3000/relay-cesium-world.html?profile=launch';
const PROOF_DIR = path.resolve(`archive/proofs/filament-lifeline-1-${PROOF_DATE}`);
const LOG_PATH = path.resolve(`archive/proofs/filament-lifeline-1-console-${PROOF_DATE}.log`);

async function main() {
    fs.mkdirSync(PROOF_DIR, { recursive: true });

    const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const logs = [];

    page.on('console', (msg) => {
        logs.push(msg.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);
    await page.click('body');
    await page.waitForTimeout(500);
    await page.evaluate(() => { window.__relayProofMode = true; });

    let failures = 0;

    // Stage 1: Boot + mode set
    console.log('--- Stage 1: Boot + mode set ---');
    await page.keyboard.press('t');
    await page.waitForTimeout(2000);
    await page.keyboard.press('e');
    await page.waitForTimeout(2500);
    const stage1 = await page.evaluate(() => ({
        mode: window._relayRenderMode,
        hasRenderer: !!window.filamentRenderer
    }));
    const stage1Pass = stage1.mode === 'TREE_SCAFFOLD' && stage1.hasRenderer;
    console.log(`[FILAMENT-LIFELINE-PROOF] stage=boot mode=${stage1.mode} renderer=${stage1.hasRenderer} result=${stage1Pass ? 'PASS' : 'FAIL'}`);
    if (!stage1Pass) failures++;
    await page.screenshot({ path: path.join(PROOF_DIR, '01-scaffold-sheet.png'), timeout: 60000 });

    // Stage 2: Budget eligibility
    console.log('--- Stage 2: Budget eligibility ---');
    const stage2Data = await page.evaluate(() => ({
        sheetsDetailed: window.filamentRenderer?._sheetsRendered || 0,
        renderMode: window._relayRenderMode
    }));
    const eligibilityLog = logs.some((l) => l.includes('[FILAMENT-LIFELINE] eligible=true mode=TREE_SCAFFOLD'));
    const stage2Pass = stage2Data.sheetsDetailed > 0 && eligibilityLog && stage2Data.renderMode === 'TREE_SCAFFOLD';
    console.log(`[FILAMENT-LIFELINE-PROOF] stage=budget sheetsDetailed=${stage2Data.sheetsDetailed} eligibilityLog=${eligibilityLog} result=${stage2Pass ? 'PASS' : 'FAIL'}`);
    if (!stage2Pass) failures++;

    // Stage 3: Lifeline render
    console.log('--- Stage 3: Lifeline render ---');
    await page.evaluate(() => {
        if (window.filamentRenderer) window.filamentRenderer.renderTree('filament-lifeline-proof');
    });
    await page.waitForTimeout(1200);
    const builtLog = [...logs].reverse().find((l) => l.includes('[FILAMENT-LIFELINE] built count='));
    const builtMatch = builtLog ? builtLog.match(/built count=(\d+)/) : null;
    const builtCount = builtMatch ? Number(builtMatch[1]) : 0;
    const perFilLogs = logs.filter((l) => l.includes('[FILAMENT-LIFELINE] filament='));
    const stage3Pass = builtCount > 0 && perFilLogs.length > 0;
    console.log(`[FILAMENT-LIFELINE-PROOF] stage=render built=${builtCount} perFilaments=${perFilLogs.length} result=${stage3Pass ? 'PASS' : 'FAIL'}`);
    if (!stage3Pass) failures++;
    await page.screenshot({ path: path.join(PROOF_DIR, '02-lifeline-closeup.png'), timeout: 60000 });

    // Stage 4: Geometry sanity
    console.log('--- Stage 4: Geometry sanity ---');
    const stage4Data = await page.evaluate(() => {
        const stats = Array.isArray(window._relayLifelineStats) ? window._relayLifelineStats : [];
        const first = stats[0] || null;
        return {
            count: stats.length,
            firstVertices: first?.vertices || 0,
            firstTimeboxes: first?.timeboxes || 0
        };
    });
    const stage4Pass = stage4Data.count > 0 && stage4Data.firstVertices >= 4 && stage4Data.firstTimeboxes >= 1;
    console.log(`[FILAMENT-LIFELINE-PROOF] stage=geometry count=${stage4Data.count} vertices=${stage4Data.firstVertices} timeboxes=${stage4Data.firstTimeboxes} result=${stage4Pass ? 'PASS' : 'FAIL'}`);
    if (!stage4Pass) failures++;

    // Stage 5: Lifecycle styling
    console.log('--- Stage 5: Lifecycle styling ---');
    const stage5Data = await page.evaluate(() => {
        const stats = Array.isArray(window._relayLifelineStats) ? window._relayLifelineStats : [];
        const lifecycles = new Set(stats.map((s) => s.lifecycle));
        const widths = stats.map((s) => Number(s.width || 0)).filter((v) => Number.isFinite(v));
        return {
            count: stats.length,
            lifecycleCount: lifecycles.size,
            minWidth: widths.length ? Math.min(...widths) : 0,
            maxWidth: widths.length ? Math.max(...widths) : 0
        };
    });
    const stage5Pass = stage5Data.count > 0 && stage5Data.lifecycleCount >= 2 && stage5Data.maxWidth >= stage5Data.minWidth;
    console.log(`[FILAMENT-LIFELINE-PROOF] stage=styling count=${stage5Data.count} lifecycleCount=${stage5Data.lifecycleCount} widthRange=${stage5Data.minWidth.toFixed(2)}-${stage5Data.maxWidth.toFixed(2)} result=${stage5Pass ? 'PASS' : 'FAIL'}`);
    if (!stage5Pass) failures++;
    await page.screenshot({ path: path.join(PROOF_DIR, '03-lifeline-style.png'), timeout: 60000 });

    // Stage 6: Mode boundary regression (must not render in canopy/megasheet)
    console.log('--- Stage 6: Mode boundary regression ---');
    await page.keyboard.press('Escape'); // back from sheet to canopy
    await page.waitForTimeout(1500);
    await page.keyboard.press('m'); // megasheet
    await page.waitForTimeout(1800);
    const stage6Data = await page.evaluate(() => ({
        mode: window._relayRenderMode,
        statsCount: Array.isArray(window._relayLifelineStats) ? window._relayLifelineStats.length : 0
    }));
    const stage6Pass = stage6Data.mode === 'MEGASHEET' && stage6Data.statsCount === 0;
    console.log(`[FILAMENT-LIFELINE-PROOF] stage=modeBoundary mode=${stage6Data.mode} lifelinesInMegasheet=${stage6Data.statsCount} result=${stage6Pass ? 'PASS' : 'FAIL'}`);
    if (!stage6Pass) failures++;

    const result = failures === 0 ? 'PASS' : 'FAIL';
    console.log(`\n[FILAMENT-LIFELINE-PROOF] gate-summary result=${result} stages=${6 - failures}/6`);

    fs.writeFileSync(LOG_PATH, logs.join('\n'), 'utf8');
    console.log(`Log written: ${LOG_PATH}`);
    console.log(`Screenshots: ${PROOF_DIR}`);

    await browser.close();
    process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
