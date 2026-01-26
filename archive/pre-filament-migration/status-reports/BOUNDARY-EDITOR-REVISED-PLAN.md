# 🗺️ **BOUNDARY EDITOR - REVISED IMPLEMENTATION PLAN**
**Date:** October 8, 2025  
**Version:** 2.0 (On-Globe Editor)  
**Status:** Ready to Implement

---

## 🎯 **REVISED ARCHITECTURE**

### **User Experience Flow:**

```
1. Right-click "India" (country)
   ↓
2. Click "Boundary" button
   ↓
3. DUAL INTERFACE OPENS:
   ┌─────────────────────────────────────────────────────────────┐
   │ LEFT: Channel Ranking Panel (existing component)            │
   │ - List all boundary proposals                               │
   │ - Vote buttons                                              │
   │ - Proposal descriptions                                     │
   │                                                             │
   │ Click on proposal → Highlights on globe                     │
   └─────────────────────────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────────────────────────┐
   │ RIGHT: 3D GLOBE with EDITOR OVERLAY                         │
   │                                                             │
   │  [Globe shows India with boundary highlighted]              │
   │  📍 Pinpoints at each polygon vertex                        │
   │  - Drag pinpoints to reshape                                │
   │  - Add new pinpoints (click on line)                        │
   │  - Delete pinpoints (right-click)                           │
   │                                                             │
   │  [Affected regions highlighted in yellow]                   │
   │  ⚠️ Pakistan, Bangladesh, Nepal affected                    │
   │                                                             │
   │  [Before/After View Toggle]                                 │
   │  □ Show Original  ☑ Show New  □ Show Difference            │
   │                                                             │
   │  [Action Buttons]                                           │
   │  [Save as New Proposal] [Cancel] [Preview Impact]          │
   └─────────────────────────────────────────────────────────────┘
```

---

## 📊 **HIERARCHICAL VOTING SYSTEM**

### **One Level Up Rule:**

| Boundary Level | Voted By | Rationale |
|----------------|----------|-----------|
| **City** | Province residents | City change affects province vote clustering |
| **Province** | Country residents | Province change affects country aggregation |
| **Country** | Region/Continent residents | Country change affects regional politics |
| **Region** | World (all users) | Regional boundaries are global concern |

### **Example - Kashmir Dispute:**

```javascript
// India boundary proposal
{
  regionName: "India",
  regionType: "country",
  votingScope: "region",      // ← Voted by Asia/World
  affectedRegions: [
    "Pakistan",   // ← Also affected, gets notified
    "China",      // ← Tibet border
    "Nepal"       // ← Northern border
  ]
}

// California boundary proposal
{
  regionName: "California", 
  regionType: "province",
  votingScope: "country",      // ← Voted by USA residents
  affectedRegions: [
    "Nevada",     // ← Eastern border
    "Oregon",     // ← Northern border
    "Arizona"     // ← Southern border
  ]
}
```

---

## 🏗️ **IMPLEMENTATION PHASES**

---

## **PHASE 1: Backend - Auto-Channel with Hierarchical Voting** (6-8 hours)

### **1.1 Enhanced BoundaryChannelService**

**File:** `src/backend/services/boundaryChannelService.mjs`

```javascript
class BoundaryChannelService {
  
  /**
   * Create boundary channel with correct voting scope
   */
  async createBoundaryChannel(regionName, regionType, regionCode) {
    const channelId = `boundary-${regionCode}-${crypto.randomBytes(4).toString('hex')}`;
    
    // Determine voting scope (one level up)
    const votingScope = this.getVotingScope(regionType);
    const votingRegion = await this.getVotingRegion(regionCode, regionType);
    
    const channelData = {
      id: channelId,
      name: `${regionName} Boundaries`,
      type: 'boundary',
      subtype: 'geographic-boundary',
      regionName: regionName,
      regionCode: regionCode,
      regionType: regionType, // "city", "province", "country", "region"
      
      // NEW: Voting scope
      votingScope: votingScope,        // "province", "country", "region", "world"
      votingRegion: votingRegion,      // Parent region code
      votingRestriction: true,         // Only parent region can vote
      
      description: `Democratic boundary proposals for ${regionName}. ${this.getVotingDescription(regionType)}.`,
      
      isRelayOfficial: true,
      autoCreated: true,
      createdAt: Date.now(),
      
      candidates: [],
      
      metadata: {
        purpose: 'boundary-voting',
        affectsVoteClustering: true,
        hierarchicalVoting: true,
        impactedRegions: []  // Will be populated when proposals are created
      }
    };

    await channelManager.createChannel(channelData);
    
    // Create official boundary proposal
    await this.createOfficialBoundaryProposal(channelId, regionName, regionType, regionCode);
    
    return channelData;
  }

  /**
   * Determine voting scope (one level up)
   */
  getVotingScope(regionType) {
    const hierarchy = {
      'city': 'province',
      'province': 'country',
      'country': 'region',
      'region': 'world'
    };
    return hierarchy[regionType] || 'world';
  }

  /**
   * Get parent region for voting
   */
  async getVotingRegion(regionCode, regionType) {
    if (regionType === 'city') {
      // City code: "US-CA-SF" → Return "US-CA" (province)
      const parts = regionCode.split('-');
      return parts.slice(0, 2).join('-');
    } else if (regionType === 'province') {
      // Province code: "US-CA" → Return "US" (country)
      return regionCode.split('-')[0];
    } else if (regionType === 'country') {
      // Country code: "IND" → Return region (e.g., "ASIA")
      return await this.getCountryRegion(regionCode);
    } else if (regionType === 'region') {
      // Region → World
      return 'WORLD';
    }
  }

  /**
   * Get voting description for UI
   */
  getVotingDescription(regionType) {
    const descriptions = {
      'city': 'Voting restricted to province residents',
      'province': 'Voting restricted to country residents',
      'country': 'Voting open to region/continent residents',
      'region': 'Voting open to all global users'
    };
    return descriptions[regionType] || 'Voting open to all';
  }

  /**
   * Check if user can vote on boundary proposal
   */
  async canUserVote(userId, channelId) {
    const channel = await channelManager.getChannel(channelId);
    if (!channel || channel.type !== 'boundary') {
      return { canVote: false, reason: 'Not a boundary channel' };
    }

    // Get user's location
    const userLocation = await getUserLocation(userId);
    if (!userLocation) {
      return { canVote: false, reason: 'User location unknown' };
    }

    // Check if user is in voting region (one level up)
    const votingRegion = channel.votingRegion;
    const userIsInVotingRegion = await this.isUserInRegion(userId, votingRegion);

    if (!userIsInVotingRegion) {
      return { 
        canVote: false, 
        reason: `Only ${votingRegion} residents can vote on ${channel.regionName} boundaries` 
      };
    }

    return { canVote: true };
  }

  /**
   * Calculate affected regions when boundary changes
   */
  async calculateAffectedRegions(regionCode, newGeometry) {
    console.log(`🔍 Calculating regions affected by ${regionCode} boundary change...`);
    
    const affectedRegions = [];
    
    // Load all neighboring regions
    const neighbors = await this.getNeighboringRegions(regionCode);
    
    for (const neighbor of neighbors) {
      // Check if new boundary overlaps with neighbor
      const neighborGeometry = await this.getRegionGeometry(neighbor.code);
      const hasOverlap = this.checkGeometryOverlap(newGeometry, neighborGeometry);
      
      if (hasOverlap) {
        affectedRegions.push({
          code: neighbor.code,
          name: neighbor.name,
          overlapPercentage: this.calculateOverlap(newGeometry, neighborGeometry)
        });
      }
    }
    
    console.log(`✅ Found ${affectedRegions.length} affected regions:`, affectedRegions);
    return affectedRegions;
  }

  /**
   * Notify affected regions of boundary proposal
   */
  async notifyAffectedRegions(proposalId, affectedRegions) {
    console.log(`📢 Notifying affected regions about proposal ${proposalId}...`);
    
    for (const region of affectedRegions) {
      // Create notification for region
      await notificationService.create({
        type: 'boundary-proposal',
        regionCode: region.code,
        message: `New boundary proposal affects ${region.name}`,
        proposalId: proposalId,
        priority: 'high'
      });
      
      // Emit event for real-time notification
      eventBus.emit('boundary:proposal-affects-region', {
        proposalId,
        affectedRegion: region
      });
    }
    
    console.log(`✅ Notifications sent to ${affectedRegions.length} regions`);
  }
}
```

---

## **PHASE 2: Frontend - On-Globe Boundary Editor** (10-12 hours)

### **2.1 Globe Boundary Editor Component**

**File:** `src/frontend/components/main/globe/editors/GlobeBoundaryEditor.jsx`

```javascript
/**
 * Globe Boundary Editor
 * Renders boundary editing UI directly on 3D globe with draggable pinpoints
 */

import React, { useState, useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import './GlobeBoundaryEditor.css';

const GlobeBoundaryEditor = ({
  cesiumViewer,
  proposal,          // Existing proposal to edit (or null for create new)
  regionName,
  regionType,
  channelId,
  onSave,
  onCancel
}) => {
  const [vertices, setVertices] = useState([]); // Array of {lat, lng, entity}
  const [mode, setMode] = useState('view'); // 'view', 'edit', 'add', 'delete'
  const [originalGeometry, setOriginalGeometry] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [affectedRegions, setAffectedRegions] = useState([]);
  const [description, setDescription] = useState('');
  
  const entitiesRef = useRef([]);
  const polygonEntityRef = useRef(null);
  const handlerRef = useRef(null);

  useEffect(() => {
    if (!cesiumViewer) return;

    // Load existing proposal or create new
    if (proposal) {
      loadProposal(proposal);
    } else {
      startNewBoundary();
    }

    return () => {
      cleanup();
    };
  }, [cesiumViewer, proposal]);

  /**
   * Load existing boundary proposal
   */
  const loadProposal = (proposal) => {
    console.log('🗺️ Loading boundary proposal:', proposal);
    
    const geometry = proposal.location.geometry;
    setOriginalGeometry(geometry);
    
    // Extract coordinates
    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0];
      loadVertices(coords);
    }
    
    setDescription(proposal.description);
  };

  /**
   * Start creating new boundary
   */
  const startNewBoundary = () => {
    console.log('🆕 Starting new boundary creation');
    setMode('add');
  };

  /**
   * Load vertices and create pinpoint entities
   */
  const loadVertices = (coordinates) => {
    const newVertices = coordinates.map((coord, index) => {
      const [lng, lat] = coord;
      
      // Create pinpoint entity
      const entity = cesiumViewer.entities.add({
        id: `vertex-${index}`,
        position: Cesium.Cartesian3.fromDegrees(lng, lat),
        point: {
          pixelSize: 12,
          color: mode === 'edit' ? Cesium.Color.YELLOW : Cesium.Color.CYAN,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        properties: {
          type: 'boundary-vertex',
          index: index
        }
      });

      entitiesRef.current.push(entity);

      return { lat, lng, entity, index };
    });

    setVertices(newVertices);
    
    // Draw polygon connecting vertices
    drawPolygon(newVertices);
  };

  /**
   * Draw polygon on globe
   */
  const drawPolygon = (vertexArray) => {
    // Remove old polygon
    if (polygonEntityRef.current) {
      cesiumViewer.entities.remove(polygonEntityRef.current);
    }

    if (vertexArray.length < 3) {
      return; // Need at least 3 points
    }

    // Create polygon hierarchy
    const positions = vertexArray.map(v => 
      Cesium.Cartesian3.fromDegrees(v.lng, v.lat)
    );

    const polygonEntity = cesiumViewer.entities.add({
      id: 'boundary-polygon',
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(positions),
        material: Cesium.Color.CYAN.withAlpha(0.3),
        outline: true,
        outlineColor: Cesium.Color.CYAN,
        outlineWidth: 3,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      },
      properties: {
        type: 'boundary-polygon'
      }
    });

    polygonEntityRef.current = polygonEntity;
    entitiesRef.current.push(polygonEntity);
  };

  /**
   * Enable edit mode - draggable pinpoints
   */
  const enableEditMode = () => {
    console.log('✏️ Enabling edit mode');
    setMode('edit');

    // Make vertices draggable
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumViewer.scene.canvas);
    handlerRef.current = handler;

    let draggedVertex = null;
    let isDragging = false;

    // Mouse down - start drag
    handler.setInputAction((click) => {
      const pickedObject = cesiumViewer.scene.pick(click.position);
      
      if (pickedObject && pickedObject.id && 
          pickedObject.id.properties?.type?.getValue() === 'boundary-vertex') {
        draggedVertex = pickedObject.id;
        isDragging = true;
        console.log('📍 Started dragging vertex:', draggedVertex.id);
        
        // Highlight dragged vertex
        draggedVertex.point.pixelSize = 16;
        draggedVertex.point.color = Cesium.Color.ORANGE;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // Mouse move - update vertex position
    handler.setInputAction((movement) => {
      if (!isDragging || !draggedVertex) return;

      const cartesian = cesiumViewer.camera.pickEllipsoid(
        movement.endPosition,
        cesiumViewer.scene.globe.ellipsoid
      );

      if (cartesian) {
        // Update vertex position
        draggedVertex.position = cartesian;

        // Get lat/lng
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const lng = Cesium.Math.toDegrees(cartographic.longitude);

        // Update vertices array
        const index = draggedVertex.properties.index.getValue();
        setVertices(prev => {
          const updated = [...prev];
          updated[index] = { lat, lng, entity: draggedVertex, index };
          
          // Redraw polygon
          drawPolygon(updated);
          
          return updated;
        });
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Mouse up - end drag
    handler.setInputAction(() => {
      if (draggedVertex) {
        draggedVertex.point.pixelSize = 12;
        draggedVertex.point.color = Cesium.Color.YELLOW;
        console.log('✅ Vertex drag complete');
      }
      
      isDragging = false;
      draggedVertex = null;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    // Right-click on vertex - delete
    handler.setInputAction((click) => {
      const pickedObject = cesiumViewer.scene.pick(click.position);
      
      if (pickedObject && pickedObject.id && 
          pickedObject.id.properties?.type?.getValue() === 'boundary-vertex') {
        deleteVertex(pickedObject.id);
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    // Click on polygon line - add new vertex
    handler.setInputAction((click) => {
      const pickedObject = cesiumViewer.scene.pick(click.position);
      
      if (pickedObject && pickedObject.id && 
          pickedObject.id.properties?.type?.getValue() === 'boundary-polygon') {
        
        const cartesian = cesiumViewer.camera.pickEllipsoid(
          click.position,
          cesiumViewer.scene.globe.ellipsoid
        );

        if (cartesian) {
          addVertexAtPosition(cartesian);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  /**
   * Add new vertex at clicked position
   */
  const addVertexAtPosition = (cartesian) => {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const lat = Cesium.Math.toDegrees(cartographic.latitude);
    const lng = Cesium.Math.toDegrees(cartographic.longitude);

    console.log(`➕ Adding vertex at: ${lat.toFixed(2)}, ${lng.toFixed(2)}`);

    // Find closest line segment to insert vertex
    const insertIndex = findClosestLineSegment(lat, lng);

    // Create new vertex entity
    const entity = cesiumViewer.entities.add({
      id: `vertex-${Date.now()}`,
      position: cartesian,
      point: {
        pixelSize: 12,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      properties: {
        type: 'boundary-vertex',
        index: insertIndex
      }
    });

    entitiesRef.current.push(entity);

    // Insert into vertices array
    setVertices(prev => {
      const updated = [...prev];
      updated.splice(insertIndex, 0, { lat, lng, entity, index: insertIndex });
      
      // Update indices
      updated.forEach((v, i) => {
        v.index = i;
        v.entity.properties.index = i;
      });
      
      drawPolygon(updated);
      return updated;
    });
  };

  /**
   * Delete vertex
   */
  const deleteVertex = (vertexEntity) => {
    console.log('🗑️ Deleting vertex:', vertexEntity.id);

    if (vertices.length <= 3) {
      alert('Cannot delete - polygon must have at least 3 vertices');
      return;
    }

    const index = vertexEntity.properties.index.getValue();

    // Remove entity
    cesiumViewer.entities.remove(vertexEntity);
    entitiesRef.current = entitiesRef.current.filter(e => e !== vertexEntity);

    // Remove from vertices array
    setVertices(prev => {
      const updated = prev.filter(v => v.index !== index);
      
      // Update indices
      updated.forEach((v, i) => {
        v.index = i;
        v.entity.properties.index = i;
      });
      
      drawPolygon(updated);
      return updated;
    });
  };

  /**
   * Find closest line segment for new vertex insertion
   */
  const findClosestLineSegment = (lat, lng) => {
    let minDistance = Infinity;
    let insertIndex = 0;

    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];

      const distance = distanceToLineSegment(lat, lng, v1.lat, v1.lng, v2.lat, v2.lng);

      if (distance < minDistance) {
        minDistance = distance;
        insertIndex = i + 1;
      }
    }

    return insertIndex;
  };

  /**
   * Calculate distance from point to line segment
   */
  const distanceToLineSegment = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * Preview impact of boundary change
   */
  const previewImpact = async () => {
    console.log('🔍 Previewing boundary change impact...');

    // Convert vertices to GeoJSON
    const newGeometry = {
      type: 'Polygon',
      coordinates: [vertices.map(v => [v.lng, v.lat])]
    };

    // Call API to calculate affected regions
    try {
      const response = await fetch('/api/boundaries/preview-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionCode: getRegionCode(regionName, regionType),
          newGeometry
        })
      });

      const data = await response.json();

      if (data.success) {
        setAffectedRegions(data.affectedRegions);
        
        // Highlight affected regions on globe
        highlightAffectedRegions(data.affectedRegions);
        
        alert(`⚠️ This boundary change affects ${data.affectedRegions.length} regions:\n` +
              data.affectedRegions.map(r => `- ${r.name} (${r.overlapPercentage}% overlap)`).join('\n'));
      }
    } catch (error) {
      console.error('❌ Error previewing impact:', error);
    }
  };

  /**
   * Highlight affected regions on globe
   */
  const highlightAffectedRegions = (regions) => {
    regions.forEach(region => {
      // TODO: Load and highlight affected region geometry
      console.log(`⚠️ Highlighting affected region: ${region.name}`);
    });
  };

  /**
   * Save boundary proposal
   */
  const handleSave = async () => {
    if (vertices.length < 3) {
      alert('Boundary must have at least 3 vertices');
      return;
    }

    console.log('💾 Saving boundary proposal...');

    // Convert to GeoJSON
    const geojson = {
      type: 'Polygon',
      coordinates: [vertices.map(v => [v.lng, v.lat])]
    };

    const proposalData = {
      id: proposal ? proposal.id : `proposal-${Date.now()}`,
      name: `${regionName} - ${description || 'Custom Boundary'}`,
      description: description,
      
      location: {
        type: 'polygon',
        geometry: geojson,
        regionName: regionName,
        regionCode: getRegionCode(regionName, regionType)
      },
      
      metadata: {
        basedOn: proposal ? proposal.id : null,
        affectedRegions: affectedRegions,
        vertexCount: vertices.length
      }
    };

    try {
      const response = await fetch('/api/boundaries/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          proposal: proposalData
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Proposal saved successfully');
        onSave(proposalData);
      } else {
        console.error('❌ Failed to save proposal:', data.error);
        alert('Failed to save: ' + data.error);
      }
    } catch (error) {
      console.error('❌ Error saving proposal:', error);
      alert('Error: ' + error.message);
    }
  };

  /**
   * Cleanup entities
   */
  const cleanup = () => {
    console.log('🧹 Cleaning up boundary editor...');

    entitiesRef.current.forEach(entity => {
      cesiumViewer.entities.remove(entity);
    });
    entitiesRef.current = [];

    if (handlerRef.current) {
      handlerRef.current.destroy();
      handlerRef.current = null;
    }
  };

  // Render editor controls overlay
  return (
    <div className="globe-boundary-editor-overlay">
      {/* Editor Controls */}
      <div className="editor-controls">
        <h3>✏️ Boundary Editor - {regionName}</h3>
        
        <input
          type="text"
          placeholder="Proposal description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="description-input"
        />

        <div className="mode-buttons">
          <button 
            onClick={() => setMode('view')}
            className={mode === 'view' ? 'active' : ''}
          >
            👁️ View
          </button>
          <button 
            onClick={enableEditMode}
            className={mode === 'edit' ? 'active' : ''}
          >
            ✏️ Edit
          </button>
        </div>

        <div className="view-toggles">
          <label>
            <input 
              type="checkbox" 
              checked={showDiff}
              onChange={(e) => setShowDiff(e.target.checked)}
            />
            Show Difference
          </label>
        </div>

        <div className="action-buttons">
          <button onClick={previewImpact}>
            🔍 Preview Impact
          </button>
          <button onClick={handleSave} className="save-btn">
            💾 Save Proposal
          </button>
          <button onClick={onCancel} className="cancel-btn">
            ❌ Cancel
          </button>
        </div>

        {affectedRegions.length > 0 && (
          <div className="affected-regions-list">
            <h4>⚠️ Affected Regions:</h4>
            <ul>
              {affectedRegions.map(region => (
                <li key={region.code}>
                  {region.name} ({region.overlapPercentage}% overlap)
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="editor-instructions">
          <p><strong>Instructions:</strong></p>
          <ul>
            <li>📍 <strong>Drag</strong> pinpoints to reshape boundary</li>
            <li>➕ <strong>Click</strong> on line to add new vertex</li>
            <li>🗑️ <strong>Right-click</strong> pinpoint to delete</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GlobeBoundaryEditor;
```

---

## **PHASE 3: Hierarchical Voting Integration** (4-6 hours)

### **3.1 Update Voting System with Region Restrictions**

**File:** `src/backend/voting/votingEngine.mjs`

```javascript
/**
 * Cast vote with region restriction check
 */
async function processVote(userId, topicId, voteType, candidateId, reliability, location) {
  // Check if this is a boundary channel
  const channel = await channelManager.getChannelByTopic(topicId);
  
  if (channel && channel.type === 'boundary') {
    // Boundary vote - check region restriction
    const canVote = await boundaryChannelService.canUserVote(userId, channel.id);
    
    if (!canVote.canVote) {
      throw new Error(`Vote denied: ${canVote.reason}`);
    }
    
    console.log(`✅ User ${userId} authorized to vote on ${channel.regionName} boundary`);
  }
  
  // Continue with normal voting logic...
  const vote = {
    userId,
    topicId,
    voteType,
    candidateId,
    timestamp: Date.now(),
    location,
    reliability
  };
  
  authoritativeVoteLedger.get(userId).set(topicId, vote);
  
  return vote;
}
```

---

## **PHASE 4: Real-time Impact Visualization** (4-5 hours)

### **4.1 Show Clustering Changes**

When user reshapes boundary, show:
- ✅ Before: Original vote clusters
- ✅ After: New vote clusters with changed boundary
- ✅ Difference: Votes that moved between regions

**Example:**
```
Kashmir Boundary Change Preview:

Before:
  India: 10,523 votes
  Pakistan: 3,421 votes

After (with Kashmir in India):
  India: 11,235 votes (+712)
  Pakistan: 2,709 votes (-712)

⚠️ 712 votes will re-cluster if this boundary wins
```

---

## 📊 **UPDATED TIMELINE**

| Phase | Duration | Priority | Status |
|-------|----------|----------|--------|
| **Phase 1: Backend Auto-Channel + Hierarchical Voting** | 6-8 hours | 🔴 Critical | Not Started |
| **Phase 2: On-Globe Boundary Editor** | 10-12 hours | 🔴 Critical | Not Started |
| **Phase 3: Voting Integration** | 4-6 hours | 🟡 High | Not Started |
| **Phase 4: Impact Visualization** | 4-5 hours | 🟢 Medium | Not Started |
| **TOTAL** | **24-31 hours** | | **~3-4 days** |

---

## 🎯 **SUCCESS CRITERIA**

✅ **User Experience:**
1. Right-click region → Boundary menu → Opens dual interface
2. LEFT: Channel ranking panel shows proposals
3. RIGHT: Globe shows boundary with draggable pinpoints
4. Drag pinpoints → Boundary reshapes in real-time
5. Click "Preview Impact" → See affected regions highlighted
6. Save proposal → Appears in ranking panel
7. Vote on proposal → Only allowed if in parent region

✅ **Technical:**
1. Hierarchical voting enforced (city→province, province→country, etc.)
2. Affected regions calculated and highlighted
3. Vote clustering updates when boundary wins
4. Real-time before/after comparison works

---

**Ready to start implementation?** 

Shall I begin with **Phase 1 (Backend + Hierarchical Voting)**?
