/**
 * FILAMENT-LIFECYCLE-1 proof script.
 * 8 stages: Boot → Focus Company → State Transitions → Band Alignment →
 *           Closure Enforcement → Trunk Absorption → Turnover Rate → Gate.
 * Requires: server running at localhost:3000 or starts it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOTS_DIR = path.join(PROOFS_DIR, `filament-lifecycle-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `filament-lifecycle-console-${DATE_TAG}.log`);
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
        const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
        await page.addInitScript(() => {
            window.RELAY_DEBUG_VERBOSE = true;
            window.RELAY_DEBUG_LOGS = true;
        });
        const consoleLogs = [];
        page.on('console', (msg) => consoleLogs.push(msg.text()));
        await page.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForFunction(
            () => typeof window.relayGetProfile === 'function'
                && !!window.filamentRenderer
                && !!window.relayState
                && window.relayState.filaments && window.relayState.filaments.size > 0,
            undefined,
            { timeout: 120000 }
        );
        await sleep(3000);

        // ───────── Stage 1: Boot ─────────
        log('--- Stage 1: Boot ---');
        const registryLog = consoleLogs.find(l => l.includes('[FILAMENT] registry initialized=PASS'));
        const registryOk = !!registryLog;
        stageResults.push({ stage: 'Boot', pass: registryOk });
        log(`[FILAMENT-PROOF] stage=boot registry=${registryOk} log=${registryLog || 'MISSING'}`);

        // ───────── Stage 2: Focus Company ─────────
        log('--- Stage 2: Focus Company ---');
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
        // Force a render to ensure markers are placed
        await page.evaluate(() => {
            if (window.filamentRenderer) window.filamentRenderer.renderTree('filament-proof-focus');
        });
        await sleep(2000);
        const markerLogs = consoleLogs.filter(l => l.includes('[FILAMENT] bandSnap id='));
        const markersOk = markerLogs.length > 0;
        stageResults.push({ stage: 'FocusCompany', pass: markersOk });
        log(`[FILAMENT-PROOF] stage=focusCompany markers=${markerLogs.length} result=${markersOk ? 'PASS' : 'FAIL'}`);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-markers-company.png'), fullPage: false });

        // ───────── Stage 3: State Transitions ─────────
        log('--- Stage 3: State Transitions ---');
        // Transition FIL-001 from DRAFT->PROPOSE (work) and OPEN->ACTIVE (lifecycle)
        await page.evaluate(() => {
            window.transitionWorkState('FIL-001', 'PROPOSE');
            window.transitionLifecycleState('FIL-001', 'ACTIVE');
        });
        await sleep(1000);
        const workTransLog = consoleLogs.find(l => l.includes('[FILAMENT] workTransition id=FIL-001') && l.includes('result=PASS'));
        const lifecycleTransLog = consoleLogs.find(l => l.includes('[FILAMENT] lifecycleTransition id=FIL-001') && l.includes('result=PASS'));
        const transitionsOk = !!workTransLog && !!lifecycleTransLog;
        stageResults.push({ stage: 'StateTransitions', pass: transitionsOk });
        log(`[FILAMENT-PROOF] stage=stateTransitions work=${!!workTransLog} lifecycle=${!!lifecycleTransLog} result=${transitionsOk ? 'PASS' : 'FAIL'}`);
        // Force re-render for updated markers
        await page.evaluate(() => {
            if (window.filamentRenderer) window.filamentRenderer.renderTree('filament-proof-transitions');
        });
        await sleep(2000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-after-transitions.png'), fullPage: false });

        // ───────── Stage 4: Band Alignment ─────────
        log('--- Stage 4: Band Alignment ---');
        const bandSnapLogs = consoleLogs.filter(l => l.includes('[FILAMENT] bandSnap id='));
        const bandSourceLog = consoleLogs.find(l => l.includes('[FILAMENT] bandSnap source='));
        let allDeltaOk = true;
        for (const bsLog of bandSnapLogs) {
            const match = bsLog.match(/deltaM=([0-9.]+)/);
            if (match) {
                const deltaM = parseFloat(match[1]);
                if (deltaM > 5) { allDeltaOk = false; log(`[FILAMENT-PROOF] bandSnap EXCEEDS threshold: ${bsLog}`); }
            }
        }
        const bandOk = bandSnapLogs.length > 0 && allDeltaOk && !!bandSourceLog;
        stageResults.push({ stage: 'BandAlignment', pass: bandOk });
        log(`[FILAMENT-PROOF] stage=bandAlignment snaps=${bandSnapLogs.length} allDeltaOk=${allDeltaOk} source=${!!bandSourceLog} result=${bandOk ? 'PASS' : 'FAIL'}`);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-band-snap.png'), fullPage: false });

        // ───────── Stage 5: Closure Enforcement ─────────
        log('--- Stage 5: Closure Enforcement ---');
        // FIL-002 is workState=ACTIVE (not COMMIT) — close should be refused
        const preRefusalCount = consoleLogs.filter(l => l.includes('[REFUSAL]')).length;
        await page.evaluate(() => {
            // Attempt to transition FIL-002 (workState=ACTIVE) to SETTLING then CLOSED — should fail at CLOSED
            window.transitionLifecycleState('FIL-002', 'SETTLING');
            window.transitionLifecycleState('FIL-002', 'CLOSED');
        });
        await sleep(1000);
        const postRefusalLogs = consoleLogs.filter(l => l.includes('[REFUSAL]'));
        const refusalOk = postRefusalLogs.length > preRefusalCount;
        const refusalLine = postRefusalLogs.find(l => l.includes('FILAMENT_CLOSE_BLOCKED'));
        stageResults.push({ stage: 'ClosureEnforcement', pass: refusalOk });
        log(`[FILAMENT-PROOF] stage=closureEnforcement refusals=${postRefusalLogs.length - preRefusalCount} line=${refusalLine || 'MISSING'} result=${refusalOk ? 'PASS' : 'FAIL'}`);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-closure-refusal.png'), fullPage: false });

        // ───────── Stage 6: Trunk Absorption ─────────
        log('--- Stage 6: Trunk Absorption ---');
        // FIL-003 is SETTLING with workState=COMMIT — transition to CLOSED then ARCHIVED
        // First ensure FIN-T1 has openDrifts=0 for FIL-003
        await page.evaluate(() => {
            // Fix FIN-T1 openDrifts for deterministic close
            const branch = window.relayState.tree.nodes.find(n => n.id === 'branch.finance');
            if (branch && branch.timeboxes) {
                const tb = branch.timeboxes.find(t => t.timeboxId === 'FIN-T1');
                if (tb) tb.openDrifts = 0;
            }
            window.transitionLifecycleState('FIL-003', 'CLOSED');
            window.transitionLifecycleState('FIL-003', 'ARCHIVED');
        });
        await sleep(1000);
        const archiveLog = consoleLogs.find(l => l.includes('[TIMEBOX] event type=FILAMENT_ARCHIVE') && l.includes('applied=PASS'));
        const archiveOk = !!archiveLog;
        stageResults.push({ stage: 'TrunkAbsorption', pass: archiveOk });
        log(`[FILAMENT-PROOF] stage=trunkAbsorption log=${archiveLog || 'MISSING'} result=${archiveOk ? 'PASS' : 'FAIL'}`);

        // ───────── Stage 7: Turnover Rate ─────────
        log('--- Stage 7: Turnover Rate ---');
        const turnoverLog = consoleLogs.find(l => l.includes('[FILAMENT] turnover id=FIL-003') && l.includes('result=PASS'));
        let turnoverDurationOk = false;
        if (turnoverLog) {
            const match = turnoverLog.match(/durationMs=(\d+)/);
            if (match && parseInt(match[1], 10) > 0) turnoverDurationOk = true;
        }
        const branchTurnoverLog = consoleLogs.find(l => l.includes('[FILAMENT] branchTurnover') && l.includes('result=PASS'));
        const turnoverOk = turnoverDurationOk && !!branchTurnoverLog;
        stageResults.push({ stage: 'TurnoverRate', pass: turnoverOk });
        log(`[FILAMENT-PROOF] stage=turnoverRate turnover=${turnoverDurationOk} branchAggregate=${!!branchTurnoverLog} result=${turnoverOk ? 'PASS' : 'FAIL'}`);

        // ───────── Stage 8: Gate ─────────
        log('--- Stage 8: Gate ---');
        const allPass = stageResults.every(s => s.pass);
        const passCount = stageResults.filter(s => s.pass).length;
        const gateLine = `[FILAMENT-PROOF] gate-summary result=${allPass ? 'PASS' : 'FAIL'} stages=${passCount}/${stageResults.length}`;
        log(gateLine);

        // Write log
        const fullLog = consoleLogs.join('\n') + '\n\n--- FILAMENT-LIFECYCLE-1 proof ---\n' + lines.join('\n');
        await fs.writeFile(LOG_FILE, fullLog, 'utf8');
        log(`Log written: ${LOG_FILE}`);

        if (!allPass) process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
        if (devServer) await stopServer(devServer);
    }
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
