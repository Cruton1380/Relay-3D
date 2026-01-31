# 🕸️ Topology as Emergent Lens — Dependencies as Filament Faces

**Version**: 1.0.0  
**Status**: Canonical Reference  
**Last Updated**: 2026-01-27

---

## Core Principle

> **Topology is not drawn. It is encoded in commits and emerges when requested.**

In traditional systems, relationships between entities are drawn as **edges** in a graph. In Relay, relationships are **encoded in TimeBox faces** and **revealed as glyphs**. Topology emerges when you ask for it via a **lens operation**.

---

## Key Insights

### **1. No Static Edges**

**Traditional Graph:**
```
Node A ───edge───> Node B
```
**Problem:** Edges are separate entities that need maintenance, synchronization, and can become stale.

**Relay:**
```
Filament A: TimeBox 42
  ├─ -X (Input): depends on [Filament B: commit 10]
  └─ (No separate edge object)
```
**Benefit:** Dependencies are **part of the commit**. No separate edge to maintain.

---

### **2. Forks/Merges Are Glyphs**

**SPLIT glyph** = Filament branches (topology diverges)  
**SCAR glyph** = Filament merges (topology converges)

**Visual:**
```
Filament A (horizontal):

TimeBox 10   TimeBox 11 (SPLIT)   TimeBox 12
   □───────────□────────┬─────────□
                        │
                        └─────> Branch B (fork)
```

**Reading topology:**
> "At commit 11, Filament A split into main and Branch B."

---

### **3. Topology Emerges on Demand**

**NOT:** Pre-computed graph stored separately

**IS:** Lens operation that traverses TimeBox faces and renders dependencies

**Example Query:**
```typescript
// "Show me all dependencies of Filament A"
const topology = queryTopology({
  filamentId: 'filament-a',
  commitIndex: 42,
  depth: 2  // How many levels deep?
});

// Returns:
// {
//   filamentId: 'filament-a',
//   dependencies: [
//     { filamentId: 'filament-b', commitIndex: 10, type: 'input' },
//     { filamentId: 'filament-c', commitIndex: 5, type: 'evidence' }
//   ]
// }
```

---

## How Topology Is Encoded

### **Dependencies in -X Face (Input)**

**TimeBox Structure:**
```typescript
interface TimeBox {
  faces: {
    output: any;                    // +X: What this produces
    input: {                        // -X: What this depends on
      dependencies: Dependency[]
    };
    // ... other faces
  };
}

interface Dependency {
  filamentId: string;
  commitIndex: number;
  relationshipType: 'input' | 'reference' | 'transform';
}
```

**Example:**
```typescript
// Budget 2026: TimeBox 42
{
  faces: {
    output: { totalBudget: 500000 },
    input: {
      dependencies: [
        { filamentId: 'dept-finance', commitIndex: 10, relationshipType: 'input' },
        { filamentId: 'dept-operations', commitIndex: 8, relationshipType: 'input' }
      ]
    }
  }
}
```

**Reading:**
> "Budget total (500k) depends on Finance dept (commit 10) and Operations dept (commit 8)."

---

### **Evidence in -Z Face (Provenance)**

**TimeBox Structure:**
```typescript
interface TimeBox {
  faces: {
    // ...
    evidence: {
      source: string;
      proofType: 'document' | 'signature' | 'calculation' | 'reference';
      pointer: string;
    };
  };
}
```

**Example:**
```typescript
// Audit Report: TimeBox 5
{
  faces: {
    evidence: {
      source: 'filament:financial-records',
      proofType: 'reference',
      pointer: 'commit:abc123'  // Points to specific commit in another filament
    }
  }
}
```

**Reading:**
> "This audit report's evidence comes from Financial Records filament, commit abc123."

---

### **Forks/Merges as Glyphs**

**SPLIT Glyph:**
```typescript
// Filament A: TimeBox 20 (SPLIT)
{
  glyph: 'SPLIT',
  faces: {
    output: {
      branches: [
        { branchId: 'main', continuesAt: 21 },
        { branchId: 'alice-proposal', startsAt: 21 }
      ]
    }
  }
}
```

**SCAR Glyph:**
```typescript
// Filament A: TimeBox 30 (SCAR)
{
  glyph: 'SCAR',
  faces: {
    input: {
      mergedFrom: [
        { filamentId: 'filament-a', branchId: 'main', commitIndex: 29 },
        { filamentId: 'filament-a', branchId: 'alice-proposal', commitIndex: 25 }
      ]
    },
    output: { resolvedValue: 'merged-state' }
  }
}
```

**Reading:**
> "At commit 30, Branch A (main) and Branch B (alice-proposal) merged, resolving to 'merged-state'."

---

## Topology Lenses (Query Operations)

### **1. Dependency Tree Lens**

**Query:** "Show me all upstream dependencies."

**Visualization:**
```
Budget 2026 (root)
├─ Finance Dept
│  ├─ Payroll
│  └─ Expenses
├─ Operations Dept
│  └─ Supplies
└─ HR Dept
   └─ Benefits
```

**Implementation:**
```typescript
function buildDependencyTree(filamentId: string, commitIndex: number, depth: number = 3) {
  const timeBox = getTimeBox(filamentId, commitIndex);
  const deps = timeBox.faces.input.dependencies || [];
  
  return {
    filamentId,
    commitIndex,
    children: deps.map(dep => 
      buildDependencyTree(dep.filamentId, dep.commitIndex, depth - 1)
    ).slice(0, depth > 0 ? undefined : 0)  // Limit depth
  };
}
```

---

### **2. Impact Analysis Lens**

**Query:** "If I change this filament, what else is affected?"

**Visualization:**
```
Change Payroll (commit 15)
  ↓ Affects
Finance Dept (commit 18)
  ↓ Affects
Budget 2026 (commit 42)
  ↓ Affects
Board Approval (commit 50)
```

**Implementation:**
```typescript
function analyzeImpact(filamentId: string, commitIndex: number) {
  // Find all filaments that depend on this one
  const allFilaments = getAllFilaments();
  const impacted = [];
  
  for (const f of allFilaments) {
    for (const tb of f.timeBoxes) {
      const deps = tb.faces.input.dependencies || [];
      if (deps.some(d => d.filamentId === filamentId && d.commitIndex === commitIndex)) {
        impacted.push({ filamentId: f.id, commitIndex: tb.eventIndex });
      }
    }
  }
  
  return impacted;
}
```

---

### **3. Branch History Lens**

**Query:** "Show me all branches and when they merged."

**Visualization:**
```
Main:
  │
  ├─ Commit 10 (SPLIT) ──> alice-proposal
  │                            │
  │  Commit 15               Commit 12
  │                            │
  │  Commit 20 (SCAR) <───── Commit 18 (merged)
  │
  └─ Commit 25
```

**Implementation:**
```typescript
function buildBranchHistory(filamentId: string) {
  const timeBoxes = getTimeBoxes(filamentId);
  const splits = timeBoxes.filter(tb => tb.glyph === 'SPLIT');
  const scars = timeBoxes.filter(tb => tb.glyph === 'SCAR');
  
  return {
    splits: splits.map(tb => ({
      commitIndex: tb.eventIndex,
      branches: tb.faces.output.branches
    })),
    merges: scars.map(tb => ({
      commitIndex: tb.eventIndex,
      mergedFrom: tb.faces.input.mergedFrom
    }))
  };
}
```

---

## Real-World Scenarios

### Scenario 1: Budget Impact Analysis

**Context:** Finance team wants to see what changing payroll affects.

**Process:**
1. Select "Payroll" filament, commit 15
2. Click "Show Impact" (topology lens)
3. System traverses all filaments, finds dependencies
4. Renders impact tree:
   ```
   Payroll (commit 15)
     ↓
   Finance Dept (commit 18)
     ↓
   Total Budget (commit 42)
     ↓
   Board Approval (commit 50)
   ```
5. Team sees: "Changing payroll affects 3 downstream decisions"

**Benefit:** No need to manually trace dependencies—system knows from commit faces.

---

### Scenario 2: Auditing Data Provenance

**Context:** Auditor wants to verify where a number came from.

**Process:**
1. Inspect "Revenue" KPI, commit 42
2. Click -X face (Input) → see dependencies:
   ```
   Revenue (commit 42) depends on:
   - Sales Data (commit 30)
   - Refunds (commit 25)
   ```
3. Click -Z face (Evidence) → see:
   ```
   Evidence: report:q1-2026-finance.pdf
   Calculation: operator:revenue-calc
   ```
4. Auditor follows chain → verifies each dependency

**Benefit:** Full provenance trail without separate documentation.

---

### Scenario 3: Proposal Branch Tracking

**Context:** Community reviewing Alice's budget proposal.

**Process:**
1. View "Budget 2026" filament in workflow mode
2. See SPLIT glyph at commit 20:
   ```
   Main: commit 20 (SPLIT) ──> alice-proposal
   ```
3. Click "alice-proposal" branch → see her proposed changes
4. Community votes → if approved, SCAR glyph appears (merge)
5. History shows: "Proposal split at commit 20, merged at commit 30"

**Benefit:** Visual, inspectable governance process.

---

## Integration with Filament System

### Rendering Topology in Workflow View

**Horizontal Filament:**
```
TimeBox 10   TimeBox 11 (depends on B)   TimeBox 12
   □───────────□──────────────────────────□
                │
                └─ Dependency: Filament B (commit 5)
                   (Rendered as dashed line or indicator)
```

**On Hover:**
> "This commit depends on Filament B, commit 5."

---

### Rendering Topology in Globe View

**Globe = Frontier (no history)**, but you can show:
- **Branch relationships** (which branches are related)
- **Regional dependencies** (which regions affect each other)

**Example:**
```
Seattle Branch
  │ (depends on)
  ↓
Finance HQ Branch (SF)
```

---

## Implementation

### Data Structure

```typescript
interface TimeBoxFaces {
  output: any;
  input: {
    dependencies?: Dependency[];
    mergedFrom?: MergeSource[];
  };
  semantic: string;
  magnitude: number;
  identity: string;
  evidence: {
    source?: string;
    proofType?: 'document' | 'signature' | 'calculation' | 'reference';
    pointer?: string;
  };
}

interface Dependency {
  filamentId: string;
  commitIndex: number;
  relationshipType: 'input' | 'reference' | 'transform';
  label?: string;  // Optional human-readable description
}

interface MergeSource {
  filamentId: string;
  branchId: string;
  commitIndex: number;
}
```

---

### Query API

```typescript
// Dependency tree
app.get('/api/topology/dependencies', async (req, res) => {
  const { filamentId, commitIndex, depth } = req.query;
  const tree = buildDependencyTree(filamentId, commitIndex, depth);
  res.json(tree);
});

// Impact analysis
app.get('/api/topology/impact', async (req, res) => {
  const { filamentId, commitIndex } = req.query;
  const impacted = analyzeImpact(filamentId, commitIndex);
  res.json(impacted);
});

// Branch history
app.get('/api/topology/branches', async (req, res) => {
  const { filamentId } = req.query;
  const history = buildBranchHistory(filamentId);
  res.json(history);
});
```

---

## Frequently Asked Questions

### General

**Q: Why not draw edges explicitly?**  
A: **Edges are redundant.** Dependencies are already in TimeBox faces. Drawing them separately creates sync issues.

**Q: Can I visualize topology as a graph?**  
A: **Yes!** Topology lenses render graphs on demand. But the graph is **derived**, not stored.

**Q: What if I want to see all relationships at once?**  
A: Use a **topology lens** that traverses all filaments and renders a graph. It's a lens operation, not a stored artifact.

---

### Technical

**Q: How do you prevent circular dependencies?**  
A: **Pre-commit hook validation.** Envelope validator checks for cycles before accepting commit.

**Q: What if a dependency is on a different branch?**  
A: Dependencies specify `(filamentId, commitIndex, branchId)`. Lens resolves branch context.

**Q: How do you handle cross-repo dependencies?**  
A: Dependencies can reference external repos: `{ filamentId: 'external-repo:kpi:revenue', commitIndex: 42 }`.

---

### Governance

**Q: Who decides what dependencies are valid?**  
A: **Pre-commit hooks enforce schema**. If a commit references a non-existent filament/commit, it's rejected.

**Q: Can I hide dependencies?**  
A: **No.** Dependencies are structural truth. If a commit depends on something, that's auditable. (You can hide **values** via encryption, but not **relationships**.)

**Q: What if I want to break a dependency?**  
A: Create a new commit with updated -X face (removing the dependency). This is a **structural change** (visible in history).

---

## Conclusion

**Topology as Emergent Lens** ensures:
- ✅ **No redundancy**: Dependencies encoded once (in TimeBox faces)
- ✅ **No staleness**: Topology is always current (derived from commits)
- ✅ **Auditable relationships**: Every dependency is a commit (inspectable)
- ✅ **Flexible views**: Query topology on demand (dependency tree, impact analysis, branch history)
- ✅ **Visual governance**: Forks (SPLIT) and merges (SCAR) are visible glyphs

By treating topology as **emergent** (not static), Relay makes relationships **truth-preserving** and **maintenance-free**.

---

**See Also:**
- [Filament System Overview](FILAMENT-SYSTEM-OVERVIEW.md)
- [KPIs as Filaments](KPIS-AS-FILAMENTS.md) (Dependencies in KPI calculations)
- [Editable Endpoint Lens](EDITABLE-ENDPOINT-LENS.md) (Formulas create dependencies)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Reference*  
*Version: 1.0.0*
