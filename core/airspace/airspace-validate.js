const ALLOWED_SHED = new Set(['spectacle', 'lenses', 'detail']);
const ALLOWED_PRESENCE = new Set(['INDIVIDUAL', 'QUANTIZED', 'OFF']);
const ALLOWED_DETAIL = new Set(['ON', 'LOD_ONLY', 'SUMMARY', 'OFF']);

function refusal(msg, details = '') {
  const suffix = details ? ` details=${details}` : '';
  console.error(`[REFUSAL] reason=AIRSPACE_INVALID_SPEC ${msg}${suffix}`);
}

function isFiniteNum(x) {
  return typeof x === 'number' && Number.isFinite(x);
}

/**
 * Strict validator for AirspaceResolvedSpec.
 * Returns { ok: true, spec } with sorted layers + _index, or { ok: false }.
 */
export function validateAirspaceResolvedSpec(spec) {
  let ok = true;

  if (!spec || typeof spec !== 'object') {
    refusal('spec must be an object');
    return { ok: false };
  }

  if (spec.airspaceSpecVersion !== '1.0') {
    ok = false;
    refusal('airspaceSpecVersion must be 1.0', `got=${String(spec.airspaceSpecVersion)}`);
  }

  if (!spec.airspaceId || typeof spec.airspaceId !== 'string') {
    ok = false;
    refusal('airspaceId must be a non-empty string');
  }

  if (!spec.scope || !['global', 'region', 'venue'].includes(spec.scope.type)) {
    ok = false;
    refusal('scope.type must be global|region|venue');
  }

  const c = spec.constants || {};
  const altMin = c.altitudeMinM;
  const altMax = c.altitudeMaxM;

  if (!isFiniteNum(altMin) || altMin < 0) {
    ok = false;
    refusal('constants.altitudeMinM must be finite >= 0');
  }
  if (!isFiniteNum(altMax) || altMax <= altMin) {
    ok = false;
    refusal('constants.altitudeMaxM must be finite and > altitudeMinM');
  }

  const shed = c.defaultShedOrder || [];
  if (!Array.isArray(shed) || shed.length === 0) {
    ok = false;
    refusal('constants.defaultShedOrder must be a non-empty array');
  } else {
    for (const s of shed) {
      if (!ALLOWED_SHED.has(s)) { ok = false; refusal('invalid shed entry', `entry=${s}`); }
    }
    if (new Set(shed).size !== shed.length) { ok = false; refusal('shed order has duplicates'); }
  }

  if (!Array.isArray(spec.layers) || spec.layers.length === 0) {
    ok = false;
    refusal('layers must be a non-empty array');
    return { ok: false };
  }

  const layers = [...spec.layers].sort((a, b) => (a.altitudeFloorM ?? 0) - (b.altitudeFloorM ?? 0));
  const seenIds = new Set();

  for (let i = 0; i < layers.length; i++) {
    const L = layers[i];
    const p = `layers[${i}]`;

    if (seenIds.has(L.layerId)) { ok = false; refusal(`${p}.layerId duplicate`); }
    seenIds.add(L.layerId);

    if (!isFiniteNum(L.altitudeFloorM) || !isFiniteNum(L.altitudeCeilingM)) {
      ok = false; refusal(`${p} altitude must be finite numbers`); continue;
    }
    if (L.altitudeCeilingM <= L.altitudeFloorM) {
      ok = false; refusal(`${p} ceiling must exceed floor`);
    }

    const pb = L.priorityBudget || {};
    const sum = (pb.truth || 0) + (pb.lenses || 0) + (pb.spectacle || 0);
    if (Math.abs(sum - 1.0) > 1e-6) {
      ok = false; refusal(`${p}.priorityBudget must sum to 1.0`, `sum=${sum}`);
    }

    const vr = L.visibilityRules || {};
    if (!ALLOWED_PRESENCE.has(vr.presenceMode)) {
      ok = false; refusal(`${p}.presenceMode invalid`, `got=${vr.presenceMode}`);
    }

    for (const f of ['filamentDetail', 'slabDetail', 'barkDetail', 'projectionDetail', 'weatherOverlays', 'arenaOverlays']) {
      if (!ALLOWED_DETAIL.has(vr[f])) {
        ok = false; refusal(`${p}.${f} invalid`, `got=${vr[f]}`);
      }
    }
  }

  for (let i = 0; i < layers.length; i++) {
    if (i === 0 && layers[i].altitudeFloorM !== altMin) {
      ok = false; refusal('first layer floor must equal altitudeMinM');
    }
    if (i > 0 && layers[i].altitudeFloorM !== layers[i - 1].altitudeCeilingM) {
      ok = false; refusal('layers must stitch (no gaps/overlaps)', `between ${layers[i - 1].name} and ${layers[i].name}`);
    }
    if (i === layers.length - 1 && layers[i].altitudeCeilingM !== altMax) {
      ok = false; refusal('last layer ceiling must equal altitudeMaxM');
    }
  }

  if (!ok) return { ok: false };

  spec.layers = layers;
  spec._index = {
    floors: layers.map(l => l.altitudeFloorM),
    ceilings: layers.map(l => l.altitudeCeilingM)
  };

  console.log(`[AIRSPACE] validate result=PASS layers=${layers.length} range=[${altMin},${altMax}]`);
  return { ok: true, spec };
}

/**
 * Fast altitude→layer lookup via binary search on precomputed _index.
 */
export function getLayerForAltitude(spec, altM) {
  const floors = spec._index?.floors || [];
  const layers = spec.layers || [];
  if (!floors.length) return null;

  const alt = Math.min(Math.max(altM, spec.constants.altitudeMinM), spec.constants.altitudeMaxM - 1e-9);

  let lo = 0, hi = floors.length - 1, ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (floors[mid] <= alt) { ans = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return layers[ans] || null;
}
