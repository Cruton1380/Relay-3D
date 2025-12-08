// frontend/services/biometricAPI.js
import { apiGet, apiPost } from './apiClient';
import * as faceapi from 'face-api.js';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { calculateCosineSimilarity, hexToBits, compareTemplates as compareTemplatesUtil } from '../utils/biometricUtils';

// Store for face-api.js models
let modelsLoaded = false;
let modelLoadPromise = null;

/**
 * Make API request to enroll biometric data
 * @param {string} biometricData - Base64 encoded biometric image data
 * @returns {Promise<Object>} Enrollment result
 */
export async function enrollBiometric(biometricData) {
  return apiPost('/biometrics/enroll', { 
    biometricData,
    source: 'enrollment'
  });
}

/**
 * Make API request to verify biometric data
 * @param {string} biometricData - Base64 encoded biometric image data
 * @returns {Promise<Object>} Verification result
 */
export async function verifyBiometric(biometricData) {
  return apiPost('/biometrics/verify', { biometricData });
}

/**
 * Check if biometric reverification is needed
 * @returns {Promise<Object>} Reverification status
 */
export async function checkReverificationStatus() {
  return apiGet('/biometrics/reverification-status');
}

/**
 * Submit biometric data for reverification
 * @param {string} biometricData - Base64 encoded biometric image data
 * @returns {Promise<Object>} Reverification result
 */
export async function submitReverification(biometricData) {
  const template = await captureBiometricTemplate(biometricData);
  
  return apiPost('/biometrics/reverify', {
    biometricHash: template.hash,
    lshBuckets: template.lshBuckets,
    metadata: {
      source: 'reverification',
      quality: template.quality
    }
  });
}

/**
 * Load face recognition models
 * @returns {Promise<void>}
 */
export async function loadModels() {
  if (modelsLoaded) return;
  
  if (modelLoadPromise) {
    return modelLoadPromise;
  }
  
  modelLoadPromise = (async () => {
    try {
      console.log('Loading face-api.js models...');
      
      // Set up model paths
      const MODEL_URL = '/models';
      
      // Load all required models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
      ]);
      
      modelsLoaded = true;
      console.log('face-api.js models loaded successfully');
    } catch (error) {
      console.error('Failed to load face-api.js models:', error);
      throw new Error(`Model loading failed: ${error.message}`);
    }
  })();
  
  return modelLoadPromise;
}

/**
 * Extract biometric features from an image
 * @param {HTMLVideoElement|HTMLImageElement|string} input - Input source (video, image, or base64)
 * @returns {Promise<Object>} Extracted features and metadata
 */
export async function extractBiometricFeatures(input) {
  await loadModels();
  
  let imgElement;
  
  if (typeof input === 'string') {
    // Convert base64 to image
    imgElement = new Image();
    imgElement.src = input.startsWith('data:') ? input : `data:image/jpeg;base64,${input}`;
    await new Promise(resolve => imgElement.onload = resolve);
  } else {
    imgElement = input;
  }
  
  try {
    // Detect face with all features
    const detection = await faceapi
      .detectSingleFace(imgElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()
      .withFaceExpressions()
      .withAgeAndGender();
    
    if (!detection) {
      throw new Error('No face detected');
    }
    
    // Extract comprehensive features
    const features = {
      descriptor: Array.from(detection.descriptor),
      landmarks: normalizeLandmarks(detection.landmarks.positions, detection.detection.box),
      confidence: detection.detection.score,
      expressions: detection.expressions,
      age: Math.round(detection.age),
      gender: detection.gender,
      genderProbability: detection.genderProbability
    };
    
    // Generate hash
    const hash = generateBiometricHash(features);
    
    // Generate LSH buckets for similarity search
    const lshBuckets = generateLSHBuckets(hash);
    
    // Assess quality
    const quality = assessFaceQuality(detection, imgElement);
    
    return {
      features,
      hash,
      lshBuckets,
      quality,
      metadata: {
        confidence: detection.detection.score,
        timestamp: Date.now(),
        faceBox: detection.detection.box,
        age: Math.round(detection.age),
        gender: detection.gender
      }
    };
  } catch (error) {
    console.error('Error extracting biometric features:', error);
    throw error;
  }
}

/**
 * Capture a biometric template from a video element or image
 * @param {HTMLVideoElement|HTMLImageElement|string} input - Input source
 * @param {Object} options - Capture options
 * @returns {Promise<Object>} Biometric template
 */
export async function captureBiometricTemplate(input, options = {}) {
  try {
    // Extract features
    const result = await extractBiometricFeatures(input);
    
    return {
      hash: result.hash,
      lshBuckets: result.lshBuckets,
      quality: result.quality,
      metadata: {
        ...result.metadata,
        source: options.source || 'enrollment'
      }
    };
  } catch (error) {
    console.error('Error capturing biometric template:', error);
    throw error;
  }
}

/**
 * Normalize facial landmarks to be invariant to face position and size
 * @param {Array} landmarks - Raw landmark positions
 * @param {Object} box - Face bounding box
 * @returns {Array} Normalized landmarks
 */
function normalizeLandmarks(landmarks, box) {
  return landmarks.map(point => ({
    x: (point.x - box.x) / box.width,
    y: (point.y - box.y) / box.height
  }));
}

/**
 * Generate biometric hash from template features
 * @param {Object} template - Template with features
 * @returns {string} Biometric hash
 */
function generateBiometricHash(template) {
  // Serialize template features
  const descriptorBytes = new Float32Array(template.descriptor).buffer;
  const descriptorArray = new Uint8Array(descriptorBytes);
  
  // Hash the descriptor
  const hash = sha256(descriptorArray);
  return bytesToHex(hash);
}

/**
 * Generate locality-sensitive hashing buckets for fast similarity search
 * @param {string} hash - Biometric hash
 * @param {number} bands - Number of bands
 * @param {number} rowsPerBand - Rows per band
 * @returns {Array<string>} LSH buckets
 */
export function generateLSHBuckets(hash, bands = 8, rowsPerBand = 8) {
  const bits = hexToBits(hash);
  const buckets = [];
  
  for (let i = 0; i < bands; i++) {
    let bandBits = '';
    for (let j = 0; j < rowsPerBand; j++) {
      const bitIndex = i * rowsPerBand + j;
      if (bitIndex < bits.length) {
        bandBits += bits[bitIndex];
      }
    }
    // Create a bucket name from the band bits
    buckets.push(`band-${i}-${bandBits}`);
  }
  
  return buckets;
}

/**
 * Assess face quality for template enrollment
 * @param {Object} detection - Face detection result
 * @param {HTMLElement} imgElement - Image element
 * @returns {number} Quality score (0-1)
 */
function assessFaceQuality(detection, imgElement) {
  // Check face size relative to image
  const faceBox = detection.detection.box;
  const imgArea = imgElement.width * imgElement.height;
  const faceArea = faceBox.width * faceBox.height;
  const faceSizeRatio = faceArea / imgArea;
  
  // Calculate distance from center
  const imgCenterX = imgElement.width / 2;
  const imgCenterY = imgElement.height / 2;
  const faceCenterX = faceBox.x + faceBox.width / 2;
  const faceCenterY = faceBox.y + faceBox.height / 2;
  
  const normalizedDistance = Math.sqrt(
    Math.pow((faceCenterX - imgCenterX) / imgElement.width, 2) +
    Math.pow((faceCenterY - imgCenterY) / imgElement.height, 2)
  );
  
  // Check face angle using landmarks
  const landmarks = detection.landmarks.positions;
  const leftEye = landmarks[36]; // Left eye outer corner
  const rightEye = landmarks[45]; // Right eye outer corner
  const eyeDistance = Math.sqrt(
    Math.pow(rightEye.x - leftEye.x, 2) +
    Math.pow(rightEye.y - leftEye.y, 2)
  );
  
  // Calculate scores
  const sizeScore = Math.min(1, faceSizeRatio * 5); // Ideal is 20% of image
  const centeringScore = Math.max(0, 1 - normalizedDistance * 3);
  const angleScore = Math.min(1, eyeDistance / (faceBox.width * 0.5));
  const detectionScore = detection.detection.score;
  
  // Weighted quality score
  const qualityScore = 
    sizeScore * 0.3 + 
    centeringScore * 0.3 + 
    angleScore * 0.2 + 
    detectionScore * 0.2;
  
  return Math.min(1, Math.max(0, qualityScore));
}

/**
 * Compare two biometric templates
 * @param {Object} template1 - First template
 * @param {Object} template2 - Second template
 * @returns {number} Similarity score (0-1)
 */
export function compareTemplates(template1, template2) {
  // If templates have descriptors, compare them directly
  if (template1.features?.descriptor && template2.features?.descriptor) {
    return calculateCosineSimilarity(
      template1.features.descriptor,
      template2.features.descriptor
    );
  }
  
  // Use the shared utility for other template types
  return compareTemplatesUtil(template1, template2);
}

/**
 * Verify if a biometric hash is unique
 * @param {string} biometricHash - Biometric hash to check
 * @returns {Promise<Object>} Verification result
 */
export async function verifyBiometricUniqueness(biometricHash) {
  return apiPost('/biometrics/check-uniqueness', { biometricHash });
}

/**
 * Initialize biometric reverification
 * @returns {Promise<boolean>} Whether initialization was successful
 */
export async function initBiometricReverification() {
  try {
    const status = await checkReverificationStatus();
    
    if (status.needsReverification) {
      console.log('Biometric reverification needed');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error initializing biometric reverification:', error);
    return false;
  }
}

/**
 * Start the biometric reverification process
 * @returns {Promise<Object>} Reverification result
 */
export async function startReverificationProcess() {
  try {
    // Ask for camera access
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user' } 
    });
    
    // Create video element
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    
    // Wait for video to load
    await new Promise(resolve => {
      video.onloadedmetadata = () => {
        video.play().then(resolve);
      };
    });
    
    // Capture biometric template
    const template = await captureBiometricTemplate(video, { 
      source: 'reverification' 
    });
    
    // Stop camera
    stream.getTracks().forEach(track => track.stop());
    
    // Submit reverification
    const result = await submitReverification(template);
    
    return result;
  } catch (error) {
    console.error('Error during reverification process:', error);
    throw error;
  }
}

/**
 * Clean up resources
 */
export function cleanup() {
  if (faceDetectionModel) {
    faceDetectionModel.dispose();
  }
  if (faceLandmarkModel) {
    faceLandmarkModel.dispose();
  }
  if (faceRecognitionModel) {
    faceRecognitionModel.dispose();
  }
  
  modelsLoaded = false;
  modelLoadPromise = null;
}

// Default export for backward compatibility
export default {
  enrollBiometric,
  verifyBiometric,
  checkReverificationStatus,
  loadModels,
  captureBiometricTemplate,
  extractBiometricFeatures,
  verifyBiometricUniqueness,
  initBiometricReverification,
  startReverificationProcess,
  cleanup
};


