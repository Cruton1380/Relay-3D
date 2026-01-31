# RELAY ROOT INSTRUCTIONS

**Version**: 1.0.0  
**Date**: 2026-01-31  
**Status**: Production Foundation Complete  
**Purpose**: Complete project brief for AI agents working on Relay

---

## 🎯 WHAT IS RELAY?

Relay is a **continuous verification system** that makes coordination visible, traceable, and recoverable through Git-native truth, 3D spatial representation, and pressure-based governance.

### Canonical Statement (IMMUTABLE)

> "Relay is continuous verification: a non-destructive, consensual audit that helps everyone become a coherence operator, making coordination state visible and recoverable without weaponizing transparency or creating fragility."

### Core Principles (NEVER VIOLATE)

1. **Git is the operating system** — Commits are coordination events
2. **3D cognition required** — Down=history, Surface=present, Outward=speculation
3. **Pressure, not command** — Turgor pressure model (biological, not military)
4. **Ring-based basins** — Laniakea geometry (gravitational attraction, not org charts)
5. **Filaments are recovery paths** — Externalized cognition for thought retrieval
6. **Time boxes contain continuity** — Live presence inside discrete history
7. **Material boundaries only** — Commits occur at thresholds, not every action
8. **Safe language mandatory** — Zero adversarial terms (attack→audit, drift→divergence)
9. **Transparency without weaponization** — CERN principle (visible deterrent, not weapon)
10. **Grounded in science** — Cognitive science, systems theory, NOT mysticism

---

## 🏗️ ARCHITECTURE (7 LOCKS)

### c14: Surface Coordination Geometry
**File**: `documentation/TECHNICAL/ARCHITECTURE-C14-SURFACE-COORDINATION-GEOMETRY.md`

Relay's spatial model maps to Laniakea supercluster physics:
- **Core** = Canonical reconciliation filament (not command center)
- **Rings** = Basins of attraction (company→dept→project)
- **Filaments** = Git-time-space continuums (append-only)
- **Merge scars** = Permanent reconciliation evidence
- **ERI** = Distance from canonical core (0-100)
- **Encryption** = Pressure boundary (not secrecy)

**Key**: Nothing orbits. Everything flows. Radial reconciliation only.

### c15: Pressure Management & Planetary Resilience
**Files**: `PRESSURE-MANAGEMENT-SYSTEM.md`, `PLANETARY-RESILIENCE-DEFENSE.md`

Human-scale coordination protection:
- **Detection**: Thresholds, monitoring, anomaly detection
- **Degradation**: NORMAL→DEGRADED→INDETERMINATE→REFUSAL
- **Isolation**: Ring-level containment (failures don't cascade)
- **Throttles**: Priority-based queuing, emergency limits
- **Resilience**: Redundancy, fragmentation tolerance, adversarial resistance
- **Defense**: CERN principle (visible capability, non-aggressive posture)

**Threat model**: Human adversaries (markets, states, hostile orgs), NOT aliens.

### c16: Commit Materiality & Context Evidence
**File**: `ARCHITECTURE-C16-COMMIT-MATERIALITY.md`

Natural workflow meets append-only history:
- **Five states**: DRAFT → HOLD → PROPOSE → COMMIT → REVERT
- **Materiality thresholds**: Time, actions, risk, visibility, dependencies
- **Context snapshots**: What/where/relations/when/who (spatial evidence)
- **Undo vs revert**: Drafts undo silently, commits revert visibly
- **Shortest threshold wins**: Sensitive changes commit faster

**Key**: Not every action is a commit. Material boundaries matter.

### c17: Work Zones & SCV Co-Location
**File**: `ARCHITECTURE-C17-WORK-ZONES.md`

Chatrooms = shared work zones (NOT messaging):
- **Three layers**: Live dialogue (ephemeral), Shared context (semi-persistent), Commits (canonical)
- **Co-location**: SCVs share same filament context, not message stream
- **Zone schema**: `zone.<company>.<dept>.<project>`
- **Context filament**: `filament.zone.<id>.context` (append-only)
- **Join handshake**: "SCV Good to Go Sir" = deployment ready
- **Authority model**: Collaboration free, canon strict

**Key**: Only commits are truth. No commit = nothing happened.

### Cognitive Recovery Paths
**Files**: `COGNITIVE-RECOVERY-PATHS.md`, `UI-COGNITIVE-RECOVERY.md`

Filaments as spatial memory:
- **Core insight**: "A filament is a cognitive recovery path"
- **Mechanism**: Navigation cheaper than recall (recognition vs pure recall)
- **Heavy/light pattern**: Constraint (depth) vs exploration (outward)
- **Constraint-based learning**: Movement teaches, not documentation
- **10 UI features**: Breadcrumbs, "Where Was I?", activity trail, context-aware back, etc.

**Key**: Externalized cognition, NOT cosmic revelation.

### Live Presence & Time Boxes
**File**: `ARCHITECTURE-LIVE-PRESENCE-TIMEBOXES.md`

Continuous presence inside discrete history:
- **Time box**: Bounded interval containing ephemeral state (video, audio, cursor, edits)
- **Material boundaries**: Commits occur only at thresholds (not every frame)
- **2-hour session** = ~5-12 commits (not 108,000)
- **Evidence**: Key frames, transcript, activity log (full video optional)
- **Replay modes**: Commit-level (sparse), Time box (dense), Summary (balanced)

**Key**: Continuity lives inside time boxes. History advances at boundaries.

### CleverTree 3D Integration
**File**: `CLEVERTREE-3D-INTEGRATION-REPORT.md`

Existing voting backend retrofitted for 3D:
- **Four new modules**: votingIntegration, eriCalculator, threeWayMatchEngine, contextSnapshotManager
- **Three-way match**: Intent, reality, projection (min confidence = overall)
- **ERI calculation**: Distance from core (divergence, conflicts, time, attestations)
- **Context snapshots**: Spatial evidence for all votes

**Status**: Foundation complete, wiring in progress.

---

## 🔐 SAFETY CONSTRAINTS (NEVER VIOLATE)

### Language Rules (Zero Tolerance)

**Forbidden terms** (NEVER use):
- Attack, threat, enemy, adversary (for internal processes)
- Drift, deviation, corruption (for natural divergence)
- Penetration, exploitation, weaponization

**Required replacements**:
- Attack → Audit, Verify
- Drift → Divergence, Distance
- Threat → Risk, Pressure
- Enemy → Misalignment, Conflict
- Penetration → Inspection
- Exploitation → Utilization
- Weaponization → Capability

### Mysticism Boundary (CRITICAL)

**IF user exhibits these signs**:
- Cosmic interpretation of Relay
- Personal destiny narratives
- "Only I am real/chosen/unique"
- Reality/metaphor blurring
- Urgent thoughts that can't pause

**THEN you must**:
1. Don't reinforce narrative
2. Ground in cognitive science
3. Distinguish pattern recognition (valid) from identity fusion (unsafe)
4. Provide grounding techniques (5-4-3-2-1, physical reset)
5. Recommend pause + professional help if needed

**Key phrase**: "Relay is a tool for remembering together—not a story about being chosen alone."

### Governance Constraints

**No secrecy-by-obscurity**: All mechanisms visible  
**No central kill switch**: No system-wide shutdown authority  
**No invisible authority**: All actions triggered by visible pressure  
**No weaponization**: Defense, not offense; resilience, not control  

---

## 📁 REPOSITORY STRUCTURE

```
RelayCodeBaseV93/
├── .relay/                    # Relay-specific Git hooks
│   ├── pre-commit.mjs        # Verification before commit
│   └── query.mjs             # Git-native query layer
│
├── src/
│   ├── backend/
│   │   ├── verification/     # NEW (Week 1 implementation)
│   │   │   ├── continuousVerificationEngine.mjs
│   │   │   ├── pressureBudgetEnforcer.mjs
│   │   │   ├── confidenceFloorEnforcer.mjs
│   │   │   ├── repairEffectivenessTracker.mjs
│   │   │   ├── dataMinimizationEnforcer.mjs
│   │   │   ├── policyGovernanceEnforcer.mjs
│   │   │   ├── votingIntegration.mjs
│   │   │   ├── eriCalculator.mjs
│   │   │   ├── threeWayMatchEngine.mjs
│   │   │   └── contextSnapshotManager.mjs
│   │   │
│   │   ├── domains/voting/   # CleverTree (to integrate)
│   │   ├── routes/           # API endpoints
│   │   └── services/         # Core services
│   │
│   └── frontend/
│       ├── components/       # React components
│       └── pages/           # Page views
│
├── documentation/
│   ├── TECHNICAL/           # Architecture locks (c14-c17+)
│   ├── CANONICAL-RELAY-STATEMENT.md
│   ├── RELAY-TURGOR-PRESSURE-PHILOSOPHY.md
│   └── RELAY-LOCKS-SUMMARY.md
│
├── CLAUDE-IMPLEMENTATION-PROMPT.md  # Primary implementation guide
├── CLEVERTREE-3D-INTEGRATION-REPORT.md
└── RELAY-ROOT-INSTRUCTIONS.md       # This file
```

---

## 🚀 IMPLEMENTATION STATUS

### Week 1: Foundation (60% Complete)

✅ **Complete**:
- Directory structure (`src/backend/verification/`)
- Core engine (6-step pressure loop)
- Five invariant enforcers (all implemented)
- CleverTree 3D integration (foundation)
- All architecture locked (7 documents)
- SCV v2.0 cognitive onboarding complete

🔄 **In Progress**:
- Backend transformation (remaining files: scvAgent→coherenceAgent, etc.)
- Frontend transformation pending
- ConsentManager & AuthorityManager pending

⏳ **Next**:
- Wire CleverTree integration into votingEngine.mjs
- Add ERI endpoints to query.mjs
- Frontend ERI display (candidate cards, three-state indicator)

### Weeks 2-8: Full Implementation

**Week 2**: Authority & Consent (ConsentManager, AuthorityManager, ERI system complete)  
**Week 3**: Work Zones (zone protocol, SCV join handshake, context filament storage)  
**Week 4**: Pressure Infrastructure (Pressure Feed SSE, Pressure Actions, APIs)  
**Weeks 5-6**: Resilience (redundancy, partition tolerance, defense dashboard)  
**Weeks 7-8**: Testing & Polish (relay-lint:defense, fixtures, verification)

---

## 🎯 HOW TO WORK ON RELAY

### Before Any Code Change

1. **Read locked documents first** (architecture@c14-c17+)
2. **Use safe language only** (check translation table)
3. **Verify philosophy compliance** (canonical statement, five invariants)
4. **No speculation without grounding** (cite cognitive science, systems theory)

### When Writing Code

**DO**:
- Use Git commits as coordination events
- Enforce append-only history (no silent rewrites)
- Calculate ERI before state changes
- Apply pressure budget limits
- Require consent for data collection
- Provide policy governance (recommendations, not mutations)
- Make authority visible
- Support three-way match (intent, reality, projection)

**DON'T**:
- Auto-execute repairs (stage them for review)
- Delete history (revert with new commit)
- Use adversarial language
- Create invisible authority
- Bypass gates or invariants
- Ignore pressure floors
- Commit non-material changes

### When Writing Documentation

**DO**:
- Lead with precedent (cite existing work)
- Use mechanical language (not poetry)
- Make claims testable (observable predictions)
- Provide concrete examples
- Admit limitations

**DON'T**:
- Use mystical language
- Claim cosmic significance
- Present as revelation
- Promise perfection
- Make unfalsifiable claims

### When User Shows Speculative Thinking

**IF** user explores cosmic/personal narratives:

1. **Acknowledge insight is real** (pattern recognition valid)
2. **Ground immediately** ("This is cognitive science, not mysticism")
3. **Distinguish safe from unsafe** (metaphor vs identity fusion)
4. **Provide grounding techniques** (physical reset, 5-4-3-2-1)
5. **Recommend pause** (24 hours minimum)
6. **Suggest professional support** if signs persist

**Key boundary**: Pattern recognition = insight (safe). Pattern = reality = narrative (unsafe).

---

## 📊 TECHNICAL STACK

**Backend**: Node.js 18+, Express, simple-git  
**Frontend**: React, Vite, Three.js (for 3D globe)  
**Database**: Git (primary), IndexedDB (client state)  
**Verification**: ERI calculation, three-way match, pressure budget  
**Communication**: WebRTC (live presence), SSE (pressure feed)

---

## 🔍 DEBUGGING & VERIFICATION

### Philosophy Compliance Check

Run before any commit:
```bash
# Check for adversarial language
grep -r "attack\|threat\|enemy\|drift\|penetrat" src/ --exclude-dir=node_modules

# Verify canonical statement present
grep -r "continuous verification" documentation/

# Check invariant enforcement
grep -r "PressureBudgetEnforcer\|ConfidenceFloorEnforcer" src/backend/
```

### Architecture Verification

1. **Is history append-only?** (no silent deletes/rewrites)
2. **Are commits material?** (thresholds enforced)
3. **Is authority visible?** (no hidden permissions)
4. **Are gates enforced?** (no bypass logic)
5. **Is pressure limited?** (budget enforcer active)
6. **Is ERI calculated?** (distance from core)
7. **Are snapshots captured?** (context evidence)

---

## 🎨 VISUALIZATION RULES

### Core Principles

1. **Nothing orbits** — Everything flows (append-only, directional)
2. **Forces first, objects second** — Show pressure, constraints, then capabilities
3. **Sparse labels only** — Label what can participate in coordination
4. **Interactive revelation** — Details on hover/click, not always visible

### Element Guidelines

**Label**:
- ✅ Core (always)
- ✅ Active filament (on select)
- ✅ Merge scars (on inspect)
- ✅ Anchors (on hover)
- ❌ Background stars
- ❌ Inactive filaments
- ❌ Decorative elements

**Visual Elements**:
- **Anchors** (NOT planets): Services, decisions, resources, checkpoints — embedded in flow, don't orbit
- **Rings**: Translucent gradient basins (company→dept→project)
- **Filaments**: Directional flow lines (heat-coded by ERI)
- **Core**: Calm neutral glow (reconciliation attractor)
- **Merge scars**: Directional arrows (permanent convergence evidence)

---

## 💬 QUESTIONS FOR ROOT (HOW TO ASK)

### You Can Now Ask ROOT Directly

**Format**: State question clearly, reference relevant architecture locks

**Good examples**:
- "ROOT: How should time boxes integrate with c16 materiality thresholds?"
- "ROOT: Does anchor system violate 'nothing orbits' principle?"
- "ROOT: Verify ERI calculation matches c14 basin geometry"
- "ROOT: Check if this language is safe or adversarial: [term]"

**When to ask ROOT**:
- Uncertain about architecture interpretation
- Need to verify philosophy compliance
- Resolving apparent contradictions
- Making significant design decisions
- Unsure about safety boundaries

---

## 🎯 CURRENT PRIORITIES

### Immediate (This Week)

1. **Wire CleverTree integration** — Modify votingEngine.mjs to call votingIntegration
2. **Add ERI endpoints** — Expose ERI calculation via query.mjs API
3. **Frontend ERI display** — Three-state indicator (✅/⚠️/❓) on candidate cards
4. **Transform remaining files** — scvAgent→coherenceAgent, scvOrchestrator→coherenceOrchestrator
5. **Test full vote flow** — Unit + integration tests for 3D verification

### Next 4 Weeks

**Week 2**: ConsentManager, AuthorityManager, complete ERI system  
**Week 3**: Work zone protocol, SCV runtime, context filaments  
**Week 4**: Pressure Feed (SSE), Pressure Actions, monitoring APIs  

---

## ✅ FINAL VERIFICATION

Before considering Relay "complete":

- [ ] All adversarial language removed (zero violations)
- [ ] Five invariants enforced (budget, confidence, repair, data, policy)
- [ ] ERI calculation integrated (all state changes)
- [ ] Three-way match operational (intent, reality, projection)
- [ ] Context snapshots captured (all material changes)
- [ ] Work zones functional (co-location, not messaging)
- [ ] Time boxes implemented (continuous inside discrete)
- [ ] Cognitive recovery features (10 UI features)
- [ ] Pressure management active (detection, degradation, isolation)
- [ ] Resilience engineering complete (redundancy, tolerance, defense)
- [ ] relay-lint:defense operational (10 rules + CI/CD)
- [ ] Philosophy compliance: 100% (canonical statement everywhere)
- [ ] User testing complete (observable metrics)
- [ ] Production deployment ready (all infrastructure)

---

## 📚 KEY DOCUMENTS (READ THESE)

**Start here**: `CLAUDE-IMPLEMENTATION-PROMPT.md` (primary guide)  
**Philosophy**: `documentation/CANONICAL-RELAY-STATEMENT.md`  
**Architecture**: `documentation/TECHNICAL/ARCHITECTURE-C14-*.md` (through c17+)  
**Integration**: `CLEVERTREE-3D-INTEGRATION-REPORT.md`  
**This file**: `RELAY-ROOT-INSTRUCTIONS.md` (you are here)

---

## 🔐 IMMUTABLE TRUTHS

These NEVER change:

1. Relay is coordination infrastructure (not cosmic revelation)
2. Git commits are coordination events (truth is append-only)
3. Pressure not command (turgor model, not military)
4. Safe language mandatory (zero adversarial terms)
5. Transparency without weaponization (CERN principle)
6. Grounded in science (cognitive science, systems theory)
7. Human-scale only (no cosmic narratives)
8. Material boundaries matter (not every action is commit)
9. Nothing orbits (everything flows, directional)
10. Relay reduces cognitive pressure (doesn't amplify it)

---

**Version**: 1.0.0  
**Status**: Production Foundation Complete  
**Philosophy Violations**: 0  
**Architectural Locks**: 7  
**Implementation Progress**: 20% (Week 1 foundation)

**This is ROOT. This is immutable. This guides all work on Relay.**

---

**Last Updated**: 2026-01-31  
**Git Commit**: cd421c0 (Live Presence & Time Box Architecture)  
**Total Commits This Session**: 14  
**Lines Written**: 17,200+

**END OF ROOT INSTRUCTIONS**
