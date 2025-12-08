# 🔧 Save Button Debug Checklist

## What We Just Added

I've added detailed logging at **every step** of the save workflow to help us diagnose exactly where the issue is.

## Testing Steps

### 1. **Refresh Browser**
   - Hard refresh: `Ctrl + Shift + R`
   - This ensures you get the new logging code

### 2. **Open DevTools Console**
   - Press `F12` or `Ctrl + Shift + I`
   - Go to the **Console** tab
   - Keep it visible during testing

### 3. **Open Boundary Panel**
   - Click on India (or any country)
   - Click "Boundaries" from the 3-dot menu
   - **Expected log:** Panel should appear at top-left

### 4. **Click "Add Candidate" Button**
   - Click the green **"+ Add Candidate"** button in the panel
   - **Expected logs to appear:**
     ```
     ➕ Proposing new boundary - enabling editing mode
     📝 Updated boundaryEditor state: {isEditing: true, ...}
     🗺️ [BOUNDARY EDITOR] Initializing editor for [Region Name]
     🎧 [BOUNDARY EDITOR] Registering event listener for boundary-editor-submit
     ✅ [BOUNDARY EDITOR] Event listener registered
     ```
   - **Expected visuals:**
     - Toolbar appears at **bottom of screen** with 3 tool buttons
     - Yellow nodes appear on the globe boundary

### 5. **Click "✓ Confirm" Button**
   - Click the green checkmark button in the toolbar
   - **Expected logs to appear:**
     ```
     ✅ [TOOLBAR] Submit button clicked
     📡 [TOOLBAR] Dispatching boundary-editor-submit event
     📤 [TOOLBAR] Event dispatched
     📥 [BOUNDARY EDITOR] Received submit event from toolbar
     ```
   - **Expected outcome:**
     - New boundary proposal is saved
     - Panel refreshes showing the new candidate

---

## Diagnosis Guide

Based on which logs appear (or don't appear), we can pinpoint the exact issue:

### Scenario A: No "Add Candidate" logs
**Problem:** Add Candidate button not receiving clicks  
**Cause:** CSS issue (pointer-events, z-index)  
**Fix:** Check button CSS, ensure it's clickable

### Scenario B: Add Candidate logs but no toolbar appears
**Problem:** Toolbar conditional not rendering  
**Cause:** `boundaryEditor.isEditing` not triggering toolbar render  
**Fix:** Check toolbar render conditional in InteractiveGlobe

### Scenario C: Add Candidate logs but no "BOUNDARY EDITOR Initializing"
**Problem:** GlobeBoundaryEditor component not mounting  
**Cause:** Component conditional not met  
**Fix:** Check if GlobeBoundaryEditor render condition is satisfied

### Scenario D: Everything logs except "Event listener registered"
**Problem:** useEffect for event listener not running  
**Cause:** Component dependencies issue  
**Fix:** Check useEffect dependencies array

### Scenario E: Toolbar logs but no "Received submit event"
**Problem:** Event not reaching GlobeBoundaryEditor  
**Possible causes:**
1. GlobeBoundaryEditor unmounted after mounting
2. Event listener removed before event fired
3. Event name mismatch
**Fix:** Check component lifecycle, verify event listener still active

### Scenario F: All logs appear but no save
**Problem:** `handleSave()` function failing silently  
**Cause:** API error, network issue, or data validation failure  
**Fix:** Check Network tab for failed API calls, add more logs inside handleSave

---

## What to Report Back

Please tell me:

1. ✅ **Which logs appeared** (copy/paste them if possible)
2. ✅ **Which logs did NOT appear**
3. ✅ **Visual changes you saw** (toolbar appeared? nodes appeared?)
4. ✅ **Any errors** in the console (red text)
5. ✅ **Network tab** - Any failed API calls? (check if you see `/api/channels/boundary/...`)

---

## Current Expected Flow

```
User clicks "Boundaries"
  → Panel renders at (50, 100)
  → Shows 3 existing candidates

User clicks "+ Add Candidate"
  → Log: "➕ Proposing new boundary"
  → Log: "📝 Updated boundaryEditor state"
  → isEditing = true
  → GlobeBoundaryEditor mounts (hidden, just logic)
  → Log: "🗺️ Initializing editor"
  → Log: "🎧 Registering event listener"
  → Log: "✅ Event listener registered"
  → Toolbar appears at bottom
  → Yellow nodes appear on globe

User drags nodes around
  → Nodes move
  → Camera stays fixed

User clicks "✓ Confirm"
  → Log: "✅ [TOOLBAR] Submit button clicked"
  → Log: "📡 [TOOLBAR] Dispatching event"
  → Log: "📤 [TOOLBAR] Event dispatched"
  → Event travels to GlobeBoundaryEditor
  → Log: "📥 [BOUNDARY EDITOR] Received submit event"
  → handleSave() executes
  → POST to /api/channels/boundary/:id/proposal
  → Success! New candidate appears in panel
```

---

## Quick Commands

**If frontend not responding:**
```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Restart dev server
npm run dev:frontend
```

**If backend not responding:**
```powershell
# In workspace root
node src/backend/server.mjs
```

**Clear browser cache:**
- `Ctrl + Shift + Delete` → Clear cache
- Or hard refresh: `Ctrl + Shift + R`

---

## Success Criteria

✅ All logs appear in order  
✅ Toolbar visible at bottom  
✅ Nodes editable  
✅ Save creates new candidate in panel  
✅ No errors in console  

Once save works, we'll tackle multi-node selection next! 🎯
