# Relay Architecture Documentation

The canonical, end-to-end build plan for Relay is:

**[RELAY-MASTER-BUILD-PLAN.md](RELAY-MASTER-BUILD-PLAN.md)** — Canonical full system plan (12 modules A-L, 5 tiers, frozen contracts, full coverage matrix).

**[RELAY-MASTER-BUILD-PLAN-R1.md](RELAY-MASTER-BUILD-PLAN-R1.md)** — Execution overlay: restoration-first sequencing (R0-R5), immediate slice queue, doc hygiene rules. Sequencing only — does not replace system coverage.

Restoration companion docs:

- [`../restoration/RELAY-RESTORATION-PLAN.md`](../restoration/RELAY-RESTORATION-PLAN.md)
- [`../restoration/RESTORATION-INDEX.md`](../restoration/RESTORATION-INDEX.md)

## Architecture Specs (Module-Level Detail)

- [RELAY-PHYSICS-CONTRACTS.md](RELAY-PHYSICS-CONTRACTS.md) -- The 15 frozen contracts that govern all phases
- [RELAY-CESIUM-ARCHITECTURE.md](RELAY-CESIUM-ARCHITECTURE.md) -- Cesium 3D world architecture (Modules E/F/G)
- [RELAY-CRYPTO-GEOMETRIC-ARCHITECTURE.md](RELAY-CRYPTO-GEOMETRIC-ARCHITECTURE.md) -- Cryptographic + geometric architecture (Modules C/D)
- [RELAY-ENCRYPTION-PERMISSION-SPEC.md](RELAY-ENCRYPTION-PERMISSION-SPEC.md) -- Encryption and permission specification (Module C)
- [RELAY-RENDER-CONTRACT.md](RELAY-RENDER-CONTRACT.md) -- Sheet/filament rendering invariants (Module G)
- [RELAY-NODE-RING-GRAMMAR.md](RELAY-NODE-RING-GRAMMAR.md) -- Fair visual meaning grammar for pressure/votes/state + LOD/scope transitions
- [STIGMERGIC-COORDINATION.md](STIGMERGIC-COORDINATION.md) -- Stigmergic coordination model (Module I)

## Archived (Superseded)

The following documents have been moved to `archive/superseded-docs/` because their content is fully absorbed into the master plan:

- RELAY-COMPLETE-BUILD-PLAN.md (old build plan)
- UNDERSTANDING-CONFIRMED.md (historical comprehension checkpoint)

## Proof Artifacts

All gate proofs are indexed at [archive/proofs/PROOF-INDEX.md](../../archive/proofs/PROOF-INDEX.md). Rule: no proof, no progression.
