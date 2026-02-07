/**
 * State Drift Detection Engine
 * Monitors billions of devices for state drift, categorizes threats,
 * and triggers automated countermeasures
 */

import EventEmitter from 'events';
import crypto from 'crypto';

export class StateDriftEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.deviceRegistry = new Map(); // Billions of devices tracked
    this.driftSensors = new Map();
    this.kpiRegistry = new Map();
    this.alertThresholds = options.thresholds || this.getDefaultThresholds();
    this.scanInterval = options.scanInterval || 100; // ms between device scans
    this.batchSize = options.batchSize || 10000; // devices per batch
    
    // State drift categories
    this.driftCategories = {
      EXPLOIT_DETECTED: 'exploit_detected',
      PERMISSION_SPLINTER: 'permission_splinter',
      UNAUTHORIZED_ACCESS: 'unauthorized_access',
      STATE_CORRUPTION: 'state_corruption',
      CONFIGURATION_DRIFT: 'configuration_drift',
      RESOURCE_HIJACK: 'resource_hijack'
    };
    
    // Initialize sensors
    this.initializeSensors();
    this.initializeKPIs();
    
    // Stats
    this.stats = {
      totalDevices: 0,
      devicesScanned: 0,
      driftDetected: 0,
      exploitsBlocked: 0,
      correctiveActionsTaken: 0,
      lastScanTime: null,
      scanRate: 0
    };
    
    this.isRunning = false;
  }

  /**
   * Initialize state drift sensors
   */
  initializeSensors() {
    // Permission drift sensor
    this.registerSensor('permission_drift', {
      name: 'Permission Drift Detector',
      category: 'security',
      scan: (device) => this.detectPermissionDrift(device),
      severity: 'high',
      autoCorrect: true
    });

    // Active Directory splinter sensor
    this.registerSensor('ad_splinter', {
      name: 'Active Directory Splinter Detector',
      category: 'identity',
      scan: (device) => this.detectADSplinter(device),
      severity: 'critical',
      autoCorrect: true
    });

    // Exploit pattern sensor
    this.registerSensor('exploit_pattern', {
      name: 'Exploit Pattern Detector',
      category: 'security',
      scan: (device) => this.detectExploitPattern(device),
      severity: 'critical',
      autoCorrect: true,
      escalate: true
    });

    // Desktop control drift sensor
    this.registerSensor('desktop_control', {
      name: 'Desktop Control State Monitor',
      category: 'control',
      scan: (device) => this.detectDesktopControlDrift(device),
      severity: 'medium',
      autoCorrect: true
    });

    // Video playback hijack sensor
    this.registerSensor('video_hijack', {
      name: 'Video Playback Hijack Detector',
      category: 'media',
      scan: (device) => this.detectVideoHijack(device),
      severity: 'high',
      autoCorrect: true
    });

    // Configuration drift sensor
    this.registerSensor('config_drift', {
      name: 'Configuration Drift Monitor',
      category: 'configuration',
      scan: (device) => this.detectConfigDrift(device),
      severity: 'medium',
      autoCorrect: true
    });

    // Resource state sensor
    this.registerSensor('resource_state', {
      name: 'Resource State Monitor',
      category: 'resources',
      scan: (device) => this.detectResourceDrift(device),
      severity: 'low',
      autoCorrect: false
    });
  }

  /**
   * Initialize KPIs and monitoring ratios
   */
  initializeKPIs() {
    // Drift detection rate
    this.registerKPI('drift_detection_rate', {
      name: 'Drift Detection Rate',
      unit: 'drifts/second',
      calculate: () => this.stats.driftDetected / this.getUptime(),
      threshold: { warning: 10, critical: 100 },
      alertable: true
    });

    // Exploit suppression ratio
    this.registerKPI('exploit_suppression_ratio', {
      name: 'Exploit Suppression Ratio',
      unit: 'ratio',
      calculate: () => {
        const detected = this.stats.driftDetected;
        const blocked = this.stats.exploitsBlocked;
        return detected > 0 ? blocked / detected : 1.0;
      },
      threshold: { warning: 0.95, critical: 0.90 },
      alertable: true
    });

    // Device scan throughput
    this.registerKPI('scan_throughput', {
      name: 'Device Scan Throughput',
      unit: 'devices/second',
      calculate: () => this.stats.scanRate,
      threshold: { warning: 100000, critical: 50000 },
      alertable: true
    });

    // Corrective action success rate
    this.registerKPI('correction_success_rate', {
      name: 'Corrective Action Success Rate',
      unit: 'ratio',
      calculate: () => {
        const taken = this.stats.correctiveActionsTaken;
        const detected = this.stats.driftDetected;
        return detected > 0 ? taken / detected : 0;
      },
      threshold: { warning: 0.98, critical: 0.95 },
      alertable: true
    });

    // AD splinter detection ratio
    this.registerKPI('ad_splinter_ratio', {
      name: 'AD Splinter Detection Ratio',
      unit: 'ratio',
      calculate: () => {
        const total = this.stats.totalDevices;
        const splinters = this.countDriftByCategory('PERMISSION_SPLINTER');
        return total > 0 ? splinters / total : 0;
      },
      threshold: { warning: 0.01, critical: 0.05 },
      alertable: true
    });

    // Silent takeover success rate
    this.registerKPI('silent_takeover_rate', {
      name: 'Silent Takeover Success Rate',
      unit: 'ratio',
      calculate: () => {
        const attempts = this.getTakeoverAttempts();
        const silent = this.getSilentTakeovers();
        return attempts > 0 ? silent / attempts : 1.0;
      },
      threshold: { warning: 0.99, critical: 0.95 },
      alertable: true
    });

    // Device classification coverage
    this.registerKPI('classification_coverage', {
      name: 'Device Classification Coverage',
      unit: 'ratio',
      calculate: () => {
        const total = this.stats.totalDevices;
        const classified = this.getClassifiedDevices();
        return total > 0 ? classified / total : 0;
      },
      threshold: { warning: 0.99, critical: 0.95 },
      alertable: true
    });
  }

  /**
   * Register a new sensor
   */
  registerSensor(id, config) {
    this.driftSensors.set(id, {
      id,
      ...config,
      lastScan: null,
      detectionsCount: 0,
      falsePositives: 0
    });
  }

  /**
   * Register a new KPI
   */
  registerKPI(id, config) {
    this.kpiRegistry.set(id, {
      id,
      ...config,
      history: [],
      lastValue: null,
      lastCalculation: null
    });
  }

  /**
   * Register a device in the system
   */
  registerDevice(deviceId, metadata = {}) {
    if (this.deviceRegistry.has(deviceId)) {
      return this.deviceRegistry.get(deviceId);
    }

    const device = {
      deviceId,
      class: this.classifyDevice(metadata),
      type: this.determineDeviceType(metadata),
      state: {
        baseline: this.captureBaselineState(metadata),
        current: null,
        driftDetected: false,
        driftType: null,
        lastScan: null,
        scanCount: 0
      },
      metadata: {
        ...metadata,
        registeredAt: Date.now(),
        lastSeen: Date.now()
      },
      controls: {
        desktopControl: false,
        videoControl: false,
        adminAccess: false,
        silentMode: true
      },
      threat: {
        level: 'none',
        category: null,
        detectedAt: null,
        mitigated: false
      }
    };

    this.deviceRegistry.set(deviceId, device);
    this.stats.totalDevices++;
    
    this.emit('device:registered', { deviceId, device });
    
    return device;
  }

  /**
   * Classify device into class (for efficient management)
   */
  classifyDevice(metadata) {
    const { os, role, location, network } = metadata;
    
    // High-performance classification for billions of devices
    const classifier = [
      os?.toLowerCase() || 'unknown',
      role?.toLowerCase() || 'workstation',
      this.getLocationClass(location),
      this.getNetworkClass(network)
    ].join(':');
    
    return classifier;
  }

  /**
   * Determine specific device type
   */
  determineDeviceType(metadata) {
    if (metadata.type) return metadata.type;
    
    const { os, form_factor } = metadata;
    
    if (os?.includes('Windows')) {
      if (form_factor === 'desktop') return 'windows_desktop';
      if (form_factor === 'laptop') return 'windows_laptop';
      if (metadata.role === 'server') return 'windows_server';
    }
    
    if (os?.includes('macOS')) return 'macos_workstation';
    if (os?.includes('Linux')) return 'linux_workstation';
    if (os?.includes('iOS')) return 'ios_mobile';
    if (os?.includes('Android')) return 'android_mobile';
    
    return 'unknown';
  }

  /**
   * Start continuous state drift monitoring
   */
  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();
    
    console.log(`🔍 State Drift Engine started - monitoring ${this.stats.totalDevices} devices`);
    
    // Start continuous scanning
    this.scanLoop();
    
    // Start KPI monitoring
    this.kpiMonitoringLoop();
    
    this.emit('engine:started');
  }

  /**
   * Stop the drift engine
   */
  stop() {
    this.isRunning = false;
    this.emit('engine:stopped');
  }

  /**
   * Main scan loop - processes devices in batches
   */
  async scanLoop() {
    while (this.isRunning) {
      const startTime = Date.now();
      let scannedInBatch = 0;

      // Get batch of devices to scan
      const deviceBatch = this.getNextDeviceBatch();
      
      // Scan devices in parallel batches
      const scanPromises = deviceBatch.map(device => this.scanDevice(device));
      await Promise.allSettled(scanPromises);
      
      scannedInBatch = deviceBatch.length;
      this.stats.devicesScanned += scannedInBatch;
      
      // Calculate scan rate
      const elapsed = Date.now() - startTime;
      this.stats.scanRate = (scannedInBatch / elapsed) * 1000; // devices per second
      this.stats.lastScanTime = Date.now();
      
      // Adaptive delay based on load
      const delay = this.calculateAdaptiveDelay(elapsed, scannedInBatch);
      if (delay > 0) {
        await this.sleep(delay);
      }
    }
  }

  /**
   * Get next batch of devices to scan
   */
  getNextDeviceBatch() {
    const devices = Array.from(this.deviceRegistry.values());
    
    // Priority scan: devices with detected drift or high threat
    const priority = devices
      .filter(d => d.state.driftDetected || d.threat.level !== 'none')
      .slice(0, Math.floor(this.batchSize * 0.2));
    
    // Regular scan: oldest scanned devices
    const regular = devices
      .filter(d => !d.state.driftDetected && d.threat.level === 'none')
      .sort((a, b) => (a.state.lastScan || 0) - (b.state.lastScan || 0))
      .slice(0, this.batchSize - priority.length);
    
    return [...priority, ...regular];
  }

  /**
   * Scan a single device for state drift
   */
  async scanDevice(device) {
    try {
      device.state.lastScan = Date.now();
      device.state.scanCount++;
      device.metadata.lastSeen = Date.now();

      // Capture current state
      device.state.current = this.captureCurrentState(device);

      // Run all sensors
      const sensorResults = [];
      for (const [sensorId, sensor] of this.driftSensors) {
        try {
          const result = await sensor.scan(device);
          if (result.driftDetected) {
            sensorResults.push({ sensorId, sensor, result });
            sensor.detectionsCount++;
            sensor.lastScan = Date.now();
          }
        } catch (error) {
          // Sensor failure - log but continue
          console.error(`Sensor ${sensorId} failed for device ${device.deviceId}:`, error.message);
        }
      }

      // Process drift detections
      if (sensorResults.length > 0) {
        await this.processDriftDetections(device, sensorResults);
      } else if (device.state.driftDetected) {
        // Clear drift if no longer detected
        device.state.driftDetected = false;
        device.state.driftType = null;
        device.threat.level = 'none';
        device.threat.category = null;
        this.emit('drift:cleared', { deviceId: device.deviceId });
      }

    } catch (error) {
      console.error(`Failed to scan device ${device.deviceId}:`, error.message);
    }
  }

  /**
   * Process detected drift and trigger corrective actions
   */
  async processDriftDetections(device, sensorResults) {
    // Mark drift detected
    device.state.driftDetected = true;
    this.stats.driftDetected++;

    // Determine highest severity
    const maxSeverity = this.getMaxSeverity(sensorResults);
    const criticalSensors = sensorResults.filter(s => s.sensor.severity === 'critical');
    
    // Categorize drift
    const driftCategory = this.categorizeDrift(sensorResults);
    device.state.driftType = driftCategory;
    device.threat.category = driftCategory;
    device.threat.level = maxSeverity;
    device.threat.detectedAt = Date.now();

    // Emit drift detection event
    this.emit('drift:detected', {
      deviceId: device.deviceId,
      driftCategory,
      severity: maxSeverity,
      sensors: sensorResults.map(s => s.sensorId)
    });

    // Trigger auto-correction for enabled sensors
    const autoCorrectSensors = sensorResults.filter(s => s.sensor.autoCorrect);
    if (autoCorrectSensors.length > 0) {
      await this.executeCorrectiveActions(device, autoCorrectSensors);
    }

    // Escalate critical threats
    if (criticalSensors.length > 0) {
      this.escalateThreat(device, criticalSensors);
    }
  }

  /**
   * Execute corrective actions for detected drift
   */
  async executeCorrectiveActions(device, sensorResults) {
    for (const { sensorId, sensor, result } of sensorResults) {
      try {
        // Execute sensor-specific correction
        await this.executeCorrection(device, sensor, result);
        
        this.stats.correctiveActionsTaken++;
        device.threat.mitigated = true;
        
        this.emit('correction:executed', {
          deviceId: device.deviceId,
          sensorId,
          correction: result.correction
        });
        
      } catch (error) {
        console.error(`Failed to execute correction for ${device.deviceId}:`, error.message);
        
        this.emit('correction:failed', {
          deviceId: device.deviceId,
          sensorId,
          error: error.message
        });
      }
    }
  }

  /**
   * Escalate critical threats for immediate response
   */
  escalateThreat(device, criticalSensors) {
    const escalation = {
      deviceId: device.deviceId,
      device,
      sensors: criticalSensors.map(s => ({
        id: s.sensorId,
        name: s.sensor.name,
        result: s.result
      })),
      timestamp: Date.now(),
      requiresImmediate: true
    };

    this.emit('threat:escalated', escalation);
    
    // Trigger mass suppression if exploit pattern detected
    if (criticalSensors.some(s => s.sensorId === 'exploit_pattern')) {
      this.stats.exploitsBlocked++;
      this.emit('exploit:blocked', escalation);
    }
  }

  /**
   * KPI monitoring loop
   */
  async kpiMonitoringLoop() {
    while (this.isRunning) {
      await this.sleep(5000); // Calculate KPIs every 5 seconds
      
      for (const [kpiId, kpi] of this.kpiRegistry) {
        try {
          const value = kpi.calculate();
          kpi.lastValue = value;
          kpi.lastCalculation = Date.now();
          
          // Store in history
          kpi.history.push({ timestamp: Date.now(), value });
          if (kpi.history.length > 1000) {
            kpi.history.shift();
          }
          
          // Check thresholds
          if (kpi.alertable && kpi.threshold) {
            this.checkKPIThreshold(kpiId, kpi, value);
          }
          
        } catch (error) {
          console.error(`Failed to calculate KPI ${kpiId}:`, error.message);
        }
      }
    }
  }

  /**
   * Check KPI against thresholds and emit alerts
   */
  checkKPIThreshold(kpiId, kpi, value) {
    const { warning, critical } = kpi.threshold;
    
    if (critical !== undefined && value < critical) {
      this.emit('kpi:critical', { kpiId, kpi: kpi.name, value, threshold: critical });
    } else if (warning !== undefined && value < warning) {
      this.emit('kpi:warning', { kpiId, kpi: kpi.name, value, threshold: warning });
    }
  }

  // Sensor implementations

  detectPermissionDrift(device) {
    // Simulate permission drift detection
    const baseline = device.state.baseline?.permissions || [];
    const current = device.state.current?.permissions || [];
    
    const added = current.filter(p => !baseline.includes(p));
    const removed = baseline.filter(p => !current.includes(p));
    
    const driftDetected = added.length > 0 || removed.length > 0;
    
    return {
      driftDetected,
      severity: driftDetected ? 'high' : 'none',
      details: { added, removed },
      correction: driftDetected ? 'restore_permissions' : null
    };
  }

  detectADSplinter(device) {
    // Detect Active Directory role/permission splinters
    const roles = device.state.current?.adRoles || [];
    const expectedRoles = device.metadata.expectedRoles || [];
    
    const splinters = roles.filter(r => !expectedRoles.includes(r));
    const driftDetected = splinters.length > 0;
    
    return {
      driftDetected,
      severity: driftDetected ? 'critical' : 'none',
      details: { splinters, roles, expectedRoles },
      correction: driftDetected ? 'fix_ad_roles' : null
    };
  }

  detectExploitPattern(device) {
    // Detect exploit attack patterns
    const patterns = device.state.current?.processPatterns || [];
    const suspiciousPatterns = patterns.filter(p => this.isSuspiciousPattern(p));
    
    const driftDetected = suspiciousPatterns.length > 0;
    
    return {
      driftDetected,
      severity: driftDetected ? 'critical' : 'none',
      details: { patterns: suspiciousPatterns },
      correction: driftDetected ? 'terminate_suspicious_processes' : null
    };
  }

  detectDesktopControlDrift(device) {
    // Monitor desktop control state
    const controlState = device.state.current?.desktopControl || {};
    const expectedState = device.metadata.expectedDesktopControl || {};
    
    const driftDetected = JSON.stringify(controlState) !== JSON.stringify(expectedState);
    
    return {
      driftDetected,
      severity: driftDetected ? 'medium' : 'none',
      details: { current: controlState, expected: expectedState },
      correction: driftDetected ? 'restore_desktop_control' : null
    };
  }

  detectVideoHijack(device) {
    // Detect video playback hijacking
    const videoProcesses = device.state.current?.videoProcesses || [];
    const authorizedProcesses = device.metadata.authorizedVideoProcesses || [];
    
    const unauthorized = videoProcesses.filter(p => !authorizedProcesses.includes(p.name));
    const driftDetected = unauthorized.length > 0;
    
    return {
      driftDetected,
      severity: driftDetected ? 'high' : 'none',
      details: { unauthorized },
      correction: driftDetected ? 'terminate_unauthorized_video' : null
    };
  }

  detectConfigDrift(device) {
    // Detect configuration drift
    const config = device.state.current?.configuration || {};
    const baseline = device.state.baseline?.configuration || {};
    
    const diffs = this.deepDiff(config, baseline);
    const driftDetected = Object.keys(diffs).length > 0;
    
    return {
      driftDetected,
      severity: driftDetected ? 'medium' : 'none',
      details: { diffs },
      correction: driftDetected ? 'restore_configuration' : null
    };
  }

  detectResourceDrift(device) {
    // Monitor resource utilization drift
    const resources = device.state.current?.resources || {};
    const baseline = device.state.baseline?.resources || {};
    
    const cpuDrift = Math.abs((resources.cpu || 0) - (baseline.cpu || 0)) > 20;
    const memDrift = Math.abs((resources.memory || 0) - (baseline.memory || 0)) > 20;
    
    const driftDetected = cpuDrift || memDrift;
    
    return {
      driftDetected,
      severity: driftDetected ? 'low' : 'none',
      details: { cpuDrift, memDrift, current: resources, baseline },
      correction: null // No auto-correction for resource drift
    };
  }

  // Helper methods

  captureBaselineState(metadata) {
    return {
      permissions: metadata.permissions || [],
      adRoles: metadata.adRoles || [],
      configuration: metadata.configuration || {},
      resources: metadata.resources || {},
      timestamp: Date.now()
    };
  }

  captureCurrentState(device) {
    // In production, this would query actual device state
    // For now, simulate with slight variations
    return {
      permissions: device.state.baseline?.permissions || [],
      adRoles: device.state.baseline?.adRoles || [],
      processPatterns: [],
      desktopControl: device.metadata.expectedDesktopControl || {},
      videoProcesses: [],
      configuration: device.state.baseline?.configuration || {},
      resources: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100
      },
      timestamp: Date.now()
    };
  }

  async executeCorrection(device, sensor, result) {
    // Execute correction based on type
    const { correction } = result;
    
    switch (correction) {
      case 'restore_permissions':
        await this.restorePermissions(device);
        break;
      case 'fix_ad_roles':
        await this.fixADRoles(device);
        break;
      case 'terminate_suspicious_processes':
        await this.terminateSuspiciousProcesses(device);
        break;
      case 'restore_desktop_control':
        await this.restoreDesktopControl(device);
        break;
      case 'terminate_unauthorized_video':
        await this.terminateUnauthorizedVideo(device);
        break;
      case 'restore_configuration':
        await this.restoreConfiguration(device);
        break;
    }
  }

  async restorePermissions(device) {
    // Silently restore permissions to baseline
    device.state.current.permissions = [...device.state.baseline.permissions];
  }

  async fixADRoles(device) {
    // Fix Active Directory role splinters
    device.state.current.adRoles = [...device.metadata.expectedRoles];
  }

  async terminateSuspiciousProcesses(device) {
    // Terminate processes matching exploit patterns
    device.state.current.processPatterns = [];
  }

  async restoreDesktopControl(device) {
    // Restore desktop control to expected state
    device.state.current.desktopControl = { ...device.metadata.expectedDesktopControl };
    device.controls.desktopControl = true;
  }

  async terminateUnauthorizedVideo(device) {
    // Terminate unauthorized video processes
    device.state.current.videoProcesses = device.state.current.videoProcesses.filter(
      p => device.metadata.authorizedVideoProcesses?.includes(p.name)
    );
    device.controls.videoControl = true;
  }

  async restoreConfiguration(device) {
    // Restore configuration to baseline
    device.state.current.configuration = { ...device.state.baseline.configuration };
  }

  isSuspiciousPattern(pattern) {
    const suspiciousPatterns = [
      'mimikatz',
      'psexec',
      'powershell -enc',
      'cmd.exe /c',
      'wscript.exe'
    ];
    return suspiciousPatterns.some(p => pattern.toLowerCase().includes(p));
  }

  categorizeDrift(sensorResults) {
    if (sensorResults.some(s => s.sensorId === 'exploit_pattern')) {
      return this.driftCategories.EXPLOIT_DETECTED;
    }
    if (sensorResults.some(s => s.sensorId === 'ad_splinter')) {
      return this.driftCategories.PERMISSION_SPLINTER;
    }
    if (sensorResults.some(s => s.sensorId === 'permission_drift')) {
      return this.driftCategories.UNAUTHORIZED_ACCESS;
    }
    if (sensorResults.some(s => s.sensorId === 'config_drift')) {
      return this.driftCategories.CONFIGURATION_DRIFT;
    }
    if (sensorResults.some(s => s.sensorId === 'video_hijack' || s.sensorId === 'desktop_control')) {
      return this.driftCategories.RESOURCE_HIJACK;
    }
    return this.driftCategories.STATE_CORRUPTION;
  }

  getMaxSeverity(sensorResults) {
    const severities = ['none', 'low', 'medium', 'high', 'critical'];
    const maxIndex = Math.max(...sensorResults.map(s => severities.indexOf(s.sensor.severity)));
    return severities[maxIndex];
  }

  countDriftByCategory(category) {
    return Array.from(this.deviceRegistry.values()).filter(
      d => d.state.driftType === category
    ).length;
  }

  getTakeoverAttempts() {
    return Array.from(this.deviceRegistry.values()).filter(
      d => d.controls.adminAccess
    ).length;
  }

  getSilentTakeovers() {
    return Array.from(this.deviceRegistry.values()).filter(
      d => d.controls.adminAccess && d.controls.silentMode
    ).length;
  }

  getClassifiedDevices() {
    return Array.from(this.deviceRegistry.values()).filter(
      d => d.class !== 'unknown:workstation:unknown:unknown'
    ).length;
  }

  getLocationClass(location) {
    if (!location) return 'unknown';
    return location.region || location.country || 'unknown';
  }

  getNetworkClass(network) {
    if (!network) return 'unknown';
    return network.type || 'unknown';
  }

  deepDiff(obj1, obj2) {
    const diffs = {};
    for (const key in obj1) {
      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        diffs[key] = { current: obj1[key], baseline: obj2[key] };
      }
    }
    return diffs;
  }

  calculateAdaptiveDelay(elapsed, scanned) {
    // Adaptive delay to maintain target scan rate
    const targetRate = 100000; // 100k devices/second
    const targetElapsed = (scanned / targetRate) * 1000;
    return Math.max(0, targetElapsed - elapsed);
  }

  getUptime() {
    return this.startTime ? (Date.now() - this.startTime) / 1000 : 1;
  }

  getDefaultThresholds() {
    return {
      driftDetectionRate: { warning: 10, critical: 100 },
      exploitSuppressionRatio: { warning: 0.95, critical: 0.90 },
      scanThroughput: { warning: 100000, critical: 50000 }
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current KPI values
   */
  getKPIs() {
    const kpis = {};
    for (const [kpiId, kpi] of this.kpiRegistry) {
      kpis[kpiId] = {
        name: kpi.name,
        value: kpi.lastValue,
        unit: kpi.unit,
        lastCalculation: kpi.lastCalculation,
        threshold: kpi.threshold
      };
    }
    return kpis;
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      ...this.stats,
      uptime: this.getUptime(),
      kpis: this.getKPIs()
    };
  }

  /**
   * Get devices by category
   */
  getDevicesByCategory(category) {
    return Array.from(this.deviceRegistry.values()).filter(
      d => d.state.driftType === category
    );
  }

  /**
   * Get devices by threat level
   */
  getDevicesByThreatLevel(level) {
    return Array.from(this.deviceRegistry.values()).filter(
      d => d.threat.level === level
    );
  }
}

export default StateDriftEngine;
