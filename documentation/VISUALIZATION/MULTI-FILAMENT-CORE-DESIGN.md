# 🧬 MULTI-FILAMENT CORE SCENE — DESIGN SPECIFICATION

**Version**: 1.0.0  
**Status**: Foundation Proof Design  
**Last Updated**: 2026-01-28

---

## Purpose

**Build a scene that cannot be misread as single-filament.**

**This is NOT a proof of concept.**

**This is a proof of foundation.**

---

## Requirements

1. **Show identity filaments** (things with persistent identity)
2. **Show constraint filaments** (rules that gate transitions)
3. **Show evidence filaments** (proofs that transitions happened)
4. **Show locks and gates explicitly** (not as code logic, but as stateful objects)
5. **Show at least 3-6 filaments working together** (never just one)

**Even if it's ugly.**

**Truth first, aesthetics later.**

---

## The Scenario: PO Approval (Simplest Multi-Filament Example)

**User action:** Approve purchase order PO-1001

**What appears to happen:** One button click, PO moves from "pending" to "approved"

**What actually happens:** 6 filaments coordinate under constraints

---

## The Six Filaments

### 1. Identity: `po:PO-1001`

**Type:** Identity filament  
**Purpose:** Tracks the purchase order lifecycle

**States:**
```
State 0: PO_CREATED
  vendor: "ACME Corp"
  amount: 50000
  items: [...]

State 1: PO_APPROVED (attempting...)
```

---

### 2. Identity: `user:alice`

**Type:** Identity filament  
**Purpose:** Tracks user Alice's identity and permissions

**States:**
```
State 42: USER_ACTIVE
  roles: ['procurement-manager']
  permissions: ['approve-po']
```

---

### 3. Constraint: `policy:po-approval`

**Type:** Constraint filament  
**Purpose:** Defines rules for PO approval

**States:**
```
State 0: POLICY_CREATED
  requiredApprovers: 2
  approverSet: ['user:alice', 'user:bob', 'user:charlie']
  maxAmount: 100000

State 5: POLICY_UPDATED
  requiredApprovers: 3  (stricter now)
```

---

### 4. Constraint: `policy:budget-check`

**Type:** Constraint filament  
**Purpose:** Ensures budget has available funds

**States:**
```
State 0: POLICY_CREATED
  budgetFilament: 'budget:2026'
  requiredBalance: 'amount-to-spend'

State 10: POLICY_ACTIVE
  enforced: true
```

---

### 5. Evidence: `evidence:signature:alice-po-1001`

**Type:** Evidence filament  
**Purpose:** Proves Alice signed the approval

**States:**
```
State 0: SIGNATURE_CREATED
  signer: 'user:alice'
  signedData: hash('po:PO-1001:PO_APPROVED')
  signature: '0x1234abcd...'
  timestamp: 2026-01-28T10:00:00Z
```

---

### 6. Identity: `budget:2026`

**Type:** Identity filament  
**Purpose:** Tracks available budget

**States:**
```
State 100: BUDGET_ALLOCATED
  total: 1000000
  spent: 500000
  available: 500000  (computed from commits, not stored)
```

---

## The Transition (Attempted)

**User action:** Alice clicks "Approve" on PO-1001

**Transition:** `po:PO-1001` attempts to move from State 0 → State 1

**Constraints that must pass:**

1. **Constraint: policy:po-approval**
   - Check: Has Alice approved?
   - Check: Have 2 of 3 approvers signed? (was 2, now 3—policy changed!)
   - Result: FAIL (only 1 of 3 signatures)

2. **Constraint: policy:budget-check**
   - Check: Budget available ≥ PO amount?
   - Check: 500000 ≥ 50000?
   - Result: PASS

**Overall result:** **TRANSITION DOES NOT EXIST** (constraint #1 failed)

**What happens:**
- PO-1001 stays in State 0 (not approved)
- Evidence signature still created (proof that Alice tried)
- User sees: "Approval requires 3 signatures (you have 1)"

---

## Visual Layout (3D Scene)

### Spatial Arrangement

```
     [Constraint: policy:po-approval]
              (RED - FAIL)
                    │
                    │ (gate check)
                    ↓
           [Identity: po:PO-1001]
              (State 0: PENDING)
                    │
                    │ (attempted transition)
                    ↓
        [Transition: PO_APPROVED]
           (DOES NOT EXIST)
                    ↑
                    │ (gate check)
                    │
     [Constraint: policy:budget-check]
              (GREEN - PASS)


[Identity: user:alice] ──→ [Evidence: signature:alice-po-1001]
                                     │
                                     └──→ (input to gates)

[Identity: budget:2026] ──→ (input to policy:budget-check)
```

---

### Color Coding

**Identity filaments:**
- 🔵 Blue cylinders (vertical)

**Constraint filaments:**
- 🟢 Green cubes (if PASS)
- 🔴 Red cubes (if FAIL)

**Evidence filaments:**
- 🟡 Yellow spheres (immutable)

**Transitions:**
- ⚫ Gray ghost (does not exist yet)
- 🟢 Green solid (exists)

**Gates (connections):**
- Thin rays from constraints to transition
- Green ray = PASS
- Red ray = FAIL

---

## Interaction Design

### Step 1: Initial State

**What user sees:**
- 6 filaments floating in space
- PO-1001 at center (blue cylinder, State 0)
- 2 constraint cubes above (policy:po-approval, policy:budget-check)
- User Alice (blue cylinder, left)
- Budget 2026 (blue cylinder, right)
- No transition visible yet (nothing has been attempted)

**Controls:**
- Button: "Attempt Approval" (Alice)

---

### Step 2: Attempt Transition

**User clicks "Attempt Approval"**

**What happens:**
1. Evidence signature created (yellow sphere appears near Alice)
2. Transition ghost appears (gray ghost between State 0 and State 1)
3. Gates activate (rays shoot from constraints to transition)
4. Constraint checks run (cubes light up green or red)

**Animation sequence:**
```
1. Alice → signature created (0.5s)
2. Transition ghost appears (0.5s)
3. Ray: policy:po-approval → transition (0.5s)
   - Cube turns RED (fail)
4. Ray: policy:budget-check → transition (0.5s)
   - Cube turns GREEN (pass)
5. Transition ghost fades (does not exist) (1s)
6. Message: "Approval requires 3 signatures (you have 1)"
```

---

### Step 3: Show Why It Failed

**User hovers over RED constraint cube (policy:po-approval)**

**Tooltip shows:**
```
┌─────────────────────────────────────┐
│ policy:po-approval                  │
├─────────────────────────────────────┤
│ Required approvers: 3               │
│ Current approvers: 1                │
│   ✅ Alice (user:alice)             │
│   ❌ Bob (user:bob)                 │
│   ❌ Charlie (user:charlie)         │
│                                     │
│ Status: FAIL                        │
└─────────────────────────────────────┘
```

---

### Step 4: Add More Approvers (Simulation)

**User clicks "Add Bob's Approval"**

**What happens:**
1. New evidence signature created (evidence:signature:bob-po-1001)
2. Transition re-attempted
3. Gates re-check
4. policy:po-approval: 2 of 3 → still RED (need 3)

**User clicks "Add Charlie's Approval"**

**What happens:**
1. New evidence signature created (evidence:signature:charlie-po-1001)
2. Transition re-attempted
3. Gates re-check
4. policy:po-approval: 3 of 3 → GREEN (pass!)
5. policy:budget-check: still GREEN (pass)
6. **Transition exists!** (ghost becomes solid green)
7. PO-1001 moves to State 1 (approved)

---

## Left Panel (Truth Inspector)

**Shows current state of all filaments:**

```
┌────────────────────────────────────┐
│ 🧬 MULTI-FILAMENT CORE             │
├────────────────────────────────────┤
│ Identity Filaments: (3)            │
│                                    │
│ 🔵 po:PO-1001                      │
│    State: 0 (PENDING)              │
│    Amount: $50,000                 │
│                                    │
│ 🔵 user:alice                      │
│    Permissions: [approve-po]       │
│                                    │
│ 🔵 budget:2026                     │
│    Available: $500,000             │
│                                    │
├────────────────────────────────────┤
│ Constraint Filaments: (2)          │
│                                    │
│ 🔴 policy:po-approval              │
│    Required: 3 signatures          │
│    Current: 1                      │
│    Status: FAIL                    │
│                                    │
│ 🟢 policy:budget-check             │
│    Required: $50k available        │
│    Current: $500k available        │
│    Status: PASS                    │
│                                    │
├────────────────────────────────────┤
│ Evidence Filaments: (1)            │
│                                    │
│ 🟡 signature:alice-po-1001         │
│    Signer: Alice                   │
│    Timestamp: 10:00:00Z            │
│    Valid: ✅                       │
│                                    │
├────────────────────────────────────┤
│ Transition: PO_APPROVED            │
│                                    │
│ Status: DOES NOT EXIST             │
│ Reason: Constraint #1 failed       │
│                                    │
│ [Attempt Approval]                 │
└────────────────────────────────────┘
```

---

## Key Visual Elements

### 1. Filaments Are Separate Objects

**NOT:**
- One big object with "layers"
- One filament with "properties"

**IS:**
- 6 distinct objects in 3D space
- Clear separation (identity vs constraint vs evidence)
- Spatial relationships show dependencies

---

### 2. Constraints Are Stateful

**NOT:**
- "If statements" in code
- Validation logic

**IS:**
- First-class filaments with their own lifecycle
- Visible state (PASS/FAIL)
- Inspectable (hover to see why)

---

### 3. Transitions Are Conditional Existence

**NOT:**
- "Rejected approval"
- "Failed transaction"

**IS:**
- Transition either exists or doesn't
- If constraints pass → exists (solid green)
- If constraints fail → doesn't exist (ghost fades)

---

### 4. Evidence Is Immutable

**NOT:**
- Log entries
- Audit trail

**IS:**
- First-class filaments
- Created once, never modified
- Referenced by transitions (not embedded)

---

## Implementation Notes

### Filament Rendering

**Each filament type has distinct geometry:**

**Identity filaments:**
```javascript
<Cylinder args={[0.5, 0.5, 3, 16]} position={[x, y, z]}>
  <meshStandardMaterial color="#0088ff" />
</Cylinder>
```

**Constraint filaments:**
```javascript
<Box args={[1, 1, 1]} position={[x, y, z]}>
  <meshStandardMaterial 
    color={status === 'PASS' ? '#00ff00' : '#ff0000'} 
    emissive={status === 'FAIL' ? '#ff0000' : '#000000'}
    emissiveIntensity={0.5}
  />
</Box>
```

**Evidence filaments:**
```javascript
<Sphere args={[0.3, 16, 16]} position={[x, y, z]}>
  <meshStandardMaterial color="#ffaa00" />
</Sphere>
```

---

### Gate Rays

**Visual connection from constraint to transition:**

```javascript
function GateRay({ from, to, status }) {
  const points = [
    new THREE.Vector3(...from),
    new THREE.Vector3(...to)
  ];
  
  return (
    <line geometry={new THREE.BufferGeometry().setFromPoints(points)}>
      <lineBasicMaterial 
        color={status === 'PASS' ? '#00ff00' : '#ff0000'} 
        linewidth={2}
      />
    </line>
  );
}
```

---

### Transition Ghost

**Shows attempted transition before it exists:**

```javascript
<mesh position={[x, y, z]} visible={isAttempting}>
  <boxGeometry args={[0.8, 0.8, 0.8]} />
  <meshStandardMaterial 
    color="#888888" 
    transparent 
    opacity={0.3}
    wireframe={true}
  />
</mesh>
```

---

## Acceptance Criteria

**This proof passes if:**

1. ✅ **User can see 6 distinct filaments**
   - 3 identity (blue cylinders)
   - 2 constraint (red/green cubes)
   - 1 evidence (yellow sphere)

2. ✅ **Constraints are visible as objects**
   - Not hidden in code
   - Status visible (PASS/FAIL colors)
   - Inspectable (hover to see why)

3. ✅ **Transition is conditional**
   - Does not exist until all constraints pass
   - Ghost shows attempt
   - Solid green shows existence

4. ✅ **Evidence is immutable**
   - Created once
   - Never modified
   - Referenced by gates

5. ✅ **Cannot be misread as single-filament**
   - Clearly 6 separate objects
   - Spatial separation
   - Different geometries/colors

---

## What This Proves

**This scene proves:**

1. **Filaments are NOT the foundation** (state transitions are)
2. **Reality is always multi-filament** (never just one)
3. **Constraints are first-class** (not code logic)
4. **Transitions are conditional existence** (not "rejected")
5. **Evidence is separate from identity** (not embedded)

**This is the foundation.**

**Everything else builds on this.**

---

## Next Steps

**After this scene:**

1. **Constraint-first engine**
   - Transitions are attempted → constraints decide
   - No "if statements" deciding truth
   - Only stateful gates

2. **Lens declaration system**
   - Every view declares what it hides/shows
   - No "default view"
   - Explicit collapsing of multi-filament to single view

3. **More complex examples**
   - PO flow (12 filaments)
   - Match 3-way (15 filaments)
   - Social post (6 filaments)

---

## Conclusion

**This is NOT a proof of concept.**

**This is a proof of foundation.**

**It must be impossible to misread as single-filament.**

**Truth first, aesthetics later.**

---

*Last Updated: 2026-01-28*  
*Status: Foundation Proof Design*  
*Version: 1.0.0*
