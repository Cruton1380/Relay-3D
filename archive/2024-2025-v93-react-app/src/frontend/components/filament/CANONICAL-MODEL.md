# RELAY FILAMENT SYSTEM — CANONICAL MODEL

**Version**: 1.0.0  
**Status**: Canonical Reference  
**Last Updated**: 2026-01-27

---

## I. THE ONE-SENTENCE MODEL

> **Relay represents truth as discrete, inspectable events (commits) embedded in real time, rendered as persistent filaments whose geometry encodes causality, magnitude, and eligibility — and whose playback reveals history without fabricating continuity.**

Everything below obeys this sentence.

---

## II. THE AXES (FINAL, STABLE)

### **X — Event Order (Structural Time)**
- Discrete
- Commit → commit
- Never continuous
- Never scaled by duration
- **Authority axis**
- This is the filament spine

### **Y — Magnitude (Lens-dependent)**
- Vote count
- Vote momentum
- Disagreement
- Impact
- Confidence
- Cost
- Risk

**Critical**: Y never means the same thing globally. Y is defined by the active **lens**.

### **Z — Co-presence / Eligibility**
- Geography
- Jurisdiction
- Organization
- Trust boundary
- Access scope

**Critical**: Z determines **who can interact**, not **what happened**.

---

## III. TIME (THE CORRECT FINAL MODEL)

There are **three time layers**, and they never collapse.

### **1. Event Time (Truth)**
- Encoded by X
- Only commits create geometry
- Time Boxes exist only here

### **2. Physical / Clock Time (Context)**
- Continuous
- Irregular
- Stored as metadata
- Controls spacing between Time Boxes
- Can be visualized or collapsed

### **3. Playback Time (Navigation)**
- Pause / play
- Speed
- Step
- Live tail

**Rule**: Time is a medium, not the structure.

---

## IV. THE GLOBE VIEW (CRITICAL)

### **What the globe actually is**

The globe is a **Z-projection + Y-motion view**.

It is **NOT**:
- A timeline
- A history view
- A computation view

It answers:
> **"Where are truths allowed to act, and how much force do they currently have?"**

### **Filaments on the globe**

On the globe:
- **Filaments are COLLAPSED along X** (history folded)
- **Current frontier state** is what's rendered
- History exists, but is folded
- Each filament becomes a **vertical branch** anchored to a geographic region

### **Branch Elevation (Vote-Driven Y)**

**This is where democratic force becomes visible.**

- **Height = vote magnitude** (or lens-defined magnitude)
- Height is **not** cumulative history
- Height is **current belief strength**

Examples:
- Net votes
- Vote momentum
- Confidence score
- Consensus delta

Branches:
- **Rise** when support increases
- **Fall** when votes are revoked
- **Oscillate** during contention
- **Flatten** during inactivity

This makes **democratic force visible**, not just results.

### **Live Motor Behavior on the Globe**

When **Play** is active:
- Commits arrive **discretely**
- Branch height updates **at commit boundaries**
- Ambient signals stream continuously
- Pulses indicate activity density
- Regions "breathe" based on live engagement

**Nothing lies**:
- No continuous growth without commits
- No smoothing that invents belief

---

## V. ZOOM TRANSITIONS (HOW WE MOVE THROUGH SCALE)

### **Globe → Region → Industry → Company**
- **Z unfolds** (eligibility refines)
- **X still collapsed**
- **Y still dominant**
- Camera remains elevated, slightly oblique

**Purpose**: Identify where authority is forming

### **Company → Department → Workflow**

**This is the pivot.**

- **Camera rotates**
- **X becomes horizontal and readable**
- **Y becomes measurable**
- **Z collapses** unless explicitly needed

**Purpose**: Understand how belief was produced

---

## VI. WORKFLOW / FILAMENT SPACE (NATIVE TRUTH VIEW)

Here:
- Filaments are fully visible
- Time Boxes appear
- Glyphs appear
- Splits, scars, gates, twists are readable

This answers:
> **"What happened, in what order, and why does the system believe this?"**

This is where:
- Excel is explained
- Git is explained
- ETL is explained
- Audits happen

---

## VII. SPREADSHEET VIEW (EXCEL WITHOUT LYING)

### **What a cell is**

A cell = the **+X face** of the **latest Time Box**.

### **What Excel hides (Relay shows)**

- −X dependencies
- Prior states
- Discarded rows
- Filters
- Joins
- Conversions
- Corrections

### **In Relay**

- Spreadsheet is a projection
- Filaments exist behind the grid
- Clicking rotates into filament space

This lets you:
- Watch formulas happen
- Play history
- See inactivity
- See corrections as scars

---

## VIII. TIME-WEIGHTED VS EVENT-NORMALIZED VIEWS

Both are valid. They answer different questions.

### **Event-Normalized**
- Equal spacing
- Pure causality
- Ideal for audit & disputes

### **Time-Weighted**
- Real gaps visible
- Bursts visible
- Inactivity visible
- Great for ops, fraud, compliance

**Rule**: Time never creates geometry — it only spaces geometry.

---

## IX. HIDING & COLLAPSING (WITHOUT LYING)

### **You may hide:**
- Z boundaries
- Labels
- Entire filaments
- Intermediate Time Boxes

### **You may NOT hide:**
- Order
- Splits
- Scars
- Root evidence
- Existence of events

**Relay never deletes truth — only folds it.**

---

## X. REAL-WORLD USAGE SCENARIOS

### **1. National / Regional Voting**
- Globe shows rising/falling consensus by region
- Vote revocations visibly lower branches
- Playback shows how belief formed
- Auditors can rotate into workflows

**Replaces**: Black-box tallies, delayed recounts, opaque election reporting

### **2. Corporate Decision-Making**
- Board proposals as filaments
- Votes weighted by role
- Branch height = support
- History shows amendments, reversals, compromises

**Replaces**: Meeting minutes, email threads, "who said what when" arguments

### **3. Financial Audits**
- Transactions as filaments
- Spreadsheet views become inspectable
- Time-weighted view shows dormant periods
- Sudden bursts become obvious

**Replaces**: Trust in static reports, unverifiable Excel models

### **4. Regulatory Compliance**
- Policies as filaments
- Changes visible as scars
- Delays between action and enforcement visible
- No retroactive rewriting

**Replaces**: PDF policy dumps, unverifiable attestations

### **5. Data Pipelines / ETL**
- Each row is a filament
- Filters are gates
- Joins are scars
- KPIs split as derived filaments

**Replaces**: Opaque BI dashboards, "trust me" analytics

### **6. Scientific Research**
- Experiments as filaments
- Negative results preserved
- Inactivity visible
- Corrections scar, not overwrite

**Replaces**: Cherry-picked graphs, unverifiable result chains

### **7. AI / Model Governance**
- Model versions as filaments
- Training data gates visible
- Fine-tuning scars visible
- Drift over time observable

**Replaces**: Undocumented model updates, silent regressions

---

## XI. WHY THIS SYSTEM IS HARD TO UNSEE

Once someone sees:
- Votes as **force**, not counts
- Time as **context**, not axis
- Spreadsheets as **projections**
- History as **geometry**

**Every existing system starts to look dishonest by omission.**

---

## XII. FINAL INVARIANT (THE ONE YOU TEST EVERYTHING AGAINST)

> **If you pause the motor, strip away UI, and freeze the camera, the remaining geometry must still allow an independent auditor to reconstruct what happened, in what order, and with what authority.**

If that holds, the system works.

---

## XIII. IMPLEMENTATION NOTES

### **Filament Renderer Must Support TWO MODES:**

#### **Mode A: Globe/Branch Mode (Vertical, X-collapsed)**
- Render filament as **vertical cylinder**
- Y position = current vote magnitude (latest Time Box)
- Animates up/down as votes change
- No glyphs visible
- No Time Box history visible
- Shows: location (Z) + strength (Y) + live motion

#### **Mode B: Workflow Mode (Horizontal, X-expanded)**
- Render filament as **horizontal pipe along X**
- All Time Boxes visible
- All glyphs visible
- Splits, scars, gates readable
- Full history inspectable

### **Camera Transitions**
- **Globe**: Elevated view, looking down at Z-surface, Y = vertical
- **Workflow**: Side view, X = horizontal (left→right), Y = up/down magnitude
- **Spreadsheet**: Perpendicular to +X face (looking at values)

### **Vote-Driven Animation**
- Branches update height **at commit boundaries only**
- Interpolation between states for smooth motion (easing)
- No continuous growth without discrete commits

---

**This document is the canonical reference. All implementation decisions must be traceable back to these invariants.**
