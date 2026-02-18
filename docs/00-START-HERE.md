# Relay Documentation - Start Here

**Last Updated**: 2026-02-16
**Version**: v3.0 (Consolidated Single-Document Canon)

This is the **single source of truth** for Relay documentation.

---

## Mandatory Review Policy (Read Before Reviewing Anything)

Relay reviews are **slice-based** and must follow the 4-evidence rule.

- Use: `docs/process/ARCHITECT-REVIEW-CHECKLIST.md` (mandatory gate)
- Use: `docs/process/RELAY-SLICE-REVIEW-AGENT-PROMPT.md` (paste into ChatGPT for deterministic reviews)
- Use: `docs/process/PROOF-ARTIFACT-POLICY.md` (authoritative proof naming/publication rules)
- Use: `docs/process/SLICE-WORKFLOW.md` (mandatory slice lifecycle and evidence bundle interface)

**Rule:** A slice is PASS only with **code + runtime behavior + proof artifact + contract alignment**.  
If access/tooling prevents verification, mark **UNVERIFIED** (or **ACCESS_BLOCKED**), not FAIL.

---

## Quick Links

### The Canonical Plan (The Only Document You Need)
- **[Relay Master Build Plan](./architecture/RELAY-MASTER-BUILD-PLAN.md)** -- Full system spec: 13 sections, 12 modules A-L, 6 tiers, 20 frozen contracts, Universal Tree Model, execution order, build history, queued slices, coverage matrix. **Read this first.**

### Active Contracts (Standalone Reference)
- **[Physics Contracts](./architecture/RELAY-PHYSICS-CONTRACTS.md)** -- 20 frozen contracts governing all phases
- **[Render Contract](./architecture/RELAY-RENDER-CONTRACT.md)** -- Sheet/filament rendering invariants
- **[Node Ring Grammar](./architecture/RELAY-NODE-RING-GRAMMAR.md)** -- Visual grammar for pressure/votes/state
- **[Filament Lifecycle](./architecture/RELAY-FILAMENT-LIFECYCLE.md)** -- Filament dual state machines (work + lifecycle)

### Restoration Companions
- **[Relay Restoration Plan](./restoration/RELAY-RESTORATION-PLAN.md)** -- Phase R0-R5 execution checklist
- **[Restoration Index](./restoration/RESTORATION-INDEX.md)** -- Active capability manual + planning lineage

### For New Users
- **[Quick Start Guide](./tutorials/QUICK-START.md)** -- Get running in 5 minutes
- **[Dev Setup](./tutorials/DEV-SETUP.md)** -- Local environment configuration

### Governance and Business
- **[Pressure Model](./governance/PRESSURE-MODEL.md)** -- How urgency accumulates
- **[Governance Cadence](./governance/GOVERNANCE-CADENCE.md)** -- When decisions happen
- **[Stage Gates](./governance/STAGE-GATES.md)** -- Checkpoints and enforcement
- **[Work Zones](./governance/WORK-ZONES.md)** -- Zone mechanics and scope
- **[Forbidden Language](./governance/FORBIDDEN-LANGUAGE.md)** -- Non-adversarial terminology rules
- **[Operating Model](./business/RELAY-OPERATING-MODEL.md)** -- Roles, patterns, operations
- **[Relay for Leaders](./business/RELAY-FOR-LEADERS.md)** -- Executive summary

### Testing
- **[Testing Guide](./implementation/TESTING.md)** -- Test strategies and tools

*Legacy operational notes (MIGRATION-GUIDE, DEV-SERVER-FIX, PHASE-3 debug notes) have been archived to `archive/superseded-docs/`.*

---

## Documentation Structure

```
docs/
+-- 00-START-HERE.md                              <-- You are here
|
+-- architecture/                                 <-- System design (6 files)
|   +-- RELAY-MASTER-BUILD-PLAN.md                <-- THE CANONICAL PLAN (read first)
|   +-- README.md                                 <-- Architecture doc index
|   +-- RELAY-PHYSICS-CONTRACTS.md                <-- 20 frozen contracts
|   +-- RELAY-RENDER-CONTRACT.md                  <-- Rendering invariants
|   +-- RELAY-NODE-RING-GRAMMAR.md                <-- Visual grammar contract
|   +-- RELAY-FILAMENT-LIFECYCLE.md               <-- Filament state machines
|
+-- restoration/                                  <-- Restoration tracking
|   +-- RELAY-RESTORATION-PLAN.md                 <-- R0-R5 execution checklist
|   +-- RESTORATION-INDEX.md                      <-- Active capability manual + lineage
|
+-- governance/                                   <-- Decision and authority (6 files)
|   +-- FORBIDDEN-LANGUAGE.md                     <-- Terminology rules
|   +-- PRESSURE-MODEL.md                         <-- Pressure sources/sinks
|   +-- GOVERNANCE-CADENCE.md                     <-- Decision rhythm
|   +-- STAGE-GATES.md                            <-- Gate types and thresholds
|   +-- WORK-ZONES.md                             <-- Zone mechanics
|   +-- HUD-PARAMETERS-CATALOG.md                 <-- HUD param catalog
|
+-- business/                                     <-- Operating model
|   +-- RELAY-OPERATING-MODEL.md                  <-- Roles and patterns
|   +-- RELAY-FOR-LEADERS.md                      <-- Executive summary
|
+-- process/                                      <-- Slice workflow and review (7 files)
|   +-- SLICE-WORKFLOW.md                          <-- Lifecycle and evidence
|   +-- PROOF-ARTIFACT-POLICY.md                   <-- Naming and publication
|   +-- ARCHITECT-REVIEW-CHECKLIST.md              <-- Review gate
|   +-- RELAY-SLICE-REVIEW-AGENT-PROMPT.md         <-- AI review prompt
|   +-- AI-IDE-SLICE-PROMPT-TEMPLATE.md            <-- IDE slice prompt
|   +-- SLICE-REGISTER.md                          <-- Slice tracking
|   +-- ACTIVE-SLICE.md                            <-- Current slice
|
+-- tutorials/                                    <-- Step-by-step guides
|   +-- QUICK-START.md                            <-- 5-minute setup
|   +-- DEV-SETUP.md                              <-- Dev environment
|   +-- VISUAL-VERIFICATION-GUIDE.md              <-- Visual checks
|
+-- onboarding/                                   <-- Developer onboarding
|   +-- RELAY-V1-DEV-ONBOARDING.md
|
+-- implementation/                               <-- Testing
    +-- TESTING.md                                <-- Test strategies
```

---

## Key Architectural Decisions

### Decision 1: Cesium-First World (2026-02-06)
- The globe IS the product. One world, one renderer.
- All filament/tree rendering uses Cesium primitives.

### Decision 2: Renderer-Agnostic Core (Lock F)
- `core/**` cannot import Cesium or DOM.
- Business logic must be testable and portable.

### Decision 3: Single Canonical Document (2026-02-16)
- All previous build plans, roadmaps, specs, and overlays consolidated into one canonical plan.
- 24 superseded documents archived in `archive/superseded-docs/`.
- The master plan is the only document that defines what Relay will become.

---

## Historical Context

- **Archive**: `archive/` folder preserves all historical progress
- **Superseded docs**: `archive/superseded-docs/` contains 49 documents (absorbed/historical)
- **Commit History**: `archive/commit-history/Commit-Nodes/`
- **Status Reports**: `archive/status-reports/`

**Rule**: Current docs live in `docs/`. Archive is read-only historical reference.

---

*This documentation follows Relay's "One Truth" principle: single source, explicit lineage, no hidden references.*
