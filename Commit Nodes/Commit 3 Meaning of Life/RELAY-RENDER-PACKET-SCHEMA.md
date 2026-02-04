# 🎨 RELAY RENDER PACKET SCHEMA

**Status**: LOCKED ✅  
**Purpose**: Hard interface boundary between backend (math) and frontend (rendering)  
**Type**: Immutable data contract

---

## 🎯 CORE PRINCIPLE

> **"The renderer may only consume render packets. It may not recompute ERI, gradients, or constraints."**

**This prevents**:
- Visualization drift (frontend diverging from backend logic)
- Duplicated logic (math computed twice)
- UI accidentally becoming authoritative (frontend cannot mutate coordination state)

**This enforces**:
- Backend is the single source of truth for all coordination physics
- Frontend is a pure projection layer (read-only)
- All math lives in one place (backend)

---

## 📦 RENDER PACKET STRUCTURE

### **Top-Level Packet**

```json
{
  "packet_version": "1.0.0",
  "timestamp": "2026-02-03T19:30:00.000Z",
  "commit_index": 12345,
  "system_mode": "SIMULATION",
  "anchors": [ /* array of anchor objects */ ]
}
```

**Fields**:
- `packet_version`: Schema version (semantic versioning)
- `timestamp`: When packet was generated (ISO 8601)
- `commit_index`: Current commit in filament (for time navigation)
- `system_mode`: `"SIMULATION"` or `"LIVE"` (critical for safety)
- `anchors`: Array of anchor render objects (see below)

---

## 🏔️ ANCHOR RENDER OBJECT

Each anchor (workflow, policy, task, etc.) has its own render object:

```json
{
  "anchor_id": "procurement-po-12345",
  "anchor_type": "workflow",
  "label": "Purchase Order 12345",
  "position": { "x": 100, "y": 200, "z": 0 },
  "funnel": { /* funnel render data */ },
  "streamlines": [ /* array of streamline objects */ ],
  "membranes": [ /* array of membrane objects */ ],
  "gates": [ /* array of gate objects */ ],
  "scars": [ /* array of scar objects */ ]
}
```

**Fields**:
- `anchor_id`: Unique identifier (string)
- `anchor_type`: `"workflow"`, `"policy"`, `"task"`, `"user"`, etc.
- `label`: Human-readable name
- `position`: 3D coordinates (computed by backend layout engine)
- Sub-objects: funnel, streamlines, membranes, gates, scars (see below)

---

## 🌀 FUNNEL OBJECT (ERI Scalar Potential)

```json
{
  "depth": 0.75,
  "width": 50,
  "color": "#ff6b6b",
  "blur": 0.2,
  "state": "degraded",
  "confidence": 0.8,
  "eri_raw": 0.85,
  "eri_effective": 0.68,
  "tooltip": {
    "eri": "85/100 (high exposure risk)",
    "confidence": "80% (moderate certainty)",
    "state": "Degraded (missing patches)"
  }
}
```

**Fields**:
- `depth`: Funnel depth (0-1, scaled from ERI effective)
- `width`: Funnel width (scope size / blast radius)
- `color`: Hex color (state-based: green verified, yellow degraded, red indeterminate)
- `blur`: Fog amount (0-1, from 1 - confidence)
- `state`: `"verified"`, `"degraded"`, `"indeterminate"`
- `confidence`: Confidence score (0-1)
- `eri_raw`: Raw ERI before confidence modulation (0-1)
- `eri_effective`: Effective ERI (raw × confidence)
- `tooltip`: Hover text for user (pre-formatted by backend)

**Rendering Rule**:
- Depth = `eri_effective`
- Blur = `1 - confidence`
- No crisp funnel if `confidence < 0.5`

---

## 🌊 STREAMLINE OBJECT (ERI Gradient / Flow)

```json
{
  "streamline_id": "stream-001",
  "type": "repair_path",
  "start": { "x": 100, "y": 200, "z": 0 },
  "end": { "x": 150, "y": 180, "z": -10 },
  "thickness": 3.5,
  "color": "#4caf50",
  "state": "allowed",
  "direction_vector": { "dx": 50, "dy": -20, "dz": -10 },
  "gradient_magnitude": 0.45,
  "tooltip": {
    "type": "Repair path (downhill)",
    "slope": "Moderate gradient (0.45)",
    "state": "Allowed (authority valid)"
  }
}
```

**Fields**:
- `streamline_id`: Unique identifier
- `type`: `"repair_path"`, `"commit_flow"`, `"dependency_flow"`, `"pressure_flow"`
- `start`, `end`: 3D coordinates (computed by backend)
- `thickness`: Line thickness (proportional to gradient magnitude)
- `color`: Hex color (green allowed, gray blocked, red overload)
- `state`: `"allowed"`, `"blocked"`, `"proposed"`
- `direction_vector`: Direction of flow (for animation)
- `gradient_magnitude`: |∇E| (slope steepness, 0-1)
- `tooltip`: Hover text

**Rendering Rule**:
- Thickness = `gradient_magnitude × scale_factor`
- Direction = `direction_vector` (normalized)
- Streamlines terminate at membranes if `state == "blocked"`

---

## 🧱 MEMBRANE OBJECT (Constraint Field)

```json
{
  "membrane_id": "stage-gate-1",
  "type": "stage_gate",
  "position": { "x": 200, "y": 200, "z": 0 },
  "active": true,
  "opacity": 0.3,
  "color": "#9e9e9e",
  "label": "Stage 2 Gate (Inactive)",
  "refusal_reason": "Global stage 1 is active; stage 2 actions forbidden",
  "tooltip": {
    "type": "Stage Gate",
    "status": "Closed",
    "reason": "Stage 2 not yet activated by canon"
  }
}
```

**Fields**:
- `membrane_id`: Unique identifier
- `type`: `"stage_gate"`, `"authority"`, `"pressure_budget"`, `"cognitive_load"`, `"federation_boundary"`
- `position`: 3D coordinates of membrane center
- `active`: `true` (constraint is blocking), `false` (constraint not active)
- `opacity`: Transparency (0-1, only visible when active)
- `color`: Hex color (gray inactive, red overload, yellow warning)
- `label`: Short description
- `refusal_reason`: Why this constraint is blocking (if active)
- `tooltip`: Hover text with explanation

**Rendering Rule**:
- Membranes are **invisible** when `active == false`
- When `active == true`: translucent surface with label on hover
- Streamlines terminate on membrane surface

---

## 🚪 GATE OBJECT (Discrete Valve in Membrane)

```json
{
  "gate_id": "auth-gate-001",
  "type": "authority_gate",
  "position": { "x": 220, "y": 200, "z": 0 },
  "state": "closed",
  "reason": "Authority expired (2026-01-15)",
  "passable_actions": [],
  "tooltip": {
    "gate": "Authority Gate",
    "status": "Closed",
    "reason": "authorityRef expired, renewal required"
  }
}
```

**Fields**:
- `gate_id`: Unique identifier
- `type`: `"authority_gate"`, `"stage_gate"`, `"budget_gate"`, `"load_gate"`
- `position`: 3D coordinates
- `state`: `"open"` (action allowed), `"closed"` (refusal)
- `reason`: Why gate is open/closed
- `passable_actions`: Array of action types that can pass (if `state == "open"`)
- `tooltip`: Hover text

**Rendering Rule**:
- `state == "open"`: Green valve icon, passable
- `state == "closed"`: Red valve icon, blocked
- Clicking gate shows `reason` and next steps

**Gate states are NOT UI toggles; they are computed by backend.**

---

## 🪢 SCAR OBJECT (Reconciliation Event)

```json
{
  "scar_id": "merge-001",
  "type": "merge",
  "position": { "x": 180, "y": 190, "z": -5 },
  "timestamp": "2026-02-01T14:30:00.000Z",
  "commits": ["abc123", "def456"],
  "label": "Merged: Procurement dispute resolved",
  "permanent": true,
  "tooltip": {
    "event": "Merge (reconciliation)",
    "date": "2026-02-01",
    "commits": "abc123 + def456",
    "outcome": "Drift closed, branches reconciled"
  }
}
```

**Fields**:
- `scar_id`: Unique identifier
- `type`: `"merge"`, `"reconcile"`, `"fork_close"`
- `position`: 3D coordinates
- `timestamp`: When reconciliation occurred (ISO 8601)
- `commits`: Array of commit hashes involved
- `label`: Short description
- `permanent`: Always `true` (scars never disappear)
- `tooltip`: Hover text with details

**Rendering Rule**:
- Scars are **permanent, darker segments** on filaments
- Clicking scar shows: what diverged, what closed it, which constraints were satisfied

---

## 🔧 SIMULATION VS LIVE MODE

**Critical**: The `system_mode` field at packet level determines system behavior.

```json
{
  "system_mode": "SIMULATION"
}
```

### **SIMULATION Mode**
- ERI gradients compute ✅
- Repair proposals generated ✅
- **No commits executed** ❌
- UI shows: "⚠️ SIMULATION MODE (read-only)"
- All actions return refusals with: `"Cannot execute in SIMULATION mode"`

### **LIVE Mode**
- Proposals gated by constraints ✅
- Commits possible with `authorityRef` ✅
- Refusals enforced ✅
- UI shows: "🟢 LIVE MODE"

**Purpose**:
- Education (safe to explore)
- Demos (show without modifying)
- Testing (verify logic without side effects)
- Stage 1 proving (test coordination physics safely)

**Rule**: Backend **must** check `system_mode` before executing any state-changing action.

---

## 🛡️ IMMUTABILITY RULES

### **Frontend MUST NOT**:
- ❌ Recompute ERI from (I, R, P)
- ❌ Recompute gradients from dependency graph
- ❌ Apply constraint filters
- ❌ Generate refusals
- ❌ Mutate coordination state
- ❌ Decide gate open/closed status

### **Frontend MAY**:
- ✅ Render funnel depth/color/blur from packet
- ✅ Render streamlines with thickness/direction from packet
- ✅ Show/hide membranes based on `active` flag
- ✅ Display gate states as computed by backend
- ✅ Apply camera transforms, zoom, pan, rotate (view-only)
- ✅ Interpolate animations between packet updates (smooth transitions)

**If frontend needs derived data, backend must compute it and include it in the packet.**

---

## 📋 VALIDATION CHECKLIST

Canon's implementation is correct if:

- [ ] **Render packets are the ONLY input to the renderer**
- [ ] **Frontend never calls ERI computation functions**
- [ ] **Frontend never calls gradient computation functions**
- [ ] **Frontend never calls constraint filter functions**
- [ ] **`system_mode` is checked before every state-changing action**
- [ ] **Simulation mode blocks all commits**
- [ ] **Packet schema matches this spec exactly**
- [ ] **Packets are versioned** (`packet_version` field)
- [ ] **Backwards compatibility** (old renderers can read new packets with minor version bumps)

---

## 🔗 CROSS-REFERENCES

This schema implements the visualization layer for:
- **`RELAY-CONTROL-SYSTEMS-PROOF.md`** — Math definitions (ERI, gradients, gates)
- **`RELAY-3D-VISUALIZATION-SPEC.md`** — Rendering rules (how to draw funnels, streamlines, membranes)
- **`CANON-RELAY-CORE-IMPLEMENTATION.md`** — Backend logic (what computes the packets)

**Backend generates packets → Frontend renders packets → User sees coordination physics**

---

## 📦 EXAMPLE: FULL RENDER PACKET

```json
{
  "packet_version": "1.0.0",
  "timestamp": "2026-02-03T19:30:00.000Z",
  "commit_index": 12345,
  "system_mode": "SIMULATION",
  "anchors": [
    {
      "anchor_id": "procurement-po-12345",
      "anchor_type": "workflow",
      "label": "Purchase Order 12345",
      "position": { "x": 100, "y": 200, "z": 0 },
      "funnel": {
        "depth": 0.75,
        "width": 50,
        "color": "#ff6b6b",
        "blur": 0.2,
        "state": "degraded",
        "confidence": 0.8,
        "eri_raw": 0.85,
        "eri_effective": 0.68,
        "tooltip": {
          "eri": "85/100 (high exposure risk)",
          "confidence": "80% (moderate certainty)",
          "state": "Degraded (missing patches)"
        }
      },
      "streamlines": [
        {
          "streamline_id": "stream-001",
          "type": "repair_path",
          "start": { "x": 100, "y": 200, "z": 0 },
          "end": { "x": 150, "y": 180, "z": -10 },
          "thickness": 3.5,
          "color": "#4caf50",
          "state": "allowed",
          "direction_vector": { "dx": 50, "dy": -20, "dz": -10 },
          "gradient_magnitude": 0.45,
          "tooltip": {
            "type": "Repair path (downhill)",
            "slope": "Moderate gradient (0.45)",
            "state": "Allowed (authority valid)"
          }
        }
      ],
      "membranes": [
        {
          "membrane_id": "stage-gate-1",
          "type": "stage_gate",
          "position": { "x": 200, "y": 200, "z": 0 },
          "active": true,
          "opacity": 0.3,
          "color": "#9e9e9e",
          "label": "Stage 2 Gate (Inactive)",
          "refusal_reason": "Global stage 1 is active; stage 2 actions forbidden",
          "tooltip": {
            "type": "Stage Gate",
            "status": "Closed",
            "reason": "Stage 2 not yet activated by canon"
          }
        }
      ],
      "gates": [
        {
          "gate_id": "auth-gate-001",
          "type": "authority_gate",
          "position": { "x": 220, "y": 200, "z": 0 },
          "state": "closed",
          "reason": "Authority expired (2026-01-15)",
          "passable_actions": [],
          "tooltip": {
            "gate": "Authority Gate",
            "status": "Closed",
            "reason": "authorityRef expired, renewal required"
          }
        }
      ],
      "scars": [
        {
          "scar_id": "merge-001",
          "type": "merge",
          "position": { "x": 180, "y": 190, "z": -5 },
          "timestamp": "2026-02-01T14:30:00.000Z",
          "commits": ["abc123", "def456"],
          "label": "Merged: Procurement dispute resolved",
          "permanent": true,
          "tooltip": {
            "event": "Merge (reconciliation)",
            "date": "2026-02-01",
            "commits": "abc123 + def456",
            "outcome": "Drift closed, branches reconciled"
          }
        }
      ]
    }
  ]
}
```

---

## 🔒 FINAL LOCK

**"If the renderer can compute it, the packet should have already computed it."**

**Backend is physics. Frontend is projection. This boundary is immutable.**

---

**Status**: LOCKED ✅  
**Version**: 1.0.0  
**Next**: Backend implements packet generation; Frontend implements packet consumption.
