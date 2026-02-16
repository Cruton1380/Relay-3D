/**
 * E1-CRYPTO-1: Integrity Verifier
 *
 * Orchestrates chain verification, tamper detection, and replay pre-check.
 *
 * Tightenings:
 *   #1: Verify is read-only by default (emitScar opt-in only)
 *   #5: Replay pre-check refuses cleanly (zero side effects on failure)
 */

import { verifyGlobalChain, verifySheetChain, buildCommitInclusionProof, buildSheetCommitInclusionProof } from './hash-chain.js';
import { verifyTimeboxChain, buildTimeboxEventInclusionProof } from './merkle-tree.js';

/**
 * Full chain integrity verification.
 *
 * @param {Object} state - { globalCommits, globalChain, sheetCommits (grouped by sheetId), sheetChains, timeboxes, tbChain }
 * @param {Object} opts - { emitScar: boolean (default false), scope: 'full'|'global'|'sheets'|'merkle' }
 * @param {Function} logFn
 * @param {Function} [scarEmitter] - Called with scar event if emitScar=true and overall=BROKEN
 * @returns {Object} verification result
 */
export async function verifyChainIntegrity(state, opts = {}, logFn, scarEmitter) {
    const t0 = Date.now();
    const emitScar = opts.emitScar === true;
    const scope = opts.scope || 'full';

    let globalResult = { valid: true, length: 0, breaks: [] };
    let sheetResults = {};
    let merkleResult = { valid: true, timeboxes: 0, breaks: [] };
    let rollingResult = { valid: true, current: '' };

    if (scope === 'full' || scope === 'global') {
        globalResult = await verifyGlobalChain(state.globalCommits, state.globalChain);
    }

    if (scope === 'full' || scope === 'sheets') {
        for (const [sheetId, chain] of Object.entries(state.sheetChains)) {
            const commits = (state.sheetCommits[sheetId] || [])
                .slice().sort((a, b) => (a.seq || 0) - (b.seq || 0));
            sheetResults[sheetId] = await verifySheetChain(commits, chain);
        }
    }

    if (scope === 'full' || scope === 'merkle') {
        merkleResult = await verifyTimeboxChain(state.timeboxes, state.tbChain);
        if (state.tbChain.length > 0) {
            rollingResult.current = state.tbChain[state.tbChain.length - 1].rollingRoot;
        }
        rollingResult.valid = merkleResult.valid;
    }

    const sheetsValid = Object.values(sheetResults).every(r => r.valid);
    const overall = (globalResult.valid && sheetsValid && merkleResult.valid) ? 'VALID' : 'BROKEN';

    const durationMs = Date.now() - t0;

    if (logFn) {
        logFn(`[CRYPTO] verify scope=${scope} global=${globalResult.valid ? 'VALID' : 'BROKEN'} sheets=${sheetsValid ? 'VALID' : 'BROKEN'} merkle=${merkleResult.valid ? 'VALID' : 'BROKEN'} rolling=${rollingResult.valid ? 'VALID' : 'BROKEN'} overall=${overall} emitScar=${emitScar} durationMs=${durationMs}`);
    }

    if (overall === 'BROKEN') {
        const firstBreak = findFirstBreak(globalResult, sheetResults, merkleResult);
        if (logFn && firstBreak) {
            logFn(`[REFUSAL] reason=CHAIN_INTEGRITY_VIOLATION component=${firstBreak.component} breakIndex=${firstBreak.index}`);
        }

        if (emitScar && scarEmitter && firstBreak) {
            scarEmitter({
                type: 'CHAIN_INTEGRITY_VIOLATION',
                component: firstBreak.component,
                breakIndex: firstBreak.index,
                detail: firstBreak.detail || '',
                timestamp: new Date().toISOString()
            });
        }
    }

    return {
        globalChain: globalResult,
        sheetChains: sheetResults,
        timeboxMerkle: merkleResult,
        rollingRoot: rollingResult,
        overall,
        emitScar,
        durationMs
    };
}

function findFirstBreak(globalResult, sheetResults, merkleResult) {
    if (!globalResult.valid && globalResult.breaks.length > 0) {
        const b = globalResult.breaks[0];
        return { component: 'global', index: b.index, detail: b.type || 'prevHash_mismatch' };
    }
    for (const [sheetId, result] of Object.entries(sheetResults)) {
        if (!result.valid && result.breaks.length > 0) {
            const b = result.breaks[0];
            return { component: `sheet.${sheetId}`, index: b.index, detail: b.type || 'prevSheetHash_mismatch' };
        }
    }
    if (!merkleResult.valid && merkleResult.breaks.length > 0) {
        const b = merkleResult.breaks[0];
        return { component: `timebox.${b.timeboxId || b.index}`, index: b.index, detail: b.type || 'merkle_mismatch' };
    }
    return null;
}

/**
 * Get an inclusion proof for any artifact.
 *
 * @param {Object} state - crypto state
 * @param {string} targetType - 'commit' | 'sheetCommit' | 'timeboxEvent'
 * @param {Object} targetId - { commitIndex?, sheetId?, seq?, timeboxId?, eventIndex? }
 * @param {Function} logFn
 */
export function getInclusionProof(state, targetType, targetId, logFn) {
    let proof = null;

    if (targetType === 'commit') {
        proof = buildCommitInclusionProof(state.globalChain, targetId.commitIndex);
        if (proof && logFn) {
            logFn(`[CRYPTO] inclusionProof target=commit:${proof.target.id} verified=true merkle=NA chain=OK head=${proof.chain.chainHead.slice(0, 16)}`);
        }
    } else if (targetType === 'sheetCommit') {
        proof = buildSheetCommitInclusionProof(state.sheetChains, targetId.sheetId, targetId.seq);
        if (proof && logFn) {
            logFn(`[CRYPTO] inclusionProof target=sheetCommit:${targetId.sheetId}:seq:${targetId.seq} verified=true merkle=NA chain=OK`);
        }
    } else if (targetType === 'timeboxEvent') {
        proof = buildTimeboxEventInclusionProof(state.tbChain, targetId.timeboxId, targetId.eventIndex);
        if (proof && logFn) {
            logFn(`[CRYPTO] inclusionProof target=timeboxEvent:${targetId.timeboxId}:evt:${targetId.eventIndex} verified=true merkle=OK rolling=OK root=${proof.merkle.root.slice(0, 16)}`);
        }
    }

    if (!proof && logFn) {
        logFn(`[CRYPTO] inclusionProof target=${targetType}:${JSON.stringify(targetId)} verified=false reason=NOT_FOUND`);
    }

    return proof;
}

/**
 * Replay pre-check: verify chain integrity before replay.
 * Tightening 5: If BROKEN, refuse immediately with zero side effects.
 *
 * @returns {{ ok: boolean, result: string, durationMs: number }}
 */
export async function replayPreCheck(state, logFn) {
    const verifyResult = await verifyChainIntegrity(state, { emitScar: false, scope: 'full' }, logFn);

    if (verifyResult.overall === 'BROKEN') {
        const firstBreak = findFirstBreak(verifyResult.globalChain, verifyResult.sheetChains, verifyResult.timeboxMerkle);
        if (logFn) {
            logFn(`[CRYPTO] replayPreCheck result=FAIL component=${firstBreak?.component || 'unknown'} durationMs=${verifyResult.durationMs}`);
            logFn(`[REFUSAL] reason=CHAIN_INTEGRITY_VIOLATION scope=replayPreCheck`);
        }
        return { ok: false, result: 'CHAIN_INTEGRITY_VIOLATION', durationMs: verifyResult.durationMs };
    }

    if (logFn) {
        logFn(`[CRYPTO] replayPreCheck result=PASS durationMs=${verifyResult.durationMs}`);
    }
    return { ok: true, result: 'PASS', durationMs: verifyResult.durationMs };
}
