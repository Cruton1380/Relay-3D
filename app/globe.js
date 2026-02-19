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
        const resp = await fetch('/data/boundaries/ne_50m_admin_0_countries.geojson');
        const fc = await resp.json();
        const featureISOs = new Set(
            fc.features.map(f => f.properties?.ISO_A3 || f.properties?.ADM0_A3).filter(x => x && x !== '-99')
        );
        console.log(`[GLOBE] GeoJSON source: ${fc.features.length} features, ${featureISOs.size} unique countries`);

        const ds = await Cesium.GeoJsonDataSource.load(fc, {
            stroke: BOUNDARY_STROKE,
            fill: BOUNDARY_COLOR,
            strokeWidth: 1.5,
            clampToGround: false,
        });

        for (const entity of ds.entities.values) {
            if (entity.polygon) {
                entity.polygon.height = 0;
                entity.polygon.perPositionHeight = false;
            }
        }

        viewer.dataSources.add(ds);

        // Build ISO → entity[] index for dev tools and future modules
        const now = Cesium.JulianDate.now();
        const isoIndex = new Map();
        for (const entity of ds.entities.values) {
            const iso = entity.properties?.ISO_A3?.getValue?.(now)
                     || entity.properties?.ADM0_A3?.getValue?.(now);
            if (iso && iso !== '-99') {
                if (!isoIndex.has(iso)) isoIndex.set(iso, []);
                isoIndex.get(iso).push(entity);
            }
        }

        const missing = [...featureISOs].filter(iso => !isoIndex.has(iso));
        const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
        console.log(`[GLOBE] Cesium: ${ds.entities.values.length} entities, ${isoIndex.size} countries, ${missing.length} missing in ${elapsed}s`);
        if (missing.length) console.warn(`[GLOBE] Missing ISOs:`, missing);

        // Dev tools: fly to and highlight any country by ISO code
        window.relayFlyToISO = (iso) => {
            const entities = isoIndex.get(iso?.toUpperCase());
            if (!entities) { console.warn(`ISO "${iso}" not found. Available:`, [...isoIndex.keys()].sort().join(', ')); return; }
            userTookControl = true;
            viewer.flyTo(entities, { duration: 1.5 });
        };
        window.relayHighlightISO = (iso, color) => {
            const entities = isoIndex.get(iso?.toUpperCase());
            if (!entities) { console.warn(`ISO "${iso}" not found`); return; }
            const c = Cesium.Color.fromCssColorString(color || '#ff4444').withAlpha(0.6);
            for (const e of entities) { if (e.polygon) e.polygon.material = c; }
        };

        window._relay.isoIndex = isoIndex;
        window._relay.boundaryDataSource = ds;
    } catch (e) {
        console.warn('[GLOBE] Could not load boundaries:', e.message);
    }
}

loadBoundaries();

// ── Rotation with gravity lock ──
// From space: globe rotates slowly (overview).
// As user flies in: rotation fades to zero (gravity lock — you're "on" the planet).
// Click also stops rotation permanently (user took control).
const ROTATION_FADE_START = 15_000_000;  // meters — rotation begins fading
const ROTATION_FADE_END   =  2_000_000;  // meters — rotation fully stops
const ROTATION_SPEED      = 0.0001;      // radians per tick at max altitude
let userTookControl = false;

viewer.clock.onTick.addEventListener(() => {
    if (userTookControl) return;

    const alt = viewer.camera.positionCartographic.height;
    if (alt <= ROTATION_FADE_END) return;

    const t = Math.min(1, (alt - ROTATION_FADE_END) / (ROTATION_FADE_START - ROTATION_FADE_END));
    viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, ROTATION_SPEED * t);
});

viewer.scene.screenSpaceCameraController.enableInputs = true;
const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
handler.setInputAction(() => { userTookControl = true; }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

// ── Boot log ──
console.log('[RELAY] Globe initialized — Stage 0');
console.log('[RELAY] Waiting for first tree...');

// Expose for future modules
window._relay = { viewer, globe };
