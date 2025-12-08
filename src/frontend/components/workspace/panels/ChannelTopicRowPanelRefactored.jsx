/**
 * Channel Topic Row Panel - REFACTORED VERSION
 * 
 * Features:
 * - Decomposed into focused components
 * - Clear separation of concerns
 * - Fixed voting and scrollbar issues
 * - Much easier to maintain and debug
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Vote } from 'lucide-react';
import authoritativeVoteAPI from '../../../services/authoritativeVoteAPI.js';
import CandidateCard from './CandidateCard.jsx';
import ScrollingControls from './ScrollingControls.jsx';
import { useVoting } from './useVoting.js';

const ChannelTopicRowPanelRefactored = ({ 
  panel, 
  globeState, 
  setGlobeState, 
  layout, 
  updatePanel, 
  onVoteUpdate, 
  isMinimized = false, 
  onClose = () => {}
}) => {
  
  const [voteCounts, setVoteCounts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const selectedChannel = globeState?.selectedChannel;
  
  // Use voting hook for clean vote management
  const { userVotes, isVoting, recentlyVoted, notification, handleVote } = useVoting(
    selectedChannel, 
    setGlobeState, 
    onVoteUpdate
  );
  
  // Debug: Track userVotes changes
  useEffect(() => {
    console.log(`🗳️ [Panel] userVotes state:`, { 
      channelId: selectedChannel?.id, 
      currentVote: userVotes[selectedChannel?.id],
      allUserVotes: userVotes 
    });
  }, [userVotes, selectedChannel]);
  
  // **NEW: Handle candidate card click - pan camera and show voters**
  const handleCandidateCardClick = useCallback((candidate) => {
    console.log(`🎯 [Panel] Candidate card clicked: ${candidate.name}`);
    console.log('🎯 [Panel] window.earthGlobeControls exists?', typeof window.earthGlobeControls);
    console.log('🎯 [Panel] panToCandidateAndShowVoters exists?', typeof window.earthGlobeControls?.panToCandidateAndShowVoters);
    
    // Use window.earthGlobeControls to access globe functions
    if (window.earthGlobeControls?.panToCandidateAndShowVoters) {
      console.log(`🎯 [Panel] Calling panToCandidateAndShowVoters via window.earthGlobeControls`);
      window.earthGlobeControls.panToCandidateAndShowVoters(candidate, selectedChannel);
    } else {
      console.warn('🎯 [Panel] window.earthGlobeControls.panToCandidateAndShowVoters not available');
      console.warn('🎯 [Panel] Available methods:', window.earthGlobeControls ? Object.keys(window.earthGlobeControls) : 'window.earthGlobeControls is undefined');
    }
  }, [selectedChannel]);

  // ===== IMMEDIATE: Initialize blockchain vote counts to 0 when panel opens =====
  // NOTE: voteCounts should ONLY contain blockchain votes, NOT initialVotes
  // Total display = initialVotes (base) + voteCounts (blockchain)
  useEffect(() => {
    if (!selectedChannel?.candidates) return;
    
    console.log('[ChannelPanel] 🚀 IMMEDIATE: Initializing blockchain vote counts to 0');
    const immediateVoteCounts = {};
    
    for (const candidate of selectedChannel.candidates) {
      const voteKey = `${selectedChannel.id}-${candidate.id}`;
      // Initialize to 0 - blockchain votes will be loaded from globeState or API
      immediateVoteCounts[voteKey] = 0;
      console.log(`[ChannelPanel] 🚀 ${candidate.name}: 0 blockchain votes (initialVotes: ${candidate.initialVotes || 0})`);
    }
    
    // Set immediately - blockchain votes start at 0
    setVoteCounts(immediateVoteCounts);
    console.log('[ChannelPanel] ✅ IMMEDIATE: Blockchain vote counts initialized to 0');
  }, [selectedChannel?.id, selectedChannel?.candidates]);

  // Initialize vote counts from globeState if available (prevents showing 0 during load)
  useEffect(() => {
    if (!selectedChannel?.candidates || !globeState?.voteCounts) return;
    
    // Check if we already have vote counts from globeState
    const hasGlobeVoteCounts = selectedChannel.candidates.some(candidate => {
      const voteKey = `${selectedChannel.id}-${candidate.id}`;
      return globeState.voteCounts[voteKey] !== undefined;
    });
    
    if (hasGlobeVoteCounts) {
      console.log('[ChannelPanel] 🎯 Updating vote counts from globeState (syncing with globe)');
      const initialVoteCounts = {};
      for (const candidate of selectedChannel.candidates) {
        const voteKey = `${selectedChannel.id}-${candidate.id}`;
        initialVoteCounts[voteKey] = globeState.voteCounts[voteKey] || 0;
      }
      setVoteCounts(initialVoteCounts);
    }
  }, [selectedChannel?.id, globeState?.voteCounts]);

  // DISABLED: Load vote counts from API
  // This API was returning baseVoteCounts (initialVotes) and populating globeState.voteCounts with them
  // Causing double counting: display = initialVotes + voteCounts = initialVotes + initialVotes
  //
  // NEW SYSTEM: voteCounts should ONLY contain blockchain votes (real user votes)
  // - Starts at 0
  // - Increases/decreases with actual votes
  // - NOT pre-populated with initialVotes
  /*
  useEffect(() => {
    if (!selectedChannel?.candidates) return;

    const loadVoteCounts = async () => {
      setIsLoading(true);
      try {
        const authoritativeTotals = await authoritativeVoteAPI.getTopicVoteTotals(selectedChannel.id);
        
        const newVoteCounts = {};
        for (const candidate of selectedChannel.candidates) {
          const voteKey = `${selectedChannel.id}-${candidate.id}`;
          const authoritativeCount = authoritativeTotals.candidates[candidate.id];
          newVoteCounts[voteKey] = authoritativeCount !== undefined ? authoritativeCount : (candidate.votes || 0);
        }
        
        setVoteCounts(newVoteCounts);
        
        if (setGlobeState) {
          setGlobeState(prev => ({
            ...prev,
            voteCounts: { ...prev.voteCounts, ...newVoteCounts }
          }));
        }
        
      } catch (error) {
        console.error('Error loading vote counts:', error);
        
        // Fallback to candidate votes
        const fallbackVoteCounts = {};
        for (const candidate of selectedChannel.candidates) {
          const voteKey = `${selectedChannel.id}-${candidate.id}`;
          fallbackVoteCounts[voteKey] = candidate.votes || 0;
        }
        setVoteCounts(fallbackVoteCounts);
      } finally {
        setIsLoading(false);
      }
    };

    loadVoteCounts();
  }, [selectedChannel, setGlobeState]);
  */

  // Listen for vote count updates from globeState (real-time updates)
  useEffect(() => {
    if (!globeState?.voteCounts || !selectedChannel?.candidates) return;
    
    // Update local voteCounts state when globeState changes
    setVoteCounts(prevVoteCounts => {
      const updatedVoteCounts = { ...prevVoteCounts };
      let hasChanges = false;
      
      // Check each candidate's vote count in globeState
      for (const candidate of selectedChannel.candidates) {
        const voteKey = `${selectedChannel.id}-${candidate.id}`;
        const globalVoteCount = globeState.voteCounts[voteKey];
        
        // If globeState has a different count, update it
        if (globalVoteCount !== undefined && globalVoteCount !== updatedVoteCounts[voteKey]) {
          console.log(`🔄 [ChannelPanel] Updating ${candidate.name} vote count: ${updatedVoteCounts[voteKey]} → ${globalVoteCount}`);
          updatedVoteCounts[voteKey] = globalVoteCount;
          hasChanges = true;
        }
      }
      
      return hasChanges ? updatedVoteCounts : prevVoteCounts;
    });
  }, [globeState?.voteCounts, selectedChannel]);

  // Arrow visibility logic
  const updateArrowVisibility = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const isScrolledFromLeft = container.scrollLeft > 0;
    const contentWiderThanContainer = container.scrollWidth > container.clientWidth;
    const canScrollRight = container.scrollLeft < (container.scrollWidth - container.clientWidth - 1);
    const shouldShowRightArrow = canScrollRight || (contentWiderThanContainer && container.scrollLeft === 0);
    
    setShowLeftArrow(isScrolledFromLeft);
    setShowRightArrow(shouldShowRightArrow);
  };

  // Scroll handler
  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollAmount = Math.max(container.clientWidth * 0.8, 200);
    const newScrollPosition = direction === 'left' 
      ? Math.max(0, container.scrollLeft - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, container.scrollLeft + scrollAmount);
    
    container.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
    setTimeout(updateArrowVisibility, 300);
  };

  // Update arrows when candidates change
  useEffect(() => {
    const timer = setTimeout(updateArrowVisibility, 100);
    return () => clearTimeout(timer);
  }, [selectedChannel?.candidates]);

  // Container width tracking
  useEffect(() => {
    const handleResize = () => updateArrowVisibility();
    window.addEventListener('resize', handleResize);
    
    if (scrollContainerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width } = entry.contentRect;
          setContainerWidth(width);
          updateArrowVisibility();
        }
      });
      resizeObserver.observe(scrollContainerRef.current);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        resizeObserver.disconnect();
      };
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate card width
  const calculateCardWidth = () => {
    if (!containerWidth || !selectedChannel?.candidates?.length) return 280;
    
    const availableWidth = containerWidth - 32;
    const numCandidates = selectedChannel.candidates.length;
    const minCardWidth = 280;
    const maxCardWidth = 400;
    const gaps = (numCandidates - 1) * 8;
    
    const idealWidth = (availableWidth - gaps) / numCandidates;
    return Math.max(minCardWidth, Math.min(maxCardWidth, idealWidth));
  };

  // Sort candidates by votes (base + blockchain total)
  const sortedCandidates = selectedChannel?.candidates 
    ? [...selectedChannel.candidates].sort((a, b) => {
        const voteKeyA = `${selectedChannel.id}-${a.id}`;
        const voteKeyB = `${selectedChannel.id}-${b.id}`;
        const baseVotesA = a.initialVotes || 0;
        const baseVotesB = b.initialVotes || 0;
        const blockchainVotesA = voteCounts[voteKeyA] || 0;
        const blockchainVotesB = voteCounts[voteKeyB] || 0;
        const totalVotesA = baseVotesA + blockchainVotesA;
        const totalVotesB = baseVotesB + blockchainVotesB;
        return totalVotesB - totalVotesA;
      })
    : [];

  // Calculate total votes (base + blockchain for all candidates)
  const totalVotes = useMemo(() => {
    return sortedCandidates.reduce((sum, candidate) => {
      const voteKey = `${selectedChannel?.id}-${candidate.id}`;
      const baseVotes = candidate.initialVotes || 0;
      const blockchainVotes = voteCounts[voteKey] || 0;
      const totalCandidateVotes = baseVotes + blockchainVotes;
      return sum + totalCandidateVotes;
    }, 0);
  }, [sortedCandidates, voteCounts, selectedChannel]);

  // Handle empty states
  if (!selectedChannel) {
    return (
      <div style={{
        padding: '20px',
        color: '#fff',
        textAlign: 'center',
        background: 'rgba(24, 27, 42, 0.98)',
        borderRadius: '16px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <h3>No Channel Selected</h3>
          <p>Click on a channel on the globe to view its candidates</p>
        </div>
      </div>
    );
  }

  // Minimized view
  if (isMinimized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 0',
        flexWrap: 'wrap',
        background: 'transparent'
      }}>
        <div style={{ 
          fontSize: '11px', 
          color: '#94a3b8', 
          fontWeight: '500',
          marginRight: '6px',
          whiteSpace: 'nowrap'
        }}>
          {selectedChannel.name.length > 15 
            ? selectedChannel.name.substring(0, 15) + '...' 
            : selectedChannel.name}
        </div>
        {sortedCandidates.slice(0, 4).map((candidate, index) => {
          const voteKey = `${selectedChannel.id}-${candidate.id}`;
          // Calculate total votes: base votes + blockchain votes (same as GlobalChannelRenderer)
          const baseVotes = candidate.initialVotes || 0;
          const blockchainVotes = voteCounts[voteKey] || 0;
          const voteCount = baseVotes + blockchainVotes;
          const isVoted = userVotes[selectedChannel.id] === candidate.id;
          const isCurrentlyVoting = isVoting && recentlyVoted === candidate.id;
          const position = index + 1;

          return (
            <div key={candidate.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              background: isVoted ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)' : 
                          position === 1 ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)' :
                          'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.8) 100%)',
              borderRadius: '8px',
              padding: '4px 8px',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}>
              <div style={{ 
                fontSize: '10px', 
                color: position === 1 ? '#fbbf24' : '#6366f1',
                fontWeight: '700',
                minWidth: '14px'
              }}>
                {position === 1 ? '🥇' : '#' + position}
              </div>
              <button
                onClick={() => handleVote(candidate.id)}
                disabled={isVoted || isVoting}
                style={{
                  background: isVoted ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
                  border: `1px solid #3b82f6`,
                  color: isVoted ? '#fff' : '#3b82f6',
                  borderRadius: 3,
                  padding: '2px 6px',
                  fontSize: 9,
                  fontWeight: 600,
                  cursor: (isVoted || isVoting) ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  minWidth: '35px',
                  justifyContent: 'center'
                }}
              >
                <Vote size={7} />
                {voteCount}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      height: '100%',
      minHeight: '100%',
      background: 'transparent'
    }}>
      {/* CSS Styles */}
      <style>{`
        .candidate-description::-webkit-scrollbar {
          width: 6px;
        }
        .candidate-description::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .candidate-description::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .candidate-description::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Scrolling Controls */}
      <ScrollingControls 
        showLeftArrow={showLeftArrow}
        showRightArrow={showRightArrow}
        onScroll={handleScroll}
      />

      {/* Scrolling Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={updateArrowVisibility}
        style={{
          background: 'transparent',
          height: '100%',
          minHeight: '100%',
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          padding: '8px',
          overflowX: 'auto',
          overflowY: 'auto',
          borderRadius: '0',
          border: 'none',
          position: 'relative',
          boxSizing: 'border-box',
          alignItems: 'stretch',
          scrollbarWidth: 'thin',
          scrollBehavior: 'smooth'
        }}
      >
        {/* Candidate Cards */}
        {sortedCandidates.map((candidate, index) => {
          const position = index + 1;
          const voteKey = `${selectedChannel.id}-${candidate.id}`;
          // Calculate total votes: base votes + blockchain votes (same as GlobalChannelRenderer)
          const baseVotes = candidate.initialVotes || 0;
          const blockchainVotes = voteCounts[voteKey] || 0;
          const voteCount = baseVotes + blockchainVotes;
          const isVoted = userVotes[selectedChannel.id] === candidate.id;
          const isCandidateVoting = recentlyVoted === candidate.id;
          
          // Debug: Log voting state for ALL candidates to see what's happening
          console.log(`🗳️ [Card ${index+1}] ${candidate.username || candidate.name}: isVoted=${isVoted}, userVotes[channel]=${userVotes[selectedChannel.id]}, candidate.id=${candidate.id}, match=${userVotes[selectedChannel.id] === candidate.id}`);
          const dynamicWidth = calculateCardWidth();

          return (
            <CandidateCard
              key={`${candidate.id}-${userVotes[selectedChannel.id]}`} // Force re-render when ANY vote changes
              candidate={candidate}
              position={position}
              voteCount={voteCount}
              totalVotes={totalVotes}
              isVoted={isVoted}
              isVoting={isCandidateVoting}
              onVote={handleVote}
              dynamicWidth={dynamicWidth}
              channelId={selectedChannel.id}
              channelCategory={selectedChannel.category}
              onCardClick={handleCandidateCardClick}
            />
          );
        })}
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#10b981',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          {notification}
        </div>
      )}
    </div>
  );
};

export default ChannelTopicRowPanelRefactored;