# Issues Found and Fixes Needed

## Problems Identified

### 1. **Overly Verbose Backend Logging** ❌
- Every coordinate generation logs multiple console statements
- ISO code mapping adds extra "✅ Mapped X → Y" logs
- Clutters console and impacts performance

### 2. **Region Assignment Not Working** ❌
- Candidates don't have `region_assignment` with hierarchical data
- Province clustering not displaying properly
- Indonesia and other countries rendering incorrectly

### 3. **Root Cause**
The ISO code changes were made ONLY to the `/generate-coordinates` endpoint, but the actual channel creation uses `unifiedBoundaryService.generateCandidateCoordinates()` which has its OWN internal logic for coordinates and region assignment.

## What Got Broken

### Before (Working)
```
User creates channel → unifiedBoundaryService → assignRegionToCandidate → 
Full region_assignment hierarchy with province/country/continent
```

### After ISO Changes (Broken)
```
User creates channel → unifiedBoundaryService → OLD hardcoded logic → 
No ISO codes, missing region hierarchy
```

## The Real Issue

We fixed `/generate-coordinates` (used by Test Data Panel) but **DIDN'T** fix the actual channel creation path which uses a completely different service!

---

## Required Fixes

### Fix 1: Update `unifiedBoundaryService.mjs`
Need to replace hardcoded ISO map there too with our generated codes.

### Fix 2: Restore Region Assignment
The `region_assignment` object with full hierarchy needs to be added back to each candidate.

### Fix 3: Reduce Logging Verbosity
Remove excessive console.logs that clutter output.

### Fix 4: Test Full Flow
1. Create channel in Italy
2. Verify candidates have province-level clustering
3. Check globe renders candidates in correct provinces
4. Verify hover shows province names

---

## Next Steps

1. **Find `unifiedBoundaryService.mjs`** - locate the actual service
2. **Check its ISO code mapping** - likely has same 33-country hardcode
3. **Update with our generated codes** - apply same fix
4. **Verify region_assignment structure** - ensure full hierarchy returned
5. **Test Indonesia specifically** - check MultiPolygon handling
6. **Reduce console.log spam** - remove excessive logging

---

## Expected Candidate Structure

Each candidate should have:
```javascript
{
  "id": "candidate-1",
  "name": "Candidate Name",
  "location": {
    "lat": 41.9028,
    "lng": 12.4964
  },
  "coordinates": [12.4964, 41.9028],
  "country": "IT",
  "countryName": "Italy",
  "province": "Lazio",
  "city": "Rome",
  "continent": "Europe",
  "region_assignment": {
    "continent": "Europe",
    "country": "Italy",
    "province": "Lazio",
    "city": "Rome",
    "hierarchy": {
      "level": "province",
      "gps": { "lat": 41.9028, "lng": 12.4964 },
      "province": "Lazio",
      "country": "Italy",
      "continent": "Europe"
    }
  }
}
```

This full structure enables:
- ✅ Province-level clustering
- ✅ Country-level aggregation
- ✅ Continent-level grouping
- ✅ GPS-precise positioning
- ✅ Hover tooltips with location details
