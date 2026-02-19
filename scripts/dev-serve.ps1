#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Relay Dev Server Launcher (Canonical)
    
.DESCRIPTION
    Single-source-of-truth dev server launcher.
    Always prints the correct URL to prevent "where do I open it?" confusion.
    
.PARAMETER Port
    Port to serve on (default: 8000)
    
.EXAMPLE
    .\scripts\dev-serve.ps1
    .\scripts\dev-serve.ps1 -Port 8001
#>

param(
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

# Resolve project root (one level up from scripts/)
$ScriptsDir = $PSScriptRoot
$ProjectRoot = Split-Path -Parent $ScriptsDir

# Change to project root
Push-Location $ProjectRoot

try {
    Write-Host ""
    Write-Host "🌍 Relay Dev Server" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📂 Serving from: " -NoNewline
    Write-Host $ProjectRoot -ForegroundColor Yellow
    Write-Host "🚀 URL: " -NoNewline
    Write-Host "http://localhost:$Port/relay-cesium-world.html" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Press Ctrl+C to stop" -ForegroundColor DarkGray
    Write-Host ""
    
    # Try Node.js server first (better CORS + logging)
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $ServerScript = Join-Path $ProjectRoot "scripts" "dev-server.mjs"
        if (Test-Path $ServerScript) {
            Write-Host "[Using Node.js server]" -ForegroundColor DarkGray
            $env:PORT = $Port
            & node $ServerScript
            exit $LASTEXITCODE
        }
    }
    
    # Fallback to Python
    if (Get-Command python -ErrorAction SilentlyContinue) {
        Write-Host "[Using Python HTTP server]" -ForegroundColor DarkGray
        & python -m http.server $Port
        exit $LASTEXITCODE
    }
    
    # No server available
    Write-Host "❌ ERROR: Neither Node.js nor Python found!" -ForegroundColor Red
    Write-Host "   Install Node.js: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "   Or Python: https://www.python.org/" -ForegroundColor Yellow
    exit 1
    
} finally {
    Pop-Location
}
