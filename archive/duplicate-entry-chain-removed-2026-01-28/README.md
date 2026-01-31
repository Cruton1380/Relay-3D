# Archived: Duplicate Entry Chain (2026-01-28)

## Why These Files Were Removed

These files were creating a **duplicate frontend entry point** that caused:
- Vite serving `/src/main.jsx` → `/src/App.jsx` (minimal demo)  
- Developers editing `/src/frontend/main.jsx` → `/src/frontend/App.jsx` (full app)
- Changes to `/src/frontend/App.jsx` not appearing in browser
- Wasted development time editing "orphaned" code

## Files Archived

- `main.jsx.REMOVED` - Minimal entry point (was at `/src/main.jsx`)
- `App.jsx.REMOVED` - Minimal HashRouter app with 5 demo routes (was at `/src/App.jsx`)

## The Fix

1. **Canonical entry chain** is now:  
   `/index.html` → `/src/frontend/main.jsx` → `/src/frontend/App.jsx`

2. **Guardrails added**:
   - `scripts/verify-entry.mjs` - Checks for duplicate entry files
   - `npm run verify:entry` - Runs the check
   - Pre-commit hook (optional) to prevent duplicates

## What Was in the Archived Files

The archived `/src/App.jsx` had:
- HashRouter with 5 routes: `/`, `/filament-demo`, `/workflow-proof`, `/proof`, `/globe`, `/system`
- Embedded console.log statements in JSX (antipattern)
- Basic ErrorBoundary
- Imports from `/src/frontend/*` components

These routes were **already present** in `/src/frontend/App.jsx` with better routing structure.

## Recovery Instructions

If you need to reference these files:
```bash
cat archive/duplicate-entry-chain-removed-2026-01-28/App.jsx.REMOVED
```

**DO NOT restore these files.** They create the duplicate entry problem.
