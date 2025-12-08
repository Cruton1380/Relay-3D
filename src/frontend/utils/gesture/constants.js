/**
 * Gesture type constants and mapping to human-readable instructions
 */

// Constants for gesture types
export const GESTURE_TYPES = {
  RAISE_RIGHT_HAND: 'raiseRightHand',
  RAISE_LEFT_HAND: 'raiseLeftHand',
  TILT_HEAD_RIGHT: 'tiltHeadRight',
  TILT_HEAD_LEFT: 'tiltHeadLeft',
  NOD_HEAD: 'nodHead',
  SHAKE_HEAD: 'shakeHead',
  SMILE: 'smile',
  CLOSE_EYES: 'closeEyes',
  OPEN_MOUTH: 'openMouth'
};

// Mapping of gesture types to human-readable instructions
export const GESTURE_INSTRUCTIONS = {
  [GESTURE_TYPES.RAISE_RIGHT_HAND]: 'Raise your right hand',
  [GESTURE_TYPES.RAISE_LEFT_HAND]: 'Raise your left hand',
  [GESTURE_TYPES.TILT_HEAD_RIGHT]: 'Tilt your head to the right',
  [GESTURE_TYPES.TILT_HEAD_LEFT]: 'Tilt your head to the left',
  [GESTURE_TYPES.NOD_HEAD]: 'Nod your head',
  [GESTURE_TYPES.SHAKE_HEAD]: 'Shake your head',
  [GESTURE_TYPES.SMILE]: 'Smile',
  [GESTURE_TYPES.CLOSE_EYES]: 'Close your eyes',
  [GESTURE_TYPES.OPEN_MOUTH]: 'Open your mouth'
};

// Mapping of gesture types to detector functions
export const GESTURE_CATEGORIES = {
  [GESTURE_TYPES.RAISE_RIGHT_HAND]: 'body',
  [GESTURE_TYPES.RAISE_LEFT_HAND]: 'body',
  [GESTURE_TYPES.TILT_HEAD_RIGHT]: 'face',
  [GESTURE_TYPES.TILT_HEAD_LEFT]: 'face',
  [GESTURE_TYPES.NOD_HEAD]: 'face',
  [GESTURE_TYPES.SHAKE_HEAD]: 'face',
  [GESTURE_TYPES.SMILE]: 'face',
  [GESTURE_TYPES.CLOSE_EYES]: 'face',
  [GESTURE_TYPES.OPEN_MOUTH]: 'face'
};
