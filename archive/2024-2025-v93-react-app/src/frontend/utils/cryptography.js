import { ethers } from 'ethers';

/**
 * Signs a message using the provided private key
 * @param {string} message - Message to sign
 * @param {string} privateKey - User's private key
 * @returns {Promise<string>} Signature
 */
export const signMessage = async (message, privateKey) => {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const messageHash = ethers.utils.hashMessage(message);
    const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));
    return signature;
  } catch (error) {
    console.error('Signing error:', error);
    throw new Error('Failed to sign message');
  }
};

/**
 * Verifies a signature
 * @param {string} message - Original message
 * @param {string} signature - Signature to verify
 * @param {string} expectedAddress - Expected signer address
 * @returns {boolean} Whether signature is valid
 */
export const verifySignature = (message, signature, expectedAddress) => {
  try {
    const messageHash = ethers.utils.hashMessage(message);
    const recoveredAddress = ethers.utils.recoverAddress(messageHash, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}; 