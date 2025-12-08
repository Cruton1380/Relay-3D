/**
 * Mock Transport Layer Extensions for Integration Testing
 * 
 * This file extends the existing transport layer with additional methods
 * needed for comprehensive integration testing.
 */

export class MockTransportEnhancements {
    constructor(baseTransport) {
        this.baseTransport = baseTransport;
        this.failedTransports = new Set();
        this.supportedTransports = new Set(['websocket', 'webrtc', 'bluetooth']);
    }

    async supportsTransport(transportType) {
        return this.supportedTransports.has(transportType) && 
               !this.failedTransports.has(transportType);
    }

    async simulateFailure(transportType) {
        this.failedTransports.add(transportType);
        console.log(`🔴 Simulated failure for transport: ${transportType}`);
    }

    async gossipEvent(event, transportType) {
        if (this.failedTransports.has(transportType)) {
            throw new Error(`Transport ${transportType} is currently failed`);
        }

        // Simulate successful gossip delivery
        console.log(`📡 Gossiping event ${event.id} via ${transportType}`);
        
        // Add realistic latency
        const latency = this.calculateLatency(transportType);
        await new Promise(resolve => setTimeout(resolve, latency));

        return {
            success: true,
            transportUsed: transportType,
            latency: latency
        };
    }

    calculateLatency(transportType) {
        const baseLatencies = {
            'websocket': 20 + Math.random() * 30,     // 20-50ms
            'webrtc': 30 + Math.random() * 40,        // 30-70ms  
            'bluetooth': 100 + Math.random() * 200    // 100-300ms
        };
        return baseLatencies[transportType] || 50;
    }

    async initialize() {
        console.log('🚀 Mock transport enhancements initialized');
        return true;
    }
}

export class MockForkDetectionEnhancements {
    constructor() {
        this.forkHistory = [];
        this.config = {
            maxTimestampDrift: 5000,
            auditRetention: 24 * 60 * 60 * 1000
        };
    }

    async initialize() {
        console.log('🚀 Mock fork detection initialized');
        return true;
    }

    async validateEvent(event) {
        // Check for potential forks by looking for conflicting events
        const conflictingEvent = this.findConflictingEvent(event);
        
        if (conflictingEvent) {
            const fork = {
                id: `fork-${Date.now()}`,
                timestamp: Date.now(),
                events: [conflictingEvent, event],
                resolutionStrategy: 'timestamp-based',
                resolved: false
            };
            
            this.forkHistory.push(fork);
            console.log(`⚠️ Fork detected: ${fork.id}`);
            return { hasFork: true, forkId: fork.id };
        }

        return { hasFork: false };
    }

    findConflictingEvent(newEvent) {
        // Simple conflict detection: same creator + same timestamp = potential fork
        return this.forkHistory.find(fork => 
            fork.events.some(e => 
                e.creator === newEvent.creator && 
                Math.abs(e.timestamp - newEvent.timestamp) < 1000
            )
        )?.events[0];
    }

    async getForkHistory() {
        return this.forkHistory;
    }

    async resolveConflict(strategy, events) {
        if (strategy === 'timestamp-based') {
            const winner = events.reduce((earliest, current) => 
                current.timestamp < earliest.timestamp ? current : earliest
            );
            
            console.log(`🎯 Conflict resolved via timestamp: winner is ${winner.id}`);
            return { winner, strategy };
        }
        
        return null;
    }
}

export class MockHashgraphControllerEnhancements {
    constructor(config) {
        this.config = config;
        this.events = [];
        this.auditHistory = [];
    }

    async initialize() {
        console.log('🚀 Mock hashgraph controller initialized');
        return true;
    }

    async submitEvent(event) {
        this.events.push(event);
        console.log(`📝 Event submitted: ${event.id}`);
        return { success: true, eventId: event.id };
    }

    async handleModeratorIntervention(decision) {
        const auditRecord = {
            id: `audit-${Date.now()}`,
            type: 'moderator_intervention',
            moderatorId: decision.moderatorId,
            timestamp: decision.timestamp,
            decision: decision.decision,
            reasoning: decision.reasoning,
            evidence: decision.evidence || []
        };

        this.auditHistory.push(auditRecord);
        console.log(`⚖️ Moderator intervention recorded: ${auditRecord.id}`);

        return { 
            success: true, 
            auditRecord,
            interventionId: auditRecord.id
        };
    }

    async getAuditHistory() {
        return this.auditHistory;
    }
}

export class MockPartitionHandlerEnhancements {
    constructor(config) {
        this.config = config;
        this.partitionHistory = [];
    }

    async initialize() {
        console.log('🚀 Mock partition handler initialized');
        return true;
    }

    async reconcilePartitions(partitions) {
        console.log(`🔄 Reconciling ${partitions.length} partitions...`);
        
        // Simulate DAG reconciliation
        let totalEvents = 0;
        let conflictsResolved = 0;

        for (const partition of partitions) {
            totalEvents += partition.events.length;
            
            // Simple conflict resolution simulation
            const conflicts = partition.events.filter(e => 
                e.data && e.data.partition && e.data.sequence % 3 === 0
            );
            conflictsResolved += conflicts.length;
        }

        const reconciliationResult = {
            success: true,
            mergedEvents: totalEvents,
            conflictsResolved,
            timestamp: Date.now()
        };

        // Record in partition history
        this.partitionHistory.push({
            startTime: Date.now() - 10000,
            endTime: Date.now(),
            partitionCount: partitions.length,
            reconciled: true,
            result: reconciliationResult
        });

        console.log(`✅ Reconciliation complete: ${totalEvents} events, ${conflictsResolved} conflicts resolved`);
        return reconciliationResult;
    }

    async getPartitionHistory() {
        return this.partitionHistory;
    }
}

export class MockAnchoringSystemEnhancements {
    constructor(config) {
        this.config = config;
        this.pendingEvents = [];
        this.anchoredEvents = new Map();
    }

    async initialize() {
        console.log('🚀 Mock anchoring system initialized');
        return true;
    }

    async submitForAnchoring(event) {
        this.pendingEvents.push(event);
        console.log(`⚓ Event queued for anchoring: ${event.id}`);
        
        // Simulate batch processing after a delay
        setTimeout(() => this.processBatch(), 1000);
        
        return { success: true, queuePosition: this.pendingEvents.length };
    }

    async processBatch() {
        if (this.pendingEvents.length === 0) return;

        const batch = this.pendingEvents.splice(0, this.config.batchSize || 10);
        
        for (const event of batch) {
            const anchorResult = {
                eventId: event.id,
                anchored: true,
                blockchainTxHash: `0x${Math.random().toString(16).substring(2)}`,
                eventHash: `hash-${event.id}`,
                blockNumber: Math.floor(Math.random() * 1000000),
                timestamp: Date.now()
            };
            
            this.anchoredEvents.set(event.id, anchorResult);
            console.log(`⚓ Event anchored: ${event.id} -> ${anchorResult.blockchainTxHash}`);
        }
    }

    async getAnchoringStatus(eventIds) {
        return eventIds.map(id => this.anchoredEvents.get(id) || { 
            eventId: id, 
            anchored: false 
        });
    }
}

export class MockMetricsSystemEnhancements {
    constructor(config) {
        this.config = config;
        this.metrics = {
            gossip_delivery_latency: [],
            fork_detection_rate: 0,
            sybil_alert_count: 0,
            transport_layer_uptime: {},
            partition_duration: [],
            anchoring_success_rate: 0,
            dag_event_count: 0,
            node_health_score: 0
        };
    }

    async initialize() {
        console.log('🚀 Mock metrics system initialized');
        return true;
    }

    async recordGossipDelivery(latency) {
        this.metrics.gossip_delivery_latency.push({
            value: latency,
            timestamp: Date.now()
        });
    }

    async recordForkDetection(type) {
        this.metrics.fork_detection_rate++;
        console.log(`📊 Fork detection recorded: ${type}`);
    }

    async recordSybilAlert(nodeId) {
        this.metrics.sybil_alert_count++;
        console.log(`📊 Sybil alert recorded for: ${nodeId}`);
    }

    async recordTransportUptime(transport, uptime) {
        this.metrics.transport_layer_uptime[transport] = uptime;
        console.log(`📊 Transport uptime recorded: ${transport} -> ${uptime}`);
    }

    async recordPartitionEvent(duration) {
        this.metrics.partition_duration.push(duration);
        console.log(`📊 Partition duration recorded: ${duration}ms`);
    }

    async recordAnchoringAttempt(success) {
        // Simple success rate calculation
        const attempts = this.metrics.anchoring_attempts || 0;
        const successes = this.metrics.anchoring_successes || 0;
        
        this.metrics.anchoring_attempts = attempts + 1;
        if (success) {
            this.metrics.anchoring_successes = successes + 1;
        }
        
        this.metrics.anchoring_success_rate = 
            this.metrics.anchoring_successes / this.metrics.anchoring_attempts;
    }

    async recordDAGEvent() {
        this.metrics.dag_event_count++;
    }

    async recordNodeHealth(score) {
        this.metrics.node_health_score = score;
    }

    async getAllMetrics() {
        return { ...this.metrics };
    }

    async getPrometheusMetrics() {
        const lines = [];
        
        // Convert internal metrics to Prometheus format
        for (const [key, value] of Object.entries(this.metrics)) {
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    const avg = value.reduce((sum, item) => sum + (item.value || item), 0) / value.length;
                    lines.push(`hashgraph_${key} ${avg}`);
                }
            } else if (typeof value === 'object') {
                for (const [subkey, subvalue] of Object.entries(value)) {
                    lines.push(`hashgraph_${key}{transport="${subkey}"} ${subvalue}`);
                }
            } else {
                lines.push(`hashgraph_${key} ${value}`);
            }
        }
        
        return lines.join('\n');
    }
}
