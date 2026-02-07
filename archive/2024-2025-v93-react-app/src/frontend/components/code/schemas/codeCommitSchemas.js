/**
 * CODE COMMIT SCHEMAS
 * 
 * Commit builders for code filaments:
 * - Module operations (create, add function, rename, etc.)
 * - Evidence attachment (typecheck, tests, lint)
 * - Dependency tracking (imports/exports)
 * 
 * All schemas follow Relay commit envelope:
 * { filamentId, commitIndex, ts, actor, op, refs?, payload }
 */

// ============================================
// SHARED COMMIT ENVELOPE
// ============================================

function createBaseCommit(filamentId, commitIndex, actorId, op) {
  return {
    filamentId,
    commitIndex,
    ts: Date.now(),
    actor: {
      kind: 'user',
      id: actorId,
    },
    op,
  };
}

// ============================================
// MODULE OPERATIONS
// ============================================

/**
 * Create module (initial file creation)
 */
export function createModuleCreatedCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'MODULE_CREATED'),
    payload: {
      moduleId: payload.moduleId,
      language: payload.language || 'typescript',
      exports: [],
      imports: [],
      ...payload,
    },
    evidence: payload.evidence || {
      typecheck: { status: 'PASS', errors: [] },
      tests: { status: 'PASS', passed: 0, failed: 0 },
    },
  };
}

/**
 * Add function to module
 */
export function createFunctionAddedCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'FUNCTION_ADDED'),
    payload: {
      functionName: payload.functionName,
      signature: payload.signature,
      exported: payload.exported || false,
      locus: `function:${payload.functionName}`,
      ...payload,
    },
    evidence: payload.evidence || {
      typecheck: { status: 'PASS', errors: [] },
      tests: { status: 'PASS', passed: 0, failed: 0 },
    },
  };
}

/**
 * Rename function (refactoring operation)
 */
export function createFunctionRenamedCommit(
  filamentId,
  commitIndex,
  actorId,
  downstreamReferences,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'FUNCTION_RENAMED'),
    payload: {
      oldName: payload.oldName,
      newName: payload.newName,
      scope: payload.scope || 'module',
      locus: `function:${payload.newName}`,
      ...payload,
    },
    refs: {
      inputs: downstreamReferences, // Modules that import this symbol
    },
    evidence: payload.evidence || {
      typecheck: { status: 'PASS', errors: [] },
      tests: { status: 'PASS', passed: 0, failed: 0 },
    },
  };
}

/**
 * Add import to module
 */
export function createImportAddedCommit(
  filamentId,
  commitIndex,
  actorId,
  importedModule,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'IMPORT_ADDED'),
    payload: {
      module: payload.module,
      symbols: payload.symbols,
      ...payload,
    },
    refs: {
      inputs: [importedModule], // Evidence-backed reference to imported module
    },
    evidence: payload.evidence || {
      typecheck: { status: 'PASS', errors: [] },
      tests: { status: 'PASS', passed: 0, failed: 0 },
    },
  };
}

/**
 * Update exports (API surface change)
 */
export function createExportsUpdatedCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'EXPORTS_UPDATED'),
    payload: {
      exports: payload.exports,
      ...payload,
    },
    evidence: payload.evidence || {
      typecheck: { status: 'PASS', errors: [] },
      tests: { status: 'PASS', passed: 0, failed: 0 },
    },
  };
}

// ============================================
// EVIDENCE HELPERS
// ============================================

/**
 * Create evidence object (typecheck + tests + lint)
 */
export function createEvidence(typecheck, tests, lint) {
  return {
    typecheck: typecheck || { status: 'PASS', errors: [] },
    tests: tests || { status: 'PASS', passed: 0, failed: 0 },
    lint: lint || { status: 'PASS', warnings: [] },
  };
}

/**
 * Create failed typecheck evidence
 */
export function createTypecheckFailure(errors) {
  return {
    status: 'FAIL',
    errors,
    output: `${errors.length} error(s)`,
  };
}

/**
 * Create failed test evidence
 */
export function createTestFailure(failed, passed, output) {
  return {
    status: 'FAIL',
    passed,
    failed,
    output,
  };
}

// ============================================
// HELPER: Get Latest Commit
// ============================================

export function getLatestCommit(filament) {
  if (!filament || !filament.commits || filament.commits.length === 0) {
    return null;
  }
  const latestIndex = filament.commits.length - 1;
  return {
    filamentId: filament.id,
    commitIndex: latestIndex,
    commit: filament.commits[latestIndex],
  };
}

/**
 * Get exported symbols from module filament
 */
export function getExportedSymbols(filament) {
  if (!filament || !filament.commits || filament.commits.length === 0) {
    return [];
  }
  
  const exports = new Set();
  
  // Replay commits to build current export list
  for (const commit of filament.commits) {
    if (commit.op === 'FUNCTION_ADDED' && commit.payload.exported) {
      exports.add(commit.payload.functionName);
    }
    if (commit.op === 'FUNCTION_RENAMED') {
      exports.delete(commit.payload.oldName);
      if (commit.payload.exported !== false) {
        exports.add(commit.payload.newName);
      }
    }
    if (commit.op === 'EXPORTS_UPDATED') {
      // Override with explicit export list
      return commit.payload.exports;
    }
  }
  
  return Array.from(exports);
}

/**
 * Get imported modules from module filament
 */
export function getImportedModules(filament) {
  if (!filament || !filament.commits || filament.commits.length === 0) {
    return [];
  }
  
  const imports = [];
  
  for (const commit of filament.commits) {
    if (commit.op === 'IMPORT_ADDED') {
      imports.push({
        module: commit.payload.module,
        symbols: commit.payload.symbols,
      });
    }
  }
  
  return imports;
}
