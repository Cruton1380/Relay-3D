/**
 * State Drift API Routes
 * RESTful API for state drift management, SCV agents, and mass operations
 */

import express from 'express';
import SCVOrchestrator from '../state-drift/scvOrchestrator.mjs';
import StateDriftEngine from '../state-drift/stateDriftEngine.mjs';

const router = express.Router();

// Initialize orchestrator (singleton)
let orchestrator = null;

function getOrchestrator() {
  if (!orchestrator) {
    const driftEngine = new StateDriftEngine({
      scanInterval: 100,
      batchSize: 10000
    });
    
    orchestrator = new SCVOrchestrator({
      driftEngine,
      initialAgentCount: 10,
      maxAgentsPerDevice: 1000000,
      autoScaling: true
    });
    
    // Start orchestrator
    orchestrator.start();
    
    // Simulate device registration for demo
    simulateDeviceRegistration(driftEngine);
  }
  
  return orchestrator;
}

/**
 * GET /api/state-drift/status
 * Get orchestrator and drift engine status
 */
router.get('/status', (req, res) => {
  try {
    const orch = getOrchestrator();
    const status = orch.getStatus();
    
    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/state-drift/agents
 * Get all SCV agents status
 */
router.get('/agents', (req, res) => {
  try {
    const orch = getOrchestrator();
    const agents = orch.getAllAgentsStatus();
    
    res.json({
      success: true,
      agents,
      count: agents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/state-drift/devices
 * Get devices with optional filtering
 */
router.get('/devices', (req, res) => {
  try {
    const orch = getOrchestrator();
    const { filter } = req.query;
    
    let devices;
    if (filter) {
      const filterObj = JSON.parse(filter);
      devices = orch.getDevicesByFilter(filterObj);
    } else {
      devices = Array.from(orch.driftEngine.deviceRegistry.values());
    }
    
    res.json({
      success: true,
      devices,
      count: devices.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/state-drift/kpis
 * Get current KPI values
 */
router.get('/kpis', (req, res) => {
  try {
    const orch = getOrchestrator();
    const kpis = orch.driftEngine.getKPIs();
    
    res.json({
      success: true,
      kpis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/state-drift/scenarios
 * Get available state manipulation scenarios
 */
router.get('/scenarios', (req, res) => {
  try {
    const scenarios = getScenarioLibrary();
    
    res.json(scenarios);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/state-drift/war-games
 * Get available war game simulations
 */
router.get('/war-games', (req, res) => {
  try {
    const warGames = getWarGameLibrary();
    
    res.json(warGames);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/state-drift/command/mass-suppression
 * Execute mass suppression operation
 */
router.post('/command/mass-suppression', async (req, res) => {
  try {
    const orch = getOrchestrator();
    const { filter } = req.body;
    
    const result = await orch.commandMassSuppression(filter || {});
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/state-drift/command/mass-takeover
 * Execute mass takeover operation
 */
router.post('/command/mass-takeover', async (req, res) => {
  try {
    const orch = getOrchestrator();
    const { filter } = req.body;
    
    const result = await orch.commandMassTakeover(filter || {});
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/state-drift/command/execute-scenario
 * Execute state manipulation scenario
 */
router.post('/command/execute-scenario', async (req, res) => {
  try {
    const orch = getOrchestrator();
    const { scenario, filter } = req.body;
    
    const result = await orch.commandExecuteScenario(scenario, filter || {});
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/state-drift/command/execute-war-game
 * Execute war game simulation
 */
router.post('/command/execute-war-game', async (req, res) => {
  try {
    const orch = getOrchestrator();
    const { warGame, filter } = req.body;
    
    const result = await orch.commandExecuteWarGame(warGame, filter || {});
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/state-drift/devices/register
 * Register new device
 */
router.post('/devices/register', (req, res) => {
  try {
    const orch = getOrchestrator();
    const { deviceId, metadata } = req.body;
    
    const device = orch.driftEngine.registerDevice(deviceId, metadata);
    
    res.json({
      success: true,
      device
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/state-drift/operations
 * Get operation history
 */
router.get('/operations', (req, res) => {
  try {
    const orch = getOrchestrator();
    const { limit = 100 } = req.query;
    
    const operations = orch.getOperationHistory(parseInt(limit));
    
    res.json({
      success: true,
      operations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Helper: Simulate device registration for demo
 */
function simulateDeviceRegistration(driftEngine) {
  // Register sample devices across different categories
  const deviceTypes = [
    { os: 'Windows', role: 'workstation', count: 100000 },
    { os: 'macOS', role: 'workstation', count: 50000 },
    { os: 'Linux', role: 'server', count: 25000 },
    { os: 'iOS', role: 'mobile', count: 150000 },
    { os: 'Android', role: 'mobile', count: 200000 }
  ];
  
  deviceTypes.forEach(({ os, role, count }) => {
    for (let i = 0; i < count; i++) {
      const deviceId = `${os.toLowerCase()}_${role}_${i}`;
      driftEngine.registerDevice(deviceId, {
        os,
        role,
        form_factor: role === 'server' ? 'rack' : (role === 'mobile' ? 'phone' : 'desktop'),
        location: {
          region: ['NA', 'EU', 'ASIA', 'SA', 'AF'][Math.floor(Math.random() * 5)],
          country: 'US'
        },
        network: {
          type: 'enterprise'
        },
        permissions: ['read', 'write'],
        adRoles: ['user'],
        expectedRoles: ['user'],
        configuration: {},
        resources: { cpu: 50, memory: 50 },
        expectedDesktopControl: {},
        authorizedVideoProcesses: []
      });
    }
  });
  
  console.log(`📊 Registered ${deviceTypes.reduce((sum, t) => sum + t.count, 0).toLocaleString()} demo devices`);
}

/**
 * Helper: Get scenario library
 */
function getScenarioLibrary() {
  return [
    {
      id: 'desktop_control_sweep',
      name: 'Desktop Control Sweep',
      description: 'Take control of desktop sessions across selected devices',
      steps: [
        {
          action: 'control_desktop',
          params: { silent: true, mode: 'observe' }
        }
      ]
    },
    {
      id: 'video_launch_campaign',
      name: 'Video Launch Campaign',
      description: 'Launch specific videos on target devices',
      steps: [
        {
          action: 'launch_video',
          params: { videoId: 'training_video_001', autoplay: true }
        }
      ]
    },
    {
      id: 'ad_synchronization',
      name: 'AD Synchronization',
      description: 'Synchronize Active Directory roles across devices',
      steps: [
        {
          action: 'manipulate_ad',
          params: { operation: 'sync_roles' }
        }
      ]
    },
    {
      id: 'network_segmentation_test',
      name: 'Network Segmentation Test',
      description: 'Test network segmentation controls',
      steps: [
        {
          action: 'control_network',
          params: { operation: 'test_segmentation' }
        }
      ]
    },
    {
      id: 'full_state_restoration',
      name: 'Full State Restoration',
      description: 'Restore all devices to baseline state',
      steps: [
        {
          action: 'control_desktop',
          params: { operation: 'restore_baseline' }
        },
        {
          action: 'manipulate_ad',
          params: { operation: 'restore_roles' }
        }
      ]
    }
  ];
}

/**
 * Helper: Get war game library
 */
function getWarGameLibrary() {
  return [
    {
      id: 'privilege_escalation_test',
      name: 'Privilege Escalation Test',
      description: 'Simulate privilege escalation attacks',
      phases: [
        {
          name: 'Initial Compromise',
          attacks: [
            { type: 'privilege_escalation', severity: 'high' }
          ]
        },
        {
          name: 'Defense Validation',
          attacks: [
            { type: 'privilege_escalation', severity: 'critical' }
          ]
        }
      ]
    },
    {
      id: 'lateral_movement_simulation',
      name: 'Lateral Movement Simulation',
      description: 'Simulate lateral movement across network',
      phases: [
        {
          name: 'Initial Foothold',
          attacks: [
            { type: 'lateral_movement', severity: 'medium' }
          ]
        },
        {
          name: 'Network Propagation',
          attacks: [
            { type: 'lateral_movement', severity: 'high' }
          ]
        }
      ]
    },
    {
      id: 'credential_theft_drill',
      name: 'Credential Theft Drill',
      description: 'Test credential protection mechanisms',
      phases: [
        {
          name: 'Credential Access',
          attacks: [
            { type: 'credential_theft', severity: 'critical' }
          ]
        }
      ]
    },
    {
      id: 'code_injection_test',
      name: 'Code Injection Test',
      description: 'Test process injection defenses',
      phases: [
        {
          name: 'Injection Attempt',
          attacks: [
            { type: 'code_injection', severity: 'high' }
          ]
        },
        {
          name: 'Defense Response',
          attacks: [
            { type: 'code_injection', severity: 'critical' }
          ]
        }
      ]
    },
    {
      id: 'full_kill_chain_simulation',
      name: 'Full Kill Chain Simulation',
      description: 'Simulate complete attack kill chain',
      phases: [
        {
          name: 'Initial Access',
          attacks: [
            { type: 'privilege_escalation', severity: 'medium' }
          ]
        },
        {
          name: 'Persistence',
          attacks: [
            { type: 'code_injection', severity: 'high' }
          ]
        },
        {
          name: 'Credential Access',
          attacks: [
            { type: 'credential_theft', severity: 'critical' }
          ]
        },
        {
          name: 'Lateral Movement',
          attacks: [
            { type: 'lateral_movement', severity: 'high' }
          ]
        }
      ]
    }
  ];
}

export default router;
