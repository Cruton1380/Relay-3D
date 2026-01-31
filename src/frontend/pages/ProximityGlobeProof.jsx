import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import {
  generateMockBeacons,
  generateWalkPath,
  detectNearbyBeacons,
  updatePresence,
  calculateDistance,
} from '../components/proximity/schemas/proximitySchemas.js';

/**
 * Proximity Globe Proof — The Keystone
 * 
 * Demonstrates:
 * 1. Walk around in real life → see on globe
 * 2. Three entity types: users (🟢), venues (📍), events (📅)
 * 3. Privacy ladder enforced (L0-L6)
 * 4. Distance never escalates tier (only consent)
 * 5. Presence decays visually (TTL-based)
 */
export default function ProximityGlobeProof() {
  const [userPosition, setUserPosition] = useState({ lat: 47.609, lng: -122.342 });
  const [walkPath] = useState(generateWalkPath());
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [walkSpeed, setWalkSpeed] = useState(2); // 1x, 2x, 5x

  const [discoverySettings, setDiscoverySettings] = useState({
    proximityEnabled: true,
    intentEnabled: false,
    tier: 2, // L2: tags visible
    radius: 200, // meters
    maxTierForProximity: 3, // User policy: max L3
  });

  const [allBeacons, setAllBeacons] = useState(generateMockBeacons());
  const [nearbyBeacons, setNearbyBeacons] = useState([]);
  const [selectedBeacon, setSelectedBeacon] = useState(null);

  const walkIntervalRef = useRef(null);

  // Update nearby beacons when position changes
  useEffect(() => {
    if (discoverySettings.proximityEnabled) {
      const updated = updatePresence(allBeacons);
      const nearby = detectNearbyBeacons(userPosition, updated, discoverySettings);
      setNearbyBeacons(nearby);
    } else {
      setNearbyBeacons([]);
    }
  }, [userPosition, allBeacons, discoverySettings]);

  // Walk simulation
  useEffect(() => {
    if (isWalking) {
      walkIntervalRef.current = setInterval(() => {
        setCurrentPathIndex((prev) => {
          if (prev >= walkPath.length - 1) {
            setIsWalking(false);
            return prev;
          }

          const current = walkPath[prev];
          const next = walkPath[prev + 1];

          // Interpolate between waypoints
          setUserPosition((pos) => {
            const direction = {
              lat: next.lat - pos.lat,
              lng: next.lng - pos.lng,
            };
            const distance = Math.sqrt(direction.lat ** 2 + direction.lng ** 2);
            const speed = 0.0001 * walkSpeed;

            if (distance < speed) {
              return next;
            } else {
              return {
                lat: pos.lat + (direction.lat / distance) * speed,
                lng: pos.lng + (direction.lng / distance) * speed,
              };
            }
          });

          // Check if reached next waypoint
          const dist = calculateDistance(userPosition, next);
          if (dist < 10) {
            // Within 10m
            return prev + 1;
          }

          return prev;
        });
      }, 100); // Update every 100ms
    } else {
      if (walkIntervalRef.current) {
        clearInterval(walkIntervalRef.current);
      }
    }

    return () => {
      if (walkIntervalRef.current) {
        clearInterval(walkIntervalRef.current);
      }
    };
  }, [isWalking, walkSpeed, walkPath, userPosition]);

  const handleStartWalk = () => {
    setCurrentPathIndex(0);
    setUserPosition(walkPath[0]);
    setIsWalking(true);
  };

  const handleReset = () => {
    setIsWalking(false);
    setCurrentPathIndex(0);
    setUserPosition(walkPath[0]);
  };

  const userBeacons = nearbyBeacons.filter((b) => b.type === 'user');
  const venueBeacons = nearbyBeacons.filter((b) => b.type === 'venue');
  const eventBeacons = nearbyBeacons.filter((b) => b.type === 'event');

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      {/* Left Panel: Controls */}
      <div
        style={{
          width: '320px',
          background: '#0a0a0a',
          color: '#fff',
          padding: '20px',
          overflowY: 'auto',
          borderRight: '1px solid #333',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#00ffff' }}>
          🌍 Proximity Globe
        </h2>

        {/* User Position */}
        <div style={{ marginBottom: '20px', padding: '12px', background: '#1a1a1a', borderRadius: '4px' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>Your Position:</div>
          <div style={{ fontSize: '11px', color: '#aaa' }}>
            {walkPath[currentPathIndex]?.name || 'Pike Place Market'}
          </div>
          <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
            {userPosition.lat.toFixed(4)}, {userPosition.lng.toFixed(4)}
          </div>
        </div>

        {/* Discovery Settings */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>Discovery Settings:</div>

          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={discoverySettings.proximityEnabled}
              onChange={(e) =>
                setDiscoverySettings({ ...discoverySettings, proximityEnabled: e.target.checked })
              }
              style={{ marginRight: '8px' }}
            />
            <span>Proximity Detection</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={discoverySettings.intentEnabled}
              onChange={(e) =>
                setDiscoverySettings({ ...discoverySettings, intentEnabled: e.target.checked })
              }
              style={{ marginRight: '8px' }}
            />
            <span>Intent Discovery</span>
          </label>

          <div style={{ marginTop: '15px' }}>
            <div style={{ fontSize: '12px', marginBottom: '8px' }}>Visibility Tier:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[1, 2, 3].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setDiscoverySettings({ ...discoverySettings, tier })}
                  style={{
                    padding: '6px',
                    background: discoverySettings.tier === tier ? '#0088ff' : '#222',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    textAlign: 'left',
                  }}
                >
                  L{tier}:{' '}
                  {tier === 1 ? 'Presence only' : tier === 2 ? 'Tags visible' : 'Blurred preview'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <div style={{ fontSize: '12px', marginBottom: '8px' }}>
              Radius: {discoverySettings.radius}m
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={discoverySettings.radius}
              onChange={(e) =>
                setDiscoverySettings({ ...discoverySettings, radius: parseInt(e.target.value) })
              }
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Nearby Summary */}
        <div style={{ marginBottom: '20px', padding: '12px', background: '#1a1a1a', borderRadius: '4px' }}>
          <div style={{ fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>Nearby:</div>
          <div style={{ fontSize: '11px', marginBottom: '5px' }}>🟢 {userBeacons.length} people</div>
          <div style={{ fontSize: '11px', marginBottom: '5px' }}>📍 {venueBeacons.length} venues</div>
          <div style={{ fontSize: '11px' }}>📅 {eventBeacons.length} events</div>
        </div>

        {/* Walk Simulation */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>Walk Simulation:</div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button
              onClick={handleStartWalk}
              disabled={isWalking}
              style={{
                flex: 1,
                padding: '10px',
                background: isWalking ? '#555' : '#00ff00',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: isWalking ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {isWalking ? 'Walking...' : 'Start Walk'}
            </button>

            <button
              onClick={handleReset}
              style={{
                flex: 1,
                padding: '10px',
                background: '#ff4400',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              Reset
            </button>
          </div>

          <div style={{ fontSize: '12px', marginBottom: '8px' }}>Speed: {walkSpeed}x</div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={walkSpeed}
            onChange={(e) => setWalkSpeed(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Legend */}
        <div style={{ padding: '12px', background: '#1a1a1a', borderRadius: '4px', fontSize: '10px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Legend:</div>
          <div style={{ marginBottom: '5px' }}>🔵 You (blue dot)</div>
          <div style={{ marginBottom: '5px' }}>🟢 People (L1-L3)</div>
          <div style={{ marginBottom: '5px' }}>📍 Venues (cafés, stores)</div>
          <div style={{ marginBottom: '5px' }}>📅 Events (concerts, meetups)</div>
        </div>
      </div>

      {/* Right Panel: 3D Globe View */}
      <div style={{ flex: 1, background: '#000', position: 'relative' }}>
        <Canvas style={{ width: '100%', height: '100%' }}>
          <PerspectiveCamera makeDefault position={[0, 50, 100]} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <ambientLight intensity={0.5} />
          <pointLight position={[50, 50, 50]} intensity={1} />

          {/* User Position */}
          <UserMarker position={userPosition} radius={discoverySettings.radius} />

          {/* Nearby Beacons */}
          {nearbyBeacons.map((beacon) => (
            <BeaconMarker
              key={beacon.beaconId}
              beacon={beacon}
              userPosition={userPosition}
              onSelect={() => setSelectedBeacon(beacon)}
              isSelected={selectedBeacon?.beaconId === beacon.beaconId}
            />
          ))}

          {/* Grid */}
          <gridHelper args={[200, 20, '#333', '#111']} />
        </Canvas>

        {/* Tooltip */}
        {selectedBeacon && (
          <BeaconTooltip
            beacon={selectedBeacon}
            onClose={() => setSelectedBeacon(null)}
          />
        )}

        {/* Info Overlay */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.85)',
            color: '#00ffff',
            padding: '12px 18px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            border: '1px solid #00ffff',
          }}
        >
          Proximity Globe Proof
        </div>
      </div>
    </div>
  );
}

/**
 * User Position Marker (Blue Dot + Radius)
 */
function UserMarker({ position, radius }) {
  // Convert lat/lng to 3D position (simplified)
  const x = (position.lng + 122.342) * 10000;
  const z = (position.lat - 47.609) * 10000;

  return (
    <group>
      {/* Blue dot */}
      <Sphere position={[x, 1, z]} args={[2, 16, 16]}>
        <meshStandardMaterial color="#0088ff" />
      </Sphere>

      {/* Proximity radius (circle) */}
      <mesh position={[x, 0, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius / 10, radius / 10 + 0.5, 32]} />
        <meshBasicMaterial color="#0088ff" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

/**
 * Beacon Marker (Users, Venues, Events)
 */
function BeaconMarker({ beacon, userPosition, onSelect, isSelected }) {
  // Convert lat/lng to 3D position
  const x = (beacon.location.lng + 122.342) * 10000;
  const z = (beacon.location.lat - 47.609) * 10000;

  // Color based on type
  const color =
    beacon.type === 'user'
      ? '#00ff00'
      : beacon.type === 'venue'
      ? '#0088ff'
      : '#ff8800';

  // Opacity based on age (fading)
  const opacity = beacon.opacity !== undefined ? beacon.opacity : 1;

  // Size based on tier
  const size = beacon.visibleTier === 0 ? 0 : beacon.type === 'user' ? 1 : 2;

  if (size === 0) return null; // Invisible

  return (
    <Sphere
      position={[x, 1, z]}
      args={[size, 16, 16]}
      onClick={onSelect}
    >
      <meshStandardMaterial
        color={color}
        transparent
        opacity={isSelected ? 1 : opacity}
        emissive={isSelected ? color : '#000000'}
        emissiveIntensity={isSelected ? 0.5 : 0}
      />
      {isSelected && (
        <Html distanceFactor={10}>
          <div
            style={{
              background: '#000',
              color: '#fff',
              padding: '5px',
              borderRadius: '3px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              border: `1px solid ${color}`,
            }}
          >
            {beacon.type === 'user' && beacon.visibleTier === 1 && 'Someone nearby'}
            {beacon.type === 'user' && beacon.visibleTier >= 2 && beacon.tags.join(', ')}
            {beacon.type === 'venue' && beacon.name}
            {beacon.type === 'event' && beacon.name}
          </div>
        </Html>
      )}
    </Sphere>
  );
}

/**
 * Beacon Tooltip (Detailed Info)
 */
function BeaconTooltip({ beacon, onClose }) {
  const renderContent = () => {
    if (beacon.type === 'user') {
      if (beacon.visibleTier === 1) {
        return (
          <>
            <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
              🟢 Someone nearby
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
              Distance: {Math.round(beacon.distance)}m
            </div>
            <div style={{ fontSize: '10px', color: '#666' }}>
              Anonymous presence (L1)
            </div>
          </>
        );
      } else if (beacon.visibleTier >= 2) {
        return (
          <>
            <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
              🟢 Someone nearby
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
              Distance: {Math.round(beacon.distance)}m
            </div>
            <div style={{ fontSize: '12px', marginBottom: '8px' }}>Interests:</div>
            <div style={{ fontSize: '11px', marginBottom: '12px' }}>
              {beacon.tags.map((tag, i) => (
                <div key={i} style={{ marginBottom: '3px' }}>
                  • {tag}
                </div>
              ))}
            </div>
            <button
              style={{
                padding: '8px 12px',
                background: '#00ff00',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                width: '100%',
              }}
            >
              Wave to connect
            </button>
          </>
        );
      }
    } else if (beacon.type === 'venue') {
      return (
        <>
          <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
            📍 {beacon.name}
          </div>
          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
            Distance: {Math.round(beacon.distance)}m
          </div>
          <div style={{ fontSize: '11px', marginBottom: '8px' }}>
            Category: {beacon.category}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              style={{
                flex: 1,
                padding: '8px',
                background: '#0088ff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
              }}
            >
              View menu
            </button>
            <button
              style={{
                flex: 1,
                padding: '8px',
                background: '#555',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
              }}
            >
              Check in
            </button>
          </div>
        </>
      );
    } else if (beacon.type === 'event') {
      return (
        <>
          <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
            📅 {beacon.name}
          </div>
          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
            Venue: {beacon.metadata.venue}
          </div>
          <div style={{ fontSize: '11px', marginBottom: '12px' }}>
            Starts in {Math.round((beacon.metadata.startTime - Date.now()) / 60000)} minutes
          </div>
          <button
            style={{
              padding: '8px 12px',
              background: '#ff8800',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
              width: '100%',
            }}
          >
            RSVP
          </button>
        </>
      );
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        background: '#000',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #00ffff',
        width: '250px',
        fontFamily: 'monospace',
        fontSize: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'transparent',
          color: '#888',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        ×
      </button>

      {renderContent()}
    </div>
  );
}
