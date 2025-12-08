import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { apiGet, apiPost } from "../services/apiClient";

const OnboardingFlowPage = () => {
  const [founderModeConfig, setFounderModeConfig] = useState(null);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    isFounder: false
  });

  useEffect(() => {
    loadFounderModeConfig();
  }, []);

  const loadFounderModeConfig = async () => {
    try {
      const response = await apiGet('/founder-mode/status');
      if (response.success) {
        setFounderModeConfig(response.config);
      }
    } catch (err) {
      console.error('Failed to load founder mode config:', err);
      // Set default config when backend is not available
      setFounderModeConfig({
        enabled: false,
        founderId: null,
        securityToggles: {
          proximityVerification: { enabled: true, canBypass: true },
          biometricScanning: { enabled: true, canBypass: false },
          deviceBinding: { enabled: true, canBypass: true },
          trustProfile: { enabled: true, canBypass: false },
          dwellTimeVerification: { enabled: true, canBypass: true }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const startFounderBootstrap = async () => {
    try {
      setLoading(true);
      setError(null);

      // Enable founder mode if not already enabled
      if (!founderModeConfig?.enabled) {
        const enableResponse = await apiPost('/founder-mode/enable', {
          founderId: `founder_${Date.now()}`
        });
        
        if (!enableResponse.success) {
          throw new Error('Failed to enable founder mode');
        }
      }

      // Proceed to founder-specific onboarding
      setCurrentStep('founder-setup');
    } catch (err) {
      console.error('Founder bootstrap error:', err);
      // If API is not available, allow offline founder setup
      if (err.message.includes('Failed to fetch') || err.message.includes('CONNECTION_REFUSED')) {
        setError('Backend service not available. Continuing with offline founder setup...');
        setTimeout(() => {
          setError(null);
          setCurrentStep('founder-setup');
        }, 2000);
      } else {
        setError(err.message || 'Failed to start founder setup');
      }
    } finally {
      setLoading(false);
    }
  };

  const proceedWithRegularOnboarding = () => {
    setCurrentStep('proximity-verification');
  };

  const completeFounderSetup = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to call backend API, but fallback to local processing
      try {
        const response = await apiPost('/founder-mode/bootstrap', {
          userData: {
            ...userData,
            isFounder: true
          },
          skipProximity: true
        });

        if (response.success) {
          // Redirect to dashboard or next step
          window.location.href = '/dashboard?founder=true';
          return;
        }
      } catch (apiError) {
        console.warn('API not available, proceeding with local founder setup:', apiError);
      }

      // Fallback: Local founder account creation
      const founderData = {
        id: `founder_${Date.now()}`,
        name: userData.name,
        email: userData.email,
        isFounder: true,
        createdAt: new Date().toISOString(),
        privileges: ['bypass_proximity', 'admin_access', 'invite_users', 'configure_security']
      };

      // Store in localStorage as fallback
      localStorage.setItem('founderAccount', JSON.stringify(founderData));
      localStorage.setItem('authToken', `founder_token_${Date.now()}`);
      
      // Simulate successful completion
      setTimeout(() => {
        window.location.href = '/dashboard?founder=true';
      }, 1000);

    } catch (err) {
      setError(err.message || 'Failed to complete founder setup');
    } finally {
      setLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Welcome to Relay</h1>
        <p className="text-xl text-white/90">
          {founderModeConfig?.enabled 
            ? "Continue your secure onboarding process"
            : "Choose how you'd like to join the democratic network"
          }
        </p>
      </div>

      {!founderModeConfig?.enabled && (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-white mb-2">First User? Start in Founder Mode</h3>
              <p className="text-white/80">
                If you're the first person setting up this Relay network, you can bootstrap the system 
                without requiring proximity verification from existing users.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Regular Onboarding Option */}
        <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM11 19.93C7.05 19.44 4 16.08 4 12C4 11.38 4.08 10.79 4.21 10.21L9 15V16C9 17.1 9.9 18 11 18V19.93ZM17.9 17.39C17.64 16.58 16.9 16 16 16H15V13C15 12.45 14.55 12 14 12H8V10H10C10.55 10 11 9.55 11 9V7H13C14.1 7 15 6.1 15 5V4.59C17.93 5.77 20 8.65 20 12C20 14.08 19.2 15.97 17.9 17.39Z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Regular User</h3>
            <p className="text-secondary">Join through an existing Relay user</p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary-blue text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-1">Proximity Verification</h4>
                <p className="text-secondary text-sm">Be near someone already on Relay</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-500 mb-1">Biometric Setup</h4>
                <p className="text-gray-500 text-sm">Secure biometric verification</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-500 mb-1">Join Community</h4>
                <p className="text-gray-500 text-sm">Access channels and voting</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={proceedWithRegularOnboarding}
            className="w-full btn btn-primary"
          >
            Continue as Regular User
          </button>
        </div>

        {/* Founder Mode Option */}
        {!founderModeConfig?.enabled && (
          <div className="bg-white rounded-xl shadow-xl p-8 border border-orange-200">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Founder Mode</h3>
              <p className="text-secondary">Bootstrap the network as the first user</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 mb-6 border border-orange-200">
              <div className="text-primary">
                <p className="font-semibold mb-3 text-orange-700">Founder Benefits:</p>
                <ul className="space-y-2 text-sm text-orange-800">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    Skip proximity verification
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    Configure security settings
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    Invite initial users
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    Access admin features
                  </li>
                </ul>
              </div>
            </div>
            
            <button 
              onClick={startFounderBootstrap}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-yellow-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Setting up...
                </span>
              ) : 'Start as Founder'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
            </svg>
            <div className="text-red-800 text-sm font-medium">{error}</div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFounderSetup = () => (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Founder Account Setup</h1>
        <p className="text-xl text-white/90">Complete your profile to bootstrap the Relay network</p>
      </div>

      <div className="bg-white rounded-xl shadow-xl p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-primary mb-3">
              Full Name *
            </label>
            <input
              type="text"
              value={userData.name}
              onChange={(e) => setUserData({...userData, name: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-colors"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-3">
              Email Address *
            </label>
            <input
              type="email"
              value={userData.email}
              onChange={(e) => setUserData({...userData, email: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-colors"
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <h3 className="font-bold text-primary mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"/>
              </svg>
              Founder Privileges
            </h3>
            <ul className="text-sm text-primary space-y-2">
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                </svg>
                Proximity verification will be bypassed
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                </svg>
                You'll have admin access to security settings
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                </svg>
                You can invite and approve new users
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                </svg>
                Full access to governance and voting systems
              </li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
                </svg>
                <div className="text-red-800 text-sm font-medium">{error}</div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setCurrentStep('welcome')}
              className="flex-1 btn btn-secondary"
            >
              Back
            </button>
            <button
              onClick={completeFounderSetup}
              disabled={loading || !userData.name || !userData.email}
              className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-yellow-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : 'Complete Setup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProximityVerification = () => (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Proximity Verification Required</h1>
        <p className="text-xl text-white/90">Find an existing Relay user near you to continue</p>
      </div>

      <div className="bg-white rounded-xl shadow-xl p-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM11 19.93C7.05 19.44 4 16.08 4 12C4 11.38 4.08 10.79 4.21 10.21L9 15V16C9 17.1 9.9 18 11 18V19.93ZM17.9 17.39C17.64 16.58 16.9 16 16 16H15V13C15 12.45 14.55 12 14 12H8V10H10C10.55 10 11 9.55 11 9V7H13C14.1 7 15 6.1 15 5V4.59C17.93 5.77 20 8.65 20 12C20 14.08 19.2 15.97 17.9 17.39Z"/>
            </svg>
          </div>
          
          <p className="text-secondary text-lg mb-8 leading-relaxed">
            To maintain network security, new users must be verified by someone already on Relay. 
            Please be within 5 meters of an existing user and ask them to help with your verification.
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-orange-600 mr-3 mt-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
              </svg>
              <div>
                <p className="text-orange-800 font-semibold mb-2">First User in Your Area?</p>
                <p className="text-orange-700 text-sm">
                  If you're the first user in your area, you may need to enable Founder Mode 
                  to bootstrap the network.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCurrentStep('welcome')}
            className="btn btn-secondary"
          >
            Back to Options
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-blue to-secondary-blue flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'founder-setup':
        return renderFounderSetup();
      case 'proximity-verification':
        return renderProximityVerification();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <>
      <Helmet>
        <title>Onboarding - Relay</title>
        <meta name="description" content="Welcome to Relay - Complete your onboarding process" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-primary-blue to-secondary-blue py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {renderCurrentStep()}
        </div>
      </div>
    </>
  );
};

export default OnboardingFlowPage; 