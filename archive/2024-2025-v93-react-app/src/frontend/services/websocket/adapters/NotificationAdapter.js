/**
 * Notification WebSocket Adapter
 * Handles notification and alert-related WebSocket messages
 */

import EventEmitter from 'events';

class NotificationAdapter extends EventEmitter {
  constructor() {
    super();
    this.notificationState = {
      notifications: new Map(),
      alerts: new Map(),
      preferences: {
        enabled: true,
        sound: true,
        vibration: true,
        desktop: true
      },
      unreadCount: 0
    };
    this.notificationQueue = [];
    this.isProcessingQueue = false;
  }
  
  /**
   * Handle incoming notification-related messages
   * @param {object} message - WebSocket message
   */
  handleMessage(message) {
    switch (message.type) {
      case 'notification':
        this.handleNotification(message);
        break;
      case 'alert':
        this.handleAlert(message);
        break;
      case 'notification_read':
        this.handleNotificationRead(message);
        break;
      case 'notification_dismissed':
        this.handleNotificationDismissed(message);
        break;
      case 'bulk_notifications':
        this.handleBulkNotifications(message);
        break;
      case 'notification_preferences_updated':
        this.handlePreferencesUpdated(message);
        break;
      default:
        console.warn(`[NotificationAdapter] Unknown message type: ${message.type}`);
    }
  }
  
  /**
   * Mark notification as read
   * @param {string} notificationId - Notification identifier
   * @returns {object} Mark read message
   */
  markAsRead(notificationId) {
    // Update local state
    if (this.notificationState.notifications.has(notificationId)) {
      const notification = this.notificationState.notifications.get(notificationId);
      if (!notification.read) {
        notification.read = true;
        notification.readAt = Date.now();
        this.notificationState.unreadCount = Math.max(0, this.notificationState.unreadCount - 1);
        
        this.emit('notification_read', { notificationId, notification });
        this.emit('unread_count_changed', this.notificationState.unreadCount);
      }
    }
    
    return {
      domain: 'notification',
      type: 'mark_read',
      notificationId
    };
  }
  
  /**
   * Dismiss notification
   * @param {string} notificationId - Notification identifier
   * @returns {object} Dismiss message
   */
  dismissNotification(notificationId) {
    // Update local state
    if (this.notificationState.notifications.has(notificationId)) {
      const notification = this.notificationState.notifications.get(notificationId);
      notification.dismissed = true;
      notification.dismissedAt = Date.now();
      
      this.emit('notification_dismissed', { notificationId, notification });
    }
    
    return {
      domain: 'notification',
      type: 'dismiss_notification',
      notificationId
    };
  }
  
  /**
   * Update notification preferences
   * @param {object} preferences - New preferences
   * @returns {object} Preferences update message
   */
  updatePreferences(preferences) {
    // Update local state
    this.notificationState.preferences = {
      ...this.notificationState.preferences,
      ...preferences
    };
    
    this.emit('preferences_updated', this.notificationState.preferences);
    
    return {
      domain: 'notification',
      type: 'update_preferences',
      preferences: this.notificationState.preferences
    };
  }
  
  /**
   * Request notification history
   * @param {object} options - Request options
   * @returns {object} History request message
   */
  requestHistory(options = {}) {
    const {
      limit = 50,
      offset = 0,
      includeRead = true,
      includeDismissed = false,
      since = null
    } = options;
    
    return {
      domain: 'notification',
      type: 'request_history',
      options: {
        limit,
        offset,
        includeRead,
        includeDismissed,
        since
      }
    };
  }
  
  /**
   * Get all notifications
   * @returns {Array} Array of notifications
   */
  getNotifications() {
    return Array.from(this.notificationState.notifications.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Get unread notifications
   * @returns {Array} Array of unread notifications
   */
  getUnreadNotifications() {
    return this.getNotifications().filter(n => !n.read);
  }
  
  /**
   * Get notification count
   * @returns {number} Unread notification count
   */
  getUnreadCount() {
    return this.notificationState.unreadCount;
  }
  
  /**
   * Get current preferences
   * @returns {object} Notification preferences
   */
  getPreferences() {
    return { ...this.notificationState.preferences };
  }
  
  /**
   * Get active alerts
   * @returns {Array} Array of active alerts
   */
  getActiveAlerts() {
    return Array.from(this.notificationState.alerts.values())
      .filter(alert => !alert.dismissed);
  }
  
  // Private message handlers
  
  handleNotification(message) {
    const {
      id,
      title,
      body,
      type,
      priority,
      category,
      data,
      actions,
      timestamp,
      expiresAt
    } = message;
    
    const notification = {
      id,
      title,
      body,
      type,
      priority: priority || 'normal',
      category: category || 'general',
      data: data || {},
      actions: actions || [],
      timestamp,
      expiresAt,
      read: false,
      dismissed: false,
      receivedAt: Date.now()
    };
    
    this.notificationState.notifications.set(id, notification);
    this.notificationState.unreadCount++;
    
    // Queue for processing
    this.queueNotification(notification);
    
    this.emit('notification_received', notification);
    this.emit('unread_count_changed', this.notificationState.unreadCount);
  }
  
  handleAlert(message) {
    const {
      id,
      title,
      body,
      severity,
      category,
      actions,
      autoClose,
      timestamp
    } = message;
    
    const alert = {
      id,
      title,
      body,
      severity: severity || 'info',
      category: category || 'system',
      actions: actions || [],
      autoClose: autoClose || false,
      timestamp,
      dismissed: false,
      receivedAt: Date.now()
    };
    
    this.notificationState.alerts.set(id, alert);
    
    this.emit('alert_received', alert);
    
    // Auto-close if specified
    if (alert.autoClose && typeof alert.autoClose === 'number') {
      setTimeout(() => {
        this.dismissAlert(id);
      }, alert.autoClose);
    }
  }
  
  handleNotificationRead(message) {
    const { notificationId, timestamp } = message;
    
    if (this.notificationState.notifications.has(notificationId)) {
      const notification = this.notificationState.notifications.get(notificationId);
      if (!notification.read) {
        notification.read = true;
        notification.readAt = timestamp;
        this.notificationState.unreadCount = Math.max(0, this.notificationState.unreadCount - 1);
        
        this.emit('notification_read', { notificationId, notification });
        this.emit('unread_count_changed', this.notificationState.unreadCount);
      }
    }
  }
  
  handleNotificationDismissed(message) {
    const { notificationId, timestamp } = message;
    
    if (this.notificationState.notifications.has(notificationId)) {
      const notification = this.notificationState.notifications.get(notificationId);
      notification.dismissed = true;
      notification.dismissedAt = timestamp;
      
      this.emit('notification_dismissed', { notificationId, notification });
    }
  }
  
  handleBulkNotifications(message) {
    const { notifications } = message;
    
    notifications.forEach(notificationData => {
      this.handleNotification(notificationData);
    });
  }
  
  handlePreferencesUpdated(message) {
    const { preferences } = message;
    
    this.notificationState.preferences = {
      ...this.notificationState.preferences,
      ...preferences
    };
    
    this.emit('preferences_updated', this.notificationState.preferences);
  }
  
  // Private helper methods
  
  queueNotification(notification) {
    this.notificationQueue.push(notification);
    this.processNotificationQueue();
  }
  
  async processNotificationQueue() {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      await this.displayNotification(notification);
      
      // Small delay between notifications to prevent overwhelming the user
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.isProcessingQueue = false;
  }
  
  async displayNotification(notification) {
    const preferences = this.notificationState.preferences;
    
    if (!preferences.enabled) {
      return;
    }
    
    // Show desktop notification if enabled and supported
    if (preferences.desktop && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          const desktopNotification = new Notification(notification.title, {
            body: notification.body,
            icon: notification.data.icon || '/favicon.ico',
            badge: notification.data.badge,
            tag: notification.id,
            requireInteraction: notification.priority === 'high',
            silent: !preferences.sound
          });
          
          desktopNotification.onclick = () => {
            this.emit('notification_clicked', notification);
            desktopNotification.close();
          };
          
          // Auto-close after 5 seconds for normal priority
          if (notification.priority !== 'high') {
            setTimeout(() => {
              desktopNotification.close();
            }, 5000);
          }
        } else if (Notification.permission === 'default') {
          // Request permission for future notifications
          Notification.requestPermission();
        }
      } catch (error) {
        console.warn('[NotificationAdapter] Failed to show desktop notification:', error);
      }
    }
    
    // Play sound if enabled
    if (preferences.sound && notification.priority !== 'low') {
      this.playNotificationSound(notification.priority);
    }
    
    // Vibrate if enabled and supported
    if (preferences.vibration && 'navigator' in window && 'vibrate' in navigator) {
      const pattern = notification.priority === 'high' ? [200, 100, 200] : [100];
      navigator.vibrate(pattern);
    }
  }
  
  playNotificationSound(priority) {
    try {
      const soundFile = priority === 'high' ? 'alert.mp3' : 'notification.mp3';
      const audio = new Audio(`/sounds/${soundFile}`);
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.warn('[NotificationAdapter] Failed to play notification sound:', error);
      });
    } catch (error) {
      console.warn('[NotificationAdapter] Error creating notification sound:', error);
    }
  }
  
  dismissAlert(alertId) {
    if (this.notificationState.alerts.has(alertId)) {
      const alert = this.notificationState.alerts.get(alertId);
      alert.dismissed = true;
      alert.dismissedAt = Date.now();
      
      this.emit('alert_dismissed', { alertId, alert });
    }
  }
  
  /**
   * Clear all notifications and alerts (useful for logout)
   */
  clearState() {
    this.notificationState.notifications.clear();
    this.notificationState.alerts.clear();
    this.notificationState.unreadCount = 0;
    this.notificationQueue = [];
    this.isProcessingQueue = false;
    
    this.emit('state_cleared');
    this.emit('unread_count_changed', 0);
  }
  
  /**
   * Clean up expired notifications
   */
  cleanupExpired() {
    const now = Date.now();
    
    for (const [id, notification] of this.notificationState.notifications) {
      if (notification.expiresAt && now > notification.expiresAt) {
        this.notificationState.notifications.delete(id);
        if (!notification.read) {
          this.notificationState.unreadCount = Math.max(0, this.notificationState.unreadCount - 1);
        }
      }
    }
    
    this.emit('unread_count_changed', this.notificationState.unreadCount);
  }
}

export default NotificationAdapter;
