# PQ-3 Acceptance Checklist (Band Alignment)

## Gate BA-1: Alignment engages when branch bands exist

Preconditions
- LOD locked to SHEET (or CELL)
- timeboxCount > 0 for rendered history cubes
- Parent branch has bandCount >= 2 (derived from commits/timeboxes)

Steps
- Import a workbook that generates history cubes (or use your demo mode that sets timeboxCount > 0)
- Ensure branch timeboxes exist (the branch has at least 2 bands)
- Render the sheet with history cubes visible

Expected log
- [T] bandAlign ok=<N> maxDeltaM=<d>

Acceptance
- ok is > 0
- maxDeltaM <= 0.25 meters
- Visually: multiple lanes show cubes on the same slab heights (stacked "bands")

Refusal
- If bands exist and cubes render but no [T] bandAlign… log appears:
  - REFUSAL.BAND_ALIGN_MISSING_LOG
- If maxDeltaM > 0.25:
  - REFUSAL.BAND_ALIGN_OUT_OF_TOLERANCE maxDeltaM=<d> tol=0.25

## Gate BA-2: Alignment does not engage when bands are missing (fallback is explicit)

Preconditions
- LOD = SHEET or CELL
- timeboxCount > 0
- Parent branch has no commits/timeboxes (band list empty)

Steps
- Force a branch with no band data (or use a minimal demo config)
- Render history cubes

Expected log
- [T] bandAlign fallback=stepDepth reason=noBranchBands

Acceptance
- Cubes still render using old spacing
- No alignment log is emitted (or the explicit fallback log is emitted)

Refusal
- If cubes vanish because bands are missing:
  - REFUSAL.BAND_ALIGN_BROKE_FALLBACK

## Gate BA-3: Cross-sheet coherence (optional but strong)

If two sheets share the same branch:
- their lane cubes should align to the same band heights.

Expected
- Two [T] bandAlign… logs (one per sheet)
- Both report similar band counts and tolerance

## Proof artifacts to capture

Add placeholders (MISSING until captured):
- archive/proofs/pq3-band-align-pass.log
- archive/proofs/pq3-band-align-fallback.log

In PASS proof, include:
- the [T] bandAlign… line
- the [RENDER] populatedCells… line (so we know it’s a real sheet)
