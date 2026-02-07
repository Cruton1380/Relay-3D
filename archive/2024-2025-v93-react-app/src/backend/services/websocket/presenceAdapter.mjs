/**
 * @fileoverview WebSocket presence adapter for real-time user presence tracking
 */

class PresenceAdapter {
  constructor(websocketService) {
    this.websocketService = websocketService;
    this.connectedUsers = new Map();
  }

  initialize() {
    // Initialize presence tracking
    console.log('Presence adapter initialized');
  }

  handleUserConnect(userId, socket) {
    this.connectedUsers.set(userId, {
      socketId: socket.id,
      connectedAt: new Date(),
      lastActivity: new Date()
    });
  }

  handleUserDisconnect(userId) {
    this.connectedUsers.delete(userId);
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }
}

export default PresenceAdapter;
