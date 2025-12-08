/**
 * Frontend Authentication Module
 * Central export point for all authentication-related functionality
 */

// Import directly from source files instead
import { AuthProvider } from './context/AuthProvider.jsx';
import { useAuth } from './context/useAuth.js';
import { useSessionMonitor } from './hooks/useSessionMonitor.js';
import { useSessionSync } from './hooks/useSessionSync.js';
import * as authUtils from './utils/authUtils.js';

// Export everything with consistent naming
export {
  // Context and hooks
  AuthProvider,
  useAuth,
  useSessionMonitor,
  useSessionSync,
  
  // Utilities
  authUtils
};

// Default export for convenience
export default {
  AuthProvider,
  useAuth,
  useSessionMonitor,
  useSessionSync,
  authUtils
};