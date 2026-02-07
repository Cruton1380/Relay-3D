# Canon Vault Specification (NAS)

The Canon Vault is a storage and verification boundary.
It stores Canon artifacts and accepts or refuses incoming bundles based on verification.

It is not a coordination authority and does not resolve conflicts.

## Vault Roles

- Store verified Canon repository and signed bundles
- Snapshot and retain history (time machine)
- Provide read-only serving to mirrors (optional)
- Refuse invalid bundles (do not store in verified paths)

## Required Folder Layout

```
/volume1/
  canon/
    incoming/        # write queue (custodian pushes here)
    verified/        # verified bundles and repo (append-only)
    refused/         # refused bundles + refusal records
    repo/            # canonical git repo mirror (read-only to users)
    bundles/         # verified bundle store
    evidence/        # evidence packs referenced by bundles
    snapshots/       # snapshot exports (scheduled)
    audit/           # vault guardian logs (append-only)

  relay-media/       # allowed for Synology Drive/Photos (non-canonical)
    assets/
    user-drafts/
    exports/

  relay-mirrors/     # optional served mirrors (read-only)
```

## Access Control

### Canon paths
- `/volume1/canon/**` must NOT be exposed to Synology Drive sync.
- Only the vault guardian service user may write:
  - `incoming/`
  - `refused/`
  - `audit/`
- `verified/` is append-only by vault guardian.

### Permissions (example intent)
- canon folder: mode 700, owned by relay-core service user
- no interactive users have write access to canon paths

## Write Rules

- Custodian node may write ONLY into:
  - `/volume1/canon/incoming/`
- No direct writes to `verified/` `repo/` `bundles/` `evidence/` `snapshots/`

All verification and placement into `verified/` is performed by the vault guardian.

## Filesystem Immutability

- **Enable** Synology file versioning for `/volume1/canon/verified/`
- **OR**: enable WORM (Write Once Read Many) if supported
- Prevents accidental deletion or mutation even with compromised credentials
- Snapshots provide time-machine recovery

**Physical append-only > policy-only append-only.**

## Snapshots

- Enable filesystem snapshots for `/volume1/canon` (hourly recommended)
- Retention:
  - hourly: 24–48
  - daily: 14–30
  - weekly: 8–12
- Snapshot exports may be stored under `/volume1/canon/snapshots/`

**Snapshots are not a substitute for verification; they are durability.**

## Degraded Operation

If NAS is unavailable:

- Custodian continues authoring locally
- Bundles queue locally
- On reconnection: custodian pushes queued bundles to `incoming/`
- Vault guardian verifies and either accepts or refuses

Clients must reflect NAS unavailability as **DEGRADED** (no silent assumptions).

## Replication to Secondary Vault

- Secondary vault **MUST** be pull-only.
- Pull source: `/volume1/canon/verified/` (or a read-only export)
- After pull: secondary runs verification on the newest bundle(s)
- Secondary serves read-only state only if verification is current

**No bidirectional syncing.**
**No conflict resolution.**
