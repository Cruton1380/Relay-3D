/**
 * ChannelDisplay - Enhanced Channel Info UI with Voting
 * Clean display for clicked channels with integrated voting system
 */
import React, { useState, useEffect, useRef } from 'react';

const ChannelDisplay = ({ selectedChannel, onClose }) => {
  const [voteCounts, setVoteCounts] = useState({});
  const [userVotes, setUserVotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollContainerRef = useRef(null);
  
  // Demo user ID for testing
  const DEMO_USER_ID = 'demo-user-1';

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

  // Early return if no channel is selected
  if (!selectedChannel) {
    console.warn('ChannelDisplay: No selectedChannel provided');
    return (
      <div style={{
        background: 'rgba(17, 24, 39, 0.95)',
        borderRadius: '8px',
        border: '1px solid #374151',
        padding: '16px',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backdropFilter: 'blur(8px)',
        width: '100%',
        height: '100%',
        overflow: 'auto'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#9ca3af' }}>
          No channel selected
        </div>
      </div>
    );
  }

  // Load vote counts when channel is selected - FIXED: Use channel ID to prevent loops
  const prevChannelIdRef = useRef(null);
  useEffect(() => {
    if (!selectedChannel?.id) return;
    
    // Only reload if channel ID actually changed
    if (selectedChannel.id !== prevChannelIdRef.current) {
      prevChannelIdRef.current = selectedChannel.id;
      loadVoteCounts();
      loadUserVotes();
    }
  }, [selectedChannel?.id]);

  // Set up scroll event listeners and update arrow visibility - FIXED: Remove selectedChannel dependency
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
  }, []); // Removed selectedChannel dependency

  const loadVoteCounts = async () => {
    if (!selectedChannel.candidates) return;
    
    try {
      const counts = {};
      for (const candidate of selectedChannel.candidates) {
        const voteKey = `${selectedChannel.id}-${candidate.id}`;
        
        // Use the candidate's existing vote count as fallback
        const fallbackCount = candidate.votes || 0;
        
        try {
          const response = await fetch(`http://localhost:3002/api/vote/counts/candidate/${selectedChannel.id}/${candidate.id}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              counts[voteKey] = result.voteCount;
            } else {
              // Use fallback count if API call fails
              counts[voteKey] = fallbackCount;
            }
          } else {
            // Use fallback count if response is not ok
            counts[voteKey] = fallbackCount;
          }
        } catch (error) {
          console.warn(`Failed to load vote count for candidate ${candidate.id}:`, error);
          // Use fallback count if API call throws
          counts[voteKey] = fallbackCount;
        }
      }
      setVoteCounts(counts);
    } catch (error) {
      console.error('Failed to load vote counts:', error);
      // Set fallback counts if the entire function fails
      const fallbackCounts = {};
      for (const candidate of selectedChannel.candidates) {
        const voteKey = `${selectedChannel.id}-${candidate.id}`;
        fallbackCounts[voteKey] = candidate.votes || 0;
      }
      setVoteCounts(fallbackCounts);
    }
  };

  const loadUserVotes = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/vote/demo/user/${DEMO_USER_ID}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.votes) {
          const userVoteMap = {};
          result.votes.forEach(vote => {
            userVoteMap[vote.channelId] = vote.candidateId;
          });
          setUserVotes(userVoteMap);
        }
      } else {
        console.warn('Failed to load user votes, using empty state');
        setUserVotes({});
      }
    } catch (error) {
      console.warn('Failed to load user votes:', error);
      // Don't crash, just use empty state
      setUserVotes({});
    }
  };

  const handleVote = async (candidateId) => {
    const topicRowId = selectedChannel.id;
    const voteKey = `${topicRowId}-${candidateId}`;
    console.log('ChannelDisplay handleVote called:', { topicRowId, candidateId, voteKey });
    
    // Prevent voting while loading or if already voted
    if (loading) {
      console.log('Cannot vote while loading');
      return;
    }
    
    // Prevent double voting
    if (userVotes[topicRowId] === candidateId) {
      console.log('Already voted for this candidate');
      return;
    }

    setLoading(true);

    try {
      // Optimistically update UI
      setUserVotes(prev => ({
        ...prev,
        [topicRowId]: candidateId
      }));

      // Submit vote to backend
      const voteData = {
        channelId: topicRowId,
        candidateId: candidateId,
        userId: DEMO_USER_ID,
        action: 'vote'
      };
      
      console.log('Submitting vote to backend:', voteData);
      
      const response = await fetch('http://localhost:3002/api/vote/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData)
      });
      
      console.log('Backend response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Vote submission failed: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Vote submitted successfully:', result);
      
      // Update UI state based on backend response
      if (result.success) {
        // Update the new candidate's vote count
        if (result.newCount !== undefined) {
          setVoteCounts(prev => ({
            ...prev,
            [voteKey]: result.newCount
          }));
        }
        
        // If vote switching occurred, update previous candidate's count
        if (result.switched && result.previousCandidate) {
          const prevCandidateKey = `${topicRowId}-${result.previousCandidate}`;
          // Load fresh count for previous candidate
          try {
            const prevResponse = await fetch(`http://localhost:3002/api/vote/counts/candidate/${topicRowId}/${result.previousCandidate}`);
            if (prevResponse.ok) {
              const prevResult = await prevResponse.json();
              if (prevResult.success) {
                setVoteCounts(prev => ({
                  ...prev,
                  [prevCandidateKey]: prevResult.voteCount
                }));
              }
            }
          } catch (err) {
            console.warn('Failed to refresh previous candidate count:', err);
          }
        }
      } else {
        console.error('Vote submission failed:', result.error);
        // Revert optimistic update
        setUserVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[topicRowId];
          return newVotes;
        });
      }
    } catch (error) {
      console.error('Vote submission failed:', error);
      // Revert optimistic update
      setUserVotes(prev => {
        const newVotes = { ...prev };
        delete newVotes[topicRowId];
        return newVotes;
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate total votes from candidates with vote counts
  const totalVotes = selectedChannel.candidates 
    ? selectedChannel.candidates.reduce((sum, candidate) => {
        const voteKey = `${selectedChannel.id}-${candidate.id}`;
        return sum + (voteCounts[voteKey] || candidate.votes || 0);
      }, 0)
    : (selectedChannel.votes || 0);

  // Get top candidates with current vote counts
  const topCandidates = selectedChannel.candidates 
    ? selectedChannel.candidates.map(candidate => {
        const voteKey = `${selectedChannel.id}-${candidate.id}`;
        return {
          ...candidate,
          currentVotes: voteCounts[voteKey] || candidate.votes || 0
        };
      }).sort((a, b) => b.currentVotes - a.currentVotes).slice(0, 5)
    : [];

  return (
    <div style={{
      background: 'rgba(17, 24, 39, 0.95)',
      borderRadius: '8px',
      border: '1px solid #374151',
      padding: '16px',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backdropFilter: 'blur(8px)',
      width: '100%',
      height: '100%',
      overflow: 'auto'
    }}>
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
        Type: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{selectedChannel.type || 'General'}</span>
      </div>
      
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
        Total Votes: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{totalVotes.toLocaleString()}</span>
      </div>
      
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
        Location: {selectedChannel.latitude ? selectedChannel.latitude.toFixed(2) : 'N/A'}°, {selectedChannel.longitude ? selectedChannel.longitude.toFixed(2) : 'N/A'}°
      </div>
      
      {topCandidates.length > 0 && (
        <div style={{ marginTop: '12px', position: 'relative' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
            Candidates (Click to Vote):
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
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                fontSize: '16px',
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
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                fontSize: '16px',
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
              gap: '8px',
              padding: '0 10px'
            }}
            className="scroll-container"
          >
            {topCandidates.map((candidate, index) => (
              <div key={candidate.id} style={{
                fontSize: '11px',
                color: '#d1d5db',
                minWidth: '150px',
                padding: '6px 8px',
                background: userVotes[selectedChannel.id] === candidate.id 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : 'rgba(75, 85, 99, 0.3)',
                borderRadius: '4px',
                border: userVotes[selectedChannel.id] === candidate.id ? '1px solid #10b981' : '1px solid transparent',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onClick={() => !loading && handleVote(candidate.id)}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = userVotes[selectedChannel.id] === candidate.id 
                    ? 'rgba(16, 185, 129, 0.3)' 
                    : 'rgba(75, 85, 99, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = userVotes[selectedChannel.id] === candidate.id 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'rgba(75, 85, 99, 0.3)';
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div style={{ fontWeight: 'bold' }}>
                  {userVotes[selectedChannel.id] === candidate.id ? '✅ ' : ''}#{index + 1} {candidate.name}
                </div>
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '2px 6px',
                  borderRadius: '3px'
                }}>
                  {candidate.currentVotes.toLocaleString()} votes
                </div>
              </div>
              {userVotes[selectedChannel.id] === candidate.id && (
                <div style={{ 
                  fontSize: '9px', 
                  color: '#10b981', 
                  marginTop: '2px',
                  fontWeight: 'bold'
                }}>
                  Your Vote
                </div>
              )}
            </div>
            ))}
          </div>
          
          {loading && (
            <div style={{
              fontSize: '10px',
              color: '#f59e0b',
              textAlign: 'center',
              padding: '4px',
              fontStyle: 'italic'
            }}>
              Processing vote...
            </div>
          )}
        </div>
      )}
      
      <div style={{ fontSize: '10px', color: '#8b5cf6', marginTop: '12px' }}>
        Channel ID: {selectedChannel.id}
      </div>
    </div>
  );
};

export default ChannelDisplay; 