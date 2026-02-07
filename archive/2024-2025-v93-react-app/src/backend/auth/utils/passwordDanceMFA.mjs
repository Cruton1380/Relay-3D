//backend/auth/utils/passwordDanceMFA.mjs
import logger from '../../utils/logging/logger.mjs';
import { 
  getIdentityProfile, 
  addIdentityFactor, 
  verifyIdentityAgainstProfile 
} from '../../security/userIdentityService.mjs';
import { getUserDevices } from '../../security/deviceManager.mjs';
import crypto from 'crypto';

const mfaLogger = logger.child({ module: 'password-dance-mfa' });

/**
 * Generate password dance challenge for user
 * @param {string} publicKey - User's public key
 * @returns {Object} Challenge object
 */
export async function generatePasswordDanceChallenge(publicKey) {
  // Get user profile to determine what factors we can challenge
  const profile = getIdentityProfile(publicKey);
  
  if (!profile) {
    mfaLogger.warn(`No identity profile found for user ${publicKey.substring(0, 8)}...`);
    return generateBasicChallenge(publicKey);
  }
  
  // Get available factors to build challenges
  const availableFactors = [];
  
  if (profile.factors.biometric && profile.factors.biometric.length > 0) {
    availableFactors.push('biometric');
  }
  
  if (profile.factors.device && profile.factors.device.length > 0) {
    availableFactors.push('device');
  }
  
  if (profile.factors.location && profile.factors.location.length > 0) {
    availableFactors.push('location');
  }
  
  if (profile.factors.activity && profile.factors.activity.length > 0) {
    availableFactors.push('activity');
  }
  
  // Select challenge factors based on profile strength
  const challengeFactors = selectChallengeFactors(profile, availableFactors);
  
  // Generate a challenge for each selected factor
  const challenges = {};
  for (const factor of challengeFactors) {
    challenges[factor] = await generateFactorChallenge(factor, profile);
  }
  
  // Generate a challenge nonce for verification
  const nonce = crypto.randomBytes(16).toString('hex');
  
  return {
    publicKey,
    nonce,
    requiredFactors: challengeFactors,
    challenges,
    expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
  };
}

/**
 * Generate a basic challenge for new users or those without profiles
 */
function generateBasicChallenge(publicKey = null) {
  return {
    type: 'basic',
    publicKey,
    nonce: crypto.randomBytes(16).toString('hex'),
    requiredFactors: ['biometric', 'device'],
    challenges: {
      biometric: {
        type: 'facialGesture',
        gestures: ['smile', 'blink']
      },
      device: {
        type: 'deviceAttestation'
      }
    },
    expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
  };
}

/**
 * Select which factors to challenge based on profile strength
 * @param {Object} profile - User identity profile
 * @param {Array} availableFactors - Available factors to choose from
 * @returns {Array} Selected factors to challenge
 */
function selectChallengeFactors(profile, availableFactors) {
  // Always require at least one factor
  if (availableFactors.length === 0) {
    return ['biometric']; // Default to biometric if nothing available
  }
  
  // For stronger profiles, require more factors
  const strength = profile.strengthScore || 0;
  
  if (strength < 30) {
    // Low strength - require all available factors
    return [...availableFactors];
  } else if (strength < 60) {
    // Medium strength - require 2 factors if available
    return availableFactors.slice(0, Math.min(2, availableFactors.length));
  } else {
    // High strength - require just 1 factor
    return [availableFactors[0]];
  }
}

/**
 * Generate a challenge for a specific factor
 * @param {string} factorType - Type of factor
 * @param {Object} profile - User identity profile
 * @returns {Object} Factor challenge
 */
async function generateFactorChallenge(factorType, profile) {
  switch (factorType) {
    case 'biometric':
      return {
        type: 'facialGesture',
        gestures: ['smile', 'blink', 'lookLeft'].sort(() => Math.random() - 0.5).slice(0, 2)
      };
      
    case 'device':
      // Get user's registered devices
      const devices = await getUserDevices(profile.publicKey);
      return {
        type: 'deviceAttestation',
        knownDevices: devices.map(d => d.deviceId)
      };
      
    case 'location':
      return {
        type: 'locationProximity',
        knownLocations: profile.factors.location || []
      };
      
    case 'activity':
      return {
        type: 'behavioralPattern',
        patternType: Math.random() > 0.5 ? 'typing' : 'scrolling'
      };
      
    default:
      return {
        type: 'generic',
        message: 'Please authenticate'
      };
  }
}

/**
 * Verify password dance response
 * @param {Object} challenge - Original challenge
 * @param {Object} response - User's response
 * @returns {Object} Verification result
 */
export async function verifyPasswordDanceResponse(challenge, response) {
  // Verify challenge hasn't expired
  if (Date.now() > challenge.expiresAt) {
    return {
      verified: false,
      reason: 'Challenge expired'
    };
  }

  // Verify nonce matches (this will handle null/undefined responses)
  if (challenge.nonce !== response?.nonce) {
    return {
      verified: false,
      reason: 'Invalid challenge nonce'
    };
  }
  
  // Verify all required factors
  const verificationFactors = {};
  const factorResults = {};
  
  for (const factorType of challenge.requiredFactors) {
    // Skip if factor not provided
    if (!response.factors || !response.factors[factorType]) {
      factorResults[factorType] = {
        verified: false,
        reason: 'Factor response missing'
      };
      continue;
    }
    
    // Process factor response
    const factorResponse = response.factors[factorType];
    const result = await verifyFactorResponse(factorType, factorResponse, challenge.challenges[factorType]);
    
    factorResults[factorType] = result;
    
    if (result.verified && result.factorData) {
      verificationFactors[factorType] = result.factorData;
    }
  }
  
  // Check if all required factors were verified
  const allFactorsVerified = challenge.requiredFactors.every(
    factor => factorResults[factor] && factorResults[factor].verified
  );
  
  if (allFactorsVerified) {
    // Add verified factors to user's identity profile
    try {
      for (const [factorType, factorData] of Object.entries(verificationFactors)) {
        await addIdentityFactor(challenge.publicKey, factorType, factorData);
      }
    } catch (error) {
      // Log the error but don't fail verification if profile update fails
      mfaLogger.warn('Failed to update identity profile after successful verification', { error: error.message });
    }
  }
  
  return {
    verified: allFactorsVerified,
    factors: factorResults,
    strengthIncreased: allFactorsVerified
  };
}

/**
 * Verify a specific factor response
 * @param {string} factorType - Type of factor
 * @param {Object} factorResponse - User's response for this factor
 * @param {Object} factorChallenge - Original challenge for this factor
 * @returns {Object} Verification result
 */
async function verifyFactorResponse(factorType, factorResponse, factorChallenge) {
  switch (factorType) {
    case 'biometric':
      // Biometric verification would typically happen through a specialized service
      // Here we'll simulate by checking if all required gestures were provided
      if (factorChallenge.type === 'facialGesture') {
        const requiredGestures = new Set(factorChallenge.gestures);
        const providedGestures = new Set(factorResponse.gestures || []);
        
        const allGesturesProvided = [...requiredGestures].every(
          gesture => providedGestures.has(gesture)
        );
        
        return {
          verified: allGesturesProvided,
          reason: allGesturesProvided ? null : 'Missing required gestures',
          factorData: allGesturesProvided ? factorResponse.biometricHash : null
        };
      }
      break;
      
    case 'device':
      // Verify device attestation
      const deviceVerified = factorResponse.attestation && 
                            factorResponse.deviceId &&
                            (factorChallenge.knownDevices?.includes(factorResponse.deviceId) || 
                             factorResponse.attestation.verified);
      
      return {
        verified: deviceVerified,
        reason: deviceVerified ? null : 'Device attestation failed',
        factorData: deviceVerified ? {
          deviceId: factorResponse.deviceId,
          deviceName: factorResponse.deviceName,
          deviceModel: factorResponse.deviceModel
        } : null
      };
      
    case 'location':
      // Location verification
      // In a real implementation, this would compare against known locations
      // For simplicity, we'll just verify that location data was provided
      const locationProvided = !!(factorResponse.lat && factorResponse.lng);
      
      return {
        verified: locationProvided,
        reason: locationProvided ? null : 'Location data missing',
        factorData: locationProvided ? {
          lat: factorResponse.lat,
          lng: factorResponse.lng
        } : null
      };
      
    case 'activity':
      // Activity pattern verification
      const activityProvided = factorResponse.patternData && factorResponse.patternType;
      
      return {
        verified: activityProvided,
        reason: activityProvided ? null : 'Activity pattern data missing',
        factorData: activityProvided ? {
          patternType: factorResponse.patternType,
          patternData: factorResponse.patternData
        } : null
      };

    // Additional factor verifications would go here
      
    default:
      return {
        verified: false,
        reason: 'Unsupported factor type'
      };
  }
}

export default {
  generatePasswordDanceChallenge,
  verifyPasswordDanceResponse
};
