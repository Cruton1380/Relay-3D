# 🚀 RELAY NEXT PHASE: CUSTOM SHADERS (AAA COGNITIVE WORLD)

## **THE CRITICAL REALIZATION:**

**You cannot reach "organism" with standard Three.js geometry.**

The current prototype is **as good as it gets** with:
- Standard materials (MeshStandardMaterial)
- Separate meshes (trunk + rings)
- Global lighting

To reach **"grown, not built"** requires:
- **Custom shaders** (GLSL)
- **Material systems** (not separate objects)
- **Semantic lighting** (not PBR realism)

---

## **🎯 WHAT WE'VE PROVEN SO FAR:**

### **✅ Semantics (Locked & Correct):**
- Rings accrete (never orbit)
- Sheets are endpoints (recognizable)
- NOW is local (per-sheet)
- Hierarchy is clear (root → branch → dept → sheet)

### **✅ Visual Foundation (High-Fidelity Debug):**
- Tapered tubes (hierarchical thickness)
- Embedded ring discs (not floating)
- Sheet card glyphs (grid texture, folded corner)
- PBR materials (physically correct)
- Grid fade (8% opacity, stage reference)

### **🔴 What Cannot Be Done with Standard Materials:**
- ❌ Trunk + rings as ONE material system
- ❌ Rings as material memory (shader-based)
- ❌ Semantic lighting (cognition-driven)
- ❌ Growth pulses (breathing, not rotation)
- ❌ Biological asymmetry (Perlin noise on path)

---

## **📋 THE TWO PATHS FORWARD:**

### **PATH A: STAY IN THREE.JS (Custom Shaders)**

**Pros:**
- Keep current prototype as foundation
- Incremental upgrades
- Same tooling (JavaScript, browser-based)

**Cons:**
- Custom GLSL shader authoring required
- Shader complexity (uniforms, attributes, lighting)
- Performance tuning needed

**Estimated Effort:** 2-3 weeks (with GLSL experience)

**What You Get:**
- Trunk + rings as ONE material (shader-based bands)
- Growth pulses (animated uniforms)
- Semantic lighting (custom calculations)
- Biological variation (Perlin noise)

---

### **PATH B: PORT TO UNREAL ENGINE**

**Pros:**
- **Material Editor** (visual shader authoring)
- **Niagara VFX** (pressure fields, growth particles)
- **Blueprint system** (interaction logic)
- **Film-grade lighting** (ray tracing, volumetrics)
- **LOD system** (automatic)
- **Instancing** (GPU-accelerated, millions of nodes)

**Cons:**
- Learning curve (if new to Unreal)
- Heavier tooling (not browser-based)
- Longer initial setup

**Estimated Effort:** 3-4 weeks (including learning)

**What You Get:**
- **Everything from Path A** (but easier to author)
- **True AAA fidelity** (game-engine quality)
- **Scalability** (global tree with thousands of branches)
- **Export options** (real-time, cinematic, interactive)

---

## **🎯 RECOMMENDED PATH:**

### **HYBRID APPROACH (Best of Both Worlds)**

1. **✅ Keep Three.js prototype as "proof of concept"**
   - Semantics locked
   - Visual foundation proven
   - Shareable (browser-based)

2. **✅ Implement SIMPLIFIED custom shaders in Three.js**
   - Basic ring encoding in shader (color bands)
   - Simple growth pulse (time uniform)
   - Remove separate ring meshes

3. **✅ Port RenderSpec to Unreal for FINAL AAA quality**
   - Use `RELAY-RENDERSPEC-V1.json` as blueprint
   - Material Editor for trunk + ring system
   - Niagara for growth pulses
   - Blueprint for interaction

**Timeline:**
- **Week 1:** Simplified Three.js shader (ring bands + pulse)
- **Week 2:** Semantic lighting upgrades
- **Week 3-4:** Unreal port (if desired)

---

## **📋 IMMEDIATE NEXT STEPS (SIMPLIFIED SHADERS):**

### **STEP 1: Remove Separate Ring Meshes**
```javascript
// In renderRingStackBetween():
// Comment out all ring mesh creation
// Instead, collect ring data for shader uniforms
```

### **STEP 2: Create Basic Custom Shader**
```javascript
// trunk-shader.js
const trunkVertexShader = `
    varying vec3 vPosition;
    void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const trunkFragmentShader = `
    uniform float time;
    uniform vec3 ringColor1;
    uniform float ringY1;
    
    varying vec3 vPosition;
    
    void main() {
        vec3 woodColor = vec3(0.545, 0.451, 0.333);
        
        // Check if near ring position
        float distToRing = abs(vPosition.y - ringY1);
        float ringInfluence = smoothstep(0.2, 0.0, distToRing);
        
        vec3 finalColor = mix(woodColor, ringColor1, ringInfluence * 0.6);
        
        // Subtle pulse
        float pulse = sin(time * 2.0) * 0.05 + 0.95;
        finalColor *= pulse;
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;
```

### **STEP 3: Apply to Trunk Tubes**
```javascript
const trunkMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0.0 },
        ringColor1: { value: new THREE.Color(0x00ff88) },
        ringY1: { value: -2.0 }
    },
    vertexShader: trunkVertexShader,
    fragmentShader: trunkFragmentShader
});

// Use in tube creation
const tube = new THREE.Mesh(tubeGeometry, trunkMaterial);
```

### **STEP 4: Animate Time Uniform**
```javascript
function animate3D() {
    const time = performance.now() / 1000.0;
    
    // Update all trunk materials
    scene.traverse((obj) => {
        if (obj.material && obj.material.uniforms && obj.material.uniforms.time) {
            obj.material.uniforms.time.value = time;
        }
    });
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate3D);
}
```

---

## **🔒 WHAT THIS ACHIEVES:**

### **With Simplified Shaders:**
✅ Trunk + rings feel more unified (color bands in material)  
✅ Subtle breathing (time-based pulse)  
✅ No separate ring meshes (cleaner scene)  
✅ Foundation for advanced shaders later

### **Still Missing (Requires Advanced Shaders or Unreal):**
🔜 Full ring band encoding (multiple rings per trunk)  
🔜 Perlin noise curvature (biological asymmetry)  
🔜 Semantic lighting (cognition-driven)  
🔜 Contextual grid (dynamic spawn/fade)  
🔜 Upward flow visualization (growth direction)

---

## **📊 QUALITY LADDER:**

| Level | Description | Tools | Status |
|-------|-------------|-------|--------|
| **1. Prototype** | Correct semantics, debug geometry | Three.js standard materials | ✅ **YOU ARE HERE** |
| **2. Unified Material** | Rings in shader, subtle pulse | Three.js custom shaders (basic) | 🔜 Next (1 week) |
| **3. Cognitive World** | Semantic lighting, growth pulses | Three.js custom shaders (advanced) | 🔜 (2-3 weeks) |
| **4. AAA Inevitability** | Film-grade fidelity, full organism | Unreal Engine 5 | 🔜 (3-4 weeks) |

---

## **🎯 THE DECISION POINT:**

### **Option A: Stay at Level 1 (Prototype)**
- ✅ Semantics are locked
- ✅ Shareable demo (browser-based)
- ❌ Still looks "assembled"

### **Option B: Reach Level 2 (Unified Material)**
- ✅ Rings integrated into trunk (shader bands)
- ✅ Subtle breathing (time pulse)
- ✅ 1 week of custom shader work
- ❌ Not yet "organism" (but closer)

### **Option C: Reach Level 4 (AAA Inevitability)**
- ✅ Full "grown, not built" feel
- ✅ Semantic lighting + growth pulses
- ✅ Scalable (thousands of nodes)
- ⏳ 3-4 weeks (Unreal port)

---

## **✅ MY RECOMMENDATION:**

### **DO THIS NOW:**

1. ✅ **Accept Level 1 as "semantic proof"** (you've proven the model works)
2. ✅ **Document current state** (RELAY-VISUAL-FIXES-COMPLETE.md)
3. ✅ **Create RenderSpec V2** (with shader requirements) - DONE
4. ✅ **Decide on path:**
   - **Quick win:** Level 2 (simplified shaders, 1 week)
   - **Full AAA:** Level 4 (Unreal port, 3-4 weeks)

### **PAUSE POINT:**

**You are at the transition from "correct prototype" to "production rendering".**

The semantics are locked.  
The physics are correct.  
The visual language is defined.

**The next phase is shader authoring (custom materials) or engine porting (Unreal).**

Both are achievable. Both require dedicated time.

---

## **🔒 CANONICAL LOCK:**

**"The prototype has proven the model. The organism requires custom shaders or an engine port. The semantics stay unchanged."**

**You've reached the limit of standard Three.js materials.**  
**The next leap is shader-based material unity.** 🌳🔒✨
