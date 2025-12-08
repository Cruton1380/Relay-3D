/**
 * @fileoverview Authentication Module
 * Exports all authentication components
 */
import authService from './core/authService.mjs';
import sessionManager from './core/sessionManager.mjs';
import authController from './policies/authController.mjs';
import authPolicy, { AUTH_LEVELS, FACTORS } from './policies/authPolicy.mjs';
import * as authUtils from './utils/authUtils.mjs';
import failureTracker from './utils/failureTracker.mjs';
import { verifyLoginChallenge } from './utils/signatureVerifier.mjs';
import * as authSchemas from './utils/authSchemas.mjs';
import middleware from './middleware/index.mjs';

/**
 * Authentication Module
 * 
 * This module exports all authentication-related components with clear
 * responsibility boundaries. See documentation/AUTHENTICATION/AUTH-ARCHITECTURE.md for detailed documentation.
 */

// Core authentication components
export {
  // Core services
  authService,
  sessionManager,
  
  // API components
  authController,
  authPolicy,
  
  // Constants
  AUTH_LEVELS,
  FACTORS,
    // Utilities
  authUtils,
  failureTracker,
  verifyLoginChallenge,
  authSchemas,
  
  // Middleware
  middleware
};

// Default export for convenience
export default {
  service: authService,
  controller: authController,
  policy: authPolicy,
  constants: {
    AUTH_LEVELS,
    FACTORS
  }
};
