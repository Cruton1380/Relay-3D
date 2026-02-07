/**
 * Shared biometric utility functions for similarity calculations
 */

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vec1 - First vector
 * @param {Array} vec2 - Second vector
 * @returns {number} Similarity score (0-1)
 */
export function calculateCosineSimilarity(vec1, vec2) {
  // Ensure vectors have same length
  if (vec1.length !== vec2.length) {
    // Resize shorter vector with zeros
    if (vec1.length < vec2.length) {
      vec1 = [...vec1, ...new Array(vec2.length - vec1.length).fill(0)];
    } else {
      vec2 = [...vec2, ...new Array(vec1.length - vec2.length).fill(0)];
    }
  }
  
  // Calculate dot product and magnitudes
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  // Calculate magnitudes
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  // Avoid division by zero
  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }
  
  // Return cosine similarity
  return dotProduct / (mag1 * mag2);
}

/**
 * Calculate hash similarity using bit comparison
 * @param {string} hash1 - First hash
 * @param {string} hash2 - Second hash
 * @returns {number} Similarity score (0-1)
 */
export function calculateHashSimilarity(hash1, hash2) {
  // Convert hashes to binary
  const bits1 = hexToBits(hash1);
  const bits2 = hexToBits(hash2);
  
  // Count matching bits
  let matchingBits = 0;
  const length = Math.min(bits1.length, bits2.length);
  
  for (let i = 0; i < length; i++) {
    if (bits1[i] === bits2[i]) {
      matchingBits++;
    }
  }
  
  // Calculate similarity as proportion of matching bits
  return matchingBits / length;
}

/**
 * Convert a hex string to a binary array
 * @param {string} hexString - Hex string
 * @returns {Array} Array of bits (0 or 1)
 */
export function hexToBits(hexString) {
  const bits = [];
  
  for (let i = 0; i < hexString.length; i++) {
    const hex = parseInt(hexString[i], 16);
    
    // Convert hex digit to 4 bits
    bits.push((hex & 8) >> 3);
    bits.push((hex & 4) >> 2);
    bits.push((hex & 2) >> 1);
    bits.push(hex & 1);
  }
  
  return bits;
}

/**
 * Calculate similarity between two biometric templates
 * @param {Object|Array|string} template1 - First template
 * @param {Object|Array|string} template2 - Second template
 * @returns {number} Similarity score (0-1)
 */
export function calculateTemplateSimilarity(template1, template2) {
  // Handle different template types
  
  // If both are arrays (vectors), use cosine similarity
  if (Array.isArray(template1) && Array.isArray(template2)) {
    return calculateCosineSimilarity(template1, template2);
  }
  
  // If both are strings (hashes), use hash similarity
  if (typeof template1 === 'string' && typeof template2 === 'string') {
    return calculateHashSimilarity(template1, template2);
  }
  
  // If both are objects, handle based on their structure
  if (typeof template1 === 'object' && typeof template2 === 'object') {
    // Check for feature vectors
    if (template1.features && template2.features && 
        Array.isArray(template1.features) && Array.isArray(template2.features)) {
      return calculateCosineSimilarity(template1.features, template2.features);
    }
    
    // Check for hash
    if (template1.hash && template2.hash) {
      return calculateHashSimilarity(template1.hash, template2.hash);
    }
    
    // Default object comparison - count matching keys and values
    const keys1 = Object.keys(template1);
    const keys2 = Object.keys(template2);
    
    const commonKeys = keys1.filter(key => keys2.includes(key));
    
    if (commonKeys.length === 0) {
      return 0;
    }
    
    let matchScore = 0;
    
    for (const key of commonKeys) {
      if (typeof template1[key] === 'object' && typeof template2[key] === 'object') {
        // Recursive comparison for nested objects
        matchScore += calculateTemplateSimilarity(template1[key], template2[key]);
      } else if (template1[key] === template2[key]) {
        matchScore += 1;
      }
    }
    
    return matchScore / commonKeys.length;
  }
  
  // Different types, no similarity
  return 0;
}
