// relay-3d/controls/FreeFlightControls.jsx
import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import * as THREE from 'three';

/**
 * FreeFlightControls - RTS-freeflight + FPS fly physics
 * 
 * Controls:
 * - Mouse: look (yaw/pitch) with pointer lock
 * - WASD: forward/back + strafe
 * - Q / E: down / up (vertical)
 * - Shift: fast
 * - Ctrl: slow/precision
 * - Space: up (alternative to E)
 * - R: return to anchor
 * - Scroll: speed scalar (not zoom)
 * - Escape: unlock pointer / HOLD mode
 * 
 * Physics:
 * - Acceleration + damping (feels like a body, not teleport)
 * - No orbit constraints
 * - Smooth velocity interpolation
 */
export default function FreeFlightControls({ 
  enabled = true,
  anchorPosition = [0, 0, 0],
  onModeChange = null,
  onSpeedChange = null
}) {
  const { camera, gl } = useThree();
  const controlsRef = useRef(null);
  const stateRef = useRef({
    // Tunables (exposed for UI sliders later)
    baseSpeed: 6.0,
    fastMult: 4.0,
    slowMult: 0.25,
    accel: 28.0,        // higher = snappier
    damping: 12.0,      // higher = more "brake"
    verticalSpeedMult: 0.9,
    
    // State
    velocity: new THREE.Vector3(),
    wishDirection: new THREE.Vector3(),
    keys: {},
    mode: 'HOLD',       // 'FREE-FLY' | 'HOLD' | 'INSPECT'
    returningToAnchor: false,
    anchorTarget: new THREE.Vector3(...anchorPosition)
  });

  // Initialize PointerLockControls
  useEffect(() => {
    if (!enabled) return;

    const controls = new PointerLockControls(camera, gl.domElement);
    controlsRef.current = controls;

    // Click to lock
    const handleClick = () => {
      if (stateRef.current.mode === 'HOLD') {
        controls.lock();
        stateRef.current.mode = 'FREE-FLY';
        if (onModeChange) onModeChange('FREE-FLY');
      }
    };

    // Lock/unlock events
    const handleLock = () => {
      stateRef.current.mode = 'FREE-FLY';
      if (onModeChange) onModeChange('FREE-FLY');
    };

    const handleUnlock = () => {
      stateRef.current.mode = 'HOLD';
      // Damp velocity to zero on HOLD
      stateRef.current.velocity.multiplyScalar(0);
      if (onModeChange) onModeChange('HOLD');
    };

    gl.domElement.addEventListener('click', handleClick);
    controls.addEventListener('lock', handleLock);
    controls.addEventListener('unlock', handleUnlock);

    return () => {
      gl.domElement.removeEventListener('click', handleClick);
      controls.removeEventListener('lock', handleLock);
      controls.removeEventListener('unlock', handleUnlock);
      controls.dispose();
    };
  }, [enabled, camera, gl, onModeChange]);

  // Keyboard input
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      stateRef.current.keys[e.code] = true;

      // R: return to anchor
      if (e.code === 'KeyR') {
        stateRef.current.returningToAnchor = true;
        stateRef.current.mode = 'INSPECT';
        if (onModeChange) onModeChange('INSPECT');
      }
    };

    const handleKeyUp = (e) => {
      stateRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, onModeChange]);

  // Scroll changes baseSpeed (not zoom)
  useEffect(() => {
    if (!enabled) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.6 : 0.6;
      stateRef.current.baseSpeed = THREE.MathUtils.clamp(
        stateRef.current.baseSpeed + delta,
        0.5,
        60
      );
      if (onSpeedChange) {
        onSpeedChange(stateRef.current.baseSpeed);
      }
    };

    gl.domElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      gl.domElement.removeEventListener('wheel', handleWheel);
    };
  }, [enabled, gl, onSpeedChange]);

  // Update anchor position
  useEffect(() => {
    stateRef.current.anchorTarget.set(...anchorPosition);
  }, [anchorPosition]);

  // Update loop - fly physics
  useFrame((state, dt) => {
    if (!enabled || !controlsRef.current) return;

    const controls = controlsRef.current;
    const s = stateRef.current;

    // Return to anchor (smooth glide)
    if (s.returningToAnchor) {
      const cameraPos = controls.getObject().position;
      const toAnchor = s.anchorTarget.clone().sub(cameraPos);
      const distance = toAnchor.length();

      if (distance < 0.1) {
        // Arrived
        s.returningToAnchor = false;
        s.velocity.set(0, 0, 0);
        s.mode = 'HOLD';
        if (onModeChange) onModeChange('HOLD');
      } else {
        // Smooth glide with ease-out
        const glideSpeed = Math.min(distance * 3, s.baseSpeed * 2);
        toAnchor.normalize().multiplyScalar(glideSpeed);
        cameraPos.addScaledVector(toAnchor, dt);
      }
      return;
    }

    // Only update velocity if locked (FREE-FLY mode)
    if (!controls.isLocked) {
      // HOLD mode: damp velocity to zero
      s.velocity.multiplyScalar(Math.exp(-s.damping * dt));
      return;
    }

    // Speed modifiers
    let speed = s.baseSpeed;
    if (s.keys['ShiftLeft'] || s.keys['ShiftRight']) speed *= s.fastMult;
    if (s.keys['ControlLeft'] || s.keys['ControlRight']) speed *= s.slowMult;

    // Wish direction in local camera space
    const wish = s.wishDirection;
    wish.set(0, 0, 0);
    if (s.keys['KeyW']) wish.z -= 1;
    if (s.keys['KeyS']) wish.z += 1;
    if (s.keys['KeyA']) wish.x -= 1;
    if (s.keys['KeyD']) wish.x += 1;
    if (s.keys['KeyE'] || s.keys['Space']) wish.y += 1;
    if (s.keys['KeyQ']) wish.y -= 1;

    if (wish.lengthSq() > 0) wish.normalize();

    // Convert to world direction (camera-relative)
    const forward = new THREE.Vector3();
    controls.getDirection(forward);  // forward in world
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const up = new THREE.Vector3().copy(camera.up);

    const desired = new THREE.Vector3()
      .addScaledVector(right, wish.x)
      .addScaledVector(up, wish.y * s.verticalSpeedMult)
      .addScaledVector(forward, wish.z)
      .normalize()
      .multiplyScalar(speed);

    // Accelerate toward desired velocity
    s.velocity.lerp(desired, 1 - Math.exp(-s.accel * dt));

    // Damping when no input (soft stop)
    if (wish.lengthSq() === 0) {
      s.velocity.multiplyScalar(Math.exp(-s.damping * dt));
    }

    // Apply velocity to camera position
    controls.getObject().position.addScaledVector(s.velocity, dt);

    // Notify speed changes for HUD
    if (onSpeedChange && Math.abs(s.velocity.length() - speed) > 0.01) {
      onSpeedChange(s.baseSpeed);
    }
  });

  return null; // This component only manages controls, no visual output
}
