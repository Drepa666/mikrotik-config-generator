@echo off
cd /d "%~dp0"
start /b python proxy.py
timeout /t 3 /nobreak >nul
start http://localhost:8080