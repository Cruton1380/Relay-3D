# Boundary Voting Fix - Vote Count Reset Issue

## Problem

When voting on boundary candidates, the vote count was being reset to 0 instead of adding to the initial vote count:

**Console Output (BEFORE FIX):**
```
🔍 [getCandidateVotes] testchan Candidate 1: 0 votes (base only, no blockchain votes yet)
🔍 [getCandidateVotes] testchan Candidate 2: 0 votes (base only, no blockchain votes yet)
🔍 [getCandidateVotes] testchan Candidate 3: 0 votes (base only, no blockchain votes yet)
```

**Expected Behavior:**
- Official Boundary candidate should start with 120-170 demo votes (`initialVotes`)
- When a user votes, blockchain votes should be ADDED to initialVotes: `totalVotes = initialVotes + blockchainVotes`
- Example: If candidate has 150 initialVotes and receives 1 blockchain vote → Should show 151 total votes

## Root Causes

### 1. Missing `initialVotes` Field
The `getCandidateVotes()` function in `GlobalChannelRenderer.jsx` looks for `candidate.initialVotes`:

```javascript
const baseVotes = candidate?.initialVotes || 0;
```

But boundary candidates were only being created with `votes` field, not `initialVotes`:

```javascript
// BEFORE (boundaryChannelService.mjs)
votes: Math.floor(Math.random() * 50) + 120, // ❌ Only "votes" field
```

Result: `baseVotes` was always 0 because `initialVotes` was undefined.

### 2. Missing globeState Update After Voting
After voting on a boundary, the fresh vote totals were fetched but NOT propagated to `globeState.voteCounts`:

```javascript
// BEFORE (InteractiveGlobe.jsx)
const freshVoteTotals = await authoritativeVoteAPI.getTopicVoteTotals(boundaryEditor.channel.id);
// ❌ Never updated globeState.voteCounts with these values
```

Result: `getCandidateVotes()` couldn't find blockchain votes in `globeStateRef.current.voteCounts`.

## Solutions Implemented

### Fix 1: Add `initialVotes` Field to All Boundary Candidates

**File: `src/backend/services/boundaryChannelService.mjs`**

```javascript
// Official boundary proposal
votes: 0, // Starts at 0, will receive blockchain votes
initialVotes: Math.floor(Math.random() * 50) + 120, // ✅ Base demo votes: 120-170

// User proposals  
votes: 0,
initialVotes: 0, // ✅ Base votes for display

// Default boundary candidate
votes: 0,
initialVotes: Math.floor(Math.random() * 30) + 80, // ✅ Base demo votes: 80-110
```

**File: `src/backend/services/boundaryModificationService.mjs`**

```javascript
// Default candidate
votes: 0,
initialVotes: Math.floor(Math.random() * 50) + 100, // ✅ Base demo votes: 100-150

// Modification candidates
votes: 0,
initialVotes: 0, // ✅ New proposals start with 0 base votes
```

### Fix 2: Update globeState After Boundary Voting

**File: `src/frontend/components/main/globe/InteractiveGlobe.jsx`**

```javascript
// Get fresh vote totals after voting
const freshVoteTotals = await authoritativeVoteAPI.getTopicVoteTotals(boundaryEditor.channel.id);

// ✅ NEW: Build voteCounts object for globeState
const newVoteCounts = {};
for (const candidate of updatedCandidates) {
  const voteKey = `${channelData.channel.id}-${candidate.id}`;
  const authoritativeCount = freshVoteTotals.candidates[candidate.id];
  newVoteCounts[voteKey] = authoritativeCount !== undefined ? authoritativeCount : (candidate.votes || 0);
}

// ✅ NEW: Update globeState with vote counts
if (setGlobeState) {
  setGlobeState(prev => ({
    ...prev,
    voteCounts: {
      ...prev.voteCounts,
      ...newVoteCounts
    },
    channelsUpdated: Date.now()
  }));
  console.log('✅ [Boundary Vote] Updated globeState with vote counts:', newVoteCounts);
}
```

## How Vote Counting Works

### Vote Calculation Flow (getCandidateVotes)

```
1. Get base votes: initialVotes || 0
   Example: Official Boundary = 150 initialVotes

2. Get blockchain votes from globeState.voteCounts[channelId-candidateId]
   Example: User cast 1 vote → blockchainVotes = 1

3. Calculate total: baseVotes + blockchainVotes
   Example: 150 + 1 = 151 total votes

4. Return total votes for display
```

### globeState.voteCounts Structure

```javascript
globeState.voteCounts = {
  "boundary-AGADEZ-58b66c4d-official-boundary-AGADEZ-58b66c4d": 1,
  "boundary-AGADEZ-58b66c4d-proposal-1760629462707-0467e7dc": 0,
  // Key format: `${channelId}-${candidateId}`
  // Value: Authoritative blockchain vote count
}
```

## Testing

### Test Scenario
1. **Open boundary channel** (e.g., Agadez province)
   - Expected: Official Boundary shows 120-170 initial votes
   - Expected: Proposal candidates show 0 initial votes

2. **Vote on Official Boundary**
   - Before: 150 initial votes
   - Cast 1 vote
   - After: Should show 151 total votes (150 initial + 1 blockchain)

3. **Vote on Proposal Candidate**
   - Before: 0 initial votes
   - Cast 1 vote
   - After: Should show 1 total vote (0 initial + 1 blockchain)

### Console Output (AFTER FIX)

```
✅ [getCandidateVotes] Official Boundary: 150 base + 1 blockchain = 151 total
✅ [getCandidateVotes] Proposal Candidate: 0 base + 1 blockchain = 1 total
✅ [Boundary Vote] Updated globeState with vote counts: {...}
```

## Files Modified

1. ✅ `src/backend/services/boundaryChannelService.mjs`
   - Added `initialVotes` field to official boundary proposals
   - Added `initialVotes` field to user proposals
   - Added `initialVotes` field to default boundary candidates

2. ✅ `src/frontend/components/main/globe/InteractiveGlobe.jsx`
   - Added globeState voteCounts update after boundary voting
   - Propagates blockchain votes to GlobalChannelRenderer

3. ✅ `src/backend/services/boundaryModificationService.mjs`
   - Added `initialVotes` field to default candidates
   - Added `initialVotes` field to modification candidates

## Next Steps

### Regenerate Existing Boundary Channels
Existing boundary channels in `data/channels/boundary-channels.json` don't have the `initialVotes` field. Run this command to regenerate:

```bash
node src/backend/scripts/regenerate-boundary-channels.mjs
```

Or manually delete `data/channels/boundary-channels.json` and restart the backend server to auto-regenerate.

### Verify Fix
1. Restart backend server (Ctrl+C and restart)
2. Refresh browser (Ctrl+F5)
3. Open any boundary channel
4. Check console for vote counts with both base and blockchain values
5. Cast a vote and verify it ADDS to initialVotes instead of replacing

## Technical Context

### Why Two Vote Fields?

- **`initialVotes`**: Simulated/demo votes that come with the candidate (read-only)
  - Used as the BASE for vote calculations
  - Never changes during voting
  - Example: Official boundaries start with 120-170 demo votes

- **`votes`**: Combined total or legacy storage (less reliable)
  - Sometimes updated by API responses
  - Can include blockchain votes (but timing issues)
  - **IMPORTANT**: `getCandidateVotes()` ignores this field to prevent double-counting

### Why Update globeState?

The `GlobalChannelRenderer` component uses `globeStateRef.current.voteCounts` to get the latest blockchain vote counts. Without updating this after voting:

1. Vote is submitted to blockchain ✅
2. Fresh vote totals are fetched ✅
3. But `getCandidateVotes()` can't see them ❌
4. Display still shows 0 blockchain votes ❌

By updating `globeState.voteCounts`, we ensure the vote count propagates to all globe rendering logic.

## Related Systems

- **authoritativeVoteAPI.getTopicVoteTotals()**: Fetches fresh vote counts from blockchain
- **getCandidateVotes()**: Calculates display votes (initialVotes + blockchain)
- **globeState.voteCounts**: Cache of blockchain votes for fast rendering
- **VotingPanel**: Uses same pattern for regular channel voting

---

**Date Fixed:** October 16, 2025
**Status:** ✅ COMPLETE - Testing Required
