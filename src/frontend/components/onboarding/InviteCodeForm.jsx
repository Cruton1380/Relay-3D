import React, { useState } from 'react';
import { useOnboarding } from '../../hooks/useOnboarding';

export function InviteCodeForm({ onSuccess }) {
  const [code, setCode] = useState('');
  const { verifyInvite, isLoading, error } = useOnboarding();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      return;
    }
    
    const success = await verifyInvite(code);
    
    if (success && onSuccess) {
      onSuccess(code);
    }
  };
  
  return (
    <div className="invite-code-form">
      <h2>Enter Invite Code</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="invite-code">Invite Code</label>
          <input
            id="invite-code"
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter your invite code"
            disabled={isLoading}
            required
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}

export default InviteCodeForm;
