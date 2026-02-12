/**
 * RELAY LOG SYSTEM
 * Core utility: renderer-agnostic logging with priority levels
 * NO CESIUM IMPORTS ALLOWED (Lock F)
 */

export const RelayLog = {
    _level: 2, // 0:silent, 1:error, 2:warn, 3:info, 4:debug
    _uiElement: null,
    _uiEnabled: true,
    _stressConsoleAllowPrefixes: ['D0', 'GATE', 'S1', 'LOD-BUDGET', 'L2', 'TOPOLOGY', 'POSTGATE'],
    
    setLevel(level) {
        this._level = level;
    },
    
    setUIElement(element) {
        this._uiElement = element;
    },

    setUIEnabled(enabled) {
        this._uiEnabled = enabled === true;
    },

    isUIEnabled() {
        return this._uiEnabled === true;
    },

    getLevel() {
        return this._level;
    },

    _isStressConsoleRestricted() {
        if (typeof window === 'undefined') return false;
        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? performance.now()
            : Date.now();
        return window.__relayStressModeActive === true
            || window.__relayDeferredRenderPending === true
            || Number(window.__relayPostGateQuietUntil || 0) > now;
    },

    _extractTag(args) {
        if (!Array.isArray(args) || args.length === 0) return null;
        const first = args[0];
        if (typeof first !== 'string') return null;
        if (/^[A-Z0-9_.-]{2,}$/.test(first)) {
            return first;
        }
        const match = first.match(/^\[([^\]]+)\]/);
        return match ? match[1] : null;
    },

    _isStressAllowedTag(tag) {
        if (!tag) return false;
        const upperTag = String(tag).toUpperCase();
        return this._stressConsoleAllowPrefixes.some(prefix => upperTag.startsWith(String(prefix).toUpperCase()));
    },
    
    _log(level, emoji, ...args) {
        if (level > this._level) return;
        // Optional structured category format: RelayLog.info('POSTGATE', 'message')
        if (args.length >= 2 && typeof args[0] === 'string' && /^[A-Z0-9_.-]{2,}$/.test(args[0])) {
            args = [`[${args[0]}]`, ...args.slice(1)];
        }
        if (level >= 3 && this._isStressConsoleRestricted()) {
            const tag = this._extractTag(args);
            if (!this._isStressAllowedTag(tag)) {
                return;
            }
        }
        
        const timestamp = new Date().toISOString().substring(11, 23);
        const prefix = `${timestamp} ${emoji}`;
        console.log(prefix, ...args);
        
        if (this._uiElement && this._uiEnabled) {
            const line = document.createElement('div');
            line.textContent = `${prefix} ${args.join(' ')}`;
            line.className = level === 1 ? 'log-error' : level === 2 ? 'log-warn' : 'log-info';
            this._uiElement.appendChild(line);
            
            // Keep last 100 lines
            while (this._uiElement.children.length > 100) {
                this._uiElement.removeChild(this._uiElement.firstChild);
            }
            
            // Auto-scroll
            this._uiElement.scrollTop = this._uiElement.scrollHeight;
        }
    },
    
    error(...args) { this._log(1, '❌', ...args); },
    warn(...args) { this._log(2, '⚠️', ...args); },
    info(...args) { this._log(3, 'ℹ️', ...args); },
    debug(...args) { this._log(4, '🔍', ...args); }
};
