# RELAY BACKEND SCHEMATIC V1

**Status**: DRAFT for CANON approval  
**Date**: 2026-01-31  
**Purpose**: Complete backend substrate architecture for Relay continuous verification system

---

## 1. CANONICAL STATEMENT + LOCKS

### Canonical Statement (IMMUTABLE)

> "Relay is continuous verification: a non-destructive, consensual audit that helps everyone become a coherence operator, making coordination state visible and recoverable without weaponizing transparency or creating fragility."

### Architecture Locks (7)

**c14: Surface Coordination Geometry**
- Core = canonical reconciliation filament
- Rings = basins of attraction (company→dept→project)
- Filaments = Git-time-space continuums (append-only)
- ERI = distance from core (0-100)
- Nothing orbits. Everything flows.

**c15: Pressure Management & Resilience**
- Detection → Degradation (NORMAL→DEGRADED→INDETERMINATE→REFUSAL)
- Ring-level isolation (failures don't cascade)
- CERN principle (visible capability, non-aggressive posture)
- Threat model: human adversaries only

**c16: Commit Materiality & Context Evidence**
- Five states: DRAFT → HOLD → PROPOSE → COMMIT → REVERT
- Materiality thresholds: time, actions, risk, visibility, dependencies
- Context snapshots: what/where/relations/when/who
- Drafts undo silently, commits revert visibly

**c17: Work Zones & SCV Co-Location**
- Three layers: Live dialogue (ephemeral), Shared context (semi-persistent), Commits (canonical)
- Zone schema: `zone.<company>.<dept>.<project>`
- Only commits are truth. No commit = nothing happened.

**Cognitive Recovery Paths**
- "A filament is a cognitive recovery path"
- Navigation cheaper than recall
- 10 UI features: breadcrumbs, "Where Was I?", activity trail, context-aware back

**Live Presence & Time Boxes**
- Time boxes contain ephemeral state (video, audio, cursor, edits)
- Commits at material boundaries only
- 2-hour session = ~5-12 commits (not 108,000)

**CleverTree 3D Integration**
- votingIntegration, eriCalculator, threeWayMatchEngine, contextSnapshotManager
- Three-way match (intent+reality+projection)
- Foundation complete, awaiting substrate wiring

---

## 2. GLOSSARY

### Core Concepts

**Timebox**: Bounded interval of continuous state with discrete boundary commits. Contains ephemeral activity (video, audio, edits). History advances only at material boundaries.

**Filament**: Append-only chain of timeboxes. Git-time-space continuum. Persistent identity through time. Cognitive recovery path.

**Anchor**: Capability node embedded in filament flow. Types: Service, Decision, Resource, Authority, Transform. Does not orbit. Embedded in flow.

**Lens**: Read-only view over canonical substrate. Never invents truth. Examples: 2D spreadsheet, 3D globe, battlecruiser interface.

**Scar**: Permanent evidence of reconciliation/merge. Directional arrow showing convergence. Not erasable.

**ERI (Exposure Readiness Index)**: Distance from canonical core (0-100). Calculated as divergence depth + conflict count + time elapsed - attestation count.

**Three-Way Match**: Verification of intent, reality, and projection. Overall confidence = min(intent_conf, reality_conf, projection_conf).

**Material Boundary**: Threshold where ephemeral state becomes canonical commit. Defined by: time held, actions taken, risk level, visibility scope, dependency count.

**Ring**: Basin of attraction around reconciliation core. Company → Department → Project hierarchy. Not org chart. Gravitational model.

**Work Zone**: Co-located coordination space. `zone.<company>.<dept>.<project>`. Three layers: dialogue (ephemeral), context (semi-persistent), commits (canonical).

**TransformAnchor**: Derived transformation node. Example: Excel formula `=SUM(A1:A4)`. Has edges: inputs → transform → output. Replayable and versioned.

---

## 3. APPEND-ONLY EVENT SUBSTRATE

### Event Envelope Schema

All coordination events use this canonical envelope:

```javascript
{
  // Identity
  "eventId": "evt_2026-01-31T12:34:56.789Z_abc123",
  "eventType": "COMMIT" | "DRAFT" | "HOLD" | "PROPOSE" | "REVERT",
  "version": "1.0.0",
  
  // Time & Space
  "timestamp": "2026-01-31T12:34:56.789Z",
  "timeboxId": "tbox_abc123",
  "filamentId": "fil_voting_region_CA",
  "ringId": "ring.company.acme.dept.ops",
  "zoneId": "zone.acme.ops.payments",
  
  // Authority & Evidence
  "authorityRef": {
    "userId": "user_12345",
    "delegationChain": ["authority_root", "authority_dept_ops"],
    "scope": ["write:votes", "read:results"]
  },
  "evidenceRef": {
    "snapshotId": "snap_abc123",
    "contextHash": "sha256:...",
    "priorEventId": "evt_...",
    "evidenceType": "CONTEXT_SNAPSHOT" | "THREE_WAY_MATCH" | "ERI_CALCULATION"
  },
  
  // Payload
  "payload": {
    // Event-type specific data
  },
  
  // Verification
  "eri": 45.2,
  "threeWayMatch": {
    "intentConfidence": 0.9,
    "realityConfidence": 0.8,
    "projectionConfidence": 0.6,
    "overallConfidence": 0.6  // min of three
  },
  
  // Immutability
  "signature": "sha256:...",
  "previousEventHash": "sha256:...",
  "parentEventIds": ["evt_...", "evt_..."]  // for merges/forks
}
```

### Event Types

**DRAFT**: Non-canonical, reversible, private. Below materiality threshold.

**HOLD**: Staged, frozen for review. Captures context snapshot. Reversible.

**PROPOSE**: Submitted for reconciliation. Enters pressure budget. Reversible with new event.

**COMMIT**: Canonical, append-only, public (within ring/zone). Irreversible except via REVERT.

**REVERT**: New commit pointing to prior commit, marking it reverted. Does not delete history.

### Storage Schema

```javascript
// Primary event log (append-only)
events/
  {year}/
    {month}/
      {day}/
        {eventId}.json

// Indexes (derived, rebuildable)
indexes/
  by-filament/
    {filamentId}/
      events.jsonl
  by-timebox/
    {timeboxId}/
      events.jsonl
  by-zone/
    {zoneId}/
      events.jsonl
  by-user/
    {userId}/
      events.jsonl
```

---

## 4. TIMEBOX STATE MACHINE

### State Diagram

```
           ┌─────────┐
           │  START  │
           └────┬────┘
                │
                ▼
           ┌─────────┐
      ┌────│  DRAFT  │◄──┐ (undo allowed)
      │    └────┬────┘   │
      │         │         │
      │         ▼         │
      │    ┌─────────┐   │
      │    │  HOLD   │───┘ (cancel → DRAFT)
      │    └────┬────┘
      │         │
      │         ▼
      │    ┌─────────┐
      │    │ PROPOSE │───┐ (reject → HOLD)
      │    └────┬────┘   │
      │         │         │
      │         ▼         │
      │    ┌─────────┐   │
      └───►│ COMMIT  │◄──┘ (accept)
           └────┬────┘
                │
                ▼
           ┌─────────┐
           │ REVERT  │ (new commit, points to old)
           └─────────┘
```

### State Transitions

```javascript
class TimeboxStateMachine {
  constructor(timeboxId, filamentId, ringId) {
    this.timeboxId = timeboxId;
    this.filamentId = filamentId;
    this.ringId = ringId;
    this.state = 'DRAFT';
    this.events = [];
    this.materialityThreshold = this.calculateThreshold();
  }
  
  // Materiality calculation
  calculateThreshold() {
    const thresholds = [
      { type: 'TIME', value: 30000 },        // 30 seconds
      { type: 'ACTIONS', value: 5 },         // 5 distinct actions
      { type: 'RISK', value: 'HIGH' },       // immediate on high-risk
      { type: 'VISIBILITY', value: 'PUBLIC' },  // immediate on public
      { type: 'DEPENDENCIES', value: 3 }     // 3 dependent refs
    ];
    
    // Shortest threshold wins
    return thresholds.reduce((min, curr) => {
      return this.evaluateThreshold(curr) < this.evaluateThreshold(min) 
        ? curr 
        : min;
    });
  }
  
  // State transitions
  async hold() {
    if (this.state !== 'DRAFT') throw new Error('Can only HOLD from DRAFT');
    
    const snapshot = await this.captureContextSnapshot();
    const event = this.createEvent('HOLD', { snapshot });
    
    this.state = 'HOLD';
    this.events.push(event);
    
    return event;
  }
  
  async propose() {
    if (this.state !== 'HOLD') throw new Error('Can only PROPOSE from HOLD');
    
    const threeWayMatch = await this.performThreeWayMatch();
    const eri = await this.calculateERI();
    
    if (threeWayMatch.overallConfidence < 0.5) {
      throw new Error('Confidence too low for proposal');
    }
    
    const event = this.createEvent('PROPOSE', { 
      threeWayMatch, 
      eri 
    });
    
    this.state = 'PROPOSE';
    this.events.push(event);
    
    return event;
  }
  
  async commit(authorityRef) {
    if (this.state !== 'PROPOSE') throw new Error('Can only COMMIT from PROPOSE');
    
    // Check authority
    if (!await this.verifyAuthority(authorityRef)) {
      throw new Error('Insufficient authority');
    }
    
    // Check pressure budget
    if (!await this.checkPressureBudget()) {
      throw new Error('Pressure budget exceeded');
    }
    
    const event = this.createEvent('COMMIT', { 
      authorityRef,
      finalERI: await this.calculateERI(),
      signature: await this.sign()
    });
    
    this.state = 'COMMIT';
    this.events.push(event);
    
    // Append to canonical log
    await this.appendToEventLog(event);
    
    return event;
  }
  
  async revert(reason, authorityRef) {
    if (this.state !== 'COMMIT') throw new Error('Can only REVERT a COMMIT');
    
    const revertEvent = this.createEvent('REVERT', {
      targetEventId: this.events[this.events.length - 1].eventId,
      reason,
      authorityRef
    });
    
    this.state = 'REVERT';
    this.events.push(revertEvent);
    
    await this.appendToEventLog(revertEvent);
    
    return revertEvent;
  }
  
  // Undo (only for DRAFT state)
  undo() {
    if (this.state !== 'DRAFT') {
      throw new Error('Undo only allowed in DRAFT state. Use REVERT for committed changes.');
    }
    
    // Silent undo - no event created
    this.events.pop();
  }
}
```

---

## 5. FILAMENT IDENTITY + FORK HANDLING

### Filament Schema

```javascript
{
  "filamentId": "fil_voting_region_CA",
  "filamentType": "VOTING" | "WORK" | "TRANSFORM" | "PROXIMITY",
  "ringId": "ring.company.acme.dept.ops",
  "createdAt": "2026-01-15T10:00:00Z",
  "createdBy": "user_12345",
  
  // Identity persistence
  "parentFilamentId": null,  // null if root
  "forkedFrom": {
    "filamentId": "fil_voting_region_US",
    "forkPointEventId": "evt_...",
    "forkReason": "Regional branch for CA-specific rules"
  },
  
  // Current state
  "headEventId": "evt_latest",
  "timeboxCount": 142,
  "lastActivityAt": "2026-01-31T12:00:00Z",
  
  // Reconciliation
  "reconcilesTo": "fil_voting_core",
  "lastReconciliationAt": "2026-01-30T10:00:00Z",
  "eriCurrent": 23.4,
  
  // Metadata
  "anchors": ["anchor_vote_service", "anchor_result_aggregator"],
  "tags": ["production", "west-region"],
  "visibility": "RING" | "ZONE" | "PUBLIC"
}
```

### Fork Handling

```javascript
class FilamentManager {
  async fork(sourceFilamentId, forkReason, authorityRef) {
    const source = await this.getFilament(sourceFilamentId);
    const forkPoint = await this.getHeadEvent(sourceFilamentId);
    
    const newFilament = {
      filamentId: `fil_${generateId()}`,
      filamentType: source.filamentType,
      ringId: source.ringId,
      createdAt: new Date().toISOString(),
      createdBy: authorityRef.userId,
      parentFilamentId: sourceFilamentId,
      forkedFrom: {
        filamentId: sourceFilamentId,
        forkPointEventId: forkPoint.eventId,
        forkReason
      },
      headEventId: forkPoint.eventId,  // starts from fork point
      timeboxCount: 0,
      lastActivityAt: new Date().toISOString(),
      reconcilesTo: sourceFilamentId,  // forks reconcile to parent
      eriCurrent: 0,  // starts at zero distance
      anchors: [],
      tags: [...source.tags, 'forked'],
      visibility: source.visibility
    };
    
    // Create fork event
    const forkEvent = {
      eventType: 'FORK',
      eventId: `evt_${generateId()}`,
      timestamp: new Date().toISOString(),
      filamentId: newFilament.filamentId,
      authorityRef,
      payload: {
        sourceFilamentId,
        forkPointEventId: forkPoint.eventId,
        reason: forkReason
      }
    };
    
    await this.appendToEventLog(forkEvent);
    await this.storeFilament(newFilament);
    
    return newFilament;
  }
  
  async merge(sourceFilamentId, targetFilamentId, authorityRef) {
    // Three-way merge: common ancestor, source head, target head
    const commonAncestor = await this.findCommonAncestor(
      sourceFilamentId, 
      targetFilamentId
    );
    const sourceHead = await this.getHeadEvent(sourceFilamentId);
    const targetHead = await this.getHeadEvent(targetFilamentId);
    
    // Calculate divergence
    const sourceEvents = await this.getEventsSince(
      sourceFilamentId, 
      commonAncestor.eventId
    );
    const targetEvents = await this.getEventsSince(
      targetFilamentId, 
      commonAncestor.eventId
    );
    
    // Detect conflicts
    const conflicts = await this.detectConflicts(
      commonAncestor,
      sourceEvents,
      targetEvents
    );
    
    if (conflicts.length > 0) {
      // Stage merge with conflicts for manual resolution
      return {
        status: 'CONFLICTS',
        conflicts,
        mergeProposal: this.createMergeProposal(
          sourceFilamentId,
          targetFilamentId,
          conflicts
        )
      };
    }
    
    // No conflicts - create merge commit (scar)
    const mergeEvent = {
      eventType: 'MERGE',
      eventId: `evt_${generateId()}`,
      timestamp: new Date().toISOString(),
      filamentId: targetFilamentId,
      authorityRef,
      parentEventIds: [sourceHead.eventId, targetHead.eventId],
      payload: {
        sourceFilamentId,
        targetFilamentId,
        commonAncestorId: commonAncestor.eventId,
        eventsApplied: sourceEvents.map(e => e.eventId)
      },
      evidenceRef: {
        snapshotId: await this.capturePreMergeSnapshot(targetFilamentId),
        contextHash: await this.hashContext(),
        evidenceType: 'MERGE_SCAR'
      }
    };
    
    await this.appendToEventLog(mergeEvent);
    
    // Update target filament
    await this.updateFilament(targetFilamentId, {
      headEventId: mergeEvent.eventId,
      lastActivityAt: new Date().toISOString()
    });
    
    return {
      status: 'SUCCESS',
      mergeEventId: mergeEvent.eventId,
      scar: mergeEvent
    };
  }
}
```

---

## 6. THREE-WAY MATCH ENGINE

### Contract

```javascript
class ThreeWayMatchEngine {
  /**
   * Verifies intent, reality, and projection alignment
   * @returns {object} { intentConfidence, realityConfidence, projectionConfidence, overallConfidence }
   */
  async verify(components) {
    const intentConf = await this.verifyIntent(components.intent);
    const realityConf = await this.verifyReality(components.reality);
    const projectionConf = await this.verifyProjection(components.projection);
    
    // Overall confidence = minimum of three legs
    const overallConf = Math.min(intentConf, realityConf, projectionConf);
    
    return {
      intentConfidence: intentConf,
      realityConfidence: realityConf,
      projectionConfidence: projectionConf,
      overallConfidence: overallConf,
      timestamp: new Date().toISOString(),
      weakestLeg: this.identifyWeakestLeg(intentConf, realityConf, projectionConf)
    };
  }
  
  async verifyIntent(intent) {
    // Intent = what user claimed to do
    // Verify: authority scope matches action
    //         user declaration matches payload
    //         no contradictory prior intents
    
    const authorityMatch = await this.checkAuthorityAlignment(intent);
    const declarationMatch = await this.checkDeclarationConsistency(intent);
    const historyMatch = await this.checkHistoricalConsistency(intent);
    
    // Average with penalty for any failure
    const scores = [authorityMatch, declarationMatch, historyMatch];
    const hasFailure = scores.some(s => s < 0.5);
    
    return hasFailure 
      ? Math.min(...scores)  // weakest link if any failure
      : scores.reduce((a, b) => a + b) / scores.length;  // average if all pass
  }
  
  async verifyReality(reality) {
    // Reality = what actually happened in system
    // Verify: event log consistency
    //         state transitions valid
    //         no orphaned references
    
    const eventConsistency = await this.checkEventLogConsistency(reality);
    const stateValidity = await this.checkStateTransitions(reality);
    const referenceIntegrity = await this.checkReferenceIntegrity(reality);
    
    const scores = [eventConsistency, stateValidity, referenceIntegrity];
    const hasFailure = scores.some(s => s < 0.5);
    
    return hasFailure
      ? Math.min(...scores)
      : scores.reduce((a, b) => a + b) / scores.length;
  }
  
  async verifyProjection(projection) {
    // Projection = what we expect to happen next
    // Verify: causal model predicts downstream impact
    //         no circular dependencies
    //         bounded propagation (won't cascade indefinitely)
    
    const causalValidity = await this.checkCausalModel(projection);
    const dependencyAcyclic = await this.checkDependencyGraph(projection);
    const propagationBounded = await this.checkPropagationBounds(projection);
    
    const scores = [causalValidity, dependencyAcyclic, propagationBounded];
    const hasFailure = scores.some(s => s < 0.5);
    
    return hasFailure
      ? Math.min(...scores)
      : scores.reduce((a, b) => a + b) / scores.length;
  }
  
  identifyWeakestLeg(intent, reality, projection) {
    const legs = [
      { name: 'intent', value: intent },
      { name: 'reality', value: reality },
      { name: 'projection', value: projection }
    ];
    
    return legs.reduce((min, curr) => 
      curr.value < min.value ? curr : min
    ).name;
  }
}
```

### Integration Example (Voting)

```javascript
// In votingIntegration.mjs
async function processVoteWith3DVerification(voteData, userId, context) {
  // Capture intent
  const intent = {
    userId,
    action: 'CAST_VOTE',
    candidateId: voteData.candidateId,
    timestamp: new Date().toISOString(),
    authorityScope: context.authorityRef.scope
  };
  
  // Capture reality
  const reality = {
    eventLog: await this.getRecentEvents(context.filamentId, 10),
    currentState: await this.getVotingState(context.ringId),
    priorVote: await this.getPriorVote(userId, context.electionId)
  };
  
  // Capture projection
  const projection = {
    expectedNewState: {
      voteCount: reality.currentState.voteCount + 1,
      candidateTotal: reality.currentState.candidateTotals[voteData.candidateId] + 1
    },
    downstreamImpact: await this.predictImpact(voteData),
    propagationDepth: 2  // vote → candidate total → regional total
  };
  
  // Three-way match
  const match = await threeWayMatchEngine.verify({
    intent,
    reality,
    projection
  });
  
  if (match.overallConfidence < 0.5) {
    throw new Error(`Three-way match failed: ${match.weakestLeg} leg too weak (${match[match.weakestLeg + 'Confidence']})`);
  }
  
  // Proceed with vote
  return {
    voteAccepted: true,
    threeWayMatch: match,
    eventId: await this.commitVote(voteData, userId, context, match)
  };
}
```

---

## 7. ERI CALCULATOR CONTRACT + STORAGE

### ERI Calculation Formula

```
ERI = (divergenceDepth * 10) 
    + (conflictCount * 5) 
    + (timeSinceLastReconciliation / 86400 * 2)
    - (attestationCount * 3)
    
Where:
  divergenceDepth = number of commits since common ancestor
  conflictCount = number of conflicting changes detected
  timeSinceLastReconciliation = seconds since last merge/reconciliation
  attestationCount = number of explicit verifications/sign-offs
  
Bounds: 0 ≤ ERI ≤ 100
```

### Implementation

```javascript
class ERICalculator {
  constructor() {
    this.git = simpleGit(process.cwd());
  }
  
  async calculateFilamentERI(filamentId) {
    const filament = await this.getFilament(filamentId);
    const reconciliationTarget = await this.getFilament(filament.reconcilesTo);
    
    // Find common ancestor
    const commonAncestor = await this.findCommonAncestor(
      filamentId,
      filament.reconcilesTo
    );
    
    // Calculate divergence depth
    const divergenceDepth = await this.countEventsSince(
      filamentId,
      commonAncestor.eventId
    );
    
    // Detect conflicts
    const conflicts = await this.detectConflicts(
      commonAncestor,
      filamentId,
      filament.reconcilesTo
    );
    
    // Time since last reconciliation
    const lastRecon = new Date(filament.lastReconciliationAt);
    const now = new Date();
    const timeSinceRecon = (now - lastRecon) / 1000;  // seconds
    
    // Count attestations
    const attestations = await this.countAttestations(filamentId);
    
    // Calculate ERI
    const rawERI = 
      (divergenceDepth * 10) +
      (conflicts.length * 5) +
      (timeSinceRecon / 86400 * 2) -
      (attestations * 3);
    
    // Bound to [0, 100]
    const boundedERI = Math.max(0, Math.min(100, rawERI));
    
    return {
      eri: boundedERI,
      components: {
        divergenceDepth,
        conflictCount: conflicts.length,
        timeSinceReconciliation: timeSinceRecon,
        attestationCount: attestations
      },
      timestamp: now.toISOString(),
      filamentId,
      reconcilesTo: filament.reconcilesTo
    };
  }
  
  async calculateVoteERI(voteContext) {
    // Vote-specific ERI calculation
    const filamentERI = await this.calculateFilamentERI(voteContext.filamentId);
    
    // Additional vote-specific factors
    const voterHistory = await this.getVoterHistory(voteContext.userId);
    const regionalDivergence = await this.getRegionalDivergence(voteContext.regionId);
    
    // Adjust ERI based on voter reputation and regional stability
    const adjustedERI = filamentERI.eri * (1 + regionalDivergence * 0.1);
    
    return {
      ...filamentERI,
      eri: Math.min(100, adjustedERI),
      adjustments: {
        regionalDivergence,
        voterReputation: voterHistory.reputation
      }
    };
  }
}
```

### Read-Model Storage

```javascript
// ERI snapshots (time-series)
eri-snapshots/
  {filamentId}/
    {timestamp}.json
    
// Current ERI (fast lookup)
eri-current/
  {filamentId}.json

// Schema
{
  "filamentId": "fil_voting_region_CA",
  "eri": 23.4,
  "components": {
    "divergenceDepth": 5,
    "conflictCount": 1,
    "timeSinceReconciliation": 86400,
    "attestationCount": 3
  },
  "timestamp": "2026-01-31T12:00:00Z",
  "reconcilesTo": "fil_voting_core"
}
```

### API Endpoints

```javascript
// REST endpoints
GET /api/eri/:filamentId
  → Returns current ERI for filament

GET /api/eri/:filamentId/history?from=<timestamp>&to=<timestamp>
  → Returns ERI time series

GET /api/eri/ring/:ringId
  → Returns ERI for all filaments in ring

POST /api/eri/calculate
  Body: { filamentId, snapshot: true }
  → Triggers ERI recalculation, optionally saves snapshot
```

---

## 8. VOTING DOMAIN WIRING (CLEVERTREE ADAPTER)

### Adapter Pattern

```javascript
// CleverTree → Relay Event Substrate adapter
class VotingSubstrateAdapter {
  constructor(votingEngine, eventLog, eriCalculator, threeWayMatch) {
    this.votingEngine = votingEngine;
    this.eventLog = eventLog;
    this.eriCalculator = eriCalculator;
    this.threeWayMatch = threeWayMatch;
  }
  
  async processVote(voteData, userId, authorityRef) {
    // 1. Capture context snapshot
    const snapshot = await this.captureVoteContext({
      voteData,
      userId,
      regionId: voteData.regionId,
      candidateId: voteData.candidateId
    });
    
    // 2. Three-way match
    const match = await this.threeWayMatch.verify({
      intent: {
        userId,
        action: 'CAST_VOTE',
        candidateId: voteData.candidateId,
        authorityScope: authorityRef.scope
      },
      reality: {
        priorVote: await this.votingEngine.getPriorVote(userId),
        votingState: await this.votingEngine.getState(voteData.regionId)
      },
      projection: {
        expectedNewTotal: await this.votingEngine.predictNewTotal(voteData),
        propagationDepth: 2
      }
    });
    
    if (match.overallConfidence < 0.5) {
      throw new Error(`Vote rejected: confidence too low (${match.overallConfidence})`);
    }
    
    // 3. Calculate ERI
    const eri = await this.eriCalculator.calculateVoteERI({
      userId,
      regionId: voteData.regionId,
      filamentId: `fil_voting_${voteData.regionId}`
    });
    
    // 4. Create event
    const event = {
      eventType: 'COMMIT',
      eventId: `evt_${generateId()}`,
      timestamp: new Date().toISOString(),
      timeboxId: await this.getCurrentTimebox(userId),
      filamentId: `fil_voting_${voteData.regionId}`,
      ringId: `ring.voting.${voteData.regionId}`,
      authorityRef,
      evidenceRef: {
        snapshotId: snapshot.snapshotId,
        contextHash: snapshot.hash,
        evidenceType: 'CONTEXT_SNAPSHOT'
      },
      payload: {
        domain: 'VOTING',
        action: 'CAST_VOTE',
        candidateId: voteData.candidateId,
        regionId: voteData.regionId,
        userId
      },
      eri: eri.eri,
      threeWayMatch: match,
      signature: await this.sign(voteData, userId)
    };
    
    // 5. Append to event log
    await this.eventLog.append(event);
    
    // 6. Call legacy CleverTree (during transition)
    await this.votingEngine.recordVote(voteData, userId);
    
    // 7. Update read models
    await this.updateVotingReadModel(event);
    
    return {
      eventId: event.eventId,
      eri: eri.eri,
      confidence: match.overallConfidence,
      accepted: true
    };
  }
  
  async captureVoteContext(context) {
    return {
      snapshotId: `snap_${generateId()}`,
      timestamp: new Date().toISOString(),
      what: {
        action: 'CAST_VOTE',
        candidateId: context.candidateId,
        payload: context.voteData
      },
      where: {
        regionId: context.regionId,
        filamentId: `fil_voting_${context.regionId}`,
        ringId: `ring.voting.${context.regionId}`
      },
      relations: {
        priorVote: await this.votingEngine.getPriorVote(context.userId),
        candidateTotal: await this.votingEngine.getCandidateTotal(context.candidateId),
        regionalTotal: await this.votingEngine.getRegionalTotal(context.regionId)
      },
      when: {
        electionStart: await this.votingEngine.getElectionStart(),
        electionEnd: await this.votingEngine.getElectionEnd(),
        timeSinceStart: Date.now() - new Date(await this.votingEngine.getElectionStart())
      },
      who: {
        userId: context.userId,
        voterHistory: await this.votingEngine.getVoterHistory(context.userId),
        authorityChain: await this.getAuthorityChain(context.userId)
      },
      hash: await this.hashContext(context)
    };
  }
}
```

### Migration Phases

**Phase 1: Adapter Layer** (Week 2)
- Install VotingSubstrateAdapter alongside CleverTree
- All new votes go through adapter
- Adapter calls both event log AND legacy CleverTree
- Verify dual-write correctness

**Phase 2: Read Model Migration** (Week 3)
- Build read models from event log
- Globe/Proximity consume event log read models
- Legacy CleverTree still receives writes (insurance)
- Verify read model parity

**Phase 3: Write Migration** (Week 4)
- Stop writing to CleverTree
- Event log becomes source of truth
- CleverTree frozen as historical snapshot
- Verify no regressions

**Phase 4: Deprecation** (Week 5+)
- CleverTree routes retired
- Event log fully operational
- Historical data migrated to event format (optional)

---

## 9. AUTHORITY + CONSENT GATES

### Authority Manager

```javascript
class AuthorityManager {
  async verifyAuthority(userId, action, scope) {
    // Check direct authority
    const directAuth = await this.getUserAuthority(userId);
    
    // Check delegated authority
    const delegatedAuth = await this.getDelegatedAuthority(userId);
    
    // Check scope match
    const scopeMatch = this.checkScopeMatch(
      action,
      scope,
      [...directAuth, ...delegatedAuth]
    );
    
    if (!scopeMatch) {
      throw new Error(`Insufficient authority: ${userId} cannot ${action} in ${scope}`);
    }
    
    // Build authority chain
    const chain = await this.buildAuthorityChain(userId, action);
    
    return {
      authorized: true,
      userId,
      action,
      scope,
      delegationChain: chain,
      expiresAt: this.calculateExpiration(chain)
    };
  }
  
  async delegate(fromUserId, toUserId, scope, duration) {
    // Verify fromUserId has authority to delegate
    const sourceAuth = await this.getUserAuthority(fromUserId);
    
    if (!this.canDelegate(sourceAuth, scope)) {
      throw new Error(`${fromUserId} cannot delegate ${scope}`);
    }
    
    const delegation = {
      delegationId: `del_${generateId()}`,
      from: fromUserId,
      to: toUserId,
      scope,
      grantedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + duration).toISOString(),
      revocable: true
    };
    
    // Create delegation event
    const event = {
      eventType: 'DELEGATION',
      eventId: `evt_${generateId()}`,
      timestamp: delegation.grantedAt,
      authorityRef: { userId: fromUserId },
      payload: delegation
    };
    
    await this.eventLog.append(event);
    
    return delegation;
  }
}
```

### Consent Manager

```javascript
class ConsentManager {
  async requestConsent(userId, dataType, purpose, requesterUserId) {
    const request = {
      requestId: `req_${generateId()}`,
      userId,
      dataType,
      purpose,
      requesterUserId,
      requestedAt: new Date().toISOString(),
      status: 'PENDING'
    };
    
    // Store consent request
    await this.storeConsentRequest(request);
    
    // Notify user (out of band)
    await this.notifyUser(userId, request);
    
    return request;
  }
  
  async grantConsent(requestId, userId, conditions) {
    const request = await this.getConsentRequest(requestId);
    
    if (request.userId !== userId) {
      throw new Error('Only data owner can grant consent');
    }
    
    const consent = {
      consentId: `con_${generateId()}`,
      requestId,
      userId,
      dataType: request.dataType,
      purpose: request.purpose,
      grantedTo: request.requesterUserId,
      grantedAt: new Date().toISOString(),
      conditions,
      revocable: true
    };
    
    // Create consent event
    const event = {
      eventType: 'CONSENT',
      eventId: `evt_${generateId()}`,
      timestamp: consent.grantedAt,
      authorityRef: { userId },
      payload: consent
    };
    
    await this.eventLog.append(event);
    
    return consent;
  }
  
  async checkConsent(userId, dataType, requesterUserId) {
    const consents = await this.getUserConsents(userId, dataType);
    
    const validConsent = consents.find(c => 
      c.grantedTo === requesterUserId &&
      c.revocable === true &&
      this.isValid(c)
    );
    
    return {
      hasConsent: !!validConsent,
      consentId: validConsent?.consentId,
      conditions: validConsent?.conditions
    };
  }
}
```

### Integration with Events

Every material event MUST include:

```javascript
{
  "authorityRef": {
    "userId": "user_12345",
    "delegationChain": ["authority_root", "authority_dept_ops"],
    "scope": ["write:votes", "read:results"],
    "expiresAt": "2026-02-01T00:00:00Z"
  },
  "consentRef": {
    "consentId": "con_abc123",
    "dataTypes": ["vote_history", "regional_affiliation"],
    "conditions": ["anonymized", "aggregated_only"]
  }
}
```

---

## 10. PRESSURE + RESILIENCE STATES

### Pressure Model

```javascript
class PressureManager {
  constructor() {
    this.thresholds = {
      NORMAL: { eri: 30, load: 100, latency: 500 },
      DEGRADED: { eri: 60, load: 200, latency: 2000 },
      INDETERMINATE: { eri: 80, load: 500, latency: 5000 },
      REFUSAL: { eri: 95, load: 1000, latency: 10000 }
    };
    this.currentState = 'NORMAL';
  }
  
  async detectPressure(ringId) {
    const metrics = await this.collectMetrics(ringId);
    
    const eri = metrics.averageERI;
    const load = metrics.requestsPerSecond;
    const latency = metrics.p95Latency;
    
    // Determine state
    if (eri > this.thresholds.REFUSAL.eri || 
        load > this.thresholds.REFUSAL.load ||
        latency > this.thresholds.REFUSAL.latency) {
      return 'REFUSAL';
    } else if (eri > this.thresholds.INDETERMINATE.eri ||
               load > this.thresholds.INDETERMINATE.load ||
               latency > this.thresholds.INDETERMINATE.latency) {
      return 'INDETERMINATE';
    } else if (eri > this.thresholds.DEGRADED.eri ||
               load > this.thresholds.DEGRADED.load ||
               latency > this.thresholds.DEGRADED.latency) {
      return 'DEGRADED';
    }
    
    return 'NORMAL';
  }
  
  async degradeGracefully(currentState, targetState) {
    const actions = {
      'NORMAL->DEGRADED': [
        'Increase polling intervals',
        'Defer non-critical reconciliations',
        'Emit pressure warnings'
      ],
      'DEGRADED->INDETERMINATE': [
        'Pause non-essential features',
        'Rate limit write operations',
        'Alert operators'
      ],
      'INDETERMINATE->REFUSAL': [
        'Accept only read operations',
        'Reject new writes',
        'Redirect to read replicas'
      ]
    };
    
    const transitionKey = `${currentState}->${targetState}`;
    const steps = actions[transitionKey] || [];
    
    for (const step of steps) {
      await this.executeAction(step);
    }
    
    // Create pressure event
    const event = {
      eventType: 'PRESSURE_STATE_CHANGE',
      eventId: `evt_${generateId()}`,
      timestamp: new Date().toISOString(),
      payload: {
        previousState: currentState,
        newState: targetState,
        actions: steps,
        reason: 'Graceful degradation'
      }
    };
    
    await this.eventLog.append(event);
    
    this.currentState = targetState;
  }
  
  async isolateRing(ringId, reason) {
    // Ring-level isolation prevents cascade
    const isolation = {
      ringId,
      isolatedAt: new Date().toISOString(),
      reason,
      allowedOperations: ['READ'],
      rejectedOperations: ['WRITE', 'RECONCILE']
    };
    
    // Create isolation event
    const event = {
      eventType: 'RING_ISOLATION',
      eventId: `evt_${generateId()}`,
      timestamp: isolation.isolatedAt,
      ringId,
      payload: isolation
    };
    
    await this.eventLog.append(event);
    
    return isolation;
  }
}
```

### Resilience States

```
NORMAL
  ↓ (pressure threshold exceeded)
DEGRADED
  ↓ (continued pressure)
INDETERMINATE
  ↓ (critical threshold)
REFUSAL
  ↓ (after recovery)
INDETERMINATE
  ↓ (stabilization)
DEGRADED
  ↓ (recovery complete)
NORMAL
```

**No kill switch**: System can never hard-stop. Only graceful degradation to read-only mode.

---

## 11. READ-MODEL + RENDER PIPELINE

### Architecture

```
┌─────────────────────────────────────────────┐
│         Append-Only Event Log               │
│  (Single Source of Truth)                   │
└────────────┬────────────────────────────────┘
             │
             ├──────────────────────────────────┐
             │                                  │
             ▼                                  ▼
    ┌────────────────┐                ┌────────────────┐
    │  Read Model 1  │                │  Read Model 2  │
    │  (2D Surface)  │                │  (3D Globe)    │
    └────────┬───────┘                └────────┬───────┘
             │                                  │
             ▼                                  ▼
    ┌────────────────┐                ┌────────────────┐
    │  Spreadsheet   │                │  Three.js      │
    │  Renderer      │                │  Renderer      │
    └────────────────┘                └────────────────┘
```

### Read Model Builders

```javascript
class ReadModelBuilder {
  constructor(eventLog) {
    this.eventLog = eventLog;
    this.subscribers = [];
  }
  
  async build(fromEventId, untilEventId, modelType) {
    const events = await this.eventLog.getEventRange(fromEventId, untilEventId);
    
    const builder = this.getBuilder(modelType);
    let model = builder.initialize();
    
    for (const event of events) {
      model = builder.apply(model, event);
    }
    
    return builder.finalize(model);
  }
  
  async subscribe(modelType, callback) {
    const subscriber = {
      modelType,
      callback,
      lastProcessedEventId: null
    };
    
    this.subscribers.push(subscriber);
    
    // Start streaming updates
    this.eventLog.stream((event) => {
      if (this.shouldProcess(event, modelType)) {
        callback(event);
        subscriber.lastProcessedEventId = event.eventId;
      }
    });
  }
  
  getBuilder(modelType) {
    const builders = {
      '2D_SURFACE': new SurfaceModelBuilder(),
      '3D_GLOBE': new GlobeModelBuilder(),
      'BATTLECRUISER': new BattlecruiserModelBuilder()
    };
    
    return builders[modelType];
  }
}
```

### 2D Surface Model Builder

```javascript
class SurfaceModelBuilder {
  initialize() {
    return {
      cells: {},        // cellId -> { value, formula, filamentId, anchors }
      formulas: {},     // formulaId -> { type, inputs, output }
      filaments: {},    // filamentId -> { events, anchors }
      timeboxes: {}     // timeboxId -> { startTime, endTime, events }
    };
  }
  
  apply(model, event) {
    switch (event.eventType) {
      case 'COMMIT':
        if (event.payload.domain === 'SPREADSHEET') {
          return this.applySpreadsheetCommit(model, event);
        }
        break;
      
      case 'FORMULA_CHANGE':
        return this.applyFormulaChange(model, event);
      
      case 'CELL_EDIT':
        return this.applyCellEdit(model, event);
    }
    
    return model;
  }
  
  applySpreadsheetCommit(model, event) {
    const { cellId, value, formula, filamentId } = event.payload;
    
    // Update cell
    model.cells[cellId] = {
      value,
      formula,
      filamentId,
      lastUpdated: event.timestamp,
      anchors: this.extractAnchors(formula)
    };
    
    // If formula exists, create TransformAnchor
    if (formula) {
      const formulaId = `formula_${cellId}`;
      model.formulas[formulaId] = {
        type: this.parseFormulaType(formula),  // SUM, VLOOKUP, etc.
        inputs: this.parseFormulaInputs(formula),
        output: cellId,
        filamentId: event.filamentId,
        evaluatorVersion: '1.0.0'
      };
    }
    
    // Update filament
    if (!model.filaments[filamentId]) {
      model.filaments[filamentId] = { events: [], anchors: [] };
    }
    model.filaments[filamentId].events.push(event.eventId);
    
    return model;
  }
  
  applyCellEdit(model, event) {
    const { cellId, newValue } = event.payload;
    
    if (model.cells[cellId]) {
      model.cells[cellId].value = newValue;
      model.cells[cellId].lastUpdated = event.timestamp;
    }
    
    return model;
  }
  
  finalize(model) {
    // Post-processing: resolve formula dependencies, build dependency graph
    const dependencyGraph = this.buildDependencyGraph(model.formulas);
    
    return {
      ...model,
      dependencyGraph,
      timestamp: new Date().toISOString()
    };
  }
  
  buildDependencyGraph(formulas) {
    const graph = {};
    
    for (const [formulaId, formula] of Object.entries(formulas)) {
      graph[formula.output] = formula.inputs;
    }
    
    return graph;
  }
}
```

### 3D Globe Model Builder

```javascript
class GlobeModelBuilder {
  initialize() {
    return {
      filaments: [],      // Array of filament geometries
      anchors: [],        // Array of anchor positions
      rings: [],          // Array of ring boundaries
      flow: [],           // Array of flow vectors
      heat: {}            // cellId -> ERI value
    };
  }
  
  apply(model, event) {
    switch (event.eventType) {
      case 'COMMIT':
        return this.applyCommit(model, event);
      
      case 'FORK':
        return this.applyFork(model, event);
      
      case 'MERGE':
        return this.applyMerge(model, event);
    }
    
    return model;
  }
  
  applyCommit(model, event) {
    const filamentId = event.filamentId;
    
    // Update or create filament geometry
    let filament = model.filaments.find(f => f.id === filamentId);
    
    if (!filament) {
      filament = {
        id: filamentId,
        points: [],
        color: this.assignColor(filamentId),
        eri: event.eri || 0
      };
      model.filaments.push(filament);
    }
    
    // Add point to filament (commit becomes a point)
    filament.points.push({
      eventId: event.eventId,
      position: this.calculatePosition(event),
      timestamp: event.timestamp,
      eri: event.eri
    });
    
    // Update heat map
    model.heat[event.eventId] = event.eri;
    
    return model;
  }
  
  applyFork(model, event) {
    const sourceFilament = model.filaments.find(
      f => f.id === event.payload.sourceFilamentId
    );
    
    if (!sourceFilament) return model;
    
    // Create new filament branching from source
    const newFilament = {
      id: event.filamentId,
      points: [sourceFilament.points[sourceFilament.points.length - 1]],
      color: this.assignColor(event.filamentId),
      eri: 0,
      parentId: event.payload.sourceFilamentId
    };
    
    model.filaments.push(newFilament);
    
    return model;
  }
  
  applyMerge(model, event) {
    // Create merge scar (directional arrow)
    const sourceFilament = model.filaments.find(
      f => f.id === event.payload.sourceFilamentId
    );
    const targetFilament = model.filaments.find(
      f => f.id === event.payload.targetFilamentId
    );
    
    if (!sourceFilament || !targetFilament) return model;
    
    // Add scar visualization
    const scar = {
      from: sourceFilament.points[sourceFilament.points.length - 1].position,
      to: targetFilament.points[targetFilament.points.length - 1].position,
      eventId: event.eventId,
      type: 'MERGE_SCAR'
    };
    
    if (!model.scars) model.scars = [];
    model.scars.push(scar);
    
    return model;
  }
  
  finalize(model) {
    // Calculate ring boundaries from filament clusters
    model.rings = this.calculateRings(model.filaments);
    
    // Calculate flow vectors
    model.flow = this.calculateFlow(model.filaments);
    
    return model;
  }
}
```

### Battlecruiser Model Builder

```javascript
class BattlecruiserModelBuilder {
  initialize() {
    return {
      mode: 'EDUCATION',  // EDUCATION | INSPECTION | REPLAY
      currentTimeboxId: null,
      overlays: {
        filaments: true,
        anchors: true,
        flow: false,
        heat: false
      },
      selectedAnchor: null,
      scrubPosition: 0.0,  // 0.0 to 1.0 (timeline position)
      inspectionRefs: []
    };
  }
  
  apply(model, event) {
    // Battlecruiser is primarily a lens controller, not data
    // It maintains UI state over the same substrate as 2D/3D
    
    if (event.eventType === 'UI_INTERACTION') {
      return this.applyUIInteraction(model, event);
    }
    
    return model;
  }
  
  applyUIInteraction(model, event) {
    switch (event.payload.action) {
      case 'TOGGLE_OVERLAY':
        model.overlays[event.payload.overlay] = !model.overlays[event.payload.overlay];
        break;
      
      case 'SELECT_ANCHOR':
        model.selectedAnchor = event.payload.anchorId;
        model.inspectionRefs = this.getAnchorRefs(event.payload.anchorId);
        break;
      
      case 'SCRUB_TIME':
        model.scrubPosition = event.payload.position;
        break;
    }
    
    return model;
  }
  
  finalize(model) {
    // Lens never invents truth - it only controls visibility
    return {
      ...model,
      message: 'Battlecruiser lens is a view over canonical substrate. It does not create truth.'
    };
  }
}
```

---

## 12. API SURFACE

### REST Endpoints

```javascript
// Event log
POST   /api/events                          // Append new event
GET    /api/events/:eventId                 // Get single event
GET    /api/events?filament=:id&from=:ts    // Query events

// Filaments
GET    /api/filaments/:filamentId           // Get filament metadata
GET    /api/filaments/:filamentId/events    // Get filament event log
POST   /api/filaments/:filamentId/fork      // Fork filament
POST   /api/filaments/:source/merge/:target // Merge filaments

// ERI
GET    /api/eri/:filamentId                 // Current ERI
GET    /api/eri/:filamentId/history         // ERI time series
POST   /api/eri/calculate                   // Trigger recalculation

// Authority & Consent
POST   /api/authority/verify                // Verify authority
POST   /api/authority/delegate              // Delegate authority
POST   /api/consent/request                 // Request consent
POST   /api/consent/grant                   // Grant consent
GET    /api/consent/:userId                 // Get user consents

// Voting (domain-specific)
POST   /api/vote                            // Cast vote (goes through substrate)
GET    /api/vote/:userId                    // Get vote history
GET    /api/results/:electionId             // Get results (read model)

// Read models
GET    /api/read-model/2d-surface           // Get 2D spreadsheet model
GET    /api/read-model/3d-globe             // Get 3D globe model
GET    /api/read-model/battlecruiser        // Get battlecruiser lens state

// Pressure & resilience
GET    /api/pressure/:ringId                // Get pressure state
POST   /api/pressure/:ringId/isolate        // Isolate ring (emergency)
```

### SSE Endpoints (Placeholder for Week 4)

```javascript
// Server-Sent Events for real-time updates
GET    /api/stream/events                   // Live event stream
GET    /api/stream/pressure                 // Live pressure monitoring
GET    /api/stream/eri/:filamentId          // Live ERI updates
```

### Example Request/Response

```javascript
// POST /api/vote
Request:
{
  "candidateId": "candidate_abc",
  "regionId": "CA",
  "userId": "user_12345",
  "authorityRef": {
    "userId": "user_12345",
    "scope": ["write:votes"]
  }
}

Response:
{
  "eventId": "evt_2026-01-31T12:34:56.789Z_xyz",
  "eri": 23.4,
  "threeWayMatch": {
    "intentConfidence": 0.9,
    "realityConfidence": 0.8,
    "projectionConfidence": 0.7,
    "overallConfidence": 0.7
  },
  "accepted": true,
  "timestamp": "2026-01-31T12:34:56.789Z"
}
```

---

## 13. MIGRATION PLAN (PHASED)

### Phase 1: Adapter Layer (Week 2)

**Goal**: Install substrate alongside existing systems

**Tasks**:
1. Create event log storage (file-based, append-only)
2. Implement VotingSubstrateAdapter
3. Route all new votes through adapter
4. Adapter writes to BOTH event log AND CleverTree
5. Verify dual-write correctness

**Success criteria**:
- All votes create events in event log
- CleverTree still receives all votes
- Zero vote loss
- ERI calculated for all votes

### Phase 2: Read Model Migration (Week 3)

**Goal**: Shift reads to event-sourced models

**Tasks**:
1. Build 2D surface read model from event log
2. Build 3D globe read model from event log
3. Update Globe component to consume new read models
4. Update Proximity to consume new read models
5. CleverTree still receives writes (insurance)

**Success criteria**:
- Globe renders from event log read models
- Proximity channels from event log read models
- Visual parity with legacy system
- No regressions

### Phase 3: Write Migration (Week 4)

**Goal**: Event log becomes source of truth

**Tasks**:
1. Stop writing to CleverTree (freeze as snapshot)
2. All writes go only to event log
3. All reads from event log read models
4. Monitor for regressions

**Success criteria**:
- Zero writes to CleverTree
- All features work from event log only
- Performance acceptable
- ERI tracking operational

### Phase 4: Deprecation (Week 5+)

**Goal**: Remove legacy code

**Tasks**:
1. Archive CleverTree as historical snapshot
2. Remove CleverTree routes from API
3. Remove VotingSubstrateAdapter (no longer dual-write)
4. Direct event log writes
5. Migrate historical CleverTree data to events (optional)

**Success criteria**:
- CleverTree code removed
- Event log fully operational
- Historical queries work
- Zero legacy dependencies

---

## 14. INVARIANT ENFORCERS

### Lint Rules (Development-time)

```javascript
// relay-lint:defense rules

1. NO_ADVERSARIAL_LANGUAGE
   - Forbidden: attack, threat, enemy, drift, penetration, exploitation
   - Use: audit, verify, risk, pressure, divergence, inspection

2. NO_HISTORY_DELETION
   - Flag: .delete(), .remove() on event log
   - Require: REVERT pattern instead

3. NO_KILL_SWITCH
   - Flag: global shutdown, hard stop, terminate all
   - Require: graceful degradation states

4. AUTHORITY_REF_REQUIRED
   - Every COMMIT event must have authorityRef
   - Every material change must have evidenceRef

5. APPEND_ONLY_ENFORCEMENT
   - Event log writes must be append-only
   - No in-place mutations of events

6. THREE_WAY_MATCH_REQUIRED
   - All state changes must pass three-way match
   - Confidence must be ≥ 0.5

7. ERI_CALCULATION_REQUIRED
   - All commits must calculate ERI
   - ERI must be stored in event

8. TIMEBOX_STATE_MACHINE
   - State transitions must follow DRAFT→HOLD→PROPOSE→COMMIT
   - No skipping states

9. NO_DIALOGUE_COMMITS
   - Work zone dialogue cannot create commits
   - Only explicit COMMIT events are canonical

10. PRESSURE_BUDGET_CHECK
    - Commits must check pressure budget
    - Exceed budget → enter DEGRADED state
```

### Runtime Guards

```javascript
class InvariantEnforcer {
  enforce(event) {
    this.enforceAppendOnly(event);
    this.enforceAuthorityRef(event);
    this.enforceEvidenceRef(event);
    this.enforceThreeWayMatch(event);
    this.enforceERICalculation(event);
    this.enforceTimeboxStateMachine(event);
  }
  
  enforceAppendOnly(event) {
    if (event.mutates) {
      throw new Error('INVARIANT VIOLATION: Attempted in-place mutation of event log');
    }
  }
  
  enforceAuthorityRef(event) {
    if (event.eventType === 'COMMIT' && !event.authorityRef) {
      throw new Error('INVARIANT VIOLATION: COMMIT requires authorityRef');
    }
  }
  
  enforceEvidenceRef(event) {
    if (event.eventType === 'COMMIT' && !event.evidenceRef) {
      throw new Error('INVARIANT VIOLATION: COMMIT requires evidenceRef');
    }
  }
  
  enforceThreeWayMatch(event) {
    if (event.eventType === 'COMMIT' && !event.threeWayMatch) {
      throw new Error('INVARIANT VIOLATION: COMMIT requires threeWayMatch');
    }
    
    if (event.threeWayMatch && event.threeWayMatch.overallConfidence < 0.5) {
      throw new Error('INVARIANT VIOLATION: Three-way match confidence too low');
    }
  }
  
  enforceERICalculation(event) {
    if (event.eventType === 'COMMIT' && event.eri === undefined) {
      throw new Error('INVARIANT VIOLATION: COMMIT requires ERI calculation');
    }
  }
  
  enforceTimeboxStateMachine(event) {
    const validTransitions = {
      'DRAFT': ['HOLD'],
      'HOLD': ['PROPOSE', 'DRAFT'],
      'PROPOSE': ['COMMIT', 'HOLD'],
      'COMMIT': ['REVERT'],
      'REVERT': []
    };
    
    if (event.previousState && !validTransitions[event.previousState].includes(event.eventType)) {
      throw new Error(`INVARIANT VIOLATION: Invalid state transition ${event.previousState} → ${event.eventType}`);
    }
  }
}
```

---

## 15. IMPLEMENTATION CHECKLIST

### Week 1-2: Foundation
- [ ] Event log storage (append-only file system)
- [ ] Event envelope schema
- [ ] Timebox state machine
- [ ] Three-way match engine
- [ ] ERI calculator
- [ ] Authority manager
- [ ] Consent manager
- [ ] Invariant enforcer (runtime guards)

### Week 3: CleverTree Integration
- [ ] VotingSubstrateAdapter
- [ ] Context snapshot manager
- [ ] Dual-write to event log + CleverTree
- [ ] Vote flow end-to-end test

### Week 4: Read Models
- [ ] Read model builder framework
- [ ] 2D surface model builder
- [ ] 3D globe model builder
- [ ] Battlecruiser model builder
- [ ] API endpoints for read models

### Week 5: Migration
- [ ] Phase 2 complete (reads from event log)
- [ ] Phase 3 complete (writes to event log only)
- [ ] CleverTree frozen
- [ ] Performance verified

### Week 6-8: Polish & Resilience
- [ ] Pressure management system
- [ ] Ring isolation
- [ ] Graceful degradation
- [ ] SSE endpoints
- [ ] relay-lint:defense (10 rules)
- [ ] Full test coverage

---

## APPROVAL CHECKLIST

### Architecture Locks Compliance
- [x] c14: Surface Coordination Geometry (rings, filaments, ERI)
- [x] c15: Pressure Management & Resilience (graceful degradation)
- [x] c16: Commit Materiality (DRAFT→COMMIT, materiality thresholds)
- [x] c17: Work Zones (dialogue ephemeral, commits canonical)
- [x] Cognitive Recovery (filaments as navigation paths)
- [x] Live Presence (time boxes, material boundaries)
- [x] CleverTree Integration (three-way match, ERI, snapshots)

### Principles Compliance
- [x] Git as OS (commits are coordination events)
- [x] 3D cognition (down=history, surface=present, outward=speculation)
- [x] Pressure not command (turgor model, graceful degradation)
- [x] Ring-based basins (Laniakea geometry)
- [x] Filaments as recovery paths (persistent identity, fork handling)
- [x] Time boxes contain continuity (ephemeral inside discrete)
- [x] Material boundaries (commits at thresholds only)
- [x] Safe language (zero adversarial terms)
- [x] Transparent not weaponized (CERN principle, no kill switch)
- [x] Grounded in science (no mysticism)

### Rendering Requirements
- [x] 2D timebox spreadsheet (cells → filaments, formulas as TransformAnchors)
- [x] 3D filament view (anchors embedded in flow, nothing orbits)
- [x] Battlecruiser interface (lens over truth, never invents)

### Implementation Constraints
- [x] No auto-repair (repairs staged and auditable)
- [x] No history deletion (append-only, REVERT pattern)
- [x] No kill switch (graceful degradation states)
- [x] Dialogue ≠ commits (work zone protocol)
- [x] Authority + Evidence (every material change)

---

**STATUS**: V1 DRAFT COMPLETE — READY FOR CANON REVIEW

**Next step**: Submit to CANON for approval

---

**END RELAY BACKEND SCHEMATIC V1**
