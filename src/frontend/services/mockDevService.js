/**
 * Mock Development API Service
 * Provides mock responses when backend is unavailable
 */
class MockDevService {
  constructor() {
    this.isActive = false;
    this.skipNextDefaultRefresh = false; // Flag to prevent auto-refresh after manual generation
    this.mockData = {
      environment: {
        testMode: true,
        testData: true,
        mockMode: true,
        uiElements: true,
        deterministicVotes: false
      },
      testChannels: [
        {
          id: 'sustainable-cities',
          name: 'Make Cities More Sustainable',
          title: 'Make Cities More Sustainable',
          category: 'Environment',
          description: 'Vote on initiatives to make urban areas more environmentally sustainable',
          totalVotes: 23374, // Sum of candidate votes: 9350 + 14024 = 23374
          isActive: true,
          isTestData: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          candidates: [
            { 
              id: 'oriazoulay768', 
              name: '@oriazoulay768', 
              votes: 9350, 
              description: 'Green infrastructure and renewable energy advocate focusing on solar panels, urban gardens, and electric vehicle infrastructure.',
              user: { displayName: 'Ori Azoulay', username: 'oriazoulay768', reliability: 0.89 },
              location: { region: 'Downtown Tech District' },
              content: 'Green infrastructure and renewable energy advocate focusing on solar panels, urban gardens, and electric vehicle infrastructure.'
            },
            { 
              id: 'ronikatz228', 
              name: '@ronikatz228', 
              votes: 14024, 
              description: 'Sustainable transportation and waste reduction specialist promoting bike lanes, public transit, and zero-waste initiatives.',
              user: { displayName: 'Roni Katz', username: 'ronikatz228', reliability: 0.92 },
              location: { region: 'Green Belt Community' },
              content: 'Sustainable transportation and waste reduction specialist promoting bike lanes, public transit, and zero-waste initiatives.'
            }
          ]
        }
      ],
      chatrooms: [
        {
          id: 'dev-chat-1',
          name: 'Development Discussion',
          description: 'Main developer chat room',
          participants: 12,
          lastActivity: new Date().toISOString(),
          isActive: true
        },
        {
          id: 'test-room-1',
          name: 'Test Room Alpha',
          description: 'Testing new features',
          participants: 5,
          lastActivity: new Date().toISOString(),
          isActive: true
        }
      ]
    };
  }

  activate() {
    this.isActive = true;
    if (!this.skipNextDefaultRefresh) {
      this.refreshDefaultData(); // Ensure fresh data when activating
    } else {
      this.skipNextDefaultRefresh = false; // Reset the flag
      console.log('Mock Development Service activated - Skipping default refresh (custom channels preserved)');
    }
    console.log('Mock Development Service activated - Backend unavailable mode');
  }

  deactivate() {
    this.isActive = false;
  }

  // Mock environment management
  async setEnvironment(environment) {
    if (!this.isActive) return null;
    
    this.mockData.environment = { ...this.mockData.environment, ...environment };
    return {
      success: true,
      message: 'Environment updated (mock mode)',
      environment: this.mockData.environment
    };
  }

  async getEnvironment() {
    if (!this.isActive) return null;
    
    return {
      success: true,
      environment: this.mockData.environment
    };
  }

  // Mock test data
  async getTestData() {
    if (!this.isActive) return null;
    
    return {
      success: true,
      channels: this.mockData.testChannels,
      source: 'mock-data'
    };
  }

  // Mock channels
  async getChannels() {
    if (!this.isActive) return null;
    
    return {
      success: true,
      channels: this.mockData.testChannels
    };
  }

  // Generate channels method
  async generateChannels(count = 1, options = {}) {
    if (!this.isActive) {
      this.activate(); // Auto-activate if not active
    }
    
    const {
      candidatesPerChannel = 3,
      category = 'random',
      candidateType = 'realistic',
      preserveExisting = false
    } = options;

    console.log('🧪 MockDevService: generateChannels called with:', { count, options });
    console.log('🧪 MockDevService: Current testChannels before generation:', this.mockData.testChannels.length);
    
    const newChannels = [];
    const democraticTopics = {
      Environment: [
        'Make Cities More Sustainable',
        'Transition to Renewable Energy',
        'Reduce Carbon Emissions in Transportation',
        'Protect Local Water Resources',
        'Expand Urban Green Spaces',
        'Implement Zero Waste Programs',
        'Address Climate Change Adaptation'
      ],
      Technology: [
        'Digital Privacy Rights',
        'AI Ethics in Public Services',
        'Broadband Access for All',
        'Cybersecurity in Democracy',
        'Open Source Government Solutions',
        'Tech Innovation in Education',
        'Digital Voting Systems'
      ],
      Community: [
        'Improve Public Transportation',
        'Affordable Housing Solutions',
        'Community Safety Initiatives',
        'Support Local Businesses',
        'Neighborhood Development Planning',
        'Public Space Accessibility',
        'Cultural Preservation Programs'
      ],
      Education: [
        'Education Funding Reform',
        'Lifelong Learning Programs',
        'Skills Training for Future Jobs',
        'Early Childhood Education Access',
        'Digital Literacy Initiatives',
        'STEM Education Enhancement',
        'Adult Education Opportunities'
      ],
      Health: [
        'Universal Healthcare Access',
        'Mental Health Support Services',
        'Public Health Emergency Preparedness',
        'Healthy Food Access Programs',
        'Active Living Infrastructure',
        'Healthcare Cost Reduction',
        'Preventive Care Initiatives'
      ],
      Politics: [
        'Campaign Finance Reform',
        'Voting Rights Protection',
        'Government Transparency Measures',
        'Electoral System Improvements',
        'Civic Engagement Programs',
        'Public Participation in Policymaking',
        'Democratic Institution Strengthening'
      ],
      'Food & Dining': [
        'Local Food System Development',
        'Food Security Programs',
        'Sustainable Agriculture Support',
        'Food Waste Reduction',
        'Healthy School Meal Programs',
        'Community Gardens Initiative',
        'Fair Food Labor Practices'
      ],
      Sports: [
        'Public Recreation Facility Investment',
        'Youth Sports Program Funding',
        'Accessible Sports for All Abilities',
        'Community Fitness Initiatives',
        'Sports-Based Youth Development',
        'Professional Sports Public Funding',
        'Active Transportation Infrastructure'
      ],
      Entertainment: [
        'Arts Funding and Cultural Programs',
        'Public Library Modernization',
        'Community Events and Festivals',
        'Cultural Diversity Celebration',
        'Creative Economy Development',
        'Public Art Installations',
        'Media Literacy Education'
      ],
      Business: [
        'Small Business Support Programs',
        'Economic Development Strategies',
        'Worker Rights and Protections',
        'Innovation Hub Development',
        'Sustainable Business Practices',
        'Entrepreneurship Education',
        'Fair Trade Promotion'
      ]
    };
    
    const topicDescriptions = {
      Environment: 'Environmental sustainability and climate action initiatives',
      Technology: 'Technology policy and digital governance issues',
      Community: 'Community development and local improvement projects',
      Education: 'Educational reform and learning opportunity expansion',
      Health: 'Public health and wellness program development',
      Politics: 'Democratic processes and government reform',
      'Food & Dining': 'Food systems and nutrition policy',
      Sports: 'Recreation and physical activity promotion',
      Entertainment: 'Arts, culture, and community engagement',
      Business: 'Economic development and business policy'
    };
    
    const categories = category === 'random' ? 
      Object.keys(democraticTopics) : 
      [category];
    
    for (let i = 0; i < count; i++) {
      const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
      const availableTopics = democraticTopics[selectedCategory] || democraticTopics.Community;
      const topic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
      const channelId = `generated-${Date.now()}-${i}`;
      
      // Generate candidates based on candidatesPerChannel and candidateType
      const candidates = [];
      for (let j = 0; j < candidatesPerChannel; j++) {
        const candidateData = this.generateSimpleCandidate(j, candidateType, topic);
        candidates.push({
          id: `${channelId}-candidate-${j + 1}`,
          name: candidateData.name,
          votes: candidateData.votes,
          content: candidateData.description, // Use 'content' to match demo data format
          location: candidateData.location,
          user: { 
            displayName: candidateData.name.replace('@', ''), 
            username: candidateData.name.replace('@', ''), 
            reliability: (0.8 + Math.random() * 0.2).toFixed(2), // Format like demo data
            contributions: Math.floor(Math.random() * 500) + 100
          }
        });
      }
      
      const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
      
      const newChannel = {
        id: channelId,
        name: topic,
        title: topic,
        category: selectedCategory,
        description: topicDescriptions[selectedCategory] || 'Democratic initiative for community improvement',
        totalVotes: totalVotes,
        isActive: true,
        isTestData: true,
        reliabilityScore: Math.floor(85 + Math.random() * 15), // 85-100
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        candidates: candidates
      };
      
      newChannels.push(newChannel);
      console.log('🧪 MockDevService: Created channel:', newChannel.name);
    }

    // Handle preserveExisting option
    if (preserveExisting) {
      // Add new channels to existing ones
      this.mockData.testChannels.push(...newChannels);
      console.log('🧪 MockDevService: Added', newChannels.length, 'new channels to existing', this.mockData.testChannels.length - newChannels.length, 'channels');
    } else {
      // Replace all test channels with only the newly generated ones
      this.mockData.testChannels = newChannels;
      this.skipNextDefaultRefresh = true; // Prevent refreshDefaultData from adding back demo channels
      console.log('🧪 MockDevService: Replaced all channels with', newChannels.length, 'new channels');
    }
    
    console.log('🧪 MockDevService: Total testChannels after generation:', this.mockData.testChannels.length);
    
    return {
      success: true,
      message: `Generated ${count} test channel${count > 1 ? 's' : ''}`,
      channels: newChannels
    };
  }

  // Clear test data method
  async clearTestData() {
    if (!this.isActive) {
      this.activate();
    }
    
    // Reset to fresh default data with current timestamps
    this.refreshDefaultData();
    
    return {
      success: true,
      message: 'Cleared test data and refreshed defaults'
    };
  }

  // Refresh default data with current timestamps
  refreshDefaultData() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 86400000);
    const threeDaysAgo = new Date(now.getTime() - 259200000);
    const oneWeekAgo = new Date(now.getTime() - 604800000);

    // Preserve existing custom channels
    const existingCustomChannels = this.mockData.testChannels.filter(channel => 
      channel.id.startsWith('custom-') || !['pizza-preferences', 'tech-discussions'].includes(channel.id)
    );

    // Reset default channels with fresh data
    const defaultChannels = [
      {
        id: 'pizza-preferences',
        name: 'Pizza Preferences',
        title: 'Pizza Preferences',
        category: 'Food',
        description: 'Vote on the best pizza toppings',
        totalVotes: Math.floor(Math.random() * 1000) + 500,
        isActive: true,
        isTestData: true,
        createdAt: oneDayAgo.toISOString(),
        candidates: [
          { 
            id: 'tony', 
            name: '@pepperoni_tony', 
            votes: Math.floor(Math.random() * 200) + 100, 
            description: 'Classic pepperoni pizza advocate',
            user: { displayName: 'Tony Pepperoni', username: 'pepperoni_tony', reliability: 0.95 }
          },
          { 
            id: 'lovers', 
            name: '@meat_lovers_fan', 
            votes: Math.floor(Math.random() * 180) + 80, 
            description: 'All the meats on pizza',
            user: { displayName: 'Meat Lovers', username: 'meat_lovers_fan', reliability: 0.88 }
          },
          { 
            id: 'neapolitan', 
            name: '@authentic_pizza', 
            votes: Math.floor(Math.random() * 160) + 90, 
            description: 'Traditional Neapolitan style',
            user: { displayName: 'Authentic Pizza', username: 'authentic_pizza', reliability: 0.92 }
          }
        ]
      },
      {
        id: 'tech-discussions',
        name: 'Tech Framework Discussion',
        title: 'Tech Framework Discussion',
        category: 'Technology',
        description: 'Best JavaScript frameworks for modern web development',
        totalVotes: Math.floor(Math.random() * 800) + 300,
        isActive: true,
        isTestData: true,
        createdAt: threeDaysAgo.toISOString(),
        candidates: [
          { 
            id: 'react', 
            name: '@react_dev', 
            votes: Math.floor(Math.random() * 250) + 150, 
            description: 'React for component-based UI',
            user: { displayName: 'React Developer', username: 'react_dev', reliability: 0.94 }
          },
          { 
            id: 'vue', 
            name: '@vue_enthusiast', 
            votes: Math.floor(Math.random() * 200) + 120, 
            description: 'Vue.js progressive framework',
            user: { displayName: 'Vue Enthusiast', username: 'vue_enthusiast', reliability: 0.91 }
          },
          { 
            id: 'angular', 
            name: '@angular_expert', 
            votes: Math.floor(Math.random() * 180) + 100, 
            description: 'Angular enterprise solutions',
            user: { displayName: 'Angular Expert', username: 'angular_expert', reliability: 0.87 }
          }
        ]
      }
    ];

    // Combine default channels with preserved custom channels
    this.mockData.testChannels = [...defaultChannels, ...existingCustomChannels];

    console.log('MockDevService: Refreshed default data with current timestamps');
    console.log('MockDevService: Preserved', existingCustomChannels.length, 'custom channels');
  }

  // Mock chatrooms
  async getChatrooms() {
    if (!this.isActive) return null;
    
    return {
      success: true,
      chatrooms: this.mockData.chatrooms
    };
  }

  async generateChatroom(name, description) {
    if (!this.isActive) return null;
    
    const newRoom = {
      id: `chatroom-${Date.now()}`,
      name: name || `Test Room ${this.mockData.chatrooms.length + 1}`,
      description: description || 'Generated test chatroom',
      participants: Math.floor(Math.random() * 20),
      lastActivity: new Date().toISOString(),
      isActive: true
    };
    
    this.mockData.chatrooms.push(newRoom);
    return {
      success: true,
      message: 'Chatroom created (mock mode)',
      chatroom: newRoom
    };
  }

  // Mock votes generation
  async generateTestVotes(channel, count = 100) {
    if (!this.isActive) return null;
    
    return {
      success: true,
      message: `Generated ${count} test votes for ${channel || 'all channels'} (mock mode)`,
      votes: count
    };
  }

  // Mock blockchain data
  async getBlockchainSummary() {
    if (!this.isActive) return null;
    
    return {
      success: true,
      summary: {
        totalBlocks: 42,
        totalVotes: 8665,
        activeChannels: this.mockData.testChannels.length,
        lastBlockTime: new Date().toISOString(),
        chainIntegrity: 'valid'
      }
    };
  }

  // Generate custom channel with specific parameters
  async generateCustomChannel(config) {
    console.log('🧪 MockDevService: generateCustomChannel called with config:', config);
    
    if (!this.isActive) {
      console.log('🧪 MockDevService: Activating service');
      this.activate(); // Auto-activate if not active
    }
    
    const channelId = `custom-${Date.now()}`;
    const candidates = [];
    
    console.log('🧪 MockDevService: Generating', config.candidateCount, 'candidates');
    
    // Generate candidates based on type and theme
    for (let i = 0; i < config.candidateCount; i++) {
      const candidate = this.generateCandidate(i, config, channelId);
      candidates.push(candidate);
      if (i < 5 || i >= config.candidateCount - 3) { // Log first 5 and last 3
        console.log(`🧪 MockDevService: Generated candidate ${i + 1}:`, {
          name: candidate.name,
          description: candidate.description.substring(0, 60) + '...',
          votes: candidate.votes,
          location: candidate.location
        });
      } else if (i === 5) {
        console.log(`🧪 MockDevService: ... generating ${config.candidateCount - 8} more candidates ...`);
      }
    }
    
    // Calculate total votes
    const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
    
    const newChannel = {
      id: channelId,
      name: config.name,
      title: config.name,
      category: config.category,
      description: config.description || `Custom channel: ${config.name}`,
      totalVotes: totalVotes,
      isActive: true,
      isTestData: true,
      createdAt: new Date().toISOString(),
      candidates: candidates,
      type: 'proximity', // Default scope
      location: 'Test Environment'
    };
    
    console.log('🧪 MockDevService: Created new channel:', newChannel);
    console.log('🧪 MockDevService: Current testChannels before push:', this.mockData.testChannels.length);
    
    // Log candidate variety summary
    const uniqueNames = new Set(candidates.map(c => c.name)).size;
    const uniqueDescriptions = new Set(candidates.map(c => c.description)).size;
    const uniqueLocations = new Set(candidates.map(c => c.location)).size;
    console.log('🧪 MockDevService: Candidate variety summary:', {
      totalCandidates: candidates.length,
      uniqueNames: uniqueNames,
      uniqueDescriptions: uniqueDescriptions,
      uniqueLocations: uniqueLocations,
      duplicateNames: candidates.length - uniqueNames,
      duplicateDescriptions: candidates.length - uniqueDescriptions
    });
    
    this.mockData.testChannels.push(newChannel);
    
    console.log('🧪 MockDevService: Current testChannels after push:', this.mockData.testChannels.length);
    console.log('🧪 MockDevService: All test channels:', this.mockData.testChannels.map(c => ({ id: c.id, name: c.name })));
    
    return {
      success: true,
      message: `Created custom channel: ${config.name}`,
      channel: newChannel
    };
  }

  // Simplified candidate generator for random channel generation
  generateSimpleCandidate(index, candidateType, topicName) {
    const name = this.generateUniqueName(index, candidateType);
    const location = this.getRandomLocation();
    const votes = Math.floor(Math.random() * 500) + 100; // 100-600 votes
    
    // Generate high-quality descriptions based on the topic
    const description = this.generateTopicSpecificDescription(topicName, candidateType);
    
    return {
      name: name,
      votes: votes,
      description: description,
      location: location
    };
  }

  generateTopicSpecificDescription(topicName, candidateType) {
    const topicDescriptions = {
      'Make Cities More Sustainable': [
        'Green infrastructure and renewable energy advocate focusing on solar panels, urban gardens, and electric vehicle infrastructure.',
        'Sustainable transportation and waste reduction specialist promoting bike lanes, public transit, and zero-waste initiatives.',
        'Climate resilience expert championing carbon-neutral buildings, green roofs, and sustainable urban planning.',
        'Environmental justice advocate working on equitable access to clean air, water, and green spaces for all communities.'
      ],
      'Transition to Renewable Energy': [
        'Solar and wind energy specialist developing community-owned renewable energy projects and grid modernization.',
        'Energy efficiency consultant promoting smart home technologies, LED retrofits, and building performance standards.',
        'Clean energy policy analyst advocating for renewable energy mandates and fossil fuel divestment strategies.',
        'Grid storage and battery technology expert focusing on energy security and resilient power systems.'
      ],
      'Improve Public Transportation': [
        'Transit-oriented development planner designing walkable communities connected by efficient public transport.',
        'Bus rapid transit advocate promoting dedicated lanes, electric buses, and integrated payment systems.',
        'Rail infrastructure specialist developing light rail, metro expansions, and regional connectivity projects.',
        'Accessibility champion ensuring public transit serves elderly, disabled, and low-income community members.'
      ],
      'Digital Privacy Rights': [
        'Data protection attorney specializing in consumer privacy laws and corporate accountability measures.',
        'Cybersecurity expert advocating for encryption standards and secure communication technologies.',
        'Digital rights activist promoting transparency in algorithmic decision-making and AI governance.',
        'Privacy-by-design technologist developing user-controlled data systems and decentralized platforms.'
      ],
      'Affordable Housing Solutions': [
        'Community land trust organizer developing permanently affordable homeownership and rental opportunities.',
        'Housing finance specialist creating innovative funding mechanisms for workforce and senior housing.',
        'Anti-displacement advocate promoting tenant protections, rent stabilization, and community ownership models.',
        'Inclusive zoning expert designing mixed-income developments and fair housing enforcement strategies.'
      ],
      'Universal Healthcare Access': [
        'Community health advocate promoting neighborhood clinics, preventive care, and health equity initiatives.',
        'Healthcare financing expert developing universal coverage models and cost containment strategies.',
        'Rural health specialist expanding telemedicine, mobile clinics, and regional medical center access.',
        'Mental health integration champion connecting behavioral health services with primary care delivery.'
      ],
      'Education Funding Reform': [
        'Public education advocate promoting equitable school funding and resource distribution across districts.',
        'Early childhood education specialist expanding pre-K access and family support programming.',
        'STEM education innovator developing hands-on learning labs and career pathway partnerships.',
        'Special needs inclusion expert ensuring comprehensive support for students with disabilities.'
      ]
    };

    // Get topic-specific descriptions or use generic ones
    const specificDescriptions = topicDescriptions[topicName] || [
      'Community advocate developing comprehensive solutions through collaborative stakeholder engagement.',
      'Policy specialist promoting evidence-based approaches and sustainable implementation strategies.',
      'Grassroots organizer building coalitions for equitable and inclusive community development.',
      'Innovation expert applying technology and data-driven methods to address systemic challenges.'
    ];

    return specificDescriptions[Math.floor(Math.random() * specificDescriptions.length)];
  }

  generateCandidate(index, config, channelId) {
    // Generate unique names and descriptions for each candidate
    const name = this.generateUniqueName(index, config.candidateType);
    const description = this.generateUniqueDescription(index, config.contentTheme, config.name);
    const votes = Math.floor(Math.random() * (config.voteRangeMax - config.voteRangeMin + 1)) + config.voteRangeMin;
    const reliability = 0.7 + Math.random() * 0.3; // 70-100% reliability
    
    return {
      id: `${channelId}-candidate-${index + 1}`,
      name: name,
      votes: votes,
      description: description,
      user: {
        displayName: name.replace('@', ''),
        username: name.replace('@', ''),
        reliability: reliability
      },
      location: this.getRandomLocation(),
      trend: this.getRandomTrend(),
      isTestData: true
    };
  }

  generateUniqueName(index, type) {
    const baseNames = this.getCandidateNamesByType(type);
    
    // If we have enough base names, use them directly
    if (index < baseNames.length) {
      return baseNames[index];
    }
    
    // For additional candidates, generate variations
    const baseName = baseNames[index % baseNames.length];
    const variations = this.getNameVariations(type);
    const variation = variations[Math.floor(index / baseNames.length) % variations.length];
    
    // Create unique variations
    if (baseName.startsWith('@')) {
      const username = baseName.substring(1);
      return `@${username}_${variation}${Math.floor(index / baseNames.length) + 1}`;
    }
    
    return `${baseName}_${variation}${Math.floor(index / baseNames.length) + 1}`;
  }

  generateUniqueDescription(index, theme, channelName) {
    const baseDescriptions = this.getCandidateDescriptionsByTheme(theme, channelName);
    const descriptiveElements = this.getDescriptiveElements(theme);
    const actionWords = this.getActionWords(theme);
    
    // If we have enough base descriptions, use them directly
    if (index < baseDescriptions.length) {
      return baseDescriptions[index];
    }
    
    // Generate unique variations by combining elements
    const baseDesc = baseDescriptions[index % baseDescriptions.length];
    const element = descriptiveElements[Math.floor(index / baseDescriptions.length) % descriptiveElements.length];
    const action = actionWords[Math.floor(index / (baseDescriptions.length * descriptiveElements.length)) % actionWords.length];
    
    // Create contextual variations
    const variations = [
      `${baseDesc} with focus on ${element}`,
      `${action} ${element} through ${baseDesc.toLowerCase()}`,
      `Comprehensive ${element} strategy: ${baseDesc.toLowerCase()}`,
      `${baseDesc} emphasizing ${element} and community impact`,
      `Innovative ${element} approach via ${baseDesc.toLowerCase()}`
    ];
    
    const variationIndex = Math.floor(index / baseDescriptions.length) % variations.length;
    return variations[variationIndex];
  }

  getNameVariations(type) {
    const variations = {
      realistic: ['pro', 'advocate', 'leader', 'expert', 'voice', 'champion', 'coord', 'rep', 'speaker', 'guide'],
      tech: ['dev', 'sys', 'lab', 'hub', 'core', 'net', 'cloud', 'data', 'ai', 'code'],
      political: ['policy', 'reform', 'civic', 'public', 'demo', 'gov', 'citizen', 'vote', 'action', 'change'],
      academic: ['phd', 'research', 'study', 'analysis', 'theory', 'scholar', 'academic', 'prof', 'edu', 'learn'],
      community: ['local', 'neighbor', 'resident', 'civic', 'community', 'area', 'district', 'zone', 'block', 'street'],
      business: ['biz', 'corp', 'venture', 'market', 'trade', 'commerce', 'industry', 'finance', 'capital', 'growth'],
      creative: ['art', 'design', 'create', 'studio', 'craft', 'vision', 'inspire', 'imagine', 'express', 'innovate']
    };
    
    return variations[type] || variations.realistic;
  }

  getDescriptiveElements(theme) {
    const elements = {
      general: ['collaboration', 'innovation', 'sustainability', 'efficiency', 'transparency', 'accountability', 'accessibility', 'diversity'],
      environmental: ['renewable energy', 'carbon reduction', 'green spaces', 'waste management', 'biodiversity', 'clean air', 'water conservation', 'ecosystem protection'],
      technological: ['artificial intelligence', 'data analytics', 'digital infrastructure', 'cybersecurity', 'cloud computing', 'IoT integration', 'automation', 'digital literacy'],
      policy: ['regulatory compliance', 'stakeholder engagement', 'public consultation', 'impact assessment', 'evidence-based decisions', 'policy innovation', 'legislative reform', 'governance'],
      community: ['social cohesion', 'cultural diversity', 'local partnerships', 'volunteer engagement', 'neighborhood pride', 'inclusive participation', 'community resilience', 'social equity'],
      educational: ['skill development', 'knowledge transfer', 'capacity building', 'lifelong learning', 'digital literacy', 'career preparation', 'educational equity', 'learning innovation'],
      cultural: ['heritage preservation', 'artistic expression', 'cultural events', 'community celebration', 'cultural exchange', 'traditional knowledge', 'creative collaboration', 'cultural identity']
    };
    
    return elements[theme] || elements.general;
  }

  getActionWords(theme) {
    const actions = {
      general: ['Implementing', 'Developing', 'Advancing', 'Promoting', 'Facilitating', 'Coordinating', 'Establishing', 'Enhancing'],
      environmental: ['Protecting', 'Conserving', 'Restoring', 'Sustaining', 'Regenerating', 'Preserving', 'Greening', 'Transforming'],
      technological: ['Innovating', 'Digitalizing', 'Automating', 'Integrating', 'Optimizing', 'Modernizing', 'Streamlining', 'Upgrading'],
      policy: ['Advocating', 'Reforming', 'Regulating', 'Governing', 'Legislating', 'Reviewing', 'Analyzing', 'Recommending'],
      community: ['Building', 'Connecting', 'Engaging', 'Empowering', 'Uniting', 'Mobilizing', 'Supporting', 'Strengthening'],
      educational: ['Teaching', 'Training', 'Educating', 'Learning', 'Sharing', 'Developing', 'Mentoring', 'Guiding'],
      cultural: ['Celebrating', 'Preserving', 'Sharing', 'Expressing', 'Creating', 'Honoring', 'Showcasing', 'Cultivating']
    };
    
    return actions[theme] || actions.general;
  }

  getCandidateNamesByType(type) {
    const nameTypes = {
      realistic: [
        '@alex_chen', '@maria_garcia', '@david_kim', '@sarah_johnson', '@michael_brown',
        '@elena_rodriguez', '@james_wilson', '@priya_patel', '@robert_lee', '@amanda_davis',
        '@hassan_ali', '@jennifer_taylor', '@carlos_martinez', '@emma_thompson', '@raj_sharma',
        '@sophia_anderson', '@kevin_wong', '@aisha_johnson', '@daniel_nguyen', '@olivia_miller',
        '@luis_sanchez', '@maya_cohen', '@tyler_jackson', '@zara_ahmed', '@brandon_white'
      ],
      tech: [
        '@tech_innovator', '@code_architect', '@data_scientist', '@ai_researcher', '@dev_leader',
        '@cloud_engineer', '@security_expert', '@ux_designer', '@product_manager', '@startup_founder',
        '@ml_specialist', '@blockchain_dev', '@fullstack_dev', '@devops_engineer', '@systems_admin',
        '@frontend_guru', '@backend_expert', '@mobile_dev', '@game_developer', '@web3_builder',
        '@cyber_security', '@data_engineer', '@tech_strategist', '@innovation_lead', '@digital_architect'
      ],
      political: [
        '@policy_advocate', '@reform_leader', '@community_organizer', '@civic_engagement',
        '@public_servant', '@grassroots_leader', '@democracy_champion', '@policy_expert',
        '@voter_advocate', '@transparency_watch', '@citizen_voice', '@reform_now',
        '@public_interest', '@accountability_first', '@democratic_values', '@policy_reform',
        '@civic_duty', '@peoples_advocate', '@government_watch', '@democratic_action',
        '@public_good', '@citizen_first', '@reform_coalition', '@policy_change', '@democratic_future'
      ],
      academic: [
        '@professor_smith', '@dr_research', '@academic_leader', '@education_expert', '@scholar_jones',
        '@university_prof', '@research_lead', '@knowledge_seeker', '@study_coordinator',
        '@phd_candidate', '@research_fellow', '@academic_writer', '@education_advocate', '@learning_expert',
        '@curriculum_dev', '@educational_tech', '@knowledge_base', '@academic_innovation', '@study_group',
        '@research_center', '@education_policy', '@academic_excellence', '@learning_science', '@edu_reform'
      ],
      community: [
        '@neighborhood_lead', '@community_builder', '@local_advocate', '@volunteer_coord',
        '@civic_leader', '@resident_voice', '@community_org', '@neighborhood_watch',
        '@local_champion', '@community_first', '@neighbor_network', '@resident_council',
        '@community_action', '@local_voice', '@neighborhood_pride', '@community_care',
        '@resident_advocate', '@local_initiative', '@community_spirit', '@neighborhood_unity',
        '@local_engagement', '@community_growth', '@resident_power', '@neighborhood_strong', '@community_vision'
      ],
      business: [
        '@entrepreneur', '@business_leader', '@startup_ceo', '@industry_expert', '@venture_capital',
        '@business_dev', '@market_analyst', '@corporate_lead', '@innovation_dir',
        '@startup_founder', '@business_strategy', '@market_research', '@growth_hacker', '@sales_expert',
        '@finance_pro', '@investment_advisor', '@business_coach', '@corporate_innovation', '@market_leader',
        '@business_insights', '@revenue_growth', '@startup_mentor', '@business_vision', '@market_trends'
      ],
      creative: [
        '@artist_collective', '@creative_director', '@design_studio', '@content_creator',
        '@multimedia_artist', '@creative_lead', '@art_community', '@design_thinking',
        '@visual_artist', '@creative_writer', '@design_innovator', '@art_advocate', '@creative_space',
        '@design_lab', '@artistic_vision', '@creative_minds', '@art_education', '@design_future',
        '@creative_tech', '@art_therapy', '@design_impact', '@creative_solutions', '@artistic_expression'
      ]
    };
    
    return nameTypes[type] || nameTypes.realistic;
  }

  getCandidateDescriptionsByTheme(theme, channelName = 'this initiative') {
    const safeChannelName = (channelName || 'this initiative').toLowerCase();
    const themeDescriptions = {
      general: [
        `Comprehensive approach to ${safeChannelName} with community focus`,
        `Innovative solutions for ${safeChannelName} challenges`,
        `Collaborative strategy for ${safeChannelName} implementation`,
        `Research-based approach to ${safeChannelName}`,
        `Evidence-driven methodology for ${safeChannelName} success`,
        `Strategic planning and execution for ${safeChannelName}`,
        `Multi-stakeholder engagement in ${safeChannelName}`,
        `Sustainable long-term vision for ${safeChannelName}`,
        `Inclusive and accessible ${safeChannelName} solutions`,
        `Data-informed decision making for ${safeChannelName}`,
        `Cross-sector collaboration on ${safeChannelName}`,
        `Innovation-driven approach to ${safeChannelName}`
      ],
      environmental: [
        'Green infrastructure and renewable energy initiatives',
        'Sustainable practices with carbon footprint reduction',
        'Eco-friendly solutions and environmental conservation',
        'Climate action through community engagement',
        'Biodiversity protection and ecosystem restoration',
        'Clean energy transition and grid modernization',
        'Waste reduction and circular economy principles',
        'Water conservation and management systems',
        'Air quality improvement and pollution control',
        'Sustainable transportation and mobility solutions',
        'Green building standards and energy efficiency',
        'Climate resilience and adaptation strategies',
        'Environmental justice and equitable access',
        'Nature-based solutions and urban forestry',
        'Renewable energy microgrids and storage'
      ],
      technological: [
        'Digital innovation and smart technology integration',
        'AI-powered solutions for modern challenges',
        'Tech-enabled community platforms and tools',
        'Data-driven approach with digital transformation',
        'Cybersecurity and privacy protection systems',
        'Cloud infrastructure and scalable solutions',
        'IoT integration for smart city applications',
        'Machine learning and predictive analytics',
        'Blockchain technology for transparency',
        'Mobile-first applications and accessibility',
        'Automation and process optimization',
        'Digital equity and technology access',
        'Open source development and collaboration',
        'Edge computing and distributed systems',
        'Virtual and augmented reality applications'
      ],
      policy: [
        'Evidence-based policy recommendations',
        'Regulatory framework for sustainable change',
        'Public policy initiatives with stakeholder engagement',
        'Legislative advocacy for community benefit',
        'Policy analysis and impact assessment',
        'Regulatory compliance and oversight',
        'Public consultation and participatory governance',
        'Policy innovation and best practices',
        'Legislative reform and modernization',
        'Governance transparency and accountability',
        'Public administration efficiency',
        'Policy evaluation and continuous improvement',
        'Cross-jurisdictional coordination',
        'Regulatory sandboxes and pilot programs',
        'Policy communication and public engagement'
      ],
      community: [
        'Grassroots organizing and local empowerment',
        'Community-driven initiatives and partnerships',
        'Inclusive participation and accessibility focus',
        'Neighborhood-based solutions and engagement',
        'Social cohesion and community building',
        'Local capacity building and skill development',
        'Volunteer coordination and civic engagement',
        'Community resilience and disaster preparedness',
        'Cultural celebration and diversity appreciation',
        'Intergenerational programming and mentorship',
        'Community health and wellness initiatives',
        'Local economic development and entrepreneurship',
        'Neighborhood safety and crime prevention',
        'Community gardens and shared spaces',
        'Social services coordination and support'
      ],
      educational: [
        'Educational outreach and awareness campaigns',
        'Learning-focused approach with skill development',
        'Knowledge sharing and capacity building',
        'Training programs and educational resources',
        'Digital literacy and technology training',
        'Lifelong learning and adult education',
        'Educational equity and access initiatives',
        'STEM education and career pathways',
        'Arts education and creative expression',
        'Financial literacy and economic education',
        'Health education and wellness programs',
        'Environmental education and sustainability',
        'Civic education and democratic participation',
        'Professional development and workforce training',
        'Educational innovation and pedagogy research'
      ],
      cultural: [
        'Cultural preservation and community celebration',
        'Arts-based community building and expression',
        'Cultural events and inclusive programming',
        'Heritage conservation with modern relevance',
        'Artistic collaboration and creative partnerships',
        'Cultural education and awareness programs',
        'Traditional knowledge preservation',
        'Multicultural dialogue and understanding',
        'Creative economy and artist support',
        'Cultural tourism and community pride',
        'Public art and creative placemaking',
        'Cultural accessibility and inclusion',
        'Indigenous culture and reconciliation',
        'Digital storytelling and media arts',
        'Cultural policy and arts advocacy'
      ]
    };
    
    return themeDescriptions[theme] || themeDescriptions.general;
  }

  getRandomLocation() {
    const locations = [
      'Downtown Tech District', 'Green Belt Community', 'University Quarter',
      'Arts District', 'Riverside Neighborhood', 'Innovation Hub',
      'Historic Downtown', 'Sustainable Living Area', 'Creative Quarter',
      'Business District', 'Cultural Center', 'Waterfront Village',
      'Tech Campus', 'Education Zone', 'Community Gardens',
      'Transit Village', 'Mixed-Use Development', 'Civic Center',
      'Entertainment District', 'Medical Quarter', 'Innovation Corridor',
      'Maker District', 'Green Technology Park', 'Digital Commons',
      'Entrepreneurship Hub', 'Research Triangle', 'Smart City Zone',
      'Eco-Village', 'Urban Village', 'Knowledge District'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  getRandomTrend() {
    const trends = ['Rising', 'Stable', 'Falling', 'Surging', 'Steady', 'Declining', 'Growing', 'Leveling'];
    return trends[Math.floor(Math.random() * trends.length)];
  }
}

// Create singleton instance
export const mockDevService = new MockDevService();

// Auto-activate if we detect backend issues
let backendCheckAttempts = 0;
const checkBackendAvailability = async () => {
  try {
    await fetch('/api/dev/status');
  } catch (error) {
    backendCheckAttempts++;
    if (backendCheckAttempts >= 2) {
      mockDevService.activate();
      console.log('Backend unavailable - Mock Development Service activated');
    }
  }
};

// Check backend availability
checkBackendAvailability();

export default MockDevService;
