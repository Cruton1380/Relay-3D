/**
 * COORDINATION GRAPH MODEL
 * 
 * Core data structures for coordination physics.
 * 
 * CRITICAL: This is the source of truth for all graph visualization.
 * UI is driven by this model, not hand-authored layouts.
 */

/**
 * Filament
 * 
 * A first-class persistent identity with append-only commit history.
 * 
 * Examples:
 * - conversation.main
 * - work.agent-1.task-A
 * - file.api.js
 * - queue.api.js
 * - conflict.api.js.proposal-A.proposal-B
 * - resource.gpu-1
 * - authority.org.ACME
 */
export class Filament {
  constructor(filamentId, kind, commits = []) {
    this.filamentId = filamentId; // Unique ID
    this.kind = kind; // conversation | work | file | queue | conflict | resource | authority
    this.commits = commits; // Array of Commit objects
    this.headIndex = commits.length > 0 ? commits[commits.length - 1].commitIndex : -1;
  }
  
  /**
   * Get filament kind from ID (parsing convention)
   */
  static getKind(filamentId) {
    const prefix = filamentId.split('.')[0];
    const kinds = ['conversation', 'convo', 'work', 'file', 'queue', 'conflict', 'resource', 'authority'];
    return kinds.find(k => prefix.startsWith(k) || filamentId.startsWith(k)) || 'unknown';
  }
  
  /**
   * Get color by kind (for visualization)
   */
  static getColor(kind) {
    const colors = {
      conversation: '#4A90E2', // Blue
      convo: '#4A90E2',
      work: '#F5A623',         // Orange
      file: '#7ED321',         // Green
      queue: '#BD10E0',        // Purple
      conflict: '#D0021B',     // Red
      resource: '#50E3C2',     // Cyan
      authority: '#F8E71C',    // Yellow
      unknown: '#9B9B9B',      // Gray
    };
    return colors[kind] || colors.unknown;
  }
}

/**
 * Commit
 * 
 * An irreversible event (interaction vertex in spacetime diagram).
 * 
 * Properties:
 * - commitIndex: Position in filament history
 * - op: Operation type (USER_MSG, DELEGATE_AUTHORITY, QUEUE_REORDER, etc.)
 * - payload: Operation-specific data
 * - refs: Causal edges (inputs, evidence, delegation paths)
 * - tLevel: Visibility stratum (T0=invisible, T1=user, T2=audit, T3=forensic)
 * - authorityRef: Delegation chain proof (for truth-changing ops)
 */
export class Commit {
  constructor(data) {
    this.filamentId = data.filamentId;
    this.commitIndex = data.commitIndex;
    this.ts = data.ts || Date.now();
    this.actor = data.actor; // { kind, id }
    this.op = data.op; // Operation type
    this.locus = data.locus; // Spatial anchor (optional)
    this.refs = data.refs || { inputs: [], evidence: [] }; // Causal edges
    this.authorityRef = data.authorityRef || null; // Delegation chain
    this.payload = data.payload || {};
    this.tLevel = data.tLevel || this.inferTLevel(data.op); // T0-T3 stratum
  }
  
  /**
   * Infer T-level from operation type
   */
  inferTLevel(op) {
    const t0Ops = ['TOPOLOGY_UPDATE', 'PHYSICS_STEP'];
    const t3Ops = ['DELEGATE_AUTHORITY', 'REVOKE_AUTHORITY'];
    const t2Ops = ['GRANT', 'RELEASE', 'TIMEOUT', 'CONFLICT_DETECTED'];
    
    if (t0Ops.includes(op)) return 'T0';
    if (t3Ops.includes(op)) return 'T3';
    if (t2Ops.includes(op)) return 'T2';
    return 'T1'; // Default: user-facing
  }
  
  /**
   * Get all ref edges from this commit
   */
  getRefEdges() {
    const edges = [];
    
    // Input edges
    if (this.refs.inputs) {
      this.refs.inputs.forEach(input => {
        edges.push(new RefEdge(
          { filamentId: input.filamentId, commitIndex: input.commitIndex },
          { filamentId: this.filamentId, commitIndex: this.commitIndex },
          'input'
        ));
      });
    }
    
    // Evidence edges
    if (this.refs.evidence) {
      this.refs.evidence.forEach(evidence => {
        if (evidence.filamentId) {
          edges.push(new RefEdge(
            { filamentId: evidence.filamentId, commitIndex: evidence.commitIndex || 0 },
            { filamentId: this.filamentId, commitIndex: this.commitIndex },
            'evidence'
          ));
        }
      });
    }
    
    // Delegation path edges (authority)
    if (this.authorityRef && this.authorityRef.proof && this.authorityRef.proof.delegationPath) {
      this.authorityRef.proof.delegationPath.forEach(delegation => {
        edges.push(new RefEdge(
          { filamentId: delegation.filamentId, commitIndex: delegation.commitIndex },
          { filamentId: this.filamentId, commitIndex: this.commitIndex },
          'delegation'
        ));
      });
    }
    
    return edges;
  }
}

/**
 * RefEdge
 * 
 * A causal edge between commits (worldline connection in spacetime diagram).
 * 
 * Types:
 * - input: Causal dependency (refs.inputs)
 * - evidence: Proof reference (refs.evidence)
 * - delegation: Authority chain (authorityRef.proof.delegationPath)
 * - merge: Proposal absorption (MERGE_SCAR)
 */
export class RefEdge {
  constructor(from, to, type) {
    this.from = from; // { filamentId, commitIndex }
    this.to = to;     // { filamentId, commitIndex }
    this.type = type; // input | evidence | delegation | merge
  }
  
  /**
   * Get edge color by type
   */
  getColor() {
    const colors = {
      input: '#4A90E2',    // Blue (causal)
      evidence: '#7ED321', // Green (proof)
      delegation: '#F8E71C', // Yellow (authority)
      merge: '#BD10E0',    // Purple (absorption)
    };
    return colors[this.type] || '#9B9B9B';
  }
  
  /**
   * Get edge ID (for deduplication)
   */
  getId() {
    return `${this.from.filamentId}:${this.from.commitIndex}->${this.to.filamentId}:${this.to.commitIndex}:${this.type}`;
  }
}

/**
 * CoordinationGraph
 * 
 * The complete graph of filaments and their causal relationships.
 * 
 * This is the coordination physics spacetime diagram.
 */
export class CoordinationGraph {
  constructor() {
    this.filaments = new Map(); // filamentId -> Filament
    this.commits = new Map();   // `${filamentId}:${commitIndex}` -> Commit
    this.edges = new Map();     // edgeId -> RefEdge
  }
  
  /**
   * Add filament to graph
   */
  addFilament(filament) {
    this.filaments.set(filament.filamentId, filament);
    
    // Add all commits
    filament.commits.forEach(commit => {
      this.addCommit(commit);
    });
  }
  
  /**
   * Add commit to graph
   */
  addCommit(commit) {
    const key = `${commit.filamentId}:${commit.commitIndex}`;
    this.commits.set(key, commit);
    
    // Extract and add edges
    const edges = commit.getRefEdges();
    edges.forEach(edge => {
      this.edges.set(edge.getId(), edge);
    });
  }
  
  /**
   * Get filament by ID
   */
  getFilament(filamentId) {
    return this.filaments.get(filamentId);
  }
  
  /**
   * Get commit by filamentId and commitIndex
   */
  getCommit(filamentId, commitIndex) {
    return this.commits.get(`${filamentId}:${commitIndex}`);
  }
  
  /**
   * Get all edges
   */
  getAllEdges() {
    return Array.from(this.edges.values());
  }
  
  /**
   * Get edges connected to a filament
   */
  getFilamentEdges(filamentId) {
    return Array.from(this.edges.values()).filter(edge =>
      edge.from.filamentId === filamentId || edge.to.filamentId === filamentId
    );
  }
  
  /**
   * Filter commits by T-level (zoom)
   */
  getCommitsByTLevel(tLevel) {
    return Array.from(this.commits.values()).filter(c => c.tLevel === tLevel);
  }
  
  /**
   * Get graph statistics
   */
  getStats() {
    return {
      filamentCount: this.filaments.size,
      commitCount: this.commits.size,
      edgeCount: this.edges.size,
      filamentsByKind: this.getFilamentsByKind(),
    };
  }
  
  /**
   * Get filaments grouped by kind
   */
  getFilamentsByKind() {
    const byKind = {};
    this.filaments.forEach(filament => {
      byKind[filament.kind] = (byKind[filament.kind] || 0) + 1;
    });
    return byKind;
  }
}
