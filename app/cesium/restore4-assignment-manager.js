import { RelayLog } from '../../core/utils/relay-log.js';

const DEFAULT_FIXTURE_PATH = 'app/cesium/fixtures/restore4-assignment-fixture.json';

const toEntityPosition = (lon, lat, height = 1200) => Cesium.Cartesian3.fromDegrees(Number(lon), Number(lat), Number(height));

export class Restore4AssignmentManager {
    constructor(viewer, getRelayState, getScopeState) {
        this.viewer = viewer;
        this.getRelayState = getRelayState;
        this.getScopeState = getScopeState;
        this.fixture = null;
        this.sites = new Map();
        this.assignmentsCommitted = new Map();
        this.assignmentsProposed = new Map();
        this.overlayEntities = [];
        this.summaryEntity = null;
    }

    async loadFixture(path = DEFAULT_FIXTURE_PATH) {
        const res = await fetch(path, { cache: 'no-store' });
        if (!res.ok) {
            return { ok: false, reason: 'ASSIGNMENT_FIXTURE_LOAD_FAILED', status: res.status };
        }
        const json = await res.json();
        const sites = Array.isArray(json?.sites) ? json.sites : [];
        this.fixture = json;
        this.sites = new Map(sites.map((site) => [String(site.siteId), { ...site }]));
        this.refreshScopeInspector();
        return { ok: true, state: this.getState() };
    }

    isLoaded() {
        return this.sites.size > 0;
    }

    getSite(siteId) {
        return this.sites.get(String(siteId || '').trim()) || null;
    }

    listSites() {
        return [...this.sites.values()].map((site) => ({
            siteId: String(site.siteId),
            regionId: String(site.regionId || ''),
            countryId: String(site.countryId || ''),
            lat: Number(site.lat),
            lon: Number(site.lon)
        }));
    }

    setProposed({ branchId, siteId, proposalId }) {
        const site = this.getSite(siteId);
        if (!site) return { ok: false, reason: 'UNKNOWN_SITE_ID' };
        const record = this.buildRecord(branchId, site, { mode: 'proposed', proposalId });
        this.assignmentsProposed.set(String(branchId), record);
        RelayLog.info(`[GLOBE] assignment branch=${record.branchId} site=${record.siteId} region=${record.regionId} country=${record.countryId} mode=proposed`);
        this.refreshScopeInspector();
        return { ok: true, record };
    }

    setCommitted({ branchId, siteId, commitId }) {
        const site = this.getSite(siteId);
        if (!site) return { ok: false, reason: 'UNKNOWN_SITE_ID' };
        const record = this.buildRecord(branchId, site, { mode: 'committed', commitId });
        this.assignmentsCommitted.set(String(branchId), record);
        this.assignmentsProposed.delete(String(branchId));
        RelayLog.info(`[GLOBE] assignment branch=${record.branchId} site=${record.siteId} region=${record.regionId} country=${record.countryId} mode=committed`);
        this.refreshScopeInspector();
        return { ok: true, record };
    }

    getState() {
        const inspector = this.computeScopeInspector();
        return {
            loaded: this.isLoaded(),
            sites: this.listSites(),
            proposed: [...this.assignmentsProposed.values()],
            committed: [...this.assignmentsCommitted.values()],
            inspector
        };
    }

    computeScopeInspector() {
        const scopeState = this.getScopeState?.() || {};
        const selectedScope = scopeState?.selection?.level && scopeState?.selection?.id
            ? `${scopeState.selection.level}.${scopeState.selection.id}`
            : 'none';
        const inScopeSet = new Set(Array.isArray(scopeState?.eval?.inScopeBranches) ? scopeState.eval.inScopeBranches.map(String) : []);
        const committed = [...this.assignmentsCommitted.values()];
        const inScopeBranches = [];
        const outOfScopeBranches = [];
        for (const rec of committed) {
            if (inScopeSet.has(rec.branchId)) inScopeBranches.push(rec);
            else outOfScopeBranches.push(rec);
        }
        return {
            selectedScope,
            inScopeBranches,
            outOfScopeBranches
        };
    }

    refreshScopeInspector() {
        const inspector = this.computeScopeInspector();
        RelayLog.info(`[GLOBE] scope-inspector selectedScope=${inspector.selectedScope} inScopeBranches=${inspector.inScopeBranches.length} outOfScopeBranches=${inspector.outOfScopeBranches.length}`);
        this.renderMinimalOverlays(inspector);
        return inspector;
    }

    buildRecord(branchId, site, extra = {}) {
        return {
            branchId: String(branchId),
            siteId: String(site.siteId),
            regionId: String(site.regionId || ''),
            countryId: String(site.countryId || ''),
            lat: Number(site.lat),
            lon: Number(site.lon),
            mode: String(extra.mode || ''),
            proposalId: extra.proposalId || null,
            commitId: extra.commitId || null
        };
    }

    renderMinimalOverlays(inspector) {
        if (!this.viewer?.entities) return;
        for (const entity of this.overlayEntities) {
            this.viewer.entities.remove(entity);
        }
        this.overlayEntities = [];
        if (this.summaryEntity) {
            this.viewer.entities.remove(this.summaryEntity);
            this.summaryEntity = null;
        }
        const all = [...inspector.inScopeBranches, ...inspector.outOfScopeBranches];
        for (const rec of all) {
            const inScope = inspector.inScopeBranches.some((x) => x.branchId === rec.branchId);
            const entity = this.viewer.entities.add({
                id: `restore4-assignment-${rec.branchId}`,
                position: toEntityPosition(rec.lon, rec.lat, 1500),
                point: {
                    pixelSize: 8,
                    color: inScope ? Cesium.Color.LIME.withAlpha(0.95) : Cesium.Color.RED.withAlpha(0.95),
                    outlineColor: Cesium.Color.BLACK.withAlpha(0.9),
                    outlineWidth: 1
                },
                label: {
                    text: `${rec.branchId} -> ${rec.siteId}`,
                    font: '11px sans-serif',
                    pixelOffset: new Cesium.Cartesian2(0, -14),
                    showBackground: true,
                    backgroundColor: Cesium.Color.BLACK.withAlpha(0.5),
                    fillColor: Cesium.Color.WHITE
                }
            });
            this.overlayEntities.push(entity);
        }
        const anchor = all[0];
        if (anchor) {
            this.summaryEntity = this.viewer.entities.add({
                id: 'restore4-scope-inspector-summary',
                position: toEntityPosition(anchor.lon, anchor.lat, 300000),
                label: {
                    text: `Scope ${inspector.selectedScope}\nIn-scope: ${inspector.inScopeBranches.length}  Out-of-scope: ${inspector.outOfScopeBranches.length}`,
                    font: '13px sans-serif',
                    showBackground: true,
                    backgroundColor: Cesium.Color.BLACK.withAlpha(0.65),
                    fillColor: Cesium.Color.CYAN
                }
            });
        }
    }
}
