# Relay v1.1.0 Implementation Status

**Date:** 2026-01-28  
**Spec Version:** v1.1.0 (LOCKED)  
**Migration Plan:** MIGRATION-PLAN-v1.1.0.md  
**Status:** 🟡 Phase 1 (Backend) - IN PROGRESS

---

## WHAT WE HAVE NOW

### ✅ Locked Specifications

1. **`RELAY-3D-WORLD-SPEC.md`** (v1.1.0)
   - Complete UI/UX specification
   - StarCraft-style RTS HUD + 3D coordination physics world
   - Forensic Inspection Mode (isolated 3D examination)
   - SCV Cancellation Terminal Event (forensic destruction with commit-shards)
   - Three camera modes (Command/Work/Global)
   - Time cube 6-face semantic mapping (LOCKED)
   - 19 acceptance tests
   - 6 development phases

2. **`MIGRATION-PLAN-v1.1.0.md`**
   - Repository audit (completed)
   - Backend replacement plan (4 weeks)
   - Frontend consolidation plan (6 weeks)
   - Integration & testing plan (1 week)
   - Critical path: 11 weeks total

### ✅ Implementation Invariants (LOCKED)

From user confirmation directive:

1. **Agents ARE SCVs (literal)**
   - Discrete, visible, movable units in 3D world
   - States: Idle | Moving | Working | Blocked | Awaiting Authority
   - Multi-select + control groups (Ctrl+1..0)

2. **Filaments ARE work sites**
   - Persistent truth surfaces, not consumable resources

3. **Clicking agent opens chat + history**
   - Chat is `conversation.<agentId>` filament
   - No side channels, no ephemeral logs

4. **Task assignment is explicit and visible**
   - Via Command Card only
   - Creates TASK_ASSIGN commit
   - Visible movement + attachment

5. **Forensic Inspection Mode is first-class**
   - Camera/lens transition, not scene change

6. **Time cubes have 6 locked semantic faces**
   - Front=Operation, Back=Inputs, Left=Authority, Right=Evidence, Top=Time, Bottom=Integrity
   - **This mapping is part of Relay's physics and must never change**

7. **Immutability is absolute**
   - Original commits NEVER mutated

8. **ESC stack-pop applies everywhere**
   - Fixed order with Forensic Inspection at priority 2

9. **Terminology lock**
   - "commit events" not "nodes"

10. **Existing 3D Earth globe world is CANONICAL**
    - All v1.1.0 features integrate INTO that world
    - Shared LOD governs globe + filaments + SCVs

### ✅ Phase 1 Backend Started

**Created:**
- `src/backend/relay-physics/` directory structure
- `stores/filamentStore.mjs` - Append-only commit log (✅ COMPLETE)
- `stores/unitStore.mjs` - SCV agent state management (✅ COMPLETE)

**Next to create:**
- `stores/authorityStore.mjs` - Authority graph + delegation chains
- `api/filaments.mjs` - REST + WebSocket for filaments
- `api/commits.mjs` - Commit submission
- `api/units.mjs` - Unit state + intent
- `api/authority.mjs` - Legitimacy validation
- `api/verification.mjs` - Guardrail status
- `services/commitProcessor.mjs` - Process incoming commits
- `services/stateProjector.mjs` - Derive state from commits
- `services/authorityEngine.mjs` - Validate authorityRef
- `server.mjs` - New physics-compliant server (port 3004)

---

## IMMEDIATE NEXT STEPS (PRIORITY ORDER)

### Week 1 Tasks (Current)

**Backend Core:**
- [ ] Complete `authorityStore.mjs`
- [ ] Implement `api/filaments.mjs` (REST endpoints)
- [ ] Implement WebSocket server for filament subscriptions
- [ ] Create mock data seeder (example filaments + units + commits)

**Testing:**
- [ ] Write unit tests for filamentStore
- [ ] Write unit tests for unitStore
- [ ] Create integration test harness

**Documentation:**
- [ ] Create `RELAY-PHYSICS-API.md` (API contract reference)
- [ ] Add JSDoc to all store methods

### Week 2 Tasks

**Backend Core:**
- [ ] Implement `api/commits.mjs`
- [ ] Implement `api/units.mjs`
- [ ] Implement `services/commitProcessor.mjs`
- [ ] Implement `services/stateProjector.mjs`

**Integration:**
- [ ] Connect filament API to WebSocket broadcasts
- [ ] Connect unit state changes to WebSocket broadcasts

### Week 3 Tasks

**Backend Core:**
- [ ] Implement `api/authority.mjs`
- [ ] Implement `services/authorityEngine.mjs`
- [ ] Implement `api/verification.mjs`

**Testing:**
- [ ] E2E tests for full commit flow (create → append → broadcast)
- [ ] E2E tests for unit state transitions
- [ ] Authority validation edge cases

### Week 4 Tasks

**Backend Polish:**
- [ ] Error handling + validation
- [ ] Logging + monitoring hooks
- [ ] Performance optimization (if needed)

**Deployment:**
- [ ] Deploy new backend on port 3004
- [ ] Keep legacy backend on port 3003 (parallel during migration)
- [ ] Create backend switching environment variable

---

## ACCEPTANCE CRITERIA (PHASE 1)

**Backend must:**
- ✅ Serve deterministic commit/filament API
- ✅ Never mutate commits
- ✅ Never perform implicit actions
- ✅ Derive unit states from commits (replay-derivable)
- ✅ Validate authority before accepting commits
- ✅ Broadcast WebSocket updates for filaments + units
- ✅ Pass all integration tests

**NO:**
- ❌ Direct state mutation
- ❌ Ambient authority
- ❌ Invisible work
- ❌ "System decided" logic

---

## FRONTEND READINESS (FUTURE PHASES)

**Phase 2 (Weeks 5-6): Globe World Core**
- Consolidate multiple globe implementations → single `GlobeWorld.jsx`
- Implement shared LOD controller
- Implement three-mode camera controller
- Connect to backend API (port 3004)

**Phase 3 (Weeks 7-8): HUD + Entities**
- Implement StarCraft-style bottom HUD
- Implement SCV unit renderer (fetch from `/api/units`)
- Implement filament ridge renderer
- Implement time cube commit event markers

**Phase 4 (Weeks 9-10): Forensic Inspection Mode**
- Implement isolated inspection chamber
- Implement time cube 6-face renderer
- Implement unfold animation
- Implement face panels

**Phase 5 (Week 11): Integration + Testing**
- Run all 18 acceptance tests
- Fix any failures
- Performance optimization
- Documentation

---

## HOW TO CONTRIBUTE (FOR ENGINEERS)

### 1. Read the specs FIRST
- `RELAY-3D-WORLD-SPEC.md` (v1.1.0) - LOCKED specification
- `MIGRATION-PLAN-v1.1.0.md` - Migration strategy
- This file - Current status

### 2. Understand the invariants
- Read "CONFIRMATION & LOCK-IN DIRECTIVE" section in conversation history
- Agents ARE SCVs (literal, not metaphor)
- Filaments ARE work sites
- Time cube faces are LOCKED physics
- No mutations, no ambient authority, no invisible work

### 3. Follow the backend contract
- Append-only commits
- Explicit authorityRef for actions
- State derivation, not state mutation
- WebSocket broadcasts for updates

### 4. Test against acceptance criteria
- All 18 tests must pass (Section 14 of spec)
- No shortcuts, no workarounds

### 5. Terminology discipline
- Use "commit events" not "nodes"
- Use "SCV agents" not "AI processes"
- Use "work sites" not "resources"

---

## COMMON MISTAKES TO AVOID

**Backend:**
- ❌ Mutating commits in place
- ❌ Allowing commits without authorityRef
- ❌ Deriving state in API layer (belongs in stateProjector)
- ❌ Using "node" terminology

**Frontend:**
- ❌ Treating agents as invisible processes
- ❌ Creating multiple globe implementations
- ❌ Popup windows instead of HUD panels
- ❌ Changing time cube face mapping
- ❌ Scene changes instead of camera transitions (Forensic Inspection)

**General:**
- ❌ Inventing new abstractions not in spec
- ❌ Metaphor drift (SCV → "worker" → "process" → invisible)
- ❌ Shortcuts that violate determinism

---

## VERIFICATION CHECKLIST (BEFORE PHASE 1 COMPLETION)

**Code:**
- [ ] All stores implement append-only semantics
- [ ] All API endpoints follow contract in MIGRATION-PLAN
- [ ] All commits have: ref, commitIndex, type, timestamp, authorUnitRef, payload, causalRefs
- [ ] All unit state changes are logged as action commits
- [ ] Authority validation blocks illegitimate actions
- [ ] WebSocket broadcasts work for filaments + units

**Tests:**
- [ ] Unit tests for filamentStore (pass)
- [ ] Unit tests for unitStore (pass)
- [ ] Unit tests for authorityStore (pass)
- [ ] Integration tests for commit flow (pass)
- [ ] Integration tests for unit state transitions (pass)
- [ ] E2E tests for WebSocket subscriptions (pass)

**Documentation:**
- [ ] API contract documented in RELAY-PHYSICS-API.md
- [ ] JSDoc on all public methods
- [ ] Mock data seeder with example usage
- [ ] README updated with new backend instructions

---

## SUCCESS METRICS

**Phase 1 Complete When:**
- ✅ New backend running on port 3004
- ✅ All stores implement append-only commit log
- ✅ All API endpoints functional
- ✅ WebSocket subscriptions operational
- ✅ All integration tests passing
- ✅ Mock data seeder working
- ✅ API documentation complete

**Future Phases Enabled:**
- Frontend can connect to deterministic API
- SCV agents can be rendered from `/api/units`
- Filaments can be visualized from `/api/filaments`
- Command Card can validate legitimacy via `/api/authority/validate`

---

## RESOURCES

**Specifications:**
- `RELAY-3D-WORLD-SPEC.md` - Complete UI/UX spec v1.1.0
- `MIGRATION-PLAN-v1.1.0.md` - Implementation roadmap
- `FRONTEND-ENTRY-CHAIN.md` - Frontend architecture
- `PROMPT-COORDINATION-INVARIANTS.md` - Prompt system spec

**Implementation:**
- `src/backend/relay-physics/` - New backend (Phase 1)
- `src/backend/relay-physics/stores/filamentStore.mjs` - Commit log (✅ DONE)
- `src/backend/relay-physics/stores/unitStore.mjs` - SCV state (✅ DONE)

**Legacy (DO NOT MODIFY):**
- `src/backend/channel-service/` - Old voting system (to be archived)
- `src/frontend/components/workspace/core/GlobeCore.jsx` - Old globe (to be replaced)

---

**NEXT IMMEDIATE ACTION:**

Complete `authorityStore.mjs` and begin `api/filaments.mjs` implementation.

**Status:** 🟡 Phase 1 Week 1 - Backend Foundation  
**Lock Date:** 2026-01-28  
**Target Completion:** Phase 1 by Week 4 (2026-02-25)
