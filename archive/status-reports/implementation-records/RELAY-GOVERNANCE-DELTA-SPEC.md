# Relay Governance Delta Specification

**Date:** 2026-02-05  
**Status:** CONSTITUTIONAL ADDITION  
**Purpose:** Formalize 8 governance principles and define concrete implementation changes

---

## Constitutional Principles (Lock Status)

These principles are now **constitutional** - they define what Relay is and cannot be violated without explicit constitutional amendment.

---

## Principle 1: Dialogue is Free, History is Gated

### Rule
> "Speech/chat = ephemeral coordination layer. Commits = the only way reality changes (auditable, replayable)."

### Constitutional Lock
**No irreversible action from dialogue. Only commits with authority + evidence refs can change state.**

### Implementation Delta

#### New Commit Types
```javascript
// STATE_TRANSITION commit (replaces informal state changes)
{
  type: 'STATE_TRANSITION',
  from_state: 'DRAFT' | 'HOLD' | 'PROPOSE',
  to_state: 'HOLD' | 'PROPOSE' | 'COMMIT' | 'REVERT',
  authority_ref: string,           // Who authorized this transition
  evidence_refs: [string],         // Supporting evidence commits
  reason: string,                  // Why this transition
  timestamp_ms: number,
  signature: string                // Custody signature for COMMIT/REVERT
}

// DIALOGUE commit (ephemeral coordination, never changes state)
{
  type: 'DIALOGUE',
  participant_ids: [string],
  content_hash: string,            // Hash only, not full content
  retention_window_hours: number,  // Auto-expire (default: 24h)
  timestamp_ms: number,
  context_ref: string              // What this dialogue is about
}
```

#### New UI Components
```
CommitBoundaryPanel:
  - Shows current state: DRAFT / HOLD / PROPOSE / COMMIT
  - Displays required authority for next transition
  - Shows evidence checklist (what's missing)
  - "Advance State" button (enabled only when gates pass)
  - "Revert" button (requires custody signature)

DialoguePanel (separate from commit history):
  - Ephemeral messages (auto-expire)
  - Clear visual: "This is coordination, not history"
  - No "save" or "commit" actions available here
  - References commits/evidence but doesn't create them
```

#### API Endpoints
```
POST /state/transition
  - Requires: authority proof + evidence refs
  - Returns: state transition commit or refusal reason

POST /dialogue/message (ephemeral)
  - No state changes allowed
  - Auto-expires based on retention policy
```

---

## Principle 2: Education as Staged Coordination

### Rule
> "Everyone learns at their own pace, but shared operating state advances only when group is ready (≤10% left behind)."

### Constitutional Lock
**Cohort advancement requires collective readiness. Individual learning is private until explicit share.**

### Implementation Delta

#### New Filament Types
```javascript
// LearningFilament (individual)
learn.user.<user_id>.<topic_id> = {
  current_stage: string,
  completed_exercises: [string],
  mastery_level: number,          // 0.0-1.0
  last_activity: timestamp,
  privacy: 'private' | 'shared',  // Default: private
  ready_for_next: boolean
}

// CohortFilament (group)
learn.cohort.<cohort_id>.<topic_id> = {
  current_stage: string,
  participant_count: number,
  ready_count: number,
  not_ready_count: number,
  advancement_threshold: number,   // Default: 0.9 (≤10% left behind)
  next_stage_available: boolean,
  stage_gate_policy_ref: string
}
```

#### New Commit Types
```javascript
// LEARNING_PROGRESS commit (individual)
{
  type: 'LEARNING_PROGRESS',
  user_id: string,
  topic_id: string,
  stage_completed: string,
  evidence_refs: [string],        // Exercises, assessments
  mastery_score: number,
  ready_for_next: boolean,
  timestamp_ms: number
}

// STAGE_GATE_ADVANCE commit (cohort)
{
  type: 'STAGE_GATE_ADVANCE',
  cohort_id: string,
  topic_id: string,
  from_stage: string,
  to_stage: string,
  ready_count: number,
  not_ready_count: number,
  threshold_met: boolean,
  authority_ref: string,          // Instructor/coordinator
  timestamp_ms: number,
  signature: string
}
```

#### Stage Gate Policy
```javascript
// Cohort advancement logic
function canAdvanceCohort(cohort) {
  const readyPercentage = cohort.ready_count / cohort.participant_count;
  const notReadyPercentage = cohort.not_ready_count / cohort.participant_count;
  
  return notReadyPercentage <= cohort.advancement_threshold;
}

// Default: advance when ≤10% not ready
// Configurable per cohort/topic
```

#### UI Components
```
IndividualLearningPane:
  - Personal progress (private by default)
  - Exercises and self-paced content
  - "Ready for next stage" checkbox
  - "Share progress" button (explicit consent)

CohortProgressPane:
  - Aggregate readiness (no individual identification)
  - Stage gate status: "Waiting for X more participants"
  - Next stage preview (visible to all)
  - Coordinator: "Advance cohort" button (enabled when threshold met)
```

---

## Principle 3: Proximity + Relationships = Consent-First, Minimal Data

### Rule
> "Proximity events are highly sensitive. Relay must never feel like tracking. Mutual consent required."

### Constitutional Lock
**Default: proximity logging OFF. When on: pseudonymized by default, identity revealed only on mutual consent.**

### Implementation Delta

#### New Filament Types
```javascript
// ProximityConsent (per-user)
proximity.consent.<user_id> = {
  enabled: boolean,                // Default: false
  pseudonym_id: string,            // Generated on enable
  retention_hours: number,         // Default: 24h
  identity_reveal_policy: 'never' | 'mutual' | 'explicit',
  allowed_contexts: [string]       // Where proximity can be logged
}

// ProximityEvent (minimal data)
proximity.event.<event_id> = {
  encounter_id: string,            // One-time ID
  pseudonym_a: string,
  pseudonym_b: string,
  timestamp_ms: number,
  duration_seconds: number,
  context: string,                 // 'classroom', 'event', etc.
  expiry_timestamp_ms: number      // Auto-delete after retention
}

// MutualConsentMatch (identity reveal)
proximity.match.<match_id> = {
  pseudonym_a: string,
  pseudonym_b: string,
  user_a_consent: boolean,
  user_b_consent: boolean,
  revealed: boolean,               // Both consented
  timestamp_ms: number
}
```

#### New Commit Types
```javascript
// PROXIMITY_CONSENT_SET commit
{
  type: 'PROXIMITY_CONSENT_SET',
  user_id: string,
  enabled: boolean,
  retention_hours: number,
  identity_policy: string,
  timestamp_ms: number,
  signature: string                // User signature required
}

// PROXIMITY_EVENT_LOG commit (pseudonymized)
{
  type: 'PROXIMITY_EVENT_LOG',
  encounter_id: string,
  pseudonym_a: string,             // No real identity
  pseudonym_b: string,
  context: string,
  duration_seconds: number,
  timestamp_ms: number,
  expiry_timestamp_ms: number      // Auto-delete
}

// MUTUAL_CONSENT_SIGNAL commit
{
  type: 'MUTUAL_CONSENT_SIGNAL',
  pseudonym: string,               // Sender's pseudonym
  target_pseudonym: string,        // Recipient's pseudonym
  signal_type: 'interest' | 'unmatch',
  timestamp_ms: number
}
```

#### Privacy Rules (Lock #8 Enforcement)
```javascript
// Data minimization
- Log only: pseudonym pair, timestamp, duration, context
- Never log: location coordinates, device IDs, WiFi MACs
- Retention: 24h default, max 7 days, user-configurable
- Purpose limitation: only for consent-gated matching

// Identity protection
- Pseudonyms rotate every 24h
- Real identity revealed only when:
  1. Both users signal interest
  2. Both explicitly consent to reveal
  3. Within same context/event
```

#### UI Components
```
ProximitySettingsPanel:
  - Big toggle: "Enable proximity features" (default: OFF)
  - Retention slider: 24h - 7 days
  - Identity policy: "Never reveal" / "Mutual consent only"
  - Clear explanation: "What data is logged"
  - Delete all data button

ProximityMatchPanel (when mutual consent):
  - Shows pseudonymized encounters: "Someone you met"
  - "Signal interest" button → if mutual, reveals identity
  - "Not interested" button → removes from view
  - No "swipe through all" - only shows your encounters
```

---

## Principle 4: No Hidden Authority / No Undiscoverable Commits

### Rule
> "Relay can support privacy, but not un-auditable control. No non-discoverable code paths."

### Constitutional Lock
**All authority is discoverable. Encrypted content is allowed, but commit existence + authority + retention must be auditable.**

### Implementation Delta

#### Commit Visibility Rules
```javascript
// All commits must have:
{
  commit_id: string,               // Always visible
  commit_type: string,             // Always visible
  author_id: string,               // Always visible
  timestamp_ms: number,            // Always visible
  authority_ref: string,           // Always visible
  retention_policy: string,        // Always visible
  
  // Content may be encrypted, but structure is auditable
  content_hash: string,            // Always visible
  content_encrypted: boolean,      // Always visible
  encryption_authority: string,    // If encrypted, who controls key
  
  signature: string                // Always visible (custody proof)
}

// Forbidden patterns:
- Commits without audit trail
- Authority without discoverable reference
- Rules that execute without visible policy filament
- "Hidden admin" capabilities
```

#### Encrypted Content Rules
```javascript
// If content must be encrypted:
{
  commit_type: 'ENCRYPTED_CONTENT',
  content_encrypted: true,
  encryption_key_id: string,       // Key escrow reference
  decryption_authority: [string],  // Who can decrypt
  retention_policy: string,        // When key is destroyed
  purpose: string,                 // Why encrypted
  audit_metadata: {
    applied_consistently: boolean, // Same rules for all
    retention_enforced: boolean,
    authority_documented: boolean
  }
}

// Audit trail always shows:
- That a thing exists
- Who authorized it
- When it expires
- That it's applied consistently
// But not the content itself
```

#### UI Components
```
AuthorityExplorerPanel:
  - Shows all authority sources in system
  - Filterable by type, scope, expiry
  - "Who can do X?" query interface
  - No hidden capabilities

CommitHistoryPanel:
  - All commits visible (even if content encrypted)
  - Shows: type, author, timestamp, authority
  - "Why is this encrypted?" tooltip
  - "When does this expire?" countdown
```

---

## Principle 5: Policies are Filaments, Not Vibes

### Rule
> "Incentive rules must be policies with purpose, measurement, anti-gaming, simulation, and review."

### Constitutional Lock
**No incentive system activates without: purpose statement, measurement spec, anti-gaming checks, simulation results, and review window.**

### Implementation Delta

#### New Filament Types
```javascript
// PolicyFilament (versioned governance)
policy.<domain>.<scope>.<version> = {
  policy_id: string,
  version: string,                 // Semantic versioning
  purpose: string,                 // Why this policy exists
  measurement_spec: {
    inputs: [string],              // What data is used
    calculation: string,           // Formula/algorithm
    outputs: [string],             // What is measured
    confidence_floor: number       // Min confidence required
  },
  anti_gaming_checks: [string],    // Known exploit mitigations
  simulation_results: {
    scenarios_tested: number,
    pass_rate: number,
    edge_cases: [string],
    gaming_attempts_detected: number
  },
  review_window_days: number,      // How long before re-eval
  authority_ref: string,           // Who approved this
  activation_date: timestamp,
  expiry_date: timestamp
}

// IncentivePolicy (specific to rewards)
policy.incentive.<scope>.<version> = {
  reward_type: string,             // Bonus, recognition, etc.
  kpi_refs: [string],              // Which KPIs trigger this
  calculation_formula: string,
  gates: [string],                 // Must-pass conditions
  penalties: [string],             // Negative triggers
  sandbox_tested: boolean,         // Ran in simulation first
  gaming_resistance_score: number, // 0.0-1.0
  authority_ref: string
}
```

#### New Commit Types
```javascript
// POLICY_PROPOSE commit
{
  type: 'POLICY_PROPOSE',
  policy_id: string,
  version: string,
  purpose: string,
  measurement_spec: object,
  anti_gaming_checks: [string],
  simulation_results: object,      // Must include
  review_window_days: number,
  authority_ref: string,
  timestamp_ms: number
}

// POLICY_ACTIVATE commit (requires simulation proof)
{
  type: 'POLICY_ACTIVATE',
  policy_id: string,
  version: string,
  simulation_proof_ref: string,    // Points to sim results commit
  activation_date: timestamp,
  authority_ref: string,
  signature: string                // Custody signature
}

// POLICY_GAMING_DETECTED commit
{
  type: 'POLICY_GAMING_DETECTED',
  policy_id: string,
  gaming_pattern: string,
  affected_users: [string],
  mitigation_action: string,
  timestamp_ms: number
}
```

#### Sandbox Simulation Requirements
```javascript
// Before any incentive policy activates:
function validatePolicyForActivation(policy) {
  const required_checks = [
    'simulation_scenarios_run',      // Min 100 scenarios
    'edge_cases_tested',             // Min 10 edge cases
    'gaming_attempts_simulated',     // Min 20 exploit attempts
    'false_positive_rate',           // Max 5%
    'unintended_consequences',       // Documented
    'rollback_plan'                  // How to undo if it fails
  ];
  
  // All must pass before activation
  return required_checks.every(check => policy.simulation_results[check]);
}
```

#### UI Components
```
PolicyExplorerPanel:
  - Shows all active policies
  - Version history with diffs
  - Simulation results summary
  - "Why was this approved?" context
  - "When does this expire?" countdown

PolicySimulatorPane:
  - Input: proposed policy
  - Run scenarios: normal, edge, gaming attempts
  - Output: pass/fail + detected issues
  - "Approve for activation" button (enabled only if passes)

IncentiveDebugPanel:
  - Shows KPI → bonus calculation
  - "Why did I get this amount?" breakdown
  - Links to policy filament
  - Gaming detection alerts
```

---

## Principle 6: Indeterminate is a First-Class State

### Rule
> "For unknown tech, Relay enforces: intent/reality/projection separation, confidence floors, indeterminate states."

### Constitutional Lock
**Systems never pretend certainty when confidence is low. INDETERMINATE is a valid, honest answer.**

### Implementation Delta

#### Confidence + State Rules
```javascript
// All derived/projected values must carry:
{
  value: any,
  confidence: number,              // 0.0-1.0
  state: 'VERIFIED' | 'DEGRADED' | 'INDETERMINATE',
  
  // If INDETERMINATE:
  missing_inputs: [string],
  insufficient_data: boolean,
  conflicting_evidence: boolean,
  confidence_too_low: boolean,
  
  // Metadata
  method: string,                  // How was this calculated
  policy_ref: string,              // What rules govern this
  computed_at: timestamp
}

// State determination logic:
function determineState(confidence, missing_inputs, conflicts) {
  if (confidence >= 0.8 && missing_inputs.length === 0 && !conflicts) {
    return 'VERIFIED';
  } else if (confidence >= 0.5) {
    return 'DEGRADED';
  } else {
    return 'INDETERMINATE';
  }
}
```

#### UI Rules for INDETERMINATE
```javascript
// Visual treatment:
VERIFIED:    Green check, full opacity
DEGRADED:    Yellow warning, reduced opacity, show missing data
INDETERMINATE: Gray question mark, minimal opacity, clear "we don't know" message

// User actions allowed:
VERIFIED:     All actions enabled
DEGRADED:     Most actions enabled, warning shown
INDETERMINATE: Read-only, "insufficient data to act" message
```

#### New Commit Types
```javascript
// CONFIDENCE_FLOOR_VIOLATED commit
{
  type: 'CONFIDENCE_FLOOR_VIOLATED',
  metric_name: string,
  required_confidence: number,
  actual_confidence: number,
  missing_inputs: [string],
  action_refused: string,          // What couldn't be done
  timestamp_ms: number
}
```

#### Anti-Pattern Prevention
```javascript
// Forbidden behaviors:
- Display derived values without confidence indicator
- Allow actions based on INDETERMINATE data
- Hide "we don't know" behind vague language
- Pretend low-confidence data is certain
```

---

## Principle 7: Multi-Pane UI for Parallel Branches

### Rule
> "Support native branch comparison. Persist pane layouts as recoverable selection filaments."

### Constitutional Lock
**Users can view parallel realities side-by-side. Workspace layout is saved as commit history.**

### Implementation Delta

#### New Filament Types
```javascript
// SelectionFilament (workspace state)
selection.<user_id>.<workspace_id> = {
  panes: [
    {
      pane_id: 'A',
      view_type: 'NOW',            // Active canon
      branch_ref: 'main',
      scroll_position: number,
      selected_commit: string
    },
    {
      pane_id: 'B',
      view_type: 'FORK',           // Alternative branch
      branch_ref: 'scenario-a',
      comparison_mode: 'diff',
      highlight_changes: true
    },
    {
      pane_id: 'C',
      view_type: 'EVIDENCE',       // Drill-down
      commit_ref: string,
      expanded_sections: [string]
    }
  ],
  layout: 'horizontal' | 'vertical' | 'grid',
  last_modified: timestamp
}
```

#### New Commit Types
```javascript
// WORKSPACE_LAYOUT_SAVE commit
{
  type: 'WORKSPACE_LAYOUT_SAVE',
  user_id: string,
  workspace_id: string,
  panes: [object],
  layout: string,
  timestamp_ms: number
}

// WORKSPACE_LAYOUT_RESTORE commit
{
  type: 'WORKSPACE_LAYOUT_RESTORE',
  user_id: string,
  workspace_id: string,
  restored_from: string,          // Previous workspace commit
  timestamp_ms: number
}
```

#### UI Components
```
MultiPaneWorkspace:
  - 3 draggable/resizable panes (A, B, C)
  - Each pane: independent view (NOW, FORK, EVIDENCE, 3D, etc.)
  - Sync controls: "Link scroll", "Highlight diffs", "Pin ref"
  - Layout presets: side-by-side, top-bottom, grid
  - "Save workspace" button → creates selection commit
  - "Restore workspace" dropdown → loads previous layouts

PaneSelector (per pane):
  - View type: NOW / FORK / EVIDENCE / 3D / GRAPH
  - Branch selector (if applicable)
  - Comparison mode (if FORK)
  - Quick actions: expand, collapse, pin
```

---

## Principle 8: Hard Governance Locks (Non-Negotiable)

### Rule
> "Pressure budget, data minimization, learning-can't-change-policy are mechanically enforced."

### Constitutional Lock
**These cannot be overridden by any user or admin. System refuses before violating.**

### Implementation Delta

#### Pressure Budget Enforcement (Already Specified)
```javascript
// From PRESSURE-BUDGET.json:
{
  max_concurrent_clients: 50,
  max_feed_fanout: 100,
  bandwidth_cap_mbps: 10,
  storage_budget_gb: 500,
  pressure_refuse_at: 0.8
}

// Mechanical refusal:
function canAcceptNewClient(currentLoad) {
  if (currentLoad / maxLoad >= pressure_refuse_at) {
    return {
      accepted: false,
      reason: 'PRESSURE_EXCEEDED',
      retry_after_seconds: 30,
      http_status: 503
    };
  }
  return { accepted: true };
}
```

#### Data Minimization Lock (Lock #8)
```javascript
// All data collection must pass:
function validateDataCollection(request) {
  const checks = [
    hasPurpose(request),           // Why are we collecting this?
    hasRetention(request),         // When is it deleted?
    isMinimal(request),            // Could we collect less?
    hasConsent(request),           // Did user explicitly consent?
    isAggregatable(request),       // Can we anonymize?
    hasPseudonymOption(request)    // Can we use pseudonyms?
  ];
  
  if (!checks.every(c => c === true)) {
    return {
      refused: true,
      reason: 'DATA_MINIMIZATION_VIOLATED',
      failing_checks: checks.filter(c => !c)
    };
  }
}
```

#### Learning Cannot Change Policy Lock
```javascript
// ML/AI systems can only:
- Read data (within purpose limits)
- Generate recommendations (as commits with confidence)
- Suggest policy changes (as PROPOSE commits, not COMMIT)

// ML/AI systems CANNOT:
- Modify policies directly
- Auto-activate new rules
- Change authority scopes
- Override human decisions

function validateMLAction(action) {
  const forbidden = [
    'POLICY_ACTIVATE',
    'AUTHORITY_GRANT',
    'CUSTODY_TRANSFER',
    'BUDGET_OVERRIDE'
  ];
  
  if (forbidden.includes(action.type)) {
    return {
      refused: true,
      reason: 'ML_AUTHORITY_VIOLATION',
      message: 'ML can recommend, not decide'
    };
  }
}
```

#### Audit Lock (All Three Combined)
```javascript
// Every governance decision must be auditable:
function auditGovernanceAction(action) {
  return {
    action_type: string,
    authority_ref: string,          // Who authorized
    policy_ref: string,             // What rule governed
    pressure_state: string,         // Was system under pressure?
    data_minimized: boolean,        // Did we collect minimum?
    human_in_loop: boolean,         // Was human involved?
    ml_recommendation: object,      // If ML suggested, what was it?
    timestamp_ms: number,
    signature: string               // Custody proof
  };
}
```

---

## Implementation Priority Order

### Phase 1: Constitutional Foundation (Week 1)
1. Commit boundary UI (Principle 1)
2. Indeterminate state enforcement (Principle 6)
3. Hidden authority prevention (Principle 4)

### Phase 2: Privacy & Consent (Week 2)
1. Proximity consent system (Principle 3)
2. Data minimization locks (Principle 8)
3. Audit trail expansion

### Phase 3: Policy & Governance (Week 3)
1. Policy filament system (Principle 5)
2. Sandbox simulation harness
3. Learning governance locks (Principle 8)

### Phase 4: Education & UX (Week 4)
1. Learning filaments + stage gates (Principle 2)
2. Multi-pane workspace (Principle 7)
3. Pressure budget UI

---

## Success Criteria

### For Each Principle
- [ ] Commit types defined and implemented
- [ ] Filament schemas created
- [ ] UI components built and tested
- [ ] Mechanical enforcement verified (cannot be bypassed)
- [ ] Documentation complete
- [ ] Test cases pass

### For Constitutional Lock
- [ ] Violation attempts are refused (not warned)
- [ ] Refusal reasons are clear and actionable
- [ ] Audit trail is complete
- [ ] No backdoors or overrides exist

---

## Files to Create/Modify

### New Files
- `src/backend/commitTypes/stateTransition.mjs`
- `src/backend/commitTypes/dialogue.mjs`
- `src/backend/commitTypes/learningProgress.mjs`
- `src/backend/commitTypes/proximityConsent.mjs`
- `src/backend/commitTypes/policyPropose.mjs`
- `src/backend/filaments/learningFilament.mjs`
- `src/backend/filaments/proximityFilament.mjs`
- `src/backend/filaments/policyFilament.mjs`
- `src/backend/filaments/selectionFilament.mjs`
- `src/backend/governance/pressureBudget.mjs`
- `src/backend/governance/dataMinimization.mjs`
- `src/backend/governance/mlAuthorityLimits.mjs`
- `src/frontend/components/CommitBoundaryPanel.jsx`
- `src/frontend/components/MultiPaneWorkspace.jsx`
- `src/frontend/components/ProximitySettingsPanel.jsx`
- `src/frontend/components/PolicyExplorerPanel.jsx`

### Modified Files
- `src/backend/routes/index.mjs` (add new endpoints)
- `src/frontend/App.jsx` (integrate new panels)
- `CANON-INVARIANTS.md` (add new invariant checks)
- `RELAY-VAULT-GUARDIAN-SPEC.md` (add new bundle validations)

---

## Completion Checklist

- [ ] All 8 principles have concrete implementations
- [ ] All commit types are defined and validated
- [ ] All filament types have schemas
- [ ] All UI components are designed
- [ ] All governance locks are mechanically enforced
- [ ] All test cases pass
- [ ] Documentation is complete
- [ ] No principle can be violated accidentally

---

**This delta spec is now constitutional. Changes to these principles require explicit constitutional amendment process.**

**Status:** READY FOR IMPLEMENTATION  
**Next:** Begin Phase 1 (Constitutional Foundation)
