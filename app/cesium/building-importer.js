import { RelayLog } from '../../core/utils/relay-log.js';

const STRICT_DEFAULT_POLICY = {
    maxAllowed: 0,
    maxDistanceMeters: 2000,
    maxModelBytes: 20 * 1024 * 1024,
    enforceModelSize: true,
    allowLargeModels: false,
    disableDuringFpsSampling: true,
    lodPolicy: {
        UNKNOWN: { maxAllowed: 0, maxDistanceMeters: 1000 },
        COMPANY: { maxAllowed: 0, maxDistanceMeters: 1000 },
        SHEET: { maxAllowed: 0, maxDistanceMeters: 1000 },
        CELL: { maxAllowed: 0, maxDistanceMeters: 1000 },
        REGION: { maxAllowed: 0, maxDistanceMeters: 2000 },
        LANIAKEA: { maxAllowed: 0, maxDistanceMeters: 2000 },
        PLANETARY: { maxAllowed: 3, maxDistanceMeters: 2000 },
        FACILITY: { maxAllowed: 5, maxDistanceMeters: 2000 },
        SITE: { maxAllowed: 5, maxDistanceMeters: 2000 }
    }
};

function toFiniteNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function normalizeOwnerModelEntry(entry) {
    if (!entry) return null;
    if (typeof entry === 'string') return { uri: entry };
    if (typeof entry === 'object' && typeof entry.uri === 'string' && entry.uri.trim().length > 0) {
        return entry;
    }
    return null;
}

function resolveModelSpecForBuilding(building, ownerPreferredModels = {}) {
    // Per-building explicit URI always wins.
    if (typeof building?.modelUri === 'string' && building.modelUri.trim().length > 0) {
        return { uri: building.modelUri };
    }
    if (typeof building?.uri === 'string' && building.uri.trim().length > 0) {
        return { uri: building.uri };
    }

    const ownerId = building?.ownerId;
    const ownerEntry = ownerId ? normalizeOwnerModelEntry(ownerPreferredModels[ownerId]) : null;
    if (ownerEntry) return ownerEntry;

    const fallbackEntry = normalizeOwnerModelEntry(ownerPreferredModels.default);
    if (fallbackEntry) return fallbackEntry;

    return null;
}

function computeModelMatrix(building) {
    const position = building?.position || {};
    const lon = toFiniteNumber(position.lon, NaN);
    const lat = toFiniteNumber(position.lat, NaN);
    const height = toFiniteNumber(position.height, 0);

    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        return null;
    }

    const heading = Cesium.Math.toRadians(toFiniteNumber(building.heading, 0));
    const pitch = Cesium.Math.toRadians(toFiniteNumber(building.pitch, 0));
    const roll = Cesium.Math.toRadians(toFiniteNumber(building.roll, 0));
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);

    const origin = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    return Cesium.Transforms.headingPitchRollToFixedFrame(origin, hpr);
}

function getDistanceToCameraMeters(viewer, modelMatrix) {
    try {
        const translation = new Cesium.Cartesian3();
        Cesium.Matrix4.getTranslation(modelMatrix, translation);
        return Cesium.Cartesian3.distance(viewer.camera.position, translation);
    } catch {
        return Number.POSITIVE_INFINITY;
    }
}

async function tryResolveModelByteSize(uri) {
    try {
        const response = await fetch(uri, { method: 'HEAD' });
        const raw = response.headers.get('content-length');
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) && n >= 0 ? n : null;
    } catch {
        return null;
    }
}

function normalizeLodName(raw) {
    if (!raw || typeof raw !== 'string') return 'UNKNOWN';
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed.toUpperCase() : 'UNKNOWN';
}

function resolveEffectivePolicy(policy = {}) {
    const lodName = normalizeLodName(policy.currentLOD || policy.lod || policy.lodLevel);
    const inputLodPolicy = (policy.lodPolicy && typeof policy.lodPolicy === 'object') ? policy.lodPolicy : {};
    const lodTable = { ...STRICT_DEFAULT_POLICY.lodPolicy, ...inputLodPolicy };
    const lodOverride = lodTable[lodName] || lodTable.UNKNOWN || STRICT_DEFAULT_POLICY.lodPolicy.UNKNOWN;

    return {
        ...STRICT_DEFAULT_POLICY,
        ...policy,
        ...lodOverride,
        currentLOD: lodName,
        lodPolicy: lodTable
    };
}

export async function importOwnerBuildings(viewer, importedBuildings = [], ownerPreferredModels = {}, policy = {}) {
    const effectivePolicy = resolveEffectivePolicy(policy);
    const maxAllowed = Number.isFinite(Number(effectivePolicy.maxAllowed)) ? Math.max(0, Number(effectivePolicy.maxAllowed)) : 0;
    const maxDistanceMeters = Number.isFinite(Number(effectivePolicy.maxDistanceMeters))
        ? Math.max(0, Number(effectivePolicy.maxDistanceMeters))
        : 2000;
    const maxModelBytes = Number.isFinite(Number(effectivePolicy.maxModelBytes))
        ? Math.max(1, Number(effectivePolicy.maxModelBytes))
        : 20 * 1024 * 1024; // 20MB default guardrail
    const allowLargeModels = effectivePolicy.allowLargeModels === true;
    const enforceModelSize = effectivePolicy.enforceModelSize !== false;
    const disableDuringFpsSampling = effectivePolicy.disableDuringFpsSampling !== false;
    const isFpsSampling = window?.__relayFpsSamplingActive === true;

    const summary = {
        requested: importedBuildings.length,
        loaded: 0,
        failed: 0,
        skipped: 0,
        skippedByBudget: 0,
        skippedByDistance: 0,
        skippedBySize: 0,
        maxAllowed,
        lod: effectivePolicy.currentLOD
    };

    if (!viewer || !Array.isArray(importedBuildings) || importedBuildings.length === 0) {
        RelayLog.info(`[BUILDINGS] requested=${summary.requested} loaded=0 failed=0 maxAllowed=${maxAllowed} lod=${summary.lod}`);
        return summary;
    }

    if (disableDuringFpsSampling && isFpsSampling) {
        summary.skipped = importedBuildings.length;
        summary.skippedByBudget = importedBuildings.length;
        RelayLog.warn(`[BUILDINGS] skipped all imports: FPS sampling active (lod=${summary.lod})`);
        RelayLog.info(`[BUILDINGS] requested=${summary.requested} loaded=0 failed=0 maxAllowed=${maxAllowed} lod=${summary.lod}`);
        return summary;
    }

    const candidates = importedBuildings.slice(0, maxAllowed);
    summary.skippedByBudget = Math.max(0, importedBuildings.length - candidates.length);
    summary.skipped += summary.skippedByBudget;

    for (const building of candidates) {
        const buildingId = building?.id || 'unknown-building';
        const modelSpec = resolveModelSpecForBuilding(building, ownerPreferredModels);
        if (!modelSpec) {
            summary.skipped += 1;
            RelayLog.warn(`[BUILDINGS] skipped ${buildingId}: no model URI resolved for owner=${building?.ownerId || 'unknown'}`);
            continue;
        }

        const modelMatrix = computeModelMatrix(building);
        if (!modelMatrix) {
            summary.failed += 1;
            RelayLog.warn(`[BUILDINGS] failed ${buildingId}: invalid lon/lat in position`);
            continue;
        }

        const distanceToCamera = getDistanceToCameraMeters(viewer, modelMatrix);
        if (distanceToCamera > maxDistanceMeters) {
            summary.skipped += 1;
            summary.skippedByDistance += 1;
            RelayLog.warn(`[BUILDINGS] skipped ${buildingId}: distance ${distanceToCamera.toFixed(1)}m exceeds maxDistance=${maxDistanceMeters}m`);
            continue;
        }

        if (enforceModelSize) {
            const modelByteSize = await tryResolveModelByteSize(modelSpec.uri);
            if (Number.isFinite(modelByteSize) && modelByteSize > maxModelBytes && !allowLargeModels) {
                summary.skipped += 1;
                summary.skippedBySize += 1;
                RelayLog.warn(`[BUILDINGS] skipped ${buildingId}: model size ${(modelByteSize / (1024 * 1024)).toFixed(1)}MB exceeds limit ${(maxModelBytes / (1024 * 1024)).toFixed(1)}MB`);
                continue;
            }
            if (modelByteSize === null) {
                RelayLog.warn(`[BUILDINGS] size unknown for ${buildingId} (${modelSpec.uri}); loading without size proof`);
            }
        }

        try {
            const model = await Cesium.Model.fromGltfAsync({
                url: modelSpec.uri,
                modelMatrix,
                scale: toFiniteNumber(building.scale ?? modelSpec.scale, 1),
                minimumPixelSize: toFiniteNumber(building.minimumPixelSize ?? modelSpec.minimumPixelSize, 64),
                maximumScale: toFiniteNumber(building.maximumScale ?? modelSpec.maximumScale, 20000)
            });
            viewer.scene.primitives.add(model);
            summary.loaded += 1;
        } catch (error) {
            summary.failed += 1;
            RelayLog.warn(`[BUILDINGS] failed ${buildingId}: ${error?.message || error}`);
        }
    }

    RelayLog.info(`[BUILDINGS] requested=${summary.requested} loaded=${summary.loaded} failed=${summary.failed} maxAllowed=${maxAllowed} lod=${summary.lod}`);
    RelayLog.info(`[BUILDINGS] imported owner models: loaded=${summary.loaded}/${summary.requested}, failed=${summary.failed}, skipped=${summary.skipped} (budget=${summary.skippedByBudget}, distance=${summary.skippedByDistance}, size=${summary.skippedBySize})`);
    return summary;
}
