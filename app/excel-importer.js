/**
 * EXCEL FILE IMPORTER
 * Handles drag-and-drop Excel file import and conversion to tree structure
 */

import { RelayLog } from '../core/utils/relay-log.js';
import { relayState, setTreeData, setMetadata, resetState } from '../core/models/relay-state.js';

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
     * Simple implementation: Trunk at Tel Aviv, branches spiral around, sheets attached
     */
    createTreeFromWorkbook(workbook, filename) {
        const nodes = [];
        const edges = [];
        
        // Create trunk (central pillar at Tel Aviv)
        const trunk = {
            id: 'trunk-0',
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
        
        // Create branches and sheets from workbook sheets
        workbook.SheetNames.forEach((sheetName, i) => {
            const angle = (i / workbook.SheetNames.length) * 2 * Math.PI;
            const radius = 0.02; // ~2km
            
            // Branch position
            const branchLat = trunk.lat + radius * Math.cos(angle);
            const branchLon = trunk.lon + radius * Math.sin(angle);
            
            // Create branch
            const branch = {
                id: `branch-${i}`,
                type: 'branch',
                name: `Branch ${i}`,
                lat: branchLat,
                lon: branchLon,
                alt: 1000,
                parent: trunk.id,
                metadata: { index: i }
            };
            nodes.push(branch);
            
            // Edge: trunk → branch
            edges.push({
                source: trunk.id,
                target: branch.id,
                type: 'conduit'
            });
            
            // Create sheet
            const sheet = {
                id: `sheet-${i}`,
                type: 'sheet',
                name: sheetName,
                lat: branchLat,
                lon: branchLon,
                alt: 1000,
                parent: branch.id,
                metadata: { sheetName }
            };
            nodes.push(sheet);
            
            // Edge: branch → sheet
            edges.push({
                source: branch.id,
                target: sheet.id,
                type: 'filament'
            });
        });
        
        return { nodes, edges };
    }
    
    /**
     * Register callback for successful import
     */
    onImport(callback) {
        this.onImportCallback = callback;
    }
}
