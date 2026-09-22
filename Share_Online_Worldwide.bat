@echo off
title GymPulse SaaS - Worldwide Live Public Link
cd /d "%~dp0"

echo ===============================================================
echo  GymPulse SaaS - Worldwide Live Public Link
echo ===============================================================
echo.

REM Ensure server is running on 8000
netstat -ano | findstr ":8000" >nul
if %errorlevel% neq 0 (
    echo [1/2] Starting GymPulse background server...
    if exist "venv\Scripts\pythonw.exe" (
        start "" "venv\Scripts\pythonw.exe" run.py --server
    ) else if exist "venv\Scripts\python.exe" (
        start "" "venv\Scripts\python.exe" run.py --server
    ) else (
        start "" pythonw run.py --server
    )
    timeout /t 2 /nobreak >nul
) else (
    echo [1/2] GymPulse local server is running on port 8000.
)

echo [2/2] Connecting secure Cloudflare Edge Tunnel...
echo.
echo ===============================================================
echo  YOUR APP IS NOW ACCESSIBLE WORLDWIDE ON ANY DEVICE OR 5G!
echo  Check the https://...trycloudflare.com URL below:
echo ===============================================================
echo.

.\cloudflared.exe tunnel --url http://127.0.0.1:8000 --no-autoupdate
