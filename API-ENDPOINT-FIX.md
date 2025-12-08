# API Endpoint Fix - Vote Counts URL Correction ✅

## Problem
Console showing repeated errors when voting:
```
Error fetching vote count: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This error occurred because the frontend was calling a non-existent API endpoint, and the server was returning a 404 HTML error page instead of JSON.

## Root Cause
**Endpoint Mismatch:**
- Frontend was calling: `/api/vote/counts/candidate/:channelId/:candidateId` ❌
- Backend route registered as: `/api/vote-counts/candidate/:channelId/:candidateId` ✅

The backend routes were registered in `routes/index.mjs` as:
```javascript
router.use('/vote-counts', voteCountsRoutes);
```

But the frontend was using the old path `/api/vote/counts/...` which doesn't exist.

## Solution
Updated the frontend to use the correct endpoint path.

### Files Modified

**1. `src/frontend/utils/channelPanelUtils.js`**

Changed `fetchVoteCount()` function (line 20):
```javascript
// Before (WRONG):
const response = await fetch(`http://localhost:3002/api/vote/counts/candidate/${channelId}/${candidateId}`);

// After (CORRECT):
const response = await fetch(`http://localhost:3002/api/vote-counts/candidate/${channelId}/${candidateId}`);
```

Changed `loadAllChannelsAndVotes()` function (line 55):
```javascript
// Before (WRONG):
const countResponse = await fetch(
  `http://localhost:3002/api/vote/counts/candidate/${channel.id}/${candidate.id}`
);

// After (CORRECT):
const countResponse = await fetch(
  `http://localhost:3002/api/vote-counts/candidate/${channel.id}/${candidate.id}`
);
```

## Impact

✅ **Fixes the console errors** - No more "SyntaxError: Unexpected token '<'" messages  
✅ **Improves vote count accuracy** - Fresh vote counts now fetched successfully  
✅ **Reduces noise in console** - Cleaner logs for debugging other issues  
✅ **Better error handling** - API returns proper JSON error responses instead of HTML 404s

## Verification

After this fix, you should see:
- ✅ No more "SyntaxError: Unexpected token '<'" errors
- ✅ Console log: `🔄 Fresh vote count fetched: {channelId: "...", candidateId: "...", freshCount: 1}`
- ✅ Vote counts update correctly
- ✅ Network tab shows 200 OK responses for vote count requests

## Testing

1. Open browser console (F12)
2. Clear console (Ctrl+L)
3. Vote on any boundary channel candidate
4. **Expected**: No errors, clean logs showing vote success
5. **Previously**: Multiple "SyntaxError" messages cluttering console

---

**Status**: ✅ RESOLVED  
**Date**: October 17, 2025  
**Related Fix**: Works with VOTE-COUNT-UPDATE-FIX.md  
**Files Changed**: 1 file, 2 endpoint URLs corrected
