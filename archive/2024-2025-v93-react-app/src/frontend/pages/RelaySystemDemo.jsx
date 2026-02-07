/**
 * RELAY SYSTEM DEMO
 * 
 * Complete coordination physics system demonstration.
 * 
 * Shows ALL modules integrated:
 * 1. AI Workspace (conversation/work/file filaments)
 * 2. Agent Concurrency (merge queue + conflict resolution)
 * 3. Resource Scheduling (request/grant/release)
 * 4. Authority Delegation (delegation chains)
 * 5. File Loader (universal import)
 * 6. 3D Coordination Graph (all filaments + edges)
 * 
 * Route: /relay-system-demo
 */

import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Grid, Line, Text, Sphere, Box } from '@react-three/drei';
import { CoordinationGraph, Filament, Commit } from '../components/coordination/model/coordinationGraphModel';
import FileDropZone from '../components/coordination/loader/FileDropZone';

// Import schemas
import {
  createUserMessage,
  createAgentMessage,
  createTaskAccepted,
  createReadRef,
  createProposeChangeset,
  createFileCreated,
  createMergeScar,
  verifyNoInvisibleWork,
  verifyMergeIsGated,
  verifyNoTeleportProposals,
} from '../components/ai/schemas/aiWorkspaceSchemas';

import {
  createQueueEnqueue,
  createQueueReorder,
  createConflictDetected,
  createConflictResolvedByFork,
  verifyNoAutoResolve,
  verifyOperation,
} from '../components/ai/schemas/mergeQueueSchemas';

import {
  createResourceCreated,
  createRequest,
  createGrant,
  createRelease,
  verifyPolicyProof,
} from '../components/ai/schemas/resourceSchedulingSchemas';

import {
  createAuthorityScopeDefined,
  createDelegateAuthority,
  createAuthorityRef,
  verifyAuthority,
  Capability,
} from '../components/ai/schemas/authorityDelegationSchemas';

export default function RelaySystemDemo() {
  console.log('🔴🔴🔴 RELAY SYSTEM DEMO IS RENDERING NOW 🔴🔴🔴');
  console.log('🔴🔴🔴 THIS IS THE NEW UNIFIED SYSTEM 🔴🔴🔴');
  
  // DOM MARKER - VISIBLE PROOF
  const MOUNTED_MARKER = (
    <div style={{position:'fixed',top:0,left:0,zIndex:999999,background:'#ff0000',color:'#ffffff',padding:'12px 24px',fontWeight:800,fontSize:'20px',border:'4px solid #fff'}}>
      🔴 RELAY_SYSTEM_DEMO_MOUNTED 🔴
    </div>
  );
  
  // State
  const [selectedModule, setSelectedModule] = useState('overview');
  const [selectedFilament, setSelectedFilament] = useState(null);
  const [showFileImport, setShowFileImport] = useState(false);
  const [importedFiles, setImportedFiles] = useState([]);
  const [systemState, setSystemState] = useState(() => initializeSystem());
  const [verificationResults, setVerificationResults] = useState({});
  const [animationStep, setAnimationStep] = useState(0);
  
  // Build coordination graph from system state
  const graph = useMemo(() => {
    const g = new CoordinationGraph();
    
    // Add all filaments
    Object.values(systemState.filaments).forEach(filament => {
      g.addFilament(filament);
    });
    
    return g;
  }, [systemState]);
  
  // Get stats
  const stats = useMemo(() => graph.getStats(), [graph]);
  
  // Run all verifications
  const runVerifications = () => {
    const results = {
      aiWorkspace: {
        noInvisibleWork: verifyNoInvisibleWork(systemState.filaments.work),
        mergeIsGated: verifyMergeIsGated(systemState.filaments.file),
        noTeleport: verifyNoTeleportProposals(systemState.filaments.work),
      },
      mergeQueue: {
        noAutoResolve: verifyNoAutoResolve(systemState.filaments.conflict),
      },
      resourceScheduling: {
        policyProof: systemState.filaments.resource.commits.filter(c => c.op === 'GRANT').map(grant => 
          verifyPolicyProof(systemState.filaments.resource, grant, grant.commitIndex)
        ),
      },
    };
    
    setVerificationResults(results);
    return results;
  };
  
  // Handle file import
  const handleFilesImported = (results, stats) => {
    setImportedFiles(prev => [...prev, ...results]);
    
    // Add evidence filaments to system
    const newFilaments = {};
    results.forEach(result => {
      if (result.evidenceFilament) {
        newFilaments[result.evidenceFilament.filamentId] = result.evidenceFilament;
      }
      if (result.fileFilament) {
        newFilaments[result.fileFilament.filamentId] = result.fileFilament;
      }
    });
    
    setSystemState(prev => ({
      ...prev,
      filaments: {
        ...prev.filaments,
        ...newFilaments,
      },
    }));
    
    setShowFileImport(false);
  };
  
  // Trigger demo scenario
  const triggerScenario = (scenario) => {
    console.log('[Demo] Triggering scenario:', scenario);
    
    switch (scenario) {
      case 'agent-concurrency':
        // Simulate two agents proposing to same file
        simulateAgentConcurrency();
        break;
        
      case 'resource-contention':
        // Simulate resource allocation
        simulateResourceContention();
        break;
        
      case 'authority-delegation':
        // Show delegation chain
        simulateAuthorityDelegation();
        break;
        
      default:
        break;
    }
    
    // Run verifications after scenario
    setTimeout(() => runVerifications(), 100);
  };
  
  const simulateAgentConcurrency = () => {
    // Implementation would add commits to show concurrency
    console.log('[Demo] Simulating agent concurrency...');
  };
  
  const simulateResourceContention = () => {
    console.log('[Demo] Simulating resource contention...');
  };
  
  const simulateAuthorityDelegation = () => {
    console.log('[Demo] Simulating authority delegation...');
  };
  
  return (
    <>
      {MOUNTED_MARKER}
      <div style={{ display: 'flex', height: '100vh', background: '#0A0E1A', color: '#E8E8E8', fontFamily: 'monospace' }}>
        
        {/* LEFT PANEL: MODULE SELECTOR + STATS */}
      <div style={{ width: '280px', borderRight: '1px solid #2A2E3A', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #2A2E3A' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#F8E71C' }}>
            RELAY SYSTEM
          </h1>
          <p style={{ margin: 0, fontSize: '11px', color: '#9B9B9B' }}>
            Coordination Physics • All Modules
          </p>
        </div>
        
        {/* System Stats */}
        <div style={{ padding: '16px', borderBottom: '1px solid #2A2E3A', background: '#1A1E2A' }}>
          <div style={{ fontSize: '10px', color: '#6B6B6B', marginBottom: '8px' }}>SYSTEM STATS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
            <div>
              <div style={{ color: '#9B9B9B' }}>Filaments</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#4A90E2' }}>{stats.filamentCount}</div>
            </div>
            <div>
              <div style={{ color: '#9B9B9B' }}>Commits</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#7ED321' }}>{stats.commitCount}</div>
            </div>
            <div>
              <div style={{ color: '#9B9B9B' }}>Edges</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#F8E71C' }}>{stats.edgeCount}</div>
            </div>
            <div>
              <div style={{ color: '#9B9B9B' }}>Files</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#BD10E0' }}>{importedFiles.length}</div>
            </div>
          </div>
        </div>
        
        {/* Module Selector */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '12px 16px', fontSize: '10px', color: '#6B6B6B', fontWeight: 600 }}>
            MODULES
          </div>
          
          {[
            { id: 'overview', name: 'System Overview', icon: '🌐', color: '#F8E71C' },
            { id: 'ai-workspace', name: 'AI Workspace', icon: '🤖', color: '#4A90E2' },
            { id: 'agent-concurrency', name: 'Agent Concurrency', icon: '⚡', color: '#BD10E0' },
            { id: 'resource-scheduling', name: 'Resource Scheduling', icon: '⚙️', color: '#50E3C2' },
            { id: 'authority-delegation', name: 'Authority Delegation', icon: '🔑', color: '#F8E71C' },
            { id: 'file-loader', name: 'File Loader', icon: '📁', color: '#7ED321' },
            { id: 'coordination-graph', name: '3D Graph Explorer', icon: '🔮', color: '#F5A623' },
          ].map(module => (
            <div
              key={module.id}
              onClick={() => setSelectedModule(module.id)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #1A1E2A',
                cursor: 'pointer',
                background: selectedModule === module.id ? '#2A2E3A' : 'transparent',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '20px' }}>{module.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: module.color }}>
                  {module.name}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Actions */}
        <div style={{ padding: '16px', borderTop: '1px solid #2A2E3A' }}>
          <button
            onClick={() => setShowFileImport(true)}
            style={{
              width: '100%',
              padding: '10px',
              background: '#4A90E2',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '8px',
            }}
          >
            📁 Import Files
          </button>
          
          <button
            onClick={runVerifications}
            style={{
              width: '100%',
              padding: '10px',
              background: '#7ED321',
              border: 'none',
              borderRadius: '6px',
              color: '#000000',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ✓ Run Verifications
          </button>
        </div>
      </div>
      
      {/* CENTER PANEL: 3D VISUALIZATION */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* Module Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #2A2E3A', background: '#1A1E2A' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700 }}>
            {selectedModule === 'overview' && '🌐 System Overview'}
            {selectedModule === 'ai-workspace' && '🤖 AI Workspace'}
            {selectedModule === 'agent-concurrency' && '⚡ Agent Concurrency'}
            {selectedModule === 'resource-scheduling' && '⚙️ Resource Scheduling'}
            {selectedModule === 'authority-delegation' && '🔑 Authority Delegation'}
            {selectedModule === 'file-loader' && '📁 File Loader'}
            {selectedModule === 'coordination-graph' && '🔮 3D Coordination Graph'}
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#9B9B9B' }}>
            {selectedModule === 'overview' && 'All coordination physics modules visualized'}
            {selectedModule === 'ai-workspace' && '5 locks: No invisible work, gated merges, no teleport proposals'}
            {selectedModule === 'agent-concurrency' && 'Merge queue + conflict resolution with explicit forks'}
            {selectedModule === 'resource-scheduling' && 'Request/Grant/Release with policy proofs'}
            {selectedModule === 'authority-delegation' && 'Delegation chains with capability verification'}
            {selectedModule === 'file-loader' && 'Universal import: never rejects, deterministic hashing'}
            {selectedModule === 'coordination-graph' && 'Filaments as spacetime diagram with causal edges'}
          </p>
        </div>
        
        {/* 3D Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Canvas>
            <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
            <OrbitControls enableDamping dampingFactor={0.05} />
            
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.4} />
            
            {/* Grid */}
            <Grid args={[30, 30]} cellColor="#2A2E3A" sectionColor="#4A4E5A" />
            
            {/* Axes */}
            <Line points={[[0, 0, 0], [8, 0, 0]]} color="#F8E71C" lineWidth={2} />
            <Line points={[[0, 0, 0], [0, 8, 0]]} color="#F8E71C" lineWidth={2} />
            <Line points={[[0, 0, 0], [0, 0, 8]]} color="#F8E71C" lineWidth={2} />
            
            {/* Render all filaments */}
            {Array.from(graph.filaments.values()).map((filament, i) => {
              // Layout: circular arrangement by filament kind
              const kindIndex = Object.keys(stats.filamentsByKind).indexOf(filament.kind);
              const totalKinds = Object.keys(stats.filamentsByKind).length;
              const angle = (kindIndex / totalKinds) * Math.PI * 2;
              const radius = 8;
              
              const position = [
                Math.cos(angle) * radius,
                i * 0.3,
                Math.sin(angle) * radius,
              ];
              
              return (
                <group key={filament.filamentId} position={position}>
                  <Sphere
                    args={[0.4, 16, 16]}
                    onClick={() => setSelectedFilament(filament.filamentId)}
                  >
                    <meshStandardMaterial
                      color={Filament.getColor(filament.kind)}
                      emissive={selectedFilament === filament.filamentId ? Filament.getColor(filament.kind) : '#000000'}
                      emissiveIntensity={selectedFilament === filament.filamentId ? 0.5 : 0}
                    />
                  </Sphere>
                  
                  <Text
                    position={[0, -0.8, 0]}
                    fontSize={0.15}
                    color="#9B9B9B"
                    anchorX="center"
                    anchorY="top"
                  >
                    {filament.kind}
                  </Text>
                  
                  <Text
                    position={[0, -1.1, 0]}
                    fontSize={0.12}
                    color="#6B6B6B"
                    anchorX="center"
                    anchorY="top"
                  >
                    {filament.commits.length} commits
                  </Text>
                </group>
              );
            })}
            
            {/* Render edges */}
            {graph.getAllEdges().map((edge, i) => {
              const fromFilament = graph.getFilament(edge.from.filamentId);
              const toFilament = graph.getFilament(edge.to.filamentId);
              
              if (!fromFilament || !toFilament) return null;
              
              const fromKindIndex = Object.keys(stats.filamentsByKind).indexOf(fromFilament.kind);
              const toKindIndex = Object.keys(stats.filamentsByKind).indexOf(toFilament.kind);
              const totalKinds = Object.keys(stats.filamentsByKind).length;
              
              const fromAngle = (fromKindIndex / totalKinds) * Math.PI * 2;
              const toAngle = (toKindIndex / totalKinds) * Math.PI * 2;
              const radius = 8;
              
              const fromPos = [
                Math.cos(fromAngle) * radius,
                Array.from(graph.filaments.values()).indexOf(fromFilament) * 0.3,
                Math.sin(fromAngle) * radius,
              ];
              
              const toPos = [
                Math.cos(toAngle) * radius,
                Array.from(graph.filaments.values()).indexOf(toFilament) * 0.3,
                Math.sin(toAngle) * radius,
              ];
              
              return (
                <Line
                  key={`edge-${i}`}
                  points={[fromPos, toPos]}
                  color={edge.getColor()}
                  lineWidth={1}
                  opacity={0.4}
                  transparent
                />
              );
            })}
          </Canvas>
          
          {/* Overlay: Demo Scenarios */}
          {selectedModule !== 'overview' && (
            <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(26, 30, 42, 0.95)', padding: '16px', borderRadius: '8px', border: '1px solid #2A2E3A', minWidth: '200px' }}>
              <div style={{ fontSize: '11px', color: '#9B9B9B', marginBottom: '12px', fontWeight: 600 }}>
                DEMO SCENARIOS
              </div>
              
              {selectedModule === 'agent-concurrency' && (
                <button
                  onClick={() => triggerScenario('agent-concurrency')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#BD10E0',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    cursor: 'pointer',
                    marginBottom: '8px',
                  }}
                >
                  ⚡ 2 Agents, 1 File
                </button>
              )}
              
              {selectedModule === 'resource-scheduling' && (
                <button
                  onClick={() => triggerScenario('resource-contention')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#50E3C2',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#000000',
                    fontSize: '11px',
                    cursor: 'pointer',
                    marginBottom: '8px',
                  }}
                >
                  ⚙️ Resource Contention
                </button>
              )}
              
              {selectedModule === 'authority-delegation' && (
                <button
                  onClick={() => triggerScenario('authority-delegation')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#F8E71C',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#000000',
                    fontSize: '11px',
                    cursor: 'pointer',
                    marginBottom: '8px',
                  }}
                >
                  🔑 Show Delegation Chain
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* RIGHT PANEL: MODULE DETAILS + VERIFICATION */}
      <div style={{ width: '380px', borderLeft: '1px solid #2A2E3A', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #2A2E3A' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
            {selectedFilament ? 'FILAMENT INSPECTOR' : 'VERIFICATION RESULTS'}
          </h3>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {!selectedFilament && Object.keys(verificationResults).length > 0 && (
            <div>
              {/* AI Workspace Verifications */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#4A90E2', fontWeight: 600, marginBottom: '8px' }}>
                  🤖 AI WORKSPACE
                </div>
                
                <VerificationBadge
                  label="No Invisible Work"
                  passed={verificationResults.aiWorkspace?.noInvisibleWork}
                />
                <VerificationBadge
                  label="Merge Is Gated"
                  passed={verificationResults.aiWorkspace?.mergeIsGated}
                />
                <VerificationBadge
                  label="No Teleport Proposals"
                  passed={verificationResults.aiWorkspace?.noTeleport}
                />
              </div>
              
              {/* Merge Queue Verifications */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#BD10E0', fontWeight: 600, marginBottom: '8px' }}>
                  ⚡ MERGE QUEUE
                </div>
                
                <VerificationBadge
                  label="No Auto-Resolve"
                  passed={verificationResults.mergeQueue?.noAutoResolve}
                />
              </div>
              
              {/* Resource Scheduling Verifications */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#50E3C2', fontWeight: 600, marginBottom: '8px' }}>
                  ⚙️ RESOURCE SCHEDULING
                </div>
                
                {verificationResults.resourceScheduling?.policyProof?.map((result, i) => (
                  <VerificationBadge
                    key={i}
                    label={`Policy Proof ${i + 1}`}
                    passed={result}
                  />
                ))}
              </div>
            </div>
          )}
          
          {!selectedFilament && Object.keys(verificationResults).length === 0 && (
            <div style={{ fontSize: '12px', color: '#6B6B6B', textAlign: 'center', marginTop: '40px' }}>
              Click "Run Verifications" to check all invariants
            </div>
          )}
          
          {selectedFilament && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: Filament.getColor(graph.getFilament(selectedFilament)?.kind), marginBottom: '16px' }}>
                {selectedFilament}
              </div>
              
              <div style={{ fontSize: '10px', color: '#6B6B6B', marginBottom: '8px' }}>COMMITS</div>
              {graph.getFilament(selectedFilament)?.commits.map(commit => (
                <div
                  key={commit.commitIndex}
                  style={{
                    padding: '10px',
                    background: '#1A1E2A',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    border: commit.authorityRef ? '1px solid #F8E71C' : '1px solid transparent',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                    {commit.op}
                    {commit.authorityRef && <span style={{ marginLeft: '8px', color: '#F8E71C' }}>🔒</span>}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6B6B6B' }}>
                    Commit {commit.commitIndex} • {commit.tLevel}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* FILE IMPORT MODAL */}
      {showFileImport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowFileImport(false)}
        >
          <div
            style={{
              width: '700px',
              height: '500px',
              background: '#1A1E2A',
              borderRadius: '12px',
              border: '2px solid #4A90E2',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 700 }}>
                📁 Universal File Loader
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#9B9B9B', lineHeight: 1.6 }}>
                Drag & drop <strong>any file</strong>. Excel/code files get semantic extraction.
                Unknown types become evidence objects. <strong>No file is ever rejected.</strong>
              </p>
            </div>
            
            <div style={{ flex: 1 }}>
              <FileDropZone onFilesImported={handleFilesImported} />
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: '#9B9B9B' }}>
                {importedFiles.length > 0 && (
                  <>✓ Imported: {importedFiles.length} files</>
                )}
              </div>
              
              <button
                onClick={() => setShowFileImport(false)}
                style={{
                  padding: '10px 20px',
                  background: '#2A2E3A',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#E8E8E8',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
    </>
  );
}

// Helper component: Verification Badge
function VerificationBadge({ label, passed }) {
  return (
    <div
      style={{
        padding: '8px 12px',
        background: passed ? 'rgba(126, 211, 33, 0.1)' : 'rgba(208, 2, 27, 0.1)',
        border: `1px solid ${passed ? '#7ED321' : '#D0021B'}`,
        borderRadius: '4px',
        marginBottom: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div style={{ fontSize: '14px' }}>
        {passed ? '✓' : '✗'}
      </div>
      <div style={{ flex: 1, fontSize: '11px', fontWeight: 600, color: passed ? '#7ED321' : '#D0021B' }}>
        {label}
      </div>
    </div>
  );
}

// Initialize system with all modules
function initializeSystem() {
  const now = Date.now();
  
  // Create authority root
  const authorityRoot = new Filament('authority.org.relay', 'authority', [
    new Commit({
      filamentId: 'authority.org.relay',
      commitIndex: 0,
      ts: now - 100000,
      actor: { kind: 'system', id: 'authority-manager' },
      op: 'AUTHORITY_SCOPE_DEFINED',
      locus: null,
      refs: { inputs: [], evidence: [] },
      payload: {
        scopeId: 'org.relay',
        scopeType: 'org',
        description: 'Relay organization authority',
      },
      tLevel: 'T3',
    }),
    new Commit({
      filamentId: 'authority.org.relay',
      commitIndex: 1,
      ts: now - 90000,
      actor: { kind: 'system', id: 'authority-manager' },
      op: 'DELEGATE_AUTHORITY',
      locus: null,
      refs: { inputs: [], evidence: [] },
      payload: {
        delegationId: 'org.relay:1',
        grantor: { kind: 'user', id: 'founder' },
        grantee: { kind: 'user', id: 'project-lead' },
        capabilities: ['AUTHORIZE_MERGE', 'GRANT_RESOURCE', 'REORDER_QUEUE'],
      },
      tLevel: 'T3',
    }),
  ]);
  
  // Create conversation filament
  const conversation = new Filament('convo.main', 'conversation', [
    new Commit({
      filamentId: 'convo.main',
      commitIndex: 0,
      ts: now - 60000,
      actor: { kind: 'user', id: 'user-1' },
      op: 'USER_MSG',
      locus: null,
      refs: { inputs: [], evidence: [] },
      payload: { content: 'Build authentication system' },
      tLevel: 'T1',
    }),
  ]);
  
  // Create work filament
  const work = new Filament('work.agent-1.task-A', 'work', [
    new Commit({
      filamentId: 'work.agent-1.task-A',
      commitIndex: 0,
      ts: now - 50000,
      actor: { kind: 'agent', id: 'agent-1' },
      op: 'TASK_ACCEPTED',
      locus: null,
      refs: {
        inputs: [{ filamentId: 'convo.main', commitIndex: 0 }],
        evidence: [],
      },
      payload: { taskDescription: 'Implement auth' },
      tLevel: 'T1',
    }),
  ]);
  
  // Create file filament
  const file = new Filament('file.auth.js', 'file', [
    new Commit({
      filamentId: 'file.auth.js',
      commitIndex: 0,
      ts: now - 80000,
      actor: { kind: 'user', id: 'user-1' },
      op: 'FILE_CREATED',
      locus: null,
      refs: { inputs: [], evidence: [] },
      payload: { filename: 'auth.js' },
      tLevel: 'T1',
    }),
  ]);
  
  // Create queue filament
  const queue = new Filament('queue.auth.js', 'queue', [
    new Commit({
      filamentId: 'queue.auth.js',
      commitIndex: 0,
      ts: now - 30000,
      actor: { kind: 'agent', id: 'agent-1' },
      op: 'QUEUE_ENQUEUE',
      locus: null,
      refs: { inputs: [], evidence: [] },
      payload: {
        proposalBranchId: 'file.auth.js@proposal/task-A',
        baseCommitHash: 'hash-abc',
      },
      tLevel: 'T2',
    }),
  ]);
  
  // Create resource filament
  const resource = new Filament('resource.gpu-1', 'resource', [
    new Commit({
      filamentId: 'resource.gpu-1',
      commitIndex: 0,
      ts: now - 70000,
      actor: { kind: 'system', id: 'resource-manager' },
      op: 'RESOURCE_CREATED',
      locus: null,
      refs: { inputs: [], evidence: [] },
      payload: { resourceId: 'gpu-1', capacity: 1 },
      tLevel: 'T2',
    }),
    new Commit({
      filamentId: 'resource.gpu-1',
      commitIndex: 1,
      ts: now - 60000,
      actor: { kind: 'agent', id: 'agent-1' },
      op: 'REQUEST',
      locus: null,
      refs: { inputs: [], evidence: [] },
      payload: { agentId: 'agent-1', priority: 8 },
      tLevel: 'T2',
    }),
    new Commit({
      filamentId: 'resource.gpu-1',
      commitIndex: 2,
      ts: now - 55000,
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
          delegationPath: [{ filamentId: 'authority.org.relay', commitIndex: 1 }],
          pathHash: 'hash-abc',
          satisfiedConstraints: {},
        },
      },
      payload: {
        agentId: 'agent-1',
        policyRef: { policyId: 'priority', reason: 'Highest priority' },
        policyProof: { candidateSetHash: 'hash-abc', winnerRequestId: 'agent-1:task-A' },
      },
      tLevel: 'T2',
    }),
  ]);
  
  // Create conflict filament
  const conflict = new Filament('conflict.auth.js.proposal-A.proposal-B', 'conflict', [
    new Commit({
      filamentId: 'conflict.auth.js.proposal-A.proposal-B',
      commitIndex: 0,
      ts: now - 25000,
      actor: { kind: 'system', id: 'conflict-detector' },
      op: 'CONFLICT_DETECTED',
      locus: null,
      refs: { inputs: [], evidence: [] },
      payload: {
        baseCommitHash: 'hash-abc',
        touchedLociA: ['line-10', 'line-20'],
        touchedLociB: ['line-20', 'line-30'],
        overlap: ['line-20'],
      },
      tLevel: 'T2',
    }),
  ]);
  
  return {
    filaments: {
      authorityRoot,
      conversation,
      work,
      file,
      queue,
      resource,
      conflict,
    },
  };
}
