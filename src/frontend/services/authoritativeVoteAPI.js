/**
 * Authoritative Vote API Client
 * Single source of truth for all vote data
 */

const API_BASE = 'http://localhost:3002/api/vote/authoritative';

class AuthoritativeVoteAPI {
  
  /**
   * Get total votes and candidate breakdown for a topic
   * @param {string} topicId - Topic/channel ID
   * @returns {Promise<Object>} Vote totals from authoritative ledger
   */
  async getTopicVoteTotals(topicId) {
    try {
      const response = await fetch(`${API_BASE}/topic/${encodeURIComponent(topicId)}/totals`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch vote totals');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching authoritative vote totals:', error);
      // Return fallback structure
      return {
        topicId,
        totalVotes: 0,
        candidates: {},
        lastUpdated: null,
        error: error.message
      };
    }
  }

  /**
   * Get vote count for a specific candidate
   * @param {string} topicId - Topic/channel ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<number>} Vote count from authoritative ledger
   */
  async getCandidateVoteCount(topicId, candidateId) {
    try {
      const response = await fetch(`${API_BASE}/topic/${encodeURIComponent(topicId)}/candidate/${encodeURIComponent(candidateId)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch candidate vote count');
      }
      
      return result.data.voteCount;
    } catch (error) {
      console.error('Error fetching candidate vote count:', error);
      return 0; // Fallback
    }
  }

  /**
   * Get user's current vote for a topic
   * @param {string} userId - User ID
   * @param {string} topicId - Topic/channel ID
   * @returns {Promise<Object|null>} User's vote or null
   */
  async getUserVote(userId, topicId) {
    try {
      const response = await fetch(`${API_BASE}/user/${encodeURIComponent(userId)}/topic/${encodeURIComponent(topicId)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch user vote');
      }
      
      return result.data.vote;
    } catch (error) {
      console.error('Error fetching user vote:', error);
      return null; // Fallback
    }
  }

  /**
   * Get reconciliation status for a topic
   * @param {string} topicId - Topic/channel ID
   * @returns {Promise<Object>} Reconciliation status
   */
  async getReconciliationStatus(topicId) {
    try {
      const response = await fetch(`${API_BASE}/topic/${encodeURIComponent(topicId)}/reconciliation`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch reconciliation status');
      }
      
      return result.data.reconciliation;
    } catch (error) {
      console.error('Error fetching reconciliation status:', error);
      return { 
        valid: false, 
        message: `Error: ${error.message}`,
        error: true
      };
    }
  }

  /**
   * Get audit log for a topic
   * @param {string} topicId - Topic/channel ID
   * @param {number} limit - Maximum number of entries
   * @returns {Promise<Array>} Audit log entries
   */
  async getAuditLog(topicId, limit = 50) {
    try {
      const response = await fetch(`${API_BASE}/topic/${encodeURIComponent(topicId)}/audit?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch audit log');
      }
      
      return result.data.auditEntries;
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return []; // Fallback
    }
  }

  /**
   * Trigger rebuild of vote totals from authoritative ledger
   * @param {string} topicId - Topic ID (optional, rebuilds all if not provided)
   * @returns {Promise<Object>} Rebuild statistics
   */
  async rebuildVoteTotals(topicId = null) {
    try {
      const url = topicId 
        ? `${API_BASE}/rebuild/${encodeURIComponent(topicId)}`
        : `${API_BASE}/rebuild`;
        
      const response = await fetch(url, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to rebuild vote totals');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error rebuilding vote totals:', error);
      throw error;
    }
  }

  /**
   * Verify vote system integrity across a topic
   * @param {string} topicId - Topic ID
   * @returns {Promise<Object>} Comprehensive integrity check
   */
  async verifyIntegrity(topicId) {
    try {
      const [totals, reconciliation, auditLog] = await Promise.all([
        this.getTopicVoteTotals(topicId),
        this.getReconciliationStatus(topicId),
        this.getAuditLog(topicId, 10)
      ]);

      return {
        topicId,
        timestamp: Date.now(),
        totals,
        reconciliation,
        recentAudit: auditLog,
        integrity: {
          hasVotes: totals.totalVotes > 0,
          reconciled: reconciliation.valid,
          auditAvailable: auditLog.length > 0,
          overall: totals.totalVotes > 0 && reconciliation.valid
        }
      };
    } catch (error) {
      console.error('Error verifying vote system integrity:', error);
      return {
        topicId,
        timestamp: Date.now(),
        error: error.message,
        integrity: {
          hasVotes: false,
          reconciled: false,
          auditAvailable: false,
          overall: false
        }
      };
    }
  }

  /**
   * Request geolocation permission from browser
   * @returns {Promise<Object>} Location data or error
   */
  async requestGeolocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          let message = 'Location access denied';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Get user's current location with permission handling
   * @returns {Promise<Object>} Location data or null if denied
   */
  async getUserLocation() {
    try {
      const location = await this.requestGeolocation();
      console.log('Location obtained:', location);
      return location;
    } catch (error) {
      console.warn('Geolocation failed:', error.message);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get administrative levels
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Administrative levels (country, province, city)
   */
  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(
        `http://localhost:3002/api/boundaries/reverse-geocode?lat=${lat}&lng=${lng}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Reverse geocoding failed');
      }
      
      return result.location;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        country: null,
        province: null,
        city: null,
        error: error.message
      };
    }
  }

  /**
   * Get location with geocoding (full administrative data)
   * @returns {Promise<Object|null>} Complete location data or null
   */
  async getLocationWithGeocoding() {
    try {
      // Get coordinates from browser
      const coords = await this.requestGeolocation();
      if (!coords) return null;

      // Reverse geocode to get administrative levels
      const adminLevels = await this.reverseGeocode(coords.lat, coords.lng);

      return {
        ...coords,
        ...adminLevels,
        geocoded: !adminLevels.error
      };
    } catch (error) {
      console.error('Location with geocoding failed:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authoritativeVoteAPI = new AuthoritativeVoteAPI();
export default authoritativeVoteAPI;
