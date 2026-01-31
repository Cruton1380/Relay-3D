# architecture@c16 — Commit Materiality & Context Evidence

**Status**: LOCKED  
**Commit**: c16  
**Date**: 2026-01-31  
**Supersedes**: None (new behavioral layer)  
**Depends On**: c14 (Surface Coordination Geometry), c1-c3 (Filament Physics)

---

## Purpose

This document defines **when actions become commits** and **how context is preserved** as evidence. It solves the tension between:
- Natural workflow (undo, experimentation, drafting)
- Historical integrity (append-only, no silent erasure)

**This is NOT:**
- Opinion about workflow
- User preference
- Arbitrary policy

**This IS:**
- Mechanical threshold system (testable)
- Evidence preservation protocol (forensic)
- Behavioral physics (how work becomes canon)

---

## 1. The Behavioral Discovery

### **1.1 Context Snapshot Insight**

**User behavior observed:**
> "I deleted something from a location and I left a screenshot of what it was before I removed it instead. This is the exact nature of commits to branches. A screenshot of the thing before it was changed and where it was in relation to everything else is what records the history."

**Translation to Relay:**

When you delete/move/change something, you intuitively preserved:
- **What it was** (content)
- **Where it was** (location)
- **What it was next to** (relations/context)

**This is NOT just "save old version."**  
**This is "preserve spatial + relational context."**

### **1.2 Materiality Threshold Insight**

**User behavior observed:**
> "I just made a commit and after a few seconds I realized I did not want it. So instead of deletion, I did Ctrl+Z to undo it. There is no record. In Relay, there should be no record of a commit if it's not a material enough time that a user was devoted to it and maintained it as canon."

**Translation to Relay:**

Not every action is a commit.  
A change becomes a commit only when it crosses a **materiality threshold**:
- Time held (maintained for N seconds/minutes)
- Interaction cost (number of actions)
- Risk class (high-risk commits sooner)
- Visibility scope (shared work commits sooner)
- Dependency count (more dependents = lower threshold)

**Before threshold = draft (undoable, no record)**  
**After threshold = commit (canonical, append-only)**

---

## 2. Core Principle

**Relay distinguishes draft from canon.**

### **2.1 Canonical Statement**

> **"Relay distinguishes draft from canon: drafts can be undone without history, but once a change crosses materiality and becomes a commit, it is append-only and may only be countered by a new revert/scar commit. Destructive edits must include a 'before' context snapshot anchored to location."**

This is now **LOCKED.**

### **2.2 Why This Matters**

**Without this distinction:**
- Every keystroke becomes history (noise)
- OR silent erasure is allowed (violates physics)

**With this distinction:**
- Natural workflow (draft freely, undo allowed)
- Historical integrity (commits are append-only)
- Evidence preserved (context snapshots at commit)

---

## 3. States of Work

### **3.1 The Five States**

```
DRAFT → HOLD → PROPOSE → COMMIT → (REVERT)
  ↑                                    ↓
  └──────────── undo allowed ──────────┘
                                (new commit)
```

#### **State 1: DRAFT (Ephemeral)**

**Properties**:
```javascript
draft = {
  status: "ephemeral",
  recorded: false,
  visible: "local_only",
  undoable: true,
  persistent: false,
  evidence: "none_required",
  
  meaning: "Private exploration, not yet real"
}
```

**User actions allowed**:
- Edit freely
- Undo/redo (Ctrl+Z / Ctrl+Y)
- Discard without trace
- Experiment without commitment

**No record. No history. No evidence.**

#### **State 2: HOLD (Staged)**

**Properties**:
```javascript
hold = {
  status: "staged",
  recorded: "local_intent",
  visible: "local_only",
  undoable: true,
  persistent: "until_discarded",
  evidence: "context_snapshot_captured",
  
  meaning: "Freezes state, captures context for potential commit"
}
```

**What happens**:
1. User signals "this might be real" (e.g., git add, Save As)
2. System captures **context snapshot**:
   - What changed (diff)
   - Where it changed (location)
   - Relations (what it's connected to)
   - Timestamp (when frozen)
3. State held in staging area
4. Can still be undone/discarded

**Context snapshot captured, but not yet canonical.**

#### **State 3: PROPOSE (Intent Recorded)**

**Properties**:
```javascript
propose = {
  status: "proposed",
  recorded: "intent_logged",
  visible: "ring_scoped",
  undoable: "only_via_cancel",
  persistent: true,
  evidence: "context_snapshot_attached",
  
  meaning: "Proposed commit, awaiting reconciliation"
}
```

**What happens**:
1. Materiality threshold crossed (see Section 4)
2. Proposed commit created:
   - Has unique ID
   - Has context snapshot
   - Has author + timestamp
   - Visible to ring members
3. Awaiting reconciliation (vote/consensus)
4. Can be cancelled (explicit action, logged)

**Intent is now recorded. Cancellation leaves trace.**

#### **State 4: COMMIT (Canonical)**

**Properties**:
```javascript
commit = {
  status: "canonical",
  recorded: "permanent",
  visible: "ring_and_descendants",
  undoable: false,
  persistent: true,
  evidence: "context_snapshot_permanent",
  
  meaning: "Append-only history, part of canonical timeline"
}
```

**What happens**:
1. Reconciliation complete (vote threshold met)
2. Commit merged into canonical filament
3. Context snapshot becomes permanent evidence
4. Scar recorded (merge event)
5. Cannot be undone (only reverted via new commit)

**This is append-only spacetime. No silent erasure.**

#### **State 5: REVERT (Counter-Commit)**

**Properties**:
```javascript
revert = {
  status: "canonical",           // Revert IS a commit
  recorded: "permanent",
  visible: "ring_and_descendants",
  undoable: false,
  persistent: true,
  evidence: "revert_justification_required",
  
  meaning: "New commit that counters effects, not history"
}
```

**What happens**:
1. User wants to "undo" a canonical commit
2. Cannot erase history (physics violation)
3. Instead: Create revert commit
4. Revert commit:
   - Points to original commit
   - Explains why reverted
   - Applies opposite changes
   - Creates new scar
5. Both commits remain visible forever

**History is never erased. Mistakes are visible.**

---

## 4. Materiality Threshold (When Draft Becomes Commit)

### **4.1 The Problem**

**Not every action should be a commit.**

If every keystroke is a commit → history becomes noise.  
If no threshold exists → users bypass it → silent erasure returns.

**Solution**: Mechanical threshold based on measurable properties.

### **4.2 Threshold Dimensions**

**A change crosses materiality threshold when ANY of these conditions met:**

#### **Dimension 1: Time Held (Temporal Materiality)**

```javascript
timeThresholds = {
  privateDraft: {
    threshold: "never",           // Can draft forever
    rationale: "Private work, no coordination impact"
  },
  
  sharedBranch: {
    threshold: "5_minutes",       // After 5 min of edits
    rationale: "Others might depend, needs stability"
  },
  
  productionBranch: {
    threshold: "30_seconds",      // Very fast
    rationale: "High risk, commits sooner"
  },
  
  measurement: "time_since_last_save_or_edit"
}
```

**Interpretation**:
- Private draft → No time threshold (can undo forever)
- Shared work → 5 minutes of maintained edits → becomes proposed commit
- Production → 30 seconds → immediate commit (high risk)

#### **Dimension 2: Interaction Cost (Action Materiality)**

```javascript
actionThresholds = {
  keystrokes: {
    threshold: "100_actions",     // Significant effort
    rationale: "User invested time, likely intentional"
  },
  
  destructive: {
    threshold: "1_action",        // Immediate
    rationale: "Delete/move requires evidence"
  },
  
  create: {
    threshold: "10_actions",      // Create + some edits
    rationale: "Prove it's not accidental"
  }
}
```

**Interpretation**:
- 100 keystrokes → Significant work, becomes proposed commit
- 1 delete action → Immediate evidence capture (context snapshot)
- 10 actions on new file → Proves intent, becomes proposed commit

#### **Dimension 3: Risk Class (Domain Materiality)**

```javascript
riskThresholds = {
  low: {
    domains: ["documentation", "tests", "examples"],
    threshold: "10_minutes",
    rationale: "Low coordination risk, can draft longer"
  },
  
  medium: {
    domains: ["features", "refactoring", "ui"],
    threshold: "5_minutes",
    rationale: "Moderate risk, standard threshold"
  },
  
  high: {
    domains: ["security", "auth", "finance", "data"],
    threshold: "30_seconds",
    rationale: "High risk, commit immediately"
  },
  
  critical: {
    domains: ["encryption_keys", "secrets", "production_config"],
    threshold: "immediate",
    rationale: "No drafting, every change is canonical"
  }
}
```

**Interpretation**:
- Documentation → 10 min draft time
- Features → 5 min draft time
- Security code → 30 sec draft time
- Secrets → No draft (immediate commit)

#### **Dimension 4: Visibility Scope (Social Materiality)**

```javascript
visibilityThresholds = {
  private: {
    threshold: "never",           // Can draft forever
    rationale: "No one else affected"
  },
  
  sharedTeam: {
    threshold: "5_minutes",
    rationale: "Team might depend"
  },
  
  crossTeam: {
    threshold: "2_minutes",
    rationale: "Multiple teams affected"
  },
  
  public: {
    threshold: "immediate",
    rationale: "External dependencies"
  }
}
```

**Interpretation**:
- Private branch → No time threshold
- Shared team branch → 5 min
- Cross-team coordination → 2 min
- Public API → Immediate commit

#### **Dimension 5: Dependency Count (Structural Materiality)**

```javascript
dependencyThresholds = {
  noDependents: {
    threshold: "10_minutes",
    rationale: "No one depends, can draft"
  },
  
  fewDependents: {
    count: "1-5",
    threshold: "5_minutes",
    rationale: "Some coordination needed"
  },
  
  manyDependents: {
    count: "6-20",
    threshold: "2_minutes",
    rationale: "High coordination risk"
  },
  
  critical: {
    count: ">20",
    threshold: "immediate",
    rationale: "Too many dependents to draft"
  }
}
```

**Interpretation**:
- Leaf node (no dependents) → 10 min draft
- Few dependents → 5 min
- Many dependents → 2 min
- Critical dependency (>20 dependents) → Immediate commit

### **4.3 Threshold Combination Rule**

**A change becomes a proposed commit when:**

```
ANY threshold is crossed (logical OR)

IF (time_held > threshold_for_context)
OR (actions > threshold_for_context)
OR (risk_class == high/critical)
OR (visibility == public)
OR (dependents > threshold_for_context)
THEN
  state := PROPOSE
  capture_context_snapshot()
  log_intent()
  await_reconciliation()
```

**Shortest threshold wins (most conservative).**

### **4.4 User Override (Explicit Commit)

**User can always force commit early:**

```javascript
userActions = {
  explicitCommit: {
    command: "commit_now",        // User says "this is ready"
    effect: "bypass_all_thresholds",
    evidence: "context_snapshot_required",
    justification: "optional_but_recommended"
  },
  
  hold: {
    command: "stage_changes",     // User says "freeze this"
    effect: "enter_HOLD_state",
    evidence: "context_snapshot_captured",
    persistent: "until_discarded"
  }
}
```

**User can commit anytime (bypasses thresholds).**  
**But cannot avoid context snapshot requirement.**

---

## 5. Context Snapshots (Spatial Evidence)

### **5.1 What Is a Context Snapshot?**

**A context snapshot captures:**
1. **What** (content before change)
2. **Where** (location in structure)
3. **Relations** (what it was connected to)
4. **When** (timestamp)
5. **Who** (author/agent)

**This is NOT just "save old version."**  
**This is "forensic chamber" — complete spatial context.**

### **5.2 When Snapshots Are Required**

**Context snapshots are REQUIRED for:**

```javascript
snapshotRequirements = {
  destructive: {
    actions: ["delete", "move", "rename"],
    rationale: "Must preserve 'what was there'",
    required: "always"
  },
  
  proposed: {
    actions: ["propose_commit"],
    rationale: "Evidence for reconciliation",
    required: "always"
  },
  
  canonical: {
    actions: ["commit"],
    rationale: "Permanent evidence",
    required: "always"
  },
  
  optional: {
    actions: ["draft", "edit"],
    rationale: "Can undo without evidence",
    required: "never"
  }
}
```

**Rule**: Any action that becomes canonical MUST have context snapshot.

### **5.3 Snapshot Content**

```javascript
contextSnapshot = {
  // What
  contentBefore: "<full_content_or_hash>",
  contentAfter: "<full_content_or_hash>",
  diff: "<unified_diff>",
  
  // Where
  location: {
    filePath: "/src/components/Button.tsx",
    lineRange: [42, 67],
    branchId: "feature/new-button",
    ringId: "acme.engineering.ui"
  },
  
  // Relations
  relations: {
    imports: ["react", "./styles"],
    importedBy: ["App.tsx", "Dashboard.tsx"],
    dependencies: ["button.css"],
    dependents: ["Form.tsx"]
  },
  
  // When
  timestamp: "2026-01-31T14:23:00Z",
  
  // Who
  author: {
    agentId: "alice",
    ringMembership: ["acme.engineering"],
    authority: "vote_weight_0.8"
  },
  
  // Evidence type
  evidenceType: "context_snapshot",
  capturedAt: "HOLD",           // State when captured
  attachedTo: "commit-abc123"   // Which commit
}
```

### **5.4 Snapshot Storage**

**Where snapshots live:**

```javascript
snapshotStorage = {
  format: "git_blob",              // Reuse Git's object storage
  location: ".relay/snapshots/",
  naming: "<commit_id>_before.json",
  compression: "optional",
  encryption: "ring_scoped",       // Encrypted at basin boundary
  
  retention: {
    draft: "discarded_on_undo",
    proposed: "kept_until_committed_or_cancelled",
    committed: "permanent"
  }
}
```

**Snapshots are evidence objects, stored like Git blobs.**

### **5.5 Visual Snapshot (Your Screenshot Behavior)**

**For visual/UI changes:**

```javascript
visualSnapshot = {
  type: "rendered_frame",
  format: "png",
  location: ".relay/snapshots/visual/<commit_id>_before.png",
  metadata: {
    viewport: { width: 1920, height: 1080 },
    timestamp: "2026-01-31T14:23:00Z",
    component: "Button",
    state: { hover: false, disabled: false }
  },
  
  attachedTo: "commit-abc123"
}
```

**Your screenshot behavior IS the correct model.**  
**We automate it for code/data changes.**

---

## 6. Undo vs Revert (The Critical Distinction)

### **6.1 The Problem**

**Users expect "Ctrl+Z" to work.**  
**But Relay requires append-only history.**

**How to reconcile?**

### **6.2 The Solution: State-Dependent Behavior**

```javascript
undoRules = {
  DRAFT: {
    action: "undo",
    mechanism: "rewind_local_state",
    recorded: false,
    evidence: "none",
    message: "Change undone (no record)"
  },
  
  HOLD: {
    action: "undo",
    mechanism: "discard_staged_changes",
    recorded: "local_log_only",
    evidence: "snapshot_discarded",
    message: "Staged changes discarded"
  },
  
  PROPOSE: {
    action: "cancel",              // NOT undo
    mechanism: "create_cancel_intent",
    recorded: true,
    evidence: "cancellation_logged",
    message: "Proposed commit cancelled (recorded)"
  },
  
  COMMIT: {
    action: "revert",              // NOT undo
    mechanism: "create_revert_commit",
    recorded: true,
    evidence: "revert_justification_required",
    message: "Commit reverted (new scar created)"
  }
}
```

### **6.3 User-Facing Behavior**

**When user presses Ctrl+Z:**

```
IF state == DRAFT:
  → Undo immediately (no record)
  
ELSE IF state == HOLD:
  → Discard staged changes (local log only)
  
ELSE IF state == PROPOSE:
  → Show dialog: "This is a proposed commit. Cancel it? (will be recorded)"
  → If yes: Create cancellation record
  
ELSE IF state == COMMIT:
  → Show dialog: "This is canonical history. Cannot undo. Create revert commit?"
  → If yes: Create revert commit (with justification)
```

**Ctrl+Z behavior adapts to state.**  
**User always gets "undo-like" behavior.**  
**But physics is preserved.**

### **6.4 Revert Commit Structure**

```javascript
revertCommit = {
  type: "revert",
  id: "commit-xyz789",
  reverts: "commit-abc123",       // Points to original
  reason: "User provided justification",
  author: "alice",
  timestamp: "2026-01-31T14:30:00Z",
  
  changes: {
    // Opposite of original commit
    diff: "<inverted_diff>",
    contextSnapshot: "<revert_snapshot>"
  },
  
  evidence: {
    originalCommit: "commit-abc123",
    originalSnapshot: "<original_snapshot>",
    revertJustification: "Feature caused performance regression"
  },
  
  visibility: "permanent",        // Never hidden
  scar: "merge_scar_456"          // Creates new scar
}
```

**Revert is a new commit.**  
**Original commit remains visible.**  
**Both are permanent scars.**

---

## 7. Implementation

### **7.1 Workflow Example (Complete)**

```
1. User types in editor
   State: DRAFT
   Record: None
   Undo: Immediate (no trace)

2. User continues for 3 minutes
   State: DRAFT (threshold not crossed yet)
   Record: None

3. 5 minutes pass (time threshold for shared branch)
   State: PROPOSE (automatic transition)
   Record: Intent logged + context snapshot captured
   Undo: Must cancel (recorded)

4. User realizes mistake, presses Ctrl+Z
   Dialog: "This is a proposed commit. Cancel? (recorded)"
   User: Yes
   State: CANCELLED (special state)
   Record: Cancellation logged
   Effect: Changes discarded, cancellation visible

5. User starts new work
   State: DRAFT
   Record: None
   Undo: Immediate
```

**OR (if not caught early):**

```
3. 5 minutes pass → PROPOSE state
4. Reconciliation completes → COMMIT state
5. User realizes mistake
   Presses Ctrl+Z
   Dialog: "Canonical history. Create revert commit?"
   User: Yes, provides reason
   State: New REVERT commit created
   Record: Both commits visible forever
   Effect: Changes undone, but history intact
```

### **7.2 API Integration**

```javascript
// Relay API for commit states
GET /api/commits/:id/state
Response: {
  commitId: "abc123",
  state: "PROPOSE",
  materialityMetrics: {
    timeHeld: "5m 23s",
    actions: 67,
    riskClass: "medium",
    visibility: "shared_team",
    dependents: 3
  },
  thresholdCrossed: ["time_held"],
  canUndo: false,              // Must cancel
  canCancel: true,
  evidence: {
    contextSnapshot: "/snapshots/abc123_before.json"
  }
}

// User action: Attempt undo
POST /api/commits/:id/undo
Request: { justification: "optional" }
Response: {
  action: "cancel",            // State-dependent
  recorded: true,
  message: "Proposed commit cancelled (recorded)",
  cancellationId: "cancel-xyz"
}
```

### **7.3 UI Indicators**

```javascript
// Visual indicators for each state
stateIndicators = {
  DRAFT: {
    icon: "✏️ Draft",
    color: "gray",
    message: "Changes not saved. Can undo anytime."
  },
  
  HOLD: {
    icon: "📌 Staged",
    color: "yellow",
    message: "Changes staged. Context snapshot captured."
  },
  
  PROPOSE: {
    icon: "🔄 Proposed",
    color: "orange",
    message: "Awaiting reconciliation. Cancellation will be recorded."
  },
  
  COMMIT: {
    icon: "✅ Committed",
    color: "green",
    message: "Canonical history. Can only revert (creates new commit)."
  },
  
  REVERT: {
    icon: "↩️ Reverted",
    color: "red",
    message: "Revert commit. Both commits remain visible."
  }
}
```

---

## 8. Integration with Existing Architecture

### **8.1 Relation to c14 (Surface Coordination Geometry)**

**From c14**: Rings, cores, radial reconciliation

**c16 adds**: When changes enter rings (materiality threshold), how evidence is preserved (context snapshots)

**Coupling**:
- Private branches (outside rings) → No time threshold (draft forever)
- Shared branches (within rings) → Time threshold (5 min default)
- Core reconciliation → Context snapshot required (evidence for vote)

### **8.2 Relation to Filament Physics (c1-c3)**

**From c1-c3**: Filaments are append-only

**c16 adds**: How work enters filaments (via materiality threshold), what gets appended (commits with context snapshots)

**Coupling**:
- DRAFT → Not in filament (local only)
- PROPOSE → Intent recorded (not yet canonical)
- COMMIT → Appended to filament (permanent)
- REVERT → New filament entry (counters previous)

### **8.3 Relation to Pressure System (c15)**

**From c15**: Pressure management, graceful degradation

**c16 adds**: Pressure triggers materiality (high load → shorter thresholds), evidence supports confidence (context snapshots improve three-way match)

**Coupling**:
- High pressure → Lower materiality thresholds (commit faster)
- Context snapshots → Improve confidence (ERI calculation)
- Revert commits → Create pressure (reconciliation needed)

---

## 9. Governance

### **9.1 Threshold Configuration**

**Thresholds are governable (not hardcoded):**

```javascript
// Ring-level configuration
ringConfig = {
  ringId: "acme.engineering",
  materialityThresholds: {
    privateDraft: "never",
    sharedBranch: "5_minutes",      // Can be tuned
    productionBranch: "30_seconds",
    
    riskClassOverrides: {
      security: "immediate",         // Stricter for security
      documentation: "10_minutes"    // Looser for docs
    }
  },
  
  governance: {
    canModify: ["ring_authority"],
    proposalRequired: true,
    votingThreshold: 0.66
  }
}
```

**Each ring can tune thresholds.**  
**But must follow proposal + vote process.**

### **9.2 Evidence Requirements**

**Context snapshot requirements are LOCKED (not governable):**

```javascript
evidenceRules = {
  destructive: "always_required",    // LOCKED
  proposed: "always_required",       // LOCKED
  committed: "always_required",      // LOCKED
  
  format: "governable",              // Can choose format
  compression: "governable",         // Can enable/disable
  retention: "partial_governable"    // Can extend, not reduce
}
```

**Evidence IS required.**  
**Format is flexible.**

---

## 10. Summary

### **10.1 What Is Now Locked**

✅ **Five states**: DRAFT → HOLD → PROPOSE → COMMIT → REVERT  
✅ **Materiality threshold**: Time, actions, risk, visibility, dependencies  
✅ **Context snapshots**: What + where + relations + when + who  
✅ **Undo vs Revert**: State-dependent (draft = undo, commit = revert)  
✅ **Evidence requirement**: Destructive/proposed/committed must have snapshot  
✅ **Threshold governance**: Ring-configurable (but evidence requirement locked)  

### **10.2 What This Enables**

✅ Natural workflow (draft freely, undo without trace)  
✅ Historical integrity (commits are append-only)  
✅ Spatial evidence (context preserved at location)  
✅ Mechanical thresholds (testable, not arbitrary)  
✅ Honest mistakes (revert visible, not hidden)  

### **10.3 What This Prevents**

❌ Silent history erasure (commits can't be undone)  
❌ Noisy history (not every keystroke is a commit)  
❌ Lost context (snapshots preserve spatial relations)  
❌ Arbitrary decisions (thresholds are mechanical)  

---

## 11. Canonical Statements (Locked)

### **Statement 1: Draft vs Canon Distinction**

> **"Relay distinguishes draft from canon: drafts can be undone without history, but once a change crosses materiality and becomes a commit, it is append-only and may only be countered by a new revert/scar commit."**

### **Statement 2: Context Evidence Requirement**

> **"Destructive edits must include a 'before' context snapshot anchored to location, capturing what was there, where it was, and what it was connected to."**

### **Statement 3: Materiality Threshold**

> **"A change becomes a commit when it crosses materiality threshold: time held, interaction cost, risk class, visibility scope, or dependency count — shortest threshold wins."**

These are now **IMMUTABLE.**

---

**Status**: LOCKED ✅  
**Next**: Implementation (Week 2-3)

---

**Last Updated**: 2026-01-31  
**Depends On**: c14 (Surface Coordination Geometry), c1-c3 (Filament Physics)  
**Related**: c15 (Pressure Management - threshold coupling)
