# SETTINGS MENU FOR SOCIETY
**How to Configure Relay Beyond Minimum Canon**

---

## **PURPOSE:**
This document specifies how societies **configure Relay** using policy filaments.

**Relay is not ideological. It is configurable.**

All settings are:
- **Visible** (can see they exist)
- **Versioned** (all changes tracked)
- **Votable** (selection via governance)
- **Reversible** (can change back)
- **Scoped** (global/region/org/basin)

---

## **PRINCIPLE: SETTINGS AS POLICY FILAMENTS**

> "A setting is a versioned, scoped policy filament. Changing a setting is committing a new version and selecting it as canon."

This means:
- No "silent settings" (all changes are commits)
- No "magic config" (all settings inspectable)
- No "one-way doors" (can revert to old version)
- No "founder privilege" (settings require same governance as other policy)

---

## **1. SETTINGS STRUCTURE**

### **Every Setting Is a Policy Filament**
```yaml
filament_type: POLICY_SETTING
scope: procurement  # or global, or region, etc.
category: pressure  # governance, pressure, privacy, incentive, education, proximity, federation
name: audit_frequency_cap
version: v1.2
committed_at: 2026-02-04T14:23:00Z
committed_by: authorityRef_abc123
```

### **Setting Commit Contains:**
```yaml
setting_id: audit_frequency_cap
old_value: weekly
new_value: daily
justification: "Procurement dept requested more frequent checks due to high drift rate"
impact_estimate: "Increases pressure loop load by 5x"
quorum_required: true
votes_for: 12
votes_against: 2
quorum_reached: 2026-02-03T10:00:00Z
effective_date: 2026-02-04T00:00:00Z
```

### **Hard Rules:**
1. ✅ **Every setting change is a commit** (no silent changes)
2. ✅ **Every setting shows authorityRef** (who changed it)
3. ✅ **Every setting shows scope** (what it affects)
4. ✅ **Every setting is replayable** (can see history)

---

## **2. SETTING CATEGORIES**

### **A) GOVERNANCE SETTINGS**

Control how **canon is selected** and **policy is changed**.

```yaml
category: governance

settings:
  - canon_change_thresholds:
      default: 60% quorum
      range: 50% - 90%
      scope: per-basin
      description: "Percentage of votes needed to change canon"
  
  - vote_decay_duration:
      default: 180 days
      range: 30 days - 365 days
      scope: global
      description: "How long votes remain valid"
  
  - canon_change_frequency_limit:
      default: 1 per week
      range: 1 per day - 1 per month
      scope: per-basin
      description: "How often canon can change (prevents thrashing)"
  
  - delegation_depth_limit:
      default: 1 level
      range: 0 - 3 levels
      scope: global
      description: "How many delegation hops allowed"
  
  - quorum_class_rules:
      default:
        routine: no_vote_required (delegated)
        policy: 60% quorum
        foundational: 80% supermajority
      customizable: yes
      scope: per-basin
      description: "What changes require what quorum"
```

**Governance Lock:**
Changes to governance settings themselves require **supermajority** (80%) to prevent capture.

---

### **B) PRESSURE SETTINGS**

Control how **pressure loop** operates and how **refusals** happen.

```yaml
category: pressure

settings:
  - audit_frequency_cap:
      default: weekly
      range: daily - monthly
      scope: per-basin
      description: "How often pressure loop audits"
  
  - pressure_budget_size:
      default: 50 units
      range: 10 - 200 units
      scope: per-basin
      description: "How many concurrent actions before refusal"
  
  - backlog_limit:
      default: 50 open drifts
      range: 10 - 500 drifts
      scope: per-basin
      description: "How many unresolved drifts before refusal"
  
  - cooldown_window_duration:
      default: 48 hours
      range: 0 - 7 days
      scope: per-basin
      description: "Time between major audits to prevent overload"
  
  - refusal_threshold_ERI:
      default: 30 (refuse if ERI < 30)
      range: 0 - 70
      scope: per-basin
      description: "Minimum confidence required to proceed"
  
  - drift_decay_rate:
      default: none (drifts persist until resolved)
      range: none - 30 days
      scope: per-basin
      description: "Auto-close old drifts (if enabled)"
```

**Pressure Lock:**
Cannot disable pressure loop entirely. Can only adjust **frequency** and **thresholds**.

---

### **C) PRIVACY SETTINGS**

Control how **data is collected**, **retained**, and **accessed**.

```yaml
category: privacy

settings:
  - telemetry_mode:
      default: aggregated
      options: [aggregated, raw_opt_in]
      scope: global
      description: "Default telemetry collection mode"
  
  - retention_duration_aggregated:
      default: 30 days
      range: 7 days - 365 days
      scope: global
      description: "How long aggregated data is kept"
  
  - retention_duration_raw:
      default: 7 days
      range: 1 day - 30 days
      scope: global
      description: "How long raw opt-in data is kept (must be shorter than aggregated)"
  
  - pseudonymization_enabled:
      default: true
      options: [true, false]
      scope: global
      description: "Anonymize user identifiers in telemetry"
  
  - raw_data_access_roles:
      default: [auditor]
      options: [auditor, ops, exec, none]
      scope: global
      description: "Which roles can access raw data (if opted-in)"
  
  - consent_revocation_effect:
      default: immediate
      options: [immediate, 24hr_delay]
      scope: global
      description: "How fast consent revocation takes effect"
```

**Privacy Lock:**
- ✅ Cannot disable data minimization
- ✅ Cannot extend raw retention beyond 30 days
- ✅ Cannot collect raw data without consent
- ✅ Cannot disable consent revocation

---

### **D) INCENTIVE SETTINGS** 🔒 (Disabled by Default)

Control **reward systems** if enabled.

```yaml
category: incentive
default_state: DISABLED

settings:
  - incentive_enabled:
      default: false
      options: [true, false]
      scope: per-basin
      description: "Enable incentive/reward systems"
  
  - reward_schema_type:
      default: none
      options: [none, contribution_based, impact_based, custom]
      scope: per-basin
      description: "What gets rewarded"
  
  - measurement_scope:
      default: none
      options: [commits, drifts_resolved, ERI_improved, custom]
      scope: per-basin
      description: "What metrics are tracked"
  
  - anti_gaming_constraints:
      default: strict
      options: [none, loose, strict]
      scope: per-basin
      description: "Prevent reward gaming"
  
  - reward_visibility:
      default: private
      options: [private, public, aggregate]
      scope: per-basin
      description: "Who can see rewards"
```

**Incentive Lock:**
- ✅ Incentives are **opt-in** (not forced)
- ✅ Incentives are **scoped** (basin-level, not global by default)
- ✅ Incentives are **policy filaments** (can be changed/removed)
- ✅ Incentives **never bypass** core physics (authority, evidence, replay still required)

**To Enable:**
1. Governance proposes `INCENTIVE_POLICY_V1` filament
2. Vote reaches quorum (60%+)
3. Setting `incentive_enabled: true` committed
4. Incentive schema activated
5. Users see rewards in UI (but cannot bypass rules)

---

### **E) EDUCATION SETTINGS**

Control **training** and **feature unlocks**.

```yaml
category: education

settings:
  - new_user_training_required:
      default: true (Stage 1 minimum)
      options: [true, false]
      scope: global
      description: "Require basic training for new users"
  
  - veteran_training_required:
      default: false
      options: [true, false]
      scope: global
      description: "Require training for experienced users"
  
  - stage_gate_unlock_criteria:
      default:
        stage_1: complete_tutorial
        stage_2: 10_commits + 1_vote
        stage_3: 50_commits + 5_votes + 1_merge
      customizable: yes
      scope: global
      description: "What unlocks advanced features"
  
  - training_pace:
      default: self_paced
      options: [self_paced, group_paced, cohort]
      scope: per-basin
      description: "Individual speed or group coherence"
  
  - feature_visibility:
      default: locked_visible (can see, can't use)
      options: [locked_visible, locked_hidden]
      scope: global
      description: "Show locked features or hide until unlocked"
```

**Education Lock:**
- ✅ Can **skip** training (with authority override)
- ✅ Can **leave** training anytime
- ✅ Cannot force **worldview change** (education reveals mechanics only)

---

### **F) PROXIMITY SETTINGS** 🔒 (Disabled by Default)

Control **discovery** and **location-based coordination**.

```yaml
category: proximity
default_state: DISABLED

settings:
  - proximity_enabled:
      default: false
      options: [true, false]
      scope: per-basin
      description: "Enable location-based features"
  
  - discovery_radius:
      default: none
      range: 0 - 100 km
      scope: per-basin
      description: "How far to discover other participants"
  
  - discovery_consent_required:
      default: true
      options: [true, false]
      scope: global
      description: "Require opt-in for discovery"
  
  - encounter_retention:
      default: 7 days
      range: 0 - 30 days
      scope: global
      description: "How long to remember encounters"
  
  - location_precision:
      default: city_level
      options: [country, city, neighborhood, precise]
      scope: global
      description: "Location granularity"
```

**Proximity Lock:**
- ✅ Proximity is **opt-in** (not enabled by default)
- ✅ Requires **explicit consent** per user
- ✅ Short **retention** (max 30 days)
- ✅ Can **revoke** consent anytime (immediate effect)

**To Enable:**
1. Governance proposes `PROXIMITY_POLICY_V1` filament
2. Vote reaches quorum (60%+)
3. Setting `proximity_enabled: true` committed
4. **Each user** must still opt-in individually
5. Location data collected only from opted-in users

---

### **G) FEDERATION SETTINGS** 🔒 (Disabled by Default)

Control **multi-organization coordination**.

```yaml
category: federation
default_state: DISABLED

settings:
  - federation_enabled:
      default: false
      options: [true, false]
      scope: global
      description: "Enable inter-organization coordination"
  
  - federation_boundary_rules:
      default: none
      options: [none, strict, permeable]
      scope: global
      description: "How organizations interact"
  
  - cross_org_canon_selection:
      default: independent
      options: [independent, coordinated, shared]
      scope: global
      description: "Can orgs share canon?"
  
  - federation_pressure_propagation:
      default: isolated
      options: [isolated, alert_only, full_propagation]
      scope: global
      description: "Do pressure signals cross org boundaries?"
  
  - federation_quorum_rules:
      default: each_org_votes_separately
      options: [separate, combined, weighted]
      scope: global
      description: "How votes work across orgs"
```

**Federation Lock:**
- ✅ Federation is **opt-in** (not enabled by default)
- ✅ Requires **multi-org agreement** (all orgs must vote)
- ✅ Boundaries are **explicit** (no hidden leakage)
- ✅ Can **exit** federation anytime (with cooldown)

**To Enable:**
1. Each org proposes `FEDERATION_POLICY_V1` filament
2. Each org votes (quorum 60%+)
3. All orgs must agree (multi-scope quorum)
4. Federation boundary created (explicit)
5. Cross-org coordination enabled (scoped)

---

## **3. HOW TO CHANGE SETTINGS**

### **Step-by-Step Process:**

```yaml
1. PROPOSE:
   - User with authority creates POLICY_PROPOSAL commit
   - Includes: setting_id, old_value, new_value, justification, impact_estimate
   - Tagged with scope (what it affects)

2. REVIEW:
   - Setting proposal visible to all in scope
   - Discussion happens in comments (versioned)
   - Concerns raised as commits

3. VOTE:
   - If setting requires quorum, voting opens
   - Vote duration: 7 days default (configurable)
   - Quorum threshold checked (e.g., 60%)

4. COMMIT:
   - If quorum reached → setting change committed
   - If quorum failed → proposal marked REJECTED (preserved)
   - Commit includes: votes_for, votes_against, quorum_reached timestamp

5. ACTIVATE:
   - New setting becomes canon
   - Effective date recorded
   - Old setting preserved in history (can revert)

6. OBSERVE:
   - Pressure feedback monitored
   - If problems → can propose revert
   - Revert also requires vote (same process)
```

---

## **4. QUORUM CLASSES FOR SETTINGS**

### **A) Routine (No Vote Required)**
Delegated to authorized roles.

Examples:
- Adjusting timebox duration (within limits)
- Changing UI label verbosity
- Updating training content

---

### **B) Policy (60% Quorum)**
Material changes that affect coordination.

Examples:
- Changing audit frequency
- Adjusting pressure budget
- Changing retention duration
- Enabling new telemetry

---

### **C) Foundational (80% Supermajority)**
Changes to governance itself or core physics interactions.

Examples:
- Changing quorum thresholds
- Enabling federation
- Changing authority decay rules
- Modifying canon change frequency

---

### **D) Multi-Scope (80% in All Affected Scopes)**
Changes that affect multiple basins or orgs.

Examples:
- Cross-basin policy changes
- Federation boundaries
- Global privacy rules

---

## **5. EXAMPLE: ENABLING INCENTIVE SYSTEM**

### **Scenario:**
Procurement dept wants to reward "drift resolution" with recognition points.

### **Process:**

#### **1. Propose:**
```yaml
proposal:
  type: POLICY_SETTING_CHANGE
  scope: procurement
  category: incentive
  setting: incentive_enabled
  old_value: false
  new_value: true
  justification: |
    "Procurement team wants to encourage drift resolution.
     Propose: recognition points for closed drifts.
     No monetary rewards, just visibility."
  impact_estimate: |
    "Increases telemetry load (tracks resolutions).
     Requires aggregated-only telemetry (no raw).
     No impact on pressure loop."
  proposed_by: authorityRef_procurement_manager_xyz
  proposed_at: 2026-02-04T10:00:00Z
```

#### **2. Review:**
- Team discusses for 3 days
- Questions raised:
  - "Will this cause gaming?" → Answer: "Anti-gaming constraints set to 'strict'"
  - "Who sees the points?" → Answer: "Visibility set to 'aggregate' (no individual leaderboard)"
- Concerns addressed

#### **3. Vote:**
```yaml
vote:
  proposal_id: proposal_incentive_procurement_001
  quorum_required: 60%
  duration: 7 days
  votes:
    - user: alice → FOR
    - user: bob → FOR
    - user: carol → AGAINST
    - user: dave → FOR
    ...
  final_tally:
    for: 12 (75%)
    against: 4 (25%)
  quorum_reached: true
  reached_at: 2026-02-06T14:00:00Z
```

#### **4. Commit:**
```yaml
commit:
  type: POLICY_SETTING_APPLIED
  scope: procurement
  setting: incentive_enabled
  old_value: false
  new_value: true
  voted_for: 12
  voted_against: 4
  quorum: 75%
  committed_at: 2026-02-07T00:00:00Z
  effective_date: 2026-02-08T00:00:00Z  # 24hr delay
```

#### **5. Activate:**
- Feb 8, 2026: Incentive system goes live
- UI shows new "Recognition" badge for drift resolution
- Telemetry tracks resolutions (aggregated only)
- Team sees: "Procurement dept: 15 drifts resolved this week"

#### **6. Observe:**
- Week 1: 15 drifts resolved (up from 8 baseline)
- Week 2: 18 drifts resolved
- Week 3: 12 drifts resolved (stable)
- No gaming detected
- Team satisfied

**If problems arise:**
Team can propose `incentive_enabled: false` revert (same voting process).

---

## **6. SETTINGS VISIBILITY IN UI**

### **Settings Menu (User View):**

```
🔧 RELAY SETTINGS (Procurement Basin)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 GOVERNANCE SETTINGS:
  ✅ Canon change threshold: 60%        [EDIT] [HISTORY]
  ✅ Vote decay: 180 days               [EDIT] [HISTORY]
  ✅ Canon change frequency: 1/week     [EDIT] [HISTORY]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ PRESSURE SETTINGS:
  ✅ Audit frequency: weekly            [EDIT] [HISTORY]
  ✅ Pressure budget: 50 units          [EDIT] [HISTORY]
  ✅ Backlog limit: 50 drifts           [EDIT] [HISTORY]
  ✅ Cooldown window: 48 hours          [EDIT] [HISTORY]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 PRIVACY SETTINGS:
  ✅ Telemetry: aggregated              [EDIT] [HISTORY]
  ✅ Retention: 30 days (agg)           [EDIT] [HISTORY]
  ✅ Raw retention: 7 days              [EDIT] [HISTORY]
  ✅ Pseudonymization: enabled          [EDIT] [HISTORY]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 INCENTIVE SETTINGS:
  ✅ Enabled: true                      [EDIT] [HISTORY]
  ✅ Reward schema: contribution-based  [EDIT] [HISTORY]
  ✅ Anti-gaming: strict                [EDIT] [HISTORY]
  ✅ Visibility: aggregate              [EDIT] [HISTORY]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 EDUCATION SETTINGS:
  ✅ New user training: required        [EDIT] [HISTORY]
  ✅ Stage gates: enabled               [EDIT] [HISTORY]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 PROXIMITY SETTINGS: 🔒 DISABLED
  🔒 Enable proximity features          [PROPOSE TO ENABLE]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 FEDERATION SETTINGS: 🔒 DISABLED
  🔒 Enable federation                  [PROPOSE TO ENABLE]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[VIEW ALL SETTINGS] [PROPOSE NEW SETTING]
```

---

## **7. SETTINGS SAFETY GUARANTEES**

### **Hard Locks (Cannot Be Changed):**
1. ✅ No hidden settings (all visible)
2. ✅ No silent changes (all changes are commits)
3. ✅ No permanent power (authority decays)
4. ✅ No ambient surveillance (consent required)
5. ✅ No policy auto-mutation (learning recommends only)
6. ✅ No erasure (history preserved)
7. ✅ No bypass (extreme tech still obeys physics)

### **Reversibility Guarantee:**
- ✅ Every setting change can be reverted
- ✅ Old versions preserved in history
- ✅ Revert requires same governance as change
- ✅ Revert effect is immediate (or scheduled)

### **Visibility Guarantee:**
- ✅ Current settings visible to all
- ✅ Proposed changes visible before vote
- ✅ Change history replayable
- ✅ Impact estimates required

---

## **8. SETTINGS MENU LOCK (FINAL SENTENCE)**

> **"Relay ships with all settings visible. Most are off by default. Changing a setting is committing a policy filament and voting to make it canon. Nothing is forced. Everything is configurable."**

---

## **NEXT STEPS:**

1. **Review current settings:** See what's enabled in your basin
2. **Propose changes:** If something should be different
3. **Vote:** Reach quorum to activate
4. **Observe:** Monitor pressure feedback
5. **Adjust:** Revise if needed

**Relay is a coordination OS, not an ideology. Configure it to fit your reality.**

---

## **RELATED DOCUMENTS:**
- `ROOT-CAPABILITY-MATRIX.md` - All capabilities that exist
- `MINIMUM-CANON.md` - Smallest safe configuration
- `RELAY-ENFORCEMENT-CONTRACTS.md` - Core physics (cannot be configured away)
