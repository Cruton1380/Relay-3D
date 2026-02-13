import { RelayLog } from '../../core/utils/relay-log.js';

// GLOBE-RESTORE-0: Restored archived v93 imagery modes (world-only)
// - local
// - clean-street
// - satellite
// - hybrid
// - osm
// - dark
// - minimalist
const IMAGERY_MODES = Object.freeze([
    { id: 'local', label: 'Local Tiles', provider: 'Local Tile Server' },
    { id: 'clean-street', label: 'Clean Street', provider: 'CartoDB Positron' },
    { id: 'satellite', label: 'Satellite', provider: 'ESRI World Imagery' },
    { id: 'hybrid', label: 'Hybrid', provider: 'ESRI Boundaries and Places' },
    { id: 'osm', label: 'OpenStreetMap', provider: 'OpenStreetMap' },
    { id: 'dark', label: 'Dark', provider: 'CartoDB Dark Matter' },
    { id: 'minimalist', label: 'Minimalist', provider: 'CartoDB Light No Labels' }
]);

const MODE_INDEX = new Map(IMAGERY_MODES.map((mode) => [mode.id, mode]));

function createImageryProvider(modeId) {
    const id = MODE_INDEX.has(modeId) ? modeId : 'osm';
    switch (id) {
        case 'local':
            return new Cesium.UrlTemplateImageryProvider({
                url: 'http://localhost:8081/tiles/{z}/{x}/{y}.png',
                maximumLevel: 10,
                minimumLevel: 0,
                credit: 'Local Tile Server'
            });
        case 'clean-street':
            return new Cesium.UrlTemplateImageryProvider({
                url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
                subdomains: 'abcd',
                maximumLevel: 19,
                minimumLevel: 0,
                credit: 'CartoDB Positron - Clean Street'
            });
        case 'satellite':
            return new Cesium.UrlTemplateImageryProvider({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                maximumLevel: 19,
                minimumLevel: 0,
                credit: 'ESRI World Imagery'
            });
        case 'hybrid':
            return new Cesium.UrlTemplateImageryProvider({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                maximumLevel: 19,
                minimumLevel: 0,
                credit: 'ESRI Hybrid'
            });
        case 'dark':
            return new Cesium.UrlTemplateImageryProvider({
                url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
                subdomains: 'abcd',
                maximumLevel: 19,
                minimumLevel: 0,
                credit: 'CartoDB Dark Matter'
            });
        case 'minimalist':
            return new Cesium.UrlTemplateImageryProvider({
                url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png',
                subdomains: 'abcd',
                maximumLevel: 19,
                minimumLevel: 0,
                credit: 'CartoDB Light No Labels'
            });
        case 'osm':
        default:
            return new Cesium.OpenStreetMapImageryProvider({
                url: 'https://tile.openstreetmap.org/',
                maximumLevel: 19
            });
    }
}

function providerLabel(modeId) {
    return MODE_INDEX.get(modeId)?.provider || MODE_INDEX.get('osm')?.provider || 'Unknown';
}

export function listImageryModes() {
    return IMAGERY_MODES.map((mode) => ({ ...mode }));
}

export function applyImageryMode(viewer, modeId, options = {}) {
    if (!viewer || !viewer.imageryLayers) {
        return {
            ok: false,
            reason: 'VIEWER_UNAVAILABLE'
        };
    }

    const requestedModeId = String(modeId || '').trim();
    const fallbackModeId = String(options.fallbackModeId || 'osm').trim() || 'osm';
    const resolvedModeId = MODE_INDEX.has(requestedModeId) ? requestedModeId : fallbackModeId;

    try {
        const provider = createImageryProvider(resolvedModeId);
        viewer.imageryLayers.removeAll();
        viewer.imageryLayers.addImageryProvider(provider);
        if (viewer.scene && typeof viewer.scene.requestRender === 'function') {
            viewer.scene.requestRender();
        }
        const providerName = providerLabel(resolvedModeId);
        RelayLog.info(`[GLOBE] imagery mode=${resolvedModeId} provider=${providerName}`);
        return {
            ok: true,
            requestedModeId,
            modeId: resolvedModeId,
            provider: providerName,
            layerCount: viewer.imageryLayers.length
        };
    } catch (error) {
        RelayLog.warn(`[GLOBE] imagery apply failed mode=${resolvedModeId} error=${error?.message || error}`);
        if (resolvedModeId !== 'osm') {
            return applyImageryMode(viewer, 'osm', { fallbackModeId: 'osm' });
        }
        return {
            ok: false,
            reason: 'IMAGERY_PROVIDER_FAILED',
            detail: String(error?.message || error)
        };
    }
}

