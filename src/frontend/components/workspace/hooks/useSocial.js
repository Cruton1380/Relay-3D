/**
 * @fileoverview Social Hooks
 * React hooks for social functionality including friends, requests, and blocking
 */
import { useState, useEffect, useCallback } from 'react';
import { SocialService } from '../services/socialService.js';

// Singleton social service instance
let socialServiceInstance = null;

/**
 * Get or create social service instance
 */
export const useSocialService = () => {
  if (!socialServiceInstance) {
    socialServiceInstance = new SocialService();
  }
  return socialServiceInstance;
};

/**
 * Main social hook - manages connection and authentication
 */
export const useSocial = (userId, token) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socialService = useSocialService();

  useEffect(() => {
    if (!userId || !token) return;

    const handleConnected = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    const handleError = (error) => {
      setError(error.message || 'Connection error');
    };

    // Set up event listeners
    socialService.on('connected', handleConnected);
    socialService.on('disconnected', handleDisconnected);
    socialService.on('error', handleError);

    // Connect to service
    socialService.connect(userId, token);

    return () => {
      socialService.off('connected', handleConnected);
      socialService.off('disconnected', handleDisconnected);
      socialService.off('error', handleError);
    };
  }, [userId, token, socialService]);

  return {
    isConnected,
    error,
    socialService
  };
};

/**
 * Friends management hook
 */
export const useFriends = (userId, token) => {
  const [friends, setFriends] = useState([]);
  const [friendPresence, setFriendPresence] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const socialService = useSocialService();

  const loadFriends = useCallback(async () => {
    if (!userId || !token) return;

    try {
      setLoading(true);
      const result = await socialService.getFriends(true);
      setFriends(result.friends || []);
      
      // Update presence
      const presenceMap = new Map();
      result.friends.forEach(friend => {
        if (friend.presence) {
          presenceMap.set(friend.userId, friend.presence);
        }
      });
      setFriendPresence(presenceMap);
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, token, socialService]);

  const removeFriend = useCallback(async (friendId) => {
    try {
      await socialService.removeFriend(friendId);
      setFriends(prev => prev.filter(f => f.userId !== friendId));
      setFriendPresence(prev => {
        const newMap = new Map(prev);
        newMap.delete(friendId);
        return newMap;
      });
    } catch (error) {
      console.error('Failed to remove friend:', error);
      throw error;
    }
  }, [socialService]);

  useEffect(() => {
    loadFriends();

    const handleFriendAdded = (data) => {
      loadFriends(); // Reload to get updated list
    };

    const handleFriendRemoved = (data) => {
      setFriends(prev => prev.filter(f => f.userId !== data.friendId));
      setFriendPresence(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.friendId);
        return newMap;
      });
    };

    const handlePresenceChanged = (data) => {
      setFriendPresence(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userId, { status: data.status, lastSeen: data.lastSeen });
        return newMap;
      });
    };

    socialService.on('friendship_established', handleFriendAdded);
    socialService.on('friendship_removed', handleFriendRemoved);
    socialService.on('friend_presence_changed', handlePresenceChanged);

    return () => {
      socialService.off('friendship_established', handleFriendAdded);
      socialService.off('friendship_removed', handleFriendRemoved);
      socialService.off('friend_presence_changed', handlePresenceChanged);
    };
  }, [loadFriends, socialService]);

  return {
    friends,
    friendPresence,
    removeFriend,
    loading,
    reload: loadFriends
  };
};

/**
 * Friend requests management hook
 */
export const useFriendRequests = (userId, token) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const socialService = useSocialService();

  const loadRequests = useCallback(async () => {
    if (!userId || !token) return;

    try {
      setLoading(true);
      
      // Load received requests
      const receivedResult = await socialService.getFriendRequests('received');
      setPendingRequests(receivedResult.requests || []);
      
      // Load sent requests
      const sentResult = await socialService.getFriendRequests('sent');
      setSentRequests(sentResult.requests || []);
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, token, socialService]);

  const acceptFriendRequest = useCallback(async (requestId) => {
    try {
      await socialService.acceptFriendRequest(requestId);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      throw error;
    }
  }, [socialService]);

  const declineFriendRequest = useCallback(async (requestId) => {
    try {
      await socialService.declineFriendRequest(requestId);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      throw error;
    }
  }, [socialService]);

  useEffect(() => {
    loadRequests();

    const handleRequestReceived = (data) => {
      setPendingRequests(prev => [data.request, ...prev]);
    };

    const handleRequestAccepted = (data) => {
      setSentRequests(prev => prev.filter(r => r.id !== data.request.id));
    };

    const handleRequestDeclined = (data) => {
      setSentRequests(prev => prev.filter(r => r.id !== data.request.id));
    };

    socialService.on('friend_request_received', handleRequestReceived);
    socialService.on('friend_request_accepted', handleRequestAccepted);
    socialService.on('friend_request_declined', handleRequestDeclined);

    return () => {
      socialService.off('friend_request_received', handleRequestReceived);
      socialService.off('friend_request_accepted', handleRequestAccepted);
      socialService.off('friend_request_declined', handleRequestDeclined);
    };
  }, [loadRequests, socialService]);

  return {
    pendingRequests,
    sentRequests,
    acceptFriendRequest,
    declineFriendRequest,
    loading,
    reload: loadRequests
  };
};

/**
 * Blocked users management hook
 */
export const useBlockedUsers = (userId, token) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const socialService = useSocialService();

  const loadBlockedUsers = useCallback(async () => {
    if (!userId || !token) return;

    try {
      setLoading(true);
      const result = await socialService.getBlockedUsers();
      setBlockedUsers(result.users || []);
    } catch (error) {
      console.error('Failed to load blocked users:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, token, socialService]);

  const blockUser = useCallback(async (targetId) => {
    try {
      await socialService.blockUser(targetId);
      // Reload to get updated list
      loadBlockedUsers();
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }, [socialService, loadBlockedUsers]);

  const unblockUser = useCallback(async (targetId) => {
    try {
      await socialService.unblockUser(targetId);
      setBlockedUsers(prev => prev.filter(u => u.userId !== targetId));
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  }, [socialService]);

  useEffect(() => {
    loadBlockedUsers();

    const handleUserBlocked = (data) => {
      loadBlockedUsers(); // Reload to get updated list
    };

    const handleUserUnblocked = (data) => {
      setBlockedUsers(prev => prev.filter(u => u.userId !== data.targetId));
    };

    socialService.on('user_blocked', handleUserBlocked);
    socialService.on('user_unblocked', handleUserUnblocked);

    return () => {
      socialService.off('user_blocked', handleUserBlocked);
      socialService.off('user_unblocked', handleUserUnblocked);
    };
  }, [loadBlockedUsers, socialService]);

  return {
    blockedUsers,
    blockUser,
    unblockUser,
    loading,
    reload: loadBlockedUsers
  };
};
