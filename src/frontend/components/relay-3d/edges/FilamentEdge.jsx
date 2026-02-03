// relay-3d/edges/FilamentEdge.jsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  pressureToThickness,
  deltaPRToHeatColor,
  deltaPRToCurvature,
  EDGE_TYPE_STYLES
} from '../utils/renderRules';

/**
 * FilamentEdge - Renders a DIRECTIONAL connection between two nodes
 * Canon: No orbits, only flows. Heat ONLY on diverging edges.
 * Supports DEPENDS_ON (curved, heat-colored), ASSERTED_BY (dashed), EVIDENCED_BY (thin)
 */
export default function FilamentEdge({
  id,
  type = 'DEPENDS_ON',
  fromPosition = [0, 0, 0],
  toPosition = [1, 0, 0],
  pressure = 10,
  deltaPR = 0,
  particleFlow = true,
  onClick,
  onHover
}) {
  const tubeRef = useRef();
  const particlesRef = useRef([]);
  const timeRef = useRef(0);

  // Calculate visual properties
  const thickness = useMemo(() => pressureToThickness(pressure), [pressure]);
  
  // Canon: Heat ONLY on DEPENDS_ON edges (divergence indicator)
  // Other edges NEVER show heat
  const heatColor = useMemo(() => {
    if (type === 'DEPENDS_ON' && deltaPR > 0) {
      return deltaPRToHeatColor(deltaPR);
    }
    // All other edges: use their canonical color (no heat)
    return EDGE_TYPE_STYLES[type]?.color || 0xFFFFFF;
  }, [type, deltaPR]);

  const curvature = useMemo(() => deltaPRToCurvature(deltaPR), [deltaPR]);
  const isDashed = useMemo(() => EDGE_TYPE_STYLES[type]?.dashed || false, [type]);

  // Create path (curved or straight)
  const path = useMemo(() => {
    const start = new THREE.Vector3(...fromPosition);
    const end = new THREE.Vector3(...toPosition);

    if (type === 'DEPENDS_ON' && curvature > 0) {
      // Curved path for divergence
      const mid1 = start.clone().lerp(end, 0.33);
      const mid2 = start.clone().lerp(end, 0.66);

      // Add perpendicular offset based on curvature
      const direction = end.clone().sub(start);
      const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
      const offset = curvature * 0.2;

      mid1.add(perpendicular.clone().multiplyScalar(offset));
      mid2.add(perpendicular.clone().multiplyScalar(offset));

      return new THREE.CatmullRomCurve3([start, mid1, mid2, end], false, 'catmullrom', 0.3);
    } else {
      // Straight line
      return new THREE.LineCurve3(start, end);
    }
  }, [fromPosition, toPosition, type, curvature]);

  // Create tube geometry
  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(path, 64, thickness, 8, false);
  }, [path, thickness]);

  // Material with optional dashing
  const material = useMemo(() => {
    if (isDashed) {
      return (
        <meshBasicMaterial
          color={heatColor}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      );
    }
    return (
      <meshBasicMaterial
        color={heatColor}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    );
  }, [heatColor, isDashed]);

  // Particle flow animation
  useFrame((state, delta) => {
    timeRef.current += delta;

    // Pulse effect
    if (tubeRef.current && pressure > 0) {
      const pulseValue = Math.sin(timeRef.current * pressure * 0.1) * 0.5 + 0.5;
      tubeRef.current.material.opacity = 0.8 + pulseValue * 0.2;
    }

    // Particle flow (implemented in parent component for performance)
  });

  // Arrow indicator - DIRECTIONAL (must be clearly visible)
  // Canon: particle flow shows causality (start → end)
  const arrowPosition = useMemo(() => {
    return path.getPointAt(0.7);
  }, [path]);

  const arrowDirection = useMemo(() => {
    const tangent = path.getTangentAt(0.7);
    return tangent;
  }, [path]);
  
  const arrowRotation = useMemo(() => {
    const tangent = path.getTangentAt(0.7);
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(up, tangent.normalize());
    return quaternion;
  }, [path]);

  return (
    <group>
      {/* Main tube */}
      <mesh
        ref={tubeRef}
        geometry={tubeGeometry}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          if (onHover) onHover(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'default';
          if (onHover) onHover(false);
        }}
      >
        {material}
      </mesh>

      {/* Directional arrow - CLEAR CAUSALITY */}
      <mesh position={arrowPosition} quaternion={arrowRotation}>
        <coneGeometry args={[0.02, 0.04, 8]} />
        <meshBasicMaterial 
          color={heatColor} 
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Dashed effect for ASSERTED_BY */}
      {isDashed && (
        <lineSegments>
          <edgesGeometry attach="geometry" args={[tubeGeometry]} />
          <lineDashedMaterial
            color={heatColor}
            dashSize={0.02}
            gapSize={0.01}
            linewidth={2}
          />
        </lineSegments>
      )}
    </group>
  );
}
