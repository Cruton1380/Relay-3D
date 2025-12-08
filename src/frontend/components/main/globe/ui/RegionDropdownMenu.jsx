/**
 * RegionDropdownMenu Component
 * 
 * Shows a dropdown menu when clicking on a region polygon:
 * - 🗺️ Boundary: Opens boundary modification channel
 * - ⚙️ Parameters: Opens regional parameter settings
 * - 🏛️ Governance: Opens regional governance panel
 */

import React, { useState, useEffect, useRef } from 'react';
import './RegionDropdownMenu.css';

const RegionDropdownMenu = ({ 
  regionName, 
  regionType,
  position, // { x, y } screen coordinates
  onClose,
  onOpenBoundary,
  onOpenParameters,
  onOpenGovernance
}) => {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBoundaryClick = () => {
    console.log(`🗺️ [MENU] Boundary button clicked for ${regionName}`);
    console.log(`🗺️ [MENU] onOpenBoundary is:`, typeof onOpenBoundary, onOpenBoundary);
    if (onOpenBoundary) {
      console.log(`🗺️ [MENU] Calling onOpenBoundary(${regionName}, ${regionType})`);
      onOpenBoundary(regionName, regionType);
    } else {
      console.error('🗺️ [MENU] ERROR: onOpenBoundary prop is undefined!');
    }
    onClose();
  };

  const handleParametersClick = () => {
    console.log(`⚙️ Opening parameters for ${regionName}`);
    onOpenParameters(regionName, regionType);
    onClose();
  };

  const handleGovernanceClick = () => {
    console.log(`🏛️ Opening governance for ${regionName}`);
    onOpenGovernance(regionName, regionType);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="region-dropdown-menu"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 10000
      }}
    >
      <div className="region-dropdown-header">
        <h3>{regionName}</h3>
        <span className="region-type-badge">{regionType}</span>
      </div>
      
      <div className="region-dropdown-options">
        <button 
          className="region-dropdown-option boundary"
          onClick={handleBoundaryClick}
        >
          <span className="option-icon">🗺️</span>
          <div className="option-content">
            <div className="option-title">Boundary</div>
            <div className="option-description">Propose boundary modifications</div>
          </div>
        </button>

        <button 
          className="region-dropdown-option parameters"
          onClick={handleParametersClick}
        >
          <span className="option-icon">⚙️</span>
          <div className="option-content">
            <div className="option-title">Parameters</div>
            <div className="option-description">Regional settings & configuration</div>
          </div>
        </button>

        <button 
          className="region-dropdown-option governance"
          onClick={handleGovernanceClick}
        >
          <span className="option-icon">🏛️</span>
          <div className="option-content">
            <div className="option-title">Governance</div>
            <div className="option-description">Democratic governance options</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default RegionDropdownMenu;
