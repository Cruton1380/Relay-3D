// Excel Import Adapter — Universal Import Pattern
// Converts Excel files to Relay filaments (lossless)

import {
  createSheetImportedCommit,
  createImportFailedCommit,
} from '../schemas/excelCommitSchemas.js';

/**
 * Excel Import Adapter
 * 
 * Implements the Universal Import pattern:
 * 1. Parse Excel file (any version: .xlsx, .xls, .csv)
 * 2. Extract all data (values, formulas, formatting, metadata)
 * 3. Create filament per sheet
 * 4. Generate SHEET_IMPORTED commit (includes all cells)
 * 5. Return filament(s) ready for rendering
 */
export class ExcelImportAdapter {
  constructor() {
    this.supportedFormats = ['.xlsx', '.xls', '.csv'];
  }

  /**
   * Import Excel file from File object
   * Returns array of filaments (one per sheet)
   */
  async importFile(file) {
    try {
      // Validate file type
      const ext = file.name.toLowerCase().match(/\.\w+$/)?.[0];
      if (!this.supportedFormats.includes(ext)) {
        throw new Error(`Unsupported format: ${ext}`);
      }

      // Read file content
      const arrayBuffer = await file.arrayBuffer();

      // Parse based on format
      let sheets;
      if (ext === '.csv') {
        sheets = await this.parseCSV(arrayBuffer, file.name);
      } else {
        sheets = await this.parseXLSX(arrayBuffer, file.name);
      }

      // Create filament per sheet
      const filaments = sheets.map((sheet, idx) =>
        this.createSheetFilament(sheet, file, idx)
      );

      return {
        success: true,
        filaments,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          sheetCount: sheets.length,
          importedAt: Date.now(),
        },
      };
    } catch (error) {
      console.error('❌ [ExcelImportAdapter] Import failed:', error);
      return {
        success: false,
        error: error.message,
        filament: this.createFailureFilament(file, error),
      };
    }
  }

  /**
   * Parse CSV file (simple format)
   */
  async parseCSV(arrayBuffer, fileName) {
    const text = new TextDecoder().decode(arrayBuffer);
    const lines = text.split(/\r?\n/);

    const cells = {};
    let maxCol = 0;

    lines.forEach((line, rowIdx) => {
      if (!line.trim()) return;

      const values = this.parseCSVLine(line);
      maxCol = Math.max(maxCol, values.length);

      values.forEach((value, colIdx) => {
        const cellRef = this.toCellRef(rowIdx, colIdx);
        cells[cellRef] = this.parseValue(value);
      });
    });

    return [
      {
        name: fileName.replace(/\.\w+$/, ''),
        rowCount: lines.length,
        colCount: maxCol,
        cells,
      },
    ];
  }

  /**
   * Parse XLSX file with SheetJS
   * Extracts ALL sheets with formulas, values, formatting
   */
  async parseXLSX(arrayBuffer, fileName) {
    try {
      // Import SheetJS library
      const XLSX = await import('xlsx');
      
      // Parse workbook
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellFormula: true, cellStyles: true });
      
      console.log(`✅ [ExcelImportAdapter] Parsed workbook: ${workbook.SheetNames.length} sheets`);
      
      // Extract all sheets
      const sheets = workbook.SheetNames.map((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        
        // Extract cells with full metadata
        const cells = {};
        for (let R = range.s.r; R <= range.e.r; R++) {
          for (let C = range.s.c; C <= range.e.c; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = worksheet[cellAddress];
            
            if (cell) {
              cells[cellAddress] = {
                value: cell.v,
                type: cell.t === 'n' ? 'number' : cell.t === 's' ? 'string' : cell.t === 'b' ? 'boolean' : cell.t === 'e' ? 'error' : 'unknown',
                formula: cell.f || null,
                format: cell.z || null,
                row: R,
                col: C,
              };
            }
          }
        }
        
        console.log(`  📄 Sheet "${sheetName}": rows=${range.e.r + 1}, cols=${range.e.c + 1}, cells=${Object.keys(cells).length}`);
        
        return {
          name: sheetName,
          rowCount: range.e.r + 1,
          colCount: range.e.c + 1,
          cells,
        };
      });
      
      return sheets;
    } catch (error) {
      console.error('❌ [ExcelImportAdapter] XLSX parse failed:', error);
      throw error;
    }
  }

  /**
   * Generate mock budget sheet for proof
   */
  generateMockBudgetSheet() {
    return {
      A1: { value: 'Category', type: 'string' },
      B1: { value: 'Q1', type: 'string' },
      C1: { value: 'Q2', type: 'string' },
      D1: { value: 'Q3', type: 'string' },
      E1: { value: 'Q4', type: 'string' },
      F1: { value: 'Total', type: 'string' },

      A2: { value: 'Engineering', type: 'string' },
      B2: { value: 250000, type: 'number' },
      C2: { value: 275000, type: 'number' },
      D2: { value: 300000, type: 'number' },
      E2: { value: 325000, type: 'number' },
      F2: { formula: '=SUM(B2:E2)', value: 1150000, type: 'formula' },

      A3: { value: 'Marketing', type: 'string' },
      B3: { value: 100000, type: 'number' },
      C3: { value: 125000, type: 'number' },
      D3: { value: 150000, type: 'number' },
      E3: { value: 175000, type: 'number' },
      F3: { formula: '=SUM(B3:E3)', value: 550000, type: 'formula' },

      A4: { value: 'Operations', type: 'string' },
      B4: { value: 150000, type: 'number' },
      C4: { value: 160000, type: 'number' },
      D4: { value: 170000, type: 'number' },
      E4: { value: 180000, type: 'number' },
      F4: { formula: '=SUM(B4:E4)', value: 660000, type: 'formula' },

      A5: { value: 'Sales', type: 'string' },
      B5: { value: 200000, type: 'number' },
      C5: { value: 220000, type: 'number' },
      D5: { value: 240000, type: 'number' },
      E5: { value: 260000, type: 'number' },
      F5: { formula: '=SUM(B5:E5)', value: 920000, type: 'formula' },

      A6: { value: 'Total', type: 'string' },
      B6: { formula: '=SUM(B2:B5)', value: 700000, type: 'formula' },
      C6: { formula: '=SUM(C2:C5)', value: 780000, type: 'formula' },
      D6: { formula: '=SUM(D2:D5)', value: 860000, type: 'formula' },
      E6: { formula: '=SUM(E2:E5)', value: 940000, type: 'formula' },
      F6: { formula: '=SUM(F2:F5)', value: 3280000, type: 'formula' },
    };
  }

  /**
   * Create filament from parsed sheet
   */
  createSheetFilament(sheet, file, sheetIndex) {
    const filamentId = `sheet:${file.name.replace(/\.\w+$/, '')}:${sheet.name}`;

    const commit = createSheetImportedCommit(
      filamentId,
      0, // commitIndex
      { kind: 'system', id: 'excel-adapter' },
      {
        sheetName: sheet.name,
        sourceFile: file.name,
        rowCount: sheet.rowCount,
        colCount: sheet.colCount,
        cells: sheet.cells,
        checksum: this.computeChecksum(sheet.cells),
        lastModified: file.lastModified,
        author: 'imported',
      }
    );

    return {
      id: filamentId,
      commits: [commit],
      metadata: {
        sourceFile: file.name,
        sheetName: sheet.name,
        importedAt: Date.now(),
      },
    };
  }

  /**
   * Create failure filament (error is truth)
   */
  createFailureFilament(file, error) {
    const filamentId = `import-failure:${file.name}:${Date.now()}`;

    const commit = createImportFailedCommit(
      filamentId,
      0,
      { kind: 'system', id: 'excel-adapter' },
      {
        errorType: error.name || 'IMPORT_ERROR',
        errorMessage: error.message,
        sourceFile: file.name,
        fileSize: file.size,
        stackTrace: error.stack,
      }
    );

    return {
      id: filamentId,
      commits: [commit],
      metadata: {
        sourceFile: file.name,
        failed: true,
      },
    };
  }

  /**
   * Parse CSV line (handles quoted values)
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  /**
   * Parse value to correct type
   */
  parseValue(value) {
    if (!value || value === '') {
      return { value: '', type: 'empty' };
    }

    // Check if formula
    if (value.startsWith('=')) {
      return { value, formula: value, type: 'formula' };
    }

    // Check if number
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return { value: num, type: 'number' };
    }

    // Check if boolean
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return { value: value.toLowerCase() === 'true', type: 'boolean' };
    }

    // Default to string
    return { value, type: 'string' };
  }

  /**
   * Convert row/col to cell reference (A1, B2, etc.)
   */
  toCellRef(row, col) {
    let colLetter = '';
    let c = col + 1;
    while (c > 0) {
      const remainder = (c - 1) % 26;
      colLetter = String.fromCharCode(65 + remainder) + colLetter;
      c = Math.floor((c - 1) / 26);
    }
    return `${colLetter}${row + 1}`;
  }

  /**
   * Compute simple checksum for cells
   */
  computeChecksum(cells) {
    const str = JSON.stringify(cells);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}

/**
 * Factory function for easy import
 */
export function createExcelImportAdapter() {
  return new ExcelImportAdapter();
}
