# Path Forward - Implementation Roadmap

**Date**: 2026-02-06  
**Based on**: Crypto-Geometric Architecture Spec

---

## 🎯 Vision: Complete Crypto-Geometric System

**What We're Building**:
- **3D Globe**: Companies as trees anchored to real locations
- **Merkle Validation**: Tamper-evident history without exposing private data
- **Root System**: Commitments bundle down (leaves → branches → company → region → core)
- **Privacy**: Encrypted data + public hashes + signatures
- **Verification**: Core validates integrity without decryption

---

## 📊 Current State (Phase 2.1)

### ✅ Implemented
1. **ENU Coordinate System** (`app/utils/enu-coordinates.js`)
   - All geometry in meters, not degrees
   - `createENUFrame()`, `enuToWorld()` functions
   - `CANONICAL_LAYOUT` constants

2. **Primitives Rendering** (`app/renderers/filament-renderer.js`)
   - Trunk: Vertical cylinder (PolylineGeometry)
   - Branches: Horizontal ribs (CorridorGeometry, parallel +East)
   - Filaments: Staged (Cell→Spine→Branch, primitives)
   - Anchor: Cyan pin (independent of buildings)

3. **Validation Gates** (Single Branch Proof)
   - Gate 1: Single branch isolation
   - Gate 2: ENU→World conversion validation
   - Gate 3: Camera locked to branch
   - Gate 4: Anchor marker (no buildings dependency)
   - Gate 5: Staged filaments verification

4. **Visual Topology**
   - Sheets: Horizontal planes above branches
   - Cells: 8×6 grid on sheets
   - Timeboxes: Rings on trunk/branches
   - Filaments: Convergent (not spaghetti)

### ⏳ Awaiting Verification
- User needs to verify Gates 1-5 PASS
- Capture proof artifacts (screenshots + console log)

---

## 🗺️ Implementation Phases

### Phase 2.1: Primitives Migration (CURRENT)
**Status**: ✅ Implemented, ⏳ Awaiting verification

**Deliverables**:
- [x] ENU coordinate system
- [x] Primitives for trunk/branches/filaments
- [x] Anchor marker (independent of buildings)
- [x] Single branch proof mode
- [x] Validation gates (1-5)
- [ ] User verification (PASS/REFUSAL decision)
- [ ] Proof artifacts captured

**Blocking**: Phase 3

---

### Phase 2.2: Full Tree Restoration
**Status**: ⏹ Blocked by Phase 2.1 verification

**Requirements**:
- Set `SINGLE_BRANCH_PROOF = false`
- Restore 2 branches, 2 sheets
- Verify primitive counts: `Primitives: ~83`
- Capture TopDown + SideProfile screenshots
- Mark Phase 2.1 as PASSED

**Blocking**: Phase 3

---

### Phase 3: Timebox Segmentation + Turgor Animation
**Status**: ⏹ Blocked by Phase 2.1

**Goal**: Visualize commit history as pulsing timebox rings

**Requirements**:
- Render timeboxes as separate geometric segments
- Implement turgor force animation (pulsing)
- LOD-based timebox visibility
- Dynamic timebox spacing (already implemented)

**Deliverables**:
- Timeboxes pulse based on `openDrifts` and `scarCount`
- Animation runs at 60fps (non-blocking)
- Timeboxes visible at COMPANY/SHEET LOD

---

### Phase 4: Root System Visualization (NEW)
**Status**: ⏹ Blocked by Phase 3

**Goal**: Show history consolidation (many roots → one checkpoint)

**Requirements**:
- Render roots going DOWN from trunk (below ground)
- Show root bundling (many → few → one)
- Render company reconcile node (bright knot below ground)
- Visualize "1:many convergence"

**ASCII Target**:
```
     Trunk
       │
  ═════╪═════  GROUND
       │
   ┌───┴───┐
  R₁  R₂  R₃  ← Many roots (per topic/dept)
   └───┬───┘
       ↓
  Company.Reconcile ← ONE checkpoint
```

**Technical**:
- Use ENU -Z (down) for root positions
- Roots as thin PolylineGeometry (width: 2-3px)
- Bundling via progressive convergence
- Checkpoint node as bright sphere primitive

---

### Phase 5: Merkle Tree Data Layer (NEW)
**Status**: ⏹ Blocked by Phase 4

**Goal**: Implement cryptographic validation layer

**Requirements**:
- Define data structures (`Leaf`, `TimeboxCheckpoint`, `BranchCheckpoint`, etc.)
- Implement Merkle tree computation
- Add signature verification
- Create key registry (who can sign what)

**Deliverables**:
- `core/crypto/merkle-tree.js` - Merkle root computation
- `core/crypto/signature.js` - Signature creation/verification
- `core/models/checkpoint.js` - Checkpoint data structures
- Console logs show Merkle roots at each level

**Example Console Output**:
```
[Crypto] Timebox W06:
  Leaves: 48
  Merkle Root: 0x1234abcd...
  Signature: Valid ✅
  
[Crypto] Branch operations:
  Timeboxes: 52
  Merkle Root: 0x5678ef01...
  Signature: Valid ✅
  
[Crypto] Company avgol:
  Branches: 3
  Merkle Root: 0x9abc2345...
  Signature: Valid ✅
```

---

### Phase 6: Regional Basin Visualization (NEW)
**Status**: ⏹ Blocked by Phase 5

**Goal**: Show multiple companies in same region

**Requirements**:
- Render multiple companies (trees) in same geographic area
- Show regional checkpoint node (below all companies)
- Visualize relationships (edges between company checkpoints)
- Regional Merkle root computation

**ASCII Target**:
```
Avgol        TelCo       MedCorp
  │            │            │
  └────────────┼────────────┘
               ↓
        Regional.Checkpoint
```

**Technical**:
- Multiple ENU frames (one per company anchor)
- Relationship edges as PolylineGeometry (company→company)
- Regional checkpoint as large sphere below ground
- Color-coded by relationship type

---

### Phase 7: Global Core Integration (NEW)
**Status**: ⏹ Blocked by Phase 6

**Goal**: Visualize global Merkle tree convergence

**Requirements**:
- Render Earth.Core node (at planet center)
- Show all regional checkpoints feeding into core
- Visualize validation (signature checks, Merkle proofs)
- Global Merkle root computation

**ASCII Target**:
```
EMEA         AMER         APAC
  │            │            │
  └────────────┼────────────┘
               ↓
          Earth.Core
         [coreRoot]
```

**Technical**:
- Core node at Cartesian3(0, 0, 0) (planet center)
- Regional→Core connections as thick polylines
- Core glow effect (shader)
- Validation visualization (green pulses for valid signatures)

---

### Phase 8: Privacy Layer UI (NEW)
**Status**: ⏹ Blocked by Phase 7

**Goal**: User interface for encryption/decryption

**Requirements**:
- Key generation UI (generate keypair)
- Encryption UI (encrypt cell data with recipient public key)
- Decryption UI (decrypt with private key)
- Signature UI (sign commitments)

**Deliverables**:
- Key management panel
- Encrypt/decrypt buttons per cell
- Signature status indicators
- Public key sharing mechanism

---

## 🎯 Immediate Next Steps

### Action 1: Verify Gates 1-5 (USER)
**Instructions**: See `GATES-1-TO-5-IMPLEMENTED.md`

1. Hard refresh browser (Ctrl+Shift+R)
2. Check console for gate logs
3. Verify visual: anchor marker, single branch, staged filaments
4. Report PASS/REFUSAL for each gate

### Action 2: After Verification PASSES
1. Set `SINGLE_BRANCH_PROOF = false`
2. Capture proof artifacts:
   - `archive/proofs/phase2.1-topdown.png`
   - `archive/proofs/phase2.1-sideprofile.png`
   - `archive/proofs/phase2.1-primitives-console.log`
3. Mark Phase 2.1 as PASSED
4. Proceed to Phase 3

---

## 📐 Architecture Principles

1. **Geometry encodes meaning**
   - UP = present visibility (sheets, cells)
   - DOWN = history consolidation (roots, checkpoints)
   - OUT = tree expansion (branches extend +East)

2. **Crypto without exposure**
   - Data encrypted (confidentiality)
   - Hashes public (commitment)
   - Signatures public (authorship)
   - Core validates without decryption

3. **1:Many convergence**
   - Leaves → Spine (many → one)
   - Branches → Company (many → one)
   - Companies → Region (many → one)
   - Regions → Core (many → one)

4. **Merkle trees for integrity**
   - Every checkpoint is a Merkle root
   - Inclusion proofs enable selective disclosure
   - History is append-only (tamper-evident)

5. **Anchor truth is math**
   - Tree geometry uses only ENU frame + meters
   - Buildings/terrain can degrade
   - Tree remains provable

---

## 📚 Key Documentation

**Architecture**:
- `RELAY-CRYPTO-GEOMETRIC-ARCHITECTURE.md` - Complete spec (ASCII art, crypto, geometry)

**Implementation**:
- `GATES-1-TO-5-IMPLEMENTED.md` - Current validation gates
- `SINGLE-BRANCH-PROOF-IMPLEMENTATION.md` - Step-by-step guide
- `PHASE-2.1-IMPLEMENTATION-COMPLETE.md` - Implementation details

**Verification**:
- `GATE-TEST-STATUS.md` - Test instructions
- `PATH-FORWARD-SUMMARY.md` - This file

**Code**:
- `app/utils/enu-coordinates.js` - ENU coordinate system
- `app/renderers/filament-renderer.js` - Primitives rendering
- `relay-cesium-world.html` - Main application

---

## 🚀 Long-Term Vision

**By Phase 8, we'll have**:
- 3D globe with trees at real locations
- Encrypted private data (cells)
- Public Merkle roots (checkpoints)
- Signature-based validation
- Regional and global aggregation
- Core verification without decryption
- User-friendly encryption UI

**This is Relay: crypto-geometric unity.**

---

**Status**: Phase 2.1 complete, awaiting user verification. Gates 1-5 implemented and ready for testing.
