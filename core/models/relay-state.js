/**
 * RELAY STATE MODEL
 * Pure data structure: renderer-agnostic
 * NO CESIUM IMPORTS ALLOWED (Lock F)
 */

export const relayState = {
    // Earth's core (global reconciliation anchor)
    core: {
        id: "earth.core",
        position: "EARTH_CENTER"  // Cesium.Cartesian3.ZERO in ECEF
    },
    
    // Local tree structures (derived from Excel)
    tree: {
        nodes: [],  // { id, type: 'trunk'|'branch'|'sheet', parent, lat, lon, alt, metadata }
        edges: []   // { source, target, type: 'filament'|'conduit', metadata }
    },
    
    // Global cross-tree relationships (core-routed)
    relationships: [], // { id, type, a: {anchorId}, b: {anchorId}, scope, commitRefs, policyRef, status }
    
    // Building/location anchors (maps buildings to trees)
    anchors: {}, // { 'building-osm-12345': { treeId, branchId } }
    
    // Geospatial overlays
    boundaries: [], // { id, name, geojson, lod, visibility }
    votes: [],      // { id, lat, lon, type, boundaryId, metadata }
    weather: null,  // { timestamp, mode, overlayUrl, samplingGrid }
    
    // Session metadata
    metadata: {
        filename: null,
        importedAt: null,
        version: '1.0.0'
    },
    importStatus: 'OK'
};

export function resetState() {
    relayState.tree.nodes = [];
    relayState.tree.edges = [];
    relayState.boundaries = [];
    relayState.votes = [];
    relayState.weather = null;
    relayState.metadata = { filename: null, importedAt: null, version: '1.0.0' };
    relayState.importStatus = 'OK';
}

export function setTreeData(nodes, edges) {
    relayState.tree.nodes = nodes;
    relayState.tree.edges = edges;
}

export function setBoundaries(boundaries) {
    relayState.boundaries = boundaries;
}

export function setMetadata(key, value) {
    relayState.metadata[key] = value;
}

export function setImportStatus(status) {
    relayState.importStatus = status;
}

export function getTreeStats() {
    return {
        nodes: relayState.tree.nodes.length,
        edges: relayState.tree.edges.length,
        trunks: relayState.tree.nodes.filter(n => n.type === 'trunk').length,
        branches: relayState.tree.nodes.filter(n => n.type === 'branch').length,
        sheets: relayState.tree.nodes.filter(n => n.type === 'sheet').length
    };
}
