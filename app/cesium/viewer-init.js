/**
 * CESIUM VIEWER INITIALIZATION
 * Creates and configures the Cesium viewer with terrain, imagery, and buildings
 */

import { RelayLog } from '../../core/utils/relay-log.js';
import { importOwnerBuildings } from './building-importer.js';
import { applyImageryMode } from './imagery-registry.js';

/**
 * Initialize Cesium viewer with standard Relay configuration
 * @param {string} containerId - DOM element ID for Cesium container
 * @param {Object} options - Configuration options
 * @returns {Promise<Cesium.Viewer>} Configured Cesium viewer
 */
export async function initializeCesiumViewer(containerId = 'cesiumContainer', options = {}) {
    RelayLog.info('🌍 Initializing Cesium Viewer...');
    const runtimeProfile = String(options.profile || 'proof').toLowerCase();
    
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

        // GLOBE-RESTORE-0: imagery registry is world-only.
        // Proof profile keeps current OSM-only boot behavior unchanged.
        if (runtimeProfile === 'world' && options.enableWorldImagery === true) {
            const mode = String(options.worldImageryMode || 'osm').trim() || 'osm';
            applyImageryMode(viewer, mode, { fallbackModeId: 'osm' });
        }
        
        // Configure scene
        viewer.scene.globe.depthTestAgainstTerrain = true;
        viewer.scene.globe.enableLighting = options.lighting ?? true;
        
        // Configure fog
        viewer.scene.fog.enabled = options.fog ?? true;
        viewer.scene.fog.density = options.fogDensity || 0.0002;
        viewer.scene.fog.screenSpaceErrorFactor = 2.0;
        
        // ═══ R4 PRESENTATION PIPELINE: Post-processing + atmosphere (launch-only) ═══
        const isLaunch = (typeof window !== 'undefined' && window.RELAY_LAUNCH_MODE === true);
        if (isLaunch) {
            // 1) FXAA anti-aliasing — smooths all primitive edges
            viewer.scene.postProcessStages.fxaa.enabled = true;
            
            // 2) Bloom — soft emissive glow on bright primitives (trunk/branch/tile borders)
            //    Tuned for "engineered tree" look: gentle halo, not aggressive blow-out
            const bloom = viewer.scene.postProcessStages.bloom;
            bloom.enabled = true;
            bloom.uniforms.glowOnly = false;
            bloom.uniforms.contrast = 119;       // moderate — avoids washing out pale elements
            bloom.uniforms.brightness = -0.2;     // darken non-bloom slightly → tree geometry pops
            bloom.uniforms.delta = 1.0;           // standard spread
            bloom.uniforms.sigma = 3.78;          // wider Gaussian → softer glow halo
            bloom.uniforms.stepSize = 1.0;
            
            // 3) Color correction — subtle cool tone map + vignette
            //    Gives the scene a calm "engineered" feel, de-emphasizes terrain noise
            try {
                const colorCorrectionStage = new Cesium.PostProcessStage({
                    fragmentShader: `
                        uniform sampler2D colorTexture;
                        in vec2 v_textureCoordinates;
                        void main() {
                            vec4 color = texture(colorTexture, v_textureCoordinates);
                            // Exposure lift — makes tree geometry slightly brighter
                            color.rgb *= 1.08;
                            // Cool tone shift — subtle blue push for "engineered" palette
                            color.r *= 0.95;
                            color.b = min(1.0, color.b * 1.06);
                            // Vignette — darken edges, draw eye to center
                            vec2 uv = v_textureCoordinates;
                            float dist = distance(uv, vec2(0.5));
                            float vignette = smoothstep(0.8, 0.25, dist);
                            color.rgb *= mix(0.75, 1.0, vignette);
                            out_FragColor = color;
                        }
                    `,
                    name: 'relayColorCorrection'
                });
                viewer.scene.postProcessStages.add(colorCorrectionStage);
                RelayLog.info('[PRES] colorCorrection added=PASS vignette=ON coolTone=ON');
            } catch (ccErr) {
                RelayLog.warn('[PRES] colorCorrection FAILED: ' + ccErr.message);
            }
            
            // 4) Fog — stronger atmospheric depth (city fades to abstraction, tree stays vivid)
            viewer.scene.fog.enabled = true;
            viewer.scene.fog.density = 0.00048;        // noticeable haze — terrain fades at distance
            viewer.scene.fog.screenSpaceErrorFactor = 5.0;
            
            // 5) Atmosphere — sky glow for cinematic depth
            viewer.scene.skyAtmosphere.show = true;
            viewer.scene.skyAtmosphere.hueShift = -0.03;           // cool sky
            viewer.scene.skyAtmosphere.saturationShift = -0.20;    // desaturated sky
            viewer.scene.skyAtmosphere.brightnessShift = 0.05;     // gentle brightness
            
            // 6) Globe: dark base so geometry reads against it clearly
            viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#121a2a');
            
            // 7) HDR — required for bloom to operate correctly
            viewer.scene.highDynamicRange = true;
            
            // R4 required proof logs
            RelayLog.info('[PRES] postFX enabled=PASS fxaa=ON bloom=ON colorCorrect=ON');
            RelayLog.info(`[PRES] fog enabled=PASS density=0.00048`);
        }
        
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
