import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  Html,
  Text
} from '@react-three/drei';
import { 
  PlaneGeometry, 
  MeshBasicMaterial, 
  Vector3
} from 'three';

const Panel3DObject = ({ panel, index, totalPanels, onPanelClick }) => {
  const meshRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate position in a circle around the globe
  const position = useMemo(() => {
    const radius = 6; // Distance from globe center
    const angle = (index / totalPanels) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0; // Keep panels at same height for now
    
    return [x, y, z];
  }, [index, totalPanels]);

  // Panel content based on type
  const panelContent = useMemo(() => {
    const baseStyle = {
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      minWidth: '200px',
      maxWidth: '300px',
      transform: isExpanded ? 'scale(1.2)' : 'scale(1)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    };

    switch (panel.type) {
      case 'search':
        return (
          <div style={baseStyle}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🔍 Search</div>
            <input 
              type="text" 
              placeholder="Search channels, topics..."
              style={{
                width: '100%',
                padding: '4px 8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                color: 'white'
              }}
            />
          </div>
        );
      
      case 'development':
        return (
          <div style={baseStyle}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚙️ Developer Tools</div>
            <div style={{ fontSize: '10px', color: '#ccc' }}>
              System logs and controls
            </div>
          </div>
        );
      
      case 'communication':
        return (
          <div style={baseStyle}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>💬 Channel Chat</div>
            <div style={{ fontSize: '10px', color: '#ccc' }}>
              Real-time messaging
            </div>
          </div>
        );
      
      case 'system':
        return (
          <div style={baseStyle}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🏛️ Voting & Blockchain</div>
            <div style={{ fontSize: '10px', color: '#ccc' }}>
              Core voting mechanics
            </div>
          </div>
        );
      
      case 'controls':
        return (
          <div style={baseStyle}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🎛️ Layer Controls</div>
            <div style={{ fontSize: '10px', color: '#ccc' }}>
              Globe visualization
            </div>
          </div>
        );
      
      case 'proximity':
        return (
          <div style={baseStyle}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>📍 Proximity</div>
            <div style={{ fontSize: '10px', color: '#ccc' }}>
              Nearby users & broadcasts
            </div>
          </div>
        );
      
      case 'map':
        return (
          <div style={baseStyle}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🗺️ 2D Map</div>
            <div style={{ fontSize: '10px', color: '#ccc' }}>
              Street-level view
            </div>
          </div>
        );
      
      default:
        return (
          <div style={baseStyle}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{panel.title}</div>
            <div style={{ fontSize: '10px', color: '#ccc' }}>
              {panel.description}
            </div>
          </div>
        );
    }
  }, [panel, isExpanded]);

  // Animation loop
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + index) * 0.1;
      
      // Always face the camera
      meshRef.current.lookAt(state.camera.position);
    }
  });

  return (
    <group position={position}>
      {/* 3D Panel Object */}
      <mesh
        ref={meshRef}
        onClick={() => {
          setIsExpanded(!isExpanded);
          onPanelClick();
        }}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <planeGeometry args={[2, 1.5]} />
        <meshBasicMaterial 
          color={isHovered ? '#409cff' : '#666'} 
          transparent 
          opacity={isHovered ? 0.3 : 0.1}
        />
      </mesh>
      
      {/* 2D HTML Content */}
      <Html
        position={[0, 0, 0.01]}
        center
        style={{
          pointerEvents: 'none'
        }}
      >
        <div
          onClick={() => {
            setIsExpanded(!isExpanded);
            onPanelClick();
          }}
          style={{
            pointerEvents: 'auto',
            cursor: 'pointer'
          }}
        >
          {panelContent}
        </div>
      </Html>
      
      {/* Panel Icon/Indicator */}
      <mesh position={[0, -1, 0]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshBasicMaterial 
          color={isHovered ? '#409cff' : '#999'} 
          transparent 
          opacity={0.8}
        />
      </mesh>
    </group>
  );
};

export default Panel3DObject; 