/**
 * Shared biometric utility functions for similarity calculations (frontend)
 */

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vec1 - First vector
 * @param {Array} vec2 - Second vector
 * @returns {number} Similarity score (0-1)
 */
export function calculateCosineSimilarity(vec1, vec2) {
  // Ensure vectors are of the same length
  if (vec1.length !== vec2.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }
  
  return dotProduct / (mag1 * mag2);
}

/**
 * Convert hex string to bit array
 * @param {string} hexString - Hex string
 * @returns {Array} Bit array
 */
export function hexToBits(hexString) {
  let bits = [];
  for (let i = 0; i < hexString.length; i++) {
    const hexDigit = parseInt(hexString[i], 16);
    bits = bits.concat([
      (hexDigit & 8) >> 3,
      (hexDigit & 4) >> 2,
      (hexDigit & 2) >> 1,
      hexDigit & 1
    ]);
  }
  return bits;
}

/**
 * Calculate hash similarity using bit comparison
 * @param {string} hash1 - First hash
 * @param {string} hash2 - Second hash
 * @returns {number} Similarity score (0-1)
 */
export function calculateHashSimilarity(hash1, hash2) {
  const bits1 = hexToBits(hash1);
  const bits2 = hexToBits(hash2);
  
  let matchingBits = 0;
  const length = Math.min(bits1.length, bits2.length);
  
  for (let i = 0; i < length; i++) {
    if (bits1[i] === bits2[i]) {
      matchingBits++;
    }
  }
  
  return matchingBits / length;
}

/**
 * Compare two biometric templates
 * @param {Object} template1 - First template
 * @param {Object} template2 - Second template
 * @returns {number} Similarity score (0-1)
 */
export function compareTemplates(template1, template2) {
  // Check for hash-based comparison
  if (template1.hash && template2.hash) {
    return calculateHashSimilarity(template1.hash, template2.hash);
  }
  
  // Check for vector-based comparison
  if (template1.features && template2.features && 
      Array.isArray(template1.features) && Array.isArray(template2.features)) {
    return calculateCosineSimilarity(template1.features, template2.features);
  }
  
  // If both are arrays (direct vectors)
  if (Array.isArray(template1) && Array.isArray(template2)) {
    return calculateCosineSimilarity(template1, template2);
  }
  
  // If both are strings (direct hashes)
  if (typeof template1 === 'string' && typeof template2 === 'string') {
    return calculateHashSimilarity(template1, template2);
  }
  
  // No compatible comparison method found
  return 0;
}
