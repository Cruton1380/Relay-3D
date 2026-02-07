/**
 * @fileoverview Notification Service
 * Modernized notification and error handling system for Base Model 1
 * Integrates legacy notification logic as clean, modular services
 */
import { apiPost } from './apiClient';

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.notifications = new Map(); // notificationId -> notification
    this.alerts = new Map(); // alertId -> alert
    this.preferences = {
      enabled: true,
      desktop: true,
      sound: true,
      vibration: true,
      categories: {
        system: true,
        voting: true,
        channels: true,
        governance: true,
        security: true
      }
    };
    this.listeners = new Map(); // eventType -> array of listeners
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Load user preferences
      await this.loadPreferences();
      
      // Request notification permissions
      await this.requestPermissions();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  /**
   * Show a notification
   */
  async showNotification(type, message, options = {}) {
    try {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: type, // 'success', 'error', 'warning', 'info'
        message: message,
        title: options.title || this.getDefaultTitle(type),
        icon: options.icon || this.getDefaultIcon(type),
        duration: options.duration || this.getDefaultDuration(type),
        actions: options.actions || [],
        data: options.data || {},
        timestamp: Date.now(),
        read: false,
        dismissed: false
      };

      // Store notification
      this.notifications.set(notification.id, notification);

      // Emit event
      this.emit('notification_show', notification);

      // Auto-dismiss after duration
      if (notification.duration > 0) {
        setTimeout(() => {
          this.dismissNotification(notification.id);
        }, notification.duration);
      }

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      throw error;
    }
  }

  /**
   * Show success notification
   */
  async showSuccess(message, options = {}) {
    return await this.showNotification('success', message, options);
  }

  /**
   * Show error notification
   */
  async showError(message, options = {}) {
    return await this.showNotification('error', message, options);
  }

  /**
   * Show warning notification
   */
  async showWarning(message, options = {}) {
    return await this.showNotification('warning', message, options);
  }

  /**
   * Show info notification
   */
  async showInfo(message, options = {}) {
    return await this.showNotification('info', message, options);
  }

  /**
   * Show alert (high priority notification)
   */
  async showAlert(type, title, message, options = {}) {
    try {
      const alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: type,
        title: title,
        message: message,
        severity: options.severity || 'medium',
        actions: options.actions || [],
        autoClose: options.autoClose || false,
        timestamp: Date.now(),
        dismissed: false
      };

      // Store alert
      this.alerts.set(alert.id, alert);

      // Emit event
      this.emit('alert_show', alert);

      // Auto-close if specified
      if (alert.autoClose && typeof alert.autoClose === 'number') {
        setTimeout(() => {
          this.dismissAlert(alert.id);
        }, alert.autoClose);
      }

      return alert;
    } catch (error) {
      console.error('Failed to show alert:', error);
      throw error;
    }
  }

  /**
   * Dismiss a notification
   */
  dismissNotification(notificationId) {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.dismissed = true;
      this.notifications.delete(notificationId);
      this.emit('notification_dismiss', notification);
    }
  }

  /**
   * Dismiss an alert
   */
  dismissAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.dismissed = true;
      this.alerts.delete(alertId);
      this.emit('alert_dismiss', alert);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const notification = this.notifications.get(notificationId);
      if (notification) {
        notification.read = true;
        
        // Update on backend
        await apiPost('/api/notifications/mark-read', {
          notificationId: notificationId
        });

        this.emit('notification_read', notification);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Get user notifications
   */
  async getNotifications(options = {}) {
    try {
      const response = await apiPost('/api/notifications/get', {
        limit: options.limit || 20,
        offset: options.offset || 0,
        unreadOnly: options.unreadOnly || false,
        category: options.category || null
      });

      return {
        notifications: response.notifications || [],
        total: response.total || 0,
        unread: response.unread || 0
      };
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return {
        notifications: [],
        total: 0,
        unread: 0
      };
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(newPreferences) {
    try {
      this.preferences = { ...this.preferences, ...newPreferences };

      // Save to backend
      await apiPost('/api/notifications/preferences', {
        preferences: this.preferences
      });

      this.emit('preferences_updated', this.preferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Load user preferences
   */
  async loadPreferences() {
    try {
      const response = await apiPost('/api/notifications/preferences');
      if (response.preferences) {
        this.preferences = { ...this.preferences, ...response.preferences };
      }
    } catch (error) {
      console.warn('Failed to load notification preferences:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        this.preferences.desktop = permission === 'granted';
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
        this.preferences.desktop = false;
      }
    }
  }

  /**
   * Handle error with automatic notification
   */
  async handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);

    let message = 'An unexpected error occurred';
    let type = 'error';

    if (error.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Determine notification type based on error
    if (error.status === 401) {
      message = 'Authentication required. Please log in.';
      type = 'warning';
    } else if (error.status === 403) {
      message = 'You do not have permission to perform this action.';
      type = 'warning';
    } else if (error.status === 404) {
      message = 'The requested resource was not found.';
      type = 'info';
    } else if (error.status >= 500) {
      message = 'Server error. Please try again later.';
      type = 'error';
    }

    // Show notification
    await this.showNotification(type, message, {
      title: context ? `Error in ${context}` : 'Error',
      duration: type === 'error' ? 8000 : 5000
    });

    return {
      type: type,
      message: message,
      originalError: error
    };
  }

  /**
   * Handle API response with automatic notification
   */
  async handleApiResponse(response, successMessage = '', errorContext = '') {
    if (response.success) {
      if (successMessage) {
        await this.showSuccess(successMessage);
      }
      return response;
    } else {
      await this.handleError(response.error || 'Operation failed', errorContext);
      throw new Error(response.error || 'Operation failed');
    }
  }

  /**
   * Show loading notification
   */
  async showLoading(message = 'Loading...', options = {}) {
    return await this.showNotification('info', message, {
      ...options,
      duration: 0, // Don't auto-dismiss
      icon: 'fas fa-spinner fa-spin'
    });
  }

  /**
   * Hide loading notification
   */
  hideLoading(notificationId) {
    this.dismissNotification(notificationId);
  }

  /**
   * Show confirmation dialog
   */
  async showConfirmation(title, message, options = {}) {
    return new Promise((resolve) => {
      const alert = {
        id: `confirm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'confirmation',
        title: title,
        message: message,
        actions: [
          {
            label: options.confirmLabel || 'Confirm',
            action: 'confirm',
            primary: true
          },
          {
            label: options.cancelLabel || 'Cancel',
            action: 'cancel'
          }
        ],
        onAction: (action) => {
          this.dismissAlert(alert.id);
          resolve(action === 'confirm');
        },
        timestamp: Date.now(),
        dismissed: false
      };

      this.alerts.set(alert.id, alert);
      this.emit('alert_show', alert);
    });
  }

  /**
   * Subscribe to notification events
   */
  subscribe(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit event to listeners
   */
  emit(eventType, data) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in notification listener:', error);
        }
      });
    }
  }

  /**
   * Get default title for notification type
   */
  getDefaultTitle(type) {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    };
    return titles[type] || 'Notification';
  }

  /**
   * Get default icon for notification type
   */
  getDefaultIcon(type) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[type] || 'fas fa-bell';
  }

  /**
   * Get default duration for notification type
   */
  getDefaultDuration(type) {
    const durations = {
      success: 4000,
      error: 8000,
      warning: 6000,
      info: 5000
    };
    return durations[type] || 5000;
  }

  /**
   * Play notification sound
   */
  playNotificationSound(priority = 'normal') {
    if (!this.preferences.sound) return;

    try {
      // Create audio context for notification sounds
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different priorities
      const frequencies = {
        high: [800, 1000, 1200],
        normal: [600, 800],
        low: [400, 600]
      };

      const freq = frequencies[priority] || frequencies.normal;
      const duration = 200;

      oscillator.frequency.setValueAtTime(freq[0], audioContext.currentTime);
      oscillator.frequency.setValueAtTime(freq[1], audioContext.currentTime + duration * 0.001);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration * 0.001);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration * 0.001);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  /**
   * Trigger device vibration
   */
  triggerVibration(priority = 'normal') {
    if (!this.preferences.vibration || !('navigator' in window) || !('vibrate' in navigator)) {
      return;
    }

    try {
      const patterns = {
        high: [200, 100, 200, 100, 200],
        normal: [100, 50, 100],
        low: [100]
      };

      const pattern = patterns[priority] || patterns.normal;
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Failed to trigger vibration:', error);
    }
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications() {
    this.notifications.clear();
    this.emit('notifications_cleared');
  }

  /**
   * Clear all alerts
   */
  clearAllAlerts() {
    this.alerts.clear();
    this.emit('alerts_cleared');
  }

  /**
   * Get notification statistics
   */
  getStatistics() {
    const notifications = Array.from(this.notifications.values());
    const alerts = Array.from(this.alerts.values());

    return {
      totalNotifications: notifications.length,
      unreadNotifications: notifications.filter(n => !n.read).length,
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter(a => !a.dismissed).length,
      byType: {
        success: notifications.filter(n => n.type === 'success').length,
        error: notifications.filter(n => n.type === 'error').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        info: notifications.filter(n => n.type === 'info').length
      }
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.notifications.clear();
    this.alerts.clear();
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService; 