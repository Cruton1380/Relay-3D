/**
 * BASE MODEL 1 - Personhood Verification Panel
 * UI for human verification challenges
 */
import React, { useState, useEffect } from 'react';
import usePersonhoodVerification, { VERIFICATION_STATE, CHALLENGE_TYPE } from './usePersonhoodVerification';
import './PersonhoodVerificationPanel.css';

const PersonhoodVerificationPanel = ({ panel, globeState, setGlobeState }) => {
  const [verificationStarted, setVerificationStarted] = useState(false);
  
  const {
    verificationState,
    isModelLoaded,
    currentChallenge,
    challengeProgress,
    verificationResult,
    error,
    getCurrentChallengeDescription,
    getVerificationProgress,
    initializeVerification,
    startVerification,
    stopVerification,
    resetVerification
  } = usePersonhoodVerification({
    challengeSequence: [CHALLENGE_TYPE.BLINK, CHALLENGE_TYPE.SMILE, CHALLENGE_TYPE.NOD],
    autoStart: false
  });

  const getStateColor = () => {
    switch (verificationState) {
      case VERIFICATION_STATE.VERIFIED: return '#10b981';
      case VERIFICATION_STATE.FAILED: 
      case VERIFICATION_STATE.ERROR: return '#ef4444';
      case VERIFICATION_STATE.IN_PROGRESS:
      case VERIFICATION_STATE.CHALLENGE_ACTIVE: return '#f59e0b';
      case VERIFICATION_STATE.READY: return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStateText = () => {
    switch (verificationState) {
      case VERIFICATION_STATE.IDLE: return 'Not Started';
      case VERIFICATION_STATE.INITIALIZING: return 'Initializing...';
      case VERIFICATION_STATE.READY: return 'Ready to Verify';
      case VERIFICATION_STATE.IN_PROGRESS: return 'Verification in Progress';
      case VERIFICATION_STATE.CHALLENGE_ACTIVE: return 'Challenge Active';
      case VERIFICATION_STATE.CHALLENGE_COMPLETED: return 'Challenge Completed';
      case VERIFICATION_STATE.VERIFIED: return 'Verified Successfully';
      case VERIFICATION_STATE.FAILED: return 'Verification Failed';
      case VERIFICATION_STATE.ERROR: return 'Error Occurred';
      default: return 'Unknown State';
    }
  };

  const handleStart = async () => {
    setVerificationStarted(true);
    if (!isModelLoaded) {
      await initializeVerification();
    }
    startVerification();
  };

  const handleReset = () => {
    setVerificationStarted(false);
    resetVerification();
  };

  return (
    <div className="personhood-verification-panel">
      <div className="verification-header">
        <h3>Personhood Verification</h3>
        <div 
          className="status-badge"
          style={{ backgroundColor: getStateColor() }}
        >
          {getStateText()}
        </div>
      </div>

      <div className="verification-content">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {verificationState === VERIFICATION_STATE.IDLE && !verificationStarted && (
          <div className="intro-section">
            <div className="intro-icon">🤖</div>
            <p>Human verification helps ensure authentic participation in the network.</p>
            <ul className="challenge-list">
              <li>👁️ Blink detection</li>
              <li>😊 Smile recognition</li>
              <li>📍 Head movement</li>
            </ul>
          </div>
        )}

        {(verificationState === VERIFICATION_STATE.INITIALIZING) && (
          <div className="loading-section">
            <div className="spinner"></div>
            <p>Loading verification models...</p>
          </div>
        )}

        {(verificationState === VERIFICATION_STATE.IN_PROGRESS || 
          verificationState === VERIFICATION_STATE.CHALLENGE_ACTIVE) && (
          <div className="challenge-section">
            <div className="challenge-instruction">
              <h4>Current Challenge</h4>
              <p>{getCurrentChallengeDescription()}</p>
            </div>
            
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${challengeProgress}%`,
                    backgroundColor: getStateColor()
                  }}
                />
              </div>
              <span className="progress-text">{Math.round(challengeProgress)}%</span>
            </div>

            <div className="overall-progress">
              <span>Overall Progress: {Math.round(getVerificationProgress())}%</span>
            </div>
          </div>
        )}

        {verificationState === VERIFICATION_STATE.VERIFIED && verificationResult && (
          <div className="success-section">
            <div className="success-icon">✅</div>
            <h4>Verification Successful!</h4>
            <div className="result-details">
              <div className="detail-row">
                <span>Confidence:</span>
                <span>{Math.round(verificationResult.overallConfidence * 100)}%</span>
              </div>
              <div className="detail-row">
                <span>Challenges:</span>
                <span>{verificationResult.challengesCompleted}</span>
              </div>
              <div className="detail-row">
                <span>Session ID:</span>
                <span className="session-id">{verificationResult.sessionId}</span>
              </div>
            </div>
          </div>
        )}

        {verificationState === VERIFICATION_STATE.FAILED && (
          <div className="failure-section">
            <div className="failure-icon">❌</div>
            <h4>Verification Failed</h4>
            <p>Please try again. Ensure good lighting and follow the instructions carefully.</p>
          </div>
        )}
      </div>

      <div className="verification-controls">
        {verificationState === VERIFICATION_STATE.IDLE && (
          <button 
            onClick={handleStart}
            className="start-btn"
          >
            Start Verification
          </button>
        )}

        {verificationState === VERIFICATION_STATE.READY && (
          <button 
            onClick={startVerification}
            className="start-btn"
          >
            Begin Challenges
          </button>
        )}

        {(verificationState === VERIFICATION_STATE.IN_PROGRESS || 
          verificationState === VERIFICATION_STATE.CHALLENGE_ACTIVE) && (
          <button 
            onClick={stopVerification}
            className="stop-btn"
          >
            Stop Verification
          </button>
        )}

        {(verificationState === VERIFICATION_STATE.VERIFIED || 
          verificationState === VERIFICATION_STATE.FAILED || 
          verificationState === VERIFICATION_STATE.ERROR) && (
          <button 
            onClick={handleReset}
            className="reset-btn"
          >
            Start New Verification
          </button>
        )}
      </div>
    </div>
  );
};

export default PersonhoodVerificationPanel;
