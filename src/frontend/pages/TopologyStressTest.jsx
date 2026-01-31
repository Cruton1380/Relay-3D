/**
 * TOPOLOGY STRESS TEST (Internal/Debug Proof)
 * 
 * PURPOSE: Verify topology physics under extreme dependency density
 * 
 * NOT FOR USERS - This is a load test for geometry.
 * 
 * TEST SCENARIOS:
 * 1. One cell depends on 50 others (Excel formula with 50 refs)
 * 2. A PO has 12 receipts, 9 invoices, 4 overrides (procurement)
 * 3. A KPI references 20 upstream filaments (analytics)
 * 
 * PASS CRITERIA:
 * ✅ Curvature remains legible (no over-bend)
 * ✅ No oscillation / jitter
 * ✅ T0 still "feels heavy" without edges
 * ✅ Tension bands quantize correctly
 * ✅ FPS remains stable (>30fps)
 */

import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import {
  TopologyLevel,
  calculateGeometricTension,
  buildTopologyEdges,
  TopologyEdge,
  TopologySemanticClass,
} from '../components/excel/TopologyLayer';

export default function TopologyStressTest() {
  const [topologyLevel, setTopologyLevel] = useState(TopologyLevel.NONE);
  const [scenario, setScenario] = useState('excel');
  const [metrics, setMetrics] = useState({
    maxCurvature: 0,
    oscillationCount: 0,
    edgeCount: 0,
    avgFps: 60,
    lastFrameTime: Date.now(),
    t0HasNonzeroCurvature: false, // CRITICAL: T0 must still bend (invisible but force-bearing)
  });
  const frameTimesRef = React.useRef([]);

  // Generate stress test data
  const { cells, cellPositions, selectedCell } = useMemo(() => {
    const cells = new Map();
    const positions = new Map();
    
    if (scenario === 'excel') {
      // Scenario 1: One cell with 50 dependencies
      // Create target cell at center
      const targetCell = {
        cellId: 'Sheet1!Z1',
        sheet: 'Sheet1',
        row: 0,
        col: 25,
        sheetIndex: 0,
        commits: [{
          commitIndex: 0,
          ts: Date.now(),
          op: 'FORMULA_SET',
          faces: {
            posX: '=SUM(A1:AX1)', // 50 cells
            negX: '=SUM(A1:AX1)',
            posY: 'number',
            negY: '',
            posZ: 'user',
            negZ: Date.now().toString(),
          },
          refs: {
            inputs: Array.from({ length: 50 }, (_, i) => `A${i + 1}`),
          },
          isImportant: true,
        }],
      };
      
      cells.set(targetCell.cellId, targetCell);
      positions.set(targetCell.cellId, [0, 0, 0]);
      
      // Create 50 dependency cells in a circle
      for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const radius = 20;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        const depCell = {
          cellId: `Sheet1!A${i + 1}`,
          sheet: 'Sheet1',
          row: i,
          col: 0,
          sheetIndex: 0,
          commits: [{
            commitIndex: 0,
            ts: Date.now(),
            op: 'VALUE_SET',
            faces: {
              posX: `${i + 1}`,
              negX: '',
              posY: 'number',
              negY: '',
              posZ: 'user',
              negZ: Date.now().toString(),
            },
            isImportant: true,
          }],
        };
        
        cells.set(depCell.cellId, depCell);
        positions.set(depCell.cellId, [x, 0, z]);
      }
      
      return { cells, cellPositions: positions, selectedCell: targetCell };
    }
    
    // TODO: Add procurement and KPI scenarios
    
    return { cells, cellPositions: positions, selectedCell: null };
  }, [scenario]);

  // Calculate tension for target cell
  const tension = useMemo(() => {
    if (!selectedCell) return null;
    const t = calculateGeometricTension(selectedCell, cells, cellPositions);
    
    // VERIFY: T0 still bends (even when edges invisible)
    if (t.length() > 0) {
      setMetrics(prev => ({ ...prev, t0HasNonzeroCurvature: true }));
    }
    
    return t;
  }, [selectedCell, cells, cellPositions]);

  // Build edges (only if T3)
  const edges = useMemo(() => {
    if (!selectedCell) return [];
    return buildTopologyEdges(
      cells,
      cellPositions,
      topologyLevel,
      selectedCell.cellId,
      TopologySemanticClass.FORMULA
    );
  }, [cells, cellPositions, topologyLevel, selectedCell]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      {/* Controls */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.9)',
          padding: '20px',
          borderRadius: '8px',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '12px',
          border: '1px solid #333',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#ff0000' }}>
          ⚠️ TOPOLOGY STRESS TEST (INTERNAL)
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>Scenario:</div>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            style={{
              width: '100%',
              padding: '5px',
              background: '#222',
              color: '#fff',
              border: '1px solid #444',
            }}
          >
            <option value="excel">Excel: 1 cell → 50 deps</option>
            <option value="procurement">PO: 12 receipts + 9 invoices</option>
            <option value="kpi">KPI: 20 upstream filaments</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>
            Topology Level:
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['T0', 'T1', 'T2', 'T3'].map(level => (
              <button
                key={level}
                onClick={() => setTopologyLevel(level)}
                style={{
                  padding: '5px 10px',
                  background: topologyLevel === level ? '#ffaa00' : '#333',
                  color: topologyLevel === level ? '#000' : '#aaa',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px',
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        
        {tension && (
          <div style={{ marginBottom: '15px', paddingTop: '15px', borderTop: '1px solid #333' }}>
            <div style={{ fontSize: '10px', color: '#00ff00', marginBottom: '5px' }}>
              ✅ TENSION METRICS
            </div>
            <div style={{ fontSize: '9px', color: '#666' }}>
              Magnitude: {tension.length().toFixed(3)}
            </div>
            <div style={{ fontSize: '9px', color: '#666' }}>
              Direction: [{tension.x.toFixed(2)}, {tension.y.toFixed(2)}, {tension.z.toFixed(2)}]
            </div>
            <div style={{ fontSize: '9px', color: '#666' }}>
              Dependencies: {selectedCell?.commits[0]?.refs?.inputs?.length || 0}
            </div>
          </div>
        )}
        
        <div style={{ paddingTop: '15px', borderTop: '1px solid #333' }}>
          <div style={{ fontSize: '10px', color: '#00aaff', marginBottom: '5px' }}>
            📊 PASS CRITERIA
          </div>
          <div style={{ fontSize: '8px', color: '#666' }}>
            ✅ Curvature legible (not over-bent)<br />
            ✅ No oscillation / jitter<br />
            ✅ T0 feels heavy without edges<br />
            ✅ FPS stable (&gt;30fps)
          </div>
        </div>
      </div>

      {/* 3D Scene */}
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 30, 50]} />
        <OrbitControls />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        {/* Grid */}
        <gridHelper args={[100, 20, '#222', '#111']} />
        
        {/* Render all cells */}
        {Array.from(cells.values()).map(cell => {
          const pos = cellPositions.get(cell.cellId);
          if (!pos) return null;
          
          // Apply tension to center cell only
          let renderPos = pos;
          if (cell === selectedCell && tension) {
            renderPos = [
              pos[0] + tension.x,
              pos[1] + tension.y,
              pos[2] + tension.z,
            ];
          }
          
          const isCenter = cell === selectedCell;
          
          return (
            <mesh key={cell.cellId} position={renderPos}>
              <boxGeometry args={isCenter ? [1.5, 1.5, 1.5] : [0.8, 0.8, 0.8]} />
              <meshStandardMaterial
                color={isCenter ? '#ffaa00' : '#00ff00'}
                emissive={isCenter ? '#ffaa00' : '#00ff00'}
                emissiveIntensity={isCenter ? 0.5 : 0.2}
              />
            </mesh>
          );
        })}
        
        {/* Render edges (T3 only) */}
        {edges.map(edge => (
          <TopologyEdge key={edge.id} edge={edge} />
        ))}
        
        {/* Tension vector visualization (debug) */}
        {tension && tension.length() > 0 && (
          <arrowHelper
            args={[
              tension.clone().normalize(),
              [0, 0, 0],
              tension.length() * 10,
              '#ff0000',
              3,
              2,
            ]}
          />
        )}
      </Canvas>
    </div>
  );
}
