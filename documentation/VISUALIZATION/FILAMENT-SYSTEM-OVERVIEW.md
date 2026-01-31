# 🎨 Filament System Overview — Truth Visualization in Relay

**Version**: 1.0.0  
**Status**: Canonical Reference  
**Last Updated**: 2026-01-27

---

## Executive Summary

The **Filament System** is Relay's revolutionary approach to visualizing truth, causality, and history. Instead of abstract dashboards or static charts, Relay renders **truth as geometry**—where every commit is a discrete, inspectable event in real time, and every identity persists as a **filament** whose shape encodes its entire history.

**Core Principle:**
> Truth is represented as discrete, inspectable events (commits) embedded in real time, rendered as persistent filaments whose geometry encodes causality, magnitude, and eligibility—and whose playback reveals history without fabricating continuity.

**Universal Import Principle:**
> **Relay should be able to receive, understand, interpret, and render all files ever created from any system** as filaments with full history, evidence, and governance.

**Key Innovations:**
- **Filaments**: Persistent identities over time (like musical notes on a staff, or commits on a Git graph)
- **TimeBoxes**: Atomic truth units with 6 semantic faces (+X output, -X input, +Y meaning, -Y magnitude, +Z identity, -Z evidence)
- **Glyphs**: 8 canonical operations (STAMP, KINK, DENT, TWIST, UNTWIST, GATE, SPLIT, SCAR)
- **Views**: Globe (X-collapsed), Workflow (X-expanded), Spreadsheet (projection), Sphere (personal lens)
- **Playback Motor**: Navigate history with play/pause/step controls
- **Universal Import**: Ingest any system (Excel, Git, SQL, AD, Docker, etc.) as filaments

**Why It Matters:**
Filaments make causality **reconstructible without narration**. You can audit decisions, trace errors, and verify outcomes by inspecting geometry alone—no UI tricks, no author trust required. And because Relay can **import any system**, it serves as the universal computational substrate for all truth.

---

## Table of Contents

1. [What Is a Filament?](#what-is-a-filament)
2. [Core Components](#core-components)
3. [The Three Axes](#the-three-axes)
4. [Time Model](#time-model)
5. [Views and Lenses](#views-and-lenses)
6. [Glyphs: The Visual Language](#glyphs-the-visual-language)
7. [Playback Motor](#playback-motor)
8. [Real-World Analogies](#real-world-analogies)
9. [User Interactions](#user-interactions)
10. [Integration with Other Systems](#integration-with-other-systems)
11. [Frequently Asked Questions](#frequently-asked-questions)

---

## What Is a Filament?

### Definition

**Filament** = The persistent identity of an entity/process over time.

**NOT:**
- ❌ A thread or conversation
- ❌ A timeline or feed
- ❌ A graph node

**IS:**
- ✅ A **biography** of commits (like a Git commit history)
- ✅ A **tube through time** (horizontal in workflow view, vertical on globe)
- ✅ An **inspectable spine** where every commit is visible

### Analogy

**Think of filaments like musical notes on a staff:**
- The staff = the timeline (X-axis)
- Each note = a commit (discrete event)
- The note's height = magnitude (Y-axis)
- The note's position = when it happened (X-axis)
- Glyphs = musical symbols (sharp, flat, crescendo)

Just as you can **read music without hearing it**, you can **audit truth without narration** by reading filaments.

---

## Core Components

### 1. **TimeBox** (Atomic Truth Unit)

A **TimeBox** is a discrete, inspectable cube representing a single commit. It has **6 semantic faces**, each with specific meaning:

```
         +Y (Top)
          │
          │  Semantic Meaning
          │  (Human Intent)
          │
    ┌─────┴─────┐
    │           │
-X  │    ■──    │ +X  Output (Truth)
    │           │
    └─────┬─────┘
          │
          │  -Y (Bottom)
          │  Magnitude/Weight
          │
          ▼

    +Z (Front): Identity/Actor
    -Z (Back): Evidence/Source
```

#### **Face Semantics:**

| Face | Meaning | Example |
|------|---------|---------|
| **+X** | Output (what the world now believes) | Vote count: 150 |
| **-X** | Input (dependencies, prior state) | Previous count: 148 |
| **+Y** | Semantic meaning (human intent) | "Community Budget Vote" |
| **-Y** | Magnitude/weight (quantitative) | Importance: 0.85 |
| **+Z** | Identity (who/what acted) | Actor: user:alice |
| **-Z** | Evidence (source/proof) | Signature hash, document reference |

**Key Rule:**
> **TimeBoxes are inspectable without UI.** Hover over a cube → see all 6 faces directly on the geometry.

---

### 2. **Glyph** (Operation Indicator)

**Glyphs** are discrete geometric markers that attach to TimeBoxes, indicating the **type of operation** that commit represents.

**8 Canonical Glyphs:**

| Glyph | Meaning | Visual | Example |
|-------|---------|--------|---------|
| **STAMP** | State assertion (load, declare) | Ring clamp | "Import data: 1000 rows" |
| **KINK** | Transform (compute, convert) | Bend | "Convert USD→EUR" |
| **DENT** | Error/anomaly (flag, validate) | Dent | "Negative value detected" |
| **TWIST** | Encrypt | Helix | "Encrypt sensitive field" |
| **UNTWIST** | Decrypt | Reverse helix | "Decrypt for audit" |
| **GATE** | Filter/conditional | Aperture | "if amount > 0" |
| **SPLIT** | Fork/branch | Y-junction | "Create proposal branch" |
| **SCAR** | Merge/resolution | Sutured seam | "Merge approved proposal" |

**Rendering:**
- **Far mode**: Silhouette only (recognize shape)
- **Near mode**: 2D billboard label + description

**Glyphs are semantic, not aesthetic.** They encode truth about operations.

---

### 3. **Filament Pipe** (Identity Over Time)

The **filament pipe** connects TimeBoxes along the X-axis (event order).

**Properties:**
- **Hollow tube** (shows it's inspectable, not opaque)
- **Slight space between filaments** (for glyph legibility)
- **Continuous identity** (same filament = same entity through time)

---

## The Three Axes

The filament system uses a **3D coordinate space** with invariant semantic meanings:

### **X-Axis: Event Order (Structural Time)**

**Meaning:** Authority, causality, commit order

**Properties:**
- Discrete (commit → commit)
- Never continuous
- Never scaled by duration
- This is the **filament spine**

**Reading X:**
> "What came before? What came after?"

**Example:**
```
Commit 1 ───> Commit 2 ───> Commit 3
   (Δx=10)      (Δx=10)       (Δx=10)

Equal spacing = event order, not clock time
```

---

### **Y-Axis: Magnitude (Lens-Dependent)**

**Meaning:** Depends on active **lens**

**Possible Meanings:**
- Vote count
- Vote momentum (rate of change)
- Disagreement (controversy)
- Impact (importance)
- Confidence (certainty)
- Cost (financial)
- Risk (uncertainty)

**Critical:**
> **Y never means the same thing globally.** Y is defined by the active lens. Switch lenses → Y changes meaning.

**Example:**
```
Lens: "Vote Count"
Y = 150 votes

Lens: "Momentum"
Y = +5 votes/hour

Lens: "Controversy"
Y = 0.7 (high disagreement)
```

---

### **Z-Axis: Co-Presence / Eligibility**

**Meaning:** Geography, jurisdiction, access scope

**Determines:** Who can interact, not what happened

**Example:**
```
Z = (lat: 47.6, lon: -122.3)  → Seattle proximity channel
Z = "org:finance-dept"        → Finance department workspace
Z = "jurisdiction:king-county" → County-level eligibility
```

**Z answers:**
> "Where is this truth allowed to act?"

---

## Time Model

Relay uses **three distinct time layers** that never collapse:

### **1. Event Time (Truth)**

**Encoded by:** X-axis

**Properties:**
- Only commits create geometry
- TimeBoxes exist only here
- Discrete, never continuous

**This is structural truth.**

---

### **2. Physical / Clock Time (Context)**

**Encoded by:** Metadata, spacing overlay

**Properties:**
- Continuous, irregular
- Stored as commit timestamps
- Controls spacing between TimeBoxes (visual gaps)
- Can be visualized or collapsed

**This is ambient context.**

---

### **3. Playback Time (Navigation)**

**Controlled by:** Playback motor

**Properties:**
- Pause/play/step
- Speed (tempo)
- Live tail (follow frontier)

**This is viewer navigation.**

---

### **Time-Weighted Mode**

In **time-weighted mode**, spacing between TimeBoxes reflects **clock time gaps**:

```
Event-Normalized Mode:
Commit 1 ─10─> Commit 2 ─10─> Commit 3
(equal spacing, shows commit order)

Time-Weighted Mode:
Commit 1 ─15─> Commit 2 ─35─> Commit 3
(gap shows 5min vs 25min silence)
```

**Rule:**
> **No new geometry during silence.** Gaps are additive spacing, not stretched boxes. This is the "carry/no-event rule."

---

## Views and Lenses

The filament system supports **multiple views** of the same truth:

### **1. Globe View (X-Collapsed)**

**What It Shows:**
- **Vertical branches** (filaments growing outward from globe surface)
- **Current frontier state** (history folded along X-axis)
- **Y-axis = magnitude** (branch height shows current value)
- **Z-axis = geography** (lat/lon on globe surface)

**Answers:**
> "Where are truths allowed to act, and how much force do they currently have?"

**Example:**
```
     🌍 Globe
     
   Budget Branch
   ↑ (height = vote count)
   │
   │ 150 votes
   │
   └─ (Seattle)
```

**This is macro navigation.**

---

### **2. Workflow View (X-Expanded)**

**What It Shows:**
- **Horizontal filament** (TimeBoxes along X-axis)
- **Full commit history** (every TimeBox visible)
- **Glyphs attached** (operations visible)
- **Inspectable faces** (hover to see TimeBox data)

**Answers:**
> "How did this become true? What's the causality?"

**Example:**
```
Filament (horizontal):

TimeBox 1   TimeBox 2   TimeBox 3
   □           □           □
   │───────────│───────────│
  STAMP       KINK        GATE
  (Load)      (Transform)  (Filter)
```

**This is audit mode.**

---

### **3. Spreadsheet View (Projection)**

**What It Shows:**
- **Grid of cells** (each cell = +X face of latest TimeBox)
- **Ghosted filaments** behind grid (visible but faded)
- **Editable endpoint** (click cell → edit = new commit)

**Answers:**
> "What's the current state? How do I edit it?"

**Example:**
```
Spreadsheet (each cell projects latest +X face):

     A         B         C
1   1000      2000      3000
2   1500      2500      3500  ← Click to edit = append commit
3   2000      3000      4000
```

**This is work surface.**

---

### **4. User Sphere View (Personal Lens)**

**What It Shows:**
- **Filaments I've touched** (filtered to my interactions)
- **Personal arrangement** (how I organize my work)
- **Fly-to portal** (others can inspect if I allow)

**Answers:**
> "What am I working on? What do I care about?"

**See:** [User Sphere Model](USER-SPHERE-MODEL.md)

---

## Glyphs: The Visual Language

### Why Glyphs?

Glyphs solve the problem: **"How do you show operations without labels?"**

**Design Principle:**
> Shape encodes meaning. No reliance on text, color, or author explanation.

---

### The 8 Canonical Glyphs (Detailed)

#### **1. STAMP (State Assertion)**
**Shape:** Ring clamp around TimeBox  
**Meaning:** Load, import, declare  
**Example:** "Import 1000 rows from CSV"  
**Body vs Modifier:** Body operation (creates new state)

#### **2. KINK (Transform)**
**Shape:** Bent segment in filament pipe  
**Meaning:** Compute, convert, map  
**Example:** "Convert USD to EUR at rate 0.92"  
**Body vs Modifier:** Body operation (changes value)

#### **3. DENT (Error/Anomaly)**
**Shape:** Dent/crater on TimeBox surface  
**Meaning:** Flag, validate, detect anomaly  
**Example:** "Negative value detected (error)"  
**Body vs Modifier:** Modifier (doesn't change value, adds flag)

#### **4. TWIST (Encrypt)**
**Shape:** Helix wrapping filament  
**Meaning:** Encrypt, obfuscate  
**Example:** "Encrypt social security number"  
**Body vs Modifier:** Modifier (changes representation, not value)

#### **5. UNTWIST (Decrypt)**
**Shape:** Reverse helix, unwrapping  
**Meaning:** Decrypt, reveal  
**Example:** "Decrypt for audit"  
**Body vs Modifier:** Modifier (restores representation)

#### **6. GATE (Filter/Conditional)**
**Shape:** Aperture/iris mechanism  
**Meaning:** if/then, filter, pass/block  
**Example:** "if amount > 0 then proceed"  
**Body vs Modifier:** Body operation (controls flow)

#### **7. SPLIT (Fork/Branch)**
**Shape:** Y-junction, filament diverges  
**Meaning:** Fork, branch, create proposal  
**Example:** "Alice creates alternative budget proposal"  
**Body vs Modifier:** Body operation (creates competing timeline)

#### **8. SCAR (Merge/Resolution)**
**Shape:** Sutured seam, filaments converge  
**Meaning:** Merge, resolve conflict, adopt proposal  
**Example:** "Community adopts Alice's proposal"  
**Body vs Modifier:** Body operation (resolves divergence)

---

## Playback Motor

### What Is It?

The **playback motor** controls **navigation through commit history**.

**Controls:**
- **Play**: Auto-advance through commits
- **Pause**: Stop at current commit
- **Step**: Advance one commit at a time
- **Tempo**: Speed of playback (commits/second)

**Critical:**
> The motor reveals geometry progressively. It doesn't fabricate continuity—it shows discrete commits only.

---

### How It Works

**Cursor Index:**
A state variable tracking "which commit are we showing up to?"

```typescript
const [cursorIndex, setCursorIndex] = useState(0);

// Play mode: increment cursor
useEffect(() => {
  if (isPlaying) {
    const interval = setInterval(() => {
      setCursorIndex(prev => Math.min(prev + 1, maxCommits));
    }, tempo);
    return () => clearInterval(interval);
  }
}, [isPlaying, tempo]);

// Render only up to cursor
const visibleTimeBoxes = filament.timeBoxes.filter(
  tb => tb.eventIndex <= cursorIndex
);
```

---

### Use Cases

**1. Audit Mode:**
Step through commits one by one, inspecting each TimeBox.

**2. Demo Mode:**
Play through history to show how a decision evolved.

**3. Live Tail:**
Follow the frontier in real-time (cursor = latest commit).

**4. Error Tracing:**
Play forward until error appears, then step backward to find cause.

---

## Real-World Analogies

### 1. **Musical Score**

**Staff = Timeline (X-axis)**  
**Notes = Commits (TimeBoxes)**  
**Symbols = Glyphs (sharps, flats, crescendos)**  
**Playing the Score = Playback Motor**

Just as you can **read music without hearing it**, you can **audit truth without executing it**.

---

### 2. **Git Commit Graph**

**Commits = TimeBoxes**  
**Branches = Filaments**  
**Merge = SCAR glyph**  
**Fork = SPLIT glyph**  
**Viewing History = Workflow View**

Filaments are **visual Git**—same concepts, but rendered in 3D space.

---

### 3. **Video Editing Timeline**

**Timeline = X-axis**  
**Clips = TimeBoxes**  
**Transitions = Glyphs**  
**Playhead = Cursor Index**  
**Scrubbing = Playback Motor**

Same principles, different domain.

---

## User Interactions

### **Inspecting a TimeBox**

**Action:** Hover or click on a TimeBox cube

**Result:** See all 6 faces directly on geometry:
```
Hover on TimeBox 42:
┌───────────────────────────────┐
│ +X Output: Vote Count = 150   │
│ -X Input: Previous = 148      │
│ +Y Meaning: "Budget Proposal" │
│ -Y Magnitude: Impact = 0.85   │
│ +Z Actor: user:alice          │
│ -Z Evidence: sig:abc123def    │
└───────────────────────────────┘
```

---

### **Navigating History**

**Action:** Use playback controls (play/pause/step)

**Result:** Commits appear progressively, showing causality

**Example:**
```
Step 1: STAMP (Load data)
Step 2: KINK (Transform)
Step 3: GATE (Filter)
Step 4: DENT (Error detected)
```

---

### **Switching Views**

**Action:** Click view mode button (Globe / Workflow / Sheet)

**Result:** Same filaments, different projection

**Example:**
```
Globe View → See "150 votes" as branch height
  ↓ (Click to expand)
Workflow View → See how "150" was computed (5 commits)
  ↓ (Click cell in sheet)
Spreadsheet View → See "150" in editable cell
```

---

### **Editing via Spreadsheet**

**Action:** Click cell, type new value, press Enter

**Result:** New commit appended to filament

**Under the Hood:**
```typescript
// User edits cell A1 from 1000 to 1500
onCellEdit('A1', 1000, 1500);

// System creates new commit:
const commit = {
  envelope: {
    commit_class: 'CELL_EDIT',
    actor: 'user:bob',
    // ...
  },
  timeBox: {
    faces: {
      output: 1500,    // +X new value
      input: 1000,     // -X old value
      semantic: "Budget Update",
      magnitude: 500,  // difference
      identity: 'user:bob',
      evidence: 'edit-session:xyz'
    }
  }
};

// Filament grows by one TimeBox
filament.timeBoxes.push(commit.timeBox);
```

---

## Integration with Other Systems

### With User Spheres

User spheres **reference filaments** (don't duplicate them):

```typescript
// Alice's sphere shows Budget filament
alice.sphere.projection.filamentRefs.push({
  filamentId: 'budget-2026',
  inclusionReason: 'authored',  // Alice authored commits
  visibility: 'public'
});

// Click Budget in Alice's sphere → snaps to Workflow View
```

---

### With Presence

Presence **anchors to filament loci**:

```typescript
// Bob is inspecting Budget, commit 42
const presence = {
  locus: {
    filamentId: 'budget-2026',
    commitIndex: 42,
    lensContext: 'workflow'
  },
  count: 3  // 3 viewers at this commit
};

// Render green bead on filament at TimeBox 42
```

---

### With Git-Native Truth

Filaments **are Git commits** with structured envelopes:

```typescript
// Git commit:
{
  hash: 'abc123',
  author: 'Alice',
  timestamp: 1706400000,
  message: 'Update budget total'
}

// Maps to:
{
  timeBox: {
    id: 'abc123',
    eventIndex: 42,
    faces: {
      identity: 'user:alice',
      // ... from .relay/envelope.json
    }
  }
}
```

---

## Universal Import: Relay as Truth Substrate

### Core Invariant

> **Relay should be able to receive, understand, interpret, and render all files ever created from any system.**

This is not a feature—this is Relay's **purpose**. Relay serves as the **universal computational substrate** that can represent any reality, from any source, as filaments.

---

### What Can Be Imported?

**Every system stores truth:**
- **Excel/CSV**: Spreadsheets → cell edit history as commits
- **Git repos**: Code → file edits as semantic operations
- **SQL databases**: Tables → row lifecycle as filaments
- **Active Directory**: Org structure → user/group changes over time
- **Docker/Kubernetes**: Containers → lifecycle + resource usage
- **File systems**: Files → edit history with metadata
- **CAD files**: Design → geometry changes over time
- **Media files**: Video/audio → edit sequences preserved

**Relay's job:** Ingest all of these and represent them as **filaments** with full history, evidence, and governance.

---

### Import Adapters

Each system type has an **import adapter** that:
1. **Parses** the source format
2. **Extracts** semantic operations (not raw bytes)
3. **Constructs** filament commits
4. **Attaches** evidence pointers
5. **Preserves** full history (lossless)

**Example (Excel → Filament):**
```javascript
// Import Excel file
const excelData = parseExcel('budget.xlsx');

// Create filament per sheet
for (const sheet of excelData.sheets) {
  const filament = createFilament(`excel:${sheet.name}`);
  
  // Each cell edit history → commits
  for (const cellHistory of sheet.cellHistories) {
    appendCommit(filament, {
      op: 'CELL_EDIT',
      locus: `${sheet.name}:${cellHistory.address}`,
      payload: {
        value: cellHistory.value,
        formula: cellHistory.formula
      },
      evidence: {
        source: 'excel',
        originalFile: 'budget.xlsx'
      }
    });
  }
}

// Result: Excel is now a native Relay filament
// - Render as 3D workflow view (see cell edit history)
// - Render as spreadsheet (projection lens)
// - Replay edits (playback motor)
```

---

### Three Types of Import

#### 1. Forensic Import (Past Truth)
Import historical data from legacy systems.

**Example:** Import 10 years of Excel budgets → filaments with full commit history

#### 2. Live Import (Current Truth)
Continuously sync with live systems.

**Example:** Live sync with SQL database → changes become commits in real-time

#### 3. Bidirectional Sync (Relay as Authority)
Relay becomes the source of truth, writes back to legacy systems.

**Example:** Edit procurement filament in Relay → sync back to ERP as PO

---

### Lossless Representation

**Non-Negotiable Rule:**
> Import must be lossless—every historical state, every operation, every piece of metadata is preserved as commits or evidence.

**Why:**
- Relay is truth substrate, not lossy cache
- Audit trails require complete history
- Replay must be exact

---

### Import Evidence

Every import carries **evidence:**
```javascript
evidence: {
  source: 'git',                    // System type
  originalId: 'abc123def456',       // Git commit hash
  importTimestamp: 1738001234567,   // When imported
  importedBy: 'system',             // Who triggered
  adapter: 'GitImportAdapter@1.0.0', // Adapter version
  checksum: 'sha256:9f86d081...',   // Hash of source
  sourceMetadata: {
    repo: 'https://github.com/user/repo.git',
    branch: 'main',
    author: 'alice'
  }
}
```

---

### Rendering Imported Filaments

Once imported, filaments are **native Relay truth objects**:
- **Workflow view**: See commit history as TimeBoxes
- **Spreadsheet view**: Current state as projection
- **Globe view**: Aggregate frontiers
- **Topology lens**: Dependencies as rays
- **Playback motor**: Replay history

**No distinction** between "native" and "imported" filaments—all are treated identically.

---

### Real-World Use Cases

**1. Migrate from Excel to Relay**
- Import 10 years of budget spreadsheets
- Preserve full cell edit history
- Render as auditable filament timeline

**2. Import Git Repo for Code Review**
- Import open-source project
- Render codebase as 3D filaments with dependencies
- Visualize function rename impact

**3. Audit Active Directory Changes**
- Import AD change log
- Render org structure with temporal permission changes
- Answer: "Who had Admin rights on 2025-06-15?"

---

### The One-Sentence Lock

> **Relay is not "another system"—it is the universal truth substrate that can receive, understand, interpret, and render any reality from any source as inspectable, governed filaments.**

---

**See Also:**
- [Universal Import Spec](UNIVERSAL-IMPORT-SPEC.md) (Full technical guide)
- [Cybersecurity Model](CYBERSECURITY-MODEL-SPEC.md) (Security implications)
- [Code as Filaments](CODE-AS-FILAMENTS-SPEC.md) (Git import as example)

---

## Frequently Asked Questions

### General

**Q: Why "filament"?**  
A: A filament is a continuous thread (like a fiber-optic strand). It represents **identity persistence** over time—same entity, evolving through commits.

**Q: Is this just a fancy Git graph?**  
A: Conceptually similar, but **filaments add semantic geometry**: TimeBox faces, glyphs, Y-axis meaning, 3D spatial reasoning. You can audit causality by shape alone.

**Q: Do I need to learn new tools?**  
A: No. If you can use a spreadsheet or watch a video timeline, you can use filaments. The UI is familiar; the underlying model is rigorous.

### Visualization

**Q: Why cubes for TimeBoxes?**  
A: Cubes have **6 faces**, which map to **6 semantic dimensions** (+X output, -X input, +Y meaning, -Y magnitude, +Z identity, -Z evidence). Shape encodes meaning.

**Q: Why glyphs instead of labels?**  
A: **Shape survives localization, translation, and cultural differences.** A SPLIT glyph (Y-junction) means "fork" in any language.

**Q: Can I customize glyph appearance?**  
A: Yes, via **theme voting**. Themes change presentation (colors, styles) but never semantics (glyph meanings are locked).

### Technical

**Q: How do filaments scale?**  
A: **Level-of-detail (LOD)**: Far away = simple tubes. Near = detailed TimeBoxes + glyphs. Globe view = aggregated frontiers.

**Q: What if a filament has 10,000 commits?**  
A: **Workflow view** shows all (with culling). **Globe view** collapses to frontier. **Spreadsheet view** shows latest only. Use playback to navigate history.

**Q: Can filaments branch?**  
A: Yes! **SPLIT glyph** = fork. **SCAR glyph** = merge. Branches are **competing proposals** until one is adopted.

### Governance

**Q: Who decides what glyphs mean?**  
A: **Locked in the canonical model** (this doc + CANONICAL-MODEL.md). Glyph semantics are **not governable** (they're substrate language). Only visual themes are votable.

**Q: Can I create new glyph types?**  
A: Not yet. The **8 canonical glyphs** are sufficient for most operations. Future extensions would require community consensus.

**Q: What if my organization has custom operations?**  
A: **Compose existing glyphs**. Example: "Approve & Encrypt" = GATE + TWIST. Don't invent new primitives unless absolutely necessary.

---

## Conclusion

The **Filament System** is Relay's answer to the question:

> "How do you make truth visible, inspectable, and verifiable without relying on UI, authors, or narration?"

By encoding truth **as geometry**:
- ✅ **Causality is reconstructible** (inspect TimeBoxes, trace glyphs)
- ✅ **History is preserved** (filaments persist through time)
- ✅ **Authority is explicit** (X-axis = event order)
- ✅ **Magnitude is lens-dependent** (Y-axis changes with lens)
- ✅ **Eligibility is spatial** (Z-axis = co-presence)
- ✅ **Operations are visual** (glyphs = semantic shapes)

Filaments are **not metaphors**—they are **the substrate**. Everything in Relay (votes, edits, proposals, audits) is a filament.

---

**See Also:**
- [Canonical Filament Model](../../src/frontend/components/filament/CANONICAL-MODEL.md) (Technical Reference)
- [User Sphere Model](USER-SPHERE-MODEL.md) (Personal Lenses)
- [Presence + Permission Model](PRESENCE-PERMISSION-MODEL.md) (Multi-Party Inspectability)
- [Git-Native Truth Model](../TECHNICAL/GIT-NATIVE-TRUTH-MODEL.md) (Backend Architecture)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Reference*  
*Version: 1.0.0*
