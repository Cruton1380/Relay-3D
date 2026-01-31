# Prompt Coordination Data

This folder contains first-class filaments for prompt management.

## Structure

```
prompts/
├── prompt.*.json      - Source prompt filaments
├── sequence.*.json    - Runnable prompt sequences
├── run.*.json         - Execution records
├── snapshot.*.json    - Saved known-good states
├── merge.*.json       - Merge scars
└── compiled.*.json    - Compiled prompt artifacts
```

## Filament Format

Each JSON file represents a filament with commits:

```json
{
  "filamentId": "prompt.P123",
  "kind": "prompt",
  "commits": [
    {
      "commitIndex": 0,
      "op": "PROMPT_CREATE",
      "payload": { "sourceText": "..." },
      "refs": { "authorityRef": "..." },
      "timestamp": 1706483200000
    }
  ],
  "headIndex": 0,
  "status": "active",
  "context": "default"
}
```

## Verification

Run `npm run verify:prompt` to check invariants before execution.

## See Also

- `PROMPT-COORDINATION-INVARIANTS.md` - Full specification
- `scripts/verify-prompt.mjs` - Verification script
- `src/backend/schemas/promptCoordinationSchemas.js` - Schema definitions
