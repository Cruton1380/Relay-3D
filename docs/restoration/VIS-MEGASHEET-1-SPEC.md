# VIS-MEGASHEET-1 — SPEC

**Status:** PROPOSE
**Date:** 2026-02-15
**Prerequisite:** ATTENTION-CONFIDENCE-1 PASS, VIS-TREE-SCAFFOLD-1 PASS, HEIGHT-BAND-1 PASS
**Contract:** docs/architecture/RELAY-RENDER-CONTRACT.md

---

## Goal

Add a dedicated TopDown MegaSheet lens mode: projection, not physical merge. Tiles arranged deterministically by state graph + importance. Enter via M key (only in company scope), exit via Esc.

---

## Scope

### Mode: MEGASHEET

- Separate from COMPANY/SHEET scope
- Enter: M key (only in company scope), sets `window._relayRenderMode = 'MEGASHEET'`
- Exit: Esc restores previous renderMode + camera
- Camera: top-down over a horizontal plane at COMPANY band altitude (from HEIGHT-BAND-1)

### Layout

- Build sheet graph from existing sheet nodes
- Deterministic force-directed layout seeded by `hash(trunkId)`
- Enforce: `minGapM=15`, AABB overlap resolution, `maxRadiusM=500`
- Importance ordering: `importance = 0.3*openFilaments + 0.3*attention + 0.2*driftCount + 0.2*exceptions`
- Important sheets near center

### Rendering

- Show tiles only (no cells) by default
- Click tile routes to canonical `relayEnterSheet`
- Tile visuals:
  - opacity = confidence (0..1)
  - slight size scaling = attention (0.8..1.2)
  - tint = state (PASS=green, DEGRADED=yellow, INDETERMINATE=orange, REFUSAL=red)

### Required Logs

```
[MEGA] enter seed=<hash> sheets=<n>
[MEGA] layout overlaps=0 minGapM=15 radiusM=<max>
[MEGA] mapping tile=<id> x=<m> y=<m> w=<m> h=<m> importance=<val>
[MEGA-PROOF] gate-summary result=PASS
```

---

## Proof Script

`scripts/vis-megasheet-proof.mjs`

### Stages

1. **Boot** — confirm AC + scaffold + height functions
2. **Enter MEGASHEET** — press M, verify mode log
3. **Layout** — verify no overlaps, deterministic positions
4. **Tile visuals** — verify opacity/size/tint vary by state
5. **Exit** — press Esc, verify restore to previous mode
6. **Gate** — `[MEGA-PROOF] gate-summary result=PASS stages=6/6`

---

## Acceptance Criteria

PASS only if:
- M enters MEGASHEET, Esc exits
- Layout is deterministic and overlap-free
- Tile visuals map to state
- All regression proofs pass
