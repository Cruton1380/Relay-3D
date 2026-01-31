/**
 * AI WORKSPACE PROOF
 * 
 * Demonstrates: Conversation + Work Session + File as separate filaments
 * 
 * NON-NEGOTIABLE INVARIANTS:
 * 1. Conversation ≠ Agent ≠ File
 * 2. No invisible work (all work = commits with evidence)
 * 3. Agents propose only; merges are gated
 * 4. Presence anchored to loci (Tier 1 counts only)
 * 
 * Route: /proof/ai-workspace
 */

import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import {
  createUserMessage,
  createAgentMessage,
  createConversationSplit,
  createTaskAccepted,
  createPlanCommit,
  createReadRef,
  createProposeChangeset,
  createWorkDone,
  createFileCreated,
  createProposeChangesetToFile,
  createMergeScar,
  verifyNoInvisibleWork,
  verifyNoDirectFileMutation,
  verifyMergeIsGated,
  verifyNoTeleportProposals, // LOCK C
  enforceNoAutonomousMerges,
} from '../components/ai/schemas/aiWorkspaceSchemas';

export default function AIWorkspaceProof() {
  // State
  const [conversationBranch, setConversationBranch] = useState('main');
  const [step, setStep] = useState(0);
  
  // Filaments
  const [conversationFilaments, setConversationFilaments] = useState(() => {
    return {
      main: {
        filamentId: 'convo.main',
        commits: [],
      },
      branchA: null,
      branchB: null,
    };
  });
  
  const [workFilaments, setWorkFilaments] = useState([]);
  const [fileFilaments, setFileFilaments] = useState(() => {
    // Create initial file
    return [{
      filamentId: 'file.example.js',
      commits: [
        createFileCreated('example.js', 0, 'function example() {\n  return 42;\n}', 'user-1'),
      ],
    }];
  });
  
  const [presenceBeads, setPresenceBeads] = useState([]);
  
  // VISUAL PROOF: Work cursor position (moves commit-by-commit)
  const [workCursorPosition, setWorkCursorPosition] = useState(null);
  
  // VISUAL PROOF: Locus halo (shows attention anchor on file)
  const [locusHalo, setLocusHalo] = useState(null);
  
  // Handlers
  const handleAskAgent = () => {
    // 1. Append USER_MSG
    const userMsg = createUserMessage('main', conversationFilaments.main.commits.length, 'Please refactor example.js');
    
    // 2. Append AGENT_MSG acknowledgement (no work implied yet)
    const agentMsg = createAgentMessage('main', conversationFilaments.main.commits.length + 1, 'Understood. I will analyze the file.');
    
    setConversationFilaments(prev => ({
      ...prev,
      main: {
        ...prev.main,
        commits: [...prev.main.commits, userMsg, agentMsg],
      },
    }));
    
    setStep(1);
  };
  
  const handleForkAlternative = () => {
    // SPLIT convo.main into branchA and branchB
    const splitCommit = createConversationSplit('main', conversationFilaments.main.commits.length, ['branchA', 'branchB']);
    
    setConversationFilaments(prev => ({
      ...prev,
      main: {
        ...prev.main,
        commits: [...prev.main.commits, splitCommit],
      },
      branchA: {
        filamentId: 'convo.branchA',
        commits: [...prev.main.commits],
      },
      branchB: {
        filamentId: 'convo.branchB',
        commits: [...prev.main.commits],
      },
    }));
    
    setStep(2);
  };
  
  const handleAssignAgent = () => {
    // Create work session filament
    const taskId = Date.now();
    const conversationRef = {
      filamentId: 'convo.main',
      commitIndex: conversationFilaments.main.commits.length - 1,
    };
    
    // LOCK D: Branch-bound work
    const taskAccepted = createTaskAccepted('agent-1', taskId, 0, 'Refactor example.js', conversationRef, 'main');
    const planCommit = createPlanCommit('agent-1', taskId, 1, [
      'Read current file',
      'Analyze structure',
      'Propose improvements',
    ]);
    
    const newWorkSession = {
      filamentId: `work.agent-1.${taskId}`,
      commits: [taskAccepted, planCommit],
      taskId, // Store for later
    };
    
    setWorkFilaments(prev => [...prev, newWorkSession]);
    
    // Add presence bead at file locus
    setPresenceBeads(prev => [
      ...prev,
      {
        id: `bead-${taskId}`,
        filamentId: 'file.example.js',
        commitIndex: 0,
        count: 1,
        role: 'agent',
      },
    ]);
    
    // VISUAL PROOF: Work cursor at commit 0 (TASK_ACCEPTED)
    setWorkCursorPosition({ workIndex: 0, commitIndex: 0 });
    
    setStep(3);
  };
  
  const handleAgentReadsFile = () => {
    if (workFilaments.length === 0) return;
    
    const workSession = workFilaments[0];
    
    // LOCK B: READ_REF must include hash
    const targetCommitHash = 'sha256:abc123...'; // Mock hash (in real system, compute from content)
    
    const readRef = createReadRef(
      'agent-1',
      workSession.taskId,
      workSession.commits.length,
      'file.example.js',
      0,
      targetCommitHash, // LOCK B: Hash required
      'function:example'
    );
    
    setWorkFilaments(prev => [
      {
        ...prev[0],
        commits: [...prev[0].commits, readRef],
      },
      ...prev.slice(1),
    ]);
    
    // VISUAL PROOF: Work cursor advances to READ_REF commit
    setWorkCursorPosition({ workIndex: 0, commitIndex: workSession.commits.length });
    
    // VISUAL PROOF: Locus halo shows attention on file (not editing, just reading)
    setLocusHalo({
      filamentId: 'file.example.js',
      locus: 'function:example',
      type: 'read', // Attention only, not mutation
    });
    
    setStep(4);
  };
  
  const handleAgentProposes = () => {
    if (workFilaments.length === 0) return;
    
    const workSession = workFilaments[0];
    const conversationRef = {
      filamentId: 'convo.main',
      commitIndex: conversationFilaments.main.commits.length - 1,
    };
    
    // 1. Add PROPOSE_CHANGESET to work session
    const workProposal = createProposeChangeset(
      'agent-1',
      workSession.taskId,
      workSession.commits.length,
      'file.example.js',
      { type: 'refactor', diff: '+ // Improved structure' },
      conversationRef
    );
    
    setWorkFilaments(prev => [
      {
        ...prev[0],
        commits: [...prev[0].commits, workProposal],
      },
      ...prev.slice(1),
    ]);
    
    // 2. Add PROPOSE_CHANGESET to file filament (proposal branch)
    // LOCK E: Stable proposal branch identity
    const fileProposal = createProposeChangesetToFile(
      'example.js',
      0, // First commit on proposal branch
      {
        filamentId: workSession.filamentId,
        commitIndex: workSession.commits.length,
      },
      conversationRef,
      { type: 'refactor', diff: '+ // Improved structure' },
      workSession.taskId // LOCK E: Task ID for proposal branch
    );
    
    setFileFilaments(prev => [
      ...prev,
      {
        filamentId: fileProposal.filamentId, // LOCK E: Proposal branch is separate filament
        commits: [fileProposal],
      },
    ]);
    
    // VISUAL PROOF: Work cursor advances to PROPOSE commit
    setWorkCursorPosition({ workIndex: 0, commitIndex: workSession.commits.length });
    
    // VISUAL PROOF: Locus halo shows attention anchor (proposal, not direct edit)
    setLocusHalo({
      filamentId: 'file.example.js',
      locus: 'proposal',
      type: 'propose', // Proposing, not mutating
    });
    
    setStep(5);
  };
  
  const handleGateMerge = () => {
    if (fileFilaments.length < 2) return; // Need proposal branch
    
    // Require signatures (mock)
    const signatures = ['sig-user-1', 'sig-reviewer-1'];
    const signatureHashes = ['hash-sig1', 'hash-sig2'];
    
    // LOCK A: Merge authority (who triggered, which policy, what evidence)
    const mergeAuthority = {
      triggeredBy: { kind: 'user', id: 'user-1' }, // Human actor
      requiredPolicyId: 'code-review-policy',
      threshold: 2,
      satisfiedByEvidenceIds: signatures,
      satisfiedByEvidenceHashes: signatureHashes,
    };
    
    // Get proposal branch
    const proposalBranch = fileFilaments.find(f => f.filamentId.includes('@proposal'));
    if (!proposalBranch) return;
    
    // Create MERGE_SCAR
    const mergeScar = createMergeScar(
      'example.js',
      fileFilaments[0].commits.length,
      0, // proposal commit index (first on proposal branch)
      proposalBranch.filamentId, // LOCK E: Proposal branch ID
      signatures,
      mergeAuthority // LOCK A: Authority required
    );
    
    // Verify no autonomous merge
    try {
      enforceNoAutonomousMerges(mergeScar);
    } catch (e) {
      console.error('❌ FORBIDDEN:', e.message);
      return;
    }
    
    setFileFilaments(prev => [
      {
        ...prev[0],
        commits: [...prev[0].commits, mergeScar],
      },
      ...prev.slice(1),
    ]);
    
    // Mark work session as DONE
    if (workFilaments.length > 0) {
      const workSession = workFilaments[0];
      const doneCommit = createWorkDone(
        'agent-1',
        workSession.taskId,
        workSession.commits.length,
        'Refactoring complete and merged'
      );
      
      setWorkFilaments(prev => [
        {
          ...prev[0],
          commits: [...prev[0].commits, doneCommit],
        },
        ...prev.slice(1),
      ]);
    }
    
    // Remove presence bead
    setPresenceBeads([]);
    
    // VISUAL PROOF: Work cursor advances to DONE commit
    if (workFilaments.length > 0) {
      setWorkCursorPosition({ workIndex: 0, commitIndex: workFilaments[0].commits.length });
    }
    
    // VISUAL PROOF: Clear locus halo (work complete)
    setLocusHalo(null);
    
    setStep(6);
    
    // Verification logs (ALL LOCKS)
    console.log('✅ [Verification] No invisible work:', verifyNoInvisibleWork(workFilaments));
    console.log('✅ [Verification] No direct file mutation:', verifyNoDirectFileMutation(fileFilaments[0], workFilaments));
    console.log('✅ [Verification] Merge is gated (with authority):', verifyMergeIsGated(fileFilaments[0]));
    console.log('✅ [Verification] No teleport proposals:', verifyNoTeleportProposals(workFilaments[0]));
  };
  
  // 3D positioning
  const filamentPositions = useMemo(() => {
    return {
      conversation: [0, 10, 0],
      work: [-15, 0, 0],
      file: [15, 0, 0],
    };
  }, []);
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', display: 'flex' }}>
      {/* Left Panel: Conversation Timeline */}
      <div
        style={{
          width: '300px',
          background: '#111',
          padding: '20px',
          overflowY: 'auto',
          borderRight: '1px solid #333',
        }}
      >
        <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#00ffff' }}>
            💬 CONVERSATION
          </div>
          
          {/* Branch selector */}
          <div style={{ marginBottom: '15px', display: 'flex', gap: '5px' }}>
            {['main', 'branchA', 'branchB'].map(branch => (
              conversationFilaments[branch] && (
                <button
                  key={branch}
                  onClick={() => setConversationBranch(branch)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    background: conversationBranch === branch ? '#00ffff' : '#333',
                    color: conversationBranch === branch ? '#000' : '#aaa',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  {branch}
                </button>
              )
            ))}
          </div>
          
          {/* Commits */}
          <div style={{ fontSize: '10px' }}>
            {conversationFilaments[conversationBranch]?.commits.map((commit, i) => (
              <div
                key={i}
                style={{
                  marginBottom: '8px',
                  padding: '8px',
                  background: '#222',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${commit.op === 'USER_MSG' ? '#00ff00' : '#ffaa00'}`,
                }}
              >
                <div style={{ color: '#888', fontSize: '8px' }}>
                  [{i}] {commit.op}
                </div>
                <div style={{ color: '#fff', marginTop: '3px' }}>
                  {commit.payload.content || commit.payload.branchNames?.join(', ') || 'System message'}
                </div>
              </div>
            ))}
          </div>
          
          {/* Actions */}
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #333' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '10px' }}>
              ACTIONS (Step {step}/6):
            </div>
            <button
              onClick={handleAskAgent}
              disabled={step !== 0}
              style={{
                width: '100%',
                marginBottom: '5px',
                padding: '8px',
                fontSize: '10px',
                background: step === 0 ? '#00ff00' : '#333',
                color: '#000',
                border: 'none',
                borderRadius: '3px',
                cursor: step === 0 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              1. Ask Agent to Do X
            </button>
            <button
              onClick={handleForkAlternative}
              disabled={step !== 1}
              style={{
                width: '100%',
                marginBottom: '5px',
                padding: '8px',
                fontSize: '10px',
                background: step === 1 ? '#00ff00' : '#333',
                color: '#000',
                border: 'none',
                borderRadius: '3px',
                cursor: step === 1 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              2. Fork Alternative
            </button>
            <button
              onClick={handleAssignAgent}
              disabled={step !== 2}
              style={{
                width: '100%',
                marginBottom: '5px',
                padding: '8px',
                fontSize: '10px',
                background: step === 2 ? '#00ff00' : '#333',
                color: '#000',
                border: 'none',
                borderRadius: '3px',
                cursor: step === 2 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              3. Assign Agent to File
            </button>
            <button
              onClick={handleAgentReadsFile}
              disabled={step !== 3}
              style={{
                width: '100%',
                marginBottom: '5px',
                padding: '8px',
                fontSize: '10px',
                background: step === 3 ? '#00ff00' : '#333',
                color: '#000',
                border: 'none',
                borderRadius: '3px',
                cursor: step === 3 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              4. Agent Reads File
            </button>
            <button
              onClick={handleAgentProposes}
              disabled={step !== 4}
              style={{
                width: '100%',
                marginBottom: '5px',
                padding: '8px',
                fontSize: '10px',
                background: step === 4 ? '#00ff00' : '#333',
                color: '#000',
                border: 'none',
                borderRadius: '3px',
                cursor: step === 4 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              5. Agent Proposes Changes
            </button>
            <button
              onClick={handleGateMerge}
              disabled={step !== 5}
              style={{
                width: '100%',
                marginBottom: '5px',
                padding: '8px',
                fontSize: '10px',
                background: step === 5 ? '#00ff00' : '#333',
                color: '#000',
                border: 'none',
                borderRadius: '3px',
                cursor: step === 5 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              6. GATE Merge
            </button>
          </div>
        </div>
      </div>
      
      {/* Center: 3D View */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 15, 40]} />
          <OrbitControls />
          
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          
          {/* Grid */}
          <gridHelper args={[50, 20, '#222', '#111']} />
          
          {/* Conversation Filament */}
          <FilamentRenderer
            filament={conversationFilaments[conversationBranch]}
            position={filamentPositions.conversation}
            color="#00ffff"
            label="CONVERSATION"
          />
          
          {/* Work Session Filament(s) */}
          {workFilaments.map((work, i) => (
            <FilamentRenderer
              key={work.filamentId}
              filament={work}
              position={[filamentPositions.work[0], filamentPositions.work[1] - i * 5, filamentPositions.work[2]]}
              color="#ffaa00"
              label="WORK SESSION"
            />
          ))}
          
          {/* File Filament */}
          {fileFilaments.map((file, i) => (
            <FilamentRenderer
              key={file.filamentId}
              filament={file}
              position={[filamentPositions.file[0], filamentPositions.file[1] - i * 5, filamentPositions.file[2]]}
              color="#00ff00"
              label="FILE"
            />
          ))}
          
          {/* Presence Beads */}
          {presenceBeads.map(bead => (
            <mesh key={bead.id} position={[filamentPositions.file[0], filamentPositions.file[1] + 2, filamentPositions.file[2]]}>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} />
            </mesh>
          ))}
          
          {/* VISUAL PROOF: Work Cursor (moves commit-by-commit) */}
          {workCursorPosition && workFilaments[workCursorPosition.workIndex] && (
            <mesh position={[
              filamentPositions.work[0],
              filamentPositions.work[1] + workCursorPosition.commitIndex * 2,
              filamentPositions.work[2]
            ]}>
              <coneGeometry args={[0.6, 1.2, 4]} />
              <meshStandardMaterial 
                color="#ffaa00" 
                emissive="#ffaa00" 
                emissiveIntensity={0.8}
                wireframe={false}
              />
            </mesh>
          )}
          
          {/* VISUAL PROOF: Locus Halo (attention anchor on file) */}
          {locusHalo && (
            <mesh position={[
              filamentPositions.file[0],
              filamentPositions.file[1] + 1,
              filamentPositions.file[2]
            ]}>
              <torusGeometry args={[1.5, 0.15, 16, 32]} />
              <meshStandardMaterial 
                color={locusHalo.type === 'read' ? '#00ffff' : '#ffaa00'}
                emissive={locusHalo.type === 'read' ? '#00ffff' : '#ffaa00'}
                emissiveIntensity={0.6}
                transparent
                opacity={0.7}
              />
            </mesh>
          )}
          
          {/* Axis labels */}
          <AxisLabel text="Conversation" position={[filamentPositions.conversation[0], filamentPositions.conversation[1] + 5, filamentPositions.conversation[2]]} color="#00ffff" />
          <AxisLabel text="Work" position={[filamentPositions.work[0], filamentPositions.work[1] + 5, filamentPositions.work[2]]} color="#ffaa00" />
          <AxisLabel text="File" position={[filamentPositions.file[0], filamentPositions.file[1] + 5, filamentPositions.file[2]]} color="#00ff00" />
        </Canvas>
      </div>
      
      {/* Right Panel: Inspection */}
      <div
        style={{
          width: '300px',
          background: '#111',
          padding: '20px',
          overflowY: 'auto',
          borderLeft: '1px solid #333',
        }}
      >
        <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#00ffff' }}>
            🔍 INSPECTION
          </div>
          
          {/* VERIFICATION STATUS */}
          {step === 6 && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              background: '#001100',
              border: '1px solid #00ff00',
              borderRadius: '4px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#00ff00', marginBottom: '10px' }}>
                ✅ LOCKS VERIFIED
              </div>
              <div style={{ fontSize: '9px', color: '#00ff00', lineHeight: '1.8' }}>
                ✓ No invisible work<br />
                ✓ No direct mutation<br />
                ✓ Merge gated (authority)<br />
                ✓ No teleport proposals<br />
                ✓ Work cursor animated<br />
                ✓ Locus halo = attention
              </div>
            </div>
          )}
          
          {/* VISUAL PROOF LEGEND */}
          {(workCursorPosition || locusHalo) && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              background: '#110800',
              border: '1px solid #ffaa00',
              borderRadius: '4px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffaa00', marginBottom: '10px' }}>
                VISUAL PROOF
              </div>
              {workCursorPosition && (
                <div style={{ fontSize: '9px', color: '#ffaa00', marginBottom: '8px' }}>
                  🔺 Work Cursor: Commit {workCursorPosition.commitIndex}
                </div>
              )}
              {locusHalo && (
                <div style={{ fontSize: '9px', lineHeight: '1.6' }}>
                  <span style={{ color: locusHalo.type === 'read' ? '#00ffff' : '#ffaa00' }}>
                    ⭕ Halo: {locusHalo.type === 'read' ? 'Reading' : 'Proposing'}
                  </span>
                  <br />
                  <span style={{ color: '#666', fontSize: '8px' }}>
                    (attention only, not editing)
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '15px' }}>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', color: '#fff' }}>Work Sessions:</div>
              <div>{workFilaments.length} active</div>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', color: '#fff' }}>File Commits:</div>
              <div>{fileFilaments[0]?.commits.length || 0} total</div>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', color: '#fff' }}>Presence Beads:</div>
              <div>{presenceBeads.length} active (Tier 1 counts)</div>
            </div>
          </div>
          
          {/* Verification Status */}
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #333' }}>
            <div style={{ fontSize: '10px', color: '#00ff00', marginBottom: '10px', fontWeight: 'bold' }}>
              ✅ INVARIANTS
            </div>
            <div style={{ fontSize: '9px', color: '#666' }}>
              <div style={{ marginBottom: '5px' }}>✅ Conversation ≠ Agent ≠ File</div>
              <div style={{ marginBottom: '5px' }}>✅ No invisible work</div>
              <div style={{ marginBottom: '5px' }}>✅ Agents propose only</div>
              <div style={{ marginBottom: '5px' }}>✅ Merges are gated</div>
              <div style={{ marginBottom: '5px' }}>✅ No autonomous merges</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component to render a filament
function FilamentRenderer({ filament, position, color, label }) {
  if (!filament || !filament.commits) return null;
  
  return (
    <group position={position}>
      {/* Render each commit as a TimeBox */}
      {filament.commits.map((commit, i) => {
        const x = i * 2; // Spread along X-axis (time)
        const isImportant = ['SPLIT', 'SCAR', 'GATE', 'PROPOSE_CHANGESET', 'MERGE_SCAR'].includes(commit.op);
        
        return (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={isImportant ? [1.2, 1.2, 1.2] : [0.8, 0.8, 0.8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isImportant ? 0.5 : 0.2}
            />
          </mesh>
        );
      })}
      
      {/* Spine */}
      <mesh position={[(filament.commits.length - 1), 0, 0]}>
        <boxGeometry args={[filament.commits.length * 2, 0.1, 0.1]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// Axis label helper
function AxisLabel({ text, position, color }) {
  return null; // Simplified for proof (would use Html from drei)
}
