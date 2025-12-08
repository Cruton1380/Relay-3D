/**
 * @fileoverview Category API Routes
 * Provides endpoints for category management and voting
 */

import express from 'express';
import categorySystem from '../dictionary/categorySystem.mjs';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = categorySystem.getTopLevelCategories();
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// Get category by ID
router.get('/:categoryId', async (req, res) => {
  try {
    const category = categorySystem.getCategory(req.params.categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category'
    });
  }
});

// Get child categories
router.get('/:categoryId/children', async (req, res) => {
  try {
    const children = categorySystem.getChildCategories(req.params.categoryId);
    
    res.json({
      success: true,
      categories: children
    });
  } catch (error) {
    console.error('Error fetching child categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch child categories'
    });
  }
});

// Get categories for a topic row
router.get('/topic-row/:topicRowName', async (req, res) => {
  try {
    const categories = categorySystem.getTopicRowCategories(req.params.topicRowName);
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching topic row categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch topic row categories'
    });
  }
});

// Vote on a category for a topic row
router.post('/topic-row/:topicRowName/vote', async (req, res) => {
  try {
    const { categoryId, upvote = true } = req.body;
    const userId = req.user?.id || 'anonymous';
    
    const result = await categorySystem.voteOnTopicRowCategory(
      req.params.topicRowName,
      userId,
      categoryId,
      upvote
    );
    
    res.json({
      success: true,
      categories: result
    });
  } catch (error) {
    console.error('Error voting on category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to vote on category'
    });
  }
});

// Search categories
router.get('/search/:query', async (req, res) => {
  try {
    const categories = categorySystem.searchCategories(req.params.query);
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error searching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search categories'
    });
  }
});

// Create a new category
router.post('/', async (req, res) => {
  try {
    const { name, description, parentCategoryId, metadata } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }
    
    const category = await categorySystem.createCategory(name, description, parentCategoryId, metadata);
    
    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
});

export default router;
