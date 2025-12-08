# Boundary Channels vs Normal Channels - Architecture Comparison

## Overview
This document explains the relationship between **Boundary Channels** and **Normal Channels**, their shared components, and their differences.

---

## Voting System Architecture

### 🔗 **SHARED** - Both Use Same Blockchain System

Both boundary and normal channels now use the **EXACT SAME** voting infrastructure:

#### Backend (Shared)
- **Blockchain**: `src/backend/blockchain/blockchain.mjs`
- **Vote Routes**: `src/backend/routes/vote.mjs`
- **Vote Counting**: `src/backend/services/authoritativeVoteAPI.mjs`

#### Frontend (Shared)
- **Vote API Client**: `src/frontend/components/workspace/services/apiClient.js`
- **Authoritative Vote API**: `src/frontend/services/authoritativeVoteAPI.js`

### How Voting Works (Identical for Both)

```javascript
// 1. Submit vote to blockchain
const voteData = {
  topic: channelId,           // Channel ID
  choice: candidateId,        // Candidate being voted for
  voteType: 'candidate',
  signature: 'demo-signature',
  publicKey: 'demo-user',
  nonce: Math.random().toString(36).substring(2, 15),
  timestamp: Date.now(),
  signatureScheme: 'ecdsa'
};

await voteAPI.submitVoteAlt(voteData);

// 2. Fetch authoritative vote counts from blockchain
const voteTotals = await authoritativeVoteAPI.getTopicVoteTotals(channelId);

// 3. Update UI with fresh counts
candidates.map(candidate => ({
  ...candidate,
  votes: voteTotals.candidates[candidate.id] || 0
}));
```

**✅ Result**: Both channel types store votes in the same blockchain and use the same counting mechanism.

---

## Panel Component Architecture

### Normal Channels
**Component**: `ChannelTopicRowPanelRefactored.jsx`
- Location: `src/frontend/components/workspace/panels/`
- Uses: `useVoting` hook for vote management
- Features:
  - Vote buttons
  - Candidate cards
  - Vote statistics
  - Expandable options

### Boundary Channels
**Component**: `BoundaryChannelPanel.jsx`
- Location: `src/frontend/components/main/globe/panels/`
- **Relationship**: Independent component (NOT a copy)
- Additional Features:
  - ✅ All normal channel features
  - ➕ Boundary preview images
  - ➕ Edit boundary button
  - ➕ "Propose New" button
  - ➕ Area change calculations
  - ➕ Geographic zoom on candidate click

**Key Difference**: `BoundaryChannelPanel` is an **enhanced version** with geographic features, but it's a **separate component**, not a shared base.

---

## Boundary Editor System

### The Boundary Editor is an **ADD-ON**

```
Normal Channel Flow:
  ChannelTopicRowPanelRefactored
    ↓
  Vote → Update → Display

Boundary Channel Flow:
  BoundaryChannelPanel
    ↓
  Vote → Update → Display
    ↓
  [Edit Boundary Button] → GlobeBoundaryEditor (ADD-ON)
```

### Components Involved

1. **BoundaryChannelPanel** (Main UI)
   - Displays candidates with preview images
   - Shows vote counts
   - Has "Edit" and "Propose New" buttons

2. **GlobeBoundaryEditor** (ADD-ON Module)
   - Location: `src/frontend/components/main/globe/editors/`
   - Activated when user clicks "Edit" or "Propose New"
   - Renders polygon nodes on 3D globe
   - Handles vertex dragging, multi-select, etc.
   - **Hidden** when not editing (via CSS `display: none`)

3. **InteractiveGlobe** (Container)
   - Manages state for both panel and editor
   - Coordinates between panel actions and globe visualization

---

## Data Flow Comparison

### Normal Channels
```
User clicks Vote
  ↓
useVoting hook
  ↓
voteAPI.submitVoteAlt()
  ↓
Blockchain records vote
  ↓
authoritativeVoteAPI.getTopicVoteTotals()
  ↓
Update globeState.voteCounts
  ↓
ChannelTopicRowPanelRefactored re-renders with new counts
```

### Boundary Channels (Now Fixed)
```
User clicks Vote
  ↓
onVote handler in InteractiveGlobe
  ↓
voteAPI.submitVoteAlt()  ✅ SAME AS NORMAL
  ↓
Blockchain records vote  ✅ SAME BLOCKCHAIN
  ↓
authoritativeVoteAPI.getTopicVoteTotals()  ✅ SAME API
  ↓
Update boundaryEditor.channel
  ↓
BoundaryChannelPanel re-renders with new counts
```

**✅ Both now use identical voting infrastructure!**

---

## Will Changes Affect Both?

### ✅ **YES** - Changes to These Will Affect Both:
- Blockchain vote storage (`blockchain.mjs`)
- Vote API endpoints (`vote.mjs`)
- Vote counting logic (`authoritativeVoteAPI.mjs`)
- Vote submission client (`apiClient.js`)

### ❌ **NO** - Changes to These Are Independent:
- `ChannelTopicRowPanelRefactored.jsx` (Normal channels UI)
- `BoundaryChannelPanel.jsx` (Boundary channels UI)
- `GlobeBoundaryEditor.jsx` (Boundary editing - unique to boundaries)
- `useVoting.js` hook (Only used by normal channels)

### ⚠️ **PARTIAL** - These Have Shared Concepts:
- Candidate data structure (similar but boundary candidates have extra fields like `areaChange`, `geometry`)
- Channel data structure (boundary channels have extra fields like `regionCode`, `regionType`)

---

## Summary Table

| Feature | Normal Channels | Boundary Channels | Shared? |
|---------|----------------|-------------------|---------|
| Vote Storage | Blockchain | Blockchain | ✅ YES |
| Vote Counting | authoritativeVoteAPI | authoritativeVoteAPI | ✅ YES |
| Vote Submission | voteAPI.submitVoteAlt() | voteAPI.submitVoteAlt() | ✅ YES |
| Panel Component | ChannelTopicRowPanelRefactored | BoundaryChannelPanel | ❌ NO |
| Editor Component | N/A | GlobeBoundaryEditor | ❌ NO (Boundary only) |
| Vote UI Hook | useVoting | Inline in InteractiveGlobe | ❌ NO |
| Data Structure | Standard candidate | Candidate + geometry | ⚠️ EXTENDED |

---

## Key Architectural Decisions

### 1. **Shared Blockchain = Vote Integrity**
Both channel types use the same blockchain, ensuring:
- ✅ Consistent vote counting
- ✅ Tamper-proof vote records
- ✅ Single source of truth

### 2. **Separate UI Components = Flexibility**
Independent panel components allow:
- ✅ Boundary-specific features (preview images, area changes)
- ✅ Geographic integration (zoom to changes, click to edit)
- ✅ Normal channels remain lightweight

### 3. **Boundary Editor = Modular Add-on**
The boundary editor is:
- ✅ Only loaded when needed
- ✅ Doesn't affect normal channel performance
- ✅ Can be enhanced without touching normal channels

---

## Testing Considerations

### To Test Normal Channels:
1. Open any normal channel
2. Vote on a candidate
3. Check `authoritativeVoteAPI.getTopicVoteTotals(channelId)`

### To Test Boundary Channels:
1. Open a boundary channel (country or province)
2. Vote on a boundary candidate
3. Check `authoritativeVoteAPI.getTopicVoteTotals(channelId)`

### To Verify They Share Same System:
```javascript
// In browser console:
const authAPI = await import('./services/authoritativeVoteAPI.js');
const normalVotes = await authAPI.default.getTopicVoteTotals('normal-channel-id');
const boundaryVotes = await authAPI.default.getTopicVoteTotals('boundary-channel-id');

// Both should return data from same blockchain
```

---

## Conclusion

**Boundary channels and normal channels now use the EXACT SAME voting system (blockchain + authoritativeVoteAPI), but have separate UI components for their unique needs.**

Changes to the **voting infrastructure** will affect both, but changes to **UI components** are independent.

The boundary editor is an **add-on module** that doesn't affect normal channels at all.

✅ **Fixed Issue**: Boundary channels now use proper blockchain voting instead of generic `/api/vote` endpoint!
