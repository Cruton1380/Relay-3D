# Relay 3D Coordination World - Complete UI/UX Specification

**Version:** 1.1.0  
**Status:** LOCKED - Implementation-Ready  
**Pattern:** StarCraft-style RTS HUD + 3D coordination physics world

**Changelog v1.1.0:**
- **Added Forensic Inspection Mode** (Section 9A) - isolated 3D examination of filaments and time cubes
- **Added SCV Cancellation Terminal Event** (Section 7.1A) - forensic destruction with commit-shard visualization
- Time Cube 6-face semantic mapping (locked physics)
- Unfold Mode for 2D analytical surface examination
- Cross-references added for commit event interaction

**Changelog v1.0.1:**
- Fixed ESC behavior model (unified stack-pop rule)
- Clarified mode boundaries (Work vs Global)
- Globe truth fix (fixed in world space)
- Terminology lock (commit events, not nodes)
- Added control groups (Ctrl+1..0)
- Resolved legitimacy UI gap
- Fixed camera panning description

---

## 1. SCREEN LAYOUT (LOCKED)

### 1.1 Overall Structure

```
┌─────────────────────────────────────────────────────┐
│ Top Bar (Optional, Minimal)                         │ 5%
│ Project: RelayNet | Lens: World | Verify: ✓        │
├─────────────────────────────────────────────────────┤
│                                                      │
│                                                      │
│                                                      │
│            MAIN VIEWPORT (3D World)                 │
│                                                      │ 75%
│   [Earth globe + Filaments + SCV units]            │
│                                                      │
│                                                      │
│                                                      │
├─────────────────┬───────────────┬───────────────────┤
│ SELECTION PANEL │ COMMAND CARD  │  SYSTEM PANEL     │
│                 │               │                    │
│ (Unit/Filament  │ (Action       │ (Minimap +        │ 20%
│  Details)       │  Buttons)     │  Alerts + Status) │
│                 │               │                    │
└─────────────────┴───────────────┴───────────────────┘
     25%              50%                25%
```

### 1.2 Viewport (Top 75%)
- **Full-width 3D world rendering**
- **No floating toolbars or popup windows**
- **Minimal in-world overlays only:**
  - Selection outlines (colored borders around selected entities)
  - Small anchor glyphs (↓ or ⊙) when indicating selection targets
  - Optional nameplates (toggleable, max 1 line, < 10px font)
- **Earth globe physically present** as 3D geometry, not background texture
- **Interactions:** Camera navigation, entity selection, hover tooltips (< 200ms delay)

### 1.3 Bottom HUD (Bottom 20%)
**Always visible unless "Cinematic View" explicitly enabled**

Three fixed panels:
- **Left (25%):** Selection Panel
- **Center (50%):** Command Card
- **Right (25%):** System Panel

**Styling:**
- Dark semi-transparent background (#0A0E1A at 95% opacity)
- Sharp panel dividers (1px #2A2E3A)
- Professional, minimal, audit-safe
- No animations except state transitions (<150ms)

### 1.4 Top Bar (Optional, 5%)
**Purpose:** Global session indicators only, NO action triggers

**Shows:**
- Project name (left)
- Active lens indicator (center)
- Verification status badge (right: ✓ green / ! yellow / ✗ red)

**Must NOT contain:** Buttons, dropdowns, or any interactive elements that trigger actions

---

## 2. CAMERA MODES (THREE-MODE SYSTEM)

### 2.1 Mode Selector (HUD System Panel)
**Location:** Right HUD, top of System Panel

**UI:**
```
┌─────────────────────────┐
│ MODE: [Command ▼]      │
│   ○ Command (RTS)       │
│   ○ Work (FPS)          │
│   ○ Global (Flyaround)  │
└─────────────────────────┘
```

**Switching modes:**
- ✅ Preserves selection
- ✅ Preserves lens/filter state
- ✅ Never changes truth
- ✅ Only changes navigation + HUD density

**Mode intent (locked):**
- **Command Mode (RTS)** = high-level management + dispatch + audit
- **Work Mode (FPS)** = embodied local work + close inspection (collision-aware)
- **Global Mode (Flyaround FPS)** = macro traversal + planet-scale audit (travel-oriented)

### 2.2 Command Mode (StarCraft/RTS) - DEFAULT

**Purpose:** Management, dispatch, high-level audit, unit coordination

**Camera Behavior:**
- Constrained to stable horizon (no roll)
- Controlled pitch (30° to 60° from horizontal)
- Pans tangentially over a macro navigation surface (planet-aware), maintaining a stable horizon; movement respects globe curvature at macro scale.
- Orbit around selection via right-drag
- Zoom drives shared LOD scalar

**Edge-Scroll (RTS Glide):**
- ✅ **ENABLED**
- Activates when cursor within 24px of viewport edge
- Configurable: threshold (default 24px), base speed, acceleration curve
- **MUST NOT activate when:**
  - Cursor over HUD
  - Dragging selection box
  - Dragging minimap
  - Modal confirmation open

**Controls:**
| Input | Action |
|-------|--------|
| Mouse to edge | Pan (glide) |
| Mouse wheel | Zoom (LOD) |
| Right-drag | Orbit around focus |
| Left-click | Select entity |
| Left-drag | Box select (marquee) |
| Middle-drag | Pan camera |
| Space | Center on selection |
| Double-click | Focus + brief follow |
| ESC | Handled by global ESC stack-pop (see 10.1) |
| Minimap click | Reposition camera |
| Ctrl+1..0 | Assign control group |
| 1..0 | Recall control group |
| Double-tap 1..0 | Center camera on control group |

**Marquee Selection:**
- ✅ **ENABLED**
- Left-drag creates selection box
- Selects all units within box on release
- Does not select filaments (too many false positives)

**HUD Density:** Full (all panels visible, standard size)

### 2.3 Work Mode (FPS)

**Purpose:** Close inspection, "being" a unit, hands-on work

**Camera Behavior:**
- Embodied first-person (or near-first-person) for local work
- Can attach to a specific unit (SCV) or a worksite/filament segment
- Collision-aware movement (ON)
- No horizon constraint
- Micro-zoom for inspection + precise targeting
- Primary purpose: manipulate/inspect local truth surfaces and produce/verify actions at close range (not traversal)

**Edge-Scroll:**
- ❌ **DISABLED** (Command Mode only)

**Controls:**
| Input | Action |
|-------|--------|
| Mouse move | Look (free) |
| WASD | Move/strafe |
| Shift | Sprint |
| Space | Jump/hover (optional) |
| Mouse wheel | Micro-zoom/inspect |
| E (interact key) | Attach/detach/interact (contextual) |
| ESC | Handled by global ESC stack-pop rule (see Section 10.1) |

**Note:** Work Mode does not "auto-exit" on ESC; exiting is governed by the unified ESC stack-pop model to avoid conflicts.

**Marquee Selection:**
- ❌ **DISABLED**

**HUD Density:** Compact
- Command card becomes "tool palette" (fewer buttons, larger icons)
- Minimap smaller or collapsible
- Selection panel gets priority (inspection details)

### 2.4 Global Mode (Flyaround)

**Purpose:** Planet-scale traversal, branch ridges around Earth, macro audit, fast travel

**Camera Behavior:**
- Flyaround FPS for macro traversal (travel-oriented)
- True 6DOF flight (forward/back, strafe, ascend/descend)
- Smooth cinematic flight tuned for long-distance navigation
- Collision OFF (or very soft) to prevent snagging during traversal
- Wide visibility for macro context
- Orbit/snap to regions + globe-centric navigation primitives
- Boost for fast traversal
- Primary purpose: traverse, orient, and audit at planet/region scale (not fine manipulation)

**Edge-Scroll:**
- ❌ **DISABLED** (Command Mode only)

**Controls:**
| Input | Action |
|-------|--------|
| Mouse move | Look (free) |
| WASD | Fly forward/back/strafe |
| Q/E | Descend/ascend |
| Shift | Boost (3x speed) |
| Mouse wheel | Macro zoom (LOD) |
| Space | Center on selection |
| Double-tap G | Snap to region |
| Double-tap O | Orbit Earth |
| Double-tap 1..0 | Focus travel target on control group |

**Marquee Selection:**
- ❌ **DISABLED**

**HUD Density:** Full + Navigation
- Minimap becomes Globe Navigator (planet projection + hotspots)
- Adds snap/orbit/region jump controls to Command Card
- Travel HUD primitives are emphasized (region jump, orbit, focus, return-to-command)
- Navigation compass (optional)

### 2.5 Camera State Machine

**CameraModeState:**
- **mode:** `Command | Work | Global`
- **substate:** `Free | FollowingSelection | AttachedToUnit | Orbiting | MinimapDragging`

**Transitions:**
- Select entity → `FollowingSelection`
- Attach (E) in Work → `AttachedToUnit`
- Detach (E) → `FollowingSelection`
- Mode change keeps selection + lens
- ESC follows stack-pop model (see 10.1)

**State Rules:**
- Command mode: Edge-scroll ON, Marquee ON, Horizon stable
- Work mode: Edge-scroll OFF, Marquee OFF, FPS look ON, Collision ON
- Global mode: Edge-scroll OFF, Marquee OFF, 6DOF flight ON, Collision OFF

### 2.6 Control Groups (Ctrl+1..0) — REQUIRED

**Purpose:** Fast management of many units (employees/AI agents) across parallel workstreams.

**Rules (locked):**
- Control groups apply to units only (employees/AI agents).
- Control group recall never changes truth; it only changes selection + optional camera focus.

**Controls:**
| Input | Action |
|-------|--------|
| Ctrl + [1..0] | Assign current unit selection to group |
| [1..0] | Recall group selection |
| Double-tap [1..0] | Center camera on group (Command) / focus travel target (Global) |
| Shift + [1..0] | Add current selection to group (optional but recommended) |

**HUD:**
- Show small group chips (1..0) in the System Panel or Command Card edge:
  - Count of units in group
  - Status dots (idle/working/blocked distribution)
  - Clicking a chip recalls selection (same as key)

**Acceptance:**
- ✅ Managing 50+ units must be possible without hunting in-world.

---

## 3. SELECTION PANEL (LEFT HUD, 25%)

### 3.1 Purpose
Show "what I'm looking at" with zero ambiguity. Supports single-select and multi-select.

### 3.2 Selection Types

#### A) Unit (Employee/AI SCV)

**Layout:**
```
┌─────────────────────────────┐
│ UNIT SELECTED               │
├─────────────────────────────┤
│ Name: Alice (Employee)      │
│ ID: unit.emp.alice.001      │
│                              │
│ Status: 🔨 Working          │
│ Task: Implement auth module │
│ Attached: work.W123         │
│                              │
│ Scope: backend/*            │
│ Capability: code.write      │
│                              │
│ Last Commit:                │
│ └─ work.W123@c5 (2m ago)   │
│                              │
│ ETA: 45m remaining          │
└─────────────────────────────┘
```

**Fields:**
- Display name / ID
- Type (Employee, AI Agent)
- Current job (task name)
- Attached filament(s) (IDs as links)
- State: `Idle | Moving | Working | Blocked | Awaiting Authority`
- Scope + capability summary (read-only)
- Last commit produced (ref with timestamp)
- ETA / time-box status if applicable

**State Icons:**
- Idle: ⏸
- Moving: →
- Working: 🔨
- Blocked: 🚫
- Awaiting Authority: ⏳

#### B) Filament

**Layout:**
```
┌─────────────────────────────┐
│ FILAMENT SELECTED           │
├─────────────────────────────┤
│ ID: work.W123               │
│ Value: $1,000 USD           │
│                              │
│ Created: 2026-01-15         │
│ Head: @c12                  │
│ Last Author: unit.alice.001 │
│                              │
│ Integrity: ✓ PASS           │
│                              │
│ [Inspect Commits →]         │
└─────────────────────────────┘
```

**Fields:**
- Filament ID
- Value identity label (if relevant)
- Created date
- Current head commitIndex
- Last author (unit ID)
- Integrity/verification indicator (✓ PASS / ! WARN / ✗ FAIL)
- "Inspect" affordance (button opens inspector in HUD)

#### C) Queue / Conflict / Resource

**Layout:**
```
┌─────────────────────────────┐
│ QUEUE SELECTED              │
├─────────────────────────────┤
│ ID: queue.Q45               │
│ State: 🚫 Blocked           │
│                              │
│ Blockers:                   │
│ └─ conflict.C12 (merge)    │
│ └─ resource.R3 (locked)    │
│                              │
│ Required Authority:         │
│ └─ merge.resolve            │
│                              │
│ Actions available ↓         │
└─────────────────────────────┘
```

**Fields:**
- ID
- State (open/blocked/resolving)
- Blockers list (refs as links)
- Required authority capabilities (read-only)
- "Next eligible actions" note (actual buttons in Command Card)

#### D) Multi-Select (Units Only)

**Layout:**
```
┌─────────────────────────────┐
│ MULTI-SELECT                │
├─────────────────────────────┤
│ 5 units selected            │
│                              │
│ ● 3 Working                 │
│ ● 2 Idle                    │
│                              │
│ Shared commands available ↓ │
└─────────────────────────────┘
```

**Fields:**
- Count
- State breakdown (working vs idle vs blocked)
- "Shared commands available" note (buttons in Command Card)

**Rules:**
- Only shared commands appear in Command Card
- No filament-only actions
- No conflicting actions (e.g., can't "Attach" multi-select to different filaments)

### 3.3 Empty State

```
┌─────────────────────────────┐
│ NO SELECTION                │
├─────────────────────────────┤
│ Click entity to select      │
│ Drag to box-select units    │
│ (Command mode only)         │
└─────────────────────────────┘
```

---

## 4. COMMAND CARD (CENTER HUD, 50%)

### 4.1 Purpose
**The ONLY place actions exist. No ambient authority.**

**Rules:**
- Buttons are context-sensitive AND legitimacy-sensitive
- If user cannot legitimately do an action, the button is **NOT SHOWN** (not disabled)
- Button press always creates explicit request/commit (no hidden side effects)
- All actions show "What will happen" preview before commit

### 4.2 Action Preview System

**Before any action executes:**
```
┌────────────────────────────────────────────┐
│ ACTION PREVIEW                             │
├────────────────────────────────────────────┤
│ Action: Assign Task                        │
│ Target: unit.alice.001                     │
│ Task: work.W125                            │
│                                             │
│ Will create commit:                        │
│ └─ TASK_ASSIGN { unitRef, workRef }       │
│                                             │
│ Required authority: task.assign            │
│ Authority source: auth.manager.bob         │
│                                             │
│          [Confirm]    [Cancel]             │
└────────────────────────────────────────────┘
```

**Shows:**
- Action name
- Target(s)
- Commit type that will be created
- Required authority (if any)
- Authority source (if applicable)
- Confirm/Cancel buttons

### 4.3 Command Button Groups

#### A) Unit Commands (when unit(s) selected)

| Button | Action | Legitimacy Required |
|--------|--------|---------------------|
| Assign Task | Create TASK_ASSIGN commit | task.assign |
| Move To | Create UNIT_MOVE_TO commit | None (default) |
| Attach | Create UNIT_ATTACH commit | work.attach |
| Detach | Create UNIT_DETACH commit | work.detach |
| Pause | Create UNIT_PAUSE commit | unit.manage |
| Resume | Create UNIT_RESUME commit | unit.manage |
| Cancel | Create TASK_CANCEL commit | task.cancel |
| Inspect Log | Open unit work log inspector | None |

**Layout:**
```
┌─────────────────────────────────────────────┐
│ [Assign Task] [Move To] [Attach] [Detach] │
│ [Pause] [Resume] [Cancel] [Inspect Log]    │
└─────────────────────────────────────────────┘
```

#### B) Filament Commands (when filament selected)

| Button | Action | Legitimacy Required |
|--------|--------|---------------------|
| Inspect | Open filament inspector in HUD | None |
| Propose Edit | Create proposal filament | filament.propose |
| Branch | Create explicit new filament | filament.branch |
| Compare | Open diff lens | None |
| Snapshot Save | Create SNAPSHOT_SAVE commit | filament.snapshot |
| Snapshot Restore | Create new head from snapshot | filament.restore |

**Layout:**
```
┌─────────────────────────────────────────────┐
│ [Inspect] [Propose Edit] [Branch] [Compare]│
│ [Snapshot Save] [Snapshot Restore]          │
└─────────────────────────────────────────────┘
```

#### C) Queue/Conflict Commands (when queue/conflict selected)

| Button | Action | Legitimacy Required |
|--------|--------|---------------------|
| Enqueue | Create QUEUE_ENQUEUE commit | queue.enqueue |
| Dequeue | Create QUEUE_DEQUEUE commit | queue.manage |
| Reorder | Create QUEUE_REORDER commit | queue.reorder |
| Cancel Request | Create REQUEST_CANCEL commit | request.cancel |
| Fork | Create CONFLICT_FORK commit | conflict.fork |
| Select Merge | Create merge selection commit | merge.select |
| Resolve | Create MERGE_RESOLVE + scar | merge.resolve |

**Layout:**
```
┌─────────────────────────────────────────────┐
│ [Enqueue] [Dequeue] [Reorder]              │
│ [Cancel] [Fork] [Select] [Resolve]         │
└─────────────────────────────────────────────┘
```

#### D) Prompt/Agent Ops (when prompt/sequence selected)

| Button | Action | Legitimacy Required |
|--------|--------|---------------------|
| Branch Twice | Create 2 prompt branches (A+B) | prompt.branch |
| Merge Branches | Open merge UI, produce scar | prompt.merge |
| Compile Prompt | Create compiled artifact | prompt.compile |
| Execute | Execute compiled prompt | prompt.execute |
| Run Step | Execute sequence step | sequence.run |
| Advance Sequence | Create STEP_ADVANCE commit | sequence.advance |

**Layout:**
```
┌─────────────────────────────────────────────┐
│ [Branch Twice] [Merge] [Compile] [Execute] │
│ [Run Step] [Advance Sequence]               │
└─────────────────────────────────────────────┘
```

### 4.4 No Legitimacy State

**When user lacks authority for ALL actions on selected entity or when all actions are hidden due to legitimacy gating:**
```
┌────────────────────────────────────────────┐
│ NO LEGITIMATE ACTIONS AVAILABLE            │
├────────────────────────────────────────────┤
│ You lack authority to modify this entity.  │
│                                             │
│ Required capabilities:                     │
│ └─ filament.edit                           │
│ └─ filament.merge                          │
│                                             │
│ Blocked: missing capability filament.edit  │
│ Contact: @manager-alice for delegation.    │
└────────────────────────────────────────────┘
```

**If an action is absent due to legitimacy, the Command Card must show a single-line "blocked because …" explanation with the missing capability.**

### 4.5 Empty State (no selection)

```
┌────────────────────────────────────────────┐
│ Select an entity to see available actions  │
└────────────────────────────────────────────┘
```

---

## 5. SYSTEM PANEL (RIGHT HUD, 25%)

### 5.1 Layout

```
┌─────────────────────────┐
│ MODE: [Command ▼]      │ ← Mode selector
├─────────────────────────┤
│                         │
│      MINIMAP            │ ← Interactive minimap
│   [viewport box]        │
│                         │
├─────────────────────────┤
│ ALERTS                  │ ← Event feed
│ • Conflict C12 created  │
│ • Unit alice blocked    │
├─────────────────────────┤
│ LENSES                  │ ← View filters
│ ○ World (default)       │
│ ○ Filament              │
│ ○ Workforce             │
│ ○ Authority             │
│ ○ Conflict              │
├─────────────────────────┤
│ VERIFICATION            │ ← Guardrail status
│ ✓ All systems OK        │
│ verify:entry     ✓      │
│ verify:prompt    ✓      │
└─────────────────────────┘
```

### 5.2 Minimap (Top Section)

**Purpose:** Simplified top-down projection of 3D world

**Features:**
- ✅ Interactive (click to reposition camera in Command mode)
- ✅ Click-and-drag viewport box to pan
- ✅ Synced with main camera (viewport box shows frustum)
- ✅ Icons for: units, queues/conflicts, major filament ridges
- ✅ Filter toggles (units only / filaments only / conflicts only)

**Visual Elements:**
- Viewport box: Yellow outline showing current camera view
- Units: Small colored dots (green=idle, blue=working, red=blocked)
- Filaments: Light grey lines/ridges
- Conflicts: Red triangles
- Queues: Orange circles

**Interactions:**
- Left-click: Reposition camera (Command mode only)
- Left-drag viewport box: Pan camera
- Right-click: Context menu (go to, focus, etc.)
- Scroll wheel: Zoom minimap (independent of main camera)

**Minimap Modes:**
- Command: Standard top-down projection
- Work: Zoomed local area around attached unit/worksite (local context)
- Global: Globe Navigator view (full Earth + hotspots + region jump/orbit anchors)

### 5.3 Alerts / Event Feed (Middle Section)

**Purpose:** Compact real-time event log

**Shows:**
- Conflicts created
- Units blocked/unblocked
- Authority delegation changes
- Verification failures
- Merge queue updates

**Format:**
```
• [Time] [Event Type] [Brief Description]
  ↳ [Entity ID] (click to select)
```

**Example:**
```
ALERTS
• 2m  Conflict   C12 created (merge req)
       ↳ work.W123 vs work.W124
• 5m  Unit       alice blocked
       ↳ Awaiting auth.merge.resolve
• 8m  Verify     verify:prompt PASS
       ↳ All prompts valid
```

**Auto-scroll:** Latest at top, max 10 visible, full log accessible via expand

### 5.4 Lenses (View Filters)

**Purpose:** Change visibility/emphasis without changing truth

| Lens | Emphasis | De-emphasis |
|------|----------|-------------|
| World (default) | Balanced view | None |
| Filament | Filaments + commits | Units (faded 50%) |
| Workforce | Units + attachments | Filaments (wireframe) |
| Authority | Legitimacy indicators, blocked entities | Other details |
| Conflict | Conflicts + merge queues | Non-conflict filaments |

**UI:**
```
LENSES
○ World (default)
○ Filament
○ Workforce
○ Authority
○ Conflict
```

**Behavior:**
- Radio button selection (only one active)
- Switching lenses:
  - ✅ Preserves selection
  - ✅ Preserves camera position
  - ❌ Never changes truth
  - ✅ Only changes visual emphasis

### 5.5 Verification / Guardrails (Bottom Section)

**Purpose:** Real-time validation status

**Shows:**
```
VERIFICATION
✓ All systems OK

verify:entry     ✓
verify:prompt    ✓
verify:authority ✓
verify:merge     ✓
```

**States:**
- ✓ Green: All checks pass
- ! Yellow: Warnings present (not blocking)
- ✗ Red: Violations found (actions blocked)

**On failure, shows:**
```
VERIFICATION
✗ System blocked

verify:prompt    ✗
  → Run R123 missing compiledPromptRef
  → Fix: Compile prompt before execute

[Run verify:prompt] [Details →]
```

---

## 6. EARTH GLOBE UNDERLAY + SHARED LOD

### 6.1 Globe as Physical 3D Object

**Implementation:**
- Real 3D sphere mesh, not skybox or background
- Positioned at world origin (0, 0, 0)
- Filaments/branches anchored to or rising from surface
- **Globe is fixed in world space. The camera moves around it.**
- **Optional:** subtle lighting/atmospheric shading may respond to the scene light, not to camera motion.
- **No camera-coupled globe rotation (world must remain truth).**

### 6.2 Shared LOD Scalar

**Single zoom value drives detail for ALL entities:**

| Zoom Level | Globe Detail | Filament Detail | Unit Detail | Minimap Detail |
|------------|-------------|-----------------|-------------|----------------|
| 0 (macro) | Continents outline | Ridge lines only | Icons (circles) | Dots |
| 1 (high) | Country borders | Branch structure | Low-poly models | Icons |
| 2 (medium) | Terrain features | Commit events visible | Med-poly models | Icons + labels |
| 3 (close) | Surface texture | Fractal detail | High-poly models | Full detail |
| 4 (micro) | N/A | Individual commits | Full detail + nameplate | N/A |

### 6.3 LOD Band Thresholds

**Zoom scalar: 0.0 to 1.0 (logarithmic)**

```javascript
const LOD_BANDS = {
  MACRO:  { min: 0.0,  max: 0.2 },  // Planet-scale
  HIGH:   { min: 0.2,  max: 0.4 },  // Region-scale
  MEDIUM: { min: 0.4,  max: 0.7 },  // City-scale
  CLOSE:  { min: 0.7,  max: 0.9 },  // Building-scale
  MICRO:  { min: 0.9,  max: 1.0 },  // Inspection-scale
};
```

### 6.4 LOD Transition Rules

**To avoid popping:**
- Blend between LOD levels over 0.05 zoom range
- Pre-load next LOD when within 0.1 of threshold
- Fade in/out opacity during transition (<200ms)
- Stagger transitions (globe → filaments → units)

**Example:**
```
Zoom 0.19 → 0.21 (crossing MACRO→HIGH threshold)
  t=0ms:   Globe starts loading country borders
  t=50ms:  Globe fades in borders (50% blend)
  t=100ms: Filaments start showing branch structure
  t=150ms: Globe borders fully visible
  t=200ms: Filaments branch structure fully visible
  t=250ms: Units upgrade to low-poly models
```

---

## 7. WORLD ENTITIES

### 7.1 SCV Units (Employees / AI Agents)

**Visual States:**

| State | Visual Indicator | Animation |
|-------|-----------------|-----------|
| Idle | Standing still, subtle idle anim | Slight bob |
| Moving | Walking/floating toward target | Smooth interpolation |
| Working | Attached to filament, beam/tether | Pulsing connection |
| Blocked | Red icon above unit | Shake/vibrate |
| Awaiting Authority | Yellow icon above unit | Slow pulse |

**Working Visualization:**
- Visible beam/tether from unit to target filament
- Commit events appear as:
  - Small particle burst at attachment point
  - Micro-deformation on filament (new event marker/segment)
  - Brief glow on unit

**Selection Outline:**
- 2px colored border (green=selected, white=hover)
- Name plate (if enabled): 1 line, 10px font, fades at distance

### 7.1A SCV Cancellation (Terminal Event Visualization)

**Purpose:** Make SCV cancellation feel final and visceral (StarCraft clarity) while maintaining Relay physics (immutability, auditability, determinism).

**Core Principle:** SCV cancellation is **forensic destruction**, not cartoon death. It's controlled deconstruction that makes truth visible through its own ending.

#### Trigger
User presses `[Cancel]` on SCV channel via Command Card.

#### Required Commit (Non-Negotiable)
```json
{
  "op": "SCV_CHANNEL_CANCEL",
  "refs": {
    "inputs": ["work.<id>"],
    "authorityRef": "scv.cancel"
  },
  "tLevel": "T1"
}
```

**No visual happens unless this commit exists.**

#### Visual Sequence (Deterministic, 2.625 seconds total)

**Phase 1: Overload Signal (100–150ms)**
- SCV emits rapid red/orange pulse (3-5 flashes)
- Attached filament beam flickers and detaches
- HUD shows: `⚠️ SCV CANCELLED — TERMINATING`
- Audio cue: Sharp warning tone (optional)

**Phase 2: Commit Burst (300ms) — CORE MOMENT**
- SCV fractures into **commit-shards** (tiny glowing rectangles, mini time-cubes)
- Shards eject outward along SCV's motion vectors (radial burst)
- Each shard corresponds to:
  - Last N commits (5-10)
  - Cancellation event commit (red shard)
  - Unresolved work references (yellow shards)
- Shard physics:
  - Initial velocity: 50-100 units/sec
  - Gravity: Slight downward arc
  - Fade: 70% opacity → 0% over 200ms
- **This is the Relay explosion:** Emotionally identical to StarCraft, semantically correct for Relay

**Phase 3: Integrity Collapse (200ms)**
- Faint hexagonal shell outline appears around SCV position
- Shell collapses inward (scale 1.0 → 0.0)
- Final soft flash (white/blue, no flame, no debris)
- SCV mesh disappears (despawn)

**Phase 4: Ghost Marker (2 seconds)**
```
⊘ SCV TERMINATED
```
- Appears at final SCV position
- Semi-transparent, pulsing slowly
- **Clickable** → enters Forensic Inspection Mode showing cancel commit
- After 2 seconds, ghost fades out (0.5s fade)
- Commit remains in audit trail forever

#### What Remains After Explosion

**Removed from World:**
- ❌ SCV body (visual mesh despawned)
- ❌ Active channel (conversation.* closed)

**Preserved in Ledger:**
- ✅ Work filament (intact with all commits)
- ✅ Cancel commit (`SCV_CHANNEL_CANCEL` with full causal refs)
- ✅ Audit trail (complete, replayable)
- ✅ Replay determinism (explosion renders identically every time)

#### Cancellation Variants (Causal Lenses)

Same `SCV_CHANNEL_CANCEL` commit, different visual render based on `cancelReason` field:

| Reason | Visual Variant | Color | Semantic Meaning |
|--------|----------------|-------|------------------|
| `user-initiated` | Sharp, clean burst | Orange | Intentional termination |
| `authority-revoked` | Red fracture + lock glyph overlay | Red | Legitimacy violation |
| `timeout` | Slow dim + inward collapse (no burst) | Blue | Natural expiration |
| `conflict-kill` | Split into two half-ghosts → collapse | Purple | Fork/merge failure |

**Same physics, different causal lens.** Visual variant is purely a rendering choice driven by commit metadata.

#### Rules (Locked)

1. **No silent deletion:** SCV never disappears without visual sequence
2. **No gentle fade:** Cancellation must feel final and unambiguous
3. **No resurrection without commit:** New SCV requires explicit `SCV_CREATE` commit
4. **Explosion = commit visualization:** Shards are truth fragments (commits/refs), not debris
5. **Ghost marker is mandatory:** Provides audit access point (Forensic Inspection)
6. **Deterministic replay:** Same cancel commit → identical explosion every time
7. **Commit-first rendering:** Visual sequence only triggers if commit exists and is validated

#### Why This Works

| StarCraft Instinct | Relay Equivalent | Physics Guarantee |
|-------------------|------------------|-------------------|
| SCV blows up | SCV emits terminal commit burst | Commit-shards visualize truth fragments |
| Unit is gone | SCV channel closed | conversation.* marked terminated |
| Player feels consequence | Cancellation is irreversible | No undo without new SCV_CREATE |
| Visual clarity | No ambiguity in world state | Ghost marker + Forensic Inspection |

**No one will ask "did it really cancel?"** They **saw** it cancel.

#### Implementation Notes

**Animation Timing (Locked):**
```javascript
const CANCELLATION_TIMELINE = {
  OVERLOAD_DURATION: 125,       // Phase 1
  BURST_DURATION: 300,           // Phase 2 (core moment)
  COLLAPSE_DURATION: 200,        // Phase 3
  GHOST_DURATION: 2000,          // Phase 4
  GHOST_FADE: 500,               // Ghost fade-out
  TOTAL: 3125                    // ms total (2.625s + 0.5s fade)
};
```

**Shard Generation Logic:**
```javascript
function generateCommitShards(scv) {
  const lastCommits = getLastNCommits(scv.attachedFilament, 5);
  const cancelCommit = getCancelCommit(scv.channelId);
  const unresolvedRefs = getUnresolvedWorkRefs(scv);

  return [
    ...lastCommits.map(c => createShardFromCommit(c, { color: 'blue' })),
    createShardFromCommit(cancelCommit, { color: 'red', size: 1.5 }),
    ...unresolvedRefs.map(r => createShardFromRef(r, { color: 'yellow' }))
  ];
}
```

**Component Location:**
```
src/frontend/components/globe-world/entities/
├── SCVUnits.jsx                    # Main SCV renderer
└── SCVCancellationEffect.jsx       # Handles 3-phase cancellation sequence
```

#### One-Sentence Spec Addition

**SCV cancellation is rendered as a deterministic terminal deconstruction event ("explosion") composed of commit-shards, integrity collapse, and ghost marker, driven solely by a `SCV_CHANNEL_CANCEL` commit.**

### 7.2 Filaments

**Visual Representation:**

**LOD 0 (Macro):**
- Ridge lines only (1px width)
- Color: Filament type (work=blue, file=green, queue=orange)

**LOD 1-2 (High/Medium):**
- Branch structure visible
- Commit events as small event markers along ridge
- Width: 2-4px

**(Terminology lock: "commit events" not "nodes" to preserve physics language.)**

**LOD 3-4 (Close/Micro):**
- Full branch tree
- Individual commit event boxes with metadata
- Refs/edges as causal links between commit events
- Fractal texture detail

**Branching:**
- Explicit branches split at commit event marker
- Never implicit merges
- Merge scars visible as connection points

**Terminology lock:** Use "commit event" / "commit event marker" / "commit event box" (never "node") to preserve Relay physics language.

**Interaction:**
- Single-click commit event → select (details in Selection Panel)
- Double-click commit event → enter **Forensic Inspection Mode** (Section 9A)
- In Forensic Inspection Mode: examine commit as 3D time cube with 6 semantic faces

### 7.3 Queues / Conflicts / Resources

**Visual Representation:**
- Minimal structured objects (not floating UI)
- Queues: Orange cube with stacked layers (# of items)
- Conflicts: Red triangle with exclamation
- Resources: Blue cylinder with lock icon if locked

**Blocked State:**
- Red pulsing outline
- Visible "chain" connecting to blocker

**Interactions:**
- Click to select → details in Selection Panel
- Actions in Command Card only

---

## 8. LENSES (VIEW FILTERS) - DETAIL

### 8.1 World Lens (Default)

**Balance:** 100% filaments, 100% units, 100% globe

**Use case:** General operation, mixed management

### 8.2 Filament Lens

**Emphasis:**
- Filaments: 100% opacity, full detail
- Commit events highlighted
- Refs/edges more prominent

**De-emphasis:**
- Units: 50% opacity, faded
- Globe: 30% opacity, muted colors

**Use case:** Auditing commit history, branch structure

### 8.3 Workforce Lens

**Emphasis:**
- Units: 100% opacity, larger models
- Unit-to-filament attachments: bright beams
- Unit states more visible

**De-emphasis:**
- Filaments: Wireframe only (20% opacity)
- Globe: 30% opacity

**Use case:** Dispatch, workforce management, finding idle units

### 8.4 Authority Lens

**Emphasis:**
- Legitimacy indicators:
  - Green glow: User can act
  - Red outline: User blocked
  - Yellow pulse: Awaiting authority
- Authority delegation chains visible as edges

**De-emphasis:**
- Other visual details reduced

**Use case:** Understanding why actions are blocked, seeing delegation chains

### 8.5 Conflict Lens

**Emphasis:**
- Conflicts: Bright red, pulsing
- Merge queues: Orange, animated
- Related filaments: Connected with red edges

**De-emphasis:**
- Non-conflict entities: 30% opacity

**Use case:** Conflict resolution, merge queue management

---

## 9. INSPECTORS (HUD-ANCHORED PANELS)

**Rule:** No popup windows. All inspectors open as HUD expansions.

### 9.1 Inspector Types

| Inspector | Opens In | Trigger |
|-----------|----------|---------|
| Filament Inspector | Left panel expansion | Click "Inspect" on filament |
| Commit Trail Inspector | Center expansion | Click commit event marker / commit event box |
| **Forensic Inspection Mode** | **Full viewport (isolated chamber)** | **Double-click commit event / click [Inspect in Isolation]** |
| Authority/Delegation Inspector | Left panel expansion | Click authority indicator |
| Prompt Compiler Inspector | Center expansion | Click "Compile Prompt" |
| Snapshot Browser | Right panel expansion | Click "Snapshot Restore" |

**Note:** Forensic Inspection Mode (Section 9A) is a special isolated 3D examination mode, not a panel expansion.

### 9.2 Inspector Behavior

**Opening:**
- Slides out from parent panel (200ms ease-out)
- Dims background slightly (overlay at 10% black)
- Close button (X) top-right
- ESC key also closes (via stack-pop)

**Layout Example (Filament Inspector):**
```
┌─────────────────────────────────────────────┐
│ FILAMENT INSPECTOR               [X]        │
├─────────────────────────────────────────────┤
│ work.W123                                   │
│                                              │
│ Commits: 12                                 │
│ Head: @c12                                  │
│ Integrity: ✓ PASS                           │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ c12: TASK_COMPLETE                      │ │
│ │   Author: unit.alice.001                │ │
│ │   Time: 2m ago                          │ │
│ │   Refs: [work.W122@c8]                 │ │
│ ├─────────────────────────────────────────┤ │
│ │ c11: TASK_UPDATE                        │ │
│ │   Author: unit.bob.002                  │ │
│ │   Time: 15m ago                         │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ [Export History] [Compare with...]          │
└─────────────────────────────────────────────┘
```

---

## 9A. FORENSIC INSPECTION MODE

**🔍 Filament & Time Cube Isolated 3D Examination**

### 9A.1 Purpose (Why This Exists)

When the user clicks a filament or a time cube (commit event), they must be able to:
- Isolate it from world clutter
- Examine it as a physical object
- Rotate it freely in 3D
- Inspect each face as a bearer of truth
- Make explicit, legitimate changes
- Unfold it into a 2D analytical surface when needed

**This mode is inspection, not abstraction.**  
No new metaphors. No data re-interpretation.  
Only revealing structure that already exists.

### 9A.2 Entry into Forensic Inspection Mode

**Trigger:**
- Single-click or double-click on:
  - A filament segment
  - A commit event marker / time cube
- OR Command Card button: `[Inspect in Isolation]`

**Transition behavior (locked):**
- Camera smoothly transitions (300–400ms ease-in-out)
- World fades to dark neutral backdrop (not removed)
- Selected object remains centered
- HUD collapses into Inspection HUD profile
- Selection is preserved (no context loss)

**⚠️ This is not a scene change. It is a camera + lens transition.**

### 9A.3 Isolated Inspection Space (3D Chamber)

**Environment:**
- Neutral dark background (same palette as world)
- No grid
- No axes (unless toggled)
- Soft, even analytical lighting
- No motion except user-driven interaction

**Object state:**
- Exactly one object exists:
  - A filament segment OR
  - A single time cube (commit event)
- Object scale normalized to fit camera comfortably
- Orientation defaults to "readable" face forward

### 9A.4 Time Cube (Commit Event) — 3D Interaction

**Geometry (locked):**
- Time cube is a rectangular prism
- Exactly 6 faces
- No decorative bevels
- Edges are crisp (truth-bearing)

**Camera interaction:**
| Input | Action |
|-------|--------|
| Left-drag | Rotate cube (trackball) |
| Right-drag | Pan camera |
| Scroll | Zoom (bounded) |
| Double-click face | Focus that face |

**Rotation constraints:**
- Free rotation, but:
- Snap-to-face at ~5° threshold
- Face alignment animation (100ms)

### 9A.5 Semantic Meaning of the 6 Faces (LOCKED MAPPING)

**Each face is non-arbitrary and globally consistent.**

| Face | Meaning | Examples |
|------|---------|----------|
| **Front** | Operation | op type, semantic action |
| **Back** | Inputs | causal dependencies |
| **Left** | Authority | authorityRef, delegation |
| **Right** | Evidence | proofs, references |
| **Top** | Time | commitIndex, ordering |
| **Bottom** | Integrity | hash, verification |

**This mapping must never change. It is part of Relay's physics.**

### 9A.6 Face Interaction (Before Unfolding)

**When a face is in view:**
- Hover → subtle highlight
- Click → face inspector overlay (small)
- Scroll within face → scroll content (if long)
- Edit affordances appear only if legitimate

**Editing rules:**
- Editing a face never mutates the commit
- All edits create:
  - A new proposal commit OR
  - A new derived filament
- The original cube remains immutable

### 9A.7 Unfold Mode (Cube → 2D Surface)

**Trigger:**
- Button on cube or Command Card: `[Unfold Faces]`

**Animation (non-negotiable):**
- 250–350ms unfolding animation
- Each face hinges outward
- Final layout is a cross-shaped net
- Camera automatically reframes

```
        [ Top ]
[ Left ][Front][ Right ]
        [Bottom]
        [ Back ]
```

**Resulting view:**
- Faces become flat, readable 2D panels
- Fill ~80–90% of viewport
- Text becomes selectable
- Scrollable panels if needed

**This is not abstraction — it is topological flattening.**

### 9A.8 Unfolded Face Panels — Behavior

**Each panel:**
- Has a header (face name)
- Has content area
- Shows:
  - Raw data
  - Structured view
  - Diffs (if applicable)

**Editing in unfolded mode:**
- Allowed only on:
  - Proposal layers
  - Draft changes
- Any edit shows:
  - "This will create a new commit"
  - Required authority
- Confirm creates a new filament or proposal commit

### 9A.9 Filament Inspection (Non-Cube)

**When inspecting a filament instead of a cube:**

**Default view:**
- Filament segment floats horizontally
- Time axis left → right
- Commit events visible as cubes along it

**Interactions:**
- Rotate filament in 3D
- Scrub time by dragging along axis
- Click any commit cube → zoom into cube inspection
- Toggle:
  - `[Show lineage]`
  - `[Show branches]`
  - `[Show scars]`

**Filament Unfold (optional):**
- `[Flatten Filament]` button:
  - Converts timeline into horizontal 2D strip
  - Commits become panels
  - Diffs between commits visible

### 9A.10 Inspection HUD Profile (Changes from Normal HUD)

**What changes:**
- Bottom HUD remains, but:
  - Selection Panel → **Inspection Panel**
  - Command Card → **Inspection Actions**
  - System Panel minimized

**Inspection Actions (examples):**
- `[Unfold Faces]`
- `[Propose Edit]`
- `[Branch From Here]`
- `[Export Evidence]`
- `[Compare With…]`
- `[Return to World]`

**No world-affecting actions without preview + legitimacy.**

### 9A.11 Exit Behavior

**Exit triggers:**
- ESC (per stack-pop rule)
- `[Return to World]` button

**Exit animation:**
- Cube refolds (if unfolded)
- Camera returns to prior world position
- HUD restores previous density
- Selection remains intact

**No loss of context.**

### 9A.12 Additional Features (Recommended & Safe)

#### A. Face Pinning
- Pin a face to remain visible while rotating cube
- Useful for comparing authority vs evidence

#### B. Diff Overlay
- When inspecting a proposal vs canonical commit:
  - Faces show diff highlights
  - Red/green semantic coloring (audit-safe)

#### C. Snapshot From Inspection
- Button: `[Save Snapshot]`
- Saves:
  - Cube orientation
  - Unfolded state
  - Highlighted face
- Enables "return to this exact view"

#### D. Authority Lens Inside Inspection
- Toggle to emphasize:
  - Delegation chain on Authority face
  - Verification failures on Integrity face

### 9A.13 Why This Works (Important)

This gives you:
- **Embodied truth inspection**
- **No loss of physics**
- **No UI shortcuts**
- **Perfect auditability**
- **A tactile mental model**

It turns commits into objects you can hold, rotate, and unfold — which is exactly how humans understand complex truth.

---

## 10. INPUT/EVENT PRIORITY RULES

### 10.1 Priority Hierarchy (High to Low)

1. **Modal Confirmations** (Action Preview)
   - Captures ALL input until dismissed
   - Blocks edge-scroll, camera controls, selection

2. **Forensic Inspection Mode** (Isolated Chamber)
   - Full viewport takeover
   - Custom camera controls (rotation, pan, zoom)
   - HUD interactions limited to Inspection HUD profile
   - ESC returns to world with context preserved

3. **HUD Interactions** (Bottom HUD)
   - Mouse over HUD → disable edge-scroll
   - Click/drag in HUD → no world interaction
   - Minimap click → special handling (see below)

4. **Inspector Panels** (Expanded HUD)
   - Mouse over inspector → disable world interaction
   - Click outside inspector → close inspector (if not pinned)

5. **World Interactions** (3D Viewport)
   - Selection (left-click, drag for marquee)
   - Camera controls (right-drag, wheel, middle-drag)
   - Edge-scroll (if enabled and cursor at edge)

6. **Keyboard Shortcuts**
   - Always active (except when typing in a text field)
   - **ESC uses a unified stack-pop rule (locked):**
     
     **ESC closes the top-most interaction layer in this order:**
     1. Action Preview Modal
     2. Forensic Inspection Mode (returns to world with context preserved)
     3. Inspector Panel
     4. Context menu
     5. Work Attachment / Follow state
     6. Clear selection
     7. If in Work or Global mode: return to Command mode only when selection is empty (or require double-ESC if you prefer stricter exit).
     
     **Rationale:** prevents conflicting ESC behavior across modes and preserves RTS muscle memory.

### 10.2 Mouse Event Flow

```
Mouse Event
    ↓
Is cursor over HUD?
    ├─ YES → Route to HUD (stop propagation)
    └─ NO → Continue
         ↓
    Is inspector open?
        ├─ YES → Route to inspector (if cursor inside)
        └─ NO → Continue
             ↓
        Is modal open?
            ├─ YES → Route to modal (block all else)
            └─ NO → Continue
                 ↓
            Route to World (camera or selection)
```

### 10.3 Minimap Special Handling

**Minimap is part of HUD but affects world camera:**

- Click minimap → Move camera (do NOT trigger edge-scroll)
- Drag minimap viewport box → Pan camera
- Minimap interaction DOES NOT change selection
- After minimap click, cursor returns to last world position (or center)

### 10.4 Edge-Scroll Special Rules

**Only triggers if ALL conditions met:**
- ✅ Command mode active
- ✅ Cursor within edge threshold (24px)
- ✅ Cursor NOT over HUD
- ✅ No modal open
- ✅ Not dragging selection box
- ✅ Not dragging minimap

---

## 11. COMPONENT BREAKDOWN (REACT-FRIENDLY)

### 11.1 Top-Level Structure

```jsx
<RelayCoordinationWorld>
  <TopBar />
  <Viewport3D>
    <EarthGlobe />
    <FilamentLayer />
    <UnitLayer />
    <SelectionOutlines />
    <InWorldOverlays />
  </Viewport3D>
  <BottomHUD>
    <SelectionPanel />
    <CommandCard />
    <SystemPanel />
  </BottomHUD>
  <InspectorOverlay />
  <ForensicInspectionMode />
  <ModalOverlay />
</RelayCoordinationWorld>
```

### 11.2 Component Hierarchy

```
RelayCoordinationWorld (root container)
├── TopBar (optional, 5% height)
│   ├── ProjectName
│   ├── LensIndicator
│   └── VerificationBadge
│
├── Viewport3D (75% height, full width)
│   ├── CameraController (mode-aware)
│   ├── Scene3D
│   │   ├── EarthGlobe (shared LOD)
│   │   ├── FilamentRenderer (shared LOD)
│   │   │   └── FilamentMesh[] (LOD instances)
│   │   ├── UnitRenderer (shared LOD)
│   │   │   ├── UnitMesh[] (SCV units)
│   │   │   └── SCVCancellationEffect (terminal event handler)
│   │   └── EntityLayer
│   │       ├── QueueMesh[]
│   │       ├── ConflictMesh[]
│   │       └── ResourceMesh[]
│   ├── SelectionOutlines
│   ├── InWorldOverlays
│   │   ├── Nameplates (optional)
│   │   └── SelectionAnchors
│   └── EdgeScrollDetector
│
├── BottomHUD (20% height, full width)
│   ├── SelectionPanel (25% width)
│   │   ├── UnitInspector (conditional)
│   │   ├── FilamentInspector (conditional)
│   │   ├── QueueInspector (conditional)
│   │   ├── MultiSelectInspector (conditional)
│   │   └── EmptyState (conditional)
│   │
│   ├── CommandCard (50% width)
│   │   ├── UnitCommandButtons (conditional)
│   │   ├── FilamentCommandButtons (conditional)
│   │   ├── QueueCommandButtons (conditional)
│   │   ├── PromptCommandButtons (conditional)
│   │   ├── NoLegitimacyMessage (conditional)
│   │   └── EmptyState (conditional)
│   │
│   └── SystemPanel (25% width)
│       ├── ModeSelector
│       ├── ControlGroupChips (1..0)
│       ├── Minimap
│       │   ├── MinimapCanvas (2D projection)
│       │   ├── ViewportBox (draggable)
│       │   └── MinimapIcons (units, conflicts, etc.)
│       ├── AlertsFeed
│       ├── LensSelector (radio buttons)
│       └── VerificationStatus
│
├── InspectorOverlay (conditional, slides from panels)
│   ├── FilamentInspectorPanel
│   ├── CommitTrailInspectorPanel
│   ├── AuthorityInspectorPanel
│   ├── PromptCompilerInspectorPanel
│   └── SnapshotBrowserPanel
│
├── ForensicInspectionMode (conditional, full viewport takeover)
│   ├── IsolatedInspectionChamber
│   │   ├── TimeCubeRenderer (3D prism with 6 faces)
│   │   ├── FilamentInspectionRenderer
│   │   └── InspectionLighting
│   ├── TimeCubeFaceSystem
│   │   ├── FrontFace (Operation)
│   │   ├── BackFace (Inputs)
│   │   ├── LeftFace (Authority)
│   │   ├── RightFace (Evidence)
│   │   ├── TopFace (Time)
│   │   └── BottomFace (Integrity)
│   ├── UnfoldAnimation
│   ├── UnfoldedFacePanels (2D cross-shaped net)
│   ├── InspectionHUDProfile
│   │   ├── InspectionPanel (replaces Selection Panel)
│   │   ├── InspectionActions (replaces Command Card)
│   │   └── MinimizedSystemPanel
│   └── InspectionCameraController
│
└── ModalOverlay (conditional, full-screen overlay)
    └── ActionPreviewModal
        ├── ActionDetails
        ├── CommitPreview
        ├── AuthorityCheck
        └── ConfirmButtons
```

### 11.3 Key Component Props

#### `<CameraController>`
```typescript
interface CameraControllerProps {
  mode: 'command' | 'work' | 'global';
  selection: Entity | Entity[] | null;
  lensType: LensType;
  onCameraChange: (camera: Camera) => void;
  enableEdgeScroll: boolean;
}
```

#### `<FilamentRenderer>`
```typescript
interface FilamentRendererProps {
  filaments: Filament[];
  lodScalar: number; // 0.0 to 1.0
  lensType: LensType;
  selectedFilaments: string[];
  onFilamentClick: (filamentId: string) => void;
}
```

#### `<Minimap>`
```typescript
interface MinimapProps {
  entities: Entity[];
  camera: Camera;
  mode: CameraMode;
  filters: MinimapFilter[];
  onMinimapClick: (worldPosition: Vector3) => void;
  onViewportBoxDrag: (delta: Vector2) => void;
}
```

#### `<CommandCard>`
```typescript
interface CommandCardProps {
  selection: Entity | Entity[] | null;
  userAuthority: Authority;
  onAction: (action: Action) => Promise<void>;
}
```

---

## 12. LOD PIPELINE DEFINITION

### 12.1 LOD Controller

**Single source of truth for zoom → detail mapping:**

```javascript
class LODController {
  constructor() {
    this.zoomScalar = 0.5; // 0.0 (macro) to 1.0 (micro)
    this.lodBands = {
      MACRO:  { min: 0.0,  max: 0.2 },
      HIGH:   { min: 0.2,  max: 0.4 },
      MEDIUM: { min: 0.4,  max: 0.7 },
      CLOSE:  { min: 0.7,  max: 0.9 },
      MICRO:  { min: 0.9,  max: 1.0 },
    };
  }

  setZoom(newZoom) {
    this.zoomScalar = clamp(newZoom, 0.0, 1.0);
    this.notifyObservers();
  }

  getCurrentBand() {
    for (const [name, range] of Object.entries(this.lodBands)) {
      if (this.zoomScalar >= range.min && this.zoomScalar < range.max) {
        return name;
      }
    }
    return 'MICRO';
  }

  getBlendFactor(band) {
    const range = this.lodBands[band];
    return (this.zoomScalar - range.min) / (range.max - range.min);
  }
}
```

### 12.2 Entity LOD Implementations

#### Globe LOD
```javascript
class GlobeLOD {
  update(lodScalar) {
    if (lodScalar < 0.2) {
      this.showContinentOutlines();
      this.hideBorders();
    } else if (lodScalar < 0.4) {
      this.showCountryBorders();
      this.hideTerrainFeatures();
    } else if (lodScalar < 0.7) {
      this.showTerrainFeatures();
      this.hideSurfaceTexture();
    } else {
      this.showSurfaceTexture();
    }
  }
}
```

#### Filament LOD
```javascript
class FilamentLOD {
  update(lodScalar) {
    if (lodScalar < 0.2) {
      this.renderAsRidgeLines();
      this.lineWidth = 1;
    } else if (lodScalar < 0.4) {
      this.renderBranchStructure();
      this.lineWidth = 2;
      this.showCommitEvents = false;
    } else if (lodScalar < 0.7) {
      this.showCommitEvents = true;
      this.lineWidth = 4;
    } else {
      this.showCommitEventBoxes = true;
      this.showRefEdges = true;
      this.showFractalDetail = true;
    }
  }
}
```

#### Unit LOD
```javascript
class UnitLOD {
  update(lodScalar) {
    if (lodScalar < 0.2) {
      this.renderAsIcon(); // 2D billboard
    } else if (lodScalar < 0.4) {
      this.renderAsLowPolyModel(); // < 500 tris
    } else if (lodScalar < 0.7) {
      this.renderAsMediumPolyModel(); // 500-2000 tris
    } else {
      this.renderAsHighPolyModel(); // > 2000 tris
      this.showNameplate = lodScalar > 0.9;
    }
  }
}
```

### 12.3 LOD Transition Manager

```javascript
class LODTransitionManager {
  transition(fromBand, toBand, duration = 200) {
    const steps = [
      { entity: 'globe', delay: 0 },
      { entity: 'filaments', delay: 50 },
      { entity: 'units', delay: 100 },
    ];

    steps.forEach(({ entity, delay }) => {
      setTimeout(() => {
        this.blendEntityLOD(entity, fromBand, toBand, duration - delay);
      }, delay);
    });
  }

  blendEntityLOD(entity, from, to, duration) {
    const startTime = performance.now();
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const eased = this.easeInOutCubic(progress);
      
      entity.setLODBlend(from, to, eased);
      
      if (progress < 1.0) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  easeInOutCubic(t) {
    return t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
```

---

## 13. IMPLEMENTATION RISKS & MITIGATION

### 13.1 Risk: Edge-Scroll Conflicts with HUD

**Problem:** Edge-scroll triggers when cursor over minimap or bottom HUD

**Mitigation:**
- ✅ Explicit HUD bounds checking before edge-scroll activation
- ✅ Add 4px safety margin around HUD
- ✅ Disable edge-scroll when any HUD element has focus
- ✅ Test with minimap at viewport edge

**Code pattern:**
```javascript
function shouldActivateEdgeScroll(cursorPos, hudBounds) {
  if (cameraMode !== 'command') return false;
  if (isModalOpen()) return false;
  if (cursorPos.y > hudBounds.top - 4) return false; // HUD safety
  // ... rest of checks
}
```

### 13.2 Risk: LOD Transitions Cause Popping

**Problem:** Abrupt mesh/texture swaps at LOD boundaries are jarring

**Mitigation:**
- ✅ Blend between LOD levels using opacity crossfade
- ✅ Pre-load next LOD when within threshold (< 0.1 zoom units)
- ✅ Stagger transitions (globe → filaments → units)
- ✅ Use easing functions (ease-in-out cubic)
- ✅ Test transition smoothness at 60fps target

### 13.3 Risk: Multi-Select Performance

**Problem:** 1000+ units selected → slow command card filtering

**Mitigation:**
- ✅ Cap multi-select at 500 units (show warning if exceeded)
- ✅ Cache legitimate actions per frame (don't recompute on every render)
- ✅ Use virtual scrolling for multi-select list
- ✅ Debounce selection changes (50ms)

### 13.4 Risk: Minimap Sync Drift

**Problem:** Minimap viewport box doesn't match main camera frustum

**Mitigation:**
- ✅ Recalculate minimap viewport box on every camera update
- ✅ Use camera projection matrix to derive exact frustum
- ✅ Account for aspect ratio differences
- ✅ Test with extreme camera angles (top-down vs isometric)

### 13.5 Risk: Mode Switch Confusion

**Problem:** Users don't know which mode they're in

**Mitigation:**
- ✅ Large, clear mode indicator in System Panel
- ✅ Different cursor shapes per mode:
  - Command: RTS pointer
  - Work: Crosshair
  - Global: Compass rose
- ✅ Different HUD colors per mode (subtle tint):
  - Command: Blue tint
  - Work: Green tint
  - Global: Purple tint
- ✅ Show "Press ESC to return to Command mode" hint in Work/Global

### 13.6 Risk: Legitimacy Checks Are Slow

**Problem:** Checking authority for every button on every frame → lag

**Mitigation:**
- ✅ Cache legitimacy results per selection (invalidate on authority change)
- ✅ Only check legitimacy when selection changes or authority updates
- ✅ Use Web Worker for authority graph traversal (if complex)
- ✅ Precompute common authority patterns (e.g., "user can edit work.*")

### 13.7 Risk: 3D World Occlusion

**Problem:** Units/filaments hidden behind Earth globe

**Mitigation:**
- ✅ Globe always rendered first (behind everything)
- ✅ Semi-transparent globe option (toggle in System Panel)
- ✅ X-ray mode for selected entities (always render on top)
- ✅ Automatic camera repositioning if selection occluded (in Command mode)

---

## 14. ACCEPTANCE TESTS

### Test 1: Action Buttons Only in HUD
- ✅ All actionable buttons appear only in bottom HUD Command Card
- ✅ No floating toolbars or popup action menus in viewport
- ✅ Top bar contains NO action buttons

### Test 2: Minimap Camera Control
- ✅ Minimap click moves RTS camera to clicked position
- ✅ Selection remains intact after minimap click
- ✅ Viewport box accurately represents camera frustum
- ✅ Dragging viewport box pans camera smoothly

### Test 3: Edge-Scroll Activation
- ✅ Edge-scroll pans camera only when cursor near viewport edge
- ✅ Edge-scroll does NOT activate when cursor over HUD
- ✅ Edge-scroll does NOT activate when cursor over minimap
- ✅ Edge-scroll does NOT activate in Work or Global mode
- ✅ Edge-scroll does NOT activate when modal open

### Test 4: Work Mode (FPS)
- ✅ Work Mode enables embodied FPS navigation (WASD + mouse look)
- ✅ Collision-aware movement is ON in Work Mode
- ✅ Edge-scroll is disabled in Work Mode
- ✅ Marquee selection is disabled in Work Mode
- ✅ Switching to Work Mode preserves selection and lens state

### Test 4b: Global Mode (Flyaround)
- ✅ Global Mode enables 6DOF travel navigation (WASD, Q/E, mouse look, boost)
- ✅ Collision is OFF (or very soft) in Global Mode
- ✅ Edge-scroll is disabled in Global Mode
- ✅ Marquee selection is disabled in Global Mode
- ✅ Switching to Global Mode preserves selection and lens state
- ✅ Minimap becomes Globe Navigator and supports region jump/orbit primitives

### Test 5: Shared LOD
- ✅ Zooming changes globe detail and filament detail together
- ✅ Unit detail changes in sync with globe/filament LOD
- ✅ Minimap simplification reflects current LOD band
- ✅ LOD transitions are smooth (no popping)

### Test 6: Unit Selection
- ✅ Selecting an SCV shows unit details in Selection Panel
- ✅ Command Card shows only unit-legal commands
- ✅ Commands require legitimacy; illegitimate buttons are absent
- ✅ Multi-select shows shared commands only

### Test 7: Filament Selection
- ✅ Selecting a filament shows filament details in Selection Panel
- ✅ Command Card shows only filament-legal commands
- ✅ "Inspect" button opens inspector in HUD (not popup)

### Test 8: Multi-Select Constraints
- ✅ Multi-select of units shows shared commands only
- ✅ No filament-only actions appear for unit multi-select
- ✅ Multi-select panel shows count and state breakdown

### Test 9: Legitimacy Enforcement
- ✅ Any truth-changing command requires legitimacy
- ✅ If not legitimate, the button is absent (not disabled)
- ✅ HUD explains "why" in Selection Panel or Command Card
- ✅ Authority source is visible in Action Preview
- ✅ Missing capability shown as "Blocked: missing capability X"

### Test 10: Center on Selection
- ✅ "Center on selection" (Space key) works in Command mode
- ✅ "Center on selection" works in Work mode
- ✅ "Center on selection" works in Global mode
- ✅ Selection is NOT lost after centering

### Test 11: Minimap Viewport Box
- ✅ Viewport box accurately represents current camera frustum
- ✅ Viewport box updates in real-time as camera moves
- ✅ Dragging viewport box pans camera (not viewport box)
- ✅ Viewport box rotation matches camera rotation (Command mode)

### Test 12: Lens Switching
- ✅ Switching lenses never changes underlying state
- ✅ Switching lenses only changes emphasis/visibility
- ✅ Selection preserved when switching lenses
- ✅ Camera position preserved when switching lenses

### Test 13: Mode Switching
- ✅ Command → Work preserves selection
- ✅ Work → Global preserves selection
- ✅ Global → Command preserves selection
- ✅ Mode indicator is always visible and clear
- ✅ Cursor shape changes per mode

### Test 14: Action Preview
- ✅ All actions show "What will happen" preview before executing
- ✅ Preview includes commit type and required authority
- ✅ Confirm/Cancel buttons work as expected
- ✅ Cancel returns to previous state (no side effects)

### Test 15: Inspector Panels
- ✅ Inspectors open as HUD expansions (not popups)
- ✅ ESC closes top-most inspector (via stack-pop)
- ✅ Click outside inspector closes it (if not pinned)
- ✅ Multiple inspectors can stack (open → open another)

### Test 16: ESC Stack-Pop Model
- ✅ ESC closes Action Preview modal first
- ✅ ESC exits Forensic Inspection Mode next (returns to world with context preserved)
- ✅ ESC closes Inspector panel next
- ✅ ESC closes context menu next
- ✅ ESC detaches from Work Attachment / stops Follow state next
- ✅ ESC clears selection next
- ✅ If in Work/Global mode with no selection, ESC returns to Command mode (or requires double-ESC per final choice)

### Test 17: Control Groups
- ✅ Ctrl+1..0 assigns current selection to control group
- ✅ 1..0 recalls control group selection
- ✅ Double-tap 1..0 centers camera on control group (Command) or focuses travel target (Global)
- ✅ Control group chips visible in System Panel
- ✅ Clicking chip recalls selection
- ✅ Managing 50+ units is efficient via control groups

### Test 18: Forensic Inspection Mode
- ✅ Double-clicking a time cube enters isolated inspection mode
- ✅ World fades but remains spatially consistent (not removed)
- ✅ Cube rotates freely with snap-to-face behavior (~5° threshold)
- ✅ Each face maps consistently to its semantic meaning (Front=Operation, Back=Inputs, Left=Authority, Right=Evidence, Top=Time, Bottom=Integrity)
- ✅ Editing a face never mutates the original commit
- ✅ [Unfold Faces] produces a readable 2D cross-shaped net
- ✅ Unfolded faces fill ~80-90% of viewport and are scrollable
- ✅ Any edit produces a proposal commit with preview + legitimacy check
- ✅ Exiting inspection (ESC or [Return to World]) restores exact previous camera + selection
- ✅ Filament inspection allows drill-down into individual cubes
- ✅ Face semantic mapping never changes (part of Relay physics)

### Test 19: SCV Cancellation (Terminal Event)
- ✅ Pressing `[Cancel]` on SCV via Command Card creates `SCV_CHANNEL_CANCEL` commit
- ✅ Cancellation triggers 4-phase visual sequence (overload → burst → collapse → ghost)
- ✅ Phase 1 (Overload): SCV pulses red/orange, beam detaches, HUD warning appears
- ✅ Phase 2 (Burst): SCV fractures into commit-shards (mini time-cubes) ejected outward
- ✅ Commit-shards represent: last N commits (blue), cancel commit (red), unresolved refs (yellow)
- ✅ Phase 3 (Collapse): Hex shell appears and collapses inward, SCV mesh despawns
- ✅ Phase 4 (Ghost): `⊘ SCV TERMINATED` marker appears for 2 seconds, clickable
- ✅ Clicking ghost marker enters Forensic Inspection Mode showing cancel commit
- ✅ SCV mesh disappears after sequence, channel closed
- ✅ Work filament remains intact (cancel doesn't delete work)
- ✅ Audit trail shows cancel commit permanently
- ✅ Replay produces identical explosion sequence (deterministic)
- ✅ Cancellation variants render correctly based on `cancelReason` (user/authority/timeout/conflict)
- ✅ No resurrection without explicit `SCV_CREATE` commit

---

## 15. FINAL CHECKLIST

### Core Systems
- [ ] Three camera modes (Command, Work, Global) implemented
- [ ] Mode selector in System Panel
- [ ] Edge-scroll only in Command mode
- [ ] Shared LOD scalar drives globe + filaments + units
- [ ] LOD transitions smooth (<200ms, no popping)
- [ ] ESC stack-pop model implemented correctly
- [ ] Globe fixed in world space (camera moves around it)
- [ ] Control groups (Ctrl+1..0) implemented

### HUD Panels
- [ ] Selection Panel shows context-sensitive entity details
- [ ] Command Card shows only legitimate actions
- [ ] Command Card shows "Blocked: missing capability X" when actions absent
- [ ] System Panel contains minimap + alerts + lenses + verification
- [ ] All inspectors open as HUD expansions (no popups)
- [ ] Control group chips visible in System Panel

### Minimap
- [ ] Interactive (click to move camera in Command mode)
- [ ] Viewport box synced with main camera
- [ ] Icons for units, conflicts, filaments
- [ ] Filter toggles work correctly
- [ ] Minimap mode changes per camera mode (standard/local/globe)

### Selection & Actions
- [ ] Single-select units, filaments, queues works
- [ ] Multi-select units works (shared commands only)
- [ ] Marquee selection only in Command mode
- [ ] All actions show preview before executing
- [ ] Illegitimate actions: buttons absent (not disabled)

### World Entities
- [ ] SCV units have 5 states (Idle, Moving, Working, Blocked, Awaiting)
- [ ] Working units show visible attachment (beam/tether)
- [ ] Commit events visible as particle burst
- [ ] SCV cancellation produces 4-phase terminal event (overload/burst/collapse/ghost)
- [ ] Commit-shards visualize truth fragments (last commits + cancel commit + refs)
- [ ] Ghost marker is clickable → Forensic Inspection of cancel commit
- [ ] Cancellation variants render based on cancelReason (user/authority/timeout/conflict)
- [ ] Filaments show branch structure at appropriate LOD
- [ ] Earth globe is physical 3D object (not skybox)
- [ ] Terminology: "commit events" not "nodes"

### Input Handling
- [ ] HUD interactions block world interaction
- [ ] Edge-scroll respects all exclusion rules
- [ ] Keyboard shortcuts always work (except in text fields)
- [ ] ESC follows unified stack-pop model

### Lenses
- [ ] Five lenses implemented (World, Filament, Workforce, Authority, Conflict)
- [ ] Lenses change emphasis only (never truth)
- [ ] Switching preserves selection and camera

### Forensic Inspection Mode
- [ ] Double-click commit event enters isolated inspection chamber
- [ ] Time cube has 6 faces with locked semantic mapping
- [ ] Cube rotation with snap-to-face behavior
- [ ] [Unfold Faces] produces cross-shaped 2D net
- [ ] Face editing creates proposal commits (never mutates original)
- [ ] Exit restores previous camera + selection
- [ ] Filament inspection with drill-down to individual cubes

### Verification
- [ ] Verification status always visible in System Panel
- [ ] Truth-changing actions blocked if verify fails
- [ ] HUD shows actionable error (not just "failed")

---

## 16. IMPLEMENTATION NOTES

### Recommended Tech Stack

**3D Rendering:**
- Three.js + React-Three-Fiber
- @react-three/drei for controls and helpers
- @react-three/postprocessing for visual polish (optional)

**State Management:**
- Zustand for lightweight state (camera, selection, mode)
- React Context for HUD panels
- Separate store for LOD controller (single source of truth)

**Performance:**
- Instanced rendering for units (1000+ units)
- Frustum culling for filaments
- Object pooling for particle effects (commit events)
- Web Worker for authority graph traversal (if needed)

**Testing:**
- Playwright for acceptance tests (E2E)
- Vitest for unit tests (LOD controller, legitimacy checks)
- Visual regression tests for HUD layout

### Development Phases

**Phase 1: Core Systems (2-3 weeks)**
- Camera controller with 3 locked modes (Command RTS / Work FPS / Global Flyaround FPS)
- Basic HUD layout (Selection + Command + System panels)
- Earth globe + shared LOD pipeline
- Simple unit rendering (icons only)
- ESC stack-pop implementation
- Control groups (Ctrl+1..0)

**Phase 2: Entity Rendering (2 weeks)**
- Filament LOD implementation
- Unit state visualization
- Commit event particles
- SCV cancellation terminal event (4-phase sequence + commit-shards)
- Selection outlines
- Terminology enforcement (commit events, not nodes)

**Phase 3: Minimap & Navigation (1-2 weeks)**
- Minimap 2D projection
- Viewport box sync
- Edge-scroll implementation
- Click-to-move in Command mode
- Globe Navigator mode for Global

**Phase 4: HUD Interactions (2 weeks)**
- Command Card action buttons
- Legitimacy checking
- Action Preview modal
- Inspector panels
- "Blocked: missing capability X" messaging

**Phase 5: Lenses & Polish (1 week)**
- Five lens implementations
- Visual transitions
- Performance optimization
- Bug fixes

**Phase 6: Forensic Inspection Mode (1-2 weeks)**
- Isolated inspection chamber (camera + lens transition)
- Time cube 3D interaction (rotation, snap-to-face)
- 6-face semantic mapping implementation
- Unfold animation (cube → 2D cross-shaped net)
- Face inspection panels + diff overlay
- Filament inspection with drill-down
- Inspection HUD profile
- Exit behavior + context preservation

---

**END OF SPECIFICATION**

**Status:** ✅ LOCKED v1.1.0 - IMPLEMENTATION-READY  
**Target:** Engineering can build directly from this spec  
**Pattern:** StarCraft-style RTS HUD + 3D coordination physics world + Forensic Inspection  
**Guarantee:** No ambient authority, all actions explicit, deterministic replay, embodied truth inspection

**Lock Date:** 2026-01-28  
**Approver:** Relay Core Team  
**Next Review:** After Phase 1-2 implementation (estimated 4-5 weeks)
