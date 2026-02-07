# Relay Archive Index

**Created**: 2026-02-06  
**Purpose**: Preserve historical progress, prevent repository bloat  
**Rule**: Archive, don't delete (all moves are reversible)

---

## What's Archived and Why

### status-reports/ (115 files)

**Historical progress tracking**. These documented implementation milestones but are not part of the gold standard documentation.

#### phase-completions/ (63 files)
- All `*-COMPLETE.md` files
- Examples: TOPOLOGY-IMPLEMENTATION-COMPLETE.md, EXCEL-IMPORT-PROOF-COMPLETE.md
- **Reason**: Superseded by CHANGELOG.md and docs/

#### architecture-locks/ (7 files)
- All `*-LOCKED.md` files
- Examples: ARCHITECTURE-C10-LOCKED.md, TOPOLOGY-PHYSICS-LOCKED.md
- **Reason**: Architectural decisions now in docs/architecture/

#### implementation-records/ (30 files)
- All `*-IMPLEMENTATION-*.md`, `*-FIX-*.md`, `*-PROOF-*.md`
- Examples: RELAY-NATIVE-IMPLEMENTATION-SUMMARY.md, TREE-VIEW-DEBUG-COMPLETE.md
- **Reason**: Implementation details now in docs/implementation/

#### canon-directives/ (9 files)
- Historical CANON-*.md directives
- Examples: CANON-PHASE-1-RULING.md, CANON-TEST-CHECKLIST.md
- **Reason**: Current directives in docs/governance/, rest are historical

#### session-reports/ (6 files)
- All `*-SUMMARY.md` session reports
- Examples: VISION-LOCKED-SESSION-SUMMARY.md, COMPLETE-SESSION-SUMMARY-2026-01-31.md
- **Reason**: Consolidated into CHANGELOG.md

---

### commit-history/ (211 files)

**Development snapshots** preserved for historical research.

- **Commit Nodes/**: Full history of "commit" snapshots (Commit 0, 1, 2, 3, 5, 10, History, GDrive, Next Commit)
- **relay/**: CLI experiments (4 files)

**Preservation reason**: Understanding system evolution, architectural decision history.

---

### prototypes/ (To be added)

**Experimental implementations** replaced by production system.

- **filament-spreadsheet-prototype.html**: Three.js prototype (replaced by Cesium)
- **test-file-upload.html**: Upload testing
- **diagnose-county-visibility.html**: Debug tool

**Lessons preserved**:
- Proportionate scaling (branch → sheet → cell)
- LOD hysteresis implementation
- Renderer-agnostic state pattern
- Timebox segmentation topology

---

### 2024-2025-v93-react-app/ (To be added - 2,089 files)

**Full v93 React + Cesium application** (backend + frontend).

**Contents**:
- src/backend/ (1,454 files)
- src/frontend/ (506 files)
- public/ (444 files)
- index.html (React entry point)

**Archived**: 2026-02-06  
**Reason**: Replaced by relay-cesium-world.html (Cesium-first single-file architecture)

**Core logic extracted to**:
- core/models/commitTypes/
- core/models/governance/
- core/services/boundaries/
- core/services/state-drift/

---

### legacy-docs/ (To be added)

**Superseded documentation** replaced by gold standard in docs/.

- documentation/ folder (160 files)
- Duplicate/outdated root-level docs

**Reason**: Consolidated into single docs/ gold standard with clear index.

---

## Archive Statistics

| Category | Files | Size | Status |
|----------|-------|------|--------|
| Status Reports | 115 | ~2MB | ✅ Archived |
| Commit History | 211 | ~50MB | ✅ Archived |
| Prototypes | ~5 | ~2MB | ⏳ Pending |
| v93 React App | 2,089 | ~80MB | ⏳ Pending |
| Legacy Docs | 160 | ~5MB | ⏳ Pending |
| **TOTAL** | **2,580** | **~139MB** | **45% Complete** |

---

## How to Use This Archive

### Finding Historical Implementation Details
```
1. Check status-reports/implementation-records/
2. Look for *-IMPLEMENTATION-*.md or *-COMPLETE.md
3. Cross-reference with commit-history/ for code snapshots
```

### Understanding Architectural Decisions
```
1. Check status-reports/architecture-locks/
2. Read ARCHITECTURE-C*.md files
3. See evolution from C10 → C14 → C18
```

### Researching Evolution
```
1. Start with commit-history/Commit-Nodes/
2. Read chronologically: Commit 0 → 1 → 2 → 3 → 5 → 10
3. Cross-reference with session-reports/
```

### Restoring Old System (If Needed)
```
1. Locate in 2024-2025-v93-react-app/
2. Copy src/ back to root
3. Restore index.html
4. Run: npm install && npm run dev:backend && npm run dev:frontend
```

---

## Archive Integrity

**Verification**:
- All moves logged in: MOVE-LOG.txt
- Full audit trail: timestamp | source → dest | reason
- Git history preserved: All moves are git operations

**Rollback**:
```powershell
# If needed, restore from archive:
Copy-Item archive\[folder]\* .\ -Recurse -Force
```

---

## What's NOT Archived

### Active Application
- `relay-cesium-world.html` (production app)
- `core/` (business logic)
- `data/boundaries/` (essential GeoJSON files)
- `docs/` (gold standard documentation)

### Development Infrastructure
- `scripts/` (build/maintenance tools)
- `tests/` (test suites)
- `.relay/` (CLI tools)
- `config/` (configuration)
- `.github/`, `.husky/`, `.vscode/` (development setup)

### Project Root
- `README.md`, `LICENSE`, `package.json`, `.gitignore`
- Working documentation (temporary, will move to docs/)

---

## Last Updated

2026-02-06: Initial archive creation (Phase 1 complete)
