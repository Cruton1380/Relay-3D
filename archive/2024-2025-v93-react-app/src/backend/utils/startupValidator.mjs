/**
 * Startup Validation System
 * Ensures all critical components are properly initialized before starting services
 */

import logger from '../utils/logging/logger.mjs';
import { PATHS } from '../config/paths.mjs';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const startupLogger = logger.child({ module: 'startup-validator' });

class StartupValidator {
  constructor() {
    this.checks = [];
    this.criticalFailures = [];
    this.warnings = [];
  }

  /**
   * Add a validation check
   */
  addCheck(name, checkFunction, isCritical = true) {
    this.checks.push({ name, checkFunction, isCritical });
  }

  /**
   * Validate import paths exist
   */
  validateImportPaths() {
    const criticalImports = [
      { path: PATHS.LOGGING + '/logger.mjs', name: 'Logger' },
      { path: PATHS.BLOCKCHAIN + '/blockchain.mjs', name: 'Blockchain' },
      { path: PATHS.BACKEND_ROOT + '/state/state.mjs', name: 'State Manager' }
    ];

    criticalImports.forEach(({ path, name }) => {
      if (!existsSync(path)) {
        this.criticalFailures.push(`Missing critical file: ${name} at ${path}`);
      }
    });
  }

  /**
   * Validate data directories exist
   */
  validateDataDirectories() {
    const requiredDirs = [
      PATHS.DATA_ROOT,
      PATHS.BLOCKCHAIN,
      PATHS.USERS,
      PATHS.VOTING_DATA,
      PATHS.LOGS
    ];

    requiredDirs.forEach(dir => {
      if (!existsSync(dir)) {
        this.warnings.push(`Data directory missing: ${dir}`);
      }
    });
  }

  /**
   * Validate blockchain integrity
   */
  async validateBlockchain() {
    try {
      const { blockchain } = await import(PATHS.BLOCKCHAIN + '/blockchain.mjs');
      await blockchain.initialize();
      
      if (blockchain.chain.length === 0) {
        this.warnings.push('Blockchain is empty - this may be expected for new installations');
      }
      
      startupLogger.info('Blockchain validation passed', {
        chainLength: blockchain.chain.length,
        lastBlockHash: blockchain.chain[blockchain.chain.length - 1]?.hash
      });
    } catch (error) {
      this.criticalFailures.push(`Blockchain validation failed: ${error.message}`);
    }
  }

  /**
   * Validate vote system integrity
   */
  async validateVoteSystem() {
    try {
      const { getTopicVoteTotals } = await import(PATHS.VOTING + '/votingEngine.mjs');
      
      // Test vote totals function
      const testTotals = getTopicVoteTotals('test-topic');
      
      if (typeof testTotals.totalVotes !== 'number') {
        this.criticalFailures.push('Vote system not returning proper totals structure');
      }
      
      startupLogger.info('Vote system validation passed');
    } catch (error) {
      this.criticalFailures.push(`Vote system validation failed: ${error.message}`);
    }
  }

  /**
   * Run all validation checks
   */
  async runAllChecks() {
    startupLogger.info('Starting system validation...');

    // Run synchronous checks
    this.validateImportPaths();
    this.validateDataDirectories();

    // Run asynchronous checks
    await this.validateBlockchain();
    await this.validateVoteSystem();

    // Run custom checks
    for (const check of this.checks) {
      try {
        await check.checkFunction();
        startupLogger.debug(`Check passed: ${check.name}`);
      } catch (error) {
        const message = `Check failed: ${check.name} - ${error.message}`;
        if (check.isCritical) {
          this.criticalFailures.push(message);
        } else {
          this.warnings.push(message);
        }
      }
    }

    // Report results
    this.reportResults();
    
    return this.criticalFailures.length === 0;
  }

  /**
   * Report validation results
   */
  reportResults() {
    if (this.criticalFailures.length > 0) {
      startupLogger.error('Critical validation failures:', {
        failures: this.criticalFailures
      });
    }

    if (this.warnings.length > 0) {
      startupLogger.warn('Validation warnings:', {
        warnings: this.warnings
      });
    }

    if (this.criticalFailures.length === 0 && this.warnings.length === 0) {
      startupLogger.info('All validation checks passed successfully');
    }
  }
}

export default StartupValidator;
