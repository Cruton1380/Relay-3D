# Freeform Selection - Marker Persistence Fix

## 🐛 Problem: Markers Immediately Disappearing

**Symptom:** Markers were being placed successfully but immediately cleared after each click.

**Console Evidence:**
```
✅ [FREEFORM SELECT] Placing marker at: 21.279915°, 86.013356°
📊 [FREEFORM SELECT] Markers placed: 1
🧹 [FREEFORM SELECT] Clearing all freeform markers  ← BUG!
🎯 [FREEFORM SELECT] Activating multi-select tool
```

## 🔍 Root Cause Analysis

### The useEffect Infinite Loop

The freeform selection useEffect had this dependency array:
```javascript
}, [mode, cesiumViewer, freeformMarkers.length]); // ← PROBLEM!
```

**The Cycle:**
1. User clicks globe
2. Marker placed: `setFreeformMarkers([...freeformMarkers, newMarker])`
3. **`freeformMarkers.length` changes** (0 → 1)
4. useEffect detects dependency change
5. **Cleanup function runs**: `clearFreeformSelection()`
6. **All markers removed** 
7. Handler re-created (but markers already gone)
8. Repeat on next click

This created an infinite loop where markers could never accumulate because the useEffect would re-run and clear them after EVERY state update.

## ✅ Solution Applied

### 1. Removed Problematic Dependency

**Before:**
```javascript
}, [mode, cesiumViewer, freeformMarkers.length]);
```

**After:**
```javascript
}, [mode, cesiumViewer]); // 🔥 Removed freeformMarkers.length
```

**Why:** The useEffect should ONLY run when:
- Mode changes (switching between view/edit/multiple)
- Cesium viewer initializes

It should NOT re-run when markers are added/removed.

### 2. Fixed Marker Numbering with Ref

**Problem:** Label text used `freeformMarkers.length + 1`, which captured the value at handler creation time (always 0 + 1 = 1).

**Solution:** Use a ref to track count across handler lifetime:

```javascript
// Added ref
const freeformMarkerCountRef = useRef(0);

// In click handler
freeformMarkerCountRef.current += 1;
const markerNumber = freeformMarkerCountRef.current;

label: {
  text: `📍 ${markerNumber}`, // Uses ref count (1, 2, 3, ...)
}
```

### 3. Reset Counter on Clear

```javascript
const clearFreeformSelection = () => {
  // ... remove entities ...
  freeformEntitiesRef.current = [];
  freeformMarkerCountRef.current = 0; // ✅ Reset counter
  setFreeformMarkers([]);
}
```

## 🎯 How It Works Now

### Correct Lifecycle

```
User clicks "Multiple" button
    ↓
useEffect runs (mode changed)
    ├─ Destroy main handler
    ├─ Create freeform handler
    └─ Setup click listeners
    ↓
User clicks globe (1st marker)
    ├─ Handler LEFT_CLICK fires
    ├─ freeformMarkerCountRef.current = 1
    ├─ Create marker entity with label "📍 1"
    ├─ Add to freeformEntitiesRef.current
    └─ setFreeformMarkers([marker1])
    ↓
useEffect does NOT re-run ✅
(freeformMarkers.length not in dependencies)
    ↓
User clicks globe (2nd marker)
    ├─ Handler LEFT_CLICK fires (SAME handler)
    ├─ freeformMarkerCountRef.current = 2
    ├─ Create marker entity with label "📍 2"
    ├─ Add to freeformEntitiesRef.current
    ├─ setFreeformMarkers([marker1, marker2])
    └─ updateSelectionPolygon() (2+ markers)
    ↓
useEffect does NOT re-run ✅
    ↓
Markers persist and accumulate! ✅
```

### State Management Pattern

**State (`freeformMarkers`):**
- Triggers React re-renders
- Used for UI display (marker count)
- Updates after each marker placement

**Ref (`freeformMarkerCountRef`):**
- Does NOT trigger re-renders
- Persists across handler lifetime
- Used for marker numbering

**Ref (`freeformEntitiesRef`):**
- Tracks Cesium entities
- Used for cleanup
- Bypasses React state updates

## 🧪 Testing Verification

**Expected Console Output (Working):**
```
🎯 [FREEFORM SELECT] Activating multi-select tool
📍 [FREEFORM SELECT] Click detected at screen position: {...}
✅ [FREEFORM SELECT] Placing marker at: 21.279915°, 86.013356°
📊 [FREEFORM SELECT] Markers placed: 1
📍 [FREEFORM SELECT] Click detected at screen position: {...}
✅ [FREEFORM SELECT] Placing marker at: 22.222527°, 86.802173°
📊 [FREEFORM SELECT] Markers placed: 2
📍 [FREEFORM SELECT] Click detected at screen position: {...}
✅ [FREEFORM SELECT] Placing marker at: 20.158477°, 87.437357°
📊 [FREEFORM SELECT] Markers placed: 3
```

**No more clearing between markers!** ✅

## 📋 Changes Summary

### Files Modified
- `src/frontend/components/main/globe/editors/GlobeBoundaryEditor.jsx`

### Changes
1. **Line ~66:** Added `freeformMarkerCountRef` ref
2. **Line ~205:** Use ref for marker numbering instead of array length
3. **Line ~303:** Removed `freeformMarkers.length` from useEffect dependencies
4. **Line ~377:** Reset counter in `clearFreeformSelection()`

### Lines Changed
- Added: 4 lines
- Modified: 3 lines
- Total impact: ~7 lines

## 🎉 Expected Behavior

✅ Markers persist after placement
✅ Markers numbered correctly (1, 2, 3, ...)
✅ Polygon appears after 2nd marker
✅ Polygon updates dynamically with each marker
✅ No infinite re-renders
✅ Clean mode switching still works
✅ Markers clear when switching away from multiple mode

## 🔍 Why This Pattern?

**React Best Practice:** useEffect dependencies should only include values that, when changed, should trigger a **full re-setup** of the effect.

**In our case:**
- `mode` changes → YES, need to switch handlers (cleanup + setup)
- `cesiumViewer` changes → YES, need to reinitialize handlers
- `freeformMarkers.length` changes → NO, just internal state update

**The marker array is OUTPUT of the handler, not INPUT.** It should not trigger handler recreation.

---

**Status:** ✅ FIXED - Markers now persist correctly
**Date:** 2025-01-09
**Issue:** useEffect dependency causing infinite loop
**Solution:** Removed array length from dependencies, use ref for numbering
