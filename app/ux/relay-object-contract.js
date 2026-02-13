/**
 * UX-1.1: Universal Object Contract
 * 
 * A single adapter function that returns a standard interface for any
 * selected/focused object in Relay. This is an ADAPTER — it does NOT
 * modify core data structures, create new IDs, or mutate state.
 * 
 * Every focusable/pickable object in Relay can be converted to a
 * RelayObject via toRelayObject(target).
 */

import { getRoute, getRouteIds, getAllRoutes } from '../modules/route-engine.js';

// ═══════════════════════════════════════════════════════════════════
// ACTION DEFINITIONS (per object type, config-driven)
// ═══════════════════════════════════════════════════════════════════

const ACTION_REGISTRY = {
    cell: [
        { id: 'edit', label: 'Edit Cell', icon: '✏️' },
        { id: 'viewDependencies', label: 'View Dependencies', icon: '🔗' },
        { id: 'viewHistory', label: 'View History', icon: '📜' },
        { id: 'createValidation', label: 'Create Validation Rule', icon: '✅' },
        { id: 'lockScope', label: 'Lock Scope', icon: '🔒' }
    ],
    sheet: [
        { id: 'focusView', label: 'Focus View', icon: '🔍' },
        { id: 'showSchema', label: 'Show Schema', icon: '📋' },
        { id: 'addColumn', label: 'Add Column', icon: '➕' },
        { id: 'addValidation', label: 'Add Validation', icon: '✅' },
        { id: 'addSummaryBinding', label: 'Add Summary Binding', icon: '📊' }
    ],
    match: [
        { id: 'inspectSources', label: 'Inspect Source Rows', icon: '🔎' },
        { id: 'viewVariance', label: 'View Variance', icon: '📐' },
        { id: 'setTolerance', label: 'Set Tolerance', icon: '⚙️' },
        { id: 'markResolved', label: 'Mark Resolved', icon: '✔️' }
    ],
    route: [
        { id: 'previewMapping', label: 'Preview Mapping', icon: '🗺️' },
        { id: 'ingestTestRecord', label: 'Ingest Test Record', icon: '📥' },
        { id: 'showProvenance', label: 'Show Provenance', icon: '📜' },
        { id: 'editFieldMap', label: 'Edit Field Map', icon: '✏️' }
    ],
    branch: [
        { id: 'focusView', label: 'Focus View', icon: '🔍' },
        { id: 'showKPIs', label: 'Show KPIs', icon: '📈' },
        { id: 'showTimeboxes', label: 'Show Timeboxes', icon: '⏱️' },
        { id: 'showPressureSources', label: 'Show Pressure Sources', icon: '🌡️' },
        { id: 'cycleClusterLevel', label: 'Cycle Cluster Level', icon: '🌐' },
        { id: 'focusNextRegion', label: 'Focus Next Region', icon: '🗺️' },
        { id: 'loadGlobalCore', label: 'Load Global Core', icon: '🧭' }
    ],
    trunk: [
        { id: 'focusView', label: 'Focus View', icon: '🔍' },
        { id: 'showKPIs', label: 'Show KPIs', icon: '📈' },
        { id: 'showTimeboxes', label: 'Show Timeboxes', icon: '⏱️' },
        { id: 'showBranches', label: 'Show Branches', icon: '🌿' },
        { id: 'cycleClusterLevel', label: 'Cycle Cluster Level', icon: '🌐' },
        { id: 'focusNextRegion', label: 'Focus Next Region', icon: '🗺️' },
        { id: 'loadGlobalCore', label: 'Load Global Core', icon: '🧭' }
    ],
    module: [
        { id: 'showAllSheets', label: 'Show All Sheets', icon: '📑' },
        { id: 'showRoutes', label: 'Show Routes', icon: '🛤️' },
        { id: 'showKPIBindings', label: 'Show KPI Bindings', icon: '📊' },
        { id: 'showRecomputationChain', label: 'Show Recomputation Chain', icon: '🔄' }
    ]
};

// ═══════════════════════════════════════════════════════════════════
// HELPER: Resolve relayState (passed in or from window global)
// ═══════════════════════════════════════════════════════════════════

let _stateRef = null;

function getRelayState() {
    if (_stateRef) return _stateRef;
    if (typeof window !== 'undefined' && window.relayState) return window.relayState;
    return null;
}

/** Temporarily bind a state reference for the duration of a call */
function withState(state, fn) {
    const prev = _stateRef;
    _stateRef = state || null;
    try { return fn(); } finally { _stateRef = prev; }
}

function findNode(nodeId) {
    const state = getRelayState();
    if (!state || !state.tree) return null;
    return state.tree.nodes.find(n => n.id === nodeId) || null;
}

function findSheet(sheetId) {
    return findNode(sheetId);
}

function findChildSheets(branchId) {
    const state = getRelayState();
    if (!state || !state.tree) return [];
    return state.tree.nodes.filter(n => n.type === 'sheet' && n.parent === branchId);
}

function findChildBranches(parentId) {
    const state = getRelayState();
    if (!state || !state.tree) return [];
    return state.tree.nodes.filter(n => n.type === 'branch' && n.parent === parentId);
}

// ═══════════════════════════════════════════════════════════════════
// CELL ADAPTER
// ═══════════════════════════════════════════════════════════════════

function adaptCell(sheet, row, col) {
    const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`;
    const cellId = `${sheet.id}.cell.${row}.${col}`;

    // Look up cell info from cellData
    let cellInfo = null;
    if (sheet._cellIndex) {
        cellInfo = sheet._cellIndex.get(`${row},${col}`) || null;
    } else if (sheet.cellData) {
        cellInfo = sheet.cellData.find(c => c.row === row && c.col === col) || null;
    }

    const hasFormula = cellInfo?.hasFormula || false;
    const formula = cellInfo?.formula || null;
    const value = cellInfo?.display || cellInfo?.value || '';
    const timeboxCount = cellInfo?.timeboxCount || 0;
    const provenance = cellInfo?.provenance || null;

    // Resolve dependencies from formula (reference list only, not full eval)
    const dependencies = [];
    if (formula) {
        // Extract cell references from formula string
        const refPattern = /(?:([A-Za-z0-9_.]+)!)?([A-Z]+[0-9]+)/g;
        let match;
        while ((match = refPattern.exec(formula)) !== null) {
            dependencies.push({
                sheetId: match[1] || sheet.id,
                cellRef: match[2]
            });
        }
    }

    // Determine scope from sheet's parent branch
    const scope = sheet.parent || sheet.metadata?.moduleId || 'unknown';

    return {
        id: cellId,
        type: 'cell',
        label: `${sheet.name || sheet.id} → ${cellRef}`,
        scope,
        cellRef,
        sheetId: sheet.id,
        row,
        col,
        value,
        formula,
        hasFormula,
        facts: [],   // Cells don't directly reference facts
        dependencies,
        historyCount: timeboxCount,
        provenance: provenance ? {
            sourceSystem: provenance.sourceSystem || 'unknown',
            sourceId: provenance.sourceId || null,
            ingestedAt: provenance.ingestedAt || null,
            routeId: provenance.routeId || null
        } : null,
        actions: ACTION_REGISTRY.cell
    };
}

// ═══════════════════════════════════════════════════════════════════
// SHEET ADAPTER
// ═══════════════════════════════════════════════════════════════════

function adaptSheet(sheet) {
    const meta = sheet.metadata || {};
    const cellCount = sheet.cellData?.length || 0;
    const formulaCount = sheet.cellData?.filter(c => c.hasFormula)?.length || 0;
    const totalTimeboxes = sheet.cellData?.reduce((sum, c) => sum + (c.timeboxCount || 0), 0) || 0;

    // Determine sub-type for more specific labeling
    let subType = 'fact';
    if (meta.isMatchSheet) subType = 'match';
    else if (meta.isSummarySheet) subType = 'summary';

    // Find routes targeting this sheet
    const routeBindings = [];
    try {
        const allRoutes = getAllRoutes();
        if (allRoutes) {
            for (const [routeId, route] of allRoutes) {
                if (route.targetSheet === sheet.id) {
                    routeBindings.push({ routeId, factClass: route.factClass });
                }
            }
        }
    } catch (e) { /* route engine may not be loaded */ }

    // Determine scope
    const scope = sheet.parent || meta.moduleId || 'unknown';

    // Build facts references (source sheets for match/summary)
    const facts = (meta.sourceSheets || []).map(sid => ({ sheetId: sid }));

    return {
        id: sheet.id,
        type: 'sheet',
        label: sheet.name || sheet.id,
        scope,
        subType,
        isMatchSheet: meta.isMatchSheet || false,
        isSummarySheet: meta.isSummarySheet || false,
        rows: sheet.rows || 0,
        cols: sheet.cols || 0,
        cellCount,
        formulaCount,
        schema: meta.schema || [],
        moduleId: meta.moduleId || null,
        routeBindings,
        facts: routeBindings.length > 0 ? routeBindings : facts,
        dependencies: (meta.sourceSheets || []).map(sid => ({ type: 'source', sheetId: sid })),
        historyCount: totalTimeboxes,
        provenance: null,   // Sheets don't have provenance; their rows do
        actions: ACTION_REGISTRY.sheet
    };
}

// ═══════════════════════════════════════════════════════════════════
// MATCH ROW ADAPTER
// ═══════════════════════════════════════════════════════════════════

function adaptMatchRow(sheet, row) {
    const meta = sheet.metadata || {};
    const schema = meta.schema || [];

    // Extract match row data
    const rowCells = (sheet.cellData || []).filter(c => c.row === row);
    const rowData = {};
    rowCells.forEach(c => {
        const colDef = schema[c.col];
        if (colDef) {
            rowData[colDef.id || colDef.name] = c.value || c.display || '';
        }
    });

    const matchId = rowData.matchId || `${sheet.id}.row.${row}`;
    const matchStatus = rowData.matchStatus || 'UNKNOWN';
    const joinKeyType = rowData.joinKeyType || 'UNKNOWN';
    const confidence = rowData.confidence || '';

    // Build source references from join keys
    const facts = [];
    if (rowData.poLineId) facts.push({ sheetId: 'P2P.POLines', key: 'poLineId', value: rowData.poLineId });
    if (rowData.grLineId) facts.push({ sheetId: 'P2P.GRLines', key: 'grLineId', value: rowData.grLineId });
    if (rowData.invLineId) facts.push({ sheetId: 'P2P.InvoiceLines', key: 'invLineId', value: rowData.invLineId });
    if (rowData.glLineId) facts.push({ sheetId: 'P2P.GLPostingLines', key: 'glLineId', value: rowData.glLineId });
    if (rowData.payId) facts.push({ sheetId: 'P2P.PaymentLines', key: 'payId', value: rowData.payId });

    const scope = sheet.parent || meta.moduleId || 'unknown';

    return {
        id: matchId,
        type: 'match',
        label: `${matchId} (${matchStatus})`,
        scope,
        sheetId: sheet.id,
        row,
        matchStatus,
        joinKeyType,
        confidence,
        rowData,
        fields: rowData,    // Alias for inspector compatibility
        facts,
        dependencies: [],
        historyCount: rowCells.reduce((sum, c) => sum + (c.timeboxCount || 0), 0),
        provenance: null,
        actions: ACTION_REGISTRY.match
    };
}

// ═══════════════════════════════════════════════════════════════════
// ROUTE ADAPTER
// ═══════════════════════════════════════════════════════════════════

function adaptRoute(routeId) {
    const route = getRoute(routeId);
    if (!route) return null;

    // Find the target sheet for scope
    const targetSheet = findSheet(route.targetSheet);
    const scope = targetSheet?.parent || route.moduleId || 'unknown';

    // Build field mapping references
    const fieldMap = route.fields ? Object.entries(route.fields).map(([colId, def]) => ({
        column: colId,
        sourceField: def.sourceField || colId,
        type: def.type || 'string',
        required: def.required || false
    })) : [];

    return {
        id: routeId,
        type: 'route',
        label: `Route: ${routeId} → ${route.targetSheet}`,
        scope,
        targetSheet: route.targetSheet,
        factClass: route.factClass,
        keys: route.keys || [],
        fieldMap,
        fieldCount: fieldMap.length,
        facts: [{ sheetId: route.targetSheet }],
        dependencies: [],
        historyCount: 0,    // Routes don't have timeboxes
        provenance: null,
        actions: ACTION_REGISTRY.route
    };
}

// ═══════════════════════════════════════════════════════════════════
// BRANCH ADAPTER
// ═══════════════════════════════════════════════════════════════════

function adaptBranch(node) {
    const meta = node.metadata || {};
    const childSheets = findChildSheets(node.id);
    const childBranches = findChildBranches(node.id);
    const totalTimeboxes = (node.commits || []).length;

    // KPI metrics from metadata
    const kpiBindings = meta.kpiBindings || [];
    const kpiMetrics = meta.kpiMetrics || [];
    const latestKPI = kpiMetrics.length > 0 ? kpiMetrics[kpiMetrics.length - 1] : null;

    // Scope = parent node
    const scope = node.parent || 'root';

    return {
        id: node.id,
        type: 'branch',
        label: node.name || node.id,
        scope,
        moduleId: meta.moduleId || null,
        isModuleBranch: meta.isModuleBranch || false,
        childSheetIds: childSheets.map(s => s.id),
        childBranchIds: childBranches.map(b => b.id),
        childCount: childSheets.length + childBranches.length,
        sheetCount: childSheets.length,
        branchCount: childBranches.length,
        kpiBindings,
        kpiMetrics,
        latestKPI,
        eri: node.eri || null,
        facts: childSheets.map(s => ({ sheetId: s.id })),
        dependencies: [],
        historyCount: totalTimeboxes,
        provenance: null,
        actions: ACTION_REGISTRY.branch
    };
}

// ═══════════════════════════════════════════════════════════════════
// TRUNK ADAPTER
// ═══════════════════════════════════════════════════════════════════

function adaptTrunk(node) {
    const childBranches = findChildBranches(node.id);
    const totalTimeboxes = (node.commits || []).length;
    const scope = 'root';

    return {
        id: node.id,
        type: 'trunk',
        label: node.name || node.id,
        scope,
        lat: node.lat,
        lon: node.lon,
        childBranchIds: childBranches.map(b => b.id),
        childCount: childBranches.length,
        facts: [],
        dependencies: [],
        historyCount: totalTimeboxes,
        provenance: null,
        actions: ACTION_REGISTRY.trunk
    };
}

// ═══════════════════════════════════════════════════════════════════
// MODULE ADAPTER
// ═══════════════════════════════════════════════════════════════════

function adaptModule(moduleId) {
    const state = getRelayState();
    if (!state || !state.tree) return null;

    // Find all nodes belonging to this module
    const moduleNodes = state.tree.nodes.filter(n =>
        n.metadata?.moduleId === moduleId
    );

    const sheets = moduleNodes.filter(n => n.type === 'sheet');
    const branches = moduleNodes.filter(n => n.type === 'branch');
    const factSheets = sheets.filter(s => !s.metadata?.isMatchSheet && !s.metadata?.isSummarySheet);
    const matchSheets = sheets.filter(s => s.metadata?.isMatchSheet);
    const summarySheets = sheets.filter(s => s.metadata?.isSummarySheet);

    // Find the module's root branch
    const moduleBranch = branches.find(b => b.metadata?.isModuleBranch);

    // Gather route IDs for this module
    const moduleRoutes = [];
    try {
        const allRoutes = getAllRoutes();
        if (allRoutes) {
            for (const [routeId, route] of allRoutes) {
                if (route.moduleId === moduleId) {
                    moduleRoutes.push(routeId);
                }
            }
        }
    } catch (e) { /* route engine may not be loaded */ }

    // KPI bindings from module branch
    const kpiBindings = moduleBranch?.metadata?.kpiBindings || [];

    const scope = moduleBranch?.parent || 'root';

    return {
        id: moduleId,
        type: 'module',
        label: `Module: ${moduleId}`,
        scope,
        branchId: moduleBranch?.id || null,
        factSheetIds: factSheets.map(s => s.id),
        matchSheetIds: matchSheets.map(s => s.id),
        summarySheetIds: summarySheets.map(s => s.id),
        sheetCount: sheets.length,
        factSheetCount: factSheets.length,
        matchSheetCount: matchSheets.length,
        summarySheetCount: summarySheets.length,
        routeIds: moduleRoutes,
        routeCount: moduleRoutes.length,
        kpiBindings,
        facts: factSheets.map(s => ({ sheetId: s.id })),
        dependencies: [],
        historyCount: 0,
        provenance: null,
        actions: ACTION_REGISTRY.module
    };
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT: toRelayObject(target)
// ═══════════════════════════════════════════════════════════════════

/**
 * Convert any Relay target into a standard RelayObject.
 * 
 * Accepted inputs:
 * - Tree node: { id, type: 'trunk'|'branch'|'sheet', ... }
 * - Cell ref:  { sheetId, row, col }
 * - Match/row: { sheetId, row } (auto-detects match sheet)
 * - Match row: { sheetId, matchId }
 * - Route:     { routeId } or string routeId
 * - Module:    { moduleId } or 'module:P2P' string
 * - Cesium entity with _relayNodeId
 * - String ID (resolved against tree nodes, then routes, then modules)
 * 
 * @param {*} target - The target to adapt
 * @param {object} [relayState] - Optional relayState override (defaults to window.relayState)
 * @returns {object|null} RelayObject or null if unresolvable
 */
export function toRelayObject(target, relayState) {
    if (!target) return null;

    // Bind relayState for nested calls
    return withState(relayState, () => _resolve(target));
}

function _resolve(target) {
    // ── Case 1: Already a tree node (has .type and .id) ──
    if (target.type && target.id) {
        if (target.type === 'trunk') return adaptTrunk(target);
        if (target.type === 'branch') return adaptBranch(target);
        if (target.type === 'sheet') return adaptSheet(target);
    }

    // ── Case 2: Cell or row reference { sheetId, row [, col] } ──
    if (target.sheetId !== undefined && target.row !== undefined) {
        const sheet = findSheet(target.sheetId);
        if (!sheet) return null;

        // Match sheet row (no col, or explicit isMatch, or sheet is match sheet)
        if (target.col === undefined || target.isMatch || sheet.metadata?.isMatchSheet) {
            if (sheet.metadata?.isMatchSheet) {
                return adaptMatchRow(sheet, target.row);
            }
        }

        // Regular cell (col must be provided)
        if (target.col !== undefined) {
            return adaptCell(sheet, target.row, target.col);
        }

        return null;
    }

    // ── Case 3: Match row reference { sheetId, matchId } ──
    if (target.sheetId && target.matchId) {
        const sheet = findSheet(target.sheetId);
        if (!sheet || !sheet.metadata?.isMatchSheet) return null;
        const schema = sheet.metadata?.schema || [];
        const matchIdCol = schema.findIndex(s => s.id === 'matchId' || s.name === 'matchId');
        if (matchIdCol >= 0 && sheet.cellData) {
            const matchCell = sheet.cellData.find(c => c.col === matchIdCol && (c.value === target.matchId || c.display === target.matchId));
            if (matchCell) {
                return adaptMatchRow(sheet, matchCell.row);
            }
        }
        return null;
    }

    // ── Case 4: Route reference { routeId } ──
    if (target.routeId) {
        return adaptRoute(target.routeId);
    }

    // ── Case 5: Module reference { moduleId } ──
    if (target.moduleId) {
        return adaptModule(target.moduleId);
    }

    // ── Case 6: Cesium entity/primitive with _relayNodeId ──
    if (target._relayNodeId) {
        const node = findNode(target._relayNodeId);
        if (node) return _resolve(node);
        return null;
    }

    // ── Case 7: String ID ──
    if (typeof target === 'string') {
        // Handle 'module:XXX' prefix
        if (target.startsWith('module:')) {
            const moduleId = target.slice(7);
            return adaptModule(moduleId);
        }

        // Try tree node first
        const node = findNode(target);
        if (node) return _resolve(node);

        // Try route
        try {
            const route = getRoute(target);
            if (route) return adaptRoute(target);
        } catch (e) { /* route engine may not be loaded */ }

        // Try module (check if any nodes have this moduleId)
        const state = getRelayState();
        if (state?.tree?.nodes.some(n => n.metadata?.moduleId === target)) {
            return adaptModule(target);
        }

        return null;
    }

    // ── Case 8: Object with entity .id string (Cesium picked result) ──
    if (target.id && (typeof target.id === 'string' || typeof target.id?.getValue === 'function')) {
        const idStr = typeof target.id === 'string' ? target.id : target.id.getValue();
        // Strip entity suffixes to get base node ID (same logic as resolvePickedToNode)
        const idBase = idStr
            .split('.cell.')[0]
            .split('-surface')[0]
            .split('-outline')[0]
            .split('-segment')[0]
            .split('-root')[0]
            .split('-anchor')[0]
            .split('-spine')[0]
            .split('-lane')[0]
            .split('-timebox')[0]
            .split('-label')[0]
            .split('-presence')[0]
            .split('-formula')[0];

        const node = findNode(idBase);
        if (node) return _resolve(node);

        // Check if this is a cell entity (has .cell. in original ID)
        if (idStr.includes('.cell.')) {
            const parts = idStr.split('.cell.');
            const sheetId = parts[0];
            const cellParts = parts[1].split('.');
            const row = parseInt(cellParts[0], 10);
            const col = parseInt(cellParts[1], 10);
            if (Number.isFinite(row) && Number.isFinite(col)) {
                const sheet = findSheet(sheetId);
                if (sheet) return adaptCell(sheet, row, col);
            }
        }
    }

    return null;
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY EXPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get the full action registry (all types → actions)
 */
export function getActionRegistry() {
    return ACTION_REGISTRY;
}

/**
 * Get actions for a specific object type
 */
export function getActionsForType(type) {
    return ACTION_REGISTRY[type] || [];
}

/**
 * Get all known object types
 */
export function getObjectTypes() {
    return Object.keys(ACTION_REGISTRY);
}

/**
 * Resolve a Cesium pick result to a RelayObject
 */
export function pickToRelayObject(pickResult) {
    if (!pickResult || !pickResult.id) return null;
    return toRelayObject(pickResult);
}
