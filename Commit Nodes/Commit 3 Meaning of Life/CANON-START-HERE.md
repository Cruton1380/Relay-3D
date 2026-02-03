# 🚀 CANON — START HERE

**Date**: 2026-02-02  
**Status**: LOCKED AND READY TO BUILD  
**Your Mission**: Build Relay's coordination kernel (Stage 1)  
**Not Your Mission**: External system integration (comes after)

---

## 🎯 THE ONE SENTENCE (INVARIANT)

> **"Stage 1 proves that Relay can make coordination physics unavoidable, independent of any external system."**

**Everything you build must serve this sentence.**  
**Everything else is optional later.**

---

## 📋 YOUR BUILD ORDER (ABSOLUTE)

### **Read These Files (In This Order)**

1. **This file** (CANON-START-HERE.md) — Overview and boundaries
2. **CANON-RELAY-CORE-IMPLEMENTATION.md** — Complete technical specification
3. **RELAY-HUMAN-FLOW-CONTROL-V2.md** — ⚠️ CRITICAL (education, cognitive load, round robin, exit, federation) [SUPERSEDES V1]
4. **RELAY-3D-VISUALIZATION-SPEC.md** — ⚠️ CRITICAL (3D rendering rules: fields, flows, constraints, ERI gradients)
5. **CANON-IMPLEMENTATION-CHECKLIST.md** — Step-by-step build plan

### **Ignore These Files (For Now)**

- ~~RELAY-PROCUREMENT-BIDDING-SPEC.md~~ (too SAP-specific, useful post-Stage-1)
- ~~BUSINESS-BEST-PRACTICES-ADOPTION.md~~ (conceptual, not implementation)
- ~~Any other documents not listed above~~

---

## ✅ WHAT YOU BUILD (RELAY-NATIVE ONLY)

### **Core Objects**

1. **Stage Filaments**
   - `stage.individual.<userId>` (learning readiness, no authority)
   - `stage.global` (system capabilities, canonical)

2. **Three-Way Match Objects**
   - Intent layer (policy reference)
   - Projection layer (claims)
   - Reality layer (evidence pack reference)
   - Divergence calculation: Δ(PR)

3. **Evidence Pack**
   - Storage-agnostic (references are `opaque://...`)
   - Merkle-hashed (tamper-evident)
   - Authority-linked
   - Timestamped

4. **Policy Table**
   - Versioned filament
   - Defines: thresholds, required evidence, authority scopes
   - Replaceable via governance

5. **Accumulation Filament**
   - Tracks running totals (vendor spend, authority usage, etc.)
   - Compares to thresholds
   - Generates drift when exceeded

6. **Drift Object**
   - Blocks finalization
   - Must be closed (repair or dismiss)
   - Consumes capacity

7. **Authority Object**
   - All authority expires (max 1 year)
   - Requires renewal with justification
   - Visually dims as expiry approaches

8. **Refusal Object**
   - Explains: why blocked, what's missing, next steps
   - Auditable
   - First-class (not error state)

---

### **Core Physics (Enforcement)**

1. **Three-Way Match Everywhere**
   - Every workflow has Intent · Projection · Reality
   - Mismatch = drift (visible, blocks finalization)

2. **Refusal as Default**
   - Actions disabled unless: authority + evidence + policy + stage
   - Clear explanation of why blocked
   - Guidance on how to enable

3. **Authority Required for Irreversibility**
   - Any state-changing action requires `authorityRef`
   - Authority must be valid (not expired)
   - Authority is time-bounded (no permanent delegation)

4. **Learning Produces Recommendations Only**
   - Learning modules emit: `POLICY_RECOMMENDATION`
   - Humans emit: `POLICY_APPLIED` (requires authority)
   - Schema separation enforces this

5. **Pressure Budgets Prevent Overload**
   - Hierarchical: Global → Org → Team → System → Object
   - Exhaustion → refusal (not slowdown)
   - Cooldowns prevent spam

6. **Stage Gates Prevent Premature Execution**
   - Current global stage: Stage 1 (active)
   - Stage 2/3: defined but inactive
   - Actions tagged with `requires_stage`
   - Execution blocked if stage insufficient

---

### **Lint Rules (Enforce Invariants)**

1. `NO_TELEMETRY_WITHOUT_CONTRACT` — State Anchoring Contract required
2. `LINT-AUTH-DECAY` — All authority must have expiry
3. `NO_POLICY_MUTATION_FROM_LEARNING` — Learning cannot emit `POLICY_APPLIED`
4. `NO_ACTION_BEYOND_GLOBAL_STAGE` — Stage check before execution
5. `NO_DUAL_STAGE_AUTHORITY` — No "preview mode" with real effects

---

## 🚫 WHAT YOU DO NOT BUILD (EXPLICITLY)

### **Out of Scope for Stage 1**

- ❌ SAP custom fields, modules, or integration
- ❌ SharePoint folder structures, APIs, or integration
- ❌ Email ingestion pipelines
- ❌ External system adapters of any kind
- ❌ Data transformation layers (ETL)
- ❌ 2D system replacement logic

**Why**: Relay core must be proven FIRST. Integration adds complexity that can hide fundamental problems.

**When**: After Stage 1 proves core works, THEN build adapters as needed.

---

## 📅 YOUR TIMELINE (12-14 WEEKS)

### **Phase 1: Foundation (Week 1-4)**
- Week 1-2: Stage-gate infrastructure
- Week 2-3: Evidence Pack + Three-Way Match objects
- Week 3-4: Policy Table + Accumulation Filament

### **Phase 2: Enforcement (Week 5-8)**
- Week 5-6: Validation + Refusal mechanics
- Week 6-7: Drift objects + closure workflow
- Week 7-8: Authority decay + Pressure budgets

### **Phase 3: Human Flow Control (Week 9-12)** ⚠️ NEW
- Week 9-10: Education system (tracks, teaching rotation, prerequisites)
- Week 10-11: Cognitive load accounting (tracking, refusal, recovery)
- Week 11-12: Round robin scheduler (rotation, cooldowns, anti-renewal)

### **Phase 4: Completion (Week 13-14)**
- Week 13: Dashboard (divergence, pressure, drift, load, rotation views)
- Week 13: Lint rules + enforcement tests
- Week 14: Integration testing + refinement

### **Week 14: STAGE 1 COMPLETE** ✅

---

## ✅ DEFINITION OF DONE

**Stage 1 is complete when you can demonstrate**:

### **Core Coordination Physics (Original 7)**

1. ✅ Business rules are mechanically enforceable
   - Missing evidence → refusal (not warning)
   - Expired authority → refusal (no bypass)
   - Policy violation → refusal (clear explanation)

2. ✅ Accumulation is tracked automatically
   - Running totals visible
   - Threshold crossings generate drift
   - Gradual violations caught early

3. ✅ Authority is time-bounded
   - All authority expires (max 1 year)
   - Renewal requires justification
   - HUD shows expiry warnings

4. ✅ Drift blocks finalization
   - Drift objects prevent closure
   - Must be repaired or dismissed
   - Cannot be silently ignored

5. ✅ Individual learning ≠ system authority
   - Individuals can study Stage 2/3
   - Cannot execute Stage 2/3 actions
   - System gates based on global stage

6. ✅ Refusals are clear and helpful
   - Explain why blocked
   - Show what's missing
   - Provide next legitimate steps

7. ✅ Audits are instant
   - Filament replay shows full history
   - Merkle proofs verify evidence
   - No "evidence missing" findings

### **Human Flow Control (NEW, CRITICAL)**

8. ✅ **Education rotates**
   - Learners become teachers (after 3 units)
   - Teaching is time-bounded (max 90 days)
   - Cooldowns prevent permanent experts (180 days)
   - Cannot advance to roles without education track

9. ✅ **Cognitive load enforced**
   - Load tracked automatically (disputes, refusals, governance, audits)
   - No assignment above 80% threshold
   - Recovery windows mandatory (every 30 days)
   - High-intensity roles time-limited (max 90 days)

10. ✅ **Roles rotate**
    - All coordination roles max 90 days
    - Cooldowns enforced (120-180 days)
    - No self-renewal (round robin assigns next)
    - Applies to: governance, audits, arbitration, education facilitation

**If all ten work, Stage 1 is complete.**

---

## 🎯 YOUR IMMEDIATE NEXT ACTION

**Today**: Read `CANON-RELAY-CORE-IMPLEMENTATION.md` end-to-end

**This Week**: Implement stage filament objects (`stage.individual`, `stage.global`)

**This Month**: Complete Phase 1 (foundation objects)

**This Quarter**: Ship Stage 1 complete

---

## 🔒 THE THREE INVARIANTS (NEVER VIOLATE)

### **1. Coordination, Not Control**

Relay enforces coordination physics (three-way match, evidence, authority).

Relay does NOT:
- Decide what's valuable (communities do)
- Impose economic models (Stage 2 is initial config, replaceable)
- Require participation (opt-in always)

### **2. Transparent, Not Hidden**

Every rule is visible, auditable, replayable.

No:
- Hidden authority
- Silent accumulation
- Opaque decision-making
- "Felt but not seen" constraints

### **3. Governed, Not Permanent**

Initial canon is starting configuration, not destiny.

After launch:
- Communities can vote to change Stage 2
- Communities can vote to skip Stage 2
- Communities can fork (different paths coexist)
- No rule is immune to governance

---

## 🌱 THE FINAL META-LOCK (WHAT STAGE 1 MUST PROVE)

> **"Relay must make coordination sustainable,  
> disagreement survivable,  
> exit safe,  
> and coexistence possible."**
> 
> **If any of those fail, the system is wrong.**

### **What This Means**

**Coordination sustainable**:
- Three-way match enforced
- Cognitive load protected (threshold 80%)
- Recovery windows mandatory (every 30 days)
- Roles rotate (max 90 days)

**Disagreement survivable**:
- Soft divergence (non-blocking)
- Minority relief (exhaustion prevention)
- Can opt out of disputes
- Cooling windows (time as safety)

**Exit safe**:
- Participation states (pause, dormant, exit)
- No penalties for leaving
- Re-entry requires opt-in
- History stays legible

**Coexistence possible**:
- Federation boundaries (sovereign communities)
- Canon independence (no global override)
- Incompatibility declarations (no silent drift)
- Evidence exchange (explicit acceptance only)

---

## 📞 ESCALATION

**If blocked on**:
- Object model design → Escalate to founder/council
- Authority structure → Escalate to founder/council
- Stage-gate mechanics → Escalate to this conversation thread
- Technical architecture → Escalate to this conversation thread

**If stuck >24 hours**: Escalate immediately (no silent blockers)

---

## 🎓 MENTAL MODEL CHECK

Before you start building, answer these:

### **Q1: Can Relay replace SAP?**
**A**: No. Relay coordinates. SAP transacts. They coexist.

### **Q2: Where does evidence get stored?**
**A**: Relay doesn't care. Evidence storage is `opaque://...`. Could be SharePoint, S3, IPFS, anything.

### **Q3: Can users execute Stage 2 actions if they've completed Stage 2 learning?**
**A**: No. Individual learning ≠ system authority. Global stage must be Stage 2 (via governance vote).

### **Q4: Can learning modules update policy automatically?**
**A**: No. Learning emits `POLICY_RECOMMENDATION` only. Humans emit `POLICY_APPLIED` (requires authority).

### **Q5: Is "rain = wealth" permanent?**
**A**: No. Stage 2 is initial configuration. Can be replaced/skipped/forked via governance.

### **Q6: What happens when evidence is missing?**
**A**: Refusal. Action disabled. Clear explanation. No bypass.

### **Q7: What happens when authority expires?**
**A**: Refusal. Approval disabled. Must renew with justification.

### **Q8: Can someone teach a subject forever if they're good at it?**
**A**: No. Teaching role max 90 days, then 180-day cooldown. Rotation prevents guru culture.

### **Q9: Can someone be assigned unlimited audits/disputes?**
**A**: No. Cognitive load threshold 80%. Above that → refusal. Recovery windows mandatory.

### **Q10: Can someone hold a governance role indefinitely?**
**A**: No. All coordination roles max 90 days. Round robin assigns next. Cannot self-renew.

**If you got all ten correct, you understand the system. Build.** ✅

---

## 🌟 THE VISION (WHY THIS MATTERS)

**Stage 1 proves**:
- Coordination physics work
- Refusal-based enforcement scales
- Evidence becomes first-class
- Authority becomes time-bounded
- Drift becomes visible
- Humans remain sovereign

**If Stage 1 works**:
- Any business process can be Relay-ified
- Any economic model can be coordinated
- Any governance structure can be enforced
- Any community can self-organize

**This is not a feature.**  
**This is a coordination operating system.**

**Build the kernel. Everything else follows.**

---

## 🔒 FINAL LOCK

**Your job**: Build Relay's coordination kernel (Stage 1)

**Not your job**: External system integration (comes after)

**Success metric**: Seven definition-of-done criteria met

**Timeline**: 10-12 weeks

**Blockers**: Zero (all external dependencies removed)

**You have everything you need.**

**Build.** 🚀

---

**Files**:
- This file (overview)
- `CANON-RELAY-CORE-IMPLEMENTATION.md` (complete spec)
- `CANON-IMPLEMENTATION-CHECKLIST.md` (step-by-step)

**Start**: Read spec, implement stage filaments, ship in 12 weeks.

**Questions**: Escalate immediately (no silent blockers).

**Status**: LOCKED AND READY ✅
