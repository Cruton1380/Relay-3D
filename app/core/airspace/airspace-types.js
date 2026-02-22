/**
 * AirspaceResolvedSpec — fully resolved (global + venue overrides applied),
 * ready for fast altitude→layer lookup.
 */
export function makeAirspaceResolvedSpec(input) {
  return {
    airspaceSpecVersion: input.airspaceSpecVersion,
    airspaceId: input.airspaceId,
    scope: input.scope,

    constants: {
      altitudeMinM: input.constants.altitudeMinM ?? 0,
      altitudeMaxM: input.constants.altitudeMaxM ?? 1_000_000_000,
      defaultShedOrder: input.constants.defaultShedOrder ?? ['spectacle', 'lenses', 'detail'],
      frozenInvariants: {
        truthFirst: true,
        noPhysicsAboveSource: true,
        presenceQuantizationAboveRegion: true,
        noPayToWinAirspace: true,
        ...(input.constants.frozenInvariants || {})
      }
    },

    layers: (input.layers || []).map(l => ({
      layerId: l.layerId,
      name: l.name,
      altitudeFloorM: l.altitudeFloorM,
      altitudeCeilingM: l.altitudeCeilingM,
      safetyProfile: l.safetyProfile || 'open',

      priorityBudget: {
        truth: l.priorityBudget?.truth ?? 0.7,
        lenses: l.priorityBudget?.lenses ?? 0.25,
        spectacle: l.priorityBudget?.spectacle ?? 0.05
      },

      visibilityRules: {
        presenceMode: l.visibilityRules?.presenceMode ?? 'INDIVIDUAL',
        presencePrecisionMeters: l.visibilityRules?.presencePrecisionMeters ?? 10,
        presenceTimeBucketSec: l.visibilityRules?.presenceTimeBucketSec ?? 5,

        filamentDetail: l.visibilityRules?.filamentDetail ?? 'LOD_ONLY',
        slabDetail: l.visibilityRules?.slabDetail ?? 'SUMMARY',
        barkDetail: l.visibilityRules?.barkDetail ?? 'SUMMARY',
        projectionDetail: l.visibilityRules?.projectionDetail ?? 'SUMMARY',

        weatherOverlays: l.visibilityRules?.weatherOverlays ?? 'SUMMARY',
        arenaOverlays: l.visibilityRules?.arenaOverlays ?? 'OFF',

        allowBranchEdit: !!l.visibilityRules?.allowBranchEdit,
        allowCommitActions: !!l.visibilityRules?.allowCommitActions
      }
    })),

    renderPolicy: {
      defaultShedOrder: input.renderPolicy?.defaultShedOrder ?? ['spectacle', 'lenses', 'detail'],
      truthNeverShedBelow: input.renderPolicy?.truthNeverShedBelow ?? 'TREE',
      auditLogsEnabled: input.renderPolicy?.auditLogsEnabled !== false,
      auditLogTag: input.renderPolicy?.auditLogTag ?? '[AIRSPACE]'
    },

    governance: {
      enabled: !!input.governance?.enabled,
      note: input.governance?.note || ''
    },

    _index: { floors: [], ceilings: [] }
  };
}
