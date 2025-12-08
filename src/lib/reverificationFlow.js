/**
 * REVERIFICATION FLOW ENGINE
 * Handles physical proximity-based verification challenges for flagged accounts
 * Supports multi-device verification and duplicate account detection
 */

import { randomBytes, createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import EventEmitter from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ReverificationFlowEngine extends EventEmitter {
  constructor() {
    super();
    this.config = this.loadConfig();
    this.activeVerifications = new Map();
    this.proximityChannels = new Map();
    this.verificationHistory = new Map();
    this.duplicateDetector = new DuplicateAccountDetector();
  }

  loadConfig() {
    try {
      const configPath = join(__dirname, '../config/jurySystem.json');
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      return config.jurySystem.reverification;
    } catch (error) {
      console.warn('Failed to load reverification config, using defaults');
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      proximityTimeWindow: "2h",
      duplicateAccountGap: "30m",
      maxVerificationAttempts: 3,
      verificationCooldown: "7d",
      locationToleranceMeters: 100
    };
  }

  /**
   * Initiate reverification flow for flagged user(s)
   */
  async initiateReverification(reverificationRequest) {
    try {
      console.log(`[REVERIFICATION] Starting reverification for user: ${reverificationRequest.userId}`);
      
      // Validate reverification request
      await this.validateReverificationRequest(reverificationRequest);
      
      // Check for duplicate account scenarios
      const duplicateScenario = await this.detectDuplicateScenario(reverificationRequest);
      
      if (duplicateScenario.detected) {
        return await this.handleDuplicateAccountVerification(duplicateScenario);
      } else {
        return await this.handleSingleAccountVerification(reverificationRequest);
      }
      
    } catch (error) {
      console.error('[REVERIFICATION] Error initiating reverification:', error);
      throw new Error(`Reverification initiation failed: ${error.message}`);
    }
  }
  /**
   * Handle verification for single flagged account
   */
  async handleSingleAccountVerification(request) {
    const verificationId = this.generateVerificationId(request);
    
    console.log(`[REVERIFICATION] Handling single account verification for user: ${request.userId}`);
    
    // Get user's known proximity locations from their encounter history
    const knownLocations = await this.getKnownProximityLocations(request.userId);
    
    if (knownLocations.length === 0) {
      throw new Error('No known proximity locations found for user - cannot perform verification');
    }
    
    console.log(`[REVERIFICATION] Found ${knownLocations.length} known locations for user ${request.userId}`);
    
    // Select verification location (prefer most recent and reliable within user's region)
    const selectedLocation = this.selectVerificationLocation(knownLocations);
    
    console.log(`[REVERIFICATION] Selected verification location: ${selectedLocation.name} for user: ${request.userId}`);
    
    // Generate time window challenge
    const timeWindow = this.generateTimeWindow(selectedLocation);
    
    // Create verification challenge
    const verificationChallenge = {
      verificationId,
      userId: request.userId,
      caseId: request.caseId,
      type: 'single_account',
      location: selectedLocation,
      timeWindow,
      challenge: await this.generateProximityChallenge(selectedLocation, timeWindow),
      attempts: 0,
      maxAttempts: this.config.maxVerificationAttempts,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + this.parseTimeWindow(this.config.proximityTimeWindow)
    };
    
    // Store active verification
    this.activeVerifications.set(verificationId, verificationChallenge);
    
    // Notify proximity channel
    await this.notifyProximityChannel(selectedLocation, verificationChallenge);
    
    // Send challenge to user
    await this.sendVerificationChallenge(request.userId, verificationChallenge);
    
    console.log(`[REVERIFICATION] Single account verification initiated: ${verificationId} at ${selectedLocation.name}`);
    
    return {
      success: true,
      verificationId,
      type: 'single_account',
      location: selectedLocation.name,
      timeWindow: timeWindow,
      instructions: this.generateUserInstructions(verificationChallenge)
    };
  }
  /**
   * Handle verification for suspected duplicate accounts
   */
  async handleDuplicateAccountVerification(duplicateScenario) {
    const verificationId = this.generateVerificationId({
      userId: duplicateScenario.primaryUserId,
      duplicateUserId: duplicateScenario.duplicateUserId
    });
    
    console.log(`[REVERIFICATION] Handling duplicate account scenario: ${duplicateScenario.primaryUserId} <-> ${duplicateScenario.duplicateUserId}`);
    
    // Get known locations for both accounts from their proximity history
    const primaryLocations = await this.getKnownProximityLocations(duplicateScenario.primaryUserId);
    const duplicateLocations = await this.getKnownProximityLocations(duplicateScenario.duplicateUserId);
    
    console.log(`[REVERIFICATION] Found ${primaryLocations.length} locations for primary user, ${duplicateLocations.length} for duplicate user`);
    
    // Find different locations for each account within their respective regions/travel cycles
    const locationPair = await this.selectDuplicateVerificationLocations(
      primaryLocations, 
      duplicateLocations
    );
    
    if (!locationPair) {
      throw new Error('Cannot find suitable verification locations for duplicate account test - both users may need to be sent to previously used locations within their respective regions');
    }
    
    console.log(`[REVERIFICATION] Selected location pair: Primary user -> ${locationPair.primary.name}, Duplicate user -> ${locationPair.duplicate.name}`);
    
    // Generate overlapping time windows
    const timeWindows = this.generateOverlappingTimeWindows();
    
    // Create dual verification challenge
    const dualChallenge = {
      verificationId,
      type: 'duplicate_detection',
      caseId: duplicateScenario.caseId,
      primaryUser: {
        userId: duplicateScenario.primaryUserId,
        location: locationPair.primary,
        timeWindow: timeWindows.primary,
        challenge: await this.generateProximityChallenge(locationPair.primary, timeWindows.primary)
      },
      duplicateUser: {
        userId: duplicateScenario.duplicateUserId,
        location: locationPair.duplicate,
        timeWindow: timeWindows.duplicate,
        challenge: await this.generateProximityChallenge(locationPair.duplicate, timeWindows.duplicate)
      },
      overlapPeriod: timeWindows.overlap,
      attempts: { primary: 0, duplicate: 0 },
      maxAttempts: this.config.maxVerificationAttempts,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + this.parseTimeWindow(this.config.proximityTimeWindow)
    };
    
    // Store active verification
    this.activeVerifications.set(verificationId, dualChallenge);
    
    // Notify both proximity channels
    await this.notifyProximityChannel(locationPair.primary, dualChallenge.primaryUser);
    await this.notifyProximityChannel(locationPair.duplicate, dualChallenge.duplicateUser);
    
    // Send challenges to both users
    await this.sendVerificationChallenge(duplicateScenario.primaryUserId, dualChallenge.primaryUser);
    await this.sendVerificationChallenge(duplicateScenario.duplicateUserId, dualChallenge.duplicateUser);
    
    console.log(`[REVERIFICATION] Duplicate account verification initiated: ${verificationId}`);
    console.log(`[REVERIFICATION] Primary user sent to: ${locationPair.primary.name} (${locationPair.primary.region || 'unknown region'})`);
    console.log(`[REVERIFICATION] Duplicate user sent to: ${locationPair.duplicate.name} (${locationPair.duplicate.region || 'unknown region'})`);
    
    return {
      success: true,
      verificationId,
      type: 'duplicate_detection',
      primaryLocation: locationPair.primary.name,
      duplicateLocation: locationPair.duplicate.name,
      overlapPeriod: timeWindows.overlap,
      instructions: this.generateDualUserInstructions(dualChallenge)
    };
  }

  /**
   * Process proximity verification response
   */
  async processVerificationResponse(response) {
    const verification = this.activeVerifications.get(response.verificationId);
    
    if (!verification) {
      throw new Error(`Verification not found: ${response.verificationId}`);
    }
    
    if (verification.status !== 'pending') {
      throw new Error(`Verification already completed: ${response.verificationId}`);
    }
    
    try {
      // Validate proximity proof
      const proximityProof = await this.validateProximityProof(response, verification);
      
      if (verification.type === 'single_account') {
        return await this.processSingleAccountResponse(verification, proximityProof);
      } else {
        return await this.processDuplicateAccountResponse(verification, proximityProof);
      }
      
    } catch (error) {
      // Increment attempt counter
      if (verification.type === 'single_account') {
        verification.attempts++;
      } else {
        if (response.userId === verification.primaryUser.userId) {
          verification.attempts.primary++;
        } else {
          verification.attempts.duplicate++;
        }
      }
      
      // Check if max attempts reached
      const maxAttemptsReached = verification.type === 'single_account' 
        ? verification.attempts >= verification.maxAttempts
        : verification.attempts.primary >= verification.maxAttempts || 
          verification.attempts.duplicate >= verification.maxAttempts;
      
      if (maxAttemptsReached) {
        verification.status = 'failed';
        await this.handleVerificationFailure(verification);
      }
      
      throw error;
    }
  }

  /**
   * Process single account verification response
   */
  async processSingleAccountResponse(verification, proximityProof) {
    // Validate timing
    if (!this.isWithinTimeWindow(proximityProof.timestamp, verification.timeWindow)) {
      throw new Error('Verification attempt outside time window');
    }
    
    // Validate location
    if (!this.isWithinLocationTolerance(proximityProof.location, verification.location)) {
      throw new Error('Verification attempt outside location tolerance');
    }
    
    // Validate cryptographic proof
    if (!await this.validateCryptographicProof(proximityProof, verification.challenge)) {
      throw new Error('Invalid cryptographic proof');
    }
    
    // Mark verification as successful
    verification.status = 'completed';
    verification.completedAt = Date.now();
    verification.result = 'success';
    verification.proximityProof = proximityProof;
    
    // Store result
    await this.storeVerificationResult(verification);
    
    // Emit success event
    this.emit('verificationCompleted', {
      verificationId: verification.verificationId,
      userId: verification.userId,
      result: 'success',
      type: 'single_account'
    });
    
    console.log(`[REVERIFICATION] Single account verification successful: ${verification.verificationId}`);
    
    return {
      success: true,
      verificationId: verification.verificationId,
      result: 'verified',
      userId: verification.userId,
      completedAt: verification.completedAt
    };
  }

  /**
   * Process duplicate account verification response
   */
  async processDuplicateAccountResponse(verification, proximityProof) {
    const isPrimaryUser = proximityProof.userId === verification.primaryUser.userId;
    const userVerification = isPrimaryUser ? verification.primaryUser : verification.duplicateUser;
    
    // Validate timing
    if (!this.isWithinTimeWindow(proximityProof.timestamp, userVerification.timeWindow)) {
      throw new Error('Verification attempt outside time window');
    }
    
    // Validate location
    if (!this.isWithinLocationTolerance(proximityProof.location, userVerification.location)) {
      throw new Error('Verification attempt outside location tolerance');
    }
    
    // Validate cryptographic proof
    if (!await this.validateCryptographicProof(proximityProof, userVerification.challenge)) {
      throw new Error('Invalid cryptographic proof');
    }
    
    // Mark user as verified
    userVerification.verified = true;
    userVerification.verifiedAt = Date.now();
    userVerification.proximityProof = proximityProof;
    
    // Check if both users have verified
    const bothVerified = verification.primaryUser.verified && verification.duplicateUser.verified;
    
    if (bothVerified) {
      // Analyze timing overlap to determine if same person
      const overlapAnalysis = this.analyzeTimingOverlap(
        verification.primaryUser.verifiedAt,
        verification.duplicateUser.verifiedAt,
        verification.overlapPeriod
      );
      
      verification.status = 'completed';
      verification.completedAt = Date.now();
      verification.result = overlapAnalysis.likelyDuplicate ? 'duplicate_detected' : 'separate_individuals';
      verification.overlapAnalysis = overlapAnalysis;
      
      // Store result
      await this.storeVerificationResult(verification);
      
      // Emit completion event
      this.emit('verificationCompleted', {
        verificationId: verification.verificationId,
        primaryUserId: verification.primaryUser.userId,
        duplicateUserId: verification.duplicateUser.userId,
        result: verification.result,
        type: 'duplicate_detection'
      });
      
      console.log(`[REVERIFICATION] Duplicate account verification completed: ${verification.verificationId} - Result: ${verification.result}`);
    }
    
    return {
      success: true,
      verificationId: verification.verificationId,
      userVerified: proximityProof.userId,
      bothCompleted: bothVerified,
      result: bothVerified ? verification.result : 'partial_completion'
    };
  }

  /**
   * Generate cryptographically secure proximity challenge
   */
  async generateProximityChallenge(location, timeWindow) {
    const challengeData = {
      locationId: location.id,
      timeWindow: timeWindow,
      nonce: randomBytes(32).toString('hex'),
      timestamp: Date.now()
    };
    
    const challengeHash = createHash('sha256')
      .update(JSON.stringify(challengeData))
      .digest('hex');
    
    return {
      challengeHash,
      challengeData,
      expectedResponse: this.generateExpectedResponse(challengeData)
    };
  }

  /**
   * Generate expected cryptographic response for challenge
   */
  generateExpectedResponse(challengeData) {
    return createHash('sha256')
      .update(`${challengeData.nonce}_${challengeData.locationId}_${challengeData.timestamp}`)
      .digest('hex');
  }

  /**
   * Validate cryptographic proof from user device
   */
  async validateCryptographicProof(proximityProof, challenge) {
    // Verify the response matches expected challenge response
    const expectedResponse = this.generateExpectedResponse(challenge.challengeData);
    
    if (proximityProof.challengeResponse !== expectedResponse) {
      return false;
    }
    
    // Verify device signature
    if (!await this.verifyDeviceSignature(proximityProof)) {
      return false;
    }
    
    // Verify proximity channel signature
    if (!await this.verifyProximityChannelSignature(proximityProof)) {
      return false;
    }
    
    return true;
  }
  /**
   * Select verification location from known locations
   * Prioritizes locations within user's region and normal travel cycle
   */
  selectVerificationLocation(knownLocations) {
    if (!knownLocations || knownLocations.length === 0) {
      throw new Error('No known proximity locations available for verification');
    }

    console.log(`[REVERIFICATION] Selecting verification location from ${knownLocations.length} known locations`);

    // Prefer recent, reliable locations within user's regular travel pattern
    const scoredLocations = knownLocations.map(location => ({
      ...location,
      score: this.calculateLocationScore(location)
    }));

    // Sort by score and prioritize regular locations
    scoredLocations.sort((a, b) => {
      // First priority: regular locations in user's travel cycle
      if (a.isRegularLocation && !b.isRegularLocation) return -1;
      if (!a.isRegularLocation && b.isRegularLocation) return 1;
      
      // Then by calculated score
      return b.score - a.score;
    });

    const selectedLocation = scoredLocations[0];
    console.log(`[REVERIFICATION] Selected location: ${selectedLocation.name} (score: ${selectedLocation.score}, regular: ${selectedLocation.isRegularLocation})`);

    return selectedLocation;
  }  /**
   * Calculate location suitability score with transparency and confidence levels
   */
  calculateLocationScore(location) {
    let score = 0;
    const scoreBreakdown = {};
    
    // Base score for being a regular location (highest priority)
    if (location.isRegularLocation) {
      scoreBreakdown.regularLocationBonus = 50;
      score += 50;
    }
    
    // Recent usage bonus (prioritize recently visited locations)
    const daysSinceLastUse = (Date.now() - location.lastUsed) / (1000 * 60 * 60 * 24);
    let recencyScore = 0;
    if (daysSinceLastUse <= 7) {
      recencyScore = 30; // Very recent use
    } else if (daysSinceLastUse <= 30) {
      recencyScore = 20; // Recent use
    } else if (daysSinceLastUse <= 90) {
      recencyScore = 10; // Moderately recent
    }
    scoreBreakdown.recencyScore = recencyScore;
    score += recencyScore;
    
    // Reliability bonus based on successful verification history
    const reliabilityScore = (location.successRate || 0.5) * 15;
    scoreBreakdown.reliabilityScore = reliabilityScore;
    score += reliabilityScore;
    
    // Channel availability bonus
    if (location.channelOnline) {
      scoreBreakdown.availabilityBonus = 10;
      score += 10;
    }
    
    // Frequency of use bonus (shows it's part of regular routine)
    const usageFrequencyScore = Math.min(location.usageCount || 1, 15);
    scoreBreakdown.usageFrequencyScore = usageFrequencyScore;
    score += usageFrequencyScore;
    
    // Duration bonus (locations where user spent more time are more appropriate)
    let durationScore = 0;
    if (location.averageDuration) {
      const avgDurationMinutes = location.averageDuration / (1000 * 60);
      if (avgDurationMinutes >= 30) {
        durationScore = 10; // Substantial time spent at location
      } else if (avgDurationMinutes >= 10) {
        durationScore = 5; // Moderate time spent
      }
    }
    scoreBreakdown.durationScore = durationScore;
    score += durationScore;
    
    // Regional appropriateness bonus
    if (location.region && location.region !== 'unknown') {
      scoreBreakdown.regionalBonus = 5;
      score += 5;
    }

    // Anti-abuse penalties
    if (location.abuseFlags && location.abuseFlags.length > 0) {
      const abuseRisk = location.abuseRisk === 'medium' ? -10 : -5;
      scoreBreakdown.abuseRiskPenalty = abuseRisk;
      score += abuseRisk;
    }
    
    // Peer interaction quality bonus (NEW)
    if (location.hasVerifiedPeerInteractions) {
      scoreBreakdown.peerInteractionBonus = 15;
      score += 15;
    }
    
    // Cross-device consistency bonus (NEW)
    if (location.crossDeviceConsistency > 0.8) {
      scoreBreakdown.crossDeviceConsistencyBonus = 10;
      score += 10;
    }
    
    // Travel pattern naturalness bonus (NEW)
    if (location.travelPatternNaturalness > 0.7) {
      scoreBreakdown.travelPatternBonus = 8;
      score += 8;
    }
    
    // Store breakdown for transparency
    location.scoreBreakdown = scoreBreakdown;
    location.finalScore = score;
    
    // Determine confidence level
    location.confidenceLevel = this.calculateConfidenceLevel(score);
    location.selectionRationale = this.generateSelectionRationale(location, scoreBreakdown);
    
    console.log(`[REVERIFICATION] Location ${location.name}: score=${score}, confidence=${location.confidenceLevel}, regular=${location.isRegularLocation}, usage=${location.usageCount}, daysSince=${daysSinceLastUse.toFixed(1)}`);
    
    return score;
  }

  /**
   * Calculate confidence level based on score and additional factors
   */
  calculateConfidenceLevel(score) {
    if (score >= 100) return 'high';
    if (score >= 60) return 'medium';  
    if (score >= 30) return 'low';
    return 'critical';
  }

  /**
   * Generate human-readable rationale for location selection
   */
  generateSelectionRationale(location, scoreBreakdown) {
    const reasons = [];
    
    if (scoreBreakdown.regularLocationBonus > 0) {
      reasons.push(`Regular location in your travel routine (${location.usageCount} visits)`);
    }
    
    if (scoreBreakdown.recencyScore >= 20) {
      const daysSince = Math.round((Date.now() - location.lastUsed) / (1000 * 60 * 60 * 24));
      reasons.push(`Recently visited (${daysSince} days ago)`);
    }
    
    if (scoreBreakdown.reliabilityScore >= 10) {
      const reliability = Math.round(((location.successRate || 0.5) * 100));
      reasons.push(`High reliability (${reliability}% success rate)`);
    }
    
    if (scoreBreakdown.durationScore >= 5) {
      const avgMinutes = Math.round(location.averageDuration / (1000 * 60));
      reasons.push(`Substantial time spent (${avgMinutes} min average)`);
    }
    
    if (scoreBreakdown.peerInteractionBonus > 0) {
      reasons.push('Verified peer interactions at this location');
    }
    
    if (location.abuseFlags && location.abuseFlags.length > 0) {
      reasons.push(`⚠️ Minor concerns: ${location.abuseFlags.join(', ')}`);
    }
    
    return reasons.length > 0 ? reasons : ['Selected based on basic usage pattern'];
  }
  /**
   * Select locations for duplicate account verification
   * Ensures both users are sent to regionally appropriate, previously used locations that are geographically separated
   */
  async selectDuplicateVerificationLocations(primaryLocations, duplicateLocations) {
    console.log(`[REVERIFICATION] Selecting duplicate verification locations: ${primaryLocations.length} primary, ${duplicateLocations.length} duplicate`);
    
    // Filter for highly suitable locations (regular locations within user's travel cycle)
    const primarySuitable = primaryLocations.filter(loc => loc.isRegularLocation || loc.usageCount >= 3);
    const duplicateSuitable = duplicateLocations.filter(loc => loc.isRegularLocation || loc.usageCount >= 3);
    
    // If no regular locations, fall back to any previously used locations
    const primaryOptions = primarySuitable.length > 0 ? primarySuitable : primaryLocations;
    const duplicateOptions = duplicateSuitable.length > 0 ? duplicateSuitable : duplicateLocations;
    
    console.log(`[REVERIFICATION] Suitable options: ${primaryOptions.length} primary, ${duplicateOptions.length} duplicate`);
    
    // Find locations that are geographically separated
    for (const primaryLoc of primaryOptions) {
      for (const duplicateLoc of duplicateOptions) {
        const distance = this.calculateDistance(primaryLoc.coordinates, duplicateLoc.coordinates);
        
        // Ensure locations are at least 1km apart to prevent single user controlling both
        if (distance > 1000) {
          console.log(`[REVERIFICATION] Selected location pair: ${primaryLoc.name} and ${duplicateLoc.name} (${distance.toFixed(0)}m apart)`);
          
          return {
            primary: primaryLoc,
            duplicate: duplicateLoc,
            separation: distance
          };
        }
      }
    }
    
    // If no suitable separated locations found, try with reduced separation requirement
    console.log(`[REVERIFICATION] No locations with 1km+ separation found, trying with 500m minimum`);
    
    for (const primaryLoc of primaryOptions) {
      for (const duplicateLoc of duplicateOptions) {
        const distance = this.calculateDistance(primaryLoc.coordinates, duplicateLoc.coordinates);
        
        // Reduced requirement: at least 500m apart
        if (distance > 500) {
          console.log(`[REVERIFICATION] Selected location pair with reduced separation: ${primaryLoc.name} and ${duplicateLoc.name} (${distance.toFixed(0)}m apart)`);
          
          return {
            primary: primaryLoc,
            duplicate: duplicateLoc,
            separation: distance
          };
        }
      }
    }
    
    console.warn(`[REVERIFICATION] Cannot find suitable verification locations with adequate separation`);
    return null; // No suitable location pair found
  }

  /**
   * Generate overlapping time windows for duplicate detection
   */
  generateOverlappingTimeWindows() {
    const now = Date.now();
    const gapMs = this.parseTimeWindow(this.config.duplicateAccountGap);
    const windowMs = this.parseTimeWindow(this.config.proximityTimeWindow);
    
    // Create overlapping windows with 30-minute gap
    const primaryStart = now + (30 * 60 * 1000); // Start in 30 minutes
    const duplicateStart = primaryStart + gapMs; // Start 30 minutes after primary
    
    return {
      primary: {
        start: primaryStart,
        end: primaryStart + windowMs
      },
      duplicate: {
        start: duplicateStart,
        end: duplicateStart + windowMs
      },
      overlap: {
        start: duplicateStart,
        end: primaryStart + windowMs,
        duration: Math.max(0, (primaryStart + windowMs) - duplicateStart)
      }
    };
  }

  /**
   * Analyze timing overlap to detect duplicate accounts
   */
  analyzeTimingOverlap(primaryTime, duplicateTime, overlapPeriod) {
    const timeDifference = Math.abs(primaryTime - duplicateTime);
    const overlapDuration = overlapPeriod.duration;
    
    // If both verified within overlap period and close in time, likely duplicate
    const withinOverlap = primaryTime >= overlapPeriod.start && 
                         primaryTime <= overlapPeriod.end &&
                         duplicateTime >= overlapPeriod.start && 
                         duplicateTime <= overlapPeriod.end;
    
    const closeInTime = timeDifference < (5 * 60 * 1000); // Within 5 minutes
    
    const likelyDuplicate = withinOverlap && closeInTime;
    
    return {
      likelyDuplicate,
      timeDifference,
      withinOverlap,
      closeInTime,
      confidence: likelyDuplicate ? 0.85 : 0.15
    };
  }

  // Helper methods
  
  async validateReverificationRequest(request) {
    if (!request.userId || !request.caseId) {
      throw new Error('Invalid reverification request - missing required fields');
    }
    
    // Check cooldown period
    const lastVerification = await this.getLastVerification(request.userId);
    if (lastVerification) {
      const cooldownMs = this.parseTimeWindow(this.config.verificationCooldown);
      const timeSinceLast = Date.now() - lastVerification.completedAt;
      
      if (timeSinceLast < cooldownMs) {
        throw new Error('User is in verification cooldown period');
      }
    }
  }

  async detectDuplicateScenario(request) {
    return await this.duplicateDetector.analyzeForDuplicates(request.userId);
  }

  generateVerificationId(request) {
    const data = `${request.userId}_${request.caseId || 'single'}_${Date.now()}`;
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  generateTimeWindow(location) {
    const windowMs = this.parseTimeWindow(this.config.proximityTimeWindow);
    const start = Date.now() + (30 * 60 * 1000); // Start in 30 minutes
    
    return {
      start,
      end: start + windowMs,
      duration: windowMs
    };
  }

  parseTimeWindow(timeStr) {
    const unit = timeStr.slice(-1);
    const value = parseInt(timeStr.slice(0, -1));
    
    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      default: return value;
    }
  }

  isWithinTimeWindow(timestamp, timeWindow) {
    return timestamp >= timeWindow.start && timestamp <= timeWindow.end;
  }

  isWithinLocationTolerance(providedLocation, expectedLocation) {
    const distance = this.calculateDistance(providedLocation, expectedLocation.coordinates);
    return distance <= this.config.locationToleranceMeters;
  }

  calculateDistance(coord1, coord2) {
    // Simple distance calculation (for production, use proper geospatial calculation)
    const latDiff = coord1.lat - coord2.lat;
    const lngDiff = coord1.lng - coord2.lng;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000; // Rough conversion to meters
  }
  generateUserInstructions(challenge) {
    return {
      title: 'Account Verification Required',
      description: 'Please verify your identity at a location you have previously visited',
      location: challenge.location.name,
      locationNote: challenge.location.isRegularLocation ? 
        'This is a location from your regular routine' : 
        'This is a location you have visited before',
      timeWindow: `${new Date(challenge.timeWindow.start).toLocaleString()} - ${new Date(challenge.timeWindow.end).toLocaleString()}`,
      steps: [
        `Go to ${challenge.location.name} during the specified time window`,
        'This location was selected from your proximity history',
        'Ensure your device has Bluetooth/WiFi enabled',
        'Open the Relay app and follow verification prompts',
        'Complete the cryptographic challenge when prompted'
      ],
      requirements: [
        'You must have previously visited this location',
        'The location is within your normal travel area',
        'Verification must be completed within the time window',
        'You must be physically present at the location'
      ]
    };
  }

  generateDualUserInstructions(dualChallenge) {
    return {
      primary: {
        ...this.generateUserInstructions(dualChallenge.primaryUser),
        userType: 'Primary Account'
      },
      duplicate: {
        ...this.generateUserInstructions(dualChallenge.duplicateUser),
        userType: 'Suspected Duplicate Account'
      },
      explanation: 'Both accounts must verify simultaneously at different locations from their respective proximity histories to prove they are controlled by different individuals.',
      importantNote: 'Each user will be sent to a location they have previously visited within their normal travel area. The system ensures these locations are appropriately separated geographically.'
    };
  }  // Enhanced proximity channel selection with comprehensive fallback logic
  async getKnownProximityLocations(userId) {
    try {
      console.log(`[REVERIFICATION] Getting known proximity locations for user: ${userId}`);
      
      // For now, simulate a comprehensive user history that shows regional and travel pattern awareness
      // In production, this would query the actual encounter history service
      const mockUserHistory = this.getMockUserProximityHistory(userId);
      
      console.log(`[REVERIFICATION] User ${userId} has ${mockUserHistory.length} historical proximity locations`);

      // Apply multi-tier fallback logic
      return await this.applyFallbackLogic(userId, mockUserHistory);

    } catch (error) {
      console.error(`[REVERIFICATION] Error getting proximity locations for user ${userId}:`, error);
      // Final fallback: Manual review required
      throw new Error(`Unable to determine suitable proximity locations for user ${userId} - manual review required`);
    }
  }

  /**
   * Multi-tier fallback logic with anti-abuse measures
   */
  async applyFallbackLogic(userId, userHistory) {
    const MINIMUM_SCORE_THRESHOLD = 50; // Locations below this require elevated review
    const CONFIDENCE_LEVELS = {
      HIGH: 'high',      // Score 100+, regular locations
      MEDIUM: 'medium',  // Score 50-99, occasional locations  
      LOW: 'low',        // Score 25-49, requires manual review
      CRITICAL: 'critical' // Score <25, must escalate
    };

    // Tier 1: Regular locations within user's established travel cycle
    let suitableLocations = this.filterLocationsByTier(userHistory, 'regular');
    if (suitableLocations.length > 0) {
      console.log(`[REVERIFICATION] Tier 1: Found ${suitableLocations.length} regular locations`);
      return this.scoreAndValidateLocations(suitableLocations, MINIMUM_SCORE_THRESHOLD);
    }

    // Tier 2: Occasional-use locations with anti-abuse validation
    suitableLocations = this.filterLocationsByTier(userHistory, 'occasional');
    if (suitableLocations.length > 0) {
      console.log(`[REVERIFICATION] Tier 2: Found ${suitableLocations.length} occasional locations`);
      const validated = await this.validateAgainstAbuse(userId, suitableLocations);
      if (validated.length > 0) {
        return this.scoreAndValidateLocations(validated, MINIMUM_SCORE_THRESHOLD, 'elevated_review');
      }
    }

    // Tier 3: Neighboring region expansion (with strict validation)
    suitableLocations = await this.expandToNeighboringRegions(userId, userHistory);
    if (suitableLocations.length > 0) {
      console.log(`[REVERIFICATION] Tier 3: Found ${suitableLocations.length} neighboring region locations`);
      return this.scoreAndValidateLocations(suitableLocations, MINIMUM_SCORE_THRESHOLD, 'manual_review_required');
    }

    // Tier 4: Critical fallback - manual override required
    console.warn(`[REVERIFICATION] Tier 4: No suitable locations found for user ${userId} - escalating to manual review`);
    throw new Error(`Insufficient proximity history for automated verification - manual review required for user ${userId}`);
  }

  /**
   * Filter locations by tier with anti-abuse measures
   */
  filterLocationsByTier(userHistory, tier) {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    switch (tier) {
      case 'regular':
        return userHistory.filter(location => {
          const daysSinceLastUse = (now - location.lastUsed) / DAY;
          return location.usageCount >= 3 && 
                 daysSinceLastUse <= 30 &&
                 location.averageDuration >= 15 * 60 * 1000; // At least 15 minutes average
        });

      case 'occasional':
        return userHistory.filter(location => {
          const daysSinceLastUse = (now - location.lastUsed) / DAY;
          return location.usageCount >= 2 && 
                 daysSinceLastUse <= 90 &&
                 location.averageDuration >= 10 * 60 * 1000; // At least 10 minutes average
        });

      default:
        return [];
    }
  }
  /**
   * Anti-abuse validation for location patterns
   */
  async validateAgainstAbuse(userId, locations) {
    const validatedLocations = [];
    
    for (const location of locations) {
      let isValid = true;
      const abuseFlags = [];

      // Check 1: Verify peer interaction consistency
      if (!location.hasConsistentPeerOverlap) {
        abuseFlags.push('inconsistent_peer_overlap');
      }

      // Check 2: Validate successful past interactions
      if (!location.hasSuccessfulInteractions) {
        abuseFlags.push('no_verified_interactions');
      }

      // Check 3: Geographic clustering analysis
      const clusterAnalysis = this.analyzeGeographicClustering(userId, location);
      if (clusterAnalysis.isSuspiciousPattern) {
        abuseFlags.push('suspicious_geographic_pattern');
      }

      // Check 4: Temporal pattern validation
      const temporalAnalysis = this.analyzeTemporalPatterns(location);
      if (temporalAnalysis.isArtificial) {
        abuseFlags.push('artificial_temporal_pattern');
      }

      // Apply abuse threshold
      if (abuseFlags.length <= 1) { // Allow 1 minor flag
        location.abuseFlags = abuseFlags;
        location.abuseRisk = abuseFlags.length === 0 ? 'low' : 'medium';
        validatedLocations.push(location);
      } else {
        console.warn(`[REVERIFICATION] Location ${location.name} failed abuse validation: ${abuseFlags.join(', ')}`);
      }
    }

    return validatedLocations;
  }

  /**
   * Analyze geographic clustering patterns for anti-abuse
   * Detects if locations are suspiciously clustered or follow artificial patterns
   */
  analyzeGeographicClustering(userId, location) {
    // Get user's complete location history for analysis
    const userHistory = this.getMockUserProximityHistory(userId);
    
    // Calculate clustering metrics
    const clusteringAnalysis = {
      isSuspiciousPattern: false,
      clusterSize: 0,
      radiusVariance: 0,
      geometricConsistency: 0,
      naturalDispersion: true
    };

    // Check 1: Unusual geometric patterns (perfect grids, lines, etc.)
    const coordinates = userHistory.map(loc => loc.coordinates);
    coordinates.push(location.coordinates);
    
    const geometricPattern = this.detectGeometricPatterns(coordinates);
    if (geometricPattern.isPerfectGrid || geometricPattern.isPerfectLine) {
      clusteringAnalysis.isSuspiciousPattern = true;
      clusteringAnalysis.geometricConsistency = geometricPattern.confidence;
    }

    // Check 2: Radius variance analysis
    const centroid = this.calculateCentroid(coordinates);
    const distances = coordinates.map(coord => this.calculateDistance(centroid, coord));
    const variance = this.calculateVariance(distances);
    
    // Low variance indicates artificial clustering
    if (variance < 50000) { // Less than 50km variance
      clusteringAnalysis.radiusVariance = variance;
      clusteringAnalysis.naturalDispersion = false;
    }

    // Check 3: Cluster density analysis
    const clusters = this.identifyLocationClusters(coordinates, 1000); // 1km clustering
    clusteringAnalysis.clusterSize = clusters.length;
    
    // Too few clusters suggests artificial pattern
    if (clusters.length < coordinates.length * 0.3) {
      clusteringAnalysis.isSuspiciousPattern = true;
    }

    return clusteringAnalysis;
  }

  /**
   * Analyze temporal patterns for artificial behavior detection
   */
  analyzeTemporalPatterns(location) {
    // Mock temporal analysis - would analyze actual visit patterns
    const temporalAnalysis = {
      isArtificial: false,
      patternType: 'natural',
      regularityScore: 0.5,
      predictabilityScore: 0.4
    };

    // Check for overly regular patterns (like exactly every 24 hours)
    if (location.usageCount > 5) {
      // Simulate checking for artificial regularity
      const artificialRegularity = Math.random() < 0.1; // 10% chance of detecting artificial pattern
      
      if (artificialRegularity) {
        temporalAnalysis.isArtificial = true;
        temporalAnalysis.patternType = 'artificial_regular';
        temporalAnalysis.regularityScore = 0.95; // Too regular to be natural
      }
    }

    return temporalAnalysis;
  }

  /**
   * Detect geometric patterns in coordinate sets
   */
  detectGeometricPatterns(coordinates) {
    if (coordinates.length < 3) {
      return { isPerfectGrid: false, isPerfectLine: false, confidence: 0 };
    }

    // Check for perfect grid pattern
    const gridAnalysis = this.analyzeGridPattern(coordinates);
    
    // Check for perfect line pattern
    const lineAnalysis = this.analyzeLinePattern(coordinates);

    return {
      isPerfectGrid: gridAnalysis.confidence > 0.9,
      isPerfectLine: lineAnalysis.confidence > 0.9,
      confidence: Math.max(gridAnalysis.confidence, lineAnalysis.confidence),
      gridAnalysis,
      lineAnalysis
    };
  }

  /**
   * Analyze if coordinates form a grid pattern
   */
  analyzeGridPattern(coordinates) {
    // Simple grid detection - check if points align in rows and columns
    const lats = coordinates.map(c => c.lat).sort((a, b) => a - b);
    const lngs = coordinates.map(c => c.lng).sort((a, b) => a - b);
    
    // Calculate spacing consistency
    const latSpacings = [];
    const lngSpacings = [];
    
    for (let i = 1; i < lats.length; i++) {
      latSpacings.push(lats[i] - lats[i-1]);
    }
    
    for (let i = 1; i < lngs.length; i++) {
      lngSpacings.push(lngs[i] - lngs[i-1]);
    }
    
    // Calculate variance in spacings
    const latVariance = this.calculateVariance(latSpacings);
    const lngVariance = this.calculateVariance(lngSpacings);
    
    // Low variance indicates regular grid
    const gridConfidence = Math.max(0, 1 - (latVariance + lngVariance) / 0.001);
    
    return {
      confidence: gridConfidence,
      latVariance,
      lngVariance,
      spacings: { lat: latSpacings, lng: lngSpacings }
    };
  }

  /**
   * Analyze if coordinates form a line pattern
   */
  analyzeLinePattern(coordinates) {
    if (coordinates.length < 3) {
      return { confidence: 0 };
    }

    // Calculate how well points fit a line using linear regression
    const n = coordinates.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    coordinates.forEach(coord => {
      sumX += coord.lng;
      sumY += coord.lat;
      sumXY += coord.lng * coord.lat;
      sumX2 += coord.lng * coord.lng;
    });
    
    // Calculate correlation coefficient (R²)
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    let numerator = 0, denomX = 0, denomY = 0;
    
    coordinates.forEach(coord => {
      const dx = coord.lng - meanX;
      const dy = coord.lat - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    });
    
    const correlation = denomX === 0 || denomY === 0 ? 0 : 
      Math.abs(numerator / Math.sqrt(denomX * denomY));
    
    return {
      confidence: correlation,
      correlation,
      meanX,
      meanY
    };
  }

  /**
   * Calculate centroid of coordinate set
   */
  calculateCentroid(coordinates) {
    const n = coordinates.length;
    const sumLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0);
    const sumLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0);
    
    return {
      lat: sumLat / n,
      lng: sumLng / n
    };
  }

  /**
   * Calculate variance of a number array
   */
  calculateVariance(numbers) {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  /**
   * Identify location clusters using distance-based clustering
   */
  identifyLocationClusters(coordinates, maxDistance = 1000) {
    const clusters = [];
    const visited = new Set();
    
    coordinates.forEach((coord, index) => {
      if (visited.has(index)) return;
      
      const cluster = [index];
      visited.add(index);
      
      // Find all points within maxDistance
      coordinates.forEach((otherCoord, otherIndex) => {
        if (otherIndex === index || visited.has(otherIndex)) return;
        
        const distance = this.calculateDistance(coord, otherCoord);
        if (distance <= maxDistance) {
          cluster.push(otherIndex);
          visited.add(otherIndex);
        }
      });
      
      clusters.push(cluster);
    });
    
    return clusters;
  }
  // Generate realistic mock proximity history based on user patterns
  getMockUserProximityHistory(userId) {
    const userRegion = this.getUserRegionFromId(userId);
    const isDuplicateUser = userId.includes('duplicate');
    
    // Base coordinates for different regions
    const regionBases = {
      'region-nyc': { lat: 40.7128, lng: -74.0060 },
      'region-sf': { lat: 37.7749, lng: -122.4194 },
      'region-chicago': { lat: 41.8781, lng: -87.6298 },
      'default': { lat: 40.7128, lng: -74.0060 }
    };
    
    const baseCoords = regionBases[userRegion] || regionBases['default'];
    const baseOffset = isDuplicateUser ? 0.05 : 0; // Different areas for duplicate users
    
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    
    return [
      {
        id: `loc_${userId}_regular_1`,
        name: isDuplicateUser ? 'Library Uptown Branch' : 'Downtown Coffee Hub',
        coordinates: { 
          lat: baseCoords.lat + baseOffset, 
          lng: baseCoords.lng + baseOffset 
        },
        lastUsed: now - (2 * DAY), // Used 2 days ago
        successRate: 0.95,
        usageCount: 15, // Regular location
        channelOnline: true,
        isRegularLocation: true,
        region: userRegion,
        averageDuration: 45 * 60 * 1000, // 45 minutes average
        channelIds: new Set([`channel_${userId}_coffee`, `channel_${userId}_wifi`]),
        hasConsistentPeerOverlap: true,
        hasSuccessfulInteractions: true,
        hasVerifiedPeerInteractions: true,
        crossDeviceConsistency: 0.85,
        travelPatternNaturalness: 0.9
      },
      {
        id: `loc_${userId}_regular_2`,
        name: isDuplicateUser ? 'Metro Station East' : 'University Campus',
        coordinates: { 
          lat: baseCoords.lat + 0.01 + baseOffset, 
          lng: baseCoords.lng + 0.01 + baseOffset 
        },
        lastUsed: now - (1 * DAY), // Used yesterday
        successRate: 0.88,
        usageCount: 12, // Regular location
        channelOnline: true,
        isRegularLocation: true,
        region: userRegion,
        averageDuration: 30 * 60 * 1000, // 30 minutes average
        channelIds: new Set([`channel_${userId}_campus`, `channel_${userId}_study`]),
        hasConsistentPeerOverlap: true,
        hasSuccessfulInteractions: true,
        hasVerifiedPeerInteractions: true,
        crossDeviceConsistency: 0.82,
        travelPatternNaturalness: 0.85
      },
      {
        id: `loc_${userId}_work`,
        name: isDuplicateUser ? 'Business Center North' : 'Office Complex Downtown',
        coordinates: { 
          lat: baseCoords.lat + 0.02 + baseOffset, 
          lng: baseCoords.lng + 0.02 + baseOffset 
        },
        lastUsed: now - (3 * DAY), // Used 3 days ago
        successRate: 0.92,
        usageCount: 20, // Work location - very regular
        channelOnline: true,
        isRegularLocation: true,
        region: userRegion,
        averageDuration: 4 * 60 * 60 * 1000, // 4 hours average (work)
        channelIds: new Set([`channel_${userId}_work`, `channel_${userId}_office`]),
        hasConsistentPeerOverlap: true,
        hasSuccessfulInteractions: true,
        hasVerifiedPeerInteractions: true,
        crossDeviceConsistency: 0.95,
        travelPatternNaturalness: 0.95
      },
      {
        id: `loc_${userId}_occasional_1`,
        name: isDuplicateUser ? 'Shopping District South' : 'Mall Food Court',
        coordinates: { 
          lat: baseCoords.lat + 0.03 + baseOffset, 
          lng: baseCoords.lng + 0.03 + baseOffset 
        },
        lastUsed: now - (7 * DAY), // Used a week ago
        successRate: 0.75,
        usageCount: 4, // Occasional location
        channelOnline: true,
        isRegularLocation: false,
        region: userRegion,
        averageDuration: 20 * 60 * 1000, // 20 minutes average
        channelIds: new Set([`channel_${userId}_mall`, `channel_${userId}_shopping`]),
        hasConsistentPeerOverlap: true,
        hasSuccessfulInteractions: true,
        hasVerifiedPeerInteractions: false,
        crossDeviceConsistency: 0.65,
        travelPatternNaturalness: 0.7
      },
      {
        id: `loc_${userId}_occasional_2`,
        name: isDuplicateUser ? 'Park Recreation Area' : 'City Park WiFi Zone',
        coordinates: { 
          lat: baseCoords.lat + 0.015 + baseOffset, 
          lng: baseCoords.lng + 0.015 + baseOffset 
        },
        lastUsed: now - (14 * DAY), // Used 2 weeks ago
        successRate: 0.8,
        usageCount: 3, // Occasional location
        channelOnline: true,
        isRegularLocation: false,
        region: userRegion,
        averageDuration: 35 * 60 * 1000, // 35 minutes average
        channelIds: new Set([`channel_${userId}_park`, `channel_${userId}_outdoor`]),
        hasConsistentPeerOverlap: true,
        hasSuccessfulInteractions: true,
        hasVerifiedPeerInteractions: false,
        crossDeviceConsistency: 0.7,
        travelPatternNaturalness: 0.75
      }
    ];
  }

  // Determine user's region from their ID for mock purposes
  getUserRegionFromId(userId) {
    if (userId.includes('nyc') || userId.includes('new-york')) return 'region-nyc';
    if (userId.includes('sf') || userId.includes('san-francisco')) return 'region-sf';
    if (userId.includes('chicago') || userId.includes('chi')) return 'region-chicago';
    return 'region-nyc'; // Default region
  }

  // Fallback locations when user has no established travel patterns
  getFallbackProximityLocations(userId) {
    console.log(`[REVERIFICATION] Using fallback proximity locations for user: ${userId}`);
    const userRegion = this.getUserRegionFromId(userId);
    const baseOffset = userId.includes('duplicate') ? 0.05 : 0;
    
    return [
      {
        id: `loc_${userId}_fallback_1`,
        name: userId.includes('duplicate') ? 'Public Library Main' : 'Community WiFi Hub',
        coordinates: { 
          lat: 40.7128 + baseOffset, 
          lng: -74.0060 + baseOffset 
        },
        lastUsed: Date.now() - (2 * 24 * 60 * 60 * 1000),
        successRate: 0.85,
        usageCount: 3,
        channelOnline: true,
        isRegularLocation: false,
        region: userRegion,
        averageDuration: 30 * 60 * 1000
      }
    ];
  }

  async notifyProximityChannel(location, challenge) {
    console.log(`[REVERIFICATION] Notifying proximity channel: ${location.name}`);
  }

  async sendVerificationChallenge(userId, challenge) {
    console.log(`[REVERIFICATION] Sending verification challenge to user: ${userId}`);
  }

  async verifyDeviceSignature(proximityProof) {
    return true; // Mock - would verify actual device signature
  }

  async verifyProximityChannelSignature(proximityProof) {
    return true; // Mock - would verify actual channel signature
  }

  async storeVerificationResult(verification) {
    console.log(`[REVERIFICATION] Storing verification result: ${verification.verificationId}`);
  }

  async getLastVerification(userId) {
    return null; // Mock - would query verification history
  }

  async handleVerificationFailure(verification) {
    console.log(`[REVERIFICATION] Verification failed: ${verification.verificationId}`);
    
    this.emit('verificationFailed', {
      verificationId: verification.verificationId,
      userId: verification.userId,
      reason: 'max_attempts_exceeded'
    });
  }

  /**
   * Validate proximity proof from user device
   */
  async validateProximityProof(response, verification) {
    // Validate timing
    const timeWindow = verification.timeWindow;
    const now = Date.now();
    
    if (response.timestamp < timeWindow.start || response.timestamp > timeWindow.end) {
      throw new Error('Verification attempt outside time window');
    }
    
    // Validate proximity channel
    if (!verification.proximityChannels.includes(response.proximityChannel)) {
      throw new Error('Invalid proximity channel for verification');
    }
    
    // Validate device signature (basic check)
    if (!response.deviceSignature || response.deviceSignature.length < 32) {
      throw new Error('Invalid device signature');
    }
    
    // Validate location proof (if provided)
    if (response.locationProof) {
      const distance = this.calculateDistance(
        response.locationProof.coords,
        verification.locationProof.coords
      );
      
      if (distance > verification.maxLocationRadius) {
        throw new Error('Location proof exceeds maximum allowed radius');
      }
    }
    
    return {
      valid: true,
      proximityChannel: response.proximityChannel,
      timestamp: response.timestamp,
      deviceSignature: response.deviceSignature,
      locationProof: response.locationProof
    };
  }

  /**
   * Simulate reverification completion (for testing and orchestration)
   */
  simulateReverificationCompletion(verificationId, result = 'verified') {
    try {
      const verification = this.activeVerifications.get(verificationId);
      
      if (!verification) {
        console.warn(`[REVERIFICATION] Verification not found for simulation: ${verificationId}`);
        return;
      }
      
      // Update verification status
      verification.status = 'completed';
      verification.completedAt = Date.now();
      verification.result = result;
      
      // Emit completion event
      const completionEvent = {
        verificationId,
        userId: verification.userId,
        caseId: verification.caseId,
        result,
        type: verification.type,
        completedAt: verification.completedAt
      };
      
      console.log(`[REVERIFICATION] Simulating completion: ${verificationId} - Result: ${result}`);
      
      this.emit('verificationCompleted', completionEvent);
      
      // Clean up
      setTimeout(() => {
        this.activeVerifications.delete(verificationId);
      }, 1000);
      
    } catch (error) {
      console.error('[REVERIFICATION] Error simulating completion:', error);
    }
  }
  /**
   * Enhanced location validation with minimum score thresholds and confidence levels
   */
  async scoreAndValidateLocations(locations, minimumScoreThreshold = 50, reviewLevel = 'standard') {
    const scoredLocations = [];
    
    for (const location of locations) {
      const score = this.calculateLocationScore(location);
      
      // Apply minimum score threshold
      if (score >= minimumScoreThreshold) {
        scoredLocations.push({
          ...location,
          finalScore: score,
          reviewLevel,
          isValidated: true
        });
      } else {
        console.warn(`[REVERIFICATION] Location ${location.name} below minimum threshold: ${score} < ${minimumScoreThreshold}`);
        
        // Include with elevated review if score is close to threshold (within 20% of threshold)
        if (score >= minimumScoreThreshold * 0.8) {
          scoredLocations.push({
            ...location,
            finalScore: score,
            reviewLevel: 'elevated_review',
            isValidated: false,
            requiresManualReview: true
          });
        }
      }
    }
    
    // Sort by score (highest first)
    scoredLocations.sort((a, b) => b.finalScore - a.finalScore);
    
    return scoredLocations;
  }

  /**
   * Expand search to neighboring regions with strict validation
   */
  async expandToNeighboringRegions(userId, userHistory) {
    const userRegion = this.getUserRegionFromId(userId);
    const neighboringRegions = this.getNeighboringRegions(userRegion);
    
    console.log(`[REVERIFICATION] Expanding search from ${userRegion} to neighboring regions: ${neighboringRegions.join(', ')}`);
    
    const expandedLocations = [];
    
    // For each neighboring region, find locations with user connections
    for (const region of neighboringRegions) {
      const regionLocations = await this.getRegionalProximityChannels(region);
      
      // Filter for locations where user has some connection/history
      const userConnectedLocations = regionLocations.filter(location => {
        return this.hasUserConnectionToLocation(userId, location);
      });
      
      expandedLocations.push(...userConnectedLocations);
    }
    
    return expandedLocations;
  }

  /**
   * Get neighboring regions for a given region
   */
  getNeighboringRegions(region) {
    const regionMap = {
      'region-nyc': ['region-philadelphia', 'region-boston'],
      'region-sf': ['region-oakland', 'region-san-jose'],
      'region-chicago': ['region-milwaukee', 'region-detroit'],
      'default': []
    };
    
    return regionMap[region] || [];
  }

  /**
   * Get proximity channels in a specific region
   */
  async getRegionalProximityChannels(region) {
    // Mock implementation - would query actual regional channels
    return [
      {
        id: `regional_${region}_1`,
        name: `Regional Hub ${region}`,
        region: region,
        coordinates: { lat: 40.0 + Math.random() * 5, lng: -74.0 + Math.random() * 5 },
        channelOnline: true,
        averageDuration: 25 * 60 * 1000,
        usageCount: 1,
        successRate: 0.7,
        lastUsed: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
        isRegularLocation: false,
        hasConsistentPeerOverlap: false,
        hasSuccessfulInteractions: false,
        hasVerifiedPeerInteractions: false,
        crossDeviceConsistency: 0.5,
        travelPatternNaturalness: 0.6
      }
    ];
  }

  /**
   * Check if user has any connection to a location (travel history, etc.)
   */
  hasUserConnectionToLocation(userId, location) {
    // Mock implementation - would check actual travel/connection history
    // For now, allow some connection based on user patterns
    return Math.random() < 0.3; // 30% chance of connection
  }
}

/**
 * Duplicate Account Detection Engine
 */
class DuplicateAccountDetector {
  async analyzeForDuplicates(userId) {
    // Mock duplicate detection - would use actual ML/pattern analysis
    const suspiciousPatterns = await this.detectSuspiciousPatterns(userId);
    
    if (suspiciousPatterns.length > 0) {
      return {
        detected: true,
        primaryUserId: userId,
        duplicateUserId: suspiciousPatterns[0].relatedUserId,
        confidence: suspiciousPatterns[0].confidence,
        evidence: suspiciousPatterns[0].evidence,
        caseId: suspiciousPatterns[0].caseId
      };
    }
    
    return { detected: false };
  }

  async detectSuspiciousPatterns(userId) {
    // Mock detection - would implement actual pattern analysis
    return [];
  }
}

export default ReverificationFlowEngine;
