/**
 * @fileoverview Network Transport Layer for Hashgraph Gossip
 * Implements WebSocket, WebRTC, and Bluetooth transports with fallback mechanisms
 */

import EventEmitter from 'events';
import WebSocket from 'ws';
import logger from '../utils/logging/logger.mjs';

const transportLogger = logger.child({ module: 'network-transport' });

/**
 * Transport interface for different communication methods
 */
class Transport extends EventEmitter {
  constructor(type) {
    super();
    this.type = type;
    this.connected = false;
    this.lastActivity = Date.now();
  }

  async connect(peerId, options) {
    throw new Error('connect() must be implemented by transport');
  }

  async send(peerId, message) {
    throw new Error('send() must be implemented by transport');
  }

  disconnect(peerId) {
    throw new Error('disconnect() must be implemented by transport');
  }

  getConnectedPeers() {
    throw new Error('getConnectedPeers() must be implemented by transport');
  }
}

/**
 * WebSocket Transport for regional communication
 */
class WebSocketTransport extends Transport {
  constructor(options = {}) {
    super('websocket');
    this.server = null;
    this.clients = new Map(); // peerId -> WebSocket
    this.connections = new Map(); // peerId -> connection info
    this.port = options.port || 8080;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.maxConnections = options.maxConnections || 100;
  }

  async connect(peerId, options) {
    try {
      if (options.isServer) {
        await this.startServer();
      } else {
        await this.connectToServer(peerId, options.url);
      }
      return true;
    } catch (error) {
      transportLogger.error('WebSocket connection failed', { peerId, error: error.message });
      return false;
    }
  }

  async startServer() {
    if (this.server) return;

    this.server = new WebSocket.Server({ 
      port: this.port,
      maxPayload: 1024 * 1024 // 1MB max message size
    });

    this.server.on('connection', (ws, request) => {
      const peerId = request.headers['x-peer-id'] || `peer-${Date.now()}`;
      
      if (this.clients.size >= this.maxConnections) {
        ws.close(1013, 'Server at capacity');
        return;
      }

      this.clients.set(peerId, ws);
      this.connections.set(peerId, {
        connectedAt: Date.now(),
        lastPing: Date.now(),
        transport: 'websocket'
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.emit('message', peerId, message);
        } catch (error) {
          transportLogger.warn('Invalid message received', { peerId, error: error.message });
        }
      });

      ws.on('close', () => {
        this.clients.delete(peerId);
        this.connections.delete(peerId);
        this.emit('peerDisconnected', peerId);
      });

      ws.on('pong', () => {
        const connection = this.connections.get(peerId);
        if (connection) {
          connection.lastPing = Date.now();
        }
      });

      this.emit('peerConnected', peerId);
      transportLogger.info('WebSocket peer connected', { peerId });
    });

    this.startHeartbeat();
    transportLogger.info('WebSocket server started', { port: this.port });
  }

  async connectToServer(peerId, url) {
    const ws = new WebSocket(url, {
      headers: {
        'x-peer-id': peerId
      }
    });

    return new Promise((resolve, reject) => {
      ws.on('open', () => {
        this.clients.set(peerId, ws);
        this.connections.set(peerId, {
          connectedAt: Date.now(),
          lastPing: Date.now(),
          transport: 'websocket',
          url
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.emit('message', peerId, message);
          } catch (error) {
            transportLogger.warn('Invalid message received', { peerId, error: error.message });
          }
        });

        ws.on('close', () => {
          this.clients.delete(peerId);
          this.connections.delete(peerId);
          this.emit('peerDisconnected', peerId);
        });

        this.emit('peerConnected', peerId);
        resolve(true);
      });

      ws.on('error', reject);
    });
  }

  async send(peerId, message) {
    const ws = this.clients.get(peerId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      transportLogger.error('Failed to send WebSocket message', { peerId, error: error.message });
      return false;
    }
  }

  disconnect(peerId) {
    const ws = this.clients.get(peerId);
    if (ws) {
      ws.close();
      this.clients.delete(peerId);
      this.connections.delete(peerId);
    }
  }

  getConnectedPeers() {
    return Array.from(this.clients.keys());
  }

  startHeartbeat() {
    setInterval(() => {
      const now = Date.now();
      for (const [peerId, ws] of this.clients) {
        const connection = this.connections.get(peerId);
        if (connection && now - connection.lastPing > this.heartbeatInterval * 2) {
          // Peer is unresponsive
          ws.close();
          continue;
        }

        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }
    }, this.heartbeatInterval);
  }
}

/**
 * WebRTC Transport for direct peer-to-peer communication
 */
class WebRTCTransport extends Transport {
  constructor(options = {}) {
    super('webrtc');
    this.connections = new Map(); // peerId -> RTCPeerConnection
    this.dataChannels = new Map(); // peerId -> RTCDataChannel
    this.configuration = {
      iceServers: options.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };
  }

  async connect(peerId, options) {
    try {
      const pc = new RTCPeerConnection(this.configuration);
      this.connections.set(peerId, pc);

      // Create data channel for gossip messages
      const dataChannel = pc.createDataChannel('gossip', {
        ordered: true,
        maxRetransmits: 3
      });

      this.setupDataChannel(peerId, dataChannel);
      this.dataChannels.set(peerId, dataChannel);

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.emit('iceCandidate', peerId, event.candidate);
        }
      };

      // Handle incoming data channels
      pc.ondatachannel = (event) => {
        this.setupDataChannel(peerId, event.channel);
      };

      if (options.isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.emit('offer', peerId, offer);
      }

      return true;
    } catch (error) {
      transportLogger.error('WebRTC connection failed', { peerId, error: error.message });
      return false;
    }
  }

  setupDataChannel(peerId, dataChannel) {
    dataChannel.onopen = () => {
      this.emit('peerConnected', peerId);
      transportLogger.info('WebRTC peer connected', { peerId });
    };

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit('message', peerId, message);
      } catch (error) {
        transportLogger.warn('Invalid WebRTC message received', { peerId, error: error.message });
      }
    };

    dataChannel.onclose = () => {
      this.dataChannels.delete(peerId);
      this.emit('peerDisconnected', peerId);
    };
  }

  async handleOffer(peerId, offer) {
    const pc = this.connections.get(peerId);
    if (!pc) return;

    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.emit('answer', peerId, answer);
  }

  async handleAnswer(peerId, answer) {
    const pc = this.connections.get(peerId);
    if (!pc) return;

    await pc.setRemoteDescription(answer);
  }

  async handleIceCandidate(peerId, candidate) {
    const pc = this.connections.get(peerId);
    if (!pc) return;

    await pc.addIceCandidate(candidate);
  }

  async send(peerId, message) {
    const dataChannel = this.dataChannels.get(peerId);
    if (!dataChannel || dataChannel.readyState !== 'open') {
      return false;
    }

    try {
      dataChannel.send(JSON.stringify(message));
      return true;
    } catch (error) {
      transportLogger.error('Failed to send WebRTC message', { peerId, error: error.message });
      return false;
    }
  }

  disconnect(peerId) {
    const pc = this.connections.get(peerId);
    if (pc) {
      pc.close();
      this.connections.delete(peerId);
    }
    this.dataChannels.delete(peerId);
  }

  getConnectedPeers() {
    return Array.from(this.dataChannels.keys()).filter(
      peerId => this.dataChannels.get(peerId)?.readyState === 'open'
    );
  }
}

/**
 * Bluetooth Transport for proximity device sync
 */
class BluetoothTransport extends Transport {
  constructor(options = {}) {
    super('bluetooth');
    this.devices = new Map(); // deviceId -> device info
    this.serviceUUID = options.serviceUUID || '12345678-1234-1234-1234-123456789abc';
    this.characteristicUUID = options.characteristicUUID || '87654321-4321-4321-4321-cba987654321';
    this.scanning = false;
  }

  async connect(peerId, options) {
    if (!navigator.bluetooth) {
      transportLogger.warn('Bluetooth not supported in this environment');
      return false;
    }

    try {
      if (options.startScanning) {
        await this.startScanning();
      } else {
        await this.connectToDevice(peerId, options.deviceId);
      }
      return true;
    } catch (error) {
      transportLogger.error('Bluetooth connection failed', { peerId, error: error.message });
      return false;
    }
  }

  async startScanning() {
    if (this.scanning) return;

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this.serviceUUID] }],
        optionalServices: [this.serviceUUID]
      });

      await this.connectToDevice(device.id, device.id);
      this.scanning = true;
    } catch (error) {
      transportLogger.error('Bluetooth scanning failed', { error: error.message });
    }
  }

  async connectToDevice(peerId, deviceId) {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this.serviceUUID] }]
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(this.serviceUUID);
      const characteristic = await service.getCharacteristic(this.characteristicUUID);

      this.devices.set(peerId, {
        device,
        server,
        service,
        characteristic,
        connectedAt: Date.now()
      });

      // Listen for notifications
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const data = new TextDecoder().decode(event.target.value);
        try {
          const message = JSON.parse(data);
          this.emit('message', peerId, message);
        } catch (error) {
          transportLogger.warn('Invalid Bluetooth message received', { peerId, error: error.message });
        }
      });

      this.emit('peerConnected', peerId);
      transportLogger.info('Bluetooth peer connected', { peerId });
    } catch (error) {
      transportLogger.error('Failed to connect to Bluetooth device', { peerId, error: error.message });
      throw error;
    }
  }

  async send(peerId, message) {
    const deviceInfo = this.devices.get(peerId);
    if (!deviceInfo) return false;

    try {
      const data = new TextEncoder().encode(JSON.stringify(message));
      await deviceInfo.characteristic.writeValue(data);
      return true;
    } catch (error) {
      transportLogger.error('Failed to send Bluetooth message', { peerId, error: error.message });
      return false;
    }
  }

  disconnect(peerId) {
    const deviceInfo = this.devices.get(peerId);
    if (deviceInfo) {
      deviceInfo.server.disconnect();
      this.devices.delete(peerId);
      this.emit('peerDisconnected', peerId);
    }
  }

  getConnectedPeers() {
    return Array.from(this.devices.keys());
  }
}

/**
 * Multi-Transport Manager with automatic fallback
 */
export class NetworkTransportManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.transports = new Map();
    this.peerTransports = new Map(); // peerId -> preferred transport
    this.fallbackOrder = options.fallbackOrder || ['websocket', 'webrtc', 'bluetooth'];
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    this.initializeTransports(options);
    this.setupEventHandlers();
    
    transportLogger.info('Network Transport Manager initialized', {
      transports: this.fallbackOrder
    });
  }

  initializeTransports(options) {
    // Initialize WebSocket transport
    this.transports.set('websocket', new WebSocketTransport(options.websocket));
    
    // Initialize WebRTC transport  
    this.transports.set('webrtc', new WebRTCTransport(options.webrtc));
    
    // Initialize Bluetooth transport
    this.transports.set('bluetooth', new BluetoothTransport(options.bluetooth));
  }

  setupEventHandlers() {
    for (const [transportType, transport] of this.transports) {
      transport.on('message', (peerId, message) => {
        this.emit('message', peerId, message);
      });

      transport.on('peerConnected', (peerId) => {
        this.peerTransports.set(peerId, transportType);
        this.emit('peerConnected', peerId, transportType);
      });

      transport.on('peerDisconnected', (peerId) => {
        this.emit('peerDisconnected', peerId, transportType);
        this.attemptReconnection(peerId);
      });
    }
  }

  async connectToPeer(peerId, options = {}) {
    const preferredTransport = options.transport || this.fallbackOrder[0];
    
    // Try preferred transport first
    if (await this.tryConnect(peerId, preferredTransport, options)) {
      return true;
    }

    // Try fallback transports
    for (const transportType of this.fallbackOrder) {
      if (transportType === preferredTransport) continue;
      
      if (await this.tryConnect(peerId, transportType, options)) {
        return true;
      }
    }

    transportLogger.error('Failed to connect to peer on any transport', { peerId });
    return false;
  }

  async tryConnect(peerId, transportType, options) {
    const transport = this.transports.get(transportType);
    if (!transport) return false;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const success = await transport.connect(peerId, options);
        if (success) {
          transportLogger.info('Successfully connected to peer', { 
            peerId, 
            transport: transportType, 
            attempt 
          });
          return true;
        }
      } catch (error) {
        transportLogger.warn('Connection attempt failed', { 
          peerId, 
          transport: transportType, 
          attempt, 
          error: error.message 
        });
      }

      if (attempt < this.retryAttempts) {
        await this.delay(this.retryDelay * attempt);
      }
    }

    return false;
  }

  async sendToPeer(peerId, message) {
    const transportType = this.peerTransports.get(peerId);
    if (!transportType) {
      transportLogger.warn('No transport found for peer', { peerId });
      return false;
    }

    const transport = this.transports.get(transportType);
    const success = await transport.send(peerId, message);

    if (!success) {
      // Try fallback transports
      for (const fallbackType of this.fallbackOrder) {
        if (fallbackType === transportType) continue;
        
        const fallbackTransport = this.transports.get(fallbackType);
        if (fallbackTransport.getConnectedPeers().includes(peerId)) {
          const fallbackSuccess = await fallbackTransport.send(peerId, message);
          if (fallbackSuccess) {
            this.peerTransports.set(peerId, fallbackType);
            return true;
          }
        }
      }
    }

    return success;
  }

  async attemptReconnection(peerId) {
    transportLogger.info('Attempting to reconnect to peer', { peerId });
    
    // Wait a bit before reconnecting
    await this.delay(2000);
    
    // Try to reconnect using any available transport
    await this.connectToPeer(peerId);
  }

  disconnectPeer(peerId) {
    for (const transport of this.transports.values()) {
      transport.disconnect(peerId);
    }
    this.peerTransports.delete(peerId);
  }

  getAllConnectedPeers() {
    const allPeers = new Set();
    for (const transport of this.transports.values()) {
      for (const peerId of transport.getConnectedPeers()) {
        allPeers.add(peerId);
      }
    }
    return Array.from(allPeers);
  }

  getTransportForPeer(peerId) {
    return this.peerTransports.get(peerId);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
