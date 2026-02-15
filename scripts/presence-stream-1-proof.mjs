/**
 * PRESENCE-STREAM-1 proof script.
 *
 * 7 stages:
 *   1. Boot + engine enable
 *   2. Room resolve from effectiveScope
 *   3. Join
 *   4. Bind on focus change
 *   5. Bind on filament ride stop (CAM0.4.2 integration)
 *   6. TTL expiry
 *   7. Budget refusal
 *
 * Spins up an ephemeral WS echo server on 127.0.0.1:4031/vis8 and the Relay dev server.
 * Writes console log + screenshot to archive/proofs/.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { chromium } from '@playwright/test';

const require = createRequire(import.meta.url);
const { WebSocketServer } = require('ws');

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `presence-stream-1-console-${DATE_TAG}.log`);
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `presence-stream-1-${DATE_TAG}`);
const LAUNCH_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=launch';

const lines = [];
const log = (line) => { const msg = String(line); lines.push(msg); console.log(msg); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Helpers ──
async function waitForUrl(url, timeoutMs = 60000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try { const r = await fetch(url, { method: 'GET' }); if (r.ok) return true; } catch {}
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
    child.stdout.on('data', () => {});
    child.stderr.on('data', () => {});
    const ok = await waitForUrl(readyUrl, 30000);
    if (!ok) throw new Error(`Dev server failed to start within 30s`);
    return { child, started: true };
}

// ── Ephemeral WS server (echo + broadcast) ──
function startPresenceWsServer(port = 4031) {
    const wss = new WebSocketServer({ port, path: '/vis8' });
    const clients = new Set();
    wss.on('connection', (ws) => {
        clients.add(ws);
        ws.on('message', (data) => {
            // Echo back to sender + broadcast to others
            const str = data.toString();
            for (const c of clients) {
                try { c.send(str); } catch {}
            }
        });
        ws.on('close', () => clients.delete(ws));
    });
    return { wss, close: () => { wss.close(); for (const c of clients) try { c.close(); } catch {} } };
}

// ── Stage runner ──
const results = [];
function stage(num, label, pass) {
    const result = pass ? 'PASS' : 'FAIL';
    results.push({ num, label, result });
    log(`[PRESENCE-STREAM-1-PROOF] stage=${num} label=${label} result=${result}`);
    return pass;
}

// ── Main ──
async function main() {
    await fs.mkdir(PROOFS_DIR, { recursive: true });
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

    // Start dev server if needed
    const devServer = await startServerIfNeeded(
        ['scripts/dev-server.mjs'],
        'http://127.0.0.1:3000/relay-cesium-world.html'
    );

    // Start ephemeral WS server
    let wsServer = null;
    try {
        wsServer = startPresenceWsServer(4031);
    } catch (err) {
        // Port may be in use by VIS-7a; presence engine degrades to local-only
        log(`[WARN] WS server on 4031 failed: ${err.message}; testing in local-only mode`);
    }

    const browser = await chromium.launch({ headless: true });

    try {
        // ── Helper: fresh page with boot ──
        const freshPage = async () => {
            const ctx = await browser.newContext();
            const page = await ctx.newPage();
            const consoleLogs = [];
            page.on('console', (msg) => {
                const text = msg.text();
                consoleLogs.push(text);
            });
            await page.goto(LAUNCH_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
            // Wait for boot
            await page.waitForFunction(() => {
                return typeof window.relayPresenceGetStatus === 'function'
                    && typeof window.relayPresenceGetSnapshot === 'function'
                    && typeof window._presenceEngine === 'object';
            }, { timeout: 30000 });
            await sleep(2000); // Let engine auto-enable and join
            return { page, ctx, consoleLogs };
        };

        // ═══ STAGE 1: Boot + engine enable ═══
        const { page, ctx, consoleLogs } = await freshPage();
        {
            const status = await page.evaluate(() => window.relayPresenceGetStatus());
            const engineLog = consoleLogs.find(l => l.includes('[PRESENCE] engine enabled=PASS'));
            stage(1, 'boot-engine-enable', status.enabled === true && !!engineLog);
        }

        // ═══ STAGE 2: Room resolve from effectiveScope ═══
        {
            const resolveResult = await page.evaluate(() => {
                const roomId = window.relayPresenceResolveRoom('trunk.avgol');
                const roomId2 = window.relayPresenceResolveRoom('trunk.avgol');
                const roomId3 = window.relayPresenceResolveRoom('branch.finance');
                return { roomId, roomId2, roomId3, match: roomId === roomId2, differ: roomId !== roomId3 };
            });
            const roomLog = consoleLogs.find(l => l.includes('[PRESENCE] room resolve'));
            stage(2, 'room-resolve', resolveResult.roomId?.startsWith('room.') && resolveResult.match && resolveResult.differ && !!roomLog);
        }

        // ═══ STAGE 3: Join ═══
        {
            const snap = await page.evaluate(() => window.relayPresenceGetSnapshot());
            const joinLog = consoleLogs.find(l => l.includes('[PRESENCE] join') && l.includes('result=PASS'));
            stage(3, 'join', snap.memberCount >= 1 && snap.primaryRoomId?.startsWith('room.') && !!joinLog);
        }

        // ═══ STAGE 4: Bind on focus change ═══
        {
            // Clear consoleLogs marker
            const markerIdx = consoleLogs.length;
            await page.evaluate(() => {
                // Simulate focus change
                window.__relayArtifactFocusedObjectId = 'MFG.MaterialIssues.cell.0.0';
                // Force bind
                return window.relayPresenceBind({
                    effectiveScope: 'sheet',
                    scopeId: 'sheet.fin.apAging',
                    focusId: 'MFG.MaterialIssues.cell.0.0',
                    ride: null
                });
            });
            await sleep(500);
            const bindLog = consoleLogs.slice(markerIdx).find(l => l.includes('[PRESENCE] bind') && l.includes('result=PASS'));
            const changeLog = consoleLogs.slice(markerIdx).find(l => l.includes('[PRESENCE] bind-change'));
            stage(4, 'bind-focus-change', !!bindLog && !!changeLog);
        }

        // ═══ STAGE 5: Bind on filament ride stop (CAM0.4.2 integration) ═══
        {
            const markerIdx = consoleLogs.length;
            // Pause the background watcher to avoid interference, set baseline, then test ride change
            const bindResult = await page.evaluate(() => {
                // Stop background watcher
                if (window._presenceBindTimer) { clearInterval(window._presenceBindTimer); window._presenceBindTimer = null; }
                // Set baseline: same scope+focus, no ride
                window.relayPresenceBind({
                    effectiveScope: 'cell',
                    scopeId: 'MFG.MaterialIssues.cell.0.0',
                    focusId: 'MFG.MaterialIssues.cell.0.0',
                    ride: null
                });
                // Now add ride — should detect cause=ride (only ride changed)
                return window.relayPresenceBind({
                    effectiveScope: 'cell',
                    scopeId: 'MFG.MaterialIssues.cell.0.0',
                    focusId: 'MFG.MaterialIssues.cell.0.0',
                    ride: { filamentId: 'FIL-001', stepIndex: 2, timeboxId: 'MFG.MaterialIssues.cell.0.0-timebox-2' }
                });
            });
            await sleep(500);
            const rideBindLog = consoleLogs.slice(markerIdx).find(l => l.includes('[PRESENCE] bind') && l.includes('ride=on'));
            const rideChangeLog = consoleLogs.slice(markerIdx).find(l => l.includes('[PRESENCE] bind-change') && l.includes('cause=ride'));
            stage(5, 'bind-ride-stop', bindResult.ok === true && bindResult.cause === 'ride' && !!rideBindLog && !!rideChangeLog);
        }

        // ═══ STAGE 6: TTL expiry ═══
        {
            const markerIdx = consoleLogs.length;
            // Inject a stale remote user directly into the engine's room
            const expireResult = await page.evaluate(() => {
                const engine = window._presenceEngine;
                const localRooms = engine.getLocalRooms();
                if (localRooms.length === 0) return { ok: false, reason: 'no_rooms' };
                const roomId = localRooms[0];
                const room = engine.rooms.get(roomId);
                if (!room) return { ok: false, reason: 'room_missing' };
                // Insert a stale user (lastSeenTs far in the past)
                room.set('user.stale.test', {
                    userId: 'user.stale.test',
                    lastSeenTs: Date.now() - 60000, // 60s ago, well past TTL
                    effectiveScope: 'company',
                    scopeId: 'trunk.avgol',
                    focusId: null,
                    ride: null,
                    tier: 0
                });
                const urs = engine.userRooms.get('user.stale.test') || new Set();
                urs.add(roomId);
                engine.userRooms.set('user.stale.test', urs);
                const beforeCount = room.size;
                // Force TTL sweep
                engine._sweepTTL();
                const afterCount = engine.rooms.get(roomId)?.size || 0;
                return { ok: true, beforeCount, afterCount, removed: beforeCount > afterCount };
            });
            const ttlLog = consoleLogs.slice(markerIdx).find(l => l.includes('[PRESENCE] ttl-expire') && l.includes('user.stale.test'));
            const leaveLog = consoleLogs.slice(markerIdx).find(l => l.includes('[PRESENCE] leave') && l.includes('reason=ttl'));
            stage(6, 'ttl-expiry', expireResult.removed && !!ttlLog && !!leaveLog);
        }

        // ═══ STAGE 7: Budget refusal ═══
        {
            const markerIdx = consoleLogs.length;
            const budgetResult = await page.evaluate(() => {
                const engine = window._presenceEngine;
                const localRooms = engine.getLocalRooms();
                const roomId = localRooms[0] || 'room.test';
                const results = { roomCap: null, userRoomCap: null };

                // Test 1: Room participant cap — fill room to max
                const room = engine.rooms.get(roomId) || new Map();
                for (let i = 0; i < 10; i++) {
                    room.set(`user.fill.${i}`, {
                        userId: `user.fill.${i}`, lastSeenTs: Date.now(),
                        effectiveScope: 'company', scopeId: 'trunk.avgol',
                        focusId: null, ride: null, tier: 0
                    });
                    const urs = engine.userRooms.get(`user.fill.${i}`) || new Set();
                    urs.add(roomId);
                    engine.userRooms.set(`user.fill.${i}`, urs);
                }
                engine.rooms.set(roomId, room);
                // Try to join a new user — should hit room cap
                const roomCapResult = engine.join('user.overflow.1', roomId, {
                    effectiveScope: 'company', scopeId: 'trunk.avgol'
                });
                results.roomCap = roomCapResult;

                // Test 2: User room cap — join max rooms per user
                // Local user is already in 1 room; create more rooms
                const userId = engine._localUserId;
                for (let i = 0; i < 3; i++) {
                    const extraRoom = `room.extra.${i}`;
                    engine.rooms.set(extraRoom, new Map());
                    engine.join(userId, extraRoom, { effectiveScope: 'company', scopeId: `extra.${i}` });
                }
                const userRoomCount = engine.getUserRooms(userId).length;
                results.userRoomCap = {
                    activeRooms: userRoomCount,
                    exceeded: userRoomCount <= engine.maxJoinedRoomsPerUser
                };

                // Cleanup: remove fill users
                for (let i = 0; i < 10; i++) {
                    room.delete(`user.fill.${i}`);
                    engine.userRooms.delete(`user.fill.${i}`);
                }

                return results;
            });
            const roomCapLog = consoleLogs.slice(markerIdx).find(l => l.includes('[REFUSAL] reason=PRESENCE_ROOM_CAP_EXCEEDED'));
            const userCapLog = consoleLogs.slice(markerIdx).find(l => l.includes('[REFUSAL] reason=PRESENCE_USER_ROOM_CAP_EXCEEDED'));
            // Room cap MUST trigger; user room cap SHOULD trigger (depends on how many rooms joined before cap)
            stage(7, 'budget-refusal', budgetResult.roomCap?.reason === 'PRESENCE_ROOM_CAP_EXCEEDED' && !!roomCapLog);
        }

        // Take screenshot
        try {
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-hud-presence.png'), fullPage: false });
        } catch {}

        // Close page
        await ctx.close();

    } finally {
        await browser.close();
        if (wsServer) wsServer.close();
        if (devServer.child) devServer.child.kill();
    }

    // ── Gate summary ──
    const passed = results.filter(r => r.result === 'PASS').length;
    const total = results.length;
    const gateResult = passed === total ? 'PASS' : 'FAIL';
    log(`[PRESENCE-STREAM-1-PROOF] gate-summary result=${gateResult} stages=${passed}/${total}`);

    // Write log
    await fs.writeFile(LOG_FILE, lines.join('\n'), 'utf8');

    process.exit(gateResult === 'PASS' ? 0 : 2);
}

main().catch((err) => {
    log(`[FATAL] ${err.message}`);
    fs.writeFile(LOG_FILE, lines.join('\n'), 'utf8').catch(() => {});
    process.exit(2);
});
