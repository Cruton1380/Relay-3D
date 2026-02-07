/**
 * PRESENCE LAYER - Tier 1 (Counts Only)
 * 
 * Renders presence as tiny beads on filament + count labels.
 * 
 * Tier 1: No identities, no avatars, no trails.
 * Pure additive layer - never touches filament truth geometry.
 */

import React, { useState, useEffect } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { presenceService } from '../services/presenceService';

/**
 * PresenceLayer Component
 * 
 * @param {Object} props
 * @param {Array} props.lociInView - Array of {filamentId, commitIndex} currently visible
 * @param {Map} props.anchorMap - eventIndex → xPosition lookup for positioning
 * @param {number} props.cameraDistance - Distance from camera (for near/far rendering)
 * @param {string} props.lensContext - Optional lens context (e.g., 'workflow', 'globe')
 */
export default function PresenceLayer({ 
  lociInView = [], 
  anchorMap = new Map(), 
  cameraDistance = 50,
  lensContext = 'workflow'
}) {
  const [presenceData, setPresenceData] = useState([]);

  // Poll presence service for current loci
  useEffect(() => {
    if (lociInView.length === 0) return;

    const updatePresence = () => {
      const results = presenceService.getPresenceForLoci(
        lociInView.map(locus => ({
          ...locus,
          lensContext,
        }))
      );
      
      // Filter to only show loci with viewers (count > 0)
      setPresenceData(results.filter(r => r.count > 0));
    };

    // Initial update
    updatePresence();

    // Poll every 2 seconds (matches heartbeat interval)
    const interval = setInterval(updatePresence, 2000);

    return () => clearInterval(interval);
  }, [lociInView, lensContext]);

  // Render presence markers for each locus with viewers
  return (
    <group name="presence-layer">
      {presenceData.map((presence, i) => {
        const xPos = anchorMap.get(presence.locus.commitIndex) ?? presence.locus.commitIndex * 10;
        const showLabel = cameraDistance < 60; // Near distance only
        
        return (
          <PresenceMarker
            key={`${presence.locus.filamentId}@${presence.locus.commitIndex}`}
            xPosition={xPos}
            count={presence.count}
            showLabel={showLabel}
          />
        );
      })}
    </group>
  );
}

/**
 * Presence Marker - Single bead + count label
 * 
 * Tier 1: Simple sphere, no identity
 */
function PresenceMarker({ xPosition, count, showLabel }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={[xPosition, 3.5, 0]}>
      {/* Presence bead - tiny sphere on filament spine */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? '#FFD700' : '#2ECC71'}
          transparent
          opacity={0.8}
          emissive={hovered ? '#FFD700' : '#2ECC71'}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>

      {/* Subtle pulse ring (always visible) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.3, 16]} />
        <meshBasicMaterial
          color="#2ECC71"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Count label (near distance or hover) */}
      {(showLabel || hovered) && (
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.3}
          color="#E6E6E6"
          anchorX="center"
          anchorY="bottom"
        >
          {count} {count === 1 ? 'viewer' : 'viewers'}
        </Text>
      )}

      {/* Hover detail (Tier 1: count only) */}
      {hovered && (
        <Text
          position={[0, 1.3, 0]}
          fontSize={0.2}
          color="#888888"
          anchorX="center"
          anchorY="bottom"
        >
          inspecting this commit
        </Text>
      )}
    </group>
  );
}
