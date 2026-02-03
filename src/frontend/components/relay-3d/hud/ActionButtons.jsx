// relay-3d/hud/ActionButtons.jsx
import React from 'react';
import './ActionButtons.css';

/**
 * ActionButtons - Bottom center HUD for filament actions
 */
export default function ActionButtons({ selectedNode, onAction }) {
  const handleAction = (actionType) => {
    if (onAction) {
      onAction(actionType, selectedNode);
    }
  };

  const buttons = [
    { id: 'hold', label: 'HOLD', color: '#4CAF50', enabled: true },
    { id: 'reconcile', label: 'RECONCILE', color: '#FFD700', enabled: !!selectedNode, primary: true },
    { id: 'fork', label: 'FORK', color: '#2196F3', enabled: !!selectedNode },
    { id: 'merge', label: 'MERGE', color: '#9E9E9E', enabled: false },
    { id: 'expire', label: 'EXPIRE', color: '#F44336', enabled: !!selectedNode }
  ];

  return (
    <div className="relay-action-buttons">
      {buttons.map((btn) => (
        <button
          key={btn.id}
          className={`relay-action-btn ${btn.primary ? 'primary' : ''}`}
          style={{
            borderColor: btn.enabled ? btn.color : '#555',
            color: btn.enabled ? btn.color : '#555'
          }}
          disabled={!btn.enabled}
          onClick={() => handleAction(btn.id)}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
