# 🛠 Relay Development Setup

Complete development environment setup for contributing to Relay.

---

## Prerequisites

### Required

- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm 8+** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Code editor** (VS Code recommended)

### Recommended

- **Google Chrome** or **Firefox** (best DevTools support)
- **PowerShell 7+** (Windows) or **Bash** (macOS/Linux)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd RelayCodeBaseV93
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- **Development tools**: Vitest, Playwright, ESLint
- **Build tools**: Vite (for potential builds)
- **Test frameworks**: Vitest, @testing-library

**Note**: Cesium and XLSX load from CDN (not installed locally).

### 3. Verify Installation

```bash
npm run dev:cesium
```

Open `http://localhost:8000`. You should see Cesium globe.

---

## Project Structure

```
RelayCodeBaseV93/
├── relay-cesium-world.html    # Main entry point
├── index.html                  # Redirects to main
│
├── app/                        # Cesium-specific code
│   ├── cesium/                 # Viewer initialization
│   ├── renderers/              # Filament, boundary renderers
│   ├── ui/                     # HUD, inspectors
│   └── excel-importer.js       # Excel parsing
│
├── core/                       # Renderer-agnostic (NO Cesium)
│   ├── models/                 # RelayState, data models
│   ├── services/               # LOD Governor, boundaries
│   └── utils/                  # Logging, math
│
├── data/                       # GeoJSON boundaries, samples
├── docs/                       # Documentation
├── scripts/                    # Dev server, build tools
├── tests/                      # Test suites
│
├── package.json                # Dependencies
└── ROOT-CONTRACT.md            # Workspace rules
```

---

## Development Workflow

### Starting Dev Server

```bash
npm run dev:cesium
```

- Runs on `http://localhost:8000`
- CORS enabled
- Hot reload: **No** (refresh manually)

### Making Changes

#### 1. Core Logic Changes (`core/**`)

**Rule**: Core CANNOT import Cesium (Lock F)

```javascript
// ✅ GOOD (core/services/lod-governor.js)
export class RelayLODGovernor {
    update(cameraHeight) {  // Height passed in, no Cesium
        const level = this.determineLODLevel(cameraHeight);
        this.notify(level);
    }
}

// ❌ BAD (core/)
import Cesium from 'cesium';  // VIOLATION of Lock F
```

**Testing**:
```bash
npm test -- core/services/lod-governor.test.js
```

#### 2. Rendering Changes (`app/**`)

**Rule**: App MAY import Cesium

```javascript
// ✅ GOOD (app/renderers/filament-renderer.js)
import { relayState } from '../../core/models/relay-state.js';

export class CesiumFilamentRenderer {
    constructor(viewer) {
        this.viewer = viewer;  // Cesium.Viewer
    }
    
    renderTree() {
        // Use Cesium primitives
        const primitive = new Cesium.Primitive({...});
        this.viewer.scene.primitives.add(primitive);
    }
}
```

**Testing**:
- Visual inspection (open in browser)
- Check console for errors
- Verify LOD transitions

#### 3. UI Changes (`app/ui/**`)

```javascript
// ✅ GOOD (app/ui/hud-manager.js)
export class HUDManager {
    update(data) {
        this.hudElement.innerHTML = `
            <div>🔭 LOD: ${data.lod}</div>
            <div>📏 Alt: ${(data.altitude / 1000).toFixed(1)} km</div>
        `;
    }
}
```

**Testing**:
- Open browser, press `H` to toggle HUD
- Verify data updates on zoom

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test

```bash
npm test -- core/services/lod-governor.test.js
```

### Run Boot Gate Test

```bash
npm run boot-gate
```

**Must pass**:
- ✅ Cesium viewer exists
- ✅ Terrain + buildings visible
- ✅ Drop zone exists
- ✅ No console errors

### Watch Mode

```bash
npm run test:watch
```

Auto-reruns tests on file changes.

---

## Code Style

### ESLint

```bash
npm run lint
```

**Rules** (planned):
- No unused variables
- No console.log in production
- No Cesium imports in `core/**`

### Formatting

Use VS Code auto-format (Prettier recommended).

**Settings** (`.vscode/settings.json`):
```json
{
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

## Debugging

### Browser DevTools

Press `F12` to open DevTools.

**Useful tabs**:
- **Console**: See `RelayLog` messages
- **Sources**: Set breakpoints in modules
- **Performance**: Profile render loops
- **Memory**: Check for leaks

### Logging

Relay uses custom logger:
```javascript
import { RelayLog } from './core/utils/relay-log.js';

RelayLog.info('Message');
RelayLog.warn('Warning');
RelayLog.error('Error');
```

**Toggle log console**: Press `L` in app

### Common Issues

#### "Module not found"

**Error**: `Failed to resolve module specifier "cesium"`

**Fix**: Cesium loads from CDN in HTML, not ES6 import. Use global `Cesium` object.

#### "CORS error"

**Error**: `Access to fetch blocked by CORS policy`

**Fix**: Use dev server (`npm run dev:cesium`), not `file://` protocol.

#### "relayState is undefined"

**Error**: `Cannot read properties of undefined`

**Fix**: Import from correct path:
```javascript
import { relayState } from '../../core/models/relay-state.js';
```

---

## Git Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
# ...

# Commit
git add .
git commit -m "Add my feature"

# Push
git push origin feature/my-feature
```

### Commit Messages

**Format**:
```
<type>: <subject>

<body>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Add tests
- `chore`: Maintenance

**Example**:
```
feat: add LOD hysteresis to governor

- Implement in/out thresholds per level
- Add subscriber pattern for level changes
- Prevent rapid switching near boundaries
```

---

## Adding New Features

### Step-by-Step

1. **Read the canonical plan**: [RELAY-MASTER-BUILD-PLAN.md](../architecture/RELAY-MASTER-BUILD-PLAN.md)
3. **Create branch**: `git checkout -b feature/my-feature`
4. **Write tests** (TDD):
   ```javascript
   describe('MyFeature', () => {
       it('should do something', () => {
           expect(result).toBe(expected);
       });
   });
   ```
5. **Implement feature**
6. **Test manually**: Open in browser, verify visually
7. **Run tests**: `npm test`
8. **Run boot gate**: `npm run boot-gate` (must pass)
9. **Commit**: `git commit -m "feat: add my feature"`
10. **Push**: `git push origin feature/my-feature`

---

## Performance Tips

### Profiling

```javascript
// Wrap expensive operations
console.time('renderTree');
filamentRenderer.renderTree();
console.timeEnd('renderTree');
```

### Memory Management

```javascript
// Clean up on re-render
filamentRenderer.clear();  // Remove old primitives
filamentRenderer.renderTree();  // Add new
```

### Avoid Common Pitfalls

❌ **Don't**: Create new geometry every frame
```javascript
// BAD
animate() {
    const geometry = new Cesium.BoxGeometry({...});  // Expensive!
    // ...
}
```

✅ **Do**: Create once, reuse
```javascript
// GOOD
constructor() {
    this.geometry = new Cesium.BoxGeometry({...});
}

animate() {
    // Update position only
    this.primitive.modelMatrix = newMatrix;
}
```

---

## Useful Commands

```bash
# Development
npm run dev:cesium          # Start dev server
npm run boot-gate           # Run boot gate test
npm test                    # Run all tests
npm run lint                # Lint code

# Auditing
npm run root-audit          # Check root compliance
npm run link-audit          # Check doc links

# Maintenance
npm install                 # Install dependencies
npm update                  # Update dependencies
npm audit                   # Security audit
```

---

## VS Code Extensions (Recommended)

- **ESLint**: Linting
- **Prettier**: Code formatting
- **Vitest**: Test runner
- **GitLens**: Git integration
- **Live Server**: Quick preview (alternative to npm server)

---

## Troubleshooting

### Dev Server Won't Start

**Error**: `EADDRINUSE`

**Fix**:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill
```

### Tests Fail with Module Errors

**Error**: `Cannot use import statement outside a module`

**Fix**: Ensure test files have `.test.js` extension and are in `tests/` folder.

### Cesium Won't Load

**Error**: `Cesium is not defined`

**Fix**: Check `relay-cesium-world.html` includes Cesium CDN script BEFORE your modules:
```html
<script src="https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Cesium.js"></script>
<script type="module">
    // Your code here (Cesium is now global)
</script>
```

---

## Next Steps

- **Read the canonical plan**: [RELAY-MASTER-BUILD-PLAN.md](../architecture/RELAY-MASTER-BUILD-PLAN.md)
- **Run tests**: [TESTING.md](../implementation/TESTING.md)
- **Review code**: `app/` and `core/` folders

---

*You're now ready to contribute to Relay. Happy coding!* 🚀
