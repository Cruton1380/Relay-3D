/**
 * Gesture sequence generation and management
 */
import { GESTURE_TYPES, GESTURE_INSTRUCTIONS } from './constants';

/**
 * Generate a random sequence of gestures for verification
 * @param {number} length - Number of gestures to generate
 * @param {Array<string>} exclude - Gesture types to exclude
 * @returns {Array<string>} Array of gesture types
 */
export function generateGestureSequence(length = 3, exclude = []) {
  const availableGestures = Object.values(GESTURE_TYPES).filter(
    gesture => !exclude.includes(gesture)
  );
  
  if (availableGestures.length < length) {
    throw new Error('Not enough available gesture types');
  }
  
  // Shuffle and pick random gestures
  const shuffled = [...availableGestures].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, length);
}

/**
 * Get the instruction text for a specific gesture
 * @param {string} gestureType - Gesture type from GESTURE_TYPES
 * @returns {string} Human-readable instruction
 */
export function getGestureInstruction(gestureType) {
  return GESTURE_INSTRUCTIONS[gestureType] || 'Perform the requested gesture';
}
