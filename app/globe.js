/**
 * Relay Globe — Stage 0
 *
 * A dark rotating Earth with real country boundaries.
 * This is the empty world waiting for its first tree.
 *
 * Cesium is loaded from CDN (no npm package).
 * Boundary GeoJSON lives in data/boundaries/.
 */

// ── Cesium Ion token (free tier — terrain + imagery) ──
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5ZGE2ZDhjMS01OTk4LTRlZDMtYTUyOC05NGQyNWI2NTdhMDkiLCJpZCI6MjkwMTcxLCJpYXQiOjE3NDAwMDcwNTR9.aqBRSmjC3mJHqq8fNiSaQ_LBH08e0E6t_uoYpY4eNMg';

// ── Viewer ──
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
    shadows: false,
    shouldAnimate: true,
    skyBox: false,
    skyAtmosphere: new Cesium.SkyAtmosphere(),
    contextOptions: {
        webgl: { alpha: true },
    },
});

// Black sky, no stars
viewer.scene.backgroundColor = Cesium.Color.BLACK;
viewer.scene.sun.show = false;
viewer.scene.moon.show = false;

// Subtle atmosphere glow
viewer.scene.skyAtmosphere.brightnessShift = -0.3;
viewer.scene.skyAtmosphere.saturationShift = -0.5;

// Globe settings
const globe = viewer.scene.globe;
globe.baseColor = Cesium.Color.fromCssColorString('#0a0a0a');
globe.showGroundAtmosphere = true;
globe.enableLighting = true;

// ── Camera: start looking at Earth from space ──
viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(35.0, 31.5, 20_000_000),
    orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
    },
});

// ── Load country boundaries ──
async function loadBoundaries() {
    const BOUNDARY_COLOR = Cesium.Color.fromCssColorString('#1a3a5c').withAlpha(0.4);
    const BOUNDARY_STROKE = Cesium.Color.fromCssColorString('#2a6090').withAlpha(0.6);

    try {
        const resp = await fetch('/data/boundaries/countries/');
        const html = await resp.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = [...doc.querySelectorAll('a')];
        const geojsonFiles = links
            .map(a => a.textContent.trim())
            .filter(name => name.endsWith('.geojson'));

        console.log(`[GLOBE] Found ${geojsonFiles.length} country boundary files`);

        for (const file of geojsonFiles) {
            try {
                const ds = await Cesium.GeoJsonDataSource.load(
                    `/data/boundaries/countries/${file}`,
                    {
                        stroke: BOUNDARY_STROKE,
                        fill: BOUNDARY_COLOR,
                        strokeWidth: 1,
                        clampToGround: true,
                    }
                );
                viewer.dataSources.add(ds);
            } catch (e) {
                console.warn(`[GLOBE] Failed to load ${file}:`, e.message);
            }
        }

        console.log(`[GLOBE] Country boundaries loaded`);
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
