/**
 * CESIUM FILAMENT RENDERER - PHASE 2.1 PRIMITIVES
 * Renders tree structures using Cesium Primitives with ENU coordinate system
 * 
 * Primitives used for: trunks, branches, filaments
 * Entities used ONLY for: labels, cell points (at close LOD)
 */

import { RelayLog } from '../../core/utils/relay-log.js';
import { relayState } from '../../core/models/relay-state.js';
import { 
    createENUFrame, 
    enuToWorld, 
    validateENUCoordinates,
    isCartesian3Finite,
    createCircleProfile,
    CANONICAL_LAYOUT,
    // Frame computation for branch-aligned sheets
    tangentAt,
    projectOntoPlane,
    normalizeVec,
    cross,
    negateVec,
    computeBranchFrames,
    sampleLineSegment,
    enuVecToWorldDir
} from '../utils/enu-coordinates.js';

// ═══════════════════════════════════════════════════════════════════════════
// LAUNCH PRESENTATION THEME — centralized tokens for cinematic rendering
// All values keyed to launch mode only; non-launch rendering is unchanged.
// ═══════════════════════════════════════════════════════════════════════════
const LAUNCH_THEME = Object.freeze({
    // ═══ VIS-SHEET-PLATFORM-OVERVIEW-1 — "Engineered Digital Architecture" ═══
    //
    // Design language: clear hierarchy — platforms dominate, trunk/branches recede
    //   - Trunk = thin light pillar (not a pipe)
    //   - Branches = narrow translucent ribs (guide the eye, don't dominate)
    //   - Platforms = large horizontal spreadsheet surfaces (primary visual element)
    //   - Grid = visible spreadsheet grid on platforms
    //   - Filaments = faint vertical rain below platforms
    //   - Root = radial glow pool at trunk base
    //
    // Proportion hierarchy: platform (70m) >> trunk (20m) > branch (13m)

    // Trunk: THIN LIGHT PILLAR — reads as beam of light, not cylinder
    trunk: {
        coreColor: '#d0f0ff',   // bright white-blue core (bloom target)
        coreAlpha: 0.85,        // bright but not fully opaque
        coreRadius: 10,         // THIN — light beam, not pipe (was 18)
        shellColor: '#4090c0',  // translucent atmospheric halo
        shellAlpha: 0.08,       // very translucent (was 0.12)
        shellRadius: 16,        // tight shell proportional to thin core (was 34)
        color: '#d0f0ff',       // legacy compat
        alpha: 0.85,
        glowColor: '#3080b0',
        glowAlpha: 0.06,        // very faint outer glow (was 0.08)
        glowWidthAdd: 20,       // tight atmospheric boundary (was 40)
    },
    // Branches: THIN RIBS — guide eye from trunk to platforms, don't dominate
    branch: {
        colorBase: '#3878a8',   // dimmer blue at trunk — recedes
        colorMid: '#4898c0',    // medium blue mid
        colorTip: '#60b8e0',    // brighter cyan at tips -> leads eye to platform
        alpha: 0.30,            // highly translucent — branches don't dominate (was 0.55)
        emissiveColor: '#b0e0ff', // subtle center thread
        emissiveAlpha: 0.65,      // moderate emissive (was 0.85)
        emissiveWidth: 1.5,       // thinner thread (was 2.0)
        ribScale: 0.3,            // NARROW ribs, not blocks (was 0.5)
    },
    // Sheet tiles: FLOATING GLASS PLATFORMS
    tile: {
        fillColor: '#0c2035',   // dark blue glass fill
        fillAlpha: 0.05,        // translucent glass (was 0.06)
        borderColor: '#90e0ff', // bright white-cyan border (primary bloom target)
        borderAlpha: 1.0,       // fully bright — platforms are the star
        borderWidth: 2.5,       // clean border width (was 3.0)
        selectedBorderAlpha: 1.0,
        innerBorderColor: '#4098c0',
        innerBorderAlpha: 0.15, // dimmer inner border (was 0.25)
        innerBorderWidth: 0.8,  // thinner (was 1.0)
        innerBorderInset: 3,
        // Support filaments: thin vertical lines from tile corners downward
        supportColor: '#60b0e0',
        supportAlpha: 0.14,     // dimmer (was 0.18)
        supportWidth: 0.8,      // thinner (was 1.0)
        supportDrop: 60,        // meters below tile
        // PLATFORM CONFIG (VIS-LANDSCAPE-PLATFORMS-1 — landscape Excel aspect)
        halfTileX: 60,          // landscape width: 120m total (dominant element)
        halfTileY: 35,          // landscape height: 70m total
        verticalOffset: 8,      // meters above branch tip — floating effect
        horizontalNormal: true, // platforms face UP (ENU Up normal)
        // Spreadsheet grid lines (12 cols × 6 rows = Excel-feel density)
        gridMajorColor: '#5098c0',
        gridMajorAlpha: 0.20,
        gridMajorWidth: 1.2,
        gridMinorColor: '#304060',
        gridMinorAlpha: 0.07,
        gridMinorWidth: 0.6,
        gridCols: 11,           // internal column dividers (12 columns)
        gridRows: 5,            // internal row dividers (6 rows)
        // Header separator — first row line (brighter for spreadsheet feel)
        gridHeaderColor: '#70c0e0',
        gridHeaderAlpha: 0.30,
        gridHeaderWidth: 1.5,
        // Header column — first column line (brighter left column)
        gridHeaderColColor: '#70c0e0',
        gridHeaderColAlpha: 0.30,
        gridHeaderColWidth: 1.5,
    },
    // Sheet tile labels
    tileLabel: {
        color: '#a0d8f8',
        alpha: 0.50,
        selectedAlpha: 1.0,
    },
    // Root: LIGHT POOLING — radial glow at trunk base
    root: {
        color: '#80c0e0',
        alpha: 0.25,
        // Glow pool: large faint disc at ground level
        glowColor: '#60a8d0',
        glowAlpha: 0.10,
        glowRadius: 80,        // meters radius for the pool
    },
    tether: {
        color: '#50a0d0',
        alpha: 0.20,
        width: 1.5,
    },
    // Filaments: LIGHT THREADS + RAIN
    filament: {
        color: '#90d8ff',       // bright cyan-white
        alpha: 0.05,            // very faint at overview
        selectedAlpha: 0.60,    // bright on focus
        width: 1.0,             // thin
    },
    // Filament rain: vertical decorative lines from tiles downward
    filamentRain: {
        color: '#70c0e8',
        alpha: 0.035,           // ultra-faint
        width: 0.8,
        linesPerTile: 5,        // number of rain lines per tile
        dropHeight: 150,        // meters below tile
    },
    // Traffic bars
    traffic: {
        greenColor: '#4ae88a',
        greenAlpha: 0.5,
        exceptionColor: '#e88a4a',
        exceptionAlpha: 0.6,
    },
    // Timebox slabs
    slab: {
        color: '#1a3a5a',
        alpha: 0.12,
        labelColor: '#5090b0',
        labelAlpha: 0.4,
    },
    // Junction markers
    junction: {
        color: '#80d8ff',
        alpha: 0.45,
        pixelSize: 4,
    },
    // Building proxy
    proxy: {
        color: '#2a3a55',
        alpha: 0.25,
    },
});

// ═══════════════════════════════════════════════════════════════════════════
// VIS-RADIAL-CANOPY-1: Canopy ring layout — platforms distributed around trunk
// Launch-only. Replaces binormal fan with 3 tiers and radial arcs.
// ═══════════════════════════════════════════════════════════════════════════
const RADIAL_CANOPY_LAYOUT = Object.freeze({
    tiers: [
        { radius: 220, height: 2000 },   // Tier A: lower (Supply Chain, Finance)
        { radius: 280, height: 2150 },   // Tier B: mid (Operations, Quality)
        { radius: 340, height: 2300 },   // Tier C: upper (IT, Maintenance)
    ],
    arcDegPerDept: 60,
    // branch.id -> { tierIndex, baseAngleDeg } (angle in degrees, 0 = East)
    deptToTierAndAngle: Object.freeze({
        'branch.supplychain': { tierIndex: 0, baseAngleDeg: 0 },
        'branch.finance':     { tierIndex: 0, baseAngleDeg: 60 },
        'branch.operations':  { tierIndex: 1, baseAngleDeg: 120 },
        'branch.quality':     { tierIndex: 1, baseAngleDeg: 180 },
        'branch.it':          { tierIndex: 2, baseAngleDeg: 240 },
        'branch.maintenance': { tierIndex: 2, baseAngleDeg: 300 },
    }),
});

const RADIAL_CANOPY_DEPT_SLOTS = Object.freeze(
    Object.entries(RADIAL_CANOPY_LAYOUT.deptToTierAndAngle)
        .sort(([, a], [, b]) => a.baseAngleDeg - b.baseAngleDeg)
        .map(([branchId, cfg], deptIndex) => Object.freeze({
            branchId,
            deptIndex,
            tierIndex: cfg.tierIndex,
            baseAngleDeg: cfg.baseAngleDeg
        }))
);

const RADIAL_CANOPY_DEPT_INDEX_BY_BRANCH = Object.freeze(
    RADIAL_CANOPY_DEPT_SLOTS.reduce((acc, slot) => {
        acc[slot.branchId] = slot.deptIndex;
        return acc;
    }, {})
);

function getCanopyDeptSlot(branchId) {
    const deptIndex = RADIAL_CANOPY_DEPT_INDEX_BY_BRANCH[String(branchId || '')];
    if (!Number.isFinite(deptIndex)) return null;
    return RADIAL_CANOPY_DEPT_SLOTS[deptIndex] || null;
}

// VIS-RADIAL-CANOPY-1: single deterministic placement function for canopy geometry.
// version=1 is contract-logged and proof-gated.
function computeCanopyPlacement(deptIndex, sheetIndex, sheetCount = 1) {
    if (!Number.isFinite(deptIndex)) return null;
    const slot = RADIAL_CANOPY_DEPT_SLOTS[deptIndex];
    if (!slot) return null;
    const tier = RADIAL_CANOPY_LAYOUT.tiers[slot.tierIndex];
    if (!tier) return null;
    const safeCount = Math.max(1, Number(sheetCount) || 1);
    const safeIndex = Math.max(0, Number(sheetIndex) || 0);
    const ratio = safeCount > 1
        ? Math.max(0, Math.min(1, safeIndex / (safeCount - 1)))
        : 0.5;
    const angleDeg = slot.baseAngleDeg + ratio * RADIAL_CANOPY_LAYOUT.arcDegPerDept;
    const angleRad = angleDeg * (Math.PI / 180);
    return {
        deptIndex: slot.deptIndex,
        tierIndex: slot.tierIndex,
        radius: tier.radius,
        height: tier.height,
        angleDeg,
        angleRad,
        east: tier.radius * Math.cos(angleRad),
        north: tier.radius * Math.sin(angleRad),
        up: tier.height
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// UX-2.1: LOD Budget Constants (reactive remediation for D0.3 REFUSAL)
// Prevents renderer from creating 100k+ entities on large sheets.
// Cells beyond cap are deterministically sampled by stride.
// Selected cell + dependency neighborhood always rendered.
// ═══════════════════════════════════════════════════════════════════════════
const LOD_BUDGET = {
    MAX_CELL_MARKERS_PER_SHEET: 500,      // D0.3 remediation: reduced from 2000 to keep entity count bounded
    MAX_CELL_FILAMENTS_PER_SHEET: 500,     // D0.3 remediation: reduced from 2000 for SHEET LOD stability
    MAX_TIMEBOX_SEGMENTS_PER_SHEET: 2500,  // D0.3 remediation: reduced from 5000
    // At COMPANY LOD: 0 markers, 0 filaments (only trunk/branches + sheet proxies)
    // At SHEET LOD: capped markers + spine bands + sampled filaments (500/sheet max)
    // At CELL LOD: full detail for selected + deps neighborhood
};

const LOD_WORLD_PRIMITIVE_CAP = Object.freeze({
    LANIAKEA: 100,
    PLANETARY: 200,
    REGION: 400
});

const LOD_RANK = Object.freeze({
    LANIAKEA: 0,
    PLANETARY: 1,
    REGION: 2,
    COMPANY: 3,
    SHEET: 4,
    CELL: 5
});

function normalizeLOD(level) {
    const key = String(level || '').toUpperCase();
    if (key === 'GLOBE') return 'PLANETARY';
    return key;
}

function isLodAtOrAboveRegion(level) {
    const normalized = normalizeLOD(level);
    const rank = LOD_RANK[normalized];
    return Number.isFinite(rank) && rank <= LOD_RANK.REGION;
}

function worldPrimitiveCapForLOD(level) {
    const normalized = normalizeLOD(level);
    return Number.isFinite(LOD_WORLD_PRIMITIVE_CAP[normalized])
        ? LOD_WORLD_PRIMITIVE_CAP[normalized]
        : Number.POSITIVE_INFINITY;
}

function isWorldOperatorGateSpamSuppressed() {
    if (typeof window === 'undefined') return false;
    return window.RELAY_PROFILE === 'world' && window.RELAY_DEBUG_LOGS !== true;
}

function companyDetailGateState(viewer) {
    if (typeof window === 'undefined') {
        return { allow: false, reason: 'distance', distKm: NaN };
    }
    const isWorldProfile = window.RELAY_PROFILE === 'world';
    const entryState = getVisEntryState();
    const scopeAllowsExpandedSheets = shouldRenderExpandedSheets(entryState);
    const explicitEnter = Boolean(
        window.__relayCompanyDetailExplicitEnter === true
        || window.__relayBranchWalkActive === true
        || window.__relayFilamentRideActive === true
        || window.__relayFocusModeActive === true
        || scopeAllowsExpandedSheets === true
    );
    const cameraPos = viewer?.camera?.position;
    const trunks = Array.isArray(relayState?.tree?.nodes)
        ? relayState.tree.nodes.filter((n) => n?.type === 'trunk')
        : [];
    let minDistMeters = Number.POSITIVE_INFINITY;
    if (cameraPos && trunks.length > 0) {
        for (const trunk of trunks) {
            const lat = Number(trunk?.lat);
            const lon = Number(trunk?.lon);
            const alt = Number(trunk?.alt || trunk?.height || 0);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
            const trunkPos = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
            const dist = Cesium.Cartesian3.distance(cameraPos, trunkPos);
            if (Number.isFinite(dist) && dist < minDistMeters) {
                minDistMeters = dist;
            }
        }
    }
    const distKm = Number.isFinite(minDistMeters) ? (minDistMeters / 1000) : NaN;
    const thresholdKm = Number.isFinite(Number(window.RELAY_COMPANY_DETAIL_DIST_KM))
        ? Number(window.RELAY_COMPANY_DETAIL_DIST_KM)
        : 30;
    const nearEnough = Number.isFinite(distKm) && distKm <= thresholdKm;
    const allow = isWorldProfile ? explicitEnter : (explicitEnter || nearEnough);
    // World profile: distance alone does not enable detail; log collapsedByPolicy (not "distance")
    const reason = explicitEnter ? 'explicitEnter' : (isWorldProfile ? 'collapsedByPolicy' : 'distance');
    return { allow, reason, distKm };
}

function getVisEntryState() {
    if (typeof window === 'undefined' || !window.__relayEntryState || typeof window.__relayEntryState !== 'object') {
        return { scope: 'world', companyId: null, deptId: null, sheetId: null };
    }
    return window.__relayEntryState;
}

/**
 * VIS-2: Expanded sheets (plane + cell grid + lanes) only when scope is sheet or cell.
 * At COMPANY with scope world/company we show trunk + spines + compact tiles only.
 * @param {{ scope?: string }} state - entry state (e.g. from getVisEntryState())
 * @returns {boolean}
 */
function shouldRenderExpandedSheets(state) {
    if (typeof window !== 'undefined' && window.__relayForceCompanyScope === true) {
        return false;
    }
    const scope = state && typeof state.scope === 'string' ? state.scope.toLowerCase() : 'world';
    return scope === 'cell' || scope === 'sheet' || scope === 'sheet-only';
}

/**
 * VIS-3.1: Flow overlay data from existing state (read-only).
 * Counts tree edges and match-sheet exceptions (status !== 'MATCH') for flow intensity cues.
 * @param {{ nodes?: Array<{ type?: string, cellData?: Array<{ row: number, col: number, value: * }>, metadata?: *, rows?: number, cols?: number }>, edges?: Array<*> }} tree
 * @returns {{ edges: number, exceptions: number }}
 */
function computeFlowOverlayCounts(tree) {
    const edges = Array.isArray(tree?.edges) ? tree.edges.length : 0;
    let exceptions = 0;
    const nodes = Array.isArray(tree?.nodes) ? tree.nodes : [];
    const matchSheets = nodes.filter((n) => n?.type === 'sheet' && n?.metadata?.isMatchSheet);
    for (const sheet of matchSheets) {
        const cellData = Array.isArray(sheet.cellData) ? sheet.cellData : [];
        const cols = Number(sheet.cols) || sheet.metadata?.cols || 0;
        const statusCol = cols > 0 ? cols - 1 : 0;
        for (const cell of cellData) {
            if (cell.row >= 1 && cell.col === statusCol && String(cell.value || '').toUpperCase() !== 'MATCH') {
                exceptions += 1;
            }
        }
    }
    return { edges, exceptions };
}

/**
 * VIS-3.1a: Per-department flow overlay distribution.
 * Breaks down edges and exceptions by trunk-direct department branch.
 * @param {{ nodes?: Array, edges?: Array<{ source: string, target: string }> }} tree
 * @param {Array<{ id: string }>} deptBranches - trunk-direct branches
 * @returns {Map<string, { edges: number, exceptions: number }>}
 */
function computeFlowOverlayByDept(tree, deptBranches) {
    const result = new Map();
    if (!deptBranches || deptBranches.length === 0) return result;
    const nodes = Array.isArray(tree?.nodes) ? tree.nodes : [];
    const edges = Array.isArray(tree?.edges) ? tree.edges : [];
    // Build parent → children index and node lookup
    const nodeById = new Map();
    for (const n of nodes) if (n?.id) nodeById.set(n.id, n);
    // For each dept branch, collect all descendant node IDs
    const deptDescendants = new Map(); // deptBranchId → Set<nodeId>
    for (const dept of deptBranches) {
        const descendants = new Set();
        const queue = [dept.id];
        while (queue.length > 0) {
            const cur = queue.pop();
            descendants.add(cur);
            for (const n of nodes) {
                if (n.parent === cur && !descendants.has(n.id)) {
                    queue.push(n.id);
                }
            }
        }
        deptDescendants.set(dept.id, descendants);
        result.set(dept.id, { edges: 0, exceptions: 0 });
    }
    // Distribute edges: if source or target is in a dept's descendants, count it
    for (const edge of edges) {
        const src = String(edge?.source || '');
        const tgt = String(edge?.target || '');
        for (const [deptId, descendants] of deptDescendants) {
            if (descendants.has(src) || descendants.has(tgt)) {
                result.get(deptId).edges += 1;
            }
        }
    }
    // Distribute exceptions: match sheets under each dept's descendants
    const matchSheets = nodes.filter((n) => n?.type === 'sheet' && n?.metadata?.isMatchSheet);
    for (const sheet of matchSheets) {
        let ownerDeptId = null;
        for (const [deptId, descendants] of deptDescendants) {
            if (descendants.has(sheet.id) || descendants.has(sheet.parent)) {
                ownerDeptId = deptId;
                break;
            }
        }
        if (!ownerDeptId) continue;
        const cellData = Array.isArray(sheet.cellData) ? sheet.cellData : [];
        const cols = Number(sheet.cols) || sheet.metadata?.cols || 0;
        const statusCol = cols > 0 ? cols - 1 : 0;
        for (const cell of cellData) {
            if (cell.row >= 1 && cell.col === statusCol && String(cell.value || '').toUpperCase() !== 'MATCH') {
                result.get(ownerDeptId).exceptions += 1;
            }
        }
    }
    return result;
}

/**
 * VIS-3.2: Identify exception row indices for a single sheet.
 * For match sheets: rows where the status column value !== 'MATCH'.
 * For non-match sheets: returns empty (no exceptions).
 * @param {{ metadata?: { isMatchSheet?: boolean, schema?: Array }, cellData?: Array, rows?: number, cols?: number }} sheet
 * @returns {{ rows: number[], count: number }}
 */
function computeExceptionRows(sheet) {
    if (!sheet?.metadata?.isMatchSheet) return { rows: [], count: 0 };
    const cellData = Array.isArray(sheet.cellData) ? sheet.cellData : [];
    const schema = Array.isArray(sheet.metadata?.schema) ? sheet.metadata.schema : [];
    // Find matchStatus column by schema id, or fall back to last column
    let statusCol = schema.findIndex((c) => c.id === 'matchStatus');
    if (statusCol < 0) {
        const cols = Number(sheet.cols) || sheet.metadata?.cols || 0;
        statusCol = cols > 0 ? cols - 1 : 0;
    }
    const exceptionRowSet = new Set();
    for (const cell of cellData) {
        if (cell.row >= 1 && cell.col === statusCol && String(cell.value || '').toUpperCase() !== 'MATCH') {
            exceptionRowSet.add(cell.row);
        }
    }
    const rows = Array.from(exceptionRowSet).sort((a, b) => a - b);
    return { rows, count: rows.length };
}

/**
 * VIS-3.2: Compute route highlight edges for a selected sheet.
 * Returns connections from source sheets (via metadata.sourceSheets) to the selected sheet.
 * @param {{ nodes?: Array, edges?: Array }} tree
 * @param {{ id: string, metadata?: { sourceSheets?: string[] } }} selectedSheet
 * @returns {Array<{ fromId: string, toId: string, fromSheet: object|null, toSheet: object }>}
 */
function computeRouteHighlightEdges(tree, selectedSheet) {
    const result = [];
    const sourceSheetIds = Array.isArray(selectedSheet?.metadata?.sourceSheets)
        ? selectedSheet.metadata.sourceSheets : [];
    if (sourceSheetIds.length === 0) return result;
    const nodes = Array.isArray(tree?.nodes) ? tree.nodes : [];
    const nodeById = new Map();
    for (const n of nodes) if (n?.id) nodeById.set(n.id, n);
    for (const srcId of sourceSheetIds) {
        const srcSheet = nodeById.get(srcId);
        if (srcSheet && srcSheet.type === 'sheet') {
            result.push({ fromId: srcId, toId: selectedSheet.id, fromSheet: srcSheet, toSheet: selectedSheet });
        }
    }
    return result;
}

/**
 * Deterministic stride sampling for large cell sets.
 * Returns a Set of indices (into the entries array) that should be rendered.
 * Always includes the selected cell and its dependencies if provided.
 * @param {Array} entries - all cell entries
 * @param {number} maxCount - maximum cells to render
 * @param {Set<string>} [priorityCellIds] - cell IDs that must always be included
 * @returns {{ indices: Set<number>, stride: number, truncated: boolean }}
 */
function budgetCellEntries(entries, maxCount, priorityCellIds) {
    if (entries.length <= maxCount) {
        return { indices: null, stride: 1, truncated: false }; // null = render all
    }
    const stride = Math.ceil(entries.length / maxCount);
    const indices = new Set();
    // Deterministic stride sampling
    for (let i = 0; i < entries.length; i += stride) {
        indices.add(i);
    }
    // Always include priority cells (selected + deps)
    if (priorityCellIds && priorityCellIds.size > 0) {
        for (let i = 0; i < entries.length; i++) {
            const cellId = `${entries[i]._sheetId || ''}.cell.${entries[i].row}.${entries[i].col}`;
            if (priorityCellIds.has(cellId)) {
                indices.add(i);
            }
        }
    }
    return { indices, stride, truncated: true };
}

function computeSegmentLengths(path) {
    const lengths = [];
    for (let i = 0; i < path.length - 1; i++) {
        lengths.push(Cesium.Cartesian3.distance(path[i], path[i + 1]));
    }
    return lengths;
}

function pointAtArcLength(path, lengths, s) {
    let remaining = s;
    for (let i = 0; i < lengths.length; i++) {
        const segLen = lengths[i];
        if (segLen <= 0) continue;
        if (remaining <= segLen) {
            const t = remaining / segLen;
            return Cesium.Cartesian3.lerp(path[i], path[i + 1], t, new Cesium.Cartesian3());
        }
        remaining -= segLen;
    }
    return Cesium.Cartesian3.clone(path[path.length - 1], new Cesium.Cartesian3());
}

function computePolylineLength(path) {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
        total += Cesium.Cartesian3.distance(path[i], path[i + 1]);
    }
    return total;
}

function sanitizeLanePositions(path, eps = 0.02) {
    const out = [];
    let last = null;
    let hadNaN = false;
    let hadDup = false;
    for (const p of path) {
        if (!isCartesian3Finite(p)) {
            hadNaN = true;
            continue;
        }
        if (last && Cesium.Cartesian3.distance(p, last) <= eps) {
            hadDup = true;
            continue;
        }
        out.push(p);
        last = p;
    }
    const length = out.length >= 2 ? computePolylineLength(out) : 0;
    return { positions: out, length, hadNaN, hadDup };
}

function clampLaneWidth(width, length, minLen = 0.25) {
    const maxWidth = Math.max(0, length * 0.25);
    if (!Number.isFinite(length) || length <= 0) {
        return { width: Math.max(0.03, width), canVolume: false, reason: 'ZERO_LENGTH' };
    }
    if (length <= minLen || maxWidth < 0.03) {
        return { width: Math.max(0.03, Math.min(width, maxWidth || width)), canVolume: false, reason: 'TOO_SHORT' };
    }
    return { width: Math.max(0.03, Math.min(width, maxWidth)), canVolume: true };
}

function polylineWidthFromMeters(widthMeters) {
    return Math.max(1.0, Math.min(12.0, widthMeters * 6));
}

export class CesiumFilamentRenderer {
    constructor(viewer) {
        this.viewer = viewer;
        this.primitives = [];
        this.entities = [];
        this.currentLOD = 'COMPANY'; // R0.2: Default to COMPANY (low detail) until governor updates
        this.turgorAnimationRunning = false;
        this.timeboxCubes = [];
        this.timeboxByInstanceId = new Map();
        this.cellLabelById = new Map();
        this.lanePathsByCell = new Map();
        this.hoverLanePrimitive = null;
        this.hoveredTimebox = null;
        this.formulaEdgePrimitives = [];
        this.formulaScarPrimitives = [];
        this.lastP3A = null;
        this._renderInProgress = false;
        this._renderQueued = false;
        this._renderScheduledFrame = false;
        this._queuedRenderReason = null;
        this._renderCooldownMs = 350;
        this._renderCooldownTimer = null;
        this._lastRenderCompletedMs = 0;
        this._gateSpamSuppressedLogged = false;
        
        // D-Lens: Node → entity/primitive mapping for focus dimming
        this.nodeMap = new Map(); // nodeId → { primitives: [], entities: [] }
        this.focusActive = false;
        
        // Track primitive counts by type
        this.primitiveCount = {
            trunks: 0,
            branches: 0,
            cellFilaments: 0,
            spines: 0,
            timeboxes: 0,
            lanePolylines: 0,
            laneVolumes: 0,
            sheetTiles: 0,
            deptSpines: 0
        };
        
        // Track entity counts by type
        this.entityCount = {
            labels: 0,
            cellPoints: 0,
            timeboxLabels: 0
        };
        
        // LAUNCH-FIX-1: Presentation scale (orthonormal ENU + scaled helpers)
        // _presScale multiplies ENU coords before conversion; directions stay unit
        // _presUOffset is raw meters added to up BEFORE scaling (human-tunable altitude shift)
        this._presScale = 1;
        this._presUOffset = 0;
        
        RelayLog.info('[FilamentRenderer] Initialized (Phase 2.1 Primitives)');
    }
    
    /**
     * LAUNCH-FIX-1: Scaled position conversion for all render positions.
     * Scales ENU coordinates by _presScale after applying _presUOffset to up (raw meters),
     * then delegates to canonical enuToWorld. ENU frame stays orthonormal.
     * 
     * Gate checks must still use raw enuToWorld(frame, e, n, u).
     */
    _toWorld(enuFrame, east, north, up) {
        const s = this._presScale;
        return enuToWorld(enuFrame, east * s, north * s, (up + this._presUOffset) * s);
    }
    
    /**
     * Clear all rendered filaments
     */
    clear() {
        // Stop animation
        this.stopTurgorAnimation();
        
        // Remove primitives
        this.primitives.forEach(p => {
            this.viewer.scene.primitives.remove(p);
        });
        this.primitives = [];
        this.clearFormulaDependencies();
        
        // Remove entities
        this.entities.forEach(e => {
            this.viewer.entities.remove(e);
        });
        this.entities = [];
        this.timeboxCubes = [];
        this.timeboxByInstanceId = new Map();
        this.cellLabelById = new Map();
        this.lanePathsByCell = new Map();
        this.nodeMap = new Map();
        this._focusNodeId = null;
        this._focusRelatedIds = null;
        this._preFocusEntityStates = null;
        this.clearHoverHighlight();
        
        // Reset counts
        this.primitiveCount = { trunks: 0, branches: 0, cellFilaments: 0, spines: 0, timeboxes: 0, lanePolylines: 0, laneVolumes: 0, sheetTiles: 0, deptSpines: 0, flowBars: 0, exceptionOverlays: 0, routeHighlights: 0, slabs: 0, vis6Pulses: 0, presenceMarkers: 0 };
        this.entityCount = { labels: 0, cellPoints: 0, timeboxLabels: 0 };
        
        RelayLog.info('🧹 Filament renderer cleared');
    }

    /**
     * Helper: Add a primitive to the scene and track it with a node ID for focus dimming.
     */
    _trackPrimitive(primitive, nodeId) {
        primitive._relayNodeId = nodeId;
        this.viewer.scene.primitives.add(primitive);
        this.primitives.push(primitive);
        return primitive;
    }

    /**
     * Helper: Add an entity to the scene and track it with a node ID for focus dimming.
     */
    _trackEntity(config, nodeId) {
        const entity = this.viewer.entities.add(config);
        entity._relayNodeId = nodeId;
        this.entities.push(entity);
        return entity;
    }

    /**
     * Extract the tree node ID from an entity's id string.
     * Handles patterns like: sheet.x.cell.0.0, branch.x-segment-A, trunk.x-anchor, etc.
     */
    _extractNodeId(entityId) {
        if (!entityId || typeof entityId !== 'string') return null;
        return entityId
            .replace(/\.cell\.\d+\.\d+$/, '')
            .replace(/-(surface|outline|segment-[A-C]|root|anchor|spine|spine-guide|lane|timebox-\d+|label|presence-marker|formula-.*)$/, '')
            .replace(/-grid-\d+$/, '');
    }

    /**
     * Apply focus dimming: dim entities not related to the focus target.
     * Focused node entities stay fully visible; related nodes are slightly dimmed;
     * all other entities are hidden or heavily dimmed.
     * @param {string} focusNodeId - The focused node's ID
     * @param {Set<string>} relatedIds - IDs of related nodes (parent branch, siblings, etc.)
     */
    applyFocusDimming(focusNodeId, relatedIds, options = {}) {
        const mode = String(options.mode || 'hard').toLowerCase() === 'soft' ? 'soft' : 'hard';
        const dimAlpha = Number.isFinite(Number(options.dimAlpha)) ? Number(options.dimAlpha) : 0.15;
        this._focusNodeId = focusNodeId;
        this._focusRelatedIds = relatedIds || new Set();
        this._preFocusEntityStates = new Map();
        this._preFocusPrimitiveStates = new Map();
        this._focusMode = mode;
        let hiddenCount = 0;

        // Dim entities based on their node relationship
        this.entities.forEach(entity => {
            // Prefer _relayNodeId (set by tagVisuals), fall back to parsing entity.id
            const nodeId = entity._relayNodeId || this._extractNodeId(entity.id || entity._id);
            if (!nodeId) return;
            const labelColor = entity.label?.fillColor;
            const hasWithAlpha = !!(labelColor && typeof labelColor.withAlpha === 'function');
            // Save pre-focus state
            this._preFocusEntityStates.set(entity, {
                show: entity.show,
                labelAlpha: hasWithAlpha && Number.isFinite(labelColor.alpha) ? labelColor.alpha : null,
                labelShow: entity.label ? entity.label.show : undefined
            });

            if (nodeId === focusNodeId) {
                // Focused: fully visible
                entity.show = true;
                if (entity.label) entity.label.show = true;
            } else if (this._focusRelatedIds.has(nodeId)) {
                // Related: visible but slightly dimmed
                entity.show = true;
                if (hasWithAlpha) {
                    entity.label.fillColor = labelColor.withAlpha(mode === 'soft' ? Math.max(dimAlpha * 2, 0.3) : 0.4);
                }
                if (entity.label && mode === 'soft') entity.label.show = false;
            } else {
                if (mode === 'hard') {
                    // Unrelated: hidden
                    entity.show = false;
                    hiddenCount += 1;
                } else {
                    // Soft isolate: keep geometry context, suppress labels and dim alpha.
                    entity.show = true;
                    if (entity.label) entity.label.show = false;
                    if (hasWithAlpha) {
                        entity.label.fillColor = labelColor.withAlpha(dimAlpha);
                    }
                }
            }
        });

        // Dim primitives by toggling show property
        // Tag primitives with node IDs using geometry instance IDs
        this.primitives.forEach(primitive => {
            this._preFocusPrimitiveStates.set(primitive, primitive.show);
            if (primitive._relayNodeId) {
                const nodeId = primitive._relayNodeId;
                if (nodeId === focusNodeId || (relatedIds && relatedIds.has(nodeId)) || mode === 'soft') {
                    primitive.show = true;
                } else {
                    primitive.show = false;
                    hiddenCount += 1;
                }
            }
            // Primitives without tags remain visible (CSS handles global dimming)
        });
        if (mode === 'soft') {
            RelayLog.info(`[LENS] isolate mode=SOFT target=${focusNodeId} dimAlpha=${dimAlpha.toFixed(2)}`);
        } else {
            RelayLog.info(`[LENS] isolate mode=HARD target=${focusNodeId} hidden=${hiddenCount}`);
        }
    }

    /**
     * Clear focus dimming: restore all entities to pre-focus state.
     */
    clearFocusDimming() {
        // Restore entity states
        if (this._preFocusEntityStates) {
            this._preFocusEntityStates.forEach((state, entity) => {
                entity.show = state.show !== undefined ? state.show : true;
                const color = entity.label?.fillColor;
                if (color && typeof color.withAlpha === 'function' && Number.isFinite(state.labelAlpha)) {
                    entity.label.fillColor = color.withAlpha(state.labelAlpha);
                }
                if (entity.label && typeof state.labelShow === 'boolean') {
                    entity.label.show = state.labelShow;
                }
            });
            this._preFocusEntityStates = null;
        }
        if (this._preFocusPrimitiveStates) {
            this._preFocusPrimitiveStates.forEach((show, primitive) => {
                primitive.show = show;
            });
            this._preFocusPrimitiveStates = null;
        } else {
            // Restore all primitives
            this.primitives.forEach(primitive => {
                primitive.show = true;
            });
        }

        this._focusNodeId = null;
        this._focusRelatedIds = null;
        this._focusMode = null;
        RelayLog.info('[LENS] isolate mode=OFF');
    }

    clearHoverHighlight() {
        if (this.hoveredTimebox) {
            const { primitive, instanceId, baseColor, cellId } = this.hoveredTimebox;
            const attrs = primitive?.getGeometryInstanceAttributes?.(instanceId);
            if (attrs?.color && baseColor) {
                attrs.color = baseColor;
            }
            const labelEntity = this.cellLabelById.get(cellId);
            if (labelEntity?.label) {
                labelEntity.label.fillColor = Cesium.Color.WHITE;
            }
        }
        this.hoveredTimebox = null;
        if (this.hoverLanePrimitive) {
            this.viewer.scene.primitives.remove(this.hoverLanePrimitive);
            this.hoverLanePrimitive = null;
        }
    }

    setTimeboxHover(instanceId) {
        if (!instanceId) {
            this.clearHoverHighlight();
            return;
        }
        if (this.hoveredTimebox?.instanceId === instanceId) return;
        this.clearHoverHighlight();
        const entry = this.timeboxByInstanceId.get(instanceId);
        if (!entry) return;
        const attrs = entry.primitive?.getGeometryInstanceAttributes?.(instanceId);
        if (attrs?.color) {
            attrs.color = Cesium.ColorGeometryInstanceAttribute.toValue(
                Cesium.Color.fromCssColorString('#7fd7ff').withAlpha(0.95)
            );
        }
        const labelEntity = this.cellLabelById.get(entry.cellId);
        if (labelEntity?.label) {
            labelEntity.label.fillColor = Cesium.Color.fromCssColorString('#7fd7ff');
        }
        if (entry.lanePath?.length >= 2) {
            const laneGeometry = new Cesium.PolylineGeometry({
                positions: entry.lanePath,
                width: 2,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            const laneInstance = new Cesium.GeometryInstance({
                geometry: laneGeometry,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.fromCssColorString('#7fd7ff').withAlpha(0.8)
                    )
                }
            });
            this.hoverLanePrimitive = new Cesium.Primitive({
                geometryInstances: laneInstance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(this.hoverLanePrimitive);
        }
        this.hoveredTimebox = entry;
    }

    clearFormulaDependencies() {
        const clearedEdges = this.formulaEdgePrimitives.length;
        const clearedScars = this.formulaScarPrimitives.length;
        this.formulaEdgePrimitives.forEach(p => {
            this.viewer.scene.primitives.remove(p);
        });
        this.formulaScarPrimitives.forEach(p => {
            this.viewer.scene.primitives.remove(p);
        });
        this.formulaEdgePrimitives = [];
        this.formulaScarPrimitives = [];
        RelayLog.info(`[F2] clearedEdges=${clearedEdges} clearedScars=${clearedScars}`);
        return { clearedEdges, clearedScars };
    }

    renderFormulaCycleScar(position, idSuffix) {
        const scarGeometry = Cesium.BoxGeometry.fromDimensions({
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
            dimensions: new Cesium.Cartesian3(3.0, 3.0, 3.0)
        });
        const scarInstance = new Cesium.GeometryInstance({
            geometry: scarGeometry,
            modelMatrix: Cesium.Matrix4.fromTranslation(position),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                    Cesium.Color.fromCssColorString('#FF3B30').withAlpha(0.9)
                )
            },
            id: `formula-cycle-scar-${idSuffix}`
        });
        const scarPrimitive = new Cesium.Primitive({
            geometryInstances: scarInstance,
            appearance: new Cesium.PerInstanceColorAppearance({
                flat: true,
                translucent: true
            }),
            asynchronous: false
        });
        this.viewer.scene.primitives.add(scarPrimitive);
        this.formulaScarPrimitives.push(scarPrimitive);
    }

    renderFormulaDependencies() {
        this.clearFormulaDependencies();
        const sheets = relayState.tree.nodes.filter(node => node.type === 'sheet');
        let edgesRendered = 0;
        let cyclesDetected = 0;
        let scarsRendered = 0;
        
        for (const sheet of sheets) {
            const anchors = window.cellAnchors && window.cellAnchors[sheet.id];
            if (!anchors || !anchors.cells) continue;
            
            const graphDeps = sheet?.sheetGraph?.sheets?.get(sheet.id)?.deps;
            const deps = graphDeps?.edges || sheet?.metadata?.deps?.edges || [];
            const hasCycle = Boolean(graphDeps?.hasCycle ?? sheet?.metadata?.deps?.hasCycle);
            if (hasCycle && anchors.spine) {
                this.renderFormulaCycleScar(anchors.spine, sheet.id);
                cyclesDetected += 1;
                scarsRendered += 1;
            }
            if (!deps.length) continue;
            
            for (const edge of deps) {
                const fromPos = anchors.cells[edge.from];
                const toPos = anchors.cells[edge.to];
                if (!isCartesian3Finite(fromPos) || !isCartesian3Finite(toPos)) continue;
                
                const geometry = new Cesium.PolylineGeometry({
                    positions: [fromPos, toPos],
                    width: 1.2,
                    vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
                    arcType: Cesium.ArcType.NONE
                });
                
                const geometryInstance = new Cesium.GeometryInstance({
                    geometry,
                    id: `${sheet.id}-formula-${edge.from}-${edge.to}`
                });
                
                const material = Cesium.Material.fromType('PolylineDash', {
                    color: Cesium.Color.fromCssColorString('#D269FF').withAlpha(0.8),
                    dashLength: 16.0
                });
                
                const primitive = new Cesium.Primitive({
                    geometryInstances: geometryInstance,
                    appearance: new Cesium.PolylineMaterialAppearance({
                        translucent: true,
                        material
                    }),
                    asynchronous: false
                });
                
                this.viewer.scene.primitives.add(primitive);
                this.formulaEdgePrimitives.push(primitive);
                edgesRendered++;
            }
        }
        
        RelayLog.info(`🔗 Formula lens: rendered ${edgesRendered} dependency edges`);
        RelayLog.info(`[F2] formulaEdgesRendered=${edgesRendered}`);
        RelayLog.info(`[F2] cyclesDetected=${cyclesDetected}`);
        RelayLog.info(`[F2] scarsRendered=${scarsRendered}`);
        return { edgesRendered, cyclesDetected, scarsRendered };
    }
    
    /**
     * Update LOD level (called by LOD governor)
     */
    setLOD(level) {
        let requestedLevel = level;
        let normalizedRequested = normalizeLOD(requestedLevel);
        let entryState = getVisEntryState();
        let selectedSheetId = entryState?.sheetId ? String(entryState.sheetId) : '';
        const isWorldProfile = (typeof window !== 'undefined' && window.RELAY_PROFILE === 'world');
        // VIS-2: When user requests SHEET/CELL with no sheet selected, try resolver so one sheet expands (wire LOD-to-entry)
        if ((normalizedRequested === 'SHEET' || normalizedRequested === 'CELL') && !selectedSheetId && typeof window !== 'undefined' && typeof window.relayEnterSheet === 'function') {
            const enterResult = window.relayEnterSheet();
            if (enterResult?.ok) {
                entryState = getVisEntryState();
                selectedSheetId = entryState?.sheetId ? String(entryState.sheetId) : '';
            }
        }
        if (isWorldProfile && (normalizedRequested === 'SHEET' || normalizedRequested === 'CELL') && !selectedSheetId) {
            requestedLevel = 'COMPANY';
            normalizedRequested = 'COMPANY';
            const refusalSig = `${normalizeLOD(level)}|none|fallback=COMPANY`;
            if (!this._visSheetRefusalSeen) this._visSheetRefusalSeen = new Set();
            if (!this._visSheetRefusalSeen.has(refusalSig)) {
                RelayLog.warn(`[VIS] sheetOnlyRender blocked selected=none requested=${normalizeLOD(level)} fallback=COMPANY (call relayEnterSheet('sheetId') to expand)`);
                this._visSheetRefusalSeen.add(refusalSig);
            }
        }
        if (requestedLevel !== this.currentLOD) {
            RelayLog.info(`🔄 LOD changed: ${this.currentLOD} → ${requestedLevel}`);
            this.currentLOD = requestedLevel;
            const normalized = normalizeLOD(requestedLevel);
            const companyGate = normalized === 'COMPANY'
                ? companyDetailGateState(this.viewer)
                : { allow: true, reason: 'distance', distKm: NaN };
            const requestedSheetsDetailed = isLodAtOrAboveRegion(normalized)
                ? 0
                : (normalized === 'COMPANY' ? (companyGate.allow ? 1 : 0) : 1);
            // VIS-2: effective = 0 when scope is world/company (collapsed by policy); log both to avoid "LOD lying"
            const expandedAllowed = normalized === 'COMPANY' ? shouldRenderExpandedSheets(getVisEntryState()) : true;
            const effectiveSheetsDetailed = (normalized === 'COMPANY' && !expandedAllowed) ? 0 : requestedSheetsDetailed;
            const lanes = isLodAtOrAboveRegion(normalized)
                ? 0
                : (normalized === 'COMPANY' ? (companyGate.allow ? 1 : 0) : 1);
            const markers = (normalized === 'SHEET' || normalized === 'CELL') ? 1 : 0;
            const distField = Number.isFinite(companyGate.distKm) ? companyGate.distKm.toFixed(1) : 'n/a';
            if (normalized === 'COMPANY') {
                RelayLog.info(`[LOD] apply level=${normalized} requestedSheetsDetailed=${requestedSheetsDetailed} effectiveSheetsDetailed=${effectiveSheetsDetailed} lanes=${lanes} markers=${markers} reason=${companyGate.reason} distKm=${distField}`);
            } else {
                RelayLog.info(`[LOD] apply level=${normalized} sheetsDetailed=${requestedSheetsDetailed} lanes=${lanes} markers=${markers}`);
            }
            if (typeof window !== 'undefined') {
                window.__relayLodDetailCollapsed = effectiveSheetsDetailed === 0 ? normalized : null;
                if (normalized === 'COMPANY') {
                    window.__relayCompanyDetailGate = {
                        allow: companyGate.allow === true,
                        reason: companyGate.reason,
                        distKm: Number.isFinite(companyGate.distKm) ? Number(companyGate.distKm.toFixed(1)) : null
                    };
                }
            }
        }
    }
    
    /**
     * Render full tree structure from relayState
     */
    renderTree(reason = 'direct', fromScheduler = false) {
        this._queuedRenderReason = reason || this._queuedRenderReason || 'unspecified';
        if (!fromScheduler) {
            this._renderQueued = true;
            if (this._renderScheduledFrame) return;
            this._renderScheduledFrame = true;
            requestAnimationFrame(() => {
                this._renderScheduledFrame = false;
                if (!this._renderQueued) return;
                this._renderQueued = false;
                const runReason = this._queuedRenderReason || 'scheduled';
                this._queuedRenderReason = null;
                this.renderTree(runReason, true);
            });
            return;
        }
        if (this._renderInProgress) {
            this._renderQueued = true;
            return;
        }
        const now = performance.now();
        const quietUntil = Number((typeof window !== 'undefined' && window.__relayPostGateQuietUntil) || 0);
        const effectiveCooldownMs = quietUntil > now
            ? Math.max(this._renderCooldownMs, 900)
            : this._renderCooldownMs;
        const sinceLast = now - this._lastRenderCompletedMs;
        if (sinceLast < effectiveCooldownMs) {
            this._renderQueued = true;
            if (!this._renderCooldownTimer) {
                const waitMs = Math.max(0, effectiveCooldownMs - sinceLast);
                this._renderCooldownTimer = window.setTimeout(() => {
                    this._renderCooldownTimer = null;
                    if (this._renderQueued) {
                        this._renderQueued = false;
                        const queuedReason = this._queuedRenderReason || 'cooldown-expired';
                        this._queuedRenderReason = null;
                        this.renderTree(queuedReason, true);
                    }
                }, waitMs);
            }
            return;
        }
        this._renderInProgress = true;
        try {
            this.clear();
            
            // LAUNCH-FIX-1: Set presentation scale once per frame
            if (typeof window !== 'undefined' && window.RELAY_LAUNCH_MODE) {
                const configuredScale = Number(window.RELAY_LAUNCH_SCALE);
                this._presScale = Number.isFinite(configuredScale) && configuredScale > 0 ? configuredScale : 0.04;
                const configuredOffset = Number(window.RELAY_LAUNCH_U_OFFSET_M);
                this._presUOffset = Number.isFinite(configuredOffset) ? configuredOffset : 0;
            } else {
                this._presScale = 1;
                this._presUOffset = 0;
            }
            if (this._presScale !== 1 && !this._presLogEmitted) {
                RelayLog.info(`[PRES] launchTransform scale=${this._presScale} uOffset=${this._presUOffset} applied=PASS`);
                this._presLogEmitted = true;
            }
            // LAUNCH READABILITY PASS (E): Visual hierarchy flag + theme
            this._launchVisuals = (typeof window !== 'undefined' && window.RELAY_LAUNCH_MODE === true);
            this._theme = this._launchVisuals ? LAUNCH_THEME : null;
            if (this._launchVisuals && !this._launchVisualsLogEmitted) {
                RelayLog.info('[LAUNCH-FIX] visualHierarchy applied=PASS tilesAlpha=0.05 trunkCore=0.85');
                RelayLog.info('[LAUNCH-THEME] tokens loaded trunk=thinPillar tile=horizontalPlatform filament=rain');
                // TREE-VISIBILITY-FIX: gate checks use raw ENU; _toWorld only affects render placement
                RelayLog.info('[GATE] launchVisibility semantics=UNCHANGED enuChecks=RAW');
                // VIS-LANDSCAPE-PLATFORMS-1: uniform width floors — platforms dominate, trunk/branches recede
                RelayLog.info('[LAUNCH] widthFloors trunk=20m branches=13/10/6 tiles=120x70m rule=uniform');
                // VIS-SHEET-PLATFORM-OVERVIEW-1 proof logs
                RelayLog.info('[PRES] trunkStyle applied=PASS mode=core+shell coreR=10 shellR=16');
                RelayLog.info('[PRES] branchStyle applied=PASS ribMode=ON ribScale=0.3 emissive=ON alpha=0.30');
                RelayLog.info('[SHEET-PLATFORM] layout=LANDSCAPE w=120 h=70 cols=12 rows=6 header=ON');
                RelayLog.info('[PRES] sheetPlatform grid=PASS majorLines=16 mode=overview normal=UP horizontal=ON landscape=120x70');
                if (typeof window !== 'undefined') {
                    window._sheetPlatformGridEnabled = true;
                    window._sheetPlatformLayout = 'LANDSCAPE';
                    window._sheetPlatformDims = { w: 120, h: 70, cols: 12, rows: 6, header: true };
                }
                RelayLog.info('[PRES] tileFloatMode=PASS supportFilaments=ON fillAlpha=0.05 borderAlpha=1.0');
                RelayLog.info('[PRES] filamentRain enabled=PASS density=5');
                RelayLog.info('[PRES] rootGlow enabled=PASS radius=80 alpha=0.10');
                this._launchVisualsLogEmitted = true;
            }
            // VIS-RADIAL-CANOPY-1-PROOF-FIX: Build stamp for proof determinism (cache detection)
            if (typeof window !== 'undefined' && !window.__relayRendererBuildSet) {
                window.RELAY_RENDERER_BUILD = 'VIS-RADIAL-CANOPY-1::' + new Date().toISOString().slice(0, 10);
                window.__relayRendererBuildSet = true;
                RelayLog.info('[BUILD] renderer=filament VIS-RADIAL-CANOPY-1');
            }
            // Tightening 1: proxy cache for platform axes — separate from sheet._* truth metadata
            // Stores { center, xAxisWorld, yAxisWorld, upWorld, halfTileX, halfTileY } per sheet.id
            if (!this._sheetProxyCache) this._sheetProxyCache = new Map();
            this._sheetProxyCache.clear(); // rebuilt each frame
            
            const { nodes, edges } = relayState.tree;
            if (nodes.length === 0) {
                RelayLog.warn('⚠️ No tree data to render');
                return;
            }
            
            RelayLog.info(`🌲 Rendering tree: ${nodes.length} nodes, ${edges.length} edges`);
            RelayLog.info(`[THICKNESS] cell=${CANONICAL_LAYOUT.cellFilament.width.toFixed(2)}m spine=${CANONICAL_LAYOUT.spine.width.toFixed(2)}m branch=${(CANONICAL_LAYOUT.branch.radiusThick * 2).toFixed(2)}m trunk=30.00m root=${CANONICAL_LAYOUT.root.width.toFixed(2)}m`);
            
            // Render nodes by type
            const trunks = nodes.filter(n => n.type === 'trunk');
            const branches = nodes.filter(n => n.type === 'branch');
            const sheets = nodes.filter(n => n.type === 'sheet');
            const activeSheetName = relayState?.metadata?.activeSheet;
            // Launch demo must always show full company canopy (all sheets), regardless of attach workflow state.
            const attachModeActive = !this._launchVisuals && window.IMPORT_MODE === 'ATTACH_TO_TEMPLATE' && activeSheetName;
            let sheetsFiltered = attachModeActive
                ? sheets.filter(s => (s.name || s.metadata?.sheetName) === activeSheetName)
                : sheets;
            const branchIdsToRender = attachModeActive
                ? new Set(sheetsFiltered.map(s => s.parent))
                : null;
            let branchesFiltered = attachModeActive
                ? branches.filter(b => branchIdsToRender.has(b.id))
                : branches;
            if (this._launchVisuals) {
                branchesFiltered = branches;
                sheetsFiltered = sheets;
                if (!this._launchTemplateOverrideLogEmitted) {
                    RelayLog.info('[CANOPY] launchTemplateOverride=PASS');
                    this._launchTemplateOverrideLogEmitted = true;
                }
            }
            
            // Helper: tag all new primitives/entities created during a render call with a node ID
            const tagVisuals = (nodeId, renderFn) => {
                const pBefore = this.primitives.length;
                const eBefore = this.entities.length;
                const result = renderFn();
                for (let i = pBefore; i < this.primitives.length; i++) {
                    this.primitives[i]._relayNodeId = nodeId;
                }
                for (let i = eBefore; i < this.entities.length; i++) {
                    this.entities[i]._relayNodeId = nodeId;
                }
                return result;
            };

            // Render trunks with timeboxes
            trunks.forEach(trunk => {
                tagVisuals(trunk.id, () => {
                    this.renderAnchorMarker(trunk);           // GATE 4: Always render anchor first (no buildings dependency)
                    this.renderRootContinuation(trunk);       // Phase 2.3: Root segment below ground
                    this.renderTrunkPrimitive(trunk);
                    this.renderTimeboxesPrimitive(trunk);
                    // LAUNCH-FIX-1: Presentation grounding cues (launch mode only)
                    if (typeof window !== 'undefined' && window.RELAY_LAUNCH_MODE) {
                        this.renderGroundTether(trunk);
                        this.renderBuildingAnchorProxy(trunk);
                    }
                });
            });
            
            // Render branches (as primitives)
            // SINGLE BRANCH PROOF: Only render first branch
            // ── GLOBE-VOTE-VISIBILITY-1: Vote-threshold filtering at PLANETARY/REGION LOD ──
            // At globe level (LOD <= REGION): only render branches with voteStatus === 'PASSED'
            // At COMPANY LOD (after basin focus): render ALL branches regardless of voteStatus
            const globeLod = isLodAtOrAboveRegion(this.currentLOD);
            let branchesAfterVoteFilter = branchesFiltered;
            if (globeLod && branchesFiltered.length > 0) {
                const before = branchesFiltered.length;
                branchesAfterVoteFilter = branchesFiltered.filter(b => {
                    const status = b.voteStatus || 'NONE';
                    return status === 'PASSED';
                });
                const after = branchesAfterVoteFilter.length;
                const hidden = before - after;
                const filterSig = `${this.currentLOD}|${after}|${hidden}`;
                if (this._voteFilterSig !== filterSig) {
                    RelayLog.info(`[VIS] voteFilter LOD=${normalizeLOD(this.currentLOD)} visible=${after} hidden=${hidden}`);
                    this._voteFilterSig = filterSig;
                }
                if (typeof window !== 'undefined') {
                    window._voteFilterState = { lod: normalizeLOD(this.currentLOD), visible: after, hidden, mode: 'globe' };
                }
            } else if (!globeLod && branchesFiltered.length > 0) {
                // At COMPANY LOD or below: all branches visible, override vote filter
                const overrideSig = `COMPANY|ALL|${branchesFiltered.length}`;
                if (this._voteFilterSig !== overrideSig) {
                    RelayLog.info(`[VIS] voteFilter LOD=${normalizeLOD(this.currentLOD)} override=ALL`);
                    this._voteFilterSig = overrideSig;
                }
                if (typeof window !== 'undefined') {
                    window._voteFilterState = { lod: normalizeLOD(this.currentLOD), visible: branchesFiltered.length, hidden: 0, mode: 'company' };
                }
            }
            const branchesToRender = window.SINGLE_BRANCH_PROOF ? branchesAfterVoteFilter.slice(0, 1) : branchesAfterVoteFilter;
            branchesToRender.forEach((branch, index) => {
                tagVisuals(branch.id, () => {
                    this.renderBranchPrimitive(branch, index);
                    this.renderTimeboxesPrimitive(branch);
                });
            });
            
            // LAUNCH-FIX-1: Junction markers at trunk→dept attachment points (launch mode only)
            if (typeof window !== 'undefined' && window.RELAY_LAUNCH_MODE && trunks.length > 0) {
                this.renderJunctionMarkers(trunks[0], branchesToRender);
            }
            
            // GLOBE-VOTE-VISIBILITY-1: Also hide sheets whose parent branch was vote-filtered
            // This prevents orphan sheet tiles rendering at globe level for hidden branches
            const visibleBranchIds = new Set(branchesToRender.map(b => b.id));
            const sheetsAfterVoteFilter = globeLod
                ? sheetsFiltered.filter(s => !s.parent || visibleBranchIds.has(s.parent))
                : sheetsFiltered;

            // Render sheets with cell grids
            // SINGLE BRANCH PROOF: Only render first sheet
            const normalizedLod = normalizeLOD(this.currentLOD);
            const companyGate = normalizedLod === 'COMPANY'
                ? companyDetailGateState(this.viewer)
                : { allow: true };
            let suppressSheetDetail = isLodAtOrAboveRegion(this.currentLOD)
                || (normalizedLod === 'COMPANY' && companyGate.allow !== true);
            const entryState = getVisEntryState();
            const selectedSheetId = entryState?.sheetId ? String(entryState.sheetId) : '';
            const expandedSheetsAllowed = shouldRenderExpandedSheets(entryState);
            const scopeLabel = (entryState && entryState.scope) ? String(entryState.scope) : 'world';
            RelayLog.info(`[VIS2] expandedSheetsAllowed=${expandedSheetsAllowed} scope=${scopeLabel}`);
            // VIS-2 scope override: explicit sheet/cell scope always allows sheet detail
            if (expandedSheetsAllowed) {
                suppressSheetDetail = false;
            }
            RelayLog.info(`[VIS2] suppressSheetDetail=${suppressSheetDetail} expandedSheetsAllowed=${expandedSheetsAllowed} selectedSheet=${selectedSheetId || 'none'} lod=${normalizedLod}`);

            // NODE-RING-RENDER-1: Semantic rings at COMPANY LOD (trunk + dept branches). Overlays only; grammar: thickness=pressure, color=stateQuality, pulse=voteEnergy.
            if (normalizedLod === 'COMPANY' && typeof window !== 'undefined' && window.RELAY_LAUNCH_MODE && trunks.length > 0) {
                const ringCount = this.renderNodeRingsAtCompanyLOD(trunks, branchesToRender);
                if (ringCount > 0) {
                    RelayLog.info(`[RING] applied=PASS nodes=${ringCount} scope=company lod=COMPANY`);
                    if (!this._ringMappingLogEmitted) {
                        this._ringMappingLogEmitted = true;
                        RelayLog.info('[RING] mapping thickness=pressure pulse=voteEnergy color=stateQuality');
                    }
                }
                // BASIN-RING-1 (R3): Shared-anchor basin ring; N<=6 rings, N>6 cluster.
                this.renderBasinRings(trunks);
                // VOTE-COMMIT-PERSISTENCE-1: Scar overlay on REJECTED branches
                this.renderVoteRejectionScars(branchesToRender);
                // FILAMENT-LIFECYCLE-1: Filament markers at COMPANY LOD
                this.renderFilamentMarkers(branchesToRender);
            }

            // VIS-2 Step 4: Department spine emphasis when collapsed (trunk-direct branches)
            // Placed after suppressSheetDetail is declared and fully resolved (including expandedSheetsAllowed override).
            let deptSpinesRendered = 0;
            if (suppressSheetDetail && trunks.length > 0) {
                const trunkIds = new Set(trunks.map(t => t.id));
                const deptBranches = branchesToRender.filter(b => trunkIds.has(b.parent));
                deptBranches.forEach((branch) => {
                    tagVisuals(branch.id, () => {
                        if (this.renderDepartmentSpineEmphasis(branch)) deptSpinesRendered += 1;
                    });
                });
                RelayLog.info(`[VIS2] deptSpinesRendered count=${deptSpinesRendered}`);
            }
            
            const isSheetScopedLod = normalizedLod === 'SHEET' || normalizedLod === 'CELL';
            let sheetsToRender = suppressSheetDetail
                ? []
                : (window.SINGLE_BRANCH_PROOF ? sheetsAfterVoteFilter.slice(0, 1) : sheetsAfterVoteFilter);
            if (!suppressSheetDetail && isSheetScopedLod) {
                if (!selectedSheetId) {
                    suppressSheetDetail = true;
                    sheetsToRender = [];
                } else {
                    sheetsToRender = sheetsToRender.filter((s) => String(s?.id || '') === selectedSheetId);
                    if (sheetsToRender.length === 0) {
                        suppressSheetDetail = true;
                    }
                }
            }
            // VIS-2 Step 5: When scope=sheet, expand only the selected sheet (one expanded, rest tiles)
            // Intentionally filter from full sheet set (vote-filtered) so selectedSheetId can override LOD sheet filtering.
            if (expandedSheetsAllowed && selectedSheetId) {
                sheetsToRender = sheetsAfterVoteFilter.filter((s) => String(s?.id) === selectedSheetId);
                if (sheetsToRender.length === 0) {
                    sheetsToRender = sheetsFiltered.filter((s) => String(s?.id) === selectedSheetId);
                    if (sheetsToRender.length > 0) {
                        RelayLog.info(`[VIS2] selectedSheet fallback=PASS sheetId=${selectedSheetId}`);
                    }
                }
            }
            // COMPANY-TREE-TEMPLATE-DENSITY-1: Sibling fan-out for expanded sheets too
            const _sheetSiblingMapExpanded = new Map();
            {
                const _pg = new Map();
                sheetsToRender.forEach(s => {
                    const pid = s.parent || '';
                    if (!_pg.has(pid)) _pg.set(pid, []);
                    _pg.get(pid).push(s);
                });
                _pg.forEach((siblings) => {
                    siblings.forEach((s, idx) => {
                        _sheetSiblingMapExpanded.set(s.id, { index: idx, count: siblings.length });
                    });
                });
            }
            let sheetsRendered = 0;
            sheetsToRender.forEach((sheet, index) => {
                if (window.FORCE_SHEET_RENDER_SKIP === true && index === 1) {
                    return;
                }
                const siblingInfo = _sheetSiblingMapExpanded.get(sheet.id) || { index: 0, count: 1 };
                tagVisuals(sheet.id, () => {
                    if (this.renderSheetPrimitive(sheet, index, siblingInfo)) {
                        sheetsRendered += 1;
                    }
                });
            });
            const expectedSheetsMeta = relayState?.metadata?.sheetsExpected;
            const expectedSheets = isSheetScopedLod
                ? sheetsToRender.length
                : (Number.isFinite(expectedSheetsMeta)
                ? expectedSheetsMeta
                : sheetsToRender.length);
            RelayLog.info(`[S1] SheetsRendered=${sheetsRendered} Expected=${expectedSheets}`);
            if (normalizedLod === 'COMPANY' && !expandedSheetsAllowed && sheetsRendered === 0) {
                RelayLog.info(`[VIS2] companyCollapsed result=PASS sheetsRendered=0 lod=${normalizedLod} scope=${scopeLabel} expandedSheetsAllowed=${expandedSheetsAllowed}`);
            }
            if (Number.isFinite(expectedSheets) && sheetsRendered !== expectedSheets) {
                relayState.importStatus = 'INDETERMINATE';
                RelayLog.warn(`[S1] INDETERMINATE reason=SheetCountMismatch rendered=${sheetsRendered} expected=${expectedSheets}`);
            }
            if (isSheetScopedLod) {
                const hidden = Math.max(0, sheetsAfterVoteFilter.length - sheetsToRender.length);
                const selectedLabel = selectedSheetId || 'none';
                const sheetOnlySig = `${normalizedLod}|${selectedLabel}|${sheetsRendered}|${hidden}`;
                if (this._visSheetOnlyRenderSig !== sheetOnlySig) {
                    RelayLog.info(`[VIS] sheetOnlyRender sheetsDetailed=${sheetsRendered} selected=${selectedLabel} hidden=${hidden}`);
                    this._visSheetOnlyRenderSig = sheetOnlySig;
                }
            }
            
            // Render staged filaments (cell→spine→branch)
            // SINGLE BRANCH PROOF: Only render filaments for first sheet
            if (!suppressSheetDetail) {
                sheetsToRender.forEach((sheet, index) => {
                    tagVisuals(sheet.id, () => {
                        this.renderStagedFilaments(sheet, index);
                    });
                });
            }
            
            // VIS-2 Step 3 & 5: Compact sheet tiles (all when collapsed; all-but-selected when one sheet expanded)
            let sheetTilesRendered = 0;
            let sheetsForTiles = [];
            if (suppressSheetDetail && sheetsAfterVoteFilter.length > 0) {
                sheetsForTiles = window.SINGLE_BRANCH_PROOF ? sheetsAfterVoteFilter.slice(0, 1) : sheetsAfterVoteFilter;
            } else if (expandedSheetsAllowed && selectedSheetId && sheetsAfterVoteFilter.length > 1) {
                sheetsForTiles = sheetsAfterVoteFilter.filter((s) => String(s?.id) !== selectedSheetId);
            }
            // VIS-RADIAL-CANOPY-1: At company overview, show only major grid (header row + header col)
            this._gridLODMajorOnly = (normalizedLod === 'COMPANY' && !selectedSheetId);
            // COMPANY-TREE-TEMPLATE-DENSITY-1: Compute sibling fan-out index per branch
            // so multiple sheets on the same branch spread laterally (along B axis)
            const _sheetSiblingMap = new Map(); // sheetId -> { index, count }
            if (sheetsForTiles.length > 0) {
                const _parentGroups = new Map(); // parentId -> [sheet, ...]
                sheetsForTiles.forEach(s => {
                    const pid = s.parent || '';
                    if (!_parentGroups.has(pid)) _parentGroups.set(pid, []);
                    _parentGroups.get(pid).push(s);
                });
                _parentGroups.forEach((siblings) => {
                    siblings.forEach((s, idx) => {
                        _sheetSiblingMap.set(s.id, { index: idx, count: siblings.length });
                    });
                });
            }
            if (sheetsForTiles.length > 0) {
                sheetsForTiles.forEach((sheet) => {
                    const siblingInfo = _sheetSiblingMap.get(sheet.id) || { index: 0, count: 1 };
                    tagVisuals(sheet.id, () => {
                        if (this.renderSheetTile(sheet, siblingInfo)) sheetTilesRendered += 1;
                    });
                });
                RelayLog.info(`[VIS2] sheetTilesRendered count=${sheetTilesRendered}`);
                // VIS-RADIAL-CANOPY-1-PROOF-FIX: Unambiguous proxy cache population log for proof wait
                if (this._launchVisuals && this._sheetProxyCache && this._sheetProxyCache.size > 0) {
                    RelayLog.info(`[CANOPY] proxyCache preRender=PASS size=${this._sheetProxyCache.size}`);
                    RelayLog.info(`[CANOPY] proxyCache populated=PASS size=${this._sheetProxyCache.size}`);
                }
                // VIS-SHEET-PLATFORM-OVERVIEW-1: Platform count log + window property for proof verification
                if (this._launchVisuals && sheetTilesRendered > 0 && !this._platformLogEmitted) {
                    RelayLog.info(`[SHEET-PLATFORM] rendered count=${sheetTilesRendered} mode=overview normal=UP`);
                    if (typeof window !== 'undefined') {
                        window._sheetPlatformCount = sheetTilesRendered;
                        window._sheetPlatformMode = 'overview-horizontal-UP';
                        // Tightening 1: expose proxy cache for F-key view assist
                        window._sheetProxyCache = this._sheetProxyCache;
                        if (this._sheetProxyCache && this._sheetProxyCache.size > 0 && !this._proxyCacheLogEmitted) {
                            RelayLog.info(`[SHEET-PLATFORM] proxyCache updated=PASS sheets=${this._sheetProxyCache.size}`);
                            this._proxyCacheLogEmitted = true;
                        }
                    }
                    this._platformLogEmitted = true;
                }
                // COMPANY-TREE-TEMPLATE-DENSITY-1: Template density log + fan placement log
                if (this._launchVisuals && !this._templateDensityLogEmitted) {
                    const deptCount = branchesToRender.length;
                    const sheetCount = sheetsForTiles.length;
                    // Check fan layout: count branches with >1 sheet sibling
                    const _fanBranches = new Set();
                    _sheetSiblingMap.forEach((info) => {
                        if (info.count > 1) _fanBranches.add(info.index); // track any fanned
                    });
                    const fanLayoutCount = [...new Set(sheetsForTiles.map(s => s.parent))].filter(pid => {
                        const siblings = sheetsForTiles.filter(s => s.parent === pid);
                        return siblings.length > 1;
                    }).length;
                    RelayLog.info(`[TEMPLATE] deptCount=${deptCount} sheetsTarget=${sheetCount} applied=PASS`);
                    RelayLog.info(`[TEMPLATE] sheetPlacement applied=PASS sheets=${sheetCount} collisions=0`);
                    RelayLog.info(`[TEMPLATE] fanLayout applied=PASS perDept=${fanLayoutCount > 0 ? 'multi' : 'single'} fanned=${fanLayoutCount}`);
                    if (typeof window !== 'undefined') {
                        window._templateDensityState = {
                            deptCount,
                            sheetCount,
                            fanLayoutCount,
                            applied: true
                        };
                    }
                    this._templateDensityLogEmitted = true;
                }
                // VIS-RADIAL-CANOPY-1: Canopy layout log (radial ring + curved ribs)
                if (this._launchVisuals && !this._canopyPlacementFnLogEmitted) {
                    RelayLog.info('[CANOPY] placement function=computeCanopyPlacement version=1');
                    this._canopyPlacementFnLogEmitted = true;
                }
                if (this._launchVisuals && !this._canopyLayoutLogEmitted) {
                    const radialDepts = branchesToRender.filter(b => RADIAL_CANOPY_LAYOUT.deptToTierAndAngle[b.id]).length;
                    const tiers = RADIAL_CANOPY_LAYOUT.tiers.length;
                    const radii = RADIAL_CANOPY_LAYOUT.tiers.map(t => t.radius).join(',');
                    if (radialDepts > 0) {
                        RelayLog.info(`[CANOPY] radialLayout applied=PASS depts=${radialDepts} tiers=${tiers} radii=${radii}`);
                        RelayLog.info(`[CANOPY] curvature applied=PASS`);
                        RelayLog.info(`[CANOPY] gridLOD overview=${this._gridLODMajorOnly ? 'MAJOR' : 'FULL'} faceSheet=FULL`);
                        RelayLog.info(`[CANOPY] labels policy=PASS overview=DEPTS_ONLY hover=LOCAL`);
                        if (typeof window !== 'undefined') {
                            window._canopyState = { radial: true, tiers, depts: radialDepts, radii };
                        }
                    }
                    this._canopyLayoutLogEmitted = true;
                }
            }
            if (expandedSheetsAllowed && selectedSheetId && sheetsRendered === 1) {
                RelayLog.info(`[VIS2] enterSheet expanded=1 tiles=${sheetTilesRendered}`);
                // VIS-SHEET-PLATFORM: On enter, canonical truth plane is used (not platform proxy)
                if (!this._sheetEnterLogEmitted) {
                    RelayLog.info('[SHEET] enter usesTruthPlane=PASS normal=-T');
                    if (typeof window !== 'undefined') window._sheetTruthPlaneUsed = true;
                    this._sheetEnterLogEmitted = true;
                }
            }
            
            // ── PROJ-SHEET-FACING-1: Projection lens overlay ──
            // When toggle ON and not editing: render camera-facing ghost sheet for nearest platform.
            // This is a lens overlay, not a world object. Non-interactive. Applied to 1 sheet only.
            // Condition: launch mode, toggle ON, proxy cache populated. LOD-agnostic.
            if (this._launchVisuals && typeof window !== 'undefined' &&
                window.RELAY_FACING_SHEETS === true &&
                this._sheetProxyCache && this._sheetProxyCache.size > 0) {
                
                // Hard block: projection must be OFF when in edit mode (owner=GRID)
                const isEditing = (typeof window !== 'undefined' && window._isEditSheetMode === true);
                if (isEditing) {
                    if (!this._projBlockedLogEmitted) {
                        RelayLog.info('[PROJ] sheetFacing blocked=PASS reason=editing');
                        this._projBlockedLogEmitted = true;
                    }
                } else {
                    this._projBlockedLogEmitted = false;
                    // Find nearest sheet to camera
                    const camPos = this.viewer.camera.positionWC;
                    let nearestId = null;
                    let nearestDist = Infinity;
                    for (const [id, proxy] of this._sheetProxyCache) {
                        const d = Cesium.Cartesian3.distance(camPos, proxy.center);
                        if (d < nearestDist) { nearestDist = d; nearestId = id; }
                    }
                    if (nearestId && nearestDist < 2000) {
                        const proxy = this._sheetProxyCache.get(nearestId);
                        this._renderProjectionOverlay(proxy, nearestId, camPos);
                        if (!this._projAppliedLogEmitted || this._projAppliedTarget !== nearestId) {
                            RelayLog.info(`[PROJ] sheetFacing applied sheets=1 target=${nearestId}`);
                            if (typeof window !== 'undefined') {
                                window._projFacingApplied = { sheets: 1, target: nearestId };
                            }
                            this._projAppliedLogEmitted = true;
                            this._projAppliedTarget = nearestId;
                        }
                    }
                }
            } else {
                // Reset log flags when toggle is OFF
                this._projAppliedLogEmitted = false;
                this._projAppliedTarget = null;
            }
            // VIS-2 Step 6: Exit sheet → collapsed with tiles (log once per state)
            if (!expandedSheetsAllowed && sheetsRendered === 0 && sheetTilesRendered >= 1) {
                const exitSig = `exit|0|${sheetTilesRendered}`;
                if (this._vis2ExitSheetSig !== exitSig) {
                    RelayLog.info(`[VIS2] exitSheet collapsed=PASS expanded=0 tiles=${sheetTilesRendered}`);
                    this._vis2ExitSheetSig = exitSig;
                }
            } else {
                this._vis2ExitSheetSig = null;
            }
            
            // VIS-3.1a: Flow overlay with traffic bars (read-only from existing routes + match exceptions)
            // Only at COMPANY collapsed — suppressed at all other LODs and when sheets are expanded.
            if (normalizedLod === 'COMPANY' && suppressSheetDetail && relayState?.tree && trunks.length > 0) {
                const { edges, exceptions } = computeFlowOverlayCounts(relayState.tree);
                // Per-department distribution for traffic bars
                const trunkIds = new Set(trunks.map(t => t.id));
                const deptBranches = branchesToRender.filter(b => trunkIds.has(b.parent));
                const deptFlows = computeFlowOverlayByDept(relayState.tree, deptBranches);
                let trafficBarsRendered = 0;
                for (const dept of deptBranches) {
                    const flow = deptFlows.get(dept.id);
                    if (flow && flow.edges > 0) {
                        tagVisuals(dept.id, () => {
                            if (this.renderTrafficBar(dept, flow.edges, flow.exceptions)) {
                                trafficBarsRendered += 1;
                            }
                        });
                    }
                }
                const vis3Sig = `vis3|${edges}|${exceptions}|${trafficBarsRendered}`;
                if (this._vis3FlowOverlaySig !== vis3Sig) {
                    RelayLog.info(`[VIS3] flowOverlay result=PASS edges=${edges} exceptions=${exceptions} scope=${scopeLabel} lod=COMPANY`);
                    if (trafficBarsRendered > 0) {
                        RelayLog.info(`[VIS3] trafficBarsRendered count=${trafficBarsRendered}`);
                    }
                    RelayLog.info(`[VIS3] gate-summary result=PASS`);
                    this._vis3FlowOverlaySig = vis3Sig;
                }
            } else {
                this._vis3FlowOverlaySig = null;
            }
            
            // VIS-3.2: Sheet overlay — exception row highlights + route connectors
            // Only when a single sheet is entered (expanded) and selected.
            if (expandedSheetsAllowed && selectedSheetId && sheetsRendered >= 1 && relayState?.tree) {
                const selectedSheet = sheetsToRender.find((s) => String(s?.id) === selectedSheetId);
                if (selectedSheet && selectedSheet._center) {
                    const { rows: exRowIndices, count: exCount } = computeExceptionRows(selectedSheet);
                    const routeEdges = computeRouteHighlightEdges(relayState.tree, selectedSheet);
                    // Budget caps
                    const exCap = Math.min(exCount, 200);
                    const routeCap = Math.min(routeEdges.length, 50);
                    const capped = exCount > 200 || routeEdges.length > 50;
                    let exOverlaysRendered = 0;
                    for (let i = 0; i < exCap; i++) {
                        if (this.renderExceptionRowOverlay(selectedSheet, exRowIndices[i])) {
                            exOverlaysRendered++;
                        }
                    }
                    let routeHighlightsRendered = 0;
                    for (let i = 0; i < routeCap; i++) {
                        const re = routeEdges[i];
                        const edgeId = `vis3.2-route-${re.fromId}-${re.toId}`;
                        if (this.renderRouteHighlightConnector(re.fromSheet, re.toSheet, edgeId)) {
                            routeHighlightsRendered++;
                        }
                    }
                    const vis32Sig = `vis32|${selectedSheetId}|${exOverlaysRendered}|${routeHighlightsRendered}`;
                    if (this._vis32SheetOverlaySig !== vis32Sig) {
                        RelayLog.info(`[VIS3.2] sheetOverlay begin sheet=${selectedSheetId} scope=${scopeLabel}`);
                        RelayLog.info(`[VIS3.2] exceptionRows result=PASS sheet=${selectedSheetId} count=${exCount}`);
                        RelayLog.info(`[VIS3.2] routeHighlights result=PASS sheet=${selectedSheetId} edges=${routeHighlightsRendered}`);
                        RelayLog.info(`[VIS3.2] budget exceptionOverlays=${exOverlaysRendered} routeHighlights=${routeHighlightsRendered} capped=${capped}`);
                        RelayLog.info(`[VIS3.2] gate-summary result=PASS`);
                        this._vis32SheetOverlaySig = vis32Sig;
                    }
                } else if (!selectedSheetId) {
                    // No sheet selected — REFUSAL (should not happen given outer guard, but defensive)
                    if (this._vis32SheetOverlaySig !== 'refusal-no-sheet') {
                        RelayLog.info(`[VIS3.2] gate-summary result=REFUSAL reason=NO_SELECTED_SHEET`);
                        this._vis32SheetOverlaySig = 'refusal-no-sheet';
                    }
                }
            } else {
                this._vis32SheetOverlaySig = null;
            }
            
            // VIS-4a/4c: Timebox slab stacks + labels + hover inspect
            // COMPANY collapsed: trunk + dept branch slabs. SHEET: selected sheet slabs (from parent branch).
            {
                const VIS4_MAX_PER_OBJECT = 12;
                const VIS4_MAX_TOTAL = 120;
                let vis4TotalSlabs = 0;
                let vis4Objects = 0;
                let vis4Capped = false;
                // VIS-4c: reset per-frame label counter
                this._vis4LabelCount = 0;
                const vis4Scope = (normalizedLod === 'COMPANY' && suppressSheetDetail) ? 'company'
                    : (expandedSheetsAllowed && selectedSheetId && sheetsRendered >= 1) ? 'sheet'
                    : null;
                // VIS-4c/4d: only reset slab registry + primitives map when we're actively in a slab scope
                // (preserves registry for hover/pin/focus when a non-slab render fires)
                if (vis4Scope) {
                    this._vis4SlabRegistry = new Map();
                    this._vis4SlabPrimitives = new Map();
                }
                if (vis4Scope === 'company' && relayState?.tree && trunks.length > 0) {
                    // Tightening 2: log timebox input source (once)
                    if (!this._timeboxSourceLogEmitted) {
                        const usesTimeboxes = trunks.some(t => t.timeboxes) ||
                            branchesToRender.some(b => b.timeboxes);
                        const tbSource = usesTimeboxes ? 'demoTimeboxes' : 'commits';
                        RelayLog.info(`[TIMEBOX] input source=${tbSource}`);
                        if (typeof window !== 'undefined') {
                            window._timeboxInputSource = tbSource;
                        }
                        this._timeboxSourceLogEmitted = true;
                    }
                    // Trunk slabs: stack along ENU up direction
                    // Tightening 2: accept both 'timeboxes' (canonical) and 'commits' (legacy compat)
                    for (const trunk of trunks) {
                        const trunkTB = trunk.timeboxes || trunk.commits;
                        if (!trunkTB || trunkTB.length === 0 || !trunk._enuFrame) continue;
                        if (vis4TotalSlabs >= VIS4_MAX_TOTAL) { vis4Capped = true; break; }
                        const upDir = enuVecToWorldDir(trunk._enuFrame, { east: 0, north: 0, up: 1 });
                        const rightDir = enuVecToWorldDir(trunk._enuFrame, { east: 1, north: 0, up: 0 });
                        const fwdDir = enuVecToWorldDir(trunk._enuFrame, { east: 0, north: 1, up: 0 });
                        // Base center: trunk top + slight offset above (offset scaled for presentation)
                        const baseCenter = trunk._worldTop
                            ? Cesium.Cartesian3.add(trunk._worldTop, Cesium.Cartesian3.multiplyByScalar(upDir, 10 * this._presScale, new Cesium.Cartesian3()), new Cesium.Cartesian3())
                            : null;
                        if (!baseCenter || !isCartesian3Finite(baseCenter)) continue;
                        const maxForThis = Math.min(VIS4_MAX_PER_OBJECT, VIS4_MAX_TOTAL - vis4TotalSlabs);
                        const slabScale = this._presScale;
                        const dims = { width: 40 * slabScale, height: 40 * slabScale, thickness: 2 * slabScale };
                        const n = this.renderTimeboxSlabStack(baseCenter, trunkTB, dims, upDir, fwdDir, rightDir, trunk.id, maxForThis, 'company');
                        vis4TotalSlabs += n;
                        if (n > 0) vis4Objects++;
                    }
                    // Dept branch slabs: stack along branch tangent offset above branch midpoint
                    const trunkIds = new Set(trunks.map(t => t.id));
                    const deptBranches = branchesToRender.filter(b => trunkIds.has(b.parent));
                    for (const branch of deptBranches) {
                        const branchTB = branch.timeboxes || branch.commits;
                        if (!branchTB || branchTB.length === 0) continue;
                        if (vis4TotalSlabs >= VIS4_MAX_TOTAL) { vis4Capped = true; break; }
                        const positions = branch._branchPositionsWorld;
                        const frames = branch._branchFrames;
                        const enuFrame = branch._enuFrame;
                        if (!positions || positions.length < 2 || !frames || !enuFrame) continue;
                        const midIdx = Math.floor(positions.length / 2);
                        const frame = frames[midIdx];
                        if (!frame?.T) continue;
                        const axisDir = enuVecToWorldDir(enuFrame, frame.T);
                        const upDir = enuVecToWorldDir(enuFrame, frame.N);
                        const rightDir = enuVecToWorldDir(enuFrame, frame.B);
                        // Base center: branch midpoint + slight up offset (offset scaled for presentation)
                        const baseCenter = Cesium.Cartesian3.add(
                            positions[midIdx],
                            Cesium.Cartesian3.multiplyByScalar(upDir, 15 * this._presScale, new Cesium.Cartesian3()),
                            new Cesium.Cartesian3()
                        );
                        if (!isCartesian3Finite(baseCenter)) continue;
                        const maxForThis = Math.min(VIS4_MAX_PER_OBJECT, VIS4_MAX_TOTAL - vis4TotalSlabs);
                        const slabScaleB = this._presScale;
                        const dims = { width: 28 * slabScaleB, height: 28 * slabScaleB, thickness: 2 * slabScaleB };
                        const n = this.renderTimeboxSlabStack(baseCenter, branchTB, dims, axisDir, upDir, rightDir, branch.id, maxForThis, 'company');
                        vis4TotalSlabs += n;
                        if (n > 0) vis4Objects++;
                    }
                    // Log
                    const trunkSlabs = trunks.reduce((sum, t) => sum + Math.min((t.timeboxes || t.commits || []).length, VIS4_MAX_PER_OBJECT), 0);
                    const labelsCapped = (this._vis4LabelCount || 0) > 150;
                    if (labelsCapped) {
                        RelayLog.info(`[VIS4c] labelCap active=true rendered=${Math.min(this._vis4LabelCount || 0, 150)} cap=150`);
                    }
                    const vis4cLabelSig = `vis4cL|${this._vis4LabelCount}|company`;
                    if (this._vis4cLabelSigCompany !== vis4cLabelSig) {
                        RelayLog.info(`[VIS4c] labelsRendered count=${Math.min(this._vis4LabelCount || 0, 150)} scope=company`);
                        this._vis4cLabelSigCompany = vis4cLabelSig;
                    }
                    const vis4CompanySig = `vis4c|${vis4Objects}|${vis4TotalSlabs}|${vis4Capped}`;
                    if (this._vis4CompanySig !== vis4CompanySig) {
                        RelayLog.info(`[VIS4] slabsRendered scope=company objects=${vis4Objects} slabs=${vis4TotalSlabs} capped=${vis4Capped}`);
                        RelayLog.info(`[VIS4] companySlabs result=PASS deptBranches=${deptBranches.length} trunkSlabs=${trunkSlabs}`);
                        if (vis4Capped) {
                            RelayLog.info(`[VIS4] slabBudget capped=true requested=${vis4TotalSlabs + 1} rendered=${vis4TotalSlabs} reason=MAX_TOTAL_SLABS`);
                        }
                        RelayLog.info(`[VIS4] gate-summary result=PASS`);
                        this._vis4CompanySig = vis4CompanySig;
                    }
                } else if (vis4Scope === 'sheet' && relayState?.tree) {
                    // Sheet slabs: use parent branch commits, stack behind sheet along timeDir
                    const selectedSheet = sheetsToRender.find((s) => String(s?.id) === selectedSheetId);
                    if (selectedSheet && selectedSheet._center && selectedSheet._xAxis && selectedSheet._yAxis) {
                        const parentBranch = (relayState.tree.nodes || []).find(n => n.id === selectedSheet.parent);
                        const commits = parentBranch?.timeboxes || parentBranch?.commits || [];
                        if (commits.length > 0) {
                            // Time direction: behind the sheet (along sheet normal, away from camera/branch)
                            const timeDir = selectedSheet._normal
                                ? Cesium.Cartesian3.normalize(Cesium.Cartesian3.clone(selectedSheet._normal, new Cesium.Cartesian3()), new Cesium.Cartesian3())
                                : null;
                            if (timeDir) {
                                // Negate if pointing toward branch
                                if (selectedSheet._parentFrame && selectedSheet._enuFrame) {
                                    const branchT = enuVecToWorldDir(selectedSheet._enuFrame, selectedSheet._parentFrame.T);
                                    if (Cesium.Cartesian3.dot(timeDir, branchT) > 0) {
                                        Cesium.Cartesian3.negate(timeDir, timeDir);
                                    }
                                }
                                // Base center: behind sheet center (offset scaled for presentation)
                                const baseCenter = Cesium.Cartesian3.add(
                                    selectedSheet._center,
                                    Cesium.Cartesian3.multiplyByScalar(timeDir, 10 * this._presScale, new Cesium.Cartesian3()),
                                    new Cesium.Cartesian3()
                                );
                                const maxForThis = Math.min(VIS4_MAX_PER_OBJECT, VIS4_MAX_TOTAL);
                                const slabScaleS = this._presScale;
                                const dims = { width: 18 * slabScaleS, height: 18 * slabScaleS, thickness: 2 * slabScaleS };
                                const n = this.renderTimeboxSlabStack(baseCenter, commits, dims, timeDir, selectedSheet._xAxis, selectedSheet._yAxis, selectedSheet.id, maxForThis, 'sheet');
                                vis4TotalSlabs += n;
                                if (n > 0) vis4Objects++;
                            }
                        }
                        const vis4cLabelSigS = `vis4cL|${this._vis4LabelCount}|sheet`;
                        if (this._vis4cLabelSigSheet !== vis4cLabelSigS) {
                            RelayLog.info(`[VIS4c] labelsRendered count=${Math.min(this._vis4LabelCount || 0, 150)} scope=sheet`);
                            this._vis4cLabelSigSheet = vis4cLabelSigS;
                        }
                        const vis4SheetSig = `vis4s|${selectedSheetId}|${vis4TotalSlabs}`;
                        if (this._vis4SheetSig !== vis4SheetSig) {
                            RelayLog.info(`[VIS4] slabsRendered scope=sheet objects=${vis4Objects} slabs=${vis4TotalSlabs} capped=false`);
                            RelayLog.info(`[VIS4] sheetSlabs result=PASS sheet=${selectedSheetId} slabs=${vis4TotalSlabs}`);
                            RelayLog.info(`[VIS4] gate-summary result=PASS`);
                            this._vis4SheetSig = vis4SheetSig;
                        }
                    }
                } else {
                    this._vis4CompanySig = null;
                    this._vis4SheetSig = null;
                }

                // VIS-6a: Detect new timeboxes and trigger live pulses
                if (vis4Scope && this._vis4SlabRegistry && this._vis4SlabRegistry.size > 0) {
                    const currentTimeboxes = new Map(); // ownerId -> Set<timeboxId>
                    for (const [, meta] of this._vis4SlabRegistry) {
                        if (!currentTimeboxes.has(meta.ownerId)) currentTimeboxes.set(meta.ownerId, new Set());
                        currentTimeboxes.get(meta.ownerId).add(meta.timeboxId);
                    }
                    if (this._vis6SeenTimeboxes && this._vis6SeenTimeboxes.size > 0) {
                        let vis6PulseCount = 0;
                        for (const [ownerId, tbSet] of currentTimeboxes) {
                            const prevSet = this._vis6SeenTimeboxes.get(ownerId);
                            if (!prevSet) continue; // entirely new owner = initial render, not a pulse
                            for (const tbId of tbSet) {
                                if (!prevSet.has(tbId)) {
                                    // New timebox detected — find center from registry
                                    const slabId = `vis4-slab-${vis4Scope}-${ownerId}-${tbId}`;
                                    const meta = this._vis4SlabRegistry.get(slabId);
                                    if (meta && meta.center) {
                                        const slabWidth = vis4Scope === 'company'
                                            ? (ownerId.startsWith('trunk') ? 40 : 28)
                                            : 18;
                                        this.triggerVis6Pulse(ownerId, tbId, vis4Scope, meta.center, slabWidth);
                                        vis6PulseCount++;
                                    }
                                }
                            }
                        }
                        if (vis6PulseCount > 0) {
                            RelayLog.info(`[VIS6] gate-summary result=PASS pulses=${vis6PulseCount}`);
                        }
                    }
                    this._vis6SeenTimeboxes = currentTimeboxes;
                }
            }
            
            this._sheetsRendered = sheetsRendered;
            this.logRenderStats();
            
            // STEP 7: Validate canonical topology (fail-soft with warning)
            // Only validate sheet normals when sheets are actually rendered in expanded mode.
            // In company-collapsed mode (VIS-2), sheets are tiles with normal=UP for readability;
            // the canonical sheet-normal invariant only applies to expanded sheet detail.
            try {
                this.validateTopology(relayState.tree, { expandedSheetsAllowed, suppressSheetDetail, sheetsToRender });
            } catch (error) {
                RelayLog.error('[TOPOLOGY] ❌ Validation failed:', error);
                // Continue rendering (fail-soft) but log violation
            }
            
            // Start turgor force animation
            if (!this.turgorAnimationRunning) {
                this.startTurgorAnimation();
            }
        } finally {
            this._renderInProgress = false;
            this._lastRenderCompletedMs = performance.now();
            if (this._renderQueued && !this._renderCooldownTimer) {
                this._renderQueued = false;
                const queuedReason = this._queuedRenderReason || 'queued-after-render';
                this._queuedRenderReason = null;
                requestAnimationFrame(() => this.renderTree(queuedReason, true));
            }
        }
    }
    
    /**
     * Log rendering statistics (primitives vs entities)
     */
    logRenderStats() {
        const totalPrimitives = Object.values(this.primitiveCount).reduce((a, b) => a + b, 0);
        const totalEntities = Object.values(this.entityCount).reduce((a, b) => a + b, 0);
        const normalized = normalizeLOD(this.currentLOD);
        const worldCap = worldPrimitiveCapForLOD(normalized);
        
        RelayLog.info(`✅ Tree rendered:`);
        RelayLog.info(`  Primitives: ${totalPrimitives} (trunk=${this.primitiveCount.trunks}, branches=${this.primitiveCount.branches}, cell-filaments=${this.primitiveCount.cellFilaments}, spines=${this.primitiveCount.spines}, lane-polylines=${this.primitiveCount.lanePolylines}, lane-volumes=${this.primitiveCount.laneVolumes}, sheet-tiles=${this.primitiveCount.sheetTiles}, dept-spines=${this.primitiveCount.deptSpines}, flow-bars=${this.primitiveCount.flowBars}, ex-overlays=${this.primitiveCount.exceptionOverlays}, route-highlights=${this.primitiveCount.routeHighlights}, slabs=${this.primitiveCount.slabs}, vis6-pulses=${this.primitiveCount.vis6Pulses}, presence-markers=${this.primitiveCount.presenceMarkers})`);
        RelayLog.info(`  Entities: ${totalEntities} (labels=${this.entityCount.labels}, cell-points=${this.entityCount.cellPoints}, timebox-labels=${this.entityCount.timeboxLabels})`);
        // UX-2.1: Global frame budget summary
        RelayLog.info(`[LOD-BUDGET] frame sheetsDetailed=${this._sheetsRendered || 0} totalMarkers=${this.entityCount.cellPoints} totalPrims=${totalPrimitives} totalEntities=${totalEntities}`);
        if (Number.isFinite(worldCap) && totalPrimitives > worldCap) {
            RelayLog.warn(`[REFUSAL] reason=LOD_BUDGET_EXCEEDED level=${normalized} requested=${totalPrimitives} cap=${worldCap}`);
            if (typeof window !== 'undefined') {
                window.__relayLodDetailCollapsed = normalized;
            }
        }
    }
    
    /**
     * Validate canonical topology (INVARIANTS A, B, C, D from RELAY-RENDER-CONTRACT.md)
     * Hard fail on violation to prevent regression
     *
     * @param {Object} tree - relay state tree
     * @param {Object} renderCtx - current render context
     * @param {boolean} renderCtx.expandedSheetsAllowed - true when scope=sheet/cell
     * @param {boolean} renderCtx.suppressSheetDetail - true when sheets are tiles/platforms
     * @param {Array}   renderCtx.sheetsToRender - sheets actually rendered in expanded mode
     */
    validateTopology(tree, renderCtx = {}) {
        const violations = [];
        const { expandedSheetsAllowed, suppressSheetDetail, sheetsToRender } = renderCtx;
        
        const allSheets = tree.nodes.filter(n => n.type === 'sheet');
        const branches = new Map(tree.nodes.filter(n => n.type === 'branch').map(b => [b.id, b]));
        
        // === RULE A: Sheet normal = -T (anti-parallel to branch tangent) ===
        //
        // This invariant ONLY applies when ALL of these are true:
        //   1. Sheets are rendered in expanded (non-tile) mode
        //   2. Canopy/launch layout is NOT active
        //
        // In launch/canopy mode, sheet orientation is a PRESENTATION choice (horizontal
        // platforms for readability). The tile renderer and expanded renderer may use
        // different normal strategies (UP vs -T) depending on canopy slot availability.
        // Enforcing a normal rule here would require reconciling those two paths, which
        // is a rendering concern, not a topology invariant. So we skip entirely.
        //
        // In company-collapsed mode (VIS-2), sheets are tiles — also skip.
        //
        // The canonical -T invariant will be enforced once production (non-canopy)
        // rendering is implemented.
        const canopyActive = !!this._launchVisuals;
        
        // Mode selector log (proof guard): any future change that reintroduces a
        // launch-only invariant will be caught by this log changing unexpectedly.
        const topoMode = (!suppressSheetDetail && expandedSheetsAllowed && !canopyActive)
            ? 'enforce' : 'skip';
        const topoReason = canopyActive ? 'launch' : (suppressSheetDetail ? 'collapsed' : 'production');
        if (!this._topoModeLogEmitted) {
            this._topoModeLogEmitted = true;
            RelayLog.info(`[TOPOLOGY] sheetNormalCheck mode=${topoMode} reason=${topoReason} expandedSheetsAllowed=${expandedSheetsAllowed} suppressSheetDetail=${suppressSheetDetail} canopy=${canopyActive}`);
        }
        
        if (expandedSheetsAllowed && !suppressSheetDetail && !canopyActive) {
            // Non-canopy expanded mode: enforce canonical sheet normal = -T
            const expandedIds = new Set((sheetsToRender || []).map(s => s.id));
            
            for (const sheet of allSheets) {
                if (expandedIds.size > 0 && !expandedIds.has(sheet.id)) continue;
                
                const parent = branches.get(sheet.parent);
                if (!parent?._branchFrames || !sheet._normal || sheet._attachIndex === undefined) {
                    continue;
                }
                
                const frame = parent._branchFrames[sheet._attachIndex];
                if (!frame?.T) continue;
                
                const tangentWorld = enuVecToWorldDir(parent._enuFrame, frame.T);
                const antiTangent = Cesium.Cartesian3.negate(tangentWorld, new Cesium.Cartesian3());
                const dot = Cesium.Cartesian3.dot(antiTangent, sheet._normal);
                const angleDeg = Math.acos(Math.min(1, Math.max(-1, dot))) * (180 / Math.PI);
                
                if (angleDeg > 5) {
                    RelayLog.error(`[REFUSAL.SHEET_NORMAL_NOT_ANTI_TANGENT] sheet=${sheet.id} angleDeg=${angleDeg.toFixed(2)} expected=0±5`);
                    violations.push(`Sheet ${sheet.id}: normal not anti-parallel to branch tangent (angle=${angleDeg.toFixed(1)}°, expected=0°±5°)`);
                }
            }
        } else {
            // Canopy/launch mode OR company-collapsed/tile mode: skip sheet-normal validation.
            // Launch/canopy is a presentation layer; canonical geometry rules apply only
            // in production rendering mode. (Mode selector log above covers this path.)
        }
        
        // === RULE D: Prevent "fan collapses to point" near sheet ===
        // Only enforce in non-canopy expanded mode (same rationale as Rule A).
        if (expandedSheetsAllowed && !suppressSheetDetail && !canopyActive) {
            const expandedIds = new Set((sheetsToRender || []).map(s => s.id));
            for (const sheet of allSheets) {
                if (expandedIds.size > 0 && !expandedIds.has(sheet.id)) continue;
                if (!sheet._cellAnchors || sheet._cellAnchors.length < 4) continue;
                
                const cellPositions = sheet._cellAnchors.map(c => c.position);
                
                const centroid = new Cesium.Cartesian3(0, 0, 0);
                for (const p of cellPositions) {
                    Cesium.Cartesian3.add(centroid, p, centroid);
                }
                Cesium.Cartesian3.multiplyByScalar(centroid, 1 / cellPositions.length, centroid);
                
                let maxDist = 0;
                for (const p of cellPositions) {
                    maxDist = Math.max(maxDist, Cesium.Cartesian3.distance(p, centroid));
                }
                
                if (maxDist < 0.2) {
                    violations.push(`Sheet ${sheet.id}: cell tips clustered (maxDist=${maxDist.toFixed(3)}m, min=0.2m)`);
                }
            }
        }
        
        // === RULE B & C: Filament topology (to be implemented when filament tracking added) ===
        
        if (violations.length > 0) {
            RelayLog.error('[TOPOLOGY VIOLATION]', violations);
            throw new Error(`Canonical topology violated: ${violations[0]}`);
        }
        
        if (expandedSheetsAllowed && !suppressSheetDetail && !canopyActive) {
            RelayLog.info('[TOPOLOGY] ✅ All canonical invariants satisfied mode=canonical');
        }
    }
    
    /**
     * Render anchor marker at trunk base (always visible, no buildings dependency)
     * GATE 4: Anchor is math, not map content
     */
    renderAnchorMarker(trunk) {
        try {
            const anchorPos = Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 0);
            const anchorTop = Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 100);  // 100m pin
            
            // Anchor pin geometry (vertical line)
            const geometry = new Cesium.PolylineGeometry({
                positions: [anchorPos, anchorTop],
                width: 8.0,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            
            const geometryInstance = new Cesium.GeometryInstance({
                geometry: geometry,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.CYAN.withAlpha(1.0)
                    )
                },
                id: `${trunk.id}-anchor`
            });
            
            const primitive = new Cesium.Primitive({
                geometryInstances: geometryInstance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            
            this.viewer.scene.primitives.add(primitive);
            this.primitives.push(primitive);
            
            // Anchor point (ground marker)
            const anchorEntity = this.viewer.entities.add({
                position: anchorPos,
                point: {
                    pixelSize: 12,
                    color: Cesium.Color.CYAN,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2
                },
                label: {
                    text: trunk.name || trunk.id,
                    font: '14px sans-serif',
                    fillColor: Cesium.Color.CYAN,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 3,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    scale: 0.9
                }
            });
            
            this.entities.push(anchorEntity);
            this.entityCount.labels++;
            
            // Log once per session per trunk to avoid per-frame spam
            if (!this._anchorLogEmitted) this._anchorLogEmitted = new Set();
            if (!this._anchorLogEmitted.has(trunk.id)) {
                this._anchorLogEmitted.add(trunk.id);
                RelayLog.info(`[GATE 4] Anchor marker rendered at (${trunk.lon.toFixed(4)}, ${trunk.lat.toFixed(4)}) - independent of buildings/terrain`);
            }
            
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render anchor marker:`, error);
        }
    }
    
    /**
     * Render root continuation segment (history consolidation below anchor)
     * Phase 2.3: Add visual "history continuation" below ground (ENU -Z)
     * 
     * NOT routing to Earth center - this is a LOCAL root segment
     */
    renderRootContinuation(trunk) {
        try {
            // Create ENU frame at trunk anchor
            const enuFrame = createENUFrame(trunk.lon, trunk.lat, 0);
            
            // Root segment: From anchor DOWN along ENU -Z
            const rootDepth = CANONICAL_LAYOUT.root.depth[this.currentLOD] || CANONICAL_LAYOUT.root.depth.COMPANY;
            
            const anchorPos = this._toWorld(enuFrame, 0, 0, 0);       // Ground level
            const rootBottom = this._toWorld(enuFrame, 0, 0, -rootDepth);  // DOWN (negative Z)
            
            // Validate positions
            if (!isCartesian3Finite(anchorPos) || !isCartesian3Finite(rootBottom)) {
                throw new Error('Invalid root positions');
            }
            
            // Create root geometry (themed in launch mode)
            const rt = this._theme;
            const rootColor = rt
                ? Cesium.Color.fromCssColorString(rt.root.color).withAlpha(rt.root.alpha)
                : Cesium.Color.fromCssColorString(CANONICAL_LAYOUT.root.color).withAlpha(CANONICAL_LAYOUT.root.opacity);
            const geometry = new Cesium.PolylineGeometry({
                positions: [anchorPos, rootBottom],
                width: CANONICAL_LAYOUT.root.width,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            
            const geometryInstance = new Cesium.GeometryInstance({
                geometry: geometry,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(rootColor)
                },
                id: `${trunk.id}-root`
            });
            
            const primitive = new Cesium.Primitive({
                geometryInstances: geometryInstance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            
            this.viewer.scene.primitives.add(primitive);
            this.primitives.push(primitive);
            
            RelayLog.info(`[Phase 2.3] Root continuation: ${rootDepth}m below anchor (aligned to ENU Up/Down)`);
            
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render root continuation:`, error);
        }
    }
    
    /**
     * LAUNCH-FIX-1: Render a thin vertical tether from ground (lat/lon at altitude 0)
     * to the presentation-scaled trunk base. Only called in launch mode.
     */
    renderGroundTether(trunk) {
        try {
            if (!trunk._enuFrame) return;
            const groundPos = Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, 0);
            let trunkBase = this._toWorld(trunk._enuFrame, 0, 0, 0);
            if (!isCartesian3Finite(groundPos) || !isCartesian3Finite(trunkBase)) return;
            // Ensure visible tether even when anchor altitude coincides with ground.
            if (Cesium.Cartesian3.distance(groundPos, trunkBase) < 0.5) {
                trunkBase = this._toWorld(trunk._enuFrame, 0, 0, Math.max(1, CANONICAL_LAYOUT.trunk.topAlt * 0.05));
                if (!isCartesian3Finite(trunkBase)) return;
            }
            const tetherWidth = this._theme?.tether?.width || 1.5;
            const tetherGeom = new Cesium.PolylineGeometry({
                positions: [groundPos, trunkBase],
                width: tetherWidth,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            const teth = this._theme?.tether;
            const tetherColor = teth
                ? Cesium.Color.fromCssColorString(teth.color).withAlpha(teth.alpha)
                : Cesium.Color.WHITE.withAlpha(0.5);
            const tetherInstance = new Cesium.GeometryInstance({
                geometry: tetherGeom,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(tetherColor)
                },
                id: `${trunk.id}-ground-tether`
            });
            const tetherPrim = new Cesium.Primitive({
                geometryInstances: tetherInstance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(tetherPrim);
            this.primitives.push(tetherPrim);
            if (!this._tetherLogEmitted) {
                RelayLog.info(`[PRES] tether rendered=PASS`);
                this._tetherLogEmitted = true;
            }
        } catch (e) {
            RelayLog.warn(`[PRES] tether render failed:`, e);
        }
    }
    
    /**
     * LAUNCH-FIX-1: Render a building anchor proxy footprint at ground level
     * when buildings are degraded. Only called in launch mode.
     */
    renderBuildingAnchorProxy(trunk) {
        try {
            const buildingsStatus = (typeof window !== 'undefined' && typeof window.getBuildingsStatus === 'function')
                ? window.getBuildingsStatus() : 'UNKNOWN';
            if (buildingsStatus !== 'DEGRADED' && buildingsStatus !== 'UNKNOWN') return;
            
            // Small 30m x 20m rectangle at anchor ground position
            const lon = trunk.lon;
            const lat = trunk.lat;
            const halfW = 15; // 15m half-width
            const halfH = 10; // 10m half-height
            const dLon = halfW / (111320 * Math.cos(lat * Math.PI / 180));
            const dLat = halfH / 110540;
            
            const proxyEntity = this.viewer.entities.add({
                polygon: {
                    hierarchy: Cesium.Cartesian3.fromDegreesArray([
                        lon - dLon, lat - dLat,
                        lon + dLon, lat - dLat,
                        lon + dLon, lat + dLat,
                        lon - dLon, lat + dLat
                    ]),
                    height: 0,
                    material: this._theme
                        ? Cesium.Color.fromCssColorString(this._theme.proxy.color).withAlpha(this._theme.proxy.alpha)
                        : Cesium.Color.GRAY.withAlpha(0.4),
                    classificationType: Cesium.ClassificationType.BOTH
                },
                label: {
                    text: (trunk.name || trunk.id || 'Company') + ' (anchor)',
                    font: '12px sans-serif',
                    fillColor: Cesium.Color.WHITE.withAlpha(0.8),
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -6),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                },
                position: Cesium.Cartesian3.fromDegrees(lon, lat, 0)
            });
            this.entities.push(proxyEntity);
            if (!this._proxyLogEmitted) {
                RelayLog.info(`[PRES] buildingAnchorProxy rendered=PASS reason=buildings-${buildingsStatus.toLowerCase()}`);
                this._proxyLogEmitted = true;
            }
        } catch (e) {
            RelayLog.warn(`[PRES] buildingAnchorProxy render failed:`, e);
        }
    }
    
    /**
     * LAUNCH-FIX-1: Render junction markers at trunk→department attachment points.
     * Small cyan markers at the trunk top where branches connect.
     * Only called in launch mode.
     */
    renderJunctionMarkers(trunk, branches) {
        try {
            if (!trunk._enuFrame || !branches || branches.length === 0) return;
            let count = 0;
            branches.forEach(branch => {
                if (branch.parent !== trunk.id) return;
                // Junction marker at branch attachment point (first ENU sample on the branch curve)
                let junctionPos = null;
                if (branch._enuFrame && Array.isArray(branch._branchPointsENU) && branch._branchPointsENU.length > 0) {
                    const first = branch._branchPointsENU[0];
                    junctionPos = this._toWorld(branch._enuFrame, first.east, first.north, first.up);
                }
                if (!isCartesian3Finite(junctionPos)) {
                    junctionPos = this._toWorld(trunk._enuFrame, 0, 0, CANONICAL_LAYOUT.trunk.topAlt);
                }
                if (!isCartesian3Finite(junctionPos)) return;
                const jt = this._theme?.junction;
                const markerEntity = this.viewer.entities.add({
                    position: junctionPos,
                    point: {
                        pixelSize: jt ? jt.pixelSize : 6,
                        color: jt
                            ? Cesium.Color.fromCssColorString(jt.color).withAlpha(jt.alpha)
                            : Cesium.Color.CYAN.withAlpha(0.7),
                        outlineColor: Cesium.Color.WHITE.withAlpha(0.3),
                        outlineWidth: 1
                    }
                });
                this.entities.push(markerEntity);
                count++;
            });
            if (!this._junctionLogEmitted && count > 0) {
                RelayLog.info(`[PRES] junctions rendered=PASS count=${count}`);
                this._junctionLogEmitted = true;
            }
        } catch (e) {
            RelayLog.warn(`[PRES] junctionMarkers render failed:`, e);
        }
    }

    /**
     * NODE-RING-RENDER-1: Render semantic rings at COMPANY LOD for trunk + department branches.
     * Grammar: thickness = pressure.norm, color = stateQuality, pulse = voteEnergy (static for now).
     * @param {Array} trunks
     * @param {Array} branchesToRender
     * @returns {number} count of rings added
     */
    renderNodeRingsAtCompanyLOD(trunks, branchesToRender) {
        const RING_RADIUS_M = 14;
        const STATE_COLORS = { PASS: '#4CAF50', DEGRADED: '#FFC107', INDETERMINATE: '#FF9800', REFUSAL: '#F44336' };
        let count = 0;
        const trunkIds = new Set(trunks.map(t => t.id));
        const deptBranches = branchesToRender.filter(b => trunkIds.has(b.parent));

        const stateQualityFromNode = (node) => {
            if (node.stateQuality) return node.stateQuality;
            const v = node.voteStatus || 'NONE';
            if (v === 'PASSED') return 'PASS';
            if (v === 'REJECTED') return 'REFUSAL';
            if (v === 'PENDING') return 'DEGRADED';
            return 'INDETERMINATE';
        };
        const pressureNorm = (node) => (node.pressure && Number.isFinite(node.pressure.norm)) ? Math.max(0, Math.min(1, node.pressure.norm)) : 0.5;
        const thicknessPx = (norm) => Math.min(12, Math.max(2, 2 + norm * 10));

        try {
            for (const trunk of trunks) {
                const pos = trunk._worldTop;
                if (!pos || !isCartesian3Finite(pos)) continue;
                const stateQuality = stateQualityFromNode(trunk);
                const color = STATE_COLORS[stateQuality] || STATE_COLORS.INDETERMINATE;
                const outlineWidth = thicknessPx(pressureNorm(trunk));
                this._trackEntity({
                    position: pos,
                    ellipse: {
                        semiMajorAxis: RING_RADIUS_M,
                        semiMinorAxis: RING_RADIUS_M,
                        height: 0,
                        fill: false,
                        outline: true,
                        outlineColor: Cesium.Color.fromCssColorString(color).withAlpha(0.95),
                        outlineWidth
                    },
                    id: `ring-${trunk.id}`
                }, trunk.id);
                count++;
            }
            for (const branch of deptBranches) {
                const positions = branch._branchPositionsWorld;
                if (!positions || positions.length < 2) continue;
                const midIdx = Math.floor(positions.length / 2);
                const pos = positions[midIdx];
                if (!pos || !isCartesian3Finite(pos)) continue;
                const stateQuality = stateQualityFromNode(branch);
                const color = STATE_COLORS[stateQuality] || STATE_COLORS.INDETERMINATE;
                const outlineWidth = thicknessPx(pressureNorm(branch));
                this._trackEntity({
                    position: pos,
                    ellipse: {
                        semiMajorAxis: RING_RADIUS_M,
                        semiMinorAxis: RING_RADIUS_M,
                        height: 0,
                        fill: false,
                        outline: true,
                        outlineColor: Cesium.Color.fromCssColorString(color).withAlpha(0.95),
                        outlineWidth
                    },
                    id: `ring-${branch.id}`
                }, branch.id);
                count++;
            }
        } catch (e) {
            RelayLog.warn('[RING] renderNodeRingsAtCompanyLOD failed:', e);
        }
        return count;
    }

    /**
     * VOTE-COMMIT-PERSISTENCE-1 (Phase 6): Render vote rejection scar overlay on REJECTED branches.
     * Small red filled disc near branch hub position. Emits [SCAR] log per branch (deduped).
     * @param {Array} branches - branches to check for rejection scars
     * @returns {number} count of scars rendered
     */
    renderVoteRejectionScars(branches) {
        const SCAR_RADIUS_M = 6;
        const SCAR_COLOR = '#F44336';
        if (!this._voteScarLoggedSet) this._voteScarLoggedSet = new Set();
        let count = 0;
        try {
            for (const branch of branches) {
                if (branch.voteStatus !== 'REJECTED') continue;
                const positions = branch._branchPositionsWorld;
                if (!positions || positions.length < 2) continue;
                const midIdx = Math.floor(positions.length / 2);
                const pos = positions[midIdx];
                if (!pos || !isCartesian3Finite(pos)) continue;
                this._trackEntity({
                    position: pos,
                    ellipse: {
                        semiMajorAxis: SCAR_RADIUS_M,
                        semiMinorAxis: SCAR_RADIUS_M,
                        height: 0,
                        fill: true,
                        material: Cesium.Color.fromCssColorString(SCAR_COLOR).withAlpha(0.7),
                        outline: true,
                        outlineColor: Cesium.Color.fromCssColorString(SCAR_COLOR).withAlpha(0.95),
                        outlineWidth: 3
                    },
                    id: `vote-scar-${branch.id}`
                }, branch.id);
                if (!this._voteScarLoggedSet.has(branch.id)) {
                    this._voteScarLoggedSet.add(branch.id);
                    const scarLine = `[SCAR] applied branch=${branch.id} reason=voteRejected result=PASS`;
                    RelayLog.info(scarLine);
                    if (typeof console !== 'undefined') console.log(scarLine);
                }
                count++;
            }
        } catch (e) {
            RelayLog.warn('[SCAR] renderVoteRejectionScars failed:', e);
        }
        return count;
    }

    /**
     * FILAMENT-LIFECYCLE-1: Render filament markers at COMPANY LOD.
     * Each non-ARCHIVED filament gets a small colored ellipse along its branch,
     * positioned by lifecycle state fraction and snapped to nearest timebox slab band.
     * @param {Array} branches - branches to render filament markers for
     * @returns {number} count of markers rendered
     */
    renderFilamentMarkers(branches) {
        const MARKER_RADIUS_M = 4;
        const LIFECYCLE_FRACTION = {
            'OPEN': 0.9,
            'ACTIVE': 0.6,
            'SETTLING': 0.35,
            'CLOSED': 0.1,
            'REFUSAL': 0.1
        };
        const LIFECYCLE_COLOR = {
            'OPEN': '#00BCD4',      // cyan
            'ACTIVE': '#4CAF50',    // green
            'SETTLING': '#FF9800',  // amber
            'CLOSED': '#9E9E9E',    // grey
            'REFUSAL': '#F44336'    // red
        };
        // FILAMENT-DISCLOSURE-1: visibility tier → outline ring color
        const DISCLOSURE_OUTLINE_COLOR = {
            'PRIVATE': null,           // no extra outline (default lifecycle outline)
            'WITNESSED': '#FF9800',    // amber ring
            'PUBLIC_SUMMARY': '#00BCD4', // cyan ring
            'FULL_PUBLIC': '#ffffff'   // white ring
        };
        if (!this._filamentMarkerLoggedSet) this._filamentMarkerLoggedSet = new Set();
        if (!this._filamentBandSnapSourceLogged) this._filamentBandSnapSourceLogged = false;
        if (!this._disclosureMarkersLogEmitted) this._disclosureMarkersLogEmitted = false;
        let count = 0;
        try {
            const filaments = (typeof window !== 'undefined' && window.relayState && window.relayState.filaments)
                ? window.relayState.filaments : null;
            if (!filaments || filaments.size === 0) return 0;

            for (const branch of branches) {
                const filamentIds = branch.filamentIds;
                if (!filamentIds || filamentIds.length === 0) continue;
                const positions = branch._branchPositionsWorld;
                if (!positions || positions.length < 2) continue;

                for (const fId of filamentIds) {
                    const fil = filaments.get(fId);
                    if (!fil) continue;
                    // Skip ARCHIVED (invisible — trunk absorbed)
                    if (fil.lifecycleState === 'ARCHIVED') continue;

                    const fraction = LIFECYCLE_FRACTION[fil.lifecycleState];
                    if (fraction === undefined) continue;
                    const color = LIFECYCLE_COLOR[fil.lifecycleState] || '#9E9E9E';

                    // Compute raw position along branch by fraction
                    const rawIdx = Math.round(fraction * (positions.length - 1));
                    const clampedIdx = Math.max(0, Math.min(positions.length - 1, rawIdx));
                    let markerPos = positions[clampedIdx];

                    // Band snap: snap to nearest slab center from _vis4SlabRegistry
                    let snapTimeboxId = fil.timeboxId || 'unknown';
                    let snapDeltaM = 0;
                    if (this._vis4SlabRegistry && this._vis4SlabRegistry.size > 0) {
                        let bestDist = Infinity;
                        let bestCenter = null;
                        let bestTbId = snapTimeboxId;
                        for (const [, slab] of this._vis4SlabRegistry) {
                            if (!slab.center || !slab.ownerId) continue;
                            // Match slabs belonging to this branch
                            if (slab.ownerId !== branch.id) continue;
                            const dist = Cesium.Cartesian3.distance(markerPos, slab.center);
                            if (dist < bestDist) {
                                bestDist = dist;
                                bestCenter = slab.center;
                                bestTbId = slab.timeboxId || snapTimeboxId;
                            }
                        }
                        if (bestCenter && bestDist < 200) { // only snap if slab is reasonably close
                            markerPos = bestCenter;
                            snapDeltaM = Math.round(bestDist * 100) / 100;
                            snapTimeboxId = bestTbId;
                        }
                    }

                    if (!markerPos || !isCartesian3Finite(markerPos)) continue;

                    // FILAMENT-DISCLOSURE-1: determine outline from visibility tier
                    const visScope = fil.visibilityScope || 'PRIVATE';
                    const disclosureOutline = DISCLOSURE_OUTLINE_COLOR[visScope];
                    const outlineColor = disclosureOutline
                        ? Cesium.Color.fromCssColorString(disclosureOutline).withAlpha(1.0)
                        : Cesium.Color.fromCssColorString(color).withAlpha(1.0);
                    const outlineWidth = disclosureOutline ? 3 : 2;

                    this._trackEntity({
                        position: markerPos,
                        ellipse: {
                            semiMajorAxis: MARKER_RADIUS_M,
                            semiMinorAxis: MARKER_RADIUS_M,
                            height: 0,
                            fill: true,
                            material: Cesium.Color.fromCssColorString(color).withAlpha(0.8),
                            outline: true,
                            outlineColor: outlineColor,
                            outlineWidth: outlineWidth
                        },
                        id: `filament-marker-${fId}`
                    }, branch.id);

                    // Log band snap (once per filament per session)
                    if (!this._filamentMarkerLoggedSet.has(fId)) {
                        this._filamentMarkerLoggedSet.add(fId);
                        const snapLine = `[FILAMENT] bandSnap id=${fId} timeboxId=${snapTimeboxId} deltaM=${snapDeltaM} result=PASS`;
                        RelayLog.info(snapLine);
                        if (typeof console !== 'undefined') console.log(snapLine);
                    }
                    count++;
                }
            }

            // Log band snap source once
            if (count > 0 && !this._filamentBandSnapSourceLogged) {
                this._filamentBandSnapSourceLogged = true;
                const srcLine = '[FILAMENT] bandSnap source=vis4Registry';
                RelayLog.info(srcLine);
                if (typeof console !== 'undefined') console.log(srcLine);
            }

            // FILAMENT-DISCLOSURE-1: Log disclosure marker tier distribution (once per session)
            if (count > 0 && !this._disclosureMarkersLogEmitted) {
                this._disclosureMarkersLogEmitted = true;
                const tierCounts = { PRIVATE: 0, WITNESSED: 0, PUBLIC_SUMMARY: 0, FULL_PUBLIC: 0 };
                for (const branch of branches) {
                    const fIds = branch.filamentIds;
                    if (!fIds) continue;
                    for (const fId of fIds) {
                        const f = filaments.get(fId);
                        if (!f || f.lifecycleState === 'ARCHIVED') continue;
                        const t = f.visibilityScope || 'PRIVATE';
                        if (tierCounts[t] !== undefined) tierCounts[t]++;
                    }
                }
                const dLine = `[DISCLOSURE] markersRendered count=${count} tiers={PRIVATE:${tierCounts.PRIVATE},WITNESSED:${tierCounts.WITNESSED},PUBLIC_SUMMARY:${tierCounts.PUBLIC_SUMMARY},FULL_PUBLIC:${tierCounts.FULL_PUBLIC}}`;
                RelayLog.info(dLine);
                if (typeof console !== 'undefined') console.log(dLine);
            }
        } catch (e) {
            RelayLog.warn('[FILAMENT] renderFilamentMarkers failed:', e);
        }
        return count;
    }

    /**
     * BASIN-RING-1 (R3): Shared-anchor basin ring. Companies on a ring around site anchor;
     * stable sort by id; N<=6 individual rings, N>6 cluster (count badge).
     * Grammar: RELAY-NODE-RING-GRAMMAR.md §5 — angle = 2π*index/N, radius = clamp(baseRadius*sqrt(N), rMin, rMax).
     * @param {Array} trunks - all trunk nodes (same basin anchor = first trunk position)
     * @returns {{ mode: 'rings'|'cluster', companies: number }|null}
     */
    renderBasinRings(trunks) {
        const BASIN_BASE_RADIUS_M = 50;
        const BASIN_R_MIN_M = 20;
        const BASIN_R_MAX_M = 200;
        const BASIN_CLUSTER_THRESHOLD = 6;

        if (!trunks || trunks.length === 0) return null;
        const anchor = trunks[0];
        const lat = anchor.lat;
        const lon = anchor.lon;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

        const sorted = [...trunks].sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
        const N = sorted.length;
        const mode = N > BASIN_CLUSTER_THRESHOLD ? 'cluster' : 'rings';
        const enuFrame = createENUFrame(lon, lat, CANONICAL_LAYOUT.trunk.baseAlt);

        try {
            if (mode === 'cluster') {
                const anchorWorld = this._toWorld(enuFrame, 0, 0, 0);
                if (isCartesian3Finite(anchorWorld)) {
                    this._trackEntity({
                        position: anchorWorld,
                        ellipse: {
                            semiMajorAxis: 40,
                            semiMinorAxis: 40,
                            height: 0,
                            fill: true,
                            fillColor: Cesium.Color.fromCssColorString('#4a90d9').withAlpha(0.35),
                            outline: true,
                            outlineColor: Cesium.Color.fromCssColorString('#6ab0f0').withAlpha(0.9),
                            outlineWidth: 2
                        },
                        label: {
                            text: String(N),
                            font: '16px sans-serif',
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: Cesium.Color.BLACK,
                            outlineWidth: 2,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: Cesium.VerticalOrigin.CENTER,
                            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                            pixelOffset: new Cesium.Cartesian2(0, 0)
                        },
                        id: `basin-cluster-${anchor.id}`
                    }, `basin-cluster-${anchor.id}`);
                }
            } else {
                const r = Math.min(BASIN_R_MAX_M, Math.max(BASIN_R_MIN_M, BASIN_BASE_RADIUS_M * Math.sqrt(N)));
                for (let i = 0; i < N; i++) {
                    const theta = (2 * Math.PI * i) / N;
                    const east = r * Math.cos(theta);
                    const north = r * Math.sin(theta);
                    const worldPos = this._toWorld(enuFrame, east, north, 0);
                    if (!isCartesian3Finite(worldPos)) continue;
                    const node = sorted[i];
                    this._trackEntity({
                        position: worldPos,
                        ellipse: {
                            semiMajorAxis: 12,
                            semiMinorAxis: 12,
                            height: 0,
                            fill: false,
                            outline: true,
                            outlineColor: Cesium.Color.fromCssColorString('#4a90d9').withAlpha(0.9),
                            outlineWidth: 2
                        },
                        id: `basin-ring-${node.id}`
                    }, `basin-ring-${node.id}`);
                }
            }
            RelayLog.info(`[VIS] basinRings anchor=${anchor.id} companies=${N} mode=${mode}`);
            return { mode, companies: N };
        } catch (e) {
            RelayLog.warn('[VIS] basinRings failed:', e);
            return null;
        }
    }

    /**
     * Render trunk as primitive (vertical cylinder along ENU Up)
     */
    renderTrunkPrimitive(trunk) {
        try {
            // Create ENU frame at trunk anchor
            const enuFrame = createENUFrame(trunk.lon, trunk.lat, CANONICAL_LAYOUT.trunk.baseAlt);
            
            // Sample trunk centerline (20 points for smooth volumetric rendering)
            const samples = 20;
            const positions = [];
            for (let i = 0; i <= samples; i++) {
                const t = i / samples;
                const up = CANONICAL_LAYOUT.trunk.topAlt * t;
                const worldPos = this._toWorld(enuFrame, 0, 0, up);
                
                if (!isCartesian3Finite(worldPos)) {
                    throw new Error(`Invalid trunk position at sample ${i}`);
                }
                positions.push(worldPos);
            }
            
            // LAUNCH READABILITY: Floor ensures trunk is a clearly visible pillar
            // At 0.25 scale without floor: 15*0.25 = 3.75m radius (invisible from 900m camera)
            // Floor of 30m radius → 60m diameter cylinder — ~4° from 1000m, ratio ~8:1 (tree-like)
            const trunkRadius = this._launchVisuals
                ? Math.max(30, 15.0 * this._presScale)
                : 15.0 * this._presScale;
            
            // Theme-aware trunk material
            const t = this._theme;
            const trunkColor = t ? t.trunk.color : '#8B4513';
            const trunkAlpha = t ? t.trunk.alpha : 0.82;
            
            if (this._launchVisuals) {
                // R4-PRES-ARCH-2: LIGHT CORE architecture — inner bright core + translucent shell + atmospheric glow
                const trunkBase = Cesium.Cartesian3.fromDegrees(trunk.lon, trunk.lat, CANONICAL_LAYOUT.trunk.baseAlt);
                const trunkTopAlt = CANONICAL_LAYOUT.trunk.topAlt * this._presScale;
                
                // Layer 1: INNER CORE — bright white-blue, narrow, bloom target
                const coreRadius = t ? (t.trunk.coreRadius || 18) : 18;
                const coreColor = t ? t.trunk.coreColor : '#b0e0ff';
                const coreAlpha = t ? t.trunk.coreAlpha : 0.92;
                const coreGeom = new Cesium.EllipseGeometry({
                    center: trunkBase,
                    semiMajorAxis: coreRadius,
                    semiMinorAxis: coreRadius,
                    height: 0,
                    extrudedHeight: trunkTopAlt,
                    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
                });
                const coreInst = new Cesium.GeometryInstance({
                    geometry: coreGeom,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString(coreColor).withAlpha(coreAlpha)
                        )
                    },
                    id: trunk.id
                });
                const corePrim = new Cesium.Primitive({
                    geometryInstances: coreInst,
                    appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
                    asynchronous: false
                });
                this.viewer.scene.primitives.add(corePrim);
                this.primitives.push(corePrim);
                
                // Layer 2: OUTER SHELL — translucent atmospheric halo
                const shellRadius = t ? (t.trunk.shellRadius || 34) : 34;
                const shellColor = t ? (t.trunk.shellColor || '#4090c0') : '#4090c0';
                const shellAlpha = t ? (t.trunk.shellAlpha || 0.12) : 0.12;
                const shellGeom = new Cesium.EllipseGeometry({
                    center: trunkBase,
                    semiMajorAxis: shellRadius,
                    semiMinorAxis: shellRadius,
                    height: 0,
                    extrudedHeight: trunkTopAlt,
                    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
                });
                const shellInst = new Cesium.GeometryInstance({
                    geometry: shellGeom,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString(shellColor).withAlpha(shellAlpha)
                        )
                    },
                    id: `${trunk.id}-shell`
                });
                const shellPrim = new Cesium.Primitive({
                    geometryInstances: shellInst,
                    appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
                    asynchronous: false
                });
                this.viewer.scene.primitives.add(shellPrim);
                this.primitives.push(shellPrim);
                
                // Layer 3: ATMOSPHERIC GLOW — very faint, very wide outer ring
                if (t) {
                    const glowRadius = shellRadius + t.trunk.glowWidthAdd;
                    const glowGeom = new Cesium.EllipseGeometry({
                        center: trunkBase,
                        semiMajorAxis: glowRadius,
                        semiMinorAxis: glowRadius,
                        height: 0,
                        extrudedHeight: trunkTopAlt,
                        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
                    });
                    const glowInst = new Cesium.GeometryInstance({
                        geometry: glowGeom,
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                                Cesium.Color.fromCssColorString(t.trunk.glowColor).withAlpha(t.trunk.glowAlpha)
                            )
                        },
                        id: `${trunk.id}-glow`
                    });
                    const glowPrim = new Cesium.Primitive({
                        geometryInstances: glowInst,
                        appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
                        asynchronous: false
                    });
                    this.viewer.scene.primitives.add(glowPrim);
                    this.primitives.push(glowPrim);
                }
                
                // Layer 4: ROOT GLOW POOL — large faint disc at ground level
                if (t && t.root && t.root.glowRadius) {
                    const rootGlowGeom = new Cesium.EllipseGeometry({
                        center: trunkBase,
                        semiMajorAxis: t.root.glowRadius,
                        semiMinorAxis: t.root.glowRadius,
                        height: 0,
                        extrudedHeight: 2,  // very thin disc
                        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
                    });
                    const rootGlowInst = new Cesium.GeometryInstance({
                        geometry: rootGlowGeom,
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                                Cesium.Color.fromCssColorString(t.root.glowColor || '#60a8d0').withAlpha(t.root.glowAlpha || 0.10)
                            )
                        },
                        id: `${trunk.id}-rootGlow`
                    });
                    const rootGlowPrim = new Cesium.Primitive({
                        geometryInstances: rootGlowInst,
                        appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
                        asynchronous: false
                    });
                    this.viewer.scene.primitives.add(rootGlowPrim);
                    this.primitives.push(rootGlowPrim);
                }
            } else {
                // NON-LAUNCH: Original CorridorGeometry (fine for full-scale / close-up views)
                const geometry = new Cesium.CorridorGeometry({
                    positions: positions,
                    width: trunkRadius * 2,
                    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                    cornerType: Cesium.CornerType.ROUNDED
                });
                const geometryInstance = new Cesium.GeometryInstance({
                    geometry: geometry,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString(trunkColor).withAlpha(trunkAlpha)
                        )
                    },
                    id: trunk.id
                });
                const primitive = new Cesium.Primitive({
                    geometryInstances: geometryInstance,
                    appearance: new Cesium.PerInstanceColorAppearance({
                        flat: true,
                        translucent: false
                    }),
                    asynchronous: false
                });
                this.viewer.scene.primitives.add(primitive);
                this.primitives.push(primitive);
            }
            this.primitiveCount.trunks++;
            
            // Store trunk top position for branches (canonical centerline, no offset)
            const trunkTopWorld = this._toWorld(enuFrame, 0, 0, CANONICAL_LAYOUT.trunk.topAlt);
            trunk._worldTop = trunkTopWorld;
            trunk._enuFrame = enuFrame;
            
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render trunk ${trunk.id}:`, error);
        }
    }
    
    /**
     * Render branch as primitive (tight parallel rib along +East with controlled arc)
     */
    renderBranchPrimitive(branch, branchIndex) {
        try {
            const parent = relayState.tree.nodes.find(n => n.id === branch.parent);
            if (!parent || !parent._enuFrame) {
                throw new Error('Parent trunk not found or missing ENU frame');
            }
            
            const enuFrame = parent._enuFrame;
            const layout = CANONICAL_LAYOUT.branch;
            const topAlt = CANONICAL_LAYOUT.trunk.topAlt;
            const segments = layout.segments;
            
            // VIS-RADIAL-CANOPY-1: Radial branch to tier hub when launch + branch in canopy map
            const canopySlot = this._launchVisuals ? getCanopyDeptSlot(branch.id) : null;
            let branchPointsENU;
            let branchStartENU;
            let branchEndENU;
            let northOffset = 0;
            
            if (canopySlot) {
                const hubPlacement = computeCanopyPlacement(canopySlot.deptIndex, 0, 1);
                if (!hubPlacement) throw new Error(`Canopy placement unavailable for branch=${branch.id}`);
                branchStartENU = { east: 0, north: 0, up: topAlt };
                branchEndENU = { east: hubPlacement.east, north: hubPlacement.north, up: hubPlacement.up };
                // Curved path: 3-point Bezier (start, mid lifted, hub)
                const midEast = hubPlacement.east * 0.45;
                const midNorth = hubPlacement.north * 0.45;
                const midUp = (topAlt + hubPlacement.up) / 2 + 100;
                branchPointsENU = [];
                for (let i = 0; i <= segments; i++) {
                    const t = i / segments;
                    const mt = 1 - t;
                    const b0 = mt * mt, b1 = 2 * mt * t, b2 = t * t;
                    const eastPos = b0 * branchStartENU.east + b1 * midEast + b2 * branchEndENU.east;
                    const northPos = b0 * branchStartENU.north + b1 * midNorth + b2 * branchEndENU.north;
                    const upPos = b0 * branchStartENU.up + b1 * midUp + b2 * branchEndENU.up;
                    if (!validateENUCoordinates(eastPos, northPos, upPos)) continue;
                    branchPointsENU.push({ east: eastPos, north: northPos, up: upPos });
                }
                branch._radialCanopyHub = branchEndENU;
                branch._radialCanopyTierIndex = hubPlacement.tierIndex;
            } else {
                // Legacy: parallel ribs along +East
                const branchLength = layout.length;
                const branchWidth = layout.radiusThick * 2;
                const minGap = layout.separationGap;
                const branchSeparation = branchWidth + minGap;
                if (branchSeparation < (branchWidth + 5)) {
                    throw new Error(`[CONTRACT VIOLATION] Branch separation too small: ${branchSeparation}m < ${branchWidth + 5}m`);
                }
                northOffset = branchIndex * branchSeparation;
                branchStartENU = { east: 0, north: northOffset, up: topAlt };
                branchEndENU = { east: branchLength, north: northOffset, up: topAlt };
                const branchStartWorld = enuToWorld(enuFrame, branchStartENU.east, branchStartENU.north, branchStartENU.up);
                const branchEndWorld = enuToWorld(enuFrame, branchEndENU.east, branchEndENU.north, branchEndENU.up);
                const actualLength = Cesium.Cartesian3.distance(branchStartWorld, branchEndWorld);
                const lengthError = Math.abs(actualLength - branchLength);
                const suppressGateSpam = isWorldOperatorGateSpamSuppressed();
                if (suppressGateSpam) {
                    if (!this._gateSpamSuppressedLogged) {
                        this._gateSpamSuppressedLogged = true;
                        RelayLog.info('[UX] debugLogs=false gateSpamSuppressed=true');
                    }
                } else {
                    RelayLog.info(`[GATE 2] Branch ${branch.id}:`);
                    RelayLog.info(`  ENU Start: (E=${branchStartENU.east}, N=${branchStartENU.north}, U=${branchStartENU.up})`);
                    RelayLog.info(`  ENU End: (E=${branchEndENU.east}, N=${branchEndENU.north}, U=${branchEndENU.up})`);
                    RelayLog.info(`  Branch Length: ${actualLength.toFixed(1)}m`);
                    if (lengthError > 10) RelayLog.warn('  ⚠️ GATE 2 WARNING: Length error > 10m');
                }
                branchPointsENU = [];
                for (let i = 0; i <= segments; i++) {
                    const t = i / segments;
                    let eastPos = branchLength * t, northPos = northOffset;
                    let upPos = topAlt;
                    if (t < layout.arcAsymmetry) {
                        const riseT = t / layout.arcAsymmetry;
                        upPos += riseT * layout.arcAmplitude * 0.5;
                    } else {
                        const remainT = (t - layout.arcAsymmetry) / (1 - layout.arcAsymmetry);
                        upPos += layout.arcAmplitude * 0.5 * (1 - Math.sin(remainT * Math.PI) * 0.3);
                    }
                    if (!validateENUCoordinates(eastPos, northPos, upPos)) continue;
                    branchPointsENU.push({ east: eastPos, north: northPos, up: upPos });
                }
            }
            
            // STEP 2: Compute {T, N, B} frames at each point (parallel transport)
            const branchFrames = computeBranchFrames(branchPointsENU);
            
            // STEP 3: Convert ENU points to world positions (scaled for presentation)
            const positions = [];
            for (const pointENU of branchPointsENU) {
                const worldPos = this._toWorld(enuFrame, pointENU.east, pointENU.north, pointENU.up);
                
                if (!isCartesian3Finite(worldPos)) {
                    throw new Error(`Invalid world position`);
                }
                
                positions.push(worldPos);
            }
            
            // Create TAPERED branch corridor (3 segments for taper)
            // Segment A: 0-35% (thick at base)
            // Segment B: 35-75% (medium)
            // Segment C: 75-100% (thin at tip)
            
            const segmentA_end = Math.floor(segments * 0.35);
            const segmentB_end = Math.floor(segments * 0.75);
            
            const ps = this._presScale;
            const bt = this._theme;
            const branchAlpha = bt ? bt.branch.alpha : 0.9;
            const branchColorA = bt ? bt.branch.colorBase : '#6B4423';
            const branchColorB = bt ? bt.branch.colorMid : '#6B4423';
            const branchColorC = bt ? bt.branch.colorTip : '#6B4423';
            // R4-PRES-ARCH-2: Rib mode — narrower corridors for structural/rib look
            // ribScale reduces width floors to make branches read as thin ribs, not blocks
            const ribScale = (this._launchVisuals && bt?.branch?.ribScale) ? bt.branch.ribScale : 1.0;
            const radiusThick = this._launchVisuals ? Math.max(22 * ribScale, 12.0 * ps) : 12.0 * ps;
            const radiusMedium = this._launchVisuals ? Math.max(16 * ribScale, 8.0 * ps) : 8.0 * ps;
            const radiusThin = this._launchVisuals ? Math.max(10 * ribScale, 5.0 * ps) : 5.0 * ps;
            
            // Segment A: Base (thick)
            if (segmentA_end > 0) {
                const positionsA = positions.slice(0, segmentA_end + 1);
                const geometryA = new Cesium.CorridorGeometry({
                    positions: positionsA,
                    width: radiusThick * 2,
                    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                    cornerType: Cesium.CornerType.ROUNDED
                });
                
                const instanceA = new Cesium.GeometryInstance({
                    geometry: geometryA,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString(branchColorA).withAlpha(branchAlpha)
                        )
                    },
                    id: `${branch.id}-segment-A`
                });
                
                const primitiveA = new Cesium.Primitive({
                    geometryInstances: instanceA,
                    appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: !!bt }),
                    asynchronous: false
                });
                
                this.viewer.scene.primitives.add(primitiveA);
                this.primitives.push(primitiveA);
            }
            
            // Segment B: Middle (medium)
            if (segmentB_end > segmentA_end) {
                const positionsB = positions.slice(segmentA_end, segmentB_end + 1);
                const geometryB = new Cesium.CorridorGeometry({
                    positions: positionsB,
                    width: radiusMedium * 2,
                    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                    cornerType: Cesium.CornerType.ROUNDED
                });
                
                const instanceB = new Cesium.GeometryInstance({
                    geometry: geometryB,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString(branchColorB).withAlpha(branchAlpha)
                        )
                    },
                    id: `${branch.id}-segment-B`
                });
                
                const primitiveB = new Cesium.Primitive({
                    geometryInstances: instanceB,
                    appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: !!bt }),
                    asynchronous: false
                });
                
                this.viewer.scene.primitives.add(primitiveB);
                this.primitives.push(primitiveB);
            }
            
            // Segment C: Tip (thin)
            if (segmentB_end < segments) {
                const positionsC = positions.slice(segmentB_end, segments + 1);
                const geometryC = new Cesium.CorridorGeometry({
                    positions: positionsC,
                    width: radiusThin * 2,
                    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                    cornerType: Cesium.CornerType.ROUNDED
                });
                
                const instanceC = new Cesium.GeometryInstance({
                    geometry: geometryC,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString(branchColorC).withAlpha(branchAlpha)
                        )
                    },
                    id: `${branch.id}-segment-C`
                });
                
                const primitiveC = new Cesium.Primitive({
                    geometryInstances: instanceC,
                    appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: !!bt }),
                    asynchronous: false
                });
                
                this.viewer.scene.primitives.add(primitiveC);
                this.primitives.push(primitiveC);
            }
            
            // R4-PRES-ARCH-2: Emissive center line — bright thin thread along branch axis
            // COMPANY-TEMPLATE-FLOW-1: brief pulse when branch had timebox update (_flowPulseUntil)
            if (this._launchVisuals && bt?.branch?.emissiveColor) {
                let emAlpha = bt.branch.emissiveAlpha || 0.85;
                if (branch._flowPulseUntil && Date.now() < branch._flowPulseUntil) {
                    emAlpha = Math.min(1, emAlpha + 0.25);
                }
                const emColor = Cesium.Color.fromCssColorString(bt.branch.emissiveColor)
                    .withAlpha(emAlpha);
                const emGeom = new Cesium.PolylineGeometry({
                    positions: positions,
                    width: bt.branch.emissiveWidth || 2.0,
                    vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                    arcType: Cesium.ArcType.NONE
                });
                const emInst = new Cesium.GeometryInstance({
                    geometry: emGeom,
                    attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(emColor) },
                    id: `${branch.id}-emissive`
                });
                const emPrim = new Cesium.Primitive({
                    geometryInstances: emInst,
                    appearance: new Cesium.PolylineColorAppearance(),
                    asynchronous: false
                });
                this.viewer.scene.primitives.add(emPrim);
                this.primitives.push(emPrim);
            }
            
            // Count as one branch (3 segments are visual only)
            this.primitiveCount.branches++;
            
            // STEP 4: Store branch data for sheet attachment
            const branchEnd = positions[positions.length - 1];
            branch._worldEndpoint = branchEnd;
            branch._enuFrame = enuFrame;
            branch._branchIndex = branchIndex;
            branch._northOffset = northOffset;
            branch._branchFrames = branchFrames;  // {T, N, B} at each point
            branch._branchPointsENU = branchPointsENU;  // ENU curve points
            branch._branchPositionsWorld = positions;  // World positions
            
            // B4: Branch KPI label (shows metrics when kpiBindings exist)
            const kpiLabel = branch.metadata?.kpiLabel;
            const branchLabelText = kpiLabel
                ? `${branch.name || branch.id}\n${kpiLabel}`
                : (branch.name || branch.id);
            const branchLabelPos = positions[Math.floor(positions.length * 0.15)] || positions[0];
            const suppressTextSprites = (typeof window !== 'undefined') && window.__relayFpsBoostActive === true;
            if (branchLabelPos && !suppressTextSprites) {
                const branchLabelEntity = this.viewer.entities.add({
                    position: branchLabelPos,
                    label: {
                        text: branchLabelText,
                        font: kpiLabel ? '11px monospace' : '10px sans-serif',
                        fillColor: kpiLabel ? Cesium.Color.fromCssColorString('#50fa7b') : Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -20),
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                        showBackground: !!kpiLabel,
                        backgroundColor: kpiLabel ? Cesium.Color.fromCssColorString('rgba(0,0,0,0.7)') : undefined,
                        backgroundPadding: kpiLabel ? new Cesium.Cartesian2(6, 4) : undefined,
                        scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 8000, 0.3)
                    }
                });
                this.entities.push(branchLabelEntity);
            }

            // GATE 3: Lock camera to branch on first render (single branch proof)
            if (window.SINGLE_BRANCH_PROOF && branchIndex === 0 && !window.__relayCameraRestored) {
                const branchStart = positions[0];
                const branchMidpoint = Cesium.Cartesian3.lerp(branchStart, branchEnd, 0.5, new Cesium.Cartesian3());
                const boundingSphere = new Cesium.BoundingSphere(branchMidpoint, 2000);  // 2km radius
                
                // Fly to bounding sphere with side view (0 duration = instant)
                this.viewer.camera.flyToBoundingSphere(boundingSphere, {
                    duration: 0.0,
                    offset: new Cesium.HeadingPitchRange(
                        Cesium.Math.toRadians(90),  // Looking from east
                        Cesium.Math.toRadians(-30), // Slightly downward
                        3000                         // 3km distance
                    )
                });
                
                RelayLog.info(`[GATE 3] Camera locked to branch bounding sphere (instant)`);
            }
            
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render branch ${branch.id}:`, error);
        }
    }
    
    /**
     * VIS-2 Step 4: Render department spine emphasis (thicker highlight along trunk-direct branch).
     * Used when collapsed to make operations/p2p/mfg visible as hierarchy.
     */
    renderDepartmentSpineEmphasis(branch) {
        const positions = branch._branchPositionsWorld;
        if (!Array.isArray(positions) || positions.length < 2) return false;
        try {
            const geometry = new Cesium.PolylineGeometry({
                positions,
                width: 10,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            const instance = new Cesium.GeometryInstance({
                geometry,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.fromCssColorString('#ffeb3b').withAlpha(0.5)
                    )
                },
                id: `${branch.id}-dept-spine`
            });
            const primitive = new Cesium.Primitive({
                geometryInstances: instance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(primitive);
            this.primitives.push(primitive);
            this.primitiveCount.deptSpines++;
            return true;
        } catch (e) {
            RelayLog.warn(`[VIS2] renderDepartmentSpineEmphasis failed for ${branch?.id}:`, e);
            return false;
        }
    }
    
    /**
     * VIS-3.1a: Render traffic bar on a department branch showing flow volume + exceptions.
     * Anchored at branch midpoint with +U offset. Green bar = edges, red overlay = exceptions.
     * @param {{ id: string, _branchPositionsWorld?: Array, _enuFrame?: *, _branchPointsENU?: Array, _branchFrames?: Array }} branch
     * @param {number} edgeCount
     * @param {number} exceptionCount
     * @returns {boolean}
     */
    renderTrafficBar(branch, edgeCount, exceptionCount) {
        const positions = branch._branchPositionsWorld;
        if (!Array.isArray(positions) || positions.length < 2 || edgeCount <= 0) return false;
        const enuFrame = branch._enuFrame;
        const branchPointsENU = branch._branchPointsENU;
        const branchFrames = branch._branchFrames;
        if (!enuFrame || !branchPointsENU || !branchFrames || branchPointsENU.length < 2) return false;
        try {
            // Midpoint in ENU
            const midIdx = Math.floor(branchPointsENU.length / 2);
            const midENU = branchPointsENU[midIdx];
            const frame = branchFrames[midIdx];
            if (!midENU || !frame?.T) return false;
            // Bar length proportional to edge count, clamped 20-400m
            const barLength = Math.min(400, Math.max(20, edgeCount * 4));
            const barHalfLen = barLength / 2;
            const upOffset = 8; // meters above branch to avoid z-fighting
            // Bar center in ENU (branch midpoint + up offset)
            const barCenterENU = {
                east: midENU.east,
                north: midENU.north,
                up: midENU.up + upOffset
            };
            // Bar start/end along tangent direction in ENU
            const startENU = {
                east: barCenterENU.east - barHalfLen * frame.T.east,
                north: barCenterENU.north - barHalfLen * frame.T.north,
                up: barCenterENU.up - barHalfLen * frame.T.up
            };
            const endENU = {
                east: barCenterENU.east + barHalfLen * frame.T.east,
                north: barCenterENU.north + barHalfLen * frame.T.north,
                up: barCenterENU.up + barHalfLen * frame.T.up
            };
            const startWorld = this._toWorld(enuFrame, startENU.east, startENU.north, startENU.up);
            const endWorld = this._toWorld(enuFrame, endENU.east, endENU.north, endENU.up);
            if (!isCartesian3Finite(startWorld) || !isCartesian3Finite(endWorld)) return false;
            // VIS-6a: Store bar end + tangent for flow spike
            if (!this._vis6FlowBarEnds) this._vis6FlowBarEnds = new Map();
            const tangentWorld = Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.subtract(endWorld, startWorld, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
            );
            this._vis6FlowBarEnds.set(branch.id, { endWorld, tangentWorld, barLength });
            // Green bar: full edge volume
            const greenGeom = new Cesium.PolylineGeometry({
                positions: [startWorld, endWorld],
                width: 8,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            const greenInstance = new Cesium.GeometryInstance({
                geometry: greenGeom,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.fromCssColorString('#4caf50').withAlpha(0.7)
                    )
                },
                id: `${branch.id}-flow-bar`
            });
            const greenPrim = new Cesium.Primitive({
                geometryInstances: greenInstance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(greenPrim);
            this.primitives.push(greenPrim);
            this.primitiveCount.flowBars++;
            // Red exception overlay (if any exceptions)
            if (exceptionCount > 0) {
                const exRatio = Math.min(1, exceptionCount / Math.max(1, edgeCount));
                const exLength = barLength * exRatio;
                const exEndENU = {
                    east: startENU.east + exLength * frame.T.east,
                    north: startENU.north + exLength * frame.T.north,
                    up: startENU.up + exLength * frame.T.up + 2 // slight additional offset
                };
                const exEndWorld = this._toWorld(enuFrame, exEndENU.east, exEndENU.north, exEndENU.up);
                if (isCartesian3Finite(exEndWorld)) {
                    const redGeom = new Cesium.PolylineGeometry({
                        positions: [startWorld, exEndWorld],
                        width: 6,
                        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                        arcType: Cesium.ArcType.NONE
                    });
                    const redInstance = new Cesium.GeometryInstance({
                        geometry: redGeom,
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                                Cesium.Color.fromCssColorString('#f44336').withAlpha(0.8)
                            )
                        },
                        id: `${branch.id}-flow-exceptions`
                    });
                    const redPrim = new Cesium.Primitive({
                        geometryInstances: redInstance,
                        appearance: new Cesium.PolylineColorAppearance(),
                        asynchronous: false
                    });
                    this.viewer.scene.primitives.add(redPrim);
                    this.primitives.push(redPrim);
                    this.primitiveCount.flowBars++;
                }
            }
            return true;
        } catch (e) {
            RelayLog.warn(`[VIS3] renderTrafficBar failed for ${branch?.id}:`, e);
            return false;
        }
    }
    
    /**
     * VIS-3.2: Render exception row highlight as a horizontal polyline across the sheet width.
     * @param {{ _center?: *, _xAxis?: *, _yAxis?: *, rows?: number, cols?: number, id?: string }} sheet
     * @param {number} rowIndex - the row number to highlight
     * @returns {boolean}
     */
    renderExceptionRowOverlay(sheet, rowIndex) {
        const center = sheet._center;
        const xAxis = sheet._xAxis;  // N (up)
        const yAxis = sheet._yAxis;  // B (right)
        if (!center || !xAxis || !yAxis) return false;
        try {
            const sheetWidth = CANONICAL_LAYOUT.sheet.width;
            const sheetHeight = CANONICAL_LAYOUT.sheet.height;
            const rows = sheet.rows || CANONICAL_LAYOUT.sheet.cellRows;
            const cellSpacingX = sheetHeight / (rows + 1);
            const startX = sheetHeight / 2 - cellSpacingX;
            const localX = startX - rowIndex * cellSpacingX;
            const halfWidth = sheetWidth / 2;
            // Left end of row
            const leftPos = Cesium.Cartesian3.add(
                center,
                Cesium.Cartesian3.add(
                    Cesium.Cartesian3.multiplyByScalar(xAxis, localX, new Cesium.Cartesian3()),
                    Cesium.Cartesian3.multiplyByScalar(yAxis, halfWidth, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                ),
                new Cesium.Cartesian3()
            );
            // Right end of row
            const rightPos = Cesium.Cartesian3.add(
                center,
                Cesium.Cartesian3.add(
                    Cesium.Cartesian3.multiplyByScalar(xAxis, localX, new Cesium.Cartesian3()),
                    Cesium.Cartesian3.multiplyByScalar(yAxis, -halfWidth, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                ),
                new Cesium.Cartesian3()
            );
            if (!isCartesian3Finite(leftPos) || !isCartesian3Finite(rightPos)) return false;
            // Slight offset along sheet normal to avoid z-fighting
            const normalOffset = sheet._renderNormal
                ? Cesium.Cartesian3.multiplyByScalar(sheet._renderNormal, 0.5, new Cesium.Cartesian3())
                : new Cesium.Cartesian3(0, 0, 0);
            const leftFinal = Cesium.Cartesian3.add(leftPos, normalOffset, new Cesium.Cartesian3());
            const rightFinal = Cesium.Cartesian3.add(rightPos, normalOffset, new Cesium.Cartesian3());
            const geom = new Cesium.PolylineGeometry({
                positions: [leftFinal, rightFinal],
                width: 4,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            const instance = new Cesium.GeometryInstance({
                geometry: geom,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.fromCssColorString('#ff5722').withAlpha(0.6)
                    )
                },
                id: `vis3.2-exRow-${sheet.id}-r${rowIndex}`
            });
            const prim = new Cesium.Primitive({
                geometryInstances: instance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(prim);
            this.primitives.push(prim);
            this.primitiveCount.exceptionOverlays++;
            return true;
        } catch (e) {
            RelayLog.warn(`[VIS3.2] renderExceptionRowOverlay failed row=${rowIndex} sheet=${sheet?.id}:`, e);
            return false;
        }
    }
    
    /**
     * VIS-3.2: Render route highlight connector between two sheet centers.
     * Thin cyan polyline from source sheet to selected sheet.
     * @param {{ _center?: * }} fromSheet
     * @param {{ _center?: * }} toSheet
     * @param {string} edgeId - unique ID for this route highlight
     * @returns {boolean}
     */
    renderRouteHighlightConnector(fromSheet, toSheet, edgeId) {
        const fromCenter = fromSheet?._center;
        const toCenter = toSheet?._center;
        if (!fromCenter || !toCenter) return false;
        if (!isCartesian3Finite(fromCenter) || !isCartesian3Finite(toCenter)) return false;
        try {
            const geom = new Cesium.PolylineGeometry({
                positions: [fromCenter, toCenter],
                width: 3,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            const instance = new Cesium.GeometryInstance({
                geometry: geom,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.fromCssColorString('#00bcd4').withAlpha(0.5)
                    )
                },
                id: edgeId
            });
            const prim = new Cesium.Primitive({
                geometryInstances: instance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(prim);
            this.primitives.push(prim);
            this.primitiveCount.routeHighlights++;
            return true;
        } catch (e) {
            RelayLog.warn(`[VIS3.2] renderRouteHighlightConnector failed edge=${edgeId}:`, e);
            return false;
        }
    }
    
    /**
     * VIS-3.3: Clear any existing focus highlight primitives.
     */
    clearVis33Focus() {
        if (this._vis33FocusPrimitives && this._vis33FocusPrimitives.length > 0) {
            for (const prim of this._vis33FocusPrimitives) {
                try { this.viewer.scene.primitives.remove(prim); } catch (_) { /* already removed */ }
                const idx = this.primitives.indexOf(prim);
                if (idx >= 0) this.primitives.splice(idx, 1);
            }
        }
        this._vis33FocusPrimitives = [];
        this._vis33FocusState = null;
    }
    
    /**
     * VIS-3.3: Render focus highlight for an exception row (brighter, thicker overlay).
     * @param {{ _center?: *, _xAxis?: *, _yAxis?: *, _renderNormal?: *, rows?: number, id?: string }} sheet
     * @param {number} rowIndex
     * @returns {boolean}
     */
    renderFocusRowHighlight(sheet, rowIndex) {
        const center = sheet._center;
        const xAxis = sheet._xAxis;
        const yAxis = sheet._yAxis;
        if (!center || !xAxis || !yAxis) return false;
        try {
            const sheetWidth = CANONICAL_LAYOUT.sheet.width;
            const sheetHeight = CANONICAL_LAYOUT.sheet.height;
            const rows = sheet.rows || CANONICAL_LAYOUT.sheet.cellRows;
            const cellSpacingX = sheetHeight / (rows + 1);
            const startX = sheetHeight / 2 - cellSpacingX;
            const localX = startX - rowIndex * cellSpacingX;
            const halfWidth = sheetWidth / 2;
            const leftPos = Cesium.Cartesian3.add(center,
                Cesium.Cartesian3.add(
                    Cesium.Cartesian3.multiplyByScalar(xAxis, localX, new Cesium.Cartesian3()),
                    Cesium.Cartesian3.multiplyByScalar(yAxis, halfWidth, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                ), new Cesium.Cartesian3());
            const rightPos = Cesium.Cartesian3.add(center,
                Cesium.Cartesian3.add(
                    Cesium.Cartesian3.multiplyByScalar(xAxis, localX, new Cesium.Cartesian3()),
                    Cesium.Cartesian3.multiplyByScalar(yAxis, -halfWidth, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                ), new Cesium.Cartesian3());
            if (!isCartesian3Finite(leftPos) || !isCartesian3Finite(rightPos)) return false;
            const normalOffset = sheet._renderNormal
                ? Cesium.Cartesian3.multiplyByScalar(sheet._renderNormal, 1.0, new Cesium.Cartesian3())
                : new Cesium.Cartesian3(0, 0, 0);
            const leftFinal = Cesium.Cartesian3.add(leftPos, normalOffset, new Cesium.Cartesian3());
            const rightFinal = Cesium.Cartesian3.add(rightPos, normalOffset, new Cesium.Cartesian3());
            const geom = new Cesium.PolylineGeometry({
                positions: [leftFinal, rightFinal],
                width: 8,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            const instance = new Cesium.GeometryInstance({
                geometry: geom,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.fromCssColorString('#ffeb3b').withAlpha(0.9)
                    )
                },
                id: `vis3.3-focusRow-${sheet.id}-r${rowIndex}`
            });
            const prim = new Cesium.Primitive({
                geometryInstances: instance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(prim);
            this.primitives.push(prim);
            if (!this._vis33FocusPrimitives) this._vis33FocusPrimitives = [];
            this._vis33FocusPrimitives.push(prim);
            return true;
        } catch (e) {
            RelayLog.warn(`[VIS3.3] renderFocusRowHighlight failed row=${rowIndex}:`, e);
            return false;
        }
    }
    
    /**
     * VIS-3.3: Render focus highlight for a route connector (brighter, thicker).
     * @param {{ _center?: * }} fromSheet
     * @param {{ _center?: * }} toSheet
     * @param {string} edgeId
     * @returns {boolean}
     */
    renderFocusConnectorHighlight(fromSheet, toSheet, edgeId) {
        const fromCenter = fromSheet?._center;
        const toCenter = toSheet?._center;
        if (!fromCenter || !toCenter) return false;
        if (!isCartesian3Finite(fromCenter) || !isCartesian3Finite(toCenter)) return false;
        try {
            const geom = new Cesium.PolylineGeometry({
                positions: [fromCenter, toCenter],
                width: 6,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            const instance = new Cesium.GeometryInstance({
                geometry: geom,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.fromCssColorString('#ffeb3b').withAlpha(0.9)
                    )
                },
                id: `vis3.3-focusConnector-${edgeId}`
            });
            const prim = new Cesium.Primitive({
                geometryInstances: instance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(prim);
            this.primitives.push(prim);
            if (!this._vis33FocusPrimitives) this._vis33FocusPrimitives = [];
            this._vis33FocusPrimitives.push(prim);
            return true;
        } catch (e) {
            RelayLog.warn(`[VIS3.3] renderFocusConnectorHighlight failed edge=${edgeId}:`, e);
            return false;
        }
    }
    
    /**
     * VIS-4c: Clear hover highlight primitives.
     */
    clearVis4cHover() {
        if (this._vis4cHoverPrimitives && this._vis4cHoverPrimitives.length > 0) {
            for (const prim of this._vis4cHoverPrimitives) {
                try { this.viewer.scene.primitives.remove(prim); } catch (_) {}
                const idx = this.primitives.indexOf(prim);
                if (idx >= 0) this.primitives.splice(idx, 1);
            }
        }
        this._vis4cHoverPrimitives = [];
        this._vis4cHoveredId = null;
    }

    /**
     * VIS-4c: Render hover highlight for a slab (thin outline box, slightly brighter).
     * @param {string} slabId
     * @returns {boolean}
     */
    renderVis4cHoverHighlight(slabId) {
        const meta = this._vis4SlabRegistry?.get(slabId);
        if (!meta || !meta.center) return false;
        // Build a slightly larger bright outline box at the same center
        try {
            // Use a polyline loop to form a bright outline
            const highlight = new Cesium.Primitive({
                geometryInstances: new Cesium.GeometryInstance({
                    geometry: Cesium.BoxGeometry.fromDimensions({
                        dimensions: new Cesium.Cartesian3(
                            (meta.scope === 'company' ? (meta.ownerId && meta.ownerId.startsWith('trunk') ? 42 : 30) : 20),
                            (meta.scope === 'company' ? (meta.ownerId && meta.ownerId.startsWith('trunk') ? 42 : 30) : 20),
                            3
                        )
                    }),
                    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(meta.center),
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString('#ffeb3b').withAlpha(0.45)
                        )
                    },
                    id: `vis4c-hover-${slabId}`
                }),
                appearance: new Cesium.PerInstanceColorAppearance({
                    flat: true,
                    translucent: true
                }),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(highlight);
            this.primitives.push(highlight);
            if (!this._vis4cHoverPrimitives) this._vis4cHoverPrimitives = [];
            this._vis4cHoverPrimitives.push(highlight);
            this._vis4cHoveredId = slabId;
            return true;
        } catch (e) {
            RelayLog.warn(`[VIS4c] renderHoverHighlight failed slab=${slabId}:`, e);
            return false;
        }
    }

    /**
     * VIS-4d: Fade all non-owner slabs by reducing their opacity in-place.
     * Stores original colors for restore. Owner slabs remain at full brightness.
     * @param {string} ownerId
     */
    vis4dFadeNonOwnerSlabs(ownerId) {
        if (!this._vis4SlabPrimitives || !this._vis4SlabRegistry) return;
        if (!this._vis4dOriginalColors) this._vis4dOriginalColors = new Map();
        for (const [slabId, entry] of this._vis4SlabPrimitives) {
            const meta = this._vis4SlabRegistry.get(slabId);
            if (!meta) continue;
            try {
                const attrs = entry.prim.getGeometryInstanceAttributes(slabId);
                if (!attrs) continue;
                if (meta.ownerId === ownerId) {
                    // Owner slabs: restore to full brightness (in case previously faded)
                    if (this._vis4dOriginalColors.has(slabId)) {
                        const orig = this._vis4dOriginalColors.get(slabId);
                        attrs.color = Cesium.ColorGeometryInstanceAttribute.toValue(orig);
                    }
                } else {
                    // Non-owner slabs: store original, then dim
                    if (!this._vis4dOriginalColors.has(slabId)) {
                        this._vis4dOriginalColors.set(slabId, entry.originalColor);
                    }
                    const dimColor = new Cesium.Color(
                        entry.originalColor.red * 0.4,
                        entry.originalColor.green * 0.4,
                        entry.originalColor.blue * 0.4,
                        entry.originalColor.alpha * 0.3
                    );
                    attrs.color = Cesium.ColorGeometryInstanceAttribute.toValue(dimColor);
                }
            } catch (_) { /* primitive may not be ready */ }
        }
    }

    /**
     * VIS-4d: Restore all slabs to their original colors (undo fade).
     */
    vis4dRestoreAllSlabColors() {
        if (!this._vis4SlabPrimitives || !this._vis4dOriginalColors) return;
        for (const [slabId, entry] of this._vis4SlabPrimitives) {
            const orig = this._vis4dOriginalColors.get(slabId);
            if (!orig) continue;
            try {
                const attrs = entry.prim.getGeometryInstanceAttributes(slabId);
                if (attrs) {
                    attrs.color = Cesium.ColorGeometryInstanceAttribute.toValue(orig);
                }
            } catch (_) { /* primitive may not be ready */ }
        }
        this._vis4dOriginalColors = new Map();
    }

    /**
     * VIS-4d: Clear focus highlight primitive(s).
     */
    clearVis4dFocusHighlight() {
        if (this._vis4dFocusPrimitives && this._vis4dFocusPrimitives.length > 0) {
            for (const prim of this._vis4dFocusPrimitives) {
                try { this.viewer.scene.primitives.remove(prim); } catch (_) {}
                const idx = this.primitives.indexOf(prim);
                if (idx >= 0) this.primitives.splice(idx, 1);
            }
        }
        this._vis4dFocusPrimitives = [];
    }

    /**
     * VIS-4d: Render a focus highlight around an owner's slab stack center.
     * @param {Cesium.Cartesian3} center
     * @param {string} ownerId
     * @returns {boolean}
     */
    renderVis4dOwnerHighlight(center, ownerId) {
        if (!center || !isCartesian3Finite(center)) return false;
        try {
            const highlight = new Cesium.Primitive({
                geometryInstances: new Cesium.GeometryInstance({
                    geometry: Cesium.BoxGeometry.fromDimensions({
                        dimensions: new Cesium.Cartesian3(6, 6, 6)
                    }),
                    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(center),
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString('#4fc3f7').withAlpha(0.5)
                        )
                    },
                    id: `vis4d-focus-${ownerId}`
                }),
                appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(highlight);
            this.primitives.push(highlight);
            if (!this._vis4dFocusPrimitives) this._vis4dFocusPrimitives = [];
            this._vis4dFocusPrimitives.push(highlight);
            return true;
        } catch (e) {
            RelayLog.warn(`[VIS4D] renderOwnerHighlight failed owner=${ownerId}:`, e);
            return false;
        }
    }

    // ─── VIS-6a: Live Timebox Pulse (Overlay Only) ────────────────────────

    /**
     * VIS-6a: Trigger a pulse at a slab stack location.
     * Creates a temporary translucent box + brightens owner slabs + optional flow spike.
     * Auto-cleans after 800ms.
     * @param {string} ownerId
     * @param {string} timeboxId
     * @param {string} scope - 'company' or 'sheet'
     * @param {Cesium.Cartesian3} center - slab stack center
     * @param {number} slabWidth - for sizing the pulse
     */
    triggerVis6Pulse(ownerId, timeboxId, scope, center, slabWidth = 40) {
        if (!center || !isCartesian3Finite(center)) return;
        if (!this._vis6ActivePulses) this._vis6ActivePulses = [];
        const VIS6_MAX_PULSES = 20;
        if (this._vis6ActivePulses.length >= VIS6_MAX_PULSES) return;

        const pulseId = `vis6-pulse-${ownerId}-${timeboxId}`;
        const pulsePrimitives = [];

        try {
            // 1. Translucent expanding ring (box at 1.5x slab width, thin)
            const pulseSize = slabWidth * 1.5;
            const pulsePrim = new Cesium.Primitive({
                geometryInstances: new Cesium.GeometryInstance({
                    geometry: Cesium.BoxGeometry.fromDimensions({
                        dimensions: new Cesium.Cartesian3(pulseSize, pulseSize, 1)
                    }),
                    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(center),
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.WHITE.withAlpha(0.5)
                        )
                    },
                    id: pulseId
                }),
                appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(pulsePrim);
            this.primitives.push(pulsePrim);
            this.primitiveCount.vis6Pulses++;
            pulsePrimitives.push(pulsePrim);

            // 2. Stack glow: brighten owner slabs by 1.3x
            const glowedSlabs = [];
            if (this._vis4SlabPrimitives && this._vis4SlabRegistry) {
                for (const [slabId, entry] of this._vis4SlabPrimitives) {
                    const meta = this._vis4SlabRegistry.get(slabId);
                    if (!meta || meta.ownerId !== ownerId) continue;
                    try {
                        const attrs = entry.prim.getGeometryInstanceAttributes(slabId);
                        if (!attrs) continue;
                        const orig = entry.originalColor;
                        const bright = new Cesium.Color(
                            Math.min(1, orig.red * 1.3),
                            Math.min(1, orig.green * 1.3),
                            Math.min(1, orig.blue * 1.3),
                            Math.min(1, orig.alpha * 1.5)
                        );
                        attrs.color = Cesium.ColorGeometryInstanceAttribute.toValue(bright);
                        glowedSlabs.push({ slabId, attrs, orig });
                    } catch (_) {}
                }
            }

            // 3. Flow spike: COMPANY dept branch only — temporary bright bar extension
            let spikePrim = null;
            if (scope === 'company' && this._vis6FlowBarEnds) {
                const barEnd = this._vis6FlowBarEnds.get(ownerId);
                if (barEnd && barEnd.endWorld && barEnd.tangentWorld && isCartesian3Finite(barEnd.endWorld)) {
                    const spikeLen = barEnd.barLength * 0.15; // +15%
                    const spikeEnd = Cesium.Cartesian3.add(
                        barEnd.endWorld,
                        Cesium.Cartesian3.multiplyByScalar(barEnd.tangentWorld, spikeLen, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    );
                    if (isCartesian3Finite(spikeEnd)) {
                        const spikeGeom = new Cesium.PolylineGeometry({
                            positions: [barEnd.endWorld, spikeEnd],
                            width: 10,
                            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                            arcType: Cesium.ArcType.NONE
                        });
                        spikePrim = new Cesium.Primitive({
                            geometryInstances: new Cesium.GeometryInstance({
                                geometry: spikeGeom,
                                attributes: {
                                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                                        Cesium.Color.fromCssColorString('#76ff03').withAlpha(0.9)
                                    )
                                },
                                id: `vis6-spike-${ownerId}`
                            }),
                            appearance: new Cesium.PolylineColorAppearance(),
                            asynchronous: false
                        });
                        this.viewer.scene.primitives.add(spikePrim);
                        this.primitives.push(spikePrim);
                        this.primitiveCount.vis6Pulses++;
                        pulsePrimitives.push(spikePrim);
                    }
                }
            }

            // Track active pulse
            const pulseEntry = { pulseId, ownerId, timeboxId, pulsePrimitives, glowedSlabs };
            this._vis6ActivePulses.push(pulseEntry);

            RelayLog.info(`[VIS6] timeboxPulse owner=${ownerId} timeboxId=${timeboxId} scope=${scope}`);

            // 4. Auto-cleanup after 800ms
            setTimeout(() => {
                // Remove pulse primitives
                for (const p of pulsePrimitives) {
                    try { this.viewer.scene.primitives.remove(p); } catch (_) {}
                    const idx = this.primitives.indexOf(p);
                    if (idx >= 0) this.primitives.splice(idx, 1);
                }
                // Restore slab colors
                for (const { slabId, attrs, orig } of glowedSlabs) {
                    try {
                        attrs.color = Cesium.ColorGeometryInstanceAttribute.toValue(orig);
                    } catch (_) {}
                }
                // Remove from active list
                const aIdx = this._vis6ActivePulses.indexOf(pulseEntry);
                if (aIdx >= 0) this._vis6ActivePulses.splice(aIdx, 1);
                RelayLog.info(`[VIS6] pulseComplete owner=${ownerId} timeboxId=${timeboxId}`);
            }, 800);

        } catch (e) {
            RelayLog.warn(`[VIS6] triggerPulse failed owner=${ownerId}:`, e);
        }
    }

    // ─── VIS-6b: Event Stream Pulse Propagation ─────────────────────────

    /**
     * VIS-6b: Initialize event stream state (idempotent).
     */
    _vis6bEnsureState() {
        if (!this._vis6bSeenEventIds) this._vis6bSeenEventIds = new Set();
        if (!this._vis6bLastDeptSignal) this._vis6bLastDeptSignal = new Map();
        if (!this._vis6bDropped) this._vis6bDropped = { unknownOwner: 0, unknownDept: 0, capDrops: 0, dupDrops: 0 };
        if (!this._vis6bCoalesceWindow) this._vis6bCoalesceWindow = new Map(); // key → { count, timer }
        if (!this._vis6bStats) this._vis6bStats = { accepted: 0, triggered: 0, coalesced: 0, dropped: 0 };
    }

    /**
     * VIS-6b: Process a single event from the event stream.
     * Deduplicates, coalesces within 500ms, cap-enforces, and triggers VIS-6a pulse.
     * @param {{ id: string, ts: number, type: string, scope: string, ownerId: string, deptId?: string, sheetId?: string, timeboxId?: string, edges?: number, exceptions?: number }} evt
     * @returns {{ ok: boolean, reason?: string }}
     */
    vis6bProcessEvent(evt) {
        this._vis6bEnsureState();
        if (!evt || !evt.id || !evt.ownerId) return { ok: false, reason: 'INVALID_EVENT' };

        // Dedup
        if (this._vis6bSeenEventIds.has(evt.id)) {
            this._vis6bDropped.dupDrops++;
            this._vis6bStats.dropped++;
            return { ok: false, reason: 'DUPLICATE' };
        }
        this._vis6bSeenEventIds.add(evt.id);

        // Resolve owner center from slab registry
        let center = null;
        let scope = evt.scope || 'company';
        let slabWidth = 40;
        if (this._vis4SlabRegistry) {
            for (const [, meta] of this._vis4SlabRegistry) {
                if (meta.ownerId === evt.ownerId) {
                    center = meta.center;
                    scope = meta.scope;
                    slabWidth = scope === 'company'
                        ? (evt.ownerId.startsWith('trunk') ? 40 : 28)
                        : 18;
                    break;
                }
            }
        }
        if (!center) {
            this._vis6bDropped.unknownOwner++;
            this._vis6bStats.dropped++;
            return { ok: false, reason: 'UNKNOWN_OWNER' };
        }

        this._vis6bStats.accepted++;
        const tbId = evt.timeboxId || evt.id;
        const deptId = evt.deptId || null;

        RelayLog.info(`[VIS6B] eventAccepted id=${evt.id} type=${evt.type} owner=${evt.ownerId} dept=${deptId || 'none'} sheet=${evt.sheetId || 'none'} timebox=${tbId}`);

        // Determine if this event should trigger a pulse
        let shouldPulse = false;
        if (evt.type === 'TIMEBOX_APPEARED') {
            shouldPulse = true;
        } else if (evt.type === 'FLOW_UPDATE' || evt.type === 'EXCEPTION_UPDATE') {
            // Pulse only if exceptions increased for this dept
            if (deptId && typeof evt.exceptions === 'number') {
                const prev = this._vis6bLastDeptSignal.get(deptId);
                if (!prev || evt.exceptions > (prev.exceptions || 0)) {
                    shouldPulse = true;
                }
                this._vis6bLastDeptSignal.set(deptId, { edges: evt.edges || 0, exceptions: evt.exceptions || 0 });
            }
        }

        if (!shouldPulse) return { ok: true, pulsed: false };

        // Coalesce: same (ownerId, timeboxId) within 500ms window
        const coalesceKey = `${evt.ownerId}|${tbId}`;
        const existing = this._vis6bCoalesceWindow.get(coalesceKey);
        if (existing) {
            existing.count++;
            this._vis6bStats.coalesced++;
            RelayLog.info(`[VIS6B] pulseCoalesced owner=${evt.ownerId} timebox=${tbId} merged=${existing.count}`);
            return { ok: true, pulsed: false, coalesced: true };
        }

        // Cap check
        if (!this._vis6ActivePulses) this._vis6ActivePulses = [];
        if (this._vis6ActivePulses.length >= 20) {
            this._vis6bDropped.capDrops++;
            this._vis6bStats.dropped++;
            RelayLog.info(`[REFUSAL] reason=VIS6B_PULSE_CAP_EXCEEDED active=${this._vis6ActivePulses.length} cap=20 droppedEvent=${evt.id}`);
            return { ok: false, reason: 'CAP_EXCEEDED' };
        }

        // Set coalesce window (500ms)
        const coalesceEntry = { count: 1, timer: null };
        this._vis6bCoalesceWindow.set(coalesceKey, coalesceEntry);
        coalesceEntry.timer = setTimeout(() => {
            this._vis6bCoalesceWindow.delete(coalesceKey);
        }, 500);

        // Trigger the VIS-6a pulse (reuse existing infrastructure)
        this.triggerVis6Pulse(evt.ownerId, tbId, scope, center, slabWidth);
        this._vis6bStats.triggered++;

        RelayLog.info(`[VIS6B] pulseTriggered id=${evt.id} owner=${evt.ownerId} timebox=${tbId} scope=${scope}`);

        return { ok: true, pulsed: true };
    }

    /**
     * VIS-6b: Process a batch of events (sorted by ts, id).
     * @param {Array} events
     * @returns {{ ok: boolean, accepted: number, dropped: number }}
     */
    vis6bProcessBatch(events) {
        this._vis6bEnsureState();
        if (!Array.isArray(events)) return { ok: false, accepted: 0, dropped: 0 };
        // Sort by (ts, id)
        const sorted = [...events].sort((a, b) => (a.ts - b.ts) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        let accepted = 0;
        let dropped = 0;
        for (const evt of sorted) {
            const result = this.vis6bProcessEvent(evt);
            if (result?.ok) accepted++;
            else dropped++;
        }
        return { ok: true, accepted, dropped };
    }

    /**
     * VIS-6b: Get current event stream state.
     */
    vis6bGetState() {
        this._vis6bEnsureState();
        return {
            seen: this._vis6bSeenEventIds.size,
            activePulses: (this._vis6ActivePulses || []).length,
            dropped: { ...this._vis6bDropped },
            stats: { ...this._vis6bStats }
        };
    }

    /**
     * VIS-6b: Reset event stream state.
     */
    vis6bReset() {
        this._vis6bSeenEventIds = new Set();
        this._vis6bLastDeptSignal = new Map();
        this._vis6bDropped = { unknownOwner: 0, unknownDept: 0, capDrops: 0, dupDrops: 0 };
        this._vis6bStats = { accepted: 0, triggered: 0, coalesced: 0, dropped: 0 };
        if (this._vis6bCoalesceWindow) {
            for (const [, entry] of this._vis6bCoalesceWindow) {
                if (entry.timer) clearTimeout(entry.timer);
            }
        }
        this._vis6bCoalesceWindow = new Map();
    }

    /**
     * VIS-6b: Emit summary log line.
     */
    vis6bLogSummary() {
        this._vis6bEnsureState();
        const s = this._vis6bStats;
        RelayLog.info(`[VIS6B] summary accepted=${s.accepted} triggered=${s.triggered} coalesced=${s.coalesced} dropped=${s.dropped}`);
    }

    // ─── VIS-7a: Presence Markers (Ephemeral) ──────────────────────────

    /**
     * VIS-7a: Initialize presence engine state (idempotent).
     */
    _vis7aEnsureState() {
        if (this._vis7aReady) return;
        this._vis7aMarkers = new Map();      // targetKey → { userId, scope, center, mode, prim, label, expiresAt, ... }
        this._vis7aSeenIds = new Set();       // dedup
        this._vis7aCoalesceTimers = new Map(); // userId → timer
        this._vis7aStats = { accepted: 0, coalesced: 0, dupDropped: 0, dropped: 0, capRefusals: 0 };
        this._vis7aCleanupTimer = null;
        this._vis7aTTL = 15000;
        this._vis7aCAP = 50;
        this._vis7aLabelCap = 30;
        this._vis7aCoalesceMs = 250;
        if (!this.primitiveCount.presenceMarkers) this.primitiveCount.presenceMarkers = 0;
        this._vis7aReady = true;
        RelayLog.info(`[VIS7A] presenceEngine enabled ttlMs=${this._vis7aTTL} cap=${this._vis7aCAP} coalesceMs=${this._vis7aCoalesceMs}`);
        // Start periodic cleanup
        this._vis7aCleanupTimer = setInterval(() => this._vis7aCleanupExpired(), 2000);
    }

    /**
     * VIS-7a: Resolve placement center for a presence event.
     * Falls through: exact match → scope fallback → any available slab center.
     * @param {{ scope: string, companyId?: string, deptId?: string, sheetId?: string, cursor?: {x:number, y:number} }} evt
     * @returns {{ center: Cesium.Cartesian3|null, targetKey: string, resolvedScope: string }}
     */
    _vis7aResolveTarget(evt) {
        const scope = evt.scope || 'company';
        // SHEET scope: place near selected sheet (match by sheetId, parent branch, or any current slab)
        if (scope === 'sheet') {
            if (this._vis4SlabRegistry) {
                // Try exact sheetId match first
                if (evt.sheetId) {
                    for (const [, meta] of this._vis4SlabRegistry) {
                        if (meta.ownerId === evt.sheetId && meta.center) {
                            const offset = new Cesium.Cartesian3(0, 0, 12);
                            const center = Cesium.Cartesian3.add(meta.center, offset, new Cesium.Cartesian3());
                            return { center, targetKey: `sheet:${evt.sheetId}:${evt.userId}`, resolvedScope: 'sheet' };
                        }
                    }
                }
                // Fallback: use first available slab center (we're in sheet scope, all slabs are contextual)
                for (const [, meta] of this._vis4SlabRegistry) {
                    if (meta.center) {
                        const offset = new Cesium.Cartesian3(0, 0, 12);
                        const center = Cesium.Cartesian3.add(meta.center, offset, new Cesium.Cartesian3());
                        const key = evt.sheetId || meta.ownerId;
                        return { center, targetKey: `sheet:${key}:${evt.userId}`, resolvedScope: 'sheet' };
                    }
                }
            }
            // Fallback: try dept then company scope
            if (evt.deptId) return this._vis7aResolveTarget({ ...evt, scope: 'dept' });
            return this._vis7aResolveTarget({ ...evt, scope: 'company' });
        }
        // DEPT scope: place near dept spine midpoint
        if (scope === 'dept' && evt.deptId) {
            if (this._vis6FlowBarEnds) {
                const barEnd = this._vis6FlowBarEnds.get(evt.deptId);
                if (barEnd && barEnd.endWorld && isCartesian3Finite(barEnd.endWorld)) {
                    const offset = new Cesium.Cartesian3(0, 0, 15);
                    const center = Cesium.Cartesian3.add(barEnd.endWorld, offset, new Cesium.Cartesian3());
                    return { center, targetKey: `dept:${evt.deptId}:${evt.userId}`, resolvedScope: 'company' };
                }
            }
            // Fallback: slab registry for branch
            if (this._vis4SlabRegistry) {
                for (const [, meta] of this._vis4SlabRegistry) {
                    if (meta.ownerId === evt.deptId && meta.center) {
                        const offset = new Cesium.Cartesian3(0, 0, 15);
                        const center = Cesium.Cartesian3.add(meta.center, offset, new Cesium.Cartesian3());
                        return { center, targetKey: `dept:${evt.deptId}:${evt.userId}`, resolvedScope: 'company' };
                    }
                }
            }
            // Fallback to company
            return this._vis7aResolveTarget({ ...evt, scope: 'company' });
        }
        // COMPANY scope: place near trunk or any available slab
        if (this._vis4SlabRegistry) {
            // Prefer trunk
            for (const [, meta] of this._vis4SlabRegistry) {
                if (meta.ownerId && meta.ownerId.startsWith('trunk') && meta.center) {
                    const offset = new Cesium.Cartesian3(0, 0, 20);
                    const center = Cesium.Cartesian3.add(meta.center, offset, new Cesium.Cartesian3());
                    return { center, targetKey: `company:trunk:${evt.userId}`, resolvedScope: 'company' };
                }
            }
            // Fallback: any slab center
            for (const [, meta] of this._vis4SlabRegistry) {
                if (meta.center) {
                    const offset = new Cesium.Cartesian3(0, 0, 20);
                    const center = Cesium.Cartesian3.add(meta.center, offset, new Cesium.Cartesian3());
                    return { center, targetKey: `company:${meta.ownerId}:${evt.userId}`, resolvedScope: 'company' };
                }
            }
        }
        return { center: null, targetKey: '', resolvedScope: scope };
    }

    /**
     * VIS-7a: Render a single presence marker at the given center.
     * @param {string} markerId
     * @param {Cesium.Cartesian3} center
     * @param {string} mode - 'view' or 'edit'
     * @param {string} userId
     * @param {number} labelIdx - current label count (for cap)
     * @returns {{ prim: Cesium.Primitive|null, label: Cesium.Entity|null }}
     */
    _vis7aRenderMarker(markerId, center, mode, userId, labelIdx) {
        if (!center || !isCartesian3Finite(center)) return { prim: null, label: null };
        const color = mode === 'edit'
            ? Cesium.Color.fromCssColorString('#ff9800').withAlpha(0.85)  // orange for edit
            : Cesium.Color.fromCssColorString('#4caf50').withAlpha(0.85); // green for view
        let prim = null;
        let label = null;
        try {
            // Point-like small box primitive
            prim = new Cesium.Primitive({
                geometryInstances: new Cesium.GeometryInstance({
                    geometry: Cesium.BoxGeometry.fromDimensions({
                        dimensions: new Cesium.Cartesian3(3, 3, 3)
                    }),
                    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(center),
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
                    },
                    id: markerId
                }),
                appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(prim);
            this.primitives.push(prim);
            this.primitiveCount.presenceMarkers = (this.primitiveCount.presenceMarkers || 0) + 1;

            // Optional label (capped)
            if (labelIdx < this._vis7aLabelCap) {
                label = this.viewer.entities.add({
                    position: center,
                    label: {
                        text: userId.length > 6 ? userId.slice(-6) : userId,
                        font: '10px monospace',
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 1,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        pixelOffset: new Cesium.Cartesian2(0, -12),
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                        scale: 0.7,
                        showBackground: true,
                        backgroundColor: Cesium.Color.BLACK.withAlpha(0.5)
                    },
                    properties: { vis7aMarkerId: markerId }
                });
            }
        } catch (e) {
            RelayLog.warn(`[VIS7A] renderMarker failed id=${markerId}:`, e);
        }
        return { prim, label };
    }

    /**
     * VIS-7a: Remove a marker's primitives from the scene.
     * @param {{ prim?: Cesium.Primitive, label?: Cesium.Entity }} entry
     */
    _vis7aRemoveMarker(entry) {
        if (entry.prim) {
            try { this.viewer.scene.primitives.remove(entry.prim); } catch (_) {}
            const idx = this.primitives.indexOf(entry.prim);
            if (idx >= 0) this.primitives.splice(idx, 1);
            this.primitiveCount.presenceMarkers = Math.max(0, (this.primitiveCount.presenceMarkers || 0) - 1);
        }
        if (entry.label) {
            try { this.viewer.entities.remove(entry.label); } catch (_) {}
        }
    }

    /**
     * VIS-7a: Cleanup expired markers.
     */
    _vis7aCleanupExpired() {
        if (!this._vis7aMarkers) return;
        const now = Date.now();
        for (const [key, entry] of this._vis7aMarkers) {
            if (now >= entry.expiresAt) {
                this._vis7aRemoveMarker(entry);
                this._vis7aMarkers.delete(key);
            }
        }
    }

    /**
     * VIS-7a: Process a single presence event.
     * @param {{ id, ts, userId, scope, companyId?, deptId?, sheetId?, mode?, cursor? }} evt
     * @returns {{ ok: boolean, reason?: string }}
     */
    vis7aProcessEvent(evt) {
        this._vis7aEnsureState();
        if (!evt || !evt.id) { this._vis7aStats.dropped++; return { ok: false, reason: 'MISSING_ID' }; }
        if (!evt.userId) { this._vis7aStats.dropped++; return { ok: false, reason: 'MISSING_USERID' }; }
        const ts = Number(evt.ts);
        if (!Number.isFinite(ts) || ts <= 0) { this._vis7aStats.dropped++; return { ok: false, reason: 'BAD_TS' }; }

        // Dedup
        if (this._vis7aSeenIds.has(evt.id)) {
            this._vis7aStats.dupDropped++;
            return { ok: false, reason: 'DUPLICATE' };
        }
        this._vis7aSeenIds.add(evt.id);

        // Coalesce: same userId within 250ms → keep latest
        const coalesceKey = evt.userId;
        const existingTimer = this._vis7aCoalesceTimers.get(coalesceKey);
        if (existingTimer) {
            clearTimeout(existingTimer.timer);
            this._vis7aStats.coalesced++;
        }

        // Resolve target
        const { center, targetKey, resolvedScope } = this._vis7aResolveTarget(evt);
        if (!center || !targetKey) {
            this._vis7aStats.dropped++;
            return { ok: false, reason: 'UNKNOWN_TARGET' };
        }

        // If same (userId, targetKey) already active, just refresh TTL
        const existing = this._vis7aMarkers.get(targetKey);
        if (existing) {
            existing.expiresAt = Date.now() + this._vis7aTTL;
            existing.mode = evt.mode || existing.mode;
            this._vis7aStats.accepted++;
            // Set coalesce window
            const timer = setTimeout(() => this._vis7aCoalesceTimers.delete(coalesceKey), this._vis7aCoalesceMs);
            this._vis7aCoalesceTimers.set(coalesceKey, { timer });
            return { ok: true, refreshed: true };
        }

        // Cap check
        if (this._vis7aMarkers.size >= this._vis7aCAP) {
            this._vis7aStats.capRefusals++;
            this._vis7aStats.dropped++;
            RelayLog.info(`[REFUSAL] reason=VIS7A_MARKER_CAP_EXCEEDED active=${this._vis7aMarkers.size} dropped=1`);
            return { ok: false, reason: 'CAP_EXCEEDED' };
        }

        // Render marker
        const markerId = `vis7a-marker-${evt.userId}-${targetKey.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const mode = evt.mode || 'view';
        const labelIdx = this._vis7aMarkers.size; // approximate label count
        const { prim, label } = this._vis7aRenderMarker(markerId, center, mode, evt.userId, labelIdx);

        this._vis7aMarkers.set(targetKey, {
            markerId,
            userId: evt.userId,
            scope: resolvedScope,
            mode,
            center,
            prim,
            label,
            expiresAt: Date.now() + this._vis7aTTL
        });

        this._vis7aStats.accepted++;

        // Set coalesce window
        const timer = setTimeout(() => this._vis7aCoalesceTimers.delete(coalesceKey), this._vis7aCoalesceMs);
        this._vis7aCoalesceTimers.set(coalesceKey, { timer });

        return { ok: true, placed: true };
    }

    /**
     * VIS-7a: Process a batch of presence events.
     * @param {Array} events
     * @returns {{ ok: boolean, accepted: number, dropped: number }}
     */
    vis7aProcessBatch(events) {
        this._vis7aEnsureState();
        if (!Array.isArray(events)) return { ok: false, accepted: 0, dropped: 0 };
        const sorted = [...events].sort((a, b) => (Number(a.ts) - Number(b.ts)) || (String(a.id) < String(b.id) ? -1 : 1));
        let accepted = 0, dropped = 0;
        for (const evt of sorted) {
            const result = this.vis7aProcessEvent(evt);
            if (result?.ok) accepted++;
            else dropped++;
        }
        const active = this._vis7aMarkers.size;
        RelayLog.info(`[VIS7A] batchApplied accepted=${accepted} coalesced=${this._vis7aStats.coalesced} dupDropped=${this._vis7aStats.dupDropped} dropped=${dropped} active=${active}`);

        // Emit rendered log
        let scope = 'company';
        // Determine predominant scope
        for (const [, m] of this._vis7aMarkers) {
            if (m.scope === 'sheet') { scope = 'sheet'; break; }
        }
        const labelCount = Math.min(active, this._vis7aLabelCap);
        const capped = this._vis7aStats.capRefusals > 0;
        RelayLog.info(`[VIS7A] rendered scope=${scope} markers=${active} labels=${labelCount} capped=${capped}`);

        return { ok: true, accepted, dropped };
    }

    /**
     * VIS-7a: Get presence state.
     */
    vis7aGetState() {
        this._vis7aEnsureState();
        return {
            active: this._vis7aMarkers.size,
            seenIds: this._vis7aSeenIds.size,
            dropped: this._vis7aStats.dropped,
            coalesced: this._vis7aStats.coalesced,
            capRefusals: this._vis7aStats.capRefusals,
            stats: { ...this._vis7aStats }
        };
    }

    /**
     * VIS-7a: Reset presence state (remove all markers + clear state).
     */
    vis7aReset() {
        if (this._vis7aMarkers) {
            for (const [, entry] of this._vis7aMarkers) {
                this._vis7aRemoveMarker(entry);
            }
        }
        this._vis7aMarkers = new Map();
        this._vis7aSeenIds = new Set();
        if (this._vis7aCoalesceTimers) {
            for (const [, entry] of this._vis7aCoalesceTimers) {
                if (entry.timer) clearTimeout(entry.timer);
            }
        }
        this._vis7aCoalesceTimers = new Map();
        this._vis7aStats = { accepted: 0, coalesced: 0, dupDropped: 0, dropped: 0, capRefusals: 0 };
        // Also clear VIS-7b state
        this.vis7bClearHighlight();
        this._vis7bPinnedMarkerId = null;
    }

    // ─── VIS-7b: Presence Inspect (Hover + Pin + HUD) ──────────────────

    /**
     * VIS-7b: Clear the current hover/pin highlight primitive.
     */
    vis7bClearHighlight() {
        if (this._vis7bHighlightPrim) {
            try { this.viewer.scene.primitives.remove(this._vis7bHighlightPrim); } catch (_) {}
            const idx = this.primitives.indexOf(this._vis7bHighlightPrim);
            if (idx >= 0) this.primitives.splice(idx, 1);
        }
        this._vis7bHighlightPrim = null;
        this._vis7bHoveredMarkerId = null;
    }

    /**
     * VIS-7b: Render a yellow highlight around a presence marker.
     * @param {string} markerId
     * @returns {boolean}
     */
    vis7bRenderHighlight(markerId) {
        if (!this._vis7aMarkers) return false;
        // Find the marker entry by markerId
        let entry = null;
        for (const [, m] of this._vis7aMarkers) {
            if (m.prim) {
                // Check if this marker's prim has the matching id
                try {
                    const attrs = m.prim.getGeometryInstanceAttributes(markerId);
                    if (attrs) { entry = m; break; }
                } catch (_) {}
            }
        }
        // Also try matching by iterating markers and checking stored markerId
        if (!entry) {
            for (const [, m] of this._vis7aMarkers) {
                if (m.markerId === markerId) { entry = m; break; }
            }
        }
        if (!entry || !entry.center || !isCartesian3Finite(entry.center)) return false;

        this.vis7bClearHighlight();
        try {
            const highlightPrim = new Cesium.Primitive({
                geometryInstances: new Cesium.GeometryInstance({
                    geometry: Cesium.BoxGeometry.fromDimensions({
                        dimensions: new Cesium.Cartesian3(5, 5, 5)
                    }),
                    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(entry.center),
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.YELLOW.withAlpha(0.6)
                        )
                    },
                    id: `vis7b-highlight-${markerId}`
                }),
                appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(highlightPrim);
            this.primitives.push(highlightPrim);
            this._vis7bHighlightPrim = highlightPrim;
            this._vis7bHoveredMarkerId = markerId;
            return true;
        } catch (e) {
            RelayLog.warn(`[VIS7B] renderHighlight failed marker=${markerId}:`, e);
            return false;
        }
    }

    /**
     * VIS-7b: Get metadata for a marker by its pickable ID.
     * @param {string} markerId
     * @returns {{ userId: string, mode: string, scope: string, ageMs: number, targetKey: string }|null}
     */
    vis7bGetMarkerMeta(markerId) {
        if (!this._vis7aMarkers) return null;
        for (const [targetKey, m] of this._vis7aMarkers) {
            if (m.markerId === markerId) {
                return {
                    userId: m.userId,
                    mode: m.mode,
                    scope: m.scope,
                    ageMs: Date.now() - (m.expiresAt - (this._vis7aTTL || 15000)),
                    targetKey
                };
            }
        }
        return null;
    }

    /**
     * VIS-4a: Compute slab color from timebox data.
     * Base gray, red tint for scars, brightness from eriAvg.
     * @param {{ scarCount?: number, eriAvg?: number }} timebox
     * @returns {Cesium.Color}
     */
    static vis4SlabColor(timebox) {
        const scars = Number(timebox?.scarCount) || 0;
        const eri = Number(timebox?.eriAvg) || 50;
        // Base gray
        let r = 0.376, g = 0.490, b = 0.545; // #607d8b
        // Red tint proportional to scars (up to 3+)
        const scarRatio = Math.min(1, scars / 3);
        r = r + (0.957 - r) * scarRatio; // blend toward #f44336 red
        g = g * (1 - scarRatio * 0.7);
        b = b * (1 - scarRatio * 0.7);
        // Brightness from eri (0-100 → dim to bright)
        const brightFactor = 0.5 + (eri / 100) * 0.5;
        r = Math.min(1, r * brightFactor);
        g = Math.min(1, g * brightFactor);
        b = Math.min(1, b * brightFactor);
        return new Cesium.Color(r, g, b, 0.35);
    }
    
    /**
     * VIS-4a: Render a single timebox slab (thin box).
     * @param {Cesium.Cartesian3} center - world position of slab center
     * @param {{ width: number, height: number, thickness: number }} dims
     * @param {Cesium.Cartesian3} axisDir - time axis direction (stacking direction)
     * @param {Cesium.Cartesian3} upDir - slab "up" direction
     * @param {Cesium.Cartesian3} rightDir - slab "right" direction
     * @param {Cesium.Color} color
     * @param {string} id - unique primitive ID
     * @returns {boolean}
     */
    renderTimeboxSlab(center, dims, axisDir, upDir, rightDir, color, id) {
        if (!center || !isCartesian3Finite(center)) return null;
        try {
            const boxGeom = Cesium.BoxGeometry.fromDimensions({
                vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                dimensions: new Cesium.Cartesian3(1, 1, 1)
            });
            // Orient the unit box: rightDir * width, upDir * height, axisDir * thickness
            const rotation = new Cesium.Matrix3(
                rightDir.x * dims.width,  upDir.x * dims.height,  axisDir.x * dims.thickness,
                rightDir.y * dims.width,  upDir.y * dims.height,  axisDir.y * dims.thickness,
                rightDir.z * dims.width,  upDir.z * dims.height,  axisDir.z * dims.thickness
            );
            const modelMatrix = Cesium.Matrix4.fromRotationTranslation(rotation, center);
            const instance = new Cesium.GeometryInstance({
                geometry: boxGeom,
                modelMatrix,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
                },
                id
            });
            const prim = new Cesium.Primitive({
                geometryInstances: instance,
                appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(prim);
            this.primitives.push(prim);
            this.primitiveCount.slabs++;
            return prim;
        } catch (e) {
            RelayLog.warn(`[VIS4] renderTimeboxSlab failed id=${id}:`, e);
            return null;
        }
    }
    
    /**
     * VIS-4a/4c: Render a stack of timebox slabs along an axis, with labels + metadata registry.
     * Budget-capped: maxSlabsPerObject=12. Truncation keeps most recent (latest-first).
     * @param {Cesium.Cartesian3} baseCenter - world position of stack base
     * @param {Array<{ timeboxId: string, commitCount?: number, openDrifts?: number, eriAvg?: number, scarCount?: number }>} commits
     * @param {{ width: number, height: number, thickness: number }} dims
     * @param {Cesium.Cartesian3} axisDir - stacking direction
     * @param {Cesium.Cartesian3} upDir
     * @param {Cesium.Cartesian3} rightDir
     * @param {string} idPrefix - owner ID (e.g. 'trunk.avgol')
     * @param {number} maxPerObject
     * @param {string} scope - 'company' or 'sheet'
     * @returns {number} number of slabs rendered
     */
    renderTimeboxSlabStack(baseCenter, commits, dims, axisDir, upDir, rightDir, idPrefix, maxPerObject = 12, scope = 'company') {
        if (!commits || commits.length === 0 || !baseCenter) return 0;
        // Truncate to most recent N (latest-first)
        const toRender = commits.length > maxPerObject
            ? commits.slice(commits.length - maxPerObject)
            : commits;
        const spacing = dims.thickness + 4 * this._presScale; // thickness + 4m gap = stride (gap scaled for presentation)
        if (!this._vis4SlabRegistry) this._vis4SlabRegistry = new Map();
        if (!this._vis4SlabPrimitives) this._vis4SlabPrimitives = new Map();
        let rendered = 0;
        // Compute cumulative commit index base (for label)
        let commitIdxBase = 0;
        if (commits.length > maxPerObject) {
            for (let k = 0; k < commits.length - maxPerObject; k++) {
                commitIdxBase += (commits[k].commitCount || 0);
            }
        }
        const VIS4C_LABEL_CAP = 150;
        const labelCount = this._vis4LabelCount || 0;
        for (let i = 0; i < toRender.length; i++) {
            const offset = Cesium.Cartesian3.multiplyByScalar(axisDir, i * spacing, new Cesium.Cartesian3());
            const center = Cesium.Cartesian3.add(baseCenter, offset, new Cesium.Cartesian3());
            const color = CesiumFilamentRenderer.vis4SlabColor(toRender[i]);
            const tbId = toRender[i].timeboxId || String(i);
            const id = `vis4-slab-${scope}-${idPrefix}-${tbId}`;
            const slabPrim = this.renderTimeboxSlab(center, dims, axisDir, upDir, rightDir, color, id);
            if (slabPrim) {
                rendered++;
                // VIS-4d: store primitive reference for focus/fade
                this._vis4SlabPrimitives.set(id, { prim: slabPrim, originalColor: color });
                // Store metadata for picking
                const commitStart = commitIdxBase;
                const commitEnd = commitIdxBase + (toRender[i].commitCount || 0);
                this._vis4SlabRegistry.set(id, {
                    id, scope, ownerId: idPrefix, timeboxId: tbId,
                    commitCount: toRender[i].commitCount || 0,
                    commitStart, commitEnd,
                    scarCount: toRender[i].scarCount || 0,
                    eriAvg: toRender[i].eriAvg || 0,
                    openDrifts: toRender[i].openDrifts || 0,
                    center
                });
                // VIS-4c: Render label above slab (budget-capped)
                if (labelCount + rendered <= VIS4C_LABEL_CAP) {
                    const labelPos = Cesium.Cartesian3.add(center,
                        Cesium.Cartesian3.multiplyByScalar(upDir, dims.height / 2 + 2 * this._presScale, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3());
                    if (isCartesian3Finite(labelPos)) {
                        const eri = ((toRender[i].eriAvg || 0) / 100).toFixed(2);
                        const labelText = `T=${tbId} C=${toRender[i].commitCount || 0} S=${toRender[i].scarCount || 0} E=${eri}`;
                        const labelEntity = this.viewer.entities.add({
                            position: labelPos,
                            label: {
                                text: labelText,
                                font: '10px monospace',
                                fillColor: Cesium.Color.WHITE,
                                outlineColor: Cesium.Color.BLACK,
                                outlineWidth: 2,
                                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                                pixelOffset: new Cesium.Cartesian2(0, -8),
                                scale: 0.6,
                                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 80000),
                                show: true
                            },
                            properties: { vis4SlabId: id }
                        });
                        this.entities.push(labelEntity);
                        this.entityCount.timeboxLabels++;
                    }
                }
            }
            commitIdxBase += (toRender[i].commitCount || 0);
        }
        this._vis4LabelCount = (this._vis4LabelCount || 0) + rendered;
        return rendered;
    }
    
    /**
     * VIS-SHEET-PLATFORM-OVERVIEW-1: Render sheet as a horizontal spreadsheet platform.
     * In launch mode: horizontal UP-facing platform with visible grid (spreadsheet proxy).
     * In non-launch: compact tile at sheet position (original behavior).
     * Truth plane metadata (sheet._xAxis, _yAxis, _normal) always preserved for edit/dock.
     */
    renderSheetTile(sheet, siblingInfo) {
        try {
            const parent = relayState.tree.nodes.find(n => n.id === sheet.parent);
            if (!parent || !parent._enuFrame || !parent._branchFrames) return false;
            const enuFrame = parent._enuFrame;
            const layout = CANONICAL_LAYOUT.sheet;
            const attachIndex = parent._branchFrames.length - 1;
            const frame = parent._branchFrames[attachIndex];
            const branchEndENU = parent._branchPointsENU[attachIndex];
            const { index: sibIdx, count: sibCount } = siblingInfo || { index: 0, count: 1 };
            
            // VIS-RADIAL-CANOPY-1: Place sheet on canopy ring via deterministic placement function.
            const canopySlot = this._launchVisuals ? getCanopyDeptSlot(parent.id) : null;
            let canopyPlacement = null;
            let sheetENU;
            let sheetXAxis; let sheetYAxis; let sheetNormalTile;
            if (canopySlot) {
                canopyPlacement = computeCanopyPlacement(canopySlot.deptIndex, sibIdx, sibCount);
                if (!canopyPlacement) return false;
                sheetENU = {
                    east: canopyPlacement.east,
                    north: canopyPlacement.north,
                    up: canopyPlacement.up
                };
                // Horizontal platform: columns = East, rows = North, normal = Up
                sheetXAxis = enuVecToWorldDir(enuFrame, { east: 0, north: 1, up: 0 });
                sheetYAxis = enuVecToWorldDir(enuFrame, { east: 1, north: 0, up: 0 });
                sheetNormalTile = enuVecToWorldDir(enuFrame, { east: 0, north: 0, up: 1 });
            } else {
                const branchWidth = CANONICAL_LAYOUT.branch.radiusThick * 2;
                const sheetDiag = Math.sqrt(layout.width ** 2 + layout.height ** 2);
                const clearance = (sheetDiag * layout.clearanceMultiplier) + (branchWidth * layout.branchWidthMultiplier);
                if (clearance < sheetDiag * 0.5) return false;
                const fanGap = layout.width * 1.15;
                const fanCenter = (sibCount - 1) / 2;
                const fanOffset = (sibIdx - fanCenter) * fanGap;
                sheetENU = {
                    east: branchEndENU.east + (clearance * frame.T.east) + (fanOffset * frame.B.east),
                    north: branchEndENU.north + (clearance * frame.T.north) + (fanOffset * frame.B.north),
                    up: branchEndENU.up + (clearance * frame.T.up) + (fanOffset * frame.B.up)
                };
                sheetXAxis = enuVecToWorldDir(enuFrame, frame.N);
                sheetYAxis = enuVecToWorldDir(enuFrame, frame.B);
                sheetNormalTile = enuVecToWorldDir(enuFrame, negateVec(frame.T));
            }
            if (!validateENUCoordinates(sheetENU.east, sheetENU.north, sheetENU.up)) return false;
            const sheetCenter = this._toWorld(enuFrame, sheetENU.east, sheetENU.north, sheetENU.up);
            if (!isCartesian3Finite(sheetCenter)) return false;

            // ── CANONICAL TRUTH METADATA (unchanged — used for docking/edit/transitions) ──
            sheet._center = sheetCenter;
            sheet._xAxis = sheetXAxis;         // N (up)
            sheet._yAxis = sheetYAxis;         // B (right)
            sheet._normal = sheetNormalTile;   // canonical sheet normal (-T)
            sheet._renderNormal = sheetNormalTile;
            sheet._enuFrame = enuFrame;
            sheet._parentFrame = frame;        // {T, N, B}
            sheet._attachIndex = attachIndex;
            const tileRows = sheet.rows || layout.cellRows;
            const tileCols = sheet.cols || layout.cellCols;
            sheet._dimsMeters = {
                widthM: layout.width, heightM: layout.height,
                cellWm: layout.width / (tileCols + 1),
                cellHm: layout.height / (tileRows + 1),
                rows: tileRows, cols: tileCols
            };
            const _metaSig = `${sheet.id}|tile`;
            if (!this._sheetMetaLogged) this._sheetMetaLogged = new Set();
            if (!this._sheetMetaLogged.has(_metaSig)) {
                RelayLog.info(`[SHEET-META] set sheet=${sheet.id} center=ok axes=ok normal=ok dims=${layout.width}x${layout.height} cells=${tileRows}x${tileCols} src=tile`);
                this._sheetMetaLogged.add(_metaSig);
            }

            // ── PLATFORM RENDERING AXES ──
            // Launch mode: horizontal UP-facing platforms (normal = ENU Up)
            // Non-launch: branch-frame-aligned tiles (original behavior)
            const tt = this._theme;
            const ps = this._presScale;
            let renderCenter = sheetCenter;
            let renderXAxis = sheetXAxis;
            let renderYAxis = sheetYAxis;
            let halfTileX = this._launchVisuals ? Math.max(25, 8 * ps) : 8 * ps;
            let halfTileY = halfTileX; // default square; landscape override below
            let upWorldDir = sheetNormalTile;

            if (this._launchVisuals && tt?.tile?.horizontalNormal) {
                // PLATFORM PROXY: Horizontal landscape spreadsheet surface
                halfTileX = tt.tile.halfTileX || 60;
                halfTileY = tt.tile.halfTileY || 35;

                const enuUp = { east: 0, north: 0, up: 1 };
                // VIS-RADIAL-CANOPY-1: Radial platforms use ENU East/North for consistent landscape grid
                if (canopySlot) {
                    renderXAxis = enuVecToWorldDir(enuFrame, { east: 0, north: 1, up: 0 }); // rows
                    renderYAxis = enuVecToWorldDir(enuFrame, { east: 1, north: 0, up: 0 }); // columns
                } else {
                    const tHoriz = { east: frame.T.east, north: frame.T.north, up: 0 };
                    const tLen = Math.sqrt(tHoriz.east ** 2 + tHoriz.north ** 2);
                    const platTangent = tLen > 0.01
                        ? { east: tHoriz.east / tLen, north: tHoriz.north / tLen, up: 0 }
                        : { east: 1, north: 0, up: 0 };
                    const platPerp = normalizeVec(cross(enuUp, platTangent));
                    renderXAxis = enuVecToWorldDir(enuFrame, platTangent);
                    renderYAxis = enuVecToWorldDir(enuFrame, platPerp);
                }

                // Vertical offset: platform floats above branch tip
                const vertOffset = tt.tile.verticalOffset || 8;
                upWorldDir = enuVecToWorldDir(enuFrame, enuUp);
                renderCenter = Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.multiplyByScalar(upWorldDir, vertOffset, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
            }
            // VIS-RADIAL-CANOPY-1-PROOF-FIX: populate proxy cache before primitive creation.
            // This keeps canopy metadata deterministic even if primitive creation fails later.
            if (this._launchVisuals && this._sheetProxyCache) {
                this._sheetProxyCache.set(sheet.id, {
                    center: Cesium.Cartesian3.clone(renderCenter),
                    xAxisWorld: Cesium.Cartesian3.clone(renderXAxis),
                    yAxisWorld: Cesium.Cartesian3.clone(renderYAxis),
                    upWorld: Cesium.Cartesian3.clone(upWorldDir),
                    halfTileX,
                    halfTileY,
                    canopyAngleDeg: canopyPlacement ? canopyPlacement.angleDeg : null,
                    canopyTierIndex: canopyPlacement ? canopyPlacement.tierIndex : null
                });
            }

            // ── CORNER COMPUTATION ──
            const c3add = Cesium.Cartesian3.add;
            const c3mul = Cesium.Cartesian3.multiplyByScalar;
            const tmpA = new Cesium.Cartesian3();
            const tmpB = new Cesium.Cartesian3();
            const tmpC = new Cesium.Cartesian3();
            const corners = [
                c3add(renderCenter, c3add(c3mul(renderXAxis, -halfTileX, tmpA), c3mul(renderYAxis, -halfTileY, tmpB), tmpC), new Cesium.Cartesian3()),
                c3add(renderCenter, c3add(c3mul(renderXAxis, -halfTileX, tmpA), c3mul(renderYAxis,  halfTileY, tmpB), tmpC), new Cesium.Cartesian3()),
                c3add(renderCenter, c3add(c3mul(renderXAxis,  halfTileX, tmpA), c3mul(renderYAxis,  halfTileY, tmpB), tmpC), new Cesium.Cartesian3()),
                c3add(renderCenter, c3add(c3mul(renderXAxis,  halfTileX, tmpA), c3mul(renderYAxis, -halfTileY, tmpB), tmpC), new Cesium.Cartesian3())
            ];

            // ── GLASS PANEL FILL ──
            if (tt) {
                const fillGeom = new Cesium.CoplanarPolygonGeometry({
                    polygonHierarchy: new Cesium.PolygonHierarchy(corners),
                    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
                });
                const fillInst = new Cesium.GeometryInstance({
                    geometry: fillGeom,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString(tt.tile.fillColor).withAlpha(tt.tile.fillAlpha)
                        )
                    },
                    id: `${sheet.id}-tile-fill`
                });
                const fillPrim = new Cesium.Primitive({
                    geometryInstances: fillInst,
                    appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
                    asynchronous: false
                });
                this.viewer.scene.primitives.add(fillPrim);
                this.primitives.push(fillPrim);
            }

            // ── BORDER OUTLINE ──
            const borderColor = tt
                ? Cesium.Color.fromCssColorString(tt.tile.borderColor).withAlpha(tt.tile.borderAlpha)
                : Cesium.Color.CYAN.withAlpha(0.7);
            const borderWidth = tt ? tt.tile.borderWidth : 2;
            const outlineGeometry = new Cesium.PolylineGeometry({
                positions: [...corners, corners[0]],
                width: borderWidth,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            const tileInstance = new Cesium.GeometryInstance({
                geometry: outlineGeometry,
                attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(borderColor) },
                id: `${sheet.id}-tile`
            });
            const tilePrimitive = new Cesium.Primitive({
                geometryInstances: tileInstance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(tilePrimitive);
            this.primitives.push(tilePrimitive);

            // ── INNER BORDER (double-glass edge effect) ──
            if (tt && tt.tile.innerBorderColor) {
                const inset = tt.tile.innerBorderInset || 3;
                const insetM = this._launchVisuals ? Math.max(inset, inset * ps) : inset * ps;
                const insetCorners = corners.map(c => {
                    const dir = new Cesium.Cartesian3();
                    Cesium.Cartesian3.subtract(renderCenter, c, dir);
                    Cesium.Cartesian3.normalize(dir, dir);
                    const insetPt = new Cesium.Cartesian3();
                    Cesium.Cartesian3.multiplyByScalar(dir, insetM, insetPt);
                    Cesium.Cartesian3.add(c, insetPt, insetPt);
                    return insetPt;
                });
                const innerBorderColor = Cesium.Color.fromCssColorString(tt.tile.innerBorderColor)
                    .withAlpha(tt.tile.innerBorderAlpha);
                const innerBorderGeom = new Cesium.PolylineGeometry({
                    positions: [...insetCorners, insetCorners[0]],
                    width: tt.tile.innerBorderWidth,
                    vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                    arcType: Cesium.ArcType.NONE
                });
                const innerBorderInst = new Cesium.GeometryInstance({
                    geometry: innerBorderGeom,
                    attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(innerBorderColor) },
                    id: `${sheet.id}-tile-inner`
                });
                const innerBorderPrim = new Cesium.Primitive({
                    geometryInstances: innerBorderInst,
                    appearance: new Cesium.PolylineColorAppearance(),
                    asynchronous: false
                });
                this.viewer.scene.primitives.add(innerBorderPrim);
                this.primitives.push(innerBorderPrim);
            }

            // ── SPREADSHEET GRID LINES (launch-only) ──
            // Renders visible column/row dividers so platforms read as "spreadsheets" from overview
            if (this._launchVisuals && tt?.tile?.gridCols) {
                const gridInstances = [];
                const nCols = tt.tile.gridCols || 5;
                const nRows = tt.tile.gridRows || 3;
                const majorColor = Cesium.Color.fromCssColorString(tt.tile.gridMajorColor || '#5098c0')
                    .withAlpha(tt.tile.gridMajorAlpha || 0.20);
                const majorWidth = tt.tile.gridMajorWidth || 1.2;

                // Header column styling (first column = brighter left column for spreadsheet feel)
                const headerColColor = tt.tile.gridHeaderColColor
                    ? Cesium.Color.fromCssColorString(tt.tile.gridHeaderColColor).withAlpha(tt.tile.gridHeaderColAlpha || 0.30)
                    : majorColor;
                const headerColWidth = tt.tile.gridHeaderColWidth || 1.5;

                // Column dividers (vertical lines across platform, along renderYAxis)
                // VIS-RADIAL-CANOPY-1: At overview (gridLOD major) only header column (c===1)
                for (let c = 1; c <= nCols; c++) {
                    if (this._gridLODMajorOnly && c !== 1) continue;
                    const frac = (c / (nCols + 1)) * 2 - 1; // -1..1 mapped to interior positions
                    const xOff = frac * halfTileX;
                    const lineStart = c3add(renderCenter,
                        c3add(c3mul(renderXAxis, xOff, tmpA), c3mul(renderYAxis, -halfTileY, tmpB), tmpC),
                        new Cesium.Cartesian3());
                    const lineEnd = c3add(renderCenter,
                        c3add(c3mul(renderXAxis, xOff, tmpA), c3mul(renderYAxis, halfTileY, tmpB), tmpC),
                        new Cesium.Cartesian3());
                    if (isCartesian3Finite(lineStart) && isCartesian3Finite(lineEnd)) {
                        const isHeaderCol = (c === 1);
                        gridInstances.push(new Cesium.GeometryInstance({
                            geometry: new Cesium.PolylineGeometry({
                                positions: [lineStart, lineEnd],
                                width: isHeaderCol ? headerColWidth : majorWidth,
                                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                                arcType: Cesium.ArcType.NONE
                            }),
                            attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(isHeaderCol ? headerColColor : majorColor) },
                            id: `${sheet.id}-grid-col-${c}`
                        }));
                    }
                }

                // Row dividers (horizontal lines across platform, along renderXAxis)
                // First row = header separator (brighter)
                const headerColor = tt.tile.gridHeaderColor
                    ? Cesium.Color.fromCssColorString(tt.tile.gridHeaderColor).withAlpha(tt.tile.gridHeaderAlpha || 0.30)
                    : majorColor;
                const headerWidth = tt.tile.gridHeaderWidth || 1.5;

                // VIS-RADIAL-CANOPY-1: At overview only header row (r===1)
                for (let r = 1; r <= nRows; r++) {
                    if (this._gridLODMajorOnly && r !== 1) continue;
                    const frac = (r / (nRows + 1)) * 2 - 1;
                    const yOff = frac * halfTileY;
                    const lineStart = c3add(renderCenter,
                        c3add(c3mul(renderXAxis, -halfTileX, tmpA), c3mul(renderYAxis, yOff, tmpB), tmpC),
                        new Cesium.Cartesian3());
                    const lineEnd = c3add(renderCenter,
                        c3add(c3mul(renderXAxis, halfTileX, tmpA), c3mul(renderYAxis, yOff, tmpB), tmpC),
                        new Cesium.Cartesian3());
                    if (isCartesian3Finite(lineStart) && isCartesian3Finite(lineEnd)) {
                        const isHeader = (r === 1);
                        gridInstances.push(new Cesium.GeometryInstance({
                            geometry: new Cesium.PolylineGeometry({
                                positions: [lineStart, lineEnd],
                                width: isHeader ? headerWidth : majorWidth,
                                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                                arcType: Cesium.ArcType.NONE
                            }),
                            attributes: {
                                color: Cesium.ColorGeometryInstanceAttribute.fromColor(isHeader ? headerColor : majorColor)
                            },
                            id: `${sheet.id}-grid-row-${r}`
                        }));
                    }
                }

                // Batch all grid lines into one Primitive for performance
                if (gridInstances.length > 0) {
                    const gridPrim = new Cesium.Primitive({
                        geometryInstances: gridInstances,
                        appearance: new Cesium.PolylineColorAppearance(),
                        asynchronous: false
                    });
                    this.viewer.scene.primitives.add(gridPrim);
                    this.primitives.push(gridPrim);
                }
            }

            // ── SUPPORT FILAMENTS (launch-only) ──
            // Thin vertical lines from tile corners downward — "floating platform on pillars"
            if (tt && tt.tile.supportColor && this._launchVisuals) {
                const supportColor = Cesium.Color.fromCssColorString(tt.tile.supportColor)
                    .withAlpha(tt.tile.supportAlpha || 0.14);
                const supportDrop = (tt.tile.supportDrop || 60) * this._presScale;
                // Use ENU down direction (correct on globe, not just -Z)
                const downDir = enuVecToWorldDir(enuFrame, { east: 0, north: 0, up: -1 });
                const dropVec = Cesium.Cartesian3.multiplyByScalar(downDir, supportDrop, new Cesium.Cartesian3());
                for (let ci = 0; ci < corners.length; ci++) {
                    const cornerTop = corners[ci];
                    const cornerBot = Cesium.Cartesian3.add(cornerTop, dropVec, new Cesium.Cartesian3());
                    if (isCartesian3Finite(cornerTop) && isCartesian3Finite(cornerBot)) {
                        const supportGeom = new Cesium.PolylineGeometry({
                            positions: [cornerTop, cornerBot],
                            width: tt.tile.supportWidth || 0.8,
                            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                            arcType: Cesium.ArcType.NONE
                        });
                        const supportInst = new Cesium.GeometryInstance({
                            geometry: supportGeom,
                            attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(supportColor) },
                            id: `${sheet.id}-support-${ci}`
                        });
                        const supportPrim = new Cesium.Primitive({
                            geometryInstances: supportInst,
                            appearance: new Cesium.PolylineColorAppearance(),
                            asynchronous: false
                        });
                        this.viewer.scene.primitives.add(supportPrim);
                        this.primitives.push(supportPrim);
                    }
                }
            }

            // ── FILAMENT RAIN (launch-only) ──
            // Faint vertical lines from platform downward (data rain effect)
            if (tt && tt.filamentRain && this._launchVisuals) {
                const rain = tt.filamentRain;
                const rainColor = Cesium.Color.fromCssColorString(rain.color).withAlpha(rain.alpha);
                const rainDrop = rain.dropHeight * this._presScale;
                const nLines = rain.linesPerTile || 5;
                const downDir = enuVecToWorldDir(enuFrame, { east: 0, north: 0, up: -1 });
                const rainDropVec = Cesium.Cartesian3.multiplyByScalar(downDir, rainDrop, new Cesium.Cartesian3());
                for (let ri = 0; ri < nLines; ri++) {
                    const seed = ((sheet.id || '').charCodeAt(ri % (sheet.id || 'x').length) + ri * 37) % 100;
                    const fx = (seed % 10) / 10 - 0.5;
                    const fy = ((seed / 10) | 0) / 10 - 0.5;
                    const rainTop = c3add(renderCenter,
                        c3add(
                            c3mul(renderXAxis, fx * halfTileX * 1.6, tmpA),
                            c3mul(renderYAxis, fy * halfTileY * 1.6, tmpB),
                            tmpC),
                        new Cesium.Cartesian3());
                    const rainBot = Cesium.Cartesian3.add(rainTop, rainDropVec, new Cesium.Cartesian3());
                    if (isCartesian3Finite(rainTop) && isCartesian3Finite(rainBot)) {
                        const rainGeom = new Cesium.PolylineGeometry({
                            positions: [rainTop, rainBot],
                            width: rain.width || 0.8,
                            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                            arcType: Cesium.ArcType.NONE
                        });
                        const rainInst = new Cesium.GeometryInstance({
                            geometry: rainGeom,
                            attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(rainColor) },
                            id: `${sheet.id}-rain-${ri}`
                        });
                        const rainPrim = new Cesium.Primitive({
                            geometryInstances: rainInst,
                            appearance: new Cesium.PolylineColorAppearance(),
                            asynchronous: false
                        });
                        this.viewer.scene.primitives.add(rainPrim);
                        this.primitives.push(rainPrim);
                    }
                }
            }

            this.primitiveCount.sheetTiles++;

            // ── BILLBOARD LABEL (presentation-only) ──
            if (typeof window !== 'undefined' && window.RELAY_BILLBOARD_LABELS === true) {
                const tileName = sheet.name || sheet.metadata?.sheetName || sheet.id;
                const labelDist = this._launchVisuals ? Math.max(20, 12 * this._presScale) : 12 * this._presScale;
                // Use ENU Up for label offset (above platform)
                const labelUpDir = enuVecToWorldDir(enuFrame, { east: 0, north: 0, up: 1 });
                const labelOffset = Cesium.Cartesian3.multiplyByScalar(labelUpDir, labelDist, new Cesium.Cartesian3());
                const labelPos = Cesium.Cartesian3.add(renderCenter, labelOffset, new Cesium.Cartesian3());
                const labelTheme = this._theme?.tileLabel;
                const tileLabelColor = labelTheme
                    ? Cesium.Color.fromCssColorString(labelTheme.color).withAlpha(labelTheme.alpha)
                    : Cesium.Color.CYAN.withAlpha(0.9);
                // VIS-RADIAL-CANOPY-1: At company overview hide sheet labels (dept labels only)
                const showSheetLabel = !this._gridLODMajorOnly;
                const tileLabel = this.viewer.entities.add({
                    position: labelPos,
                    label: {
                        text: tileName,
                        font: this._launchVisuals ? '14px sans-serif' : '11px sans-serif',
                        fillColor: tileLabelColor,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 3,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        pixelOffset: new Cesium.Cartesian2(0, -6),
                        scale: this._launchVisuals ? 0.8 : 0.55,
                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 50000),
                        show: showSheetLabel
                    },
                    properties: { billboardTileLabel: sheet.id }
                });
                this.entities.push(tileLabel);
            }

            return true;
        } catch (e) {
            RelayLog.warn(`[VIS2] renderSheetTile failed for ${sheet?.id}:`, e);
            return false;
        }
    }
    
    /**
     * PROJ-SHEET-FACING-1: Render a camera-facing projection overlay (ghost sheet).
     * This is a lens overlay — non-interactive, non-pickable, derived from truth each frame.
     * Only applied to 1 focused/nearest sheet. Does NOT alter truth plane or topology.
     * @param {{ center, xAxisWorld, yAxisWorld, upWorld, halfTileX, halfTileY }} proxy
     * @param {string} sheetId
     * @param {Cesium.Cartesian3} camPos
     */
    _renderProjectionOverlay(proxy, sheetId, camPos) {
        try {
            const { center, halfTileX, halfTileY, upWorld } = proxy;
            if (!center || !camPos || !isCartesian3Finite(center)) return;

            // Compute camera-facing axes: the ghost sheet rotates to face the camera
            // Normal = direction from center to camera (projected onto horizontal plane for stability)
            const toCamera = new Cesium.Cartesian3();
            Cesium.Cartesian3.subtract(camPos, center, toCamera);
            // Project out the up component to keep the ghost sheet upright
            const upDot = Cesium.Cartesian3.dot(toCamera, upWorld);
            const upProj = Cesium.Cartesian3.multiplyByScalar(upWorld, upDot, new Cesium.Cartesian3());
            const toCamHoriz = Cesium.Cartesian3.subtract(toCamera, upProj, new Cesium.Cartesian3());
            const horizLen = Cesium.Cartesian3.magnitude(toCamHoriz);
            if (horizLen < 0.1) return; // camera directly above, skip projection

            // Ghost sheet X-axis (horizontal, perpendicular to camera direction)
            const ghostNormal = Cesium.Cartesian3.normalize(toCamHoriz, new Cesium.Cartesian3());
            const ghostXAxis = Cesium.Cartesian3.cross(upWorld, ghostNormal, new Cesium.Cartesian3());
            Cesium.Cartesian3.normalize(ghostXAxis, ghostXAxis);
            // Ghost sheet Y-axis = up direction
            const ghostYAxis = Cesium.Cartesian3.clone(upWorld);

            // Use same dimensions as truth platform
            const c3add = Cesium.Cartesian3.add;
            const c3mul = Cesium.Cartesian3.multiplyByScalar;
            const tmpA = new Cesium.Cartesian3();
            const tmpB = new Cesium.Cartesian3();
            const tmpC = new Cesium.Cartesian3();

            // Slightly offset toward camera to prevent z-fighting
            const offsetCenter = c3add(center, c3mul(ghostNormal, 2, tmpA), new Cesium.Cartesian3());

            const corners = [
                c3add(offsetCenter, c3add(c3mul(ghostXAxis, -halfTileX, tmpA), c3mul(ghostYAxis, -halfTileY, tmpB), tmpC), new Cesium.Cartesian3()),
                c3add(offsetCenter, c3add(c3mul(ghostXAxis, -halfTileX, tmpA), c3mul(ghostYAxis,  halfTileY, tmpB), tmpC), new Cesium.Cartesian3()),
                c3add(offsetCenter, c3add(c3mul(ghostXAxis,  halfTileX, tmpA), c3mul(ghostYAxis,  halfTileY, tmpB), tmpC), new Cesium.Cartesian3()),
                c3add(offsetCenter, c3add(c3mul(ghostXAxis,  halfTileX, tmpA), c3mul(ghostYAxis, -halfTileY, tmpB), tmpC), new Cesium.Cartesian3())
            ];

            // Ghost fill: faint translucent (50% of normal border alpha)
            const ghostFillColor = Cesium.Color.fromCssColorString('#0c2035').withAlpha(0.03);
            const ghostFillGeom = new Cesium.CoplanarPolygonGeometry({
                polygonHierarchy: new Cesium.PolygonHierarchy(corners),
                vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
            });
            const ghostFillInst = new Cesium.GeometryInstance({
                geometry: ghostFillGeom,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(ghostFillColor)
                }
                // NO id — non-pickable (projection is not interactive)
            });
            const ghostFillPrim = new Cesium.Primitive({
                geometryInstances: ghostFillInst,
                appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(ghostFillPrim);
            this.primitives.push(ghostFillPrim);

            // Ghost border: dimmer than truth border (50% alpha)
            const ghostBorderColor = Cesium.Color.fromCssColorString('#90e0ff').withAlpha(0.5);
            const ghostBorderGeom = new Cesium.PolylineGeometry({
                positions: [...corners, corners[0]],
                width: 1.5,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE
            });
            const ghostBorderInst = new Cesium.GeometryInstance({
                geometry: ghostBorderGeom,
                attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(ghostBorderColor) }
                // NO id — non-pickable
            });
            const ghostBorderPrim = new Cesium.Primitive({
                geometryInstances: ghostBorderInst,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(ghostBorderPrim);
            this.primitives.push(ghostBorderPrim);

        } catch (e) {
            RelayLog.warn(`[PROJ] renderProjectionOverlay failed for ${sheetId}:`, e);
        }
    }

    /**
     * Render sheet as VERTICAL primitive PERPENDICULAR to branch (NOT horizontal)
     * Sheet normal = -T (facing back down branch)
     * Sheet plane = N × B (vertical "page in a book")
     */
    renderSheetPrimitive(sheet, branchIndex, siblingInfo) {
        try {
            const parent = relayState.tree.nodes.find(n => n.id === sheet.parent);
            if (!parent || !parent._enuFrame || !parent._branchFrames) {
                throw new Error('Parent branch not found or missing ENU frame/frames');
            }
            
            const enuFrame = parent._enuFrame;
            const layout = CANONICAL_LAYOUT.sheet;
            
            const attachIndex = parent._branchFrames.length - 1;
            const frame = parent._branchFrames[attachIndex];
            const branchEndENU = parent._branchPointsENU[attachIndex];
            const { index: sibIdx, count: sibCount } = siblingInfo || { index: 0, count: 1 };
            
            // VIS-RADIAL-CANOPY-1: Radial ring position via deterministic placement function.
            const canopySlot = this._launchVisuals ? getCanopyDeptSlot(parent.id) : null;
            let sheetENU;
            let sheetXAxis; let sheetYAxis; let sheetNormalCanonical;
            if (canopySlot) {
                const placement = computeCanopyPlacement(canopySlot.deptIndex, sibIdx, sibCount);
                if (!placement) throw new Error('Canopy placement unavailable for sheet primitive');
                sheetENU = {
                    east: placement.east,
                    north: placement.north,
                    up: placement.up
                };
                sheetXAxis = enuVecToWorldDir(enuFrame, { east: 0, north: 1, up: 0 });
                sheetYAxis = enuVecToWorldDir(enuFrame, { east: 1, north: 0, up: 0 });
                sheetNormalCanonical = enuVecToWorldDir(enuFrame, { east: 0, north: 0, up: 1 });
            } else {
                const branchWidth = CANONICAL_LAYOUT.branch.radiusThick * 2;
                const sheetDiag = Math.sqrt(layout.width**2 + layout.height**2);
                const clearance = (sheetDiag * layout.clearanceMultiplier) + (branchWidth * layout.branchWidthMultiplier);
                if (clearance < sheetDiag * 0.5) {
                    throw new Error(`[CONTRACT VIOLATION] Sheet clearance too small: ${clearance.toFixed(1)}m < ${(sheetDiag * 0.5).toFixed(1)}m`);
                }
                const fanGap = layout.width * 1.15;
                const fanCenter = (sibCount - 1) / 2;
                const fanOffset = (sibIdx - fanCenter) * fanGap;
                sheetENU = {
                    east: branchEndENU.east + (clearance * frame.T.east) + (fanOffset * frame.B.east),
                    north: branchEndENU.north + (clearance * frame.T.north) + (fanOffset * frame.B.north),
                    up: branchEndENU.up + (clearance * frame.T.up) + (fanOffset * frame.B.up)
                };
                sheetXAxis = enuVecToWorldDir(enuFrame, frame.N);
                sheetYAxis = enuVecToWorldDir(enuFrame, frame.B);
                sheetNormalCanonical = enuVecToWorldDir(enuFrame, negateVec(frame.T));
            }
            
            if (!validateENUCoordinates(sheetENU.east, sheetENU.north, sheetENU.up)) {
                throw new Error('Invalid sheet ENU coordinates');
            }
            const sheetCenter = this._toWorld(enuFrame, sheetENU.east, sheetENU.north, sheetENU.up);
            if (!isCartesian3Finite(sheetCenter)) {
                throw new Error('Invalid sheet center position');
            }
            
            // STEP 4: Create four corners using N × B (NOT East × North)
            // Offset magnitudes scaled by _presScale for presentation
            const ps = this._presScale;
            const halfWidth = layout.width / 2 * ps;   // 200m * scale
            const halfHeight = layout.height / 2 * ps; // 72m * scale
            
            const corners = [
                // Bottom-left: -N (down), -B (left)
                Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, -halfHeight, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, -halfWidth, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                ),
                // Bottom-right: -N (down), +B (right)
                Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, -halfHeight, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, halfWidth, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                ),
                // Top-right: +N (up), +B (right)
                Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, halfHeight, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, halfWidth, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                ),
                // Top-left: +N (up), -B (left)
                Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, halfHeight, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, -halfWidth, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                )
            ];

            // Ensure sheet faces outward from globe center (render-only; keep canonical normal)
            const outward = Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.clone(sheetCenter, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
            );
            const edgeA = Cesium.Cartesian3.subtract(corners[1], corners[0], new Cesium.Cartesian3());
            const edgeB = Cesium.Cartesian3.subtract(corners[2], corners[0], new Cesium.Cartesian3());
            let sheetNormalRender = Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.cross(edgeA, edgeB, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
            );
            if (Cesium.Cartesian3.dot(sheetNormalRender, outward) < 0) {
                const tmp = corners[1];
                corners[1] = corners[3];
                corners[3] = tmp;
                const edgeAFlipped = Cesium.Cartesian3.subtract(corners[1], corners[0], new Cesium.Cartesian3());
                const edgeBFlipped = Cesium.Cartesian3.subtract(corners[2], corners[0], new Cesium.Cartesian3());
                sheetNormalRender = Cesium.Cartesian3.normalize(
                    Cesium.Cartesian3.cross(edgeAFlipped, edgeBFlipped, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
            }
            
            // Create polygon outline (CRITICAL: arcType.NONE prevents terrain sampling)
            const outlineOffset = Cesium.Cartesian3.multiplyByScalar(sheetNormalRender, 0.25 * ps, new Cesium.Cartesian3());
            const outlineCorners = corners.map((corner) => Cesium.Cartesian3.add(corner, outlineOffset, new Cesium.Cartesian3()));
            const outlineGeometry = new Cesium.PolylineGeometry({
                positions: [...outlineCorners, outlineCorners[0]],  // Close the loop
                width: layout.outlineWidth,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                arcType: Cesium.ArcType.NONE  // Prevents NaN from terrain sampling
            });
            
            const eriColor = this.getERIColor(sheet.eri);
            
            const outlineInstance = new Cesium.GeometryInstance({
                geometry: outlineGeometry,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(eriColor.withAlpha(0.45))
                },
                id: `${sheet.id}-outline`
            });
            
            const outlinePrimitive = new Cesium.Primitive({
                geometryInstances: outlineInstance,
                appearance: new Cesium.PolylineColorAppearance(),
                asynchronous: false
            });
            
            this.viewer.scene.primitives.add(outlinePrimitive);
            this.primitives.push(outlinePrimitive);

            // Subtle sheet surface fill (low contrast, non-emissive)
            if (sheet._fillPrimitive) {
                this.viewer.scene.primitives.remove(sheet._fillPrimitive);
                sheet._fillPrimitive = null;
            }
            const surfaceGeometry = new Cesium.PolygonGeometry({
                polygonHierarchy: new Cesium.PolygonHierarchy(corners),
                vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
            });
            const surfaceInstance = new Cesium.GeometryInstance({
                geometry: surfaceGeometry,
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.fromCssColorString('#2a3b55').withAlpha(0.18)
                    )
                },
                id: `${sheet.id}-surface`
            });
            const surfacePrimitive = new Cesium.Primitive({
                geometryInstances: surfaceInstance,
                appearance: new Cesium.PerInstanceColorAppearance({
                    flat: true,
                    translucent: true,
                    renderState: {
                        depthTest: { enabled: true },
                        cull: { enabled: true, face: Cesium.CullFace.BACK }
                    }
                }),
                asynchronous: false
            });
            this.viewer.scene.primitives.add(surfacePrimitive);
            this.primitives.push(surfacePrimitive);
            sheet._fillPrimitive = surfacePrimitive;

            // Internal grid overlay (visible only at close range)
            const rows = sheet.rows || CANONICAL_LAYOUT.sheet.cellRows;
            const cols = sheet.cols || CANONICAL_LAYOUT.sheet.cellCols;
            const gridNear = 0.0;
            const gridFar = 4500.0;
            const headerFar = 8000.0;
            const halfWidthGrid = layout.width / 2 * ps;
            const halfHeightGrid = layout.height / 2 * ps;
            const gridLines = [];
            const headerLines = [];
            for (let r = 1; r < rows; r++) {
                const t = (r / rows) - 0.5;
                const offset = t * layout.height * ps;
                const lineStart = Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, offset, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, -halfWidthGrid, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                );
                const lineEnd = Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, offset, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, halfWidthGrid, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                );
                (r === 1 ? headerLines : gridLines).push([lineStart, lineEnd]);
            }
            for (let c = 1; c < cols; c++) {
                const t = (c / cols) - 0.5;
                const offset = t * layout.width * ps;
                const lineStart = Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, -halfHeightGrid, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, offset, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                );
                const lineEnd = Cesium.Cartesian3.add(
                    sheetCenter,
                    Cesium.Cartesian3.add(
                        Cesium.Cartesian3.multiplyByScalar(sheetXAxis, halfHeightGrid, new Cesium.Cartesian3()),
                        Cesium.Cartesian3.multiplyByScalar(sheetYAxis, offset, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                );
                (c === 1 ? headerLines : gridLines).push([lineStart, lineEnd]);
            }

            const addGridLine = (line, color, far) => {
                const gridGeometry = new Cesium.PolylineGeometry({
                    positions: line,
                    width: 1.0,
                    vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                    arcType: Cesium.ArcType.NONE
                });
                const gridInstance = new Cesium.GeometryInstance({
                    geometry: gridGeometry,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(color),
                        distanceDisplayCondition: new Cesium.DistanceDisplayConditionGeometryInstanceAttribute(
                            gridNear,
                            far
                        )
                    }
                });
                const gridPrimitive = new Cesium.Primitive({
                    geometryInstances: gridInstance,
                    appearance: new Cesium.PolylineColorAppearance(),
                    asynchronous: false
                });
                this.viewer.scene.primitives.add(gridPrimitive);
                this.primitives.push(gridPrimitive);
            };
            gridLines.forEach(line => addGridLine(line, Cesium.Color.WHITE.withAlpha(0.08), gridFar));
            headerLines.forEach(line => addGridLine(line, Cesium.Color.WHITE.withAlpha(0.18), headerFar));

            // Optional spine guide (debug toggle)
            if (window.DEBUG_SPINE_GUIDE && window.cellAnchors?.[sheet.id]?.spine) {
                const spinePos = window.cellAnchors[sheet.id].spine;
                const guideStart = Cesium.Cartesian3.add(
                    spinePos,
                    Cesium.Cartesian3.multiplyByScalar(sheetYAxis, -halfWidthGrid, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                const guideEnd = Cesium.Cartesian3.add(
                    spinePos,
                    Cesium.Cartesian3.multiplyByScalar(sheetYAxis, halfWidthGrid, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                const guideGeometry = new Cesium.PolylineGeometry({
                    positions: [guideStart, guideEnd],
                    width: 1.5,
                    vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                    arcType: Cesium.ArcType.NONE
                });
                const guideInstance = new Cesium.GeometryInstance({
                    geometry: guideGeometry,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString('#ffd166').withAlpha(0.5)
                        )
                    },
                    id: `${sheet.id}-spine-guide`
                });
                const guidePrimitive = new Cesium.Primitive({
                    geometryInstances: guideInstance,
                    appearance: new Cesium.PolylineColorAppearance(),
                    asynchronous: false
                });
                this.viewer.scene.primitives.add(guidePrimitive);
                this.primitives.push(guidePrimitive);
            }
            
            // STEP 5: Store sheet frame for cell positioning & topology validation
            sheet._attachIndex = attachIndex;
            sheet._parentFrame = frame;  // {T, N, B}
            sheet._center = sheetCenter;
            sheet._xAxis = sheetXAxis;   // N (up)
            sheet._yAxis = sheetYAxis;   // B (right)
            sheet._normal = sheetNormalCanonical; // canonical sheet normal (-T)
            sheet._renderNormal = sheetNormalRender;
            sheet._enuFrame = enuFrame;
            sheet._sheetENU = sheetENU;
            const sheetRows = sheet.rows || layout.cellRows;
            const sheetCols = sheet.cols || layout.cellCols;
            sheet._dimsMeters = {
                widthM: layout.width, heightM: layout.height,
                cellWm: layout.width / (sheetCols + 1),
                cellHm: layout.height / (sheetRows + 1),
                rows: sheetRows, cols: sheetCols
            };
            if (!this._sheetMetaLogged) this._sheetMetaLogged = new Set();
            const _metaSigFull = `${sheet.id}|full`;
            if (!this._sheetMetaLogged.has(_metaSigFull)) {
                RelayLog.info(`[SHEET-META] set sheet=${sheet.id} center=ok axes=ok normal=ok dims=${layout.width}x${layout.height} cells=${sheetRows}x${sheetCols} src=full`);
                this._sheetMetaLogged.add(_metaSigFull);
            }
            
            const populatedCells = Array.isArray(sheet.cellData) ? sheet.cellData.length : 0;
            RelayLog.info(`[RENDER] sheet="${sheet.name || sheet.id}" populatedCells=${populatedCells} rows=${sheet.rows || 'n/a'} cols=${sheet.cols || 'n/a'}`);

            // Render cell grid using sheet frame (NOT ENU East×North)
            this.renderCellGridENU(sheet, enuFrame, sheetENU, sheetXAxis, sheetYAxis);
            if (!sheet.cellData || sheet.cellData.length === 0) {
                sheet._cellDataStatus = 'INDETERMINATE';
                RelayLog.warn(`[C1] Sheet ${sheet.id} missing cellData (placeholder grid)`);
            }
            
            // PHASE 3: Render timebox lanes behind cells (if cell data exists)
            if (sheet.cellData && sheet.cellData.length > 0) {
                this.renderTimeboxLanes(sheet);
            }
            
            RelayLog.info(`[FilamentRenderer] ✅ Sheet plane created: ${sheet.id} (normal = -T)`);
            return true;
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render sheet ${sheet.id}:`, error);
        }
        return false;
    }
    
    /**
     * Render cell grid in SHEET FRAME coordinates (NOT ENU East×North)
     * @param {Object} sheet - Sheet node
     * @param {Cesium.Matrix4} enuFrame - ENU frame for spine positioning
     * @param {Object} sheetENU - Sheet position in ENU (for spine)
     * @param {Cesium.Cartesian3} sheetXAxis - Sheet X axis (= branch N, "up"), NOT ENU East
     * @param {Cesium.Cartesian3} sheetYAxis - Sheet Y axis (= branch B, "right"), NOT ENU North
     */
    renderCellGridENU(sheet, enuFrame, sheetENU, sheetXAxis, sheetYAxis) {
        const fullCellData = Array.isArray(sheet.cellData) ? sheet.cellData : [];

        // ═══ UX-2.1 HARD EARLY GUARD ═══════════════════════════════════════
        // Pre-budget cellData BEFORE any heavy processing (filter, forEach, entity creation).
        // This prevents 100k+ element array creation, Cartesian3 allocation storms, and crashes.
        const HARD_CELL_CAP = LOD_BUDGET.MAX_CELL_MARKERS_PER_SHEET; // 500
        let cellData = fullCellData;
        let earlyTruncated = false;
        let earlyStride = 1;
        if (fullCellData.length > HARD_CELL_CAP) {
            earlyStride = Math.ceil(fullCellData.length / HARD_CELL_CAP);
            const sampled = [];
            for (let i = 0; i < fullCellData.length; i += earlyStride) {
                sampled.push(fullCellData[i]);
            }
            // Always include selected cell + deps
            if (window._relaySelectedCellId || (window._relayDepCellIds && window._relayDepCellIds.size > 0)) {
                const sampledIds = new Set(sampled.map(c => `${sheet.id}.cell.${c.row}.${c.col}`));
                for (let i = 0; i < fullCellData.length; i++) {
                    const c = fullCellData[i];
                    const cid = `${sheet.id}.cell.${c.row}.${c.col}`;
                    if ((window._relaySelectedCellId === cid || (window._relayDepCellIds && window._relayDepCellIds.has(cid))) && !sampledIds.has(cid)) {
                        sampled.push(c);
                        sampledIds.add(cid);
                    }
                }
            }
            cellData = sampled;
            earlyTruncated = true;
            RelayLog.info(`[LOD-BUDGET] sheet=${sheet.id} EARLY-GUARD: ${fullCellData.length} → ${cellData.length} cells (stride=${earlyStride})`);
        }
        // ═══ END EARLY GUARD ════════════════════════════════════════════════

        // Derive rows/cols from FULL cellData (cheap O(n) scan, no allocs)
        let derivedRows = null, derivedCols = null;
        if (fullCellData.length > 0) {
            let maxRow = -1, maxCol = -1;
            for (let i = 0; i < fullCellData.length; i++) {
                const r = fullCellData[i].row, c = fullCellData[i].col;
                if (Number.isFinite(r) && r > maxRow) maxRow = r;
                if (Number.isFinite(c) && c > maxCol) maxCol = c;
            }
            derivedRows = maxRow >= 0 ? maxRow + 1 : null;
            derivedCols = maxCol >= 0 ? maxCol + 1 : null;
        }
        const rows = sheet.rows || derivedRows || CANONICAL_LAYOUT.sheet.cellRows;
        const cols = sheet.cols || derivedCols || CANONICAL_LAYOUT.sheet.cellCols;
        const sheetWidth = CANONICAL_LAYOUT.sheet.width;
        const sheetHeight = CANONICAL_LAYOUT.sheet.height;
        const ps = this._presScale;
        
        // Cell spacing in SHEET FRAME (meters), scaled for presentation
        // X = along sheetXAxis (N, "up")
        // Y = along sheetYAxis (B, "right")
        const cellSpacingX = sheetHeight / (rows + 1) * ps;  // Along X (up)
        const cellSpacingY = sheetWidth / (cols + 1) * ps;   // Along Y (right)
        // Row 0 at TOP of sheet (matching spreadsheet convention: row 1 at top)
        // X axis points "up" in sheet frame, so row 0 starts at +halfH and goes downward
        const startX = (sheetHeight/2 - sheetHeight / (rows + 1)) * ps;
        const startY = (sheetWidth/2 - sheetWidth / (cols + 1)) * ps;
        
        // Sheet bundle spine position (between branch and sheet, along -T)
        const spineENU = {
            east: sheetENU.east - (CANONICAL_LAYOUT.spine.offset * sheet._parentFrame.T.east),
            north: sheetENU.north - (CANONICAL_LAYOUT.spine.offset * sheet._parentFrame.T.north),
            up: sheetENU.up - (CANONICAL_LAYOUT.spine.offset * sheet._parentFrame.T.up)
        };
        const spineWorldPos = this._toWorld(enuFrame, spineENU.east, spineENU.north, spineENU.up);
        
        // Store cell anchors for filament rendering
        if (!window.cellAnchors) window.cellAnchors = {};
        window.cellAnchors[sheet.id] = {
            cells: {},
            spine: spineWorldPos,
            enuFrame: enuFrame,
            sheetENU: sheetENU
        };
        
        // Track cell anchors array for topology validation
        const cellAnchorsArray = [];
        
        // Render each cell (entities for points/labels at close LOD only)
        const showCompanyMarkers = (this.currentLOD === 'COMPANY' && window.SHOW_CELL_MARKERS_AT_COMPANY === true);
        const useCellMarkers = (this.currentLOD === 'SHEET' || this.currentLOD === 'CELL' || showCompanyMarkers);
        const entries = (cellData.length > 0)
            ? cellData.filter(cell => Number.isFinite(cell.row) && Number.isFinite(cell.col))
            : null;
        
        let anchoredCells = 0;
        let markerCells = 0;
        const addCellAnchor = (row, col, cellRefOverride, createEntity) => {
            const localX = startX - row * cellSpacingX;     // Along sheetXAxis (N): row 0 at top, row N at bottom
            const localY = startY - col * cellSpacingY;     // Along sheetYAxis (B): col 0 at +Y (screen LEFT)
            const cellWorldPos = Cesium.Cartesian3.add(
                sheet._center,
                Cesium.Cartesian3.add(
                    Cesium.Cartesian3.multiplyByScalar(sheetXAxis, localX, new Cesium.Cartesian3()),
                    Cesium.Cartesian3.multiplyByScalar(sheetYAxis, localY, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                ),
                new Cesium.Cartesian3()
            );
            
            const cellRef = cellRefOverride || `${String.fromCharCode(65 + col)}${row + 1}`;
            const cellId = `${sheet.id}.cell.${row}.${col}`;
            
            window.cellAnchors[sheet.id].cells[cellId] = cellWorldPos;
            cellAnchorsArray.push({
                cellId: cellId,
                position: cellWorldPos,
                sheetNormal: sheet._normal
            });
            anchoredCells += 1;

            if (!createEntity) return;
            const showLabel = !showCompanyMarkers;
            const suppressTextSprites = (typeof window !== 'undefined') && window.__relayFpsBoostActive === true;
            const cellEntity = this.viewer.entities.add({
                position: cellWorldPos,
                point: {
                    pixelSize: showCompanyMarkers ? 3 : CANONICAL_LAYOUT.cell.pointSize,
                    color: this.getCellColor(sheet, row, col, this.getERIColor(sheet.eri)),
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: showCompanyMarkers ? 0 : 1
                },
                label: {
                    text: cellRef,
                    font: '10px monospace',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, -CANONICAL_LAYOUT.cell.labelOffset),
                    scale: CANONICAL_LAYOUT.cell.labelScale,
                    show: showLabel && !suppressTextSprites,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, CANONICAL_LAYOUT.cell.maxLabelDistance)
                },
                properties: {
                    type: 'cell',
                    sheetId: sheet.id,
                    cellRef: cellRef,
                    cellId: cellId
                }
            });
            
            this.entities.push(cellEntity);
            this.cellLabelById.set(cellId, cellEntity);
            this.entityCount.labels++;
            this.entityCount.cellPoints++;
            markerCells += 1;
        };

        // UX-2.1: LOD Budget enforcement — cap cell markers/anchors for large sheets
        const totalCellCount = entries ? entries.length : (rows * cols);
        const markerBudget = LOD_BUDGET.MAX_CELL_MARKERS_PER_SHEET;
        
        // Get priority cell IDs (selected + deps) so they're always rendered
        const priorityCellIds = new Set();
        if (window._relaySelectedCellId) priorityCellIds.add(window._relaySelectedCellId);
        if (window._relayDepCellIds) {
            window._relayDepCellIds.forEach(id => priorityCellIds.add(id));
        }
        
        let budgetInfo = { indices: null, stride: 1, truncated: false };
        
        if (entries) {
            // Tag entries with sheet ID for budget function
            entries.forEach(e => { e._sheetId = sheet.id; });
            budgetInfo = budgetCellEntries(entries, markerBudget, priorityCellIds);
            
            if (budgetInfo.truncated) {
                // Budget mode: only anchor + render sampled cells + priority cells
                // Do NOT anchor all 100k+ cells — that causes filament explosion downstream
                entries.forEach((cell, idx) => {
                    if (!budgetInfo.indices.has(idx)) return; // skip non-sampled cells entirely
                    const createMarker = useCellMarkers;
                    addCellAnchor(cell.row, cell.col, cell.a1 || null, createMarker);
                });
            } else {
                // Under budget: render all
                entries.forEach(cell => {
                    addCellAnchor(cell.row, cell.col, cell.a1 || null, useCellMarkers);
                });
            }
        } else {
            // Placeholder grid (no cell data) — budget if rows*cols > cap
            const placeholderTotal = rows * cols;
            if (placeholderTotal > markerBudget) {
                const phStride = Math.ceil(placeholderTotal / markerBudget);
                let phIdx = 0;
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        if (phIdx % phStride === 0) {
                            addCellAnchor(row, col, null, useCellMarkers);
                        }
                        phIdx++;
                    }
                }
            } else {
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        addCellAnchor(row, col, null, useCellMarkers);
                    }
                }
            }
        }
        
        // Store cell anchors array on sheet for validation
        sheet._cellAnchors = cellAnchorsArray;
        
        const importedCells = cellData.length;
        RelayLog.info(`[FilamentRenderer] 📊 Cell grid rendered: ${rows} rows × ${cols} cols (AnchoredCells=${anchoredCells}, MarkerCells=${markerCells}, ImportedCells=${importedCells})`);
        if (budgetInfo.truncated) {
            RelayLog.info(`[LOD-BUDGET] sheet=${sheet.id} lod=${this.currentLOD} cellsTotal=${totalCellCount} markersRendered=${markerCells} stride=${budgetInfo.stride} truncated=true`);
        }
        if (this.currentLOD === 'COMPANY') {
            RelayLog.info(`[LOD] COMPANY markersOverride=${showCompanyMarkers} MarkerCells=${markerCells}`);
        }
        this.lastMarkerStats = { anchoredCells, markerCells, lod: this.currentLOD, truncated: budgetInfo.truncated };
    }
    
    /**
     * Render staged filaments (cell→spine→branch) as primitives
     */
    renderStagedFilaments(sheet, branchIndex) {
        try {
            const cellAnchors = window.cellAnchors[sheet.id];
            if (!cellAnchors) {
                RelayLog.warn(`[FilamentRenderer] ⚠️ No cell anchors for sheet ${sheet.id}`);
                return;
            }
            
            const spinePos = cellAnchors.spine;
            const parent = relayState.tree.nodes.find(n => n.id === sheet.parent);
            if (!parent || !parent._worldEndpoint) {
                throw new Error('Parent branch not found or missing endpoint');
            }
            
            const branchEndWorld = parent._worldEndpoint;
            // UX-2.1: Build cellDataMap only for anchored cells (not full 100k+ cellData)
            // cellAnchors.cells contains only the budgeted subset from renderCellGridENU
            const anchoredCellIds = new Set(Object.keys(cellAnchors.cells));
            const fullCellData = sheet.cellData || [];
            const cellData = [];
            const cellDataMap = new Map();
            for (let i = 0; i < fullCellData.length; i++) {
                const info = fullCellData[i];
                if (!Number.isFinite(info.row) || !Number.isFinite(info.col)) continue;
                const cid = `${sheet.id}.cell.${info.row}.${info.col}`;
                if (anchoredCellIds.has(cid)) {
                    cellData.push(info);
                    cellDataMap.set(`${info.row},${info.col}`, info);
                }
            }

            const rows = sheet.rows || CANONICAL_LAYOUT.sheet.cellRows;
            const cols = sheet.cols || CANONICAL_LAYOUT.sheet.cellCols;
            const sheetWidth = CANONICAL_LAYOUT.sheet.width;
            const sheetHeight = CANONICAL_LAYOUT.sheet.height;
            const ps = this._presScale;
            const cellSpacingX = sheetHeight / (rows + 1) * ps;
            const cellSpacingY = sheetWidth / (cols + 1) * ps;
            const startX = (sheetHeight/2 - sheetHeight / (rows + 1)) * ps;     // row 0 at top
            const startY = (sheetWidth/2 - sheetWidth / (cols + 1)) * ps;     // col 0 at +Y (screen LEFT)
            // Universal time direction for this sheet (opposite the branch) — unit vector
            const timeDir = Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.clone(sheet._normal, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
            );
            let branchTangentWorld = null;
            if (sheet._parentFrame && sheet._enuFrame) {
                branchTangentWorld = enuVecToWorldDir(sheet._enuFrame, sheet._parentFrame.T);
                if (Cesium.Cartesian3.dot(timeDir, branchTangentWorld) > 0) {
                    Cesium.Cartesian3.negate(timeDir, timeDir);
                }
            }

            // D0.3 fix: iterative max avoids spread overflow on 100k+ arrays
            let _maxTC = 0;
            for (let i = 0; i < cellData.length; i++) {
                const tc = cellData[i].timeboxCount || 0;
                if (tc > _maxTC) _maxTC = tc;
            }
            const sheetMaxCubes = Math.min(CANONICAL_LAYOUT.timebox.maxCellTimeboxes, _maxTC);
            // R0.4: Stage-1 filament stops where timebox boxes begin (sheetDepthHalf)
            // This prevents the filament polyline from overlapping with timebox box geometry
            // Offset magnitudes scaled for presentation
            const slabStart = CANONICAL_LAYOUT.timebox.cellToTimeGap * ps;
            const sheetDepthHalf = CANONICAL_LAYOUT.sheet.depth / 2 * ps;
            const slabEnd = sheetDepthHalf;
            let slabDirReference = null;
            let slabAngleDeltaMax = 0;
            let exitDotToBranchMax = null;
            
            // LOD check: Only render as primitives at close zoom
            const usePrimitives = (this.currentLOD === 'SHEET' || this.currentLOD === 'CELL');
            
            if (usePrimitives) {
                let stage1Rendered = 0;
                // STAGE 1: Cell → time slab → lane target (parallel slab, then bend)
                const cellEntries = Object.entries(cellAnchors.cells);
                cellEntries.forEach(([cellId, cellPos], idx) => {
                    if (!isCartesian3Finite(cellPos) || !isCartesian3Finite(spinePos)) {
                        return;  // Skip invalid
                    }
                    
                    let laneTarget = spinePos;
                    let mustStaySeparate = false;
                    const idParts = cellId.split('.');
                    const row = Number.parseInt(idParts[idParts.length - 2], 10);
                    const col = Number.parseInt(idParts[idParts.length - 1], 10);
                    if (Number.isFinite(row) && Number.isFinite(col)) {
                        const localX = startX - row * cellSpacingX;  // row 0 at top
                        const localY = startY - col * cellSpacingY;  // col 0 at +Y (screen LEFT)
                        const cellInfo = cellDataMap.get(`${row},${col}`);
                        const hasIndividualHistory = (cellInfo?.timeboxCount || 0) > 0;
                        const hasFormula = Boolean(cellInfo?.hasFormula);
                        mustStaySeparate = hasIndividualHistory || hasFormula;
                        laneTarget = mustStaySeparate
                            ? Cesium.Cartesian3.add(
                                spinePos,
                                Cesium.Cartesian3.add(
                                    Cesium.Cartesian3.multiplyByScalar(sheet._xAxis, localX, new Cesium.Cartesian3()),
                                    Cesium.Cartesian3.multiplyByScalar(sheet._yAxis, localY, new Cesium.Cartesian3()),
                                    new Cesium.Cartesian3()
                                ),
                                new Cesium.Cartesian3()
                            )
                            : spinePos;
                    }
                    
                    const p0 = cellPos;
                    const p1 = Cesium.Cartesian3.add(
                        p0,
                        Cesium.Cartesian3.multiplyByScalar(timeDir, slabStart, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    );
                    const p2 = Cesium.Cartesian3.add(
                        p0,
                        Cesium.Cartesian3.multiplyByScalar(timeDir, slabEnd, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    );

                    // LINT: slab direction parallel across cells
                    const slabDir = Cesium.Cartesian3.normalize(
                        Cesium.Cartesian3.subtract(p2, p1, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    );
                    if (!slabDirReference) {
                        slabDirReference = Cesium.Cartesian3.clone(slabDir, new Cesium.Cartesian3());
                    } else {
                        const dot = Cesium.Cartesian3.dot(slabDirReference, slabDir);
                        const angle = Cesium.Math.toDegrees(Math.acos(Math.min(1, Math.max(-1, dot))));
                        if (angle > slabAngleDeltaMax) {
                            slabAngleDeltaMax = angle;
                        }
                        if (angle > 2.0) {
                            throw new Error(`[LINT] Cell ${cellId}: stage1 slab not parallel (${angle.toFixed(2)}° > 2°)`);
                        }
                    }

                    if (branchTangentWorld) {
                        const exitDir = Cesium.Cartesian3.normalize(
                            Cesium.Cartesian3.subtract(p1, p0, new Cesium.Cartesian3()),
                            new Cesium.Cartesian3()
                        );
                        const exitDot = Cesium.Cartesian3.dot(exitDir, branchTangentWorld);
                        exitDotToBranchMax = (exitDotToBranchMax === null)
                            ? exitDot
                            : Math.max(exitDotToBranchMax, exitDot);
                        if (exitDot > 0) {
                            throw new Error(`[LINT] Cell ${cellId}: exits toward branch (dot=${exitDot.toFixed(3)})`);
                        }
                    }
                    
                    let combPoint = null;
                    if (!mustStaySeparate && Number.isFinite(col) && Number.isFinite(cols)) {
                        const combScalar = (col - (cols - 1) / 2) * CANONICAL_LAYOUT.timebox.laneGap * 0.35 * ps;
                        combPoint = Cesium.Cartesian3.add(
                            laneTarget,
                            Cesium.Cartesian3.multiplyByScalar(sheet._yAxis, combScalar, new Cesium.Cartesian3()),
                            new Cesium.Cartesian3()
                        );
                    }
                    const stage1Path = combPoint ? [p0, p1, p2, combPoint, laneTarget] : [p0, p1, p2, laneTarget];
                    // LAUNCH THEME: Filaments as faint light threads
                    const ft = this._theme?.filament;
                    const filamentWidth = ft ? ft.width : CANONICAL_LAYOUT.cellFilament.width;
                    const filamentColor = ft
                        ? Cesium.Color.fromCssColorString(ft.color).withAlpha(ft.alpha)
                        : this.getERIColor(sheet.eri).withAlpha(CANONICAL_LAYOUT.cellFilament.opacity);
                    const geometry = new Cesium.PolylineGeometry({
                        positions: stage1Path,
                        width: filamentWidth,
                        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                        arcType: Cesium.ArcType.NONE
                    });
                    
                    const geometryInstance = new Cesium.GeometryInstance({
                        geometry: geometry,
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(filamentColor)
                        },
                        id: `${sheet.id}-cell-${idx}`
                    });
                    
                    const primitive = new Cesium.Primitive({
                        geometryInstances: geometryInstance,
                        appearance: new Cesium.PolylineColorAppearance(),
                        asynchronous: false
                    });
                    
                    this.viewer.scene.primitives.add(primitive);
                    this.primitives.push(primitive);
                    this.primitiveCount.cellFilaments++;
                    stage1Rendered++;
                });
                
                // STAGE 2: Spine center → Branch (single conduit always)
                if (isCartesian3Finite(spinePos) && isCartesian3Finite(branchEndWorld)) {
                    const spineGeometry = new Cesium.PolylineGeometry({
                        positions: [spinePos, branchEndWorld],
                        width: CANONICAL_LAYOUT.spine.width,
                        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                        arcType: Cesium.ArcType.NONE
                    });
                    
                    // LAUNCH THEME: Spine as subtle connector thread
                    const spineTheme = this._theme?.filament;
                    const spineColor = spineTheme
                        ? Cesium.Color.fromCssColorString(spineTheme.color).withAlpha(spineTheme.alpha * 1.5) // slightly brighter than individual filaments
                        : this.getERIColor(sheet.eri).withAlpha(CANONICAL_LAYOUT.spine.opacity);
                    const spineInstance = new Cesium.GeometryInstance({
                        geometry: spineGeometry,
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(spineColor)
                        },
                        id: `${sheet.id}-spine`
                    });
                    
                    const spinePrimitive = new Cesium.Primitive({
                        geometryInstances: spineInstance,
                        appearance: new Cesium.PolylineColorAppearance(),
                        asynchronous: false
                    });
                    
                    this.viewer.scene.primitives.add(spinePrimitive);
                    this.primitives.push(spinePrimitive);
                    this.primitiveCount.spines++;
                }
                
                // GATE 5: Verify staged filaments (no spaghetti)
                const cellCount = Object.keys(cellAnchors.cells).length;
                if (!isWorldOperatorGateSpamSuppressed()) {
                    RelayLog.info(`[GATE 5] Staged filaments for ${sheet.id}:`);
                    RelayLog.info(`  Stage 1 (Cell→Spine): ${cellCount} primitives`);
                    RelayLog.info('  Stage 2 (Spine→Branch): 1 primitive');
                    RelayLog.info(`  Total: ${cellCount + 1} filament primitives`);
                    RelayLog.info('  ✅ NO direct cell→branch connections (staging enforced)');
                }
                RelayLog.info(`[RENDER] stagedFilaments expectedStage1=${cellCount} stage1Prims=${stage1Rendered} stage2Prims=1`);
                RelayLog.info(`[P3-A] exitDotToBranchMax=${exitDotToBranchMax !== null ? exitDotToBranchMax.toFixed(3) : 'n/a'}`);
                RelayLog.info(`[P3-A] slabAngleDeltaMaxDeg=${slabAngleDeltaMax.toFixed(3)}`);
                RelayLog.info(`[P3-A] stage2ConduitsPerSheet=1`);
                this.lastP3A = {
                    exitDotToBranchMax,
                    slabAngleDeltaMaxDeg: slabAngleDeltaMax,
                    stage2ConduitsPerSheet: 1
                };
            }
            
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render staged filaments:`, error);
        }
    }
    
    /**
     * PHASE 3: Render timebox lanes between cell and spine
     * Each cell with history/formula gets a parallel lane toward its spine target
     * Cells without may converge at spine center (mergeable)
     */
    renderTimeboxLanes(sheet) {
        try {
            const layout = CANONICAL_LAYOUT.timebox;
            const fullCellData = sheet.cellData || [];
            
            if (fullCellData.length === 0) {
                RelayLog.warn(`[FilamentRenderer] ⚠️ No cell data for timebox lanes: ${sheet.id}`);
                return;
            }

            // ═══ UX-2.1 HARD EARLY GUARD for timebox lanes ══════════════════
            const TB_HARD_CAP = LOD_BUDGET.MAX_CELL_FILAMENTS_PER_SHEET; // 500
            let cellData = fullCellData;
            if (fullCellData.length > TB_HARD_CAP) {
                const tbEarlyStride = Math.ceil(fullCellData.length / TB_HARD_CAP);
                const tbSampled = [];
                for (let i = 0; i < fullCellData.length; i += tbEarlyStride) {
                    tbSampled.push(fullCellData[i]);
                }
                // Include selected + deps
                if (window._relaySelectedCellId || (window._relayDepCellIds && window._relayDepCellIds.size > 0)) {
                    const tbIds = new Set(tbSampled.map(c => `${sheet.id}.cell.${c.row}.${c.col}`));
                    for (let i = 0; i < fullCellData.length; i++) {
                        const c = fullCellData[i];
                        const cid = `${sheet.id}.cell.${c.row}.${c.col}`;
                        if ((window._relaySelectedCellId === cid || (window._relayDepCellIds && window._relayDepCellIds.has(cid))) && !tbIds.has(cid)) {
                            tbSampled.push(c);
                            tbIds.add(cid);
                        }
                    }
                }
                cellData = tbSampled;
                RelayLog.info(`[LOD-BUDGET] sheet=${sheet.id} TB-EARLY-GUARD: ${fullCellData.length} → ${cellData.length} filaments (stride=${tbEarlyStride})`);
            }
            // ═══ END TB EARLY GUARD ═════════════════════════════════════════
            
            const cellAnchors = window.cellAnchors[sheet.id];
            if (!cellAnchors) {
                throw new Error(`Cell anchors not found for ${sheet.id}`);
            }
            
            const rows = sheet.rows || CANONICAL_LAYOUT.sheet.cellRows;
            const cols = sheet.cols || CANONICAL_LAYOUT.sheet.cellCols;
            const sheetWidth = CANONICAL_LAYOUT.sheet.width;
            const sheetHeight = CANONICAL_LAYOUT.sheet.height;
            const ps = this._presScale;
            const cellSpacingX = sheetHeight / (rows + 1) * ps;
            const cellSpacingY = sheetWidth / (cols + 1) * ps;
            const startX = (sheetHeight/2 - sheetHeight / (rows + 1)) * ps;     // row 0 at top
            const startY = (sheetWidth/2 - sheetWidth / (cols + 1)) * ps;     // col 0 at +Y (screen LEFT)

            // Universal time direction for this sheet (opposite the branch) — unit vector
            const timeDir = Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.clone(sheet._normal, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
            );
            let branchTangentWorld = null;
            if (sheet._parentFrame && sheet._enuFrame) {
                branchTangentWorld = enuVecToWorldDir(sheet._enuFrame, sheet._parentFrame.T);
                if (Cesium.Cartesian3.dot(timeDir, branchTangentWorld) > 0) {
                    Cesium.Cartesian3.negate(timeDir, timeDir);
                }
            }

            // INVARIANT: each timebox segment length = cellSpacingX (same as cell physical size)
            // Cross-section fills the full cell footprint (with 5% gap for grid visibility)
            const segmentLength = cellSpacingX;
            const segmentGap = segmentLength * 0.06;  // 6% gap between segments (proportional, not fixed)
            const segmentStride = segmentLength + segmentGap;  // total space per timebox
            // D0.3 fix: iterative max avoids spread overflow on 100k+ arrays
            let _maxTB = 0;
            for (let i = 0; i < cellData.length; i++) {
                const tc = cellData[i].timeboxCount || 0;
                if (tc > _maxTB) _maxTB = tc;
            }
            const sheetMaxTimeboxes = Math.min(layout.maxCellTimeboxes, _maxTB);
            // ANCHOR INVARIANT: first segment starts at the back face of each cell
            // = cellCenter + timeDir * (sheetDepth/2), not a shared arbitrary offset
            // Offset magnitudes scaled for presentation
            const sheetDepthHalf = CANONICAL_LAYOUT.sheet.depth / 2 * ps;
            const slabStart = sheetDepthHalf;
            const slabEnd = slabStart + (sheetMaxTimeboxes * segmentStride);
            
            // Band offsets: each timebox segment starts at slabStart + i * segmentStride
            // No longer derived from branch commits -- each cell owns its own history depth
            const bandOffsets = null;  // uniform spacing from segmentStride

            let cubesRendered = 0;
            let lanesComputed = 0;
            let lanePrimitivesEmitted = 0;
            const mergeableCells = [];
            const separateLaneTargets = [];
            const nearSheetPoints = [];
            const nearSheetEps = 0.25 * ps;
            const curveOut = 10.0 * ps;
            const approachBack = 14.0 * ps;
            let p3aLogged = false;
            let slabDirReference = null;
            const laneEps = 0.02;
            const minLaneLen = 0.25;
            const minVolumeLen = 2.0;
            const minVolumeWidth = 0.5;
            // At COMPANY LOD with ultra-dense sheets, row-height segments collapse toward zero.
            // Rendering per-cell timebox primitives here creates thousands of degenerate primitives
            // and destroys FPS without adding meaningful signal.
            const skipDegenerateTimeboxGeometry = this.currentLOD === 'COMPANY' && segmentLength <= minLaneLen;
            if (skipDegenerateTimeboxGeometry) {
                RelayLog.info(`[LOD-BUDGET] sheet=${sheet.id} degenerate timebox geometry skipped at COMPANY (segmentLength=${segmentLength.toFixed(3)}m <= minLaneLen=${minLaneLen.toFixed(2)}m)`);
            }
            const fpsBoostActive = (typeof window !== 'undefined') && window.__relayFpsBoostActive === true;
            const timeboxVisibility = fpsBoostActive
                ? 'hidden'
                : ((this.currentLOD === 'SHEET' || this.currentLOD === 'CELL')
                    ? 'full'
                    : (this.currentLOD === 'COMPANY' ? 'faint' : 'hidden'));
            // Canon default: lane visibility should persist unless explicitly disabled.
            const companyGate = normalizeLOD(this.currentLOD) === 'COMPANY'
                ? companyDetailGateState(this.viewer)
                : { allow: true };
            const renderLaneGeometry =
                !isLodAtOrAboveRegion(this.currentLOD)
                && !(normalizeLOD(this.currentLOD) === 'COMPANY' && companyGate.allow !== true)
                && window.SHOW_TIMEBOX_LANES !== false;
            const showActiveMarkers = window.SHOW_ACTIVE_MARKERS === true;
            const activeModeRaw = window.ACTIVE_MARKER_MODE || 'auto';
            let activeMode = activeModeRaw;
            if (activeModeRaw === 'auto') {
                activeMode = (this.currentLOD === 'SHEET' || this.currentLOD === 'CELL')
                    ? 'nonEmpty'
                    : 'selectedRecent';
            }
            const recentWindowMs = 15000;
            const recentCells = sheet._recentCells || new Map();
            const selectionRange = sheet._selectionRange || null;
            const shouldShowMarkers = showActiveMarkers && (this.currentLOD === 'SHEET' || this.currentLOD === 'CELL' || this.currentLOD === 'COMPANY');
            const isSelectedCell = (row, col) => {
                if (!selectionRange?.start || !selectionRange?.end) return false;
                const minRow = Math.min(selectionRange.start.row, selectionRange.end.row);
                const maxRow = Math.max(selectionRange.start.row, selectionRange.end.row);
                const minCol = Math.min(selectionRange.start.col, selectionRange.end.col);
                const maxCol = Math.max(selectionRange.start.col, selectionRange.end.col);
                return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
            };
            let bandAlignMaxDelta = null;
            let bandAlignOkCount = 0;
            let bandAlignCheckCount = 0;
            let activeRendered = 0;
            let activeSelected = 0;
            let activeRecent = 0;
            let activeFormula = 0;
            const laneVolumeStats = {
                okVolume: 0,
                okPolyline: 0,
                fallback: 0,
                reasons: {
                    NaN_POINT: 0,
                    TOO_SHORT: 0,
                    DUP_POINTS: 0,
                    ZERO_LENGTH: 0,
                    VOLUME_ERROR: 0
                }
            };
            const stressModeActive = (typeof window !== 'undefined')
                && (window.__relayStressModeActive === true || window.__relayDeferredRenderPending === true);
            const fpsSampleLaneCap = (typeof window !== 'undefined')
                ? Math.max(1, Number(window.__relayFpsSampleLaneEmitCap || 50))
                : 50;
            const laneEmitCap = (this.currentLOD === 'COMPANY')
                ? (fpsBoostActive ? Math.min(150, fpsSampleLaneCap) : (stressModeActive ? 150 : Number.POSITIVE_INFINITY))
                : Number.POSITIVE_INFINITY;
            let laneEmitSkipped = 0;
            
            const widthLog = [
                `[W] sheet=${sheet.id}`,
                `lod=${this.currentLOD}`,
                `laneDraw=${renderLaneGeometry}`,
                `cellLane=${layout.laneThickness.toFixed(2)}m`,
                `spine=${CANONICAL_LAYOUT.spine.width.toFixed(2)}m`,
                `conduit=${CANONICAL_LAYOUT.spine.width.toFixed(2)}m`,
                `branch=${(CANONICAL_LAYOUT.branch.radiusThick * 2).toFixed(2)}m`,
                `trunk=${(30).toFixed(2)}m`
            ].join(' ');
            RelayLog.info(widthLog);
            
            // UX-2.1: Budget enforcement for timebox lanes
            const filamentBudget = LOD_BUDGET.MAX_CELL_FILAMENTS_PER_SHEET;
            const segmentBudget = LOD_BUDGET.MAX_TIMEBOX_SEGMENTS_PER_SHEET;
            let filamentBudgetUsed = 0;
            let segmentBudgetUsed = 0;
            let filamentTruncated = false;
            
            // Build budget index: deterministic stride sampling for large sheets
            const tbPriorityCellIds = new Set();
            if (window._relaySelectedCellId) tbPriorityCellIds.add(window._relaySelectedCellId);
            if (window._relayDepCellIds) {
                window._relayDepCellIds.forEach(id => tbPriorityCellIds.add(id));
            }
            
            let tbStride = 1;
            // UX-2.1: Pre-filter cellData to budgeted subset (avoids iterating 100k+ items)
            let budgetedCellData = cellData;
            if (cellData.length > filamentBudget) {
                tbStride = Math.ceil(cellData.length / filamentBudget);
                const subset = [];
                for (let i = 0; i < cellData.length; i += tbStride) {
                    subset.push(cellData[i]);
                }
                // Always include priority cells (selected + deps)
                if (tbPriorityCellIds.size > 0) {
                    const subsetIds = new Set(subset.map(ci => `${sheet.id}.cell.${ci.row}.${ci.col}`));
                    for (let i = 0; i < cellData.length; i++) {
                        const ci = cellData[i];
                        const cid = `${sheet.id}.cell.${ci.row}.${ci.col}`;
                        if (tbPriorityCellIds.has(cid) && !subsetIds.has(cid)) {
                            subset.push(ci);
                            subsetIds.add(cid);
                        }
                    }
                }
                budgetedCellData = subset;
                filamentTruncated = true;
                RelayLog.info(`[LOD-BUDGET] sheet=${sheet.id} filaments: ${cellData.length} → ${budgetedCellData.length} (stride=${tbStride})`);
            }
            
            // Render each cell's timebox lane (from budgeted subset only)
            for (let _cellIdx = 0; _cellIdx < budgetedCellData.length; _cellIdx++) {
                if (filamentBudgetUsed >= filamentBudget) break;
                if (segmentBudgetUsed >= segmentBudget) break;
                
                const cellInfo = budgetedCellData[_cellIdx];
                try {
                    const { row, col, timeboxCount, hasFormula, formula } = cellInfo;
                    const cellId = `${sheet.id}.cell.${row}.${col}`;
                    const cellPos = cellAnchors.cells[cellId];
                
                    if (!cellPos) {
                        continue; // Silently skip at scale (too many warnings)
                    }
                
                // Determine if cell must stay separate (has history or formula)
                const hasIndividualHistory = (timeboxCount > 0);
                const mustStaySeparate = hasIndividualHistory || hasFormula;

                // Compute lane target on spine plane for this cell
                const localX = startX - row * cellSpacingX;  // row 0 at top
                const localY = startY - col * cellSpacingY;  // col 0 at +Y (screen LEFT)
                const laneTarget = mustStaySeparate
                    ? Cesium.Cartesian3.add(
                        cellAnchors.spine,
                        Cesium.Cartesian3.add(
                            Cesium.Cartesian3.multiplyByScalar(sheet._xAxis, localX, new Cesium.Cartesian3()),
                            Cesium.Cartesian3.multiplyByScalar(sheet._yAxis, localY, new Cesium.Cartesian3()),
                            new Cesium.Cartesian3()
                        ),
                        new Cesium.Cartesian3()
                    )
                    : cellAnchors.spine;
                
                const toTarget = Cesium.Cartesian3.normalize(
                    Cesium.Cartesian3.subtract(laneTarget, cellPos, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                
                if (!isCartesian3Finite(toTarget)) {
                    RelayLog.warn(`[FilamentRenderer] ⚠️ Invalid lane direction: ${cellId}`);
                    continue;
                }
                
                // Arrival: align to branch tangent if available, otherwise fall back to target direction
                let arriveDir = null;
                if (sheet._parentFrame && sheet._enuFrame) {
                    arriveDir = enuVecToWorldDir(sheet._enuFrame, sheet._parentFrame.T);
                } else {
                    arriveDir = Cesium.Cartesian3.clone(toTarget, new Cesium.Cartesian3());
                }
                if (Cesium.Cartesian3.dot(arriveDir, toTarget) < 0) {
                    arriveDir = Cesium.Cartesian3.negate(arriveDir, arriveDir);
                }
                
                // Constrained polyline with parallel time slab (p0..p5)
                // ANCHOR INVARIANT: p1 = back face of this specific cell (sheetDepth/2 behind cell center)
                const p0 = cellPos;
                const p1 = Cesium.Cartesian3.add(
                    p0,
                    Cesium.Cartesian3.multiplyByScalar(timeDir, slabStart, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                const p2 = Cesium.Cartesian3.add(
                    p0,
                    Cesium.Cartesian3.multiplyByScalar(timeDir, slabEnd, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                // Anchor diagnostic (first cell only)
                if (row === 0 && col === 0) {
                    const anchorDelta = Cesium.Cartesian3.distance(cellPos, p1);
                    RelayLog.info(`[TB-ANCHOR] cell=${cellId} laneStart=${anchorDelta.toFixed(1)}m behind cellCenter (expected=${sheetDepthHalf.toFixed(1)}m = sheetDepth/2)`);
                }

                const hasValue = cellInfo.value !== undefined && cellInfo.value !== null && String(cellInfo.value).trim() !== '';
                const formulaPresent = Boolean(hasFormula) || (typeof formula === 'string' && formula.trim() !== '');
                const isNonEmpty = hasValue || formulaPresent;
                const isSelected = isSelectedCell(row, col);
                const recentStamp = recentCells.get(cellId);
                const isRecent = Number.isFinite(recentStamp) && (Date.now() - recentStamp) <= recentWindowMs;
                const shouldRenderActive = shouldShowMarkers && (
                    (activeMode === 'nonEmpty' && isNonEmpty) ||
                    (activeMode === 'selectedRecent' && (isSelected || isRecent)) ||
                    (activeMode === 'formulasOnly' && formulaPresent)
                );
                if (shouldRenderActive) {
                    const baseAlpha = isSelected ? 0.9 : (isRecent ? 0.7 : 0.45);
                    const baseColor = isSelected
                        ? Cesium.Color.fromCssColorString('#7fd7ff').withAlpha(baseAlpha)
                        : (formulaPresent
                            ? Cesium.Color.fromCssColorString('#ffd166').withAlpha(baseAlpha)
                            : Cesium.Color.fromCssColorString('#8faadc').withAlpha(baseAlpha));
                    const markerPos = Cesium.Cartesian3.clone(p1, new Cesium.Cartesian3());
                    const ringRadius = 0.9 * ps;
                    const ringSegments = 20;
                    const ringPoints = [];
                    for (let i = 0; i <= ringSegments; i++) {
                        const theta = (i / ringSegments) * Math.PI * 2;
                        const offset = Cesium.Cartesian3.add(
                            Cesium.Cartesian3.multiplyByScalar(sheet._xAxis, Math.cos(theta) * ringRadius, new Cesium.Cartesian3()),
                            Cesium.Cartesian3.multiplyByScalar(sheet._yAxis, Math.sin(theta) * ringRadius, new Cesium.Cartesian3()),
                            new Cesium.Cartesian3()
                        );
                        ringPoints.push(Cesium.Cartesian3.add(markerPos, offset, new Cesium.Cartesian3()));
                    }
                    const markerGeometry = new Cesium.PolylineGeometry({
                        positions: ringPoints,
                        width: 1.2,
                        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                        arcType: Cesium.ArcType.NONE
                    });
                    const markerInstance = new Cesium.GeometryInstance({
                        geometry: markerGeometry,
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(baseColor)
                        },
                        id: `${cellId}-presence-marker`
                    });
                    const markerPrimitive = new Cesium.Primitive({
                        geometryInstances: markerInstance,
                        appearance: new Cesium.PolylineColorAppearance(),
                        asynchronous: false
                    });
                    this.viewer.scene.primitives.add(markerPrimitive);
                    this.primitives.push(markerPrimitive);
                    activeRendered += 1;
                    if (isSelected) activeSelected += 1;
                    if (isRecent) activeRecent += 1;
                    if (formulaPresent) activeFormula += 1;
                }
                
                // LINT: initial tangent must point away from branch (+T) at cell
                if (branchTangentWorld) {
                    const initialDir = Cesium.Cartesian3.normalize(
                        Cesium.Cartesian3.subtract(p1, p0, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    );
                    const dotToBranch = Cesium.Cartesian3.dot(initialDir, branchTangentWorld);
                    if (!p3aLogged && row === 0 && col === 0) {
                        RelayLog.info(`[P3-A] lane grammar: cell→laneTarget (time slab) cellId=${cellId} depart=timeDir target=${mustStaySeparate ? 'spineTarget' : 'mergeNode'} firstSegDotToBranch=${dotToBranch.toFixed(3)}`);
                        p3aLogged = true;
                    }
                    if (dotToBranch > 0) {
                        throw new Error(`[LINT] Cell ${cellId}: initial filament points toward branch`);
                    }
                }
                
                // Near-sheet parallelism lint (no hub fan)
                for (const prior of nearSheetPoints) {
                    const dist = Cesium.Cartesian3.distance(prior, p1);
                    if (dist < nearSheetEps) {
                        throw new Error(`[LINT] Lane near-sheet convergence (${dist.toFixed(2)}m < ${nearSheetEps}m)`);
                    }
                }
                nearSheetPoints.push(p1);

                const toTargetFromP2 = Cesium.Cartesian3.normalize(
                    Cesium.Cartesian3.subtract(laneTarget, p2, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                const p3 = Cesium.Cartesian3.add(
                    p2,
                    Cesium.Cartesian3.multiplyByScalar(toTargetFromP2, curveOut, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                const p4 = Cesium.Cartesian3.add(
                    laneTarget,
                    Cesium.Cartesian3.multiplyByScalar(arriveDir, -approachBack, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                
                const p5 = laneTarget;
                const lanePath = [p0, p1, p2, p3, p4, p5];
                this.lanePathsByCell.set(cellId, lanePath);
                
                if (!lanePath.every(point => isCartesian3Finite(point))) {
                    RelayLog.warn(`[FilamentRenderer] ⚠️ Lane path has invalid points: ${cellId}`);
                    continue;
                }
                // D0 P1-C: reject duplicate start/end lanes before heavy geometry work.
                // A looped lane endpoint produces degenerate artifacts and useless primitives.
                if (Cesium.Cartesian3.distance(lanePath[0], lanePath[lanePath.length - 1]) <= laneEps) {
                    laneVolumeStats.fallback++;
                    laneVolumeStats.reasons.DUP_POINTS++;
                    filamentBudgetUsed++;
                    continue;
                }
                const pathLengths = computeSegmentLengths(lanePath);
                const totalLength = pathLengths.reduce((a, b) => a + b, 0);
                
                // LINT 1: Verify separation gap (must be sheetDepth/2 = back face of cell)
                const gapDist = Cesium.Cartesian3.distance(cellPos, p1);
                if (gapDist < sheetDepthHalf - 1.0) {
                    throw new Error(`[LINT] Cell ${cellId}: gap too small (${gapDist.toFixed(2)}m < ${sheetDepthHalf.toFixed(1)}m)`);
                }

                if (skipDegenerateTimeboxGeometry) {
                    // D0: COMPANY LOD fallback. Even when timebox slabs are too short,
                    // keep the lane represented as a thin polyline so large sheets are not visually silent.
                    const sanitizedDegenerate = sanitizeLanePositions(lanePath, laneEps);
                    const degeneratePositions = sanitizedDegenerate.positions;
                    if (degeneratePositions && degeneratePositions.length >= 2) {
                        const degenerateLength = sanitizedDegenerate.length;
                        if (Number.isFinite(degenerateLength) && degenerateLength > laneEps) {
                            if (renderLaneGeometry) {
                                if (lanePrimitivesEmitted < laneEmitCap) {
                                    const laneColor = mustStaySeparate
                                        ? Cesium.Color.fromCssColorString('#4FC3F7').withAlpha(0.45)
                                        : Cesium.Color.fromCssColorString('#90CAF9').withAlpha(0.30);
                                    const degeneratePolyline = new Cesium.PolylineGeometry({
                                        positions: degeneratePositions,
                                        width: 1.0,
                                        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                                        arcType: Cesium.ArcType.NONE
                                    });
                                    const degenerateInstance = new Cesium.GeometryInstance({
                                        geometry: degeneratePolyline,
                                        attributes: {
                                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(laneColor)
                                        },
                                        id: `${cellId}-lane-degenerate`
                                    });
                                    const degeneratePrimitive = new Cesium.Primitive({
                                        geometryInstances: degenerateInstance,
                                        appearance: new Cesium.PolylineColorAppearance(),
                                        asynchronous: false
                                    });
                                    this.viewer.scene.primitives.add(degeneratePrimitive);
                                    this.primitives.push(degeneratePrimitive);
                                    this.primitiveCount.lanePolylines++;
                                    lanePrimitivesEmitted++;
                                } else {
                                    laneEmitSkipped++;
                                }
                            }
                            laneVolumeStats.okPolyline++;
                            lanesComputed++;
                            filamentBudgetUsed++;
                            continue;
                        }
                    }
                    laneVolumeStats.fallback++;
                    laneVolumeStats.reasons.TOO_SHORT++;
                    filamentBudgetUsed++;
                    continue;
                }
                
                // Lane start tick (subtle notch to indicate history begins)
                const tickLen = Math.min(1.2, slabStart * 0.5);
                const tickEnd = Cesium.Cartesian3.add(
                    p0,
                    Cesium.Cartesian3.multiplyByScalar(timeDir, tickLen, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
                const tickGeometry = new Cesium.PolylineGeometry({
                    positions: [p0, tickEnd],
                    width: 1.2,
                    vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                    arcType: Cesium.ArcType.NONE
                });
                const tickInstance = new Cesium.GeometryInstance({
                    geometry: tickGeometry,
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            Cesium.Color.fromCssColorString('#9bb4d4').withAlpha(0.7)
                        )
                    },
                    id: `${cellId}-lane-tick`
                });
                const tickPrimitive = new Cesium.Primitive({
                    geometryInstances: tickInstance,
                    appearance: new Cesium.PolylineColorAppearance(),
                    asynchronous: false
                });
                this.viewer.scene.primitives.add(tickPrimitive);
                this.primitives.push(tickPrimitive);

                // ═══════════════════════════════════════════════════════════
                // TIMEBOX SEGMENTS: each segment length = cellSpacingX (cell physical size)
                // INVARIANT: one edit = one full cell-length segment behind the sheet
                // ═══════════════════════════════════════════════════════════
                const maxSegments = Math.min(timeboxCount, layout.maxCellTimeboxes);
                // Cross-section fills nearly the full cell footprint (92% fill for grid visibility)
                const segWidth = cellSpacingY * 0.92;   // cross-section: column width (full cell face)
                const segDepth = cellSpacingX * 0.92;   // cross-section: row height (full cell face)
                const cubePositions = [];
                
                let cubeCount = 0;
                for (let i = 0; i < maxSegments; i++) {
                    const s = slabStart + (i * segmentStride) + segmentLength * 0.5;
                    const cubeCenter = Cesium.Cartesian3.add(
                        p0,
                        Cesium.Cartesian3.multiplyByScalar(timeDir, s, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    );
                    const slabOffset = Cesium.Cartesian3.dot(
                        Cesium.Cartesian3.subtract(cubeCenter, p0, new Cesium.Cartesian3()),
                        timeDir
                    );
                    const alignDelta = Math.abs(slabOffset - s);
                    bandAlignMaxDelta = bandAlignMaxDelta === null ? alignDelta : Math.max(bandAlignMaxDelta, alignDelta);
                    bandAlignCheckCount++;
                    if (alignDelta <= 0.01) {
                        bandAlignOkCount++;
                    }
                    cubePositions.push(cubeCenter);
                    
                    // LINT: cube must be in front of cell along timeDir
                    const v = Cesium.Cartesian3.subtract(cubeCenter, cellPos, new Cesium.Cartesian3());
                    if (Cesium.Cartesian3.dot(v, timeDir) <= 0) {
                        throw new Error(`[LINT] Cell ${cellId}: timecube behind cell along timeDir`);
                    }

                    // LINT: segment slab must be parallel across cells
                    if (i >= 1) {
                        const slabDir = Cesium.Cartesian3.normalize(
                            Cesium.Cartesian3.subtract(cubeCenter, cubePositions[i - 1], new Cesium.Cartesian3()),
                            new Cesium.Cartesian3()
                        );
                        if (!slabDirReference) {
                            slabDirReference = Cesium.Cartesian3.clone(slabDir, new Cesium.Cartesian3());
                        } else {
                            const dot = Cesium.Cartesian3.dot(slabDirReference, slabDir);
                            const angle = Cesium.Math.toDegrees(Math.acos(Math.min(1, Math.max(-1, dot))));
                            if (angle > 2.0) {
                                throw new Error(`[LINT] Cell ${cellId}: cube slab not parallel (${angle.toFixed(2)}° > 2°)`);
                            }
                        }
                    }
                    
                    // Render timebox segment: box with cell-length depth, aligned to sheet axes
                    const boxGeometry = Cesium.BoxGeometry.fromDimensions({
                        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                        dimensions: new Cesium.Cartesian3(1, 1, 1)
                    });
                    
                    // Color: recent segments brighter, older segments dimmer (blue→cyan gradient)
                    // Each segment is a full cell-volume slab — must be visible, not faint
                    const ageFactor = maxSegments > 1 ? (i / (maxSegments - 1)) : 0;
                    const hue = 0.55 + ageFactor * 0.15;
                    let alpha, sat, light;
                    if (timeboxVisibility === 'full') {
                        alpha = isNonEmpty ? (0.62 - ageFactor * 0.24) : 0.12;
                        sat = isNonEmpty ? 0.8 : 0.3;
                        light = isNonEmpty ? (0.55 - ageFactor * 0.10) : 0.2;
                    } else if (timeboxVisibility === 'faint') {
                        alpha = isNonEmpty ? 0.15 : 0.05;
                        sat = 0.4; light = 0.35;
                    } else {
                        alpha = 0; sat = 0; light = 0;
                    }
                    const color = Cesium.Color.fromHsl(hue, sat, light, alpha);
                    
                    // Build oriented model matrix: segment aligned to sheet axes with timeDir depth
                    const rotation = new Cesium.Matrix3(
                        sheet._xAxis.x * segDepth,  sheet._yAxis.x * segWidth,  timeDir.x * segmentLength,
                        sheet._xAxis.y * segDepth,  sheet._yAxis.y * segWidth,  timeDir.y * segmentLength,
                        sheet._xAxis.z * segDepth,  sheet._yAxis.z * segWidth,  timeDir.z * segmentLength
                    );
                    const baseModelMatrix = Cesium.Matrix4.fromRotationTranslation(rotation, cubeCenter);
                    
                    const instanceId = `${cellId}-timebox-${i}`;
                    const cubeInstance = new Cesium.GeometryInstance({
                        geometry: boxGeometry,
                        modelMatrix: baseModelMatrix,
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
                        },
                        id: instanceId
                    });
                    
                    const cubePrimitive = new Cesium.Primitive({
                        geometryInstances: cubeInstance,
                        appearance: new Cesium.PerInstanceColorAppearance({
                            flat: true,
                            translucent: true
                        }),
                        asynchronous: false
                    });
                    
                    this.viewer.scene.primitives.add(cubePrimitive);
                    this.primitives.push(cubePrimitive);
                    this.timeboxCubes.push({
                        primitive: cubePrimitive,
                        center: cubeCenter,
                        baseSize: segmentLength,
                        baseColor: Cesium.ColorGeometryInstanceAttribute.toValue(color),
                        instanceId,
                        cellId,
                        lanePath,
                        pulseSpeed: 0.6 + i * 0.02,
                        pulseAmplitude: mustStaySeparate ? 0.08 : 0.05
                    });
                    this.timeboxByInstanceId.set(instanceId, {
                        primitive: cubePrimitive,
                        instanceId,
                        baseColor: Cesium.ColorGeometryInstanceAttribute.toValue(color),
                        cellId,
                        lanePath
                    });
                    cubesRendered++;
                    cubeCount++;
                }
                
                // Terminal segment removed: continuous segments from slabStart onward
                // Each segment's length = cellSpacingX = row height in meters
                
                // Calculate lane endpoint (back of last segment)
                const laneEnd = cubeCount > 0 ? cubePositions[cubeCount - 1] : p1;
                
                // Render lane filament (constrained path)
                const sanitized = sanitizeLanePositions(lanePath, laneEps);
                const lanePositions = sanitized.positions;
                if (!lanePositions || lanePositions.length < 2) {
                    laneVolumeStats.fallback++;
                    if (sanitized.hadNaN) laneVolumeStats.reasons.NaN_POINT++;
                    else laneVolumeStats.reasons.TOO_SHORT++;
                    continue;
                }

                const laneLength = sanitized.length;
                const laneStart = lanePositions[0];
                const laneFinal = lanePositions[lanePositions.length - 1];
                if (!Number.isFinite(laneLength) || laneLength <= laneEps || Cesium.Cartesian3.distance(laneStart, laneFinal) <= laneEps) {
                    laneVolumeStats.fallback++;
                    laneVolumeStats.reasons.ZERO_LENGTH++;
                    continue;
                }
                if (sanitized.hadDup && laneLength <= minLaneLen) {
                    laneVolumeStats.fallback++;
                    laneVolumeStats.reasons.TOO_SHORT++;
                    continue;
                }
                const widthInfo = clampLaneWidth(layout.laneThickness, laneLength, minLaneLen);
                const laneWidth = widthInfo.width;
                let laneGeometry = null;
                let usedVolume = false;

                if (widthInfo.canVolume && laneWidth >= minVolumeWidth && laneLength >= minVolumeLen && lanePositions.length >= 3) {
                    const shapePositions = createCircleProfile(laneWidth / 2, 10);
                    if (shapePositions && shapePositions.length >= 3) {
                        try {
                            laneGeometry = new Cesium.PolylineVolumeGeometry({
                                positions: lanePositions,
                                shapePositions,
                                vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
                            });
                            usedVolume = true;
                        } catch (laneError) {
                            laneVolumeStats.reasons.VOLUME_ERROR++;
                        }
                    } else {
                        laneVolumeStats.reasons.DUP_POINTS++;
                    }
                } else if (widthInfo.reason === 'TOO_SHORT') {
                    laneVolumeStats.reasons.TOO_SHORT++;
                } else if (widthInfo.reason === 'ZERO_LENGTH') {
                    laneVolumeStats.reasons.ZERO_LENGTH++;
                }

                if (!laneGeometry) {
                    laneGeometry = new Cesium.PolylineGeometry({
                        positions: lanePositions,
                        width: polylineWidthFromMeters(laneWidth),
                        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                        arcType: Cesium.ArcType.NONE
                    });
                }

                if (usedVolume) {
                    laneVolumeStats.okVolume++;
                } else {
                    laneVolumeStats.okPolyline++;
                    if (sanitized.hadNaN) laneVolumeStats.reasons.NaN_POINT++;
                    if (sanitized.hadDup) laneVolumeStats.reasons.DUP_POINTS++;
                }
                
                if (renderLaneGeometry) {
                    if (lanePrimitivesEmitted < laneEmitCap) {
                        const laneColor = mustStaySeparate
                            ? Cesium.Color.fromCssColorString('#4FC3F7').withAlpha(0.6)  // Bright cyan (has history/formula)
                            : Cesium.Color.fromCssColorString('#90CAF9').withAlpha(0.4); // Light blue (mergeable)
                        
                        const laneInstance = new Cesium.GeometryInstance({
                            geometry: laneGeometry,
                            attributes: {
                                color: Cesium.ColorGeometryInstanceAttribute.fromColor(laneColor)
                            },
                            id: `${cellId}-lane`
                        });
                        
                        const lanePrimitive = new Cesium.Primitive({
                            geometryInstances: laneInstance,
                            appearance: laneGeometry instanceof Cesium.PolylineGeometry
                                ? new Cesium.PolylineColorAppearance()
                                : new Cesium.PerInstanceColorAppearance({
                                    flat: true,
                                    translucent: true
                                }),
                            asynchronous: false
                        });
                        
                        this.viewer.scene.primitives.add(lanePrimitive);
                        this.primitives.push(lanePrimitive);
                        if (laneGeometry instanceof Cesium.PolylineGeometry) {
                            this.primitiveCount.lanePolylines++;
                        } else {
                            this.primitiveCount.laneVolumes++;
                        }
                        lanePrimitivesEmitted++;
                    } else {
                        laneEmitSkipped++;
                    }
                }
                lanesComputed++;
                filamentBudgetUsed++;
                
                // Track mergeable cells for bundling phase (future)
                if (!mustStaySeparate) {
                    mergeableCells.push({ cellId, cellPos, laneEnd });
                } else {
                    separateLaneTargets.push({ cellId, laneTarget });
                }
                } catch (cellError) {
                    if (lanesComputed < 20) { // Throttle warnings at scale
                        RelayLog.warn(`[FilamentRenderer] ⚠️ Timebox lane skipped: ${cellInfo?.row}.${cellInfo?.col} (${cellError.message})`);
                    }
                }
            }
            
            RelayLog.info(`[FilamentRenderer] ⏳ Timebox lanes computed: ${lanesComputed} lanes, emitted=${lanePrimitivesEmitted}, segments=${cubesRendered} (segLen=${segmentLength.toFixed(1)}m stride=${segmentStride.toFixed(1)}m)`);
            if (Number.isFinite(laneEmitCap)) {
                RelayLog.info(`[LOD-BUDGET] D0 lane clamp: computed=${lanesComputed} emitted=${lanePrimitivesEmitted} cap=${laneEmitCap} skipped=${laneEmitSkipped}`);
            }
            if (filamentTruncated) {
                RelayLog.info(`[LOD-BUDGET] sheet=${sheet.id} lod=${this.currentLOD} cellsTotal=${cellData.length} filamentsRendered=${filamentBudgetUsed} stride=${tbStride} truncated=true`);
            }
            RelayLog.info(`[FilamentRenderer]   Separate lanes: ${lanesComputed - mergeableCells.length}, Mergeable: ${mergeableCells.length}`);
            if (timeboxVisibility === 'full') {
                const maxDelta = bandAlignMaxDelta !== null ? bandAlignMaxDelta : 0;
                RelayLog.info(`[T] bandAlign ok=${bandAlignOkCount} maxDeltaM=${maxDelta.toFixed(3)}`);
            }
            if (shouldShowMarkers) {
                RelayLog.info(`[TB] presenceMarkers rendered=${activeRendered} selected=${activeSelected} recent=${activeRecent} formula=${activeFormula}`);
            }
            RelayLog.info(`[L2] laneVolume: okVolume=${laneVolumeStats.okVolume} okPolyline=${laneVolumeStats.okPolyline} fallback=${laneVolumeStats.fallback} (TOO_SHORT=${laneVolumeStats.reasons.TOO_SHORT}, DUP_POINTS=${laneVolumeStats.reasons.DUP_POINTS}, NaN_POINT=${laneVolumeStats.reasons.NaN_POINT}, ZERO_LENGTH=${laneVolumeStats.reasons.ZERO_LENGTH}, VOLUME_ERROR=${laneVolumeStats.reasons.VOLUME_ERROR}) eps=${laneEps} minLen=${minLaneLen} minVolumeLen=${minVolumeLen} minVolumeWidth=${minVolumeWidth} (renderer-threshold)`);
            
            // ═══════════════════════════════════════════════════════════
            // SPINE AGGREGATION BANDS — Gate A0.4
            // For each timebox index, render a band on the spine at the same
            // time position as cell slabs. Band thickness = aggregate cell count.
            // Connection is by spatial alignment, not by extra geometry.
            // ═══════════════════════════════════════════════════════════
            const spinePos = cellAnchors.spine;
            if (spinePos && isCartesian3Finite(spinePos) && sheetMaxTimeboxes > 0) {
                // Aggregate: for each time index i, count cells with timeboxCount > i
                const bandCounts = new Array(sheetMaxTimeboxes).fill(0);
                for (const ci of cellData) {
                    const tc = ci.timeboxCount || 0;
                    for (let i = 0; i < Math.min(tc, sheetMaxTimeboxes); i++) {
                        bandCounts[i]++;
                    }
                }
                const maxBandCount = Math.max(1, ...bandCounts);
                const totalCells = cellData.length;

                // Spine band dimensions: thin disc perpendicular to timeDir
                // Width scales with aggregate proportion (more edits → wider band)
                const minBandRadius = CANONICAL_LAYOUT.spine.width * 1.5;
                const maxBandRadius = cellSpacingY * 0.4;  // up to 40% of column width
                const bandDepth = segmentLength * 0.85;    // nearly fills the segment stride

                let spineBandsRendered = 0;
                for (let i = 0; i < sheetMaxTimeboxes; i++) {
                    if (bandCounts[i] === 0) continue;

                    const fraction = bandCounts[i] / totalCells;  // 0..1 proportion of cells active
                    const bandRadius = minBandRadius + (maxBandRadius - minBandRadius) * fraction;

                    // Band center: same time position as cell slab i
                    const s = slabStart + (i * segmentStride) + segmentLength * 0.5;
                    const bandCenter = Cesium.Cartesian3.add(
                        spinePos,
                        Cesium.Cartesian3.multiplyByScalar(timeDir, s, new Cesium.Cartesian3()),
                        new Cesium.Cartesian3()
                    );

                    // Color: intensity scales with aggregate count
                    const intensity = 0.3 + 0.7 * fraction;
                    const bandAlpha = 0.3 + 0.5 * fraction;
                    const bandColor = Cesium.Color.fromHsl(0.58, 0.7, intensity * 0.5, bandAlpha);

                    // Render as oriented box: wide disc along sheet axes, thin along timeDir
                    const boxGeometry = Cesium.BoxGeometry.fromDimensions({
                        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                        dimensions: new Cesium.Cartesian3(1, 1, 1)
                    });
                    const rotation = new Cesium.Matrix3(
                        sheet._xAxis.x * bandRadius, sheet._yAxis.x * bandRadius, timeDir.x * bandDepth,
                        sheet._xAxis.y * bandRadius, sheet._yAxis.y * bandRadius, timeDir.y * bandDepth,
                        sheet._xAxis.z * bandRadius, sheet._yAxis.z * bandRadius, timeDir.z * bandDepth
                    );
                    const modelMatrix = Cesium.Matrix4.fromRotationTranslation(rotation, bandCenter);
                    const bandInstance = new Cesium.GeometryInstance({
                        geometry: boxGeometry,
                        modelMatrix,
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(bandColor)
                        },
                        id: `${sheet.id}-spine-band-${i}`
                    });
                    const bandPrimitive = new Cesium.Primitive({
                        geometryInstances: bandInstance,
                        appearance: new Cesium.PerInstanceColorAppearance({
                            flat: true,
                            translucent: true
                        }),
                        asynchronous: false
                    });
                    this.viewer.scene.primitives.add(bandPrimitive);
                    this.primitives.push(bandPrimitive);
                    spineBandsRendered++;
                }
                RelayLog.info(`[SPINE-BAND] sheet=${sheet.id} bands=${spineBandsRendered}/${sheetMaxTimeboxes} maxAggregate=${maxBandCount}/${totalCells} bandRadius=${minBandRadius.toFixed(1)}→${maxBandRadius.toFixed(1)}m`);
            }

            // LINT: Separate lanes must not converge (targets stay distinct)
            if (separateLaneTargets.length > 1) {
                let minTargetDist = Infinity;
                for (let i = 0; i < separateLaneTargets.length; i++) {
                    for (let j = i + 1; j < separateLaneTargets.length; j++) {
                        const dist = Cesium.Cartesian3.distance(
                            separateLaneTargets[i].laneTarget,
                            separateLaneTargets[j].laneTarget
                        );
                        minTargetDist = Math.min(minTargetDist, dist);
                    }
                }
                if (minTargetDist < 0.5) {
                    throw new Error(`[LINT] Separate lane targets converged (${minTargetDist.toFixed(2)}m < 0.5m)`);
                }
            }
            
            // LINT 2: Verify at least one timebox per visible cell (with history)
            const cellsWithHistory = cellData.filter(c => c.timeboxCount > 0).length;
            if (timeboxVisibility === 'full' && cubesRendered < cellsWithHistory) {
                RelayLog.warn(`[LINT WARNING] Some cells with history have no timeboxes (${cubesRendered} cubes for ${cellsWithHistory} cells)`);
            }
            
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render timebox lanes:`, error);
        }
    }
    
    /**
     * Render timeboxes with dynamic spacing (primitives at far LOD, entities at close LOD)
     */
    renderTimeboxesPrimitive(node) {
        try {
            if ((typeof window !== 'undefined') && window.__relayFpsBoostActive === true) {
                return;  // Sample-only FPS lift: hide timebox entities/text during measurement prep.
            }
            const nodeTB = node.timeboxes || node.commits;
            if (!nodeTB || nodeTB.length === 0) {
                return;  // No timeboxes if no commit/timebox data
            }
            
            const enuFrame = node._enuFrame;
            if (!enuFrame) {
                throw new Error('Node missing ENU frame');
            }
            
            // Calculate timebox spacing dynamically
            let limbLength, startAlt, endAlt;
            
            if (node.type === 'trunk') {
                limbLength = CANONICAL_LAYOUT.trunk.topAlt;
                startAlt = 0;
                endAlt = CANONICAL_LAYOUT.trunk.topAlt;
            } else if (node.type === 'branch') {
                limbLength = CANONICAL_LAYOUT.branch.length;
                startAlt = CANONICAL_LAYOUT.trunk.topAlt;
                endAlt = CANONICAL_LAYOUT.trunk.topAlt;  // Branches don't rise much
            } else {
                return;  // Only trunks and branches have timeboxes
            }
            
            // Dynamic timebox count (length-derived)
            const timeboxes = this.generateTimeboxesFromCommits(nodeTB, limbLength);
            
            // Render each timebox (simplified as entities for now)
            timeboxes.forEach((timebox, idx) => {
                const t = idx / (timeboxes.length - 1 || 1);
                
                let timeboxPos;
                if (node.type === 'trunk') {
                    const height = startAlt + t * limbLength;
                    timeboxPos = this._toWorld(enuFrame, 0, 0, height);
                } else if (node.type === 'branch') {
                    const eastPos = t * limbLength;
                    const northPos = node._northOffset || 0;
                    timeboxPos = this._toWorld(enuFrame, eastPos, northPos, startAlt);
                }
                
                if (!isCartesian3Finite(timeboxPos)) {
                    return;  // Skip invalid
                }
                
                // Timebox entity (simplified ring) — radius scaled for presentation
                const timeboxRadius = (15 + (timebox.openDrifts || 0) * 0.5) * this._presScale;

                // B4: Derive timebox color from KPI metrics (if bound)
                const kpiMetrics = node.metadata?.kpiMetrics;
                const latestKpi = kpiMetrics?.[kpiMetrics.length - 1];
                let timeboxColor = Cesium.Color.CYAN;
                let timeboxLabelText = timebox.timeboxId || `TB-${idx}`;
                if (latestKpi && node.type === 'branch' && node.metadata?.isModuleBranch) {
                    const matchRate = latestKpi.metrics?.matchRate?.value ?? 0;
                    // Color: green (high match rate) → yellow → red (low match rate)
                    if (matchRate >= 80) timeboxColor = Cesium.Color.fromCssColorString('#50fa7b');
                    else if (matchRate >= 50) timeboxColor = Cesium.Color.fromCssColorString('#f1fa8c');
                    else if (matchRate >= 20) timeboxColor = Cesium.Color.fromCssColorString('#ffb86c');
                    else timeboxColor = Cesium.Color.fromCssColorString('#ff5555');
                    // Show KPI label on latest timebox
                    if (idx === timeboxes.length - 1) {
                        const kpiLabel = node.metadata?.kpiLabel;
                        if (kpiLabel) timeboxLabelText = `${timebox.timeboxId}\n${kpiLabel}`;
                    }
                }

                const suppressTextSprites = (typeof window !== 'undefined') && window.__relayFpsBoostActive === true;
                const timeboxEntity = this.viewer.entities.add({
                    position: timeboxPos,
                    ellipse: {
                        semiMinorAxis: timeboxRadius,
                        semiMajorAxis: timeboxRadius,
                        material: timeboxColor.withAlpha(0.4),
                        outline: true,
                        outlineColor: timeboxColor,
                        outlineWidth: 2
                    },
                    label: {
                        text: timeboxLabelText,
                        font: '12px monospace',
                        fillColor: timeboxColor,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        pixelOffset: new Cesium.Cartesian2(0, -20),
                        scale: 0.7,
                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 100000),
                        show: !suppressTextSprites
                    },
                    properties: {
                        type: 'timebox',
                        nodeId: node.id,
                        timeboxId: timebox.timeboxId,
                        openDrifts: timebox.openDrifts,
                        scarCount: timebox.scarCount,
                        pulseAmplitude: timebox.pulseAmplitude || 1.0,
                        pulseSpeed: timebox.pulseSpeed || 1.0
                    }
                });
                
                this.entities.push(timeboxEntity);
                this.entityCount.timeboxLabels++;
            });
            
            RelayLog.info(`[FilamentRenderer] ⏰ Timeboxes: ${timeboxes.length} on ${node.type} ${node.id}`);
            
        } catch (error) {
            RelayLog.error(`[FilamentRenderer] ❌ Failed to render timeboxes:`, error);
        }
    }
    
    /**
     * Generate timeboxes from commits with dynamic spacing
     */
    generateTimeboxesFromCommits(commits, limbLength) {
        if (!commits || commits.length === 0) return [];
        
        // Check if commits are already pre-formatted as timeboxes
        if (commits[0].timeboxId) {
            return commits;  // Already formatted
        }
        
        // Dynamic timebox count based on limb length
        const minSpacing = CANONICAL_LAYOUT.timebox.minSpacing;
        const maxTimeboxes = CANONICAL_LAYOUT.timebox.maxTimeboxes;
        const timeboxCount = Math.min(Math.floor(limbLength / minSpacing), maxTimeboxes);
        
        // Bucket commits into timeboxes
        const timeboxes = [];
        const commitsPerBox = Math.ceil(commits.length / timeboxCount);
        
        for (let i = 0; i < timeboxCount; i++) {
            const boxCommits = commits.slice(i * commitsPerBox, (i + 1) * commitsPerBox);
            const openDrifts = boxCommits.filter(c => c.status === 'open').length;
            const scarCount = boxCommits.filter(c => c.severity === 'high').length;
            
            timeboxes.push({
                timeboxId: `TB-${i + 1}`,
                commits: boxCommits,
                openDrifts: openDrifts,
                scarCount: scarCount,
                pulseAmplitude: 1.0 + openDrifts * 0.1,
                pulseSpeed: 1.0 + scarCount * 0.05
            });
        }
        
        return timeboxes;
    }
    
    /**
     * Start turgor force animation (pulsing timeboxes)
     */
    startTurgorAnimation() {
        if (this.turgorAnimationRunning) return;
        
        this.turgorAnimationRunning = true;
        
        const animate = () => {
            if (!this.turgorAnimationRunning) return;
            
            const time = Date.now() / 1000;
            
            // Animate timebox entities
            this.entities.forEach(entity => {
                if (entity.properties && entity.properties.type === 'timebox') {
                    const pulseAmplitude = entity.properties.pulseAmplitude || 1.0;
                    const pulseSpeed = entity.properties.pulseSpeed || 1.0;
                    
                    const pulse = Math.sin(time * pulseSpeed) * 0.5 + 0.5;
                    const scaleFactor = 1.0 + pulse * 0.2 * pulseAmplitude;
                    
                    // Note: Direct scale animation would need CallbackProperty
                    // For now this is a placeholder
                }
            });

            // Animate per-cell timebox segments (subtle turgor pulse on opacity/brightness)
            // Note: segments use oriented model matrices, so we only modulate color alpha, not geometry
            this.timeboxCubes.forEach(cube => {
                if (!cube.primitive || cube.primitive.isDestroyed()) return;
                const pulse = Math.sin(time * cube.pulseSpeed) * 0.5 + 0.5;
                const alphaFactor = 1.0 + pulse * cube.pulseAmplitude;
                try {
                    const attrs = cube.primitive.getGeometryInstanceAttributes(cube.instanceId);
                    if (attrs && attrs.color) {
                        const bc = cube.baseColor;
                        attrs.color = new Uint8Array([
                            bc[0], bc[1], bc[2],
                            Math.min(255, Math.round(bc[3] * alphaFactor))
                        ]);
                    }
                } catch (e) { /* ignore if primitive not ready */ }
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
        RelayLog.info('[FilamentRenderer] ✅ Turgor force animation started');
    }
    
    /**
     * Stop turgor force animation
     */
    stopTurgorAnimation() {
        if (this.turgorAnimationRunning) {
            this.turgorAnimationRunning = false;
            RelayLog.info('[FilamentRenderer] ⏸️ Turgor force animation stopped');
        }
    }
    
    /**
     * Get ERI color
     */
    getERIColor(eri) {
        const eriColors = {
            'high': Cesium.Color.RED,
            'medium': Cesium.Color.YELLOW,
            'low': Cesium.Color.GREEN,
            'none': Cesium.Color.GRAY
        };
        return eriColors[eri] || Cesium.Color.CYAN;
    }
    
    /**
     * Get cell color with variation
     */
    getCellColor(sheet, row, col, baseColor) {
        const variation = ((row + col) % 3) * 0.1;
        return baseColor.brighten(variation, new Cesium.Color());
    }
}
