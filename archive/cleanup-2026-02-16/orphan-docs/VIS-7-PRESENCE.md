# VIS-7: Presence

**Status:** VIS-7a CLOSED. VIS-7b in progress.

---

## VIS-7a — Presence Markers (Ephemeral)

### 1. Goal

Make the world feel inhabited. Ephemeral "who is here / looking at what" markers that self-expire after TTL.

### 2. Scope

- COMPANY (collapsed): markers near dept spines / trunk.
- SHEET: markers near selected sheet.
- Suppressed at WORLD/REGION/PLANETARY/LANIAKEA.
- No identity/auth/governance/ledger changes. No persistence beyond TTL. No per-cell presence.

### 3. Event Schema

```
{ type:"presence", id, ts, userId, scope:"company|dept|sheet", companyId, deptId, sheetId, mode:"view|edit", cursor:{x,y} }
```

### 4. Runtime Rules

- TTL: 15000ms. Updates from same (userId, targetKey) refresh TTL.
- Dedup: same event id processed once.
- Coalesce: 250ms per user (keep latest).
- Cap: max 50 active markers. Excess → `[REFUSAL] reason=VIS7A_MARKER_CAP_EXCEEDED`.

### 5. Rendering

- One point primitive per marker (colored by mode: green=view, orange=edit).
- Optional label (userId suffix), capped at 30 labels.
- Placement: COMPANY → dept spine midpoint +U offset; SHEET → sheet center or cursor-mapped position.
- Auto-cleanup after TTL.

### 6. Logging

```
[VIS7A] presenceEngine enabled ttlMs=15000 cap=50 coalesceMs=250
[VIS7A] batchApplied accepted=<n> coalesced=<n> dupDropped=<n> dropped=<n> active=<n>
[VIS7A] rendered scope=<company|sheet> markers=<n> labels=<n> capped=<true|false>
[REFUSAL] reason=VIS7A_MARKER_CAP_EXCEEDED active=50 dropped=<n>
[VIS7A] gate-summary result=PASS
```

### 7. Budget

`primitiveCount.presenceMarkers` <= 50. Labels <= 30. Total added <= 60 worst case.

### 8. Proof Script

`scripts/vis7a-presence-proof.mjs`

### 9. Non-Goals

No auth, no persistence, no per-cell presence, no identity system.

---

## VIS-7b — Presence Inspect (Hover + Pin + HUD)

### 1. Goal

Make presence markers inspectable. Hover shows details, click pins/unpins, Escape clears.

### 2. Scope

COMPANY collapsed + SHEET only. Display-only. No mutation.

### 3. Visual Contract

- **Hover**: Yellow highlight (1 primitive) around hovered marker. HUD card: userId, mode, ageMs, target, scope.
- **Pin**: Click toggles. Pinned = highlight persists. Click again = unpin. Click different = switch. Escape = clear.
- **Budget**: Max 1 highlight primitive. No new markers beyond VIS-7a cap.

### 4. Logging

```
[VIS7B] hover marker=<id> user=<userId> mode=<mode> scope=<scope> ageMs=<n> result=PASS
[VIS7B] pin marker=<id> user=<userId> result=PASS
[VIS7B] unpin marker=<id> user=<userId> result=PASS reason=<toggle|escape|switch>
[VIS7B] gate-summary result=PASS
```

### 5. Proof Script

`scripts/vis7b-presence-inspect-proof.mjs`

### 6. Non-Goals

No "jump to user", no chat, no identity model changes, no KPI overlays.
