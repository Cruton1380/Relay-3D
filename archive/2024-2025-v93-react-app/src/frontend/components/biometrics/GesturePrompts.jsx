// frontend/components/biometrics/GesturePrompts.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  GESTURE_TYPES,
  generateGestureSequence, 
  getGestureInstruction, 
  validateGesture,
  calculateGestureConfidence
} from '../../utils/gesture';

/**
 * Component that prompts the user to perform specific gestures
 * and validates their responses using face/pose detection
 */
const GesturePrompts = ({ 
  onComplete, 
  poseDetection, 
  faceLandmarks,
  sequenceLength = 3,
  timeLimit = 8000,
  requiredConfidence = 0.7
}) => {
  // State for tracking the current gesture sequence and progress
  const [gestureSequence, setGestureSequence] = useState([]);
  const [currentGestureIndex, setCurrentGestureIndex] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit / 1000);
  const [gestureResult, setGestureResult] = useState({ success: false, message: '' });
  
  // Generate a random gesture sequence on mount
  useEffect(() => {
    try {
      const sequence = generateGestureSequence(sequenceLength);
      setGestureSequence(sequence);
      setCurrentInstruction(getGestureInstruction(sequence[0]));
    } catch (error) {
      console.error('Failed to generate gesture sequence:', error);
      setGestureResult({
        success: false,
        message: 'Failed to initialize gesture verification'
      });
    }
  }, [sequenceLength]);
  
  // Countdown timer logic
  useEffect(() => {
    if (!isVerifying || currentGestureIndex >= gestureSequence.length) return;
    
    let timer;
    if (timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else {
      // Time's up for current gesture
      moveToNextGesture(false);
    }
    
    return () => clearTimeout(timer);
  }, [timeRemaining, isVerifying, currentGestureIndex, gestureSequence.length]);
  
  // Pose detection processor
  useEffect(() => {
    if (!isVerifying || !poseDetection || !faceLandmarks) return;
    
    const currentGesture = gestureSequence[currentGestureIndex];
    if (!currentGesture) return;
    
    // Validate the current gesture using the utility function
    const isValid = validateGesture(currentGesture, poseDetection, faceLandmarks);
    const confidence = calculateGestureConfidence(currentGesture, poseDetection, faceLandmarks);
    
    if (isValid && confidence >= requiredConfidence) {
      moveToNextGesture(true);
    }
  }, [poseDetection, faceLandmarks, isVerifying, currentGestureIndex, gestureSequence, requiredConfidence]);
  
  // Handle moving to the next gesture or completing the sequence
  const moveToNextGesture = useCallback((success) => {
    // Update the result for the current gesture
    setGestureResult({
      success,
      message: success ? 'Gesture detected!' : 'Failed to detect gesture'
    });
    
    // Short pause before moving to next gesture
    setTimeout(() => {
      const nextIndex = currentGestureIndex + 1;
      
      if (nextIndex >= gestureSequence.length) {
        // All gestures completed
        setIsVerifying(false);
        onComplete({
          success: success, // Final gesture success determines overall success
          completedGestures: nextIndex
        });
      } else {
        // Move to next gesture
        setCurrentGestureIndex(nextIndex);
        setCurrentInstruction(getGestureInstruction(gestureSequence[nextIndex]));
        setTimeRemaining(timeLimit / 1000);
        setGestureResult({ success: false, message: '' });
      }
    }, 1000);
  }, [currentGestureIndex, gestureSequence, timeLimit, onComplete]);
  
  // Start verification process
  const startVerification = () => {
    setIsVerifying(true);
    setTimeRemaining(timeLimit / 1000);
    setGestureResult({ success: false, message: '' });
  };
  
  // Render appropriate UI based on current state
  return (
    <div className="gesture-prompts">
      <h2>Gesture Verification</h2>
      
      {!isVerifying && currentGestureIndex === 0 && (
        <div className="gesture-start">
          <p>You'll be asked to perform {sequenceLength} gestures to verify you're a real person.</p>
          <button onClick={startVerification} className="start-button">
            Start Verification
          </button>
        </div>
      )}
      
      {isVerifying && currentGestureIndex < gestureSequence.length && (
        <div className="gesture-prompt">
          <div className="gesture-instruction">
            <h3>{currentInstruction}</h3>
            <div className="timer">Time remaining: {timeRemaining}s</div>
          </div>
          
          {gestureResult.message && (
            <div className={`gesture-result ${gestureResult.success ? 'success' : 'error'}`}>
              {gestureResult.message}
            </div>
          )}
        </div>
      )}
      
      {currentGestureIndex >= gestureSequence.length && (
        <div className="gesture-complete">
          <h3>Verification Complete!</h3>
        </div>
      )}
      
      {/* Progress indicator */}
      <div className="gesture-progress">
        {gestureSequence.map((_, index) => (
          <div 
            key={index} 
            className={`progress-dot ${index < currentGestureIndex ? 'completed' : ''} ${index === currentGestureIndex ? 'current' : ''}`} 
          />
        ))}
      </div>
    </div>
  );
};

GesturePrompts.propTypes = {
  onComplete: PropTypes.func.isRequired,
  poseDetection: PropTypes.object,
  faceLandmarks: PropTypes.object,
  sequenceLength: PropTypes.number,
  timeLimit: PropTypes.number,
  requiredConfidence: PropTypes.number
};

export default GesturePrompts;
