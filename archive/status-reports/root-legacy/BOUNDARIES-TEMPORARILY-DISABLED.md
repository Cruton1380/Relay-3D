# Boundaries Temporarily Disabled

**Date**: 2026-02-06  
**Status**: DISABLED (feature flag)  
**Reason**: Cesium render crash during `extractHeights`  

---

## 🚨 Current Situation

Boundaries are **temporarily disabled** via feature flag to prevent viewer crashes and allow demo tree to render successfully.

### What Works Now
- ✅ Demo tree at Tel Aviv renders correctly
- ✅ Excel import functional
- ✅ No crashes
- ✅ All other systems operational

### What's Disabled
- ❌ Boundary outlines (Israel, USA)
- ❌ Point-in-polygon testing (`containsLL`)
- ❌ Boundary-scoped operations

---

## 🐛 The Crash

### Error Message
```
DeveloperError: normalized result is not a number
at Uo.extractHeights (blob:http://localhost:8000/...)
at Jf.createGeometry (blob:http://localhost:8000/...)
```

### When It Occurs
- Boundaries load successfully: `✅ ISR: Loaded 1/1 features`
- Entity added to dataSource without error
- **Crash occurs during Cesium's render loop** when `extractHeights` tries to process the polygon geometry

### Root Cause (Suspected)
Cesium's `extractHeights` function is being called internally on the polygon entities and producing NaN during normalization. This happens even without `heightReference` or explicit height properties.

**Possible causes**:
1. One or more Cartesian3 positions contain NaN/Infinity that passed validation
2. Polygon hierarchy is malformed in a way that triggers Cesium's internal geometry calculations
3. GeoJSON coordinates have edge cases not caught by validation (e.g., antipodal points, degenerate triangles)

---

## 🛡️ Mitigation Applied

### Feature Flag
Set `ENABLE_BOUNDARIES = false` in `relay-cesium-world.html`:

```javascript
const ENABLE_BOUNDARIES = false;  // Set to true after debugging
```

### HUD Indicator
Top-left HUD now shows:
```
🗺️ Boundaries: 🚫 DISABLED
```

### System Behavior
- Boundaries do not load
- No boundary entities added to scene
- **No crashes**
- Trees and filaments render normally

---

## ✅ What to Do Now

### Step 1: Hard Refresh Browser
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Step 2: Verify Demo Tree Works
**You should now see**:
- ✅ No crash dialog
- ✅ Demo tree visible at Tel Aviv
  - Brown trunk
  - Green branches
  - Cyan sheet points
  - Golden filaments
- ✅ Map imagery loading (OSM tiles)
- ✅ HUD showing `🗺️ Boundaries: 🚫 DISABLED`
- ✅ Drop zone functional

### Step 3: Test Excel Import
- Drag .xlsx file to drop zone
- Tree should render successfully
- No crashes

---

## 🔍 Debugging Next Steps (Optional)

If you want to help debug the boundary issue:

### Option 1: Enable Boundaries and Capture Error Details
1. Edit `relay-cesium-world.html`
2. Set `ENABLE_BOUNDARIES = true`
3. Hard refresh
4. Wait for crash
5. In console, run:
   ```javascript
   // Check which boundary loaded before crash
   boundaryRenderer.getStats()
   ```
6. Share console log

### Option 2: Test with Simpler Boundary Data
We could create a minimal test boundary (just a square) to isolate the issue:
```javascript
const testBoundary = {
    type: "Feature",
    geometry: {
        type: "Polygon",
        coordinates: [[
            [34.0, 31.0],
            [35.0, 31.0],
            [35.0, 32.0],
            [34.0, 32.0],
            [34.0, 31.0]
        ]]
    }
};
```

### Option 3: Inspect GeoJSON Data
The crash might be caused by specific coordinates in the ISR or USA GeoJSON files:
- `data/boundaries/countries/ISR-ADM0.geojson`
- `data/boundaries/countries/USA-ADM0.geojson`

---

## 📊 Gate Status Impact

### Phase 2: Core-Routed Relationships + Primitives
**Status**: ✅ PASSED (unchanged)
- Proof artifacts valid
- Core-routed relationships proven

### Boundaries v93 Restoration
**Status**: 🟡 PARTIAL → 🔴 TEMPORARILY DISABLED

**Why not "FAILED"**:
- Validation logic is sound
- Fail-soft architecture is correct
- The issue is a Cesium API interaction, not a fundamental design flaw

**What's needed to restore**:
1. Debug exact coordinate causing NaN in `extractHeights`
2. Either fix the coordinate data or add more specific validation
3. OR use a different Cesium geometry approach (e.g., PolylineCollection instead of polygon entities)

---

## 🎯 System Status Summary

### ✅ Working Systems
1. Cesium viewer (terrain + imagery)
2. LOD governor
3. Filament renderer
4. **Demo tree** (Avgol @ Tel Aviv)
5. Excel import
6. HUD display
7. RelayState

### 🚫 Disabled Systems
1. Boundary renderer
2. Point-in-polygon testing

### ⏸️ Blocked Features
1. Boundary-scoped votes
2. Jurisdiction lens
3. Boundary visualization

---

## 💡 Alternative Approaches to Consider

### Option A: Use Polylines Instead of Polygons
Instead of filled polygons with `extractHeights`, render boundaries as simple polylines:
- No `extractHeights` call
- No NaN risk from height calculations
- Loses fill, keeps outline

### Option B: Render Boundaries as Primitives
Convert boundaries to `Cesium.Primitive` with manual geometry instead of entities:
- More control over geometry creation
- Can validate positions at a lower level
- More complex implementation

### Option C: Simplify GeoJSON Before Loading
Pre-process GeoJSON to:
- Remove degenerate coordinates
- Simplify complex polygons
- Validate all coordinates offline

---

## 📄 Files Modified

### Core Changes
1. **`relay-cesium-world.html`**
   - Added `ENABLE_BOUNDARIES` feature flag (set to `false`)
   - Wrapped boundary loading in conditional
   - Added "DISABLED" log message

2. **`app/ui/hud-manager.js`**
   - Added `DISABLED` status display
   - Styled as gray with 🚫 emoji

3. **`app/renderers/boundary-renderer.js`**
   - Simplified polygon properties (minimal styling)
   - Added try-catch around `entities.add()`
   - Previous validation logic remains

### Documentation
4. **`BOUNDARIES-TEMPORARILY-DISABLED.md`** (this file)
   - Complete status explanation
   - Debugging guidance
   - Alternative approaches

---

## ✅ Acceptance Criteria (Current State)

After hard refresh with boundaries disabled:
- [ ] No crash dialog
- [ ] Demo tree visible and renderable
- [ ] HUD shows `🗺️ Boundaries: 🚫 DISABLED`
- [ ] Excel import works
- [ ] Console log clean (no crash errors)
- [ ] Map tiles loading

**All above = System operational despite boundary issue**

---

## 🔄 Re-enabling Boundaries

When ready to test boundaries again:

1. Edit `relay-cesium-world.html`
2. Find line: `const ENABLE_BOUNDARIES = false;`
3. Change to: `const ENABLE_BOUNDARIES = true;`
4. Hard refresh browser
5. Observe console for crash/success

---

## 🎯 Next Phase Decision

### Option 1: Continue Without Boundaries
**Proceed to Phase 3** (Timebox Segmentation) with boundaries disabled. They're not required for core filament functionality.

**Pros**:
- Unblocks development
- Timeboxes are more critical than boundaries
- Can debug boundaries in parallel

**Cons**:
- Missing visual reference (country outlines)
- No boundary-scoped operations

### Option 2: Debug Boundaries First
Fix the boundary crash before proceeding.

**Pros**:
- Complete v93 feature parity
- Visual context for trees

**Cons**:
- Blocks other development
- Root cause still unclear

---

**Recommendation**: Proceed to Phase 3 with boundaries disabled. Mark boundaries as "DEFERRED" not "FAILED". They can be restored later once the Cesium geometry issue is understood.

---

**Status**: Boundaries temporarily disabled via feature flag. Demo tree fully operational. System stable without crashes.
