/**
 * CESIUM VIEWER INITIALIZATION
 * Creates and configures the Cesium viewer with terrain, imagery, and buildings
 */

import { RelayLog } from '../../core/utils/relay-log.js';
import { importOwnerBuildings } from './building-importer.js';

/**
 * Initialize Cesium viewer with standard Relay configuration
 * @param {string} containerId - DOM element ID for Cesium container
 * @param {Object} options - Configuration options
 * @returns {Promise<Cesium.Viewer>} Configured Cesium viewer
 */
export async function initializeCesiumViewer(containerId = 'cesiumContainer', options = {}) {
    RelayLog.info('🌍 Initializing Cesium Viewer...');
    
    // Disable Ion (use free providers like v93)
    Cesium.Ion.defaultAccessToken = undefined;
    
    try {
        // Use free terrain provider (no Ion required)
        const terrainProvider = new Cesium.EllipsoidTerrainProvider();
        RelayLog.info('✅ Terrain provider created (Ellipsoid)');
        
        // Use OpenStreetMap imagery (free, no Ion required)
        // Note: May take a few seconds to load tiles
        const imageryProvider = new Cesium.OpenStreetMapImageryProvider({
            url: 'https://tile.openstreetmap.org/',
            maximumLevel: 19
        });
        RelayLog.info('✅ Imagery provider created (OpenStreetMap tiles loading...)');
        
        // Create viewer
        const viewer = new Cesium.Viewer(containerId, {
            terrainProvider,
            imageryProvider,
            
            // UI elements (minimal for clean interface)
            baseLayerPicker: false,
            geocoder: false,
            homeButton: true,
            sceneModePicker: false,
            navigationHelpButton: false,
            animation: false,
            timeline: false,
            fullscreenButton: false,
            vrButton: false,
            infoBox: false,
            selectionIndicator: false,
            
            // Performance
            requestRenderMode: false,  // Always render (smooth interaction)
            maximumRenderTimeChange: Infinity,
            
            // Scene configuration
            scene3DOnly: true,
            orderIndependentTranslucency: false,
            contextOptions: {
                webgl: {
                    alpha: false,
                    depth: true,
                    stencil: false,
                    antialias: true,
                    powerPreference: 'high-performance'
                }
            }
        });
        RelayLog.info('✅ Viewer created');
        
        // Configure scene
        viewer.scene.globe.depthTestAgainstTerrain = true;
        viewer.scene.globe.enableLighting = options.lighting ?? true;
        
        // Configure fog
        viewer.scene.fog.enabled = options.fog ?? true;
        viewer.scene.fog.density = options.fogDensity || 0.0002;
        viewer.scene.fog.screenSpaceErrorFactor = 2.0;
        
        // Configure sun
        if (options.sunPosition) {
            viewer.clock.currentTime = Cesium.JulianDate.fromIso8601(options.sunPosition);
        }
        
        // Building layer is optional and never part of anchor/tree truth.
        // Start as DEGRADED and resolve asynchronously so boot/gates are never blocked.
        if (window.setBuildingsStatus) {
            window.setBuildingsStatus('DEGRADED');
        }
        window.__relayBuildingsSummary = {
            source: 'NONE',
            loaded: false,
            imported: { requested: 0, loaded: 0, failed: 0, skipped: 0 }
        };
        
        // Fly to initial position
        const initialPosition = options.initialPosition || {
            lon: 34.7818,
            lat: 32.0853,
            height: 15000,
            heading: 0.0,
            pitch: -45,
            roll: 0.0
        };
        
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                initialPosition.lon, 
                initialPosition.lat, 
                initialPosition.height
            ),
            orientation: {
                heading: Cesium.Math.toRadians(initialPosition.heading),
                pitch: Cesium.Math.toRadians(initialPosition.pitch),
                roll: Cesium.Math.toRadians(initialPosition.roll)
            },
            duration: options.flyDuration || 3.0
        });

        const loadBuildingsAsync = async () => {
            let buildingsLoaded = false;
            let buildingSource = 'NONE';
            let importedSummary = { requested: 0, loaded: 0, failed: 0, skipped: 0 };
            const hasImportedBuildings = Array.isArray(options.importedBuildings) && options.importedBuildings.length > 0;
            const buildingPolicy = {
                ...(options.buildingPolicy || {}),
                currentLOD: (options.buildingPolicy && options.buildingPolicy.currentLOD)
                    || window?.RELAY_CURRENT_LOD
                    || window?.RELAY_BUILDING_LOD_CONTEXT
                    || window?.RELAY_LOCK_LOD
                    || 'UNKNOWN'
            };

            if (options.buildings !== false && hasImportedBuildings) {
                importedSummary = await importOwnerBuildings(
                    viewer,
                    options.importedBuildings,
                    options.ownerPreferredModels || {},
                    buildingPolicy
                );
                if (importedSummary.loaded > 0) {
                    buildingsLoaded = true;
                    buildingSource = 'OWNER_MODELS';
                } else {
                    RelayLog.warn('⚠️ Owner model imports did not load any buildings');
                }
            }

            // Add OSM buildings only when Ion is configured (avoid noisy 401s by default)
            // Default behavior: if explicit owner imports were provided, OSM is skipped unless forced.
            const ionToken = (window?.CESIUM_ION_TOKEN || '').trim();
            const canUseIonBuildings = ionToken.length > 0;
            const shouldUseOsmBuildings = (
                options.buildings !== false &&
                (!hasImportedBuildings || options.enableOsmFallback === true)
            );
            if (canUseIonBuildings) {
                Cesium.Ion.defaultAccessToken = ionToken;
            }
            if (shouldUseOsmBuildings && canUseIonBuildings) {
                try {
                    const osmBuildings = await Cesium.createOsmBuildingsAsync();
                    viewer.scene.primitives.add(osmBuildings);
                    RelayLog.info('✅ 3D Buildings added');
                    buildingsLoaded = true;
                    if (buildingSource === 'NONE') {
                        buildingSource = 'OSM_ION';
                    }
                } catch (error) {
                    RelayLog.warn('⚠️ 3D Buildings unavailable (Ion 401 or network issue)');
                    RelayLog.warn('⚠️ Buildings marked as DEGRADED');
                }
            } else if (shouldUseOsmBuildings && !canUseIonBuildings) {
                RelayLog.info('ℹ️ 3D Buildings skipped (no Cesium Ion token configured)');
                RelayLog.warn('⚠️ Buildings marked as DEGRADED');
            }

            if (window.setBuildingsStatus) {
                window.setBuildingsStatus(buildingsLoaded ? 'OK' : 'DEGRADED');
            }
            window.__relayBuildingsSummary = {
                source: buildingSource,
                loaded: buildingsLoaded,
                imported: importedSummary
            };
        };
        loadBuildingsAsync().catch((error) => {
            RelayLog.warn(`⚠️ Buildings async load failed: ${error?.message || error}`);
            if (window.setBuildingsStatus) {
                window.setBuildingsStatus('DEGRADED');
            }
        });
        
        RelayLog.info('🌍 Cesium Viewer initialized successfully');
        return viewer;
        
    } catch (error) {
        RelayLog.error('❌ Failed to initialize Cesium Viewer:', error);
        throw error;
    }
}

/**
 * Get camera height above ground/ellipsoid
 * @param {Cesium.Viewer} viewer
 * @returns {number} Height in meters
 */
export function getCameraHeightAboveGround(viewer) {
    const cartographic = viewer.camera.positionCartographic;
    return cartographic.height;
}

/**
 * Focus camera on position
 * @param {Cesium.Viewer} viewer
 * @param {Object} position - { lon, lat, height, duration }
 */
export function focusCameraOn(viewer, position) {
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
            position.lon,
            position.lat,
            position.height || 5000
        ),
        duration: position.duration || 2.0
    });
}
