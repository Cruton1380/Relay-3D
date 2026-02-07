# Relay Vault Guardian Specification

The vault guardian is a verification daemon running on the NAS.
It enforces the verification boundary between custodian pushes and Canon storage.

## Responsibilities

- Watch incoming bundles
- Verify:
  - custody signature
  - bundle hash
  - merkle root (if used)
  - invariant checks (policy-defined)
- Accept:
  - move bundle into `verified/`
  - update verified repo mirror pointer (if applicable)
  - append audit record
- Refuse:
  - move bundle into `refused/`
  - write refusal record
  - emit alert

## Paths

**Watch:**
- `/volume1/canon/incoming/`

**Accept target:**
- `/volume1/canon/verified/bundles/`
- `/volume1/canon/verified/repo/` (optional mirror update)

**Refuse target:**
- `/volume1/canon/refused/`

**Audit log:**
- `/volume1/canon/audit/vault-guardian.log` (append-only)

## Bundle Format (minimum)

A bundle must include:
- `bundle_id`
- `payload` (commits, metadata)
- `bundle_hash`
- `merkle_root` (optional but recommended)
- `custodian_pubkey_id`
- `signature` over (`bundle_hash` + `merkle_root` + `rule_catalog_hash` + `head_commit`)

## Verification Steps (mechanical order)

1. Parse bundle header
2. Validate required fields present
3. Recompute `bundle_hash` from payload
4. Validate `merkle_root` (if present)
5. Verify `signature` using `custodian_pubkey_id`
6. Run invariant checks (defined in `CANON-INVARIANTS.md`):
   - schema version known (reject unknown schemas)
   - commit types allowed (reject unknown commit types)
   - append-only constraints (reject any commit that mutates history)
   - custody policy constraints (reject unauthorized signers)
   - dependency closure (reject commits referencing missing evidence)
7. If all pass → **ACCEPT**
8. Otherwise → **REFUSE**

## Accept Procedure

- Move bundle from `incoming/` to `verified/bundles/`
- Append audit entry:
  - `time`
  - `bundle_id`
  - `bundle_hash`
  - `result=ACCEPT`
- Optionally update read-only repo mirror pointer/index

## Refuse Procedure

- Move bundle from `incoming/` to `refused/`
- Write refusal record JSON:
  - `time`
  - `bundle_id`
  - `bundle_hash` (if parseable)
  - `refusal_reason_codes` (enumerated, see `CANON-INVARIANTS.md`)
  - `refusal_detail` (short, non-sensitive)
- Append audit entry `result=REFUSE`
- Emit alert (webhook or local notification)

## Refusal Reason Codes

See `CANON-INVARIANTS.md` for full enumeration. Examples:

- `SIGNATURE_INVALID`
- `HASH_MISMATCH`
- `UNKNOWN_SCHEMA`
- `UNAUTHORIZED_SIGNER`
- `APPEND_ONLY_VIOLATION`
- `MISSING_DEPENDENCY`

## Docker Deployment (NAS)

**Container:**
- `relay-vault-guardian`

**Requires:**
- read access to `incoming/`
- write access to `verified/`, `refused/`, `audit/`
- no network access required unless alerts use webhooks

**Restart policy:**
- `always`

## Degraded Safety

If guardian is down:
- `incoming/` may accumulate bundles
- `verified/` must remain unchanged
- no bundle is accepted without guardian verification

## Test Cases

1. Valid bundle → accepted, appears in `verified/`
2. Invalid signature → refused, refusal record created
3. Hash mismatch → refused
4. Invariant violation → refused
5. Guardian restart → no duplication; idempotent handling by `bundle_id`
