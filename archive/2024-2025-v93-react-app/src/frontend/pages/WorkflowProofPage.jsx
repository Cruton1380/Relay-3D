/**
 * WORKFLOW PROOF PAGE
 * 
 * Proves spreadsheet cells are filament projections.
 * One column, one error, fully traceable.
 */

import React from 'react';
import WorkflowProofScene from '../components/filament/scenes/WorkflowProofScene';

export default function WorkflowProofPage() {
  console.log('[WorkflowProofPage] RENDERING');
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      <WorkflowProofScene />
    </div>
  );
}
