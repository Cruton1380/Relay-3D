/**
 * Filament Renderer — Batched Bark Ribbons (Cesium.Primitive)
 *
 * Each filament = one row ribbon on the branch bark surface.
 * Ribbons are batched Cesium.Primitives (ONE per branch), NOT Entity
 * polylines. This ensures sub-100 scene primitives for hundreds of ribbons.
 *
 * Left side of the row (width) = identity block (stable).
 * Right side of the row (length along l) = timeline block (commits).
 *
 * LOD tiers:
 *   TREE   (> 50km):  dot markers (Entity points, CallbackProperty)
 *   BRANCH (< 50km):  bark ribbon quads (Primitive, static, rebuilt on time advance)
 *
 * Master Plan refs: §3.2 (bark IS the spreadsheet), §4, §14, §33
 */

import { filamentRenderParams, LIFECYCLE_STATES, computeTwigness } from '../models/filament.js';

const PRIMITIVE_BUDGET = 2000;
let filamentInstanceCount = 0;

const ROW_WIDTH = 8; // meters circumferential extent on bark

const LIFECYCLE_COLORS = Object.freeze({
    OPEN:     '#4fc3f7',
    ACTIVE:   '#81c784',
    HOLD:     '#ffb74d',
    CLOSED:   '#90a4ae',
    ABSORBED: '#616161',
    MIGRATED: '#ce93d8',
});

function warmthToCesiumColor(warmth) {
    const r = (60 + 195 * warmth) / 255;
    const g = (100 + 80 * (1 - warmth)) / 255;
    const b = (200 * (1 - warmth)) / 255;
    return new Cesium.Color(r, g, b, 1.0);
}

function filamentColor(filament, params) {
    if (filament.isScar) return Cesium.Color.fromCssColorString('#e53935');
    if (params.warmth > 0.01) return warmthToCesiumColor(params.warmth);
    const hex = LIFECYCLE_COLORS[params.lifecycleState] || LIFECYCLE_COLORS.OPEN;
    return Cesium.Color.fromCssColorString(hex);
}

// ── Cylinder-surface point (reused by dots + twigs) ────────────────────

function cylinderSurfacePoint(branchStart, branchEnd, treeOrigin,
                               l, theta, r, branchRadius, branchLength) {
    const axis    = Cesium.Cartesian3.subtract(branchEnd, branchStart, new Cesium.Cartesian3());
    const bLen    = Cesium.Cartesian3.magnitude(axis);
    const axisDir = Cesium.Cartesian3.normalize(axis, new Cesium.Cartesian3());

    const lFrac = Math.max(0, Math.min(1, l / branchLength));
    const onAxis = Cesium.Cartesian3.add(
        branchStart,
        Cesium.Cartesian3.multiplyByScalar(axisDir, lFrac * bLen, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
    );

    let radial = Cesium.Cartesian3.subtract(onAxis, treeOrigin, new Cesium.Cartesian3());
    const dot  = Cesium.Cartesian3.dot(radial, axisDir);
    radial = Cesium.Cartesian3.subtract(
        radial,
        Cesium.Cartesian3.multiplyByScalar(axisDir, dot, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
    );
    if (Cesium.Cartesian3.magnitudeSquared(radial) < 1e-12) {
        const sn = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(onAxis, new Cesium.Cartesian3());
        radial = Cesium.Cartesian3.cross(axisDir, sn, new Cesium.Cartesian3());
        if (Cesium.Cartesian3.magnitudeSquared(radial) < 1e-12) {
            radial = Cesium.Cartesian3.cross(axisDir, Cesium.Cartesian3.UNIT_X, new Cesium.Cartesian3());
        }
    }
    Cesium.Cartesian3.normalize(radial, radial);

    const tangent = Cesium.Cartesian3.cross(axisDir, radial, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(tangent, tangent);

    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const offsetDir = Cesium.Cartesian3.add(
        Cesium.Cartesian3.multiplyByScalar(radial, cosT, new Cesium.Cartesian3()),
        Cesium.Cartesian3.multiplyByScalar(tangent, sinT, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
    );

    const dist = r > 0 ? r : branchRadius * 0.95;
    return Cesium.Cartesian3.add(
        onAxis,
        Cesium.Cartesian3.multiplyByScalar(offsetDir, dist, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
    );
}

// ── Ribbon quad geometry (local frame: X=width, Y=outward, Z=length) ──

function buildRibbonQuad(width, height) {
    const hw = width / 2;
    const hh = height / 2;
    return new Cesium.Geometry({
        attributes: {
            position: new Cesium.GeometryAttribute({
                componentDatatype: Cesium.ComponentDatatype.DOUBLE,
                componentsPerAttribute: 3,
                values: new Float64Array([
                    -hw, 0, -hh,
                     hw, 0, -hh,
                     hw, 0,  hh,
                    -hw, 0,  hh,
                ]),
            }),
        },
        indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
        primitiveType: Cesium.PrimitiveType.TRIANGLES,
        boundingSphere: new Cesium.BoundingSphere(
            Cesium.Cartesian3.ZERO,
            Math.sqrt(hw * hw + hh * hh)
        ),
    });
}

// ── Model matrix: positions a ribbon quad on the cylinder bark ─────────

function ribbonModelMatrix(branchStart, branchEnd, treeOrigin, params, branchLength) {
    const axis    = Cesium.Cartesian3.subtract(branchEnd, branchStart, new Cesium.Cartesian3());
    const bLen    = Cesium.Cartesian3.magnitude(axis);
    const axisDir = Cesium.Cartesian3.normalize(axis, new Cesium.Cartesian3());

    const lFrac = Math.max(0, Math.min(1, params.l / branchLength));
    const onAxis = Cesium.Cartesian3.add(
        branchStart,
        Cesium.Cartesian3.multiplyByScalar(axisDir, lFrac * bLen, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
    );

    let radial = Cesium.Cartesian3.subtract(onAxis, treeOrigin, new Cesium.Cartesian3());
    const d    = Cesium.Cartesian3.dot(radial, axisDir);
    radial = Cesium.Cartesian3.subtract(
        radial,
        Cesium.Cartesian3.multiplyByScalar(axisDir, d, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
    );
    if (Cesium.Cartesian3.magnitudeSquared(radial) < 1e-12) {
        const sn = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(onAxis, new Cesium.Cartesian3());
        radial = Cesium.Cartesian3.cross(axisDir, sn, new Cesium.Cartesian3());
        if (Cesium.Cartesian3.magnitudeSquared(radial) < 1e-12) {
            radial = Cesium.Cartesian3.cross(axisDir, Cesium.Cartesian3.UNIT_X, new Cesium.Cartesian3());
        }
    }
    Cesium.Cartesian3.normalize(radial, radial);

    const tangent = Cesium.Cartesian3.cross(axisDir, radial, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(tangent, tangent);

    const cosT = Math.cos(params.theta);
    const sinT = Math.sin(params.theta);

    const xAxis = Cesium.Cartesian3.add(
        Cesium.Cartesian3.multiplyByScalar(radial, -sinT, new Cesium.Cartesian3()),
        Cesium.Cartesian3.multiplyByScalar(tangent, cosT, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
    );
    const yAxis = Cesium.Cartesian3.add(
        Cesium.Cartesian3.multiplyByScalar(radial, cosT, new Cesium.Cartesian3()),
        Cesium.Cartesian3.multiplyByScalar(tangent, sinT, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
    );
    const zAxis = axisDir;

    const rDist  = Math.max(3, params.r);
    const surfPos = Cesium.Cartesian3.add(
        onAxis,
        Cesium.Cartesian3.multiplyByScalar(yAxis, rDist, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
    );

    const rot = new Cesium.Matrix3(
        xAxis.x, yAxis.x, zAxis.x,
        xAxis.y, yAxis.y, zAxis.y,
        xAxis.z, yAxis.z, zAxis.z,
    );

    return Cesium.Matrix4.fromRotationTranslation(rot, surfPos);
}

// ── Batched ribbon Primitive for one branch ────────────────────────────

function buildBranchRibbonPrimitive(viewer, {
    filaments, branchStart, branchEnd, branchRadius, treeOrigin,
}) {
    const branchLength = Cesium.Cartesian3.distance(branchStart, branchEnd);
    const branchConfig = { branchLength, branchRadius };

    const instances = [];
    for (const fil of filaments) {
        const params = filamentRenderParams(fil, branchConfig);
        if (params.ribbonLength < 1) continue;

        const geo = buildRibbonQuad(ROW_WIDTH, params.ribbonLength);
        const mm  = ribbonModelMatrix(branchStart, branchEnd, treeOrigin, params, branchLength);
        const col = filamentColor(fil, params).withAlpha(params.opacity);

        instances.push(new Cesium.GeometryInstance({
            geometry: geo,
            modelMatrix: mm,
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(col),
            },
            id: fil.filamentId,
        }));
    }

    if (instances.length === 0) return null;

    return viewer.scene.primitives.add(new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance({
            flat: true,
            translucent: true,
        }),
        asynchronous: false,
    }));
}

// ── Dot Entity (TREE LOD — cheap, CallbackProperty for live sinking) ──

function createDotEntity(viewer, filament, branchStart, branchEnd,
                          treeOrigin, branchRadius, branchConfig) {
    const dynamicPos = new Cesium.CallbackProperty(() => {
        const p = filamentRenderParams(filament, branchConfig);
        return cylinderSurfacePoint(
            branchStart, branchEnd, treeOrigin,
            p.l, p.theta, p.r, branchRadius, branchConfig.branchLength
        );
    }, false);

    const initP = filamentRenderParams(filament, branchConfig);
    const col   = filamentColor(filament, initP).withAlpha(initP.opacity);

    return viewer.entities.add({
        position: dynamicPos,
        point: {
            pixelSize: 6,
            color: col,
            outlineColor: Cesium.Color.WHITE.withAlpha(initP.opacity * 0.4),
            outlineWidth: 1,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scaleByDistance: new Cesium.NearFarScalar(1e3, 1.5, 2e5, 0.3),
        },
        properties: { relayType: 'filament', filamentId: filament.filamentId },
    });
}

// ── Twig Entity (radial spike for old OPEN/HOLD filaments) ─────────────

function createTwigEntity(viewer, filament, branchStart, branchEnd,
                           treeOrigin, branchRadius, branchConfig, twigness) {
    const dynamicPositions = new Cesium.CallbackProperty(() => {
        const p = filamentRenderParams(filament, branchConfig);
        const twigLen = 15 + 35 * twigness;
        const base = cylinderSurfacePoint(
            branchStart, branchEnd, treeOrigin,
            p.l, p.theta, p.r, branchRadius, branchConfig.branchLength
        );
        const tip = cylinderSurfacePoint(
            branchStart, branchEnd, treeOrigin,
            p.l, p.theta, p.r + twigLen, branchRadius, branchConfig.branchLength
        );
        return [base, tip];
    }, false);

    return viewer.entities.add({
        polyline: {
            positions: dynamicPositions,
            width: 2 + 3 * twigness,
            material: Cesium.Color.fromCssColorString('#ff6b35').withAlpha(0.5 + 0.5 * twigness),
            arcType: Cesium.ArcType.NONE,
        },
        properties: {
            relayType: 'twig',
            filamentId: filament.filamentId,
            twigness,
        },
    });
}

// ── Main render entry point (called once per branch at tree creation) ──

export function renderBranchFilaments(viewer, {
    filaments, branchStart, branchEnd, branchRadius,
    treeOrigin, branchLabel, sinkingMode = 'earth-time',
}) {
    const count = filaments.length;
    if (filamentInstanceCount + count > PRIMITIVE_BUDGET) {
        console.error(
            `[REFUSAL] reason=PRIMITIVE_BUDGET_EXCEEDED kind=FILAMENT` +
            ` requested=${count} current=${filamentInstanceCount} budget=${PRIMITIVE_BUDGET}`
        );
        return { dotEntities: [], ribbonPrimitive: null, twigEntities: [] };
    }

    const branchLength = Cesium.Cartesian3.distance(branchStart, branchEnd);
    const branchConfig = { branchLength, branchRadius, sinkingMode };

    const dotEntities  = [];
    const twigEntities = [];
    let twigCount = 0;

    for (const fil of filaments) {
        dotEntities.push(
            createDotEntity(viewer, fil, branchStart, branchEnd,
                            treeOrigin, branchRadius, branchConfig)
        );

        const tw = computeTwigness(fil, branchConfig);
        if (tw > 0.1) {
            twigEntities.push(
                createTwigEntity(viewer, fil, branchStart, branchEnd,
                                  treeOrigin, branchRadius, branchConfig, tw)
            );
            twigCount++;
        }

        filamentInstanceCount++;
    }

    const ribbonPrimitive = buildBranchRibbonPrimitive(viewer, {
        filaments, branchStart, branchEnd, branchRadius, treeOrigin,
    });

    console.log(
        `[FILAMENT] branch="${branchLabel}" ribbons=${count} twigs=${twigCount}` +
        ` (dots=${dotEntities.length} ribbonInstances=${count})` +
        ` sinkingMode=${sinkingMode} totalInstances=${filamentInstanceCount}` +
        ` primitiveType=BATCHED result=PASS`
    );

    return { dotEntities, ribbonPrimitive, twigEntities };
}

// ── Rebuild ribbons after time advance ─────────────────────────────────

export function rebuildFilaments(viewer, tree) {
    for (const p of tree.ribbonPrimitives) {
        viewer.scene.primitives.remove(p);
    }
    tree.ribbonPrimitives.length = 0;

    for (const bd of tree.ribbonBuildData) {
        const prim = buildBranchRibbonPrimitive(viewer, bd);
        if (prim) tree.ribbonPrimitives.push(prim);
    }

    console.log(
        `[FILAMENT] Ribbon rebuild: ${tree.ribbonPrimitives.length} branch primitives`
    );
}

// ── LOD gating (references tree arrays — survives rebuild) ─────────────

export function setupFilamentLOD(viewer, tree) {
    const TREE_THRESHOLD   = 200_000;
    const BRANCH_THRESHOLD =  50_000;

    viewer.clock.onTick.addEventListener(() => {
        const forceLOD = window._relay?.forceLOD;
        const alt = viewer.camera.positionCartographic.height;

        let showDots, showRibbons;
        if (forceLOD === 'BRANCH' || forceLOD === 'BARK') {
            showDots    = false;
            showRibbons = true;
        } else if (forceLOD === 'TREE') {
            showDots    = true;
            showRibbons = false;
        } else if (forceLOD === 'SHEET') {
            showDots    = false;
            showRibbons = false;
        } else {
            showDots    = alt < TREE_THRESHOLD && alt >= BRANCH_THRESHOLD;
            showRibbons = alt < BRANCH_THRESHOLD;
        }

        for (const e of tree.dotEntities)      e.show = showDots;
        for (const e of tree.twigEntities)     e.show = showRibbons;
        for (const p of tree.ribbonPrimitives) p.show = showRibbons;
    });
}

export function getFilamentInstanceCount() { return filamentInstanceCount; }
