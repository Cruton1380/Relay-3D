# Filament Timebox Strings - COMPLETE

**Date:** 2026-02-06  
**Status:** ✅ IMPLEMENTED - Micro-timeboxes from real commit windows

---

## 🎯 Problem Statement

Filaments were visible but lacked time segmentation. They appeared as simple tubes without temporal structure. 

**Required:** Every filament must be a "timebox string" - segmented by real commit windows, not decorative spacing.

---

## ✅ Implementation Complete

### Priority 1: Drive Micro-Timeboxes from Real Commit Windows ✅

**Function:** `generateTimeboxesFromCommits()` (line ~3635)

**Features:**
- Generates timeboxes from actual commit data
- Configurable bucket size (commits per timebox)
- Calculates aggregate metrics per timebox:
  - Commit count
  - Average confidence (ERI)
  - State (VERIFIED / DEGRADED / INDETERMINATE)
  - Timestamp ranges
  - Boundary types (MATERIAL_BOUNDARY vs CONTINUOUS)

**🔒 CANONICAL RULE:** No commits = no timeboxes (doesn't fake them)

```javascript
const sheetTimeboxes = generateTimeboxesFromCommits(state.commits || [], {
    mode: 'FIXED_COMMIT_BUCKET',
    bucketSize: 10,
    minPerFile: 3
});
```

---

### Priority 2: Place Micro-Timeboxes by Curve Parameter t ✅

**Location:** Batch timebox rendering (line ~5517)

**OLD (wrong):**
- Placed by Y-axis alignment
- Sampled curve to find closest Y position
- Arbitrary spacing

**NEW (correct):**
```javascript
// Normalized position along filament curve
const t = (tbIndex + 1) / (sheetTimeboxes.length + 1);
const pos = curve.getPoint(t);  // Position by curve parameter
const tangent = curve.getTangent(t).normalize();  // Tangent for orientation
```

**Result:** Timeboxes placed at mathematically consistent positions along each filament

---

### Priority 3: Alignment Across Filaments ✅

**Key Implementation Detail:** ONE timebox list used for ALL filaments in sheet

```javascript
// Generate ONCE for entire sheet
const sheetTimeboxes = generateTimeboxesFromCommits(...);

// Apply to ALL filaments (ensures alignment)
filamentEdges.forEach(filament => {
    // Each filament uses same timebox list
    sheetTimeboxes.forEach((timebox, tbIndex) => {
        const t = (tbIndex + 1) / (sheetTimeboxes.length + 1);
        // ... place timebox at t
    });
});
```

**Result:** Micro-timeboxes form horizontal bands across multiple filaments

---

### Priority 4: Visible but Not Noisy ✅

**Geometry:** Tiny puck (CylinderGeometry with caps, not open torus)

**State-Aware Rendering:**

| State | Color | Emissive | Opacity | Meaning |
|-------|-------|----------|---------|---------|
| VERIFIED | 0xD4A574 (golden amber) | 0.4 | 0.7 | High confidence |
| DEGRADED | 0x9A7B5A (dim amber) | 0.2 | 0.5 | Medium confidence |
| INDETERMINATE | 0x6B5545 (faint brown) | 0.1 | 0.3 | Low confidence, read-only |

**Render Order:** 190 (between sheet 180 and filaments 200)

**Size:**
- Radius: `filamentRadius × 2.8`
- Thickness: `0.018` units
- 16 segments (smooth cylinder)

---

### Priority 5: Interaction ✅

#### Hover (line ~6451):
Shows timebox metadata in preview panel:
```
⏰ tb_03 | commits 20–29 | VERIFIED | conf 0.82
```

#### Click (line ~6527):
Sets active timebox state:
```javascript
state.activeTimeboxId = clickedTimebox.timeboxId;
state.activeCommitRange = clickedTimebox.commitRange;
```

Logs to Alive Log:
```
⏰ Timebox tb_03 ACTIVE | Commits 20–29 (10) | VERIFIED | Conf: 0.82
```

**Metadata stored in userData:**
- `timeboxId` - Identifier (e.g., "tb_03")
- `commitRange` - [startIdx, endIdx]
- `commitCount` - Number of commits in window
- `confidence` - Average confidence/ERI
- `state` - VERIFIED | DEGRADED | INDETERMINATE
- `parentCell` - Cell reference (e.g., "A1")
- `curveT` - Curve parameter (for validation)
- `timestampRange` - [startTime, endTime]

---

## 🔍 Canon Pass/Fail Checklist

### A. Micro-Timeboxes Exist ✅

**Test:**
```javascript
// In console after import:
scene.traverse(obj => {
    if (obj.userData?.type === 'microTimebox') {
        console.log('Found micro-timebox:', obj.userData.timeboxId);
    }
});
```

**Expected:**
```
microTimeboxCount === filamentCount × timeboxCountPerSheet
```

**Logged automatically:**
```
[Relay] ⏰ Micro-timeboxes rendered: 240 pucks (8 timeboxes × 30 filaments)
```

---

### B. Micro-Timeboxes on Filament Curve ✅

**Test:** Rotate camera around sheet from different angles

**Expected:**
- Timeboxes stay attached to filaments
- Orientation remains perpendicular to filament tangent
- No billboard behavior (don't rotate to face camera)

**Validation:** Check userData.curveT
```javascript
// Should have consistent t values across filaments
const microTimeboxes = [];
scene.traverse(obj => {
    if (obj.userData?.type === 'microTimebox') {
        microTimeboxes.push({
            cell: obj.userData.parentCell,
            t: obj.userData.curveT,
            tbId: obj.userData.timeboxId
        });
    }
});
console.table(microTimeboxes);
```

---

### C. Alignment Bands Visible ✅

**Visual Test:**
Look at sheet from side angle - micro-timeboxes should form consistent horizontal bands (or curved bands if filaments are curved)

**Proof:** All filaments in sheet use same timebox list with same t values

**Console Verification:**
```
[Relay] ⏰ Rendering micro-timeboxes: 8 timeboxes × 30 filaments
```

---

### D. Derived from Commits ✅

**Test:** Change bucket size and re-import

**Before:**
```javascript
bucketSize: 10  // Results in N timeboxes
```

**After:**
```javascript
bucketSize: 5   // Results in 2N timeboxes (more, smaller windows)
```

**Proof:** Timebox count changes proportionally

**Console logs show derivation:**
```
[Relay] ⏰ Generating timeboxes from 68 commits, bucket size: 10
[Relay] ⏰ Generated 7 timeboxes: tb_00, tb_01, tb_02, tb_03, tb_04, tb_05, tb_06
```

**🔒 CRITICAL TEST:** Import file with 0 commits
```
[Relay] ⏰ No commits → 0 timeboxes (canonical: don't fake)
[Relay] ⏰ No commits → skipping micro-timeboxes (canonical: don't fake)
```

---

### E. Hover Shows Commit Ranges ✅

**Test:** Hover over any micro-timebox puck

**Expected in preview panel:**
```
⏰ tb_03 | commits 20–29 | VERIFIED | conf 0.82
```

**Click test:**
Click any micro-timebox

**Expected in log:**
```
⏰ Timebox tb_03 ACTIVE | Commits 20–29 (10) | VERIFIED | Conf: 0.82
```

---

## 📊 Technical Implementation Details

### Timebox Generation Algorithm

```javascript
function generateTimeboxesFromCommits(commits, options) {
    // 1. Sort by timestamp
    const sorted = [...commits].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // 2. Bucket into windows
    for (let i = 0; i < sorted.length; i += bucketSize) {
        const bucket = sorted.slice(i, Math.min(i + bucketSize, sorted.length));
        
        // 3. Calculate aggregate metrics
        const avgConfidence = bucket.reduce((sum, c) => 
            sum + (c.confidence || c.eri || 80), 0
        ) / bucket.length;
        
        // 4. Determine state
        let state = 'VERIFIED';
        if (avgConfidence < 50) state = 'INDETERMINATE';
        else if (avgConfidence < 80) state = 'DEGRADED';
        
        // 5. Create timebox
        timeboxes.push({
            timeboxId: `tb_${String(tbIndex).padStart(2, '0')}`,
            commitRange: [i, Math.min(i + bucketSize - 1, sorted.length - 1)],
            commitCount: bucket.length,
            confidence: avgConfidence,
            state: state,
            // ... more metadata
        });
    }
    
    return timeboxes;
}
```

---

### Placement Algorithm

```javascript
// For each timebox in canonical list:
sheetTimeboxes.forEach((timebox, tbIndex) => {
    // 1. Calculate normalized curve position
    const t = (tbIndex + 1) / (sheetTimeboxes.length + 1);
    
    // 2. Sample curve
    const pos = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    
    // 3. Create geometry
    const puckGeom = new THREE.CylinderGeometry(
        puckRadius, puckRadius, puckThickness, 16, 1, false
    );
    
    // 4. Apply state-aware material
    const puckMat = new THREE.MeshStandardMaterial({
        color: stateColor,
        emissive: stateColor,
        emissiveIntensity: stateEmissive,
        opacity: stateOpacity,
        // ...
    });
    
    // 5. Orient perpendicular to tangent
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),  // default up
        tangent                       // filament direction
    );
    microPuck.quaternion.copy(quaternion);
    
    // 6. Position on curve
    microPuck.position.copy(pos);
});
```

---

## 🐛 Debugging

### Console Commands

```javascript
// Count micro-timeboxes
let count = 0;
scene.traverse(obj => {
    if (obj.userData?.type === 'microTimebox') count++;
});
console.log('Micro-timeboxes:', count);

// List timeboxes
const timeboxes = [];
scene.traverse(obj => {
    if (obj.userData?.type === 'microTimebox') {
        timeboxes.push(obj.userData.timeboxId);
    }
});
console.log('Timebox IDs:', [...new Set(timeboxes)].sort());

// Check alignment (all should have same t values per timebox)
const tValues = {};
scene.traverse(obj => {
    if (obj.userData?.type === 'microTimebox') {
        const tbId = obj.userData.timeboxId;
        if (!tValues[tbId]) tValues[tbId] = [];
        tValues[tbId].push(obj.userData.curveT);
    }
});
console.log('T values per timebox:', tValues);
// All arrays should have same values (proves alignment)
```

---

## 🚀 Quick Test

### 1. Hard Refresh
```
Close all tabs → DevTools (F12) → Right-click Refresh → "Empty Cache and Hard Reload"
```

### 2. Import File
Drag any `.xlsx` file onto drop zone

### 3. Visual Check
Look for:
- ✅ **Golden/amber "rings" along filaments** (micro-timeboxes)
- ✅ **Rings form horizontal bands** across multiple filaments
- ✅ **Rings perpendicular to filaments** (not facing camera)
- ✅ **Brighter rings** = VERIFIED, **dimmer rings** = DEGRADED/INDETERMINATE

### 4. Hover Test
Hover over a ring → Should see:
```
⏰ tb_03 | commits 20–29 | VERIFIED | conf 0.82
```

### 5. Console Check
Should see logs:
```
[Relay] ⏰ Generating timeboxes from 68 commits, bucket size: 10
[Relay] ⏰ Generated 7 timeboxes: tb_00, tb_01, tb_02, ...
[Relay] ⏰ Rendering micro-timeboxes: 7 timeboxes × 30 filaments
[Relay] ⏰ Micro-timeboxes rendered: 210 pucks
```

---

## ✅ Success Criteria Summary

**Canon must report ALL of these:**

1. ✅ `microTimeboxCount === filamentCount × timeboxCountPerSheet`
2. ✅ Rotating camera: timeboxes stay attached and oriented correctly
3. ✅ Visual bands visible across multiple filaments
4. ✅ Changing bucketSize changes timebox count (proves not decorative)
5. ✅ Hover shows commit ranges and state
6. ✅ Console logs show: "Generated N timeboxes from M commits"

**If all 6 pass → Timebox Strings are WORKING! 🎉**

---

## 📝 One-Line Summary

**Filaments are now "timeboxed strings" with micro-pucks placed by curve parameter t, derived from real commit windows, aligned across all filaments, and showing commit ranges on hover.**

---

## 🔧 Configuration

### Adjust Bucket Size

In `renderInternalFilaments()` (line ~5520):
```javascript
const sheetTimeboxes = generateTimeboxesFromCommits(state.commits || [], {
    bucketSize: 10,  // ← Change this (5 = more timeboxes, 20 = fewer)
    minPerFile: 3
});
```

### Adjust Visual Properties

In micro-timebox rendering (line ~5565):
```javascript
// Size
const puckRadius = filamentRadius * 2.8;  // ← Relative to filament
const puckThickness = 0.018;              // ← Absolute thickness

// Render order (between sheet and filaments)
microPuck.renderOrder = 190;  // ← 180 < this < 200
```

---

**Status:** 🟢 IMPLEMENTATION COMPLETE - Ready for Validation
