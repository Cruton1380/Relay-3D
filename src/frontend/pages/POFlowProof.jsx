/**
 * PO FLOW PROOF
 * 
 * Route: /proof/po-flow
 * 
 * Proves:
 * - Multi-filament orchestration (PO → Receipt → Invoice → Match)
 * - State gates work (approval required, match required)
 * - Match is a filament, not a query
 * - Variance detection without queries
 * - Ledger pairs lock at same commitIndex
 * - End-to-end causality visible in 3D
 * 
 * Layout: Spatial Separation + Convergence
 * - PO: top (cyan)
 * - Receipt: mid-left (green)
 * - Invoice: mid-right (yellow)
 * - Match: bottom (red=EXCEPTION, green=PASS)
 * - Ledger: side (white, locked pair)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  createPOCreatedCommit,
  createPOApprovedCommit,
  createReceiptRecordedCommit,
  createInvoiceCapturedCommit,
  createMatchOverrideCommit,
  createLedgerPostedCommit,
} from '../components/procurement/schemas/commitSchemas';
import {
  autoEvaluateMatch,
  getMatchSummary,
  canPostToLedger,
} from '../components/procurement/utils/matchEngine';
import { presenceService } from '../components/filament/services/presenceService';
import PresenceLayer from '../components/filament/components/PresenceLayer';

/**
 * Initial empty filaments
 */
const INITIAL_STATE = {
  po: { id: 'po.PO-1001', commits: [] },
  receipt: { id: 'receipt.R-5001', commits: [] },
  invoice: { id: 'invoice.I-9001', commits: [] },
  match: { id: 'match.PO-1001', commits: [] },
  ledgerAP: { id: 'ledger.AP-1001', commits: [] },
  ledgerExpense: { id: 'ledger.EXPENSE-1001', commits: [] },
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
    { lineId: 'A', qtyReceived: 8, condition: 'OK' },  // Partial!
    { lineId: 'B', qtyReceived: 5, condition: 'OK' },
  ],
};

const DEMO_INVOICE_DATA = {
  invoiceId: 'I-9001',
  vendorId: 'VENDOR-123',
  poId: 'PO-1001',
  invoiceLines: [
    { lineId: 'A', qtyInvoiced: 10, unitPrice: 50 },  // Full qty invoiced!
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
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      <Text
        position={[0, -1.2, 0]}
        fontSize={0.2}
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
          fontSize={0.3}
          color="#666666"
          anchorX="center"
          anchorY="middle"
        >
          {label} (empty)
        </Text>
      </group>
    );
  }
  
  const DELTA_X = 3;
  
  return (
    <group position={[0, yPosition, zPosition]}>
      {/* Label */}
      <Text
        position={[-2, 2, 0]}
        fontSize={0.35}
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
          label={commit.op.replace(/_/g, ' ')}
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
            0.1,
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
 * Presence Renderer - Custom for PO Flow (Multi-Filament)
 * 
 * Tier 1: Counts only, positioned above TimeBoxes
 */
function PresenceRenderer({ lociInView, anchorMap }) {
  const { camera } = useThree();
  const [presenceData, setPresenceData] = useState([]);
  const [cameraDistance, setCameraDistance] = useState(50);
  
  // Track camera distance
  useEffect(() => {
    const updateDistance = () => {
      const distance = camera.position.length();
      setCameraDistance(distance);
    };
    
    updateDistance();
    const interval = setInterval(updateDistance, 500);
    return () => clearInterval(interval);
  }, [camera]);
  
  // Poll presence service
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
  
  const showLabel = cameraDistance < 25;
  
  return (
    <group name="presence-layer-po-flow">
      {presenceData.map((presence, i) => {
        const key = `${presence.locus.filamentId}@${presence.locus.commitIndex}`;
        const position = anchorMap.get(key);
        
        if (!position) return null;
        
        return (
          <PresenceMarker
            key={key}
            position={[position[0], position[1] + 2.5, position[2]]}
            count={presence.count}
            showLabel={showLabel}
          />
        );
      })}
    </group>
  );
}

/**
 * Presence Marker - Tier 1 (count only)
 */
function PresenceMarker({ position, count, showLabel }) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <group position={position}>
      {/* Presence bead */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? '#FFD700' : '#2ECC71'}
          transparent
          opacity={0.9}
          emissive={hovered ? '#FFD700' : '#2ECC71'}
          emissiveIntensity={hovered ? 0.6 : 0.3}
        />
      </mesh>
      
      {/* Pulse ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.35, 16]} />
        <meshBasicMaterial
          color="#2ECC71"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Count label */}
      {(showLabel || hovered) && (
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.25}
          color="#E6E6E6"
          anchorX="center"
          anchorY="bottom"
        >
          {count} {count === 1 ? 'viewer' : 'viewers'}
        </Text>
      )}
      
      {/* Hover detail */}
      {hovered && (
        <Text
          position={[0, 1.2, 0]}
          fontSize={0.18}
          color="#888888"
          anchorX="center"
          anchorY="bottom"
        >
          inspecting this commit
        </Text>
      )}
    </group>
  );
}

/**
 * Dependency connector lines (from match to inputs)
 */
function DependencyConnectors({ matchFilament, poFilament, receiptFilament, invoiceFilament }) {
  if (!matchFilament.commits || matchFilament.commits.length === 0) {
    return null;
  }
  
  const latestMatch = matchFilament.commits[matchFilament.commits.length - 1];
  
  if (!latestMatch.refs || !latestMatch.refs.inputs) {
    return null;
  }
  
  const DELTA_X = 3;
  const matchPos = new THREE.Vector3((matchFilament.commits.length - 1) * DELTA_X, -3, 0);
  
  const lines = [];
  
  latestMatch.refs.inputs.forEach((input, idx) => {
    let sourcePos = null;
    
    if (input.filamentId === poFilament.id) {
      sourcePos = new THREE.Vector3(input.commitIndex * DELTA_X, 3, 0);
    } else if (input.filamentId === receiptFilament?.id) {
      sourcePos = new THREE.Vector3(input.commitIndex * DELTA_X, 0, -2);
    } else if (input.filamentId === invoiceFilament?.id) {
      sourcePos = new THREE.Vector3(input.commitIndex * DELTA_X, 0, 2);
    }
    
    if (sourcePos) {
      lines.push({ key: idx, start: matchPos, end: sourcePos });
    }
  });
  
  return (
    <group>
      {lines.map(({ key, start, end }) => (
        <Line
          key={key}
          points={[start, end]}
          color="#666666"
          lineWidth={2}
          dashed
          dashScale={2}
        />
      ))}
    </group>
  );
}

/**
 * Main proof component
 */
export default function POFlowProof() {
  const [state, setState] = useState(INITIAL_STATE);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Ready to start PO flow');
  
  const userId = 'demo-user';
  
  // Step 1: Create PO
  const handleCreatePO = () => {
    const commit = createPOCreatedCommit(
      'po.PO-1001',
      0,
      userId,
      DEMO_PO_DATA
    );
    
    console.log('[POFlow] Step 1 - PO commit created:', commit);
    console.log('[POFlow] Step 1 - PO payload.lines:', commit.payload?.lines);
    
    setState(prev => ({
      ...prev,
      po: { ...prev.po, commits: [commit] },
    }));
    
    setStatusMessage('✅ PO created (2 lines: Widget x10, Bolt x5)');
    setCurrentStep(1);
  };
  
  // Step 2: Approve PO
  const handleApprovePO = () => {
    const commit = createPOApprovedCommit(
      'po.PO-1001',
      state.po.commits.length,
      userId,
      { note: 'Budget verified' }
    );
    
    setState(prev => ({
      ...prev,
      po: { ...prev.po, commits: [...prev.po.commits, commit] },
    }));
    
    setStatusMessage('✅ PO approved (GATE passed)');
    setCurrentStep(2);
  };
  
  // Step 3: Record Receipt (Partial!)
  const handleRecordReceipt = () => {
    const poLatestIndex = state.po.commits.length - 1;
    const commit = createReceiptRecordedCommit(
      'receipt.R-5001',
      0,
      userId,
      'po.PO-1001',
      poLatestIndex,
      DEMO_RECEIPT_DATA
    );
    
    setState(prev => {
      const newState = {
        ...prev,
        receipt: { ...prev.receipt, commits: [commit] },
      };
      
      // Auto-generate match evaluation
      const newMatch = autoEvaluateMatch(
        newState.match,
        newState.po,
        newState.receipt,
        null  // No invoice yet
      );
      
      return { ...newState, match: newMatch };
    });
    
    setStatusMessage('✅ Receipt recorded (Widget: 8 of 10 received - PARTIAL!)');
    setCurrentStep(3);
  };
  
  // Step 4: Capture Invoice
  const handleCaptureInvoice = () => {
    const poLatestIndex = state.po.commits.length - 1;
    const commit = createInvoiceCapturedCommit(
      'invoice.I-9001',
      0,
      userId,
      'po.PO-1001',
      poLatestIndex,
      DEMO_INVOICE_DATA
    );
    
    setState(prev => {
      const newState = {
        ...prev,
        invoice: { ...prev.invoice, commits: [commit] },
      };
      
      // Auto-generate match evaluation (now with all 3 inputs)
      const newMatch = autoEvaluateMatch(
        newState.match,
        newState.po,
        newState.receipt,
        newState.invoice
      );
      
      return { ...newState, match: newMatch };
    });
    
    setStatusMessage('⚠️ Invoice captured (Widget: 10 invoiced vs 8 received = EXCEPTION!)');
    setCurrentStep(4);
  };
  
  // Step 5: Approve Override
  const handleApproveOverride = () => {
    const matchSummary = getMatchSummary(state.match);
    
    console.log('[POFlow] Step 5 - Before override:', { 
      matchSummary, 
      commits: state.match.commits,
      commitCount: state.match.commits.length 
    });
    
    if (!matchSummary || matchSummary.state !== 'EXCEPTION') {
      setStatusMessage(`❌ No exception to override (current state: ${matchSummary?.state || 'UNKNOWN'})`);
      return;
    }
    
    const commit = createMatchOverrideCommit(
      'match.PO-1001',
      state.match.commits.length,
      userId,
      {
        poId: 'PO-1001',
        reasonCode: 'ACCEPT_PARTIAL_RECEIPT',
        note: 'Vendor confirmed backorder, approved for payment',
        approvedByRole: 'APManager',
      }
    );
    
    console.log('[POFlow] Step 5 - Override commit created:', commit);
    
    setState(prev => {
      const newMatch = { ...prev.match, commits: [...prev.match.commits, commit] };
      console.log('[POFlow] Step 5 - New match state:', newMatch);
      const newSummary = getMatchSummary(newMatch);
      console.log('[POFlow] Step 5 - New summary:', newSummary);
      
      return {
        ...prev,
        match: newMatch,
      };
    });
    
    setStatusMessage('✅ Override approved (GATE opened for payment)');
    setCurrentStep(5);
  };
  
  // Step 6: Post to Ledger (Locked Pair)
  const handlePostToLedger = () => {
    const matchSummary = getMatchSummary(state.match);
    
    console.log('[POFlow] Step 6 clicked:', { 
      matchSummary, 
      matchCommits: state.match.commits.length,
      currentStep 
    });
    
    if (!matchSummary.canPost) {
      setStatusMessage(`❌ Cannot post: Match not approved (state: ${matchSummary.state}, isOverridden: ${matchSummary.isOverridden})`);
      return;
    }
    
    const postingEventId = `posting-${Date.now()}`;
    const matchLatestIndex = state.match.commits.length - 1;
    const amount = 510; // Widget: 8*50 + Bolt: 5*2 = 410 + 100 = 510
    
    // Create locked posting bundle (2 filaments, same postingEventId)
    const apCommit = createLedgerPostedCommit(
      'ledger.AP-1001',
      0,
      'match.PO-1001',
      matchLatestIndex,
      {
        postingEventId,
        poId: 'PO-1001',
        amount,
        account: 'AP',
        direction: 'CREDIT',
      }
    );
    
    const expenseCommit = createLedgerPostedCommit(
      'ledger.EXPENSE-1001',
      0,
      'match.PO-1001',
      matchLatestIndex,
      {
        postingEventId,
        poId: 'PO-1001',
        amount,
        account: 'EXPENSE',
        direction: 'DEBIT',
      }
    );
    
    setState(prev => ({
      ...prev,
      ledgerAP: { ...prev.ledgerAP, commits: [apCommit] },
      ledgerExpense: { ...prev.ledgerExpense, commits: [expenseCommit] },
    }));
    
    setStatusMessage('✅ Ledger posted (locked pair: AP CREDIT + EXPENSE DEBIT)');
    setCurrentStep(6);
  };
  
  // Reset proof
  const handleReset = () => {
    setState(INITIAL_STATE);
    setCurrentStep(0);
    setStatusMessage('Reset to initial state');
    presenceService.clear(); // Clear presence on reset
  };
  
  const matchSummary = getMatchSummary(state.match);
  
  // ============================================
  // PRESENCE TIER 1 INTEGRATION
  // ============================================
  
  // Simulated "team inspection" presence
  // When match enters EXCEPTION, show 3 viewers
  // When override happens, show 3 viewers at override commit
  useEffect(() => {
    if (state.match.commits.length === 0) return;
    
    const latestMatchCommit = state.match.commits[state.match.commits.length - 1];
    const latestMatchIndex = state.match.commits.length - 1;
    
    // Clear previous match presence
    presenceService.clear();
    
    // STEP 4: Invoice captured → Match EXCEPTION
    if (latestMatchCommit.op === 'MATCH_EVALUATED' && matchSummary.state === 'EXCEPTION') {
      // Simulate 3 Finance team members inspecting the exception
      console.log('[POFlow] Presence: 3 viewers inspecting match EXCEPTION at commit', latestMatchIndex);
      presenceService.heartbeat(
        { filamentId: 'match.PO-1001', commitIndex: latestMatchIndex, lensContext: 'po-flow' },
        'finance-viewer-1'
      );
      presenceService.heartbeat(
        { filamentId: 'match.PO-1001', commitIndex: latestMatchIndex, lensContext: 'po-flow' },
        'finance-viewer-2'
      );
      presenceService.heartbeat(
        { filamentId: 'match.PO-1001', commitIndex: latestMatchIndex, lensContext: 'po-flow' },
        'ap-manager-viewer'
      );
    }
    
    // STEP 5: Override approved → Presence moves to override commit
    if (latestMatchCommit.op === 'MATCH_OVERRIDE_APPROVED') {
      // Simulate 3 viewers inspecting the override decision
      console.log('[POFlow] Presence: 3 viewers inspecting override at commit', latestMatchIndex);
      presenceService.heartbeat(
        { filamentId: 'match.PO-1001', commitIndex: latestMatchIndex, lensContext: 'po-flow' },
        'finance-viewer-1'
      );
      presenceService.heartbeat(
        { filamentId: 'match.PO-1001', commitIndex: latestMatchIndex, lensContext: 'po-flow' },
        'finance-viewer-2'
      );
      presenceService.heartbeat(
        { filamentId: 'match.PO-1001', commitIndex: latestMatchIndex, lensContext: 'po-flow' },
        'controller-viewer'
      );
    }
  }, [state.match.commits.length, matchSummary.state]);
  
  // Compute loci in view (all visible commits from all filaments)
  const lociInView = [
    ...state.po.commits.map((c, i) => ({ 
      filamentId: 'po.PO-1001', 
      commitIndex: i, 
      lensContext: 'po-flow' 
    })),
    ...state.receipt.commits.map((c, i) => ({ 
      filamentId: 'receipt.R-5001', 
      commitIndex: i, 
      lensContext: 'po-flow' 
    })),
    ...state.invoice.commits.map((c, i) => ({ 
      filamentId: 'invoice.I-9001', 
      commitIndex: i, 
      lensContext: 'po-flow' 
    })),
    ...state.match.commits.map((c, i) => ({ 
      filamentId: 'match.PO-1001', 
      commitIndex: i, 
      lensContext: 'po-flow' 
    })),
  ];
  
  // Compute anchor map (commitIndex → 3D position)
  // DELTA_X = 3 (from FilamentSpine)
  const DELTA_X = 3;
  const anchorMap = new Map();
  
  // PO filament (yPosition: 3, zPosition: 0)
  state.po.commits.forEach((c, i) => {
    anchorMap.set(`po.PO-1001@${i}`, [i * DELTA_X, 3, 0]);
  });
  
  // Receipt filament (yPosition: 0, zPosition: -2)
  state.receipt.commits.forEach((c, i) => {
    anchorMap.set(`receipt.R-5001@${i}`, [i * DELTA_X, 0, -2]);
  });
  
  // Invoice filament (yPosition: 0, zPosition: 2)
  state.invoice.commits.forEach((c, i) => {
    anchorMap.set(`invoice.I-9001@${i}`, [i * DELTA_X, 0, 2]);
  });
  
  // Match filament (yPosition: -3, zPosition: 0)
  state.match.commits.forEach((c, i) => {
    anchorMap.set(`match.PO-1001@${i}`, [i * DELTA_X, -3, 0]);
  });
  
  // ============================================
  // END PRESENCE INTEGRATION
  // ============================================
  
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      {/* Left Panel: Wizard */}
      <div style={{
        width: '300px',
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '20px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px',
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#00ff00' }}>
          📦 PO Flow Proof
        </h2>
        
        {/* Status */}
        <div style={{ marginBottom: '20px', padding: '12px', background: '#1a1a1a', borderRadius: '4px', fontSize: '11px' }}>
          <div style={{ color: '#888', marginBottom: '5px' }}>Status:</div>
          <div style={{ color: statusMessage.startsWith('✅') ? '#00ff00' : (statusMessage.startsWith('⚠️') ? '#ffaa00' : '#888') }}>
            {statusMessage}
          </div>
        </div>
        
        {/* Wizard Steps */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>Workflow Steps:</div>
          
          <button
            onClick={handleCreatePO}
            disabled={currentStep > 0}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
              background: currentStep === 0 ? '#003300' : (currentStep > 0 ? '#1a4d1a' : '#222'),
              color: currentStep > 0 ? '#00ff00' : 'white',
              border: currentStep === 0 ? '2px solid #00ff00' : 'none',
              borderRadius: '4px',
              cursor: currentStep === 0 ? 'pointer' : 'default',
              fontFamily: 'monospace',
              fontSize: '11px',
              textAlign: 'left',
            }}
          >
            {currentStep > 0 ? '✅' : '1.'} Create PO (2 lines)
          </button>
          
          <button
            onClick={handleApprovePO}
            disabled={currentStep !== 1}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
              background: currentStep === 1 ? '#003300' : (currentStep > 1 ? '#1a4d1a' : '#222'),
              color: currentStep > 1 ? '#00ff00' : 'white',
              border: currentStep === 1 ? '2px solid #00ff00' : 'none',
              borderRadius: '4px',
              cursor: currentStep === 1 ? 'pointer' : 'default',
              fontFamily: 'monospace',
              fontSize: '11px',
              textAlign: 'left',
            }}
          >
            {currentStep > 1 ? '✅' : '2.'} Approve PO (GATE)
          </button>
          
          <button
            onClick={handleRecordReceipt}
            disabled={currentStep !== 2}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
              background: currentStep === 2 ? '#003300' : (currentStep > 2 ? '#1a4d1a' : '#222'),
              color: currentStep > 2 ? '#00ff00' : 'white',
              border: currentStep === 2 ? '2px solid #00ff00' : 'none',
              borderRadius: '4px',
              cursor: currentStep === 2 ? 'pointer' : 'default',
              fontFamily: 'monospace',
              fontSize: '11px',
              textAlign: 'left',
            }}
          >
            {currentStep > 2 ? '✅' : '3.'} Record Receipt (Partial)
          </button>
          
          <button
            onClick={handleCaptureInvoice}
            disabled={currentStep !== 3}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
              background: currentStep === 3 ? '#003300' : (currentStep > 3 ? '#1a4d1a' : '#222'),
              color: currentStep > 3 ? '#00ff00' : 'white',
              border: currentStep === 3 ? '2px solid #00ff00' : 'none',
              borderRadius: '4px',
              cursor: currentStep === 3 ? 'pointer' : 'default',
              fontFamily: 'monospace',
              fontSize: '11px',
              textAlign: 'left',
            }}
          >
            {currentStep > 3 ? '✅' : '4.'} Capture Invoice
          </button>
          
          <button
            onClick={handleApproveOverride}
            disabled={currentStep !== 4 || matchSummary.state !== 'EXCEPTION'}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
              background: currentStep === 4 ? '#330000' : (currentStep > 4 ? '#1a4d1a' : '#222'),
              color: currentStep > 4 ? '#00ff00' : (currentStep === 4 ? '#ff6666' : 'white'),
              border: currentStep === 4 ? '2px solid #ff0000' : 'none',
              borderRadius: '4px',
              cursor: currentStep === 4 ? 'pointer' : 'default',
              fontFamily: 'monospace',
              fontSize: '11px',
              textAlign: 'left',
            }}
          >
            {currentStep > 4 ? '✅' : '5.'} Override Exception
          </button>
          
          <button
            onClick={handlePostToLedger}
            disabled={currentStep !== 5 || !matchSummary.canPost}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
              background: currentStep === 5 ? '#003300' : (currentStep > 5 ? '#1a4d1a' : '#222'),
              color: currentStep > 5 ? '#00ff00' : 'white',
              border: currentStep === 5 ? '2px solid #00ff00' : 'none',
              borderRadius: '4px',
              cursor: currentStep === 5 ? 'pointer' : 'default',
              fontFamily: 'monospace',
              fontSize: '11px',
              textAlign: 'left',
            }}
          >
            {currentStep > 5 ? '✅' : '6.'} Post to Ledger
          </button>
        </div>
        
        {/* Reset */}
        <button
          onClick={handleReset}
          style={{
            width: '100%',
            padding: '12px',
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          🔄 Reset Flow
        </button>
      </div>
      
      {/* Center: 3D View */}
      <div style={{ flex: 1, background: '#000', position: 'relative' }}>
        <Canvas camera={{ position: [5, 2, 12], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          
          {/* Title */}
          <Text
            position={[0, 6, 0]}
            fontSize={0.5}
            color="#00ffff"
            anchorX="center"
            anchorY="middle"
          >
            Procurement Lifecycle (Multi-Filament)
          </Text>
          
          {/* PO Filament (Top, Cyan) */}
          <FilamentSpine
            filament={state.po}
            yPosition={3}
            zPosition={0}
            color="#00ffff"
            label="PO Contract"
          />
          
          {/* Receipt Filament (Mid-Left, Green) */}
          <FilamentSpine
            filament={state.receipt}
            yPosition={0}
            zPosition={-2}
            color="#00ff00"
            label="Goods Receipt"
          />
          
          {/* Invoice Filament (Mid-Right, Yellow) */}
          <FilamentSpine
            filament={state.invoice}
            yPosition={0}
            zPosition={2}
            color="#ffff00"
            label="Invoice"
          />
          
          {/* Match Filament (Bottom, Red=EXCEPTION, Green=PASS) */}
          <FilamentSpine
            filament={state.match}
            yPosition={-3}
            zPosition={0}
            color={matchSummary.state === 'EXCEPTION' ? '#ff0000' : (matchSummary.state === 'PASS' ? '#00ff00' : '#888888')}
            label={`Match (${matchSummary.state})`}
          />
          
          {/* Dependency Connectors */}
          <DependencyConnectors
            matchFilament={state.match}
            poFilament={state.po}
            receiptFilament={state.receipt}
            invoiceFilament={state.invoice}
          />
          
          {/* Ledger Pair (Side, White with Lock Indicator) */}
          {state.ledgerAP.commits.length > 0 && (
            <group position={[8, -3, 0]}>
              <Text
                position={[0, 2, 0]}
                fontSize={0.3}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                Ledger (Locked Pair)
              </Text>
              
              {/* AP (Credit) */}
              <CommitBox
                commit={state.ledgerAP.commits[0]}
                position={[0, 0.5, 0]}
                color="#ffffff"
                label="AP (CR)"
              />
              
              {/* Expense (Debit) */}
              <CommitBox
                commit={state.ledgerExpense.commits[0]}
                position={[0, -0.5, 0]}
                color="#ffffff"
                label="EXP (DR)"
              />
              
              {/* Lock indicator */}
              <mesh position={[0, 0, 0]}>
                <torusGeometry args={[1.5, 0.1, 16, 32]} />
                <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.5} />
              </mesh>
            </group>
          )}
          
          {/* Presence Layer (Tier 1) */}
          <PresenceRenderer lociInView={lociInView} anchorMap={anchorMap} />
          
          <gridHelper args={[40, 40, '#222222', '#111111']} position={[0, -5, 0]} />
          <OrbitControls target={[0, 0, 0]} enableDamping dampingFactor={0.05} />
        </Canvas>
        
        {/* Overlay: Filament Counts */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '12px 20px',
          fontFamily: 'monospace',
          fontSize: '11px',
          display: 'flex',
          justifyContent: 'space-between',
          borderRadius: '4px',
        }}>
          <span>PO: {state.po.commits.length}</span>
          <span>Receipt: {state.receipt.commits.length}</span>
          <span>Invoice: {state.invoice.commits.length}</span>
          <span style={{ color: matchSummary.state === 'EXCEPTION' ? '#ff0000' : '#00ff00' }}>
            Match: {state.match.commits.length} ({matchSummary.state})
          </span>
          <span>Ledger: {state.ledgerAP.commits.length + state.ledgerExpense.commits.length}</span>
        </div>
      </div>
      
      {/* Right Panel: Variance Report */}
      <div style={{
        width: '350px',
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '20px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px',
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#ffaa00' }}>
          Current State
        </h3>
        
        {/* PO Lines */}
        <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>PO Lines:</div>
          {state.po.commits.length > 0 ? (
            state.po.commits[0].payload.lines.map(line => (
              <div key={line.lineId} style={{ fontSize: '10px', marginBottom: '5px', padding: '6px', background: '#1a1a1a' }}>
                <div style={{ color: '#00ffff' }}>Line {line.lineId}: {line.desc}</div>
                <div style={{ color: '#888' }}>Ordered: {line.qtyOrdered} @ ${line.unitPrice}</div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '10px', color: '#666' }}>No PO created yet</div>
          )}
        </div>
        
        {/* Receipt Lines */}
        <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>Receipt Lines:</div>
          {state.receipt.commits.length > 0 ? (
            state.receipt.commits[0].payload.receivedLines.map(line => (
              <div key={line.lineId} style={{ fontSize: '10px', marginBottom: '5px', padding: '6px', background: '#1a1a1a' }}>
                <div style={{ color: '#00ff00' }}>Line {line.lineId}</div>
                <div style={{ color: '#888' }}>Received: {line.qtyReceived} ({line.condition})</div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '10px', color: '#666' }}>No receipt yet</div>
          )}
        </div>
        
        {/* Invoice Lines */}
        <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>Invoice Lines:</div>
          {state.invoice.commits.length > 0 ? (
            state.invoice.commits[0].payload.invoiceLines.map(line => (
              <div key={line.lineId} style={{ fontSize: '10px', marginBottom: '5px', padding: '6px', background: '#1a1a1a' }}>
                <div style={{ color: '#ffff00' }}>Line {line.lineId}</div>
                <div style={{ color: '#888' }}>Invoiced: {line.qtyInvoiced} @ ${line.unitPrice}</div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '10px', color: '#666' }}>No invoice yet</div>
          )}
        </div>
        
        {/* Match Variance Report */}
        <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>Match Variance:</div>
          {matchSummary.variances.length > 0 ? (
            matchSummary.variances.map((v, i) => (
              <div key={i} style={{ 
                fontSize: '10px', 
                marginBottom: '8px', 
                padding: '8px', 
                background: v.severity === 'BLOCK' ? '#330000' : '#332200',
                border: `1px solid ${v.severity === 'BLOCK' ? '#ff0000' : '#ffaa00'}`,
              }}>
                <div style={{ color: '#ff6666', fontWeight: 'bold' }}>⚠️ Line {v.lineId}: QTY MISMATCH</div>
                <div style={{ color: '#888', marginTop: '4px' }}>
                  Ordered: {v.ordered} | Received: {v.received} | Invoiced: {v.invoiced}
                </div>
                <div style={{ color: '#ff0000', marginTop: '4px' }}>
                  Delta: {v.delta > 0 ? '+' : ''}{v.delta} ({v.severity})
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '10px', color: matchSummary.state === 'PASS' ? '#00ff00' : '#666' }}>
              {matchSummary.state === 'PASS' ? '✅ No variances' : 'No evaluation yet'}
            </div>
          )}
        </div>
        
        {/* Ledger Posting */}
        <div>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>Ledger Posting:</div>
          {state.ledgerAP.commits.length > 0 ? (
            <div style={{ fontSize: '10px', padding: '8px', background: '#1a1a1a' }}>
              <div style={{ color: '#ffffff', marginBottom: '5px' }}>🔒 Locked Pair</div>
              <div style={{ color: '#888' }}>AP (CR): ${state.ledgerAP.commits[0].payload.amount}</div>
              <div style={{ color: '#888' }}>Expense (DR): ${state.ledgerExpense.commits[0].payload.amount}</div>
              <div style={{ color: '#666', fontSize: '9px', marginTop: '5px' }}>
                Event: {state.ledgerAP.commits[0].payload.postingEventId.substring(0, 20)}...
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '10px', color: '#666' }}>Not posted yet</div>
          )}
        </div>
        
        {/* Pass Criteria */}
        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #333' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>Pass Criteria:</div>
          <ul style={{ fontSize: '9px', color: '#666', lineHeight: '1.5', paddingLeft: '15px', margin: 0 }}>
            <li>PO → Receipt → Invoice creates match filament</li>
            <li>Variance detected (qty mismatch)</li>
            <li>Match state = EXCEPTION (blocks payment)</li>
            <li>Override changes state to PASS</li>
            <li>Ledger pair posts with same eventId</li>
            <li>3D shows linked causality</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
