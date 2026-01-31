/**
 * EXCEL PARSER
 * 
 * Parses Excel workbooks and creates cell→filament mappings.
 * 
 * CRITICAL: This parser is versioned. Changes to parsing logic require version bump.
 * 
 * Dependencies: xlsx (SheetJS)
 */

import * as XLSX from 'xlsx';

/**
 * Parse Excel file
 * 
 * @param arrayBuffer File content
 * @param baseMetadata Base file metadata
 * @returns ParseResult
 */
export async function parseExcelFile(arrayBuffer, baseMetadata) {
  try {
    // 1. Parse workbook
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // 2. Extract sheets
    const sheets = [];
    
    workbook.SheetNames.forEach((sheetName, sheetIndex) => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Get sheet range
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      // Extract cells
      const cells = [];
      
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          
          if (cell) {
            cells.push({
              address: cellAddress,
              row,
              col,
              value: cell.v,
              type: cell.t, // n=number, s=string, b=boolean, d=date, e=error
              formula: cell.f || null,
              format: cell.z || null,
            });
          }
        }
      }
      
      sheets.push({
        name: sheetName,
        index: sheetIndex,
        range: {
          startRow: range.s.r,
          endRow: range.e.r,
          startCol: range.s.c,
          endCol: range.e.c,
        },
        cellCount: cells.length,
        cells,
      });
    });
    
    // 3. Create cell→filament mapping placeholders
    const cellMappings = [];
    
    sheets.forEach(sheet => {
      sheet.cells.forEach(cell => {
        // Each cell can potentially map to a filament endpoint
        // For now, create placeholder mappings
        cellMappings.push({
          sheetName: sheet.name,
          cellAddress: cell.address,
          row: cell.row,
          col: cell.col,
          // These will be filled in when user selects a cell:
          mappedFilamentId: null,
          mappedCommitIndex: null,
          mappingType: 'placeholder', // placeholder | value | formula | range
        });
      });
    });
    
    // 4. Extract summary statistics
    const summary = {
      sheetCount: sheets.length,
      totalCells: sheets.reduce((sum, sheet) => sum + sheet.cellCount, 0),
      sheetNames: sheets.map(s => s.name),
    };
    
    return {
      semanticContent: {
        workbook: {
          sheetCount: workbook.SheetNames.length,
          sheets,
        },
        cellMappings,
      },
      summary,
    };
    
  } catch (error) {
    console.error('[ExcelParser] Parse failed:', error);
    
    // Return minimal evidence (no semantic extraction)
    return {
      semanticContent: null,
      summary: null,
      error: error.message,
    };
  }
}

/**
 * Get cell value by address
 */
export function getCellValue(semanticContent, sheetName, cellAddress) {
  if (!semanticContent?.workbook?.sheets) return null;
  
  const sheet = semanticContent.workbook.sheets.find(s => s.name === sheetName);
  if (!sheet) return null;
  
  const cell = sheet.cells.find(c => c.address === cellAddress);
  return cell?.value || null;
}

/**
 * Map cell to filament endpoint
 */
export function mapCellToFilament(cellMappings, sheetName, cellAddress, filamentId, commitIndex) {
  const mapping = cellMappings.find(
    m => m.sheetName === sheetName && m.cellAddress === cellAddress
  );
  
  if (!mapping) {
    throw new Error(`Cell mapping not found: ${sheetName}!${cellAddress}`);
  }
  
  mapping.mappedFilamentId = filamentId;
  mapping.mappedCommitIndex = commitIndex;
  mapping.mappingType = 'value'; // Can be extended to 'formula', 'range', etc.
  
  return mapping;
}

/**
 * Get 2D grid for sheet (for rendering)
 */
export function getSheetGrid(semanticContent, sheetName) {
  if (!semanticContent?.workbook?.sheets) return null;
  
  const sheet = semanticContent.workbook.sheets.find(s => s.name === sheetName);
  if (!sheet) return null;
  
  const grid = [];
  
  for (let row = sheet.range.startRow; row <= sheet.range.endRow; row++) {
    const rowData = [];
    
    for (let col = sheet.range.startCol; col <= sheet.range.endCol; col++) {
      const cell = sheet.cells.find(c => c.row === row && c.col === col);
      rowData.push(cell ? cell.value : null);
    }
    
    grid.push(rowData);
  }
  
  return {
    sheetName,
    range: sheet.range,
    grid,
  };
}
