#!/usr/bin/env node
// Relay repository pre-receive hook (Node module)
// Triggered by git push/receive operations before accepting commits
// Responsibilities:
//  - Validate commits meet repository requirements
//  - If this commit changes hooks/pre-commit.mjs or hooks/pre-receive.mjs, require a signed commit
//  - Run validation.mjs in a restricted sandbox to enforce whitelist + validation
//  - Maintain a lightweight JSON index (relay_index.json) for changed meta.yaml

const { env, listChanged, readFromTree, upsertIndex } = Relay.utils;

const NEW_COMMIT = env('NEW_COMMIT');
const BRANCH = env('BRANCH', 'main');

if (!NEW_COMMIT) {
  // Continue
}

function main() {
  const changes = listChanged();
  const signed = Relay.git.verifySignature();

  // Infrastructure protection
  const criticalChanges = changes.filter(ch =>
    ch.path === 'hooks/server/pre-commit.mjs' ||
    ch.path === 'hooks/server/pre-receive.mjs' ||
    ch.path === '.relay.yaml' ||
    ch.path === '.relay/validation.mjs'
  );

  if (criticalChanges.length > 0 && !signed) {
    console.error('CRITICAL: Infrastructure changes require a GPG/SSH signed commit.');
    process.exit(1);
  }

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

  console.log('pre-receive validation passed');
}

try {
  main();
} catch (e) {
  console.error(e?.message || String(e));
  process.exit(1);
}
