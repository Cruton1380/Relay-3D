/**
 * E1-CRYPTO-1: Merkle Tree Module
 *
 * Per-timebox Merkle tree over events + rolling Merkle root across timeboxes.
 *
 * Locked decisions:
 *   D2: (b) Per-timebox Merkle + rolling Merkle across timeboxes
 *   D4: (b) Merkle path + chain anchor (rolling section for timebox events)
 *
 * Tightenings:
 *   #3: Rolling root anchor uses timeboxId, not commitIndex
 */

import { sha256, stableStringify } from './hash-chain.js';

const TIMEBOX_GENESIS = 'TIMEBOX_GENESIS';

/**
 * Build a Merkle tree from an array of leaf hashes.
 * Returns { root, layers } where layers[0] = leaves, layers[n] = [root].
 */
export async function buildMerkleTree(leafHashes) {
    if (!leafHashes || leafHashes.length === 0) {
        return { root: await sha256('EMPTY_TREE'), layers: [[await sha256('EMPTY_TREE')]] };
    }
    if (leafHashes.length === 1) {
        return { root: leafHashes[0], layers: [leafHashes] };
    }

    const layers = [leafHashes.slice()];
    let current = leafHashes.slice();

    while (current.length > 1) {
        const next = [];
        for (let i = 0; i < current.length; i += 2) {
            if (i + 1 < current.length) {
                next.push(await sha256(current[i] + current[i + 1]));
            } else {
                next.push(await sha256(current[i] + current[i]));
            }
        }
        layers.push(next);
        current = next;
    }

    return { root: current[0], layers };
}

/**
 * Build a Merkle inclusion proof for a leaf at the given index.
 * Returns { root, leafIndex, path: [{hash, position}] }
 */
export function buildMerkleProof(layers, leafIndex) {
    if (!layers || layers.length === 0 || leafIndex < 0 || leafIndex >= layers[0].length) {
        return null;
    }

    const path = [];
    let idx = leafIndex;

    for (let level = 0; level < layers.length - 1; level++) {
        const layer = layers[level];
        const isRight = idx % 2 === 1;
        const siblingIdx = isRight ? idx - 1 : idx + 1;

        if (siblingIdx < layer.length) {
            path.push({
                hash: layer[siblingIdx],
                position: isRight ? 'left' : 'right'
            });
        } else {
            path.push({
                hash: layer[idx],
                position: isRight ? 'left' : 'right'
            });
        }
        idx = Math.floor(idx / 2);
    }

    const root = layers[layers.length - 1][0];
    return { root, leafIndex, path };
}

/**
 * Verify a Merkle inclusion proof.
 */
export async function verifyMerkleProof(leafHash, proof) {
    if (!proof || !proof.path) return false;
    let current = leafHash;
    for (const step of proof.path) {
        if (step.position === 'left') {
            current = await sha256(step.hash + current);
        } else {
            current = await sha256(current + step.hash);
        }
    }
    return current === proof.root;
}

/**
 * Compute leaf hashes for a timebox's events.
 */
export async function computeTimeboxLeafHashes(events) {
    const hashes = [];
    for (const event of events) {
        hashes.push(await sha256(stableStringify(event)));
    }
    return hashes;
}

/**
 * Build the timebox chain: per-timebox Merkle roots + rolling root.
 * Input: array of timebox objects with .timeboxId and .events[]
 * Returns: [{timeboxId, merkleRoot, rollingRoot, prevRolling, tree}]
 */
export async function buildTimeboxChain(timeboxes, logFn) {
    const chain = [];
    let prevRolling = TIMEBOX_GENESIS;

    for (const tb of timeboxes) {
        const events = tb.events || [];
        const leafHashes = await computeTimeboxLeafHashes(events);
        const tree = await buildMerkleTree(leafHashes);
        const merkleRoot = tree.root;
        const rollingRoot = await sha256(prevRolling + merkleRoot);

        chain.push({
            timeboxId: tb.timeboxId,
            merkleRoot,
            rollingRoot,
            prevRolling,
            tree,
            eventCount: events.length
        });
        prevRolling = rollingRoot;
    }

    if (logFn) {
        const head = chain.length > 0 ? chain[chain.length - 1].rollingRoot.slice(0, 16) : TIMEBOX_GENESIS;
        logFn(`[CRYPTO] merkleInit timeboxes=PASS count=${chain.length} rollingRoot=${head}`);
    }
    return chain;
}

/**
 * Append/update the chain entry for a timebox after a new event is added.
 */
export async function updateTimeboxChainEntry(tbChain, timeboxId, events) {
    const leafHashes = await computeTimeboxLeafHashes(events);
    const tree = await buildMerkleTree(leafHashes);
    const merkleRoot = tree.root;

    const existingIdx = tbChain.findIndex(e => e.timeboxId === timeboxId);
    let prevRolling;
    if (existingIdx >= 0) {
        prevRolling = existingIdx > 0 ? tbChain[existingIdx - 1].rollingRoot : TIMEBOX_GENESIS;
        const rollingRoot = await sha256(prevRolling + merkleRoot);
        tbChain[existingIdx] = { timeboxId, merkleRoot, rollingRoot, prevRolling, tree, eventCount: events.length };

        for (let i = existingIdx + 1; i < tbChain.length; i++) {
            const prev = tbChain[i - 1].rollingRoot;
            tbChain[i].prevRolling = prev;
            tbChain[i].rollingRoot = await sha256(prev + tbChain[i].merkleRoot);
        }
        return tbChain[existingIdx];
    } else {
        prevRolling = tbChain.length > 0 ? tbChain[tbChain.length - 1].rollingRoot : TIMEBOX_GENESIS;
        const rollingRoot = await sha256(prevRolling + merkleRoot);
        const entry = { timeboxId, merkleRoot, rollingRoot, prevRolling, tree, eventCount: events.length };
        tbChain.push(entry);
        return entry;
    }
}

/**
 * Verify the entire timebox chain (per-timebox Merkle + rolling roots).
 */
export async function verifyTimeboxChain(timeboxes, tbChain) {
    const breaks = [];
    let prevRolling = TIMEBOX_GENESIS;

    for (let i = 0; i < tbChain.length; i++) {
        const entry = tbChain[i];
        const tb = timeboxes[i];
        if (!tb) {
            breaks.push({ index: i, timeboxId: entry.timeboxId, type: 'missing_timebox' });
            continue;
        }

        const events = tb.events || [];
        const leafHashes = await computeTimeboxLeafHashes(events);
        const tree = await buildMerkleTree(leafHashes);

        if (tree.root !== entry.merkleRoot) {
            breaks.push({ index: i, timeboxId: entry.timeboxId, type: 'merkle_mismatch', expected: tree.root, actual: entry.merkleRoot });
        }

        if (entry.prevRolling !== prevRolling) {
            breaks.push({ index: i, timeboxId: entry.timeboxId, type: 'rolling_prev_mismatch', expected: prevRolling, actual: entry.prevRolling });
        }

        const expectedRolling = await sha256(prevRolling + entry.merkleRoot);
        if (expectedRolling !== entry.rollingRoot) {
            breaks.push({ index: i, timeboxId: entry.timeboxId, type: 'rolling_mismatch', expected: expectedRolling, actual: entry.rollingRoot });
        }

        prevRolling = entry.rollingRoot;
    }

    return { valid: breaks.length === 0, timeboxes: tbChain.length, breaks };
}

/**
 * Build an inclusion proof for a timebox event.
 * Returns proof with merkle path + rolling anchor.
 */
export function buildTimeboxEventInclusionProof(tbChain, timeboxId, eventIndex) {
    const tbEntry = tbChain.find(e => e.timeboxId === timeboxId);
    if (!tbEntry || !tbEntry.tree) return null;

    const merkleProof = buildMerkleProof(tbEntry.tree.layers, eventIndex);
    if (!merkleProof) return null;

    return {
        type: 'INCLUSION_PROOF',
        target: { type: 'timeboxEvent', id: `${timeboxId}:evt:${eventIndex}`, timeboxId },
        chain: null,
        merkle: {
            root: merkleProof.root,
            leafIndex: merkleProof.leafIndex,
            path: merkleProof.path
        },
        rolling: {
            timeboxId: tbEntry.timeboxId,
            rollingHead: tbEntry.rollingRoot,
            prevRolling: tbEntry.prevRolling,
            timeboxMerkleRoot: tbEntry.merkleRoot
        },
        verified: true,
        timestamp: new Date().toISOString()
    };
}

export { TIMEBOX_GENESIS };
