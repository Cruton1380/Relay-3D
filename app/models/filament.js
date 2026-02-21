/**
 * Filament — Row-Level Atomic Event Model
 *
 * A filament is one event: one invoice, one pothole, one conversation.
 * It IS a row — the indivisible quantum of activity in Relay.
 *
 * Left side = Identity block (stable):
 *   filamentId, originRowRef, six universal domains, template binding, keys
 *
 * Right side = Timeline block (unbounded commits):
 *   status changes, matches, approvals, evidence, comments, scars
 *   Rendered as time (the long part of the row on the bark).
 *
 * Master Plan refs: §4, §0.3, §3.1-3.4, §32
 */

const LIFECYCLE_STATES = Object.freeze({
    SCHEDULED: 'SCHEDULED',
    OPEN:      'OPEN',
    ACTIVE:    'ACTIVE',
    HOLD:      'HOLD',
    CLOSED:    'CLOSED',
    ABSORBED:  'ABSORBED',
    MIGRATED:  'MIGRATED',
});

const WORK_STATES = Object.freeze({
    DRAFT:     'DRAFT',
    PROPOSED:  'PROPOSED',
    COMMITTED: 'COMMITTED',
    REVERTED:  'REVERTED',
});

const LIFECYCLE_RADIAL = Object.freeze({
    SCHEDULED: 1.0,
    OPEN:      1.0,
    ACTIVE:    0.75,
    HOLD:      0.6,
    CLOSED:    0.25,
    ABSORBED:  0.0,
    MIGRATED:  0.0,
});

const SINKING_MODES = Object.freeze({
    EARTH_TIME: 'earth-time',
    MILESTONE:  'milestone',
    NONE:       'none',
});

const HELIX_PERIODS = Object.freeze({
    DAY:     'day',
    WEEK:    'week',
    SPRINT:  'sprint',
    QUARTER: 'quarter',
});

const HELIX_TWISTS_PER_UNIT = Object.freeze({
    day:     1.0 / 86400,
    week:    1.0 / (86400 * 7),
    sprint:  1.0 / (86400 * 14),
    quarter: 1.0 / (86400 * 90),
});

const SINKING_WINDOW_SEC = 86400 * 60;

// ── Sim-time offset for debug time-scrubbing ──

let _simTimeOffsetMs = 0;

export function advanceSimTime(ms)   { _simTimeOffsetMs += ms; }
export function advanceSimTimeDays(n){ _simTimeOffsetMs += n * 86400000; }
export function getSimTime()         { return Date.now() + _simTimeOffsetMs; }

// ── Factory ──

let _nextRow = 1;

export function createFilament({
    objectType,
    objectId,
    moduleId = 'mod.default',
    sheetId  = 'sheet.default',
    branchId,
    templateId = 'template.default.v1',
    counterpartyRef = null,
    approachAngle   = 0,
    magnitudeColumn = 'amount',
    magnitude       = null,
    unit            = null,
    evidenceRequired = 3,
    evidenceRefs    = [],
    lifecycleState  = LIFECYCLE_STATES.OPEN,
    workState       = WORK_STATES.COMMITTED,
    spawnedAt       = new Date().toISOString(),
    expectedCloseBy = null,
    disclosureTier  = 0,
}) {
    const rowNum = _nextRow++;
    const filamentId   = `F-${branchId}.${objectType}-${objectId}`;
    const originRowRef = `row.${moduleId}.${sheetId}.R${rowNum}`;

    const evidencePresent = evidenceRefs.length;
    const evidenceRatio   = evidenceRequired > 0
        ? Math.min(1.0, evidencePresent / evidenceRequired)
        : 1.0;

    return {
        filamentId,
        originRowRef,
        objectId,
        objectType,
        templateId,
        branchId,
        counterpartyRef,
        approachAngle,
        magnitudeColumn,
        magnitude,
        unit,
        evidenceRefs:     [...evidenceRefs],
        evidenceRequired,
        evidencePresent,
        evidenceRatio,
        lifecycleState,
        workState,
        orgConfidence:    evidenceRatio,
        globalConfidence: null,
        barkPosition: {
            l:     0,
            r:     LIFECYCLE_RADIAL[lifecycleState] ?? 1.0,
            theta: approachAngle,
        },
        spawnedAt,
        expectedCloseBy,
        closedAt:   null,
        absorbedAt: null,
        commitHistory: [],
        disclosureTier,
        isScar: false,
    };
}

// ── Lifecycle transitions (inward-only) ──

export function advanceLifecycle(filament, newState, evidence = {}) {
    const order = ['SCHEDULED', 'OPEN', 'ACTIVE', 'HOLD', 'CLOSED', 'ABSORBED'];
    const curIdx = order.indexOf(filament.lifecycleState);
    const newIdx = order.indexOf(newState);

    const isHoldResume = filament.lifecycleState === 'HOLD' && newState === 'ACTIVE';
    const isHoldEntry  = newState === 'HOLD';
    const isMigration  = newState === 'MIGRATED';

    if (!isHoldEntry && !isHoldResume && !isMigration && newIdx <= curIdx) {
        console.error(
            `[REFUSAL] reason=LIFECYCLE_REGRESSION filament=${filament.filamentId}` +
            ` from=${filament.lifecycleState} to=${newState}`
        );
        return filament;
    }

    const now = new Date().toISOString();
    const newRefs = evidence.refs
        ? [...filament.evidenceRefs, ...evidence.refs]
        : filament.evidenceRefs;

    const evidencePresent = newRefs.length;
    const evidenceRatio   = filament.evidenceRequired > 0
        ? Math.min(1.0, evidencePresent / filament.evidenceRequired)
        : 1.0;

    return {
        ...filament,
        lifecycleState: newState,
        evidenceRefs:   newRefs,
        evidencePresent,
        evidenceRatio,
        orgConfidence:    evidenceRatio,
        globalConfidence: filament.globalConfidence,
        barkPosition: {
            ...filament.barkPosition,
            r: LIFECYCLE_RADIAL[newState] ?? filament.barkPosition.r,
        },
        closedAt:   newState === 'CLOSED'   ? now : filament.closedAt,
        absorbedAt: newState === 'ABSORBED' ? now : filament.absorbedAt,
        commitHistory: [
            ...filament.commitHistory,
            `commit.${newState.toLowerCase()}.${Date.now().toString(36)}`,
        ],
    };
}

// ── Render params (consumed by renderer, never mutates state) ──

export function filamentRenderParams(filament, branchConfig = {}) {
    const {
        branchLength = 800,
        branchRadius = 30,
        sinkingMode  = SINKING_MODES.EARTH_TIME,
        helixPeriod  = HELIX_PERIODS.WEEK,
    } = branchConfig;

    const now = getSimTime();
    const spawnMs = new Date(filament.spawnedAt).getTime();
    const ageSec  = Math.max(0, (now - spawnMs) / 1000);
    const ageNorm = Math.min(1.0, ageSec / SINKING_WINDOW_SEC);

    const isGrowing = filament.lifecycleState === LIFECYCLE_STATES.OPEN ||
                      filament.lifecycleState === LIFECYCLE_STATES.ACTIVE ||
                      filament.lifecycleState === LIFECYCLE_STATES.HOLD;

    const closedMs = filament.closedAt ? new Date(filament.closedAt).getTime() : now;
    const growDurationSec = Math.max(0, (Math.min(now, closedMs) - spawnMs) / 1000);
    const growNorm = Math.min(0.4, growDurationSec / SINKING_WINDOW_SEC);

    let lHead, lTail;
    switch (sinkingMode) {
        case SINKING_MODES.EARTH_TIME:
            lHead = (1.0 - ageNorm) * branchLength;
            lTail = Math.max(0, lHead - growNorm * branchLength);
            break;
        case SINKING_MODES.MILESTONE:
            lHead = filament.barkPosition.r * branchLength;
            lTail = Math.max(0, lHead - growNorm * branchLength);
            break;
        case SINKING_MODES.NONE:
        default:
            lHead = 0.5 * branchLength;
            lTail = Math.max(0, lHead - growNorm * branchLength);
            break;
    }

    const ribbonLength = Math.max(5, lHead - lTail);
    const l = (lHead + lTail) / 2;

    const r = filament.barkPosition.r * branchRadius;

    const twistRate   = HELIX_TWISTS_PER_UNIT[helixPeriod] || HELIX_TWISTS_PER_UNIT.week;
    const helixOffset = ageSec * twistRate * Math.PI * 2;
    const theta       = filament.barkPosition.theta + helixOffset;

    const mag    = filament.magnitude != null ? parseFloat(filament.magnitude) : 0;
    const warmth = Math.min(1.0, Math.max(0.0, mag / 100000));
    const opacity = 0.3 + 0.7 * filament.evidenceRatio;

    return {
        l, lHead, lTail, ribbonLength,
        r, theta, warmth, opacity, ageNorm,
        lifecycleState: filament.lifecycleState,
        isGrowing,
    };
}

// ── Scar factory ──

export function createScar(originalFilament, { revertedBy, reason = '', evidenceRefs = [] }) {
    const now = new Date().toISOString();

    const scar = createFilament({
        objectType: 'scar',
        objectId: `${originalFilament.objectId}-scar-${Date.now().toString(36)}`,
        branchId: originalFilament.branchId,
        templateId: originalFilament.templateId,
        counterpartyRef: revertedBy || 'unknown',
        approachAngle: originalFilament.approachAngle,
        magnitudeColumn: originalFilament.magnitudeColumn,
        magnitude: originalFilament.magnitude,
        unit: originalFilament.unit,
        evidenceRequired: 2,
        evidenceRefs,
        lifecycleState: LIFECYCLE_STATES.ACTIVE,
        workState: WORK_STATES.COMMITTED,
        spawnedAt: now,
    });

    scar.isScar       = true;
    scar.scarOf        = originalFilament.filamentId;
    scar.revertedBy    = revertedBy;
    scar.revertReason  = reason;
    scar.revertedAt    = now;

    const reverted = {
        ...originalFilament,
        workState: WORK_STATES.REVERTED,
        commitHistory: [
            ...originalFilament.commitHistory,
            `commit.reverted.${Date.now().toString(36)}`,
        ],
    };

    return { scar, revertedFilament: reverted };
}

// ── Dual confidence setters (frozen contract #44) ──

export function setOrgConfidence(filament, value) {
    return { ...filament, orgConfidence: Math.min(1.0, Math.max(0.0, value)) };
}
export function setGlobalConfidence(filament, value) {
    return { ...filament, globalConfidence: value != null ? Math.min(1.0, Math.max(0.0, value)) : null };
}

// ── Twig classification (§3.10) ──

export function computeTwigness(filament, branchConfig = {}) {
    const params = filamentRenderParams(filament, branchConfig);
    const isOuterBark = filament.lifecycleState === LIFECYCLE_STATES.OPEN ||
                        filament.lifecycleState === LIFECYCLE_STATES.HOLD;
    if (!isOuterBark) return 0.0;

    const AGE_THRESHOLD = 0.15;
    if (params.ageNorm < AGE_THRESHOLD) return 0.0;
    return Math.min(1.0, (params.ageNorm - AGE_THRESHOLD) / (1.0 - AGE_THRESHOLD));
}

export { LIFECYCLE_STATES, WORK_STATES, LIFECYCLE_RADIAL, SINKING_MODES, HELIX_PERIODS };
