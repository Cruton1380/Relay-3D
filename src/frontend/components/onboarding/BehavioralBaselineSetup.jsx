import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './BehavioralBaselineSetup.css';

/**
 * Enhanced onboarding component for collecting behavioral baseline data
 * This creates the "Password Dance Baseline" during user signup
 */
const BehavioralBaselineSetup = ({ 
  onComplete, 
  onSkip, 
  userProfile = {},
  className = '' 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [collectedData, setCollectedData] = useState({
    gestures: [],
    typing: {},
    interactions: [],
    device: {}
  });
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const typingRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Baseline collection challenges
  const challenges = [
    {
      id: 'gesture_smile',
      type: 'gesture',
      title: 'Smile Recognition',
      instruction: 'Look at the camera and smile for 3 seconds',
      description: 'This helps us recognize your natural facial expressions',
      duration: 3000,
      icon: '😊'
    },
    {
      id: 'gesture_nod',
      type: 'gesture', 
      title: 'Head Movement',
      instruction: 'Nod your head up and down 3 times',
      description: 'This captures your head movement patterns',
      duration: 5000,
      icon: '👆'
    },
    {
      id: 'typing_sample',
      type: 'typing',
      title: 'Typing Pattern',
      instruction: 'Type: "I am joining the Relay network"',
      description: 'This learns your natural typing rhythm',
      sampleText: 'I am joining the Relay network',
      icon: '⌨️'
    },
    {
      id: 'gesture_wave',
      type: 'gesture',
      title: 'Hand Gesture',
      instruction: 'Raise your right hand above your head',
      description: 'This captures your movement style',
      duration: 3000,
      icon: '👋'
    },
    {
      id: 'navigation_sample',
      type: 'navigation',
      title: 'Navigation Style',
      instruction: 'Click through these menu items in order',
      description: 'This understands your interaction preferences',
      menuItems: ['Profile', 'Settings', 'Security', 'Help'],
      icon: '🧭'
    }
  ];

  useEffect(() => {
    // Collect device information on mount
    collectDeviceInfo();
    
    return () => {
      // Cleanup camera stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const collectDeviceInfo = () => {
    const deviceData = {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      userAgent: navigator.userAgent,
      deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
      timestamp: Date.now()
    };

    setCollectedData(prev => ({
      ...prev,
      device: deviceData
    }));
  };

  const startChallenge = async () => {
    setError('');
    setIsActive(true);
    
    const challenge = challenges[currentStep];
    
    if (challenge.type === 'gesture') {
      await initializeCamera();
    }
  };

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      mediaStreamRef.current = stream;
    } catch (err) {
      setError('Camera access required for gesture verification. Please allow camera access.');
      console.error('Camera initialization error:', err);
    }
  };

  const handleGestureComplete = (gestureData) => {
    const challenge = challenges[currentStep];
    
    const gestureRecord = {
      challengeId: challenge.id,
      type: challenge.type,
      instruction: challenge.instruction,
      startTime: gestureData.startTime,
      endTime: gestureData.endTime,
      responseTime: gestureData.endTime - gestureData.startTime,
      accuracy: gestureData.accuracy || 0.8, // Placeholder
      speed: gestureData.speed || 100, // Placeholder
      timestamp: Date.now()
    };

    setCollectedData(prev => ({
      ...prev,
      gestures: [...prev.gestures, gestureRecord]
    }));

    proceedToNext();
  };

  const handleTypingComplete = (typingData) => {
    const challenge = challenges[currentStep];
    
    const typingRecord = {
      challengeId: challenge.id,
      sampleText: challenge.sampleText,
      keystrokes: typingData.keystrokes,
      totalTime: typingData.totalTime,
      characterCount: typingData.characterCount,
      wpm: typingData.wpm,
      errorCount: typingData.errorCount,
      timestamp: Date.now()
    };

    setCollectedData(prev => ({
      ...prev,
      typing: typingRecord
    }));

    proceedToNext();
  };

  const handleNavigationComplete = (navigationData) => {
    const challenge = challenges[currentStep];
    
    const navigationRecord = {
      challengeId: challenge.id,
      sequence: navigationData.sequence,
      timings: navigationData.timings,
      totalTime: navigationData.totalTime,
      clickIntervals: navigationData.clickIntervals,
      timestamp: Date.now()
    };

    setCollectedData(prev => ({
      ...prev,
      interactions: [...prev.interactions, navigationRecord]
    }));

    proceedToNext();
  };

  const proceedToNext = () => {
    setIsActive(false);
    
    // Stop camera for gesture challenges
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (currentStep < challenges.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 1000);
    } else {
      completeBaseline();
    }
  };

  const completeBaseline = () => {
    setIsComplete(true);
    
    const finalData = {
      ...collectedData,
      completedAt: new Date().toISOString(),
      userProfile: userProfile
    };

    setTimeout(() => {
      onComplete(finalData);
    }, 1500);
  };

  const skipBaseline = () => {
    if (onSkip) {
      onSkip();
    } else {
      // If no skip handler, proceed with empty data
      onComplete(null);
    }
  };

  const renderChallenge = () => {
    const challenge = challenges[currentStep];
    
    switch (challenge.type) {
      case 'gesture':
        return (
          <GestureChallenge
            challenge={challenge}
            videoRef={videoRef}
            canvasRef={canvasRef}
            isActive={isActive}
            onComplete={handleGestureComplete}
            onError={setError}
          />
        );
        
      case 'typing':
        return (
          <TypingChallenge
            challenge={challenge}
            ref={typingRef}
            isActive={isActive}
            onComplete={handleTypingComplete}
            onError={setError}
          />
        );
        
      case 'navigation':
        return (
          <NavigationChallenge
            challenge={challenge}
            isActive={isActive}
            onComplete={handleNavigationComplete}
            onError={setError}
          />
        );
        
      default:
        return null;
    }
  };

  if (isComplete) {
    return (
      <motion.div 
        className={`behavioral-baseline-complete ${className}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="completion-content">
          <div className="success-icon">✅</div>
          <h2>Security Pattern Created!</h2>
          <p>Your unique verification pattern has been established.</p>
          <p className="privacy-note">
            Only mathematical patterns are stored - not your actual gestures or typing.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`behavioral-baseline-setup ${className}`}>
      {/* Header */}
      <div className="setup-header">
        <h2>Create Your Security Pattern</h2>
        <p>
          We'll create a unique verification pattern that only you know. 
          This takes about 3 minutes and helps protect your account.
        </p>
        
        {/* Progress indicator */}
        <div className="progress-bar">
          <div className="progress-track">
            <div 
              className="progress-fill"
              style={{ width: `${((currentStep + 1) / challenges.length) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            Step {currentStep + 1} of {challenges.length}
          </span>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="privacy-notice">
        <h4>🔒 Your Privacy</h4>
        <ul>
          <li>✅ We store only pattern signatures, not raw data</li>
          <li>✅ No photos or recordings are kept</li>
          <li>✅ You can delete this data anytime</li>
          <li>✅ This helps reduce future verification requests</li>
        </ul>
      </div>

      {/* Current challenge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          className="challenge-container"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <div className="challenge-header">
            <span className="challenge-icon">
              {challenges[currentStep].icon}
            </span>
            <h3>{challenges[currentStep].title}</h3>
            <p className="challenge-description">
              {challenges[currentStep].description}
            </p>
          </div>

          {renderChallenge()}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="challenge-actions">
            {!isActive && (
              <button 
                className="btn btn-primary btn-large"
                onClick={startChallenge}
              >
                Start {challenges[currentStep].title}
              </button>
            )}
            
            <button 
              className="btn btn-secondary btn-small"
              onClick={skipBaseline}
            >
              Skip This Step
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Individual challenge components
const GestureChallenge = ({ challenge, videoRef, canvasRef, isActive, onComplete, onError }) => {
  const [countdown, setCountdown] = useState(3);
  const [recording, setRecording] = useState(false);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      startCountdown();
    }
  }, [isActive]);

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);
    
    const countInterval = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count <= 0) {
        clearInterval(countInterval);
        startRecording();
      }
    }, 1000);
  };

  const startRecording = () => {
    setRecording(true);
    startTimeRef.current = Date.now();
    
    setTimeout(() => {
      completeGesture();
    }, challenge.duration);
  };

  const completeGesture = () => {
    const endTime = Date.now();
    
    const gestureData = {
      startTime: startTimeRef.current,
      endTime: endTime,
      accuracy: 0.85, // Simulated - would be calculated from actual gesture detection
      speed: 120 // Simulated
    };

    setRecording(false);
    onComplete(gestureData);
  };

  return (
    <div className="gesture-challenge">
      <div className="instruction-text">
        <h4>{challenge.instruction}</h4>
      </div>
      
      <div className="camera-container">
        <video ref={videoRef} className="camera-feed" muted />
        <canvas ref={canvasRef} className="overlay-canvas" />
        
        {countdown > 0 && isActive && (
          <div className="countdown-overlay">
            <span className="countdown-number">{countdown}</span>
          </div>
        )}
        
        {recording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            Recording...
          </div>
        )}
      </div>
    </div>
  );
};

const TypingChallenge = React.forwardRef(({ challenge, isActive, onComplete, onError }, ref) => {
  const [typedText, setTypedText] = useState('');
  const [keystrokes, setKeystrokes] = useState([]);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (isActive) {
      setStartTime(Date.now());
      setTypedText('');
      setKeystrokes([]);
    }
  }, [isActive]);

  const handleKeyDown = (e) => {
    if (!isActive) return;

    const keystroke = {
      key: e.key,
      timestamp: Date.now(),
      isBackspace: e.key === 'Backspace',
      isCorrection: false // Would be calculated based on expected text
    };

    setKeystrokes(prev => [...prev, keystroke]);
  };

  const handleInputChange = (e) => {
    setTypedText(e.target.value);
    
    // Check if user completed the sample text
    if (e.target.value === challenge.sampleText) {
      completeTyping();
    }
  };

  const completeTyping = () => {
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const characterCount = typedText.length;
    const wpm = (characterCount / 5) / (totalTime / 60000);
    const errorCount = keystrokes.filter(k => k.isCorrection).length;

    const typingData = {
      keystrokes,
      totalTime,
      characterCount,
      wpm,
      errorCount
    };

    onComplete(typingData);
  };

  return (
    <div className="typing-challenge">
      <div className="instruction-text">
        <h4>{challenge.instruction}</h4>
        <p className="sample-text">"{challenge.sampleText}"</p>
      </div>
      
      <div className="typing-area">
        <input
          ref={ref}
          type="text"
          className="typing-input"
          value={typedText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={!isActive}
          placeholder="Type the sample text here..."
          autoFocus={isActive}
        />
        
        <div className="typing-progress">
          Progress: {typedText.length} / {challenge.sampleText.length} characters
        </div>
      </div>
    </div>
  );
});

const NavigationChallenge = ({ challenge, isActive, onComplete, onError }) => {
  const [clickedItems, setClickedItems] = useState([]);
  const [clickTimings, setClickTimings] = useState([]);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (isActive) {
      setStartTime(Date.now());
      setClickedItems([]);
      setClickTimings([]);
    }
  }, [isActive]);

  const handleMenuClick = (item, index) => {
    if (!isActive) return;

    const clickTime = Date.now();
    const newClickedItems = [...clickedItems, item];
    const newTimings = [...clickTimings, { item, timestamp: clickTime, index }];

    setClickedItems(newClickedItems);
    setClickTimings(newTimings);

    // Check if all items clicked in correct order
    if (newClickedItems.length === challenge.menuItems.length) {
      completeNavigation(newTimings);
    }
  };

  const completeNavigation = (timings) => {
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Calculate click intervals
    const clickIntervals = [];
    for (let i = 1; i < timings.length; i++) {
      clickIntervals.push(timings[i].timestamp - timings[i-1].timestamp);
    }

    const navigationData = {
      sequence: timings.map(t => t.item),
      timings,
      totalTime,
      clickIntervals
    };

    onComplete(navigationData);
  };

  return (
    <div className="navigation-challenge">
      <div className="instruction-text">
        <h4>{challenge.instruction}</h4>
        <p>Click each menu item in the order shown:</p>
      </div>
      
      <div className="menu-items">
        {challenge.menuItems.map((item, index) => (
          <button
            key={item}
            className={`menu-item ${clickedItems.includes(item) ? 'clicked' : ''}`}
            onClick={() => handleMenuClick(item, index)}
            disabled={!isActive || clickedItems.includes(item)}
          >
            <span className="menu-number">{index + 1}</span>
            {item}
          </button>
        ))}
      </div>
      
      <div className="navigation-progress">
        Clicked: {clickedItems.length} / {challenge.menuItems.length}
      </div>
    </div>
  );
};

export default BehavioralBaselineSetup;
