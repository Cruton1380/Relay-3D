# AI IDE Slice Prompt Template

Use this template in Cursor/AI IDE for every slice.

```text
Slice Name: <RAIL>-<SLICE>
Goal / Invariant: <single invariant>
Status: <DRAFT | IMPLEMENT | PROOF | REVIEW | ACCEPT>

Allowed files (3-5 max):
- <path>
- <path>
- <path>

Forbidden scope creep:
- No edits outside allowed files
- No runtime/engine changes unless explicitly in scope
- No unrequested contract changes

Proof script to run:
- <command>

Required logs that must appear:
- <log line 1>
- <log line 2>
- <log line 3>

Contract references:
- docs/architecture/RELAY-MASTER-BUILD-PLAN.md
- docs/architecture/RELAY-PHYSICS-CONTRACTS.md
- <slice contract doc>

Acceptance criteria:
1) Code path verified
2) Runtime behavior verified
3) Proof artifact produced and indexed
4) Contract alignment verified

Output format required:
Slice: <Name>
Baseline: <HEAD>
Classification: PASS / UNVERIFIED / FAIL
Micro-Batch: <single recommendation>
```

