/**
 * FILAMENT-DISCLOSURE-1 proof script.
 * 8 stages: Boot+Restore → Auto-upgrade → Manual Disclosure →
 *           Downgrade Refusal → Governance Gating → Persistence →
 *           Marker Overlay → Gate.
 * Requires: server running at localhost:3000 or starts it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOTS_DIR = path.join(PROOFS_DIR, `filament-disclosure-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `filament-disclosure-console-${DATE_TAG}.log`);
const WORLD_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=launch';

const lines = [];
const log = (line) => { const msg = String(line); lines.push(msg); console.log(msg); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForUrl(url, timeoutMs = 60000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try { const res = await fetch(url, { method: 'GET' }); if (res.ok) return true; } catch { /* retry */ }
        await sleep(500);
    }
    return false;
}

async function startServerIfNeeded(commandArgs, readyUrl) {
    const ready = await waitForUrl(readyUrl, 2500);
    if (ready) return { child: null, started: false };
    const child = spawn(process.execPath, commandArgs, {
        cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, env: { ...process.env }
    });
    const becameReady = await waitForUrl(readyUrl, 60000);
    if (!becameReady) { child.kill('SIGINT'); throw new Error(`SERVER_NOT_READY ${readyUrl}`); }
    return { child, started: true };
}

async function stopServer(handle) {
    if (!handle?.started || !handle?.child || handle.child.killed) return;
    const child = handle.child;
    child.kill('SIGINT');
    await Promise.race([
        new Promise((r) => child.once('close', r)),
        sleep(3000).then(() => { if (!child.killed) child.kill('SIGKILL'); })
    ]);
}

async function main() {
    await fs.mkdir(PROOFS_DIR, { recursive: true });
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    let devServer = null;
    let browser = null;
    const stageResults = [];

    try {
        devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], WORLD_URL);
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
        const page = await context.newPage();
        await page.addInitScript(() => {
            window.RELAY_DEBUG_VERBOSE = true;
            window.RELAY_DEBUG_LOGS = true;
        });
        const consoleLogs = [];
        page.on('console', (msg) => consoleLogs.push(msg.text()));

        // Clear disclosure store to start fresh (one-time, on first page only)
        await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.evaluate(() => {
            try { localStorage.removeItem('RELAY_FILAMENT_DISCLOSURE_STORE_V0'); } catch {}
        });
        // Reload so the page boots with a clean store
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForFunction(
            () => typeof window.transitionVisibility === 'function'
                && !!window.filamentRenderer
                && !!window.relayState
                && window.relayState.filaments && window.relayState.filaments.size > 0,
            undefined,
            { timeout: 120000 }
        );
        await sleep(3000);

        // ───────── Stage 1: Boot + Restore ─────────
        log('--- Stage 1: Boot + Restore ---');
        const restoreLog = consoleLogs.find(l => l.includes('[DISCLOSURE] restore backend=localStorage') && l.includes('result=PASS'));
        const restoreOk = !!restoreLog;
        stageResults.push({ stage: 'BootRestore', pass: restoreOk });
        log(`[DISCLOSURE-PROOF] stage1 bootRestore: ${restoreLog || 'MISSING'} => ${restoreOk ? 'PASS' : 'FAIL'}`);

        // ───────── Stage 2: Auto-upgrade on lifecycle ─────────
        log('--- Stage 2: Auto-upgrade on lifecycle ---');
        // FIL-003 (SETTLING) should auto-upgrade to WITNESSED
        const fil003Auto = consoleLogs.find(l =>
            l.includes('[DISCLOSURE] id=FIL-003') && l.includes('to=WITNESSED') && l.includes('reason=lifecycle_default') && l.includes('result=PASS'));
        // FIL-004 (CLOSED) should auto-upgrade to PUBLIC_SUMMARY
        const fil004Auto = consoleLogs.find(l =>
            l.includes('[DISCLOSURE] id=FIL-004') && l.includes('to=PUBLIC_SUMMARY') && l.includes('reason=lifecycle_default') && l.includes('result=PASS'));
        // FIL-005 (ARCHIVED) should auto-upgrade to PUBLIC_SUMMARY
        const fil005Auto = consoleLogs.find(l =>
            l.includes('[DISCLOSURE] id=FIL-005') && l.includes('to=PUBLIC_SUMMARY') && l.includes('reason=lifecycle_default') && l.includes('result=PASS'));
        // FIL-006 (REFUSAL) should auto-upgrade to WITNESSED
        const fil006Auto = consoleLogs.find(l =>
            l.includes('[DISCLOSURE] id=FIL-006') && l.includes('to=WITNESSED') && l.includes('reason=lifecycle_default') && l.includes('result=PASS'));
        const autoUpgradeOk = !!fil003Auto && !!fil004Auto && !!fil005Auto && !!fil006Auto;
        stageResults.push({ stage: 'AutoUpgrade', pass: autoUpgradeOk });
        log(`[DISCLOSURE-PROOF] stage2 autoUpgrade: FIL-003=${!!fil003Auto} FIL-004=${!!fil004Auto} FIL-005=${!!fil005Auto} FIL-006=${!!fil006Auto} => ${autoUpgradeOk ? 'PASS' : 'FAIL'}`);

        // ───────── Stage 3: Manual disclosure ─────────
        log('--- Stage 3: Manual disclosure ---');
        // FIL-001 is OPEN/PRIVATE — upgrade to WITNESSED via Simulate Disclosure
        await page.evaluate(() => { window.relaySimulateDisclosure(); });
        await sleep(1000);
        const manualLog = consoleLogs.find(l =>
            l.includes('[DISCLOSURE] id=FIL-001') && l.includes('from=PRIVATE') && l.includes('to=WITNESSED') && l.includes('reason=demo_manual') && l.includes('result=PASS'));
        const evidenceLog = consoleLogs.find(l =>
            l.includes('[DISCLOSURE] evidenceAppended id=FIL-001') && l.includes('count=1') && l.includes('result=PASS'));
        const manualOk = !!manualLog && !!evidenceLog;
        stageResults.push({ stage: 'ManualDisclosure', pass: manualOk });
        log(`[DISCLOSURE-PROOF] stage3 manualDisclosure: transition=${!!manualLog} evidence=${!!evidenceLog} => ${manualOk ? 'PASS' : 'FAIL'}`);

        // ───────── Stage 4: Downgrade refusal ─────────
        log('--- Stage 4: Downgrade refusal ---');
        // FIL-001 is now WITNESSED — attempt downgrade to PRIVATE
        await page.evaluate(() => { window.transitionVisibility('FIL-001', 'PRIVATE', 'test_downgrade'); });
        await sleep(500);
        const downgradeRefusal = consoleLogs.find(l =>
            l.includes('[REFUSAL] reason=DISCLOSURE_DOWNGRADE_BLOCKED') && l.includes('filament=FIL-001') && l.includes('attempted=PRIVATE'));
        const downgradeOk = !!downgradeRefusal;
        stageResults.push({ stage: 'DowngradeRefusal', pass: downgradeOk });
        log(`[DISCLOSURE-PROOF] stage4 downgradeRefusal: ${downgradeRefusal || 'MISSING'} => ${downgradeOk ? 'PASS' : 'FAIL'}`);

        // ───────── Stage 5: Governance gating ─────────
        log('--- Stage 5: Governance gating ---');
        // FIL-001 is now WITNESSED. Try FULL_PUBLIC — requires vote PASSED.
        // Reset branch.finance voteStatus to PENDING to test governance refusal
        await page.evaluate(() => {
            const branch = window.relayState.tree.nodes.find(n => n.id === 'branch.finance');
            if (branch) branch.voteStatus = 'PENDING';
        });
        await page.evaluate(() => { window.transitionVisibility('FIL-001', 'FULL_PUBLIC', 'test_governance'); });
        await sleep(500);
        const govRefusal = consoleLogs.find(l =>
            l.includes('[REFUSAL] reason=DISCLOSURE_REQUIRES_VOTE') && l.includes('filament=FIL-001') && l.includes('attempted=FULL_PUBLIC'));
        const govOk = !!govRefusal;
        stageResults.push({ stage: 'GovernanceGating', pass: govOk });
        log(`[DISCLOSURE-PROOF] stage5 governanceGating: ${govRefusal || 'MISSING'} => ${govOk ? 'PASS' : 'FAIL'}`);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-refusal.png'), fullPage: false });

        // ───────── Stage 6: Persistence ─────────
        log('--- Stage 6: Persistence ---');
        const persistLog = consoleLogs.find(l =>
            l.includes('[DISCLOSURE] persist backend=localStorage') && l.includes('result=PASS'));
        const persistOk = !!persistLog;
        log(`[DISCLOSURE-PROOF] stage6a persist: ${persistLog || 'MISSING'} => ${persistOk ? 'PASS' : 'FAIL'}`);

        // Reload page and check restore
        const consoleLogs2 = [];
        const page2 = await context.newPage();
        page2.on('console', (msg) => consoleLogs2.push(msg.text()));
        await page2.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page2.waitForFunction(
            () => typeof window.transitionVisibility === 'function'
                && !!window.relayState
                && window.relayState.filaments && window.relayState.filaments.size > 0,
            undefined,
            { timeout: 120000 }
        );
        await sleep(3000);
        const restoreLog2 = consoleLogs2.find(l =>
            l.includes('[DISCLOSURE] restore backend=localStorage') && l.includes('result=PASS'));
        let restoredTiers = {};
        if (restoreLog2) {
            restoredTiers = await page2.evaluate(() => {
                const tiers = {};
                for (const [fId, fil] of window.relayState.filaments) {
                    tiers[fId] = fil.visibilityScope || 'PRIVATE';
                }
                return tiers;
            });
        }
        // FIL-001 should be WITNESSED (persisted from manual disclosure)
        const fil001Restored = restoredTiers['FIL-001'] === 'WITNESSED';
        // FIL-003 should be WITNESSED (lifecycle default, persisted)
        const fil003Restored = restoredTiers['FIL-003'] === 'WITNESSED';
        const restoreReloadOk = !!restoreLog2 && fil001Restored && fil003Restored;
        stageResults.push({ stage: 'Persistence', pass: persistOk && restoreReloadOk });
        log(`[DISCLOSURE-PROOF] stage6b restore: restoreLog=${!!restoreLog2} FIL-001=${restoredTiers['FIL-001']} FIL-003=${restoredTiers['FIL-003']} => ${restoreReloadOk ? 'PASS' : 'FAIL'}`);
        await page2.close();

        // ───────── Stage 7: Marker overlay ─────────
        log('--- Stage 7: Marker overlay ---');
        // Fly to COMPANY LOD and force render
        await page.evaluate(() => {
            window.__relayStressModeActive = false;
            window.__relayDeferredRenderPending = false;
            window.__relayPostGateQuietUntil = 0;
            const viewer = window.viewer;
            const relayState = window.relayState;
            if (viewer?.camera && relayState?.tree?.nodes?.length) {
                const trunk = relayState.tree.nodes.find(n => n?.type === 'trunk');
                if (trunk && Number.isFinite(trunk.lat) && Number.isFinite(trunk.lon)) {
                    viewer.camera.setView({
                        destination: Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 25000),
                        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 }
                    });
                }
            }
        });
        await sleep(4000);
        // Force render to pick up disclosure overlays
        await page.evaluate(() => {
            if (window.filamentRenderer) {
                window.filamentRenderer._disclosureMarkersLogEmitted = false;
                window.filamentRenderer.renderTree('disclosure-proof-markers');
            }
        });
        await sleep(2000);
        const markerLog = consoleLogs.find(l => l.includes('[DISCLOSURE] markersRendered count='));
        let markerOk = false;
        if (markerLog) {
            // Verify tier distribution includes non-PRIVATE tiers
            const match = markerLog.match(/WITNESSED:(\d+)/);
            if (match && parseInt(match[1], 10) > 0) markerOk = true;
        }
        stageResults.push({ stage: 'MarkerOverlay', pass: markerOk });
        log(`[DISCLOSURE-PROOF] stage7 markerOverlay: ${markerLog || 'MISSING'} => ${markerOk ? 'PASS' : 'FAIL'}`);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-boot.png'), fullPage: false });

        // Screenshot after disclosure transitions are visible
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-after-disclosure.png'), fullPage: false });

        // ───────── Stage 8: Gate ─────────
        log('--- Stage 8: Gate ---');
        const allPass = stageResults.every(s => s.pass);
        const passCount = stageResults.filter(s => s.pass).length;
        const gateLine = `[DISCLOSURE-PROOF] gate-summary result=${allPass ? 'PASS' : 'FAIL'} stages=${passCount}/${stageResults.length}`;
        log(gateLine);

        // Write log
        const fullLog = consoleLogs.join('\n') + '\n\n--- FILAMENT-DISCLOSURE-1 proof ---\n' + lines.join('\n');
        await fs.writeFile(LOG_FILE, fullLog, 'utf8');
        log(`Log written: ${LOG_FILE}`);

        if (!allPass) process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
        if (devServer) await stopServer(devServer);
    }
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
