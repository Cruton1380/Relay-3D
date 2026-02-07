# Edge Verify Endpoint Contract

Clients must be able to verify Canon lineage before accepting any state.
HTTPS protects transport; this endpoint provides provenance verification.

## Endpoint

```
GET /canon/verify
```

## Purpose

Return the minimal proof material required for a client to:
- confirm current Canon lineage head
- confirm rule catalog identity
- confirm bundle integrity and custody signature
- decide NORMAL vs DEGRADED operation

## Response (JSON)

```json
{
  "canon": {
    "repo_id": "string",
    "head_commit": "sha256-or-git-hash",
    "head_timebox": {
      "timebox_id": "string",
      "commit_index": 1234
    }
  },
  "rules": {
    "rule_catalog_hash": "sha256",
    "schema_version": "string"
  },
  "bundle": {
    "bundle_id": "string",
    "bundle_hash": "sha256",
    "merkle_root": "sha256"
  },
  "custody": {
    "custodian_pubkey_id": "string",
    "signature": "base64",
    "signature_alg": "ed25519"
  },
  "server": {
    "pressure_state": "NORMAL|DEGRADED|INDETERMINATE|REFUSAL",
    "retry_after_seconds": 0
  },
  "nonce": "uuid-v4-or-random",
  "timestamp_ms": 0
}
```

## Client Rules

1. Client fetches `/canon/verify` on startup and periodically (e.g., every 30–120s).
2. Client verifies:
   - signature over `bundle_hash` (and/or `merkle_root`) using `custodian_pubkey_id`
   - `rule_catalog_hash` matches the rule set it displays
3. Client must verify `timestamp_ms` is within reasonable drift (e.g., ±300s)
4. Client should cache `nonce` to detect replayed responses (optional defense-in-depth)
5. If verification fails:
   - client enters **DEGRADED**:
     - read-only view
     - proposals may be locally queued but not submitted as accepted state
     - UI must visibly indicate DEGRADED
6. If `server.pressure_state` is DEGRADED or higher:
   - client reduces polling/fanout
   - respects `retry_after_seconds`

## Error Behavior

- **200**: returns proof material
- **503**: pressure refusal for new sessions
  - include `Retry-After` header (seconds)
- **429**: rate limiting
- **5xx**: treated as INDETERMINATE by clients (not trusted)

## Replay Attack Prevention

- `nonce` is unique per response
- `timestamp_ms` must be current (within drift tolerance)
- Stale or replayed responses are rejected by clients

## Non-Goals

- This endpoint does not return full history.
- This endpoint does not grant write permission.
- This endpoint does not replace local verification of downloaded bundles.
