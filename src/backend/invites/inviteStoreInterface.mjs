//backend/invites/inviteStoreInterface.mjs
/**
 * Interface defining the contract for invite store implementations
 * This follows the interface segregation principle - only defining
 * the methods that invite store implementations must provide
 */
export class InviteStoreInterface {
  /**
   * Retrieves an invite by its code
   * @param {string} inviteCode - The invite code to look up
   * @returns {Promise<Object|null>} The invite object or null if not found
   */
  async getInvite(inviteCode) {
    throw new Error("Method not implemented");
  }

  /**
   * Marks an invite as used
   * @param {string} inviteCode - The invite code to mark as used
   * @returns {Promise<Object>} Result object with success flag and message
   */
  async burnInviteCode(inviteCode) {
    throw new Error("Method not implemented");
  }

  /**
   * Resets invites for testing purposes
   * @returns {Promise<Object>} Result object with success flag and message
   */
  async resetInvitesForTest() {
    throw new Error("Method not implemented");
  }
}
