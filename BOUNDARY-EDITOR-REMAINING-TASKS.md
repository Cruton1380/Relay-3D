# Boundary Editor - Remaining Implementation Tasks
**Date:** October 9, 2025  
**Status:** Partially Complete

## ✅ COMPLETED TODAY

1. **Confirm button works** - Tracks actual vertex count, enables at 3+ vertices
2. **Editor closes after save** - Proper cleanup and state management
3. **Vote display fixed** - Handles both vote formats (number vs {local, foreign})
4. **Layout fixed** - Settings button inline, no overlap
5. **Card headers aligned** - Icon and name on same line
6. **Mode infrastructure** - State management for single/multi/view modes
7. **Cursor changes** - Pointer/crosshair/grab based on mode
8. **New candidates save successfully** - API working, candidates appear in panel

## 🔴 REMAINING TASKS

### Task 1: Complete Multi-Select Tool ⚠️ HIGH PRIORITY
**Status:** Started but not functional  
**Files:** `GlobeBoundaryEditor.jsx`

**What's Done:**
- Mode state management (single/multi/view)
- Cursor changes based on mode
- Click handler checks mode
- selectedVertices state added

**What's Needed:**

1. **Rectangle Selection Visualization**
```javascript
// In GlobeBoundaryEditor.jsx, add entity for selection rectangle
const drawSelectionRectangle = (startPos, endPos) => {
  if (selectionRectRef.current) {
    cesiumViewer.entities.remove(selectionRectRef.current);
  }
  
  // Create rectangle entity
  const rectangle = cesiumViewer.entities.add({
    rectangle: {
      coordinates: Cesium.Rectangle.fromCartesianArray([
        cesiumViewer.camera.pickEllipsoid(startPos),
        cesiumViewer.camera.pickEllipsoid(endPos)
      ]),
      material: Cesium.Color.CYAN.withAlpha(0.3),
      outline: true,
      outlineColor: Cesium.Color.CYAN,
      height: 0
    }
  });
  
  selectionRectRef.current = rectangle;
};
```

2. **Multi-Select Handler Logic**
```javascript
// In LEFT_DOWN handler, mode === 'multi' section:
if (mode === 'multi') {
  const startPos = click.position;
  
  // Store start position
  const selectionStart = {
    x: startPos.x,
    y: startPos.y
  };
  
  // On MOUSE_MOVE, update rectangle
  const moveHandler = (movement) => {
    const endPos = movement.endPosition;
    drawSelectionRectangle(selectionStart, endPos);
  };
  
  // On LEFT_UP, finalize selection
  const upHandler = () => {
    // Get all vertices within rectangle
    const selectedIds = [];
    vertices.forEach(vertex => {
      const screenPos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
        cesiumViewer.scene,
        Cesium.Cartesian3.fromDegrees(vertex.lng, vertex.lat)
      );
      
      if (isPointInRectangle(screenPos, selectionStart, endPos)) {
        selectedIds.push(vertex.id);
        // Highlight vertex
        vertex.entity.point.color = Cesium.Color.ORANGE;
        vertex.entity.point.pixelSize = 20;
      }
    });
    
    setSelectedVertices(selectedIds);
    
    // Clear selection rectangle
    if (selectionRectRef.current) {
      cesiumViewer.entities.remove(selectionRectRef.current);
      selectionRectRef.current = null;
    }
    
    // Remove handlers
    handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
  };
  
  handler.setInputAction(moveHandler, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  handler.setInputAction(upHandler, Cesium.ScreenSpaceEventType.LEFT_UP);
}
```

3. **Multi-Node Drag**
```javascript
// After multi-select, when dragging with selection active:
if (selectedVertices.length > 0) {
  // Calculate delta from original pick point
  const delta = {
    lat: newLat - pickedVertex.lat,
    lng: newLng - pickedVertex.lng
  };
  
  // Apply delta to all selected vertices
  selectedVertices.forEach(vertexId => {
    const vertex = vertices.find(v => v.entity.id === vertexId);
    if (vertex) {
      vertex.lat += delta.lat;
      vertex.lng += delta.lng;
      vertex.entity.position = Cesium.Cartesian3.fromDegrees(
        vertex.lng,
        vertex.lat,
        10000
      );
    }
  });
}
```

**Helper Function:**
```javascript
const isPointInRectangle = (point, rectStart, rectEnd) => {
  const minX = Math.min(rectStart.x, rectEnd.x);
  const maxX = Math.max(rectStart.x, rectEnd.x);
  const minY = Math.min(rectStart.y, rectEnd.y);
  const maxY = Math.max(rectStart.y, rectEnd.y);
  
  return point.x >= minX && point.x <= maxX &&
         point.y >= minY && point.y <= maxY;
};
```

---

### Task 2: Boundary Difference Preview Images ⚠️ HIGH PRIORITY
**Status:** Not started  
**Files:** `BoundaryChannelPanel.jsx`, new `BoundaryPreviewGenerator.js`

**Current State:**
- Placeholder says "📊 Boundary Preview"
- No actual diff visualization

**Implementation Approach:**

1. **Create Canvas-Based Diff Generator**
```javascript
// src/frontend/utils/BoundaryPreviewGenerator.js
export class BoundaryPreviewGenerator {
  static generateDiffImage(originalGeometry, proposedGeometry, width = 200, height = 120) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Calculate bounds
    const bounds = this.calculateBounds([originalGeometry, proposedGeometry]);
    
    // Draw background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);
    
    // Draw original boundary (gray)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 2;
    this.drawPolygon(ctx, originalGeometry, bounds, width, height);
    
    // Draw proposed boundary (cyan)
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
    ctx.lineWidth = 2;
    this.drawPolygon(ctx, proposedGeometry, bounds, width, height);
    
    // Highlight differences (orange)
    ctx.fillStyle = 'rgba(251, 146, 60, 0.3)';
    this.fillDifference(ctx, originalGeometry, proposedGeometry, bounds, width, height);
    
    return canvas.toDataURL();
  }
  
  static calculateBounds(geometries) {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    
    geometries.forEach(geom => {
      geom.coordinates[0].forEach(([lng, lat]) => {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });
    });
    
    return { minLat, maxLat, minLng, maxLng };
  }
  
  static drawPolygon(ctx, geometry, bounds, width, height) {
    const coords = geometry.coordinates[0];
    
    ctx.beginPath();
    coords.forEach(([lng, lat], i) => {
      const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
      const y = height - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.stroke();
  }
}
```

2. **Use in BoundaryChannelPanel**
```jsx
import { BoundaryPreviewGenerator } from '../../utils/BoundaryPreviewGenerator';

// In component:
const [previewImages, setPreviewImages] = useState({});

useEffect(() => {
  if (channel?.candidates) {
    const officialCandidate = channel.candidates.find(c => c.isOfficial);
    
    // Generate preview for each candidate
    const images = {};
    channel.candidates.forEach(candidate => {
      if (!candidate.isOfficial && officialCandidate) {
        images[candidate.id] = BoundaryPreviewGenerator.generateDiffImage(
          officialCandidate.location.geometry,
          candidate.location.geometry
        );
      }
    });
    
    setPreviewImages(images);
  }
}, [channel]);

// In render:
<div style={{
  width: '100%',
  height: '120px',
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: 8,
  marginBottom: 8,
  overflow: 'hidden'
}}>
  {previewImages[candidate.id] ? (
    <img 
      src={previewImages[candidate.id]}
      alt="Boundary difference"
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      📊 Generating preview...
    </div>
  )}
</div>
```

---

### Task 3: Add Image Windows to Normal Channels 🔵 MEDIUM PRIORITY
**Status:** Not started  
**Files:** `ChannelTopicRowPanelRefactored.jsx` or equivalent

**Current State:**
- Normal channels only show text descriptions
- No image preview area

**Implementation:**

1. **Find Normal Channel Card Component**
```bash
# Search for the component that renders normal channel candidates
grep -r "candidate.*card" src/frontend/components/
```

2. **Add Image Section Above Description**
```jsx
{/* Candidate Image/Preview */}
<div style={{
  width: '100%',
  height: '120px',
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: 8,
  marginBottom: 8,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
  {candidate.imageUrl ? (
    <img 
      src={candidate.imageUrl}
      alt={candidate.name}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  ) : (
    <div style={{ fontSize: 12, color: '#94a3b8' }}>
      No image available
    </div>
  )}
</div>

{/* Description (existing) */}
<div className="candidate-description">
  {candidate.description}
</div>
```

3. **Update Candidate Data Structure**
```javascript
// In candidate creation/loading, add imageUrl field:
{
  id: '...',
  name: '...',
  imageUrl: '/path/to/image.jpg', // NEW
  description: '...',
  // ... other fields
}
```

---

### Task 4: Redesign Add Candidate Button 🔵 MEDIUM PRIORITY
**Status:** Partial (button exists, needs redesign)  
**Files:** `BoundaryChannelPanel.jsx`

**Current State:**
- Green circular button with "+" 
- Floats on right side
- Has "Add Candidate" text

**Target Design (from image2):**
- Slim vertical button on LEFT side
- No text on button (hover shows "Add Candidate")
- Extends full height of panel
- Scroll arrows also on left
- Cards scroll left-to-right

**Implementation:**

1. **Update Panel Layout**
```jsx
<div style={{
  display: 'flex',
  height: '100%',
  width: '100%'
}}>
  {/* LEFT SIDEBAR - Controls */}
  <div style={{
    width: '40px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    flexShrink: 0
  }}>
    {/* Scroll Left Button */}
    <button
      onClick={() => scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
      style={{
        width: '100%',
        height: '40px',
        background: 'rgba(99, 102, 241, 0.2)',
        border: 'none',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#a5b4fc',
        cursor: 'pointer',
        fontSize: '18px'
      }}
      title="Scroll Left"
    >
      ◀
    </button>
    
    {/* Add Candidate Button */}
    <button
      onClick={onProposeNew}
      style={{
        flex: 1,
        width: '100%',
        background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))',
        border: 'none',
        borderBottom: '1px solid rgba(34, 197, 94, 0.3)',
        color: '#4ade80',
        cursor: 'pointer',
        fontSize: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s'
      }}
      title="Add Candidate"
      onMouseEnter={(e) => {
        e.target.style.background = 'linear-gradient(180deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3))';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'linear-gradient(180deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))';
      }}
    >
      +
    </button>
    
    {/* Scroll Right Button */}
    <button
      onClick={() => scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
      style={{
        width: '100%',
        height: '40px',
        background: 'rgba(99, 102, 241, 0.2)',
        border: 'none',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#a5b4fc',
        cursor: 'pointer',
        fontSize: '18px'
      }}
      title="Scroll Right"
    >
      ▶
    </button>
  </div>
  
  {/* RIGHT SIDE - Candidate Cards */}
  <div
    ref={scrollContainerRef}
    style={{
      flex: 1,
      display: 'flex',
      gap: 12,
      padding: 12,
      overflowX: 'auto',
      overflowY: 'hidden',
      scrollBehavior: 'smooth'
    }}
  >
    {/* Candidate cards here */}
  </div>
</div>
```

2. **Remove Old Button**
```jsx
// DELETE the existing floating green button:
// <button style={{ position: 'absolute', ... }}>
//   ➕ Add Candidate
// </button>
```

---

### Task 5: Add Demo Voters 🟡 LOW PRIORITY
**Status:** Not started  
**Files:** `boundaryChannelService.mjs`, demo voter scripts

**Current State:**
- All candidates show 0 votes
- No demo voters assigned

**Implementation:**

1. **Add Demo Votes on Channel Creation**
```javascript
// In boundaryChannelService.mjs, after creating official candidate:
async createOfficialBoundaryProposal(channel, regionName, regionType, regionCode) {
  // ... existing code ...
  
  channel.candidates.push(officialProposal);
  
  // Add demo votes (80-90% vote for official)
  const demoVoteCount = Math.floor(Math.random() * 50) + 100; // 100-150 votes
  officialProposal.votes = demoVoteCount;
  channel.totalVotes = demoVoteCount;
  
  console.log(`✅ Added official boundary with ${demoVoteCount} demo votes`);
}
```

2. **Add Demo Votes to New Proposals**
```javascript
// In POST /boundary/:channelId/proposal route:
const proposal = {
  // ... existing fields ...
  votes: Math.floor(Math.random() * 20) + 5, // 5-25 demo votes for new proposals
};

// Update channel total
channel.totalVotes = channel.candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
```

3. **Or Create Dedicated Demo Voter System**
```javascript
// src/backend/utils/boundaryDemoVoters.mjs
export function assignDemoVoters(channel) {
  const voterPool = 200; // Total demo voters
  
  channel.candidates.forEach((candidate, index) => {
    if (candidate.isOfficial) {
      // Official gets 60-70% of votes
      candidate.votes = Math.floor(voterPool * (0.6 + Math.random() * 0.1));
    } else {
      // Other candidates split remaining votes
      const remaining = voterPool - channel.candidates[0].votes;
      candidate.votes = Math.floor(remaining / (channel.candidates.length - 1));
    }
  });
  
  channel.totalVotes = channel.candidates.reduce((sum, c) => sum + c.votes, 0);
}
```

---

## 📋 TESTING CHECKLIST

After implementing each task:

**Multi-Select:**
- [ ] Click Multi button, cursor changes to crosshair
- [ ] Click and drag creates visible selection rectangle
- [ ] Vertices within rectangle turn orange
- [ ] Dragging one selected vertex moves all selected vertices
- [ ] Click outside selection clears selection
- [ ] Switch back to Single mode works correctly

**Boundary Preview Images:**
- [ ] Each non-official candidate shows a diff preview
- [ ] Original boundary visible in gray
- [ ] Proposed boundary visible in cyan
- [ ] Differences highlighted in orange
- [ ] Preview scales correctly to 200x120px

**Normal Channel Images:**
- [ ] Normal channel cards have image area above description
- [ ] Images load correctly when candidate has imageUrl
- [ ] Placeholder shows when no image
- [ ] Layout still looks good with/without images

**Redesigned Add Button:**
- [ ] Slim vertical button appears on left side
- [ ] Button extends full panel height
- [ ] Hover shows "Add Candidate" tooltip
- [ ] No text on button itself
- [ ] Scroll arrows above and below button
- [ ] Cards scroll horizontally left-to-right

**Demo Voters:**
- [ ] Official boundary has 100+ votes
- [ ] New proposals have 5-25 votes
- [ ] Vote counts display correctly in UI
- [ ] Percentages calculate correctly

---

## 🎯 PRIORITY ORDER

1. **Multi-Select Tool** (needed for usability)
2. **Boundary Preview Images** (visual feedback critical)
3. **Redesigned Add Button** (UX improvement)
4. **Normal Channel Images** (feature parity)
5. **Demo Voters** (polish)

---

## 📝 NOTES

- Most infrastructure is in place (state management, event flow)
- Main work is implementing the visual/interaction logic
- Boundary preview generation is the most complex (canvas rendering)
- Demo voters is simplest (just add numbers)
- Multi-select needs careful testing to avoid breaking single-select

