/**
 * EXCEL FILE IMPORTER
 * Handles drag-and-drop Excel file import and conversion to tree structure
 */

import { RelayLog } from '../core/utils/relay-log.js';
import { relayState, setTreeData, setMetadata, resetState } from '../core/models/relay-state.js';
import { SheetGraph } from '../core/models/sheet-graph.js';

export class ExcelImporter {
    constructor(dropZoneId = 'dropZone') {
        this.dropZone = document.getElementById(dropZoneId);
        this.onImportCallback = null;
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
            
            // Convert to tree structure
            const tree = this.createTreeFromWorkbook(workbook, file.name);
            
            // Update state
            resetState();
            setTreeData(tree.nodes, tree.edges);
            setMetadata('filename', file.name);
            setMetadata('importedAt', new Date().toISOString());
            
            // Hide drop zone
            if (this.dropZone) {
                this.dropZone.classList.add('hidden');
            }
            
            // Trigger callback
            if (this.onImportCallback) {
                this.onImportCallback(tree);
            }
            
            RelayLog.info(`✅ Import complete: ${tree.nodes.length} nodes, ${tree.edges.length} edges`);
            
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
            
            const { cells, dims } = this.extractCellsFromWorksheet(worksheet, sheetId);
            const { edges: deps, topoOrder, hasCycle, externalRefs } = this.buildFormulaDAG(cells, sheetId, sheetName);
            
            formulaStats.sheets += 1;
            formulaStats.formulaCells += cells.filter(cell => cell.formula).length;
            formulaStats.edges += deps.length;
            if (hasCycle) formulaStats.cycles += 1;
            formulaStats.externalRefs += externalRefs;
            
            // Create branch (no lat/lon offsets; renderer uses ENU)
            const branch = {
                id: branchId,
                type: 'branch',
                name: `Branch ${sheetName}`,
                lat: trunk.lat,
                lon: trunk.lon,
                alt: 1000,
                parent: trunk.id,
                metadata: { index: i, sheetName }
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
                metadata: {
                    sheetName,
                    rows: dims.rows,
                    cols: dims.cols,
                    deps: { edges: deps, topoOrder },
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
                deps: { edges: deps, topoOrder },
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
        });
        
        RelayLog.info(`✅ Formula graph summary: sheets=${formulaStats.sheets}, formulas=${formulaStats.formulaCells}, edges=${formulaStats.edges}, cycles=${formulaStats.cycles}, externalRefs=${formulaStats.externalRefs}`);
        
        return { nodes, edges };
    }

    extractCellsFromWorksheet(ws, sheetId) {
        const ref = ws && ws['!ref'];
        if (!ref) {
            return { cells: [], dims: { rows: 0, cols: 0 } };
        }
        
        const range = XLSX.utils.decode_range(ref);
        const cells = [];
        const rows = (range.e.r - range.s.r) + 1;
        const cols = (range.e.c - range.s.c) + 1;
        
        for (let r = range.s.r; r <= range.e.r; r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
                const a1 = XLSX.utils.encode_cell({ r, c });
                const cell = ws[a1];
                if (!cell) continue;
                
                const cellId = `${sheetId}.cell.${r}.${c}`;
                cells.push({
                    id: cellId,
                    a1,
                    row: r,
                    col: c,
                    type: cell.t || null,
                    value: cell.v ?? null,
                    display: cell.w ?? null,
                    formula: cell.f ?? null,
                    style: cell.s ?? null
                });
            }
        }
        
        return { cells, dims: { rows, cols } };
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
