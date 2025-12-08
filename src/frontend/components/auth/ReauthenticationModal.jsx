import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useModal } from '../../context/ModalContext';

export function ReauthenticationModal() {
  const { authLevel, elevateSessionWithPassword, elevateSessionWithBiometric } = useAuth();
  const { closeModal } = useModal();
  const [method, setMethod] = useState('password'); // or 'biometric'
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      let success = false;
      
      if (method === 'password') {
        success = await elevateSessionWithPassword(password);
      } else if (method === 'biometric') {
        success = await elevateSessionWithBiometric();
      }
      
      if (success) {
        closeModal('reauthModal');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="reauth-modal">
      <h2>Session Verification Required</h2>
      <p>Your session requires verification to continue.</p>
      
      <div className="auth-method-selector">
        <button 
          className={`method-button ${method === 'password' ? 'active' : ''}`}
          onClick={() => setMethod('password')}
        >
          Password
        </button>
        <button 
          className={`method-button ${method === 'biometric' ? 'active' : ''}`}
          onClick={() => setMethod('biometric')}
          disabled={authLevel === 'basic'}
        >
          Biometric
        </button>
      </div>
      
      {method === 'password' ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => closeModal('reauthModal')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      ) : (
        <div className="biometric-container">
          <p>Please complete the biometric verification</p>
          
          <button 
            className="biometric-button"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Start Biometric Verification'}
          </button>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            className="cancel-button"
            onClick={() => closeModal('reauthModal')}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default ReauthenticationModal;
