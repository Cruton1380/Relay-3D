/**
 * @fileoverview Development Service
 * Handles API calls for developer proposals, bounties, and donations
 */

class DevelopmentService {
  constructor() {
    this.baseUrl = '/api/development';
  }

  /**
   * Submit a new development proposal
   */
  async submitProposal(formData) {
    const response = await fetch(`${this.baseUrl}/proposals`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit proposal');
    }

    return response.json();
  }

  /**
   * Get proposals for a specific channel
   */
  async getChannelProposals(channelId, filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);

    const response = await fetch(
      `${this.baseUrl}/proposals/channel/${channelId}?${queryParams}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch proposals');
    }

    return response.json();
  }

  /**
   * Get a specific proposal by ID
   */
  async getProposal(proposalId) {
    const response = await fetch(`${this.baseUrl}/proposals/${proposalId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch proposal');
    }

    return response.json();
  }

  /**
   * Vote on a proposal
   */
  async voteOnProposal(proposalId, vote) {
    const response = await fetch(`${this.baseUrl}/proposals/${proposalId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ vote })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to vote on proposal');
    }

    return response.json();
  }

  /**
   * Get user's votes
   */
  async getUserVotes() {
    const response = await fetch(`${this.baseUrl}/votes/user`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user votes');
    }

    return response.json();
  }

  /**
   * Owner/Founder approve proposal
   */
  async approveProposal(proposalId, reviewData = {}) {
    const response = await fetch(`${this.baseUrl}/proposals/${proposalId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to approve proposal');
    }

    return response.json();
  }

  /**
   * Owner/Founder reject proposal
   */
  async rejectProposal(proposalId, reviewData = {}) {
    const response = await fetch(`${this.baseUrl}/proposals/${proposalId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject proposal');
    }

    return response.json();
  }

  /**
   * Make a donation to a channel
   */
  async makeDonation(donationData) {
    const response = await fetch(`${this.baseUrl}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(donationData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to make donation');
    }

    return response.json();
  }

  /**
   * Get donation statistics for a channel
   */
  async getChannelDonationStats(channelId) {
    const response = await fetch(`${this.baseUrl}/donations/channel/${channelId}/stats`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch donation stats');
    }

    return response.json();
  }

  /**
   * Get recent donations for a channel
   */
  async getChannelRecentDonations(channelId, limit = 10) {
    const response = await fetch(
      `${this.baseUrl}/donations/channel/${channelId}/recent?limit=${limit}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch recent donations');
    }

    return response.json();
  }

  /**
   * Get development statistics for a channel
   */
  async getChannelDevelopmentStats(channelId) {
    const response = await fetch(`${this.baseUrl}/stats/channel/${channelId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch development stats');
    }

    return response.json();
  }

  /**
   * Get global development statistics
   */
  async getGlobalDevelopmentStats() {
    const response = await fetch(`${this.baseUrl}/stats/global`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch global stats');
    }

    return response.json();
  }

  /**
   * Download proposal attachment
   */
  getAttachmentUrl(filename) {
    return `${this.baseUrl}/proposals/attachments/${filename}`;
  }

  /**
   * Get proposal voters (for channel owners)
   */
  async getProposalVoters(proposalId) {
    const response = await fetch(`${this.baseUrl}/proposals/${proposalId}/voters`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch proposal voters');
    }

    return response.json();
  }

  /**
   * Search proposals across channels
   */
  async searchProposals(query, filters = {}) {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.channelId) queryParams.append('channelId', filters.channelId);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const response = await fetch(`${this.baseUrl}/proposals/search?${queryParams}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search proposals');
    }

    return response.json();
  }

  /**
   * Get trending proposals
   */
  async getTrendingProposals(limit = 10) {
    const response = await fetch(`${this.baseUrl}/proposals/trending?limit=${limit}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch trending proposals');
    }

    return response.json();
  }

  /**
   * Get user's proposal history
   */
  async getUserProposals(userId = null) {
    const url = userId 
      ? `${this.baseUrl}/proposals/user/${userId}`
      : `${this.baseUrl}/proposals/user`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user proposals');
    }

    return response.json();
  }

  /**
   * Get user's donation history
   */
  async getUserDonations(userId = null) {
    const url = userId 
      ? `${this.baseUrl}/donations/user/${userId}`
      : `${this.baseUrl}/donations/user`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user donations');
    }

    return response.json();
  }

  /**
   * Update proposal status (for admins)
   */
  async updateProposalStatus(proposalId, status, reason = '') {
    const response = await fetch(`${this.baseUrl}/proposals/${proposalId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, reason })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update proposal status');
    }

    return response.json();
  }

  /**
   * Set channel donation goal
   */
  async setChannelDonationGoal(channelId, goal) {
    const response = await fetch(`${this.baseUrl}/donations/channel/${channelId}/goal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ goal })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set donation goal');
    }

    return response.json();
  }
}

// Create and export singleton instance
const developmentService = new DevelopmentService();
export default developmentService;
