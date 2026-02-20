/**
 * Relay Tree — Tier 1 Core Geometry
 *
 * Build slices implemented:
 *   BARK-CYLINDER-1 — trunk + branch cylinders, bark shells, flat panels
 *   FILAMENT-ROW-1  — row-level filaments with six universal domains
 *   GRAVITY-SINK-1  — time-driven sinking (new=tip, old=trunk junction)
 *   TREE-RING-1     — cross-section dual encoding (radial + angular)
 *   HELIX-1         — helical twist (spiral grain along branch)
 *   SLAB-REVISION-1 — timebox slabs (thickness, magnitude color, confidence opacity, wilt)
 *
 * LOD gating:
 *   TREE   (< 200km): body cylinders + filament dots
 *   BRANCH (50–5km):  bark shells + timebox slabs + filament lanes
 *   SHEET  (< 5km):   flat bark panels
 *
 * Master Plan refs: §2-4, §14, §33
 */

import {
    createTrunkPrimitive,
    createBranchPrimitives,
    createBarkShells,
    createFlatBarkPanels,
    setupLODGating,
    logRegressionGate,
    computeBranchEndpoints,
} from './renderers/cylinder-renderer.js';

import { createFilament, advanceLifecycle, createScar, LIFECYCLE_STATES } from './models/filament.js';
import { renderBranchFilaments, setupFilamentLOD, rebuildFilaments } from './renderers/filament-renderer.js';
import { generateTimeboxSlabs, detectDroopZones } from './models/timebox.js';
import { renderBranchSlabs, renderDroopZones } from './renderers/slab-renderer.js';

const TREE_DEFAULTS = {
    trunkRadius: 80,
    trunkHeight: 2000,
    trunkColor: '#3a2a1a',
    branchRadius: 30,
    branchLength: 800,
};

export function createTree(viewer, options = {}) {
    const {
        lon = 34.78,
        lat = 32.08,
        name = 'Relay HQ',
        branches = [
            { label: 'Invoices',   angle: 0,   height: 0.7,  color: '#2a6090' },
            { label: 'Contracts',  angle: 72,  height: 0.55, color: '#4a8060' },
            { label: 'Compliance', angle: 144, height: 0.4,  color: '#906030' },
            { label: 'Reports',    angle: 216, height: 0.8,  color: '#605090' },
            { label: 'HR',         angle: 288, height: 0.65, color: '#904050' },
        ],
    } = options;

    const cfg = { ...TREE_DEFAULTS, ...options };
    const origin = Cesium.Cartesian3.fromDegrees(lon, lat);
    const enu = Cesium.Transforms.eastNorthUpToFixedFrame(origin);

    const tree = {
        name, lon, lat, origin, enu, config: cfg,
        bodyPrimitives: [],
        barkPrimitives: [],
        sheetPrimitives: [],
    };

    // ── Body cylinders ──
    const trunkPrim = createTrunkPrimitive(viewer, tree);
    if (trunkPrim) tree.bodyPrimitives.push(trunkPrim);

    const branchPrims = createBranchPrimitives(viewer, tree, branches);
    tree.bodyPrimitives.push(...branchPrims.filter(Boolean));

    // ── Bark shells (BC1-d) ──
    const barkPrims = createBarkShells(viewer, tree, branches);
    tree.barkPrimitives.push(...barkPrims.filter(Boolean));

    // ── Flat bark panels (BC1-e) ──
    const sheetPrims = createFlatBarkPanels(viewer, tree, branches);
    tree.sheetPrimitives.push(...sheetPrims.filter(Boolean));

    // ── Filaments (FILAMENT-ROW-1 → ribbon quads) ──
    tree.filaments        = [];
    tree.dotEntities      = [];
    tree.ribbonPrimitives = [];
    tree.twigEntities     = [];
    tree.ribbonBuildData  = [];

    for (const b of branches) {
        const { start, end } = computeBranchEndpoints(tree.enu, cfg, b);
        const branchFilaments = generateDemoFilaments(b, tree);

        tree.filaments.push(...branchFilaments);

        const buildData = {
            filaments: branchFilaments,
            branchStart: start,
            branchEnd: end,
            branchRadius: cfg.branchRadius,
            treeOrigin: tree.origin,
            branchLabel: b.label,
        };
        tree.ribbonBuildData.push(buildData);

        const result = renderBranchFilaments(viewer, buildData);
        tree.dotEntities.push(...result.dotEntities);
        tree.twigEntities.push(...result.twigEntities);
        if (result.ribbonPrimitive) tree.ribbonPrimitives.push(result.ribbonPrimitive);
    }

    setupFilamentLOD(viewer, tree);

    tree.rebuild = () => rebuildFilaments(viewer, tree);

    // ── Timebox Slabs (SLAB-REVISION-1) + Droop Zones (WILT-1) ──
    tree.slabPrimitives = [];
    tree.droopEntities = [];

    const filamentIndex = new Map();
    const treeName = tree.name.replace(/\s/g, '');
    for (const f of tree.filaments) {
        if (!filamentIndex.has(f.branchId)) filamentIndex.set(f.branchId, []);
        filamentIndex.get(f.branchId).push(f);
    }

    for (const b of branches) {
        const { start, end } = computeBranchEndpoints(tree.enu, cfg, b);
        const branchId = `branch.${treeName}.${b.label}`;
        const branchFilaments = filamentIndex.get(branchId) || [];
        const branchLength = Cesium.Cartesian3.distance(start, end);

        const slabs = generateTimeboxSlabs(branchFilaments, {
            branchLength,
            branchRadius: cfg.branchRadius,
            slabCount: 8,
            branchId,
        });

        const result = renderBranchSlabs(viewer, {
            slabs,
            branchStart: start,
            branchEnd: end,
            branchRadius: cfg.branchRadius,
            branchLength,
            branchLabel: b.label,
        });

        if (result.primitive) tree.slabPrimitives.push(result.primitive);

        // Droop zones (WILT-1)
        const droopZones = detectDroopZones(slabs);
        if (droopZones.length > 0) {
            const droopResult = renderDroopZones(viewer, {
                droopZones,
                branchStart: start,
                branchEnd: end,
                branchRadius: cfg.branchRadius,
                branchLength,
                branchLabel: b.label,
            });
            tree.droopEntities.push(...droopResult.entities);
        }
    }

    // ── Label above trunk ──
    const labelPos = Cesium.Matrix4.multiplyByPoint(
        enu, new Cesium.Cartesian3(0, 0, cfg.trunkHeight + 200), new Cesium.Cartesian3()
    );
    tree.labelEntity = viewer.entities.add({
        position: labelPos,
        label: {
            text: name,
            font: '14px system-ui',
            fillColor: Cesium.Color.WHITE.withAlpha(0.9),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -10),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scaleByDistance: new Cesium.NearFarScalar(1e3, 1.2, 5e6, 0.0),
        },
        properties: { relayType: 'treeLabel', treeName: name },
    });

    // ── LOD gating (three-tier + slabs at BRANCH level) ──
    setupLODGating(
        viewer,
        tree.bodyPrimitives,
        [...tree.barkPrimitives, ...tree.slabPrimitives],
        tree.sheetPrimitives
    );

    // ── Regression gate (BC1-f) ──
    logRegressionGate(tree);

    console.log(
        `[TREE] "${name}" placed at ${lat.toFixed(2)}°N ${lon.toFixed(2)}°E` +
        ` — ${branches.length} branches, ${tree.filaments.length} filaments,` +
        ` ${tree.slabPrimitives.length} slab batches, Tier 1 complete`
    );
    return tree;
}

/**
 * Generate demo filaments for a branch to prove FILAMENT-ROW-1 rendering.
 * Each branch gets filaments in various lifecycle states with different
 * magnitudes, evidence levels, and approach angles.
 */
function generateDemoFilaments(branchDef, tree) {
    const label = branchDef.label;
    const filaments = [];

    const DEMOS = [
        { suffix: '001', state: 'OPEN',     mag: 12000, evidence: 1, angle: 0.3 },
        { suffix: '002', state: 'OPEN',     mag: 5500,  evidence: 0, angle: 1.2 },
        { suffix: '003', state: 'ACTIVE',   mag: 48000, evidence: 2, angle: 2.1 },
        { suffix: '004', state: 'ACTIVE',   mag: 23000, evidence: 3, angle: 3.5 },
        { suffix: '005', state: 'HOLD',     mag: 8700,  evidence: 1, angle: 4.8 },
        { suffix: '006', state: 'CLOSED',   mag: 91000, evidence: 3, angle: 5.5 },
        { suffix: '007', state: 'CLOSED',   mag: 3200,  evidence: 2, angle: 0.8 },
        { suffix: '008', state: 'ABSORBED', mag: 67000, evidence: 3, angle: 2.9 },
    ];

    for (const d of DEMOS) {
        const daysAgo = Math.floor(Math.random() * 60) + 1;
        const spawnDate = new Date(Date.now() - daysAgo * 86400000);

        const evidenceRefs = [];
        for (let i = 0; i < d.evidence; i++) {
            evidenceRefs.push(`evidence.${label.toLowerCase()}.${d.suffix}.${i}`);
        }

        let f = createFilament({
            objectType: label.toLowerCase(),
            objectId: d.suffix,
            branchId: `branch.${tree.name.replace(/\s/g, '')}.${label}`,
            counterpartyRef: `vendor-${d.suffix}`,
            approachAngle: d.angle,
            magnitude: d.mag.toString(),
            unit: 'USD',
            evidenceRequired: 3,
            evidenceRefs,
            spawnedAt: spawnDate.toISOString(),
        });

        if (d.state !== 'OPEN') {
            f = advanceLifecycle(f, 'ACTIVE', {});
        }
        if (d.state === 'HOLD') {
            f = advanceLifecycle(f, 'HOLD', {});
        }
        if (d.state === 'CLOSED' || d.state === 'ABSORBED') {
            f = advanceLifecycle(f, 'CLOSED', {});
        }
        if (d.state === 'ABSORBED') {
            f = advanceLifecycle(f, 'ABSORBED', {});
        }

        filaments.push(f);
    }

    // Create one scar per branch (SCAR-1 demo): revert the HOLD filament
    const holdFilament = filaments.find(f => f.lifecycleState === LIFECYCLE_STATES.HOLD);
    if (holdFilament) {
        const { scar, revertedFilament } = createScar(holdFilament, {
            revertedBy: 'auditor-001',
            reason: 'Duplicate entry detected during reconciliation',
            evidenceRefs: [`evidence.audit.${label.toLowerCase()}.dup-check`],
        });
        const idx = filaments.indexOf(holdFilament);
        filaments[idx] = revertedFilament;
        filaments.push(scar);
    }

    return filaments;
}

/** Fly the camera to a tree, orbiting view. */
export function flyToTree(viewer, tree, options = {}) {
    const { duration = 2.0, altitude = 8000 } = options;
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
            tree.lon + 0.02, tree.lat - 0.01, altitude
        ),
        orientation: {
            heading: Cesium.Math.toRadians(30),
            pitch: Cesium.Math.toRadians(-35),
            roll: 0,
        },
        duration,
    });
}
