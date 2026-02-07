/**
 * Founders Report Service - Frontend
 * Handles communication with the Founders Report API
 */
import { apiGet, apiPost, apiPut } from "./apiClient.js";

class FoundersReportService {
  constructor() {
    this.baseURL = "/api/founders-report";
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get current configuration
  async getConfiguration() {
    try {
      const response = await apiGet(`${this.baseURL}/config`);
      return response;
    } catch (error) {
      console.error(
        "[FoundersReportService] Failed to get configuration:",
        error,
      );
      throw new Error("Failed to retrieve configuration");
    }
  }

  // Get system parameters
  async getSystemParameters() {
    try {
      const response = await apiGet(`${this.baseURL}/parameters`);
      return response.parameters;
    } catch (error) {
      console.error("[FoundersReportService] Failed to get parameters:", error);
      throw new Error("Failed to retrieve system parameters");
    }
  }

  // Update system parameters
  async updateSystemParameters(systemParams) {
    try {
      const response = await apiPut(`${this.baseURL}/parameters`, {
        systemParams,
      });

      // Clear cache after update
      this.cache.clear();

      return response;
    } catch (error) {
      console.error(
        "[FoundersReportService] Failed to update parameters:",
        error,
      );
      throw new Error(error.message || "Failed to update system parameters");
    }
  }

  // Get configuration summary
  async getConfigurationSummary() {
    try {
      const response = await apiGet(`${this.baseURL}/summary`);
      return response.summary;
    } catch (error) {
      console.error("[FoundersReportService] Failed to get summary:", error);
      throw new Error("Failed to retrieve configuration summary");
    }
  }

  // Reset to defaults
  async resetToDefaults() {
    try {
      const response = await apiPost(`${this.baseURL}/reset`);

      // Clear cache after reset
      this.cache.clear();

      return response;
    } catch (error) {
      console.error(
        "[FoundersReportService] Failed to reset configuration:",
        error,
      );
      throw new Error("Failed to reset configuration");
    }
  }

  // Export configuration
  async exportConfiguration() {
    try {
      const response = await apiGet(`${this.baseURL}/export`);

      // Create download link
      const blob = new Blob([JSON.stringify(response, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `founders-report-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: "Configuration exported successfully" };
    } catch (error) {
      console.error(
        "[FoundersReportService] Failed to export configuration:",
        error,
      );
      throw new Error("Failed to export configuration");
    }
  }

  // Import configuration
  async importConfiguration(configData) {
    try {
      const response = await apiPost(`${this.baseURL}/import`, {
        configData,
      });

      // Clear cache after import
      this.cache.clear();

      return response;
    } catch (error) {
      console.error(
        "[FoundersReportService] Failed to import configuration:",
        error,
      );
      throw new Error(error.message || "Failed to import configuration");
    }
  }

  // Validate parameters
  async validateParameters(systemParams) {
    try {
      const response = await apiPost(`${this.baseURL}/validate`, {
        systemParams,
      });
      return response.validation;
    } catch (error) {
      console.error(
        "[FoundersReportService] Failed to validate parameters:",
        error,
      );
      throw new Error("Failed to validate parameters");
    }
  }

  // Get specific parameter value
  async getParameterValue(key) {
    try {
      const response = await apiGet(`${this.baseURL}/parameter/${key}`);
      return response.value;
    } catch (error) {
      console.error("[FoundersReportService] Failed to get parameter:", error);
      throw new Error(`Failed to retrieve parameter: ${key}`);
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await apiGet(`${this.baseURL}/health`);
      return response;
    } catch (error) {
      console.error("[FoundersReportService] Health check failed:", error);
      return { status: "error", error: error.message };
    }
  }

  // Cached get with timeout
  async getCached(key, fetcher, timeout = this.cacheTimeout) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < timeout) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cached configuration
  async getCachedConfiguration() {
    return this.getCached("config", () => this.getConfiguration());
  }

  // Get cached parameters
  async getCachedParameters() {
    return this.getCached("parameters", () => this.getSystemParameters());
  }

  // Get cached summary
  async getCachedSummary() {
    return this.getCached("summary", () => this.getConfigurationSummary());
  }

  // Local validation (client-side)
  validateParametersLocal(systemParams) {
    const errors = [];

    // Economic validation
    if (
      systemParams.founderCommission?.value < 0 ||
      systemParams.founderCommission?.value > 50
    ) {
      errors.push("Founder commission must be between 0-50%");
    }
    if (
      systemParams.regionalCommission?.value < 0 ||
      systemParams.regionalCommission?.value > 30
    ) {
      errors.push("Regional commission must be between 0-30%");
    }
    if (
      systemParams.transactionFee?.value < 0 ||
      systemParams.transactionFee?.value > 5
    ) {
      errors.push("Transaction fee must be between 0-5%");
    }

    // Channel validation
    if (
      systemParams.channelStabilityThreshold?.value < 1 ||
      systemParams.channelStabilityThreshold?.value > 12
    ) {
      errors.push("Channel stability threshold must be between 1-12 months");
    }
    if (
      systemParams.channelMaxCandidates?.value < 3 ||
      systemParams.channelMaxCandidates?.value > 50
    ) {
      errors.push("Maximum candidates must be between 3-50");
    }

    // Voting validation
    if (
      systemParams.voteWeightDecay?.value < 0 ||
      systemParams.voteWeightDecay?.value > 1
    ) {
      errors.push("Vote weight decay must be between 0-1");
    }
    if (
      systemParams.minimumVoteAge?.value < 13 ||
      systemParams.minimumVoteAge?.value > 120
    ) {
      errors.push("Minimum vote age must be between 13-120");
    }

    // Governance validation
    if (
      systemParams.governanceQuorum?.value < 10 ||
      systemParams.governanceQuorum?.value > 90
    ) {
      errors.push("Governance quorum must be between 10-90%");
    }

    // Technical validation
    if (
      systemParams.maxConnectionsPerUser?.value < 10 ||
      systemParams.maxConnectionsPerUser?.value > 1000
    ) {
      errors.push("Maximum connections per user must be between 10-1000");
    }
    if (
      systemParams.performanceThreshold?.value < 50 ||
      systemParams.performanceThreshold?.value > 100
    ) {
      errors.push("Performance threshold must be between 50-100%");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Create default configuration
  getDefaultConfiguration() {
    return {
      version: "1.0",
      lastUpdated: null,
      systemParams: {
        // Economic Parameters
        founderCommission: {
          value: 5,
          decisionMaker: "founder",
          description: "Percentage commission to founder",
        },
        regionalCommission: {
          value: 0,
          decisionMaker: "founder",
          description: "Percentage commission to regions",
        },
        voterRewards: {
          value: 2,
          decisionMaker: "voters",
          description: "Percentage rewards to active voters",
        },
        transactionFee: {
          value: 0.5,
          decisionMaker: "founder",
          description: "Transaction fee percentage",
        },

        // Channel Parameters
        channelStabilityThreshold: {
          value: 3,
          decisionMaker: "founder",
          description: "Channel stability threshold (months)",
        },
        channelCreationFee: {
          value: 10,
          decisionMaker: "founder",
          description: "Channel creation fee",
        },
        channelDeletionThreshold: {
          value: 6,
          decisionMaker: "voters",
          description: "Months of inactivity before deletion",
        },
        channelMaxCandidates: {
          value: 10,
          decisionMaker: "founder",
          description: "Maximum candidates per channel",
        },

        // Voting Parameters
        voteWeightDecay: {
          value: 0.1,
          decisionMaker: "voters",
          description: "Vote weight decay per month",
        },
        minimumVoteAge: {
          value: 18,
          decisionMaker: "founder",
          description: "Minimum age to vote",
        },
        voteConfirmationThreshold: {
          value: 60,
          decisionMaker: "voters",
          description: "Vote confirmation threshold (%)",
        },
        voteLockPeriod: {
          value: 24,
          decisionMaker: "founder",
          description: "Vote lock period (hours)",
        },

        // Governance Parameters
        governanceQuorum: {
          value: 25,
          decisionMaker: "voters",
          description: "Governance quorum percentage",
        },
        proposalTimeLimit: {
          value: 30,
          decisionMaker: "founder",
          description: "Proposal time limit (days)",
        },
        emergencyThreshold: {
          value: 75,
          decisionMaker: "founder",
          description: "Emergency action threshold (%)",
        },
        founderVetoPower: {
          value: true,
          decisionMaker: "founder",
          description: "Founder veto power",
        },

        // Privacy & Security
        dataRetentionPeriod: {
          value: 12,
          decisionMaker: "founder",
          description: "Data retention period (months)",
        },
        encryptionLevel: {
          value: "AES-256",
          decisionMaker: "founder",
          description: "Encryption standard",
        },
        privacyDefault: {
          value: "public",
          decisionMaker: "voters",
          description: "Default privacy setting",
        },
        auditTrailRetention: {
          value: 24,
          decisionMaker: "founder",
          description: "Audit trail retention (months)",
        },

        // Technical Parameters
        maxConnectionsPerUser: {
          value: 100,
          decisionMaker: "founder",
          description: "Maximum connections per user",
        },
        messageRetentionDays: {
          value: 90,
          decisionMaker: "voters",
          description: "Message retention period (days)",
        },
        backupFrequency: {
          value: "daily",
          decisionMaker: "founder",
          description: "System backup frequency",
        },
        performanceThreshold: {
          value: 95,
          decisionMaker: "founder",
          description: "Performance threshold (%)",
        },

        // Regional Parameters
        regionalAutonomy: {
          value: 70,
          decisionMaker: "voters",
          description: "Regional autonomy percentage",
        },
        crossRegionVoting: {
          value: true,
          decisionMaker: "voters",
          description: "Allow cross-region voting",
        },
        regionalTaxRate: {
          value: 3,
          decisionMaker: "founder",
          description: "Regional tax rate (%)",
        },
        regionalMinimumPopulation: {
          value: 1000,
          decisionMaker: "founder",
          description: "Minimum population for region",
        },
      },
    };
  }
}

// Create singleton instance
const foundersReportService = new FoundersReportService();

export default foundersReportService;
