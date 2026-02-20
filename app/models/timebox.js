/**
 * Timebox Slab Model — SLAB-REVISION-1
 *
 * Cross-sectional rings segment a branch into time periods.
 * Each ring = one timebox = one vertebra.
 *
 * Slab properties are COMPUTED from the filaments within:
 *   thickness → commit density (more commits = thicker ring)
 *   color     → aggregate magnitude (warm=positive, cool=negative)
 *   opacity   → confidence (evidence_present / evidence_required)
 *   firmness  → wilt factor (0.0=firm, 1.0=maximally wilted)
 *
 * Wilt inputs (computed, never heuristic):
 *   - Unresolved obligations within the timebox
 *   - Confidence decay (missing evidence)
 *   - Time since last verification event
 *
 * Master Plan refs: §3.6, §3.7, §14
 */

import { filamentRenderParams, LIFECYCLE_STATES, computeTwigness } from './filament.js';

let _nextTimeboxId = 1;

/**
 * Generate timebox slabs for a branch by bucketing filaments into time slices.
 *
 * @param {Object[]} filaments — filaments on this branch
 * @param {Object}   branchConfig — { branchLength, branchRadius, sinkingMode, slabCount }
 * @returns {Object[]} array of slab descriptors
 */
export function generateTimeboxSlabs(filaments, branchConfig = {}) {
    const {
        branchLength = 800,
        branchRadius = 30,
        slabCount    = 8,
        branchId     = 'branch.unknown',
    } = branchConfig;

    const slabWidth = branchLength / slabCount;
    const slabs = [];

    for (let i = 0; i < slabCount; i++) {
        const lStart = i * slabWidth;
        const lEnd   = (i + 1) * slabWidth;
        const lMid   = (lStart + lEnd) / 2;

        const contained = filaments.filter(f => {
            const params = filamentRenderParams(f, branchConfig);
            return params.l >= lStart && params.l < lEnd;
        });

        const commitCount = contained.reduce(
            (sum, f) => sum + f.commitHistory.length + 1, 0
        );
        const thickness = Math.max(0.3, Math.min(1.0, commitCount / 10));

        let totalMag = 0;
        let magCount = 0;
        for (const f of contained) {
            if (f.magnitude != null) {
                totalMag += parseFloat(f.magnitude);
                magCount++;
            }
        }
        const avgMag = magCount > 0 ? totalMag / magCount : 0;
        const warmth = Math.min(1.0, Math.max(0.0, avgMag / 100000));

        let totalEvidence = 0;
        let totalRequired = 0;
        for (const f of contained) {
            totalEvidence += f.evidencePresent;
            totalRequired += f.evidenceRequired;
        }
        const confidence = totalRequired > 0
            ? Math.min(1.0, totalEvidence / totalRequired)
            : 1.0;

        const openCount = contained.filter(
            f => f.lifecycleState === LIFECYCLE_STATES.OPEN ||
                 f.lifecycleState === LIFECYCLE_STATES.HOLD
        ).length;
        const wilt = contained.length > 0
            ? Math.min(1.0, openCount / contained.length)
            : 0.0;
        const firmness = 1.0 - wilt;

        const id = `timebox.${branchId}.${_nextTimeboxId++}`;

        slabs.push({
            timeboxId: id,
            index: i,
            lStart,
            lEnd,
            lMid,
            thickness,
            warmth,
            confidence,
            firmness,
            wilt,
            filamentCount: contained.length,
            commitCount,
        });
    }

    return slabs;
}

/**
 * Detect droop zones — consecutive wilted slabs that cause emergent
 * branch deformation (§3.7). A droop zone is a run of 2+ adjacent
 * slabs where wilt > 0.3.
 *
 * Returns array of { startL, endL, maxWilt, slabCount } descriptors.
 */
export function detectDroopZones(slabs) {
    const WILT_THRESHOLD = 0.3;
    const zones = [];
    let run = [];

    for (const slab of slabs) {
        if (slab.wilt > WILT_THRESHOLD) {
            run.push(slab);
        } else {
            if (run.length >= 2) {
                zones.push({
                    startL: run[0].lStart,
                    endL: run[run.length - 1].lEnd,
                    maxWilt: Math.max(...run.map(s => s.wilt)),
                    slabCount: run.length,
                });
            }
            run = [];
        }
    }
    if (run.length >= 2) {
        zones.push({
            startL: run[0].lStart,
            endL: run[run.length - 1].lEnd,
            maxWilt: Math.max(...run.map(s => s.wilt)),
            slabCount: run.length,
        });
    }

    return zones;
}

/**
 * Compute per-slab twig count for branch health summary.
 */
export function computeSlabTwigCounts(slabs, filaments, branchConfig) {
    return slabs.map(slab => {
        const contained = filaments.filter(f => {
            const params = filamentRenderParams(f, branchConfig);
            return params.l >= slab.lStart && params.l < slab.lEnd;
        });
        const twigs = contained.filter(f => computeTwigness(f, branchConfig) > 0.1);
        return { ...slab, twigCount: twigs.length };
    });
}
