/**
 * RELAY LOG SYSTEM
 * Core utility: renderer-agnostic logging with priority levels
 * NO CESIUM IMPORTS ALLOWED (Lock F)
 */

export const RelayLog = {
    _level: 2, // 0:silent, 1:error, 2:warn, 3:info, 4:debug
    _uiElement: null,
    
    setLevel(level) {
        this._level = level;
    },
    
    setUIElement(element) {
        this._uiElement = element;
    },
    
    _log(level, emoji, ...args) {
        if (level > this._level) return;
        
        const timestamp = new Date().toISOString().substring(11, 23);
        const prefix = `${timestamp} ${emoji}`;
        console.log(prefix, ...args);
        
        if (this._uiElement) {
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
