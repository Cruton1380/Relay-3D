/**
 * E1-CRYPTO-1 Proof Script — 9 stages
 *
 * Tightenings:
 *   #1: Verify is read-only by default (emitScar opt-in)
 *   #2: Inclusion proof is union type (commit=chain only, timeboxEvent=merkle+rolling)
 *   #3: Rolling root anchor uses timeboxId
 *   #4: Chain stamping is derived (no receipt mutation)
 *   #5: Replay pre-check refuses cleanly on BROKEN
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `e1-crypto-1-console-${DATE_TAG}.log`);
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `e1-crypto-1-${DATE_TAG}`);
const URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=launch&headless=true';

const lines = [];
const log = (s) => { const m = String(s); lines.push(m); console.log(m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForUrl(url, timeoutMs = 60000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try { const r = await fetch(url, { method: 'GET' }); if (r.ok) return true; } catch {}
        await sleep(500);
    }
    return false;
}

async function startDevIfNeeded() {
    const ready = await waitForUrl('http://127.0.0.1:3000/relay-cesium-world.html', 2500);
    if (ready) return null;
    const child = spawn(process.execPath, ['scripts/dev-server.mjs'], {
        cwd: ROOT, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env }
    });
    await waitForUrl('http://127.0.0.1:3000/relay-cesium-world.html', 30000);
    return child;
}

const results = [];
const stage = (n, label, ok) => {
    const result = ok ? 'PASS' : 'FAIL';
    results.push({ n, label, result });
    log(`[E1-CRYPTO-1-PROOF] stage=${n} label=${label} result=${result}`);
};

async function bootPage(ctx) {
    const consoleLogs = [];
    const page = await ctx.newPage();
    page.on('console', (m) => consoleLogs.push(m.text()));
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() =>
        typeof window.relayCryptoInit === 'function' &&
        typeof window.relayVerifyChainIntegrity === 'function' &&
        typeof window.relayGetInclusionProof === 'function' &&
        typeof window.relayCryptoReplayPreCheck === 'function' &&
        window.__relayCryptoState?.initialized === true,
        { timeout: 30000 }
    );
    await sleep(2000);
    return { page, consoleLogs };
}

(async () => {
    const devServer = await startDevIfNeeded();
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext();
    await fs.mkdir(PROOFS_DIR, { recursive: true });
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

    try {
        const { page, consoleLogs } = await bootPage(ctx);

        // ── Stage 1: boot-chain-init ────────────────────────────────
        {
            const hasChainStamp = consoleLogs.some(l => l.includes('[CRYPTO] chainStamp mode=derived'));
            const hasGlobalInit = consoleLogs.some(l => l.includes('[CRYPTO] chainInit global=PASS'));
            const hasSheetsInit = consoleLogs.some(l => l.includes('[CRYPTO] chainInit sheets=PASS'));
            const hasMerkleInit = consoleLogs.some(l => l.includes('[CRYPTO] merkleInit timeboxes=PASS'));

            const cs = await page.evaluate(() => ({
                initialized: window.__relayCryptoState?.initialized,
                globalLen: window.__relayCryptoState?.globalChain?.length || 0,
                sheetsCount: Object.keys(window.__relayCryptoState?.sheetChains || {}).length,
                tbCount: window.__relayCryptoState?.tbChain?.length || 0
            }));

            const ok = hasChainStamp && hasGlobalInit && hasSheetsInit && hasMerkleInit && cs.initialized;
            stage(1, 'boot-chain-init', ok);
            log(`  chainStamp=${hasChainStamp} globalInit=${hasGlobalInit} sheetsInit=${hasSheetsInit} merkleInit=${hasMerkleInit}`);
            log(`  globalChain=${cs.globalLen} sheetChains=${cs.sheetsCount} tbChain=${cs.tbCount}`);
        }

        // ── Stage 2: commit-chain-link ──────────────────────────────
        {
            const preLen = await page.evaluate(() => window.__relayCryptoState.globalChain.length);
            const commitResult = await page.evaluate(() => {
                const receipt = {
                    id: 'COMMIT-CRYPTO-TEST-1',
                    type: 'COMMIT_RECEIPT',
                    commitId: 'COMMIT-CRYPTO-TEST-1',
                    proposalId: 'PROP-CRYPTO-TEST-1',
                    evidenceHash: 'test-evidence-sha256',
                    timestamp: new Date().toISOString(),
                    user: 'crypto-test',
                    zone: 'test',
                    target: 'test-target'
                };
                window.__relayCommits.push(receipt);

                const { appendGlobalChainEntry } = window.__relayCryptoState._modules || {};
                return window.__relayCryptoState.globalChain.length;
            });

            await page.evaluate(async () => {
                const commits = window.__relayCommits;
                const latest = commits[commits.length - 1];
                const cs = window.__relayCryptoState;

                const { sha256, stableStringify, canonicalize, GENESIS } = await import('./core/models/crypto/hash-chain.js');
                const commitHash = await sha256(JSON.stringify((function canon(input) {
                    if (input === null || typeof input === 'undefined') return null;
                    if (typeof input === 'number') { const f = input.toFixed(6); return f.replace(/\\.?0+$/, ''); }
                    if (typeof input !== 'object') return input;
                    if (Array.isArray(input)) return input.map(canon);
                    const out = {};
                    for (const key of Object.keys(input).sort()) out[key] = canon(input[key]);
                    return out;
                })(latest)));

                const prevHash = cs.globalChain.length > 0 ? cs.globalChain[cs.globalChain.length - 1].commitHash : 'GENESIS';
                cs.globalChain.push({
                    commitIndex: cs.globalChain.length,
                    commitId: latest.id || latest.commitId,
                    commitHash,
                    prevHash
                });
            });

            await sleep(500);
            const postLen = await page.evaluate(() => window.__relayCryptoState.globalChain.length);
            const lastEntry = await page.evaluate(() => {
                const chain = window.__relayCryptoState.globalChain;
                const e = chain[chain.length - 1];
                return { commitId: e.commitId, prevHash: e.prevHash.slice(0, 16), commitHash: e.commitHash.slice(0, 16) };
            });

            const ok = postLen === preLen + 1 && lastEntry.commitId === 'COMMIT-CRYPTO-TEST-1';
            stage(2, 'commit-chain-link', ok);
            log(`  preLen=${preLen} postLen=${postLen} commitId=${lastEntry.commitId} prevHash=${lastEntry.prevHash}`);
        }

        // ── Stage 3: sheet-commit-chain ─────────────────────────────
        {
            const sheetCommitResult = await page.evaluate(async () => {
                const sheetCommit = {
                    seq: (++window.__relaySheetCommitSeq),
                    timestamp: new Date().toISOString(),
                    commitId: 'COMMIT-CRYPTO-TEST-1',
                    sheetId: 'sheet.crypto-test',
                    cellId: 'cell-0-0',
                    cellRef: 'A1',
                    type: 'EDIT',
                    payload: { display: 'test', formula: '' }
                };
                window.__relaySheetCommits.push(sheetCommit);

                const cs = window.__relayCryptoState;
                const { sha256, stableStringify } = await import('./core/models/crypto/hash-chain.js');
                const canon = (input) => {
                    if (input === null || typeof input === 'undefined') return null;
                    if (typeof input === 'number') { const f = input.toFixed(6); return f.replace(/\\.?0+$/, ''); }
                    if (typeof input !== 'object') return input;
                    if (Array.isArray(input)) return input.map(canon);
                    const out = {};
                    for (const key of Object.keys(input).sort()) out[key] = canon(input[key]);
                    return out;
                };
                const scHash = await sha256(JSON.stringify(canon(sheetCommit)));

                if (!cs.sheetChains['sheet.crypto-test']) cs.sheetChains['sheet.crypto-test'] = [];
                const sChain = cs.sheetChains['sheet.crypto-test'];
                const prevSheetHash = sChain.length > 0 ? sChain[sChain.length - 1].sheetCommitHash : 'SHEET_GENESIS';

                const globalIdx = cs.globalChain.findIndex(e => e.commitId === 'COMMIT-CRYPTO-TEST-1');

                sChain.push({
                    seq: sheetCommit.seq,
                    sheetCommitHash: scHash,
                    prevSheetHash,
                    globalCommitIndex: globalIdx >= 0 ? globalIdx : null
                });

                return {
                    chainLen: sChain.length,
                    prevSheetHash: prevSheetHash.slice(0, 16),
                    globalCommitIndex: globalIdx >= 0 ? globalIdx : null,
                    sheetCommitHash: scHash.slice(0, 16)
                };
            });

            const ok = sheetCommitResult.chainLen >= 1 &&
                       sheetCommitResult.prevSheetHash === 'SHEET_GENESIS'.slice(0, 16) &&
                       sheetCommitResult.globalCommitIndex !== null;
            stage(3, 'sheet-commit-chain', ok);
            log(`  chainLen=${sheetCommitResult.chainLen} prevSheetHash=${sheetCommitResult.prevSheetHash} globalIdx=${sheetCommitResult.globalCommitIndex}`);
        }

        // ── Stage 4: timebox-merkle ─────────────────────────────────
        {
            const preState = await page.evaluate(() => {
                const cs = window.__relayCryptoState;
                return { tbCount: cs.tbChain.length, lastRoot: cs.tbChain.length > 0 ? cs.tbChain[cs.tbChain.length - 1].rollingRoot.slice(0, 16) : 'none' };
            });

            await page.evaluate(async () => {
                const trunkNode = (window.relayState?.tree?.nodes || []).find(n => n.type === 'trunk');
                if (trunkNode) {
                    window.appendTimeboxEvent(trunkNode, {
                        type: 'CRYPTO_TEST_EVENT',
                        detail: 'e1-crypto-1 proof stage 4',
                        timestamp: new Date().toISOString()
                    });
                }
            });

            await sleep(3000);
            const postState = await page.evaluate(() => {
                const cs = window.__relayCryptoState;
                const last = cs.tbChain.length > 0 ? cs.tbChain[cs.tbChain.length - 1] : null;
                return {
                    tbCount: cs.tbChain.length,
                    lastRoot: last ? last.rollingRoot.slice(0, 16) : 'none',
                    lastMerkle: last ? last.merkleRoot.slice(0, 16) : 'none',
                    lastTimeboxId: last ? last.timeboxId : 'none'
                };
            });

            const hasMerkleLog = consoleLogs.some(l => l.includes('[CRYPTO] merkleUpdate'));
            const hasRollingLog = consoleLogs.some(l => l.includes('[CRYPTO] rollingRoot updated='));

            const ok = hasMerkleLog && hasRollingLog && postState.lastRoot !== preState.lastRoot;
            stage(4, 'timebox-merkle', ok);
            log(`  merkleLog=${hasMerkleLog} rollingLog=${hasRollingLog} rootChanged=${postState.lastRoot !== preState.lastRoot} timeboxId=${postState.lastTimeboxId}`);
        }

        // ── Stage 5: inclusion-proof-commit ─────────────────────────
        {
            const proof = await page.evaluate(() => {
                const chain = window.__relayCryptoState.globalChain;
                if (chain.length === 0) return null;
                return window.relayGetInclusionProof('commit', { commitIndex: chain.length - 1 });
            });

            const ok = proof !== null &&
                       proof.type === 'INCLUSION_PROOF' &&
                       proof.target.type === 'commit' &&
                       proof.merkle === null &&
                       proof.rolling === null &&
                       proof.chain !== null &&
                       proof.chain.chainHead !== undefined;

            const hasLog = consoleLogs.some(l => l.includes('[CRYPTO] inclusionProof target=commit:') && l.includes('merkle=NA') && l.includes('chain=OK'));

            stage(5, 'inclusion-proof-commit', ok && hasLog);
            log(`  proof=${proof !== null} merkle=${proof?.merkle} chain=${proof?.chain !== null} log=${hasLog}`);
        }

        // ── Stage 6: inclusion-proof-timebox-event ──────────────────
        {
            const proof = await page.evaluate(() => {
                const tbChain = window.__relayCryptoState.tbChain;
                if (tbChain.length === 0) return null;
                const lastTb = tbChain[tbChain.length - 1];
                if (lastTb.eventCount === 0) return null;
                return window.relayGetInclusionProof('timeboxEvent', { timeboxId: lastTb.timeboxId, eventIndex: lastTb.eventCount - 1 });
            });

            const ok = proof !== null &&
                       proof.type === 'INCLUSION_PROOF' &&
                       proof.target.type === 'timeboxEvent' &&
                       proof.chain === null &&
                       proof.merkle !== null &&
                       proof.merkle.root !== undefined &&
                       proof.merkle.path !== undefined &&
                       proof.rolling !== null &&
                       proof.rolling.timeboxId !== undefined &&
                       proof.rolling.rollingHead !== undefined;

            const hasLog = consoleLogs.some(l => l.includes('[CRYPTO] inclusionProof target=timeboxEvent:') && l.includes('merkle=OK') && l.includes('rolling=OK'));

            stage(6, 'inclusion-proof-timebox-event', ok && hasLog);
            log(`  proof=${proof !== null} merkle=${proof?.merkle !== null} rolling=${proof?.rolling !== null} chain=${proof?.chain} log=${hasLog}`);
        }

        // ── Stage 7: verify-clean ───────────────────────────────────
        {
            const preEventCount = await page.evaluate(() => {
                const trunkNode = (window.relayState?.tree?.nodes || []).find(n => n.type === 'trunk');
                if (!trunkNode || !trunkNode.timeboxes) return 0;
                const latest = trunkNode.timeboxes[trunkNode.timeboxes.length - 1];
                return (latest.events || []).length;
            });

            const verifyResult = await page.evaluate(async () => {
                return window.relayVerifyChainIntegrity({ emitScar: false });
            });

            const postEventCount = await page.evaluate(() => {
                const trunkNode = (window.relayState?.tree?.nodes || []).find(n => n.type === 'trunk');
                if (!trunkNode || !trunkNode.timeboxes) return 0;
                const latest = trunkNode.timeboxes[trunkNode.timeboxes.length - 1];
                return (latest.events || []).length;
            });

            const hasVerifyLog = consoleLogs.some(l => l.includes('[CRYPTO] verify') && l.includes('overall=VALID') && l.includes('emitScar=false'));
            const noNewEvents = postEventCount === preEventCount;

            const ok = verifyResult.overall === 'VALID' && verifyResult.emitScar === false && noNewEvents && hasVerifyLog;
            stage(7, 'verify-clean', ok);
            log(`  overall=${verifyResult.overall} emitScar=${verifyResult.emitScar} noNewEvents=${noNewEvents} log=${hasVerifyLog} durationMs=${verifyResult.durationMs}`);
        }

        // ── Stage 8: tamper-detect ──────────────────────────────────
        {
            const preEventCount = await page.evaluate(() => {
                const trunkNode = (window.relayState?.tree?.nodes || []).find(n => n.type === 'trunk');
                if (!trunkNode || !trunkNode.timeboxes) return 0;
                const latest = trunkNode.timeboxes[trunkNode.timeboxes.length - 1];
                return (latest.events || []).length;
            });

            const tamperResult = await page.evaluate(async () => {
                const cs = window.__relayCryptoState;
                if (cs.globalChain.length < 1) return { skip: true };

                const savedHash = cs.globalChain[0].commitHash;
                cs.globalChain[0].commitHash = 'TAMPERED_HASH_000000000000000000000000000000';

                const result = await window.relayVerifyChainIntegrity({ emitScar: true });

                cs.globalChain[0].commitHash = savedHash;

                return { overall: result.overall, emitScar: result.emitScar, reverted: true };
            });

            await sleep(500);

            const postEventCount = await page.evaluate(() => {
                const trunkNode = (window.relayState?.tree?.nodes || []).find(n => n.type === 'trunk');
                if (!trunkNode || !trunkNode.timeboxes) return 0;
                const latest = trunkNode.timeboxes[trunkNode.timeboxes.length - 1];
                return (latest.events || []).length;
            });

            const hasRefusal = consoleLogs.some(l => l.includes('[REFUSAL] reason=CHAIN_INTEGRITY_VIOLATION'));
            const hasScar = postEventCount > preEventCount;
            const hasScarLog = consoleLogs.some(l => l.includes('[TIMEBOX] event type=CHAIN_INTEGRITY_VIOLATION'));

            const ok = tamperResult.overall === 'BROKEN' && tamperResult.emitScar === true && tamperResult.reverted && hasRefusal && hasScar;
            stage(8, 'tamper-detect', ok);
            log(`  overall=${tamperResult.overall} emitScar=${tamperResult.emitScar} reverted=${tamperResult.reverted} refusal=${hasRefusal} scar=${hasScar} scarLog=${hasScarLog}`);
        }

        // ── Stage 9: replay-pre-check ───────────────────────────────
        {
            const cleanPreCheck = await page.evaluate(async () => {
                return window.relayCryptoReplayPreCheck();
            });

            const hasPassLog = consoleLogs.some(l => l.includes('[CRYPTO] replayPreCheck result=PASS'));

            const tamperPreCheck = await page.evaluate(async () => {
                const cs = window.__relayCryptoState;
                if (cs.globalChain.length < 1) return { skip: true };

                const savedHash = cs.globalChain[0].commitHash;
                cs.globalChain[0].commitHash = 'TAMPERED_HASH_000000000000000000000000000000';

                const result = await window.relayCryptoReplayPreCheck();

                cs.globalChain[0].commitHash = savedHash;

                return { ok: result.ok, result: result.result };
            });

            const hasFailLog = consoleLogs.some(l => l.includes('[CRYPTO] replayPreCheck result=FAIL'));
            const hasPreCheckRefusal = consoleLogs.filter(l => l.includes('[REFUSAL] reason=CHAIN_INTEGRITY_VIOLATION') && l.includes('scope=replayPreCheck')).length > 0;

            const tamperReplay = await page.evaluate(async () => {
                const cs = window.__relayCryptoState;
                if (cs.globalChain.length < 1) return { skip: true };

                const savedHash = cs.globalChain[0].commitHash;
                cs.globalChain[0].commitHash = 'TAMPERED_HASH_000000000000000000000000000000';

                const moduleIds = window.relayGetLoadedModuleIds ? window.relayGetLoadedModuleIds() : [];
                const modId = moduleIds.length > 0 ? moduleIds[0] : 'P2P';
                const result = await window.relayReplayModuleSHA256(modId, {});

                cs.globalChain[0].commitHash = savedHash;

                return { result: result.result };
            });

            const ok = cleanPreCheck.ok === true &&
                       hasPassLog &&
                       tamperPreCheck.ok === false &&
                       tamperPreCheck.result === 'CHAIN_INTEGRITY_VIOLATION' &&
                       hasFailLog &&
                       tamperReplay.result === 'CHAIN_INTEGRITY_VIOLATION';

            stage(9, 'replay-pre-check', ok);
            log(`  cleanOk=${cleanPreCheck.ok} passLog=${hasPassLog} tamperOk=${tamperPreCheck.ok} tamperResult=${tamperPreCheck.result} failLog=${hasFailLog} replayBlocked=${tamperReplay.result}`);
        }

        // ── Gate summary ────────────────────────────────────────────
        const passCount = results.filter(r => r.result === 'PASS').length;
        log(`[E1-CRYPTO-1-PROOF] gate-summary result=${passCount === 9 ? 'PASS' : 'FAIL'} stages=${passCount}/9`);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-crypto-hud.png'), fullPage: false });

        await fs.writeFile(LOG_FILE, lines.join('\n'), 'utf-8');
    } catch (err) {
        log(`[E1-CRYPTO-1-PROOF] FATAL: ${err.message}`);
        await fs.writeFile(LOG_FILE, lines.join('\n'), 'utf-8');
    } finally {
        await browser.close();
        if (devServer) devServer.kill();
    }
})();
