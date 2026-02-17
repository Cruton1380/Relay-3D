# 🐜 Relay Stigmergic Coordination

**Version**: 1.0.0  
**Last Updated**: 2026-02-06  
**Status**: Canonical

---

## Definition

**Stigmergy** is coordination via environmental traces, not direct messages.

**In Relay**:
- Users observe the world (heat, deformation, timeboxes, boundaries)
- Users respond to what they see
- Coordination emerges from environmental reading

**No central dispatcher. No command queue. No broadcast channel.**

---

## Why Stigmergy?

### Traditional Coordination (Command & Control)

```
Manager → Task Board → Worker
   |
   └─> Message Queue → Worker
   |
   └─> Direct Message → Worker
```

**Problems**:
- Manager becomes bottleneck
- Workers idle when queue empty
- Coordination requires constant messaging
- Fragile (single point of failure)

### Stigmergic Coordination (Environmental)

```
Worker observes environment
    ↓
Worker sees: heat, deformation, timeboxes
    ↓
Worker decides what's urgent
    ↓
Worker acts (or doesn't)
    ↓
Environment updates (pressure changes)
    ↓
Other workers observe new state
```

**Advantages**:
- No bottleneck (everyone reads environment)
- Scalable (environment is shared read)
- Resilient (no single point of failure)
- Emergent (patterns arise from local rules)

---

## Stigmergic Signals in Relay

### 1. Visual Pressure (Heat)

**What You See**:
- Green: Low pressure, routine maintenance
- Yellow: Rising pressure, pay attention
- Orange: High pressure, action needed soon
- Red: Critical pressure, urgent

**What It Means**:
- "Someone needs to look at this"
- NOT "You must do X now"

**How It Coordinates**:
- Multiple people see red
- Someone volunteers (or steward delegates)
- Action taken
- Pressure drops
- Others see pressure drop → know it's handled

### 2. Geometric Deformation (Structure)

**What You See**:
- Straight branches: No stress
- Bent branches: Pressure pulling toward something
- Thick filaments: High commitment density
- Thin filaments: Low activity

**What It Means**:
- Branches bend toward unresolved pressure
- Thickness shows commitment flow
- Shape reveals structural stress

**How It Coordinates**:
- Deformation reveals dependencies
- Operators see what's blocked on what
- Action priorities emerge from shape

### 3. Timeboxes (Discrete Segments)

**What You See**:
- Segmented filaments with distinct colors/textures
- Boundary rings between segments
- Gaps or missing segments

**What It Means**:
- Each segment = commit window
- Missing segment = incomplete work
- Color = pressure or age

**How It Coordinates**:
- Users see which windows are incomplete
- Missing segments create urgency
- Completion is visible (segment appears)

### 4. Boundary Shells

**What You See**:
- Opaque shells (jurisdiction boundaries)
- Transparent or glowing edges (active governance)
- Collapsed shells (inactive jurisdiction)

**What It Means**:
- Shell = legal/governance boundary
- Glow = active voting or pressure
- Collapsed = dormant or archived

**How It Coordinates**:
- Users see which jurisdictions are active
- Cross-boundary relationships visible as core routes
- Conflicts visible as overlapping or deformed shells

### 5. Weather Overlays

**What You See**:
- Imagery layer (temperature, precipitation, wind)
- Color gradients over Earth surface
- Animated flow patterns

**What It Means**:
- Environmental context (not command)
- Symbolic or literal weather
- Influences perception, not authority

**How It Coordinates**:
- Shared context reduces ambiguity
- Environmental changes visible to all
- No need to "announce" context

### 6. Cell Proximity Reveal

**What You See**:
- Cells fade in when close
- Cells fade out when far
- High-pressure cells stay visible longer

**What It Means**:
- Detail on demand
- Urgency overrides distance fade

**How It Coordinates**:
- Users naturally focus on nearby + urgent
- No explicit "assignment" needed
- Attention emerges from proximity + heat

---

## Stigmergic Rules (Locked)

### Rule 1: No Direct Messaging for Coordination

❌ Forbidden:
- "Task assigned to Alice" notifications
- "Bob, please review X" messages
- "Team, we need to do Y" broadcasts

✅ Allowed:
- Alice sees red cell, decides to act
- Bob sees high-pressure branch, volunteers
- Team observes environment, coordinates via what they see

### Rule 2: Environment is Truth

**All coordination signals live in the world, not in a separate "task board" or "notification system."**

- If it's urgent, it glows red (in the world)
- If it's done, pressure drops (in the world)
- If it's blocked, branch deforms (in the world)

### Rule 3: Signals Are Informative, Not Authoritative

**Heat does not grant authority.**

- Red cell ≠ "You must fix this"
- Red cell = "This is urgent, someone should look"

**Who acts?**
- Volunteer (sees it, decides to act)
- Steward (delegates explicitly)
- Policy (role-based responsibility)

### Rule 4: Coordination is Local-First

**Users respond to what's near them (in space or responsibility).**

- Near in space: cells/sheets at your zoom level
- Near in responsibility: your tree, your jurisdiction
- Distant signals fade (proximity reveal)

**Exception**: Critical pressure overrides distance.

---

## Emergence vs Command

### Command (Traditional)

```
Central Authority
    ↓
Issues Order
    ↓
Workers Execute
    ↓
Report Back
```

**Characteristic**: Top-down, message-based, fragile

### Emergence (Stigmergic)

```
Environment Updates (pressure changes)
    ↓
Workers Observe
    ↓
Workers Act (based on local rules + signals)
    ↓
Environment Updates Again
    ↓
Coordination Emerges
```

**Characteristic**: Bottom-up, observation-based, resilient

---

## Examples of Stigmergic Coordination in Relay

### Example 1: Urgent Commitment

**Scenario**: A critical vote reaches 90% pressure.

**Traditional Approach**:
1. System sends email: "Critical vote needs attention"
2. Manager assigns: "Alice, review this"
3. Alice gets notification, clicks link

**Stigmergic Approach**:
1. Cell glows bright red
2. Branch deforms toward cell
3. Camera resists zooming away
4. Alice notices (because it's visually loud)
5. Alice clicks, reviews, acts

**Coordination**: No message, no assignment. Environment changed, Alice responded.

### Example 2: Cross-Company Relationship

**Scenario**: Two companies share a vendor.

**Traditional Approach**:
1. Email thread: "We both use Vendor X"
2. Shared spreadsheet or task board
3. Meetings to coordinate

**Stigmergic Approach**:
1. Core-routed relationship filament appears
2. Both companies see it in their views
3. Pressure accumulates on relationship filament if divergence
4. Either company can act to reconcile
5. Resolution visible immediately (pressure drops)

**Coordination**: No meetings, no emails. Shared environmental signal.

### Example 3: Stale Policy

**Scenario**: Policy hasn't been reviewed in 1 year.

**Traditional Approach**:
1. Calendar reminder: "Review policy X"
2. Manager assigns: "Bob, review this"

**Stigmergic Approach**:
1. Policy node turns yellow (aging pressure)
2. After 1 year, turns orange + flag
3. Steward sees it, reviews (or delegates)
4. Reaffirmation logged → color returns to green

**Coordination**: No reminder system. Environmental signal (color) triggered action.

---

## Implementation

### Rendering Stigmergic Signals

```javascript
// app/renderers/stigmergy-renderer.js
export class StigmergyRenderer {
    renderPressure(filament, pressure) {
        // Heat color
        filament.material.color = this.pressureToColor(pressure);
        
        // Thickness (commitment density)
        filament.width = baseWidth * (1 + pressure * 2);
        
        // Pulse (urgency)
        if (pressure > 0.7) {
            this.addPulseAnimation(filament, pressure);
        }
    }
    
    renderDeformation(branch, pressureNodes) {
        // Bend branch toward high-pressure nodes
        const pressureCenter = this.calculatePressureWeightedCenter(pressureNodes);
        const deformVector = pressureCenter.subtract(branch.midpoint);
        const deformMagnitude = averagePressure * 0.2;
        
        branch.controlPoints[midIndex].add(deformVector.multiplyScalar(deformMagnitude));
    }
    
    renderProximityReveal(cells, cameraPosition) {
        cells.forEach(cell => {
            const distance = Cesium.Cartesian3.distance(cell.position, cameraPosition);
            const proximityFactor = Math.max(0, 1 - distance / revealRadius);
            const pressureFactor = cell.pressure;
            
            // Combine proximity + pressure
            const visibility = Math.max(proximityFactor, pressureFactor * 0.8);
            cell.opacity = visibility;
        });
    }
}
```

### Observing Stigmergic Signals

```javascript
// core/services/stigmergy-observer.js (NO Cesium imports)
export class StigmergyObserver {
    observeEnvironment(context) {
        return {
            highPressureNodes: this.findNodesAboveThreshold(0.7),
            deformedBranches: this.findBranchesWithDeformation(),
            missingTimeboxes: this.findIncompleteWindows(),
            activeBoundaries: this.findBoundariesWithActivity(),
            weatherChanges: this.detectWeatherShifts()
        };
    }
    
    suggestActions(observations) {
        const suggestions = [];
        
        if (observations.highPressureNodes.length > 0) {
            suggestions.push({
                type: 'REVIEW_PRESSURE',
                nodes: observations.highPressureNodes,
                message: 'High pressure detected in {count} nodes'
            });
        }
        
        // ... more suggestions based on observations
        
        return suggestions;  // Suggestions, not commands
    }
}
```

---

## Testing Stigmergic Coordination

### Unit Tests

```javascript
describe('Stigmergic Coordination', () => {
    it('should render high pressure as red', () => {
        const renderer = new StigmergyRenderer();
        const color = renderer.pressureToColor(0.95);
        
        expect(color).toEqual(Cesium.Color.RED);
    });
    
    it('should deform branches toward pressure', () => {
        const branch = createBranch();
        const pressureNodes = [{ position: highPressurePos, pressure: 0.9 }];
        
        renderer.renderDeformation(branch, pressureNodes);
        
        const bendDirection = branch.controlPoints[1].subtract(branch.controlPoints[0]);
        const expectedDirection = highPressurePos.subtract(branch.position).normalize();
        
        expect(bendDirection.dot(expectedDirection)).toBeGreaterThan(0.7);
    });
});
```

### Visual Tests

- [ ] Red cells are immediately noticeable
- [ ] Branch deformation points toward pressure
- [ ] Timeboxes are visually distinct
- [ ] Proximity reveal works smoothly
- [ ] Weather overlay doesn't obscure structure

---

## Benefits of Stigmergic Coordination

### 1. Scalability
**No messaging bottleneck.** 1,000 users can observe the same environment without 1,000 messages.

### 2. Resilience
**No single point of failure.** If one user doesn't act, others can still see and respond.

### 3. Transparency
**Everyone sees the same signals.** No hidden task assignments or private command channels.

### 4. Emergence
**Coordination arises naturally.** No need to "design" every workflow.

### 5. Low Cognitive Load
**Users scan visually, not via text lists.** Urgency is spatial, not textual.

---

## Summary

**Stigmergic coordination** is Relay's core organizing principle:
- Users observe environment (heat, deformation, timeboxes)
- Users respond to signals (not commands)
- Coordination emerges from local observation + action
- **No central dispatcher**
- **No direct messaging for coordination**

**This keeps Relay humane, scalable, and resilient.**

---

*See also*:
- [Pressure Model](../governance/PRESSURE-MODEL.md) - What signals mean
- [Governance Cadence](../governance/GOVERNANCE-CADENCE.md) - When signals trigger action
- [Relay Architecture](./RELAY-CESIUM-ARCHITECTURE.md) - How signals are rendered
