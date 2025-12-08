/**
 * @fileoverview CI/CD Production Gating System
 * Monitors critical metrics and blocks deployments if anomalies exceed baselines
 */

import { HashgraphMetricsSystem } from './hashgraphMetricsSystem.mjs';
import logger from '../utils/logging/logger.mjs';

const gatingLogger = logger.child({ module: 'cicd-gating' });

/**
 * Production Gating System for CI/CD
 */
export class ProductionGatingSystem {
  constructor(options = {}) {
    this.thresholds = {
      maxForkRate: options.maxForkRate || 0.1, // 10% of events
      maxGossipLatency: options.maxGossipLatency || 5000, // 5 seconds
      maxSybilAlertRate: options.maxSybilAlertRate || 0.05, // 5% of users
      minTransportUptime: options.minTransportUptime || 0.95, // 95% uptime
      maxPartitionDuration: options.maxPartitionDuration || 300000, // 5 minutes
      evaluationPeriod: options.evaluationPeriod || 3600000 // 1 hour
    };
    
    this.metricsSystem = new HashgraphMetricsSystem();
    this.lastEvaluation = null;
    this.deploymentBlocked = false;
    this.blockingReasons = [];
    
    gatingLogger.info('Production Gating System initialized', { thresholds: this.thresholds });
  }

  /**
   * Evaluate system health for deployment gating
   */
  async evaluateDeploymentReadiness() {
    gatingLogger.info('Starting deployment readiness evaluation');
    
    const now = Date.now();
    const startTime = now - this.evaluationPeriod;
    
    const evaluation = {
      timestamp: now,
      evaluationPeriod: this.evaluationPeriod,
      checks: {},
      overallStatus: 'pass',
      blockingIssues: [],
      warnings: []
    };

    // Check fork rate
    const forkCheck = await this.evaluateForkRate(startTime, now);
    evaluation.checks.forkRate = forkCheck;
    if (forkCheck.status === 'fail') {
      evaluation.blockingIssues.push(`Fork rate too high: ${forkCheck.value}%`);
      evaluation.overallStatus = 'fail';
    }

    // Check gossip latency
    const latencyCheck = await this.evaluateGossipLatency(startTime, now);
    evaluation.checks.gossipLatency = latencyCheck;
    if (latencyCheck.status === 'fail') {
      evaluation.blockingIssues.push(`Gossip latency too high: ${latencyCheck.value}ms`);
      evaluation.overallStatus = 'fail';
    }

    // Check Sybil alert rate
    const sybilCheck = await this.evaluateSybilAlertRate(startTime, now);
    evaluation.checks.sybilAlertRate = sybilCheck;
    if (sybilCheck.status === 'fail') {
      evaluation.blockingIssues.push(`Sybil alert rate too high: ${sybilCheck.value}%`);
      evaluation.overallStatus = 'fail';
    }

    // Check transport uptime
    const uptimeCheck = await this.evaluateTransportUptime(startTime, now);
    evaluation.checks.transportUptime = uptimeCheck;
    if (uptimeCheck.status === 'fail') {
      evaluation.blockingIssues.push(`Transport uptime too low: ${uptimeCheck.value}%`);
      evaluation.overallStatus = 'fail';
    }

    // Check partition duration
    const partitionCheck = await this.evaluatePartitionDuration(startTime, now);
    evaluation.checks.partitionDuration = partitionCheck;
    if (partitionCheck.status === 'fail') {
      evaluation.blockingIssues.push(`Partition duration too long: ${partitionCheck.value}ms`);
      evaluation.overallStatus = 'fail';
    }

    this.lastEvaluation = evaluation;
    this.deploymentBlocked = evaluation.overallStatus === 'fail';
    this.blockingReasons = evaluation.blockingIssues;

    gatingLogger.info('Deployment readiness evaluation completed', {
      status: evaluation.overallStatus,
      blocked: this.deploymentBlocked,
      issues: evaluation.blockingIssues.length
    });

    return evaluation;
  }

  /**
   * Evaluate fork rate against threshold
   */
  async evaluateForkRate(startTime, endTime) {
    const forksDetected = this.metricsSystem.getMetric('hashgraph_forks_detected_total');
    const eventsCreated = this.metricsSystem.getMetric('hashgraph_events_created_total');
    
    if (!forksDetected || !eventsCreated) {
      return { status: 'warning', value: 0, reason: 'No fork/event data available' };
    }

    const forkData = forksDetected.getDataPointsInRange(startTime, endTime);
    const eventData = eventsCreated.getDataPointsInRange(startTime, endTime);
    
    const totalForks = forkData.reduce((sum, point) => sum + point.value, 0);
    const totalEvents = eventData.reduce((sum, point) => sum + point.value, 0);
    
    const forkRate = totalEvents > 0 ? (totalForks / totalEvents) * 100 : 0;
    
    return {
      status: forkRate <= this.thresholds.maxForkRate * 100 ? 'pass' : 'fail',
      value: forkRate.toFixed(2),
      threshold: this.thresholds.maxForkRate * 100,
      reason: forkRate > this.thresholds.maxForkRate * 100 ? 'Fork rate exceeds threshold' : 'Fork rate within acceptable range'
    };
  }

  /**
   * Evaluate gossip latency against threshold
   */
  async evaluateGossipLatency(startTime, endTime) {
    const latencyMetric = this.metricsSystem.getMetric('hashgraph_gossip_propagation_delay_ms');
    
    if (!latencyMetric) {
      return { status: 'warning', value: 0, reason: 'No latency data available' };
    }

    const latencyData = latencyMetric.getDataPointsInRange(startTime, endTime);
    
    if (latencyData.length === 0) {
      return { status: 'warning', value: 0, reason: 'No latency measurements in period' };
    }

    // Calculate 95th percentile latency
    const sortedLatencies = latencyData.map(p => p.value).sort((a, b) => a - b);
    const p95Index = Math.floor(sortedLatencies.length * 0.95);
    const p95Latency = sortedLatencies[p95Index] || 0;
    
    return {
      status: p95Latency <= this.thresholds.maxGossipLatency ? 'pass' : 'fail',
      value: p95Latency,
      threshold: this.thresholds.maxGossipLatency,
      reason: p95Latency > this.thresholds.maxGossipLatency ? 'P95 latency exceeds threshold' : 'Latency within acceptable range'
    };
  }

  /**
   * Evaluate Sybil alert rate against threshold
   */
  async evaluateSybilAlertRate(startTime, endTime) {
    const sybilMetric = this.metricsSystem.getMetric('hashgraph_sybil_alerts_total');
    const usersMetric = this.metricsSystem.getMetric('hashgraph_connected_peers');
    
    if (!sybilMetric || !usersMetric) {
      return { status: 'warning', value: 0, reason: 'No Sybil/user data available' };
    }

    const sybilData = sybilMetric.getDataPointsInRange(startTime, endTime);
    const userData = usersMetric.getDataPointsInRange(startTime, endTime);
    
    const totalAlerts = sybilData.reduce((sum, point) => sum + point.value, 0);
    const avgUsers = userData.length > 0 ? userData.reduce((sum, point) => sum + point.value, 0) / userData.length : 0;
    
    const alertRate = avgUsers > 0 ? (totalAlerts / avgUsers) * 100 : 0;
    
    return {
      status: alertRate <= this.thresholds.maxSybilAlertRate * 100 ? 'pass' : 'fail',
      value: alertRate.toFixed(2),
      threshold: this.thresholds.maxSybilAlertRate * 100,
      reason: alertRate > this.thresholds.maxSybilAlertRate * 100 ? 'Sybil alert rate exceeds threshold' : 'Alert rate within acceptable range'
    };
  }

  /**
   * Evaluate transport uptime against threshold
   */
  async evaluateTransportUptime(startTime, endTime) {
    const peersMetric = this.metricsSystem.getMetric('hashgraph_connected_peers');
    
    if (!peersMetric) {
      return { status: 'warning', value: 0, reason: 'No transport data available' };
    }

    const peerData = peersMetric.getDataPointsInRange(startTime, endTime);
    
    if (peerData.length === 0) {
      return { status: 'fail', value: 0, reason: 'No transport measurements in period' };
    }

    // Calculate uptime as percentage of time with active connections
    const connectedTime = peerData.filter(p => p.value > 0).length;
    const totalTime = peerData.length;
    const uptime = totalTime > 0 ? (connectedTime / totalTime) * 100 : 0;
    
    return {
      status: uptime >= this.thresholds.minTransportUptime * 100 ? 'pass' : 'fail',
      value: uptime.toFixed(2),
      threshold: this.thresholds.minTransportUptime * 100,
      reason: uptime < this.thresholds.minTransportUptime * 100 ? 'Transport uptime below threshold' : 'Transport uptime acceptable'
    };
  }

  /**
   * Evaluate network partition duration
   */
  async evaluatePartitionDuration(startTime, endTime) {
    const partitionMetric = this.metricsSystem.getMetric('hashgraph_partition_duration_ms');
    
    if (!partitionMetric) {
      return { status: 'pass', value: 0, reason: 'No partition data (good)' };
    }

    const partitionData = partitionMetric.getDataPointsInRange(startTime, endTime);
    
    if (partitionData.length === 0) {
      return { status: 'pass', value: 0, reason: 'No partitions detected in period' };
    }

    // Find longest partition duration
    const maxDuration = Math.max(...partitionData.map(p => p.value));
    
    return {
      status: maxDuration <= this.thresholds.maxPartitionDuration ? 'pass' : 'fail',
      value: maxDuration,
      threshold: this.thresholds.maxPartitionDuration,
      reason: maxDuration > this.thresholds.maxPartitionDuration ? 'Partition duration exceeded threshold' : 'Partition durations acceptable'
    };
  }

  /**
   * Check if deployment should be blocked
   */
  isDeploymentBlocked() {
    return this.deploymentBlocked;
  }

  /**
   * Get blocking reasons
   */
  getBlockingReasons() {
    return this.blockingReasons;
  }

  /**
   * Get last evaluation results
   */
  getLastEvaluation() {
    return this.lastEvaluation;
  }

  /**
   * Generate CI/CD gate report
   */
  generateGateReport() {
    if (!this.lastEvaluation) {
      return {
        status: 'error',
        message: 'No evaluation has been performed'
      };
    }

    return {
      timestamp: this.lastEvaluation.timestamp,
      deploymentApproved: !this.deploymentBlocked,
      gateStatus: this.lastEvaluation.overallStatus,
      checks: this.lastEvaluation.checks,
      blockingIssues: this.blockingReasons,
      warnings: this.lastEvaluation.warnings,
      recommendation: this.deploymentBlocked ? 
        'DEPLOYMENT BLOCKED - Resolve issues before proceeding' :
        'DEPLOYMENT APPROVED - All gates passed'
    };
  }
}
