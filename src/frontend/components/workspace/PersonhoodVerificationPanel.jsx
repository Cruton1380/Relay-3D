/**
 * PersonhoodVerificationPanel - Simplified personhood verification component
 * Base Model 1 workspace integration
 */
import React, { useState, useEffect } from 'react';

const PersonhoodVerificationPanel = ({ 
  panelId, 
  title, 
  type, 
  verificationState, 
  onStartChallenge, 
  onSubmitAnswer 
}) => {
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [challengeHistory, setChallengeHistory] = useState([]);

  const challenges = [
    {
      id: 'math_1',
      type: 'mathematical',
      question: 'What is 7 × 8 + 3?',
      answer: '59',
      difficulty: 'easy'
    },
    {
      id: 'logic_1',
      type: 'logical',
      question: 'If all roses are flowers and some flowers are red, what can we conclude about roses?',
      answer: 'some roses may be red',
      difficulty: 'medium'
    },
    {
      id: 'pattern_1',
      type: 'pattern',
      question: 'Complete the sequence: 2, 4, 8, 16, __',
      answer: '32',
      difficulty: 'medium'
    }
  ];

  const startNewChallenge = () => {
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    setCurrentChallenge(challenge);
    setUserAnswer('');
    if (onStartChallenge) {
      onStartChallenge(challenge);
    }
    console.log('🧩 New challenge started:', challenge.question);
  };

  const submitAnswer = () => {
    if (!currentChallenge || !userAnswer.trim()) return;
    
    const isCorrect = userAnswer.toLowerCase().trim() === currentChallenge.answer.toLowerCase();
    
    const result = {
      challengeId: currentChallenge.id,
      question: currentChallenge.question,
      userAnswer: userAnswer,
      correctAnswer: currentChallenge.answer,
      isCorrect,
      timestamp: new Date().toISOString()
    };
    
    setChallengeHistory(prev => [result, ...prev.slice(0, 4)]);
    
    if (onSubmitAnswer) {
      onSubmitAnswer(result);
    }
    
    console.log(`✅ Answer submitted: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
    
    // Clear current challenge after submission
    setTimeout(() => {
      setCurrentChallenge(null);
      setUserAnswer('');
    }, 2000);
  };

  const getVerificationStatus = () => {
    if (!challengeHistory.length) return 'not_started';
    const correctCount = challengeHistory.filter(c => c.isCorrect).length;
    const totalCount = challengeHistory.length;
    
    if (totalCount < 3) return 'in_progress';
    if (correctCount >= 2) return 'verified';
    return 'failed';
  };

  const status = getVerificationStatus();
  const statusColors = {
    not_started: '#6b7280',
    in_progress: '#f59e0b',
    verified: '#10b981',
    failed: '#ef4444'
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#ffffff' }}>
          {title || 'Personhood Verification'}
        </h3>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
          Human verification through interactive challenges
        </p>
      </div>

      {/* Status Display */}
      <div style={{ 
        padding: '12px', 
        backgroundColor: 'rgba(45, 45, 45, 0.5)',
        borderRadius: '6px',
        marginBottom: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '8px' 
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: statusColors[status],
            marginRight: '8px'
          }} />
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '500',
            color: statusColors[status]
          }}>
            {status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          Challenges completed: {challengeHistory.length}/3
        </div>
      </div>

      {/* Current Challenge */}
      {currentChallenge && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: 'rgba(30, 30, 30, 0.5)',
          borderRadius: '6px',
          marginBottom: '12px'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Challenge ({currentChallenge.difficulty}):
            </span>
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#ffffff', 
            marginBottom: '12px',
            fontWeight: '500'
          }}>
            {currentChallenge.question}
          </div>
          
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Enter your answer..."
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'rgba(20, 20, 20, 0.8)',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '12px',
              marginBottom: '8px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
          />
          
          <button
            onClick={submitAnswer}
            disabled={!userAnswer.trim()}
            style={{
              padding: '6px 12px',
              backgroundColor: userAnswer.trim() ? '#3b82f6' : '#4b5563',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: userAnswer.trim() ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Start Challenge Button */}
      {!currentChallenge && (
        <div style={{ marginBottom: '12px' }}>
          <button
            onClick={startNewChallenge}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Start New Challenge
          </button>
        </div>
      )}

      {/* Challenge History */}
      {challengeHistory.length > 0 && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Recent Challenges:
          </div>
          {challengeHistory.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(30, 30, 30, 0.3)',
                borderRadius: '4px',
                marginBottom: '6px',
                borderLeft: `3px solid ${result.isCorrect ? '#10b981' : '#ef4444'}`
              }}
            >
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                {new Date(result.timestamp).toLocaleTimeString()}
              </div>
              <div style={{ fontSize: '12px', color: '#ffffff', marginBottom: '2px' }}>
                Q: {result.question}
              </div>
              <div style={{ fontSize: '11px', color: result.isCorrect ? '#10b981' : '#ef4444' }}>
                A: {result.userAnswer} {result.isCorrect ? '✓' : '✗'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PersonhoodVerificationPanel; 