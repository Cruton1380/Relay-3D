/**
 * @fileoverview Mock implementation of bcrypt for testing
 * Provides a lightweight alternative to bcrypt for development and testing
 */

/**
 * Mock bcrypt hash function
 * @param {string} data - Data to hash
 * @param {number} saltRounds - Salt rounds (ignored in mock)
 * @returns {Promise<string>} Mock hash
 */
export async function hash(data, saltRounds = 10) {
  // Simple mock hash - not cryptographically secure
  const mockHash = `$2b$${saltRounds}$` + Buffer.from(data).toString('base64').slice(0, 50);
  return mockHash;
}

/**
 * Mock bcrypt compare function
 * @param {string} data - Plain text data
 * @param {string} encrypted - Hashed data
 * @returns {Promise<boolean>} Mock comparison result
 */
export async function compare(data, encrypted) {
  // For testing, we'll generate the same mock hash and compare
  const expectedHash = await hash(data, 10);
  return encrypted === expectedHash || encrypted === data; // Allow both for flexibility
}

/**
 * Mock genSalt function
 * @param {number} rounds - Salt rounds
 * @returns {Promise<string>} Mock salt
 */
export async function genSalt(rounds = 10) {
  return `$2b$${rounds}$mockSalt123456789012345`;
}

/**
 * Mock hashSync function
 * @param {string} data - Data to hash
 * @param {number|string} saltOrRounds - Salt or rounds
 * @returns {string} Mock hash
 */
export function hashSync(data, saltOrRounds = 10) {
  const rounds = typeof saltOrRounds === 'number' ? saltOrRounds : 10;
  return `$2b$${rounds}$` + Buffer.from(data).toString('base64').slice(0, 50);
}

/**
 * Mock compareSync function
 * @param {string} data - Plain text data
 * @param {string} encrypted - Hashed data
 * @returns {boolean} Mock comparison result
 */
export function compareSync(data, encrypted) {
  const expectedHash = hashSync(data, 10);
  return encrypted === expectedHash || encrypted === data;
}

/**
 * Mock genSaltSync function
 * @param {number} rounds - Salt rounds
 * @returns {string} Mock salt
 */
export function genSaltSync(rounds = 10) {
  return `$2b$${rounds}$mockSalt123456789012345`;
}

// Default export for CommonJS compatibility
export default {
  hash,
  compare,
  genSalt,
  hashSync,
  compareSync,
  genSaltSync
};
