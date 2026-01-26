# 🧪 BOUNDARY SYSTEM - QUICK TEST GUIDE

**BEFORE TESTING:** Hard refresh browser (Ctrl+Shift+R or Ctrl+F5)

---

## ✅ TEST 1: Open New Boundary Panel (30 seconds)

```
1. Right-click India on globe
2. Click "🏛️ Boundaries"

✅ EXPECTED:
- Channel panel appears bottom-left (900px wide)
- Shows "India - Boundaries" header
- Shows candidate cards left-to-right
- Current boundary has 🏆 badge
- Cards show:
  - Node count (e.g., "📍 Nodes: 6,761")
  - Area (e.g., "📏 Area: 3,287,263 km²")
  - Vote splits (🏠 Local / 🌍 Foreign)
  - Vote button and ⚙️ options menu
```

---

## ✅ TEST 2: Enter Edit Mode (30 seconds)

```
1. Click ⚙️ on any candidate card
2. Click "✏️ Edit Boundary"

✅ EXPECTED:
- Edit toolbar appears above channel panel
- Toolbar shows:
  - "✏️ Editing: India Boundary"
  - "📍 Nodes: 6,761"
  - "📏 Area: +0 km²"
  - Instructions
  - Submit/Cancel buttons
- Console shows: "🛑 RegionManager handlers disabled"
- Nodes on globe turn YELLOW
```

---

## ✅ TEST 3: Select Node (CRITICAL - 1 minute)

```
1. Click any yellow node on globe

✅ EXPECTED CONSOLE OUTPUT:
🖱️ [BOUNDARY EDITOR] LEFT_DOWN detected at position: {x: 450, y: 230}
🎯 [BOUNDARY EDITOR] DrillPick found 3 entities
🔍 [BOUNDARY EDITOR] Examining entity: vertex-42-1728388923456 type: boundary-vertex
✅ [BOUNDARY EDITOR] Found boundary vertex!
✅ [BOUNDARY EDITOR] Vertex picked successfully!
📍 [BOUNDARY EDITOR] Selected vertex #42 - Ready to drag

✅ EXPECTED VISUAL:
- Node turns ORANGE (24px size)
- White outline appears (3px)
- Node is clearly highlighted

❌ IF NOTHING HAPPENS:
- Check console for errors
- Verify drillPick finds entities
- Ensure edit mode is active (yellow nodes visible)
```

---

## ✅ TEST 4: Drag Node (30 seconds)

```
1. With node selected (orange)
2. Click and hold
3. Drag to new position
4. Release mouse

✅ EXPECTED:
- Node follows cursor smoothly
- Polygon line updates in real-time
- Node stays selected after release (18px, yellow with outline)
- Console shows: "✅ Vertex drag complete - Node remains selected"
```

---

## ✅ TEST 5: Add Node (30 seconds)

```
1. Click on a polygon line (NOT a node)

✅ EXPECTED:
- New node appears at click position
- Node is yellow (editable)
- Polygon updates to include new node
- Toolbar node count increases
```

---

## ✅ TEST 6: Delete Node (30 seconds)

```
1. Right-click any yellow node

✅ EXPECTED:
- Node disappears
- Polygon updates without that node
- Toolbar node count decreases
```

---

## ✅ TEST 7: Submit Proposal (30 seconds)

```
1. Click "✓ Submit Proposal" in toolbar

✅ EXPECTED:
- Edit toolbar closes
- New candidate card appears in channel panel
- Cards re-sort by vote count
- Console shows: "✅ RegionManager handlers re-enabled"
- Globe nodes disappear (edit mode ended)
```

---

## ✅ TEST 8: Handler Restoration (30 seconds)

```
1. After submitting/canceling edit
2. Hover over any country

✅ EXPECTED:
- Dropdown menu appears (Boundaries, Parameters, Governance)
- No console errors
- Clicking country works normally
- RegionManager fully functional
```

---

## 🐛 TROUBLESHOOTING

### Issue: Nodes don't turn orange when clicked

**Check:**
1. Console shows "DrillPick found X entities"
2. Console shows "Examining entity" logs
3. Console shows "Found boundary vertex!"

**If NO:**
- Edit mode not active → Click "✏️ Edit" button
- Nodes not created → Check vertices loaded in console
- Handler not registered → Refresh browser

**If YES but still no highlight:**
- PropertyBag issue → Check entity.properties exists
- Visual update issue → Check Cesium.Color.ORANGE assignment

---

### Issue: Nodes appear but can't be clicked

**Check:**
1. Console shows "LEFT_DOWN detected"
2. Console shows "DrillPick found X entities"  
3. Console shows type for each entity

**If DrillPick finds 0 entities:**
- Nodes behind polygon → Already fixed with drillPick
- Nodes too small → Already increased to 18px
- Depth test issue → Check disableDepthTestDistance

**If DrillPick finds entities but no vertex:**
- PropertyBag not set → Already fixed
- Type not matching → Check "boundary-vertex" string

---

### Issue: Edit toolbar doesn't appear

**Check:**
1. `boundaryEditor.isEditing === true`
2. Edit toolbar component imported in InteractiveGlobe
3. Toolbar position (bottom: 360px)

**Fix:**
- Verify state update in setBoundaryEditor
- Check for CSS/positioning issues

---

### Issue: RegionManager still capturing clicks

**Check:**
1. Console shows "🛑 RegionManager handlers disabled"
2. Handler removal code executed
3. No other handlers registered

**Fix:**
- Verify window.earthGlobeControls.regionManager exists
- Check cesiumWidget.screenSpaceEventHandler available
- Add more aggressive handler cleanup

---

## 📋 EXPECTED CONSOLE OUTPUT (Full Flow)

```
# Opening Boundary Channel
🗺️ [BOUNDARY v2.0] Opening boundary channel for India (country)
✅ [BOUNDARY] Channel ready
✅ [BOUNDARY] Dual interface activated

# Entering Edit Mode
✏️ [BOUNDARY EDITOR] Enabling edit mode
📍 [BOUNDARY EDITOR] Current vertices count: 6761
🛑 [BOUNDARY EDITOR] RegionManager handlers disabled
🎮 [BOUNDARY EDITOR] Event handler created successfully
🟡 [BOUNDARY EDITOR] Updated vertex 0 to yellow (editable)
...

# Clicking Node
🖱️ [BOUNDARY EDITOR] LEFT_DOWN detected
🎯 [BOUNDARY EDITOR] DrillPick found 3 entities
🔍 [BOUNDARY EDITOR] Examining entity: boundary-polygon
🔍 [BOUNDARY EDITOR] Examining entity: vertex-42-1728388923456 type: boundary-vertex
✅ [BOUNDARY EDITOR] Found boundary vertex!
📍 [BOUNDARY EDITOR] Selected vertex #42 - Ready to drag

# Dragging Node
✅ [BOUNDARY EDITOR] Vertex drag complete

# Submitting
✅ Proposal saved
🧹 [BOUNDARY EDITOR] Cleaning up...
✅ [BOUNDARY EDITOR] RegionManager handlers re-enabled
```

---

## 🎯 SUCCESS CRITERIA

- ✅ Channel panel opens and displays candidates
- ✅ Edit toolbar appears when editing
- ✅ Nodes turn orange when clicked
- ✅ Nodes can be dragged smoothly
- ✅ Polygon updates in real-time
- ✅ New nodes can be added
- ✅ Nodes can be deleted
- ✅ Proposals can be submitted
- ✅ RegionManager works after editing

---

## ⏱️ TOTAL TEST TIME: ~5 minutes

If all tests pass → **SYSTEM IS WORKING!** 🎉  
If any test fails → See troubleshooting section above

---

**Quick Commands:**
- Hard Refresh: `Ctrl + Shift + R` or `Ctrl + F5`
- Open Console: `F12` → Console tab
- Clear Console: `Ctrl + L` or click 🚫 icon

**Next Step:** Test with real boundary data and vote integration 🚀
