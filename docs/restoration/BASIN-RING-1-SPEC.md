# BASIN-RING-1 — Acceptance Criteria & Spec (R3)

**Goal**: Render shared-anchor basins deterministically: company nodes on a ring around the site anchor, stable ordering, clustering when N>6. Preserve FreeFly, focus lock, vote filtering, and existing rings/slabs overlays.

**Contract ref**: RELAY-NODE-RING-GRAMMAR.md §5 (Shared-Anchor Basin Ring Rule).

---

## A) What must be rendered

- **Basin anchor**: One site/building anchor position (e.g. first trunk or dedicated anchor).
- **Companies on ring**: All trunks (companies) belonging to that basin placed on a ring around the anchor.
- **Stable ordering**: Sort by `hash(companyId)` or stable canonical ordering; angle = `2π * index / N`; radius = `clamp(baseRadius * sqrt(N), rMin, rMax)`.
- **Clustering when N>6**: When companies > 6, either bundle nodes or show a count badge (mode=cluster).

---

## B) Constraints

- **Preserve**: FreeFly contract; focus lock (double-click company, Esc unwinds); vote filtering at globe LOD; rings/slabs overlays (coexist, no merging).
- **No change** to LOD thresholds unless explicitly in scope; basin ring is additive.

---

## C) Required logs

- `[VIS] basinRings anchor=<id> companies=<n> mode=<rings|cluster>`
- `[BASIN-PROOF] gate-summary result=PASS`

---

## D) Proof requirements

- **Script**: `scripts/basin-ring-proof.mjs`
- **Stages**: N=6 layout deterministic (mode=rings); N=30 clustered (mode=cluster); screenshots: basin ring + cluster view.
- **Artifacts**: `archive/proofs/basin-ring-console-YYYY-MM-DD.log`, `archive/proofs/basin-ring-YYYY-MM-DD/01-basin-ring.png`, `02-cluster.png`.

---

## E) Allowed files

- `app/renderers/filament-renderer.js` (basin ring placement + cluster path)
- `relay-cesium-world.html` (demo tree / fixture for N=6 and N=30 if needed)
- `scripts/basin-ring-proof.mjs`
- Proof artifacts and indexes.

---

## F) Forbidden

- Do not change FreeFly, focus lock behavior, vote filtering, or merge ring/slab overlays.
