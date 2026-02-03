// relay-3d/nodes/FilamentNode.jsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  confidenceToOpacity,
  confidenceToHaloScale,
  pressureToPulseRate,
  NODE_TYPE_GEOMETRY,
  NODE_TYPE_COLORS
} from '../utils/renderRules';

/**
 * FilamentNode - Renders a single node in the 3D filament visualization
 * Supports STATE, REALITY_ANCHOR, CAPABILITY, and EVIDENCE types
 */
export default function FilamentNode({
  id,
  position = [0, 0, 0],
  kind = 'STATE',
  confidence = 80,
  pressure = 10,
  deltaPR = 0,
  status = 'STABLE',
  label = '',
  onClick,
  onHover,
  selected = false
}) {
  const meshRef = useRef();
  const haloRef = useRef();
  const timeRef = useRef(0);

  // Calculate visual properties from metrics
  const opacity = useMemo(() => confidenceToOpacity(confidence), [confidence]);
  const haloScale = useMemo(() => confidenceToHaloScale(confidence), [confidence]);
  const pulseRate = useMemo(() => pressureToPulseRate(pressure), [pressure]);
  const colors = useMemo(() => NODE_TYPE_COLORS[kind] || NODE_TYPE_COLORS.STATE, [kind]);

  // Geometry based on node type
  const geometry = useMemo(() => {
    const geomType = NODE_TYPE_GEOMETRY[kind] || 'icosahedron';
    const radius = kind === 'STATE' ? 0.06 : kind === 'REALITY_ANCHOR' ? 0.05 : 0.045;
    const detail = 2;

    switch (geomType) {
      case 'icosahedron':
        return <icosahedronGeometry args={[radius, detail]} />;
      case 'octahedron':
        return <octahedronGeometry args={[radius, detail]} />;
      case 'box':
        return <boxGeometry args={[radius, radius, radius]} />;
      case 'tetrahedron':
        return <tetrahedronGeometry args={[radius, detail]} />;
      default:
        return <icosahedronGeometry args={[radius, detail]} />;
    }
  }, [kind]);

  // Pulse animation - MECHANICAL (pressure signal, not decoration)
  // Canon: pulse rate = diagnostic signal, shallow and rhythmic
  useFrame((state, delta) => {
    timeRef.current += delta;

    if (meshRef.current && pulseRate > 0) {
      const pulseValue = Math.sin(timeRef.current * pulseRate * 2 * Math.PI);
      
      // REDUCED amplitudes: subtle, controlled, mechanical
      const scaleAmplitude = 0.03; // was 0.1 - no scaling explosions
      const opacityAmplitude = 0.08; // was 0.2 - shallow pulse

      // Scale pulse (minimal)
      const scale = 1 + pulseValue * scaleAmplitude;
      meshRef.current.scale.setScalar(scale);

      // Opacity pulse (controlled)
      if (meshRef.current.material) {
        const baseOpacity = opacity;
        meshRef.current.material.opacity = baseOpacity + pulseValue * opacityAmplitude * 0.5;
      }
    }

    // Halo pulse (very subtle, not dominant)
    if (haloRef.current) {
      const haloGlow = Math.sin(timeRef.current * pulseRate * Math.PI) * 0.5 + 0.5;
      haloRef.current.material.opacity = haloGlow * 0.3; // was 0.5
    }

    // Selection highlight (contained)
    if (selected && meshRef.current) {
      const highlight = Math.sin(timeRef.current * 4) * 0.2 + 0.8; // was 0.3 + 0.7
      meshRef.current.material.emissiveIntensity = highlight * 1.0; // was 1.5
    }
  });

  // Halo sprite texture - CONTAINED glow (not sun-like)
  // Canon: nodes are anchors, not celestial bodies
  const haloTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Reduced radius: contained glow, no corona
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 80); // was 128
    gradient.addColorStop(0, `rgba(${(colors.color >> 16) & 255}, ${(colors.color >> 8) & 255}, ${colors.color & 255}, 0.8)`); // was 1
    gradient.addColorStop(0.6, `rgba(${(colors.color >> 16) & 255}, ${(colors.color >> 8) & 255}, ${colors.color & 255}, 0.1)`); // was 0.3
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    return new THREE.CanvasTexture(canvas);
  }, [colors.color]);

  return (
    <group position={position}>
      {/* Main node mesh */}
      <mesh
        ref={meshRef}
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
        {geometry}
        <meshStandardMaterial
          color={colors.color}
          emissive={colors.emissive}
          emissiveIntensity={0.8}
          transparent
          opacity={opacity}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Halo sprite - CONTAINED (reduced 30-40%) */}
      <sprite ref={haloRef} scale={haloScale * 0.65}>
        <spriteMaterial
          map={haloTexture}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* Label (optional - can be rendered via CSS2D in parent) */}
    </group>
  );
}
