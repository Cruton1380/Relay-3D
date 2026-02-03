// relay-3d/utils/renderRules.js
// Metric-to-visual mapping functions based on RELAY-FILAMENT-VISUAL-SPEC.md

/**
 * Maps confidence [0-100] to node opacity [0.2-1.0]
 * Higher confidence = more opaque
 */
export function confidenceToOpacity(confidence) {
  return 0.2 + (confidence / 100) * 0.8;
}

/**
 * Maps confidence [0-100] to halo scale [0.05-0.20]
 * Higher confidence = tighter halo (smaller scale)
 */
export function confidenceToHaloScale(confidence) {
  return 0.20 - (confidence / 100) * 0.15;
}

/**
 * Maps pressure [0-100] to edge thickness [0.002-0.02]
 * Higher pressure = thicker edges
 */
export function pressureToThickness(pressure) {
  return 0.002 + (pressure / 100) * 0.018;
}

/**
 * Maps pressure [0-100] to pulse rate [0-1.5 Hz]
 * Higher pressure = faster pulse
 */
export function pressureToPulseRate(pressure) {
  return (pressure / 100) * 1.5;
}

/**
 * Maps deltaPR [0-100] to heat color (divergence indicator)
 * 0 = White (aligned)
 * 1-20 = Orange (minor divergence)
 * 21-50 = Deep Orange (major divergence)
 * 51+ = Red (critical divergence)
 */
export function deltaPRToHeatColor(deltaPR) {
  if (deltaPR === 0) return 0xFFFFFF; // White
  if (deltaPR < 20) return 0xFF9800; // Orange
  if (deltaPR < 50) return 0xFF5722; // Deep Orange
  return 0xF44336; // Red
}

/**
 * Maps deltaPR [0-100] to path curvature amount
 * 0 = Straight line
 * Higher = More curved path
 */
export function deltaPRToCurvature(deltaPR) {
  return deltaPR / 100; // 0.0 to 1.0
}

/**
 * Node type to geometry mapping
 */
export const NODE_TYPE_GEOMETRY = {
  STATE: 'icosahedron',
  REALITY_ANCHOR: 'octahedron',
  CAPABILITY: 'box',
  EVIDENCE: 'tetrahedron'
};

/**
 * Node type to color mapping
 */
export const NODE_TYPE_COLORS = {
  STATE: { color: 0xFFD700, emissive: 0xFFAA00 },
  REALITY_ANCHOR: { color: 0x4FC3F7, emissive: 0x2196F3 },
  CAPABILITY: { color: 0x00BCD4, emissive: 0x00ACC1 },
  EVIDENCE: { color: 0x7C4DFF, emissive: 0x651FFF }
};

/**
 * Edge type to style mapping
 */
export const EDGE_TYPE_STYLES = {
  DEPENDS_ON: { dashed: false, color: null }, // Color from deltaPR
  ASSERTED_BY: { dashed: true, color: 0xFFFFFF },
  EVIDENCED_BY: { dashed: false, color: 0xE1F5FE }
};
