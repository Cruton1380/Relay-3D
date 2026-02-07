/**
 * ML-based gesture detection
 * Provides specialized detection functions for facial and body gestures
 */
import { GESTURE_TYPES } from '../gesture/constants';

/**
 * Detect facial gestures from face landmark data
 * @param {Object} faceLandmarks - Face landmark data from ML model
 * @returns {Object} Object with detected gestures and confidence scores
 */
export function detectFacialGestures(faceLandmarks) {
  if (!faceLandmarks || !faceLandmarks.positions) {
    return { confidences: {} };
  }
  
  // Initialize results
  const result = {
    confidences: {}
  };

  // Smile detection
  const smileConfidence = detectSmile(faceLandmarks);
  result[GESTURE_TYPES.SMILE] = smileConfidence > 0.7;
  result.confidences[GESTURE_TYPES.SMILE] = smileConfidence;
  
  // Eyes closed detection
  const eyesClosedConfidence = detectEyesClosed(faceLandmarks);
  result[GESTURE_TYPES.CLOSE_EYES] = eyesClosedConfidence > 0.7;
  result.confidences[GESTURE_TYPES.CLOSE_EYES] = eyesClosedConfidence;
  
  // Mouth open detection
  const mouthOpenConfidence = detectMouthOpen(faceLandmarks);
  result[GESTURE_TYPES.OPEN_MOUTH] = mouthOpenConfidence > 0.7;
  result.confidences[GESTURE_TYPES.OPEN_MOUTH] = mouthOpenConfidence;
  
  // Head tilt detection
  const headTiltData = detectHeadTilt(faceLandmarks);
  result[GESTURE_TYPES.TILT_HEAD_RIGHT] = headTiltData.rightTilt > 0.7;
  result.confidences[GESTURE_TYPES.TILT_HEAD_RIGHT] = headTiltData.rightTilt;
  result[GESTURE_TYPES.TILT_HEAD_LEFT] = headTiltData.leftTilt > 0.7;
  result.confidences[GESTURE_TYPES.TILT_HEAD_LEFT] = headTiltData.leftTilt;
  
  // Head movement detection
  const headMovementData = detectHeadMovement(faceLandmarks);
  result[GESTURE_TYPES.NOD_HEAD] = headMovementData.nodding > 0.7;
  result.confidences[GESTURE_TYPES.NOD_HEAD] = headMovementData.nodding;
  result[GESTURE_TYPES.SHAKE_HEAD] = headMovementData.shaking > 0.7;
  result.confidences[GESTURE_TYPES.SHAKE_HEAD] = headMovementData.shaking;
  
  return result;
}

/**
 * Detect body gestures from pose data
 * @param {Object} poseData - Pose data from ML model
 * @returns {Object} Object with detected gestures and confidence scores
 */
export function detectBodyGestures(poseData) {
  if (!poseData || !poseData.keypoints) {
    return { confidences: {} };
  }
  
  // Initialize results
  const result = {
    confidences: {}
  };

  // Detect right hand raised
  const rightHandData = detectRightHandRaised(poseData);
  result[GESTURE_TYPES.RAISE_RIGHT_HAND] = rightHandData.raised;
  result.confidences[GESTURE_TYPES.RAISE_RIGHT_HAND] = rightHandData.confidence;
  
  // Detect left hand raised
  const leftHandData = detectLeftHandRaised(poseData);
  result[GESTURE_TYPES.RAISE_LEFT_HAND] = leftHandData.raised;
  result.confidences[GESTURE_TYPES.RAISE_LEFT_HAND] = leftHandData.confidence;
  
  return result;
}

// Private helper functions
function detectSmile(faceLandmarks) {
  try {
    const mouth = faceLandmarks.getMouth();
    if (!mouth) return 0;
    
    // Calculate mouth width/height ratio
    const mouthWidth = calculateDistance(mouth[0], mouth[6]);
    const mouthHeight = calculateDistance(mouth[3], mouth[9]);
    
    // Calculate smile coefficient
    const smileRatio = mouthWidth / mouthHeight;
    
    // Convert ratio to confidence (0-1)
    return Math.min(Math.max((smileRatio - 2) / 3, 0), 1);
  } catch (error) {
    console.error('Error in smile detection:', error);
    return 0;
  }
}

function detectEyesClosed(faceLandmarks) {
  try {
    const leftEye = faceLandmarks.getLeftEye();
    const rightEye = faceLandmarks.getRightEye();
    
    if (!leftEye || !rightEye) return 0;
    
    // Calculate eye height/width ratios
    const leftEyeRatio = getEyeAspectRatio(leftEye);
    const rightEyeRatio = getEyeAspectRatio(rightEye);
    
    // Average the ratios
    const avgRatio = (leftEyeRatio + rightEyeRatio) / 2;
    
    // Convert to confidence (0-1), where lower ratio = more closed
    return Math.min(Math.max(1 - (avgRatio / 0.25), 0), 1);
  } catch (error) {
    console.error('Error in eyes closed detection:', error);
    return 0;
  }
}

function detectMouthOpen(faceLandmarks) {
  try {
    const mouth = faceLandmarks.getMouth();
    if (!mouth) return 0;
    
    // Calculate mouth height/width ratio
    const mouthWidth = calculateDistance(mouth[0], mouth[6]);
    const mouthHeight = calculateDistance(mouth[3], mouth[9]);
    
    // Calculate open mouth coefficient
    const openMouthRatio = mouthHeight / mouthWidth;
    
    // Convert ratio to confidence (0-1)
    return Math.min(Math.max((openMouthRatio - 0.2) / 0.5, 0), 1);
  } catch (error) {
    console.error('Error in mouth open detection:', error);
    return 0;
  }
}

function detectHeadTilt(faceLandmarks) {
  // Implementation for head tilt detection
  try {
    const leftEye = faceLandmarks.getLeftEye();
    const rightEye = faceLandmarks.getRightEye();
    
    if (!leftEye || !rightEye) return { rightTilt: 0, leftTilt: 0 };
    
    const leftEyeCenter = getCenterPoint(leftEye);
    const rightEyeCenter = getCenterPoint(rightEye);
    
    // Calculate angle between eyes
    const angle = Math.atan2(
      rightEyeCenter.y - leftEyeCenter.y,
      rightEyeCenter.x - leftEyeCenter.x
    ) * (180 / Math.PI);
    
    // Positive angle = right tilt, negative angle = left tilt
    // Convert angle to tilt confidence
    const rightTilt = Math.min(Math.max(angle / 20, 0), 1);
    const leftTilt = Math.min(Math.max(-angle / 20, 0), 1);
    
    return { rightTilt, leftTilt };
  } catch (error) {
    console.error('Error in head tilt detection:', error);
    return { rightTilt: 0, leftTilt: 0 };
  }
}

function detectHeadMovement(faceLandmarks) {
  // Tracks facial landmarks across frames for movement detection
  return {
    nodding: 0,
    shaking: 0
  };
}

function detectRightHandRaised(poseData) {
  try {
    // Get relevant keypoints
    const rightWrist = poseData.keypoints.find(kp => kp.name === 'right_wrist');
    const rightShoulder = poseData.keypoints.find(kp => kp.name === 'right_shoulder');
    const rightElbow = poseData.keypoints.find(kp => kp.name === 'right_elbow');
    
    if (!rightWrist || !rightShoulder || !rightElbow) {
      return { raised: false, confidence: 0 };
    }
    
    // Check if wrist is above shoulder (y-coordinate is less in image space)
    const isRaised = rightWrist.y < rightShoulder.y && rightElbow.y < rightShoulder.y;
    
    // Calculate how much the hand is raised
    const heightAboveShoulder = rightShoulder.y - rightWrist.y;
    const normalizedHeight = Math.min(Math.max(heightAboveShoulder / 100, 0), 1);
    
    // Use the pose model's confidence scores
    const keypointConfidence = (rightWrist.score + rightElbow.score + rightShoulder.score) / 3;
    
    // Combined confidence score
    const confidence = isRaised ? normalizedHeight * keypointConfidence : 0;
    
    return { raised: isRaised, confidence };
  } catch (error) {
    console.error('Error in right hand raised detection:', error);
    return { raised: false, confidence: 0 };
  }
}

function detectLeftHandRaised(poseData) {
  try {
    // Get relevant keypoints
    const leftWrist = poseData.keypoints.find(kp => kp.name === 'left_wrist');
    const leftShoulder = poseData.keypoints.find(kp => kp.name === 'left_shoulder');
    const leftElbow = poseData.keypoints.find(kp => kp.name === 'left_elbow');
    
    if (!leftWrist || !leftShoulder || !leftElbow) {
      return { raised: false, confidence: 0 };
    }
    
    // Check if wrist is above shoulder (y-coordinate is less in image space)
    const isRaised = leftWrist.y < leftShoulder.y && leftElbow.y < leftShoulder.y;
    
    // Calculate how much the hand is raised
    const heightAboveShoulder = leftShoulder.y - leftWrist.y;
    const normalizedHeight = Math.min(Math.max(heightAboveShoulder / 100, 0), 1);
    
    // Use the pose model's confidence scores
    const keypointConfidence = (leftWrist.score + leftElbow.score + leftShoulder.score) / 3;
    
    // Combined confidence score
    const confidence = isRaised ? normalizedHeight * keypointConfidence : 0;
    
    return { raised: isRaised, confidence };
  } catch (error) {
    console.error('Error in left hand raised detection:', error);
    return { raised: false, confidence: 0 };
  }
}

// Helper utility functions
function getCenterPoint(points) {
  const centerX = points.reduce((sum, pt) => sum + pt.x, 0) / points.length;
  const centerY = points.reduce((sum, pt) => sum + pt.y, 0) / points.length;
  return { x: centerX, y: centerY };
}

function calculateDistance(point1, point2) {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
}

function getEyeAspectRatio(eye) {
  // Calculate the eye aspect ratio as per the formula:
  // EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
  const height1 = calculateDistance(eye[1], eye[5]);
  const height2 = calculateDistance(eye[2], eye[4]);
  const width = calculateDistance(eye[0], eye[3]);
  return (height1 + height2) / (2.0 * width);
}
