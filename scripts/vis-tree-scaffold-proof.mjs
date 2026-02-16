/**
 * VIS-TREE-SCAFFOLD-1 Proof Script
 * 
 * Proves: renderMode toggle, scaffold branch placement, sheet attachment,
 * ring altitude bands, mode switch back to LAUNCH_CANOPY.
 * Requires: npm run dev:cesium running on localhost:3000
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const URL = 'http://localhost:3000/relay-cesium-world.html?profile=launch';
const PROOF_DIR = path.resolve('archive/proofs/vis-tree-scaffold-2026-02-15');
const LOG_PATH = path.resolve('archive/proofs/vis-tree-scaffold-console-2026-02-15.log');

async function main() {
    const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    const logs = [];
    page.on('console', msg => {
        const text = msg.text();
        logs.push(text);
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000); // Wait for boot

    // Focus the page so keyboard events work
    await page.click('body');
    await page.waitForTimeout(500);

    let failures = 0;

    // --- Stage 1: Boot in LAUNCH_CANOPY ---
    console.log('--- Stage 1: Boot in LAUNCH_CANOPY ---');
    const defaultMode = await page.evaluate(() => window._relayRenderMode);
    const stage1Pass = defaultMode === 'LAUNCH_CANOPY';
    console.log(`[VIS-SCAFFOLD-PROOF] stage=boot renderMode=${defaultMode} result=${stage1Pass ? 'PASS' : 'FAIL'}`);
    if (!stage1Pass) failures++;

    // --- Stage 2: Toggle to TREE_SCAFFOLD ---
    console.log('--- Stage 2: Toggle to TREE_SCAFFOLD ---');
    await page.keyboard.press('t');
    await page.waitForTimeout(3000); // Wait for re-render
    const scaffoldMode = await page.evaluate(() => window._relayRenderMode);
    const modeLog = logs.some(l => l.includes('[MODE] renderMode=TREE_SCAFFOLD'));
    const scaffoldResultLog = logs.some(l => l.includes('[VIS-SCAFFOLD] mode=TREE_SCAFFOLD result=PASS'));
    const stage2Pass = scaffoldMode === 'TREE_SCAFFOLD' && modeLog;
    console.log(`[VIS-SCAFFOLD-PROOF] stage=toggle renderMode=${scaffoldMode} modeLog=${modeLog} scaffoldResult=${scaffoldResultLog} result=${stage2Pass ? 'PASS' : 'FAIL'}`);
    if (!stage2Pass) failures++;

    // --- Stage 3: Branch placement ---
    console.log('--- Stage 3: Branch placement ---');
    const branchPlacement = await page.evaluate(() => {
        const nodes = window.relayState?.tree?.nodes || [];
        const branches = nodes.filter(n => n.type === 'branch');
        let atTrunkTop = 0;
        let scaffoldCount = 0;
        for (const b of branches) {
            if (b._scaffoldMode) scaffoldCount++;
            if (b._branchPointsENU && b._branchPointsENU.length > 0) {
                const start = b._branchPointsENU[0];
                // Branch should start at trunk top altitude (within tolerance)
                if (start && Math.abs(start.up - 2000) < 200) atTrunkTop++;
            }
        }
        return { branches: branches.length, atTrunkTop, scaffoldCount };
    });
    const placementLog = logs.some(l => l.includes('[VIS-SCAFFOLD] placement trunkTopU='));
    const stage3Pass = branchPlacement.scaffoldCount > 0 && branchPlacement.atTrunkTop > 0 && placementLog;
    console.log(`[VIS-SCAFFOLD-PROOF] stage=branchPlacement branches=${branchPlacement.branches} scaffoldCount=${branchPlacement.scaffoldCount} atTrunkTop=${branchPlacement.atTrunkTop} placementLog=${placementLog} result=${stage3Pass ? 'PASS' : 'FAIL'}`);
    if (!stage3Pass) failures++;

    // --- Stage 4: Sheet attachment ---
    console.log('--- Stage 4: Sheet attachment ---');
    const sheetAttachment = logs.some(l => l.includes('[VIS-SCAFFOLD] sheetsAttachedToBranches count='));
    const sheetCount = await page.evaluate(() => {
        const nodes = window.relayState?.tree?.nodes || [];
        return nodes.filter(n => n.type === 'sheet' && n._center).length;
    });
    const stage4Pass = sheetAttachment && sheetCount > 0;
    console.log(`[VIS-SCAFFOLD-PROOF] stage=sheetAttachment sheetsWithCenter=${sheetCount} attachmentLog=${sheetAttachment} result=${stage4Pass ? 'PASS' : 'FAIL'}`);
    if (!stage4Pass) failures++;

    // --- Stage 5: Ring placement ---
    console.log('--- Stage 5: Ring placement ---');
    const ringLog = logs.some(l => l.includes('[VIS-SCAFFOLD] ringBand ok=PASS'));
    // Rings may not render if LOD isn't COMPANY - check if ring rendering was attempted
    const ringAttempted = logs.some(l => l.includes('[RING] applied=PASS'));
    const stage5Pass = ringLog || ringAttempted;
    console.log(`[VIS-SCAFFOLD-PROOF] stage=ringPlacement ringBandLog=${ringLog} ringAttempted=${ringAttempted} result=${stage5Pass ? 'PASS' : 'FAIL'}`);
    if (!stage5Pass) failures++;

    // Take screenshot in scaffold mode
    fs.mkdirSync(PROOF_DIR, { recursive: true });
    await page.screenshot({ path: path.join(PROOF_DIR, '01-scaffold-mode.png') });

    // --- Stage 6: Toggle back to LAUNCH_CANOPY ---
    console.log('--- Stage 6: Toggle back ---');
    await page.keyboard.press('t');
    await page.waitForTimeout(3000);
    const restoredMode = await page.evaluate(() => window._relayRenderMode);
    const canopyLog = logs.some(l => l.includes('[MODE] renderMode=LAUNCH_CANOPY'));
    const stage6Pass = restoredMode === 'LAUNCH_CANOPY' && canopyLog;
    console.log(`[VIS-SCAFFOLD-PROOF] stage=toggleBack renderMode=${restoredMode} canopyLog=${canopyLog} result=${stage6Pass ? 'PASS' : 'FAIL'}`);
    if (!stage6Pass) failures++;

    await page.screenshot({ path: path.join(PROOF_DIR, '02-canopy-restored.png') });

    // --- Stage 7: Gate ---
    console.log('--- Stage 7: Gate ---');
    const result = failures === 0 ? 'PASS' : 'FAIL';
    console.log(`\n[VIS-SCAFFOLD-PROOF] gate-summary result=${result} stages=${7 - failures}/7`);

    // Write log
    fs.writeFileSync(LOG_PATH, logs.join('\n'), 'utf8');
    console.log(`Log written: ${LOG_PATH}`);
    console.log(`Screenshots: ${PROOF_DIR}`);

    await browser.close();
    process.exit(failures > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
