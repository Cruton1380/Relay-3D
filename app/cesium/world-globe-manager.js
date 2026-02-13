import { RelayLog } from '../../core/utils/relay-log.js';

const CLUSTER_LEVELS = Object.freeze([
    { id: 'gps', label: 'GPS' },
    { id: 'city', label: 'City' },
    { id: 'state', label: 'State' },
    { id: 'country', label: 'Country' },
    { id: 'region', label: 'Region' },
    { id: 'globe', label: 'Globe' }
]);

const CORE_COUNTRIES = Object.freeze([
    'USA', 'CAN', 'MEX', 'BRA', 'ARG', 'GBR', 'FRA', 'DEU', 'ESP', 'ITA',
    'NLD', 'NOR', 'RUS', 'TUR', 'EGY', 'SAU', 'ZAF', 'IND', 'CHN', 'JPN',
    'KOR', 'IDN', 'AUS', 'NZL', 'ISR', 'ARE'
]);

const EXPANDED_COUNTRIES = Object.freeze([
    ...CORE_COUNTRIES,
    'SWE', 'FIN', 'POL', 'UKR', 'GRC', 'PRT', 'MAR', 'NGA', 'KEN', 'ETH',
    'PAK', 'BGD', 'THA', 'VNM', 'PHL', 'COL', 'PER', 'CHL', 'URY', 'SGP'
]);

const COUNTRY_SETS = Object.freeze([
    { id: 'baseline', label: 'Baseline ISR+USA', countries: ['ISR', 'USA'] },
    { id: 'global-core', label: 'Global Core', countries: CORE_COUNTRIES },
    { id: 'global-expanded', label: 'Global Expanded', countries: EXPANDED_COUNTRIES },
    { id: 'europe-core', label: 'Europe Core', countries: ['GBR', 'FRA', 'DEU', 'ESP', 'ITA', 'NLD', 'NOR', 'SWE', 'FIN', 'POL', 'UKR', 'PRT', 'GRC'] },
    { id: 'americas-core', label: 'Americas Core', countries: ['USA', 'CAN', 'MEX', 'BRA', 'ARG', 'COL', 'PER', 'CHL', 'URY'] },
    { id: 'apac-core', label: 'APAC Core', countries: ['IND', 'CHN', 'JPN', 'KOR', 'IDN', 'THA', 'VNM', 'PHL', 'AUS', 'NZL', 'SGP'] },
    { id: 'mea-core', label: 'MEA Core', countries: ['ISR', 'ARE', 'SAU', 'EGY', 'MAR', 'NGA', 'KEN', 'ETH', 'ZAF', 'TUR'] }
]);

const COUNTRY_SET_INDEX = new Map(COUNTRY_SETS.map((x) => [x.id, x]));

const MACRO_REGIONS = Object.freeze([
    { id: 'north-america', name: 'North America', lon: -100, lat: 43, countries: ['USA', 'CAN', 'MEX'] },
    { id: 'south-america', name: 'South America', lon: -60, lat: -15, countries: ['BRA', 'ARG', 'COL', 'PER', 'CHL', 'URY'] },
    { id: 'europe', name: 'Europe', lon: 14, lat: 52, countries: ['GBR', 'FRA', 'DEU', 'ESP', 'ITA', 'NLD', 'NOR', 'SWE', 'FIN', 'POL', 'UKR', 'PRT', 'GRC'] },
    { id: 'africa', name: 'Africa', lon: 20, lat: 7, countries: ['EGY', 'NGA', 'KEN', 'ETH', 'ZAF', 'MAR'] },
    { id: 'asia', name: 'Asia', lon: 100, lat: 30, countries: ['SAU', 'TUR', 'RUS', 'IND', 'CHN', 'JPN', 'KOR', 'PAK', 'BGD', 'THA', 'VNM', 'PHL', 'ISR', 'ARE'] },
    { id: 'oceania', name: 'Oceania', lon: 135, lat: -25, countries: ['AUS', 'NZL', 'IDN', 'SGP'] }
]);

const toCartesian = (lon, lat, height = 50000) => Cesium.Cartesian3.fromDegrees(lon, lat, height);
const CLUSTER_CAMERA_HEIGHT = Object.freeze({
    globe: 24000000,
    region: 7000000,
    country: 2500000,
    state: 1200000,
    city: 450000,
    gps: 120000
});

export class WorldGlobeManager {
    constructor(viewer, boundaryRenderer) {
        this.viewer = viewer;
        this.boundaryRenderer = boundaryRenderer;
        this.clusterLevel = 'globe';
        this.focusCountry = 'USA';
        this.focusRegion = 'north-america';
        this.loadedCountries = new Set();
        this.boundaryManifestCountries = null;
        this.boundaryManifestLoaded = false;
        this.regionMarkers = [];
        this.activeCountrySet = 'baseline';
        this.adminDataSources = {
            state: null,
            city: null
        };
        this.countryCenters = new Map();
        this.activeRegionCountries = [];
        this._boundarySummaryLogged = false;
    }

    listClusterLevels() {
        return CLUSTER_LEVELS.map((lvl) => ({ ...lvl }));
    }

    getState() {
        return {
            clusterLevel: this.clusterLevel,
            focusCountry: this.focusCountry,
            focusRegion: this.focusRegion,
            activeCountrySet: this.activeCountrySet,
            loadedCountries: [...this.loadedCountries].sort(),
            activeRegionCountries: [...this.activeRegionCountries]
        };
    }

    async initialize() {
        await this.ensureBoundaryManifestLoaded();
        this.createMacroRegionMarkers();
        this.setRegionMarkersVisible(true);
        await this.loadCountrySet('global-core');
        await this.setFocusRegion(this.focusRegion, { skipCamera: true, skipClusterReframe: true });
        this.flyToClusterContext('globe');
        RelayLog.info(`[GLOBE] hierarchy init cluster=${this.clusterLevel} countries=${this.loadedCountries.size}`);
        return this.getState();
    }

    listCountrySets() {
        return COUNTRY_SETS.map((set) => ({
            id: set.id,
            label: set.label,
            countryCount: set.countries.length
        }));
    }

    async loadCountrySet(setId = 'global-core') {
        const requested = String(setId || '').trim().toLowerCase();
        const selected = COUNTRY_SET_INDEX.get(requested);
        if (!selected) {
            return { ok: false, reason: 'UNKNOWN_COUNTRY_SET', setId: requested };
        }
        await this.ensureCountrySetLoaded(selected.countries);
        this.activeCountrySet = selected.id;
        this.emitBoundaryDatasetSummary();
        RelayLog.info(`[GLOBE] country-set id=${selected.id} loaded=${selected.countries.length}`);
        return { ok: true, state: this.getState() };
    }

    listRegions() {
        return MACRO_REGIONS.map((r) => ({
            id: r.id,
            name: r.name,
            focusCountry: r.countries?.[0] || null,
            countryCount: Array.isArray(r.countries) ? r.countries.length : 0
        }));
    }

    listFocusRegionCountries() {
        return [...this.activeRegionCountries];
    }

    async setClusterLevel(levelId) {
        const level = String(levelId || '').trim().toLowerCase();
        if (!CLUSTER_LEVELS.some((l) => l.id === level)) {
            return { ok: false, reason: 'UNKNOWN_CLUSTER_LEVEL', level };
        }
        this.clusterLevel = level;

        if (level === 'globe') {
            this.setRegionMarkersVisible(true);
            await this.loadCountrySet('global-core');
            await this.clearAdminLayers();
        } else if (level === 'region') {
            this.setRegionMarkersVisible(true);
            await this.loadCountrySet('global-core');
            await this.clearAdminLayers();
        } else if (level === 'country') {
            this.setRegionMarkersVisible(false);
            await this.loadCountrySet('global-expanded');
            await this.clearAdminLayers();
        } else if (level === 'state') {
            this.setRegionMarkersVisible(false);
            await this.loadCountrySet('global-expanded');
            await this.loadAdminLayer('state', this.focusCountry);
        } else if (level === 'city') {
            this.setRegionMarkersVisible(false);
            await this.loadCountrySet('global-expanded');
            await this.loadAdminLayer('state', this.focusCountry);
            await this.loadAdminLayer('city', this.focusCountry);
        } else if (level === 'gps') {
            this.setRegionMarkersVisible(false);
            await this.loadCountrySet('global-expanded');
            await this.loadAdminLayer('state', this.focusCountry);
            await this.loadAdminLayer('city', this.focusCountry);
        } else {
            this.setRegionMarkersVisible(false);
            await this.clearAdminLayers();
        }

        this.flyToClusterContext(level);
        RelayLog.info(`[GLOBE] cluster level=${level} focusCountry=${this.focusCountry}`);
        return { ok: true, state: this.getState() };
    }

    async setFocusCountry(countryCode) {
        const code = String(countryCode || '').trim().toUpperCase();
        if (!code) {
            return { ok: false, reason: 'INVALID_COUNTRY_CODE' };
        }
        this.focusCountry = code;
        await this.loadCountryBoundary(code);
        if (this.clusterLevel === 'state' || this.clusterLevel === 'city') {
            await this.loadAdminLayer('state', code);
        }
        if (this.clusterLevel === 'city') {
            await this.loadAdminLayer('city', code);
        }
        this.flyToCountry(code);
        RelayLog.info(`[GLOBE] focus country=${code}`);
        return { ok: true, state: this.getState() };
    }

    async setFocusRegion(regionId, options = {}) {
        const requested = String(regionId || '').trim().toLowerCase();
        const region = MACRO_REGIONS.find((r) => r.id === requested);
        if (!region) {
            return { ok: false, reason: 'UNKNOWN_REGION', regionId: requested };
        }
        this.focusRegion = region.id;
        if (!options.skipCamera && this.viewer?.camera) {
            this.viewer.camera.flyTo({
                destination: toCartesian(region.lon, region.lat, 6000000),
                duration: 1.2
            });
        }
        if (Array.isArray(region.countries) && region.countries.length > 0) {
            this.activeRegionCountries = [...region.countries];
            await this.ensureCountrySetLoaded(region.countries);
            await this.setFocusCountry(region.countries[0]);
            if (!options.skipClusterReframe) {
                this.flyToClusterContext(this.clusterLevel);
            }
        }
        RelayLog.info(`[GLOBE] focus region=${region.id}`);
        return { ok: true, state: this.getState() };
    }

    async focusNextRegion() {
        const ids = MACRO_REGIONS.map((r) => r.id);
        const idx = Math.max(0, ids.indexOf(this.focusRegion));
        const next = ids[(idx + 1) % ids.length];
        return this.setFocusRegion(next);
    }

    createMacroRegionMarkers() {
        if (!this.viewer?.entities) return;
        if (this.regionMarkers.length > 0) return;
        for (const region of MACRO_REGIONS) {
            const entity = this.viewer.entities.add({
                id: `region-marker-${region.id}`,
                position: toCartesian(region.lon, region.lat, 250000),
                label: {
                    text: region.name,
                    font: '14px sans-serif',
                    showBackground: true,
                    backgroundColor: Cesium.Color.BLACK.withAlpha(0.5),
                    fillColor: Cesium.Color.CYAN.withAlpha(0.95),
                    pixelOffset: new Cesium.Cartesian2(0, -12),
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM
                },
                point: {
                    pixelSize: 6,
                    color: Cesium.Color.CYAN.withAlpha(0.85),
                    outlineColor: Cesium.Color.WHITE.withAlpha(0.8),
                    outlineWidth: 1
                }
            });
            this.regionMarkers.push(entity);
        }
    }

    setRegionMarkersVisible(visible) {
        for (const marker of this.regionMarkers) {
            marker.show = visible;
        }
    }

    async ensureCountrySetLoaded(countryCodes) {
        for (const code of countryCodes) {
            // eslint-disable-next-line no-await-in-loop
            await this.loadCountryBoundary(code);
        }
    }

    async loadCountryBoundary(code) {
        const countryCode = String(code || '').trim().toUpperCase();
        if (!countryCode || this.loadedCountries.has(countryCode)) {
            return 0;
        }
        await this.ensureBoundaryManifestLoaded();
        if (this.boundaryManifestCountries instanceof Set && !this.boundaryManifestCountries.has(countryCode)) {
            if (typeof window !== 'undefined' && window.RELAY_DEBUG_LOGS === true) {
                RelayLog.info(`[BOUNDARY] skipMissing country=${countryCode} reason=not_in_manifest`);
            }
            return 0;
        }
        if (!this.boundaryRenderer || typeof this.boundaryRenderer.loadBoundary !== 'function') {
            return 0;
        }
        if (this.boundaryRenderer.missingBoundaries?.has(countryCode)) {
            return 0;
        }
        const added = await this.boundaryRenderer.loadBoundary(countryCode, `countries/${countryCode}-ADM0.geojson`);
        if (added > 0) {
            this.loadedCountries.add(countryCode);
            this.captureCountryCenter(countryCode);
        }
        return added;
    }

    async ensureBoundaryManifestLoaded() {
        if (this.boundaryManifestLoaded) return;
        this.boundaryManifestLoaded = true;
        try {
            const response = await fetch('./app/cesium/fixtures/boundary-manifest-v0.json', { cache: 'no-store' });
            if (!response.ok) {
                this.boundaryManifestCountries = new Set();
                RelayLog.warn('[BOUNDARY] manifestLoaded countries=0');
                return;
            }
            const payload = await response.json();
            const countries = Array.isArray(payload?.countries)
                ? payload.countries
                : [];
            this.boundaryManifestCountries = new Set(
                countries
                    .map((x) => String(x || '').trim().toUpperCase())
                    .filter((x) => /^[A-Z]{3}$/.test(x))
            );
            RelayLog.info(`[BOUNDARY] manifestLoaded countries=${this.boundaryManifestCountries.size}`);
        } catch {
            this.boundaryManifestCountries = new Set();
            RelayLog.warn('[BOUNDARY] manifestLoaded countries=0');
        }
    }

    emitBoundaryDatasetSummary() {
        if (!this.boundaryRenderer || typeof this.boundaryRenderer.getMissingBoundarySummary !== 'function') return;
        const summary = this.boundaryRenderer.getMissingBoundarySummary();
        if (!summary || Number(summary.missing || 0) <= 0) return;
        if (typeof window !== 'undefined') {
            window.__relayBoundaryDatasetStatus = {
                state: 'DEGRADED',
                missing: summary.missing,
                first: summary.first
            };
        }
        if (!this._boundarySummaryLogged) {
            RelayLog.warn(`[BOUNDARY] datasetDegraded missing=${summary.missing} first=${summary.first}`);
            this._boundarySummaryLogged = true;
        }
    }

    async loadAdminLayer(kind, countryCode) {
        const key = kind === 'city' ? 'city' : 'state';
        const suffix = key === 'city' ? 'ADM2' : 'ADM1';
        const existing = this.adminDataSources[key];
        if (existing) {
            this.viewer.dataSources.remove(existing, true);
            this.adminDataSources[key] = null;
        }
        try {
            const ds = await Cesium.GeoJsonDataSource.load(`data/boundaries/${key === 'city' ? 'cities' : 'provinces'}/${countryCode}-${suffix}.geojson`, {
                stroke: key === 'city' ? Cesium.Color.YELLOW.withAlpha(0.7) : Cesium.Color.ORANGE.withAlpha(0.85),
                fill: Cesium.Color.TRANSPARENT,
                strokeWidth: key === 'city' ? 1.0 : 1.5
            });
            this.viewer.dataSources.add(ds);
            this.adminDataSources[key] = ds;
            RelayLog.info(`[GLOBE] admin layer=${key} country=${countryCode} status=ON`);
            return { ok: true };
        } catch {
            RelayLog.info(`[GLOBE] admin layer=${key} country=${countryCode} status=MISSING`);
            return { ok: false, reason: 'ADMIN_LAYER_MISSING' };
        }
    }

    async clearAdminLayers() {
        for (const key of ['state', 'city']) {
            if (this.adminDataSources[key]) {
                this.viewer.dataSources.remove(this.adminDataSources[key], true);
                this.adminDataSources[key] = null;
            }
        }
        return { ok: true };
    }

    captureCountryCenter(countryCode) {
        const rec = this.boundaryRenderer?.loadedBoundaries?.get(countryCode);
        const features = rec?.geoJson?.features;
        if (!Array.isArray(features) || features.length === 0) return;
        const points = [];
        for (const feature of features) {
            const geometry = feature?.geometry;
            if (!geometry) continue;
            if (geometry.type === 'Polygon') {
                points.push(...this.extractLinearRingPoints(geometry.coordinates));
            } else if (geometry.type === 'MultiPolygon') {
                for (const polygon of (geometry.coordinates || [])) {
                    points.push(...this.extractLinearRingPoints(polygon));
                }
            }
        }
        if (!points.length) return;
        let lonSum = 0;
        let latSum = 0;
        for (const point of points) {
            lonSum += point[0];
            latSum += point[1];
        }
        this.countryCenters.set(countryCode, {
            lon: lonSum / points.length,
            lat: latSum / points.length
        });
    }

    extractLinearRingPoints(polygonCoordinates) {
        const outer = Array.isArray(polygonCoordinates) ? polygonCoordinates[0] : null;
        if (!Array.isArray(outer)) return [];
        return outer.filter((coord) => Array.isArray(coord) && Number.isFinite(coord[0]) && Number.isFinite(coord[1]));
    }

    flyToClusterContext(levelId) {
        if (!this.viewer?.camera) return;
        const level = String(levelId || this.clusterLevel || 'globe');
        if (level === 'globe') {
            this.viewer.camera.flyTo({
                destination: toCartesian(12, 22, CLUSTER_CAMERA_HEIGHT.globe),
                duration: 1.2
            });
            return;
        }
        if (level === 'region') {
            const region = MACRO_REGIONS.find((r) => r.id === this.focusRegion) || MACRO_REGIONS[0];
            this.viewer.camera.flyTo({
                destination: toCartesian(region.lon, region.lat, CLUSTER_CAMERA_HEIGHT.region),
                duration: 1.0
            });
            return;
        }
        this.flyToCountry(this.focusCountry, CLUSTER_CAMERA_HEIGHT[level] || CLUSTER_CAMERA_HEIGHT.country);
    }

    flyToCountry(countryCode, height = CLUSTER_CAMERA_HEIGHT.country) {
        if (!this.viewer?.camera) return;
        const code = String(countryCode || '').trim().toUpperCase();
        const center = this.countryCenters.get(code);
        if (!center) return;
        this.viewer.camera.flyTo({
            destination: toCartesian(center.lon, center.lat, height),
            duration: 0.8
        });
    }
}

