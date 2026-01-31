# 🌍 Universal Import — Relay as Truth Substrate for All Systems

**Version**: 1.0.0  
**Status**: Canonical Specification  
**Last Updated**: 2026-01-27

---

## 🔒 Core Invariant

> **Relay should be able to receive, understand, interpret, and render all files ever created from any system.**

This is not a feature request. This is **Relay's purpose**: to serve as the universal computational substrate that can represent **any reality, from any source, as filaments**.

---

## Table of Contents

1. [The Universal Import Principle](#the-universal-import-principle)
2. [What "Import" Means](#what-import-means)
3. [Import Adapters (How It Works)](#import-adapters-how-it-works)
4. [Examples by System Type](#examples-by-system-type)
5. [Canonical Import Flow](#canonical-import-flow)
6. [Import Evidence Model](#import-evidence-model)
7. [Lossless Representation](#lossless-representation)
8. [Conflict Resolution](#conflict-resolution)
9. [Real-World Scenarios](#real-world-scenarios)
10. [Technical Architecture](#technical-architecture)
11. [FAQ](#faq)

---

## The Universal Import Principle

### What This Means

**Every system** ever created stores truth in some form:
- Excel spreadsheets store tabular data + formulas
- Git repos store code + commit history
- Active Directory stores org hierarchy + permissions
- SQL databases store normalized tables + relationships
- Docker images store filesystem layers + execution instructions
- Network logs store packet flows + connection states
- CAD files store 3D geometry + material properties
- Video files store frames + audio + metadata

**Relay's job:** Ingest all of these and represent them as **filaments** (truth objects with history, causality, evidence, and governance).

---

### Three Types of Import

#### 1. **Forensic Import** (Past Truth)
Import existing historical data from legacy systems.

**Examples:**
- Import 10 years of Excel budgets → filaments with commit history
- Import Git repo → code filaments with all commits preserved
- Import Active Directory dump → org structure filaments with temporal changes

**Key property:** Import is **lossless**—every historical state is preserved as a commit.

---

#### 2. **Live Import** (Current Truth)
Continuously sync with live systems.

**Examples:**
- Live sync with SQL database → changes become commits
- Live sync with file system → file edits become operations
- Live sync with network monitor → packets become events

**Key property:** Import is **real-time**—Relay mirrors the source system.

---

#### 3. **Bidirectional Sync** (Relay as Authority)
Relay becomes the authoritative source, can write back to legacy systems.

**Examples:**
- Edit procurement filament in Relay → sync back to ERP as PO
- Edit code filament in Relay → sync back to Git as commits
- Edit org structure in Relay → sync back to Active Directory

**Key property:** Import is **bidirectional**—Relay can be the source of truth.

---

## What "Import" Means

### NOT:

❌ **"Upload a file and store it as a blob"**  
❌ **"Convert to JSON and dump in a database"**  
❌ **"Parse and throw away structure"**

### IS:

✅ **"Interpret the file's semantic structure"**  
✅ **"Extract its truth model"**  
✅ **"Represent it as filaments with commits, evidence, and governance"**  
✅ **"Render it natively in 3D with full history"**

---

### Example: Import an Excel File

**Old way (dumb import):**
```javascript
// ❌ WRONG: Just store the file
const file = uploadFile('budget.xlsx');
database.store({ filename: 'budget.xlsx', blob: file });
```

**Relay way (semantic import):**
```javascript
// ✅ RIGHT: Interpret the structure
const excelData = parseExcel('budget.xlsx');

// Create filaments for each sheet
for (const sheet of excelData.sheets) {
  const filament = createFilament(`excel:${sheet.name}`);
  
  // Each cell edit history becomes commits
  for (const cellHistory of sheet.cellHistories) {
    appendCommit(filament, {
      op: 'CELL_EDIT',
      locus: `${sheet.name}:${cellHistory.address}`,
      payload: {
        value: cellHistory.value,
        formula: cellHistory.formula,
        author: cellHistory.author,
        timestamp: cellHistory.timestamp
      },
      evidence: {
        source: 'excel',
        originalFile: 'budget.xlsx',
        sheetName: sheet.name
      }
    });
  }
}

// Result: Excel is now a filament with full history
// - Can render as 3D filaments (workflow view)
// - Can render as spreadsheet (projection lens)
// - Can replay cell edits (playback motor)
// - Can see who edited what (audit)
```

---

## Import Adapters (How It Works)

### Adapter Pattern

Every system type has an **import adapter** that knows how to:
1. **Parse** the source format
2. **Extract** semantic operations
3. **Construct** filament commits
4. **Attach** evidence pointers
5. **Preserve** full history

```typescript
interface ImportAdapter<TSourceFormat> {
  // Parse the source
  parse(source: TSourceFormat): ParsedStructure;
  
  // Extract operations (semantic, not raw)
  extractOperations(parsed: ParsedStructure): Operation[];
  
  // Build filament(s)
  buildFilaments(operations: Operation[]): Filament[];
  
  // Attach evidence
  attachEvidence(filament: Filament, source: TSourceFormat): void;
}
```

---

### Example Adapters

#### Excel Adapter
```typescript
class ExcelImportAdapter implements ImportAdapter<ExcelFile> {
  parse(file: ExcelFile): ParsedStructure {
    // Parse .xlsx using library (e.g., ExcelJS)
    return {
      sheets: extractSheets(file),
      formulas: extractFormulas(file),
      styles: extractStyles(file),
      metadata: extractMetadata(file)
    };
  }
  
  extractOperations(parsed: ParsedStructure): Operation[] {
    // Reconstruct edit history from cell revisions
    const operations = [];
    for (const sheet of parsed.sheets) {
      for (const cell of sheet.cells) {
        operations.push({
          type: 'CELL_EDIT',
          sheetName: sheet.name,
          cellAddress: cell.address,
          value: cell.value,
          formula: cell.formula,
          timestamp: cell.lastModified,
          author: cell.author || 'unknown'
        });
      }
    }
    return operations.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  buildFilaments(operations: Operation[]): Filament[] {
    // Create one filament per sheet
    const filaments = [];
    const sheetOps = groupBy(operations, 'sheetName');
    
    for (const [sheetName, ops] of sheetOps) {
      const filament = {
        id: `excel:sheet:${sheetName}`,
        commits: ops.map((op, idx) => ({
          commitIndex: idx,
          ts: op.timestamp,
          actor: { kind: 'user', id: op.author },
          op: 'CELL_EDIT',
          payload: {
            cellAddress: op.cellAddress,
            value: op.value,
            formula: op.formula
          },
          evidence: {
            source: 'excel',
            originalFile: this.filename
          }
        }))
      };
      filaments.push(filament);
    }
    
    return filaments;
  }
}
```

---

#### Git Adapter
```typescript
class GitImportAdapter implements ImportAdapter<GitRepo> {
  parse(repo: GitRepo): ParsedStructure {
    // Parse .git directory
    return {
      commits: extractCommits(repo),
      branches: extractBranches(repo),
      files: extractFileHistory(repo)
    };
  }
  
  extractOperations(parsed: ParsedStructure): Operation[] {
    // Git commits are already operations!
    return parsed.commits.map(commit => ({
      type: inferOperationType(commit.diff),  // RENAME, ADD_FUNCTION, etc.
      filePath: commit.filePath,
      diff: commit.diff,
      timestamp: commit.timestamp,
      author: commit.author,
      message: commit.message,
      hash: commit.hash
    }));
  }
  
  buildFilaments(operations: Operation[]): Filament[] {
    // One filament per file
    const filaments = [];
    const fileOps = groupBy(operations, 'filePath');
    
    for (const [filePath, ops] of fileOps) {
      const filament = {
        id: `git:file:${filePath}`,
        commits: ops.map((op, idx) => ({
          commitIndex: idx,
          ts: op.timestamp,
          actor: { kind: 'user', id: op.author },
          op: op.type,  // Semantic operation
          payload: {
            diff: op.diff,
            message: op.message
          },
          evidence: {
            source: 'git',
            gitHash: op.hash,
            repo: this.repoUrl
          }
        }))
      };
      filaments.push(filament);
    }
    
    return filaments;
  }
}
```

---

#### Active Directory Adapter
```typescript
class ActiveDirectoryAdapter implements ImportAdapter<ADDump> {
  parse(dump: ADDump): ParsedStructure {
    return {
      users: extractUsers(dump),
      groups: extractGroups(dump),
      orgUnits: extractOrgUnits(dump),
      policies: extractPolicies(dump),
      changes: extractChangeLog(dump)
    };
  }
  
  extractOperations(parsed: ParsedStructure): Operation[] {
    // AD changes become operations
    return parsed.changes.map(change => ({
      type: mapADActionToOp(change.action),  // USER_CREATED, GROUP_MODIFIED, etc.
      target: change.targetDN,
      attributes: change.attributes,
      timestamp: change.timestamp,
      actor: change.actor
    }));
  }
  
  buildFilaments(operations: Operation[]): Filament[] {
    // Each AD object (user, group, OU) becomes a filament
    const filaments = [];
    const objectOps = groupBy(operations, 'target');
    
    for (const [dn, ops] of objectOps) {
      const filament = {
        id: `ad:object:${dn}`,
        commits: ops.map((op, idx) => ({
          commitIndex: idx,
          ts: op.timestamp,
          actor: { kind: 'user', id: op.actor },
          op: op.type,
          payload: {
            attributes: op.attributes
          },
          evidence: {
            source: 'active-directory',
            dn: dn,
            domain: this.domain
          }
        }))
      };
      filaments.push(filament);
    }
    
    return filaments;
  }
}
```

---

## Examples by System Type

### 1. Spreadsheets (Excel, Google Sheets, CSV)

**What to import:**
- Each sheet → one filament
- Each cell edit → one commit
- Formulas → payload + dependency references
- Macros → evidence pointers
- User edits → actor attribution

**Rendering:**
- **Workflow view**: See cell edit history as TimeBoxes
- **Spreadsheet view**: Current state as projection
- **Topology lens**: Formula dependencies as rays

**Use case:** Import 10 years of budget spreadsheets, render as auditable filament history.

---

### 2. Code Repositories (Git, SVN, Mercurial)

**What to import:**
- Each file → one filament
- Each commit → one commit (map semantic operations)
- Branches → branch topology
- Tags → bookmarks
- Issues/PRs → governance filaments

**Rendering:**
- **Code filament view**: Module history as TimeBoxes
- **Topology lens**: Dependency rays
- **Evidence**: Typecheck/test results attached to commits

**Use case:** Import entire Git repo, render codebase as 3D filaments with dependencies.

---

### 3. Databases (SQL, NoSQL, Graph)

**What to import:**
- Each table → one filament type
- Each row → one entity filament (if has history)
- Each UPDATE/DELETE → one commit
- Schema changes → governance commits
- Relationships → topology references

**Rendering:**
- **Workflow view**: Row lifecycle as TimeBoxes
- **Entity view**: All rows as points in Z-space
- **Topology lens**: Foreign keys as rays

**Use case:** Import customer database, render customer lifecycle with order history.

---

### 4. File Systems (Windows, Linux, macOS)

**What to import:**
- Each file → one filament
- Each edit → one commit
- Renames/moves → RENAME operations
- File metadata → evidence
- Directory structure → grouping lens

**Rendering:**
- **File filament view**: Edit history as TimeBoxes
- **Directory lens**: Hierarchical grouping
- **Access logs**: Evidence attached to commits

**Use case:** Import user's Documents folder, render file edit history with full audit trail.

---

### 5. Network Systems (Active Directory, LDAP, DNS)

**What to import:**
- Each AD object (user/group/OU) → one filament
- Each permission change → one commit
- Group membership → assignment filaments
- Policy changes → governance commits

**Rendering:**
- **Org view**: Users/groups as filaments in Z-space
- **Permission lens**: Policy rays showing access
- **Temporal view**: See who had what access at any point in time

**Use case:** Import AD, render org structure with temporal permission changes.

---

### 6. Containers & VMs (Docker, Kubernetes, VMware)

**What to import:**
- Each image → one filament
- Each layer → one commit
- Deployments → lifecycle commits
- Logs → evidence
- Resource usage → KPI filaments

**Rendering:**
- **Container lifecycle view**: Create → run → stop → destroy as TimeBoxes
- **Dependency lens**: Image dependencies as topology
- **Resource KPIs**: CPU/memory as magnitude

**Use case:** Import Kubernetes cluster, render container lifecycle with resource usage.

---

### 7. Design Files (CAD, 3D Models, Images)

**What to import:**
- Each file → one filament
- Each edit → one commit
- Layers/components → sub-filaments
- Metadata (author, tools) → evidence

**Rendering:**
- **Design history view**: Edit sequence as TimeBoxes
- **Diff visualization**: Geometry changes between commits
- **Collaboration**: Multiple authors' contributions visible

**Use case:** Import CAD project, render design evolution with full edit history.

---

### 8. Media Files (Video, Audio, Documents)

**What to import:**
- Each file → one filament
- Each edit (trim, splice, mix) → one commit
- Metadata (codec, resolution, duration) → evidence
- Derivatives (transcodes) → branches

**Rendering:**
- **Media lifecycle**: Capture → edit → publish as TimeBoxes
- **Version tree**: Different cuts/mixes as branches
- **Access logs**: Who watched/downloaded (if tracked)

**Use case:** Import video project, render edit history with all versions preserved.

---

## Canonical Import Flow

### 6-Step Universal Import Process

```
1. INGEST
   ↓ Parse source format
   
2. NORMALIZE
   ↓ Extract semantic structure
   
3. OPERATIONALIZE
   ↓ Convert to discrete operations
   
4. COMMIT
   ↓ Build filament commits
   
5. EVIDENCE
   ↓ Attach source provenance
   
6. RENDER
   ↓ Display as native Relay geometry
```

---

### Step-by-Step

#### Step 1: Ingest
Accept source in native format.

```typescript
const source = ingestFile('budget.xlsx');
// OR
const source = connectLiveSystem('postgresql://...');
```

---

#### Step 2: Normalize
Parse and validate structure.

```typescript
const adapter = getAdapter(source.type);  // Excel, Git, SQL, etc.
const parsed = adapter.parse(source);
```

---

#### Step 3: Operationalize
Extract discrete operations.

```typescript
const operations = adapter.extractOperations(parsed);
// Result: Array<{ type, timestamp, actor, payload, ... }>
```

---

#### Step 4: Commit
Build filament commits.

```typescript
const filaments = adapter.buildFilaments(operations);
// Result: Array<Filament>
```

---

#### Step 5: Evidence
Attach source provenance.

```typescript
for (const filament of filaments) {
  adapter.attachEvidence(filament, source);
  // Evidence: { source: 'excel', originalFile: 'budget.xlsx', ... }
}
```

---

#### Step 6: Render
Display in Relay.

```typescript
renderFilaments(filaments, {
  mode: 'workflow',  // or 'spreadsheet', 'globe', etc.
  lensContext: 'import:excel:budget'
});
```

---

## Import Evidence Model

### Every Import Must Carry Evidence

**Required evidence fields:**
```typescript
interface ImportEvidence {
  source: string;              // System type: 'excel', 'git', 'sql', etc.
  originalId: string;          // Original identifier (filename, commit hash, row ID)
  importTimestamp: number;     // When imported (unix ms)
  importedBy: string;          // Who triggered import
  adapter: string;             // Adapter version used
  checksum?: string;           // Hash of source (for integrity)
  sourceMetadata?: object;     // Original system metadata
}
```

**Example:**
```javascript
{
  evidence: {
    source: 'git',
    originalId: 'abc123def456',  // Git commit hash
    importTimestamp: 1738001234567,
    importedBy: 'system',
    adapter: 'GitImportAdapter@1.0.0',
    checksum: 'sha256:9f86d081...',
    sourceMetadata: {
      repo: 'https://github.com/user/repo.git',
      branch: 'main',
      author: 'alice',
      message: 'Fix typo'
    }
  }
}
```

---

### Evidence Integrity

**Cryptographic verification:**
- Checksum ensures source wasn't tampered with
- Adapter version ensures consistent interpretation
- Import timestamp + actor ensures accountability

**Audit trail:**
```typescript
// Can prove: "This commit came from Git hash abc123, imported by system on 2026-01-27"
function verifyImportProvenance(commit: Commit): boolean {
  const evidence = commit.evidence as ImportEvidence;
  
  // 1. Verify checksum matches original source
  const sourceHash = computeHash(originalSource);
  if (sourceHash !== evidence.checksum) return false;
  
  // 2. Verify adapter is trusted
  if (!trustedAdapters.includes(evidence.adapter)) return false;
  
  // 3. Verify import timestamp is sane
  if (evidence.importTimestamp > Date.now()) return false;
  
  return true;
}
```

---

## Lossless Representation

### Non-Negotiable Rule

> **Import must be lossless: every historical state, every operation, every piece of metadata must be preserved as commits or evidence.**

**Why:**
- Relay is truth substrate, not lossy cache
- Audit trails require complete history
- Replay must be exact

---

### How to Achieve Losslessness

#### 1. **Preserve All Historical States**
Don't just import current state—import full history.

**Example (Excel):**
```javascript
// ❌ WRONG: Import only current values
const cells = getCurrentCellValues(sheet);

// ✅ RIGHT: Import full edit history
const cellHistories = getFullCellEditHistory(sheet);
for (const history of cellHistories) {
  for (const edit of history.edits) {
    appendCommit(filament, edit);
  }
}
```

---

#### 2. **Preserve All Relationships**
Don't flatten relationships—represent them as topology.

**Example (SQL foreign keys):**
```javascript
// ❌ WRONG: Denormalize and lose relationship
const orders = await db.query('SELECT * FROM orders JOIN customers ON ...');

// ✅ RIGHT: Represent as two filaments with topology
const orderFilament = importTable('orders');
const customerFilament = importTable('customers');

// Add topology references
for (const order of orders) {
  order.commit.refs = {
    inputs: [{
      filamentId: `customer:${order.customerId}`,
      commitIndex: 'latest'
    }]
  };
}
```

---

#### 3. **Preserve All Metadata**
Don't throw away "unimportant" fields—store in evidence.

**Example (File metadata):**
```javascript
// ✅ Store everything
commit.evidence = {
  source: 'filesystem',
  path: '/Users/alice/Documents/report.docx',
  size: 2457600,
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  created: '2025-01-15T10:30:00Z',
  modified: '2026-01-20T14:22:00Z',
  accessed: '2026-01-27T09:00:00Z',
  permissions: 'rw-r--r--',
  owner: 'alice',
  group: 'staff'
};
```

---

## Conflict Resolution

### When Importing from Multiple Sources

**Scenario:** Import the same entity from two systems (e.g., user exists in both AD and SQL database).

**Options:**

#### A) **Create Two Filaments** (Conservative)
Each system's truth is preserved separately.

```javascript
const adUser = importFromAD('user:alice');      // filament: ad:user:alice
const sqlUser = importFromSQL('users', 123);    // filament: sql:user:123

// User can choose which is authoritative, or keep both
```

---

#### B) **Merge with Evidence** (Aggressive)
Create one filament, preserve both sources in evidence.

```javascript
const user = createFilament('user:alice');

// Commit 0: Imported from AD
appendCommit(user, {
  op: 'USER_CREATED',
  payload: { name: 'Alice', email: 'alice@ad.com' },
  evidence: { source: 'active-directory', dn: 'CN=Alice,...' }
});

// Commit 1: Updated from SQL
appendCommit(user, {
  op: 'USER_UPDATED',
  payload: { email: 'alice@db.com' },  // Different email!
  evidence: { source: 'sql', table: 'users', id: 123 }
});

// Result: Both sources visible in history, user can see conflict
```

---

#### C) **Fork on Conflict** (Governance)
Create competing branches for conflicting truth.

```javascript
const user = createFilament('user:alice');

// Main branch: AD truth
user.branches['main'] = [
  { commitIndex: 0, payload: { email: 'alice@ad.com' }, evidence: { source: 'ad' } }
];

// Competing branch: SQL truth
user.branches['sql-import'] = [
  { commitIndex: 0, payload: { email: 'alice@db.com' }, evidence: { source: 'sql' } }
];

// User must resolve: which branch is authoritative?
```

---

## Real-World Scenarios

### Scenario 1: Migrate from Excel to Relay

**Goal:** Import 10 years of budget spreadsheets, preserve full edit history.

**Process:**
1. Scan folder: `budgets/*.xlsx`
2. For each file, parse with ExcelImportAdapter
3. Extract cell edit history (if tracked), or use file modified dates
4. Create one filament per sheet
5. Render in Relay as auditable filament history

**Result:**
- 10 years of budgets now visible as TimeBoxes
- Can replay any cell edit
- Can see who changed what, when
- Can compare budget versions across years

---

### Scenario 2: Import Git Repo for Code Review

**Goal:** Import open-source project, render codebase as filaments with dependencies.

**Process:**
1. Clone repo: `git clone https://github.com/user/project.git`
2. Parse with GitImportAdapter
3. Extract commits, map to semantic operations (RENAME, ADD_FUNCTION, etc.)
4. Create one filament per file
5. Extract dependencies (imports) as topology

**Result:**
- Entire codebase rendered as 3D filaments
- Dependency rays show module relationships
- Can see function rename impact on downstream files
- Code review becomes visual geometry inspection

---

### Scenario 3: Audit Active Directory Changes

**Goal:** Import AD change log, render org structure with temporal permission changes.

**Process:**
1. Export AD: `ldifde -f ad-dump.ldif`
2. Parse with ActiveDirectoryAdapter
3. Extract user/group/OU changes over time
4. Create filaments for each AD object
5. Render org structure with time slider

**Result:**
- Can see: "Who had Admin rights on 2025-06-15?"
- Can replay: "When was Alice added to Finance group?"
- Can audit: "Who granted Bob access to payroll?"

---

## Technical Architecture

### Import Pipeline

```
┌─────────────────────────────────────────────────┐
│             SOURCE SYSTEMS                      │
│  Excel | Git | SQL | AD | Docker | Files | ... │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│            IMPORT ADAPTERS                      │
│  ExcelAdapter | GitAdapter | SQLAdapter | ...  │
└────────────┬────────────────────────────────────┘
             │
             ↓ (parse, normalize, operationalize)
             │
┌─────────────────────────────────────────────────┐
│         COMMIT BUILDER                          │
│  (Build filaments with commits + evidence)      │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│           FILAMENT STORE                        │
│  (Git-backed, immutable, versioned)             │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│          RENDERER                               │
│  (3D visualization, lenses, playback)           │
└─────────────────────────────────────────────────┘
```

---

### Adapter Registry

```typescript
const adapterRegistry = new Map<string, ImportAdapter>();

// Register adapters
adapterRegistry.set('excel', new ExcelImportAdapter());
adapterRegistry.set('git', new GitImportAdapter());
adapterRegistry.set('sql', new SQLImportAdapter());
adapterRegistry.set('ad', new ActiveDirectoryAdapter());
adapterRegistry.set('docker', new DockerImportAdapter());
adapterRegistry.set('filesystem', new FileSystemAdapter());
// ... infinite extensibility

// Auto-detect and import
function importAny(source: unknown): Filament[] {
  const type = detectSourceType(source);
  const adapter = adapterRegistry.get(type);
  
  if (!adapter) {
    throw new Error(`No adapter for source type: ${type}`);
  }
  
  return adapter.buildFilaments(
    adapter.extractOperations(
      adapter.parse(source)
    )
  );
}
```

---

## FAQ

### General

**Q: Can Relay really import *anything*?**  
A: Yes, if there's an adapter. Adapters are extensible—anyone can write one. The adapter just needs to extract semantic operations and build commits.

**Q: What if the source system doesn't have history?**  
A: Import creates one commit representing current state, with evidence noting "no historical data available." Future changes become new commits.

**Q: What about binary files (images, videos)?**  
A: Binary files are stored as evidence pointers (e.g., IPFS hash, S3 URL). Filament commits track metadata (created, modified, accessed). The binary itself is not duplicated.

---

### Performance

**Q: Won't importing huge systems (like 10 years of SQL database) be slow?**  
A: Yes, initial import can be slow. But:
- Import is one-time (or incremental after that)
- Import can run in background
- Once imported, Relay rendering is fast (commits are already structured)

**Q: How do you handle millions of rows?**  
A: Group by entity. Not every row needs its own filament—only entities with meaningful lifecycle. For static reference tables, import as configuration filaments.

---

### Security

**Q: What if the imported data contains secrets (passwords, API keys)?**  
A: Import adapter should detect and redact secrets, storing them as evidence pointers to secure vaults. Never embed secrets in commits.

**Q: Can I import data without giving Relay access to the source system?**  
A: Yes. Export from source system (e.g., CSV, JSON dump), then import the export. Adapter works on static snapshots.

---

### Governance

**Q: Who can import data?**  
A: Import requires permission. Typically:
- System admins can import anything
- Domain owners can import their domain data
- Users can import their personal files

**Q: Can imported filaments be edited in Relay?**  
A: Yes, once imported, they're native Relay filaments. You can append new commits, fork branches, etc.

**Q: What if the source system updates after import?**  
A: Use **live import** (continuous sync). Adapter polls source system, appends new commits for changes.

---

## Conclusion

Universal Import makes Relay the **computational substrate for all reality**:

- ✅ Any system can be imported (Excel, Git, SQL, AD, Docker, files, ...)
- ✅ Import is lossless (full history + metadata preserved)
- ✅ Import is semantic (operations extracted, not raw bytes)
- ✅ Import is auditable (evidence attached to every commit)
- ✅ Import is extensible (anyone can write adapters)

**The One-Sentence Lock:**

> **Relay is not "another system"—it is the universal truth substrate that can receive, understand, interpret, and render any reality from any source as inspectable, governed filaments.**

---

**See Also:**
- [Cybersecurity Model](CYBERSECURITY-MODEL-SPEC.md)
- [Filament System Overview](FILAMENT-SYSTEM-OVERVIEW.md)
- [Code as Filaments](CODE-AS-FILAMENTS-SPEC.md)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Specification*  
*Version: 1.0.0*
