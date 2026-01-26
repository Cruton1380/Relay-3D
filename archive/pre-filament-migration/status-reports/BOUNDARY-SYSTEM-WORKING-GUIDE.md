# Boundary System - Working Guide

## ✅ What's Working Now

### 1. Opening the Boundary Panel
- **How:** Right-click on India → Click "Boundaries"
- **Result:** Red boundary panel appears at top-left
- **Panel shows:** 3 existing boundary candidates with vote counts

### 2. Viewing Candidates
- **The panel shows:** List of boundary proposals
- **Each card has:**
  - Candidate name (e.g., "India - Official Boundary")
  - Description
  - Vote stats footer: `#1 • 150 votes • 45%`

### 3. Starting to Edit
- **How:** Click the GREEN "+" button on the right side of the panel
- **This should:**
  1. Set `isEditing = true`
  2. Show the toolbar at bottom-left
  3. Load the boundary nodes on the globe
  4. Make nodes yellow and draggable

### 4. Editing Nodes (Single Mode)
- **Default mode:** Single node selection
- **How to edit:**
  1. Click and hold a yellow node
  2. Drag it to new position
  3. Release mouse
- **Camera:** Should stay fixed (not rotate during drag)

## 🔴 Known Issues

### Issue 1: Toolbar Not Showing
**Problem:** When you click "Add Candidate", the toolbar doesn't appear

**Possible causes:**
- `boundaryEditor.isEditing` not being set to `true`
- Toolbar positioned off-screen (bottom: 410px might be too high)

**Debug:** Check console for `➕ Proposing new boundary` log

### Issue 2: Save Not Working
**Problem:** No way to save the boundary after editing

**Current status:** 
- Toolbar has "✓ Confirm" button
- Button dispatches `boundary-editor-submit` event
- GlobeBoundaryEditor listens for this event
- Should call `handleSave()` which posts to `/api/channels/boundary/:channelId/proposal`

**What to check:**
1. Are you seeing the toolbar?
2. Does the "✓ Confirm" button exist?
3. Check console when clicking it

### Issue 3: Multi-Node Selection Not Implemented
**Problem:** Tool buttons (👆 Single, 🔲 Multi, 👁️ View) don't do anything

**Why:** The UI is there but the logic isn't implemented yet

**To implement:**
- Need to add rectangle selection in GlobeBoundaryEditor
- Draw a selection rectangle on canvas
- Select all nodes inside the rectangle
- Allow dragging the entire selection

## 🎯 Testing Steps

### Test 1: Open Panel
1. Load the app
2. Click "Country" cluster level
3. Right-click India
4. Click "Boundaries"
5. ✅ **Expected:** Red panel appears with 3 candidates

### Test 2: Start Editing
1. Click the green "+" button (Add Candidate)
2. ✅ **Expected:** 
   - Console shows: `➕ Proposing new boundary`
   - Toolbar appears at bottom-left
   - Nodes appear on globe (yellow points)
   
### Test 3: Move a Node
1. Click and hold a yellow node
2. Drag it somewhere else
3. Release
4. ✅ **Expected:**
   - Node moves with mouse
   - Camera stays still
   - Boundary polygon updates

### Test 4: Save
1. After moving nodes, click "✓ Confirm" in toolbar
2. ✅ **Expected:**
   - Console shows: `✅ Submitting from toolbar`
   - API call to save boundary
   - New candidate appears in panel
   - Editing mode closes

## 🐛 Debugging Commands

### Check if toolbar is rendering:
Look for this in the Elements tab (F12):
```html
<div style="position: fixed; left: 50px; bottom: 410px; z-index: 10001;">
  <!-- BoundaryEditToolbar -->
</div>
```

### Check isEditing state:
Look for: `🔍 [RENDER CHECK] boundaryEditor details:`
Should show `isEditing: true` after clicking Add Candidate

### Check event firing:
After clicking "✓ Confirm", look for:
- `✅ Submitting from toolbar`
- `boundary-editor-submit` event

## 📝 Next Steps to Complete

1. **Fix toolbar visibility** - Adjust `bottom: 410px` to something visible
2. **Implement multi-select** - Add rectangle selection logic
3. **Wire up save** - Ensure event listener is working
4. **Add view mode** - Disable editing, camera only
5. **Show real-time stats** - Update node count and area in toolbar

## 🎨 Current UI Layout

```
Screen Layout:
┌────────────────────────────────────────┐
│  [Red Boundary Panel]                  │  ← Top-left (50, 100)
│  - Candidate cards                     │
│  - Vote stats                          │
│  - [+ Add Candidate] button            │
└────────────────────────────────────────┘

              Globe with nodes
               (yellow points)

┌────────────────────────────────────────┐
│  [Boundary Edit Toolbar]               │  ← Bottom (50, 410px from bottom)
│  India Boundary | 👆 Single | ✓ Confirm│
└────────────────────────────────────────┘
```

## 💡 Quick Fixes

### If toolbar isn't visible:
Change `bottom: 410px` to `bottom: 50px` in InteractiveGlobe.jsx line ~1036

### If save isn't working:
Check GlobeBoundaryEditor has this event listener:
```js
useEffect(() => {
  const handleToolbarSubmit = () => {
    handleSave();
  };
  window.addEventListener('boundary-editor-submit', handleToolbarSubmit);
  return () => window.removeEventListener('boundary-editor-submit', handleToolbarSubmit);
}, [vertices]);
```

### If nodes aren't showing:
Check that GlobeBoundaryEditor is rendering (hidden but functional):
```jsx
<div style={{ display: 'none' }}>
  <GlobeBoundaryEditor ... />
</div>
```
