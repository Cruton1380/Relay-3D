/**
 * Relay Unified Camera Controller — Frozen Contracts #134-135 (§50)
 *
 * Modes: ORBIT (Cesium SSCC) | FPS (6DOF manual) | RTS (overhead pan) | BRANCH/XSECT (stub)
 * All keybinds are rebindable via DEFAULT_BINDS. See §50.2 in master plan for full table.
 * Globe always rotates; H toggles geostationary lock. FPS permits unlimited underground depth.
 * No auto-correction of orientation. Panel lock is the only flight-key suppression context.
 */

// ── Mode Enum ──
const MODE = {
    ORBIT:  'ORBIT',
    FPS:    'FPS',
    RTS:    'RTS',
    BRANCH: 'BRANCH',
    XSECT:  'XSECT',
};

const CYCLE_MODES = [MODE.ORBIT, MODE.FPS, MODE.RTS];

// ── Basin Altitude Bands ──
const BASINS = [
    { name: 'SPACE',     floor: 10_000_000, ceiling: Infinity },
    { name: 'ORBITAL',   floor:  2_000_000, ceiling: 10_000_000 },
    { name: 'REGIONAL',  floor:    200_000, ceiling:  2_000_000 },
    { name: 'TREE',      floor:     50_000, ceiling:    200_000 },
    { name: 'BRANCH',    floor:      5_000, ceiling:     50_000 },
    { name: 'BARK',      floor:        500, ceiling:      5_000 },
    { name: 'CELL',      floor:          0, ceiling:        500 },
];

// ── Speed Tables ──
const FPS_BASE_SPEED = 5;
const FPS_BOOST_MULT = 5;
const FPS_SPEED_MIN  = 0.25;   // scroll-wheel minimum multiplier
const FPS_SPEED_MAX  = 20;     // scroll-wheel maximum multiplier
const FPS_SPEED_STEP = 1.25;   // each scroll notch scales by this factor
const RTS_PAN_SPEED  = 800;
const RTS_BOOST_MULT = 5;
const RTS_EDGE_ZONE  = 40;         // pixels from screen edge
const RTS_EDGE_SPEED = 600;
const MIN_ALTITUDE   = 50;         // surface floor for ORBIT/RTS only
const MOUSE_SENSITIVITY = 0.001;

// ── Rebindable Keybinds ──
// All actions reference this map. Users can rebind any key or set to null to disable.
const DEFAULT_BINDS = {
    forward:    'w',
    backward:   's',
    strafeLeft: 'a',
    strafeRight:'d',
    ascend:     ' ',
    descend:    'c',
    rollLeft:   'q',
    rollRight:  'e',
    boost:      'shift',
    cycleMode:  'tab',
    exitOrbit:  'escape',
    flyToTree:  'f',
    geoToggle:  'h',
    posBack:    '`',
};

let keyBinds = { ...DEFAULT_BINDS };

function loadBindings() {
    try {
        const saved = localStorage.getItem('relay-keybinds');
        if (saved) keyBinds = { ...DEFAULT_BINDS, ...JSON.parse(saved) };
    } catch (_) { /* use defaults */ }
}

function saveBindings() {
    try { localStorage.setItem('relay-keybinds', JSON.stringify(keyBinds)); } catch (_) {}
}

export function rebindKey(action, key) {
    if (!(action in DEFAULT_BINDS)) return false;
    keyBinds[action] = key;
    saveBindings();
    return true;
}

export function resetBindings() {
    keyBinds = { ...DEFAULT_BINDS };
    saveBindings();
}

export function getBindings() { return { ...keyBinds }; }

function bound(action) { return keyBinds[action]; }
function actionHeld(action) { return keyBinds[action] && keys[keyBinds[action]]; }

// Basin crossing resistance
const BASIN_RESIST_DURATION = 400; // ms of dampening effect
const BASIN_RESIST_FACTOR   = 0.15; // speed multiplier during crossing

// Roll acceleration for Q/E — starts slow, ramps up while held
const ROLL_SPEED_MIN  = 0.005;  // radians/tick at start
const ROLL_SPEED_MAX  = 0.06;   // radians/tick at full ramp
const ROLL_ACCEL      = 0.003;  // added per tick while held
let rollVelocity      = 0;      // current roll speed (decays to 0 on release)

// Position stack
const MAX_STACK_SIZE = 50;

// Globe rotation
const GLOBE_ROTATION_SPEED = 0.0001; // radians per tick at max altitude
const GEO_AUTO_LOCK_ALT    = 2_000_000; // below this, auto-suggest geo lock

// ── State ──
let currentMode = MODE.ORBIT;
let previousMode = null;
let pointerLocked = false;
let changingMode = false;       // guard against re-entrant setMode
let weExitedPointerLock = false; // true when WE triggered exitPointerLock (not user Esc)
let viewer = null;
let canvas = null;
let hudEl = null;

const keys = {};
const mouse = { x: 0, y: 0, dx: 0, dy: 0 };

// FPS flight speed multiplier (scroll wheel adjusts)
let fpsSpeedMult = 1.0;

// Basin resistance state
let currentBasin = null;
let basinResistUntil = 0;

// Geostationary state: when true, camera co-rotates with globe
let geostationary = true;

// Favorites: slots 0-9 → camera state
const favorites = new Array(10).fill(null);

// Position stack
const positionStack = [];

// Suggestion toast state
let suggestionTimer = null;
let lastSuggestionMode = null;

// Last-known-good camera state — NaN recovery
let lastGoodCamera = null;

function cacheGoodCamera() {
    const c = viewer.camera;
    const carto = c.positionCartographic;
    if (!carto || !Number.isFinite(carto.height)) return;
    if (!Number.isFinite(c.heading) || !Number.isFinite(c.pitch)) return;
    lastGoodCamera = {
        pos: Cesium.Cartesian3.clone(c.positionWC),
        heading: c.heading,
        pitch: c.pitch,
        roll: c.roll,
    };
}

function restoreGoodCamera() {
    if (!lastGoodCamera) return;
    viewer.camera.setView({
        destination: lastGoodCamera.pos,
        orientation: {
            heading: lastGoodCamera.heading,
            pitch: lastGoodCamera.pitch,
            roll: lastGoodCamera.roll,
        },
    });
    console.warn('[CAMERA] Restored last good camera (NaN recovery)');
}

// Tab debounce — prevents rapid-fire mode cycling when held
let lastTabTime = 0;
const TAB_DEBOUNCE_MS = 300;

// ── Public API ──

export function initCameraController(v, hud) {
    viewer = v;
    canvas = viewer.canvas;
    hudEl = hud;

    canvas.setAttribute('tabindex', '0');
    canvas.focus();

    // Permanently disable Cesium inertia — camera must behave like gravity
    const sscc = viewer.scene.screenSpaceCameraController;
    sscc.inertiaSpin = 0;
    sscc.inertiaTranslate = 0;
    sscc.inertiaZoom = 0;

    currentBasin = getBasin(viewer.camera.positionCartographic.height);
    loadBindings();

    bindKeys();
    bindMouse();
    bindTick();

    // Globe visibility gate — MUST hide globe before Cesium tile math runs.
    // If the camera is underground OR in any invalid state, globe.show=false
    // prevents the createPotentiallyVisibleSet RangeError crash.
    let wasUnderground = false;
    viewer.scene.preUpdate.addEventListener(() => {
        const g = viewer.scene.globe;
        let alt, underground;
        try {
            alt = viewer.camera.positionCartographic.height;
            underground = (currentMode === MODE.FPS && Number.isFinite(alt) && alt < 0);
        } catch (_) {
            // positionCartographic failed — camera in bad state
            g.show = false;
            restoreGoodCamera();
            return;
        }

        // NaN altitude — hide globe immediately, restore camera
        if (!Number.isFinite(alt)) {
            g.show = false;
            restoreGoodCamera();
            return;
        }

        if (underground) {
            g.show = false;
            const depthKm = Math.abs(alt) / 1000;
            const r = Math.min(0.12, 0.03 + depthKm * 0.003);
            const gb = Math.max(0, 0.02 - depthKm * 0.001);
            viewer.scene.backgroundColor = new Cesium.Color(r, gb, gb, 1);
        } else {
            g.show = true;
            viewer.scene.backgroundColor = Cesium.Color.BLACK;
        }

        if (underground !== wasUnderground) {
            wasUnderground = underground;
            if (hudEl) {
                const ugEl = hudEl.querySelector('.relay-hud-underground');
                const dlEl = hudEl.querySelector('.relay-hud-depth-label');
                if (ugEl) ugEl.classList.toggle('active', underground);
                if (dlEl) dlEl.classList.toggle('active', underground);
            }
        }
        if (underground && hudEl) {
            const dlEl = hudEl.querySelector('.relay-hud-depth-label');
            if (dlEl) dlEl.textContent = depthLabelText(alt);
        }
    });

    setMode(MODE.ORBIT);
    updateHUD();

    console.log('[CAMERA] Unified controller active. Tab=cycle modes, H=geo lock, G=level, `=back');
    return { getMode, setMode, flyToPosition, isGeostationary, setGeostationary, getGlobeRotationSpeed, shouldApplyGlobeRotation, rebindKey, resetBindings, getBindings };
}

// ── Globe Rotation (called by globe.js tick) ──

export function isGeostationary() { return geostationary; }
export function setGeostationary(val) { geostationary = val; }
export function getGlobeRotationSpeed() { return GLOBE_ROTATION_SPEED; }
export function shouldApplyGlobeRotation() {
    return currentMode === 'ORBIT' && !geostationary;
}

// ── Mode Management ──

function getMode() { return currentMode; }

function setMode(mode) {
    if (mode === currentMode) return;
    if (changingMode) return;  // prevent re-entrant calls from async events

    changingMode = true;
    exitMode(currentMode);
    previousMode = currentMode;
    currentMode = mode;
    enterMode(mode);
    changingMode = false;

    updateHUD();
    console.log(`[CAMERA] Mode: ${mode}`);
}

function cycleMode() {
    const idx = CYCLE_MODES.indexOf(currentMode);
    const next = CYCLE_MODES[(idx + 1) % CYCLE_MODES.length];
    setMode(next);
}

function exitMode(mode) {
    if (mode === MODE.FPS && pointerLocked) {
        weExitedPointerLock = true;
        document.exitPointerLock();
    }
    if (mode === MODE.RTS) {
        viewer.scene.screenSpaceCameraController.enableInputs = true;
    }
}

function enterMode(mode) {
    const sscc = viewer.scene.screenSpaceCameraController;

    if (mode === MODE.ORBIT) {
        sscc.enableInputs = true;
        sscc.enableRotate = true;
        sscc.enableTranslate = true;
        sscc.enableZoom = true;
        sscc.enableTilt = true;
        sscc.enableLook = true;
    }
    if (mode === MODE.FPS) {
        sscc.enableInputs = false;
        sscc.enableRotate = false;
        sscc.enableTranslate = false;
        sscc.enableZoom = false;
        sscc.enableTilt = false;
        sscc.enableLook = false;
        geostationary = true;
        viewer.camera.cancelFlight();
        showSuggestion('Click to lock mouse for mouselook · Right-drag to look', 3000);
    }
    if (mode === MODE.RTS) {
        sscc.enableInputs = false;
        sscc.enableRotate = false;
        sscc.enableTranslate = false;
        sscc.enableZoom = false;
        sscc.enableTilt = false;
        sscc.enableLook = false;
        viewer.camera.cancelFlight();
        snapToTopDown();
    }
}

function snapToTopDown() {
    const camera = viewer.camera;
    const carto = camera.positionCartographic;
    const alt = Math.max(carto.height, 50_000);
    camera.setView({
        destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, alt),
        orientation: {
            heading: camera.heading,
            pitch: Cesium.Math.toRadians(-90),
            roll: 0,
        },
    });
}

// ── Basin Detection ──

function getBasin(alt) {
    for (const b of BASINS) {
        if (alt >= b.floor && alt < b.ceiling) return b;
    }
    return BASINS[0];
}

function checkBasinCrossing(alt) {
    const newBasin = getBasin(alt);
    if (newBasin !== currentBasin) {
        currentBasin = newBasin;
        basinResistUntil = performance.now() + BASIN_RESIST_DURATION;
        showSuggestion(`Entering ${newBasin.name} basin`, 2000);
        pulseVignette();
        updateHUD();
    }
}

function pulseVignette() {
    if (!hudEl) return;
    const vig = hudEl.querySelector('.relay-hud-vignette');
    if (!vig) return;
    vig.classList.add('active');
    setTimeout(() => vig.classList.remove('active'), BASIN_RESIST_DURATION);
}

function getBasinSpeedMultiplier() {
    if (performance.now() < basinResistUntil) {
        return BASIN_RESIST_FACTOR + (1 - BASIN_RESIST_FACTOR) *
            (1 - (basinResistUntil - performance.now()) / BASIN_RESIST_DURATION);
    }
    return 1.0;
}

// ── Underground Depth Label (single source of truth) ──

const DEPTH_LAYERS = [
    [   100, 'TOPSOIL'],
    [   500, 'BEDROCK'],
    [  2000, 'SHALLOW CRUST'],
    [ 10000, 'UPPER CRUST'],
    [ 35000, 'LOWER CRUST'],
    [100000, 'UPPER MANTLE'],
];

function depthLabelText(alt) {
    const depth = Math.abs(alt);
    const layer = (DEPTH_LAYERS.find(([ceil]) => depth < ceil) || [])[1] || 'DEEP MANTLE';
    const dStr = depth > 1000 ? `${(depth / 1000).toFixed(1)} km` : `${depth.toFixed(0)} m`;
    return `${layer}  ·  ${dStr} DEEP`;
}

// ── Input Binding ──

function bindKeys() {
    const MOVE_KEYS = new Set([
        keyBinds.forward, keyBinds.backward, keyBinds.strafeLeft, keyBinds.strafeRight,
        keyBinds.rollLeft, keyBinds.rollRight, keyBinds.ascend, keyBinds.descend,
    ]);

    document.addEventListener('keydown', (e) => {
        // Don't capture keys when typing in search bar
        if (e.target.classList?.contains('relay-hud-search')) return;

        const k = e.key.toLowerCase();

        // Tab cycles modes (debounced)
        if (k === keyBinds.cycleMode) {
            e.preventDefault();
            const now = performance.now();
            if (now - lastTabTime < TAB_DEBOUNCE_MS) return;
            lastTabTime = now;
            cycleMode();
            return;
        }

        // Esc exits to ORBIT
        if (k === keyBinds.exitOrbit || e.key === 'Escape') {
            if (pointerLocked) document.exitPointerLock();
            if (currentMode !== MODE.ORBIT) setMode(MODE.ORBIT);
            return;
        }

        // Position stack pop
        if (k === keyBinds.posBack) {
            e.preventDefault();
            popPosition();
            return;
        }

        // Ctrl+digit = favorites
        if (e.ctrlKey && e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            const slot = parseInt(e.key);
            if (e.shiftKey) {
                recallFavorite(slot);
            } else {
                saveFavorite(slot);
            }
            return;
        }

        // Fly to tree
        if (k === keyBinds.flyToTree && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            flyToNearestTree();
            return;
        }

        // Geostationary toggle
        if (k === keyBinds.geoToggle && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            geostationary = !geostationary;
            showSuggestion(geostationary ? 'Geostationary ON — locked to surface' : 'Geostationary OFF — globe spins beneath you', 2500);
            updateHUD();
            console.log(`[CAMERA] Geostationary: ${geostationary}`);
            return;
        }

        keys[k] = true;
        if (e.key === 'Shift') keys['shift'] = true;

        if (MOVE_KEYS.has(k) && (currentMode === MODE.FPS || currentMode === MODE.RTS)) {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        keys[k] = false;
        if (e.key === 'Shift') keys['shift'] = false;
    });
}

function bindMouse() {
    document.addEventListener('pointerlockchange', () => {
        pointerLocked = document.pointerLockElement === canvas;
        if (pointerLocked) {
            console.log('[CAMERA] Pointer locked — mouselook active');
        } else if (weExitedPointerLock) {
            weExitedPointerLock = false;
        } else if (currentMode === MODE.FPS) {
            // Pointer lock lost (Esc / browser release) — stay in FPS, prompt re-lock.
            // NO auto-mode switch. User must press Esc explicitly to leave FPS.
            showSuggestion('Click to re-lock mouse · Esc to exit FPS', 3000);
        }
    });

    // Mouse movement for FPS look + RTS edge/rotate
    let mouseMoveTimer = null;
    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse._recentMove = true;
        clearTimeout(mouseMoveTimer);
        mouseMoveTimer = setTimeout(() => { mouse._recentMove = false; }, 200);

        if (pointerLocked && currentMode === MODE.FPS) {
            const camera = viewer.camera;
            camera.lookRight(e.movementX * MOUSE_SENSITIVITY);
            camera.lookDown(e.movementY * MOUSE_SENSITIVITY);
        }

        // FPS fallback: right-click drag rotates when pointer lock not active
        if (!pointerLocked && currentMode === MODE.FPS && keys['_rightDrag']) {
            viewer.camera.lookRight(e.movementX * MOUSE_SENSITIVITY);
            viewer.camera.lookDown(e.movementY * MOUSE_SENSITIVITY);
        }

        // RTS middle-click rotate: use movementX directly
        if (currentMode === MODE.RTS && keys['_middleDrag']) {
            viewer.camera.lookRight(e.movementX * 0.003);
        }
    });

    // Block ALL pointer events from reaching Cesium in FPS/RTS modes.
    // Without this, Cesium's ScreenSpaceEventHandler still processes
    // pointer events even with enableInputs=false, causing orbit drag
    // and setPointerCapture errors.
    for (const evtName of ['pointerdown', 'pointerup', 'pointermove']) {
        canvas.addEventListener(evtName, (e) => {
            if (currentMode === MODE.FPS || currentMode === MODE.RTS) {
                e.stopImmediatePropagation();
            }
        }, true);
    }

    // Click to lock mouse in FPS, or suggest FPS from ORBIT
    canvas.addEventListener('click', (e) => {
        if (currentMode === MODE.ORBIT) {
            if (!pointerLocked) {
                showSuggestion('Press Tab for FPS flight', 2500);
            }
        }
        if (currentMode === MODE.FPS && !pointerLocked) {
            const p = canvas.requestPointerLock();
            if (p && p.catch) p.catch(() => {});
        }
    });

    // Middle click rotate in RTS + right-click drag in FPS (fallback look)
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 1 && currentMode === MODE.RTS) {
            e.preventDefault();
            keys['_middleDrag'] = true;
        }
        if (e.button === 2 && currentMode === MODE.FPS && !pointerLocked) {
            keys['_rightDrag'] = true;
        }
    });
    document.addEventListener('mouseup', (e) => {
        if (e.button === 1) keys['_middleDrag'] = false;
        if (e.button === 2) keys['_rightDrag'] = false;
    });

    canvas.addEventListener('wheel', (e) => {
        if (currentMode === MODE.FPS) {
            // Scroll adjusts flight speed multiplier
            e.preventDefault();
            if (e.deltaY < 0) {
                fpsSpeedMult = Math.min(FPS_SPEED_MAX, fpsSpeedMult * FPS_SPEED_STEP);
            } else {
                fpsSpeedMult = Math.max(FPS_SPEED_MIN, fpsSpeedMult / FPS_SPEED_STEP);
            }
            showSuggestion(`Flight speed: ${fpsSpeedMult.toFixed(2)}×`, 1200);
        } else if (currentMode === MODE.RTS) {
            e.preventDefault();
            const camera = viewer.camera;
            const carto = camera.positionCartographic;
            const zoomFactor = e.deltaY > 0 ? 1.15 : 0.87;
            const newAlt = Math.max(MIN_ALTITUDE, carto.height * zoomFactor);
            camera.setView({
                destination: Cesium.Cartesian3.fromRadians(
                    carto.longitude, carto.latitude, newAlt
                ),
                orientation: {
                    heading: camera.heading,
                    pitch: Cesium.Math.toRadians(-90),
                    roll: 0,
                },
            });
        }
    }, { passive: false });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

// ── Tick Loop ──

function bindTick() {
    viewer.clock.onTick.addEventListener(() => {
        try {
            tickMain();
        } catch (err) {
            // Any crash in the tick → hide globe and restore camera
            viewer.scene.globe.show = false;
            restoreGoodCamera();
            console.warn('[CAMERA] Tick error caught, restored camera:', err.message);
        }
    });
}

function tickMain() {
    const camera = viewer.camera;
    let alt;
    try {
        alt = camera.positionCartographic.height;
    } catch (_) {
        restoreGoodCamera();
        return;
    }

    if (!Number.isFinite(alt)) {
        restoreGoodCamera();
        return;
    }

    if (viewer.clock.shouldAnimate) viewer.clock.shouldAnimate = false;

    // Re-enforce SSCC disable in FPS/RTS
    if (currentMode === MODE.FPS || currentMode === MODE.RTS) {
        const sscc = viewer.scene.screenSpaceCameraController;
        if (sscc.enableInputs || sscc.enableRotate) {
            sscc.enableInputs = false;
            sscc.enableRotate = false;
            sscc.enableTranslate = false;
            sscc.enableZoom = false;
            sscc.enableTilt = false;
            sscc.enableLook = false;
        }
    }

    // Altitude floor: ORBIT/RTS only. FPS has NO floor — full underground access.
    // Barriers are future stage-gate / proximity-lock features, not camera limits.
    if (currentMode !== MODE.FPS && alt < MIN_ALTITUDE) {
        const carto = camera.positionCartographic;
        if (Number.isFinite(carto.longitude) && Number.isFinite(carto.latitude)) {
            camera.setView({
                destination: Cesium.Cartesian3.fromRadians(
                    carto.longitude, carto.latitude, MIN_ALTITUDE
                ),
                orientation: {
                    heading: camera.heading, pitch: camera.pitch, roll: camera.roll,
                },
            });
        } else {
            restoreGoodCamera();
        }
        return;
    }

    checkBasinCrossing(alt);

    if (currentMode === MODE.FPS)  tickFPS(camera, alt);
    if (currentMode === MODE.RTS)  tickRTS(camera, alt);

    // Q/E roll — smooth acceleration ramp (starts slow, builds while held)
    if (currentMode === MODE.FPS) {
        const rolling = actionHeld('rollLeft') || actionHeld('rollRight');
        if (rolling) {
            rollVelocity = Math.min(ROLL_SPEED_MAX, rollVelocity + ROLL_ACCEL);
            const dir = actionHeld('rollLeft') ? 1 : -1;
            camera.look(camera.direction, rollVelocity * dir);
        } else {
            rollVelocity = 0;
        }
    }

    autoSuggest(alt);
    cacheGoodCamera();
}

// ── FPS Tick ──

function tickFPS(camera, alt) {
    const fwd  = actionHeld('forward');
    const back = actionHeld('backward');
    const sl   = actionHeld('strafeLeft');
    const sr   = actionHeld('strafeRight');
    const up   = actionHeld('ascend');
    const dn   = actionHeld('descend');
    if (!fwd && !back && !sl && !sr && !up && !dn) return;

    const speedScale = Math.max(0.5, Math.sqrt(Math.abs(alt) / 100));
    const boost = actionHeld('boost') ? FPS_BOOST_MULT : 1;
    const basin = getBasinSpeedMultiplier();
    const moveRate = FPS_BASE_SPEED * speedScale * boost * basin * fpsSpeedMult;

    if (!Number.isFinite(moveRate) || moveRate <= 0) return;

    if (fwd)  camera.moveForward(moveRate);
    if (back) camera.moveBackward(moveRate);
    if (sl)   camera.moveLeft(moveRate);
    if (sr)   camera.moveRight(moveRate);
    if (up)   camera.moveUp(moveRate);
    if (dn)   camera.moveDown(moveRate);
}

// ── RTS Tick ──

function tickRTS(camera, alt) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const boost = keys['shift'] ? RTS_BOOST_MULT : 1;
    const basin = getBasinSpeedMultiplier();

    const altScale = Math.max(0.01, Math.min(500, Math.abs(alt) / 5000));
    const baseMove = RTS_PAN_SPEED * altScale * (1 / 60) * boost * basin;
    const edgeMove = RTS_EDGE_SPEED * altScale * (1 / 60) * boost * basin;
    if (!Number.isFinite(baseMove)) return;

    let dx = 0, dy = 0;

    // WASD pan
    if (keys['w']) dy += baseMove;
    if (keys['s']) dy -= baseMove;
    if (keys['a']) dx -= baseMove;
    if (keys['d']) dx += baseMove;

    // Edge scrolling
    if (mouse.x <= RTS_EDGE_ZONE)          dx -= edgeMove * (1 - mouse.x / RTS_EDGE_ZONE);
    if (mouse.x >= w - RTS_EDGE_ZONE)      dx += edgeMove * (1 - (w - mouse.x) / RTS_EDGE_ZONE);
    if (mouse.y <= RTS_EDGE_ZONE)          dy += edgeMove * (1 - mouse.y / RTS_EDGE_ZONE);
    if (mouse.y >= h - RTS_EDGE_ZONE)      dy -= edgeMove * (1 - (h - mouse.y) / RTS_EDGE_ZONE);

    if (dx !== 0 || dy !== 0) {
        camera.moveRight(dx);
        camera.moveForward(dy);
    }

    // Middle-click rotate handled in mousemove (uses movementX directly)

    // Space/C = zoom in/out in RTS
    const zoomKey = keys[' '] ? 0.97 : keys['c'] ? 1.03 : 0;
    if (zoomKey) {
        const carto = camera.positionCartographic;
        const newAlt = Math.max(MIN_ALTITUDE, carto.height * zoomKey);
        camera.setView({
            destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, newAlt),
            orientation: { heading: camera.heading, pitch: Cesium.Math.toRadians(-90), roll: 0 },
        });
    }
}

// ── Auto-Suggest ──

function autoSuggest(alt) {
    if (currentMode === MODE.ORBIT && alt < 200_000 && lastSuggestionMode !== 'FPS_LOW') {
        lastSuggestionMode = 'FPS_LOW';
        showSuggestion('Tab → FPS for flight inspection', 3000);
    }
    if (currentMode === MODE.FPS && alt > 500_000 && lastSuggestionMode !== 'RTS_HIGH') {
        lastSuggestionMode = 'RTS_HIGH';
        showSuggestion('Tab → RTS for overhead view', 3000);
    }
    if (currentMode === MODE.RTS && alt < 10_000 && lastSuggestionMode !== 'FPS_CLOSE') {
        lastSuggestionMode = 'FPS_CLOSE';
        showSuggestion('Tab → FPS to fly through branches', 3000);
    }
    // Suggest geo lock when descending into atmosphere
    if (!geostationary && alt < GEO_AUTO_LOCK_ALT && lastSuggestionMode !== 'GEO_LOCK') {
        lastSuggestionMode = 'GEO_LOCK';
        showSuggestion('H → lock to surface (geostationary)', 3000);
    }
    // Suggest geo unlock when ascending to space
    if (geostationary && alt > 10_000_000 && lastSuggestionMode !== 'GEO_UNLOCK') {
        lastSuggestionMode = 'GEO_UNLOCK';
        showSuggestion('H → unlock to watch globe spin', 3000);
    }
}

// ── Favorites ──

function saveFavorite(slot) {
    const camera = viewer.camera;
    const carto = camera.positionCartographic;
    favorites[slot] = {
        lon: Cesium.Math.toDegrees(carto.longitude),
        lat: Cesium.Math.toDegrees(carto.latitude),
        alt: carto.height,
        heading: camera.heading,
        pitch: camera.pitch,
        roll: camera.roll,
        mode: currentMode,
    };
    showSuggestion(`Saved favorite ${slot} (Ctrl+Shift+${slot} to recall)`, 2000);
    console.log(`[CAMERA] Favorite ${slot} saved`);
}

function recallFavorite(slot) {
    const fav = favorites[slot];
    if (!fav) {
        showSuggestion(`Favorite ${slot} is empty (Ctrl+${slot} to save)`, 2000);
        return;
    }
    pushPosition();
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(fav.lon, fav.lat, fav.alt),
        orientation: { heading: fav.heading, pitch: fav.pitch, roll: fav.roll },
        duration: 1.0,
    });
    if (fav.mode && fav.mode !== currentMode) {
        setTimeout(() => setMode(fav.mode), 1100);
    }
    console.log(`[CAMERA] Recalled favorite ${slot}`);
}

// ── Position Stack ──

function pushPosition() {
    const camera = viewer.camera;
    const carto = camera.positionCartographic;
    positionStack.push({
        lon: Cesium.Math.toDegrees(carto.longitude),
        lat: Cesium.Math.toDegrees(carto.latitude),
        alt: carto.height,
        heading: camera.heading,
        pitch: camera.pitch,
        roll: camera.roll,
    });
    if (positionStack.length > MAX_STACK_SIZE) positionStack.shift();
}

function popPosition() {
    if (!positionStack.length) {
        showSuggestion('Position stack empty', 1500);
        return;
    }
    const pos = positionStack.pop();
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt),
        orientation: { heading: pos.heading, pitch: pos.pitch, roll: pos.roll },
        duration: 0.8,
    });
    console.log(`[CAMERA] Stack pop — ${positionStack.length} remaining`);
}

// ── Fly To Helpers ──

function flyToNearestTree() {
    if (!window._relay?.trees?.length) {
        showSuggestion('No trees planted yet', 2000);
        return;
    }
    pushPosition();
    const tree = window._relay.trees[0];
    if (tree.flyTo) {
        tree.flyTo(viewer);
    } else {
        import('../tree.js').then(m => m.flyToTree(viewer, tree));
    }
    showSuggestion('Flying to tree — Tab for FPS when close', 2500);
}

function flyToPosition(lon, lat, alt, duration = 1.5) {
    pushPosition();
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
        duration,
    });
}

// ── HUD ──

function updateHUD() {
    if (!hudEl) return;

    const alt = viewer.camera.positionCartographic.height;
    let altStr;
    if (!Number.isFinite(alt)) {
        altStr = '—';
    } else if (alt < 0) {
        const d = Math.abs(alt);
        altStr = d > 1000 ? `-${(d / 1000).toFixed(1)} km` : `-${d.toFixed(0)} m`;
    } else if (alt > 1_000_000) {
        altStr = `${(alt / 1_000_000).toFixed(1)}M m`;
    } else if (alt > 1000) {
        altStr = `${(alt / 1000).toFixed(1)} km`;
    } else {
        altStr = `${alt.toFixed(0)} m`;
    }

    const basin = currentBasin?.name || '—';
    const geoTag = geostationary ? 'GEO' : 'FREE';

    const modeEl = hudEl.querySelector('.relay-hud-mode');
    modeEl.textContent = `${currentMode}  ·  ${geoTag}`;
    modeEl.setAttribute('data-mode', currentMode);
    hudEl.querySelector('.relay-hud-alt').textContent = `${altStr}  ·  ${basin}`;

    const b = keyBinds;
    const keyLabel = (k) => {
        if (k === ' ') return 'Space';
        if (k === 'escape') return 'Esc';
        if (k === 'tab') return 'Tab';
        if (k === '`') return '`';
        return k.toUpperCase();
    };
    const hintsMap = {
        [MODE.ORBIT]:  `${keyLabel(b.cycleMode)}=FPS · Scroll=zoom · ${keyLabel(b.flyToTree)}=fly-to · ${keyLabel(b.geoToggle)}=geo · ${keyLabel(b.posBack)}=back`,
        [MODE.FPS]:    `${keyLabel(b.forward)}${keyLabel(b.strafeLeft)}${keyLabel(b.backward)}${keyLabel(b.strafeRight)}=fly · ${keyLabel(b.rollLeft)}/${keyLabel(b.rollRight)}=roll · ${keyLabel(b.ascend)}/${keyLabel(b.descend)}=↕ · ${keyLabel(b.boost)}=boost · Scroll=speed · ${keyLabel(b.exitOrbit)}=orbit`,
        [MODE.RTS]:    `${keyLabel(b.forward)}${keyLabel(b.strafeLeft)}${keyLabel(b.backward)}${keyLabel(b.strafeRight)}=pan · Edge=scroll · Scroll=zoom · ${keyLabel(b.geoToggle)}=geo · ${keyLabel(b.posBack)}=back`,
        [MODE.BRANCH]: `V=cross-section · ${keyLabel(b.exitOrbit)}=back`,
        [MODE.XSECT]:  `V=branch view · ${keyLabel(b.exitOrbit)}=back`,
    };
    hudEl.querySelector('.relay-hud-hints').textContent = hintsMap[currentMode] || '';

    const ugEl = hudEl.querySelector('.relay-hud-underground');
    const dlEl = hudEl.querySelector('.relay-hud-depth-label');
    if (ugEl && dlEl) {
        const isUnder = Number.isFinite(alt) && alt < 0;
        ugEl.classList.toggle('active', isUnder);
        dlEl.classList.toggle('active', isUnder);
        if (isUnder) dlEl.textContent = depthLabelText(alt);
    }
}

function showSuggestion(msg, durationMs = 3000) {
    if (!hudEl) return;
    const el = hudEl.querySelector('.relay-hud-suggest');
    if (!el) return;

    el.textContent = msg;
    el.style.opacity = '1';

    clearTimeout(suggestionTimer);
    suggestionTimer = setTimeout(() => {
        el.style.opacity = '0';
    }, durationMs);
}

// Keep HUD altitude updated every ~500ms
setInterval(() => {
    if (viewer && hudEl) updateHUD();
}, 500);
