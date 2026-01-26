# Handler Lifecycle - Before vs After Fix

## ❌ BEFORE (Broken - Dual Handler Conflict)

```
User clicks "Multiple" button
    ↓
setMode('multiple')
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Main Handler (handlerRef) - STILL ACTIVE                   │
│   ├─ LEFT_CLICK listener                                   │
│   │   ├─ Checks: if (mode === 'multiple') return;         │
│   │   └─ But CONSUMES the event before returning! ❌       │
│   └─ Event never reaches freeform handler                  │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Freeform Handler (freeformHandlerRef) - CREATED            │
│   ├─ LEFT_CLICK listener                                   │
│   └─ NEVER RECEIVES EVENTS ❌                               │
└─────────────────────────────────────────────────────────────┘
    ↓
Result: Markers don't place (main handler blocks clicks)
```

## ✅ AFTER (Fixed - Single Active Handler)

```
User clicks "Multiple" button
    ↓
enableMultipleMode() called
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Main Handler (handlerRef)                                  │
│   ├─ handlerRef.current.destroy() ✅                        │
│   └─ handlerRef.current = null                             │
└─────────────────────────────────────────────────────────────┘
    ↓
setMode('multiple')
    ↓
Freeform useEffect triggers
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Double-check: Destroy main handler again (if exists)       │
│   └─ if (handlerRef.current) destroy() ✅                   │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Freeform Handler (freeformHandlerRef) - ONLY ACTIVE ✅     │
│   ├─ LEFT_CLICK listener                                   │
│   │   ├─ globe.pick(ray, scene) - Get globe coordinates   │
│   │   ├─ Create cyan marker at EXACT position             │
│   │   └─ Update polygon connecting markers                │
│   └─ RECEIVES ALL EVENTS ✅                                 │
└─────────────────────────────────────────────────────────────┘
    ↓
Result: Markers place ANYWHERE on globe (coordinate-based)
```

## 🔄 Mode Transitions

### Edit → Multiple
```
User clicks "Multiple" button
    ↓
enableMultipleMode()
    ├─ Destroy main handler (handlerRef)
    └─ setMode('multiple')
        ↓
    Freeform useEffect activates
        ├─ Double-check: destroy main handler
        └─ Create freeform handler
```

### Multiple → Edit
```
User clicks "Edit" button
    ↓
enableEditMode()
    ├─ Check: if (mode === 'multiple') return early
    ├─ Destroy old handler (if exists)
    └─ Create main handler
        ↓
Freeform useEffect deactivates
    ├─ Destroy freeform handler
    └─ Clear markers/polygon
```

### Multiple → View
```
User clicks "View" button
    ↓
setMode('view')
    ↓
Freeform useEffect deactivates
    ├─ Destroy freeform handler ✅
    └─ Clear markers/polygon ✅
        ↓
Main handler: ALREADY destroyed
    ↓
Only camera controls active
```

## 🎯 Key Safeguards

### 1. enableMultipleMode() Function
- **Purpose:** Clean transition to multiple mode
- **Action:** Destroys main handler BEFORE setting mode
- **Prevents:** Race condition where both handlers active

### 2. Freeform useEffect Double-Check
- **Purpose:** Catch any remaining main handler
- **Action:** Destroys main handler when activating
- **Prevents:** Missed cleanup scenarios

### 3. enableEditMode() Guard
- **Purpose:** Prevent edit handler in multiple mode
- **Action:** Returns early if mode === 'multiple'
- **Prevents:** Creating wrong handler type

### 4. Auto-Enable useEffect Guard
- **Purpose:** Prevent auto-enabling edit during multiple
- **Action:** Checks mode !== 'multiple' before auto-enable
- **Prevents:** Unwanted mode switch

## 🧪 Event Flow Verification

### Correct Event Flow (Multiple Mode)
```
User clicks globe
    ↓
Canvas receives click event
    ↓
Cesium event system
    ↓
Freeform handler (freeformHandlerRef)
    ├─ LEFT_CLICK action fires
    ├─ globe.pick() gets coordinates
    ├─ Marker created at position
    └─ Event fully handled ✅
```

### Broken Event Flow (Before Fix)
```
User clicks globe
    ↓
Canvas receives click event
    ↓
Cesium event system
    ↓
Main handler (handlerRef) - INTERCEPTS FIRST
    ├─ LEFT_CLICK action fires
    ├─ Checks mode === 'multiple'
    ├─ Returns early BUT event consumed ❌
    └─ Event NOT propagated
    ↓
Freeform handler (freeformHandlerRef)
    └─ NEVER RECEIVES EVENT ❌
```

## 📊 Handler State Matrix

| Mode     | Main Handler (handlerRef) | Freeform Handler (freeformHandlerRef) | Result                    |
|----------|---------------------------|---------------------------------------|---------------------------|
| view     | ❌ Destroyed               | ❌ Destroyed                           | Camera only               |
| edit     | ✅ Active                  | ❌ Destroyed                           | Drag vertices             |
| multiple | ❌ Destroyed               | ✅ Active                              | Place markers anywhere ✅ |

---

**Critical Insight:** 
In Cesium, when multiple `ScreenSpaceEventHandler` instances exist on the same canvas, they ALL receive events in the order they were created. Even if a handler "returns early", it has already consumed processing time and may affect event propagation. The solution is to ensure **ONLY ONE handler is active at a time** by explicitly destroying the inactive one.
