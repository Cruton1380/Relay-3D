import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { apiPost } from '../../services/apiClient';
import PasswordDanceChallengeModal from './PasswordDanceChallengeModal';
import './SmartVerificationModal.css';

const VERIFICATION_TYPES = {
  PASSWORD: 'password',
  BIOMETRIC: 'biometric',
  DEVICE: 'device',
  GESTURE: 'gesture',
  TYPING: 'typing',
  SECURITY_QUESTIONS: 'security_questions',
  PASSWORD_DANCE: 'password_dance' // Add password dance type
};

const VERIFICATION_LEVELS = {
  LIGHT: 'light',
  MEDIUM: 'medium', 
  STRONG: 'strong'
};

export function SmartVerificationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  riskLevel = VERIFICATION_LEVELS.LIGHT,
  context = {}
}) {  const { user } = useAuth();
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationData, setVerificationData] = useState({});
  const [showPasswordDance, setShowPasswordDance] = useState(false);
  const [enrolledDance, setEnrolledDance] = useState(null);

  const handlePasswordDanceComplete = (result) => {
    setShowPasswordDance(false);
    if (result.verified) {
      handleChallengeComplete(VERIFICATION_TYPES.PASSWORD_DANCE, result);
    } else {
      setError(result.reason || 'Password dance verification failed');
    }
  };

  useEffect(() => {
    if (isOpen) {
      initializeVerification();
    }
  }, [isOpen, riskLevel]);

  const initializeVerification = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiPost('/api/verification/initialize', {
        riskLevel,
        context,
        userId: user?.id
      });

      if (response.success) {
        setCurrentChallenge(response.data.challenges[0]);
      } else {
        setError('Failed to initialize verification');
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChallengeComplete = async (challengeType, result) => {
    try {
      setIsLoading(true);
      setError(null);

      // Submit challenge result
      const response = await apiPost('/api/verification/submit-challenge', {
        challengeType,
        result,
        riskLevel,
        context
      });

      if (response.success) {
        const newCompleted = [...completedChallenges, challengeType];
        setCompletedChallenges(newCompleted);

        // Check if verification is complete
        if (response.data.verificationComplete) {
          onSuccess(response.data);
          onClose();
        } else if (response.data.nextChallenge) {
          setCurrentChallenge(response.data.nextChallenge);
        }
      } else {
        setError(response.message || 'Challenge failed');
      }
    } catch (err) {
      setError(err.message || 'Challenge submission failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordChallenge = () => (
    <div className="verification-challenge">
      <h3>Password Verification</h3>
      <p>Please enter your password to continue</p>
      <form onSubmit={(e) => {
        e.preventDefault();
        const password = e.target.password.value;
        handleChallengeComplete(VERIFICATION_TYPES.PASSWORD, { password });
      }}>
        <input
          type="password"
          name="password"
          placeholder="Enter your password"
          required
          className="verification-input"
        />
        <button type="submit" disabled={isLoading} className="verification-submit">
          Verify
        </button>
      </form>
    </div>
  );

  const renderBiometricChallenge = () => (
    <div className="verification-challenge">
      <h3>Biometric Verification</h3>
      <p>Please provide your biometric signature</p>
      <div className="biometric-capture">
        <button 
          onClick={() => handleChallengeComplete(VERIFICATION_TYPES.BIOMETRIC, { verified: true })}
          disabled={isLoading}
          className="verification-submit biometric-button"
        >
          Capture Biometric
        </button>
      </div>
    </div>
  );

  const renderGestureChallenge = () => {
    const [gestureData, setGestureData] = useState([]);
    const [isRecording, setIsRecording] = useState(false);

    const startGestureRecording = () => {
      setIsRecording(true);
      setGestureData([]);
      // Simulate gesture recording
      setTimeout(() => {
        setIsRecording(false);
        const mockGesture = {
          pattern: 'circle-tap-swipe',
          timing: Date.now(),
          pressure: Math.random()
        };
        setGestureData([mockGesture]);
      }, 3000);
    };

    const submitGesture = () => {
      handleChallengeComplete(VERIFICATION_TYPES.GESTURE, { gestures: gestureData });
    };

    return (
      <div className="verification-challenge">
        <h3>Gesture Verification</h3>
        <p>Please perform your gesture pattern</p>
        <div className="gesture-area">
          {!isRecording && gestureData.length === 0 && (
            <button onClick={startGestureRecording} className="verification-submit">
              Start Gesture Recording
            </button>
          )}
          {isRecording && (
            <div className="recording-indicator">
              <div className="pulse-animation"></div>
              <p>Recording gesture... Draw your pattern</p>
            </div>
          )}
          {!isRecording && gestureData.length > 0 && (
            <div className="gesture-complete">
              <p>Gesture recorded successfully</p>
              <button onClick={submitGesture} disabled={isLoading} className="verification-submit">
                Submit Gesture
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTypingChallenge = () => {
    const [typingText, setTypingText] = useState('');
    const [startTime, setStartTime] = useState(null);
    const testPhrase = "The quick brown fox jumps over the lazy dog";

    const handleTypingStart = () => {
      if (!startTime) {
        setStartTime(Date.now());
      }
    };

    const handleTypingSubmit = () => {
      const endTime = Date.now();
      const typingSpeed = typingText.length / ((endTime - startTime) / 1000 / 60); // WPM
      const accuracy = typingText === testPhrase ? 100 : 
        (testPhrase.split('').filter((char, i) => char === typingText[i]).length / testPhrase.length) * 100;

      handleChallengeComplete(VERIFICATION_TYPES.TYPING, {
        text: typingText,
        speed: typingSpeed,
        accuracy,
        duration: endTime - startTime
      });
    };

    return (
      <div className="verification-challenge">
        <h3>Typing Pattern Verification</h3>
        <p>Please type the following phrase exactly as shown:</p>
        <div className="typing-reference">"{testPhrase}"</div>
        <textarea
          value={typingText}
          onChange={(e) => setTypingText(e.target.value)}
          onFocus={handleTypingStart}
          placeholder="Type the phrase here..."
          className="typing-input"
        />
        <button 
          onClick={handleTypingSubmit}
          disabled={isLoading || typingText !== testPhrase}
          className="verification-submit"
        >
          Submit Typing Pattern
        </button>
      </div>
    );
  };

  const renderDeviceChallenge = () => (
    <div className="verification-challenge">
      <h3>Device Verification</h3>
      <p>Verifying this is your trusted device...</p>
      <div className="device-info">
        <p>Device fingerprint verification in progress</p>
        <button 
          onClick={() => handleChallengeComplete(VERIFICATION_TYPES.DEVICE, { verified: true })}
          disabled={isLoading}
          className="verification-submit"        >
          Verify Device
        </button>
      </div>
    </div>
  );
  const renderPasswordDanceChallenge = () => {
    const handlePasswordDanceStart = async () => {
      try {
        // Fetch enrolled dance info
        const response = await fetch(`/api/verification/password-dance/info/${user?.id}`);
        const result = await response.json();
        
        if (!result.success || !result.enrolledDance) {
          setError('No biometric password dance enrolled. Please contact support.');
          return;
        }

        setEnrolledDance(result.enrolledDance);
        setShowPasswordDance(true);
      } catch (error) {
        setError('Failed to load password dance. Please try again.');
        console.error('Error loading password dance:', error);
      }
    };

    return (
      <div className="verification-challenge">
        <h3>🔐 Biometric Password Dance</h3>
        <p>This requires your unique biometric password dance for strong authentication.</p>
        <div className="password-dance-info">
          <div className="security-level">
            <span className="level-badge high">High Security</span>
            <p>Speak your phrase while performing your enrolled gesture</p>
          </div>
          <button 
            onClick={handlePasswordDanceStart}
            disabled={isLoading}
            className="verification-submit password-dance-button"
          >
            Start Password Dance
          </button>
        </div>
      </div>
    );
  };

  const renderChallenge = () => {
    if (!currentChallenge) return null;

    switch (currentChallenge.type) {
      case VERIFICATION_TYPES.PASSWORD:
        return renderPasswordChallenge();
      case VERIFICATION_TYPES.BIOMETRIC:
        return renderBiometricChallenge();
      case VERIFICATION_TYPES.GESTURE:
        return renderGestureChallenge();
      case VERIFICATION_TYPES.TYPING:
        return renderTypingChallenge();
      case VERIFICATION_TYPES.DEVICE:
        return renderDeviceChallenge();
      case VERIFICATION_TYPES.PASSWORD_DANCE:
        return renderPasswordDanceChallenge();
      default:
        return <div>Unknown challenge type</div>;
    }
  };

  const getRiskLevelColor = () => {
    switch (riskLevel) {
      case VERIFICATION_LEVELS.LIGHT: return '#4CAF50';
      case VERIFICATION_LEVELS.MEDIUM: return '#FF9800';
      case VERIFICATION_LEVELS.STRONG: return '#F44336';
      default: return '#2196F3';
    }
  };

  const getRiskLevelText = () => {
    switch (riskLevel) {
      case VERIFICATION_LEVELS.LIGHT: return 'Light Verification';
      case VERIFICATION_LEVELS.MEDIUM: return 'Medium Security Check';
      case VERIFICATION_LEVELS.STRONG: return 'Enhanced Security Verification';
      default: return 'Security Verification';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="verification-modal-overlay">
      <div className="verification-modal">
        <div className="verification-header">
          <div className="risk-indicator" style={{ backgroundColor: getRiskLevelColor() }}>
            <span className="risk-level-text">{getRiskLevelText()}</span>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="verification-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Processing verification...</p>
            </div>
          ) : (
            renderChallenge()
          )}

          <div className="verification-progress">
            <div className="progress-text">
              Completed: {completedChallenges.length} / {currentChallenge?.totalRequired || 1}
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${(completedChallenges.length / (currentChallenge?.totalRequired || 1)) * 100}%`,
                  backgroundColor: getRiskLevelColor()
                }}
              />
            </div>
          </div>
        </div>

        <div className="verification-footer">          <p className="privacy-note">
            Your verification data is processed securely and is not stored permanently.
          </p>
        </div>
      </div>

      {/* Password Dance Challenge Modal */}
      <PasswordDanceChallengeModal
        isOpen={showPasswordDance}
        onClose={() => setShowPasswordDance(false)}
        onVerificationComplete={handlePasswordDanceComplete}
        userId={user?.id}
        enrolledDance={enrolledDance}
        verificationReason={context.reason || 'Strong authentication required'}
      />
    </div>
  );
}

export default SmartVerificationModal;
