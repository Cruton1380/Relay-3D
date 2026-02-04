# RELAY CANON DECLARATION

**Status**: CANONICAL LAW (NON-NEGOTIABLE)  
**Date Sealed**: 2026-02-04  
**Commit**: bdd8fe5  
**Authority**: Model Canonicalization (All 4 Conditions Met)

---

## 🔒 CANONICAL MODELS (ENFORCEABLE)

As of commit `bdd8fe5`, the following models are **canonical Relay filaments**.

Any implementation that does not conform is **non-Relay by definition** and **MUST fail `relay-lint`**.

---

### **1. FILAMENT SPREADSHEET MODEL**

**Declared**: 2026-02-04  
**Spec**: `RELAY-FILAMENT-SPREADSHEET-SPEC.md`  
**Enforcement**: `RELAY-ENFORCEMENT-CONTRACTS.md`  
**Lint Rules**: `relay-lint-defense.json` (27 rules)

**Canonical Definition**:

```yaml
spreadsheet:
  type: "filament"
  
  # MANDATORY: Every edit is a commit
  operations:
    cell_edit: "CELL_UPDATE commit"
    row_add: "ROW_CREATE commit"
    formula_change: "FORMULA_UPDATE commit"
  
  # MANDATORY: Formulas are projections
  formulas:
    type: "projection"
    verification: "three_way_match"
    drift_on_mismatch: true
  
  # MANDATORY: ERI per cell
  eri:
    scope: "per_cell"
    required: true
    components: ["visibility", "config", "patch", "authority", "recovery"]
  
  # MANDATORY: Authority expires
  authority:
    scope: "cell|column|sheet"
    expires_at: "required"
    max_duration: "30d"
  
  # MANDATORY: Evidence links
  evidence:
    required: true
    types: ["quote", "email", "contract", "approval"]
  
  # MANDATORY: Forks for scenarios
  forks:
    enabled: true
    use_case: "what_if_analysis"
```

**Non-Canonical (Refused)**:

Any spreadsheet implementation that:
- ❌ Allows edits without commits
- ❌ Treats formulas as "just calculations" (not projections)
- ❌ Has no ERI per cell
- ❌ Grants permanent authority
- ❌ Lacks evidence anchoring
- ❌ Prevents forking

**Enforcement**: `LINT-CORE-001` through `LINT-CORE-010` + all 27 rules

---

### **2. ENFORCEMENT CONTRACTS (9 MECHANISMS)**

**Declared**: 2026-02-04  
**Spec**: `RELAY-ENFORCEMENT-CONTRACTS.md`  
**Lint Catalog**: `relay-lint-defense.json`

**Canonical Definition**:

All Relay implementations **MUST** enforce:

1. **State Anchoring Contracts (SAC)** - No ambient telemetry
2. **Drift as First-Class Filament** - Blocks finalization
3. **Authority Decay** - All authority expires (30d max)
4. **Learning Boundary** - Learning produces recommendations only
5. **Refusal-First UX** - Actions disabled by default
6. **Hierarchical Pressure Budgets** - Global → Org → Team → System → Object
7. **Truth Cutover** - One-way 2D→Relay (no dual authority)
8. **Privacy & Minimization** - Aggregated-by-default telemetry
9. **Human Flow Control v2** - Exit safe, rotation, load caps

**Non-Canonical (Blocks Deploy)**:

Any implementation that:
- ❌ Captures state without SAC
- ❌ Treats drift as warnings only
- ❌ Grants permanent authority
- ❌ Allows learning to mutate policy
- ❌ Hides refusal reasons
- ❌ Uses flat pressure budgets
- ❌ Maintains dual authority after cutover
- ❌ Defaults to raw telemetry
- ❌ Ignores human flow primitives

**Enforcement**: All violations → **BLOCK_DEPLOY** (no exceptions)

---

### **3. THREE-WAY MATCH (CORE PHYSICS)**

**Declared**: 2025-12-15 (pre-existing, now reinforced)  
**Spec**: `RELAY-CONTROL-SYSTEMS-PROOF.md`

**Canonical Definition**:

All state changes **MUST** use three-way match:

```yaml
three_way_match:
  intent: "What we're trying to do"
  reality: "What actually happened"
  projection: "What we expect to happen next"
  
  verification:
    match: boolean
    confidence: 0.0 - 1.0
    mismatches: [...]
  
  on_mismatch:
    action: "create_drift_object"
    block_finalization: true
```

**Non-Canonical (Refused)**:

- ❌ Direct state mutations
- ❌ Silent drift handling
- ❌ Bypassing verification

**Enforcement**: `LINT-CORE-001`, `LINT-CORE-002`

---

### **4. ERI (EXPOSURE READINESS INDEX)**

**Declared**: 2025-12-20 (pre-existing, now reinforced)  
**Spec**: `RELAY-CONTROL-SYSTEMS-PROOF.md`

**Canonical Definition**:

All objects **MUST** have ERI (scalar potential):

```yaml
eri:
  score: 0 - 100
  
  components:
    visibility: "Is this object discoverable?"
    configuration: "Is it properly configured?"
    patch_status: "Is it up-to-date?"
    authority: "Who can act on it?"
    recovery: "Can it be restored?"
  
  gradient:
    direction: "Repair path (∇E)"
    magnitude: "Urgency"
```

**Non-Canonical (Refused)**:

- ❌ Objects without ERI
- ❌ ERI computed in frontend (must be backend)
- ❌ No gradient (repair path)

**Enforcement**: `LINT-FRONTEND-001`, ERI calculator required

---

### **5. HUMAN FLOW CONTROL V2**

**Declared**: 2026-01-10 (pre-existing, now reinforced)  
**Spec**: `RELAY-HUMAN-FLOW-CONTROL-V2.md`

**Canonical Definition**:

All human participation **MUST** enforce:

- **Participation States**: `active|paused|dormant|exited`
- **Exit Safe**: Paused/exited users cannot be assigned roles
- **Round Robin**: All roles expire (30d max) + cooldown
- **Cognitive Load Cap**: Max 50 units per user
- **Minority Load Relief**: Triggered after 3 consecutive canon losses
- **Soft Divergence**: Non-blocking disagreement (preserved, not escalated)
- **Cooling Windows**: Gated commits require 24-72h before execution
- **Summaries as Projections**: Non-authoritative, must cite commits

**Non-Canonical (Refused)**:

- ❌ Permanent roles
- ❌ Silent disengagement
- ❌ Unbounded cognitive load
- ❌ Forced escalation (no soft divergence)
- ❌ Immediate execution (no cooling)

**Enforcement**: `LINT-EXIT-001`, `LINT-EXIT-002`, `LINT-PAUSE-001`, `LINT-MINORITY-001`, `LINT-DISAGREE-001`, `LINT-TIME-001`, `LINT-ROBIN-001`, `LINT-LOAD-001`

---

## 🔐 ENFORCEMENT MECHANISM

**Lint Pipeline**:

```yaml
enforcement:
  pre_commit: "Run lint rules on changed files"
  pre_push: "Run lint rules on all files"
  pr_check: "Run lint rules, block merge if violations"
  deploy_gate: "Run lint rules, BLOCK_DEPLOY if violations"
```

**Severity**:

```yaml
BLOCK_DEPLOY:
  action: "CI/CD pipeline fails, deployment blocked"
  override: "Requires governance approval + justification commit"
  
  violations_count: 27
  all_canonical_rules: "BLOCK_DEPLOY by default"
```

**No Soft Governance**:

There is **NO** "ignore this rule" flag.  
There is **NO** "we'll fix it later" escape hatch.  
There is **NO** manual override without governance commit.

**Canonical = Machine-Enforced**

---

## 📋 WHAT THIS MEANS OPERATIONALLY

### **For Implementers (Canon)**:

From commit `bdd8fe5` forward:

**You CANNOT**:
- ❌ Build a spreadsheet that doesn't emit commits
- ❌ Skip three-way match verification
- ❌ Grant permanent authority
- ❌ Treat drift as warnings
- ❌ Hide refusal reasons
- ❌ Bypass SAC for 2D integrations
- ❌ Allow learning to mutate policy
- ❌ Deploy with lint violations

**You MUST**:
- ✅ Follow `RELAY-FILAMENT-SPREADSHEET-SPEC.md`
- ✅ Enforce `RELAY-ENFORCEMENT-CONTRACTS.md`
- ✅ Pass all 27 lint rules
- ✅ Use render packet schema
- ✅ Implement human flow control v2

**Enforcement**: `relay-lint` runs in CI/CD, **BLOCKS** non-conforming code.

---

### **For Integrators (SAP, CSV, External Systems)**:

**Before you can anchor state**:
1. Create State Anchoring Contract (SAC)
2. Declare `anchored_state_types`
3. Set retention + redaction policies
4. Get authority (expires in 30d max)

**When importing spreadsheet data**:
1. Each row → one commit
2. Each cell → ERI score
3. Formulas → projections (three-way match)
4. Evidence attached (quotes, emails, approvals)

**After truth cutover**:
- Relay is authoritative
- 2D system becomes projection only
- 2D writes **REFUSED** (automatic)

**No exceptions. No bypass. No "we'll migrate later."**

---

### **For Users (Budget Owners, Procurement, Finance)**:

**What changed**:

From this commit forward, spreadsheets are **filaments**.

**What that means**:

- Every edit is tracked (commit chain)
- You can see who changed what, when, why
- Formulas verify themselves (three-way match)
- Bad data shows up as ERI score
- Authority expires (you must renew or rotate)
- You can fork for "what-if" scenarios
- Nothing is hidden (evidence required)

**What you CANNOT do anymore**:

- ❌ Silent edits (every change is a commit)
- ❌ Permanent ownership (authority expires)
- ❌ Undocumented overrides (evidence required)
- ❌ "Trust me" data (ERI must be high)

**This is not optional. This is physics.**

---

## 🚀 LAUNCH STATUS

**Filament Spreadsheet Model**: **CANONICAL** (2026-02-04)

**Implementation Status**: Stage 2 (Post-Stage-1)  
**Code Status**: Specification complete, runtime pending  
**Lint Status**: 27 rules defined, enforcement ready  
**Integration Status**: SAP cutover path defined

**Can you use it today?**

**YES** - as a design constraint, integration filter, and governance weapon.

**Can you deploy non-conforming spreadsheets?**

**NO** - `relay-lint` will block deployment.

**Can you bypass the rules?**

**NO** - requires governance approval + justification commit.

---

## 🔒 CANONICAL BOUNDARY (LOCKED)

As of commit `bdd8fe5`, **spreadsheets are a first-class Relay filament model**.

Any spreadsheet-like implementation that does not:
- Emit commits
- Calculate ERI
- Enforce authority decay
- Pass enforcement contracts

…is **non-canonical** and **MUST fail `relay-lint`**.

**This threshold has been crossed.**

**No rollback. No exceptions. No soft governance.**

---

## 📚 CANONICAL SPECS (GOLD STANDARD)

**Read these in order**:

1. `CANON-START-HERE.md` → Onboarding
2. `RELAY-ENFORCEMENT-CONTRACTS.md` → 9 mechanisms
3. `RELAY-FILAMENT-SPREADSHEET-SPEC.md` → Spreadsheet model
4. `FILAMENT-SPREADSHEET-ENFORCEMENT-INTEGRATION.md` → How they integrate
5. `relay-lint-defense.json` → 27 rules (machine-readable)

**For Implementation**:

6. `CANON-RELAY-CORE-IMPLEMENTATION.md` → Backend/frontend
7. `RELAY-RENDER-PACKET-SCHEMA.md` → Interface contract
8. `RELAY-HUMAN-FLOW-CONTROL-V2.md` → Participation primitives
9. `RELAY-CONTROL-SYSTEMS-PROOF.md` → ERI, gradients, three-way match
10. `CANON-IMPLEMENTATION-CHECKLIST.md` → Step-by-step

---

## ✅ VERIFICATION

**To verify canonical compliance**:

```bash
# Run lint rules
relay-lint check --all

# Expected output if canonical:
✅ LINT-SAC-001: PASS
✅ LINT-DRIFT-001: PASS
✅ LINT-AUTH-001: PASS
✅ LINT-LEARN-001: PASS
✅ LINT-UX-001: PASS
... (27 rules)

Total: 27/27 PASS
Status: CANONICAL ✅
```

**If any rule fails**:

```bash
❌ LINT-AUTH-001: FAIL
   Authority found without expires_at
   File: src/roles/procurement.mjs:45
   Remedy: Add expires_at field (max 30d)
   
Status: NON-CANONICAL ❌
Deployment: BLOCKED
```

---

## 🎯 FINAL STATEMENT

**From commit `bdd8fe5` forward**:

A spreadsheet is either a **filament**, or it is a **liability**.

A 2D integration is either **anchored**, or it is **refused**.

An authority is either **time-bounded**, or it **does not exist**.

A drift is either **resolved**, or it **blocks finalization**.

**This is not philosophy. This is canon. This is law.**

---

**END OF CANONICAL DECLARATION**

**Status**: ✅ SEALED  
**Date**: 2026-02-04  
**Commit**: bdd8fe5  
**Authority**: Model Canonicalization Complete (All 4 Conditions Met)

**Filament Spreadsheet Model: LIVE. CANONICAL. ENFORCEABLE.** 🔒🌳✨
