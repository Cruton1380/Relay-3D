# 🔒 ROOT CONTRACT

**Enforced**: 2026-02-06  
**Purpose**: Maintain workspace coherence - one app, one truth, one docs home

---

## Root Directory Must Contain ONLY

### Active Application
- `relay-cesium-world.html` - Single production entrypoint
- `index.html` - Points to active app

### Essential Documentation
- `README.md` - Project overview
- `CHANGELOG.md` - Version history
- `ROOT-CONTRACT.md` - This file

### Configuration Files
- `package.json`
- `.gitignore`
- `.eslintrc.*`
- `vitest.config.js`
- `playwright.config.js`

### Core Directories
- `app/` - Cesium-specific rendering code
- `core/` - Renderer-agnostic business logic (NO Cesium imports - Lock F)
- `data/` - GeoJSON, boundaries, sample files
- `docs/` - **Single** gold standard documentation
- `archive/` - Historical progress (read-only)
- `scripts/` - Build, dev server, maintenance tools
- `tests/` - Test suites
- `tools/` - CLI utilities (.relay/)
- `config/` - Configuration files (if needed)

### Development Infrastructure
- `.github/` - CI/CD workflows
- `.husky/` - Git hooks
- `.vscode/` - Editor config
- `.cursor/` - Cursor IDE config
- `node_modules/` - Dependencies

---

## ❌ VIOLATIONS

Anything else at root is a violation:

### Forbidden at Root
- ❌ Multiple HTML entrypoints (only ONE: relay-cesium-world.html)
- ❌ Status reports (*-COMPLETE.md, *-SUMMARY.md, etc.) → `archive/status-reports/`
- ❌ Canon directives (CANON-*.md) → `archive/status-reports/canon-directives/` or `docs/governance/`
- ❌ Historical commit folders (Commit Nodes/) → `archive/commit-history/`
- ❌ Legacy documentation (documentation/) → `archive/legacy-docs/`
- ❌ Prototype HTML files → `archive/prototypes/`
- ❌ Temporary test files → `archive/temp/` or delete
- ❌ Duplicate folders (src/ if archived v93 app)

---

## 🔍 AUDIT COMMAND

Check root compliance:

```powershell
# List ONLY root files/folders (not nested)
Get-ChildItem -Path . -Force | Where-Object { 
    $_.Name -notmatch '^(node_modules|\.git)$' 
} | Select-Object Name, @{Name='Type';Expression={if($_.PSIsContainer){'DIR'}else{'FILE'}}}
```

Expected output should show ONLY items from "Root Directory Must Contain ONLY" section above.

---

## 🚨 ENFORCEMENT

**Before any commit**:
1. Run: `node scripts/root-audit.mjs`
2. If violations found: move to archive/ or delete
3. Commit ONLY when audit passes

**This contract is enforced by**:
- Code review
- Pre-commit hook (planned)
- CI/CD gate (planned)

---

## 📊 REVERSIBILITY

**"But I need reversibility!"**

Reversibility is already covered by:
1. **Git history** - every move is tracked
2. **`archive/MOVE-LOG.txt`** - timestamped move log
3. **`archive/ARCHIVE-INDEX.md`** - what moved where

**Root duplicates are NOT required for reversibility.**

---

## 🎯 THE GOAL

When you open the root directory, you should immediately see:

✅ **One active application** (relay-cesium-world.html)  
✅ **One docs home** (docs/)  
✅ **One archive** (archive/)  
✅ **Four clear lanes** (app/, core/, data/, docs/)

No visual clutter. No "which system is active?" No "3 competing truths."

---

*This contract enforces Relay's "One Truth" principle at the filesystem level.*
