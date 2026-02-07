# MINIMUM CANON
**Smallest Safe Configuration to Run**

---

## **PURPOSE:**
This document defines the **minimum viable configuration** for Relay to function safely.

Everything else in `ROOT-CAPABILITY-MATRIX.md` exists but is **disabled by default** until governance enables it.

**This is the kernel. Everything else is a setting.**

---

## **PRINCIPLE: MINIMAL HARM, MAXIMAL CHOICE**

> "Relay must not impose more coordination than necessary to remain coherent."

The Minimum Canon:
- Enables only what is **structurally required** to function
- Leaves all **policy decisions** to governance
- Prevents **hidden authority** and **ambient surveillance**
- Allows **incremental adoption** without forcing worldview change

---

## **1. TRUTH SUBSTRATE** ✅ **ENABLED (CORE)**

### **Append-Only Commit Log**
```yaml
enabled:
  - filament_identity: all commits have (id, index, parents)
  - fork_semantics: branching allowed
  - merge_semantics: reconciliation with scars
  - evidence_attachment: content-addressed refs
  - replay_guarantee: any commit replayable

disabled:
  - (none - this is kernel)
```

**Why:** Without this, there is no Relay. This is physics.

**Constraints:**
- No erasure (commits permanent)
- No hidden branches (all forks visible)
- No retroactive editing (history immutable)

---

## **2. THREE-WAY MATCH** ✅ **ENABLED (NARROW SCOPE)**

### **Intent ↔ Reality ↔ Projection**
```yaml
enabled:
  - three_way_compare: basic diff + mismatch detection
  - drift_object_creation: blocking on mismatch
  - confidence_scoring: per-commit (basic)

scope:
  - start_narrow: one domain (e.g., procurement or one spreadsheet)
  - expand_later: governance adds domains

disabled:
  - wide_domain_matching: not enabled by default
  - cross_domain_propagation: requires explicit policy
```

**Why:** This defines truth model, but we start **narrow** to avoid overwhelming users.

**Example Starting Domain:**
- Single spreadsheet filament (vendor quotes)
- Intent: budget policy
- Reality: cell edits
- Projection: UI grid view
- Drift: formula mismatch → blocks finalization

**Expansion Rule:**
Once users understand one domain, governance votes to add more.

---

## **3. PRESSURE SYSTEM** ✅ **ENABLED (HUMAN-SCALE RATE)**

### **Continuous Verification Loop (Low Frequency)**
```yaml
enabled:
  - pressure_loop: attest → compare → score → stage → verify → checkpoint
  - pressure_budget: capacity-aware refusal
  - confidence_floor: indeterminate states block (no false safe)
  - refusal_first_UX: STOP before error

default_settings:
  - audit_frequency: weekly (not continuous)
  - pressure_budget: conservative (refuses overload early)
  - backlog_limit: 50 open drifts per basin
  - cooldown_window: 48 hours between major audits

disabled:
  - high_frequency_audits: not enabled by default
  - automated_repair: recommendations only
  - cross_basin_audits: requires explicit policy
```

**Why:** Pressure prevents drift, but at **human scale** to avoid stress.

**Key Invariant:**
Pressure loop can **alert and refuse**, but **cannot auto-fix**. Humans remain in control.

**Escalation Path:**
If drift accumulates, system **refuses more actions** (not forces fixes). This is safety.

---

## **4. AUTHORITY & CONSENT** ✅ **ENABLED (REQUIRED FOR ALL ACTIONS)**

### **Scoped, Expiring Authority**
```yaml
enabled:
  - authorityRef_required: all execution needs authority
  - authority_decay: automatic expiry (mandatory)
  - consent_manager: opt-in for all data collection
  - role_filtered_views: auditor/ops/exec/user

default_settings:
  - authority_expiry: 90 days (auto-renew requires re-justification)
  - delegation_depth: 1 level (no long chains)
  - consent_mode: opt-in (no ambient telemetry)

disabled:
  - permanent_authority: not allowed
  - ambient_membership: requires explicit join
  - hidden_delegation: all chains visible
```

**Why:** No action without authority. No authority without expiry. No data without consent.

**Key Invariant:**
Even founders' authority **expires and must be renewed**. No permanent power.

**Refusal Behavior:**
If authority expired → action refused with message:
```
"Authority expired. Renew with: authorityRef + justification + evidence"
```

---

## **5. PRIVACY & MINIMIZATION** ✅ **ENABLED (AGGREGATED BY DEFAULT)**

### **No Ambient Surveillance**
```yaml
enabled:
  - data_minimization: only collect what's necessary
  - aggregated_telemetry: default (no individual tracking)
  - retention_rules: 30 days for aggregated, 7 days for raw (if opted-in)
  - redaction_rules: automatic erasure after retention

default_settings:
  - telemetry_mode: aggregated (no raw by default)
  - raw_access: opt-in + time-bounded (expires in 7 days)
  - pseudonymization: role-based (auditor sees "User A", not names)

disabled:
  - continuous_individual_tracking: not enabled
  - permanent_raw_storage: not allowed
  - cross_scope_telemetry: requires explicit consent per scope
```

**Why:** Privacy by default. Raw data requires **explicit consent** and **short retention**.

**Key Invariant:**
You cannot "accidentally" collect raw user data. System refuses unless consent recorded.

**Example Telemetry (Aggregated):**
```yaml
procurement_dept:
  commits_this_week: 42
  drifts_open: 3
  eri_avg: 76
  # NO individual user data
```

**Example Telemetry (Raw, Opt-In):**
```yaml
user_id: pseudonym_A7F
action: edited_cell_B5
timestamp: 2026-02-04T10:23:15Z
retention_expires: 2026-02-11T10:23:15Z  # 7 days
consent_ref: consent_commit_abc123
```

---

## **6. GOVERNANCE** ✅ **ENABLED (CONSERVATIVE THRESHOLDS)**

### **Canon Selection + Policy Filaments**
```yaml
enabled:
  - canon_selection: visible, reversible, scoped
  - policy_as_filaments: versioned, no implicit "latest"
  - learning_boundary: POLICY_RECOMMENDATION only (no auto-apply)
  - voting_system: force-lending + canon selection

default_settings:
  - quorum_thresholds:
      - routine_changes: delegated (no vote)
      - policy_shifts: 60% quorum
      - foundational_changes: 80% supermajority
      - multi_scope_changes: 80% in all affected scopes
  
  - vote_decay: 180 days (votes expire)
  - canon_change_frequency: max 1 per week per scope

disabled:
  - rapid_canon_switching: limited by frequency cap
  - policy_auto_mutation: learning cannot change policy
  - hidden_governance: all votes/selections visible
```

**Why:** Governance is enabled but **conservative** to prevent chaos.

**Key Invariant:**
Learning systems can **recommend** policy changes, but **cannot apply** them. Humans vote.

**Canon Selection Example:**
```yaml
scope: procurement
canon_options:
  - branch_A: conservative_budget
  - branch_B: optimistic_budget
current_canon: branch_A
last_change: 2026-01-28T14:00:00Z
next_eligible_change: 2026-02-04T14:00:00Z  # 1 week cooldown
```

---

## **7. WORK ZONES & FISSION-FUSION** ✅ **ENABLED (FORK-REJOIN ALLOWED)**

### **Multi-Basin, Fork-on-Dispute**
```yaml
enabled:
  - work_zones: company → branch → dept → project
  - fork_on_dispute: automatic (low cost, not free)
  - merge_gates: evidence + authority + quorum (if material)
  - timeboxes: live presence contained

default_settings:
  - fork_creation_cost: 1 pressure budget unit
  - fork_intent_required: "What assumption is changing?"
  - merge_evidence_required: yes (no blind merge)

disabled:
  - unlimited_forking: requires pressure budget
  - silent_forking: intent required
  - auto_merge: always requires human approval
```

**Why:** Forking is **normal** (not failure), but **gated** (not free) to prevent spam.

**Key Invariant:**
Every fork requires:
1. **Intent:** "We're testing cost +10% scenario"
2. **Pressure budget:** Forking consumes capacity
3. **Visibility:** All forks shown in tree scaffold

**Fork Lifecycle:**
```
User clicks "Fork" → modal: "What assumption?"
User enters: "Vendor discount 15% instead of 10%"
System: checks pressure budget → creates fork → labels it
Fork visible in tree scaffold → translucent, dashed
Later: user can merge (requires evidence + vote if material)
```

---

## **8. UI/HUD** ✅ **ENABLED (PROJECTION ONLY, NEVER AUTHORITY)**

### **Lens + Command Card**
```yaml
enabled:
  - HUD_modes: OBSERVE / HOLD / PROPOSE / COMMIT / RECONCILE
  - refusal_explainer: always shows why blocked
  - visual_invariants: canon opaque, forks translucent, NOW green
  - navigation: drill-down, outward-explore, branch-section, sheet-volume, tree-scaffold

default_settings:
  - mode: OBSERVE (safest default)
  - labels: verbose (explains everything)
  - refusal_style: explicit (not hidden)

disabled:
  - UI_can_authorize: not possible (projection only)
  - hidden_refusals: always explained
  - silent_UI_actions: all actions require user confirmation
```

**Why:** UI is **never truth**. UI is **always projection**. UI **cannot authorize**.

**Key Invariant:**
Even if UI shows a button, clicking it **may refuse** if:
- Authority missing
- Pressure budget exhausted
- Confidence too low
- Evidence insufficient

**Refusal Example:**
```
User clicks "Edit Cell B5"
System checks:
  - Authority: ✅ (valid)
  - Pressure budget: ❌ (exhausted)
Refusal message:
  "Pressure budget exhausted. Current: 0/50 units.
   Next action available in: 12 hours (cooldown).
   To increase budget: request from dept manager."
```

---

## **9. TRAINING** ✅ **ENABLED (NEW USERS ONLY, OPTIONAL FOR VETERANS)**

### **Stage-Gated, Object-Local**
```yaml
enabled:
  - training_packs: graphics + narrated + interactive
  - object_local_training: hover → tooltip → deep dive
  - stage_gates: individual pacing + group coherence

default_settings:
  - new_user_training: required (stage 1 minimum)
  - veteran_training: optional (can skip)
  - unlock_criteria: understand before use

disabled:
  - forced_training_pace: individual speed allowed
  - training_without_exit: can leave anytime
  - hidden_features: all features visible (but locked until trained)
```

**Why:** Education prevents mistakes, but does **not force worldview change**.

**Key Invariant:**
You can **see** advanced features (they're not hidden), but **cannot use** them until trained.

**Training Stage Example:**
```
Stage 1: Basic (required for new users)
  - What is a filament?
  - What is a commit?
  - What is ERI?
  - What is drift?
  Unlock: basic editing

Stage 2: Governance (optional)
  - What is a fork?
  - What is canon?
  - How to vote?
  Unlock: forking, voting

Stage 3: Advanced (optional)
  - Pressure budgets
  - Reconciliation scars
  - Multi-basin coordination
  Unlock: cross-basin actions
```

---

## **10. SETTINGS MENU** ✅ **ENABLED (MINIMAL DEFAULTS)**

### **All Knobs Visible, Most Off**
```yaml
enabled:
  - settings_as_policy_filaments: all changes tracked
  - categories: governance, pressure, privacy, education
  
default_state:
  - governance: conservative thresholds (as above)
  - pressure: human-scale rate (as above)
  - privacy: aggregated by default (as above)
  - incentives: DISABLED (no economy by default)
  - proximity: DISABLED (no discovery by default)
  - federation: DISABLED (no multi-org by default)

disabled:
  - incentive_systems: opt-in (not enabled)
  - proximity_features: opt-in (not enabled)
  - federation_boundaries: opt-in (not enabled)
  - advanced_audits: opt-in (not enabled)
```

**Why:** Most coordination primitives exist but are **disabled** until governance enables them.

**Key Invariant:**
You can **see** all settings (not hidden), but most are **off by default**.

**Settings Menu View (User Sees):**
```yaml
Governance Settings:
  - Canon change thresholds: 60% (enabled) [EDIT]
  - Vote decay: 180 days (enabled) [EDIT]

Pressure Settings:
  - Audit frequency: weekly (enabled) [EDIT]
  - Pressure budget: 50 units (enabled) [EDIT]

Privacy Settings:
  - Telemetry mode: aggregated (enabled) [EDIT]
  - Retention: 30 days (enabled) [EDIT]

Incentive Settings: 🔒 DISABLED
  - Reward schemas: (not configured) [ENABLE]

Proximity Settings: 🔒 DISABLED
  - Discovery rules: (not configured) [ENABLE]

Federation Settings: 🔒 DISABLED
  - Boundary rules: (not configured) [ENABLE]
```

---

## **WHAT IS NOT ENABLED IN MINIMUM CANON:**

### **1. Incentive Systems**
- No reward schemas
- No economic coordination
- No "rain economy" or similar

**Why:** These are **policy**, not physics. Enable via governance when ready.

**To Enable:** Governance votes on `INCENTIVE_POLICY_V1` filament.

---

### **2. Proximity Features**
- No discovery mechanisms
- No location-based coordination
- No "social graph"

**Why:** Privacy-sensitive. Requires explicit consent and policy.

**To Enable:** Governance votes on `PROXIMITY_POLICY_V1` filament + users opt-in.

---

### **3. Federation Boundaries**
- No multi-organization coordination
- No inter-company canon selection
- No "relay of relays"

**Why:** Complex. Start with single org, expand later.

**To Enable:** Governance votes on `FEDERATION_POLICY_V1` filament.

---

### **4. Advanced Audit Systems**
- No continuous audits (only weekly)
- No automated repair recommendations
- No cross-basin pressure propagation

**Why:** Overwhelming. Start human-scale, increase if needed.

**To Enable:** Governance votes to increase audit frequency.

---

### **5. "Society Laws"**
- No moral rules
- No behavior codes
- No "correct values"

**Why:** Relay governs **coordination**, not **civilization**. Values are policy filaments, user-defined.

**To Enable:** Never. These belong in policy filaments outside Relay kernel.

---

## **MINIMUM CANON LOCK (FINAL SENTENCE):**

> **"The Minimum Canon enables only what is structurally required to function safely. Everything else is a setting, not a constraint."**

---

## **SAFETY GUARANTEES:**

Even in Minimum Canon, these remain **absolute**:
1. ✅ No hidden authority
2. ✅ No ambient surveillance
3. ✅ No permanent power
4. ✅ No policy auto-mutation
5. ✅ No erasure of history
6. ✅ No forced behavior
7. ✅ No hidden settings

---

## **EXPANSION PATH:**

To enable more capabilities:
1. **Understand current state** (training + observation)
2. **Propose policy filament** (versioned)
3. **Gather evidence** (why needed)
4. **Vote** (quorum-based)
5. **Enable** (commit policy filament)
6. **Observe** (pressure feedback)
7. **Revise if needed** (canon is reversible)

---

## **NEXT:**
See `SETTINGS-MENU-FOR-SOCIETY.md` for how to configure beyond Minimum Canon.  
See `ROOT-CAPABILITY-MATRIX.md` for all available capabilities.
