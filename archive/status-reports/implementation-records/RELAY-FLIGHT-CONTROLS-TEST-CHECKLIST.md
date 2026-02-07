# **RELAY FLIGHT CONTROLS - TEST CHECKLIST**

**Version:** 1.0  
**Date:** February 2, 2026  
**Purpose:** Verify FreeFlightControls implementation is canonical  
**Before:** Approve for video production or pilot deployment

---

## **🎯 TEST ENVIRONMENT:**

**URL:** `http://localhost:5173/relay3d-filaments` (dev server)  
**Browser:** Chrome/Firefox (PointerLock API required)  
**Expected Files:**
- `src/frontend/components/relay-3d/controls/FreeFlightControls.jsx`
- `src/frontend/components/relay-3d/hud/FlightHUD.jsx`
- `src/frontend/components/relay-3d/RelayFilamentRenderer.jsx`

---

## **✅ FUNCTIONAL TESTS:**

### **1. Pointer Lock Entry/Exit**

- [ ] **Click canvas** → Pointer locks, HUD changes to "FREE-FLY ✈️"
- [ ] **Lock status** → HUD shows 🔒 (locked)
- [ ] **Press Esc** → Pointer unlocks, HUD changes to "HOLD ⏸️"
- [ ] **Lock status** → HUD shows 🔓 (unlocked)

**Expected:** Smooth transition between HOLD and FREE-FLY modes.

---

### **2. Mouse Look (Pointer Locked)**

- [ ] **Move mouse left** → Camera yaws left
- [ ] **Move mouse right** → Camera yaws right
- [ ] **Move mouse up** → Camera pitches up
- [ ] **Move mouse down** → Camera pitches down
- [ ] **Look 360° horizontally** → No gimbal lock
- [ ] **Look 180° vertically** → No gimbal lock

**Expected:** Smooth, responsive look with no stuttering or drift.

---

### **3. WASD Movement (Camera-Relative)**

**Setup:** Lock pointer, face a recognizable object (node/edge).

- [ ] **Press W** → Move forward (toward where you're looking)
- [ ] **Press S** → Move backward (away from where you're looking)
- [ ] **Press A** → Strafe left (perpendicular to look direction)
- [ ] **Press D** → Strafe right (perpendicular to look direction)
- [ ] **Look left, press W** → Move in new forward direction (not original)
- [ ] **Diagonal (W+A)** → Move forward-left at ~45°

**Expected:** Movement always relative to camera look direction (FPS-style).

---

### **4. Vertical Movement (Q/E + Space)**

- [ ] **Press Q** → Move down (descend)
- [ ] **Press E** → Move up (ascend)
- [ ] **Press Space** → Move up (same as E)
- [ ] **Press Q+W** → Move forward + down simultaneously
- [ ] **Press E+A** → Strafe left + ascend simultaneously

**Expected:** Vertical movement independent of look direction (world-space up/down).

---

### **5. Speed Modifiers (Shift/Ctrl)**

**Setup:** Lock pointer, press W to move forward.

- [ ] **Default speed** → HUD shows ~6.0 units/sec
- [ ] **Hold Shift + W** → Speed increases (~24.0), movement faster
- [ ] **Hold Ctrl + W** → Speed decreases (~1.5), movement slower
- [ ] **Release Shift** → Speed returns to base (~6.0)
- [ ] **Shift + WASD** → All directions affected equally

**Expected:** Speed modifier applies to all movement directions, HUD updates.

---

### **6. Scroll Speed Adjustment**

**Setup:** Lock pointer, HUD visible.

- [ ] **Scroll down** → HUD speed decreases (min 0.5)
- [ ] **Scroll up** → HUD speed increases (max 60.0)
- [ ] **Scroll to 0.5** → Movement very slow (precision mode)
- [ ] **Scroll to 60.0** → Movement very fast (macro navigation)
- [ ] **Speed persists** → Release all keys, scroll again, new speed applies

**Expected:** Smooth speed scaling, no camera zoom (scroll = speed, not distance).

---

### **7. Acceleration + Damping (Physics Feel)**

**Setup:** Lock pointer, press W for 2 seconds.

- [ ] **Press W** → Velocity ramps up smoothly (not instant)
- [ ] **Release W** → Velocity ramps down smoothly (soft stop, not instant)
- [ ] **Press W, then Shift** → Acceleration increases smoothly
- [ ] **No input** → Camera drifts to stop within ~1 second

**Expected:** Feels like a body building/losing momentum, not teleport or twitchy.

---

### **8. HOLD Mode (Velocity Damping)**

**Setup:** Lock pointer, press W to build velocity.

- [ ] **Press Esc** → HUD shows "HOLD ⏸️"
- [ ] **Velocity damps to zero** → Camera stops moving within ~0.5 seconds
- [ ] **Try WASD keys** → No movement (pointer unlocked)
- [ ] **HUD help visible** → Shows control instructions

**Expected:** HOLD freezes motion AND damps velocity (not just UI mode).

---

### **9. Anchor Snap + Return (R Key)**

**Setup:** Select a node (click it), fly away from it.

- [ ] **Press R** → HUD shows "INSPECT 🎯"
- [ ] **Camera glides toward anchor** → Smooth, no teleport
- [ ] **Speed eases out** → Slows down as approaching anchor (no "slam")
- [ ] **On arrival** → HUD changes to "HOLD ⏸️", velocity = 0
- [ ] **Anchor updates** → Select different node, press R, glides to new anchor

**Expected:** Smooth ease-out glide, prevents "lost in space" disorientation.

---

### **10. No Orbit Constraints (6DOF Freedom)**

**Setup:** Lock pointer, fly around scene.

- [ ] **Fly upside-down** → Camera inverts, no auto-correct
- [ ] **Vertical thrust while inverted** → Q/E still move world-space up/down
- [ ] **Rotate 360° in any axis** → No orbit bias, no target lock
- [ ] **Fly through/past nodes** → Camera can move anywhere in scene

**Expected:** True 6DOF (six degrees of freedom), no orbit around target.

---

## **🎨 HUD VISUAL TESTS:**

### **11. FlightHUD Display (Top-Right)**

- [ ] **HUD visible** → Top-right corner, always on screen
- [ ] **Mode indicator** → Shows correct icon (⏸️ HOLD | ✈️ FREE-FLY | 🎯 INSPECT)
- [ ] **Speed display** → Updates when scrolling, format "Speed: X.X"
- [ ] **Lock status** → Shows correct icon (🔒 locked | 🔓 unlocked)
- [ ] **Lock animation** → Pulsing glow when locked (green)

---

### **12. HUD Mode-Specific Styling**

- [ ] **HOLD mode** → Gray border, no glow, help text visible
- [ ] **FREE-FLY mode** → Green border + glow, help text hidden
- [ ] **INSPECT mode** → Yellow border + glow

**Expected:** HUD styling clearly indicates current mode.

---

### **13. HUD Help Text (HOLD Only)**

- [ ] **HOLD mode** → Help text visible ("Click to fly", "WASD: move", etc.)
- [ ] **FREE-FLY mode** → Help text hidden
- [ ] **INSPECT mode** → Help text hidden

**Expected:** Help only shown when pointer unlocked (HOLD mode).

---

## **🔬 EDGE CASE TESTS:**

### **14. Rapid Mode Switching**

- [ ] **Click, Esc, Click, Esc** (rapidly) → No crashes, mode updates correctly
- [ ] **Lock → move → unlock → lock** → Velocity preserved or damped appropriately

---

### **15. Key Combinations**

- [ ] **W+A+Shift** → Diagonal fast movement
- [ ] **W+E+Ctrl** → Forward + up + slow (precision)
- [ ] **All 8 keys simultaneously** (WASD+QE+Shift+Ctrl) → No conflicts, smooth movement

---

### **16. Frame Rate Independence**

**Setup:** Stress test (many nodes/edges, or artificially throttle FPS).

- [ ] **Low FPS (~20)** → Physics still feels smooth (not stuttery)
- [ ] **High FPS (~120)** → Physics still feels smooth (not hyper-speed)
- [ ] **Variable FPS** → Physics remains consistent (delta time compensated)

**Expected:** Frame rate doesn't affect feel (exponential interpolation, dt-based).

---

### **17. Window Focus Loss**

- [ ] **Lock pointer, press W, alt-tab away** → Velocity stops when losing focus
- [ ] **Return to window** → No "stuck keys" (W not still pressed)

---

## **🚦 PASS/FAIL CRITERIA:**

### **✅ PASS (Canonical):**

- All functional tests pass (1-10)
- HUD displays correctly (11-13)
- No crashes or errors in edge cases (14-17)
- Physics feels "body in space" (smooth, not twitchy or teleport-y)
- Scroll changes speed, not zoom
- HOLD mode damps velocity to zero

### **⛔ FAIL (Not Canonical):**

- Pointer lock doesn't engage/disengage
- Movement not camera-relative (e.g., W always moves "north")
- Scroll zooms instead of changing speed
- HOLD mode doesn't damp velocity (camera drifts)
- Acceleration/damping missing (instant start/stop)
- Anchor return teleports instead of gliding
- Orbit bias present (camera locks to target)

---

## **🎬 VIDEO PRODUCTION TESTS:**

### **18. Cinematic Shot Verification**

**Setup:** Record 30-second clips of each shot.

- [ ] **Macro → Micro shot** → Shift+W approach, Ctrl slowdown, smooth
- [ ] **Orbit alternative** → WASD strafe around trunk, no orbit bias visible
- [ ] **Anchor return** → Press R, smooth glide visible, no teleport/cut
- [ ] **Vertical exploration** → Q/E flight up/down trunk, stable horizontal
- [ ] **Speed showcase** → Scroll visible in HUD, speed changes smoothly

**Expected:** All shots feel organic, no robotic/twitchy movement.

---

## **📋 FINAL CHECKLIST:**

Before declaring "ready for production":

- [ ] All 18 tests pass
- [ ] No console errors during testing
- [ ] HUD displays correctly on all tested browsers
- [ ] Physics feels canonical ("body in space", not "cursor on screen")
- [ ] Video production team confirms shots are achievable
- [ ] Dev team confirms tunables are accessible (baseSpeed, accel, damping)

---

## **✅ CANONICAL STATUS:**

**Tester:** _____________  
**Date:** _____________  
**Status:** ⬜ PASS | ⬜ FAIL  
**Notes:**

---

**If PASS:** Approve for video production and pilot deployment.  
**If FAIL:** Document failing tests, fix issues, re-test.

---

**Relay flight controls are canonical when all tests pass.** ✈️🌳🔒
