import React, { useMemo, useState, useRef } from 'react';
import { Instance, Instances, Html, PointerLockControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 3D Cell Grid — Render Excel cells as filaments with commit history
 * 
 * CORRECTED Architecture:
 * - X-axis = TIME (commits for each cell)
 * - Y-axis = Rows (down)
 * - Z-axis = Columns (depth)
 * - Each CELL = separate filament with history along X-axis
 * - Result: Cube of mini cubes (TimeBoxes for every cell commit)
 */
export function CellGrid3D({ filaments, selectedFilamentId, showFormulaDeps }) {
  // Spacing
  const TIMEBOX_SIZE = 0.8;
  const TIME_SPACING = 2.0; // X-axis (time)
  const ROW_SPACING = 1.5;  // Y-axis (rows)
  const COL_SPACING = 3.0;  // Z-axis (columns) - INCREASED for visibility

  // Collect ALL TimeBoxes for ALL cells (full commit history + synthetic time slices)
  const timeBoxData = useMemo(() => {
    const timeBoxes = [];
    const SYNTHETIC_TIME_SLICES = 1; // EMERGENCY: Only current state (GPU can't handle more)
    
    // PERFORMANCE: Only render first sheet (typically the largest)
    const firstSheetOnly = filaments.slice(0, 1);
    
    firstSheetOnly.forEach((filament) => {
      const commits = filament.commits || [];
      const sheetCells = {};
      
      // Replay all commits to build cell history
      commits.forEach((commit, commitIndex) => {
        const cells = commit.payload?.cells || {};
        
        Object.entries(cells).forEach(([cellRef, cellData]) => {
          const { row, col } = cellData;
          
          // Track which commit index this cell was touched
          if (!sheetCells[cellRef]) {
            sheetCells[cellRef] = [];
          }
          
          sheetCells[cellRef].push({
            commitIndex,
            cellRef,
            row,
            col,
            value: cellData.value,
            type: cellData.type,
            formula: cellData.formula,
            operation: commit.op,
          });
        });
      });
      
      // Generate synthetic time slices for visualization
      // (In reality, edits would create these commits)
      
      Object.entries(sheetCells).forEach(([cellRef, history]) => {
        // Get the latest snapshot
        const latest = history[history.length - 1];
        
        // Create synthetic history (simulate edits over time)
        for (let t = 0; t < SYNTHETIC_TIME_SLICES; t++) {
          const snapshot = t === 0 ? latest : {
            ...latest,
            commitIndex: t,
            operation: t === 0 ? 'SHEET_IMPORTED' : 'CELL_EDITED',
            value: generateSyntheticValue(latest.value, t, latest.type),
          };
          
          timeBoxes.push({
            id: `${filament.id}:${cellRef}:${snapshot.commitIndex}`,
            cellRef,
            commitIndex: snapshot.commitIndex,
            sheetName: filament.metadata?.sheetName || 'Sheet',
            position: [
              snapshot.commitIndex * TIME_SPACING,  // X = time
              -snapshot.row * ROW_SPACING,           // Y = row (negative for down)
              snapshot.col * COL_SPACING,            // Z = column
            ],
            value: snapshot.value,
            type: snapshot.type,
            formula: snapshot.formula,
            operation: snapshot.operation,
            isSelected: filament.id === selectedFilamentId,
            isSynthetic: t > 0,
          });
        }
      });
    });
    
    const cellCount = Object.keys(firstSheetOnly.reduce((acc, f) => {
      const cells = f.commits?.[0]?.payload?.cells || {};
      return {...acc, ...cells};
    }, {})).length;
    
    // Debug: Check spatial distribution
    const colRange = timeBoxes.reduce((acc, tb) => {
      const col = tb.position[2] / COL_SPACING;
      return { min: Math.min(acc.min, col), max: Math.max(acc.max, col) };
    }, { min: Infinity, max: -Infinity });
    
    const rowRange = timeBoxes.reduce((acc, tb) => {
      const row = -tb.position[1] / ROW_SPACING;
      return { min: Math.min(acc.min, row), max: Math.max(acc.max, row) };
    }, { min: Infinity, max: -Infinity });
    
    console.log(`🧊 [CellGrid3D] Rendering ${timeBoxes.length} TimeBoxes (${cellCount} cells × ${SYNTHETIC_TIME_SLICES} time slices)`);
    console.log(`📐 [Spatial] Rows: ${rowRange.min}-${rowRange.max}, Cols: ${colRange.min}-${colRange.max}`);
    console.log(`⚠️ [Performance] GPU limit reached - showing first sheet only + current state only`);
    return timeBoxes;
  }, [filaments, selectedFilamentId]);

  return (
    <group>
      {/* WASD Camera Controls */}
      <WASDCameraControls />
      
      {/* TimeBox instances (one per cell commit) */}
      <Instances
        limit={10000}
        range={timeBoxData.length}
      >
        <boxGeometry args={[TIMEBOX_SIZE, TIMEBOX_SIZE, TIMEBOX_SIZE]} />
        <meshStandardMaterial />
        
        {timeBoxData.map((timeBox) => (
          <TimeBoxInstance
            key={timeBox.id}
            timeBox={timeBox}
          />
        ))}
      </Instances>

      {/* Cell filament spines (connect TimeBoxes for same cell) */}
      {renderCellSpines(timeBoxData, TIME_SPACING)}

      {/* Axis labels */}
      <AxisLabel text="TIME →" position={[10, 2, 0]} color="#ff0000" />
      <AxisLabel text="ROWS ↓" position={[0, -10, 0]} color="#00ff00" />
      <AxisLabel text="COLS →" position={[0, 0, 10]} color="#0000ff" />
    </group>
  );
}

/**
 * Render spines connecting TimeBoxes for same cell
 */
function renderCellSpines(timeBoxData, timeSpacing) {
  // Group TimeBoxes by cell
  const cellGroups = {};
  timeBoxData.forEach(tb => {
    const cellKey = `${tb.cellRef}_${tb.position[1]}_${tb.position[2]}`;
    if (!cellGroups[cellKey]) cellGroups[cellKey] = [];
    cellGroups[cellKey].push(tb);
  });

  // Create spine for each cell with multiple commits
  return Object.values(cellGroups)
    .filter(group => group.length > 1)
    .map((group, idx) => {
      const points = group
        .sort((a, b) => a.commitIndex - b.commitIndex)
        .map(tb => new THREE.Vector3(...tb.position));
      
      return (
        <line key={idx} geometry={new THREE.BufferGeometry().setFromPoints(points)}>
          <lineBasicMaterial color="#00ffff" linewidth={1} />
        </line>
      );
    });
}

/**
 * FPS Camera Controls (WASD + Mouse Look)
 */
function WASDCameraControls() {
  const keysPressed = useRef({});
  const velocity = useRef(new THREE.Vector3());
  const targetVelocity = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const pointer = useRef({ x: 0, y: 0 });
  const isLocked = useRef(false);

  const moveSpeed = 0.5;
  const lookSpeed = 0.0003; // REDUCED 85% - was too sensitive
  const dampingFactor = 0.15; // Ease-in/ease-out

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
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
    document.addEventListener('pointerlockerror', (e) => {
      console.warn('⚠️ Pointer lock error:', e);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick, true);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);

  useFrame(({ camera }) => {
    // Mouse look (rotation)
    if (isLocked.current && (pointer.current.x !== 0 || pointer.current.y !== 0)) {
      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y -= pointer.current.x * lookSpeed;
      euler.current.x -= pointer.current.y * lookSpeed;
      euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
      pointer.current.x = 0;
      pointer.current.y = 0;
    }

    // WASD movement with easing
    const keys = keysPressed.current;
    targetVelocity.current.set(0, 0, 0);

    if (keys['w']) targetVelocity.current.z -= moveSpeed;
    if (keys['s']) targetVelocity.current.z += moveSpeed;
    if (keys['a']) targetVelocity.current.x -= moveSpeed;
    if (keys['d']) targetVelocity.current.x += moveSpeed;
    if (keys['q']) targetVelocity.current.y -= moveSpeed;
    if (keys['e']) targetVelocity.current.y += moveSpeed;

    // Smooth interpolation (ease-in/ease-out)
    velocity.current.lerp(targetVelocity.current, dampingFactor);

    // Apply movement
    if (velocity.current.length() > 0.001) {
      const direction = velocity.current.clone().applyQuaternion(camera.quaternion);
      camera.position.add(direction);
    }
  });

  return null;
}

/**
 * TimeBox Instance (one cell commit)
 */
function TimeBoxInstance({ timeBox }) {
  const [hovered, setHovered] = useState(false);

  // Color by type
  const baseColor = {
    number: '#00ff00',
    string: '#00aaff',
    formula: '#ffaa00',
    boolean: '#ff00ff',
    error: '#ff0000',
    empty: '#333333',
  }[timeBox.type] || '#666666';

  // Dim synthetic commits slightly
  const color = timeBox.isSynthetic ? adjustBrightness(baseColor, 0.6) : baseColor;

  return (
    <group position={timeBox.position}>
      <Instance
        color={hovered ? '#ffffff' : color}
        scale={hovered ? 1.3 : 1}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
      
      {hovered && (
        <Html distanceFactor={5}>
          <div
            style={{
              background: '#000',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              border: '1px solid ' + baseColor,
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
              {timeBox.sheetName}!{timeBox.cellRef} [t={timeBox.commitIndex}]
            </div>
            <div style={{ fontSize: '9px', color: '#aaa' }}>
              {timeBox.formula ? `=${timeBox.formula}` : `${timeBox.value}`}
            </div>
            <div style={{ fontSize: '8px', color: '#666', marginTop: '2px' }}>
              {timeBox.operation}
              {timeBox.isSynthetic && ' (demo)'}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex, factor) {
  const color = new THREE.Color(hex);
  color.multiplyScalar(factor);
  return '#' + color.getHexString();
}

/**
 * Generate synthetic value for time slice (for visualization)
 */
function generateSyntheticValue(originalValue, timeIndex, type) {
  if (timeIndex === 0) return originalValue;
  
  // Simulate value changes over time
  if (type === 'number') {
    const num = parseFloat(originalValue) || 0;
    return (num * (1 + timeIndex * 0.1)).toFixed(2);
  }
  if (type === 'string') {
    return `${originalValue} [v${timeIndex}]`;
  }
  return originalValue;
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
