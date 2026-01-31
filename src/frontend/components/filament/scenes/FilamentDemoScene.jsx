/**
 * FILAMENT DEMO SCENE - Canonical Truth View
 * 
 * Proves the filament language:
 * - Horizontal filament along X (event order)
 * - Time Boxes at commits
 * - All 8 glyphs (far/near)
 * - Playback motor (transport controls)
 * - Event-normalized vs time-weighted spacing toggle
 */

import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import PresenceLayer from '../components/PresenceLayer';
import { presenceService } from '../services/presenceService';

// Mock data for demo
const DEMO_FILAMENT = {
  id: 'invoice-001',
  name: 'Invoice Processing',
  baselineMagnitude: 1250,
  magnitudeUnit: 'USD',
  timeBoxes: [
    { 
      id: 'tb0', 
      eventIndex: 0, 
      timestamp: 1000, 
      faces: { 
        output: { value: 'Loaded', type: 'text' },
        semanticMeaning: { label: 'Data Source' },
        magnitude: { confidence: 1.0 },
        evidence: { type: 'document', pointer: 'invoice_raw.csv' }
      }
    },
    { 
      id: 'tb1', 
      eventIndex: 1, 
      timestamp: 1500, 
      faces: { 
        output: { value: 'Parsed', type: 'text' },
        semanticMeaning: { label: 'Format Conversion' },
        magnitude: { confidence: 0.95 },
        evidence: { type: 'commit', pointer: 'parse_commit#a1f3' }
      }
    },
    { 
      id: 'tb2', 
      eventIndex: 2, 
      timestamp: 8000, // Long gap (inactivity)
      faces: { 
        output: { value: 'Filtered', type: 'text' },
        semanticMeaning: { label: 'Validation' },
        magnitude: { confidence: 0.9 },
        evidence: { type: 'commit', pointer: 'filter_commit#b2e4' }
      }
    },
    { 
      id: 'tb3', 
      eventIndex: 3, 
      timestamp: 9000,
      faces: { 
        output: { value: '$1,250.00', type: 'numeric' },
        semanticMeaning: { label: 'Amount Converted' },
        magnitude: { confidence: 1.0 },
        evidence: { type: 'commit', pointer: 'convert_commit#c3d5' }
      }
    },
    { 
      id: 'tb4', 
      eventIndex: 4, 
      timestamp: 9200,
      faces: { 
        output: { value: 'Encrypted', type: 'text' },
        semanticMeaning: { label: 'Security' },
        magnitude: { confidence: 1.0 },
        evidence: { type: 'commit', pointer: 'encrypt_commit#d4e6' }
      }
    },
    { 
      id: 'tb5', 
      eventIndex: 5, 
      timestamp: 10000,
      faces: { 
        output: { value: 'Verified', type: 'text' },
        semanticMeaning: { label: 'Audit Trail' },
        magnitude: { confidence: 1.0 },
        evidence: { type: 'commit', pointer: 'verify_commit#e5f7' }
      }
    },
  ],
  events: [
    { id: 'e0', type: 'STAMP', eventIndex: 0, label: 'Load', params: { type: 'stamp', operation: 'Load CSV' } },
    { id: 'e1', type: 'KINK', eventIndex: 1, label: 'Parse', params: { type: 'kink', transform: 'parse', direction: 'none' } },
    { id: 'e2', type: 'GATE', eventIndex: 2, label: 'Filter nulls', params: { type: 'gate', condition: 'amount > 0', passRatio: 0.85 } },
    { id: 'e3', type: 'KINK', eventIndex: 3, label: 'USD→EUR', params: { type: 'kink', transform: 'cast', direction: 'up' } },
    { id: 'e4', type: 'TWIST', eventIndex: 4, label: 'Encrypt', params: { type: 'twist', method: 'encrypt', frequency: 2 } },
    { id: 'e5', type: 'UNTWIST', eventIndex: 5, label: 'Decrypt', params: { type: 'untwist', method: 'decrypt', frequency: 2, verified: true } },
  ],
};

/**
 * AXES RENDERER
 * 
 * Forensic style: faint, neutral, secondary
 */
function AxisRenderer({ showLabels = false, showDebugGrid = false }) {
  return (
    <>
      {/* X axis - Event Order (faint) */}
      <Line
        points={[[0, 0, 0], [100, 0, 0]]}
        color="#4A4A4A"
        lineWidth={1}
      />
      {showLabels && (
        <Text position={[105, 0, 0]} fontSize={1.5} color="#666666">
          X
        </Text>
      )}
      
      {/* Y axis - Magnitude (faint) */}
      <Line
        points={[[0, -10, 0], [0, 10, 0]]}
        color="#4A4A4A"
        lineWidth={1}
      />
      {showLabels && (
        <Text position={[0, 12, 0]} fontSize={1.5} color="#666666">
          Y
        </Text>
      )}
      
      {/* Z axis - Eligibility (faint) */}
      <Line
        points={[[0, 0, -10], [0, 0, 10]]}
        color="#4A4A4A"
        lineWidth={1}
      />
      {showLabels && (
        <Text position={[0, 0, 12]} fontSize={1.5} color="#666666">
          Z
        </Text>
      )}
      
      {/* Grid - debug only */}
      {showDebugGrid && (
        <Grid
          args={[100, 100]}
          cellSize={10}
          cellThickness={0.5}
          cellColor="#2A2A2A"
          sectionSize={50}
          sectionThickness={1}
          sectionColor="#3A3A3A"
          fadeDistance={200}
          fadeStrength={1}
          position={[50, -1, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      )}
    </>
  );
}

/**
 * TIME BOX RENDERER
 * 
 * Complete Truth Atom with face semantics
 */
function TimeBoxRenderer({ timeBox, xPosition, showLabel }) {
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
          color={hovered ? '#FFD700' : '#4A90E2'}
          transparent
          opacity={0.4}
          wireframe
        />
      </mesh>
      
      {/* +X Face: Output (current belief) */}
      {(showLabel || hovered) && (
        <Text
          position={[0.76, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.25}
          color="#E6E6E6"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.2}
        >
          {timeBox.faces.output.value}
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
      
      {/* Hover indicator (subtle glow) */}
      {hovered && (
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
 * GAP SEGMENT RENDERER (for time-weighted spacing)
 * 
 * CRITICAL: No new geometry for silence. Only dashed line.
 */
function GapSegment({ startX, endX }) {
  const centerX = (startX + endX) / 2;
  const length = endX - startX;
  
  return (
    <group position={[centerX, 0, 0]}>
      {/* Dashed line to show gap - NO OTHER GEOMETRY */}
      <Line
        points={[[-length/2, 0, 0], [length/2, 0, 0]]}
        color="#444444"
        lineWidth={1}
        dashed
        dashSize={0.5}
        gapSize={0.3}
      />
    </group>
  );
}

/**
 * GLYPH RENDERER (simple silhouettes for now)
 */
function GlyphRenderer({ event, xPosition, showLabel }) {
  const [hovered, setHovered] = useState(false);
  
  // Simple glyph geometry based on type
  const getGlyphGeometry = () => {
    switch (event.type) {
      case 'STAMP':
        return <torusGeometry args={[0.5, 0.1, 8, 16]} />;
      case 'KINK':
        return <coneGeometry args={[0.3, 1, 8]} />;
      case 'GATE':
        return <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />;
      case 'TWIST':
      case 'UNTWIST':
        return <torusKnotGeometry args={[0.4, 0.1, 32, 8]} />;
      default:
        return <sphereGeometry args={[0.4, 16, 16]} />;
    }
  };
  
  const getGlyphColor = () => {
    const colors = {
      STAMP: '#E6E6E6',
      KINK: '#4A90E2',
      DENT: '#F39C12',
      TWIST: '#9B59B6',
      UNTWIST: '#9B59B6',
      GATE: '#E74C3C',
      SPLIT: '#2ECC71',
      SCAR: '#E67E22',
    };
    return colors[event.type] || '#FFFFFF';
  };
  
  return (
    <group position={[xPosition, 2, 0]}>
      {/* Glyph silhouette */}
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
      
      {/* Label (near mode) */}
      {showLabel && (
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.4}
          color="#E6E6E6"
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
 * FILAMENT PIPE RENDERER
 * 
 * Hollow pipe with semantic surface feel
 */
function FilamentPipe({ length }) {
  const curve = new THREE.LineCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(length, 0, 0)
  );
  
  return (
    <group>
      {/* Outer tube */}
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
      
      {/* Inner tube (inverted normals for hollow feel) */}
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
 * FILAMENT RENDERER (complete)
 */
function FilamentRenderer({ filament, spacingMode, showLabels, cameraDistance, cursorIndex }) {
  const DELTA_X = 10; // Base event window spacing (canonical)
  
  // Compute positions based on spacing mode
  const computePositions = () => {
    if (spacingMode === 'event-normalized') {
      // Equal spacing - pure causality
      return {
        items: filament.timeBoxes.map((tb, i) => ({
          timeBox: tb,
          xPosition: i * DELTA_X,
        })),
        eventIndexToX: new Map(filament.timeBoxes.map((tb, i) => [tb.eventIndex, i * DELTA_X])),
      };
    } else {
      // Time-weighted - additive gaps over base Δx
      let items = [];
      let currentX = 0;
      let eventIndexToX = new Map();
      
      for (let i = 0; i < filament.timeBoxes.length; i++) {
        const tb = filament.timeBoxes[i];
        items.push({ timeBox: tb, xPosition: currentX });
        eventIndexToX.set(tb.eventIndex, currentX);
        
        // Always advance base Δx (canonical event window)
        currentX += DELTA_X;
        
        // Add extra gap if time delta demands it (capped to prevent explosion)
        if (i < filament.timeBoxes.length - 1) {
          const nextTb = filament.timeBoxes[i + 1];
          const timeDelta = nextTb.timestamp - tb.timestamp;
          const MAX_EXTRA_GAP = 60; // Cap visual gap for long idle periods
          const extraGap = Math.min(MAX_EXTRA_GAP, Math.max(0, (timeDelta / 100) - DELTA_X));
          
          if (extraGap > 0) {
            items.push({
              isGap: true,
              startX: currentX,
              endX: currentX + extraGap,
            });
            currentX += extraGap;
          }
        }
      }
      
      return { items, eventIndexToX };
    }
  };
  
  const { items, eventIndexToX } = computePositions();
  
  // Compute total length correctly (max of last timeBox or last gap)
  const totalLength = Math.max(
    ...items
      .filter(item => !item.isGap)
      .map(item => item.xPosition),
    ...items
      .filter(item => item.isGap)
      .map(item => item.endX),
    60 // Minimum
  );
  
  return (
    <group>
      {/* Filament pipe */}
      <FilamentPipe length={totalLength} />
      
      {/* Time Boxes and Gaps (only up to cursor) */}
      {items.map((item, i) => {
        if (item.isGap) {
          // Only show gap if the preceding commit is revealed
          const prevItem = items[i - 1];
          if (prevItem && !prevItem.isGap && prevItem.timeBox.eventIndex <= cursorIndex) {
            return <GapSegment key={`gap-${i}`} startX={item.startX} endX={item.endX} />;
          }
          return null;
        } else {
          // Only show Time Box if revealed by cursor
          if (item.timeBox.eventIndex <= cursorIndex) {
            return (
              <TimeBoxRenderer
                key={item.timeBox.id}
                timeBox={item.timeBox}
                xPosition={item.xPosition}
                showLabel={showLabels}
              />
            );
          }
          return null;
        }
      })}
      
      {/* Glyphs (use correct X position from eventIndexToX, only up to cursor) */}
      {filament.events
        .filter(event => event.eventIndex <= cursorIndex)
        .map((event) => {
          const xPos = eventIndexToX.get(event.eventIndex) ?? event.eventIndex * DELTA_X;
          return (
            <GlyphRenderer
              key={event.id}
              event={event}
              xPosition={xPos}
              showLabel={showLabels}
            />
          );
        })}
    </group>
  );
}

/**
 * PLAYBACK MOTOR (Transport Controls)
 */
function PlaybackMotor({ 
  isPlaying, 
  onPlayPause, 
  onStep, 
  speed, 
  onSpeedChange,
  spacingMode,
  onSpacingToggle 
}) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '15px 25px',
      borderRadius: 8,
      display: 'flex',
      gap: 15,
      alignItems: 'center',
      fontFamily: 'monospace',
      color: '#E6E6E6',
      border: '1px solid #4A90E2',
    }}>
      {/* Play/Pause */}
      <button
        onClick={onPlayPause}
        style={{
          background: isPlaying ? '#E74C3C' : '#2ECC71',
          border: 'none',
          color: 'white',
          padding: '8px 16px',
          borderRadius: 4,
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        {isPlaying ? '⏸ Pause' : '▶ Play'}
      </button>
      
      {/* Step */}
      <button
        onClick={onStep}
        style={{
          background: '#4A90E2',
          border: 'none',
          color: 'white',
          padding: '8px 16px',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        ⏭ Step
      </button>
      
      {/* Speed */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>Tempo:</span>
        <select
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          style={{
            background: '#1A1E24',
            color: '#E6E6E6',
            border: '1px solid #4A90E2',
            padding: '4px 8px',
            borderRadius: 4,
          }}
        >
          <option value="0.25">0.25×</option>
          <option value="0.5">0.5×</option>
          <option value="1">1×</option>
          <option value="2">2×</option>
          <option value="4">4×</option>
        </select>
      </div>
      
      {/* Spacing Mode Toggle */}
      <div style={{ 
        borderLeft: '1px solid #4A90E2', 
        paddingLeft: 15,
        display: 'flex',
        gap: 8,
        alignItems: 'center'
      }}>
        <span>Spacing:</span>
        <button
          onClick={onSpacingToggle}
          style={{
            background: spacingMode === 'event-normalized' ? '#4A90E2' : '#666666',
            border: 'none',
            color: 'white',
            padding: '4px 12px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {spacingMode === 'event-normalized' ? 'Event' : 'Time'}
        </button>
      </div>
    </div>
  );
}

/**
 * MAIN SCENE
 */
export default function FilamentDemoScene() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [spacingMode, setSpacingMode] = useState('event-normalized');
  const [cameraDistance, setCameraDistance] = useState(50);
  const [cursorIndex, setCursorIndex] = useState(0); // Start at beginning for playback proof
  
  // Mock presence data (simulate other viewers at different commits)
  useEffect(() => {
    // Simulate 2 viewers at commit 2
    presenceService.heartbeat(
      { filamentId: DEMO_FILAMENT.id, commitIndex: 2, lensContext: 'workflow' },
      'mock-session-1'
    );
    presenceService.heartbeat(
      { filamentId: DEMO_FILAMENT.id, commitIndex: 2, lensContext: 'workflow' },
      'mock-session-2'
    );
    
    // Simulate 1 viewer at commit 4
    presenceService.heartbeat(
      { filamentId: DEMO_FILAMENT.id, commitIndex: 4, lensContext: 'workflow' },
      'mock-session-3'
    );
    
    // Keep heartbeats alive
    const interval = setInterval(() => {
      presenceService.heartbeat(
        { filamentId: DEMO_FILAMENT.id, commitIndex: 2, lensContext: 'workflow' },
        'mock-session-1'
      );
      presenceService.heartbeat(
        { filamentId: DEMO_FILAMENT.id, commitIndex: 2, lensContext: 'workflow' },
        'mock-session-2'
      );
      presenceService.heartbeat(
        { filamentId: DEMO_FILAMENT.id, commitIndex: 4, lensContext: 'workflow' },
        'mock-session-3'
      );
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Playback motor - advance cursor when playing
  React.useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCursorIndex(prev => {
        const maxIndex = DEMO_FILAMENT.timeBoxes.length - 1;
        if (prev >= maxIndex) {
          setIsPlaying(false); // Stop at end
          return maxIndex;
        }
        return prev + 1;
      });
    }, 1000 / speed); // Tempo-based
    
    return () => clearInterval(interval);
  }, [isPlaying, speed]);
  
  const handlePlayPause = () => {
    if (cursorIndex >= DEMO_FILAMENT.timeBoxes.length - 1) {
      // Restart from beginning
      setCursorIndex(0);
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleStep = () => {
    setCursorIndex(prev => Math.min(prev + 1, DEMO_FILAMENT.timeBoxes.length - 1));
  };
  
  const handleSpacingToggle = () => {
    setSpacingMode(prev => 
      prev === 'event-normalized' ? 'time-weighted' : 'event-normalized'
    );
  };
  
  // Auto-show labels when camera is close
  const showLabels = cameraDistance < 60;
  
  // Compute lociInView for presence (all visible timeboxes)
  const lociInView = DEMO_FILAMENT.timeBoxes
    .filter(tb => tb.eventIndex <= cursorIndex)
    .map(tb => ({
      filamentId: DEMO_FILAMENT.id,
      commitIndex: tb.eventIndex,
    }));
  
  // Compute anchorMap (eventIndex → xPosition) for presence positioning
  const DELTA_X = 10;
  const anchorMap = new Map(
    DEMO_FILAMENT.timeBoxes.map((tb, i) => [tb.eventIndex, i * DELTA_X])
  );
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0A0E14' }}>
      <Canvas
        camera={{ position: [30, 20, 50], fov: 50 }}
        onCreated={({ camera }) => {
          camera.lookAt(30, 0, 0);
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        
        {/* Axes */}
        <AxisRenderer showLabels={false} />
        
        {/* Filament */}
        <FilamentRenderer
          filament={DEMO_FILAMENT}
          spacingMode={spacingMode}
          showLabels={showLabels}
          cameraDistance={cameraDistance}
          cursorIndex={cursorIndex}
        />
        
        {/* Presence Layer (Tier 1: counts only) */}
        <PresenceLayer
          lociInView={lociInView}
          anchorMap={anchorMap}
          cameraDistance={cameraDistance}
          lensContext="workflow"
        />
        
        {/* Camera Controls */}
        <OrbitControls
          target={[30, 0, 0]}
          onChange={(e) => {
            if (e?.target?.object) {
              const dist = e.target.object.position.distanceTo(
                new THREE.Vector3(30, 0, 0)
              );
              setCameraDistance(dist);
            }
          }}
        />
      </Canvas>
      
      {/* Playback Motor (always visible) */}
      <PlaybackMotor
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onStep={handleStep}
        speed={speed}
        onSpeedChange={setSpeed}
        spacingMode={spacingMode}
        onSpacingToggle={handleSpacingToggle}
      />
      
      {/* Info overlay */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: 15,
        borderRadius: 8,
        color: '#E6E6E6',
        fontFamily: 'monospace',
        fontSize: 12,
        border: '1px solid #4A90E2',
      }}>
        <div><strong>Filament:</strong> {DEMO_FILAMENT.name}</div>
        <div><strong>Magnitude:</strong> {DEMO_FILAMENT.baselineMagnitude} {DEMO_FILAMENT.magnitudeUnit}</div>
        <div><strong>Events:</strong> {DEMO_FILAMENT.events.length}</div>
        <div><strong>Spacing:</strong> {spacingMode}</div>
        <div><strong>Cursor:</strong> {cursorIndex} / {DEMO_FILAMENT.timeBoxes.length - 1}</div>
        <div style={{ marginTop: 8, fontSize: 10, color: '#999' }}>
          Zoom in to see labels
        </div>
      </div>
    </div>
  );
}
