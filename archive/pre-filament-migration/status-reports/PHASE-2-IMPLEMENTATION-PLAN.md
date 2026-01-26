# 🎯 Phase 2 Complete Implementation Plan - Option B

**Date:** October 7, 2025  
**Goal:** Show voters on globe when hovering over candidates

---

## ✅ COMPLETED: Backend Infrastructure

### **1. votingEngine.mjs** - Export Functions ✅
**File:** `src/backend/voting/votingEngine.mjs`

**Added:**
```javascript
export function getUsersWithVotesForTopic(topicId) {
  const voters = [];
  for (const [userId, userVotes] of authoritativeVoteLedger.entries()) {
    const vote = userVotes.get(topicId);
    if (vote) voters.push({ userId, vote });
  }
  return voters;
}

export function getUsersWithVotesForCandidate(topicId, candidateId) {
  const voters = [];
  for (const [userId, userVotes] of authoritativeVoteLedger.entries()) {
    const vote = userVotes.get(topicId);
    if (vote && vote.candidateId === candidateId) {
      voters.push({ userId, vote });
    }
  }
  return voters;
}
```

### **2. voterVisualization.mjs** - Working API ✅
**File:** `src/backend/routes/voterVisualization.mjs`

**Endpoints:**
- `GET /api/visualization/voters/:topicId` - All voters for topic
- `GET /api/visualization/voters/:topicId/candidate/:candidateId` - Voters for one candidate

**Response Format:**
```json
{
  "success": true,
  "topicId": "topic_123",
  "candidateId": "cand_456",
  "voterCount": 42,
  "clusterCount": 5,
  "voters": [
    {
      "clusterKey": "gps-user123",
      "lat": 40.7128,
      "lng": -74.0060,
      "locationName": "New York, NY",
      "voterCount": 1,
      "localVotes": 1,
      "foreignVotes": 0,
      "votesByCandidate": { "cand_456": 1 },
      "privacyLevel": "gps"
    }
  ]
}
```

---

## 🔨 TODO: Frontend Integration

### **3. Add Voter State to GlobalChannelRenderer**
**File:** `src/frontend/components/workspace/components/Globe/GlobalChannelRenderer.jsx`

**Add state variables (around line 115):**
```javascript
const [hoveredCandidate, setHoveredCandidate] = useState(null);
const [voterEntities, setVoterEntities] = useState([]);
const [loadingVoters, setLoadingVoters] = useState(false);
```

### **4. Create loadVotersForCandidate Function**
**Add after other useCallbacks (around line 600):**
```javascript
const loadVotersForCandidate = useCallback(async (candidateData, channelData) => {
  if (!candidateData || !channelData) return;
  
  setLoadingVoters(true);
  
  try {
    const response = await fetch(
      `http://localhost:3002/api/visualization/voters/${channelData.id}/candidate/${candidateData.id}`
    );
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        renderVotersOnGlobe(result.voters, candidateData);
      }
    }
  } catch (error) {
    console.error('Failed to load voters:', error);
  } finally {
    setLoadingVoters(false);
  }
}, []);
```

### **5. Create renderVotersOnGlobe Function**
**Add after loadVotersForCandidate:**
```javascript
const renderVotersOnGlobe = useCallback((voterClusters, candidateData) => {
  if (!viewer || !voterClusters || voterClusters.length === 0) return;
  
  // Clear previous voter entities
  voterEntities.forEach(entity => {
    viewer.entities.remove(entity);
  });
  
  const newVoterEntities = [];
  
  voterClusters.forEach(cluster => {
    const entity = viewer.entities.add({
      id: `voter-${cluster.clusterKey}`,
      position: window.Cesium.Cartesian3.fromDegrees(cluster.lng, cluster.lat, 0),
      point: {
        pixelSize: Math.max(4, Math.min(cluster.voterCount * 1.5, 12)),
        color: window.Cesium.Color.fromCssColorString('#10b981').withAlpha(0.8),
        outlineColor: window.Cesium.Color.WHITE,
        outlineWidth: 1,
        scaleByDistance: new window.Cesium.NearFarScalar(1.5e2, 1.5, 1.5e7, 0.3)
      },
      properties: {
        type: 'voter',
        voterCount: cluster.voterCount,
        locationName: cluster.locationName,
        localVotes: cluster.localVotes,
        foreignVotes: cluster.foreignVotes,
        candidateName: candidateData.name
      }
    });
    
    newVoterEntities.push(entity);
  });
  
  setVoterEntities(newVoterEntities);
  
  console.log(`🗳️ Rendered ${newVoterEntities.length} voter clusters for ${candidateData.name}`);
}, [viewer, voterEntities]);
```

### **6. Update Hover Handler to Load Voters**
**Modify the MOUSE_MOVE handler (around line 2920):**

**BEFORE:**
```javascript
clickHandler.setInputAction((event) => {
  const pickedObject = viewer.scene.pick(event.endPosition);
  
  // Remove previous tooltip
  if (hoverTooltip) {
    document.body.removeChild(hoverTooltip);
    hoverTooltip = null;
  }
  
  if (pickedObject && pickedObject.id && pickedObject.id.properties) {
    // ... existing tooltip code ...
  }
}, window.Cesium.ScreenSpaceEventType.MOUSE_MOVE);
```

**AFTER:**
```javascript
clickHandler.setInputAction((event) => {
  const pickedObject = viewer.scene.pick(event.endPosition);
  
  // Remove previous tooltip
  if (hoverTooltip) {
    document.body.removeChild(hoverTooltip);
    hoverTooltip = null;
  }
  
  if (pickedObject && pickedObject.id && pickedObject.id.properties) {
    const entity = pickedObject.id;
    const properties = entity.properties;
    
    const candidateData = properties.candidateData?._value;
    const channelData = properties.channelData?._value;
    
    // **NEW: Load voters when hovering over candidate**
    if (candidateData && channelData) {
      if (!hoveredCandidate || hoveredCandidate.id !== candidateData.id) {
        setHoveredCandidate(candidateData);
        loadVotersForCandidate(candidateData, channelData);
      }
      
      // ... existing tooltip code ...
    }
  } else {
    // **NEW: Clear voters when not hovering**
    if (hoveredCandidate) {
      setHoveredCandidate(null);
      // Clear voter entities
      voterEntities.forEach(entity => {
        viewer.entities.remove(entity);
      });
      setVoterEntities([]);
    }
  }
}, window.Cesium.ScreenSpaceEventType.MOUSE_MOVE);
```

### **7. Update Voter Tooltip (Optional Enhancement)**
**Add voter info to existing hover tooltip (around line 2985):**

```javascript
// After the existing tooltip content, add:
${loadingVoters ? `
  <div style="background: rgba(16, 185, 129, 0.15); border-radius: 8px; padding: 8px 12px; margin: 8px 0; border: 1px solid rgba(16, 185, 129, 0.3);">
    <div style="font-size: 12px; color: #10b981; font-weight: 600;">
      🗳️ Loading voter locations...
    </div>
  </div>
` : voterEntities.length > 0 ? `
  <div style="background: rgba(16, 185, 129, 0.15); border-radius: 8px; padding: 8px 12px; margin: 8px 0; border: 1px solid rgba(16, 185, 129, 0.3);">
    <div style="font-size: 12px; color: #10b981; font-weight: 600; margin-bottom: 4px;">
      🗳️ ${voterEntities.length} VOTER LOCATIONS
    </div>
    <div style="font-size: 11px; color: #cbd5e1;">
      Green dots show voter locations
    </div>
  </div>
` : ''}
```

---

## 🎨 VISUAL BEHAVIOR

### **What the User Sees:**

1. **Globe loads** → Candidates appear as stacked cubes or individual markers
2. **User hovers over candidate** → 
   - Tooltip appears with candidate info
   - API call fetches voter locations
   - Green dots appear on globe showing voter locations
3. **User moves mouse away** →
   - Tooltip disappears
   - Voter dots fade away
4. **User hovers over different candidate** →
   - Previous voters clear
   - New voters load and display

### **Voter Dot Appearance:**
- **Color:** Green (`#10b981`)
- **Size:** Scales with voter count (4-12px)
- **Opacity:** 80%
- **Outline:** White (1px)
- **Distance scaling:** Shrinks when zoomed out

---

## 📊 TESTING STEPS

1. **Start Backend:**
   ```powershell
   cd 'C:\Users\eitana\Desktop\App Development\Relay\RelayCodeBaseV90'
   node src/backend/server.mjs
   ```

2. **Start Frontend:**
   ```powershell
   npm run dev:frontend
   ```

3. **Create Test Vote with Location:**
   - Open browser console
   - Run:
   ```javascript
   await fetch('http://localhost:3002/api/vote/cast', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       userId: 'test-user-1',
       topicId: 'test-topic',
       candidateId: 'test-candidate',
       location: {
         lat: 40.7128,
         lng: -74.0060,
         country: 'United States',
         countryCode: 'US',
         province: 'New York',
         provinceCode: 'US-NY',
         city: 'New York City',
         cityCode: 'NYC'
       }
     })
   });
   ```

4. **Test Voter Visualization:**
   - Hover over test candidate on globe
   - Green dot should appear at NYC location
   - Move mouse away → dot disappears
   - Hover again → dot reappears

---

## 🚀 IMPLEMENTATION ORDER

**Priority 1** (Core functionality - 30 min):
1. Add state variables
2. Add loadVotersForCandidate function
3. Add renderVotersOnGlobe function
4. Update hover handler to call loadVotersForCandidate

**Priority 2** (Cleanup - 15 min):
5. Update hover handler to clear voters when not hovering
6. Test with real data

**Priority 3** (Polish - 15 min):
7. Add voter count to tooltip
8. Style improvements

---

## 📝 IMPLEMENTATION STATUS

- ✅ Backend: Export vote data from votingEngine
- ✅ Backend: Voter visualization API endpoints
- ⏳ Frontend: Add voter state
- ⏳ Frontend: Load voters on hover
- ⏳ Frontend: Render voters on globe
- ⏳ Frontend: Clear voters when not hovering

**Next Action:** Implement Priority 1 changes in GlobalChannelRenderer.jsx

---

**Ready to proceed with frontend implementation?** 🚀
