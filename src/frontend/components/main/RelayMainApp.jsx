/**
 * BASE MODEL 1 - CONSOLIDATED EARTH GLOBE SYSTEM WITH WORKSPACE
 * 
 * Enhanced implementation combining:
 * - Working globe with mosaic texture
 * - 6 zoom system (Search/Development/Channel/Region/Proximity/Map)
 * - Channel tower system with clicking
 * - Panel docking system with workspace layout
 * - Essential state management only
 * 
 * This is the CORE foundation with advanced UI capabilities.
 */
import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
// Remove three.js components - we're using temporary globe now
import InteractiveGlobe from './globe/InteractiveGlobe.jsx';

import ModeDropdown from '../workspace/ui/ModeDropdown.jsx';

import DebugPanel from '../workspace/panels/DebugPanel.jsx';
import ErrorBoundary from '../workspace/ErrorBoundary.jsx';
import { useMode, MODES } from '../../context/ModeContext';
import { ModeProvider } from '../../context/ModeContext';
import { WindowManagementProvider, useWindowManagement } from '../../context/WindowManagementContext.jsx';
import { useEnhancedGridDraggable } from '../workspace/hooks/useEnhancedGridDraggable.js';
import DragDropContainer from '../workspace/DragDropContainer.jsx';

// Authoritative Vote API - Single Source of Truth
import authoritativeVoteAPI from '../../services/authoritativeVoteAPI.js';

// Integrated Components from previous session
import BiometricCapture from '../workspace/BiometricCapture.jsx';
import NetworkTopologyVisualization from '../workspace/ui/analytics/NetworkTopologyVisualization.jsx';
import PersonhoodVerificationPanel from '../workspace/PersonhoodVerificationPanel.jsx';
import ChannelChatPanel from '../workspace/ui/chat/ChannelChatPanel.jsx';
import usePersonhoodVerification from '../workspace/usePersonhoodVerification.js';
import ProximityPanel from '../workspace/panels/ProximityPanel.jsx';
import MapControlsPanel from '../workspace/panels/MapControlsPanel.jsx';
import SearchPanel from '../workspace/panels/SearchPanel.jsx';
import EnhancedFeaturesPanel from '../workspace/panels/EnhancedFeaturesPanel.jsx';
import GovernancePanel from '../workspace/panels/GovernancePanel.jsx';
import AIAssistantPanel from '../workspace/panels/AIAssistantPanel.jsx';
import DemocraticChatroomPanel from '../workspace/panels/DemocraticChatroomPanel.jsx';
import TestDataPanel from '../workspace/panels/TestDataPanel.jsx';
import FoundersReportPanel from '../workspace/panels/FoundersReportPanel.jsx';
import ChannelInfoPanel from '../workspace/panels/ChannelInfoPanel.jsx';
import ChannelDisplay from '../workspace/panels/ChannelDisplay.jsx';
import VotingPanel from './panels/VotingPanel.jsx';
import ChannelTopicRowPanelRefactored from '../workspace/panels/ChannelTopicRowPanelRefactored.jsx';
import LayerControlPanel from '../workspace/panels/LayerControlPanel.jsx';
import ClusteringControlPanel from '../workspace/panels/ClusteringControlPanel.jsx';
// NEW: Unified channel panel with compositional architecture
import UnifiedChannelPanel from '../shared/panels/UnifiedChannelPanel.jsx';
// Removed GlobeCore import - using EarthGlobe instead
// import Panel3DObject from './ui/Panel3DObject';

const WorkspaceLayoutContent = ({ enhancedFeaturesStatus, hideGlobe = false, showGlobe = true }) => {
  // Mode system
  const { currentMode, getCurrentModeConfig } = useMode();
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const earthGlobeRef = useRef(null);
  
  // Clustering state
  const [clusterLevel, setClusterLevel] = useState('gps');
  const [clusteredChannels, setClusteredChannels] = useState([]);
  const [showClusteringControls, setShowClusteringControls] = useState(false);
  
  // Real channels from backend - will be populated by TestDataPanel
  const [realChannels, setRealChannels] = useState([]);
  
  // Authoritative vote totals - Single Source of Truth
  const [authoritativeVoteTotals, setAuthoritativeVoteTotals] = useState(new Map());
  const [voteDataLoading, setVoteDataLoading] = useState(false);
  
  const [globeState, setGlobeStateRaw] = useState(() => {
    const config = getCurrentModeConfig();
    return {
      currentZoom: { 
        name: config?.name || 'Development', 
        tileResolution: config?.tileResolution || 64 
      },
      cameraDistance: config?.distance || 5,
      floatMode: false,
      selectedChannel: null,
      channelsUpdated: null,
      voteCounts: {} // Initialize voteCounts for hover tooltips
    };
  });
  
  // Wrap setGlobeState to log all updates and ensure voteCounts is preserved
  // Use useCallback to ensure this function reference is stable and doesn't trigger infinite loops
  const setGlobeState = useCallback((updater) => {
    setGlobeStateRaw(prevState => {
      const newState = typeof updater === 'function' ? updater(prevState) : updater;
      
      // CRITICAL: Detect if voteCounts is being lost
      if (prevState.voteCounts && Object.keys(prevState.voteCounts).length > 0 && !newState.voteCounts) {
        console.error('❌ [RelayMainApp] VOTE COUNTS LOST!', {
          prevKeys: Object.keys(prevState.voteCounts),
          newStateKeys: Object.keys(newState),
          stackTrace: new Error().stack
        });
      }
      
      console.log('🔄 [RelayMainApp] globeState update:', {
        hadVoteCounts: !!prevState.voteCounts,
        prevVoteCountKeys: prevState.voteCounts ? Object.keys(prevState.voteCounts).length : 0,
        hasVoteCountsAfter: !!newState.voteCounts,
        newVoteCountKeys: newState.voteCounts ? Object.keys(newState.voteCounts).length : 0,
        updateKeys: Object.keys(newState)
      });
      return newState;
    });
  }, []); // Empty deps - this function never changes

  const { windows, registerWindow, updateWindow } = useWindowManagement();
  const [openPanels, setOpenPanels] = useState(new Set([])); // Start with no panels open

  // Fetch real channels from backend
  const fetchRealChannels = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/channels');
      if (response.ok) {
        const data = await response.json();
        const channels = Array.isArray(data) ? data : (data.channels || []);
        setRealChannels(channels);
        
        // Update globe state to trigger refresh
        setGlobeState(prev => ({
          ...prev,
          channelsUpdated: Date.now(),
          realChannels: channels
        }));

        // Dispatch channelsUpdated event so GlobalChannelRenderer refreshes
        // Add small delay to ensure GlobalChannelRenderer is fully initialized
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('channelsUpdated'));
        }, 500);
      } else {
        console.warn('⚠️ [WorkspaceLayout] Failed to fetch channels:', response.status);
      }
    } catch (error) {
      console.error('❌ [WorkspaceLayout] Error fetching channels:', error);
    }
  };

  /**
   * Fetch authoritative vote totals for a specific channel
   * @param {string} channelId - Channel ID to fetch vote totals for
   */
  const fetchAuthoritativeVoteTotals = async (channelId) => {
    if (!channelId) return;
    
    try {
      setVoteDataLoading(true);
      const voteTotals = await authoritativeVoteAPI.getTopicVoteTotals(channelId);
      
      // Store in Map for efficient lookups
      setAuthoritativeVoteTotals(prev => {
        const newMap = new Map(prev);
        newMap.set(channelId, voteTotals);
        return newMap;
      });
      
      console.log('✅ [WorkspaceLayout] Fetched authoritative vote totals:', {
        channelId,
        totalVotes: voteTotals.totalVotes,
        candidateCount: Object.keys(voteTotals.candidates).length
      });
      
    } catch (error) {
      console.error('❌ [WorkspaceLayout] Error fetching authoritative vote totals:', error);
      // Set fallback data
      setAuthoritativeVoteTotals(prev => {
        const newMap = new Map(prev);
        newMap.set(channelId, {
          topicId: channelId,
          totalVotes: 0,
          candidates: {},
          lastUpdated: null,
          error: error.message
        });
        return newMap;
      });
    } finally {
      setVoteDataLoading(false);
    }
  };

  // Fetch vote totals when selected channel changes
  useEffect(() => {
    if (globeState?.selectedChannel?.id) {
      fetchAuthoritativeVoteTotals(globeState.selectedChannel.id);
    }
  }, [globeState?.selectedChannel?.id]);

  // Note: WorkspaceLayout only dispatches channelsUpdated events, it doesn't listen to them
  // to avoid circular dependencies with GlobalChannelRenderer  // Global function to force open panel (for debugging)
  useEffect(() => {
    window.forceOpenPanel = (panelId = 'channel_topic_row') => {
      setOpenPanels(prev => {
        const newSet = new Set([...prev, panelId]);
        return newSet;
      });
    };
    
    window.testVotePanel = () => {
      // Set a dummy selected channel
      setGlobeState(prev => ({
        ...prev,
        selectedChannel: {
          id: 'test-channel',
          name: 'Test Channel',
          candidates: [
            { id: 'test-1', name: 'Test Candidate 1', votes: 100 },
            { id: 'test-2', name: 'Test Candidate 2', votes: 200 }
          ]
        }
      }));
      // Force open the panel
      window.forceOpenPanel('channel_topic_row');
    };
    
    // Debug function to test event dispatching
    window.testEventDispatch = () => {
      const event = new CustomEvent('openPanel', {
        detail: { panelId: 'channel_topic_row' }
      });
      window.dispatchEvent(event);
    };
    
    return () => {
      delete window.forceOpenPanel;
      delete window.testVotePanel;
      delete window.testEventDispatch;
    };
  }, []);

  // Debug channel selection
  const handleChannelClick = (channel) => {
    setSelectedChannel(channel);
    setGlobeState(prev => ({ ...prev, selectedChannel: channel }));
    
    // Force open the channel topic row panel
    setOpenPanels(prev => {
      const newSet = new Set([...prev, 'channel_topic_row']);
      return newSet;
    });
  };

  // Handle clustering level changes
  const handleClusterLevelChange = useCallback((newLevel, newChannels) => {
    setClusterLevel(newLevel);
    setClusteredChannels(newChannels || []);
    setGlobeState(prev => ({ 
      ...prev, 
      clusterLevel: newLevel,
      clusteredChannels: newChannels,
      channelsUpdated: Date.now()
    }));
  }, []);

  // Stable callback functions to prevent EarthGlobe re-renders
  const handleCandidateClick = useCallback((candidateData, channelData, coordinates) => {
    console.log('🎯 Candidate clicked from cube system:', candidateData?.name, 'in channel:', channelData?.name);

    setSelectedCandidate(candidateData);
    setSelectedChannel(channelData);
    setGlobeState(prev => ({ ...prev, selectedChannel: channelData }));
    
    // Auto-open channel panel for selected candidate's channel
    setOpenPanels(prev => {
      const newSet = new Set([...prev, 'channel_topic_row']);
      return newSet;
    });
  }, []);

  const handleCandidateHover = useCallback((candidate) => {
    console.log('👀 Candidate hovered from cube system:', candidate.candidate?.name);
  }, []);

  const handleChannelSelect = useCallback((channel) => {
    console.log('🎯 Channel selected from main globe:', channel.name);
    setSelectedChannel(channel);
    setGlobeState(prev => ({ ...prev, selectedChannel: channel }));
    
    // Auto-open channel panel for selected channel
    setOpenPanels(prev => {
      const newSet = new Set([...prev]);
      newSet.add('channel_topic_row');
      return newSet;
    });
  }, []);

  const handleChannelVote = useCallback((channel) => {
    console.log('🗳️ Vote initiated from main globe for:', channel.name);
    // Handle voting logic here if needed
  }, []);

  // Create stable globe props to prevent unnecessary re-renders
  const stableGlobeState = useMemo(() => ({
    selectedChannel: globeState?.selectedChannel,
    currentZoom: globeState?.currentZoom,
    cameraDistance: globeState?.cameraDistance,
    floatMode: globeState?.floatMode,
    voteCounts: globeState?.voteCounts,
    hasVoteCounts: globeState?.hasVoteCounts
  }), [
    globeState?.selectedChannel,
    globeState?.currentZoom?.name,
    globeState?.cameraDistance,
    globeState?.floatMode,
    globeState?.voteCounts,
    globeState?.hasVoteCounts
  ]);

  // Handle panel closing
  const handleClosePanel = (panelId) => {
    console.log('🎯 Closing panel:', panelId);
    setOpenPanels(prev => {
      const newSet = new Set([...prev]);
      newSet.delete(panelId);
      return newSet;
    });
    
    // Clear selected channel when channel panel is closed
    if (panelId === 'channel_topic_row') {
      setGlobeState(prev => ({ ...prev, selectedChannel: null }));
    }
    
    // When TestDataPanel closes, refresh globe to show persisted channels
    if (panelId === 'test_data_panel') {
      console.log('🎯 TestDataPanel closed - refreshing globe to show persisted channels');
      // Trigger a channel refresh after a small delay to ensure panel is fully closed
      setTimeout(() => {
        fetchRealChannels();
        window.dispatchEvent(new CustomEvent('channelsUpdated'));
      }, 100);
    }
  };



  // Mode-based panel definitions
  const MODE_PANELS = useMemo(() => ({
    [MODES.SEARCH]: [
      {
        id: 'search_panel',
        title: 'Search & Discovery',
        type: 'search',
        component: 'SearchPanel',
        description: 'Find channels, topics, people, or locations',
        status: 'mode-specific',
        order: 1
      },
             {
         id: 'channel_topic_row',
         title: globeState?.selectedChannel?.name || 'Channel Candidates',
         type: 'voting',
         component: 'ChannelTopicRowPanelRefactored',
         description: 'Channel candidates ranked by votes with voting functionality',
         status: 'mode-specific',
         order: 2
       }
    ],
    [MODES.DEVELOPER]: [
      {
        id: 'debug_panel',
        title: 'Developer Tools',
        type: 'development',
        component: 'DebugPanel',
        description: 'System logs and development controls',
        status: 'mode-specific',
        order: 1
      },
      {
        id: 'clustering_controls',
        title: 'Channel Clustering',
        type: 'development',
        component: 'ClusteringControlPanel',
        description: 'Test 6-level channel clustering hierarchy (GPS → City → State → Country → Continent → Globe)',
        status: 'mode-specific',
        order: 2
      },
      {
        id: 'enhanced_features',
        title: 'Enhanced Features',
        type: 'monitoring',
        component: 'EnhancedFeaturesPanel',
        description: 'Sybil Defense, Channel Discovery, Enhanced Window Management',
        status: 'mode-specific',
        order: 3
      },
      {
        id: 'governance_panel',
        title: 'Governance Center',
        type: 'governance',
        component: 'GovernancePanel',
        description: 'Democratic governance and committee management',
        status: 'mode-specific',
        order: 4
      },
      {
        id: 'ai_assistant',
        title: 'AI Assistant',
        type: 'ai',
        component: 'AIAssistantPanel',
        description: 'Dual-agent AI system for user guidance',
        status: 'mode-specific',
        order: 5
      },
      {
        id: 'democratic_chatroom',
        title: 'Democratic Chatroom',
        type: 'communication',
        component: 'DemocraticChatroomPanel',
        description: 'Real-time community chat with moderation',
        status: 'mode-specific',
        order: 6
      },
      {
        id: 'test_data_panel',
        title: 'Test Data Generator',
        type: 'development',
        component: 'TestDataPanel',
        description: 'Advanced test data generation and management',
        status: 'mode-specific',
        order: 7
      },
      {
        id: 'founders_report',
        title: 'Founders Report',
        type: 'governance',
        component: 'FoundersReportPanel',
        description: 'System parameter configuration and founder controls',
        status: 'mode-specific',
        order: 8
      },
             {
         id: 'channel_topic_row',
         title: globeState?.selectedChannel?.name || 'Channel Candidates',
         type: 'voting',
         component: 'ChannelTopicRowPanelRefactored',
         description: 'Channel candidates ranked by votes with voting functionality',
         status: 'mode-specific',
         order: 9
       }
    ],
    [MODES.CHANNELS]: [
      {
        id: 'channel_chat',
        title: 'Channel Chat & Communication',
        type: 'communication',
        component: 'ChannelChatPanel',
        description: 'Real-time messaging and channel exploration interface',
        status: 'mode-specific',
        order: 1
      },
      {
        id: 'channel_info',
        title: 'Channel Information',
        type: 'info',
        component: 'ChannelInfoPanel',
        description: 'Channel details and statistics display',
        status: 'mode-specific',
        order: 2
      },
      {
        id: 'channel_topic_row',
        title: globeState?.selectedChannel?.name || 'Channel Candidates',
        type: 'voting',
        component: 'ChannelTopicRowPanelRefactored',
        description: 'Channel candidates ranked by votes with voting functionality',
        status: 'mode-specific',
        order: 3
      }
    ],
    [MODES.REGION]: [
      {
        id: 'voting_panel',
        title: 'Voting & Blockchain',
        type: 'system',
        component: 'VotingPanel',
        description: 'Core voting mechanics and blockchain integration',
        status: 'mode-specific',
        order: 1
      },
      {
        id: 'layer_controls',
        title: 'Layer Controls',
        type: 'controls',
        component: 'LayerControlPanel',
        description: 'Globe layer management and visualization controls',
        status: 'mode-specific',
        order: 2
      },
      {
        id: 'channel_topic_row',
        title: globeState?.selectedChannel?.name || 'Channel Topic',
        type: 'voting',
        component: 'ChannelTopicRowPanelRefactored',
        description: 'Channel candidates ranked by votes with voting functionality',
        status: 'mode-specific',
        order: 3
      }
    ],
    [MODES.PROXIMITY]: [
      {
        id: 'proximity_panel',
        title: 'Proximity & Nearby',
        type: 'proximity',
        component: 'ProximityPanel',
        description: 'Nearby users, ephemeral broadcasts, invites',
        status: 'mode-specific',
        order: 1
      },
      {
        id: 'channel_topic_row',
        title: globeState?.selectedChannel?.name || 'Channel Topic',
        type: 'voting',
        component: 'ChannelTopicRowPanelRefactored',
        description: 'Channel candidates ranked by votes with voting functionality',
        status: 'mode-specific',
        order: 2
      }
    ],
    [MODES.MAP]: [
      {
        id: 'channel_topic_row',
        title: globeState?.selectedChannel?.name || 'Channel Topic',
        type: 'voting',
        component: 'ChannelTopicRowPanelRefactored',
        description: 'Channel candidates ranked by votes with voting functionality',
        status: 'mode-specific',
        order: 1
      }
    ]
  }), [globeState?.selectedChannel]);

  // Get current mode panels (after MODE_PANELS is defined)
  const currentModePanels = MODE_PANELS[currentMode] || MODE_PANELS[MODES.DEVELOPER];

  console.log('🎯 Current mode:', currentMode);
  console.log('🎯 Available panels for current mode:', currentModePanels.map(p => p.id));
  
  // Listen for panel open events, close events, and mode switch events
  useEffect(() => {
    console.log('🎯 Setting up event listeners for panel management');
    
    const handleOpenPanel = (event) => {
      const { panelId } = event.detail;
      console.log('🎯 Panel open event received:', panelId);
      console.log('🎯 Event detail:', event.detail);
      console.log('🎯 Current mode when panel open event received:', currentMode);
      console.log('🎯 Available panels for current mode:', currentModePanels.map(p => p.id));
      
      // Check if panel is available in current mode
      const isPanelAvailable = currentModePanels.some(p => p.id === panelId);
      console.log('🎯 Is panel available in current mode?', isPanelAvailable);
      
      if (!isPanelAvailable) {
        console.warn('🎯 Panel not available in current mode:', panelId);
        console.warn('🎯 Available panels:', currentModePanels.map(p => p.id));
        return;
      }
      
      setOpenPanels(prev => {
        console.log('🎯 Current openPanels before update:', Array.from(prev));
        const newSet = new Set([...prev, panelId]);
        console.log('🎯 Updated openPanels:', Array.from(newSet));
        return newSet;
      });
    };

    // Also listen for candidate clicks and force open panel
    const handleCandidateClick = (event) => {
      console.log('🎯 Candidate clicked from cube system:', event.detail);
      // Force open the panel regardless of event system
      setOpenPanels(prev => {
        console.log('🎯 Force opening panel from candidate click');
        const newSet = new Set([...prev, 'channel_topic_row']);
        console.log('🎯 Force updated openPanels from candidate click:', Array.from(newSet));
        return newSet;
      });
    };

    const handleClosePanel = (event) => {
      const { panelId } = event.detail;
      console.log('🎯 Panel close event received:', panelId);
      console.log('🎯 Current openPanels before close:', Array.from(openPanels));
      setOpenPanels(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(panelId);
        console.log('🎯 Updated openPanels after close:', Array.from(newSet));
        return newSet;
      });
    };

    const handleSwitchMode = (event) => {
      const { mode } = event.detail;
      console.log('🎯 Mode switch event received:', mode);
      console.log('🎯 Current mode before switch:', currentMode);
      // Actually switch the mode
      if (mode && Object.values(MODES).includes(mode)) {
        console.log('🎯 Switching to mode:', mode);
        // The mode will be updated by the ModeDropdown component
        // We just need to ensure the panel opens after mode switch
      }
    };

    window.addEventListener('openPanel', handleOpenPanel);
    window.addEventListener('closePanel', handleClosePanel);
    window.addEventListener('switchMode', handleSwitchMode);
    window.addEventListener('candidateClicked', handleCandidateClick);
    
    // Listen for candidatesGenerated event to auto-switch cluster level
    const handleCandidatesGenerated = (event) => {
      const { suggestedClusterLevel, province, country } = event.detail || {};
      if (suggestedClusterLevel) {
        console.log(`🎯 [RelayMainApp] Auto-switching cluster level to: ${suggestedClusterLevel} (province: ${province}, country: ${country})`);
        handleClusterLevelChange(suggestedClusterLevel);
      }
    };
    window.addEventListener('candidatesGenerated', handleCandidatesGenerated);
    
    return () => {
      window.removeEventListener('openPanel', handleOpenPanel);
      window.removeEventListener('closePanel', handleClosePanel);
      window.removeEventListener('switchMode', handleSwitchMode);
      window.removeEventListener('candidateClicked', handleCandidateClick);
      window.removeEventListener('candidatesGenerated', handleCandidatesGenerated);
    };
  }, [currentMode, currentModePanels, handleClusterLevelChange]);

  // Render panel content based on component type
  const renderPanelContent = useCallback((panel) => {
    const commonProps = {
      panel,
      globeState,
      setGlobeState,
      layout: { panels: currentModePanels },
      updatePanel: () => {}
    };

    try {
      switch (panel.component) {
        case 'DebugPanel':
          return <DebugPanel {...commonProps} />;
        case 'EnhancedFeaturesPanel':
          // Guard for missing functions
          if (!window.sybilDefenseService || typeof window.sybilDefenseService.getSybilResistanceMetrics !== 'function') {
            return <div style={{color: 'red', padding: 16}}>Enhanced features metrics unavailable.</div>;
          }
          return <EnhancedFeaturesPanel {...commonProps} enhancedFeaturesStatus={enhancedFeaturesStatus} />;
        case 'GovernancePanel':
          try {
            return <GovernancePanel {...commonProps} />;
          } catch (e) {
            return <div style={{color: 'red', padding: 16}}>Governance panel failed to load.</div>;
          }
        case 'AIAssistantPanel':
          return <AIAssistantPanel {...commonProps} />;
        case 'DemocraticChatroomPanel':
          return <DemocraticChatroomPanel {...commonProps} />;
        case 'TestDataPanel':
          return <TestDataPanel {...commonProps} />;
        case 'FoundersReportPanel':
          return <FoundersReportPanel {...commonProps} />;
        case 'ChannelInfoPanel':
          // Use UnifiedChannelPanel for compositional architecture
          return <UnifiedChannelPanel {...commonProps} />;
        case 'ChannelDisplay':
          return <ChannelDisplay 
            selectedChannel={globeState?.selectedChannel} 
            onClose={() => setGlobeState(prev => ({ ...prev, selectedChannel: null }))}
            {...commonProps}
          />;
                 case 'VotingPanel':
           try {
             return (
               <VotingPanel 
                 panel={panel}
                 globeState={globeState}
                 setGlobeState={setGlobeState}
                 layout={{ panels: currentModePanels }}
                 updatePanel={() => {}}
                 onVoteUpdate={async (voteData) => {
                   // Refresh vote counts when a vote is cast
                   console.log('🎯 [WorkspaceLayout] Received vote update:', voteData);
                   
                  // Update the globeState with fresh vote counts FIRST
                  if (voteData.voteCounts) {
                    console.log('🎯 [WorkspaceLayout] Updating globeState with fresh vote counts:', voteData.voteCounts);
                    setGlobeState(prevState => ({
                      ...prevState,
                      voteCounts: {
                        ...prevState.voteCounts,  // ✅ MERGE: Keep existing counts
                        ...voteData.voteCounts    // ✅ MERGE: Add new counts
                      },
                      hasVoteCounts: true
                    }));
                     
                     // Wait for the state update to propagate, then refresh globe
                     setTimeout(() => {
                       if (earthGlobeRef.current) {
                         console.log('🎯 [WorkspaceLayout] Refreshing globe with updated vote counts after delay');
                         earthGlobeRef.current.refreshVoteCounts();
                       }
                     }, 100); // Small delay to allow state update
                   }
                   
                   // Update the authoritative vote totals immediately for header display
                   if (voteData.channelId && voteData.totalVotes !== undefined) {
                     console.log('🎯 [WorkspaceLayout] Updating authoritative vote totals for header:', {
                       channelId: voteData.channelId,
                       totalVotes: voteData.totalVotes
                     });
                     
                     // Refresh authoritative vote totals from backend
                     await fetchAuthoritativeVoteTotals(voteData.channelId);
                   }
                 }}
                 onClose={() => {
                   // Close the panel by removing it from openPanels
                   setOpenPanels(prev => {
                     const newSet = new Set([...prev]);
                     newSet.delete('channel_topic_row');
                     return newSet;
                   });
                 }}
                 voteDataLoading={voteDataLoading}
                 {...commonProps}
               />
             );
           } catch (error) {
             console.error('🎯 VotingPanel failed to render:', error);
             return (
               <div style={{ padding: '20px', color: 'white', backgroundColor: 'red' }}>
                 <h3>Channel Topic Row Panel</h3>
                 <p>Error: {error.message}</p>
                 <p>Selected Channel: {globeState?.selectedChannel?.name || 'None'}</p>
                 <p>This is a fallback view for testing.</p>
               </div>
             );
           }
        case 'ChannelTopicRowPanelRefactored':
           try {
             return (
               <ChannelTopicRowPanelRefactored 
                 panel={panel}
                 globeState={globeState}
                 setGlobeState={setGlobeState}
                 layout={{ panels: currentModePanels }}
                 updatePanel={() => {}}
                 onVoteUpdate={async (voteData) => {
                   // Refresh vote counts when a vote is cast
                   console.log('🎯 [WorkspaceLayout] Received vote update:', voteData);
                   
                  // Update the globeState with fresh vote counts FIRST
                  if (voteData.voteCounts) {
                    console.log('🎯 [WorkspaceLayout] Updating globeState with fresh vote counts:', voteData.voteCounts);
                    setGlobeState(prevState => ({
                      ...prevState,
                      voteCounts: {
                        ...prevState.voteCounts,  // ✅ MERGE: Keep existing counts
                        ...voteData.voteCounts    // ✅ MERGE: Add new counts
                      },
                      hasVoteCounts: true
                    }));
                     
                     // Wait for the state update to propagate, then refresh globe
                     setTimeout(() => {
                       if (earthGlobeRef.current) {
                         console.log('🎯 [WorkspaceLayout] Refreshing globe with updated vote counts after delay');
                         earthGlobeRef.current.refreshVoteCounts();
                       }
                     }, 100); // Small delay to allow state update
                   }
                   
                   // Update the authoritative vote totals immediately for header display
                   if (voteData.channelId && voteData.totalVotes !== undefined) {
                     console.log('🎯 [WorkspaceLayout] Updating authoritative vote totals for header:', {
                       channelId: voteData.channelId,
                       totalVotes: voteData.totalVotes
                     });
                     
                     // Refresh authoritative vote totals from backend
                     await fetchAuthoritativeVoteTotals(voteData.channelId);
                   }
                 }}
                 onClose={() => {
                   // Close the panel by removing it from openPanels
                   setOpenPanels(prev => {
                     const newSet = new Set([...prev]);
                     newSet.delete('channel_topic_row');
                     return newSet;
                   });
                 }}
                 {...commonProps}
               />
             );
           } catch (error) {
             console.error('🎯 ChannelTopicRowPanelRefactored failed to render:', error);
             return (
               <div style={{ padding: '20px', color: 'white', backgroundColor: 'red' }}>
                 <h3>Channel Topic Row Panel (Refactored)</h3>
                 <p>Error: {error.message}</p>
                 <p>Selected Channel: {globeState?.selectedChannel?.name || 'None'}</p>
                 <p>This is a fallback view for testing.</p>
               </div>
             );
           }
        case 'ChannelChatPanel':
          return (
            <div style={{ padding: '20px', color: 'white' }}>
              <h3>Channel Chat Panel</h3>
              <p>Channel chat functionality would be here</p>
            </div>
          );
        case 'NetworkTopologyVisualization':
          return <NetworkTopologyVisualization compact={true} />;
        case 'PersonhoodVerificationPanel':
          return <PersonhoodVerificationPanel {...commonProps} />;
        case 'ProximityPanel':
          return <ProximityPanel {...commonProps} />;
        case 'MapControlsPanel':
          return <MapControlsPanel 
            {...commonProps} 
            onChannelSelect={(channel) => {
              console.log('🎯 Channel selected from MapControlsPanel:', channel.name);
              setSelectedChannel(channel);
              setGlobeState(prev => ({ ...prev, selectedChannel: channel }));
              
              // Auto-open channel panel for selected channel
              setOpenPanels(prev => {
                const newSet = new Set([...prev]);
                newSet.add('channel_topic_row');
                return newSet;
              });
            }}
            selectedChannel={globeState?.selectedChannel}
          />;
        case 'LayerControlPanel':
          return <LayerControlPanel {...commonProps} />;
        case 'ClusteringControlPanel':
          return <ClusteringControlPanel 
            currentLevel={clusterLevel}
            onClusterLevelChange={handleClusterLevelChange}
          />;
        case 'SearchPanel':
          return <SearchPanel {...commonProps} />;
        default:
          return (
            <div style={{ padding: '20px', color: 'white' }}>
              <h3>Panel: {panel.title}</h3>
              <p>Component: {panel.component}</p>
              <p>This panel is not yet implemented.</p>
            </div>
          );
      }
    } catch (err) {
      return <div style={{color: 'red', padding: 16}}>Panel failed to load: {err.message}</div>;
    }
  }, [currentModePanels, enhancedFeaturesStatus, globeState, setGlobeState]);

  // Render panels as overlays on top of the globe
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: 'transparent',
      fontFamily: 'Arial, sans-serif',
             border: 'none'
      // pointerEvents: 'none' // Removed to allow interaction
    }}>
      {/* InteractiveGlobe 3D Component - Center */}
      {showGlobe && !hideGlobe && (
        <div style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1, // Base layer for globe
          pointerEvents: 'auto'
        }}>
          <InteractiveGlobe
            ref={earthGlobeRef}
            key="main-earth-globe"
            selectedChannel={stableGlobeState.selectedChannel}
            channels={realChannels} // Use real channels from backend
            selectedCandidate={selectedCandidate}
            setSelectedCandidate={setSelectedCandidate}
            globeState={stableGlobeState}
            setGlobeState={setGlobeState}
            onCandidateClick={handleCandidateClick}
            onCandidateHover={handleCandidateHover}
            onChannelSelect={handleChannelSelect}
            onChannelVote={handleChannelVote}
            onClusterLevelChange={handleClusterLevelChange}
            enableInteraction={true}
            showChannelTowers={true}
            showVotingActivity={true}
            tileServerUrl="http://localhost:8081"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}
      


             {/* Mode Dropdown - Right Side Panel */}
       <div style={{
         position: 'absolute',
         top: '50%',
         right: '20px',
         transform: 'translateY(-50%)',
         zIndex: 1000,
         textAlign: 'center',
         background: 'rgba(20, 24, 36, 0.98)',
         borderRadius: '16px',
         boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
         padding: '20px 12px',
         border: '1.5px solid #222b3a',
         height: 'auto',
         minHeight: '400px',
         display: 'flex',
         flexDirection: 'column',
         pointerEvents: 'auto' // Enable interaction with dropdown
       }}>
         <ModeDropdown />
       </div>

       {/* Map Controls Floating Dock - Bottom Right */}
       {currentMode === MODES.MAP && (
         <div style={{
           position: 'absolute',
           bottom: '20px',
           right: '20px',
           zIndex: 1000,
           pointerEvents: 'auto'
         }}>
           <MapControlsPanel 
             panelId="map_controls"
             title="Map Controls"
             type="map"
           />
         </div>
       )}

      {/* Draggable/Dockable Panels */}
      {currentModePanels.map((panel, idx) => {
         // Check if panel should be open based on openPanels state
         const isOpen = openPanels.has(panel.id);
         
         console.log('🎯 Panel render check:', panel.id, 'isOpen:', isOpen, 'openPanels:', Array.from(openPanels));

         if (!isOpen) return null;
        
                 // Use DragDropContainer for all panels
         return (
                       <DragDropContainer
              key={panel.id}
              panelId={panel.id}
              title={panel.id === 'channel_topic_row' ? 
                (globeState?.selectedChannel?.name + 
                 (globeState?.selectedChannel?.category ? ` • ${globeState.selectedChannel.category}` : '') || 
                 'Channel Candidates') : 
                panel.title}
              defaultPosition={panel.id === 'channel_topic_row' ? { x: 50, y: 50 } : { x: 100, y: 100 }}
              defaultSize={panel.id === 'channel_topic_row' ? { width: 600, height: 400 } : { width: 340, height: 320 }}
              isDraggable={true}
              isResizable={true}
              onClose={handleClosePanel}
              // Channel stats for channel_topic_row panel - USE AUTHORITATIVE SOURCE
              totalVotes={panel.id === 'channel_topic_row' && globeState?.selectedChannel ? 
                (() => {
                  const channelId = globeState.selectedChannel.id;
                  const authoritativeData = authoritativeVoteTotals.get(channelId);
                  
                  if (authoritativeData && !authoritativeData.error) {
                    // Use authoritative total votes - single source of truth
                    console.log('🎯 [WorkspaceLayout] Using authoritative vote total:', authoritativeData.totalVotes);
                    return authoritativeData.totalVotes;
                  } else {
                    // Fallback to static data only if authoritative data unavailable
                    const fallbackTotal = globeState.selectedChannel.candidates?.reduce((sum, candidate) => {
                      return sum + (candidate.votes || 0);
                    }, 0) || 0;
                    console.log('⚠️ [WorkspaceLayout] Using fallback vote total:', fallbackTotal);
                    return fallbackTotal;
                  }
                })() : null}
              category={panel.id === 'channel_topic_row' && globeState?.selectedChannel ? 
                globeState.selectedChannel.category || globeState.selectedChannel.topicRow || globeState.selectedChannel.channelType || 'Traffic' : null}
              participants={panel.id === 'channel_topic_row' && globeState?.selectedChannel ? 
                globeState.selectedChannel.participants || 0 : null}
              candidateCount={panel.id === 'channel_topic_row' && globeState?.selectedChannel ? 
                globeState.selectedChannel.candidates?.length || 0 : null}
            >
            {/* Panel Content */}
            <div style={{ height: '100%', width: '100%', overflow: 'hidden', padding: 0 }}>
              {renderPanelContent(panel)}
            </div>
            {/* Close Button in header handled by DragDropContainer or panel content */}
          </DragDropContainer>
        );
      })}


    </div>
  );
};

// Main WorkspaceLayout component
const WorkspaceLayout = ({ enhancedFeaturesStatus, hideGlobe = false, showGlobe = true }) => {
  return (
    <ErrorBoundary>
              <WorkspaceLayoutContent enhancedFeaturesStatus={enhancedFeaturesStatus} hideGlobe={hideGlobe} showGlobe={showGlobe} />
    </ErrorBoundary>
  );
};

export default WorkspaceLayout;
