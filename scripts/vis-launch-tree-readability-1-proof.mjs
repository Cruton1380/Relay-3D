/**
 * VIS-LAUNCH-TREE-READABILITY-1 proof
 *
 * Verifies launch/company readability tuning and scaffold regression safety.
 * Requires: npm run dev:cesium
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const DATE = new Date().toISOString().slice(0, 10);
const URL = 'http://localhost:3000/relay-cesium-world.html?profile=launch';
const PROOF_DIR = path.resolve(`archive/proofs/vis-launch-tree-readability-1-${DATE}`);
const LOG_PATH = path.resolve(`archive/proofs/vis-launch-tree-readability-1-console-${DATE}.log`);

async function main() {
    const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const logs = [];
    const pushLog = (line) => {
        const text = String(line);
        logs.push(text);
        console.log(text);
    };

    page.on('console', (msg) => {
        const text = msg.text();
        logs.push(text);
        console.log(text);
    });

    fs.mkdirSync(PROOF_DIR, { recursive: true });

    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(7000);
    await page.click('body');
    await page.waitForTimeout(500);

    let failures = 0;

    // Stage 1: launch/company capture (before reference frame)
    const stage1State = await page.evaluate(() => {
        const renderer = window.filamentRenderer;
        return {
            renderMode: window._relayRenderMode || null,
            lod: renderer?.currentLOD || null,
            scope: window.__relayEntryState?.scope || null,
            launchMode: window.RELAY_LAUNCH_MODE === true
        };
    });
    const stage1Pass = stage1State.launchMode && stage1State.renderMode === 'LAUNCH_CANOPY';
    await page.screenshot({
        path: path.join(PROOF_DIR, '01-launch-company-before.png'),
        timeout: 60000
    });
    pushLog(`[VIS-LAUNCH-PROOF] stage=1 label=launch-company-before result=${stage1Pass ? 'PASS' : 'FAIL'} detail=${JSON.stringify(stage1State)}`);
    if (!stage1Pass) failures += 1;

    // Stage 2: readability checks + after screenshot
    await page.evaluate(() => {
        if (window.filamentRenderer) window.filamentRenderer.renderTree('vis-launch-readability-proof');
    });
    await page.waitForTimeout(2500);
    const hasHierarchyLog = logs.some((l) => l.includes('[LAUNCH-FIX] visualHierarchy applied=PASS'));
    const hasRingContainmentLog = logs.some((l) => l.includes('[VIS-LAUNCH] ringContainment mode=collapsed action=suppressNonFocused result=PASS'));
    const hasRainDensityLog = logs.some((l) => l.includes('[PRES] filamentRain enabled=PASS density=2'));
    const stage2Pass = hasHierarchyLog && hasRingContainmentLog && hasRainDensityLog;
    await page.screenshot({
        path: path.join(PROOF_DIR, '02-launch-company-after.png'),
        timeout: 60000
    });
    pushLog(`[VIS-LAUNCH-PROOF] stage=2 label=readability-after result=${stage2Pass ? 'PASS' : 'FAIL'} detail=${JSON.stringify({ hasHierarchyLog, hasRingContainmentLog, hasRainDensityLog })}`);
    if (!stage2Pass) failures += 1;

    // Stage 3: scaffold unchanged regression check
    await page.keyboard.press('t');
    await page.waitForTimeout(3000);
    const stage3State = await page.evaluate(() => ({
        renderMode: window._relayRenderMode || null
    }));
    const hasScaffoldModeLog = logs.some((l) => l.includes('[MODE] renderMode=TREE_SCAFFOLD'));
    const stage3Pass = stage3State.renderMode === 'TREE_SCAFFOLD' && hasScaffoldModeLog;
    await page.screenshot({
        path: path.join(PROOF_DIR, '03-scaffold-unchanged.png'),
        timeout: 60000
    });
    pushLog(`[VIS-LAUNCH-PROOF] stage=3 label=scaffold-unchanged result=${stage3Pass ? 'PASS' : 'FAIL'} detail=${JSON.stringify({ ...stage3State, hasScaffoldModeLog })}`);
    if (!stage3Pass) failures += 1;

    const result = failures === 0 ? 'PASS' : 'FAIL';
    pushLog(`[VIS-LAUNCH-PROOF] gate-summary result=${result} stages=${3 - failures}/3`);

    fs.writeFileSync(LOG_PATH, logs.join('\n'), 'utf8');
    await browser.close();
    process.exit(failures > 0 ? 1 : 0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
