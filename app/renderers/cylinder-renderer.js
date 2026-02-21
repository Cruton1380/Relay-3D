/**
 * Cylinder Renderer — BARK-CYLINDER-1
 *
 * Renders tree trunks and branches as real 3D cylinders, with bark
 * shells overlaid as a thin UV-mapped layer showing timebox banding.
 * BC1-e adds flat bark panels that replace bark shells at close range,
 * creating the zoom-to-flat spreadsheet transition.
 *
 * ALL geometry here is render-only, LOD-sheddable, never physics truth.
 *
 * Master Plan refs: §2 (Trunk), §3 (Branch), §33 (LOD / Sight Radius)
 */

// ── Constants ──
const BARK_EXPAND = 1.02;

const LOD = {
    TREE:   200_000,   // meters — base cylinders appear
    BRANCH:  50_000,   // meters — bark shells appear
    SHEET:    5_000,   // meters — flat bark panels replace shells
    CELL:       500,   // meters — spreadsheet grid (future)
};

// ── Primitive Budget ──
const BUDGETS = { TREE: 1000, BRANCH: 2000 };
let instanceCount = 0;

function checkBudget(lod, requested) {
    const max = BUDGETS[lod] || BUDGETS.TREE;
    if (instanceCount + requested > max) {
        console.error(
            `[REFUSAL] reason=PRIMITIVE_BUDGET_EXCEEDED kind=CYLINDER lod=${lod}` +
            ` requested=${requested} current=${instanceCount} budget=${max}`
        );
        return false;
    }
    return true;
}

// ── Rotation helpers ──

function rotationZToDir(dir, hint) {
    const z = Cesium.Cartesian3.normalize(dir, new Cesium.Cartesian3());

    let x = Cesium.Cartesian3.cross(hint, z, new Cesium.Cartesian3());
    if (Cesium.Cartesian3.magnitudeSquared(x) < 1e-12) {
        x = Cesium.Cartesian3.cross(Cesium.Cartesian3.UNIT_X, z, new Cesium.Cartesian3());
        if (Cesium.Cartesian3.magnitudeSquared(x) < 1e-12) {
            x = Cesium.Cartesian3.cross(Cesium.Cartesian3.UNIT_Y, z, new Cesium.Cartesian3());
        }
    }
    Cesium.Cartesian3.normalize(x, x);

    const y = Cesium.Cartesian3.cross(z, x, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(y, y);

    return new Cesium.Matrix3(
        x.x, y.x, z.x,
        x.y, y.y, z.y,
        x.z, y.z, z.z,
    );
}

function cylinderModelMatrix(startECEF, endECEF) {
    const midpoint = Cesium.Cartesian3.midpoint(startECEF, endECEF, new Cesium.Cartesian3());
    const dir = Cesium.Cartesian3.subtract(endECEF, startECEF, new Cesium.Cartesian3());
    const length = Cesium.Cartesian3.magnitude(dir);
    Cesium.Cartesian3.normalize(dir, dir);

    const up = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(midpoint, new Cesium.Cartesian3());
    const rot = rotationZToDir(dir, up);

    return {
        modelMatrix: Cesium.Matrix4.fromRotationTranslation(rot, midpoint),
        length,
    };
}

// ── Bark Material (Fabric shader) ──

function createBarkMaterial(options = {}) {
    const {
        bandCount  = 8.0,
        baseColor  = new Cesium.Color(0.22, 0.16, 0.10, 0.45),
        ringColor  = new Cesium.Color(0.55, 0.42, 0.30, 0.85),
        ringWidth  = 0.04,
        helixTwists = 3.0,
    } = options;

    return new Cesium.Material({
        fabric: {
            type: 'RelayBark',
            uniforms: { bandCount, baseColor, ringColor, ringWidth, helixTwists },
            source: `
                czm_material czm_getMaterial(czm_materialInput materialInput) {
                    czm_material material = czm_getDefaultMaterial(materialInput);
                    vec2 st = materialInput.st;

                    // Helical twist: theta offset increases along branch length (HELIX-1)
                    float twistedS = fract(st.x + st.y * helixTwists);

                    // Timebox banding along branch axis
                    float bandPos = fract(st.y * bandCount);
                    float ring = 1.0 - smoothstep(0.0, ringWidth, bandPos)
                                     + smoothstep(1.0 - ringWidth, 1.0, bandPos);
                    ring = clamp(ring, 0.0, 1.0);

                    // Lifecycle radial zones (TREE-RING-1)
                    // st.x maps around circumference: simulate 4 concentric zones
                    float radialZone = twistedS;
                    vec3 zoneColor = baseColor.rgb;
                    if (radialZone < 0.25) {
                        zoneColor = vec3(0.35, 0.35, 0.40); // ABSORBED — core gray
                    } else if (radialZone < 0.50) {
                        zoneColor = vec3(0.45, 0.38, 0.28); // CLOSED — warm mid
                    } else if (radialZone < 0.75) {
                        zoneColor = vec3(0.30, 0.42, 0.30); // ACTIVE — green mid
                    } else {
                        zoneColor = vec3(0.25, 0.35, 0.50); // OPEN — blue bark
                    }

                    float rowHeat = 0.8 + 0.2 * sin(st.y * bandCount * 6.2832 * 3.0);
                    vec3 bark = mix(zoneColor, baseColor.rgb, 0.4) * rowHeat;
                    material.diffuse = mix(bark, ringColor.rgb, ring);
                    material.alpha = mix(baseColor.a, ringColor.a, ring);
                    return material;
                }
            `,
        },
    });
}

// ── Flat bark material (brighter for SHEET LOD readability) ──

function createFlatBarkMaterial(options = {}) {
    const {
        bandCount  = 8.0,
        baseColor  = new Cesium.Color(0.14, 0.12, 0.10, 0.70),
        ringColor  = new Cesium.Color(0.45, 0.38, 0.28, 0.95),
        ringWidth  = 0.025,
        helixTwists = 3.0,
    } = options;

    return new Cesium.Material({
        fabric: {
            type: 'RelayBarkFlat',
            uniforms: { bandCount, baseColor, ringColor, ringWidth, helixTwists },
            source: `
                czm_material czm_getMaterial(czm_materialInput materialInput) {
                    czm_material material = czm_getDefaultMaterial(materialInput);
                    vec2 st = materialInput.st;

                    // Helical grain visible as diagonal stripe pattern (HELIX-1)
                    float twistedS = fract(st.x + st.y * helixTwists);

                    // Timebox banding
                    float bandPos = fract(st.y * bandCount);
                    float ring = 1.0 - smoothstep(0.0, ringWidth, bandPos)
                                     + smoothstep(1.0 - ringWidth, 1.0, bandPos);
                    ring = clamp(ring, 0.0, 1.0);

                    // Lifecycle radial zones (TREE-RING-1) — shown as
                    // horizontal bands on the flat panel (s = unrolled theta)
                    float radialZone = twistedS;
                    vec3 zoneColor = baseColor.rgb;
                    if (radialZone < 0.25) {
                        zoneColor = vec3(0.30, 0.30, 0.35);
                    } else if (radialZone < 0.50) {
                        zoneColor = vec3(0.40, 0.34, 0.24);
                    } else if (radialZone < 0.75) {
                        zoneColor = vec3(0.26, 0.38, 0.26);
                    } else {
                        zoneColor = vec3(0.22, 0.30, 0.45);
                    }

                    float rowHeat = 0.85 + 0.15 * sin(st.y * bandCount * 6.2832 * 3.0);
                    vec3 bark = mix(zoneColor, baseColor.rgb, 0.35) * rowHeat;
                    material.diffuse = mix(bark, ringColor.rgb, ring);
                    material.alpha = mix(baseColor.a, ringColor.a, ring);
                    return material;
                }
            `,
        },
    });
}

// ── Branch / trunk endpoint helpers ──

export function computeBranchEndpoints(enu, cfg, b) {
    const heightZ = cfg.trunkHeight * b.height;
    const rad = Cesium.Math.toRadians(b.angle);
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);

    const start = Cesium.Matrix4.multiplyByPoint(
        enu,
        new Cesium.Cartesian3(dx * cfg.trunkRadius, dy * cfg.trunkRadius, heightZ),
        new Cesium.Cartesian3()
    );
    const end = Cesium.Matrix4.multiplyByPoint(
        enu,
        new Cesium.Cartesian3(dx * cfg.branchLength, dy * cfg.branchLength, heightZ + cfg.branchLength * 0.15),
        new Cesium.Cartesian3()
    );
    return { start, end };
}

function computeTrunkEndpoints(enu, cfg) {
    const base = Cesium.Matrix4.multiplyByPoint(enu, new Cesium.Cartesian3(0, 0, 0), new Cesium.Cartesian3());
    const top  = Cesium.Matrix4.multiplyByPoint(enu, new Cesium.Cartesian3(0, 0, cfg.trunkHeight), new Cesium.Cartesian3());
    return { base, top };
}

// ── Flat panel helpers (BC1-e) ──

/**
 * Custom quad geometry — 4 vertices, 2 triangles.
 * Local frame: X = width, Y = normal (outward), Z = height.
 * ST: s wraps around theta (width), t goes along branch axis (height).
 */
function createQuadGeometry(width, height) {
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
            normal: new Cesium.GeometryAttribute({
                componentDatatype: Cesium.ComponentDatatype.FLOAT,
                componentsPerAttribute: 3,
                values: new Float32Array([
                    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
                ]),
            }),
            st: new Cesium.GeometryAttribute({
                componentDatatype: Cesium.ComponentDatatype.FLOAT,
                componentsPerAttribute: 2,
                values: new Float32Array([
                    0, 0,  1, 0,  1, 1,  0, 1,
                ]),
            }),
            tangent: new Cesium.GeometryAttribute({
                componentDatatype: Cesium.ComponentDatatype.FLOAT,
                componentsPerAttribute: 3,
                values: new Float32Array([
                    1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
                ]),
            }),
            bitangent: new Cesium.GeometryAttribute({
                componentDatatype: Cesium.ComponentDatatype.FLOAT,
                componentsPerAttribute: 3,
                values: new Float32Array([
                    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
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

/**
 * Model matrix that positions a flat panel tangent to a branch cylinder.
 *
 * The panel faces outward from the tree trunk:
 *   local +X → width direction (perpendicular to branch, tangent to cylinder)
 *   local +Y → outward from trunk (panel normal)
 *   local +Z → along branch axis (panel height)
 *
 * Offset from branch centerline by avgRadius so the panel sits on the surface.
 */
function flatPanelModelMatrix(start, end, treeOrigin, avgRadius) {
    const mid = Cesium.Cartesian3.midpoint(start, end, new Cesium.Cartesian3());
    const dir = Cesium.Cartesian3.subtract(end, start, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(dir, dir);

    let radial = Cesium.Cartesian3.subtract(mid, treeOrigin, new Cesium.Cartesian3());

    // Project radial onto the plane perpendicular to branch direction
    const dot = Cesium.Cartesian3.dot(radial, dir);
    radial = Cesium.Cartesian3.subtract(
        radial,
        Cesium.Cartesian3.multiplyByScalar(dir, dot, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
    );

    if (Cesium.Cartesian3.magnitudeSquared(radial) < 1e-12) {
        // Trunk case: branch is vertical directly above origin.
        // Pick ENU East as the outward direction.
        const enu = Cesium.Transforms.eastNorthUpToFixedFrame(mid);
        const col = Cesium.Matrix4.getColumn(enu, 0, new Cesium.Cartesian4());
        radial = new Cesium.Cartesian3(col.x, col.y, col.z);
    }
    Cesium.Cartesian3.normalize(radial, radial);

    // Orthogonal frame: zAxis=along branch, yAxis=outward, xAxis=width
    const zAxis = dir;
    const yAxis = radial;
    const xAxis = Cesium.Cartesian3.cross(yAxis, zAxis, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(xAxis, xAxis);

    const panelPos = Cesium.Cartesian3.add(
        mid,
        Cesium.Cartesian3.multiplyByScalar(yAxis, avgRadius * 1.1, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
    );

    const rot = new Cesium.Matrix3(
        xAxis.x, yAxis.x, zAxis.x,
        xAxis.y, yAxis.y, zAxis.y,
        xAxis.z, yAxis.z, zAxis.z,
    );
    return Cesium.Matrix4.fromRotationTranslation(rot, panelPos);
}

// ═══════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════

/** Create a single cylinder Primitive between two ECEF points. */
export function createCylinderPrimitive(viewer, {
    startECEF, endECEF, topRadius, bottomRadius,
    color = '#3a2a1a', alpha = 0.9, slices = 16,
}) {
    const { modelMatrix, length } = cylinderModelMatrix(startECEF, endECEF);

    const primitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
            geometry: new Cesium.CylinderGeometry({ length, topRadius, bottomRadius, slices }),
            modelMatrix,
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                    Cesium.Color.fromCssColorString(color).withAlpha(alpha)
                ),
            },
        }),
        appearance: new Cesium.PerInstanceColorAppearance({ flat: false, translucent: alpha < 1.0 }),
        asynchronous: false,
    });

    viewer.scene.primitives.add(primitive);
    instanceCount++;
    return primitive;
}

/** Trunk body cylinder — one Primitive. */
export function createTrunkPrimitive(viewer, tree) {
    if (!checkBudget('TREE', 1)) return null;

    const { base, top } = computeTrunkEndpoints(tree.enu, tree.config);

    const prim = createCylinderPrimitive(viewer, {
        startECEF: base,
        endECEF: top,
        bottomRadius: tree.config.trunkRadius,
        topRadius: tree.config.trunkRadius * 0.7,
        color: tree.config.trunkColor,
        alpha: 0.85,
        slices: 24,
    });

    console.log(
        `[BARK] trunkCylinder tree="${tree.name}"` +
        ` heightM=${tree.config.trunkHeight} radiusM=${tree.config.trunkRadius} result=PASS`
    );
    return prim;
}

/** All branch body cylinders — batched into ONE Primitive. */
export function createBranchPrimitives(viewer, tree, branchDefs) {
    const count = branchDefs.length;
    if (!checkBudget('BRANCH', count)) return [];

    const instances = branchDefs.map(b => {
        const { start, end } = computeBranchEndpoints(tree.enu, tree.config, b);
        const { modelMatrix, length } = cylinderModelMatrix(start, end);

        return new Cesium.GeometryInstance({
            geometry: new Cesium.CylinderGeometry({
                length,
                topRadius: tree.config.branchRadius * 0.5,
                bottomRadius: tree.config.branchRadius,
                slices: 12,
            }),
            modelMatrix,
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                    Cesium.Color.fromCssColorString(b.color).withAlpha(0.85)
                ),
            },
        });
    });

    const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance({ flat: false, translucent: true }),
        asynchronous: false,
    });

    viewer.scene.primitives.add(primitive);
    instanceCount += count;

    console.log(
        `[BARK] branchCylinders tree="${tree.name}"` +
        ` count=${count} instances=${instances.length} batched=1primitive result=PASS`
    );
    return [primitive];
}

// ── BC1-d: Bark Shells ──

export function createBarkShells(viewer, tree, branchDefs) {
    const total = branchDefs.length + 1;
    if (!checkBudget('BRANCH', total)) return [];

    const cfg = tree.config;
    const enu = tree.enu;
    const vf = Cesium.VertexFormat.ALL;
    const instances = [];

    const { base, top } = computeTrunkEndpoints(enu, cfg);
    const trunkMM = cylinderModelMatrix(base, top);
    instances.push(new Cesium.GeometryInstance({
        geometry: new Cesium.CylinderGeometry({
            length: trunkMM.length,
            topRadius:    cfg.trunkRadius * 0.7 * BARK_EXPAND,
            bottomRadius: cfg.trunkRadius * BARK_EXPAND,
            slices: 24,
            vertexFormat: vf,
        }),
        modelMatrix: trunkMM.modelMatrix,
    }));

    for (const b of branchDefs) {
        const { start, end } = computeBranchEndpoints(enu, cfg, b);
        const { modelMatrix, length } = cylinderModelMatrix(start, end);
        instances.push(new Cesium.GeometryInstance({
            geometry: new Cesium.CylinderGeometry({
                length,
                topRadius:    cfg.branchRadius * 0.5 * BARK_EXPAND,
                bottomRadius: cfg.branchRadius * BARK_EXPAND,
                slices: 12,
                vertexFormat: vf,
            }),
            modelMatrix,
        }));
    }

    const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.MaterialAppearance({
            material: createBarkMaterial(),
            translucent: true,
        }),
        asynchronous: false,
    });

    viewer.scene.primitives.add(primitive);
    instanceCount += total;

    console.log(
        `[BARK] barkShells tree="${tree.name}"` +
        ` count=${total} (1trunk+${branchDefs.length}branches) batched=1primitive result=PASS`
    );
    return [primitive];
}

// ── BC1-e: Flat Bark Panels (zoom-to-flat transition) ──

/**
 * Create flat bark panels for trunk + all branches — batched into ONE Primitive.
 *
 * Each panel is a rectangle tangent to the branch, representing the "unrolled"
 * bark surface. Dimensions: width = circumference, height = branch length.
 * Same banding material but brighter/denser for close-range readability.
 *
 * This is a VIEW TRANSFORM only — no data model, no filaments, no commits.
 * Visible at SHEET LOD (< 5km), hidden otherwise.
 */
export function createFlatBarkPanels(viewer, tree, branchDefs) {
    const total = branchDefs.length + 1;
    if (!checkBudget('BRANCH', total)) return [];

    const cfg = tree.config;
    const enu = tree.enu;
    const instances = [];

    // Trunk flat panel
    const { base, top } = computeTrunkEndpoints(enu, cfg);
    const trunkLen = Cesium.Cartesian3.distance(base, top);
    const trunkAvgR = cfg.trunkRadius * 0.85;
    const trunkWidth = 2 * Math.PI * trunkAvgR;
    instances.push(new Cesium.GeometryInstance({
        geometry: createQuadGeometry(trunkWidth, trunkLen),
        modelMatrix: flatPanelModelMatrix(base, top, tree.origin, trunkAvgR),
    }));

    // Branch flat panels
    for (const b of branchDefs) {
        const { start, end } = computeBranchEndpoints(enu, cfg, b);
        const len = Cesium.Cartesian3.distance(start, end);
        const avgR = cfg.branchRadius * 0.75;
        const width = 2 * Math.PI * avgR;
        instances.push(new Cesium.GeometryInstance({
            geometry: createQuadGeometry(width, len),
            modelMatrix: flatPanelModelMatrix(start, end, tree.origin, avgR),
        }));
    }

    const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.MaterialAppearance({
            material: createFlatBarkMaterial(),
            translucent: true,
        }),
        asynchronous: false,
    });

    viewer.scene.primitives.add(primitive);
    instanceCount += total;

    console.log(
        `[BARK] flatBarkPanels tree="${tree.name}"` +
        ` count=${total} (1trunk+${branchDefs.length}branches) batched=1primitive result=PASS`
    );
    return [primitive];
}

// ── LOD Gating ──

/**
 * Three-tier LOD gating:
 *   TREE   (< 200km): body cylinders visible
 *   BRANCH (< 50km, >= 5km): bark shells visible
 *   SHEET  (< 5km): flat bark panels visible, bark shells hidden
 *   GLOBE  (> 200km): everything hidden
 *
 * Body cylinders remain visible at all sub-TREE LODs (they are the structural core).
 * Bark shells and flat panels swap at the SHEET boundary — never both at once.
 */
export function setupLODGating(viewer, bodyPrims, barkPrims = [], sheetPrims = []) {
    let prevBody = null, prevBark = null, prevSheet = null;

    viewer.clock.onTick.addEventListener(() => {
        const alt = viewer.camera.positionCartographic.height;

        const showBody  = alt < LOD.TREE;
        const showBark  = alt < LOD.BRANCH && alt >= LOD.SHEET;
        const showSheet = alt < LOD.SHEET;

        if (showBody === prevBody && showBark === prevBark && showSheet === prevSheet) return;
        prevBody = showBody; prevBark = showBark; prevSheet = showSheet;

        for (const p of bodyPrims)  { if (p) p.show = showBody; }
        for (const p of barkPrims)  { if (p) p.show = showBark; }
        for (const p of sheetPrims) { if (p) p.show = showSheet; }
    });

    console.log(
        `[BARK] LOD gating: bodies <${LOD.TREE / 1000}km,` +
        ` bark ${LOD.SHEET / 1000}–${LOD.BRANCH / 1000}km,` +
        ` sheets <${LOD.SHEET / 1000}km`
    );
}

// ── BC1-f: Regression Gate ──

export function logRegressionGate(tree) {
    const bodyCount  = tree.bodyPrimitives.length;
    const barkCount  = tree.barkPrimitives.length;
    const sheetCount = tree.sheetPrimitives.length;
    const total = bodyCount + barkCount + sheetCount;

    const budgetOk = instanceCount <= BUDGETS.BRANCH;
    const status = budgetOk ? 'PASS' : 'FAIL';

    console.log(
        `[REGRESSION] tree="${tree.name}" primitives=${total}` +
        ` (body=${bodyCount} bark=${barkCount} sheet=${sheetCount})` +
        ` instanceCount=${instanceCount} budget=${BUDGETS.BRANCH} result=${status}`
    );

    if (!budgetOk) {
        console.error(
            `[REFUSAL] reason=REGRESSION_GATE_FAIL` +
            ` instanceCount=${instanceCount} exceeds budget=${BUDGETS.BRANCH}`
        );
    }
    return budgetOk;
}

export function getInstanceCount() { return instanceCount; }
export function resetInstanceCount(n = 0) { instanceCount = Math.max(0, n); }
export { LOD };
