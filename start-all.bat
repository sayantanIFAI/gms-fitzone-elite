@echo off
echo.
echo  =============================================
echo   FitZone Elite GMS - Starting All Services
echo  =============================================
echo.

echo  [1/3] Starting Data Server (port 3001)...
start "GMS Data Server" cmd /k "cd /d %~dp0data-server && node server.js"

timeout /t 2 /nobreak > nul

echo  [2/3] Starting AI Server (port 3002)...
start "GMS AI Server" cmd /k "cd /d %~dp0ai-server && node server.js"

timeout /t 2 /nobreak > nul

echo  [3/3] Starting Frontend (port 5173)...
start "GMS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak > nul

echo.
echo  All services starting...
echo  Open: http://localhost:5173
echo.
start http://localhost:5173
