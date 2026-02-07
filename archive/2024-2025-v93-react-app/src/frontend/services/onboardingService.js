/**
 * Consolidated Onboarding Service
 * Handles all aspects of user onboarding including security checks
 */
import api from './apiClient';
import keyManagerService from './keyManagerService';

/**
 * Verify an invite code
 * @param {string} code - Invite code to verify
 * @returns {Promise<Object>} Verification result
 */
export async function verifyInvite(code) {
  try {
    const response = await api.post('/api/onboarding/validate-invite', { inviteCode: code });
    return response.data;
  } catch (error) {
    console.error('Error verifying invite:', error);
    throw error;
  }
}

/**
 * Complete the onboarding process
 * @param {Object} data - Onboarding data
 * @returns {Promise<Object>} Onboarding result
 */
export async function completeOnboarding(data) {
  try {
    const { inviteCode, biometricHash } = data;
    
    // Generate keypair using the consolidated keyManagerService
    const { publicKey, privateKey } = await keyManagerService.generateKeyPair('temp-user-id');
    
    // Get device attestation information
    const deviceAttestation = await getDeviceAttestationData();
    
    // Submit to server
    const response = await api.post('/api/onboarding/complete', {
      inviteCode,
      biometricHash,
      publicKey,
      deviceAttestation
    });
    
    // If successful, store the user ID and mark as onboarded
    if (response.data.success) {
      localStorage.setItem('onboarded', 'true');
      
      // Update the keypair with the proper user ID
      await keyManagerService.storeKeys(response.data.userId, { publicKey, privateKey });
    }
    
    return response.data;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }
}

/**
 * Check if user is onboarded
 * @returns {boolean} Whether user is onboarded
 */
export function isOnboarded() {
  return localStorage.getItem('onboarded') === 'true';
}

/**
 * Verify biometric uniqueness
 * @param {string} biometricHash - Biometric hash to verify
 * @returns {Promise<Object>} Verification result
 */
export async function verifyBiometricUniqueness(biometricHash) {
  try {
    const response = await api.post('/api/onboarding/verify-biometrics', {
      biometricHash
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying biometrics:', error);
    throw error;
  }
}

/**
 * Verify personhood
 * @param {Object} data - Personhood verification data
 * @returns {Promise<Object>} Verification result
 */
export async function verifyPersonhood(data) {
  try {
    const response = await api.post('/api/onboarding/verify-personhood', data);
    return response.data;
  } catch (error) {
    console.error('Error verifying personhood:', error);
    throw error;
  }
}

/**
 * Extract invite code from URL
 * @returns {string|null} Invite code or null if not found
 */
export function getInviteCodeFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('invite');
}

// --- Security functions (moved from onboardingSecurity.js) ---

/**
 * Get device's local IPs using WebRTC
 * This helps verify device uniqueness and detect potential proxies
 */
export async function getLocalIPsViaWebRTC() {
  return new Promise((resolve) => {
    const ips = new Set();
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    pc.createDataChannel('');
    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        pc.close();
        resolve(Array.from(ips));
        return;
      }
      
      const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
      const match = ipRegex.exec(event.candidate.candidate);
      if (match) {
        ips.add(match[1]);
      }
    };
    
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(() => {
        pc.close();
        resolve([]);
      });
      
    // Timeout after 5 seconds
    setTimeout(() => {
      if (pc.connectionState !== 'closed') {
        pc.close();
        resolve(Array.from(ips));
      }
    }, 5000);
  });
}

/**
 * Compare two sets of IPs to check if they're on the same subnet
 * @param {Array} ipListA - First list of IPs
 * @param {Array} ipListB - Second list of IPs
 * @returns {boolean} Whether IPs are in the same subnet
 */
export function areIPsInSameSubnet(ipListA, ipListB) {
  if (!ipListA.length || !ipListB.length) return false;
  
  for (const ipA of ipListA) {
    if (!isValidIPv4(ipA)) continue;
    
    const subnetA = ipA.split('.').slice(0, 3).join('.');
    
    for (const ipB of ipListB) {
      if (!isValidIPv4(ipB)) continue;
      
      const subnetB = ipB.split('.').slice(0, 3).join('.');
      
      if (subnetA === subnetB) return true;
    }
  }
  
  return false;
}

/**
 * Validate IPv4 address format
 * @param {string} ip - IP address to validate
 * @returns {boolean} Whether IP is valid
 */
export function isValidIPv4(ip) {
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
}

/**
 * Perform biometric verification
 * @param {Object} biometricData - Biometric data to verify
 * @returns {Promise<boolean>} Whether verification succeeded
 */
export async function performBiometricVerification(biometricData) {
  try {
    const response = await api.post('/api/biometrics/verify', { biometricData });
    return response.data.verified;
  } catch (error) {
    console.error('Biometric verification failed:', error);
    throw new Error('Biometric verification failed');
  }
}

/**
 * Verify device using WebAuthn attestation
 * @returns {Promise<boolean>} Whether device attestation succeeded
 */
export async function verifyDeviceAttestation() {
  try {
    // Generate a random challenge
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    
    // Create attestation options
    const attestationOptions = {
      challenge,
      rp: {
        name: 'Relay Platform',
        id: window.location.hostname
      },
      user: {
        id: new Uint8Array([0, 1, 2, 3]),
        name: 'device-attestation',
        displayName: 'Device Attestation'
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 } // RS256
      ],
      timeout: 60000,
      attestation: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred'
      }
    };
    
    // Create credentials
    const credential = await navigator.credentials.create({
      publicKey: attestationOptions
    });
    
    // Process the attestation response
    const attestationResponse = {
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      response: {
        clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
        attestationObject: arrayBufferToBase64(credential.response.attestationObject)
      },
      type: credential.type
    };
    
    // Verify the attestation with the server
    const verificationResponse = await api.post('/api/auth/verify-attestation', {
      attestation: attestationResponse
    });
    
    return verificationResponse.data.verified;
  } catch (error) {
    console.error('Device attestation failed:', error);
    throw new Error('Device attestation failed');
  }
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer - Buffer to convert
 * @returns {string} Base64 string
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Get device attestation data
 * @returns {Promise<Object>} Device attestation data
 */
export async function getDeviceAttestationData() {
  // Get basic device info
  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    hasTouch: 'ontouchstart' in window,
    cpuCores: navigator.hardwareConcurrency || 0,
    deviceMemory: navigator.deviceMemory || 0,
    webglRenderer: getWebGLRenderer(),
    // Add security context info
    secureContext: window.isSecureContext === true,
    webCrypto: !!window.crypto?.subtle,
    webgl: hasWebGLSupport(),
    biometricAuth: 'PublicKeyCredential' in window && 
                  typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function',
    hardwareAcceleration: hasHardwareAcceleration()
  };
  
  // Get local IPs
  try {
    const localIPs = await getLocalIPsViaWebRTC();
    deviceInfo.localIPs = localIPs;
  } catch (error) {
    console.warn('Could not get local IPs', error);
    deviceInfo.localIPs = [];
  }
  
  return {
    ...deviceInfo,
    timestamp: Date.now(),
    deviceId: generateDeviceId(deviceInfo)
  };
}

/**
 * Generate a unique device ID from device information
 * @param {Object} deviceInfo - Device information
 * @returns {string} Device ID
 */
function generateDeviceId(deviceInfo) {
  const components = [
    deviceInfo.userAgent,
    deviceInfo.platform,
    `${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`,
    deviceInfo.colorDepth,
    deviceInfo.language,
    deviceInfo.webglRenderer
  ].filter(Boolean).join('|');
  
  // Create a simple hash of the device info
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `device-${Math.abs(hash).toString(36)}`;
}

/**
 * Check if WebGL is supported
 * @returns {boolean} Whether WebGL is supported
 */
function hasWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
}

/**
 * Check for hardware acceleration
 * @returns {boolean} Whether hardware acceleration is likely
 */
function hasHardwareAcceleration() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) return false;
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) return true; // If we can't check, assume it's there
  
  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
  
  // Look for keywords that indicate software rendering
  const softwareRenderers = ['swiftshader', 'llvmpipe', 'software', 'mesa'];
  return !softwareRenderers.some(term => renderer.toLowerCase().includes(term));
}

/**
 * Get WebGL renderer information
 * @returns {string|null} WebGL renderer
 */
function getWebGLRenderer() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return null;
    
    return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  } catch (e) {
    return null;
  }
}

/**
 * Perform all security checks for onboarding
 * @returns {Promise<Object>} Security check results
 */
export async function performSecurityChecks() {
  // Get device attestation data
  const deviceData = await getDeviceAttestationData();
  
  try {
    // Perform biometric verification
    const biometricVerified = await performBiometricVerification();
    
    // Try to perform device attestation
    let deviceAttested = false;
    try {
      deviceAttested = await verifyDeviceAttestation();
    } catch (error) {
      console.warn('Device attestation failed, continuing with limited security:', error);
    }
    
    // Check for device uniqueness (server-side check)
    const deviceCheckResponse = await api.post('/api/security/check-device', {
      deviceData
    });
    
    return {
      passed: deviceCheckResponse.data.unique && (biometricVerified || deviceAttested),
      biometricVerified,
      deviceAttested,
      deviceUnique: deviceCheckResponse.data.unique,
      attestationData: deviceData
    };
  } catch (error) {
    console.error('Security checks failed:', error);
    return {
      passed: false,
      error: error.message,
      attestationData: deviceData
    };
  }
}

/**
 * Bind identity to security proof
 * @param {string} biometricHash - Biometric hash
 * @param {string} publicKey - Public key
 * @returns {Promise<Object>} Binding result
 */
export async function bindIdentityToSecurityProof(biometricHash, publicKey) {
  // Get device info and security attestation
  const securityCheck = await performSecurityChecks();
  
  if (!securityCheck.passed) {
    throw new Error('Security verification failed');
  }
  
  // Submit binding to server
  return await api.post('/api/onboarding/bind', {
    biometricHash,
    publicKey,
    deviceAttestation: securityCheck.attestationData
  });
}

export default {
  verifyInvite,
  completeOnboarding,
  isOnboarded,
  verifyBiometricUniqueness,
  verifyPersonhood,
  getInviteCodeFromURL,
  performSecurityChecks,
  getDeviceAttestationData,
  performBiometricVerification,
  verifyDeviceAttestation,
  bindIdentityToSecurityProof,
  areIPsInSameSubnet,
  isValidIPv4
};
