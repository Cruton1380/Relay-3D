/**
 * User presence verification
 */
import logger from '../utils/logging/logger.mjs';

/**
 * Verify presence of a user across multiple devices
 * @param {string} userId - User ID to verify presence for
 * @param {Array} sessions - Array of session objects with deviceId and timestamp
 * @returns {Object} Result of presence verification
 */
export function verifyPresence(userId, sessions) {
  // Log the verification attempt
  logger.debug('Verifying presence for user', { userId, sessionCount: sessions.length });
  
  // Require at least two device sessions for presence verification
  if (!sessions || sessions.length < 2) {
    return {
      present: false,
      reason: 'Only one device session detected'
    };
  }
  
  // Check if sessions are from different devices
  const uniqueDevices = new Set(sessions.map(s => s.deviceId));
  if (uniqueDevices.size < 2) {
    return {
      present: false,
      reason: 'Multiple sessions from same device'
    };
  }
  
  // Check if sessions are recent (within last 5 minutes)
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  const recentSessions = sessions.filter(s => s.timestamp > fiveMinutesAgo);
  
  if (recentSessions.length < 2) {
    return {
      present: false,
      reason: 'Sessions not recent enough'
    };
  }
  
  // All checks passed
  return {
    present: true,
    deviceCount: uniqueDevices.size
  };
}
