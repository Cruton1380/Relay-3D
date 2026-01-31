/**
 * State Drift Globe HUD
 * Visual interface for commanding SCV agents and monitoring
 * billions of devices for state drift across the globe
 */

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default function StateDriftGlobeHUD() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const globeRef = useRef(null);
  const controlsRef = useRef(null);
  const deviceMarkersRef = useRef([]);
  
  // HUD State
  const [orchestratorStatus, setOrchestratorStatus] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [filterMode, setFilterMode] = useState('all');
  const [threatView, setThreatView] = useState(true);
  const [driftView, setDriftView] = useState(true);
  const [commandMode, setCommandMode] = useState(null);
  const [scenarioLibrary, setScenarioLibrary] = useState([]);
  const [warGameLibrary, setWarGameLibrary] = useState([]);
  
  // Real-time stats
  const [stats, setStats] = useState({
    totalDevices: 0,
    devicesUnderControl: 0,
    driftDetected: 0,
    exploitsBlocked: 0,
    activeAgents: 0,
    operationsQueued: 0
  });

  // Initialize 3D Globe
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000510);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    camera.position.set(0, 0, 300);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 150;
    controls.maxDistance = 800;
    controlsRef.current = controls;

    // Create Earth Globe
    const globe = createGlobe();
    scene.add(globe);
    globeRef.current = globe;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 200, 200);
    scene.add(directionalLight);

    // Add stars
    addStarField(scene);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      
      // Rotate globe slowly
      if (globeRef.current) {
        globeRef.current.rotation.y += 0.001;
      }
      
      // Update device markers
      updateDeviceMarkers();
      
      renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Fetch orchestrator status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/state-drift/status');
        const data = await response.json();
        setOrchestratorStatus(data);
        setStats({
          totalDevices: data.driftEngine?.totalDevices || 0,
          devicesUnderControl: data.stats?.devicesUnderControl || 0,
          driftDetected: data.driftEngine?.driftDetected || 0,
          exploitsBlocked: data.driftEngine?.exploitsBlocked || 0,
          activeAgents: data.agents?.active || 0,
          operationsQueued: data.operations?.queued || 0
        });
      } catch (error) {
        console.error('Failed to fetch orchestrator status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Fetch scenario and war game libraries
  useEffect(() => {
    const fetchLibraries = async () => {
      try {
        const [scenariosRes, warGamesRes] = await Promise.all([
          fetch('/api/state-drift/scenarios'),
          fetch('/api/state-drift/war-games')
        ]);
        
        const scenarios = await scenariosRes.json();
        const warGames = await warGamesRes.json();
        
        setScenarioLibrary(scenarios);
        setWarGameLibrary(warGames);
      } catch (error) {
        console.error('Failed to fetch libraries:', error);
      }
    };

    fetchLibraries();
  }, []);

  // Create globe mesh
  function createGlobe() {
    const geometry = new THREE.SphereGeometry(100, 64, 64);
    
    // Create earth texture (simple gradient for now)
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Ocean blue to land green gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a4d80');
    gradient.addColorStop(0.5, '#2a6f97');
    gradient.addColorStop(1, '#1a4d80');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      transparent: true,
      opacity: 0.95,
      emissive: new THREE.Color(0x112244),
      emissiveIntensity: 0.3
    });
    
    const globe = new THREE.Mesh(geometry, material);
    
    // Add atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(102, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globe.add(atmosphere);
    
    return globe;
  }

  // Add star field
  function addStarField(scene) {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 10000;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 2000;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      transparent: true,
      opacity: 0.8
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
  }

  // Update device markers on globe
  function updateDeviceMarkers() {
    if (!orchestratorStatus || !globeRef.current) return;
    
    // Remove old markers
    deviceMarkersRef.current.forEach(marker => {
      globeRef.current.remove(marker);
    });
    deviceMarkersRef.current = [];
    
    // Add new markers based on device data
    // (In production, would fetch actual device locations)
  }

  // Command: Execute Mass Suppression
  async function executeCommand(command, params = {}) {
    try {
      const response = await fetch(`/api/state-drift/command/${command}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Command executed: ${command}`, result);
      } else {
        console.error(`❌ Command failed: ${command}`, result);
      }
      
      return result;
    } catch (error) {
      console.error(`Command execution error: ${command}`, error);
      return { success: false, error: error.message };
    }
  }

  // Command handlers
  const handleMassSuppression = async () => {
    const filter = {
      threatLevel: 'critical',
      driftDetected: true
    };
    
    const result = await executeCommand('mass-suppression', { filter });
    alert(`Mass Suppression: ${result.deviceCount} devices targeted`);
  };

  const handleMassTakeover = async () => {
    const filter = selectedDevices.length > 0 
      ? { deviceIds: selectedDevices }
      : { threatLevel: 'high' };
    
    const result = await executeCommand('mass-takeover', { filter });
    alert(`Mass Takeover: ${result.deviceCount} devices under control`);
  };

  const handleExecuteScenario = async (scenario) => {
    const filter = { all: true };
    const result = await executeCommand('execute-scenario', { scenario, filter });
    alert(`Scenario "${scenario.name}": ${result.deviceCount} devices`);
  };

  const handleExecuteWarGame = async (warGame) => {
    const filter = { class: 'test' };
    const result = await executeCommand('execute-war-game', { warGame, filter });
    alert(`War Game "${warGame.name}": ${result.deviceCount} devices`);
  };

  // Filter devices by category
  const applyFilter = (mode) => {
    setFilterMode(mode);
    // Update device markers based on filter
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      {/* 3D Globe Canvas */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      
      {/* HUD Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        fontFamily: 'monospace',
        color: '#0ff'
      }}>
        {/* Top Status Bar */}
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'auto'
        }}>
          <div style={{
            background: 'rgba(0, 20, 40, 0.85)',
            border: '2px solid #0ff',
            borderRadius: 8,
            padding: '15px 20px',
            minWidth: 300
          }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: 18, color: '#0ff' }}>
              🛡️ RELAY STATE DRIFT HUD
            </h2>
            <div style={{ fontSize: 14, lineHeight: 1.8 }}>
              <div>Total Devices: <span style={{ color: '#fff' }}>{stats.totalDevices.toLocaleString()}</span></div>
              <div>Under Control: <span style={{ color: '#0f0' }}>{stats.devicesUnderControl.toLocaleString()}</span></div>
              <div>Drift Detected: <span style={{ color: '#ff0' }}>{stats.driftDetected.toLocaleString()}</span></div>
              <div>Exploits Blocked: <span style={{ color: '#f00' }}>{stats.exploitsBlocked.toLocaleString()}</span></div>
            </div>
          </div>

          <div style={{
            background: 'rgba(0, 20, 40, 0.85)',
            border: '2px solid #0ff',
            borderRadius: 8,
            padding: '15px 20px',
            minWidth: 250
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: 16, color: '#0ff' }}>
              🤖 SCV AGENTS
            </h3>
            <div style={{ fontSize: 14, lineHeight: 1.8 }}>
              <div>Active: <span style={{ color: '#0f0' }}>{stats.activeAgents}</span></div>
              <div>Idle: <span style={{ color: '#888' }}>{orchestratorStatus?.agents?.idle || 0}</span></div>
              <div>Operations Queued: <span style={{ color: '#ff0' }}>{stats.operationsQueued}</span></div>
            </div>
          </div>
        </div>

        {/* Command Panel - Left Side */}
        <div style={{
          position: 'absolute',
          top: 200,
          left: 20,
          width: 320,
          maxHeight: 'calc(100vh - 240px)',
          overflowY: 'auto',
          background: 'rgba(0, 20, 40, 0.85)',
          border: '2px solid #0ff',
          borderRadius: 8,
          padding: 20,
          pointerEvents: 'auto'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: 18, color: '#0ff' }}>
            ⚡ COMMAND OPERATIONS
          </h3>
          
          {/* Mass Operations */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, color: '#fff', marginBottom: 10 }}>Mass Operations</h4>
            <button
              onClick={handleMassSuppression}
              style={{
                width: '100%',
                padding: 12,
                marginBottom: 8,
                background: '#f00',
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              🚨 MASS SUPPRESSION
            </button>
            
            <button
              onClick={handleMassTakeover}
              style={{
                width: '100%',
                padding: 12,
                marginBottom: 8,
                background: '#ff8800',
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              🎯 MASS TAKEOVER
            </button>
          </div>

          {/* Scenario Operations */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, color: '#fff', marginBottom: 10 }}>State Manipulation Scenarios</h4>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {scenarioLibrary.map((scenario, index) => (
                <button
                  key={index}
                  onClick={() => handleExecuteScenario(scenario)}
                  style={{
                    width: '100%',
                    padding: 10,
                    marginBottom: 6,
                    background: 'rgba(0, 150, 255, 0.3)',
                    border: '1px solid #0ff',
                    borderRadius: 4,
                    color: '#0ff',
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  📋 {scenario.name}
                </button>
              ))}
            </div>
          </div>

          {/* War Games */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, color: '#fff', marginBottom: 10 }}>War Games</h4>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {warGameLibrary.map((warGame, index) => (
                <button
                  key={index}
                  onClick={() => handleExecuteWarGame(warGame)}
                  style={{
                    width: '100%',
                    padding: 10,
                    marginBottom: 6,
                    background: 'rgba(150, 0, 255, 0.3)',
                    border: '1px solid #f0f',
                    borderRadius: 4,
                    color: '#f0f',
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  ⚔️ {warGame.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Panel - Right Side */}
        <div style={{
          position: 'absolute',
          top: 200,
          right: 20,
          width: 280,
          background: 'rgba(0, 20, 40, 0.85)',
          border: '2px solid #0ff',
          borderRadius: 8,
          padding: 20,
          pointerEvents: 'auto'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: 18, color: '#0ff' }}>
            🔍 VIEW FILTERS
          </h3>
          
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={threatView}
                onChange={(e) => setThreatView(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Show Threat Markers
            </label>
            
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={driftView}
                onChange={(e) => setDriftView(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Show Drift Indicators
            </label>
          </div>

          <div style={{ marginBottom: 15 }}>
            <h4 style={{ fontSize: 14, color: '#fff', marginBottom: 8 }}>Device Filter</h4>
            {['all', 'critical', 'high', 'medium', 'low', 'clean'].map(mode => (
              <button
                key={mode}
                onClick={() => applyFilter(mode)}
                style={{
                  width: '100%',
                  padding: 8,
                  marginBottom: 4,
                  background: filterMode === mode ? '#0ff' : 'rgba(0, 255, 255, 0.2)',
                  border: '1px solid #0ff',
                  borderRadius: 4,
                  color: filterMode === mode ? '#000' : '#0ff',
                  fontSize: 12,
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom KPI Bar */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          display: 'flex',
          gap: 15,
          pointerEvents: 'auto'
        }}>
          <KPICard
            label="Drift Detection Rate"
            value={orchestratorStatus?.driftEngine?.kpis?.drift_detection_rate?.value?.toFixed(2) || '0'}
            unit="drifts/sec"
            status="normal"
          />
          <KPICard
            label="Exploit Suppression"
            value={(orchestratorStatus?.driftEngine?.kpis?.exploit_suppression_ratio?.value * 100)?.toFixed(1) || '0'}
            unit="%"
            status="good"
          />
          <KPICard
            label="Scan Throughput"
            value={(orchestratorStatus?.driftEngine?.kpis?.scan_throughput?.value / 1000)?.toFixed(0) || '0'}
            unit="k dev/sec"
            status="good"
          />
          <KPICard
            label="Silent Takeover Rate"
            value={(orchestratorStatus?.driftEngine?.kpis?.silent_takeover_rate?.value * 100)?.toFixed(1) || '0'}
            unit="%"
            status="good"
          />
          <KPICard
            label="Classification Coverage"
            value={(orchestratorStatus?.driftEngine?.kpis?.classification_coverage?.value * 100)?.toFixed(1) || '0'}
            unit="%"
            status="good"
          />
        </div>
      </div>
    </div>
  );
}

// KPI Card Component
function KPICard({ label, value, unit, status }) {
  const statusColors = {
    critical: '#f00',
    warning: '#ff0',
    normal: '#0ff',
    good: '#0f0'
  };
  
  return (
    <div style={{
      flex: 1,
      background: 'rgba(0, 20, 40, 0.85)',
      border: `2px solid ${statusColors[status]}`,
      borderRadius: 8,
      padding: '12px 15px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 'bold', color: statusColors[status] }}>
        {value} <span style={{ fontSize: 14 }}>{unit}</span>
      </div>
    </div>
  );
}
