/**
 * SHEET GRAPH MODEL
 * Renderer-agnostic workbook representation
 * NO CESIUM IMPORTS ALLOWED (Lock F)
 */

export class SheetGraph {
    constructor(workbookId) {
        this.workbookId = workbookId;
        this.sheets = new Map();
    }

    addSheet(sheetNode) {
        this.sheets.set(sheetNode.sheetId, sheetNode);
    }
}

export function createSheetNode({
    sheetId,
    name,
    dims,
    cells,
    formulas,
    deps,
    cfRules,
    cfStatus
}) {
    return {
        sheetId,
        name,
        dims,
        cells,
        formulas,
        deps,
        cfRules,
        cfStatus
    };
}
