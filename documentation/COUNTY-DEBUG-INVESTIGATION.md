# County Boundaries - Debug Investigation

**Date:** November 21, 2025  
**Status:** 🔍 **INVESTIGATING - Added Debug Logging**

---

## 🔍 **THE PROBLEM**

Counties render successfully but then disappear immediately.

### Console Timeline:

1. ✅ **Counties Load Successfully:**
   ```
   ✅ USA: 3233 counties
   ✅ AFG: 398 counties
   ...
   🎨 Batch 1/9 rendered: +5125 counties (5125 total)
   🔍 USA: Verification - 3233 county entities in viewer, 3233 in tracking map
   ```

2. ⚠️ **Selective Removal Claims 0 Counties:**
   ```
   🛡️ Selective removal complete: 50 removed, 0 protected
   🌍 ✅ SELECTIVE CLEAR COMPLETE: 0 entities remain (0 counties, 0 provinces preserved)
   ```

3. ❌ **Result: ALL 5125 COUNTIES DELETED**

---

## 🔎 **ROOT CAUSE ANALYSIS**

### The `removeOnlyCandidateEntities()` Function

This function is supposed to:
- ✅ **PROTECT** entities with IDs starting with `county-`, `province-`, `city-`, etc.
- ❌ **REMOVE** candidate and vote tower entities

**Expected behavior:**
```javascript
if (entity.id.startsWith('county-')) {
  protectedEntities.push(entity.id); // Should protect 5125 counties
}
```

**Actual behavior:**
- `protectedEntities.length` = 0 (NO counties protected!)
- All entities removed

### Possible Causes:

1. **Entity ID Mismatch:**
   - County entities created with ID: `county-USA-123`
   - Protection check: `entity.id.startsWith('county-')`
   - Should match, but logs show 0 protected

2. **Timing Issue:**
   - Counties added to viewer A
   - GlobalChannelRenderer checking viewer B
   - But both should reference same viewer instance

3. **Entity Structure Issue:**
   - Maybe Cesium entities have `_id` instead of `id`?
   - Maybe `entity.id` is not a string?

---

## 🔧 **DEBUG CHANGES APPLIED**

Modified `GlobalChannelRenderer.jsx` line ~1190 to add extensive logging:

```javascript
// DEBUG: Log first 5 entity IDs to see what we're dealing with
console.log(`🔍 DEBUG: Total entities in viewer: ${allEntities.length}`);
console.log(`🔍 DEBUG: First 5 entity IDs:`, allEntities.slice(0, 5).map(e => e.id));

// Count entity types
let countyCount = 0;
let provinceCount = 0;
let candidateCount = 0;
let otherCount = 0;

// ... (detailed counting logic) ...

console.log(`🛡️ Removal complete: ${removableEntities.length} removed (${candidateCount} candidates, ${otherCount} other), ${protectedEntities.length} protected (${countyCount} counties, ${provinceCount} provinces)`);
```

---

## 📋 **NEXT STEPS**

1. **Test with debug logging** - Click county button and examine console logs
2. **Verify entity IDs** - Check if county entities actually have `id` property
3. **Check viewer instance** - Ensure GlobalChannelRenderer and AdministrativeHierarchy use same viewer
4. **Fix the bug** based on what debug logs reveal

---

## 📊 **EXPECTED DEBUG OUTPUT**

If working correctly:
```
🔍 DEBUG: Total entities in viewer: 5175
🔍 DEBUG: First 5 entity IDs: ['county-USA-1', 'county-USA-2', 'county-USA-3', ...]
🛡️ Removal complete: 50 removed (50 candidates, 0 other), 5125 protected (5125 counties, 0 provinces)
```

If buggy:
```
🔍 DEBUG: Total entities in viewer: 5175
🔍 DEBUG: First 5 entity IDs: [undefined, undefined, undefined, ...]  ← IDs are undefined!
OR
🔍 DEBUG: First 5 entity IDs: ['some-other-format-123', ...]  ← Different ID format!
🛡️ Removal complete: 5175 removed (...), 0 protected (0 counties, 0 provinces)
```

---

## 🎯 **FILES MODIFIED**

1. ✅ `src/frontend/components/workspace/components/Globe/GlobalChannelRenderer.jsx`
   - Line ~1190: Added debug logging to `removeOnlyCandidateEntities()`

---

**STATUS:** Ready for user testing with debug output

