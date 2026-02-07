/**
 * PRIVACY TIER RESOLVER
 * 
 * Resolves visibility tier based on:
 * - Policy level (0-6): existence gate
 * - Distance: fidelity within allowed gate
 * - Role/context: maps to policy presets
 * 
 * Core invariant: Distance changes fidelity ONLY if permission allows existence.
 */

/**
 * Distance breakpoints (real-life privacy feel)
 */
const DISTANCE_BREAKPOINTS = {
  INVISIBLE: Infinity,      // L0: never visible
  FAR: 50,                  // L1-L2: presence/boxes only
  MEDIUM: 25,               // L3: types visible
  NEAR: 15,                 // L4: blurred systems
  CLOSE: 8,                 // L5: clear/readable
  ENGAGE: 5,                // L6: editable
};

/**
 * Policy Level Definitions
 */
export const POLICY_LEVELS = {
  INVISIBLE: 0,             // Nothing rendered
  PRESENCE_ONLY: 1,         // "Someone's here" beads only
  BOXES_ONLY: 2,            // Anonymous TimeBoxes, no content
  TYPES_ONLY: 3,            // Type tags visible, no values
  BLURRED_SYSTEMS: 4,       // System silhouettes, data hidden
  READ_CLEAR: 5,            // Full read access, no editing
  ENGAGE: 6,                // Edit/commit access
};

/**
 * Role Presets (convenience mapping)
 */
export const ROLE_PRESETS = {
  public: { defaultPolicy: POLICY_LEVELS.BOXES_ONLY, label: 'Public' },
  member: { defaultPolicy: POLICY_LEVELS.TYPES_ONLY, label: 'Member' },
  editor: { defaultPolicy: POLICY_LEVELS.READ_CLEAR, label: 'Editor' },
  admin: { defaultPolicy: POLICY_LEVELS.ENGAGE, label: 'Admin' },
  owner: { defaultPolicy: POLICY_LEVELS.ENGAGE, label: 'Owner' },
};

/**
 * Resolve visibility tier from policy + distance
 * 
 * @param {number} policyLevel - Policy ceiling (0-6)
 * @param {number} cameraDistance - Distance from filament
 * @returns {object} Resolved tier with rendering flags
 */
export function resolveTier(policyLevel, cameraDistance) {
  // L0: Invisible (policy blocks existence entirely)
  if (policyLevel === POLICY_LEVELS.INVISIBLE) {
    return {
      tier: 0,
      label: 'L0: Invisible',
      renderFlags: {
        showFilament: false,
        showPresence: false,
        showBoxes: false,
        showTypes: false,
        showBlur: false,
        showClear: false,
        allowEngage: false,
      },
    };
  }

  // L1: Presence-only (only beads, no geometry)
  if (policyLevel === POLICY_LEVELS.PRESENCE_ONLY) {
    return {
      tier: 1,
      label: 'L1: Presence Only',
      renderFlags: {
        showFilament: false,
        showPresence: true,
        showBoxes: false,
        showTypes: false,
        showBlur: false,
        showClear: false,
        allowEngage: false,
      },
    };
  }

  // L2: Boxes-only (anonymous cubes, no face content)
  if (policyLevel === POLICY_LEVELS.BOXES_ONLY) {
    return {
      tier: 2,
      label: 'L2: Boxes Only',
      renderFlags: {
        showFilament: true,
        showPresence: true,
        showBoxes: true,
        showTypes: false,
        showBlur: false,
        showClear: false,
        allowEngage: false,
      },
    };
  }

  // L3: Types-only (add type badges, still no values)
  if (policyLevel === POLICY_LEVELS.TYPES_ONLY) {
    return {
      tier: 3,
      label: 'L3: Types Only',
      renderFlags: {
        showFilament: true,
        showPresence: true,
        showBoxes: true,
        showTypes: true,
        showBlur: false,
        showClear: false,
        allowEngage: false,
      },
    };
  }

  // L4: Blurred systems (system silhouettes, data masked)
  if (policyLevel === POLICY_LEVELS.BLURRED_SYSTEMS) {
    return {
      tier: 4,
      label: 'L4: Blurred Systems',
      renderFlags: {
        showFilament: true,
        showPresence: true,
        showBoxes: true,
        showTypes: true,
        showBlur: true,
        showClear: false,
        allowEngage: false,
      },
    };
  }

  // L5: Read-only clear (faces readable, evidence visible, no editing)
  if (policyLevel === POLICY_LEVELS.READ_CLEAR) {
    // Distance modulates within L5
    const isCloseEnough = cameraDistance <= DISTANCE_BREAKPOINTS.CLOSE;
    
    return {
      tier: 5,
      label: 'L5: Read Clear',
      renderFlags: {
        showFilament: true,
        showPresence: true,
        showBoxes: true,
        showTypes: true,
        showBlur: false,
        showClear: isCloseEnough, // Distance gates clarity
        allowEngage: false,
      },
    };
  }

  // L6: Engage (edit/commit access)
  if (policyLevel === POLICY_LEVELS.ENGAGE) {
    // Distance modulates within L6
    const isCloseEnough = cameraDistance <= DISTANCE_BREAKPOINTS.CLOSE;
    const isEngageDistance = cameraDistance <= DISTANCE_BREAKPOINTS.ENGAGE;

    return {
      tier: 6,
      label: 'L6: Engage',
      renderFlags: {
        showFilament: true,
        showPresence: true,
        showBoxes: true,
        showTypes: true,
        showBlur: false,
        showClear: isCloseEnough,
        allowEngage: isEngageDistance, // Must be very close to engage
      },
    };
  }

  // Fallback: treat as invisible
  return {
    tier: 0,
    label: 'L0: Invalid Policy',
    renderFlags: {
      showFilament: false,
      showPresence: false,
      showBoxes: false,
      showTypes: false,
      showBlur: false,
      showClear: false,
      allowEngage: false,
    },
  };
}

/**
 * Get distance tier label for UI
 */
export function getDistanceLabel(distance) {
  if (distance > DISTANCE_BREAKPOINTS.FAR) return 'Very Far';
  if (distance > DISTANCE_BREAKPOINTS.MEDIUM) return 'Far';
  if (distance > DISTANCE_BREAKPOINTS.NEAR) return 'Medium';
  if (distance > DISTANCE_BREAKPOINTS.CLOSE) return 'Near';
  if (distance > DISTANCE_BREAKPOINTS.ENGAGE) return 'Close';
  return 'Very Close (Engage)';
}

/**
 * Get policy level name
 */
export function getPolicyLevelName(level) {
  const names = ['Invisible', 'Presence Only', 'Boxes Only', 'Types Only', 'Blurred Systems', 'Read Clear', 'Engage'];
  return names[level] || 'Unknown';
}
