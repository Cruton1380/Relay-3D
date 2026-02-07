# 🔥 Relay Pressure Model

**Version**: 1.0.0  
**Last Updated**: 2026-02-06  
**Status**: Canonical

---

## Definition

**Pressure** is the accumulation of unresolved commitments, votes, or divergences that creates urgency signals without command authority.

**Critical Distinction**:
- **Pressure ≠ Authority**: Pressure influences perception and urgency, never triggers automatic execution
- **Pressure ≠ Command**: High pressure does not grant permission to execute
- **Pressure = Environmental Signal**: Users observe and respond; system does not auto-act

---

## Pressure Sources

### 1. Vote Accumulation
**When**: Proposals submitted but not resolved

**Pressure Calculation**:
```javascript
voteWeight = (supportCount / quorum) * voteAge * urgencyFactor;
```

**Decay**: None until resolved or expired

### 2. Time Drift (Staleness)
**When**: Commitments aging without execution

**Pressure Calculation**:
```javascript
staleness = (currentTime - commitTimestamp) / expectedDuration;
staleness = Math.min(staleness, 1.0);  // Cap at 100%
```

**Decay**: Grows linearly with time

### 3. Divergence
**When**: Conflicting commitments exist

**Pressure Calculation**:
```javascript
divergenceMagnitude = conflictCount * severityFactor;
```

**Decay**: Reduces when conflicts reconciled

### 4. Boundary Tension
**When**: Cross-jurisdiction conflicts

**Pressure Calculation**:
```javascript
boundaryTension = crossBoundaryConflicts * jurisdictionWeight;
```

**Decay**: Reduces when jurisdiction clarified

---

## Pressure Sinks (How Pressure Reduces)

### 1. Resolution
- **Trigger**: Decision made, commitment executed
- **Effect**: Pressure drops to zero immediately
- **Audit**: Resolution logged as commit

### 2. Expiry
- **Trigger**: Proposal timeout (default: 90 days)
- **Effect**: Pressure removed, proposal archived
- **Audit**: Expiry event logged

### 3. Reconciliation
- **Trigger**: Divergence resolved through governance
- **Effect**: Conflicting pressures collapse to unified pressure
- **Audit**: Reconciliation window logged

### 4. Delegation
- **Trigger**: Authority delegated to responsible party
- **Effect**: Pressure migrates to delegate's tree
- **Audit**: Delegation tracked in filament

---

## Pressure Calculation (Aggregate)

```javascript
function calculatePressure(context) {
    const voteWeight = calculateVotePressure(context.votes);
    const staleness = calculateStaleness(context.commits);
    const divergence = calculateDivergence(context.conflicts);
    const boundaryTension = calculateBoundaryTension(context.crossBoundary);
    
    // Weighted sum
    const rawPressure = (
        voteWeight * 0.4 +
        staleness * 0.3 +
        divergence * 0.2 +
        boundaryTension * 0.1
    );
    
    // Time decay factor (pressure reduces naturally over time if unaddressed)
    const timeDecay = Math.exp(-0.01 * context.daysSinceLastActivity);
    
    return rawPressure * (1 - timeDecay);
}
```

---

## Visual Encoding Rules

### Pressure → Color/Heat

| Pressure Level | Color | Emissive | Glow |
|----------------|-------|----------|------|
| **Low** (0-30%) | Green → Yellow | 0.0 | None |
| **Medium** (30-70%) | Yellow → Orange | 0.3 | Subtle pulse |
| **High** (70-90%) | Orange → Red | 0.6 | Strong pulse |
| **Critical** (>90%) | Bright Red | 1.0 | Rapid pulse + throb |

### Pressure → Geometry

| Pressure Level | Filament Thickness | Branch Deformation |
|----------------|-------------------|-------------------|
| Low (0-30%) | 1.0x (baseline) | None |
| Medium (30-70%) | 1.5x | Slight bend toward pressure |
| High (70-90%) | 2.0x | Visible bend |
| Critical (>90%) | 3.0x | Strong bend + shake |

### Pressure → Motion

| Pressure Level | Animation |
|----------------|-----------|
| Low | Static or slow drift |
| Medium | Subtle pulse (2 sec cycle) |
| High | Strong pulse (1 sec cycle) |
| Critical | Rapid pulse (0.5 sec) + particle flow |

---

## Interaction Effects

### Camera Resistance (Sticky Focus)
**High-pressure areas resist zoom-out**:

```javascript
function applyCameraResistance(cameraController, pressure) {
    if (pressure > 0.7) {
        const resistanceFactor = (pressure - 0.7) / 0.3;  // 0 to 1
        cameraController.zoomSpeed *= (1 - resistanceFactor * 0.6);  // Up to 60% slower
    }
}
```

**Why**: Urgent items "hold attention" without forcing.

### Branch Deformation
**Branches bend toward high-pressure nodes**:

```javascript
function deformBranchTowardPressure(branch, pressureNodes) {
    const pressureCenter = calculatePressureWeightedCenter(pressureNodes);
    const deformVector = pressureCenter.subtract(branch.midpoint);
    
    const deformMagnitude = averagePressure * 0.2;  // Max 20% deformation
    branch.controlPoints[midIndex].add(deformVector.multiplyScalar(deformMagnitude));
}
```

**Why**: Structural stress becomes visible.

### HUD Alerts
**Critical pressure triggers warnings**:

```javascript
if (pressure > 0.9) {
    showHUDAlert({
        type: 'CRITICAL_PRESSURE',
        message: `⚠️ Critical pressure in ${context.name}`,
        action: 'Review pending commitments',
        canDismiss: true
    });
}
```

**Rule**: Alerts inform, never auto-execute.

### No Auto-Execution
**Pressure NEVER triggers automatic state changes**:

```javascript
// ❌ FORBIDDEN
if (pressure > 0.9) {
    autoApproveCommitment();  // VIOLATION
}

// ✅ CORRECT
if (pressure > 0.9) {
    recommendAction('Review commitment', commitment.id);  // Recommendation only
}
```

---

## Pressure Decay Over Time

**Rule**: Pressure naturally reduces if unaddressed, but slowly.

**Purpose**:
- Prevents permanent "hot" state
- Encourages timely resolution
- Allows system to "cool down" after resolution

**Implementation**:
```javascript
function applyPressureDecay(pressure, daysSinceLastActivity) {
    const decayRate = 0.01;  // 1% per day
    const decayFactor = Math.exp(-decayRate * daysSinceLastActivity);
    return pressure * (1 - decayFactor);
}
```

**Typical decay**:
- After 7 days: ~7% reduction
- After 30 days: ~26% reduction
- After 90 days: ~60% reduction

---

## Governance Rule (Locked)

**Pressure influences perception and urgency, never authority.**

### What Pressure CAN Do
✅ Change visual appearance (color, thickness, glow)  
✅ Affect camera behavior (resistance, sticky focus)  
✅ Generate alerts and recommendations  
✅ Inform human decision-making  

### What Pressure CANNOT Do
❌ Auto-approve commitments  
❌ Auto-execute changes  
❌ Override policy  
❌ Grant authority  
❌ Bypass reconciliation windows  

---

## Stigmergic Coordination

**Pressure is a stigmergic signal**:
- Users observe heat, deformation, alerts
- Users interpret as urgency
- Users respond with votes, commits, or deliberate deferral
- Coordination emerges from environmental reading

**No direct messaging required.**

---

## Testing Pressure Model

### Unit Tests

```javascript
describe('Pressure Calculation', () => {
    it('should calculate pressure from multiple sources', () => {
        const context = {
            votes: [{ support: 10, quorum: 15, age: 7 }],
            commits: [{ timestamp: Date.now() - 30 * 86400000 }],  // 30 days old
            conflicts: [],
            crossBoundary: []
        };
        
        const pressure = calculatePressure(context);
        
        expect(pressure).toBeGreaterThan(0.3);
        expect(pressure).toBeLessThan(0.7);
    });
    
    it('should apply decay over time', () => {
        const pressure = 0.9;
        const decayed = applyPressureDecay(pressure, 30);
        
        expect(decayed).toBeLessThan(pressure);
        expect(decayed).toBeGreaterThan(0.6);
    });
});
```

### Visual Tests

- [ ] High pressure areas glow red
- [ ] Camera resists zooming away from critical pressure
- [ ] Branches visibly deform toward pressure
- [ ] Alerts appear at critical threshold
- [ ] Pressure reduces after resolution

---

## Summary

**Pressure** is Relay's core governance mechanism:
- Accumulates from votes, staleness, divergence
- Visualized as heat, deformation, motion
- Influences perception and urgency
- **Never auto-executes**
- Reduces through resolution, expiry, reconciliation

**This model keeps Relay humane**: humans decide, pressure informs.

---

*See also*:
- [Governance Cadence](./GOVERNANCE-CADENCE.md) - When pressure triggers review
- [Stigmergic Coordination](../architecture/STIGMERGIC-COORDINATION.md) - How pressure enables coordination
