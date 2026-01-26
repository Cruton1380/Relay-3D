# Boundary Difference System - Testing Guide 🧪

## Quick Test Procedure

### Prerequisites
- Backend server running on port 3002
- Frontend dev server running
- Clean candidate data (already cleared)

### Step-by-Step Test

#### 1. Navigate to Boundary Channel
```
1. Open app in browser
2. Click on "India" region
3. Click "Boundaries" tab in side panel
4. Confirm you see the boundary editor interface
```

#### 2. Create Proposal with Multi-Select
```
1. Click "Add Candidate" button
2. Press 'M' key to activate Multi-select tool
3. Click-drag to draw selection box around vertices
4. Selected vertices turn orange/red
5. Drag selection to modify boundary
   - Move north: Territory expansion
   - Move south: Territory contraction
```

#### 3. Verify Area Calculation (Console)
```
1. Click "Confirm" button
2. Open browser console (F12)
3. Look for this log:
   📊 [BOUNDARY EDITOR] Area change calculated: {
     official: 'X,XXX,XXX km²',
     proposed: 'X,XXX,XXX km²',
     delta: '+X,XXX km²',
     percent: '+X.XX%'
   }
4. Verify numbers make sense
```

#### 4. Check Candidate Card Display
```
1. Proposal card appears in left panel
2. Verify preview image shows:
   - GRAY area (official boundary)
   - RED area (proposed changes)
3. Check description shows:
   📍 Nodes: X,XXX
   📏 Area: X,XXX,XXX km² (+X,XXX km², +X.XX%)
4. Area delta matches console output
```

#### 5. Test Multiple Proposals
```
1. Click "Add Candidate" again
2. Make different boundary change
3. Verify second proposal shows different statistics
4. Both cards should display unique area changes
```

## Expected Results

### Console Output ✅
```
🎯 [BOUNDARY EDITOR] Starting save with 6761 vertices
📊 [BOUNDARY EDITOR] Area change calculated: {
  official: '3,287,263 km²',
  proposed: '3,379,383 km²',
  delta: '+92,120 km²',
  percent: '+2.88%'
}
📤 [BOUNDARY EDITOR] Submitting to API: {...}
✅ [API] Boundary proposal added: India Boundary Proposal 2025-XX-XX
```

### Card Display ✅
```
┌─────────────────────────────────┐
│ #2  Proposal Name          [⚙️] │
├─────────────────────────────────┤
│                                 │
│   [RED/GRAY PREVIEW IMAGE]      │
│                                 │
├─────────────────────────────────┤
│ Proposed boundary modification  │
│                                 │
│ 📍 Nodes: 6,761                 │
│ 📏 Area: 3,379,383 km²          │
│    (+92,120 km², +2.88%)        │
│                                 │
│ 🏠 Local Votes: 25 (45%)        │
│ 🌍 Foreign Votes: 30 (55%)      │
├─────────────────────────────────┤
│ #2 • 55 votes • 12.3%    [Vote] │
└─────────────────────────────────┘
```

## Troubleshooting

### Issue: No area calculation in console
**Solution**: Check that `originalGeometry` is loaded
- Official boundary should load first
- Wait 2-3 seconds after opening editor
- Check console for: "✅ [BOUNDARY EDITOR] Original geometry loaded"

### Issue: Preview image not showing
**Solution**: Check preview generation
- Console should show: "🖼️ [PREVIEW] Generating diff image..."
- If missing, check BoundaryPreviewGenerator.js import
- Verify generateDiffImage() is being called

### Issue: Area shows as "0 km²"
**Solution**: Geometry format issue
- Check coordinates format: [[lng, lat], [lng, lat], ...]
- Verify polygon is closed (first = last point)
- Check console for geometry validation errors

### Issue: Percentage calculation wrong
**Solution**: Math verification
- Official area should be larger than 1M km²
- Delta should be +/- based on expansion/contraction
- Percentage = (delta / official) * 100

## Validation Tests

### Test 1: Expansion (Move North)
```
Expected: 
- Delta > 0
- Percentage positive
- RED area visible on preview
- Sign: "+X,XXX km² (+X.XX%)"
```

### Test 2: Contraction (Move South)
```
Expected:
- Delta < 0
- Percentage negative
- BLUE area visible (if implemented)
- Sign: "-X,XXX km² (-X.XX%)"
```

### Test 3: No Change (Same Boundary)
```
Expected:
- Delta = 0
- Percentage = 0.00%
- Only GRAY preview
- Display: "X,XXX,XXX km²" (no delta)
```

## Advanced Tests

### Multi-Region Test
```
1. Test with different regions:
   - India (large, ~3M km²)
   - Sri Lanka (small, ~65K km²)
   - Kashmir (medium, ~140K km²)
2. Verify calculations scale properly
3. Check percentage accuracy
```

### Large Edit Test
```
1. Select 100+ vertices
2. Make significant boundary change
3. Verify calculation completes quickly (<500ms)
4. Check preview generates successfully
```

### Edge Cases
```
1. Minimum edit (1-2 vertices)
2. Maximum edit (all vertices)
3. Boundary crossing equator
4. Very irregular shapes
```

## Success Metrics

✅ **System Working When**:
- [ ] Console shows area calculation every time
- [ ] All proposals display area statistics
- [ ] Preview images show RED differences
- [ ] Percentages are mathematically correct
- [ ] Multiple proposals show unique data
- [ ] No console errors during process

## Performance Benchmarks

| Operation | Expected Time | Actual Time |
|-----------|--------------|-------------|
| Area calculation | <100ms | ___ ms |
| Preview generation | <500ms | ___ ms |
| API submission | <1000ms | ___ ms |
| Card render | <50ms | ___ ms |

## Debug Commands

### Check Proposal Data
```javascript
// In browser console:
const channel = globeViewer.boundaryChannels.get('boundary-IN');
console.log(channel.candidates.map(c => ({
  name: c.name,
  areaChange: c.areaChange
})));
```

### Verify calculateAreaChange Function
```javascript
// In browser console:
import('../utils/BoundaryPreviewGenerator.js').then(module => {
  const result = module.calculateAreaChange(
    [[0,0], [1,0], [1,1], [0,1], [0,0]],  // 1x1 square
    [[0,0], [2,0], [2,2], [0,2], [0,0]]   // 2x2 square
  );
  console.log('Test result:', result);
  // Expected: proposedArea ~4x officialArea
});
```

### Force Preview Regeneration
```javascript
// In browser console:
const panel = document.querySelector('[data-boundary-panel]');
// Trigger re-render or call generatePreview() manually
```

## Notes
- Area calculations use spherical earth approximation
- 1° latitude ≈ 111.32 km
- Preview images are 400x300px canvas renders
- Statistics stored in proposal.areaChange object
- Format uses toLocaleString() for readability

---

**Test Status**: Ready to Execute
**Expected Duration**: 5-10 minutes
**Required Skills**: Basic browser usage + dev console

**Next**: Run through test steps and document results! 🚀
