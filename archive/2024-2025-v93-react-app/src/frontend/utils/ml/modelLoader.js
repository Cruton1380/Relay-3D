/**
 * ML Model Loader
 * Central utility for loading and managing ML models
 * Supports TensorFlow.js models for face and pose detection
 */

import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as poseDetection from '@tensorflow-models/pose-detection';

// Cache for loaded models
const modelCache = new Map();
const MODEL_URL = '/models';

/**
 * Check if WebGL is supported
 * @returns {boolean} Whether WebGL is supported
 */
export function isWebGLSupported() {
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
 * Load a ML model with caching
 * @param {string} modelType - Type of model to load ('facemesh', 'movenet', 'blazepose', 'efficientpose')
 * @param {Object} options - Model-specific options
 * @returns {Promise<Object>} The loaded model
 */
export async function loadModel(modelType, options = {}) {
  // Check if model already loaded
  if (modelCache.has(modelType)) {
    return modelCache.get(modelType);
  }
  
  // Ensure TensorFlow backend is initialized
  await tf.ready();
  
  let model;
  
  try {
    switch (modelType.toLowerCase()) {
      case 'facemesh':
        model = await faceLandmarksDetection.load(
          faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
          { maxFaces: options.maxFaces || 1 }
        );
        break;
        
      case 'movenet':
        model = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          {
            modelType: options.modelVariant || 'lightning',
            enableSmoothing: options.enableSmoothing !== false
          }
        );
        break;
        
      case 'blazepose':
        model = await poseDetection.createDetector(
          poseDetection.SupportedModels.BlazePose,
          {
            runtime: 'tfjs',
            modelType: options.modelVariant || 'full'
          }
        );
        break;
        
      case 'efficientpose':
        model = await poseDetection.createDetector(
          poseDetection.SupportedModels.PoseNet,
          {
            quantBytes: options.quantBytes || 2,
            architecture: 'MobileNetV2',
            outputStride: options.outputStride || 16,
            inputResolution: options.inputResolution || { width: 257, height: 257 }
          }
        );
        break;
        
      default:
        throw new Error(`Unknown model type: ${modelType}`);
    }
    
    // Cache the model
    modelCache.set(modelType, model);
    
    return model;
  } catch (error) {
    console.error(`Error loading model ${modelType}:`, error);
    throw error;
  }
}

/**
 * Unload a model and remove from cache
 * @param {string} modelType - Type of model to unload
 */
export function unloadModel(modelType) {
  if (modelCache.has(modelType)) {
    const model = modelCache.get(modelType);
    if (model && model.dispose) {
      model.dispose();
    }
    modelCache.delete(modelType);
  }
}

/**
 * Unload all models and clear cache
 */
export function unloadAllModels() {
  for (const [_, model] of modelCache.entries()) {
    if (model && model.dispose) {
      model.dispose();
    }
  }
  modelCache.clear();
}

/**
 * Get model loading status
 * @returns {Object} Status of model loading
 */
export function getModelLoadingStatus() {
  return {
    loadedModels: Array.from(modelCache.keys()),
    isWebGLAvailable: isWebGLSupported(),
    tfBackend: tf.getBackend()
  };
}

export default {
  loadModel,
  unloadModel,
  unloadAllModels,
  isWebGLSupported,
  getModelLoadingStatus
};
