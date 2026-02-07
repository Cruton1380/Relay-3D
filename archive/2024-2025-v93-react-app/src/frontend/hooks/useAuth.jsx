/**
 * Authentication Hook
 * Simple authentication hook for voting system
 */
import { createContext, useContext, useState, useCallback } from 'react';

// Create auth context
const AuthContext = createContext(null);

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLevel, setAuthLevel] = useState(0);

  const login = useCallback(async (credentials) => {
    try {
      // For development, use mock authentication
      const mockUser = {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        authLevel: 1
      };

      setUser(mockUser);
      setIsAuthenticated(true);
      setAuthLevel(mockUser.authLevel);

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthLevel(0);
  }, []);

  const getToken = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return null;
    }
    // For development, use a demo token
    return `demo-token-${user.id}`;
  }, [isAuthenticated, user]);

  const value = {
    user,
    isAuthenticated,
    authLevel,
    login,
    logout,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth; 