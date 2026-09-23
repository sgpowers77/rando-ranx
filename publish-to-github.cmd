@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish-to-github.ps1"
if errorlevel 1 pause
exit /b %ERRORLEVEL%
