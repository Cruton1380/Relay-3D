/**
 * ROUTE ENGINE — Config-driven data flow layer for Relay
 *
 * Routes are pure mappings: external record → normalized fact row.
 * Routes may ONLY append rows to fact sheets.
 * Everything else (matches, summaries, KPIs, tree motion) is already wired
 * via recomputeModuleChain.
 *
 * Invariant: "Routes may only append rows to fact sheets."
 */

import { RelayLog } from '../../core/utils/relay-log.js';

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE REGISTRY — maps routeId → route definition, factClass → sheetId
// ═══════════════════════════════════════════════════════════════════════════

const routeRegistry = new Map();      // routeId → routeDef
const factClassRegistry = new Map();  // factClass → { sheetId, routeId, scope }
const sheetRouteMap = new Map();      // sheetId → routeId

/**
 * Load route definitions from a route group JSON.
 * Populates the route registry and factClass registry.
 *
 * @param {Object} routeGroupDef — parsed JSON from config/routes/*.json
 */
export function loadRoutes(routeGroupDef) {
    if (!routeGroupDef?.routes || !Array.isArray(routeGroupDef.routes)) {
        RelayLog.error('[ROUTE] Invalid route group — missing routes array');
        return;
    }

    let loaded = 0;
    for (const route of routeGroupDef.routes) {
        if (!route.routeId || !route.targetSheet || !route.factClass) {
            RelayLog.warn(`[ROUTE] Skipping invalid route: missing routeId/targetSheet/factClass`);
            continue;
        }

        routeRegistry.set(route.routeId, route);
        factClassRegistry.set(route.factClass, {
            sheetId: route.targetSheet,
            routeId: route.routeId,
            scope: route.scope
        });
        sheetRouteMap.set(route.targetSheet, route.routeId);
        loaded++;
    }

    RelayLog.info(`[ROUTE] loaded ${loaded} routes from group "${routeGroupDef.routeGroupId}" (module: ${routeGroupDef.moduleId})`);
    for (const route of routeGroupDef.routes) {
        RelayLog.info(`[ROUTE]   ${route.routeId} → ${route.targetSheet} (keys: ${(route.keys || []).join(', ')})`);
    }
}

/**
 * Get a route definition by routeId.
 * @param {string} routeId
 * @returns {Object|null}
 */
export function getRoute(routeId) {
    return routeRegistry.get(routeId) || null;
}

/**
 * Get the sheetId for a given factClass.
 * @param {string} factClass
 * @returns {string|null}
 */
export function getSheetForFactClass(factClass) {
    return factClassRegistry.get(factClass)?.sheetId || null;
}

/**
 * Get all registered route IDs.
 * @returns {string[]}
 */
export function getRouteIds() {
    return [...routeRegistry.keys()];
}

/**
 * Get the full route registry Map.
 * @returns {Map<string, Object>}
 */
export function getAllRoutes() {
    return routeRegistry;
}

/**
 * Get the full factClass registry Map.
 * @returns {Map<string, Object>}
 */
export function getFactClassRegistry() {
    return factClassRegistry;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE EXECUTION — normalize + append (the ONLY operation a route performs)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize an incoming external record into a fact row using a route definition.
 *
 * @param {string} routeId — which route to use
 * @param {Object} externalRecord — the raw external data record
 * @returns {{ row: Array, sheetId: string, provenance: Object, keys: Object } | null}
 */
export function normalizeRecord(routeId, externalRecord) {
    const route = routeRegistry.get(routeId);
    if (!route) {
        RelayLog.error(`[ROUTE] Unknown routeId: ${routeId}`);
        return null;
    }

    const fields = route.fields;
    const row = [];
    const keys = {};
    const errors = [];

    // Map each column in order (must match the sheet's column schema order)
    for (const [colId, fieldDef] of Object.entries(fields)) {
        const sourceKey = fieldDef.source;
        let value = externalRecord[sourceKey];

        // Type coercion
        if (value !== undefined && value !== null) {
            if (fieldDef.type === 'number') {
                const n = Number(value);
                value = Number.isFinite(n) ? n : value;
            } else {
                value = String(value);
            }
        } else {
            value = '';
        }

        // Required check
        if (fieldDef.required && (value === '' || value === null || value === undefined)) {
            errors.push(`${colId} is required (source: ${sourceKey})`);
        }

        row.push(value);

        // Track join keys
        if (route.keys?.includes(colId)) {
            keys[colId] = value;
        }
    }

    if (errors.length > 0) {
        RelayLog.warn(`[ROUTE] normalizeRecord ${routeId}: validation warnings: ${errors.join('; ')}`);
    }

    // Extract provenance
    const prov = route.provenance || {};
    const provenance = {
        sourceSystem: externalRecord[prov.systemField] || 'unknown',
        sourceId: externalRecord[prov.sourceIdField] || `auto-${Date.now()}`,
        ingestedAt: new Date().toISOString(),
        eventTimestamp: externalRecord[prov.timestampField] || new Date().toISOString(),
        routeId: routeId
    };

    return {
        row,
        sheetId: route.targetSheet,
        scope: route.scope,
        factClass: route.factClass,
        keys,
        provenance,
        errors: errors.length > 0 ? errors : null
    };
}

/**
 * Preview (dry-run) a route mapping without ingesting.
 * Shows: target sheet, mapped fields, dropped fields, provenance, validation.
 * Does NOT append any data.
 *
 * @param {string} routeId
 * @param {Object} externalRecord
 * @returns {Object} — preview result with mapped/dropped/provenance/errors
 */
export function previewRoute(routeId, externalRecord) {
    const route = routeRegistry.get(routeId);
    if (!route) {
        return { error: `Unknown routeId: ${routeId}`, routeId };
    }

    const fields = route.fields;
    const mapped = [];
    const dropped = [];
    const usedSourceFields = new Set();

    // Map each column
    for (const [colId, fieldDef] of Object.entries(fields)) {
        const sourceKey = fieldDef.source;
        const hasValue = externalRecord[sourceKey] !== undefined && externalRecord[sourceKey] !== null;
        let value = hasValue ? externalRecord[sourceKey] : '';

        if (hasValue && fieldDef.type === 'number') {
            const n = Number(value);
            value = Number.isFinite(n) ? n : value;
        } else if (hasValue) {
            value = String(value);
        }

        mapped.push({
            column: colId,
            sourceField: sourceKey,
            value: hasValue ? value : '(empty)',
            type: fieldDef.type,
            required: fieldDef.required,
            missing: fieldDef.required && !hasValue
        });
        usedSourceFields.add(sourceKey);
    }

    // Find dropped fields (in the record but not mapped by the route)
    for (const key of Object.keys(externalRecord)) {
        if (!usedSourceFields.has(key)) {
            const prov = route.provenance || {};
            const isProvField = key === prov.systemField || key === prov.sourceIdField || key === prov.timestampField;
            dropped.push({ field: key, value: externalRecord[key], isProvenance: isProvField });
        }
    }

    // Extract provenance
    const prov = route.provenance || {};
    const provenance = {
        sourceSystem: externalRecord[prov.systemField] || '(not provided)',
        sourceId: externalRecord[prov.sourceIdField] || '(not provided)',
        eventTimestamp: externalRecord[prov.timestampField] || '(not provided)'
    };

    const errors = mapped.filter(m => m.missing).map(m => `${m.column} is required (source: ${m.sourceField})`);

    RelayLog.info(`[ROUTE-PREVIEW] dry-run route=${routeId} → ${route.targetSheet}: mapped=${mapped.length} dropped=${dropped.length} errors=${errors.length}`);

    return {
        routeId,
        targetSheet: route.targetSheet,
        scope: route.scope,
        factClass: route.factClass,
        keys: route.keys,
        mapped,
        dropped,
        provenance,
        errors: errors.length > 0 ? errors : null,
        wouldAppend: errors.length === 0
    };
}

/**
 * Ingest a single external record through a route.
 * Appends the normalized row to the target fact sheet.
 *
 * @param {string} routeId — which route to use
 * @param {Object} externalRecord — the raw external data record
 * @param {Object} relayState — the relay state object (tree.nodes)
 * @param {Function} ensureCellIndex — helper to rebuild cell index
 * @returns {{ success: boolean, sheetId: string, rowIndex: number, provenance: Object } | null}
 */
export function ingestRecord(routeId, externalRecord, relayState, ensureCellIndex) {
    const normalized = normalizeRecord(routeId, externalRecord);
    if (!normalized) return null;

    // Find the target sheet node
    const sheetNode = relayState.tree.nodes.find(
        n => n.type === 'sheet' && n.id === normalized.sheetId
    );
    if (!sheetNode) {
        RelayLog.error(`[ROUTE] Target sheet not found: ${normalized.sheetId}`);
        return null;
    }

    // Append row to cellData (append-only — routes NEVER mutate existing rows)
    const newRowIndex = sheetNode.rows || sheetNode.cellData.reduce((max, c) => Math.max(max, c.row + 1), 0);
    normalized.row.forEach((value, colIdx) => {
        sheetNode.cellData.push({
            row: newRowIndex,
            col: colIdx,
            timeboxCount: 1,
            hasFormula: false,
            value: value,
            display: String(value),
            provenance: colIdx === 0 ? normalized.provenance : undefined // Store provenance on first cell of row
        });
    });

    // Update sheet dimensions
    sheetNode.rows = newRowIndex + 1;

    // Invalidate cell index so it gets rebuilt
    sheetNode._cellIndex = null;
    if (ensureCellIndex) ensureCellIndex(sheetNode);

    // D0: Suppress per-row logging during batch ingestion (check global flag)
    const isBatchIngesting = (typeof window !== 'undefined') ? window._relayBatchIngesting === true : false;
    if (!isBatchIngesting) {
        RelayLog.info(
            `[ROUTE] ingested: route=${routeId} sheet=${normalized.sheetId} row=${newRowIndex} ` +
            `keys={${Object.entries(normalized.keys).map(([k,v]) => `${k}:${v}`).join(',')}} ` +
            `source=${normalized.provenance.sourceSystem}/${normalized.provenance.sourceId}`
        );
    }

    return {
        success: true,
        sheetId: normalized.sheetId,
        scope: normalized.scope,
        rowIndex: newRowIndex,
        provenance: normalized.provenance,
        keys: normalized.keys
    };
}

/**
 * Ingest a batch of records through a route.
 * Each record is appended independently. Returns summary.
 *
 * @param {string} routeId
 * @param {Array<Object>} records — array of external records
 * @param {Object} relayState
 * @param {Function} ensureCellIndex
 * @returns {{ ingested: number, failed: number, sheetId: string }}
 */
export function ingestBatch(routeId, records, relayState, ensureCellIndex) {
    let ingested = 0, failed = 0;
    let sheetId = '';

    const t0 = performance.now();

    // D0: Suppress per-row logging during batch ingestion
    if (typeof window !== 'undefined') window._relayBatchIngesting = true;

    // D0.1: Defer ensureCellIndex until after all rows are appended (avoid O(n²) rebuilds)
    for (const record of records) {
        const result = ingestRecord(routeId, record, relayState, null); // null = skip per-record index rebuild
        if (result?.success) {
            ingested++;
            sheetId = result.sheetId;
        } else {
            failed++;
        }
    }

    // D0: Re-enable per-row logging
    if (typeof window !== 'undefined') window._relayBatchIngesting = false;

    // Rebuild cell index once for the target sheet
    if (sheetId && ensureCellIndex) {
        const sheetNode = relayState.tree.nodes.find(n => n.id === sheetId);
        if (sheetNode) {
            sheetNode._cellIndex = null;
            ensureCellIndex(sheetNode);
        }
    }

    const elapsed = (performance.now() - t0).toFixed(1);
    RelayLog.info(`[ROUTE] batch complete: route=${routeId} sheet=${sheetId} ingested=${ingested} failed=${failed} elapsed=${elapsed}ms`);
    return { ingested, failed, sheetId, elapsed: Number(elapsed) };
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA STREAM — simulated events for proof/testing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a mock external record for a given route.
 * Used for testing the route → fact → match → summary → KPI → tree chain.
 *
 * @param {string} routeId
 * @returns {Object|null} — an external record with source-system field names
 */
export function generateMockRecord(routeId) {
    const route = routeRegistry.get(routeId);
    if (!route) return null;

    const ts = new Date().toISOString();
    const id = `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    // Base record with provenance fields
    const record = {};
    const prov = route.provenance || {};
    record[prov.systemField || 'sourceSystem'] = 'MockStream';
    record[prov.sourceIdField || 'documentId'] = id;
    record[prov.timestampField || 'eventTimestamp'] = ts;

    // Generate field values based on type
    for (const [colId, fieldDef] of Object.entries(route.fields)) {
        if (fieldDef.type === 'number') {
            record[fieldDef.source] = Math.round(Math.random() * 1000 * 100) / 100;
        } else {
            record[fieldDef.source] = `${colId}-${id.slice(-6)}`;
        }
    }

    return record;
}

/**
 * Predefined mock scenarios for P2P routes.
 * Returns records that use realistic field names matching the route's source fields.
 */
export const P2P_MOCK_SCENARIOS = {
    /** A new invoice arrives from an external AP system */
    newInvoice: () => ({
        sourceSystem: 'SAP-AP',
        documentId: `INV-MOCK-${Date.now()}`,
        eventTimestamp: new Date().toISOString(),
        invoiceNumber: `INV-${9000 + Math.floor(Math.random() * 1000)}`,
        lineId: `IL-${100 + Math.floor(Math.random() * 900)}`,
        vendorCode: 'V-200',
        poLineReference: 'POL-001',
        materialNumber: 'ITM-100',
        quantity: 500 + Math.floor(Math.random() * 100),
        unitPrice: 0.42 + Math.random() * 0.1,
        lineAmount: 0,  // will be computed below
        taxAmount: 0,
        currencyCode: 'USD',
        invoiceDate: new Date().toISOString().split('T')[0],
        paymentDueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'POSTED'
    }),

    /** A goods receipt confirming PO delivery */
    newGoodsReceipt: () => ({
        sourceSystem: 'SAP-MM',
        documentId: `GR-MOCK-${Date.now()}`,
        eventTimestamp: new Date().toISOString(),
        receiptNumber: `GR-${6000 + Math.floor(Math.random() * 1000)}`,
        lineId: `GRL-${100 + Math.floor(Math.random() * 900)}`,
        poLineReference: 'POL-006',
        materialNumber: 'ITM-400',
        quantityReceived: 100,
        quantityOrdered: 100,
        receiptDate: new Date().toISOString().split('T')[0],
        warehouseCode: 'WH-03',
        inspectionResult: 'PASSED',
        status: 'COMPLETE'
    }),

    /** A payment clearing an invoice */
    newPayment: () => ({
        sourceSystem: 'SAP-FI',
        documentId: `PAY-MOCK-${Date.now()}`,
        eventTimestamp: new Date().toISOString(),
        paymentNumber: `PAY-${9100 + Math.floor(Math.random() * 900)}`,
        lineId: `PL-${100 + Math.floor(Math.random() * 900)}`,
        invoiceReference: 'INV-8004',
        vendorCode: 'V-410',
        paymentAmount: 3465.00,
        currencyCode: 'USD',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Wire',
        bankReference: `BNK-MOCK-${Date.now()}`,
        status: 'CLEARED'
    })
};

// Fix lineAmount for newInvoice
const _origNewInvoice = P2P_MOCK_SCENARIOS.newInvoice;
P2P_MOCK_SCENARIOS.newInvoice = () => {
    const r = _origNewInvoice();
    r.lineAmount = Math.round(r.quantity * r.unitPrice * 100) / 100;
    r.taxAmount = Math.round(r.lineAmount * 0.05 * 100) / 100;
    return r;
};
