/**
 * WORKFLOW PROOF DEMO
 * 
 * Proves:
 * - Spreadsheet cell = projection of filament's latest +X face
 * - Error attributable to one discrete commit
 * - Causality reconstructible without narrative UI
 * 
 * Story: Invoice Amount column with rate conversion error
 */

import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import PresenceLayer from '../components/PresenceLayer';
import { presenceService } from '../services/presenceService';

// Workflow proof data: Amount column with error
const WORKFLOW_FILAMENT = {
  id: 'amount-col-001',
  name: 'Invoice Amount',
  baselineMagnitude: 1250,
  magnitudeUnit: 'USD',
  columnIndex: 0,
  timeBoxes: [
    {
      id: 'tb0',
      eventIndex: 0,
      timestamp: 1000,
      faces: {
        output: { value: '$1,250.00 USD', type: 'text' },
        semanticMeaning: { label: 'Raw Input' },
        magnitude: { confidence: 1.0 },
        input: { dependencies: [] },
        identity: { filamentId: 'amount-col-001', eventIndex: 0, versionHash: 'a1b2c3' },
        evidence: { type: 'document', pointer: 'invoice_2024_001.pdf', reference: 'Line 12' },
      }
    },
    {
      id: 'tb1',
      eventIndex: 1,
      timestamp: 1100,
      faces: {
        output: { value: '1250.00', type: 'numeric' },
        semanticMeaning: { label: 'Parsed Number' },
        magnitude: { confidence: 0.99 },
        input: { dependencies: ['tb0'] },
        identity: { filamentId: 'amount-col-001', eventIndex: 1, versionHash: 'd4e5f6' },
        evidence: { type: 'commit', pointer: 'parse_commit#hash1' },
      }
    },
    {
      id: 'tb2',
      eventIndex: 2,
      timestamp: 1200,
      faces: {
        output: { value: '1250.00', type: 'numeric' },
        semanticMeaning: { label: 'Validated (>0)' },
        magnitude: { confidence: 0.95 },
        input: { dependencies: ['tb1'] },
        identity: { filamentId: 'amount-col-001', eventIndex: 2, versionHash: 'g7h8i9' },
        evidence: { type: 'commit', pointer: 'filter_commit#hash2' },
      }
    },
    {
      id: 'tb3',
      eventIndex: 3,
      timestamp: 1300,
      faces: {
        output: { value: '€1,150.00', type: 'numeric' },
        semanticMeaning: { label: 'EUR Converted' },
        magnitude: { confidence: 1.0 },
        input: { dependencies: ['tb2'] },
        identity: { filamentId: 'amount-col-001', eventIndex: 3, versionHash: 'j1k2l3' },
        evidence: { type: 'commit', pointer: 'convert_rate=0.92' },
      }
    },
    {
      id: 'tb4',
      eventIndex: 4,
      timestamp: 1400,
      faces: {
        output: { value: '€-1,150.00', type: 'numeric' },
        semanticMeaning: { label: 'EUR Converted (ERROR)' },
        magnitude: { confidence: 0.0 },
        input: { dependencies: ['tb2'] }, // Same source, different rate
        identity: { filamentId: 'amount-col-001', eventIndex: 4, versionHash: 'm4n5o6' },
        evidence: { type: 'commit', pointer: 'convert_rate=-0.92 (ERROR)' },
      }
    },
    {
      id: 'tb5',
      eventIndex: 5,
      timestamp: 1500,
      faces: {
        output: { value: 'ERROR: Negative', type: 'text' },
        semanticMeaning: { label: 'Validation Failed' },
        magnitude: { confidence: 0.0 },
        input: { dependencies: ['tb4'] },
        identity: { filamentId: 'amount-col-001', eventIndex: 5, versionHash: 'p7q8r9' },
        evidence: { type: 'commit', pointer: 'validation_check#fail' },
      }
    },
  ],
  events: [
    { id: 'e0', type: 'STAMP', eventIndex: 0, label: 'Load USD', params: { type: 'stamp', operation: 'Load' } },
    { id: 'e1', type: 'KINK', eventIndex: 1, label: 'Parse', params: { type: 'kink', transform: 'parse', direction: 'none' } },
    { id: 'e2', type: 'GATE', eventIndex: 2, label: 'Filter >0', params: { type: 'gate', condition: 'amount > 0', passRatio: 1.0 } },
    { id: 'e3', type: 'KINK', eventIndex: 3, label: 'USD→EUR @0.92', params: { type: 'kink', transform: 'cast', direction: 'none' } },
    { id: 'e4', type: 'SCAR', eventIndex: 4, label: 'RATE ERROR -0.92', params: { type: 'scar', mergeType: 'reconcile', sourceFilaments: [] } },
    { id: 'e5', type: 'STAMP', eventIndex: 5, label: 'Validation Fail', params: { type: 'stamp', operation: 'Validate' } },
  ],
};

/**
 * SPREADSHEET CELL RENDERER
 * 
 * Cell = projection of latest +X face only
 */
function SpreadsheetCell({ value, isError, onClick, isSelected }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 180,
        padding: '12px 16px',
        background: isError ? 'rgba(231, 76, 60, 0.2)' : 'rgba(255, 255, 255, 0.05)',
        border: isSelected 
          ? '2px solid #FFD700' 
          : isError 
            ? '1px solid #E74C3C' 
            : '1px solid #4A4A4A',
        borderRadius: 4,
        fontFamily: 'monospace',
        fontSize: 14,
        color: isError ? '#E74C3C' : '#E6E6E6',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'right',
      }}
    >
      {value}
    </div>
  );
}

/**
 * SPREADSHEET COLUMN
 */
function SpreadsheetColumn({ filament, cursorIndex, onCellClick, selectedCell }) {
  // Get current value (latest +X face up to cursor)
  const getCurrentValue = () => {
    const visibleBoxes = filament.timeBoxes.filter(tb => tb.eventIndex <= cursorIndex);
    if (visibleBoxes.length === 0) return '';
    const latest = visibleBoxes[visibleBoxes.length - 1];
    return latest.faces.output.value;
  };
  
  const currentValue = getCurrentValue();
  const isError = currentValue.includes('ERROR') || currentValue.includes('-');
  
  return (
    <div style={{
      position: 'absolute',
      top: 120,
      left: 40,
      background: 'rgba(0, 0, 0, 0.9)',
      padding: 20,
      borderRadius: 8,
      border: '1px solid #4A90E2',
    }}>
      <div style={{
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#888',
        marginBottom: 8,
      }}>
        Column: Amount
      </div>
      <SpreadsheetCell
        value={currentValue}
        isError={isError}
        onClick={onCellClick}
        isSelected={selectedCell}
      />
      <div style={{
        fontFamily: 'monospace',
        fontSize: 10,
        color: '#666',
        marginTop: 8,
        fontStyle: 'italic',
      }}>
        {selectedCell ? 'Filament visible →' : 'Click to inspect →'}
      </div>
    </div>
  );
}

/**
 * TIME BOX RENDERER (with face inspection)
 */
function TimeBoxRenderer({ timeBox, xPosition, showLabel, isErrorCommit }) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <group position={[xPosition, 0, 0]}>
      {/* Cube wireframe */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial
          color={hovered ? '#FFD700' : isErrorCommit ? '#E74C3C' : '#4A90E2'}
          transparent
          opacity={isErrorCommit ? 0.6 : 0.4}
          wireframe
        />
      </mesh>
      
      {/* +X Face: Output (current belief) */}
      {(showLabel || hovered) && (
        <Text
          position={[0.76, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.25}
          color={isErrorCommit ? '#E74C3C' : '#E6E6E6'}
          anchorX="center"
          anchorY="middle"
          maxWidth={1.2}
        >
          {String(timeBox.faces.output.value).substring(0, 20)}
        </Text>
      )}
      
      {/* +Y Face: Semantic Meaning (intent) */}
      {hovered && (
        <Text
          position={[0, 0.76, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color="#A0A0A0"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.2}
        >
          {timeBox.faces.semanticMeaning.label}
        </Text>
      )}
      
      {/* -Z Face: Evidence Pointer (source) */}
      {hovered && (
        <Text
          position={[0, 0, -0.76]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.15}
          color="#666666"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.2}
        >
          {timeBox.faces.evidence?.pointer || `#${timeBox.id}`}
        </Text>
      )}
      
      {/* Error indicator (pulsing glow) */}
      {isErrorCommit && (
        <mesh>
          <boxGeometry args={[1.7, 1.7, 1.7]} />
          <meshBasicMaterial
            color="#E74C3C"
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>
      )}
      
      {/* Hover glow */}
      {hovered && !isErrorCommit && (
        <mesh>
          <boxGeometry args={[1.6, 1.6, 1.6]} />
          <meshBasicMaterial
            color="#FFD700"
            transparent
            opacity={0.1}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * GLYPH RENDERER
 */
function GlyphRenderer({ event, xPosition, showLabel, isErrorGlyph }) {
  const [hovered, setHovered] = useState(false);
  
  const getGlyphGeometry = () => {
    switch (event.type) {
      case 'STAMP':
        return <torusGeometry args={[0.5, 0.1, 8, 16]} />;
      case 'KINK':
        return <coneGeometry args={[0.3, 1, 8]} />;
      case 'GATE':
        return <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />;
      case 'SCAR':
        return <torusGeometry args={[0.6, 0.15, 8, 16]} />;
      default:
        return <sphereGeometry args={[0.4, 16, 16]} />;
    }
  };
  
  const getGlyphColor = () => {
    if (isErrorGlyph) return '#E74C3C';
    const colors = {
      STAMP: '#E6E6E6',
      KINK: '#4A90E2',
      GATE: '#2ECC71',
      SCAR: '#E67E22',
    };
    return colors[event.type] || '#FFFFFF';
  };
  
  return (
    <group position={[xPosition, 2, 0]}>
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {getGlyphGeometry()}
        <meshStandardMaterial
          color={hovered ? '#FFD700' : getGlyphColor()}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {(showLabel || hovered) && (
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.35}
          color={isErrorGlyph ? '#E74C3C' : '#E6E6E6'}
          anchorX="center"
          anchorY="bottom"
        >
          {event.label}
        </Text>
      )}
    </group>
  );
}

/**
 * FILAMENT PIPE
 */
function FilamentPipe({ length }) {
  const curve = new THREE.LineCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(length, 0, 0)
  );
  
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.35, 16, false]} />
        <meshStandardMaterial
          color="#4A90E2"
          transparent
          opacity={0.5}
          roughness={0.7}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.25, 16, false]} />
        <meshStandardMaterial
          color="#3A7AC2"
          transparent
          opacity={0.3}
          roughness={0.7}
          metalness={0.2}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

/**
 * FILAMENT RENDERER
 */
function FilamentRenderer({ filament, cursorIndex, showLabels }) {
  const DELTA_X = 10;
  
  const positions = filament.timeBoxes.map((tb, i) => ({
    timeBox: tb,
    xPosition: i * DELTA_X,
  }));
  
  const totalLength = (filament.timeBoxes.length - 1) * DELTA_X + 5;
  const eventIndexToX = new Map(filament.timeBoxes.map((tb, i) => [tb.eventIndex, i * DELTA_X]));
  
  return (
    <group>
      <FilamentPipe length={totalLength} />
      
      {positions.map(({ timeBox, xPosition }) => {
        if (timeBox.eventIndex > cursorIndex) return null;
        const isError = timeBox.eventIndex === 4 || timeBox.eventIndex === 5;
        return (
          <TimeBoxRenderer
            key={timeBox.id}
            timeBox={timeBox}
            xPosition={xPosition}
            showLabel={showLabels}
            isErrorCommit={isError}
          />
        );
      })}
      
      {filament.events
        .filter(event => event.eventIndex <= cursorIndex)
        .map((event) => {
          const xPos = eventIndexToX.get(event.eventIndex) ?? event.eventIndex * DELTA_X;
          const isError = event.eventIndex === 4 || event.eventIndex === 5;
          return (
            <GlyphRenderer
              key={event.id}
              event={event}
              xPosition={xPos}
              showLabel={showLabels}
              isErrorGlyph={isError}
            />
          );
        })}
    </group>
  );
}

/**
 * CAMERA SNAP CONTROLLER
 */
function CameraSnapController({ targetPosition, shouldSnap, onSnapComplete }) {
  const { camera } = useThree();
  const startPos = useRef(null);
  const progress = useRef(0);
  
  useEffect(() => {
    if (!shouldSnap) return;
    
    startPos.current = camera.position.clone();
    progress.current = 0;
    
    const animate = () => {
      progress.current += 0.15; // Fast snap - viewer motion only, not truth animation
      if (progress.current >= 1) {
        camera.position.copy(targetPosition);
        onSnapComplete();
        return;
      }
      
      camera.position.lerpVectors(startPos.current, targetPosition, progress.current);
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [shouldSnap, targetPosition, camera, onSnapComplete]);
  
  return null;
}

/**
 * PLAYBACK MOTOR
 */
function PlaybackMotor({ 
  isPlaying, 
  onPlayPause, 
  onStep,
  onReset,
  speed, 
  onSpeedChange,
  cursorIndex,
  maxIndex,
}) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.9)',
      padding: '15px 25px',
      borderRadius: 8,
      display: 'flex',
      gap: 15,
      alignItems: 'center',
      fontFamily: 'monospace',
      color: '#E6E6E6',
      border: '1px solid #4A90E2',
    }}>
      <button onClick={onPlayPause} style={{
        background: isPlaying ? '#E74C3C' : '#2ECC71',
        border: 'none',
        color: 'white',
        padding: '8px 16px',
        borderRadius: 4,
        cursor: 'pointer',
        fontWeight: 'bold',
      }}>
        {isPlaying ? '⏸ Pause' : '▶ Play'}
      </button>
      
      <button onClick={onStep} disabled={cursorIndex >= maxIndex} style={{
        background: '#4A90E2',
        border: 'none',
        color: 'white',
        padding: '8px 16px',
        borderRadius: 4,
        cursor: cursorIndex >= maxIndex ? 'not-allowed' : 'pointer',
        opacity: cursorIndex >= maxIndex ? 0.5 : 1,
      }}>
        ⏭ Step
      </button>
      
      <button onClick={onReset} style={{
        background: '#666666',
        border: 'none',
        color: 'white',
        padding: '8px 16px',
        borderRadius: 4,
        cursor: 'pointer',
      }}>
        ↺ Reset
      </button>
      
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>Tempo:</span>
        <select value={speed} onChange={(e) => onSpeedChange(parseFloat(e.target.value))} style={{
          background: '#1A1E24',
          color: '#E6E6E6',
          border: '1px solid #4A90E2',
          padding: '4px 8px',
          borderRadius: 4,
        }}>
          <option value="0.25">0.25×</option>
          <option value="0.5">0.5×</option>
          <option value="1">1×</option>
          <option value="2">2×</option>
          <option value="4">4×</option>
        </select>
      </div>
      
      <div style={{
        borderLeft: '1px solid #4A90E2',
        paddingLeft: 15,
        fontSize: 14,
      }}>
        Commit: {cursorIndex} / {maxIndex}
      </div>
    </div>
  );
}

/**
 * MAIN WORKFLOW PROOF SCENE
 */
export default function WorkflowProofScene() {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedCell, setSelectedCell] = useState(false);
  const [shouldSnapCamera, setShouldSnapCamera] = useState(false);
  const [cameraDistance, setCameraDistance] = useState(50);
  
  const maxIndex = WORKFLOW_FILAMENT.timeBoxes.length - 1;
  
  // Mock presence data (simulate other viewers inspecting this KPI)
  useEffect(() => {
    // Simulate 3 Finance inspecting commit 4 (the error commit)
    presenceService.heartbeat(
      { filamentId: WORKFLOW_FILAMENT.id, commitIndex: 4, lensContext: 'workflow' },
      'finance-session-1'
    );
    presenceService.heartbeat(
      { filamentId: WORKFLOW_FILAMENT.id, commitIndex: 4, lensContext: 'workflow' },
      'finance-session-2'
    );
    presenceService.heartbeat(
      { filamentId: WORKFLOW_FILAMENT.id, commitIndex: 4, lensContext: 'workflow' },
      'finance-session-3'
    );
    
    // Keep heartbeats alive
    const interval = setInterval(() => {
      presenceService.heartbeat(
        { filamentId: WORKFLOW_FILAMENT.id, commitIndex: 4, lensContext: 'workflow' },
        'finance-session-1'
      );
      presenceService.heartbeat(
        { filamentId: WORKFLOW_FILAMENT.id, commitIndex: 4, lensContext: 'workflow' },
        'finance-session-2'
      );
      presenceService.heartbeat(
        { filamentId: WORKFLOW_FILAMENT.id, commitIndex: 4, lensContext: 'workflow' },
        'finance-session-3'
      );
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Playback motor
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCursorIndex(prev => {
        if (prev >= maxIndex) {
          setIsPlaying(false);
          return maxIndex;
        }
        return prev + 1;
      });
    }, 1000 / speed);
    
    return () => clearInterval(interval);
  }, [isPlaying, speed, maxIndex]);
  
  const handlePlayPause = () => {
    if (cursorIndex >= maxIndex) {
      setCursorIndex(0);
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleStep = () => {
    setCursorIndex(prev => Math.min(prev + 1, maxIndex));
  };
  
  const handleReset = () => {
    setCursorIndex(0);
    setIsPlaying(false);
  };
  
  const handleCellClick = () => {
    setSelectedCell(true);
    setShouldSnapCamera(true);
  };
  
  const targetCameraPosition = new THREE.Vector3(30, 15, 40);
  const showLabels = cameraDistance < 60 || selectedCell;
  
  // Compute lociInView for presence (visible timeboxes)
  const lociInView = WORKFLOW_FILAMENT.timeBoxes
    .filter(tb => tb.eventIndex <= cursorIndex)
    .map(tb => ({
      filamentId: WORKFLOW_FILAMENT.id,
      commitIndex: tb.eventIndex,
    }));
  
  // Compute anchorMap (eventIndex → xPosition) for presence positioning
  const DELTA_X = 10;
  const anchorMap = new Map(
    WORKFLOW_FILAMENT.timeBoxes.map((tb, i) => [tb.eventIndex, i * DELTA_X])
  );
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0A0E14' }}>
      {/* Spreadsheet Column (cell projection) */}
      <SpreadsheetColumn
        filament={WORKFLOW_FILAMENT}
        cursorIndex={cursorIndex}
        onCellClick={handleCellClick}
        selectedCell={selectedCell}
      />
      
      {/* Info */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        background: 'rgba(0, 0, 0, 0.9)',
        padding: 15,
        borderRadius: 8,
        color: '#E6E6E6',
        fontFamily: 'monospace',
        fontSize: 11,
        border: '1px solid #4A90E2',
        maxWidth: 280,
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#4A90E2' }}>
          WORKFLOW PROOF
        </div>
        <div style={{ fontSize: 10, lineHeight: 1.5, color: '#AAA' }}>
          This proves: spreadsheet cells are projections of filament +X faces.
          Errors are attributable to discrete commits. Causality is reconstructible.
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: '#666' }}>
          • Click cell to inspect filament<br/>
          • Hover Time Box to see faces<br/>
          • Step through commits<br/>
          • Watch error appear at commit 4
        </div>
      </div>
      
      {/* 3D Scene - Always rendered, camera position changes on cell select */}
      <Canvas
        camera={{ position: selectedCell ? [30, 15, 40] : [60, 30, 80], fov: 50 }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        
        {/* Minimal axes (faint) */}
        <Line points={[[0, 0, 0], [60, 0, 0]]} color="#3A3A3A" lineWidth={1} />
        <Line points={[[0, -5, 0], [0, 5, 0]]} color="#3A3A3A" lineWidth={1} />
        
        {/* Filament - dimmed when not selected */}
        <group opacity={selectedCell ? 1.0 : 0.3}>
          <FilamentRenderer
            filament={WORKFLOW_FILAMENT}
            cursorIndex={cursorIndex}
            showLabels={showLabels && selectedCell}
          />
        </group>
        
        {/* Presence Layer (Tier 1: counts only) */}
        {selectedCell && (
          <PresenceLayer
            lociInView={lociInView}
            anchorMap={anchorMap}
            cameraDistance={cameraDistance}
            lensContext="workflow"
          />
        )}
        
        <OrbitControls
          target={[25, 0, 0]}
          enableRotate={selectedCell}
          enableZoom={selectedCell}
          enablePan={selectedCell}
          onChange={(e) => {
            if (e?.target?.object) {
              const dist = e.target.object.position.distanceTo(new THREE.Vector3(25, 0, 0));
              setCameraDistance(dist);
            }
          }}
        />
        
        <CameraSnapController
          targetPosition={targetCameraPosition}
          shouldSnap={shouldSnapCamera}
          onSnapComplete={() => setShouldSnapCamera(false)}
        />
      </Canvas>
      
      {/* Playback Motor (always visible) */}
      <PlaybackMotor
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onStep={handleStep}
        onReset={handleReset}
        speed={speed}
        onSpeedChange={setSpeed}
        cursorIndex={cursorIndex}
        maxIndex={maxIndex}
      />
    </div>
  );
}
