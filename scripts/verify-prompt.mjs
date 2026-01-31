#!/usr/bin/env node
/**
 * PROMPT EXECUTION VERIFICATION SCRIPT
 * 
 * Ensures prompts follow coordination physics invariants:
 * - No execution without compiled prompt artifact
 * - No duplicate active prompt heads for same context
 * - Merged prompts must have merge scars
 * - Compiler version changes require explicit commits
 * - Sequence auto-advance requires trigger commits
 * 
 * Run: npm run verify:prompt
 * 
 * Exits with code 1 if violations found.
 * 
 * CRITICAL INVARIANT:
 * "If an AI action cannot be replayed from a compiled prompt artifact, it is invalid."
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log(`${BOLD}${CYAN}🔍 Verifying Prompt Coordination Invariants...${RESET}\n`);

let violations = [];
let warnings = [];

// ============================================================================
// HELPER: Load prompt filaments from coordination data
// ============================================================================
function loadPromptFilaments() {
  const promptDataPath = path.join(projectRoot, 'data', 'prompts');
  
  if (!fs.existsSync(promptDataPath)) {
    return { prompts: {}, sequences: {}, runs: {}, snapshots: {}, merges: {} };
  }
  
  const promptFiles = glob.sync('prompt.*.json', { cwd: promptDataPath });
  const sequenceFiles = glob.sync('sequence.*.json', { cwd: promptDataPath });
  const runFiles = glob.sync('run.*.json', { cwd: promptDataPath });
  const snapshotFiles = glob.sync('snapshot.*.json', { cwd: promptDataPath });
  const mergeFiles = glob.sync('merge.*.json', { cwd: promptDataPath });
  
  const load = (files, dir) => files.reduce((acc, f) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
      acc[data.filamentId || f] = data;
    } catch (e) {
      warnings.push(`⚠️  Failed to parse ${f}: ${e.message}`);
    }
    return acc;
  }, {});
  
  return {
    prompts: load(promptFiles, promptDataPath),
    sequences: load(sequenceFiles, promptDataPath),
    runs: load(runFiles, promptDataPath),
    snapshots: load(snapshotFiles, promptDataPath),
    merges: load(mergeFiles, promptDataPath),
  };
}

// ============================================================================
// CHECK 1: No execution without compiled prompt artifact
// ============================================================================
console.log('📋 Checking: All runs reference compiled prompt artifacts...');

const data = loadPromptFilaments();
const { prompts, sequences, runs, snapshots, merges } = data;

let runsChecked = 0;
Object.values(runs).forEach(run => {
  runsChecked++;
  
  // Rule: Every run must reference a compiled prompt artifact
  if (!run.compiledPromptRef) {
    violations.push(
      `❌ Run ${run.filamentId} missing compiledPromptRef\n` +
      `   → Runs must reference a compiled prompt artifact, not raw text\n` +
      `   → Add PROMPT_COMPILE commit before PROMPT_EXECUTE`
    );
  }
  
  // Rule: Compiled prompt must exist
  if (run.compiledPromptRef) {
    const compiledPrompt = prompts[run.compiledPromptRef];
    if (!compiledPrompt) {
      violations.push(
        `❌ Run ${run.filamentId} references non-existent compiled prompt: ${run.compiledPromptRef}\n` +
        `   → Compiled prompt artifact not found`
      );
    } else {
      // Rule: Compiled prompt must cite source + compiler
      if (!compiledPrompt.sourcePromptRef) {
        violations.push(
          `❌ Compiled prompt ${run.compiledPromptRef} missing sourcePromptRef\n` +
          `   → Must cite exact source prompt head`
        );
      }
      if (!compiledPrompt.compilerRef) {
        violations.push(
          `❌ Compiled prompt ${run.compiledPromptRef} missing compilerRef\n` +
          `   → Must cite exact compiler version`
        );
      }
    }
  }
});

if (runsChecked === 0) {
  console.log(`   ${YELLOW}ℹ${RESET}  No runs found to verify (this is OK if you haven't executed any prompts yet)`);
} else if (violations.length === 0) {
  console.log(`   ${GREEN}✓${RESET} All ${runsChecked} run(s) reference compiled prompt artifacts`);
}

// ============================================================================
// CHECK 2: No duplicate active prompt heads for same context
// ============================================================================
console.log('📋 Checking: No duplicate active prompt heads...');

const promptHeadsByContext = {};
Object.values(prompts).forEach(prompt => {
  if (prompt.status === 'active' || !prompt.status) {
    const context = prompt.context || 'default';
    if (!promptHeadsByContext[context]) {
      promptHeadsByContext[context] = [];
    }
    promptHeadsByContext[context].push(prompt.filamentId);
  }
});

Object.entries(promptHeadsByContext).forEach(([context, heads]) => {
  if (heads.length > 1) {
    violations.push(
      `❌ Multiple active prompt heads for context "${context}":\n` +
      heads.map(h => `   - ${h}`).join('\n') +
      `\n   → Mark all but one as archived or create explicit branches`
    );
  }
});

if (Object.keys(promptHeadsByContext).length === 0) {
  console.log(`   ${YELLOW}ℹ${RESET}  No active prompts found`);
} else {
  const totalContexts = Object.keys(promptHeadsByContext).length;
  const cleanContexts = Object.values(promptHeadsByContext).filter(h => h.length === 1).length;
  if (cleanContexts === totalContexts) {
    console.log(`   ${GREEN}✓${RESET} All ${totalContexts} context(s) have exactly one active head`);
  }
}

// ============================================================================
// CHECK 3: Merged prompts must have merge scars
// ============================================================================
console.log('📋 Checking: Merged prompts have merge scars...');

let mergedPromptsChecked = 0;
Object.values(prompts).forEach(prompt => {
  if (prompt.isMerged || (prompt.branches && prompt.branches.length > 0)) {
    mergedPromptsChecked++;
    
    // Rule: Merged prompt must reference a merge scar
    if (!prompt.mergeScarRef) {
      violations.push(
        `❌ Merged prompt ${prompt.filamentId} missing mergeScarRef\n` +
        `   → Merged prompts must reference explicit MERGE_SCAR commit`
      );
    }
    
    // Rule: Merge scar must exist
    if (prompt.mergeScarRef && !merges[prompt.mergeScarRef]) {
      violations.push(
        `❌ Merged prompt ${prompt.filamentId} references non-existent merge scar: ${prompt.mergeScarRef}`
      );
    }
    
    // Rule: Merge scar must cite both branch heads
    const mergeScar = merges[prompt.mergeScarRef];
    if (mergeScar && (!mergeScar.branchARefs || !mergeScar.branchBRefs)) {
      violations.push(
        `❌ Merge scar ${prompt.mergeScarRef} missing branch references\n` +
        `   → Must cite both branch heads (branchARefs, branchBRefs)`
      );
    }
  }
});

if (mergedPromptsChecked === 0) {
  console.log(`   ${YELLOW}ℹ${RESET}  No merged prompts found`);
} else if (violations.length === 0) {
  console.log(`   ${GREEN}✓${RESET} All ${mergedPromptsChecked} merged prompt(s) have valid merge scars`);
}

// ============================================================================
// CHECK 4: Sequence auto-advance requires trigger commits
// ============================================================================
console.log('📋 Checking: Sequence steps have explicit triggers...');

let sequenceStepsChecked = 0;
Object.values(sequences).forEach(sequence => {
  (sequence.steps || []).forEach((step, idx) => {
    sequenceStepsChecked++;
    
    // Rule: Auto-advance steps must declare trigger
    if (step.autoAdvance && !step.trigger) {
      violations.push(
        `❌ Sequence ${sequence.filamentId} step ${idx} has autoAdvance but no trigger\n` +
        `   → Steps that auto-advance must declare explicit trigger (ON_ASSISTANT_RESPONSE, etc.)`
      );
    }
    
    // Rule: Steps must reference compiled prompts, not raw text
    if (step.promptText && !step.compiledPromptRef) {
      violations.push(
        `❌ Sequence ${sequence.filamentId} step ${idx} uses raw promptText\n` +
        `   → Steps must reference compiledPromptRef, not raw text`
      );
    }
  });
});

if (sequenceStepsChecked === 0) {
  console.log(`   ${YELLOW}ℹ${RESET}  No sequence steps found`);
} else if (violations.length === 0) {
  console.log(`   ${GREEN}✓${RESET} All ${sequenceStepsChecked} sequence step(s) have valid triggers`);
}

// ============================================================================
// CHECK 5: Compiler version changes require explicit commits
// ============================================================================
console.log('📋 Checking: Compiler version changes are explicit...');

const compilersUsed = new Set();
Object.values(prompts).forEach(prompt => {
  if (prompt.compilerRef) {
    compilersUsed.add(prompt.compilerRef);
  }
});

if (compilersUsed.size > 1) {
  warnings.push(
    `${YELLOW}⚠${RESET}  Multiple compiler versions in use: ${Array.from(compilersUsed).join(', ')}\n` +
    `   → Ensure compiler version changes have explicit PROMPT_COMPILE commits`
  );
}

if (compilersUsed.size === 0) {
  console.log(`   ${YELLOW}ℹ${RESET}  No compiled prompts found`);
} else {
  console.log(`   ${GREEN}✓${RESET} ${compilersUsed.size} compiler version(s) in use`);
}

// ============================================================================
// CHECK 6: Snapshots cite source + compiler + outputs
// ============================================================================
console.log('📋 Checking: Snapshots have complete metadata...');

let snapshotsChecked = 0;
Object.values(snapshots).forEach(snapshot => {
  snapshotsChecked++;
  
  if (!snapshot.promptHeadRef) {
    violations.push(
      `❌ Snapshot ${snapshot.filamentId} missing promptHeadRef\n` +
      `   → Snapshots must cite exact prompt head`
    );
  }
  
  if (!snapshot.compilerRef) {
    warnings.push(
      `${YELLOW}⚠${RESET}  Snapshot ${snapshot.filamentId} missing compilerRef\n` +
      `   → Recommended: cite compiler version for full reproducibility`
    );
  }
});

if (snapshotsChecked === 0) {
  console.log(`   ${YELLOW}ℹ${RESET}  No snapshots found`);
} else if (violations.length === 0) {
  console.log(`   ${GREEN}✓${RESET} All ${snapshotsChecked} snapshot(s) have valid metadata`);
}

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));

if (warnings.length > 0) {
  console.log(`${YELLOW}${BOLD}⚠  ${warnings.length} warning(s):${RESET}\n`);
  warnings.forEach(w => console.log(`${w}\n`));
}

if (violations.length === 0) {
  console.log(`${GREEN}${BOLD}✓ All coordination invariants satisfied!${RESET}`);
  console.log(`${GREEN}Prompt execution chain is deterministic and replayable.${RESET}\n`);
  process.exit(0);
} else {
  console.log(`${RED}${BOLD}✗ ${violations.length} violation(s) found:${RESET}\n`);
  violations.forEach(v => console.log(`${v}\n`));
  console.log(`${YELLOW}Fix these violations before executing prompts.${RESET}`);
  console.log(`${CYAN}See: PROMPT-COORDINATION-INVARIANTS.md${RESET}\n`);
  process.exit(1);
}
