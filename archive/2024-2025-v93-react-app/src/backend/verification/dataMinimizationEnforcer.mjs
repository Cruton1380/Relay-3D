/**
 * Data Minimization Enforcer
 * 
 * INVARIANT 4 (LOCKED):
 * "Pressure is continuous verification, not continuous surveillance.
 * Collect minimum data, shortest retention, strictest scope."
 * 
 * This enforcer ensures Relay NEVER becomes a surveillance system.
 */

export class DataMinimizationEnforcer {
  constructor(policy = {}) {
    this.policy = {
      // Whitelist of allowed telemetry (NOT blacklist)
      allowed_telemetry: {
        required: policy.required || ['config_hash', 'patch_level', 'service_status'],
        optional: policy.optional || ['network_state', 'process_list'],
        prohibited: policy.prohibited || ['keystrokes', 'screen_content', 'biometric_data', 'location']
      },
      
      // Default mode
      default_mode: 'aggregated',
      
      // Raw telemetry rules
      raw_telemetry: {
        requires_explicit_consent: true,
        max_retention_days: policy.max_retention_days || 7,
        automatic_expiration: true,
        consent_renewal_required: true
      },
      
      // PII handling
      pii: {
        collection_mode: 'avoid', // avoid | pseudonymize | encrypt
        retention_limit_days: 30,
        redaction_rules: policy.redaction_rules || []
      }
    };
  }

  /**
   * Collect telemetry (enforces minimization)
   */
  collectTelemetry(attestations) {
    const minimized = [];
    
    for (const attestation of attestations) {
      // Check consent
      const consent = attestation.anchor?.consent;
      
      // Collect only required data by default
      const required_data = this.extractRequired(attestation.telemetry);
      
      // If raw consent given, collect optional data too
      if (consent?.raw_telemetry && consent.raw_until > Date.now()) {
        const optional_data = this.extractOptional(attestation.telemetry, consent.scope);
        minimized.push({
          ...attestation,
          telemetry: { ...required_data, ...optional_data },
          mode: 'raw'
        });
      } else {
        // Aggregate only
        const aggregated = this.aggregate(required_data);
        minimized.push({
          ...attestation,
          telemetry: aggregated,
          mode: 'aggregated'
        });
      }
    }
    
    return minimized;
  }

  /**
   * Extract required data only
   */
  extractRequired(telemetry) {
    const required = {};
    for (const field of this.policy.allowed_telemetry.required) {
      if (telemetry[field]) {
        required[field] = telemetry[field];
      }
    }
    return required;
  }

  /**
   * Extract optional data (if consented)
   */
  extractOptional(telemetry, scope = []) {
    const optional = {};
    for (const field of this.policy.allowed_telemetry.optional) {
      if (scope.includes(field) && telemetry[field]) {
        optional[field] = telemetry[field];
      }
    }
    return optional;
  }

  /**
   * Aggregate data (remove granularity)
   */
  aggregate(data) {
    // Example: Hash sensitive fields, remove timestamps, etc.
    const aggregated = {};
    for (const [key, value] of Object.entries(data)) {
      aggregated[key] = this.aggregateValue(value);
    }
    return aggregated;
  }

  aggregateValue(value) {
    // Placeholder: Real implementation would hash/truncate/round
    return value;
  }

  /**
   * Check for prohibited data
   */
  prohibitedDataCheck(data) {
    for (const prohibited of this.policy.allowed_telemetry.prohibited) {
      if (data[prohibited]) {
        throw new Error(
          `PROHIBITED DATA COLLECTED: ${prohibited}. ` +
          `This violates data minimization policy (Invariant 4).`
        );
      }
    }
  }
}

export default DataMinimizationEnforcer;
