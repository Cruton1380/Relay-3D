/**
 * ENU (East-North-Up) Coordinate System Utilities
 * 
 * All tree geometry must be defined in local ENU meters, not degree offsets.
 * This ensures accurate scaling independent of latitude and provides correct
 * orientation regardless of location on the globe.
 * 
 * Coordinate System:
 * - East: +X (treeOut direction)
 * - North: +Y (treeSide direction)
 * - Up: +Z (trunk growth direction, along local vertical)
 */

/**
 * Create an ENU (East-North-Up) reference frame at a geographic anchor point
 * @param {number} anchorLon - Longitude in degrees
 * @param {number} anchorLat - Latitude in degrees
 * @param {number} anchorAlt - Altitude in meters
 * @returns {Cesium.Matrix4} ENU transformation matrix
 */
export function createENUFrame(anchorLon, anchorLat, anchorAlt) {
    const anchorPos = Cesium.Cartesian3.fromDegrees(anchorLon, anchorLat, anchorAlt);
    return Cesium.Transforms.eastNorthUpToFixedFrame(anchorPos);
}

/**
 * Convert ENU local coordinates (meters) to world Cartesian3 position
 * @param {Cesium.Matrix4} enuFrame - ENU transformation matrix from createENUFrame
 * @param {number} eastMeters - Distance in meters along East axis (+X)
 * @param {number} northMeters - Distance in meters along North axis (+Y)
 * @param {number} upMeters - Distance in meters along Up axis (+Z)
 * @returns {Cesium.Cartesian3} World position
 */
export function enuToWorld(enuFrame, eastMeters, northMeters, upMeters) {
    const localOffset = new Cesium.Cartesian3(eastMeters, northMeters, upMeters);
    return Cesium.Matrix4.multiplyByPoint(enuFrame, localOffset, new Cesium.Cartesian3());
}

/**
 * Convert world Cartesian3 position to ENU local coordinates (meters)
 * @param {Cesium.Matrix4} enuFrame - ENU transformation matrix from createENUFrame
 * @param {Cesium.Cartesian3} worldPos - World position
 * @returns {Object} {east, north, up} in meters
 */
export function worldToENU(enuFrame, worldPos) {
    const inverseFrame = Cesium.Matrix4.inverse(enuFrame, new Cesium.Matrix4());
    const localPos = Cesium.Matrix4.multiplyByPoint(inverseFrame, worldPos, new Cesium.Cartesian3());
    return {
        east: localPos.x,
        north: localPos.y,
        up: localPos.z
    };
}

/**
 * Validate that coordinates are finite numbers (NaN guard)
 * @param {number} east - East coordinate in meters
 * @param {number} north - North coordinate in meters
 * @param {number} up - Up coordinate in meters
 * @returns {boolean} True if all coordinates are finite
 */
export function validateENUCoordinates(east, north, up) {
    return Number.isFinite(east) && Number.isFinite(north) && Number.isFinite(up);
}

/**
 * Validate that a Cartesian3 position is finite (NaN guard)
 * @param {Cesium.Cartesian3} position - Position to validate
 * @returns {boolean} True if all components are finite
 */
export function isCartesian3Finite(position) {
    if (!position) return false;
    return Number.isFinite(position.x) && 
           Number.isFinite(position.y) && 
           Number.isFinite(position.z);
}

/**
 * Create a circular cross-section profile for PolylineVolumeGeometry
 * @param {number} radius - Radius in meters
 * @param {number} segments - Number of segments (higher = smoother)
 * @returns {Array<Cesium.Cartesian2>} Circle profile points
 */
export function createCircleProfile(radius, segments = 16) {
    const profile = [];
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        profile.push(new Cesium.Cartesian2(
            radius * Math.cos(angle),
            radius * Math.sin(angle)
        ));
    }
    return profile;
}

/**
 * =================================================================
 * BRANCH FRAME COMPUTATION (Tangent-Normal-Binormal)
 * Robust for curved branches using parallel transport
 * =================================================================
 */

/**
 * Compute tangent at point i using central difference
 * @param {Array<{east, north, up}>} points - Array of ENU points
 * @param {number} i - Index of point
 * @returns {{east, north, up}} Normalized tangent vector
 */
export function tangentAt(points, i) {
    const i0 = Math.max(0, i - 1);
    const i1 = Math.min(points.length - 1, i + 1);
    const dx = points[i1].east - points[i0].east;
    const dy = points[i1].north - points[i0].north;
    const dz = points[i1].up - points[i0].up;
    const len = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
    return { east: dx/len, north: dy/len, up: dz/len };
}

/**
 * Project vector v onto plane orthogonal to normal n
 * @param {{east, north, up}} v - Vector to project
 * @param {{east, north, up}} n - Plane normal
 * @returns {{east, north, up}} Projected vector
 */
export function projectOntoPlane(v, n) {
    // v - n*(v·n)
    const dot = v.east*n.east + v.north*n.north + v.up*n.up;
    return {
        east: v.east - n.east * dot,
        north: v.north - n.north * dot,
        up: v.up - n.up * dot
    };
}

/**
 * Normalize ENU vector
 * @param {{east, north, up}} v - Vector to normalize
 * @returns {{east, north, up}} Normalized vector
 */
export function normalizeVec(v) {
    const len = Math.sqrt(v.east**2 + v.north**2 + v.up**2) || 1;
    return { east: v.east/len, north: v.north/len, up: v.up/len };
}

/**
 * Cross product of two ENU vectors
 * @param {{east, north, up}} a - First vector
 * @param {{east, north, up}} b - Second vector
 * @returns {{east, north, up}} Cross product a × b
 */
export function cross(a, b) {
    return {
        east: a.north * b.up - a.up * b.north,
        north: a.up * b.east - a.east * b.up,
        up: a.east * b.north - a.north * b.east
    };
}

/**
 * Negate ENU vector
 * @param {{east, north, up}} v - Vector to negate
 * @returns {{east, north, up}} Negated vector
 */
export function negateVec(v) {
    return { east: -v.east, north: -v.north, up: -v.up };
}

/**
 * Compute {T, N, B} frames at each point along branch curve
 * Uses parallel transport to avoid frame twist
 * 
 * @param {Array<{east, north, up}>} points - Branch curve sampled in ENU
 * @returns {Array<{T, N, B}>} Frame at each point
 * 
 * T = tangent (branch direction)
 * N = normal (branch "up")
 * B = binormal (branch "right")
 */
export function computeBranchFrames(points) {
    if (points.length < 2) {
        throw new Error('Need at least 2 points to compute frames');
    }
    
    const frames = [];
    const enuUp = { east: 0, north: 0, up: 1 };
    
    // Initialize frame at start
    let Tprev = tangentAt(points, 0);
    let Nprev = normalizeVec(projectOntoPlane(enuUp, Tprev));
    let Bprev = normalizeVec(cross(Tprev, Nprev));
    
    frames.push({ T: Tprev, N: Nprev, B: Bprev });
    
    // Transport along curve
    for (let i = 1; i < points.length; i++) {
        const T = tangentAt(points, i);
        
        // Parallel transport: project previous N onto plane ⟂ T
        let N = normalizeVec(projectOntoPlane(Nprev, T));
        
        // Fallback if degenerate (Nprev ~ T)
        const nLen = Math.sqrt(N.east**2 + N.north**2 + N.up**2);
        if (nLen < 1e-4) {
            N = normalizeVec(projectOntoPlane(enuUp, T));
        }
        
        const B = normalizeVec(cross(T, N));
        
        frames.push({ T, N, B });
        
        Tprev = T;
        Nprev = N;
        Bprev = B;
    }
    
    return frames;
}

/**
 * Sample straight line segment in ENU
 * @param {{east, north, up}} start - Start point in ENU
 * @param {{east, north, up}} end - End point in ENU
 * @param {number} numSamples - Number of samples (default 50)
 * @returns {Array<{east, north, up}>} Sampled points
 */
export function sampleLineSegment(start, end, numSamples = 50) {
    const points = [];
    for (let i = 0; i < numSamples; i++) {
        const t = i / (numSamples - 1);
        points.push({
            east: start.east + t * (end.east - start.east),
            north: start.north + t * (end.north - start.north),
            up: start.up + t * (end.up - start.up)
        });
    }
    return points;
}

/**
 * Convert ENU vector to world-space direction (normalized)
 * @param {Cesium.Matrix4} enuFrame - ENU transformation matrix
 * @param {{east, north, up}} vENU - Vector in ENU coordinates
 * @returns {Cesium.Cartesian3} Normalized world direction
 */
export function enuVecToWorldDir(enuFrame, vENU) {
    const origin = enuToWorld(enuFrame, 0, 0, 0);
    const p = enuToWorld(enuFrame, vENU.east, vENU.north, vENU.up);
    const dir = Cesium.Cartesian3.subtract(p, origin, new Cesium.Cartesian3());
    return Cesium.Cartesian3.normalize(dir, dir);
}

/**
 * Canonical tree layout constants (all in meters, not degrees)
 */
export const CANONICAL_LAYOUT = {
    // Trunk
    trunk: {
        baseAlt: 0,           // Ground level (meters)
        topAlt: 2000,         // Trunk top height (meters)
        radius: 8,            // Trunk radius (meters) - increased for visibility
        segments: 2           // Simple vertical line
    },
    
    // Branches (horizontal ribs along +East)
    branch: {
        length: 800,              // meters along +East (treeOut)
        radiusThick: 12,          // meters (base radius, 24m diameter)
        radiusMedium: 8,          // meters (mid radius, 16m diameter)
        radiusThin: 5,            // meters (tip radius, 10m diameter)
        separationGap: 8,         // meters (safety gap between branches)
        heightOffset: 0,          // At trunk top (0 offset from trunk.topAlt)
        arcAmplitude: 150,        // meters (slight sag/rise for organic look)
        arcAsymmetry: 0.3,        // First 30% rises monotonically
        segments: 20              // Path segments for smooth arc
    },
    
    // Sheets (vertical planes perpendicular to branches)
    sheet: {
        // Clearance will be calculated dynamically based on sheet diagonal + branch width
        // clearanceAlongBranch: (sheetDiag * 0.65) + (branchWidth * 3)
        clearanceMultiplier: 0.65,    // multiplier for sheet diagonal
        branchWidthMultiplier: 3,     // multiplier for branch width
        width: 400,                   // meters (along branch binormal, "right" = col direction)
        height: 144,                  // meters (along branch normal, "up" = row direction)
        // Cell aspect ratio: (400/7) / (144/9) = 57.1/16.0 = 3.57:1 (2D Excel standard: 64px:20px = 3.2:1)
        depth: 30,                    // meters (thickness, for future 3D)
        cellRows: 8,
        cellCols: 6,
        outlineWidth: 3,
        opacity: 0.3
    },
    
    // Cells
    cell: {
        width: 57,            // meters (col spacing = sheetWidth/(cols+1) ≈ 400/7)
        height: 16,           // meters (row spacing = sheetHeight/(rows+1) ≈ 144/9)
        pointSize: 6,         // pixels
        labelOffset: 6,       // pixels above point (reduced for shorter rows)
        labelScale: 0.6,      // slightly smaller to fit narrow rows
        maxLabelDistance: 50000  // meters (LOD)
    },
    
    // Spine (staging conduit)
    spine: {
        offset: 50,           // meters below sheet center
        width: 3.0,           // line width (pixels)
        opacity: 0.8
    },
    
    // Cell-to-spine filaments
    cellFilament: {
        width: 1.0,           // line width (pixels)
        opacity: 0.6
    },
    
    // Timeboxes
    timebox: {
        // Trunk/branch ring properties (existing)
        minSpacing: 250,      // meters between timeboxes
        maxTimeboxes: 12,     // per limb segment
        radiusRatio: 0.75,    // Of parent limb radius
        thicknessBase: 12,    // meters
        thicknessPerCommit: 0.08,  // meters per 10 commits
        
        // NEW: Phase 3 - Cell timebox lane properties (behind sheet)
        // INVARIANT: each timebox segment length = cellSpacingX (derived at render time)
        cellToTimeGap: 3.0,      // meters behind cell before first segment starts
        segmentGap: null,        // DEPRECATED: now proportional (6% of segmentLength) — see filament-renderer
        cubeSize: 1.2,           // meters (debug marker cube edge length, kept for reference)
        laneThickness: 0.35,     // meters (lane filament width)
        laneGap: 0.8,            // meters (extra separation between lanes)
        spineDepthMultiplier: 1.2, // multiplier for spine depth calculation
        maxCellTimeboxes: 50,    // maximum timebox segments per cell lane
        // Derived at render time:
        // segmentLength = cellSpacingX (row height in meters)
        // totalFilamentLength = timeboxCount * (segmentLength + segmentGap)
        stepDepth: 4.0           // DEPRECATED: kept for backward compat, use segmentLength instead
    },
    
    // Root system (history continuation below ground)
    root: {
        depth: {
            CELL: 500,        // meters (at close LOD)
            SHEET: 500,
            COMPANY: 1000,    // meters (at company LOD)
            REGION: 2000,     // meters (at region LOD)
            PLANETARY: 5000   // meters (at planetary LOD)
        },
        width: 12.0,          // line width (thicker than trunk)
        opacity: 0.8,
        color: '#4a2511'      // Dark brown (history)
    }
};

// Log module loaded
console.log('[ENU] Coordinate system loaded - all geometry in meters');
