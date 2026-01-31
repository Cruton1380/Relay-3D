/**
 * EDITABLE ENDPOINT PROOF
 * 
 * Route: /proof/edit-cell
 * 
 * Proves:
 * - Cell is a projection of filament's latest +X face
 * - Click → engage lock (requires L6 + engage distance)
 * - Edit → append commit (never mutate)
 * - Replay shows discrete causality
 * 
 * Core invariant: Edits target a locus (cellId), not "the spreadsheet"
 */

import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { resolveTier, POLICY_LEVELS } from '../components/filament/utils/privacyTierResolver';
import { buildCommit, appendCommit, getEndpointProjection, replayCommits } from '../components/filament/utils/commitBuilder';
import { canEngage, acquireLock, releaseLock, clearAllLocks } from '../components/filament/utils/engageSurfaceLock';

// Initial filament with seed commit
const INITIAL_FILAMENT = {
  id: 'cell-A1-filament',
  name: 'Cell A1',
  timeBoxes: [
    {
      id: 'tb0',
      eventIndex: 0,
      timestamp: Date.now() - 10000,
      type: 'initial',
      locusId: 'cell-A1',
      faces: {
        output: { value: 100, type: 'number' },
        semanticMeaning: { label: 'Initial Value' },
        magnitude: { confidence: 1.0 },
        evidence: { type: 'seed', pointer: 'init@seed' },
      },
    },
  ],
};

const DELTA_X = 10; // Spacing between commits

/**
 * Simple TimeBox renderer (reuses logic from FilamentDemo)
 */
function CommitCube({ timeBox, xPosition, isLatest }) {
  return (
    <group position={[xPosition, 0, 0]}>
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial 
          color={isLatest ? '#00ff00' : '#888888'}
          emissive={isLatest ? '#00ff00' : '#000000'}
          emissiveIntensity={isLatest ? 0.3 : 0}
        />
      </mesh>
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.4}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
      >
        {timeBox.faces.output.value}
      </Text>
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.25}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        #{timeBox.eventIndex}
      </Text>
    </group>
  );
}

/**
 * Filament spine renderer
 */
function CommitChain({ filament }) {
  const positions = filament.timeBoxes.map((tb, i) => [i * DELTA_X, 0, 0]);

  return (
    <group>
      {/* Spine */}
      {positions.length > 1 && (
        <mesh>
          <tubeGeometry args={[
            new THREE.CatmullRomCurve3(positions.map(p => new THREE.Vector3(...p))),
            64,
            0.15,
            8,
            false
          ]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      )}
      
      {/* Commits */}
      {filament.timeBoxes.map((tb, i) => (
        <CommitCube
          key={tb.id}
          timeBox={tb}
          xPosition={i * DELTA_X}
          isLatest={i === filament.timeBoxes.length - 1}
        />
      ))}
    </group>
  );
}

/**
 * Camera distance tracker (from Privacy Ladder proof)
 */
function CameraDistanceTracker({ onDistanceChange }) {
  const { camera } = useThree();
  const filamentCenter = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const interval = setInterval(() => {
      const dist = camera.position.distanceTo(filamentCenter.current);
      onDistanceChange(dist);
    }, 200); // Slower update to reduce renders
    return () => clearInterval(interval);
  }, [camera]); // Remove onDistanceChange from deps (causes infinite loop)

  return null;
}

/**
 * Main proof component
 */
export default function EditableCellProof() {
  const [filament, setFilament] = useState(INITIAL_FILAMENT);
  const [policyLevel, setPolicyLevel] = useState(POLICY_LEVELS.ENGAGE); // L6 default
  const [cameraDistance, setCameraDistance] = useState(8.5);
  const [isEditing, setIsEditing] = useState(false);
  const [cellValue, setCellValue] = useState(() => getEndpointProjection(INITIAL_FILAMENT));
  const [lockAcquired, setLockAcquired] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [testMode, setTestMode] = useState(false); // Bypass privacy gate for testing
  const inputRef = useRef(null);
  const renderCountRef = useRef(0);
  
  renderCountRef.current++;
  
  // Only log occasionally to avoid console spam
  if (renderCountRef.current % 50 === 1) {
    console.log('🔵 [EditableCellProof] Render #' + renderCountRef.current, { 
      cellValue, 
      policyLevel,
      cameraDistance,
      testMode,
    });
  }

  const tier = resolveTier(policyLevel, cameraDistance);
  const userId = 'demo-user';
  
  // Lock key: filamentId:sheetId:cellId (granular, not just filamentId)
  const locusId = `${filament.id}:sheet1:cell-A1`;

  // Handle cell click (attempt engage)
  const handleCellClick = () => {
    console.log('🔵🔵🔵 [EditableCellProof] Cell clicked!', { 
      policyLevel, 
      cameraDistance, 
      tier: tier.label,
      allowEngage: tier.renderFlags.allowEngage,
      locusId,
      testMode,
    });
    
    // TEST MODE: Bypass all checks
    if (testMode) {
      console.log('⚠️ [EditableCellProof] TEST MODE: Bypassing privacy/lock checks');
      setLockAcquired(true);
      setIsEditing(true);
      setStatusMessage('🧪 Test Mode: Direct edit enabled');
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    
    // Step 1: Check if engagement is allowed (conditions only)
    const engageCheck = canEngage(tier, locusId, userId);
    
    console.log('🔵 [EditableCellProof] Engage check:', engageCheck);

    if (!engageCheck.canEngage) {
      setStatusMessage(`❌ Cannot engage: ${engageCheck.reason}`);
      console.log('❌ [EditableCellProof] Engage blocked:', engageCheck.reason);
      return;
    }

    // Step 2: Attempt to acquire lock (soft mode for proof)
    const lockResult = acquireLock(locusId, userId, 'soft');
    
    console.log('🔵 [EditableCellProof] Lock result:', lockResult);

    if (!lockResult.acquired) {
      setStatusMessage(`❌ Lock failed: ${lockResult.reason}`);
      console.log('❌ [EditableCellProof] Lock acquisition failed:', lockResult.reason);
      return;
    }

    // Step 3: Lock acquired - enable editing
    setLockAcquired(true);
    setIsEditing(true);
    setStatusMessage(lockResult.warning ? `⚠️ ${lockResult.warning}` : '✅ Lock acquired');
    
    console.log('✅ [EditableCellProof] Lock acquired, editing enabled');
    
    // Focus input
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Handle value change (commit on blur/enter)
  const handleCommit = () => {
    if (!isEditing) return;

    console.log('🔵 [EditableCellProof] handleCommit triggered', { cellValue, isEditing });

    const newValue = parseFloat(cellValue) || cellValue;
    const currentValue = getEndpointProjection(filament);

    // Only commit if value changed
    if (newValue === currentValue) {
      setIsEditing(false);
      setLockAcquired(false);
      releaseLock(locusId, userId);
      setStatusMessage('No changes');
      console.log('🔵 [EditableCellProof] No changes, lock released');
      return;
    }

    console.log('🔵 [EditableCellProof] Building commit...', { newValue, currentValue });

    // Build commit
    const commit = buildCommit({
      filamentId: filament.id,
      parentCommitIndex: filament.timeBoxes.length - 1,
      operation: 'valueEdit',
      newValue,
      locusId,
      evidence: { userId, tool: 'EditableCellProof' },
    });

    console.log('🔵 [EditableCellProof] Commit built:', commit);

    // Append commit (immutable)
    const updatedFilament = appendCommit(filament, commit);
    console.log('🔵 [EditableCellProof] Filament updated:', { 
      oldLength: filament.timeBoxes.length, 
      newLength: updatedFilament.timeBoxes.length 
    });
    
    setFilament(updatedFilament);

    // Update cell projection
    const newProjection = getEndpointProjection(updatedFilament);
    setCellValue(newProjection);

    // Release lock
    setIsEditing(false);
    setLockAcquired(false);
    releaseLock(locusId, userId);
    setStatusMessage(`✅ Commit #${commit.eventIndex} appended: ${newValue}`);
    
    console.log('✅ [EditableCellProof] Commit complete!', { newProjection });
  };

  // Reset proof
  const handleReset = () => {
    setFilament(INITIAL_FILAMENT);
    setCellValue(getEndpointProjection(INITIAL_FILAMENT));
    setIsEditing(false);
    setLockAcquired(false);
    clearAllLocks();
    setStatusMessage('Reset to initial state');
  };

  // Replay commits
  const commits = replayCommits(filament);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      {/* Left Control Panel */}
      <div style={{
        width: '350px',
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '20px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '13px',
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#00ff00' }}>
          📝 Editable Endpoint Proof
        </h2>

        {/* Test Mode Toggle */}
        <div style={{ marginBottom: '15px', padding: '12px', background: testMode ? '#332200' : '#1a1a1a', borderRadius: '4px', border: testMode ? '2px solid #ffaa00' : 'none' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              style={{ marginRight: '8px', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ color: testMode ? '#ffaa00' : '#888' }}>
              🧪 Test Mode (bypass privacy gate)
            </span>
          </label>
          {testMode && (
            <div style={{ fontSize: '10px', color: '#ffaa00', marginTop: '5px' }}>
              ⚠️ Cell always editable for testing
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div style={{ marginBottom: '15px', padding: '10px', background: '#1a1a1a', borderRadius: '4px', fontSize: '11px' }}>
          <div style={{ color: '#888' }}>Distance: <span style={{ color: cameraDistance <= 5 ? '#00ff00' : '#ff0000' }}>{cameraDistance.toFixed(1)}</span></div>
          <div style={{ color: '#888' }}>Policy: <span style={{ color: '#00ffff' }}>L{policyLevel}</span></div>
          <div style={{ color: '#888' }}>Tier: <span style={{ color: tier.renderFlags.allowEngage ? '#00ff00' : '#ff0000' }}>{tier.label}</span></div>
        </div>

        {/* Policy Control */}
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ffaa00' }}>
            Policy Level: L{policyLevel}
          </label>
          <input
            type="range"
            min="0"
            max="6"
            step="1"
            value={policyLevel}
            onChange={(e) => setPolicyLevel(parseInt(e.target.value))}
            style={{ width: '100%', marginBottom: '5px' }}
          />
          <div style={{ fontSize: '11px', color: tier.renderFlags.allowEngage ? '#00ff00' : '#ff0000' }}>
            {tier.label} {tier.renderFlags.allowEngage ? '✓ Can engage' : '✗ Cannot engage'}
          </div>
          <div style={{ fontSize: '10px', color: '#888', marginTop: '5px' }}>
            {!tier.renderFlags.allowEngage && '⚠️ Zoom in close (<5 units) to enable engage'}
          </div>
        </div>

        {/* Cell Interface */}
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
          <div style={{ marginBottom: '10px', color: '#888' }}>Spreadsheet Cell (Endpoint):</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ 
              padding: '10px', 
              background: '#222', 
              border: `2px solid ${lockAcquired ? '#00ff00' : '#444'}`,
              marginRight: '10px',
              minWidth: '60px',
              textAlign: 'center',
              fontWeight: 'bold',
            }}>
              A1
            </div>
            <input
              ref={inputRef}
              type="text"
              value={cellValue}
              onChange={(e) => {
                if (isEditing) {
                  setCellValue(e.target.value);
                }
              }}
              onBlur={handleCommit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  console.log('🔵 [EditableCellProof] Enter key pressed');
                  handleCommit();
                }
              }}
              readOnly={!isEditing}
              onClick={(e) => {
                console.log('🔵🔵🔵 [EditableCellProof] Input clicked!', { isEditing, testMode });
                if (!isEditing) {
                  e.preventDefault();
                  handleCellClick();
                }
              }}
              style={{
                flex: 1,
                padding: '10px',
                background: isEditing ? '#003300' : '#1a1a1a',
                color: 'white',
                border: `2px solid ${isEditing ? '#00ff00' : '#444'}`,
                fontSize: '16px',
                fontFamily: 'monospace',
                cursor: !isEditing ? 'pointer' : 'text',
                pointerEvents: 'auto', // Force pointer events
              }}
              placeholder="Click to edit"
            />
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            {isEditing ? '✏️ Editing (blur or Enter to commit)' : '👆 Click cell to engage'}
          </div>
        </div>

        {/* Status */}
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
          <div style={{ marginBottom: '8px', color: '#888' }}>Status:</div>
          <div style={{ 
            padding: '10px', 
            background: '#1a1a1a', 
            borderRadius: '4px',
            fontSize: '11px',
            color: statusMessage.startsWith('✅') ? '#00ff00' : (statusMessage.startsWith('❌') ? '#ff0000' : '#ffaa00'),
          }}>
            {statusMessage || 'Ready'}
          </div>
        </div>

        {/* Commit History (Replay) */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px', color: '#888' }}>Commit History (Replay):</div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '11px' }}>
            {commits.map((commit, i) => (
              <div key={i} style={{ 
                padding: '8px', 
                background: i === commits.length - 1 ? '#003300' : '#1a1a1a',
                marginBottom: '4px',
                borderLeft: `3px solid ${i === commits.length - 1 ? '#00ff00' : '#444'}`,
              }}>
                <div style={{ color: '#00ffff' }}>#{commit.eventIndex}: {commit.operation}</div>
                <div style={{ color: '#ffffff' }}>Value: {commit.value}</div>
                <div style={{ color: '#888', fontSize: '10px' }}>
                  {new Date(commit.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div>
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '12px',
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '13px',
            }}
          >
            🔄 Reset Proof
          </button>
        </div>

        {/* Legend */}
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #333' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>
            <strong>Pass Criteria:</strong>
          </div>
          <ul style={{ fontSize: '10px', color: '#888', lineHeight: '1.6', paddingLeft: '20px' }}>
            <li>L0-L5: Cell click fails (cannot engage)</li>
            <li>L6 + close: Cell click succeeds</li>
            <li>Edit value → new commit appended</li>
            <li>Replay shows discrete commits</li>
            <li>No mutations (immutable appends only)</li>
          </ul>
        </div>
      </div>

      {/* 3D Viewport */}
      <div style={{ flex: 1, background: '#000' }}>
        <Canvas camera={{ position: [0, 3, 8], fov: 50 }}>
          <CameraDistanceTracker onDistanceChange={setCameraDistance} />
          
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />

          {/* Title */}
          <Text
            position={[0, 5, 0]}
            fontSize={0.6}
            color="#00ffff"
            anchorX="center"
            anchorY="middle"
          >
            Cell A1 Filament ({filament.timeBoxes.length} commits)
          </Text>
          
          {/* Distance indicator */}
          <Text
            position={[0, 4, 0]}
            fontSize={0.4}
            color={cameraDistance <= 5 ? "#00ff00" : "#ff0000"}
            anchorX="center"
            anchorY="middle"
          >
            Distance: {cameraDistance.toFixed(1)} {cameraDistance <= 5 ? "(Can engage)" : "(Too far)"}
          </Text>

          {/* Commit chain */}
          <CommitChain filament={filament} />

          {/* Grid */}
          <gridHelper args={[60, 60, '#222222', '#111111']} position={[0, -3, 0]} />

          <OrbitControls
            target={[0, 0, 0]}
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={30}
          />
        </Canvas>

        {/* Overlay status */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '370px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '12px 20px',
          fontFamily: 'monospace',
          fontSize: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          borderRadius: '4px',
        }}>
          <span>Commits: {filament.timeBoxes.length}</span>
          <span>Latest value: {getEndpointProjection(filament)}</span>
          <span style={{ color: lockAcquired ? '#00ff00' : '#888' }}>
            {lockAcquired ? '🔒 Locked' : '🔓 Unlocked'}
          </span>
        </div>
      </div>
    </div>
  );
}
