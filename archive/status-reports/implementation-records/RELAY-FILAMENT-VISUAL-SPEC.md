# Relay 3D Filament Visualization Specification
## Invoice Payment Three-Way Match - renderSpec.v1

**Based on**: Conversation canonical definition + reference HUD aesthetic  
**Scene**: `branch.finance.ap` - Invoice payment verification network  
**Purpose**: Visualize Intent → Projection → Reality alignment in real-time

---

## 🎨 **VISUAL STYLE REFERENCE**

**Aesthetic**: Laniakea supercluster / cosmic coordination basin  
**Palette**: 
- Core: Bright gold/white (#FFE57F → #FFFFFF)
- Reality anchors: Electric blue (#4FC3F7 → #E1F5FE)
- Capabilities: Cyan (#00BCD4)
- Evidence: Purple-blue (#7C4DFF)
- Divergence heat: Orange → Red gradient (#FF9800 → #F44336)
- Background: Deep space black with star field (#0A0E27)

---

## 📐 **SCENE SETUP**

```javascript
{
  camera: {
    type: "PerspectiveCamera",
    position: [2, 1, 3],
    lookAt: [0.3, -0.2, 0.1], // Focus on InvoicePaid
    fov: 60
  },
  
  lights: [
    { type: "AmbientLight", color: 0x404060, intensity: 0.3 },
    { type: "PointLight", position: [0, 0, 0], color: 0xFFE57F, intensity: 2, decay: 2 },
    { type: "PointLight", position: [0.6, -0.2, 0.1], color: 0xFFD700, intensity: 1.5 }
  ],
  
  background: {
    type: "StarField",
    count: 5000,
    size: 0.001,
    distribution: "random"
  },
  
  fog: {
    type: "FogExp2",
    color: 0x0A0E27,
    density: 0.3
  }
}
```

---

## 🔵 **NODE SPECIFICATIONS**

### **Node 1: InvoicePaid** (Primary State)
```javascript
{
  id: "n_invoice_paid",
  position: [0.6, -0.2, 0.1],
  
  geometry: {
    type: "IcosahedronGeometry",
    radius: 0.06,
    detail: 2
  },
  
  material: {
    type: "MeshStandardMaterial",
    color: 0xFFD700,
    emissive: 0xFFAA00,
    emissiveIntensity: 0.8,
    opacity: 0.72,        // FROM confidence: 72%
    transparent: true,
    metalness: 0.3,
    roughness: 0.4
  },
  
  halo: {
    type: "Sprite",
    map: "radialGradient",
    color: 0xFFE57F,
    scale: 0.15,          // FROM confidence: tighter at higher confidence
    opacity: 0.5,
    blending: "AdditiveBlending"
  },
  
  pulse: {
    enabled: true,
    rate: 0.6,            // FROM pressure: 18 → (18/100 * 1.5) = 0.27Hz → ~0.6Hz scaled
    scaleAmplitude: 0.1,
    opacityAmplitude: 0.2
  },
  
  label: {
    text: "InvoicePaid",
    position: [0.6, -0.1, 0.1],
    style: {
      fontSize: 0.04,
      color: "#FFE57F",
      background: "rgba(0,0,0,0.8)",
      padding: 0.01
    }
  },
  
  metadata: {
    kind: "STATE",
    confidence: 72,
    pressure: 18,
    deltaPR: 14,
    status: "RECONCILING"
  }
}
```

### **Node 2: BankSettlement** (Reality Anchor)
```javascript
{
  id: "n_bank_settlement",
  position: [0.3, -0.3, 0.0],
  
  geometry: {
    type: "OctahedronGeometry",  // Different shape = Reality anchor
    radius: 0.05,
    detail: 2
  },
  
  material: {
    type: "MeshStandardMaterial",
    color: 0x4FC3F7,
    emissive: 0x2196F3,
    emissiveIntensity: 1.2,
    opacity: 0.90,        // FROM confidence: 90%
    transparent: true,
    metalness: 0.8,
    roughness: 0.2
  },
  
  halo: {
    type: "Sprite",
    color: 0xE1F5FE,
    scale: 0.12,          // Strong confidence = tight halo
    opacity: 0.7,
    blending: "AdditiveBlending"
  },
  
  pulse: {
    enabled: true,
    rate: 0.26,           // FROM pressure: 8 → low pressure = slow pulse
    scaleAmplitude: 0.05
  },
  
  label: {
    text: "BankSettlement",
    position: [0.3, -0.2, 0.0],
    style: {
      fontSize: 0.035,
      color: "#4FC3F7",
      background: "rgba(0,0,0,0.8)"
    }
  },
  
  metadata: {
    kind: "REALITY_ANCHOR",
    confidence: 90,
    pressure: 8,
    deltaPR: 0
  }
}
```

### **Node 3: PaymentService** (Capability)
```javascript
{
  id: "n_payment_service",
  position: [0.15, -0.1, 0.2],
  
  geometry: {
    type: "BoxGeometry",     // Cube = Capability/Service
    size: [0.045, 0.045, 0.045]
  },
  
  material: {
    type: "MeshStandardMaterial",
    color: 0x00BCD4,
    emissive: 0x00ACC1,
    emissiveIntensity: 0.9,
    opacity: 0.80,        // FROM confidence: 80%
    transparent: true,
    metalness: 0.5,
    roughness: 0.3
  },
  
  halo: {
    type: "Sprite",
    color: 0x80DEEA,
    scale: 0.10,
    opacity: 0.6,
    blending: "AdditiveBlending"
  },
  
  pulse: {
    enabled: true,
    rate: 0.39,           // FROM pressure: 12
    scaleAmplitude: 0.08
  },
  
  label: {
    text: "PaymentService",
    position: [0.15, -0.0, 0.2],
    style: {
      fontSize: 0.03,
      color: "#00BCD4"
    }
  },
  
  metadata: {
    kind: "CAPABILITY",
    confidence: 80,
    pressure: 12,
    deltaPR: 0
  }
}
```

### **Node 4: SettlementEvidence** (Evidence)
```javascript
{
  id: "n_settlement_evidence",
  position: [0.05, -0.35, -0.1],
  
  geometry: {
    type: "TetrahedronGeometry",  // Pyramid = Evidence
    radius: 0.04,
    detail: 1
  },
  
  material: {
    type: "MeshStandardMaterial",
    color: 0x7C4DFF,
    emissive: 0x651FFF,
    emissiveIntensity: 0.7,
    opacity: 0.85,        // FROM confidence: 85%
    transparent: true,
    metalness: 0.4,
    roughness: 0.5
  },
  
  halo: {
    type: "Sprite",
    color: 0xB39DDB,
    scale: 0.09,
    opacity: 0.5,
    blending: "AdditiveBlending"
  },
  
  pulse: {
    enabled: true,
    rate: 0.19,           // FROM pressure: 6 → very slow
    scaleAmplitude: 0.04
  },
  
  label: {
    text: "SettlementEvidence",
    position: [0.05, -0.25, -0.1],
    style: {
      fontSize: 0.03,
      color: "#7C4DFF"
    }
  },
  
  metadata: {
    kind: "EVIDENCE",
    confidence: 85,
    pressure: 6,
    deltaPR: 0
  }
}
```

---

## 🔗 **EDGE SPECIFICATIONS**

### **Edge 1: InvoicePaid → BankSettlement** (DEPENDS_ON)
```javascript
{
  id: "e_depends",
  type: "DEPENDS_ON",
  from: "n_invoice_paid",
  to: "n_bank_settlement",
  
  path: {
    type: "CatmullRomCurve3",
    points: [
      [0.6, -0.2, 0.1],   // Start at InvoicePaid
      [0.5, -0.22, 0.08], // Control point 1 (curve FROM deltaPR: 14)
      [0.4, -0.26, 0.04], // Control point 2
      [0.3, -0.3, 0.0]    // End at BankSettlement
    ],
    tension: 0.3,
    segments: 64
  },
  
  geometry: {
    type: "TubeGeometry",
    radius: 0.006,        // FROM pressure: 18 → (18/100 * 0.018) = thick
    radialSegments: 8,
    tubularSegments: 64
  },
  
  material: {
    type: "MeshBasicMaterial",
    color: 0xFF9800,      // FROM deltaPR: 14 → warm orange (heat)
    opacity: 0.8,
    transparent: true,
    blending: "AdditiveBlending"
  },
  
  flow: {
    enabled: true,
    particles: 20,
    speed: 0.5,
    size: 0.008,
    color: 0xFFD700,
    direction: "forward"  // InvoicePaid → BankSettlement
  },
  
  arrow: {
    enabled: true,
    position: 0.7,        // 70% along path
    size: 0.02,
    color: 0xFFAA00
  },
  
  pulse: {
    enabled: true,
    rate: 0.6,            // Matches source node pressure
    radiusAmplitude: 0.002,
    opacityAmplitude: 0.3
  },
  
  metadata: {
    relationship: "DEPENDS_ON",
    pressure: 18,
    deltaPR: 14,
    status: "DIVERGING"   // deltaPR > 0 = divergence
  }
}
```

### **Edge 2: InvoicePaid → PaymentService** (ASSERTED_BY)
```javascript
{
  id: "e_asserted",
  type: "ASSERTED_BY",
  from: "n_invoice_paid",
  to: "n_payment_service",
  
  path: {
    type: "LineCurve3",   // Straight line (no divergence)
    points: [
      [0.6, -0.2, 0.1],
      [0.15, -0.1, 0.2]
    ]
  },
  
  geometry: {
    type: "TubeGeometry",
    radius: 0.004,        // FROM pressure: 12 → moderate
    radialSegments: 6,
    tubularSegments: 32
  },
  
  material: {
    type: "MeshBasicMaterial",
    color: 0xFFFFFF,      // White (no heat, deltaPR: 0)
    opacity: 0.6,
    transparent: true,
    blending: "AdditiveBlending"
  },
  
  dashed: {
    enabled: true,        // ASSERTED_BY = dashed
    dashSize: 0.02,
    gapSize: 0.01
  },
  
  arrow: {
    enabled: true,
    position: 0.8,
    size: 0.015,
    color: 0xFFFFFF
  },
  
  pulse: {
    enabled: true,
    rate: 0.39,           // Matches destination node pressure
    opacityAmplitude: 0.2
  },
  
  metadata: {
    relationship: "ASSERTED_BY",
    pressure: 12,
    deltaPR: 0
  }
}
```

### **Edge 3: BankSettlement → SettlementEvidence** (EVIDENCED_BY)
```javascript
{
  id: "e_evidenced",
  type: "EVIDENCED_BY",
  from: "n_bank_settlement",
  to: "n_settlement_evidence",
  
  path: {
    type: "LineCurve3",
    points: [
      [0.3, -0.3, 0.0],
      [0.05, -0.35, -0.1]
    ]
  },
  
  geometry: {
    type: "TubeGeometry",
    radius: 0.002,        // FROM pressure: 6 → thin (low pressure)
    radialSegments: 6,
    tubularSegments: 32
  },
  
  material: {
    type: "MeshBasicMaterial",
    color: 0xE1F5FE,      // Light blue (matches Reality anchor)
    opacity: 0.5,
    transparent: true,
    blending: "AdditiveBlending"
  },
  
  arrow: {
    enabled: true,
    position: 0.75,
    size: 0.012,
    color: 0x4FC3F7
  },
  
  pulse: {
    enabled: true,
    rate: 0.19,           // Slow pulse (low pressure)
    opacityAmplitude: 0.15
  },
  
  metadata: {
    relationship: "EVIDENCED_BY",
    pressure: 6,
    deltaPR: 0
  }
}
```

---

## 📊 **HUD OVERLAY - LEFT PANEL**

```javascript
{
  id: "hud_metrics",
  type: "CSS2DObject",
  position: "top-left",
  
  content: `
    <div class="relay-hud-panel">
      <div class="header">SELECTED FILAMENT:</div>
      <div class="filament-id">fil_invoice_paid_01</div>
      
      <div class="metrics">
        <div class="metric">
          <span class="label">COMMITMENT:</span>
          <span class="value confidence-72">72%</span>
        </div>
        <div class="metric">
          <span class="label">HEAT:</span>
          <span class="value heat-medium">14 mgm.</span>
        </div>
        <div class="metric">
          <span class="label">ERI:</span>
          <span class="value eri-floor">0.72 (Floor 0.80)</span>
        </div>
        <div class="metric">
          <span class="label">PRESSURE:</span>
          <span class="value pressure-18">18 units</span>
        </div>
        <div class="metric">
          <span class="label">STATUS:</span>
          <span class="value status-reconciling">RECONCILING</span>
        </div>
      </div>
      
      <div class="details">
        <div class="detail-item">
          <span class="icon">◆</span>
          <span>Service: payment-processor</span>
        </div>
        <div class="detail-item">
          <span class="icon">🔑</span>
          <span>Authority: finance-lead</span>
        </div>
        <div class="detail-item">
          <span class="icon">📦</span>
          <span>Resource: bank-settlement</span>
        </div>
      </div>
      
      <div class="axes-guide">
        <div>Y↓ history_depth</div>
        <div>X→ present_surface</div>
        <div>Z⟷ speculation_outward</div>
      </div>
    </div>
  `,
  
  style: {
    fontFamily: "Rajdhani, monospace",
    background: "linear-gradient(135deg, rgba(10,14,39,0.95), rgba(20,25,60,0.9))",
    border: "1px solid rgba(255,229,127,0.3)",
    borderRadius: "4px",
    padding: "16px",
    width: "260px",
    color: "#E0E0E0",
    boxShadow: "0 4px 20px rgba(0,0,0,0.7), 0 0 40px rgba(255,215,0,0.1)"
  }
}
```

---

## 🎮 **ACTION BUTTONS - BOTTOM CENTER**

```javascript
{
  id: "action_buttons",
  type: "CSS2DObject",
  position: "bottom-center",
  
  buttons: [
    { label: "HOLD", enabled: true, color: "#4CAF50" },
    { label: "RECONCILE", enabled: true, color: "#FFD700", primary: true },
    { label: "FORK", enabled: true, color: "#2196F3" },
    { label: "MERGE", enabled: false, color: "#9E9E9E" },
    { label: "EXPIRE", enabled: true, color: "#F44336" }
  ],
  
  style: {
    display: "flex",
    gap: "8px",
    padding: "12px 24px",
    background: "rgba(10,14,39,0.9)",
    border: "1px solid rgba(255,229,127,0.2)",
    borderRadius: "24px"
  }
}
```

---

## 🗺️ **COORDINATION BASIN - BOTTOM RIGHT MINIMAP**

```javascript
{
  id: "coordination_basin",
  type: "CSS2DObject",
  position: "bottom-right",
  
  minimap: {
    type: "Canvas2D",
    width: 200,
    height: 200,
    
    view: {
      type: "orbital",
      center: [0, 0, 0],
      radius: 1.5,
      rotation: Math.PI / 4
    },
    
    elements: [
      { type: "core", position: [0,0,0], color: 0xFFE57F, size: 8 },
      { type: "node", position: [0.6,-0.2,0.1], color: 0xFFD700, size: 6 },
      { type: "node", position: [0.3,-0.3,0.0], color: 0x4FC3F7, size: 5 },
      { type: "node", position: [0.15,-0.1,0.2], color: 0x00BCD4, size: 4 },
      { type: "node", position: [0.05,-0.35,-0.1], color: 0x7C4DFF, size: 4 }
    ]
  },
  
  label: {
    text: "COORDINATION BASIN",
    position: "top",
    style: {
      fontSize: "10px",
      color: "#FFE57F",
      textAlign: "center"
    }
  }
}
```

---

## 🎬 **ANIMATION SPECIFICATIONS**

### **Continuous Animations**
```javascript
{
  nodesPulse: {
    targets: ["n_invoice_paid", "n_bank_settlement", "n_payment_service", "n_settlement_evidence"],
    property: "scale",
    loop: true,
    easing: "easeInOutSine"
  },
  
  edgesFlow: {
    targets: ["e_depends", "e_asserted", "e_evidenced"],
    type: "particleFlow",
    loop: true
  },
  
  cameraOrbit: {
    target: "camera",
    type: "gentle",
    speed: 0.1,
    radius: [2, 3],
    enabled: true // Auto-orbit when no interaction
  },
  
  godRays: {
    source: [0, 0, 0],
    intensity: 0.3,
    decay: 0.95,
    weight: 0.4,
    samples: 60
  }
}
```

### **Interaction Animations**
```javascript
{
  onNodeHover: {
    scale: 1.2,
    haloScale: 1.5,
    duration: 300,
    easing: "easeOutQuad"
  },
  
  onNodeClick: {
    focusCamera: true,
    duration: 800,
    showDetails: true,
    highlightConnections: true
  },
  
  onEdgeHover: {
    radiusMultiplier: 1.5,
    opacityMultiplier: 1.3,
    highlightNodes: true
  }
}
```

---

## 📏 **RENDER RULES (Applied Globally)**

```javascript
{
  confidenceOpacityMap: {
    // Maps confidence [0-100] to opacity [0.2-1.0]
    function: (confidence) => 0.2 + (confidence / 100) * 0.8,
    examples: {
      72: 0.776,  // InvoicePaid
      90: 0.920,  // BankSettlement
      80: 0.840,  // PaymentService
      85: 0.880   // SettlementEvidence
    }
  },
  
  pressureThicknessMap: {
    // Maps pressure [0-100] to edge radius [0.002-0.02]
    function: (pressure) => 0.002 + (pressure / 100) * 0.018,
    examples: {
      18: 0.00524,  // e_depends
      12: 0.00416,  // e_asserted
      6: 0.00308    // e_evidenced
    }
  },
  
  deltaPRHeatMap: {
    // Maps deltaPR [0-100] to color temperature
    function: (deltaPR) => {
      if (deltaPR === 0) return 0xFFFFFF;  // White
      if (deltaPR < 20) return 0xFF9800;   // Orange
      if (deltaPR < 50) return 0xFF5722;   // Deep Orange
      return 0xF44336;                      // Red
    },
    examples: {
      0: "#FFFFFF",   // Cold (aligned)
      14: "#FF9800",  // Warm (minor divergence)
      50: "#FF5722",  // Hot (major divergence)
      100: "#F44336"  // Critical (severe divergence)
    }
  },
  
  pulseRateFromPressure: {
    // Maps pressure [0-100] to pulse frequency [0-1.5 Hz]
    function: (pressure) => (pressure / 100) * 1.5,
    examples: {
      18: 0.27,  // InvoicePaid (visible pulse)
      12: 0.18,  // PaymentService (moderate)
      8: 0.12,   // BankSettlement (slow)
      6: 0.09    // SettlementEvidence (very slow)
    }
  },
  
  halotightnessFromConfidence: {
    // Maps confidence [0-100] to halo scale [0.05-0.20]
    // Higher confidence = tighter halo
    function: (confidence) => 0.20 - (confidence / 100) * 0.15,
    examples: {
      90: 0.065,  // Very tight (high confidence)
      85: 0.0725,
      80: 0.08,
      72: 0.092   // Looser (lower confidence)
    }
  }
}
```

---

## 🔊 **AUDIO SPECIFICATIONS** (Optional)

```javascript
{
  ambience: {
    track: "deep-space-hum.ogg",
    volume: 0.3,
    loop: true
  },
  
  nodeHover: {
    sound: "soft-ping.ogg",
    volume: 0.5,
    pitch: (confidence) => 0.8 + (confidence / 100) * 0.4
  },
  
  pressurePulse: {
    sound: "pressure-wave.ogg",
    volume: (pressure) => (pressure / 100) * 0.6,
    interval: (pressure) => 1000 / ((pressure / 100) * 1.5),
    enabled: true
  },
  
  divergenceAlert: {
    sound: "warning-tone.ogg",
    volume: 0.7,
    trigger: "deltaPR > 20",
    enabled: true
  }
}
```

---

## 🎯 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Core Rendering** ✅
- [ ] Set up Three.js scene with PerspectiveCamera
- [ ] Add star field background
- [ ] Create 4 node geometries with correct materials
- [ ] Apply confidence → opacity mapping
- [ ] Add halos with confidence → scale mapping
- [ ] Implement pulse animations with pressure → rate mapping

### **Phase 2: Edges & Flow** ✅
- [ ] Create 3 edge paths (1 curved, 2 straight)
- [ ] Apply pressure → thickness mapping
- [ ] Apply deltaPR → heat color mapping
- [ ] Add particle flow along edges
- [ ] Add directional arrows
- [ ] Implement dashed line for ASSERTED_BY

### **Phase 3: HUD & Interaction** ✅
- [ ] Build left panel HUD with CSS2D
- [ ] Display metrics from selected node
- [ ] Add action buttons at bottom
- [ ] Create minimap in bottom-right
- [ ] Wire up click/hover interactions

### **Phase 4: Polish** ✅
- [ ] Add god rays / lens flares
- [ ] Implement gentle camera orbit
- [ ] Add depth of field post-processing
- [ ] Optimize for 60fps
- [ ] Add audio feedback (optional)

---

## 📦 **EXPORT FORMAT**

This spec can be directly consumed by:

```javascript
import { RelayFilamentRenderer } from './RelayFilamentRenderer';
import renderSpec from './relay-filament-invoice-payment.json';

const renderer = new RelayFilamentRenderer({
  container: document.getElementById('relay-3d-canvas'),
  renderSpec: renderSpec
});

renderer.render();
renderer.enableInteraction();
```

---

**Status**: Ready for Three.js implementation  
**Estimated Complexity**: ~800 lines of renderer code + ~400 lines of interaction logic  
**Performance Target**: 60fps @ 1080p on mid-range GPU

**Next**: Implement `RelayFilamentRenderer.js` using this spec as blueprint.
