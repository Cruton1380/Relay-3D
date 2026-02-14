# VIS-6: Live Pulse

**Status:** VIS-6a CLOSED. VIS-6b CLOSED. VIS-6c in progress.

---

## VIS-6a — Live Timebox Pulse (Overlay Only)

### 1. Goal

When a new timebox appears for an owner, emit a visible pulse at the slab stack, briefly brighten owner slabs, optionally spike the flow bar (dept branch at COMPANY). Pure presentation overlay — no data mutation.

### 2. Activation

Pulse triggers only when: new timebox ID detected for an owner, LOD is COMPANY or SHEET, VIS-2 rules respected. No pulses at REGION/PLANETARY/LANIAKEA.

### 3. Detection

Renderer maintains `_vis6SeenTimeboxes = Map<ownerId, Set<timeboxId>>`. On render: if new ID not in previous set → trigger pulse. Update after render.

### 4. Visual Contract

- **Slab Pulse**: Temporary translucent expanding box at stack center. White → transparent. 800ms. Max radius 1.5x slab width. Cap: 20 concurrent.
- **Stack Glow**: Temporarily multiply slab RGB by 1.3 (clamped to 1.0). 800ms. Restore original color.
- **Flow Spike**: COMPANY only, dept branches. Temporary bright polyline extension (+15%). 800ms. Removed after timeout.

### 5. Logging

```
[VIS6] timeboxPulse owner=<id> timeboxId=<id> scope=<company|sheet>
[VIS6] pulseComplete owner=<id> timeboxId=<id>
[VIS6] gate-summary result=PASS pulses=<n>
```

### 6. Budget

Max 20 active pulses. No more than +20 primitives. No slab/flow bar count change. No LOD change.

### 7. Proof Script

`scripts/vis6-timebox-pulse-proof.mjs`

### 8. Non-Goals

No timebox creation/modification, no continuous animation, no per-cell animation, no governance/ledger changes.

---

## VIS-6b — Event Stream Pulse Propagation (Read-Only)

### 1. Goal

Route pulses from a deterministic in-memory event feed to the correct owner stack. Events processed in `(ts, id)` order, deduped, coalesced within 500ms windows, cap-enforced.

### 2. Event Schema

```
{ id, ts, type: "TIMEBOX_APPEARED"|"FLOW_UPDATE"|"EXCEPTION_UPDATE", scope, ownerId, deptId, sheetId, timeboxId, edges, exceptions }
```

### 3. Behavior

- `TIMEBOX_APPEARED`: Trigger VIS-6a pulse for owner + timebox. Flow spike if company + deptId has bar end.
- `FLOW_UPDATE`/`EXCEPTION_UPDATE`: Optional dept spike pulse if exceptions increased.
- Coalesce: same (ownerId, timeboxId) within 500ms → one pulse.
- Cap: max 20 concurrent. Excess → REFUSAL log.

### 4. Logging

```
[VIS6B] eventAccepted id=<id> type=<type> owner=<ownerId> ...
[VIS6B] pulseTriggered id=<id> owner=<ownerId> ...
[VIS6B] pulseCoalesced owner=<ownerId> ...
[REFUSAL] reason=VIS6B_PULSE_CAP_EXCEEDED ...
[VIS6B] summary accepted=<n> triggered=<n> coalesced=<n> dropped=<n>
[VIS6B] gate-summary result=PASS
```

### 5. Proof (Policy B — expected refusal)

`scripts/vis6b-event-stream-proof.mjs` — pushes deterministic batch including over-cap subtest. Expects one REFUSAL signature + gate-summary PASS.

### 6. Non-Goals

No websocket/network, no persistence, no timebox generation, no presence markers.

---

## VIS-6c — Transport Shim (WebSocket → VIS-6b)

### 1. Goal

Ingest events from an external WebSocket stream, normalize to VIS-6b schema, deliver via `vis6bPushEvent`/`vis6bPushEvents`. Transport only — no rendering, no mutation.

### 2. Connection

- Default endpoint: `ws://127.0.0.1:4030/vis6`
- Override: `window.RELAY_VIS6_WS_URL` or URL param `vis6ws=...`
- Auto-connect only when `RELAY_PROFILE=world` and `window.RELAY_ENABLE_VIS6C === true`

### 3. Wire Format

Single: `{"id":"...","ts":...,"ownerId":"...","timeboxId":"...","scope":"..."}`
Batch: `{"events":[{...},{...}]}`

### 4. Normalization

Coerce `id`, `ownerId`, `timeboxId` to string. Coerce `ts` to number. Drop on missing required fields or invalid ts. Attach `type: "TIMEBOX_APPEARED"` if missing.

### 5. Logging

```
[VIS6C] wsConnect url=<url>
[VIS6C] wsOpen url=<url>
[VIS6C] wsClose code=<code> reason=<reason>
[VIS6C] wsMessage accepted=<n> dropped=<n>
[VIS6C] drop reason=<bad_json|missing_fields|bad_ts>
[VIS6C] gate-summary result=PASS
```

### 6. Budget

Max 200 events per message. No new primitives. Only logs + VIS-6b calls.

### 7. Proof Script

`scripts/vis6c-transport-shim-proof.mjs` — embeds a local WS server, sends valid + invalid events, verifies logs end-to-end.

### 8. Non-Goals

No persistence, no ordering guarantees beyond VIS-6b, no UI controls beyond connect/disconnect/state, no server-side changes.
