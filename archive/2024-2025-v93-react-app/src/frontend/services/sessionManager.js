/**
 * Session Manager
 * Handles token storage, validation, and session security
 */
import { eventBus } from '../utils/eventBus';
import { apiPost } from '../services/apiClient';

// Session constants
const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const CSRF_TOKEN_KEY = 'csrfToken';
const SESSION_EXPIRY_KEY = 'sessionExpiry';
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const BIOMETRIC_FAILURES_KEY = 'biometricFailures';

class SessionManager {
  constructor() {
    this.idleTimer = null;
    this.listeners = new Set();
    this.isRefreshing = false;
    this.syncInterval = null;
    this.stateUpdater = null;
    this.lastActivity = Date.now();
    this.user = null;
    this.token = null;
    this.authLevel = 'none';
  }

  /**
   * Initialize session monitoring
   */
  initialize(token = null) {
    // Set up activity monitoring
    this.setupActivityMonitoring();
    
    // If token provided, set it
    if (token) {
      this.token = token;
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      // Try to restore from localStorage
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        this.token = storedToken;
      }
    }
    
    // Check token validity on startup
    const isValid = this.token && this.validateSession();
    
    // Set up periodic validation (every 5 minutes)
    setInterval(() => this.validateSession(), 5 * 60 * 1000);
    
    // Log initialization
    console.log('Session manager initialized');
    
    // Return whether we have a valid session
    return !!this.token;
  }

  /**
   * Set up activity monitoring for idle timeout
   */
  setupActivityMonitoring() {
    // Activity events to monitor
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 
      'scroll', 'touchstart', 'click'
    ];
    
    // Reset idle timer on activity
    const resetIdleTimer = () => {
      if (this.idleTimer) {
        clearTimeout(this.idleTimer);
      }
      
      // Set new idle timer
      this.idleTimer = setTimeout(() => {
        this.handleIdleTimeout();
      }, IDLE_TIMEOUT);
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });
    
    // Initial setup
    resetIdleTimer();
  }

  /**
   * Handle idle timeout
   */
  handleIdleTimeout() {
    if (this.getToken()) {
      eventBus.emit('session:idle');
      // Notify listeners
      this.notifyListeners('idle');
    }
  }

  /**
   * Save authentication tokens
   * @param {Object} authData - Authentication data
   */
  setAuthData(authData) {
    if (authData.token) {
      localStorage.setItem(TOKEN_KEY, authData.token);
      this.token = authData.token;
    }
    
    if (authData.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);
    }
    
    if (authData.csrfToken) {
      localStorage.setItem(CSRF_TOKEN_KEY, authData.csrfToken);
    }
    
    if (authData.expiresAt) {
      localStorage.setItem(SESSION_EXPIRY_KEY, authData.expiresAt);
    }
    
    if (authData.user) {
      this.user = authData.user;
    }
    
    if (authData.authLevel) {
      this.authLevel = authData.authLevel;
    }
    
    // Notify listeners
    this.notifyListeners('updated');
  }

  /**
   * Get authentication token
   * @returns {string|null} Authentication token
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get refresh token
   * @returns {string|null} Refresh token
   */
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Get CSRF token
   * @returns {string|null} CSRF token
   */
  getCsrfToken() {
    return localStorage.getItem(CSRF_TOKEN_KEY);
  }

  /**
   * Validate current session
   * @returns {Promise<boolean>} Whether session is valid
   */
  async validateSession() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Check if token is expired
      const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
      const isExpired = expiry && new Date(parseInt(expiry)) <= new Date();
      
      if (isExpired) {
        return await this.refreshToken();
      }
      
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Refresh authentication token
   * @returns {Promise<boolean>} Whether refresh was successful
   */
  async refreshToken() {
    // Avoid multiple refresh requests
    if (this.isRefreshing) {
      return new Promise(resolve => {
        this.listeners.add(type => {
          if (type === 'refreshed') {
            this.listeners.delete(type);
            resolve(!!this.getToken());
          }
        });
      });
    }
    
    this.isRefreshing = true;
    
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        this.clearSession();
        return false;
      }
      
      const response = await apiPost('/auth/refresh', {
        refreshToken
      });
      
      if (response.token) {
        this.setAuthData(response);
        this.notifyListeners('refreshed');
        return true;
      }
      
      this.clearSession();
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearSession();
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Clear session data
   */
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(CSRF_TOKEN_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
    
    // Clear instance properties
    this.user = null;
    this.token = null;
    this.authLevel = 'none';
    
    // Notify listeners
    this.notifyListeners('cleared');
  }

  /**
   * Increment biometric failure counter
   * @returns {number} Current failure count
   */
  incrementBiometricFailure() {
    const currentFailures = parseInt(localStorage.getItem(BIOMETRIC_FAILURES_KEY) || '0');
    const newFailures = currentFailures + 1;
    localStorage.setItem(BIOMETRIC_FAILURES_KEY, newFailures.toString());
    
    // Emit event if threshold reached
    if (newFailures >= 3) {
      eventBus.emit('security:biometric_failure_threshold');
      this.notifyListeners('biometricFailure');
    }
    
    return newFailures;
  }

  /**
   * Reset biometric failure counter
   */
  resetBiometricFailures() {
    localStorage.removeItem(BIOMETRIC_FAILURES_KEY);
  }

  /**
   * Add session listener
   * @param {Function} callback - Callback function
   * @returns {Function} Removal function
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   * @param {string} type - Event type
   */
  notifyListeners(type) {
    this.listeners.forEach(callback => callback(type));
  }
  
  /**
   * Log out current user
   */
  logout() {
    // Try to call logout API
    try {
      apiPost('/auth/logout', {});
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    // Clear session regardless of API call result
    this.clearSession();
    this.resetBiometricFailures();
    
    // Notify about logout
    eventBus.emit('auth:logout');
    this.notifyListeners('logout');
  }

  /**
   * Check session status
   * @returns {Promise<boolean>} Whether session is still valid
   */
  async checkSessionStatus() {
    return await this.validateSession();
  }

  /**
   * Start session synchronization
   * @param {Function} stateUpdater - Function to update auth state
   */
  startSessionSync(stateUpdater) {
    this.stateUpdater = stateUpdater;
    
    // Set up periodic session checks
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(async () => {
      const isValid = await this.validateSession();
      if (!isValid && this.stateUpdater) {
        this.stateUpdater(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          token: null,
          authLevel: 'none',
          error: 'Session expired'
        }));
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop session synchronization
   */
  stopSessionSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.stateUpdater = null;
  }

  /**
   * Track user activity
   */
  trackActivity() {
    // Reset idle timer (activity monitoring is already set up in setupActivityMonitoring)
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        this.handleIdleTimeout();
      }, IDLE_TIMEOUT);
    }
    
    // Update last activity timestamp
    this.lastActivity = Date.now();
  }

  /**
   * Check if session has timed out
   * @returns {boolean} True if session has timed out
   */
  hasSessionTimedOut() {
    const token = this.getToken();
    if (!token) return true;
    
    const expiryTime = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (!expiryTime) return false;
    
    return Date.now() > parseInt(expiryTime);
  }

  /**
   * Elevate session with additional authentication
   * @param {string} token - New elevated token
   * @returns {boolean} Whether elevation was successful
   */
  elevateSession(token) {
    if (token) {
      this.token = token;
      localStorage.setItem(TOKEN_KEY, token);
      this.authLevel = 'elevated';
      this.notifyListeners('elevated');
      return true;
    }
    return false;
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;

