# Panel Architecture Analysis

## Rank Panel System Architecture

### **Answer: SEPARATE FILES with DIFFERENT IMPLEMENTATIONS**

The boundary channel rank panel and normal channel rank panels are **NOT using the same base code**. They are **completely separate implementations** with different features and UI logic.

---

## 📊 Comparison Table

| Feature | ChannelInfoPanel | BoundaryChannelPanel |
|---------|-----------------|---------------------|
| **File Path** | `src/frontend/components/workspace/panels/ChannelInfoPanel.jsx` | `src/frontend/components/main/globe/panels/BoundaryChannelPanel.jsx` |
| **Lines of Code** | 254 lines | 880 lines |
| **Purpose** | Display global/regional/proximity channel candidates | Display boundary proposal candidates with geometry editing |
| **Vote Display** | Fetches from `/api/vote/counts/candidate/{channelId}/{candidateId}` | Uses dual-vote system (initialVotes + blockchain votes) |
| **Vote Button** | Uses `VoteButton` component | Custom inline vote buttons with area delta display |
| **Preview Images** | No preview generation | Generates diff previews using `BoundaryPreviewGenerator.js` |
| **Candidate Selection** | Displays candidates in vertical list | Horizontal scrolling cards with dynamic width calculation |
| **Area Calculations** | Not applicable | Calculates polygon area in km² with delta percentages |
| **Camera Zoom** | No camera control | Zooms to changed boundary area on candidate click |
| **Editing Features** | None | Boundary editor integration (simple/multi-select/drag modes) |
| **Vote Count Format** | `voteCounts[voteKey] = count` | `{ local, foreign, total }` or simple number |
| **Geometry Handling** | Location coordinates only | Full GeoJSON Polygon/MultiPolygon support |

---

## 🏗️ Architecture Details

### **ChannelInfoPanel (Normal Channels)**

```jsx
// Purpose: Generic channel ranking display
// Used for: Global, Regional, Proximity channels
// Features:
//   - Fetches all channels from /api/channels
//   - Loads vote counts per candidate
//   - Simple vote button interaction
//   - No geometry manipulation
//   - Standard card layout
```

**Key Characteristics:**
- ✅ Simpler implementation (254 lines)
- ✅ Generic voting interface
- ✅ Works with location coordinates
- ✅ No preview generation
- ❌ No geometry editing
- ❌ No area calculations

**Vote System:**
```javascript
// Fetches vote count from backend
const countResponse = await fetch(
  `http://localhost:3002/api/vote/counts/candidate/${ch.id}/${candidate.id}`
);
const countData = await countResponse.json();
counts[voteKey] = countData.voteCount;
```

---

### **BoundaryChannelPanel (Boundary Channels)**

```jsx
// Purpose: Specialized boundary proposal display & editing
// Used for: Province/Country boundary channels
// Features:
//   - Preview image generation (diff visualization)
//   - Area calculations with delta percentages
//   - Camera zoom to changed areas
//   - Boundary editor integration
//   - Dynamic card width calculations
//   - GeoJSON polygon handling
```

**Key Characteristics:**
- ✅ Advanced implementation (880 lines - 3.5x larger)
- ✅ Specialized for boundary editing
- ✅ Preview diff generation
- ✅ Area delta calculations
- ✅ Camera zoom to changed regions
- ✅ Multi-mode editing (simple/multi-select/drag)

**Vote System:**
```javascript
// Uses dual-vote system with initialVotes
const getVoteCounts = (candidate) => {
  if (typeof candidate.votes === 'number') {
    return { local: candidate.votes, foreign: 0, total: candidate.votes };
  } else if (candidate.votes && typeof candidate.votes === 'object') {
    const local = candidate.votes.local || 0;
    const foreign = candidate.votes.foreign || 0;
    return { local, foreign, total: local + foreign };
  }
  return { local: 0, foreign: 0, total: 0 };
};
```

**Preview Generation:**
```javascript
// Generates diff images between proposals and official boundaries
import { generateAllPreviews } from '../../../../utils/BoundaryPreviewGenerator.js';

const officialCandidate = sorted.find(c => c.isOfficial);
const previews = generateAllPreviews(sorted, officialCandidate);
setPreviewImages(previews);
```

**Area Calculations:**
```javascript
const formatAreaDelta = (candidate, officialCandidate) => {
  const { proposedArea, deltaArea, deltaPercent } = candidate.areaChange;
  const sign = deltaArea >= 0 ? '+' : '';
  return `${proposedArea.toLocaleString()} km² (${sign}${deltaArea.toLocaleString()} km², ${sign}${deltaPercent.toFixed(2)}%)`;
};
```

---

## 🔄 Code Reuse Potential

### **Could They Share Base Code?**

**Current State:** No shared code - completely separate implementations

**Potential Refactor:** Yes, could extract common functionality into:

1. **BaseChannelPanel** (shared)
   - Candidate card rendering
   - Vote count display
   - Scroll container logic
   - Basic vote submission

2. **ChannelInfoPanel** (extends BaseChannelPanel)
   - Generic channel display
   - Simple vote buttons
   - No geometry handling

3. **BoundaryChannelPanel** (extends BaseChannelPanel)
   - Boundary-specific features
   - Preview generation
   - Area calculations
   - Editor integration

**Recommendation:** Keep separate for now. The boundary panel has too many specialized features (preview generation, geometry editing, area calculations) that would clutter a shared base class.

---

## 📝 Summary

**They are NOT using the same base code.** The panels are:

✅ **Separate Files** - Different file paths  
✅ **Different Implementations** - Unique logic and features  
✅ **Different Purposes** - Generic channels vs. boundary editing  
✅ **Different Sizes** - 254 lines vs. 880 lines (3.5x difference)  
✅ **Different Features** - Vote display vs. geometry manipulation  

The BoundaryChannelPanel is a **specialized, extended version** built for boundary proposal voting and editing, while ChannelInfoPanel is a **generic, simpler version** for standard channel ranking.

---

## 🔧 Related Files

**ChannelInfoPanel Dependencies:**
- `VoteButton.jsx` - Shared vote button component
- `/api/channels` - Channel data endpoint
- `/api/vote/counts/candidate/` - Vote count endpoint

**BoundaryChannelPanel Dependencies:**
- `BoundaryPreviewGenerator.js` - Diff image generation
- `GlobeBoundaryEditor.jsx` - Boundary editing interface
- `naturalEarthLoader.mjs` - GeoJSON polygon data
- Cesium camera API - Globe zoom controls

