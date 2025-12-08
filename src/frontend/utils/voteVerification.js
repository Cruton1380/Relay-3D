import { verifySignature } from './cryptography';

/**
 * Verifies if a user is eligible to vote on a topic
 * Checks against backend rules, hashgraph state, and blockchain state
 * @param {string} topic - Topic ID
 * @param {string} userId - User ID
 * @returns {Promise<{eligible: boolean, reason?: string}>}
 */
export const verifyVoteEligibility = async (topic, userId) => {
  try {
    const response = await fetch(`/api/votes/verify-eligibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic,
        userId
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        eligible: false,
        reason: data.error || 'Failed to verify eligibility'
      };
    }

    return {
      eligible: data.eligible,
      reason: data.reason
    };
  } catch (error) {
    console.error('Vote eligibility verification failed:', error);
    return {
      eligible: false,
      reason: 'Failed to verify eligibility'
    };
  }
};

/**
 * Verifies a vote hasn't been replayed
 * @param {string} topic - Topic ID
 * @param {string} userId - User ID
 * @param {string} nonce - Vote nonce
 * @returns {Promise<boolean>}
 */
export const verifyVoteNonce = async (topic, userId, nonce) => {
  try {
    const response = await fetch(`/api/votes/verify-nonce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic,
        userId,
        nonce
      })
    });

    const data = await response.json();
    return data.valid;
  } catch (error) {
    console.error('Nonce verification failed:', error);
    return false;
  }
}; 