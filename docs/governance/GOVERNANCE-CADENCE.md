# ⏰ Relay Governance Cadence

**Version**: 1.0.0  
**Last Updated**: 2026-02-06  
**Status**: Canonical

---

## Definition

**Governance cadence** defines when decisions are made, when action is required, and when inaction becomes refusal.

**Rule**: Cadence is not deadline—it is rhythm. Relay uses recurring windows, not arbitrary dates.

---

## Decision Cadence (When Decisions Happen)

### Weekly Cadence
**Purpose**: Routine parameter adjustments

**Scope**:
- Minor parameter tweaks (< 10% change)
- Operational fixes
- Resource allocation adjustments

**Process**:
- Proposals open Monday 00:00 UTC
- Voting window: 7 days
- Resolution: Following Monday 00:00 UTC

**Quorum**: 30% of eligible voters

### Monthly Cadence
**Purpose**: Policy reviews and moderate changes

**Scope**:
- Policy modifications
- Structural changes (10-30% impact)
- Cross-boundary coordination

**Process**:
- Proposals open 1st of month 00:00 UTC
- Voting window: 30 days
- Reconciliation window: 7 days
- Resolution: 1st of following month

**Quorum**: 50% of eligible voters

### Event-Triggered Cadence
**Purpose**: Critical threshold crossings or emergencies

**Scope**:
- Critical pressure (>90%)
- System failures
- Urgent boundary conflicts
- Constitutional violations

**Process**:
- Immediate proposal
- Accelerated voting: 24-72 hours
- Reconciliation: 24 hours
- Resolution: As soon as quorum + approval reached

**Quorum**: 60% of eligible voters

---

## Promotion Thresholds (When Proposals Advance)

### Proposal → Active

**Criteria**:
- ✅ Quorum reached (threshold varies by cadence)
- ✅ Approval ≥ 60%
- ✅ No vetoes from jurisdictional authorities
- ✅ Policy compliance verified

**Effect**: Proposal becomes "Active" - enters reconciliation window

### Active → Binding

**Criteria**:
- ✅ Reconciliation window elapsed (7-30 days depending on cadence)
- ✅ No new vetoes during reconciliation
- ✅ No blocking objections
- ✅ Technical feasibility confirmed

**Effect**: Proposal becomes "Binding" - implementation authorized

### Binding → Executed

**Criteria**:
- ✅ Timebox allocated
- ✅ Operator assigned
- ✅ Commitment signed
- ✅ Execution logged with commit ref

**Effect**: State change committed, pressure released

---

## Reconciliation Windows (How Long Divergence Can Exist)

### Standard Reconciliation
**Duration**: 7 days  
**Purpose**: Allow objections, surface conflicts  
**Applies To**: Weekly and monthly cadences

**During Window**:
- Vetoes can be filed
- Objections can be raised
- Alternative proposals can be submitted
- Technical concerns can be surfaced

**After Window**:
- If no blocking objections → proceed to Binding
- If blocking objections → return to Proposal (revise + re-vote)

### Urgent Reconciliation
**Duration**: 24 hours  
**Purpose**: Critical issues that can't wait  
**Applies To**: Event-triggered cadence only

**Rule**: Urgent reconciliation requires explicit justification logged as commit.

### Constitutional Reconciliation
**Duration**: 30 days  
**Purpose**: Fundamental system changes  
**Applies To**: Changes to governance rules themselves

**Rule**: Constitutional changes require longer window + higher quorum (75%).

---

## Sunset Rules (When Commitments Expire)

### Uncommitted Proposals
**Expiry**: 90 days after submission

**Process**:
1. Proposal open for voting
2. If no quorum after 90 days → Auto-archive
3. Pressure released
4. Proposal can be resubmitted (with updated context)

**Audit**: Expiry logged, original proposal preserved in history

### Stale Policies
**Review Trigger**: 1 year since last modification

**Process**:
1. Automatic review flag raised
2. Steward must confirm: "Reaffirm" or "Revise"
3. If no action within 30 days → Policy suspended (not deleted)
4. Suspended policy requires re-approval to reactivate

**Audit**: Review and reaffirmation logged

### Dormant Relationships
**Archive Trigger**: 6 months of inactivity (no commits)

**Process**:
1. Relationship flagged as dormant
2. Parties notified
3. If no activity within 30 days → Archive
4. Archived relationships preserved but hidden
5. Can be reactivated with new commits

**Audit**: Dormancy and archival logged

---

## Inaction Interpretation (When Nothing Happens)

### Inaction as Deferral (Default)
**Interpretation**: No vote = no strong opinion = implicit delegation to quorum

**Effect**: Proposal proceeds if quorum + approval reached (ignoring non-voters)

### Inaction as Refusal (Explicit)
**Interpretation**: If proposal requires explicit approval from specific party, their inaction = refusal

**Effect**: Proposal blocked until explicit approval given

**Example**:
- Cross-boundary relationships require approval from all involved jurisdictions
- Inaction by any jurisdiction = refusal
- Proposal cannot proceed until all approve

### Distinguishing Deferral from Refusal

**Deferral**:
- No explicit approval required from this party
- Quorum-based decision
- General governance

**Refusal**:
- Explicit approval required (constitutional, cross-boundary, financial)
- Named party must act
- Inaction blocks progression

---

## Pressure Accumulation Curves

### Linear Accumulation (Votes)
```
Pressure
    ^
    |        /
    |       /
    |      /
    |     /
    |    /
    |___/________> Time
```

### Exponential Accumulation (Staleness)
```
Pressure
    ^
    |          /|
    |        /  |
    |      /    |
    |    /      |
    |  /        |
    |/_________> Time
```

### Spike Accumulation (Divergence)
```
Pressure
    ^
    | |
    | |
    | |
    |_|_________> Conflict Event
```

---

## Cadence Governance (Meta-Rule)

**Who sets cadence?**
- Weekly cadence: Set by local tree steward
- Monthly cadence: Set by boundary governance
- Event-triggered: Automatic (pressure threshold)
- Constitutional: Fixed (30 days, cannot be changed without constitutional amendment)

**Can cadence be changed?**
- Yes, but only through monthly or constitutional cadence (not weekly)
- Change requires 75% approval + 30-day reconciliation

---

## Implementation

### Tracking Pressure

```javascript
// core/models/pressure-state.js (NO Cesium imports)
export const pressureState = {
    nodes: {
        // 'cell-A1': { pressure: 0.45, sources: {votes: 0.2, staleness: 0.25}, lastUpdate: timestamp }
    },
    boundaries: {
        // 'ISR': { pressure: 0.62, ... }
    },
    relationships: {
        // 'rel-companyA-B': { pressure: 0.85, ... }
    }
};

export function updatePressure(context) {
    const pressure = calculatePressure(context);
    pressureState.nodes[context.id] = {
        pressure,
        sources: context.sources,
        lastUpdate: Date.now()
    };
}
```

### Rendering Pressure

```javascript
// app/renderers/pressure-renderer.js (MAY import Cesium)
export class PressureRenderer {
    applyPressureVisuals(filament, pressure) {
        // Color
        const color = this.pressureToColor(pressure);
        filament.material = new Cesium.Material({ color });
        
        // Thickness
        const thickness = 1.0 + (pressure * 2.0);  // 1x to 3x
        filament.width = baseWidth * thickness;
        
        // Animation
        if (pressure > 0.7) {
            this.addPulseAnimation(filament, pressure);
        }
    }
    
    pressureToColor(pressure) {
        if (pressure < 0.3) return Cesium.Color.GREEN;
        if (pressure < 0.7) return Cesium.Color.lerp(Cesium.Color.YELLOW, Cesium.Color.ORANGE, (pressure - 0.3) / 0.4);
        if (pressure < 0.9) return Cesium.Color.lerp(Cesium.Color.ORANGE, Cesium.Color.RED, (pressure - 0.7) / 0.2);
        return Cesium.Color.RED;
    }
}
```

---

## Testing Cadence

### Unit Tests

```javascript
describe('Governance Cadence', () => {
    it('should promote proposal after quorum + approval', () => {
        const proposal = createProposal({ cadence: 'weekly' });
        submitVotes(proposal, { support: 70, oppose: 30 });
        
        const status = checkProposalStatus(proposal);
        expect(status).toBe('ACTIVE');
    });
    
    it('should expire proposals after 90 days', () => {
        const proposal = createProposal({ timestamp: Date.now() - 91 * 86400000 });
        
        const status = checkProposalStatus(proposal);
        expect(status).toBe('EXPIRED');
    });
});
```

---

## Summary

**Relay Governance Cadence** ensures:
- Decisions have rhythm (not arbitrary timing)
- Pressure accumulates predictably
- Reconciliation windows allow objections
- Inaction is interpreted correctly (deferral vs refusal)
- Old commitments sunset gracefully

**This cadence keeps Relay humane**: urgent matters get attention, routine matters get rhythm, constitutional matters get deliberation.

---

*See also*:
- [Pressure Model](./PRESSURE-MODEL.md) - How pressure accumulates
- [Stage Gates](./STAGE-GATES.md) - Governance gates
- [Master Build Plan](../architecture/RELAY-MASTER-BUILD-PLAN.md) - Canonical system plan
