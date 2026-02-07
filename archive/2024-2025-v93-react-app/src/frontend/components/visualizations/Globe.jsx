import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import countries from '../../utils/worldGeoData';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useVoting } from '../../hooks/useVoting';
import ActivityFilterSlider from '../voting/ActivityFilterSlider';
import './Globe.css';

const Globe = ({ height = 500, width = 500 }) => {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activityData, setActivityData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [activityFilter, setActivityFilter] = useState(0); // Default to no filtering
  const { subscribe, unsubscribe } = useWebSocket();
  const { getActivityStats } = useVoting();
  
  useEffect(() => {
    if (containerRef.current && !globeRef.current) {
      initGlobe();
    }

    // Subscribe to global activity updates
    subscribe('global-activity', handleActivityUpdate);
    
    return () => {
      // Clean up ThreeJS resources and WebSocket subscription
      if (globeRef.current) {
        containerRef.current.removeChild(globeRef.current.renderer.domElement);
        globeRef.current.controls.dispose();
        globeRef.current.scene.dispose();
        globeRef.current = null;
      }
      unsubscribe('global-activity', handleActivityUpdate);
    };
  }, []);

  useEffect(() => {
    // Apply activity filtering to the data
    if (activityData.length > 0) {
      const filtered = activityFilter > 0 
        ? activityData.filter(activity => 
            (activity.activityPercentile || 0) >= activityFilter)
        : activityData;
      
      setFilteredData(filtered);
    }
  }, [activityData, activityFilter]);

  useEffect(() => {
    if (globeRef.current && filteredData.length > 0) {
      updateGlobeActivity(filteredData);
    }
  }, [filteredData]);

  const handleActivityUpdate = async (data) => {
    // Enhanced activity data with activity percentiles
    let activities = data.activities || [];
    
    // If we have vote activities with user IDs, fetch their activity levels
    const voteActivities = activities.filter(act => act.type === 'vote' && act.userId);
    
    if (voteActivities.length > 0) {
      try {
        // Get activity stats for these users
        const userIds = voteActivities.map(act => act.userId);
        const activityStats = await getActivityStats(userIds);
        
        // Enhance activities with user activity percentiles
        activities = activities.map(activity => {
          if (activity.type === 'vote' && activity.userId) {
            const userStats = activityStats?.users?.[activity.userId];
            if (userStats) {
              return {
                ...activity,
                activityPercentile: userStats.percentile || 0,
                isActiveUser: userStats.isActive || false
              };
            }
          }
          return activity;
        });
      } catch (error) {
        console.error('Failed to fetch activity stats for globe', error);
      }
    }
    
    setActivityData(activities);
  };

  const handleActivityFilterChange = (percentile) => {
    setActivityFilter(percentile);
  };

  const initGlobe = () => {
    setIsLoading(true);
    
    // Create scene
    const scene = new THREE.Scene();
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      50, // FOV
      width / height, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    camera.position.z = 200;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    
    // Create Earth sphere
    const earthGeometry = new THREE.SphereGeometry(50, 64, 64);
    
    // Load Earth texture
    const textureLoader = new THREE.TextureLoader();
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load('/assets/earth-texture.jpg'),
      bumpMap: textureLoader.load('/assets/earth-bump.jpg'),
      bumpScale: 0.5,
      specularMap: textureLoader.load('/assets/earth-specular.jpg'),
      specular: new THREE.Color('grey')
    });
    
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add country outlines
    const countriesGroup = new THREE.Group();
    scene.add(countriesGroup);
    
    // Draw countries
    countries.features.forEach(feature => {
      const coordinates = feature.geometry.coordinates;
      
      coordinates.forEach(polygon => {
        if (feature.geometry.type === 'Polygon') {
          drawPolygon(polygon, countriesGroup);
        } else if (feature.geometry.type === 'MultiPolygon') {
          polygon.forEach(poly => {
            drawPolygon(poly, countriesGroup);
          });
        }
      });
    });
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.minDistance = 60;
    controls.maxDistance = 300;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    
    // Activity markers group
    const markersGroup = new THREE.Group();
    scene.add(markersGroup);
    
    // Store references
    globeRef.current = {
      scene,
      camera,
      renderer,
      controls,
      earthMesh,
      markersGroup,
      countriesGroup
    };
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    setIsLoading(false);
  };
  
  // Helper to draw country outlines
  const drawPolygon = (polygon, group) => {
    const points = [];
    
    polygon.forEach(coord => {
      const lat = coord[1];
      const lng = coord[0];
      const point = latLngToVector3(lat, lng, 50.5); // Slightly above Earth surface
      points.push(point);
    });
    
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x444444, 
      transparent: true, 
      opacity: 0.3 
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    group.add(line);
  };
  
  // Convert lat/lng to 3D coordinates
  const latLngToVector3 = (lat, lng, radius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
  };
  
  // Update globe with new activity data
  const updateGlobeActivity = (activities) => {
    if (!globeRef.current) return;
    
    const { markersGroup } = globeRef.current;
    
    // Clear existing markers
    while (markersGroup.children.length > 0) {
      markersGroup.remove(markersGroup.children[0]);
    }
    
    // Add new activity markers
    activities.forEach(activity => {
      const { lat, lng, type, intensity, activityPercentile, isActiveUser } = activity;
      
      // Skip if missing coordinates
      if (!lat || !lng) return;
      
      // Create marker
      const markerPosition = latLngToVector3(lat, lng, 51); // Just above Earth surface
      
      // Different marker types/colors based on activity type
      let markerColor = 0x3388ff; // Default blue
      
      if (type === 'vote') {
        // Apply different colors based on activity level for votes
        if (activityPercentile !== undefined) {
          if (activityPercentile >= 80) {
            markerColor = 0x00ff00; // Bright green for highly active
          } else if (activityPercentile >= 50) {
            markerColor = 0x22cc88; // Regular green for active
          } else if (activityPercentile >= 30) {
            markerColor = 0x88cc22; // Yellow-green for moderately active
          } else {
            markerColor = 0xcccc22; // Yellow for less active
          }
        } else {
          markerColor = 0x22cc88; // Default green for votes without activity data
        }
      } else if (type === 'verification') {
        markerColor = 0xffaa00; // Orange for verifications
      } else if (type === 'onboarding') {
        markerColor = 0xff3366; // Pink for new users
      }
      
      // Scale marker size based on intensity
      const markerSize = 0.5 + (intensity || 1) * 1.5;
      
      // Create marker material with glow effect
      const markerMaterial = new THREE.SpriteMaterial({
        map: createMarkerTexture(markerColor),
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      
      const marker = new THREE.Sprite(markerMaterial);
      marker.scale.set(markerSize, markerSize, 1);
      marker.position.copy(markerPosition);
      
      // Add user activity data to marker for tooltips/interaction
      marker.userData = {
        type,
        activityPercentile: activityPercentile || 0,
        isActiveUser: isActiveUser || false
      };
      
      // Add marker to group
      markersGroup.add(marker);
      
      // Add pulse effect
      addPulseEffect(markerPosition, markerColor, markerSize);
    });
  };
  
  // Create a glowing marker texture
  const createMarkerTexture = (color) => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    // Create gradient
    const gradient = context.createRadialGradient(
      32, 32, 0,
      32, 32, 32
    );
    
    // Convert hex color to RGB
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;
    
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.5)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    
    // Draw circle
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(32, 32, 32, 0, Math.PI * 2);
    context.fill();
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };
  
  // Add pulsing effect to markers
  const addPulseEffect = (position, color, size) => {
    if (!globeRef.current) return;
    
    const { markersGroup } = globeRef.current;
    
    // Create pulse ring
    const pulseGeometry = new THREE.RingGeometry(0, 2, 32);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide
    });
    
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.position.copy(position);
    
    // Orient ring to face outward from globe center
    pulse.lookAt(new THREE.Vector3(0, 0, 0));
    
    // Add to scene
    markersGroup.add(pulse);
    
    // Animate pulse
    let scale = 1;
    let opacity = 1;
    
    const animatePulse = () => {
      scale += 0.025;
      opacity -= 0.02;
      
      if (opacity <= 0) {
        markersGroup.remove(pulse);
        pulse.geometry.dispose();
        pulse.material.dispose();
        return;
      }
      
      pulse.scale.set(scale * size, scale * size, 1);
      pulse.material.opacity = opacity;
      
      requestAnimationFrame(animatePulse);
    };
    
    animatePulse();
  };

  return (
    <div className="globe-visualization-container">
      <div className="globe-filters">
        <ActivityFilterSlider 
          onChange={handleActivityFilterChange}
          initialValue={activityFilter}
        />
        
        {activityFilter > 0 && (
          <div className="activity-filter-info">
            <p>Showing activities from users in the {activityFilter}th percentile and above</p>
            <p><small>Total visible activities: {filteredData.length} of {activityData.length}</small></p>
          </div>
        )}
      </div>
      
      <div 
        ref={containerRef} 
        className="globe-container"
        style={{ height, width }}
      >
        {isLoading && (
          <div className="globe-loading">
            <div className="spinner"></div>
            <p>Loading globe visualization...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Globe;
