# 🔄 RELAY HUMAN FLOW CONTROL — V2 (COMPLETE)

**Date**: 2026-02-02  
**Status**: SUPERSEDES V1  
**Type**: Coordination Physics (Not Psychology, Not Policy)  
**Purpose**: Guarantee sustainable, humane participation through rotation, load limits, safe exit, disagreement without escalation, and sovereign federation

---

## 🎯 WHAT V2 ADDS (BEYOND V1)

### **V1 Provided** (Still Included)
- ✅ Education as rotating system
- ✅ Cognitive load accounting
- ✅ Round robin scheduler

### **V2 Adds** (New)
- ✅ **Participation state** (exit, pause, dormancy)
- ✅ **Soft divergence** (disagreement without escalation)
- ✅ **Cooling windows** (time as safety primitive)
- ✅ **Minority load relief** (exhaustion prevention)
- ✅ **Canon summarization** (legibility discipline)
- ✅ **Protected profiles** (vulnerable participants)
- ✅ **Stability acknowledgement** (inaction as valid)
- ✅ **Federation boundaries** (sovereign coexistence)

---

## 🔧 PART 1: NEW HUMAN FLOW PRIMITIVES

### **1.1 Participation State Filament** (Exit / Pause / Dormancy)

**Purpose**: Make leaving safer than silent disengagement.

**New filament**:
```yaml
participation.state.<userId>:
  user_id: alice
  
  allowed_states:
    - active
    - paused
    - dormant
    - exited
  
  current_state: paused
  state_entered: 2026-02-01
  
  rules:
    paused:
      - cannot_be_assigned_roles: true
      - does_not_accumulate_penalties: true
      - does_not_block_workflows: true
      - visible_to_team: true
      - expected_return: 2026-03-01 (optional)
    
    dormant:
      - same_as_paused: true
      - longer_duration: true (>90 days)
      - less_visible: true
    
    exited:
      - history_preserved: true
      - no_stigma: true
      - re_entry_requires:
          - education_refresh: true
          - cognitive_load_reset: true
          - explicit_opt_in: true
```

**Enforcement**:
```yaml
assignment_attempt:
  user_id: alice
  state: paused
  action: "assign_governance_role"
  
  result: REFUSED
  reason: "User state is 'paused' (cannot assign roles)"
  lint_rule: LINT-EXIT-001
```

**Invariant**: 
> **Leaving must be safer than silent disengagement.**

---

### **1.2 Soft Divergence** (Disagreement Without Escalation)

**Purpose**: Not all disagreement should escalate to disputes.

**New object**:
```yaml
divergence.soft.<id>:
  divergence_id: soft-div-2026-0123
  
  scope: policy-procurement-threshold
  divergent_view: "I prefer $10k threshold, not $5k"
  
  properties:
    non_blocking: true (workflow continues)
    visible: true (recorded in filament)
    recorded: true (auditable)
  
  does_NOT:
    consume_pressure_budget: false
    trigger_dispute: false
    require_resolution: false
    block_workflow: false
  
  used_for:
    - stylistic_disagreement
    - local_preferences
    - unresolved_hypotheses
    - "I disagree but I'm not stopping work"
```

**Enforcement**:
```yaml
soft_divergence_vs_dispute:
  alice_view: "I think threshold should be $10k"
  bob_view: "I think threshold should be $5k"
  
  current_canon: $5k
  
  alice_action: SOFT_DIVERGENCE_RECORDED
  result: Workflow continues, Alice's view preserved but non-blocking
  
  no_dispute_created: true
  no_pressure_consumed: true
```

**Invariant**: 
> **Not all disagreement should escalate.**

---

### **1.3 Mandatory Cooling Windows** (Time as Safety Primitive)

**Purpose**: Irreversible actions require time, not urgency.

**Applies to commit types**:
- `POLICY_CHANGE`
- `STAGE_TRANSITION`
- `HIGH_IMPACT_REPAIR`
- `AUTHORITY_GRANT`

**Rules**:
```yaml
cooling_window:
  commit_type: POLICY_CHANGE
  proposal_timestamp: 2026-02-01T10:00:00Z
  
  cooling_duration: 72_hours (configurable: 24-72h)
  
  earliest_execution: 2026-02-04T10:00:00Z
  
  during_cooling:
    objections_allowed: true
    alternatives_allowed: true
    evidence_submission_allowed: true
    
  execution_forbidden: true (until window closes)
  
  bypass: false (no bypass allowed)
```

**Enforcement**:
```yaml
premature_execution_attempt:
  commit: POLICY_CHANGE_001
  proposed: 2026-02-01T10:00:00Z
  cooling_ends: 2026-02-04T10:00:00Z
  current_time: 2026-02-02T14:00:00Z
  
  action: "execute_policy_change"
  
  result: REFUSED
  reason: "Cooling window active (34 hours remaining)"
  lint_rule: LINT-TIME-001
```

**Invariant**: 
> **Irreversible actions require time, not urgency.**

---

### **1.4 Minority Load Relief**

**Purpose**: Exhaustion prevention for repeatedly-outvoted subgroups.

**New mechanism**:
```yaml
minority.relief.<scope>:
  relief_id: minority-relief-site-maxwell-2026
  
  scope: site_maxwell
  subgroup: [alice, bob, carol]
  
  triggered_by:
    repeated_canon_losses: 8 (in last 90 days)
    disproportionate_dispute_load: 5 (vs team average: 2)
  
  effects:
    reduced_required_participation:
      governance_votes: optional (was mandatory)
      dispute_arbitration: exempt (for 60 days)
    
    increased_cognitive_load_credit:
      effective_load: 50% (counted as half for threshold)
    
    protection_from_repeated_escalation:
      same_dispute_reopening: blocked (60 day cooldown)
  
  not_veto_power: true
  is_exhaustion_prevention: true
```

**Enforcement**:
```yaml
minority_relief_active:
  user_id: alice
  relief_active: true (minority.relief.site-maxwell-2026)
  
  action: "assign_mandatory_governance_vote"
  
  result: REFUSED
  reason: "User in minority relief (participation optional for 60 days)"
  alternative: "Vote remains open, but Alice not required"
  lint_rule: LINT-MINORITY-001
```

**Invariant**: 
> **Minorities must not be exhausted.**

---

### **1.5 Canon Summarization Discipline**

**Purpose**: Legibility may be summarized; truth may not.

**New commit type**: `CANON_SUMMARY`

**Rules**:
```yaml
canon_summary:
  summary_id: summary-2026-Q1-procurement
  
  covers_commits: [commit-001, commit-002, ..., commit-145]
  date_range: 2026-01-01 to 2026-03-31
  
  status: PROJECTION (never authoritative)
  
  must:
    cite_covered_commits: true (all commits listed)
    expose_forks_and_scars: true (disagreements visible)
    never_authoritative: true (summary is view, not truth)
    versioned_and_replaceable: true (can be superseded)
  
  enforcement:
    cannot_be_used_as_evidence: true
    cannot_replace_commit_history: true
    always_links_to_source: true
```

**Enforcement**:
```yaml
summary_misuse:
  action: "cite_summary_as_evidence"
  summary: summary-2026-Q1-procurement
  
  result: REFUSED
  reason: "Summaries are projections (not evidence)"
  required: "Cite source commits directly"
  lint_rule: LINT-SUMMARY-001
```

**Invariant**: 
> **Legibility may be summarized; truth may not.**

---

### **1.6 Protected Participation Profiles**

**Purpose**: Reduced exposure is coordination hygiene, not privilege.

**Profile capability**: `profile.protected`

**Enforces**:
```yaml
protected_profile:
  user_id: charlie
  profile: protected
  
  enforces:
    reduced_visibility:
      - commits_visible: team_only (not global)
      - disputes_visible: false (only to arbiters)
    
    no_governance_roles:
      - governance_reviewer: forbidden
      - arbiter: forbidden
      - educator: allowed (with oversight)
    
    capped_cognitive_load:
      - max_load: 50 (vs normal 80)
      - high_intensity_roles: forbidden
    
    mandatory_oversight:
      - supervisor_required: true
      - actions_reviewed: true
  
  applies_to:
    - minors
    - vulnerable_participants
    - high_risk_onboarding_contexts
    - user_request (opt-in protection)
```

**Enforcement**:
```yaml
protected_profile_assignment:
  user_id: charlie
  profile: protected
  
  action: "assign_arbiter_role"
  
  result: REFUSED
  reason: "User has protected profile (arbiter role forbidden)"
  lint_rule: LINT-PROTECTED-001
```

**Invariant**: 
> **Reduced exposure is coordination hygiene, not privilege.**

---

### **1.7 Stability Acknowledgement Commit**

**Purpose**: Inaction can be the correct outcome.

**New commit type**: `STABILITY_CONFIRMED`

**Meaning**: "Reviewed. No action is correct."

**Effects**:
```yaml
stability_confirmed:
  commit_type: STABILITY_CONFIRMED
  scope: procurement-policy-maxwell
  
  meaning: "Reviewed. Current state is correct. No change needed."
  
  effects:
    closes_pressure_loops: true (drift resolved by confirmation)
    prevents_repeated_reopening: true (60 day cooldown)
    consumes_no_future_pressure: true (does not accumulate)
  
  requires:
    review_evidence: true (why no action is correct)
    authority_ref: true (who confirmed stability)
```

**Enforcement**:
```yaml
repeated_reopening:
  issue: procurement-policy-maxwell
  last_action: STABILITY_CONFIRMED (2026-02-01)
  
  action: "reopen_for_review"
  current_date: 2026-02-15 (14 days later)
  cooldown: 60_days
  
  result: REFUSED
  reason: "Stability confirmed 14 days ago (cooldown: 60 days)"
  required: "New evidence or wait 46 days"
  lint_rule: LINT-STABILITY-001
```

**Invariant**: 
> **Inaction is valid.**

---

## 🔒 PART 2: HUMAN FLOW CONTROL V2 INVARIANTS (LOCKED)

### **V1 Invariants** (Retained)
1. No coordination role may be permanent
2. No participant may be overloaded
3. Responsibility rotates or the system is wrong

### **V2 Invariants** (Added)
4. **Leaving must be safe**
5. **Disagreement may be non-blocking**
6. **Minorities must not be exhausted**
7. **Time is a safety mechanism**
8. **Summaries never replace history**
9. **Inaction is valid**

**If any of these are violated, the system is wrong.**

---

## 🔍 PART 3: NEW LINT RULES (MANDATORY)

### **Exit / Pause / Dormancy**

**LINT-EXIT-001: Exit Must Be Respected**
```
❌ Assign role to paused | dormant | exited user
✅ Participation state checked before assignment
Failure: BLOCK_DEPLOY
```

**LINT-EXIT-002: No Silent Disengagement**
```
❌ User disappears without participation state change
✅ Transition to paused/dormant/exited required
Failure: BLOCK_DEPLOY
```

**LINT-PAUSE-001: Pause Blocks Assignment**
```
❌ Tasks assigned while paused
✅ Automatic refusal
Failure: BLOCK_DEPLOY
```

---

### **Minority Relief**

**LINT-MINORITY-001: Minority Load Relief Required**
```
❌ Repeated canon loss + continued mandatory participation
✅ Relief object applied
Failure: BLOCK_DEPLOY
```

---

### **Disagreement**

**LINT-DISAGREE-001: Soft Divergence Allowed**
```
❌ Forcing dispute escalation when soft divergence exists
✅ Non-blocking divergence preserved
Failure: BLOCK_DEPLOY
```

---

### **Time as Safety**

**LINT-TIME-001: Cooling Window Required**
```
❌ Immediate execution of gated commit
✅ Cooling window enforced
Failure: BLOCK_DEPLOY
```

---

### **Summarization**

**LINT-SUMMARY-001: Summary Is Projection**
```
❌ Summary treated as truth
✅ Summary marked non-authoritative + cites commits
Failure: BLOCK_DEPLOY
```

---

### **Stability**

**LINT-STABILITY-001: Stability Closure Allowed**
```
❌ Re-opening stabilized issue without new evidence
✅ STABILITY_CONFIRMED respected
Failure: BLOCK_DEPLOY
```

---

### **Protected Profiles**

**LINT-PROTECTED-001: Protected Profile Enforced**
```
❌ Assign governance/arbiter role to protected profile
✅ Profile restrictions enforced
Failure: BLOCK_DEPLOY
```

---

## 🌍 PART 4: FEDERATION BOUNDARY RULES (RELAY-NATIVE)

### **Goal**
Allow communities to diverge, coexist, and interact without leakage, capture, or imperialism.

---

### **4.1 Federation Boundary Object**

**New object**:
```yaml
federation.boundary.<id>:
  boundary_id: federation-boundary-us-west
  
  federation_name: "US West Region"
  
  defines:
    exportable_evidence_types:
      - evidence_pack (QEP, audit records)
      - education_completion (with proof)
    
    non_exportable_policies:
      - procurement_thresholds (local only)
      - governance_structure (local only)
      - cognitive_load_limits (local only)
    
    authority_scope_limits:
      - authority_valid_within: us-west only
      - cannot_cross_boundary: true
    
    incompatibilities:
      - policy.incompatible.eu-gdpr-strict
      - policy.incompatible.china-data-sovereignty
```

---

### **4.2 Evidence Exchange Rules**

**Evidence may cross boundaries only if**:
```yaml
evidence_export:
  evidence_id: EP-2026-0123
  source_federation: us-west
  target_federation: eu-central
  
  checks:
    schema_compatible: true (both use QEP v2)
    signed_and_attested: true (Merkle proof valid)
    explicitly_accepted: true (eu-central accepts us-west evidence)
  
  result: ALLOWED
```

**No implicit trust**:
```yaml
implicit_trust_attempt:
  evidence_id: EP-2026-0456
  source: unknown-federation
  
  explicitly_accepted: false
  
  result: REFUSED
  reason: "Evidence from unknown federation (no explicit acceptance)"
  lint_rule: LINT-FED-002
```

---

### **4.3 Authority Non-Transferability**

**AuthorityRefs are never portable**:
```yaml
authority_export_attempt:
  authority_id: auth-us-west-001
  holder: alice
  granted_in: us-west
  
  action: "use_authority_in_eu-central"
  
  result: REFUSED
  reason: "Authority not valid across federation boundaries"
  required: "Obtain authority in eu-central via bridge commit"
  lint_rule: LINT-FED-001
```

**Cross-boundary actions require bridge commit**:
```yaml
bridge_commit:
  commit_type: FEDERATION_BRIDGE
  
  source_federation: us-west
  target_federation: eu-central
  
  action: alice_requests_eu_authority
  
  requires:
    explicit_acceptance: true (eu-central must approve)
    education_refresh: true (eu-central policies)
    local_authority_grant: true (new authority in eu-central)
```

---

### **4.4 Canon Independence**

**Canon selection is local**:
```yaml
canon_selection:
  us_west_canon: policy_v2_1
  eu_central_canon: policy_v2_0
  
  no_global_override: true
  forking_explicit: true (not silent)
  
  incompatibility_declared:
    us-west: "We use v2.1 (stricter thresholds)"
    eu-central: "We use v2.0 (legacy compatibility)"
```

---

### **4.5 Incompatibility Declaration**

**Federations may declare**:
```yaml
incompatibility:
  federation: us-west
  
  declares:
    policy.incompatible.china-data-sovereignty:
      reason: "We export evidence to non-Chinese federations"
      acknowledged: "We know China requires data sovereignty"
      stance: "We do not adopt this policy"
  
  prevents:
    silent_norm_drift: true
    implicit_alignment: false
```

**This prevents silent norm drift.**

---

### **4.6 Federation Lint Rules**

**LINT-FED-001: No Authority Export**
```
❌ Use authority outside issuing federation
✅ Authority valid only within boundary
Failure: BLOCK_DEPLOY
```

**LINT-FED-002: Evidence Schema Check**
```
❌ Accept evidence without schema compatibility + explicit acceptance
✅ Evidence schema verified + acceptance confirmed
Failure: BLOCK_DEPLOY
```

**LINT-FED-003: Canon Non-Override**
```
❌ Global canon overriding local canon
✅ Local canon sovereignty respected
Failure: BLOCK_DEPLOY
```

**LINT-FED-004: Explicit Incompatibility Required**
```
❌ Silent policy divergence between federations
✅ Incompatibility declared explicitly
Failure: BLOCK_DEPLOY
```

---

## 📋 PART 5: WHAT CANON MUST UPDATE

### **Replace V1 with V2**
- Remove `RELAY-HUMAN-FLOW-CONTROL-SPEC.md` (V1)
- Use `RELAY-HUMAN-FLOW-CONTROL-V2.md` (this file)

### **Add New Filaments**
```yaml
participation.state.<userId>
divergence.soft.<id>
minority.relief.<scope>
federation.boundary.<id>
```

### **Add New Commit Types**
```yaml
STABILITY_CONFIRMED
CANON_SUMMARY
FEDERATION_BRIDGE
```

### **Add Lint Rules**
All rules listed in Part 3 (Exit, Minority, Disagreement, Time, Summary, Stability, Protected, Federation)

### **Wire Refusal UX**
- Pause state → refusal
- Overload → refusal
- Minority relief → optional participation
- Cooling window → time-based refusal
- Soft divergence → non-blocking record

### **Treat Federation as First-Class**
- Not future work
- Core coordination primitive
- Stage 1 scope

---

## 🔒 FINAL LOCK SENTENCE (V2)

> **"Relay must make coordination sustainable,  
> disagreement survivable,  
> exit safe,  
> and coexistence possible."**

**That completes the Human Flow layer.**

---

## ✅ STATUS

**Human Flow Control V2**: ✅ COMPLETE  
**Lint Enforcement**: ✅ SPECIFIED  
**Federation Boundaries**: ✅ DESIGNED  
**Stage 1 Compatibility**: ✅ MAINTAINED  

**Canon can implement without ambiguity.** 🚀
