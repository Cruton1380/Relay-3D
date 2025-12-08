/**
 * Gesture utilities public API
 * Consolidates all gesture-related functionality
 */
export { GESTURE_TYPES, GESTURE_INSTRUCTIONS } from './constants';
export { generateGestureSequence, getGestureInstruction } from './sequencer';
export { validateGesture, calculateGestureConfidence } from './validator';

// Re-export detector functions for direct access if needed
export { detectFacialGestures, detectBodyGestures } from '../ml/gestureDetector';