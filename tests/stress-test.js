/**
 * Relay Stress Test — 10× Scale Physics Validation
 *
 * Generates a tree with configurable branch/filament counts,
 * runs a 30-day replay simulation, and measures:
 *   - Frame rate at BRANCH LOD
 *   - Memory growth (JS heap)
 *   - Primitive / entity counts
 *   - Timebox aggregation cost
 *   - Lean vector computation cost (simulated)
 *   - Cross-section rendering cost (slab rebuild)
 *
 * Usage (from browser console):
 *   relayStressTest()                           // default: 50 branches, 100 filaments/branch
 *   relayStressTest({ branches: 100, filaments: 500 })  // custom scale
 *   relayStressTest({ branches: 10, filaments: 50, days: 7 }) // lighter test
 */

import { createFilament, advanceLifecycle, advanceSimTimeDays, getSimTime, LIFECYCLE_STATES } from '../app/models/filament.js';
import { createTree } from '../app/tree.js';
import { getFilamentInstanceCount } from '../app/renderers/filament-renderer.js';
import { getSlabInstanceCount } from '../app/renderers/slab-renderer.js';
import { getInstanceCount as getCylinderInstanceCount } from '../app/renderers/cylinder-renderer.js';

const LIFECYCLE_PROGRESSION = ['OPEN', 'ACTIVE', 'HOLD', 'CLOSED', 'ABSORBED'];

function generateStressBranches(count) {
    const branches = [];
    const palette = [
        '#2a6090', '#4a8060', '#906030', '#605090', '#904050',
        '#308070', '#705040', '#405090', '#806040', '#504080',
    ];
    for (let i = 0; i < count; i++) {
        branches.push({
            label: `Dept${String(i).padStart(3, '0')}`,
            angle: (360 / count) * i,
            height: 0.3 + 0.5 * Math.random(),
            color: palette[i % palette.length],
            _filamentCount: 0,
        });
    }
    return branches;
}

function injectStressFilaments(tree, branchDef, filamentCount) {
    const filaments = [];
    for (let i = 0; i < filamentCount; i++) {
        const daysAgo = Math.floor(Math.random() * 90) + 1;
        const spawnDate = new Date(Date.now() - daysAgo * 86400000);
        const stateIdx = Math.floor(Math.random() * LIFECYCLE_PROGRESSION.length);
        const targetState = LIFECYCLE_PROGRESSION[stateIdx];
        const evidenceCount = Math.floor(Math.random() * 4);
        const evidenceRefs = [];
        for (let e = 0; e < evidenceCount; e++) {
            evidenceRefs.push(`evidence.stress.${branchDef.label}.${i}.${e}`);
        }

        let f = createFilament({
            objectType: branchDef.label.toLowerCase(),
            objectId: String(i).padStart(5, '0'),
            branchId: `branch.${tree.name.replace(/\s/g, '')}.${branchDef.label}`,
            counterpartyRef: `vendor-${(i % 200).toString().padStart(3, '0')}`,
            approachAngle: Math.random() * Math.PI * 2,
            magnitude: String(Math.floor(Math.random() * 500000)),
            unit: 'USD',
            evidenceRequired: 3,
            evidenceRefs,
            spawnedAt: spawnDate.toISOString(),
        });

        if (targetState !== 'OPEN') f = advanceLifecycle(f, 'ACTIVE', {});
        if (targetState === 'HOLD') f = advanceLifecycle(f, 'HOLD', {});
        if (targetState === 'CLOSED' || targetState === 'ABSORBED') f = advanceLifecycle(f, 'CLOSED', {});
        if (targetState === 'ABSORBED') f = advanceLifecycle(f, 'ABSORBED', {});

        filaments.push(f);
    }
    return filaments;
}

function measureMemory() {
    if (performance.memory) {
        return {
            usedMB: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            totalMB: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        };
    }
    return { usedMB: -1, totalMB: -1 };
}

function measureFrameTime(viewer) {
    return new Promise(resolve => {
        const times = [];
        let count = 0;
        const listener = () => {
            times.push(performance.now());
            count++;
            if (count >= 11) {
                viewer.scene.postRender.removeEventListener(listener);
                const deltas = [];
                for (let i = 1; i < times.length; i++) {
                    deltas.push(times[i] - times[i - 1]);
                }
                const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
                const max = Math.max(...deltas);
                const min = Math.min(...deltas);
                resolve({ avgMs: +avg.toFixed(2), minMs: +min.toFixed(2), maxMs: +max.toFixed(2), fps: +(1000 / avg).toFixed(1) });
            }
        };
        viewer.scene.postRender.addEventListener(listener);
    });
}

export async function runStressTest(viewer, config = {}) {
    const {
        branches: branchCount = 50,
        filaments: filamentsPerBranch = 100,
        days = 30,
    } = config;

    const totalFilaments = branchCount * filamentsPerBranch;
    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(`║  RELAY STRESS TEST                               ║`);
    console.log(`║  ${branchCount} branches × ${filamentsPerBranch} filaments = ${totalFilaments} total    `);
    console.log(`║  ${days}-day replay simulation                          ║`);
    console.log(`╚══════════════════════════════════════════════════╝\n`);

    const memBefore = measureMemory();
    console.log(`[STRESS] Memory before: ${memBefore.usedMB} MB used / ${memBefore.totalMB} MB total`);

    // Phase 1: Generate branches
    const t0 = performance.now();
    const stressBranches = generateStressBranches(branchCount);
    console.log(`[STRESS] Generated ${branchCount} branch definitions in ${(performance.now() - t0).toFixed(1)}ms`);

    // Phase 2: Create tree (geometry only — limited filaments for Cesium primitives)
    const t1 = performance.now();
    const stressTree = createTree(viewer, {
        lon: 34.80, lat: 32.10,
        name: 'StressTest',
        branches: stressBranches,
    });
    const geometryMs = performance.now() - t1;
    console.log(`[STRESS] Tree geometry created in ${geometryMs.toFixed(1)}ms`);

    window._relay.trees.push(stressTree);

    // Phase 3: Inject stress filaments into model (NOT into renderer yet)
    const t2 = performance.now();
    const allStressFilaments = [];
    for (const b of stressBranches) {
        const fils = injectStressFilaments(stressTree, b, filamentsPerBranch);
        allStressFilaments.push(...fils);
    }
    stressTree._stressFilaments = allStressFilaments;
    const filamentGenMs = performance.now() - t2;
    console.log(`[STRESS] ${totalFilaments} filaments generated in ${filamentGenMs.toFixed(1)}ms`);

    const memAfterGen = measureMemory();
    console.log(`[STRESS] Memory after generation: ${memAfterGen.usedMB} MB (+${memAfterGen.usedMB - memBefore.usedMB} MB)`);

    // Phase 3b: Pre-index filaments by branchId — eliminates O(N×B) filter() calls
    const tIdx = performance.now();
    const filamentIndex = new Map();
    for (const f of allStressFilaments) {
        if (!filamentIndex.has(f.branchId)) filamentIndex.set(f.branchId, []);
        filamentIndex.get(f.branchId).push(f);
    }
    const indexMs = performance.now() - tIdx;
    console.log(`[STRESS] Branch index built: ${filamentIndex.size} buckets in ${indexMs.toFixed(1)}ms`);

    // Phase 4: Timebox aggregation cost
    const t3 = performance.now();
    const { generateTimeboxSlabs, detectDroopZones } = await import('../app/models/timebox.js');
    let totalSlabs = 0;
    let totalDroopZones = 0;
    for (const b of stressBranches) {
        const branchId = `branch.StressTest.${b.label}`;
        const branchFilaments = filamentIndex.get(branchId) || [];
        const slabs = generateTimeboxSlabs(branchFilaments, {
            branchLength: 800,
            branchRadius: 30,
            slabCount: 8,
            branchId,
        });
        totalSlabs += slabs.length;
        const droops = detectDroopZones(slabs);
        totalDroopZones += droops.length;
    }
    const timeboxMs = performance.now() - t3;
    console.log(`[STRESS] Timebox aggregation: ${totalSlabs} slabs, ${totalDroopZones} droop zones in ${timeboxMs.toFixed(1)}ms`);

    // Phase 5: Lean vector computation cost
    const t4 = performance.now();
    let leanComputations = 0;
    for (const b of stressBranches) {
        const branchId = `branch.StressTest.${b.label}`;
        const branchFilaments = filamentIndex.get(branchId) || [];
        let windVecX = 0, windVecY = 0, windWeightSum = 0;
        for (const f of branchFilaments) {
            const stateWeight = f.lifecycleState === 'OPEN' ? 1.0
                : f.lifecycleState === 'ACTIVE' ? 0.8
                : f.lifecycleState === 'HOLD' ? 0.6
                : f.lifecycleState === 'CLOSED' ? 0.2
                : 0.0;
            const mag = parseFloat(f.magnitude) || 0;
            const conf = f.orgConfidence || 0;
            const w = (mag / 500000) * (1 - conf) * stateWeight;
            windVecX += Math.cos(f.approachAngle) * w;
            windVecY += Math.sin(f.approachAngle) * w;
            windWeightSum += w;
            leanComputations++;
        }
        const leanDir = Math.atan2(windVecY, windVecX);
        const leanMag = Math.sqrt(windVecX * windVecX + windVecY * windVecY);
        b._leanDir = leanDir;
        b._leanMag = leanMag;
    }
    const leanMs = performance.now() - t4;
    console.log(`[STRESS] Lean vector: ${leanComputations} filament weights across ${branchCount} branches in ${leanMs.toFixed(1)}ms`);

    // Phase 6: 30-day replay simulation
    console.log(`\n[STRESS] ── ${days}-Day Replay ──`);
    const replayResults = [];

    for (let day = 1; day <= days; day++) {
        const dayT0 = performance.now();

        advanceSimTimeDays(1);
        if (stressTree.rebuild) stressTree.rebuild();

        const rebuildMs = performance.now() - dayT0;
        const frameMetrics = await measureFrameTime(viewer);
        const mem = measureMemory();

        const dayResult = {
            day,
            rebuildMs: +rebuildMs.toFixed(1),
            frameAvgMs: frameMetrics.avgMs,
            frameMaxMs: frameMetrics.maxMs,
            fps: frameMetrics.fps,
            memUsedMB: mem.usedMB,
        };
        replayResults.push(dayResult);

        if (day % 5 === 0 || day === 1 || day === days) {
            console.log(
                `[STRESS] Day ${String(day).padStart(2)}: ` +
                `rebuild=${rebuildMs.toFixed(0)}ms, ` +
                `frame=${frameMetrics.avgMs}ms (${frameMetrics.fps}fps), ` +
                `mem=${mem.usedMB}MB`
            );
        }
    }

    // Phase 7: Summary
    const memAfter = measureMemory();
    const filamentInstances = getFilamentInstanceCount();
    const slabInstances = getSlabInstanceCount();
    const cylInstances = getCylinderInstanceCount();

    const avgRebuild = replayResults.reduce((a, r) => a + r.rebuildMs, 0) / replayResults.length;
    const maxRebuild = Math.max(...replayResults.map(r => r.rebuildMs));
    const avgFrame = replayResults.reduce((a, r) => a + r.frameAvgMs, 0) / replayResults.length;
    const minFps = Math.min(...replayResults.map(r => r.fps));
    const memGrowth = memAfter.usedMB - memBefore.usedMB;

    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(`║  STRESS TEST RESULTS                             ║`);
    console.log(`╠══════════════════════════════════════════════════╣`);
    console.log(`║  Scale: ${branchCount} branches × ${filamentsPerBranch} filaments = ${totalFilaments}`);
    console.log(`║  Replay: ${days} days`);
    console.log(`╠══════════════════════════════════════════════════╣`);
    console.log(`║  GEOMETRY                                        ║`);
    console.log(`║    Tree creation:     ${geometryMs.toFixed(0)}ms`);
    console.log(`║    Filament gen:      ${filamentGenMs.toFixed(0)}ms`);
    console.log(`║    Cylinder instances: ${cylInstances}`);
    console.log(`║    Filament instances: ${filamentInstances}`);
    console.log(`║    Slab instances:     ${slabInstances}`);
    console.log(`╠══════════════════════════════════════════════════╣`);
    console.log(`║  PHYSICS                                         ║`);
    console.log(`║    Timebox aggregation: ${timeboxMs.toFixed(0)}ms (${totalSlabs} slabs)`);
    console.log(`║    Lean computation:    ${leanMs.toFixed(0)}ms (${leanComputations} weights)`);
    console.log(`║    Droop zones:         ${totalDroopZones}`);
    console.log(`╠══════════════════════════════════════════════════╣`);
    console.log(`║  REPLAY (${days} days)                                ║`);
    console.log(`║    Avg rebuild/day:   ${avgRebuild.toFixed(1)}ms`);
    console.log(`║    Max rebuild/day:   ${maxRebuild.toFixed(1)}ms`);
    console.log(`║    Avg frame time:    ${avgFrame.toFixed(1)}ms`);
    console.log(`║    Min FPS:           ${minFps}`);
    console.log(`╠══════════════════════════════════════════════════╣`);
    console.log(`║  MEMORY                                          ║`);
    console.log(`║    Before:  ${memBefore.usedMB}MB`);
    console.log(`║    After:   ${memAfter.usedMB}MB`);
    console.log(`║    Growth:  ${memGrowth}MB`);
    console.log(`╠══════════════════════════════════════════════════╣`);

    const PASS_CRITERIA = {
        minFps: 30,
        maxRebuildMs: 500,
        maxMemGrowthMB: 500,
        maxTimeboxMs: 1000,
        maxLeanMs: 500,
    };

    const results = {
        fps: minFps >= PASS_CRITERIA.minFps,
        rebuild: maxRebuild <= PASS_CRITERIA.maxRebuildMs,
        memory: memGrowth <= PASS_CRITERIA.maxMemGrowthMB,
        timebox: timeboxMs <= PASS_CRITERIA.maxTimeboxMs,
        lean: leanMs <= PASS_CRITERIA.maxLeanMs,
    };

    for (const [k, v] of Object.entries(results)) {
        const status = v ? 'PASS' : 'FAIL';
        console.log(`║  ${status}  ${k}`);
    }

    const allPass = Object.values(results).every(Boolean);
    console.log(`╠══════════════════════════════════════════════════╣`);
    console.log(`║  OVERALL: ${allPass ? 'PASS ✓' : 'FAIL ✗'}                                    ║`);
    console.log(`╚══════════════════════════════════════════════════╝`);

    return {
        config: { branchCount, filamentsPerBranch, totalFilaments, days },
        geometry: { geometryMs, filamentGenMs, cylInstances, filamentInstances, slabInstances },
        physics: { timeboxMs, totalSlabs, leanMs, leanComputations, totalDroopZones },
        replay: { avgRebuildMs: avgRebuild, maxRebuildMs: maxRebuild, avgFrameMs: avgFrame, minFps },
        memory: { beforeMB: memBefore.usedMB, afterMB: memAfter.usedMB, growthMB: memGrowth },
        pass: results,
        allPass,
        dailyResults: replayResults,
    };
}
