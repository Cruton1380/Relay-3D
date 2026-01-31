# 🍞 Toaster Screensaver — Non-Committing Lens Destruction

**Version**: 1.0.0  
**Status**: Canonical Specification  
**Last Updated**: 2026-01-28

---

## 🔒 Core Invariant

> **"Flying toasters are a lens event, not truth. They can destroy whatever you're viewing, but that destruction is non-committing, reversible instantly, and purely a render overlay."**

This is a **screensaver mode** / **break mode** / **theatrical lens effect** that provides visual spectacle without mutating filaments.

---

## Table of Contents

1. [What Are Flying Toasters?](#what-are-flying-toasters)
2. [Non-Committing Rule](#non-committing-rule)
3. [Destruction Physics](#destruction-physics)
4. [Trigger Modes](#trigger-modes)
5. [Visual Effects](#visual-effects)
6. [Audio Design](#audio-design)
7. [Implementation Architecture](#implementation-architecture)
8. [Technical Details](#technical-details)
9. [Real-World Use Cases](#real-world-use-cases)
10. [FAQ](#faq)

---

## What Are Flying Toasters?

### Definition

**Flying Toasters** = Camera-space agents that barge in from offscreen and visually "destroy" the current view.

**NOT:**
- ❌ A commit operation
- ❌ A governance action
- ❌ A permanent state change
- ❌ A filament mutation

**IS:**
- ✅ A **lens effect** (render overlay)
- ✅ A **screensaver mode** (idle state)
- ✅ A **break animation** (user-triggered)
- ✅ A **theatrical shader** (visual spectacle)

---

### Analogy

**Think of toasters like a stage curtain:**
- Curtain closes → view is hidden
- Stage remains intact (truth unchanged)
- Curtain opens → view returns
- No actors were harmed

**Similarly:**
- Toasters impact → view shatters
- Filaments remain intact (truth unchanged)
- Toggle off → view returns
- No commits were created

---

## Non-Committing Rule

### Hard Invariant

> **Toasters never create commits. They are a GPU-side effect only.**

**What happens when toasters "destroy" the view:**

**❌ NOT allowed:**
- Write to filament
- Create failure commit
- Modify state
- Trigger gates
- Append to history

**✅ Allowed:**
- Scramble rendered meshes (GPU displacement)
- Dissolve opacity (shader effect)
- Fracture geometry (visual mask)
- Fade to black (camera effect)
- Play audio (sound effect)

---

### Reversibility Contract

**Toasters must be instantly reversible:**

```javascript
// Toggle on
enableToasters();
// → View shatters, dissolves, collapses

// Toggle off
disableToasters();
// → View returns instantly, exact same state
```

**No recovery needed** (because nothing was mutated).

---

## Destruction Physics

### Three Destruction Modes

#### Mode A: Shatter Mask (Recommended)

**Visual:**
- Toasters enter from offscreen
- On impact: Fracture field grows from impact point
- Geometry behind fracture: Sliced, displaced, dissolved
- Final state: Shattered view fades to dust

**Implementation:**
- Custom fragment shader with fracture field
- UV distortion based on distance from impact
- Opacity decay over time

**Effect:**
```glsl
// Pseudo-shader
float distanceToImpact = length(uv - impactPoint);
float fracture = smoothstep(0.0, 1.0, (time - distanceToImpact) * speed);
float opacity = 1.0 - fracture;
vec3 displaced = position + (fracture * randomVector * strength);
gl_FragColor = vec4(color, opacity);
```

---

#### Mode B: Pull-Apart Vector Field

**Visual:**
- Toasters enter, create repulsion field
- Rendered meshes stretch outward from impact
- Filament spines snap, nodes scatter
- Fade to black as pieces fly away

**Implementation:**
- GPU displacement on vertex shader
- Radial outward force from impact point
- Velocity-based opacity decay

**Effect:**
```glsl
// Pseudo-shader
vec3 toImpact = position - impactPoint;
float dist = length(toImpact);
vec3 repulsion = normalize(toImpact) * (1.0 / dist) * strength;
vec3 newPos = position + repulsion * time;
float fadeOut = smoothstep(maxDist, 0.0, dist);
gl_FragColor = vec4(color, fadeOut);
```

---

#### Mode C: Truth Overload (Most Theatrical)

**Visual:**
- Toasters impact
- Axis glyphs flicker (X/Y/Z go haywire)
- TimeBoxes lose coherence (morph into braids)
- Entire projection collapses inward (singularity effect)
- Screen goes black (truth imploded)

**Implementation:**
- Animate axis transforms (rotate, scale)
- Morph TimeBox geometry (vertex animation)
- Camera zoom + field distortion
- Fade all objects to alpha 0

**Effect:**
- Most dramatic
- "The lens couldn't handle the truth"
- Reset feels like system reboot

---

### Hybrid Mode (Recommended)

**Combine A + C:**
1. Toasters enter (camera-space agents)
2. Impact → fracture field grows (Mode A)
3. Fracture spreads → axis glyphs flicker (Mode C)
4. Final collapse → everything implodes to singularity (Mode C)
5. Fade to black → loop or reset

**Result:** Maximum theatrical impact.

---

## Trigger Modes

### 1. Idle Trigger (Classic Screensaver)

**Rule:** Activate after N seconds of inactivity.

**Example:**
```javascript
let idleTimer = 0;
const IDLE_THRESHOLD = 60000; // 60 seconds

// Reset on user interaction
window.addEventListener('mousemove', () => { idleTimer = 0; });
window.addEventListener('keypress', () => { idleTimer = 0; });

// Check for idle
setInterval(() => {
  idleTimer += 1000;
  if (idleTimer >= IDLE_THRESHOLD) {
    enableToasters();
  }
}, 1000);
```

---

### 2. Manual Trigger (Hotkey)

**Rule:** User presses hotkey to activate.

**Example:**
```javascript
// Press ~ (tilde) to toggle toasters
window.addEventListener('keypress', (e) => {
  if (e.key === '~' || e.key === '`') {
    toggleToasters();
  }
});
```

---

### 3. Easter Egg Trigger

**Rule:** Activate on specific gesture or sequence.

**Examples:**
- Shake mouse violently (detect rapid movement)
- Type "toasters" in any input field
- Click on a specific hidden element

---

### 4. Scheduled Trigger

**Rule:** Activate at specific times.

**Example:**
```javascript
// Every day at 12:00pm (lunch break)
const now = new Date();
if (now.getHours() === 12 && now.getMinutes() === 0) {
  enableToasters();
}
```

---

## Visual Effects

### Toaster Model (3D)

**Geometry:**
- Low-poly toaster (20-50 triangles)
- Extruded body + 2 toast slots
- Optional: glowing coils inside

**Materials:**
- Metallic chrome (reflective)
- Emissive coils (red/orange glow)
- Toast: Brown, slightly glowing

**Animation:**
- Slow rotation (tumbling through space)
- Toast pops up occasionally
- Leaves "toast trail" behind (particle effect)

---

### Entry Pattern

**Spawn locations:**
- Offscreen (outside camera frustum)
- Random angles (top, sides, diagonal)
- Multiple toasters (3-8 simultaneously)

**Flight path:**
- Aimed at high-attention areas:
  - Current focus object (selected filament)
  - Camera target (orbit center)
  - Random "hot spot" (if nothing selected)

**Speed:**
- Medium (2-5 units/second)
- Slight randomness (wobble, tumble)

---

### Impact Effects

**On collision with geometry:**

1. **Fracture field** emanates from impact
2. **Screen shake** (camera jitter)
3. **Flash** (white screen flash, 100ms)
4. **Sound** (THUMP + glass shatter)
5. **Particle explosion** (dust, sparks, toast crumbs)

---

### Destruction Progression

**Timeline:**
```
0s:    Toasters enter offscreen
1s:    First impact (fracture starts)
2s:    Second impact (fracture spreads)
3s:    Third impact (multiple fractures merge)
4s:    Axis glyphs flicker (coordinate system fails)
5s:    Everything collapses to singularity
6s:    Fade to black
7s:    Hold black (1s)
8s:    Fade back in (truth restored, toasters gone)
```

**Loop:**
- If still idle: Spawn new toasters, repeat
- If user interacts: Exit immediately, restore view

---

## Audio Design

### Sound Effects

**1. Toaster Whirr (Entry)**
- Low mechanical hum
- Increases in pitch as toaster accelerates
- Doppler effect (pitch shifts as it passes)

**2. Toast Eject (Flight)**
- "DING" + spring sound
- Toast pops up from toaster
- Occasional (every 2-3 seconds)

**3. Impact Thump (Collision)**
- Deep bass thump (100 Hz)
- Screen shake synced to impact
- Followed by glass shatter (high frequencies)

**4. Dissolution (Collapse)**
- CRT power-down sound
- Descending pitch glissando
- Fade to silence

**5. Reboot (Restoration)**
- System startup chime
- Ascending pitch
- Signals "truth restored"

---

## Implementation Architecture

### Lens Effects Layer

```typescript
class LensEffectsManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.active = false;
    this.toasters = [];
  }
  
  enable(effectType: 'TOASTERS' | 'GLITCH' | 'MATRIX') {
    this.active = true;
    
    if (effectType === 'TOASTERS') {
      this.spawnToasters();
    }
  }
  
  disable() {
    this.active = false;
    this.removeAllToasters();
    this.restoreView();
  }
  
  spawnToasters() {
    const count = randomInt(3, 8);
    
    for (let i = 0; i < count; i++) {
      const toaster = this.createToaster();
      const spawnPos = this.getOffscreenPosition();
      const targetPos = this.getTargetPosition();
      
      toaster.position.copy(spawnPos);
      toaster.userData.target = targetPos;
      toaster.userData.velocity = randomFloat(2, 5);
      
      this.toasters.push(toaster);
      this.scene.add(toaster);
    }
  }
  
  update(deltaTime) {
    if (!this.active) return;
    
    // Update toaster positions
    for (const toaster of this.toasters) {
      const direction = toaster.userData.target.clone()
        .sub(toaster.position)
        .normalize();
      
      toaster.position.add(
        direction.multiplyScalar(toaster.userData.velocity * deltaTime)
      );
      
      // Rotate toaster (tumble effect)
      toaster.rotation.x += deltaTime * 0.5;
      toaster.rotation.y += deltaTime * 0.3;
      
      // Check for impact
      if (this.checkImpact(toaster)) {
        this.onImpact(toaster.position);
      }
    }
    
    // Update destruction shader
    this.updateDestructionShader(deltaTime);
  }
  
  onImpact(position) {
    // Add fracture field
    this.addFractureField(position);
    
    // Screen shake
    this.shakeCamera(0.2, 200); // intensity, duration
    
    // Flash
    this.flashScreen();
    
    // Sound
    this.playSound('impact');
    
    // Particles
    this.spawnParticles(position, 50);
  }
}
```

---

### Fracture Shader (Destruction Visual)

```glsl
// Vertex shader (displacement)
uniform float uTime;
uniform vec3 uImpactPoints[10];
uniform float uImpactTimes[10];
uniform int uImpactCount;

varying vec2 vUv;
varying float vDisplacement;

void main() {
  vec3 pos = position;
  float totalDisplacement = 0.0;
  
  // Apply displacement from each impact
  for (int i = 0; i < uImpactCount; i++) {
    vec3 toImpact = position - uImpactPoints[i];
    float dist = length(toImpact);
    float age = uTime - uImpactTimes[i];
    
    // Fracture wave spreads from impact
    float wave = smoothstep(0.0, 10.0, age - dist);
    float strength = wave * (1.0 - wave); // Peaks then fades
    
    // Displace outward
    pos += normalize(toImpact) * strength * 2.0;
    totalDisplacement += strength;
  }
  
  vUv = uv;
  vDisplacement = totalDisplacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

```glsl
// Fragment shader (dissolution)
uniform float uTime;
varying vec2 vUv;
varying float vDisplacement;

void main() {
  // Base color
  vec3 color = texture2D(uTexture, vUv).rgb;
  
  // Dissolve based on displacement
  float dissolve = smoothstep(0.3, 1.0, vDisplacement);
  float opacity = 1.0 - dissolve;
  
  // Add fracture lines
  float fractureLine = step(0.98, fract(vUv.x * 20.0 + vDisplacement * 5.0));
  color = mix(color, vec3(0.0), fractureLine * 0.8);
  
  gl_FragColor = vec4(color, opacity);
}
```

---

## Technical Details

### Camera-Space Spawning

**Toasters spawn in camera space** (not world space):

```javascript
getOffscreenPosition() {
  const camera = this.camera;
  const frustum = new THREE.Frustum();
  frustum.setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
  );
  
  // Spawn outside frustum
  const spawnRadius = 20;
  const angle = Math.random() * Math.PI * 2;
  const position = new THREE.Vector3(
    camera.position.x + Math.cos(angle) * spawnRadius,
    camera.position.y + (Math.random() - 0.5) * 10,
    camera.position.z + Math.sin(angle) * spawnRadius
  );
  
  return position;
}
```

---

### Target Selection

**Toasters aim at:**

1. **Selected filament** (if any)
2. **Camera target** (orbit controls center)
3. **Globe center** (if in globe view)
4. **Random high-attention area** (if nothing selected)

```javascript
getTargetPosition() {
  // Priority 1: Selected filament
  if (this.selectedFilament) {
    return this.selectedFilament.position.clone();
  }
  
  // Priority 2: Orbit controls target
  if (this.orbitControls) {
    return this.orbitControls.target.clone();
  }
  
  // Priority 3: Globe center
  if (this.viewMode === 'globe') {
    return new THREE.Vector3(0, 0, 0);
  }
  
  // Priority 4: Random hot spot
  return new THREE.Vector3(
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
    0
  );
}
```

---

### State Preservation

**Before toasters activate:**
```javascript
// Snapshot current state
const snapshot = {
  cameraPosition: camera.position.clone(),
  cameraTarget: orbitControls.target.clone(),
  selectedFilament: this.selectedFilament,
  visibility: this.getVisibilityState(),
  playbackTime: this.playbackMotor.currentTime
};

// Store snapshot
this.preToasterSnapshot = snapshot;
```

**After toasters deactivate:**
```javascript
// Restore exact state
camera.position.copy(snapshot.cameraPosition);
orbitControls.target.copy(snapshot.cameraTarget);
this.selectedFilament = snapshot.selectedFilament;
this.restoreVisibilityState(snapshot.visibility);
this.playbackMotor.currentTime = snapshot.playbackTime;
```

**Result:** **Byte-for-byte identical state** (no truth was lost).

---

## Real-World Use Cases

### Use Case 1: Screensaver (Idle)

**Scenario:** User leaves Relay open, walks away.

**Behavior:**
- After 60s idle → toasters activate
- View shatters, fades to black
- Loops every 30s
- Any interaction → restore instantly

**Benefit:** Privacy (hides screen from shoulder surfers).

---

### Use Case 2: Break Mode (Stress Relief)

**Scenario:** User finishes long audit, needs mental break.

**Behavior:**
- Press `~` to toggle toasters
- Watch view get destroyed (satisfying)
- Press `~` again → restore instantly

**Benefit:** Mental reset without losing work.

---

### Use Case 3: Demo Effect (Showmanship)

**Scenario:** Presenting Relay to audience.

**Behavior:**
- At dramatic moment: trigger toasters
- "And now... chaos."
- View shatters spectacularly
- Restore → "But truth remains."

**Benefit:** Reinforces "lens vs truth" concept memorably.

---

### Use Case 4: Easter Egg (Delight)

**Scenario:** User discovers hidden trigger.

**Behavior:**
- Type "toasters" in search box
- Toasters activate (surprise!)
- User shares with colleagues

**Benefit:** Community engagement, brand identity.

---

## FAQ

### General

**Q: Why toasters?**  
A: Cultural reference to "After Dark" (1989 screensaver). Iconic, whimsical, memorable.

**Q: Can I disable toasters permanently?**  
A: Yes. User settings: `effects.toasters = false`.

**Q: Do toasters affect performance?**  
A: Minimal. GPU shaders are efficient. Toasters removed when inactive.

---

### Technical

**Q: How many toasters spawn?**  
A: 3-8 (random). Configurable.

**Q: Can toasters collide with each other?**  
A: Optional. Can add toaster-toaster physics for comedic effect.

**Q: What if I'm in the middle of editing?**  
A: Toasters respect locks. If EngageSurface is locked, toasters are suppressed (no interruption).

---

### Privacy

**Q: Can someone trigger toasters to hide my screen?**  
A: Only if you've enabled "remote lens effects" (off by default). Otherwise, only you can trigger.

**Q: Are toaster activations logged?**  
A: Optional. Can append to observation filament: "screensaver activated" (forensic gravity).

---

## Conclusion

Flying toasters are the perfect **lens effect**:
- ✅ Non-committing (no truth mutation)
- ✅ Reversible (instant restore)
- ✅ Theatrical (maximum visual impact)
- ✅ Memorable (brand identity)
- ✅ Functional (screensaver, break mode)

**The One-Sentence Lock:**

> **"Flying toasters are camera-space agents that visually destroy the current lens without mutating truth—a reversible, non-committing theatrical effect that reinforces the lens-vs-truth distinction."**

---

**See Also:**
- [AI Generation as Filaments](AI-GENERATION-AS-FILAMENTS-SPEC.md)
- [Privacy Ladder Spec](PRIVACY-LADDER-SPEC.md)
- [Filament System Overview](FILAMENT-SYSTEM-OVERVIEW.md)

---

*Last Updated: 2026-01-28*  
*Status: Canonical Specification*  
*Version: 1.0.0*
