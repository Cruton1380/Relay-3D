# Earth Texture Setup (Optional Enhancement)

## Current State

Globe renders as:
- **On file://**: Ocean blue-green color (`0x2a5f7f`) - better than flat blue
- **On localhost**: Can load Earth texture if present

## Why Textures Fail on file://

Browser security (CORS) blocks loading local files from `file://` protocol:
```
Access to fetch at 'file:///textures/8k_earth_daymap.jpg' blocked by CORS policy
```

**Solution**: Run a local web server.

---

## Quick Setup (30 seconds)

### 1. Run Local Server

**Windows (PowerShell):**
```powershell
cd "C:\Users\eitana\Desktop\App Development\Relay\RelayCodeBaseV93"
python -m http.server 8000
```

**If Python not installed:**
- Download: https://www.python.org/downloads/
- Or use Node.js: `npx http-server -p 8000`

### 2. Open in Browser
```
http://localhost:8000/filament-spreadsheet-prototype.html
```

**Not**:
```
file:///C:/Users/eitana/.../filament-spreadsheet-prototype.html
```

### 3. Check Console
```
✅ Earth texture loaded
```

Or:
```
ℹ️ Earth texture not available (using procedural colors)
```

---

## Adding Earth Texture (Optional)

### Download Earth Daymap

**Recommended Source**: NASA Visible Earth
- URL: https://visibleearth.nasa.gov/images/73909/december-blue-marble-next-generation-w-topography-and-bathymetry/73911l
- Or search: "8k earth texture NASA"

**File**: `8k_earth_daymap.jpg` (or similar)

### Place in Project

```
RelayCodeBaseV93/
  ├── filament-spreadsheet-prototype.html
  ├── textures/               ← Create this folder
  │   └── 8k_earth_daymap.jpg ← Place texture here
  └── ...
```

### Code Will Auto-Load

```javascript
earthTexture = textureLoader.load('textures/8k_earth_daymap.jpg', 
    () => console.log('[Relay] ✅ Earth texture loaded'),
    ...
);
```

If texture exists → globe shows continents/oceans  
If missing → fallback to ocean blue-green color

---

## Alternative: Better Procedural Colors

If you don't want to download textures, improve the procedural look:

### Current Fallback
```javascript
color: earthTexture ? 0xffffff : 0x2a5f7f  // Ocean blue-green
```

### Enhanced Fallback (Land + Ocean)
You could add a procedural "land mass" shader or use vertex colors, but that's complex.

**Simplest**: Use the texture — it's 10MB and makes a huge visual difference.

---

## Expected Visual Result

### With Texture (on localhost)
- Continents: brown/green
- Oceans: deep blue
- Specular highlights on water
- Cloud shadows (if using cloud layer texture)
- **"This is Earth"** clarity

### Without Texture (file:// or missing)
- Solid ocean blue-green (`0x2a5f7f`)
- Wire grid overlay (lat/long lines)
- Slightly rough surface (roughness: 0.85)
- **"This is a planet"** (generic)

---

## Why the Globe Matters

In Relay, the globe is **not decoration**:
- It's the **spatial truth anchor**
- Tree roots attach to real GPS coordinates (Tel Aviv: 32.0853°N, 34.7818°E)
- Boundaries (GeoJSON) overlay on surface
- All 3D coordinates map to real-world locations

**Visual clarity**: Earth texture instantly communicates "this is grounded in real space."

---

## Performance Note

**8K texture** = ~10-20MB:
- First load: 1-3 seconds to download/decode
- Cached: instant
- GPU memory: ~30MB uncompressed

**Impact**: Negligible on modern hardware (even integrated GPUs handle 8K textures fine).

---

## Troubleshooting

### Server Won't Start
```
python -m http.server 8000
# Error: Address already in use
```

**Fix**: Port 8000 is busy, try another:
```
python -m http.server 8001
```

### Texture Won't Load
```
ℹ️ Earth texture not available
```

**Check**:
1. File exists: `textures/8k_earth_daymap.jpg`
2. Path is correct (relative to HTML file)
3. Running on localhost (not file://)
4. Console shows texture request (no 404)

### Globe Still Flat Blue
```
color: 0x1a3a5c  ← Old code
```

**Fix**: Hard reload (`Ctrl+Shift+R`) to clear cache.

---

## Quick Pass/Fail

### ✅ PASS (localhost with texture)
```
[Relay] ✅ Earth texture loaded
```
Globe shows continents + oceans.

### ✅ PASS (file:// without texture)
```
[Relay] ℹ️ Earth texture not available (using procedural colors)
```
Globe is ocean blue-green (`0x2a5f7f`), not flat blue (`0x1a3a5c`).

### ❌ FAIL
Globe is solid flat blue (`0x1a3a5c`) → old code still cached.

---

## Optional: Cloud Layer

For extra realism, add a second sphere with cloud texture:

```javascript
const cloudTexture = textureLoader.load('textures/8k_earth_clouds.jpg');
const cloudGeometry = new THREE.SphereGeometry(globeRadius + 0.05, 96, 96);
const cloudMaterial = new THREE.MeshStandardMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
});
const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
globeMesh.add(cloudMesh);
```

**Effect**: Clouds float above Earth surface (subtle, realistic).

---

## What You'll See (Before vs After)

### Before (Flat Blue Sphere)
```
  🔵
 ╱   ╲
▕ ▪▪▪ ▏ ← Wire grid on solid blue
 ╲   ╱
  ▔▔▔
```

### After (Textured Earth)
```
  🌍
 ╱ 🟩🟦╲
▕ 🟫🟦🟩▏ ← Land + ocean detail
 ╲ 🟦🟩╱
  ▔▔▔
```

---

**Recommendation**: If you plan to use Relay for real work, run on localhost and add the Earth texture. The 30-second setup is worth it for visual clarity.
