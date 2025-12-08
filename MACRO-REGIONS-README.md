# Relay Macro-Region System Implementation

## Overview

The Relay geographic hierarchy has been restructured to use **UN-style macro-regions** instead of continents. This provides a more standardized, governance-friendly 5-region classification system.

## Macro-Regions (5 Total)

1. **Africa** (57 countries) - All African nations
2. **Americas** (57 countries) - North + South America combined
3. **Asia** (61 countries) - Including Russia, Middle East, Central/East/South/Southeast Asia
4. **Europe** (50 countries) - European nations (Russia moved to Asia)
5. **Oceania** (26 countries) - Australia, Pacific islands, etc.

## Implementation Details

### Generated Files

- `public/macro_regions.geojson` - Precomputed macro-region boundaries
- `public/macro_regions.json` - Metadata and country assignments
- `data/macro_regions.geojson` - Source data copy
- `data/macro_regions.json` - Source metadata copy

### Updated Components

1. **AdministrativeHierarchy.js**
   - Added `loadMacroRegions()` function
   - Added `createMacroRegionFromPrecomputed()` function
   - Updated entity storage: `this.entities.macro_region`
   - Updated cluster level handling

2. **InteractiveGlobe.jsx**
   - Updated cluster level definition: `macro_region`
   - Updated loading logic for macro-regions
   - Updated entity registration with RegionManager

3. **RegionManager.js**
   - Added `macro_regions` to `entitiesByLayer`
   - Updated hover detection for macro-regions
   - Updated visibility logic

4. **ClusteringControlPanel.jsx**
   - Updated cluster level button: "Macro-Region"
   - Updated description: "UN Macro-region level channel stacks (5 regions)"

### Scripts

- `scripts/generate-macro-regions.mjs` - Generates macro-region data from Natural Earth countries
- `scripts/test-macro-regions.mjs` - Validates implementation

## Geographic Hierarchy

```
Global 🌐
└── Macro-Region 🌎 (5 regions)
    └── Country 🏳️
        └── Province/State 🏛️
            └── City 🏙️
                └── Neighborhood 🏠
                    └── GPS 📍
```

## Key Changes from Continent System

### Benefits
- **Standardized**: Uses UN geoscheme classification
- **Simplified**: Only 5 macro-regions vs 7-8 continents
- **Governance-friendly**: Better for region-wide proposals and voting
- **Geopolitically accurate**: Russia in Asia, Americas combined

### Migration Notes
- Continental system files still exist for backward compatibility
- Frontend defaults to macro-region view
- All Relay channels will use macro-region scoping
- Existing data structures preserved

## Usage

### Frontend Integration

```javascript
// Load macro-regions
await adminHierarchy.loadLayer('macro_region');

// Access macro-region entities
adminHierarchy.entities.macro_region.forEach(entity => {
  console.log(entity.name); // "Asia", "Europe", etc.
});

// Set cluster level
setClusterLevel('macro_region');
```

### Data Generation

```bash
# Generate macro-region boundaries
node scripts/generate-macro-regions.mjs

# Test implementation
node scripts/test-macro-regions.mjs
```

## Governance Integration

Each macro-region becomes a Relay channel:
- **Africa Relay** - Africa-wide governance
- **Americas Relay** - Pan-American proposals  
- **Asia Relay** - Asian regional coordination
- **Europe Relay** - European integration
- **Oceania Relay** - Pacific cooperation

## File Structure

```
scripts/
├── generate-macro-regions.mjs    # Generate boundaries
└── test-macro-regions.mjs        # Validate system

data/
├── macro_regions.geojson         # Source GeoJSON
└── macro_regions.json            # Source metadata

public/
├── macro_regions.geojson         # Frontend GeoJSON
└── macro_regions.json            # Frontend metadata

src/frontend/components/
├── main/globe/
│   ├── InteractiveGlobe.jsx      # Updated cluster levels
│   └── managers/
│       ├── AdministrativeHierarchy.js  # Macro-region loading
│       └── RegionManager.js             # Hover/interaction
└── workspace/panels/
    └── ClusteringControlPanel.jsx       # UI controls
```

## Testing

1. **Start frontend**: `npm run dev:frontend`
2. **Navigate to globe view**
3. **Select "Macro-Region" from clustering panel**
4. **Verify 5 macro-regions display correctly**
5. **Test hover interactions**
6. **Verify RegionManager integration**

## Next Steps

1. Update backend Relay channel creation for macro-regions
2. Implement macro-region scoped proposals
3. Add macro-region voting aggregation
4. Create governance dashboards for each macro-region
5. Migrate existing continental data to macro-region structure