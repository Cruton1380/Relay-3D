/**
 * PRIVACY LADDER PROOF
 * 
 * Route: /proof/privacy-ladder
 * 
 * Proves the 7-level visibility model:
 * - Same filament, different policy/distance = different rendering
 * - Distance changes fidelity ONLY if permission allows existence
 * - No "back door" leaks (L2-L4 never show values/evidence)
 * 
 * Pass criteria:
 * - Scrub policy 0→6: reality reveals in steps
 * - Same camera, different policy: different existence
 * - Same policy, different distance: different fidelity
 */

import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  resolveTier,
  POLICY_LEVELS,
  ROLE_PRESETS,
  getPolicyLevelName,
  getDistanceLabel,
} from '../components/filament/utils/privacyTierResolver';

/**
 * NETWORK ANTI-LEAK (Relay-grade):
 * 
 * In this proof, the full filament is in-memory, which is acceptable for demo.
 * In production:
 * - L2-L4 should NOT fetch face values/evidence from backend
 * - API should return only {id, type} at L2-L4, not full TimeBox objects
 * - Rule: "tier gates data access", not "load it then hide it"
 * 
 * This prevents JS memory inspection leaks.
 */
// Reuse demo filament data
const DEMO_FILAMENT = {
  id: 'invoice-001',
  name: 'Invoice Processing',
  timeBoxes: [
    { 
      id: 'tb0', eventIndex: 0, timestamp: 1000,
      type: 'document',
      faces: { 
        output: { value: 'Loaded', type: 'text' },
        semanticMeaning: { label: 'Data Source' },
        evidence: { pointer: 'invoice_raw.csv' }
      }
    },
    { 
      id: 'tb1', eventIndex: 1, timestamp: 1500,
      type: 'transform',
      faces: { 
        output: { value: 'Parsed', type: 'text' },
        semanticMeaning: { label: 'Format Conversion' },
        evidence: { pointer: 'parse_commit#a1f3' }
      }
    },
    { 
      id: 'tb2', eventIndex: 2, timestamp: 8000,
      type: 'validation',
      faces: { 
        output: { value: 'Filtered', type: 'text' },
        semanticMeaning: { label: 'Validation' },
        evidence: { pointer: 'filter_commit#b2e4' }
      }
    },
    { 
      id: 'tb3', eventIndex: 3, timestamp: 9000,
      type: 'numeric',
      faces: { 
        output: { value: '$1,250.00', type: 'numeric' },
        semanticMeaning: { label: 'Amount Converted' },
        evidence: { pointer: 'convert_commit#c3d5' }
      }
    },
  ],
};

const DELTA_X = 10; // Event spacing

/**
 * TimeBox Renderer with tier-based visibility
 * 
 * ANTI-LEAK GUARANTEE (L2-L4):
 * - No hover tooltips with values/evidence
 * - No console logging of sensitive data
 * - No DOM text nodes for values (even if hidden)
 * - Face content ONLY rendered when renderFlags.showClear === true
 * 
 * RELAY-GRADE HARDENING:
 * 1. Network anti-leak: Don't fetch/precompute sensitive payloads at L2-L4
 *    (Rule: "tier gates data access", not "load it then hide it")
 * 2. Pick/hover anti-leak: Return only {timeBoxId, type} at L2-L4, never full object
 */
function TieredTimeBox({ timeBox, xPosition, renderFlags }) {
  const [hovered, setHovered] = useState(false);

  // L0-L1: No boxes
  if (!renderFlags.showBoxes) return null;

  // ANTI-LEAK: Never log sensitive data
  // ❌ console.log(timeBox.faces.output.value); // FORBIDDEN
  
  // ANTI-LEAK: Hover handler returns only minimal data at L2-L4
  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    
    // Only expose safe metadata based on tier
    if (!renderFlags.showClear) {
      // L2-L4: Return only timeBoxId and type (no values, no evidence)
      console.log('[Hover] TimeBox:', { id: timeBox.id, type: renderFlags.showTypes ? timeBox.type : 'hidden' });
    } else {
      // L5-L6: Can log full object
      console.log('[Hover] TimeBox:', timeBox);
    }
  };
  
  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHovered(false);
  };
  
  // Base cube color
  const baseColor = hovered ? '#ffffff' : '#888888';
  
  return (
    <group position={[xPosition, 0, 0]}>
      {/* Base TimeBox cube */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial 
          color={baseColor}
          transparent={!renderFlags.showClear}
          opacity={renderFlags.showBlur ? 0.3 : (renderFlags.showClear ? 1.0 : 0.6)}
          wireframe={!renderFlags.showClear && !renderFlags.showBlur}
        />
      </mesh>

      {/* L3+: Type badge */}
      {renderFlags.showTypes && timeBox.type && (
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.4}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
        >
          {timeBox.type}
        </Text>
      )}

      {/* L4: Blurred system indicator */}
      {renderFlags.showBlur && !renderFlags.showClear && (
        <Text
          position={[0, 0, 1.2]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          [System Data]
        </Text>
      )}

      {/* L5+: Clear face content (on hover) */}
      {/* ANTI-LEAK: Face values ONLY rendered when showClear=true */}
      {/* At L2-L4, showClear is ALWAYS false, so this block never executes */}
      {renderFlags.showClear && hovered && (
        <>
          <Text
            position={[1.2, 0, 0]}
            fontSize={0.25}
            color="#00ff00"
            anchorX="left"
            anchorY="middle"
          >
            {`+X: ${timeBox.faces.output.value}`}
          </Text>
          <Text
            position={[0, 0, -1.2]}
            fontSize={0.2}
            color="#ffaa00"
            anchorX="center"
            anchorY="middle"
          >
            {`-Z: ${timeBox.faces.evidence.pointer}`}
          </Text>
        </>
      )}

      {/* L6: Engage indicator */}
      {renderFlags.allowEngage && (
        <mesh position={[0, -1.5, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Filament spine with tier-based visibility
 */
function TieredFilament({ filament, renderFlags }) {
  if (!renderFlags.showFilament) return null;

  const positions = filament.timeBoxes.map((tb, i) => [i * DELTA_X, 0, 0]);

  return (
    <group>
      {/* Spine tube */}
      {positions.length > 1 && (
        <mesh>
          <tubeGeometry args={[
            new THREE.CatmullRomCurve3(positions.map(p => new THREE.Vector3(...p))),
            64,
            0.15,
            8,
            false
          ]} />
          <meshStandardMaterial 
            color="#444444"
            transparent
            opacity={renderFlags.showClear ? 0.8 : 0.3}
          />
        </mesh>
      )}

      {/* TimeBoxes */}
      {filament.timeBoxes.map((tb, i) => (
        <TieredTimeBox
          key={tb.id}
          timeBox={tb}
          xPosition={i * DELTA_X}
          renderFlags={renderFlags}
        />
      ))}
    </group>
  );
}

/**
 * Camera distance tracker
 */
function CameraDistanceTracker({ onDistanceChange }) {
  const { camera } = useThree();
  const filamentCenter = new THREE.Vector3(15, 0, 0); // Center of 4 boxes

  useEffect(() => {
    const interval = setInterval(() => {
      const dist = camera.position.distanceTo(filamentCenter);
      onDistanceChange(dist);
    }, 100);
    return () => clearInterval(interval);
  }, [camera, onDistanceChange]);

  return null;
}

/**
 * Main proof component
 */
export default function PrivacyLadderProof() {
  const [policyLevel, setPolicyLevel] = useState(POLICY_LEVELS.READ_CLEAR);
  const [selectedRole, setSelectedRole] = useState('editor');
  const [cameraDistance, setCameraDistance] = useState(25);
  const [useManualDistance, setUseManualDistance] = useState(false);
  const [manualDistance, setManualDistance] = useState(25);

  const effectiveDistance = useManualDistance ? manualDistance : cameraDistance;
  const tier = resolveTier(policyLevel, effectiveDistance);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      {/* Left Control Panel */}
      <div style={{
        width: '320px',
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '20px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '13px',
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#00ff00' }}>
          🔒 Privacy Ladder Proof
        </h2>

        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
          <div style={{ color: '#888', marginBottom: '10px' }}>Current Tier:</div>
          <div style={{ fontSize: '16px', color: '#00ffff', fontWeight: 'bold' }}>
            {tier.label}
          </div>
        </div>

        {/* Policy Level Control */}
        <div style={{ marginBottom: '25px' }}>
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
          <div style={{ fontSize: '11px', color: '#888' }}>
            {getPolicyLevelName(policyLevel)}
          </div>
        </div>

        {/* Role Preset */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ffaa00' }}>
            Viewer Role:
          </label>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPolicyLevel(ROLE_PRESETS[e.target.value].defaultPolicy);
            }}
            style={{
              width: '100%',
              padding: '8px',
              background: '#222',
              color: 'white',
              border: '1px solid #444',
              borderRadius: '4px',
            }}
          >
            {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>{preset.label}</option>
            ))}
          </select>
        </div>

        {/* Distance Control */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', color: '#ffaa00' }}>
            <input
              type="checkbox"
              checked={useManualDistance}
              onChange={(e) => setUseManualDistance(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Manual Distance Override
          </label>
          
          {useManualDistance ? (
            <>
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={manualDistance}
                onChange={(e) => setManualDistance(parseInt(e.target.value))}
                style={{ width: '100%', marginBottom: '5px' }}
              />
              <div style={{ fontSize: '11px', color: '#888' }}>
                {manualDistance.toFixed(1)} units - {getDistanceLabel(manualDistance)}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '11px', color: '#888' }}>
              Live camera: {cameraDistance.toFixed(1)} units - {getDistanceLabel(cameraDistance)}
            </div>
          )}
        </div>

        {/* Render Flags */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: '#888', marginBottom: '10px', fontSize: '12px' }}>Render Flags:</div>
          <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
            {Object.entries(tier.renderFlags).map(([key, value]) => (
              <div key={key} style={{ color: value ? '#00ff00' : '#444' }}>
                {value ? '✓' : '✗'} {key}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #333' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>
            <strong>Pass Criteria:</strong>
          </div>
          <ul style={{ fontSize: '10px', color: '#888', lineHeight: '1.6', paddingLeft: '20px' }}>
            <li>L0: Nothing visible</li>
            <li>L2: Boxes only, no values</li>
            <li>L3: Type badges appear</li>
            <li>L4: "System Data" blur</li>
            <li>L5: Hover shows values</li>
            <li>L6: Green engage dot</li>
          </ul>
        </div>
      </div>

      {/* 3D Viewport */}
      <div style={{ flex: 1, background: '#000' }}>
        <Canvas camera={{ position: [15, 10, 25], fov: 50 }}>
          <CameraDistanceTracker onDistanceChange={setCameraDistance} />
          
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          <pointLight position={[20, 5, -10]} intensity={0.5} />

          {/* Tier message in 3D space */}
          {tier.tier > 0 && (
            <Text
              position={[15, 8, 0]}
              fontSize={0.8}
              color="#00ffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#000000"
            >
              {tier.label}
            </Text>
          )}

          {/* Privacy warning for L0-L1 */}
          {tier.tier <= 1 && (
            <Text
              position={[15, 0, 0]}
              fontSize={1.2}
              color="#ff0000"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.08}
              outlineColor="#000000"
            >
              {tier.tier === 0 ? 'INVISIBLE' : 'PRESENCE ONLY'}
            </Text>
          )}

          {/* Render filament with tier-based visibility */}
          <TieredFilament filament={DEMO_FILAMENT} renderFlags={tier.renderFlags} />

          {/* Grid reference */}
          <gridHelper args={[60, 60, '#222222', '#111111']} position={[15, -3, 0]} />

          <OrbitControls
            target={[15, 0, 0]}
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={60}
          />
        </Canvas>

        {/* Overlay status */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '340px',
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
          <span>Policy = L{policyLevel} ({getPolicyLevelName(policyLevel)})</span>
          <span>Distance = {effectiveDistance.toFixed(1)} ({getDistanceLabel(effectiveDistance)})</span>
          <span style={{ color: '#00ffff' }}>Result: {tier.label}</span>
        </div>
      </div>
    </div>
  );
}
