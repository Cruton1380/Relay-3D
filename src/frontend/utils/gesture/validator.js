/**
 * Gesture validation using detector results
 */
import { GESTURE_TYPES, GESTURE_CATEGORIES } from './constants';
import { detectFacialGestures, detectBodyGestures } from '../ml/gestureDetector';

/**
 * Validate if a detected gesture matches the requested gesture
 * @param {string} requestedGesture - The gesture type requested
 * @param {Object} poseData - The pose data from the ML model
 * @param {Object} faceData - The face landmark data
 * @returns {boolean} Whether the gesture matches
 */
export function validateGesture(requestedGesture, poseData, faceData) {
  // Check if the gesture type is valid
  if (!Object.values(GESTURE_TYPES).includes(requestedGesture)) {
    return false;
  }
  
  // Determine the category of the gesture
  const category = GESTURE_CATEGORIES[requestedGesture];
  
  // Validate based on category
  if (category === 'face') {
    if (!faceData) return false;
    const facialGestures = detectFacialGestures(faceData);
    return facialGestures[requestedGesture] === true;
  } else if (category === 'body') {
    if (!poseData) return false;
    const bodyGestures = detectBodyGestures(poseData);
    return bodyGestures[requestedGesture] === true;
  }
  
  return false;
}

/**
 * Calculate confidence score for the detected gesture
 * @param {string} requestedGesture - The gesture type requested
 * @param {Object} poseData - The pose data from the ML model
 * @param {Object} faceData - The face landmark data
 * @returns {number} Confidence score (0-1)
 */
export function calculateGestureConfidence(requestedGesture, poseData, faceData) {
  // Check if the gesture type is valid
  if (!Object.values(GESTURE_TYPES).includes(requestedGesture)) {
    return 0;
  }
  
  // Determine the category of the gesture
  const category = GESTURE_CATEGORIES[requestedGesture];
  
  // Calculate confidence based on category
  if (category === 'face') {
    if (!faceData) return 0;
    const facialGestures = detectFacialGestures(faceData);
    return facialGestures.confidences?.[requestedGesture] || 0;
  } else if (category === 'body') {
    if (!poseData) return 0;
    const bodyGestures = detectBodyGestures(poseData);
    return bodyGestures.confidences?.[requestedGesture] || 0;
  }
  
  return 0;
}
