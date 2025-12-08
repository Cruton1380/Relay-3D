import React, { useState } from 'react';
import { usePersonhoodVerification } from '../../hooks/usePersonhoodVerification';

export function PersonhoodVerificationStep({ onVerified }) {
  const [error, setError] = useState(null);
  const {
    videoRef,
    verificationState,
    challengeProgress,
    startVerification,
    cancelVerification,
    VERIFICATION_STATE
  } = usePersonhoodVerification({
    challengeSequence: ['BLINK', 'SMILE', 'NOD'],
    timeoutDuration: 60000, // 1 minute
    autoStart: false
  });

  // Handle verification completion
  React.useEffect(() => {
    if (verificationState === VERIFICATION_STATE.VERIFIED) {
      onVerified();
    }
  }, [verificationState, VERIFICATION_STATE.VERIFIED, onVerified]);

  // Start verification process
  const handleStart = async () => {
    setError(null);
    try {
      await startVerification();
    } catch (err) {
      setError(`Failed to start verification: ${err.message}`);
    }
  };

  return (
    <div className="personhood-verification-container">
      <h2>Verify You're Human</h2>
      <p className="verification-instructions">
        We need to verify that you're a real person. Please follow the prompts that will appear on screen.
      </p>
      
      <div className="video-container">
        <video 
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={verificationState !== VERIFICATION_STATE.IDLE ? 'active' : ''}
        />
        
        {verificationState === VERIFICATION_STATE.IDLE && (
          <div className="video-overlay">
            <button 
              className="start-verification-button"
              onClick={handleStart}
            >
              Start Verification
            </button>
          </div>
        )}
      </div>
      
      {verificationState === VERIFICATION_STATE.CHALLENGE_ACTIVE && (
        <div className="challenge-progress">
          <div 
            className="progress-bar"
            style={{ width: `${challengeProgress * 100}%` }}
          />
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      {verificationState === VERIFICATION_STATE.FAILED && (
        <div className="verification-actions">
          <button 
            className="retry-button"
            onClick={handleStart}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default PersonhoodVerificationStep;
