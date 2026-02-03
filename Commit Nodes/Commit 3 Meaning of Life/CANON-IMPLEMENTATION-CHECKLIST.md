# 📋 CANON IMPLEMENTATION CHECKLIST

**Date**: 2026-02-02  
**Recipient**: Canon (Implementation Lead)  
**Context**: Stage 1 Launch Preparation  
**Priority**: Critical Path Items

---

## 🎯 OVERVIEW

You have **three parallel workstreams**:

1. **Stage-Gate Infrastructure** (enables future system evolution)
2. **Procurement/Bidding** (first real-world use case)
3. **Enforcement Mechanisms** (makes Relay safe by default)

**All three must be complete for Stage 1 launch.**

---

## 🏗️ WORKSTREAM 1: STAGE-GATE INFRASTRUCTURE

### **Purpose**
Enable individual learning + global coordination progression without coercion or hidden stages.

### **Tasks**

#### **1.1 Individual Stage-Gate System**
- [ ] Create `stage.individual.<userId>` filament type
- [ ] Define individual stage progression schema
- [ ] Individual stages track: learning completed, simulations passed, competency demonstrated
- [ ] Individual progress **does not grant system authority**
- [ ] Implement: User can see future stages (read-only, labeled "NOT ACTIVE")

#### **1.2 Global Stage-Gate System**
- [ ] Create `stage.global` filament (canonical, singular)
- [ ] Define global stage transition schema
- [ ] Implement commit types:
  - `STAGE_PROPOSAL`
  - `STAGE_VOTE` / `STAGE_APPROVAL`
  - `STAGE_ACTIVATED`
  - `STAGE_DEPRECATED`

#### **1.3 Initial Canon (3 Stages)**
- [ ] **Stage 1: 3D Coordination Transition** (ACTIVE at launch)
  - Intent: Adopt Relay as coordination layer
  - Allowed: Three-way match, evidence anchoring, authority tracking, refusal mechanics
  - Forbidden: Economic incentives, value issuance
  
- [ ] **Stage 2: Rain/Incentive Economy** (DEFINED, INACTIVE at launch)
  - Intent: TBD (will be defined by council before activation)
  - Allowed: Nothing yet (stage not active)
  - Visible: Yes (as future stage, read-only)
  
- [ ] **Stage 3: Future Coordination Model** (PLACEHOLDER)
  - Intent: Undefined
  - Structure: Governance hooks in place, content TBD
  - Visible: Yes (as declared future stage)

#### **1.4 Stage Enforcement**
- [ ] Add execution gate: Check current global stage before allowing action
- [ ] Add refusal: "Blocked: Requires Global Stage X (not active)"
- [ ] Add lint rule: `NO_ACTION_BEYOND_GLOBAL_STAGE`
- [ ] Ensure: Stage definitions are **versioned** (can be replaced/forked)

#### **1.5 Stage Visibility (UI/UX)**
- [ ] HUD shows: "Current Global Stage: Stage 1 (Active)"
- [ ] HUD shows: "Future Stages: Stage 2 (Defined, Locked), Stage 3 (Undefined)"
- [ ] Future-stage actions render **disabled** with tooltip: "Requires Stage 2 activation"
- [ ] Allow users to explore future stages in **simulation mode** (no real effect)

---

## 📦 WORKSTREAM 2: BUSINESS PATTERN (RELAY-NATIVE)

### **Purpose**
Implement generic Relay business coordination pattern (procurement as example, but pattern applies to any workflow).

### **Tasks**

#### **2.1 Evidence Pack Object Model (Generic)**
- [ ] Define Evidence Pack schema (storage-agnostic)
- [ ] Implement Evidence Pack creation workflow
- [ ] Generate Merkle hash for evidence bundles
- [ ] Storage references are OPAQUE (`opaque://external-system/...`)
- [ ] Evidence Pack types: quote_pack, approval_pack, quality_pack, etc.

#### **2.2 Three-Way Match Object Model**
- [ ] Define Three-Way Match schema
- [ ] Intent layer: policy reference
- [ ] Projection layer: user claims
- [ ] Reality layer: evidence pack reference
- [ ] Calculate divergence: Δ(PR)
- [ ] Track pressure when misaligned

#### **2.3 Policy Table (Relay-Native)**
- [ ] Create policy table schema (versioned filament)
- [ ] Columns: Site, Category, Threshold, Required Evidence, Authority Scope
- [ ] Implement policy lookup API: `getPolicyForWorkflow(site, category, params)`
- [ ] Policy changes require authority + commit
- [ ] Seed example data for demonstration

#### **2.4 Workflow Validation (Generic)**
- [ ] Implement pre-check before workflow completion:
  - Check: Evidence Pack exists
  - Check: Evidence count/quality ≥ policy requirement
  - Check: Approver has valid authorityRef
  - Check: All evidence is Merkle-hashed
  - Check: Global stage allows this workflow type

#### **2.5 Refusal Mechanics (Generic)**
- [ ] Generate refusal if:
  - Evidence missing
  - Evidence insufficient (count/quality)
  - Approver authority expired
  - Accumulation threshold exceeded
  - Global stage forbids action
- [ ] Refusal message format:
  ```
  "Cannot [action]
   Reason: [specific failure]
   Missing: [what's required]
   Policy: [cite policy]
   Next step: [how to enable]"
  ```

#### **2.6 Accumulation Tracking (Generic)**
- [ ] Create `accumulation_filament` object model
- [ ] Track running totals per scope (vendor/category/site/year, etc.)
- [ ] Compare to threshold from policy table
- [ ] Generate drift object when threshold exceeded
- [ ] Refusal on next action until remediated
- [ ] Pressure increases as accumulation grows

#### **2.7 Dashboard (Relay-Native)**
- [ ] Global view: All workflows, all sites
- [ ] Drill-down: Site → Category → Workflow → Evidence
- [ ] Show divergence heatmap: Where Δ(PR) is high
- [ ] Show pressure view: Capacity consumption
- [ ] Show drift objects: Open issues blocking finalization
- [ ] Export audit trail: Full filament replay for any workflow

---

## 🔒 WORKSTREAM 3: ENFORCEMENT MECHANISMS

### **Purpose**
Make Relay safe by default through mechanical enforcement, not social pressure.

### **Tasks**

#### **3.1 State Anchoring Contracts (SAC)**
- [ ] Replace "capture" language with "anchoring" in all code/docs
- [ ] Define State Anchoring Contract schema:
  ```yaml
  anchored_state_types: [approvals, configs, builds]
  attestation_frequency: daily/weekly/per-event
  retention_policy: 90 days / 1 year / permanent
  redaction_policy: PII rules, legal holds
  ```
- [ ] Add invariant: `ANCHOR_CONTRACT_REQUIRED`
- [ ] Any telemetry without matching contract → hard refusal
- [ ] Lint rule: `NO_TELEMETRY_WITHOUT_CONTRACT`

#### **3.2 Drift Objects (Not Just Warnings)**
- [ ] Create `drift.<id>` filament type
- [ ] Drift object schema:
  ```yaml
  source: cache/index/ui/job
  truth_ref: pointer to canonical truth
  first_seen: timestamp
  impact_scope: affected systems
  confidence: 0-100%
  ```
- [ ] Drift objects **block finalization** (must be closed by repair or dismissal)
- [ ] Drift objects **consume capacity** (visible pressure)
- [ ] Drift objects appear in HUD as blocking issues

#### **3.3 Authority Decay**
- [ ] Add invariant: `AUTHORITY_DECAY_MANDATORY`
- [ ] All `authorityRef` objects must have:
  - `issued_at` (timestamp)
  - `expires_at` (timestamp, max 1 year)
- [ ] No "permanent" delegation allowed
- [ ] Renewal = new commit + justification
- [ ] Lint rule: `LINT-AUTH-DECAY`
- [ ] HUD visually dims expiring authority (warning at 30 days, 7 days, 1 day)

#### **3.4 Learning Boundary (Type Enforcement)**
- [ ] Separate commit types:
  - `POLICY_RECOMMENDATION` (learning output)
  - `POLICY_PROPOSAL` (human-authored)
  - `POLICY_APPLIED` (authorized change)
- [ ] Only `POLICY_APPLIED` affects execution
- [ ] `POLICY_APPLIED` requires:
  - `authorityRef`
  - Quorum (if configured)
  - Policy version bump
- [ ] Learning modules **cannot emit** `POLICY_APPLIED`
- [ ] Lint rule: `NO_POLICY_MUTATION_FROM_LEARNING`

#### **3.5 Refusal as Default UX**
- [ ] All action buttons render **disabled by default**
- [ ] Enablement requires:
  - `authorityRef` (valid, not expired)
  - Truth alignment (no divergence)
  - Capacity available (pressure budget not exhausted)
- [ ] Disabled actions show tooltip:
  ```
  "Why: [authority missing / truth misaligned / capacity exhausted]
   What's missing: [specific requirement]
   Next step: [how to enable]"
  ```

#### **3.6 Pressure Budget (Hierarchical)**
- [ ] Pressure budgets at: Global, Org, Team, System, Object
- [ ] Each with:
  - `max_audit_frequency`
  - `max_concurrent_disputes`
  - `cooldowns`
- [ ] Pressure budget violation → refusal (not slowdown)
- [ ] HUD shows: "Capacity: 72% (18 pressure remaining)"

#### **3.7 Truth Cutover (One-Way Switch)**
- [ ] For each domain, define: "Truth cutover point"
- [ ] After cutover commit:
  - 2D system = projection only (read-only view)
  - Relay = authoritative truth
- [ ] Lint rule: `NO_DUAL_AUTHORITY_AFTER_CUTOVER`
- [ ] 2D system writes after cutover → refused & logged

#### **3.8 Naming Cleanup**
- [ ] Find/replace in all code and docs:
  - ❌ "capture" → ✅ "anchor"
  - ❌ "take control" → ✅ "attest"
  - ❌ "suppress" → ✅ "reconcile"
  - ❌ "attack surface" → ✅ "exposure surface"

---

## 🚦 CRITICAL PATH DEPENDENCIES

```
Stage-Gate Infrastructure
    ↓
Business Pattern Objects (Evidence Pack, Policy Table, Three-Way Match)
    ↓
Workflow Validation + Refusal Mechanics
    ↓
Accumulation Tracking
    ↓
Enforcement Mechanisms (Drift, Authority Decay, Pressure Budgets)
    ↓
Dashboard (Relay-Native Views)
    ↓
LAUNCH (Stage 1 Complete)
```

**Parallel work allowed**:
- Enforcement mechanisms can be built alongside business pattern
- Dashboard views can be built alongside validation logic
- Lint rules can be written alongside implementation
- Documentation can be written alongside all workstreams

**NO external system integration on critical path** (deferred to post-Stage-1)

---

## ✅ DEFINITION OF DONE

### **For Stage-Gate System**
- [ ] Individual stages track learning (no authority granted)
- [ ] Global stages gate system capabilities (mechanical enforcement)
- [ ] Stage 1 active, Stage 2/3 visible but inert
- [ ] Stage actions blocked if global stage insufficient
- [ ] Stage definitions are versioned and replaceable

### **For Procurement/Bidding**
- [ ] QEP object model implemented
- [ ] SAP pointer fields mandatory
- [ ] Policy table operational
- [ ] Three-way match validation working
- [ ] Refusals generated with clear explanations
- [ ] Accumulation tracking functional
- [ ] Dashboard shows global → site → QEP drill-down

### **For Enforcement Mechanisms**
- [ ] State Anchoring Contracts required
- [ ] Drift objects block finalization
- [ ] Authority decay enforced
- [ ] Learning cannot mutate policy
- [ ] Refusal is default UX
- [ ] Pressure budgets prevent abuse
- [ ] Truth cutover prevents hybrid limbo

---

## 📊 TESTING REQUIREMENTS

### **Stage-Gate Testing**
- [ ] Individual can progress through learning stages
- [ ] Individual cannot execute Stage 2 actions (even if learned)
- [ ] Global stage transition requires explicit vote/approval
- [ ] Stage 2 activation enables previously-blocked actions
- [ ] Stage definitions can be replaced via governance

### **Business Pattern Testing**
- [ ] Workflow cannot complete without Evidence Pack → refusal generated
- [ ] Evidence count below policy requirement → refusal generated
- [ ] Expired approver authority → refusal generated
- [ ] Accumulation exceeds threshold → drift object created + refusal
- [ ] Dashboard correctly shows divergence heatmap (Δ(PR))
- [ ] Dashboard shows pressure consumption
- [ ] Audit export replays full filament history for any workflow

### **Enforcement Testing**
- [ ] Telemetry without anchoring contract → refusal
- [ ] Drift object blocks finalization
- [ ] Expired authority cannot approve → refusal
- [ ] Learning recommendation does not mutate policy
- [ ] Disabled action shows correct tooltip
- [ ] Pressure budget exhaustion → refusal
- [ ] Post-cutover 2D write → refusal

---

## 🎯 SUCCESS CRITERIA

**Stage 1 is "launched" when**:

1. ✅ Users can coordinate using Relay three-way match
2. ✅ Procurement workflow shows Δ(PR) = 0 (no divergence)
3. ✅ Refusals are clear, helpful, and never overridden
4. ✅ Authority is time-bounded and traceable
5. ✅ Learning explores future stages without coercing present
6. ✅ 2D systems (SAP) anchor to Relay without being replaced
7. ✅ Audits complete in minutes (not days)

**When this works**: We prove Relay's coordination physics in production.

**Then**: Community can propose/vote on Stage 2 activation (rain economy or alternatives).

---

## 📅 TIMELINE ESTIMATE

**Optimistic**: 8-10 weeks (pure Relay implementation, no external dependencies)  
**Realistic**: 10-12 weeks (account for testing and refinement)  
**Pessimistic**: 14 weeks (if architectural decisions require rework)

**Critical path**: Core coordination physics (stage-gates, evidence packs, refusal mechanics)

**NO external system dependencies** (SAP/SharePoint integration deferred)

---

## 🚀 NEXT IMMEDIATE ACTIONS

**Canon should start with** (Relay-native only):

1. **Week 1-2**: Stage-gate infrastructure (individual + global filaments)
2. **Week 2-3**: Evidence Pack object model (storage-agnostic)
3. **Week 3-4**: Three-Way Match object model + Policy Table
4. **Week 4-5**: Workflow validation + refusal mechanics
5. **Week 5-6**: Accumulation tracking (generic filament)
6. **Week 6-7**: Drift objects + closure workflow
7. **Week 7-8**: Authority decay + pressure budgets
8. **Week 8-9**: Dashboard (Relay-native views: divergence, pressure, drift)
9. **Week 9-10**: Lint rules + enforcement tests
10. **Week 10-12**: Integration testing + refinement
11. **Week 12**: **STAGE 1 COMPLETE** 🚀

**External system integration** (SAP, SharePoint, etc.) happens AFTER Stage 1 proves Relay core works.

---

## 📞 ESCALATION PATH

**If blocked on**:
- Object model design → Escalate to founder/council
- Authority structure questions → Escalate to founder/council
- Policy conflicts (site vs global) → Escalate to council
- Stage-gate mechanics → Escalate to this conversation
- Technical architecture decisions → Escalate to this conversation

**No silent blockers.** If stuck >24 hours, escalate immediately.

**Note**: External system integration (SAP, SharePoint) is OUT OF SCOPE for Stage 1. Do not block on external dependencies.

---

**Ready to build.** 🔒
