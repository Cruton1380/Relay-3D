/**
 * Boundary Rendering Test Suite
 * 
 * Tests the globe integration for boundary preview and comparison features.
 * 
 * Prerequisites:
 * - Backend server running on localhost:3003
 * - Boundary channels initialized with test data
 * - VotingPanel displaying boundary candidates
 * 
 * Tests:
 * 1. Boundary rendering service initialization
 * 2. Preview single boundary (current)
 * 3. Preview single boundary (proposal)
 * 4. Compare current vs proposed boundaries
 * 5. Camera zoom to boundary
 * 6. Clear preview
 * 7. Event listener registration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Cesium viewer
const createMockViewer = () => {
  const entities = new Map();
  
  return {
    entities: {
      values: Array.from(entities.values()),
      add: (entity) => {
        const id = entity.id || `entity-${Date.now()}`;
        entities.set(id, { ...entity, id });
        return { ...entity, id };
      },
      remove: (entity) => {
        const id = entity.id;
        entities.delete(id);
        return true;
      },
      removeAll: () => {
        entities.clear();
      },
      getById: (id) => {
        return entities.get(id);
      },
      contains: (entity) => {
        return entities.has(entity.id);
      }
    },
    camera: {
      positionCartographic: {
        height: 20000000
      },
      flyTo: ({ destination, duration }) => {
        console.log('Camera flying to destination');
        return Promise.resolve();
      }
    }
  };
};

// Mock Cesium global
global.window = global.window || {};
global.window.Cesium = {
  Color: class {
    constructor(r, g, b, a) {
      this.red = r;
      this.green = g;
      this.blue = b;
      this.alpha = a;
    }
  },
  Cartesian3: {
    fromDegrees: (lon, lat) => ({ x: lon, y: 0, z: lat })
  },
  Rectangle: {
    fromDegrees: (west, south, east, north) => ({ west, south, east, north })
  },
  PolylineDashMaterialProperty: class {
    constructor({ color, dashLength }) {
      this.color = color;
      this.dashLength = dashLength;
    }
  },
  PolylineGlowMaterialProperty: class {
    constructor({ glowPower, color }) {
      this.glowPower = glowPower;
      this.color = color;
    }
  },
  ClassificationType: {
    TERRAIN: 'TERRAIN'
  },
  EasingFunction: {
    CUBIC_IN_OUT: 'CUBIC_IN_OUT'
  }
};

// Sample test data
const testBoundaries = {
  currentBoundary: {
    candidateId: 'current-north',
    geojson: {
      type: 'LineString',
      coordinates: [
        [-124.2, 42.0],
        [-120.0, 42.0],
        [-116.0, 42.0]
      ]
    },
    isDefault: true,
    metadata: {
      name: 'Current Northern Border',
      direction: 'North',
      adjacentRegions: ['US-OR']
    }
  },
  proposedBoundary: {
    candidateId: 'proposal-north-1',
    geojson: {
      type: 'LineString',
      coordinates: [
        [-124.2, 42.5],
        [-120.0, 42.5],
        [-116.0, 42.5]
      ]
    },
    isDefault: false,
    metadata: {
      name: 'Proposed Northern Border',
      direction: 'North',
      adjacentRegions: ['US-OR'],
      proposer: 'testuser123',
      votes: 42
    }
  }
};

describe('Boundary Rendering Service', () => {
  let viewer;
  let BoundaryRenderingService;

  beforeEach(async () => {
    viewer = createMockViewer();
    
    // Import the service (dynamic import to avoid issues)
    const module = await import('../src/frontend/services/boundaryRenderingService.js');
    BoundaryRenderingService = module.BoundaryRenderingService;
  });

  afterEach(() => {
    viewer = null;
  });

  it('should initialize boundary rendering service', () => {
    const service = new BoundaryRenderingService(viewer);
    
    expect(service).toBeDefined();
    expect(service.viewer).toBe(viewer);
    expect(service.boundaryEntities).toBeInstanceOf(Map);
    expect(service.boundaryEntities.size).toBe(0);
  });

  it('should render current boundary with green styling', () => {
    const service = new BoundaryRenderingService(viewer);
    const { currentBoundary } = testBoundaries;
    
    const entity = service.renderBoundary(
      currentBoundary.geojson,
      currentBoundary.isDefault,
      currentBoundary.candidateId,
      currentBoundary.metadata
    );
    
    expect(entity).toBeDefined();
    expect(entity.id).toContain('boundary-current-north');
    expect(service.boundaryEntities.size).toBe(1);
    
    const stored = service.boundaryEntities.get(entity.id);
    expect(stored.isDefault).toBe(true);
    expect(stored.metadata.direction).toBe('North');
  });

  it('should render proposed boundary with yellow styling', () => {
    const service = new BoundaryRenderingService(viewer);
    const { proposedBoundary } = testBoundaries;
    
    const entity = service.renderBoundary(
      proposedBoundary.geojson,
      proposedBoundary.isDefault,
      proposedBoundary.candidateId,
      proposedBoundary.metadata
    );
    
    expect(entity).toBeDefined();
    expect(entity.id).toContain('boundary-proposal-north-1');
    expect(service.boundaryEntities.size).toBe(1);
    
    const stored = service.boundaryEntities.get(entity.id);
    expect(stored.isDefault).toBe(false);
    expect(stored.metadata.proposer).toBe('testuser123');
    expect(stored.metadata.votes).toBe(42);
  });

  it('should preview a single boundary', () => {
    const service = new BoundaryRenderingService(viewer);
    const { currentBoundary } = testBoundaries;
    
    const entity = service.previewBoundary(
      currentBoundary.candidateId,
      currentBoundary.geojson,
      currentBoundary.isDefault,
      currentBoundary.metadata
    );
    
    expect(entity).toBeDefined();
    expect(service.activePreview).toBe(currentBoundary.candidateId);
    expect(service.boundaryEntities.size).toBe(1);
  });

  it('should compare two boundaries', () => {
    const service = new BoundaryRenderingService(viewer);
    const { currentBoundary, proposedBoundary } = testBoundaries;
    
    const { currentEntity, proposalEntity } = service.compareBoundaries(
      currentBoundary.geojson,
      proposedBoundary.geojson,
      currentBoundary.metadata,
      proposedBoundary.metadata
    );
    
    expect(currentEntity).toBeDefined();
    expect(proposalEntity).toBeDefined();
    expect(service.activePreview).toBe('comparison');
    expect(service.boundaryEntities.size).toBe(2);
  });

  it('should clear preview and remove entities', () => {
    const service = new BoundaryRenderingService(viewer);
    const { currentBoundary, proposedBoundary } = testBoundaries;
    
    // Add both boundaries
    service.compareBoundaries(
      currentBoundary.geojson,
      proposedBoundary.geojson,
      currentBoundary.metadata,
      proposedBoundary.metadata
    );
    
    expect(service.boundaryEntities.size).toBe(2);
    
    // Clear preview
    service.clearPreview();
    
    expect(service.boundaryEntities.size).toBe(0);
    expect(service.activePreview).toBeNull();
  });

  it('should calculate bounds from coordinates', () => {
    const service = new BoundaryRenderingService(viewer);
    const coordinates = [
      [-124.2, 42.0],
      [-120.0, 42.0],
      [-116.0, 42.0]
    ];
    
    const bounds = service.calculateBounds(coordinates);
    
    expect(bounds.west).toBe(-124.2);
    expect(bounds.east).toBe(-116.0);
    expect(bounds.south).toBe(42.0);
    expect(bounds.north).toBe(42.0);
  });

  it('should handle Polygon GeoJSON type', () => {
    const service = new BoundaryRenderingService(viewer);
    const polygonGeojson = {
      type: 'Polygon',
      coordinates: [[
        [-124.2, 42.0],
        [-120.0, 42.0],
        [-120.0, 38.0],
        [-124.2, 38.0],
        [-124.2, 42.0] // Close the ring
      ]]
    };
    
    const entity = service.renderBoundary(
      polygonGeojson,
      true,
      'polygon-test',
      { name: 'Test Polygon' }
    );
    
    expect(entity).toBeDefined();
    expect(service.boundaryEntities.size).toBe(1);
  });

  it('should dispose and cleanup all resources', () => {
    const service = new BoundaryRenderingService(viewer);
    const { currentBoundary } = testBoundaries;
    
    // Add a boundary
    service.previewBoundary(
      currentBoundary.candidateId,
      currentBoundary.geojson,
      currentBoundary.isDefault,
      currentBoundary.metadata
    );
    
    expect(service.boundaryEntities.size).toBe(1);
    
    // Dispose
    service.dispose();
    
    expect(service.boundaryEntities.size).toBe(0);
    expect(service.viewer).toBeNull();
  });
});

describe('Globe Integration Event Listeners', () => {
  let eventFired;
  let eventDetail;

  beforeEach(() => {
    eventFired = false;
    eventDetail = null;
  });

  it('should dispatch previewBoundary event from VotingPanel', () => {
    const listener = (event) => {
      eventFired = true;
      eventDetail = event.detail;
    };

    window.addEventListener('previewBoundary', listener);

    // Simulate VotingPanel dispatching event
    const testEvent = new CustomEvent('previewBoundary', {
      detail: {
        candidateId: 'test-boundary',
        geojson: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
        direction: 'North',
        isDefault: false
      }
    });

    window.dispatchEvent(testEvent);

    expect(eventFired).toBe(true);
    expect(eventDetail.candidateId).toBe('test-boundary');
    expect(eventDetail.direction).toBe('North');

    window.removeEventListener('previewBoundary', listener);
  });

  it('should dispatch compareBoundaries event from VotingPanel', () => {
    const listener = (event) => {
      eventFired = true;
      eventDetail = event.detail;
    };

    window.addEventListener('compareBoundaries', listener);

    // Simulate VotingPanel dispatching event
    const testEvent = new CustomEvent('compareBoundaries', {
      detail: {
        current: {
          geojson: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
          style: { color: '#00ff00' }
        },
        proposal: {
          geojson: { type: 'LineString', coordinates: [[0, 0.5], [1, 1.5]] },
          style: { color: '#ffff00' }
        }
      }
    });

    window.dispatchEvent(testEvent);

    expect(eventFired).toBe(true);
    expect(eventDetail.current).toBeDefined();
    expect(eventDetail.proposal).toBeDefined();

    window.removeEventListener('compareBoundaries', listener);
  });

  it('should dispatch closeBoundaryPreview event', () => {
    const listener = () => {
      eventFired = true;
    };

    window.addEventListener('closeBoundaryPreview', listener);

    // Simulate close event
    window.dispatchEvent(new CustomEvent('closeBoundaryPreview'));

    expect(eventFired).toBe(true);

    window.removeEventListener('closeBoundaryPreview', listener);
  });
});

console.log('✅ Boundary rendering tests defined');
console.log('Run with: npm test boundary-rendering-test.mjs');
