/**
 * ChannelDisplay - Essential Channel Info UI
 * Clean display for clicked channels
 */
import React, { useState, useEffect, useRef } from 'react';

const ChannelDisplay = ({ selectedChannel, onClose }) => {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollContainerRef = useRef(null);

  if (!selectedChannel) return null;

  // Calculate total votes from candidates
  const totalVotes = selectedChannel.candidates 
    ? selectedChannel.candidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0)
    : (selectedChannel.votes || 0);

  // Get top candidates
  const topCandidates = selectedChannel.candidates 
    ? selectedChannel.candidates.slice(0, 3)
    : [];

  const getTotalVotes = (candidate) => (candidate.testVotes || 0) + (candidate.realVotes || 0);

  // Scroll functions
  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollAmount = Math.max(container.clientWidth * 0.8, 200);
    
    if (direction === 'left') {
      container.scrollTo({
        left: Math.max(0, container.scrollLeft - scrollAmount),
        behavior: 'smooth'
      });
    } else {
      container.scrollTo({
        left: Math.min(container.scrollWidth - container.clientWidth, container.scrollLeft + scrollAmount),
        behavior: 'smooth'
      });
    }
  };

  // Update arrow visibility
  const updateArrowVisibility = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const isScrolledFromLeft = container.scrollLeft > 0;
    const shouldShowRightArrow = container.scrollLeft < (container.scrollWidth - container.clientWidth - 1);
    
    setShowLeftArrow(isScrolledFromLeft);
    setShowRightArrow(shouldShowRightArrow);
  };

  // Set up scroll event listeners
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => updateArrowVisibility();
    const handleResize = () => updateArrowVisibility();

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Initial arrow visibility check
    setTimeout(updateArrowVisibility, 100);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedChannel]);

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      background: 'rgba(17, 24, 39, 0.95)',
      borderRadius: '8px',
      border: '1px solid #374151',
      padding: '16px',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backdropFilter: 'blur(8px)',
      maxWidth: '350px',
      zIndex: 1000,
      border: '3px solid #00ff00' // BRIGHT GREEN BORDER FOR TESTING
    }}>
      {/* TEST SIGN */}
      <div style={{
        background: '#ff0000',
        color: '#ffffff',
        padding: '5px',
        fontSize: '12px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '10px',
        border: '2px solid #ffff00'
      }}>
        🚨 CHANNEL DISPLAY UI TEST SIGN 🚨
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
          🎯 {selectedChannel.name}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(75, 85, 99, 0.5)',
            border: 'none',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            hover: { background: 'rgba(75, 85, 99, 0.7)' }
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
        Type: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{selectedChannel.type}</span>
      </div>
      
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
        Total Votes: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{totalVotes.toLocaleString()}</span>
      </div>
      
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
        Location: {selectedChannel.latitude.toFixed(2)}°, {selectedChannel.longitude.toFixed(2)}°
      </div>
      
      {topCandidates.length > 0 && (
        <div style={{ marginTop: '12px', position: 'relative' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
            Top Candidates:
          </div>
          
          {/* Left Arrow */}
          {showLeftArrow && (
            <button 
              onClick={() => handleScroll('left')}
              style={{
                position: 'absolute',
                left: '-10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#ffff00',
                border: '2px solid #000000',
                borderRadius: '50%',
                width: '25px',
                height: '25px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ←
            </button>
          )}
          
          {/* Right Arrow */}
          {showRightArrow && (
            <button 
              onClick={() => handleScroll('right')}
              style={{
                position: 'absolute',
                right: '-10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#ffff00',
                border: '2px solid #000000',
                borderRadius: '50%',
                width: '25px',
                height: '25px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              →
            </button>
          )}
          
          {/* Scrollable Container */}
          <div 
            ref={scrollContainerRef}
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '6px',
              padding: '0 8px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitScrollbar: { display: 'none' }
            }}
            className="scroll-container"
          >
            {topCandidates.map((candidate, index) => (
              <div key={candidate.id} style={{
                fontSize: '11px',
                color: '#d1d5db',
                minWidth: '120px',
                padding: '4px 8px',
                background: 'rgba(75, 85, 99, 0.3)',
                borderRadius: '4px',
                flexShrink: 0
              }}>
                <div style={{ fontWeight: 'bold' }}>
                  #{candidate.position} {candidate.name}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                  {getTotalVotes(candidate).toLocaleString()} votes
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ fontSize: '10px', color: '#8b5cf6', marginTop: '12px' }}>
        Channel ID: {selectedChannel.id}
      </div>
    </div>
  );
};

export default ChannelDisplay;
