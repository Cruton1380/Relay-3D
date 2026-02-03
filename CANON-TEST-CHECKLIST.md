# Canon Test Checklist - 3D Filament Visualization

**One-line test**: If it looks like a galaxy, it's wrong. If it looks like an instrument that shows coordination pressure, it's right.

---

## ✅ VISUAL CANON TESTS

### Test 1: No Orbital Motion
- [ ] Open `/3d-filament`
- [ ] Observe node positions
- [ ] **PASS**: Nodes are static anchors with directional flow
- [ ] **FAIL**: Nodes appear to orbit or circle

**Status**: Should PASS (edges are directional with arrows)

---

### Test 2: Spatial Axes Enforced
- [ ] Look at node positions in 3D space
- [ ] SettlementEvidence is below (history)
- [ ] InvoicePaid is on surface plane
- [ ] PaymentService is outward (speculation)
- [ ] **PASS**: Clear spatial separation along Y/X/Z
- [ ] **FAIL**: Nodes clustered without axis meaning

**Status**: Should PASS (positions enforce axes)

---

### Test 3: InvoicePaid Not Sun-Like
- [ ] Select InvoicePaid node
- [ ] Observe glow radius
- [ ] **PASS**: Contained, dense glow (~35% smaller)
- [ ] **FAIL**: Corona-like flare radiating outward

**Status**: Should PASS (halo reduced, gradient tightened)

---

### Test 4: Heat Only on Diverging Edge
- [ ] Observe all three edges
- [ ] DEPENDS_ON edge (InvoicePaid → BankSettlement) shows orange heat
- [ ] ASSERTED_BY edge (white, dashed) shows NO heat
- [ ] EVIDENCED_BY edge (blue, thin) shows NO heat
- [ ] **PASS**: Heat appears ONLY where deltaPR > 0
- [ ] **FAIL**: Heat appears decoratively on all edges

**Status**: Should PASS (heat check added: `if (type === 'DEPENDS_ON' && deltaPR > 0)`)

---

### Test 5: Pulse = Mechanical Signal
- [ ] Watch InvoicePaid pulse
- [ ] Pulse is shallow (~3% scale change)
- [ ] Pulse is rhythmic (~0.27 Hz at pressure=18)
- [ ] **PASS**: Controlled, diagnostic signal
- [ ] **FAIL**: Dramatic scaling explosions

**Status**: Should PASS (amplitudes reduced to 0.03/0.08)

---

### Test 6: HUD is Clinical
- [ ] Select a node
- [ ] Read HUD left panel
- [ ] Labels show: "Confidence:", "Δ(PR):", "Pressure:", "Status:"
- [ ] **PASS**: Instrument-grade data
- [ ] **FAIL**: Metaphorical language ("HEAT: 14 mgm.")

**Status**: Should PASS (labels changed to clinical format)

---

### Test 7: Filaments Dominate Contrast
- [ ] Observe overall scene
- [ ] Background is dark, subtle
- [ ] Filaments and nodes are brightest elements
- [ ] **PASS**: Clear visual hierarchy
- [ ] **FAIL**: Stars/bloom compete with filaments

**Status**: Should PASS (background dimmed 50%, lighting reduced 50%)

---

### Test 8: Directional Arrows Clear
- [ ] Observe each edge
- [ ] Every edge has visible arrow showing direction
- [ ] Arrow points from start → end of relationship
- [ ] **PASS**: Clear causality visible
- [ ] **FAIL**: Arrows missing or ambiguous

**Status**: Should PASS (arrows enhanced with quaternion rotation)

---

## 🔒 GOVERNANCE CANON TESTS

### Test 9: Data Minimization Enforced
```javascript
// In browser console (dev tools)
import { validateTelemetryPurpose } from './components/relay-3d/utils/governanceLocks.js';

// Should throw
validateTelemetryPurpose({ data: 'test' });

// Should pass
validateTelemetryPurpose({ 
  purpose: 'eri_compute', 
  retention_ttl: '7d' 
});
```
- [ ] **PASS**: Throws on missing purpose/TTL
- [ ] **FAIL**: Accepts telemetry without governance

---

### Test 10: Learning Cannot Auto-Change Policy
```javascript
import { validatePolicyChange } from './components/relay-3d/utils/governanceLocks.js';

// Should throw
validatePolicyChange(
  { type: 'POLICY_COMMIT' },
  { type: 'automated_learner' }
);

// Should pass
validatePolicyChange(
  { type: 'POLICY_RECOMMENDATION' },
  { type: 'automated_learner' }
);
```
- [ ] **PASS**: Blocks automated policy commits
- [ ] **FAIL**: Allows learning to change policy

---

### Test 11: Pressure Budget Works
```javascript
import { PressureBudget } from './components/relay-3d/utils/governanceLocks.js';

const budget = new PressureBudget('test', { maxChecksPerWindow: 3 });

console.log(budget.canAttest()); // { allowed: true }
budget.recordAttest();
budget.recordAttest();
budget.recordAttest();
console.log(budget.canAttest()); // { allowed: false, reason: 'PRESSURE_BUDGET_EXHAUSTED' }
```
- [ ] **PASS**: Budget exhausts after max checks
- [ ] **FAIL**: Unlimited attestations allowed

---

### Test 12: Refusal Includes Next Actions
```javascript
import { createRefusalObject } from './components/relay-3d/utils/governanceLocks.js';

const refusal = createRefusalObject('INSUFFICIENT_AUTHORITY');
console.log(refusal.allowed_next_actions);
// Should include: ['request_authority', 'attach_delegation', 'open_dispute']
```
- [ ] **PASS**: Every refusal has next actions
- [ ] **FAIL**: Refusal is opaque blockage

---

### Test 13: Canon Selection Rate-Limits
```javascript
import { CanonSelectionLimits } from './components/relay-3d/utils/governanceLocks.js';

const limits = new CanonSelectionLimits('test', { maxActiveForks: 2 });

console.log(limits.canCreateFork('fork1')); // { success: true }
console.log(limits.canCreateFork('fork2')); // { success: true }
console.log(limits.canCreateFork('fork3')); // Refusal: MAX_FORKS_EXCEEDED
```
- [ ] **PASS**: Prevents procedural capture
- [ ] **FAIL**: Unlimited forks allowed

---

### Test 14: Snapshot Authority Blocked
```javascript
import { validateSnapshotUsage } from './components/relay-3d/utils/governanceLocks.js';

// Should throw
validateSnapshotUsage({ type: 'COMMIT_FROM_SNAPSHOT' });

// Should pass
validateSnapshotUsage({ 
  type: 'WRITE_FROM_SNAPSHOT',
  event_id_end: 'evt_123',
  replayProof: { verified: true }
});
```
- [ ] **PASS**: Snapshots require replay proof
- [ ] **FAIL**: Snapshots become truth source

---

### Test 15: Policy Paths Immutable
```javascript
import { validatePolicyPath } from './components/relay-3d/utils/governanceLocks.js';

// Should throw
validatePolicyPath('policies/current');
validatePolicyPath('policies/latest');

// Should pass
validatePolicyPath('policies/my_policy/v2/config.json');
```
- [ ] **PASS**: Forces versioned paths
- [ ] **FAIL**: Allows writes to policies/current

---

## 📊 FINAL VERDICT

**Visual Canon Tests**: __ / 8 passing  
**Governance Canon Tests**: __ / 7 passing  

**Overall**: __ / 15 passing

---

## ✅ ACCEPTANCE CRITERIA

To pass canonical alignment, must achieve:
- ✅ 8/8 visual tests passing
- ✅ 7/7 governance tests passing
- ✅ No orbital motion visible
- ✅ No sun-like authority cores
- ✅ Heat diagnostic, not decorative
- ✅ Governance locks enforced

---

## 🎯 ONE-LINE TEST (FINAL)

Open `/3d-filament` and ask:

**"Does this look like an instrument that measures coordination pressure?"**

- ✅ **YES** → Canon-aligned
- ❌ **NO** (looks like galaxy/art) → Corrections incomplete

---

**Expected Result**: YES (instrument-grade visualization) ✅
