# 🚦 Relay Stage Gates

**Version**: 1.0.0  
**Last Updated**: 2026-02-06  
**Status**: Canonical

---

## Definition

**Stage gates** are checkpoints that must be passed before progression. Gates enforce discipline, prevent drift, and ensure quality.

**Rule**: No phase, proposal, or commitment proceeds without its gate passing.

---

## Gate Types

### 1. Technical Gates (Code & System)

#### Boot Gate
**Purpose**: Verify Cesium world loads correctly

**Criteria**:
- ✅ Cesium viewer exists
- ✅ Terrain + imagery loaded
- ✅ 3D buildings visible
- ✅ Drop zone functional
- ✅ No console errors

**Run**: `npm run boot-gate`

**Enforcement**: Phase 0 marked PASSED only after boot gate passes

#### LOD Gate
**Purpose**: Verify LOD hysteresis prevents thrashing

**Criteria**:
- ✅ LOD level changes on zoom
- ✅ Hysteresis prevents rapid switching
- ✅ Subscriber notifications work
- ✅ Visual transitions smooth

**Test**:
```javascript
it('should not thrash near threshold', () => {
    const governor = new RelayLODGovernor();
    const transitions = [];
    governor.subscribe(() => transitions.push(Date.now()));
    
    // Oscillate 100 times
    for (let i = 0; i < 100; i++) {
        governor.update(50000 + (i % 2 === 0 ? -1000 : 1000));
    }
    
    expect(transitions.length).toBeLessThan(10);  // Max 10, not 100
});
```

#### containsLL Gate
**Purpose**: Verify point-in-polygon correctness

**Criteria**:
- ✅ Single polygon works
- ✅ MultiPolygon works
- ✅ Holes (enclaves) work
- ✅ Edge cases handled (point on boundary)

**Test**:
```javascript
it('should handle MultiPolygon with holes', () => {
    const boundary = loadComplexBoundary('ISR');  // Has islands + enclaves
    
    expect(containsLL(boundary, telAvivLat, telAvivLon)).toBe(true);
    expect(containsLL(boundary, londonLat, londonLon)).toBe(false);
    expect(containsLL(boundary, enclaveLat, enclaveLon)).toBe(false);  // Hole
});
```

#### Performance Gate
**Purpose**: Verify 60 FPS maintained

**Criteria**:
- ✅ 60 FPS with 100 sheets visible
- ✅ Memory < 2GB after 1 hour
- ✅ No frame drops during LOD transitions
- ✅ Smooth interaction (no lag)

**Measurement**:
```javascript
const fps = measureFPS(duration: 60000);  // Measure for 60 seconds
expect(fps).toBeGreaterThanOrEqual(55);  // Allow 5 FPS margin
```

#### One World Gate
**Purpose**: Ensure no second renderer created

**Criteria**:
- ✅ Exactly one Cesium viewer exists
- ✅ No Three.js context
- ✅ No second canvas elements
- ✅ All rendering via viewer.scene

**Test**:
```javascript
it('should have exactly one Cesium viewer', () => {
    const viewers = document.querySelectorAll('.cesium-viewer');
    expect(viewers.length).toBe(1);
});

it('should not create Three.js', () => {
    expect(window.THREE).toBeUndefined();
});
```

---

### 2. Governance Gates (Policy & Authority)

#### Quorum Gate
**Purpose**: Verify sufficient participation

**Criteria**:
- Vote count ≥ quorum threshold
- Quorum varies by cadence:
  - Weekly: 30%
  - Monthly: 50%
  - Event-triggered: 60%
  - Constitutional: 75%

**Effect**:
- Below quorum: Proposal remains open (or expires after 90 days)
- At quorum: Proposal can be promoted

#### Approval Gate
**Purpose**: Verify sufficient support

**Criteria**:
- Support % ≥ approval threshold
- Standard approval: 60%
- Constitutional approval: 75%

**Effect**:
- Below approval: Proposal rejected or returned for revision
- At approval: Proposal proceeds to reconciliation

#### Reconciliation Gate
**Purpose**: Allow objections before binding

**Duration**:
- Standard: 7 days
- Urgent: 24 hours
- Constitutional: 30 days

**Criteria**:
- ✅ Window elapsed
- ✅ No new blocking vetoes
- ✅ Objections addressed or overruled

**Effect**:
- Blocked: Returns to proposal stage
- Passed: Becomes binding

#### Sunset Gate
**Purpose**: Prevent commitment rot

**Triggers**:
- Proposals > 90 days without quorum → Expire
- Policies > 1 year without review → Flag for review
- Relationships > 6 months without activity → Archive

**Effect**: Automatic cleanup, preserves history, prevents clutter

---

### 3. Documentation Gates (Quality & Integrity)

#### Docs Completion Gate
**Purpose**: Ensure documentation before coding

**Criteria**:
- ✅ Architecture document complete (no placeholders)
- ✅ Roadmap with gates exists
- ✅ Quick start + dev setup exist
- ✅ Zero broken links in active docs

**Enforcement**: No Phase 2 implementation until this passes

**Status**: ✅ PASSED (2026-02-06)

#### Link Integrity Gate
**Purpose**: Prevent broken documentation

**Criteria**:
- ✅ Run `npm run link-audit`
- ✅ Zero broken links in docs/
- ✅ Migration guide up to date

**Enforcement**: Run before every commit to docs/

#### Root Contract Gate
**Purpose**: Maintain workspace coherence

**Criteria**:
- ✅ Run `npm run root-audit`
- ✅ Zero violations
- ✅ Only allowed files/dirs at root

**Enforcement**: Run before every commit

---

## Gate Enforcement

### Rule: No Progression Without Gate Pass

**Applies to**:
- Code phases (Phase 0 → 1 → 2 → ... → 8)
- Governance proposals (Proposal → Active → Binding → Executed)
- Documentation (Router → Architecture → Implementation)

**Exception**: Parallel progression allowed ONLY when explicitly documented:
- Phase 4 (boundaries core logic) can proceed parallel to Phase 2
- Phase 6 (weather) can proceed parallel to Phase 2

### Proof Requirement

**Every PASSED gate must have**:
- Proof artifact (screenshot, log, test output)
- Artifact stored in `archive/proofs/`
- Reference in `archive/proofs/PROOF-INDEX.md`

**Without proof**: Gate is NOT passed (even if someone claims it)

---

## Gate Bypass (Strictly Prohibited)

### ❌ Forbidden

- Skipping gates ("we'll come back to it")
- Social proof ("trust me, it works")
- Partial passes ("mostly done")
- Future promises ("we'll fix it in Phase 3")

### ✅ Allowed

- Re-running gates until pass
- Revising implementation and re-testing
- Requesting gate criteria clarification
- Adding gates (stricter is always OK)

---

## Gate Testing Commands

```bash
# Technical gates
npm run boot-gate           # Boot Gate
npm test                    # Unit tests (LOD, containsLL)
npm run test:e2e            # End-to-end tests
npm run test:performance    # Performance tests

# Documentation gates
npm run link-audit          # Link Integrity Gate
npm run root-audit          # Root Contract Gate

# Governance gates (manual)
# - Check quorum manually
# - Verify reconciliation window elapsed
# - Confirm no blocking vetoes
```

---

## Gate Reporting

### Phase Gate Report Format

```markdown
## Phase {N}: {Name}

**Status**: PASSED / FAILED / PENDING

**Gate Criteria**:
- ✅ Criterion 1
- ✅ Criterion 2
- ❌ Criterion 3

**Proof Artifacts**:
- Screenshot: archive/proofs/phase{N}-{desc}.png
- Console log: archive/proofs/phase{N}-{desc}.log
- Test output: archive/proofs/phase{N}-{desc}.txt

**Verification**:
```bash
cat archive/proofs/phase{N}-{desc}.log
```

**Date Passed**: YYYY-MM-DD
```

---

## Current Gate Status

| Gate Type | Gate Name | Status |
|-----------|-----------|--------|
| **Technical** | Boot Gate | ✅ PASSED |
| **Technical** | LOD Gate | ⏳ PENDING |
| **Technical** | containsLL Gate | ⏹ NOT STARTED |
| **Technical** | Performance Gate | ⏹ NOT STARTED |
| **Technical** | One World Gate | ✅ PASSED |
| **Documentation** | Docs Completion | ✅ PASSED |
| **Documentation** | Link Integrity | ✅ PASSED |
| **Documentation** | Root Contract | ✅ PASSED |
| **Governance** | Quorum | N/A (no live votes yet) |
| **Governance** | Approval | N/A (no live votes yet) |

---

## Summary

**Stage gates** are Relay's discipline mechanism:
- Technical gates ensure quality
- Governance gates ensure legitimacy
- Documentation gates ensure buildability
- **No bypass allowed**
- **Proof required for every PASSED gate**

**Gates prevent drift, ensure accountability, and make "done" verifiable.**

---

*See also*:
- [Testing Guide](../implementation/TESTING.md) - How to run gate tests
- [Governance Cadence](./GOVERNANCE-CADENCE.md) - When gates are checked
- [Pressure Model](./PRESSURE-MODEL.md) - What triggers governance gates
