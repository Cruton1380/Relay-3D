/**
 * PROMPT COORDINATION SCHEMAS
 * 
 * First-class filaments and commits for prompt management as coordination physics.
 * 
 * Core Invariant:
 * "If an AI action cannot be replayed from a compiled prompt artifact, it is invalid."
 */

// ============================================================================
// COMPILED PROMPT ARTIFACT (the "index.html" of prompt execution)
// ============================================================================

/**
 * @typedef {Object} CompiledPromptArtifact
 * @property {string} artifactId - Unique ID: compiled.<promptId>@<compilerVersion>
 * @property {string} sourcePromptRef - Exact prompt head this was compiled from
 * @property {string} compilerRef - Exact compiler version used
 * @property {string|null} mergeScarRef - If merged, reference to MERGE_SCAR commit
 * @property {string} renderedPrompt - Final execution string
 * @property {Object} metadata - Compiler metadata
 * @property {string[]} metadata.constraints - Non-negotiables injected
 * @property {string[]} metadata.contextRefs - Attached invariants/axes/rules
 * @property {string} metadata.targetFormat - tool-specific format (image/video/code)
 * @property {number} metadata.compiledAt - Unix timestamp
 * @property {string[]} refs - References: [sourcePromptRef, compilerRef, mergeScarRef?]
 */

export function createCompiledPromptArtifact({
  sourcePromptRef,
  compilerRef,
  renderedPrompt,
  constraints = [],
  contextRefs = [],
  targetFormat = 'text',
  mergeScarRef = null,
}) {
  const now = Date.now();
  const artifactId = `compiled.${sourcePromptRef.split('.')[1]}@${compilerRef.split('@')[1]}`;
  
  const refs = [sourcePromptRef, compilerRef];
  if (mergeScarRef) refs.push(mergeScarRef);
  
  return {
    artifactId,
    sourcePromptRef,
    compilerRef,
    mergeScarRef,
    renderedPrompt,
    metadata: {
      constraints,
      contextRefs,
      targetFormat,
      compiledAt: now,
    },
    refs,
  };
}

/**
 * Verify a compiled prompt artifact is valid
 */
export function verifyCompiledPromptArtifact(artifact) {
  const errors = [];
  
  if (!artifact.sourcePromptRef) {
    errors.push('Missing sourcePromptRef - must cite exact prompt head');
  }
  
  if (!artifact.compilerRef) {
    errors.push('Missing compilerRef - must cite exact compiler version');
  }
  
  if (!artifact.renderedPrompt || artifact.renderedPrompt.trim() === '') {
    errors.push('Missing or empty renderedPrompt');
  }
  
  if (artifact.mergeScarRef && !artifact.mergeScarRef.startsWith('merge.')) {
    errors.push('Invalid mergeScarRef - must reference merge.* filament');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// FILAMENT: prompt.*
// ============================================================================

/**
 * @typedef {Object} PromptFilament
 * @property {string} filamentId - prompt.<promptId>
 * @property {Object[]} commits - Append-only commit log
 * @property {number} headIndex - Current head commit index
 * @property {string} status - 'active' | 'archived' | 'branched'
 * @property {string|null} context - Context this prompt applies to
 */

/**
 * Commit: PROMPT_CREATE
 */
export function createPromptCreate({ promptId, sourceText, context = 'default', authorityRef }) {
  return {
    op: 'PROMPT_CREATE',
    promptId,
    payload: {
      sourceText,
      context,
      createdAt: Date.now(),
    },
    refs: {
      authorityRef,
    },
  };
}

/**
 * Commit: PROMPT_EDIT
 */
export function createPromptEdit({ promptId, newSourceText, reason, authorityRef }) {
  return {
    op: 'PROMPT_EDIT',
    promptId,
    payload: {
      newSourceText,
      reason,
      editedAt: Date.now(),
    },
    refs: {
      authorityRef,
    },
  };
}

/**
 * Commit: PROMPT_COMPILE
 */
export function createPromptCompile({ promptId, compilerRef, compiledArtifactRef, authorityRef }) {
  return {
    op: 'PROMPT_COMPILE',
    promptId,
    payload: {
      compilerRef,
      compiledArtifactRef,
      compiledAt: Date.now(),
    },
    refs: {
      compilerRef,
      compiledArtifactRef,
      authorityRef,
    },
  };
}

/**
 * Commit: PROMPT_SNAPSHOT_SAVE
 */
export function createPromptSnapshotSave({ snapshotId, promptHeadRef, compilerRef, label, reason, exampleOutputRefs = [] }) {
  return {
    op: 'PROMPT_SNAPSHOT_SAVE',
    snapshotId,
    payload: {
      promptHeadRef,
      compilerRef,
      label,
      reason,
      exampleOutputRefs,
      savedAt: Date.now(),
    },
    refs: {
      promptHeadRef,
      compilerRef,
      outputs: exampleOutputRefs,
    },
  };
}

/**
 * Commit: PROMPT_SNAPSHOT_RESTORE
 */
export function createPromptSnapshotRestore({ promptId, snapshotRef, authorityRef }) {
  return {
    op: 'PROMPT_SNAPSHOT_RESTORE',
    promptId,
    payload: {
      snapshotRef,
      restoredAt: Date.now(),
    },
    refs: {
      snapshotRef,
      authorityRef,
    },
  };
}

// ============================================================================
// FILAMENT: sequence.*
// ============================================================================

/**
 * @typedef {Object} SequenceFilament
 * @property {string} filamentId - sequence.<sequenceId>
 * @property {Object[]} steps - Ordered steps
 * @property {string} status - 'ready' | 'running' | 'paused' | 'completed' | 'aborted'
 */

/**
 * Commit: SEQUENCE_CREATE
 */
export function createSequenceCreate({ sequenceId, name, description, authorityRef }) {
  return {
    op: 'SEQUENCE_CREATE',
    sequenceId,
    payload: {
      name,
      description,
      createdAt: Date.now(),
    },
    refs: {
      authorityRef,
    },
  };
}

/**
 * Commit: SEQUENCE_ADD_STEP
 */
export function createSequenceAddStep({ sequenceId, compiledPromptRef, trigger, targetTool, authorityRef }) {
  return {
    op: 'SEQUENCE_ADD_STEP',
    sequenceId,
    payload: {
      compiledPromptRef,
      trigger: trigger || 'ON_MANUAL',
      targetTool: targetTool || 'assistant',
      addedAt: Date.now(),
    },
    refs: {
      compiledPromptRef,
      authorityRef,
    },
  };
}

/**
 * Commit: SEQUENCE_STEP_ADVANCE
 */
export function createSequenceStepAdvance({ sequenceId, fromStep, toStep, triggerReason }) {
  return {
    op: 'SEQUENCE_STEP_ADVANCE',
    sequenceId,
    payload: {
      fromStep,
      toStep,
      triggerReason,
      advancedAt: Date.now(),
    },
    refs: {},
  };
}

// ============================================================================
// FILAMENT: run.*
// ============================================================================

/**
 * @typedef {Object} RunFilament
 * @property {string} filamentId - run.<runId>
 * @property {string} compiledPromptRef - The compiled prompt that was executed
 * @property {Object} result - Execution result
 * @property {string} status - 'pending' | 'running' | 'completed' | 'failed'
 */

/**
 * Commit: PROMPT_EXECUTE
 */
export function createPromptExecute({ runId, compiledPromptRef, targetTool, authorityRef }) {
  return {
    op: 'PROMPT_EXECUTE',
    runId,
    payload: {
      compiledPromptRef,
      targetTool,
      executedAt: Date.now(),
    },
    refs: {
      compiledPromptRef,
      authorityRef,
    },
  };
}

/**
 * Commit: PROMPT_EXECUTE_RESULT
 */
export function createPromptExecuteResult({ runId, resultText, resultRefs = [], success = true }) {
  return {
    op: 'PROMPT_EXECUTE_RESULT',
    runId,
    payload: {
      resultText,
      resultRefs,
      success,
      completedAt: Date.now(),
    },
    refs: {
      outputs: resultRefs,
    },
  };
}

// ============================================================================
// FILAMENT: merge.*
// ============================================================================

/**
 * Commit: PROMPT_MERGE_RESOLVE (creates merge scar)
 */
export function createPromptMergeResolve({ mergeId, branchARef, branchBRef, resolvedPromptRef, conflictResolutions, authorityRef }) {
  return {
    op: 'PROMPT_MERGE_RESOLVE',
    mergeId,
    payload: {
      branchARef,
      branchBRef,
      resolvedPromptRef,
      conflictResolutions, // Array of { section, chosenBranch, reason }
      mergedAt: Date.now(),
    },
    refs: {
      branchA: branchARef,
      branchB: branchBRef,
      resolved: resolvedPromptRef,
      authorityRef,
    },
  };
}

// ============================================================================
// TRIGGER TYPES (for sequence automation)
// ============================================================================

export const TriggerTypes = {
  ON_MANUAL: 'ON_MANUAL',
  ON_ASSISTANT_RESPONSE: 'ON_ASSISTANT_RESPONSE',
  ON_USER_MESSAGE: 'ON_USER_MESSAGE',
  ON_TOOL_RESULT: 'ON_TOOL_RESULT',
  ON_TAG_MATCH: 'ON_TAG_MATCH',
  ON_SCHEMA_MATCH: 'ON_SCHEMA_MATCH',
};

/**
 * Evaluate if a trigger condition is met
 */
export function evaluateTrigger(trigger, event) {
  switch (trigger.type) {
    case TriggerTypes.ON_ASSISTANT_RESPONSE:
      return event.type === 'assistant_response';
    
    case TriggerTypes.ON_USER_MESSAGE:
      return event.type === 'user_message';
    
    case TriggerTypes.ON_TOOL_RESULT:
      return event.type === 'tool_result' && 
             (!trigger.toolName || event.toolName === trigger.toolName);
    
    case TriggerTypes.ON_TAG_MATCH:
      return event.type === 'assistant_response' && 
             event.text && 
             trigger.tag && 
             event.text.includes(trigger.tag);
    
    case TriggerTypes.ON_SCHEMA_MATCH:
      // Would validate event.data against trigger.schema
      return false; // Placeholder
    
    default:
      return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createCompiledPromptArtifact,
  verifyCompiledPromptArtifact,
  createPromptCreate,
  createPromptEdit,
  createPromptCompile,
  createPromptSnapshotSave,
  createPromptSnapshotRestore,
  createSequenceCreate,
  createSequenceAddStep,
  createSequenceStepAdvance,
  createPromptExecute,
  createPromptExecuteResult,
  createPromptMergeResolve,
  TriggerTypes,
  evaluateTrigger,
};
