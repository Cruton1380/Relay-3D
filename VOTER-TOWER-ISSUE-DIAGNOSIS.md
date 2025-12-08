# Voter Tower Issue - Root Cause Analysis

**Date:** October 22, 2025  
**Status:** 🔴 ROOT CAUSE IDENTIFIED

---

## Problem

When hovering over candidate cubes on the globe, **no voter towers appear**.

Console shows:
```
🗳️ Loading voters for candidate: twat Candidate 3 in channel: twat at level: gps
```

But NO follow-up logs showing voters loaded or rendered.

---

## Root Cause

**Channel ID Mismatch**

- **Voter data generated for:** Old demo channels (`usa-california-san-francisco`, etc.)
- **Current channel in system:** New channel created through UI (`created-1761087996653-4de3ew0hu` - "twat" channel)

The voter visualization API (`/api/visualization/voters/{channelId}/candidate/{candidateId}`) is being called correctly, but returns **empty results** because there are NO voters mapped to the current channel IDs.

---

## What Happens

1. ✅ User hovers over candidate cube
2. ✅ Hover detected, `loadVotersForCandidate()` called
3. ✅ API request sent: `http://localhost:3002/api/visualization/voters/created-1761087996653-4de3ew0hu/candidate/candidate-1761087996622-2-u7hijoryl?level=gps`
4. ❌ API returns: `{ voters: [] }` (empty - no voters exist for this channel)
5. ❌ `renderVotersOnGlobe()` receives empty array
6. ❌ No towers rendered

---

## Evidence

```powershell
# Current channel in system
curl "http://localhost:3002/api/channels"
# Returns: channelId: "created-1761087996653-4de3ew0hu"

# Voter mappings file
cat data/demos/vote-mappings.json
# Contains: "usa-california-san-francisco", "new-york-city-planning", etc.
# Does NOT contain: "created-1761087996653-4de3ew0hu"
```

---

## Solution Options

### Option 1: Use Demo Data Channels (RECOMMENDED - FAST)
**Time:** ~2 minutes

Delete the "twat" channel and use the demo data channels that have 203,950 voters already loaded.

**Steps:**
1. In backend, ensure demo data is loaded (check `src/backend/voting/votingEngine.mjs`)
2. Frontend should show demo channels instead of "twat" channel
3. Hover over demo channel candidates → Voters will appear immediately

### Option 2: Generate Voters for Current Channel (COMPLEX)
**Time:** ~30 minutes

Create voters specifically for the "twat" channel.

**Steps:**
1. Fix the `processVote` function call in voter generation script
2. Handle privacy level validation (no "country", use "anonymous")
3. Run voter generation for current channel only
4. Verify votes are stored in voting engine
5. Test visualization

### Option 3: Use Simple Test Data (QUICK TEST)
**Time:** ~5 minutes

Manually create 10-20 test voters through direct API calls.

**Steps:**
```powershell
# For each candidate, submit mock votes with locations
$body = @{
  userId = "test_voter_001"
  topicId = "created-1761087996653-4de3ew0hu"
  voteType = "FOR"
  candidateId = "candidate-1761087996622-0-d8ikdust4"
  location = @{
    lat = 18.55
    lng = -68.75
    province = "La Altagracia"
    country = "Dominican Republic"
  }
  privacyLevel = "gps"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3002/api/vote/submitVote" -Method POST -Body $body -ContentType "application/json"
```

Repeat for 10-20 voters with different IDs and slightly different lat/lng.

---

## Recommended Action

**Use Option 1**: Switch to demo data channels.

The demo data channels already have:
- ✅ 203,950 voters with locations
- ✅ Vote mappings configured
- ✅ Privacy levels set (40% GPS, 30% City, 20% Province, 10% Anonymous)
- ✅ Geographic distribution across multiple regions

**To verify demo data is loaded:**
```powershell
# Check voting engine has votes
curl "http://localhost:3002/api/channels"
# Should show channels like: "San Francisco Bay Area Development", "New York City Planning", etc.

# Test voter API with demo channel
curl "http://localhost:3002/api/visualization/voters/usa-california-san-francisco/candidate/candidate-sf-001?level=province"
# Should return voters array with coordinates
```

---

## Testing Steps (After Fix)

1. **Backend Check:**
   ```powershell
   curl "http://localhost:3002/api/visualization/voters/{CHANNEL_ID}/candidate/{CANDIDATE_ID}?level=gps"
   ```
   **Expected:** JSON with `voters` array containing location data

2. **Frontend Check:**
   - Open browser DevTools → Console
   - Hover over candidate
   - **Expected logs:**
     ```
     🗳️ Loading voters for candidate: [Name] in channel: [Channel] at level: gps
     🗳️ Loaded X voters: Y visible, Z hidden
     🗳️ Rendering Y visible + Z hidden clusters at gps level
     ```

3. **Visual Check:**
   - **Green cylinders** should appear at voter locations
   - Height scales with voter count
   - Tooltips show voter information

---

## Current System State

**Voter Data Files:**
- ✅ `data/demos/demo-voters.json` (203,950 voters) - For OLD channels
- ✅ `data/users/locations.json` (203,950 locations) - For OLD channels  
- ✅ `data/demos/vote-mappings.json` - For OLD channels
- ❌ No voter data for channel `created-1761087996653-4de3ew0hu`

**Backend:**
- ✅ Running on port 3002
- ✅ Voter visualization API working
- ✅ Returning empty results (correctly) because no data exists

**Frontend:**
- ✅ Hover detection working
- ✅ API calls being made
- ❌ No towers rendering (correctly) because API returns empty

---

## Next Steps

**Immediate:**
1. Verify which channels are actually in the system
2. Choose one of the 3 options above
3. Implement chosen solution
4. Test voter towers appear

**Long-term:**
1. Create a "reset demo data" script that aligns voter data with current channels
2. Add channel management UI to create/delete channels
3. Add voter generation UI for testing

---

**Status:** Awaiting user decision on which option to pursue.



