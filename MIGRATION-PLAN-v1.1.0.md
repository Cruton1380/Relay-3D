# Relay v1.1.0 Migration Plan - Globe World Integration

**Date:** 2026-01-28  
**Status:** IMPLEMENTATION PLAN  
**Target:** Integrate v1.1.0 spec (SCV agents, filaments, time cubes, forensic inspection, HUD) into existing 3D globe world

---

## EXECUTIVE SUMMARY

**Current State:** Repository contains multiple globe implementations, scattered filament/agent concepts, and legacy backend with channel/voting focus that violates Relay physics (ambient authority, invisible work, mutations).

**Target State:** Single canonical 3D Earth globe world with v1.1.0 features (SCV agents, filaments as work sites, time cubes, forensic inspection, StarCraft-style HUD) operating against deterministic commit/filament API.

**Migration Strategy:** Surgical replacement of backend, consolidation of frontend globe systems, implementation of missing v1.1.0 components.

---

## PHASE 0: REPOSITORY AUDIT (COMPLETED)

### Existing Globe Systems Identified

1. **`GlobeCore.jsx`** (Cesium-based, channel/voting system)
   - Location: `src/frontend/components/workspace/core/`
   - Features: Channel cubes, voting UI, clustering
   - Status: ❌ REPLACE (violates Relay physics)

2. **`Globe.jsx`** (Three.js-based, voting visualization)
   - Location: `src/frontend/components/visualizations/`
   - Features: Activity visualization, WebSocket updates
   - Status: ⚠️ KEEP ARCHITECTURE, REPLACE LOGIC

3. **`GlobeInitializer.js`** + **`GlobeControls.js`**
   - Location: `src/frontend/components/main/globe/managers/`
   - Features: Globe setup, camera controls
   - Status: ✅ KEEP (good camera/control foundation)

### Existing Filament/Agent Concepts

1. **`FilamentDemoPage.jsx`** + **`FilamentDemoScene.jsx`**
   - Status: ⚠️ MERGE INTO CANONICAL GLOBE WORLD

2. **`AgentConcurrencyProof.jsx`**
   - Status: ⚠️ CONCEPTUAL PROTOTYPE, REPLACE WITH SCV IMPLEMENTATION

3. **`RelaySystemDemo.jsx`**
   - Status: ⚠️ GOOD COORDINATION PHYSICS, INTEGRATE INTO GLOBE

### Backend Assessment

**Current Backend:**
- Channel-focused (`channel-service/`)
- Voting-centric APIs
- Direct state mutation (no commit log)
- Implicit authority
- No filament abstraction

**Verdict:** ❌ **REPLACE WITH RELAY PHYSICS API**

---

## PHASE 1: BACKEND REPLACEMENT (PRIORITY 1)

### 1.1 New Backend Architecture

**Replace:** `src/backend/` (legacy channel service)  
**With:** `src/backend/relay-physics/` (new commit-log API)

```
src/backend/relay-physics/
├── api/
│   ├── filaments.mjs          # GET /filaments, GET /filaments/:id
│   ├── commits.mjs             # POST /commits, GET /commits/:ref
│   ├── units.mjs               # GET /units, POST /units/:id/intent
│   ├── authority.mjs           # POST /authority/validate
│   └── verification.mjs        # GET /verification/status
├── stores/
│   ├── filamentStore.mjs       # Append-only filament + commit storage
│   ├── unitStore.mjs           # SCV agent state (replay-derivable)
│   └── authorityStore.mjs      # Authority graph + delegation chains
├── services/
│   ├── commitProcessor.mjs     # Process incoming commits
│   ├── stateProjector.mjs      # Derive current state from commits
│   └── authorityEngine.mjs     # Validate authorityRef
└── server.mjs                  # New physics-compliant server
```

### 1.2 Relay Physics API Contract (LOCKED)

#### **Filaments API**

```javascript
// GET /api/filaments?scope={scope}&type={type}
Response: {
  filaments: [
    {
      id: "work.W123",
      type: "work",
      scope: "backend/*",
      headRef: "work.W123@c12",
      created: "2026-01-27T10:00:00Z",
      lastAuthor: "unit.alice.001"
    }
  ]
}

// GET /api/filaments/:id/commits?from={index}&to={index}
Response: {
  filamentId: "work.W123",
  commits: [
    {
      ref: "work.W123@c12",
      commitIndex: 12,
      type: "TASK_COMPLETE",
      timestamp: "2026-01-27T11:30:00Z",
      authorUnitRef: "unit.alice.001",
      payload: { ... },
      causalRefs: {
        inputs: ["work.W122@c8"],
        evidence: ["evidence.E45"],
        authorityRef: "auth.manager.bob@d3"
      }
    }
  ]
}

// WebSocket: ws://localhost:3003/ws/filaments/:id
Message: {
  type: "COMMIT_APPENDED",
  filamentId: "work.W123",
  commit: { ... }
}
```

#### **Commits API**

```javascript
// POST /api/commits
Request: {
  filamentId: "work.W123",
  type: "TASK_ASSIGN",
  authorUnitRef: "unit.manager.bob",
  payload: {
    targetUnit: "unit.alice.001",
    taskDescription: "Implement auth module"
  },
  causalRefs: {
    authorityRef: "auth.manager.bob@d3"
  }
}

// POST /api/commits (SCV Cancellation)
Request: {
  filamentId: "conversation.alice.001",
  type: "SCV_CHANNEL_CANCEL",
  authorUnitRef: "unit.manager.bob",
  payload: {
    cancelReason: "user-initiated" | "authority-revoked" | "timeout" | "conflict-kill"
  },
  causalRefs: {
    inputs: ["work.W123"],
    authorityRef: "auth.scv.cancel"
  },
  tLevel: "T1"
}

Response: {
  commitRef: "work.W123@c13",
  accepted: true
}

// GET /api/commits/:ref
Response: {
  ref: "work.W123@c12",
  commitIndex: 12,
  type: "TASK_COMPLETE",
  timestamp: "2026-01-27T11:30:00Z",
  authorUnitRef: "unit.alice.001",
  payload: { ... },
  causalRefs: { ... }
}
```

#### **Units (SCV Agents) API**

```javascript
// GET /api/units
Response: {
  units: [
    {
      id: "unit.alice.001",
      type: "Employee",
      displayName: "Alice",
      state: "Working",  // Idle | Moving | Working | Blocked | Awaiting Authority
      position: { lat: 43.65, lng: -79.38, alt: 50 },  // Globe coordinates
      attachedFilament: "work.W123",
      currentTask: "Implement auth module",
      scope: "backend/*",
      capabilities: ["code.write", "code.review"],
      lastCommitRef: "work.W123@c12",
      lastCommitTime: "2026-01-27T11:30:00Z"
    }
  ]
}

// POST /api/units/:id/intent
Request: {
  intent: "MOVE_TO" | "ATTACH" | "DETACH",
  target: "work.W125"  // For ATTACH
}

Response: {
  commitRef: "unit.alice.001@action.5",
  accepted: true,
  nextState: "Moving"  // Predicted state after commit processed
}

// WebSocket: ws://localhost:3003/ws/units
Message: {
  type: "UNIT_STATE_CHANGED",
  unitId: "unit.alice.001",
  oldState: "Moving",
  newState: "Working",
  attachedFilament: "work.W123"
}
```

#### **Authority API**

```javascript
// POST /api/authority/validate
Request: {
  action: "TASK_ASSIGN",
  unitRef: "unit.manager.bob",
  targetRef: "work.W123",
  requiredCapability: "task.assign"
}

Response: {
  valid: false,
  reason: "Missing capability: task.assign",
  delegationChain: [
    "auth.admin.root@d1",
    "auth.manager.alice@d2"
  ],
  contactForDelegation: "@manager-alice"
}
```

#### **Verification API**

```javascript
// GET /api/verification/status
Response: {
  verify_entry: { status: "PASS", message: "All entry invariants valid" },
  verify_prompt: { status: "PASS", message: "All prompts valid" },
  verify_authority: { status: "PASS", message: "All authority chains valid" },
  verify_merge: { status: "FAIL", message: "Merge M12 missing scar", ref: "merge.M12" }
}
```

### 1.3 Backend Implementation Timeline

**Week 1-2:**
- [ ] Implement `filamentStore.mjs` (append-only commit log)
- [ ] Implement `stateProjector.mjs` (derive unit states from commits)
- [ ] Implement filaments API + WebSocket subscriptions

**Week 3:**
- [ ] Implement commits API
- [ ] Implement units API + state derivation

**Week 4:**
- [ ] Implement authority API + delegation chains
- [ ] Implement verification API
- [ ] Integration tests

---

## PHASE 2: FRONTEND CONSOLIDATION (PRIORITY 2)

### 2.1 Canonical Globe World

**Decision:** Use `Globe.jsx` (Three.js) as base, integrate GlobeCore architecture patterns.

**New Component Structure:**

```
src/frontend/components/globe-world/
├── GlobeWorld.jsx                     # Main container (replaces multiple globe implementations)
├── core/
│   ├── EarthGlobe.jsx                 # Physical 3D sphere at origin
│   ├── LODController.js               # Shared LOD scalar (0.0-1.0)
│   └── CameraController.jsx           # Three-mode camera (Command/Work/Global)
├── entities/
│   ├── SCVUnits.jsx                   # SCV agent renderer (state-driven)
│   ├── Filaments.jsx                  # Filament ridge renderer (LOD-aware)
│   ├── TimeCubes.jsx                  # Commit event markers (clickable)
│   └── Queues.jsx                     # Queue/conflict/resource objects
├── hud/
│   ├── BottomHUD.jsx                  # StarCraft-style HUD container
│   ├── SelectionPanel.jsx             # Left panel
│   ├── CommandCard.jsx                # Center panel (action buttons)
│   ├── SystemPanel.jsx                # Right panel (minimap + alerts)
│   └── Minimap.jsx                    # Interactive 2D projection
├── modes/
│   ├── CommandMode.jsx                # RTS controls + edge-scroll
│   ├── WorkMode.jsx                   # FPS collision-aware
│   └── GlobalMode.jsx                 # Flyaround travel
├── forensic/
│   ├── ForensicInspectionMode.jsx     # Isolated chamber
│   ├── TimeCube.jsx                   # 6-face cube renderer
│   ├── UnfoldAnimation.jsx            # Cube → 2D net
│   └── FacePanels.jsx                 # 6 semantic face panels
└── hooks/
    ├── useFilamentData.js             # WebSocket + REST for filaments
    ├── useUnitData.js                 # WebSocket + REST for units
    └── useLOD.js                      # LOD state management
```

### 2.2 Migration Actions

**REMOVE:**
- ❌ `src/frontend/components/workspace/core/GlobeCore.jsx` (legacy channel system)
- ❌ `src/frontend/components/visualizations/Globe.jsx` (merge into GlobeWorld)
- ❌ `src/frontend/pages/FilamentDemoPage.jsx` (merge into GlobeWorld)
- ❌ `src/frontend/components/filament/scenes/FilamentDemoScene.jsx` (merge into GlobeWorld)

**KEEP + REFACTOR:**
- ✅ `GlobeInitializer.js` → Integrate into `GlobeWorld` setup
- ✅ `GlobeControls.js` → Integrate into `CameraController`
- ✅ `RelaySystemDemo.jsx` schemas → Move to `src/backend/relay-physics/schemas/`

**CREATE NEW:**
- All v1.1.0 components listed in 2.1

### 2.3 Frontend Implementation Timeline

**Week 5-6:**
- [ ] Create `GlobeWorld.jsx` base container
- [ ] Implement `EarthGlobe.jsx` (Three.js sphere at origin)
- [ ] Implement `LODController.js` (shared scalar)
- [ ] Implement `CameraController.jsx` (Command/Work/Global modes)

**Week 7:**
- [ ] Implement `SCVUnits.jsx` (fetch from `/api/units`, render as 3D models)
- [ ] Implement `SCVCancellationEffect.jsx` (4-phase terminal event with commit-shards)
- [ ] Implement `Filaments.jsx` (fetch from `/api/filaments`, render as ridges)
- [ ] Implement `TimeCubes.jsx` (commit events as clickable cubes)

**Week 8:**
- [ ] Implement `BottomHUD.jsx` container
- [ ] Implement `SelectionPanel.jsx` (unit/filament details)
- [ ] Implement `CommandCard.jsx` (legitimacy-gated action buttons)
- [ ] Implement `SystemPanel.jsx` + `Minimap.jsx`

**Week 9-10:**
- [ ] Implement `ForensicInspectionMode.jsx`
- [ ] Implement `TimeCube.jsx` (6-face cube with locked semantic mapping)
- [ ] Implement `UnfoldAnimation.jsx` (cube → cross-shaped net)
- [ ] Implement `FacePanels.jsx` (Front/Back/Left/Right/Top/Bottom)

---

## PHASE 3: INTEGRATION & TESTING (PRIORITY 3)

### 3.1 Integration Points

**Backend ↔ Frontend:**
- WebSocket connections for real-time filament + unit updates
- REST API for initial data load + commit submissions
- Authority validation before button display (Command Card)

**Globe World ↔ HUD:**
- Selection state shared between 3D world and HUD panels
- Command Card actions trigger commit POST → backend → WebSocket update → world refresh

**Forensic Inspection ↔ Globe World:**
- Double-click commit event → camera transition (300-400ms) → isolated chamber
- ESC → refold + return to world with context preserved

### 3.2 Acceptance Criteria (from v1.1.0 spec)

All 19 acceptance tests from Section 14 must pass:
- [ ] Test 1: Action Buttons Only in HUD
- [ ] Test 2: Minimap Camera Control
- [ ] Test 3: Edge-Scroll Activation
- [ ] Test 4: Work Mode (FPS)
- [ ] Test 4b: Global Mode (Flyaround)
- [ ] Test 5: Shared LOD
- [ ] Test 6: Unit Selection
- [ ] Test 7: Filament Selection
- [ ] Test 8: Multi-Select Constraints
- [ ] Test 9: Legitimacy Enforcement
- [ ] Test 10: Center on Selection
- [ ] Test 11: Minimap Viewport Box
- [ ] Test 12: Lens Switching
- [ ] Test 13: Mode Switching
- [ ] Test 14: Action Preview
- [ ] Test 15: Inspector Panels
- [ ] Test 16: ESC Stack-Pop Model
- [ ] Test 17: Control Groups
- [ ] Test 18: Forensic Inspection Mode
- [ ] Test 19: SCV Cancellation (Terminal Event)

### 3.3 Testing Timeline

**Week 11:**
- [ ] E2E tests for all 18 acceptance criteria (Playwright)
- [ ] Unit tests for LOD controller, authority validation
- [ ] Visual regression tests for HUD layout

---

## PHASE 4: LEGACY CLEANUP (PRIORITY 4)

### 4.1 Quarantine Legacy Code

**Move to:** `archive/legacy-channel-system-pre-v1.1.0/`

- All `channel-service/` backend code
- `GlobeCore.jsx` (Cesium channel cubes)
- Voting-related components that don't fit Relay physics

**Reasoning:** Preserve for reference, but remove from active codebase to prevent confusion.

### 4.2 Update Documentation

- [ ] Update `README.md` with new architecture
- [ ] Update `FRONTEND-ENTRY-CHAIN.md` with GlobeWorld as canonical
- [ ] Create `RELAY-PHYSICS-API.md` (backend contract documentation)
- [ ] Archive old docs in `archive/legacy-docs/`

---

## IMPLEMENTATION RISKS & MITIGATION

### Risk 1: Backend Replacement Breaks Existing Features
**Mitigation:** Run legacy backend on port 3003, new physics backend on port 3004 during transition. Switch frontend to 3004 once validated.

### Risk 2: Globe World Performance with 1000+ Units
**Mitigation:** Implement instanced rendering for units, frustum culling for filaments, LOD transitions per spec.

### Risk 3: Forensic Inspection Mode Camera Transition Complexity
**Mitigation:** Prototype camera transition in isolation first, ensure context preservation, test ESC stack-pop.

### Risk 4: Authority Validation Latency
**Mitigation:** Cache legitimacy results per selection, precompute common patterns, use Web Worker if needed.

---

## CRITICAL PATH

**Weeks 1-4:** Backend Replacement (BLOCKER for frontend)  
**Weeks 5-8:** Frontend Core (Globe World + HUD)  
**Weeks 9-10:** Forensic Inspection Mode  
**Week 11:** Testing + Validation

**Total:** 11 weeks (aligns with spec estimate of 9-11 weeks for Phase 1-6)

---

## SUCCESS CRITERIA

✅ Single canonical 3D Earth globe world  
✅ SCV agents visible, movable, state-driven  
✅ Filaments as work sites with commit events  
✅ Time cubes with 6-face semantic mapping  
✅ Forensic Inspection Mode operational  
✅ StarCraft-style HUD with Command/Work/Global modes  
✅ All 18 acceptance tests passing  
✅ Backend serves deterministic commit/filament API  
✅ No ambient authority, no invisible work, no mutations  
✅ Legacy code archived, not deleted

---

**NEXT IMMEDIATE ACTION:**

Begin Phase 1 backend implementation. Create `src/backend/relay-physics/` directory structure and start with `filamentStore.mjs` (append-only commit log).

**Lock Date:** 2026-01-28  
**Approver:** Relay Core Team  
**Next Review:** After Week 4 (backend completion)
