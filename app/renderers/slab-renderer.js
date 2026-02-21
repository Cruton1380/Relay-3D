/**
 * Slab Renderer — SLAB-REVISION-1
 *
 * Renders timebox slabs as thin cross-section discs perpendicular to
 * the branch axis. Each disc is a flattened cylinder (ring) that acts
 * as a vertebra in the branch spine.
 *
 * Visual properties driven by slab data:
 *   thickness → disc height (thicker = more commits)
 *   warmth    → color (warm palette for high magnitude, cool for low)
 *   confidence → opacity (solid = well-evidenced, transparent = uncertain)
 *   firmness  → edge sharpness (firm = crisp, wilted = blurred outline)
 *
 * Master Plan refs: §3.6 (Timebox Slabs), §3.7 (Wilting), §33 (LOD)
 */

const SLAB_BUDGET = 500;
let slabInstanceCount = 0;

function warmthToColor(warmth) {
    const r = Math.round(80 + 175 * warmth);
    const g = Math.round(90 + 60 * (1 - warmth));
    const b = Math.round(180 * (1 - warmth));
    return new Cesium.Color(r / 255, g / 255, b / 255, 1.0);
}

function slabModelMatrix(branchStart, branchEnd, lMid, branchLength) {
    const axis = Cesium.Cartesian3.subtract(branchEnd, branchStart, new Cesium.Cartesian3());
    const axisNorm = Cesium.Cartesian3.normalize(axis, new Cesium.Cartesian3());
    const branchLen = Cesium.Cartesian3.magnitude(axis);

    const frac = Math.min(1.0, lMid / branchLength);
    const center = Cesium.Cartesian3.add(
        branchStart,
        Cesium.Cartesian3.multiplyByScalar(axisNorm, frac * branchLen, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
    );

    const up = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(center, new Cesium.Cartesian3());

    let x = Cesium.Cartesian3.cross(up, axisNorm, new Cesium.Cartesian3());
    if (Cesium.Cartesian3.magnitudeSquared(x) < 1e-12) {
        x = Cesium.Cartesian3.cross(Cesium.Cartesian3.UNIT_X, axisNorm, new Cesium.Cartesian3());
    }
    Cesium.Cartesian3.normalize(x, x);

    const y = Cesium.Cartesian3.cross(axisNorm, x, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(y, y);

    const rot = new Cesium.Matrix3(
        x.x, y.x, axisNorm.x,
        x.y, y.y, axisNorm.y,
        x.z, y.z, axisNorm.z,
    );

    return Cesium.Matrix4.fromRotationTranslation(rot, center);
}

/**
 * Render all timebox slabs for a branch as a batched Cesium Primitive.
 */
export function renderBranchSlabs(viewer, {
    slabs,
    branchStart,
    branchEnd,
    branchRadius,
    branchLength,
    branchLabel,
}) {
    const count = slabs.length;
    if (slabInstanceCount + count > SLAB_BUDGET) {
        console.error(
            `[REFUSAL] reason=PRIMITIVE_BUDGET_EXCEEDED kind=SLAB` +
            ` requested=${count} current=${slabInstanceCount} budget=${SLAB_BUDGET}`
        );
        return { primitive: null };
    }

    if (count === 0) return { primitive: null };

    const instances = [];

    for (const slab of slabs) {
        const discHeight = 2 + 8 * slab.thickness;
        const outerR = branchRadius * 1.15;
        const innerR = branchRadius * 0.3 * slab.firmness;

        const mm = slabModelMatrix(branchStart, branchEnd, slab.lMid, branchLength);

        const color = warmthToColor(slab.warmth);
        const alpha = 0.2 + 0.6 * slab.confidence;

        const wiltScale = 0.7 + 0.3 * slab.firmness;

        instances.push(new Cesium.GeometryInstance({
            geometry: new Cesium.CylinderGeometry({
                length: discHeight * wiltScale,
                topRadius: outerR * wiltScale,
                bottomRadius: outerR * wiltScale,
                slices: 16,
            }),
            modelMatrix: mm,
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                    color.withAlpha(alpha)
                ),
            },
        }));
    }

    const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance({
            flat: false,
            translucent: true,
        }),
        asynchronous: false,
    });

    viewer.scene.primitives.add(primitive);
    slabInstanceCount += count;

    console.log(
        `[SLAB] branch="${branchLabel}" slabs=${count}` +
        ` totalInstances=${slabInstanceCount} result=PASS`
    );

    return { primitive };
}

/**
 * Render droop zone indicators — translucent arcs below the branch axis
 * where adjacent slabs have wilted, showing emergent branch deformation (§3.7).
 */
export function renderDroopZones(viewer, {
    droopZones,
    branchStart,
    branchEnd,
    branchRadius,
    branchLength,
    branchLabel,
}) {
    const entities = [];
    const axis = Cesium.Cartesian3.subtract(branchEnd, branchStart, new Cesium.Cartesian3());
    const branchLen = Cesium.Cartesian3.magnitude(axis);
    const axisNorm = Cesium.Cartesian3.normalize(axis, new Cesium.Cartesian3());

    const down = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(
        Cesium.Cartesian3.midpoint(branchStart, branchEnd, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
    );
    Cesium.Cartesian3.negate(down, down);

    for (const zone of droopZones) {
        const steps = Math.max(3, zone.slabCount + 1);
        const positions = [];

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const lFrac = (zone.startL + t * (zone.endL - zone.startL)) / branchLength;

            const axisPoint = Cesium.Cartesian3.add(
                branchStart,
                Cesium.Cartesian3.multiplyByScalar(axisNorm, lFrac * branchLen, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
            );

            const droopAmount = zone.maxWilt * branchRadius * 2.0 *
                Math.sin(t * Math.PI);

            const drooped = Cesium.Cartesian3.add(
                axisPoint,
                Cesium.Cartesian3.multiplyByScalar(down, droopAmount, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
            );
            positions.push(drooped);
        }

        const alpha = 0.3 + 0.5 * zone.maxWilt;
        const entity = viewer.entities.add({
            polyline: {
                positions,
                width: 3 + 4 * zone.maxWilt,
                material: Cesium.Color.fromCssColorString('#8b4513').withAlpha(alpha),
                arcType: Cesium.ArcType.NONE,
            },
            properties: {
                relayType: 'droopZone',
                branchLabel,
                maxWilt: zone.maxWilt,
                slabCount: zone.slabCount,
            },
        });
        entities.push(entity);
    }

    if (droopZones.length > 0) {
        console.log(
            `[WILT] branch="${branchLabel}" droopZones=${droopZones.length}` +
            ` maxWilt=${Math.max(...droopZones.map(z => z.maxWilt)).toFixed(2)} result=PASS`
        );
    }

    return { entities };
}

export function getSlabInstanceCount() { return slabInstanceCount; }
export function resetSlabInstanceCount(n = 0) { slabInstanceCount = Math.max(0, n); }
