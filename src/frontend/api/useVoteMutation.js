/**
 * React Hook: useVoteMutation
 * 
 * Submit votes with optimistic updates and automatic refetching.
 * 
 * Usage:
 *   const { mutate, loading, error } = useVoteMutation({
 *     onSuccess: (data) => console.log('Vote submitted!', data),
 *     onError: (err) => console.error('Vote failed:', err)
 *   });
 * 
 *   mutate({
 *     publicKey: 'user_alice',
 *     topic: 'coffee-shop__seattle',
 *     choice: 'candidate-xyz',
 *     repo_id: 'coffee-shop__seattle',
 *     branch_id: 'main'
 *   });
 */

import { useState, useCallback } from 'react';
import { queryClient } from './queryClient';

export function useVoteMutation(options = {}) {
  const { onSuccess, onError } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (voteData) => {
    try {
      setLoading(true);
      setError(null);

      const result = await queryClient.submitVote(voteData);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  return {
    mutate,
    loading,
    error
  };
}

export default useVoteMutation;

