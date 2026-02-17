@echo off
REM Quick launcher for Relay dev server (calls PowerShell script)
REM Double-click this file to start the server

cd /d "%~dp0"
pwsh -NoProfile -ExecutionPolicy Bypass -File "tools\dev-serve.ps1"

if errorlevel 1 (
    echo.
    echo Failed to start server. Press any key to exit...
    pause >nul
)
