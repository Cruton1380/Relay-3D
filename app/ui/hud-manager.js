/**
 * HUD (Heads-Up Display) MANAGER
 * Manages on-screen information display
 */
import { RelayLog } from '../../core/utils/relay-log.js';

export class HUDManager {
    constructor(hudElementId = 'hud', policy = {}) {
        this.hudElement = document.getElementById(hudElementId);
        this.policy = {};
        this.lastModeLogKey = null;
        this.data = {
            lod: 'UNKNOWN',
            altitude: 0,
            nodeCount: 0,
            fps: 0,
            boundaryStatus: 'LOADING',
            boundaryMissing: 0,
            buildings: 'UNKNOWN',
            filamentMode: 'ENTITY',  // ENTITY or PRIMITIVE
            formulaCycles: 0,
            formulaScars: 0,
            cfStatus: 'INDETERMINATE',
            importStatus: 'OK',
            debugRangeOps: false,
            debugSpineGuide: false,
            debugLogs: false,
            showCellMarkersAtCompany: false,
            showActiveMarkers: true,
            activeMarkerMode: 'auto',
            facingSheets: false,  // PROJ-SHEET-FACING-1
            editSheetMode: false,
            imageryMode: 'OSM',
            operationMode: 'FreeFly',
            activeCompany: 'n/a',
            activeBranch: 'n/a',
            activeSheet: 'n/a',
            basin: 'None',
            branchStep: '—',
            filamentStep: '—',
            focusTarget: 'none',
            focusRestore: 'n/a',
            selectedCellRef: '—',
            selectedCellValue: '—',
            selectedCellFormula: '—',
            selectedCellFormulaState: 'DETERMINATE',
            paramsVersion: 'HUD-PARAMS-v0',
            policyRef: 'local:HUD-PARAMS-v0'
            ,
            detailCollapsedAt: '',
            focusHint: '',
            voteSummary: ''
        };
        this.lenses = {
            value: false,
            formula: false,
            cf: false,
            history: true
        };
        this.onLensToggle = null;
        this.onDebugRangeToggle = null;
        this.onDebugSpineGuideToggle = null;
        this.onCompanyMarkersToggle = null;
        this.onActiveMarkersToggle = null;
        this.onActiveMarkerModeChange = null;
        this.onEditSheetModeToggle = null;
        this.onImageryModeChange = null;
        this.onDebugLogsToggle = null;
        this.onInspectorToggle = null;
        this._tier2Open = false;
        this._consolidatedLogEmitted = false;
        this._tier2DefaultLogEmitted = false;
        this._tier1RowsLogEmitted = false;
        this.setPolicy(policy);
    }

    /** HUD-CONSOLIDATION-1: Toggle Tier 2 (diagnostics). reason: 'hotkey' | 'click' */
    toggleTier2(reason = 'click') {
        this._tier2Open = !this._tier2Open;
        RelayLog.info(`[HUD] tier2 toggle=${this._tier2Open ? 'ON' : 'OFF'} reason=${reason}`);
        this.render();
    }

    /**
     * Update HUD data
     * @param {Object} updates - { lod?, altitude?, nodeCount?, fps?, boundaryStatus? }
     */
    update(updates) {
        Object.assign(this.data, updates);
        this.render();
    }

    setLensState(lenses) {
        this.lenses = { ...this.lenses, ...lenses };
        this.render();
    }

    setLensToggleHandler(handler) {
        this.onLensToggle = handler;
    }

    setDebugRangeToggleHandler(handler) {
        this.onDebugRangeToggle = handler;
    }

    setDebugSpineGuideToggleHandler(handler) {
        this.onDebugSpineGuideToggle = handler;
    }

    setCompanyMarkersToggleHandler(handler) {
        this.onCompanyMarkersToggle = handler;
    }

    setActiveMarkersToggleHandler(handler) {
        this.onActiveMarkersToggle = handler;
    }

    setActiveMarkerModeChangeHandler(handler) {
        this.onActiveMarkerModeChange = handler;
    }

    setEditSheetModeToggleHandler(handler) {
        this.onEditSheetModeToggle = handler;
    }

    setImageryModeChangeHandler(handler) {
        this.onImageryModeChange = handler;
    }

    setDebugLogsToggleHandler(handler) {
        this.onDebugLogsToggle = handler;
    }

    setInspectorToggleHandler(handler) {
        this.onInspectorToggle = handler;
    }

    // PROJ-SHEET-FACING-1: Projection lens overlay toggle
    setFacingSheetsToggleHandler(handler) {
        this.onFacingSheetsToggle = handler;
    }

    setPolicy(policy = {}) {
        const defaults = {
            paramsVersion: 'HUD-PARAMS-v0',
            layoutMode: 'compact',
            layer1Fields: ['company', 'basin', 'mode', 'importStatus', 'lod', 'policyRef'],
            modeFields: {
                freeFly: [],
                branchWalk: ['branchStep'],
                filamentRide: ['filamentStep'],
                focus: ['focusTarget'],
                sheetEdit: ['cellContext'],
                cellSelected: ['cellContext']
            },
            toggles: {
                showInspectorButton: true,
                showDebugToggles: false,
                showPasteCapText: false
            },
            labels: {
                company: 'Company',
                basin: 'Basin',
                mode: 'Mode',
                importStatus: 'Import',
                lod: 'LOD',
                policyRef: 'Policy'
            }
        };
        this.policy = {
            ...defaults,
            ...policy,
            modeFields: { ...defaults.modeFields, ...(policy.modeFields || {}) },
            toggles: { ...defaults.toggles, ...(policy.toggles || {}) },
            labels: { ...defaults.labels, ...(policy.labels || {}) }
        };
        this.data.paramsVersion = this.policy.paramsVersion || defaults.paramsVersion;
        this.render();
    }
    
    /**
     * Render HUD to DOM
     * In launch mode: two-tier layout (Tier 1 always visible, Tier 2 collapsible)
     * In dev mode: full Adaptive HUD layout (unchanged)
     */
    render() {
        if (!this.hudElement) return;
        const d = this.data;
        const compact = String(this.policy.layoutMode || 'compact') === 'compact' || window.innerWidth < 900;
        const sectionStyle = compact
            ? 'margin-top: 6px; border-top: 1px solid #444; padding-top: 4px; font-size: 8.5pt;'
            : 'margin-top: 8px; border-top: 1px solid #444; padding-top: 5px; font-size: 9pt;';
        const line = (k, v) => `<div><span style="color:#7ea7d8;">${k}</span> ${v}</div>`;
        const importColor = d.importStatus === 'INDETERMINATE' ? '#ffb74d' : (d.importStatus === 'REFUSAL' ? '#ff7b6b' : '#7adf8a');

        // ═══ LAUNCH MODE: Two-tier HUD (HUD-CONSOLIDATION-1) ═══════════════
        if (d.launchMode) {
            const tier2Open = this._tier2Open === true;
            const modeColor = d.operationMode === 'SheetEdit' ? '#88c0ff' : '#c8d7eb';
            // Tier 1: exactly 6 logical rows, each a .tier1-row for proof assertion
            const focusCompany = d.activeCompany && d.activeCompany !== 'n/a' ? d.activeCompany : 'Global';
            const focusBranch = d.activeBranch && d.activeBranch !== 'n/a' ? d.activeBranch : '(none)';
            const focusSheet = d.activeSheet && d.activeSheet !== 'n/a' ? d.activeSheet : '(none)';
            const boundaryBadge = d.boundaryStatus === 'ACTIVE'
                ? '<span style="color:#7adf8a; font-size:9px;">ON</span>'
                : '<span style="color:#ffb74d; font-size:9px;">OFF</span>';
            const tier1HTML = `
                <div class="tier1-row">${line('Profile:', '<span style="color:#7adf8a;">launch</span>')}</div>
                <div class="tier1-row">${line('Mode:', `<span style="color:${modeColor};">${d.operationMode || 'FreeFly'}</span>`)}</div>
                <div class="tier1-row">${line('Focus:', `${focusCompany} / ${focusBranch} / ${focusSheet}`)}</div>
                <div class="tier1-row">${line('LOD:', String(d.lod || 'UNKNOWN'))}</div>
                <div class="tier1-row">${line('Data:', `<span style="color:${importColor};">${d.importStatus || 'OK'}</span> ${d.selectedCellRef && d.selectedCellRef !== '—' ? '| Cell: ' + d.selectedCellRef : ''}`)}</div>
                <div class="tier1-row"><div>
                    <span style="color:#7ea7d8;">World:</span>
                    <select id="hudImageryMode" style="margin-left:4px; background:#111; color:#ddd; border:1px solid #333; font-size:8pt; padding:1px 3px;">
                        <option value="osm" ${String(d.imageryMode).toLowerCase() === 'osm' ? 'selected' : ''}>OSM</option>
                        <option value="satellite" ${String(d.imageryMode).toLowerCase() === 'satellite' ? 'selected' : ''}>Satellite</option>
                    </select>
                    <span style="margin-left:6px;">Boundaries: ${boundaryBadge}</span>
                </div></div>
                ${d.voteSummary ? `<div class="tier1-row">${line('Votes:', d.voteSummary)}</div>` : ''}`;
            const tier2Content = `
                <div style="margin-top:6px; border-top:1px solid #444; padding-top:4px; font-size:9px; color:#8a9bb5;">
                    ${line('Boundaries:', d.boundaryStatus || 'UNKNOWN')}
                    ${line('Buildings:', d.buildings || 'UNKNOWN')}
                    ${line('Basin:', d.basin || 'None')}
                    ${line('Branch Step:', d.branchStep || '—')}
                    ${line('Filament:', d.filamentStep || '—')}
                    ${line('Focus Target:', d.focusTarget || 'none')}
                    ${d.selectedCellRef !== '—' ? line('Cell:', `${d.selectedCellRef} = ${d.selectedCellValue || '—'}`) : ''}
                    ${d.focusHint ? line('Hint:', String(d.focusHint)) : ''}
                </div>`;
            this.hudElement.innerHTML = `
                <div style="font-size:10px; line-height:1.5;">${tier1HTML}</div>
                <div id="hud-tier2" class="hud-tier2${tier2Open ? '' : ' collapsed'}">${tier2Content}</div>
                <div style="margin-top:4px; display:flex; justify-content:space-between; align-items:center;">
                    <span id="hudResetView" style="font-size:8px; color:#5a7a9a; cursor:pointer; user-select:none;">Reset view</span>
                    <span id="hudTier2Toggle" style="font-size:8px; color:#5a6a85; cursor:pointer; user-select:none;">${tier2Open ? '▲ hide diagnostics' : '▼ diagnostics (H)'}</span>
                </div>`;

            // HUD-CONSOLIDATION-1: proof logs (once per boot / first launch render)
            const rootCount = document.querySelectorAll('#hud').length;
            const tier1Rows = this.hudElement.querySelectorAll('.tier1-row').length;
            if (!this._consolidatedLogEmitted) {
                this._consolidatedLogEmitted = true;
                RelayLog.info(`[HUD] consolidated rootCount=${rootCount} duplicates=0`);
            }
            if (!this._tier1RowsLogEmitted) {
                this._tier1RowsLogEmitted = true;
                RelayLog.info(`[HUD] tier1 rows=${tier1Rows}`);
            }
            if (!this._tier2DefaultLogEmitted && !tier2Open) {
                this._tier2DefaultLogEmitted = true;
                RelayLog.info(`[HUD] tier2 default=collapsed`);
            }

            // Wire tier 2 toggle (click → reason=click)
            const tier2Toggle = this.hudElement.querySelector('#hudTier2Toggle');
            if (tier2Toggle) {
                tier2Toggle.addEventListener('click', () => this.toggleTier2('click'));
            }
            // Wire "Reset view" button — calls deterministic launch camera frame
            const resetView = this.hudElement.querySelector('#hudResetView');
            if (resetView) {
                resetView.addEventListener('click', () => {
                    if (typeof window._launchResetCameraFrame === 'function') {
                        window._launchResetCameraFrame();
                    }
                });
            }
            // Wire imagery selector
            if (this.onImageryModeChange) {
                const imagerySelect = this.hudElement.querySelector('#hudImageryMode');
                if (imagerySelect) {
                    imagerySelect.addEventListener('change', () => this.onImageryModeChange(imagerySelect.value));
                }
            }
            const modeKey = String(d.operationMode || 'FreeFly');
            const logKey = `${modeKey}`;
            if (this.lastModeLogKey !== logKey) {
                this.lastModeLogKey = logKey;
                RelayLog.info(`[HUD] mode=${modeKey}`);
            }
            return;
        }

        // ═══ DEV MODE: Full Adaptive HUD (unchanged) ═══════════════════
        const boundariesLabel = d.boundaryStatus === 'ACTIVE'
            ? '<span style="color:#7adf8a;">ACTIVE</span>'
            : d.boundaryStatus === 'DEGRADED'
                ? '<span style="color:#ffb74d;">DEGRADED</span>'
                : '<span style="color:#aaa;">UNKNOWN</span>';
        const boundarySummaryLine = d.boundaryStatus === 'DEGRADED' && Number(d.boundaryMissing || 0) > 0
            ? line('Boundaries:', `DEGRADED (missing ${Number(d.boundaryMissing)})`)
            : line('Boundaries:', boundariesLabel);
        const detailSummaryLine = d.detailCollapsedAt
            ? line('Detail:', `Collapsed at ${d.detailCollapsedAt}`)
            : '';
        const focusHintLine = d.focusHint
            ? line('Hint:', String(d.focusHint))
            : '';
        const layer1Map = {
            company: String(d.activeCompany || 'Global'),
            basin: String(d.basin || 'None'),
            mode: String(d.operationMode || 'FreeFly'),
            importStatus: `<span style="color:${importColor};">${d.importStatus || 'OK'}</span>`,
            lod: String(d.lod || 'UNKNOWN'),
            policyRef: `${d.policyRef || 'local:HUD-PARAMS-v0'} (${d.paramsVersion || 'HUD-PARAMS-v0'})`
        };
        const layer1Fields = Array.isArray(this.policy.layer1Fields) ? this.policy.layer1Fields : [];
        const renderLayer1 = layer1Fields
            .map((key) => line(`${this.policy.labels[key] || key}:`, layer1Map[key] ?? '—'))
            .join('');

        const modeKey = String(d.operationMode || 'freeFly');
        const modeMap = {
            FreeFly: 'freeFly',
            BranchWalk: 'branchWalk',
            FilamentRide: 'filamentRide',
            Focus: 'focus',
            SheetEdit: 'sheetEdit'
        };
        const resolvedModeKey = modeMap[modeKey] || 'freeFly';
        let layer2Fields = this.policy.modeFields[resolvedModeKey] || [];
        if (d.selectedCellRef && d.selectedCellRef !== '—' && resolvedModeKey !== 'branchWalk' && resolvedModeKey !== 'filamentRide' && resolvedModeKey !== 'focus') {
            const selectedModeFields = this.policy.modeFields.cellSelected || [];
            layer2Fields = [...layer2Fields, ...selectedModeFields];
        }
        layer2Fields = [...new Set(layer2Fields)];
        const layer2Map = {
            branchStep: `branch=${d.activeBranch || 'n/a'} step=${d.branchStep || '—'}`,
            filamentStep: `filament=${d.filamentStep || '—'}`,
            focusTarget: `target=${d.focusTarget || 'none'} restore=${d.focusRestore || 'n/a'}`,
            cellContext: `cell=${d.selectedCellRef || '—'} value=${d.selectedCellValue || '—'} formula=${d.selectedCellFormula || '—'} state=${d.selectedCellFormulaState || 'DETERMINATE'}`
        };
        const renderLayer2 = layer2Fields
            .map((key) => line(`${key}:`, layer2Map[key] ?? '—'))
            .join('');
        const inspectorButton = this.policy.toggles.showInspectorButton
            ? `<button id="hudInspectorToggle" style="font-size:${compact ? '8.5pt' : '9pt'}; padding:2px 6px; margin-left:6px; background:#111; color:#f3c86e; border:1px solid #333; border-radius:4px; cursor:pointer;">Inspector</button>`
            : '';
        const controlsHTML = `
            <div style="${sectionStyle}">
                <div style="color:#888; margin-bottom:3px;">Layer 1</div>
                ${renderLayer1}
            </div>
            <div style="${sectionStyle}">
                <div style="color:#888; margin-bottom:3px;">Layer 2</div>
                ${renderLayer2 || '<div style="color:#6272a4;">context idle</div>'}
            </div>
            <div style="${sectionStyle}">
                <div style="margin-bottom:4px;">Preset keys: 1 2 3 4 5 | Alt+M imagery</div>
                <label style="display:block; margin-bottom:4px; color:#ddd;">
                    Imagery:
                    <select id="hudImageryMode" style="margin-left:6px; background:#111; color:#ddd; border:1px solid #333; font-size:8.5pt;">
                        <option value="osm" ${String(d.imageryMode).toLowerCase() === 'osm' ? 'selected' : ''}>OSM</option>
                        <option value="satellite" ${String(d.imageryMode).toLowerCase() === 'satellite' ? 'selected' : ''}>Satellite</option>
                    </select>
                    ${inspectorButton}
                </label>
                ${this.policy.toggles.showDebugToggles ? `
                <label style="color:#ddd; cursor:pointer;">
                    <input id="hudDebugLogs" type="checkbox" ${d.debugLogs ? 'checked' : ''} style="margin-right:6px;">
                    Debug Logs
                </label>` : ''}
                <label style="color:#90e0ff; cursor:pointer; display:block; margin-top:4px;">
                    <input id="hudFacingSheets" type="checkbox" ${d.facingSheets ? 'checked' : ''} style="margin-right:6px;">
                    Facing Sheets: ${d.facingSheets ? 'ON (Projection)' : 'OFF'}
                </label>
            </div>
        `;

        this.hudElement.innerHTML = `
            <div style="${sectionStyle}; border-top:none; margin-top:0; padding-top:0;">
                <div style="color:#888; margin-bottom:3px;">Adaptive HUD</div>
                ${boundarySummaryLine}
                ${detailSummaryLine}
                ${focusHintLine}
            </div>
            ${controlsHTML}
            <div style="margin-top: 8px;">
                <button id="hudEditSheetMode" style="font-size:${compact ? '8.5pt' : '9pt'}; padding:2px 6px; background:#111; color:#88c0ff; border:1px solid #333; border-radius:4px; cursor:pointer;">
                    ${d.editSheetMode ? 'Exit Edit Sheet' : 'Edit Sheet'}
                </button>
            </div>
        `;

        const logKey = `${modeKey}`;
        if (this.lastModeLogKey !== logKey) {
            this.lastModeLogKey = logKey;
            RelayLog.info(`[HUD] mode=${modeKey} layer1=${layer1Fields.length} layer2=${layer2Fields.length}`);
        }

        if (this.onLensToggle) {
            this.hudElement.querySelectorAll('button[data-lens]').forEach((button) => {
                button.addEventListener('click', () => {
                    const lens = button.getAttribute('data-lens');
                    const enabled = !this.lenses[lens];
                    this.onLensToggle(lens, enabled);
                });
            });
        }

        if (this.onImageryModeChange) {
            const imagerySelect = this.hudElement.querySelector('#hudImageryMode');
            if (imagerySelect) {
                imagerySelect.addEventListener('change', () => this.onImageryModeChange(imagerySelect.value));
            }
        }

        if (this.onDebugLogsToggle) {
            const debugToggle = this.hudElement.querySelector('#hudDebugLogs');
            if (debugToggle) {
                debugToggle.addEventListener('change', () => this.onDebugLogsToggle(debugToggle.checked));
            }
        }

        if (this.onInspectorToggle) {
            const inspectorButtonEl = this.hudElement.querySelector('#hudInspectorToggle');
            if (inspectorButtonEl) {
                inspectorButtonEl.addEventListener('click', () => this.onInspectorToggle());
            }
        }

        // PROJ-SHEET-FACING-1: Facing sheets toggle
        if (this.onFacingSheetsToggle) {
            const facingToggle = this.hudElement.querySelector('#hudFacingSheets');
            if (facingToggle) {
                facingToggle.addEventListener('change', () => this.onFacingSheetsToggle(facingToggle.checked));
            }
        }

        if (this.onEditSheetModeToggle) {
            const editButton = this.hudElement.querySelector('#hudEditSheetMode');
            if (editButton) {
                editButton.addEventListener('click', () => {
                    this.onEditSheetModeToggle();
                });
            }
        }
    }
    
    /**
     * Hide HUD
     */
    hide() {
        if (this.hudElement) {
            this.hudElement.style.display = 'none';
        }
    }
    
    /**
     * Show HUD
     */
    show() {
        if (this.hudElement) {
            this.hudElement.style.display = 'block';
        }
    }
    
    /**
     * Toggle HUD visibility
     */
    toggle() {
        if (this.hudElement) {
            const isVisible = this.hudElement.style.display !== 'none';
            isVisible ? this.hide() : this.show();
        }
    }
}
