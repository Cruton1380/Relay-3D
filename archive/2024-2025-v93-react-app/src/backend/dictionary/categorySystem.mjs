/**
 * @fileoverview Category System for Semantic Dictionary
 * Manages the category layer for disambiguation in the word-phrase dictionary system
 */
import crypto from 'crypto';
import logger from '../utils/logging/logger.mjs';
import { eventBus } from '../../event-bus/index.mjs';

const categoryLogger = logger.child({ module: 'category-system' });

class CategorySystem {
  constructor() {
    this.categories = new Map(); // Map(categoryId -> categoryData)
    this.topicRowCategories = new Map(); // Map(topicRowName -> Map(categoryId -> voteCount))
    this.userCategoryVotes = new Map(); // Map(topicRowName -> Map(userId -> Map(categoryId -> voteType)))
    this.categoryHierarchy = new Map(); // Map(parentCategoryId -> Set(childCategoryIds))
    this.initialized = false;
  }

  /**
   * Initialize the category system
   */
  async initialize() {
    try {
      await this.loadCategoryData();
      this.setupEventHandlers();
      this.initialized = true;
      categoryLogger.info('Category System initialized');
    } catch (error) {
      categoryLogger.error('Failed to initialize category system', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    eventBus.on('topic-row:created', this.handleTopicRowCreated.bind(this));
    eventBus.on('topic-row:channel-added', this.handleChannelAdded.bind(this));
    eventBus.on('category:proposed', this.handleCategoryProposed.bind(this));
  }

  /**
   * Create a new category
   * @param {string} name - Category name
   * @param {string} description - Category description
   * @param {string} parentCategoryId - Optional parent category ID for hierarchy
   * @param {Object} metadata - Additional category metadata
   */
  async createCategory(name, description, parentCategoryId = null, metadata = {}) {
    if (!this.initialized) {
      throw new Error('Category system not initialized');
    }
    
    return this._createCategoryInternal(name, description, parentCategoryId, metadata);
  }

  /**
   * Internal method to create categories (used during initialization and after)
   * @private
   */
  async _createCategoryInternal(name, description, parentCategoryId = null, metadata = {}) {

    const normalizedName = name.toLowerCase().trim();
    
    // Check for existing category with same name
    for (const [id, category] of this.categories.entries()) {
      if (category.normalizedName === normalizedName) {
        return category;
      }
    }

    const categoryId = `cat_${crypto.randomBytes(8).toString('hex')}`;
    
    const category = {
      id: categoryId,
      name,
      normalizedName,
      description,
      parentCategoryId,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      voteCount: 0,
      usageCount: 0,
      metadata: {
        icon: metadata.icon || null,
        color: metadata.color || '#3498db',
        tags: metadata.tags || [],
        ...metadata
      }
    };

    this.categories.set(categoryId, category);

    // Add to hierarchy if parent exists
    if (parentCategoryId && this.categories.has(parentCategoryId)) {
      if (!this.categoryHierarchy.has(parentCategoryId)) {
        this.categoryHierarchy.set(parentCategoryId, new Set());
      }
      this.categoryHierarchy.get(parentCategoryId).add(categoryId);
    }

    categoryLogger.info('Created category', { categoryId, name });
    
    eventBus.emit('category:created', { categoryId, category });
    
    return category;
  }

  /**
   * Get a category by ID
   * @param {string} categoryId - Category ID
   */
  getCategory(categoryId) {
    return this.categories.get(categoryId);
  }

  /**
   * Get all top-level categories
   * @returns {Array} List of top-level categories
   */
  getTopLevelCategories() {
    return Array.from(this.categories.values())
      .filter(category => !category.parentCategoryId)
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Get child categories of a parent category
   * @param {string} parentCategoryId - Parent category ID
   * @returns {Array} List of child categories
   */
  getChildCategories(parentCategoryId) {
    const childIds = this.categoryHierarchy.get(parentCategoryId) || new Set();
    return Array.from(childIds)
      .map(id => this.categories.get(id))
      .filter(Boolean)
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Associate a category with a topic row
   * @param {string} topicRowName - Topic row name
   * @param {string} categoryId - Category ID
   * @param {boolean} initialAssociation - Whether this is the initial category suggestion
   */
  async associateTopicRowWithCategory(topicRowName, categoryId, initialAssociation = false) {
    if (!this.initialized) {
      throw new Error('Category system not initialized');
    }

    if (!this.categories.has(categoryId)) {
      throw new Error('Category not found');
    }

    const normalizedTopicRow = topicRowName.toLowerCase().trim();
    
    // Initialize topic row category tracking if needed
    if (!this.topicRowCategories.has(normalizedTopicRow)) {
      this.topicRowCategories.set(normalizedTopicRow, new Map());
    }

    const topicRowCats = this.topicRowCategories.get(normalizedTopicRow);
    
    // Initial association starts with 1 vote, otherwise it's tracked by explicit votes
    if (initialAssociation) {
      topicRowCats.set(categoryId, topicRowCats.get(categoryId) || 0 + 1);
    }

    // Update usage count for category
    const category = this.categories.get(categoryId);
    category.usageCount++;
    
    categoryLogger.info('Associated topic row with category', { 
      topicRow: normalizedTopicRow, 
      categoryId,
      categoryName: category.name 
    });
    
    eventBus.emit('topic-row:category-associated', { 
      topicRowName: normalizedTopicRow, 
      categoryId,
      initialAssociation
    });
    
    return true;
  }

  /**
   * Vote on a category for a topic row
   * @param {string} topicRowName - Topic row name
   * @param {string} userId - User ID
   * @param {string} categoryId - Category ID
   * @param {boolean} upvote - Whether to upvote (true) or downvote (false)
   */
  async voteOnTopicRowCategory(topicRowName, userId, categoryId, upvote = true) {
    if (!this.initialized) {
      throw new Error('Category system not initialized');
    }

    if (!this.categories.has(categoryId)) {
      throw new Error('Category not found');
    }

    const normalizedTopicRow = topicRowName.toLowerCase().trim();
    
    // Initialize user vote tracking for this topic row if needed
    if (!this.userCategoryVotes.has(normalizedTopicRow)) {
      this.userCategoryVotes.set(normalizedTopicRow, new Map());
    }
    
    const topicRowUserVotes = this.userCategoryVotes.get(normalizedTopicRow);
    
    // Initialize user's votes for this topic row if needed
    if (!topicRowUserVotes.has(userId)) {
      topicRowUserVotes.set(userId, new Map());
    }
    
    const userVotes = topicRowUserVotes.get(userId);
    const previousVote = userVotes.get(categoryId);
    
    // Initialize topic row category tracking if needed
    if (!this.topicRowCategories.has(normalizedTopicRow)) {
      this.topicRowCategories.set(normalizedTopicRow, new Map());
    }
    
    const topicRowCats = this.topicRowCategories.get(normalizedTopicRow);
    
    // Get current vote count
    const currentVotes = topicRowCats.get(categoryId) || 0;
    
    // Apply vote logic
    if (previousVote === undefined) {
      // New vote
      userVotes.set(categoryId, upvote);
      topicRowCats.set(categoryId, currentVotes + (upvote ? 1 : -1));
    } else if (previousVote === upvote) {
      // Removing vote
      userVotes.delete(categoryId);
      topicRowCats.set(categoryId, currentVotes + (upvote ? -1 : 1));
    } else {
      // Changing vote
      userVotes.set(categoryId, upvote);
      topicRowCats.set(categoryId, currentVotes + (upvote ? 2 : -2));
    }
    
    categoryLogger.info('User voted on topic row category', { 
      topicRow: normalizedTopicRow,
      categoryId,
      userId: userId.substring(0, 8),
      upvote
    });
    
    // Update category's overall vote count
    const category = this.categories.get(categoryId);
    category.voteCount = Array.from(this.topicRowCategories.values())
      .reduce((sum, catMap) => sum + (catMap.get(categoryId) || 0), 0);
    category.lastUpdated = Date.now();
    
    eventBus.emit('topic-row:category-vote', { 
      topicRowName: normalizedTopicRow,
      categoryId,
      userId,
      upvote,
      newCount: topicRowCats.get(categoryId)
    });
    
    return this.getTopicRowCategories(normalizedTopicRow);
  }

  /**
   * Get categories for a topic row, ordered by vote count
   * @param {string} topicRowName - Topic row name
   * @param {number} limit - Optional limit to number of categories returned
   * @returns {Array} Ordered list of categories with vote counts
   */
  getTopicRowCategories(topicRowName, limit = 0) {
    const normalizedTopicRow = topicRowName.toLowerCase().trim();
    const categoryVotes = this.topicRowCategories.get(normalizedTopicRow) || new Map();
    
    // Convert to array and sort by votes
    let categories = Array.from(categoryVotes.entries())
      .filter(([_, votes]) => votes > 0) // Only include categories with positive votes
      .map(([categoryId, votes]) => ({
        category: this.categories.get(categoryId),
        votes,
        percentage: 0 // Will calculate after filtering
      }))
      .filter(item => item.category); // Filter out any null categories
    
    // Calculate vote percentages
    const totalVotes = categories.reduce((sum, item) => sum + item.votes, 0);
    categories = categories.map(item => ({
      ...item,
      percentage: totalVotes > 0 ? Math.round((item.votes / totalVotes) * 100) : 0
    }));
    
    // Sort by votes descending
    categories.sort((a, b) => b.votes - a.votes);
    
    // Apply limit if specified
    if (limit > 0 && categories.length > limit) {
      categories = categories.slice(0, limit);
    }
    
    return {
      categories,
      totalVotes,
      topicRowName: normalizedTopicRow
    };
  }

  /**
   * Get the top ranked global categories
   * @param {number} limit - Number of categories to return
   * @returns {Array} Top categories by usage
   */
  getTopGlobalCategories(limit = 10) {
    return Array.from(this.categories.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Search for categories by name
   * @param {string} query - Search query
   * @param {number} limit - Number of results to return
   */
  searchCategories(query, limit = 20) {
    const normalizedQuery = query.toLowerCase().trim();
    
    return Array.from(this.categories.values())
      .filter(category => category.normalizedName.includes(normalizedQuery))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }
  /**
   * Handle topic row creation event
   * @private
   */
  async handleTopicRowCreated(event) {
    const { topicRowName } = event;
    categoryLogger.debug('Received topic row creation event', { topicRowName });
    
    // Initialize empty category mapping for new topic row
    const normalizedName = topicRowName.toLowerCase().trim();
    this.topicRowCategories.set(normalizedName, new Map());
    
    // Suggest initial categories based on topic row name
    const suggestedCategories = await this.suggestCategoriesForTerm(normalizedName);
    
    // Associate suggested categories with the topic row
    if (suggestedCategories && suggestedCategories.length > 0) {
      for (const categoryId of suggestedCategories) {
        await this.associateTopicRowWithCategory(normalizedName, categoryId, true);
      }
      
      categoryLogger.info('Added initial categories to topic row', { 
        topicRow: normalizedName,
        categories: suggestedCategories.length
      });
    }
    
    return {
      topicRowName: normalizedName,
      categoriesAdded: suggestedCategories ? suggestedCategories.length : 0
    };
  }

  /**
   * Handle channel added to topic row event
   * @private
   */
  handleChannelAdded(event) {
    const { topicRowName, channelData } = event;
    
    // Check if channel has category metadata
    if (channelData?.metadata?.category) {
      const categoryName = channelData.metadata.category;
      
      // Attempt to find existing category
      let categoryId = null;
      for (const [id, category] of this.categories.entries()) {
        if (category.normalizedName === categoryName.toLowerCase().trim()) {
          categoryId = id;
          break;
        }
      }
      
      // Create category if it doesn't exist
      if (!categoryId) {
        this.createCategory(categoryName, `Category for ${categoryName}`)
          .then(newCategory => {
            this.associateTopicRowWithCategory(
              topicRowName,
              newCategory.id,
              true
            );
          });
      } else {
        this.associateTopicRowWithCategory(topicRowName, categoryId, true);
      }
    }
  }

  /**
   * Handle category proposal event
   * @private
   */
  handleCategoryProposed(event) {
    const { name, description, parentCategoryId, metadata } = event;
    this.createCategory(name, description, parentCategoryId, metadata);
  }

  /**
   * Load category data from storage
   * @private
   */
  async loadCategoryData() {
    // In a real implementation, this would load from persistent storage
    // Initializing with basic categories
    
    // Create base categories
    const generalCat = await this._createCategoryInternal('General', 'General purpose definitions');
    const scienceCat = await this._createCategoryInternal('Science', 'Scientific terms and concepts');
    const techCat = await this._createCategoryInternal('Technology', 'Technology-related terms');
    const artsCat = await this._createCategoryInternal('Arts & Culture', 'Arts, media, and cultural terms');
    const politicsCat = await this._createCategoryInternal('Politics', 'Political concepts and terms');
    const businessCat = await this._createCategoryInternal('Business', 'Business and economic terms');
    const slangCat = await this._createCategoryInternal('Slang', 'Colloquial and informal language');
    
    // Create some subcategories
    await this._createCategoryInternal('Physics', 'Physics concepts and terminology', scienceCat.id);
    await this._createCategoryInternal('Biology', 'Biological concepts and terminology', scienceCat.id);
    await this._createCategoryInternal('Programming', 'Programming languages and concepts', techCat.id);
    await this._createCategoryInternal('Cybersecurity', 'Security concepts and terminology', techCat.id);
    await this._createCategoryInternal('Visual Arts', 'Painting, sculpture, and visual media', artsCat.id);
    await this._createCategoryInternal('Music', 'Musical concepts and terminology', artsCat.id);
    await this._createCategoryInternal('Film', 'Film and cinema concepts', artsCat.id);
    
    categoryLogger.info('Loaded base categories', { 
      count: this.categories.size 
    });
  }

  /**
   * Get categories assigned to a topic row
   * @param {string} topicRowName - Name of the topic row
   * @returns {Array} Array of category objects with vote counts
   */
  async getCategoriesForTopicRow(topicRowName) {
    const normalizedTopicRow = topicRowName.toLowerCase().trim();
    const categoryVotes = this.topicRowCategories.get(normalizedTopicRow);
    
    if (!categoryVotes) {
      return [];
    }
    
    // Convert to array of categories with vote counts
    return Array.from(categoryVotes.entries())
      .filter(([_, votes]) => votes > 0)
      .map(([categoryId, voteCount]) => {
        const category = this.categories.get(categoryId);
        return {
          ...category,
          voteCount
        };
      })
      .sort((a, b) => b.voteCount - a.voteCount);
  }
  /**
   * Vote for a category on a topic row
   * @param {string} topicRowName - Name of the topic row
   * @param {string} userId - ID of the user voting
   * @param {string} categoryId - ID of the category to vote for
   * @param {string} voteType - Type of vote ('upvote' by default)
   * @returns {Promise<Object>} Updated vote information
   */
  async voteForCategory(topicRowName, userId, categoryId, voteType = 'upvote') {
    if (!this.initialized) {
      throw new Error('Category system not initialized');
    }

    if (!this.categories.has(categoryId)) {
      throw new Error('Category not found');
    }

    const normalizedTopicRow = topicRowName.toLowerCase().trim();
    
    // Initialize user vote tracking for this topic row if needed
    if (!this.userCategoryVotes.has(normalizedTopicRow)) {
      this.userCategoryVotes.set(normalizedTopicRow, new Map());
    }
    
    const topicRowUserVotes = this.userCategoryVotes.get(normalizedTopicRow);
    
    // Initialize user's votes for this topic row if needed
    if (!topicRowUserVotes.has(userId)) {
      topicRowUserVotes.set(userId, new Map());
    }
    
    const userVotes = topicRowUserVotes.get(userId);
    const previousVote = userVotes.get(categoryId);
    
    // Initialize topic row category tracking if needed
    if (!this.topicRowCategories.has(normalizedTopicRow)) {
      this.topicRowCategories.set(normalizedTopicRow, new Map());
    }
    
    const topicRowCats = this.topicRowCategories.get(normalizedTopicRow);
    
    // Get current vote count
    const currentVotes = topicRowCats.get(categoryId) || 0;
      // The test expects that when a user votes for a new category, 
    // their vote is removed from the previous category.
    // First, check if user has voted for any category already in this topic row
    for (const [existingCategoryId, existingVoteType] of userVotes.entries()) {
      if (existingCategoryId !== categoryId) {
        // Remove vote from other categories
        userVotes.delete(existingCategoryId);
        const existingCategoryVotes = topicRowCats.get(existingCategoryId) || 0;
        topicRowCats.set(existingCategoryId, Math.max(0, existingCategoryVotes - 1));
      }
    }
    
    // Add the new vote
    userVotes.set(categoryId, voteType);
    topicRowCats.set(categoryId, currentVotes + 1);
    
    // Update category's overall vote count
    const category = this.categories.get(categoryId);
    category.voteCount = Array.from(this.topicRowCategories.values())
      .reduce((sum, catMap) => sum + (catMap.get(categoryId) || 0), 0);
    category.lastUpdated = Date.now();
    
    categoryLogger.info('User voted on category', { 
      topicRow: normalizedTopicRow,
      categoryId,
      userId: userId.substring(0, 8),
      voteType
    });
    
    eventBus.emit('topic-row:category-vote', { 
      topicRowName: normalizedTopicRow,
      categoryId,
      userId,
      voteType,
      newCount: topicRowCats.get(categoryId)
    });
    
    return {
      topicRow: normalizedTopicRow,
      category: this.categories.get(categoryId),
      voteCount: topicRowCats.get(categoryId)
    };
  }

  /**
   * Suggest categories for a term based on semantic similarity
   * @param {string} term - The term to suggest categories for
   * @returns {Promise<Array>} Array of suggested category IDs
   */
  async suggestCategoriesForTerm(term) {
    // In a real implementation, this would use semantic matching
    // For simplicity, we'll return some default categories based on simple rules
    const normalizedTerm = term.toLowerCase().trim();
    
    // Simple rule-based category suggestions
    const suggestions = [];
    
    // Tech terms
    if (normalizedTerm.includes('computer') || 
        normalizedTerm.includes('software') || 
        normalizedTerm.includes('hardware') ||
        normalizedTerm.includes('programming') ||
        normalizedTerm.includes('code') ||
        normalizedTerm.includes('algorithm') ||
        normalizedTerm.includes('data') ||
        normalizedTerm.includes('ai') ||
        normalizedTerm.includes('machine learning') ||
        normalizedTerm.includes('artificial intelligence')) {
      
      // Find technology categories
      for (const [id, category] of this.categories.entries()) {
        if (category.name === 'Technology' || 
            (category.parentCategoryId && 
             this.categories.get(category.parentCategoryId)?.name === 'Technology')) {
          suggestions.push(id);
        }
      }
    }
    
    // Science terms
    if (normalizedTerm.includes('science') || 
        normalizedTerm.includes('physics') || 
        normalizedTerm.includes('biology') ||
        normalizedTerm.includes('chemistry') ||
        normalizedTerm.includes('theory') ||
        normalizedTerm.includes('experiment')) {
      
      // Find science categories
      for (const [id, category] of this.categories.entries()) {
        if (category.name === 'Science' || 
            (category.parentCategoryId && 
             this.categories.get(category.parentCategoryId)?.name === 'Science')) {
          suggestions.push(id);
        }
      }
    }
    
    // If we couldn't suggest anything specific, return general category
    if (suggestions.length === 0) {
      for (const [id, category] of this.categories.entries()) {
        if (category.name === 'General') {
          suggestions.push(id);
          break;
        }
      }
    }
    
    return suggestions;
  }
}

const categorySystem = new CategorySystem();
export default categorySystem;
