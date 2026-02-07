# Forbidden Language Lint

**Status**: Active (linted in pre-commit)  
**Purpose**: Block phrases that violate Relay governance and proof rules.

---

## Scope

This lint scans repository text files and fails a commit when forbidden phrases are found.
Update the list only through `config/forbidden-language.json`.

---

## Current Forbidden Phrases

- `silence=approval`  
  Reason: Governance forbids silence-as-approval.

- `paper completion`  
  Reason: Proof must be artifact-backed, not paper-only.

---

## Update Process

1. Edit `config/forbidden-language.json`
2. Run `npm run lint:forbidden-language`
3. Commit changes

---

## Ignore Rules

Default ignores: `archive/`, `node_modules/`, `data/`, `.git/`
