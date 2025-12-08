# Integration Checklist

Use this checklist to integrate the unified boundary system into your application.

---

## ✅ Phase 1: System Verification (COMPLETE)

- [x] Download script created
- [x] Backend service created
- [x] Backend API created
- [x] Frontend service created
- [x] Data downloaded (20 priority countries)
- [x] Backend integration complete
- [x] All tests passing
- [x] Documentation complete

**Status: READY TO USE** ✅

---

## 🔲 Phase 2: Channel Generator Integration (TODO)

### Step 1: Update Imports
- [ ] Open `src/frontend/components/workspace/panels/TestDataPanel.jsx`
- [ ] Add import: `import { geoBoundaryService } from '@/services/geoBoundaryService.js';`

### Step 2: Update Country Dropdown Loading
- [ ] Replace `const COUNTRIES = getAllCountries();`
- [ ] With: `const [countries, setCountries] = useState([]);`
- [ ] Add useEffect to load:
```javascript
useEffect(() => {
  geoBoundaryService.listCountries().then(setCountries);
}, []);
```

### Step 3: Update Province Dropdown
- [ ] When country selected, load provinces:
```javascript
const handleCountrySelect = async (countryCode) => {
  const provinces = await geoBoundaryService.listProvinces(countryCode);
  setAvailableProvinces(provinces);
};
```

### Step 4: Update Coordinate Generation
- [ ] Replace bounding box generation with:
```javascript
const coords = await geoBoundaryService.generateCoordinates({
  countryCode: selectedCountry.code,
  provinceCode: selectedProvince?.code,
  count: candidateCount
});
```

### Step 5: Test
- [ ] Start backend: `npm run dev:backend`
- [ ] Start frontend: `npm run dev:frontend`
- [ ] Open Channel Generator
- [ ] Select Italy
- [ ] Select province
- [ ] Generate 25 candidates
- [ ] Verify coordinates are inside Italy (not ocean!)
- [ ] Verify clustering shows province names

---

## 🔲 Phase 3: Globe Overlay Integration (TODO)

### Step 1: Add Boundary Buttons
- [ ] Open `src/frontend/components/workspace/panels/MapControlsPanel.jsx`
- [ ] Add three new buttons:
  - [ ] "Show Countries" toggle
  - [ ] "Show Provinces" toggle
  - [ ] "Show Cities" toggle

### Step 2: Implement Toggle Functions
```javascript
const toggleProvinces = async () => {
  if (provincesVisible) {
    // Remove data source
    viewer.dataSources.remove(provinceDataSource);
    setProvincesVisible(false);
  } else {
    // Load and add boundaries
    const geojson = await geoBoundaryService.getProvinceBoundaries('ITA');
    const dataSource = new Cesium.GeoJsonDataSource();
    await dataSource.load(geojson, {
      stroke: Cesium.Color.WHITE,
      strokeWidth: 2,
      fill: Cesium.Color.TRANSPARENT
    });
    viewer.dataSources.add(dataSource);
    setProvinceDataSource(dataSource);
    setProvincesVisible(true);
  }
};
```

### Step 3: Test
- [ ] Click "Show Provinces" button
- [ ] Verify province boundaries appear on globe
- [ ] Verify boundaries are accurate
- [ ] Click again to hide

---

## 🔲 Phase 4: Clustering Verification (TODO)

### Step 1: Generate Test Data
- [ ] Generate 100 candidates across Italy
- [ ] Ensure mix of provinces

### Step 2: Verify Clustering
- [ ] Check candidate metadata includes:
  - [ ] `country: 'Italy'`
  - [ ] `countryCode: 'ITA'`
  - [ ] `province: 'Centro'` (or other province name)
  - [ ] `provinceCode: 'IT-XX'`
  - [ ] `adminLevel: 1`

### Step 3: Verify Visualization
- [ ] Candidates should stack into province towers
- [ ] Clicking tower should show province name
- [ ] Zooming should reveal individual candidates

---

## 🔲 Phase 5: Additional Countries (OPTIONAL)

### Download More Countries
- [ ] Run: `node scripts/download-geoboundaries.mjs country TUR` (Turkey)
- [ ] Run: `node scripts/download-geoboundaries.mjs country RUS` (Russia)
- [ ] Run: `node scripts/download-geoboundaries.mjs country IND` (India - already have)
- [ ] Or download all: `node scripts/download-geoboundaries.mjs all`

### Test New Countries
- [ ] Restart backend
- [ ] Check new countries appear in dropdown
- [ ] Test coordinate generation
- [ ] Verify provinces/cities load

---

## 🔲 Phase 6: Custom Boundaries (OPTIONAL)

### Step 1: Create Custom Boundary File
- [ ] Create `data/custom-boundaries/ITA-ADM1-custom.geojson`
- [ ] Add your custom region:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Custom Region",
        "category": "Others"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], [lng, lat], ...]]
      }
    }
  ]
}
```

### Step 2: Test
- [ ] Restart backend
- [ ] Custom region should appear in province list
- [ ] Can generate coordinates in custom region

---

## 🔲 Phase 7: Performance Optimization (OPTIONAL)

### Backend Caching
- [ ] Monitor cache hit rates in logs
- [ ] Adjust cache sizes if needed
- [ ] Consider Redis for production

### Frontend Caching
- [ ] Implement localStorage caching for country list
- [ ] Cache province lists per country
- [ ] Clear cache on version updates

---

## 📊 Testing Checklist

### Unit Tests
- [x] Backend service initialization
- [x] List countries
- [x] List provinces
- [x] List cities
- [x] Get boundaries
- [x] Generate coordinates
- [x] Get bounds

### Integration Tests
- [ ] Channel Generator creates candidates with metadata
- [ ] Globe displays province boundaries
- [ ] Clustering groups by province
- [ ] All countries in dropdown

### User Acceptance Tests
- [ ] User can select any country
- [ ] Provinces load when country selected
- [ ] Generated candidates have correct metadata
- [ ] No coordinates in ocean
- [ ] Clustering shows proper towers
- [ ] Performance is acceptable (<1s for operations)

---

## 🐛 Known Issues & Solutions

### Issue: Canada Provinces Failed to Download
**Cause:** File too large for Node.js string limit  
**Solution:** Province data not critical, country level works  
**Workaround:** Use country-level generation for Canada

### Issue: Some Countries Have No Provinces
**Cause:** Not all countries have ADM1 data in GeoBoundaries  
**Solution:** Fall back to country-level generation  
**Status:** Handled automatically by system

---

## 📞 Support Resources

- **Implementation Guide**: `UNIFIED-BOUNDARY-SYSTEM-COMPLETE.md`
- **Quick Start**: `READY-TO-USE.md`
- **Summary**: `IMPLEMENTATION-SUMMARY.md`
- **Test Script**: `scripts/test-boundary-system.mjs`
- **API Docs**: Comments in `src/backend/api/boundaryAPI.mjs`

---

## 🎯 Success Metrics

### Before Integration
- [ ] Backend starts without errors
- [ ] API endpoints respond
- [ ] Test script passes

### After Integration
- [ ] Channel Generator uses new API
- [ ] 200+ countries available (not just 12)
- [ ] Point-in-polygon coordinates (not bounding box)
- [ ] Proper clustering by province
- [ ] No ocean coordinates
- [ ] Globe overlays work
- [ ] Performance acceptable

---

## 🏁 Completion Criteria

The integration is complete when:
- [ ] All checklist items marked as done
- [ ] All tests passing
- [ ] No ocean coordinate placements
- [ ] Clustering shows province towers
- [ ] Globe overlays display correctly
- [ ] Performance meets requirements
- [ ] Documentation updated

---

**Current Status:**
- ✅ Phase 1 (System Verification): COMPLETE
- 🔲 Phase 2 (Channel Generator): TODO
- 🔲 Phase 3 (Globe Overlays): TODO
- 🔲 Phase 4 (Clustering): TODO
- 🔲 Phase 5 (Additional Countries): OPTIONAL
- 🔲 Phase 6 (Custom Boundaries): OPTIONAL
- 🔲 Phase 7 (Performance): OPTIONAL

**Ready to begin Phase 2!** 🚀
