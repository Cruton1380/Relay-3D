# Chrome Cache Clearing Script for Relay Application
# This script helps clear Chrome's cache specifically for localhost development

Write-Host "🧹 Clearing Chrome Cache for Relay Development..." -ForegroundColor Cyan

# Close Chrome if running
Write-Host "📱 Closing Chrome processes..." -ForegroundColor Yellow
try {
    Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
} catch {
    Write-Host "   Chrome was not running" -ForegroundColor Gray
}

# Clear Chrome cache directories
$ChromeCachePaths = @(
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache\Cache_Data",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Service Worker\CacheStorage",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Application Cache"
)

foreach ($path in $ChromeCachePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Path "$path\*" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ Cleared: $path" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Could not clear: $path (Chrome may be running)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   📁 Path not found: $path" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🔄 Cache clearing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open Chrome in Incognito Mode (Ctrl+Shift+N)" -ForegroundColor White
Write-Host "   2. Navigate to: http://localhost:5174" -ForegroundColor White
Write-Host "   3. Or use Hard Refresh (Ctrl+Shift+R) in normal mode" -ForegroundColor White
Write-Host ""
Write-Host "🎯 The application should now work correctly in Chrome!" -ForegroundColor Green