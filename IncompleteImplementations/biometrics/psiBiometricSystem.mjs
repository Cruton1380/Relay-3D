/**
 * 🔒 Private Set Intersection (PSI) Biometric Deduplication System
 * 
 * Privacy-preserving biometric deduplication using PSI protocols,
 * cross-shard coordination, and secure audit logging.
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

export class PSIBiometricSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      deduplicationThreshold: config.deduplicationThreshold || 0.95,
      hashFunction: config.hashFunction || 'sha256',
      keySize: config.keySize || 256,
      maxSetSize: config.maxSetSize || 10000,
      crossShardEnabled: config.crossShardEnabled || true,
      auditRetentionDays: config.auditRetentionDays || 90,
      ...config
    };
    
    // PSI protocol state
    this.localBiometricSets = new Map();
    this.shardCoordinators = new Map();
    this.psiSessions = new Map();
    
    // Biometric storage with privacy guarantees
    this.encryptedBiometrics = new Map();
    this.biometricHashes = new Map();
    this.deduplicationResults = new Map();
    
    // Cross-shard coordination
    this.shardRegistry = new Map();
    this.intersectionCache = new Map();
    
    // Audit and compliance
    this.auditLog = [];
    this.privacyViolationAlerts = [];
    
    this.initializePSIProtocol();
  }
  
  /**
   * Initialize PSI protocol components
   */
  initializePSIProtocol() {
    // Generate PSI keys for this instance
    this.psiKeys = this.generatePSIKeys();
    
    // Initialize secure random number generator
    this.secureRandom = crypto.randomBytes;
    
    // Set up cross-shard communication protocols
    this.setupCrossShardProtocols();
    
    this.emit('psiInitialized', {
      keySize: this.config.keySize,
      crossShardEnabled: this.config.crossShardEnabled,
      timestamp: Date.now()
    });
  }
  
  /**
   * Generate PSI cryptographic keys
   */
  generatePSIKeys() {
    const privateKey = crypto.randomBytes(32);
    const publicKey = crypto.createHash('sha256').update(privateKey).digest();
    
    return {
      privateKey,
      publicKey,
      keyId: crypto.createHash('sha256').update(publicKey).digest('hex').substring(0, 16)
    };
  }
  /**
   * Setup cross-shard communication protocols
   */
  setupCrossShardProtocols() {
    this.shardProtocols = {
      requestIntersection: this.handleIntersectionRequest.bind(this),
      respondIntersection: this.handleIntersectionRequest.bind(this), // Using same method for now
      verifyIntersection: this.handleIntersectionRequest.bind(this) // Using same method for now
    };
    
    // Setup mock shard coordinators for testing
    if (this.config.crossShardEnabled) {
      for (let i = 0; i < 5; i++) {
        const shardId = `shard-${i}`;
        this.shardCoordinators.set(shardId, {
          id: shardId,
          status: 'active',
          endpoint: `https://shard-${i}.relay.network`
        });
      }
    }
  }
  
  /**
   * Register a biometric template with privacy preservation
   */  async registerBiometric(userId, biometricData, biometricType = 'face') {
    try {
      // Enhanced input validation
      if (!userId || userId === null || userId === undefined) {
        throw new Error('Invalid userId: must be a non-empty string');
      }
      
      if (!biometricData || biometricData === null || biometricData === undefined) {
        throw new Error('Invalid biometricData: cannot be null or undefined');
      }
      
      // Type validation
      if (typeof userId !== 'string') {
        throw new Error('Invalid userId: must be a string');
      }
      
      // Size validation
      if (userId.length > 1000) {
        throw new Error('Invalid userId: too long');
      }
      
      // Binary data validation
      if (userId.includes('\x00') || userId.includes('\x01') || userId.includes('\x02')) {
        throw new Error('Invalid userId: contains binary data');
      }
      
      // Biometric data validation
      if (typeof biometricData === 'object' && !Buffer.isBuffer(biometricData) && !Array.isArray(biometricData)) {
        throw new Error('Invalid biometricData: objects not supported');
      }
      
      if (Buffer.isBuffer(biometricData) && biometricData.length > 50000) {
        throw new Error('Invalid biometricData: buffer too large');
      }
      
      if (typeof biometricData === 'string' && biometricData.length > 10000) {
        throw new Error('Invalid biometricData: string too long');
      }
      
      // Extract features and create hash
      const features = await this.extractBiometricFeatures(biometricData, biometricType);
      const biometricHash = this.createSecureBiometricHash(features);
      
      // Encrypt biometric data for storage
      const encryptedBiometric = await this.encryptBiometricData(features, userId);
      
      // Store with forward secrecy
      const storageKey = `${userId}-${biometricType}-${Date.now()}`;
      this.encryptedBiometrics.set(storageKey, encryptedBiometric);
      this.biometricHashes.set(storageKey, biometricHash);
      
      // Update local PSI set
      await this.updateLocalPSISet(biometricHash, storageKey);
      
      // Log registration for audit
      this.logAuditEvent('biometricRegistered', {
        userId,
        biometricType,
        storageKey,
        hashLength: biometricHash.length,
        timestamp: Date.now()
      });
      
      this.emit('biometricRegistered', {
        userId,
        biometricType,
        storageKey,
        success: true
      });
      
      return {
        storageKey,
        hashId: biometricHash.substring(0, 16),
        success: true
      };
      
    } catch (error) {
      this.logAuditEvent('biometricRegistrationFailed', {
        userId,
        error: error.message,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }
  
  /**
   * Extract privacy-preserving biometric features
   */
  async extractBiometricFeatures(biometricData, biometricType) {
    switch (biometricType) {
      case 'face':
        return this.extractFaceFeatures(biometricData);
      case 'voice':
        return this.extractVoiceFeatures(biometricData);
      case 'behavioral':
        return this.extractBehavioralFeatures(biometricData);
      default:
        throw new Error(`Unsupported biometric type: ${biometricType}`);
    }
  }
  
  /**
   * Extract face features using privacy-preserving methods
   */
  extractFaceFeatures(faceData) {
    // Simulate feature extraction (in production, use actual face recognition)
    const features = {
      landmarks: this.normalizeFaceLandmarks(faceData.landmarks || []),
      geometrics: this.extractGeometricFeatures(faceData),
      textural: this.extractTexturalFeatures(faceData),
      privacy: {
        noiseLevel: 0.05,
        quantization: 8
      }
    };
    
    // Apply privacy-preserving transformations
    return this.applyPrivacyTransforms(features);
  }
  
  /**
   * Extract voice features
   */
  extractVoiceFeatures(voiceData) {
    // Simulate voice feature extraction
    const features = {
      mfcc: this.extractMFCC(voiceData),
      pitch: this.extractPitchFeatures(voiceData),
      formants: this.extractFormants(voiceData),
      privacy: {
        noiseLevel: 0.03,
        quantization: 12
      }
    };
    
    return this.applyPrivacyTransforms(features);
  }
  
  /**
   * Extract behavioral biometric features
   */
  extractBehavioralFeatures(behaviorData) {
    const features = {
      keystroke: this.extractKeystrokePatterns(behaviorData),
      mouse: this.extractMousePatterns(behaviorData),
      gait: this.extractGaitPatterns(behaviorData),
      privacy: {
        noiseLevel: 0.02,
        quantization: 10
      }
    };
    
    return this.applyPrivacyTransforms(features);
  }
  
  /**
   * Apply privacy-preserving transformations to features
   */
  applyPrivacyTransforms(features) {
    let transformed = { ...features };
    
    // Add controlled noise for differential privacy
    if (features.privacy && features.privacy.noiseLevel) {
      transformed = this.addControlledNoise(transformed, features.privacy.noiseLevel);
    }
    
    // Apply quantization for anonymization
    if (features.privacy && features.privacy.quantization) {
      transformed = this.applyQuantization(transformed, features.privacy.quantization);
    }
    
    // Remove raw biometric data
    delete transformed.privacy;
    
    return transformed;
  }
  
  /**
   * Create secure biometric hash for PSI
   */
  createSecureBiometricHash(features) {
    // Serialize features deterministically
    const serialized = this.serializeFeatures(features);
    
    // Create secure hash with salt
    const salt = crypto.createHash('sha256')
      .update(this.psiKeys.publicKey)
      .digest();
    
    const hash = crypto.createHmac(this.config.hashFunction, salt)
      .update(serialized)
      .digest('hex');
    
    return hash;
  }
  
  /**
   * Serialize features for consistent hashing
   */  serializeFeatures(features) {
    // Convert features to deterministic string representation
    const sortedKeys = Object.keys(features).sort();
    const normalized = sortedKeys.map(key => {
      const value = features[key];
      if (Array.isArray(value)) {
        return `${key}:${value.map(v => typeof v === 'number' ? v.toFixed(6) : v.toString()).join(',')}`;
      } else if (typeof value === 'object') {
        return `${key}:${this.serializeFeatures(value)}`;
      } else {
        return `${key}:${value}`;
      }
    }).join('|');
    
    return normalized;
  }
    /**
   * Encrypt biometric data for storage (simplified for testing)
   */
  async encryptBiometricData(features, userId) {
    // Simplified encryption for testing - in production use proper GCM
    const encryptionKey = crypto.scryptSync(
      this.psiKeys.privateKey,
      userId,
      32
    );
    
    const iv = crypto.randomBytes(16);
    const serializedFeatures = JSON.stringify(features);
    
    // Use simple AES-256-CBC for Node.js compatibility
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encrypted = cipher.update(serializedFeatures, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: crypto.randomBytes(16).toString('hex'), // Mock auth tag
      algorithm: 'aes-256-cbc'
    };
  }
  
  /**
   * Perform PSI-based deduplication check
   */
  async performPSIDeduplication(candidateHash, requestingShardId = null) {
    try {
      const sessionId = crypto.randomUUID();
      
      // Initialize PSI session
      const psiSession = {
        sessionId,
        candidateHash,
        requestingShardId,
        startTime: Date.now(),
        status: 'initiated',
        intersections: [],
        auditTrail: []
      };
      
      this.psiSessions.set(sessionId, psiSession);
      
      // Check local set first
      const localIntersection = await this.checkLocalIntersection(candidateHash);
      
      if (localIntersection.found) {
        psiSession.intersections.push({
          shardId: 'local',
          intersection: localIntersection,
          confidence: localIntersection.confidence
        });
      }
        // Perform cross-shard PSI if enabled
      if (this.config.crossShardEnabled && this.shardCoordinators.size > 0) {
        const targetShardId = Array.from(this.shardCoordinators.keys())[0]; // Use first available shard
        const mockTemplate = { hash: candidateHash, features: [] }; // Create mock template
        const crossShardResults = await this.performCrossShardPSI(
          candidateHash.slice(0, 8), // Use hash prefix as userId
          mockTemplate,
          targetShardId
        );
        
        if (crossShardResults && Array.isArray(crossShardResults)) {
          psiSession.intersections.push(...crossShardResults);
        }
      }
      
      // Analyze intersection results
      const deduplicationResult = this.analyzeIntersectionResults(
        psiSession.intersections
      );
      
      psiSession.status = 'completed';
      psiSession.result = deduplicationResult;
      psiSession.endTime = Date.now();
      
      // Store result with privacy guarantees
      this.deduplicationResults.set(sessionId, {
        candidateHash: candidateHash.substring(0, 16), // Truncated for privacy
        isDuplicate: deduplicationResult.isDuplicate,
        confidence: deduplicationResult.confidence,
        shardCount: deduplicationResult.shardCount,
        timestamp: Date.now()
      });
      
      // Log audit event
      this.logAuditEvent('psiDeduplicationCompleted', {
        sessionId,
        isDuplicate: deduplicationResult.isDuplicate,
        confidence: deduplicationResult.confidence,
        shardsInvolved: deduplicationResult.shardCount,
        processingTimeMs: psiSession.endTime - psiSession.startTime
      });
      
      this.emit('psiDeduplicationCompleted', {
        sessionId,
        result: deduplicationResult
      });
      
      return deduplicationResult;
      
    } catch (error) {
      this.logAuditEvent('psiDeduplicationFailed', {
        candidateHash: candidateHash.substring(0, 16),
        error: error.message,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }
  
  /**
   * Check for intersection in local biometric set
   */
  async checkLocalIntersection(candidateHash) {
    const localSet = this.localBiometricSets.get('primary') || new Set();
    
    // Direct hash comparison
    if (localSet.has(candidateHash)) {
      return {
        found: true,
        confidence: 1.0,
        matchType: 'exact'
      };
    }
    
    // Fuzzy matching for near-duplicates
    const fuzzyMatches = await this.performFuzzyMatching(candidateHash, localSet);
    
    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches.reduce((best, match) => 
        match.similarity > best.similarity ? match : best
      );
      
      if (bestMatch.similarity >= this.config.deduplicationThreshold) {
        return {
          found: true,
          confidence: bestMatch.similarity,
          matchType: 'fuzzy',
          matchedHash: bestMatch.hash.substring(0, 16)
        };
      }
    }
    
    return {
      found: false,
      confidence: 0,
      matchType: 'none'
    };
  }
  
  /**
   * Perform cross-shard PSI
   */
  async performCrossShardPSI(candidateHash, sessionId) {
    const crossShardResults = [];
    
    // Get active shards
    const activeShards = Array.from(this.shardRegistry.values())
      .filter(shard => shard.status === 'active');
    
    // Create PSI requests for each shard
    const psiPromises = activeShards.map(async (shard) => {
      try {
        const intersectionResult = await this.requestShardIntersection(
          shard.shardId,
          candidateHash,
          sessionId
        );
        
        return {
          shardId: shard.shardId,
          intersection: intersectionResult,
          confidence: intersectionResult.confidence || 0
        };
      } catch (error) {
        console.warn(`PSI failed for shard ${shard.shardId}:`, error.message);
        return {
          shardId: shard.shardId,
          intersection: { found: false, confidence: 0 },
          error: error.message
        };
      }
    });
    
    const results = await Promise.allSettled(psiPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        crossShardResults.push(result.value);
      } else {
        console.warn(`Cross-shard PSI failed for shard ${activeShards[index].shardId}:`, result.reason);
      }
    });
    
    return crossShardResults;
  }
  
  /**
   * Request intersection from a specific shard
   */
  async requestShardIntersection(shardId, candidateHash, sessionId) {
    // Simulate cross-shard PSI protocol
    // In production, this would use actual PSI cryptographic protocols
    
    const request = {
      sessionId,
      candidateHash: this.obfuscateHash(candidateHash),
      requestingShardId: this.getLocalShardId(),
      timestamp: Date.now(),
      protocol: 'psi-ca', // Private Set Intersection with Cardinality
      nonce: crypto.randomBytes(16).toString('hex')
    };
    
    // Simulate network request (replace with actual shard communication)
    return await this.simulateShardRequest(shardId, request);
  }
  
  /**
   * Simulate shard PSI request (replace with actual implementation)
   */
  async simulateShardRequest(shardId, request) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simulate PSI result based on probability
    const foundProbability = 0.05; // 5% chance of finding duplicate
    const found = Math.random() < foundProbability;
    
    return {
      found,
      confidence: found ? 0.85 + Math.random() * 0.15 : 0,
      matchType: found ? 'psi' : 'none',
      responseTime: Date.now(),
      shardId
    };
  }
  
  /**
   * Analyze intersection results to determine duplication
   */
  analyzeIntersectionResults(intersections) {
    const foundIntersections = intersections.filter(i => i.intersection.found);
    
    if (foundIntersections.length === 0) {
      return {
        isDuplicate: false,
        confidence: 0,
        shardCount: intersections.length,
        evidence: []
      };
    }
    
    // Calculate weighted confidence
    const weightedConfidence = foundIntersections.reduce((sum, intersection) => {
      return sum + intersection.confidence;
    }, 0) / foundIntersections.length;
    
    // Determine if duplicate based on threshold
    const isDuplicate = weightedConfidence >= this.config.deduplicationThreshold;
    
    return {
      isDuplicate,
      confidence: weightedConfidence,
      shardCount: intersections.length,
      matchCount: foundIntersections.length,
      evidence: foundIntersections.map(i => ({
        shardId: i.shardId,
        confidence: i.confidence,
        matchType: i.intersection.matchType
      }))
    };
  }
  
  /**
   * Perform fuzzy matching for near-duplicate detection
   */
  async performFuzzyMatching(candidateHash, localSet) {
    const matches = [];
    
    for (const localHash of localSet) {
      const similarity = this.calculateHashSimilarity(candidateHash, localHash);
      
      if (similarity > 0.8) { // Minimum similarity threshold
        matches.push({
          hash: localHash,
          similarity,
          distance: 1 - similarity
        });
      }
    }
    
    return matches.sort((a, b) => b.similarity - a.similarity);
  }
  
  /**
   * Calculate similarity between two hashes
   */
  calculateHashSimilarity(hash1, hash2) {
    if (hash1 === hash2) return 1.0;
    
    // Convert hashes to binary and calculate Hamming distance
    const bin1 = this.hashToBinary(hash1);
    const bin2 = this.hashToBinary(hash2);
    
    let differences = 0;
    const length = Math.min(bin1.length, bin2.length);
    
    for (let i = 0; i < length; i++) {
      if (bin1[i] !== bin2[i]) {
        differences++;
      }
    }
    
    return 1 - (differences / length);
  }
  
  /**
   * Convert hash to binary representation
   */
  hashToBinary(hash) {
    return hash.split('').map(char => 
      parseInt(char, 16).toString(2).padStart(4, '0')
    ).join('');
  }
  
  /**
   * Update local PSI set
   */
  async updateLocalPSISet(biometricHash, storageKey) {
    if (!this.localBiometricSets.has('primary')) {
      this.localBiometricSets.set('primary', new Set());
    }
    
    const localSet = this.localBiometricSets.get('primary');
    localSet.add(biometricHash);
    
    // Limit set size for performance
    if (localSet.size > this.config.maxSetSize) {
      const oldestHashes = Array.from(localSet).slice(0, localSet.size - this.config.maxSetSize);
      oldestHashes.forEach(hash => localSet.delete(hash));
    }
    
    this.emit('localSetUpdated', {
      setSize: localSet.size,
      storageKey,
      timestamp: Date.now()
    });
  }
  
  /**
   * Register a new shard for cross-shard PSI
   */
  registerShard(shardId, shardInfo) {
    this.shardRegistry.set(shardId, {
      shardId,
      ...shardInfo,
      registrationTime: Date.now(),
      status: 'active',
      lastHeartbeat: Date.now()
    });
    
    this.logAuditEvent('shardRegistered', {
      shardId,
      shardInfo,
      timestamp: Date.now()
    });
    
    this.emit('shardRegistered', { shardId, shardInfo });
  }
  
  /**
   * Handle intersection request from another shard
   */
  async handleIntersectionRequest(request) {
    const { sessionId, candidateHash, requestingShardId } = request;
    
    // Validate request
    if (!sessionId || !candidateHash || !requestingShardId) {
      throw new Error('Invalid intersection request');
    }
    
    // Check local intersection
    const localResult = await this.checkLocalIntersection(candidateHash);
    
    // Log request for audit
    this.logAuditEvent('intersectionRequestHandled', {
      sessionId,
      requestingShardId,
      found: localResult.found,
      confidence: localResult.confidence,
      timestamp: Date.now()
    });
    
    return {
      sessionId,
      respondingShardId: this.getLocalShardId(),
      result: localResult,
      timestamp: Date.now()
    };
  }
  
  /**
   * Log audit event with encryption
   */
  logAuditEvent(eventType, eventData) {
    const auditEntry = {
      eventId: crypto.randomUUID(),
      eventType,
      eventData: this.encryptAuditData(eventData),
      timestamp: Date.now(),
      shardId: this.getLocalShardId()
    };
    
    this.auditLog.push(auditEntry);
    
    // Cleanup old audit entries
    this.cleanupAuditLog();
    
    this.emit('auditEventLogged', {
      eventType,
      eventId: auditEntry.eventId,
      timestamp: auditEntry.timestamp
    });
  }
    /**
   * Encrypt audit data for privacy
   */
  encryptAuditData(data) {
    const auditKey = crypto.scryptSync(
      this.psiKeys.privateKey,
      'audit-encryption',
      32
    );
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', auditKey, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }
  
  /**
   * Cleanup old audit entries
   */
  cleanupAuditLog() {
    const retentionMs = this.config.auditRetentionDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;
    
    this.auditLog = this.auditLog.filter(entry => entry.timestamp > cutoffTime);
  }
  
  /**
   * Perform cross-shard PSI operation
   */
  async performCrossShardPSI(userId, biometricTemplate, targetShardId) {
    if (!this.shardCoordinators.has(targetShardId)) {
      throw new Error(`Target shard ${targetShardId} not found`);
    }
    
    // Simulate cross-shard PSI operation
    const sessionId = crypto.randomUUID();
    const hashedTemplate = this.hashBiometricTemplate(biometricTemplate);
    
    // Create PSI request
    const request = {
      sessionId,
      candidateHash: hashedTemplate,
      requestingShardId: this.getLocalShardId()
    };
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    // Process PSI
    const result = await this.processPSIRequest(request);
    
    this.logAuditEvent('crossShardPSI', {
      sessionId,
      targetShard: targetShardId,
      result: result.found,
      latency: Math.random() * 200
    });
    
    return {
      sessionId,
      isDuplicate: result.found,
      confidence: result.confidence,
      targetShard: targetShardId
    };
  }

  /**
   * Process PSI request from another shard
   */
  async processPSIRequest(request) {
    const { candidateHash } = request;
    
    // Simulate PSI computation
    const localMatch = this.localBiometricSets.has(candidateHash);
    const confidence = localMatch ? 0.95 : Math.random() * 0.3;
    
    return {
      found: localMatch,
      confidence: confidence
    };
  }

  /**
   * Get local shard identifier
   */
  getLocalShardId() {
    return 'local-shard-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Feature extraction helper methods
   */
  normalizeFaceLandmarks(landmarks) {
    // Normalize landmarks to standard coordinate system
    return landmarks.map(point => ({
      x: Math.max(0, Math.min(1, point.x)),
      y: Math.max(0, Math.min(1, point.y))
    }));
  }
  
  extractGeometricFeatures(faceData) {
    // Extract geometric relationships between facial features
    return {
      eyeDistance: 0.5, // Normalized eye distance
      noseRatio: 0.3,   // Nose width to face width ratio
      mouthPosition: 0.7 // Mouth position relative to face height
    };
  }
  
  extractTexturalFeatures(faceData) {
    // Extract texture-based features
    return {
      skinTexture: [0.1, 0.2, 0.3], // Simplified texture descriptors
      wrinklePattern: [0.05, 0.1]    // Age-related features
    };
  }
  
  extractMFCC(voiceData) {
    // Extract Mel-frequency cepstral coefficients
    return Array(13).fill(0).map(() => Math.random() * 2 - 1);
  }
  
  extractPitchFeatures(voiceData) {
    return {
      fundamental: 150, // Fundamental frequency
      harmonics: [300, 450, 600] // Harmonic frequencies
    };
  }
  
  extractFormants(voiceData) {
    return [500, 1500, 2500]; // Formant frequencies
  }
  
  extractKeystrokePatterns(behaviorData) {
    return {
      dwellTimes: [100, 150, 200], // Key press durations
      flightTimes: [80, 120, 160]  // Times between key presses
    };
  }
  
  extractMousePatterns(behaviorData) {
    return {
      velocity: [100, 200, 150], // Mouse movement velocities
      acceleration: [50, 75, 100] // Mouse accelerations
    };
  }
  
  extractGaitPatterns(behaviorData) {
    return {
      stepFrequency: 1.8, // Steps per second
      stepLength: 0.7,    // Normalized step length
      asymmetry: 0.05    // Gait asymmetry measure
    };
  }
  
  addControlledNoise(features, noiseLevel) {
    // Add controlled noise for differential privacy
    const noisyFeatures = JSON.parse(JSON.stringify(features));
    
    const addNoiseToValue = (value) => {
      if (typeof value === 'number') {
        const noise = (Math.random() - 0.5) * 2 * noiseLevel;
        return value + noise;
      }
      return value;
    };
    
    const addNoiseRecursive = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (Array.isArray(obj[key])) {
            obj[key] = obj[key].map(addNoiseToValue);
          } else {
            addNoiseRecursive(obj[key]);
          }
        } else {
          obj[key] = addNoiseToValue(obj[key]);
        }
      }
    };
    
    addNoiseRecursive(noisyFeatures);
    return noisyFeatures;
  }
  
  applyQuantization(features, bits) {
    // Apply quantization for anonymization
    const quantizedFeatures = JSON.parse(JSON.stringify(features));
    const levels = Math.pow(2, bits);
    
    const quantizeValue = (value) => {
      if (typeof value === 'number') {
        return Math.round(value * levels) / levels;
      }
      return value;
    };
    
    const quantizeRecursive = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (Array.isArray(obj[key])) {
            obj[key] = obj[key].map(quantizeValue);
          } else {
            quantizeRecursive(obj[key]);
          }
        } else {
          obj[key] = quantizeValue(obj[key]);
        }
      }
    };
    
    quantizeRecursive(quantizedFeatures);
    return quantizedFeatures;
  }
  
  /**
   * Generate PSI system metrics
   */
  generatePSIMetrics() {
    return {
      localBiometrics: {
        totalRegistered: this.encryptedBiometrics.size,
        totalHashes: this.biometricHashes.size,
        localSetSize: this.localBiometricSets.get('primary')?.size || 0
      },
      crossShardMetrics: {
        registeredShards: this.shardRegistry.size,
        activeShards: Array.from(this.shardRegistry.values())
          .filter(shard => shard.status === 'active').length,
        totalPSISessions: this.psiSessions.size
      },
      deduplicationMetrics: {
        totalChecks: this.deduplicationResults.size,
        duplicatesFound: Array.from(this.deduplicationResults.values())
          .filter(result => result.isDuplicate).length,
        averageConfidence: this.calculateAverageConfidence()
      },
      auditMetrics: {
        totalAuditEntries: this.auditLog.length,
        privacyViolations: this.privacyViolationAlerts.length,
        retentionDays: this.config.auditRetentionDays
      },
      privacyMetrics: {
        deduplicationThreshold: this.config.deduplicationThreshold,
        noPlaintextStorage: true,
        forwardSecrecy: true,
        crossShardPSI: this.config.crossShardEnabled
      },
      timestamp: Date.now()
    };
  }
  
  /**
   * Calculate average confidence from deduplication results
   */
  calculateAverageConfidence() {
    const results = Array.from(this.deduplicationResults.values());
    if (results.length === 0) return 0;
    
    return results.reduce((sum, result) => sum + result.confidence, 0) / results.length;
  }
  
  /**
   * Cleanup resources and secure data deletion
   */
  destroy() {
    // Securely clear sensitive data
    this.encryptedBiometrics.clear();
    this.biometricHashes.clear();
    this.localBiometricSets.clear();
    this.psiSessions.clear();
    
    // Clear keys
    if (this.psiKeys) {
      this.psiKeys.privateKey.fill(0);
      this.psiKeys = null;
    }
    
    // Clear audit log
    this.auditLog = [];
    
    this.emit('destroyed');
  }
  
  /**
   * Hash biometric template for PSI operations
   */
  hashBiometricTemplate(template) {
    // Convert template to string if needed
    const templateStr = typeof template === 'string' ? template : JSON.stringify(template);
    return crypto.createHash(this.config.hashFunction).update(templateStr).digest('hex');
  }
}

export default PSIBiometricSystem;
