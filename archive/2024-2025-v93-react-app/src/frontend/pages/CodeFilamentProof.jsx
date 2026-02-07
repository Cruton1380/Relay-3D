/**
 * CODE FILAMENT PROOF
 * 
 * Route: /proof/code-filament
 * 
 * Proves:
 * - Code as filaments (modules are truth objects with history)
 * - Operations not diffs (rename, extract, import are discrete commits)
 * - Evidence visible (typecheck/tests attached to commits)
 * - Topology lens (dependency rays show blast radius)
 * - EngageSurface for symbols (rename with lock)
 * - Downstream impact visible (red evidence when dependencies break)
 * 
 * Demo: Module filament (src/utils.ts) with:
 * - Pre-seeded commits (create, add function, rename, import)
 * - Dependency ray to src/types.ts
 * - Downstream consumer (src/api.ts) that imports parseData
 * - Symbol rename triggers downstream typecheck failure
 * - Evidence visible in 3D (green = pass, red = fail)
 */

import React, { useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';

import {
  createModuleCreatedCommit,
  createFunctionAddedCommit,
  createFunctionRenamedCommit,
  createImportAddedCommit,
  createEvidence,
  createTypecheckFailure,
  getExportedSymbols,
  getImportedModules,
} from '../components/code/schemas/codeCommitSchemas';

import { presenceService } from '../components/filament/services/presenceService';

/**
 * Initial state: Pre-seeded with module history
 */
const INITIAL_STATE = {
  // Main module: src/utils.ts
  utils: {
    id: 'module:src/utils.ts',
    commits: [
      // Commit 0: Module created
      createModuleCreatedCommit(
        'module:src/utils.ts',
        0,
        'alice',
        {
          moduleId: 'src/utils.ts',
          language: 'typescript',
          evidence: createEvidence(
            { status: 'PASS', errors: [] },
            { status: 'PASS', passed: 0, failed: 0 }
          ),
        }
      ),
      // Commit 1: Function added (parseJSON)
      createFunctionAddedCommit(
        'module:src/utils.ts',
        1,
        'alice',
        {
          functionName: 'parseJSON',
          signature: '(input: string): object',
          exported: true,
          evidence: createEvidence(
            { status: 'PASS', errors: [] },
            { status: 'PASS', passed: 3, failed: 0 }
          ),
        }
      ),
      // Commit 2: Import added (types)
      createImportAddedCommit(
        'module:src/utils.ts',
        2,
        'alice',
        { filamentId: 'module:src/types.ts', commitIndex: 0 },
        {
          module: './types',
          symbols: ['User', 'ApiResponse'],
          evidence: createEvidence(
            { status: 'PASS', errors: [] },
            { status: 'PASS', passed: 3, failed: 0 }
          ),
        }
      ),
      // Commit 3: Function renamed (parseJSON → parseData)
      createFunctionRenamedCommit(
        'module:src/utils.ts',
        3,
        'bob',
        [{ filamentId: 'module:src/api.ts', commitIndex: 1 }], // Downstream consumer
        {
          oldName: 'parseJSON',
          newName: 'parseData',
          scope: 'module',
          exported: true,
          evidence: createEvidence(
            { status: 'PASS', errors: [] },
            { status: 'PASS', passed: 3, failed: 0 }
          ),
        }
      ),
    ],
  },
  
  // Dependency: src/types.ts
  types: {
    id: 'module:src/types.ts',
    commits: [
      createModuleCreatedCommit(
        'module:src/types.ts',
        0,
        'system',
        {
          moduleId: 'src/types.ts',
          language: 'typescript',
          evidence: createEvidence(
            { status: 'PASS', errors: [] },
            { status: 'PASS', passed: 0, failed: 0 }
          ),
        }
      ),
    ],
  },
  
  // Downstream consumer: src/api.ts (imports parseJSON, will break after rename)
  api: {
    id: 'module:src/api.ts',
    commits: [
      createModuleCreatedCommit(
        'module:src/api.ts',
        0,
        'carol',
        {
          moduleId: 'src/api.ts',
          language: 'typescript',
          evidence: createEvidence(
            { status: 'PASS', errors: [] },
            { status: 'PASS', passed: 5, failed: 0 }
          ),
        }
      ),
      createImportAddedCommit(
        'module:src/api.ts',
        1,
        'carol',
        { filamentId: 'module:src/utils.ts', commitIndex: 1 },
        {
          module: './utils',
          symbols: ['parseJSON'], // OLD NAME - will break after rename!
          evidence: createEvidence(
            { status: 'PASS', errors: [] },
            { status: 'PASS', passed: 5, failed: 0 }
          ),
        }
      ),
    ],
  },
};

/**
 * TimeBox with faces (show evidence on hover)
 */
function CommitBox({ commit, position, color, onHover }) {
  const [hovered, setHovered] = useState(false);
  
  // Evidence color (green = pass, red = fail, yellow = warn)
  const evidenceColor = commit.evidence?.typecheck?.status === 'FAIL' 
    ? '#ff0000'
    : commit.evidence?.tests?.status === 'FAIL'
    ? '#ff6600'
    : '#00ff00';
  
  return (
    <group position={position}>
      {/* Main cube */}
      <mesh
        onPointerOver={() => { setHovered(true); onHover?.(commit); }}
        onPointerOut={() => { setHovered(false); onHover?.(null); }}
      >
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : color}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>
      
      {/* Operation label */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.5}
      >
        {commit.op.replace(/_/g, ' ')}
      </Text>
      
      {/* Commit index */}
      <Text
        position={[0, -1.2, 0]}
        fontSize={0.18}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        #{commit.commitIndex}
      </Text>
      
      {/* Evidence indicator (-Y face) */}
      <mesh position={[0, -0.76, 0]}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshBasicMaterial color={evidenceColor} />
      </mesh>
      
      {/* Hover detail */}
      {hovered && commit.payload?.functionName && (
        <Text
          position={[0, -1.8, 0]}
          fontSize={0.15}
          color="#ffaa00"
          anchorX="center"
          anchorY="middle"
        >
          {commit.payload.functionName}
        </Text>
      )}
    </group>
  );
}

/**
 * Module filament spine
 */
function ModuleFilament({ filament, yPosition, zPosition, color, label, onCommitHover }) {
  const DELTA_X = 3;
  
  return (
    <group position={[0, yPosition, zPosition]}>
      {/* Label */}
      <Text
        position={[-2, 2, 0]}
        fontSize={0.35}
        color={color}
        anchorX="left"
        anchorY="middle"
      >
        {label}
      </Text>
      
      {/* Commits */}
      {filament.commits.map((commit, i) => (
        <CommitBox
          key={i}
          commit={commit}
          position={[i * DELTA_X, 0, 0]}
          color={color}
          onHover={onCommitHover}
        />
      ))}
      
      {/* Spine */}
      {filament.commits.length > 1 && (
        <mesh>
          <tubeGeometry args={[
            new THREE.CatmullRomCurve3(
              filament.commits.map((c, i) => new THREE.Vector3(i * DELTA_X, 0, 0))
            ),
            32,
            0.1,
            8,
            false
          ]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      )}
    </group>
  );
}

/**
 * Dependency rays (topology lens)
 */
function DependencyRays({ show, sourceFilament, targetFilaments, ySource, yTarget, zSource, zTarget }) {
  if (!show) return null;
  
  const DELTA_X = 3;
  const rays = [];
  
  // Upstream dependencies (imports) - blue rays
  const sourceImports = getImportedModules(sourceFilament);
  sourceImports.forEach((imp, idx) => {
    const targetModule = targetFilaments.find(t => t.id.includes(imp.module.replace('./', '')));
    if (targetModule) {
      const sourcePos = new THREE.Vector3((sourceFilament.commits.length - 1) * DELTA_X, ySource, zSource);
      const targetPos = new THREE.Vector3(0, yTarget, zTarget);
      rays.push({
        key: `upstream-${idx}`,
        start: sourcePos,
        end: targetPos,
        color: '#00aaff', // Blue = upstream
      });
    }
  });
  
  return (
    <group>
      {rays.map(({ key, start, end, color }) => (
        <Line
          key={key}
          points={[start, end]}
          color={color}
          lineWidth={2}
          dashed
          dashScale={2}
        />
      ))}
    </group>
  );
}

/**
 * Downstream impact rays (show what breaks)
 */
function DownstreamImpactRays({ show, sourceFilament, downstreamFilaments, ySource, yDownstream, zSource, zDownstream }) {
  if (!show) return null;
  
  const DELTA_X = 3;
  const rays = [];
  
  // Check latest commit for downstream refs
  const latestCommit = sourceFilament.commits[sourceFilament.commits.length - 1];
  if (latestCommit.refs?.inputs) {
    latestCommit.refs.inputs.forEach((ref, idx) => {
      const downstreamModule = downstreamFilaments.find(m => m.id === ref.filamentId);
      if (downstreamModule) {
        // Check if downstream module has broken evidence
        const downstreamLatest = downstreamModule.commits[downstreamModule.commits.length - 1];
        const isBroken = downstreamLatest.evidence?.typecheck?.status === 'FAIL';
        
        const sourcePos = new THREE.Vector3((sourceFilament.commits.length - 1) * DELTA_X, ySource, zSource);
        const targetPos = new THREE.Vector3(ref.commitIndex * DELTA_X, yDownstream, zDownstream);
        
        rays.push({
          key: `downstream-${idx}`,
          start: sourcePos,
          end: targetPos,
          color: isBroken ? '#ff0000' : '#00ff00', // Red = broken, green = OK
        });
      }
    });
  }
  
  return (
    <group>
      {rays.map(({ key, start, end, color }) => (
        <Line
          key={key}
          points={[start, end]}
          color={color}
          lineWidth={3}
        />
      ))}
    </group>
  );
}

/**
 * Main proof component
 */
export default function CodeFilamentProof() {
  const [state, setState] = useState(INITIAL_STATE);
  const [showTopology, setShowTopology] = useState(false);
  const [showDownstream, setShowDownstream] = useState(false);
  const [hoveredCommit, setHoveredCommit] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Step 1: Show topology (dependency rays)
  const handleShowTopology = () => {
    setShowTopology(true);
    setCurrentStep(1);
  };
  
  // Step 2: Simulate renaming symbol (parseData → processData)
  const handleRenameSymbol = () => {
    const newCommit = createFunctionRenamedCommit(
      'module:src/utils.ts',
      state.utils.commits.length,
      'demo-user',
      [{ filamentId: 'module:src/api.ts', commitIndex: 1 }],
      {
        oldName: 'parseData',
        newName: 'processData',
        scope: 'module',
        exported: true,
        evidence: createEvidence(
          { status: 'PASS', errors: [] },
          { status: 'PASS', passed: 3, failed: 0 }
        ),
      }
    );
    
    setState(prev => ({
      ...prev,
      utils: {
        ...prev.utils,
        commits: [...prev.utils.commits, newCommit],
      },
    }));
    
    setCurrentStep(2);
  };
  
  // Step 3: Show downstream impact (src/api.ts typecheck fails)
  const handleShowDownstreamImpact = () => {
    // Update api.ts with typecheck failure (imports processData but still uses parseJSON)
    const brokenCommit = createImportAddedCommit(
      'module:src/api.ts',
      state.api.commits.length,
      'system',
      { filamentId: 'module:src/utils.ts', commitIndex: state.utils.commits.length - 1 },
      {
        module: './utils',
        symbols: ['parseJSON'], // Still using OLD name!
        evidence: createEvidence(
          createTypecheckFailure([
            "Cannot find name 'parseJSON'. Did you mean 'processData'?"
          ]),
          { status: 'FAIL', passed: 3, failed: 2, output: '2 tests failed' }
        ),
      }
    );
    
    setState(prev => ({
      ...prev,
      api: {
        ...prev.api,
        commits: [...prev.api.commits, brokenCommit],
      },
    }));
    
    setShowDownstream(true);
    setCurrentStep(3);
  };
  
  // Step 4: Fix downstream (update api.ts to use new name)
  const handleFixDownstream = () => {
    const fixedCommit = createImportAddedCommit(
      'module:src/api.ts',
      state.api.commits.length,
      'carol',
      { filamentId: 'module:src/utils.ts', commitIndex: state.utils.commits.length - 1 },
      {
        module: './utils',
        symbols: ['processData'], // FIXED: using new name
        evidence: createEvidence(
          { status: 'PASS', errors: [] },
          { status: 'PASS', passed: 5, failed: 0 }
        ),
      }
    );
    
    setState(prev => ({
      ...prev,
      api: {
        ...prev.api,
        commits: [...prev.api.commits, fixedCommit],
      },
    }));
    
    setCurrentStep(4);
  };
  
  const handleReset = () => {
    setState(INITIAL_STATE);
    setShowTopology(false);
    setShowDownstream(false);
    setCurrentStep(0);
    presenceService.clear();
  };
  
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      {/* Left Panel */}
      <div style={{
        width: '320px',
        background: 'rgba(0,0,0,0.95)',
        color: 'white',
        padding: '20px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px',
      }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#00ff00' }}>
          💻 Code as Filaments
        </h2>
        
        <div style={{ marginBottom: '15px', padding: '10px', background: '#1a1a1a', borderRadius: '4px', fontSize: '10px' }}>
          <div style={{ color: '#888', marginBottom: '5px' }}>Concept:</div>
          <div style={{ color: '#00ffff' }}>
            Modules are filaments. Edits are operations. Dependencies are topology.
          </div>
        </div>
        
        <div style={{ fontSize: '10px', color: '#888', marginBottom: '10px' }}>Demo Steps:</div>
        
        <button onClick={handleShowTopology} disabled={currentStep > 0} style={{
          width: '100%', padding: '8px', marginBottom: '6px',
          background: currentStep === 0 ? '#003300' : (currentStep > 0 ? '#1a4d1a' : '#222'),
          color: currentStep > 0 ? '#00ff00' : 'white',
          border: currentStep === 0 ? '2px solid #00ff00' : 'none',
          borderRadius: '4px', cursor: currentStep === 0 ? 'pointer' : 'default',
          fontFamily: 'monospace', fontSize: '10px', textAlign: 'left',
        }}>
          {currentStep > 0 ? '✅' : '1.'} Show Topology (Dependency Rays)
        </button>
        
        <button onClick={handleRenameSymbol} disabled={currentStep !== 1} style={{
          width: '100%', padding: '8px', marginBottom: '6px',
          background: currentStep === 1 ? '#003300' : (currentStep > 1 ? '#1a4d1a' : '#222'),
          color: currentStep > 1 ? '#00ff00' : 'white',
          border: currentStep === 1 ? '2px solid #00ff00' : 'none',
          borderRadius: '4px', cursor: currentStep === 1 ? 'pointer' : 'default',
          fontFamily: 'monospace', fontSize: '10px', textAlign: 'left',
        }}>
          {currentStep > 1 ? '✅' : '2.'} Rename Symbol (parseData → processData)
        </button>
        
        <button onClick={handleShowDownstreamImpact} disabled={currentStep !== 2} style={{
          width: '100%', padding: '8px', marginBottom: '6px',
          background: currentStep === 2 ? '#330000' : (currentStep > 2 ? '#1a4d1a' : '#222'),
          color: currentStep > 2 ? '#00ff00' : (currentStep === 2 ? '#ff6666' : 'white'),
          border: currentStep === 2 ? '2px solid #ff0000' : 'none',
          borderRadius: '4px', cursor: currentStep === 2 ? 'pointer' : 'default',
          fontFamily: 'monospace', fontSize: '10px', textAlign: 'left',
        }}>
          {currentStep > 2 ? '🚫' : '3.'} Show Downstream Impact (RED)
        </button>
        
        <button onClick={handleFixDownstream} disabled={currentStep !== 3} style={{
          width: '100%', padding: '8px', marginBottom: '15px',
          background: currentStep === 3 ? '#003300' : (currentStep > 3 ? '#1a4d1a' : '#222'),
          color: currentStep > 3 ? '#00ff00' : 'white',
          border: currentStep === 3 ? '2px solid #00ff00' : 'none',
          borderRadius: '4px', cursor: currentStep === 3 ? 'pointer' : 'default',
          fontFamily: 'monospace', fontSize: '10px', textAlign: 'left',
        }}>
          {currentStep > 3 ? '✅' : '4.'} Fix Downstream (Update Import)
        </button>
        
        <button onClick={handleReset} style={{
          width: '100%', padding: '10px',
          background: '#333', color: 'white', border: 'none',
          borderRadius: '4px', cursor: 'pointer',
          fontFamily: 'monospace', fontSize: '11px',
        }}>
          🔄 Reset
        </button>
        
        {hoveredCommit && (
          <div style={{ marginTop: '20px', padding: '12px', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px', color: '#ffaa00', marginBottom: '8px' }}>
              Commit #{hoveredCommit.commitIndex}
            </div>
            <div style={{ fontSize: '10px', color: '#888', marginBottom: '5px' }}>
              Operation: {hoveredCommit.op}
            </div>
            {hoveredCommit.payload?.functionName && (
              <div style={{ fontSize: '10px', color: '#00ffff', marginBottom: '5px' }}>
                Function: {hoveredCommit.payload.functionName}
              </div>
            )}
            {hoveredCommit.evidence && (
              <div style={{ fontSize: '9px', marginTop: '8px' }}>
                <div style={{ color: '#888' }}>Evidence:</div>
                <div style={{ color: hoveredCommit.evidence.typecheck?.status === 'FAIL' ? '#ff0000' : '#00ff00' }}>
                  Typecheck: {hoveredCommit.evidence.typecheck?.status}
                </div>
                <div style={{ color: hoveredCommit.evidence.tests?.status === 'FAIL' ? '#ff0000' : '#00ff00' }}>
                  Tests: {hoveredCommit.evidence.tests?.status} ({hoveredCommit.evidence.tests?.passed || 0} passed)
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Center: 3D View */}
      <div style={{ flex: 1, background: '#000' }}>
        <Canvas camera={{ position: [8, 4, 15], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={0.9} />
          
          <Text position={[0, 7, 0]} fontSize={0.5} color="#00ffff" anchorX="center" anchorY="middle">
            Code as Filaments
          </Text>
          
          {/* Main module: src/utils.ts (top, cyan) */}
          <ModuleFilament
            filament={state.utils}
            yPosition={3}
            zPosition={0}
            color="#00ffff"
            label="src/utils.ts"
            onCommitHover={setHoveredCommit}
          />
          
          {/* Dependency: src/types.ts (middle, blue) */}
          <ModuleFilament
            filament={state.types}
            yPosition={0}
            zPosition={-3}
            color="#0088ff"
            label="src/types.ts"
            onCommitHover={setHoveredCommit}
          />
          
          {/* Downstream: src/api.ts (bottom, green/red) */}
          <ModuleFilament
            filament={state.api}
            yPosition={-3}
            zPosition={0}
            color={state.api.commits[state.api.commits.length - 1]?.evidence?.typecheck?.status === 'FAIL' ? '#ff0000' : '#00ff00'}
            label="src/api.ts (consumer)"
            onCommitHover={setHoveredCommit}
          />
          
          {/* Dependency rays (topology lens) */}
          <DependencyRays
            show={showTopology}
            sourceFilament={state.utils}
            targetFilaments={[state.types]}
            ySource={3}
            yTarget={0}
            zSource={0}
            zTarget={-3}
          />
          
          {/* Downstream impact rays */}
          <DownstreamImpactRays
            show={showDownstream}
            sourceFilament={state.utils}
            downstreamFilaments={[state.api]}
            ySource={3}
            yDownstream={-3}
            zSource={0}
            zDownstream={0}
          />
          
          <gridHelper args={[40, 40, '#222222', '#111111']} position={[0, -6, 0]} />
          <OrbitControls target={[0, 0, 0]} enableDamping dampingFactor={0.05} />
        </Canvas>
        
        <div style={{
          position: 'absolute', bottom: '20px', left: '20px', right: '20px',
          background: 'rgba(0,0,0,0.85)', color: 'white', padding: '12px 20px',
          fontFamily: 'monospace', fontSize: '11px',
          display: 'flex', justifyContent: 'space-between', borderRadius: '4px',
        }}>
          <span>utils.ts: {state.utils.commits.length} commits</span>
          <span>types.ts: {state.types.commits.length} commits</span>
          <span style={{ color: state.api.commits[state.api.commits.length - 1]?.evidence?.typecheck?.status === 'FAIL' ? '#ff0000' : '#00ff00' }}>
            api.ts: {state.api.commits.length} commits
          </span>
        </div>
      </div>
      
      {/* Right Panel: Exports/Imports */}
      <div style={{
        width: '280px', background: 'rgba(0,0,0,0.95)', color: 'white',
        padding: '20px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px',
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#ffaa00' }}>
          API Surface
        </h3>
        
        <div style={{ marginBottom: '15px', paddingBottom: '12px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>Exports (src/utils.ts):</div>
          {getExportedSymbols(state.utils).map((sym, i) => (
            <div key={i} style={{ fontSize: '10px', padding: '5px', background: '#1a1a1a', marginBottom: '4px' }}>
              <div style={{ color: '#00ffff' }}>{sym}</div>
            </div>
          ))}
        </div>
        
        <div style={{ marginBottom: '15px', paddingBottom: '12px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>Imports (src/utils.ts):</div>
          {getImportedModules(state.utils).map((imp, i) => (
            <div key={i} style={{ fontSize: '9px', padding: '5px', background: '#1a1a1a', marginBottom: '4px' }}>
              <div style={{ color: '#0088ff' }}>{imp.module}</div>
              <div style={{ color: '#666', marginTop: '2px' }}>{imp.symbols.join(', ')}</div>
            </div>
          ))}
        </div>
        
        <div>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>Downstream:</div>
          <div style={{ fontSize: '10px', padding: '5px', background: '#1a1a1a' }}>
            <div style={{ color: state.api.commits[state.api.commits.length - 1]?.evidence?.typecheck?.status === 'FAIL' ? '#ff0000' : '#00ff00' }}>
              src/api.ts
            </div>
            <div style={{ color: '#666', marginTop: '2px', fontSize: '9px' }}>
              Imports: {getImportedModules(state.api).find(i => i.module.includes('utils'))?.symbols.join(', ') || 'none'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
