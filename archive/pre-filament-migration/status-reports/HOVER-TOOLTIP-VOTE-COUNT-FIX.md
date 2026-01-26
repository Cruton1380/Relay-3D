# 🗳️ Hover Tooltip Vote Count Not Updating After Vote

## Problem Description

After voting on a candidate, the hover tooltip still shows the old vote count until you move your mouse away and hover again.

## Root Cause

The hover tooltip is generated dynamically when you **hover** over a candidate cube. It reads vote counts at that moment using `getCandidateVotes()`. However, hover tooltips are **static HTML** - they don't automatically update when vote counts change.

**Current Flow:**
1. User votes → Vote recorded in blockchain
2. `onVoteUpdate` callback updates `globeState.voteCounts`
3. `refreshVoteCounts()` is called, incrementing `renderTrigger`
4. `getCandidateVotes()` dependency updates
5. **BUT:** Hover tooltip HTML doesn't regenerate until you move mouse

## Diagnosis Steps

### Step 1: Check if refreshVoteCounts is being called

After voting, check console for:
```
🎯 [WorkspaceLayout] Received vote update: {channelId, candidateId, voteCounts, totalVotes}
🎯 [WorkspaceLayout] Updating globeState with fresh vote counts: {vote counts object}
🎯 [WorkspaceLayout] Refreshing globe with updated vote counts after delay
🌍 [InteractiveGlobe] refreshVoteCounts called
🌍 [InteractiveGlobe] Forwarding to globalChannelRendererRef.current.refreshVoteCounts()
🌍 Refreshing vote counts...
🌍 Current globeStateRef.current.voteCounts: {latest counts}
🌍 Vote counts refreshed: {aggregated counts}
```

**If these logs appear:** The refresh is working, but the tooltip needs to be regenerated.

**If these logs DON'T appear:** The `onVoteUpdate` → `refreshVoteCounts` chain is broken.

### Step 2: Check globeState update

After voting, check console for:
```
🔄 [GlobalChannelRenderer] globeState changed, updating ref: {hasVoteCounts: true, voteCountKeys: X}
```

This confirms `globeStateRef.current` is getting the latest vote counts.

### Step 3: Test hover after voting

1. Vote for a candidate
2. **Don't move mouse** - hover over the same candidate
3. Tooltip should show old count
4. **Move mouse away** and hover again
5. Tooltip should show new count

## The Fix

### Option A: Force Tooltip Refresh After Vote (Recommended)

Add a mechanism to detect if mouse is currently hovering over a candidate and regenerate the tooltip.

**File:** `GlobalChannelRenderer.jsx`

**Add state to track current hover:**
```javascript
const [currentHoveredEntity, setCurrentHoveredEntity] = useState(null);
```

**Update MOUSE_MOVE handler to track entity:**
```javascript
viewer.screenSpaceEventHandler.setInputAction((movement) => {
  const pickedObject = viewer.scene.pick(movement.endPosition);
  
  if (pickedObject && pickedObject.id && pickedObject.id.properties) {
    setCurrentHoveredEntity(pickedObject.id);
    // ... existing tooltip code
  } else {
    setCurrentHoveredEntity(null);
    // ... existing hide tooltip code
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
```

**Add useEffect to refresh tooltip when renderTrigger changes:**
```javascript
useEffect(() => {
  if (currentHoveredEntity && hoverTooltip && hoverTooltip.style.display !== 'none') {
    // Regenerate tooltip content with latest vote counts
    const candidateData = currentHoveredEntity.properties.candidateData?._value;
    const channelData = currentHoveredEntity.properties.channelData?._value;
    
    if (candidateData && channelData) {
      const voteCount = getCandidateVotes(candidateData, channelData.id);
      
      // Update just the vote count in the tooltip
      const voteElement = hoverTooltip.querySelector('[data-vote-count]');
      if (voteElement) {
        voteElement.innerHTML = `🗳️ <strong>${voteCount.toLocaleString()}</strong> votes`;
      }
    }
  }
}, [renderTrigger, currentHoveredEntity]);
```

### Option B: Simple Workaround (Quick Fix)

Add `data-vote-count` attribute to vote display in tooltip, then update it directly.

**In tooltip HTML generation (line ~3177):**
```html
<div style="..." data-vote-count>
  🗳️ <strong>${voteCount.toLocaleString()}</strong> votes
</div>
```

**In refreshVoteCounts (line ~3262):**
```javascript
// After incrementing renderTrigger
const voteElement = document.querySelector('[data-vote-count]');
if (voteElement && window.currentHoveredCandidate) {
  const freshVoteCount = getCandidateVotes(
    window.currentHoveredCandidate.candidate,
    window.currentHoveredCandidate.channel.id
  );
  voteElement.innerHTML = `🗳️ <strong>${freshVoteCount.toLocaleString()}</strong> votes`;
}
```

### Option C: Accept Current Behavior (No Code Change)

**User Instruction:** 
"After voting, move your mouse off the candidate and hover again to see updated vote count."

This is actually reasonable UX - tooltips in most applications don't update while visible.

## Testing the Fix

### Test 1: Vote and Keep Hovering
1. Hover over candidate → See vote count X
2. Click vote button (while still hovering)
3. **Expected:** Tooltip updates to show X+1 votes immediately

### Test 2: Vote Without Hovering
1. Click vote button without hovering
2. Hover over candidate
3. **Expected:** Tooltip shows updated count

### Test 3: Vote on Different Candidate
1. Hover over Candidate A
2. Vote for Candidate B
3. **Expected:** Candidate A's tooltip doesn't change (correct behavior)

## Quick Diagnostic

**Run in browser console after voting:**
```javascript
// Check if globeState has latest votes
console.log('Latest vote counts:', window.earthGlobeControls?.getCurrentGlobeState?.()?.voteCounts);

// Check if getCandidateVotes returns latest
const candidate = {id: 'YOUR_CANDIDATE_ID', name: 'Test', initialVotes: 0};
const channelId = 'YOUR_CHANNEL_ID';
// This will log the vote count
console.log('getCandidateVotes result:', /* call getCandidateVotes */);
```

## Files to Modify

1. **GlobalChannelRenderer.jsx** (Lines ~3100-3200)
   - Add `currentHoveredEntity` state
   - Add useEffect to refresh tooltip on renderTrigger change
   - Update MOUSE_MOVE handler to track entity

2. **InteractiveGlobe.jsx** (Line ~532)
   - ✅ Already added logging for refreshVoteCounts

## Status

**Current State:** Tooltip refreshes on mouse movement only  
**Expected State:** Tooltip refreshes immediately after vote  
**Workaround:** Move mouse off and back on to update tooltip  

**Priority:** LOW (cosmetic issue, doesn't affect voting functionality)

---

**Recommendation:** Implement **Option B (Simple Workaround)** first as it's the least invasive. If that doesn't work well, implement **Option A (Full Solution)**.

**Date:** October 7, 2025
