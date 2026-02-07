# Work Zones and Commit Materiality

**Status**: Active (core model)  
**Purpose**: Enforce commit materiality and zone-scoped workflows.

---

## Commit Types

- `WORKZONE_DEFINE`
- `WORKZONE_CONTEXT_SNAPSHOT`
- `COMMIT_STATE_SET`
- `MATERIAL_BOUNDARY_DECLARED`
- `REFUSAL`

---

## Gates (Enforced in code)

### Z1 — Zone ID Pattern

Zone IDs must match:

```
zone.<company>.<dept>.<project>
```

Example: `zone.avgol.ops.packaging`

### M1 — State Transition Gate

Commit state may change only via `COMMIT_STATE_SET`.

### MB1 — Material Boundary Required

Transitions to `COMMIT` or `REVERT` require a boundary reason:

- `time`
- `risk`
- `dependency`
- `visibility`

---

## Reference

Implementation: `core/models/commitTypes/workZoneCommits.js`
