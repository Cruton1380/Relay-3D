/**
 * Voting Logic Hook
 * Handles: Vote submission, state updates, error handling
 */
import { useState, useCallback } from 'react';
import { voteAPI } from '../services/apiClient';
import authoritativeVoteAPI from '../../../services/authoritativeVoteAPI.js';

export const useVoting = (selectedChannel, setGlobeState, onVoteUpdate) => {
  const [userVotes, setUserVotes] = useState({});
  const [isVoting, setIsVoting] = useState(false);
  const [recentlyVoted, setRecentlyVoted] = useState(null);
  const [notification, setNotification] = useState(null);

  const handleVote = useCallback(async (candidateId) => {
    if (!selectedChannel || isVoting) {
      console.log('Vote blocked:', { selectedChannel: !!selectedChannel, isVoting });
      return;
    }

    const currentUserVote = userVotes[selectedChannel.id];
    
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
      // Submit vote
      // Use demo endpoint for voting (doesn't require signature verification)
      const voteData = {
        channelId: selectedChannel.id,
        candidateId: candidateId,
        userId: 'demo-user-1',
        action: 'vote'
      };

      console.log('🎯 Submitting vote to demo endpoint:', voteData);
      
      // Call the demo vote endpoint
      const response = await fetch('http://localhost:3002/api/vote/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vote failed: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Vote result:', result);
      
      // Update user vote state - this controls the green "Voted" indicator
      setUserVotes(prev => {
        const updated = { ...prev, [selectedChannel.id]: candidateId };
        console.log('🗳️ Updated userVotes:', { 
          previous: prev[selectedChannel.id], 
          new: candidateId,
          channelId: selectedChannel.id,
          allVotes: updated
        });
        return updated;
      });
      
      // FIXED: Use the newCount from the vote response directly
      // The vote endpoint returns the TOTAL blockchain vote count for that candidate
      
      // Update the vote count for the voted candidate using the response
      const votedCandidateKey = `${selectedChannel.id}-${candidateId}`;
      
      console.log(`🎯 Vote submitted for ${candidateId}, newCount from server: ${result.newCount}`);
      
      // Handle vote switching - if user changed their vote, decrease previous candidate's count
      if (result.switched && result.previousCandidate) {
        console.log(`🔄 Vote switched from ${result.previousCandidate} to ${candidateId}`);
      }
      
      // CRITICAL: Merge with existing vote counts, don't replace them!
      // Update global state - MERGE the voted candidate's new count with existing counts
      let updatedVoteCounts = {};
      let previousCandidateCount = 0;
      
      if (setGlobeState) {
        setGlobeState(prev => {
          updatedVoteCounts = {
            ...prev.voteCounts,  // Keep ALL existing vote counts
            [votedCandidateKey]: result.newCount || 0  // Update the voted candidate
          };
          
          // If vote was switched, update the previous candidate's count too
          if (result.switched && result.previousCandidate) {
            // ✅ FIXED: Backend returns full key (channelId-candidateId), use it directly
            const previousCandidateKey = result.previousCandidate;
            const currentPreviousCount = prev.voteCounts[previousCandidateKey] || 0;
            // Decrease by 1 (vote was removed from previous candidate)
            previousCandidateCount = Math.max(0, currentPreviousCount - 1);
            updatedVoteCounts[previousCandidateKey] = previousCandidateCount;
            console.log(`🔄 Updated previous candidate ${previousCandidateKey}: ${currentPreviousCount} → ${previousCandidateCount}`);
          }
          
          console.log(`🎯 Updated voteCounts (merged):`, updatedVoteCounts);
          
          return {
            ...prev,
            voteCounts: updatedVoteCounts,
            channelsUpdated: Date.now()
          };
        });
      }
      
      // Call onVoteUpdate with updated counts (includes previous candidate if vote was switched)
      if (onVoteUpdate) {
        const voteCountsForCallback = {
          [votedCandidateKey]: result.newCount || 0  // The voted candidate
        };
        
        // If vote was switched, also include the previous candidate's updated count
        if (result.switched && result.previousCandidate) {
          // ✅ FIXED: Backend returns full key (channelId-candidateId), use it directly
          const previousCandidateKey = result.previousCandidate;
          voteCountsForCallback[previousCandidateKey] = previousCandidateCount;
        }
        
        onVoteUpdate({
          channelId: selectedChannel.id,
          candidateId,
          voteCounts: voteCountsForCallback,  // Includes both voted and previous candidate if switched
          totalVotes: result.newCount || 0,
          switched: result.switched || false,
          previousCandidate: result.previousCandidate || null
        });
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
      setUserVotes(prev => ({ ...prev, [selectedChannel.id]: currentUserVote }));
      
      setNotification('❌ Vote failed. Please try again.');
      setTimeout(() => setNotification(null), 3000);
      setIsVoting(false);
      setRecentlyVoted(null);
    }
  }, [selectedChannel, userVotes, isVoting, setGlobeState, onVoteUpdate]);

  return {
    userVotes,
    isVoting,
    recentlyVoted,
    notification,
    handleVote
  };
};