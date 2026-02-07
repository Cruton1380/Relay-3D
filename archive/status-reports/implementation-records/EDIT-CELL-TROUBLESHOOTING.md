# 🔧 Edit Cell Proof - Troubleshooting Guide

**Issue:** `/proof/edit-cell` route not working properly  
**Status:** Privacy Ladder works ✅, Edit Cell needs debugging ⚠️

---

## Quick Diagnosis Steps

### **Step 1: Check Browser Console**

Navigate to: `http://localhost:5175/proof/edit-cell`

**Look for:**
1. **Blue debug logs:** `🔵 [EditableCellProof] Component rendering...`
   - ✅ **If present:** Component is loading, issue is functional
   - ❌ **If missing:** Component not rendering, check errors

2. **Red error messages:** Import errors, syntax errors, etc.
   - Common: `Cannot find module '../components/filament/utils/...'`
   - Common: `Unexpected token` (syntax error)

### **Step 2: Check Network Tab**

Look for failed module loads:
- `privacyTierResolver.js` - 404?
- `commitBuilder.js` - 404?
- `engageSurfaceLock.js` - 404?

### **Step 3: Check What You See**

**Scenario A: Blank screen**
- **Cause:** Component not mounting
- **Check:** Browser console for errors
- **Fix:** See "Common Fixes" below

**Scenario B: Page loads but cell doesn't work**
- **Cause:** Functional issue (engage logic, locking, etc.)
- **Check:** Console logs when clicking cell
- **Fix:** See "Functional Issues" below

**Scenario C: 3D viewport black/broken**
- **Cause:** React Three Fiber error
- **Check:** Console for Canvas/Three.js errors
- **Fix:** Camera position or geometry issue

---

## Common Fixes

### **Fix 1: Module Import Error**

**Error:** `Cannot find module '../components/filament/utils/commitBuilder'`

**Solution:**
```bash
# Restart Vite dev server (clears module cache)
# Terminal 2: Ctrl+C, then:
npm run dev:frontend
```

### **Fix 2: useState Initial Value Error**

**Error:** `getEndpointProjection is not a function`

**Solution:** Check that `commitBuilder.js` exports are correct:
```javascript
// Should have:
export function getEndpointProjection(filament) { ... }
```

### **Fix 3: POLICY_LEVELS Undefined**

**Error:** `POLICY_LEVELS is not defined`

**Solution:** Check `privacyTierResolver.js` exports:
```javascript
// Should have:
export const POLICY_LEVELS = { ... };
```

### **Fix 4: React Three Fiber Canvas Error**

**Error:** `Canvas` or `OrbitControls` not found

**Solution:** Verify `@react-three/fiber` and `@react-three/drei` are installed:
```bash
npm list @react-three/fiber @react-three/drei
```

---

## Functional Issues

### **Issue 1: Cell doesn't become editable**

**Symptom:** Click cell, nothing happens

**Debug:**
1. Check policy level (should be L6)
2. Check camera distance (should be < 5 units)
3. Look for console log: `❌ Cannot engage: ...`

**Fix:**
- Ensure policy slider is at L6
- Zoom camera closer (< 5 units)
- Check that `canEngage()` function is working

### **Issue 2: Edit doesn't create commit**

**Symptom:** Can edit cell, but no new commit appears

**Debug:**
1. Check console for: `✅ Commit #X appended`
2. Check if `handleCommit()` is being called
3. Verify `buildCommit()` and `appendCommit()` work

**Fix:**
- Check that blur/Enter key triggers `handleCommit()`
- Verify `buildCommit()` returns valid commit object
- Check that `setFilament()` updates state

### **Issue 3: 3D view doesn't update**

**Symptom:** Commit history updates, but 3D view stays same

**Debug:**
1. Check if `CommitChain` component is re-rendering
2. Verify `filament.timeBoxes` has new commit
3. Check camera position (might need to pan)

**Fix:**
- Ensure `filament` state is updated correctly
- Camera might be focused on old position (zoom out to see new commit)

---

## Expected Behavior Checklist

- [ ] Page loads (no errors)
- [ ] Left panel visible (controls + cell interface)
- [ ] 3D viewport visible (black background + grid)
- [ ] See 1 green cube in 3D (initial commit)
- [ ] Policy slider works (L0-L6)
- [ ] Cell shows "100" initially
- [ ] Click cell at L6 → green border appears
- [ ] Type new value → input editable
- [ ] Press Enter → new cube appears in 3D
- [ ] Commit history shows new entry
- [ ] Cell value updates to new value

---

## Manual Test (Step-by-Step)

1. **Navigate:** `http://localhost:5175/proof/edit-cell`
2. **Verify load:**
   - See "📝 Editable Endpoint Proof" header
   - See cell labeled "A1" with value "100"
   - See 3D viewport with 1 green cube
3. **Verify policy gate:**
   - Set slider to L0-L5
   - Click cell
   - **Expected:** Status shows "❌ Cannot engage"
4. **Verify engage:**
   - Set slider to L6
   - Click cell
   - **Expected:** Green border, status shows "✅ Lock acquired"
5. **Verify edit:**
   - Type "200" in cell
   - Press Enter
   - **Expected:** 
     - New green cube appears in 3D
     - Commit history shows "#1: valueEdit, Value: 200"
     - Cell displays "200"

---

## Debug Information to Share

If the issue persists, share these logs:

**Browser Console:**
```
- All 🔵 [EditableCellProof] logs
- All ❌ or ⚠️ error messages
- Network tab: any 404s on .js files
```

**Terminal Output:**
```
- Vite build errors (if any)
- Module resolution errors
- Hot reload messages
```

**What You See:**
- Screenshot of the page
- Description of what happens when you click cell
- What the console shows when you edit

---

## Quick Reset

If everything is broken:

```bash
# Terminal 2: Stop frontend (Ctrl+C)
# Clean and restart:
npm run clean:logs
rm -rf node_modules/.vite  # Clear Vite cache
npm run dev:frontend
```

Then navigate to: `http://localhost:5175/proof/edit-cell`

---

*Created: 2026-01-27*  
*Status: Troubleshooting in progress*
