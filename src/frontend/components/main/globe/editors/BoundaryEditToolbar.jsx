/**
 * @fileoverview BoundaryEditToolbar - Slim Floating Toolbar for Boundary Editing
 * 
 * Minimal toolbar that floats above the channel panel with essential editing controls.
 * Handles node manipulation, multi-selection, and boundary submission.
 * 
 * @version 1.0
 * @date October 8, 2025
 */

import React, { useState } from 'react';
import './BoundaryEditToolbar.css';

const BoundaryEditToolbar = ({
  regionName,
  nodeCount,
  areaDelta,
  mode = 'single', // 'single', 'multi', 'view'
  onModeChange,
  onSubmit,
  onCancel
}) => {
  const [selectedTool, setSelectedTool] = useState('single');

  const handleToolChange = (tool) => {
    setSelectedTool(tool);
    onModeChange?.(tool);
  };

  // Log button state for debugging
  const isConfirmDisabled = nodeCount < 3;
  console.log('🔘 [TOOLBAR] Confirm button state:', {
    nodeCount,
    isDisabled: isConfirmDisabled,
    canSubmit: !isConfirmDisabled
  });

  return (
    <div className="boundary-edit-toolbar">
      {/* Region Info */}
      <div className="toolbar-section">
        <span className="toolbar-label">{regionName} Boundary</span>
        <div className="toolbar-stats">
          <span className="stat">📍 {nodeCount} nodes</span>
          <span className="stat">📏 {areaDelta}</span>
        </div>
      </div>

      {/* Tool Selection */}
      <div className="toolbar-section">
        <button
          className={`tool-btn ${selectedTool === 'single' ? 'active' : ''}`}
          onClick={() => handleToolChange('single')}
          title="Select and move single nodes"
        >
          <span className="tool-icon">👆</span>
          <span className="tool-label">Single</span>
        </button>
        
        <button
          className={`tool-btn ${selectedTool === 'multi' ? 'active' : ''}`}
          onClick={() => handleToolChange('multi')}
          title="Select multiple nodes with rectangle"
        >
          <span className="tool-icon">🔲</span>
          <span className="tool-label">Box</span>
        </button>
        
        <button
          className={`tool-btn ${selectedTool === 'lasso' ? 'active' : ''}`}
          onClick={() => handleToolChange('lasso')}
          title="Select multiple nodes with lasso"
        >
          <span className="tool-icon">✨</span>
          <span className="tool-label">Lasso</span>
        </button>
        
        <button
          className={`tool-btn ${selectedTool === 'view' ? 'active' : ''}`}
          onClick={() => handleToolChange('view')}
          title="View only (pan and zoom)"
        >
          <span className="tool-icon">👁️</span>
          <span className="tool-label">View</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="toolbar-section">
        <button
          className="action-btn submit-btn"
          onClick={onSubmit}
          disabled={isConfirmDisabled}
        >
          ✓ Confirm
        </button>
        
        <button
          className="action-btn cancel-btn"
          onClick={onCancel}
        >
          ✗ Cancel
        </button>
      </div>
    </div>
  );
};

export default BoundaryEditToolbar;
