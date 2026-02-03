// relay-3d/data/sampleRenderSpec.js
// Sample renderSpec.v1 data for testing the visualization

export const sampleRenderSpec = {
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
        authority: 'system',
        resource: 'settlement-67890'
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
        service: 'payment-gateway',
        authority: 'finance-lead'
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
        service: 'audit-log',
        authority: 'system'
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
      deltaPR: 14,
      status: 'DIVERGING'
    },
    {
      id: 'e_asserted',
      type: 'ASSERTED_BY',
      from: 'n_invoice_paid',
      to: 'n_payment_service',
      pressure: 12,
      deltaPR: 0,
      status: 'STABLE'
    },
    {
      id: 'e_evidenced',
      type: 'EVIDENCED_BY',
      from: 'n_bank_settlement',
      to: 'n_settlement_evidence',
      pressure: 6,
      deltaPR: 0,
      status: 'STABLE'
    }
  ],

  overlays: [
    {
      type: 'metrics_panel',
      position: 'top-left'
    },
    {
      type: 'action_buttons',
      position: 'bottom-center'
    },
    {
      type: 'minimap',
      position: 'bottom-right'
    }
  ],

  renderRules: {
    confidenceOpacityMap: (confidence) => 0.2 + (confidence / 100) * 0.8,
    pressureThicknessMap: (pressure) => 0.002 + (pressure / 100) * 0.018,
    deltaPRHeatMap: (deltaPR) => {
      if (deltaPR === 0) return 0xFFFFFF;
      if (deltaPR < 20) return 0xFF9800;
      if (deltaPR < 50) return 0xFF5722;
      return 0xF44336;
    }
  }
};
