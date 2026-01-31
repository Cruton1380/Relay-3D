/**
 * AGENT CONCURRENCY PROOF
 * 
 * Demonstrates: Two agents proposing in parallel + deterministic merge queue + fork-on-conflict
 * 
 * NON-NEGOTIABLE INVARIANTS:
 * 1. No silent arbitration (conflicts create filaments)
 * 2. Deterministic ordering (not timing-based)
 * 3. No auto-merge/auto-rebase (human authority required)
 * 4. Serialized merge execution (one at a time, queue head only)
 * 
 * Route: /proof/agent-concurrency
 */

import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Text } from '@react-three/drei';
import {
  createQueueEnqueue,
  createQueueDequeue,
  createConflictDetected,
  createConflictResolvedByFork,
  sortQueueDeterministically,
  detectConflict,
  verifyNoSilentArbitration,
  verifyDeterministicOrdering,
  verifySerializedMerge,
  verifyNoAutoResolve,
} from '../components/ai/schemas/mergeQueueSchemas';
import {
  createTaskAccepted,
  createPlanCommit,
  createReadRef,
  createProposeChangeset,
  createWorkDone,
  createMergeScar,
} from '../components/ai/schemas/aiWorkspaceSchemas';

export default function AgentConcurrencyProof() {
  const [step, setStep] = useState(0);
  
  // Filaments
  const [conversationFilament, setConversationFilament] = useState({
    filamentId: 'convo.main',
    commits: [],
  });
  
  const [workFilaments, setWorkFilaments] = useState([]); // Multiple work sessions
  const [fileFilament, setFileFilament] = useState({
    filamentId: 'file.example.js',
    commits: [
      {
        commitIndex: 0,
        ts: Date.now(),
        actor: { kind: 'user', id: 'user-1' },
        op: 'FILE_CREATED',
        payload: { content: 'const x = 1;', hash: 'sha256:base123' },
      },
    ],
  });
  
  const [queueFilament, setQueueFilament] = useState({
    filamentId: 'queue.example.js',
    commits: [],
  });
  
  const [conflictFilaments, setConflictFilaments] = useState([]);
  const [proposalFilaments, setProposalFilaments] = useState([]);
  
  // Visual state
  const [workCursors, setWorkCursors] = useState({}); // { agentId: { workIndex, commitIndex } }
  const [conflictDetected, setConflictDetected] = useState(null);
  
  // Filament positions
  const filamentPositions = {
    conversation: [-20, 0, 0],
    workAgent1: [-10, 0, 0],
    workAgent2: [0, 0, 0],
    file: [10, 0, 0],
    queue: [20, 0, 0],
    conflict: [15, 0, 5],
  };
  
  // ============================================================================
  // STEP 1: TWO AGENTS ACCEPT TASKS (PARALLEL)
  // ============================================================================
  
  const handleAssignAgents = () => {
    // Agent 1: Task A (touches cells A1, B1)
    const taskA = createTaskAccepted(
      'agent-1',
      'task-A',
      0,
      'Refactor function A',
      { filamentId: 'convo.main', commitIndex: 0 },
      'main'
    );
    const planA = createPlanCommit('agent-1', 'task-A', 1, ['Read cells A1-B1', 'Propose changes']);
    
    // Agent 2: Task B (touches cells B1, C1) - CONFLICT on B1
    const taskB = createTaskAccepted(
      'agent-2',
      'task-B',
      0,
      'Refactor function B',
      { filamentId: 'convo.main', commitIndex: 0 },
      'main'
    );
    const planB = createPlanCommit('agent-2', 'task-B', 1, ['Read cells B1-C1', 'Propose changes']);
    
    setWorkFilaments([
      {
        filamentId: 'work.agent-1.task-A',
        taskId: 'task-A',
        agentId: 'agent-1',
        commits: [taskA, planA],
      },
      {
        filamentId: 'work.agent-2.task-B',
        taskId: 'task-B',
        agentId: 'agent-2',
        commits: [taskB, planB],
      },
    ]);
    
    setWorkCursors({
      'agent-1': { workIndex: 0, commitIndex: 1 },
      'agent-2': { workIndex: 1, commitIndex: 1 },
    });
    
    setStep(1);
  };
  
  // ============================================================================
  // STEP 2: AGENTS READ & PROPOSE (PARALLEL)
  // ============================================================================
  
  const handleAgentsPropose = () => {
    // Agent 1: Read + Propose (touches A1, B1)
    const readA = createReadRef('agent-1', 'task-A', 2, 'file.example.js', 0, 'sha256:base123', 'cells:A1-B1');
    const proposeA = createProposeChangeset('agent-1', 'task-A', 3, 'file.example.js', { diff: 'A1 changes' }, { filamentId: 'convo.main', commitIndex: 0 });
    
    // Agent 2: Read + Propose (touches B1, C1)
    const readB = createReadRef('agent-2', 'task-B', 2, 'file.example.js', 0, 'sha256:base123', 'cells:B1-C1');
    const proposeB = createProposeChangeset('agent-2', 'task-B', 3, 'file.example.js', { diff: 'B1 changes' }, { filamentId: 'convo.main', commitIndex: 0 });
    
    setWorkFilaments(prev => [
      {
        ...prev[0],
        commits: [...prev[0].commits, readA, proposeA],
      },
      {
        ...prev[1],
        commits: [...prev[1].commits, readB, proposeB],
      },
    ]);
    
    // Create proposal branches
    setProposalFilaments([
      {
        filamentId: 'file.example.js@proposal/task-A',
        commits: [{
          commitIndex: 0,
          op: 'PROPOSE_CHANGESET',
          payload: { changes: 'A1 changes', touchedLoci: ['A1', 'B1'] },
        }],
      },
      {
        filamentId: 'file.example.js@proposal/task-B',
        commits: [{
          commitIndex: 0,
          op: 'PROPOSE_CHANGESET',
          payload: { changes: 'B1 changes', touchedLoci: ['B1', 'C1'] },
        }],
      },
    ]);
    
    setWorkCursors({
      'agent-1': { workIndex: 0, commitIndex: 3 },
      'agent-2': { workIndex: 1, commitIndex: 3 },
    });
    
    setStep(2);
  };
  
  // ============================================================================
  // STEP 3: ENQUEUE PROPOSALS (DETERMINISTIC ORDER)
  // ============================================================================
  
  const handleEnqueueProposals = () => {
    // Enqueue both proposals (different wall-clock times)
    const enqueueA = createQueueEnqueue(
      'example.js',
      0,
      'file.example.js@proposal/task-A',
      'task-A',
      'agent-1',
      'sha256:base123',
      ['A1', 'B1']
    );
    
    // Enqueue B later (but deterministic sort will order by taskId)
    setTimeout(() => {
      const enqueueB = createQueueEnqueue(
        'example.js',
        1,
        'file.example.js@proposal/task-B',
        'task-B',
        'agent-2',
        'sha256:base123',
        ['B1', 'C1']
      );
      
      setQueueFilament(prev => ({
        ...prev,
        commits: [...prev.commits, enqueueB],
      }));
    }, 100);
    
    setQueueFilament(prev => ({
      ...prev,
      commits: [enqueueA],
    }));
    
    setStep(3);
  };
  
  // ============================================================================
  // STEP 4: DETECT CONFLICT
  // ============================================================================
  
  const handleDetectConflict = () => {
    const proposalA = {
      proposalBranchId: 'file.example.js@proposal/task-A',
      touchedLoci: ['A1', 'B1'],
      baseCommitHash: 'sha256:base123',
    };
    
    const proposalB = {
      proposalBranchId: 'file.example.js@proposal/task-B',
      touchedLoci: ['B1', 'C1'],
      baseCommitHash: 'sha256:base123',
    };
    
    const { hasConflict, overlap } = detectConflict(proposalA, proposalB);
    
    if (hasConflict) {
      // Create conflict filament
      const conflictCommit = createConflictDetected('example.js', proposalA, proposalB, 0);
      
      setConflictFilaments([
        {
          filamentId: conflictCommit.filamentId,
          commits: [conflictCommit],
        },
      ]);
      
      setConflictDetected({ overlap, proposalA, proposalB });
    }
    
    setStep(4);
  };
  
  // ============================================================================
  // STEP 5: RESOLVE CONFLICT (FORK)
  // ============================================================================
  
  const handleResolveByFork = () => {
    if (!conflictDetected) return;
    
    // Create fork resolution
    const forkResolution = createConflictResolvedByFork(
      'example.js',
      conflictDetected.proposalA.proposalBranchId,
      conflictDetected.proposalB.proposalBranchId,
      1,
      'file.example.js@fork/A',
      'file.example.js@fork/B',
      {
        triggeredBy: { kind: 'user', id: 'user-1' },
        evidenceRefs: ['user-choice-fork'],
      }
    );
    
    setConflictFilaments(prev => [
      {
        ...prev[0],
        commits: [...prev[0].commits, forkResolution],
      },
    ]);
    
    // Dequeue both (forked)
    setQueueFilament(prev => ({
      ...prev,
      commits: [
        ...prev.commits,
        createQueueDequeue('example.js', prev.commits.length, conflictDetected.proposalA.proposalBranchId, 'forked'),
        createQueueDequeue('example.js', prev.commits.length + 1, conflictDetected.proposalB.proposalBranchId, 'forked'),
      ],
    }));
    
    setStep(5);
  };
  
  // ============================================================================
  // SORTED QUEUE (DETERMINISTIC)
  // ============================================================================
  
  const sortedQueue = useMemo(() => {
    const enqueued = queueFilament.commits.filter(c => c.op === 'QUEUE_ENQUEUE');
    return sortQueueDeterministically(enqueued);
  }, [queueFilament]);
  
  // ============================================================================
  // VERIFICATION RESULTS
  // ============================================================================
  
  const verificationResults = useMemo(() => {
    if (step < 4) return null;
    
    return {
      noSilentArbitration: verifyNoSilentArbitration(queueFilament, conflictFilaments),
      deterministicOrdering: verifyDeterministicOrdering(queueFilament),
      serializedMerge: verifySerializedMerge(queueFilament, fileFilament),
      noAutoResolve: verifyNoAutoResolve(conflictFilaments),
    };
  }, [step, queueFilament, conflictFilaments, fileFilament]);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', display: 'flex' }}>
      {/* Left Panel: Controls */}
      <div style={{
        width: '300px',
        background: '#111',
        padding: '20px',
        overflowY: 'auto',
        borderRight: '1px solid #333',
      }}>
        <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#ffaa00' }}>
            🤖🤖 AGENT CONCURRENCY
          </div>
          
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '20px' }}>
            Two agents proposing in parallel → deterministic queue → fork on conflict
          </div>
          
          {/* Step Buttons */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={handleAssignAgents}
              disabled={step !== 0}
              style={{
                width: '100%',
                marginBottom: '8px',
                padding: '10px',
                fontSize: '11px',
                background: step === 0 ? '#ffaa00' : '#333',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: step === 0 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              1. Assign Two Agents
            </button>
            
            <button
              onClick={handleAgentsPropose}
              disabled={step !== 1}
              style={{
                width: '100%',
                marginBottom: '8px',
                padding: '10px',
                fontSize: '11px',
                background: step === 1 ? '#ffaa00' : '#333',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: step === 1 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              2. Agents Propose (Parallel)
            </button>
            
            <button
              onClick={handleEnqueueProposals}
              disabled={step !== 2}
              style={{
                width: '100%',
                marginBottom: '8px',
                padding: '10px',
                fontSize: '11px',
                background: step === 2 ? '#ffaa00' : '#333',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: step === 2 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              3. Enqueue (Deterministic Order)
            </button>
            
            <button
              onClick={handleDetectConflict}
              disabled={step !== 3}
              style={{
                width: '100%',
                marginBottom: '8px',
                padding: '10px',
                fontSize: '11px',
                background: step === 3 ? '#ff0000' : '#333',
                color: step === 3 ? '#fff' : '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: step === 3 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              4. Detect Conflict (B1 overlap)
            </button>
            
            <button
              onClick={handleResolveByFork}
              disabled={step !== 4}
              style={{
                width: '100%',
                marginBottom: '8px',
                padding: '10px',
                fontSize: '11px',
                background: step === 4 ? '#00ff00' : '#333',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: step === 4 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              5. Resolve by Fork
            </button>
          </div>
          
          {/* Queue State */}
          {sortedQueue.length > 0 && (
            <div style={{
              marginTop: '20px',
              padding: '12px',
              background: '#001a1a',
              border: '1px solid #00ffff',
              borderRadius: '4px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#00ffff', marginBottom: '8px' }}>
                QUEUE STATE
              </div>
              <div style={{ fontSize: '9px', color: '#00ffff', lineHeight: '1.6' }}>
                {sortedQueue.map((entry, i) => (
                  <div key={i} style={{ marginBottom: '5px' }}>
                    {i + 1}. {entry.payload.taskId}
                    <br />
                    <span style={{ color: '#666', fontSize: '8px' }}>
                      Loci: {entry.payload.touchedLoci.join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Conflict Inspector */}
          {conflictDetected && (
            <div style={{
              marginTop: '20px',
              padding: '12px',
              background: '#1a0000',
              border: '1px solid #ff0000',
              borderRadius: '4px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ff0000', marginBottom: '8px' }}>
                ⚠️ CONFLICT DETECTED
              </div>
              <div style={{ fontSize: '9px', color: '#ff0000', lineHeight: '1.6' }}>
                Overlap: {conflictDetected.overlap.join(', ')}
                <br />
                <br />
                <span style={{ color: '#fff' }}>
                  A: {conflictDetected.proposalA.touchedLoci.join(', ')}
                  <br />
                  B: {conflictDetected.proposalB.touchedLoci.join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Center: 3D View */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 20, 50]} />
          <OrbitControls />
          
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          
          <gridHelper args={[60, 20, '#222', '#111']} />
          
          {/* Work Filaments (Two Agents) */}
          {workFilaments.map((work, i) => (
            <group key={work.filamentId} position={[
              i === 0 ? filamentPositions.workAgent1[0] : filamentPositions.workAgent2[0],
              filamentPositions.workAgent1[1],
              filamentPositions.workAgent1[2]
            ]}>
              {work.commits.map((commit, j) => (
                <mesh key={j} position={[0, j * 2, 0]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color={i === 0 ? '#ffaa00' : '#ff6600'} />
                </mesh>
              ))}
              <Text position={[0, -2, 0]} fontSize={0.8} color={i === 0 ? '#ffaa00' : '#ff6600'}>
                {work.agentId}
              </Text>
            </group>
          ))}
          
          {/* Work Cursors */}
          {Object.entries(workCursors).map(([agentId, cursor]) => {
            const workIndex = cursor.workIndex;
            return (
              <mesh key={agentId} position={[
                workIndex === 0 ? filamentPositions.workAgent1[0] : filamentPositions.workAgent2[0],
                cursor.commitIndex * 2,
                0
              ]}>
                <coneGeometry args={[0.6, 1.2, 4]} />
                <meshStandardMaterial 
                  color={workIndex === 0 ? '#ffaa00' : '#ff6600'}
                  emissive={workIndex === 0 ? '#ffaa00' : '#ff6600'}
                  emissiveIntensity={0.8}
                />
              </mesh>
            );
          })}
          
          {/* File Filament */}
          <group position={filamentPositions.file}>
            {fileFilament.commits.map((commit, i) => (
              <mesh key={i} position={[0, i * 2, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#00ff00" />
              </mesh>
            ))}
            <Text position={[0, -2, 0]} fontSize={0.8} color="#00ff00">
              FILE
            </Text>
          </group>
          
          {/* Queue Filament */}
          <group position={filamentPositions.queue}>
            {sortedQueue.map((entry, i) => (
              <mesh key={i} position={[0, i * 2, 0]}>
                <boxGeometry args={[1.5, 1.5, 1.5]} />
                <meshStandardMaterial 
                  color="#00ffff"
                  emissive="#00ffff"
                  emissiveIntensity={0.3}
                />
              </mesh>
            ))}
            <Text position={[0, -2, 0]} fontSize={0.8} color="#00ffff">
              QUEUE
            </Text>
          </group>
          
          {/* Conflict Visualization */}
          {conflictDetected && (
            <group position={filamentPositions.conflict}>
              <mesh>
                <boxGeometry args={[3, 3, 3]} />
                <meshStandardMaterial 
                  color="#ff0000"
                  emissive="#ff0000"
                  emissiveIntensity={0.5}
                  wireframe
                />
              </mesh>
              <Text position={[0, 3.5, 0]} fontSize={0.7} color="#ff0000">
                MERGE BLOCKED
              </Text>
            </group>
          )}
          
          {/* Fork Branches (if resolved) */}
          {step >= 5 && (
            <>
              <group position={[filamentPositions.file[0] - 3, filamentPositions.file[1], filamentPositions.file[2] + 3]}>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#00ff00" />
                </mesh>
                <Text position={[0, -2, 0]} fontSize={0.6} color="#00ff00">
                  FORK A
                </Text>
              </group>
              
              <group position={[filamentPositions.file[0] + 3, filamentPositions.file[1], filamentPositions.file[2] + 3]}>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#00ff00" />
                </mesh>
                <Text position={[0, -2, 0]} fontSize={0.6} color="#00ff00">
                  FORK B
                </Text>
              </group>
            </>
          )}
        </Canvas>
      </div>
      
      {/* Right Panel: Verification */}
      <div style={{
        width: '300px',
        background: '#111',
        padding: '20px',
        overflowY: 'auto',
        borderLeft: '1px solid #333',
      }}>
        <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#00ffff' }}>
            🔍 VERIFICATION
          </div>
          
          {verificationResults && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              background: '#001100',
              border: '1px solid #00ff00',
              borderRadius: '4px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#00ff00', marginBottom: '10px' }}>
                ✅ LOCKS VERIFIED
              </div>
              <div style={{ fontSize: '9px', color: '#00ff00', lineHeight: '1.8' }}>
                ✓ No silent arbitration: {verificationResults.noSilentArbitration ? 'true' : 'false'}
                <br />
                ✓ Deterministic ordering: {verificationResults.deterministicOrdering ? 'true' : 'false'}
                <br />
                ✓ Serialized merge: {verificationResults.serializedMerge ? 'true' : 'false'}
                <br />
                ✓ No auto-resolve: {verificationResults.noAutoResolve ? 'true' : 'false'}
              </div>
            </div>
          )}
          
          <div style={{ fontSize: '10px', color: '#666', marginTop: '20px', lineHeight: '1.6' }}>
            <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
              FORBIDDEN PATTERNS (BLOCKED):
            </div>
            ❌ Last write wins
            <br />
            ❌ Auto-merge / auto-rebase
            <br />
            ❌ Conflict by heuristic
            <br />
            ❌ Queue reorder without evidence
            <br />
            ❌ Merge if not at queue head
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for axis labels
function AxisLabel({ text, position, color }) {
  return (
    <Text
      position={position}
      fontSize={1}
      color={color}
      anchorX="center"
      anchorY="middle"
    >
      {text}
    </Text>
  );
}
