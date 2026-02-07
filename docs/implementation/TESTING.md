# 🧪 Relay Testing Guide

Testing strategies, tools, and best practices for Relay.

---

## Testing Philosophy

**Relay testing focuses on**:
1. **Gates pass**: Boot gate, LOD gate, containsLL gate
2. **Core correctness**: LOD hysteresis, point-in-polygon, state management
3. **Visual verification**: Does it look right? (manual for now)
4. **Performance**: 60 FPS, memory usage, render time

---

## Test Types

### 1. Unit Tests (Core Logic)

**Purpose**: Test renderer-agnostic logic in `core/**`

**Framework**: Vitest

**Location**: `tests/unit/`

**Example**:
```javascript
// tests/unit/lod-governor.test.js
import { describe, it, expect } from 'vitest';
import { RelayLODGovernor } from '../../core/services/lod-governor.js';

describe('RelayLODGovernor', () => {
    it('should determine correct LOD level from height', () => {
        const governor = new RelayLODGovernor();
        
        expect(governor.determineLODLevel(500000)).toBe('LANIAKEA');
        expect(governor.determineLODLevel(200000)).toBe('PLANETARY');
        expect(governor.determineLODLevel(75000)).toBe('REGION');
        expect(governor.determineLODLevel(30000)).toBe('COMPANY');
        expect(governor.determineLODLevel(10000)).toBe('SHEET');
        expect(governor.determineLODLevel(2000)).toBe('CELL');
    });
    
    it('should implement hysteresis to prevent thrashing', () => {
        const governor = new RelayLODGovernor();
        const levels = [];
        
        governor.subscribe(level => levels.push(level));
        
        // Oscillate around 50km threshold (REGION ↔ PLANETARY)
        governor.update(49000);  // REGION (in)
        governor.update(51000);  // Still REGION (hysteresis)
        governor.update(49000);  // Still REGION
        governor.update(61000);  // PLANETARY (out threshold)
        
        expect(levels).toEqual(['REGION', 'PLANETARY']);
    });
});
```

**Run**:
```bash
npm test -- tests/unit/lod-governor.test.js
```

### 2. Gate Tests (System Validation)

**Purpose**: Verify phase completion criteria

**Framework**: Node.js script (manual or automated)

**Location**: `scripts/boot-gate-test.mjs`

**Example**: Boot Gate
```javascript
// scripts/boot-gate-test.mjs
import puppeteer from 'puppeteer';

async function runBootGateTest() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8000/relay-cesium-world.html');
    await page.waitForTimeout(5000);  // Wait for Cesium init
    
    // Test 1: Viewer exists
    const viewerExists = await page.evaluate(() => {
        return window.viewer !== undefined;
    });
    console.log(viewerExists ? '✅ Viewer exists' : '❌ Viewer missing');
    
    // Test 2: No errors
    const errors = [];
    page.on('pageerror', err => errors.push(err));
    console.log(errors.length === 0 ? '✅ No errors' : `❌ ${errors.length} errors`);
    
    await browser.close();
    process.exit(viewerExists && errors.length === 0 ? 0 : 1);
}

runBootGateTest();
```

**Run**:
```bash
npm run boot-gate
```

### 3. Integration Tests (Renderer + Core)

**Purpose**: Test core + renderer interaction

**Framework**: Vitest + jsdom (for DOM)

**Location**: `tests/integration/`

**Example**:
```javascript
// tests/integration/filament-renderer.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { relayState, setTreeData } from '../../core/models/relay-state.js';
import { CesiumFilamentRenderer } from '../../app/renderers/filament-renderer.js';

describe('CesiumFilamentRenderer Integration', () => {
    let mockViewer;
    let renderer;
    
    beforeEach(() => {
        mockViewer = {
            scene: { primitives: [] },
            entities: { add: () => ({}), remove: () => {} }
        };
        renderer = new CesiumFilamentRenderer(mockViewer);
        
        // Set up test data
        setTreeData([
            { id: 'trunk-0', type: 'trunk', lat: 32, lon: 34, alt: 0 },
            { id: 'branch-0', type: 'branch', lat: 32.1, lon: 34.1, alt: 1000, parent: 'trunk-0' }
        ], []);
    });
    
    it('should render tree from relayState', () => {
        renderer.renderTree();
        
        expect(renderer.entities.length).toBeGreaterThan(0);
    });
});
```

### 4. E2E Tests (Full User Flows)

**Purpose**: Test complete user scenarios

**Framework**: Playwright

**Location**: `tests/e2e/`

**Example**:
```javascript
// tests/e2e/excel-import.spec.js
import { test, expect } from '@playwright/test';

test('Excel import → tree render', async ({ page }) => {
    await page.goto('http://localhost:8000');
    
    // Wait for Cesium
    await page.waitForSelector('.cesium-viewer');
    
    // Upload Excel file
    const filePath = './tests/fixtures/sample.xlsx';
    await page.setInputFiles('#fileInput', filePath);
    
    // Wait for tree render
    await page.waitForTimeout(2000);
    
    // Check HUD for node count
    await page.keyboard.press('H');
    const hud = await page.locator('#hud').textContent();
    expect(hud).toContain('Nodes:');
    expect(hud).not.toContain('Nodes: 0');
});
```

**Run**:
```bash
npm run test:e2e
```

### 5. Performance Tests

**Purpose**: Measure FPS, memory, render time

**Framework**: Chrome DevTools + custom scripts

**Location**: `tests/performance/`

**Example**:
```javascript
// tests/performance/render-benchmark.js
async function benchmarkRender() {
    // Load large dataset
    await importExcel('large-dataset.xlsx');
    
    // Measure render time
    console.time('renderTree');
    filamentRenderer.renderTree();
    console.timeEnd('renderTree');
    
    // Measure FPS
    let frameCount = 0;
    const start = performance.now();
    
    function countFrames() {
        frameCount++;
        if (performance.now() - start < 1000) {
            requestAnimationFrame(countFrames);
        } else {
            console.log(`FPS: ${frameCount}`);
        }
    }
    
    requestAnimationFrame(countFrames);
}
```

---

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test File

```bash
npm test -- tests/unit/lod-governor.test.js
```

### Watch Mode (Re-run on Changes)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

---

## Writing Tests

### Test Structure

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Feature Name', () => {
    let instance;
    
    beforeEach(() => {
        // Setup before each test
        instance = new MyClass();
    });
    
    afterEach(() => {
        // Cleanup after each test
        instance = null;
    });
    
    it('should do something', () => {
        const result = instance.method();
        expect(result).toBe(expected);
    });
    
    it('should handle edge case', () => {
        expect(() => instance.badMethod()).toThrow();
    });
});
```

### Assertions

```javascript
// Equality
expect(value).toBe(5);
expect(value).toEqual({ a: 1 });
expect(value).not.toBe(3);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(5.5, 1);

// Strings
expect(value).toMatch(/pattern/);
expect(value).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ a: 1 });

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('error message');
```

### Mocking

```javascript
import { vi } from 'vitest';

// Mock function
const mockFn = vi.fn();
mockFn('arg');
expect(mockFn).toHaveBeenCalledWith('arg');

// Mock module
vi.mock('../../core/utils/relay-log.js', () => ({
    RelayLog: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

// Mock Cesium (if needed)
global.Cesium = {
    Viewer: vi.fn(),
    Cartesian3: {
        fromDegrees: vi.fn(() => ({}))
    }
};
```

---

## Test Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| **Core logic** (`core/**`) | 80% | TBD |
| **Renderers** (`app/renderers/**`) | 60% | TBD |
| **Utils** (`core/utils/**`) | 90% | TBD |
| **UI** (`app/ui/**`) | 40% | TBD |
| **Overall** | 70% | TBD |

---

## Gate Tests

### Boot Gate

**Purpose**: Verify Cesium + basic functionality

**Criteria**:
- ✅ Cesium viewer exists
- ✅ Terrain loaded
- ✅ Buildings visible
- ✅ Drop zone exists
- ✅ No console errors

**Run**: `npm run boot-gate`

### LOD Thrash Gate

**Purpose**: Verify hysteresis prevents rapid level switching

**Test**:
```javascript
it('should not thrash when height oscillates', () => {
    const governor = new RelayLODGovernor();
    const levels = [];
    governor.subscribe(level => levels.push(level));
    
    // Oscillate around threshold
    for (let i = 0; i < 100; i++) {
        const height = 50000 + (i % 2 === 0 ? -1000 : 1000);
        governor.update(height);
    }
    
    expect(levels.length).toBeLessThan(10);  // Max 10 transitions, not 100
});
```

### containsLL Gate

**Purpose**: Verify point-in-polygon correctness

**Test**:
```javascript
it('should identify points inside boundary', () => {
    const israel = loadBoundary('ISR');
    
    expect(containsLL(israel, 32.0853, 34.7818)).toBe(true);  // Tel Aviv
    expect(containsLL(israel, 51.5074, -0.1278)).toBe(false);  // London
});
```

### One World Gate

**Purpose**: Ensure no second renderer

**Test**:
```javascript
it('should have exactly one Cesium viewer', () => {
    const viewers = document.querySelectorAll('.cesium-viewer');
    expect(viewers.length).toBe(1);
});

it('should not create Three.js context', () => {
    expect(window.THREE).toBeUndefined();
});
```

---

## Manual Testing Checklist

### After Every Change

- [ ] Run `npm run boot-gate`
- [ ] Open in browser, check console for errors
- [ ] Drop Excel file, verify tree renders
- [ ] Zoom in/out, verify LOD transitions
- [ ] Press `H`, verify HUD updates
- [ ] Press `I`, verify tree stats correct

### Before Commit

- [ ] Run `npm test` (all tests pass)
- [ ] Run `npm run lint` (no errors)
- [ ] Visual inspection (no glitches)
- [ ] Performance check (60 FPS maintained)

### Before PR

- [ ] All gates pass
- [ ] Code coverage ≥ 70%
- [ ] Documentation updated
- [ ] No console warnings/errors

---

## Debugging Tests

### View Test Output

```bash
npm test -- --reporter=verbose
```

### Run Single Test

```bash
npm test -- -t "should do something"
```

### Debug with Chrome DevTools

```bash
npm test -- --inspect-brk
```

Then open `chrome://inspect` and click "inspect".

---

## CI/CD Integration (Future)

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 18
      - run: npm install
      - run: npm test
      - run: npm run boot-gate
      - run: npm run lint
```

---

## Common Test Patterns

### Testing Async Code

```javascript
it('should load boundary async', async () => {
    const boundary = await loadBoundary('ISR');
    expect(boundary).toBeDefined();
    expect(boundary.geojson).toHaveProperty('coordinates');
});
```

### Testing Events

```javascript
it('should notify subscribers on LOD change', () => {
    const governor = new RelayLODGovernor();
    const spy = vi.fn();
    
    governor.subscribe(spy);
    governor.update(100000);
    
    expect(spy).toHaveBeenCalledWith('PLANETARY', null);
});
```

### Testing DOM

```javascript
it('should update HUD on data change', () => {
    const hud = new HUDManager('hud');
    hud.update({ lod: 'SHEET', altitude: 10000 });
    
    const element = document.getElementById('hud');
    expect(element.textContent).toContain('SHEET');
    expect(element.textContent).toContain('10.0 km');
});
```

---

## Performance Testing

### FPS Measurement

```javascript
let fps = 0;
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
    frameCount++;
    const now = performance.now();
    
    if (now - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;
        
        console.log(`FPS: ${fps}`);
    }
    
    requestAnimationFrame(measureFPS);
}

measureFPS();
```

### Memory Profiling

```javascript
// Before
const before = performance.memory.usedJSHeapSize;

// Run operation
filamentRenderer.renderTree();

// After
const after = performance.memory.usedJSHeapSize;
const delta = (after - before) / 1024 / 1024;

console.log(`Memory used: ${delta.toFixed(2)} MB`);
```

---

## Next Steps

- **Write tests** for your features
- **Run tests** before committing
- **Check coverage**: `npm run test:coverage`
- **Pass gates**: `npm run boot-gate`

---

*Comprehensive testing ensures Relay remains stable and performant.*
