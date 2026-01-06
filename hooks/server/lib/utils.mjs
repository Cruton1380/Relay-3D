// Shared utilities for Relay hooks (Sandboxed Version)
// Provides common functions for git operations, validation, and index management
// uses the global 'Relay' object provided by the host.

export function env(name, def) {
  return Relay.utils.env(name, def);
}

export function listChanged() {
  return Relay.utils.listChanged();
}

export function readFromTree(filePath) {
  return Relay.git.readFile(filePath);
}

export function yamlToJson(buf) {
  return Relay.utils.parseYaml(buf);
}

/**
 * Updates the branch-specific database with changes in meta.yaml files.
 */
export function upsertIndex(changes, readFileFn, branch = 'main') {
  return Relay.utils.upsertIndex(changes, readFileFn, branch);
}

export function verifyCommit() {
  return Relay.git.verifySignature();
}

export function matchPath(pattern, p) {
  return Relay.utils.matchPath(pattern, p);
}
