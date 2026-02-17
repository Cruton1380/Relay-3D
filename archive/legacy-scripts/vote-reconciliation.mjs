/**
 * Vote System Reconciliation Script
 * Verifies vote system integrity and provides repair options
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api/vote/authoritative';

class VoteReconciliationScript {
  constructor() {
    this.results = [];
  }

  /**
   * Log reconciliation result
   */
  log(level, message, data = {}) {
    const result = {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);

    const emoji = {
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'critical': '🚨'
    };

    console.log(`${emoji[level] || '•'} ${message}`);
    if (Object.keys(data).length > 0) {
      console.log('  ', JSON.stringify(data, null, 2));
    }
  }

  /**
   * Get reconciliation status for a topic
   */
  async getReconciliation(topicId) {
    try {
      const response = await fetch(`${API_BASE}/topic/${encodeURIComponent(topicId)}/reconciliation`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      return await response.json();
    } catch (error) {
      this.log('error', `Failed to get reconciliation for topic ${topicId}`, { error: error.message });
      return null;
    }
  }

  /**
   * Get vote totals for a topic
   */
  async getVoteTotals(topicId) {
    try {
      const response = await fetch(`${API_BASE}/topic/${encodeURIComponent(topicId)}/totals`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      return await response.json();
    } catch (error) {
      this.log('error', `Failed to get vote totals for topic ${topicId}`, { error: error.message });
      return null;
    }
  }

  /**
   * Get audit log for a topic
   */
  async getAuditLog(topicId, limit = 10) {
    try {
      const response = await fetch(`${API_BASE}/topic/${encodeURIComponent(topicId)}/audit?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      return await response.json();
    } catch (error) {
      this.log('error', `Failed to get audit log for topic ${topicId}`, { error: error.message });
      return null;
    }
  }

  /**
   * Rebuild vote totals from authoritative ledger
   */
  async rebuildVoteTotals(topicId = null) {
    try {
      const url = topicId 
        ? `${API_BASE}/rebuild/${encodeURIComponent(topicId)}`
        : `${API_BASE}/rebuild`;
        
      const response = await fetch(url, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      return await response.json();
    } catch (error) {
      this.log('error', `Failed to rebuild vote totals`, { topicId, error: error.message });
      return null;
    }
  }

  /**
   * Get all known channels for testing
   */
  async getKnownChannels() {
    try {
      const response = await fetch('http://localhost:3002/api/channels');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : (data.channels || []);
    } catch (error) {
      this.log('warning', 'Could not fetch channels, using default test channels', { error: error.message });
      return [{ id: 'general', name: 'General Channel' }];
    }
  }

  /**
   * Verify vote system integrity for a single topic
   */
  async verifyTopicIntegrity(topicId) {
    this.log('info', `Verifying integrity for topic: ${topicId}`);

    // Get vote totals
    const totalsResponse = await this.getVoteTotals(topicId);
    if (!totalsResponse) {
      return { topicId, status: 'error', message: 'Could not fetch vote totals' };
    }

    const totals = totalsResponse.data;

    // Get reconciliation status
    const reconciliationResponse = await this.getReconciliation(topicId);
    if (!reconciliationResponse) {
      return { topicId, status: 'error', message: 'Could not fetch reconciliation status' };
    }

    const reconciliation = reconciliationResponse.data.reconciliation;

    // Get recent audit log
    const auditResponse = await this.getAuditLog(topicId, 5);
    const auditEntries = auditResponse ? auditResponse.data.auditEntries : [];

    // Analyze integrity
    const analysis = {
      topicId,
      totalVotes: totals.totalVotes,
      candidateCount: Object.keys(totals.candidates).length,
      reconciled: reconciliation.valid,
      auditEntries: auditEntries.length,
      lastUpdated: totals.lastUpdated
    };

    if (reconciliation.valid && totals.totalVotes >= 0) {
      this.log('success', `Topic ${topicId} integrity verified`, analysis);
      return { ...analysis, status: 'healthy' };
    } else {
      this.log('critical', `Topic ${topicId} integrity FAILED`, {
        ...analysis,
        reconciliation,
        issues: {
          invalidReconciliation: !reconciliation.valid,
          negativeVotes: totals.totalVotes < 0
        }
      });
      return { ...analysis, status: 'corrupted', reconciliation };
    }
  }

  /**
   * Repair vote system integrity for a topic
   */
  async repairTopicIntegrity(topicId) {
    this.log('warning', `Attempting to repair topic: ${topicId}`);

    // Get current state
    const beforeState = await this.getVoteTotals(topicId);
    const beforeReconciliation = await this.getReconciliation(topicId);

    // Rebuild vote totals from authoritative ledger
    const rebuildResult = await this.rebuildVoteTotals(topicId);
    if (!rebuildResult) {
      this.log('error', `Failed to rebuild vote totals for topic ${topicId}`);
      return { topicId, repaired: false, message: 'Rebuild failed' };
    }

    // Verify repair worked
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for rebuild to complete
    
    const afterState = await this.getVoteTotals(topicId);
    const afterReconciliation = await this.getReconciliation(topicId);

    const repairSuccess = afterReconciliation?.data?.reconciliation?.valid === true;

    if (repairSuccess) {
      this.log('success', `Topic ${topicId} successfully repaired`, {
        before: {
          totalVotes: beforeState?.data?.totalVotes,
          reconciled: beforeReconciliation?.data?.reconciliation?.valid
        },
        after: {
          totalVotes: afterState?.data?.totalVotes,
          reconciled: afterReconciliation?.data?.reconciliation?.valid
        },
        rebuildStats: rebuildResult?.data
      });
    } else {
      this.log('error', `Topic ${topicId} repair failed`, {
        rebuildResult: rebuildResult?.data,
        afterReconciliation: afterReconciliation?.data?.reconciliation
      });
    }

    return {
      topicId,
      repaired: repairSuccess,
      before: beforeState?.data,
      after: afterState?.data,
      rebuildStats: rebuildResult?.data
    };
  }

  /**
   * Run comprehensive vote system health check
   */
  async runHealthCheck(autoRepair = false) {
    console.log('🏥 Starting Vote System Health Check...\n');

    // Get all channels to check
    const channels = await this.getKnownChannels();
    this.log('info', `Found ${channels.length} channels to verify`);

    const results = {
      healthy: [],
      corrupted: [],
      errors: [],
      repaired: []
    };

    // Check each channel
    for (const channel of channels) {
      const integrity = await this.verifyTopicIntegrity(channel.id);
      
      if (integrity.status === 'healthy') {
        results.healthy.push(integrity);
      } else if (integrity.status === 'corrupted') {
        results.corrupted.push(integrity);
        
        // Auto-repair if requested
        if (autoRepair) {
          const repairResult = await this.repairTopicIntegrity(channel.id);
          results.repaired.push(repairResult);
        }
      } else {
        results.errors.push(integrity);
      }
    }

    // Generate summary
    console.log('\n📊 Health Check Summary:');
    console.log(`Total Channels: ${channels.length}`);
    console.log(`Healthy: ${results.healthy.length} ✅`);
    console.log(`Corrupted: ${results.corrupted.length} 🚨`);
    console.log(`Errors: ${results.errors.length} ❌`);
    
    if (autoRepair) {
      const successfulRepairs = results.repaired.filter(r => r.repaired).length;
      console.log(`Repaired: ${successfulRepairs}/${results.repaired.length} 🔧`);
    }

    // Show recommendations
    if (results.corrupted.length > 0 && !autoRepair) {
      console.log('\n🔧 Recommendations:');
      console.log('  Run with --auto-repair to attempt automatic fixes');
      console.log('  Or manually rebuild vote totals for corrupted topics');
    }

    return {
      summary: {
        total: channels.length,
        healthy: results.healthy.length,
        corrupted: results.corrupted.length,
        errors: results.errors.length,
        repaired: autoRepair ? results.repaired.filter(r => r.repaired).length : 0
      },
      details: results,
      logs: this.results
    };
  }

  /**
   * Monitor vote system continuously
   */
  async monitorContinuously(intervalMs = 30000) {
    console.log(`🔍 Starting continuous monitoring (checking every ${intervalMs}ms)...`);
    
    while (true) {
      try {
        const healthCheck = await this.runHealthCheck(false);
        
        if (healthCheck.summary.corrupted > 0) {
          this.log('critical', `Found ${healthCheck.summary.corrupted} corrupted channels during monitoring`);
        } else {
          this.log('info', `All ${healthCheck.summary.healthy} channels healthy`);
        }
        
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } catch (error) {
        this.log('error', 'Error during continuous monitoring', { error: error.message });
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
  }
}

// Export for use in Node.js
export { VoteReconciliationScript };

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const autoRepair = args.includes('--auto-repair');
  const continuous = args.includes('--monitor');
  
  const reconciliation = new VoteReconciliationScript();
  
  if (continuous) {
    reconciliation.monitorContinuously().catch(error => {
      console.error('❌ Monitoring failed:', error);
      process.exit(1);
    });
  } else {
    reconciliation.runHealthCheck(autoRepair).then(results => {
      const exitCode = results.summary.corrupted > 0 ? 1 : 0;
      process.exit(exitCode);
    }).catch(error => {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    });
  }
}
