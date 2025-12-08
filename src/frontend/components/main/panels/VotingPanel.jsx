/**
 * Channel Topic Row Panel - Clean, Condensed Design
 * 
 * Features:
 * - Square candidate cards with consistent vote button positioning
 * - Clean dark cards with user info, condensed descriptions, vote buttons
 * - Horizontal scrolling at bottom of entire channel
 * - One user, one vote per channel logic
 * - Candidates ranked left to right by votes
 * - Condensed text with descriptions bar
 * - AUTHORITATIVE VOTE SYSTEM - Single Source of Truth
 * - BOUNDARY CANDIDATES: Special display for boundary proposals
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Users, BarChart3, Clock, ChevronLeft, ChevronRight, Vote, Map, MapPin, Eye, Layers } from 'lucide-react';
import { voteAPI } from '../../workspace/services/apiClient.js';
import authoritativeVoteAPI from '../../../services/authoritativeVoteAPI.js';
import SparklineChart from '../../SparklineChart';

// Generate mock vote trend data for sparklines
const generateMockVoteTrend = (candidateId, currentVotes) => {
  const points = 15; // 15 data points for trend
  const trend = [];
  
  // Handle undefined or null candidateId
  const safeCandidateId = candidateId || 'default-candidate';
  
  // Different trend patterns based on candidate ID hash
  const hash = safeCandidateId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const trendType = hash % 4; // 4 different trend types
  
  let baseValue = Math.max(1, currentVotes * 0.3); // Start with 30% of current votes
  
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    
    switch (trendType) {
      case 0: // Steady upward trend
        baseValue += Math.random() * 3 + 1;
        break;
      case 1: // Volatile growth
        baseValue += (Math.random() - 0.3) * 5 + 1;
        break;
      case 2: // Plateau then growth
        if (progress < 0.6) {
          baseValue += Math.random() * 1;
        } else {
          baseValue += Math.random() * 4 + 2;
        }
        break;
      case 3: // Steady moderate growth
        baseValue += Math.random() * 2 + 0.5;
        break;
    }
    
    trend.push(Math.floor(Math.max(1, baseValue)));
  }
  
  // Ensure the last value is close to current votes
  trend[trend.length - 1] = currentVotes;
  
  return trend;
};

// Helper: Check if candidate is a boundary proposal
const isBoundaryCandidate = (candidate) => {
  return candidate && candidate.type === 'boundary';
};

// Helper: Get boundary style based on status
const getBoundaryStyle = (candidate) => {
  if (!isBoundaryCandidate(candidate)) return null;
  
  // Default candidate (current boundary)
  if (candidate.isDefault) {
    return {
      color: '#00ff00',
      label: 'Current Boundary',
      icon: '🟢',
      borderStyle: 'solid',
      glowColor: 'rgba(0, 255, 0, 0.3)'
    };
  }
  
  // Proposal candidate
  return {
    color: '#ffff00',
    label: 'Proposed Boundary',
    icon: '🟡',
    borderStyle: 'dashed',
    glowColor: 'rgba(255, 255, 0, 0.3)'
  };
};

// Helper: Format location (string or object) for display
const formatLocation = (location) => {
  if (!location) return 'Location unknown';
  if (typeof location === 'string') return location;
  
  // Handle {lat, lng} format
  if (location.lat !== undefined && location.lng !== undefined) {
    return `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`;
  }
  
  // Handle {latitude, longitude} format
  if (location.latitude !== undefined && location.longitude !== undefined) {
    return `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
  }
  
  return 'Location unknown';
};

// Debug: Check if APIs are properly imported
console.log('🔍 [ChannelTopicRowPanel] API imports check:', {
  voteAPI: !!voteAPI,
  voteAPISubmitVoteAlt: typeof voteAPI?.submitVoteAlt,
  authoritativeVoteAPI: !!authoritativeVoteAPI,
  authoritativeVoteAPIGetTopicVoteTotals: typeof authoritativeVoteAPI?.getTopicVoteTotals
});

const ChannelTopicRowPanel = ({ panel, globeState, setGlobeState, layout, updatePanel, onVoteUpdate, isMinimized = false, onClose = () => {} }) => {
  
  const [voteCounts, setVoteCounts] = useState({});
  
  // Load user votes from localStorage on initialization
  const loadUserVotesFromStorage = () => {
    try {
      const stored = localStorage.getItem('relay_user_votes');
      console.log('🔍 [VotingPanel] Loading votes from localStorage:', stored);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('🔍 [VotingPanel] Parsed votes:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading user votes from localStorage:', error);
    }
    return {};
  };
  
  const [userVotes, setUserVotes] = useState(loadUserVotesFromStorage());
  const [isLoading, setIsLoading] = useState(false);
  const [authoritativeVoteTotals, setAuthoritativeVoteTotals] = useState(null);
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [recentlyVoted, setRecentlyVoted] = useState(null); // Track recently voted candidate
  const [isVoting, setIsVoting] = useState(false); // Track voting state
  const [notification, setNotification] = useState(null); // Track notification messages
  const [hoveredCandidate, setHoveredCandidate] = useState(null); // Track hovered candidate for tooltip
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 }); // Tooltip position
  const [containerWidth, setContainerWidth] = useState(0); // Track container width for responsive sizing
  const [boundaryPreviewModal, setBoundaryPreviewModal] = useState(null); // Track boundary preview modal state

  const selectedChannel = globeState?.selectedChannel;

  // Debug: Log selected channel data and user votes
  useEffect(() => {
    if (selectedChannel) {
      console.log('🎯 [ChannelTopicRowPanel] Selected channel data:', {
        channelId: selectedChannel.id,
        channelName: selectedChannel.name,
        candidatesCount: selectedChannel.candidates?.length,
        candidates: selectedChannel.candidates?.map(c => ({
          id: c.id,
          name: c.name,
          username: c.username
        }))
      });
      console.log('🔍 [ChannelTopicRowPanel] Current userVotes state:', userVotes);
      console.log('🔍 [ChannelTopicRowPanel] User vote for this channel:', userVotes[selectedChannel.id]);
    }
  }, [selectedChannel, userVotes]);

  // Load authoritative vote counts from single source of truth
  useEffect(() => {
    console.log('🔄 [ChannelTopicRowPanel] useEffect triggered - selectedChannel changed:', {
      channelId: selectedChannel?.id,
      channelName: selectedChannel?.name,
      hasCandidates: !!selectedChannel?.candidates,
      candidateCount: selectedChannel?.candidates?.length
    });
    
    if (!selectedChannel || !selectedChannel.candidates) {
      console.log('⚠️ [ChannelTopicRowPanel] Skipping vote load - no selectedChannel or candidates');
      return;
    }

    const loadAuthoritativeVoteCounts = async () => {
      setIsLoading(true);
      setVoteCountsLoaded(false);
      try {
        console.log('🎯 [ChannelTopicRowPanel] Loading authoritative vote counts for channel:', selectedChannel.id, selectedChannel.name);
        
        // Fetch authoritative vote totals for this channel
        const authoritativeTotals = await authoritativeVoteAPI.getTopicVoteTotals(selectedChannel.id);
        
        setAuthoritativeVoteTotals(authoritativeTotals);
        
        // Create voteCounts object for backward compatibility with existing UI code
        const newVoteCounts = {};
        
        // Debug: Show which candidates are missing from authoritative data
        const channelCandidateIds = selectedChannel.candidates.map(c => c.id);
        const authoritativeCandidateIds = Object.keys(authoritativeTotals.candidates || {});
        const missingFromAuth = channelCandidateIds.filter(id => !authoritativeCandidateIds.includes(id));
        const missingFromChannel = authoritativeCandidateIds.filter(id => !channelCandidateIds.includes(id));
        
        if (missingFromAuth.length > 0) {
          console.warn('⚠️ [ChannelTopicRowPanel] Candidates in channel but NOT in authoritative data:', missingFromAuth.length, missingFromAuth.slice(0, 3));
        }
        if (missingFromChannel.length > 0) {
          console.warn('⚠️ [ChannelTopicRowPanel] Candidates in authoritative data but NOT in channel:', missingFromChannel.length, missingFromChannel.slice(0, 3));
        }
        
        for (const candidate of selectedChannel.candidates) {
          const voteKey = `${selectedChannel.id}-${candidate.id}`;
          // Use authoritative count if available, otherwise fallback to candidate's existing votes
          const authoritativeCount = authoritativeTotals.candidates?.[candidate.id];
          const candidateVotes = candidate.votes || 0;
          const finalVoteCount = authoritativeCount !== undefined ? authoritativeCount : candidateVotes;
          
          newVoteCounts[voteKey] = finalVoteCount;
        }
        
        setVoteCounts(newVoteCounts);
        
        // Store vote counts in global state for header access
        if (setGlobeState) {
          const totalChannelVotes = Object.values(newVoteCounts).reduce((sum, count) => sum + count, 0);
          
          setGlobeState(prev => ({
            ...prev,
            voteCounts: {
              ...prev.voteCounts,
              ...newVoteCounts
            },
            // Store the total votes for this specific channel
            [`channelTotalVotes_${selectedChannel.id}`]: totalChannelVotes
          }));
        }
        
        const calculatedTotal = Object.values(newVoteCounts).reduce((sum, count) => sum + count, 0);
        console.log('✅ [ChannelTopicRowPanel] Vote counts loaded:', {
          channelId: selectedChannel.id,
          calculatedTotal,
          authoritativeTotal: authoritativeTotals.totalVotes,
          candidateCount: selectedChannel.candidates.length,
          authoritativeCandidateCount: Object.keys(authoritativeTotals.candidates || {}).length
        });
        
      } catch (error) {
        console.error('❌ [ChannelTopicRowPanel] Error loading authoritative vote counts:', error);
        
        // Fallback to candidate's existing votes (preserve static data)
        const fallbackVoteCounts = {};
      
        for (const candidate of selectedChannel.candidates) {
          const voteKey = `${selectedChannel.id}-${candidate.id}`;
        const candidateVotes = candidate.votes || 0;
        const fallbackVoteCount = candidateVotes;
        
        fallbackVoteCounts[voteKey] = fallbackVoteCount;
        }
      
        setVoteCounts(fallbackVoteCounts);
        
        // Store fallback counts in global state
        if (setGlobeState) {
          const totalChannelVotes = Object.values(fallbackVoteCounts).reduce((sum, count) => sum + count, 0);
          
          setGlobeState(prev => ({
            ...prev,
            voteCounts: {
              ...prev.voteCounts,
              ...fallbackVoteCounts
            },
            // Store the total votes for this specific channel
            [`channelTotalVotes_${selectedChannel.id}`]: totalChannelVotes
          }));
        }
        
        console.log('✅ [ChannelTopicRowPanel] Using fallback vote counts:', {
          totalVotes: Object.values(fallbackVoteCounts).reduce((sum, count) => sum + count, 0),
          candidateCount: selectedChannel.candidates.length
        });
      } finally {
        setIsLoading(false);
        setVoteCountsLoaded(true);
      }
    };

    loadAuthoritativeVoteCounts();
  }, [selectedChannel]); // setGlobeState removed - it's a stable function and shouldn't trigger re-loads

  // Function to refresh vote counts from authoritative source
  const refreshVoteCounts = async () => {
    if (!selectedChannel?.candidates) return;
    
    try {
      // Fetch fresh authoritative vote totals
      const freshAuthoritativeTotals = await authoritativeVoteAPI.getTopicVoteTotals(selectedChannel.id);
      setAuthoritativeVoteTotals(freshAuthoritativeTotals);
      
      // Update voteCounts for backward compatibility
      const newVoteCounts = {};
      for (const candidate of selectedChannel.candidates) {
        const candidateVoteKey = `${selectedChannel.id}-${candidate.id}`;
        const authoritativeCount = freshAuthoritativeTotals.candidates[candidate.id];
        newVoteCounts[candidateVoteKey] = authoritativeCount !== undefined ? authoritativeCount : (candidate.votes || 0);
      }
      
      setVoteCounts(newVoteCounts);
      console.log('🎯 [ChannelTopicRowPanel] Refreshed authoritative vote counts:', {
        channelId: selectedChannel.id,
        totalVotes: freshAuthoritativeTotals.totalVotes,
        candidateVotes: newVoteCounts
      });
      
      // Force re-render of the panel to show updated counts
      setGlobeState(prev => ({
        ...prev,
        voteCounts: {
          ...prev.voteCounts,
          ...newVoteCounts
        },
        channelsUpdated: Date.now()
      }));
      
    } catch (error) {
      console.error('❌ [ChannelTopicRowPanel] Error refreshing authoritative vote counts:', error);
    }
  };

  // Listen for vote submissions to refresh vote counts
  useEffect(() => {
    const handleVoteSubmitted = (event) => {
      const { channelId, candidateId, result } = event.detail;
      if (channelId === selectedChannel?.id) {
        console.log('🎯 Vote submitted event received, refreshing counts...');
        // Refresh vote counts after a short delay to allow backend processing
        setTimeout(() => {
          refreshVoteCounts();
        }, 500);
      }
    };

    // Listen for WebSocket vote updates
    const handleWebSocketVoteUpdate = (event) => {
      const { channelId, candidateId, voteCount } = event.detail;
      if (channelId === selectedChannel?.id) {
        console.log('📡 WebSocket vote update received:', { channelId, candidateId, voteCount });
        
        // Update vote counts immediately
        setVoteCounts(prev => ({
          ...prev,
          [`${channelId}-${candidateId}`]: voteCount
        }));
        
        // Force re-render
        setGlobeState(prev => ({
          ...prev,
          voteCounts: {
            ...prev.voteCounts,
            [`${channelId}-${candidateId}`]: voteCount
          },
          channelsUpdated: Date.now()
        }));
      }
    };

    window.addEventListener('voteSubmitted', handleVoteSubmitted);
    window.addEventListener('voteUpdate', handleWebSocketVoteUpdate);
    
    return () => {
      window.removeEventListener('voteSubmitted', handleVoteSubmitted);
      window.removeEventListener('voteUpdate', handleWebSocketVoteUpdate);
    };
  }, [selectedChannel, setGlobeState]);

  // Update arrow visibility for horizontal scrolling
  const updateArrowVisibility = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const isScrolledFromLeft = container.scrollLeft > 0;
    const contentWiderThanContainer = container.scrollWidth > container.clientWidth;
    const canScrollRight = container.scrollLeft < (container.scrollWidth - container.clientWidth - 1);
    const shouldShowRightArrow = canScrollRight || (contentWiderThanContainer && container.scrollLeft === 0);
    
    console.log('Arrow visibility update:', {
      scrollLeft: container.scrollLeft,
      scrollWidth: container.scrollWidth,
      clientWidth: container.clientWidth,
      isScrolledFromLeft,
      shouldShowRightArrow
    });
    
    setShowLeftArrow(isScrolledFromLeft);
    setShowRightArrow(shouldShowRightArrow);
  };

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    // Calculate scroll amount to move exactly one candidate card
    const cardWidth = calculateCardWidth();
    const gap = 8; // Gap between cards
    const scrollAmount = cardWidth + gap; // One card width plus gap
    
    const newScrollPosition = direction === 'left' 
      ? Math.max(0, container.scrollLeft - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, container.scrollLeft + scrollAmount);
    
    console.log('Scrolling one candidate:', {
      direction,
      cardWidth,
      gap,
      scrollAmount,
      currentScroll: container.scrollLeft,
      newScroll: newScrollPosition
    });
    
    container.scrollTo({
      left: newScrollPosition,
      behavior: 'smooth'
    });
    
    // Update arrow visibility after scroll animation
    setTimeout(updateArrowVisibility, 300);
  };

  useEffect(() => {
    // Update arrow visibility when candidates change
    const timer = setTimeout(() => {
      updateArrowVisibility();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [selectedChannel?.candidates]);

  useEffect(() => {
    const handleResize = () => {
      updateArrowVisibility();
    };
    window.addEventListener('resize', handleResize);
    
    // Add resize observer for the container
    if (scrollContainerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width } = entry.contentRect;
          setContainerWidth(width); // Track width for dynamic card sizing
          
          updateArrowVisibility();
          
          // Force re-render to ensure flex layout updates
          setGlobeState(prev => ({
            ...prev,
            panelResized: Date.now()
          }));
        }
      });
      resizeObserver.observe(scrollContainerRef.current);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        resizeObserver.disconnect();
      };
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, [setGlobeState]);

  // Calculate dynamic card width based on container width
  const calculateCardWidth = () => {
    if (!containerWidth || !selectedChannel?.candidates?.length) return 250;
    
    const availableWidth = containerWidth - 32; // Subtract padding
    const numCandidates = selectedChannel.candidates.length;
    const minCardWidth = 280; // Increased minimum width to force scrolling
    const maxCardWidth = 400;
    const gaps = (numCandidates - 1) * 8; // 8px gap between cards
    
    // Calculate ideal width but enforce minimum
    const idealWidth = (availableWidth - gaps) / numCandidates;
    
    // Constrain within min/max bounds - prioritize minimum width over fitting all cards
    const finalWidth = Math.max(minCardWidth, Math.min(maxCardWidth, idealWidth));
    
    return finalWidth;
  };
      
  // Force initial layout update
  useEffect(() => {
    if (scrollContainerRef.current && selectedChannel) {
      setTimeout(() => {
        setGlobeState(prev => ({
          ...prev,
          panelResized: Date.now()
        }));
      }, 100);
    }
  }, [selectedChannel, setGlobeState]);

  // Handle boundary preview on globe
  const handleBoundaryPreview = (candidate) => {
    if (!isBoundaryCandidate(candidate)) return;
    
    console.log('🗺️ Preview boundary on globe:', candidate);
    
    // Dispatch event to globe to render preview boundary
    window.dispatchEvent(new CustomEvent('previewBoundary', {
      detail: {
        boundaryData: candidate.boundaryData,
        candidateName: candidate.name,
        isDefault: candidate.isDefault,
        style: candidate.style || getBoundaryStyle(candidate)
      }
    }));
    
    // Show modal with boundary details
    setBoundaryPreviewModal({
      candidate,
      boundaryData: candidate.boundaryData
    });
  };

  // Handle compare with current boundary
  const handleCompareBoundary = (proposalCandidate) => {
    if (!isBoundaryCandidate(proposalCandidate) || proposalCandidate.isDefault) return;
    
    // Find the current (default) boundary candidate in the same channel
    const currentBoundary = selectedChannel.candidates.find(c => 
      isBoundaryCandidate(c) && c.isDefault
    );
    
    if (!currentBoundary) {
      console.warn('No current boundary found for comparison');
      return;
    }
    
    console.log('🗺️ Compare boundaries:', {
      current: currentBoundary,
      proposal: proposalCandidate
    });
    
    // Dispatch event to globe to show both boundaries
    window.dispatchEvent(new CustomEvent('compareBoundaries', {
      detail: {
        currentBoundary: {
          boundaryData: currentBoundary.boundaryData,
          name: currentBoundary.name,
          style: { color: '#00ff00', dashed: false }
        },
        proposalBoundary: {
          boundaryData: proposalCandidate.boundaryData,
          name: proposalCandidate.name,
          style: { color: '#ffff00', dashed: true }
        }
      }
    }));
    
    setNotification('Comparing boundaries on globe...');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleVote = async (candidateId) => {
    if (!selectedChannel || isVoting) {
      console.log('Vote blocked:', { selectedChannel: !!selectedChannel, isVoting });
      return;
    }

    const voteKey = `${selectedChannel.id}-${candidateId}`;
    const currentUserVote = userVotes[selectedChannel.id];
    
    console.log('ChannelTopicRowPanel handleVote called:', { 
      channelId: selectedChannel.id, 
      candidateId, 
      voteKey,
      currentUserVote,
      isVotingForSame: currentUserVote === candidateId
    });

    // If already voted for this candidate, don't allow voting again
    if (currentUserVote === candidateId) {
      console.log('Already voted for this candidate, ignoring vote');
      setNotification('You have already voted for this candidate');
      setTimeout(() => setNotification(null), 2000);
      return;
    }

    // Set voting state to prevent multiple clicks
    setIsVoting(true);
    setRecentlyVoted(candidateId);
    setNotification('Submitting vote...');

    try {
      // Submit vote - backend handles vote switching automatically
      const voteData = {
        topic: selectedChannel.id,
        choice: candidateId,
        voteType: 'candidate',
        signature: 'demo-signature',
        publicKey: 'demo-user-1',
        nonce: Math.random().toString(36).substring(2, 15),
        timestamp: Date.now(),
        signatureScheme: 'ecdsa'
      };

      console.log('🎯 Submitting vote to blockchain:', voteData);
      console.log('🔍 Channel ID being used:', selectedChannel.id);
      console.log('🔍 Candidate ID being used:', candidateId);
      
      // Try the vote submission with better error handling
      let voteResult;
      try {
        voteResult = await voteAPI.submitVoteAlt(voteData);
        console.log('✅ Vote submission successful:', voteResult);
      } catch (voteError) {
        console.error('❌ Vote submission failed:', voteError);
        throw new Error(`Vote submission failed: ${voteError.message || voteError}`);
      }
      
      // Update user vote state immediately after successful submission
      console.log('🎯 [handleVote] Updating user vote state for channel:', selectedChannel.id, 'candidate:', candidateId);
      setUserVotes(prev => {
        const updated = { ...prev, [selectedChannel.id]: candidateId };
        console.log('🎯 [handleVote] Updated user votes:', updated);
        // Persist to localStorage
        try {
          localStorage.setItem('relay_user_votes', JSON.stringify(updated));
        } catch (error) {
          console.error('Error saving user votes to localStorage:', error);
        }
        return updated;
      });
      
      // Refresh vote counts from backend to get accurate totals
      console.log('🔄 Refreshing vote counts after successful vote submission...');
      
      // Get fresh vote data directly with error handling
      let freshAuthoritativeTotals;
      try {
        freshAuthoritativeTotals = await authoritativeVoteAPI.getTopicVoteTotals(selectedChannel.id);
        console.log('✅ Fresh authoritative totals fetched:', freshAuthoritativeTotals);
      } catch (refreshError) {
        console.error('❌ Failed to fetch fresh vote totals:', refreshError);
        // Use optimistic update if we can't get fresh data
        const optimisticCounts = { ...voteCounts };
        optimisticCounts[voteKey] = (optimisticCounts[voteKey] || 0) + 1;
        setVoteCounts(optimisticCounts);
        setNotification('✅ Vote cast (pending verification)');
        setTimeout(() => {
          setRecentlyVoted(null);
          setIsVoting(false);
          setNotification(null);
        }, 2000);
        return;
      }
      
      const freshVoteCounts = {};
      for (const candidate of selectedChannel.candidates) {
        const candidateVoteKey = `${selectedChannel.id}-${candidate.id}`;
        const authoritativeCount = freshAuthoritativeTotals.candidates[candidate.id];
        freshVoteCounts[candidateVoteKey] = authoritativeCount !== undefined ? authoritativeCount : (candidate.votes || 0);
      }
      
      console.log('🎯 Fresh vote counts calculated:', freshVoteCounts);
      
      // Update local state immediately
      setVoteCounts(freshVoteCounts);
      
      // Update global state with fresh vote counts
      if (setGlobeState) {
        const totalChannelVotes = Object.values(freshVoteCounts).reduce((sum, count) => sum + count, 0);
        console.log('🎯 [DEBUG] Updating global state with total channel votes:', totalChannelVotes);
        
        setGlobeState(prevState => ({
          ...prevState,
          voteCounts: {
            ...prevState.voteCounts,
            ...freshVoteCounts
          },
          channelsUpdated: Date.now(),
          // Force a complete re-render
          forceUpdate: Date.now(),
          // Store the total votes for this specific channel
          [`channelTotalVotes_${selectedChannel.id}`]: totalChannelVotes
        }));
        
        console.log('🎯 [DEBUG] Updated global state with fresh vote counts:', {
          channelId: selectedChannel.id,
          freshVoteCounts,
          totalVotes: totalChannelVotes,
          freshVoteCountsKeys: Object.keys(freshVoteCounts)
        });
      }

      // Call onVoteUpdate with comprehensive data
      if (onVoteUpdate) {
        const totalChannelVotes = Object.values(freshVoteCounts).reduce((sum, count) => sum + count, 0);
        console.log('🎯 [DEBUG] Calling onVoteUpdate with:', {
          channelId: selectedChannel.id,
          candidateId,
          freshVoteCounts,
          totalChannelVotes,
          onVoteUpdateType: typeof onVoteUpdate,
          individualCandidateVotes: Object.entries(freshVoteCounts).map(([key, count]) => ({ key, count }))
        });
        
        // Call the callback which should refresh the globe
        try {
          await onVoteUpdate({
            channelId: selectedChannel.id,
            candidateId,
            voteCounts: freshVoteCounts,
            totalVotes: totalChannelVotes,
            // Add detailed vote breakdown for debugging
            voteBreakdown: freshVoteCounts
          });
          console.log('✅ onVoteUpdate call completed successfully');
        } catch (updateError) {
          console.error('❌ Error in onVoteUpdate callback:', updateError);
        }
        
        // Also dispatch a custom event as backup
        window.dispatchEvent(new CustomEvent('channelVotesUpdated', {
          detail: {
            channelId: selectedChannel.id,
            candidateId,
            voteCounts: freshVoteCounts,
            totalVotes: totalChannelVotes,
            voteBreakdown: freshVoteCounts
          }
        }));
        
      } else {
        console.log('🎯 [DEBUG] onVoteUpdate is not provided or null');
      }

      const candidate = selectedChannel.candidates.find(c => c.id === candidateId);
      setNotification(`✅ Vote cast for ${candidate?.username || candidateId}!`);
      
      setTimeout(() => {
        setRecentlyVoted(null);
        setIsVoting(false);
        setNotification(null);
      }, 2000);

    } catch (error) {
      console.error('Error voting:', error);
      
      // Revert user vote state since submission failed
      setUserVotes(prev => {
        const reverted = { ...prev, [selectedChannel.id]: currentUserVote };
        // Persist to localStorage
        try {
          localStorage.setItem('relay_user_votes', JSON.stringify(reverted));
        } catch (error) {
          console.error('Error saving user votes to localStorage:', error);
        }
        return reverted;
      });
      
      setNotification('❌ Vote failed. Please try again.');
      setTimeout(() => setNotification(null), 3000);
      setIsVoting(false);
      setRecentlyVoted(null);
    }
  };

  // Sort candidates by vote count (highest first)
  const sortedCandidates = selectedChannel?.candidates 
    ? [...selectedChannel.candidates].sort((a, b) => {
        const voteKeyA = `${selectedChannel.id}-${a.id}`;
        const voteKeyB = `${selectedChannel.id}-${b.id}`;
        const votesA = voteCounts[voteKeyA] || a.votes || 0;
        const votesB = voteCounts[voteKeyB] || b.votes || 0;
        return votesB - votesA;
      })
    : [];

  // Calculate total votes for display
  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  React.useEffect(() => {
    if (selectedChannel && totalVotes > 0) {
      console.log('🔢 [ChannelTopicRowPanel] Channel vote summary:', {
        channelId: selectedChannel.id,
        authoritativeTotal: authoritativeVoteTotals?.totalVotes,
        displayedTotal: totalVotes,
        isAuthoritative: !!(authoritativeVoteTotals && !authoritativeVoteTotals.error),
        candidateBreakdown: sortedCandidates.map(candidate => ({
          id: candidate.id,
          username: candidate.username,
          votes: voteCounts[`${selectedChannel.id}-${candidate.id}`] || candidate.votes || 0
        }))
      });
    }
  }, [totalVotes, selectedChannel, sortedCandidates, voteCounts]);

  const [isInitializing, setIsInitializing] = useState(true);
  const [voteCountsLoaded, setVoteCountsLoaded] = useState(false);

  // Track if we've ever had a selected channel to prevent premature unmounting
  const hasHadChannel = useRef(false);
  useEffect(() => {
    if (selectedChannel) {
      hasHadChannel.current = true;
      setIsInitializing(false);
    }
  }, [selectedChannel]);

  // Only show "No Channel Selected" if we've never had a channel or after a delay
  const shouldShowNoChannel = !selectedChannel && (!hasHadChannel.current || !isInitializing);
  
  if (shouldShowNoChannel) {
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

  // Minimized view - show compact vote buttons
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
          const candidateId = candidate.id || `candidate-${index}`;
          const voteKey = `${selectedChannel.id}-${candidateId}`;
          const voteCount = voteCounts[voteKey] || 0;
          const isVoted = userVotes[selectedChannel.id] === candidateId;
          
          // Debug: Log vote checking
          if (index === 0) {
            console.log('🔍 [VotingPanel Render] Vote check:', {
              selectedChannelId: selectedChannel.id,
              candidateId,
              userVotesForChannel: userVotes[selectedChannel.id],
              isVoted,
              allUserVotes: userVotes
            });
          }
          
          const isCurrentlyVoting = isVoting && recentlyVoted === candidateId;
          const position = index + 1;

          return (
            <div key={candidateId} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              background: isVoted ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)' : 
                          position === 1 ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)' :
                          position === 2 ? 'linear-gradient(135deg, rgba(156, 163, 175, 0.15) 0%, rgba(107, 114, 128, 0.1) 100%)' :
                          position === 3 ? 'linear-gradient(135deg, rgba(205, 127, 50, 0.15) 0%, rgba(180, 83, 9, 0.1) 100%)' :
                          'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.8) 100%)',
              borderRadius: '8px',
              padding: '4px 8px',
              border: isVoted ? '1px solid rgba(99, 102, 241, 0.4)' : 
                      position === 1 ? '1px solid rgba(251, 191, 36, 0.4)' :
                      position === 2 ? '1px solid rgba(156, 163, 175, 0.4)' :
                      position === 3 ? '1px solid rgba(205, 127, 50, 0.4)' :
                      '1px solid rgba(75, 85, 99, 0.3)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}>
              <div style={{ 
                fontSize: '10px', 
                color: position === 1 ? '#fbbf24' : position === 2 ? '#9ca3af' : position === 3 ? '#cd7f32' : '#6366f1',
                fontWeight: '700',
                minWidth: '14px'
              }}>
                {position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '#' + position}
              </div>
              <button
                onClick={() => handleVote(candidateId)}
                disabled={isVoted || isVoting}
                style={{
                  background: isVoted ? '#3b82f6' : 
                            isCurrentlyVoting ? '#10b981' : 
                            'rgba(59, 130, 246, 0.2)',
                  border: `1px solid ${isVoted ? '#3b82f6' : 
                                     isCurrentlyVoting ? '#10b981' : 
                                     '#3b82f6'}`,
                  color: isVoted || isCurrentlyVoting ? '#fff' : '#3b82f6',
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
                  justifyContent: 'center',
                  opacity: isVoting && !isCurrentlyVoting ? 0.5 : 1
                }}
              >
                <Vote size={7} />
                {voteCount}
              </button>
              <div style={{ 
                fontSize: '8px', 
                color: '#6b7280',
                maxWidth: '40px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {(candidate.username || candidate.name || `user${candidate.id}`).substring(0, 8)}
              </div>
            </div>
          );
        })}
        {sortedCandidates.length > 4 && (
          <div style={{ 
            fontSize: '9px', 
            color: '#6b7280',
            background: 'rgba(107, 114, 128, 0.1)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            +{sortedCandidates.length - 4}
          </div>
        )}
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
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        /* Custom scrollbar styles for description boxes */
        .candidate-description::-webkit-scrollbar {
          width: 8px; /* Wider scrollbar for better visibility */
        }
        
        .candidate-description::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1); /* More visible track */
          border-radius: 4px;
        }
        
        .candidate-description::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.4); /* More visible thumb */
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .candidate-description::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.6); /* Even more visible on hover */
        }
        
        /* Custom scrollbar for main container */
        .candidates-container::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        
        .candidates-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          margin-right: 15px; /* Prevent overlap with resize handle */
          margin-bottom: 15px; /* Prevent overlap with resize handle */
        }
        
        .candidates-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        
        .candidates-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        /* Style both horizontal and vertical scrollbar corners */
        .candidates-container::-webkit-scrollbar-corner {
          background: rgba(255, 255, 255, 0.05);
          margin-right: 15px; /* Prevent corner overlap */
          margin-bottom: 15px; /* Prevent corner overlap */
        }
        
        /* Ensure scrollbars don't interfere with panel resize */
        .candidates-container {
          scrollbar-gutter: stable;
        }
      `}</style>

      {/* Fixed arrow buttons positioned relative to wrapper */}
      {/* Left Scroll Arrow */}
      {showLeftArrow && (
        <button 
          onClick={() => handleScroll('left')}
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
          onClick={() => handleScroll('right')}
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

      {/* Scrolling container */}
      <div style={{
        background: 'transparent', // Make background transparent to avoid extra visual layer
        height: '100%',
        minHeight: '100%',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'row',
        gap: 8,
        padding: '8px',
        paddingBottom: '20px', // Extra padding at bottom to avoid resize handle overlap
        paddingRight: '20px', // Extra padding at right to avoid resize handle overlap
        overflowX: 'auto',
        overflowY: 'auto', // Enable vertical scrolling when content exceeds height
        borderRadius: '0',
        border: 'none',
        position: 'relative',
        boxSizing: 'border-box',
        alignItems: 'stretch',
        scrollbarWidth: 'thin',
        scrollbarColor: '#666666 rgba(255, 255, 255, 0.05)',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth'
      }}
      ref={scrollContainerRef}
      className="candidates-container"
      onScroll={updateArrowVisibility}
      >
      {/* Candidate Cards - Direct children of main panel */}
      {voteCountsLoaded && sortedCandidates.map((candidate, index) => {
            const position = index + 1;
            const candidateId = candidate.id || `candidate-${index}`;
            const voteCount = voteCounts[`${selectedChannel.id}-${candidateId}`] || 0;
            const isVoted = userVotes[selectedChannel.id] === candidateId;
            const isCurrentlyVoting = isVoting && recentlyVoted === candidateId;
            const dynamicWidth = calculateCardWidth();
            
            // Check if this is a boundary candidate
            const isBoundary = isBoundaryCandidate(candidate);
            const boundaryStyle = isBoundary ? getBoundaryStyle(candidate) : null;

            return (
              <div
                key={`${candidate.id || `candidate-${index}`}-${index}`}
                data-candidate-card="true"
                style={{
                  width: `${dynamicWidth}px`,
                  minWidth: '280px',
                  maxWidth: '400px',
                  flex: `0 0 ${dynamicWidth}px`,
                  height: '100%', // Use full height of container
                  minHeight: '100%',
                  background: isBoundary 
                    ? (boundaryStyle.isDefault ? 'rgba(0, 255, 0, 0.05)' : 'rgba(255, 255, 0, 0.05)')
                    : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                  padding: 8,
                  border: isVoted 
                    ? '2px solid #00ff00' 
                    : isCurrentlyVoting 
                      ? '2px solid #ff6b35' 
                      : isBoundary 
                        ? `2px ${boundaryStyle.borderStyle} ${boundaryStyle.color}`
                        : '2px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transform: isVoted ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isVoted 
                    ? '0 8px 25px rgba(0, 255, 0, 0.3)' 
                    : isBoundary 
                      ? `0 4px 15px ${boundaryStyle.glowColor}`
                      : '0 4px 15px rgba(0, 0, 0, 0.2)',
                  backdropFilter: 'blur(10px)',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = isVoted ? 'scale(1.02)' : 'scale(1.02)';
                  e.currentTarget.style.boxShadow = isVoted ? '0 8px 25px rgba(0, 255, 0, 0.3)' : '0 8px 25px rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = isVoted ? 'scale(1.02)' : 'scale(1)';
                  e.currentTarget.style.boxShadow = isVoted ? '0 8px 25px rgba(0, 255, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.2)';
                }}
                onClick={() => {
                  console.log('Candidate clicked:', candidate);
                }}
              >
                {/* Vote Status Indicator */}
                {isVoted && (
                  <div style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    background: '#10b981',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 'bold',
                    zIndex: 10,
                    animation: 'pulse 2s infinite'
                  }}>
                    ✓
                  </div>
                )}
                
                {/* Candidate Info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                  flexShrink: 0,
                  minHeight: '40px'
                }}>
                  {isBoundary ? (
                    // Boundary Candidate Header
                    <>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#ffffff'
                      }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: `${boundaryStyle.color}33`,
                          border: `2px solid ${boundaryStyle.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16
                        }}>
                          <Map size={18} color={boundaryStyle.color} />
                        </div>
                        <span style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '140px'
                        }}>
                          {candidate.username}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: boundaryStyle.color,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: `${boundaryStyle.color}22`,
                        border: `1px solid ${boundaryStyle.color}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {boundaryStyle.icon} {boundaryStyle.label}
                      </div>
                    </>
                  ) : (
                    // Regular Candidate Header
                    <>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#ffffff'
                      }}>
                        <span style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '120px'
                        }}>
                          @{candidate.username}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Full name: ${candidate.username}`);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontSize: 12,
                            padding: 2
                          }}
                        >
                          ℹ️
                        </button>
                      </div>
                      <span style={{
                        fontSize: 10,
                        color: '#999999'
                      }}>
                        #{position}
                      </span>
                    </>
                  )}
                </div>

                {/* Location/Details Section */}
                {isBoundary ? (
                  // Boundary Details
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    marginBottom: 8,
                    fontSize: 11,
                    color: '#cccccc',
                    flexShrink: 0
                  }}>
                    {candidate.direction && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} />
                        <span>Direction: {candidate.direction}</span>
                      </div>
                    )}
                    {candidate.adjacentRegions && candidate.adjacentRegions.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Layers size={12} />
                        <span>Adjacent: {candidate.adjacentRegions.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular Candidate Location
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    marginBottom: 8,
                    fontSize: 11,
                    color: '#999999',
                    flexShrink: 0
                  }}>
                    <span>
                      📍 {formatLocation(candidate.location)}
                    </span>
                  </div>
                )}

                {/* Proximity and Region Tags */}
                <div style={{
                  display: 'flex',
                  gap: 4,
                  marginBottom: 6,
                  flexShrink: 0,
                  minHeight: '24px'
                }}>
                  <span style={{
                    background: 'rgba(0, 255, 0, 0.2)',
                    color: '#00ff00',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 500
                  }}>
                    {candidate.province}
                  </span>
                  <span style={{
                    background: 'rgba(255, 107, 53, 0.2)',
                    color: '#ff6b35',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 500
                  }}>
                    {candidate.type}
                  </span>
                </div>

                {/* Description */}
                <div className="candidate-description" style={{
                  fontSize: 11,
                  lineHeight: 1.3,
                  color: '#cccccc',
                  marginBottom: 6,
                  flex: '1 1 auto', // Allow this to grow and fill available space
                  minHeight: '60px',
                  // Remove maxHeight to allow growth, scrollbar will appear when content overflows
                  overflowY: 'scroll', // Always show scrollbar for consistency
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#666666 rgba(255, 255, 255, 0.1)',
                  paddingRight: '8px', // More space for scrollbar
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  padding: '6px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  boxSizing: 'border-box',
                  wordWrap: 'break-word'
                }}>
                  {candidate.description || 'A passionate advocate for transparent, inclusive, and effective governance. This candidate brings years of experience and is dedicated to building bridges between different perspectives. They believe in the power of community engagement and work tirelessly to ensure every voice is heard in the democratic process. With a track record of successful initiatives and a vision for sustainable progress, this candidate represents hope for positive change in our community.'}
                </div>

                {/* Boundary Action Buttons (for boundary candidates only) */}
                {isBoundary && (
                  <div style={{
                    display: 'flex',
                    gap: 6,
                    marginBottom: 8,
                    flexShrink: 0
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBoundaryPreview(candidate);
                      }}
                      style={{
                        flex: 1,
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.5)',
                        color: '#3b82f6',
                        borderRadius: 6,
                        padding: '8px 12px',
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Eye size={14} />
                      Preview on Globe
                    </button>
                    
                    {!candidate.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompareBoundary(candidate);
                        }}
                        style={{
                          flex: 1,
                          background: 'rgba(168, 85, 247, 0.2)',
                          border: '1px solid rgba(168, 85, 247, 0.5)',
                          color: '#a855f7',
                          borderRadius: 6,
                          padding: '8px 12px',
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Layers size={14} />
                        Compare with Current
                      </button>
                    )}
                  </div>
                )}

                {/* Vote Stats and Button Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 'auto',
                  minHeight: '60px',
                  flexShrink: 0,
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  zIndex: 10
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: '#cccccc',
                    flex: 1
                  }}>
                    <span>#{position}</span>
                    <span>•</span>
                    <span>{voteCount.toLocaleString()} votes</span>
                    <span>•</span>
                    <span>{totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : '0.0'}%</span>
                    
                    {/* Sparkline Chart */}
                    <div style={{
                      marginLeft: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: 0.8
                    }}>
                      <SparklineChart 
                        data={generateMockVoteTrend(candidate.id, voteCount)}
                        width={50}
                        height={16}
                        color={isVoted ? '#00ff00' : '#ffffff'}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleVote(candidateId)}
                    disabled={isVoted || isVoting}
                    style={{
                      background: isVoted ? '#00ff00' : isCurrentlyVoting ? '#ff6b35' : 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: (isVoted || isVoting) ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      opacity: isVoting && !isCurrentlyVoting ? 0.5 : 1
                    }}
                  >
                    {isVoted ? '✓ Voted' : isCurrentlyVoting ? 'Voting...' : 'Vote'}
                  </button>
                </div>
              </div>
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
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          animation: 'fadeInOut 3s ease-in-out'
        }}>
          {notification}
        </div>
      )}
    </div>
  );
};

export default ChannelTopicRowPanel; 