// relay-3d/RelayFilamentRenderer.jsx
import React, { useState, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

import FilamentNode from './nodes/FilamentNode';
import FilamentEdge from './edges/FilamentEdge';
import StarField from './effects/StarField';
import FreeFlightControls from './controls/FreeFlightControls';
import MetricsPanel from './hud/MetricsPanel';
import ActionButtons from './hud/ActionButtons';
import Minimap from './hud/Minimap';
import FlightHUD from './hud/FlightHUD';

import './RelayFilamentRenderer.css';

/**
 * RelayFilamentRenderer - Main 3D filament visualization component
 * Renders nodes, edges, and HUD based on renderSpec.v1 format
 */
export default function RelayFilamentRenderer({ renderSpec, onAction }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);
  
  // Flight control state
  const [flightMode, setFlightMode] = useState('HOLD');
  const [flightSpeed, setFlightSpeed] = useState(6.0);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  // Extract data from renderSpec
  const { nodes = [], edges = [], scene = {} } = renderSpec || {};

  // Parse node data
  const nodeData = useMemo(() => {
    return nodes.map((node) => ({
      id: node.id,
      position: node.position || [0, 0, 0],
      kind: node.kind || 'STATE',
      confidence: node.confidence || 80,
      pressure: node.pressure || 10,
      deltaPR: node.deltaPR || 0,
      status: node.status || 'STABLE',
      label: node.label || node.id,
      metadata: node.metadata || {},
      color: getNodeColor(node.kind)
    }));
  }, [nodes]);

  // Parse edge data
  const edgeData = useMemo(() => {
    return edges.map((edge) => {
      const fromNode = nodeData.find(n => n.id === edge.from);
      const toNode = nodeData.find(n => n.id === edge.to);

      return {
        id: edge.id,
        type: edge.type || 'DEPENDS_ON',
        from: edge.from,
        to: edge.to,
        fromPosition: fromNode?.position || [0, 0, 0],
        toPosition: toNode?.position || [1, 0, 0],
        pressure: edge.pressure || 10,
        deltaPR: edge.deltaPR || 0,
        color: getEdgeColor(edge.type, edge.deltaPR)
      };
    });
  }, [edges, nodeData]);

  // Handle node selection
  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  // Handle action buttons
  const handleAction = (actionType, node) => {
    console.log(`Action: ${actionType}`, node);
    if (onAction) {
      onAction(actionType, node);
    }
  };

  return (
    <div className="relay-filament-renderer">
      {/* 3D Canvas */}
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
      >
        {/* Camera */}
        <PerspectiveCamera
          makeDefault
          position={[2, 1, 3]}
          fov={60}
        />

        {/* Free Flight Controls (RTS-freeflight + FPS fly) */}
        <FreeFlightControls
          enabled={true}
          anchorPosition={selectedNode?.position || [0, 0, 0]}
          onModeChange={(mode) => {
            setFlightMode(mode);
            setIsPointerLocked(mode === 'FREE-FLY');
          }}
          onSpeedChange={setFlightSpeed}
        />

        {/* Lighting */}
        <ambientLight intensity={0.3} color={0x404060} />
        <pointLight position={[0, 0, 0]} intensity={2} color={0xFFE57F} decay={2} />
        <pointLight position={[0.6, -0.2, 0.1]} intensity={1.5} color={0xFFD700} />

        {/* Background - DARKER (filaments must dominate contrast) */}
        <color attach="background" args={['#050812']} />
        <fog attach="fog" args={['#050812', 8, 25]} />

        <Suspense fallback={null}>
          {/* Star field */}
          <StarField count={5000} />

          {/* Render edges first (behind nodes) */}
          {edgeData.map((edge) => (
            <FilamentEdge
              key={edge.id}
              {...edge}
              onHover={(isHovered) => setHoveredElement(isHovered ? edge.id : null)}
            />
          ))}

          {/* Render nodes */}
          {nodeData.map((node) => (
            <FilamentNode
              key={node.id}
              {...node}
              selected={selectedNode?.id === node.id}
              onClick={() => handleNodeClick(node)}
              onHover={(isHovered) => setHoveredElement(isHovered ? node.id : null)}
            />
          ))}
        </Suspense>
      </Canvas>

      {/* HUD Overlays */}
      <FlightHUD 
        speed={flightSpeed} 
        mode={flightMode} 
        isLocked={isPointerLocked} 
      />
      <MetricsPanel selectedNode={selectedNode} />
      <ActionButtons selectedNode={selectedNode} onAction={handleAction} />
      <Minimap nodes={nodeData} edges={edgeData} />
    </div>
  );
}

// Helper: Get node color by kind
function getNodeColor(kind) {
  const colors = {
    STATE: 0xFFD700,
    REALITY_ANCHOR: 0x4FC3F7,
    CAPABILITY: 0x00BCD4,
    EVIDENCE: 0x7C4DFF
  };
  return colors[kind] || colors.STATE;
}

// Helper: Get edge color by type and deltaPR
function getEdgeColor(type, deltaPR) {
  if (type === 'DEPENDS_ON') {
    if (deltaPR === 0) return 0xFFFFFF;
    if (deltaPR < 20) return 0xFF9800;
    if (deltaPR < 50) return 0xFF5722;
    return 0xF44336;
  }
  if (type === 'ASSERTED_BY') return 0xFFFFFF;
  if (type === 'EVIDENCED_BY') return 0xE1F5FE;
  return 0xFFFFFF;
}
