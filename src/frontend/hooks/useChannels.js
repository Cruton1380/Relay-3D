/**
 * @fileoverview React Hooks for Channel Management
 * Provides React hooks for channel discovery, communication, and management
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import ChannelService from '../services/channelService.js';

// Global channel service instance
let channelServiceInstance = null;

/**
 * Hook for managing channel service connection
 */
export function useChannelService(userId, token) {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const serviceRef = useRef(null);

  useEffect(() => {
    if (!userId || !token) return;

    const initializeService = async () => {
      try {
        if (!channelServiceInstance) {
          channelServiceInstance = new ChannelService();
        }
        
        serviceRef.current = channelServiceInstance;
        
        // Set up event listeners
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);
        const handleAuth = (data) => setIsAuthenticated(data.success);
        const handleError = (error) => setError(error.message);
        const handleConnectionFailed = () => setError('Failed to connect to channel service');

        serviceRef.current.on('connected', handleConnect);
        serviceRef.current.on('disconnected', handleDisconnect);
        serviceRef.current.on('authenticated', handleAuth);
        serviceRef.current.on('error', handleError);
        serviceRef.current.on('connection_failed', handleConnectionFailed);

        // Initialize connection
        const success = await serviceRef.current.initialize(userId, token);
        if (!success) {
          setError('Failed to initialize channel service');
        }

        return () => {
          serviceRef.current?.off('connected', handleConnect);
          serviceRef.current?.off('disconnected', handleDisconnect);
          serviceRef.current?.off('authenticated', handleAuth);
          serviceRef.current?.off('error', handleError);
          serviceRef.current?.off('connection_failed', handleConnectionFailed);
        };
      } catch (err) {
        setError(err.message);
      }
    };

    initializeService();

    return () => {
      // Don't disconnect here - service is shared across components
    };
  }, [userId, token]);

  return {
    channelService: serviceRef.current,
    isConnected,
    isAuthenticated,
    error
  };
}

/**
 * Hook for managing user's channels
 */
export function useChannels(userId, token) {
  const { channelService, isAuthenticated } = useChannelService(userId, token);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!channelService || !isAuthenticated) return;

    const updateChannels = (channels) => {
      setChannels(channels);
      setLoading(false);
    };

    const handleChannelCreated = (channel) => {
      setChannels(prev => [...prev, channel]);
    };

    const handleChannelJoined = (channel) => {
      setChannels(prev => {
        const exists = prev.find(c => c.id === channel.id);
        return exists ? prev : [...prev, channel];
      });
    };

    const handleChannelLeft = ({ channelId }) => {
      setChannels(prev => prev.filter(c => c.id !== channelId));
    };

    const handleError = (error) => {
      setError(error.message);
      setLoading(false);
    };

    // Set up event listeners
    channelService.on('channels_updated', updateChannels);
    channelService.on('channel_created', handleChannelCreated);
    channelService.on('channel_joined', handleChannelJoined);
    channelService.on('channel_left', handleChannelLeft);
    channelService.on('error', handleError);

    // Get initial channels
    const initialChannels = channelService.getUserChannels();
    if (initialChannels.length > 0) {
      setChannels(initialChannels);
      setLoading(false);
    }

    return () => {
      channelService.off('channels_updated', updateChannels);
      channelService.off('channel_created', handleChannelCreated);
      channelService.off('channel_joined', handleChannelJoined);
      channelService.off('channel_left', handleChannelLeft);
      channelService.off('error', handleError);
    };
  }, [channelService, isAuthenticated]);

  const createChannel = useCallback(async (channelData) => {
    if (!channelService) throw new Error('Channel service not available');
    return await channelService.createChannel(channelData);
  }, [channelService]);

  const joinChannel = useCallback(async (channelId) => {
    if (!channelService) throw new Error('Channel service not available');
    return await channelService.joinChannel(channelId);
  }, [channelService]);

  const leaveChannel = useCallback(async (channelId) => {
    if (!channelService) throw new Error('Channel service not available');
    return await channelService.leaveChannel(channelId);
  }, [channelService]);

  return {
    channels,
    loading,
    error,
    createChannel,
    joinChannel,
    leaveChannel
  };
}

/**
 * Hook for discovering channels
 */
export function useChannelDiscovery(userId, token) {
  const { channelService, isAuthenticated } = useChannelService(userId, token);
  const [discoveredChannels, setDiscoveredChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const discoverChannels = useCallback(async (criteria = {}) => {
    if (!channelService) {
      setError('Channel service not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const channels = await channelService.discoverChannels(criteria);
      setDiscoveredChannels(channels);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [channelService]);

  const discoverProximityChannels = useCallback(async (location, radius = 1000) => {
    const criteria = {
      type: 'proximity',
      location: `${location.lat},${location.lon}`,
      radius
    };
    return await discoverChannels(criteria);
  }, [discoverChannels]);

  const discoverRegionalChannels = useCallback(async (location, radius = 10000) => {
    const criteria = {
      type: 'regional',
      location: `${location.lat},${location.lon}`,
      radius
    };
    return await discoverChannels(criteria);
  }, [discoverChannels]);

  const discoverGlobalChannels = useCallback(async (tags = []) => {
    const criteria = {
      type: 'global',
      tags
    };
    return await discoverChannels(criteria);
  }, [discoverChannels]);

  return {
    discoveredChannels,
    loading,
    error,
    discoverChannels,
    discoverProximityChannels,
    discoverRegionalChannels,
    discoverGlobalChannels
  };
}

/**
 * Hook for channel messaging with reactions and threading support
 */
export function useChannelMessages(channelId, userId, token) {
  const { channelService, isAuthenticated } = useChannelService(userId, token);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showThreads, setShowThreads] = useState(new Map());

  useEffect(() => {
    if (!channelService || !isAuthenticated || !channelId) return;

    const handleChannelMessage = (message) => {
      if (message.channelId === channelId) {
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.find(m => m.id === message.id);
          return exists ? prev : [...prev, message];
        });
      }
    };

    const handleMessageReaction = (data) => {
      if (data.channelId === channelId) {
        setMessages(prev => prev.map(msg => {
          if (msg.id === data.messageId) {
            const reactions = new Map(msg.reactions || []);
            if (data.action === 'add') {
              if (!reactions.has(data.emoji)) {
                reactions.set(data.emoji, new Set());
              }
              reactions.get(data.emoji).add(data.userId);
            } else if (data.action === 'remove') {
              if (reactions.has(data.emoji)) {
                reactions.get(data.emoji).delete(data.userId);
                if (reactions.get(data.emoji).size === 0) {
                  reactions.delete(data.emoji);
                }
              }
            }
            return { ...msg, reactions };
          }
          return msg;
        }));
      }
    };

    const handleMessageReply = (reply) => {
      if (reply.channelId === channelId) {
        // Update parent message reply count
        setMessages(prev => prev.map(msg => {
          if (msg.id === reply.replyToId) {
            return { ...msg, replyCount: (msg.replyCount || 0) + 1 };
          }
          return msg;
        }));

        // Add reply to messages if thread is expanded
        if (showThreads.has(reply.replyToId)) {
          setMessages(prev => [...prev, reply]);
        }
      }
    };

    const handleTypingIndicator = (data) => {
      if (data.channelId === channelId && data.userId !== userId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });

        // Clear typing indicator after timeout
        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }, 3000);
        }
      }
    };

    // Set up event listeners
    channelService.on('channel_message', handleChannelMessage);
    channelService.on('message_reaction', handleMessageReaction);
    channelService.on('message_reply', handleMessageReply);
    channelService.on('typing_indicator', handleTypingIndicator);

    // Load initial messages
    const loadMessages = async () => {
      try {
        setLoading(true);
        const channelMessages = await channelService.getChannelMessages(channelId);
        setMessages(channelMessages);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    return () => {
      channelService.off('channel_message', handleChannelMessage);
      channelService.off('message_reaction', handleMessageReaction);
      channelService.off('message_reply', handleMessageReply);
      channelService.off('typing_indicator', handleTypingIndicator);
    };
  }, [channelService, isAuthenticated, channelId, userId, showThreads]);

  const sendMessage = useCallback(async (message, messageType = 'text') => {
    if (!channelService) throw new Error('Channel service not available');
    
    if (replyingTo) {
      // Send as reply
      const reply = await channelService.replyToMessage(channelId, replyingTo.id, message, messageType);
      setReplyingTo(null);
      return reply;
    } else {
      // Send as regular message
      return await channelService.sendChannelMessage(channelId, message, messageType);
    }
  }, [channelService, channelId, replyingTo]);

  const addReaction = useCallback(async (messageId, emoji) => {
    if (!channelService) return;
    
    try {
      // Check if user already reacted with this emoji
      const message = messages.find(m => m.id === messageId);
      if (message && message.reactions && message.reactions.has(emoji) && message.reactions.get(emoji).has(userId)) {
        // Remove reaction
        await channelService.removeReaction(channelId, messageId, emoji);
      } else {
        // Add reaction
        await channelService.addReaction(channelId, messageId, emoji);
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  }, [channelService, channelId, messages, userId]);

  const replyToMessage = useCallback((message) => {
    setReplyingTo(message);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const toggleThread = useCallback(async (messageId) => {
    if (showThreads.has(messageId)) {
      // Hide thread
      setShowThreads(prev => {
        const newMap = new Map(prev);
        newMap.delete(messageId);
        return newMap;
      });
      // Remove thread messages from view
      setMessages(prev => prev.filter(msg => msg.replyToId !== messageId));
    } else {
      // Show thread
      try {
        const replies = await channelService.getMessageReplies(channelId, messageId);
        setShowThreads(prev => {
          const newMap = new Map(prev);
          newMap.set(messageId, true);
          return newMap;
        });
        // Add thread messages to view
        setMessages(prev => [...prev, ...replies]);
      } catch (error) {
        console.error('Failed to load thread:', error);
      }
    }
  }, [channelService, channelId, showThreads]);

  const searchMessages = useCallback(async (query) => {
    if (!channelService) return;
    
    try {
      setSearchQuery(query);
      if (query.trim()) {
        const results = await channelService.searchMessages(channelId, query);
        setSearchResults(results.messages);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to search messages:', error);
      setSearchResults([]);
    }
  }, [channelService, channelId]);

  const sendTypingIndicator = useCallback((isTyping) => {
    if (!channelService) return;
    channelService.sendTypingIndicator(channelId, isTyping);
  }, [channelService, channelId]);

  const loadMoreMessages = useCallback(async (before) => {
    if (!channelService) return;
    
    try {
      const olderMessages = await channelService.getChannelMessages(channelId, { before });
      setMessages(prev => [...olderMessages, ...prev]);
      return olderMessages.length;
    } catch (err) {
      setError(err.message);
      return 0;
    }
  }, [channelService, channelId]);

  return {
    messages,
    loading,
    error,
    typingUsers: Array.from(typingUsers),
    replyingTo,
    searchQuery,
    searchResults,
    showThreads,
    sendMessage,
    addReaction,
    replyToMessage,
    cancelReply,
    toggleThread,
    searchMessages,
    sendTypingIndicator,
    loadMoreMessages
  };
}

/**
 * Hook for channel members
 */
export function useChannelMembers(channelId, userId, token) {
  const { channelService, isAuthenticated } = useChannelService(userId, token);
  const [members, setMembers] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!channelService || !isAuthenticated || !channelId) return;

    const handleMemberJoined = (data) => {
      if (data.channelId === channelId) {
        setMembers(prev => {
          const exists = prev.find(m => m.userId === data.userId);
          return exists ? prev : [...prev, { userId: data.userId }];
        });
      }
    };

    const handleMemberLeft = (data) => {
      if (data.channelId === channelId) {
        setMembers(prev => prev.filter(m => m.userId !== data.userId));
        setOnlineMembers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    const handlePresenceUpdate = (data) => {
      const isMember = members.find(m => m.userId === data.userId);
      if (isMember) {
        setOnlineMembers(prev => {
          const newSet = new Set(prev);
          if (data.status === 'online') {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    };

    // Set up event listeners
    channelService.on('member_joined', handleMemberJoined);
    channelService.on('member_left', handleMemberLeft);
    channelService.on('presence_update', handlePresenceUpdate);

    // Load initial members
    const loadMembers = async () => {
      try {
        setLoading(true);
        const channelMembers = await channelService.getChannelMembers(channelId);
        setMembers(channelMembers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();

    return () => {
      channelService.off('member_joined', handleMemberJoined);
      channelService.off('member_left', handleMemberLeft);
      channelService.off('presence_update', handlePresenceUpdate);
    };
  }, [channelService, isAuthenticated, channelId, members]);

  return {
    members,
    onlineMembers: Array.from(onlineMembers),
    loading,
    error
  };
}

/**
 * Hook for channel feed (wall posts)
 */
export function useChannelFeed(channelId, userId, token) {
  const { channelService, isAuthenticated } = useChannelService(userId, token);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!channelService || !isAuthenticated || !channelId) return;

    const handleFeedPostCreated = (post) => {
      if (post.channelId === channelId) {
        setPosts(prev => [post, ...prev]);
      }
    };

    // Set up event listeners
    channelService.on('feed_post_created', handleFeedPostCreated);

    // Load initial feed
    const loadFeed = async () => {
      try {
        setLoading(true);
        const feedPosts = await channelService.getChannelFeed(channelId);
        setPosts(feedPosts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFeed();

    return () => {
      channelService.off('feed_post_created', handleFeedPostCreated);
    };
  }, [channelService, isAuthenticated, channelId]);

  const createPost = useCallback(async (postData) => {
    if (!channelService) throw new Error('Channel service not available');
    return await channelService.createFeedPost(channelId, postData);
  }, [channelService, channelId]);

  const loadMorePosts = useCallback(async (offset) => {
    if (!channelService) return;
    
    try {
      const morePosts = await channelService.getChannelFeed(channelId, { offset });
      setPosts(prev => [...prev, ...morePosts]);
      return morePosts.length;
    } catch (err) {
      setError(err.message);
      return 0;
    }
  }, [channelService, channelId]);

  return {
    posts,
    loading,
    error,
    createPost,
    loadMorePosts
  };
}

/**
 * Hook for channel management utilities
 */
export function useChannelUtils(userId, token) {
  const { channelService, isAuthenticated } = useChannelService(userId, token);

  const getChannelDetails = useCallback(async (channelId) => {
    if (!channelService) throw new Error('Channel service not available');
    return await channelService.getChannel(channelId);
  }, [channelService]);

  const updatePresence = useCallback((status) => {
    if (!channelService) return;
    channelService.updatePresence(status);
  }, [channelService]);

  const isMemberOf = useCallback((channelId) => {
    if (!channelService) return false;
    return channelService.isMemberOf(channelId);
  }, [channelService]);

  const getServiceStatus = useCallback(() => {
    if (!channelService) return { connected: false, authenticated: false };
    return channelService.getStatus();
  }, [channelService]);

  return {
    getChannelDetails,
    updatePresence,
    isMemberOf,
    getServiceStatus,
    isAuthenticated
  };
}

/**
 * Hook for encounter history management
 */
export function useEncounterHistory(userId, token) {
  const { channelService, isAuthenticated } = useChannelService(userId, token);
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getEncounterHistory = useCallback(async (options = {}) => {
    if (!channelService) throw new Error('Channel service not available');
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await channelService.getEncounterHistory(options);
      setEncounters(result.encounters || []);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [channelService]);

  const searchEncountersByLocation = useCallback(async (location, radius = 1000, options = {}) => {
    if (!channelService) throw new Error('Channel service not available');
    return await channelService.searchEncountersByLocation(location, radius, options);
  }, [channelService]);

  const getReadOnlyAccess = useCallback(async (channelId) => {
    if (!channelService) throw new Error('Channel service not available');
    return await channelService.getReadOnlyChannelAccess(channelId);
  }, [channelService]);

  const getChannelStats = useCallback(async (channelId) => {
    if (!channelService) throw new Error('Channel service not available');
    return await channelService.getChannelEncounterStats(channelId);
  }, [channelService]);

  // Load initial encounter history
  useEffect(() => {
    if (!channelService || !isAuthenticated) return;

    getEncounterHistory().catch(console.error);
  }, [channelService, isAuthenticated, getEncounterHistory]);

  return {
    encounters,
    loading,
    error,
    getEncounterHistory,
    searchEncountersByLocation,
    getReadOnlyAccess,
    getChannelStats
  };
}

/**
 * Hook for read-only channel access
 */
export function useReadOnlyChannel(channelId, userId, token) {
  const { channelService, isAuthenticated } = useChannelService(userId, token);
  const [channelData, setChannelData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userEncounters, setUserEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!channelService || !isAuthenticated || !channelId) return;

    const loadReadOnlyChannel = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get read-only access
        const accessData = await channelService.getReadOnlyChannelAccess(channelId);
        
        if (accessData.success) {
          setChannelData(accessData.channel);
          setUserEncounters(accessData.userEncounters || []);
          setHasAccess(true);

          // Load historical messages (read-only)
          try {
            const channelMessages = await channelService.getChannelMessages(channelId, { limit: 100 });
            setMessages(channelMessages);
          } catch (msgError) {
            console.warn('Could not load historical messages:', msgError);
            setMessages([]);
          }
        }
      } catch (err) {
        setError(err.message);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    loadReadOnlyChannel();
  }, [channelService, isAuthenticated, channelId]);

  return {
    channelData,
    messages,
    userEncounters,
    loading,
    error,
    hasAccess,
    permissions: {
      canRead: hasAccess,
      canWrite: false,
      canReact: false,
      canReply: false,
      canJoin: false
    }
  };
}
