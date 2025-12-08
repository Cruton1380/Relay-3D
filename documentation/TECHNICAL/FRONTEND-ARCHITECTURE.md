# 🎨 Frontend Architecture Overview

## Executive Summary

The Relay Network frontend is built around **Base Model 1**, a sophisticated React-based interface that provides a unified voting platform integrating 3D visualization, real-time communication, and democratic participation tools. The architecture emphasizes modular design, mode-based workflows, and seamless integration with the blockchain voting backend.

**Key Innovations:**
- **Mode-Based Interface**: Six distinct modes (Focus, Social, Governance, Proximity, Discovery, Analysis) optimizing UI for different democratic activities
- **3D Interactive Elements**: WebGL-powered globe visualization with interactive voting towers and candidate objects
- **Drag-and-Drop Workspace**: Fully customizable panel system with persistent layouts and real-time synchronization
- **Blockchain Integration**: Direct connection to sophisticated voting backend with cryptographic verification

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Mode System](#mode-system)
4. [State Management](#state-management)
5. [Component Hierarchy](#component-hierarchy)
6. [Integration Points](#integration-points)
7. [Performance Considerations](#performance-considerations)
8. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Foundation Structure

```
src/
├── App.jsx                    # Clean entry point - routes to Base Model 1
├── main.jsx                   # Application bootstrap with global styles
├── base-model-1/             # Primary frontend implementation
│   ├── BaseModel1.jsx        # Main application component
│   ├── WorkspaceLayout.jsx   # Mode-based workspace management
│   ├── ModeContext.jsx       # Mode switching and configuration
│   ├── core/                 # Core 3D and visualization components
│   ├── panels/               # Draggable workspace panels
│   ├── ui/                   # Reusable UI components
│   └── store/                # State management
└── hooks/                    # Shared React hooks
```

### Design Principles

1. **Modular Architecture**: Each panel and component operates independently with clear interfaces
2. **Mode-Driven UI**: Interface adapts based on user's current democratic activity
3. **Progressive Enhancement**: Core functionality works without 3D capabilities
4. **Real-Time First**: All interactions provide immediate feedback and live updates
5. **Accessibility Focus**: Full keyboard navigation and screen reader support

---

## Core Components

### 1. Base Model 1 (`src/base-model-1/BaseModel1.jsx`)

**Purpose**: Main application container providing integrated voting and communication platform

**Key Features:**
- Mode-aware layout management
- Blockchain voting integration
- Real-time WebSocket connections
- 3D visualization canvas

**Technical Details:**
```jsx
const BaseModel1 = () => {
  return (
    <ModeProvider>
      <div className="base-model-1-container">
        <WorkspaceLayout />
      </div>
    </ModeProvider>
  );
};
```

### 2. Workspace Layout (`src/base-model-1/WorkspaceLayout.jsx`)

**Purpose**: Dynamic panel management system with drag-and-drop docking

**Key Features:**
- Six-mode panel configuration
- Persistent layout storage
- Real-time panel synchronization
- 3D workspace integration

**Mode Configurations:**
```jsx
const MODE_CONFIGS = {
  focus: {
    primaryPanels: ['voting', 'chat'],
    secondaryPanels: ['proximity', 'channels'],
    layout: 'focused'
  },
  social: {
    primaryPanels: ['chat', 'channels', 'network'],
    secondaryPanels: ['voting', 'proximity'],
    layout: 'social'
  },
  // ... other modes
};
```

### 3. Globe Core (`src/base-model-1/core/GlobeCore.jsx`)

**Purpose**: 3D visualization of democratic spaces with interactive voting

**Key Features:**
- WebGL-powered 3D globe
- Interactive channel towers
- Candidate voting cubes
- Real-time vote visualization

**Integration Points:**
```jsx
// Blockchain voting integration
const handleVote = async (candidateId, vote) => {
  const signature = await generateVoteSignature(candidateId, vote);
  const result = await submitBlockchainVote({
    candidateId,
    vote,
    signature,
    userId: user.id
  });
  updateVoteVisualization(result);
};
```

---

## Mode System

### Mode Architecture

The frontend operates in six distinct modes, each optimizing the interface for specific democratic activities:

### 1. **Focus Mode**
- **Purpose**: Concentrated voting and decision-making
- **Primary Panels**: Voting interface, candidate details
- **Layout**: Minimal distractions, large voting area
- **Use Case**: Important elections, critical decisions

### 2. **Social Mode**
- **Purpose**: Community communication and networking
- **Primary Panels**: Chat, channel browser, user network
- **Layout**: Communication-focused with social features
- **Use Case**: Daily community interaction

### 3. **Governance Mode**
- **Purpose**: Policy discussion and proposal management
- **Primary Panels**: Proposal viewer, governance chat, voting history
- **Layout**: Document-heavy with discussion tools
- **Use Case**: Policy development, governance participation

### 4. **Proximity Mode**
- **Purpose**: Location-based community engagement
- **Primary Panels**: Map view, nearby channels, location voting
- **Layout**: Map-centric with geographic tools
- **Use Case**: Local community decisions, location-based voting

### 5. **Discovery Mode**
- **Purpose**: Exploring new channels and communities
- **Primary Panels**: Channel browser, recommendation engine, trending topics
- **Layout**: Exploration-focused with discovery tools
- **Use Case**: Finding new communities, exploring topics

### 6. **Analysis Mode**
- **Purpose**: Data visualization and voting analytics
- **Primary Panels**: Vote analytics, trend visualization, statistical reports
- **Layout**: Data-heavy with visualization tools
- **Use Case**: Understanding voting patterns, analyzing community trends

### Mode Implementation

```jsx
// Mode switching with persistent state
const { currentMode, switchMode } = useMode();

const handleModeSwitch = (newMode) => {
  saveCurrentPanelState();
  switchMode(newMode);
  loadModeConfiguration(newMode);
  updatePanelLayout(MODE_CONFIGS[newMode]);
};
```

---

## State Management

### 1. Workspace State (`src/base-model-1/useWorkspaceState.js`)

**Purpose**: Manages panel positions, dock states, and layout persistence

**Key Features:**
```jsx
const {
  panels,           // Active panel configurations
  dockStates,       // Panel docking positions
  layout,           // Current layout mode
  activePanel,      // Currently focused panel
  saveCurrentState, // Persist to localStorage
  loadSavedState,   // Restore from storage
  resetToDefault    // Reset to mode defaults
} = useWorkspaceState();
```

### 2. Relay Store (`src/base-model-1/store/relayStore.js`)

**Purpose**: Central state management for voting, channels, and user data

**Key Features:**
```jsx
const store = {
  user: {
    id: 'user_123',
    votes: Map(),
    preferences: {},
    channels: []
  },
  voting: {
    activeVotes: Map(),
    results: Map(),
    blockchain: {
      transactions: [],
      verified: Set()
    }
  },
  channels: {
    active: [],
    nearby: [],
    subscribed: []
  }
};
```

### 3. Mode Context (`src/base-model-1/ModeContext.jsx`)

**Purpose**: Mode switching and configuration management

**Implementation:**
```jsx
const ModeProvider = ({ children }) => {
  const [currentMode, setCurrentMode] = useState('focus');
  const [modeHistory, setModeHistory] = useState(['focus']);
  
  const switchMode = (newMode) => {
    if (MODES[newMode]) {
      setModeHistory(prev => [...prev, newMode]);
      setCurrentMode(newMode);
      localStorage.setItem('relay_current_mode', newMode);
    }
  };
  
  return (
    <ModeContext.Provider value={{
      currentMode,
      switchMode,
      getCurrentModeConfig: () => MODE_CONFIGS[currentMode],
      modeHistory
    }}>
      {children}
    </ModeContext.Provider>
  );
};
```

---

## Component Hierarchy

### Panel System Architecture

```
WorkspaceLayout
├── ModeDropdown              # Mode switching interface
├── DragDropContainer         # Panel drag-and-drop management
│   ├── Panel3DObject         # 3D-rendered panel containers
│   └── Panel Components      # Mode-specific panels
│       ├── VotingPanel
│       ├── ChannelChatPanel
│       ├── ProximityPanel
│       ├── NetworkPanel
│       ├── MapPanel
│       └── AnalysisPanel
├── Canvas (React Three Fiber) # 3D workspace
│   ├── GlobeCore            # Main 3D globe
│   ├── OrbitControls        # Camera controls
│   └── 3D Panel Objects     # Floating 3D panels
└── UI Components
    ├── VoteButton           # Blockchain voting interface
    ├── ChannelDisplay       # Channel information
    ├── ZoomControls         # 3D navigation
    └── LoadingSpinner       # Loading states
```

### Component Communication

```jsx
// Event-driven communication between panels
const { eventBus } = useEventBus();

// Panel A broadcasts vote update
eventBus.emit('vote:updated', {
  candidateId: 'candidate_123',
  newVoteCount: 156,
  blockchainTxId: '0xabc...'
});

// Panel B listens for vote updates
useEffect(() => {
  const handleVoteUpdate = (data) => {
    updateVoteVisualization(data);
  };
  
  eventBus.on('vote:updated', handleVoteUpdate);
  return () => eventBus.off('vote:updated', handleVoteUpdate);
}, []);
```

---

## Integration Points

### 1. Blockchain Voting Backend

**Endpoint**: `/api/vote/submit`
**Integration**: `src/base-model-1/ui/VoteButton.jsx`

```jsx
const submitVote = async (candidateId, voteType) => {
  // Generate cryptographic signature
  const signature = await generateVoteSignature({
    candidateId,
    voteType,
    userId: user.id,
    timestamp: Date.now()
  });
  
  // Submit to blockchain
  const response = await fetch('/api/vote/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      candidateId,
      vote: voteType,
      signature,
      sybilToken: await generateSybilToken()
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Update UI with blockchain transaction ID
    updateVoteStatus({
      status: 'confirmed',
      txId: result.blockchainTxId,
      blockNumber: result.blockNumber
    });
  }
};
```

### 2. Real-Time Communication

**WebSocket**: `wss://localhost:3002/ws`
**Integration**: Real-time vote updates, chat messages, channel changes

```jsx
const useWebSocket = () => {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3002/ws');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'vote:update':
          updateVoteDisplay(data.payload);
          break;
        case 'channel:message':
          addChannelMessage(data.payload);
          break;
        case 'blockchain:confirmation':
          confirmVoteOnBlockchain(data.payload);
          break;
      }
    };
    
    return () => ws.close();
  }, []);
};
```

### 3. Semantic Dictionary Integration

**Component**: Text rendering with semantic links
**Implementation**: Automatic word linking in chat and content

```jsx
const SemanticText = ({ children }) => {
  const { preferences } = useSemanticPreferences();
  const [linkedText, setLinkedText] = useState('');
  
  useEffect(() => {
    // Parse text for semantic entities
    const parseText = async () => {
      const response = await fetch('/api/dictionary/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: children,
          options: { density: preferences.linkDensity }
        })
      });
      
      const result = await response.json();
      setLinkedText(renderSemanticLinks(result.entities));
    };
    
    parseText();
  }, [children, preferences]);
  
  return <div dangerouslySetInnerHTML={{ __html: linkedText }} />;
};
```

---

## Performance Considerations

### 1. 3D Rendering Optimization

```jsx
// Optimized 3D rendering with React Three Fiber
const GlobeCore = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      gl={{ 
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.25;
      }}
    >
      <Suspense fallback={<LoadingSpinner />}>
        <Globe />
        <VotingTowers />
        <CandidateCubes />
      </Suspense>
    </Canvas>
  );
};
```

### 2. State Management Optimization

```jsx
// Optimized state updates with batching
const useBatchedUpdates = () => {
  const [updates, setUpdates] = useState([]);
  
  const batchUpdate = useCallback((update) => {
    setUpdates(prev => [...prev, update]);
  }, []);
  
  useEffect(() => {
    if (updates.length > 0) {
      requestAnimationFrame(() => {
        // Process batched updates
        processBatchedUpdates(updates);
        setUpdates([]);
      });
    }
  }, [updates]);
  
  return { batchUpdate };
};
```

### 3. Component Lazy Loading

```jsx
// Lazy load heavy components
const AnalysisPanel = lazy(() => import('./panels/AnalysisPanel'));
const NetworkVisualization = lazy(() => import('./NetworkTopologyVisualization'));

const WorkspaceLayout = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {currentMode === 'analysis' && <AnalysisPanel />}
      {currentMode === 'social' && <NetworkVisualization />}
    </Suspense>
  );
};
```

---

## Testing Strategy

### 1. Component Testing

**Framework**: Vitest + React Testing Library
**Location**: `tests/shared/`, `tests/frontend/`

```jsx
// Example component test
describe('VoteButton', () => {
  it('should submit vote to blockchain', async () => {
    const mockVote = { candidateId: 'test-123', vote: 'upvote' };
    
    render(<VoteButton candidate={mockVote.candidateId} />);
    
    const voteButton = screen.getByRole('button', { name: /vote/i });
    fireEvent.click(voteButton);
    
    await waitFor(() => {
      expect(mockSubmitVote).toHaveBeenCalledWith(mockVote);
    });
  });
});
```

### 2. Integration Testing

**Focus**: Mode switching, panel communication, WebSocket integration

```jsx
// Integration test example
describe('Mode Switching Integration', () => {
  it('should update panel layout when switching modes', () => {
    render(<WorkspaceLayout />);
    
    const modeDropdown = screen.getByRole('combobox');
    fireEvent.change(modeDropdown, { target: { value: 'governance' } });
    
    expect(screen.getByTestId('governance-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('social-panel')).not.toBeInTheDocument();
  });
});
```

### 3. Performance Testing

**Tools**: React DevTools Profiler, Lighthouse

```jsx
// Performance test utilities
const measureComponentPerformance = (component) => {
  const startTime = performance.now();
  render(component);
  const endTime = performance.now();
  
  expect(endTime - startTime).toBeLessThan(100); // < 100ms
};
```

---

## Conclusion

The Relay Network frontend provides a sophisticated, mode-driven interface for democratic participation. Base Model 1 establishes a solid foundation for complex voting workflows while maintaining modularity and performance. The architecture supports real-time collaboration, blockchain integration, and scalable component development.

**Key Strengths:**
- **Unified Interface**: All democratic activities accessible through single application
- **Real-Time Integration**: Live updates across all components and modes
- **Modular Design**: Easy to extend with new panels and modes
- **Performance Optimized**: Efficient 3D rendering and state management

**Future Development:**
- Enhanced accessibility features
- Mobile-responsive design
- Advanced analytics dashboards
- Multi-language support

The frontend architecture successfully bridges complex blockchain voting systems with intuitive user interfaces, making democratic participation accessible and engaging for all users.
