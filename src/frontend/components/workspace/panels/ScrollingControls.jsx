/**
 * Scrolling Controls Component
 * Handles: Arrow buttons, scroll behavior, visibility logic
 */
import React from 'react';

const ScrollingControls = ({ 
  showLeftArrow, 
  showRightArrow, 
  onScroll 
}) => {
  return (
    <>
      {/* Left Scroll Arrow */}
      {showLeftArrow && (
        <button 
          onClick={() => onScroll('left')}
          style={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(45, 45, 45, 0.9)',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            color: '#e2e8f0',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 100,
            opacity: 1,
            pointerEvents: 'auto',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
          aria-label="Scroll left"
        >
          ←
        </button>
      )}

      {/* Right Scroll Arrow */}
      {showRightArrow && (
        <button 
          onClick={() => onScroll('right')}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(45, 45, 45, 0.9)',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            color: '#e2e8f0',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 100,
            opacity: 1,
            pointerEvents: 'auto',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
          aria-label="Scroll right"
        >
          →
        </button>
      )}
    </>
  );
};

export default ScrollingControls;