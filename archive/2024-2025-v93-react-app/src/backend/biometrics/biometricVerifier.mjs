/**
 * @fileoverview Biometric verification service 
 * Handles feature extraction, template comparison, and quality assessment
 */
import biometricTemplateStore from './biometricTemplateStore.mjs';
import { extractBiometricFeatures } from './featureExtractor.mjs';
import logger from '../utils/logging/logger.mjs';
import { createError } from '../utils/common/errors.mjs';

const bioLogger = logger.child({ module: 'biometrics' });

/**
 * Find a biometric hash similar to the provided one
 * @param {string} biometricHash - The hash to compare
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Promise<string|null>} UserId of matching biometric if found, null otherwise
 */
export async function findSimilarBiometricHash(biometricHash, threshold = 0.85) {
  try {
    const targetFeatures = await extractBiometricFeatures(biometricHash);
    const similarTemplates = await biometricTemplateStore.findSimilarTemplates(targetFeatures, threshold);
    
    if (similarTemplates && similarTemplates.length > 0) {
      bioLogger.warn('Similar biometric template found', { 
        similarityScore: similarTemplates[0].similarity 
      });
      return similarTemplates[0].userId;
    }
    
    return null;
  } catch (error) {
    bioLogger.error('Error finding similar biometric hash', { error: error.message });
    throw createError('processing', 'Biometric comparison failed', { cause: error });
  }
}

/**
 * Assess the quality of a biometric hash
 * @param {string} biometricHash - The hash to assess
 * @returns {Promise<{acceptable: boolean, score: number, issues?: string[]}>} Quality assessment
 */
export async function assessBiometricQuality(biometricHash) {
  try {
    const features = await extractBiometricFeatures(biometricHash);
    
    // Perform quality checks (this would be more sophisticated in production)
    const qualityScore = calculateQualityScore(features);
    const issues = [];
    
    if (qualityScore < 0.6) {
      issues.push('Low quality biometric features');
    }
    
    return {
      acceptable: qualityScore >= 0.6,
      score: qualityScore,
      issues: issues.length > 0 ? issues : undefined
    };
  } catch (error) {
    bioLogger.error('Error assessing biometric quality', { error: error.message });
    throw createError('processing', 'Biometric quality assessment failed', { cause: error });
  }
}

/**
 * Store a biometric template for a user
 * @param {string} userId - The user ID to associate with the template
 * @param {string} biometricHash - The biometric hash to store
 * @param {Object} metadata - Additional metadata for the template
 * @returns {Promise<void>}
 */
export async function storeBiometricTemplate(userId, biometricHash, metadata = {}) {
  try {
    const features = await extractBiometricFeatures(biometricHash);
    
    const template = {
      userId,
      features,
      hash: biometricHash,
      createdAt: new Date().toISOString(),
      ...metadata
    };
    
    await biometricTemplateStore.addTemplate(template);
    
    bioLogger.info('Biometric template stored successfully', { 
      userId,
      hasMetadata: Object.keys(metadata).length > 0
    });
  } catch (error) {
    bioLogger.error('Error storing biometric template', { 
      userId, 
      error: error.message 
    });
    throw createError('storage', 'Failed to store biometric template', { cause: error });
  }
}

/**
 * Calculate the quality score for biometric features
 * @param {Object} features - Extracted biometric features
 * @returns {number} Quality score between 0 and 1
 * @private
 */
function calculateQualityScore(features) {
  if (!features || !features.metadata) {
    return 0;
  }
  
  // Use the quality score from metadata if available
  if (features.metadata.qualityScore !== undefined) {
    return features.metadata.qualityScore;
  }
  
  // Fallback quality calculation based on feature characteristics
  let score = 0.5; // Base score
  
  // Check for completeness of features
  if (features.data && features.data.length > 0) {
    score += 0.2;
  }
  
  // Check for sufficient feature density
  if (features.metadata.featureCount && features.metadata.featureCount > 10) {
    score += 0.2;
  }
  
  // Check for contrast/clarity indicators
  if (features.metadata.contrast && features.metadata.contrast > 0.5) {
    score += 0.1;
  }
  
  return Math.min(score, 1.0);
}

// Make calculateQualityScore available globally for testing
global.calculateQualityScore = calculateQualityScore;

export default {
  findSimilarBiometricHash,
  assessBiometricQuality,
  storeBiometricTemplate,
  calculateQualityScore
};
