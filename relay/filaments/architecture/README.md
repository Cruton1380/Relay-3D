# Architecture Filament - Index

This filament contains immutable architectural decisions for Relay.

**Filament ID:** `relay/filaments/architecture/`  
**Type:** Meta-filament (architecture locks)  
**Status:** Active

---

## Commits

### architecture@c10 (2026-01-28) - **ONTOLOGICAL FOUNDATION**

**File:** `0010_ontological_foundation.md`

**Summary:** Foundational ontological shift - Users are filament trees (not accounts), Identity is a filament (not fixed), Buildings are space tiles (not objects), Buildings are tradable units, Proximity channels are spatial properties. Defines 5 missing layers: attention economics, failure as first-class state, identity evolution primitives, exit mechanics, human thermodynamics. Establishes sacred invariant: no filament may ever collapse into a single scalar.

**Key decisions:**
- Users ARE filament trees (intersection of all filaments where they appear)
- Identity IS a filament (committed to by self and others, evolves over time)
- Buildings are space tiles (persistent spatial anchors that accumulate history)
- Buildings are units (tradable, governable, like any other unit)
- Proximity channels are properties of space + presence
- Sacred invariant: trees not totals, trajectories not balances
- 5 missing layers named (attention, failure, identity evolution, exit, thermodynamics)

**Dependencies:** c0-c9 (conceptual - prior architecture foundation)

**Unlocks:** PR #9 (Identity Filaments), PR #10 (Attention Layer), PR #11 (Exit Mechanics), PR #12 (Proximity Channels)

**Locked invariants:** 11 new (total 65 cumulative)

---

## Notes

**Prior architecture commits (c0-c9)** were established in a parallel workspace (`clevertree-relay`) and define:
- c0: Filament Foundation (append-only logs)
- c1: Commit Causality (causal refs)
- c2: SCV Units (worker representation)
- c3: Authority Chains (delegation)
- c5: RenderSpec v1 (deterministic rendering)
- c6: Economic Primitives (money, votes, commitments)
- c7: Coordination Gauges (5 orthogonal resources)
- c8: Delegated Decaying Influence (time-bounded authority)
- c9: Personal HUD + Physical Globe (space-time distinction)

These are conceptually locked and referenced by c10. Full documentation exists in the parallel workspace.

**architecture@c10** represents the ontological foundation that unifies all prior commits and names the missing human layers.

---

## Usage

To reference an architecture decision:
- Use format: `architecture@c10`
- Link to file: `relay/filaments/architecture/0010_ontological_foundation.md`
- All decisions are immutable (no edits, only new commits)

---

**Last updated:** 2026-01-28  
**Next commit index:** 11
