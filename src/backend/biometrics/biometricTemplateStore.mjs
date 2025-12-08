/**
 * @fileoverview Biometric Template Store - Securely stores and manages encrypted biometric templates
 * with template lifecycle management and expiration policies.
 */
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import logger from '../utils/logging/logger.mjs';
import { fileUtils } from '../utils/storage/fileStorage.mjs';
import { EventEmitter } from 'events';
import { calculateTemplateSimilarity, calculateCosineSimilarity, calculateHashSimilarity } from '../utils/biometricUtils.mjs';

const bioTemplateLogger = logger.child({ module: 'biometric-template-store' });

// Constants for template management
const TEMPLATES_FILE = path.join(process.env.DATA_DIR || './data', 'biometric-templates.json');
const ENCRYPTION_KEY_FILE = path.join(process.env.DATA_DIR || './data', 'biometric-encryption-key.dat');
const DEFAULT_MAX_TEMPLATE_AGE_DAYS = 365; // 1 year
const DEFAULT_MAX_TEMPLATES_PER_USER = 5;
const PURGE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Encrypted biometric template store with lifecycle management
 */
class BiometricTemplateStore extends EventEmitter {
  constructor() {
    super();
    this.templates = new Map();
    this.encryptionKey = null;
    this.initialized = false;
    this.purgeTimer = null;
  }

  /**
   * Initialize the biometric template store
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load encryption key
      this.encryptionKey = await this.loadOrCreateEncryptionKey();
      
      // Load templates
      await this.loadTemplates();
      
      // Set up purge timer
      this.purgeTimer = setInterval(() => {
        this.purgeExpiredTemplates().catch(err => {
          bioTemplateLogger.error('Failed to purge expired templates', { error: err.message });
        });
      }, PURGE_INTERVAL);
      
      this.initialized = true;
      bioTemplateLogger.info('Biometric template store initialized');
      this.emit('initialized');
      
      return true;
    } catch (error) {
      bioTemplateLogger.error('Failed to initialize biometric template store', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Load templates from disk
   */
  async loadTemplates() {
    try {
      const data = await fileUtils.safeReadJSON(TEMPLATES_FILE, {});
      
      // Convert loaded data to Map
      this.templates = new Map();
      
      if (data && data.users) {
        Object.entries(data.users).forEach(([userId, templates]) => {
          // Ensure templates is an array
          if (Array.isArray(templates)) {
            this.templates.set(userId, templates);
          }
        });
      }
      
      bioTemplateLogger.info(`Loaded ${this.templates.size} user template sets`);
      return true;
    } catch (error) {
      bioTemplateLogger.error('Failed to load templates', { error: error.message });
      // Initialize with empty Map if load fails
      this.templates = new Map();
      return false;
    }
  }
  
  /**
   * Save templates to disk
   */
  async saveTemplates() {
    try {
      // Convert Map to object for JSON serialization
      const data = {
        users: {},
        lastUpdated: Date.now()
      };
      
      for (const [userId, templates] of this.templates.entries()) {
        data.users[userId] = templates;
      }
      
      await fileUtils.safeWriteJSON(TEMPLATES_FILE, data);
      bioTemplateLogger.info('Templates saved to disk');
      return true;
    } catch (error) {
      bioTemplateLogger.error('Failed to save templates', { error: error.message });
      return false;
    }
  }
  
  /**
   * Load or create encryption key for template protection
   */
  async loadOrCreateEncryptionKey() {
    try {
      // Try to read existing key
      try {
        const keyData = await fs.readFile(ENCRYPTION_KEY_FILE);
        bioTemplateLogger.info('Loaded existing encryption key');
        return keyData;
      } catch (err) {
        // Generate new key if file doesn't exist
        if (err.code === 'ENOENT') {
          const newKey = crypto.randomBytes(32); // 256-bit key
          await fileUtils.ensureDir(path.dirname(ENCRYPTION_KEY_FILE));
          await fs.writeFile(ENCRYPTION_KEY_FILE, newKey, { mode: 0o600 }); // Restrictive permissions
          bioTemplateLogger.info('Created new encryption key');
          return newKey;
        }
        throw err;
      }
    } catch (error) {
      bioTemplateLogger.error('Failed to load or create encryption key', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Encrypt a template using the store encryption key
   * @param {Object} template - Template data to encrypt
   * @returns {Object} Encrypted template data
   */
  encryptTemplate(template) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not loaded');
    }
    
    try {
      // Generate a random IV for each encryption
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
      
      // Convert template to JSON string
      const templateStr = JSON.stringify(template.data || template);
      
      // Encrypt
      let encrypted = cipher.update(templateStr, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Return encrypted template with IV
      return {
        iv: iv.toString('hex'),
        data: encrypted,
        encryptedAt: Date.now(),
        metadata: template.metadata || {}
      };
    } catch (error) {
      bioTemplateLogger.error('Template encryption failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Decrypt an encrypted template
   * @param {Object} encryptedTemplate - Encrypted template data
   * @returns {Object} Decrypted template data
   */
  decryptTemplate(encryptedTemplate) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not loaded');
    }
    
    if (!encryptedTemplate || !encryptedTemplate.iv || !encryptedTemplate.data) {
      throw new Error('Invalid encrypted template format');
    }
    
    try {
      // Convert IV from hex
      const iv = Buffer.from(encryptedTemplate.iv, 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
      
      // Decrypt
      let decrypted = decipher.update(encryptedTemplate.data, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Parse JSON
      const template = JSON.parse(decrypted);
      
      // Return with metadata
      return {
        data: template,
        metadata: encryptedTemplate.metadata || {}
      };
    } catch (error) {
      bioTemplateLogger.error('Template decryption failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Add a new biometric template for a user
   * @param {string} userId - User ID to store template for
   * @param {Object} template - Biometric template to store
   * @param {Object} options - Storage options
   * @returns {Promise<Object>} Stored template information
   */
  async addTemplate(userId, template, options = {}) {
    await this.ensureInitialized();
    
    try {
      // Get user's templates
      let userTemplates = this.templates.get(userId) || [];
      
      // Check template limit
      const maxTemplates = options.maxTemplates || DEFAULT_MAX_TEMPLATES_PER_USER;
      if (userTemplates.length >= maxTemplates) {
        // Remove oldest template if at limit
        userTemplates.sort((a, b) => a.createdAt - b.createdAt);
        userTemplates.shift();
        bioTemplateLogger.info(`Removed oldest template for user ${userId} (limit reached)`);
      }
      
      // Create template object with metadata
      const templateObj = {
        id: crypto.randomBytes(16).toString('hex'),
        data: template,
        metadata: {
          quality: options.quality || 0.8,
          source: options.source || 'enrollment',
          device: options.device || 'unknown',
          ...options.metadata
        },
        createdAt: Date.now(),
        expiresAt: Date.now() + (options.expiryDays || DEFAULT_MAX_TEMPLATE_AGE_DAYS) * 24 * 60 * 60 * 1000
      };
      
      // Encrypt template
      const encryptedTemplate = this.encryptTemplate(templateObj);
      
      // Add to user's templates
      userTemplates.push({
        id: templateObj.id,
        iv: encryptedTemplate.iv,
        data: encryptedTemplate.data,
        metadata: templateObj.metadata,
        createdAt: templateObj.createdAt,
        expiresAt: templateObj.expiresAt
      });
      
      // Update store
      this.templates.set(userId, userTemplates);
      
      // Save to disk
      await this.saveTemplates();
      
      // Emit event
      this.emit('template-added', { userId, templateId: templateObj.id });
      
      bioTemplateLogger.info(`Added template ${templateObj.id} for user ${userId}`);
      
      return {
        id: templateObj.id,
        metadata: templateObj.metadata,
        createdAt: templateObj.createdAt,
        expiresAt: templateObj.expiresAt
      };
    } catch (error) {
      bioTemplateLogger.error(`Failed to add template for user ${userId}`, { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get all templates for a user
   * @param {string} userId - User ID to get templates for
   * @returns {Array} List of templates (decrypted)
   */
  getTemplates(userId) {
    if (!this.initialized) {
      bioTemplateLogger.warn('Attempted to get templates before initialization');
      return [];
    }
    
    try {
      const userTemplates = this.templates.get(userId) || [];
      
      // Filter out expired templates
      const now = Date.now();
      const validTemplates = userTemplates.filter(template => !template.expiresAt || template.expiresAt > now);
      
      // Decrypt templates
      return validTemplates.map(template => {
        try {
          const decrypted = this.decryptTemplate(template);
          return {
            id: template.id,
            data: decrypted.data,
            metadata: template.metadata,
            createdAt: template.createdAt,
            expiresAt: template.expiresAt
          };
        } catch (error) {
          bioTemplateLogger.error(`Failed to decrypt template ${template.id}`, { error: error.message });
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      bioTemplateLogger.error(`Failed to get templates for user ${userId}`, { error: error.message });
      return [];
    }
  }
  
  /**
   * Get all templates for all users (admin function)
   * @returns {Map} Map of user IDs to templates
   */
  getAllTemplates() {
    if (!this.initialized) {
      bioTemplateLogger.warn('Attempted to get all templates before initialization');
      return new Map();
    }
    
    const result = new Map();
    
    for (const [userId, templates] of this.templates.entries()) {
      result.set(userId, this.getTemplates(userId));
    }
    
    return result;
  }
  
  /**
   * Update an existing template
   * @param {string} userId - User ID
   * @param {string} templateId - Template ID to update
   * @param {Object} updates - Updates to apply
   * @returns {Promise<boolean>} Whether update was successful
   */
  async updateTemplate(userId, templateId, updates) {
    await this.ensureInitialized();
    
    try {
      const userTemplates = this.templates.get(userId) || [];
      const templateIndex = userTemplates.findIndex(t => t.id === templateId);
      
      if (templateIndex === -1) {
        bioTemplateLogger.warn(`Template ${templateId} not found for user ${userId}`);
        return false;
      }
      
      const template = userTemplates[templateIndex];
      
      // Decrypt template
      const decrypted = this.decryptTemplate(template);
      
      // Apply updates
      if (updates.data) {
        decrypted.data = updates.data;
      }
      
      if (updates.metadata) {
        template.metadata = {
          ...template.metadata,
          ...updates.metadata
        };
      }
      
      if (updates.expiresAt) {
        template.expiresAt = updates.expiresAt;
      }
      
      // Re-encrypt with updates
      const updated = this.encryptTemplate(decrypted);
      
      // Update template
      userTemplates[templateIndex] = {
        ...template,
        iv: updated.iv,
        data: updated.data,
        updatedAt: Date.now()
      };
      
      // Save to disk
      await this.saveTemplates();
      
      bioTemplateLogger.info(`Updated template ${templateId} for user ${userId}`);
      return true;
    } catch (error) {
      bioTemplateLogger.error(`Failed to update template ${templateId} for user ${userId}`, { error: error.message });
      return false;
    }
  }
  
  /**
   * Delete a template
   * @param {string} userId - User ID
   * @param {string} templateId - Template ID to delete
   * @returns {Promise<boolean>} Whether deletion was successful
   */
  async deleteTemplate(userId, templateId) {
    await this.ensureInitialized();
    
    try {
      const userTemplates = this.templates.get(userId) || [];
      const filteredTemplates = userTemplates.filter(t => t.id !== templateId);
      
      if (filteredTemplates.length === userTemplates.length) {
        bioTemplateLogger.warn(`Template ${templateId} not found for user ${userId}`);
        return false;
      }
      
      // Update store
      this.templates.set(userId, filteredTemplates);
      
      // Save to disk
      await this.saveTemplates();
      
      bioTemplateLogger.info(`Deleted template ${templateId} for user ${userId}`);
      return true;
    } catch (error) {
      bioTemplateLogger.error(`Failed to delete template ${templateId} for user ${userId}`, { error: error.message });
      return false;
    }
  }
  
  /**
   * Delete all templates for a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether deletion was successful
   */
  async deleteUserTemplates(userId) {
    await this.ensureInitialized();
    
    try {
      // Check if user has templates
      if (!this.templates.has(userId)) {
        bioTemplateLogger.warn(`No templates found for user ${userId}`);
        return false;
      }
      
      // Delete from store
      this.templates.delete(userId);
      
      // Save to disk
      await this.saveTemplates();
      
      bioTemplateLogger.info(`Deleted all templates for user ${userId}`);
      return true;
    } catch (error) {
      bioTemplateLogger.error(`Failed to delete templates for user ${userId}`, { error: error.message });
      return false;
    }
  }
  
  /**
   * Purge expired templates
   * @returns {Promise<number>} Number of templates purged
   */
  async purgeExpiredTemplates() {
    await this.ensureInitialized();
    
    try {
      const now = Date.now();
      let purgedCount = 0;
      
      // Check each user's templates
      for (const [userId, templates] of this.templates.entries()) {
        const validTemplates = templates.filter(template => {
          if (template.expiresAt && template.expiresAt < now) {
            purgedCount++;
            return false;
          }
          return true;
        });
        
        // Update if templates were purged
        if (validTemplates.length < templates.length) {
          this.templates.set(userId, validTemplates);
        }
      }
      
      // Save if any templates were purged
      if (purgedCount > 0) {
        await this.saveTemplates();
        bioTemplateLogger.info(`Purged ${purgedCount} expired templates`);
      }
      
      return purgedCount;
    } catch (error) {
      bioTemplateLogger.error('Failed to purge expired templates', { error: error.message });
      return 0;
    }
  }
  
  /**
   * Find templates similar to the provided one
   * @param {Object} queryTemplate - Template to compare against
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of matching templates with similarity scores
   */
  async findSimilarTemplates(queryTemplate, options = {}) {
    await this.ensureInitialized();
    
    const results = [];
    const threshold = options.threshold || 0.8;
    const userId = options.userId; // Optional: limit to specific user
    
    try {
      // For each user
      for (const [uid, templates] of this.templates.entries()) {
        // Skip if not the requested user
        if (userId && uid !== userId) continue;
        
        // For each template
        for (const template of templates) {
          try {
            // Decrypt template
            const decrypted = this.decryptTemplate(template);
            
            // Calculate similarity
            const similarity = this.calculateSimilarity(queryTemplate, decrypted.data);
            
            // Add to results if above threshold
            if (similarity >= threshold) {
              results.push({
                userId: uid,
                templateId: template.id,
                similarity,
                metadata: template.metadata,
                createdAt: template.createdAt
              });
            }
          } catch (error) {
            bioTemplateLogger.error(`Error comparing template ${template.id}`, { error: error.message });
          }
        }
      }
      
      // Sort by similarity (highest first)
      results.sort((a, b) => b.similarity - a.similarity);
      
      // Limit results
      const limit = options.limit || 10;
      return results.slice(0, limit);
    } catch (error) {
      bioTemplateLogger.error('Failed to find similar templates', { error: error.message });
      return [];
    }
  }
  
  /**
   * Calculate similarity between two templates
   * @param {Object} template1 - First template
   * @param {Object} template2 - Second template
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(template1, template2) {
    try {
      return calculateTemplateSimilarity(template1, template2);
    } catch (error) {
      bioTemplateLogger.warn('Template comparison failed', { error: error.message });
      return 0;
    }
  }
  

  
  /**
   * Update a user ID while preserving templates
   * @param {string} oldUserId - Old user ID
   * @param {string} newUserId - New user ID
   * @returns {Promise<boolean>} Whether update was successful
   */
  async updateUserId(oldUserId, newUserId) {
    await this.ensureInitialized();
    
    try {
      // Check if old user exists
      if (!this.templates.has(oldUserId)) {
        bioTemplateLogger.warn(`No templates found for user ${oldUserId}`);
        return false;
      }
      
      // Check if new user already exists
      if (this.templates.has(newUserId)) {
        bioTemplateLogger.warn(`Templates already exist for user ${newUserId}`);
        return false;
      }
      
      // Get templates
      const templates = this.templates.get(oldUserId);
      
      // Add to new user
      this.templates.set(newUserId, templates);
      
      // Delete old user
      this.templates.delete(oldUserId);
      
      // Save to disk
      await this.saveTemplates();
      
      bioTemplateLogger.info(`Updated user ID from ${oldUserId} to ${newUserId}`);
      return true;
    } catch (error) {
      bioTemplateLogger.error(`Failed to update user ID from ${oldUserId} to ${newUserId}`, { error: error.message });
      return false;
    }
  }
  
  /**
   * Ensure the store is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.purgeTimer) {
      clearInterval(this.purgeTimer);
      this.purgeTimer = null;
    }
    
    this.initialized = false;
    bioTemplateLogger.info('Biometric template store cleaned up');
  }
}

// Create and export singleton instance
const biometricTemplateStore = new BiometricTemplateStore();

// Initialize when imported
biometricTemplateStore.initialize().catch(error => {
  bioTemplateLogger.error('Failed to initialize biometric template store', { error: error.message });
});

export default biometricTemplateStore;

