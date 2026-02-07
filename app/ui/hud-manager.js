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
            cfStatus: 'INDETERMINATE'
        };
        this.lenses = {
            value: false,
            formula: false,
            cf: false,
            history: true
        };
        this.onLensToggle = null;
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
    
    /**
     * Render HUD to DOM
     */
    render() {
        if (!this.hudElement) return;
        
        const { lod, altitude, nodeCount, fps, boundaryStatus, buildings, filamentMode, formulaCycles, formulaScars, cfStatus } = this.data;
        
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
        
        this.hudElement.innerHTML = `
            <div>🔭 LOD: ${lod}</div>
            <div>📏 Alt: ${(altitude / 1000).toFixed(1)} km</div>
            <div>🌲 Nodes: ${nodeCount}</div>
            <div>⚡ FPS: ${fps}</div>
            ${capabilitiesHTML}
            ${lensHTML}
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
