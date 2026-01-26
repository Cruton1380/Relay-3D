# SYSTEM CLEANUP: Visual Architecture Change

---

## BEFORE: Complex Multi-Layer Truth Storage

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
│                     (Globe + React UI)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
            ┌────────▼────────┐
            │   API Routes    │
            └────────┬────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼─────┐  ┌─────▼──────┐  ┌────▼─────┐
│ Vote     │  │ Channel    │  │ Ranking  │
│ Service  │  │ Service    │  │ Service  │
└────┬─────┘  └─────┬──────┘  └────┬─────┘
     │              │               │
     │         ┌────▼─────┐         │
     │         │ Database │         │
     │         └────┬─────┘         │
     │              │               │
┌────▼──────────────▼───────────────▼────┐
│          BLOCKCHAIN SERVICE             │
│   (Immutable storage + ordering)        │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │    HASHGRAPH    │
        │  (Consensus +   │
        │   gossip)       │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │   WebSocket     │
        │  (Real-time     │
        │   sync)         │
        └─────────────────┘

PROBLEMS:
❌ 4+ layers of truth storage
❌ Complex sync between blockchain/hashgraph/DB
❌ WebSocket connection management
❌ State consistency issues
❌ Single points of failure
```

---

## AFTER: Git-Native Truth Substrate

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
│              (3D Filaments + 2D Sheet Mode)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
            ┌────────▼────────┐
            │  Relay Client   │
            │   (Git HTTP)    │
            └────────┬────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼─────┐  ┌─────▼──────┐  ┌────▼─────┐
│ Git PUT  │  │ Git QUERY  │  │ Git GET  │
│ (commit) │  │ (hook)     │  │ (read)   │
└────┬─────┘  └─────┬──────┘  └────┬─────┘
     │              │               │
     └──────────────▼───────────────┘
                    │
        ┌───────────▼───────────┐
        │   GIT REPOSITORY      │
        │ (Universal substrate) │
        │                       │
        │  /votes/user123.yaml  │
        │  /candidates/...      │
        │  /state/rankings.yaml │
        │                       │
        │  .relay/              │
        │    ├── pre-commit.mjs │
        │    ├── query.mjs      │
        │    └── get.mjs        │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │   Relay Peer Network  │
        │ (Distributed mirrors) │
        └───────────────────────┘

BENEFITS:
✅ Single source of truth (Git)
✅ Proven reliability
✅ Branch/merge for proposals
✅ Immutable audit trail
✅ Offline-first capability
✅ No custom consensus needed
```

---

## SERVICES: BEFORE vs AFTER

### **DELETED (Redundant with Git)**

```
❌ blockchain-service/     → Git commits
❌ hashgraph/              → Git ordering
❌ vote-service/           → Git PUT + hooks
❌ ranking-service/        → Query hooks
❌ state/                  → Git is state
❌ websocket-service/      → SSE polling
```

---

### **KEPT (Application Logic)**

```
✅ auth/                   → User authentication
✅ biometrics/             → Sybil resistance
✅ location/               → Proximity checks
✅ governance/             → Sortition rules
✅ invites/                → Invite system
✅ onboarding/             → User registration
✅ privacy-services/       → Privacy mixing
✅ p2p-service/            → Peer discovery
✅ security/               → Request validation
```

---

### **REFACTORED (Integration Layer)**

```
⚠️ voting/votingEngine     → Calls Git PUT instead of blockchain
⚠️ channel-service/        → Uses Git repos instead of DB
⚠️ routes/vote             → HTTP → Relay client
⚠️ routes/channels         → HTTP → Relay client
⚠️ frontend/apiClient      → Relay HTTP client
```

---

## CODE REDUCTION ESTIMATE

```
┌─────────────────────────────────────────┐
│         BACKEND SERVICES                │
├─────────────────────────────────────────┤
│ BEFORE:                                 │
│   blockchain-service/    ~8,000 LOC     │
│   hashgraph/            ~12,000 LOC     │
│   vote-service/          ~1,500 LOC     │
│   ranking-service/         ~800 LOC     │
│   state/                 ~2,000 LOC     │
│   websocket-service/     ~3,000 LOC     │
│   ─────────────────────────────────     │
│   TOTAL:                ~27,300 LOC     │
├─────────────────────────────────────────┤
│ AFTER:                                  │
│   relay-client/          ~2,000 LOC     │
│   .relay/ hooks          ~1,000 LOC     │
│   ─────────────────────────────────     │
│   TOTAL:                 ~3,000 LOC     │
├─────────────────────────────────────────┤
│ NET REDUCTION:          ~24,300 LOC     │
│ PERCENTAGE:                     89%     │
└─────────────────────────────────────────┘
```

---

## VOTE FLOW COMPARISON

### **BEFORE (8 Steps)**

```
1. User clicks "Vote"
   ↓
2. Frontend → HTTP POST /api/votes
   ↓
3. Vote Service validates
   ↓
4. Vote Service → Database INSERT
   ↓
5. Vote Service → Blockchain addBlock()
   ↓
6. Blockchain → Hashgraph gossip
   ↓
7. Hashgraph → Consensus reached
   ↓
8. WebSocket broadcasts update
   ↓
9. All clients receive state update
```

**Latency**: 500-2000ms
**Failure Points**: 8 components

---

### **AFTER (4 Steps)**

```
1. User clicks "Vote"
   ↓
2. Frontend → HTTP PUT /relay/votes/user123.yaml
   ↓
3. Relay peer → Git commit
   ↓
4. SSE event stream → Clients poll query hook
   ↓
5. Clients receive ranking update
```

**Latency**: 100-500ms
**Failure Points**: 2 components (Relay peer + Git)

---

## FILAMENT UI: NEW CAPABILITIES

```
┌──────────────────────────────────────────────────┐
│              3D FILAMENT SPACE                   │
│  (Navigation, Audit, Branch Comparison)          │
│                                                  │
│   T1  T2  T3 ─────────────► T14  T15  T16       │
│   ◻️  ◻️  ◻️   (Time Boxes)   ◻️   ◻️   ◻️        │
│                                                  │
│  Click box → Extract → Rotate → Inspect 6 faces │
│                                                  │
│  +X: Current value ($1,250)                      │
│  -X: Dependencies (4 upstream votes)             │
│  +Y: Semantic meaning (SUM operation)            │
│  -Y: Confidence (75%)                            │
│  +Z: Identity (commit hash, branch)              │
│  -Z: Root evidence (boundary definition)         │
└──────────────────────────────────────────────────┘
                      │
                      │ SNAP TO (proximity/intent)
                      ▼
┌──────────────────────────────────────────────────┐
│              2D SHEET MODE                       │
│  (Work Surface, Editing, Formulas)               │
│                                                  │
│  ┌─────────┬────────┬──────┬─────────┬────────┐ │
│  │ Cand    │ Votes  │ Rank │ Status  │ Notes  │ │
│  ├─────────┼────────┼──────┼─────────┼────────┤ │
│  │ Bean Th │ 1,250  │  1   │ Active  │        │ │
│  │ The Gri │   890  │  2   │ Active  │        │ │
│  │ Joe's   │   620  │  3   │ Pending │ Review │ │
│  └─────────┴────────┴──────┴─────────┴────────┘ │
│                                                  │
│  Edit cell → Git commit → New time box           │
└──────────────────────────────────────────────────┘
```

---

## DOMAIN UNIVERSALITY

```
┌─────────────────────────────────────────────────┐
│     ONE SYSTEM FOR ALL EVOLVING DOMAINS         │
├─────────────────────────────────────────────────┤
│                                                 │
│  VOTING DOMAIN:                                 │
│    Filament = Candidate over time               │
│    Time Box = Vote state at step T              │
│    Sheet = Candidate rankings (editable)        │
│                                                 │
│  AI PROMPT DOMAIN:                              │
│    Filament = Prompt evolution over time        │
│    Time Box = Prompt version at step T          │
│    Sheet = Prompt params (temp, tokens, text)   │
│                                                 │
│  STORYBOARD DOMAIN:                             │
│    Filament = Video frame over time             │
│    Time Box = Frame version at step T           │
│    Sheet = Frame timeline (duration, assets)    │
│                                                 │
│  ACCOUNTING DOMAIN:                             │
│    Filament = Ledger line over time             │
│    Time Box = Transaction at step T             │
│    Sheet = General Ledger (debits, credits)     │
│                                                 │
│  LEGAL DOMAIN:                                  │
│    Filament = Contract clause over time         │
│    Time Box = Revision at step T                │
│    Sheet = Contract sections (editable)         │
│                                                 │
└─────────────────────────────────────────────────┘

The same 3D↔2D UI serves ALL domains via Domain Registry configs.
```

---

## MIGRATION PATH

```
PHASE 1: Cleanup (This Task)
├─ Delete blockchain/hashgraph/websocket
├─ Archive obsolete documentation
└─ Identify refactoring targets

PHASE 2: Create Relay Integration
├─ Build relay-client wrapper
├─ Create .relay/ hooks (pre-commit, query, get)
└─ Stub integration points

PHASE 3: Data Migration
├─ Export votes → Git commits
├─ Export channels → Git repos
└─ Verify data integrity

PHASE 4: Frontend Adaptation
├─ Replace apiClient with relayClient
├─ Add 3D Time Box components
├─ Add 2D Sheet Mode
└─ Integrate Filament navigation

PHASE 5: Domain Expansion
├─ Prove Voting domain works
├─ Add Prompt domain
├─ Add Storyboard domain
└─ Generalize via Domain Registry
```

---

## SUMMARY: WHAT CHANGES

| Layer | Before | After |
|-------|--------|-------|
| **Truth Storage** | Blockchain + Hashgraph + DB | Git only |
| **Consensus** | Custom hashgraph gossip | Git merge semantics |
| **Real-time** | WebSocket state push | SSE + Git polling |
| **Audit** | Blockchain inspector | Git history + 3D filaments |
| **Branches** | N/A (single truth) | Git branches (proposals) |
| **Immutability** | Blockchain guarantees | Git commit SHA guarantees |
| **Ordering** | Hashgraph timestamps | Git commit order |
| **Conflict Resolution** | Last-write-wins | Explicit merge decisions |
| **UI Paradigm** | Cards on globe | Time Boxes + Sheet Mode |
| **Domains** | Voting only | Universal (all evolving data) |

---

**Result**: Simpler, more reliable, universally applicable system. 🎯

