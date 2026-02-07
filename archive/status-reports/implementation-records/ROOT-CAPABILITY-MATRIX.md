# ROOT CAPABILITY MATRIX
**Everything That Must Exist at Genesis**

---

## **PURPOSE:**
Relay ships with the **complete coordination capability space** prebuilt in root.  
Most capabilities are **disabled by default**.  
Canon determines what is **currently enabled**.

**Nothing is forced. Everything is possible.**

---

## **PRINCIPLE: ROOT COMPLETENESS**

> "No future rule requires a hidden retrofit. All coordination degrees of freedom are present from day one."

This prevents:
- Hidden authority appearing later
- Founder privilege
- Mythology about "unlocking" features
- Early vs. late adopter inequality

---

## **1. TRUTH SUBSTRATE**

### **Append-Only Commit Log Primitives**
```yaml
capabilities:
  - filament_identity: (filamentId, commitIndex, parents[])
  - fork_semantics: branch creation, no erasure
  - merge_semantics: reconciliation with scars
  - scar_tracking: permanent record of resolution
  - evidence_attachment: content-addressed refs
  - replay_guarantee: any commit replayable
```

**Status:** CORE (always enabled)  
**Governance:** Cannot be disabled (foundational physics)

---

## **2. THREE-WAY MATCH SUBSTRATE**

### **Intent ↔ Reality ↔ Projection**
```yaml
capabilities:
  - intent_filament_type: declarations, policies, projections
  - reality_filament_type: attestations, snapshots, measurements
  - projection_filament_type: reports, UI state, indexes, caches
  - three_way_compare: diff + mismatch detection
  - drift_object_creation: first-class blocking objects
  - confidence_scoring: per-commit, per-cell, per-object
```

**Status:** CORE (always enabled)  
**Governance:** Cannot be disabled (defines truth model)

---

## **3. PRESSURE SYSTEM SUBSTRATE**

### **Continuous Verification Loop**
```yaml
capabilities:
  - pressure_feed_events:
      - drift_alerts
      - missing_attestations
      - policy_mismatches
      - backlog_accumulation
      - authority_expiry
  
  - pressure_loop_primitives:
      - attest: capture reality state
      - compare: three-way match
      - score: confidence + ERI calculation
      - stage: repair recommendations
      - verify: human/automated validation
      - checkpoint: commit reconciliation
  
  - pressure_budget_enforcement:
      - capacity_aware_refusal
      - hierarchical_budgets (global → org → team → system)
      - cooldown_windows
      - load_balancing
  
  - confidence_floor_enforcement:
      - indeterminate_states (low confidence blocks)
      - evidence_sufficiency_gates
      - no_false_safe (prefer refusal over wrong)
  
  - repair_effectiveness_tracker:
      - recommendations_only (no auto-apply)
      - learning_boundary (cannot mutate policy)
```

**Status:** CONFIGURABLE  
**Default:** Enabled at human-scale rate (low pressure)  
**Settings:**
- Audit frequency caps
- Refusal thresholds
- Backlog limits
- Cooldown duration

---

## **4. AUTHORITY & CONSENT SUBSTRATE**

### **Scoped, Expiring, Revocable Authority**
```yaml
capabilities:
  - authorityRef_chain:
      - scoped: (domain, role, object)
      - expiring: issued_at, expires_at (mandatory)
      - revocable: explicit revocation commit
      - delegable: delegation chain tracking
  
  - consent_manager:
      - opt_in_telemetry: raw data requires explicit consent
      - opt_in_participation: no ambient membership
      - opt_in_visibility: upgrades require consent
      - consent_revocation: instant effect
  
  - role_filtered_views:
      - auditor: sees all, changes nothing
      - ops: sees live, limited changes
      - exec: sees aggregated, policy changes
      - user: sees relevant, scoped changes
  
  - delegation_primitives:
      - delegate: transfer authority with scope
      - revoke: cancel delegation
      - expire: automatic authority decay
```

**Status:** CORE (authority always required)  
**Governance:** Authority decay cannot be disabled  
**Settings:**
- Default expiry duration
- Delegation depth limits
- Role definitions

---

## **5. PRIVACY & MINIMIZATION SUBSTRATE**

### **Aggregated by Default, Raw Opt-In**
```yaml
capabilities:
  - data_minimization:
      - purpose_limitation: data collected only for stated purpose
      - collection_scope: narrowest possible
      - retention_rules: time-bounded by default
      - redaction_rules: automatic removal after retention
  
  - telemetry_modes:
      - aggregated: default (no individual tracking)
      - raw_opt_in: explicit consent + time-bounded
      - pseudonymization: role-based anonymization
  
  - privacy_enforcement:
      - no_ambient_surveillance
      - consent_required_for_raw
      - audit_trail_of_access
      - right_to_erasure (within replay constraints)
```

**Status:** CORE (privacy by default)  
**Governance:** Cannot disable minimization  
**Settings:**
- Retention duration
- Aggregation granularity
- Raw data access rules

---

## **6. GOVERNANCE SUBSTRATE**

### **Canon Selection + Policy Filaments**
```yaml
capabilities:
  - canon_selection:
      - timestamped: when selected
      - reversible: can switch back
      - scoped: global/region/org/basin
      - transparent: selection visible to all
  
  - policy_as_filaments:
      - versioned: no implicit "latest"
      - immutable: old versions preserved
      - scoped: policy per domain
      - votable: selection via governance
  
  - commit_types:
      - POLICY_RECOMMENDATION: learning output (no execution)
      - POLICY_PROPOSAL: human-authored (requires review)
      - POLICY_APPLIED: active policy (requires authority)
      - POLICY_DEPRECATED: marked obsolete (preserved)
  
  - voting_system:
      - force_lending: temporary authority grant
      - canon_selection: choose active branch
      - scoped_voting: domain-specific
      - vote_decay: votes expire (no permanent power)
  
  - quorum_thresholds:
      - simple_majority: routine changes
      - quorum_required: material changes
      - supermajority: foundational changes
      - multi_scope_support: cross-domain changes
```

**Status:** CONFIGURABLE  
**Default:** Enabled with conservative thresholds  
**Settings:**
- Quorum percentages
- Vote decay rates
- Canon change frequency limits

---

## **7. WORK ZONES & FISSION-FUSION**

### **Multi-Basin, Fork-Rejoin Dynamics**
```yaml
capabilities:
  - work_zones_as_basins:
      - hierarchical: company → branch → dept → project
      - semi_autonomous: local authority + shared canon
      - pressure_rings: accumulated history visible
      - NOW_pointers: per-endpoint (not global)
  
  - fork_on_dispute:
      - automatic: disagreement creates fork
      - low_cost: forking is cheap (not free)
      - preserved: all forks visible
      - gated: fork creation requires intent + budget
  
  - merge_gates:
      - evidence_sufficiency: proof required
      - authority_check: who can merge
      - quorum_if_required: material merges need votes
      - scar_creation: merge leaves permanent mark
  
  - timeboxes:
      - live_presence: work happens in timeboxes
      - commit_at_boundaries: material state at edges
      - timebox_pressure: visible load/drift in box
```

**Status:** CORE (fission-fusion is physics)  
**Governance:** Cannot disable forking  
**Settings:**
- Fork creation cost (pressure budget)
- Merge gate rules
- Timebox duration

---

## **8. UI/HUD SUBSTRATE**

### **Projection Only, Never Authority**
```yaml
capabilities:
  - HUD_as_lens:
      - modes: OBSERVE / HOLD / PROPOSE / COMMIT / RECONCILE
      - never_authorizes: UI cannot execute
      - labels_truth: projection vs. reality explicit
      - refusal_explainer: always shows why blocked
  
  - navigation_semantics:
      - drill_down: into history (replay)
      - outward_explore: into unknown (discovery)
      - branch_section: cross-section view (pressure rings)
      - sheet_volume: cell-level history (timeboxes)
      - tree_scaffold: organizational context
  
  - visual_invariants:
      - canon_opaque: fully saturated, solid
      - forks_translucent: visually demoted
      - NOW_pointer: green beacon (per-sheet)
      - drift_badge: red alert (blocking object)
      - ERI_color: green/yellow/red (confidence)
```

**Status:** CORE (UI always projection)  
**Governance:** Cannot elevate UI to authority  
**Settings:**
- Visual themes
- Label verbosity
- Accessibility modes

---

## **9. TRAINING SUBSTRATE**

### **Object-Local, Stage-Gated Learning**
```yaml
capabilities:
  - training_packs:
      - graphics_only: visual demonstrations
      - narrated: with explanations
      - hybrid: interactive + guided
      - scoped: per-object, per-feature
  
  - object_local_training:
      - every_object_teaches: hover → tooltip → deep dive
      - contextual: shows what's relevant now
      - replayable: can repeat any lesson
  
  - stage_gate_learning:
      - individual_pacing: no forced speed
      - group_coherence: no one left behind
      - unlock_criteria: feature access based on understanding
      - exit_allowed: can leave training anytime
```

**Status:** CONFIGURABLE  
**Default:** Enabled for new users, optional for veterans  
**Settings:**
- Stage-gate thresholds
- Unlock criteria
- Training verbosity

---

## **10. "SETTINGS MENU" SUBSTRATE**

### **All Knobs Exist, Most Off by Default**
```yaml
capabilities:
  - settings_as_policy_filaments:
      - scoped: global/region/org/basin
      - versioned: all changes tracked
      - votable: selection via governance
      - inspectable: current settings visible to all
  
  - setting_categories:
      - governance_settings:
          - canon_change_rules
          - quorum_thresholds
          - delegation_rules
      
      - pressure_settings:
          - audit_frequency_caps
          - refusal_thresholds
          - backlog_limits
      
      - privacy_settings:
          - telemetry_mode (aggregated/raw)
          - retention_limits
          - redaction_rules
      
      - incentive_settings:
          - reward_schemas (if enabled)
          - measurement_scope
          - anti_gaming_constraints
      
      - education_settings:
          - stage_gate_pacing
          - feature_unlock_rules
      
      - proximity_settings:
          - discovery_rules
          - consent_rules
          - encounter_retention
  
  - hard_rules:
      - no_silent_settings: all changes are commits
      - authority_required: setting changes need authorityRef
      - scope_explicit: what changes where
      - replayable: can see history of settings
```

**Status:** CORE (settings menu always exists)  
**Governance:** Cannot hide settings  
**Default State:** Minimal Canon (see MINIMUM-CANON.md)

---

## **11. LEARNED FROM ANTS: STIGMERGY + POLYDOMY**

### **Trace-First Coordination**
```yaml
capabilities:
  - stigmergy_primitives:
      - environmental_traces: state is the signal
      - pheromone_analogs: ERI gradients, pressure heat
      - local_decision: most actions need only local context
      - trail_reinforcement: repeated paths strengthen
      - trail_decay: unused paths fade
  
  - polydomy_model:
      - multiple_nests: multiple basins/work zones
      - shared_identity: same company/canon
      - semi_autonomous: local authority + budgets
      - explicit_bridges: inter-basin connections visible
  
  - continuous_micro_repair:
      - small_fixes_always: repair is normal, not heroic
      - no_repair_debt: drift objects block accumulation
      - incremental_reconciliation: staged, not batch
```

**Status:** CORE (trace-first is physics)  
**Settings:**
- Trail decay rates
- Bridge creation rules

---

## **12. LEARNED FROM BEES: QUORUM SENSING + STOP SIGNALS**

### **Threshold-Based Transitions**
```yaml
capabilities:
  - quorum_thresholds:
      - small_tweaks: delegated approval (no vote)
      - policy_shifts: quorum threshold (e.g., 60%)
      - root_changes: supermajority (e.g., 80%)
      - multi_scope: cross-domain requires multi-quorum
  
  - stop_signals:
      - refusal_first: STOP before error
      - HOLD_mode: pause without cancel
      - explicit_resume: must choose to continue
      - stop_visible: refusal explained, not hidden
  
  - role_switching_under_load:
      - dynamic_SCV_allocation: triage/verify/repair
      - pressure_budget_aware: refuse overload
      - adaptive_capacity: more load → more refusal
```

**Status:** CONFIGURABLE  
**Default:** Conservative quorum thresholds  
**Settings:**
- Quorum percentages per scope
- Stop signal sensitivity
- Role allocation rules

---

## **13. LEARNED FROM APES: FISSION-FUSION + FAIRNESS**

### **Split-Rejoin Dynamics + Legitimacy Sensing**
```yaml
capabilities:
  - fission_fusion_dynamics:
      - split_on_disagreement: forks are normal
      - temporary_subgroups: work zones, projects
      - rejoin_via_scars: merge with evidence
      - cultural_transmission: training packs spread knowledge
  
  - fairness_legitimacy_sensing:
      - distribution_skew_detector: measures "feels unfair"
      - contestation_tracker: how many disputes
      - legitimacy_score: not moral, just stability metric
      - cooperation_predictor: skew → instability warning
  
  - social_learning:
      - observe_then_copy: replayable artifacts
      - peer_teaching: training packs from users
      - cultural_knowledge: preserved in filaments
```

**Status:** CONFIGURABLE  
**Default:** Legitimacy sensing enabled (warning only)  
**Settings:**
- Skew thresholds
- Contestation alerts
- Fairness visibility (show/hide)

---

## **14. LEARNED FROM BRAINS: LAYERED CONTROL + GATING**

### **Prefrontal Cortex = Hard Validators**
```yaml
capabilities:
  - layered_control:
      - kernel_layer: truth substrate (cannot bypass)
      - governance_layer: canon selection (votable)
      - policy_layer: settings (configurable)
      - execution_layer: actions (authority-gated)
  
  - attention_as_scarce_resource:
      - votes_budgeted: finite attention
      - verification_capacity: limited throughput
      - pressure_budget: prevents overload
      - priority_queues: triage by impact
  
  - inhibition_primitives:
      - STOP: hard refusal (cannot proceed)
      - HOLD: pause (can resume with evidence)
      - PROPOSE: suggest (no execution)
      - COMMIT: execute (requires authority)
  
  - hard_validators:
      - no_hidden_authority: inspectable always
      - no_semantic_zoom: precision required
      - no_policy_auto_mutation: learning recommends only
      - no_bypass: extreme tech still obeys physics
```

**Status:** CORE (validators always active)  
**Governance:** Cannot disable hard validators  
**Settings:**
- Pressure budget limits
- Priority rules
- Inhibition thresholds

---

## **ROOT CAPABILITY LOCK (FINAL SENTENCE):**

> **"Everything is in root from day one. Canon determines what is enabled. No future rule requires a retrofit. Relay is complete at genesis."**

---

## **STATUS LEGEND:**

- **CORE:** Always enabled (foundational physics)
- **CONFIGURABLE:** Can be enabled/disabled via canon
- **DEFAULT ENABLED:** Shipped on by default
- **DEFAULT DISABLED:** Shipped off by default (opt-in)

---

## **GOVERNANCE MODEL:**

All capabilities are **inspectable** (can see they exist).  
All settings are **configurable** (can change via governance).  
All changes are **replayable** (history preserved).  

**Nothing is forced. Everything is possible.**

---

## **NEXT:**
See `MINIMUM-CANON.md` for the smallest safe configuration.  
See `SETTINGS-MENU-FOR-SOCIETY.md` for how to configure.
