import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../../services/apiClient';
import InviteCodeStep from './InviteCodeStep';
import BiometricEnrollmentStep from './BiometricEnrollmentStep';
import TrustOnboardingStatus from './TrustOnboardingStatus';
import PersonhoodVerificationStep from './PersonhoodVerificationStep';
import ProfileSetupStep from './ProfileSetupStep';
import { useAuth } from '../../hooks/useAuth.jsx';
import './OnboardingFlow.css';

export function OnboardingFlow() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);  const [onboardingData, setOnboardingData] = useState({
    inviteCode: '',
    biometricData: null,
    trustProfile: null,
    personhoodVerified: false,
    profile: {
      name: '',
      email: '',
      password: ''
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Update onboarding data
  const updateData = (key, value) => {
    setOnboardingData(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle invite code verification
  const handleInviteCodeVerified = (inviteData) => {
    updateData('inviteCode', inviteData.code);
    nextStep();
  };
  
  // Handle biometric enrollment
  const handleBiometricEnrolled = (biometricData) => {
    updateData('biometricData', biometricData);
    nextStep();
  };
  // Handle trust onboarding completion
  const handleTrustOnboardingCompleted = (trustProfile) => {
    updateData('trustProfile', trustProfile);
    nextStep();
  };
  
  // Handle personhood verification
  const handlePersonhoodVerified = () => {
    updateData('personhoodVerified', true);
    nextStep();
  };
  
  // Handle profile setup
  const handleProfileSetup = async (profileData) => {
    updateData('profile', profileData);
    
    // Complete enhanced onboarding with behavioral data
    try {
      setIsSubmitting(true);
      setError(null);
        const result = await apiPost('/onboarding/complete-enhanced', {
        inviteCode: onboardingData.inviteCode,
        biometricData: onboardingData.biometricData,
        trustProfile: onboardingData.trustProfile,
        profile: profileData
      });
      
      if (result.success) {
        // Log in the user
        await login(profileData.email, profileData.password);
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(result.message || 'Failed to complete onboarding');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Next step
  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };
  
  // Previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };
  
  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <InviteCodeStep onVerified={handleInviteCodeVerified} />;
      case 1:
        return <BiometricEnrollmentStep onEnrolled={handleBiometricEnrolled} />;      case 2:
        return <TrustOnboardingStatus onCompleted={handleTrustOnboardingCompleted} />;
      case 3:
        return <PersonhoodVerificationStep onVerified={handlePersonhoodVerified} />;
      case 4:
        return (
          <ProfileSetupStep 
            onSubmit={handleProfileSetup} 
            isSubmitting={isSubmitting}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };
  
  return (
    <div className="onboarding-flow">
      <div className="onboarding-progress">
        <div className="progress-bar">
          <div 
            className="progress-indicator"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
        <div className="steps-indicator">
          Step {currentStep + 1} of 5
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="onboarding-step-container">
        {renderStep()}
      </div>
      
      <div className="onboarding-navigation">
        {currentStep > 0 && (
          <button 
            className="prev-button" 
            onClick={prevStep}
            disabled={isSubmitting}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}

export default OnboardingFlow;
