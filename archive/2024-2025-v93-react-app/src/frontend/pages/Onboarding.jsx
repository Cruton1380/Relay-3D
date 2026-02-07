import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import onboardingService from '../services/onboardingService';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [inviteValid, setInviteValid] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check if user is already onboarded
  useEffect(() => {
    if (onboardingService.isOnboarded()) {
      navigate('/dashboard');
    } else {
      // Get invite code from URL if available
      const urlInviteCode = onboardingService.getInviteCodeFromURL();
      if (urlInviteCode) {
        setInviteCode(urlInviteCode);
        validateInviteCode(urlInviteCode);
      } else {
        setLoading(false);
      }
    }
  }, [navigate]);
  
  const validateInviteCode = async (code) => {
    try {
      setLoading(true);
      const result = await onboardingService.verifyInvite(code);
      setInviteValid(result.valid);
    } catch (error) {
      console.error('Error validating invite code:', error);
      setInviteValid(false);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="onboarding-page">
      <h1>Welcome to Relay Platform</h1>
      <p>Complete the steps below to set up your account</p>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <OnboardingFlow 
          inviteCode={inviteCode}
          inviteValid={inviteValid}
          onInviteCodeChange={(code) => setInviteCode(code)}
          onValidateInvite={validateInviteCode}
        />
      )}
    </div>
  );
};

export default OnboardingPage;
