# Prompt Coordination Invariants

## ⚠️ THE ONE RULE TO ENGRAVE IN STONE

**"If an AI action cannot be replayed from a compiled prompt artifact, it is invalid."**

This is the prompt equivalent of:
> "If index.html doesn't point to the canonical entry, the build fails."

Everything else flows from this.

---

## Core Architecture

### The Canonical Chain

```
raw text → PROMPT_COMPILE → CompiledPromptArtifact → PROMPT_EXECUTE → result
```

**No execution is allowed without a compiled prompt artifact.**

Just like:
- Browser renders only if `index.html` points to canonical entry
- Tests run only if they reference actual test files
- Builds succeed only if imports resolve

---

## First-Class Filaments

### 1. `prompt.<promptId>` - Source Prompt

A single prompt definition across time. Edits are **commits**, not overwrites.

**Commits:**
- `PROMPT_CREATE` - Initial prompt
- `PROMPT_EDIT` - New version (append-only)
- `PROMPT_TAG` - Label as canonical/bad/gold
- `PROMPT_SNAPSHOT_SAVE` - Save known-good state
- `PROMPT_SNAPSHOT_RESTORE` - Create new head from snapshot

**Rules:**
- ✅ Exactly one active head per context
- ✅ History never rewritten
- ✅ Snapshots always create new heads
- ❌ No duplicate active heads for same context

### 2. `sequence.<sequenceId>` - Runnable Playlist

An ordered sequence of prompts that can auto-execute.

**Commits:**
- `SEQUENCE_CREATE` - Define sequence
- `SEQUENCE_ADD_STEP` - Add prompt step
- `SEQUENCE_SET_TRIGGER` - Define auto-advance trigger
- `SEQUENCE_STEP_ADVANCE` - Explicit step transition
- `SEQUENCE_ABORT` - Stop execution

**Rules:**
- ✅ Every step references a `compiledPromptRef`, not raw text
- ✅ Auto-advance requires explicit trigger (no implicit loops)
- ✅ Every advance is a commit (full audit trail)
- ❌ No hidden automation

### 3. `run.<runId>` - Execution Instance

One execution with inputs/outputs.

**Commits:**
- `PROMPT_EXECUTE` - Start execution
- `PROMPT_EXECUTE_RESULT` - Record result

**Rules:**
- ✅ Must reference `compiledPromptRef`
- ✅ Result must be stored (no ephemeral runs)
- ❌ No execution without compiled artifact

### 4. `snapshot.<snapshotId>` - Known-Good State

A blessed state you can return to.

**Commits:**
- `PROMPT_SNAPSHOT_SAVE` - Create snapshot

**Captures:**
- Exact prompt head
- Exact compiler version
- Example outputs (optional)
- Label + reason

**Rules:**
- ✅ Restore creates new head (never overwrites history)
- ✅ Snapshots are searchable first-class objects
- ❌ No implicit "favorites" or bookmarks

### 5. `merge.<mergeId>` - Merge Scar

Proof of merge + resolution decisions.

**Commits:**
- `PROMPT_BRANCH_CREATE` - Explicit new branch
- `PROMPT_BRANCH_TWICE` - Create A + B from same base
- `PROMPT_MERGE_RESOLVE` - Combine branches

**Rules:**
- ✅ Merge scar references both branch heads
- ✅ Conflict resolutions are explicit
- ✅ Merged prompt cites merge scar
- ❌ No "blended prompt mush" without audit trail

---

## CompiledPromptArtifact Schema

The "index.html" of prompt execution:

```javascript
{
  artifactId: "compiled.P123@compiler-v2",
  sourcePromptRef: "prompt.P123@v5",    // Exact source
  compilerRef: "compiler.C1@v2",         // Exact compiler
  mergeScarRef: "merge.M45" | null,      // If merged
  renderedPrompt: "...",                 // Final execution string
  metadata: {
    constraints: [...],                  // Non-negotiables
    contextRefs: [...],                  // Invariants/axes
    targetFormat: "image" | "code",      // Tool-specific
    compiledAt: 1706483200000,
  },
  refs: [                                 // All dependencies
    "prompt.P123@v5",
    "compiler.C1@v2",
    "merge.M45"
  ]
}
```

---

## Verification: `npm run verify:prompt`

Checks coordination invariants:

### Check 1: No Execution Without Compiled Artifact
- ✅ All `run.*` filaments reference `compiledPromptRef`
- ✅ Compiled prompts exist and are valid
- ✅ Compiled prompts cite `sourcePromptRef` + `compilerRef`

### Check 2: No Duplicate Active Heads
- ✅ Exactly one active prompt per context
- ❌ Multiple active heads → violation

### Check 3: Merged Prompts Have Scars
- ✅ Merged prompts reference `mergeScarRef`
- ✅ Merge scars cite both branch heads
- ✅ Conflict resolutions are explicit

### Check 4: Sequence Steps Have Triggers
- ✅ Auto-advance steps declare explicit triggers
- ✅ Steps reference `compiledPromptRef`, not raw text

### Check 5: Compiler Version Changes Are Explicit
- ⚠️  Warns if multiple compiler versions exist
- ✅ Ensures compiler changes have commits

### Check 6: Snapshots Have Complete Metadata
- ✅ Snapshots cite `promptHeadRef`
- ⚠️  Warns if `compilerRef` missing

**Exit Codes:**
- `0` = All invariants satisfied
- `1` = Violations found (execution blocked)

---

## Trigger Types (Sequence Automation)

Explicit triggers for deterministic automation:

| Trigger | When It Fires |
|---------|---------------|
| `ON_MANUAL` | User clicks "Next Step" |
| `ON_ASSISTANT_RESPONSE` | After assistant responds |
| `ON_USER_MESSAGE` | After user sends message |
| `ON_TOOL_RESULT` | After tool execution completes |
| `ON_TAG_MATCH` | Output contains specific text |
| `ON_SCHEMA_MATCH` | Output matches JSON schema |

**Rules:**
- ✅ Every trigger fires a `SEQUENCE_STEP_ADVANCE` commit
- ✅ Trigger evaluation is deterministic
- ❌ No hidden "the system decided to continue"

---

## Branch-Twice → Merge Pattern

The most powerful primitive for prompt synthesis:

### Step 1: Branch Twice
```
prompt.P0@v3  (base)
  ├─→ prompt.P0@branch/A
  └─→ prompt.P0@branch/B
```

### Step 2: Edit Independently
- Branch A: Focus on X
- Branch B: Focus on Y

### Step 3: Merge with Scar
```
PROMPT_MERGE_RESOLVE
  branchARef: prompt.P0@branch/A@v2
  branchBRef: prompt.P0@branch/B@v3
  conflicts: [
    { section: "constraints", chosenBranch: "A", reason: "..." },
    { section: "examples", chosenBranch: "B", reason: "..." }
  ]
  → merged: prompt.P0@merge/M1
```

**Result:**
- New prompt head: `prompt.P0@merge/M1`
- Merge scar: `merge.M1` (audit trail)
- Conflict resolutions are explicit
- **Fully replayable**

---

## Authority Enforcement

Operations requiring `authorityRef`:

- `SEQUENCE_SET_TRIGGER` - Automation changes execution flow
- `PROMPT_COMPILE` - Compiler version changes affect output
- `PROMPT_MERGE_RESOLVE` - Merge decisions alter prompt
- `PROMPT_SNAPSHOT_RESTORE` - Time travel changes active state

**Why:**
Prevents "some UI action" from silently altering automation without proof.

---

## Comparison: Frontend Entry Chain → Prompt Chain

| Frontend Refactor | Prompt System |
|-------------------|---------------|
| Duplicate `main.jsx` bug | Multiple implicit prompts |
| Canonical `/src/frontend/` | Canonical `prompt.*` head |
| `verify:entry` script | `verify:prompt` script |
| Pre-commit hook | Pre-execute hook |
| Archive with README | Snapshot with metadata |
| "Changes don't appear" | "Prompt drift" |
| **ONE** entry chain | **ONE** execution chain |

---

## How to Use This System

### 1. Creating a Prompt
```javascript
// 1. Create source prompt
const create = createPromptCreate({
  promptId: 'P123',
  sourceText: 'Generate a ...',
  context: 'image-generation',
  authorityRef: 'auth.user.alice',
});

// 2. Compile it
const compile = createPromptCompile({
  promptId: 'P123',
  compilerRef: 'compiler.C1@v2',
  compiledArtifactRef: 'compiled.P123@v2',
  authorityRef: 'auth.user.alice',
});

// 3. Execute it
const execute = createPromptExecute({
  runId: 'R456',
  compiledPromptRef: 'compiled.P123@v2',
  targetTool: 'dall-e-3',
  authorityRef: 'auth.user.alice',
});
```

### 2. Creating a Sequence
```javascript
// 1. Create sequence
const createSeq = createSequenceCreate({
  sequenceId: 'SEQ1',
  name: 'Image Refinement Pipeline',
  authorityRef: 'auth.user.alice',
});

// 2. Add steps
const step1 = createSequenceAddStep({
  sequenceId: 'SEQ1',
  compiledPromptRef: 'compiled.P123@v2',
  trigger: TriggerTypes.ON_MANUAL,
  authorityRef: 'auth.user.alice',
});

const step2 = createSequenceAddStep({
  sequenceId: 'SEQ1',
  compiledPromptRef: 'compiled.P124@v1',
  trigger: TriggerTypes.ON_ASSISTANT_RESPONSE,
  authorityRef: 'auth.user.alice',
});
```

### 3. Branching and Merging
```javascript
// 1. Branch twice
const branchA = createPromptBranchCreate({
  promptId: 'P123',
  branchName: 'focus-quality',
  authorityRef: 'auth.user.alice',
});

const branchB = createPromptBranchCreate({
  promptId: 'P123',
  branchName: 'focus-speed',
  authorityRef: 'auth.user.bob',
});

// 2. Edit independently (multiple PROMPT_EDIT commits)
// ...

// 3. Merge
const merge = createPromptMergeResolve({
  mergeId: 'M1',
  branchARef: 'prompt.P123@branch/focus-quality@v3',
  branchBRef: 'prompt.P123@branch/focus-speed@v2',
  resolvedPromptRef: 'prompt.P123@merge/M1',
  conflictResolutions: [
    { section: 'style', chosenBranch: 'A', reason: 'Quality over speed' }
  ],
  authorityRef: 'auth.user.alice',
});
```

### 4. Saving and Restoring Snapshots
```javascript
// 1. Save snapshot
const save = createPromptSnapshotSave({
  snapshotId: 'SNAP1',
  promptHeadRef: 'prompt.P123@v5',
  compilerRef: 'compiler.C1@v2',
  label: 'baseline-working',
  reason: 'Good quality + fast execution',
  exampleOutputRefs: ['image.IMG789', 'image.IMG790'],
});

// 2. Restore later (creates new head)
const restore = createPromptSnapshotRestore({
  promptId: 'P123',
  snapshotRef: 'snapshot.SNAP1',
  authorityRef: 'auth.user.alice',
});
```

---

## Integration with Existing Relay UI

### Coordination Graph Explorer
Add prompt filaments to the existing graph:
- Nodes: `prompt.*`, `sequence.*`, `run.*`, `snapshot.*`, `merge.*`
- Edges: `compiledPromptRef`, `mergeScarRef`, `snapshotRef`
- Colors: Prompts (purple), Sequences (orange), Runs (green)

### File Loader
Extend to import prompt files:
- Drag/drop `.prompt` files
- Creates `evidence.*` filament
- Parses into `prompt.*` filament
- Shows in Prompt Library

### Authority Delegation Graph
Map `authorityRef` onto prompt execution:
- Who can compile prompts
- Who can set triggers
- Who can merge branches

---

## Next Steps

### Immediate
- [x] Create `verify:prompt` script
- [x] Define `CompiledPromptArtifact` schema
- [ ] Create data folder: `/data/prompts/`
- [ ] Add prompt UI to Relay System Demo
- [ ] Test with example prompt workflow

### Follow-up
- [ ] Add `verify:prompt` to pre-commit hook
- [ ] Create compiler implementations
- [ ] Build "Branch Twice → Merge" UI
- [ ] Add prompt graph to Coordination Explorer
- [ ] Integrate with existing agent system

---

## Questions?

**Q: Why can't I just execute raw text directly?**  
A: Same reason you can't run code without compiling it. Reproducibility requires artifacts, not ambient execution.

**Q: What if I want to quickly test a prompt?**  
A: Create a `PROMPT_CREATE` + `PROMPT_COMPILE` + `PROMPT_EXECUTE` sequence. It's deterministic and auditable. "Quick" doesn't mean "invisible."

**Q: Why do I need merge scars?**  
A: Same reason git needs merge commits. Without proof of resolution, you can't replay or verify the merge later.

**Q: Can I have multiple active prompts for the same context?**  
A: No. That's the "duplicate `main.jsx`" bug. If you need variants, create explicit branches.

---

**Status:** ✅ SPECIFICATION COMPLETE  
**Implementation:** 🚧 IN PROGRESS  
**Enforcement:** Pre-execute verification required
