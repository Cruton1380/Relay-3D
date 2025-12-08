/**
 * Device Utility Functions
 * Detects device capabilities and characteristics
 * Migrated from deviceDetector.mjs
 */

import { useState, useEffect } from 'react';

// Cache detection results
let deviceInfo = null;
let isMobileCache = null;

/**
 * Detect device information including browser, OS, and capabilities
 * @returns {Object} Device information
 */
export function detectDevice() {
  if (deviceInfo) return deviceInfo;
  
  try {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    
    // Parse browser information
    let browser = { name: 'Unknown', version: 'Unknown' };
    
    // Chrome
    if (/Chrome/.test(ua) && !/Chromium|Edge|Edg|OPR|Opera/.test(ua)) {
      browser = {
        name: 'Chrome',
        version: ua.match(/Chrome\/(\d+\.\d+)/)[1]
      };
    }
    // Firefox
    else if (/Firefox/.test(ua)) {
      browser = {
        name: 'Firefox',
        version: ua.match(/Firefox\/(\d+\.\d+)/)[1]
      };
    }
    // Safari
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
      browser = {
        name: 'Safari',
        version: ua.match(/Version\/(\d+\.\d+)/)[1]
      };
    }
    // Edge
    else if (/Edg/.test(ua)) {
      browser = {
        name: 'Edge',
        version: ua.match(/Edg\/(\d+\.\d+)/)[1]
      };
    }
    
    // Parse OS information
    let os = { name: 'Unknown', version: 'Unknown' };
    
    // Windows
    if (/Windows/.test(ua)) {
      os = {
        name: 'Windows',
        version: ua.match(/Windows NT (\d+\.\d+)/) 
          ? ua.match(/Windows NT (\d+\.\d+)/)[1] 
          : 'Unknown'
      };
    }
    // macOS
    else if (/Macintosh/.test(ua)) {
      os = {
        name: 'macOS',
        version: ua.match(/Mac OS X (\d+[._]\d+)/)
          ? ua.match(/Mac OS X (\d+[._]\d+)/)[1].replace('_', '.')
          : 'Unknown'
      };
    }
    // iOS
    else if (/iPhone|iPad|iPod/.test(ua)) {
      os = {
        name: 'iOS',
        version: ua.match(/OS (\d+[._]\d+)/)
          ? ua.match(/OS (\d+[._]\d+)/)[1].replace('_', '.')
          : 'Unknown'
      };
    }
    // Android
    else if (/Android/.test(ua)) {
      os = {
        name: 'Android',
        version: ua.match(/Android (\d+\.\d+)/)
          ? ua.match(/Android (\d+\.\d+)/)[1]
          : 'Unknown'
      };
    }
    // Linux
    else if (/Linux/.test(ua)) {
      os = {
        name: 'Linux',
        version: 'Unknown'
      };
    }
    
    // Determine platform type
    let platformType = 'desktop';
    if (/Mobi|Android|iPhone|iPad|iPod|Windows Phone/.test(ua)) {
      platformType = 'mobile';
    } else if (/Tablet|iPad/.test(ua)) {
      platformType = 'tablet';
    }
    
    // Check for WebGL support
    const hasWebGL = checkWebGLSupport();
    
    // Check for camera support
    const hasCamera = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    
    // Check for microphone support
    const hasMicrophone = hasCamera; // If camera is supported, mic usually is too
    
    // Check for storage APIs
    const hasLocalStorage = 'localStorage' in window;
    const hasSessionStorage = 'sessionStorage' in window;
    const hasIndexedDB = 'indexedDB' in window;
    
    // Build full device info object
    deviceInfo = {
      browser,
      os,
      platform: {
        type: platformType,
        name: platform
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown'
      },
      capabilities: {
        hasWebGL,
        hasCamera,
        hasMicrophone,
        hasLocalStorage,
        hasSessionStorage,
        hasIndexedDB,
        hasWebRTC: 'RTCPeerConnection' in window,
        hasGeolocation: 'geolocation' in navigator,
        hasTouch: 'ontouchstart' in window,
        hasBattery: 'getBattery' in navigator,
        hasServiceWorker: 'serviceWorker' in navigator
      },
      hardware: {
        cpuCores: navigator.hardwareConcurrency || 'unknown',
        memory: navigator.deviceMemory || 'unknown',
        connection: navigator.connection ? {
          type: navigator.connection.effectiveType || 'unknown',
          downlink: navigator.connection.downlink || 'unknown',
          rtt: navigator.connection.rtt || 'unknown',
          saveData: navigator.connection.saveData || false
        } : 'unknown'
      },
      time: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset()
      }
    };
    
    return deviceInfo;
  } catch (e) {
    console.error("Error detecting device:", e);
    
    // Return a basic device info object
    return {
      browser: { name: "unknown", version: "unknown" },
      os: { name: "unknown", version: "unknown" },
      platform: { type: "unknown", name: "unknown" },
      capabilities: { hasWebGL: false, hasCamera: false },
      screen: { width: window.screen.width, height: window.screen.height }
    };
  }
}

/**
 * Check if WebGL is supported
 * @returns {boolean} Whether WebGL is supported
 */
export function checkWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || 
               canvas.getContext('experimental-webgl');
               
    return !!gl;
  } catch (e) {
    return false;
  }
}

/**
 * Check if the current device is mobile
 * @returns {boolean} Whether the device is mobile
 */
export function isMobile() {
  if (isMobileCache !== null) return isMobileCache;
  
  const device = detectDevice();
  isMobileCache = device.platform.type === 'mobile';
  
  return isMobileCache;
}

/**
 * Get optimal camera constraints based on device capabilities
 * @param {boolean} requireHD - Whether to require HD resolution
 * @returns {Object} Media constraints object
 */
export function getOptimalCameraConstraints(requireHD = false) {
  const isDeviceMobile = isMobile();
  
  // Base constraints
  const constraints = {
    audio: false,
    video: {
      facingMode: "user"
    }
  };
  
  // Set resolution constraints
  if (requireHD && !isDeviceMobile) {
    // Desktop HD
    constraints.video.width = { ideal: 1280 };
    constraints.video.height = { ideal: 720 };
  } else if (requireHD && isDeviceMobile) {
    // Mobile HD
    constraints.video.width = { ideal: 720 };
    constraints.video.height = { ideal: 1280 };
  } else if (!requireHD && !isDeviceMobile) {
    // Desktop standard
    constraints.video.width = { ideal: 640 };
    constraints.video.height = { ideal: 480 };
  } else {
    // Mobile standard
    constraints.video.width = { ideal: 360 };
    constraints.video.height = { ideal: 640 };
  }
  
  return constraints;
}

/**
 * Check if device meets minimum requirements
 * @returns {Object} Requirements check result
 */
export function checkDeviceRequirements() {
  const device = detectDevice();
  
  return {
    hasCamera: device.capabilities.hasCamera,
    hasWebGL: device.capabilities.hasWebGL,
    hasMicrophone: device.capabilities.hasMicrophone,
    hasIndexedDB: device.capabilities.hasIndexedDB,
    satisfiesMinimum: device.capabilities.hasWebGL && 
                      device.capabilities.hasCamera && 
                      device.capabilities.hasIndexedDB
  };
}

/**
 * Get current device orientation
 * @returns {string} Orientation ('portrait' or 'landscape')
 */
export function getOrientation() {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * React hook for device information
 * @returns {Object} Device information and state
 */
export function useDeviceInfo() {
  const [device, setDevice] = useState(() => detectDevice());
  const [orientation, setOrientation] = useState(() => getOrientation());
  const [requirements, setRequirements] = useState(() => checkDeviceRequirements());
  
  useEffect(() => {
    const handleResize = () => {
      setOrientation(getOrientation());
    };
    
    const handleOrientationChange = () => {
      // Update orientation and refresh device info
      setOrientation(getOrientation());
      
      // Force a refresh of device info
      deviceInfo = null;
      setDevice(detectDevice());
      setRequirements(checkDeviceRequirements());
    };
    
    window.addEventListener('resize', handleResize);
    
    if (window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    } else {
      window.addEventListener('orientationchange', handleOrientationChange);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      } else {
        window.removeEventListener('orientationchange', handleOrientationChange);
      }
    };
  }, []);
  
  return {
    ...device,
    orientation,
    requirements,
    isMobile: isMobile()
  };
}

/**
 * Generate a device fingerprint
 * @returns {Promise<string>} Device fingerprint hash
 */
export async function generateDeviceFingerprint() {
  const device = detectDevice();
  
  // Collect key device attributes
  const fingerprintData = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cpuCores: navigator.hardwareConcurrency || 0,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset()
  };
  
  // Generate a hash from the fingerprint data
  try {
    // Convert to string
    const dataString = JSON.stringify(fingerprintData);
    
    // Convert to ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    
    // Hash using SHA-256
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    
    // Fallback to a simpler method if crypto API fails
    const fallbackString = `${navigator.userAgent}|${navigator.language}|${window.screen.width}x${window.screen.height}|${window.screen.colorDepth}`;
    let fallbackHash = 0;
    
    for (let i = 0; i < fallbackString.length; i++) {
      const char = fallbackString.charCodeAt(i);
      fallbackHash = ((fallbackHash << 5) - fallbackHash) + char;
      fallbackHash = fallbackHash & fallbackHash; // Convert to 32bit integer
    }
    
    return fallbackHash.toString(16);
  }
}

/**
 * Generate comprehensive device fingerprint including Canvas, Audio, and storage techniques
 * @returns {Promise<string>} Comprehensive device fingerprint hash
 */
export async function generateComprehensiveFingerprint() {
  try {
    const fingerprintData = {
      // Basic fingerprint data
      ...(await generateBasicFingerprint()),
      
      // Canvas fingerprinting
      canvas: await generateCanvasFingerprint(),
      
      // Audio fingerprinting
      audio: await generateAudioFingerprint(),
      
      // Storage fingerprinting
      storage: await generateStorageFingerprint(),
      
      // Hardware fingerprinting
      hardware: await generateHardwareFingerprint(),
      
      // Network fingerprinting
      network: await generateNetworkFingerprint()
    };
    
    // Create comprehensive hash
    const dataString = JSON.stringify(fingerprintData);
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('[DEVICE_FINGERPRINT] Comprehensive fingerprint generated');
    return hashHex;
    
  } catch (error) {
    console.error('Error generating comprehensive fingerprint:', error);
    // Fallback to basic fingerprint
    return await generateDeviceFingerprint();
  }
}

/**
 * Generate basic device fingerprint data
 */
async function generateBasicFingerprint() {
  const device = detectDevice();
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages,
    platform: navigator.platform,
    vendor: navigator.vendor,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    browser: device.browser,
    os: device.os
  };
}

/**
 * Generate Canvas-based fingerprint
 */
async function generateCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    
    // Draw complex pattern for fingerprinting
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    
    ctx.fillStyle = '#069';
    ctx.fillText('🌐 Relay Network Fingerprint Test 🔒', 2, 15);
    
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas fingerprint: 2024', 4, 33);
    
    // Add geometric shapes
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(255,0,255)';
    ctx.beginPath();
    ctx.arc(50, 50, 20, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgb(0,255,255)';
    ctx.beginPath();
    ctx.arc(100, 50, 20, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    
    // Extract canvas data
    const canvasData = canvas.toDataURL();
    
    // Also get WebGL canvas if available
    let webglData = '';
    try {
      const webglCanvas = document.createElement('canvas');
      const gl = webglCanvas.getContext('webgl') || webglCanvas.getContext('experimental-webgl');
      if (gl) {
        // Get WebGL renderer info
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          webglData = `${vendor}|${renderer}`;
        }
      }
    } catch (e) {
      // WebGL not available
    }
    
    return {
      canvas2d: canvasData.slice(-100), // Last 100 chars to reduce size
      webgl: webglData
    };
    
  } catch (error) {
    console.warn('Canvas fingerprinting failed:', error);
    return { canvas2d: 'unavailable', webgl: 'unavailable' };
  }
}

/**
 * Generate AudioContext-based fingerprint
 */
async function generateAudioFingerprint() {
  try {
    if (!window.AudioContext && !window.webkitAudioContext) {
      return { audio: 'unavailable' };
    }
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();
    
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
    
    // Configure oscillator
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
    
    // Configure gain (silent)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    
    // Connect nodes
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Capture audio data
    return new Promise((resolve) => {
      let audioFingerprint = '';
      
      scriptProcessor.onaudioprocess = function(event) {
        const inputBuffer = event.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputBuffer.length; i++) {
          sum += Math.abs(inputBuffer[i]);
        }
        audioFingerprint = sum.toString();
        
        // Clean up
        oscillator.stop();
        scriptProcessor.disconnect();
        audioContext.close();
        
        resolve({
          audio: audioFingerprint,
          sampleRate: audioContext.sampleRate,
          baseLatency: audioContext.baseLatency || 'unknown',
          outputLatency: audioContext.outputLatency || 'unknown'
        });
      };
      
      oscillator.start();
      
      // Fallback timeout
      setTimeout(() => {
        resolve({ audio: 'timeout' });
      }, 1000);
    });
    
  } catch (error) {
    console.warn('Audio fingerprinting failed:', error);
    return { audio: 'error' };
  }
}

/**
 * Generate storage-based fingerprint
 */
async function generateStorageFingerprint() {
  try {
    const storageData = {};
    
    // Test localStorage
    if (window.localStorage) {
      try {
        const testKey = 'relay_storage_test';
        const testValue = Math.random().toString();
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        storageData.localStorage = retrieved === testValue ? 'available' : 'limited';
      } catch (e) {
        storageData.localStorage = 'blocked';
      }
    } else {
      storageData.localStorage = 'unavailable';
    }
    
    // Test sessionStorage
    if (window.sessionStorage) {
      try {
        const testKey = 'relay_session_test';
        const testValue = Math.random().toString();
        sessionStorage.setItem(testKey, testValue);
        const retrieved = sessionStorage.getItem(testKey);
        sessionStorage.removeItem(testKey);
        storageData.sessionStorage = retrieved === testValue ? 'available' : 'limited';
      } catch (e) {
        storageData.sessionStorage = 'blocked';
      }
    } else {
      storageData.sessionStorage = 'unavailable';
    }
    
    // Test IndexedDB
    if (window.indexedDB) {
      try {
        const request = indexedDB.open('relay_idb_test', 1);
        await new Promise((resolve, reject) => {
          request.onsuccess = () => {
            const db = request.result;
            db.close();
            indexedDB.deleteDatabase('relay_idb_test');
            resolve();
          };
          request.onerror = reject;
          request.onblocked = reject;
          setTimeout(reject, 1000); // Timeout
        });
        storageData.indexedDB = 'available';
      } catch (e) {
        storageData.indexedDB = 'blocked';
      }
    } else {
      storageData.indexedDB = 'unavailable';
    }
    
    // Test cookie support
    try {
      document.cookie = 'relay_cookie_test=1; SameSite=Strict';
      const cookieExists = document.cookie.indexOf('relay_cookie_test=1') !== -1;
      document.cookie = 'relay_cookie_test=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      storageData.cookies = cookieExists ? 'available' : 'blocked';
    } catch (e) {
      storageData.cookies = 'blocked';
    }
    
    return storageData;
    
  } catch (error) {
    console.warn('Storage fingerprinting failed:', error);
    return { storage: 'error' };
  }
}

/**
 * Generate hardware-based fingerprint
 */
async function generateHardwareFingerprint() {
  try {
    const hardwareData = {
      // CPU cores
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      
      // Memory (if available)
      deviceMemory: navigator.deviceMemory || 'unknown',
      
      // Battery (if available)
      battery: 'unknown'
    };
    
    // Try to get battery info
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        hardwareData.battery = {
          charging: battery.charging,
          level: Math.round(battery.level * 100),
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch (e) {
        hardwareData.battery = 'blocked';
      }
    }
    
    // Network connection info
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        hardwareData.connection = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };
      }
    }
    
    return hardwareData;
    
  } catch (error) {
    console.warn('Hardware fingerprinting failed:', error);
    return { hardware: 'error' };
  }
}

/**
 * Generate network-based fingerprint
 */
async function generateNetworkFingerprint() {
  try {
    const networkData = {};
    
    // WebRTC IP detection (if available)
    if (window.RTCPeerConnection) {
      try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        const dataChannel = pc.createDataChannel('');
        
        networkData.webrtc = await new Promise((resolve) => {
          const ips = [];
          
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              const candidate = event.candidate.candidate;
              const ipMatch = candidate.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/);
              if (ipMatch && !ips.includes(ipMatch[0])) {
                ips.push(ipMatch[0]);
              }
            }
          };
          
          pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .catch(() => {});
          
          setTimeout(() => {
            pc.close();
            resolve(ips.length > 0 ? ips : 'unavailable');
          }, 1000);
        });
      } catch (e) {
        networkData.webrtc = 'blocked';
      }
    } else {
      networkData.webrtc = 'unavailable';
    }
    
    return networkData;
    
  } catch (error) {
    console.warn('Network fingerprinting failed:', error);
    return { network: 'error' };
  }
}

/**
 * Compare two device fingerprints for similarity
 */
export function compareFingerprints(fingerprint1, fingerprint2, threshold = 0.8) {
  if (!fingerprint1 || !fingerprint2) {
    return { similarity: 0, match: false };
  }
  
  // Simple string comparison for now
  if (fingerprint1 === fingerprint2) {
    return { similarity: 1.0, match: true };
  }
  
  // Calculate character-level similarity
  const longer = fingerprint1.length > fingerprint2.length ? fingerprint1 : fingerprint2;
  const shorter = fingerprint1.length > fingerprint2.length ? fingerprint2 : fingerprint1;
  
  if (longer.length === 0) {
    return { similarity: 1.0, match: true };
  }
  
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer[i] === shorter[i]) {
      matches++;
    }
  }
  
  const similarity = matches / longer.length;
  const match = similarity >= threshold;
  
  return { similarity, match };
}

/**
 * Check if current device fingerprint matches any in a list
 */
export async function checkForDuplicateFingerprints(knownFingerprints, threshold = 0.8) {
  const currentFingerprint = await generateComprehensiveFingerprint();
  const matches = [];
  
  for (const [deviceId, fingerprint] of Object.entries(knownFingerprints)) {
    const comparison = compareFingerprints(currentFingerprint, fingerprint, threshold);
    if (comparison.match) {
      matches.push({
        deviceId,
        similarity: comparison.similarity,
        fingerprint
      });
    }
  }
  
  return {
    currentFingerprint,
    matches,
    isDuplicate: matches.length > 0
  };
}

export default {
  detectDevice,
  checkWebGLSupport,
  isMobile,
  getOptimalCameraConstraints,
  checkDeviceRequirements,
  getOrientation,
  useDeviceInfo,
  generateDeviceFingerprint,
  generateComprehensiveFingerprint
};

