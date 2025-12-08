/**
 * @fileoverview Biometric Password Dance Challenge Modal
 * Used during adaptive/strong reverification to verify user identity
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import './PasswordDanceChallengeModal.css';

const PasswordDanceChallengeModal = ({ 
  isOpen, 
  onClose, 
  onVerificationComplete, 
  userId,
  enrolledDance, // Contains phrase, gestureType from backend
  verificationReason = 'Strong authentication required'
}) => {
  const [step, setStep] = useState('instructions'); // instructions, recording, processing, result
  const [isRecording, setIsRecording] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [verificationResult, setVerificationResult] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const challengeChunksRef = useRef([]);

  const maxAttempts = 3;

  // Initialize camera and microphone
  useEffect(() => {
    if (isOpen && step === 'recording') {
      initializeMedia();
    }
    return () => {
      cleanupMedia();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen, step]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        },
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          volume: 1.0
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setError('Could not access camera and microphone. Please check permissions.');
      console.error('Media access error:', error);
    }
  };

  const cleanupMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startTimer = () => {
    setTimeRemaining(10);
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      await initializeMedia();
    }

    try {
      challengeChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          challengeChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const challengeBlob = new Blob(challengeChunksRef.current, { type: 'video/webm' });
        processChallenge(challengeBlob);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setError('');
      startTimer();

    } catch (error) {
      setError('Could not start recording. Please try again.');
      console.error('Recording error:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  }, [isRecording]);

  const processChallenge = async (challengeBlob) => {
    try {
      setStep('processing');

      // Extract features from challenge attempt
      const audioData = await extractAudioFeatures(challengeBlob);
      const gestureData = await extractGestureFeatures(challengeBlob, enrolledDance.gestureType);

      const challengePayload = {
        userId,
        phrase: enrolledDance.phrase,
        audioData,
        gestureData,
        timestamp: Date.now(),
        attemptNumber: attempts + 1
      };

      // Send to backend for verification
      const response = await fetch('/api/verification/password-dance/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(challengePayload)
      });

      const result = await response.json();
      setVerificationResult(result);
      setStep('result');

      // Notify parent component
      setTimeout(() => {
        onVerificationComplete(result);
        if (result.verified) {
          onClose();
        }
      }, 2000);

    } catch (error) {
      setError('Failed to verify password dance. Please try again.');
      console.error('Verification error:', error);
      setStep('recording');
    }
  };

  // Simulate feature extraction (would use real ML/audio processing)
  const extractAudioFeatures = async (blob) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      mfcc: new Array(13).fill(0).map(() => Math.random()),
      spectral: new Array(20).fill(0).map(() => Math.random()),
      temporal: new Array(10).fill(0).map(() => Math.random()),
      phrase: enrolledDance.phrase
    };
  };

  const extractGestureFeatures = async (blob, gestureType) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      landmarks: new Array(68).fill(0).map(() => Math.random()),
      motion: new Array(15).fill(0).map(() => Math.random()),
      expression: new Array(7).fill(0).map(() => Math.random()),
      gestureType
    };
  };

  const retryChallenge = () => {
    setAttempts(prev => prev + 1);
    setStep('recording');
    setError('');
    setVerificationResult(null);
  };

  const handleClose = () => {
    cleanupMedia();
    stopTimer();
    onVerificationComplete({ verified: false, reason: 'User cancelled' });
    onClose();
  };

  const getGestureDisplayName = (gestureType) => {
    const gestureNames = {
      'nod': 'Head Nod',
      'smile': 'Smile',
      'wink': 'Wink',
      'eyebrow': 'Eyebrow Raise',
      'turn': 'Head Turn'
    };
    return gestureNames[gestureType] || gestureType;
  };

  if (!isOpen || !enrolledDance) return null;

  return (
    <div className="password-challenge-modal-overlay">
      <div className="password-challenge-modal">
        <div className="modal-header">
          <h2>🔐 Security Verification Required</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="modal-content">
          {step === 'instructions' && (
            <div className="instructions-step">
              <div className="verification-reason">
                <div className="security-icon">🛡️</div>
                <h3>Strong Authentication Required</h3>
                <p>{verificationReason}</p>
              </div>

              <div className="challenge-info">
                <h4>Please perform your biometric password dance:</h4>
                <div className="challenge-details">
                  <div className="detail-item">
                    <strong>Say:</strong> 
                    <span className="phrase-highlight">"{enrolledDance.phrase}"</span>
                  </div>
                  <div className="detail-item">
                    <strong>Gesture:</strong>
                    <span className="gesture-highlight">{getGestureDisplayName(enrolledDance.gestureType)}</span>
                  </div>
                </div>
              </div>

              <div className="security-notice">
                <div className="notice-icon">ℹ️</div>
                <p>
                  Speak clearly and look directly at the camera. 
                  You have {maxAttempts} attempts to complete verification.
                </p>
              </div>

              <div className="instructions-actions">
                <button className="primary-btn" onClick={() => setStep('recording')}>
                  Start Verification
                </button>
              </div>
            </div>
          )}

          {step === 'recording' && (
            <div className="recording-step">
              <div className="challenge-header">
                <h3>Perform Your Password Dance</h3>
                <div className="attempt-counter">
                  Attempt {attempts + 1} of {maxAttempts}
                </div>
              </div>

              <div className="recording-area">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="challenge-video"
                />
                
                <div className="challenge-overlay">
                  <div className="phrase-prompt">
                    <strong>Say:</strong> "{enrolledDance.phrase}"
                  </div>
                  <div className="gesture-prompt">
                    <strong>Do:</strong> {getGestureDisplayName(enrolledDance.gestureType)}
                  </div>
                  {isRecording && (
                    <div className="timer">
                      Time: {timeRemaining}s
                    </div>
                  )}
                </div>

                <div className="recording-controls">
                  {!isRecording ? (
                    <button className="record-btn" onClick={startRecording}>
                      🔴 Start Recording
                    </button>
                  ) : (
                    <button className="stop-btn" onClick={stopRecording}>
                      ⏹️ Stop Early
                    </button>
                  )}
                </div>

                {isRecording && (
                  <div className="recording-indicator">
                    <div className="pulse"></div>
                    Recording...
                  </div>
                )}
              </div>

              {error && (
                <div className="error-message">{error}</div>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="processing-step">
              <div className="processing-indicator">
                <div className="spinner"></div>
                <h3>Verifying Your Identity</h3>
                <p>Analyzing biometric patterns...</p>
              </div>
            </div>
          )}

          {step === 'result' && verificationResult && (
            <div className="result-step">
              {verificationResult.verified ? (
                <div className="success-result">
                  <div className="result-icon success">✅</div>
                  <h3>Verification Successful</h3>
                  <p>Your identity has been confirmed successfully.</p>
                  <div className="confidence-score">
                    Confidence: {Math.round((verificationResult.confidence || 0.95) * 100)}%
                  </div>
                </div>
              ) : (
                <div className="failure-result">
                  <div className="result-icon failure">❌</div>
                  <h3>Verification Failed</h3>
                  <p>{verificationResult.reason || 'The password dance did not match your enrolled pattern.'}</p>
                  
                  {attempts < maxAttempts - 1 ? (
                    <div className="retry-section">
                      <p>You have {maxAttempts - attempts - 1} attempts remaining.</p>
                      <button className="primary-btn" onClick={retryChallenge}>
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <div className="max-attempts-reached">
                      <p>Maximum verification attempts reached.</p>
                      <button className="secondary-btn" onClick={handleClose}>
                        Cancel Verification
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordDanceChallengeModal;
