/**
 * @fileoverview Dictionary API Controller
 * Handles API endpoints for the semantic dictionary system
 */
import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import auth from '../middleware/auth.mjs';
import dictionaryTextParser from '../dictionary/dictionaryTextParser.mjs';
import categorySystem from '../dictionary/categorySystem.mjs';
import dictionarySearchService from '../dictionary/dictionarySearchService.mjs';
import topicRowVoteManager from '../channel-service/topicRowVoteManager.mjs';
import logger from '../utils/logging/logger.mjs';
import { eventBus } from '../event-bus/index.mjs';

const dictionaryLogger = logger.child({ module: 'dictionary-api' });
const router = express.Router();

/**
 * Parse text and identify dictionary terms
 * POST /api/dictionary/parse
 */
router.post('/parse', 
  auth.requireAuth,
  [
    body('text').isString().notEmpty().withMessage('Text content is required'),
    body('options').optional().isObject()
  ],  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.body || !req.body.text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    try {
      const { text, options = {} } = req.body;
      const userId = req.user.id;
      
      const result = await dictionaryTextParser.parseText(text, userId, options);
      
      dictionaryLogger.info('Text parsed for dictionary terms', {
        userId: userId.substring(0, 8),
        contentLength: text.length,
        entityCount: result.entities.length
      });
      
      return res.json(result);
    } catch (error) {
      dictionaryLogger.error('Error parsing text', {
        error: error.message,
        userId: req.user.id.substring(0, 8)
      });
      return res.status(500).json({ error: 'Failed to parse text' });
    }
  }
);

/**
 * Get information about a dictionary term
 * GET /api/dictionary/term/:term
 */
router.get('/term/:term',
  [
    param('term').isString().notEmpty().withMessage('Term is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }    try {
      const { term } = req.params;
      const category = req.query.category;
      
      const result = await dictionarySearchService.getTerm(term, category);
      
      if (!result) {
        return res.status(404).json({ error: 'Term not found', term });
      }
      
      dictionaryLogger.info('Term information requested', {
        term,
        category,
        userId: req.user?.id ? req.user.id.substring(0, 8) : 'anonymous'
      });
      
      return res.json(result);
    } catch (error) {
      dictionaryLogger.error('Error getting term information', {
        term: req.params.term,
        error: error.message
      });
      return res.status(500).json({ error: 'Failed to get term information' });
    }
  }
);

/**
 * Set user preference for term meaning
 * POST /api/dictionary/preference
 */
router.post('/preference',
  auth.requireAuth,
  [
    body('term').isString().notEmpty().withMessage('Term is required'),
    body('topicRowName').isString().notEmpty().withMessage('Topic row name is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { term, topicRowName } = req.body;
      const userId = req.user.id;
      
      const result = dictionaryTextParser.setUserTermPreference(userId, term, topicRowName);
      
      dictionaryLogger.info('User term preference set', {
        userId: userId.substring(0, 8),
        term,
        topicRow: topicRowName
      });
      
      // Emit event for real-time updates
      eventBus.emit('dictionary:override-set', {
        userId,
        term,
        topicRowName
      });
      
      return res.json({ success: result, term, topicRowName });
    } catch (error) {
      dictionaryLogger.error('Error setting term preference', {
        error: error.message,
        userId: req.user.id.substring(0, 8)
      });
      return res.status(500).json({ error: 'Failed to set term preference' });
    }
  }
);

/**
 * Clear user preference for term meaning
 * DELETE /api/dictionary/preference/:term
 */
router.delete('/preference/:term',
  auth.requireAuth,
  [
    param('term').isString().notEmpty().withMessage('Term is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { term } = req.params;
      const userId = req.user.id;
      
      const result = dictionaryTextParser.clearUserTermPreference(userId, term);
      
      dictionaryLogger.info('User term preference cleared', {
        userId: userId.substring(0, 8),
        term
      });
      
      // Emit event for real-time updates
      eventBus.emit('dictionary:override-set', {
        userId,
        term,
        topicRowName: null
      });
      
      return res.json({ success: result, term });
    } catch (error) {
      dictionaryLogger.error('Error clearing term preference', {
        error: error.message,
        userId: req.user.id.substring(0, 8)
      });
      return res.status(500).json({ error: 'Failed to clear term preference' });
    }
  }
);

/**
 * Get all user preferences
 * GET /api/dictionary/preferences
 */
router.get('/preferences',
  auth.requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const preferences = dictionaryTextParser.getUserPreferences(userId);
      
      dictionaryLogger.info('User preferences requested', {
        userId: userId.substring(0, 8),
        count: preferences.count
      });
      
      return res.json(preferences);
    } catch (error) {
      dictionaryLogger.error('Error getting user preferences', {
        error: error.message,
        userId: req.user.id.substring(0, 8)
      });
      return res.status(500).json({ error: 'Failed to get user preferences' });
    }
  }
);

/**
 * Register a multi-word phrase
 * POST /api/dictionary/phrase
 */
router.post('/phrase',
  auth.requireAuth,
  [
    body('phrase').isString().notEmpty().withMessage('Phrase is required').custom(value => {
      if (!value.includes(' ')) {
        throw new Error('Phrase must contain multiple words');
      }
      return true;
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { phrase } = req.body;
      const userId = req.user.id;
      
      const result = dictionaryTextParser.registerPhrase(phrase);
      
      dictionaryLogger.info('Multi-word phrase registered', {
        userId: userId.substring(0, 8),
        phrase
      });
      
      // Emit event for real-time updates
      eventBus.emit('dictionary:phrase-defined', {
        userId,
        phrase
      });
      
      return res.json({ success: result, phrase });
    } catch (error) {
      dictionaryLogger.error('Error registering phrase', {
        error: error.message,
        userId: req.user.id.substring(0, 8)
      });
      return res.status(500).json({ error: 'Failed to register phrase' });
    }
  }
);

/**
 * Search dictionary
 * GET /api/dictionary/search
 */
router.get('/search',
  [
    query('q').isString().notEmpty().withMessage('Search query is required'),
    query('categories').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { q, categories, limit = 20, offset = 0 } = req.query;
      const userId = req.user?.id;
      
      // Parse categories if provided
      const categoryIds = categories ? categories.split(',') : [];
      
      const results = await dictionarySearchService.searchDictionary(q, categoryIds, {
        limit,
        offset,
        includeChannels: true,
        includeCategories: true,
        userId
      });
      
      dictionaryLogger.info('Dictionary search performed', {
        query: q,
        userId: userId ? userId.substring(0, 8) : 'anonymous',
        resultCount: results.results.length,
        categories: categoryIds.length
      });
      
      return res.json(results);
    } catch (error) {
      dictionaryLogger.error('Error searching dictionary', {
        error: error.message,
        query: req.query.q
      });
      return res.status(500).json({ error: 'Failed to search dictionary' });
    }
  }
);

/**
 * Get trending terms
 * GET /api/dictionary/trending
 */
router.get('/trending',
  [
    query('timeFrame').optional().isIn(['day', 'week', 'month']).withMessage('Invalid time frame'),
    query('categories').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { timeFrame = 'day', categories, limit = 10 } = req.query;
      
      // Parse categories if provided
      const categoryIds = categories ? categories.split(',') : [];
      
      const results = await dictionarySearchService.getTrendingTerms(limit, {
        timeFrame,
        categoryIds
      });
      
      dictionaryLogger.info('Trending terms requested', {
        timeFrame,
        limit,
        resultCount: results.results.length
      });
      
      return res.json(results);
    } catch (error) {
      dictionaryLogger.error('Error getting trending terms', {
        error: error.message
      });
      return res.status(500).json({ error: 'Failed to get trending terms' });
    }
  }
);

/**
 * Get related terms
 * GET /api/dictionary/related/:term
 */
router.get('/related/:term',
  [
    param('term').isString().notEmpty().withMessage('Term is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {      const { term } = req.params;
      const { limit = 10 } = req.query;
      
      // For backward compatibility with tests, don't pass limit if not explicitly provided
      const results = req.query.limit !== undefined ? 
        await dictionarySearchService.getRelatedTerms(term, limit) : 
        await dictionarySearchService.getRelatedTerms(term);
      
      dictionaryLogger.info('Related terms requested', {
        term,
        found: results.found,
        relatedCount: results.related?.length || 0
      });
      
      return res.json(results);
    } catch (error) {
      dictionaryLogger.error('Error getting related terms', {
        error: error.message,
        term: req.params.term
      });
      return res.status(500).json({ error: 'Failed to get related terms' });
    }
  }
);

/**
 * Get categories
 * GET /api/dictionary/categories
 */
router.get('/categories',
  [
    query('parentId').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { parentId, limit = 100 } = req.query;
      
      let categories;
      if (parentId) {
        // Get child categories
        categories = categorySystem.getChildCategories(parentId);
      } else {
        // Get top-level categories
        categories = categorySystem.getTopLevelCategories();
      }
      
      // Apply limit
      categories = categories.slice(0, limit);
      
      return res.json({
        categories,
        parentId: parentId || null,
        totalCount: categories.length
      });
    } catch (error) {
      dictionaryLogger.error('Error getting categories', {
        error: error.message,
        parentId: req.query.parentId
      });
      return res.status(500).json({ error: 'Failed to get categories' });
    }
  }
);

/**
 * Get terms by category
 * GET /api/dictionary/category/:categoryId/terms
 */
router.get('/category/:categoryId/terms',
  [
    param('categoryId').isString().notEmpty().withMessage('Category ID is required'),
    query('sortBy').optional().isIn(['votes', 'alphabetical', 'activity']),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { categoryId } = req.params;
      const { sortBy = 'votes', limit = 20, offset = 0 } = req.query;
      
      const results = await dictionarySearchService.getCategoryTerms([categoryId], {
        sortBy,
        limit,
        offset
      });
      
      dictionaryLogger.info('Category terms requested', {
        categoryId,
        resultCount: results.results.length
      });
      
      return res.json(results);
    } catch (error) {
      dictionaryLogger.error('Error getting category terms', {
        error: error.message,
        categoryId: req.params.categoryId
      });
      return res.status(500).json({ error: 'Failed to get category terms' });
    }
  }
);

/**
 * Vote on topic row category
 * POST /api/dictionary/category/vote
 */
router.post('/category/vote',
  auth.requireAuth,
  [
    body('topicRowName').isString().notEmpty().withMessage('Topic row name is required'),
    body('categoryId').isString().notEmpty().withMessage('Category ID is required'),
    body('upvote').isBoolean().withMessage('Upvote flag is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { topicRowName, categoryId, upvote } = req.body;
      const userId = req.user.id;
      
      // Verify user has voted in this topic row
      const hasVoted = await topicRowVoteManager.hasUserVotedInTopicRow(userId, topicRowName);
      
      if (!hasVoted) {
        return res.status(403).json({
          error: 'You must vote for a channel in this topic row before voting on categories'
        });
      }
      
      const result = await categorySystem.voteOnTopicRowCategory(
        topicRowName,
        userId,
        categoryId,
        upvote
      );
      
      dictionaryLogger.info('User voted on topic row category', {
        userId: userId.substring(0, 8),
        topicRowName,
        categoryId,
        upvote
      });
      
      return res.json(result);
    } catch (error) {
      dictionaryLogger.error('Error voting on category', {
        error: error.message,        userId: req.user.id.substring(0, 8)
      });
      return res.status(500).json({ error: 'Failed to vote on category' });
    }
  }
);

/**
 * Set user term override
 * POST /api/dictionary/override
 */
router.post('/override',
  auth.requireAuth,
  [
    body('term').isString().notEmpty().withMessage('Term is required'),
    body('preferredTopicRow').isString().notEmpty().withMessage('Preferred topic row ID is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { term, preferredTopicRow } = req.body;
      const userId = req.user.id;
      
      await dictionaryTextParser.setUserOverride(userId, term, preferredTopicRow);
      
      dictionaryLogger.info('User term override set', {
        userId: userId.substring(0, 8),
        term,
        preferredTopicRow
      });
      
      return res.json({
        success: true,
        message: 'User term override set successfully'
      });
    } catch (error) {
      dictionaryLogger.error('Error setting term override', {
        error: error.message,
        userId: req.user.id.substring(0, 8)
      });
      return res.status(500).json({ error: 'Failed to set term override' });
    }
  }
);

/**
 * Record vote for category
 * POST /api/dictionary/category
 */
router.post('/category',
  auth.requireAuth,
  [
    body('topicRowName').isString().notEmpty().withMessage('Topic row name is required'),
    body('categoryId').isString().notEmpty().withMessage('Category ID is required'),
    body('voteType').isString().isIn(['upvote', 'downvote']).withMessage('Vote type must be either upvote or downvote')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { topicRowName, categoryId, voteType } = req.body;
      const userId = req.user.id;
      
      await categorySystem.voteForCategory(topicRowName, userId, categoryId, voteType);
      
      dictionaryLogger.info('Category vote recorded', {
        userId: userId.substring(0, 8),
        topicRowName,
        categoryId,
        voteType
      });
      
      return res.json({
        success: true,
        message: 'Vote recorded successfully'
      });
    } catch (error) {
      dictionaryLogger.error('Error recording category vote', {
        error: error.message,
        userId: req.user.id.substring(0, 8)
      });
      return res.status(500).json({ error: 'Failed to record vote' });
    }
  }
);

export default router;
