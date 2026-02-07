# One-Sentence Instruction to Canon

**Phase 2.1 is PASSED** (Gates 1–5 verified from console). 

**Next Steps**:
1. Capture proof artifacts
2. Flip `SINGLE_BRANCH_PROOF = false` for Phase 2.2 (full tree restoration)
3. Add root continuation segment below anchor (ENU -Z, local DOWN, not to Earth center)
4. Verify Gates B & C (full tree + root segment)
5. Proceed to Phase 3 material timeboxes

---

## Expanded Instructions

### 1. Proof Artifacts (DONE)
- ✅ Console log captured: `archive/proofs/phase2.1-single-branch-console.log`
- ✅ Screenshots provided by user

### 2. Phase 2.2: Full Tree (DONE)
- ✅ Set `SINGLE_BRANCH_PROOF = false`
- ✅ Expected: `branches=2, spines=2, primitives=84`

### 3. Phase 2.3: Root Continuation (DONE)
- ✅ Root segment from anchor DOWN (ENU -Z)
- ✅ Depth: 500-2000m (LOD-dependent)
- ✅ Local segment (NOT to Earth center)
- ✅ Dark brown, thicker than trunk

### 4. Verification (USER ACTION REQUIRED)
Hard refresh browser and verify:
- **Gate B**: Console shows `branches=2` ✅ or `REFUSAL.FULL_TREE_NOT_RESTORED`
- **Gate C**: Root visible below anchor ✅ or `REFUSAL.ROOT_SEGMENT_MISSING_OR_TILTED`

### 5. Phase 3: Material Timeboxes (AFTER GATES B & C PASS)
- Timeboxes as embedded slices (not rings)
- Turgor animation (pulsing)
- **Gate D**: Timeboxes are material ✅ or `REFUSAL.TIMEBOXES_NOT_MATERIAL`

---

## Key Principle

**Anchor truth is math, not map content.**

- Tree geometry: ENU frame + meters + Cartesian3
- Buildings can degrade (Ion 401), tree still renders
- Root goes DOWN (local ENU -Z), NOT to Earth center

---

## 🔐 Encryption Clarification (Lock This Down)

**Core Principle**: "Leaf = encrypted payload; everything above leaf = hashes + signatures + Merkle roots."

**Critical Wording**: "Core validates **integrity and authorization of commitments**, not plaintext content."

**Details**: See `RELAY-ENCRYPTION-PERMISSION-SPEC.md` for:
- What gets encrypted (leaves only) vs what stays public (hashes + sigs)
- Permission model: Envelope encryption (Pattern B) recommended
- Revocation model: Explicit, append-only, key rotation
- Core validation: Integrity + authorization, NOT semantic correctness

**Phase 5 Note**: When implementing crypto layer, use envelope encryption at leaf level only. Core validates signatures + Merkle roots, does NOT decrypt.

---

**Current Status**: Phase 2.1 PASSED ✅ | Phases 2.2-2.3 implemented ✅ | Ready for user verification ⏳
