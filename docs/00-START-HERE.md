# Relay Documentation - Start Here

**Last Updated**: 2026-02-10
**Version**: v2.0 (Post Master Plan Consolidation)

This is the **single source of truth** for Relay documentation.

---

## Mandatory Review Policy (Read Before Reviewing Anything)

Relay reviews are **slice-based** and must follow the 4-evidence rule.

- Use: `docs/process/ARCHITECT-REVIEW-CHECKLIST.md` (mandatory gate)
- Use: `docs/process/RELAY-SLICE-REVIEW-AGENT-PROMPT.md` (paste into ChatGPT for deterministic reviews)

**Rule:** A slice is PASS only with **code + runtime behavior + proof artifact + contract alignment**.  
If access/tooling prevents verification, mark **UNVERIFIED** (or **ACCESS_BLOCKED**), not FAIL.

---

## Quick Links

### The Canonical Plan
- **[Relay Master Build Plan](./architecture/RELAY-MASTER-BUILD-PLAN.md)** -- The definitive end-to-end system plan (12 modules A-L, 5 implementation tiers, 15 frozen contracts, full coverage matrix). **Read this first.**
- **[Architecture Index](./architecture/README.md)** -- Index of all architecture documents

### For New Users
- **[Quick Start Guide](./tutorials/QUICK-START.md)** -- Get running in 5 minutes
- **[Dev Setup](./tutorials/DEV-SETUP.md)** -- Local environment configuration

### Architecture Specs (Module-Level Detail)
- **[Master Build Plan](./architecture/RELAY-MASTER-BUILD-PLAN.md)** -- Full system (all modules, all tiers)
- **[Cesium Architecture](./architecture/RELAY-CESIUM-ARCHITECTURE.md)** -- Cesium 3D world implementation spec
- **[Render Contract](./architecture/RELAY-RENDER-CONTRACT.md)** -- Sheet/filament rendering invariants
- **[Physics Contracts](./architecture/RELAY-PHYSICS-CONTRACTS.md)** -- 15 frozen contracts
- **[Crypto-Geometric Architecture](./architecture/RELAY-CRYPTO-GEOMETRIC-ARCHITECTURE.md)** -- Merkle tree + 3D visualization spec
- **[Encryption Spec](./architecture/RELAY-ENCRYPTION-PERMISSION-SPEC.md)** -- Leaf-level encryption + permissions
- **[Stigmergic Coordination](./architecture/STIGMERGIC-COORDINATION.md)** -- How coordination emerges from environment

### Governance and Business
- **[Pressure Model](./governance/PRESSURE-MODEL.md)** -- How urgency accumulates
- **[Governance Cadence](./governance/GOVERNANCE-CADENCE.md)** -- When decisions happen
- **[Stage Gates](./governance/STAGE-GATES.md)** -- Checkpoints and enforcement
- **[Work Zones](./governance/WORK-ZONES.md)** -- Zone mechanics and scope
- **[Forbidden Language](./governance/FORBIDDEN-LANGUAGE.md)** -- Non-adversarial terminology rules
- **[Operating Model](./business/RELAY-OPERATING-MODEL.md)** -- Roles, patterns, operations
- **[Relay for Leaders](./business/RELAY-FOR-LEADERS.md)** -- Executive summary

### Implementation Records
- **[Phase 2.1 Primitives Migration](./implementation/PHASE-2.1-PRIMITIVES-MIGRATION.md)** -- Completed phase with gate evidence
- **[Phase 3 Timebox Lanes](./implementation/PHASE-3-TIMEBOX-LANES-COMPLETE.md)** -- Completed phase record
- **[Testing Guide](./implementation/TESTING.md)** -- Test strategies and tools

### Features
- **[File Organization](./features/FILE-ORGANIZATION.md)** -- Desktop agent for local file organization

### Legacy Operational Notes (Non-Canonical)
- **[MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)** -- Historical path-migration reference
- **[DEV-SERVER-FIX.md](./DEV-SERVER-FIX.md)** -- Historical troubleshooting note
- **[PHASE-3-BUG-FIX.md](./PHASE-3-BUG-FIX.md)** -- Historical bug-fix note
- **[PHASE-3-DEBUG-LOG.md](./PHASE-3-DEBUG-LOG.md)** -- Historical debug note

---

## Documentation Structure

```
docs/
+-- 00-START-HERE.md                              <-- You are here
+-- MIGRATION-GUIDE.md                            <-- Old path -> New path mapping
|
+-- architecture/                                 <-- System design
|   +-- RELAY-MASTER-BUILD-PLAN.md                <-- CANONICAL PLAN (read first)
|   +-- README.md                                 <-- Architecture doc index
|   +-- RELAY-CESIUM-ARCHITECTURE.md              <-- Cesium implementation spec
|   +-- RELAY-CRYPTO-GEOMETRIC-ARCHITECTURE.md    <-- Crypto + geometric spec
|   +-- RELAY-ENCRYPTION-PERMISSION-SPEC.md       <-- Encryption detail
|   +-- RELAY-PHYSICS-CONTRACTS.md                <-- 15 frozen contracts
|   +-- RELAY-RENDER-CONTRACT.md                  <-- Rendering invariants
|   +-- STIGMERGIC-COORDINATION.md                <-- Coordination model
|
+-- governance/                                   <-- Decision and authority
|   +-- FORBIDDEN-LANGUAGE.md                     <-- Terminology rules
|   +-- PRESSURE-MODEL.md                         <-- Pressure sources/sinks
|   +-- GOVERNANCE-CADENCE.md                     <-- Decision rhythm
|   +-- STAGE-GATES.md                            <-- Gate types and thresholds
|   +-- WORK-ZONES.md                             <-- Zone mechanics
|
+-- business/                                     <-- Operating model
|   +-- RELAY-OPERATING-MODEL.md                  <-- Roles and patterns
|   +-- RELAY-FOR-LEADERS.md                      <-- Executive summary
|
+-- implementation/                               <-- Phase records
|   +-- PHASE-2.1-PRIMITIVES-MIGRATION.md         <-- Completed phase
|   +-- PHASE-3-TIMEBOX-LANES-COMPLETE.md         <-- Completed phase
|   +-- TESTING.md                                <-- Test strategies
|   +-- SINGLE-BRANCH-PROOF-IMPLEMENTATION.md     <-- Branch proof
|   +-- PQ-3-BAND-ALIGNMENT-ACCEPTANCE.md         <-- Band alignment
|
+-- tutorials/                                    <-- Step-by-step guides
|   +-- QUICK-START.md                            <-- 5-minute setup
|   +-- DEV-SETUP.md                              <-- Dev environment
|   +-- VISUAL-VERIFICATION-GUIDE.md              <-- Visual checks
|
+-- ui/                                           <-- UI acceptance specs
|   +-- PRESENCE-AND-EDIT-SHEET-ACCEPTANCE.md
|   +-- SPREADSHEET-LENS-ACCEPTANCE.md
|
+-- features/                                     <-- Feature specs
    +-- FILE-ORGANIZATION.md                      <-- Desktop agent
```

---

## Key Architectural Decisions

### Decision 1: Cesium-First World (2026-02-06)
- The globe IS the product. One world, one renderer.
- All filament/tree rendering uses Cesium primitives.

### Decision 2: Renderer-Agnostic Core (Lock F)
- `core/**` cannot import Cesium or DOM.
- Business logic must be testable and portable.

### Decision 3: Master Plan as Single Source (2026-02-10)
- All previous build plans, roadmaps, and summaries consolidated into one canonical plan.
- Superseded documents archived in `archive/superseded-docs/`.
- The master plan is the only document that defines what Relay will become.

---

## Historical Context

- **Archive**: `archive/` folder preserves all historical progress
- **Superseded docs**: `archive/superseded-docs/` contains documents fully absorbed by the master plan
- **Commit History**: `archive/commit-history/Commit-Nodes/`
- **Status Reports**: `archive/status-reports/`

**Rule**: Current docs live in `docs/`. Archive is read-only historical reference.

---

*This documentation follows Relay's "One Truth" principle: single source, explicit lineage, no hidden references.*
