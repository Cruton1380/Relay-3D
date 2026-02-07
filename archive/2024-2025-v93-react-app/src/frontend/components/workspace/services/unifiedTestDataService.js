/**
 * Unified Test Data Service for Base Model 1
 * Provides test data generation for development and debugging
 */

class UnifiedTestDataService {
  constructor() {
    this.channelCounter = 0;
    this.candidateCounter = 0;
    this.categories = [
      "technology",
      "community",
      "innovation",
      "research",
      "education",
      "health",
      "environment",
      "culture",
      "business",
    ];
    this.channelNames = [
      "Tech Hub",
      "Innovation Lab",
      "Community Center",
      "Research Institute",
      "Learning Hub",
      "Health Clinic",
      "Green Initiative",
      "Cultural Center",
      "Business Network",
      "Startup Space",
      "Creative Studio",
      "Science Lab",
      "Digital Hub",
      "Social Space",
      "Knowledge Center",
      "Wellness Center",
      "Eco Station",
      "Arts Center",
      "Enterprise Hub",
      "Discovery Lab",
    ];
    this.candidateNames = [
      "Alex Chen",
      "Maria Garcia",
      "James Wilson",
      "Sarah Johnson",
      "David Lee",
      "Emily Brown",
      "Michael Davis",
      "Lisa Anderson",
      "Robert Taylor",
      "Jennifer Martinez",
      "William Thompson",
      "Amanda White",
      "Christopher Rodriguez",
      "Jessica Lewis",
      "Daniel Clark",
      "Ashley Hall",
      "Matthew Young",
      "Nicole King",
      "Joshua Wright",
      "Stephanie Green",
    ];
  }

  generateChannels(count, options = {}) {
    const channels = [];
    const {
      category = "random",
      candidateCount = 3,
      voteRange = { min: 100, max: 2000 },
      channelType = "proximity",
      includeGeographicData = true,
      realisticNames = true,
    } = options;

    for (let i = 0; i < count; i++) {
      const channel = this.generateChannel({
        category,
        candidateCount,
        voteRange,
        channelType,
        includeGeographicData,
        realisticNames,
      });
      channels.push(channel);
    }

    return channels;
  }

  // Get channels for the globe (default implementation)
  async getChannels() {
    try {
      // Always fetch from backend API - no frontend-generated vote counts
      const { channelAPI } = await import("./apiClient.js");
      const response = await channelAPI.getChannels();
      console.log("🌍 GlobeCore: Fetched channels from backend:", response);

      // Ensure all vote counts come from backend, not frontend generation
      if (response && Array.isArray(response)) {
        response.forEach((channel) => {
          if (channel.candidates && Array.isArray(channel.candidates)) {
            channel.candidates.forEach((candidate) => {
              // Ensure vote count is from backend, not frontend generation
              if (typeof candidate.votes !== "number") {
                candidate.votes = 0; // Default to 0 if not set by backend
              }
            });
          }
        });
      }

      return response || [];
    } catch (error) {
      console.warn(
        "🌍 GlobeCore: Backend unavailable, returning empty array (no fallback data):",
        error.message,
      );
      // Return empty array instead of fallback data
      return [];
    }
  }

  generateChannel(options) {
    this.channelCounter++;

    const {
      category = "random",
      candidateCount = 3,
      voteRange = { min: 100, max: 2000 },
      channelType = "proximity",
      includeGeographicData = true,
      realisticNames = true,
    } = options;

    const selectedCategory =
      category === "random"
        ? this.categories[Math.floor(Math.random() * this.categories.length)]
        : category;

    const channelName = realisticNames
      ? this.channelNames[
          Math.floor(Math.random() * this.channelNames.length)
        ] +
        " " +
        this.channelCounter
      : `Test Channel ${this.channelCounter}`;

    const channel = {
      id: `channel-${this.channelCounter}`,
      name: channelName,
      category: selectedCategory,
      type: channelType,
      description: `A ${selectedCategory} channel for testing and development`,
      candidates: this.generateCandidates(candidateCount, voteRange),
      location: includeGeographicData ? this.generateLocation() : null,
      metadata: {
        created: new Date().toISOString(),
        testData: true,
        generatedBy: "unifiedTestDataService",
      },
    };

    return channel;
  }

  generateCandidates(count, voteRange) {
    const candidates = [];

    for (let i = 0; i < count; i++) {
      this.candidateCounter++;

      const candidate = {
        id: `candidate-${this.candidateCounter}`,
        name: this.candidateNames[
          Math.floor(Math.random() * this.candidateNames.length)
        ],
        votes: 0, // Start with 0 votes - let backend handle vote count generation
        description: `Test candidate ${this.candidateCounter}`,
        metadata: {
          testData: true,
          generatedBy: "unifiedTestDataService",
        },
      };

      candidates.push(candidate);
    }

    return candidates;
  }

  generateLocation() {
    // Generate realistic geographic coordinates
    const latitude = (Math.random() - 0.5) * 180; // -90 to 90
    const longitude = (Math.random() - 0.5) * 360; // -180 to 180

    return {
      latitude,
      longitude,
      altitude: Math.random() * 1000,
      accuracy: Math.random() * 10,
    };
  }

  generateTestData(type, count = 1) {
    switch (type) {
      case "channels":
        return this.generateChannels(count);
      case "candidates":
        return this.generateCandidates(count);
      case "users":
        return this.generateUsers(count);
      case "votes":
        return this.generateVotes(count);
      default:
        throw new Error(`Unknown test data type: ${type}`);
    }
  }

  generateUsers(count) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push({
        id: `user-${Date.now()}-${i}`,
        name: this.candidateNames[
          Math.floor(Math.random() * this.candidateNames.length)
        ],
        email: `test${i}@example.com`,
        joinDate: new Date().toISOString(),
        testData: true,
      });
    }
    return users;
  }

  generateVotes(count) {
    const votes = [];
    for (let i = 0; i < count; i++) {
      votes.push({
        id: `vote-${Date.now()}-${i}`,
        candidateId: `candidate-${Math.floor(Math.random() * 20) + 1}`,
        userId: `user-${Math.floor(Math.random() * 10) + 1}`,
        timestamp: new Date().toISOString(),
        value: Math.random() > 0.5 ? 1 : -1,
        testData: true,
      });
    }
    return votes;
  }

  resetCounters() {
    this.channelCounter = 0;
    this.candidateCounter = 0;
  }

  getStatus() {
    return {
      channelCounter: this.channelCounter,
      candidateCounter: this.candidateCounter,
      categories: this.categories,
      channelNames: this.channelNames,
      candidateNames: this.candidateNames,
    };
  }
}

export default new UnifiedTestDataService();
