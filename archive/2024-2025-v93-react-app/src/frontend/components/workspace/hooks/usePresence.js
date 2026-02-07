import { useState, useEffect } from 'react';

/**
 * Stub usePresence hook for Proximity mode
 * This will eventually integrate with real presence detection and proximity services
 */
export const usePresence = () => {
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [isInProximity, setIsInProximity] = useState(false);
  const [proximityChannels, setProximityChannels] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock data for development
  useEffect(() => {
    setLoading(true);
    
    // Simulate async presence detection
    const timer = setTimeout(() => {
      setNearbyUsers([
        { id: 'user1', name: 'Alice', distance: 15, status: 'active' },
        { id: 'user2', name: 'Bob', distance: 25, status: 'idle' },
        { id: 'user3', name: 'Charlie', distance: 8, status: 'active' }
      ]);
      
      setProximityChannels([
        { id: 'prox1', name: 'Cafe Discussion', userCount: 3, distance: 12 },
        { id: 'prox2', name: 'Park Meetup', userCount: 5, distance: 18 }
      ]);
      
      setIsInProximity(true);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const joinProximityChannel = async (channelId) => {
    console.log(`Joining proximity channel: ${channelId}`);
    // TODO: Integrate with proximityVotingService
    return { success: true, channelId };
  };

  const leaveProximityChannel = async (channelId) => {
    console.log(`Leaving proximity channel: ${channelId}`);
    // TODO: Integrate with proximityVotingService
    return { success: true, channelId };
  };

  const broadcastToProximity = async (message) => {
    console.log(`Broadcasting to proximity: ${message}`);
    // TODO: Implement ephemeral proximity broadcasting
    return { success: true, messageId: 'mock-' + Date.now() };
  };

  return {
    nearbyUsers,
    isInProximity,
    proximityChannels,
    loading,
    joinProximityChannel,
    leaveProximityChannel,
    broadcastToProximity
  };
}; 