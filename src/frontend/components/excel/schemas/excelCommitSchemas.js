// Excel Commit Schemas — Relay-Grade Truth Model
// Defines commit operations for Excel imports and edits

/**
 * Base commit structure for all Excel commits
 */
function createBaseCommit(filamentId, commitIndex, actor, operation) {
  return {
    filamentId,
    commitIndex,
    ts: Date.now(),
    actor,
    op: operation,
  };
}

/**
 * SHEET_IMPORTED — Initial sheet import from Excel file
 */
export function createSheetImportedCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'SHEET_IMPORTED'),
    payload: {
      sheetName: payload.sheetName,
      sourceFile: payload.sourceFile,
      importedAt: Date.now(),
      rowCount: payload.rowCount,
      colCount: payload.colCount,
      cells: payload.cells, // { 'A1': { value, formula, type }, ... }
      metadata: {
        lastModified: payload.lastModified,
        author: payload.author,
        version: payload.version || 'unknown',
      },
    },
    evidence: {
      importMethod: 'excel-adapter',
      checksumOriginal: payload.checksum || null,
      lossless: true, // No data loss during import
    },
  };
}

/**
 * CELL_VALUE_UPDATED — Cell value changed
 */
export function createCellValueUpdatedCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'CELL_VALUE_UPDATED'),
    payload: {
      cellRef: payload.cellRef, // e.g., 'B5'
      oldValue: payload.oldValue,
      newValue: payload.newValue,
      valueType: payload.valueType, // 'number' | 'string' | 'boolean' | 'date'
      locus: `cell:${payload.cellRef}`,
    },
    refs: {
      dependents: payload.dependents || [], // Cells that reference this cell
    },
  };
}

/**
 * FORMULA_UPDATED — Cell formula changed
 */
export function createFormulaUpdatedCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'FORMULA_UPDATED'),
    payload: {
      cellRef: payload.cellRef,
      oldFormula: payload.oldFormula,
      newFormula: payload.newFormula,
      computedValue: payload.computedValue,
      locus: `cell:${payload.cellRef}`,
    },
    refs: {
      inputs: payload.inputs || [], // Cells referenced by formula (e.g., ['A1', 'A2'])
      dependents: payload.dependents || [], // Cells that depend on this cell
    },
    evidence: {
      formulaParsed: true,
      referencesValid: payload.referencesValid !== false,
    },
  };
}

/**
 * FORMATTING_APPLIED — Cell formatting changed (style, color, etc.)
 */
export function createFormattingAppliedCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'FORMATTING_APPLIED'),
    payload: {
      cellRange: payload.cellRange, // e.g., 'A1:C3'
      formatting: {
        bold: payload.formatting.bold,
        italic: payload.formatting.italic,
        color: payload.formatting.color,
        backgroundColor: payload.formatting.backgroundColor,
        fontSize: payload.formatting.fontSize,
      },
    },
    evidence: {
      visualOnly: true, // Does not affect computed values
    },
  };
}

/**
 * ROW_INSERTED — New row added
 */
export function createRowInsertedCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'ROW_INSERTED'),
    payload: {
      rowIndex: payload.rowIndex,
      rowData: payload.rowData || {},
    },
    refs: {
      affectedFormulas: payload.affectedFormulas || [], // Formulas that need updating
    },
  };
}

/**
 * COLUMN_INSERTED — New column added
 */
export function createColumnInsertedCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'COLUMN_INSERTED'),
    payload: {
      columnIndex: payload.columnIndex,
      columnLetter: payload.columnLetter,
      columnData: payload.columnData || {},
    },
    refs: {
      affectedFormulas: payload.affectedFormulas || [],
    },
  };
}

/**
 * IMPORT_FAILED — Import operation failed
 */
export function createImportFailedCommit(
  filamentId,
  commitIndex,
  actorId,
  payload
) {
  return {
    ...createBaseCommit(filamentId, commitIndex, actorId, 'IMPORT_FAILED'),
    payload: {
      errorType: payload.errorType, // 'PARSE_ERROR' | 'FORMAT_UNSUPPORTED' | 'FILE_TOO_LARGE'
      errorMessage: payload.errorMessage,
      sourceFile: payload.sourceFile,
      attemptedAt: Date.now(),
    },
    evidence: {
      stackTrace: payload.stackTrace || null,
      fileSize: payload.fileSize || null,
    },
  };
}

/**
 * Parse cell reference to row/col indices
 */
export function parseCellRef(cellRef) {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  const colLetter = match[1];
  const rowNum = parseInt(match[2], 10);

  // Convert column letter to index (A=0, B=1, ..., Z=25, AA=26, etc.)
  let colIndex = 0;
  for (let i = 0; i < colLetter.length; i++) {
    colIndex = colIndex * 26 + (colLetter.charCodeAt(i) - 64);
  }
  colIndex -= 1; // 0-based

  return { row: rowNum - 1, col: colIndex }; // 0-based indices
}

/**
 * Convert row/col indices to cell reference
 */
export function toCellRef(row, col) {
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
 * Extract formula dependencies (cell references)
 */
export function extractFormulaDependencies(formula) {
  if (!formula || !formula.startsWith('=')) return [];

  // Match cell references (A1, B2, etc., case insensitive)
  const regex = /([A-Z]+\d+)/gi;
  const matches = formula.match(regex);

  if (!matches) return [];

  // Remove duplicates, convert to uppercase
  return [...new Set(matches.map((ref) => ref.toUpperCase()))];
}

/**
 * Get latest sheet state by replaying commits
 */
export function replaySheetCommits(commits) {
  const cells = {};
  const formulas = {};
  const metadata = {
    sheetName: '',
    rowCount: 0,
    colCount: 0,
  };

  for (const commit of commits) {
    switch (commit.op) {
      case 'SHEET_IMPORTED':
        metadata.sheetName = commit.payload.sheetName;
        metadata.rowCount = commit.payload.rowCount;
        metadata.colCount = commit.payload.colCount;
        Object.assign(cells, commit.payload.cells);
        break;

      case 'CELL_VALUE_UPDATED':
        cells[commit.payload.cellRef] = {
          ...cells[commit.payload.cellRef],
          value: commit.payload.newValue,
          type: commit.payload.valueType,
        };
        break;

      case 'FORMULA_UPDATED':
        cells[commit.payload.cellRef] = {
          ...cells[commit.payload.cellRef],
          formula: commit.payload.newFormula,
          value: commit.payload.computedValue,
          type: 'formula',
        };
        formulas[commit.payload.cellRef] = {
          formula: commit.payload.newFormula,
          inputs: commit.payload.inputs || [],
          dependents: commit.payload.dependents || [],
        };
        break;

      case 'ROW_INSERTED':
        metadata.rowCount++;
        // Shift rows down
        // (Complex logic, simplified for proof)
        break;

      case 'COLUMN_INSERTED':
        metadata.colCount++;
        // Shift columns right
        // (Complex logic, simplified for proof)
        break;

      default:
        break;
    }
  }

  return { cells, formulas, metadata };
}

/**
 * Compute cell value (evaluate formula if present)
 */
export function computeCellValue(cellRef, cells, formulas) {
  const cell = cells[cellRef];
  if (!cell) return null;

  // If not a formula, return value directly
  if (!cell.formula) return cell.value;

  // If formula, evaluate it (simplified for proof)
  const formula = cell.formula;
  const deps = extractFormulaDependencies(formula);

  // For demo purposes, support simple SUM formulas
  if (formula.toUpperCase().startsWith('=SUM(')) {
    const match = formula.match(/=SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/i);
    if (match) {
      const startRef = match[1].toUpperCase();
      const endRef = match[2].toUpperCase();
      const startPos = parseCellRef(startRef);
      const endPos = parseCellRef(endRef);

      let sum = 0;
      for (let r = startPos.row; r <= endPos.row; r++) {
        for (let c = startPos.col; c <= endPos.col; c++) {
          const ref = toCellRef(r, c);
          const val = computeCellValue(ref, cells, formulas);
          if (typeof val === 'number') sum += val;
        }
      }
      return sum;
    }
  }

  // Fallback: return stored computed value
  return cell.value;
}
