# Vote Count Update Testing Checklist

## Quick Test (5 minutes)

### Test 1: Basic Vote
1. ✅ Open browser console (F12)
2. ✅ Click on a boundary channel candidate
3. ✅ Note the current vote count (e.g., "124 votes")
4. ✅ Click the "Vote" button
5. ✅ **Expected Results**:
   - Button turns blue immediately
   - Vote count increases by 1 (124 → 125)
   - Console shows: `🔄 Fresh vote count fetched: {channelId: "...", candidateId: "...", freshCount: 125}`
   - Console shows: `✅ Vote successful: {...}`
   - Count stays at 125 (doesn't revert after 1-2 seconds)

### Test 2: Vote Switching
1. ✅ Vote for Candidate A (note their count, e.g., 125)
2. ✅ Vote for Candidate B (different candidate in same channel)
3. ✅ **Expected Results**:
   - Candidate A's button becomes grey/unvoted
   - Candidate A's count decreases by 1 (125 → 124)
   - Candidate B's button turns blue
   - Candidate B's count increases by 1
   - Console shows: `🔄 Previous candidate count updated: {prevKey: "...", prevCount: 124}`
   - Both counts remain stable

### Test 3: Multiple Candidates
1. ✅ Switch votes between 3-4 different candidates rapidly
2. ✅ **Expected Results**:
   - Each vote updates counts correctly
   - No race conditions (counts don't jump around)
   - UI stays responsive
   - All vote counts are accurate

### Test 4: Refresh & Persistence
1. ✅ Vote for a candidate
2. ✅ Note the vote count
3. ✅ Refresh the page (F5)
4. ✅ **Expected Results**:
   - Voted candidate still shows blue button
   - Vote count matches what it was before refresh
   - Your vote persisted in the backend

## Console Log Guide

### ✅ Good Logs (Everything Working):
```
🔄 Fresh vote count fetched: {channelId: "boundary-123", candidateId: "cand-1", freshCount: 125, resultCount: 125}
✅ Vote successful: {chId: "boundary-123", candId: "cand-1", result: {...}}
```

### ⚠️ Warning Logs (Check These):
```
Vote submission error: ... 
// This means the API call failed - check backend is running

🔄 Fresh vote count fetched: {channelId: "...", candidateId: "...", freshCount: 0, resultCount: 125}
// This means fetchVoteCount returned 0 but API said 125 - possible API inconsistency
```

### ❌ Error Logs (Something Wrong):
```
❌ Vote failed: Failed to register vote: ... 
// The vote submission completely failed - check network tab
```

## Network Tab Verification

1. Open Network tab in DevTools
2. Filter by "vote"
3. Vote for a candidate
4. **Expected Network Calls**:
   - `POST http://localhost:3002/api/vote/demo` → Status 200
     - Response: `{success: true, newCount: 125, ...}`
   - `GET http://localhost:3002/api/vote/counts/candidate/boundary-123/cand-1` → Status 200
     - Response: `{success: true, voteCount: 125}`

## Common Issues & Solutions

### Issue: Vote count doesn't update
**Solution**: Check console for errors, verify backend is running on port 3002

### Issue: Vote count updates then reverts
**Solution**: This was the old bug - should be fixed now! If still happening, check if `loadData()` is being called somewhere

### Issue: Vote button doesn't turn blue
**Solution**: Check console for vote submission errors, verify userId is set correctly

### Issue: Multiple votes show for same user
**Solution**: Clear browser storage and reload: `localStorage.clear()` in console

## Success Criteria

All tests pass if:
- ✅ Vote counts update immediately (within 100ms)
- ✅ Vote counts are accurate and don't revert
- ✅ Vote switching updates both candidates correctly
- ✅ Console logs show fresh counts being fetched
- ✅ No errors in console or network tab
- ✅ Votes persist after page refresh

---

**Status**: Ready for Testing  
**Estimated Time**: 5-10 minutes  
**Prerequisites**: Backend server running on port 3002
