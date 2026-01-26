@echo off
REM ============================================================================
REM                    RELAY NETWORK - ONE COMMAND STARTUP
REM ============================================================================
REM This script starts the entire Relay Network system with one command
REM ============================================================================

title Relay Network - One Command Startup

echo.
echo ========================================================================
echo                    RELAY NETWORK - ONE COMMAND STARTUP
echo ========================================================================
echo.
echo Starting the complete Relay Network system...
echo This will start backend, frontend, and open your browser automatically.
echo.

REM Change to script directory
cd /d "%~dp0"

echo Running: npm start
echo.

REM Start the system
npm start

echo.
echo System started! Check the terminal windows for backend and frontend logs.
echo.
pause
