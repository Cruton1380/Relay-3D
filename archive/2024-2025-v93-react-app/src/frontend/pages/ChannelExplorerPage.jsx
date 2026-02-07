import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Globe, 
  MapPin, 
  Play, 
  X, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  MessageCircle
} from 'lucide-react';
import './ChannelExplorerPage.css';
import authoritativeVoteAPI from '../services/authoritativeVoteAPI';
import LocationPermissionDialog from '../components/voting/LocationPermissionDialog';

const ChannelExplorerPage = () => {
  const navigate = useNavigate();
  const [topicRows, setTopicRows] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load user votes from localStorage on initialization
  const loadUserVotesFromStorage = () => {
    try {
      const stored = localStorage.getItem('relay_user_votes');
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Error loading user votes from localStorage:', error);
    }
    return new Map();
  };
  
  const [userVotes, setUserVotes] = useState(loadUserVotesFromStorage());
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    scope: 'all',
    reliability: 0,
    minVotes: 0
  });
  
  // New state for enhanced features
  const [expandedChannel, setExpandedChannel] = useState(null);
  const [showParameterSettings, setShowParameterSettings] = useState(null);
  const [showGlobeView, setShowGlobeView] = useState(null);
  
  // 📍 Phase 1: Location tracking state
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [pendingVote, setPendingVote] = useState(null);
  const [showTimelineView, setShowTimelineView] = useState(null);
  const [activeChannelTab, setActiveChannelTab] = useState('overview');

  useEffect(() => {
    loadTopicRowsData();
    
    // Real-time updates via WebSocket
    const ws = new WebSocket('ws://localhost:3002');
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      if (update.type === 'ranking_update') {
        updateChannelRankings(update.data);
      }
    };
    
    return () => ws.close();
  }, []);

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setExpandedChannel(null);
        setShowParameterSettings(null);
        setShowGlobeView(null);
        setShowTimelineView(null);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const loadTopicRowsData = async () => {
    try {
      // Generate comprehensive mock data based on backend documentation
      const mockTopicRows = generateMockTopicRows();
      setTopicRows(mockTopicRows);
      setLoading(false);
    } catch (error) {
      console.error('Error loading topic rows:', error);
      setLoading(false);
    }
  };

  const generateMockTopicRows = () => {
    const topics = [
      {
        id: 'coffee-downtown-seattle',
        name: 'Coffee Shop',
        location: 'Downtown Seattle',
        scope: 'proximity',
        totalVotes: 5847,
        reliabilityScore: 87.3,
        totalRaters: 234,
        activeChannels: 73,
        lastActivity: Date.now() - 1000 * 60 * 15,
        geographicData: generateGeographicData('proximity'),
        timelineData: generateTimelineData(),
        channels: generateChannels('coffee', 73)
      },
      {
        id: 'tech-innovation-global',
        name: 'Tech Innovation',
        location: 'Global',
        scope: 'global',
        totalVotes: 23456,
        reliabilityScore: 91.7,
        totalRaters: 892,
        activeChannels: 156,
        lastActivity: Date.now() - 1000 * 60 * 5,
        geographicData: generateGeographicData('global'),
        timelineData: generateTimelineData(),
        channels: generateChannels('tech', 156)
      },
      {
        id: 'local-governance-seattle',
        name: 'Local Governance',
        location: 'Seattle Region',
        scope: 'regional',
        totalVotes: 8934,
        reliabilityScore: 73.2,
        totalRaters: 445,
        activeChannels: 34,
        lastActivity: Date.now() - 1000 * 60 * 45,
        geographicData: generateGeographicData('regional'),
        timelineData: generateTimelineData(),
        channels: generateChannels('governance', 34)
      },
      {
        id: 'restaurant-capitol-hill',
        name: 'Restaurant',
        location: 'Capitol Hill',
        scope: 'proximity',
        totalVotes: 3234,
        reliabilityScore: 94.1,
        totalRaters: 156,
        activeChannels: 45,
        lastActivity: Date.now() - 1000 * 60 * 8,
        geographicData: generateGeographicData('proximity'),
        timelineData: generateTimelineData(),
        channels: generateChannels('restaurant', 45)
      },
      {
        id: 'fitness-wellness-regional',
        name: 'Fitness & Wellness',
        location: 'Pacific Northwest',
        scope: 'regional',
        totalVotes: 4567,
        reliabilityScore: 82.6,
        totalRaters: 203,
        activeChannels: 89,
        lastActivity: Date.now() - 1000 * 60 * 22,
        geographicData: generateGeographicData('regional'),
        timelineData: generateTimelineData(),
        channels: generateChannels('fitness', 89)
      }
    ];

    return topics;
  };

  const generateGeographicData = (channelType) => {
    const regions = [
      { region: 'North America', votes: Math.floor(Math.random() * 1000) + 500, lat: 45, lng: -100, percentage: 35 },
      { region: 'Europe', votes: Math.floor(Math.random() * 800) + 400, lat: 50, lng: 10, percentage: 25 },
      { region: 'Asia Pacific', votes: Math.floor(Math.random() * 1200) + 600, lat: 35, lng: 120, percentage: 30 },
      { region: 'South America', votes: Math.floor(Math.random() * 300) + 150, lat: -15, lng: -60, percentage: 7 },
      { region: 'Africa', votes: Math.floor(Math.random() * 200) + 100, lat: 0, lng: 20, percentage: 3 }
    ];
    
    return {
      type: 'geographic',
      data: regions,
      totalVotes: regions.reduce((sum, r) => sum + r.votes, 0)
    };
  };

  const generateTimelineData = () => {
    const timeline = [];
    const now = new Date();
    const dataPoints = 24; // 24 hours of data
    
    // Generate realistic timeline data with different user types
    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)); // Each hour
      const baseVotes = Math.floor(Math.random() * 50) + 20;
      
      timeline.push({
        timestamp: timestamp.toISOString(),
        totalVotes: baseVotes,
        activeUsers: Math.floor(baseVotes * 0.6), // 60% active users
        inactiveUsers: Math.floor(baseVotes * 0.25), // 25% inactive (with decay)
        foreignUsers: Math.floor(baseVotes * 0.1), // 10% foreign users
        localUsers: Math.floor(baseVotes * 0.05), // 5% local users
        decayWeight: 1.0 - (i * 0.02) // Weight decay over time
      });
    }
    
    return timeline;
  };

  const generateChannels = (topicType, count) => {
    const channelTemplates = {
      coffee: [
        { 
          name: 'Bean There Done That', 
          owner: 'CoffeeExpert42', 
          baseVotes: 1200, 
          description: 'Artisan coffee roastery with ethically sourced beans from 12 countries',
          content: {
            videos: ['Coffee roasting process', 'Origin farm visits', 'Brewing techniques'],
            images: ['Roastery interior', 'Bean selection', 'Customer testimonials'],
            chatroom: {
              activeUsers: 45,
              recentMessages: [
                { user: 'LatteArt_Lisa', message: 'Just tried the Ethiopian blend - amazing!', time: '2m ago' },
                { user: 'CoffeeNerd_Mike', message: 'When do you restock the Colombian?', time: '5m ago' },
                { user: 'BaristaTrainee', message: 'Love the brewing workshops!', time: '8m ago' }
              ]
            },
            newsfeed: [
              { title: 'New Ethiopian Single Origin Available', votes: 89, time: '3h ago' },
              { title: 'Coffee Cupping Event This Saturday', votes: 67, time: '1d ago' },
              { title: 'Sustainability Report: Direct Trade Impact', votes: 156, time: '3d ago' }
            ]
          }
        },
        { 
          name: 'Seattle Coffee Collective', 
          owner: 'LocalBarista', 
          baseVotes: 950, 
          description: 'Community-owned cooperative supporting local coffee farmers',
          content: {
            videos: ['Farmer cooperatives', 'Community meetings', 'Roasting collective'],
            images: ['Cooperative members', 'Fair trade certificates', 'Community events'],
            chatroom: {
              activeUsers: 38,
              recentMessages: [
                { user: 'FairTrade_Fan', message: 'Love supporting local farmers', time: '1m ago' },
                { user: 'CommunityCoffee', message: 'Next meeting is Thursday 7pm', time: '4m ago' }
              ]
            },
            newsfeed: [
              { title: 'Quarterly Farmer Payment Report', votes: 145, time: '1h ago' },
              { title: 'New Guatemalan Partnership Announced', votes: 98, time: '2d ago' }
            ]
          }
        }
      ],
      tech: [
        { 
          name: 'Seattle Tech Innovation Hub', 
          owner: 'TechLeader_Sarah', 
          baseVotes: 2340, 
          description: 'Fostering breakthrough technologies in AI, quantum computing, and biotech',
          content: {
            videos: ['AI breakthrough demos', 'Quantum computing explained', 'Biotech innovations'],
            images: ['Lab facilities', 'Research team', 'Technology prototypes'],
            chatroom: {
              activeUsers: 127,
              recentMessages: [
                { user: 'QuantumDev', message: 'New quantum algorithm shows 40% improvement', time: '30s ago' },
                { user: 'AIResearcher', message: 'Looking for beta testers for our new model', time: '2m ago' },
                { user: 'BiotechPioneer', message: 'Gene therapy results are promising', time: '5m ago' }
              ]
            },
            newsfeed: [
              { title: 'Quantum Computing Breakthrough: 1000 Qubit Processor', votes: 1205, time: '2h ago' },
              { title: 'AI Ethics Framework Released for Public Comment', votes: 856, time: '6h ago' },
              { title: 'Biotech Partnership with University of Washington', votes: 734, time: '1d ago' }
            ]
          }
        }
      ],
      governance: [
        { 
          name: 'Seattle City Council Watch', 
          owner: 'CivicEngagement_Lisa', 
          baseVotes: 890, 
          description: 'Transparent oversight of city council decisions and budget allocation',
          content: {
            videos: ['Council meeting highlights', 'Budget analysis', 'Policy explanations'],
            images: ['Meeting photos', 'Budget infographics', 'Policy documents'],
            chatroom: {
              activeUsers: 56,
              recentMessages: [
                { user: 'CivicDuty_Rob', message: 'Great analysis of the housing bill', time: '3m ago' },
                { user: 'PolicyWonk', message: 'When is the next budget hearing?', time: '7m ago' }
              ]
            },
            newsfeed: [
              { title: 'City Budget Analysis: Transportation Spending Up 15%', votes: 234, time: '4h ago' },
              { title: 'Council Vote Breakdown: Housing Affordability Measure', votes: 189, time: '1d ago' }
            ]
          }
        }
      ],
      restaurant: [
        { 
          name: 'Farm to Table Seattle', 
          owner: 'ChefMichael_Local', 
          baseVotes: 680, 
          description: 'Connecting diners with local farms through seasonal menus',
          content: {
            videos: ['Farm visits', 'Seasonal cooking', 'Chef interviews'],
            images: ['Fresh ingredients', 'Plated dishes', 'Farm partnerships'],
            chatroom: {
              activeUsers: 34,
              recentMessages: [
                { user: 'LocalFoodie', message: 'The spring menu looks incredible!', time: '2m ago' },
                { user: 'FarmFresh_Fan', message: 'Love the transparency about sourcing', time: '6m ago' }
              ]
            },
            newsfeed: [
              { title: 'Spring Menu Features Local Asparagus and Morels', votes: 156, time: '5h ago' },
              { title: 'New Partnership with Skagit Valley Farms', votes: 98, time: '2d ago' }
            ]
          }
        }
      ],
      fitness: [
        { 
          name: 'Outdoor Fitness Community', 
          owner: 'TrailRunner_Sam', 
          baseVotes: 450, 
          description: 'Hiking, rock climbing, and outdoor adventure fitness groups',
          content: {
            videos: ['Trail runs', 'Climbing techniques', 'Outdoor workouts'],
            images: ['Mountain views', 'Group activities', 'Gear reviews'],
            chatroom: {
              activeUsers: 28,
              recentMessages: [
                { user: 'MountainClimber', message: 'Rattlesnake Ledge hike this weekend?', time: '1m ago' },
                { user: 'TrailRunner_Pro', message: 'Perfect weather for trail running!', time: '4m ago' }
              ]
            },
            newsfeed: [
              { title: 'Weekly Group Hike: Mount Pilchuck Trail', votes: 89, time: '3h ago' },
              { title: 'Rock Climbing Safety Workshop This Saturday', votes: 67, time: '1d ago' }
            ]
          }
        }
      ]
    };

    const templates = channelTemplates[topicType] || channelTemplates.coffee;
    const channels = [];

    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      const variationIndex = Math.floor(i / templates.length);
      const variationFactor = Math.random() * 0.4 + 0.8;
      const voteCount = Math.floor(template.baseVotes * variationFactor * (1 + Math.random() * 0.5));
      
      channels.push({
        id: `${topicType}-channel-${i + 1}`,
        name: variationIndex > 0 ? `${template.name} ${variationIndex + 1}` : template.name,
        description: template.description,
        owner: template.owner,
        voteCount: voteCount,
        position: i + 1,
        supporters: Math.floor(voteCount * (0.7 + Math.random() * 0.3)),
        reliabilityScore: Math.round((75 + Math.random() * 20) * 100) / 100,
        trend: calculateTrendStatus(voteCount, i),
        isStabilized: i === 0 && Math.random() > 0.7,
        memberCount: Math.floor(voteCount * (2 + Math.random() * 3)),
        createdAt: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
        canVote: true,
        content: template.content,
        geographicData: generateGeographicData('proximity'),
        timelineData: generateTimelineData(),
        parameters: generateChannelParameters(),
        momentum: (Math.random() - 0.5) * 4,
        velocity: (Math.random() - 0.5) * 2,
        voteHistory: generateVoteHistory(voteCount)
      });
    }

    return channels.sort((a, b) => b.voteCount - a.voteCount).map((channel, index) => ({
      ...channel,
      position: index + 1
    }));
  };

  const generateChannelParameters = () => ({
    governance: {
      ownerControlled: ['basic.name', 'basic.description', 'moderation.rules'],
      communityVoted: ['voteDecay.parameters', 'economics.commissionRates'],
      votingRequirements: {
        stabilizationPeriod: 7, // days
        minimumParticipation: 25, // %
        consensusThreshold: 60 // %
      }
    },
    economics: {
      commissionRate: 0.5, // %
      minimumDonation: 100, // sats
      maximumDonation: 1000000, // sats
      allowAnonymous: true
    },
    content: {
      allowedTypes: ['text', 'images', 'links', 'polls'],
      characterLimits: { post: 2000, comment: 500 },
      autoModeration: true,
      communityModeration: true
    },
    participation: {
      requireInvite: false,
      requireProximity: true,
      minimumTrustScore: 0.1
    }
  });

  const calculateTrendStatus = (voteCount, position) => {
    // Calculate trend based on position and vote momentum
    const baseScore = Math.random();
    if (position <= 2 && baseScore > 0.6) return 'rising';
    if (position >= 5 && baseScore < 0.4) return 'falling';
    return 'stable';
  };

  const generateVoteHistory = (totalVotes) => {
    const history = [];
    const hours = 24;
    let cumulativeVotes = 0;
    
    for (let i = 0; i < hours; i++) {
      const hourlyVotes = Math.floor(totalVotes / hours * (0.5 + Math.random()));
      cumulativeVotes += hourlyVotes;
      history.push({
        hour: i,
        votes: hourlyVotes,
        cumulative: cumulativeVotes,
        timestamp: Date.now() - (hours - i) * 3600000
      });
    }
    
    return history;
  };

  const updateChannelRankings = (updateData) => {
    setTopicRows(prev => prev.map(topicRow => {
      if (topicRow.id === updateData.topicRowId) {
        const updatedChannels = topicRow.channels.map(channel => {
          const update = updateData.channels.find(c => c.id === channel.id);
          return update ? { ...channel, ...update } : channel;
        });
        return { ...topicRow, channels: updatedChannels.sort((a, b) => b.voteCount - a.voteCount) };
      }
      return topicRow;
    }));
  };

  const handleVote = async (topicRowId, channelId) => {
    try {
      // Optimistic UI update
      setTopicRows(prev => prev.map(topicRow => {
        if (topicRow.id === topicRowId) {
          const updatedChannels = topicRow.channels.map(channel => {
            if (channel.id === channelId) {
              return {
                ...channel,
                voteCount: channel.voteCount + 1,
                supporters: channel.supporters + 1
              };
            }
            return channel;
          });
          
          // Re-rank channels based on new vote counts
          const rankedChannels = updatedChannels
            .sort((a, b) => b.voteCount - a.voteCount)
            .map((channel, index) => ({
              ...channel,
              position: index + 1
            }));

          return {
            ...topicRow,
            channels: rankedChannels,
            totalVotes: topicRow.totalVotes + 1
          };
        }
        return topicRow;
      }));

      // Set user vote and persist to localStorage
      setUserVotes(prev => {
        const newVotes = new Map(prev.set(topicRowId, channelId));
        // Persist to localStorage
        try {
          const votesObj = Object.fromEntries(newVotes);
          localStorage.setItem('relay_user_votes', JSON.stringify(votesObj));
        } catch (error) {
          console.error('Error saving user votes to localStorage:', error);
        }
        return newVotes;
      });

      // Backend API call with blockchain integration
      try {
        // 🔗 Import crypto service for signing
        const cryptoService = await import('../services/cryptoService.js');
        
        // Generate nonce for replay protection
        const nonce = cryptoService.generateNonce();
        
        // Prepare vote data
        const voteData = {
          topicId: topicRowId,
          candidateId: channelId,
          voteType: 'support',
          timestamp: Date.now(),
          nonce
        };
        
        // Hash and sign the vote data
        const voteHash = await cryptoService.hashVoteData(voteData);
        const signature = await cryptoService.signVote(voteHash);
        const publicKey = await cryptoService.exportPublicKey();
        
        // 📍 Phase 1: Get user location with geocoding
        let geolocation = userLocation;
        if (!geolocation) {
          // Try to get location automatically
          geolocation = await authoritativeVoteAPI.getLocationWithGeocoding().catch(() => null);
          
          if (!geolocation) {
            // Show location permission dialog
            setPendingVote({ topicRowId, channelId });
            setShowLocationDialog(true);
            return; // Exit and wait for location dialog
          }
          
          // Cache location for session
          setUserLocation(geolocation);
        }
        
        const response = await fetch('/api/vote/cast', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({ 
            topicId: topicRowId, 
            candidateId: channelId, 
            voteType: 'support',
            signature,
            publicKey,
            nonce,
            location: geolocation,
            timestamp: voteData.timestamp
          })
        });

        if (!response.ok) {
          throw new Error('Vote failed');
        }

        const result = await response.json();
        
        // Update with server response (includes blockchain hash, microsharding allocation)
        if (result.success) {
          console.log('✅ Vote recorded to blockchain:', result.blockchain?.transactionHash);
          console.log('📍 Vote ID:', result.blockchain?.voteId);
          
          // Update with final server state
          updateChannelRankings({
            topicRowId,
            channels: result.updatedChannels,
            blockchainHash: result.blockchain?.transactionHash,
            voteId: result.blockchain?.voteId
          });
        }
      } catch (apiError) {
        console.warn('❌ Backend API unavailable, using local state:', apiError);
        // Keep optimistic update if backend is down
      }
        
    } catch (error) {
      console.error('Error voting:', error);
      // Revert optimistic update and persist
      setUserVotes(prev => {
        const newMap = new Map(prev);
        newMap.delete(topicRowId);
        // Persist to localStorage
        try {
          const votesObj = Object.fromEntries(newMap);
          localStorage.setItem('relay_user_votes', JSON.stringify(votesObj));
        } catch (error) {
          console.error('Error saving user votes to localStorage:', error);
        }
        return newMap;
      });
      
      // Revert vote count
      setTopicRows(prev => prev.map(topicRow => {
        if (topicRow.id === topicRowId) {
          const revertedChannels = topicRow.channels.map(channel => {
            if (channel.id === channelId) {
              return {
                ...channel,
                voteCount: Math.max(0, channel.voteCount - 1),
                supporters: Math.max(0, channel.supporters - 1)
              };
            }
            return channel;
          });
          
          return {
            ...topicRow,
            channels: revertedChannels,
            totalVotes: Math.max(0, topicRow.totalVotes - 1)
          };
        }
        return topicRow;
      }));
    }
  };

  // Get current location for geographic vote tracking
  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }),
          () => resolve(null)
        );
      } else {
        resolve(null);
      }
    });
  };

  // Generate device signature for vote verification
  const generateDeviceSignature = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    return {
      fingerprint: canvas.toDataURL(),
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  };

  const handleChannelExpand = (channel) => {
    setExpandedChannel(channel);
    setActiveChannelTab('overview');
  };

  const handleParameterSettings = (channel, e) => {
    e.stopPropagation();
    setShowParameterSettings(channel);
  };

  const handleGlobeView = (data, type = 'channel') => {
    setShowGlobeView({ data, type });
  };

  const handleTimelineView = (data, type = 'channel') => {
    setShowTimelineView({ data, type });
  };

  const handleJoinChatroom = (channelId) => {
    navigate(`/chatroom/${channelId}`);
  };

  const filteredTopicRows = topicRows.filter(row => {
    if (searchTerm && !row.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !row.location.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.scope !== 'all' && row.scope !== filters.scope) {
      return false;
    }
    if (row.reliabilityScore < filters.reliability) {
      return false;
    }
    if (row.totalVotes < filters.minVotes) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="channel-explorer-loading">
        <div className="loading-spinner"></div>
        <p>Loading democratic competitions...</p>
      </div>
    );
  }

  return (
    <div className="channel-explorer">
      {/* Header */}
      <div className="explorer-header">
        <div className="header-content">
          <h1>🏆 Live Channel Competition System</h1>
          <p>View live channel competitions with left-to-right democratic ranking</p>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="explorer-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search topics or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filters">
          <select 
            value={filters.scope} 
            onChange={(e) => setFilters(prev => ({ ...prev, scope: e.target.value }))}
            className="filter-select"
          >
            <option value="all">All Scopes</option>
            <option value="proximity">🏘️ Proximity</option>
            <option value="regional">🌍 Regional</option>
            <option value="global">🌐 Global</option>
          </select>
          
          <select 
            value={filters.reliability} 
            onChange={(e) => setFilters(prev => ({ ...prev, reliability: parseInt(e.target.value) }))}
            className="filter-select"
          >
            <option value={0}>Any Reliability</option>
            <option value={70}>70%+ Reliable</option>
            <option value={80}>80%+ Reliable</option>
            <option value={90}>90%+ Reliable</option>
          </select>
        </div>
      </div>

      {/* Global Competition Instructions */}
      <div className="global-competition-header">
        <h3>🏁 Live Channel Competition System</h3>
        <div className="competition-instructions">
          <span className="instruction-text">Vote to move channels left for higher position</span>
          <div className="position-flow">
            <span className="higher-pos">← Higher Position</span>
            <span className="flow-arrow">→</span>
            <span className="lower-pos">Lower Position →</span>
          </div>
        </div>
      </div>

      {/* Topic Rows */}
      <div className="topic-rows-container">
        <div style={{background: 'red', color: 'white', padding: '10px', margin: '10px'}}>
          DEBUG: filteredTopicRows.length = {filteredTopicRows.length}
        </div>
        {filteredTopicRows.map(topicRow => (
          <TopicRowCompetition
            key={topicRow.id}
            topicRow={topicRow}
            userVote={userVotes.get(topicRow.id)}
            onVote={handleVote}
            onChannelExpand={handleChannelExpand}
            onParameterSettings={handleParameterSettings}
            onGlobeView={handleGlobeView}
            onTimelineView={handleTimelineView}
            onJoinChatroom={handleJoinChatroom}
          />
        ))}
      </div>

      {filteredTopicRows.length === 0 && (
        <div className="no-results">
          <h3>No competitions found</h3>
          <p>Try adjusting your search terms or filters</p>
        </div>
      )}

      {/* Modals */}
      {expandedChannel && (
        <ExpandedChannelModal
          channel={expandedChannel}
          activeTab={activeChannelTab}
          onActiveTabChange={setActiveChannelTab}
          onClose={() => setExpandedChannel(null)}
          onGlobeView={handleGlobeView}
          onTimelineView={handleTimelineView}
        />
      )}

      {showParameterSettings && (
        <ParameterSettingsModal
          channel={showParameterSettings}
          onClose={() => setShowParameterSettings(null)}
        />
      )}

      {showGlobeView && (
        <GlobeViewModal
          data={showGlobeView}
          onClose={() => setShowGlobeView(null)}
        />
      )}

      {showTimelineView && (
        <TimelineViewModal
          data={showTimelineView}
          onClose={() => setShowTimelineView(null)}
        />
      )}

      {/* 📍 Phase 1: Location Permission Dialog */}
      {showLocationDialog && (
        <LocationPermissionDialog
          onLocationObtained={async (location) => {
            // Cache location for session
            setUserLocation(location);
            setShowLocationDialog(false);
            
            // Resume pending vote if exists
            if (pendingVote) {
              const { topicRowId, channelId } = pendingVote;
              setPendingVote(null);
              
              // Retry the vote with location
              await handleVote(topicRowId, channelId);
            }
          }}
          onDismiss={() => {
            setShowLocationDialog(false);
            setPendingVote(null);
          }}
        />
      )}
    </div>
  );
};

const TopicRowCompetition = ({ topicRow, userVote, onVote, onChannelExpand, onParameterSettings, onGlobeView, onTimelineView, onJoinChatroom }) => {
  console.log('TopicRowCompetition rendering with topicRow:', topicRow);
  
  const getScopeIcon = (scope) => {
    switch (scope) {
      case 'proximity': return '🏘️';
      case 'regional': return '🌍';
      case 'global': return '🌐';
      default: return '📍';
    }
  };

  const getReliabilityClass = (score) => {
    if (score >= 85) return 'reliability-high';
    if (score >= 70) return 'reliability-medium';
    return 'reliability-low';
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="topic-row">
      <div style={{background: 'yellow', color: 'black', padding: '10px', margin: '5px', border: '3px solid red'}}>
        🔍 DEBUG TopicRowCompetition: "{topicRow?.name || 'NO NAME'}" | Channels: {topicRow?.channels?.length || 0}
      </div>
      {/* Fixed Horizontal Header */}
      <div className="topic-row-header">
        <div className="topic-row-info">
          <div className="topic-title-section">
            <div className="scope-badge">
              {getScopeIcon(topicRow.scope)} {topicRow.scope}
            </div>
            <h2>{topicRow.name}</h2>
            <div className="location-info">📍 {topicRow.location}</div>
          </div>
        </div>
        
        <div className="topic-row-stats-horizontal">
          <div className="stat-card">
            <div className="stat-value">{topicRow.totalVotes.toLocaleString()}</div>
            <div className="stat-label">Total Votes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{topicRow.activeChannels}</div>
            <div className="stat-label">Candidates</div>
          </div>
          <div className="stat-card">
            <div className={`stat-value ${getReliabilityClass(topicRow.reliabilityScore)}`}>
              {topicRow.reliabilityScore}%
            </div>
            <div className="stat-label">Reliability</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatTimeAgo(topicRow.lastActivity)}</div>
            <div className="stat-label">Last Activity</div>
          </div>
        </div>

        <div className="topic-row-actions">
          <button
            onClick={() => onGlobeView(topicRow.geographicData, 'topic')}
            className="action-btn"
            title="Topic Vote Geography"
          >
            <Globe size={16} />
          </button>
          <button
            onClick={() => onTimelineView(topicRow.timelineData, 'topic')}
            className="action-btn"
            title="Topic Vote Timeline"
          >
            <Clock size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Channel Competition */}
      <div className="channel-competition">
        <div className="channels-container">
          <div className="channels-flow">
            {topicRow.channels.map((channel) => (
              <ChannelCompetitionCard
                key={channel.id}
                channel={channel}
                topicRowId={topicRow.id}
                isUserVote={userVote === channel.id}
                onVote={onVote}
                onChannelExpand={onChannelExpand}
                onParameterSettings={onParameterSettings}
                onGlobeView={onGlobeView}
                onTimelineView={onTimelineView}
                onJoinChatroom={onJoinChatroom}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChannelCompetitionCard = ({ channel, topicRowId, isUserVote, onVote, onChannelExpand, onParameterSettings, onGlobeView, onTimelineView, onJoinChatroom }) => {
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'rising': return '📈';
      case 'falling': return '📉';
      default: return '➡️';
    }
  };

  const getPositionIcon = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };

  const getReliabilityClass = (score) => {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'very-good';
    if (score >= 70) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  };

  return (
    <div 
      className={`channel-card position-${channel.position} ${isUserVote ? 'user-voted' : ''} ${channel.isStabilized ? 'stabilized' : ''}`}
      onClick={() => onChannelExpand(channel)}
    >
      {/* Compact Header with Position */}
      <div className="card-header-compact">
        <div className="position-badge">
          {getPositionIcon(channel.position)}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onParameterSettings(channel, e);
          }}
          className="settings-icon"
          title="Parameters"
        >
          <Settings size={14} />
        </button>
      </div>

      {/* Channel Identity Section */}
      <div className="channel-identity">
        <div className="channel-creator">Created by @{channel.owner}</div>
      </div>

      {/* Compact Description */}
      <div className="channel-description-compact">
        {channel.description}
      </div>

      {/* Compact Stats Grid - Show actual numbers */}
      <div className="stats-compact">
        <div className="stat-compact">
          <div className="stat-number">{channel.voteCount.toLocaleString()}</div>
          <div className="stat-label">Votes</div>
        </div>
        <div className="stat-compact">
          <div className="stat-number">{channel.supporters.toLocaleString()}</div>
          <div className="stat-label">Support</div>
        </div>
        <div className="stat-compact">
          <div className={`stat-number reliability-${getReliabilityClass(channel.reliabilityScore)}`}>
            {channel.reliabilityScore}%
          </div>
          <div className="stat-label">Trust</div>
        </div>
        <div className="stat-compact">
          <div className="stat-number">{channel.memberCount.toLocaleString()}</div>
          <div className="stat-label">Members</div>
        </div>
      </div>

      {/* Enhanced Trend Indicator with Calculation Details */}
      <div className={`trend-compact trend-${channel.trend}`}>
        {getTrendIcon(channel.trend)} {channel.trend}
        <div className="trend-details">
          M: {channel.momentum?.toFixed(1)} | V: {channel.velocity?.toFixed(1)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card-actions-compact">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote(topicRowId, channel.id);
          }}
          className={`vote-btn-compact ${isUserVote ? 'voted' : ''}`}
          disabled={!channel.canVote}
        >
          {isUserVote ? '✓ Voted' : '← Vote'}
        </button>
        
        <div className="quick-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJoinChatroom(channel.id);
            }}
            className="quick-btn chatroom-btn"
            title="Join Chatroom"
          >
            <MessageCircle size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGlobeView(channel.geographicData);
            }}
            className="quick-btn"
            title="Vote Geography"
          >
            <Globe size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTimelineView(channel.timelineData);
            }}
            className="quick-btn"
            title="Vote Timeline"
          >
            <Clock size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal Components

const ExpandedChannelModal = ({ channel, activeTab, onActiveTabChange, onClose, onGlobeView, onTimelineView }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'chatroom', label: 'Chatroom', icon: MessageCircle },
    { id: 'newsfeed', label: 'Newsfeed', icon: TrendingUp },
    { id: 'media', label: 'Media', icon: Play },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: Users }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="channel-overview">
            <div className="channel-header-expanded">
              <h2>{channel.name}</h2>
              <p className="channel-description-expanded">{channel.description}</p>
              <div className="channel-stats-expanded">
                <div className="stat-item">
                  <span className="stat-value">{channel.voteCount.toLocaleString()}</span>
                  <span className="stat-label">Votes</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">#{channel.position}</span>
                  <span className="stat-label">Rank</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{channel.reliabilityScore}%</span>
                  <span className="stat-label">Reliability</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{(channel.memberCount / 1000).toFixed(1)}k</span>
                  <span className="stat-label">Members</span>
                </div>
              </div>
            </div>
            
            <div className="channel-actions-section">
              <button
                onClick={() => onGlobeView(channel.geographicData, 'channel')}
                className="action-button"
              >
                <Globe size={20} />
                <span>Vote Origins</span>
              </button>
              <button
                onClick={() => onTimelineView(channel.timelineData, 'channel')}
                className="action-button"
              >
                <Clock size={20} />
                <span>Vote Timeline</span>
              </button>
            </div>
          </div>
        );
      
      case 'chatroom':
        return (
          <div className="channel-chatroom">
            <div className="chatroom-header">
              <h3>Live Chat</h3>
              <div className="active-users">
                <Users size={16} />
                <span>{channel.content?.chatroom?.activeUsers || 0} active</span>
              </div>
            </div>
            
            <div className="chat-messages">
              {channel.content?.chatroom?.recentMessages?.map((msg, index) => (
                <div key={index} className="chat-message">
                  <div className="message-header">
                    <span className="username">@{msg.user}</span>
                    <span className="timestamp">{msg.time}</span>
                  </div>
                  <div className="message-content">{msg.message}</div>
                </div>
              )) || (
                <div className="no-messages">No recent messages</div>
              )}
            </div>
            
            <div className="chat-input-area">
              <input
                type="text"
                placeholder="Type your message..."
                className="chat-input"
                disabled
              />
              <button className="send-button" disabled>Send</button>
            </div>
          </div>
        );
      
      case 'newsfeed':
        return (
          <div className="channel-newsfeed">
            <div className="newsfeed-header">
              <h3>Channel Newsfeed</h3>
              <button className="create-post-btn">+ New Post</button>
            </div>
            
            <div className="newsfeed-posts">
              {channel.content?.newsfeed?.map((post, index) => (
                <div key={index} className="newsfeed-post">
                  <div className="post-header">
                    <h4 className="post-title">{post.title}</h4>
                    <span className="post-time">{post.time}</span>
                  </div>
                  <div className="post-engagement">
                    <div className="vote-count">
                      <TrendingUp size={16} />
                      <span>{post.votes} votes</span>
                    </div>
                    <div className="post-actions">
                      <button className="vote-up">▲</button>
                      <button className="vote-down">▼</button>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="no-posts">No recent posts</div>
              )}
            </div>
          </div>
        );
      
      case 'media':
        return (
          <div className="channel-media">
            <div className="media-section">
              <h3>Videos</h3>
              <div className="media-grid">
                {channel.content?.videos?.map((video, index) => (
                  <div key={index} className="media-item">
                    <div className="media-thumbnail">
                      <Play size={24} />
                    </div>
                    <span className="media-title">{video}</span>
                  </div>
                )) || (
                  <div className="no-media">No videos available</div>
                )}
              </div>
            </div>
            
            <div className="media-section">
              <h3>Images</h3>
              <div className="media-grid">
                {channel.content?.images?.map((image, index) => (
                  <div key={index} className="media-item">
                    <div className="media-thumbnail">
                      <Image size={24} />
                    </div>
                    <span className="media-title">{image}</span>
                  </div>
                )) || (
                  <div className="no-media">No images available</div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'timeline':
        return (
          <div className="channel-timeline">
            <h3>Vote Timeline - User Categories</h3>
            <div className="timeline-controls">
              <label>
                <input type="checkbox" defaultChecked /> Active Users
              </label>
              <label>
                <input type="checkbox" defaultChecked /> Inactive Users
              </label>
              <label>
                <input type="checkbox" defaultChecked /> Foreign Users
              </label>
              <label>
                <input type="checkbox" defaultChecked /> Local Users
              </label>
            </div>
            <div className="timeline-graph">
              <svg width="600" height="300" viewBox="0 0 600 300">
                {/* X-axis */}
                <line x1="50" y1="250" x2="550" y2="250" stroke="#ccc" strokeWidth="1"/>
                
                {/* Y-axis */}
                <line x1="50" y1="50" x2="50" y2="250" stroke="#ccc" strokeWidth="1"/>
                
                {/* Plot timeline data */}
                {channel.timelineData?.map((point, index) => {
                  const x = 50 + (index * (500 / channel.timelineData.length));
                  const y = 250 - (point.totalVotes * 150 / Math.max(...channel.timelineData.map(p => p.totalVotes)));
                  
                  return (
                    <g key={index}>
                      {/* Total votes line */}
                      <circle cx={x} cy={y} r="3" fill="#4CAF50"/>
                      
                      {/* User type breakdown */}
                      <circle cx={x} cy={250 - (point.activeUsers * 150 / Math.max(...channel.timelineData.map(p => p.totalVotes)))} r="2" fill="#10b981"/>
                      <circle cx={x} cy={250 - (point.inactiveUsers * 150 / Math.max(...channel.timelineData.map(p => p.totalVotes)))} r="2" fill="#6b7280"/>
                      <circle cx={x} cy={250 - (point.foreignUsers * 150 / Math.max(...channel.timelineData.map(p => p.totalVotes)))} r="2" fill="#f59e0b"/>
                      <circle cx={x} cy={250 - (point.localUsers * 150 / Math.max(...channel.timelineData.map(p => p.totalVotes)))} r="2" fill="#3b82f6"/>
                      
                      {/* Time labels */}
                      {index % 4 === 0 && (
                        <text x={x} y="270" textAnchor="middle" fontSize="10" fill="#666">
                          {new Date(point.timestamp).getHours()}:00
                        </text>
                      )}
                    </g>
                  );
                })}
                
                {/* Axis labels */}
                <text x="300" y="290" textAnchor="middle" fontSize="12" fill="#333">Time (Hours)</text>
                <text x="20" y="150" textAnchor="middle" fontSize="12" fill="#333" transform="rotate(-90 20 150)">Vote Count</text>
                
                {/* Legend */}
                <g transform="translate(400, 60)">
                  <circle cx="10" cy="5" r="3" fill="#10b981"/>
                  <text x="20" y="9" fontSize="10" fill="#333">Active</text>
                  
                  <circle cx="10" cy="20" r="3" fill="#6b7280"/>
                  <text x="20" y="24" fontSize="10" fill="#333">Inactive</text>
                  
                  <circle cx="10" cy="35" r="3" fill="#f59e0b"/>
                  <text x="20" y="39" fontSize="10" fill="#333">Foreign</text>
                  
                  <circle cx="10" cy="50" r="3" fill="#3b82f6"/>
                  <text x="20" y="54" fontSize="10" fill="#333">Local</text>
                </g>
              </svg>
            </div>
            
            {/* Weight Decay Information */}
            <div className="decay-info">
              <h4>Vote Weight Decay Parameters</h4>
              <div className="decay-grid">
                <div className="decay-item">
                  <span className="decay-label">Active Users:</span>
                  <span className="decay-value">100% weight (no decay)</span>
                </div>
                <div className="decay-item">
                  <span className="decay-label">Inactive Users:</span>
                  <span className="decay-value">Linear decay over 7 days</span>
                </div>
                <div className="decay-item">
                  <span className="decay-label">Foreign Users:</span>
                  <span className="decay-value">50% weight limit</span>
                </div>
                <div className="decay-item">
                  <span className="decay-label">Local Users:</span>
                  <span className="decay-value">125% regional bonus</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'analytics':
        return (
          <div className="channel-analytics">
            <h3>Channel Analytics</h3>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Geographic Distribution</h4>
                <div className="simple-globe">
                  <div className="globe-placeholder">
                    <div className="earth-representation">🌍</div>
                    <div className="vote-markers">
                      {channel.geographicData?.data?.map((region, index) => (
                        <div key={index} className="region-marker" style={{
                          left: `${20 + index * 15}%`,
                          top: `${30 + (index % 2) * 20}%`
                        }}>
                          <div className="marker-dot" style={{
                            transform: `scale(${Math.min(region.votes / 500, 2)})`
                          }}></div>
                          <div className="marker-label">
                            {region.region}: {region.votes.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="analytics-card">
                <h4>Vote Timeline</h4>
                <div className="mini-timeline">
                  {channel.voteHistory?.slice(-12).map((point, index) => (
                    <div key={index} className="timeline-bar" style={{
                      height: `${(point.votes / Math.max(...channel.voteHistory.map(p => p.votes))) * 60}px`
                    }}></div>
                  ))}
                </div>
              </div>
              
              <div className="analytics-card">
                <h4>Engagement Rate</h4>
                <div className="metric">
                  {((channel.supporters / channel.memberCount) * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="analytics-card">
                <h4>Trend Analysis</h4>
                <div className={`trend trend-${channel.trend}`}>
                  {channel.trend === 'rising' ? '📈' : channel.trend === 'falling' ? '📉' : '➡️'}
                  {channel.trend}
                </div>
                <div className="trend-metrics">
                  <div>Momentum: {channel.momentum?.toFixed(2)}</div>
                  <div>Velocity: {channel.velocity?.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Content not available</div>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="expanded-channel-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{channel.name}</h2>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onActiveTabChange(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        
        <div className="modal-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

const ParameterSettingsModal = ({ channel, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="parameter-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Channel Parameters</h2>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="parameters-section">
            <h3>Governance Settings</h3>
            <div className="parameter-group">
              <div className="parameter-item">
                <label>Owner Controlled Parameters:</label>
                <ul>
                  {channel.parameters?.governance?.ownerControlled?.map((param, index) => (
                    <li key={index}>{param}</li>
                  ))}
                </ul>
              </div>
              <div className="parameter-item">
                <label>Community Voted Parameters:</label>
                <ul>
                  {channel.parameters?.governance?.communityVoted?.map((param, index) => (
                    <li key={index}>{param}</li>
                  ))}
                </ul>
              </div>
              <div className="parameter-item">
                <label>Voting Requirements:</label>
                <div className="voting-requirements">
                  <div>Stabilization Period: {channel.parameters?.governance?.votingRequirements?.stabilizationPeriod} days</div>
                  <div>Minimum Participation: {channel.parameters?.governance?.votingRequirements?.minimumParticipation}%</div>
                  <div>Consensus Threshold: {channel.parameters?.governance?.votingRequirements?.consensusThreshold}%</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="parameters-section">
            <h3>Economic Settings</h3>
            <div className="parameter-group">
              <div className="parameter-item">
                <label>Commission Rate:</label>
                <span>{channel.parameters?.economics?.commissionRate}%</span>
              </div>
              <div className="parameter-item">
                <label>Donation Range:</label>
                <span>{channel.parameters?.economics?.minimumDonation} - {channel.parameters?.economics?.maximumDonation?.toLocaleString()} sats</span>
              </div>
              <div className="parameter-item">
                <label>Anonymous Donations:</label>
                <span>{channel.parameters?.economics?.allowAnonymous ? 'Allowed' : 'Not Allowed'}</span>
              </div>
            </div>
          </div>
          
          <div className="parameters-section">
            <h3>Content & Moderation</h3>
            <div className="parameter-group">
              <div className="parameter-item">
                <label>Allowed Content Types:</label>
                <ul>
                  {channel.parameters?.content?.allowedTypes?.map((type, index) => (
                    <li key={index}>{type}</li>
                  ))}
                </ul>
              </div>
              <div className="parameter-item">
                <label>Character Limits:</label>
                <div>Posts: {channel.parameters?.content?.characterLimits?.post}, Comments: {channel.parameters?.content?.characterLimits?.comment}</div>
              </div>
              <div className="parameter-item">
                <label>Moderation:</label>
                <div>
                  Auto: {channel.parameters?.content?.autoModeration ? 'Enabled' : 'Disabled'}, 
                  Community: {channel.parameters?.content?.communityModeration ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GlobeViewModal = ({ data, onClose }) => {
  const cesiumContainerRef = React.useRef(null);
  const viewerRef = React.useRef(null);
  const [hoveredCandidate, setHoveredCandidate] = React.useState(null);
  const [hoveredVoter, setHoveredVoter] = React.useState(null);
  const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });
  const [voters, setVoters] = React.useState([]);
  const [showVoters, setShowVoters] = React.useState(true);
  const [loadingVoters, setLoadingVoters] = React.useState(false);

  // Load voter data for visualization
  React.useEffect(() => {
    if (data.topicId) {
      loadVoterData(data.topicId);
    }
  }, [data.topicId]);

  const loadVoterData = async (topicId) => {
    setLoadingVoters(true);
    try {
      const response = await fetch(`http://localhost:3002/api/visualization/voters/${topicId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setVoters(result.voters || []);
          console.log('Loaded voter data:', result.voters);
        }
      }
    } catch (error) {
      console.error('Failed to load voter data:', error);
    } finally {
      setLoadingVoters(false);
    }
  };

  // Initialize Cesium globe when modal opens
  React.useEffect(() => {
    if (!cesiumContainerRef.current || !window.Cesium) {
      console.warn('Cesium not loaded yet');
      return;
    }

    // Create Cesium viewer
    const viewer = new window.Cesium.Viewer(cesiumContainerRef.current, {
      terrainProvider: window.Cesium.createWorldTerrain(),
      baseLayerPicker: false,
      geocoder: false,
      homeButton: true,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      vrButton: false,
      infoBox: false,
      selectionIndicator: false
    });

    viewerRef.current = viewer;

    // Render candidates on globe
    if (data.data && Array.isArray(data.data)) {
      renderCandidatesOnGlobe(viewer, data.data);
      setupHoverHandler(viewer);
    }
    
    // Render voters when data is available
    if (voters.length > 0 && showVoters) {
      renderVotersOnGlobe(viewer, voters, data.data);
    }

    // Cleanup
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, [data, voters, showVoters]);

  // Render candidates as 3D cylinders
  function renderCandidatesOnGlobe(viewer, candidates) {
    const maxVotes = Math.max(...candidates.map(c => c.votes || 0), 1);

    candidates.forEach(candidate => {
      const height = ((candidate.votes || 0) / maxVotes) * 50000;
      const lat = candidate.lat || candidate.location?.lat || 0;
      const lng = candidate.lng || candidate.location?.lng || 0;

      if (lat === 0 && lng === 0) return; // Skip invalid coords

      viewer.entities.add({
        id: candidate.id || `candidate-${Math.random()}`,
        name: candidate.name || 'Unknown',
        position: window.Cesium.Cartesian3.fromDegrees(lng, lat, height / 2),
        cylinder: {
          length: height,
          topRadius: 5000,
          bottomRadius: 5000,
          material: window.Cesium.Color.fromCssColorString(candidate.color || '#3b82f6'),
          outline: true,
          outlineColor: window.Cesium.Color.WHITE,
          outlineWidth: 2
        },
        properties: {
          type: 'candidate',
          candidateId: candidate.id,
          name: candidate.name,
          votes: candidate.votes || 0,
          country: candidate.country || 'Unknown',
          province: candidate.province || candidate.location?.province || 'Unknown',
          city: candidate.city || candidate.location?.city || 'Unknown'
        }
      });
    });

    // Fly to view all candidates
    viewer.zoomTo(viewer.entities);
  }

  // Render voters as colored dots/clusters on globe
  function renderVotersOnGlobe(viewer, voterClusters, candidates) {
    if (!voterClusters || voterClusters.length === 0) return;
    
    // Create color map for candidates
    const candidateColors = {};
    if (candidates && Array.isArray(candidates)) {
      candidates.forEach(cand => {
        candidateColors[cand.id] = cand.color || '#3b82f6';
      });
    }
    
    voterClusters.forEach(cluster => {
      // Determine cluster color based on majority candidate
      let clusterColor = '#808080'; // Default gray
      if (cluster.votesByCandidate) {
        const majorityCandidateId = Object.keys(cluster.votesByCandidate)
          .reduce((a, b) => cluster.votesByCandidate[a] > cluster.votesByCandidate[b] ? a : b);
        clusterColor = candidateColors[majorityCandidateId] || clusterColor;
      }
      
      // Scale size based on voter count
      const clusterSize = Math.min(Math.log(cluster.voterCount + 1) * 2000, 10000);
      
      viewer.entities.add({
        id: `voter-cluster-${cluster.clusterKey}`,
        name: cluster.locationName || 'Voters',
        position: window.Cesium.Cartesian3.fromDegrees(cluster.lng, cluster.lat, 0),
        point: {
          pixelSize: Math.max(6, Math.min(cluster.voterCount * 2, 20)),
          color: window.Cesium.Color.fromCssColorString(clusterColor).withAlpha(0.8),
          outlineColor: window.Cesium.Color.WHITE,
          outlineWidth: 2,
          scaleByDistance: new window.Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5)
        },
        properties: {
          type: 'voter',
          clusterKey: cluster.clusterKey,
          voterCount: cluster.voterCount,
          locationName: cluster.locationName,
          localVotes: cluster.localVotes,
          foreignVotes: cluster.foreignVotes,
          votesByCandidate: JSON.stringify(cluster.votesByCandidate),
          privacyLevel: cluster.privacyLevel
        }
      });
    });
  }

  // Setup hover handler
  function setupHoverHandler(viewer) {
    const handler = new window.Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((movement) => {
      const pickedObject = viewer.scene.pick(movement.endPosition);

      if (window.Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id;

        if (entity.properties?.type?.getValue() === 'candidate') {
          setHoveredCandidate({
            name: entity.properties.name.getValue(),
            votes: entity.properties.votes.getValue(),
            country: entity.properties.country.getValue(),
            province: entity.properties.province.getValue(),
            city: entity.properties.city.getValue()
          });
          setHoveredVoter(null);

          setTooltipPos({
            x: movement.endPosition.x + 15,
            y: movement.endPosition.y - 50
          });
        } else if (entity.properties?.type?.getValue() === 'voter') {
          setHoveredVoter({
            voterCount: entity.properties.voterCount.getValue(),
            locationName: entity.properties.locationName.getValue(),
            localVotes: entity.properties.localVotes.getValue(),
            foreignVotes: entity.properties.foreignVotes.getValue(),
            votesByCandidate: JSON.parse(entity.properties.votesByCandidate.getValue()),
            privacyLevel: entity.properties.privacyLevel.getValue()
          });
          setHoveredCandidate(null);

          setTooltipPos({
            x: movement.endPosition.x + 15,
            y: movement.endPosition.y - 50
          });
        } else {
          setHoveredCandidate(null);
          setHoveredVoter(null);
        }
      } else {
        setHoveredCandidate(null);
        setHoveredVoter(null);
      }
    }, window.Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="globe-view-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Geographic Vote Distribution</h2>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-content">
          {/* Cesium 3D Globe */}
          <div 
            ref={cesiumContainerRef}
            className="cesium-globe-container"
            style={{
              width: '100%',
              height: '600px',
              position: 'relative'
            }}
          />

          {/* Hover Tooltip */}
          {hoveredCandidate && (
            <div
              className="candidate-hover-tooltip"
              style={{
                position: 'fixed',
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
                pointerEvents: 'none',
                zIndex: 10001,
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                padding: '12px 16px',
                minWidth: '200px'
              }}
            >
              <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>
                {hoveredCandidate.name}
              </h4>
              <div style={{ fontSize: '18px', color: '#3b82f6', margin: '6px 0' }}>
                🗳️ <strong>{hoveredCandidate.votes.toLocaleString()}</strong> votes
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                📍 {hoveredCandidate.city}, {hoveredCandidate.province}
                <br />
                {hoveredCandidate.country}
              </div>
            </div>
          )}

          {/* Voter Cluster Tooltip */}
          {hoveredVoter && (
            <div
              className="voter-hover-tooltip"
              style={{
                position: 'fixed',
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
                pointerEvents: 'none',
                zIndex: 10001,
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                padding: '12px 16px',
                minWidth: '220px'
              }}
            >
              <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>
                🗳️ {hoveredVoter.voterCount} Voter{hoveredVoter.voterCount !== 1 ? 's' : ''}
              </h4>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                📍 {hoveredVoter.locationName}
              </div>
              <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                <strong>Status:</strong><br />
                🏠 Local: {hoveredVoter.localVotes} | 🌍 Foreign: {hoveredVoter.foreignVotes}
              </div>
              {Object.keys(hoveredVoter.votesByCandidate).length > 0 && (
                <div style={{ fontSize: '12px', marginTop: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '6px' }}>
                  <strong>Votes by Candidate:</strong>
                  {Object.entries(hoveredVoter.votesByCandidate).map(([candId, count]) => (
                    <div key={candId} style={{ marginLeft: '8px' }}>
                      • {count} vote{count !== 1 ? 's' : ''}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
                Privacy: {hoveredVoter.privacyLevel}
              </div>
            </div>
          )}

          {/* Toggle Voters Button */}
          <div style={{
            position: 'absolute',
            top: '80px',
            right: '20px',
            zIndex: 1000
          }}>
            <button
              onClick={() => setShowVoters(!showVoters)}
              style={{
                padding: '8px 16px',
                background: showVoters ? '#3b82f6' : '#e5e7eb',
                color: showVoters ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              {showVoters ? '👥 Hide Voters' : '👥 Show Voters'}
            </button>
            {loadingVoters && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                Loading voters...
              </div>
            )}
          </div>
          
          <div className="regional-breakdown">
            <h3>Regional Vote Breakdown</h3>
            <div className="region-list">
              {data.data?.map((region, index) => (
                <div key={index} className="region-item">
                  <div className="region-info">
                    <MapPin size={16} />
                    <span className="region-name">{region.region}</span>
                  </div>
                  <div className="region-stats">
                    <span className="vote-count">{region.votes.toLocaleString()} votes</span>
                    <span className="percentage">({region.percentage}%)</span>
                  </div>
                  <div className="vote-bar">
                    <div 
                      className="vote-fill" 
                      style={{ width: `${region.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )) || (
                <div className="no-data">No geographic data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TimelineViewModal = ({ data, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="timeline-view-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Vote Timeline</h2>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="timeline-chart">
            <div className="chart-placeholder">
              <Clock size={50} />
              <p>Timeline Chart</p>
              <p>(Interactive timeline chart would be rendered here)</p>
            </div>
          </div>
          
          <div className="timeline-data">
            <h3>Daily Vote Activity (Last 30 Days)</h3>
            <div className="timeline-list">
              {data.data?.slice(-10).map((day, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-date">
                    <Calendar size={16} />
                    <span>{new Date(day.date).toLocaleDateString()}</span>
                  </div>
                  <div className="timeline-votes">
                    <span className="vote-count">{day.votes} votes</span>
                    {day.events?.length > 0 && (
                      <div className="timeline-events">
                        {day.events.map((event, i) => (
                          <span key={i} className="event-tag">{event}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )) || (
                <div className="no-data">No timeline data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelExplorerPage;