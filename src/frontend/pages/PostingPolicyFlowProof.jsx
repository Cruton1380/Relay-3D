/**
 * POSTING POLICY FLOW PROOF
 * 
 * Route: /proof/posting-policy-flow
 * 
 * Proves:
 * - Accounting hierarchy as living policy (not static config)
 * - Posting as governed truth (not ledger sink)
 * - Classification validation via assignment filaments
 * - Policy GATE blocking + override requiring approval
 * - Posting bundle as atomic locked pairs
 * 
 * Flow: 8 steps
 * 1-5: PO → Receipt → Invoice → Match → Override (reuse from PO Flow)
 * 6: Resolve Classification (dimension + assignment)
 * 7: Validate Policy (GATE - may block)
 * 8: Create Posting Bundle (atomic)
 * 
 * Layout: Multi-level spatial orchestration
 * - Top: PO/Receipt/Invoice/Match (procurement layer)
 * - Middle: Dimension filaments (org structure)
 * - Bottom: Classification/Posting (accounting layer)
 */

import React, { useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';

// Procurement schemas (reuse from PO Flow)
import {
  createPOCreatedCommit,
  createPOApprovedCommit,
  createReceiptRecordedCommit,
  createInvoiceCapturedCommit,
  createMatchOverrideCommit,
} from '../components/procurement/schemas/commitSchemas';
import {
  autoEvaluateMatch,
  getMatchSummary,
} from '../components/procurement/utils/matchEngine';

// Accounting schemas (new)
import {
  createDimensionCreatedCommit,
  createAssignmentCreatedCommit,
  createClassificationDeclaredCommit,
  createClassificationPolicyExceptionCommit,
  createPostingCreatedCommit,
} from '../components/accounting/schemas/accountingCommitSchemas';
import {
  getPolicyValidationSummary,
} from '../components/accounting/utils/policyEngine';

// Presence
import { presenceService } from '../components/filament/services/presenceService';

/**
 * Initial state: Pre-seeded with dimension + assignment filaments
 */
const INITIAL_STATE = {
  // Procurement (steps 1-5)
  po: { id: 'po.PO-1001', commits: [] },
  receipt: { id: 'receipt.R-5001', commits: [] },
  invoice: { id: 'invoice.I-9001', commits: [] },
  match: { id: 'match.PO-1001', commits: [] },
  
  // Dimensions (pre-seeded)
  costCenter: {
    id: 'org.costCenter.CC-77',
    commits: [
      createDimensionCreatedCommit(
        'org.costCenter.CC-77',
        0,
        'system',
        {
          costCenterId: 'CC-77',
          name: 'IT Operations',
          description: 'Technology infrastructure and support',
          status: 'ACTIVE',
        }
      ),
    ],
  },
  department: {
    id: 'org.department.D-10',
    commits: [
      createDimensionCreatedCommit(
        'org.department.D-10',
        0,
        'system',
        {
          departmentId: 'D-10',
          name: 'Finance',
          description: 'Financial operations',
          status: 'ACTIVE',
        }
      ),
    ],
  },
  
  // Assignment (pre-seeded) - THIS WILL BE INVALID (CC-77 assigned to D-15, not D-10)
  assignment: {
    id: 'assign.costCenterToDept.CC-77',
    commits: [
      createAssignmentCreatedCommit(
        'assign.costCenterToDept.CC-77',
        0,
        'system',
        [
          { filamentId: 'org.costCenter.CC-77', commitIndex: 0 },
          { filamentId: 'org.department.D-15', commitIndex: 0 }, // D-15, not D-10!
        ],
        {
          costCenterId: 'CC-77',
          departmentId: 'D-15', // Wrong department!
          effectiveFrom: '2026-01-01',
          effectiveTo: '2026-12-31',
        }
      ),
    ],
  },
  
  // Classification (step 6)
  classification: { id: 'classification.POST-123', commits: [] },
  
  // Posting (step 8)
  posting: { id: 'posting.POST-123', commits: [] },
};

const DEMO_PO_DATA = {
  poId: 'PO-1001',
  vendorId: 'VENDOR-123',
  lines: [
    { lineId: 'A', sku: 'WIDGET-X', desc: 'Industrial Widget', qtyOrdered: 10, unitPrice: 50 },
    { lineId: 'B', sku: 'BOLT-Y', desc: 'Steel Bolt 5mm', qtyOrdered: 5, unitPrice: 2 },
  ],
};

const DEMO_RECEIPT_DATA = {
  receiptId: 'R-5001',
  poId: 'PO-1001',
  receivedLines: [
    { lineId: 'A', qtyReceived: 8, condition: 'OK' },
    { lineId: 'B', qtyReceived: 5, condition: 'OK' },
  ],
};

const DEMO_INVOICE_DATA = {
  invoiceId: 'I-9001',
  vendorId: 'VENDOR-123',
  poId: 'PO-1001',
  invoiceLines: [
    { lineId: 'A', qtyInvoiced: 10, unitPrice: 50 },
    { lineId: 'B', qtyInvoiced: 5, unitPrice: 2 },
  ],
  source: { kind: 'pdf', ref: 'invoice-scan-001.pdf' },
};

/**
 * Simple TimeBox/Commit renderer
 */
function CommitBox({ commit, position, color, label }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      <Text
        position={[0, 0.9, 0]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
      >
        {label}
      </Text>
      <Text
        position={[0, -0.9, 0]}
        fontSize={0.15}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        #{commit.commitIndex}
      </Text>
    </group>
  );
}

/**
 * Filament spine with commits
 */
function FilamentSpine({ filament, yPosition, zPosition, color, label }) {
  if (!filament.commits || filament.commits.length === 0) {
    return (
      <group position={[0, yPosition, zPosition]}>
        <Text
          position={[0, 0, 0]}
          fontSize={0.25}
          color="#666666"
          anchorX="center"
          anchorY="middle"
        >
          {label} (empty)
        </Text>
      </group>
    );
  }
  
  const DELTA_X = 2.5;
  
  return (
    <group position={[0, yPosition, zPosition]}>
      {/* Label */}
      <Text
        position={[-1.5, 1.5, 0]}
        fontSize={0.28}
        color={color}
        anchorX="left"
        anchorY="middle"
      >
        {label}
      </Text>
      
      {/* Commits */}
      {filament.commits.map((commit, i) => (
        <CommitBox
          key={i}
          commit={commit}
          position={[i * DELTA_X, 0, 0]}
          color={color}
          label={commit.op.replace(/_/g, ' ').substring(0, 12)}
        />
      ))}
      
      {/* Spine */}
      {filament.commits.length > 1 && (
        <mesh>
          <tubeGeometry args={[
            new THREE.CatmullRomCurve3(
              filament.commits.map((c, i) => new THREE.Vector3(i * DELTA_X, 0, 0))
            ),
            32,
            0.08,
            8,
            false
          ]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      )}
    </group>
  );
}

/**
 * Presence Marker
 */
function PresenceMarker({ position, count, showLabel }) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <group position={position}>
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? '#FFD700' : '#2ECC71'}
          transparent
          opacity={0.9}
          emissive={hovered ? '#FFD700' : '#2ECC71'}
          emissiveIntensity={hovered ? 0.6 : 0.3}
        />
      </mesh>
      
      {(showLabel || hovered) && (
        <Text
          position={[0, 0.6, 0]}
          fontSize={0.2}
          color="#E6E6E6"
          anchorX="center"
          anchorY="bottom"
        >
          {count} {count === 1 ? 'viewer' : 'viewers'}
        </Text>
      )}
    </group>
  );
}

/**
 * Presence Layer
 */
function PresenceRenderer({ lociInView, anchorMap }) {
  const { camera } = useThree();
  const [presenceData, setPresenceData] = useState([]);
  const [cameraDistance, setCameraDistance] = useState(50);
  
  useEffect(() => {
    const updateDistance = () => {
      const distance = camera.position.length();
      setCameraDistance(distance);
    };
    
    updateDistance();
    const interval = setInterval(updateDistance, 500);
    return () => clearInterval(interval);
  }, [camera]);
  
  useEffect(() => {
    if (lociInView.length === 0) return;
    
    const updatePresence = () => {
      const results = presenceService.getPresenceForLoci(lociInView);
      setPresenceData(results.filter(r => r.count > 0));
    };
    
    updatePresence();
    const interval = setInterval(updatePresence, 2000);
    return () => clearInterval(interval);
  }, [lociInView]);
  
  const showLabel = cameraDistance < 30;
  
  return (
    <group name="presence-layer">
      {presenceData.map((presence) => {
        const key = `${presence.locus.filamentId}@${presence.locus.commitIndex}`;
        const position = anchorMap.get(key);
        
        if (!position) return null;
        
        return (
          <PresenceMarker
            key={key}
            position={[position[0], position[1] + 2, position[2]]}
            count={presence.count}
            showLabel={showLabel}
          />
        );
      })}
    </group>
  );
}

/**
 * Main proof component
 */
export default function PostingPolicyFlowProof() {
  const [state, setState] = useState(INITIAL_STATE);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Ready to start procurement + accounting flow');
  
  const userId = 'demo-user';
  
  // Steps 1-5: Procurement (reuse from PO Flow)
  const handleCreatePO = () => {
    const commit = createPOCreatedCommit('po.PO-1001', 0, userId, DEMO_PO_DATA);
    setState(prev => ({ ...prev, po: { ...prev.po, commits: [commit] } }));
    setStatusMessage('✅ PO created');
    setCurrentStep(1);
  };
  
  const handleApprovePO = () => {
    const commit = createPOApprovedCommit('po.PO-1001', state.po.commits.length, userId, { note: 'Budget verified' });
    setState(prev => ({ ...prev, po: { ...prev.po, commits: [...prev.po.commits, commit] } }));
    setStatusMessage('✅ PO approved (GATE passed)');
    setCurrentStep(2);
  };
  
  const handleRecordReceipt = () => {
    const poLatestIndex = state.po.commits.length - 1;
    const commit = createReceiptRecordedCommit('receipt.R-5001', 0, userId, 'po.PO-1001', poLatestIndex, DEMO_RECEIPT_DATA);
    
    setState(prev => {
      const newState = { ...prev, receipt: { ...prev.receipt, commits: [commit] } };
      const newMatch = autoEvaluateMatch(newState.match, newState.po, newState.receipt, null);
      return { ...newState, match: newMatch };
    });
    
    setStatusMessage('✅ Receipt recorded (Partial: 8 of 10 widgets)');
    setCurrentStep(3);
  };
  
  const handleCaptureInvoice = () => {
    const poLatestIndex = state.po.commits.length - 1;
    const commit = createInvoiceCapturedCommit('invoice.I-9001', 0, userId, 'po.PO-1001', poLatestIndex, DEMO_INVOICE_DATA);
    
    setState(prev => {
      const newState = { ...prev, invoice: { ...prev.invoice, commits: [commit] } };
      const newMatch = autoEvaluateMatch(newState.match, newState.po, newState.receipt, newState.invoice);
      return { ...newState, match: newMatch };
    });
    
    setStatusMessage('⚠️ Invoice captured → Match EXCEPTION');
    setCurrentStep(4);
  };
  
  const handleApproveOverride = () => {
    const matchSummary = getMatchSummary(state.match);
    if (!matchSummary || matchSummary.state !== 'EXCEPTION') {
      setStatusMessage(`❌ No exception to override`);
      return;
    }
    
    const commit = createMatchOverrideCommit('match.PO-1001', state.match.commits.length, userId, {
      poId: 'PO-1001',
      reasonCode: 'ACCEPT_PARTIAL_RECEIPT',
      note: 'Vendor confirmed backorder',
      approvedByRole: 'APManager',
    });
    
    setState(prev => ({
      ...prev,
      match: { ...prev.match, commits: [...prev.match.commits, commit] },
    }));
    
    setStatusMessage('✅ Override approved → Ready to post');
    setCurrentStep(5);
  };
  
  // Step 6: Resolve Classification
  const handleResolveClassification = () => {
    const commit = createClassificationDeclaredCommit(
      'classification.POST-123',
      0,
      userId,
      [
        { filamentId: 'org.costCenter.CC-77', commitIndex: 0 },
        { filamentId: 'org.department.D-10', commitIndex: 0 },
      ],
      {
        postingId: 'POST-123',
        costCenter: 'CC-77',
        department: 'D-10', // User WANTS D-10, but assignment says CC-77 → D-15!
        legalEntity: 'LE-1',
        account: '6100',
      }
    );
    
    setState(prev => ({
      ...prev,
      classification: { ...prev.classification, commits: [commit] },
    }));
    
    setStatusMessage('✅ Classification declared → Validating policy...');
    setCurrentStep(6);
  };
  
  // Step 7: Validate Policy (GATE blocks because CC-77 is assigned to D-15, not D-10)
  const handleValidatePolicy = () => {
    const policySummary = getPolicyValidationSummary(state.classification, state.assignment);
    
    console.log('[PostingPolicy] Step 7 - Policy validation:', policySummary);
    
    if (policySummary.state === 'POLICY_BLOCK') {
      setStatusMessage(`🚫 POLICY BLOCKED: ${policySummary.reason}`);
      setCurrentStep(7);
    } else if (policySummary.canPost) {
      setStatusMessage('✅ Policy validated → Ready to post');
      setCurrentStep(8);
    }
  };
  
  // Step 7b: Override Policy Exception (GATE approval)
  const handleOverridePolicy = () => {
    const commit = createClassificationPolicyExceptionCommit(
      'classification.POST-123',
      state.classification.commits.length,
      userId,
      { filamentId: 'assign.costCenterToDept.CC-77', commitIndex: 0 },
      {
        postingId: 'POST-123',
        policyViolation: 'CC-77 is assigned to D-15, not D-10',
        overrideReason: 'Emergency infrastructure spend for Finance dept',
        approvedBy: 'Controller',
      }
    );
    
    setState(prev => ({
      ...prev,
      classification: { ...prev.classification, commits: [...prev.classification.commits, commit] },
    }));
    
    setStatusMessage('✅ Policy exception approved (GATE opened) → Ready to post');
    setCurrentStep(8);
  };
  
  // Step 8: Create Posting Bundle
  const handlePostToLedger = () => {
    const policySummary = getPolicyValidationSummary(state.classification, state.assignment);
    
    if (!policySummary.canPost) {
      setStatusMessage('❌ Cannot post: Policy not approved');
      return;
    }
    
    const matchLatestIndex = state.match.commits.length - 1;
    const classificationLatestIndex = state.classification.commits.length - 1;
    
    const commit = createPostingCreatedCommit(
      'posting.POST-123',
      0,
      userId,
      { filamentId: 'match.PO-1001', commitIndex: matchLatestIndex },
      { filamentId: 'classification.POST-123', commitIndex: classificationLatestIndex },
      {
        postingEventId: 'posting-event-001',
        legs: [
          { account: 'AP', direction: 'CREDIT', amount: 510, currency: 'USD' },
          { account: 'EXPENSE', direction: 'DEBIT', amount: 510, currency: 'USD' },
        ],
        classification: {
          costCenter: 'CC-77',
          department: 'D-10',
          legalEntity: 'LE-1',
        },
        postingDate: new Date().toISOString().split('T')[0],
        description: 'PO-1001 payment',
      }
    );
    
    setState(prev => ({
      ...prev,
      posting: { ...prev.posting, commits: [commit] },
    }));
    
    setStatusMessage('✅ POSTING BUNDLE CREATED (locked atomic pairs)');
    setCurrentStep(9);
  };
  
  const handleReset = () => {
    setState(INITIAL_STATE);
    setCurrentStep(0);
    setStatusMessage('Reset to initial state');
    presenceService.clear();
  };
  
  const matchSummary = getMatchSummary(state.match);
  const policySummary = getPolicyValidationSummary(state.classification, state.assignment);
  
  // Presence integration
  useEffect(() => {
    presenceService.clear();
    
    // Step 7: Policy blocked → 3 Finance viewers inspect
    if (currentStep === 7 && policySummary.state === 'POLICY_BLOCK' && state.classification.commits.length > 0) {
      const classificationIndex = state.classification.commits.length - 1;
      console.log('[PostingPolicy] Presence: 3 Finance viewers inspecting policy block at classification commit', classificationIndex);
      presenceService.heartbeat({ filamentId: 'classification.POST-123', commitIndex: classificationIndex, lensContext: 'posting-policy' }, 'finance-viewer-1');
      presenceService.heartbeat({ filamentId: 'classification.POST-123', commitIndex: classificationIndex, lensContext: 'posting-policy' }, 'finance-viewer-2');
      presenceService.heartbeat({ filamentId: 'classification.POST-123', commitIndex: classificationIndex, lensContext: 'posting-policy' }, 'controller-viewer');
    }
    
    // Step 8: Override approved → 3 viewers inspect override commit
    if (currentStep === 8 && policySummary.isOverridden && state.classification.commits.length > 1) {
      const overrideIndex = state.classification.commits.length - 1;
      console.log('[PostingPolicy] Presence: 3 viewers inspecting policy override at commit', overrideIndex);
      presenceService.heartbeat({ filamentId: 'classification.POST-123', commitIndex: overrideIndex, lensContext: 'posting-policy' }, 'finance-viewer-1');
      presenceService.heartbeat({ filamentId: 'classification.POST-123', commitIndex: overrideIndex, lensContext: 'posting-policy' }, 'finance-viewer-2');
      presenceService.heartbeat({ filamentId: 'classification.POST-123', commitIndex: overrideIndex, lensContext: 'posting-policy' }, 'controller-viewer');
    }
  }, [currentStep, state.classification.commits.length, policySummary.state, policySummary.isOverridden]);
  
  // Compute loci in view
  const DELTA_X = 2.5;
  const lociInView = [
    ...state.classification.commits.map((c, i) => ({ filamentId: 'classification.POST-123', commitIndex: i, lensContext: 'posting-policy' })),
  ];
  
  const anchorMap = new Map();
  state.classification.commits.forEach((c, i) => {
    anchorMap.set(`classification.POST-123@${i}`, [i * DELTA_X, -3, 0]);
  });
  
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      {/* Left Panel: Wizard */}
      <div style={{
        width: '320px',
        background: 'rgba(0,0,0,0.95)',
        color: 'white',
        padding: '20px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px',
      }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#00ff00' }}>
          💰 Posting Policy Flow
        </h2>
        
        <div style={{ marginBottom: '15px', padding: '10px', background: '#1a1a1a', borderRadius: '4px', fontSize: '10px' }}>
          <div style={{ color: '#888', marginBottom: '5px' }}>Status:</div>
          <div style={{ color: statusMessage.startsWith('✅') ? '#00ff00' : (statusMessage.includes('🚫') ? '#ff0000' : '#ffaa00') }}>
            {statusMessage}
          </div>
        </div>
        
        <div style={{ fontSize: '10px', color: '#888', marginBottom: '10px' }}>Procurement (Steps 1-5):</div>
        
        <button onClick={handleCreatePO} disabled={currentStep > 0} style={{
          width: '100%', padding: '8px', marginBottom: '6px',
          background: currentStep === 0 ? '#003300' : (currentStep > 0 ? '#1a4d1a' : '#222'),
          color: currentStep > 0 ? '#00ff00' : 'white',
          border: currentStep === 0 ? '2px solid #00ff00' : 'none',
          borderRadius: '4px', cursor: currentStep === 0 ? 'pointer' : 'default',
          fontFamily: 'monospace', fontSize: '10px', textAlign: 'left',
        }}>
          {currentStep > 0 ? '✅' : '1.'} Create PO
        </button>
        
        <button onClick={handleApprovePO} disabled={currentStep !== 1} style={{
          width: '100%', padding: '8px', marginBottom: '6px',
          background: currentStep === 1 ? '#003300' : (currentStep > 1 ? '#1a4d1a' : '#222'),
          color: currentStep > 1 ? '#00ff00' : 'white',
          border: currentStep === 1 ? '2px solid #00ff00' : 'none',
          borderRadius: '4px', cursor: currentStep === 1 ? 'pointer' : 'default',
          fontFamily: 'monospace', fontSize: '10px', textAlign: 'left',
        }}>
          {currentStep > 1 ? '✅' : '2.'} Approve PO (GATE)
        </button>
        
        <button onClick={handleRecordReceipt} disabled={currentStep !== 2} style={{
          width: '100%', padding: '8px', marginBottom: '6px',
          background: currentStep === 2 ? '#003300' : (currentStep > 2 ? '#1a4d1a' : '#222'),
          color: currentStep > 2 ? '#00ff00' : 'white',
          border: currentStep === 2 ? '2px solid #00ff00' : 'none',
          borderRadius: '4px', cursor: currentStep === 2 ? 'pointer' : 'default',
          fontFamily: 'monospace', fontSize: '10px', textAlign: 'left',
        }}>
          {currentStep > 2 ? '✅' : '3.'} Record Receipt (Partial)
        </button>
        
        <button onClick={handleCaptureInvoice} disabled={currentStep !== 3} style={{
          width: '100%', padding: '8px', marginBottom: '6px',
          background: currentStep === 3 ? '#003300' : (currentStep > 3 ? '#1a4d1a' : '#222'),
          color: currentStep > 3 ? '#00ff00' : 'white',
          border: currentStep === 3 ? '2px solid #00ff00' : 'none',
          borderRadius: '4px', cursor: currentStep === 3 ? 'pointer' : 'default',
          fontFamily: 'monospace', fontSize: '10px', textAlign: 'left',
        }}>
          {currentStep > 3 ? '✅' : '4.'} Capture Invoice
        </button>
        
        <button onClick={handleApproveOverride} disabled={currentStep !== 4 || matchSummary.state !== 'EXCEPTION'} style={{
          width: '100%', padding: '8px', marginBottom: '15px',
          background: currentStep === 4 ? '#330000' : (currentStep > 4 ? '#1a4d1a' : '#222'),
          color: currentStep > 4 ? '#00ff00' : (currentStep === 4 ? '#ff6666' : 'white'),
          border: currentStep === 4 ? '2px solid #ff0000' : 'none',
          borderRadius: '4px', cursor: currentStep === 4 ? 'pointer' : 'default',
          fontFamily: 'monospace', fontSize: '10px', textAlign: 'left',
        }}>
          {currentStep > 4 ? '✅' : '5.'} Override Match Exception
        </button>
        
        <div style={{ fontSize: '10px', color: '#888', marginBottom: '10px', marginTop: '15px' }}>Accounting (Steps 6-8):</div>
        
        <button onClick={handleResolveClassification} disabled={currentStep !== 5 || !matchSummary.canPost} style={{
          width: '100%', padding: '8px', marginBottom: '6px',
          background: currentStep === 5 ? '#003300' : (currentStep > 5 ? '#1a4d1a' : '#222'),
          color: currentStep > 5 ? '#00ff00' : 'white',
          border: currentStep === 5 ? '2px solid #00ff00' : 'none',
          borderRadius: '4px', cursor: currentStep === 5 ? 'pointer' : 'default',
          fontFamily: 'monospace', fontSize: '10px', textAlign: 'left',
        }}>
          {currentStep > 5 ? '✅' : '6.'} Resolve Classification
        </button>
        
        <button onClick={handleValidatePolicy} disabled={currentStep !== 6} style={{
          width: '100%', padding: '8px', marginBottom: '6px',
          background: currentStep === 6 ? '#003300' : (currentStep > 6 ? '#1a4d1a' : '#222'),
          color: currentStep > 6 ? '#00ff00' : 'white',
          border: currentStep === 6 ? '2px solid #00ff00' : 'none',
          borderRadius: '4px', cursor: currentStep === 6 ? 'pointer' : 'default',
          fontFamily: 'monospace', fontSize: '10px', textAlign: 'left',
        }}>
          {currentStep > 6 ? '🚫' : '7.'} Validate Policy (GATE)
        </button>
        
        {currentStep === 7 && policySummary.state === 'POLICY_BLOCK' && (
          <button onClick={handleOverridePolicy} style={{
            width: '100%', padding: '8px', marginBottom: '6px',
            background: '#330000',
            color: '#ff6666',
            border: '2px solid #ff0000',
            borderRadius: '4px', cursor: 'pointer',
            fontFamily: 'monospace', fontSize: '10px', textAlign: 'left',
          }}>
            7b. Override Policy (GATE)
          </button>
        )}
        
        <button onClick={handlePostToLedger} disabled={currentStep !== 8 || !policySummary.canPost} style={{
          width: '100%', padding: '8px', marginBottom: '15px',
          background: currentStep === 8 ? '#003300' : (currentStep > 8 ? '#1a4d1a' : '#222'),
          color: currentStep > 8 ? '#00ff00' : 'white',
          border: currentStep === 8 ? '2px solid #00ff00' : 'none',
          borderRadius: '4px', cursor: currentStep === 8 ? 'pointer' : 'default',
          fontFamily: 'monospace', fontSize: '10px', textAlign: 'left',
        }}>
          {currentStep > 8 ? '✅' : '8.'} Post to Ledger
        </button>
        
        <button onClick={handleReset} style={{
          width: '100%', padding: '10px',
          background: '#333', color: 'white', border: 'none',
          borderRadius: '4px', cursor: 'pointer',
          fontFamily: 'monospace', fontSize: '11px',
        }}>
          🔄 Reset Flow
        </button>
      </div>
      
      {/* Center: 3D View */}
      <div style={{ flex: 1, background: '#000', position: 'relative' }}>
        <Canvas camera={{ position: [6, 3, 15], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={0.9} />
          
          <Text position={[0, 7, 0]} fontSize={0.45} color="#00ffff" anchorX="center" anchorY="middle">
            Accounting as Governed Lifecycle
          </Text>
          
          {/* Procurement Layer (top) */}
          <FilamentSpine filament={state.match} yPosition={4} zPosition={0} color={matchSummary.state === 'EXCEPTION' ? '#ff0000' : '#00ff00'} label={`Match (${matchSummary.state})`} />
          
          {/* Dimension Layer (middle) */}
          <FilamentSpine filament={state.costCenter} yPosition={1} zPosition={-2} color="#00aaff" label="Cost Center CC-77" />
          <FilamentSpine filament={state.department} yPosition={1} zPosition={2} color="#00aaff" label="Dept D-10 (Finance)" />
          <FilamentSpine filament={state.assignment} yPosition={1} zPosition={0} color="#ffaa00" label="Assignment (CC-77→D-15)" />
          
          {/* Accounting Layer (bottom) */}
          <FilamentSpine filament={state.classification} yPosition={-3} zPosition={-1.5} color={policySummary.state === 'POLICY_BLOCK' ? '#ff0000' : '#00ff00'} label={`Classification (${policySummary.state})`} />
          <FilamentSpine filament={state.posting} yPosition={-3} zPosition={1.5} color="#ffffff" label="Posting Bundle" />
          
          {/* Presence Layer */}
          <PresenceRenderer lociInView={lociInView} anchorMap={anchorMap} />
          
          <gridHelper args={[40, 40, '#222222', '#111111']} position={[0, -6, 0]} />
          <OrbitControls target={[0, 0, 0]} enableDamping dampingFactor={0.05} />
        </Canvas>
        
        <div style={{
          position: 'absolute', bottom: '20px', left: '20px', right: '20px',
          background: 'rgba(0,0,0,0.85)', color: 'white', padding: '12px 20px',
          fontFamily: 'monospace', fontSize: '11px',
          display: 'flex', justifyContent: 'space-between', borderRadius: '4px',
        }}>
          <span>Match: {state.match.commits.length} ({matchSummary.state})</span>
          <span style={{ color: policySummary.state === 'POLICY_BLOCK' ? '#ff0000' : '#00ff00' }}>
            Policy: {policySummary.state}
          </span>
          <span>Classification: {state.classification.commits.length}</span>
          <span>Posting: {state.posting.commits.length}</span>
        </div>
      </div>
      
      {/* Right Panel: Policy Details */}
      <div style={{
        width: '300px', background: 'rgba(0,0,0,0.95)', color: 'white',
        padding: '20px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px',
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#ffaa00' }}>
          Policy State
        </h3>
        
        <div style={{ marginBottom: '15px', paddingBottom: '12px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>Dimensions:</div>
          <div style={{ fontSize: '9px', marginBottom: '4px', padding: '5px', background: '#1a1a1a' }}>
            <div style={{ color: '#00aaff' }}>Cost Center: CC-77 (IT Ops)</div>
          </div>
          <div style={{ fontSize: '9px', marginBottom: '4px', padding: '5px', background: '#1a1a1a' }}>
            <div style={{ color: '#00aaff' }}>Department: D-10 (Finance)</div>
          </div>
        </div>
        
        <div style={{ marginBottom: '15px', paddingBottom: '12px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>Assignment:</div>
          {state.assignment.commits.length > 0 && (
            <div style={{ fontSize: '9px', padding: '5px', background: '#1a1a1a' }}>
              <div style={{ color: '#ffaa00' }}>CC-77 → D-15</div>
              <div style={{ color: '#666', marginTop: '3px' }}>⚠️ NOT assigned to D-10!</div>
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: '15px', paddingBottom: '12px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>Policy Validation:</div>
          {state.classification.commits.length > 0 ? (
            <div style={{ fontSize: '9px', padding: '5px', background: '#1a1a1a' }}>
              <div style={{ color: policySummary.state === 'POLICY_BLOCK' ? '#ff0000' : '#00ff00' }}>
                State: {policySummary.state}
              </div>
              {policySummary.reason && (
                <div style={{ color: '#ff6666', marginTop: '5px' }}>{policySummary.reason}</div>
              )}
              {policySummary.isOverridden && (
                <div style={{ color: '#00ff00', marginTop: '5px' }}>✅ Override approved</div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '9px', color: '#666' }}>No classification yet</div>
          )}
        </div>
        
        <div>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>Posting:</div>
          {state.posting.commits.length > 0 ? (
            <div style={{ fontSize: '9px', padding: '5px', background: '#1a1a1a' }}>
              <div style={{ color: '#ffffff' }}>✅ Posted</div>
              <div style={{ color: '#888', marginTop: '3px' }}>Amount: $510</div>
              <div style={{ color: '#888' }}>Legs: AP(CR) + EXP(DR)</div>
            </div>
          ) : (
            <div style={{ fontSize: '9px', color: '#666' }}>No posting yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
