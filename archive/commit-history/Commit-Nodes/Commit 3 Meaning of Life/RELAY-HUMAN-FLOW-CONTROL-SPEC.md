# 🔄 RELAY HUMAN FLOW CONTROL SPECIFICATION

**Date**: 2026-02-02  
**Status**: CRITICAL ADDITION TO STAGE 1  
**Type**: Coordination Physics (Not Psychology)  
**Purpose**: Prevent burnout, elite formation, and participation overload

---

## 🚨 WHAT WAS MISSING

The current Stage 1 spec proves **mechanical inevitability** but does not fully specify **how humans participate sustainably**.

**Missing coordination primitives**:
1. **Education as a System** (not just content)
2. **Cognitive Load Accounting** (capacity constraints)
3. **Round Robin Scheduler** (mandatory rotation)

**Without these**:
- ❌ Relay becomes audit machine (burns people out)
- ❌ Informal power accumulates (despite formal authority decay)
- ❌ Education becomes passive (not regenerative)
- ❌ "Hero mode" emerges (silent over-assignment)
- ❌ Elite class re-forms socially (even if not technically)

**With these**:
- ✅ Participation is humane
- ✅ Authority remains temporary
- ✅ Education scales regeneratively
- ✅ Mental health protected by physics
- ✅ System remains alive

---

## 🎓 SUBSYSTEM 1: EDUCATION AS A SYSTEM

### **The Problem**

**Current assumption** (insufficient):
- Training packs exist
- Individuals progress via individual stage gates
- Learning is "available" and "replayable"

**What's missing**:
- Education is treated as **content**, not as a **coordination process**
- Teaching is not modeled as a **rotating role**
- No mechanism to prevent **guru culture** or **dependency**

---

### **The Solution: Education Filaments**

**Education is a first-class filament type**:

```yaml
education.track.<domain>:
  track_id: education-track-procurement
  domain: procurement_coordination
  
  curriculum_units:
    - unit_id: three-way-match-basics
      prerequisites: []
      learning_objectives: ["Understand Intent·Projection·Reality"]
      assessment: confidence_checkpoint_001
      
    - unit_id: evidence-pack-creation
      prerequisites: [three-way-match-basics]
      learning_objectives: ["Create QEP", "Generate Merkle hash"]
      assessment: confidence_checkpoint_002
    
    - unit_id: refusal-mechanics
      prerequisites: [evidence-pack-creation]
      learning_objectives: ["Understand refusal UX", "Write policy table"]
      assessment: confidence_checkpoint_003
  
  rotation_rules:
    learner_to_teacher_threshold: 3_completed_units
    teaching_duration_max: 90_days
    teaching_cooldown: 180_days
    no_permanent_experts: true
  
  authority_rules:
    cannot_advance_without: [prerequisite_completion, confidence_threshold]
    cannot_be_assigned_higher_role: [education_incomplete]
```

---

### **Key Rules**

#### **1. Education Has Prerequisites (Cannot Be Bypassed)**

```yaml
advancement_gate:
  user_action: "advance_to_operator_role"
  requires_education: procurement-basics-track
  user_education_status: incomplete
  
  result: REFUSED
  reason: "Role requires procurement education track completion"
  next_step: "Complete education.track.procurement-basics"
```

#### **2. Learning Eventually Requires Teaching**

```yaml
reciprocal_education_rule:
  user_id: alice
  completed_units: 5
  
  trigger: learner_to_teacher_threshold (3 units)
  
  action_required:
    - role: educator
    - duration: 30_days (max 90_days)
    - scope: units_already_mastered
    - cooldown_after: 180_days
  
  rationale: "Learners become teachers. No permanent students. No permanent experts."
```

#### **3. Teaching Is Time-Bounded**

```yaml
teaching_authority:
  user_id: bob
  role: educator
  granted_at: 2026-01-01
  expires_at: 2026-03-31 (90 days max)
  
  renewal_policy:
    requires: cooldown_180_days
    cannot_self_renew: true
    rotation_required: true
  
  next_educator: assigned_via_round_robin
```

---

### **Anti-Patterns Prevented**

| Pattern | Without Education System | With Education System |
|---------|-------------------------|---------------------|
| Guru Culture | Same people teach forever | Teaching rotates (max 90 days) |
| Dependency | Learners never teach | Learners become teachers after 3 units |
| Passive Learning | Consumption only | Reciprocal (teach what you learned) |
| Silent Promotion | Assigned roles without training | Cannot advance without education track |
| Expertise Centralization | "Experts" accumulate cognitive authority | Expertise is temporary, rotates |

---

## 🧠 SUBSYSTEM 2: COGNITIVE LOAD ACCOUNTING

### **The Problem**

**Current assumption** (insufficient):
- Pressure budgets exist (prevents audit storms)
- Authority decay exists (prevents permanent delegation)

**What's missing**:
- No model of **human cognitive capacity**
- No tracking of **attention exhaustion**
- No enforcement of **recovery windows**
- No prevention of **silent over-assignment**

**Result**: "Hero mode" emerges, burnout becomes hidden failure mode

---

### **The Solution: Cognitive Load Filaments**

**Cognitive load is a first-class constraint**:

```yaml
cognitive.load.<userId>:
  user_id: alice
  
  current_load:
    active_disputes: 3
    open_refusals: 7
    governance_actions: 2
    audit_responsibilities: 1
    education_teaching: 1
    
  total_load_score: 68 (out of 100)
  
  role_intensity:
    current_role: operator (moderate)
    previous_role: arbiter (high, recently rotated out)
  
  recovery:
    last_recovery_window: 2026-01-15
    days_since_recovery: 18
    next_required_recovery: 2026-02-15 (every 30 days)
  
  status: APPROACHING_CAPACITY (68/100)
  
  enforcement:
    refuse_new_assignments: false (threshold: 80)
    suggest_rotation: true (threshold: 65)
    require_recovery: false (threshold: 85)
```

---

### **Key Rules**

#### **1. Load Is Tracked Automatically**

```yaml
load_tracking:
  user_actions_that_increase_load:
    - dispute_opened: +5
    - refusal_received: +2
    - governance_vote_required: +3
    - audit_assigned: +10
    - education_teaching: +8
    - arbiter_role: +15
  
  user_actions_that_decrease_load:
    - dispute_closed: -5
    - refusal_resolved: -2
    - governance_vote_complete: -3
    - audit_complete: -10
    - education_session_complete: -2
    - recovery_window: -30 (reset)
```

#### **2. High Load Triggers Automatic Refusal**

```yaml
load_enforcement:
  user_id: alice
  current_load: 82/100
  threshold: 80 (refuse new assignments)
  
  attempted_action: "assign_audit_to_alice"
  
  result: REFUSED
  reason: "User cognitive load at 82% (threshold: 80%)"
  explanation: "Alice cannot accept new high-load assignments"
  alternative: "Assign to round-robin pool (see rotation.policy.audits)"
  recovery_guidance: "Alice eligible for recovery window in 3 days"
```

#### **3. Recovery Windows Are Mandatory**

```yaml
recovery_window:
  user_id: alice
  load_before: 82/100
  
  recovery_action:
    type: mandatory_low_load_period
    duration: 7_days
    allowed_actions:
      - view_dashboards (read-only)
      - complete_in-progress_tasks (but no new assignments)
      - education_learning (but not teaching)
    
    forbidden_actions:
      - dispute_participation
      - governance_voting
      - audit_assignments
      - arbiter_role
      - educator_role
  
  load_after_recovery: 35/100 (reset)
  next_recovery_required: 2026-03-15 (30 days)
```

#### **4. Role Intensity Matters**

```yaml
role_intensity_table:
  observer: 5 (passive, low load)
  learner: 10 (active learning, moderate)
  operator: 15 (daily decisions, moderate)
  educator: 20 (teaching others, moderate-high)
  reviewer: 25 (evaluating others, high)
  arbiter: 35 (dispute resolution, very high)
  governance_council: 40 (policy decisions, very high)
  
enforcement:
  high_intensity_roles:
    max_duration: 90_days
    cooldown: 180_days
    cannot_stack: true (no arbiter + educator simultaneously)
```

---

### **Anti-Patterns Prevented**

| Pattern | Without Cognitive Load | With Cognitive Load |
|---------|----------------------|-------------------|
| Burnout | Silent over-assignment | Load hits 80% → refusal |
| Hero Mode | "I'll handle it" forever | Load forces rotation |
| Audit Machine | Constant scrutiny | Recovery windows mandatory |
| Moral Pressure | "Why aren't you participating?" | Physics-based refusal |
| Elite Exhaustion | Top performers burn out | High-load roles time-limited |

---

## 🔄 SUBSYSTEM 3: ROUND ROBIN SCHEDULER

### **The Problem**

**Current assumption** (insufficient):
- Authority decay prevents permanent delegation
- Governance votes distribute responsibility

**What's missing**:
- No **explicit rotation mechanism**
- No prevention of **elite class formation**
- No prevention of **learned helplessness** in others
- No enforcement of **cooldowns**

**Result**: Informal power accumulates despite formal authority decay

---

### **The Solution: Round Robin as First-Class Scheduler**

**Round Robin is a coordination primitive**:

```yaml
rotation.policy.<scope>:
  policy_id: rotation-policy-governance
  scope: governance_reviews
  
  pool:
    eligible_users: [alice, bob, carol, dave, eve]
    min_education_level: governance-basics-track
    min_confidence: 70%
    
  rotation_rules:
    selection_method: sequential_round_robin
    role_duration: 30_days
    cooldown_duration: 120_days
    max_consecutive_terms: 1 (cannot renew immediately)
    
  current_assignment:
    user_id: alice
    role: governance_reviewer
    assigned_at: 2026-02-01
    expires_at: 2026-03-03
    next_in_rotation: bob
  
  enforcement:
    cannot_self_renew: true
    cannot_reassign_without_cooldown: true
    rotation_is_mandatory: true
```

---

### **Key Rules**

#### **1. Roles Must Rotate**

```yaml
rotation_enforcement:
  role: governance_reviewer
  current_holder: alice
  term_expires: 2026-03-03
  
  attempted_action: "renew_alice_governance_reviewer"
  
  result: REFUSED
  reason: "Role requires rotation (max_consecutive_terms: 1)"
  next_holder: bob (via round_robin)
  alice_cooldown: 120_days (eligible again 2026-07-01)
```

#### **2. Cooldowns Prevent Immediate Re-assignment**

```yaml
cooldown_enforcement:
  user_id: alice
  last_role: governance_reviewer
  role_ended: 2026-03-03
  cooldown_duration: 120_days
  eligible_again: 2026-07-01
  
  attempted_action: "assign_governance_reviewer_to_alice"
  current_date: 2026-04-15
  
  result: REFUSED
  reason: "Alice in cooldown period (ends 2026-07-01)"
  alternative: "Assign to next in rotation: carol"
```

#### **3. No Permanent Roles**

```yaml
permanent_role_prevention:
  role: arbiter
  max_duration: 90_days
  current_holder: bob
  held_since: 2025-12-01
  duration: 95_days
  
  status: EXPIRED (exceeded max_duration)
  
  enforcement:
    authority_revoked: true
    next_arbiter: assigned_via_round_robin
    bob_cooldown: 180_days
```

#### **4. Round Robin Applies to Multiple Scopes**

```yaml
rotation_scopes:
  - rotation.policy.governance_reviews
  - rotation.policy.dispute_arbitration
  - rotation.policy.audit_assignments
  - rotation.policy.education_facilitation
  - rotation.policy.war_games
  - rotation.policy.pressure_reviews
  
enforcement:
  all_scopes_must_rotate: true
  no_exceptions: true
```

---

### **Anti-Patterns Prevented**

| Pattern | Without Round Robin | With Round Robin |
|---------|-------------------|----------------|
| Elite Formation | Same people in power | Mandatory rotation (30-90 days) |
| Learned Helplessness | "They'll handle it" | Everyone rotates through roles |
| Quiet Power Accumulation | Informal influence grows | Cooldowns prevent re-capture |
| Procedural Authoritarianism | De facto permanence | Max duration enforced |
| Dependency | "Only Bob knows how" | Teaching rotates, knowledge spreads |

---

## 🔗 INTEGRATION WITH EXISTING PRIMITIVES

### **How These Fit with Stage 1**

**These are coordination physics, NOT**:
- ❌ Incentive systems (Stage 2)
- ❌ External integration (post-Stage-1)
- ❌ Psychological therapy
- ❌ Social engineering

**These ARE**:
- ✅ Coordination constraints (like pressure budgets)
- ✅ Authority mechanics (like authority decay)
- ✅ Refusal logic (like evidence requirements)
- ✅ Stage 1 scope (proving sustainable participation)

---

### **Integration Points**

#### **1. Education + Authority Decay**

```yaml
combined_rule:
  authority_object:
    user_id: alice
    role: operator
    expires_at: 2026-12-31
  
  education_requirement:
    track: procurement-advanced
    status: incomplete
  
  renewal_attempt: 2026-12-25
  
  result: REFUSED
  reason: "Renewal requires education track completion"
  next_step: "Complete education.track.procurement-advanced"
```

#### **2. Cognitive Load + Pressure Budgets**

```yaml
combined_enforcement:
  pressure_budget:
    team_capacity: 100
    current_pressure: 75
  
  cognitive_load:
    alice_load: 82/100 (over threshold)
  
  attempted_action: "assign_dispute_to_alice"
  
  result: REFUSED
  reason: "Alice cognitive load at 82% (threshold: 80%)"
  alternative: "Assign via round-robin to lower-load user"
```

#### **3. Round Robin + Refusal UX**

```yaml
rotation_refusal:
  user_id: alice
  current_role: governance_reviewer
  term_expires: tomorrow
  
  attempted_action: "alice_votes_on_policy_change"
  
  result: REFUSED
  reason: "Role expires in 1 day, new votes forbidden in final 48 hours"
  next_step: "Bob assumes role tomorrow, will handle pending votes"
```

---

## 📋 IMPLEMENTATION ADDITIONS FOR CANON

### **New Object Models**

#### **1. Education Track Filament**

```yaml
education.track.<domain>:
  track_id: string
  domain: string
  curriculum_units: array
  rotation_rules: object
  authority_rules: object
```

#### **2. Cognitive Load Filament**

```yaml
cognitive.load.<userId>:
  user_id: string
  current_load: object
  total_load_score: integer (0-100)
  role_intensity: object
  recovery: object
  status: enum [OK, APPROACHING, OVERLOAD]
```

#### **3. Rotation Policy Object**

```yaml
rotation.policy.<scope>:
  policy_id: string
  scope: string
  pool: object
  rotation_rules: object
  current_assignment: object
  enforcement: object
```

---

### **New Commit Types**

```yaml
EDUCATION_TRACK_DEFINED
EDUCATION_UNIT_COMPLETED
EDUCATION_CHECKPOINT_PASSED
TEACHING_ROLE_ASSIGNED
TEACHING_ROLE_COMPLETED

COGNITIVE_LOAD_THRESHOLD_EXCEEDED
RECOVERY_WINDOW_REQUIRED
RECOVERY_WINDOW_COMPLETED

ROTATION_ASSIGNED
ROTATION_COOLDOWN_ACTIVE
ROTATION_COOLDOWN_EXPIRED
```

---

### **New Lint Rules**

```yaml
NO_ADVANCEMENT_WITHOUT_EDUCATION
NO_PERMANENT_TEACHING_ROLES
NO_ASSIGNMENT_ABOVE_LOAD_THRESHOLD
RECOVERY_WINDOWS_MANDATORY
NO_ROLE_WITHOUT_ROTATION
NO_SELF_RENEWAL
COOLDOWNS_ENFORCED
```

---

### **New Refusal Types**

```yaml
REFUSED_EDUCATION_INCOMPLETE
REFUSED_COGNITIVE_LOAD_EXCEEDED
REFUSED_ROTATION_COOLDOWN_ACTIVE
REFUSED_ROLE_EXPIRED
REFUSED_SELF_RENEWAL_FORBIDDEN
```

---

## 🚫 WHAT THIS PREVENTS (SUMMARY)

### **Without Human Flow Control**

1. **Burnout**: Silent over-assignment, no recovery
2. **Elite Formation**: Same people in power roles
3. **Guru Culture**: Permanent experts, dependency
4. **Learned Helplessness**: "They'll handle it"
5. **Audit Machine**: Constant scrutiny, no rest
6. **Procedural Authoritarianism**: De facto permanence
7. **Hidden Power**: Informal influence accumulates

### **With Human Flow Control**

1. **Sustainable Participation**: Load-based refusal, mandatory recovery
2. **Rotating Authority**: Max 90 days, cooldowns enforced
3. **Regenerative Education**: Learners become teachers
4. **Distributed Capability**: Everyone rotates through roles
5. **Humane System**: Recovery windows physics-based
6. **Temporary Everything**: No permanent roles
7. **Visible Power**: Formal authority only, no informal accumulation

---

## 🔒 THE FINAL LOCKS

### **Lock 1: Stage Gates** (Original)
> "Individuals may advance in understanding at any time.  
> The system advances only by global canon."

### **Lock 2: Round Robin** (Human Flow Control)
> **"No coordination role may be permanent.  
> No participant may be overloaded.  
> Responsibility rotates or the system is wrong."**

### **Lock 3: The Meta-Lock** (What All of This Enables)
> **"Relay must make coordination possible,  
> participation humane,  
> disagreement survivable,  
> and exit safe.**
> 
> **If any of those fail, the system is wrong."**

---

## 🌱 WHAT THESE ADDITIONS ENABLE

### **People can leave**
- ✅ Exit is always possible (no lock-in)
- ✅ Cognitive load enforced (no silent over-assignment)
- ✅ Recovery windows mandatory (rest is physics)
- ✅ Roles rotate (no permanent commitment)

### **People can disagree quietly**
- ✅ Not every dispute requires your participation
- ✅ Pressure budgets prevent being pulled into everything
- ✅ Cognitive load protects from dispute overload
- ✅ Forks preserve disagreement without forcing consensus

### **People can wait**
- ✅ Individual stage-gates allow learning at own pace
- ✅ No forced participation (opt-in always)
- ✅ Recovery windows are mandatory (rest is respected)
- ✅ Inaction is legitimate (not a failure state)

### **People can lose without burning out**
- ✅ Rotation means temporary roles (loss is bounded)
- ✅ Cooldowns prevent immediate re-entry (recovery enforced)
- ✅ Cognitive load limits damage (refusal before burnout)
- ✅ Authority decay prevents permanent exclusion

### **History stays legible**
- ✅ Filament replay always available (even when not participating)
- ✅ Merkle proofs preserve evidence (cannot be rewritten)
- ✅ Education tracks show progression (learning is visible)
- ✅ Rotation history shows who held what when (accountability)

### **Vulnerable participants are safe**
- ✅ Cognitive load protects from exploitation
- ✅ Education prerequisites prevent premature advancement
- ✅ Round robin prevents targeting (automatic rotation)
- ✅ Recovery windows are physics-based (not social favor)

### **Communities can coexist**
- ✅ Different Stage 2 models can fork (no forced unity)
- ✅ Regional autonomy preserved (different policies)
- ✅ Federation is opt-in (not mandatory)
- ✅ Rotation is local to community (not global)

### **Inaction is respected**
- ✅ Not participating is legitimate choice
- ✅ Recovery windows are mandatory (rest is honored)
- ✅ Cognitive load refusal is automatic (no guilt)
- ✅ Individual stage-gates allow pausing (no forced progress)

---

## 💡 THE DIFFERENCE

### **A Correct System** (Without Human Flow Control)
- ✅ Mechanically sound
- ✅ Coordination physics work
- ✅ Refusal logic clear
- ❌ But: Participation becomes grinding
- ❌ But: Burnout is hidden failure mode
- ❌ But: Exit is difficult (silent over-assignment)
- ❌ But: Disagreement is exhausting

### **A Livable System** (With Human Flow Control)
- ✅ Mechanically sound
- ✅ Coordination physics work
- ✅ Refusal logic clear
- ✅ **AND**: Participation is sustainable
- ✅ **AND**: Burnout prevented by physics
- ✅ **AND**: Exit is safe (cognitive load enforced)
- ✅ **AND**: Disagreement is survivable (can opt out)

**This is the difference between correct and livable.**

---

## ✅ SUCCESS CRITERIA (UPDATED)

**Stage 1 is complete when you can demonstrate** (ORIGINAL 7 + NEW 3):

### **Original 7** (Unchanged)
1. ✅ Business rules mechanically enforceable
2. ✅ Missing evidence causes refusal
3. ✅ Accumulation caught early
4. ✅ Authority time-bounded
5. ✅ Drift blocks finalization
6. ✅ Users understand refusals
7. ✅ Individual learning ≠ system authority

### **NEW 3** (Human Flow Control)
8. ✅ **Education rotates** (learners become teachers, teaching time-bounded)
9. ✅ **Cognitive load enforced** (no assignment above threshold, recovery mandatory)
10. ✅ **Roles rotate** (max 90 days, cooldowns enforced, no self-renewal)

**If all ten work, Stage 1 is complete.**

---

## 📅 TIMELINE IMPACT

**Previous timeline**: 10-12 weeks

**With human flow control**: **12-14 weeks** (add 2 weeks)

**Breakdown**:
- Week 11: Education system + cognitive load
- Week 12: Round robin scheduler
- Week 13-14: Integration + testing

**Still achievable for Stage 1.**

---

## 🎯 NEXT STEPS FOR CANON

**Canon must add**:
1. Education track filaments
2. Cognitive load filaments
3. Rotation policy objects
4. Teaching role mechanics
5. Load tracking + refusal
6. Round robin scheduler
7. Cooldown enforcement
8. Recovery window mechanics

**All are Relay-native coordination physics.**

---

**This is not optional.**  
**Without these, Stage 1 proof is incomplete.**

**Humans must participate sustainably, or inevitability becomes coercion.** 🔒
