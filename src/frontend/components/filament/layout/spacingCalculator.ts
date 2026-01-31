/**
 * SPACING CALCULATOR - Typography-Only Filament Spacing
 * 
 * Computes micro-gaps between filaments in collections.
 * Spacing is PURE TYPOGRAPHY - never semantic.
 * 
 * Rule: Default gap = 1.2× max glyph outer radius
 */

import { FilamentSpacing } from '../types/Filament';
import { LayoutConfig } from './layoutEngine';

/**
 * SPACING PRESETS
 */
export const SPACING_PRESETS = {
  tight: 1.0,   // Minimal gap
  normal: 1.2,  // Default (1.2× radius)
  wide: 1.5,    // Extra readability
} as const;

/**
 * COMPUTE FILAMENT SPACING
 * 
 * Returns Z-offset for filament at given index.
 * 
 * @param index - Filament index in collection
 * @param spacing - Spacing configuration
 * @param glyphRadius - Maximum glyph outer radius
 * @param config - Layout configuration
 * @returns Z offset (world units)
 */
export function computeFilamentSpacing(
  index: number,
  spacing: FilamentSpacing,
  glyphRadius: number,
  config: LayoutConfig
): number {
  let multiplier: number;
  
  if (spacing.mode === 'custom' && spacing.customGap !== undefined) {
    multiplier = spacing.customGap;
  } else {
    multiplier = SPACING_PRESETS[spacing.mode] || SPACING_PRESETS.normal;
  }
  
  const gap = multiplier * glyphRadius;
  return index * gap;
}

/**
 * COMPUTE VIEW-AWARE SPACING
 * 
 * Adjusts spacing based on camera distance (tightens at far zoom).
 * 
 * @param baseSpacing - Base spacing value
 * @param cameraDistance - Current camera distance
 * @param minDistance - Min camera distance (near)
 * @param maxDistance - Max camera distance (far)
 * @param compressionFactor - How much to compress at far zoom (0-1)
 * @returns Adjusted spacing
 */
export function computeViewAwareSpacing(
  baseSpacing: number,
  cameraDistance: number,
  minDistance: number,
  maxDistance: number,
  compressionFactor: number = 0.5
): number {
  // Normalize camera distance (0 = near, 1 = far)
  const normalizedDistance = Math.max(
    0,
    Math.min(1, (cameraDistance - minDistance) / (maxDistance - minDistance))
  );
  
  // Compress spacing at far distance
  const compression = 1 - (normalizedDistance * compressionFactor);
  
  return baseSpacing * compression;
}

/**
 * COMPUTE BOUNDING CYLINDER RADIUS
 * 
 * For a filament with glyphs, compute the maximum outer radius.
 * Used to determine safe spacing.
 * 
 * @param pipeRadius - Base filament pipe radius
 * @param maxGlyphExtension - Maximum glyph extension beyond pipe
 * @returns Outer radius
 */
export function computeBoundingRadius(
  pipeRadius: number,
  maxGlyphExtension: number
): number {
  return pipeRadius + maxGlyphExtension;
}

/**
 * COMPUTE COLLECTION BOUNDS
 * 
 * Compute total XYZ bounds for a collection of filaments.
 */
export interface CollectionBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export function computeCollectionBounds(
  filamentCount: number,
  filamentLength: number,
  filamentHeight: number,
  spacing: number
): CollectionBounds {
  const totalZ = filamentCount * spacing;
  
  return {
    minX: 0,
    maxX: filamentLength,
    minY: -filamentHeight,
    maxY: filamentHeight,
    minZ: 0,
    maxZ: totalZ,
  };
}

/**
 * HELPER: Get recommended spacing for glyph size
 */
export function getRecommendedSpacing(
  glyphRadius: number,
  mode: 'tight' | 'normal' | 'wide' = 'normal'
): number {
  return glyphRadius * SPACING_PRESETS[mode];
}
