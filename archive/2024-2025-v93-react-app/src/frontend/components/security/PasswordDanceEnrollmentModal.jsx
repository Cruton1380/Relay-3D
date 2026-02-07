/**
 * @fileoverview Biometric Password Dance Enrollment Modal
 * Allows users to record a spoken phrase + facial gesture for strong authentication
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import './PasswordDanceEnrollmentModal.css';

const PasswordDanceEnrollmentModal = ({ 
  isOpen, 
  onClose, 
  onEnrollmentComplete, 
  userId 
}) => {
  const [step, setStep] = useState('setup'); // setup, recording, review, processing
  const [selectedPhrase, setSelectedPhrase] = useState('');
  const [selectedGesture, setSelectedGesture] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');
  const [enrollmentData, setEnrollmentData] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const gestureChunksRef = useRef([]);

  // Suggested phrases for security
  const suggestedPhrases = [
    "Voice print confirmed, access granted",
    "Biometric scan complete, identity verified", 
    "Authentication protocol initialized successfully",
    "Security clearance approved for entry",
    "Identity matrix validated and confirmed",
    "Access credentials verified and authenticated",
    "Biometric signature accepted for authorization",
    "Voice pattern recognized, proceeding with login"
  ];

  // Available gesture types
  const gestureTypes = [
    { id: 'nod', name: 'Head Nod', description: 'Deliberate up-down head movement' },
    { id: 'smile', name: 'Smile', description: 'Natural smile expression' },
    { id: 'wink', name: 'Wink', description: 'Single eye wink' },
    { id: 'eyebrow', name: 'Eyebrow Raise', description: 'Raise both eyebrows' },
    { id: 'turn', name: 'Head Turn', description: 'Turn head left then right' }
  ];

  // Initialize camera and microphone
  useEffect(() => {
    if (isOpen && step === 'recording') {
      initializeMedia();
    }
    return () => {
      cleanupMedia();
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

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      await initializeMedia();
    }

    try {
      // Reset chunks
      audioChunksRef.current = [];
      gestureChunksRef.current = [];

      // Create media recorder for audio and video
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          gestureChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const gestureBlob = new Blob(gestureChunksRef.current, { type: 'video/webm' });
        processRecording(gestureBlob);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setError('');

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 10000);

    } catch (error) {
      setError('Could not start recording. Please try again.');
      console.error('Recording error:', error);
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const processRecording = async (gestureBlob) => {
    try {
      setStep('processing');

      // In a real implementation, this would extract features from the blob
      // For now, we'll simulate the processing
      const audioData = await extractAudioFeatures(gestureBlob);
      const gestureData = await extractGestureFeatures(gestureBlob, selectedGesture);

      const enrollmentPayload = {
        userId,
        phrase: selectedPhrase,
        gestureType: selectedGesture,
        audioData,
        gestureData,
        timestamp: Date.now()
      };

      setEnrollmentData(enrollmentPayload);
      setStep('review');
    } catch (error) {
      setError('Failed to process recording. Please try again.');
      console.error('Processing error:', error);
      setStep('recording');
    }
  };

  // Simulate feature extraction (would use real ML/audio processing)
  const extractAudioFeatures = async (blob) => {
    // Simulate audio processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock audio features vector
    return {
      mfcc: new Array(13).fill(0).map(() => Math.random()),
      spectral: new Array(20).fill(0).map(() => Math.random()),
      temporal: new Array(10).fill(0).map(() => Math.random()),
      phrase: selectedPhrase
    };
  };

  const extractGestureFeatures = async (blob, gestureType) => {
    // Simulate gesture processing delay  
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Return mock gesture features vector
    return {
      landmarks: new Array(68).fill(0).map(() => Math.random()),
      motion: new Array(15).fill(0).map(() => Math.random()),
      expression: new Array(7).fill(0).map(() => Math.random()),
      gestureType
    };
  };

  const submitEnrollment = async () => {
    try {
      setStep('processing');

      const response = await fetch('/api/verification/password-dance/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrollmentData)
      });

      const result = await response.json();

      if (result.success) {
        onEnrollmentComplete({
          success: true,
          enrollmentId: result.enrollmentId,
          vectorHash: result.vectorHash
        });
        onClose();
      } else {
        throw new Error(result.message || 'Enrollment failed');
      }
    } catch (error) {
      setError('Failed to save biometric password dance. Please try again.');
      console.error('Enrollment error:', error);
      setStep('review');
    }
  };

  const retryRecording = () => {
    setAttempts(prev => prev + 1);
    setStep('recording');
    setError('');
    setEnrollmentData(null);
  };

  const handleClose = () => {
    cleanupMedia();
    setStep('setup');
    setError('');
    setEnrollmentData(null);
    setAttempts(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="password-dance-modal-overlay">
      <div className="password-dance-modal">
        <div className="modal-header">
          <h2>🔐 Biometric Password Dance Setup</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="modal-content">
          {step === 'setup' && (
            <div className="setup-step">
              <div className="step-info">
                <h3>Create Your Secure Password Dance</h3>
                <p>
                  Combine a spoken phrase with a facial gesture for ultra-secure authentication.
                  This will be used only for high-security verification events.
                </p>
              </div>

              <div className="phrase-selection">
                <h4>1. Choose Your Security Phrase</h4>
                <div className="phrase-options">
                  {suggestedPhrases.map((phrase, index) => (
                    <label key={index} className="phrase-option">
                      <input
                        type="radio"
                        name="phrase"
                        value={phrase}
                        checked={selectedPhrase === phrase}
                        onChange={(e) => setSelectedPhrase(e.target.value)}
                      />
                      <span>"{phrase}"</span>
                    </label>
                  ))}
                  <label className="phrase-option custom-phrase">
                    <input
                      type="radio"
                      name="phrase"
                      value="custom"
                      checked={selectedPhrase && !suggestedPhrases.includes(selectedPhrase)}
                      onChange={() => setSelectedPhrase('')}
                    />
                    <input
                      type="text"
                      placeholder="Enter your own phrase (10-50 characters)"
                      value={selectedPhrase && !suggestedPhrases.includes(selectedPhrase) ? selectedPhrase : ''}
                      onChange={(e) => setSelectedPhrase(e.target.value)}
                      maxLength={50}
                      minLength={10}
                    />
                  </label>
                </div>
              </div>

              <div className="gesture-selection">
                <h4>2. Choose Your Security Gesture</h4>
                <div className="gesture-options">
                  {gestureTypes.map((gesture) => (
                    <label key={gesture.id} className="gesture-option">
                      <input
                        type="radio"
                        name="gesture"
                        value={gesture.id}
                        checked={selectedGesture === gesture.id}
                        onChange={(e) => setSelectedGesture(e.target.value)}
                      />
                      <div className="gesture-info">
                        <strong>{gesture.name}</strong>
                        <span>{gesture.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="setup-actions">
                <button
                  className="primary-btn"
                  onClick={() => setStep('recording')}
                  disabled={!selectedPhrase || !selectedGesture || selectedPhrase.length < 10}
                >
                  Start Recording
                </button>
              </div>
            </div>
          )}

          {step === 'recording' && (
            <div className="recording-step">
              <div className="recording-info">
                <h3>Record Your Password Dance</h3>
                <p>
                  Say your phrase clearly while performing your chosen gesture.
                  Look directly at the camera and speak naturally.
                </p>
              </div>

              <div className="recording-area">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="recording-video"
                />
                
                <div className="recording-overlay">
                  <div className="phrase-display">
                    <strong>Say:</strong> "{selectedPhrase}"
                  </div>
                  <div className="gesture-display">
                    <strong>Gesture:</strong> {gestureTypes.find(g => g.id === selectedGesture)?.name}
                  </div>
                </div>

                <div className="recording-controls">
                  {!isRecording ? (
                    <button className="record-btn" onClick={startRecording}>
                      🔴 Start Recording
                    </button>
                  ) : (
                    <button className="stop-btn" onClick={stopRecording}>
                      ⏹️ Stop Recording
                    </button>
                  )}
                </div>

                {isRecording && (
                  <div className="recording-indicator">
                    <div className="pulse"></div>
                    Recording... {attempts > 0 && `(Attempt ${attempts + 1})`}
                  </div>
                )}
              </div>

              {error && (
                <div className="error-message">{error}</div>
              )}
            </div>
          )}

          {step === 'review' && enrollmentData && (
            <div className="review-step">
              <div className="review-info">
                <h3>Review Your Password Dance</h3>
                <p>
                  Your biometric password dance has been processed. 
                  Confirm to save this secure authentication method.
                </p>
              </div>

              <div className="enrollment-summary">
                <div className="summary-item">
                  <strong>Phrase:</strong> "{selectedPhrase}"
                </div>
                <div className="summary-item">
                  <strong>Gesture:</strong> {gestureTypes.find(g => g.id === selectedGesture)?.name}
                </div>
                <div className="summary-item">
                  <strong>Quality:</strong> 
                  <span className="quality-good">✓ High Quality</span>
                </div>
              </div>

              <div className="review-actions">
                <button className="secondary-btn" onClick={retryRecording}>
                  Record Again
                </button>
                <button className="primary-btn" onClick={submitEnrollment}>
                  Save Password Dance
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="processing-step">
              <div className="processing-indicator">
                <div className="spinner"></div>
                <h3>Processing Your Password Dance</h3>
                <p>Creating secure biometric vectors...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordDanceEnrollmentModal;
