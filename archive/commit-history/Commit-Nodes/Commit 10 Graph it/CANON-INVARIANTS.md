# Canon Invariants

This document defines the mechanical checks that the Vault Guardian performs on every bundle before accepting it into `verified/`.

These are **append-only** rules: new invariants can be added with schema versioning, but existing invariants cannot be silently removed.

## Invariant Categories

1. **Structural** — bundle format and completeness
2. **Cryptographic** — signatures and hashes
3. **Schema** — version and compatibility
4. **Custody** — authorization and lineage
5. **Semantic** — commit type rules and constraints
6. **Dependency** — evidence and reference closure

---

## 1. Structural Invariants

### INV-STRUCT-001: Required Fields Present
**Check**: Bundle must contain all required fields:
- `bundle_id`
- `payload`
- `bundle_hash`
- `custodian_pubkey_id`
- `signature`

**Pass**: All fields present  
**Fail**: Missing any required field  
**Refusal code**: `MISSING_REQUIRED_FIELD`

### INV-STRUCT-002: Bundle ID Format
**Check**: `bundle_id` must be valid UUID v4 or deterministic hash

**Pass**: Valid format  
**Fail**: Invalid format  
**Refusal code**: `INVALID_BUNDLE_ID`

### INV-STRUCT-003: Payload Parse
**Check**: `payload` must be valid JSON or msgpack

**Pass**: Parseable  
**Fail**: Parse error  
**Refusal code**: `PAYLOAD_PARSE_ERROR`

---

## 2. Cryptographic Invariants

### INV-CRYPTO-001: Bundle Hash Match
**Check**: Recompute `bundle_hash` from `payload`; must match provided `bundle_hash`

**Pass**: Hash matches  
**Fail**: Hash mismatch  
**Refusal code**: `HASH_MISMATCH`

### INV-CRYPTO-002: Merkle Root Valid
**Check**: If `merkle_root` present, verify against commit tree

**Pass**: Merkle root valid  
**Fail**: Merkle root invalid  
**Refusal code**: `MERKLE_ROOT_INVALID`

### INV-CRYPTO-003: Signature Verification
**Check**: Verify `signature` over (`bundle_hash` + `merkle_root` + `rule_catalog_hash` + `head_commit`) using `custodian_pubkey_id`

**Pass**: Signature valid  
**Fail**: Signature invalid  
**Refusal code**: `SIGNATURE_INVALID`

---

## 3. Schema Invariants

### INV-SCHEMA-001: Schema Version Known
**Check**: `schema_version` in bundle must match known versions in rule catalog

**Pass**: Schema version known  
**Fail**: Unknown schema version  
**Refusal code**: `UNKNOWN_SCHEMA_VERSION`

### INV-SCHEMA-002: Backward Compatibility
**Check**: If schema version is newer, must be backward-compatible with current

**Pass**: Compatible  
**Fail**: Breaking change without migration  
**Refusal code**: `SCHEMA_BREAKING_CHANGE`

---

## 4. Custody Invariants

### INV-CUSTODY-001: Authorized Signer
**Check**: `custodian_pubkey_id` must be in current custody policy

**Pass**: Signer authorized  
**Fail**: Unauthorized signer  
**Refusal code**: `UNAUTHORIZED_SIGNER`

### INV-CUSTODY-002: Custody Transition Valid
**Check**: If bundle contains custody transition, must follow protocol:
- signed by current custodian
- includes new custodian pubkey
- includes transition reason

**Pass**: Valid transition  
**Fail**: Invalid transition  
**Refusal code**: `INVALID_CUSTODY_TRANSITION`

### INV-CUSTODY-003: No Retroactive Signing
**Check**: Bundle timestamp must not predate last verified bundle

**Pass**: Timestamp valid  
**Fail**: Retroactive timestamp  
**Refusal code**: `RETROACTIVE_BUNDLE`

---

## 5. Semantic Invariants

### INV-SEMANTIC-001: Commit Type Allowed
**Check**: All commits in bundle must have known `commit_type`:
- `DRAFT`
- `HOLD`
- `PROPOSE`
- `COMMIT`
- `REVERT`
- `ASSUMPTION`
- `REFUSAL`

**Pass**: All types known  
**Fail**: Unknown commit type  
**Refusal code**: `UNKNOWN_COMMIT_TYPE`

### INV-SEMANTIC-002: Append-Only Constraint
**Check**: No commit may mutate or delete previous commits

**Pass**: Only adds new commits  
**Fail**: Attempts mutation  
**Refusal code**: `APPEND_ONLY_VIOLATION`

### INV-SEMANTIC-003: REVERT Must Reference
**Check**: `REVERT` commits must reference the commit being reverted

**Pass**: Valid reference  
**Fail**: Missing or invalid reference  
**Refusal code**: `INVALID_REVERT_REFERENCE`

### INV-SEMANTIC-004: Timebox Monotonicity
**Check**: `timebox_id` must not decrease (time moves forward)

**Pass**: Monotonic  
**Fail**: Timebox goes backward  
**Refusal code**: `TIMEBOX_NOT_MONOTONIC`

---

## 6. Dependency Invariants

### INV-DEP-001: Evidence Closure
**Check**: All commits referencing evidence packs must include pack hashes; packs must exist in vault

**Pass**: All evidence present  
**Fail**: Missing evidence  
**Refusal code**: `MISSING_EVIDENCE`

### INV-DEP-002: Rule Catalog Reference
**Check**: Bundle must reference current or previous `rule_catalog_hash`

**Pass**: Valid reference  
**Fail**: Unknown catalog  
**Refusal code**: `UNKNOWN_RULE_CATALOG`

### INV-DEP-003: Commit Dependency Closure
**Check**: If commit references another commit (e.g., formula dependencies), referenced commit must exist in verified history

**Pass**: All dependencies present  
**Fail**: Missing dependency  
**Refusal code**: `MISSING_COMMIT_DEPENDENCY`

---

## Invariant Versioning

New invariants can be added with schema version bumps:
- `schema_version: "1.0.0"` → initial invariants
- `schema_version: "1.1.0"` → add new invariants (must be backward-compatible)
- `schema_version: "2.0.0"` → breaking change (requires migration)

## Test Vectors

Each invariant must have test cases in `tests/vault-guardian/`:
- `pass-*.bundle.json` — should accept
- `fail-*.bundle.json` — should refuse with specific code

## Audit Logging

Every invariant check result is logged:
```json
{
  "bundle_id": "...",
  "invariant": "INV-CRYPTO-003",
  "result": "PASS|FAIL",
  "detail": "..."
}
```

---

**Principle**: Invariants make refusal mechanical, not subjective.
