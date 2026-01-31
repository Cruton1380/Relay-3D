import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Line } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Filament History Proof — Classic TimeBox View
 * 
 * Demonstrates:
 * 1. One filament = sequence of irreversible state transitions
 * 2. Each TimeBox = atomic truth moment with 6 semantic faces
 * 3. Glyphs = discrete operations (STAMP, GATE, SCAR, etc.)
 * 4. X-axis = event order (structural time)
 * 
 * Scenario: PO-1001 lifecycle
 * - Created → Line Added → Approved → Amended → Sent → Cancelled
 */
export default function FilamentHistoryProof() {
  const [selectedBox, setSelectedBox] = useState(null);
  const [selectedFace, setSelectedFace] = useState(null);

  // PO-1001 lifecycle commits
  const commits = [
    {
      index: 0,
      operation: 'PO_CREATED',
      glyph: 'STAMP',
      timestamp: '2026-01-28T09:00:00Z',
      actor: 'user:alice',
      faces: {
        plusX: { label: '+X (State)', content: 'PO-1001\nVendor: ACME\nAmount: $50,000\nStatus: DRAFT' },
        minusX: { label: '-X (Inputs)', content: 'Budget approval\nVendor contract\nPR-9901' },
        plusY: { label: '+Y (Magnitude)', content: '$50,000 spend\nPriority: HIGH' },
        minusY: { label: '-Y (Corrections)', content: '(none)' },
        plusZ: { label: '+Z (Eligibility)', content: 'Visible to: Procurement\nEditable by: Alice' },
        minusZ: { label: '-Z (Evidence)', content: 'Signature: 0x1a2b\nTimestamp: 09:00:00Z' }
      }
    },
    {
      index: 1,
      operation: 'LINE_ADDED',
      glyph: 'NORMAL',
      timestamp: '2026-01-28T09:15:00Z',
      actor: 'user:alice',
      faces: {
        plusX: { label: '+X (State)', content: 'PO-1001\n+ Line A: Widget (qty: 10)\nAmount: $50,000' },
        minusX: { label: '-X (Inputs)', content: 'Previous: index 0\nCatalog: item-777' },
        plusY: { label: '+Y (Magnitude)', content: 'Line A: $50,000\nTotal unchanged' },
        minusY: { label: '-Y (Corrections)', content: '(none)' },
        plusZ: { label: '+Z (Eligibility)', content: 'Visible to: Procurement\nEditable by: Alice' },
        minusZ: { label: '-Z (Evidence)', content: 'Signature: 0x2b3c\nTimestamp: 09:15:00Z' }
      }
    },
    {
      index: 2,
      operation: 'PO_APPROVED',
      glyph: 'GATE',
      timestamp: '2026-01-28T10:00:00Z',
      actor: 'system:approval-engine',
      faces: {
        plusX: { label: '+X (State)', content: 'PO-1001\nStatus: APPROVED\nApprovers: 3 of 3' },
        minusX: { label: '-X (Inputs)', content: 'Previous: index 1\nSignatures: Alice, Bob, Charlie\nPolicy: po-approval' },
        plusY: { label: '+Y (Magnitude)', content: 'Gate cleared\nApproval count: 3' },
        minusY: { label: '-Y (Corrections)', content: '(none)' },
        plusZ: { label: '+Z (Eligibility)', content: 'Visible to: All\nEditable by: (locked)' },
        minusZ: { label: '-Z (Evidence)', content: 'Gate proof: 0x3c4d\nPolicy check: PASS' }
      }
    },
    {
      index: 3,
      operation: 'PO_AMENDED',
      glyph: 'SCAR',
      timestamp: '2026-01-28T11:00:00Z',
      actor: 'user:bob',
      faces: {
        plusX: { label: '+X (State)', content: 'PO-1001 (AMENDED)\nLine A: qty 8 (was 10)\nAmount: $40,000' },
        minusX: { label: '-X (Inputs)', content: 'Previous: index 2\nReason: Vendor shortage\nOverride: bob' },
        plusY: { label: '+Y (Magnitude)', content: 'Amount change: -$10,000\nQty change: -2' },
        minusY: { label: '-Y (Corrections)', content: 'Original qty: 10\nOriginal amount: $50,000' },
        plusZ: { label: '+Z (Eligibility)', content: 'Visible to: All\nAmendment visible' },
        minusZ: { label: '-Z (Evidence)', content: 'Amendment proof: 0x4d5e\nApproval override: Bob' }
      }
    },
    {
      index: 4,
      operation: 'PO_SENT',
      glyph: 'NORMAL',
      timestamp: '2026-01-28T11:30:00Z',
      actor: 'system:edi-sender',
      faces: {
        plusX: { label: '+X (State)', content: 'PO-1001\nStatus: SENT\nVendor notified' },
        minusX: { label: '-X (Inputs)', content: 'Previous: index 3\nEDI gateway: vendor-api' },
        plusY: { label: '+Y (Magnitude)', content: 'Transmission confirmed' },
        minusY: { label: '-Y (Corrections)', content: '(none)' },
        plusZ: { label: '+Z (Eligibility)', content: 'Visible to: All\nEditable by: (locked)' },
        minusZ: { label: '-Z (Evidence)', content: 'EDI confirmation: 0x5e6f\nVendor ACK received' }
      }
    },
    {
      index: 5,
      operation: 'PO_CANCELLED',
      glyph: 'GATE',
      timestamp: '2026-01-28T14:00:00Z',
      actor: 'user:alice',
      faces: {
        plusX: { label: '+X (State)', content: 'PO-1001\nStatus: CANCELLED\nReason: Project cancelled' },
        minusX: { label: '-X (Inputs)', content: 'Previous: index 4\nCancellation request\nApproval: alice + charlie' },
        plusY: { label: '+Y (Magnitude)', content: 'Spend released: $40,000' },
        minusY: { label: '-Y (Corrections)', content: '(none)' },
        plusZ: { label: '+Z (Eligibility)', content: 'Visible to: All\nFinal state (immutable)' },
        minusZ: { label: '-Z (Evidence)', content: 'Cancellation proof: 0x6f7g\nVendor notified: 14:05:00Z' }
      }
    }
  ];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      {/* Left Panel: Inspector */}
      <LeftPanel
        commits={commits}
        selectedBox={selectedBox}
        selectedFace={selectedFace}
        onSelectBox={setSelectedBox}
      />

      {/* Right Panel: 3D Scene */}
      <div style={{ flex: 1, background: '#000', position: 'relative' }}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 8, 25]} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={10}
            maxDistance={60}
            target={[15, 0, 0]}
          />
          <ambientLight intensity={0.6} />
          <pointLight position={[20, 15, 10]} intensity={1.5} />
          <pointLight position={[0, 5, -10]} intensity={0.5} />

          {/* Filament Spine (X-axis line) */}
          <Line
            points={[
              [0, 0, 0],
              [commits.length * 6, 0, 0]
            ]}
            color="#00ffff"
            lineWidth={2}
          />

          {/* TimeBoxes along X-axis */}
          {commits.map((commit, idx) => (
            <TimeBox
              key={idx}
              commit={commit}
              position={[idx * 6, 0, 0]}
              isSelected={selectedBox === idx}
              onSelect={() => setSelectedBox(idx)}
              onSelectFace={(face) => setSelectedFace(face)}
            />
          ))}

          {/* Grid */}
          <gridHelper args={[60, 60, '#333', '#111']} position={[15, -3, 0]} />
        </Canvas>

        {/* Info Overlay */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.85)',
            color: '#00ffff',
            padding: '12px 18px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            border: '1px solid #00ffff',
          }}
        >
          🧬 Filament History: po:PO-1001
        </div>
      </div>
    </div>
  );
}

/**
 * Left Panel: Inspector
 */
function LeftPanel({ commits, selectedBox, selectedFace, onSelectBox }) {
  const selectedCommit = selectedBox !== null ? commits[selectedBox] : null;

  return (
    <div
      style={{
        width: '400px',
        background: '#0a0a0a',
        color: '#fff',
        padding: '20px',
        overflowY: 'auto',
        borderRight: '1px solid #333',
        fontFamily: 'monospace',
        fontSize: '11px',
      }}
    >
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#00ffff' }}>
        🧬 Filament History
      </h2>

      {/* Explanation */}
      <div
        style={{
          marginBottom: '20px',
          padding: '12px',
          background: '#1a1a1a',
          borderRadius: '4px',
          fontSize: '10px',
          lineHeight: '1.6',
          color: '#aaa',
        }}
      >
        <div style={{ color: '#ffaa00', marginBottom: '8px', fontWeight: 'bold' }}>
          ONE FILAMENT, DEEP TIME
        </div>
        <div style={{ marginBottom: '8px' }}>
          Each TimeBox = atomic truth moment
        </div>
        <div style={{ color: '#00ff00' }}>
          6 faces = semantic payload. X-axis = event order (irreversible).
        </div>
      </div>

      {/* Commit Timeline */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '13px',
            marginBottom: '10px',
            fontWeight: 'bold',
            color: '#ffaa00',
          }}
        >
          Timeline ({commits.length} commits)
        </div>

        {commits.map((commit, idx) => (
          <button
            key={idx}
            onClick={() => onSelectBox(idx)}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
              background: selectedBox === idx ? '#0088ff' : '#1a1a1a',
              color: '#fff',
              border: selectedBox === idx ? '2px solid #00ffff' : '1px solid #333',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'monospace',
              fontSize: '10px',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              [{idx}] {commit.operation}
            </div>
            <div style={{ fontSize: '9px', color: '#aaa' }}>
              Glyph: {commit.glyph} | Actor: {commit.actor}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Commit Details */}
      {selectedCommit && (
        <div>
          <div
            style={{
              fontSize: '13px',
              marginBottom: '10px',
              fontWeight: 'bold',
              color: '#00ffff',
            }}
          >
            TimeBox [{selectedCommit.index}]
          </div>

          <div
            style={{
              marginBottom: '20px',
              padding: '12px',
              background: '#1a1a1a',
              borderRadius: '4px',
              fontSize: '10px',
            }}
          >
            <div style={{ marginBottom: '8px' }}>
              <strong>Operation:</strong> {selectedCommit.operation}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Glyph:</strong> {selectedCommit.glyph}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Actor:</strong> {selectedCommit.actor}
            </div>
            <div>
              <strong>Timestamp:</strong> {new Date(selectedCommit.timestamp).toLocaleString()}
            </div>
          </div>

          {/* 6 Faces */}
          <div
            style={{
              fontSize: '12px',
              marginBottom: '10px',
              fontWeight: 'bold',
              color: '#ffaa00',
            }}
          >
            6 Semantic Faces
          </div>

          {Object.entries(selectedCommit.faces).map(([faceKey, face]) => (
            <FaceCard key={faceKey} faceKey={faceKey} face={face} />
          ))}
        </div>
      )}

      {!selectedCommit && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          Click a TimeBox to inspect its 6 faces
        </div>
      )}
    </div>
  );
}

/**
 * Face Card
 */
function FaceCard({ faceKey, face }) {
  const colorMap = {
    plusX: '#00ff00',
    minusX: '#ff00ff',
    plusY: '#ffaa00',
    minusY: '#ff6666',
    plusZ: '#00aaff',
    minusZ: '#aa00ff',
  };

  return (
    <div
      style={{
        marginBottom: '10px',
        padding: '10px',
        background: '#1a1a1a',
        borderRadius: '4px',
        borderLeft: `3px solid ${colorMap[faceKey]}`,
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 'bold',
          marginBottom: '5px',
          color: colorMap[faceKey],
        }}
      >
        {face.label}
      </div>
      <div style={{ fontSize: '9px', color: '#ccc', whiteSpace: 'pre-line' }}>
        {face.content}
      </div>
    </div>
  );
}

/**
 * TimeBox Component (Cube with 6 faces)
 */
function TimeBox({ commit, position, isSelected, onSelect, onSelectFace }) {
  const [hovered, setHovered] = useState(false);

  // Face colors
  const faceColors = [
    '#00ff00', // +X (state) - green
    '#ff00ff', // -X (inputs) - magenta
    '#ffaa00', // +Y (magnitude) - orange
    '#ff6666', // -Y (corrections) - red
    '#00aaff', // +Z (eligibility) - cyan
    '#aa00ff', // -Z (evidence) - purple
  ];

  // Glyph position (top of cube)
  const glyphPosition = [position[0], position[1] + 2, position[2]];

  return (
    <group position={position}>
      {/* Cube (TimeBox) */}
      <mesh
        onClick={onSelect}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial
          color={isSelected ? '#ffffff' : '#444444'}
          emissive={isSelected ? '#0088ff' : hovered ? '#666666' : '#000000'}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0}
          wireframe={!isSelected}
        />
      </mesh>

      {/* Face overlays (colored planes) */}
      {faceColors.map((color, idx) => (
        <FaceOverlay
          key={idx}
          faceIndex={idx}
          color={color}
          visible={isSelected || hovered}
        />
      ))}

      {/* Glyph */}
      <Glyph type={commit.glyph} position={[0, 2.5, 0]} />

      {/* Label */}
      {(hovered || isSelected) && (
        <Html distanceFactor={10}>
          <div
            style={{
              background: '#000',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              border: '1px solid #00ffff',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
              [{commit.index}] {commit.operation}
            </div>
            <div style={{ fontSize: '9px', color: '#aaa' }}>
              Glyph: {commit.glyph}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Face Overlay (colored plane on cube face)
 */
function FaceOverlay({ faceIndex, color, visible }) {
  if (!visible) return null;

  // Position and rotation for each face
  const faceConfigs = [
    { position: [1.01, 0, 0], rotation: [0, Math.PI / 2, 0] }, // +X
    { position: [-1.01, 0, 0], rotation: [0, -Math.PI / 2, 0] }, // -X
    { position: [0, 1.01, 0], rotation: [-Math.PI / 2, 0, 0] }, // +Y
    { position: [0, -1.01, 0], rotation: [Math.PI / 2, 0, 0] }, // -Y
    { position: [0, 0, 1.01], rotation: [0, 0, 0] }, // +Z
    { position: [0, 0, -1.01], rotation: [0, Math.PI, 0] }, // -Z
  ];

  const config = faceConfigs[faceIndex];

  return (
    <mesh position={config.position} rotation={config.rotation}>
      <planeGeometry args={[1.8, 1.8]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

/**
 * Glyph Component
 */
function Glyph({ type, position }) {
  const glyphConfigs = {
    STAMP: { geometry: 'octahedron', color: '#ffaa00', size: 0.3 },
    GATE: { geometry: 'box', color: '#ff0000', size: 0.4 },
    SCAR: { geometry: 'tetrahedron', color: '#ff6666', size: 0.35 },
    NORMAL: { geometry: 'sphere', color: '#00ffff', size: 0.2 },
    KINK: { geometry: 'cone', color: '#ff00ff', size: 0.3 },
    DENT: { geometry: 'torus', color: '#ffff00', size: 0.25 },
    SPLIT: { geometry: 'dodecahedron', color: '#00ff00', size: 0.3 },
    TWIST: { geometry: 'icosahedron', color: '#0088ff', size: 0.3 },
  };

  const config = glyphConfigs[type] || glyphConfigs.NORMAL;

  const GeometryComponent = {
    octahedron: () => <octahedronGeometry args={[config.size]} />,
    box: () => <boxGeometry args={[config.size, config.size, config.size]} />,
    tetrahedron: () => <tetrahedronGeometry args={[config.size]} />,
    sphere: () => <sphereGeometry args={[config.size, 16, 16]} />,
    cone: () => <coneGeometry args={[config.size, config.size * 1.5, 8]} />,
    torus: () => <torusGeometry args={[config.size, config.size * 0.4, 8, 16]} />,
    dodecahedron: () => <dodecahedronGeometry args={[config.size]} />,
    icosahedron: () => <icosahedronGeometry args={[config.size]} />,
  }[config.geometry];

  return (
    <mesh position={position}>
      <GeometryComponent />
      <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={0.5} />
    </mesh>
  );
}
