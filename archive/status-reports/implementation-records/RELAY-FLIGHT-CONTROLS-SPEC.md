# **RELAY FLIGHT CONTROLS SPECIFICATION**

**Version:** 1.0  
**Status:** ✅ CANONICAL  
**Implementation:** React Three Fiber + PointerLockControls + Custom Velocity Physics  
**Date:** February 2, 2026

---

## **🎯 PURPOSE:**

Replace "2D spectator" OrbitControls with **RTS-freeflight + FPS fly physics** that makes Relay feel like exploring a living organism, not inspecting a static diagram.

**Target feel:** Body in space, not cursor on screen.

---

## **🎮 CONTROL SCHEME:**

### **Mouse:**
- **Look (yaw/pitch)** with pointer lock
- **Click canvas** to enter FREE-FLY mode (locks pointer)
- **Escape** to exit FREE-FLY mode (unlocks pointer, enters HOLD mode)

### **Movement (WASD + QE):**
| Key | Action |
|-----|--------|
| **W** | Forward |
| **S** | Backward |
| **A** | Strafe left |
| **D** | Strafe right |
| **Q** | Down (vertical) |
| **E** | Up (vertical) |
| **Space** | Up (alternative to E) |

### **Speed Modifiers:**
| Key | Action | Multiplier |
|-----|--------|-----------|
| **Shift** | Fast flight | 4.0× |
| **Ctrl** | Slow/precision | 0.25× |
| **Scroll** | Adjust base speed | 0.5 - 60 units/sec |

### **Navigation:**
| Key | Action |
|-----|--------|
| **H / Tab** | HOLD mode (freeze motion, damp velocity to zero) - Relay-owned |
| **R** | Return to anchor (smooth glide to selected node or origin) |
| **Esc** | Unlock pointer (browser-owned, auto-enters HOLD) |

---

## **🧠 FLIGHT MODES:**

### **1. HOLD (default)**
- **Pointer:** Unlocked
- **Velocity:** Damped to zero
- **Purpose:** Stabilize, read UI, select nodes
- **Visual:** Gray HUD, pause icon ⏸️

### **2. FREE-FLY**
- **Pointer:** Locked
- **Velocity:** Active, responsive to input
- **Purpose:** Navigate, explore, inspect branches
- **Visual:** Green HUD, plane icon ✈️

### **3. INSPECT**
- **Pointer:** N/A (automatic)
- **Velocity:** Smooth glide to anchor
- **Purpose:** Return to selected node or origin
- **Visual:** Yellow HUD, target icon 🎯

---

## **🎯 FLIGHT MODE: MODE A (WORLD-UP) - CANONICAL:**

Relay uses **Mode A: world-up flight** for optimal usability and motion sickness prevention.

### **Characteristics:**
- **Yaw/pitch only** (no roll)
- **Q/E = world up/down** (independent of look direction)
- **Pitch clamped** to -80° to +80° (prevents extreme flipping)
- **Gravity semantics stable** (up is always up, no disorientation)

### **Why Mode A (not Mode B: full 6DOF):**
- ✅ Prevents motion sickness (no inverted controls)
- ✅ Keeps gravity semantics clear (branches "grow up")
- ✅ Easier to navigate complex organic structures
- ✅ Q/E always mean "rise/descend" (world-space, not camera-relative)
- ✅ Compatible with all Relay lenses (Grid, Tree, Graph)

**Mode B (full 6DOF with roll)** would allow flying upside-down but causes:
- ❌ Disorientation in organic structures
- ❌ Inverted controls when upside-down (confusing Q/E behavior)
- ❌ Motion sickness for many users
- ❌ Harder to maintain spatial awareness in tree structures

**Canonical choice: Mode A** (world-up flight) is locked.

---

## **⚙️ PHYSICS PARAMETERS:**

All physics tunables are exposed in `FreeFlightControls.jsx` and can be wired to UI sliders:

| Parameter | Default | Range | Purpose |
|-----------|---------|-------|---------|
| **baseSpeed** | 6.0 | 0.5 - 60 | Base movement speed (units/sec) |
| **fastMult** | 4.0 | 2.0 - 10.0 | Shift speed multiplier |
| **slowMult** | 0.25 | 0.1 - 0.5 | Ctrl speed multiplier |
| **accel** | 28.0 | 10.0 - 50.0 | Acceleration (higher = snappier) |
| **damping** | 12.0 | 5.0 - 20.0 | Damping/brake (higher = faster stop) |
| **verticalSpeedMult** | 0.9 | 0.5 - 1.0 | Vertical speed modifier (prevents "floaty" feel) |

**Key insight:** Acceleration + damping create the "body in space" feel. Without this, you get teleport/twitchy movement.

---

## **🎨 FLIGHT HUD:**

**Location:** Top-right corner  
**Always visible:** Yes  
**Updates:** Real-time

### **HUD Elements:**

```
┌─────────────────────┐
│ ✈️ FREE-FLY         │
│ Speed: 12.4         │
│ Lock: 🔒            │
│─────────────────────│
│ Click to fly        │ (only in HOLD mode)
│ WASD: move • Q/E    │
│ Shift: fast • Ctrl  │
│ R: return • Esc     │
└─────────────────────┘
```

### **Mode-specific styling:**
- **HOLD:** Gray border, no glow, help visible
- **FREE-FLY:** Green border + glow, lock icon pulsing
- **INSPECT:** Yellow border + glow

---

## **🔒 CANONICAL IMPLEMENTATION:**

### **File Structure:**

```
src/frontend/components/relay-3d/
├── controls/
│   └── FreeFlightControls.jsx  ← Core physics + pointer lock
├── hud/
│   ├── FlightHUD.jsx            ← Flight status display
│   └── FlightHUD.css            ← HUD styling
└── RelayFilamentRenderer.jsx    ← Integration point
```

### **Integration (React Three Fiber):**

```jsx
import FreeFlightControls from './controls/FreeFlightControls';
import FlightHUD from './hud/FlightHUD';

function RelayFilamentRenderer() {
  const [flightMode, setFlightMode] = useState('HOLD');
  const [flightSpeed, setFlightSpeed] = useState(6.0);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  return (
    <>
      <Canvas>
        <PerspectiveCamera makeDefault position={[2, 1, 3]} fov={60} />
        
        <FreeFlightControls
          enabled={true}
          anchorPosition={selectedNode?.position || [0, 0, 0]}
          onModeChange={(mode) => {
            setFlightMode(mode);
            setIsPointerLocked(mode === 'FREE-FLY');
          }}
          onSpeedChange={setFlightSpeed}
        />
        
        {/* ... scene content ... */}
      </Canvas>
      
      <FlightHUD 
        speed={flightSpeed} 
        mode={flightMode} 
        isLocked={isPointerLocked} 
      />
    </>
  );
}
```

---

## **🔬 PHYSICS DEEP DIVE:**

### **Velocity Interpolation (lerp):**

```javascript
// Accelerate toward desired velocity
velocity.lerp(desired, 1 - Math.exp(-accel * dt));
```

**Why:** Creates smooth acceleration, feels like a body building momentum.

**Math:** Exponential ease-in, frame-rate independent.

### **Damping (soft stop):**

```javascript
// Damping when no input
if (wish.lengthSq() === 0) {
  velocity.multiplyScalar(Math.exp(-damping * dt));
}
```

**Why:** Natural deceleration, prevents instant stop (feels robotic).

**Math:** Exponential decay, also frame-rate independent.

### **Camera-relative Movement:**

```javascript
const forward = new THREE.Vector3();
controls.getDirection(forward);  // forward in world space
const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
const up = new THREE.Vector3().copy(camera.up);

const desired = new THREE.Vector3()
  .addScaledVector(right, wish.x)      // strafe
  .addScaledVector(up, wish.y * verticalSpeedMult)  // vertical
  .addScaledVector(forward, wish.z)    // forward/back
  .normalize()
  .multiplyScalar(speed);
```

**Why:** WASD moves relative to where you're looking (FPS-style), not world axes.

**Math:** Construct world velocity from camera basis vectors + input.

---

## **🎬 ANCHOR SNAP + RETURN:**

### **Behavior:**

1. Press **R** key
2. Camera smoothly glides to `anchorPosition` (selected node or origin)
3. Mode changes to **INSPECT**
4. On arrival (distance < 0.1 units), mode returns to **HOLD**
5. Velocity damped to zero

### **Physics:**

```javascript
const toAnchor = anchorTarget.clone().sub(cameraPos);
const distance = toAnchor.length();
const glideSpeed = Math.min(distance * 3, baseSpeed * 2);  // ease-out
toAnchor.normalize().multiplyScalar(glideSpeed);
cameraPos.addScaledVector(toAnchor, dt);
```

**Why:** Ease-out prevents "slamming" into anchor. Speed scales with distance.

### **Use Case:**

- **Exploring tree branches:** R to return to trunk
- **Lost in space:** R to return to origin
- **Node inspection:** Click node → R to glide to it

---

## **🚫 WHAT THIS REPLACES:**

### **OrbitControls (old):**
- ❌ Orbit bias (always rotates around a target)
- ❌ Zoom = distance from target (not speed)
- ❌ No vertical thrust (only pan on plane)
- ❌ Feels like "spectator mode" or "rotate object"
- ❌ No acceleration/damping

### **FreeFlightControls (new):**
- ✅ No orbit constraints (Mode A: world-up flight, yaw/pitch only, no roll)
- ✅ Scroll = speed scalar (not zoom/distance)
- ✅ True vertical thrust (Q/E, world-space up/down)
- ✅ Feels like "body in space" or "flying through scene"
- ✅ Acceleration + damping for natural physics
- ✅ Pitch clamping prevents motion sickness (-80° to +80°)

---

## **🎮 WHY THIS CONTROL SCHEME IS CANONICAL FOR RELAY:**

1. **Lens-agnostic:** Works in Grid Lens, Tree Lens, Graph Lens
2. **Scale-agnostic:** Fast for macro (fly between branches), slow for micro (inspect endpoints)
3. **Organism feel:** You're navigating a living structure, not manipulating a diagram
4. **No teleport:** Smooth glide to anchors prevents disorientation
5. **Stabilization:** HOLD mode prevents "drift" while reading UI
6. **Intuitive:** Standard FPS/RTS controls (WASD + mouse look)

---

## **🔧 TUNABLES FOR VIDEO PRODUCTION:**

If you want to adjust for video recording (smoother, slower, or more dramatic):

```javascript
// Cinematic (slow, smooth)
baseSpeed: 3.0
accel: 12.0
damping: 8.0
fastMult: 2.0

// Responsive (quick, snappy)
baseSpeed: 10.0
accel: 40.0
damping: 18.0
fastMult: 6.0

// Floaty (ethereal, dreamy)
baseSpeed: 4.0
accel: 8.0
damping: 4.0
verticalSpeedMult: 1.2
```

**Location:** `src/frontend/components/relay-3d/controls/FreeFlightControls.jsx` lines 33-38

---

## **✅ CANONICAL STATUS:**

**Physics:** ✅ LOCKED  
**Controls:** ✅ CANONICAL  
**HUD:** ✅ FUNCTIONAL  
**Anchor Snap:** ✅ IMPLEMENTED  
**HOLD Mode:** ✅ VELOCITY DAMPING

**Next:** Wire tunables to UI sliders (optional, not required for v1).

---

## **🎬 FOR SCV HOLLYWOOD:**

**Ready to record.** Flight controls now match the "organism exploration" feel.

**Recommended shots:**
1. **Macro → Micro:** Start far (Shift + W), approach tree, slow down (Ctrl), inspect branch
2. **Orbit alternative:** Fly around trunk (WASD strafe + mouse look), no orbit bias
3. **Anchor return:** Get "lost" in branches, press R, smooth glide back to trunk
4. **Vertical exploration:** Q/E to fly up/down trunk, showing pressure rings stacked vertically
5. **Speed showcase:** Scroll to change speed mid-flight, show HUD updating

**HUD visibility:** Flight HUD (top-right) shows speed/mode/lock state in all shots.

---

**Relay flight controls (v1) are canonical.** ✈️🌳🔒

**No orbit bias. No teleport. Body in space.**
