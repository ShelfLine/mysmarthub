@echo off
title CyberSpecs Fleet Hardware Scanner
cd /d "%~dp0"
echo ==========================================================
echo       CYBERSPECS HARDWARE & DISK HEALTH SCANNER
echo ==========================================================
echo Scanning PC Hardware, Processor Generation, RAM & Disks...
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scan.ps1" %*
echo.
pause
