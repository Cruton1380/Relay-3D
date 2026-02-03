// services/filamentDataService.js
// Integration service to fetch real-time filament data from votingEngine
// Canon: Governance constraints applied at data transformation layer

import { 
  PressureBudget, 
  createRefusalObject,
  validateSnapshotUsage 
} from '../components/relay-3d/utils/governanceLocks';

/**
 * FilamentDataService - Connects 3D visualization to backend voting metrics
 * Transforms votingEngine.mjs data into renderSpec.v1 format
 * GOVERNANCE: Applies pressure budgets and refusal ergonomics
 */
class FilamentDataService {
  constructor() {
    this.wsConnection = null;
    this.listeners = new Set();
    this.currentData = null;
    
    // GOVERNANCE: Pressure budget for this scope
    this.pressureBudget = new PressureBudget('filament-visualization', {
      maxChecksPerWindow: 100,
      maxRepairsInflight: 10,
      cooldownAfterRefusal: 5000
    });
  }
  constructor() {
    this.wsConnection = null;
    this.listeners = new Set();
    this.currentData = null;
  }

  /**
   * Fetch filament data via HTTP
   * GOVERNANCE: Check pressure budget before fetch
   */
  async fetchFilamentData(branchId = 'branch.finance.ap', timeboxRef = 'timebox_2026w06') {
    // Check pressure budget
    const canAttest = this.pressureBudget.canAttest();
    if (!canAttest.allowed) {
      const refusal = createRefusalObject(canAttest.reason, {
        resetsAt: canAttest.resetsAt,
        cooldownEndsAt: canAttest.cooldownEndsAt
      });
      console.warn('Pressure budget exceeded:', refusal);
      this.pressureBudget.recordRefusal();
      return refusal; // Return refusal object instead of throwing
    }
    
    try {
      this.pressureBudget.recordAttest();
      
      const response = await fetch(`/api/filaments/${branchId}?timebox=${timeboxRef}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate no snapshot authority
      if (data.source === 'snapshot' && !data.replayProof) {
        console.error('GOVERNANCE_VIOLATION: Snapshot without replay proof');
        return this.getMockData(); // Fallback
      }
      
      this.currentData = this.transformToRenderSpec(data);
      this.notifyListeners(this.currentData);
      
      return this.currentData;
    } catch (error) {
      console.error('Error fetching filament data:', error);
      return this.getMockData(); // Fallback to mock data
    }
  }

  /**
   * Subscribe to real-time updates via WebSocket
   */
  subscribeToUpdates(branchId, callback) {
    this.listeners.add(callback);

    // Initialize WebSocket if not connected
    if (!this.wsConnection) {
      this.initializeWebSocket(branchId);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Initialize WebSocket connection
   */
  initializeWebSocket(branchId) {
    const wsUrl = `ws://localhost:5175/api/filaments/stream?branch=${branchId}`;
    
    try {
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        console.log('✅ Filament WebSocket connected');
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const renderSpec = this.transformToRenderSpec(data);
          this.currentData = renderSpec;
          this.notifyListeners(renderSpec);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.wsConnection.onclose = () => {
        console.log('WebSocket closed, attempting reconnect...');
        setTimeout(() => this.initializeWebSocket(branchId), 5000);
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  }

  /**
   * Notify all listeners of data update
   */
  notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in listener callback:', error);
      }
    });
  }

  /**
   * Transform votingEngine data to renderSpec.v1 format
   */
  transformToRenderSpec(votingData) {
    const {
      filaments = [],
      edges = [],
      branch = {},
      timebox = {}
    } = votingData;

    // Map filaments to nodes
    const nodes = filaments.map(fil => ({
      id: fil.filamentId || fil.id,
      position: this.calculatePosition(fil),
      kind: this.determineNodeKind(fil),
      label: fil.label || fil.filamentId,
      confidence: fil.confidence || fil.eri * 100 || 80,
      pressure: fil.pressure || 10,
      deltaPR: fil.deltaPR || 0,
      status: this.determineStatus(fil),
      metadata: {
        service: fil.service,
        authority: fil.authority,
        resource: fil.resource,
        timestamp: fil.timestamp
      }
    }));

    // Map relationships to edges
    const edgesList = edges.map(edge => ({
      id: edge.id,
      type: edge.type || 'DEPENDS_ON',
      from: edge.from,
      to: edge.to,
      pressure: edge.pressure || 10,
      deltaPR: edge.deltaPR || 0,
      status: edge.deltaPR > 0 ? 'DIVERGING' : 'STABLE'
    }));

    return {
      schemaVersion: 'renderSpec.v1',
      scene: {
        units: 'meters',
        originMeaning: 'branchCore',
        axes: {
          x: 'present_surface',
          y: 'history_depth',
          z: 'speculation_outward'
        }
      },
      branch: {
        branchId: branch.id || 'branch.unknown',
        branchPath: branch.path || '',
        timeboxRef: timebox.ref || 'timebox_current'
      },
      nodes,
      edges: edgesList,
      overlays: [
        { type: 'metrics_panel', position: 'top-left' },
        { type: 'action_buttons', position: 'bottom-center' },
        { type: 'minimap', position: 'bottom-right' }
      ]
    };
  }

  /**
   * Calculate 3D position from filament metadata
   */
  calculatePosition(filament) {
    // Use history depth, present surface, speculation metrics
    const x = (filament.presentSurface || Math.random() - 0.5) * 1.2;
    const y = -(filament.historyDepth || Math.random() * 0.5);
    const z = (filament.speculationOutward || Math.random() - 0.5) * 0.4;
    
    return [x, y, z];
  }

  /**
   * Determine node kind from filament type
   */
  determineNodeKind(filament) {
    if (filament.type === 'reality_anchor') return 'REALITY_ANCHOR';
    if (filament.type === 'capability') return 'CAPABILITY';
    if (filament.type === 'evidence') return 'EVIDENCE';
    return 'STATE';
  }

  /**
   * Determine status from metrics
   */
  determineStatus(filament) {
    if (filament.deltaPR > 10) return 'DIVERGING';
    if (filament.pressure > 50) return 'RECONCILING';
    return 'STABLE';
  }

  /**
   * Get mock data for testing
   */
  getMockData() {
    return {
      schemaVersion: 'renderSpec.v1',
      scene: {
        units: 'meters',
        originMeaning: 'branchCore',
        axes: {
          x: 'present_surface',
          y: 'history_depth',
          z: 'speculation_outward'
        }
      },
      branch: {
        branchId: 'branch.finance.ap',
        branchPath: 'zone.acme.finance.ap',
        timeboxRef: 'timebox_2026w06'
      },
      nodes: [
        {
          id: 'n_invoice_paid',
          position: [0.6, -0.2, 0.1],
          kind: 'STATE',
          label: 'InvoicePaid',
          confidence: 72,
          pressure: 18,
          deltaPR: 14,
          status: 'RECONCILING',
          metadata: {
            service: 'payment-processor',
            authority: 'finance-lead',
            resource: 'invoice-12345'
          }
        },
        {
          id: 'n_bank_settlement',
          position: [0.3, -0.3, 0.0],
          kind: 'REALITY_ANCHOR',
          label: 'BankSettlement',
          confidence: 90,
          pressure: 8,
          deltaPR: 0,
          status: 'STABLE',
          metadata: {
            service: 'bank-api',
            authority: 'system'
          }
        },
        {
          id: 'n_payment_service',
          position: [0.15, -0.1, 0.2],
          kind: 'CAPABILITY',
          label: 'PaymentService',
          confidence: 80,
          pressure: 12,
          deltaPR: 0,
          status: 'STABLE',
          metadata: {
            service: 'payment-gateway'
          }
        },
        {
          id: 'n_settlement_evidence',
          position: [0.05, -0.35, -0.1],
          kind: 'EVIDENCE',
          label: 'SettlementEvidence',
          confidence: 85,
          pressure: 6,
          deltaPR: 0,
          status: 'STABLE',
          metadata: {
            service: 'audit-log'
          }
        }
      ],
      edges: [
        {
          id: 'e_depends',
          type: 'DEPENDS_ON',
          from: 'n_invoice_paid',
          to: 'n_bank_settlement',
          pressure: 18,
          deltaPR: 14
        },
        {
          id: 'e_asserted',
          type: 'ASSERTED_BY',
          from: 'n_invoice_paid',
          to: 'n_payment_service',
          pressure: 12,
          deltaPR: 0
        },
        {
          id: 'e_evidenced',
          type: 'EVIDENCED_BY',
          from: 'n_bank_settlement',
          to: 'n_settlement_evidence',
          pressure: 6,
          deltaPR: 0
        }
      ]
    };
  }

  /**
   * Close connections
   */
  disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const filamentDataService = new FilamentDataService();
export default filamentDataService;
