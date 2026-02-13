import { RelayLog } from '../../core/utils/relay-log.js';

const WEATHER_TYPES = Object.freeze([
    { id: 'clouds', label: 'Clouds', alpha: 0.60, brightness: 1.2, contrast: 1.2 },
    { id: 'precipitation', label: 'Precipitation', alpha: 0.75, brightness: 1.3, contrast: 1.3 },
    { id: 'temperature', label: 'Temperature', alpha: 0.70, brightness: 1.15, contrast: 1.25 },
    { id: 'radar', label: 'Radar', alpha: 0.80, brightness: 1.3, contrast: 1.35 },
    { id: 'snow', label: 'Snow', alpha: 0.75, brightness: 1.2, contrast: 1.2 }
]);

const WEATHER_INDEX = new Map(WEATHER_TYPES.map((item) => [item.id, item]));

export class WeatherManager {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.baseUrl = String(options.baseUrl || 'http://127.0.0.1:4020').replace(/\/+$/, '');
        this.mode = String(options.mode || 'fixture').toLowerCase();
        this.activeLayers = new Map();
    }

    listTypes() {
        return WEATHER_TYPES.map((item) => ({ id: item.id, label: item.label }));
    }

    setMode(mode) {
        this.mode = String(mode || 'fixture').toLowerCase();
        RelayLog.info(`[GLOBE] weather mode=${this.mode}`);
        return { ok: true, mode: this.mode };
    }

    buildTileUrl(typeId) {
        const modeQuery = encodeURIComponent(this.mode || 'fixture');
        return `${this.baseUrl}/api/globe/weather/${typeId}/{z}/{x}/{y}.png?mode=${modeQuery}`;
    }

    addOverlay(typeId) {
        if (!this.viewer?.imageryLayers) {
            return { ok: false, reason: 'VIEWER_UNAVAILABLE' };
        }
        const type = String(typeId || '').trim().toLowerCase();
        const config = WEATHER_INDEX.get(type);
        if (!config) {
            return { ok: false, reason: 'UNKNOWN_WEATHER_TYPE', type };
        }

        if (this.activeLayers.has(type)) {
            this.removeOverlay(type);
        }

        try {
            const provider = new Cesium.UrlTemplateImageryProvider({
                url: this.buildTileUrl(type),
                maximumLevel: 8,
                minimumLevel: 0,
                hasAlphaChannel: true,
                enablePickFeatures: false,
                credit: `Relay Weather ${type}`
            });
            const layer = this.viewer.imageryLayers.addImageryProvider(provider);
            layer.alpha = config.alpha;
            layer.brightness = config.brightness;
            layer.contrast = config.contrast;
            this.activeLayers.set(type, layer);
            this.viewer.scene.requestRender();
            RelayLog.info(`[GLOBE] weather overlay=${type} state=ON mode=${this.mode}`);
            return { ok: true, type, overlays: this.activeLayers.size };
        } catch (error) {
            RelayLog.warn(`[GLOBE] weather add failed type=${type} error=${error?.message || error}`);
            return { ok: false, reason: 'WEATHER_ADD_FAILED', detail: String(error?.message || error) };
        }
    }

    removeOverlay(typeId) {
        if (!this.viewer?.imageryLayers) {
            return { ok: false, reason: 'VIEWER_UNAVAILABLE' };
        }
        const type = String(typeId || '').trim().toLowerCase();
        const layer = this.activeLayers.get(type);
        if (!layer) {
            return { ok: true, removed: false, type };
        }
        try {
            if (this.viewer.imageryLayers.contains(layer)) {
                this.viewer.imageryLayers.remove(layer);
            }
            this.activeLayers.delete(type);
            this.viewer.scene.requestRender();
            RelayLog.info(`[GLOBE] weather overlay=${type} state=OFF`);
            return { ok: true, removed: true, overlays: this.activeLayers.size };
        } catch (error) {
            return { ok: false, reason: 'WEATHER_REMOVE_FAILED', detail: String(error?.message || error) };
        }
    }

    clear() {
        const types = [...this.activeLayers.keys()];
        for (const type of types) {
            this.removeOverlay(type);
        }
        RelayLog.info('[GLOBE] weather clear');
        return { ok: true };
    }
}

