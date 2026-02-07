/**
 * GRAPH BUILDER
 * 
 * Constructs CoordinationGraph from existing filament data.
 * 
 * CRITICAL: This is the single source of truth for graph construction.
 * All graph views (3D, 2D, list) derive from this.
 */

import { CoordinationGraph, Filament, Commit } from './coordinationGraphModel.js';

/**
 * Build coordination graph from filament data
 * 
 * @param filamentsData Array of filament objects (from schemas)
 * @returns CoordinationGraph
 */
export function buildCoordinationGraph(filamentsData) {
  const graph = new CoordinationGraph();
  
  filamentsData.forEach(filamentData => {
    const filament = new Filament(
      filamentData.filamentId,
      Filament.getKind(filamentData.filamentId),
      filamentData.commits.map(commitData => new Commit(commitData))
    );
    
    graph.addFilament(filament);
  });
  
  return graph;
}

/**
 * Create mock coordination graph for testing/demo
 * 
 * This demonstrates the full range of filament types and relationships.
 */
export function createMockCoordinationGraph() {
  const filamentsData = [
    // Conversation filament
    {
      filamentId: 'convo.main',
      commits: [
        {
          filamentId: 'convo.main',
          commitIndex: 0,
          ts: Date.now() - 60000,
          actor: { kind: 'user', id: 'user-1' },
          op: 'USER_MSG',
          locus: null,
          refs: { inputs: [], evidence: [] },
          payload: { content: 'Implement authentication system' },
        },
        {
          filamentId: 'convo.main',
          commitIndex: 1,
          ts: Date.now() - 50000,
          actor: { kind: 'agent', id: 'agent-1' },
          op: 'AGENT_MSG',
          locus: null,
          refs: {
            inputs: [],
            evidence: [],
            relatedWorkSessions: ['work.agent-1.task-A'],
          },
          payload: { content: 'Starting work on task' },
        },
      ],
    },
    
    // Work session filament
    {
      filamentId: 'work.agent-1.task-A',
      commits: [
        {
          filamentId: 'work.agent-1.task-A',
          commitIndex: 0,
          ts: Date.now() - 45000,
          actor: { kind: 'agent', id: 'agent-1' },
          op: 'TASK_ACCEPTED',
          locus: null,
          refs: {
            inputs: [{ filamentId: 'convo.main', commitIndex: 1 }],
            evidence: [],
          },
          payload: { taskDescription: 'Implement auth' },
        },
        {
          filamentId: 'work.agent-1.task-A',
          commitIndex: 1,
          ts: Date.now() - 40000,
          actor: { kind: 'agent', id: 'agent-1' },
          op: 'READ_REF',
          locus: null,
          refs: {
            inputs: [],
            evidence: [],
            targetFilaments: [{ filamentId: 'file.auth.js', commitIndex: 0 }],
          },
          payload: {
            targetFileId: 'auth.js',
            targetCommitHash: 'hash-abc123',
          },
        },
      ],
    },
    
    // File filament
    {
      filamentId: 'file.auth.js',
      commits: [
        {
          filamentId: 'file.auth.js',
          commitIndex: 0,
          ts: Date.now() - 80000,
          actor: { kind: 'user', id: 'user-1' },
          op: 'FILE_CREATED',
          locus: null,
          refs: { inputs: [], evidence: [] },
          payload: { filename: 'auth.js' },
        },
      ],
    },
    
    // Queue filament
    {
      filamentId: 'queue.auth.js',
      commits: [
        {
          filamentId: 'queue.auth.js',
          commitIndex: 0,
          ts: Date.now() - 30000,
          actor: { kind: 'agent', id: 'agent-1' },
          op: 'QUEUE_ENQUEUE',
          locus: null,
          refs: {
            inputs: [{ filamentId: 'file.auth.js@proposal/task-A', commitIndex: 0 }],
            evidence: [],
          },
          payload: {
            proposalBranchId: 'file.auth.js@proposal/task-A',
            baseCommitHash: 'hash-abc123',
            touchedLoci: ['line-10', 'line-20'],
          },
        },
      ],
    },
    
    // Authority filament
    {
      filamentId: 'authority.org.ACME',
      commits: [
        {
          filamentId: 'authority.org.ACME',
          commitIndex: 0,
          ts: Date.now() - 90000,
          actor: { kind: 'system', id: 'authority-manager' },
          op: 'AUTHORITY_SCOPE_DEFINED',
          locus: null,
          refs: { inputs: [], evidence: [] },
          payload: {
            scopeId: 'org.ACME',
            scopeType: 'org',
            description: 'Organization authority',
          },
        },
        {
          filamentId: 'authority.org.ACME',
          commitIndex: 1,
          ts: Date.now() - 85000,
          actor: { kind: 'system', id: 'authority-manager' },
          op: 'DELEGATE_AUTHORITY',
          locus: null,
          refs: { inputs: [], evidence: [] },
          payload: {
            delegationId: 'org.ACME:1',
            grantor: { kind: 'user', id: 'ceo' },
            grantee: { kind: 'user', id: 'project-lead' },
            capabilities: ['AUTHORIZE_MERGE', 'REORDER_QUEUE'],
          },
        },
      ],
    },
    
    // Resource filament
    {
      filamentId: 'resource.gpu-1',
      commits: [
        {
          filamentId: 'resource.gpu-1',
          commitIndex: 0,
          ts: Date.now() - 70000,
          actor: { kind: 'system', id: 'resource-manager' },
          op: 'RESOURCE_CREATED',
          locus: null,
          refs: { inputs: [], evidence: [] },
          payload: {
            resourceId: 'gpu-1',
            capacity: 1,
          },
        },
        {
          filamentId: 'resource.gpu-1',
          commitIndex: 1,
          ts: Date.now() - 60000,
          actor: { kind: 'agent', id: 'agent-1' },
          op: 'REQUEST',
          locus: null,
          refs: {
            inputs: [{ filamentId: 'work.agent-1.task-A', commitIndex: 0 }],
            evidence: [],
          },
          payload: {
            agentId: 'agent-1',
            taskId: 'task-A',
            priority: 8,
          },
        },
        {
          filamentId: 'resource.gpu-1',
          commitIndex: 2,
          ts: Date.now() - 55000,
          actor: { kind: 'system', id: 'resource-manager' },
          op: 'GRANT',
          locus: null,
          refs: {
            inputs: [{ filamentId: 'resource.gpu-1', commitIndex: 1 }],
            evidence: [],
          },
          authorityRef: {
            scopeId: 'authority.resource.gpu-1',
            capability: 'GRANT_RESOURCE',
            proof: {
              delegationPath: [
                { filamentId: 'authority.org.ACME', commitIndex: 1 }
              ],
              pathHash: 'hash-delegation-abc',
              satisfiedConstraints: {},
            },
          },
          payload: {
            agentId: 'agent-1',
            taskId: 'task-A',
            policyRef: {
              policyId: 'priority',
              reason: 'Highest priority',
            },
            policyProof: {
              candidateSetHash: 'hash-candidates-abc',
              winnerRequestId: 'agent-1:task-A',
            },
          },
        },
      ],
    },
  ];
  
  return buildCoordinationGraph(filamentsData);
}

/**
 * Export graph to JSON (for persistence/debugging)
 */
export function exportGraph(graph) {
  return {
    filaments: Array.from(graph.filaments.values()).map(f => ({
      filamentId: f.filamentId,
      kind: f.kind,
      commitCount: f.commits.length,
    })),
    commits: Array.from(graph.commits.values()).map(c => ({
      filamentId: c.filamentId,
      commitIndex: c.commitIndex,
      op: c.op,
      tLevel: c.tLevel,
      hasAuthority: !!c.authorityRef,
    })),
    edges: Array.from(graph.edges.values()).map(e => ({
      from: `${e.from.filamentId}:${e.from.commitIndex}`,
      to: `${e.to.filamentId}:${e.to.commitIndex}`,
      type: e.type,
    })),
    stats: graph.getStats(),
  };
}
