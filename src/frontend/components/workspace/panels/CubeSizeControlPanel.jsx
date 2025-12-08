import React, { useState, useEffect, useCallback } from 'react';

const CubeSizeControlPanel = ({ 
  onCubeSizeChange, 
  initialSize = 1.0, 
  isVisible = true,
  onClose 
}) => {
  const [cubeSize, setCubeSize] = useState(initialSize);

  useEffect(() => {
    setCubeSize(initialSize);
  }, [initialSize]);

  const handleSliderChange = useCallback((event) => {
    const percentage = parseFloat(event.target.value);
    const newSize = percentage / 100;
    setCubeSize(newSize);
    if (onCubeSizeChange) {
      onCubeSizeChange(newSize);
    }
  }, [onCubeSizeChange]);

  // Format size for display
  const formatSize = (size) => {
    return `${(size * 100).toFixed(0)}%`;
  };

  // Get size description
  const getSizeDescription = (size) => {
    if (size < 0.1) return 'Tiny cubes';
    if (size < 0.5) return 'Small cubes';
    if (size < 1.0) return 'Medium cubes';
    if (size < 1.5) return 'Large cubes';
    if (size < 2.0) return 'Huge cubes';
    return 'Massive cubes';
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(15, 23, 42, 0.95)',
      border: '2px solid rgba(99, 102, 241, 0.4)',
      borderRadius: '16px',
      padding: '12px 20px',
      zIndex: 1000,
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
      width: '250px',
      color: 'white',
      fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#e2e8f0' }}>
          🧊 Cube Size Control
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '4px',
            transition: 'color 0.2s ease, background 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(99, 102, 241, 0.2)'}
          onMouseLeave={(e) => e.target.style.background = 'none'}
          title="Close panel"
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '12px', textAlign: 'center' }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#6366f1',
          marginBottom: '4px'
        }}>
          {formatSize(cubeSize)}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          {getSizeDescription(cubeSize)}
        </div>
      </div>

      {/* Slider */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="range"
          min="0"
          max="200"
          step="1"
          value={cubeSize * 100}
          onChange={handleSliderChange}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: 'linear-gradient(to right, #6366f1 0%, #6366f1 50%, #374151 50%, #374151 100%)',
            outline: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none'
          }}
          title={`Adjust cube size: ${formatSize(cubeSize)}`}
        />
        
        {/* Slider labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '4px',
          fontSize: '10px',
          color: '#6b7280'
        }}>
          <span>0%</span>
          <span>100%</span>
          <span>200%</span>
        </div>
      </div>
    </div>
  );
};

export default CubeSizeControlPanel;
