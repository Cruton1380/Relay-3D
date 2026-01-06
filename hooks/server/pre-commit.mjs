#!/usr/bin/env node
// Relay repository pre-commit hook (Node module)
// Triggered by server PUT operations before committing new files
// Responsibilities:
//  - Run validation.mjs in a restricted sandbox to enforce whitelist + validation
//  - Validate file format and allowed paths

const { env, listChanged, readFromTree, upsertIndex } = Relay.utils;

const NEW_COMMIT = env('NEW_COMMIT');
const BRANCH = env('BRANCH', 'main');

if (!NEW_COMMIT) {
  // Continue
}

function main() {
  const changes = listChanged();

  // Run validation sandbox via Relay global
  const validationCode = readFromTree('.relay/validation.mjs');

  if (validationCode) {
    const result = Relay.utils.runValidation(validationCode.toString(), changes);
    if (result && result.ok === false) {
      console.error(result.message || 'validation failed');
      process.exit(1);
    }
  }

  // Maintain index for meta.yaml changes
  upsertIndex(changes, (p) => readFromTree(p), BRANCH);

  console.log('pre-commit validation passed');
}

try {
  main();
} catch (e) {
  console.error(e?.message || String(e));
  process.exit(1);
}
