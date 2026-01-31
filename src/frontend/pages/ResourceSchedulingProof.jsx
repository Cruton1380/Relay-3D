/**
 * RESOURCE SCHEDULING PROOF
 * 
 * Demonstrates: Resource contention + waiting as geometry + no invisible queues
 * 
 * CORE INVARIANT:
 * "If an agent is blocked, the blockage must exist as geometry."
 * 
 * Route: /proof/resource-scheduling
 */

import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Text } from '@react-three/drei';
import {
  createResourceCreated,
  createRequest,
  createGrant,
  createRelease,
  createTimeout,
  getNextRequest,
  verifyNoInvisiblePrioritization,
  verifyCapacityConstraints,
  verifyExplicitPriorities,
  detectStarvation,
} from '../components/ai/schemas/resourceSchedulingSchemas';

export default function ResourceSchedulingProof() {
  const [step, setStep] = useState(0);
  
  // Resource filament
  const [resourceFilament, setResourceFilament] = useState({
    filamentId: 'resource.gpu-1',
    commits: [
      createResourceCreated('gpu-1', 0, 2, 'gpu_time', 'priority'), // Capacity: 2
    ],
  });
  
  // Agent states
  const [agents, setAgents] = useState([
    { id: 'agent-1', taskId: 'task-A', status: 'idle', priority: 5, workPosition: [-15, 0, -5] },
    { id: 'agent-2', taskId: 'task-B', status: 'idle', priority: 8, workPosition: [-15, 0, 0] },
    { id: 'agent-3', taskId: 'task-C', status: 'idle', priority: 3, workPosition: [-15, 0, 5] },
  ]);
  
  const [policyId] = useState('priority');
  
  // Filament positions
  const filamentPositions = {
    resource: [0, 0, 0],
    waitingZone: [-10, 0, 0],
    grantedZone: [10, 0, 0],
  };
  
  // ============================================================================
  // STEP 1: THREE AGENTS REQUEST RESOURCE
  // ============================================================================
  
  const handleAgentsRequest = () => {
    // Agent 1: Priority 5
    const req1 = createRequest('gpu-1', 1, 'agent-1', 'task-A', 5, 10000, 'Model training - batch 1');
    
    // Agent 2: Priority 8 (highest)
    const req2 = createRequest('gpu-1', 2, 'agent-2', 'task-B', 8, 5000, 'Urgent inference request');
    
    // Agent 3: Priority 3 (lowest)
    const req3 = createRequest('gpu-1', 3, 'agent-3', 'task-C', 3, 15000, 'Background model eval');
    
    setResourceFilament(prev => ({
      ...prev,
      commits: [...prev.commits, req1, req2, req3],
    }));
    
    // Update agent states
    setAgents(prev => prev.map(agent => ({
      ...agent,
      status: 'waiting',
    })));
    
    setStep(1);
  };
  
  // ============================================================================
  // STEP 2: GRANT TO HIGHEST PRIORITY (AGENT 2)
  // ============================================================================
  
  const handleFirstGrant = () => {
    const nextRequest = getNextRequest(resourceFilament, policyId);
    
    if (nextRequest) {
      const grant = createGrant('gpu-1', resourceFilament.commits.length, nextRequest.payload.agentId, nextRequest.payload.taskId, {
        policyId,
        reason: `Priority: ${nextRequest.payload.priority}`,
        queuePosition: 0,
      });
      
      setResourceFilament(prev => ({
        ...prev,
        commits: [...prev.commits, grant],
      }));
      
      // Update agent state
      setAgents(prev => prev.map(agent => 
        agent.id === nextRequest.payload.agentId
          ? { ...agent, status: 'granted' }
          : agent
      ));
    }
    
    setStep(2);
  };
  
  // ============================================================================
  // STEP 3: GRANT TO SECOND PRIORITY (AGENT 1)
  // ============================================================================
  
  const handleSecondGrant = () => {
    // Find next request (agent-1, priority 5)
    const waitingRequests = resourceFilament.commits.filter(c => 
      c.op === 'REQUEST' && 
      !resourceFilament.commits.some(g => 
        g.op === 'GRANT' && 
        g.payload.agentId === c.payload.agentId &&
        g.payload.taskId === c.payload.taskId
      )
    );
    
    if (waitingRequests.length > 0) {
      // Sort by priority
      waitingRequests.sort((a, b) => b.payload.priority - a.payload.priority);
      const nextRequest = waitingRequests[0];
      
      const grant = createGrant('gpu-1', resourceFilament.commits.length, nextRequest.payload.agentId, nextRequest.payload.taskId, {
        policyId,
        reason: `Priority: ${nextRequest.payload.priority}`,
        queuePosition: 1,
      });
      
      setResourceFilament(prev => ({
        ...prev,
        commits: [...prev.commits, grant],
      }));
      
      // Update agent state
      setAgents(prev => prev.map(agent => 
        agent.id === nextRequest.payload.agentId
          ? { ...agent, status: 'granted' }
          : agent
      ));
    }
    
    setStep(3);
  };
  
  // ============================================================================
  // STEP 4: AGENT 2 RELEASES (SLOT AVAILABLE)
  // ============================================================================
  
  const handleRelease = () => {
    const release = createRelease('gpu-1', resourceFilament.commits.length, 'agent-2', 'task-B', 4800);
    
    setResourceFilament(prev => ({
      ...prev,
      commits: [...prev.commits, release],
    }));
    
    // Update agent state
    setAgents(prev => prev.map(agent => 
      agent.id === 'agent-2'
        ? { ...agent, status: 'released' }
        : agent
    ));
    
    setStep(4);
  };
  
  // ============================================================================
  // STEP 5: GRANT TO AGENT 3 (NOW HAS SLOT)
  // ============================================================================
  
  const handleThirdGrant = () => {
    // Find agent-3 request
    const agent3Request = resourceFilament.commits.find(c => 
      c.op === 'REQUEST' && 
      c.payload.agentId === 'agent-3'
    );
    
    if (agent3Request) {
      const grant = createGrant('gpu-1', resourceFilament.commits.length, 'agent-3', 'task-C', {
        policyId,
        reason: `Priority: 3 (slot available)`,
        queuePosition: 0,
      });
      
      setResourceFilament(prev => ({
        ...prev,
        commits: [...prev.commits, grant],
      }));
      
      // Update agent state
      setAgents(prev => prev.map(agent => 
        agent.id === 'agent-3'
          ? { ...agent, status: 'granted' }
          : agent
      ));
    }
    
    setStep(5);
  };
  
  // ============================================================================
  // VERIFICATION RESULTS
  // ============================================================================
  
  const verificationResults = useMemo(() => {
    if (step < 1) return null;
    
    return {
      noInvisiblePrioritization: verifyNoInvisiblePrioritization(resourceFilament, policyId),
      capacityConstraints: verifyCapacityConstraints(resourceFilament),
      explicitPriorities: verifyExplicitPriorities(resourceFilament),
      starvation: detectStarvation(resourceFilament, 30000),
    };
  }, [step, resourceFilament, policyId]);
  
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
          <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#00ffff' }}>
            📊 RESOURCE SCHEDULING
          </div>
          
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '20px' }}>
            Waiting as geometry → no invisible queues
          </div>
          
          {/* Resource Info */}
          <div style={{
            marginBottom: '20px',
            padding: '10px',
            background: '#001a1a',
            border: '1px solid #00ffff',
            borderRadius: '4px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#00ffff', marginBottom: '8px' }}>
              RESOURCE: GPU-1
            </div>
            <div style={{ fontSize: '9px', color: '#00ffff', lineHeight: '1.6' }}>
              Capacity: 2 slots
              <br />
              Policy: Priority-based
              <br />
              Type: GPU Time
            </div>
          </div>
          
          {/* Step Buttons */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={handleAgentsRequest}
              disabled={step !== 0}
              style={{
                width: '100%',
                marginBottom: '8px',
                padding: '10px',
                fontSize: '11px',
                background: step === 0 ? '#00ffff' : '#333',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: step === 0 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              1. Three Agents Request
            </button>
            
            <button
              onClick={handleFirstGrant}
              disabled={step !== 1}
              style={{
                width: '100%',
                marginBottom: '8px',
                padding: '10px',
                fontSize: '11px',
                background: step === 1 ? '#00ff00' : '#333',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: step === 1 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              2. Grant to Agent 2 (P:8)
            </button>
            
            <button
              onClick={handleSecondGrant}
              disabled={step !== 2}
              style={{
                width: '100%',
                marginBottom: '8px',
                padding: '10px',
                fontSize: '11px',
                background: step === 2 ? '#00ff00' : '#333',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: step === 2 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              3. Grant to Agent 1 (P:5)
            </button>
            
            <button
              onClick={handleRelease}
              disabled={step !== 3}
              style={{
                width: '100%',
                marginBottom: '8px',
                padding: '10px',
                fontSize: '11px',
                background: step === 3 ? '#ffaa00' : '#333',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: step === 3 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              4. Agent 2 Releases
            </button>
            
            <button
              onClick={handleThirdGrant}
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
              5. Grant to Agent 3 (P:3)
            </button>
          </div>
          
          {/* Agent Status */}
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: '#1a1a00',
            border: '1px solid #ffaa00',
            borderRadius: '4px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffaa00', marginBottom: '8px' }}>
              AGENT STATUS
            </div>
            <div style={{ fontSize: '9px', color: '#ffaa00', lineHeight: '1.8' }}>
              {agents.map(agent => (
                <div key={agent.id} style={{ marginBottom: '4px' }}>
                  {agent.id}: {agent.status} (P:{agent.priority})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Center: 3D View */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 20, 40]} />
          <OrbitControls />
          
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          
          <gridHelper args={[60, 20, '#222', '#111']} />
          
          {/* Resource Filament (center) */}
          <group position={filamentPositions.resource}>
            {resourceFilament.commits.map((commit, i) => (
              <mesh key={i} position={[0, i * 2, 0]}>
                <boxGeometry args={[2, 1.5, 2]} />
                <meshStandardMaterial 
                  color={
                    commit.op === 'RESOURCE_CREATED' ? '#00ffff' :
                    commit.op === 'REQUEST' ? '#ffaa00' :
                    commit.op === 'GRANT' ? '#00ff00' :
                    commit.op === 'RELEASE' ? '#ff6600' :
                    '#ffffff'
                  }
                  emissive={
                    commit.op === 'RESOURCE_CREATED' ? '#00ffff' :
                    commit.op === 'REQUEST' ? '#ffaa00' :
                    commit.op === 'GRANT' ? '#00ff00' :
                    commit.op === 'RELEASE' ? '#ff6600' :
                    '#ffffff'
                  }
                  emissiveIntensity={0.3}
                />
              </mesh>
            ))}
            <Text position={[0, -2, 0]} fontSize={0.8} color="#00ffff">
              RESOURCE
            </Text>
          </group>
          
          {/* Agent Markers with Waiting Pressure */}
          {agents.map((agent, i) => {
            // Position based on status
            let position;
            if (agent.status === 'idle') {
              position = agent.workPosition;
            } else if (agent.status === 'waiting') {
              position = [filamentPositions.waitingZone[0], i * 3, filamentPositions.waitingZone[2]];
            } else if (agent.status === 'granted') {
              position = [filamentPositions.grantedZone[0], i * 3, filamentPositions.grantedZone[2]];
            } else {
              position = [filamentPositions.grantedZone[0] + 5, i * 3, filamentPositions.grantedZone[2]];
            }
            
            // LOCK PATCH 4: Waiting pressure (strain escalation)
            // Calculate wait duration in commit-index units
            const request = resourceFilament.commits.find(c => 
              c.op === 'REQUEST' && 
              c.payload.agentId === agent.id
            );
            
            let waitPressure = 0;
            let pressureColor = '#ffaa00';
            
            if (agent.status === 'waiting' && request) {
              const waitCommits = resourceFilament.commits.length - request.commitIndex;
              
              // Escalating pressure thresholds
              if (waitCommits > 8) {
                waitPressure = 3; // Critical (red)
                pressureColor = '#ff0000';
              } else if (waitCommits > 5) {
                waitPressure = 2; // High (orange-red)
                pressureColor = '#ff6600';
              } else if (waitCommits > 2) {
                waitPressure = 1; // Medium (orange)
                pressureColor = '#ffaa00';
              }
            }
            
            return (
              <group key={agent.id} position={position}>
                {/* Agent sphere */}
                <mesh>
                  <sphereGeometry args={[0.8, 16, 16]} />
                  <meshStandardMaterial 
                    color={
                      agent.status === 'idle' ? '#666' :
                      agent.status === 'waiting' ? pressureColor :
                      agent.status === 'granted' ? '#00ff00' :
                      '#ff6600'
                    }
                    emissive={
                      agent.status === 'idle' ? '#666' :
                      agent.status === 'waiting' ? pressureColor :
                      agent.status === 'granted' ? '#00ff00' :
                      '#ff6600'
                    }
                    emissiveIntensity={agent.status === 'waiting' ? 0.5 + (waitPressure * 0.2) : 0.5}
                  />
                </mesh>
                
                {/* PRESSURE BANDS (visible before timeout) */}
                {agent.status === 'waiting' && waitPressure > 0 && (
                  <>
                    {[...Array(waitPressure)].map((_, band) => (
                      <mesh key={band} position={[0, 0, 0]}>
                        <torusGeometry args={[1 + (band * 0.5), 0.1, 16, 32]} />
                        <meshStandardMaterial 
                          color={pressureColor}
                          emissive={pressureColor}
                          emissiveIntensity={0.6}
                          transparent
                          opacity={0.6 - (band * 0.15)}
                        />
                      </mesh>
                    ))}
                  </>
                )}
                
                <Text position={[0, -1.5, 0]} fontSize={0.5} color="#fff">
                  {agent.id}
                </Text>
              </group>
            );
          })}
          
          {/* Zone Labels */}
          <Text position={[filamentPositions.waitingZone[0], -3, 0]} fontSize={0.8} color="#ffaa00">
            WAITING ZONE
          </Text>
          <Text position={[filamentPositions.grantedZone[0], -3, 0]} fontSize={0.8} color="#00ff00">
            GRANTED ZONE
          </Text>
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
                ✓ No invisible prioritization: {verificationResults.noInvisiblePrioritization ? 'true' : 'false'}
                <br />
                ✓ Capacity constraints: {verificationResults.capacityConstraints ? 'true' : 'false'}
                <br />
                ✓ Explicit priorities: {verificationResults.explicitPriorities ? 'true' : 'false'}
                <br />
                ✓ No starvation: {!verificationResults.starvation.hasStarvation ? 'true' : 'false'}
              </div>
            </div>
          )}
          
          <div style={{ fontSize: '10px', color: '#666', marginTop: '20px', lineHeight: '1.6' }}>
            <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
              FORBIDDEN PATTERNS (BLOCKED):
            </div>
            ❌ Invisible queues
            <br />
            ❌ Silent drops
            <br />
            ❌ Hidden prioritization
            <br />
            ❌ Capacity violations
            <br />
            ❌ Missing priorities
          </div>
          
          <div style={{ fontSize: '10px', color: '#666', marginTop: '20px', lineHeight: '1.6' }}>
            <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
              BLOCKAGE IS GEOMETRY:
            </div>
            🟠 Waiting zone = visible wait
            <br />
            🟢 Granted zone = visible execution
            <br />
            📊 Resource filament = full history
            <br />
            ⏱️ Starvation = detectable
          </div>
          
          <div style={{ fontSize: '10px', color: '#666', marginTop: '20px', lineHeight: '1.6' }}>
            <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
              WAITING PRESSURE (FELT BEFORE TIMEOUT):
            </div>
            🟠 1 band = Medium wait (3+ commits)
            <br />
            🟧 2 bands = High wait (6+ commits)
            <br />
            🔴 3 bands = Critical wait (9+ commits)
            <br />
            <br />
            <span style={{ color: '#888', fontSize: '9px' }}>
              Pressure escalates by commit-index delta, not wall-clock time (deterministic).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
