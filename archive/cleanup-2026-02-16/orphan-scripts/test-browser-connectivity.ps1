# Browser Connectivity Test Script
# This script helps diagnose browser-specific connectivity issues

Write-Host "🔍 Testing Browser Connectivity to Relay Application..." -ForegroundColor Cyan
Write-Host ""

# Test server connectivity
Write-Host "📡 Testing Server Connectivity..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5174" -Method Head -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Frontend Server (Port 5174): ACCESSIBLE" -ForegroundColor Green
    Write-Host "      Status Code: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Frontend Server (Port 5174): NOT ACCESSIBLE" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Gray
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002" -Method Head -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Backend Server (Port 3002): ACCESSIBLE" -ForegroundColor Green
    Write-Host "      Status Code: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Backend Server (Port 3002): NOT ACCESSIBLE" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Check listening ports
Write-Host "🔌 Checking Listening Ports..." -ForegroundColor Yellow
$ports = @(3002, 5174)
foreach ($port in $ports) {
    $listening = netstat -an | Select-String ":$port.*LISTENING"
    if ($listening) {
        Write-Host "   ✅ Port $port: LISTENING" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Port $port: NOT LISTENING" -ForegroundColor Red
    }
}

Write-Host ""

# Check Windows Firewall
Write-Host "🛡️ Checking Windows Firewall..." -ForegroundColor Yellow
try {
    $firewallStatus = Get-NetFirewallProfile | Where-Object {$_.Name -eq "Domain" -or $_.Name -eq "Private" -or $_.Name -eq "Public"} | Select-Object Name, Enabled
    foreach ($profile in $firewallStatus) {
        if ($profile.Enabled) {
            Write-Host "   ⚠️  Firewall Profile '$($profile.Name)': ENABLED" -ForegroundColor Yellow
        } else {
            Write-Host "   ✅ Firewall Profile '$($profile.Name)': DISABLED" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   ❓ Cannot check firewall status (may require admin privileges)" -ForegroundColor Gray
}

Write-Host ""

# Test with different URLs
Write-Host "🌐 Testing Different URL Formats..." -ForegroundColor Yellow
$urls = @(
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://0.0.0.0:5174"
)

foreach ($url in $urls) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 3 -ErrorAction Stop
        Write-Host "   ✅ $url : ACCESSIBLE" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $url : NOT ACCESSIBLE" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📋 Troubleshooting Steps for Browsers:" -ForegroundColor Cyan
Write-Host "   1. Try opening Chrome in Incognito Mode (Ctrl+Shift+N)" -ForegroundColor White
Write-Host "   2. Use Hard Refresh in browser (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "   3. Clear browser cache: npm run clean:chrome" -ForegroundColor White
Write-Host "   4. Try URL: http://127.0.0.1:5174" -ForegroundColor White
Write-Host "   5. Temporarily disable Windows Firewall for testing" -ForegroundColor White
Write-Host ""
Write-Host "🎯 If VS Code Simple Browser works but external browsers don't," -ForegroundColor Green
Write-Host "   this indicates a Windows Firewall or browser cache issue." -ForegroundColor Green