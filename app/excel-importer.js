/**
 * EXCEL FILE IMPORTER
 * Handles drag-and-drop Excel file import and conversion to tree structure
 */

import { RelayLog } from '../core/utils/relay-log.js';
import { relayState, setTreeData, setMetadata, resetState, setImportStatus } from '../core/models/relay-state.js';
import { SheetGraph } from '../core/models/sheet-graph.js';

export class ExcelImporter {
    constructor(dropZoneId = 'dropZone') {
        this.dropZone = document.getElementById(dropZoneId);
        this.onImportCallback = null;
    }

    // ─────────────────────────────────────────────────────────────────────
    // D2: Route-bound file adapters (CSV/XLSX -> records -> relayIngestBatch)
    // ─────────────────────────────────────────────────────────────────────

    normalizeTabularRowsFromWorksheet(worksheet, options = {}) {
        if (!worksheet) return [];
        const headerRowIndex = Number.isFinite(Number(options.headerRowIndex))
            ? Number(options.headerRowIndex)
            : 0;
        const rawRows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: true,
            defval: ''
        });
        if (!Array.isArray(rawRows) || rawRows.length === 0) return [];
        const headerRow = rawRows[headerRowIndex] || [];
        const headers = headerRow.map((h, idx) => {
            const value = String(h ?? '').trim();
            return value || `col${idx + 1}`;
        });
        const out = [];
        for (let i = headerRowIndex + 1; i < rawRows.length; i += 1) {
            const row = rawRows[i] || [];
            const rec = {};
            let nonEmpty = false;
            for (let c = 0; c < headers.length; c += 1) {
                const v = row[c];
                if (v !== '' && v !== null && v !== undefined) nonEmpty = true;
                rec[headers[c]] = v ?? '';
            }
            if (nonEmpty) out.push(rec);
        }
        return out;
    }

    parseCsvText(csvText, options = {}) {
        const text = String(csvText ?? '');
        const workbook = XLSX.read(text, {
            type: 'string',
            raw: true
        });
        const sheetName = options.sheetName || workbook.SheetNames?.[0];
        const worksheet = workbook.Sheets?.[sheetName];
        const rows = this.normalizeTabularRowsFromWorksheet(worksheet, options);
        return { rows, sheetName: String(sheetName || ''), workbook };
    }

    parseWorkbookArrayBuffer(arrayBuffer, options = {}) {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = options.sheetName || workbook.SheetNames?.[0];
        const worksheet = workbook.Sheets?.[sheetName];
        const rows = this.normalizeTabularRowsFromWorksheet(worksheet, options);
        return { rows, sheetName: String(sheetName || ''), workbook };
    }

    mapRowsToRouteRecords(rows, options = {}) {
        const sourceRows = Array.isArray(rows) ? rows : [];
        const columnMap = (options.columnMap && typeof options.columnMap === 'object')
            ? options.columnMap
            : null;
        const defaults = (options.defaults && typeof options.defaults === 'object')
            ? options.defaults
            : {};
        return sourceRows.map((src) => {
            const record = {};
            if (columnMap && Object.keys(columnMap).length > 0) {
                for (const [targetField, sourceField] of Object.entries(columnMap)) {
                    record[targetField] = src[sourceField];
                }
            } else {
                for (const [k, v] of Object.entries(src)) {
                    record[k] = v;
                }
            }
            for (const [k, v] of Object.entries(defaults)) {
                if (record[k] === undefined || record[k] === null || record[k] === '') {
                    record[k] = v;
                }
            }
            return record;
        });
    }

    importRowsToRoute(rows, options = {}, ingestBatchFn) {
        const routeId = String(options.routeId || '').trim();
        if (!routeId) {
            return { ok: false, reason: 'MISSING_ROUTE_ID', routeId: '' };
        }
        if (typeof ingestBatchFn !== 'function') {
            return { ok: false, reason: 'MISSING_INGEST_BATCH_FN', routeId };
        }
        const mapped = this.mapRowsToRouteRecords(rows, options);
        const result = ingestBatchFn(routeId, mapped);
        return {
            ok: true,
            routeId,
            mappedRows: mapped.length,
            ingestResult: result,
            records: mapped
        };
    }

    importCsvToRoute(csvText, options = {}, ingestBatchFn) {
        const parsed = this.parseCsvText(csvText, options);
        const imported = this.importRowsToRoute(parsed.rows, options, ingestBatchFn);
        return {
            ...imported,
            sourceType: 'csv',
            sheetName: parsed.sheetName
        };
    }

    importWorkbookToRoute(arrayBuffer, options = {}, ingestBatchFn) {
        const parsed = this.parseWorkbookArrayBuffer(arrayBuffer, options);
        const imported = this.importRowsToRoute(parsed.rows, options, ingestBatchFn);
        return {
            ...imported,
            sourceType: 'xlsx',
            sheetName: parsed.sheetName
        };
    }

    importWorkbookBase64ToRoute(base64, options = {}, ingestBatchFn) {
        const binary = atob(String(base64 || ''));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        return this.importWorkbookToRoute(bytes.buffer, options, ingestBatchFn);
    }
    
    /**
     * Set up drag-and-drop handlers
     */
    setupDragAndDrop() {
        if (!this.dropZone) {
            RelayLog.warn('⚠️ Drop zone element not found');
            return;
        }
        
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.style.borderColor = '#00CED1';
            this.dropZone.style.backgroundColor = 'rgba(0, 206, 209, 0.1)';
        });
        
        this.dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.dropZone.style.borderColor = '#666';
            this.dropZone.style.backgroundColor = 'rgba(0,0,0,0.3)';
        });
        
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.style.borderColor = '#666';
            this.dropZone.style.backgroundColor = 'rgba(0,0,0,0.3)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });
        
        RelayLog.info('📂 Drag-and-drop initialized');
    }
    
    /**
     * Handle dropped file
     */
    async handleFile(file) {
        RelayLog.info(`📂 Importing file: ${file.name}`);
        
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            RelayLog.error('❌ Invalid file type. Please drop an Excel file (.xlsx or .xls)');
            return;
        }
        
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            
            RelayLog.info(`📊 Workbook loaded: ${workbook.SheetNames.length} sheets`);
            RelayLog.info(`[IMP] workbookLoaded sheets=${workbook.SheetNames.length} names=${JSON.stringify(workbook.SheetNames)}`);
            setMetadata('sheetCount', workbook.SheetNames.length);
            
            // Convert to tree structure
            const { tree, sheetSummary } = this.createTreeFromWorkbook(workbook, file.name);

            const useAttachMode = this.shouldAttachToTemplate();
            let attachedToTemplate = false;
            if (useAttachMode) {
                attachedToTemplate = this.attachImportToTemplate(tree);
                if (attachedToTemplate) {
                    RelayLog.info(`[IMP] importMode attachToTemplate=ON`);
                } else {
                    RelayLog.warn('[IMP] attachToTemplate fallback reason=NoTemplateSheets');
                }
            }

            // Update state
            if (!useAttachMode || !attachedToTemplate) {
                resetState();
                setTreeData(tree.nodes, tree.edges);
            }
            setMetadata('filename', file.name);
            setMetadata('importedAt', new Date().toISOString());
            if (sheetSummary) {
                if (useAttachMode && attachedToTemplate) {
                    const expectedCount = sheetSummary.expected;
                    setMetadata('sheetsExpected', expectedCount);
                    setMetadata('sheetsEligible', expectedCount);
                } else {
                    setMetadata('sheetsExpected', sheetSummary.expected);
                    setMetadata('sheetsEligible', sheetSummary.eligible);
                }
                setMetadata('sheetsSkippedHidden', sheetSummary.skippedHidden);
                setMetadata('sheetsSkippedEmpty', sheetSummary.skippedEmpty);
                setMetadata('sheetsSkippedUnsupported', sheetSummary.skippedUnsupported);
                if (sheetSummary.activeSheet) {
                    setMetadata('activeSheet', sheetSummary.activeSheet);
                }
            }
            setImportStatus('OK');
            
            // Hide drop zone
            if (this.dropZone) {
                this.dropZone.classList.add('hidden');
            }
            
            // Trigger callback
            if (this.onImportCallback) {
                const effectiveTree = (useAttachMode && attachedToTemplate)
                    ? { nodes: relayState.tree.nodes, edges: relayState.tree.edges }
                    : tree;
                this.onImportCallback(effectiveTree);
            }
            
            // Disable single-branch proof mode for real imports
            window.SINGLE_BRANCH_PROOF = false;
            
            const effectiveNodes = relayState.tree.nodes.length || tree.nodes.length;
            const effectiveEdges = relayState.tree.edges.length || tree.edges.length;
            RelayLog.info(`✅ Import complete: ${effectiveNodes} nodes, ${effectiveEdges} edges`);
            
        } catch (error) {
            RelayLog.error('❌ Import failed:', error.message);
        }
    }
    
    /**
     * Convert Excel workbook to tree structure
     * Canonical implementation: Trunk anchor + sheet branches (no geo spiral)
     */
    createTreeFromWorkbook(workbook, filename) {
        const nodes = [];
        const edges = [];
        const sheetGraph = new SheetGraph(filename);
        const formulaStats = {
            sheets: 0,
            formulaCells: 0,
            edges: 0,
            cycles: 0,
            externalRefs: 0
        };
        const sheetSummary = {
            expected: 0,
            eligible: 0,
            skippedHidden: 0,
            skippedEmpty: 0,
            skippedUnsupported: 0,
            activeSheet: null
        };
        const workbookSheets = Array.isArray(workbook?.Workbook?.Sheets) ? workbook.Workbook.Sheets : [];
        const hiddenByName = new Map(workbookSheets.map(entry => [entry?.name, entry?.Hidden]));
        
        // Create trunk (central pillar at Tel Aviv)
        const trunk = {
            id: 'trunk.avgol',
            type: 'trunk',
            name: filename,
            lat: 32.0853,
            lon: 34.7818,
            alt: 0,
            height: 2000,
            parent: null,
            metadata: { filename }
        };
        nodes.push(trunk);
        
        // Create branches and sheets from workbook sheets (no geo spiral)
        workbook.SheetNames.forEach((sheetName, i) => {
            const sheetId = `sheet.${sheetName.replace(/\s+/g, '-').toLowerCase()}`;
            const branchId = `branch.${sheetId}`;
            const worksheet = workbook.Sheets[sheetName];
            const hiddenFlag = hiddenByName.get(sheetName);
            if (hiddenFlag) {
                sheetSummary.skippedHidden += 1;
                RelayLog.info(`[IMP] sheet="${sheetName}" ref="${worksheet?.['!ref'] || ''}" keys=0 nonEmpty(v|f)=0 merges=${Array.isArray(worksheet?.['!merges']) ? worksheet['!merges'].length : 0}`);
                return;
            }
            if (!worksheet) {
                sheetSummary.skippedUnsupported += 1;
                RelayLog.info(`[IMP] sheet="${sheetName}" ref="" keys=0 nonEmpty(v|f)=0 merges=0`);
                return;
            }
            
            const allKeys = Object.keys(worksheet).filter(key => !key.startsWith('!'));
            const nonEmpty = allKeys.reduce((count, key) => {
                const cell = worksheet[key];
                const hasValue = cell?.v !== undefined && cell?.v !== null && String(cell.v).trim() !== '';
                const hasFormula = typeof cell?.f === 'string' && cell.f.trim() !== '';
                return count + (hasValue || hasFormula ? 1 : 0);
            }, 0);
            const mergesCount = Array.isArray(worksheet['!merges']) ? worksheet['!merges'].length : 0;
            RelayLog.info(`[IMP] sheet="${sheetName}" ref="${worksheet['!ref'] || ''}" keys=${allKeys.length} nonEmpty(v|f)=${nonEmpty} merges=${mergesCount}`);
            ['A1', 'B2', 'C3', 'E4'].forEach((ref) => {
                const sample = worksheet[ref];
                if (!sample) return;
                const v = sample.v !== undefined ? sample.v : undefined;
                const f = sample.f || '';
                const t = sample.t || '';
                RelayLog.info(`[IMP] sample sheet="${sheetName}" ${ref} v=${JSON.stringify(v)} f=${JSON.stringify(f)} t="${t}"`);
            });
            
            const { cells, dims } = this.extractCellsFromWorksheet(worksheet, sheetId);
            if (!cells || cells.length === 0) {
                sheetSummary.skippedEmpty += 1;
                return;
            }
            const { edges: deps, topoOrder, hasCycle, externalRefs } = this.buildFormulaDAG(cells, sheetId, sheetName);
            
            formulaStats.sheets += 1;
            formulaStats.formulaCells += cells.filter(cell => cell.formula).length;
            formulaStats.edges += deps.length;
            if (hasCycle) formulaStats.cycles += 1;
            formulaStats.externalRefs += externalRefs;
            sheetSummary.eligible += 1;
            if (!sheetSummary.activeSheet) {
                sheetSummary.activeSheet = sheetName;
                RelayLog.info(`[IMP] activeSheet="${sheetName}" reason="firstEligible"`);
            }
            
            // Create branch (no lat/lon offsets; renderer uses ENU)
            const branch = {
                id: branchId,
                type: 'branch',
                name: `Branch ${sheetName}`,
                lat: trunk.lat,
                lon: trunk.lon,
                alt: 1000,
                parent: trunk.id,
                metadata: { index: i, sheetName },
                commits: [
                    { timeboxId: 'IMP-0', commitCount: cells.length, openDrifts: 0, eriAvg: 0, scarCount: 0 }
                ]
            };
            nodes.push(branch);
            
            // Edge: trunk → branch
            edges.push({
                source: trunk.id,
                target: branch.id,
                type: 'conduit'
            });
            
            // Create sheet
            const sheetNode = {
                id: sheetId,
                type: 'sheet',
                name: sheetName,
                lat: trunk.lat,
                lon: trunk.lon,
                alt: 1000,
                parent: branch.id,
                rows: dims.rows,
                cols: dims.cols,
                cellData: cells,
                sheetGraph,
                _importTimeboxId: 'IMP-0',
                metadata: {
                    sheetName,
                    rows: dims.rows,
                    cols: dims.cols,
                    usedRange: worksheet['!ref'] || '',
                    deps: { edges: deps, topoOrder, hasCycle },
                    cfRules: [],
                    cfStatus: 'INDETERMINATE'
                }
            };
            nodes.push(sheetNode);
            
            sheetGraph.addSheet({
                sheetId,
                name: sheetName,
                dims: { rows: dims.rows, cols: dims.cols },
                cells: new Map(cells.map(cell => [cell.id, cell])),
                formulas: new Map(cells.filter(cell => cell.formula).map(cell => [cell.id, { id: cell.id, formula: cell.formula }])),
                deps: { edges: deps, topoOrder, hasCycle },
                cfRules: [],
                cfStatus: 'INDETERMINATE'
            });
            
            // Edge: branch → sheet
            edges.push({
                source: branch.id,
                target: sheetNode.id,
                type: 'filament'
            });
            
            RelayLog.info(`📊 Imported cells for ${sheetName}: ${cells.length}`);
            RelayLog.info(`🧮 Formula cells for ${sheetName}: ${cells.filter(cell => cell.formula).length}`);
            RelayLog.info(`🔗 DAG edges for ${sheetName}: ${deps.length}`);
            RelayLog.info(`[IMP] importTimebox sheet="${sheetName}" timeboxId=IMP-0 cells=${cells.length}`);
        });

        sheetSummary.expected = sheetSummary.eligible;
        RelayLog.info(`[S1] SheetsExpected=${sheetSummary.expected} Eligible=${sheetSummary.eligible} SkippedHidden=${sheetSummary.skippedHidden} SkippedEmpty=${sheetSummary.skippedEmpty} SkippedUnsupported=${sheetSummary.skippedUnsupported}`);
        
        RelayLog.info(`✅ Formula graph summary: sheets=${formulaStats.sheets}, formulas=${formulaStats.formulaCells}, edges=${formulaStats.edges}, cycles=${formulaStats.cycles}, externalRefs=${formulaStats.externalRefs}`);
        
        return { tree: { nodes, edges }, sheetSummary };
    }

    shouldAttachToTemplate() {
        return window.IMPORT_MODE === 'ATTACH_TO_TEMPLATE';
    }

    attachImportToTemplate(importTree) {
        const templateSheets = relayState.tree.nodes.filter(n => n.type === 'sheet');
        const importedSheets = importTree.nodes.filter(n => n.type === 'sheet');
        if (templateSheets.length === 0 || importedSheets.length === 0) {
            return false;
        }

        const count = Math.min(templateSheets.length, importedSheets.length);
        for (let i = 0; i < count; i++) {
            const templateSheet = templateSheets[i];
            const importedSheet = importedSheets[i];

            templateSheet.name = importedSheet.name;
            templateSheet.rows = importedSheet.rows;
            templateSheet.cols = importedSheet.cols;
            templateSheet.cellData = importedSheet.cellData;
            templateSheet.sheetGraph = importedSheet.sheetGraph;
            templateSheet._importTimeboxId = importedSheet._importTimeboxId || 'IMP-0';
            templateSheet.metadata = {
                ...(templateSheet.metadata || {}),
                ...(importedSheet.metadata || {}),
                sheetName: importedSheet.name,
                rows: importedSheet.rows,
                cols: importedSheet.cols
            };
            delete templateSheet._cellIndex;
            delete templateSheet._recentCells;
            delete templateSheet._selectionRange;
            const importTimeboxCount = Array.isArray(importedSheet.cellData)
                ? importedSheet.cellData.filter(cell => (cell.timeboxCount || 0) > 0).length
                : 0;
            RelayLog.info(`[IMP] appliedImportTimebox sheet="${templateSheet.name}" timeboxCount=1 cells=${importTimeboxCount}`);
        }

        if (importedSheets.length > count) {
            RelayLog.warn(`[IMP] attachToTemplate ignoredSheets=${importedSheets.length - count}`);
        }

        return true;
    }

    extractCellsFromWorksheet(ws, sheetId) {
        const ref = ws && ws['!ref'];
        if (!ref) {
            return { cells: [], dims: { rows: 0, cols: 0 } };
        }
        
        const range = XLSX.utils.decode_range(ref);
        const cellMap = new Map();
        const rows = (range.e.r - range.s.r) + 1;
        const cols = (range.e.c - range.s.c) + 1;
        const mergedCells = new Map();
        const merges = Array.isArray(ws['!merges']) ? ws['!merges'] : [];
        const MIN_IMPORT_GRID = 20;
        const importTimeboxes = [{ id: 'IMP-0', idx: 0 }];
        
        for (let r = range.s.r; r <= range.e.r; r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
                const a1 = XLSX.utils.encode_cell({ r, c });
                const cell = ws[a1];
                if (!cell) continue;
                
                const hasValue = cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '';
                const hasFormula = typeof cell.f === 'string' && cell.f.trim() !== '';
                if (!hasValue && !hasFormula) continue;
                
                const cellId = `${sheetId}.cell.${r}.${c}`;
                const displayValue = hasValue ? cell.v : `=${cell.f}`;
                cellMap.set(`${r},${c}`, {
                    id: cellId,
                    a1,
                    row: r,
                    col: c,
                    type: cell.t || null,
                    value: hasValue ? cell.v : null,
                    display: displayValue,
                    formula: hasFormula ? '=' + cell.f : null,
                    style: cell.s ?? null,
                    hasFormula: Boolean(cell.f),
                    timeboxCount: 1,
                    timeboxes: importTimeboxes,
                    historyStatus: 'IMPORTED'
                });
                mergedCells.set(`${r},${c}`, true);
            }
        }

        if (merges.length > 0) {
            let mergesExpanded = 0;
            merges.forEach((merge) => {
                const start = merge.s;
                const end = merge.e;
                const originRef = XLSX.utils.encode_cell({ r: start.r, c: start.c });
                const originCell = ws[originRef];
                if (!originCell) return;
                const hasValue = originCell.v !== undefined && originCell.v !== null && String(originCell.v).trim() !== '';
                const hasFormula = typeof originCell.f === 'string' && originCell.f.trim() !== '';
                if (!hasValue && !hasFormula) return;
                const displayValue = hasValue ? originCell.v : `=${originCell.f}`;
                for (let r = start.r; r <= end.r; r++) {
                    for (let c = start.c; c <= end.c; c++) {
                        const key = `${r},${c}`;
                        if (mergedCells.has(key)) continue;
                        const cellId = `${sheetId}.cell.${r}.${c}`;
                        const a1 = XLSX.utils.encode_cell({ r, c });
                        cellMap.set(`${r},${c}`, {
                            id: cellId,
                            a1,
                            row: r,
                            col: c,
                            type: originCell.t || null,
                            value: hasValue ? originCell.v : null,
                            display: displayValue,
                            formula: null,
                            style: originCell.s ?? null,
                            hasFormula: false,
                            timeboxCount: 1,
                            timeboxes: importTimeboxes,
                            historyStatus: 'IMPORTED',
                            mergedFrom: originRef
                        });
                        mergesExpanded += 1;
                    }
                }
            });
            if (mergesExpanded > 0) {
                RelayLog.info(`[IMP] mergesExpanded=${mergesExpanded}`);
            }
        }

        const paddedRows = Math.max(rows, MIN_IMPORT_GRID);
        const paddedCols = Math.max(cols, MIN_IMPORT_GRID);
        const cells = [];
        for (let r = 0; r < paddedRows; r++) {
            for (let c = 0; c < paddedCols; c++) {
                const key = `${r},${c}`;
                const existing = cellMap.get(key);
                if (existing) {
                    cells.push(existing);
                    continue;
                }
                const a1 = XLSX.utils.encode_cell({ r, c });
                const cellId = `${sheetId}.cell.${r}.${c}`;
                cells.push({
                    id: cellId,
                    a1,
                    row: r,
                    col: c,
                    type: null,
                    value: null,
                    display: '',
                    formula: null,
                    style: null,
                    hasFormula: false,
                    timeboxCount: 1,
                    timeboxes: importTimeboxes,
                    historyStatus: 'IMPORTED_EMPTY'
                });
            }
        }
        
        return { cells, dims: { rows: paddedRows, cols: paddedCols } };
    }

    buildFormulaDAG(cells, sheetId, sheetName) {
        const edges = [];
        const idByA1 = new Map();
        let externalRefs = 0;
        cells.forEach(cell => {
            idByA1.set(`${sheetId}!${cell.a1}`, cell.id);
        });
        
        for (const cell of cells) {
            if (!cell.formula) continue;
            const refs = this.extractFormulaRefs(cell.formula);
            for (const ref of refs) {
                if (ref.sheetName && ref.sheetName !== sheetName) {
                    externalRefs += 1;
                    continue;
                }
                const fromId = idByA1.get(`${sheetId}!${ref.a1}`);
                if (fromId) {
                    edges.push({ from: fromId, to: cell.id });
                }
            }
        }
        
        const { topoOrder, hasCycle } = this.computeTopoOrder(edges);
        if (hasCycle) {
            RelayLog.error('❌ REFUSAL.CYCLE_DETECTED');
        }
        
        return { edges, topoOrder, hasCycle, externalRefs };
    }

    extractFormulaRefs(formula) {
        const refs = new Map();
        const rangeRegex = /(?:([A-Za-z0-9_ ]+)!){0,1}([A-Z]+[0-9]+):([A-Z]+[0-9]+)/g;
        const cellRegex = /(?:([A-Za-z0-9_ ]+)!){0,1}([A-Z]+[0-9]+)/g;
        
        let match = null;
        while ((match = rangeRegex.exec(formula)) !== null) {
            const sheetName = match[1] ? match[1].trim() : null;
            const start = match[2];
            const end = match[3];
            const expanded = this.expandRange(start, end);
            expanded.forEach(a1 => {
                const key = `${sheetName || ''}!${a1}`;
                refs.set(key, { sheetName, a1 });
            });
        }
        
        while ((match = cellRegex.exec(formula)) !== null) {
            const sheetName = match[1] ? match[1].trim() : null;
            const a1 = match[2];
            const key = `${sheetName || ''}!${a1}`;
            refs.set(key, { sheetName, a1 });
        }
        
        return Array.from(refs.values());
    }

    expandRange(start, end) {
        const startCell = XLSX.utils.decode_cell(start);
        const endCell = XLSX.utils.decode_cell(end);
        const refs = [];
        for (let r = startCell.r; r <= endCell.r; r++) {
            for (let c = startCell.c; c <= endCell.c; c++) {
                refs.push(XLSX.utils.encode_cell({ r, c }));
            }
        }
        return refs;
    }

    computeTopoOrder(edges) {
        const graph = new Map();
        const inDegree = new Map();
        edges.forEach(edge => {
            if (!graph.has(edge.from)) graph.set(edge.from, []);
            graph.get(edge.from).push(edge.to);
            inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
            if (!inDegree.has(edge.from)) inDegree.set(edge.from, inDegree.get(edge.from) || 0);
        });
        
        const queue = [];
        for (const [node, degree] of inDegree.entries()) {
            if (degree === 0) queue.push(node);
        }
        
        const topoOrder = [];
        while (queue.length > 0) {
            const node = queue.shift();
            topoOrder.push(node);
            const next = graph.get(node) || [];
            for (const n of next) {
                const nextDegree = (inDegree.get(n) || 0) - 1;
                inDegree.set(n, nextDegree);
                if (nextDegree === 0) queue.push(n);
            }
        }
        
        const hasCycle = topoOrder.length !== inDegree.size && inDegree.size > 0;
        return { topoOrder, hasCycle };
    }
    
    /**
     * Register callback for successful import
     */
    onImport(callback) {
        this.onImportCallback = callback;
    }
}
