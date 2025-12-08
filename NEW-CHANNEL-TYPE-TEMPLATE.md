# Adding a New Channel Type - Quick Start Guide

**Estimated Time:** 20-30 minutes  
**Difficulty:** Easy  
**Prerequisites:** Basic React knowledge

---

## 📋 Overview

This guide shows you how to add a new channel type to Relay using the compositional architecture. No need to copy 800+ lines of code or modify core components!

---

## 🎯 What You'll Create

A new channel type configuration that defines:
- 🎨 **Visual appearance** (icons, colors, layout)
- 🔧 **Custom metadata** (what info to display)
- ⚡ **Actions** (buttons, interactions)
- 🎪 **Behaviors** (selection, voting, camera movements)

---

## 📝 Step-by-Step Guide

### Step 1: Choose Your Channel Type Name (1 minute)

Pick a descriptive name for your channel type:
- `regional` - For regional competitions
- `temporal` - For time-based voting
- `environmental` - For environmental proposals
- `economic` - For economic policy channels
- `cultural` - For cultural initiatives

**Example:** We'll create a `regional` channel type.

---

### Step 2: Create Configuration Object (10 minutes)

Open `src/frontend/config/channelTypeConfigs.js` and add your configuration:

```javascript
// ================================
// REGIONAL CHANNEL TYPE
// ================================
export const regionalChannelConfig = {
  // 1. Basic Info
  type: 'regional',
  headerIcon: '🏛️',
  emptyStateMessage: 'Select a regional channel to view proposals',
  noCandidatesMessage: 'No regional proposals yet.',

  // 2. Metadata Display
  /**
   * Render extra metadata in candidate card
   * Shows regional-specific information
   */
  renderMetadata: (candidate, channel) => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        marginBottom: '8px',
        fontSize: '11px',
        color: '#94a3b8'
      }}>
        {/* Population info */}
        {candidate.population && (
          <span>👥 Population: {candidate.population.toLocaleString()}</span>
        )}
        
        {/* Territory info */}
        {candidate.territory && (
          <span>🗺️ Territory: {candidate.territory}</span>
        )}
        
        {/* Jurisdiction level */}
        {candidate.jurisdiction && (
          <span>⚖️ {candidate.jurisdiction}</span>
        )}
      </div>
    );
  },

  // 3. Custom Actions
  /**
   * Render channel-specific action buttons
   */
  renderActions: (candidate, channel, extraProps, expandedOptions, setExpandedOptions) => {
    return (
      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // View regional details
            console.log('📊 View regional details:', candidate);
          }}
          style={{
            padding: '6px 12px',
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '6px',
            color: '#a5b4fc',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📊 View Details
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Zoom to region
            if (candidate.bounds && window.cesiumViewer) {
              const { center } = candidate.bounds;
              window.cesiumViewer.camera.flyTo({
                destination: window.Cesium.Cartesian3.fromDegrees(
                  center.lng,
                  center.lat,
                  100000 // 100km height for regions
                ),
                duration: 1.5
              });
            }
          }}
          style={{
            padding: '6px 12px',
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '6px',
            color: '#a5b4fc',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📍 Show Region
        </button>
      </div>
    );
  },

  // 4. Selection Behavior
  /**
   * What happens when user clicks a candidate
   */
  onCandidateSelect: (candidate, channel, extraProps) => {
    console.log('🏛️ [Regional] Candidate selected:', candidate.name);
    
    // Zoom camera to region
    if (window.cesiumViewer && window.Cesium && candidate.bounds) {
      const { center } = candidate.bounds;
      
      window.cesiumViewer.camera.flyTo({
        destination: window.Cesium.Cartesian3.fromDegrees(
          center.lng,
          center.lat,
          100000 // Regional zoom level
        ),
        duration: 1.5,
        orientation: {
          heading: window.Cesium.Math.toRadians(0),
          pitch: window.Cesium.Math.toRadians(-45),
          roll: 0.0
        }
      });
    }
  },

  // 5. Vote Success Handler
  /**
   * What happens after a successful vote
   */
  onVoteSuccess: (candidateId, result, channel) => {
    console.log('✅ [Regional] Vote recorded:', candidateId);
    
    // Optional: Trigger visual feedback
    // Optional: Update regional statistics
    // Optional: Notify other systems
  },

  // 6. Custom Preview (Optional)
  /**
   * Render a preview image/visualization
   */
  renderPreview: (candidate, channel, extraProps) => {
    if (!candidate.mapImageUrl) return null;
    
    return (
      <div style={{
        width: '100%',
        height: '120px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 8,
        marginBottom: 8,
        overflow: 'hidden'
      }}>
        <img
          src={candidate.mapImageUrl}
          alt="Regional Map"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>
    );
  },

  // 7. Header Metadata (Optional)
  /**
   * Extra info in channel header
   */
  renderHeaderMetadata: (channel, candidates) => {
    const totalPopulation = candidates.reduce((sum, c) => 
      sum + (c.population || 0), 0
    );
    
    return (
      <span>👥 {totalPopulation.toLocaleString()} total population</span>
    );
  }
};
```

---

### Step 3: Register Configuration (2 minutes)

In the same file (`channelTypeConfigs.js`), add your config to the registry:

```javascript
// ================================
// CHANNEL TYPE REGISTRY
// ================================
export const channelTypeRegistry = {
  'global': globalChannelConfig,
  'boundary': boundaryChannelConfig,
  'proximity': proximityChannelConfig,
  'regional': regionalChannelConfig,  // ← Add your new type here
  
  // Future types:
  // 'temporal': temporalChannelConfig,
  // 'environmental': environmentalChannelConfig,
  // 'economic': economicChannelConfig,
};
```

---

### Step 4: Test Your Channel Type (15 minutes)

1. **Start the dev server:**
   ```bash
   npm run dev:frontend
   npm run dev:backend
   ```

2. **Create test data:**
   - Open the Test Data Panel
   - Add a channel with `type: 'regional'`
   - Add candidates with regional metadata

3. **Click your channel:**
   - Should see your custom icon (🏛️)
   - Should see your custom metadata
   - Should see your custom actions
   - Vote button should work automatically

4. **Verify behaviors:**
   - ✅ Camera zoom works
   - ✅ Vote submission works
   - ✅ Vote counts update
   - ✅ Selection highlights candidate

---

## 🎨 Customization Options

### Available Configuration Properties

```javascript
{
  // === REQUIRED ===
  type: 'string',              // Unique identifier
  
  // === VISUAL ===
  headerIcon: '🏛️',           // Emoji or icon
  emptyStateMessage: 'string', // When no channel selected
  noCandidatesMessage: 'string', // When no candidates
  
  // === RENDERING ===
  renderMetadata: (candidate, channel, extraProps) => ReactNode,
  renderPreview: (candidate, channel, extraProps) => ReactNode,
  renderActions: (candidate, channel, extraProps, expanded, setExpanded) => ReactNode,
  renderHeaderMetadata: (channel, candidates) => ReactNode,
  renderExtraUI: (channel, selectedCandidate, extraProps) => ReactNode,
  renderPreHeader: (channel, extraProps) => ReactNode,
  
  // === BEHAVIOR ===
  onCandidateSelect: (candidate, channel, extraProps) => void,
  onVoteSuccess: (candidateId, result, channel) => void,
  onDataLoaded: (channels, voteCounts, userVotes) => void,
  
  // === PROCESSING ===
  processCandidates: (candidates, channel) => candidates,
  formatDescription: (candidate, channel) => string,
  disableDefaultSort: boolean
}
```

### All properties are **optional** except `type`!

---

## 📊 Example Use Cases

### 1. Simple Channel Type (Minimal Config)

```javascript
export const simpleChannelConfig = {
  type: 'simple',
  headerIcon: '⭐'
  // That's it! Uses all defaults
};
```

### 2. Visual-Heavy Channel Type

```javascript
export const visualChannelConfig = {
  type: 'visual',
  headerIcon: '🎨',
  
  renderPreview: (candidate) => (
    <video src={candidate.videoUrl} controls style={{ width: '100%' }} />
  ),
  
  renderMetadata: (candidate) => (
    <div>
      <span>🎬 Duration: {candidate.duration}</span>
      <span>👍 Likes: {candidate.likes}</span>
    </div>
  )
};
```

### 3. Interactive Channel Type

```javascript
export const interactiveChannelConfig = {
  type: 'interactive',
  headerIcon: '🎮',
  
  renderActions: (candidate) => (
    <>
      <button onClick={() => play(candidate)}>▶️ Play</button>
      <button onClick={() => share(candidate)}>🔗 Share</button>
      <button onClick={() => download(candidate)}>⬇️ Download</button>
    </>
  ),
  
  onCandidateSelect: (candidate) => {
    // Start interactive preview
    startInteractiveMode(candidate);
  }
};
```

---

## 🐛 Troubleshooting

### Channel Not Showing Up?
1. Check `channelTypeRegistry` - is your type registered?
2. Check channel data - does it have `type: 'yourtype'` or `category: 'yourtype'`?
3. Check console for errors

### Custom Actions Not Working?
1. Did you `e.stopPropagation()` in button handlers?
2. Are button styles correct (with `cursor: 'pointer'`)?
3. Check console for JavaScript errors

### Camera Not Zooming?
1. Does `window.cesiumViewer` exist?
2. Does `window.Cesium` exist?
3. Is candidate.location or candidate.bounds defined?
4. Check Cesium console for errors

### Metadata Not Displaying?
1. Is `renderMetadata` returning valid JSX?
2. Are candidate properties defined?
3. Check React DevTools for component tree

---

## 🎯 Best Practices

### 1. Keep Configs Small
```javascript
// ✅ Good
renderMetadata: (candidate) => (
  <MetadataComponent candidate={candidate} />
)

// ❌ Bad - too much logic in config
renderMetadata: (candidate) => {
  const data = processComplexData(candidate);
  const formatted = formatData(data);
  return <div>{formatted.map(...)}</div>
}
```

### 2. Use Utility Functions
```javascript
// Create utility file
// src/frontend/utils/regionalUtils.js
export const formatRegionalData = (candidate) => { ... };

// Use in config
renderMetadata: (candidate) => (
  <div>{formatRegionalData(candidate)}</div>
)
```

### 3. Consistent Styling
```javascript
// Use existing style patterns from other configs
const buttonStyle = {
  padding: '6px 12px',
  background: 'rgba(99, 102, 241, 0.2)',
  border: '1px solid rgba(99, 102, 241, 0.4)',
  borderRadius: '6px',
  color: '#a5b4fc',
  fontSize: '11px',
  cursor: 'pointer',
  transition: 'all 0.2s'
};
```

### 4. Error Handling
```javascript
onCandidateSelect: (candidate, channel) => {
  try {
    // Your code
    zoomToRegion(candidate);
  } catch (error) {
    console.error('[Regional] Selection error:', error);
  }
}
```

---

## 📚 Reference Examples

### Full Working Examples

Look at these configs for inspiration:
- **globalChannelConfig** - Simple, clean example
- **boundaryChannelConfig** - Complex with previews and editing
- **proximityChannelConfig** - Medium complexity

They're all in `src/frontend/config/channelTypeConfigs.js`

---

## 🚀 You're Done!

Your new channel type is ready to use! The system automatically:
- ✅ Detects your channel type
- ✅ Applies your configuration
- ✅ Handles voting
- ✅ Updates vote counts
- ✅ Manages selection state
- ✅ Processes blockchain transactions

No additional code needed! 🎉

---

## 📞 Need Help?

1. Check existing configs in `channelTypeConfigs.js`
2. Review `CHANNEL-PANEL-REFACTOR-COMPLETE.md`
3. Review `CHANNEL-ARCHITECTURE-RECOMMENDATION.md`
4. Ask the development team

---

**Happy Channel Building! 🎉**
