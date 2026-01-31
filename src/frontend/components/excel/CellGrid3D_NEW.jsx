import React, { useMemo, useState, useRef } from 'react';
import { Instance, Instances, Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 3D Cell Grid — Relay-Grade Architecture
 * 
 * CORRECTED: Truth vs Projection Separation
 * 
 * TRUTH LAYER (always complete):
 * - All cells from all sheets
 * - All 6 faces per cell (+X, -X, +Y, -Y, +Z, -Z)
 * - All history (full commit timeline)
 * - Stored in JavaScript data structures
 * 
 * PROJECTION LAYER (GPU-efficient):
 * - ONE InstancedMesh for all cells
 * - Global raycaster (not per-instance hover)
 * - Inspection overlay shows all 6 faces
 * - Distance affects rendering fidelity, not data existence
 */
export function CellGrid3D({ filaments, selectedFilamentId, showFormulaDeps }) {
  // Spacing
  const TIMEBOX_SIZE = 0.8;
  const ROW_SPACING = 1.5;  // Y-axis (rows)
  const COL_SPACING = 3.0;  // Z-axis (columns)

  // Build COMPLETE truth layer (all cells, all faces, all history)
  const truthData = useMemo(() => {
    const cells = {};
    
    filaments.forEach((filament, sheetIndex) => {
      const commits = filament.commits || [];
      const sheetName = filament.metadata?.sheetName || `Sheet ${sheetIndex + 1}`;
      
      // Process all commits (full history)
      commits.forEach((commit, commitIndex) => {
        const cellsInCommit = commit.payload?.cells || {};
        
        Object.entries(cellsInCommit).forEach(([cellRef, cellData]) => {
          const { row, col } = cellData;
          const cellKey = `${filament.id}:${cellRef}`;
          
          if (!cells[cellKey]) {
            cells[cellKey] = {
              cellRef,
              sheetName,
              sheetIndex,
              row,
              col,
              position: [
                0, // X will be commitIndex-based
                -row * ROW_SPACING,
                col * COL_SPACING + sheetIndex * 50, // Offset sheets
              ],
              history: [],
              faces: {}, // 6-face payload per commit
            };
          }
          
          // Store this commit snapshot
          cells[cellKey].history.push({
            commitIndex,
            timestamp: commit.ts,
            operation: commit.op,
            value: cellData.value,
            type: cellData.type,
            formula: cellData.formula,
            // Generate all 6 faces (semantic truth)
            faces: {
              '+X': { label: 'Value', content: cellData.value || '', color: '#00ff00' },
              '-X': { label: 'Formula', content: cellData.formula || '', color: '#ffaa00' },
              '+Y': { label: 'Type', content: cellData.type || '', color: '#00aaff' },
              '-Y': { label: 'Ref', content: cellRef, color: '#aaaaaa' },
              '+Z': { label: 'Operation', content: commit.op, color: '#ff00ff' },
              '-Z': { label: 'Time', content: new Date(commit.ts).toLocaleString(), color: '#666666' },
            },
          });
        });
      });
    });
    
    console.log(`✅ [Truth Layer] ${Object.keys(cells).length} cells, ALL sheets, ALL history preserved`);
    return cells;
  }, [filaments]);

  // Build projection instances (what GPU renders)
  const instances = useMemo(() => {
    const instanceArray = [];
    
    Object.entries(truthData).forEach(([cellKey, cell], index) => {
      // Render each commit in history along X-axis
      cell.history.forEach((snapshot, commitIndex) => {
        instanceArray.push({
          key: `${cellKey}:${commitIndex}`,
          cellKey,
          instanceIndex: instanceArray.length,
          position: [
            commitIndex * 2.0, // X = time
            cell.position[1],  // Y = row
            cell.position[2],  // Z = col + sheet offset
          ],
          snapshot,
          cell,
        });
      });
    });
    
    console.log(`📊 [Projection] Rendering ${instanceArray.length} instances via GPU instancing`);
    return instanceArray;
  }, [truthData]);

  // Global inspection state (ONE overlay, not N)
  const [inspectedInstance, setInspectedInstance] = useState(null);

  return (
    <group>
      {/* WASD Camera Controls */}
      <WASDCameraControls />
      
      {/* GPU-Instanced Cell Rendering */}
      <CellInstances
        instances={instances}
        size={TIMEBOX_SIZE}
        onInspect={setInspectedInstance}
      />

      {/* Global Inspection Overlay (shows all 6 faces) */}
      {inspectedInstance && (
        <InspectionOverlay
          instance={inspectedInstance}
          onClose={() => setInspectedInstance(null)}
        />
      )}

      {/* Axis labels */}
      <AxisLabel text="TIME →" position={[10, 2, 0]} color="#ff0000" />
      <AxisLabel text="ROWS ↓" position={[0, -10, 0]} color="#00ff00" />
      <AxisLabel text="COLS →" position={[0, 0, 20]} color="#0000ff" />
    </group>
  );
}

/**
 * GPU-Instanced Cell Rendering
 * ONE draw call for all cells
 */
function CellInstances({ instances, size, onInspect }) {
  const { raycaster, camera, mouse } = useThree();
  const meshRef = useRef();

  // Global raycast (not per-instance)
  useFrame(() => {
    if (!meshRef.current) return;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(meshRef.current);
    
    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId;
      const instance = instances[instanceId];
      if (instance) {
        onInspect(instance);
      }
    } else {
      onInspect(null);
    }
  });

  return (
    <Instances ref={meshRef} limit={instances.length} range={instances.length}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial />
      
      {instances.map((instance) => {
        // Color by type
        const color = {
          number: '#00ff00',
          string: '#00aaff',
          formula: '#ffaa00',
          boolean: '#ff00ff',
          error: '#ff0000',
          empty: '#333333',
        }[instance.snapshot.type] || '#666666';
        
        return (
          <Instance
            key={instance.key}
            position={instance.position}
            color={color}
          />
        );
      })}
    </Instances>
  );
}

/**
 * Global Inspection Overlay
 * Shows ALL 6 faces of inspected cell
 */
function InspectionOverlay({ instance, onClose }) {
  if (!instance) return null;

  const { snapshot, cell } = instance;
  const faces = snapshot.faces;

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
          padding: '12px',
          borderRadius: '8px',
          fontSize: '11px',
          border: '2px solid #00ffff',
          minWidth: '250px',
          boxShadow: '0 4px 12px rgba(0,255,255,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#00ffff' }}>
            {cell.sheetName}!{cell.cellRef}
          </div>
          <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
            Commit {snapshot.commitIndex} • {snapshot.operation}
          </div>
        </div>

        {/* ALL 6 FACES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {Object.entries(faces).map(([faceKey, face]) => (
            <div
              key={faceKey}
              style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '6px 8px',
                borderRadius: '4px',
                border: `1px solid ${face.color}`,
              }}
            >
              <div style={{ fontSize: '8px', color: '#888', marginBottom: '2px' }}>
                {faceKey} • {face.label}
              </div>
              <div style={{ fontSize: '10px', color: face.color, fontFamily: 'monospace' }}>
                {face.content || '(empty)'}
              </div>
            </div>
          ))}
        </div>

        {/* History indicator */}
        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #333', fontSize: '8px', color: '#666' }}>
          📊 {cell.history.length} commits in full history
        </div>
      </div>
    </Html>
  );
}

/**
 * WASD Camera Controls (from previous version)
 */
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
    // Mouse look
    if (isLocked.current && (pointer.current.x !== 0 || pointer.current.y !== 0)) {
      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y -= pointer.current.x * lookSpeed;
      euler.current.x -= pointer.current.y * lookSpeed;
      euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
      pointer.current.x = 0;
      pointer.current.y = 0;
    }

    // WASD movement
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

/**
 * Axis Label
 */
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
