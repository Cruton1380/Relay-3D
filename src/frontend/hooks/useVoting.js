/**
 * Voting Hook
 * Manages voting state and operations with full backend integration
 * Includes signature verification, blockchain integration, and replay prevention
 */
import { useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from './useAuth.jsx';
import websocketService from '../services/websocketService';
import voteService from '../services/voteService.js';
import { signMessage } from '../utils/cryptography';
import { verifyVoteEligibility } from '../utils/voteVerification';
import { VOTE_RATE_LIMIT_MS } from '../config/constants';

export function useVoting() {
  const { isAuthenticated, authLevel, user, wallet } = useAuth();
  const [votes, setVotes] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingResults, setVotingResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastVoteTimestamp, setLastVoteTimestamp] = useState(0);
  
  // Initialize websocket listeners for real-time vote updates and blockchain confirmations
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const handleVoteUpdate = (data) => {
      if (data.topic) {
        setVotingResults(prev => ({
          ...prev,
          [data.topic]: {
            ...data.results,
            blockchainConfirmation: data.blockchainTxHash,
            hashgraphConsensus: data.consensusTimestamp
          }
        }));
      }
    };

    const handleBlockchainConfirmation = (data) => {
      if (data.topic && data.blockchainTxHash) {
        setVotingResults(prev => ({
          ...prev,
          [data.topic]: {
            ...prev[data.topic],
            blockchainConfirmation: data.blockchainTxHash,
            confirmationBlock: data.blockNumber
          }
        }));
      }
    };
    
    if (websocketService && websocketService.on) {
      websocketService.on('vote:update', handleVoteUpdate);
      websocketService.on('vote:blockchain-confirmation', handleBlockchainConfirmation);
      websocketService.on('vote:hashgraph-consensus', handleVoteUpdate);
      websocketService.on('vote-error', (error) => {
        setError(error.message || 'Vote operation failed');
      });
    }
    
    return () => {
      if (websocketService && websocketService.off) {
        websocketService.off('vote:update', handleVoteUpdate);
        websocketService.off('vote:blockchain-confirmation', handleBlockchainConfirmation);
        websocketService.off('vote:hashgraph-consensus', handleVoteUpdate);
        websocketService.off('vote-error');
      }
    };
  }, [isAuthenticated]);
  
  // Submit a vote with signature verification and blockchain integration
  const submitVote = useCallback(async (topic, candidate, reliability = 1.0) => {
    if (!isAuthenticated) {
      setError('You must be logged in to vote');
      return { success: false, error: 'Authentication required' };
    }
    
    if (authLevel !== 'elevated') {
      setError('You need elevated permissions to vote');
      return { success: false, error: 'Insufficient permissions' };
    }

    // Rate limiting check
    const now = Date.now();
    if (now - lastVoteTimestamp < VOTE_RATE_LIMIT_MS) {
      setError('Please wait before submitting another vote');
      return { success: false, error: 'Rate limit exceeded' };
    }
    
    // Check if already voted on this topic (replay prevention)
    if (votes[topic]) {
      setError('You have already voted on this topic');
      return { success: false, error: 'Already voted' };
    }

    // Verify vote eligibility through backend
    const eligibilityCheck = await verifyVoteEligibility(topic, user.id);
    if (!eligibilityCheck.eligible) {
      setError(eligibilityCheck.reason || 'Not eligible to vote on this topic');
      return { success: false, error: 'Not eligible' };
    }
    
    try {
      setIsSubmitting(true);
      setError(null);

      // Create vote payload
      const votePayload = {
        topic,
        candidate,
        reliability,
        timestamp: now,
        userId: user.id,
        nonce: Math.random().toString(36).substring(7)
      };

      // Sign the vote with user's wallet
      const signature = await signMessage(JSON.stringify(votePayload), wallet.privateKey);
      
      // Submit vote with signature for verification
      const response = await voteService.submitVote({
        ...votePayload,
        signature
      });
      
      // Update local state only if successful and confirmed by blockchain
      if (response.success && response.data.blockchainTxHash) {
        setVotes(prev => ({
          ...prev,
          [topic]: {
            candidate,
            timestamp: now,
            reliability,
            signature,
            blockchainTxHash: response.data.blockchainTxHash,
            consensusTimestamp: response.data.consensusTimestamp
          }
        }));
        
        setVotingResults(prev => ({
          ...prev,
          [topic]: response.data.results
        }));

        setLastVoteTimestamp(now);
      } else {
        setError(response.error || 'Vote submission failed');
      }
      
      return response;
    } catch (error) {
      console.error('Vote submission failed:', error);
      setError(error.message || 'Vote submission failed');
      return { success: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, authLevel, votes, wallet, user, lastVoteTimestamp]);
  
  // Revoke a vote with signature verification
  const revokeVote = useCallback(async (topic) => {
    if (!isAuthenticated) {
      throw new Error('You must be logged in to revoke a vote');
    }

    const existingVote = votes[topic];
    if (!existingVote) {
      throw new Error('No vote found to revoke');
    }
    
    try {
      setIsSubmitting(true);

      // Create revocation payload
      const revocationPayload = {
        topic,
        action: 'revoke',
        timestamp: Date.now(),
        userId: user.id,
        originalVoteSignature: existingVote.signature,
        nonce: Math.random().toString(36).substring(7)
      };

      // Sign the revocation
      const signature = await signMessage(JSON.stringify(revocationPayload), wallet.privateKey);
      
      // Submit revocation with signature
      const response = await voteService.revokeVote({
        ...revocationPayload,
        signature
      });
      
      if (response.success) {
        setVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[topic];
          return newVotes;
        });
      }
      
      return response;
    } catch (error) {
      console.error('Vote revocation failed:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, votes, wallet, user]);
  
  // Check if user has voted on a topic
  const hasVoted = useCallback((topic) => {
    return !!votes[topic];
  }, [votes]);
  
  // Get user's vote for a topic
  const getUserVote = useCallback((topic) => {
    return votes[topic] || null;
  }, [votes]);
  
  // Get voting results for a topic
  const getResults = useCallback((topic) => {
    return votingResults[topic] || null;
  }, [votingResults]);
  
  const getFilteredVotes = useCallback(async (filters = {}) => {
    if (!isAuthenticated) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await voteService.getFilteredVotes(filters);
      setLoading(false);
      return response.votes;
    } catch (err) {
      setError('Failed to load votes');
      setLoading(false);
      return [];
    }
  }, [isAuthenticated]);
  
  const getActivityStats = useCallback(async (voteIds) => {
    if (!isAuthenticated) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await voteService.getActivityStats(voteIds);
      setLoading(false);
      return response.stats;
    } catch (err) {
      setError('Failed to load activity statistics');
      setLoading(false);
      return null;
    }
  }, [isAuthenticated]);
  
  const getActivityMetrics = useCallback(async () => {
    if (!isAuthenticated) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await voteService.getActivityMetrics();
      setLoading(false);
      return response.metrics;
    } catch (err) {
      setError('Failed to load activity metrics');
      setLoading(false);
      return null;
    }
  }, [isAuthenticated]);
  
  const getUserActivityStats = useCallback(async (userIds) => {
    if (!isAuthenticated || !userIds || userIds.length === 0) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await voteService.getUserActivityStats(userIds);
      setLoading(false);
      return response.stats;
    } catch (err) {
      setError('Failed to load user activity statistics');
      setLoading(false);
      return null;
    }
  }, [isAuthenticated]);

  return {
    votes,
    isSubmitting,
    votingResults,
    loading,
    error,
    submitVote,
    revokeVote,
    hasVoted,
    getUserVote,
    getResults,
    getFilteredVotes,
    getActivityStats,
    getActivityMetrics,
    getUserActivityStats
  };
}

export default useVoting;
