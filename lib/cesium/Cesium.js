/*
 * Cesium IIFE shim — loads the ESM index.js and exposes window.Cesium
 * This replaces the old CDN Cesium.js that is no longer available.
 */
(async () => {
    const mod = await import('./index.js');
    const cesium = {};
    for (const key of Object.keys(mod)) {
        cesium[key] = mod[key];
    }
    window.Cesium = cesium;
    window.CESIUM_BASE_URL = '/lib/cesium/';
    window.dispatchEvent(new Event('cesium-ready'));
})();
