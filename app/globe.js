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
    shouldAnimate: false,
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

// Freeze the simulation clock so Cesium's ICRF-to-Fixed transform is constant.
// Without this, shouldAnimate=true advances time, which rotates the globe in
// the inertial reference frame — creating unwanted spin in FPS/RTS modes.
// All intentional globe rotation is handled by our manual tick handler below.
viewer.clock.shouldAnimate = false;

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

// ── Load country boundaries as polylines (V93-proven approach) ──
// Polylines avoid triangulation artifacts on large countries (Russia, Canada)
// and anti-meridian crossing issues. arcType: NONE prevents great-circle distortion.
async function loadBoundaries() {
    const STROKE_COLOR = Cesium.Color.fromCssColorString('#2a6090').withAlpha(0.7);
    const t0 = performance.now();
    console.log('[GLOBE] Loading country boundaries...');

    try {
        const resp = await fetch('/data/boundaries/ne_50m_admin_0_countries.geojson');
        const fc = await resp.json();

        const isoIndex = new Map();
        let entityCount = 0;

        for (const feature of fc.features) {
            const iso = feature.properties?.ISO_A3 || feature.properties?.ADM0_A3;
            if (!iso || iso === '-99') continue;

            const rings = extractRings(feature.geometry);
            if (!rings.length) continue;

            if (!isoIndex.has(iso)) isoIndex.set(iso, []);

            for (const ring of rings) {
                const positions = ring
                    .filter(c => Array.isArray(c) && c.length >= 2 && isFinite(c[0]) && isFinite(c[1]))
                    .map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1], 0));

                if (positions.length < 3) continue;
                positions.push(positions[0]);

                const entity = viewer.entities.add({
                    polyline: {
                        positions,
                        width: 1.5,
                        material: STROKE_COLOR,
                        arcType: Cesium.ArcType.NONE,
                        clampToGround: false,
                    },
                    properties: { ISO_A3: iso, ADMIN: feature.properties?.ADMIN || iso },
                });
                isoIndex.get(iso).push(entity);
                entityCount++;
            }
        }

        const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
        console.log(`[GLOBE] Boundaries loaded: ${isoIndex.size} countries, ${entityCount} polyline entities in ${elapsed}s`);

        window.relayFlyToISO = (iso) => {
            const entities = isoIndex.get(iso?.toUpperCase());
            if (!entities) { console.warn(`ISO "${iso}" not found. Available:`, [...isoIndex.keys()].sort().join(', ')); return; }
            viewer.flyTo(entities, { duration: 1.5 });
        };
        window.relayHighlightISO = (iso, color) => {
            const entities = isoIndex.get(iso?.toUpperCase());
            if (!entities) { console.warn(`ISO "${iso}" not found`); return; }
            const c = Cesium.Color.fromCssColorString(color || '#ff4444').withAlpha(0.9);
            for (const e of entities) { if (e.polyline) e.polyline.material = c; }
        };

        window._relay.isoIndex = isoIndex;
    } catch (e) {
        console.warn('[GLOBE] Could not load boundaries:', e.message);
    }
}

function extractRings(geometry) {
    if (!geometry?.coordinates) return [];
    if (geometry.type === 'Polygon') {
        return geometry.coordinates;
    }
    if (geometry.type === 'MultiPolygon') {
        const rings = [];
        for (const poly of geometry.coordinates) {
            rings.push(...poly);
        }
        return rings;
    }
    return [];
}

loadBoundaries();

// ── Always-Spinning Globe ──
// Globe visibly rotates only in ORBIT mode with geostationary OFF.
// In FPS/RTS the user owns the camera — no external rotation applied.
// Speed fades with altitude (zero below 2M meters, full above 15M).
const ROTATION_FADE_START = 15_000_000;
const ROTATION_FADE_END   =  2_000_000;

viewer.clock.onTick.addEventListener(() => {
    const camCtrlRef = window._relay?.camCtrl;
    if (!camCtrlRef) return;

    // Single gate: only rotate when mode=ORBIT AND geostationary=OFF.
    // FPS/RTS/BRANCH/XSECT never rotate. Geostationary never rotates.
    if (!camCtrlRef.shouldApplyGlobeRotation()) return;

    const alt = viewer.camera.positionCartographic.height;
    if (alt <= ROTATION_FADE_END) return;

    const speed = camCtrlRef.getGlobeRotationSpeed();
    const t = Math.min(1, (alt - ROTATION_FADE_END) / (ROTATION_FADE_START - ROTATION_FADE_END));
    viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, speed * t);
});

viewer.scene.screenSpaceCameraController.enableInputs = true;

// Expose for future modules (must exist before async loadBoundaries completes)
window._relay = { viewer, globe, trees: [] };

// ── Unified Camera Controller (replaces fly-controls + wasd-fly) ──
import { initCameraController } from './controls/camera-controller.js';
const hudEl = document.getElementById('relay-hud');
const camCtrl = initCameraController(viewer, hudEl);

// ── First Tree ──
import { createTree, flyToTree } from './tree.js';
import { advanceSimTimeDays } from './models/filament.js';
import { runStressTest } from '../tests/stress-test.js';

const firstTree = createTree(viewer, {
    lon: 34.78, lat: 32.08,
    name: 'Relay HQ',
});
window._relay.trees.push(firstTree);

window.relayFlyToTree = () => {
    flyToTree(viewer, firstTree);
};

// ── Debug Time Controls ──
window.relayAdvanceDays = (n = 1) => {
    advanceSimTimeDays(n);
    for (const t of window._relay.trees) { if (t.rebuild) t.rebuild(); }
    console.log(`[RELAY] Sim time advanced by ${n} day(s). Ribbons rebuilt.`);
};

window.RELAY_FORCE_LOD = null;
window.relayForceLOD = (lod) => {
    window._relay.forceLOD = lod || undefined;
    window.RELAY_FORCE_LOD = lod || null;
    console.log(`[RELAY] Force LOD: ${lod || 'auto'}`);
};

window._relay.rerender = () => {
    for (const t of window._relay.trees) { if (t.rebuild) t.rebuild(); }
};

// ── Expose Camera Controller ──
window._relay.camCtrl = camCtrl;

// ── Stress Test ──
window.relayStressTest = (config) => runStressTest(viewer, config);

// ── Boot log ──
console.log('[RELAY] Globe initialized — Stage 0');
console.log('[RELAY] First tree planted. Type relayFlyToTree() to visit.');
console.log('[RELAY] Debug: relayAdvanceDays(n), relayForceLOD("BRANCH"), relayForceLOD() to reset');
console.log('[RELAY] Stress: relayStressTest({ branches: 50, filaments: 100, days: 30 })');
