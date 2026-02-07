import React, { useMemo, useState, useRef } from 'react';
import { Instance, Instances, Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  TopologyLevel,
  TopologySemanticClass,
  calculateGeometricTension,
  buildTopologyEdges,
  TopologyEdge,
} from './TopologyLayer';

/**
 * RELAY-GRADE EXCEL IMPORT (CERTIFIED IMPLEMENTATION)
 * 
 * NON-NEGOTIABLE INVARIANTS:
 * 1. Truth ≠ Projection
 * 2. Every cell is a filament
 * 3. Six faces always exist
 * 4. All labels exist
 * 5. No per-instance React state
 * 
 * ARCHITECTURE:
 * - Truth Layer: All sheets, all cells, all commits (JavaScript)
 * - Projection Layer: 3 instanced buckets (GPU-efficient)
 *   1. CellSpineInstanced (1 per cell)
 *   2. TimeBoxInstanced (only important commits)
 *   3. TimeSlabInstanced (unchanged spans)
 */

// ============================================================================
// TRUTH LAYER TYPES (JSDoc)
// ============================================================================

/**
 * Six semantic faces per commit
 * @typedef {Object} FacePayload
 * @property {string} posX - +X: output/value
 * @property {string} negX - -X: inputs/formula/deps
 * @property {string} posY - +Y: semantic intent/type
 * @property {string} negY - -Y: magnitude/ref
 * @property {string} posZ - +Z: identity/actor
 * @property {string} negZ - -Z: evidence/time
 */

/**
 * One commit in a cell's history
 * @typedef {Object} CellCommit
 * @property {number} commitIndex
 * @property {number} ts
 * @property {string} op
  faces: FacePayload;
  refs?: { inputs?: string[] };
  isImportant: boolean; // Cached importance flag
};

/**
 * Complete truth for one cell
 * @typedef {Object} CellTruth
 * @property {string} cellId
 * @property {string} sheet
 * @property {number} sheetIndex
 * @property {number} row
 * @property {number} col
 * @property {CellCommit[]} commits - FULL HISTORY
 */

// ============================================================================
// SPATIAL MAPPING (EXPLICIT)
// ============================================================================

const SPACING = {
  col: 3.0,          // World X per column
  row: 1.5,          // World Y per row
  sheet: 100.0,      // World Z per sheet
  time: 2.0,         // World T per commit (separate dimension)
};

/**
 * Map cell to world position (grid position, NOT including time)
 * @param {CellTruth} cell
 * @returns {[number, number, number]}
 */
function cellToWorldPos(cell) {
  return [
    cell.col * SPACING.col,
    -cell.row * SPACING.row,
    cell.sheetIndex * SPACING.sheet,
  ];
}

/**
 * Map commit to time offset along filament
 * @param {number} commitIndex
 * @returns {number}
 */
function commitToTimeOffset(commitIndex) {
  return commitIndex * SPACING.time;
}

// ============================================================================
// IMPORTANT COMMIT DETECTION
// ============================================================================

/**
 * Deterministic rule: Is this commit important?
 * @param {CellCommit} commit
 * @returns {boolean}
 */
function isImportantCommit(commit) {
  const importantOps = [
    'VALUE_SET',
    'FORMULA_SET',
    'DEPENDENCY_CHANGED',
    'EVIDENCE_ATTACHED',
    'STAMP',
    'GATE',
    'SCAR',
    'SPLIT',
    'CELL_EDITED', // User edits
  ];
  
  // Important if operation is meaningful
  if (importantOps.includes(commit.op)) return true;
  
  // Important if referenced by another filament
  if (commit.refs?.inputs && commit.refs.inputs.length > 0) return true;
  
  // Otherwise: boring (but still exists in truth)
  return false;
}

// ============================================================================
// TRUTH LAYER BUILDER
// ============================================================================

/**
 * Build complete truth layer from filaments
 */
function buildTruthLayer(filaments) {
  const cells = new Map();
  
  filaments.forEach((filament, sheetIndex) => {
    const commits = filament.commits || [];
    const sheetName = filament.metadata?.sheetName || `Sheet ${sheetIndex + 1}`;
    
    // Process ALL commits (full history)
    commits.forEach((commit, commitIndex) => {
      const cellsInCommit = commit.payload?.cells || {};
      
      Object.entries(cellsInCommit).forEach(([cellRef, cellData]) => {
        const { row, col } = cellData;
        const cellId = `${sheetName}!${cellRef}`;
        
        // Initialize cell if first time seeing it
        if (!cells.has(cellId)) {
          cells.set(cellId, {
            cellId,
            sheet: sheetName,
            sheetIndex,
            row,
            col,
            commits: [],
          });
        }
        
        const cell = cells.get(cellId);
        
        // Generate 6-face payload
        const faces = {
          posX: String(cellData.value || ''),           // Output
          negX: cellData.formula || '',                  // Formula/inputs
          posY: cellData.type || 'empty',                // Type
          negY: cellRef,                                 // Cell ref
          posZ: commit.actor?.id || 'system',            // Actor
          negZ: new Date(commit.ts).toISOString(),       // Timestamp
        };
        
        // Create commit record
        const cellCommit = {
          commitIndex,
          ts: commit.ts,
          op: commit.op,
          faces,
          refs: cellData.formula ? { inputs: extractFormulaDeps(cellData.formula) } : undefined,
          isImportant: false, // Will be set below
        };
        
        // Determine importance
        cellCommit.isImportant = isImportantCommit(cellCommit);
        
        cell.commits.push(cellCommit);
      });
    });
  });
  
  return cells;
}

/**
 * Extract formula dependencies (simple regex)
 * @param {string} formula
 * @returns {string[]}
 */
function extractFormulaDeps(formula) {
  const cellRefPattern = /\b([A-Z]+\d+)\b/g;
  const matches = formula.match(cellRefPattern) || [];
  return [...new Set(matches)];
}

// ============================================================================
// PROJECTION LAYER BUILDERS
// ============================================================================

/**
 * Build spine instances (1 per cell, shows existence across time)
 */
function buildSpineInstances(cells) {
  const instances = [];
  
  cells.forEach((cell) => {
    const [x, y, z] = cellToWorldPos(cell);
    const commitCount = cell.commits.length;
    
    instances.push({
      cellId: cell.cellId,
      position: [x, y, z],
      scale: [0.1, 0.1, commitCount * SPACING.time], // Thin line along time
      color: '#00ffff',
      cell,
    });
  });
  
  return instances;
}

/**
 * Build TimeBox instances (only important commits)
 */
function buildTimeBoxInstances(cells) {
  const instances = [];
  
  cells.forEach((cell) => {
    const [x, y, z] = cellToWorldPos(cell);
    
    cell.commits.forEach((commit) => {
      if (!commit.isImportant) return; // Skip boring commits
      
      const timeOffset = commitToTimeOffset(commit.commitIndex);
      
      // Color by type
      const typeColors = {
        number: '#00ff00',
        string: '#00aaff',
        formula: '#ffaa00',
        boolean: '#ff00ff',
        error: '#ff0000',
        empty: '#333333',
      };
      const color = typeColors[commit.faces.posY] || '#666666';
      
      instances.push({
        cellId: cell.cellId,
        commitIndex: commit.commitIndex,
        position: [x + timeOffset, y, z], // Time offset along +X
        scale: [0.8, 0.8, 0.8],
        color,
        commit,
        cell,
      });
    });
  });
  
  return instances;
}

/**
 * Build TimeSlabs (unchanged spans between important commits)
 */
function buildTimeSlabInstances(cells) {
  const instances = [];
  
  cells.forEach((cell) => {
    const [x, y, z] = cellToWorldPos(cell);
    const importantCommits = cell.commits.filter(c => c.isImportant);
    
    // Create slabs between important commits
    for (let i = 0; i < importantCommits.length - 1; i++) {
      const startCommit = importantCommits[i];
      const endCommit = importantCommits[i + 1];
      
      const span = endCommit.commitIndex - startCommit.commitIndex;
      if (span <= 1) continue; // No gap
      
      const startTime = commitToTimeOffset(startCommit.commitIndex);
      const endTime = commitToTimeOffset(endCommit.commitIndex);
      const midTime = (startTime + endTime) / 2;
      const length = endTime - startTime;
      
      instances.push({
        cellId: cell.cellId,
        startCommitIndex: startCommit.commitIndex,
        endCommitIndex: endCommit.commitIndex,
        position: [x + midTime, y, z],
        scale: [length, 0.3, 0.3], // Thin slab
        color: '#222222',
        cell,
      });
    }
  });
  
  return instances;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CellGrid3D({ filaments, selectedFilamentId, showFormulaDeps }) {
  // Build truth layer
  const truthLayer = useMemo(() => {
    const cells = buildTruthLayer(filaments);
    
    // CERTIFICATION LOG: Truth Completeness
    let totalCommits = 0;
    let maxCellCommits = 0;
    cells.forEach(cell => {
      totalCommits += cell.commits.length;
      maxCellCommits = Math.max(maxCellCommits, cell.commits.length);
    });
    
    console.log(`✅ [Truth] sheets=${filaments.length} cells=${cells.size} commits=${totalCommits} maxCellCommits=${maxCellCommits}`);
    
    return cells;
  }, [filaments]);

  // Build projection instances
  const { spineInstances, timeBoxInstances, timeSlabInstances } = useMemo(() => {
    const spines = buildSpineInstances(truthLayer);
    const timeBoxes = buildTimeBoxInstances(truthLayer);
    const timeSlabs = buildTimeSlabInstances(truthLayer);
    
    // CERTIFICATION LOG: Projection Budget
    console.log(`📊 [Projection] spines=${spines.length} cubes=${timeBoxes.length} slabs=${timeSlabs.length} drawCalls≈3`);
    
    return {
      spineInstances: spines,
      timeBoxInstances: timeBoxes,
      timeSlabInstances: timeSlabs,
    };
  }, [truthLayer]);

  // Global inspection state
  const [inspectedInstance, setInspectedInstance] = useState(null);
  
  // Topology visibility level (T0 by default = invisible but force-bearing)
  const [topologyLevel, setTopologyLevel] = useState(TopologyLevel.NONE);
  
  // Topology semantic class (which relationship type to show)
  const [topologySemanticClass, setTopologySemanticClass] = useState(TopologySemanticClass.FORMULA);

  // Build cell position map (for topology calculations)
  const cellPositions = useMemo(() => {
    const positions = new Map();
    truthLayer.forEach((cell) => {
      const [x, y, z] = [
        cell.col * COL_SPACING,
        -cell.row * ROW_SPACING,
        cell.sheetIndex * 50,
      ];
      positions.set(cell.cellId, [x, y, z]);
    });
    return positions;
  }, [truthLayer]);

  // Build topology edges (only if visible)
  const topologyEdges = useMemo(() => {
    if (topologyLevel === TopologyLevel.NONE) return [];
    
    const edges = buildTopologyEdges(
      truthLayer,
      cellPositions,
      topologyLevel,
      inspectedInstance?.cell?.cellId,
      topologySemanticClass
    );
    
    console.log(`🔗 [Topology] level=${topologyLevel} class=${topologySemanticClass} edges=${edges.length}`);
    return edges;
  }, [truthLayer, cellPositions, topologyLevel, topologySemanticClass, inspectedInstance]);

  return (
    <group>
      {/* WASD Camera Controls */}
      <WASDCameraControls />
      
      {/* 1. Cell Spines (shows existence + geometric tension) */}
      <CellSpineInstanced 
        instances={spineInstances}
        truthLayer={truthLayer}
        cellPositions={cellPositions}
      />
      
      {/* 2. TimeBoxes (important commits only) */}
      <TimeBoxInstanced 
        instances={timeBoxInstances}
        onInspect={setInspectedInstance}
      />
      
      {/* 3. TimeSlabs (unchanged spans) */}
      <TimeSlabInstanced instances={timeSlabInstances} />

      {/* 4. Topology Edges (T1-T3 only) */}
      {topologyEdges.map(edge => (
        <TopologyEdge key={edge.id} edge={edge} />
      ))}

      {/* Global Inspection Overlay (shows all 6 faces) */}
      {inspectedInstance && (
        <InspectionOverlay
          instance={inspectedInstance}
          onClose={() => setInspectedInstance(null)}
          onTopologyLevelChange={setTopologyLevel}
          currentTopologyLevel={topologyLevel}
          onSemanticClassChange={setTopologySemanticClass}
          currentSemanticClass={topologySemanticClass}
        />
      )}

      {/* Axis labels */}
      <AxisLabel text="TIME →" position={[20, 5, 0]} color="#ff0000" />
      <AxisLabel text="ROWS ↓" position={[0, -20, 0]} color="#00ff00" />
      <AxisLabel text="COLS →" position={[0, 0, 20]} color="#0000ff" />
    </group>
  );
}

// ============================================================================
// INSTANCED RENDERERS
// ============================================================================

function CellSpineInstanced({ instances, truthLayer, cellPositions }) {
  // Apply geometric tension to each spine
  // Even when topology is invisible (T0), relationships still bend filaments
  const tensionedInstances = useMemo(() => {
    return instances.map(inst => {
      const cell = inst.cell;
      const tension = calculateGeometricTension(cell, truthLayer, cellPositions);
      
      // Apply subtle bend to spine position based on tension
      const bentPosition = [
        inst.position[0] + tension.x,
        inst.position[1] + tension.y,
        inst.position[2] + tension.z,
      ];
      
      return {
        ...inst,
        position: bentPosition,
        tension: tension.length(), // Store tension magnitude for debug
      };
    });
  }, [instances, truthLayer, cellPositions]);

  return (
    <Instances limit={tensionedInstances.length} range={tensionedInstances.length}>
      <boxGeometry />
      <meshBasicMaterial transparent opacity={0.3} />
      
      {tensionedInstances.map((inst, i) => (
        <Instance
          key={inst.cellId}
          position={inst.position}
          scale={inst.scale}
          color={inst.color}
        />
      ))}
    </Instances>
  );
}

function TimeBoxInstanced({ instances, onInspect }) {
  const { raycaster, camera, mouse } = useThree();
  const meshRef = useRef();

  // Global raycast
  useFrame(() => {
    if (!meshRef.current) return;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(meshRef.current);
    
    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId;
      onInspect(instances[instanceId]);
    } else {
      onInspect(null);
    }
  });

  return (
    <Instances ref={meshRef} limit={instances.length} range={instances.length}>
      <boxGeometry />
      <meshStandardMaterial />
      
      {instances.map((inst, i) => (
        <Instance
          key={`${inst.cellId}:${inst.commitIndex}`}
          position={inst.position}
          scale={inst.scale}
          color={inst.color}
        />
      ))}
    </Instances>
  );
}

function TimeSlabInstanced({ instances }) {
  return (
    <Instances limit={instances.length} range={instances.length}>
      <boxGeometry />
      <meshBasicMaterial transparent opacity={0.15} />
      
      {instances.map((inst, i) => (
        <Instance
          key={`${inst.cellId}:${inst.startCommitIndex}-${inst.endCommitIndex}`}
          position={inst.position}
          scale={inst.scale}
          color={inst.color}
        />
      ))}
    </Instances>
  );
}

// ============================================================================
// INSPECTION OVERLAY (ALL 6 FACES)
// ============================================================================

function InspectionOverlay({ 
  instance, 
  onClose, 
  onTopologyLevelChange, 
  currentTopologyLevel,
  onSemanticClassChange,
  currentSemanticClass,
}) {
  if (!instance || !instance.commit) return null;

  const { commit, cell } = instance;
  const faces = commit.faces;

  // CERTIFICATION LOG: Inspection Correctness
  console.log(`🔍 [Inspection] ${cell.cellId} commit=${commit.commitIndex} faces=${Object.keys(faces).length}`);

  // Count dependencies by semantic class
  const depCounts = {
    formula: cell.commits.reduce((acc, c) => acc + (c.refs?.inputs?.length || 0), 0),
    evidence: cell.commits.reduce((acc, c) => acc + (c.refs?.evidence?.length || 0), 0),
    constraint: 0, // TODO
    system: 0, // TODO
  };
  
  const totalDeps = Object.values(depCounts).reduce((a, b) => a + b, 0);

  return (
    <Html
      position={instance.position}
      distanceFactor={10}
      style={{ pointerEvents: 'all' }}
    >
      <div
        style={{
          background: 'rgba(0,0,0,0.95)',
          color: '#fff',
          padding: '14px',
          borderRadius: '8px',
          fontSize: '11px',
          border: '2px solid #00ffff',
          minWidth: '280px',
          boxShadow: '0 4px 16px rgba(0,255,255,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '12px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#00ffff' }}>
            {cell.cellId}
          </div>
          <div style={{ fontSize: '9px', color: '#666', marginTop: '3px' }}>
            Commit {commit.commitIndex} / {cell.commits.length - 1} • {commit.op}
          </div>
        </div>

        {/* ALL 6 FACES (grid layout) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          {[
            { key: 'posX', label: '+X Value', face: faces.posX, color: '#00ff00' },
            { key: 'negX', label: '-X Formula', face: faces.negX, color: '#ffaa00' },
            { key: 'posY', label: '+Y Type', face: faces.posY, color: '#00aaff' },
            { key: 'negY', label: '-Y Ref', face: faces.negY, color: '#aaaaaa' },
            { key: 'posZ', label: '+Z Actor', face: faces.posZ, color: '#ff00ff' },
            { key: 'negZ', label: '-Z Time', face: faces.negZ, color: '#666666' },
          ].map(({ key, label, face, color }) => (
            <div
              key={key}
              style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '6px 8px',
                borderRadius: '4px',
                border: `1px solid ${color}`,
              }}
            >
              <div style={{ fontSize: '8px', color: '#888', marginBottom: '3px' }}>
                {label}
              </div>
              <div style={{ fontSize: '10px', color, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {face || '(empty)'}
              </div>
            </div>
          ))}
        </div>

        {/* Topology Controls */}
        {totalDeps > 0 && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #333' }}>
            <div style={{ fontSize: '9px', color: '#ffaa00', marginBottom: '6px', fontWeight: 'bold' }}>
              🔗 TOPOLOGY ({totalDeps} dependencies)
            </div>
            
            {/* Semantic Class Selector (T3 only) */}
            {currentTopologyLevel === 'T3' && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '7px', color: '#666', marginBottom: '3px' }}>
                  Semantic Class (one at a time):
                </div>
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'formula', label: 'Formula', count: depCounts.formula, color: '#ffaa00' },
                    { key: 'evidence', label: 'Evidence', count: depCounts.evidence, color: '#00aaff' },
                    { key: 'constraint', label: 'Constraint', count: depCounts.constraint, color: '#ff0088' },
                    { key: 'system', label: 'System', count: depCounts.system, color: '#88ff00' },
                  ]
                    .filter(c => c.count > 0) // Only show classes with dependencies
                    .map(({ key, label, count, color }) => (
                      <button
                        key={key}
                        onClick={() => onSemanticClassChange(key)}
                        style={{
                          padding: '3px 6px',
                          fontSize: '7px',
                          background: currentSemanticClass === key ? color : '#333',
                          color: currentSemanticClass === key ? '#000' : '#aaa',
                          border: 'none',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          fontFamily: 'monospace',
                        }}
                      >
                        {label} ({count})
                      </button>
                    ))}
                </div>
              </div>
            )}
            
            {/* Visibility Level */}
            <div style={{ marginBottom: '4px' }}>
              <div style={{ fontSize: '7px', color: '#666', marginBottom: '3px' }}>
                Visibility Level:
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['T0', 'T1', 'T2', 'T3'].map(level => (
                  <button
                    key={level}
                    onClick={() => onTopologyLevelChange(level)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '8px',
                      background: currentTopologyLevel === level ? '#ffaa00' : '#333',
                      color: currentTopologyLevel === level ? '#000' : '#aaa',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ fontSize: '7px', color: '#666', marginTop: '4px' }}>
              {currentTopologyLevel === 'T0' && '✨ Felt, not seen (tension only)'}
              {currentTopologyLevel === 'T1' && 'Bundles between clusters'}
              {currentTopologyLevel === 'T2' && 'Grouped ribbons'}
              {currentTopologyLevel === 'T3' && `Exact edges to ${currentSemanticClass} faces`}
            </div>
          </div>
        )}

        {/* History stats */}
        <div style={{ fontSize: '8px', color: '#666', borderTop: '1px solid #333', paddingTop: '8px', marginTop: '10px' }}>
          📊 Full history: {cell.commits.length} commits preserved
        </div>
      </div>
    </Html>
  );
}

// ============================================================================
// CAMERA CONTROLS (from previous version)
// ============================================================================

function WASDCameraControls() {
  const keysPressed = useRef({});
  const velocity = useRef(new THREE.Vector3());
  const targetVelocity = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const pointer = useRef({ x: 0, y: 0 });
  const isLocked = useRef(false);

  const moveSpeed = 0.5;
  const lookSpeed = 0.0003;
  const dampingFactor = 0.15;

  React.useEffect(() => {
    const handleKeyDown = (e) => { keysPressed.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e) => { keysPressed.current[e.key.toLowerCase()] = false; };
    const handleMouseMove = (e) => {
      if (!isLocked.current) return;
      pointer.current.x = e.movementX;
      pointer.current.y = e.movementY;
    };
    const handleClick = (e) => {
      if (!isLocked.current && e.target.tagName === 'CANVAS') {
        e.target.requestPointerLock();
      }
    };
    const handlePointerLockChange = () => {
      isLocked.current = !!document.pointerLockElement;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick, true);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick, true);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);

  useFrame(({ camera }) => {
    if (isLocked.current && (pointer.current.x !== 0 || pointer.current.y !== 0)) {
      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y -= pointer.current.x * lookSpeed;
      euler.current.x -= pointer.current.y * lookSpeed;
      euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
      pointer.current.x = 0;
      pointer.current.y = 0;
    }

    const keys = keysPressed.current;
    targetVelocity.current.set(0, 0, 0);
    if (keys['w']) targetVelocity.current.z -= moveSpeed;
    if (keys['s']) targetVelocity.current.z += moveSpeed;
    if (keys['a']) targetVelocity.current.x -= moveSpeed;
    if (keys['d']) targetVelocity.current.x += moveSpeed;
    if (keys['q']) targetVelocity.current.y -= moveSpeed;
    if (keys['e']) targetVelocity.current.y += moveSpeed;

    velocity.current.lerp(targetVelocity.current, dampingFactor);
    if (velocity.current.length() > 0.001) {
      const direction = velocity.current.clone().applyQuaternion(camera.quaternion);
      camera.position.add(direction);
    }
  });

  return null;
}

function AxisLabel({ text, position, color }) {
  return (
    <Html position={position} distanceFactor={8}>
      <div
        style={{
          background: 'rgba(0,0,0,0.9)',
          color: color,
          padding: '6px 10px',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
          border: `2px solid ${color}`,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </Html>
  );
}
