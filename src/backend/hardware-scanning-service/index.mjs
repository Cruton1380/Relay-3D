/**
 * @fileoverview Hardware Scanning Service - Real Bluetooth and WiFi detection
 * Replaces mock detection with actual hardware scanning using platform APIs
 */
import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import { spawn } from 'child_process';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';
// import signalOwnership from '../channel-service/signalOwnership.mjs';

class HardwareScanningService {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.port = process.env.HARDWARE_SERVICE_PORT || 4001;
      // Scanning state
    this.isScanning = false;
    this.scanInterval = null;
    this.scanDuration = 30000; // 30 seconds
    this.scanFrequency = 5000; // Every 5 seconds when active
    
    // Scan configuration
    this.scanConfig = {
      interval: 5000,
      duration: 30000,
      bluetoothEnabled: true,
      wifiEnabled: true
    };
    
    // Device tracking
    this.detectedDevices = new Map(); // deviceId -> device data
    this.deviceHistory = new Map(); // deviceId -> Array(detection history)
    this.macAddressHashes = new Map(); // original MAC -> hashed MAC
    
    // Connection management
    this.connections = new Map(); // userId -> WebSocket
    this.subscribedUsers = new Set(); // Users receiving scan updates
      // Signal ownership and verification
    this.signalStateHistory = new Map(); // deviceId -> Array of state changes
    this.powerCycleDetectors = new Map(); // challengeId -> detector config    // Cleanup interval for expired data
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
      // signalOwnership.cleanup();
    }, 60000); // Every minute
    
    // Platform detection
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.isMacOS = this.platform === 'darwin';
    this.isLinux = this.platform === 'linux';
    
    // File paths
    this.dataDir = path.join(process.cwd(), 'data', 'hardware');
    this.devicesFile = path.join(this.dataDir, 'detected-devices.json');
    this.historyFile = path.join(this.dataDir, 'device-history.json');
    
    this.setupExpress();
    this.setupWebSocket();
  }

  async initialize() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadData();
      await this.initializePlatformTools();
      
      console.log(`Hardware Scanning Service initialized on ${this.platform}`);
      return this;
    } catch (error) {
      console.error('Failed to initialize Hardware Scanning Service:', error);
      throw error;
    }
  }

  async initializePlatformTools() {
    // Check for required tools based on platform
    if (this.isLinux) {
      await this.checkLinuxTools();
    } else if (this.isWindows) {
      await this.checkWindowsTools();
    } else if (this.isMacOS) {
      await this.checkMacOSTools();
    }
  }

  async checkLinuxTools() {
    try {
      // Check for bluetoothctl
      await this.execCommand('which bluetoothctl');
      
      // Check for iwlist (WiFi scanning)
      await this.execCommand('which iwlist');
      
      // Check for hcitool (Bluetooth scanning)
      await this.execCommand('which hcitool');
      
      console.log('Linux scanning tools verified');
    } catch (error) {
      console.warn('Some Linux scanning tools not available:', error.message);
      console.warn('Install: sudo apt-get install bluetooth bluez-utils wireless-tools');
    }
  }
  async checkWindowsTools() {
    // Windows uses PowerShell for WiFi and Bluetooth scanning
    try {
      console.log('🔍 Checking Windows PowerShell tools...');
      await this.execCommand('Get-Command Get-NetAdapter');
      console.log('✅ Windows PowerShell tools verified');
    } catch (error) {
      console.warn('⚠️ PowerShell tools not fully available:', error.message);
      // Don't throw - continue anyway
    }
  }

  async checkMacOSTools() {
    try {
      // Check for airport (WiFi scanning)
      await this.execCommand('which airport');
      console.log('macOS scanning tools verified');
    } catch (error) {
      console.warn('macOS airport tool not available, using system_profiler');
    }
  }
  setupExpress() {
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', this.healthCheck.bind(this));

    // Scanning control endpoints
    this.app.post('/api/hardware/scan/start', this.startScanning.bind(this));
    this.app.post('/api/hardware/scan/stop', this.stopScanning.bind(this));
    this.app.get('/api/hardware/scan/status', this.getScanStatus.bind(this));
    
    // Device endpoints
    this.app.get('/api/hardware/devices', this.getDetectedDevices.bind(this));
    this.app.get('/api/hardware/devices/:deviceId/history', this.getDeviceHistory.bind(this));
    this.app.delete('/api/hardware/devices/clear', this.clearDeviceHistory.bind(this));
      // Configuration endpoints
    this.app.put('/api/hardware/config', this.updateScanConfig.bind(this));
    this.app.get('/api/hardware/config', this.getScanConfig.bind(this));
    
    // Signal ownership endpoints
    this.app.post('/api/hardware/ownership/challenge', this.createOwnershipChallenge.bind(this));
    this.app.get('/api/hardware/ownership/challenge/:challengeId', this.getOwnershipChallenge.bind(this));
    this.app.post('/api/hardware/ownership/verify', this.verifySignalOwnership.bind(this));
    this.app.get('/api/hardware/ownership/summary/:userId', this.getOwnershipSummary.bind(this));
    this.app.post('/api/hardware/channels/designate-official', this.designateOfficialChannel.bind(this));
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleWebSocketMessage(ws, message);
        } catch (error) {
          console.error('Hardware WebSocket message error:', error);
          this.sendWebSocketError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('Hardware WebSocket error:', error);
      });
    });
  }

  async handleWebSocketMessage(ws, message) {
    const { type, data } = message;

    switch (type) {
      case 'authenticate':
        await this.authenticateUser(ws, data);
        break;
      case 'subscribe_scans':
        await this.subscribeToScans(ws, data);
        break;
      case 'unsubscribe_scans':
        await this.unsubscribeFromScans(ws, data);
        break;
      default:
        this.sendWebSocketError(ws, `Unknown message type: ${type}`);
    }
  }

  async authenticateUser(ws, data) {
    const { userId, token } = data;
    
    try {
      if (!userId || !token) {
        throw new Error('Missing credentials');
      }

      ws.userId = userId;
      this.connections.set(userId, ws);
      
      this.sendWebSocketMessage(ws, 'authenticated', { success: true, userId });
      
      console.log(`User ${userId} authenticated in Hardware Scanning Service`);
    } catch (error) {
      this.sendWebSocketError(ws, `Authentication failed: ${error.message}`);
    }
  }

  async subscribeToScans(ws, data) {
    const userId = ws.userId;
    if (!userId) {
      this.sendWebSocketError(ws, 'Not authenticated');
      return;
    }

    this.subscribedUsers.add(userId);
    this.sendWebSocketMessage(ws, 'scan_subscription', { subscribed: true });
    
    console.log(`User ${userId} subscribed to hardware scans`);
  }

  async unsubscribeFromScans(ws, data) {
    const userId = ws.userId;
    if (!userId) return;

    this.subscribedUsers.delete(userId);
    this.sendWebSocketMessage(ws, 'scan_subscription', { subscribed: false });
    
    console.log(`User ${userId} unsubscribed from hardware scans`);
  }

  async startScanning(req, res) {
    try {
      if (this.isScanning) {
        return res.status(400).json({ error: 'Scanning already in progress' });
      }

      this.isScanning = true;
      
      // Start periodic scanning
      this.scanInterval = setInterval(async () => {
        await this.performScan();
      }, this.scanFrequency);

      // Perform initial scan
      await this.performScan();
      
      console.log('Hardware scanning started');
      
      res.json({ success: true, scanning: true });
    } catch (error) {
      console.error('Failed to start scanning:', error);
      this.isScanning = false;
      res.status(500).json({ error: 'Failed to start scanning' });
    }
  }

  async stopScanning(req, res) {
    try {
      this.isScanning = false;
      
      if (this.scanInterval) {
        clearInterval(this.scanInterval);
        this.scanInterval = null;
      }
      
      console.log('Hardware scanning stopped');
      
      res.json({ success: true, scanning: false });
    } catch (error) {
      console.error('Failed to stop scanning:', error);
      res.status(500).json({ error: 'Failed to stop scanning' });
    }
  }

  async performScan() {
    try {
      const scanResults = {
        bluetooth: await this.scanBluetooth(),
        wifi: await this.scanWiFi(),
        timestamp: Date.now()
      };

      // Process and store results
      await this.processDetectedDevices(scanResults);
        // Broadcast to subscribed users
      this.broadcastScanResults(scanResults);
        // Check for power cycling detection
      await this.checkPowerCycling(scanResults);
      
      console.log(`Scan completed: ${scanResults.bluetooth.length} BT, ${scanResults.wifi.length} WiFi`);
    } catch (error) {
      console.error('Scan failed:', error);
    }
  }

  async scanBluetooth() {
    const devices = [];

    try {
      if (this.isLinux) {
        devices.push(...await this.scanBluetoothLinux());
      } else if (this.isWindows) {
        devices.push(...await this.scanBluetoothWindows());
      } else if (this.isMacOS) {
        devices.push(...await this.scanBluetoothMacOS());
      }
    } catch (error) {
      console.warn('Bluetooth scan failed:', error.message);
    }

    return devices;
  }

  async scanBluetoothLinux() {
    const devices = [];

    try {
      // Use hcitool to scan for nearby Bluetooth devices
      const output = await this.execCommand('timeout 10 hcitool scan', { timeout: 15000 });
      const lines = output.split('\n');
      
      for (const line of lines) {
        const match = line.match(/([0-9A-F:]{17})\s+(.+)/);
        if (match) {
          const [, macAddress, name] = match;
          const hashedMac = this.hashMacAddress(macAddress);
          
          devices.push({
            type: 'bluetooth',
            macAddress: hashedMac,
            originalMac: macAddress,
            name: name.trim(),
            rssi: null, // hcitool scan doesn't provide RSSI
            timestamp: Date.now()
          });
        }
      }      // Alternative: Use bluetoothctl for more detailed info
      try {
        const btOutput = await this.execCommand('timeout 10 bluetoothctl scan on && sleep 8 && bluetoothctl devices', { timeout: 15000 });
        // Parse bluetoothctl output for additional device info
      } catch (btError) {
        console.debug('bluetoothctl scan failed:', btError.message);
      }

    } catch (error) {
      console.warn('Linux Bluetooth scan error:', error.message);
    }

    return devices;
  }

  async scanBluetoothWindows() {
    const devices = [];

    try {
      // Use PowerShell to scan for Bluetooth devices
      const psScript = `
        Get-PnpDevice | Where-Object {
          $_.Class -eq "Bluetooth" -and $_.Status -eq "OK"
        } | Select-Object FriendlyName, InstanceId
      `;
      
      const output = await this.execCommand(`powershell.exe -Command "${psScript}"`);
      const lines = output.split('\n');
      
      for (const line of lines) {
        if (line.includes('BTHENUM')) {
          // Extract device info from Windows Bluetooth enumeration
          const name = line.split(/\s+/)[0] || 'Unknown Device';
          const hashedMac = this.hashMacAddress(`BT:${crypto.randomBytes(6).toString('hex')}`);
          
          devices.push({
            type: 'bluetooth',
            macAddress: hashedMac,
            name: name.trim(),
            rssi: null,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.warn('Windows Bluetooth scan error:', error.message);
    }

    return devices;
  }

  async scanBluetoothMacOS() {
    const devices = [];

    try {
      // Use system_profiler to get Bluetooth device info
      const output = await this.execCommand('system_profiler SPBluetoothDataType -json');
      const data = JSON.parse(output);
      
      const bluetoothData = data.SPBluetoothDataType?.[0];
      if (bluetoothData?.device_connected) {
        for (const [deviceName, deviceInfo] of Object.entries(bluetoothData.device_connected)) {
          const hashedMac = this.hashMacAddress(`BT:${crypto.randomBytes(6).toString('hex')}`);
          
          devices.push({
            type: 'bluetooth',
            macAddress: hashedMac,
            name: deviceName,
            rssi: null,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.warn('macOS Bluetooth scan error:', error.message);
    }

    return devices;
  }

  async scanWiFi() {
    const networks = [];

    try {
      if (this.isLinux) {
        networks.push(...await this.scanWiFiLinux());
      } else if (this.isWindows) {
        networks.push(...await this.scanWiFiWindows());
      } else if (this.isMacOS) {
        networks.push(...await this.scanWiFiMacOS());
      }
    } catch (error) {
      console.warn('WiFi scan failed:', error.message);
    }

    return networks;
  }

  async scanWiFiLinux() {
    const networks = [];

    try {
      // Use iwlist to scan for WiFi networks
      const output = await this.execCommand('iwlist scan', { timeout: 15000 });
      const blocks = output.split('Cell ').slice(1);
      
      for (const block of blocks) {
        const lines = block.split('\n');
        let macAddress = null;
        let ssid = null;
        let signal = null;
        
        for (const line of lines) {
          const trimmed = line.trim();
          
          if (trimmed.includes('Address:')) {
            const match = trimmed.match(/Address: ([0-9A-F:]{17})/);
            if (match) macAddress = match[1];
          } else if (trimmed.includes('ESSID:')) {
            const match = trimmed.match(/ESSID:"([^"]+)"/);
            if (match) ssid = match[1];
          } else if (trimmed.includes('Signal level')) {
            const match = trimmed.match(/Signal level=(-?\d+)/);
            if (match) signal = parseInt(match[1]);
          }
        }
        
        if (macAddress) {
          const hashedMac = this.hashMacAddress(macAddress);
          
          networks.push({
            type: 'wifi',
            macAddress: hashedMac,
            originalMac: macAddress,
            ssid: ssid || 'Hidden Network',
            signal: signal,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.warn('Linux WiFi scan error:', error.message);
    }

    return networks;
  }

  async scanWiFiWindows() {
    const networks = [];

    try {
      // Use netsh to scan for WiFi networks
      const output = await this.execCommand('netsh wlan show profiles');
      const profiles = output.match(/All User Profile\s*:\s*(.+)/g) || [];
      
      for (const profile of profiles) {
        const ssid = profile.replace(/All User Profile\s*:\s*/, '').trim();
        
        try {
          const detailOutput = await this.execCommand(`netsh wlan show profile name="${ssid}" key=clear`);
          // Extract BSSID if available
          const bssidMatch = detailOutput.match(/BSSID\s*:\s*([0-9A-F:]{17})/);
          
          if (bssidMatch) {
            const hashedMac = this.hashMacAddress(bssidMatch[1]);
            
            networks.push({
              type: 'wifi',
              macAddress: hashedMac,
              originalMac: bssidMatch[1],
              ssid: ssid,
              signal: null,
              timestamp: Date.now()
            });
          }
        } catch (detailError) {
          // Skip if we can't get details for this profile
        }
      }
    } catch (error) {
      console.warn('Windows WiFi scan error:', error.message);
    }

    return networks;
  }

  async scanWiFiMacOS() {
    const networks = [];

    try {
      // Use airport to scan for WiFi networks
      const output = await this.execCommand('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s');
      const lines = output.split('\n').slice(1); // Skip header
      
      for (const line of lines) {
        if (line.trim()) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 6) {
            const ssid = parts[0];
            const bssid = parts[1];
            const signal = parseInt(parts[2]);
            
            if (bssid.match(/[0-9a-f:]{17}/i)) {
              const hashedMac = this.hashMacAddress(bssid);
              
              networks.push({
                type: 'wifi',
                macAddress: hashedMac,
                originalMac: bssid,
                ssid: ssid,
                signal: signal,
                timestamp: Date.now()
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('macOS WiFi scan error:', error.message);
    }

    return networks;
  }

  hashMacAddress(macAddress) {
    // Use a consistent hash for privacy while maintaining detectability
    const existing = this.macAddressHashes.get(macAddress);
    if (existing) return existing;
    
    const hash = crypto.createHash('sha256').update(macAddress).digest('hex').substring(0, 12);
    const formatted = hash.match(/.{2}/g).join(':').toUpperCase();
    
    this.macAddressHashes.set(macAddress, formatted);
    return formatted;
  }

  async processDetectedDevices(scanResults) {
    const allDevices = [...scanResults.bluetooth, ...scanResults.wifi];
    
    for (const device of allDevices) {
      const deviceId = `${device.type}:${device.macAddress}`;
      
      // Update device record
      if (this.detectedDevices.has(deviceId)) {
        const existing = this.detectedDevices.get(deviceId);
        existing.lastSeen = device.timestamp;
        existing.detectionCount = (existing.detectionCount || 1) + 1;
        
        if (device.signal !== null) {
          existing.signal = device.signal;
        }
      } else {
        this.detectedDevices.set(deviceId, {
          ...device,
          deviceId,
          firstSeen: device.timestamp,
          lastSeen: device.timestamp,
          detectionCount: 1
        });
      }
      
      // Update history
      if (!this.deviceHistory.has(deviceId)) {
        this.deviceHistory.set(deviceId, []);
      }
      
      const history = this.deviceHistory.get(deviceId);
      history.push({
        timestamp: device.timestamp,
        signal: device.signal
      });
      
      // Keep only last 100 detections per device
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
    }
    
    await this.saveData();
  }

  broadcastScanResults(scanResults) {
    for (const userId of this.subscribedUsers) {
      const ws = this.connections.get(userId);
      if (ws && ws.readyState === 1) {
        this.sendWebSocketMessage(ws, 'scan_results', scanResults);
      }
    }
  }
  async execCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      // Use appropriate shell based on platform
      let shell, shellArgs;
      if (this.isWindows) {
        shell = 'powershell.exe';
        shellArgs = ['-Command', command];
      } else {
        shell = 'sh';
        shellArgs = ['-c', command];
      }
      
      const child = spawn(shell, shellArgs, {
        timeout: options.timeout || 10000
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async getDetectedDevices(req, res) {
    try {
      const { type, since } = req.query;
      
      let devices = Array.from(this.detectedDevices.values());
      
      if (type) {
        devices = devices.filter(device => device.type === type);
      }
      
      if (since) {
        const sinceTime = parseInt(since);
        devices = devices.filter(device => device.lastSeen >= sinceTime);
      }
      
      res.json({ devices, count: devices.length });
    } catch (error) {
      console.error('Failed to get detected devices:', error);
      res.status(500).json({ error: 'Failed to get detected devices' });
    }
  }

  async getScanConfig(req, res) {
    try {
      res.json({
        config: this.scanConfig,
        isScanning: this.isScanning,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to get scan config:', error);
      res.status(500).json({ error: 'Failed to get scan config' });
    }
  }

  async updateScanConfig(req, res) {
    try {
      const { interval, duration, bluetoothEnabled, wifiEnabled } = req.body;
      
      if (interval !== undefined) {
        this.scanConfig.interval = Math.max(1000, parseInt(interval));
        this.scanFrequency = this.scanConfig.interval;
      }
      
      if (duration !== undefined) {
        this.scanConfig.duration = Math.max(5000, parseInt(duration));
        this.scanDuration = this.scanConfig.duration;
      }
      
      if (bluetoothEnabled !== undefined) {
        this.scanConfig.bluetoothEnabled = Boolean(bluetoothEnabled);
      }
      
      if (wifiEnabled !== undefined) {
        this.scanConfig.wifiEnabled = Boolean(wifiEnabled);
      }

      // Restart scanning with new config if active
      if (this.isScanning) {
        if (this.scanInterval) {
          clearInterval(this.scanInterval);
        }
        
        this.scanInterval = setInterval(async () => {
          await this.performScan();
        }, this.scanFrequency);
      }

      res.json({ 
        success: true, 
        config: this.scanConfig,
        message: 'Scan configuration updated successfully'
      });
    } catch (error) {
      console.error('Failed to update scan config:', error);
      res.status(500).json({ error: 'Failed to update scan config' });
    }
  }

  async getScanStatus(req, res) {
    try {
      res.json({
        isScanning: this.isScanning,
        config: this.scanConfig,
        deviceCount: this.detectedDevices.size,
        subscribedUsers: this.subscribedUsers.size,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to get scan status:', error);
      res.status(500).json({ error: 'Failed to get scan status' });
    }
  }

  async getDeviceHistory(req, res) {
    try {
      const { deviceId } = req.params;
      const { limit = 100 } = req.query;
      
      const history = this.deviceHistory.get(deviceId) || [];
      const limitedHistory = history.slice(-limit);
      
      res.json({ 
        deviceId, 
        history: limitedHistory,
        count: limitedHistory.length,
        total: history.length
      });
    } catch (error) {
      console.error('Failed to get device history:', error);
      res.status(500).json({ error: 'Failed to get device history' });
    }
  }

  async clearDeviceHistory(req, res) {
    try {
      this.detectedDevices.clear();
      this.deviceHistory.clear();
      this.macAddressHashes.clear();
      
      await this.saveData();
      
      res.json({ 
        success: true, 
        message: 'Device history cleared successfully' 
      });
    } catch (error) {
      console.error('Failed to clear device history:', error);
      res.status(500).json({ error: 'Failed to clear device history' });
    }
  }

  sendWebSocketMessage(ws, type, data) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type, data }));
    }
  }

  sendWebSocketError(ws, message) {
    this.sendWebSocketMessage(ws, 'error', { message });
  }

  handleDisconnection(ws) {
    if (ws.userId) {
      this.connections.delete(ws.userId);
      this.subscribedUsers.delete(ws.userId);
      console.log(`User ${ws.userId} disconnected from Hardware Scanning Service`);
    }
  }

  async loadData() {
    try {
      const devicesData = await fs.readFile(this.devicesFile, 'utf8').catch(() => '{}');
      const devices = JSON.parse(devicesData);
      
      for (const [deviceId, device] of Object.entries(devices)) {
        this.detectedDevices.set(deviceId, device);
      }

      const historyData = await fs.readFile(this.historyFile, 'utf8').catch(() => '{}');
      const history = JSON.parse(historyData);
      
      for (const [deviceId, deviceHistory] of Object.entries(history)) {
        this.deviceHistory.set(deviceId, deviceHistory);
      }

      console.log(`Loaded ${this.detectedDevices.size} detected devices`);
    } catch (error) {
      console.error('Failed to load hardware data:', error);
    }
  }

  async saveData() {
    try {
      const devicesData = {};
      for (const [deviceId, device] of this.detectedDevices.entries()) {
        devicesData[deviceId] = device;
      }
      await fs.writeFile(this.devicesFile, JSON.stringify(devicesData, null, 2));

      const historyData = {};
      for (const [deviceId, history] of this.deviceHistory.entries()) {
        historyData[deviceId] = history;
      }
      await fs.writeFile(this.historyFile, JSON.stringify(historyData, null, 2));
    } catch (error) {
      console.error('Failed to save hardware data:', error);
    }
  }

  async healthCheck(req, res) {
    try {
      const status = {
        service: 'Hardware Scanning Service',
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        version: '1.0.0',
        platform: this.platform,
        isScanning: this.isScanning,
        detectedDevices: this.detectedDevices.size,
        subscribedUsers: this.subscribedUsers.size,
        activeConnections: this.connections.size,
        scanInterval: this.scanConfig.interval,
        bluetoothSupported: this.isLinux || this.isMacOS,
        wifiSupported: this.isLinux || this.isWindows || this.isMacOS
      };

      res.json(status);
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        service: 'Hardware Scanning Service',
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now()
      });
    }
  }  start() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`Hardware Scanning Service running on port ${this.port}`);
          resolve();
        }
      });
    });
  }
  
  // Signal Ownership API Methods
  
  /**
   * Create ownership challenge for a signal
   */
  async createOwnershipChallenge(req, res) {
    try {
      const { userId, signalId, signalType } = req.body;
      
      if (!userId || !signalId || !signalType) {
        return res.status(400).json({ 
          error: 'Missing required fields: userId, signalId, signalType' 
        });
      }
      
      if (!['bluetooth', 'wifi'].includes(signalType)) {
        return res.status(400).json({ 
          error: 'Invalid signalType. Must be bluetooth or wifi' 
        });
      }
      
      const challenge = await signalOwnership.createOwnershipChallenge(
        userId, 
        signalId, 
        signalType
      );
      
      // Start monitoring for power cycling
      this.startPowerCycleMonitoring(challenge.challengeId, signalId);
      
      res.json({
        success: true,
        challenge
      });
      
    } catch (error) {
      console.error('Failed to create ownership challenge:', error);
      res.status(500).json({ error: 'Failed to create ownership challenge' });
    }
  }
  
  /**
   * Get ownership challenge status
   */
  async getOwnershipChallenge(req, res) {
    try {
      const { challengeId } = req.params;
      
      const challenge = signalOwnership.signalChallenges.get(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }
      
      // Don't expose sensitive data
      const sanitizedChallenge = {
        id: challenge.id,
        signalId: challenge.signalId,
        signalType: challenge.signalType,
        status: challenge.status,
        startTime: challenge.startTime,
        expiresAt: challenge.expiresAt,
        powerCycleCount: challenge.powerCycleCount,
        requiredCycles: challenge.requiredCycles,
        instructions: challenge.instructions
      };
      
      res.json({
        success: true,
        challenge: sanitizedChallenge
      });
      
    } catch (error) {
      console.error('Failed to get ownership challenge:', error);
      res.status(500).json({ error: 'Failed to get ownership challenge' });
    }
  }
  
  /**
   * Verify signal ownership through power cycling
   */
  async verifySignalOwnership(req, res) {
    try {
      const { challengeId } = req.body;
      
      if (!challengeId) {
        return res.status(400).json({ error: 'Missing challengeId' });
      }
      
      const challenge = signalOwnership.signalChallenges.get(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }
      
      // Get detected power cycling states for this signal
      const signalStateHistory = this.signalStateHistory.get(challenge.signalId) || [];
      
      // Filter states to challenge timeframe
      const challengeStates = signalStateHistory.filter(state => 
        state.timestamp >= challenge.startTime && 
        state.timestamp <= Date.now()
      );
      
      const verification = await signalOwnership.verifyPowerCycling(
        challengeId,
        challengeStates
      );
      
      // Stop monitoring for this challenge
      this.stopPowerCycleMonitoring(challengeId);
      
      res.json({
        success: true,
        verification
      });
      
    } catch (error) {
      console.error('Failed to verify signal ownership:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Get user's signal ownership summary
   */
  async getOwnershipSummary(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
      }
      
      const summary = signalOwnership.getUserOwnershipSummary(userId);
      
      res.json({
        success: true,
        summary
      });
      
    } catch (error) {
      console.error('Failed to get ownership summary:', error);
      res.status(500).json({ error: 'Failed to get ownership summary' });
    }
  }
  
  /**
   * Designate channel as official using signal ownership proofs
   */
  async designateOfficialChannel(req, res) {
    try {
      const { channelId, userId, signalProofs } = req.body;
      
      if (!channelId || !userId || !Array.isArray(signalProofs)) {
        return res.status(400).json({ 
          error: 'Missing required fields: channelId, userId, signalProofs (array)' 
        });
      }
      
      const designation = await signalOwnership.designateOfficialChannel(
        channelId,
        userId,
        signalProofs
      );
      
      res.json({
        success: true,
        designation
      });
      
    } catch (error) {
      console.error('Failed to designate official channel:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Power Cycling Detection Methods
  
  /**
   * Start monitoring a signal for power cycling
   */
  startPowerCycleMonitoring(challengeId, signalId) {
    this.powerCycleDetectors.set(challengeId, {
      signalId,
      startTime: Date.now(),
      lastState: null,
      stateChanges: []
    });
    
    console.log(`Started power cycle monitoring for challenge ${challengeId}, signal ${signalId}`);
  }
  
  /**
   * Stop monitoring a signal for power cycling
   */
  stopPowerCycleMonitoring(challengeId) {
    this.powerCycleDetectors.delete(challengeId);
    console.log(`Stopped power cycle monitoring for challenge ${challengeId}`);
  }
  
  /**
   * Check for power cycling patterns in scan results
   */
  async checkPowerCycling(scanResults) {
    try {
      const allDevices = [...scanResults.bluetooth, ...scanResults.wifi];
      const currentTime = Date.now();
      
      // Track current device states
      const currentStates = new Map();
      for (const device of allDevices) {
        const deviceId = `${device.type}:${device.macAddress}`;
        currentStates.set(deviceId, 'on');
      }
      
      // Check each monitored signal for state changes
      for (const [challengeId, detector] of this.powerCycleDetectors) {
        const signalId = detector.signalId;
        const currentState = currentStates.get(signalId) || 'off';
        
        // If state changed from previous scan
        if (detector.lastState !== null && detector.lastState !== currentState) {
          const stateChange = {
            timestamp: currentTime,
            state: currentState,
            previousState: detector.lastState
          };
          
          detector.stateChanges.push(stateChange);
          
          // Store in signal state history
          if (!this.signalStateHistory.has(signalId)) {
            this.signalStateHistory.set(signalId, []);
          }
          
          this.signalStateHistory.get(signalId).push(stateChange);
          
          console.log(`Power cycle detected for ${signalId}: ${detector.lastState} → ${currentState}`);
          
          // Notify challenge about state change
          const challenge = signalOwnership.signalChallenges.get(challengeId);
          if (challenge) {
            challenge.powerCycleCount++;
          }
        }
        
        detector.lastState = currentState;
      }
      
    } catch (error) {
      console.error('Error checking power cycling:', error);
    }
  }
  
  /**
   * Clean up old data
   */
  cleanupOldData() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    // Clean old signal state history
    for (const [signalId, history] of this.signalStateHistory) {
      const recentHistory = history.filter(state => 
        (now - state.timestamp) < maxAge
      );
      
      if (recentHistory.length !== history.length) {
        this.signalStateHistory.set(signalId, recentHistory);
      }
    }
    
    // Clean old power cycle detectors (expired challenges)
    for (const [challengeId, detector] of this.powerCycleDetectors) {
      if ((now - detector.startTime) > 10 * 60 * 1000) { // 10 minutes max
        this.powerCycleDetectors.delete(challengeId);
      }
    }
  }
}

// Start service if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting Hardware Scanning Service...');
  
  const service = new HardwareScanningService();
  
  service.initialize()
    .then(() => {
      console.log('✅ Service initialized successfully');
      console.log('🌐 Starting HTTP server...');
      return service.start();
    })
    .then(() => {
      console.log(`🎉 Hardware Scanning Service ready on port ${service.port}!`);
      console.log(`📡 WebSocket server ready`);
      console.log(`🔗 Health check: http://localhost:${service.port}/health`);
    })
    .catch(error => {
      console.error('❌ Failed to start Hardware Scanning Service:', error);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    });
}

export default HardwareScanningService;
