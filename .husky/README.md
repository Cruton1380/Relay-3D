# Husky Git Hooks

## Pre-commit Hook

The pre-commit hook runs `npm run verify:entry` to prevent commits that introduce:
- Duplicate `main.jsx` or `App.jsx` files
- Mismatched entry points in `index.html`

### Setup

If husky is not installed, run:
```bash
npm install husky --save-dev
npx husky install
```

### Bypass (Emergency Only)

If you need to bypass the hook (NOT RECOMMENDED):
```bash
git commit --no-verify -m "your message"
```

**Only use `--no-verify` if you have a very good reason and plan to fix the entry chain immediately.**
