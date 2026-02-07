# 🔧 CANON — RELAY CORE IMPLEMENTATION DIRECTIVE

**Date**: 2026-02-02  
**Status**: AUTHORITATIVE BUILD SPEC  
**Scope**: Relay-Native Business Logic ONLY  
**Stage**: Stage 1 (3D Coordination Adoption)

---

## ⚠️ SCOPE BOUNDARY (CRITICAL)

### **What Canon IS Building**
- ✅ Relay's coordination logic
- ✅ Relay's enforcement primitives
- ✅ Relay's object models
- ✅ Relay's stage-gate physics

### **What Canon IS NOT Building Yet**
- ❌ SAP modules or adapters
- ❌ SharePoint integrations
- ❌ External system APIs
- ❌ Data ingestion pipelines

**External systems are treated as opaque anchors for now.**

**Relay must prove it can coordinate BEFORE it integrates.**

---

## 🏗️ PART 1: STAGE-GATE ARCHITECTURE

### **Two Orthogonal Gate Systems (MANDATORY)**

#### **A) Individual Stage Gates (ISG)**

**Purpose**: Learning, preparation, simulation  
**Authority**: NONE

**What Individuals CAN Do**:
- ✅ Unlock training packs
- ✅ Explore simulations
- ✅ Study future-stage concepts
- ✅ Generate recommendations

**What Individuals CANNOT Do**:
- ❌ Execute future-stage actions
- ❌ Mutate policy
- ❌ Claim authority from learning

**Implementation**:
```yaml
individual_stage_filament:
  user_id: user-12345
  current_stage: 2
  completed_training:
    - stage-1-intro
    - stage-1-three-way-match
    - stage-2-preview (simulation only)
  
  unlocked_capabilities:
    - view_stage_2_concepts (read-only)
    - run_stage_2_simulations (no real effect)
  
  blocked_capabilities:
    - execute_stage_2_actions (requires global stage activation)
```

**ISG state is non-authoritative by definition.**

---

#### **B) Global Stage Gates (GSG)**

**Purpose**: What the system is allowed to do  
**Authority**: CANONICAL

**Initial Global Stages** (Initial Canon):

##### **🌍 Global Stage 1 — 3D Coordination Adoption (ACTIVE)**

**Relay operates as**:
- Coordination engine
- Audit & reconciliation system
- Refusal-enforcing layer
- Learning + simulation environment

**Allowed Actions**:
- ✅ Three-way match
- ✅ Evidence anchoring
- ✅ Authority tracking
- ✅ Refusal mechanics
- ✅ Dashboards and drill-down

**Forbidden Actions**:
- ❌ New economic incentives
- ❌ Value issuance
- ❌ Enforcement beyond coordination

---

##### **🌧️ Global Stage 2 — Incentive / Rain Economy (DEFINED, INACTIVE)**

**Status**:
- Exists as initial configuration, not destiny
- Fully documented, but not executable

**Can be** (via governance):
- ✅ Activated
- ✅ Replaced
- ✅ Skipped
- ✅ Forked

**Implementation**:
```yaml
global_stage_2:
  name: "Incentive Economy"
  status: DEFINED_INACTIVE
  visible: true (read-only, labeled "NOT ACTIVE")
  executable: false
  
  activation_requires:
    - authorityRef: council-vote-2026-001
    - quorum: 75%
    - stage_transition_commit: STAGE_ACTIVATED
  
  can_be_replaced: true
  fork_allowed: true
```

---

##### **🔒 Global Stage 3 — Declared, Undefined**

**Status**:
- Stage exists structurally
- Content intentionally undefined
- Governance hooks implemented now
- Rules defined later by canon process

**Implementation**:
```yaml
global_stage_3:
  name: "Future Coordination Model"
  status: DECLARED_UNDEFINED
  visible: true (as placeholder)
  
  governance_hooks:
    - proposal_mechanism: implemented
    - voting_mechanism: implemented
    - activation_mechanism: implemented
  
  content: null (to be defined by canon)
```

---

### **Hard Rule (Lock This)**

> **"Individuals may advance in understanding at any time.  
> The system advances only by global canon."**

**Any violation → refusal.**

**Implementation**:
```yaml
execution_gate_check:
  user_action: "execute_stage_2_incentive"
  user_individual_stage: 2 (ready)
  system_global_stage: 1 (active)
  
  result: REFUSED
  reason: "Requires Global Stage 2 (not active)"
  next_step: "Participate in governance to activate Stage 2, or continue Stage 1 activities"
```

---

## 📋 PART 2: BUSINESS BEST PRACTICES (RELAY-NATIVE PATTERN)

### **Purpose**
Implement a generic Relay pattern that works for:
- Procurement
- Approvals
- Compliance
- Contracts
- Quality control
- Change management
- ANY business workflow

**WITHOUT integrating external systems yet.**

---

### **The Relay Business Pattern (Reusable)**

Every business workflow in Relay is modeled as:

#### **A) Three-Way Match**

**Intent** → Policy, rule, SOP (declared)  
**Projection** → Claims, dashboards, UI state  
**Reality** → Evidence objects  

**Mismatch = Drift**

**Implementation**:
```yaml
three_way_match_object:
  workflow_id: procurement-po-12345
  
  intent:
    policy_ref: "procurement-policy-v2.1"
    rule: "3 competitive quotes required for spend >$5k"
    threshold: 5000
    site: "Maxwell"
  
  projection:
    claim: "Vendor selected via competitive process"
    dashboard_status: "Compliant"
    user_attestation: "john.doe@company.com"
  
  reality:
    evidence_pack_ref: "EP-2026-0123"
    quote_count: 3
    quotes_verified: true
    merkle_root: "a7f8d9e3..."
  
  match_status:
    aligned: true
    divergence: 0
    pressure: 0
```

---

#### **B) Evidence Objects (Relay-Native)**

**Canon must implement first-class Evidence Pack object:**

**Properties**:
- ✅ Immutable
- ✅ Timestamped
- ✅ Authority-linked
- ✅ Scope-bound
- ✅ Attachable to decisions

**Implementation**:
```yaml
evidence_pack_schema:
  pack_id: unique identifier
  pack_type: [quote_pack, approval_pack, quality_pack, etc.]
  
  scope:
    workflow_id: procurement-po-12345
    site: Maxwell
    category: MRO
  
  evidence_items:
    - item_id: evidence-001
      item_type: quote_document
      storage_ref: "opaque://external-system/doc-123" (location is external)
      merkle_hash: "d4e8f9a1..."
      timestamp: 2026-02-02T10:30:00Z
    
    - item_id: evidence-002
      item_type: approval_record
      storage_ref: "opaque://email-system/msg-456"
      merkle_hash: "b3c7d2f4..."
      timestamp: 2026-02-02T11:15:00Z
  
  decision:
    outcome: "Vendor X selected"
    rationale: "Lowest qualified bid"
    approver_authority_ref: auth-2026-001
    approval_timestamp: 2026-02-02T12:00:00Z
  
  merkle_root: "combined hash of all evidence items"
  
  attestation:
    created_by: john.doe@company.com
    created_at: 2026-02-02T10:00:00Z
    verified_by: jane.smith@company.com
    verified_at: 2026-02-02T13:00:00Z
```

**Evidence Packs**:
- ❌ Do NOT assume where files live
- ✅ Only care that evidence exists and is referenced
- ✅ Treat storage location as opaque (`opaque://...`)

**Relay coordinates relationships, not storage.**

---

#### **C) Policy Tables (Relay-Native)**

**Canon must implement policy tables as DATA, not CODE.**

**Policy tables define**:
- Thresholds
- Required evidence
- Authority scopes
- Exception rules
- Expiry rules

**Policy tables are**:
- ✅ Versioned
- ✅ Replaceable
- ✅ Governed by canon

**Implementation**:
```yaml
policy_table_schema:
  policy_id: procurement-policy-v2.1
  version: 2.1
  effective_date: 2026-01-01
  expires_at: 2027-01-01
  
  rules:
    - rule_id: maxwell-mro-threshold
      site: Maxwell
      category: MRO
      threshold_amount: 5000
      threshold_unit: USD
      
      required_evidence:
        - type: competitive_quotes
          minimum_count: 3
        
      required_authority:
        - role: site_manager
        - authority_scope: approval_under_50k
      
      exceptions:
        - condition: emergency_repair
          required_authority: site_manager
          post_approval_review: true (within 48 hours)
    
    - rule_id: india-mro-annual
      site: India
      category: MRO
      threshold_amount: 50000
      threshold_unit: USD
      threshold_period: annual
      
      required_evidence:
        - type: annual_competitive_bid
      
      accumulation_tracking: true
  
  governance:
    created_by_authority: council-vote-2025-012
    can_be_replaced: true
    replacement_requires: council-vote (quorum 60%)
```

**Policy lookup**:
```javascript
function getPolicyForWorkflow(site, category, amount) {
  const policy = policyTable.getCurrentVersion();
  const applicableRules = policy.rules.filter(r => 
    r.site === site && 
    r.category === category && 
    amount >= r.threshold_amount
  );
  return applicableRules;
}
```

---

#### **D) Accumulation as Filament**

**Canon must implement accumulation tracking as a core Relay primitive.**

**Why this matters**:
- Gradual violations (small actions adding up) are invisible to humans
- $3k purchase + $3k purchase + ... = $60k/year (should have triggered annual bid)
- Most systems fail here

**Relay tracks as filament.**

**Implementation**:
```yaml
accumulation_filament:
  accumulation_id: vendor-12345-maxwell-mro-2026
  
  scope:
    vendor_id: vendor-12345
    site: Maxwell
    category: MRO
    fiscal_year: 2026
  
  policy_ref: procurement-policy-v2.1
  threshold: 50000 (annual review required)
  
  commits:
    - po: 4500001
      amount: 3200
      date: 2026-01-15
      evidence_pack: EP-2026-0001
    
    - po: 4500045
      amount: 2800
      date: 2026-02-03
      evidence_pack: EP-2026-0045
    
    - po: 4500089
      amount: 3500
      date: 2026-03-10
      evidence_pack: EP-2026-0089
    
    # ... continues
  
  running_total: 62400
  threshold_status: EXCEEDED (by 12400)
  
  pressure: 18 (divergence accumulating)
  
  required_action:
    action: "Annual competitive bid cycle"
    authority_required: procurement_manager
    deadline: 2026-04-01
```

**Accumulation violations trigger**:
- ✅ Drift objects
- ✅ Refusals (next PO to same vendor blocked)
- ✅ Required remediation

**This is one of Relay's key advantages over 2D systems.**

---

#### **E) Refusal as Default UX**

**Canon must enforce: Actions disabled by default.**

**Actions enabled ONLY when**:
- ✅ authorityRef present (and not expired)
- ✅ Required evidence attached
- ✅ Policy satisfied
- ✅ Global stage allows it

**Refusals must**:
- ✅ Explain what's missing
- ✅ Show next legitimate actions
- ✅ Be auditable objects

**Implementation**:
```yaml
action_gate_check:
  user_action: "close_po_12345"
  
  checks:
    - check: authority_present
      result: PASS
      authority_ref: auth-2026-001
      expires_at: 2026-12-31 (valid)
    
    - check: evidence_attached
      result: FAIL
      required: evidence_pack (competitive quotes)
      actual: null
    
    - check: policy_satisfied
      result: FAIL (blocked by evidence_attached failure)
    
    - check: global_stage_allows
      result: PASS (Stage 1 allows procurement coordination)
  
  overall_result: REFUSED
  
  refusal_object:
    refusal_id: refusal-2026-0234
    action_attempted: close_po_12345
    timestamp: 2026-02-02T14:30:00Z
    
    reason: "Cannot close PO 12345"
    missing:
      - "Evidence Pack (competitive quotes)"
    
    next_steps:
      - "Create Evidence Pack with 3 competitive quotes"
      - "Link Evidence Pack to PO via evidence_pack_ref field"
      - "Retry closure after evidence attached"
    
    policy_citation: "procurement-policy-v2.1, rule maxwell-mro-threshold"
    
    auditable: true
```

**UI Rendering**:
```javascript
// Button renders disabled
<button disabled={!actionGate.passed}>
  Close PO
</button>

// Tooltip shows refusal
<tooltip>
  ❌ Cannot close PO 12345
  
  Missing:
  • Evidence Pack (competitive quotes)
  
  Next steps:
  1. Create Evidence Pack with 3 competitive quotes
  2. Link Evidence Pack to PO
  3. Retry closure
  
  Policy: procurement-policy-v2.1
</tooltip>
```

---

## 🔒 PART 3: ENFORCEMENT MECHANISMS

### **These are Relay core, not optional.**

#### **0. System Mode (SIMULATION vs LIVE)** ⚠️ **CRITICAL**

**All Relay instances operate in one of two modes:**

**Implementation**:
```yaml
system_mode:
  current_mode: SIMULATION
  allowed_modes:
    - SIMULATION
    - LIVE
  
  mode_rules:
    SIMULATION:
      description: "Read-only exploration, education, demos, testing"
      eri_computation: enabled
      gradient_computation: enabled
      repair_proposals: enabled
      commits: BLOCKED
      state_mutation: BLOCKED
      ui_banner: "⚠️ SIMULATION MODE (read-only)"
      all_actions_result_in: refusal with "Cannot execute in SIMULATION mode"
    
    LIVE:
      description: "Production coordination with gated commits"
      eri_computation: enabled
      gradient_computation: enabled
      repair_proposals: enabled
      commits: gated (requires authorityRef + constraints satisfied)
      state_mutation: gated (same)
      ui_banner: "🟢 LIVE MODE"
      refusals: enforced (gate failures = refusal)
  
  mode_transition:
    requires:
      - authority_ref: required
      - justification: required
      - recorded_as_commit: true
    
    transition_log:
      - timestamp: 2026-02-03T10:00:00Z
        from: SIMULATION
        to: LIVE
        authority: council-vote-2026-010
        reason: "Stage 1 validation complete, enabling live coordination"
```

**Enforcement**:
- ✅ **Backend MUST check `system_mode` before EVERY state-changing action**
- ✅ **SIMULATION mode blocks ALL commits** (no exceptions)
- ✅ **LIVE mode gates commits** (authorityRef + constraints required)
- ✅ **Render packets include `system_mode`** (frontend shows banner)
- ✅ **Lint rule**: `LINT-MODE-CHECK` (every state mutation must check mode first)

**Purpose**:
- **Education**: Safe exploration without consequences
- **Demos**: Show coordination physics without modifying state
- **Testing**: Verify logic without side effects
- **Stage 1 Proving**: Test coordination physics safely before go-live

**Hard Rule**:
> **"SIMULATION mode is not 'test mode with loose gates.' It is 'read-only physics preview with NO commits ever.'"**

**Example Refusal** (in SIMULATION mode):
```yaml
refusal:
  action: "COMMIT_PROCUREMENT_DECISION"
  reason: "System is in SIMULATION mode"
  explanation: "Cannot execute commits in SIMULATION mode. This is a read-only environment for education and testing."
  next_steps:
    - "Review repair proposal in simulation"
    - "Request mode transition to LIVE (requires authority)"
    - "Or: continue exploring in SIMULATION mode"
  system_mode: SIMULATION
```

**Validation**:
- [ ] Every commit function checks `system_mode` before executing
- [ ] SIMULATION mode returns refusal for all state-changing actions
- [ ] LIVE mode enforces gates (authorityRef, stage, budget, load)
- [ ] UI shows clear mode banner at all times
- [ ] Mode transitions are logged as commits

---

#### **1. State Anchoring Contracts**

**Replace "capture" language everywhere.**

**Implementation**:
```yaml
state_anchoring_contract:
  contract_id: SAC-procurement-2026
  
  anchored_system: "external-procurement-system" (opaque)
  
  anchored_state_types:
    - purchase_orders
    - purchase_requisitions
    - approvals
  
  attestation_frequency: per_transaction
  
  retention_policy: 7_years (regulatory requirement)
  
  redaction_policy:
    - PII: redact_after_3_years
    - financial: retain_full
  
  authority_ref: council-vote-2026-001
  
  can_be_revoked: true (requires same authority level)
```

**Enforcement**:
- ❌ Any telemetry WITHOUT matching contract → HARD REFUSAL
- ✅ Lint rule: `NO_TELEMETRY_WITHOUT_CONTRACT`

---

#### **2. Drift Objects**

**Drift must be first-class object, not just warning.**

**Implementation**:
```yaml
drift_object:
  drift_id: drift-2026-0123
  
  source: cache_layer
  truth_ref: filament-procurement-po-12345
  
  first_seen: 2026-02-02T10:00:00Z
  last_updated: 2026-02-02T14:30:00Z
  
  divergence:
    cache_value: "PO status = closed"
    truth_value: "PO status = pending evidence"
    delta: "Cache ahead of truth"
  
  impact_scope:
    - dashboard_ui (showing wrong status)
    - report_exports (including unverified closures)
  
  confidence: 95% (high confidence this is real drift)
  
  pressure: 12
  
  status: OPEN
  
  blocks:
    - finalization_of_po_12345
    - dashboard_export
  
  resolution_options:
    - repair: "Invalidate cache, rebuild from truth"
    - dismiss: "Accept drift (requires authority + justification)"
```

**Enforcement**:
- ✅ Drift blocks finalization
- ✅ Drift consumes capacity
- ✅ Drift must be closed (cannot be ignored)
- ✅ HUD shows drift as blocking issue

---

#### **3. Authority Decay**

**All authority expires. No exceptions.**

**Implementation**:
```yaml
authority_object:
  authority_id: auth-2026-001
  
  granted_to: john.doe@company.com
  granted_by_ref: council-vote-2025-045
  
  scope:
    - approve_procurement_under_50k
    - site: Maxwell
  
  issued_at: 2026-01-01T00:00:00Z
  expires_at: 2026-12-31T23:59:59Z (max 1 year)
  
  renewal_policy:
    - requires: new_vote
    - justification: "Performance review + continued need"
  
  status: ACTIVE
  days_remaining: 333
```

**Enforcement**:
- ✅ Invariant: `AUTHORITY_DECAY_MANDATORY`
- ✅ No "permanent" delegation allowed
- ✅ Renewal = new commit + justification
- ✅ Lint rule: `LINT-AUTH-DECAY`

**HUD Warning**:
```
⚠️ Authority expires in 30 days
  Authority: approve_procurement_under_50k
  Holder: john.doe@company.com
  Expires: 2026-12-31
  Action required: Renew or reassign
```

---

#### **4. Learning Boundary (Type Enforcement)**

**Learning cannot mutate policy. Period.**

**Implementation**:
```yaml
commit_type_enforcement:
  allowed_learning_outputs:
    - POLICY_RECOMMENDATION
    - RISK_ASSESSMENT
    - STAGE_READINESS_REPORT
  
  forbidden_learning_outputs:
    - POLICY_APPLIED
    - AUTHORITY_GRANTED
    - STAGE_ACTIVATED
  
  policy_mutation_requires:
    - commit_type: POLICY_APPLIED
    - authority_ref: required
    - quorum: (if configured)
    - version_bump: required
```

**Enforcement**:
- ✅ Separate commit types by schema
- ✅ Learning modules CANNOT emit `POLICY_APPLIED`
- ✅ Lint rule: `NO_POLICY_MUTATION_FROM_LEARNING`

**Example refusal**:
```yaml
refusal:
  attempted_action: "Learning module tried to emit POLICY_APPLIED"
  reason: "Learning boundary violation"
  blocked: true
  explanation: "Learning can recommend, humans must apply"
```

---

#### **5. Pressure Budgets (Hierarchical)**

**Prevent audit storms and weaponization.**

**Implementation**:
```yaml
pressure_budget_hierarchy:
  global:
    max_concurrent_audits: 100
    max_disputes_per_hour: 20
    cooldown_after_refusal: 60_seconds
  
  org:
    max_concurrent_audits: 50
    max_disputes_per_hour: 10
  
  team:
    max_concurrent_audits: 10
    max_disputes_per_hour: 5
  
  system:
    max_concurrent_audits: 5
  
  object:
    max_audits_per_object: 1 (one at a time)
```

**Enforcement**:
- ✅ Pressure budget violation → REFUSAL (not slowdown)
- ✅ HUD shows: "Capacity: 72% (18 pressure remaining)"
- ✅ Cooldowns prevent spam

**Example refusal**:
```yaml
refusal:
  attempted_action: "Initiate audit of PO-12345"
  reason: "Team pressure budget exhausted"
  current_pressure: 10 (limit: 10)
  next_available: 2026-02-02T15:00:00Z (cooldown expires)
```

---

#### **6. Stage Enforcement**

**No execution beyond active global stage.**

**Implementation**:
```yaml
stage_enforcement_check:
  action: "issue_rain_credits"
  requires_stage: 2
  current_global_stage: 1
  
  result: REFUSED
  reason: "Requires Global Stage 2 (not active)"
  
  lint_rule: NO_ACTION_BEYOND_GLOBAL_STAGE
```

**Enforcement**:
- ✅ Every action tagged with `requires_stage`
- ✅ Pre-check: `current_global_stage >= action.requires_stage`
- ✅ Failure → refusal
- ✅ No dual-stage authority (no "preview mode" with real effects)

---

## 📦 PART 4: CANON'S BUILD CHECKLIST

### **Relay-Only Implementation (NO External Systems)**

#### **Phase 1: Stage-Gate Infrastructure**
- [ ] Individual stage filaments (`stage.individual.<userId>`)
- [ ] Global stage filament (`stage.global`)
- [ ] Commit types: `STAGE_PROPOSAL`, `STAGE_VOTE`, `STAGE_ACTIVATED`, `STAGE_DEPRECATED`
- [ ] Stage 1 hardcoded as ACTIVE
- [ ] Stage 2 defined as INACTIVE (visible, not executable)
- [ ] Stage 3 declared as UNDEFINED (governance hooks in place)
- [ ] Execution gate: Check stage before allowing action
- [ ] Refusal: "Requires Stage X (not active)"
- [ ] Lint rule: `NO_ACTION_BEYOND_GLOBAL_STAGE`

#### **Phase 2: Business Pattern Objects**
- [ ] Three-Way Match object model
- [ ] Evidence Pack object model (generic, storage-agnostic)
- [ ] Policy Table object model (versioned, replaceable)
- [ ] Accumulation Filament object model
- [ ] Refusal object model

#### **Phase 3: Enforcement Primitives**
- [ ] State Anchoring Contract schema
- [ ] Drift Object schema + closure workflow
- [ ] Authority Object schema with decay enforcement
- [ ] Commit type separation (recommendation vs applied)
- [ ] Pressure Budget hierarchy
- [ ] Stage Enforcement gates

#### **Phase 4: Refusal-First UX**
- [ ] All actions disabled by default
- [ ] Gate checks: authority + evidence + policy + stage
- [ ] Refusal tooltips with explanation + next steps
- [ ] Refusal objects stored as auditable events

#### **Phase 5: Lint Rules**
- [ ] `NO_TELEMETRY_WITHOUT_CONTRACT`
- [ ] `LINT-AUTH-DECAY`
- [ ] `NO_POLICY_MUTATION_FROM_LEARNING`
- [ ] `NO_ACTION_BEYOND_GLOBAL_STAGE`
- [ ] `NO_DUAL_STAGE_AUTHORITY`

#### **Phase 6: Dashboard (Relay-Native)**
- [ ] Global view: All workflows, all sites
- [ ] Drill-down: Site → Category → Workflow → Evidence
- [ ] Divergence heatmap: Show Δ(PR) across all workflows
- [ ] Pressure view: Show current capacity consumption
- [ ] Drift view: Show open drift objects
- [ ] Filament replay: Show audit trail for any object

---

## ✅ SUCCESS CRITERIA

**Stage 1 is complete when Relay can demonstrate**:

1. ✅ Business rules are mechanically enforceable (refusal works)
2. ✅ Missing evidence causes immediate refusal (not warning)
3. ✅ Accumulation is caught early (gradual violations visible)
4. ✅ Authority is visible and expires (no permanent delegation)
5. ✅ Drift cannot be hidden (blocks finalization)
6. ✅ Users understand why things are blocked (refusal messages clear)
7. ✅ Individual learning does not grant system authority
8. ✅ Global stage gates execution (no premature Stage 2 activation)

**If this works for one workflow, it works for all.**

---

## 🚫 WHAT CANON MUST NOT BUILD YET

**Explicitly out of scope**:

- ❌ SAP custom fields or modules
- ❌ SharePoint folder conventions or APIs
- ❌ Email ingestion pipelines
- ❌ External system adapters
- ❌ Data transformation layers

**Relay must prove coordination physics FIRST.**

**Integration comes AFTER core is solid.**

---

## 🔒 FINAL LOCK SENTENCE

> **"Relay adopts business best practices not by inventing new rules,  
> but by making existing rules impossible to ignore."**

**This is the correct implementation focus.** ✅

---

## 📋 TESTING REQUIREMENTS

### **Stage-Gate Tests**
- [ ] Individual advances to Stage 2 (learning) but cannot execute Stage 2 actions
- [ ] Global Stage 1 blocks Stage 2 actions with clear refusal
- [ ] Stage 2 activation requires explicit governance commit
- [ ] Stage definitions can be replaced via governance vote

### **Business Pattern Tests**
- [ ] Evidence Pack required for workflow completion
- [ ] Missing evidence triggers refusal (not warning)
- [ ] Policy table lookup works for site/category/threshold
- [ ] Accumulation filament tracks running totals
- [ ] Threshold exceeded triggers drift + refusal

### **Enforcement Tests**
- [ ] Telemetry without anchoring contract → refusal
- [ ] Drift object blocks finalization until closed
- [ ] Expired authority cannot approve → refusal
- [ ] Learning recommendation does not mutate policy
- [ ] Pressure budget exhaustion → refusal

### **Refusal UX Tests**
- [ ] Disabled action shows tooltip with explanation
- [ ] Refusal message includes: reason + missing + next steps + policy citation
- [ ] Refusal objects are stored and auditable

---

## 🎯 IMMEDIATE NEXT STEPS

**Canon should start** (in order):

1. **Week 1-2**: Stage-gate infrastructure (individual + global filaments)
2. **Week 2-3**: Evidence Pack + Policy Table object models
3. **Week 3-4**: Accumulation filament implementation
4. **Week 4-5**: Drift object + closure workflow
5. **Week 5-6**: Authority decay enforcement
6. **Week 6-7**: Refusal-first UX + gate checks
7. **Week 7-8**: Dashboard (Relay-native views)
8. **Week 8-10**: Lint rules + enforcement tests
9. **Week 10-12**: Integration testing + bug fixes
10. **Week 12**: **STAGE 1 COMPLETE** 🚀

---

**No integrations. No adapters. No shortcuts.**

**Relay core first. Everything else follows.** 🔒
