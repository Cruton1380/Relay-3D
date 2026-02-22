# Agent Instructions (Relay)

## Canonical Source of Truth

**[docs/architecture/RELAY-MASTER-BUILD-PLAN.md](docs/architecture/RELAY-MASTER-BUILD-PLAN.md)** is the single definitive system specification. 328 frozen contracts, 109 top-level sections, full stage-gate architecture. Read it first.

## Quick Start

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Build Philosophy

We build step by step. Each feature follows a proof model:
1. Read the relevant Master Plan section
2. Implement the minimum viable version
3. Write a proof script that validates the contract
4. Visual demo that shows the feature working
5. Lock and move to the next section

## Recovery

All prior code is preserved under git tag `RELAY-PRE-CLEAN-ARCHIVE-V93`.
