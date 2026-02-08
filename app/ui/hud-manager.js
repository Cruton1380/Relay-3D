/**
 * HUD (Heads-Up Display) MANAGER
 * Manages on-screen information display
 */

export class HUDManager {
    constructor(hudElementId = 'hud') {
        this.hudElement = document.getElementById(hudElementId);
        this.data = {
            lod: 'UNKNOWN',
            altitude: 0,
            nodeCount: 0,
            fps: 0,
            boundaryStatus: 'LOADING',
            buildings: 'UNKNOWN',
            filamentMode: 'ENTITY',  // ENTITY or PRIMITIVE
            formulaCycles: 0,
            formulaScars: 0,
            cfStatus: 'INDETERMINATE',
            importStatus: 'OK',
            debugRangeOps: false,
            debugSpineGuide: false,
            showCellMarkersAtCompany: false,
            showActiveMarkers: true,
            activeMarkerMode: 'auto',
            editSheetMode: false
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
    
    /**
     * Render HUD to DOM
     */
    render() {
        if (!this.hudElement) return;
        
        const { lod, altitude, nodeCount, fps, boundaryStatus, buildings, filamentMode, formulaCycles, formulaScars, cfStatus, importStatus, debugRangeOps, debugSpineGuide, showCellMarkersAtCompany, showActiveMarkers, activeMarkerMode, editSheetMode } = this.data;
        
        // Capability status section
        let capabilitiesHTML = '<div style="margin-top: 10px; border-top: 1px solid #444; padding-top: 5px; font-size: 9pt;">';
        capabilitiesHTML += '<div style="color: #888; margin-bottom: 3px;">Capabilities:</div>';
        
        // Buildings status
        if (buildings === 'OK') {
            capabilitiesHTML += '<div style="color: #4caf50;">🏢 Buildings: ✅</div>';
        } else if (buildings === 'DEGRADED') {
            capabilitiesHTML += '<div style="color: #ff9800;">🏢 Buildings: ⚠️ DEGRADED</div>';
        } else {
            capabilitiesHTML += '<div style="color: #666;">🏢 Buildings: ?</div>';
        }
        
        // Boundaries status
        if (boundaryStatus === 'ACTIVE') {
            capabilitiesHTML += '<div style="color: #4caf50;">🗺️ Boundaries: ✅</div>';
        } else if (boundaryStatus === 'DEGRADED') {
            capabilitiesHTML += '<div style="color: #ff9800;">🗺️ Boundaries: ⚠️ DEGRADED</div>';
        } else if (boundaryStatus === 'DISABLED') {
            capabilitiesHTML += '<div style="color: #666;">🗺️ Boundaries: 🚫 DISABLED</div>';
        } else {
            capabilitiesHTML += '<div style="color: #888;">🗺️ Boundaries: ⏳</div>';
        }
        
        // Filament mode status
        if (filamentMode === 'PRIMITIVE') {
            capabilitiesHTML += '<div style="color: #4caf50;">🌲 Filaments: PRIMITIVE</div>';
        } else {
            capabilitiesHTML += '<div style="color: #ff9800;">🌲 Filaments: ⚠️ ENTITY MODE</div>';
        }

        const importColor = importStatus === 'INDETERMINATE' ? '#ff9800' : '#888';
        capabilitiesHTML += `<div style="color: ${importColor};">📥 Import: ${importStatus}</div>`;
        
        capabilitiesHTML += '</div>';

        // Lens toggles
        const lensButton = (id, label) => {
            const on = this.lenses[id];
            const color = on ? '#4caf50' : '#888';
            return `<button data-lens="${id}" style="margin:2px 4px 2px 0; font-size:9pt; padding:2px 6px; background:#111; color:${color}; border:1px solid #333; border-radius:4px; cursor:pointer;">${label}: ${on ? 'ON' : 'OFF'}</button>`;
        };
        let lensHTML = '<div style="margin-top: 8px; border-top: 1px solid #444; padding-top: 5px; font-size: 9pt;">';
        lensHTML += '<div style="color: #888; margin-bottom: 3px;">Lenses:</div>';
        lensHTML += lensButton('value', 'Value');
        lensHTML += lensButton('formula', 'Formula');
        lensHTML += lensButton('cf', 'CF');
        lensHTML += lensButton('history', 'History');
        lensHTML += `<div style="color:#888;">Formula cycles: ${formulaCycles} | Scars: ${formulaScars}</div>`;
        lensHTML += `<div style="color:#888;">CF: ${cfStatus}</div>`;
        lensHTML += '</div>';

        const debugHTML = `
            <div style="margin-top: 8px; border-top: 1px solid #444; padding-top: 5px; font-size: 9pt;">
                <label style="color:#888; cursor:pointer;">
                    <input id="hudDebugRangeOps" type="checkbox" ${debugRangeOps ? 'checked' : ''} style="margin-right:6px;">
                    Debug Range Ops
                </label>
                <br/>
                <label style="color:#888; cursor:pointer;">
                    <input id="hudDebugSpineGuide" type="checkbox" ${debugSpineGuide ? 'checked' : ''} style="margin-right:6px;">
                    Spine Guide
                </label>
                <br/>
                <label style="color:#888; cursor:pointer;">
                    <input id="hudCompanyMarkers" type="checkbox" ${showCellMarkersAtCompany ? 'checked' : ''} style="margin-right:6px;">
                    Show cell markers at COMPANY
                </label>
                <br/>
                <label style="color:#888; cursor:pointer;">
                    <input id="hudActiveMarkers" type="checkbox" ${showActiveMarkers ? 'checked' : ''} style="margin-right:6px;">
                    Show presence markers
                </label>
                <div style="margin-top:4px;">
                    <select id="hudActiveMarkerMode" style="background:#111; color:#888; border:1px solid #333; font-size:8pt;">
                        <option value="auto" ${activeMarkerMode === 'auto' ? 'selected' : ''}>Presence mode: auto</option>
                        <option value="nonEmpty" ${activeMarkerMode === 'nonEmpty' ? 'selected' : ''}>Presence mode: nonEmpty</option>
                        <option value="selectedRecent" ${activeMarkerMode === 'selectedRecent' ? 'selected' : ''}>Presence mode: selected+recent</option>
                        <option value="formulasOnly" ${activeMarkerMode === 'formulasOnly' ? 'selected' : ''}>Presence mode: formulasOnly</option>
                    </select>
                </div>
                <div style="color:#666; font-size:8pt; margin-top:4px;">Paste limit: 5,000 cells/op (configurable)</div>
            </div>
        `;

        const editHTML = `
            <div style="margin-top: 8px; border-top: 1px solid #444; padding-top: 5px;">
                <button id="hudEditSheetMode" style="font-size:9pt; padding:2px 6px; background:#111; color:#88c0ff; border:1px solid #333; border-radius:4px; cursor:pointer;">
                    ${editSheetMode ? 'Exit Edit Sheet' : 'Edit Sheet'}
                </button>
            </div>
        `;

        const legendHTML = `
            <div style="margin-top: 8px; border-top: 1px solid #444; padding-top: 5px; font-size: 8pt; color:#888;">
                <div>Legend:</div>
                <div>Surface (sheet)</div>
                <div>Cells</div>
                <div>Stage 1 lanes</div>
                <div>Spine</div>
                <div>Stage 2 conduit</div>
                <div>Timeboxes (history)</div>
            </div>
        `;
        const proofHTML = (showActiveMarkers || editSheetMode)
            ? `<div style="margin-top: 6px; font-size: 8pt; color:#666;">Proof: capture presence/edit logs</div>`
            : '';
        
        this.hudElement.innerHTML = `
            <div>🔭 LOD: ${lod}</div>
            <div>📏 Alt: ${(altitude / 1000).toFixed(1)} km</div>
            <div>🌲 Nodes: ${nodeCount}</div>
            <div>⚡ FPS: ${fps}</div>
            ${capabilitiesHTML}
            ${lensHTML}
            ${debugHTML}
            ${legendHTML}
            ${editHTML}
            ${proofHTML}
        `;

        if (this.onLensToggle) {
            this.hudElement.querySelectorAll('button[data-lens]').forEach((button) => {
                button.addEventListener('click', () => {
                    const lens = button.getAttribute('data-lens');
                    const enabled = !this.lenses[lens];
                    this.onLensToggle(lens, enabled);
                });
            });
        }

        if (this.onDebugRangeToggle) {
            const debugToggle = this.hudElement.querySelector('#hudDebugRangeOps');
            if (debugToggle) {
                debugToggle.addEventListener('change', () => {
                    this.onDebugRangeToggle(debugToggle.checked);
                });
            }
        }

        if (this.onDebugSpineGuideToggle) {
            const spineToggle = this.hudElement.querySelector('#hudDebugSpineGuide');
            if (spineToggle) {
                spineToggle.addEventListener('change', () => {
                    this.onDebugSpineGuideToggle(spineToggle.checked);
                });
            }
        }

        if (this.onCompanyMarkersToggle) {
            const markerToggle = this.hudElement.querySelector('#hudCompanyMarkers');
            if (markerToggle) {
                markerToggle.addEventListener('change', () => {
                    this.onCompanyMarkersToggle(markerToggle.checked);
                });
            }
        }

        if (this.onActiveMarkersToggle) {
            const activeToggle = this.hudElement.querySelector('#hudActiveMarkers');
            if (activeToggle) {
                activeToggle.addEventListener('change', () => {
                    this.onActiveMarkersToggle(activeToggle.checked);
                });
            }
        }

        if (this.onActiveMarkerModeChange) {
            const modeSelect = this.hudElement.querySelector('#hudActiveMarkerMode');
            if (modeSelect) {
                modeSelect.addEventListener('change', () => {
                    this.onActiveMarkerModeChange(modeSelect.value);
                });
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
