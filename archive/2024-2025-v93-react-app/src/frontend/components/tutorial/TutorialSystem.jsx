// frontend/components/tutorial/TutorialSystem.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import './TutorialSystem.css';

const TutorialSystem = ({ onComplete, showOnFirstVisit = true }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [interactionData, setInteractionData] = useState({});

  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Relay',
      content: 'Relay is a sybil-resistant democratic voting platform that ensures authentic community participation.',
      target: '.dashboard-header',
      position: 'bottom'
    },
    {
      id: 'sybil-resistance',
      title: 'Sybil Resistance Explained',
      content: 'Our multi-layered approach prevents fake accounts and vote manipulation through biometric verification, activity analysis, and blockchain recording.',
      target: '.biometric-status',
      position: 'bottom',
      interactive: true,
      demo: 'sybil-resistance'
    },
    {
      id: 'biometric-auth',
      title: 'Biometric Authentication',
      content: 'Your unique biometric signature ensures one person = one vote. We use secure device fingerprinting and behavior analysis.',
      target: '.biometric-status',
      position: 'bottom',
      interactive: true,
      demo: 'biometric-demo'
    },
    {
      id: 'activity-analysis',
      title: 'Activity Analysis',
      content: 'Our AI monitors voting patterns and behavior to detect suspicious activity. The 25th percentile threshold filters out low-engagement accounts.',
      target: '.user-activity-analytics',
      position: 'left',
      interactive: true,
      demo: 'activity-analysis'
    },
    {
      id: 'microsharding',
      title: 'Microsharding Technology',
      content: 'Votes are distributed across multiple blockchains for enhanced security and to prevent single points of failure.',
      target: '.microsharding-visualization',
      position: 'top',
      interactive: true,
      demo: 'microsharding'
    },
    {
      id: 'regional-weighting',
      title: 'Regional Vote Weighting',
      content: 'Local votes carry more weight (1.0x) than adjacent (0.5x) or distant (0.1x) regions to prevent geographic manipulation.',
      target: '.regional-heatmap',
      position: 'top',
      interactive: true,
      demo: 'regional-weighting'
    },
    {
      id: 'real-time-monitoring',
      title: 'Real-time Monitoring',
      content: 'Live dashboards show voting activity, momentum tracking, and system health to maintain transparency.',
      target: '.overview-grid',
      position: 'bottom'
    },
    {
      id: 'community-filters',
      title: 'Community Filters',
      content: 'The community votes on the top 20 filters to customize how data is displayed and analyzed.',
      target: '.filter-system',
      position: 'top'
    }
  ];

  // Check if user has seen tutorial
  useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        const response = await fetch(`/api/user/tutorial-status/${user}`);
        if (response.ok) {
          const data = await response.json();
          setHasSeenTutorial(data.hasSeenTutorial);
          if (showOnFirstVisit && !data.hasSeenTutorial) {
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error('Failed to check tutorial status:', error);
      }
    };

    if (user) {
      checkTutorialStatus();
    }
  }, [user, showOnFirstVisit]);

  // Navigate tutorial steps
  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      trackInteraction('next_step', currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      trackInteraction('prev_step', currentStep - 1);
    }
  };

  const skipTutorial = () => {
    trackInteraction('skip_tutorial', currentStep);
    completeTutorial();
  };

  const completeTutorial = async () => {
    try {
      await fetch('/api/user/complete-tutorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user, 
          completedAt: new Date().toISOString(),
          interactionData 
        })
      });
      setHasSeenTutorial(true);
      setIsVisible(false);
      onComplete?.();
    } catch (error) {
      console.error('Failed to mark tutorial as complete:', error);
    }
  };

  // Track user interactions for analytics
  const trackInteraction = (action, stepIndex) => {
    const step = tutorialSteps[stepIndex];
    setInteractionData(prev => ({
      ...prev,
      [step.id]: {
        ...prev[step.id],
        [action]: Date.now(),
        timeSpent: Date.now() - (prev[step.id]?.startTime || Date.now())
      }
    }));
  };

  // Start step timer
  useEffect(() => {
    if (isVisible) {
      const step = tutorialSteps[currentStep];
      setInteractionData(prev => ({
        ...prev,
        [step.id]: {
          ...prev[step.id],
          startTime: Date.now()
        }
      }));
    }
  }, [currentStep, isVisible]);

  // Demo functions for interactive steps
  const runDemo = (demoType) => {
    switch (demoType) {
      case 'sybil-resistance':
        showSybilResistanceDemo();
        break;
      case 'biometric-demo':
        showBiometricDemo();
        break;
      case 'activity-analysis':
        showActivityAnalysisDemo();
        break;
      case 'microsharding':
        showMicroshardingDemo();
        break;
      case 'regional-weighting':
        showRegionalWeightingDemo();
        break;
      default:
        break;
    }
  };

  const showSybilResistanceDemo = () => {
    // Simulate sybil detection process
    const demoData = [
      { step: 'Biometric Check', status: 'verified', icon: '✓' },
      { step: 'Device Fingerprint', status: 'unique', icon: '✓' },
      { step: 'Activity Pattern', status: 'human-like', icon: '✓' },
      { step: 'Network Analysis', status: 'legitimate', icon: '✓' }
    ];
    
    // This would trigger a visual demo in the UI
    console.log('Sybil Resistance Demo:', demoData);
  };

  const showBiometricDemo = () => {
    // Simulate biometric verification process
    console.log('Biometric Demo: Showing fingerprint scanning animation');
  };

  const showActivityAnalysisDemo = () => {
    // Simulate activity analysis visualization
    console.log('Activity Analysis Demo: Showing behavior pattern analysis');
  };

  const showMicroshardingDemo = () => {
    // Simulate microsharding process
    console.log('Microsharding Demo: Showing vote distribution across shards');
  };

  const showRegionalWeightingDemo = () => {
    // Simulate regional weighting calculation
    console.log('Regional Weighting Demo: Showing vote weight calculations');
  };

  if (!isVisible) {
    return (
      <button 
        className="tutorial-trigger"
        onClick={() => setIsVisible(true)}
        title="Restart Tutorial"
      >
        ?
      </button>
    );
  }

  const currentTutorialStep = tutorialSteps[currentStep];

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-backdrop" onClick={skipTutorial} />
      
      <div className="tutorial-card">
        <div className="tutorial-header">
          <h3>{currentTutorialStep.title}</h3>
          <button 
            className="tutorial-close"
            onClick={skipTutorial}
          >
            ×
          </button>
        </div>
        
        <div className="tutorial-body">
          <p>{currentTutorialStep.content}</p>
          
          {currentTutorialStep.interactive && (
            <div className="tutorial-demo">
              <button 
                className="demo-button"
                onClick={() => runDemo(currentTutorialStep.demo)}
              >
                Show Interactive Demo
              </button>
            </div>
          )}
        </div>
        
        <div className="tutorial-footer">
          <div className="tutorial-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
            <span className="progress-text">
              {currentStep + 1} of {tutorialSteps.length}
            </span>
          </div>
          
          <div className="tutorial-controls">
            {currentStep > 0 && (
              <button className="btn-secondary" onClick={prevStep}>
                Previous
              </button>
            )}
            
            <button className="btn-ghost" onClick={skipTutorial}>
              Skip Tutorial
            </button>
            
            <button className="btn-primary" onClick={nextStep}>
              {currentStep === tutorialSteps.length - 1 ? 'Complete' : 'Next'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Highlight target element */}
      <style>
        {`
          ${currentTutorialStep.target} {
            position: relative;
            z-index: 1001;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
            border-radius: 8px;
          }
        `}
      </style>
    </div>
  );
};

export default TutorialSystem;
