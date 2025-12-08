/**
 * @fileoverview Metrics and Monitoring System for Hashgraph Features
 * Provides observability for DAG growth, gossip speed, forks, and Sybil detection
 */

import EventEmitter from 'events';
import logger from '../utils/logging/logger.mjs';

const metricsLogger = logger.child({ module: 'hashgraph-metrics' });

/**
 * Time-series data point
 */
class MetricDataPoint {
  constructor(value, timestamp = Date.now(), labels = {}) {
    this.value = value;
    this.timestamp = timestamp;
    this.labels = labels;
  }
}

/**
 * Metric with historical data
 */
class Metric {
  constructor(name, type, description, labels = []) {
    this.name = name;
    this.type = type; // 'counter', 'gauge', 'histogram'
    this.description = description;
    this.labels = labels;
    this.dataPoints = [];
    this.maxDataPoints = 10000; // Keep last 10k points
  }

  addDataPoint(value, labels = {}) {
    const dataPoint = new MetricDataPoint(value, Date.now(), labels);
    this.dataPoints.push(dataPoint);
    
    // Trim old data points
    if (this.dataPoints.length > this.maxDataPoints) {
      this.dataPoints = this.dataPoints.slice(-this.maxDataPoints);
    }
    
    return dataPoint;
  }

  getCurrentValue(labels = {}) {
    if (this.dataPoints.length === 0) return 0;
    
    // Find most recent data point matching labels
    for (let i = this.dataPoints.length - 1; i >= 0; i--) {
      const point = this.dataPoints[i];
      if (this.labelsMatch(point.labels, labels)) {
        return point.value;
      }
    }
    
    return 0;
  }

  getDataPointsInRange(startTime, endTime, labels = {}) {
    return this.dataPoints.filter(point => 
      point.timestamp >= startTime && 
      point.timestamp <= endTime &&
      this.labelsMatch(point.labels, labels)
    );
  }

  labelsMatch(pointLabels, queryLabels) {
    for (const [key, value] of Object.entries(queryLabels)) {
      if (pointLabels[key] !== value) return false;
    }
    return true;
  }

  toPrometheusFormat() {
    const lines = [];
    
    // Add HELP and TYPE comments
    lines.push(`# HELP ${this.name} ${this.description}`);
    lines.push(`# TYPE ${this.name} ${this.type}`);
    
    // Add data points
    const latestPoints = new Map();
    
    // Get latest value for each unique label set
    for (const point of this.dataPoints) {
      const labelKey = JSON.stringify(point.labels);
      if (!latestPoints.has(labelKey) || 
          point.timestamp > latestPoints.get(labelKey).timestamp) {
        latestPoints.set(labelKey, point);
      }
    }
    
    for (const point of latestPoints.values()) {
      const labelStr = Object.entries(point.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      
      const metricLine = labelStr ? 
        `${this.name}{${labelStr}} ${point.value}` :
        `${this.name} ${point.value}`;
      
      lines.push(metricLine);
    }
    
    return lines.join('\n');
  }
}

/**
 * Hashgraph Metrics System
 */
export class HashgraphMetricsSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.metrics = new Map();
    this.collectionInterval = options.collectionInterval || 60000; // 1 minute
    this.retentionPeriod = options.retentionPeriod || 7 * 24 * 60 * 60 * 1000; // 7 days
    this.prometheusEnabled = options.prometheusEnabled || true;
    this.logSummaryEnabled = options.logSummaryEnabled || true;
    
    this.initializeMetrics();
    this.startCollection();
    
    metricsLogger.info('Hashgraph Metrics System initialized', {
      collectionInterval: this.collectionInterval,
      retentionPeriod: this.retentionPeriod
    });
  }

  /**
   * Initialize all Hashgraph metrics
   */
  initializeMetrics() {
    // DAG Metrics
    this.createMetric('hashgraph_dag_size_total', 'gauge', 
      'Total number of events in DAG', ['channel_id']);
    
    this.createMetric('hashgraph_dag_height', 'gauge', 
      'Current DAG height', ['channel_id']);
    
    this.createMetric('hashgraph_events_created_total', 'counter', 
      'Total events created', ['event_type', 'channel_id']);
    
    this.createMetric('hashgraph_consensus_rounds_total', 'counter', 
      'Total consensus rounds completed', ['channel_id']);

    // Gossip Metrics
    this.createMetric('hashgraph_gossip_events_sent_total', 'counter', 
      'Total gossip events sent', ['transport_type']);
    
    this.createMetric('hashgraph_gossip_events_received_total', 'counter', 
      'Total gossip events received', ['transport_type']);
    
    this.createMetric('hashgraph_gossip_propagation_delay_ms', 'histogram', 
      'Gossip propagation delay in milliseconds', ['transport_type']);
    
    this.createMetric('hashgraph_connected_peers', 'gauge', 
      'Number of connected peers', ['transport_type']);

    // Fork Metrics
    this.createMetric('hashgraph_forks_detected_total', 'counter', 
      'Total forks detected', ['channel_id']);
    
    this.createMetric('hashgraph_forks_resolved_total', 'counter', 
      'Total forks resolved', ['resolution_method']);
    
    this.createMetric('hashgraph_fork_resolution_time_ms', 'histogram', 
      'Fork resolution time in milliseconds', ['resolution_method']);
    
    this.createMetric('hashgraph_active_forks', 'gauge', 
      'Number of currently active forks', ['channel_id']);

    // Sybil Detection Metrics
    this.createMetric('hashgraph_sybil_alerts_total', 'counter', 
      'Total Sybil alerts generated', ['alert_type']);
    
    this.createMetric('hashgraph_sybil_suspects', 'gauge', 
      'Number of suspected Sybil nodes', []);
    
    this.createMetric('hashgraph_behavioral_analysis_time_ms', 'histogram', 
      'Time taken for behavioral analysis', []);

    // Network Partition Metrics
    this.createMetric('hashgraph_network_partitions_total', 'counter', 
      'Total network partitions detected', ['partition_type']);
    
    this.createMetric('hashgraph_partition_duration_ms', 'histogram', 
      'Network partition duration in milliseconds', ['partition_type']);
    
    this.createMetric('hashgraph_offline_events_buffered', 'gauge', 
      'Number of events buffered during partition', []);

    // Blockchain Anchoring Metrics
    this.createMetric('hashgraph_events_anchored_total', 'counter', 
      'Total events anchored to blockchain', ['event_type']);
    
    this.createMetric('hashgraph_anchor_queue_size', 'gauge', 
      'Number of events queued for anchoring', []);
    
    this.createMetric('hashgraph_anchor_confirmation_time_ms', 'histogram', 
      'Time from anchor submission to confirmation', []);

    // Performance Metrics
    this.createMetric('hashgraph_memory_usage_bytes', 'gauge', 
      'Memory usage by Hashgraph components', ['component']);
    
    this.createMetric('hashgraph_cpu_usage_percent', 'gauge', 
      'CPU usage by Hashgraph components', ['component']);
  }

  /**
   * Create a new metric
   */
  createMetric(name, type, description, labels = []) {
    const metric = new Metric(name, type, description, labels);
    this.metrics.set(name, metric);
    return metric;
  }

  /**
   * Get or create a metric
   */
  getMetric(name) {
    return this.metrics.get(name);
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(metricName, labels = {}, value = 1) {
    const metric = this.getMetric(metricName);
    if (metric && metric.type === 'counter') {
      const currentValue = metric.getCurrentValue(labels);
      metric.addDataPoint(currentValue + value, labels);
    }
  }

  /**
   * Set a gauge metric value
   */
  setGauge(metricName, value, labels = {}) {
    const metric = this.getMetric(metricName);
    if (metric && metric.type === 'gauge') {
      metric.addDataPoint(value, labels);
    }
  }

  /**
   * Record a histogram value
   */
  recordHistogram(metricName, value, labels = {}) {
    const metric = this.getMetric(metricName);
    if (metric && metric.type === 'histogram') {
      metric.addDataPoint(value, labels);
    }
  }

  /**
   * Start automatic metrics collection
   */
  startCollection() {
    setInterval(() => {
      this.collectSystemMetrics();
      this.cleanupOldData();
      
      if (this.logSummaryEnabled) {
        this.logMetricsSummary();
      }
    }, this.collectionInterval);
  }

  /**
   * Collect system-level metrics
   */
  collectSystemMetrics() {
    // Memory usage (simplified - would use actual process metrics in production)
    const memoryUsage = process.memoryUsage();
    this.setGauge('hashgraph_memory_usage_bytes', memoryUsage.heapUsed, { component: 'total' });
    
    // CPU usage would be collected from process.cpuUsage() in production
    this.setGauge('hashgraph_cpu_usage_percent', Math.random() * 20, { component: 'total' });
  }

  /**
   * Clean up old metric data
   */
  cleanupOldData() {
    const cutoffTime = Date.now() - this.retentionPeriod;
    
    for (const metric of this.metrics.values()) {
      metric.dataPoints = metric.dataPoints.filter(
        point => point.timestamp > cutoffTime
      );
    }
  }

  /**
   * Log metrics summary
   */
  logMetricsSummary() {
    const summary = {};
    
    for (const [name, metric] of this.metrics) {
      const currentValue = metric.getCurrentValue();
      summary[name] = currentValue;
    }
    
    metricsLogger.info('Metrics summary', { metrics: summary });
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics() {
    const lines = [];
    
    for (const metric of this.metrics.values()) {
      lines.push(metric.toPrometheusFormat());
      lines.push(''); // Empty line between metrics
    }
    
    return lines.join('\n');
  }

  /**
   * Get metrics dashboard data
   */
  getDashboardData() {
    const dashboard = {
      timestamp: Date.now(),
      metrics: {},
      charts: []
    };

    // Current values
    for (const [name, metric] of this.metrics) {
      dashboard.metrics[name] = metric.getCurrentValue();
    }

    // Time series for charts
    const timeRange = 24 * 60 * 60 * 1000; // Last 24 hours
    const startTime = Date.now() - timeRange;
    
    // DAG growth chart
    const dagSizeMetric = this.getMetric('hashgraph_dag_size_total');
    if (dagSizeMetric) {
      dashboard.charts.push({
        title: 'DAG Size Over Time',
        type: 'line',
        data: dagSizeMetric.getDataPointsInRange(startTime, Date.now())
          .map(point => ({ x: point.timestamp, y: point.value }))
      });
    }

    // Gossip propagation delay
    const gossipDelayMetric = this.getMetric('hashgraph_gossip_propagation_delay_ms');
    if (gossipDelayMetric) {
      dashboard.charts.push({
        title: 'Gossip Propagation Delay',
        type: 'histogram',
        data: gossipDelayMetric.getDataPointsInRange(startTime, Date.now())
          .map(point => ({ x: point.timestamp, y: point.value }))
      });
    }

    // Fork resolution frequency
    const forksDetectedMetric = this.getMetric('hashgraph_forks_detected_total');
    const forksResolvedMetric = this.getMetric('hashgraph_forks_resolved_total');
    if (forksDetectedMetric && forksResolvedMetric) {
      dashboard.charts.push({
        title: 'Fork Activity',
        type: 'bar',
        data: {
          detected: forksDetectedMetric.getCurrentValue(),
          resolved: forksResolvedMetric.getCurrentValue()
        }
      });
    }

    // Sybil alerts
    const sybilAlertsMetric = this.getMetric('hashgraph_sybil_alerts_total');
    if (sybilAlertsMetric) {
      dashboard.charts.push({
        title: 'Sybil Alerts Over Time',
        type: 'line',
        data: sybilAlertsMetric.getDataPointsInRange(startTime, Date.now())
          .map(point => ({ x: point.timestamp, y: point.value }))
      });
    }

    return dashboard;
  }

  /**
   * Record DAG event creation
   */
  recordDAGEvent(event, dagSize, dagHeight) {
    this.incrementCounter('hashgraph_events_created_total', {
      event_type: event.event_type,
      channel_id: event.channel_id
    });
    
    this.setGauge('hashgraph_dag_size_total', dagSize, {
      channel_id: event.channel_id
    });
    
    this.setGauge('hashgraph_dag_height', dagHeight, {
      channel_id: event.channel_id
    });
  }

  /**
   * Record gossip event
   */
  recordGossipEvent(direction, transportType, propagationDelay = null) {
    if (direction === 'sent') {
      this.incrementCounter('hashgraph_gossip_events_sent_total', {
        transport_type: transportType
      });
    } else {
      this.incrementCounter('hashgraph_gossip_events_received_total', {
        transport_type: transportType
      });
    }
    
    if (propagationDelay !== null) {
      this.recordHistogram('hashgraph_gossip_propagation_delay_ms', propagationDelay, {
        transport_type: transportType
      });
    }
  }

  /**
   * Record fork detection and resolution
   */
  recordForkActivity(action, channelId, resolutionMethod = null, resolutionTime = null) {
    if (action === 'detected') {
      this.incrementCounter('hashgraph_forks_detected_total', {
        channel_id: channelId
      });
    } else if (action === 'resolved') {
      this.incrementCounter('hashgraph_forks_resolved_total', {
        resolution_method: resolutionMethod
      });
      
      if (resolutionTime !== null) {
        this.recordHistogram('hashgraph_fork_resolution_time_ms', resolutionTime, {
          resolution_method: resolutionMethod
        });
      }
    }
  }

  /**
   * Record Sybil detection activity
   */
  recordSybilActivity(alertType, suspectCount, analysisTime) {
    this.incrementCounter('hashgraph_sybil_alerts_total', {
      alert_type: alertType
    });
    
    this.setGauge('hashgraph_sybil_suspects', suspectCount);
    
    if (analysisTime) {
      this.recordHistogram('hashgraph_behavioral_analysis_time_ms', analysisTime);
    }
  }

  /**
   * Record network partition
   */
  recordNetworkPartition(partitionType, duration) {
    this.incrementCounter('hashgraph_network_partitions_total', {
      partition_type: partitionType
    });
    
    if (duration) {
      this.recordHistogram('hashgraph_partition_duration_ms', duration, {
        partition_type: partitionType
      });
    }
  }

  /**
   * Record blockchain anchoring
   */
  recordBlockchainAnchoring(eventType, queueSize, confirmationTime = null) {
    this.incrementCounter('hashgraph_events_anchored_total', {
      event_type: eventType
    });
    
    this.setGauge('hashgraph_anchor_queue_size', queueSize);
    
    if (confirmationTime !== null) {
      this.recordHistogram('hashgraph_anchor_confirmation_time_ms', confirmationTime);
    }
  }

  /**
   * Update connected peers count
   */
  updateConnectedPeers(transportType, count) {
    this.setGauge('hashgraph_connected_peers', count, {
      transport_type: transportType
    });
  }

  /**
   * Get health status based on metrics
   */
  getHealthStatus() {
    const health = {
      status: 'healthy',
      checks: {},
      timestamp: Date.now()
    };

    // Check DAG growth rate
    const dagSizeMetric = this.getMetric('hashgraph_dag_size_total');
    const currentDAGSize = dagSizeMetric ? dagSizeMetric.getCurrentValue() : 0;
    health.checks.dag_size = {
      status: currentDAGSize > 0 ? 'healthy' : 'warning',
      value: currentDAGSize
    };

    // Check connected peers
    const peersMetric = this.getMetric('hashgraph_connected_peers');
    const connectedPeers = peersMetric ? peersMetric.getCurrentValue() : 0;
    health.checks.connectivity = {
      status: connectedPeers > 0 ? 'healthy' : 'critical',
      value: connectedPeers
    };

    // Check active forks
    const activeForksMetric = this.getMetric('hashgraph_active_forks');
    const activeForks = activeForksMetric ? activeForksMetric.getCurrentValue() : 0;
    health.checks.forks = {
      status: activeForks < 5 ? 'healthy' : 'warning',
      value: activeForks
    };

    // Overall status
    const criticalChecks = Object.values(health.checks).filter(c => c.status === 'critical');
    const warningChecks = Object.values(health.checks).filter(c => c.status === 'warning');
    
    if (criticalChecks.length > 0) {
      health.status = 'critical';
    } else if (warningChecks.length > 0) {
      health.status = 'warning';
    }

    return health;
  }
}
