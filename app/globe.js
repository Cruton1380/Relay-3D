/**
 * Relay Globe — Stage 0
 *
 * A dark rotating Earth with real country boundaries.
 * This is the empty world waiting for its first tree.
 *
 * Cesium is loaded from CDN (no npm package).
 * Boundary GeoJSON lives in data/boundaries/.
 */

// ── Viewer ──
// No Ion token — we use local GeoJSON boundaries, no Cesium Ion assets.
// Globe imagery falls back to a single-color base (dark).
const viewer = new Cesium.Viewer('cesiumContainer', {
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    shouldAnimate: true,
    skyBox: false,
    skyAtmosphere: new Cesium.SkyAtmosphere(),
    imageryProvider: false,
    contextOptions: {
        webgl: { alpha: true },
    },
});

viewer.scene.backgroundColor = Cesium.Color.BLACK;
if (viewer.scene.sun) viewer.scene.sun.show = false;
if (viewer.scene.moon) viewer.scene.moon.show = false;

viewer.scene.skyAtmosphere.brightnessShift = -0.3;
viewer.scene.skyAtmosphere.saturationShift = -0.5;

viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();

const globe = viewer.scene.globe;
globe.baseColor = Cesium.Color.fromCssColorString('#0a0a0a');
globe.showGroundAtmosphere = true;
globe.enableLighting = false;

// ── Camera: start looking at Earth from space ──
viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(35.0, 31.5, 20_000_000),
    orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
    },
});

// ── Load country boundaries (single merged file) ──
async function loadBoundaries() {
    const BOUNDARY_COLOR = Cesium.Color.fromCssColorString('#1a3a5c').withAlpha(0.35);
    const BOUNDARY_STROKE = Cesium.Color.fromCssColorString('#2a6090').withAlpha(0.7);

    const t0 = performance.now();
    console.log('[GLOBE] Loading country boundaries...');

    try {
        const ds = await Cesium.GeoJsonDataSource.load(
            '/data/boundaries/all-countries.geojson',
            {
                stroke: BOUNDARY_STROKE,
                fill: BOUNDARY_COLOR,
                strokeWidth: 1.5,
                clampToGround: false,
            }
        );

        for (const entity of ds.entities.values) {
            if (entity.polygon) {
                entity.polygon.height = 0;
                entity.polygon.perPositionHeight = false;
            }
        }

        viewer.dataSources.add(ds);
        const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
        console.log(`[GLOBE] ${ds.entities.values.length} countries loaded in ${elapsed}s`);
    } catch (e) {
        console.warn('[GLOBE] Could not load boundaries:', e.message);
    }
}

loadBoundaries();

// ── Slow rotation ──
let rotating = true;
viewer.clock.onTick.addEventListener(() => {
    if (!rotating) return;
    viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.0001);
});

viewer.scene.screenSpaceCameraController.enableInputs = true;
const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
handler.setInputAction(() => { rotating = false; }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

// ── Boot log ──
console.log('[RELAY] Globe initialized — Stage 0');
console.log('[RELAY] Waiting for first tree...');

// Expose for future modules
window._relay = { viewer, globe };
