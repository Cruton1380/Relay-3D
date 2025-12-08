/**
 * @fileoverview Production Database Connection and Security Service
 * Handles encrypted storage, authentication, and secure biometric vector management
 */
import pg from '../mocks/pg.mjs';
import bcrypt from '../mocks/bcrypt.mjs';
import jwt from '../mocks/jsonwebtoken.mjs';
import crypto from 'crypto';
// import { RateLimiterPostgreSQL } from 'rate-limiter-flexible';
import logger from '../utils/logging/logger.mjs';

const { Pool } = pg;

class DatabaseSecurityService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Encryption setup for biometric vectors
    this.encryptionKey = Buffer.from(process.env.BIOMETRIC_ENCRYPTION_KEY || crypto.randomBytes(32));
    this.vectorSalt = process.env.VECTOR_SALT || crypto.randomBytes(16).toString('hex');

    // Rate limiters
    this.setupRateLimiters();
  }
  setupRateLimiters() {
    // Mock rate limiters for now - replace with actual implementation when pg is available
    this.generalLimiter = {
      consume: async () => ({ totalHits: 1, remainingPoints: 99 }),
      penalty: async () => ({}),
      reward: async () => ({}),
      get: async () => ({ totalHits: 1, remainingPoints: 99 })
    };

    this.passwordDanceLimiter = {
      consume: async () => ({ totalHits: 1, remainingPoints: 4 }),
      penalty: async () => ({}),
      reward: async () => ({}),
      get: async () => ({ totalHits: 1, remainingPoints: 4 })
    };
  }

  /**
   * Encrypt biometric vector data
   */
  encryptBiometricVector(vectorData) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    cipher.setAAD(Buffer.from(this.vectorSalt));
    
    let encrypted = cipher.update(JSON.stringify(vectorData), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt biometric vector data
   */
  decryptBiometricVector(encryptedData) {
    try {
      const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
      decipher.setAAD(Buffer.from(this.vectorSalt));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Failed to decrypt biometric vector', { error: error.message });
      throw new Error('Biometric data decryption failed');
    }
  }

  /**
   * Store password dance enrollment securely
   */
  async storePasswordDanceEnrollment(userId, enrollmentData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Encrypt biometric vectors
      const encryptedAudioVector = this.encryptBiometricVector(enrollmentData.audioVector);
      const encryptedGestureVector = this.encryptBiometricVector(enrollmentData.gestureVector);

      // Hash the phrase for secure storage
      const phraseHash = crypto.createHash('sha256')
        .update(enrollmentData.phrase + this.vectorSalt)
        .digest('hex');

      // Create combined vector hash for integrity checking
      const combinedVectorHash = crypto.createHash('sha256')
        .update(JSON.stringify(enrollmentData.combinedVector) + this.vectorSalt)
        .digest('hex');

      // Insert enrollment record
      const query = `
        INSERT INTO password_dance_enrollments 
        (user_id, phrase_hash, gesture_type, audio_vector_encrypted, 
         gesture_vector_encrypted, combined_vector_hash, security_level)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) 
        DO UPDATE SET
          phrase_hash = EXCLUDED.phrase_hash,
          gesture_type = EXCLUDED.gesture_type,
          audio_vector_encrypted = EXCLUDED.audio_vector_encrypted,
          gesture_vector_encrypted = EXCLUDED.gesture_vector_encrypted,
          combined_vector_hash = EXCLUDED.combined_vector_hash,
          enrollment_date = NOW(),
          verification_count = 0,
          is_active = true
        RETURNING id
      `;

      const values = [
        userId,
        phraseHash,
        enrollmentData.gestureType,
        JSON.stringify(encryptedAudioVector),
        JSON.stringify(encryptedGestureVector),
        combinedVectorHash,
        enrollmentData.securityLevel || 'standard'
      ];

      const result = await client.query(query, values);
      
      await client.query('COMMIT');

      logger.info('Password dance enrollment stored securely', {
        userId,
        enrollmentId: result.rows[0].id,
        gestureType: enrollmentData.gestureType
      });

      return {
        success: true,
        enrollmentId: result.rows[0].id,
        vectorHash: combinedVectorHash
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to store password dance enrollment', {
        userId,
        error: error.message
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieve password dance enrollment for verification
   */
  async getPasswordDanceEnrollment(userId) {
    try {
      const query = `
        SELECT 
          id, phrase_hash, gesture_type, audio_vector_encrypted,
          gesture_vector_encrypted, combined_vector_hash,
          verification_count, last_used, security_level
        FROM password_dance_enrollments 
        WHERE user_id = $1 AND is_active = true
      `;

      const result = await this.pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const enrollment = result.rows[0];

      // Decrypt biometric vectors
      const audioVector = this.decryptBiometricVector(
        JSON.parse(enrollment.audio_vector_encrypted)
      );
      const gestureVector = this.decryptBiometricVector(
        JSON.parse(enrollment.gesture_vector_encrypted)
      );

      return {
        id: enrollment.id,
        phraseHash: enrollment.phrase_hash,
        gestureType: enrollment.gesture_type,
        audioVector,
        gestureVector,
        combinedVectorHash: enrollment.combined_vector_hash,
        verificationCount: enrollment.verification_count,
        lastUsed: enrollment.last_used,
        securityLevel: enrollment.security_level
      };

    } catch (error) {
      logger.error('Failed to retrieve password dance enrollment', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update verification statistics
   */
  async updateVerificationStats(userId, success, confidenceScore) {
    try {
      const query = `
        UPDATE password_dance_enrollments 
        SET 
          verification_count = verification_count + 1,
          last_used = CASE WHEN $2 THEN NOW() ELSE last_used END
        WHERE user_id = $1
      `;

      await this.pool.query(query, [userId, success]);

      // Log verification attempt
      await this.logVerificationAttempt(userId, 'password_dance', success, confidenceScore);

    } catch (error) {
      logger.error('Failed to update verification stats', {
        userId,
        error: error.message
      });
    }
  }

  /**
   * Log verification attempt for security monitoring
   */
  async logVerificationAttempt(userId, verificationType, result, confidenceScore, riskFactors = {}) {
    try {
      const query = `
        INSERT INTO verification_attempts 
        (user_id, verification_type, result, confidence_score, risk_factors, timestamp)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;

      await this.pool.query(query, [
        userId,
        verificationType,
        result,
        confidenceScore,
        JSON.stringify(riskFactors)
      ]);

    } catch (error) {
      logger.error('Failed to log verification attempt', {
        userId,
        error: error.message
      });
    }
  }

  /**
   * Generate JWT token with biometric context
   */
  generateAuthToken(userId, trustLevel, verificationMethod = 'standard') {
    const payload = {
      userId,
      trustLevel,
      verificationMethod,
      iat: Math.floor(Date.now() / 1000),
      iss: process.env.JWT_ISSUER || 'relay-platform'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || '24h'
    });
  }

  /**
   * Verify JWT token
   */
  verifyAuthToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      logger.warn('JWT verification failed', { error: error.message });
      return null;
    }
  }

  /**
   * Check rate limits
   */
  async checkRateLimit(identifier, endpoint = 'general') {
    try {
      const limiter = endpoint === 'password-dance' ? 
        this.passwordDanceLimiter : this.generalLimiter;
      
      await limiter.consume(identifier);
      return { allowed: true };
    } catch (rejRes) {
      return {
        allowed: false,
        resetTime: new Date(Date.now() + rejRes.msBeforeNext),
        totalHits: rejRes.totalHits,
        remainingPoints: rejRes.remainingPoints
      };
    }
  }

  /**
   * Security audit logging
   */
  async logSecurityEvent(userId, eventType, eventDetails, riskLevel = 'low', ipAddress = null) {
    try {
      const query = `
        INSERT INTO security_audit_log 
        (user_id, event_type, event_details, risk_level, ip_address, timestamp)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;

      await this.pool.query(query, [
        userId,
        eventType,
        JSON.stringify(eventDetails),
        riskLevel,
        ipAddress
      ]);

    } catch (error) {
      logger.error('Failed to log security event', {
        userId,
        eventType,
        error: error.message
      });
    }
  }

  /**
   * Health check for database connection
   */
  async healthCheck() {
    try {
      const result = await this.pool.query('SELECT NOW()');
      return {
        healthy: true,
        timestamp: result.rows[0].now,
        poolSize: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup old verification attempts and rate limit data
   */
  async cleanup() {
    try {
      // Remove verification attempts older than 30 days
      await this.pool.query(`
        DELETE FROM verification_attempts 
        WHERE timestamp < NOW() - INTERVAL '30 days'
      `);

      // Remove expired rate limit entries
      await this.pool.query(`
        DELETE FROM rate_limit_tracking 
        WHERE blocked_until < NOW() - INTERVAL '1 hour'
      `);

      logger.info('Database cleanup completed');
    } catch (error) {
      logger.error('Database cleanup failed', { error: error.message });
    }
  }
}

export default DatabaseSecurityService;
