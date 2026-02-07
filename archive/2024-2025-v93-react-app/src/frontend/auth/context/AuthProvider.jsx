import React, { createContext, useState, useEffect } from 'react';
import sessionManager from '../../services/sessionManager';
import * as authAPI from '../api/authAPI';

// Create the context
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: null,
    authLevel: 'none',
    loading: true,
    error: null
  });

  useEffect(() => {
    const initializeAuth = async () => {
      const initialized = sessionManager.initialize();
      
      if (initialized) {
        setAuthState({
          isAuthenticated: true,
          user: sessionManager.user,
          token: sessionManager.token,
          authLevel: sessionManager.authLevel,
          loading: false,
          error: null
        });
        
        // Start session sync
        sessionManager.startSessionSync(setAuthState);
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          authLevel: 'none',
          loading: false,
          error: null
        });
      }
    };
    
    initializeAuth();
    
    // Clean up session sync on unmount
    return () => {
      sessionManager.stopSessionSync();
    };
  }, []);

  // Track user activity to prevent session timeout
  const updateActivity = () => {
    sessionManager.trackActivity();
  };
  
  // Login with credentials
  const login = async (credentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await authAPI.loginUser(credentials);
      
      if (response.success && response.token) {
        const result = sessionManager.initialize(response.token);
        
        if (result) {
          setAuthState({
            isAuthenticated: true,
            user: sessionManager.user,
            token: sessionManager.token,
            authLevel: sessionManager.authLevel,
            loading: false,
            error: null
          });
          
          sessionManager.startSessionSync(setAuthState);
          return true;
        }
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'An unexpected error occurred'
      }));
      return false;
    }
  };
  
  // Logout
  const logout = async () => {
    try {
      await authAPI.logoutUser();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      const result = sessionManager.logout();
      setAuthState({
        ...result,
        loading: false,
        error: null
      });
    }
  };

  // Elevate authentication with additional factors
  const elevateAuth = async (factor, data) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      let response;
      if (factor === 'biometric') {
        response = await authAPI.verifyBiometric(data);
      } else if (factor === 'device') {
        response = await authAPI.verifyDeviceAttestation(data);
      } else {
        throw new Error(`Unsupported factor: ${factor}`);
      }
      
      if (response.success && response.token) {
        const result = sessionManager.elevateSession(response.token);
        
        if (result) {
          setAuthState({
            isAuthenticated: true,
            user: sessionManager.user,
            token: sessionManager.token,
            authLevel: sessionManager.authLevel,
            loading: false,
            error: null
          });
          return true;
        }
      }
      
      throw new Error(response.message || 'Elevation failed');
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'An unexpected error occurred'
      }));
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      login,
      logout,
      elevateAuth,
      updateActivity
    }}>
      {children}
    </AuthContext.Provider>
  );
}
