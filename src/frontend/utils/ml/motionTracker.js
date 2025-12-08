/**
 * Comprehensive Motion Tracker
 * Handles both facial landmarks and body pose detection
 * Consolidated from legacy motionTracker.mjs and modern implementation
 */

import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { calculateFeatureHash } from './featureHasher';
import { loadModel } from './modelLoader';

// Model caching
let faceModel = null;
let poseModel = null;
let faceModelLoadPromise = null;
let poseModelLoadPromise = null;

/**
 * Load the face landmarks detection model
 * @returns {Promise<faceLandmarksDetection.FaceLandmarksDetector>}
 */
export async function loadFaceModel() {
  if (faceModel) {
    return faceModel;
  }
  
  if (faceModelLoadPromise) {
    return faceModelLoadPromise;
  }
  
  faceModelLoadPromise = (async () => {
    try {
      // Load face detection model
      faceModel = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, 
        { maxFaces: 1 }
      );
      
      console.log('Face landmarks model loaded successfully');
      return faceModel;
    } catch (error) {
      console.error('Error loading face landmarks model:', error);
      throw error;
    }
  })();
  
  return faceModelLoadPromise;
}

/**
 * Load the pose detection model
 * @param {string} modelType - Model type ('movenet', 'blazepose', 'efficientpose')
 * @returns {Promise<poseDetection.PoseDetector>}
 */
export async function loadPoseModel(modelType = 'movenet') {
  if (poseModel) {
    return poseModel;
  }
  
  if (poseModelLoadPromise) {
    return poseModelLoadPromise;
  }
  
  poseModelLoadPromise = (async () => {
    try {
      // Use modelLoader for consistent model loading
      poseModel = await loadModel(modelType);
      console.log(`Pose model (${modelType}) loaded successfully`);
      return poseModel;
    } catch (error) {
      console.error(`Error loading pose model (${modelType}):`, error);
      throw error;
    }
  })();
  
  return poseModelLoadPromise;
}

/**
 * Detect facial landmarks in an image or video frame
 * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} input
 * @returns {Promise<Object>} Detected face landmarks
 */
export async function detectFacialLandmarks(input) {
  const model = await loadFaceModel();
  
  try {
    const predictions = await model.estimateFaces({
      input,
      returnTensors: false,
      flipHorizontal: false,
      predictIrises: true
    });
    
    if (predictions.length === 0) {
      return null;
    }
    
    return predictions[0];
  } catch (error) {
    console.error('Error detecting facial landmarks:', error);
    return null;
  }
}

/**
 * Detect body pose in an image or video frame
 * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} input
 * @param {string} modelType - Model type ('movenet', 'blazepose')
 * @returns {Promise<Object>} Detected body pose
 */
export async function detectBodyPose(input, modelType = 'movenet') {
  const model = await loadPoseModel(modelType);
  
  try {
    const poses = await model.estimatePoses(input, {
      flipHorizontal: false,
      maxPoses: 1
    });
    
    if (poses.length === 0) {
      return null;
    }
    
    return poses[0];
  } catch (error) {
    console.error('Error detecting body pose:', error);
    return null;
  }
}

/**
 * Calculate eye aspect ratio to detect blinks
 * @param {Object} landmarks - Facial landmarks
 * @returns {number} Eye aspect ratio
 */
export function calculateEyeAspectRatio(landmarks) {
  if (!landmarks || !landmarks.annotations) {
    return 0;
  }
  
  const { leftEyeUpper0, leftEyeLower0, rightEyeUpper0, rightEyeLower0 } = landmarks.annotations;
  
  if (!leftEyeUpper0 || !leftEyeLower0 || !rightEyeUpper0 || !rightEyeLower0) {
    return 0;
  }
  
  // Calculate left eye height
  const leftEyeHeight = Math.sqrt(
    Math.pow(leftEyeUpper0[3][0] - leftEyeLower0[4][0], 2) +
    Math.pow(leftEyeUpper0[3][1] - leftEyeLower0[4][1], 2)
  );
  
  // Calculate right eye height
  const rightEyeHeight = Math.sqrt(
    Math.pow(rightEyeUpper0[3][0] - rightEyeLower0[4][0], 2) +
    Math.pow(rightEyeUpper0[3][1] - rightEyeLower0[4][1], 2)
  );
  
  // Calculate left eye width
  const leftEyeWidth = Math.sqrt(
    Math.pow(leftEyeUpper0[0][0] - leftEyeUpper0[8][0], 2) +
    Math.pow(leftEyeUpper0[0][1] - leftEyeUpper0[8][1], 2)
  );
  
  // Calculate right eye width
  const rightEyeWidth = Math.sqrt(
    Math.pow(rightEyeUpper0[0][0] - rightEyeUpper0[8][0], 2) +
    Math.pow(rightEyeUpper0[0][1] - rightEyeUpper0[8][1], 2)
  );
  
  // Average eye aspect ratio
  const leftEAR = leftEyeHeight / leftEyeWidth;
  const rightEAR = rightEyeHeight / rightEyeWidth;
  
  return (leftEAR + rightEAR) / 2;
}

/**
 * Detect a smile based on facial landmarks
 * @param {Object} landmarks - Facial landmarks
 * @returns {boolean} Whether a smile is detected
 */
export function detectSmile(landmarks) {
  if (!landmarks || !landmarks.annotations) {
    return false;
  }
  
  const { lipsUpperOuter, lipsLowerOuter } = landmarks.annotations;
  
  if (!lipsUpperOuter || !lipsLowerOuter) {
    return false;
  }
  
  // Calculate mouth height
  const mouthHeight = Math.sqrt(
    Math.pow(lipsUpperOuter[5][0] - lipsLowerOuter[5][0], 2) +
    Math.pow(lipsUpperOuter[5][1] - lipsLowerOuter[5][1], 2)
  );
  
  // Calculate mouth width
  const mouthWidth = Math.sqrt(
    Math.pow(lipsUpperOuter[0][0] - lipsUpperOuter[10][0], 2) +
    Math.pow(lipsUpperOuter[0][1] - lipsUpperOuter[10][1], 2)
  );
  
  // Calculate mouth aspect ratio
  const mouthAspectRatio = mouthHeight / mouthWidth;
  
  // Threshold for smile detection (lower ratio = wider smile)
  return mouthAspectRatio < 0.3;
}

/**
 * Detect head pose (pitch, yaw, roll)
 * @param {Object} landmarks - Facial landmarks
 * @returns {Object} Head pose angles in degrees
 */
export function detectHeadPose(landmarks) {
  if (!landmarks || !landmarks.annotations) {
    return { pitch: 0, yaw: 0, roll: 0 };
  }
  
  const { noseTip, leftCheek, rightCheek, leftEyeUpper1, rightEyeUpper1 } = landmarks.annotations;
  
  if (!noseTip || !leftCheek || !rightCheek || !leftEyeUpper1 || !rightEyeUpper1) {
    return { pitch: 0, yaw: 0, roll: 0 };
  }
  
  // Calculate yaw (left-right head rotation)
  const leftDist = Math.sqrt(
    Math.pow(noseTip[0][0] - leftCheek[0][0], 2) +
    Math.pow(noseTip[0][1] - leftCheek[0][1], 2)
  );
  
  const rightDist = Math.sqrt(
    Math.pow(noseTip[0][0] - rightCheek[0][0], 2) +
    Math.pow(noseTip[0][1] - rightCheek[0][1], 2)
  );
  
  const yawRatio = leftDist / rightDist;
  const yaw = (yawRatio - 1) * 45; // Scale to approximate degrees
  
  // Calculate pitch (up-down head rotation)
  const eyeY = (leftEyeUpper1[4][1] + rightEyeUpper1[4][1]) / 2;
  const noseY = noseTip[0][1];
  const faceHeight = landmarks.boundingBox.bottomRight[1] - landmarks.boundingBox.topLeft[1];
  
  const normalizedDist = (noseY - eyeY) / faceHeight;
  const pitch = (normalizedDist - 0.17) * 90; // Scale to approximate degrees
  
  // Calculate roll (tilting head left-right)
  const leftEyeY = leftEyeUpper1[4][1];
  const rightEyeY = rightEyeUpper1[4][1];
  const eyeYDiff = leftEyeY - rightEyeY;
  
  const leftEyeX = leftEyeUpper1[4][0];
  const rightEyeX = rightEyeUpper1[4][0];
  const eyeXDiff = rightEyeX - leftEyeX;
  
  const roll = Math.atan2(eyeYDiff, eyeXDiff) * (180 / Math.PI);
  
  return { pitch, yaw, roll };
}

/**
 * Detect specific gestures based on facial landmarks
 * @param {Object} landmarks - Facial landmarks
 * @param {Object} prevLandmarks - Previous frame's landmarks for motion detection
 * @returns {Object} Detected gestures
 */
export function detectGestures(landmarks, prevLandmarks = null) {
  if (!landmarks) {
    return {
      smile: false,
      blink: false,
      nod: false,
      headTilt: false,
      eyebrowRaise: false
    };
  }
  
  // Calculate eye aspect ratio for blink detection
  const eyeAspectRatio = calculateEyeAspectRatio(landmarks);
  const blink = eyeAspectRatio < 0.2;
  
  // Detect smile
  const smile = detectSmile(landmarks);
  
  // Detect head pose
  const headPose = detectHeadPose(landmarks);
  
  // Detect head tilt (based on roll)
  const headTilt = Math.abs(headPose.roll) > 15;
  
  // Detect nodding (requires previous frame)
  let nod = false;
  if (prevLandmarks) {
    const prevHeadPose = detectHeadPose(prevLandmarks);
    const pitchDiff = Math.abs(headPose.pitch - prevHeadPose.pitch);
    nod = pitchDiff > 5;
  }
  
  // Detect eyebrow raise
  let eyebrowRaise = false;
  if (landmarks.annotations.leftEyebrowUpper && landmarks.annotations.rightEyebrowUpper) {
    const leftEyebrowY = landmarks.annotations.leftEyebrowUpper[0][1];
    const rightEyebrowY = landmarks.annotations.rightEyebrowUpper[0][1];
    const leftEyeY = landmarks.annotations.leftEyeUpper1[0][1];
    const rightEyeY = landmarks.annotations.rightEyeUpper1[0][1];
    
    const leftDist = Math.abs(leftEyebrowY - leftEyeY);
    const rightDist = Math.abs(rightEyebrowY - rightEyeY);
    const faceHeight = landmarks.boundingBox.bottomRight[1] - landmarks.boundingBox.topLeft[1];
    
    // Normalize by face height
    const normalizedDist = ((leftDist + rightDist) / 2) / faceHeight;
    eyebrowRaise = normalizedDist > 0.05;
  }
  
  return {
    smile,
    blink,
    nod,
    headTilt,
    eyebrowRaise,
    headPose
  };
}

/**
 * Detect body gestures based on pose keypoints
 * @param {Object} pose - Pose detection result
 * @param {Object} prevPose - Previous pose for motion detection
 * @returns {Object} Detected body gestures
 */
export function detectBodyGestures(pose, prevPose = null) {
  if (!pose || !pose.keypoints) {
    return {
      handRaise: false,
      squat: false,
      jump: false,
      armWave: false
    };
  }
  
  // Get keypoints
  const keypoints = pose.keypoints;
  const keypointsDict = {};
  
  // Convert array to dictionary for easier access
  keypoints.forEach(kp => {
    keypointsDict[kp.name] = kp;
  });
  
  // Hand raise detection
  const handRaise = detectHandRaiseGesture(keypointsDict);
  
  // Squat detection (needs previous pose)
  const squat = prevPose ? detectSquatGesture(keypointsDict, prevPose) : false;
  
  // Jump detection (needs previous pose)
  const jump = prevPose ? detectJumpGesture(keypointsDict, prevPose) : false;
  
  // Arm wave detection (needs previous pose)
  const armWave = prevPose ? detectArmWaveGesture(keypointsDict, prevPose) : false;
  
  return {
    handRaise,
    squat,
    jump,
    armWave
  };
}

// Add body gesture detection functions from legacy implementation
function detectHandRaiseGesture(keypoints) {
  // Implementation of hand raise detection based on keypoints
  if (!keypoints.left_wrist || !keypoints.left_shoulder || 
      !keypoints.right_wrist || !keypoints.right_shoulder) {
    return false;
  }
  
  // Check if either wrist is higher than shoulder
  const leftHandRaised = keypoints.left_wrist.y < keypoints.left_shoulder.y;
  const rightHandRaised = keypoints.right_wrist.y < keypoints.right_shoulder.y;
  
  return leftHandRaised || rightHandRaised;
}

function detectSquatGesture(keypoints, prevPose) {
  // Implementation for squat detection...
  return false;
}

function detectJumpGesture(keypoints, prevPose) {
  // Implementation for jump detection...
  return false;
}

function detectArmWaveGesture(keypoints, prevPose) {
  // Implementation for arm wave detection...
  return false;
}

export function generateFaceFeatureHash(landmarks) {
  if (!landmarks || !landmarks.annotations) {
    return null;
  }
  
  // Extract key points for feature hashing
  const featurePoints = [];
  
  // Add points from various facial features
  const featuresToInclude = [
    'noseTip', 
    'leftEyeUpper1', 
    'rightEyeUpper1',
    'lipsUpperOuter',
    'lipsLowerOuter'
  ];
  
  for (const feature of featuresToInclude) {
    if (landmarks.annotations[feature]) {
      // Take a subset of points to reduce dimensionality
      const points = landmarks.annotations[feature];
      for (let i = 0; i < points.length; i += 2) {
        featurePoints.push(points[i]);
      }
    }
  }
  
  // Flatten the points array
  const flattenedPoints = featurePoints.flat();
  
  // Calculate feature hash
  return calculateFeatureHash(flattenedPoints);
}

/**
 * Generate a feature hash from body pose
 * @param {Object} pose - Pose detection result
 * @returns {string} Feature hash
 */
export function generatePoseFeatureHash(pose) {
  if (!pose || !pose.keypoints) {
    return null;
  }
  
  // Extract key points for feature hashing
  const featurePoints = [];
  
  // Use normalized keypoints for more consistent hashing
  pose.keypoints.forEach(keypoint => {
    if (keypoint.score > 0.5) {
      featurePoints.push(keypoint.x, keypoint.y);
    }
  });
  
  // Calculate feature hash
  return calculateFeatureHash(featurePoints);
}

/**
 * Cleanup resources
 */
export function cleanup() {
  if (faceModel && faceModel.dispose) {
    faceModel.dispose();
    faceModel = null;
  }
  
  if (poseModel && poseModel.dispose) {
    poseModel.dispose();
    poseModel = null;
  }
  
  faceModelLoadPromise = null;
  poseModelLoadPromise = null;
}

export default {
  loadFaceModel,
  loadPoseModel,
  detectFacialLandmarks,
  detectBodyPose,
  calculateEyeAspectRatio,
  detectSmile,
  detectHeadPose,
  detectGestures,
  detectBodyGestures,
  generateFaceFeatureHash,
  generatePoseFeatureHash,
  cleanup
};

