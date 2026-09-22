@echo off
title GymPulse SaaS - Local Web App
cd /d "%~dp0"

REM Check if server is already running on port 8000
netstat -ano | findstr ":8000" >nul
if %errorlevel% neq 0 (
    if exist "venv\Scripts\pythonw.exe" (
        start "" "venv\Scripts\pythonw.exe" run.py --server
    ) else if exist "venv\Scripts\python.exe" (
        start "" "venv\Scripts\python.exe" run.py --server
    ) else (
        start "" pythonw run.py --server
    )
    timeout /t 2 /nobreak >nul
)

REM Open local website directly in default browser
start "" "http://localhost:8000"
exit
