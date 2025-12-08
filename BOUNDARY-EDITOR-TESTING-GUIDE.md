# 🧪 **BOUNDARY EDITOR - TESTING GUIDE**

**Phase 1 + Phase 2 Complete**  
**Status:** Ready for User Testing

---

## 🎯 **WHAT TO TEST**

### **Test 1: Auto-Create Boundary Channel**

**Goal:** Verify no more "channel doesn't exist" error

**Steps:**
1. Open http://localhost:5175
2. Right-click on India (or any country)
3. Click "🗺️ Boundary" button

**Expected Result:**
- ✅ No error alert
- ✅ Channel ranking panel opens on LEFT side
- ✅ Boundary editor opens on GLOBE (right side)
- ✅ Cyan pinpoints visible at boundary vertices
- ✅ Purple control panel appears on right

**What to Check:**
- [ ] No "channel doesn't exist" error
- [ ] Dual interface opens (panel + editor)
- [ ] Pinpoints visible on globe
- [ ] Polygon drawn connecting vertices
- [ ] Control panel has "India Boundaries" title

---

### **Test 2: Drag Vertices (Edit Mode)**

**Goal:** Verify visual editing with draggable pinpoints

**Steps:**
1. Complete Test 1 first
2. Click "✏️ Edit" button in control panel
3. Pinpoints turn YELLOW
4. Click and drag any pinpoint
5. Move it to new position
6. Release mouse

**Expected Result:**
- ✅ Vertex follows mouse on globe surface
- ✅ Vertex turns ORANGE while dragging
- ✅ Polygon reshapes in real-time
- ✅ Vertex returns to YELLOW after release

**What to Check:**
- [ ] Vertices are draggable
- [ ] Polygon updates smoothly
- [ ] No lag or jitter
- [ ] Vertices snap to globe surface

---

### **Test 3: Add New Vertex**

**Goal:** Verify adding vertices by clicking on lines

**Steps:**
1. With editor in Edit mode
2. Click on any cyan polygon line (not on a vertex)
3. New vertex appears

**Expected Result:**
- ✅ New yellow pinpoint appears at click position
- ✅ Vertex labeled with next number (V4, V5, etc.)
- ✅ Polygon redraws with new vertex
- ✅ Vertex count updates in stats panel

**What to Check:**
- [ ] New vertex appears where clicked
- [ ] Polygon maintains closure
- [ ] Labels renumber correctly

---

### **Test 4: Delete Vertex**

**Goal:** Verify deleting vertices with right-click

**Steps:**
1. With editor in Edit mode
2. Right-click on any vertex
3. Vertex disappears

**Expected Result:**
- ✅ Vertex removed from globe
- ✅ Polygon redraws without that vertex
- ✅ Labels renumber (V1, V2, V3...)
- ✅ Vertex count decreases

**What to Check:**
- [ ] Vertex deletes on right-click
- [ ] Polygon stays closed
- [ ] Can't delete below 3 vertices (alert appears)

---

### **Test 5: Preview Impact**

**Goal:** Verify affected regions calculation

**Steps:**
1. Edit boundary (move some vertices)
2. Click "🔍 Preview Impact" button
3. Alert shows affected regions

**Expected Result:**
- ✅ Alert shows list of affected regions
- ✅ Shows overlap percentages
- ✅ (Mock data for now: Pakistan, Bangladesh, Nepal)

**What to Check:**
- [ ] Alert appears
- [ ] Lists neighboring regions
- [ ] Shows percentages

---

### **Test 6: Save Proposal**

**Goal:** Verify saving boundary as new proposal

**Steps:**
1. Edit boundary (make some changes)
2. Enter proposal name: "Test Boundary v1"
3. Enter description: "Testing the editor"
4. Click "💾 Save Proposal"

**Expected Result:**
- ✅ Success message appears
- ✅ Proposal saved to database
- ✅ New proposal appears in channel ranking panel (left side)
- ✅ Can vote on new proposal

**What to Check:**
- [ ] Success alert shows
- [ ] Editor closes
- [ ] New proposal in ranking panel
- [ ] Proposal has 0 votes initially

---

### **Test 7: Cancel Editor**

**Goal:** Verify canceling without saving

**Steps:**
1. Open boundary editor
2. Make some edits
3. Click "❌ Cancel"

**Expected Result:**
- ✅ Editor closes
- ✅ Changes discarded
- ✅ No new proposal created
- ✅ Globe returns to normal view

**What to Check:**
- [ ] Editor disappears
- [ ] Pinpoints removed from globe
- [ ] No proposals saved

---

## 🐛 **KNOWN ISSUES (Expected)**

These are intentionally stubbed for later phases:

⚠️ **Placeholder Data:**
- Using mock boundary coordinates (not real Natural Earth data)
- Only 4-5 vertices per boundary (simplified)
- Affected regions are hardcoded (Pakistan, Bangladesh, Nepal)

⚠️ **Not Yet Implemented:**
- Real boundary geometry loading
- Actual neighbor detection
- Vote clustering integration
- Real-time boundary change notifications

---

## ✅ **SUCCESS CRITERIA**

**Phase 2 is successful if:**
- [x] Auto-create API works (no error alerts)
- [x] Dual interface opens (panel + editor)
- [x] Pinpoints render on globe
- [x] Vertices are draggable
- [x] Add vertex works (click on line)
- [x] Delete vertex works (right-click)
- [x] Polygon updates in real-time
- [x] Save proposal API call succeeds
- [x] Cancel closes editor cleanly

---

## 📊 **PERFORMANCE CHECKS**

**Monitor for:**
- Smooth dragging (no lag)
- Quick polygon redraws
- No memory leaks (check DevTools)
- Responsive UI (panel + globe)

**Target FPS:** 30+ while editing

---

## 🔍 **DEBUGGING TIPS**

**If editor doesn't open:**
1. Check browser console for errors
2. Verify backend is running (port 3002)
3. Check API response in Network tab
4. Look for "boundary-IND-xxx" channel created

**If vertices won't drag:**
1. Click "✏️ Edit" button first
2. Check console for Cesium errors
3. Verify viewer ref is valid
4. Check event handler is attached

**If polygon doesn't update:**
1. Check vertices array in state
2. Verify drawPolygon() is called
3. Look for entity removal errors
4. Check Cesium entity collection

---

## 📸 **VISUAL CHECKLIST**

**When editor opens, you should see:**
- ✅ Cyan pinpoints on globe (10km altitude)
- ✅ White labels "V1", "V2", "V3" above vertices
- ✅ Cyan polygon fill (semi-transparent)
- ✅ Cyan polygon outline (solid)
- ✅ Purple control panel on right
- ✅ Channel ranking panel on left

**In Edit mode:**
- ✅ Vertices turn yellow
- ✅ Dragging vertex turns orange
- ✅ Cursor shows drag affordance

---

**Happy Testing!** 🎉

Report any issues not in "Known Issues" section.
