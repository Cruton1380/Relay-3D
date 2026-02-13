import { RelayLog } from '../../core/utils/relay-log.js';

const TOPOGRAPHY_MODES = Object.freeze([
    { id: 'none', label: 'None' },
    { id: 'contour-data', label: 'Contour Data' },
    { id: '3d-terrain', label: '3D Terrain' },
    { id: 'elevation-heatmap', label: 'Elevation Heatmap' }
]);

function createProvider(modeId) {
    switch (modeId) {
        case 'contour-data':
            return new Cesium.UrlTemplateImageryProvider({
                url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                subdomains: 'abc',
                maximumLevel: 17,
                minimumLevel: 0,
                credit: 'OpenTopoMap'
            });
        case '3d-terrain':
            return new Cesium.UrlTemplateImageryProvider({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
                maximumLevel: 19,
                minimumLevel: 0,
                credit: 'ESRI Hillshade'
            });
        case 'elevation-heatmap':
            return new Cesium.UrlTemplateImageryProvider({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
                maximumLevel: 19,
                minimumLevel: 0,
                credit: 'ESRI World Topo'
            });
        default:
            return null;
    }
}

export class TopographyManager {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.currentMode = 'none';
        this.baseImageryMode = String(options.baseImageryMode || 'osm');
        this.applyBaseImagery = typeof options.applyBaseImagery === 'function' ? options.applyBaseImagery : null;
    }

    listModes() {
        return TOPOGRAPHY_MODES.map((mode) => ({ ...mode }));
    }

    applyMode(modeId = 'none') {
        const requested = String(modeId || 'none').trim() || 'none';
        const mode = TOPOGRAPHY_MODES.some((m) => m.id === requested) ? requested : 'none';
        if (!this.viewer?.imageryLayers) {
            return { ok: false, reason: 'VIEWER_UNAVAILABLE' };
        }

        if (mode === 'none') {
            this.currentMode = 'none';
            RelayLog.info('[GLOBE] topography mode=none');
            if (this.applyBaseImagery) {
                const out = this.applyBaseImagery(this.baseImageryMode);
                return { ok: true, modeId: 'none', restoredImagery: out?.ok === true };
            }
            return { ok: true, modeId: 'none', restoredImagery: false };
        }

        try {
            const provider = createProvider(mode);
            if (!provider) {
                return { ok: false, reason: 'INVALID_TOPOGRAPHY_MODE', mode };
            }
            this.viewer.imageryLayers.removeAll();
            this.viewer.imageryLayers.addImageryProvider(provider);
            this.viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
            this.viewer.scene.globe.enableLighting = mode === '3d-terrain';
            this.viewer.scene.requestRender();
            this.currentMode = mode;
            RelayLog.info(`[GLOBE] topography mode=${mode}`);
            return { ok: true, modeId: mode, layerCount: this.viewer.imageryLayers.length };
        } catch (error) {
            RelayLog.warn(`[GLOBE] topography apply failed mode=${mode} error=${error?.message || error}`);
            return { ok: false, reason: 'TOPOGRAPHY_APPLY_FAILED', detail: String(error?.message || error) };
        }
    }

    clear() {
        return this.applyMode('none');
    }
}

