# 🔒 RELAY ENFORCEMENT CONTRACTS - CANON 1307

**Status**: STAGE 1 CRITICAL (MUST IMPLEMENT BEFORE STAGE 2)  
**Date**: 2026-02-04  
**Source**: 04.02.2026 MD Canon 1307  
**Purpose**: Turn principles into hard defaults + lintable contracts + first-class objects

**⚠️ CRITICAL**: These are not optional features. These are **architectural invariants** that prevent:
- ❌ 2D shortcuts (UI=truth)
- ❌ Accidental surveillance
- ❌ Ungoverned learning
- ❌ Authority re-centralization
- ❌ Audit-storm weaponization

---

## 🎯 THE 9 ENFORCEMENT MECHANISMS

### **Missing Work = Not Philosophy, But Enforcement**

The principles exist. The enforcement doesn't.

**This document specifies the exact enforcement contracts Canon must implement.**

---

## 1️⃣ STATE ANCHORING CONTRACTS (SAC)

### **Problem**
"Capturing operating state" sounds like surveillance/takeover, even if mechanics are safe.

### **Solution**
Make every 2D integration **opt-in and scoped** via a State Anchoring Contract.  
**Anything not declared is invisible.**

---

### **Implementation**

**New Object**: `integration.anchor_contract.<id>`

```yaml
anchor_contract:
  id: "sap-approvals-2026-q1"
  type: "STATE_ANCHORING_CONTRACT"
  
  # REQUIRED: What state types are anchored
  anchored_state_types:
    - "approval_workflows"
    - "procurement_configs"
    - "build_triggers"
  
  # REQUIRED: How often attestations occur
  attestation_frequency:
    frequency: "daily"
    max_delay: "24h"
  
  # REQUIRED: How long data is kept
  retention_policy:
    duration: "90d"
    after_retention: "delete"  # or "archive_encrypted"
  
  # REQUIRED: What gets redacted
  redaction_policy:
    redact_fields: ["user_email", "ip_address"]
    pseudonymize: true
    aggregation_level: "team"  # not "individual"
  
  # REQUIRED: Authority and expiry
  authority:
    issued_by: "integration@acme.com"
    issued_at: "2026-01-15T00:00:00Z"
    expires_at: "2026-12-31T23:59:59Z"
    renewal_required: true
  
  # REQUIRED: Audit trail
  created_at: "2026-01-15T10:00:00Z"
  last_attested: "2026-02-04T08:00:00Z"
  attestation_count: 20
```

---

### **Hard Enforcement**

**Rule**: Any telemetry/event without a matching contract → **REFUSAL**

```javascript
// Backend enforcement
function validateTelemetry(event) {
  const contract = findMatchingContract(event.type);
  
  if (!contract) {
    return {
      allowed: false,
      reason: "NO_ANCHORING_CONTRACT",
      message: "No State Anchoring Contract found for event type: " + event.type,
      next_steps: [
        "Create SAC via /api/contracts/anchor",
        "Declare anchored_state_types",
        "Set retention + redaction policies"
      ]
    };
  }
  
  if (contract.expired) {
    return {
      allowed: false,
      reason: "CONTRACT_EXPIRED",
      message: "Anchoring contract expired on: " + contract.expires_at,
      next_steps: ["Renew contract", "Justify continued anchoring"]
    };
  }
  
  return { allowed: true };
}
```

---

### **Lint Rule**

**LINT-SAC-001: ANCHOR_CONTRACT_REQUIRED**

```yaml
rule: "ANCHOR_CONTRACT_REQUIRED"
severity: "BLOCK_DEPLOY"
description: "All 2D integrations must have State Anchoring Contract"

checks:
  - file: "src/integrations/**/*.mjs"
    pattern: "telemetry|event|capture|sync"
    requires:
      - contract_reference: true
      - anchored_state_types: true
      - retention_policy: true
      - redaction_policy: true

violation:
  message: "2D integration found without State Anchoring Contract"
  remedy: "Create SAC with anchored_state_types, retention, redaction"
  example: |
    // ❌ BAD
    telemetry.send({type: "approval", user: email});
    
    // ✅ GOOD
    const contract = await getSAC("sap-approvals-2026-q1");
    if (contract.allows("approval")) {
      telemetry.send({
        type: "approval",
        user: contract.pseudonymize(email),
        contract_id: contract.id
      });
    }
```

---

### **UI Enforcement**

**Integration Dashboard** must show:
- All active SACs
- Expiry dates (visual countdown)
- Attestation status
- Redaction policy summary

**Example UI:**
```
State Anchoring Contracts:
┌────────────────────────────────────────────┐
│ SAP Approvals (expires in 300 days)   ✓   │
│   Types: approvals, configs, builds        │
│   Retention: 90d, then delete              │
│   Redaction: email, IP pseudonymized       │
│   Last attested: 2h ago                    │
└────────────────────────────────────────────┘
```

---

## 2️⃣ DRIFT AS FIRST-CLASS FILAMENT

### **Problem**
Teams can psychologically ignore warnings.

### **Solution**
**Drift occupies space/time/capacity until closed.**

---

### **Implementation**

**New Filament**: `drift.<id>`

```yaml
drift:
  id: "drift_abc123"
  type: "DRIFT_OBJECT"
  
  # WHERE: What system/component is drifting
  source:
    type: "cache"  # cache|index|ui|job|formula|api
    component: "approval_cache"
    location: "src/cache/approvalCache.mjs"
  
  # WHAT: What is the truth reference
  truth_ref:
    type: "database"
    table: "approvals"
    query: "SELECT * FROM approvals WHERE status='pending'"
  
  # WHEN: Timeline
  first_seen: "2026-02-01T14:30:00Z"
  last_checked: "2026-02-04T08:00:00Z"
  age_hours: 72
  
  # IMPACT: Scope and severity
  impact_scope:
    users_affected: 15
    systems_affected: ["approval_ui", "dashboard"]
    business_impact: "medium"
  
  # CONFIDENCE: How certain are we?
  confidence:
    score: 0.85
    basis: "Automated cache comparison"
  
  # STATE: Current status
  status: "open"  # open|investigating|repairing|closed
  
  # CAPACITY: Resources consumed
  capacity_consumed:
    pressure_points: 10  # consumes pressure budget
    attention_units: 2    # requires human attention
  
  # BLOCKING: What is blocked
  blocks:
    finalization: true    # Cannot finalize commits
    deployments: false    # Does not block deploys (yet)
  
  # RESOLUTION: How to close
  resolution_options:
    - type: "repair"
      action: "Invalidate cache, rebuild from DB"
      authority_required: "ops"
    - type: "dismiss"
      action: "Accept drift as intentional"
      authority_required: "architect"
      justification_required: true
```

---

### **Hard Enforcement**

**Rule**: Drift blocks finalization + consumes capacity

```javascript
// Backend enforcement
function canFinalize(commit) {
  const openDrifts = getDriftObjects({
    status: "open",
    affects: commit.scope
  });
  
  if (openDrifts.length > 0) {
    return {
      allowed: false,
      reason: "OPEN_DRIFT_OBJECTS",
      message: `${openDrifts.length} open drift object(s) block finalization`,
      drifts: openDrifts.map(d => ({
        id: d.id,
        source: d.source.component,
        age_hours: d.age_hours,
        resolution_options: d.resolution_options
      })),
      next_steps: [
        "Investigate drift objects",
        "Repair drift OR",
        "Dismiss with justification (requires authority)"
      ]
    };
  }
  
  return { allowed: true };
}
```

---

### **Capacity Consumption**

```yaml
pressure_budget:
  global:
    max_concurrent_drifts: 10
    current: 3  # 3 open drifts
    remaining: 7
  
  per_system:
    approval_cache:
      max_concurrent_drifts: 3
      current: 1
      remaining: 2
  
  violation:
    if: current >= max_concurrent_drifts
    then: "refusal"
    message: "Drift capacity exhausted. Resolve existing drifts before creating new ones."
```

---

### **Lint Rule**

**LINT-DRIFT-001: DRIFT_OBJECTS_REQUIRED**

```yaml
rule: "DRIFT_OBJECTS_REQUIRED"
severity: "BLOCK_DEPLOY"
description: "Cache/index mismatches must create drift objects (not warnings)"

checks:
  - file: "src/cache/**/*.mjs"
    function: "validateCache|checkCacheConsistency"
    requires:
      - on_mismatch: "createDriftObject"
      - no_silent_warnings: true

violation:
  message: "Cache validation found but no drift object creation"
  remedy: "Replace console.warn with createDriftObject()"
  example: |
    // ❌ BAD
    if (cache !== db) {
      console.warn("Cache drift detected");
    }
    
    // ✅ GOOD
    if (cache !== db) {
      await createDriftObject({
        source: {type: "cache", component: "approval_cache"},
        truth_ref: {type: "database", table: "approvals"},
        confidence: 0.90
      });
    }
```

---

### **UI Enforcement**

**Drift Dashboard** (always visible):

```
Drift Objects (3 open):
┌────────────────────────────────────────────┐
│ ⚠️ Approval Cache Drift (72h old)          │
│   Affects: 15 users, 2 systems             │
│   Options: [Repair] [Dismiss w/ Auth]     │
├────────────────────────────────────────────┤
│ ⚠️ Formula Mismatch (12h old)              │
│   Affects: Budget sheet, 1 system          │
│   Options: [Recalculate] [Investigate]    │
└────────────────────────────────────────────┘

Capacity: 3/10 drifts (7 remaining)
```

---

## 3️⃣ AUTHORITY DECAY (MANDATORY)

### **Problem**
Even without "admin fixes," authority can accumulate socially over time.

### **Solution**
**Every authorityRef must be time-bounded.**  
**Renewal = new commit + justification.**

---

### **Implementation**

**AuthorityRef Object** (REQUIRED fields):

```yaml
authorityRef:
  id: "auth_abc123"
  
  # REQUIRED: Who & What
  user: "ops@acme.com"
  role: "deployment_authority"
  scope: "production"
  
  # REQUIRED: Timeline
  issued_at: "2026-01-15T00:00:00Z"
  expires_at: "2026-02-15T00:00:00Z"  # 30 days max
  
  # REQUIRED: Renewal tracking
  renewal_count: 2
  previous_expires_at: "2026-01-15T00:00:00Z"
  renewal_justification: "Continued ops rotation for Q1 deployment cycle"
  
  # OPTIONAL: Conditions
  conditions:
    max_actions_per_day: 10
    require_two_factor: true
    audit_all_actions: true
```

---

### **Hard Enforcement**

**Rule**: Expired authority → **REFUSAL**

```javascript
// Backend enforcement
function checkAuthority(user, action) {
  const auth = getAuthority(user, action.type);
  
  if (!auth) {
    return {
      allowed: false,
      reason: "NO_AUTHORITY",
      message: "User has no authority for action: " + action.type,
      next_steps: ["Request authority grant", "Provide justification"]
    };
  }
  
  const now = Date.now();
  const expiresAt = new Date(auth.expires_at).getTime();
  
  if (now > expiresAt) {
    return {
      allowed: false,
      reason: "AUTHORITY_EXPIRED",
      message: "Authority expired on: " + auth.expires_at,
      expired_since: formatDuration(now - expiresAt),
      next_steps: [
        "Request renewal",
        "Provide justification for continued authority",
        "Alternative: Rotate role to another user"
      ]
    };
  }
  
  // Visual warning if expiring soon
  const hoursRemaining = (expiresAt - now) / (1000 * 60 * 60);
  if (hoursRemaining < 48) {
    return {
      allowed: true,
      warning: "AUTHORITY_EXPIRING_SOON",
      expires_in_hours: hoursRemaining,
      recommend: "Schedule renewal or rotation"
    };
  }
  
  return { allowed: true };
}
```

---

### **Renewal Process**

```yaml
renewal_commit:
  type: "AUTHORITY_RENEWAL"
  
  authorityRef: "auth_abc123"
  
  justification:
    reason: "Continued ops rotation for Q1 deployment cycle"
    alternative_considered: "Rotation to ops2@acme.com considered, scheduled for Feb 15"
    business_need: "Active deployment cycle requires stable authority"
  
  new_expiry:
    extends_from: "2026-02-15T00:00:00Z"
    extends_to: "2026-03-15T00:00:00Z"
    max_duration: "30d"
  
  attestation:
    approver: "manager@acme.com"
    approved_at: "2026-02-10T14:00:00Z"
```

---

### **Lint Rule**

**LINT-AUTH-001: AUTHORITY_DECAY_REQUIRED**

```yaml
rule: "AUTHORITY_DECAY_REQUIRED"
severity: "BLOCK_DEPLOY"
description: "All authorityRef objects must have expires_at timestamp"

checks:
  - file: "src/**/*.mjs"
    object_type: "authorityRef"
    requires:
      - issued_at: true
      - expires_at: true
      - max_duration: "30d"

violation:
  message: "AuthorityRef found without expires_at timestamp"
  remedy: "Add expires_at field (max 30 days from issued_at)"
  example: |
    // ❌ BAD
    const auth = {
      user: "ops@acme.com",
      role: "deployment_authority"
      // Missing expires_at!
    };
    
    // ✅ GOOD
    const auth = {
      user: "ops@acme.com",
      role: "deployment_authority",
      issued_at: "2026-01-15T00:00:00Z",
      expires_at: "2026-02-15T00:00:00Z"  // 30 days max
    };
```

---

### **UI Enforcement**

**Authority HUD** (always visible):

```
Your Authority:
┌────────────────────────────────────────────┐
│ Deployment Authority (production)          │
│   Expires: Feb 15, 2026 (11 days) ⚠️       │
│   [Renew] [Rotate to Another User]        │
├────────────────────────────────────────────┤
│ Budget Approval (procurement)              │
│   Expires: Mar 1, 2026 (25 days) ✓        │
└────────────────────────────────────────────┘
```

**Visual dimming** as expiry approaches:
- 7+ days: ✓ (green, full brightness)
- 2-7 days: ⚠️ (yellow, 70% brightness)
- <2 days: 🔴 (red, 50% brightness, pulsing)

---

## 4️⃣ LEARNING BOUNDARY (TYPE-LEVEL FREEZE)

### **Problem**
Without hard enforcement, "learning" can mutate policy.

### **Solution**
**Make it technically impossible to "learn into policy."**

---

### **Implementation**

**New Commit Types**:

```yaml
commit_types:
  # Learning outputs (NO execution authority)
  - type: "POLICY_RECOMMENDATION"
    authority: "learning_module"
    execution: false
    description: "ML/analytics suggests policy change"
    
  - type: "STAGE_READINESS_REPORT"
    authority: "learning_module"
    execution: false
    description: "System suggests stage gate advancement"
  
  # Policy inputs (requires human approval)
  - type: "POLICY_PROPOSAL"
    authority: "governance_role"
    execution: false
    description: "Human proposes policy change (may reference recommendations)"
  
  # Execution (ONLY commit type that changes behavior)
  - type: "POLICY_APPLIED"
    authority: "governance_role"
    execution: true
    description: "Human applies policy change (executed by system)"
```

---

### **Hard Enforcement**

**Rule**: Only `POLICY_APPLIED` affects execution. Learning modules **cannot** emit it.

```javascript
// Backend enforcement
function applyCommit(commit) {
  // Check commit type
  if (commit.type === "POLICY_RECOMMENDATION" || 
      commit.type === "STAGE_READINESS_REPORT") {
    // Learning outputs NEVER execute
    return {
      recorded: true,
      executed: false,
      message: "Recommendation recorded. Requires POLICY_APPLIED commit to execute.",
      next_steps: [
        "Review recommendation",
        "Create POLICY_PROPOSAL (human)",
        "If approved → POLICY_APPLIED (human)"
      ]
    };
  }
  
  if (commit.type === "POLICY_APPLIED") {
    // Check authority
    if (commit.authority.role !== "governance_role") {
      return {
        allowed: false,
        reason: "INVALID_AUTHORITY",
        message: "Only governance_role can emit POLICY_APPLIED commits",
        provided_role: commit.authority.role
      };
    }
    
    // Execute
    return {
      recorded: true,
      executed: true,
      message: "Policy applied and executed"
    };
  }
  
  // All other commit types: record but don't execute policy changes
  return {
    recorded: true,
    executed: false
  };
}
```

---

### **Lint Rule**

**LINT-LEARN-001: NO_POLICY_MUTATION_FROM_LEARNING**

```yaml
rule: "NO_POLICY_MUTATION_FROM_LEARNING"
severity: "BLOCK_DEPLOY"
description: "Learning modules cannot emit POLICY_APPLIED commits"

checks:
  - file: "src/learning/**/*.mjs"
    module_type: "learning|ml|analytics"
    forbidden_commits: ["POLICY_APPLIED"]
    allowed_commits: ["POLICY_RECOMMENDATION", "STAGE_READINESS_REPORT"]

violation:
  message: "Learning module attempts to emit POLICY_APPLIED commit"
  remedy: "Change to POLICY_RECOMMENDATION. Humans must approve via POLICY_APPLIED."
  example: |
    // ❌ BAD (in learning module)
    await createCommit({
      type: "POLICY_APPLIED",
      policy: "increase_budget_threshold"
    });
    
    // ✅ GOOD (in learning module)
    await createCommit({
      type: "POLICY_RECOMMENDATION",
      recommendation: {
        policy: "increase_budget_threshold",
        reason: "97% of requests are below $5K",
        confidence: 0.92
      }
    });
    
    // ✅ GOOD (in governance module, after human approval)
    await createCommit({
      type: "POLICY_APPLIED",
      policy: "increase_budget_threshold",
      value: "$5000",
      references_recommendation: "rec_abc123",
      approved_by: "governance@acme.com"
    });
```

---

### **UI Enforcement**

**Recommendation Dashboard**:

```
Policy Recommendations (3 pending):
┌────────────────────────────────────────────┐
│ 📊 Increase Budget Threshold to $5K        │
│   Reason: 97% of requests below threshold  │
│   Confidence: 92%                          │
│   [Review] [Propose Policy] [Dismiss]     │
├────────────────────────────────────────────┤
│ 📊 Advance to Stage Gate 2                │
│   Reason: All Stage 1 criteria met        │
│   Confidence: 88%                          │
│   [Review Evidence] [Propose] [Defer]     │
└────────────────────────────────────────────┘

⚠️ Recommendations do NOT execute automatically.
   Human governance required for policy changes.
```

---

## 5️⃣ REFUSAL-FIRST UX

### **Problem**
"Relay feels hostile" perception if refusals are unclear.

### **Solution**
**Buttons/actions disabled by default. Enablement requires proof.**

---

### **Implementation**

**Every Action Element**:

```jsx
<ActionButton
  action="approve_budget"
  disabled={!hasAuthority() || driftExists() || budgetExhausted()}
  refusalReason={getRefusalReason()}
  nextSteps={getNextSteps()}
>
  Approve Budget
</ActionButton>
```

**Refusal Object**:

```yaml
refusal:
  action: "approve_budget"
  allowed: false
  
  reasons:
    - type: "NO_AUTHORITY"
      message: "User lacks 'budget_approval' authority"
      expires_at: null
    - type: "OPEN_DRIFT"
      message: "2 open drift objects block approval"
      drift_ids: ["drift_abc123", "drift_def456"]
    - type: "CAPACITY_EXHAUSTED"
      message: "Pressure budget exhausted (10/10 disputes)"
      resets_at: "2026-02-05T00:00:00Z"
  
  next_steps:
    - "Request budget_approval authority"
    - "Resolve 2 open drift objects"
    - "Wait for pressure budget reset (tomorrow)"
  
  documentation:
    url: "/docs/approvals/why-blocked"
    related_invariants: ["INV-1: Pressure Budget", "INV-5: Policy Governance"]
```

---

### **Hard Enforcement**

**Rule**: Every disabled action MUST show why, what's missing, next step.

```javascript
// Frontend enforcement
function renderAction(action) {
  const check = canExecuteAction(action);
  
  if (!check.allowed) {
    return (
      <Tooltip
        content={
          <RefusalExplanation
            reasons={check.reasons}
            nextSteps={check.next_steps}
            documentation={check.documentation}
          />
        }
      >
        <Button disabled>
          {action.label} 🔒
        </Button>
      </Tooltip>
    );
  }
  
  return (
    <Button onClick={() => executeAction(action)}>
      {action.label} ✓
    </Button>
  );
}
```

---

### **UI Example**

**Disabled Button** (hover shows):

```
[Approve Budget] 🔒

Why blocked:
  ❌ No authority (budget_approval role required)
  ❌ 2 open drift objects
  ❌ Pressure budget exhausted (10/10)

What's missing:
  • Authority: Request from governance@acme.com
  • Drift: Resolve drift_abc123, drift_def456
  • Capacity: Wait for reset (tomorrow at midnight)

Next steps:
  1. Resolve drift objects first (highest priority)
  2. Request authority renewal
  3. Check pressure budget tomorrow

Learn more: /docs/approvals/why-blocked
```

---

### **Lint Rule**

**LINT-UX-001: REFUSAL_EXPLANATION_REQUIRED**

```yaml
rule: "REFUSAL_EXPLANATION_REQUIRED"
severity: "BLOCK_DEPLOY"
description: "All disabled actions must explain why + next steps"

checks:
  - file: "src/frontend/components/**/*.jsx"
    component_type: "Button|ActionButton"
    when: "disabled === true"
    requires:
      - refusalReason: true
      - nextSteps: true

violation:
  message: "Disabled button found without refusal explanation"
  remedy: "Add refusalReason and nextSteps props"
  example: |
    // ❌ BAD
    <Button disabled>Approve</Button>
    
    // ✅ GOOD
    <Button
      disabled={!canApprove()}
      refusalReason="No authority: budget_approval required"
      nextSteps={["Request authority", "Resolve drift"]}
    >
      Approve
    </Button>
```

---

## 6️⃣ HIERARCHICAL PRESSURE BUDGETS

### **Problem**
Flat pressure budgets allow "audit-storm weaponization."

### **Solution**
**Budgets scoped: Global → Org → Team → System → Object**

---

### **Implementation**

**Pressure Budget Hierarchy**:

```yaml
pressure_budgets:
  global:
    max_audit_frequency: "1000/hour"
    max_concurrent_disputes: 100
    cooldown_after_dispute: "24h"
    current_usage: 45
    
  org:
    acme_corp:
      max_audit_frequency: "500/hour"
      max_concurrent_disputes: 50
      cooldown_after_dispute: "24h"
      current_usage: 20
  
  team:
    procurement:
      max_audit_frequency: "100/hour"
      max_concurrent_disputes: 10
      cooldown_after_dispute: "12h"
      current_usage: 3
  
  system:
    approval_workflow:
      max_audit_frequency: "50/hour"
      max_concurrent_disputes: 5
      cooldown_after_dispute: "6h"
      current_usage: 2
  
  object:
    approval_abc123:
      max_audit_frequency: "10/hour"
      max_concurrent_disputes: 1
      cooldown_after_dispute: "1h"
      current_usage: 0
```

---

### **Hard Enforcement**

**Rule**: Violation → refusal, visible as "capacity exhausted"

```javascript
// Backend enforcement
function checkPressureBudget(action, scope) {
  const budgets = getPressureBudgets(scope);  // [global, org, team, system, object]
  
  for (const budget of budgets) {
    // Check frequency limit
    const recentActions = countRecentActions(budget.scope, "1h");
    if (recentActions >= budget.max_audit_frequency_per_hour) {
      return {
        allowed: false,
        reason: "PRESSURE_BUDGET_FREQUENCY_EXCEEDED",
        scope: budget.scope,
        message: `Audit frequency limit reached for ${budget.scope}`,
        limit: budget.max_audit_frequency_per_hour,
        current: recentActions,
        resets_at: budget.frequency_reset_time,
        next_steps: [
          "Wait for frequency window reset",
          "Batch audits to reduce pressure",
          "Request budget increase (requires justification)"
        ]
      };
    }
    
    // Check concurrent disputes
    const openDisputes = countOpenDisputes(budget.scope);
    if (openDisputes >= budget.max_concurrent_disputes) {
      return {
        allowed: false,
        reason: "PRESSURE_BUDGET_DISPUTES_EXCEEDED",
        scope: budget.scope,
        message: `Concurrent dispute limit reached for ${budget.scope}`,
        limit: budget.max_concurrent_disputes,
        current: openDisputes,
        next_steps: [
          "Resolve existing disputes",
          "Close or merge related disputes",
          "Wait for cooldown period"
        ]
      };
    }
  }
  
  return { allowed: true };
}
```

---

### **UI Example**

**Pressure Budget Dashboard**:

```
Pressure Budgets:
┌────────────────────────────────────────────┐
│ Global: 45/100 disputes (55 remaining) ✓   │
│ Org (Acme): 20/50 disputes (30 rem.) ✓    │
│ Team (Procurement): 3/10 disputes ✓        │
│ System (Approvals): 2/5 disputes ✓        │
│ Object (abc123): 0/1 disputes ✓           │
└────────────────────────────────────────────┘

Audit Frequency (last hour):
  Global: 120/1000 (88% available)
  Team: 8/100 (92% available)
```

**When exhausted**:

```
⚠️ Pressure Budget Exhausted
  Scope: Team (Procurement)
  Limit: 10/10 concurrent disputes
  
  Cannot create new disputes until:
    • Existing disputes are resolved OR
    • Cooldown period ends (tomorrow)
  
  Recommended:
    • Resolve drift_abc123 (oldest, 72h)
    • Merge related disputes
    • Batch future audits
```

---

## 7️⃣ TRUTH CUTOVER (ONE-WAY, PER DOMAIN)

### **Problem**
Hybrid 2D/Relay creates "dual authority" limbo.

### **Solution**
**For each domain, define a Truth Cutover Point.**  
**After cutover: Relay is authoritative, 2D becomes projection-only.**

---

### **Implementation**

**Truth Cutover Declaration**:

```yaml
truth_cutover:
  domain: "procurement_approvals"
  
  # Before cutover
  before:
    relay_status: "shadow_mode"
    relay_writes: "logged_but_not_authoritative"
    2d_status: "authoritative"
    2d_writes: "executed"
  
  # Cutover event
  cutover:
    commit_id: "commit_xyz789"
    timestamp: "2026-03-01T00:00:00Z"
    approved_by: ["governance@acme.com", "ops@acme.com"]
    criteria_met:
      - "30 days shadow mode complete"
      - "Zero drift between Relay and 2D"
      - "All stakeholders trained"
      - "Rollback plan documented"
  
  # After cutover
  after:
    relay_status: "authoritative"
    relay_writes: "executed"
    2d_status: "projection_only"
    2d_writes: "refused_and_logged"
    
  # Enforcement
  enforcement:
    after_cutover:
      2d_write_attempts: "refuse"
      refusal_reason: "Relay is authoritative after cutover on 2026-03-01"
      redirect_to: "/relay/approvals"
```

---

### **Hard Enforcement**

**Rule**: After cutover, 2D writes → refused & logged

```javascript
// Backend enforcement (in 2D integration layer)
function handle2DWrite(domain, data) {
  const cutover = getTruthCutover(domain);
  
  if (!cutover) {
    // No cutover defined yet, allow 2D writes
    return { allowed: true };
  }
  
  const now = Date.now();
  const cutoverTime = new Date(cutover.timestamp).getTime();
  
  if (now < cutoverTime) {
    // Before cutover: 2D authoritative
    await write2D(data);
    await logToRelay(data, {mode: "shadow"});
    return { allowed: true, mode: "2D_authoritative" };
  }
  
  // After cutover: Relay authoritative, 2D writes refused
  await logRefusal({
    domain: domain,
    attempted_write: data,
    reason: "AFTER_TRUTH_CUTOVER",
    cutover_date: cutover.timestamp,
    commit_id: cutover.commit_id
  });
  
  return {
    allowed: false,
    reason: "TRUTH_CUTOVER_ENFORCED",
    message: `Relay became authoritative for ${domain} on ${cutover.timestamp}`,
    cutover_commit: cutover.commit_id,
    redirect_to: `/relay/${domain}`,
    next_steps: [
      "Use Relay interface for all writes",
      "2D system is now read-only (projection)",
      "To revert cutover, requires governance approval"
    ]
  };
}
```

---

### **Lint Rule**

**LINT-CUTOVER-001: NO_DUAL_AUTHORITY_AFTER_CUTOVER**

```yaml
rule: "NO_DUAL_AUTHORITY_AFTER_CUTOVER"
severity: "BLOCK_DEPLOY"
description: "After cutover, 2D writes must be refused"

checks:
  - file: "src/integrations/**/*.mjs"
    function: "write|update|sync"
    requires:
      - check_cutover: true
      - refuse_if_after_cutover: true

violation:
  message: "2D write function does not check cutover status"
  remedy: "Add getTruthCutover check, refuse writes after cutover"
  example: |
    // ❌ BAD
    function write2DApproval(data) {
      await db.write(data);  // No cutover check!
    }
    
    // ✅ GOOD
    function write2DApproval(data) {
      const cutover = getTruthCutover("approvals");
      if (cutover && Date.now() > cutover.timestamp) {
        throw new Error("Relay is authoritative after cutover. Use /relay/approvals");
      }
      await db.write(data);
    }
```

---

### **UI Example**

**Before Cutover**:
```
Mode: Shadow (2D authoritative)
  All writes go to 2D system
  Relay logs for verification
  Cutover planned: Mar 1, 2026 (25 days)
```

**After Cutover**:
```
Mode: Relay Authoritative
  Cutover completed: Mar 1, 2026
  All writes must use Relay
  2D system is read-only (projection)
  
  ⚠️ Attempted 2D write blocked:
    User tried to approve in old system
    Redirected to /relay/approvals
```

---

## 8️⃣ PRIVACY & MINIMIZATION (ENTERPRISE BLOCKERS)

### **Problem**
Without enforcement, "pressure as verification" can drift into "pressure as surveillance."

### **Solution**
**Aggregated-by-default telemetry + time-bounded retention + pseudonymization.**

---

### **Implementation**

**Telemetry Schema**:

```yaml
telemetry_config:
  default_mode: "aggregated"  # NOT "raw"
  
  # Raw telemetry (opt-in, time-bounded)
  raw_telemetry:
    allowed: true
    requires:
      - explicit_consent: true
      - justification: "Debug production issue"
      - retention: "7d"  # Max 7 days
      - redaction: ["email", "ip", "user_agent"]
      - pseudonymization: true
  
  # Aggregated telemetry (default)
  aggregated_telemetry:
    level: "team"  # NOT "individual"
    fields:
      - "approval_count_per_team"
      - "average_response_time"
      - "error_rate_by_component"
    excluded_fields:
      - "user_id"
      - "user_email"
      - "ip_address"
  
  # Role-based views
  views:
    auditor:
      can_see: ["raw_pseudonymized", "aggregated"]
      retention: "90d"
    ops:
      can_see: ["aggregated", "error_logs"]
      retention: "30d"
    executive:
      can_see: ["aggregated_only"]
      retention: "365d"
```

---

### **Hard Enforcement**

**Rule**: Raw telemetry requires explicit opt-in + time-bound retention

```javascript
// Backend enforcement
function logTelemetry(event, options = {}) {
  const config = getTelemetryConfig(event.type);
  
  // Check if raw telemetry allowed
  if (options.mode === "raw") {
    if (!config.raw_telemetry.allowed) {
      return {
        logged: false,
        reason: "RAW_TELEMETRY_DISABLED",
        message: "Raw telemetry not allowed for this event type",
        alternative: "Use aggregated mode"
      };
    }
    
    // Check consent
    if (!options.explicit_consent) {
      return {
        logged: false,
        reason: "EXPLICIT_CONSENT_REQUIRED",
        message: "Raw telemetry requires explicit user consent",
        next_steps: ["Obtain consent", "Document justification"]
      };
    }
    
    // Apply redaction + pseudonymization
    const redacted = applyRedaction(event, config.raw_telemetry.redaction);
    const pseudonymized = applyPseudonymization(redacted);
    
    // Log with retention limit
    await logWithRetention(pseudonymized, {
      retention: config.raw_telemetry.retention,
      delete_after: config.raw_telemetry.retention
    });
    
    return { logged: true, mode: "raw_pseudonymized" };
  }
  
  // Default: aggregated
  const aggregated = aggregateEvent(event, config.aggregated_telemetry.level);
  await log(aggregated);
  
  return { logged: true, mode: "aggregated" };
}
```

---

### **Lint Rule**

**LINT-PRIVACY-001: TELEMETRY_MINIMIZATION_REQUIRED**

```yaml
rule: "TELEMETRY_MINIMIZATION_REQUIRED"
severity: "BLOCK_DEPLOY"
description: "All telemetry must define retention + redaction policies"

checks:
  - file: "src/telemetry/**/*.mjs"
    function: "log|track|send"
    requires:
      - retention_policy: true
      - redaction_policy: true
      - aggregation_level: true

violation:
  message: "Telemetry function missing retention/redaction policy"
  remedy: "Add retention_policy and redaction_policy to telemetry config"
  example: |
    // ❌ BAD
    telemetry.log({
      user: email,
      action: "approval"
    });
    
    // ✅ GOOD
    telemetry.log({
      action: "approval",
      team: getTeamId(email)  // Aggregated, not individual
    }, {
      retention: "30d",
      redaction: ["email", "ip"],
      level: "team"
    });
```

---

### **UI Example**

**Telemetry Dashboard** (for admins):

```
Telemetry Configuration:
┌────────────────────────────────────────────┐
│ Default Mode: Aggregated (team-level) ✓   │
│ Raw Mode: Opt-in only, 7d retention       │
│ Redacted Fields: email, IP, user agent    │
│ Pseudonymization: Enabled ✓               │
└────────────────────────────────────────────┘

Current Retention:
  Auditor view: 90 days
  Ops view: 30 days
  Executive view: 365 days (aggregated only)
```

**User Consent** (when raw telemetry needed):

```
⚠️ Raw Telemetry Consent Required

We need to temporarily collect raw logs to debug:
  "Production approval workflow errors"

What will be collected:
  • Your actions (timestamped)
  • Error messages
  • System performance data

What will NOT be collected:
  • Email (pseudonymized)
  • IP address (redacted)
  • Personal identifiers

Retention: 7 days, then auto-deleted
Purpose: Debug only, not surveillance

[Consent] [Decline] [Learn More]
```

---

## 9️⃣ HUMAN FLOW CONTROL V2 (WIRED TO ENFORCEMENT)

### **Problem**
Without enforcement, "narrative domination" and "bureaucracy weaponization" remain possible.

### **Solution**
**Wire Human Flow Control v2 primitives into lint enforcement pipeline.**

---

### **Implementation**

**New Objects** (from Human Flow Control v2):

```yaml
# Participation state
participation.state.<userId>:
  state: "active|paused|dormant|exited"
  
# Soft divergence
divergence.soft.<id>:
  type: "non_blocking_disagreement"
  
# Minority relief
minority.relief.<scope>:
  triggered: true
  reduced_load: true
  
# Federation boundary
federation.boundary.<id>:
  exportable_evidence: [...]
  non_exportable_policies: [...]
```

**New Commit Types**:

```yaml
commit_types:
  - type: "STABILITY_CONFIRMED"
    description: "Reviewed. No action is correct."
    
  - type: "CANON_SUMMARY"
    description: "Summary (projection, not truth)"
    authoritative: false
    must_cite: true
```

---

### **Lint Rules** (13 new rules from Human Flow v2):

```yaml
lint_rules:
  # Exit/Pause enforcement
  - rule: "LINT-EXIT-001"
    name: "EXIT_MUST_BE_RESPECTED"
    severity: "BLOCK_DEPLOY"
    description: "Cannot assign role to paused/dormant/exited user"
  
  - rule: "LINT-EXIT-002"
    name: "NO_SILENT_DISENGAGEMENT"
    severity: "BLOCK_DEPLOY"
    description: "User disappearing requires participation state change"
  
  - rule: "LINT-PAUSE-001"
    name: "PAUSE_BLOCKS_ASSIGNMENT"
    severity: "BLOCK_DEPLOY"
    description: "Tasks cannot be assigned while user is paused"
  
  # Minority relief
  - rule: "LINT-MINORITY-001"
    name: "MINORITY_LOAD_RELIEF_REQUIRED"
    severity: "BLOCK_DEPLOY"
    description: "Repeated canon loss + continued participation triggers relief"
  
  # Soft divergence
  - rule: "LINT-DISAGREE-001"
    name: "SOFT_DIVERGENCE_ALLOWED"
    severity: "BLOCK_DEPLOY"
    description: "Non-blocking divergence must be preserved (not escalated)"
  
  # Cooling windows
  - rule: "LINT-TIME-001"
    name: "COOLING_WINDOW_REQUIRED"
    severity: "BLOCK_DEPLOY"
    description: "Gated commits require cooling window (no immediate execution)"
  
  # Summaries
  - rule: "LINT-SUMMARY-001"
    name: "SUMMARY_IS_PROJECTION"
    severity: "BLOCK_DEPLOY"
    description: "Summaries must be marked non-authoritative + cite commits"
  
  # Stability
  - rule: "LINT-STABILITY-001"
    name: "STABILITY_CLOSURE_ALLOWED"
    severity: "BLOCK_DEPLOY"
    description: "Cannot re-open stabilized issue without new evidence"
  
  # Federation
  - rule: "LINT-FED-001"
    name: "NO_AUTHORITY_EXPORT"
    severity: "BLOCK_DEPLOY"
    description: "AuthorityRefs never cross federation boundaries"
  
  - rule: "LINT-FED-002"
    name: "EVIDENCE_SCHEMA_CHECK"
    severity: "BLOCK_DEPLOY"
    description: "Evidence crossing boundaries must be schema-compatible"
  
  - rule: "LINT-FED-003"
    name: "CANON_NON_OVERRIDE"
    severity: "BLOCK_DEPLOY"
    description: "External canon cannot override local canon selection"
  
  - rule: "LINT-FED-004"
    name: "EXPLICIT_INCOMPATIBILITY_REQUIRED"
    severity: "BLOCK_DEPLOY"
    description: "Federations must explicitly declare incompatibilities"
  
  # Round robin
  - rule: "LINT-ROBIN-001"
    name: "NO_PERMANENT_ROLES"
    severity: "BLOCK_DEPLOY"
    description: "All roles must have expiry + cooldown"
```

---

### **Hard Enforcement Examples**

**Exit Enforcement**:

```javascript
function assignRole(user, role) {
  const state = getParticipationState(user);
  
  if (state === "paused" || state === "dormant" || state === "exited") {
    return {
      allowed: false,
      reason: "PARTICIPATION_STATE_BLOCKS_ASSIGNMENT",
      state: state,
      message: `User is ${state}, cannot assign roles`,
      next_steps: [
        state === "paused" ? "Wait for user to resume" : null,
        state === "exited" ? "User must re-onboard (education refresh)" : null,
        "Assign role to another user"
      ].filter(Boolean)
    };
  }
  
  return { allowed: true };
}
```

**Minority Relief Enforcement**:

```javascript
function checkMinorityRelief(user, scope) {
  const lossHistory = getCanonLossHistory(user, scope);
  
  if (lossHistory.consecutive_losses >= 3) {
    // Trigger minority relief
    await createMinorityRelief({
      scope: scope,
      user: user,
      reduced_participation: true,
      increased_cognitive_credit: true,
      protection_from_escalation: true
    });
    
    return {
      relief_triggered: true,
      message: "Minority load relief activated",
      effects: [
        "Reduced required participation",
        "Increased cognitive load credit",
        "Protection from repeated escalation"
      ]
    };
  }
  
  return { relief_triggered: false };
}
```

---

## 📋 IMPLEMENTATION ORDER (CANON'S NEXT STEPS)

### **Phase 0: Lint Infrastructure** (Week 1)

**Setup relay-lint:defense pipeline**:
1. Create `relay-lint` CLI tool
2. Implement rule registry
3. Add to CI/CD (block deploy on violation)
4. Document all 27+ rules

---

### **Phase 1: State Anchoring + Drift** (Week 2-3)

**Implement**:
1. `integration.anchor_contract.<id>` object
2. `drift.<id>` filament
3. Lint rules: `ANCHOR_CONTRACT_REQUIRED`, `DRIFT_OBJECTS_REQUIRED`
4. UI: SAC dashboard, Drift dashboard

**Success**: No ambient telemetry, drift blocks finalization

---

### **Phase 2: Authority Decay + Learning Boundary** (Week 4)

**Implement**:
1. `authorityRef` with `issued_at`, `expires_at`
2. Commit types: `POLICY_RECOMMENDATION`, `POLICY_APPLIED`
3. Lint rules: `AUTHORITY_DECAY_REQUIRED`, `NO_POLICY_MUTATION_FROM_LEARNING`
4. UI: Authority HUD with expiry dimming, Recommendation dashboard

**Success**: Authority expires, learning never mutates policy

---

### **Phase 3: Refusal UX + Pressure Budgets** (Week 5)

**Implement**:
1. Refusal object (`allowed`, `reasons`, `next_steps`)
2. Hierarchical pressure budgets (Global → Org → Team → System → Object)
3. Lint rule: `REFUSAL_EXPLANATION_REQUIRED`
4. UI: All actions disabled by default, tooltips explain why

**Success**: Clear refusals, no audit storms

---

### **Phase 4: Truth Cutover + Privacy** (Week 6)

**Implement**:
1. `truth_cutover` declaration (before/after)
2. Telemetry config (aggregated-by-default, retention, redaction)
3. Lint rules: `NO_DUAL_AUTHORITY_AFTER_CUTOVER`, `TELEMETRY_MINIMIZATION_REQUIRED`
4. UI: Cutover status banner, Telemetry consent

**Success**: Clean 2D→Relay transitions, privacy by default

---

### **Phase 5: Human Flow v2 Integration** (Week 7-8)

**Implement**:
1. All 13 human flow lint rules
2. Participation state, soft divergence, minority relief objects
3. Federation boundary enforcement
4. UI: Participation dashboard, Federation boundaries

**Success**: Humane coordination, coexistence without leakage

---

## ✅ SUCCESS CRITERIA

**Enforcement Contracts are complete when:**

**Objects Implemented:**
- ✅ `integration.anchor_contract.<id>`
- ✅ `drift.<id>`
- ✅ `authorityRef` (with expires_at)
- ✅ Commit types: `POLICY_RECOMMENDATION`, `POLICY_APPLIED`
- ✅ `truth_cutover` declarations
- ✅ `participation.state`, `divergence.soft`, `minority.relief`, `federation.boundary`

**Lint Rules Enforced:**
- ✅ All 27+ rules in `relay-lint:defense`
- ✅ CI/CD blocks deploy on violation
- ✅ Clear error messages + remedies

**UI Enforcement:**
- ✅ SAC dashboard (no ambient telemetry)
- ✅ Drift dashboard (blocks finalization)
- ✅ Authority HUD (visual expiry warnings)
- ✅ Refusal-first (all actions disabled by default)
- ✅ Pressure budget dashboard (hierarchical)
- ✅ Cutover status (clear before/after)
- ✅ Participation dashboard (exit safe, minority relief visible)

**Tests Pass:**
- ✅ Cannot send telemetry without SAC
- ✅ Drift blocks finalization
- ✅ Expired authority refuses actions
- ✅ Learning cannot emit POLICY_APPLIED
- ✅ 2D writes refused after cutover
- ✅ Raw telemetry requires consent
- ✅ Paused users cannot be assigned roles

---

## 🔗 RELATED DOCUMENTS

**Prerequisites:**
- `CANON-RELAY-CORE-IMPLEMENTATION.md` → Stage gates, refusal UX
- `RELAY-HUMAN-FLOW-CONTROL-V2.md` → All 11 human flow primitives
- `RELAY-CONTROL-SYSTEMS-PROOF.md` → ERI, gradients, drift

**Extends:**
- `RELAY-FILAMENT-SPREADSHEET-SPEC.md` → Apply enforcement to spreadsheets

---

## 🎯 FINAL NOTES

**These are not features. These are invariants.**

Without these 9 enforcement mechanisms:
- ❌ Relay can slide back into 2D shortcuts
- ❌ "Verification" can become "surveillance"
- ❌ Authority can re-centralize
- ❌ Learning can mutate policy
- ❌ Audit storms can weaponize pressure

**With these 9 enforcement mechanisms:**
- ✅ 2D integrations are opt-in and scoped
- ✅ Drift cannot be ignored (blocks finalization)
- ✅ Authority expires (mandatory renewal)
- ✅ Learning produces recommendations only
- ✅ Refusals are clear and actionable
- ✅ Pressure is humane (hierarchical budgets)
- ✅ 2D→Relay transitions are clean (one-way cutover)
- ✅ Privacy is default (aggregated, time-bounded)
- ✅ Coexistence is safe (federation boundaries)

**This completes Stage 1 architectural hardening.**

---

**END OF SPEC**

**Status**: ✅ LOCKED (Stage 1 Critical - Must Implement)  
**Timeline**: 8 weeks (parallel with Stage 1 alignment)  
**Success**: All 27+ lint rules enforced, all 9 mechanisms implemented  
**Next**: Canon implements enforcement contracts, then proceeds to Stage 2

**Principles → Enforcement → Safety. Let's harden.** 🔒🌳✨
