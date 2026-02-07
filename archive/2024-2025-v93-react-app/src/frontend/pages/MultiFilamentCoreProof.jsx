import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Multi-Filament Core Proof — THE FOUNDATION
 * 
 * Demonstrates:
 * 1. Reality is ALWAYS multi-filament (never single)
 * 2. Identity filaments (things with persistent identity)
 * 3. Constraint filaments (rules that gate transitions)
 * 4. Evidence filaments (proofs that transitions happened)
 * 5. Transitions are conditional existence (not "rejected")
 * 
 * Scenario: PO Approval (simplest multi-filament example)
 * - 3 identity filaments (PO, User, Budget)
 * - 2 constraint filaments (approval policy, budget check)
 * - N evidence filaments (signatures)
 * - Transition only exists if ALL constraints pass
 */
export default function MultiFilamentCoreProof() {
  const [step, setStep] = useState(0);
  const [signatures, setSignatures] = useState([]);
  const [transitionAttempted, setTransitionAttempted] = useState(false);

  // Filament states
  const [poState, setPoState] = useState('PENDING');
  const [approvalConstraint, setApprovalConstraint] = useState({
    required: 3,
    current: 0,
    status: 'FAIL',
  });
  const [budgetConstraint, setBudgetConstraint] = useState({
    required: 50000,
    available: 500000,
    status: 'PASS',
  });

  // Check constraints
  useEffect(() => {
    const approvalPass = signatures.length >= approvalConstraint.required;
    setApprovalConstraint((prev) => ({
      ...prev,
      current: signatures.length,
      status: approvalPass ? 'PASS' : 'FAIL',
    }));

    // If all constraints pass, transition exists
    if (approvalPass && budgetConstraint.status === 'PASS' && transitionAttempted) {
      setTimeout(() => {
        setPoState('APPROVED');
        setStep(5); // Success
      }, 1000);
    }
  }, [signatures, transitionAttempted]);

  const handleAttemptApproval = () => {
    setTransitionAttempted(true);
    setStep(2);
  };

  const handleAddSignature = (signer) => {
    const sig = {
      signer,
      timestamp: Date.now(),
      signedData: 'po:PO-1001:PO_APPROVED',
    };
    setSignatures((prev) => [...prev, sig]);
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleReset = () => {
    setStep(0);
    setSignatures([]);
    setTransitionAttempted(false);
    setPoState('PENDING');
    setApprovalConstraint({ ...approvalConstraint, current: 0, status: 'FAIL' });
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      {/* Left Panel: Truth Inspector */}
      <LeftPanel
        step={step}
        poState={poState}
        signatures={signatures}
        approvalConstraint={approvalConstraint}
        budgetConstraint={budgetConstraint}
        transitionAttempted={transitionAttempted}
        onAttemptApproval={handleAttemptApproval}
        onAddSignature={handleAddSignature}
        onReset={handleReset}
      />

      {/* Right Panel: 3D Scene */}
      <div style={{ flex: 1, background: '#000', position: 'relative' }}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 8, 25]} />
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05}
            minDistance={10}
            maxDistance={50}
            target={[0, 2, 0]}
          />
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 15, 10]} intensity={1.5} />
          <pointLight position={[-10, 5, -10]} intensity={0.5} />

          {/* Identity Filament: PO (center bottom) */}
          <IdentityFilament
            position={[0, -2, 0]}
            label="po:PO-1001"
            state={poState}
            color="#0088ff"
          />

          {/* Identity Filament: User Alice (left) */}
          <IdentityFilament
            position={[-10, -2, 0]}
            label="user:alice"
            state="ACTIVE"
            color="#0088ff"
          />

          {/* Identity Filament: Budget 2026 (right) */}
          <IdentityFilament
            position={[10, -2, 0]}
            label="budget:2026"
            state="AVAILABLE"
            color="#0088ff"
          />

          {/* Constraint Filament: Approval Policy (top left) */}
          <ConstraintFilament
            position={[-5, 6, 0]}
            label="policy:po-approval"
            status={approvalConstraint.status}
          />

          {/* Constraint Filament: Budget Check (top right) */}
          <ConstraintFilament
            position={[5, 6, 0]}
            label="policy:budget-check"
            status={budgetConstraint.status}
          />

          {/* Evidence Filaments: Signatures (below Alice, stacked) */}
          {signatures.map((sig, idx) => (
            <EvidenceFilament
              key={idx}
              position={[-10, -5 - idx * 1.8, 0]}
              label={`signature:${sig.signer}`}
            />
          ))}

          {/* Transition Ghost/Solid (center top) */}
          {transitionAttempted && (
            <TransitionNode
              position={[0, 6, 0]}
              status={
                approvalConstraint.status === 'PASS' && budgetConstraint.status === 'PASS'
                  ? 'EXISTS'
                  : 'DOES_NOT_EXIST'
              }
            />
          )}

          {/* Gate Rays (from constraints to transition) */}
          {transitionAttempted && (
            <>
              <GateRay
                from={[-5, 6, 0]}
                to={[0, 6, 0]}
                status={approvalConstraint.status}
              />
              <GateRay
                from={[5, 6, 0]}
                to={[0, 6, 0]}
                status={budgetConstraint.status}
              />
            </>
          )}

          {/* Grid (at bottom for reference) */}
          <gridHelper args={[40, 40, '#333', '#111']} position={[0, -5, 0]} />
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
          🧬 Multi-Filament Core
        </div>
      </div>
    </div>
  );
}

/**
 * Left Panel: Truth Inspector
 */
function LeftPanel({
  step,
  poState,
  signatures,
  approvalConstraint,
  budgetConstraint,
  transitionAttempted,
  onAttemptApproval,
  onAddSignature,
  onReset,
}) {
  return (
    <div
      style={{
        width: '380px',
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
        🧬 Multi-Filament Core
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
          THE FOUNDATION (Layer Zero)
        </div>
        <div style={{ marginBottom: '8px' }}>
          Relay is NOT a system of filaments.
        </div>
        <div style={{ color: '#00ff00' }}>
          Relay is a system of irreversible state transitions, and filaments are merely the
          traces we preserve.
        </div>
      </div>

      {/* Scenario */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '13px',
            marginBottom: '10px',
            fontWeight: 'bold',
            color: '#ffaa00',
          }}
        >
          Scenario: PO Approval
        </div>
        <div style={{ fontSize: '10px', color: '#aaa', lineHeight: '1.6' }}>
          What appears to happen: One button click
          <br />
          What actually happens: 6 filaments coordinate under constraints
        </div>
      </div>

      {/* Identity Filaments */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '12px',
            marginBottom: '10px',
            fontWeight: 'bold',
            color: '#0088ff',
          }}
        >
          Identity Filaments: (3)
        </div>

        <FilamentCard
          label="🔵 po:PO-1001"
          state={poState}
          details={['Vendor: ACME Corp', 'Amount: $50,000']}
        />
        <FilamentCard
          label="🔵 user:alice"
          state="ACTIVE"
          details={['Roles: [procurement-manager]', 'Permissions: [approve-po]']}
        />
        <FilamentCard
          label="🔵 budget:2026"
          state="AVAILABLE"
          details={['Total: $1,000,000', 'Spent: $500,000', 'Available: $500,000']}
        />
      </div>

      {/* Constraint Filaments */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '12px',
            marginBottom: '10px',
            fontWeight: 'bold',
            color: approvalConstraint.status === 'PASS' ? '#00ff00' : '#ff0000',
          }}
        >
          Constraint Filaments: (2)
        </div>

        <ConstraintCard
          label="policy:po-approval"
          status={approvalConstraint.status}
          details={[
            `Required: ${approvalConstraint.required} signatures`,
            `Current: ${approvalConstraint.current} signatures`,
            `Signers: ${signatures.map((s) => s.signer).join(', ') || 'none'}`,
          ]}
        />
        <ConstraintCard
          label="policy:budget-check"
          status={budgetConstraint.status}
          details={[
            `Required: $${budgetConstraint.required.toLocaleString()} available`,
            `Current: $${budgetConstraint.available.toLocaleString()} available`,
          ]}
        />
      </div>

      {/* Evidence Filaments */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '12px',
            marginBottom: '10px',
            fontWeight: 'bold',
            color: '#ffaa00',
          }}
        >
          Evidence Filaments: ({signatures.length})
        </div>

        {signatures.length === 0 && (
          <div style={{ fontSize: '10px', color: '#666', padding: '10px' }}>
            No evidence yet
          </div>
        )}

        {signatures.map((sig, idx) => (
          <FilamentCard
            key={idx}
            label={`🟡 signature:${sig.signer}`}
            state="IMMUTABLE"
            details={[`Timestamp: ${new Date(sig.timestamp).toLocaleTimeString()}`]}
          />
        ))}
      </div>

      {/* Transition Status */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '12px',
            marginBottom: '10px',
            fontWeight: 'bold',
            color: '#00ffff',
          }}
        >
          Transition: PO_APPROVED
        </div>

        <div
          style={{
            padding: '12px',
            background: '#1a1a1a',
            borderRadius: '4px',
            borderLeft: `3px solid ${
              poState === 'APPROVED' ? '#00ff00' : transitionAttempted ? '#ff0000' : '#666'
            }`,
          }}
        >
          <div style={{ fontSize: '11px', marginBottom: '8px', fontWeight: 'bold' }}>
            Status:{' '}
            {poState === 'APPROVED'
              ? 'EXISTS ✅'
              : transitionAttempted
              ? 'DOES NOT EXIST ❌'
              : 'NOT ATTEMPTED'}
          </div>

          {transitionAttempted && poState === 'PENDING' && (
            <div style={{ fontSize: '10px', color: '#ff6666' }}>
              Reason: Constraint #1 failed
              <br />
              (Need {approvalConstraint.required} signatures, have {signatures.length})
            </div>
          )}

          {poState === 'APPROVED' && (
            <div style={{ fontSize: '10px', color: '#66ff66' }}>
              All constraints passed!
              <br />
              Transition exists.
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div>
        <div
          style={{
            fontSize: '12px',
            marginBottom: '10px',
            fontWeight: 'bold',
            color: '#ffaa00',
          }}
        >
          Actions:
        </div>

        {step === 0 && (
          <button
            onClick={onAttemptApproval}
            style={{
              width: '100%',
              padding: '12px',
              background: '#0088ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '10px',
            }}
          >
            1. Attempt Approval (Alice)
          </button>
        )}

        {step >= 2 && step < 5 && (
          <>
            <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '10px' }}>
              Approval failed. Add more signatures:
            </div>
            {['Bob', 'Charlie'].map((signer) => {
              const alreadySigned = signatures.some((s) => s.signer === signer);
              return (
                <button
                  key={signer}
                  onClick={() => onAddSignature(signer)}
                  disabled={alreadySigned}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: alreadySigned ? '#333' : '#00ff00',
                    color: alreadySigned ? '#666' : '#000',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: alreadySigned ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                  }}
                >
                  {alreadySigned ? `✅ ${signer} signed` : `Add ${signer}'s signature`}
                </button>
              );
            })}
          </>
        )}

        {step >= 5 && (
          <div
            style={{
              padding: '12px',
              background: '#1a4d1a',
              borderRadius: '4px',
              color: '#00ff00',
              fontSize: '11px',
              marginBottom: '10px',
              textAlign: 'center',
              fontWeight: 'bold',
            }}
          >
            ✅ TRANSITION EXISTS
            <br />
            PO-1001 is now APPROVED
          </div>
        )}

        <button
          onClick={onReset}
          style={{
            width: '100%',
            padding: '10px',
            background: '#333',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          Reset
        </button>
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: '20px',
          padding: '12px',
          background: '#1a1a1a',
          borderRadius: '4px',
          fontSize: '9px',
          lineHeight: '1.8',
          color: '#666',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#888' }}>
          Legend:
        </div>
        <div>🔵 Identity filaments (blue cylinders)</div>
        <div>🟢 Constraint PASS (green cubes)</div>
        <div>🔴 Constraint FAIL (red cubes)</div>
        <div>🟡 Evidence (yellow spheres)</div>
        <div>⚫ Transition ghost (does not exist)</div>
        <div>🟢 Transition solid (exists)</div>
      </div>
    </div>
  );
}

/**
 * Filament Card (Left Panel)
 */
function FilamentCard({ label, state, details }) {
  return (
    <div
      style={{
        marginBottom: '10px',
        padding: '10px',
        background: '#1a1a1a',
        borderRadius: '4px',
        borderLeft: '3px solid #0088ff',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '5px' }}>
        {label}
      </div>
      <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '5px' }}>
        State: {state}
      </div>
      {details.map((detail, i) => (
        <div key={i} style={{ fontSize: '9px', color: '#666' }}>
          {detail}
        </div>
      ))}
    </div>
  );
}

/**
 * Constraint Card (Left Panel)
 */
function ConstraintCard({ label, status, details }) {
  return (
    <div
      style={{
        marginBottom: '10px',
        padding: '10px',
        background: status === 'PASS' ? '#1a3a1a' : '#3a1a1a',
        borderRadius: '4px',
        borderLeft: `3px solid ${status === 'PASS' ? '#00ff00' : '#ff0000'}`,
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '5px' }}>
        {label}
      </div>
      <div
        style={{
          fontSize: '10px',
          color: status === 'PASS' ? '#66ff66' : '#ff6666',
          marginBottom: '5px',
        }}
      >
        Status: {status}
      </div>
      {details.map((detail, i) => (
        <div key={i} style={{ fontSize: '9px', color: '#888' }}>
          {detail}
        </div>
      ))}
    </div>
  );
}

/**
 * Identity Filament (3D)
 */
function IdentityFilament({ position, label, state, color }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      {/* Cylinder */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.5, 0.5, 3, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>

      {/* Label */}
      {hovered && (
        <Html distanceFactor={10}>
          <div
            style={{
              background: '#000',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              border: `1px solid ${color}`,
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>{label}</div>
            <div style={{ fontSize: '9px', color: '#aaa' }}>State: {state}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Constraint Filament (3D)
 */
function ConstraintFilament({ position, label, status }) {
  const [hovered, setHovered] = useState(false);
  const color = status === 'PASS' ? '#00ff00' : '#ff0000';

  return (
    <group position={position}>
      {/* Cube */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Label */}
      {hovered && (
        <Html distanceFactor={10}>
          <div
            style={{
              background: '#000',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              border: `1px solid ${color}`,
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>{label}</div>
            <div style={{ fontSize: '9px', color: status === 'PASS' ? '#66ff66' : '#ff6666' }}>
              Status: {status}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Evidence Filament (3D)
 */
function EvidenceFilament({ position, label }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      {/* Sphere */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ffaa00" />
      </mesh>

      {/* Label */}
      {hovered && (
        <Html distanceFactor={10}>
          <div
            style={{
              background: '#000',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              border: '1px solid #ffaa00',
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{label}</div>
            <div style={{ fontSize: '9px', color: '#aaa' }}>Type: IMMUTABLE PROOF</div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Transition Node (Ghost or Solid)
 */
function TransitionNode({ position, status }) {
  const [hovered, setHovered] = useState(false);

  const isGhost = status === 'DOES_NOT_EXIST';
  const color = isGhost ? '#888888' : '#00ff00';

  return (
    <group position={position}>
      {/* Box */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isGhost ? 0.3 : 1}
          wireframe={isGhost}
          emissive={isGhost ? '#000000' : '#00ff00'}
          emissiveIntensity={isGhost ? 0 : 0.5}
        />
      </mesh>

      {/* Label */}
      {hovered && (
        <Html distanceFactor={10}>
          <div
            style={{
              background: '#000',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              border: `1px solid ${color}`,
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
              Transition: PO_APPROVED
            </div>
            <div
              style={{
                fontSize: '9px',
                color: isGhost ? '#ff6666' : '#66ff66',
              }}
            >
              {status}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Gate Ray (Connection from Constraint to Transition)
 */
function GateRay({ from, to, status }) {
  const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
  const color = status === 'PASS' ? '#00ff00' : '#ff0000';

  return (
    <line geometry={new THREE.BufferGeometry().setFromPoints(points)}>
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  );
}
