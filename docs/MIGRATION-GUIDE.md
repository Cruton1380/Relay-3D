# 🗺 Relay File Path Migration Guide

**Created**: 2026-02-06  
**Purpose**: Map old file paths to new locations after reorganization  
**Lock E**: Preserve link integrity - this document enables safe doc updates

---

## Why This Document Exists

During the Cesium migration and cleanup (2026-02-06), we reorganized ~2,580 files to:
- Archive historical progress (115 status reports, 211 commit nodes)
- Create single gold standard docs area (`docs/`)
- Establish modular architecture (`core/`, `app/`)
- Preserve all work (no deletions, only moves)

**If you're looking for a file that "used to be at the root" or "was in documentation/", this guide shows you where it moved.**

---

## Quick Reference by Category

| Old Location | New Location | Category |
|--------------|--------------|----------|
| `documentation/**` | `docs/**` | Documentation |
| `*-COMPLETE.md` (root) | `archive/status-reports/phase-completions/` | Status reports |
| `*-LOCKED.md` (root) | `archive/status-reports/architecture-locks/` | Architecture locks |
| `CANON-*.md` (root) | `archive/status-reports/canon-directives/` | Canon directives |
| `Commit Nodes/**` | `archive/commit-history/Commit-Nodes/` | Historical commits |
| `filament-spreadsheet-prototype.html` | `archive/prototypes/` | Three.js prototype |
| `src/backend/**` | `archive/2024-2025-v93-react-app/src/backend/` | v93 backend |
| `src/frontend/**` | `archive/2024-2025-v93-react-app/src/frontend/` | v93 frontend |
| `index.html` (React entry) | `archive/2024-2025-v93-react-app/` | v93 app entry |

---

## Detailed Path Mappings

### Documentation (160+ files)

#### Root Documentation → docs/

| Old Path | New Path | Notes |
|----------|----------|-------|
| `documentation/` (entire folder) | `docs/` or `archive/legacy-docs/` | Consolidated or archived |
| `README.md` (root) | `docs/README-RELAY.md` | Root README now points to docs |
| `CONTRIBUTING.md` | `../CONTRIBUTING.md` | Stays at root |
| `LICENSE` | `../LICENSE` | Stays at root |

#### Key Documentation Files

| Old Path | New Path |
|----------|----------|
| `RELAY-GENESIS-PRINCIPLES.md` | `docs/architecture/GENESIS-PRINCIPLES.md` |
| `RELAY-FINAL-ARCHITECTURE-SPEC.md` | `docs/architecture/CESIUM-FIRST.md` |
| `RELAY-DESIGN-PRINCIPLES-REVIEW.md` | `docs/architecture/DESIGN-PRINCIPLES.md` |
| `BUSINESS-BEST-PRACTICES-ADOPTION.md` | `docs/governance/BUSINESS-PRACTICES.md` |
| `CANON-CUSTODY.md` | `docs/governance/CANON-CUSTODY.md` |
| `CANON-INVARIANTS.md` | `docs/governance/CANON-INVARIANTS.md` |

---

### Status Reports (115 files)

#### Phase Completions (63 files)

**Pattern**: `*-COMPLETE.md` → `archive/status-reports/phase-completions/`

| Example Old Path | New Path |
|------------------|----------|
| `TOPOLOGY-IMPLEMENTATION-COMPLETE.md` | `archive/status-reports/phase-completions/TOPOLOGY-IMPLEMENTATION-COMPLETE.md` |
| `EXCEL-IMPORT-PROOF-COMPLETE.md` | `archive/status-reports/phase-completions/EXCEL-IMPORT-PROOF-COMPLETE.md` |
| `CESIUM-PHASE-0-COMPLETE.md` | `archive/status-reports/phase-completions/CESIUM-PHASE-0-COMPLETE.md` |
| `RELAY-TREE-CRASH-FIXES-COMPLETE.md` | `archive/status-reports/phase-completions/RELAY-TREE-CRASH-FIXES-COMPLETE.md` |

#### Architecture Locks (7 files)

**Pattern**: `*-LOCKED.md` → `archive/status-reports/architecture-locks/`

| Old Path | New Path |
|----------|----------|
| `ARCHITECTURE-C10-LOCKED.md` | `archive/status-reports/architecture-locks/ARCHITECTURE-C10-LOCKED.md` |
| `TOPOLOGY-PHYSICS-LOCKED.md` | `archive/status-reports/architecture-locks/TOPOLOGY-PHYSICS-LOCKED.md` |

#### Implementation Records (30 files)

**Pattern**: `*-IMPLEMENTATION-*.md`, `*-FIX-*.md`, `*-PROOF-*.md` → `archive/status-reports/implementation-records/`

| Example Old Path | New Path |
|------------------|----------|
| `RELAY-NATIVE-IMPLEMENTATION-SUMMARY.md` | `archive/status-reports/implementation-records/RELAY-NATIVE-IMPLEMENTATION-SUMMARY.md` |
| `TREE-VIEW-DEBUG-COMPLETE.md` | `archive/status-reports/implementation-records/TREE-VIEW-DEBUG-COMPLETE.md` |
| `TOPOLOGY-FIX-COMPLETE.md` | `archive/status-reports/implementation-records/TOPOLOGY-FIX-COMPLETE.md` |

#### Canon Directives (9 files)

**Pattern**: `CANON-*.md` → `archive/status-reports/canon-directives/`

| Old Path | New Path |
|----------|----------|
| `CANON-PHASE-1-RULING.md` | `archive/status-reports/canon-directives/CANON-PHASE-1-RULING.md` |
| `CANON-TEST-CHECKLIST.md` | `archive/status-reports/canon-directives/CANON-TEST-CHECKLIST.md` |
| `CANON-UNIFICATION-DIRECTIVE.md` | `archive/status-reports/canon-directives/CANON-UNIFICATION-DIRECTIVE.md` |

#### Session Reports (6 files)

**Pattern**: `*-SUMMARY.md` → `archive/status-reports/session-reports/`

| Old Path | New Path |
|----------|----------|
| `VISION-LOCKED-SESSION-SUMMARY.md` | `archive/status-reports/session-reports/VISION-LOCKED-SESSION-SUMMARY.md` |
| `COMPLETE-SESSION-SUMMARY-2026-01-31.md` | `archive/status-reports/session-reports/COMPLETE-SESSION-SUMMARY-2026-01-31.md` |

---

### Commit History (211 files)

**Pattern**: `Commit Nodes/**` → `archive/commit-history/Commit-Nodes/`

| Old Path | New Path |
|----------|----------|
| `Commit Nodes/Commit 0/` | `archive/commit-history/Commit-Nodes/Commit 0/` |
| `Commit Nodes/Commit 3 Meaning of Life/` | `archive/commit-history/Commit-Nodes/Commit 3 Meaning of Life/` |
| `Commit Nodes/GDrive/` | `archive/commit-history/Commit-Nodes/GDrive/` |
| `Commit Nodes/Next Commit/` | `archive/commit-history/Commit-Nodes/Next Commit/` |

---

### Prototypes

| Old Path | New Path | Status |
|----------|----------|--------|
| `filament-spreadsheet-prototype.html` | `archive/prototypes/filament-spreadsheet-prototype.html` | ⏳ Pending |
| `test-file-upload.html` | `archive/prototypes/test-file-upload.html` | ⏳ Pending |
| `diagnose-county-visibility.html` | `archive/prototypes/diagnose-county-visibility.html` | ⏳ Pending |

---

### v93 React Application (2,089 files)

| Old Path | New Path | Status |
|----------|----------|--------|
| `src/backend/**` | `archive/2024-2025-v93-react-app/src/backend/` | ⏳ Pending |
| `src/frontend/**` | `archive/2024-2025-v93-react-app/src/frontend/` | ⏳ Pending |
| `public/**` | `archive/2024-2025-v93-react-app/public/` | ⏳ Pending |
| `index.html` (React) | `archive/2024-2025-v93-react-app/index.html` | ⏳ Pending |

**Core logic extracted to**:
- `core/models/commitTypes/` ← `src/backend/commitTypes/`
- `core/models/governance/` ← `src/backend/governance/`
- `core/services/boundaries/` ← `src/backend/services/boundaries/`
- `core/services/state-drift/` ← `src/backend/services/state-drift/`

---

### New Structure (Active Application)

#### Core (Renderer-Agnostic, Lock F)

| Path | Description | Lock F |
|------|-------------|--------|
| `core/utils/relay-log.js` | Logging system | ✅ No Cesium |
| `core/models/relay-state.js` | State model | ✅ No Cesium |
| `core/services/lod-governor.js` | LOD management | ✅ No Cesium |
| `core/services/boundaries/` | Boundary logic | ✅ No Cesium |

#### App (Cesium-Specific)

| Path | Description | May Import Cesium |
|------|-------------|-------------------|
| `app/cesium/viewer-init.js` | Viewer initialization | ✅ Yes |
| `app/renderers/filament-renderer.js` | Filament rendering | ✅ Yes |
| `app/ui/hud-manager.js` | HUD management | ✅ Yes |
| `app/excel-importer.js` | Excel import | ❌ No (uses core) |

#### Entry Points

| Path | Description | Type |
|------|-------------|------|
| `relay-cesium-world.html` | Production app (monolith - to be deprecated) | HTML |
| `relay-cesium-world-modular.html` | Production app (modular) | HTML + ES6 modules |

---

## How to Use This Guide

### Updating Old Links

**Before** (broken link):
```markdown
See [Architecture Spec](RELAY-FINAL-ARCHITECTURE-SPEC.md)
```

**After** (use the canonical doc - relative from repo root):
```markdown
See [Architecture Spec](./docs/architecture/RELAY-CESIUM-ARCHITECTURE.md)
```

**Or from within docs/ folder**:
```markdown
See [Architecture Spec](./architecture/RELAY-CESIUM-ARCHITECTURE.md)
```

### Searching for Old Files

1. **Check this guide first** (Ctrl+F for filename)
2. If not found, search `archive/`:
   ```bash
   # PowerShell
   Get-ChildItem -Path "archive" -Recurse -Filter "*filename*"
   
   # Or use grep
   grep -r "filename" archive/
   ```
3. Check `archive/MOVE-LOG.txt` for exact move history

### Restoring Old Files

If you need to restore something:

```bash
# Copy from archive back to root
Copy-Item archive/path/to/file.md ./
```

**All moves are logged in**: `archive/MOVE-LOG.txt`

---

## Link Audit Status

Run link audit to verify documentation integrity:

```bash
npm run link-audit
```

**Last Audit**: 2026-02-06 (pending first run)  
**Broken Links**: TBD

---

## Appendix: Regex Patterns for Bulk Updates

If you need to update many links at once:

### Status Reports
```regex
# Find
\]\((RELAY|TOPOLOGY|PHASE|CESIUM|EXCEL).*-COMPLETE\.md\)

# Replace (check category first)
](archive/status-reports/phase-completions/\1...-COMPLETE.md)
```

### Documentation
```regex
# Find
\]\(documentation/(.+)\.md\)

# Replace
](docs/\1.md)
```

### Commit Nodes
```regex
# Find
\]\(Commit Nodes/(.+)\)

# Replace
](archive/commit-history/Commit-Nodes/\1)
```

---

## Questions?

- **File not in this guide?** Check `archive/ARCHIVE-INDEX.md`
- **Move was wrong?** Check `archive/MOVE-LOG.txt` and reverse it
- **Link still broken?** Open an issue with path details

---

*This migration guide is part of Lock E: Documentation must compile with no broken links.*
