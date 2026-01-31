/**
 * PROCUREMENT LIFECYCLE COMMIT SCHEMAS
 * 
 * Core Principle: Shared commit envelope, domain-specific payloads
 * 
 * All commits use RelayCommit<TPayload> structure.
 */

/**
 * Shared Commit Envelope (Universal)
 * 
 * @template TPayload - Domain-specific payload type
 */
export function createCommit(filamentId, commitIndex, actor, op, payload, refs = {}) {
  return {
    filamentId,
    commitIndex,
    ts: Date.now(),
    actor,
    op,
    locus: refs.locus || undefined,
    refs: {
      inputs: refs.inputs || [],
      evidence: refs.evidence || [],
    },
    payload,
  };
}

/**
 * Generate unique commit ID (for internal tracking)
 */
export function generateCommitId() {
  return `commit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// PO FILAMENT SCHEMAS
// ============================================================================

/**
 * PO_CREATED - Initial PO creation commit
 */
export const createPOCreatedCommit = (filamentId, commitIndex, userId, payload) => {
  return createCommit(
    filamentId,
    commitIndex,
    { kind: 'user', id: userId },
    'PO_CREATED',
    {
      poId: payload.poId,
      vendorId: payload.vendorId,
      currency: 'USD',
      lines: payload.lines.map(line => ({
        lineId: line.lineId,
        sku: line.sku,
        desc: line.desc,
        qtyOrdered: line.qtyOrdered,
        unitPrice: line.unitPrice,
      })),
    }
  );
};

/**
 * PO_APPROVED - Approval gate commit
 */
export const createPOApprovedCommit = (filamentId, commitIndex, userId, payload) => {
  return createCommit(
    filamentId,
    commitIndex,
    { kind: 'user', id: userId },
    'PO_APPROVED',
    {
      approvedByRole: 'ProcurementManager',
      approvalNote: payload.note || undefined,
    }
  );
};

/**
 * PO_SENT - Optional send commit
 */
export const createPOSentCommit = (filamentId, commitIndex, userId, payload) => {
  return createCommit(
    filamentId,
    commitIndex,
    { kind: 'user', id: userId },
    'PO_SENT',
    {
      sentVia: payload.sentVia || 'email',
      externalRef: payload.externalRef || undefined,
    }
  );
};

// ============================================================================
// RECEIPT FILAMENT SCHEMAS
// ============================================================================

/**
 * RECEIPT_RECORDED - Goods receipt commit
 */
export const createReceiptRecordedCommit = (filamentId, commitIndex, userId, poFilamentId, poCommitIndex, payload) => {
  return createCommit(
    filamentId,
    commitIndex,
    { kind: 'user', id: userId },
    'RECEIPT_RECORDED',
    {
      receiptId: payload.receiptId,
      poId: payload.poId,
      receivedLines: payload.receivedLines.map(line => ({
        lineId: line.lineId,
        qtyReceived: line.qtyReceived,
        condition: line.condition || 'OK',
      })),
      receivedAt: payload.receivedAt || new Date().toISOString(),
    },
    {
      inputs: [{ filamentId: poFilamentId, commitIndex: poCommitIndex }],
    }
  );
};

// ============================================================================
// INVOICE FILAMENT SCHEMAS
// ============================================================================

/**
 * INVOICE_CAPTURED - Invoice ingestion commit
 */
export const createInvoiceCapturedCommit = (filamentId, commitIndex, userId, poFilamentId, poCommitIndex, payload) => {
  return createCommit(
    filamentId,
    commitIndex,
    { kind: 'system', id: 'invoice-parser' },
    'INVOICE_CAPTURED',
    {
      invoiceId: payload.invoiceId,
      vendorId: payload.vendorId,
      poId: payload.poId,
      currency: 'USD',
      invoiceLines: payload.invoiceLines.map(line => ({
        lineId: line.lineId,
        qtyInvoiced: line.qtyInvoiced,
        unitPrice: line.unitPrice,
      })),
      invoiceTotal: payload.invoiceTotal || undefined,
      source: payload.source || { kind: 'manual' },
    },
    {
      inputs: [{ filamentId: poFilamentId, commitIndex: poCommitIndex }],
    }
  );
};

// ============================================================================
// MATCH FILAMENT SCHEMAS (Auto-Generated)
// ============================================================================

/**
 * MATCH_EVALUATED - Auto-generated 3-way match commit
 * 
 * Actor: system (deterministic, no human input)
 */
export const createMatchEvaluatedCommit = (filamentId, commitIndex, poSnapshot, receiptSnapshot, invoiceSnapshot) => {
  // Calculate variances
  const variances = [];
  
  // DEBUG: Check what's actually in the payload
  console.log('[MatchEval] RAW poSnapshot:', poSnapshot);
  console.log('[MatchEval] RAW poSnapshot.commit:', poSnapshot?.commit);
  console.log('[MatchEval] RAW poSnapshot.commit.payload:', poSnapshot?.commit?.payload);
  console.log('[MatchEval] RAW poSnapshot.commit.payload.lines:', poSnapshot?.commit?.payload?.lines);
  
  const poLines = poSnapshot?.commit?.payload?.lines || [];
  const receiptLines = receiptSnapshot?.commit?.payload?.receivedLines || [];
  const invoiceLines = invoiceSnapshot?.commit?.payload?.invoiceLines || [];
  
  console.log('[MatchEval] Input data:', {
    poLines: poLines.map(l => ({ id: l.lineId, ordered: l.qtyOrdered })),
    receiptLines: receiptLines.map(l => ({ id: l.lineId, received: l.qtyReceived })),
    invoiceLines: invoiceLines.map(l => ({ id: l.lineId, invoiced: l.qtyInvoiced })),
  });
  
  poLines.forEach(poLine => {
    const receiptLine = receiptLines.find(r => r.lineId === poLine.lineId);
    const invoiceLine = invoiceLines.find(i => i.lineId === poLine.lineId);
    
    const qtyOrdered = poLine.qtyOrdered;
    const qtyReceived = receiptLine?.qtyReceived || 0;
    const qtyInvoiced = invoiceLine?.qtyInvoiced || 0;
    
    // Variance: invoiced > received
    const delta = qtyInvoiced - qtyReceived;
    
    console.log(`[MatchEval] Line ${poLine.lineId}: ordered=${qtyOrdered}, received=${qtyReceived}, invoiced=${qtyInvoiced}, delta=${delta}`);
    
    if (delta !== 0) {
      variances.push({
        kind: 'QTY_MISMATCH',
        lineId: poLine.lineId,
        ordered: qtyOrdered,
        received: qtyReceived,
        invoiced: qtyInvoiced,
        delta,
        severity: Math.abs(delta) > 0 ? 'BLOCK' : 'WARN',
      });
    }
  });
  
  const state = variances.some(v => v.severity === 'BLOCK') ? 'EXCEPTION' : 'PASS';
  
  const poId = poSnapshot?.commit?.payload?.poId || 'UNKNOWN';
  
  return createCommit(
    filamentId,
    commitIndex,
    { kind: 'system', id: 'match-engine' },
    'MATCH_EVALUATED',
    {
      poId,
      matchId: `MATCH-${poId}`,
      state,
      basis: {
        poSnapshot: poSnapshot ? { commitRef: { filamentId: poSnapshot.filamentId, commitIndex: poSnapshot.commitIndex } } : undefined,
        receiptSnapshot: receiptSnapshot ? { commitRef: { filamentId: receiptSnapshot.filamentId, commitIndex: receiptSnapshot.commitIndex } } : undefined,
        invoiceSnapshot: invoiceSnapshot ? { commitRef: { filamentId: invoiceSnapshot.filamentId, commitIndex: invoiceSnapshot.commitIndex } } : undefined,
      },
      variances,
    },
    {
      inputs: [
        poSnapshot && { filamentId: poSnapshot.filamentId, commitIndex: poSnapshot.commitIndex },
        receiptSnapshot && { filamentId: receiptSnapshot.filamentId, commitIndex: receiptSnapshot.commitIndex },
        invoiceSnapshot && { filamentId: invoiceSnapshot.filamentId, commitIndex: invoiceSnapshot.commitIndex },
      ].filter(Boolean),
    }
  );
};

/**
 * MATCH_OVERRIDE_APPROVED - Human override of match exception
 */
export const createMatchOverrideCommit = (filamentId, commitIndex, userId, payload) => {
  return createCommit(
    filamentId,
    commitIndex,
    { kind: 'user', id: userId },
    'MATCH_OVERRIDE_APPROVED',
    {
      poId: payload.poId,
      reasonCode: payload.reasonCode || 'ACCEPT_PARTIAL_RECEIPT',
      note: payload.note || undefined,
      approvedByRole: payload.approvedByRole || 'APManager',
      outcome: 'OVERRIDE_PASS',
    }
  );
};

// ============================================================================
// LEDGER FILAMENT SCHEMAS (Locked Pairs)
// ============================================================================

/**
 * LEDGER_POSTED - One leg of a double-entry posting
 * 
 * For proof: Create TWO filaments with same postingEventId
 */
export const createLedgerPostedCommit = (filamentId, commitIndex, matchFilamentId, matchCommitIndex, payload) => {
  return createCommit(
    filamentId,
    commitIndex,
    { kind: 'system', id: 'ledger-engine' },
    'LEDGER_POSTED',
    {
      postingEventId: payload.postingEventId,
      poId: payload.poId,
      amount: payload.amount,
      currency: 'USD',
      leg: {
        account: payload.account,  // "AP" | "EXPENSE"
        direction: payload.direction,  // "DEBIT" | "CREDIT"
      },
      derivedFrom: {
        matchCommit: { filamentId: matchFilamentId, commitIndex: matchCommitIndex },
      },
    },
    {
      inputs: [{ filamentId: matchFilamentId, commitIndex: matchCommitIndex }],
      evidence: [{ kind: 'match-approval', ref: `${matchFilamentId}#${matchCommitIndex}` }],
    }
  );
};

// ============================================================================
// HELPER: Get Latest Commit from Filament
// ============================================================================

/**
 * Get the latest commit from a filament
 */
export function getLatestCommit(filament) {
  if (!filament || !filament.commits || filament.commits.length === 0) {
    return null;
  }
  return {
    filamentId: filament.id,
    commitIndex: filament.commits.length - 1,
    commit: filament.commits[filament.commits.length - 1],
  };
}

/**
 * Get commit at specific index
 */
export function getCommitAt(filament, commitIndex) {
  if (!filament || !filament.commits || commitIndex >= filament.commits.length) {
    return null;
  }
  return {
    filamentId: filament.id,
    commitIndex,
    commit: filament.commits[commitIndex],
  };
}

/**
 * Get PO data commit (PO_CREATED specifically)
 * 
 * For match evaluation, we need the PO_CREATED commit which has the lines,
 * not the latest commit which might be PO_APPROVED or PO_SENT
 */
export function getPODataCommit(poFilament) {
  if (!poFilament || !poFilament.commits || poFilament.commits.length === 0) {
    return null;
  }
  
  // Find the PO_CREATED commit (should be first, but search to be safe)
  const poCreatedIndex = poFilament.commits.findIndex(c => c.op === 'PO_CREATED');
  
  if (poCreatedIndex === -1) {
    return null;
  }
  
  return {
    filamentId: poFilament.id,
    commitIndex: poCreatedIndex,
    commit: poFilament.commits[poCreatedIndex],
  };
}
