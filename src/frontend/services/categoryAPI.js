/**
 * @fileoverview Category API Service
 * Frontend service for category management and voting
 */

const API_BASE = 'http://localhost:3002/api';

class CategoryAPI {
  /**
   * Get all top-level categories
   */
  async getAllCategories() {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch categories');
      }
      
      return data.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get category by ID
   */
  async getCategory(categoryId) {
    try {
      const response = await fetch(`${API_BASE}/categories/${categoryId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch category');
      }
      
      return data.category;
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  }

  /**
   * Get categories for a specific topic row/channel
   */
  async getCategoriesForTopicRow(topicRowName) {
    try {
      const response = await fetch(`${API_BASE}/categories/topic-row/${encodeURIComponent(topicRowName)}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch topic row categories');
      }
      
      return data.categories;
    } catch (error) {
      console.error('Error fetching topic row categories:', error);
      return [];
    }
  }

  /**
   * Vote on a category for a topic row
   */
  async voteOnCategory(topicRowName, categoryId, upvote = true) {
    try {
      const response = await fetch(`${API_BASE}/categories/topic-row/${encodeURIComponent(topicRowName)}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ categoryId, upvote })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to vote on category');
      }
      
      return data.categories;
    } catch (error) {
      console.error('Error voting on category:', error);
      return [];
    }
  }

  /**
   * Search categories by query
   */
  async searchCategories(query) {
    try {
      const response = await fetch(`${API_BASE}/categories/search/${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to search categories');
      }
      
      return data.categories;
    } catch (error) {
      console.error('Error searching categories:', error);
      return [];
    }
  }

  /**
   * Create a new category
   */
  async createCategory(name, description, parentCategoryId = null, metadata = {}) {
    try {
      const response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description, parentCategoryId, metadata })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create category');
      }
      
      return data.category;
    } catch (error) {
      console.error('Error creating category:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new CategoryAPI();
