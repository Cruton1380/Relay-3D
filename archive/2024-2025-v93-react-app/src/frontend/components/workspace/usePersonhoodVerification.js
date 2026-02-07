/**
 * usePersonhoodVerification - Hook for personhood verification system
 * Base Model 1 workspace integration
 */
import { useState, useCallback } from 'react';

export const VERIFICATION_STATE = {
  IDLE: 'idle',
  CHALLENGING: 'challenging',
  VERIFIED: 'verified',
  FAILED: 'failed'
};

export const CHALLENGE_TYPE = {
  MATHEMATICAL: 'mathematical',
  LOGICAL: 'logical',
  PATTERN: 'pattern',
  CAPTCHA: 'captcha'
};

const usePersonhoodVerification = () => {
  const [verificationState, setVerificationState] = useState(VERIFICATION_STATE.IDLE);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [challengeHistory, setChallengeHistory] = useState([]);
  const [score, setScore] = useState(0);

  const startChallenge = useCallback((challenge) => {
    setVerificationState(VERIFICATION_STATE.CHALLENGING);
    setCurrentChallenge(challenge);
    console.log('🧩 Challenge started:', challenge);
  }, []);

  const submitAnswer = useCallback((result) => {
    setChallengeHistory(prev => [result, ...prev]);
    
    if (result.isCorrect) {
      setScore(prev => prev + 1);
    }
    
    // Check if verification is complete
    const totalChallenges = challengeHistory.length + 1;
    const correctAnswers = score + (result.isCorrect ? 1 : 0);
    
    if (totalChallenges >= 3) {
      if (correctAnswers >= 2) {
        setVerificationState(VERIFICATION_STATE.VERIFIED);
        console.log('✅ Personhood verification successful');
      } else {
        setVerificationState(VERIFICATION_STATE.FAILED);
        console.log('❌ Personhood verification failed');
      }
    }
    
    setCurrentChallenge(null);
  }, [challengeHistory.length, score]);

  const resetVerification = useCallback(() => {
    setVerificationState(VERIFICATION_STATE.IDLE);
    setCurrentChallenge(null);
    setChallengeHistory([]);
    setScore(0);
    console.log('🔄 Verification reset');
  }, []);

  return {
    verificationState,
    currentChallenge,
    challengeHistory,
    score,
    startChallenge,
    submitAnswer,
    resetVerification
  };
};

export default usePersonhoodVerification; 