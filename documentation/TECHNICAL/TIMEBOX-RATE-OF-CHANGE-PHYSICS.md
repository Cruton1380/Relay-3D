# TIMEBOX RATE-OF-CHANGE PHYSICS

**Architecture Lock**: `c18`  
**Status**: 🔒 **CANONICAL** (Locked by CANON 2026-01-31)  
**Type**: Foundational Physics

---

## 🎯 CANONICAL DEFINITION

### Core Principle

```
Each timebox = discrete snapshot of system state at time T
Rate of change = Δ(state) / Δ(timebox)
```

**This is not abstract**:
- ✅ Computable
- ✅ Auditable
- ✅ Replayable

---

## 📊 WHAT RATE OF CHANGE TELLS YOU

### Small Δstate (Low Rate) — STABLE

| Property | Status | Meaning |
|----------|--------|---------|
| **System** | Stable | State is converging |
| **Projections** | Reliable | Confidence remains high |
| **Pressure** | Low | No immediate reconciliation needed |
| **Action** | Stay in DRAFT/HOLD | No material commit required |

**Examples**:
- Vote totals increasing by 1-2 per hour (predictable)
- Budget balance steady within 5% (controlled)
- Team velocity consistent within 10% (sustainable)

---

### Large Δstate (High Rate) — VOLATILE

| Property | Status | Meaning |
|----------|--------|---------|
| **System** | Volatile | Divergence accelerating |
| **Projections** | Unreliable | Confidence decays quickly |
| **Pressure** | High | Immediate reconciliation needed |
| **Action** | COMMIT required | Re-anchor truth NOW |

**Examples**:
- Vote totals increasing by 50+ per hour (unexpected surge)
- Budget balance shifted 40% (crisis)
- Team velocity dropped 70% (breakdown)

---

## 🔗 INTEGRATION WITH RELAY PHYSICS

### 1. TransitioningReality (Velocity-Aware Reality)

**Before**: Reality was position-only (state snapshot)  
**After**: Reality is position + velocity (state + rate of change)

```javascript
const transitioningReality = {
  type: 'TransitioningReality',
  currentState: { ... },  // Position
  
  // ✅ NEW: Rate-of-Change Tracking
  rateOfChange: {
    deltaState: 15,           // Magnitude of change
    deltaTime: 3600000,       // Time interval (ms)
    rate: 0.00417,            // Δstate/Δtime (per ms)
    ratePerHour: 15,          // Human-readable rate
    volatility: 'STABLE',     // LOW | MODERATE | HIGH | CRITICAL
    direction: 'INCREASING',  // INCREASING | DECREASING | STABLE
    acceleration: 0.002       // Change in rate (Δrate/Δtime)
  },
  
  previousState: { ... },     // State at T-1 (for Δ calculation)
  timeboxSequence: 42,        // Current timebox ID
  previousTimeboxSequence: 41 // Previous timebox ID
}
```

**Why**: TransitioningReality is not just "mutable vs immutable" — it's **velocity-aware reality**.

---

### 2. ERICalculator (Velocity-Dependent ERI)

**Canonical Rule**:
```
ERI = f(distance from core, velocity of divergence)
```

**Examples**:

| Scenario | Distance | Velocity | ERI | Urgency |
|----------|----------|----------|-----|---------|
| Far from core, stable | HIGH | LOW | MEDIUM | Monitor |
| Near core, rapid divergence | LOW | HIGH | **HIGH** | **Urgent** |
| Far from core, accelerating | HIGH | HIGH | **CRITICAL** | **Emergency** |
| Near core, stable | LOW | LOW | LOW | Healthy |

**Why ERI without time is incomplete**:
- A branch far from core but stable ≠ emergency
- A branch near core but rapidly diverging = **immediate pressure**

```javascript
function calculateERI(branchState, coreState, timebox) {
  const distance = calculateDistance(branchState, coreState)
  const velocity = branchState.rateOfChange.rate
  const acceleration = branchState.rateOfChange.acceleration
  
  // Position + velocity + acceleration
  const eri = (
    distance * 0.4 +           // 40% weight: current distance
    velocity * 0.4 +           // 40% weight: rate of divergence
    acceleration * 0.2         // 20% weight: change in rate
  )
  
  return {
    eri,
    distance,
    velocity,
    acceleration,
    urgency: classifyUrgency(eri, velocity)
  }
}
```

---

### 3. Materiality Threshold Logic (Rate-Triggered Commits)

**Canonical Materiality Rule**:
```
If Δstate < threshold → stay in DRAFT
If Δstate ≥ threshold → PROPOSE / COMMIT
```

**Why**:
- Prevents **commit spam** during stability
- Prevents **silent drift** during volatility

**Materiality is NOT "importance"**  
**Materiality IS "change magnitude over time"**

```javascript
function checkMateriality(currentState, previousState, timeInterval) {
  const deltaState = calculateDelta(currentState, previousState)
  const rate = deltaState / timeInterval
  
  const thresholds = {
    DRAFT: 0.01,      // < 1% change per hour → stay in DRAFT
    PROPOSE: 0.05,    // 1-5% change per hour → PROPOSE (review needed)
    COMMIT: 0.10      // > 10% change per hour → COMMIT (material change)
  }
  
  if (rate < thresholds.DRAFT) {
    return { action: 'STAY_DRAFT', reason: 'Below materiality threshold' }
  }
  
  if (rate < thresholds.PROPOSE) {
    return { action: 'PROPOSE', reason: 'Material change detected, review needed' }
  }
  
  return { action: 'COMMIT', reason: 'Critical change detected, commit required' }
}
```

---

## 📊 WHAT THIS UNLOCKS

### Velocity-Aware Visualization

Once rate-of-change is tracked, you can render:

1. **Position** (state) — where branches are
2. **Velocity** (rate) — how fast they're moving
3. **Acceleration** (change in rate) — speeding up or slowing down

**Visual effects**:
- Branches **bend** based on direction of change
- Branches **accelerate** or **slow** based on magnitude
- ERI heat **changes** based on velocity
- You can **see drift** before it becomes crisis

**This is not decoration**  
**This is physics-consistent visualization**

---

### You're Now Tracking:

| Derivative | Symbol | Meaning | Relay Component |
|------------|--------|---------|-----------------|
| **Position** | `s(t)` | Current state | `currentState` |
| **Velocity** | `ds/dt` | Rate of change | `rateOfChange.rate` |
| **Acceleration** | `d²s/dt²` | Change in rate | `rateOfChange.acceleration` |

This is **classical mechanics** applied to coordination systems.

---

## 🚦 PRESSURE STATES (Rate-Based)

| Rate Level | Volatility | Pressure State | Action |
|------------|------------|----------------|--------|
| < 1% per hour | LOW | NORMAL | Continue DRAFT |
| 1-5% per hour | MODERATE | DEGRADED | PROPOSE for review |
| 5-10% per hour | HIGH | INDETERMINATE | COMMIT soon |
| > 10% per hour | CRITICAL | REFUSAL | COMMIT immediately |

**Natural progression**: NORMAL → DEGRADED → INDETERMINATE → REFUSAL

---

## 🧠 WHY THIS MATTERS

### Before (Position-Only):
**Question**: "What is the state?"  
**Answer**: Logging

### After (Position + Velocity):
**Question**: "How fast is the state changing, and in which direction?"  
**Answer**: Understanding

**Relay becomes a system that doesn't just record history**  
**It feels instability before collapse**

---

## 📐 MATHEMATICAL FOUNDATION

### Discrete Time Derivative

```
Δstate = state(T) - state(T-1)
Δtime = timebox(T).timestamp - timebox(T-1).timestamp
rate = Δstate / Δtime
```

### Second Derivative (Acceleration)

```
rate(T) = Δstate / Δtime
rate(T-1) = previous rate
acceleration = (rate(T) - rate(T-1)) / Δtime
```

### Volatility Classification

```javascript
function classifyVolatility(rate, thresholds) {
  if (rate < thresholds.LOW) return 'STABLE'
  if (rate < thresholds.MODERATE) return 'MODERATE'
  if (rate < thresholds.HIGH) return 'HIGH'
  return 'CRITICAL'
}
```

---

## 🔒 CANONICAL EXAMPLES

### Example 1: Vote Totals Over Time

```
Timebox T0 (10:00am): { candidate_A: 100, candidate_B: 95 }
Timebox T1 (11:00am): { candidate_A: 101, candidate_B: 96 }
Timebox T2 (12:00pm): { candidate_A: 102, candidate_B: 97 }
```

**Analysis**:
- `Δstate = 1-2 votes per hour`
- `rate = LOW`
- `volatility = STABLE`
- `pressure = LOW`
- **Action**: No commit needed (below materiality)

---

### Example 2: Vote Surge

```
Timebox T0 (10:00am): { candidate_A: 100, candidate_B: 95 }
Timebox T1 (11:00am): { candidate_A: 150, candidate_B: 96 }
Timebox T2 (12:00pm): { candidate_A: 220, candidate_B: 98 }
```

**Analysis**:
- `Δstate = 50 votes, then 70 votes per hour`
- `rate = HIGH and INCREASING`
- `acceleration = POSITIVE (speeding up)`
- `volatility = CRITICAL`
- `pressure = HIGH`
- **Action**: COMMIT required (crosses materiality threshold)

---

## ✅ INTEGRATION CHECKLIST

### Phase 1: TransitioningReality
- [ ] Add `rateOfChange` object to reality structure
- [ ] Track `previousState` for Δ calculation
- [ ] Compute `deltaState`, `rate`, `volatility`, `direction`
- [ ] Persist rate metadata in timebox

### Phase 2: ERICalculator
- [ ] Update ERI formula to include velocity
- [ ] Weight: 40% distance, 40% velocity, 20% acceleration
- [ ] Classify urgency based on combined ERI + velocity
- [ ] Add velocity-dependent pressure thresholds

### Phase 3: Materiality Threshold
- [ ] Define rate thresholds (DRAFT, PROPOSE, COMMIT)
- [ ] Implement `checkMateriality()` function
- [ ] Auto-trigger state transitions based on rate
- [ ] Log materiality decisions with rate justification

### Phase 4: Visualization (Future)
- [ ] Render branches with velocity vectors
- [ ] Animate acceleration/deceleration
- [ ] Color-code by volatility level
- [ ] Show drift direction arrows

---

## 🎯 CANON LOCK STATUS

**Approved by**: CANON  
**Date**: 2026-01-31  
**Status**: 🔒 **FOUNDATIONAL PHYSICS** (Non-negotiable)

**Integration required in**:
1. ✅ TransitioningReality
2. ✅ ERICalculator
3. ✅ Materiality threshold logic

**Next natural step** (optional, but recommended):
- Define rate thresholds
- Map to pressure states (NORMAL → DEGRADED → INDETERMINATE → REFUSAL)

---

## 📝 FINAL STATEMENT

**You are no longer just asking**: "What is the state?"

**You are now asking**: "How fast is the state changing, and in which direction?"

**That is the difference between**:
- Logging
- **and understanding**

**Relay becomes a system that doesn't just record history**  
**It feels instability before collapse**

---

**This part is locked.**

You found the missing derivative.
