/**
 * RelayStore - Zustand Store for Relay Network State Management
 * Manages channels, voting, camera controls, and search mode integration
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useRelayStore = create(devtools((set, get) => ({
  // Channel System State
  channels: new Map(),
  activeMode: 'OVERVIEW',
  selectedChannel: null,
  hoveredChannelId: null,
  
  // Camera and Navigation State
  cameraDistance: 12,
  mousePosition: { x: 0, y: 0 },
  floatMode: false,
  
  // Search Mode Integration
  searchModeActive: false,
  searchResults: [],
  selectedSearchChannel: null,
  
  // Vote System State
  userVotes: new Map(),
  voteResults: new Map(),
  
  // Actions
  setCameraDistance: (distance) => set({ cameraDistance: distance }),
  
  setActiveMode: (mode) => set({ activeMode: mode }),
  
  selectChannel: (channel) => set({ selectedChannel: channel }),
  
  clearSelectedChannel: () => set({ selectedChannel: null }),
  
  setHoveredChannel: (channelId) => set({ hoveredChannelId: channelId }),
  
  clearHoveredChannel: () => set({ hoveredChannelId: null }),
  
  setMousePosition: (position) => set({ mousePosition: position }),
  
  setFloatMode: (enabled) => set({ floatMode: enabled }),
  
  // Search Mode Actions
  toggleSearchMode: () => set((state) => ({ 
    searchModeActive: !state.searchModeActive 
  })),
  
  setSearchResults: (results) => set({ searchResults: results }),
  
  setSelectedSearchChannel: (channel) => set({ selectedSearchChannel: channel }),
  
  // Initialize mock channels data
  initializeChannels: async () => {
    const mockChannels = new Map();
    
    // Add some sample channels for testing
    const sampleChannels = [
      {
        id: 'coffee-seattle',
        name: 'Coffee Discussion',
        location: { lat: 47.6062, lon: -122.3321 },
        type: 'proximity',
        participants: 45,
        votes: 234,
        reliability: 87.3
      },
      {
        id: 'tech-global',
        name: 'Tech Innovation',
        location: { lat: 37.7749, lon: -122.4194 },
        type: 'global',
        participants: 892,
        votes: 23456,
        reliability: 91.7
      },
      {
        id: 'governance-seattle',
        name: 'Local Governance',
        location: { lat: 47.6062, lon: -122.3321 },
        type: 'regional',
        participants: 445,
        votes: 8934,
        reliability: 73.2
      }
    ];
    
    sampleChannels.forEach(channel => {
      mockChannels.set(channel.id, channel);
    });
    
    set({ channels: mockChannels });
    return mockChannels;
  },
  
  // Voting Actions
  castVote: (channelId, voteType) => {
    const { userVotes, voteResults } = get();
    const newUserVotes = new Map(userVotes);
    const newVoteResults = new Map(voteResults);
    
    // Update user vote
    const currentVote = newUserVotes.get(channelId);
    if (currentVote === voteType) {
      newUserVotes.delete(channelId); // Remove vote if same
    } else {
      newUserVotes.set(channelId, voteType);
    }
    
    // Update vote counts
    const currentResults = newVoteResults.get(channelId) || { up: 0, down: 0 };
    if (currentVote) {
      currentResults[currentVote]--;
    }
    if (newUserVotes.has(channelId)) {
      currentResults[voteType]++;
    }
    newVoteResults.set(channelId, currentResults);
    
    set({ 
      userVotes: newUserVotes, 
      voteResults: newVoteResults 
    });
  },
  
  // Get current vote for a channel
  getUserVote: (channelId) => {
    const { userVotes } = get();
    return userVotes.get(channelId);
  },
  
  // Get vote counts for a channel
  getVoteResults: (channelId) => {
    const { voteResults } = get();
    return voteResults.get(channelId) || { up: 0, down: 0 };
  }
}), {
  name: 'relay-store',
  getStorage: () => localStorage
}));

export { useRelayStore };
