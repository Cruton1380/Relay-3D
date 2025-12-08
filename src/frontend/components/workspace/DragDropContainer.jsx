/**
 * DragDropContainer - Simplified panel container with drag functionality
 * Base Model 1 workspace panel management with localStorage persistence
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useWindowManagement } from '../../context/WindowManagementContext.jsx';

const DragDropContainer = ({ 
  children, 
  panelId, 
  title, 
  onClose,
  isDraggable = true,
  isResizable = true,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 340, height: 320 },
  // Channel stats props
  totalVotes,
  category,
  participants,
  candidateCount
}) => {
  const { getWindowData, updateWindow } = useWindowManagement();
  const containerRef = useRef(null);
  
  // Load persisted window state or use defaults
  const persistedData = getWindowData(panelId);
  const [position, setPosition] = useState(
    persistedData.position || defaultPosition
  );
  const [size, setSize] = useState(
    persistedData.size || defaultSize
  );
  const [isMinimized, setIsMinimized] = useState(
    persistedData.isMinimized || false
  );
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  // Use refs to track current state for event handlers
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  // Save window state to localStorage when position, size, or minimized state changes
  useEffect(() => {
    setIsSaving(true);
    updateWindow(panelId, { position, size, isMinimized });
    // Clear saving indicator after a short delay
    const timer = setTimeout(() => setIsSaving(false), 300);
    return () => clearTimeout(timer);
  }, [position, size, isMinimized, panelId, updateWindow]);

  // Toggle minimize/maximize
  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  // Stable function references using useCallback
  const handleMouseMove = useCallback((e) => {
    if (isDraggingRef.current) {
      // Constrain position to viewport bounds
      const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragOffset.current.y));
      setPosition({ x: newX, y: newY });
    } else if (isResizingRef.current) {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;
      setSize({
        width: Math.max(200, Math.min(window.innerWidth - position.x, resizeStart.current.width + dx)),
        height: Math.max(120, Math.min(window.innerHeight - position.y, resizeStart.current.height + dy))
      });
    }
  }, [panelId, size.width, size.height, position.x, position.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    isDraggingRef.current = false;
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, panelId]);

  // Drag logic
  const handleHeaderMouseDown = (e) => {
    if (!isDraggable) return;
    
    setIsDragging(true);
    isDraggingRef.current = true; // Set ref immediately
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Resize logic
  const handleResizeMouseDown = (e) => {
    if (!isResizable) return;
    setIsResizing(true);
    isResizingRef.current = true; // Set ref immediately
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.stopPropagation();
  };


  console.log(`🎨 [DragDropContainer] Rendering panel: ${panelId}`, {
    position,
    size,
    zIndex: 9999,
    title
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', // Changed from absolute to fixed for portaled panels
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        backgroundColor: panelId === 'channel_topic_row' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(30, 30, 30, 0.95)',
        border: '1px solid rgba(75, 85, 99, 0.5)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 99999, // Even higher z-index
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        pointerEvents: 'auto',
        cursor: isDragging ? 'grabbing' : 'default',
        visibility: 'visible', // Explicitly set visibility
        opacity: 1 // Explicitly set opacity
      }}
    >
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
      {/* Sticky Panel Header - Only show if title is not empty */}
      {title && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            padding: '8px 12px',
            backgroundColor: 'rgba(45, 45, 45, 0.92)',
            borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
            cursor: isDraggable ? 'grab' : 'default',
            userSelect: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 2
          }}
          onMouseDown={handleHeaderMouseDown}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>{title}</span>
            {/* Channel Stats - Fixed order: category, votes, participants, candidates */}
            {totalVotes && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
                {category && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📊</span>
                    <span>{category}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>👥</span>
                  <span>{totalVotes.toLocaleString()} votes</span>
                </div>
                {participants && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>👤</span>
                    <span>{participants} participants</span>
                  </div>
                )}
                {candidateCount && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🎯</span>
                    <span>{candidateCount} candidates</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Save indicator */}
            {isSaving && (
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                animation: 'pulse 1s infinite'
              }} title="Saving window state..." />
            )}
            {/* Minimize/Maximize Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMinimize();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.target.style.color = '#3b82f6'; e.target.style.background = 'rgba(59, 130, 246, 0.1)'; }}
              onMouseLeave={e => { e.target.style.color = '#6b7280'; e.target.style.background = 'none'; }}
              title={isMinimized ? "Maximize panel" : "Minimize panel"}
            >
              {isMinimized ? '□' : '−'}
            </button>
            {onClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(panelId);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '2px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.target.style.color = '#ef4444'; e.target.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                onMouseLeave={e => { e.target.style.color = '#6b7280'; e.target.style.background = 'none'; }}
                title="Close panel"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Panel Content - Modified for minimized state */}
      <div style={{ 
        flex: isMinimized ? 'none' : 1, 
        overflow: panelId === 'channel_topic_row' ? 'hidden' : 'auto', 
        padding: isMinimized ? '8px' : (panelId === 'channel_topic_row' ? '0' : '12px'),
        display: 'block',
        minHeight: isMinimized ? 'auto' : (panelId === 'channel_topic_row' ? '0' : '200px'),
        height: isMinimized ? 'auto' : '100%',
        // Remove background and borders for channel_topic_row to eliminate extra container appearance
        backgroundColor: panelId === 'channel_topic_row' ? 'transparent' : undefined,
        border: panelId === 'channel_topic_row' ? 'none' : undefined
      }}>
        {/* Always render children, but pass isMinimized prop only to React components, not DOM elements */}
        {React.isValidElement(children) && panelId === 'channel_topic_row' && children.type && typeof children.type === 'function'
          ? React.cloneElement(children, { isMinimized, key: children.key || 'channel-topic-row' })
          : children
        }
      </div>

      {/* Resize Handle */}
      {isResizable && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '15px',
            height: '15px',
            cursor: 'nw-resize',
            backgroundColor: 'rgba(75, 85, 99, 0.3)',
            borderTopLeftRadius: '4px',
            zIndex: 3
          }}
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
};

export default DragDropContainer; 