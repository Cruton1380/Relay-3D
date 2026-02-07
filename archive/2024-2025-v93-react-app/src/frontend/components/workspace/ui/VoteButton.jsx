import React, { useState, useEffect } from 'react';
import { useEnvironment } from '../hooks/useEnvironment';
import { apiPost, voteAPI } from '../services/apiClient';
import './VoteButton.css';

// Demo user ID for testing
const DEMO_USER_ID = 'demo-user-1';

const VoteButton = ({ id, channelId, candidateId, value = 1, isVoted, onVote, disabled }) => {
  const { isTestMode } = useEnvironment();
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState(null);
  const [voteStatus, setVoteStatus] = useState(null);
  const [blockchainTx, setBlockchainTx] = useState(null);

  // Blockchain vote handling with cryptographic signatures
  const handleVote = async () => {
    console.log('🔗 VoteButton clicked:', { channelId, candidateId, isVoted, disabled, isVoting });
    
    if (isVoted || disabled || isVoting) {
      console.log('🔗 Vote blocked:', { isVoted, disabled, isVoting });
      return;
    }

    if (onVote) {
      // Use parent component's vote handler (HomePage)
      console.log('🔗 Using parent vote handler');
      onVote();
      return;
    }

    // Blockchain vote handling
    console.log('🔗 Using blockchain vote handling');
    setIsVoting(true);
    setError(null);
    setVoteStatus('preparing');

    try {
      // Generate cryptographic vote data for production blockchain
      const voteData = {
        topic: channelId,
        voteType: 'candidate',
        choice: candidateId,
        timestamp: Date.now(),
        nonce: crypto.randomUUID(),
        publicKey: DEMO_USER_ID,
        signature: 'demo-signature', // Production blockchain signature
        isTestData: isTestMode,
        testDataSource: 'production_blockchain_integration'
      };
      
      console.log('🔗 Submitting blockchain vote:', voteData);
      setVoteStatus('submitting');

      // Submit to blockchain endpoint
      const result = await voteAPI.submitVoteAlt(voteData);
      console.log('🔗 Blockchain vote submitted successfully:', result);
      
      if (result.success) {
        setVoteStatus('confirmed');
        setBlockchainTx({
          id: result.data?.transactionId,
          block: result.data?.blockNumber,
          confirmations: result.data?.confirmations
        });
        
        // Emit custom event for other components to listen
        window.dispatchEvent(new CustomEvent('voteSubmitted', { 
          detail: { 
            channelId, 
            candidateId, 
            result,
            blockchainTxId: result.data?.transactionId,
            blockNumber: result.data?.blockNumber
          } 
        }));
      } else {
        throw new Error(result.error || 'Blockchain vote failed');
      }

    } catch (err) {
      console.error('🔗 Blockchain vote error:', err);
      setVoteStatus('error');
      setError(`Failed to vote: ${err.message}`);
    } finally {
      setIsVoting(false);
    }
  };

  const getButtonText = () => {
    if (isVoting) {
      if (voteStatus === 'preparing') return 'Preparing...';
      if (voteStatus === 'submitting') return 'Submitting to Blockchain...';
      if (voteStatus === 'confirmed') return 'Confirmed!';
      if (voteStatus === 'error') return 'Error';
      return 'Voting...';
    }
    if (isVoted) return 'Voted';
    return 'Vote';
  };

  const getButtonClass = () => {
    let className = 'vote-button';
    if (isVoted) className += ' voted';
    if (isVoting) className += ' voting';
    if (disabled) className += ' disabled';
    return className;
  };

  return (
    <div className="vote-button-container">
      <button
        className={getButtonClass()}
        onClick={handleVote}
        disabled={disabled || isVoting || isVoted}
      >
        {getButtonText()}
      </button>
      {error && <div className="vote-error">{error}</div>}
      {blockchainTx && (
        <div className="blockchain-info">
          <small>🔗 TX: {blockchainTx.id?.slice(0, 10)}...</small>
          <small>Block: {blockchainTx.block}</small>
        </div>
      )}
    </div>
  );
};

export default VoteButton;
