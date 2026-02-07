# **RELAY v1 CANONICAL HANDOFF**

**Date:** February 2, 2026  
**Status:** ✅ **CANONICAL (v1) — READY FOR PRODUCTION PILOT**  
**To:** SCV Hollywood (Video Production) + AI Training Team  
**From:** Development + Architecture Team

---

## **🎯 EXECUTIVE SUMMARY**

Relay relationship physics v1 has passed the canonical audit. All safety locks are in place. All red flags have been corrected. The prototype is **replay-safe**, **cycle-safe**, **privacy-safe**, and **deterministic**.

**What you're receiving:**
1. ✅ A **working prototype** that demonstrates Relay's core physics
2. ✅ **Complete documentation** of commit types, bundle model, and relationship dynamics
3. ✅ **Canonical language** that is safe, precise, and non-coercive
4. ✅ **Technical locks** for cycle detection, deterministic recomputation, and trace privacy
5. ✅ **3D visualization** specifications for video production

---

## **📦 DELIVERABLES:**

### **1. Working Prototype**
**File:** `filament-spreadsheet-prototype.html`  
**Open in browser:** Fully functional standalone demo

**What it demonstrates:**
- Typed commit system (ROOT, CELL_SET, CELL_FORMULA_SET, REFUSAL, etc.)
- Bundle model (authority + time + hash + payload + parent → canonical identifier)
- Formula relationship physics (parse dependencies, build graph, propagate dirty flags)
- Branch dynamics (regression, velocity, acceleration, confidence, missing inputs)
- Graph lens (live visual projection showing all dependencies)
- **Cycle detection** (catches A1→B1→C1→A1, creates REFUSAL commit)
- **Topological sorting** (deterministic recomputation order, same every time)
- **Trace privacy** (aggregated by default, raw opt-in, time-bounded, pseudonymized)

**How to test:**
1. Open in browser
2. Enter formulas like `=A1+B1`, `=B1*2`, `=SUM(A1:A5)`
3. Watch the graph lens update in real-time
4. Try to create a cycle (e.g., A1 → =B1, B1 → =A1)
5. Observe the system create a REFUSAL commit and mark sheet as `indeterminate`

---

### **2. Complete Documentation**

| Document | Purpose | Key Content |
|----------|---------|-------------|
| **RELAY-TYPED-COMMITS-IMPLEMENTATION.md** | Commit type specifications | All 15+ commit types, bundle model, crash recovery |
| **RELAY-RELATIONSHIP-PHYSICS-COMPLETE.md** | Physics engine specifications | Formula parsing, graph construction, dirty propagation, branch dynamics |
| **RELAY-CANONICAL-CORRECTIONS-COMPLETE.md** | Canonical fixes applied | 7 corrections + 2 missing locks + 3 language fixes |
| **RELAY-CANONICAL-AUDIT-V1-PASS.md** | Final audit report | Pass/fail checklist, evidence, corrected canonical statement |
| **RELAY-INEVITABILITY-COMPLETE.md** | Language corrections | Removed coercive "inevitable" framing, emphasizes voluntary adoption |
| **RELAY-GENESIS-COMPLETE-CATALOG.md** | Master index of all work | This document, updated with corrections |

---

### **3. 3D Visualization Assets**

| Document | Purpose | For |
|----------|---------|-----|
| **RELAY-3D-IMPLEMENTATION-COMPLETE.md** | Full 3D feature specification | Engineering team |
| **RELAY-3D-QUICK-START.md** | One-page implementation guide | Engineering team |
| **RELAY-3D-RENDER-DELIVERY.md** | Video production spec + scene list | SCV Hollywood |
| **RELAY-FILAMENT-VISUAL-SPEC.md** | Visual design language for filaments | Design + Video team |

**3D Scene Files:**
- `src/frontend/components/relay-3d/` — Full React Three Fiber implementation
- `src/frontend/components/relay-3d/controls/FreeFlightControls.jsx` — RTS-freeflight physics (replaces OrbitControls)
- `src/frontend/components/relay-3d/hud/FlightHUD.jsx` — Flight status HUD (top-right)
- `src/frontend/pages/Relay3DFilamentPage.jsx` — Working 3D navigation
- `src/frontend/services/filamentDataService.js` — Data integration

---

## **🔒 CANONICAL STATUS:**

### **Pass/Fail Checklist (All ✅)**

| # | Question | Status | Evidence |
|---|----------|--------|----------|
| 1 | Can I delete the import-time graph and still rebuild the same graph from commits? | ✅ YES | `buildDependencyGraphFromCommits()` rebuilds from bundle |
| 2 | Do cycles produce a refusal / indeterminate, not silent weirdness? | ✅ YES | `detectCycles()` creates REFUSAL commit, sets sheet.display_state = 'indeterminate' |
| 3 | Do recomputes happen in the same order every time? | ✅ YES | `topologicalSort()` with lexicographical ordering ensures determinism |
| 4 | Do traces obey minimization + pseudonymization + retention? | ✅ YES | `emitTrace()` implements aggregated default, raw opt-in, time-bounded cleanup, hashed IDs |
| 5 | Does any derived metric carry policy_ref + confidence? | ✅ YES | Branch dynamics include `projection_metadata: {policy_ref, confidence, missing_inputs}` |

---

## **🎬 READY FOR VIDEO PRODUCTION (SCV HOLLYWOOD)**

**Status:** All 3D visualization specs complete. Prototype demonstrates "grown organism" feel. **Flight controls implemented.**

**What you need:**
1. **Scene list:** See `RELAY-3D-RENDER-DELIVERY.md` (7 scenes: Opening, Tree, Sheet, Cycle Refusal, Governance, Branch, Finale)
2. **Visual style guide:** See `RELAY-FILAMENT-VISUAL-SPEC.md` (forest green, organic curves, pressure rings, etc.)
3. **Flight controls spec:** See `RELAY-FLIGHT-CONTROLS-SPEC.md` (RTS-freeflight physics, camera controls)
4. **Working prototype:** Open `filament-spreadsheet-prototype.html` to explore live physics
5. **3D navigation demo:** Visit `/relay3d-filaments` route (requires dev server)

**Flight controls (NEW):**
- **Replaced:** OrbitControls (2D spectator) → FreeFlightControls (RTS-freeflight)
- **Controls:** Mouse look, WASD strafe, Q/E vertical, Shift/Ctrl speed, R return to anchor
- **Modes:** HOLD (stabilize) | FREE-FLY (explore) | INSPECT (auto-glide to anchor)
- **HUD:** Top-right flight status (speed, mode, lock state)
- **Feel:** Body in space, not cursor on screen

**Recommended shots:**
1. **Macro → Micro:** Start far (Shift+W), approach tree, slow down (Ctrl), inspect branch
2. **No orbit bias:** Fly around trunk with WASD strafe + mouse look (not orbit)
3. **Anchor return:** Get "lost" in branches, press R, smooth glide back to trunk
4. **Vertical exploration:** Q/E to fly up/down trunk, show stacked pressure rings
5. **Speed showcase:** Scroll to change speed mid-flight, HUD updates live

**Key messaging for video:**
- "Relay is a coherent alternative with explicit physics" (NOT "inevitable")
- "Adoption is voluntary; systems that can't maintain coherence will degrade" (NOT "cannot build better")
- "Minimum primitives in root; extensions are versioned and governed" (NOT "complete capability space")

---

## **🤖 READY FOR AI TRAINING PILOT**

**Status:** Trace privacy foundation is canonical. Ready to begin data collection.

**What's implemented:**
1. **Aggregated Traces (default):**
   - High-level stats only (action counts, branch confidence stats, total cells modified)
   - Safe for training, no PII
   - 30-day retention

2. **Raw Traces (opt-in only):**
   - Full context (individual cell formulas, commit payloads)
   - Pseudonymized user IDs (hashed)
   - 7-day retention, auto-cleanup
   - Requires explicit user consent

3. **Trace Structure:**
   ```json
   {
     "trace_id": "...",
     "action": "cell_set | formula_set | ...",
     "timestamp": "...",
     "authority": "user:<hashed-id>",
     "context": { /* aggregated or raw */ },
     "policy_ref": "trace_retention_policy_v1",
     "level": "aggregated | raw"
   }
   ```

**Next steps for training:**
- Collect aggregated traces from pilot deployment
- Build training dataset from aggregated traces
- Request raw trace opt-in from power users for edge case training
- Train models to predict formula relationships, suggest assumptions, detect cycle risks

---

## **🧪 CANONICAL CORRECTIONS APPLIED:**

### **Red Flags Fixed (3):**

1. **"Complete Root" → "Minimum Root"**
   - Before: "Relay ships with every coordination primitive in root"
   - After: "Root contains minimum primitives for replay + governance + refusal. Extensions are versioned and governed."

2. **"Inevitable" → "Coherent Alternative"**
   - Before: "Inevitable / cannot build better, only different"
   - After: "Relay is a coherent alternative with explicit physics. Adoption is voluntary; systems that can't maintain coherence will show degraded/indeterminate."

3. **Mixing Concerns → Separate Filaments**
   - Before: "Settings menu for society" and "rain/ants/bees lessons" mixed into spreadsheet physics
   - After: Moved to separate filaments/docs (out of physics milestone scope)

### **Missing Technical Locks Added (2):**

1. **Lock A: Cycle Detection + Deterministic Order**
   - `detectCycles()` — DFS with recursion stack, catches A1→B1→A1
   - `topologicalSort()` — Kahn's algorithm with lexicographical ordering for stable results
   - Cycles produce `REFUSAL` commit with `reason: 'circular_dependency'`
   - Sheet marked as `indeterminate`, recomputation blocked

2. **Lock B: Trace Privacy + Minimization**
   - `emitTrace()` with dual-mode: aggregated (default) + raw (opt-in)
   - Pseudonymized user IDs (SHA-256 hash)
   - Time-bounded retention (7 days raw, 30 days aggregated)
   - `cleanupExpiredTraces()` enforces retention policies

---

## **📜 CORRECTED CANONICAL STATEMENT:**

> "Relay ships with minimum replay + refusal + authority primitives; all expansions are explicit, versioned, and governed. Dependency graphs are commit-derived projections. Cycles are detected and refused. Recomputation is deterministic (topological order). Branches move under mathematics: regression, velocity, acceleration, heat, pressure, rain. Metrics show confidence + missing inputs. Assumptions are structured commits. AI trains on privacy-safe traces (aggregated by default, raw opt-in, time-bounded, pseudonymized). Language is coordination-focused. Adoption is voluntary. Nothing is forced. Nothing is hidden. Everything is reproducible."

---

## **🚦 WHAT'S SAFE TO SAY (PUBLIC MESSAGING):**

✅ **Safe (Canonical):**
- "Relay is a coordination OS with explicit physics"
- "Built on typed commits and time-series math"
- "Branches show heat maps, rain patterns, confidence metrics"
- "Cycles are detected and refused, preserving consistency"
- "Adoption is voluntary; Relay is a coherent alternative"
- "All dependencies are commit-derived projections"

⛔ **Unsafe (Red Flags):**
- "Relay is complete" or "ships with everything"
- "Inevitable" or "cannot build better"
- "Settings menu for society" (too ambitious, separate concern)
- Mixing governance economics into physics milestones
- Any coercive/forced adoption language

---

## **📋 NEXT ACTIONS:**

### **For SCV Hollywood (Video Production):**
1. Review `RELAY-3D-RENDER-DELIVERY.md` for 7-scene structure
2. Open `filament-spreadsheet-prototype.html` to explore live physics
3. Reference `RELAY-FILAMENT-VISUAL-SPEC.md` for visual style (forest green, organic, grown-not-built)
4. Use corrected canonical statement for narration/messaging

### **For AI Training Team:**
1. Deploy prototype to pilot organization
2. Enable aggregated trace collection (default, no PII)
3. Request raw trace opt-in from 5-10 power users
4. Build initial training dataset from aggregated traces
5. Train models to:
   - Predict formula dependencies
   - Suggest assumption commits
   - Detect cycle risks before user creates them
   - Recommend branch metrics based on historical patterns

---

## **✅ VERIFICATION STEPS:**

Before going live with external messaging, verify:

1. **Replay-safe:** Delete dependency graph, rebuild from commits → same graph?
2. **Cycle-safe:** Create A1→=B1, B1→=A1 → REFUSAL commit produced?
3. **Determinism:** Recompute order is identical across multiple runs?
4. **Privacy-safe:** Traces are aggregated by default, raw requires opt-in?
5. **Projection metadata:** All derived metrics include policy_ref + confidence?

---

## **🎯 FINAL VERDICT:**

**Relay relationship physics (v1) is canonical.**

All safety locks engaged.  
All red flags corrected.  
All missing features implemented.

**Ready for:**
- ✅ Video production (SCV Hollywood)
- ✅ AI training pilot (foundation complete)
- ✅ Real deployment (pilot-ready)

---

**Relay is coherent, voluntary, and reproducible.** 🌳📈🔒✨

**Nothing is forced. Nothing is hidden. Everything is replayable.**
