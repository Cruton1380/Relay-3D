/**
 * Relay Query Hook v1
 * 
 * CRITICAL: This is the ONLY source of derived truth (vote counts, rankings, metrics).
 * Never compute aggregates in the UI or services - always call query hooks.
 * 
 * Handles query requests for aggregated/computed data.
 * This hook is called by the Relay server on GET /relay/query/* requests.
 * 
 * @param {Object} context - Query context
 * @param {string} context.repo - Repository name
 * @param {string} context.branch - Branch name (optional)
 * @param {string} context.endpoint - Query endpoint (e.g., '/rankings')
 * @param {Object} context.params - Query parameters
 * @returns {Promise<Object>} Query results
 */

import fs from 'fs/promises';
import path from 'path';

export async function query(context) {
  const { endpoint, params, repo, branch } = context;

  // Route to appropriate query handler
  switch (endpoint) {
    // === Core Infrastructure Queries ===
    case '/envelopes':
      return await getEnvelopes(repo, branch, params);
    
    case '/sheet_tip':
      return await getSheetTip(repo, branch, params);
    
    // === Voting Domain Queries ===
    case '/rankings':
    case '/voting_rankings':
      return await getRankings(repo, branch, params);
    
    // === History Queries ===
    case '/candidate_history':
    case '/prompt_history':
    case '/frame_history':
      return await getHistory(repo, params.id);
    
    // === Branch Operations ===
    case '/branch_compare':
      return await compareBranches(repo, params.base, params.proposal);
    
    // === Metrics ===
    case '/metrics':
      return await getMetrics(repo, params.id);
    
    // === Domain-Specific Queries ===
    case '/eval_history':
      return await getEvalHistory(repo, branch);
    
    case '/best_branch':
      return await getBestBranch(repo, params.metric);
    
    case '/frame_list':
      return await getFrameList(repo, branch, params.step);
    
    case '/diff_sequence':
      return await diffSequence(repo, params.base, params.other);
    
    case '/render_status':
      return await getRenderStatus(repo, params.range);
    
    default:
      throw new Error(`Unknown query endpoint: ${endpoint}`);
  }
}

// ============================================================================
// CORE INFRASTRUCTURE QUERIES
// ============================================================================

/**
 * Query: /envelopes (low-level truth layer)
 * 
 * Returns parsed commit envelopes from Git history.
 * This is the raw, immutable audit trail.
 * 
 * Use this for: debugging, auditing, forensics, custom aggregations
 */
async function getEnvelopes(repo, branch, params) {
  const { from_step = 0, to_step = Infinity, domain_id = null } = params;

  try {
    // TODO: Walk Git history and parse .relay/envelope.json from each commit
    // Implementation requires Git integration (e.g., simple-git or nodegit)
    
    return {
      repo_id: repo,
      branch_id: branch || 'main',
      from_step,
      to_step,
      domain_filter: domain_id,
      envelopes: [
        // Example structure (TODO: replace with actual Git walk):
        // {
        //   envelope_version: "1.0",
        //   domain_id: "voting.channel",
        //   commit_class: "CELL_EDIT",
        //   scope: { scope_type: "branch", repo_id: "...", branch_id: "...", bundle_id: null },
        //   step: { step_policy: "DENSE_SCOPE_STEP", scope_step: 15, time_hint_utc: "..." },
        //   actor: { actor_id: "user_alice", actor_kind: "human", device_id: null },
        //   selection: { selection_id: "sel:v1/.../15", targets: [...] },
        //   change: { rows_touched: [...], cells_touched: [...], files_written: [...], ... },
        //   validation: { schema_version: "domain-registry-v1", hashes: {...} }
        // }
      ],
      count: 0,
      message: 'Envelope query requires Git integration (not yet implemented)'
    };
  } catch (error) {
    return {
      error: 'ENVELOPE_QUERY_FAILED',
      message: error.message,
      repo_id: repo,
      branch_id: branch
    };
  }
}

/**
 * Query: /sheet_tip (domain-level current state)
 * 
 * Returns the current sheet projection at branch tip.
 * This is computed by reading the latest repo state + adding derived columns.
 * 
 * Use this for: rendering current UI, inspecting latest state
 */
async function getSheetTip(repo, branch, params) {
  const { domain_id } = params;

  if (!domain_id) {
    throw new Error('domain_id parameter required for sheet_tip query');
  }

  try {
    // Load domain configuration
    const domainConfig = await loadDomainConfig(domain_id);
    if (!domainConfig) {
      throw new Error(`Domain '${domain_id}' not found`);
    }

    // Get current step
    const currentStep = await getCurrentStep(repo, branch || 'main', 'branch');

    // TODO: Read current repo state files (e.g., state/candidates/*.yaml, prompts/*.yaml)
    // TODO: Project to sheet format using domain schema
    // TODO: Add derived columns (votes_total, quality_score, etc.) from envelope aggregation

    return {
      domain_id,
      repo_id: repo,
      branch_id: branch || 'main',
      scope_step: currentStep,
      rows: [
        // TODO: Replace with actual projected rows from repo state
        // Example row structure:
        // {
        //   row_key: "prompt_12f3",
        //   candidate_name: "Bean There",  // from state file
        //   temperature: 0.4,               // from state file
        //   votes_total: 42,                // DERIVED from envelopes (read-only)
        //   rank: 1,                        // DERIVED from envelopes (read-only)
        //   status: "active",               // from state file
        //   last_change_step: 38            // DERIVED from last envelope touching this row
        // }
      ],
      schema: {
        columns: domainConfig.sheet.columns,
        views: domainConfig.sheet.views
      },
      message: 'Sheet projection requires repo state file reading (not yet implemented)'
    };
  } catch (error) {
    return {
      error: 'SHEET_QUERY_FAILED',
      message: error.message,
      domain_id,
      repo_id: repo,
      branch_id: branch
    };
  }
}

// ============================================================================
// VOTING DOMAIN QUERIES
// ============================================================================

/**
 * Query: /rankings or /voting_rankings (voting domain)
 * 
 * Returns derived vote counts and rankings.
 * Computed by replaying vote commit envelopes and applying domain rules.
 * 
 * RULES:
 * - Last vote wins (user can change their vote)
 * - Revocations honored
 * - Weighting by proximity (if applicable)
 * - votes_total is READ-ONLY derived (never written by PUT)
 */
async function getRankings(repo, branch, params) {
  const { scope = 'repo', step = 'latest', filters = {} } = params;

  try {
    // Get current step
    const currentStep = step === 'latest' 
      ? await getCurrentStep(repo, branch || 'main', 'branch')
      : parseInt(step, 10);

    // TODO: Replay vote commit envelopes and compute rankings
    // Implementation:
    // 1. Read all envelopes where domain_id === "voting.channel"
    // 2. For each CELL_EDIT on "votes_total" column: track (user_id, candidate_id, value, step)
    // 3. Apply last-vote-wins: only keep latest vote per (user_id, candidate_id)
    // 4. Aggregate: votes_total = sum of all final votes for candidate
    // 5. Apply weighting rules (proximity multipliers, etc.)
    // 6. Sort by votes_total DESC, assign rank
    // 7. Filter by status (active only, etc.)

    return {
      repo_id: repo,
      branch_id: branch || 'main',
      scope,
      scope_step: currentStep,
      query_step: step,
      candidates: [
        // TODO: Replace with actual aggregated data
        // Example structure:
        // {
        //   candidate_id: "cand_uuid_1",
        //   candidate_name: "Bean There",
        //   votes_total: 1250,           // DERIVED (read-only)
        //   rank: 1,                     // DERIVED (read-only)
        //   status: "active",
        //   reliability: 0.95,           // DERIVED from flags/sortition
        //   last_change_step: 38,
        //   location: { lat: 47.6062, lon: -122.3321 }
        // },
        // {
        //   candidate_id: "cand_uuid_2",
        //   candidate_name: "The Grind",
        //   votes_total: 890,
        //   rank: 2,
        //   status: "active",
        //   reliability: 0.92,
        //   last_change_step: 40,
        //   location: { lat: 47.6097, lon: -122.3331 }
        // }
      ],
      metrics: {
        total_votes: 0,              // TODO: Sum of all votes
        total_candidates: 0,         // TODO: Count of all candidates
        active_candidates: 0,        // TODO: Count where status === "active"
        scope_boundaries: filters.boundary || null
      },
      message: 'Vote aggregation requires envelope replay (not yet implemented)'
    };
  } catch (error) {
    return {
      error: 'RANKING_QUERY_FAILED',
      message: error.message,
      repo_id: repo,
      branch_id: branch
    };
  }
}

/**
 * Get history for an identity
 */
async function getHistory(repo, id) {
  // TODO: Walk Git commits for this identity
  // TODO: Build time box sequence
  
  return {
    identity_id: id,
    history: [
      // TODO: Replace with actual commit history
    ]
  };
}

/**
 * Compare two branches
 */
async function compareBranches(repo, base, proposal) {
  // TODO: Git diff between branches
  // TODO: Align by identity keys
  // TODO: Highlight changes
  
  return {
    base_branch: base,
    proposal_branch: proposal,
    diff: {
      // TODO: Replace with actual diff
    }
  };
}

/**
 * Get metrics for an identity
 */
async function getMetrics(repo, id) {
  // TODO: Compute reliability, support, etc.
  
  return {
    identity_id: id,
    metrics: {
      reliability: 0.95,
      support: 0.78
    }
  };
}

/**
 * Get eval history for prompt domain
 */
async function getEvalHistory(repo, branch) {
  // TODO: Read derived artifacts from history
  
  return {
    branch,
    evaluations: []
  };
}

/**
 * Get best branch by metric
 */
async function getBestBranch(repo, metric) {
  // TODO: Compare all branches by metric
  
  return {
    best_branch: 'main',
    metric_value: 92.5
  };
}

/**
 * Get frame list for storyboard domain
 */
async function getFrameList(repo, branch, step) {
  // TODO: Read frame state at step
  
  return {
    branch,
    step,
    frames: []
  };
}

/**
 * Diff sequence between branches
 */
async function diffSequence(repo, base, other) {
  // TODO: Sequence-aligned diff
  
  return {
    base,
    other,
    diff: []
  };
}

/**
 * Get render status
 */
async function getRenderStatus(repo, range) {
  // TODO: Check derived artifacts
  
  return {
    range,
    status: []
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load domain configuration from domains/ directory
 */
async function loadDomainConfig(domainId) {
  try {
    const configPath = path.join(process.cwd(), `domains/${domainId.replace('.', '_')}.domain.json`);
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load domain config for ${domainId}:`, error.message);
    return null;
  }
}

/**
 * Get current step counter for a scope
 */
async function getCurrentStep(repoId, branchId, scopeType = 'branch') {
  try {
    const counterPath = path.join(process.cwd(), '.relay/state/step-counters.json');
    const content = await fs.readFile(counterPath, 'utf-8');
    const counters = JSON.parse(content);
    
    const scopeKey = `${scopeType}:${repoId}:${branchId}:null`;
    return counters[scopeKey] ?? 0;
  } catch (error) {
    // File doesn't exist yet or other error - return 0
    return 0;
  }
}

export default query;

