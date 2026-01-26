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
import simpleGit from 'simple-git';

export async function query(context) {
  const { endpoint, params, repo, branch } = context;

  // Route to appropriate query handler
  switch (endpoint) {
    // === Core Infrastructure Queries ===
    case '/current_step':
      return await getCurrentStepQuery(repo, branch, params);
    
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
  const { from_step = 0, to_step = Infinity, domain_id = null, filter = {} } = params;

  try {
    const git = simpleGit(process.cwd());
    const branchName = branch || 'main';
    
    // Get commit log for this branch
    const log = await git.log({ from: branchName, maxCount: 1000 });
    
    const envelopes = [];
    
    // Walk commits in reverse chronological order
    for (const commit of log.all) {
      try {
        // Read .relay/envelope.json from this commit
        const envelopeContent = await git.show([`${commit.hash}:.relay/envelope.json`]);
        const envelope = JSON.parse(envelopeContent);
        
        // Filter by step range
        const step = envelope.step?.scope_step;
        if (step !== undefined && (step < from_step || step > to_step)) {
          continue;
        }
        
        // Filter by domain_id
        if (domain_id && envelope.domain_id !== domain_id) {
          continue;
        }
        
        // Filter by actor_id (if provided)
        if (filter.actor_id && envelope.actor?.actor_id !== filter.actor_id) {
          continue;
        }
        
        // Filter by domain_id in filter object (alternative syntax)
        if (filter.domain_id && envelope.domain_id !== filter.domain_id) {
          continue;
        }
        
        // Add commit hash for reference
        envelope._commit_hash = commit.hash;
        envelope._commit_date = commit.date;
        
        envelopes.push(envelope);
      } catch (error) {
        // Commit doesn't have .relay/envelope.json or is invalid - skip
        continue;
      }
    }
    
    // Sort by step (ascending)
    envelopes.sort((a, b) => (a.step?.scope_step || 0) - (b.step?.scope_step || 0));
    
    return {
      repo_id: repo,
      branch_id: branchName,
      from_step,
      to_step,
      domain_filter: domain_id,
      envelopes,
      count: envelopes.length
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
  const { scope = 'repo', step = 'latest', filters = {}, channel_id = null, candidate_id = null, include_unique_voters = false } = params;

  try {
    // Get current step
    const currentStep = step === 'latest' 
      ? await getCurrentStep(repo, branch || 'main', 'branch')
      : parseInt(step, 10);

    // 1. Get all vote envelopes for this domain
    const envelopesResult = await getEnvelopes(repo, branch, { 
      domain_id: 'voting.channel',
      to_step: currentStep
    });
    
    if (envelopesResult.error) {
      throw new Error(envelopesResult.message);
    }
    
    const envelopes = envelopesResult.envelopes;
    
    // 2. Filter for CELL_EDIT commits where colId === 'user_vote'
    const voteEvents = envelopes
      .filter(e => e.commit_class === 'CELL_EDIT')
      .filter(e => e.change?.cells_touched?.some(c => c.col_id === 'user_vote'));
    
    // 3. Build last-vote map: { user_id -> { candidate_id, step, channel_id } }
    const lastVotes = new Map();
    
    for (const event of voteEvents) {
      const actor = event.actor?.actor_id;
      const cellEdit = event.change.cells_touched.find(c => c.col_id === 'user_vote');
      const candidateVoted = cellEdit?.after;
      const eventStep = event.step?.scope_step;
      const rowKey = cellEdit?.row_key; // This is the candidate_id
      
      if (!actor || !candidateVoted || eventStep === undefined) {
        continue;
      }
      
      // Extract channel_id from files_written path (e.g., votes/channel/{channel_id}/user/{user_id}.json)
      const voteFilePath = event.change.files_written?.find(f => f.includes('/channel/'));
      let eventChannelId = null;
      if (voteFilePath) {
        const match = voteFilePath.match(/votes\/channel\/([^\/]+)\//);
        if (match) {
          eventChannelId = match[1];
        }
      }
      
      // Create unique key per user per channel (users can vote in multiple channels)
      const voteKey = `${actor}:${eventChannelId}`;
      
      // Last-vote-wins: only keep the vote with highest step
      if (!lastVotes.has(voteKey) || lastVotes.get(voteKey).step < eventStep) {
        lastVotes.set(voteKey, {
          user_id: actor,
          candidate_id: rowKey || candidateVoted,
          channel_id: eventChannelId,
          step: eventStep
        });
      }
    }
    
    // 4. Filter by channel_id if specified
    let filteredVotes = Array.from(lastVotes.values());
    if (channel_id) {
      filteredVotes = filteredVotes.filter(v => v.channel_id === channel_id);
    }
    
    // 5. Aggregate: count votes per candidate
    const voteTotals = new Map();
    const uniqueVoters = new Set();
    
    for (const vote of filteredVotes) {
      const count = voteTotals.get(vote.candidate_id) || 0;
      voteTotals.set(vote.candidate_id, count + 1);
      uniqueVoters.add(vote.user_id);
    }
    
    // 6. Sort by votes_total DESC, assign rank
    const candidates = Array.from(voteTotals.entries())
      .map(([candidate_id, votes_total]) => ({
        candidate_id,
        votes_total,
        rank: 0 // Will be assigned after sorting
      }))
      .sort((a, b) => b.votes_total - a.votes_total)
      .map((c, i) => ({ ...c, rank: i + 1 }));
    
    // 7. Filter by candidate_id if specified (single candidate query)
    if (candidate_id) {
      const candidate = candidates.find(c => c.candidate_id === candidate_id);
      return {
        repo_id: repo,
        branch_id: branch || 'main',
        scope,
        scope_step: currentStep,
        query_step: step,
        channel_id,
        candidate_id,
        votes_total: candidate?.votes_total || 0,
        rank: candidate?.rank || null
      };
    }
    
    // Return full rankings
    return {
      repo_id: repo,
      branch_id: branch || 'main',
      scope,
      scope_step: currentStep,
      query_step: step,
      channel_id,
      candidates,
      metrics: {
        total_votes: filteredVotes.length,
        total_candidates: candidates.length,
        active_candidates: candidates.length, // TODO: Filter by status when available
        unique_voters: include_unique_voters ? uniqueVoters.size : undefined,
        scope_boundaries: filters.boundary || null
      }
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
// CORE INFRASTRUCTURE QUERY HANDLERS
// ============================================================================

/**
 * Query: /current_step
 * 
 * Returns the current step counter for a scope.
 * Used by write operations to get the next step before committing.
 * 
 * CRITICAL: Step counters are keyed by scope tuple (scope_type:repo_id:branch_id:bundle_id)
 */
async function getCurrentStepQuery(repo, branch, params) {
  const { scope_type = 'branch' } = params;
  
  try {
    const currentStep = await getCurrentStep(repo, branch || 'main', scope_type);
    const scopeKey = `${scope_type}:${repo}:${branch || 'main'}:null`;
    
    return {
      success: true,
      repo_id: repo,
      branch_id: branch || 'main',
      scope_type,
      scope_key: scopeKey,
      current_step: currentStep,
      next_step: currentStep + 1
    };
  } catch (error) {
    return {
      success: false,
      error: 'CURRENT_STEP_QUERY_FAILED',
      message: error.message,
      repo_id: repo,
      branch_id: branch,
      scope_type
    };
  }
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

/**
 * Increment step counter for a scope (MUST be called after commit succeeds)
 * 
 * CRITICAL: This must be called by the Relay server after a commit is accepted.
 * If not called, monotonicity enforcement will reject the next commit.
 * 
 * @param {string} repoId - Repository ID
 * @param {string} branchId - Branch ID
 * @param {string} scopeType - Scope type ('repo', 'branch', or 'bundle')
 * @param {number} newStep - The step that was just committed
 * @returns {Promise<void>}
 */
export async function incrementStepCounter(repoId, branchId, scopeType, newStep) {
  try {
    const counterPath = path.join(process.cwd(), '.relay/state/step-counters.json');
    const scopeKey = `${scopeType}:${repoId}:${branchId}:null`;
    
    // Read current counters
    let counters = {};
    try {
      const content = await fs.readFile(counterPath, 'utf-8');
      counters = JSON.parse(content);
    } catch (error) {
      // File doesn't exist yet - initialize empty
    }
    
    // Update counter
    counters[scopeKey] = newStep;
    
    // Write back
    await fs.writeFile(counterPath, JSON.stringify(counters, null, 2), 'utf-8');
    
    console.log(`✅ Step counter incremented: ${scopeKey} → ${newStep}`);
  } catch (error) {
    console.error(`❌ Failed to increment step counter:`, error);
    throw error;
  }
}

export default query;

