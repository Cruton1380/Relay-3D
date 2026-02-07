/**
 * @fileoverview BoundaryEditToolbar - Minimal Floating Edit Controls
 * 
 * Compact toolbar that appears above the channel panel when editing boundaries.
 * Shows essential editing info and controls only.
 * 
 * @version 1.0
 * @date October 8, 2025
 */

import React from 'react';
import './BoundaryEditToolbar.css';

const BoundaryEditToolbar = ({
  regionName,
  nodeCount,
  areaDelta,
  isEditing,
  onAddNode,
  onDeleteNode,
  onSubmit,
  onCancel
}) => {
  if (!isEditing) return null;

  return (
    <div className="boundary-edit-toolbar">
      <div className="toolbar-header">
        <span className="toolbar-icon">✏️</span>
        <span className="toolbar-title">Editing: {regionName} Boundary</span>
      </div>

      <div className="toolbar-stats">
        <div className="toolbar-stat">
          <span className="stat-icon">📍</span>
          <span className="stat-label">Nodes:</span>
          <span className="stat-value">{nodeCount}</span>
        </div>
        <div className="toolbar-stat">
          <span className="stat-icon">📏</span>
          <span className="stat-label">Area:</span>
          <span className="stat-value">{areaDelta}</span>
        </div>
      </div>

      <div className="toolbar-controls">
        <div className="toolbar-instructions">
          <div className="instruction-item">
            <strong>Click</strong> node to select
          </div>
          <div className="instruction-item">
            <strong>Drag</strong> to move
          </div>
          <div className="instruction-item">
            <strong>Click line</strong> to add
          </div>
          <div className="instruction-item">
            <strong>Right-click</strong> to delete
          </div>
        </div>
      </div>

      <div className="toolbar-actions">
        <button 
          className="btn-toolbar btn-submit"
          onClick={onSubmit}
          title="Submit boundary proposal"
        >
          ✓ Submit Proposal
        </button>
        <button 
          className="btn-toolbar btn-cancel"
          onClick={onCancel}
          title="Cancel editing"
        >
          ✗ Cancel
        </button>
      </div>
    </div>
  );
};

export default BoundaryEditToolbar;
