/**
 * String utility functions
 */

/**
 * Normalizes a string by trimming and converting to lowercase
 * @param {string} str - Input string
 * @returns {string} Normalized string
 */
export function normalizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().toLowerCase();
}

/**
 * Stringifies an object with stable key ordering for consistent hashing
 * @param {Object} obj - The object to stringify
 * @returns {string} A JSON string with deterministic key order
 */
export function stableStringify(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  
  // If it's an array, stringify each element with stable ordering
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => stableStringify(item)).join(',') + ']';
  }
  
  // For objects, sort the keys and build a new ordered object
  const sortedKeys = Object.keys(obj).sort();
  let result = '{';
  
  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    const value = obj[key];
    result += JSON.stringify(key) + ':' + stableStringify(value);
    if (i < sortedKeys.length - 1) {
      result += ',';
    }
  }
  
  result += '}';
  return result;
}

/**
 * Truncates a string to a specific length
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} The truncated string
 */
export function truncateString(str, maxLength = 100) {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Sanitizes a string for safe display
 * @param {string} str - The string to sanitize
 * @returns {string} The sanitized string
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return c;
    }
  });
}

/**
 * Creates a slug from a string
 * @param {string} str - The string to slugify
 * @returns {string} The slugified string
 */
export function slugify(str) {
  if (typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
