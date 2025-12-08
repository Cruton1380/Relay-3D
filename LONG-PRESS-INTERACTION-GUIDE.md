# Long-Press Interaction System for Boundary Editing

## User Interactions

### Quick Click (< 500ms)
- **On Vertex**: Select and drag vertex
- **On Empty Space**: Add new vertex at that location
- **On Line**: Add new vertex on the polygon line

### Long-Press (≥ 500ms)
- **On Empty Space**: Place marker for multi-select polygon
- **On Vertex**: Delete that vertex

### Click Off Selection
- **Click anywhere else**: Clear selection, return to neutral edit mode

## Implementation Plan

1. Replace Shift key tracking with mouse down/up timing
2. Use LEFT_DOWN to start timer, LEFT_UP to check duration
3. Track mouse movement to cancel long-press if user drags
4. Update cursor to show "press and hold" hint during long-press

## Visual Feedback
- During long-press: Pulsing circle grows at cursor position
- Multi-select markers: Numbered cyan points with ✓/✗ buttons above first marker
- Selected vertices: Orange color with group drag capability
