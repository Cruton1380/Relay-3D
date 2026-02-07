# 🌳 RELAY COGNITIVE WORLD SPECIFICATION V2.0

## **FROM ASSEMBLY → ORGANISM**

---

## **🎯 CORE PRINCIPLE:**

**"The tree must feel grown, not built."**

- **Growth, not wiring**
- **Accretion, not stacking**
- **Continuity, not adjacency**
- **Material memory, not separate objects**

---

## **🔴 CURRENT STATE ANALYSIS:**

### **What's Correct:**
- ✅ Semantics (rings accrete, sheets are endpoints, NOW is local)
- ✅ Tapered tubes (hierarchical thickness)
- ✅ Grid fade (8% opacity)
- ✅ Sheet card glyphs (recognizable)
- ✅ PBR materials (physically based)

### **What's Missing:**
- ❌ **Feels assembled** (separate meshes, not continuous organism)
- ❌ **Rings as objects** (not material memory)
- ❌ **Neutral lighting** (not semantic)
- ❌ **Global grid** (world reference, not interaction artifact)
- ❌ **Static scene** (frozen, not breathing)

---

## **🔧 THE 5 FUNDAMENTAL SHIFTS:**

---

### **SHIFT 1: TRUNK + RINGS = ONE MATERIAL SYSTEM**

#### **Problem:**
```
Trunk = TubeGeometry mesh
Rings = Separate CylinderGeometry meshes

Result: Viewer can mentally "pull apart" the rings from trunk
```

#### **Target:**
```
Trunk = Single continuous mesh
Rings = Material density variations (shader-based)

Result: Rings are frozen pressure inside the wood (inseparable)
```

#### **Implementation (Custom Shader):**

```glsl
// Vertex Shader (trunk.vert)
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader (trunk.frag)
uniform float time;
uniform vec3 ringPositions[10];  // Y positions of pressure rings
uniform vec3 ringColors[10];     // ERI colors (green/yellow/red)
uniform float ringCount;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
    // Base wood color
    vec3 woodColor = vec3(0.545, 0.451, 0.333); // #8B7355
    
    // Check if this fragment is near a ring position
    float ringInfluence = 0.0;
    vec3 ringTint = vec3(0.0);
    
    for (int i = 0; i < 10; i++) {
        if (float(i) >= ringCount) break;
        
        float distToRing = abs(vPosition.y - ringPositions[i].y);
        float ringWidth = 0.08;
        
        if (distToRing < ringWidth) {
            // Inside ring zone - modulate color
            float ringStrength = 1.0 - (distToRing / ringWidth);
            ringInfluence = max(ringInfluence, ringStrength);
            ringTint = mix(ringTint, ringColors[i], ringStrength);
        }
    }
    
    // Blend wood with ring tint
    vec3 finalColor = mix(woodColor, ringTint, ringInfluence * 0.6);
    
    // Fresnel rim lighting (subtle)
    float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    finalColor += vec3(0.1) * fresnel;
    
    // Subtle upward glow (growth direction)
    float upwardGlow = smoothstep(-10.0, 0.0, vPosition.y) * 0.1;
    finalColor += vec3(0.0, 0.2, 0.1) * upwardGlow;
    
    gl_FragColor = vec4(finalColor, 1.0);
}
```

#### **Three.js Integration:**

```javascript
// Create custom shader material for trunk
const trunkMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0.0 },
        ringPositions: { value: [] },  // Array of Vector3
        ringColors: { value: [] },     // Array of Vector3 (RGB)
        ringCount: { value: 0 }
    },
    vertexShader: trunkVertexShader,
    fragmentShader: trunkFragmentShader,
    lights: true  // Enable lighting calculations
});

// Populate ring data from pressure ring array
function updateRingUniforms(parentNode) {
    const positions = [];
    const colors = [];
    
    parentNode.pressureRings.forEach((ring, index) => {
        const yPos = parentNode.position.y - 0.5 - (index * 0.4);
        positions.push(new THREE.Vector3(0, yPos, 0));
        
        // Convert ERI to color
        let color;
        if (ring.eriAvg >= 80) color = new THREE.Vector3(0, 1, 0.533); // Green
        else if (ring.eriAvg >= 50) color = new THREE.Vector3(1, 0.667, 0); // Yellow
        else color = new THREE.Vector3(1, 0.267, 0.267); // Red
        
        colors.push(color);
    });
    
    trunkMaterial.uniforms.ringPositions.value = positions;
    trunkMaterial.uniforms.ringColors.value = colors;
    trunkMaterial.uniforms.ringCount.value = positions.length;
}

// Animation loop: update time uniform for breathing/growth
function animate() {
    trunkMaterial.uniforms.time.value = performance.now() / 1000.0;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
```

**Result:** Rings are no longer separate geometry - they're **material memory** inside the trunk.

---

### **SHIFT 2: BIOLOGICAL ASYMMETRY (LIFE, NOT CAD)**

#### **Problem:**
```
Perfectly linear taper
Straight lines between nodes
Result: Reads as CAD model, not living structure
```

#### **Fix - Perlin Noise + Curvature:**

```javascript
// Import simplex noise library
// <script src="https://cdn.jsdelivr.net/npm/simplex-noise@3.0.0/dist/simplex-noise.min.js"></script>

const simplex = new SimplexNoise();

function createBiologicalPath(startPos, endPos, seed) {
    const points = [];
    const segments = 16;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        
        // Linear interpolation
        const x = startPos.x + (endPos.x - startPos.x) * t;
        const y = startPos.y + (endPos.y - startPos.y) * t;
        const z = startPos.z + (endPos.z - startPos.z) * t;
        
        // Add Perlin noise for organic curvature
        const noiseScale = 0.5;
        const noiseX = simplex.noise3D(x * 0.2, y * 0.2 + seed, z * 0.2) * noiseScale;
        const noiseZ = simplex.noise3D(x * 0.2 + 100, y * 0.2 + seed, z * 0.2 + 100) * noiseScale;
        
        points.push(new THREE.Vector3(
            x + noiseX,
            y,
            z + noiseZ
        ));
    }
    
    return new THREE.CatmullRomCurve3(points);
}

// Thickness variation along path
function getRadiusAtT(t, startRadius, endRadius) {
    // Non-linear taper (biological growth)
    const taper = Math.pow(1 - t, 0.7); // Exponential taper
    const noise = simplex.noise2D(t * 5, 0) * 0.05; // Micro-variation
    return startRadius + (endRadius - startRadius) * (1 - taper) + noise;
}
```

**Result:** Trunk has **organic curvature** and **micro-variation** (asymmetry = life).

---

### **SHIFT 3: SEMANTIC LIGHTING (COGNITION, NOT REALISM)**

#### **Problem:**
```
Light illuminates everything equally
Shadows are correct but not meaningful
Result: Product model lighting, not cognitive environment
```

#### **Target Lighting Rules:**

| Element | Lighting Strategy | Purpose |
|---------|------------------|---------|
| **Trunk Interior** | Soft self-illumination (green-tinted) | History glow |
| **Ring Bands** | Brightness modulation (ERI-based) | Pressure visualization |
| **Sheet Endpoints** | Crisp key light (spotlight) | Active work objects |
| **Inactive Nodes** | Low fill, recedes | Cognitive fade |
| **Background** | Deep black, no hard edges | Focus isolation |

#### **Implementation:**

```javascript
// Remove global ambient/hemisphere lights
// scene.remove(ambientLight);
// scene.remove(hemiLight);

// SEMANTIC LIGHTING SETUP

// 1. Trunk interior glow (self-illumination in shader)
// Already handled in custom shader (upwardGlow)

// 2. Spotlight on sheet endpoints (active work)
state.tree.nodes.forEach(node => {
    if (node.type === 'sheet') {
        const spotlight = new THREE.SpotLight(0xffffff, 1.5);
        spotlight.position.set(node.position.x, node.position.y + 5, node.position.z);
        spotlight.target.position.copy(node.position);
        spotlight.angle = Math.PI / 6;
        spotlight.penumbra = 0.5; // Soft edge
        spotlight.decay = 2;
        spotlight.distance = 10;
        scene.add(spotlight);
        scene.add(spotlight.target);
    }
});

// 3. Rim light for trunk (edge definition)
const rimLight = new THREE.DirectionalLight(0x88aaff, 0.3);
rimLight.position.set(-5, 0, 5);
scene.add(rimLight);

// 4. Ambient occlusion (fake with dark base + localized lights)
scene.background = new THREE.Color(0x000000); // Deep black
scene.fog = new THREE.FogExp2(0x000000, 0.03); // Exponential fade
```

**Result:** Light **guides cognition** - active sheets are readable, trunk glows with history, inactive elements recede.

---

### **SHIFT 4: CONTEXTUAL GRID (INTERACTION ARTIFACT, NOT WORLD)**

#### **Problem:**
```
Global grid (faded to 8% but omnipresent)
Result: Grid defines "the world" (orientation reference)
```

#### **Target:**
```
Local interaction plane
Appears only:
  - Under cursor
  - Near selected node
  - During precise manipulation
Most of the time: NO visible ground
```

#### **Implementation:**

```javascript
// Replace global grid with dynamic local grid
let localGrid = null;

function showLocalGrid(position, radius = 5) {
    if (localGrid) {
        scene.remove(localGrid);
    }
    
    const gridHelper = new THREE.GridHelper(radius * 2, 10, 0x00ff88, 0x1a1f2e);
    gridHelper.position.copy(position);
    gridHelper.position.y = position.y - 0.5; // Just below target
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    
    localGrid = gridHelper;
    scene.add(localGrid);
    
    // Fade out after 2 seconds
    setTimeout(() => {
        if (localGrid) {
            scene.remove(localGrid);
            localGrid = null;
        }
    }, 2000);
}

// Show grid on hover/selection
raycaster.setFromCamera(mouse, camera);
const intersects = raycaster.intersectObjects(commitNodes);

if (intersects.length > 0) {
    const position = intersects[0].point;
    showLocalGrid(position, 3);
}
```

**Result:** Grid is a **temporary interaction scaffold**, not a world reference.

---

### **SHIFT 5: GROWTH PULSES (BREATHING, NOT FROZEN)**

#### **Problem:**
```
Static scene (no motion after removing rotation)
Result: Feels frozen in time, not alive under continuous verification
```

#### **Target:**
```
Subtle upward flow (growth direction)
Faint ring breathing (pressure pulse)
Shimmer when drift exists
NO rotation (no cyclic time)
```

#### **Implementation:**

```javascript
// Add to custom shader uniforms
uniforms: {
    time: { value: 0.0 },
    breatheAmplitude: { value: 0.05 },
    flowSpeed: { value: 0.3 }
}

// Fragment shader additions
void main() {
    // ... existing code ...
    
    // Growth pulse (upward flow)
    float pulse = sin(vPosition.y * 2.0 - time * flowSpeed) * 0.5 + 0.5;
    finalColor += vec3(0.0, 0.1, 0.05) * pulse * breatheAmplitude;
    
    // Ring breathing (expand/contract illusion)
    for (int i = 0; i < 10; i++) {
        if (float(i) >= ringCount) break;
        
        float distToRing = abs(vPosition.y - ringPositions[i].y);
        float breathe = sin(time * 2.0 + float(i) * 0.5) * breatheAmplitude;
        float ringWidth = 0.08 + breathe;
        
        // ... rest of ring rendering with animated width ...
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
}

// Animation loop
function animate() {
    const time = performance.now() / 1000.0;
    trunkMaterial.uniforms.time.value = time;
    
    // Shimmer on drift (if drift exists)
    if (hasDrift) {
        trunkMaterial.uniforms.breatheAmplitude.value = 0.08; // Stronger pulse
    } else {
        trunkMaterial.uniforms.breatheAmplitude.value = 0.03; // Gentle breath
    }
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
```

**Result:** Tree **breathes** - subtle upward flow, ring expansion/contraction, drift shimmer (no rotation).

---

## **🎯 BEFORE/AFTER COMPARISON:**

| Aspect | Current (Assembly) | Target (Organism) |
|--------|-------------------|------------------|
| **Trunk + Rings** | Separate meshes | Single material system |
| **Taper** | Linear | Biological (Perlin noise) |
| **Lighting** | Neutral PBR | Semantic (cognition-driven) |
| **Grid** | Global (faded) | Contextual (interaction only) |
| **Motion** | Static | Breathing (growth pulses) |
| **Feel** | Assembled | **Grown** |

---

## **✅ IMPLEMENTATION ROADMAP:**

### **Phase 1: Material Unity (CRITICAL)**
1. ✅ Create custom shader for trunk (with ring bands)
2. ✅ Remove separate ring meshes
3. ✅ Encode ring data in shader uniforms
4. ✅ Test material continuity

### **Phase 2: Biological Variation**
1. ✅ Add simplex noise library
2. ✅ Implement Perlin-based path curvature
3. ✅ Add micro-variation in thickness
4. ✅ Test asymmetry (life, not CAD)

### **Phase 3: Semantic Lighting**
1. ✅ Remove global ambient/hemisphere
2. ✅ Add spotlights on sheet endpoints
3. ✅ Add rim light for trunk definition
4. ✅ Set deep black background + exp fog

### **Phase 4: Contextual Grid**
1. ✅ Remove global grid
2. ✅ Add dynamic local grid on hover/selection
3. ✅ Auto-fade after 2 seconds
4. ✅ Test "world disappears" effect

### **Phase 5: Growth Animation**
1. ✅ Add time uniform to shader
2. ✅ Implement upward flow pulse
3. ✅ Implement ring breathing
4. ✅ Add drift shimmer (conditional)

---

## **🔒 CANONICAL LOCK:**

**"The trunk is not geometry with rings attached. The trunk IS the rings. The tree is not lit - it glows. The grid does not exist - it appears. The scene is not static - it breathes."**

**This is the shift from assembly → organism.**  
**This is the shift from debug → cognitive world.**  
**This is the shift from correct → inevitable.** 🌳🔒✨
