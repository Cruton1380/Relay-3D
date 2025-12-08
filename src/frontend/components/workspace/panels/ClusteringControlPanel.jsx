/**
 * Clustering Control Panel
 * 
 * Provides hierarchical clustering controls for switching between administrative levels:
 * GPS → Province → Country → Continent → Global
 * 
 * Based on V75 implementation with enhanced functionality
 */
import React, { useState } from 'react';

const ClusteringControlPanel = ({ onClusterLevelChange, currentLevel = 'continent', isVisible = true }) => {
  const [clusterLevel, setClusterLevel] = useState(currentLevel);

  // Hierarchical cluster level definitions
  const clusterLevels = [
    {
      id: 'gps',
      name: 'GPS Level',
      description: 'Individual candidate markers at exact GPS locations',
      icon: '📍',
      color: '#10b981',
      level: 0
    },
    {
      id: 'city',
      name: 'City',
      description: 'City level clustering with Others areas',
      icon: '🏙️',
      color: '#06b6d4',
      level: 1
    },
    {
      id: 'county',
      name: 'County',
      description: 'County/district level boundaries (ADM2)',
      icon: '🗺️',
      color: '#14b8a6',
      level: 1.5
    },
    {
      id: 'province',
      name: 'Province', 
      description: 'Provincial/state level channel stacks',
      icon: '🏛️',
      color: '#3b82f6',
      level: 2
    },
    {
      id: 'country',
      name: 'Country',
      description: 'Country level channel stacks',
      icon: '🏳️',
      color: '#f59e0b',
      level: 3
    },
    {
      id: 'macro_region',
      name: 'Region',
      description: 'UN Regional level channel stacks (5 regions)',
      icon: '🌎',
      color: '#8b5cf6',
      level: 4
    },
    {
      id: 'global',
      name: 'Global',
      description: 'Global level channel stacks',
      icon: '🌐',
      color: '#ef4444',
      level: 5
    }
  ];

  const handleLevelChange = (levelId) => {
    console.log(`🔗 Cluster level button clicked: ${levelId}`);
    setClusterLevel(levelId);
    
    // Notify parent component about the level change
    if (onClusterLevelChange) {
      onClusterLevelChange(levelId);
    }
  };

  const getCurrentLevelInfo = () => {
    return clusterLevels.find(level => level.id === clusterLevel) || clusterLevels[3]; // Default to continent
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(15, 23, 42, 0.95)',
      border: '2px solid rgba(99, 102, 241, 0.4)',
      borderRadius: '16px',
      padding: '12px 20px',
      display: 'flex',
      gap: '8px',
      zIndex: 1000,
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
    }}>
      {clusterLevels.map((level) => (
        <button
          key={level.id}
          onClick={() => handleLevelChange(level.id)}
          style={{
            background: clusterLevel === level.id ? level.color : 'rgba(51, 65, 85, 0.8)',
            color: 'white',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: clusterLevel === level.id ? `2px solid ${level.color}` : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            if (clusterLevel !== level.id) {
              e.target.style.background = 'rgba(71, 85, 105, 0.9)';
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (clusterLevel !== level.id) {
              e.target.style.background = 'rgba(51, 65, 85, 0.8)';
              e.target.style.transform = 'translateY(0)';
            }
          }}
          title={`${level.name}: ${level.description}`}
        >
          <span style={{ fontSize: '14px' }}>{level.icon}</span>
          <span>{level.name}</span>
        </button>
      ))}
      
      {/* Current level info */}
      <div style={{
        marginLeft: '16px',
        paddingLeft: '16px',
        borderLeft: '1px solid rgba(99, 102, 241, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '11px'
      }}>
        <span style={{ color: getCurrentLevelInfo().color, fontWeight: '600' }}>
          {getCurrentLevelInfo().icon} {getCurrentLevelInfo().name}
        </span>
        <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Level {getCurrentLevelInfo().level}
        </span>
      </div>
    </div>
  );
};

export default ClusteringControlPanel;