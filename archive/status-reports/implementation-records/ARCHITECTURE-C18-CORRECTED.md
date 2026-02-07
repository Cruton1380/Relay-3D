# ARCHITECTURE@C18: TIMEBOX RATE-OF-CHANGE PHYSICS (CORRECTED)

**Status**: ✅ **APPROVED BY CANON** (2026-01-31)  
**Type**: 🔒 **FOUNDATIONAL PHYSICS** (Locked) + ⚙️ **VERSIONED POLICY** (Tunable)  
**Git Commit**: TBD (corrections in progress)

---

## 🔒 **FOUNDATIONAL PHYSICS** (Locked - Non-Negotiable)

### What CANON Approved as Physics

These are legitimately physical laws for Relay coordination and can be locked:

### 1. **Position / Velocity / Acceleration Framing**

```
Position:     state(t)           = current state
Velocity:     Δstate / Δt        = rate of change  
Acceleration: Δ²state / Δt²      = change in rate
```

**Lock**: These derivatives **exist** as measurable, computable properties

**Not locked**: Specific formulas using these derivatives (those are policy)

---

### 2. **Velocity-Aware Reality Recorded Per Timebox**

Each timebox captures:
- ✅ Position (state snapshot)
- ✅ Velocity (rate of change since last timebox)
- ✅ Acceleration (change in rate)

**Lock**: This data **is recorded** and **is first-class**

**Not locked**: How we weight or use these values (that's policy)

---

### 3. **Materiality Can Be Triggered by Change Magnitude/Rate**

```
Materiality = f(Δstate, rate, context)
```

**Lock**: Materiality **can** be objectively measured via rate, not just subjective "feels important"

**Not locked**: Specific rate thresholds (1%, 5%, etc.) - those are policy

---

## ⚙️ **VERSIONED POLICY** (Tunable - Governed)

### What CANON Correctly Identified as Policy (Not Physics)

These are **governance decisions**, not laws of nature. They **must** be:
- Versioned
- Governed
- Tunable without code changes
- Historically tracked

---

### 1. ⚠️ **ERI Formula Weights** (Policy v1.0.0)

**Current policy** (not physics):
```
ERI = 40% distance + 40% velocity + 20% acceleration
```

**Why this is policy, not physics**:
- The weights (40-40-20) are a **choice**
- Other weight distributions are valid
- Different contexts may need different weights
- This should be **governed** and **versioned**

**How it's now implemented**:
```javascript
// ❌ OLD (incorrectly locked):
const eri = distanceScore * 0.4 + velocityScore * 0.4 + accelerationScore * 0.2

// ✅ NEW (policy-based):
const weights = rateOfChangePolicy.getERIWeights()
const eri = distanceScore * weights.distance + 
            velocityScore * weights.velocity + 
            accelerationScore * weights.acceleration
```

**Policy file**: `src/backend/config/rateOfChangePolicy.mjs`

---

### 2. ⚠️ **Materiality Rate Thresholds** (Policy v1.0.0)

**Current policy** (not physics):
```
< 1% change/hr  → STAY_DRAFT
1-5% change/hr  → PROPOSE
5-10% change/hr → COMMIT
> 20% change/hr → URGENT_COMMIT
```

**Why this is policy, not physics**:
- The percentages (1%, 5%, 10%, 20%) are **choices**
- Different domains may need different thresholds
- Voting systems ≠ financial systems ≠ infrastructure systems
- This should be **governed** and **versioned**

**How it's now implemented**:
```javascript
// ❌ OLD (incorrectly locked):
this.thresholds = {
  DRAFT: 0.01,
  PROPOSE: 0.05,
  COMMIT: 0.10,
  URGENT: 0.20
}

// ✅ NEW (policy-based):
const policy = rateOfChangePolicy.getActivePolicy()
this.thresholds = {
  DRAFT: policy.materialityThresholds.draft,
  PROPOSE: policy.materialityThresholds.propose,
  COMMIT: policy.materialityThresholds.commit,
  URGENT: policy.materialityThresholds.urgent
}
```

**Policy file**: `src/backend/config/rateOfChangePolicy.mjs`

---

### 3. ⚠️ **Volatility Classification Boundaries** (Policy v1.0.0)

**Current policy** (not physics):
```
< 36 votes/hr    → STABLE
< 180 votes/hr   → MODERATE
< 360 votes/hr   → HIGH
>= 360 votes/hr  → CRITICAL
```

**Why this is policy, not physics**:
- Boundaries are domain-specific **choices**
- Calibrated for voting, may need adjustment for other systems
- Should be **governed** and **versioned**

---

### 4. ⚠️ **Volatility Multipliers** (Policy v1.0.0)

**Current policy** (not physics):
```
STABLE:   1.0x (normal thresholds)
MODERATE: 0.8x (20% lower threshold)
HIGH:     0.6x (40% lower threshold)
CRITICAL: 0.4x (60% lower threshold)
```

**Why this is policy, not physics**:
- Multipliers are **tuning parameters**
- Different risk tolerances = different multipliers
- Should be **governed** and **versioned**

---

## 📋 **POLICY GOVERNANCE MODEL**

### How Policy Changes Work

**File**: `src/backend/config/rateOfChangePolicy.mjs`

```javascript
// Propose new policy version
const newPolicy = {
  version: 'v1.1.0',
  effectiveDate: '2026-02-15',
  approvedBy: 'Governance Committee',
  description: 'Adjusted ERI weights based on production data',
  
  eriWeights: {
    distance: 0.35,      // Changed from 0.40
    velocity: 0.45,      // Changed from 0.40
    acceleration: 0.20   // Unchanged
  },
  // ... other parameters
}

// Register and activate
rateOfChangePolicy.registerPolicy('v1.1.0', newPolicy)
rateOfChangePolicy.setActiveVersion('v1.1.0')
```

**Policy change requirements**:
1. ✅ Version increment (semantic versioning)
2. ✅ Effective date
3. ✅ Approved by (governance authority)
4. ✅ Rationale for changes
5. ✅ Migration path documented
6. ✅ Historical versions preserved

---

## 🔧 **FILES CORRECTED**

### New Files (1):
1. **`src/backend/config/rateOfChangePolicy.mjs`** (NEW)
   - Versioned policy registry
   - ERI weights (tunable)
   - Materiality thresholds (tunable)
   - Volatility boundaries (tunable)
   - Policy proposal/approval system

### Modified Files (2):
1. **`src/backend/verification/eriCalculator.mjs`**
   - ❌ Removed hardcoded weights (0.4, 0.4, 0.2)
   - ✅ Now loads weights from policy
   - ✅ Includes policy version in breakdown

2. **`src/backend/verification/materialityThreshold.mjs`**
   - ❌ Removed hardcoded thresholds (0.01, 0.05, 0.10, 0.20)
   - ✅ Now loads thresholds from policy
   - ✅ Includes policy version in responses

---

## ✅ **WHAT'S LOCKED** (Cannot Change)

1. ✅ Position, velocity, acceleration are first-class data
2. ✅ Timebox derivatives are recorded per timebox
3. ✅ Materiality can be triggered objectively by rate
4. ✅ ERI includes spatial distance and temporal velocity
5. ✅ Volatility affects commit urgency

**These are physics**. They describe **what exists** and **what's measured**.

---

## ⚙️ **WHAT'S TUNABLE** (Governed Policy)

1. ⚙️ ERI formula weights (40-40-20 or other distributions)
2. ⚙️ Materiality rate thresholds (1%, 5%, 10%, or other values)
3. ⚙️ Volatility classification boundaries (36/180/360 votes/hr or other)
4. ⚙️ Volatility multipliers (1.0/0.8/0.6/0.4 or other)
5. ⚙️ Commit cadence recommendations (1hr/30min/10min/5min or other)

**These are policy**. They describe **how we use** the physics.

---

## 🎯 **CRITICAL DISTINCTION**

### Physics ≠ Policy

| Aspect | Physics (Locked) | Policy (Tunable) |
|--------|------------------|------------------|
| **What it is** | What exists | How we use it |
| **Example** | "Velocity is Δstate/Δt" | "40% weight on velocity" |
| **Can change?** | ❌ No (foundational) | ✅ Yes (governed) |
| **Versioned?** | No (timeless) | Yes (historical tracking) |
| **Governance** | CANON approval | Policy committee |

---

## 📝 **CANON FEEDBACK ADDRESSED**

### Original Error:
> "Locked ERI weights (40-40-20) and thresholds (1%, 5%, 10%) as 'non-negotiable foundational physics'"

### CANON Correction:
> "These are **policy choices**, not laws of nature. Must be **versioned** and **governed**."

### Fix Applied:
- ✅ Created `rateOfChangePolicy.mjs` (versioned policy system)
- ✅ Moved weights from hardcoded → policy
- ✅ Moved thresholds from hardcoded → policy
- ✅ Added policy version tracking
- ✅ Added policy proposal/approval system
- ✅ Updated documentation to clearly separate physics vs policy

---

## 🔒 **CANONICAL LOCK (Revised)**

**Architecture**: `@c18`  
**Name**: Timebox Rate-of-Change Physics  
**Status**: ✅ **APPROVED BY CANON**

**Locked (Physics)**:
- Position/velocity/acceleration derivatives exist
- Velocity-aware reality is first-class
- Materiality is objectively measurable by rate

**Tunable (Policy)**:
- ERI formula weights
- Materiality rate thresholds
- Volatility classification boundaries
- All other numeric parameters

---

## ✅ **CANON APPROVAL SUMMARY**

**Approved as foundational physics**: ✅ YES

**Corrections required**: ✅ APPLIED

**Distinction clarified**: ✅ Physics ≠ Policy

**Governance model added**: ✅ Versioned policy system

**Ready for production**: ⏳ After Phase 2B-D (Reality leg migration)

---

**Date**: 2026-01-31  
**Status**: ✅ **CORRECTED PER CANON FEEDBACK**  
**Next**: Commit corrections, await final CANON approval
