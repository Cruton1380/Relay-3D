@echo off
REM Relay Boundary Preview - Quick Start Script
REM This script starts both backend and frontend servers

echo ========================================
echo Relay Boundary Preview System
echo Week 2 Day 3 - Globe Integration
echo ========================================
echo.

REM Check if we're in the correct directory
if not exist "src\backend\server.mjs" (
    echo ERROR: Please run this script from the RelayCodeBaseV88 directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo [1/3] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo     ✓ Node.js found
echo.

echo [2/3] Starting Backend Server...
echo     Starting on TEST port 3003 (your main system uses 3002)...
echo     (This will open in a new window)
echo.
start "Relay Backend Server - BOUNDARY PREVIEW" cmd /k "set PORT=3003 && node src\backend\server.mjs"
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Server...
echo     Starting on TEST port 5173 (your main system uses 5175)...
echo     (This will open in a new window)
echo.
start "Relay Frontend Server - BOUNDARY PREVIEW" cmd /k "vite --port 5173 --strictPort"

echo.
echo ========================================
echo Servers Starting...
echo ========================================
echo.
echo BOUNDARY PREVIEW TEST SYSTEM:
echo   Backend:  http://localhost:3003
echo   Frontend: http://localhost:5173
echo.
echo YOUR MAIN SYSTEM (still available):
echo   Backend:  http://localhost:3002
echo   Frontend: http://localhost:5175
echo.
echo Both systems can run simultaneously!
echo.
echo Two new windows should have opened:
echo   1. Backend Server (Node.js) on port 3003
echo   2. Frontend Server (Vite) on port 5173
echo.
echo Wait for both servers to fully start, then:
echo   1. Open your browser to http://localhost:5173 (BOUNDARY PREVIEW)
echo   2. Your main system at http://localhost:5175 remains unchanged
echo   3. Look for boundary channels with map icon 🗺️
echo   4. Click "Preview on Globe" buttons to test
echo.
echo To stop servers: Close the server windows or press Ctrl+C
echo.
echo Documentation:
echo   - HOW-TO-ACCESS-BOUNDARY-PREVIEW.md
echo   - WEEK-2-DAY-3-SUMMARY.md
echo.
pause
