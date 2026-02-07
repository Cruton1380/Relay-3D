/**
 * @fileoverview Enhanced notification manager with smart notifications, mentions, and keyword alerts
 */
import logger from '../utils/logging/logger.mjs';

const notifLogger = logger.child({ module: 'notification-manager' });

// Simple in-memory storage for demo purposes
// In production, this would use a database
const userNotifications = new Map(); // userId -> Array of notifications
const userNotificationSettings = new Map(); // userId -> notification preferences
const userKeywordAlerts = new Map(); // userId -> Set of keywords
const channelMentions = new Map(); // channelId -> Map(messageId -> Array of mentions)

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Max number of notifications to return
 * @param {number} options.offset - Offset for pagination
 * @param {boolean} options.unreadOnly - Only return unread notifications
 * @returns {Promise<Array>} Array of notifications
 */
export async function getUserNotifications(userId, options = {}) {
  try {
    const {
      limit = 20,
      offset = 0,
      unreadOnly = false
    } = options;

    // Get user's notifications
    let notifications = userNotifications.get(userId) || [];
    
    // Filter unread only if requested
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }
    
    // Sort by timestamp descending
    notifications.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply pagination
    const paginatedNotifications = notifications.slice(offset, offset + limit);
    
    // Add metadata
    paginatedNotifications.total = notifications.length;
    paginatedNotifications.unread = notifications.filter(n => !n.read).length;
    
    return paginatedNotifications;
  } catch (error) {
    notifLogger.error('Error getting user notifications', {
      userId,
      error: error.message
    });
    return [];
  }
}

/**
 * Add notification for a user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification object
 */
export async function addUserNotification(userId, notification) {
  try {
    if (!userNotifications.has(userId)) {
      userNotifications.set(userId, []);
    }
    
    const notifications = userNotifications.get(userId);
    const notificationWithDefaults = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
      ...notification
    };
    
    notifications.push(notificationWithDefaults);
    
    // Keep only last 100 notifications per user
    if (notifications.length > 100) {
      notifications.splice(0, notifications.length - 100);
    }
    
    notifLogger.debug('Added notification for user', {
      userId,
      notificationId: notificationWithDefaults.id
    });
    
    return notificationWithDefaults;
  } catch (error) {
    notifLogger.error('Error adding user notification', {
      userId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Mark notification as read
 * @param {string} userId - User ID
 * @param {string} notificationId - Notification ID
 */
export async function markNotificationRead(userId, notificationId) {
  try {
    const notifications = userNotifications.get(userId) || [];
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      notification.readAt = Date.now();
    }
    
    return notification;
  } catch (error) {
    notifLogger.error('Error marking notification as read', {
      userId,
      notificationId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Get unread notification count for user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread count
 */
export async function getUnreadCount(userId) {
  try {
    const notifications = userNotifications.get(userId) || [];
    return notifications.filter(n => !n.read).length;
  } catch (error) {
    notifLogger.error('Error getting unread count', {
      userId,
      error: error.message
    });
    return 0;
  }
}

/**
 * Clear all notifications for a user
 * @param {string} userId - User ID
 */
export async function clearUserNotifications(userId) {
  try {
    userNotifications.delete(userId);
    notifLogger.debug('Cleared notifications for user', { userId });
  } catch (error) {
    notifLogger.error('Error clearing user notifications', {
      userId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Smart Notifications: Handle @mentions and keyword alerts
 */

/**
 * Get default notification settings for a user
 */
function getDefaultNotificationSettings() {
  return {
    global: {
      enabled: true,
      mentions: true,
      keywords: true,
      reactions: true,
      replies: true,
      sounds: true,
      desktop: true,
      mobile: true
    },
    channels: new Map(), // channelId -> channel-specific settings
    keywords: new Set(),
    mutedUsers: new Set(),
    mutedChannels: new Set()
  };
}

/**
 * Get notification settings for a user
 * @param {string} userId - User ID
 * @returns {Object} User notification settings
 */
export async function getUserNotificationSettings(userId) {
  if (!userNotificationSettings.has(userId)) {
    userNotificationSettings.set(userId, getDefaultNotificationSettings());
  }
  return userNotificationSettings.get(userId);
}

/**
 * Update notification settings for a user
 * @param {string} userId - User ID
 * @param {Object} settings - New settings to merge
 */
export async function updateUserNotificationSettings(userId, settings) {
  try {
    const currentSettings = await getUserNotificationSettings(userId);
    
    // Deep merge settings
    if (settings.global) {
      Object.assign(currentSettings.global, settings.global);
    }
    
    if (settings.channels) {
      for (const [channelId, channelSettings] of Object.entries(settings.channels)) {
        currentSettings.channels.set(channelId, {
          ...currentSettings.channels.get(channelId),
          ...channelSettings
        });
      }
    }
    
    if (settings.keywords) {
      currentSettings.keywords = new Set([...currentSettings.keywords, ...settings.keywords]);
    }
    
    if (settings.mutedUsers) {
      currentSettings.mutedUsers = new Set([...currentSettings.mutedUsers, ...settings.mutedUsers]);
    }
    
    if (settings.mutedChannels) {
      currentSettings.mutedChannels = new Set([...currentSettings.mutedChannels, ...settings.mutedChannels]);
    }
    
    userNotificationSettings.set(userId, currentSettings);
    
    notifLogger.debug('Updated notification settings', { userId });
    return currentSettings;
  } catch (error) {
    notifLogger.error('Error updating notification settings', { userId, error: error.message });
    throw error;
  }
}

/**
 * Check if message contains mentions and create notifications
 * @param {string} channelId - Channel ID
 * @param {Object} message - Message object
 * @param {Array} channelMembers - Array of channel member IDs
 */
export async function processMentions(channelId, message, channelMembers) {
  try {
    // Extract @mentions from message content
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(message.content)) !== null) {
      const mentionedUsername = match[1];
      // Find user ID by username (simplified - in production, use proper user lookup)
      const mentionedUserId = channelMembers.find(memberId => 
        memberId.toLowerCase().includes(mentionedUsername.toLowerCase())
      );
      
      if (mentionedUserId && mentionedUserId !== message.senderId) {
        mentions.push({
          userId: mentionedUserId,
          username: mentionedUsername,
          position: match.index
        });
      }
    }
    
    // Store mentions for the message
    if (mentions.length > 0) {
      if (!channelMentions.has(channelId)) {
        channelMentions.set(channelId, new Map());
      }
      channelMentions.get(channelId).set(message.id, mentions);
      
      // Create notifications for mentioned users
      for (const mention of mentions) {
        await createMentionNotification(channelId, message, mention);
      }
    }
    
    return mentions;
  } catch (error) {
    notifLogger.error('Error processing mentions', { channelId, messageId: message.id, error: error.message });
    return [];
  }
}

/**
 * Create mention notification
 */
async function createMentionNotification(channelId, message, mention) {
  const settings = await getUserNotificationSettings(mention.userId);
  
  // Check if mentions are enabled and channel/user not muted
  if (!settings.global.mentions || 
      settings.mutedChannels.has(channelId) || 
      settings.mutedUsers.has(message.senderId)) {
    return;
  }
  
  // Check channel-specific settings
  const channelSettings = settings.channels.get(channelId);
  if (channelSettings && !channelSettings.mentions) {
    return;
  }
  
  const notification = {
    type: 'mention',
    title: `You were mentioned in a channel`,
    body: `${message.senderId} mentioned you: ${message.content.substring(0, 100)}...`,
    data: {
      channelId,
      messageId: message.id,
      senderId: message.senderId,
      mentionUsername: mention.username
    },
    priority: 'high',
    category: 'social'
  };
  
  await addUserNotification(mention.userId, notification);
}

/**
 * Check message for keyword alerts and create notifications
 * @param {string} channelId - Channel ID
 * @param {Object} message - Message object
 * @param {Array} channelMembers - Array of channel member IDs
 */
export async function processKeywordAlerts(channelId, message, channelMembers) {
  try {
    const messageContent = message.content.toLowerCase();
    
    for (const memberId of channelMembers) {
      if (memberId === message.senderId) continue; // Don't alert sender
      
      const settings = await getUserNotificationSettings(memberId);
      
      // Check if keywords alerts are enabled
      if (!settings.global.keywords || 
          settings.mutedChannels.has(channelId) || 
          settings.mutedUsers.has(message.senderId)) {
        continue;
      }
      
      // Check for keyword matches
      for (const keyword of settings.keywords) {
        if (messageContent.includes(keyword.toLowerCase())) {
          await createKeywordAlert(channelId, message, memberId, keyword);
        }
      }
    }
  } catch (error) {
    notifLogger.error('Error processing keyword alerts', { channelId, messageId: message.id, error: error.message });
  }
}

/**
 * Create keyword alert notification
 */
async function createKeywordAlert(channelId, message, userId, keyword) {
  const notification = {
    type: 'keyword_alert',
    title: `Keyword "${keyword}" mentioned`,
    body: `${message.senderId}: ${message.content.substring(0, 100)}...`,
    data: {
      channelId,
      messageId: message.id,
      senderId: message.senderId,
      keyword
    },
    priority: 'normal',
    category: 'alert'
  };
  
  await addUserNotification(userId, notification);
}

/**
 * Process message reactions and create notifications
 * @param {string} channelId - Channel ID
 * @param {string} messageId - Message ID
 * @param {string} reactorId - User who reacted
 * @param {string} originalSenderId - Original message sender
 * @param {string} emoji - Reaction emoji
 */
export async function processReactionNotification(channelId, messageId, reactorId, originalSenderId, emoji) {
  try {
    if (reactorId === originalSenderId) return; // Don't notify self
    
    const settings = await getUserNotificationSettings(originalSenderId);
    
    if (!settings.global.reactions || 
        settings.mutedChannels.has(channelId) || 
        settings.mutedUsers.has(reactorId)) {
      return;
    }
    
    const notification = {
      type: 'reaction',
      title: 'Someone reacted to your message',
      body: `${reactorId} reacted with ${emoji}`,
      data: {
        channelId,
        messageId,
        reactorId,
        emoji
      },
      priority: 'low',
      category: 'social'
    };
    
    await addUserNotification(originalSenderId, notification);
  } catch (error) {
    notifLogger.error('Error creating reaction notification', { error: error.message });
  }
}

/**
 * Add keyword to user's alert list
 * @param {string} userId - User ID
 * @param {string} keyword - Keyword to add
 */
export async function addKeywordAlert(userId, keyword) {
  try {
    const settings = await getUserNotificationSettings(userId);
    settings.keywords.add(keyword.toLowerCase());
    userNotificationSettings.set(userId, settings);
    
    notifLogger.debug('Added keyword alert', { userId, keyword });
    return true;
  } catch (error) {
    notifLogger.error('Error adding keyword alert', { userId, keyword, error: error.message });
    return false;
  }
}

/**
 * Remove keyword from user's alert list
 * @param {string} userId - User ID
 * @param {string} keyword - Keyword to remove
 */
export async function removeKeywordAlert(userId, keyword) {
  try {
    const settings = await getUserNotificationSettings(userId);
    settings.keywords.delete(keyword.toLowerCase());
    userNotificationSettings.set(userId, settings);
    
    notifLogger.debug('Removed keyword alert', { userId, keyword });
    return true;
  } catch (error) {
    notifLogger.error('Error removing keyword alert', { userId, keyword, error: error.message });
    return false;
  }
}

export const notificationManager = {
  getUserNotifications,
  addUserNotification,
  markNotificationRead,
  getUnreadCount,
  clearUserNotifications,
  getUserNotificationSettings
};
