# Relay Architecture Documentation

## The Single Canonical Document

**[RELAY-MASTER-BUILD-PLAN.md](RELAY-MASTER-BUILD-PLAN.md)** — The complete monolithic plan: 13 sections, 12 modules A-L, 6 tiers (including Tier 2.5 Universal Tree), 20 frozen contracts, full coverage matrix, execution order, build history, and queued slices. This is the only document you need.

## Active Contracts (Standalone Reference)

These files are kept as standalone contracts because they define invariants that code directly enforces:

- [RELAY-PHYSICS-CONTRACTS.md](RELAY-PHYSICS-CONTRACTS.md) -- The 20 frozen contracts that govern all phases
- [RELAY-RENDER-CONTRACT.md](RELAY-RENDER-CONTRACT.md) -- Sheet/filament rendering invariants
- [RELAY-NODE-RING-GRAMMAR.md](RELAY-NODE-RING-GRAMMAR.md) -- Node ring visual grammar (pressure/votes/state + LOD/scope)
- [RELAY-FILAMENT-LIFECYCLE.md](RELAY-FILAMENT-LIFECYCLE.md) -- Filament dual state machines (work + lifecycle)

## Restoration Companions

- [`../restoration/RELAY-RESTORATION-PLAN.md`](../restoration/RELAY-RESTORATION-PLAN.md)
- [`../restoration/RESTORATION-INDEX.md`](../restoration/RESTORATION-INDEX.md)

## Proof Artifacts

All gate proofs are indexed at [archive/proofs/PROOF-INDEX.md](../../archive/proofs/PROOF-INDEX.md). Rule: no proof, no progression.

## Archived (Superseded)

24 documents have been moved to `archive/superseded-docs/` because their content is fully absorbed into the master plan or they are historical records of completed phases. See [SUPERSEDED-BY.md](../../archive/superseded-docs/SUPERSEDED-BY.md) for the full list.
