# NODE-RING-RENDER-1 — Acceptance Criteria & Spec

**Goal**: Render semantic rings at COMPANY LOD for trunk (company), each department branch node, and optionally each sheet platform node (only if budget allows). Encoding and semantics are locked by `docs/architecture/RELAY-NODE-RING-GRAMMAR.md`; this slice is mechanical rendering + proof.

**Contract ref**: RELAY-NODE-RING-GRAMMAR.md (thickness = pressure, pulse = vote energy, color = state quality).

---

## A) What must be rendered

### Nodes in scope (COMPANY LOD)

- **Trunk** (company): one ring at company anchor.
- **Department branches**: one ring per trunk-direct branch node.
- **Sheet platforms** (optional): only if LOD/primitive budget allows; otherwise defer to a later slice.

### Encoding (from Node Ring Grammar)

- **Thickness** = pressure (normalized); formula and bounds per grammar §3.1.
- **Pulse rate** = vote energy (normalized); formula and bounds per grammar §3.2; may be static if animation disabled by profile/perf.
- **Color** = state quality: `PASS` | `DEGRADED` | `INDETERMINATE` | `REFUSAL`; palette per grammar §3.3.

Rings are **overlays**; they must not replace or alter slab/timebox geometry.

---

## B) Constraints

- **Launch-mode only gating** is allowed initially (e.g. `RELAY_LAUNCH_MODE` or profile=launch) for clarity; must not alter truth or data path.
- **No changes** to:
  - LOD thresholds or LOD transition logic
  - Canopy layout, radial placement, or filament geometry
  - Focus behavior (`focusCompanyOverview`, enter/exit sheet)
  - FreeFly contract (WASD, mouse, input ownership)
- **Rings only**: slabs and timeboxes remain untouched. Rings are additive overlays.

---

## C) Required logs (proofable)

- **When rings are applied at COMPANY LOD**:
  - `[RING] applied=PASS nodes=<n> scope=<company|sheet> lod=COMPANY`

- **Mapping confirmation** (at least once per run when rings render):
  - `[RING] mapping thickness=pressure pulse=voteEnergy color=stateQuality`

- **Proof gate**:
  - `[RING-PROOF] gate-summary result=PASS`

---

## D) Proof requirements (must be automated)

- **Create**: `scripts/node-ring-render-proof.mjs` (or `node-ring-grammar-proof.mjs` aligned to this slice).

**Stages** (minimum):

1. Boot `?profile=launch`, fly to COMPANY LOD → assert rings applied log present; `nodes` count ≥ 1 (trunk at least); `lod=COMPANY`.
2. Assert mapping log present (`thickness=pressure pulse=voteEnergy color=stateQuality`).
3. Visual check: rings visible at company; canopy not obscured (screenshot 01-company).
4. Branch ring readable (screenshot 02-branch — at least one department branch ring visible).
5. Gate summary: `[RING-PROOF] gate-summary result=PASS`.

**Artifacts**:

- `archive/proofs/node-ring-console-YYYY-MM-DD.log`
- Screenshots:
  - `01-company.png` — rings visible, canopy not obscured
  - `02-branch.png` — branch ring readable

**Index updates**:

- `archive/proofs/PROOF-INDEX.md`
- `docs/restoration/RESTORATION-INDEX.md` (new entry)

---

## E) Visual constraints

- Rings must not obscure the canopy silhouette in the default company camera frame.
- Ring drawing must respect the grammar’s thickness/ripple/color formulas; no ad-hoc scaling by “company size” or subjective ranking.

---

## Allowed files list (implementation scope)

Files that **may** be modified to implement NODE-RING-RENDER-1:

- `app/renderers/filament-renderer.js` — ring overlay drawing at COMPANY LOD (additive; no change to slab/timebox paths)
- Or a dedicated ring overlay module referenced by the renderer, if introduced in this slice
- `relay-cesium-world.html` — launch/profile gating only if needed (e.g. enable ring overlay when `RELAY_LAUNCH_MODE` and LOD is COMPANY)
- `scripts/node-ring-render-proof.mjs` (or `node-ring-grammar-proof.mjs`)
- Proof artifacts and index files per slice policy

**No changes to**: LOD governor logic, canopy placement, focus/enter sheet/FreeFly, ENU, or physics.

---

## Forbidden list

**Must NOT change**:

| Area | Requirement |
|------|-------------|
| LOD thresholds | No change to when PLANETARY/REGION/COMPANY/SHEET/CELL are chosen |
| Canopy layout | No change to radial placement, trunk/branch/sheet positions |
| Focus / enter sheet | No change to `focusCompanyOverview`, `relayEnterSheet`, exit paths |
| FreeFly contract | No change to WASD, mouse look, input ownership |
| Slabs / timeboxes | Rings are overlays only; do not modify slab or timebox geometry |

**Must NOT do**:

- Use subjective “company size” or similar ranking for ring appearance.
- Alter truth, append-only rules, or governance authority.

---

## Proof script stages (summary)

1. Boot launch → COMPANY LOD → `[RING] applied=PASS nodes=... scope=company lod=COMPANY`.
2. `[RING] mapping thickness=pressure pulse=voteEnergy color=stateQuality` present.
3. Screenshot 01-company: rings visible, canopy not obscured.
4. Screenshot 02-branch: at least one branch ring readable.
5. `[RING-PROOF] gate-summary result=PASS`.

---

*Spec for NODE-RING-RENDER-1 slice (R2). Grammar semantics are fixed in RELAY-NODE-RING-GRAMMAR.md; this spec locks scope and proof.*
