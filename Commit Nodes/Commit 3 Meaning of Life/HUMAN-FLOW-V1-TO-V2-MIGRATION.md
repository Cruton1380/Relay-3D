# 🔄 HUMAN FLOW CONTROL: V1 → V2 MIGRATION

**Date**: 2026-02-02  
**Status**: V2 SUPERSEDES V1  
**Impact**: Canon must update to V2 specification

---

## 🎯 WHAT CHANGED

### **V1 Scope** (Foundation)
- ✅ Education as rotating system
- ✅ Cognitive load accounting
- ✅ Round robin scheduler

### **V2 Adds** (Completion)
- ✅ **Exit/pause/dormancy** (leaving is safe)
- ✅ **Soft divergence** (disagree without escalating)
- ✅ **Cooling windows** (time as safety)
- ✅ **Minority relief** (exhaustion prevention)
- ✅ **Canon summarization** (legibility discipline)
- ✅ **Protected profiles** (vulnerable participants)
- ✅ **Stability acknowledgement** (inaction is valid)
- ✅ **Federation boundaries** (sovereign coexistence)

**V2 is not a revision—it's the completion of human flow control.**

---

## 📦 NEW PRIMITIVES (V2 ONLY)

### **1. Participation State Filament**
```yaml
participation.state.<userId>:
  states: [active, paused, dormant, exited]
  
  invariant: "Leaving must be safer than silent disengagement"
```

**Why**: Without explicit exit states, people ghost (silent disengagement). V2 makes leaving mechanical and penalty-free.

---

### **2. Soft Divergence**
```yaml
divergence.soft.<id>:
  non_blocking: true
  visible: true
  does_not_escalate: true
  
  invariant: "Not all disagreement should escalate"
```

**Why**: V1 only had disputes (blocking). V2 adds non-blocking disagreement (visible but doesn't stop work).

---

### **3. Cooling Windows**
```yaml
cooling_window:
  duration: 24-72h
  applies_to: [POLICY_CHANGE, STAGE_TRANSITION, HIGH_IMPACT_REPAIR]
  no_bypass: true
  
  invariant: "Irreversible actions require time, not urgency"
```

**Why**: V1 had refusal (missing evidence) but no time-based safety. V2 adds mandatory waiting periods for high-impact actions.

---

### **4. Minority Load Relief**
```yaml
minority.relief.<scope>:
  triggered_by: repeated_canon_loss + disproportionate_load
  effects: reduced_participation + increased_load_credit
  
  not_veto_power: true
  is_exhaustion_prevention: true
  
  invariant: "Minorities must not be exhausted"
```

**Why**: V1 protected individuals via cognitive load. V2 adds subgroup protection (minorities can't be ground down).

---

### **5. Canon Summarization Discipline**
```yaml
CANON_SUMMARY:
  status: PROJECTION (never authoritative)
  must_cite_commits: true
  cannot_replace_truth: true
  
  invariant: "Legibility may be summarized; truth may not"
```

**Why**: V1 had filament replay (full truth) but no legibility aid. V2 adds summaries as projections (helpful but non-authoritative).

---

### **6. Protected Participation Profiles**
```yaml
profile.protected:
  reduced_visibility: true
  no_governance_roles: true
  capped_cognitive_load: 50 (vs 80)
  mandatory_oversight: true
  
  invariant: "Reduced exposure is coordination hygiene, not privilege"
```

**Why**: V1 had uniform cognitive load (80% for everyone). V2 adds lower thresholds for vulnerable participants.

---

### **7. Stability Acknowledgement**
```yaml
STABILITY_CONFIRMED:
  meaning: "Reviewed. No action is correct."
  closes_pressure_loops: true
  prevents_reopening: true (60 day cooldown)
  
  invariant: "Inaction is valid"
```

**Why**: V1 had refusal (can't act) but no explicit "no action needed". V2 makes inaction a positive outcome.

---

### **8. Federation Boundaries**
```yaml
federation.boundary.<id>:
  exportable_evidence: defined
  non_exportable_policies: defined
  authority_non_transferable: true
  canon_independence: true
  
  invariant: "Coexistence must be sovereign"
```

**Why**: V1 had no multi-community model. V2 adds explicit federation (communities can coexist without merging).

---

## 🔒 INVARIANTS: V1 → V2

### **V1 Invariants** (Retained)
1. No coordination role may be permanent
2. No participant may be overloaded
3. Responsibility rotates or the system is wrong

### **V2 Adds** (New)
4. **Leaving must be safe**
5. **Disagreement may be non-blocking**
6. **Minorities must not be exhausted**
7. **Time is a safety mechanism**
8. **Summaries never replace history**
9. **Inaction is valid**

**Total: 9 invariants** (was 3)

---

## 🔍 NEW LINT RULES (V2 ONLY)

### **Exit/Pause**
- `LINT-EXIT-001`: Exit must be respected
- `LINT-EXIT-002`: No silent disengagement
- `LINT-PAUSE-001`: Pause blocks assignment

### **Minority Relief**
- `LINT-MINORITY-001`: Relief required for repeated loss + load

### **Disagreement**
- `LINT-DISAGREE-001`: Soft divergence allowed

### **Time as Safety**
- `LINT-TIME-001`: Cooling window required

### **Summarization**
- `LINT-SUMMARY-001`: Summary is projection

### **Stability**
- `LINT-STABILITY-001`: Stability closure allowed

### **Protected Profiles**
- `LINT-PROTECTED-001`: Profile restrictions enforced

### **Federation**
- `LINT-FED-001`: No authority export
- `LINT-FED-002`: Evidence schema check
- `LINT-FED-003`: Canon non-override
- `LINT-FED-004`: Explicit incompatibility required

**Total: 13 new lint rules**

---

## 📋 WHAT CANON MUST CHANGE

### **Files to Replace**
- ❌ Remove: `RELAY-HUMAN-FLOW-CONTROL-SPEC.md` (V1)
- ✅ Use: `RELAY-HUMAN-FLOW-CONTROL-V2.md` (V2)

### **New Object Models (8)**
```yaml
participation.state.<userId>
divergence.soft.<id>
minority.relief.<scope>
federation.boundary.<id>
profile.protected (capability)
cooling_window (enforcement object)
canon_summary (commit type)
stability_confirmed (commit type)
```

### **New Commit Types (3)**
```yaml
STABILITY_CONFIRMED
CANON_SUMMARY
FEDERATION_BRIDGE
```

### **New Refusal Types (V2)**
```yaml
REFUSED_PAUSED_USER
REFUSED_EXITED_USER
REFUSED_COOLING_WINDOW_ACTIVE
REFUSED_MINORITY_RELIEF_ACTIVE
REFUSED_PROTECTED_PROFILE
REFUSED_FEDERATION_AUTHORITY_INVALID
```

### **Update Existing Objects**
- Cognitive load: Add protected profile threshold (50%)
- Round robin: Add federation boundary awareness
- Authority: Add federation boundary check

---

## 📅 TIMELINE IMPACT

**V1 Timeline**: 12-14 weeks (original estimate)

**V2 Additions**: +1-2 weeks

**New Timeline**: **13-15 weeks** (realistic: 14 weeks)

**Breakdown**:
- Week 1-8: Mechanical coordination (unchanged)
- Week 9-12: Human flow V1 (education, cognitive load, round robin)
- Week 13: Human flow V2 additions (exit, soft divergence, cooling, minority, federation)
- Week 14: Integration testing + refinement
- Week 15: Buffer (if needed)

**Still achievable for Stage 1.**

---

## 🔄 MIGRATION STRATEGY

### **For Canon (Implementer)**

**If V1 already started**:
1. Keep V1 objects (education, cognitive load, round robin)
2. Add V2 objects (participation state, soft divergence, etc.)
3. Add V2 lint rules
4. Update refusal UX to include V2 states
5. Test integration

**If starting fresh**:
1. Skip V1 entirely
2. Implement V2 directly (includes all V1 + V2)

**Recommended**: Implement V2 directly (cleaner, no migration needed)

---

## 💡 WHY V2 IS NECESSARY

### **What V1 Proved**
- ✅ Participation can be sustainable (cognitive load)
- ✅ Authority can rotate (round robin)
- ✅ Education can scale (learners → teachers)

### **What V1 Did NOT Prove**
- ❌ Exit is safe (no penalty-free leaving)
- ❌ Disagreement is survivable (only disputes, no soft divergence)
- ❌ Minorities are protected (no exhaustion prevention)
- ❌ Time protects (no cooling windows)
- ❌ Inaction is valid (no stability acknowledgement)
- ❌ Communities can coexist (no federation boundaries)

### **What V2 Proves**
- ✅ All of V1
- ✅ **PLUS**: Exit, disagreement, minorities, time, inaction, coexistence

**V2 is the complete proof that Relay is livable.**

---

## 🔒 THE LOCK SENTENCES

### **V1 Lock** (Retained)
> "No coordination role may be permanent.  
> No participant may be overloaded.  
> Responsibility rotates or the system is wrong."

### **V2 Lock** (New, Supersedes)
> **"Relay must make coordination sustainable,  
> disagreement survivable,  
> exit safe,  
> and coexistence possible."**

**V2 lock encompasses V1 lock.**

---

## ✅ CONFIRMATION

**V1 Status**: ✅ Foundation (education, cognitive load, round robin)  
**V2 Status**: ✅ Completion (+ exit, disagreement, minorities, time, inaction, federation)  
**Migration**: ✅ Straightforward (additive, not destructive)  
**Timeline**: ✅ Realistic (+1-2 weeks, total 13-15 weeks)  
**Canon Impact**: ✅ Implement V2 directly (skip V1)

---

## 🚀 FINAL RECOMMENDATION

**For Canon**:
- ✅ Use `RELAY-HUMAN-FLOW-CONTROL-V2.md` as authoritative spec
- ✅ Ignore V1 (superseded)
- ✅ Implement all V2 primitives, lint rules, and refusal types
- ✅ Treat federation as first-class (not future work)

**V2 is the complete specification.** 🔒
