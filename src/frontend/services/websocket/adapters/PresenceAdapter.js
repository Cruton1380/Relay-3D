/**
 * Presence WebSocket Adapter
 * Handles presence and proximity-related WebSocket messages
 */

import EventEmitter from 'events';

class PresenceAdapter extends EventEmitter {
  constructor() {
    super();
    this.presenceState = {
      currentUser: null,
      nearbyUsers: new Map(),
      proximityChannels: new Map(),
      bluetoothDevices: new Map(),
      wifiNetworks: new Map()
    };
    this.updateTimers = new Map();
  }
  
  /**
   * Handle incoming presence-related messages
   * @param {object} message - WebSocket message
   */
  handleMessage(message) {
    switch (message.type) {
      case 'presence_update':
        this.handlePresenceUpdate(message);
        break;
      case 'user_nearby':
        this.handleUserNearby(message);
        break;
      case 'user_left':
        this.handleUserLeft(message);
        break;
      case 'proximity_channel_discovered':
        this.handleProximityChannelDiscovered(message);
        break;
      case 'proximity_channel_lost':
        this.handleProximityChannelLost(message);
        break;
      case 'bluetooth_device_detected':
        this.handleBluetoothDeviceDetected(message);
        break;
      case 'wifi_network_detected':
        this.handleWifiNetworkDetected(message);
        break;
      case 'location_update':
        this.handleLocationUpdate(message);
        break;
      default:
        console.warn(`[PresenceAdapter] Unknown message type: ${message.type}`);
    }
  }
  
  /**
   * Update current user's presence status
   * @param {string} status - Presence status ('online', 'away', 'busy', 'offline')
   * @param {object} location - Optional location data
   * @returns {object} Presence update message
   */
  updatePresence(status, location = null) {
    const updateData = {
      domain: 'presence',
      type: 'update_presence',
      status,
      timestamp: Date.now()
    };
    
    if (location) {
      updateData.location = location;
    }
    
    // Update local state
    if (this.presenceState.currentUser) {
      this.presenceState.currentUser.status = status;
      this.presenceState.currentUser.lastUpdate = updateData.timestamp;
      if (location) {
        this.presenceState.currentUser.location = location;
      }
    }
    
    return updateData;
  }
  
  /**
   * Start proximity discovery
   * @param {object} options - Discovery options
   * @returns {object} Discovery start message
   */
  startProximityDiscovery(options = {}) {
    const {
      bluetooth = true,
      wifi = true,
      radius = 30, // meters
      interval = 5000 // ms
    } = options;
    
    return {
      domain: 'presence',
      type: 'start_proximity_discovery',
      options: {
        bluetooth,
        wifi,
        radius,
        interval
      }
    };
  }
  
  /**
   * Stop proximity discovery
   * @returns {object} Discovery stop message
   */
  stopProximityDiscovery() {
    return {
      domain: 'presence',
      type: 'stop_proximity_discovery'
    };
  }
  
  /**
   * Join a proximity channel
   * @param {string} channelId - Channel identifier
   * @param {string} password - Channel password (optional)
   * @returns {object} Join channel message
   */
  joinProximityChannel(channelId, password = null) {
    return {
      domain: 'presence',
      type: 'join_proximity_channel',
      channelId,
      password
    };
  }
  
  /**
   * Leave a proximity channel
   * @param {string} channelId - Channel identifier
   * @returns {object} Leave channel message
   */
  leaveProximityChannel(channelId) {
    // Remove from local state
    this.presenceState.proximityChannels.delete(channelId);
    
    return {
      domain: 'presence',
      type: 'leave_proximity_channel',
      channelId
    };
  }
  
  /**
   * Get nearby users
   * @returns {Array} Array of nearby users
   */
  getNearbyUsers() {
    return Array.from(this.presenceState.nearbyUsers.values());
  }
  
  /**
   * Get active proximity channels
   * @returns {Array} Array of proximity channels
   */
  getProximityChannels() {
    return Array.from(this.presenceState.proximityChannels.values());
  }
  
  /**
   * Get current user presence
   * @returns {object|null} Current user presence
   */
  getCurrentUserPresence() {
    return this.presenceState.currentUser;
  }
  
  /**
   * Get detected Bluetooth devices
   * @returns {Array} Array of Bluetooth devices
   */
  getBluetoothDevices() {
    return Array.from(this.presenceState.bluetoothDevices.values());
  }
  
  /**
   * Get detected WiFi networks
   * @returns {Array} Array of WiFi networks
   */
  getWifiNetworks() {
    return Array.from(this.presenceState.wifiNetworks.values());
  }
  
  // Private message handlers
  
  handlePresenceUpdate(message) {
    const { userId, status, location, timestamp } = message;
    
    if (message.isCurrentUser) {
      this.presenceState.currentUser = {
        userId,
        status,
        location,
        lastUpdate: timestamp
      };
      
      this.emit('current_user_presence_update', {
        userId,
        status,
        location,
        timestamp
      });
    } else {
      // Update nearby user if they exist
      if (this.presenceState.nearbyUsers.has(userId)) {
        const user = this.presenceState.nearbyUsers.get(userId);
        user.status = status;
        user.location = location;
        user.lastUpdate = timestamp;
        
        this.emit('nearby_user_presence_update', {
          userId,
          status,
          location,
          timestamp
        });
      }
    }
  }
  
  handleUserNearby(message) {
    const { userId, username, distance, signal, discoveryMethod, timestamp } = message;
    
    this.presenceState.nearbyUsers.set(userId, {
      userId,
      username,
      distance,
      signal,
      discoveryMethod,
      discoveredAt: timestamp,
      lastSeen: timestamp
    });
    
    this.emit('user_nearby', {
      userId,
      username,
      distance,
      signal,
      discoveryMethod,
      timestamp
    });
  }
  
  handleUserLeft(message) {
    const { userId, timestamp } = message;
    
    if (this.presenceState.nearbyUsers.has(userId)) {
      const user = this.presenceState.nearbyUsers.get(userId);
      this.presenceState.nearbyUsers.delete(userId);
      
      this.emit('user_left', {
        userId,
        user,
        timestamp
      });
    }
  }
  
  handleProximityChannelDiscovered(message) {
    const { channelId, name, description, distance, signal, userCount, isProtected } = message;
    
    this.presenceState.proximityChannels.set(channelId, {
      channelId,
      name,
      description,
      distance,
      signal,
      userCount,
      isProtected,
      discoveredAt: Date.now(),
      joined: false
    });
    
    this.emit('proximity_channel_discovered', {
      channelId,
      name,
      description,
      distance,
      signal,
      userCount,
      isProtected
    });
  }
  
  handleProximityChannelLost(message) {
    const { channelId, timestamp } = message;
    
    if (this.presenceState.proximityChannels.has(channelId)) {
      const channel = this.presenceState.proximityChannels.get(channelId);
      this.presenceState.proximityChannels.delete(channelId);
      
      this.emit('proximity_channel_lost', {
        channelId,
        channel,
        timestamp
      });
    }
  }
  
  handleBluetoothDeviceDetected(message) {
    const { deviceId, name, rssi, distance, timestamp } = message;
    
    this.presenceState.bluetoothDevices.set(deviceId, {
      deviceId,
      name,
      rssi,
      distance,
      lastSeen: timestamp,
      discoveredAt: this.presenceState.bluetoothDevices.has(deviceId) 
        ? this.presenceState.bluetoothDevices.get(deviceId).discoveredAt 
        : timestamp
    });
    
    this.emit('bluetooth_device_detected', {
      deviceId,
      name,
      rssi,
      distance,
      timestamp
    });
  }
  
  handleWifiNetworkDetected(message) {
    const { networkId, ssid, signal, frequency, timestamp } = message;
    
    this.presenceState.wifiNetworks.set(networkId, {
      networkId,
      ssid,
      signal,
      frequency,
      lastSeen: timestamp,
      discoveredAt: this.presenceState.wifiNetworks.has(networkId)
        ? this.presenceState.wifiNetworks.get(networkId).discoveredAt
        : timestamp
    });
    
    this.emit('wifi_network_detected', {
      networkId,
      ssid,
      signal,
      frequency,
      timestamp
    });
  }
  
  handleLocationUpdate(message) {
    const { userId, location, accuracy, timestamp } = message;
    
    if (message.isCurrentUser && this.presenceState.currentUser) {
      this.presenceState.currentUser.location = location;
      this.presenceState.currentUser.locationAccuracy = accuracy;
      this.presenceState.currentUser.lastLocationUpdate = timestamp;
      
      this.emit('current_user_location_update', {
        location,
        accuracy,
        timestamp
      });
    } else if (this.presenceState.nearbyUsers.has(userId)) {
      const user = this.presenceState.nearbyUsers.get(userId);
      user.location = location;
      user.locationAccuracy = accuracy;
      user.lastLocationUpdate = timestamp;
      
      this.emit('nearby_user_location_update', {
        userId,
        location,
        accuracy,
        timestamp
      });
    }
  }
  
  /**
   * Clear all presence state (useful for logout)
   */
  clearState() {
    this.presenceState.currentUser = null;
    this.presenceState.nearbyUsers.clear();
    this.presenceState.proximityChannels.clear();
    this.presenceState.bluetoothDevices.clear();
    this.presenceState.wifiNetworks.clear();
    
    // Clear any pending update timers
    this.updateTimers.forEach(timer => clearTimeout(timer));
    this.updateTimers.clear();
    
    this.emit('state_cleared');
  }
  
  /**
   * Cleanup old devices and networks that haven't been seen recently
   * @param {number} maxAge - Maximum age in milliseconds (default: 30 seconds)
   */
  cleanupOldDevices(maxAge = 30000) {
    const now = Date.now();
    
    // Cleanup old Bluetooth devices
    for (const [deviceId, device] of this.presenceState.bluetoothDevices) {
      if (now - device.lastSeen > maxAge) {
        this.presenceState.bluetoothDevices.delete(deviceId);
        this.emit('bluetooth_device_lost', { deviceId, device });
      }
    }
    
    // Cleanup old WiFi networks
    for (const [networkId, network] of this.presenceState.wifiNetworks) {
      if (now - network.lastSeen > maxAge) {
        this.presenceState.wifiNetworks.delete(networkId);
        this.emit('wifi_network_lost', { networkId, network });
      }
    }
    
    // Cleanup users who haven't been seen recently
    for (const [userId, user] of this.presenceState.nearbyUsers) {
      if (now - user.lastSeen > maxAge) {
        this.presenceState.nearbyUsers.delete(userId);
        this.emit('user_left', { userId, user, timestamp: now });
      }
    }
  }
}

export default PresenceAdapter;
