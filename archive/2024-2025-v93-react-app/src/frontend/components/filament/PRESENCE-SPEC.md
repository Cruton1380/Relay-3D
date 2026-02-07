# RELAY PRESENCE + PERMISSION MODEL

**Purpose**: Make "who is inspecting / working where" visible only when allowed, in a way that is truthful, non-abusive, and auditable.

---

## 0) Definitions

**Presence** = A live, permission-scoped indicator that an actor is currently "at" a locus in truth-space.

**Locus** = Where presence attaches:
- `BranchFrontier` (globe/projection view)
- `Filament` (identity-through-time)
- `TimeBox` (specific commit)
- `Workspace` (org/dept/workflow container)

**Presence is never floating. It is anchored.**

---

## 1) Non-Negotiable Invariants

**I1 — Presence is a lens, not an authority**
- Presence must never affect truth, history, votes, or commit state.

**I2 — Presence does not log movement by default**
- No minute-by-minute tracking. No playback trails stored as truth.
- Allowed: ephemeral local trails (client-only) for navigation
- Forbidden: persistent movement history unless explicitly enabled by policy and disclosed

**I3 — Presence visibility is governed**
- Visibility is not a personal hack; it is a policy/permission rule with explicit modes.

**I4 — "Hidden ≠ gone" applies to presence too**
- Users may be visible as:
  - "N viewers here"
  - role/team-level
  - named identity
- But never more than the viewer is permitted to see.

**I5 — No doxxing surfaces**
- No raw network identifiers, exact location, or personally identifying work patterns unless explicitly permitted by policy.

---

## 2) Presence Visibility Modes (Policy-driven)

These are selectable only within allowed policy bounds.

### **Visibility Defaults by Filament Type (Policy Only)**

Presence mechanism is identical for all filaments, but default visibility is policy-scoped.

**Recommended defaults:**
- **Operational/KPI filaments**: counts visible by default (Tier 1 typical)
- **Infrastructure filaments**: hidden/restricted by default (SRE/admin only)
- **Governance filaments**: typically restricted; identity reveal requires explicit policy

**Policy decides what renders; presence data may still exist everywhere.**

### **Invisible**
- Others see nothing attributable to you.
- If aggregation enabled, you may contribute to "N viewers here" anonymously.

### **Group-Visible**
- Visible to a defined group (team / project / department).
- Others see only "N viewers here."

### **Manager-Visible**
- Visible to designated managerial roles for work locus only.
- No movement stream, only current locus.

### **Org-Visible**
- Visible across org (rare; e.g., moderators, responders).
- Still locus-only, not motion log.

### **Public**
- Generally discouraged; reserved for public channels where identity disclosure is the point.

**Invariant**: "Manager-visible" must be transparent, explicit, and logged as a rule.

---

## 3) Permission Resolution (Who sees what)

Presence rendering resolves into 4 progressive tiers:

**Tier 0: None**
- You see nothing.

**Tier 1: Count only**
- You see: "N viewers here"
- No identities, no roles.

**Tier 2: Role/Team tokens**
- You see: "2 Finance, 1 Audit"
- Optional anonymous markers without names.

**Tier 3: Identified markers**
- You see names/avatars/keys only if allowed
- Still anchored; still no movement history

**Default should be Tier 1 in most spaces.**

---

## 4) Presence Data Model (Minimal)

Presence should be an **ephemeral session channel**, not written into the truth ledger.

```typescript
interface PresenceState {
  sessionId: string;
  actorId: string | 'hidden';  // hidden if tier < 3
  visibilityMode: 'invisible' | 'group' | 'manager' | 'org' | 'public';
  locusType: 'BranchFrontier' | 'Filament' | 'TimeBox' | 'Workspace';
  locusId: string;  // filamentId, timeBoxId, etc.
  scope: string;  // org/team/channel
  timestamp: number;  // last-seen heartbeat
  capabilities?: string[];  // view-only, can-write, moderator, etc.
}
```

### **Branch-Aware Presence (Forked Filaments)**

Forking is ontological. Presence must be branch-aware.

**Rule:**
- Same `filamentId`
- `commitIndex` implies an ancestry path
- Presence aggregation is performed per-branch lineage (ancestry-aware grouping)

**Tier 1 Rendering:**
- Workflow/Filament view: show separate presence per branch lineage (Option B)
- Globe view: Tier 1 may keep Option B everywhere; far-LOD combined display is Tier 2+ (lens aggregation)

### **Glyph Inspection (No Glyph Anchors)**

Glyphs (SPLIT, SCAR, GATE, etc.) are readouts of commit type and are **NOT** separate presence anchors.

If a user "inspects a glyph", that inspection resolves to:
- `(filamentId, commitIndex, lensContext)` for the TimeBox at that commitIndex

**Presence attaches to the TimeBox / commit locus, never to glyph geometry as a separate address.**

### **Storage:**
- In-memory + short TTL
- Optional regional relay nodes
- **NOT** committed to the Git truth chain

---

## 5) Auditing Without Surveillance

You want accountability without creepiness.

### **What IS logged (policy commits):**
- ✅ Changes to presence policy
- ✅ Who is allowed to see whom
- ✅ Whether manager visibility exists
- ✅ Whether aggregation is enabled
- ✅ Retention rules for any presence summaries

### **What is NOT logged by default:**
- ❌ Per-user movement
- ❌ Per-user dwell time
- ❌ Exact navigation

### **Optional (only if org explicitly enables):**
- Coarse "presence snapshots" at long intervals (e.g., every 30–60 minutes)
- Aggregated by team, not by person
- Explicitly disclosed to employees

---

## 6) Rendering Rules (How it looks)

### **A) Globe / Branch Frontier view**
- **Tier 1 default**: Small pulse intensity = "activity"
- **Tier 2**: Tiny role-colored markers on the branch surface
- **Tier 3**: Labeled markers visible only at near distance
- **Markers cling to the branch surface** (not floating in air)

### **B) Workflow / Filament view**
- Presence anchors to:
  - Filament spine segment (general)
  - A specific TimeBox (precise)
- Marker is a small **"locator bead"** on the filament + optional label in near mode
- If multiple viewers: they **stack as a ring of beads** around the filament circumference

### **C) Spreadsheet projection view**
- Presence appears at:
  - The column/region being inspected (Tier 1/2)
  - The selected cell only if Tier 3 permitted

---

## 7) Manager Visibility (Strict rule)

### **Managers can see:**
- Current work locus: `Department → Workflow → Filament#123 → TimeBox#5`
- **NOT** history of where you were
- **NOT** your path
- **NOT** minute-by-minute updates beyond normal heartbeat

### **If a manager view exists, employees must have:**
- A clear indicator: "Manager visibility enabled in this workspace"
- A readable policy source (the commit that enabled it)

---

## 8) Integration With Proximity Channels (Later, but compatible)

Presence can be constrained by proximity channels:
- "Visible only if both parties are in the same proximity envelope"
- "Manager-visible only inside worksite channel"
- "Public only in event channel"

**But never display SSIDs/BSSIDs/MACs.**

---

## Implementation Order (After Workflow Proof)

1. ✅ Presence transport + TTL heartbeat (no UI)
2. ✅ Locus anchoring (Filament + TimeBox first)
3. ✅ Tier 1 count rendering ("N viewers")
4. ✅ Tier 2 role tokens ("2 Finance, 1 Audit")
5. ✅ Tier 3 identity markers (names, if permitted)
6. ✅ Policy controls (governance-backed visibility rules)

---

## Hook Points (Where Presence Plugs In)

### **PresenceLayer Component** (to be created)
```jsx
<PresenceLayer
  presenceStates={presenceStates}  // array of PresenceState
  anchorMap={anchorMap}             // eventIndex → xPosition lookup
  visibilityTier={1}                // 0/1/2/3
  selectedLocus={selectedLocus}     // optional highlight
/>
```

### **FilamentDemoScene.jsx**
Right under `<FilamentRenderer ... />`:
```jsx
<PresenceLayer
  presenceStates={presenceStates}
  anchorMap={anchorMap}
/>
```

### **WorkflowProofScene.jsx**
Right under `<FilamentRenderer ... />` (inside Canvas):
```jsx
<PresenceLayer
  presenceStates={presenceStates}
  anchorMap={anchorMap}
  selectedCell={selectedCell}
/>
```

### **AnchorMap Rule**
- Renderer already computes `eventIndexToX`
- Expose it (or recompute once) so presence can anchor to:
  - `filamentId` → spine point (e.g., latest revealed x)
  - `timeBoxId/eventIndex` → xPosition for that commit
- **Never float, never world-search**

---

## First Presence Implementation (Tier 1 Only)

### **Tier 1 Scope (Local Only)**

Tier 1 presence renders ONLY for the currently rendered filament(s) in view (the filament(s) the lens is showing right now).

- ✅ **Local-only**: shows presence at `(filamentId, commitIndex, lensContext)` for the filament(s) in view
- ❌ Does NOT traverse `input.dependencies`
- ❌ Does NOT traverse evidence refs
- ❌ Does NOT display upstream/downstream presence

**Upstream/downstream presence is explicitly Tier 2+ and requires a topology lens traversal + multi-locus query.**

### **PresenceState schema + TTL heartbeat (no UI)**
1. Define `PresenceState` interface
2. Mock heartbeat service (in-memory)
3. No rendering yet

### **PresenceLayer with Tier 1 only**
Show "N viewers here" as:
- Tiny beads clustered on the filament spine near the cursor
- Small count label at near distance
- No avatars. No trails. No logs.

### **Not in Tier 1 (Explicit)**

- ❌ Upstream/downstream presence
- ❌ Topology rays / dependency visualization
- ❌ Region-level correlation maps
- ❌ Presence anchors on glyphs
- ❌ Identity/avatars/trails/logged movement (unless explicitly upgraded by policy in later tiers)

### **Only after that: Tier 2/3**
- Identity/roles
- Permission-scoped visibility

---

**Status**: Spec locked and updated. Ready for Tier 1 implementation.
