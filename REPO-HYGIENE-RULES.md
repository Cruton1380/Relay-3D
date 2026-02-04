# 🧹 RELAY REPOSITORY HYGIENE RULES

**Status**: LOCKED ✅  
**Applies to**: All Relay core repositories  
**Purpose**: Prevent repository bloat, ensure fast clones, avoid push timeouts

---

## 🚫 NEVER COMMIT THESE

### **Large Binary Files**
❌ Videos (`.mp4`, `.mov`, `.avi`, `.mkv`)  
❌ Images > 500KB (use optimized PNGs or links)  
❌ PDFs > 2MB (link to external storage)  
❌ Archives (`.zip`, `.7z`, `.tar.gz`, `.rar`)  
❌ Datasets (`.csv` > 1MB, `.json` > 500KB)  
❌ Binary executables (`.exe`, `.dll`, `.so`, `.dylib`)

### **Generated Artifacts**
❌ Build outputs (`/dist`, `/build`, `/out`)  
❌ Dependency caches (`/node_modules`, `/.venv`, `/vendor`)  
❌ Log files (`*.log`)  
❌ Temporary files (`*.tmp`, `*.temp`, `.DS_Store`)  
❌ IDE metadata (`.vscode/`, `.idea/`, except explicitly tracked configs)

### **Office Document Binaries** (Critical for Relay repos)
❌ Word documents (`.docx`, `.doc`) — Use Markdown instead  
❌ PowerPoint (`.pptx`, `.ppt`) — Use Mermaid diagrams or links  
❌ Excel (`.xlsx`, `.xls`) — Use CSV or JSON schemas  
❌ Office temp files (`~$*.docx`, `~WRL*.tmp`)

---

## ✅ APPROVED ALTERNATIVES

### **For Documentation**
✅ Markdown (`.md`) — Human-readable, diff-friendly, small  
✅ Plain text (`.txt`) — Always acceptable  
✅ YAML/JSON schemas (`.yaml`, `.json`) — Configuration/data  
✅ Mermaid diagrams (embedded in Markdown) — Visual diagrams as code

### **For Large Media**
✅ YouTube links (demos, walkthroughs)  
✅ Google Drive / Dropbox links (PDFs, videos, datasets)  
✅ GitHub Releases (binaries for distribution)  
✅ Git LFS (ONLY if explicitly approved by maintainer)

### **For Images**
✅ Optimized PNGs < 500KB (screenshots, diagrams)  
✅ SVGs (vector graphics, infinitely scalable)  
✅ Links to external image hosts (for large images)

---

## 🛡️ ENFORCEMENT

### **`.gitignore` Rules** (Already Applied)
All prohibited file types are automatically ignored. See `.gitignore` for full list.

### **Pre-Commit Checks** (Future: CI/CD)
```yaml
pre_commit_checks:
  - block_large_files: max_size_kb: 500
  - block_binaries: [.exe, .dll, .so, .zip, .mp4, .docx]
  - require_markdown: for documentation
```

### **Pull Request Review**
Any PR adding files > 500KB will be rejected unless:
1. Explicitly approved by maintainer
2. Added to Git LFS with justification
3. Converted to Markdown/link alternative

---

## 🔥 CLEANUP PROCESS (If You Accidentally Committed Binaries)

### **Before Push**
```bash
# Unstage large files
git reset HEAD path/to/large-file.docx

# Add to .gitignore
echo "*.docx" >> .gitignore
git add .gitignore
git commit -m "chore: ignore binaries"
```

### **After Push** (Requires history rewrite)
```bash
# Remove from all history (CAUTION: rewrites history)
git filter-branch --tree-filter 'rm -f path/to/large-file.docx' HEAD

# Force push (coordinate with team first!)
git push origin --force --all
```

**Better**: Convert to Markdown BEFORE committing.

---

## 📊 WHY THIS MATTERS

### **Without Binary Hygiene**
- Push timeouts (HTTP 408 errors on large repos)
- Slow clones (minutes → hours for new contributors)
- Wasted bandwidth (binaries are not compressible)
- Merge conflicts (binary diffs are useless)
- Lost history (can't see what changed in a `.docx`)

### **With Binary Hygiene**
- Fast pushes (< 10 seconds for text-only commits)
- Fast clones (< 30 seconds for entire repo)
- Meaningful diffs (line-by-line changes visible)
- No merge conflicts on documentation
- Full audit trail (Markdown changes are readable)

---

## 🔒 FINAL RULE

**If it's not human-readable in a diff, it doesn't belong in the repo.**

**Exception**: Optimized images < 500KB for critical UI/UX documentation only.

---

## 📋 CHECKLIST FOR CONTRIBUTORS

Before committing:
- [ ] Is this file text-based (Markdown, code, JSON, YAML)?
- [ ] If binary, is it < 500KB and absolutely necessary?
- [ ] Have I checked `.gitignore` to ensure it's not prohibited?
- [ ] Could this be a link instead (YouTube, Drive, external host)?
- [ ] Have I converted Word docs to Markdown?

**If any answer is uncertain, ask before committing.**

---

**Status**: LOCKED ✅  
**Effective**: Immediately for all future commits  
**Applies to**: All Relay repositories (core, docs, examples)

**This rule exists because we already hit a push timeout due to `.docx` files. Don't repeat it.** 🧹
