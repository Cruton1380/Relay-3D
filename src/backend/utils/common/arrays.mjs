// filepath: backend/utils/common/arrays.mjs
/**
 * Array manipulation utilities
 */

/**
 * Chunks an array into groups of specified size
 * @param {Array} array - Array to chunk
 * @param {number} size - Size of each chunk
 * @returns {Array<Array>} Array of chunks
 */
export function chunk(array, size) {
  if (!array || !Array.isArray(array)) return [];
  if (size <= 0) return [array];
  
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Groups array items by a key or key function
 * @param {Array} array - Array to group
 * @param {string|Function} keyOrFn - Property name or function to get grouping key
 * @returns {Object} Object with groups
 */
export function groupBy(array, keyOrFn) {
  if (!array || !Array.isArray(array)) return {};
  
  return array.reduce((result, item) => {
    const key = typeof keyOrFn === 'function' 
      ? keyOrFn(item) 
      : item[keyOrFn];
    
    (result[key] = result[key] || []).push(item);
    return result;
  }, {});
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array (same reference)
 */
export function shuffle(array) {
  if (!array || !Array.isArray(array)) return array;
  
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  return array;
}

/**
 * Creates an array of unique values
 * @param {Array} array - Input array
 * @param {Function} [keyFn] - Optional function to derive comparison key
 * @returns {Array} Array with unique values
 */
export function unique(array, keyFn) {
  if (!array || !Array.isArray(array)) return [];
  
  if (!keyFn) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
