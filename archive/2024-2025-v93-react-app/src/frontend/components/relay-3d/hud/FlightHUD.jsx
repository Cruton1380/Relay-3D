// relay-3d/hud/FlightHUD.jsx
import React from 'react';
import './FlightHUD.css';

/**
 * FlightHUD - Tiny flight status chip (top-right)
 * Shows: speed, mode, cursor lock state
 * 
 * Modes:
 * - FREE-FLY: pointer locked, actively flying
 * - HOLD: pointer unlocked, velocity damped to zero
 * - INSPECT: returning to anchor
 */
export default function FlightHUD({ speed = 6.0, mode = 'HOLD', isLocked = false }) {
  // Mode styling
  const getModeClass = () => {
    switch (mode) {
      case 'FREE-FLY': return 'mode-freefly';
      case 'INSPECT': return 'mode-inspect';
      case 'HOLD':
      default: return 'mode-hold';
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'FREE-FLY': return '✈️';
      case 'INSPECT': return '🎯';
      case 'HOLD':
      default: return '⏸️';
    }
  };

  return (
    <div className={`flight-hud ${getModeClass()}`}>
      <div className="flight-hud-row">
        <span className="flight-hud-icon">{getModeIcon()}</span>
        <span className="flight-hud-mode">{mode}</span>
      </div>
      <div className="flight-hud-row">
        <span className="flight-hud-label">Speed:</span>
        <span className="flight-hud-value">{speed.toFixed(1)}</span>
      </div>
      <div className="flight-hud-row">
        <span className="flight-hud-label">Lock:</span>
        <span className={`flight-hud-lock ${isLocked ? 'locked' : 'unlocked'}`}>
          {isLocked ? '🔒' : '🔓'}
        </span>
      </div>
      
      {/* Quick help (only show in HOLD mode) */}
      {mode === 'HOLD' && (
        <div className="flight-hud-help">
          <div className="flight-hud-help-line">Click to fly</div>
          <div className="flight-hud-help-line">WASD: move • Q/E: vertical</div>
          <div className="flight-hud-help-line">Shift: fast • Ctrl: slow</div>
          <div className="flight-hud-help-line">R: return • Esc: hold</div>
        </div>
      )}
    </div>
  );
}
