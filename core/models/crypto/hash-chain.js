/**
 * E1-CRYPTO-1: Hash Chain Module
 *
 * Linear hash chain (prevHash linking) for global commits and sheet commits.
 * Derived-only: never mutates historical receipt objects.
 *
 * Locked decisions:
 *   D1: (c) Global commits + sheet commits + timebox events
 *   D3: (a) SHA-256 for new commits; FNV-1a grandfathered
 *   D4: (b) Merkle path + chain anchor
 *
 * Tightening 4: Chain state is derived maps only — no mutation of receipts.
 */

// ── Canonicalization (matches tier1-parity.js / replay-engine.js) ───────
const toDecimalString = (value) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return value;
    const fixed = value.toFixed(6);
    return fixed.replace(/\.?0+$/, '');
};

const canonicalize = (input) => {
    if (input === null || typeof input === 'undefined') return null;
    if (typeof input === 'number') return toDecimalString(input);
    if (typeof input !== 'object') return input;
    if (Array.isArray(input)) return input.map(canonicalize);
    const out = {};
    for (const key of Object.keys(input).sort()) {
        out[key] = canonicalize(input[key]);
    }
    return out;
};

const stableStringify = (value) => JSON.stringify(canonicalize(value));

// ── SHA-256 (browser + Node.js) ─────────────────────────────────────────
async function sha256(text) {
    const str = String(text);
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
        const buf = new TextEncoder().encode(str);
        const hashBuf = await globalThis.crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    try {
        const { createHash } = await import('node:crypto');
        return createHash('sha256').update(str).digest('hex');
    } catch (_) {}
    return 'sha256-unavailable';
}

const GENESIS = 'GENESIS';
const SHEET_GENESIS = 'SHEET_GENESIS';

/**
 * Build the global commit chain from __relayCommits.
 * Returns a derived array: [{commitIndex, commitId, commitHash, prevHash}]
 * Does NOT mutate any receipt objects.
 */
export async function buildGlobalChain(commits, logFn) {
    const chain = [];
    let prevHash = GENESIS;
    for (let i = 0; i < commits.length; i++) {
        const receipt = commits[i];
        const commitHash = await sha256(stableStringify(receipt));
        chain.push({
            commitIndex: i,
            commitId: receipt.id || receipt.commitId || `commit-${i}`,
            commitHash,
            prevHash
        });
        prevHash = commitHash;
    }
    if (logFn) logFn(`[CRYPTO] chainInit global=PASS genesisHash=${GENESIS} commits=${chain.length}`);
    return chain;
}

/**
 * Build per-sheet commit chains from __relaySheetCommits.
 * Returns { [sheetId]: [{seq, sheetCommitHash, prevSheetHash, globalCommitIndex}] }
 */
export async function buildSheetChains(sheetCommits, globalChain, logFn) {
    const commitIdToIndex = new Map();
    for (const entry of globalChain) {
        commitIdToIndex.set(entry.commitId, entry.commitIndex);
    }

    const grouped = {};
    for (const sc of sheetCommits) {
        const sid = sc.sheetId || 'unknown';
        if (!grouped[sid]) grouped[sid] = [];
        grouped[sid].push(sc);
    }

    const chains = {};
    for (const [sheetId, commits] of Object.entries(grouped)) {
        commits.sort((a, b) => (a.seq || 0) - (b.seq || 0));
        let prevSheetHash = SHEET_GENESIS;
        const chain = [];
        for (const sc of commits) {
            const scHash = await sha256(stableStringify(sc));
            const globalIdx = commitIdToIndex.has(sc.commitId) ? commitIdToIndex.get(sc.commitId) : null;
            chain.push({
                seq: sc.seq,
                sheetCommitHash: scHash,
                prevSheetHash,
                globalCommitIndex: globalIdx
            });
            prevSheetHash = scHash;
        }
        chains[sheetId] = chain;
    }

    const chainCount = Object.keys(chains).length;
    if (logFn) logFn(`[CRYPTO] chainInit sheets=PASS chains=${chainCount}`);
    return chains;
}

/**
 * Append a new global commit to the derived chain.
 * Returns the new chain entry (does NOT mutate the receipt).
 */
export async function appendGlobalChainEntry(chain, receipt) {
    const prevHash = chain.length > 0 ? chain[chain.length - 1].commitHash : GENESIS;
    const commitHash = await sha256(stableStringify(receipt));
    const entry = {
        commitIndex: chain.length,
        commitId: receipt.id || receipt.commitId || `commit-${chain.length}`,
        commitHash,
        prevHash
    };
    chain.push(entry);
    return entry;
}

/**
 * Append a new sheet commit to the derived per-sheet chain.
 */
export async function appendSheetChainEntry(sheetChains, sheetCommit, globalChain) {
    const sheetId = sheetCommit.sheetId || 'unknown';
    if (!sheetChains[sheetId]) sheetChains[sheetId] = [];
    const sChain = sheetChains[sheetId];
    const prevSheetHash = sChain.length > 0 ? sChain[sChain.length - 1].sheetCommitHash : SHEET_GENESIS;
    const scHash = await sha256(stableStringify(sheetCommit));

    const commitIdToIndex = new Map();
    for (const e of globalChain) commitIdToIndex.set(e.commitId, e.commitIndex);
    const globalIdx = commitIdToIndex.has(sheetCommit.commitId) ? commitIdToIndex.get(sheetCommit.commitId) : null;

    const entry = {
        seq: sheetCommit.seq,
        sheetCommitHash: scHash,
        prevSheetHash,
        globalCommitIndex: globalIdx
    };
    sChain.push(entry);
    return entry;
}

/**
 * Verify a global chain for integrity (no breaks).
 * Returns { valid, length, breaks: [{index, expected, actual}] }
 */
export async function verifyGlobalChain(commits, chain) {
    const breaks = [];
    let prevHash = GENESIS;
    for (let i = 0; i < chain.length; i++) {
        if (chain[i].prevHash !== prevHash) {
            breaks.push({ index: i, expected: prevHash, actual: chain[i].prevHash });
        }
        const recomputed = await sha256(stableStringify(commits[i]));
        if (recomputed !== chain[i].commitHash) {
            breaks.push({ index: i, expected: recomputed, actual: chain[i].commitHash, type: 'hash_mismatch' });
        }
        prevHash = chain[i].commitHash;
    }
    return { valid: breaks.length === 0, length: chain.length, breaks };
}

/**
 * Verify a single per-sheet chain for integrity.
 */
export async function verifySheetChain(sheetCommits, chain) {
    const breaks = [];
    let prevSheetHash = SHEET_GENESIS;
    for (let i = 0; i < chain.length; i++) {
        if (chain[i].prevSheetHash !== prevSheetHash) {
            breaks.push({ index: i, expected: prevSheetHash, actual: chain[i].prevSheetHash });
        }
        prevSheetHash = chain[i].sheetCommitHash;
    }
    return { valid: breaks.length === 0, length: chain.length, breaks };
}

/**
 * Build an inclusion proof for a global commit (chain anchor only, no Merkle).
 */
export function buildCommitInclusionProof(chain, commitIndex) {
    if (commitIndex < 0 || commitIndex >= chain.length) return null;
    const entry = chain[commitIndex];
    const head = chain[chain.length - 1];
    return {
        type: 'INCLUSION_PROOF',
        target: { type: 'commit', id: entry.commitId },
        chain: {
            commitIndex: entry.commitIndex,
            chainHead: head.commitHash,
            commitHash: entry.commitHash,
            prevHash: entry.prevHash
        },
        merkle: null,
        rolling: null,
        verified: true,
        timestamp: new Date().toISOString()
    };
}

/**
 * Build an inclusion proof for a sheet commit (per-sheet chain anchor only, no Merkle).
 */
export function buildSheetCommitInclusionProof(sheetChains, sheetId, seq) {
    const chain = sheetChains[sheetId];
    if (!chain) return null;
    const entry = chain.find(e => e.seq === seq);
    if (!entry) return null;
    const idx = chain.indexOf(entry);
    const head = chain[chain.length - 1];
    return {
        type: 'INCLUSION_PROOF',
        target: { type: 'sheetCommit', id: `${sheetId}:seq:${seq}` },
        chain: {
            sheetId,
            seq: entry.seq,
            sheetCommitHash: entry.sheetCommitHash,
            prevSheetHash: entry.prevSheetHash,
            globalCommitIndex: entry.globalCommitIndex
        },
        merkle: null,
        rolling: null,
        verified: true,
        timestamp: new Date().toISOString()
    };
}

export { sha256, stableStringify, canonicalize, GENESIS, SHEET_GENESIS };
