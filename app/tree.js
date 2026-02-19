/**
 * Relay Tree — First Tree on the Globe
 *
 * A single trunk pinned to a lat/lon with branch cylinders.
 * This is Stage 0 → Stage 1: the first civilization node.
 *
 * Geometry follows Master Plan §2 (Trunk) and §3 (Branch):
 * - Trunk: vertical spine from globe surface
 * - Branches: cylinders extending outward from trunk at different heights
 * - Each branch = a category of work (invoices, reports, records, etc.)
 *
 * Coordinates are ENU (East-North-Up) relative to the tree's anchor point.
 */

const TREE_DEFAULTS = {
    trunkRadius: 80,
    trunkHeight: 2000,
    trunkColor: '#3a2a1a',
    branchRadius: 30,
    branchLength: 800,
};

export function createTree(viewer, options = {}) {
    const {
        lon = 34.78,          // Tel Aviv area — first anchor
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

    // ── Trunk ──
    const trunkBottom = Cesium.Matrix4.multiplyByPoint(
        enu, new Cesium.Cartesian3(0, 0, 0), new Cesium.Cartesian3()
    );
    const trunkTop = Cesium.Matrix4.multiplyByPoint(
        enu, new Cesium.Cartesian3(0, 0, cfg.trunkHeight), new Cesium.Cartesian3()
    );

    const trunkEntity = viewer.entities.add({
        name: `${name} — Trunk`,
        polyline: {
            positions: [trunkBottom, trunkTop],
            width: cfg.trunkRadius / 5,
            material: new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.15,
                color: Cesium.Color.fromCssColorString(cfg.trunkColor),
            }),
        },
        properties: { relayType: 'trunk', treeName: name },
    });

    // ── Branches ──
    const branchEntities = [];
    for (const b of branches) {
        const heightZ = cfg.trunkHeight * b.height;
        const rad = Cesium.Math.toRadians(b.angle);
        const dx = Math.cos(rad) * cfg.branchLength;
        const dy = Math.sin(rad) * cfg.branchLength;

        const branchStart = Cesium.Matrix4.multiplyByPoint(
            enu, new Cesium.Cartesian3(dx * 0.05, dy * 0.05, heightZ), new Cesium.Cartesian3()
        );
        const branchEnd = Cesium.Matrix4.multiplyByPoint(
            enu, new Cesium.Cartesian3(dx, dy, heightZ + cfg.branchLength * 0.15), new Cesium.Cartesian3()
        );

        const entity = viewer.entities.add({
            name: `${name} — ${b.label}`,
            polyline: {
                positions: [branchStart, branchEnd],
                width: cfg.branchRadius / 5,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.2,
                    color: Cesium.Color.fromCssColorString(b.color),
                }),
            },
            properties: {
                relayType: 'branch',
                treeName: name,
                branchLabel: b.label,
            },
        });
        branchEntities.push(entity);
    }

    // ── Tree anchor label ──
    const labelPos = Cesium.Matrix4.multiplyByPoint(
        enu, new Cesium.Cartesian3(0, 0, cfg.trunkHeight + 200), new Cesium.Cartesian3()
    );
    viewer.entities.add({
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

    const tree = {
        name,
        lon, lat,
        origin,
        enu,
        trunk: trunkEntity,
        branches: branchEntities,
        config: cfg,
    };

    console.log(`[TREE] "${name}" placed at ${lat.toFixed(2)}°N ${lon.toFixed(2)}°E — ${branches.length} branches`);
    return tree;
}

/**
 * Fly the camera to a tree, orbiting view.
 */
export function flyToTree(viewer, tree, options = {}) {
    const { duration = 2.0, altitude = 8000 } = options;
    const target = Cesium.Matrix4.multiplyByPoint(
        tree.enu,
        new Cesium.Cartesian3(0, 0, tree.config.trunkHeight * 0.5),
        new Cesium.Cartesian3()
    );
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
