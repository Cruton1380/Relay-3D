# 💻 Code as Filaments — Canonical Model

**Version**: 1.0.0  
**Status**: Canonical Reference  
**Last Updated**: 2026-01-27

---

## Executive Summary

In Relay, **code is not text files**—it is a **living graph of filaments** where modules, functions, and symbols are truth objects with history, dependencies, evidence, and governance.

**Core Insight:**
> Import/export graphs already ARE dependency graphs. Codebases already ARE trees of references. Our current "text files + folder paths" UI is a legacy table-of-strings interface for that graph.

**Universal Import Principle:**
> Because Relay can **import any system** ("Relay should be able to receive, understand, interpret, and render all files ever created from any system"), **any codebase from any VCS (Git, SVN, Mercurial, etc.) can be imported as filaments** with full history preserved.

**Key Innovations:**
- **Modules as filaments**: Each module (file) is a filament with commits representing edits
- **Functions/classes as loci**: Addressable regions within module filaments
- **Imports/exports as topology**: Dependencies are edges (Topology Lens Tier 2+)
- **Edits as operations**: Rename, extract, change signature are discrete commit types
- **Evidence from compiler**: Typecheck, tests, lint results as evidence pointers
- **Gates for review/CI**: Code review and CI are governance gates, not external tools
- **3D workspace**: Navigate code history, dependencies, and presence in 3D

**Why It Matters:**
Enables **refactoring without breaking**, **impact analysis without running**, **code review as geometry**, and **collaborative editing with presence + locks**.

---

## Table of Contents

1. [Core Definitions](#core-definitions)
2. [Non-Negotiable Invariants](#non-negotiable-invariants)
3. [Two Paths to Graphical Code](#two-paths-to-graphical-code)
4. [Code Filament Model](#code-filament-model)
5. [Operations (Not Text Diffs)](#operations-not-text-diffs)
6. [Evidence Model](#evidence-model)
7. [Topology Lens (Dependencies)](#topology-lens-dependencies)
8. [3D Workspace Features](#3d-workspace-features)
9. [Code Review as Geometry](#code-review-as-geometry)
10. [Future: FilamentLang](#future-filamentlang)

---

## Core Definitions

### What Is a Code Filament?

**Code Filament** = A module (file) represented as a filament, where each commit represents a structural change to the code.

**NOT:**
- ❌ A text file with line-by-line diffs
- ❌ A blob in a version control system
- ❌ A UML diagram or flowchart

**IS:**
- ✅ A sequence of TimeBoxes (commits) showing module evolution
- ✅ An addressable truth object with exports, imports, and internal structure
- ✅ A node in a dependency graph (topology)
- ✅ A workspace with loci (functions, classes, regions)

---

### What Is a Code Locus?

**Code Locus** = An addressable region within a module filament.

**Examples:**
- `(moduleId: 'src/utils.ts', commitIndex: 5, nodePath: 'function:parseJSON')`
- `(moduleId: 'src/App.tsx', commitIndex: 12, nodePath: 'class:UserService.method:login')`
- `(moduleId: 'lib/math.rs', commitIndex: 3, nodePath: 'fn:calculate_sum')`

**Key:** Loci allow you to **edit specific parts** of a module without editing the whole file.

---

### What Is a Code Operation?

**Code Operation** = A discrete, semantic edit to code structure.

**NOT:**
- ❌ "Changed line 42 from X to Y" (text diff)
- ❌ "Added 5 lines, removed 3 lines" (patch)

**IS:**
- ✅ `RENAME_SYMBOL(oldName, newName, scope)`
- ✅ `EXTRACT_FUNCTION(selection, newName)`
- ✅ `CHANGE_SIGNATURE(function, newParams)`
- ✅ `ADD_IMPORT(module, symbols)`
- ✅ `REFACTOR_INLINE(function)`

**Why:** Operations are **auditable**, **replayable**, and **carry semantic meaning** (not just textual changes).

---

### What Is Code Evidence?

**Code Evidence** = Compiler output, test results, lint warnings, typecheck errors.

**NOT:**
- ❌ Stored in external CI logs
- ❌ Lost after the build
- ❌ Disconnected from the commit

**IS:**
- ✅ Attached to commits as evidence pointers
- ✅ Visible in 3D (red = failed, green = passed)
- ✅ Auditable (replay commit → see exact error at that timestamp)

**Examples:**
- `{ kind: 'typecheck', status: 'PASS', output: '0 errors' }`
- `{ kind: 'test', status: 'FAIL', output: '2 tests failed: login, logout' }`
- `{ kind: 'lint', status: 'WARN', output: '5 warnings: unused imports' }`

---

## Non-Negotiable Invariants

These rules cannot be violated:

### **I1 — Code Is a Filament, Not a File**

A module is **not a mutable text blob**. It is a **sequence of commits** (TimeBoxes) representing its evolution.

**Rule:** To understand code, replay its commits. Don't just read "the current state."

**Why:** History is the primary object. Current state is a projection.

---

### **I2 — Edits Are Operations, Not Diffs**

Code changes are **semantic operations** (rename, extract, inline), not line-by-line diffs.

**Rule:** Every edit must be represented as a discrete operation with parameters.

**Why:** Operations are auditable, replayable, and carry intent (not just textual delta).

---

### **I3 — Dependencies Are Topology, Not Strings**

Imports are **not text strings** like `import { foo } from './bar'`.

They are **typed edges** in the dependency graph.

**Rule:** An import must reference the exact commit of the imported module (evidence-backed).

**Why:** "This function exists and passed tests at commit X" is provable, not assumed.

---

### **I4 — Evidence Is First-Class, Not External**

Compiler output, test results, lint warnings are **not external logs**.

They are **evidence pointers** attached to commits.

**Rule:** Every commit must carry evidence (or declare "no evidence yet").

**Why:** You should be able to replay a commit and see exactly what broke (or passed).

---

### **I5 — Code Review Is a Gate, Not a Comment Thread**

Code review is **not an external tool** (GitHub PR, Gerrit, etc.).

It is a **governance gate** on the code filament.

**Rule:** Proposed changes are branches. Approval is a GATE commit. Merge is a SCAR (with trace).

**Why:** Review is part of the truth, not metadata on the side.

---

## Two Paths to Graphical Code

### Path 1: Lens Over Existing Languages (FAST)

**Goal:** Keep writing TypeScript/Rust/Python, but render it as filaments.

**How:**
1. **Parse code into AST** (Abstract Syntax Tree)
2. **Store edits as commits** (not just git commits, but semantic operations)
3. **Render modules as filaments** in 3D
4. **Show imports as dependency rays** (Topology Lens Tier 2+)
5. **Attach compiler/test evidence** to each commit

**Example:**
```typescript
// src/utils.ts (Module Filament)
// Commit 0: MODULE_CREATED
// Commit 1: FUNCTION_ADDED(name: 'parseJSON')
// Commit 2: FUNCTION_RENAMED(old: 'parseJSON', new: 'parseData')
// Commit 3: IMPORT_ADDED(module: './types', symbols: ['User'])
```

**Render in 3D:**
- Module filament (horizontal, X-axis = commits)
- Each TimeBox shows operation
- Dependency rays to `./types` (topology)
- Evidence pointer: `{ typecheck: 'PASS', tests: 'PASS' }`

**Benefit:** You get graphical programming **without creating a new language**.

---

### Path 2: FilamentLang (FUTURE)

**Goal:** Create a language where **everything is a locus** and **references are typed edges**.

**Core features:**
- **Addressable loci**: `(filamentId, commitIndex, lensContext, nodePath)`
- **Typed edges**: Imports carry proof (not just strings)
- **Refactors as operations**: `rename`, `extract`, `inline` are built-in
- **Evidence-backed references**: `import foo from './bar' at commit:42 where typecheck=PASS`

**Example (hypothetical syntax):**
```filament
module Utils at commit:5 {
  export function parseData(input: string) -> Result<Data, Error> {
    // Implementation
  }
  
  evidence {
    typecheck: PASS
    tests: PASS (12/12)
    lint: WARN (unused import: lodash)
  }
}
```

**Benefit:** Filament-native semantics, but still compiles to TS/Rust for real execution.

**When:** After proving Path 1 works in production.

---

## Code Filament Model

### Module as Filament

**Filament ID:** `module:<relativePath>`

**Examples:**
- `module:src/utils.ts`
- `module:lib/math.rs`
- `module:app/services/auth.py`

**Commits (Operations):**
- `MODULE_CREATED` — Initial creation
- `FUNCTION_ADDED` — Add function
- `FUNCTION_RENAMED` — Rename function
- `FUNCTION_REMOVED` — Remove function (GATE if downstream dependencies)
- `CLASS_ADDED` — Add class
- `IMPORT_ADDED` — Add import
- `IMPORT_REMOVED` — Remove import
- `REFACTOR_EXTRACT` — Extract function
- `REFACTOR_INLINE` — Inline function

**Each commit carries:**
- `op`: Operation type
- `params`: Operation parameters (e.g., `{ oldName, newName }`)
- `evidence`: Compiler/test results
- `refs.inputs`: Dependencies (which modules/commits this references)

---

### TimeBox Faces (Module Filament)

**+X Face: Exported API Surface**
- List of exported symbols (functions, classes, types)
- Example: `{ exports: ['parseData', 'User', 'ApiClient'] }`

**-X Face: Import List (Dependencies)**
- List of imported modules + symbols
- Example: `{ imports: [{ module: './types', symbols: ['User'] }] }`

**+Y Face: Semantic Summary**
- High-level description (e.g., "Utility functions for data parsing")
- LOC, complexity metrics (optional)

**-Y Face: Evidence Pointer**
- Compiler/test results
- Example: `{ typecheck: 'PASS', tests: 'PASS (12/12)', lint: 'WARN' }`

**+Z Face: Author/CI Identity**
- Who committed this change
- Example: `{ actor: 'alice', ci: 'GitHub Actions' }`

**-Z Face: Root Evidence**
- Git commit hash (if syncing with git)
- Example: `{ gitCommit: 'abc123', timestamp: '2026-01-27T10:00:00Z' }`

---

### Function/Class as Locus

**Locus ID:** `(moduleId, commitIndex, nodePath)`

**Examples:**
- `(module:src/utils.ts, commit:5, nodePath:'function:parseData')`
- `(module:src/App.tsx, commit:12, nodePath:'class:UserService.method:login')`

**Loci allow:**
- **Endpoint editing** — Click function → edit body → append commit
- **Symbol renaming** — Rename function → update all references (downstream commits)
- **Refactoring** — Extract function → creates new locus + updates references

---

## Operations (Not Text Diffs)

### Core Operations

**1. MODULE_CREATED**
```typescript
{
  op: 'MODULE_CREATED',
  params: {
    moduleId: 'src/utils.ts',
    language: 'typescript',
    initialContent: '// Utility functions\n'
  }
}
```

**2. FUNCTION_ADDED**
```typescript
{
  op: 'FUNCTION_ADDED',
  params: {
    name: 'parseData',
    signature: '(input: string): Result<Data, Error>',
    body: '// Implementation',
    exported: true
  }
}
```

**3. FUNCTION_RENAMED**
```typescript
{
  op: 'FUNCTION_RENAMED',
  params: {
    oldName: 'parseJSON',
    newName: 'parseData',
    scope: 'module' // or 'file' or 'project'
  },
  refs: {
    inputs: [
      // References to downstream modules that import this symbol
      { filamentId: 'module:src/api.ts', commitIndex: 8 }
    ]
  }
}
```

**4. IMPORT_ADDED**
```typescript
{
  op: 'IMPORT_ADDED',
  params: {
    module: './types',
    symbols: ['User', 'ApiResponse']
  },
  refs: {
    inputs: [
      { filamentId: 'module:src/types.ts', commitIndex: 3 } // Evidence-backed
    ]
  }
}
```

**5. REFACTOR_EXTRACT**
```typescript
{
  op: 'REFACTOR_EXTRACT',
  params: {
    sourceFunction: 'handleUserLogin',
    extractedFunction: 'validateCredentials',
    startLine: 42,
    endLine: 56
  }
}
```

---

## Evidence Model

### Evidence Types

**1. Typecheck**
```typescript
{
  kind: 'typecheck',
  tool: 'tsc', // or 'rustc', 'mypy', etc.
  status: 'PASS' | 'FAIL' | 'WARN',
  errors: [],
  warnings: ['Unused import: lodash'],
  output: '0 errors, 1 warning'
}
```

**2. Tests**
```typescript
{
  kind: 'test',
  tool: 'jest', // or 'pytest', 'cargo test', etc.
  status: 'PASS' | 'FAIL',
  passed: 12,
  failed: 0,
  skipped: 0,
  output: '12/12 tests passed'
}
```

**3. Lint**
```typescript
{
  kind: 'lint',
  tool: 'eslint', // or 'clippy', 'pylint', etc.
  status: 'PASS' | 'WARN' | 'FAIL',
  warnings: ['Unused variable: x', 'Missing return type'],
  errors: [],
  output: '0 errors, 2 warnings'
}
```

**4. Build**
```typescript
{
  kind: 'build',
  tool: 'vite', // or 'webpack', 'cargo', etc.
  status: 'PASS' | 'FAIL',
  artifacts: ['dist/bundle.js'],
  output: 'Build completed in 1.2s'
}
```

---

### Evidence Attachment

**Rule:** Every commit should carry evidence (or declare "pending").

**Example commit with evidence:**
```typescript
{
  filamentId: 'module:src/utils.ts',
  commitIndex: 5,
  op: 'FUNCTION_RENAMED',
  params: { oldName: 'parseJSON', newName: 'parseData' },
  evidence: {
    typecheck: { status: 'PASS', errors: [] },
    tests: { status: 'PASS', passed: 12, failed: 0 },
    lint: { status: 'WARN', warnings: ['Unused import'] }
  }
}
```

---

### Evidence in 3D

**Visual encoding:**
- **-Y Face color**: Green (PASS), Red (FAIL), Yellow (WARN)
- **Evidence pointer**: Clicking -Y face shows full output
- **Dependency rays**: Red rays = downstream broken by this change

---

## Topology Lens (Dependencies)

### Core Principle

**Rule:** Dependencies are **not text strings**. They are **typed edges** in the dependency graph.

**Example:**
```typescript
// NOT: import { User } from './types'
// IS:
{
  kind: 'IMPORT_EDGE',
  source: { filamentId: 'module:src/api.ts', commitIndex: 5 },
  target: { filamentId: 'module:src/types.ts', commitIndex: 3 },
  symbols: ['User'],
  evidence: { typecheck: 'PASS' } // Proves the symbol exists
}
```

---

### Tier 2+ Topology Rendering

**Toggle:** Show dependency rays (not always visible).

**Rendering:**
- **Upstream dependencies** (what this module imports):
  - Thin rays pointing backward (-X direction)
  - Color: Blue (normal), Red (broken reference)
- **Downstream consumers** (what imports this module):
  - Thin rays pointing forward (+X direction)
  - Color: Green (healthy), Red (broken by recent change)

**Example:**
```
module:src/types.ts
  ← (blue ray) module:src/api.ts imports User
  ← (blue ray) module:src/app.ts imports User
  
module:src/api.ts
  → (green ray) exports ApiClient
  → (red ray) exports getBrokenFunction (downstream tests fail)
```

---

### Blast Radius Analysis

**Use case:** "If I rename this function, what breaks?"

**How:**
1. Select function locus
2. Toggle Topology Lens
3. **Downstream rays turn yellow** (warning: will be affected)
4. Hover ray → shows "3 modules import this symbol"
5. Perform rename → **rays turn red** until downstream modules update

**Key:** Blast radius is **visible geometry**, not hidden analysis.

---

## 3D Workspace Features

### A) Fly Along Module Filament (History)

**Goal:** Navigate commit history in 3D.

**How:**
- Module filament is horizontal (X-axis = time)
- Camera flies along the filament
- Playback motor: Play/pause/step through commits
- Each TimeBox shows operation + evidence

**Use case:** "How did this function evolve?"

---

### B) Zoom Into Function Locus (Endpoint Editing)

**Goal:** Edit specific function without editing whole file.

**How:**
- Camera zooms into function locus (region within module)
- EngageSurface activates (L6 + lock required)
- Edit function body → append commit
- Evidence automatically attached (typecheck/tests run)

**Use case:** "I want to refactor this one function."

---

### C) See Presence (Who's Editing What)

**Goal:** Avoid edit conflicts.

**How:**
- Presence markers (green beads) above loci
- Hover → shows "Alice editing function:parseData"
- EngageSurface lock prevents simultaneous edits

**Use case:** "Is anyone else working on this module?"

---

### D) See Dependency Rays (Topology Lens)

**Goal:** Understand impact of changes.

**How:**
- Toggle Topology Lens → dependency rays appear
- Upstream (blue): What this imports
- Downstream (green/red): What imports this
- Red = broken by recent change

**Use case:** "What breaks if I rename this symbol?"

---

### E) Fork/Merge Visible (Code Review as Geometry)

**Goal:** Code review is not external—it's geometry.

**How:**
- Proposed change creates fork (branch)
- Review is inspection of branch geometry
- Approval is GATE commit
- Merge is SCAR (with trace to original)

**Use case:** "I want to see the proposed changes in 3D."

---

## Code Review as Geometry

### Traditional Code Review (GitHub PR)

**How it works:**
1. Create branch
2. Push commits
3. Open PR (external tool)
4. Comments in thread (disconnected from code)
5. Approval (external metadata)
6. Merge (text-based)

**Problems:**
- Review is external (not part of truth)
- Comments are lost after merge
- Approval is metadata (not auditable commit)

---

### Relay Code Review (Filament Branch)

**How it works:**
1. **Fork branch**: Creates visual fork in 3D (SPLIT glyph)
2. **Propose changes**: Commits on branch filament
3. **Inspection**: Reviewers "fly to" branch, inspect commits in 3D
4. **Presence**: Reviewers' green beads visible (who's reviewing)
5. **Approval**: GATE commit (explicit, auditable)
6. **Merge**: SCAR commit (traces back to fork point)

**Benefits:**
- Review is geometry (visible in 3D)
- Comments are commits (preserved forever)
- Approval is GATE (auditable)
- Merge trace is explicit (SCAR glyph)

---

### Example: Rename Function Review

**Step 1: Propose change**
```typescript
// Alice creates branch: 'rename-parseJSON-to-parseData'
{
  op: 'FUNCTION_RENAMED',
  params: { oldName: 'parseJSON', newName: 'parseData' },
  branch: 'rename-parseJSON-to-parseData'
}
```

**Step 2: Reviewers inspect**
- Bob flies to branch in 3D
- Sees dependency rays (3 downstream modules affected)
- Presence marker: "Bob reviewing function:parseData"

**Step 3: Reviewer comments (as commit)**
```typescript
{
  op: 'REVIEW_COMMENT',
  params: {
    comment: 'Should update docs too',
    locus: 'function:parseData'
  },
  actor: { id: 'bob' }
}
```

**Step 4: Approval (GATE)**
```typescript
{
  op: 'REVIEW_APPROVED',
  params: {
    approver: 'bob',
    branch: 'rename-parseJSON-to-parseData'
  }
}
```

**Step 5: Merge (SCAR)**
```typescript
{
  op: 'BRANCH_MERGED',
  params: {
    branch: 'rename-parseJSON-to-parseData',
    target: 'main'
  },
  refs: {
    inputs: [
      { filamentId: 'module:src/utils.ts', commitIndex: 5 } // Fork point
    ]
  }
}
```

**In 3D:**
- Main filament has SCAR glyph at merge point
- Hovering SCAR shows trace to branch
- Review comments preserved as commits

---

## Future: FilamentLang

### Concept

**FilamentLang** is a hypothetical language where:
- Everything is an addressable locus
- References are typed edges (not strings)
- Refactors are first-class operations
- Evidence is built-in

**Goal:** Make filaments the **primary representation**, not just a lens over existing code.

---

### Example Syntax (Hypothetical)

**Module:**
```filament
module Utils at commit:5 {
  import { User } from './types' at commit:3 where typecheck=PASS
  
  export function parseData(input: string) -> Result<Data, Error> {
    // Implementation
  }
  
  evidence {
    typecheck: PASS
    tests: PASS (12/12)
    lint: WARN (unused import: lodash)
  }
}
```

**Refactor:**
```filament
refactor extract_function {
  source: function:handleUserLogin
  target: function:validateCredentials
  range: lines(42, 56)
  evidence_required: [typecheck, tests]
}
```

**Dependency with proof:**
```filament
import { foo } from './bar' 
  at commit:42 
  where typecheck=PASS 
  and tests=PASS
```

---

### Compilation

**FilamentLang → TypeScript/Rust**

Even with a custom language, **compile to real languages** for execution.

**Example:**
```filament
function add(a: int, b: int) -> int {
  return a + b
}
```

**Compiles to TypeScript:**
```typescript
function add(a: number, b: number): number {
  return a + b;
}
```

**Benefits:**
- Filament semantics for authoring
- Real language for execution
- Best of both worlds

---

## Conclusion

The **Code as Filaments Model** ensures that:
- ✅ **Code is a filament** (history is primary)
- ✅ **Edits are operations** (semantic, not textual)
- ✅ **Dependencies are topology** (typed edges, not strings)
- ✅ **Evidence is first-class** (compiler/test results attached)
- ✅ **Review is geometry** (visible, auditable, governed)
- ✅ **3D workspace** (navigate, inspect, edit in 3D)

By treating code as **filaments with operations, evidence, and topology**, Relay enables **refactoring without breaking**, **impact analysis without running**, and **collaborative editing with presence + locks**.

---

**One-Sentence Lock:**

> Code is not text files—it is a living graph of filaments where modules, functions, and symbols are truth objects with history, dependencies, evidence, and governance, rendered as navigable 3D workspaces with presence, locks, and blast radius analysis.

---

**See Also:**
- [Filament System Overview](FILAMENT-SYSTEM-OVERVIEW.md)
- [Engage Surface Spec](ENGAGE-SURFACE-SPEC.md)
- [Presence Permission Model](PRESENCE-PERMISSION-MODEL.md)
- [Topology as Lens](TOPOLOGY-AS-LENS.md)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Reference*  
*Version: 1.0.0*
