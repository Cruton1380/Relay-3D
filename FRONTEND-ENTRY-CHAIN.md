# Frontend Entry Chain - Single Source of Truth

## ⚠️ CRITICAL: Do NOT Create Duplicate Entry Files

This document defines the **ONLY** frontend entry chain for the Relay project.

---

## Canonical Entry Chain

```
/index.html (line 34)
  └─→ /src/frontend/main.jsx  ← CANONICAL ENTRY POINT
       └─→ /src/frontend/App.jsx  ← CANONICAL APP COMPONENT
            └─→ BrowserRouter with all routes
```

---

## Files That MUST NOT Exist

The following files **MUST NOT** be created as they create duplicate entry points:

- ❌ `/src/main.jsx` (archived on 2026-01-28)
- ❌ `/src/App.jsx` (archived on 2026-01-28)
- ❌ Any other `main.{jsx,tsx,js,ts}` file
- ❌ Any other `App.{jsx,tsx,js,ts}` file at project root

**If you find these files, they are stale and should be deleted immediately.**

---

## Verification

Run this command before every commit:
```bash
npm run verify:entry
```

This script checks for:
- Exactly 1 `main.jsx` file in the project
- Exactly 1 `App.jsx` file in the project
- `index.html` points to the canonical entry
- No orphaned route definitions

**Exit code 0 = pass | Exit code 1 = violations found**

---

## Pre-commit Hook

A Husky pre-commit hook runs `npm run verify:entry` automatically.

To bypass (EMERGENCY ONLY):
```bash
git commit --no-verify -m "message"
```

**⚠️ Only bypass if you plan to fix the entry chain immediately!**

---

## Routing Structure

Default route (`/`) is **intentionally** set to:
```jsx
<Route path="/" element={<RelaySystemDemo />} />
```

All routes are defined in `/src/frontend/App.jsx` lines 86-240.

**Demo routes** (full-screen, no header/footer):
- `/` - Relay System Demo (default)
- `/system` - Relay System Demo (alias)
- `/filament-demo` - Filament visualization
- `/coordination-graph` - Graph explorer
- `/globe` - 3D globe interface

**Application routes** (with header/footer):
- `/login`, `/dashboard`, `/voting`, `/channels`, etc.

---

## How This Architecture Bug Happened

### The Problem (Fixed 2026-01-28)

1. **Two entry chains existed:**
   - `index.html` → `/src/main.jsx` → `/src/App.jsx` (active, minimal)
   - `/src/frontend/main.jsx` → `/src/frontend/App.jsx` (dormant, full-featured)

2. **Vite served the minimal chain**, but developers edited the full-featured chain

3. **Changes never appeared** because they were editing orphaned code

### The Root Cause

- Historical migration left duplicate files
- No guardrails prevented duplicate entries
- `index.html` pointed to wrong file

### The Fix

1. ✅ Updated `index.html` to point to `/src/frontend/main.jsx`
2. ✅ Deleted `/src/main.jsx` and `/src/App.jsx`  
3. ✅ Archived old files with documentation
4. ✅ Added `verify-entry.mjs` script
5. ✅ Added pre-commit hook
6. ✅ Added canonical markers in entry files

---

## How to Avoid This Forever

### 1. **Never create new entry files**
   - If you need a new entry point, you're probably doing it wrong
   - Coordinate with the team first

### 2. **Run verification locally**
   ```bash
   npm run verify:entry
   ```

### 3. **Trust the pre-commit hook**
   - If it blocks your commit, **fix the issue**
   - Don't bypass with `--no-verify` unless emergency

### 4. **Check for duplicate main/App files in code review**

### 5. **If Vite isn't picking up your changes:**
   - ✅ Verify you're editing `/src/frontend/App.jsx` (not `/src/App.jsx`)
   - ✅ Check `index.html` line 34 points to `/src/frontend/main.jsx`
   - ✅ Run `npm run verify:entry`
   - ❌ DON'T create a new main.jsx file to "fix" it

---

## Emergency Recovery

If you accidentally create duplicate entry files:

```bash
# 1. Run verification to find duplicates
npm run verify:entry

# 2. If violations found, delete the duplicates
# (Keep only /src/frontend/main.jsx and /src/frontend/App.jsx)

# 3. Verify the fix
npm run verify:entry

# 4. Restart dev server
npm run dev:frontend
```

---

## Questions?

**Q: Why can't I have multiple App.jsx files for different features?**  
A: That's not how React works. You have ONE App component with routing. Create separate *page* components instead.

**Q: What if I need a different entry for mobile/desktop?**  
A: Use responsive design or conditional rendering in the single App.jsx. Don't create duplicate entry chains.

**Q: The verification script is blocking my commit but I need to push now!**  
A: Fix the violation. It takes < 5 minutes and prevents days of debugging later.

---

**Last updated:** 2026-01-28  
**Maintainer:** Architecture Team  
**Status:** ✅ ENFORCED
