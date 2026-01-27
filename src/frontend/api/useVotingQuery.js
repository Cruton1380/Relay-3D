/**
 * React Hook: useVotingQuery
 * 
 * Fetch and auto-update voting rankings from query hooks.
 * Replaces WebSocket-based vote updates with polling.
 * 
 * Usage:
 *   const { data, loading, error, refetch } = useVotingQuery({
 *     repo_id: 'coffee-shop__seattle',
 *     branch_id: 'main',
 *     channel_id: 'coffee-shop__seattle',
 *     pollInterval: 2000 // Optional: auto-refresh every 2s
 *   });
 */

import { useState, useEffect, useCallback } from 'react';
import { queryClient } from './queryClient';

export function useVotingQuery(params, options = {}) {
  const { pollInterval = 0, enabled = true } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRankings = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      const result = await queryClient.votingRankings(params);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('Voting query error:', err);
    } finally {
      setLoading(false);
    }
  }, [params, enabled]);

  useEffect(() => {
    fetchRankings();

    // Set up polling if interval specified
    if (pollInterval > 0 && enabled) {
      const timer = setInterval(fetchRankings, pollInterval);
      return () => clearInterval(timer);
    }
  }, [fetchRankings, pollInterval, enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchRankings
  };
}

export default useVotingQuery;

