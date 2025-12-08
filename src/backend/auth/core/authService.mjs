// backend/auth/core/authService.mjs
import sessionManager from './sessionManager.mjs';
import signatureVerifier from '../utils/signatureVerifier.mjs';
import failureTracker from '../utils/failureTracker.mjs';
import { generateToken, verifyToken } from '../utils/authUtils.mjs';

/**
 * AuthService - Core authentication business logic
 * 
 * Responsibilities:
 * - User authentication and verification
 * - Token generation and validation
 * - Authentication state management
 */
class AuthService {
  constructor() {
    this.sessionManager = sessionManager;
    this.failureTracker = failureTracker;
  }

  /**
   * Authenticate a user with cryptographic signature
   */
  async authenticateWithSignature(publicKey, signature, challenge) {
    // Check for too many failed attempts
    if (this.failureTracker.isLocked(publicKey)) {
      return { success: false, error: 'Too many failed attempts. Try again later.' };
    }

    // Verify the signature
    const isValid = await signatureVerifier.verify(publicKey, signature, challenge);
    
    if (!isValid) {
      this.failureTracker.recordFailure(publicKey);
      return { success: false, error: 'Invalid signature' };
    }

    // Create session
    const user = await this.getUserByPublicKey(publicKey);
    const session = await this.sessionManager.createSession(user);
    const token = generateToken(session);

    return { success: true, token, user };
  }

  /**
   * Validate an authentication token
   */
  async validateToken(token) {
    const decoded = verifyToken(token);
    if (!decoded) {
      return { valid: false };
    }

    const session = await this.sessionManager.getSession(decoded.sessionId);
    if (!session || session.isExpired()) {
      return { valid: false };
    }

    return { valid: true, user: session.user };
  }

  /**
   * End a user session (logout)
   */
  async logout(sessionId) {
    return this.sessionManager.destroySession(sessionId);
  }

  /**
   * Get user by public key
   */
  async getUserByPublicKey(publicKey) {
    // Implementation would depend on your user repository
    // This is a placeholder
    return { publicKey, userId: 'user-id-here' };
  }
}

export default new AuthService();
