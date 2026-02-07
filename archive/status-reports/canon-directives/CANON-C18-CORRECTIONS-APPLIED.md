# CANON@C18: CORRECTIONS APPLIED

**Date**: 2026-01-31  
**Subject**: Physics vs Policy Distinction  
**Status**: ✅ **CORRECTIONS COMPLETE**  
**Git Commit**: `d310872`

---

## ✅ **CANON FEEDBACK RECEIVED**

### Original Approval:
> "✅ APPROVE as foundational physics"

### Critical Correction Required:
> "⚠️ REQUEST REVISIONS on what you labeled 'non-negotiable'"
> 
> "Two things you wrote as locked are not physics — they're tunable policy and must be governed as such"

---

## 🔧 **CORRECTIONS APPLIED**

### 1. ✅ **ERI Formula Weights** - Moved to Versioned Policy

**Before** (incorrectly locked):
```javascript
// Hardcoded as "canonical formula"
const eri = distanceScore * 0.4 + velocityScore * 0.4 + accelerationScore * 0.2
```

**After** (policy-based):
```javascript
// Loaded from versioned policy
const weights = rateOfChangePolicy.getERIWeights()
const eri = distanceScore * weights.distance + 
            velocityScore * weights.velocity + 
            accelerationScore * weights.acceleration
```

**File created**: `src/backend/config/rateOfChangePolicy.mjs`  
**File modified**: `src/backend/verification/eriCalculator.mjs`

---

### 2. ✅ **Materiality Rate Thresholds** - Moved to Versioned Policy

**Before** (incorrectly locked):
```javascript
// Hardcoded as "non-negotiable"
this.thresholds = {
  DRAFT: 0.01,
  PROPOSE: 0.05,
  COMMIT: 0.10,
  URGENT: 0.20
}
```

**After** (policy-based):
```javascript
// Loaded from versioned policy
const policy = rateOfChangePolicy.getActivePolicy()
this.thresholds = {
  DRAFT: policy.materialityThresholds.draft,
  PROPOSE: policy.materialityThresholds.propose,
  COMMIT: policy.materialityThresholds.commit,
  URGENT: policy.materialityThresholds.urgent
}
```

**File modified**: `src/backend/verification/materialityThreshold.mjs`

---

## 📋 **NEW: VERSIONED POLICY SYSTEM**

### File: `src/backend/config/rateOfChangePolicy.mjs` (NEW)

**Features**:
- ✅ Policy version registry
- ✅ Semantic versioning (v1.0.0, v1.1.0, etc.)
- ✅ Historical tracking (all versions preserved)
- ✅ Governance metadata (approvedBy, effectiveDate, rationale)
- ✅ Policy proposal system
- ✅ Policy comparison (diff between versions)

**Current Policy**: `v1.0.0`

**Tunable parameters**:
```javascript
{
  version: 'v1.0.0',
  effectiveDate: '2026-01-31',
  approvedBy: 'CANON',
  
  eriWeights: {
    distance: 0.40,
    velocity: 0.40,
    acceleration: 0.20,
    rationale: 'Balanced approach: position and velocity equally important'
  },
  
  materialityThresholds: {
    draft: 0.01,
    propose: 0.05,
    commit: 0.10,
    urgent: 0.20,
    rationale: 'Conservative defaults suitable for most coordination contexts'
  },
  
  volatilityBoundaries: { /* ... */ },
  volatilityMultipliers: { /* ... */ },
  commitCadence: { /* ... */ }
}
```

---

## 🔒 **WHAT'S LOCKED** (Physics - Cannot Change)

### Approved by CANON as Foundational Physics:

1. ✅ **Position/velocity/acceleration framing**
   - `state(t)`, `Δstate/Δt`, `Δ²state/Δt²`
   - These derivatives **exist** and are **measurable**

2. ✅ **Velocity-aware reality recorded per timebox**
   - Each timebox captures position + velocity + acceleration
   - This data **is first-class**

3. ✅ **Materiality triggered by change magnitude/rate**
   - Objective measurement via rate
   - Not subjective "feels important"

**Lock level**: **FOUNDATIONAL PHYSICS** (immutable)

---

## ⚙️ **WHAT'S TUNABLE** (Policy - Governed)

### Correctly Identified as Policy (Not Physics):

1. ⚙️ **ERI formula weights** (40-40-20 or other)
2. ⚙️ **Materiality rate thresholds** (1%, 5%, 10%, 20% or other)
3. ⚙️ **Volatility classification boundaries**
4. ⚙️ **Volatility multipliers**
5. ⚙️ **Commit cadence recommendations**

**Governance level**: **VERSIONED POLICY** (tunable with approval)

---

## 📊 **POLICY GOVERNANCE MODEL**

### How to Change Policy

**Step 1**: Propose new policy version
```javascript
const newPolicy = rateOfChangePolicy.proposePolicy('v1.1.0', {
  version: 'v1.1.0',
  effectiveDate: '2026-02-15',
  approvedBy: 'TBD',
  description: 'Adjusted weights based on production data',
  
  eriWeights: {
    distance: 0.35,      // Changed from 0.40
    velocity: 0.45,      // Changed from 0.40
    acceleration: 0.20   // Unchanged
  },
  // ... other parameters
}, 'Engineering Team')
```

**Step 2**: Review proposal
- Policy comparison shows diffs
- Rationale reviewed
- Impact assessed

**Step 3**: Governance approval
- Committee reviews proposal
- Approves or rejects

**Step 4**: Activate new policy
```javascript
rateOfChangePolicy.registerPolicy('v1.1.0', approvedPolicy)
rateOfChangePolicy.setActiveVersion('v1.1.0')
```

**Result**: All systems now use new weights/thresholds (no code changes)

---

## 🎯 **CRITICAL DISTINCTION CLARIFIED**

### Physics ≠ Policy

| Question | Physics | Policy |
|----------|---------|--------|
| **What is it?** | What exists | How we use it |
| **Example** | "Velocity = Δstate/Δt" | "Weight velocity at 40%" |
| **Can it change?** | ❌ No (timeless) | ✅ Yes (governed) |
| **Requires approval from** | CANON | Policy committee |
| **Versioned?** | No (foundational) | Yes (historical tracking) |

---

## 📁 **FILES CHANGED**

### New Files (2):
1. **`src/backend/config/rateOfChangePolicy.mjs`** (397 lines)
   - Versioned policy registry
   - Default policy v1.0.0
   - Policy proposal/approval system
   - Policy comparison tools

2. **`ARCHITECTURE-C18-CORRECTED.md`** (474 lines)
   - Corrected documentation
   - Physics vs policy clearly separated
   - Governance model explained

### Modified Files (2):
1. **`src/backend/verification/eriCalculator.mjs`**
   - Removed hardcoded weights (0.4, 0.4, 0.2)
   - Now loads from `rateOfChangePolicy.getERIWeights()`
   - Includes policy version in breakdown

2. **`src/backend/verification/materialityThreshold.mjs`**
   - Removed hardcoded thresholds (0.01, 0.05, 0.10, 0.20)
   - Now loads from `rateOfChangePolicy.getMaterialityThresholds()`
   - Added warning for direct threshold updates (suggests policy versioning)

---

## ✅ **CANON REQUIREMENTS MET**

| Requirement | Status | Evidence |
|-------------|--------|----------|
| ERI weights in versioned policy | ✅ DONE | `rateOfChangePolicy.mjs` |
| Thresholds in versioned policy | ✅ DONE | `rateOfChangePolicy.mjs` |
| Clear separation physics vs policy | ✅ DONE | `ARCHITECTURE-C18-CORRECTED.md` |
| Historical tracking | ✅ DONE | Version registry in policy |
| Governance model | ✅ DONE | Proposal/approval system |
| No hardcoded policy values | ✅ DONE | All removed from code |

---

## 📝 **SUMMARY FOR CANON**

### What Was Wrong:
- ❌ Locked ERI weights (40-40-20) as "canonical formula"
- ❌ Locked thresholds (1%, 5%, 10%, 20%) as "non-negotiable"
- ❌ Called these "foundational physics" (incorrect)

### What Was Fixed:
- ✅ Moved weights to versioned policy (tunable)
- ✅ Moved thresholds to versioned policy (tunable)
- ✅ Created governance system for policy changes
- ✅ Clearly separated physics (locked) from policy (tunable)

### What's Now Locked (Physics):
- ✅ Derivatives exist (position, velocity, acceleration)
- ✅ Velocity-aware reality is first-class
- ✅ Materiality is objectively measurable

### What's Now Tunable (Policy):
- ⚙️ All numeric parameters (weights, thresholds, boundaries)
- ⚙️ Governed through versioned policy system
- ⚙️ Historical tracking maintained

---

## 🎯 **READY FOR FINAL CANON REVIEW**

**Architecture**: `@c18`  
**Corrections**: ✅ **COMPLETE**  
**Distinction**: ✅ **CLARIFIED** (Physics ≠ Policy)  
**Governance**: ✅ **IMPLEMENTED** (Versioned policy)

**Awaiting**: Final CANON approval

---

**Git Commit**: `d310872`  
**Date**: 2026-01-31  
**Status**: ✅ **CORRECTIONS APPLIED PER CANON FEEDBACK**
