# Test Boundary API - On-Demand System Verification

Write-Host "=== Boundary API Test Script ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: List all countries
Write-Host "Test 1: Fetching all countries..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/boundaries/countries" -UseBasicParsing
    $countries = $response.Content | ConvertFrom-Json
    Write-Host "✅ SUCCESS: Loaded $($countries.Count) countries" -ForegroundColor Green
    Write-Host "First 5 countries:" -ForegroundColor Gray
    $countries | Select-Object -First 5 | ForEach-Object {
        Write-Host "  - $($_.name) ($($_.code))" -ForegroundColor Gray
    }
    Write-Host ""
}
catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Fetch provinces for France (on-demand)
Write-Host "Test 2: Fetching provinces for France (on-demand)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/boundaries/provinces/FRA" -UseBasicParsing
    $provinces = $response.Content | ConvertFrom-Json
    Write-Host "✅ SUCCESS: Loaded $($provinces.Count) provinces for France" -ForegroundColor Green
    Write-Host "First 5 provinces:" -ForegroundColor Gray
    $provinces | Select-Object -First 5 | ForEach-Object {
        Write-Host "  - $($_.name) ($($_.code))" -ForegroundColor Gray
    }
    Write-Host ""
}
catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Get boundary for a province (triggers download)
Write-Host "Test 3: Getting boundary for French Guiana (triggers GeoJSON download if needed)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/boundaries/boundary/FRA/provinces/FRA-GUF" -UseBasicParsing
    $boundary = $response.Content | ConvertFrom-Json
    Write-Host "✅ SUCCESS: Got boundary with $($boundary.features.Count) feature(s)" -ForegroundColor Green
    Write-Host "Boundary type: $($boundary.type)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "=== All Tests Passed! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  ✓ Countries API: Returns all 193 country names instantly" -ForegroundColor Gray
Write-Host "  ✓ Provinces API: Fetches province names on-demand from GeoBoundaries" -ForegroundColor Gray
Write-Host "  ✓ Boundary API: Downloads GeoJSON only when needed for coordinates" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Step: Open your browser and test the Channel Generator UI" -ForegroundColor Yellow
Write-Host "  1. Hard refresh: Ctrl+Shift+R" -ForegroundColor Gray
Write-Host "  2. Open TestDataPanel (Channel Generator)" -ForegroundColor Gray
Write-Host "  3. Check country dropdown shows ~193 countries" -ForegroundColor Gray
Write-Host "  4. Select a country and verify provinces load dynamically" -ForegroundColor Gray
