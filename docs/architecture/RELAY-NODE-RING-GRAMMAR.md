# RELAY Node Ring Grammar v0

**Status:** CONTRACT (presentation + meaning semantics)  
**Effective:** 2026-02-14  
**Scope:** Visual meaning at all LODs for region/building/company/file/sheet/cell nodes.  
**Non-goal:** This contract does not change canonical data path, ENU math, gate semantics, governance authority, or append-only truth rules.

---

## 1) Purpose

Lock a single, fair, deterministic visual grammar so Relay nodes are interpreted consistently:

- No subjective "company size" ranking.
- Meaning is encoded by pressure, vote energy, and state quality.
- Same interaction grammar for companies and files.
- Scale transitions are deterministic (distance changes detail, `E`/`Esc` changes scope).

---

## 2) Universal Node Object Contract

Every renderable node participating in ring grammar must expose:

```ts
interface RelayNodeRingContract {
  id: string;                         // stable canonical id
  type: string;                       // region|building|company|branch|sheet|cell|file|bundle...
  scopePath: string;                  // hierarchical path
  parentId: string | null;
  childCount: number;

  pressure: {                         // fair urgency signal
    raw: number;                      // source units (domain-defined)
    norm: number;                     // normalized [0,1]
  };

  voteEnergy: {                       // participation/churn signal
    raw: number;                      // source units (domain-defined)
    norm: number;                     // normalized [0,1]
  };

  stateQuality: 'PASS' | 'DEGRADED' | 'INDETERMINATE' | 'REFUSAL';
  recency: number | string;           // timebox index or timestamp bucket
  eri?: number;                       // optional 0..100
}
```

Normalization rules:

- `norm` fields must be clamped to `[0,1]`.
- Missing/invalid values degrade to `0` and must not crash rendering.
- Normalization implementation is domain-specific but output semantics are fixed by this contract.

---

## 3) Ring Rendering Semantics

### 3.1 Thickness = Pressure

- Formula:
  - `ringThicknessPx = clamp(minThicknessPx + pressure.norm * (maxThicknessPx - minThicknessPx), minThicknessPx, maxThicknessPx)`
- Default bounds:
  - `minThicknessPx = 2`
  - `maxThicknessPx = 12`
- `pressure.raw` may be shown in inspector/HUD; never used alone for visual scaling.

### 3.2 Ripple Rate = Vote Energy

- Formula:
  - `rippleHz = clamp(minRippleHz + voteEnergy.norm * (maxRippleHz - minRippleHz), minRippleHz, maxRippleHz)`
- Default bounds:
  - `minRippleHz = 0.2`
  - `maxRippleHz = 2.0`
- If animation is disabled by profile/perf rail, freeze ripple phase and keep static ring.

### 3.3 Color = State Quality

Exact mapping (default palette):

- `PASS` -> `#4CAF50`
- `DEGRADED` -> `#FFC107`
- `INDETERMINATE` -> `#FF9800`
- `REFUSAL` -> `#F44336`

Optional profile palettes may restyle these colors but must preserve 1:1 state mapping.

### 3.4 Label Priority

Label visibility priority order:

1. focus state (`isFocusMode`, selected/entered target)
2. proximity (camera distance / in-scope node)
3. recency

Forbidden:

- Label priority by subjective organization size.

---

## 4) LOD Contract (Render Meaning by Distance)

Distance changes detail only; scope changes meaning context.

### Planetary

- Render: region/country ring summaries only.
- Hide: company internals, sheet/cell details.

### Regional

- Render: region tree + building/site basin rings.
- Hide: per-company sheet internals.

### Building

- Render: basin anchor + company placements on basin ring; bundle nodes if needed.
- Hide: deep sheet/cell detail unless entered.

### Company

- Render: company trunk/branches + ring semantics + compact sheet representations.
- Hide: per-cell detail unless entered.

### Sheet

- Render: selected sheet detailed; sibling sheets as compact representations.
- Render ring semantics for relevant nodes in context.

### Cell

- Render: local cell context, provenance/dependency overlays, local ring semantics.

Transition rules:

- **Distance/LOD transitions** change detail level only.
- **`E` enter / `Esc` exit transitions** change scope (context).
- LOD must not silently mutate truth or ownership state.

---

## 5) Shared-Anchor Basin Ring Rule

When many companies share one building/site anchor:

- Building/site acts as **basin anchor**.
- Companies are laid out deterministically on a ring around anchor center.
- No hidden container/sphere semantics.
- No random order.

Deterministic placement:

- Stable sort key: `hash(companyId)` (or stable canonical ordering).
- Angle: `theta = 2π * index / N`.
- Radius: `r = clamp(baseRadius * sqrt(N), rMin, rMax)`.

Bundle thresholds (default):

- `N <= 30`: render individual nodes.
- `30 < N <= 300`: render bundle nodes + optional expanded subsets.
- `N > 300`: render bundles + search/filter first; expand on demand.

Bundle node behavior:

- Bundle node is a first-class node (id/type/scopePath/childCount/states).
- Expand/collapse is reversible and explicit.
- Bundle state must aggregate child state deterministically.

---

## 6) Interaction Semantics

Focus Isolation (lens, not deletion):

- Hover -> soft isolate (dim others, preserve context).
- Click or `E` -> hard isolate (hide unrelated nodes, keep breadcrumb).
- `Esc` -> restore previous visibility state.

This contract complements D-Lens and does not replace canonical node relationships.

---

## 7) Required Acceptance Logs

Implementations conforming to this contract must emit:

- Grammar applied:
  - `[RING] grammar applied=PASS version=v0`
- LOD detail transition:
  - `[RING] lod level=<PLANETARY|REGIONAL|BUILDING|COMPANY|SHEET|CELL> detail=<summary|expanded>`
- Scope transitions:
  - `[RING] scope enter target=<id> type=<type> result=PASS`
  - `[RING] scope exit target=<id> result=PASS`
- Bundle transitions:
  - `[RING] bundle collapse anchor=<id> nodes=<n> bundles=<m> result=PASS`
  - `[RING] bundle expand bundleId=<id> children=<n> result=PASS`

If a transition is blocked, emit explicit refusal semantics:

- `[REFUSAL] reason=RING_SCOPE_BLOCKED ...`

---

## 8) Proof Requirements (Definition for Next Proof Script)

Proof script target (future micro-batch): `scripts/node-ring-grammar-proof.mjs`

Minimum checks:

1. Grammar applied log exists.
2. LOD logs emitted across at least 3 levels.
3. Enter/exit scope logs emitted.
4. Bundle collapse/expand logs emitted under high-N fixture.
5. No silent fallback when transitions are blocked; refusal lines present when expected.

Proof artifact target:

- `archive/proofs/node-ring-grammar-console-YYYY-MM-DD.log`

---

## 9) Compatibility and Safety

This grammar is presentation semantics only and must not violate:

- `docs/architecture/RELAY-PHYSICS-CONTRACTS.md`
- `docs/architecture/RELAY-MASTER-BUILD-PLAN.md`
- existing gate/refusal semantics

No changes to append-only truth path:

`External Event -> Route -> Fact -> Match -> Summary -> KPI -> Timebox -> Motion`

