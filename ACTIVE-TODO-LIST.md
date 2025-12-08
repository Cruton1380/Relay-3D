# RELAY ACTIVE TODO LIST
**Date:** October 8, 2025  
**Status:** 🚀 ACTIVE DEVELOPMENT

---

## 🎯 IMMEDIATE PRIORITIES (Next Sprint)

### 1. Voter Visualization System ⭐⭐⭐
**Status:** 🔴 NOT STARTED  
**Priority:** HIGH  
**Estimated Time:** 6-8 hours

#### Requirements
When hovering over a candidate card or candidate tower on the globe:
- Show real voter dots on the globe at their actual locations
- Respect privacy levels for each voter:
  - **GPS Level:** Show exact location (lat/lng)
  - **City Level:** Show dot at city center
  - **Province Level:** Show dot at province center
  - **Anonymous:** No location shown (or aggregate count only)

#### Implementation Plan
1. **Backend: Voter Location Tracking**
   - Extend `userLocationService.mjs` to track votes per candidate
   - Create `voterVisualizationAPI.mjs` route
   - Store vote location at time of vote (respecting privacy setting)
   - API endpoint: `GET /api/candidates/:candidateId/voters`

2. **Frontend: Hover Detection**
   - Add hover event to `CandidateCard.jsx`
   - Add hover event to tower entities in `GlobalChannelRenderer.jsx`
   - Trigger voter fetch on hover

3. **Frontend: Globe Rendering**
   - Create `VoterDotsRenderer.jsx`
   - Render small colored dots at voter locations
   - Use Cesium point entities with small pixel size (3-5px)
   - Different colors based on privacy level:
     - 🟢 Green = GPS precision
     - 🔵 Blue = City level
     - 🟡 Yellow = Province level
     - ⚪ White = Anonymous aggregate

4. **Frontend: Performance**
   - Limit to 1000 voters displayed at once
   - Use clustering for high voter counts
   - Debounce hover events (300ms delay)

#### Files to Create/Modify
```
NEW:    src/backend/api/voterVisualizationAPI.mjs
NEW:    src/frontend/components/main/globe/VoterDotsRenderer.jsx
MODIFY: src/frontend/components/workspace/panels/CandidateCard.jsx
MODIFY: src/frontend/components/workspace/components/Globe/GlobalChannelRenderer.jsx
MODIFY: src/backend/services/userLocationService.mjs
```

#### Testing Requirements
- [ ] Test with demo voters (create 100+ demo votes)
- [ ] Verify privacy levels respected
- [ ] Test hover performance (no lag)
- [ ] Test with high voter counts (1000+)

---

### 2. Drill Down / Drill Up System ⭐⭐⭐
**Status:** 🔴 NOT STARTED  
**Priority:** HIGH  
**Estimated Time:** 8-10 hours

#### Requirements
Interactive zoom-based navigation with dynamic aggregation:
- **Zoom Levels:**
  1. 🌍 **Globe** → Shows continent-level aggregates
  2. 🗺️ **Country** → Shows country-level aggregates
  3. 🏙️ **Province** → Shows province-level aggregates
  4. 🏘️ **City** → Shows city-level aggregates
  5. 📍 **GPS** → Shows individual candidate towers

- **Smooth Camera Transitions:**
  - Flyto animations between zoom levels
  - Automatic entity re-aggregation based on zoom level
  - No jarring jumps or entity flicker

#### Implementation Plan
1. **Camera Zoom Detection**
   - Monitor `cesiumViewer.camera.positionCartographic.height`
   - Define zoom thresholds:
     ```javascript
     const ZOOM_THRESHOLDS = {
       GLOBE: 10000000,    // 10,000 km altitude
       COUNTRY: 3000000,   // 3,000 km
       PROVINCE: 1000000,  // 1,000 km
       CITY: 300000,       // 300 km
       GPS: 50000          // 50 km
     };
     ```

2. **Aggregation Logic**
   - Create `VoteAggregationService.mjs`
   - Calculate aggregate votes per region at each level
   - Cache aggregations for performance

3. **Entity Management**
   - Clear current entities on zoom level change
   - Render appropriate entities for new zoom level
   - Smooth transition (fade out old, fade in new)

4. **Voter Dots Integration**
   - At GPS level: Show individual voter dots
   - At City level: Show clustered voter dots
   - At Province+ level: Show aggregate count only

#### Files to Create/Modify
```
NEW:    src/backend/services/voteAggregationService.mjs
NEW:    src/frontend/components/main/globe/managers/ZoomLevelManager.js
MODIFY: src/frontend/components/workspace/components/Globe/GlobalChannelRenderer.jsx
MODIFY: src/frontend/components/main/globe/managers/GlobeControls.js
```

#### Testing Requirements
- [ ] Test smooth transitions between all zoom levels
- [ ] Verify correct aggregation at each level
- [ ] Test performance with 10k+ candidates
- [ ] Test edge cases (zoom in/out rapidly)

---

### 3. Category Display Enhancement ⭐⭐
**Status:** 🟡 PARTIALLY COMPLETE  
**Priority:** MEDIUM  
**Estimated Time:** 3-4 hours

#### Current Status
✅ Categories display on candidate cards  
✅ Categories shown in boundary editor  
✅ Backend API fully operational  
❌ Category not shown in channel panel header  
❌ No category voting UI  
❌ No category filters  

#### Remaining Tasks

**A. Channel Panel Header Category Display**
- Add category badge to `DragDropContainer` title area
- Show category prominently in panel header
- Example: "India Boundaries" panel shows "Category: India"

**B. Category Voting UI**
- Add "Suggest Category" button to candidate cards
- Show top 3 categories with vote counts
- Allow users to upvote/downvote category suggestions
- Display user's voted category with checkmark

**C. Category Filter Dropdown**
- Add filter dropdown to channel search
- Show all available categories
- Filter channels by selected category
- "All Categories" option to clear filter

#### Implementation Plan
```javascript
// A. Panel Header (DragDropContainer.jsx)
<div className="panel-header">
  <div className="panel-title">{title}</div>
  {category && (
    <div className="category-badge">
      🏷️ {category}
    </div>
  )}
</div>

// B. Category Voting (CandidateCard.jsx)
<div className="category-voting">
  <div className="category-label">Categories:</div>
  {topCategories.map(cat => (
    <button 
      className={`category-vote-btn ${userVoted === cat.id ? 'active' : ''}`}
      onClick={() => voteCategory(cat.id)}
    >
      {cat.name} ({cat.voteCount} ▲)
    </button>
  ))}
</div>

// C. Category Filter (SearchPanel.jsx)
<select onChange={(e) => filterByCategory(e.target.value)}>
  <option value="">All Categories</option>
  {categories.map(cat => (
    <option value={cat.id}>{cat.name}</option>
  ))}
</select>
```

#### Files to Modify
```
MODIFY: src/frontend/components/workspace/DragDropContainer.jsx
MODIFY: src/frontend/components/workspace/panels/CandidateCard.jsx
MODIFY: src/frontend/components/workspace/panels/SearchPanel.jsx (if exists)
```

---

## 🎨 UI/UX IMPROVEMENTS

### 4. Enhanced Boundary Editor Feedback ⭐
**Status:** 🟢 IN PROGRESS  
**Priority:** MEDIUM  
**Estimated Time:** 2-3 hours

#### Tasks
- [x] Individual node selection with visual feedback
- [x] Drag-to-move functionality
- [x] Dynamic line updates during drag
- [x] Minimized panel (only essential tools)
- [ ] Snap-to-grid option (toggle)
- [ ] Undo/Redo functionality
- [ ] Real-time vertex count display
- [ ] Visual preview of area change (km²)

#### Implementation Notes
- Selection feedback: Orange highlight, white outline
- Dragging: Smooth position updates with throttling
- Panel simplified: Removed proposal name/description fields
- Note added: "Your boundary will appear as a candidate in the channel panel"

---

### 5. Performance Optimization ⭐
**Status:** 🟡 ONGOING  
**Priority:** MEDIUM  
**Estimated Time:** 4-6 hours

#### Targets
- [ ] Reduce entity count with LOD (Level of Detail)
- [ ] Implement entity pooling for reuse
- [ ] Optimize polygon rendering (simplify large polygons)
- [ ] Add WebWorker for heavy calculations
- [ ] Implement virtual scrolling for candidate lists
- [ ] Cache API responses (5-minute TTL)

#### Specific Optimizations
```javascript
// LOD Implementation
if (cameraHeight > 1000000) {
  // Show simplified polygons (10% vertices)
  renderSimplifiedBoundaries();
} else {
  // Show full detail polygons
  renderFullBoundaries();
}

// Entity Pooling
const entityPool = {
  available: [],
  active: new Map(),
  
  acquire(id) {
    const entity = this.available.pop() || createNewEntity();
    this.active.set(id, entity);
    return entity;
  },
  
  release(id) {
    const entity = this.active.get(id);
    this.active.delete(id);
    this.available.push(entity);
  }
};
```

---

## 🔧 TECHNICAL DEBT

### 6. Cache Restore Errors ⭐
**Status:** 🔴 BUG  
**Priority:** LOW  
**Estimated Time:** 1-2 hours

#### Issue
Console errors appearing on window focus:
```
DeveloperError: 'An entity with id cluster-stack-country-Lithuania-... already exists in this collection.'
```

#### Root Cause
Cache system attempting to restore entities that already exist in the Cesium viewer.

#### Solution
```javascript
// GlobalChannelRenderer.jsx - Cache restore logic
const restoreCachedEntities = (cachedEntities) => {
  cachedEntities.forEach(entityData => {
    // Check if entity already exists
    const existing = cesiumViewer.entities.getById(entityData.id);
    if (existing) {
      console.log(`⏭️ Skipping ${entityData.id} - already exists`);
      return;
    }
    
    // Restore entity
    try {
      cesiumViewer.entities.add(entityData);
    } catch (error) {
      console.warn(`⚠️ Could not restore entity ${entityData.id}:`, error.message);
    }
  });
};
```

---

### 7. API Response Standardization ⭐
**Status:** 🟡 PARTIAL  
**Priority:** LOW  
**Estimated Time:** 3-4 hours

#### Goal
Standardize all API responses to consistent format:

```javascript
// Success Response
{
  success: true,
  data: { ... },
  timestamp: 1699999999999,
  requestId: "req_abc123"
}

// Error Response
{
  success: false,
  error: {
    code: "INVALID_INPUT",
    message: "User-friendly error message",
    details: { field: "email", reason: "invalid format" }
  },
  timestamp: 1699999999999,
  requestId: "req_abc123"
}
```

#### Files to Audit
- All routes in `src/backend/routes/`
- All API controllers in `src/backend/api/`
- Frontend error handling in service files

---

## 📚 DOCUMENTATION TASKS

### 8. API Documentation ⭐
**Status:** 🔴 NOT STARTED  
**Priority:** MEDIUM  
**Estimated Time:** 6-8 hours

#### Tasks
- [ ] Document all API endpoints with examples
- [ ] Add request/response schemas
- [ ] Add error code reference
- [ ] Create Postman collection
- [ ] Add rate limit information

#### Format
Use OpenAPI/Swagger specification for consistency.

---

### 9. Developer Onboarding Guide ⭐
**Status:** 🔴 NOT STARTED  
**Priority:** LOW  
**Estimated Time:** 4-6 hours

#### Contents
- Architecture overview diagram
- Data flow diagrams
- Setup instructions (step-by-step)
- Common development tasks
- Troubleshooting guide
- Code style guide

---

## 🧪 TESTING TASKS

### 10. Integration Test Suite ⭐
**Status:** 🔴 NOT STARTED  
**Priority:** MEDIUM  
**Estimated Time:** 8-10 hours

#### Coverage Targets
- [ ] Vote flow (create → vote → aggregate → display)
- [ ] Boundary proposal flow (create → edit → save → vote)
- [ ] Category system (create → associate → vote → filter)
- [ ] User location tracking (update → privacy → display)
- [ ] Zoom level transitions (drill down/up)

#### Tools
- Jest for unit tests
- Cypress for E2E tests
- Mock data generators

---

## 🎯 FUTURE ENHANCEMENTS (Backlog)

### 11. Real-time Collaboration ⭐⭐⭐
- Multiple users editing same boundary simultaneously
- Show other users' cursors on globe
- Real-time vote updates (WebSocket)
- Live chat in channel panels

### 12. Mobile Support ⭐⭐
- Responsive design for tablets/phones
- Touch gestures for globe interaction
- Mobile-optimized panel layouts

### 13. Accessibility (A11y) ⭐⭐
- Keyboard navigation
- Screen reader support
- High contrast mode
- ARIA labels throughout

### 14. Analytics Dashboard ⭐
- Vote trends over time
- Geographic heat maps
- User engagement metrics
- Channel popularity rankings

### 15. Notification System ⭐⭐
- Vote reminders
- Boundary proposal alerts
- Comment replies
- Category suggestions

---

## 📊 PROGRESS TRACKING

### Completed This Sprint ✅
- [x] Boundary editor panel system (draggable)
- [x] Category system backend integration
- [x] Category display on candidate cards
- [x] Individual node selection in boundary editor
- [x] Simplified boundary editor UI
- [x] Geographic categories for boundary channels

### In Progress 🔄
- [ ] Voter visualization system (starting)
- [ ] Drill down/up system (planning)
- [ ] Category voting UI (partially complete)

### Blocked ⛔
- None currently

---

## 📅 SPRINT SCHEDULE

### Current Sprint (Week of Oct 8, 2025)
**Focus:** Visualization & Navigation

#### Day 1-2: Voter Visualization
- Backend voter tracking API
- Frontend hover detection
- Globe dot rendering
- Privacy level handling

#### Day 3-4: Drill Down/Up
- Zoom level detection
- Aggregation service
- Entity transitions
- Performance optimization

#### Day 5: Category Enhancement
- Panel header display
- Category voting UI
- Filter dropdown

### Next Sprint (Week of Oct 15, 2025)
**Focus:** Performance & Testing

- Entity pooling implementation
- LOD system for boundaries
- Integration test suite
- Cache error fixes

---

## 🎯 SUCCESS METRICS

### Performance
- [ ] Page load < 2 seconds
- [ ] Smooth 60 FPS globe rotation
- [ ] Voter dots render < 500ms
- [ ] Zoom transitions < 1 second

### User Experience
- [ ] Intuitive boundary editing (no tutorial needed)
- [ ] Clear category system (visible at all times)
- [ ] Responsive voter visualization (immediate feedback)
- [ ] Smooth navigation (no jarring transitions)

### Technical
- [ ] 80%+ code coverage
- [ ] Zero console errors in production
- [ ] API response time < 200ms
- [ ] Memory usage stable (no leaks)

---

## 📝 NOTES

### Design Decisions
1. **Minimalist Editor:** Removed proposal name/description from editor panel - users add details in channel panel after creating boundary
2. **Auto-naming:** Boundary proposals auto-generate names with timestamp
3. **Privacy First:** Voter visualization respects all privacy levels
4. **Performance First:** Aggregation and LOD before feature expansion

### Technical Constraints
- Maximum 10,000 entities visible at once (Cesium performance)
- Voter dots limited to 1,000 displayed simultaneously
- Polygon simplification kicks in above 1,000 vertices
- API rate limit: 100 requests/minute per user

### Future Considerations
- WebGL 2.0 support for advanced rendering
- Server-side rendering for initial globe state
- Progressive Web App (PWA) for offline support
- Internationalization (i18n) for global audience

---

**Last Updated:** October 8, 2025  
**Next Review:** October 15, 2025
