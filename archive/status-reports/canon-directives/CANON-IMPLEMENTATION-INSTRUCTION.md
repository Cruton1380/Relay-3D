# Canon Implementation Instruction
## Relay Full System: Core → Filaments → Branches → Globe → Laniakea

**Status:** 🔒 LOCKED AND READY FOR EXECUTION  
**Date:** 2026-02-02

---

## 📄 CRITICAL DOCUMENTS (Read in Order)

1. **`IMPLEMENTATION-LOCKS-CHECKLIST.md`** - 8 locks preventing re-fragmentation (READ FIRST)
2. **`RELAY-FINAL-ARCHITECTURE-SPEC.md`** - Complete canonical specification
3. **`PRE-IMPLEMENTATION-REPORT.md`** - Detailed phase breakdown

---

## 🔒 8 IMPLEMENTATION LOCKS (NON-NEGOTIABLE)

**Before writing any code, verify understanding of:**

### Lock 1: Geospatial Math
- ✅ Correct north/east calculation using cross products
- ❌ NO approximations like `north = (0,1,0)`
- **Test:** Trees stand correctly at any latitude without rolling

### Lock 2: Boundary Extrusion
- ✅ Extrude in LOCAL tangent frame (not world Y)
- ❌ NO simple ExtrudeGeometry without transform
- **Test:** Boundary walls rise perpendicular to globe surface

### Lock 3: Boundary Containment
- ✅ Implement `boundary.containsLL(lat, lon)` using point-in-polygon
- ❌ NO `mesh.containsPoint()` (doesn't exist in Three.js)
- **Test:** Tel Aviv inside Israel, Iraq outside Israel

### Lock 4: Git-Based Boundaries
- ✅ Boundaries loaded ONLY from Git commits
- ❌ NO loading from `/src/data/*.geojson` without commit
- **Test:** Removing commit removes boundary

### Lock 5: LOD Altitude-Based
- ✅ Use `altitude = distFromOrigin - globeRadius`
- ❌ NO simple `camera.position.length()` for LOD
- **Test:** Orbit at constant altitude doesn't thrash LOD

### Lock 6: One Graph Enforcement
- ✅ Lock `sceneRootUUID` and `graphBuildId` at init
- ❌ NO `scene.clear()` or `new THREE.Scene()` in view switches
- **Test:** graphBuildId constant across all view switches

### Lock 7: Safe Language
- ✅ Use "divergence" throughout (code, UI, logs)
- ❌ NO "drift" terminology
- **Test:** Zero "drift" results in UI/code search

### Lock 8: Phase Order (Not Time)
- ✅ Pass/fail gates for each phase
- ❌ NO time promises or hour breakdowns
- **Test:** Clear go/no-go criteria documented

---

## 🚦 GO/NO-GO GATE (Before Phase 2)

**Gate Name:** Phase 2 Entry Clearance

**Required:** Run `npm test contracts.test.js` - ALL tests must pass

**Tests:**
1. ✅ Topology lint passes
2. ✅ Boundary containsLL works (Tel Aviv inside Israel)
3. ✅ Tangent frame alignment correct (right-handed)
4. ✅ LOD stable during 10-second orbit
5. ✅ Scene graph identity stable (graphBuildId unchanged)
6. ✅ Topology lint runs on all triggers

**Decision:**
```
IF all 6 tests pass:
  → PROCEED to Phase 2 (Globe Restoration)
ELSE:
  → BLOCK Phase 2
  → Fix failing tests
  → Re-run gate
```

---

## 📋 PHASE EXECUTION ORDER

### **Phase 1: Last-Mile Fixes**

**Objective:** Current tree canonical and stable

**Tasks:**
1. Apply depthWrite fixes (branches + filaments)
2. Adjust blending mode (filaments additive)
3. Align micro-timeboxes to parent timeboxes
4. Implement topology lint system
5. Enforce one-scene rule (no rebuilds on view switch)
6. Add commit materiality states (DRAFT, HOLD, PROPOSE, COMMIT, REVERT)

**Pass Criteria:**
- ✅ Topology lint passes
- ✅ Filaments visible from all angles (no popping)
- ✅ View switching never changes graphBuildId
- ✅ Final validation test passes (20-40 cell spreadsheet)

**Gate:** ALL criteria must pass before Phase 2

---

### **Phase 2: Globe Restoration**

**Objective:** v93 Globe + boundaries from Git

**Prerequisites:**
- ✅ Phase 1 gate passed
- ✅ `contracts.test.js` passing

**Tasks:**
1. Create 3 new Git commit types (BOUNDARY_DEFINE, TREE_ANCHOR_SET, BOUNDARY_MEMBERSHIP_SET)
2. Implement LODGovernor class
3. Implement geospatial functions (latLonToVector3, getLocalTangentFrame)
4. Restore Globe mesh from v93
5. Source boundary GeoJSON data
6. Implement boundary rendering (extruded curtains)
7. Anchor company tree to Tel Aviv (32.0853°N, 34.7818°E)

**Pass Criteria:**
- ✅ All 7 contracts validated
- ✅ Tree rooted at real lat/lon
- ✅ Tree oriented to surface (local tangent frame)
- ✅ Boundaries as volumetric shells (not spheres)
- ✅ Boundaries loaded from Git commits
- ✅ LOD governor active and subscribed

**Gate:** ALL criteria must pass before Phase 3

---

### **Phase 3: LOD System**

**Objective:** Stable 60fps from Laniakea → Cell

**Tasks:**
1. Implement progressive mesh simplification
2. Implement occlusion culling (frustum + globe + distance)
3. Performance profiling & tuning

**Pass Criteria:**
- ✅ 60fps at all LOD levels
- ✅ No LOD thrash during orbit
- ✅ Smooth transitions between levels

**Gate:** ALL criteria must pass before Phase 4

---

### **Phase 4: Laniakea Layer**

**Objective:** Cosmic context at zoom level 6

**Tasks:**
1. Create Laniakea supercluster structure
2. Implement gradient pressure from supercluster
3. Add background starfield

**Pass Criteria:**
- ✅ Laniakea visible at zoom level 6
- ✅ Hidden at company/sheet zoom
- ✅ Gradient influence subtle but measurable

**Gate:** ALL criteria must pass before Phase 5

---

### **Phase 5: Unification & Polish**

**Objective:** Production-ready system

**Tasks:**
1. Verify all views use single scene (no rebuilds)
2. Implement smooth camera transitions
3. Add keyboard shortcuts (1-6 for zoom levels)
4. Create demo sequence
5. Final performance audit

**Pass Criteria:**
- ✅ Ultimate test passes (Laniakea → Cell → Core trace)
- ✅ All topology lint checks passing
- ✅ No console errors
- ✅ Memory stable (no leaks)

**Completion:** System ready for production

---

## 🎯 ULTIMATE SUCCESS CRITERIA

**User can complete this sequence:**

1. ✅ Start at Laniakea scale
2. ✅ Zoom to Earth (see Globe + trunks)
3. ✅ Zoom to Israel (see country boundary)
4. ✅ Zoom to Tel Aviv (see city + tree)
5. ✅ Zoom to company (see branches + bundles)
6. ✅ Zoom to branch (see internal filaments)
7. ✅ Zoom to filament (see micro-timeboxes)
8. ✅ Zoom to cell (see cell tip anchor)
9. ✅ **Trace cell back to Earth's core**

**WITHOUT:**
- ❌ Filaments collapsing into hub
- ❌ Sheets aggregating
- ❌ Branches teleporting
- ❌ Context disappearing
- ❌ Scene switching
- ❌ FPS dropping below 30

---

## 🚨 FAILURE MODES TO PREVENT

### **Hub Regression**
- **Prevention:** Topology lint runs on all triggers
- **Detection:** Auto-fail with clear error
- **Recovery:** Revert to last passing commit

### **Performance Collapse**
- **Prevention:** LOD governor + culling
- **Detection:** FPS monitoring
- **Recovery:** Aggressive LOD thresholds

### **Boundary Data Quality**
- **Prevention:** Source from trusted GIS
- **Detection:** Visual inspection + containment tests
- **Recovery:** Fallback to bounding boxes

### **Coordinate Precision**
- **Prevention:** Double precision where needed
- **Detection:** Alignment tests
- **Recovery:** Adjust tangent frame calculations

---

## 📊 IMPLEMENTATION SUMMARY

### **What's Already Done:**
- ✅ Fractal filament paths (curved, organic)
- ✅ Direct topology (Cell → Branch, no hub)
- ✅ Micro-timeboxes on filaments
- ✅ Turgor pressure (branch stiffness)
- ✅ Visibility fixes (materials bright enough)

### **What Needs Doing:**
- ⏳ Last-mile fixes (Phase 1)
- ⏳ Globe restoration (Phase 2)
- ⏳ LOD system (Phase 3)
- ⏳ Laniakea layer (Phase 4)
- ⏳ Unification (Phase 5)

### **Risk Level:** LOW (all locks applied, gates defined)

---

## ✅ PRE-FLIGHT CHECKLIST

**Before saying "BEGIN IMPLEMENTATION", verify:**

- [ ] All 8 locks understood and documented
- [ ] `contracts.test.js` skeleton created
- [ ] Current tree visibility confirmed (hard refresh)
- [ ] Development environment ready
- [ ] Git repository clean
- [ ] Backup of current state
- [ ] Data sources identified (GeoJSON boundaries)
- [ ] v93 codebase accessible

---

## 🚀 EXECUTION COMMAND

**To begin implementation:**

```
STATUS: All locks applied ✅
STATUS: All gates defined ✅
STATUS: All contracts documented ✅

COMMAND: BEGIN IMPLEMENTATION
```

**This will:**
1. Start Phase 1 (Last-Mile Fixes)
2. Apply all documented code changes
3. Run validation tests
4. Report pass/fail for Phase 1 gate
5. Await clearance for Phase 2

---

## 🔒 CANONICAL LOCK CONFIRMATION

**These locks prevent the failures seen previously:**

1. ✅ Trees twisting/rolling at different latitudes
2. ✅ Boundary walls leaning incorrectly
3. ✅ Unimplementable containment tests
4. ✅ Duplicate truth sources
5. ✅ LOD thrash during orbit
6. ✅ Hub reintroduction
7. ✅ Terminology inconsistency
8. ✅ Unrealistic time promises

**The system cannot accidentally re-fragment.**

**Canon is cleared for implementation.**

---

🌍 **Core → Filaments → Branches → Globe → Laniakea**  
**One continuous system. No hubs. No shortcuts. Truth preserved at every scale.**

**Implementation is TRULY ready.**
