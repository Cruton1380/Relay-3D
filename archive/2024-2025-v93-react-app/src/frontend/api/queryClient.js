/**
 * Relay Query Client
 * 
 * Central API wrapper for all backend query hook calls.
 * Replaces direct fetch() calls and WebSocket subscriptions.
 * 
 * Usage:
 *   import { queryClient } from '@/api/queryClient';
 *   const rankings = await queryClient.votingRankings({ repo_id, branch_id });
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';

class QueryClient {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic query hook caller
   */
  async query(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}/relay/query${endpoint}${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Query error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Query: /voting_rankings
   * Returns derived vote counts and rankings for candidates.
   */
  async votingRankings(params) {
    return this.query('/voting_rankings', params);
  }

  /**
   * Query: /envelopes
   * Returns raw commit envelopes (low-level audit trail).
   */
  async envelopes(params) {
    return this.query('/envelopes', params);
  }

  /**
   * Query: /sheet_tip
   * Returns current sheet projection at branch tip.
   */
  async sheetTip(params) {
    return this.query('/sheet_tip', params);
  }

  /**
   * Query: /current_step
   * Returns current step counter for a scope.
   */
  async currentStep(params) {
    return this.query('/current_step', params);
  }

  /**
   * Mutation: Submit vote
   */
  async submitVote(voteData) {
    const url = `${this.baseUrl}/api/vote`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(voteData)
      });

      if (!response.ok) {
        throw new Error(`Vote submission failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Vote submission error:', error);
      throw error;
    }
  }

  /**
   * Polling helper: Poll a query endpoint until step changes
   */
  poll(endpoint, params, callback, interval = 1000) {
    let lastStep = null;
    let pollTimer = null;

    const pollFn = async () => {
      try {
        const result = await this.query(endpoint, params);
        const currentStep = result.scope_step || result.current_step;

        if (currentStep !== lastStep) {
          lastStep = currentStep;
          callback(null, result);
        }
      } catch (error) {
        callback(error, null);
      }
    };

    pollFn(); // Initial call
    pollTimer = setInterval(pollFn, interval);

    return {
      stop: () => {
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }
    };
  }
}

// Singleton instance
export const queryClient = new QueryClient();
export default queryClient;

