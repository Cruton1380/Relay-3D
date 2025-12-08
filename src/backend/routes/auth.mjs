/**
 * @fileoverview Authentication Routes
 * API routes for authentication operations
 */
import express from 'express';
import authController from '../auth/policies/authController.mjs';
import authPolicy, { AUTH_LEVELS } from '../auth/policies/authPolicy.mjs';

const router = express.Router();

/**
 * Authentication routes
 */

// POST /api/auth/login - Login with cryptographic signature
router.post('/login', authController.login);

// POST /api/auth/logout - Logout
router.post('/logout', authPolicy.requireAuth(), authController.logout);

// POST /api/auth/refresh - Refresh authentication token
router.post('/refresh', authController.refreshToken);

// GET /api/auth/verify - Verify authentication status
router.get('/verify', authPolicy.requireAuth(), authController.verifyAuth);

// POST /api/auth/elevate - Elevate authentication with additional factors
router.post('/elevate', authPolicy.requireAuth(AUTH_LEVELS.BASIC), authController.elevateAuth);

export default router;
