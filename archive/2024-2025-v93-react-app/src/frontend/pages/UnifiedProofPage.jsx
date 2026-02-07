/**
 * UNIFIED PROOF PAGE
 * 
 * Route: /proof
 * 
 * Single proof system demonstrating filament model across domains:
 * - Privacy Ladder (visibility tiers)
 * - Editable Endpoints (spreadsheet cells)
 * - Procurement Lifecycle (PO → Receipt → Invoice → Match → Post)
 * - Accounting Governance (Classification → Policy → Posting)
 * - Code as Filaments (modules, dependencies, refactoring)
 * 
 * All proofs share the same substrate:
 * - Filaments (identity over time)
 * - TimeBoxes (atomic commits)
 * - Glyphs (operations)
 * - Evidence (attached to commits)
 * - Topology (dependency refs)
 * - Presence (locus-anchored)
 * - Privacy Ladder (L0-L6)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Import all proof components
import MultiFilamentCoreProof from './MultiFilamentCoreProof.jsx';
import FilamentHistoryProof from './FilamentHistoryProof.jsx';
import PrivacyLadderProof from './PrivacyLadderProof.jsx';
import EditableCellProof from './EditableCellProof.jsx';
import POFlowProof from './POFlowProof.jsx';
import PostingPolicyFlowProof from './PostingPolicyFlowProof.jsx';
import CodeFilamentProof from './CodeFilamentProof.jsx';
import ExcelImportProof from './ExcelImportProof.jsx';
import ProximityGlobeProof from './ProximityGlobeProof.jsx';
import AIWorkspaceProof from './AIWorkspaceProof.jsx';

/**
 * Proof registry
 */
const PROOFS = [
  {
    id: 'multi-filament-core',
    name: '🧬 Multi-Filament Core',
    description: 'THE FOUNDATION: State transitions, not filaments',
    category: 'Core',
    component: MultiFilamentCoreProof,
    proves: [
      'Reality is always multi-filament (never single)',
      'Constraints are first-class filaments',
      'Transitions are conditional existence',
      'Evidence is separate from identity'
    ]
  },
  {
    id: 'filament-history',
    name: '📜 Filament History',
    description: 'ONE FILAMENT, DEEP TIME: TimeBoxes along X-axis with 6 faces',
    category: 'Core',
    component: FilamentHistoryProof,
    proves: [
      'One filament = sequence of irreversible state transitions',
      'Each TimeBox = atomic truth moment',
      '6 faces = semantic payload',
      'Glyphs = discrete operations'
    ]
  },
  {
    id: 'privacy-ladder',
    name: 'Privacy Ladder',
    description: 'Visibility tiers (L0-L6) based on distance + policy + permission',
    category: 'Core',
    component: PrivacyLadderProof,
    proves: [
      'Distance controls fidelity',
      'Permission controls existence',
      'Same truth, different render',
      'No "back door" leaks'
    ]
  },
  {
    id: 'edit-cell',
    name: 'Editable Endpoint',
    description: 'Spreadsheet cell as projection of filament +X face',
    category: 'Core',
    component: EditableCellProof,
    proves: [
      'Endpoint editing appends commits',
      'Engage requires L6 + distance + lock',
      'Zoom out reveals audit trail',
      'No mutation, only append'
    ]
  },
  {
    id: 'po-flow',
    name: 'Procurement Lifecycle',
    description: 'Multi-filament orchestration (PO → Receipt → Invoice → Match)',
    category: 'Domain',
    component: POFlowProof,
    proves: [
      'Lifecycle is product (not document)',
      'Match as filament (not query)',
      'Variance is first-class state',
      'Partial receipts are the model'
    ]
  },
  {
    id: 'posting-policy-flow',
    name: 'Accounting Governance',
    description: 'Classification → Policy Validation → Posting Bundle',
    category: 'Domain',
    component: PostingPolicyFlowProof,
    proves: [
      'Accounting as governed lifecycle',
      'Policy engine blocks invalid postings',
      'Ledger pairs are locked bundles',
      'Roll-up is lens (not mutable store)'
    ]
  },
  {
    id: 'code-filament',
    name: 'Code as Filaments',
    description: 'Modules, dependencies, refactoring as geometry',
    category: 'Domain',
    component: CodeFilamentProof,
    proves: [
      'Edits are operations (not diffs)',
      'Dependencies are topology (not strings)',
      'Evidence is visible (typecheck/tests)',
      'Downstream impact as geometry'
    ]
  },
  {
    id: 'excel-import',
    name: '📊 Excel Import',
    description: 'Universal Import: Excel → Filaments (lossless)',
    category: 'Domain',
    component: ExcelImportProof,
    proves: [
      'Any Excel file → filaments (lossless)',
      'Cell edits append commits (immutable)',
      'Formulas as topology (dependency rays)',
      'Dual view: spreadsheet + 3D audit trail'
    ]
  },
  {
    id: 'proximity-globe',
    name: '🌍 Proximity Globe',
    description: 'Physical reality + digital presence (THE KEYSTONE)',
    category: 'Core',
    component: ProximityGlobeProof,
    proves: [
      'Walk in real life → see on globe',
      'Privacy + proximity coexist',
      'Distance never escalates tier',
      'You see existence before truth'
    ]
  },
  {
    id: 'ai-workspace',
    name: '🤖 AI Workspace',
    description: 'Conversation + Work Session + File as separate filaments',
    category: 'Core',
    component: AIWorkspaceProof,
    proves: [
      'Conversation ≠ Agent ≠ File',
      'No invisible work (all work = commits)',
      'Agents propose only; merges gated',
      'No autonomous merges (evidence required)'
    ]
  }
];

/**
 * Main unified proof page
 */
export default function UnifiedProofPage() {
  console.log('🟢🟢🟢 UNIFIED PROOF PAGE RENDERING 🟢🟢🟢');
  
  const { proofId } = useParams();
  const navigate = useNavigate();
  
  console.log('📍 URL proofId:', proofId);
  
  // Initialize from URL param or default to privacy-ladder
  const [selectedProofId, setSelectedProofId] = useState(proofId || 'privacy-ladder');
  
  console.log('🎯 Selected proofId:', selectedProofId);
  
  // Sync with URL params
  useEffect(() => {
    if (proofId && proofId !== selectedProofId) {
      setSelectedProofId(proofId);
    }
  }, [proofId]);
  
  // Handle proof selection
  const handleSelectProof = (id) => {
    setSelectedProofId(id);
    navigate(`/proof/${id}`);
  };
  
  const selectedProof = PROOFS.find(p => p.id === selectedProofId);
  const ProofComponent = selectedProof?.component;
  
  // Group proofs by category
  const coreProofs = PROOFS.filter(p => p.category === 'Core');
  const domainProofs = PROOFS.filter(p => p.category === 'Domain');
  
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', position: 'fixed', top: 0, left: 0 }}>
      {/* Left Sidebar: Proof Selector */}
      <div style={{
        width: '320px',
        background: 'rgba(0,0,0,0.95)',
        color: 'white',
        padding: '20px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px',
        borderRight: '2px solid #333'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#00ffff' }}>
          🧬 Relay Proofs
        </h1>
        
        <div style={{ marginBottom: '20px', padding: '12px', background: '#1a1a1a', borderRadius: '4px', fontSize: '10px', lineHeight: '1.6' }}>
          <div style={{ color: '#888', marginBottom: '5px' }}>One System. Multiple Domains.</div>
          <div style={{ color: '#00ff00' }}>
            All proofs demonstrate the same filament substrate applied to different problem spaces.
          </div>
        </div>
        
        {/* Core Proofs */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: '#ffaa00', marginBottom: '10px', fontWeight: 'bold' }}>
            CORE SUBSTRATE
          </div>
          {coreProofs.map(proof => (
            <button
              key={proof.id}
              onClick={() => handleSelectProof(proof.id)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '8px',
                background: selectedProofId === proof.id ? '#003366' : '#1a1a1a',
                color: selectedProofId === proof.id ? '#00ffff' : 'white',
                border: selectedProofId === proof.id ? '2px solid #00ffff' : '1px solid #333',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '11px',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedProofId !== proof.id) {
                  e.target.style.background = '#2a2a2a';
                  e.target.style.borderColor = '#555';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedProofId !== proof.id) {
                  e.target.style.background = '#1a1a1a';
                  e.target.style.borderColor = '#333';
                }
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{proof.name}</div>
              <div style={{ fontSize: '9px', color: '#888' }}>{proof.description}</div>
            </button>
          ))}
        </div>
        
        {/* Domain Proofs */}
        <div>
          <div style={{ fontSize: '11px', color: '#ffaa00', marginBottom: '10px', fontWeight: 'bold' }}>
            DOMAIN APPLICATIONS
          </div>
          {domainProofs.map(proof => (
            <button
              key={proof.id}
              onClick={() => handleSelectProof(proof.id)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '8px',
                background: selectedProofId === proof.id ? '#003366' : '#1a1a1a',
                color: selectedProofId === proof.id ? '#00ffff' : 'white',
                border: selectedProofId === proof.id ? '2px solid #00ffff' : '1px solid #333',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '11px',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedProofId !== proof.id) {
                  e.target.style.background = '#2a2a2a';
                  e.target.style.borderColor = '#555';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedProofId !== proof.id) {
                  e.target.style.background = '#1a1a1a';
                  e.target.style.borderColor = '#333';
                }
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{proof.name}</div>
              <div style={{ fontSize: '9px', color: '#888' }}>{proof.description}</div>
            </button>
          ))}
        </div>
        
        {/* Selected Proof Info */}
        {selectedProof && (
          <div style={{ marginTop: '20px', padding: '12px', background: '#1a1a1a', borderRadius: '4px', borderLeft: '3px solid #00ffff' }}>
            <div style={{ fontSize: '11px', color: '#ffaa00', marginBottom: '8px' }}>
              What This Proves:
            </div>
            {selectedProof.proves.map((item, i) => (
              <div key={i} style={{ fontSize: '10px', marginBottom: '5px', paddingLeft: '10px', color: '#aaa' }}>
                • {item}
              </div>
            ))}
          </div>
        )}
        
        {/* Substrate Invariants */}
        <div style={{ marginTop: '20px', padding: '12px', background: '#1a1a1a', borderRadius: '4px' }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px' }}>
            Shared Invariants:
          </div>
          <div style={{ fontSize: '9px', lineHeight: '1.6', color: '#666' }}>
            • Filaments = identity over time<br />
            • TimeBoxes = atomic commits<br />
            • Glyphs = operations (STAMP, GATE, SPLIT, SCAR)<br />
            • Evidence = attached to commits<br />
            • Topology = refs.inputs (dependency rays)<br />
            • Presence = locus-anchored (TTL)<br />
            • Privacy Ladder = L0-L6 visibility
          </div>
        </div>
      </div>
      
      {/* Right: Proof Renderer */}
      <div style={{ flex: 1, background: '#000', position: 'relative' }}>
        {ProofComponent ? (
          <ProofComponent />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            Select a proof to begin
          </div>
        )}
        
        {/* Proof Label (Top Right) */}
        {selectedProof && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.85)',
            color: '#00ffff',
            padding: '10px 16px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '11px',
            border: '1px solid #00ffff',
            pointerEvents: 'none'
          }}>
            {selectedProof.name}
          </div>
        )}
      </div>
    </div>
  );
}
