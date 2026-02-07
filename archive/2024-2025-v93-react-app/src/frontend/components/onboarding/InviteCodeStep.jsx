import React, { useState } from 'react';
import { apiPost } from '../../services/apiClient';

export function InviteCodeStep({ onVerified }) {
  const [inviteCode, setInviteCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }
    
    try {
      setIsVerifying(true);
      setError(null);
      
      const result = await apiPost('/onboarding/validateInvite', {
        code: inviteCode.trim()
      });
      
      if (result.valid) {
        onVerified({
          code: inviteCode.trim(),
          details: result.details
        });
      } else {
        setError(result.message || 'Invalid invite code');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify invite code');
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <div className="invite-code-step">
      <h2>Enter Your Invite Code</h2>
      <p>To join Relay, please enter the invite code you received.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="invite-code">Invite Code</label>
          <input
            id="invite-code"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter your invite code"
            autoComplete="off"
            disabled={isVerifying}
          />
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        <button 
          type="submit" 
          className="verify-button"
          disabled={isVerifying || !inviteCode.trim()}
        >
          {isVerifying ? 'Verifying...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

export default InviteCodeStep;
