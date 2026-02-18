# Cleanup Archive — 2026-02-16

Constitutional sweep per RELAY-MASTER-BUILD-PLAN stabilization pass.

## Classification Rule
Every file must map to: a Master Plan section, an execution slice, a frozen contract, a proof artifact, or explicit archive status.

## Archived Files

### orphan-docs/ (5 files)
Superseded by Master Plan. Not referenced in RELAY-MASTER-BUILD-PLAN.md, AGENTS.md, or HANDOFF.md.
- `VIS-3-FLOW-LENS.md` — former docs/vis/
- `VIS-6-LIVE-PULSE.md` — former docs/vis/
- `VIS-7-PRESENCE.md` — former docs/vis/
- `SPREADSHEET-LENS-ACCEPTANCE.md` — former docs/ui/
- `PRESENCE-AND-EDIT-SHEET-ACCEPTANCE.md` — former docs/ui/

### orphan-core/ (3 files)
Not in runtime dependency chain from relay-cesium-world.html. Zero active imports.
- `fileSystemCommits.js` — former core/models/commitTypes/
- `workZoneCommits.js` — former core/models/commitTypes/
- `file-observer.js` — former core/services/

### orphan-scripts/ (4 files)
One-time migration tools or legacy SDK. Not referenced by active proof scripts.
- `relay-migration-scripts.mjs` — v93 data export utility
- `download-all-counties.mjs` — one-time boundary download
- `load-mock-voters-via-api.mjs` — demo data seeder
- `relayNetworkSDK.mjs` — legacy SDK entry (package.json main updated)

Note: `v93-to-relay-state-adapter.mjs` was initially archived but restored — it is imported by active proof script `v93-data-salvage-1-proof.mjs`.

### orphan-data/ (5 files)
Legacy data files referenced only by archived React app.
- `index.json` — former data/boundaries/ (not loaded by current runtime)
- `prompts-README.md` — former data/prompts/
- `invites.json` — former data/users/
- `preferences.json` — former data/users/
- `users.json` — former data/users/

## Deleted (Never Committed)
- `tests/` (144 files) — all tested old React backend modules, none tested runtime chain
- `data/boundaries/metadata/` (108 files) — generated boundary metadata, zero active references
