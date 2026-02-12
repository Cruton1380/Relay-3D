/**
 * MODULE LOADER — Fractal Process Module Engine
 * 
 * Reads a module definition JSON and generates tree nodes + edges
 * with sample data rows for each fact sheet.
 * 
 * Modules are configurations of baseline fact sheets + match sheets +
 * summary sheets + KPI bindings — not new custom code per industry.
 */

import { RelayLog } from '../../core/utils/relay-log.js';

// ─── Sample Data for P2P Fact Sheets ───────────────────────────────────

const P2P_SAMPLE_DATA = {
    'P2P.RequisitionLines': [
        ['REQ-001', 'RL-001', 'J. Smith',   'Engineering', 'ITM-100', 'Steel Bolts M10',    500,  0.45, 225.00,  'USD', '2026-01-05', 'APPROVED'],
        ['REQ-001', 'RL-002', 'J. Smith',   'Engineering', 'ITM-101', 'Steel Nuts M10',     500,  0.30, 150.00,  'USD', '2026-01-05', 'APPROVED'],
        ['REQ-002', 'RL-003', 'A. Cohen',   'Operations',  'ITM-200', 'Hydraulic Pump P40', 2,    1250.00, 2500.00, 'USD', '2026-01-08', 'APPROVED'],
        ['REQ-003', 'RL-004', 'M. Lee',     'Maintenance', 'ITM-300', 'Filter Cartridge',   24,   18.50, 444.00, 'USD', '2026-01-10', 'PENDING'],
        ['REQ-003', 'RL-005', 'M. Lee',     'Maintenance', 'ITM-301', 'Gasket Set',         12,   45.00, 540.00, 'USD', '2026-01-10', 'PENDING'],
        ['REQ-004', 'RL-006', 'S. Patel',   'Production',  'ITM-400', 'Resin Compound A',   100,  32.00, 3200.00,'USD', '2026-01-12', 'APPROVED'],
    ],
    'P2P.POLines': [
        ['PO-1001', 'POL-001', 'V-200', 'Acme Fasteners',   'ITM-100', 'Steel Bolts M10',    500,  0.42, 210.00,  'USD', '2026-01-07', '2026-01-20', 'RECEIVED'],
        ['PO-1001', 'POL-002', 'V-200', 'Acme Fasteners',   'ITM-101', 'Steel Nuts M10',     500,  0.28, 140.00,  'USD', '2026-01-07', '2026-01-20', 'RECEIVED'],
        ['PO-1002', 'POL-003', 'V-301', 'HydraFlow Inc',    'ITM-200', 'Hydraulic Pump P40', 2,    1200.00, 2400.00, 'USD', '2026-01-09', '2026-02-01', 'RECEIVED'],
        ['PO-1003', 'POL-004', 'V-150', 'FilterTech Ltd',   'ITM-300', 'Filter Cartridge',   24,   17.50, 420.00, 'USD', '2026-01-14', '2026-01-28', 'RECEIVED'],
        ['PO-1003', 'POL-005', 'V-150', 'FilterTech Ltd',   'ITM-301', 'Gasket Set',         10,   42.00, 420.00, 'USD', '2026-01-14', '2026-01-28', 'PARTIAL'],
        ['PO-1004', 'POL-006', 'V-410', 'ChemSupply Co',    'ITM-400', 'Resin Compound A',   100,  31.50, 3150.00,'USD', '2026-01-15', '2026-02-05', 'OPEN'],
    ],
    'P2P.GRLines': [
        ['GR-5001', 'GRL-001', 'POL-001', 'ITM-100', 500, 500,  '2026-01-19', 'WH-01', 'PASSED', 'COMPLETE'],
        ['GR-5001', 'GRL-002', 'POL-002', 'ITM-101', 500, 500,  '2026-01-19', 'WH-01', 'PASSED', 'COMPLETE'],
        ['GR-5002', 'GRL-003', 'POL-003', 'ITM-200', 2,   2,    '2026-01-30', 'WH-02', 'PASSED', 'COMPLETE'],
        ['GR-5003', 'GRL-004', 'POL-004', 'ITM-300', 24,  24,   '2026-01-27', 'WH-01', 'PASSED', 'COMPLETE'],
        ['GR-5003', 'GRL-005', 'POL-005', 'ITM-301', 10,  10,   '2026-01-27', 'WH-01', 'PASSED', 'COMPLETE'],
    ],
    'P2P.InvoiceLines': [
        ['INV-8001', 'IL-001', 'V-200', 'POL-001', 'ITM-100', 500,  0.42,  210.00,  10.50,  'USD', '2026-01-22', '2026-02-22', 'POSTED'],
        ['INV-8001', 'IL-002', 'V-200', 'POL-002', 'ITM-101', 500,  0.28,  140.00,  7.00,   'USD', '2026-01-22', '2026-02-22', 'POSTED'],
        ['INV-8002', 'IL-003', 'V-301', 'POL-003', 'ITM-200', 2,    1250.00, 2500.00, 125.00,'USD', '2026-02-02', '2026-03-02', 'POSTED'],
        ['INV-8003', 'IL-004', 'V-150', 'POL-004', 'ITM-300', 24,   18.00, 432.00,  21.60,  'USD', '2026-01-30', '2026-02-28', 'POSTED'],
        ['INV-8003', 'IL-005', 'V-150', 'POL-005', 'ITM-301', 12,   44.00, 528.00,  26.40,  'USD', '2026-01-30', '2026-02-28', 'EXCEPTION'],
        ['INV-8004', 'IL-006', 'V-410', '',         'ITM-400', 100,  33.00, 3300.00, 165.00, 'USD', '2026-02-06', '2026-03-06', 'PENDING'],
    ],
    'P2P.PaymentLines': [
        ['PAY-9001', 'PL-001', 'INV-8001', 'V-200', 367.50,  'USD', '2026-02-20', 'Wire',  'BNK-20260220-001', 'CLEARED'],
        ['PAY-9002', 'PL-002', 'INV-8002', 'V-301', 2625.00, 'USD', '2026-02-28', 'Wire',  'BNK-20260228-002', 'CLEARED'],
        ['PAY-9003', 'PL-003', 'INV-8003', 'V-150', 453.60,  'USD', '2026-02-25', 'ACH',   'BNK-20260225-003', 'CLEARED'],
        ['PAY-9004', 'PL-004', 'INV-8003', 'V-150', 369.60,  'USD', '2026-02-25', 'ACH',   'BNK-20260225-004', 'HOLD'],
    ],
    'P2P.GLPostingLines': [
        ['GL-7001', 'GLL-001', 'INV', 'INV-8001', '211000', 'CC-ENG', 0,       367.50,  '2026-01-22', 'USD', 367.50],
        ['GL-7001', 'GLL-002', 'INV', 'INV-8001', '501000', 'CC-ENG', 350.00,  0,       '2026-01-22', 'USD', 350.00],
        ['GL-7001', 'GLL-003', 'INV', 'INV-8001', '230000', 'CC-ENG', 17.50,   0,       '2026-01-22', 'USD', 17.50],
        ['GL-7002', 'GLL-004', 'INV', 'INV-8002', '211000', 'CC-OPS', 0,       2625.00, '2026-02-02', 'USD', 2625.00],
        ['GL-7002', 'GLL-005', 'INV', 'INV-8002', '501000', 'CC-OPS', 2500.00, 0,       '2026-02-02', 'USD', 2500.00],
        ['GL-7002', 'GLL-006', 'INV', 'INV-8002', '230000', 'CC-OPS', 125.00,  0,       '2026-02-02', 'USD', 125.00],
        ['GL-7003', 'GLL-007', 'PAY', 'PAY-9001', '211000', 'CC-ENG', 367.50,  0,       '2026-02-20', 'USD', 367.50],
        ['GL-7003', 'GLL-008', 'PAY', 'PAY-9001', '110000', 'CC-ENG', 0,       367.50,  '2026-02-20', 'USD', 367.50],
    ],
};

// ─── Helper: create a sheet node with cellData from row arrays ─────────

function createSheetNode(sheetDef, parentBranchId, trunkNode, moduleId, sampleRows) {
    const columns = sheetDef.columns;
    const totalRows = 1 + sampleRows.length;
    const totalCols = columns.length;
    const cellData = [];

    // Row 0: Column headers
    columns.forEach((col, colIdx) => {
        cellData.push({ row: 0, col: colIdx, timeboxCount: 1, hasFormula: false, value: col.label, display: col.label });
    });

    // Data rows (detect formulas: strings starting with '=')
    sampleRows.forEach((rowData, rowIdx) => {
        columns.forEach((col, colIdx) => {
            const rawValue = rowData[colIdx] !== undefined ? rowData[colIdx] : '';
            const isFormula = typeof rawValue === 'string' && rawValue.startsWith('=');
            cellData.push({
                row: rowIdx + 1, col: colIdx, timeboxCount: 1,
                hasFormula: isFormula,
                formula: isFormula ? rawValue : undefined,
                value: isFormula ? '' : rawValue,
                display: isFormula ? rawValue : String(rawValue)
            });
        });
    });

    return {
        id: sheetDef.sheetId,
        type: 'sheet',
        name: sheetDef.name,
        parent: parentBranchId,
        lat: trunkNode.lat,
        lon: trunkNode.lon,
        alt: (trunkNode.alt || 2000) + 300,
        eri: 50,
        rows: totalRows,
        cols: totalCols,
        cellData,
        metadata: {
            moduleId,
            factClass: sheetDef.factClass || sheetDef.matchClass || sheetDef.summaryClass,
            sheetName: sheetDef.name,
            schema: columns,
            rows: totalRows,
            cols: totalCols,
            isMatchSheet: !!sheetDef.matchClass,
            sourceSheets: sheetDef.sourceSheets || [],
            joinKey: sheetDef.joinKey || null
        }
    };
}

/**
 * Load a module definition and generate tree nodes + edges.
 * 
 * @param {Object} moduleDef — the module definition JSON object
 * @param {Object} trunkNode — the trunk node to attach to
 * @returns {{ nodes: Array, edges: Array }} — nodes and edges to merge into the tree
 */
export function loadModule(moduleDef, trunkNode) {
    if (!moduleDef || !moduleDef.moduleId) {
        RelayLog.error('[MODULE] Invalid module definition — missing moduleId');
        return { nodes: [], edges: [] };
    }

    const nodes = [];
    const edges = [];
    let totalColumns = 0;

    // Create the module-level branch
    const kpiBindings = moduleDef.kpiBindings || [];
    const moduleBranch = {
        id: moduleDef.branchId,
        type: 'branch',
        name: moduleDef.name,
        parent: trunkNode.id,
        lat: trunkNode.lat,
        lon: trunkNode.lon,
        alt: trunkNode.alt || 2000,
        metadata: {
            moduleId: moduleDef.moduleId,
            isModuleBranch: true,
            kpiBindings,
            kpiMetrics: [] // append-only timebox metric history
        },
        commits: [
            { timeboxId: `${moduleDef.moduleId}-T1`, commitCount: 0, openDrifts: 0, eriAvg: 0, scarCount: 0 }
        ]
    };
    nodes.push(moduleBranch);
    edges.push({ source: trunkNode.id, target: moduleBranch.id, type: 'conduit' });

    // ─── Fact Sheets ─────────────────────────────────────────────────────
    moduleDef.factSheets.forEach((factDef, idx) => {
        const subBranchId = `${moduleDef.branchId}.${factDef.factClass.toLowerCase()}`;

        const subBranch = {
            id: subBranchId,
            type: 'branch',
            name: `${factDef.factClass}: ${factDef.name}`,
            parent: moduleBranch.id,
            lat: trunkNode.lat,
            lon: trunkNode.lon,
            alt: (trunkNode.alt || 2000),
            metadata: { moduleId: moduleDef.moduleId, factClass: factDef.factClass, sheetIndex: idx },
            commits: [{ timeboxId: `${factDef.factClass}-T1`, commitCount: 0, openDrifts: 0, eriAvg: 0, scarCount: 0 }]
        };
        nodes.push(subBranch);
        edges.push({ source: moduleBranch.id, target: subBranch.id, type: 'conduit' });

        const sampleRows = P2P_SAMPLE_DATA[factDef.sheetId] || [];
        totalColumns += factDef.columns.length;
        const sheetNode = createSheetNode(factDef, subBranchId, trunkNode, moduleDef.moduleId, sampleRows);
        nodes.push(sheetNode);
        edges.push({ source: subBranchId, target: factDef.sheetId, type: 'filament' });
    });

    // ─── Match Sheets (B2) ───────────────────────────────────────────────
    const matchSheets = moduleDef.matchSheets || [];
    const matchResults = matchSheets.length > 0 ? buildMatches(P2P_SAMPLE_DATA, moduleDef) : {};
    if (matchSheets.length > 0) {

        matchSheets.forEach((matchDef, idx) => {
            const subBranchId = `${moduleDef.branchId}.${matchDef.matchClass.toLowerCase()}`;

            const subBranch = {
                id: subBranchId,
                type: 'branch',
                name: `${matchDef.matchClass}: ${matchDef.name}`,
                parent: moduleBranch.id,
                lat: trunkNode.lat,
                lon: trunkNode.lon,
                alt: (trunkNode.alt || 2000),
                metadata: { moduleId: moduleDef.moduleId, matchClass: matchDef.matchClass, sheetIndex: idx + moduleDef.factSheets.length },
                commits: [{ timeboxId: `${matchDef.matchClass}-T1`, commitCount: 0, openDrifts: 0, eriAvg: 0, scarCount: 0 }]
            };
            nodes.push(subBranch);
            edges.push({ source: moduleBranch.id, target: subBranch.id, type: 'conduit' });

            const matchRows = matchResults[matchDef.sheetId] || [];
            totalColumns += matchDef.columns.length;
            const sheetNode = createSheetNode(matchDef, subBranchId, trunkNode, moduleDef.moduleId, matchRows);
            nodes.push(sheetNode);
            edges.push({ source: subBranchId, target: matchDef.sheetId, type: 'filament' });
        });
    }

    // ─── Summary Sheets (B3) ─────────────────────────────────────────────
    const summarySheets = moduleDef.summarySheets || [];
    const summaryResults = summarySheets.length > 0 ? buildSummaryData(moduleDef, P2P_SAMPLE_DATA, matchResults) : {};
    if (summarySheets.length > 0) {

        summarySheets.forEach((sumDef, idx) => {
            const subBranchId = `${moduleDef.branchId}.${sumDef.summaryClass.toLowerCase()}`;

            const subBranch = {
                id: subBranchId,
                type: 'branch',
                name: `${sumDef.summaryClass}: ${sumDef.name}`,
                parent: moduleBranch.id,
                lat: trunkNode.lat,
                lon: trunkNode.lon,
                alt: (trunkNode.alt || 2000),
                metadata: { moduleId: moduleDef.moduleId, summaryClass: sumDef.summaryClass, sheetIndex: idx + moduleDef.factSheets.length + matchSheets.length },
                commits: [{ timeboxId: `${sumDef.summaryClass}-T1`, commitCount: 0, openDrifts: 0, eriAvg: 0, scarCount: 0 }]
            };
            nodes.push(subBranch);
            edges.push({ source: moduleBranch.id, target: subBranch.id, type: 'conduit' });

            const summaryRows = summaryResults[sumDef.sheetId] || [];
            totalColumns += sumDef.columns.length;
            const sheetNode = createSheetNode(sumDef, subBranchId, trunkNode, moduleDef.moduleId, summaryRows);
            // Mark as summary sheet in metadata
            sheetNode.metadata.isSummarySheet = true;
            sheetNode.metadata.sourceSheets = sumDef.sourceSheets || [];
            nodes.push(sheetNode);
            edges.push({ source: subBranchId, target: sumDef.sheetId, type: 'filament' });
        });
    }

    const sheetCount = moduleDef.factSheets.length + matchSheets.length + summarySheets.length;
    RelayLog.info(`[MODULE] ${moduleDef.moduleId} loaded: ${sheetCount} sheets (${moduleDef.factSheets.length} fact + ${matchSheets.length} match + ${summarySheets.length} summary), ${totalColumns} columns`);
    moduleDef.factSheets.forEach(fs => {
        RelayLog.info(`[MODULE]   ${fs.factClass}: ${fs.sheetId} (${fs.columns.length} cols)`);
    });
    matchSheets.forEach(ms => {
        const rows = (matchResults[ms.sheetId] || []).length;
        RelayLog.info(`[MODULE]   ${ms.matchClass}: ${ms.sheetId} (${ms.columns.length} cols, ${rows} match rows)`);
    });
    summarySheets.forEach(ss => {
        const rows = (summaryResults[ss.sheetId] || []).length;
        RelayLog.info(`[MODULE]   ${ss.summaryClass}: ${ss.sheetId} (${ss.columns.length} cols, ${rows} formula rows)`);
    });
    if (kpiBindings.length > 0) {
        RelayLog.info(`[MODULE] KPI bindings: ${kpiBindings.length} metrics → ${moduleDef.branchId}`);
        kpiBindings.forEach(kb => {
            RelayLog.info(`[MODULE]   ${kb.metricId}: ${kb.sourceCell} (${kb.unit || ''})`);
        });
    }

    return { nodes, edges };
}

// ═══════════════════════════════════════════════════════════════════════════
// B3 — SUMMARY SHEET DATA BUILDER (formulas only, no JS aggregation)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build summary sheet rows as formula-only cells.
 * All values in summary sheets are spreadsheet formulas (starting with '='),
 * not JS-computed aggregations. This preserves the "formulas only" invariant.
 *
 * @param {Object} moduleDef — module definition with factSheets, matchSheets, summarySheets
 * @param {Object} sampleData — baseline data (for determining row counts)
 * @param {Object} matchResults — match builder output (for determining match row counts)
 * @returns {Object} — { sheetId: [[cell0, cell1, ...], ...] }
 */
export function buildSummaryData(moduleDef, sampleData, matchResults) {
    const results = {};
    const summaryDefs = moduleDef?.summarySheets || [];

    // Config-only summary rows: allows non-P2P modules to define formula-only sheets in JSON.
    for (const sumDef of summaryDefs) {
        if (Array.isArray(sumDef.formulaRows) && sumDef.formulaRows.length > 0) {
            results[sumDef.sheetId] = sumDef.formulaRows.map(row => [...row]);
        }
    }

    // ─── Determine data row counts for range references ──────────────────
    // Fact sheet rows (excluding header)
    const invRowCount = (sampleData['P2P.InvoiceLines'] || []).length;
    const poRowCount = (sampleData['P2P.POLines'] || []).length;
    const payRowCount = (sampleData['P2P.PaymentLines'] || []).length;
    // Match sheet rows
    const threeWayRowCount = (matchResults['P2P.ThreeWayMatch'] || []).length;
    const invPayRowCount = (matchResults['P2P.InvoiceToPaymentMatch'] || []).length;
    const invGLRowCount = (matchResults['P2P.InvoiceToGLMatch'] || []).length;

    // Cell refs: data starts at row 2 (row 1 is header in cell ref), last row = 1 + rowCount
    const invEnd = invRowCount + 1;        // e.g. 7 for 6 rows
    const poEnd = poRowCount + 1;          // e.g. 7 for 6 rows
    const payEnd = payRowCount + 1;        // e.g. 5 for 4 rows
    const twEnd = threeWayRowCount + 1;    // e.g. 8 for 7 rows
    const ipEnd = invPayRowCount + 1;      // e.g. 5 for 4 rows

    // ─── P2P.AP_Aging ────────────────────────────────────────────────────
    // InvoiceToPaymentMatch: F=invAmount, G=paidAmount, I=matchStatus, K=ageDays
    // D0.5: Real aging buckets using ageDays column (col K)
    if (summaryDefs.some(s => s.sheetId === 'P2P.AP_Aging')) results['P2P.AP_Aging'] = [
        ['Total Invoiced',      `=SUM(P2P.InvoiceToPaymentMatch!F2:F${ipEnd})`],
        ['Total Paid',          `=SUM(P2P.InvoiceToPaymentMatch!G2:G${ipEnd})`],
        ['Outstanding',         '=B2-B3'],
        ['Matched Invoices',    `=COUNTIF(P2P.InvoiceToPaymentMatch!I2:I${ipEnd},"MATCHED")`],
        ['Partial Payments',    `=COUNTIF(P2P.InvoiceToPaymentMatch!I2:I${ipEnd},"PARTIAL")`],
        ['Unpaid Invoices',     `=COUNTIF(P2P.InvoiceToPaymentMatch!I2:I${ipEnd},"UNMATCHED")`],
        ['Avg Age (Days)',      `=IF(COUNT(P2P.InvoiceToPaymentMatch!K2:K${ipEnd})>0,AVERAGE(P2P.InvoiceToPaymentMatch!K2:K${ipEnd}),0)`],
        ['Current (0-30d)',     `=COUNTIF(P2P.InvoiceToPaymentMatch!K2:K${ipEnd},"<=30")`],
        ['Aging 31-60d',        `=COUNTIF(P2P.InvoiceToPaymentMatch!K2:K${ipEnd},">30")`],
        ['Aging 61-90d',        `=COUNTIF(P2P.InvoiceToPaymentMatch!K2:K${ipEnd},">60")`],
        ['Aging 90d+',          `=COUNTIF(P2P.InvoiceToPaymentMatch!K2:K${ipEnd},">90")`],
        ['DPO (Days Payable)',  '=IF(B2>0,B8*B4/B2,0)'],
        ['Current Date',        '=TODAY()'],
    ];

    // ─── P2P.MatchRateSummary ────────────────────────────────────────────
    // ThreeWayMatch: C=confidence(numeric), N=matchStatus
    if (summaryDefs.some(s => s.sheetId === 'P2P.MatchRateSummary')) results['P2P.MatchRateSummary'] = [
        ['Total Match Lines',       `=COUNT(P2P.ThreeWayMatch!C2:C${twEnd})`],
        ['Matched Count',           `=COUNTIF(P2P.ThreeWayMatch!N2:N${twEnd},"MATCH")`],
        ['QTY Exceptions',          `=COUNTIF(P2P.ThreeWayMatch!N2:N${twEnd},"QTY_EXCEPTION")`],
        ['Price Exceptions',        `=COUNTIF(P2P.ThreeWayMatch!N2:N${twEnd},"PRICE_EXCEPTION")`],
        ['Unmatched',               `=COUNTIF(P2P.ThreeWayMatch!N2:N${twEnd},"UNMATCHED")`],
        ['Total Exceptions',        '=B4+B5+B6'],
        ['Match Rate %',            '=IF(B2>0,B3/B2*100,0)'],
    ];

    // ─── P2P.SpendByCategory (by vendor) ─────────────────────────────────
    // POLines: C=vendorId, D=vendorName, I=lineTotal
    // InvoiceLines: C=vendorId, H=lineTotal
    const vendors = [
        ['V-200', 'Acme Fasteners'],
        ['V-301', 'HydraFlow Inc'],
        ['V-150', 'FilterTech Ltd'],
        ['V-410', 'ChemSupply Co'],
    ];
    const spendRows = vendors.map((v, i) => {
        const cellRow = i + 2; // cell ref row (B2, B3, ...)
        return [
            v[0], v[1],
            `=SUMIF(P2P.POLines!C2:C${poEnd},"${v[0]}",P2P.POLines!I2:I${poEnd})`,
            `=SUMIF(P2P.InvoiceLines!C2:C${invEnd},"${v[0]}",P2P.InvoiceLines!H2:H${invEnd})`,
            `=C${cellRow}-D${cellRow}`
        ];
    });
    // Totals row
    const totalRow = vendors.length + 2; // cell ref for the totals row
    spendRows.push([
        'Total', '',
        `=SUM(C2:C${totalRow - 1})`,
        `=SUM(D2:D${totalRow - 1})`,
        `=C${totalRow}-D${totalRow}`
    ]);
    if (summaryDefs.some(s => s.sheetId === 'P2P.SpendByCategory')) results['P2P.SpendByCategory'] = spendRows;

    // Proof log
    const totalFormulas = Object.values(results).reduce((sum, rows) =>
        sum + rows.reduce((rSum, row) => rSum + row.filter(c => typeof c === 'string' && c.startsWith('=')).length, 0), 0);
    RelayLog.info(`[B3-PROOF] buildSummaryData: ${Object.keys(results).length} summary sheets, ${totalFormulas} formula cells (zero JS aggregation)`);

    return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// B2.2 — DETERMINISTIC MATCH BUILDER (pure function)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build match rows from baseline fact sheet data.
 * Pure function: buildMatches(sampleData, moduleDef, options?) → { sheetId: rowArrays }
 * 
 * @param {Object} sampleData — keyed by sheetId, each value is array of row arrays
 * @param {Object} moduleDef — module definition with factSheets + matchSheets
 * @param {Object} [options]
 * @param {Set<string>} [options.dirtySourceSheets] — edited source sheets for dependency-gating
 * @param {string[]} [options.matchSheetIds] — explicit match sheet subset to rebuild
 * @returns {Object} — { 'P2P.ThreeWayMatch': [[...], ...], ... }
 */
export function buildMatches(sampleData, moduleDef, options = {}) {
    const results = {};
    const dirtySourceSheets = options.dirtySourceSheets instanceof Set ? options.dirtySourceSheets : null;
    const explicitMatchSheetIds = Array.isArray(options.matchSheetIds) ? new Set(options.matchSheetIds) : null;
    const matchDefs = moduleDef.matchSheets || [];
    const matchDefById = new Map(matchDefs.map(def => [def.sheetId, def]));

    const shouldRebuildMatch = (matchSheetId) => {
        if (explicitMatchSheetIds && !explicitMatchSheetIds.has(matchSheetId)) {
            return false;
        }
        if (!dirtySourceSheets || dirtySourceSheets.size === 0) {
            return true;
        }
        const def = matchDefById.get(matchSheetId);
        if (!def || !Array.isArray(def.sourceSheets) || def.sourceSheets.length === 0) {
            return true;
        }
        return def.sourceSheets.some(src => dirtySourceSheets.has(src));
    };

    // ─── Index baseline tables by their join keys ────────────────────────
    const poLines = sampleData['P2P.POLines'] || [];
    const grLines = sampleData['P2P.GRLines'] || [];
    const invLines = sampleData['P2P.InvoiceLines'] || [];
    const payLines = sampleData['P2P.PaymentLines'] || [];
    const glLines = sampleData['P2P.GLPostingLines'] || [];

    // Get column indices from schema
    const poSchema = moduleDef.factSheets.find(f => f.sheetId === 'P2P.POLines')?.columns || [];
    const grSchema = moduleDef.factSheets.find(f => f.sheetId === 'P2P.GRLines')?.columns || [];
    const invSchema = moduleDef.factSheets.find(f => f.sheetId === 'P2P.InvoiceLines')?.columns || [];
    const paySchema = moduleDef.factSheets.find(f => f.sheetId === 'P2P.PaymentLines')?.columns || [];
    const glSchema = moduleDef.factSheets.find(f => f.sheetId === 'P2P.GLPostingLines')?.columns || [];

    const colIdx = (schema, id) => schema.findIndex(c => c.id === id);

    const runThreeWay = shouldRebuildMatch('P2P.ThreeWayMatch');
    const runInvoiceToGL = shouldRebuildMatch('P2P.InvoiceToGLMatch');
    const runInvoiceToPayment = shouldRebuildMatch('P2P.InvoiceToPaymentMatch');

    let threeWayRows = [];
    if (runThreeWay) {
        // ─── ThreeWayMatch: join PO ↔ GR ↔ INV by poLineId ──────────────────
        const poByLineId = new Map();
        poLines.forEach(row => {
            const key = row[colIdx(poSchema, 'poLineId')];
            if (key) poByLineId.set(key, row);
        });

        const grByPoLineId = new Map();
        grLines.forEach(row => {
            const key = row[colIdx(grSchema, 'poLineId')];
            if (key) grByPoLineId.set(key, row);
        });

        const invByPoLineId = new Map();
        invLines.forEach(row => {
            const key = row[colIdx(invSchema, 'poLineId')];
            if (key) invByPoLineId.set(key, row);
        });

        let matchCounter = 0;
        for (const [poLineId, poRow] of poByLineId) {
            matchCounter++;
            const grRow = grByPoLineId.get(poLineId);
            const invRow = invByPoLineId.get(poLineId);

            const poQty = poRow[colIdx(poSchema, 'qty')];
            const poPrice = poRow[colIdx(poSchema, 'unitPrice')];
            const grQty = grRow ? grRow[colIdx(grSchema, 'qtyReceived')] : null;
            const grLineId = grRow ? grRow[colIdx(grSchema, 'grLineId')] : '';
            const invQty = invRow ? invRow[colIdx(invSchema, 'qty')] : null;
            const invPrice = invRow ? invRow[colIdx(invSchema, 'unitPrice')] : null;
            const invLineId = invRow ? invRow[colIdx(invSchema, 'invLineId')] : '';

            const qtyVar = invQty !== null ? invQty - poQty : null;
            const priceVar = invPrice !== null ? invPrice - poPrice : null;

            let status = 'UNMATCHED';
            let joinKeyType = 'EXACT';
            let confidence = 1.0;

            if (!grRow && !invRow) {
                status = 'UNMATCHED';
            } else if (!grRow || !invRow) {
                status = 'UNMATCHED';
                confidence = 0.5;
            } else if (qtyVar !== 0 && priceVar !== 0) {
                status = 'QTY_EXCEPTION'; // qty takes priority
            } else if (qtyVar !== 0) {
                status = 'QTY_EXCEPTION';
            } else if (priceVar !== 0) {
                status = 'PRICE_EXCEPTION';
            } else {
                status = 'MATCH';
            }

            const matchId = `3WM-${String(matchCounter).padStart(3, '0')}`;
            threeWayRows.push([
                matchId, joinKeyType, confidence,
                poLineId, grLineId, invLineId,
                poQty, grQty ?? '', invQty ?? '',
                poPrice, invPrice ?? '',
                qtyVar ?? '', priceVar ?? '',
                status
            ]);

            // B2 proof log for mismatches (throttled at scale)
            if (status !== 'MATCHED' && matchCounter <= 20) {
                RelayLog.info(`[B2-PROOF] threeWayMatch mismatch matchId=${matchId} poLineId=${poLineId} grLineId=${grLineId} invLineId=${invLineId} status=${status} qtyVar=${qtyVar ?? 'N/A'} priceVar=${priceVar ?? 'N/A'}`);
            }
        }

        // Add unmatched invoices (no poLineId or poLineId not found)
        invLines.forEach(invRow => {
            const poLineId = invRow[colIdx(invSchema, 'poLineId')];
            if (!poLineId || !poByLineId.has(poLineId)) {
                matchCounter++;
                const matchId = `3WM-${String(matchCounter).padStart(3, '0')}`;
                const invLineId = invRow[colIdx(invSchema, 'invLineId')];
                const invQty = invRow[colIdx(invSchema, 'qty')];
                const invPrice = invRow[colIdx(invSchema, 'unitPrice')];
                threeWayRows.push([
                    matchId, 'EXACT', 1.0,
                    poLineId || '', '', invLineId,
                    '', '', invQty,
                    '', invPrice,
                    '', '',
                    'UNMATCHED'
                ]);
                if (matchCounter <= 20) {
                    RelayLog.info(`[B2-PROOF] threeWayMatch unmatched invoice matchId=${matchId} invLineId=${invLineId} (no PO link)`);
                }
            }
        });

        results['P2P.ThreeWayMatch'] = threeWayRows;
    }

    // Group invoice lines by invId
    const invLinesById = new Map();
    invLines.forEach(row => {
        const invId = row[colIdx(invSchema, 'invId')];
        if (!invLinesById.has(invId)) invLinesById.set(invId, []);
        invLinesById.get(invId).push(row);
    });

    let invGLRows = [];
    if (runInvoiceToGL) {
        // ─── InvoiceToGLMatch: join INV ↔ GL by sourceId (invoice-level) ─────
        // GL lines reference invoices via sourceId column; aggregate per invoice
        const glByInvId = new Map(); // invId → [glRow, ...]
        glLines.forEach(row => {
            const srcType = row[colIdx(glSchema, 'sourceType')];
            const srcId = row[colIdx(glSchema, 'sourceId')];
            if (srcType === 'INV' && srcId) {
                if (!glByInvId.has(srcId)) glByInvId.set(srcId, []);
                glByInvId.get(srcId).push(row);
            }
        });

        let igMatchCounter = 0;
        for (const [invId, invRowGroup] of invLinesById) {
            igMatchCounter++;
            const matchId = `IGL-${String(igMatchCounter).padStart(3, '0')}`;
            // Sum invoice amounts (lineTotal + taxAmount)
            let invTotal = 0;
            const invLineIds = [];
            invRowGroup.forEach(r => {
                invTotal += (r[colIdx(invSchema, 'lineTotal')] || 0) + (r[colIdx(invSchema, 'taxAmount')] || 0);
                invLineIds.push(r[colIdx(invSchema, 'invLineId')]);
            });
            // Find GL AP entry (credit side) for this invoice
            const glEntries = glByInvId.get(invId) || [];
            let glCredit = 0, glDebit = 0;
            const glLineIds = [];
            glEntries.forEach(g => {
                glCredit += g[colIdx(glSchema, 'credit')] || 0;
                glDebit += g[colIdx(glSchema, 'debit')] || 0;
                glLineIds.push(g[colIdx(glSchema, 'glLineId')]);
            });

            const variance = Math.round((invTotal - glCredit) * 100) / 100;
            let status = 'UNMATCHED';
            if (glEntries.length === 0) {
                status = 'UNMATCHED';
            } else if (Math.abs(variance) < 0.01) {
                status = 'MATCH';
            } else {
                status = 'AMOUNT_EXCEPTION';
            }

            invGLRows.push([
                matchId, 'EXACT', 1.0,
                invLineIds.join(';'), glLineIds.join(';'),
                Math.round(invTotal * 100) / 100, glDebit, glCredit,
                variance,
                status
            ]);
        }
        results['P2P.InvoiceToGLMatch'] = invGLRows;
    }

    let invPayRows = [];
    if (runInvoiceToPayment) {
        // ─── InvoiceToPaymentMatch: join INV ↔ PAY by invId ──────────────────
        const payByInvId = new Map();
        payLines.forEach(row => {
            const invId = row[colIdx(paySchema, 'invId')];
            if (invId) {
                if (!payByInvId.has(invId)) payByInvId.set(invId, []);
                payByInvId.get(invId).push(row);
            }
        });

        let ipMatchCounter = 0;
        for (const [invId, invRowGroup] of invLinesById) {
            ipMatchCounter++;
            const matchId = `IPY-${String(ipMatchCounter).padStart(3, '0')}`;
            let invTotal = 0;
            const invLineIds = [];
            invRowGroup.forEach(r => {
                invTotal += (r[colIdx(invSchema, 'lineTotal')] || 0) + (r[colIdx(invSchema, 'taxAmount')] || 0);
                invLineIds.push(r[colIdx(invSchema, 'invLineId')]);
            });

            const payEntries = payByInvId.get(invId) || [];
            let paidTotal = 0;
            const payIds = [];
            payEntries.forEach(p => {
                paidTotal += p[colIdx(paySchema, 'amount')] || 0;
                payIds.push(p[colIdx(paySchema, 'paymentId')]);
            });

            invTotal = Math.round(invTotal * 100) / 100;
            paidTotal = Math.round(paidTotal * 100) / 100;
            const variance = Math.round((invTotal - paidTotal) * 100) / 100;

            let status = 'UNMATCHED';
            if (payEntries.length === 0) {
                status = 'UNMATCHED';
            } else if (Math.abs(variance) < 0.01) {
                status = 'MATCH';
            } else if (paidTotal > invTotal) {
                status = 'OVERPAY';
            } else {
                status = 'PARTIAL';
            }

            // D0.5: Compute aging from dueDate
            const firstInv = invRowGroup[0];
            const dueDateVal = firstInv ? firstInv[colIdx(invSchema, 'dueDate')] : '';
            let ageDays = 0;
            if (dueDateVal) {
                const due = new Date(dueDateVal);
                const now = new Date();
                if (!isNaN(due.getTime())) {
                    ageDays = Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)));
                }
            }

            invPayRows.push([
                matchId, 'EXACT', 1.0,
                invLineIds.join(';'), payIds.join(';'),
                invTotal, paidTotal,
                variance,
                status,
                dueDateVal || '',
                ageDays
            ]);
        }
        results['P2P.InvoiceToPaymentMatch'] = invPayRows;
    }

    // Generic deterministic matcher for non-P2P module sheets.
    // Uses first two source sheets and joinKey from config, and fills configured columns by id.
    const factSchemaBySheetId = new Map((moduleDef.factSheets || []).map(f => [f.sheetId, f.columns || []]));
    const getIdx = (schema, id) => schema.findIndex(c => c.id === id);
    const pickNum = (row, schema, candidates = []) => {
        for (const id of candidates) {
            const idx = getIdx(schema, id);
            if (idx >= 0) {
                const n = Number(row[idx]);
                if (Number.isFinite(n)) return n;
            }
        }
        return null;
    };
    const pad = (n) => String(n).padStart(3, '0');
    for (const matchDef of matchDefs) {
        if (results[matchDef.sheetId]) continue;
        if (!shouldRebuildMatch(matchDef.sheetId)) continue;
        const sourceSheets = Array.isArray(matchDef.sourceSheets) ? matchDef.sourceSheets : [];
        if (sourceSheets.length < 2 || !matchDef.joinKey) {
            results[matchDef.sheetId] = [];
            continue;
        }
        const leftSheetId = sourceSheets[0];
        const rightSheetId = sourceSheets[1];
        const leftRows = sampleData[leftSheetId] || [];
        const rightRows = sampleData[rightSheetId] || [];
        const leftSchema = factSchemaBySheetId.get(leftSheetId) || [];
        const rightSchema = factSchemaBySheetId.get(rightSheetId) || [];
        const leftJoinIdx = getIdx(leftSchema, matchDef.joinKey);
        const rightJoinIdx = getIdx(rightSchema, matchDef.joinKey);
        if (leftJoinIdx < 0 || rightJoinIdx < 0) {
            results[matchDef.sheetId] = [];
            continue;
        }

        const rightByJoin = new Map();
        for (const row of rightRows) {
            const key = row[rightJoinIdx];
            if (key === '' || key === null || key === undefined) continue;
            if (!rightByJoin.has(key)) rightByJoin.set(key, row);
        }

        const rows = [];
        let counter = 0;
        for (const leftRow of leftRows) {
            counter += 1;
            const joinKey = leftRow[leftJoinIdx];
            const rightRow = rightByJoin.get(joinKey);
            const leftQty = pickNum(leftRow, leftSchema, ['plannedQty', 'qty', 'quantity']);
            const rightQty = rightRow ? pickNum(rightRow, rightSchema, ['qtyIssued', 'qty', 'quantity']) : null;
            const variance = (leftQty !== null && rightQty !== null) ? Number((rightQty - leftQty).toFixed(3)) : '';
            const status = !rightRow
                ? 'UNMATCHED'
                : ((leftQty !== null && rightQty !== null && variance === 0) ? 'MATCH' : 'QTY_EXCEPTION');
            const rowObj = {
                matchId: `${String(matchDef.matchClass || 'MT')}-${pad(counter)}`,
                joinKeyType: 'EXACT',
                confidence: rightRow ? 1 : 0.5,
                [matchDef.joinKey]: joinKey ?? '',
                woQty: leftQty ?? '',
                issuedQty: rightQty ?? '',
                variance,
                matchStatus: status
            };
            rows.push((matchDef.columns || []).map(col => (rowObj[col.id] !== undefined ? rowObj[col.id] : '')));
        }
        results[matchDef.sheetId] = rows;
    }

    // Summary proof log
    const rebuilt = Object.keys(results);
    const totalMatches = rebuilt.reduce((sum, sheetId) => sum + (results[sheetId]?.length || 0), 0);
    const exceptions = (runThreeWay ? threeWayRows.filter(r => r[13] !== 'MATCH').length : 0)
        + (runInvoiceToGL ? invGLRows.filter(r => r[9] !== 'MATCH').length : 0)
        + (runInvoiceToPayment ? invPayRows.filter(r => r[8] !== 'MATCH').length : 0)
        + Object.entries(results)
            .filter(([sheetId]) => !sheetId.startsWith('P2P.'))
            .reduce((sum, [, rows]) => sum + rows.filter(r => String(r[r.length - 1] || '') !== 'MATCH').length, 0);
    RelayLog.info(`[B2-PROOF] buildMatches complete: ${totalMatches} match rows, ${exceptions} exceptions/unmatched, rebuilt=${rebuilt.length > 0 ? rebuilt.join(',') : 'none'}`);

    return results;
}

/**
 * Validate a cell value against its column schema.
 * 
 * @param {*} value — the value to validate
 * @param {Object} colSchema — { id, label, type, required }
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateCellValue(value, colSchema) {
    if (!colSchema) return { valid: true, error: null };

    // Required check
    if (colSchema.required && (value === '' || value === null || value === undefined)) {
        return { valid: false, error: `${colSchema.label} is required` };
    }

    // Type check (only for non-empty values)
    if (value !== '' && value !== null && value !== undefined) {
        if (colSchema.type === 'number') {
            const n = Number(value);
            if (!Number.isFinite(n)) {
                return { valid: false, error: `${colSchema.label} must be a number` };
            }
        }
    }

    return { valid: true, error: null };
}

/**
 * Get the column schema for a given sheet and column index.
 * 
 * @param {Object} sheet — tree node (sheet)
 * @param {number} colIdx — 0-based column index
 * @returns {Object|null} — column schema or null
 */
export function getColumnSchema(sheet, colIdx) {
    const schema = sheet?.metadata?.schema;
    if (!Array.isArray(schema)) return null;
    return schema[colIdx] || null;
}
