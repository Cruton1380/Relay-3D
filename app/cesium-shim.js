/**
 * Cesium CDN-to-Local Shim
 * Imports the local npm cesium package and assigns it to window.Cesium
 * so all existing code that references the Cesium global continues to work.
 */
import * as CesiumModule from '../node_modules/cesium/Build/Cesium/index.js';

window.Cesium = CesiumModule;

window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium/';
