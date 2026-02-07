import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { generateChallenge, verifyResponse } from '../../services/verification';
import './PasswordDance.css';

const PasswordDance = ({ onVerified, onFailed }) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    // Generate the challenge sequence when component mounts
    initializePasswordDance();
    
    // Clean up resources on unmount
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializePasswordDance = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get user profile to customize challenges
      const profile = user || {};
      
      // Generate password dance challenge
      const challengeResponse = await generateChallenge(profile);
      setChallenges(challengeResponse.challenges);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to initialize verification: ' + (err.message || 'Unknown error'));
      setLoading(false);
      if (onFailed) onFailed(err);
    }
  };

  const startNextChallenge = async () => {
    if (currentIndex >= challenges.length - 1) {
      // All challenges completed, submit final verification
      submitVerification();
      return;
    }
    
    // Move to next challenge
    setCurrentIndex(currentIndex + 1);
    setResponse('');
  };

  const handleChallengeResponse = async (responseData) => {
    const currentChallenge = challenges[currentIndex];
    
    try {
      // Verify this specific challenge response
      const result = await verifyResponse(
        currentChallenge.id,
        currentChallenge.type,
        responseData
      );
      
      if (result.verified) {
        // This challenge was successful, update response
        setResponse(responseData);
        
        // Proceed to next challenge after a short delay
        setTimeout(() => startNextChallenge(), 1000);
      } else {
        setError('Verification failed. Please try again.');
        if (onFailed) onFailed(new Error('Challenge verification failed'));
      }
    } catch (err) {
      setError('Error during verification: ' + (err.message || 'Unknown error'));
      if (onFailed) onFailed(err);
    }
  };

  const submitVerification = async () => {
    setLoading(true);
    
    try {
      // Submit the complete verification sequence
      const finalResult = await verifyResponse('complete', 'sequence', {
        challengeIds: challenges.map(c => c.id)
      });
      
      if (finalResult.verified) {
        setCompleted(true);
        if (onVerified) onVerified(finalResult);
      } else {
        setError('Verification sequence failed');
        if (onFailed) onFailed(new Error('Verification sequence failed'));
      }
    } catch (err) {
      setError('Error submitting verification: ' + (err.message || 'Unknown error'));
      if (onFailed) onFailed(err);
    } finally {
      setLoading(false);
    }
  };

  const renderChallenge = () => {
    if (loading || challenges.length === 0) {
      return <div className="loading">Loading challenges...</div>;
    }
    
    if (completed) {
      return <div className="success">Verification successful!</div>;
    }
    
    const currentChallenge = challenges[currentIndex];
    
    switch (currentChallenge.type) {
      case 'gesture':
        return (
          <div className="gesture-challenge">
            <h3>Perform Gesture</h3>
            <p>{currentChallenge.instruction}</p>
            <div className="video-container">
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                className="challenge-video"
              />
              <canvas ref={canvasRef} className="overlay-canvas" />
            </div>
            <button onClick={() => startGestureDetection(currentChallenge.gestureType)}>
              Start Detection
            </button>
          </div>
        );
        
      case 'presence':
        return (
          <div className="presence-challenge">
            <h3>Presence Verification</h3>
            <p>{currentChallenge.instruction}</p>
            <button onClick={() => verifyPresence(currentChallenge.id)}>
              Verify Presence
            </button>
          </div>
        );
        
      case 'knowledge':
        return (
          <div className="knowledge-challenge">
            <h3>Knowledge Verification</h3>
            <p>{currentChallenge.question}</p>
            <input
              type="text"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Your answer"
            />
            <button 
              onClick={() => handleChallengeResponse(response)}
              disabled={!response.trim()}
            >
              Submit Answer
            </button>
          </div>
        );
        
      default:
        return <div className="error">Unknown challenge type</div>;
    }
  };
  
  // Start gesture detection using camera
  const startGestureDetection = async (gestureType) => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      mediaStreamRef.current = stream;
      
      // Set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Start gesture detection (implementation would integrate with services/verification.js)
      const detectionResult = await detectGesture(gestureType, videoRef.current, canvasRef.current);
      
      // Handle the detection result
      handleChallengeResponse(detectionResult);
      
    } catch (err) {
      setError('Failed to access camera: ' + (err.message || 'Unknown error'));
    }
  };
  
  // Detect gesture using the video stream
  const detectGesture = async (gestureType, videoElement, canvasElement) => {
    // This would be implemented using the ML functionality in services/verification.js
    // For now, return a mock result after a delay to simulate detection
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          gesture: gestureType,
          confidence: 0.95,
          detected: true
        });
      }, 3000);
    });
  };
  
  // Verify user presence
  const verifyPresence = async (challengeId) => {
    try {
      const presenceResult = await verifyResponse(challengeId, 'presence', {
        timestamp: Date.now(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      });
      
      handleChallengeResponse(presenceResult);
    } catch (err) {
      setError('Presence verification failed: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="password-dance-container">
      <h2>Security Verification</h2>
      
      <div className="challenge-progress">
        {challenges.map((_, index) => (
          <div 
            key={index}
            className={`progress-step ${index < currentIndex ? 'completed' : index === currentIndex ? 'current' : ''}`}
          />
        ))}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="challenge-container">
        {renderChallenge()}
      </div>
    </div>
  );
};

export default PasswordDance;
